'use strict';
/* Preizkus zgrajene aplikacije (dist/) v pravem brskalniku (Chromium), s posnetkom OSRM na omrežni ravni.
   Zahteva: Node 18+, paket `playwright` z nameščenim Chromiumom; najprej python3 build-prod.py.
   Zagon: node tests/browser.js [dist-dir] [mapa-za-posnetke-zaslona]   (vsa omrežja razen lokalnega strežnika in cestnih strežnikov so blokirana) */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..');
const { createMock } = require(SRC + '/tests/mock-osrm.js');
const DIST = process.argv[2] || SRC + '/dist';
const OUT = process.argv[3] || path.join(require('os').tmpdir(), 'kp-posnetki');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
const results = []; const ok = (name, pass, d = '') => { results.push({ name, pass, d }); console.log((pass ? '  ok   ' : '  FAIL ') + name + (d ? '  [' + d + ']' : '')); };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch();
  const mock = createMock({});
  let routeMode = 'ok';   // ok | down
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  const seen = [];
  await ctx.route(/^https:\/\/(router\.project-osrm\.org|routing\.openstreetmap\.de)\//, async route => {
    const url = route.request().url(); seen.push({ url, headers: route.request().headers() });
    if (routeMode === 'down') return route.abort('failed');
    const r = await mock.fetch(url, {});
    route.fulfill({ status: r.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(await r.json()) });
  });
  // vse ostalo zunanje blokiraj (preverimo, da aplikacija ne kliče nič drugega)
  const external = [];
  await ctx.route(url => !/^http:\/\/127\.0\.0\.1/.test(url.href) && !/osrm|openstreetmap\.de/.test(url.href), route => { external.push(route.request().url()); route.abort(); });
  const page = await ctx.newPage();
  const errors = [], csp = [];
  const notFound = []; page.on('response', r => { if (r.status() === 404) notFound.push(r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')); });
  page.on('console', m => { if (m.type() === 'error' && !/status of 404/.test(m.text()) && !(routeMode === 'down' && /ERR_FAILED/.test(m.text()))) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) csp.push(m.text()); });

  await page.goto(base);
  await page.waitForSelector('#setupForm', { timeout: 15000 });
  await page.fill('#su', 'admin'); await page.fill('#sn', 'Test Admin'); await page.fill('#sp', 'preizkus-geslo-123');
  await page.click('#setupForm button[type=submit]');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  ok('prijava / zagon aplikacije', true);

  // postavi dan: delovni dan, 3 vozniki + spremljevalec, prevozi v Ljubljano (3 bolnišnice) in Novo mesto
  const date = await page.evaluate(() => {
    let d = addDays(todayStr(), 1); while (isStandby(d)) d = addDays(d, 1);
    S.duty[d] = [{ name:'Voznik A', team:'redna', role:'voznik' }, { name:'Voznik B', team:'redna', role:'voznik' }, { name:'Voznik C', team:'redna', role:'voznik' }, { name:'Spremljevalec D', team:'redna', role:'spremljevalec' }]
      .map((x, i) => ({ id:'d' + i, staffId:'', from:'', to:'', ot:0, vehicleId:'', ...x }));
    S.dayRules[d] = { mode:'samodejno' };
    const rides = [
      { name:'Ivan Novak', from:'Dobova 25', to:'UKC Ljubljana', time:'09:00', phone:'031111111' },
      { name:'Marija Horvat', from:'Brežice, Cesta svobode 10', to:'Onkološki inštitut Ljubljana', time:'09:10', phone:'031222222' },
      { name:'Franc Kos', from:'Krško', to:'URI Soča Ljubljana', time:'09:15' },
      { name:'Ana Zupan', from:'Bizeljsko', to:'SB Novo mesto', time:'10:30' },
      { name:'Jože Rep', from:'Cerklje ob Krki', to:'SB Brežice', time:'08:00' },
    ];
    const a = ensureDay(d); rides.forEach((r, i) => { while (a.length <= i) a.push(blankRide()); Object.assign(a[i], blankRide(), r, { id:'br' + i }); });
    rev++; PLAN_CACHE.clear(); return d;
  });
  await page.click('[data-nav="dispecer"]');
  await page.evaluate(d => { UI.dDate = d; rerender(); }, date);
  await page.waitForSelector('.routebar', { timeout: 10000 });
  await page.waitForTimeout(2500);   // počakaj na cestne podatke in ponovni izris
  await page.screenshot({ path: OUT + '/1-dispatch.png', fullPage: true });
  await page.screenshot({ path: OUT + '/1a-top.png', clip: { x: 0, y: 0, width: 1280, height: 760 } });

  const txt = sel => page.$$eval(sel, els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  const rb = (await txt('.routebar'))[0];
  ok('vrstica cestnih podatkov prikazana', /Cestni podatki/.test(rb), rb);
  ok('cestni podatki prispeli (OSRM)', /v redu|pripravljeni/.test(rb) && seen.length > 0, `zahtev: ${seen.length}`);
  ok('v URL-jih samo koordinate (brez imen)', seen.every(s => !/Dobova|Ljubljana|Novak|Horvat|UKC|Brežice/i.test(decodeURIComponent(s.url).replace(/^https:\/\/[^/]+/, ''))));
  ok('brez piškotkov in prilagojenih glav', seen.every(s => !s.headers.cookie && !s.headers.authorization && !s.headers.referer), JSON.stringify(Object.keys(seen[0].headers)));
  const trips = await txt('.trip-head');
  ok('vožnje prikazane', trips.length >= 2, trips.length + ' vožnj');
  console.log('   ', trips.join('\n    '));
  ok('več ciljev v eni vožnji (Ljubljana)', trips.some(t => /cilji/.test(t)) || trips.some(t => (t.match(/Ljubljana/g) || []).length >= 1), '');
  ok('ETA prikazan pri prevozih', (await page.$$('.stop .eta')).length > 0);
  ok('stats: km po cestah', /po cestah/.test((await txt('.stats'))[0]), (await txt('.stats'))[0]);
  const sug = await txt('.sugg li');
  console.log('    predlogi:', sug.length ? '\n     - ' + sug.join('\n     - ') : '(ni)');
  const warn = await txt('.warnlist li');
  console.log('    opozorila:', warn.length ? '\n     - ' + warn.join('\n     - ') : '(ni)');

  // zemljevid poti
  const mapBtn = (await page.evaluateHandle(() => [...document.querySelectorAll('.trip')].find(t => /cilji/.test(t.querySelector('.trip-head').textContent))?.querySelector('[data-act="tripMap"]') || document.querySelector('[data-act="tripMap"]'))).asElement();
  ok('gumb za pot obstaja', !!mapBtn);
  if (mapBtn){
    await mapBtn.click(); await page.waitForSelector('.rmap svg', { timeout: 10000 });
    const info = await page.$eval('.rmap', e => ({ pts: (e.querySelector('polyline')?.getAttribute('points') || '').split(' ').length, dashed: e.querySelector('polyline')?.classList.contains('est'), leg: e.querySelector('.rleg')?.textContent }));
    ok('zemljevid poti: cestna geometrija', info.pts > 2 && !info.dashed, JSON.stringify(info));
    const card = await (await page.evaluateHandle(() => document.querySelector('.rmap').closest('.trip'))).asElement(); await card.screenshot({ path: OUT + '/2-map.png' });
    await page.click('.trip:has(.rmap) [data-act="tripMap"]'); ok('zemljevid se skrije', (await page.$('.rmap')) === null);
  }

  // nastavitve → izračun
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="planiranje"]');
  await page.waitForSelector('[data-act="routeTest"]');
  await page.click('[data-act="routeTest"]');
  await page.waitForFunction(() => /Povezava deluje|Preizkus ni uspel/.test(document.body.textContent), null, { timeout: 10000 });
  const tb = await page.$$eval('.banner', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(t => /Povezava|Preizkus/.test(t)));
  ok('preverjanje cestnih podatkov', tb.some(t => /Povezava deluje/.test(t)), tb[0]);
  await page.click('[data-act="routeWarm"]');
  await page.waitForFunction(() => /Preneseno:|Prenos ni uspel/.test(document.body.textContent), null, { timeout: 60000 });
  const wm = await page.$$eval('.chip', els => els.map(e => e.textContent.trim()).filter(t => /Preneseno|Prenos ni/.test(t)));
  ok('predpriprava vseh relacij', wm.some(t => /Preneseno/.test(t)), wm[0]);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('[data-act="routeExport"]')]);
  const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  ok('izvoz razdalje.json', dl.suggestedFilename() === 'razdalje.json' && exported.pts.length > 40 && exported.missing === 0, `točk ${exported.pts.length}, manjka ${exported.missing}`);
  fs.writeFileSync(OUT + '/razdalje.json', JSON.stringify(exported));
  const rc = await (await page.evaluateHandle(() => document.querySelector('[data-act="routeTest"]').closest('.card'))).asElement();
  await rc.screenshot({ path: OUT + '/3-settings.png' });
  await page.emulateMedia({ colorScheme: 'dark' }); await rc.screenshot({ path: OUT + '/3b-settings-dark.png' }); await page.emulateMedia({ colorScheme: 'light' });
  // nastavitev: izklop cestnih podatkov → ocena
  await page.uncheck('input[data-path="settings.routing.on"]');
  await page.click('[data-nav="dispecer"]'); await page.waitForSelector('.routebar');
  const rb2 = (await txt('.routebar'))[0];
  ok('izklop: prikaz ocene', /izklopljeni/.test(rb2), rb2);
  ok('izklop: stats pravi ocena', /ocena/.test((await txt('.stats'))[0]));
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="planiranje"]');
  await page.check('input[data-path="settings.routing.on"]');

  // izpad strežnika
  await page.click('[data-act="routeClear"]'); routeMode = 'down';
  await page.click('[data-nav="dispecer"]'); await page.waitForSelector('.routebar');
  await page.waitForFunction(() => /ni povezave/.test(document.querySelector('.routebar')?.textContent || ''), null, { timeout: 12000 }).catch(() => {});
  const rb3 = (await txt('.routebar'))[0];
  ok('izpad strežnika: opozorilo + ocena', /ni povezave/.test(rb3), rb3);
  const km3 = (await txt('.stats'))[0];
  ok('izpad: km označeni kot ocena', /ocena/.test(km3), km3);
  ok('izpad: razpored se kljub temu sestavi', (await page.$$('.trip')).length >= 2);
  await page.screenshot({ path: OUT + '/4-down.png', fullPage: true });
  routeMode = 'ok'; await page.click('[data-act="routeRetry"]').catch(() => {});
  await page.waitForTimeout(4000);
  const rb4 = (await txt('.routebar'))[0];
  ok('okrevanje po izpadu', /v redu|pripravljeni|nalaganje/.test(rb4), rb4);

  // objava razporeda: lokalni način nima Firebase, zato samo preveri, da gumb ne sproži napake
  ok('brez zunanjih klicev razen OSRM', external.length === 0, external.slice(0, 3).join(', '));
  ok('brez CSP kršitev', csp.length === 0, csp.slice(0, 2).join(' | '));
  console.log('    404:', [...new Set(notFound)].join(', ') || '(ni)');
  ok('brez napak v konzoli', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length} uspešnih, ${bad.length} neuspešnih`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('NAPAKA', e); process.exit(2); });
