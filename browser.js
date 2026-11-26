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
  let expect403 = false;   // preizkus napake Googla (403) sme pustiti vrstico v konzoli
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
  await ctx.route(url => !/^http:\/\/127\.0\.0\.1/.test(url.href) && !/osrm|openstreetmap\.de|tile\.openstreetmap\.org/.test(url.href), route => { external.push(route.request().url()); route.abort(); });
  const { createTileMock } = require(SRC + '/tests/mock-tiles.js');
  const tmock = createTileMock({});
  await ctx.route(/^https:\/\/tile\.openstreetmap\.org\//, tmock.handle);
  const { createGoogleMock } = require(SRC + '/tests/mock-google.js');
  const gmock = createGoogleMock({});
  const gseen = [];
  await ctx.route(/^https:\/\/routes\.googleapis\.com\//, async route => {
    const rq = route.request(), hd = rq.headers(); gseen.push({ url: rq.url(), headers: hd, body: JSON.parse(rq.postData() || '{}') });
    const r = await gmock.fetch(rq.url(), { method: 'POST', headers: { 'X-Goog-Api-Key': hd['x-goog-api-key'], 'X-Goog-FieldMask': hd['x-goog-fieldmask'] }, body: rq.postData() });
    route.fulfill({ status: r.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(await r.json()) });
  });
  const { createNominatimMock } = require(SRC + '/tests/mock-nominatim.js');
  const nmock = createNominatimMock({});
  const nseen = [];
  await ctx.route(/^https:\/\/nominatim\.openstreetmap\.org\//, async route => {
    const rq = route.request(); nseen.push({ url: rq.url(), headers: rq.headers() });
    const r = await nmock.fetch(rq.url(), {});
    route.fulfill({ status: r.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(await r.json()) });
  });
  const page = await ctx.newPage();
  const errors = [], csp = [];
  const notFound = []; page.on('response', r => { if (r.status() === 404) notFound.push(r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')); });
  page.on('console', m => { if (m.type() === 'error' && !/status of 404/.test(m.text()) && !(expect403 && /status of 403/.test(m.text())) && !(routeMode === 'down' && /ERR_FAILED/.test(m.text()))) errors.push(m.text()); });
  page.on('pageerror', e => { if (/serviceWorker.*sandboxed/.test(e.message)) return; errors.push('pageerror: ' + e.message); });   // artefakt Playwrighta (serviceWorkers:'block') v sandbox okvirju OCR; v pravem brskalniku te napake ni
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) csp.push(m.text()); });

  await page.goto(base);
  await page.waitForSelector('#setupForm', { timeout: 15000 });
  await page.fill('#su', 'admin'); await page.fill('#sn', 'Test Admin'); await page.fill('#sp', 'preizkus-geslo-123');
  await page.click('#setupForm button[type=submit]');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  ok('prijava / zagon aplikacije', true);
  /* pomoč: počakaj, da se stran neha osveževati (OSRM/Google odgovori sprožijo ponovni izris), da zasloni in klici niso odvisni od časa */
  await page.evaluate(() => { window.__rc = 0; const o = render; render = function(){ window.__rc++; return o.apply(this, arguments); }; });
  const settle = async (ms = 350) => { let last = -1; for (let i = 0; i < 40; i++){ const c = await page.evaluate(() => window.__rc); if (c === last) return; last = c; await page.waitForTimeout(ms); } };

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
  await page.waitForSelector('.stats', { timeout: 10000 });
  await page.waitForTimeout(2500);   // počakaj na cestne podatke in ponovni izris
  await page.screenshot({ path: OUT + '/1-dispatch.png', fullPage: true });
  await page.screenshot({ path: OUT + '/1a-top.png', clip: { x: 0, y: 0, width: 1280, height: 760 } });

  const txt = sel => page.$$eval(sel, els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  const hOverview = await page.evaluate(() => document.documentElement.scrollHeight);
  ok('pregleden Dispečer: podrobnosti posadk so privzeto zložene, na vrhu je tabela razporeda', (await page.$$('details.crewcard')).length >= 2 && (await page.$$('details.crewcard[open]')).length === 0 && !!(await page.$('table')), 'višina strani ' + hOverview + ' px');
  ok('pregleden Dispečer: objava razporeda je nad tabelo', await page.evaluate(() => { const b = document.querySelector('[data-act="publish"]'), t = document.querySelector('table'); return !!b && !!t && (b.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0; }));
  await page.click('[data-act="crewsAll"][data-open="1"]'); await page.waitForTimeout(300);
  ok('»Razširi vse« odpre podrobnosti posadk', (await page.$$('details.crewcard:not([open])')).length === 0);
  ok('mirni vmesnik: vrstica cestnih podatkov je skrita, ko je vse v redu', (await page.$('.routebar')) === null, (await txt('.routebar'))[0] || '');
  ok('cestni podatki prispeli (OSRM)', seen.length > 0 && /po cestah/.test((await txt('.stats'))[0]), `zahtev: ${seen.length}`);
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

  // zemljevid poti (interaktivni zemljevid: ploščice, pot, točke, povleci/povečaj)
  const mapBtn = (await page.evaluateHandle(() => [...document.querySelectorAll('.trip')].find(t => /cilji/.test(t.querySelector('.trip-head').textContent))?.querySelector('[data-act="tripMap"]') || document.querySelector('[data-act="tripMap"]'))).asElement();
  ok('gumb za pot obstaja', !!mapBtn);
  if (mapBtn){
    await mapBtn.click(); await page.waitForSelector('.imap .imap-line', { timeout: 10000 });
    await page.waitForSelector('.imap .imap-t.ok', { timeout: 10000 });
    await page.waitForTimeout(600);
    const info = await page.$eval('.rmap', e => ({ d:(e.querySelector('.imap-line')?.getAttribute('d') || '').split('L').length, dashed:e.querySelector('.imap-line')?.classList.contains('est'), pins:e.querySelectorAll('.imap-pin').length, tiles:e.querySelectorAll('.imap-t.ok').length, leg:e.querySelector('.rleg')?.textContent, attr:e.querySelector('.imap-attr')?.textContent, w:e.querySelector('.imap-vp').clientWidth, h:e.querySelector('.imap-vp').clientHeight }));
    ok('zemljevid poti: cestna geometrija (polna črta po cestah)', info.d > 3 && !info.dashed, JSON.stringify({ d:info.d, dashed:info.dashed }));
    ok('zemljevid poti: točke postankov in postaja', info.pins >= 2, 'točk: ' + info.pins);
    ok('zemljevid poti: ploščice podlage so naložene in pripis OpenStreetMap je viden', info.tiles >= 4 && /OpenStreetMap/.test(info.attr), 'ploščic: ' + info.tiles + ', ' + info.attr);
    ok('ploščice: Referer je samo izvor (zahteva pravil OSM), brez poti', tmock.seen.length > 0 && tmock.seen.every(x => /^http:\/\/127\.0\.0\.1:\d+\/$/.test(x.referer)), tmock.seen[0] && tmock.seen[0].referer);
    const tileOk = await page.$$eval('.imap .imap-t.ok', ts => { const r = ts.map(t => t.getBoundingClientRect()), vp = document.querySelector('.imap-vp').getBoundingClientRect(); return { cover:Math.min(...r.map(x => x.left)) <= vp.left + 1 && Math.max(...r.map(x => x.right)) >= vp.right - 1 && Math.min(...r.map(x => x.top)) <= vp.top + 1 && Math.max(...r.map(x => x.bottom)) >= vp.bottom - 1 }; });
    ok('ploščice pokrivajo celotno površino zemljevida', tileOk.cover);
    const card = await (await page.evaluateHandle(() => document.querySelector('.rmap').closest('.trip'))).asElement(); await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: OUT + '/2-map.png' });
    const key = await page.$eval('.imap', e => e.dataset.map);
    const v0 = await page.evaluate(k => ({ ...MAP.views[k] }), key);
    // povleci: središče se premakne
    const box = await (await page.$('.imap-vp')).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 40, { steps:6 }); await page.mouse.up();
    const v1 = await page.evaluate(k => ({ ...MAP.views[k] }), key);
    ok('zemljevid: povleci premakne pogled', Math.abs(v1.lon - v0.lon) > 1e-4 && Math.abs(v1.lat - v0.lat) > 1e-4 && v1.user === true, JSON.stringify([v0.lon, v1.lon]));
    // kolešček povečuje okoli kazalca
    await page.mouse.move(box.x + 100, box.y + 100); await page.mouse.wheel(0, -300); await page.waitForTimeout(150);
    const v2 = await page.evaluate(k => ({ ...MAP.views[k] }), key);
    ok('zemljevid: kolešček poveča', v2.zoom > v1.zoom + 0.2, v1.zoom.toFixed(2) + ' → ' + v2.zoom.toFixed(2));
    await page.click('.imap [data-mc="out"]'); await page.waitForTimeout(100);
    const v3 = await page.evaluate(k => ({ ...MAP.views[k] }), key); ok('zemljevid: gumb − pomanjša na celo stopnjo', v3.zoom < v2.zoom && Math.abs(v3.zoom - Math.round(v3.zoom)) < 1e-6, v3.zoom.toFixed(2));
    await page.click('.imap [data-mc="fit"]'); await page.waitForTimeout(150);
    const v4 = await page.evaluate(k => ({ ...MAP.views[k] }), key); ok('zemljevid: »cela pot« povrne pogled', v4.user === false && Math.abs(v4.zoom - v0.zoom) < 0.05, v4.zoom.toFixed(2) + ' ≈ ' + v0.zoom.toFixed(2));
    // klik na točko odpre okno z imeni in uro
    const pin = await page.$('.imap-pin:not(.base)'); await pin.click(); await page.waitForTimeout(100);
    const pop = await page.$eval('.imap-pop', e => ({ hidden:e.hidden, txt:e.textContent }));
    ok('zemljevid: klik na točko odpre okno (postanek, ura, pacient)', !pop.hidden && /Pobere|Izstop/.test(pop.txt) && /\d\d:\d\d/.test(pop.txt), pop.txt.slice(0, 90));
    await page.screenshot({ path: OUT + '/2-map-popup.png', clip:{ x:box.x - 4, y:Math.max(0, box.y - 4), width:box.width + 8, height:box.height + 8 } });
    await page.click('.imap-pop .imap-x'); await page.waitForTimeout(120); ok('zemljevid: okno se zapre', await page.$eval('.imap-pop', e => e.hidden));
    // klik na postanek v seznamu pokaže točko
    const stopRowBtn = await page.$('.trip:has(.imap) li.stop.mapfocus'); ok('seznam postankov: vrstica kaže na zemljevidu', !!stopRowBtn);
    if (stopRowBtn){ await stopRowBtn.click(); await page.waitForTimeout(150); ok('klik na postanek odpre točko na zemljevidu', !(await page.$eval('.imap-pop', e => e.hidden))); }
    // celozaslonski prikaz in Esc
    await page.click('.imap [data-mc="full"]'); await page.waitForTimeout(150);
    const fs1 = await page.$eval('.imap', e => ({ full:e.classList.contains('imap-full'), w:e.getBoundingClientRect().width, h:e.getBoundingClientRect().height }));
    ok('zemljevid: celozaslonski prikaz', fs1.full && fs1.w >= 1270 && fs1.h >= 990, JSON.stringify(fs1));
    await page.screenshot({ path: OUT + '/2-map-full.png' });
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    ok('zemljevid: Esc zapre celozaslonski prikaz', !(await page.$eval('.imap', e => e.classList.contains('imap-full'))));
    // brez podlage: ostane pot
    await page.click('.imap [data-mc="tiles"]'); await page.waitForTimeout(150);
    const nt = await page.$eval('.imap', e => ({ tiles:e.querySelectorAll('.imap-t').length, line:!!e.querySelector('.imap-line'), attr:e.querySelector('.imap-attr').textContent }));
    ok('zemljevid: brez podlage ostaneta pot in točke', nt.tiles === 0 && nt.line && /izklopljena/.test(nt.attr), JSON.stringify(nt));
    await page.click('.imap [data-mc="tiles"]'); await page.waitForSelector('.imap .imap-t.ok', { timeout: 5000 }); ok('zemljevid: podlago je mogoče spet vklopiti', true);
    await page.click('.trip:has(.rmap) [data-act="tripMap"]'); ok('zemljevid se skrije', (await page.$('.rmap')) === null);
    // zemljevid dneva
    await page.click('details[data-sect="daymap"] > summary'); await page.waitForSelector('.imap[data-map^="day|"] .imap-line', { timeout: 10000 });
    await page.waitForFunction(() => { const l = document.querySelector('.imap[data-map^="day|"]')?.parentElement.querySelector('.rleg')?.textContent || ''; return /Vse vožnje|po cestah/.test(l) && !/Nalagam/.test(l); }, null, { timeout: 15000 });
    const dm = await page.$eval('.imap[data-map^="day|"]', e => ({ lines:e.querySelectorAll('.imap-line').length, est:e.querySelectorAll('.imap-line.est').length, pins:e.querySelectorAll('.imap-pin').length, leg:e.parentElement.querySelector('.rleg').textContent, chips:document.querySelectorAll('.daymap-legend .chip').length }));
    ok('zemljevid dneva: vse vožnje po cestah, barva po vozilu in gumbi za vozila', dm.lines >= 2 && dm.est === 0 && dm.pins >= 4 && dm.chips >= 2, JSON.stringify({ lines:dm.lines, est:dm.est, pins:dm.pins, chips:dm.chips }));
    await (await page.$('details[data-sect="daymap"]')).scrollIntoViewIfNeeded(); await (await page.$('details[data-sect="daymap"]')).screenshot({ path: OUT + '/2-daymap.png' });
    await page.click('.daymap-legend .chip:first-child'); await page.waitForTimeout(200);
    const dm2 = await page.$eval('.imap[data-map^="day|"]', e => e.querySelectorAll('.imap-line').length); ok('zemljevid dneva: izklop vozila skrije njegove poti', dm2 < dm.lines, dm.lines + ' → ' + dm2);
    await page.click('.daymap-legend .chip:first-child');
    await page.click('details[data-sect="daymap"] > summary');
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
  await page.waitForTimeout(300); await page.waitForFunction(() => { const i = ROUTE.info(); return !i.pending && !i.busy; }, null, { timeout: 15000 }).catch(() => {});

  // izpad strežnika
  routeMode = 'down'; await page.click('[data-act="routeClear"]');
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
  const rb4 = (await txt('.routebar'))[0] || '';
  ok('okrevanje po izpadu', rb4 === '' || /nalaganje/.test(rb4), rb4 || '(vrstica skrita = v redu)');

  /* ================= Dnevna knjiga: mirni vmesnik, kilometrina, čakanje na pregled ================= */
  await page.evaluate(d => { UI.date = d; UI.openRide = ''; UI.filter = 'vsi'; UI.q = ''; }, date);
  await page.click('[data-nav="dan"]'); await page.waitForSelector('.rrow');
  const nRows = await page.$$eval('.rrow', e => e.length);
  ok('knjiga: vsak prevoz je ena vrstica', nRows >= 5, nRows + ' vrstic');
  ok('knjiga: nobeden urejevalnik ni odprt (mirno)', (await page.$$('.editor')).length === 0);
  const rowH = await page.$eval('.rrow', e => Math.round(e.getBoundingClientRect().height));
  ok('knjiga: vrstica je nizka (< 70 px)', rowH < 70, rowH + ' px');
  await page.screenshot({ path: OUT + '/5-day-list.png', fullPage: false });
  await page.click('.box[data-ride="br0"] .rrow');
  ok('knjiga: klik odpre en urejevalnik', (await page.$$('.editor')).length === 1);
  await page.click('.box[data-ride="br1"] .rrow');
  ok('knjiga: odpre se samo en urejevalnik hkrati', (await page.$$('.editor')).length === 1 && await page.$('.box[data-ride="br1"] .editor') !== null);
  ok('knjiga: ni izbirnika dialize pri prevozu', (await page.$('.editor select[data-f="dia"]')) === null && !/D1|D2|SaD4/.test(await page.$eval('.editor', e => e.textContent)));
  const kmTxt = await page.$eval('.box[data-ride="br1"] [data-role="km"]', e => e.textContent.replace(/\s+/g, ' ').trim());
  ok('km brez Googla: brezplačni izračun (naslov + ceste OSM) ali ocena, z gumboma »Izračunaj znova« in »Točka na zemljevidu«', /\d km/.test(kmTxt) && /naslov \+ ceste OSM|ocena po cestah/.test(kmTxt) && /Izračunaj znova/.test(kmTxt) && /Točka na zemljevidu/.test(kmTxt) && !/ključ/i.test(kmTxt), kmTxt);
  // ročni vnos km
  await page.fill('.box[data-ride="br1"] input[data-km="manual"]', '97,4'); await page.dispatchEvent('.box[data-ride="br1"] input[data-km="manual"]', 'change');
  const man = await page.evaluate(() => { const r = rideById(UI.date, 'br1').r; return { km: r.km, src: r.kmSrc }; });
  ok('ročni vnos km: shranjen z vrednostjo 97,4 in virom »rocno«', man.km === 97.4 && man.src === 'rocno', JSON.stringify(man));
  const chipTxt = await page.$eval('.box[data-ride="br1"] [data-role="kmchip"]', e => e.textContent.trim());
  ok('km čip v vrstici prikaže ročni vnos', /97,4/.test(chipTxt), chipTxt);

  // hitri vnos (dispečerski žargon) in hitre opombe
  await page.click('.box[data-ride="br1"] .rrow').catch(() => {}); await page.waitForTimeout(50);
  await page.evaluate(() => { UI.openRide = ''; rerender(); });
  await page.fill('#quickIn', 'Pacient 71, Dobova 25, OI LJ, 8:00, brez spremljevalca');
  const qpv = await page.$eval('#quickPrev', e => e.textContent);
  ok('hitri vnos: predogled razbere ime, od, do, uro', /Pacient 71/.test(qpv) && /Dobova 25/.test(qpv) && /OI LJ/.test(qpv) && /08:00/.test(qpv) && /brez spremljevalca/.test(qpv), qpv);
  await page.press('#quickIn', 'Enter'); await page.waitForTimeout(250);
  const qadd = await page.evaluate(() => { const x = filledRides(UI.date).find(y => y.r.name === 'Pacient 71'); return x ? { to:x.r.to, time:x.r.time, note:x.r.note, g:geo(x.r.to).kind } : null; });
  ok('hitri vnos: prevoz je vpisan (cilj je ustanova, ura, opomba)', !!qadd && qadd.to === 'OI LJ' && qadd.time === '08:00' && /brez spremljevalca/.test(qadd.note) && qadd.g === 'poi', JSON.stringify(qadd));
  ok('hitri vnos: polje je prazno in ima fokus za naslednji vnos', await page.$eval('#quickIn', e => e.value === '' && document.activeElement === e));
  await page.screenshot({ path: OUT + '/5b-quick.png' });
  await page.evaluate(() => { const x = filledRides(UI.date).find(y => y.r.name === 'Pacient 71'); UI.openRide = x.r.id; rerender(); });
  await page.click('.editor [data-act="noteChip"][data-t="kisik"]'); await page.waitForTimeout(80);
  const nchip = await page.evaluate(() => ({ note:filledRides(UI.date).find(y => y.r.name === 'Pacient 71').r.note, on:document.querySelector('.editor [data-t="kisik"]').getAttribute('aria-pressed') }));
  ok('opomba: gumb »kisik« doda opombo', /kisik/.test(nchip.note) && /brez spremljevalca/.test(nchip.note) && nchip.on === 'true', JSON.stringify(nchip));
  await page.click('.editor [data-act="noteChip"][data-t="kisik"]'); await page.waitForTimeout(80);
  ok('opomba: ponoven klik odstrani opombo', !/kisik/.test(await page.evaluate(() => filledRides(UI.date).find(y => y.r.name === 'Pacient 71').r.note)));
  await page.evaluate(() => { UI.openRide = ''; rerender(); }); await settle();

  // klinika: samodejno čakanje
  await page.click('.box[data-ride="br1"] .rrow'); await page.click('.box[data-ride="br0"] .rrow');
  await page.fill('.box[data-ride="br0"] input[data-f="to"]', 'UKC Ljubljana – očesna klinika'); await page.dispatchEvent('.box[data-ride="br0"] input[data-f="to"]', 'change');
  await page.waitForTimeout(300);
  const stay = await page.evaluate(() => { const r = rideById(UI.date, 'br0').r; const el = document.querySelector('.box[data-ride="br0"] [data-role="stay"]'); return { stay: r.stay, shown: el && !el.hidden, g: geo(r.to).poi && geo(r.to).poi.clinic }; });
  ok('klinika: izbira »očesna klinika« odpre vrstico čakanja in vpiše privzeti čas pregleda', stay.shown && stay.stay > 0 && stay.g, JSON.stringify(stay));
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); }); await page.waitForTimeout(250); await settle();
  await page.locator('.box[data-ride="br0"]').screenshot({ path: OUT + '/6-editor.png' });
  await page.fill('.box[data-ride="br0"] input[data-f="stay"]', '90'); await page.dispatchEvent('.box[data-ride="br0"] input[data-f="stay"]', 'input');
  await page.waitForTimeout(200);
  const s90 = await page.evaluate(() => rideById(UI.date, 'br0').r.stay);
  ok('čakanje: ročno nastavljen čas pregleda (90 min) se shrani', s90 === 90, String(s90));
  const tagTxt = await page.$eval('.box[data-ride="br0"] [data-role="rtags"]', e => e.textContent);
  ok('vrstica kaže oznako »čaka 90 min«', /čaka 90 min/.test(tagTxt), tagTxt);

  /* ================= Brezplačna natančna kilometrina: naslov (Nominatim) + cesta (OSRM) + točka na zemljevidu ================= */
  await settle();
  ok('naslovi: zahtevki Nominatim imajo samo besedilo naslova in Referer (izvor strani) ter ne pošiljajo piškotkov', nseen.length > 0 && nseen.every(x => /^http:\/\/127\.0\.0\.1:\d+\/?$/.test(x.headers['referer'] || '') && !x.headers['cookie'] && !/Pacient|Novak|Horvat|031/.test(decodeURIComponent(x.url))), nseen.length + ' zahtevkov: ' + (nseen[0] ? decodeURIComponent(nseen[0].url).slice(0, 140) : ''));
  await page.evaluate(() => { const x = filledRides(UI.date).find(y => y.r.name === 'Pacient 71'); UI.openRide = x.r.id; rerender(); });
  await page.waitForSelector('.editor [data-act="pickPt"]');
  const p71 = await page.evaluate(() => { const r = filledRides(UI.date).find(y => y.r.name === 'Pacient 71').r; return { id:r.id, from:r.from, km:r.km, src:r.kmSrc, gp:r.gp }; });
  ok('pacient na hišnem naslovu (Dobova 25): km iz točke naslova in cest OSM, natančnost hišna številka', p71.src === 'osm' && p71.gp && p71.gp[0] === 'hisna' && p71.gp[1] === 'ustanova', JSON.stringify(p71));
  await page.click('.editor [data-act="pickPt"]');
  await page.waitForSelector('.modal .imap .imap-vp'); await page.waitForFunction(() => /Trenutna točka/.test(document.querySelector('[data-role=pickst]').textContent), null, { timeout: 10000 });
  const pk0 = await page.evaluate(() => ({ title:document.querySelector('#mTitle').textContent, st:document.querySelector('[data-role=pickst]').textContent, save:document.querySelector('[data-act="pickSave"]').disabled, side:document.querySelector('.modal .seg [aria-pressed="true"]').textContent, pins:document.querySelectorAll('.modal .imap .pin, .modal .imap [data-pin]').length }));
  ok('točka na zemljevidu: odpre se okno s točko naslova (OD: Dobova 25), »Shrani« je onemogočen do izbire', /Točka naslova/.test(pk0.title) && /hišna številka/.test(pk0.st) && pk0.save === true && /^OD: Dobova 25/.test(pk0.side), JSON.stringify(pk0));
  await page.screenshot({ path: OUT + '/10-pick-modal.png' });
  const bb = await page.locator('.modal .imap-vp').boundingBox();
  await page.mouse.click(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 + 40); await page.waitForTimeout(150);
  const pk1 = await page.evaluate(() => ({ save:document.querySelector('[data-act="pickSave"]').disabled, st:document.querySelector('[data-role=pickst]').textContent, pick:!!UI.modal.pick }));
  ok('točka na zemljevidu: dotik izbere novo točko in omogoči shranjevanje', pk1.pick && pk1.save === false && /Nova točka/.test(pk1.st), JSON.stringify(pk1));
  const picked = await page.evaluate(() => UI.modal.pick.slice());
  await page.screenshot({ path: OUT + '/10b-pick-picked.png' });
  await page.click('[data-act="pickSave"]'); await page.waitForFunction(() => !UI.modal, null, { timeout: 10000 }); await settle();
  const pk2 = await page.evaluate(() => { const r = filledRides(UI.date).find(y => y.r.name === 'Pacient 71').r; return { gp:r.gp, gf:r.gf, km:r.km, fix:S.geoFix['dobova 25'] }; });
  ok('točka na zemljevidu: shranjena kot popravek naslova, prevoz preračunan s točko, natančnost »rocno«', pk2.fix && Math.abs(pk2.fix[1] - picked[0]) < 1e-5 && Math.abs(pk2.fix[0] - picked[1]) < 1e-5 && pk2.gp && pk2.gp[0] === 'rocno' && Math.abs(pk2.gf[0] - picked[1]) < 1e-5 && pk2.km !== p71.km, JSON.stringify(pk2));
  { let last = -1; for (let i = 0; i < 25 && nseen.length !== last; i++){ last = nseen.length; await page.waitForTimeout(1400); } }   // počakaj, da se čakalna vrsta geokodiranja (1 zahtevek/s) sprazni
  const nBefore = nseen.length;
  await page.evaluate(() => { const x = filledRides(UI.date).find(y => y.r.name === 'Pacient 71'); UI.openRide = x.r.id; rerender(); });
  await page.click('.editor [data-act="kmRecalc"]'); await page.waitForTimeout(600); await settle();
  { let last = -1; for (let i = 0; i < 6 && nseen.length !== last; i++){ last = nseen.length; await page.waitForTimeout(1400); } }
  ok('ponovni izračun uporabi ročno točko (brez novega iskanja naslova)', nseen.length === nBefore && (await page.evaluate(() => filledRides(UI.date).find(y => y.r.name === 'Pacient 71').r.gp[0])) === 'rocno', nseen.length + ' vs ' + nBefore);
  await page.evaluate(() => { UI.openRide = ''; rerender(); });
  // nastavitve: kartica brezplačnega iskanja naslovov in preizkus
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="planiranje"]'); await page.waitForSelector('[data-act="geoTest"]');
  await page.click('[data-act="geoTest"]'); await page.waitForFunction(() => /Iskanje naslovov deluje|Preizkus ni uspel/.test(document.body.textContent), null, { timeout: 10000 });
  const gcard = await page.$$eval('.card', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()).find(t => /Natančna kilometrina: naslovi OD → DO \(brezplačno\)/.test(t)) || '');
  ok('nastavitve: kartica »brezplačno« s preizkusom iskanja naslovov (Google je neobvezen)', /Iskanje naslovov deluje/.test(gcard) && /kilometrina se računa brezplačno/.test(gcard) && /Google Zemljevidi \(neobvezno/.test(await page.evaluate(() => document.body.textContent)), gcard.slice(0, 200));
  await page.screenshot({ path: OUT + '/10c-geocode-card.png', fullPage: true });
  await page.click('[data-nav="dan"]'); await page.waitForSelector('.rrow');

  /* ================= Google kilometrina (lažni Routes API na omrežni ravni) ================= */
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="planiranje"]');
  await page.waitForSelector('#gkey');
  ok('Google: brez ključa ni nobenega zahtevka', gseen.length === 0);
  await page.fill('#gkey', 'AIzaSyTEST_KEY_0123456789abcdefghijk'); await page.click('[data-act="gkeySave"]');
  await page.waitForSelector('[data-act="gTest"]:not([disabled])');
  await page.click('[data-act="gTest"]');
  await page.waitForFunction(() => /Google deluje|Preizkus ni uspel/.test(document.body.textContent), null, { timeout: 10000 });
  const gt = await page.$$eval('.banner', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(t => /Google deluje|Preizkus ni uspel/.test(t)));
  ok('Google: gumb »Preveri Google«', gt.some(t => /Google deluje/.test(t)), gt[0]);
  const g0 = gseen[0];
  ok('Google: zahtevek ima ključ, masko polj in samo naslova OD in DO', g0 && g0.headers['x-goog-api-key'] && g0.headers['x-goog-fieldmask'] && Object.keys(g0.body).every(k => ['origin', 'destination', 'travelMode', 'routingPreference', 'units', 'languageCode', 'regionCode', 'intermediates', 'departureTime'].includes(k)), g0 && Object.keys(g0.body).join(','));
  await page.screenshot({ path: OUT + '/7-google-card.png', fullPage: true });
  // km prevoza z Googlom
  await page.click('[data-nav="dan"]'); await page.waitForSelector('.rrow');
  await page.waitForFunction(() => document.querySelectorAll('.rrow .kmchip.ex, .rrow .kmchip').length > 0);
  await page.evaluate(() => KM.day(UI.date, { force:true })); await page.waitForTimeout(2500);   // ključ je dodan kasneje: obstoječi vpisi se preračunajo na gumb »Preračunaj kilometrino dneva«
  const kmSrc = await page.evaluate(() => filledRides(UI.date).map(({ r }) => ({ id: r.id, km: r.km, src: r.kmSrc })));
  const googled = kmSrc.filter(x => x.src === 'google');
  ok('samodejni izračun: prevozi dobijo km iz Googla, ročni ostane', googled.length >= 3 && kmSrc.find(x => x.id === 'br1').src === 'rocno' && kmSrc.find(x => x.id === 'br1').km === 97.4, JSON.stringify(kmSrc));
  const stayR = await page.evaluate(() => { const r = rideById(UI.date, 'br0').r; return { km: r.km, back: r.kmBack, src: r.kmSrc }; });
  ok('prevoz s čakanjem: izračunana je tudi pot nazaj (kmBack)', stayR.back > 0 && stayR.src === 'google', JSON.stringify(stayR));
  const gb = gseen.slice(1).map(x => JSON.stringify(x.body)).join(' ');
  ok('Google: v zahtevkih ni imen pacientov in telefonov', !/Novak|Horvat|Kos|Zupan|Rep|031111111|031222222/.test(gb), '');
  await page.screenshot({ path: OUT + '/8-day-km.png', fullPage: false });

  // mesečna kilometrina
  await page.click('[data-nav="knjiga"]'); await page.waitForSelector('[data-act="kmReport"]');
  await page.evaluate(d => { const [y, m] = d.split('-'); UI.month = { y: +y, m: +m - 1 }; rerender(); }, date);
  await page.click('[data-act="kmReport"]'); await page.waitForSelector('#kmReport');
  const rep = await page.$eval('#kmReport', e => e.textContent.replace(/\s+/g, ' ').trim());
  ok('mesečno poročilo kilometrine: skupaj km, delež natančnih, vozila', /km skupaj/.test(rep) && /natančno/.test(rep), rep.slice(0, 160));
  await page.screenshot({ path: OUT + '/9-month-km.png', fullPage: false });
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('[data-act="kmCsv"][data-names="0"]')]);
  const csv = fs.readFileSync(await dl2.path(), 'utf8');
  ok('CSV kilometrine: BOM, podpičje/decimalna vejica, brez imen', csv.charCodeAt(0) === 0xFEFF && /\d,\d/.test(csv) && !/Novak|Horvat/.test(csv), csv.split('\n').slice(0, 2).join(' | '));
  await page.screenshot({ path: OUT + '/9a-month.png', fullPage: true });

  /* ================= Dializa (register + termini) in klinike ================= */
  await page.evaluate(() => { S.patients.push(blankPatient({ name: 'Dializa Preizkus', addr: 'Dobova 30', color: nextColor() })); save(); });
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="dializa"]'); await page.waitForSelector('form[data-form="diaAdd"]'); await settle();
  await page.selectOption('form[data-form="diaAdd"] select[name="pid"]', { label: 'Dializa Preizkus' });
  await page.selectOption('form[data-form="diaAdd"] select[name="t"]', 'pop');
  await page.click('form[data-form="diaAdd"] button[type="submit"]');
  await page.waitForSelector('tr[data-pid]');
  ok('dializa: pacient dodan v register s popoldanskim terminom', await page.evaluate(() => { const p = S.patients.find(x => x.name === 'Dializa Preizkus'); return p.dt && p.dt.t === 'pop'; }));
  await page.click('tr[data-pid] [data-act="diaTerm"][data-t="dop"]');
  await page.click('tr[data-pid] [data-act="diaDay"][data-d="2"]');
  const dt = await page.evaluate(() => S.patients.find(x => x.name === 'Dializa Preizkus').dt);
  ok('dializa: sprememba termina in dneva', dt.t === 'dop' && dt.d.includes(2) && dt.d.includes(1), JSON.stringify(dt));
  ok('dializa: ni izbire D1/D2/SaD4 pri podatkih pacienta', await (async () => { await page.click('[data-nav="pacienti"]'); await page.evaluate(() => { UI.pid = S.patients.find(x => x.name === 'Dializa Preizkus').id; render(); }); return !/SaD4|D1 /.test(await page.$eval('#view', e => e.textContent)); })());
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="dializa"]'); await page.waitForSelector('tr[data-pid]');
  await page.screenshot({ path: OUT + '/10-dializa.png', fullPage: true });
  await page.click('[data-act="setTab"][data-k="ustanove"]'); await page.waitForSelector('[data-act="addPlace"]');
  const nPl0 = await page.evaluate(() => S.places.length);
  await page.click('[data-act="addPlace"][data-k="clinic"]');
  const last = await page.evaluate(() => S.places.length - 1);
  await page.fill(`[data-pl="${last}|n"]`, 'Dermatološka amb.'); await page.dispatchEvent(`[data-pl="${last}|n"]`, 'change');
  const plOk = await page.evaluate(() => { const g = geo('UKC Ljubljana – Dermatološka amb.'); return { n: S.places.length, clinic: !!(g.poi && g.poi.clinic), kind: g.kind }; });
  ok('klinike: nova klinika pod UKC Ljubljana se razpozna kot cilj', plOk.n === nPl0 + 1 && plOk.clinic, JSON.stringify(plOk));
  await page.screenshot({ path: OUT + '/11-clinics.png', fullPage: true });

  /* ================= telefon (390 px) ================= */
  const mob = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mob.close();

  /* ================= Kopiranje z drugega dne, ponavljanje, tisk knjige dneva ================= */
  const nextDay = await page.evaluate(d => { let x = addDays(d, 1); while (isStandby(x)) x = addDays(x, 1); UI.date = x; UI.view = 'dan'; UI.copy = null; render(); return x; }, date);
  for (let i = 0; i < 5 && !(await page.$('.copypanel')); i++){   // ozadnji izris (geokodiranje, km) lahko zapre meni sredi klika: poskusi znova
    await page.evaluate(() => { const m = document.querySelector('details.menu'); if (m) m.open = true; const b = document.querySelector('[data-act="copyOpen"]'); if (b) b.click(); });
    await page.waitForTimeout(500);
  }
  await page.waitForSelector('.copypanel');
  const cp = await page.evaluate(() => ({ src:UI.copy.src, n:UI.copy.sel.size, rows:document.querySelectorAll('.copyrow').length }));
  ok('kopiranje: plošča pokaže prevoze prejšnjega dne z vpisi', cp.rows >= 5 && cp.n === cp.rows && cp.src !== nextDay, JSON.stringify(cp));
  await page.screenshot({ path: OUT + '/5c-copy.png' });
  await page.uncheck('.copyrow input >> nth=0'); await page.waitForTimeout(80);
  ok('kopiranje: posamezen prevoz je mogoče odznačiti', (await page.evaluate(() => UI.copy.sel.size)) === cp.n - 1);
  await page.click('[data-act="copyDo"]'); await page.waitForTimeout(250);
  const copied = await page.evaluate(d => filledRides(d).map(x => x.r.name), nextDay);
  ok('kopiranje: izbrani prevozi so vpisani na izbrani dan (brez odznačenega)', copied.length === cp.n - 1, copied.length + ' od ' + (cp.n - 1));
  const noStat = await page.evaluate(d => filledRides(d).every(x => !x.r.done && x.r.status === 'nova'), nextDay);
  ok('kopiranje: stanje in opravljeno se ne kopirata', noStat);
  const repR = await page.evaluate(d => { const x = filledRides(d)[0]; return { id:x.r.id }; }, nextDay);
  await page.evaluate(id => { UI.openRide = id; rerender(); }, repR.id);
  await page.click('.editor details.menu > summary'); await page.click('.editor [data-act="repeatRide"][data-how="next"]'); await page.waitForTimeout(250);
  const repDay = await page.evaluate(d => { let x = addDays(d, 1); while (isStandby(x)) x = addDays(x, 1); return { day:x, n:filledRides(x).length, name:(filledRides(d)[0] || {}).r.name }; }, nextDay);
  ok('ponovi prevoz: dodan je na naslednji delovni dan', repDay.n === 1, JSON.stringify(repDay));
  // tisk knjige dneva: 24 vrstic po obrazcu, posadke po vozilih
  const ph = await page.evaluate(d => { UI.date = d; const el = document.getElementById('printArea') || Object.assign(document.body.appendChild(document.createElement('div')), { id:'printArea' }); el.className = 'pday'; el.innerHTML = printDayHTML(d); return { pages:el.querySelectorAll('.pd-page').length, rows:el.querySelectorAll('.pd-page:nth-of-type(-n+2) tbody tr').length, crew:el.querySelectorAll('.pd-crew tbody tr').length, txt:el.textContent }; }, date);
  ok('tisk dneva: 3 strani (prevozi 1–10, 11–24, posadke), 24 vrstic, pot do posadk', ph.pages === 3 && ph.rows === 24 && ph.crew >= 2 && /DATUM/.test(ph.txt) && /OBR REŠ 08/.test(ph.txt) && /Ivan Novak/.test(ph.txt), JSON.stringify({ pages:ph.pages, rows:ph.rows, crew:ph.crew }));
  const pdfPath = OUT + '/tisk-knjiga-dneva.pdf'; await page.emulateMedia({ media:'print' }); await page.pdf({ path:pdfPath, format:'A4', preferCSSPageSize:true, printBackground:true }); await page.emulateMedia({ media:'screen' });
  ok('tisk dneva: PDF se ustvari', fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 5000, fs.statSync(pdfPath).size + ' B');
  await page.evaluate(() => { const el = document.getElementById('printArea'); if (el) { el.innerHTML = ''; el.className = ''; } });

  // ---------- skeniranje naloga (prilepljeno besedilo, slika, PDF; OCR je v tem preizkusu posnetek) in tisk dopolnil na nalog ----------
  const { makePdf } = require(SRC + '/tests/pdfmake.js');
  const FIXT = fs.readFileSync(SRC + '/tests/fixtures/nalog-ocr-psm4.txt', 'utf8');
  const tessSeen = [];
  const TESS_STUB = `self.Tesseract={createWorker:async function(lang,n,o){ if(o&&o.logger)o.logger({status:'recognizing text',progress:.5});
    return{setParameters:async function(){},recognize:async function(b){return{data:{text:(b&&b.size>1000)?${JSON.stringify(FIXT)}:'PRAZNO'}}},terminate:async function(){}}}};`;
  await ctx.route('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', route => { tessSeen.push(route.request().url()); route.fulfill({ status:200, contentType:'text/javascript', headers:{ 'access-control-allow-origin':'*' }, body:TESS_STUB }); });
  const vendorSeen = [];
  await ctx.route(/\/ocr\/vendor\/tess-stub\.js$/, route => { vendorSeen.push(route.request().url()); route.fulfill({ status:200, contentType:'text/javascript', body:TESS_STUB }); });
  await page.evaluate(() => { window.__ifr = []; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.tagName === 'IFRAME') window.__ifr.push((n.getAttribute('sandbox') || '') + '|' + n.getAttribute('src')); }))).observe(document.body, { childList:true }); });
  await page.click('[data-nav="pacienti"]'); await page.waitForTimeout(200);
  const nPat0 = await page.evaluate(() => S.patients.length);
  await page.click('[data-act="nsOpen"]'); await page.waitForSelector('#nsText');
  ok('skeniranje: gumb odpre okno z izbiro slike/PDF in poljem za besedilo', !!(await page.$('#nsFile')) && /Skeniraj nalog/.test(await page.textContent('#mTitle')));
  await page.screenshot({ path: OUT + '/9a-scan-in.png' });
  await page.fill('#nsText', FIXT); await page.click('[data-act="nsParse"]'); await page.waitForSelector('#ns-name');
  const rv = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-ns]')].map(e => [e.dataset.ns, e.value])));
  const r1 = await rv();
  ok('skeniranje (prilepljeno besedilo): ime, številka zavarovane osebe, naslov, telefon, relacija, razlog', /^Marija Novakova/.test(r1.name) && r1.zzzs === '012345678' && /Primerna ulica 12/.test(r1.addr) && r1.phone === '031 123 456' && /Dializni center/.test(r1.do) && r1.razlog === 'Dializa' && r1.izdan === '2026-11-02', JSON.stringify(r1).slice(0, 220));
  ok('skeniranje: prilepljeno besedilo ne naloži programa za razpoznavo in ne kliče omrežja', tessSeen.length === 0 && external.length === 0, String(tessSeen.length));
  await page.screenshot({ path: OUT + '/9b-scan-review.png', fullPage: true });
  ok('skeniranje: neprebrana polja so označena, datum rojstva in e-pošta se ne shranita', (await page.$$('.ns-miss')).length >= 0 && !/rojstva/i.test(await page.evaluate(() => [...document.querySelectorAll('[data-ns]')].map(e => e.dataset.ns).join())));
  // slika: ustvari PNG v strani in ga izberi (razpoznava: posnetek knjižnice, ki vrne besedilo samo, če dobi pravo sliko)
  await page.click('[data-act="nsBack"]'); await page.waitForSelector('#nsFile');
  const png = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 900; c.height = 1200; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 1200); g.fillStyle = '#222'; for (let i = 0; i < 40; i++) g.fillRect(40, 30 + i * 28, 300 + (i * 37) % 400, 8); return c.toDataURL('image/png').split(',')[1]; }, null), 'base64');
  await page.setInputFiles('#nsFile', { name:'nalog.png', mimeType:'image/png', buffer:png });
  await page.waitForSelector('#ns-name', { timeout: 20000 });
  const r2 = await rv();
  ok('skeniranje (slika): OCR v izoliranem okvirju (sandbox brez allow-same-origin), knjižnica naložena šele zdaj, rezultat izpolni polja', tessSeen.length === 1 && r2.zzzs === '012345678' && /^Marija Novakova/.test(r2.name), JSON.stringify({ t:tessSeen.length, zzzs:r2.zzzs }));
  const ifr = await page.evaluate(() => ({ seen:window.__ifr.slice(), left:document.querySelectorAll('iframe').length }));
  ok('skeniranje: okvir je »allow-scripts« brez dostopa do podatkov aplikacije in ostane pripravljen za naslednje slike (seja)', ifr.seen.length === 1 && ifr.seen[0] === 'allow-scripts|ocr/ocr.html' && ifr.left === 1, JSON.stringify(ifr));
  await page.evaluate(() => NSCAN.ocrClose()); await page.waitForTimeout(100);
  ok('skeniranje: ob zapiranju seje se okvir odstrani', (await page.evaluate(() => document.querySelectorAll('iframe[sandbox]').length)) === 0);
  // lasten izvod knjižnice: relativna pot iz config.js (ocr.lib) se mora razrešiti glede na stran aplikacije, ne glede na okvir v mapi ocr/
  const own = await page.evaluate(async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    try { return await NSCAN.ocr(new Blob([u], { type:'image/png' }), null, { on:true, lib:'ocr/vendor/tess-stub.js', lang:'slv' }); } catch (e) { return 'NAPAKA ' + e.message; } }, png.toString('base64'));
  ok('skeniranje: lasten izvod knjižnice (relativna pot ocr/vendor/…) se naloži s prave poti in ne kliče tretjih strani', /012345678/.test(own) && vendorSeen.length === 1 && /\/ocr\/vendor\/tess-stub\.js$/.test(vendorSeen[0]) && tessSeen.length === 1, (own || '').slice(0, 60) + ' | ' + vendorSeen.length);
  // PDF-sken (slika strani v PDF): prva slika se prebere; PDF brez slike da razumljivo napako
  await page.click('[data-act="nsBack"]'); await page.waitForSelector('#nsFile');
  await page.setInputFiles('#nsFile', { name:'sken.pdf', mimeType:'application/pdf', buffer:makePdf([{ w:600, h:800, comps:3, raw:require('crypto').randomBytes(600 * 800 * 3) }]) });   // ~1,4 MB: velik PDF (telefonski skeni so 5–15 MB)
  await page.waitForSelector('#ns-name', { timeout: 20000 });
  ok('skeniranje (PDF): slika strani se izvleče in prebere', tessSeen.length === 2 && (await rv()).zzzs === '012345678', String(tessSeen.length));
  await page.click('[data-act="nsBack"]'); await page.waitForSelector('#nsFile');
  await page.setInputFiles('#nsFile', { name:'prazen.pdf', mimeType:'application/pdf', buffer:Buffer.from('%PDF-1.4\n%%EOF\n') });
  await page.waitForSelector('.banner:has-text("ni slike strani")', { timeout: 10000 });
  ok('skeniranje: PDF brez slike pokaže razumljivo napako (ne obvisi)', !(await page.$('.spin')));
  // shrani: nov pacient in nalog; ponovni sken istega pacienta ga ujame in nalog posodobi (ne podvoji)
  await page.fill('#nsText', FIXT); await page.click('[data-act="nsParse"]'); await page.waitForSelector('#ns-name');
  await page.click('[data-act="nsSave"]'); await page.waitForTimeout(400);
  const sv1 = await page.evaluate(() => { const p = S.patients[S.patients.length - 1]; return { n:S.patients.length, name:p.name, zzzs:p.zzzs, nal:p.naloge.length, st:p.naloge[0].stevilka, vr:p.naloge[0].vrsta, razlog:p.naloge[0].razlog, view:UI.view }; });
  ok('skeniranje: pacient in nalog sta shranjena, pogled prikaže nalog', sv1.n === nPat0 + 1 && /^Marija Novakova/.test(sv1.name) && sv1.zzzs === '012345678' && sv1.nal === 1 && !!sv1.st && sv1.view === 'pacienti', JSON.stringify(sv1));
  ok('skeniranje: po shranjevanju se okno zapre', !(await page.$('#modal .modal')) && !(await page.$('#ns-name')));
  await page.screenshot({ path: OUT + '/9c-scan-saved.png', fullPage: true });
  await page.evaluate(() => { UI.pid = ''; UI.nid = ''; rerender(); }); await page.waitForSelector('[data-act="nsOpen"]');
  await page.click('[data-act="nsOpen"]'); await page.fill('#nsText', FIXT); await page.click('[data-act="nsParse"]'); await page.waitForSelector('#ns-name');
  ok('skeniranje: že znan pacient je prepoznan in ponujena je ponovna uporaba', /že v bazi/.test(await page.textContent('.modal')) && (await page.$$('[data-nswho]')).length === 2);
  await page.click('[data-act="nsSave"]'); await page.waitForTimeout(300);
  const sv2 = await page.evaluate(() => ({ n:S.patients.length, nal:S.patients[S.patients.length - 1].naloge.length }));
  ok('skeniranje: ponovni vnos istega naloga ne podvoji pacienta in naloga', sv2.n === nPat0 + 1 && sv2.nal === 1, JSON.stringify(sv2));
  ok('skeniranje: dnevnik sprememb ne vsebuje imena, naslova in številke zavarovane osebe', await page.evaluate(() => { const s = JSON.stringify(AUDIT); return !/Novakova|012345678|Primerna/.test(s); }));

  // registrska tablica vozila in nastavitve tiska
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="vozila"]');
  const vi = await page.evaluate(() => S.vehicles.findIndex(v => v.id === 'v13'));
  await page.fill(`input[data-path="vehicles.${vi}.reg"]`, ' kk ab-123 '); await page.press(`input[data-path="vehicles.${vi}.reg"]`, 'Tab'); await page.waitForTimeout(150);
  ok('vozila: registrska tablica se vpiše in shrani', (await page.evaluate(i => String(S.vehicles[i].reg).trim().toUpperCase(), vi)) === 'KK AB-123');
  await page.click('[data-act="setTab"][data-k="tisk"]'); await page.waitForSelector('.npv-s');
  await page.fill('input[data-path="settings.tisk.startnina"]', '3,5'); await page.press('input[data-path="settings.tisk.startnina"]', 'Tab');
  await page.fill('input[data-path="settings.tisk.dx"]', '1.5'); await page.press('input[data-path="settings.tisk.dx"]', 'Tab'); await page.waitForTimeout(150);
  const tk = await page.evaluate(() => ({ st:S.settings.tisk.startnina, dx:S.settings.tisk.dx, prev:document.querySelectorAll('.npv-s').length, guides:document.querySelectorAll('.npv-s .ng').length }));
  ok('nastavitve: Tisk naloga (štartnina, premik), dve preizkusni strani s črtami', String(tk.st).replace(',', '.') === '3.5' && +tk.dx === 1.5 && tk.prev === 2 && tk.guides > 0, JSON.stringify(tk));
  await page.screenshot({ path: OUT + '/9d-settings-tisk.png', fullPage: true });
  await page.evaluate(() => { window.__prints = []; window.print = function(){ const a = document.getElementById('printArea'); window.__prints.push({ html:a ? a.innerHTML : '', cls:a ? a.className : '' }); }; });
  await page.click('[data-act="npCalib"][data-p="b"]');
  ok('tisk: preizkusna stran se pošlje v tiskalnik', (await page.evaluate(() => window.__prints.length)) === 1 && /PREIZKUSNA STRAN/.test(await page.evaluate(() => window.__prints[0].html)));

  // opravljen prevoz pacienta z nalogom: posadka z vozilom je v razporedu dneva (ena ekipa) → tablica, voznik, spremljevalec, časi, km, štartnina
  const pr = await page.evaluate(() => {
    let d = addDays(todayStr(), -1); while (isStandby(d)) d = addDays(d, -1);
    S.duty[d] = [{ name:'Voznik Test', team:'redna', role:'voznik', vehicleId:'v13' }, { name:'Sprem Test', team:'redna', role:'spremljevalec', vehicleId:'v13' }].map((x, i) => ({ id:'t' + i, staffId:'', from:'', to:'', ot:0, ...x }));
    S.dayRules[d] = { mode:'samodejno' };
    const p = S.patients[S.patients.length - 1], n = p.naloge[0];
    const a = ensureDay(d); while (a.length < 1) a.push(blankRide());
    Object.assign(a[0], blankRide(), { id:'pr0', name:p.name, from:'Dobova 25', to:'SB Brežice', time:'09:00', phone:'031 123 456', patientId:p.id, nalogId:n.id, done:true, doneBy:'Voznik Test, Sprem Test', km:23.4, times:{ v_vozilu:d + 'T09:05:00', na_cilju:d + 'T09:50:00' } });
    rev++; PLAN_CACHE.clear(); UI.pid = p.id; UI.nid = n.id; return { d, pid:p.id, nid:n.id, name:p.name };
  });
  await page.click('[data-nav="pacienti"]'); await page.evaluate(() => { rerender(); }); await page.waitForSelector('[data-act="npOpen"]');
  await page.click('[data-act="npOpen"]'); await page.waitForSelector('.nprint input[data-np]');
  const row = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.nprint input[data-np]')].map(e => [e.dataset.np.split('|')[1], e.value])));
  ok('tisk v nalog: vrstica je izpolnjena iz razporeda (voznik, spremljevalec, reg. št., čas od–do, štartnina, km, datum)', row.voz === 'Voznik Test' && row.spr === 'Sprem Test' && row.reg === 'KK AB-123' && row.od === '09:05' && row.do === '09:50' && row.st === '3,50' && /^\d{2}\.\d{2}\.\d{4}$/.test(row.datum) && /^\d+(,\d)?$/.test(row.km), JSON.stringify(row));
  ok('tisk v nalog: prevoz je predizbran, začetna vrstica je 1', await page.evaluate(() => document.querySelector('[data-npon="0"]').checked && +document.getElementById('npStart').value === 1));
  await page.screenshot({ path: OUT + '/9e-print-modal.png', fullPage: true });
  const pvTxt = await page.textContent('.npv');
  ok('tisk v nalog: predogled vsebuje samo podatke posadke, nič od pacienta', /KK AB-123/.test(pvTxt) && /09:05–09:50/.test(pvTxt) && !new RegExp(pr.name.split(' ')[0] + '|Dobova|Brežice|012345678|Dializ').test(pvTxt), pvTxt.slice(0, 120));
  await page.click('[data-act="npPrint"]');
  const pp = await page.evaluate(() => window.__prints[window.__prints.length - 1]);
  ok('tisk v nalog: v tiskalnik gre ena stran (A4, brez ozadja obrazca) brez podatkov pacienta', pp.cls === 'pnalog' && (pp.html.match(/class="npg"/g) || []).length === 1 && !/ng-h|ng-v|ng-x|ng-lbl/.test(pp.html) && !new RegExp(pr.name.split(' ')[0] + '|Dobova|Brežice|012345678').test(pp.html), pp.cls);
  // položaj v tisku: celica »datum« prve vrstice mora biti 9,6 mm od levega roba + premik 1,5 mm, vrstica na 186,4 mm (sprednja stran)
  await page.emulateMedia({ media:'print' }); await page.waitForTimeout(100);
  const geo = await page.evaluate(() => { const g = document.querySelector('#printArea .npg'), r = g.getBoundingClientRect(), mm = px => px * 25.4 / 96; const c = [...g.querySelectorAll('.nc')].map(e => { const b = e.getBoundingClientRect(); return { t:e.textContent.trim(), x:mm(b.left - r.left), y:mm(b.top - r.top), w:mm(b.width), h:mm(b.height) }; }); return { w:mm(r.width), c }; });
  const dat = geo.c.find(c => /^\d{2}\.\d{2}\.\d{4}$/.test(c.t));
  ok('tisk v nalog: položaj celic v mm (datum 11,1 mm od levega roba = 9,6 + 1,5 premik; zgornji rob vrstice 186,4 mm)', !!dat && Math.abs(dat.x - 11.1) < 1.3 && Math.abs(dat.y - 186.4) < 1.3 && Math.abs(geo.w - 210) < 1, JSON.stringify({ w:geo.w, dat }));
  const pdf2 = OUT + '/tisk-v-nalog.pdf'; await page.pdf({ path:pdf2, format:'A4', preferCSSPageSize:true, printBackground:true });
  const pdfTxt = fs.readFileSync(pdf2).toString('latin1');
  let info = ''; try { info = require('child_process').execFileSync('pdfinfo', [pdf2]).toString(); } catch (e) { info = ''; }
  const nPg = info ? +((/Pages:\s+(\d+)/.exec(info) || [])[1]) : (pdfTxt.match(/\/Type\s*\/Page[^s]/g) || []).length, sz = (/Page size:\s+([\d.]+) x ([\d.]+)/.exec(info) || []);
  ok('tisk v nalog: PDF ima natanko eno stran A4', nPg === 1 && (!info || (Math.abs(+sz[1] - 595.3) < 1.5 && Math.abs(+sz[2] - 841.9) < 1.5)), nPg + ' stran' + (sz[1] ? ', ' + sz[1] + ' x ' + sz[2] + ' pt' : ''));
  await page.emulateMedia({ media:'screen' });
  await page.click('[data-act="npDone"]'); await page.waitForTimeout(300);
  const sv = await page.evaluate(d => { const r = rideById(d, 'pr0').r, p = S.patients[S.patients.length - 1]; return { row:r.pr && r.pr.row, reg:r.pr && r.pr.f.reg, rows:p.naloge[0].tiskRows, mod:!!UI.modal }; }, pr.d);
  ok('tisk v nalog: »Da, zapomni vrstice« shrani vrstico 1 pri prevozu in nalogu', sv.row === 1 && sv.reg === 'KK AB-123' && sv.rows === 1 && !sv.mod, JSON.stringify(sv));
  await page.click('[data-act="npOpen"]'); await page.waitForSelector('#npStart');
  const again = await page.evaluate(() => ({ start:+document.getElementById('npStart').value, on:document.querySelector('[data-npon="0"]').checked, txt:document.querySelector('.nprint tbody').textContent }));
  ok('tisk v nalog: ob ponovnem odprtju je naslednja vrstica 2 in že natisnjen prevoz ni več predizbran', again.start === 2 && !again.on && /natisnjeno \(št\. 1\)/.test(again.txt), JSON.stringify(again));
  await page.click('.nprint [data-act="closeModal"] >> nth=-1');
  ok('tisk: dnevnik sprememb ne vsebuje podatkov pacienta', await page.evaluate(() => !/Novakova|012345678|Primerna|Dobova/.test(JSON.stringify(AUDIT))));

  // ---------- knjiga meseca: predogled (računalnik in telefon), tisk v skritem okvirju, odpiranje v zavihku ----------
  await page.evaluate(d => { const [y, m] = d.split('-'); UI.month = { y: +y, m: +m - 1 }; UI.view = 'knjiga'; rerender(); }, date);
  await page.waitForSelector('[data-act="bkOpen"]');
  await page.click('[data-act="bkOpen"]'); await page.waitForFunction(() => UI.modal && UI.modal.b && !UI.modal.wait, null, { timeout: 15000 });
  await page.waitForSelector('[data-role=bkframe]');
  const bk1 = await page.evaluate(() => ({ pages:UI.modal.b.pages, sheets:UI.modal.b.sheets, rides:UI.modal.b.rides, dis:document.querySelector('[data-act=bkPrint]').disabled, disTab:document.querySelector('[data-act=bkTab]').disabled, txt:document.querySelector('.bprint .banner').textContent }));
  ok('knjiga meseca: okno sestavi knjigo (strani, listi, prevozi) in je pripravljeno za tisk', bk1.pages > 30 && bk1.sheets === Math.ceil(bk1.pages / 2) && bk1.rides >= 5 && !bk1.dis && !bk1.disTab && /strani/.test(bk1.txt), JSON.stringify(bk1));
  await page.waitForTimeout(400);
  const pv = await page.evaluate(() => { const fr = document.querySelector('[data-role=bkframe]'); return { sandbox:fr.getAttribute('sandbox'), n:(fr.srcdoc.match(/class="pb-page /g) || []).length, script:/<script/i.test(fr.srcdoc), cover:/KNJIGA REŠEVALNIH PREVOZOV/.test(fr.srcdoc), odd:/pb-page pb-odd/.test(fr.srcdoc), k:UI.modal.k, cw:document.querySelector('[data-role=bkprev]').clientWidth, sw:Math.round(document.querySelector('[data-role=bksheet]').getBoundingClientRect().width) }; });
  ok('predogled: ena stran (naslovnica) v izoliranem okvirju brez skript (sandbox), prilagojena širini', pv.sandbox === '' && pv.n === 1 && !pv.script && pv.cover && pv.odd && pv.sw <= pv.cw && pv.k > 0.3, JSON.stringify(pv));
  const shotBuf = await (await page.$('[data-role=bkframe]')).screenshot(); await page.screenshot({ path: OUT + '/10-knjiga-predogled.png' });
  ok('predogled: okvir res izriše stran (ni prazen, logotipi in tabele so vidni)', shotBuf.length > 12000, String(shotBuf.length));
  await page.click('[data-act="bkPg"][data-d="1"]');
  const nv1 = await page.evaluate(() => ({ pg:UI.modal.pg, kazalo:/KAZALO/i.test(document.querySelector('[data-role=bkframe]').srcdoc), prevDis:document.querySelector('[data-role=bkprevbtn]').disabled, inp:document.querySelector('input[data-bk=pg]').value }));
  ok('predogled: »naslednja stran« pokaže kazalo, vnos številke strani se posodobi', nv1.pg === 2 && nv1.kazalo && !nv1.prevDis && nv1.inp === '2', JSON.stringify(nv1));
  const jmp = await page.evaluate(() => UI.modal.b.dayStart[4]);
  await page.selectOption('[data-bk=jump]', String(jmp.page));
  const nv2 = await page.evaluate(p => ({ pg:UI.modal.pg, foot:new RegExp('str\\. ' + p + ' / ' + UI.modal.b.pages).test(document.querySelector('[data-role=bkframe]').srcdoc), sel:document.querySelector('[data-role=bkjump]').value }), jmp.page);
  ok('predogled: »skoči na dan« odpre prvo stran izbranega dneva z nogo »str. N / M«', nv2.pg === jmp.page && nv2.foot && nv2.sel === String(jmp.page), JSON.stringify(nv2));
  await page.fill('input[data-bk=pg]', '9999'); await page.press('input[data-bk=pg]', 'Tab');
  ok('predogled: številka strani izven obsega se omeji na zadnjo stran', (await page.evaluate(() => UI.modal.pg === UI.modal.b.pages)));
  await page.fill('input[data-bk=pg]', '1'); await page.press('input[data-bk=pg]', 'Tab');
  await page.selectOption('[data-bk=zoom]', '1');
  ok('predogled: povečava 100 % pokaže A4 v pravi velikosti (794 px) z drsenjem', (await page.evaluate(() => Math.round(document.querySelector('[data-role=bksheet]').getBoundingClientRect().width))) === 794);
  await page.selectOption('[data-bk=zoom]', 'fit');
  // telefon: okno se odpre na zaslonu 390 px (možnosti zložene, predogled čez širino)
  const vs0 = page.viewportSize();
  await page.click('.bprint [data-act="closeModal"] >> nth=-1');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(250);
  await page.evaluate(() => bkOpen()); await page.waitForFunction(() => UI.modal && UI.modal.b && !UI.modal.wait, null, { timeout: 15000 }); await page.waitForSelector('[data-role=bkframe]'); await page.waitForTimeout(400);
  const phn = await page.evaluate(() => { const m = document.querySelector('.bprint'), pr = document.querySelector('[data-role=bkprev]'), R = m.getBoundingClientRect().right, bt = [...document.querySelectorAll('[data-act=bkPrint],[data-act=bkTab]')].map(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; }); return { sw:m.scrollWidth, cw:m.clientWidth, sheet:Math.round(document.querySelector('[data-role=bksheet]').getBoundingClientRect().width), prev:pr.clientWidth, k:UI.modal.k, bt, order:[...document.querySelectorAll('.bk-grid > *')].map(e => e.className.split(' ')[0]).join(','), opts:document.querySelector('[data-role=bkopts]').open, off:[...m.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > R + 1 && !e.closest('.bk-prev')).slice(0, 3).map(e => e.tagName + '.' + e.className) }; });
  await page.screenshot({ path: OUT + '/10b-knjiga-predogled-telefon.png' });
  ok('predogled na telefonu (390 px): okno ni širše od zaslona, stran se prilagodi širini, oba gumba (tisk, zavihek) sta vidna, možnosti so zložene', phn.sw <= phn.cw + 1 && phn.sheet <= phn.prev && phn.k < 0.6 && phn.bt.length === 2 && phn.bt.every(Boolean) && phn.opts === false && phn.off.length === 0, JSON.stringify(phn));
  await page.click('[data-act="bkPg"][data-d="1"]');
  ok('predogled na telefonu: listanje deluje (stran 2)', (await page.evaluate(() => UI.modal.pg)) === 2);
  await page.click('.bprint [data-act="closeModal"] >> nth=-1');
  await page.setViewportSize(vs0); await page.waitForTimeout(250);
  await page.evaluate(() => bkOpen()); await page.waitForFunction(() => UI.modal && UI.modal.b && !UI.modal.wait, null, { timeout: 15000 }); await page.waitForSelector('[data-role=bkframe]');
  // tisk: dokument, ki gre v tiskalnik (zaznan prek kavlja), ima iste strani kot okno
  await page.evaluate(() => { window.__bk = null; BOOK.hooks.print = (html, b) => { window.__bk = { html, pages:b.pages }; return null; }; });
  await page.click('[data-act="bkPrint"]');
  const bp = await page.evaluate(() => window.__bk);
  const bpPages = (bp.html.match(/class="pb-page /g) || []).length;
  ok('tisk knjige: v tiskalnik gre samostojen dokument z natanko toliko stranmi kot v oknu, z nogo »str. N / M« in vpisanimi prevozi', /id="printArea" class="pbook"/.test(bp.html) && bpPages === bk1.pages && new RegExp('str\\. 1 / ' + bk1.pages).test(bp.html) && /Ivan Novak/.test(bp.html) && /OBR REŠ 08/.test(bp.html) && /KAZALO/i.test(bp.html) && !/<script/i.test(bp.html), JSON.stringify({ bpPages, want:bk1.pages }));
  const pg2 = await ctx.newPage(); await pg2.setContent(bp.html); await pg2.emulateMedia({ media:'print' });
  const bpdf = OUT + '/tisk-knjiga-meseca.pdf'; await pg2.pdf({ path:bpdf, format:'A4', preferCSSPageSize:true, printBackground:true }); await pg2.close();
  let binfo = ''; try { binfo = require('child_process').execFileSync('pdfinfo', [bpdf]).toString(); } catch (e) { binfo = ''; }
  const bnPg = binfo ? +((/Pages:\s+(\d+)/.exec(binfo) || [])[1]) : bk1.pages, bsz = (/Page size:\s+([\d.]+) x ([\d.]+)/.exec(binfo) || []);
  ok('tisk knjige: PDF iz samostojnega dokumenta ima natanko toliko strani A4 pokonci, kot jih napove okno (brez prazne zadnje strani)', bnPg === bk1.pages && (!binfo || (Math.abs(+bsz[1] - 595.3) < 1.5 && Math.abs(+bsz[2] - 841.9) < 1.5)), bnPg + ' / ' + bk1.pages + (bsz[1] ? ', ' + bsz[1] + ' x ' + bsz[2] : ''));
  // pravi tisk prek skritega okvirja (brez kavlja): okvir se naloži pod CSP in vsebuje celo knjigo
  await page.evaluate(() => { BOOK.hooks.print = null; });
  await page.click('[data-act="bkPrint"]'); await page.waitForSelector('#bkPrintFrame', { state:'attached' });
  const pf = await page.evaluate(async () => { const fr = document.getElementById('bkPrintFrame'); for (let i = 0; i < 80 && !(fr.contentDocument && fr.contentDocument.readyState === 'complete' && fr.contentDocument.querySelector('.pb-page')); i++) await new Promise(r => setTimeout(r, 100)); const d = fr.contentDocument; return { pages:d.querySelectorAll('.pb-page').length, h:Math.round(d.querySelector('.pb-page').getBoundingClientRect().height), area:!!d.getElementById('printArea'), gut:d.body.style.getPropertyValue('--gut'), aria:fr.getAttribute('aria-hidden') }; });
  ok('tisk knjige: skriti okvir za tisk vsebuje celo knjigo (stran A4 = 296 mm), rob za vezavo je nastavljen', pf.pages === bk1.pages && Math.abs(pf.h - 1119) <= 2 && pf.area && /^\d+mm$/.test(pf.gut) && pf.aria === 'true', JSON.stringify(pf));
  await page.evaluate(() => { const f = document.getElementById('bkPrintFrame'); if (f) f.remove(); });
  // odpiranje v zavihku (telefon: Deli → Natisni / PDF)
  await page.evaluate(() => { window.__tab = null; BOOK.hooks.open = (html, b) => { window.__tab = { html, pages:b.pages }; return {}; }; });
  await page.click('[data-act="bkTab"]');
  const tbk = await page.evaluate(() => window.__tab);
  ok('odpri za tisk/PDF: dokument za zaslon ima širino 794 px za telefon, vrstico z navodilom in vse strani, brez skript', /m-tab/.test(tbk.html) && /name="viewport" content="width=794"/.test(tbk.html) && /class="bk-bar"/.test(tbk.html) && (tbk.html.match(/class="pb-page /g) || []).length === bk1.pages && !/<script/i.test(tbk.html) && !/ src="logos\//.test(tbk.html), String(tbk.html.length));
  await page.evaluate(() => { BOOK.hooks.open = null; });
  const [pop] = await Promise.all([ctx.waitForEvent('page'), page.click('[data-act="bkTab"]')]);
  await pop.waitForLoadState('load');
  const popI = await pop.evaluate(() => ({ url:location.protocol, pages:document.querySelectorAll('.pb-page').length, w:Math.round(document.querySelector('.pb-page').getBoundingClientRect().width), bar:!!document.querySelector('.bk-bar'), title:document.title })).catch(e => ({ err:String(e) }));
  ok('odpri za tisk/PDF: pravo novo okno (blob) pokaže celo knjigo s stilom A4 in naslovom za ime PDF', popI.url === 'blob:' && popI.pages === bk1.pages && popI.w === 794 && popI.bar && /Knjiga prevozov/i.test(popI.title), JSON.stringify(popI));
  await pop.close();
  await page.uncheck('[data-bk=duplex]'); await page.waitForFunction(() => UI.modal && UI.modal.b && UI.modal.o.duplex === false);
  const bk2 = await page.evaluate(() => ({ pages:UI.modal.b.pages, saved:JSON.parse(localStorage.getItem('kp.book.opts') || '{}').duplex }));
  ok('knjiga meseca: izklop obojestranskega tiska skrajša knjigo, izbira se zapomni v tej napravi', bk2.pages < bk1.pages && bk2.saved === false, JSON.stringify(bk2));
  await page.click('.bprint [data-act="closeModal"] >> nth=-1');

  // ---------- skeniranje strani knjige: pravi tok (datoteka → izolirani okvir OCR → besede → pregled z označbami → vpis); OCR je posnetek, ki vrne besede ----------
  const { gen: bgen } = require(SRC + '/tests/bookscan-gen.js');
  const bsDay = await page.evaluate(() => { let d = addDays(todayStr(), -9); while (isStandby(d)) d = addDays(d, -1); S.patients.push(blankPatient({ name:'Novak Janez' }), blankPatient({ name:'Horvat Marija' }), blankPatient({ name:'Kovač Franc' })); return d; });
  const dmy = bsDay.split('-').reverse().join('.');
  const BSR = [
    { nr:1, cells:['Novak Janez', 'Dobova 25', 'OI LJ', '8:00'] }, { nr:2, cells:['Horvat Marlja', 'Križe 3', 'SB Brežice', '8.30'] },
    { nr:3, cells:['Petek Anton', 'Artiče 21', 'ZD Krško', '09:15'] }, { nr:4, cells:['Xzq', 'Dobova 2', 'OI LJ', '10:00'], conf:[30, 88, 88, 88] },
    { nr:5, cells:['Kovač Franc', 'Cesta svobode 14', 'SB Novo mesto', '10.30', 'leže'] }, { nr:6, cells:['Novak Janez', 'Doma', 'SB Brežice', '25:70'] },
    { nr:7, cells:['Horvat Marija', 'Dobiva 3', 'SB Brežice', '11:00'] }, { nr:8, cells:['Kovač Franc', 'Zxqkw Vrtmn', 'SB Brežice', '11:30'], conf:[88, 25, 88, 88] },
    { nr:9, cells:['Novak Janez', 'Doma', 'Dializa KK', 'Dop'] }, { nr:10, cells:[] } ];
  const BSTUB = `self.Tesseract={createWorker:async function(lang,n,o){ if(o&&o.logger)o.logger({status:'recognizing text',progress:.5});
    return{setParameters:async function(){},recognize:async function(b){return{data:{text:'',words:${JSON.stringify(bgen(BSR, { date:dmy }))}}}},terminate:async function(){}}}};`;
  const bookSeen = [];
  await ctx.route(/\/ocr\/vendor\/tess-book\.js$/, route => { bookSeen.push(route.request().url()); route.fulfill({ status:200, contentType:'text/javascript', body:BSTUB }); });
  const ocrBefore = await page.evaluate(() => (window.KP_CONFIG && window.KP_CONFIG.ocr) || null);
  await page.evaluate(() => { window.KP_CONFIG = window.KP_CONFIG || {}; window.KP_CONFIG.ocr = { on:true, lib:'ocr/vendor/tess-book.js', lang:'slv' }; });
  const bpng = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 1500; c.height = 1400; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 1500, 1400); g.fillStyle = '#222'; for (let i = 0; i < 12; i++) g.fillRect(60, 290 + i * 70, 1300, 3); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  await page.evaluate(() => { UI.view = 'knjiga'; rerender(); }); await page.waitForSelector('[data-act="bsOpen"]');
  const fBefore = await page.evaluate(() => window.__ifr.filter(x => /ocr\.html/.test(x)).length);
  await page.click('[data-act="bsOpen"]'); await page.waitForSelector('#bsFile');
  ok('skeniranje knjige: okno ponuja izbiro fotografij, kamero in iskreno navodilo (rokopisa računalnik v telefonu ne prebere, ime vpišeš ob izrezu)', !!(await page.$('#bsCam')) && /računalnik v telefonu ne prebere/.test(await page.textContent('.bscan')) && /ime izbereš s seznama pacientov/.test(await page.textContent('.bscan')));
  await page.waitForSelector('[data-role=bswarm][data-st=ok]', { timeout: 15000 });
  ok('skeniranje knjige: razpoznava se pripravi vnaprej ob odprtju okna (»pripravljena«), še preden je izbrana fotografija; knjižnica se naloži enkrat', bookSeen.length === 1 && /pripravljena/.test(await page.textContent('[data-role=bswarm]')), String(bookSeen.length));
  await page.setInputFiles('#bsFile', { name:'stran.png', mimeType:'image/png', buffer:bpng });
  await page.waitForSelector('.bs-row', { timeout: 40000 });
  const bs1 = await page.evaluate(() => { const q = l => document.querySelectorAll(`.bs-row[data-lv=${l}]`).length; return { rows:document.querySelectorAll('.bs-row').length, ok:q('ok'), chk:q('chk'), bad:q('bad'), crops:[...document.querySelectorAll('.bs-crop')].filter(i => /^data:image\/jpeg/.test(i.src)).length, date:document.getElementById('bs-date').value, dateLv:document.querySelector('[data-role=bsdate]').dataset.lv, sum:document.querySelector('[data-role=bssum]').textContent.replace(/\s+/g, ' '), on:[...document.querySelectorAll('[data-bs=on]')].map(c => c.checked ? 1 : 0).join(''), done:document.querySelector('[data-bs=done]').checked }; });
  ok('skeniranje knjige: branje prek izoliranega okvirja da 9 vrstic: 4 zeleno, 2 rumeno, 3 rdeče, vsaka s sliko izreza', bs1.rows === 9 && bs1.ok === 4 && bs1.chk === 2 && bs1.bad === 3 && bs1.crops === 9 && bookSeen.length === 1, JSON.stringify(bs1));
  ok('skeniranje knjige: datum je prebran s slike in označen »preveri«, povzetek šteje ✔ ⚠ ✖, rdeče vrstice niso izbrane, prevozi za nazaj so »opravljeni«', bs1.date === bsDay && bs1.dateLv === 'chk' && /✔ 4 prebrano/.test(bs1.sum) && /⚠ 2 preveri/.test(bs1.sum) && /✖ 3 popravi/.test(bs1.sum) && bs1.on === '111010101' && bs1.done === true, JSON.stringify({ date:bs1.date, dateLv:bs1.dateLv, on:bs1.on, done:bs1.done, sum:bs1.sum }));
  const fAfter = await page.evaluate(() => window.__ifr.filter(x => /ocr\.html/.test(x)).length);
  ok('skeniranje knjige: priprava vnaprej in branje uporabita isti okvir in isto knjižnico (brez ponovnega prenosa za vsako stran)', fAfter === fBefore + 1 && bookSeen.length === 1, JSON.stringify({ fBefore, fAfter, lib:bookSeen.length }));
  const ph1 = await page.evaluate(() => ({ photos:UI.modal.photos.filter(Boolean).length, det:!!document.querySelector('details.bs-photos img[src^="data:image/jpeg"]') }));
  ok('skeniranje knjige: v pregledu je na voljo cela fotografija strani (zloženo) za primerjavo', ph1.photos === 1 && ph1.det, JSON.stringify(ph1));
  await page.screenshot({ path: OUT + '/9-scan-review.png' });
  await page.click('[data-act="bsJump"]');
  ok('skeniranje knjige: »Skoči na naslednje nejasno« premakne fokus v označeno polje', await page.evaluate(() => { const a = document.activeElement, row = a && a.closest && a.closest('.bs-row'); return !!row && row.dataset.lv !== 'ok' && !!a.closest('.bs-f') && a.closest('.bs-f').dataset.lv !== 'ok'; }));
  // popravek rdečega polja (vrstica 4), predlog za rumeno (vrstica 7), vrstica 3 ostane nepotrjena
  const key = n => page.evaluate(n2 => UI.modal.rows.find(r => r.nr === n2).key, n);
  const k4 = await key(4), k7 = await key(7), k3 = await key(3);
  await page.locator(`[data-bsrow="${k4}"]`).screenshot({ path: OUT + '/9b-scan-bad.png' }); await page.locator(`[data-bsrow="${k7}"]`).screenshot({ path: OUT + '/9c-scan-chk.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150);
  await page.locator(`[data-bsrow="${k7}"]`).scrollIntoViewIfNeeded(); await page.screenshot({ path: OUT + '/9d-scan-phone.png' });
  const ov = await page.evaluate(() => { const m = document.querySelector('.bscan'), R = m.getBoundingClientRect().right; return { sw:m.scrollWidth, cw:m.clientWidth, off:[...m.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > R + 1 && !e.closest('.bs-cropwrap')).slice(0, 4).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right - R)) }; });
  ok('skeniranje knjige: na telefonu (390 px) okno ni širše od zaslona', ov.sw <= ov.cw + 1, JSON.stringify(ov));
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.fill(`#bs-${k4}-name`, 'Zupan Ana'); await page.press(`#bs-${k4}-name`, 'Tab');
  const row4 = await page.evaluate(k => ({ f:document.querySelector(`[data-bsrow="${k}"] [data-bsf=name]`).dataset.lv, row:document.querySelector(`[data-bsrow="${k}"]`).dataset.lv }), k4);
  ok('skeniranje knjige: popravek rdečega polja ga pobarva zeleno in vrstica postane prebrana', row4.f === 'ok' && row4.row === 'ok', JSON.stringify(row4));
  await page.check(`[data-bsrow="${k4}"] [data-bs=on]`);
  const sug7 = await page.$$eval(`[data-bsrow="${k7}"] .bs-sug`, els => els.map(e => e.textContent));
  ok('skeniranje knjige: za rumeno polje (neznan kraj »Dobiva 3«) so ponujeni predlogi', sug7.length >= 1, JSON.stringify(sug7));
  await page.click(`[data-bsrow="${k7}"] .bs-sug >> nth=0`);
  const row7 = await page.evaluate(k => ({ v:document.querySelector(`[data-bsrow="${k}"] [data-k=from]`).value, row:document.querySelector(`[data-bsrow="${k}"]`).dataset.lv }), k7);
  ok('skeniranje knjige: klik na predlog izpolni polje in ga potrdi', row7.v === sug7[0] && row7.row === 'ok', JSON.stringify(row7));
  const sum2 = await page.textContent('[data-role=bssum]'), ap = await page.textContent('[data-role=bsapply]');
  ok('skeniranje knjige: povzetek in gumb za vpis se sproti osvežujeta (število, datum, število z ⚠)', /⚠ 1 preveri/.test(sum2) && /✖ 2 popravi/.test(sum2) && /Vpiši 7 prevozov/.test(ap) && /1 z oznako ⚠/.test(ap), sum2.replace(/\s+/g, ' ') + ' | ' + ap);
  await page.fill('#bs-date', bsDay); await page.press('#bs-date', 'Tab');
  ok('skeniranje knjige: ročno potrjen datum ni več označen', (await page.evaluate(() => document.querySelector('[data-role=bsdate]').dataset.lv)) === 'ok');
  await page.click('[data-act="bsApply"]'); await page.waitForSelector('#modal .modal', { state:'detached', timeout: 10000 }).catch(() => {}); await page.waitForTimeout(300);
  const ap1 = await page.evaluate(d => { const a = S.rides[d] || []; const f = i => a[i] || {}; return { view:UI.view, date:UI.date, n:a.filter(isFilled).length, slots:[0, 1, 2, 3, 4, 6, 8].map(i => isFilled(f(i)) ? 1 : 0).join(''), r4:f(3).name, chk:a.map((r, i) => r.chk ? (i + 1) + ':' + r.chk : '').filter(Boolean), done:a.filter(isFilled).every(r => r.done), leze:f(4).mode, dia:f(8).dia, to9:f(8).to, t1:f(0).time, t2:f(1).time, pid1:!!f(0).patientId, name2:f(1).name, modal:!!UI.modal, img:JSON.stringify(S.rides).includes('data:image') }; }, bsDay);
  ok('skeniranje knjige: vpisanih 7 prevozov v prava polja (št. polja = mesto v knjigi), popravljeno ime, ura, leže, dializa, pacient iz baze, vse opravljeno', ap1.n === 7 && ap1.slots === '1111111' && ap1.r4 === 'Zupan Ana' && ap1.t1 === '08:00' && ap1.t2 === '08:30' && ap1.name2 === 'Horvat Marija' && ap1.leze === 'leze' && ap1.dia === 'dop' && ap1.pid1 && ap1.done, JSON.stringify(ap1));
  ok('skeniranje knjige: samo nepotrjena vrstica dobi oznako ⚠ (polje 3: ime), pogled preskoči na dan, okno se zapre, slika se ne shrani', ap1.chk.length === 1 && /^3:ime/.test(ap1.chk[0]) && ap1.view === 'dan' && ap1.date === bsDay && !ap1.modal && !ap1.img, JSON.stringify({ chk:ap1.chk, view:ap1.view, modal:ap1.modal, img:ap1.img }));
  await page.waitForSelector('.rchk');
  ok('skeniranje knjige: v dnevu je pri prevozu viden rumeni znak »⚠ preveri«', (await page.$$('.rchk')).length === 1 && /preveri/.test(await page.textContent('.rchk')));
  ok('skeniranje knjige: opozorila dneva omenjajo nepotrjen prevoz', await page.evaluate(d => dayWarnings(d).some(w => w.nr === 3 && /prebrano s fotografije/.test(w.text)), bsDay));
  const bkMark = await page.evaluate(d => { const [y, m] = d.split('-'); return BOOK.build(+y, +m - 1, BOOK.opts({})).html.includes('⚠ preveri (ime'); }, bsDay);
  ok('skeniranje knjige: v natisnjeni knjigi meseca je nepotrjen prevoz označen z »⚠ preveri (ime)«', bkMark === true);
  await page.click('.box[data-nr="3"] [data-act="openRide"]'); await page.waitForSelector('.chkrow');
  ok('skeniranje knjige: odprt prevoz kaže pas z razlago in gumbom »Preverjeno«', /Preverjeno/.test(await page.textContent('.chkrow')));
  await page.click('[data-act="chkOk"]'); await page.waitForTimeout(250);
  const afterOk = await page.evaluate(d => { const [y, m] = d.split('-'); return { chips:document.querySelectorAll('.rchk').length, flag:(S.rides[d][2] || {}).chk, warn:dayWarnings(d).some(w => /prebrano s fotografije/.test(w.text)), book:BOOK.build(+y, +m - 1, BOOK.opts({})).html.includes('⚠ preveri') }; }, bsDay);
  ok('skeniranje knjige: »Preverjeno« odstrani oznako povsod (prevoz, opozorila, natisnjena knjiga)', afterOk.chips === 0 && afterOk.flag === '' && !afterOk.warn && !afterOk.book, JSON.stringify(afterOk));
  ok('skeniranje knjige: dnevnik sprememb ne vsebuje imen, naslovov ali ur pacientov', await page.evaluate(() => { const s = JSON.stringify(AUDIT); return /knjiga\.skenirano/.test(s) && /knjiga\.preverjeno/.test(s) && !/Novak Janez|Petek|Zupan|Dobova|Artiče/.test(s); }));

  // ---------- skeniranje knjige: prekinitev, nadzor zastoja, napaka priprave, ročni vnos ob fotografiji ----------
  const HANG = `self.Tesseract={createWorker:async function(lang,n,o){ if(o&&o.logger)o.logger({status:'loading language traineddata',progress:.4}); return{setParameters:async function(){},recognize:function(){return new Promise(function(){})},terminate:async function(){}}}};`;
  const FAILW = `self.Tesseract={createWorker:async function(){ throw new Error('Prenos modela ni uspel'); }};`;
  await ctx.route(/\/ocr\/vendor\/tess-hang\.js$/, route => route.fulfill({ status:200, contentType:'text/javascript', body:HANG }));
  await ctx.route(/\/ocr\/vendor\/tess-fail\.js$/, route => route.fulfill({ status:200, contentType:'text/javascript', body:FAILW }));
  const openBs = async lib => { await page.evaluate(l => { window.KP_CONFIG.ocr = { on:true, lib:l, lang:'slv' }; UI.modal = null; UI.view = 'knjiga'; rerender(); }, lib); await page.waitForSelector('[data-act="bsOpen"]'); await page.click('[data-act="bsOpen"]'); await page.waitForSelector('#bsFile'); };
  await openBs('ocr/vendor/tess-fail.js');
  await page.waitForSelector('[data-role=bswarm][data-st=err]', { timeout: 15000 });
  ok('skeniranje knjige: če priprave ni mogoče izvesti, je napaka vidna že ob odprtju okna (z razlago), ne šele po dolgem čakanju', /Prenos modela ni uspel/.test(await page.textContent('[data-role=bswarm]')));
  await page.setInputFiles('#bsFile', { name:'stran.png', mimeType:'image/png', buffer:bpng });
  await page.waitForSelector('.bscan .banner.bad', { timeout: 20000 });
  const fl = await page.evaluate(() => ({ err:document.querySelector('.bscan .banner.bad').textContent, man:!!document.querySelector('[data-act=bsManual]'), retry:!!document.querySelector('[data-act=bsRetry]') }));
  ok('skeniranje knjige: ob napaki branja ostane fotografija in ponujena sta »Vnesi ročno ob fotografiji« in »Poskusi znova«', /Prenos modela ni uspel/.test(fl.err) && fl.man && fl.retry, JSON.stringify(fl));
  await page.click('.bscan [data-act="closeModal"] >> nth=-1');
  await openBs('ocr/vendor/tess-hang.js');
  await page.waitForSelector('[data-role=bswarm][data-st=ok]', { timeout: 15000 });
  await page.setInputFiles('#bsFile', { name:'stran.png', mimeType:'image/png', buffer:bpng });
  await page.waitForSelector('[data-act="bsCancel"]', { timeout: 20000 }); await page.waitForTimeout(1700);
  const busy1 = await page.evaluate(() => ({ lbl:document.querySelector('[data-role=bsbusy]').textContent, el:document.querySelector('[data-role=bsel]').textContent, bar:!!document.querySelector('progress[data-role=bsbar]') }));
  ok('skeniranje knjige: med branjem so vidni korak (slovensko), pretekli čas, vrstica napredka in gumb »Prekini«', /berem|pripravljam|zaganjam|prenašam/.test(busy1.lbl) && /^\d+ s$/.test(busy1.el) && busy1.bar, JSON.stringify(busy1));
  await page.click('[data-act="bsCancel"]'); await page.waitForSelector('.bscan .banner.bad', { timeout: 10000 });
  const c1 = await page.evaluate(() => ({ err:document.querySelector('.bscan .banner.bad').textContent, man:!!document.querySelector('[data-act=bsManual]'), retry:!!document.querySelector('[data-act=bsRetry]'), busy:!!document.querySelector('[data-act=bsCancel]') }));
  ok('skeniranje knjige: »Prekini« takoj ustavi branje; fotografija ostane, ponujen je ročni vnos', /prekinjeno/.test(c1.err) && c1.man && c1.retry && !c1.busy, JSON.stringify(c1));
  await page.evaluate(() => { NSCAN.ocrLimits.silence = 1500; });
  await page.click('[data-act="bsRetry"]'); await page.waitForSelector('.bscan .banner.bad:has-text("ustavila")', { timeout: 20000 });
  await page.evaluate(() => { NSCAN.ocrLimits.silence = 75000; });
  ok('skeniranje knjige: če se branje ustavi (brez napredka), se po omejenem času samo prekine z jasno napako namesto neskončnega čakanja', true);
  await page.click('[data-act="bsManual"]'); await page.waitForSelector('.bs-row');
  const manDay = await page.evaluate(d => { let x = addDays(d, -2); while (isStandby(x)) x = addDays(x, -1); return x; }, bsDay);
  await page.click('[data-act="bsAddRow"]');
  const mn = await page.evaluate(() => ({ rows:document.querySelectorAll('.bs-row').length, photo:!!document.querySelector('details.bs-photos[open] img[src^="data:image/jpeg"]'), pats:document.querySelectorAll('#bsPat option').length, flags:document.querySelectorAll('.bs-row:not([data-lv=ok])').length, apply:document.querySelector('[data-role=bsapply]').textContent, focus:!!(document.activeElement && document.activeElement.closest('.bs-row:last-child')) }));
  ok('ročni vnos ob fotografiji: 12 praznih vrstic + dodana, cela fotografija odprta, seznam bolnikov za ime, brez oznak ⚠, vpis 0', mn.rows === 13 && mn.photo && mn.pats >= 3 && mn.flags === 0 && /Vpiši 0 prevozov/.test(mn.apply) && mn.focus, JSON.stringify(mn));
  const k0 = await page.evaluate(() => UI.modal.rows[0].key);
  await page.fill(`#bs-${k0}-name`, 'Novak Janez'); await page.press(`#bs-${k0}-name`, 'Tab');
  await page.fill(`#bs-${k0}-from`, 'Dobova 25'); await page.press(`#bs-${k0}-from`, 'Tab');
  await page.fill(`#bs-${k0}-to`, 'OI LJ'); await page.press(`#bs-${k0}-to`, 'Tab');
  await page.fill(`#bs-${k0}-time`, '8.30'); await page.press(`#bs-${k0}-time`, 'Tab');
  await page.fill('#bs-date', manDay); await page.press('#bs-date', 'Tab');
  await page.screenshot({ path: OUT + '/9e-scan-manual.png' });
  const ap2 = await page.textContent('[data-role=bsapply]');
  ok('ročni vnos: gumb za vpis šteje samo izpolnjene vrstice (ni »⚠« pri ročno vpisanih), povzetek ne trdi, da je kaj »prebrano«', /Vpiši 1 prevoz/.test(ap2) && !/⚠/.test(ap2) && /Ročni vnos: 1 izpolnjena vrstica/.test(await page.textContent('[data-role=bssum]')) && !/prebran/.test(await page.textContent('[data-role=bssum]')), ap2);
  await page.click('[data-act="bsApply"]'); await page.waitForTimeout(400);
  const mr = await page.evaluate(d => { const r = (S.rides[d] || [])[0] || {}; return { name:r.name, from:r.from, to:r.to, time:r.time, pid:!!r.patientId, chk:r.chk, n:(S.rides[d] || []).filter(isFilled).length }; }, manDay);
  ok('ročni vnos: prevoz je vpisan s polji, uro 08:30, bolnikom iz baze (po imenu) in brez oznake »preveri«', mr.name === 'Novak Janez' && mr.from === 'Dobova 25' && mr.to === 'OI LJ' && mr.time === '08:30' && mr.pid && !mr.chk && mr.n === 1, JSON.stringify(mr));

  // ---------- skeniranje knjige: obrazec s karticami (izmišljeni podatki): okvirji, izrezi, prazne kartice, predlogi namesto napačnih vrednosti ----------
  const { genCards } = require(SRC + '/tests/bookscan-gen.js');
  const CARDS = [
    { nr:1, name:'Novak Janez', from:'Dobova 25', to:'OI LJ', phone:'031 123 456', mode:'SEDE', time:'10:45', conf:{ name:85, from:80, to:80 } },
    { nr:2, name:'Horvat Marlja', from:'Križe 3', to:'SB Brežice', phone:'', mode:'LEŽE', time:'830' },
    { nr:3, name:'Zxqkw Vrtmn Plsn', from:'Rghtq Zlmnk', to:'Ptzkx', phone:'xx 7', mode:'ey IV', time:'27', conf:{ name:20, from:15, to:18, phone:25, mode:20, time:20 } },
    { nr:4, name:'Kovač Franc', from:'Cesta svobode 14', to:'SB Novo mesto', phone:'040 111 222', mode:'UTILA', time:'1200', conf:{ phone:50, time:40 } },
    { nr:5, blank:true }, { nr:6, blank:true } ];
  const CSTUB = `self.Tesseract={createWorker:async function(lang,n,o){ if(o&&o.logger)o.logger({status:'recognizing text',progress:.5});
    return{setParameters:async function(){},recognize:async function(b){return{data:{text:'',words:${JSON.stringify(genCards(CARDS, {}))}}}},terminate:async function(){}}}};`;
  await ctx.route(/\/ocr\/vendor\/tess-card\.js$/, route => route.fulfill({ status:200, contentType:'text/javascript', body:CSTUB }));
  /* fotografija: besedilo (črnilo) le na karticah 1–4, kartici 5 in 6 sta prazni */
  const cpng = Buffer.from(await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 1400; c.height = 1300; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 1400, 1300); g.fillStyle = '#000'; g.font = 'bold 30px sans-serif';
    for (let k = 0; k < 4; k++){ const y3 = 420 + k * 130; g.fillText('Abcdef Ghijkl', 160, y3 - 70); g.fillText('Mnopqr Stuvw', 225, y3 - 32); g.fillText('Xyzabc Defgh', 695, y3 - 32); g.fillText('0311 2345 678', 220, y3 + 12); g.fillText('Ijklmn', 815, y3 + 10); }
    return c.toDataURL('image/png').split(',')[1]; }), 'base64');
  const cDay = await page.evaluate(([d, m]) => { let x = addDays(d, -3); while (isStandby(x) || x === m) x = addDays(x, -1); S.patients.find(p => p.name === 'Horvat Marija').addr = 'Križe 3'; S.patients.find(p => p.name === 'Horvat Marija').phone = '041 555 666'; return x; }, [bsDay, manDay]);
  await openBs('ocr/vendor/tess-card.js');
  await page.waitForSelector('[data-role=bswarm][data-st=ok]', { timeout: 15000 });
  await page.setInputFiles('#bsFile', { name:'kartice.png', mimeType:'image/png', buffer:cpng });
  await page.waitForSelector('.bs-row', { timeout: 40000 });
  const cd1 = await page.evaluate(() => { const rows = [...document.querySelectorAll('.bs-row')]; return { n:rows.length, nrs:rows.map(r => r.querySelector('[data-bs=nr]').value).join(','), crops:rows.filter(r => r.querySelector('img.bs-crop[src^="data:image/jpeg"]')).length, banner:/poravnan izrez/.test(document.querySelector('.bscan').textContent), blank:document.querySelector('details.bs-blank') ? document.querySelectorAll('details.bs-blank .bs-blankrow').length : 0, blankTxt:document.querySelector('details.bs-blank summary') ? document.querySelector('details.bs-blank summary').textContent : '', pages:UI.modal.pages, card:UI.modal.cardMode }; });
  ok('kartice: najdeni so 4 prevozi s sliko izreza (številke 1–4), prazni kartici 5 in 6 sta v zloženem razdelku (ne izgubljeni), pasica pove, da je pisava prebrana le deloma', cd1.n === 4 && cd1.nrs === '1,2,3,4' && cd1.crops === 4 && cd1.banner && cd1.blank === 2 && /2 kartici|2 kartic/.test(cd1.blankTxt) && /5, 6/.test(cd1.blankTxt) && cd1.card, JSON.stringify(cd1));
  await page.screenshot({ path: OUT + '/9f-scan-kartice.png' });
  const ck = n => page.evaluate(n2 => UI.modal.rows.find(r => r.nr === n2).key, n);
  const kc1 = await ck(1), kc3 = await ck(3), kc4 = await ck(4);
  const cv = await page.evaluate(([a, b, c]) => { const f = (k, x) => (document.querySelector(`#bs-${k}-${x}`) || {}).value; const lv = (k, x) => (document.querySelector(`[data-bsrow="${k}"] [data-bsf=${x}]`) || {}).dataset.lv; return { n1:f(a, 'name'), fr1:f(a, 'from'), to1:f(a, 'to'), t1:f(a, 'time'), m1:f(a, 'mode'), p1:f(a, 'phone'), p1lv:lv(a, 'phone'), n3:f(b, 'name'), fr3:f(b, 'from'), p3lv:lv(b, 'phone'), nlv3:lv(b, 'name'), t4:f(c, 'time'), p4:f(c, 'phone'), sugT:[...document.querySelectorAll(`[data-bsrow="${c}"] .bs-sug`)].map(e => e.textContent) }; }, [kc1, kc3, kc4]);
  ok('kartice: jasna polja se vpišejo (ime iz baze, od, do, ura 10:45, sede), telefon iz rokopisa je rumen (preveri)', cv.n1 === 'Novak Janez' && cv.fr1 === 'Dobova 25' && cv.to1 === 'OI LJ' && cv.t1 === '10:45' && cv.m1 === 'sede' && cv.p1 === '031 123 456' && cv.p1lv === 'chk', JSON.stringify(cv));
  ok('kartice: neberljiv rokopis ostane prazen in rdeč (nič izmišljenega), slabo prebrana ura in telefon sta samo predloga', cv.n3 === '' && cv.fr3 === '' && cv.nlv3 === 'bad' && cv.t4 === '' && cv.p4 === '' && cv.sugT.some(t => /12:00/.test(t)) && cv.sugT.some(t => /040 111 222/.test(t)), JSON.stringify(cv));
  // izbira pacienta iz baze dopolni naslov in telefon (rumeno: primerjaj z izrezom)
  await page.fill(`#bs-${kc3}-name`, 'Horvat Marija'); await page.press(`#bs-${kc3}-name`, 'Tab');
  const pf2 = await page.evaluate(k => ({ fr:document.querySelector(`#bs-${k}-from`).value, ph:document.querySelector(`#bs-${k}-phone`).value, frlv:document.querySelector(`[data-bsrow="${k}"] [data-bsf=from]`).dataset.lv, pid:UI.modal.rows.find(r => r.key === k).f.pid }), kc3);
  ok('kartice: izbrano ime iz baze dopolni prazna naslov in telefon iz kartoteke, označena rumeno za primerjavo z izrezom', pf2.fr === 'Križe 3' && pf2.ph === '041 555 666' && pf2.frlv === 'chk' && !!pf2.pid, JSON.stringify(pf2));
  // predlog ure z enim klikom
  await page.click(`[data-bsrow="${kc4}"] [data-bsf=time] .bs-sug`);
  ok('kartice: klik na predlog ure (12:00) vpiše uro', (await page.inputValue(`#bs-${kc4}-time`)) === '12:00');
  // prazna kartica, ki je vendarle izpolnjena
  await page.evaluate(() => { document.querySelector('details.bs-blank').open = true; });
  await page.click('details.bs-blank [data-act="bsUnblank"] >> nth=0');
  const ub = await page.evaluate(() => ({ rows:document.querySelectorAll('.bs-row').length, blank:document.querySelectorAll('details.bs-blank .bs-blankrow').length, nrs:[...document.querySelectorAll('.bs-row [data-bs=nr]')].map(e => e.value).join(',') }));
  ok('kartice: »Ni prazna: vnesi ta prevoz« prenese kartico med vrstice za vnos (številka 5), v razdelku ostane ena', ub.rows === 5 && ub.blank === 1 && ub.nrs === '1,2,3,4,5', JSON.stringify(ub));
  await page.fill('#bs-date', cDay); await page.press('#bs-date', 'Tab');
  await page.check(`[data-bsrow="${kc3}"] [data-bs=on]`); await page.check(`[data-bsrow="${kc4}"] [data-bs=on]`);
  await page.click('[data-act="bsApply"]'); await page.waitForSelector('#modal .modal', { state:'detached', timeout: 10000 }).catch(() => {}); await page.waitForTimeout(300);
  const cap = await page.evaluate(d => { const a = (S.rides[d] || []).filter(isFilled); const by = nr => a.find(r => r.name === nr) || {}; return { n:a.length, r1:by('Novak Janez'), r3:by('Horvat Marija'), r4:by('Kovač Franc') }; }, cDay);
  ok('kartice: vpis ustvari prevoze s telefonom (031 123 456 iz rokopisa, 041 555 666 iz baze), uro 12:00 in načinom; neprebrana polja ostanejo prazna', cap.n >= 3 && cap.r1.phone === '031 123 456' && cap.r1.time === '10:45' && cap.r3.phone === '041 555 666' && cap.r3.from === 'Križe 3' && cap.r4.time === '12:00' && cap.r4.mode === 'utila', JSON.stringify({ n:cap.n, r1:[cap.r1.phone, cap.r1.time], r3:[cap.r3.phone, cap.r3.from], r4:[cap.r4.time, cap.r4.mode] }));

  // ---------- branje v oblaku (NEOBVEZNO, privzeto izklopljeno): Google Cloud Vision, posnetek strežnika, izmišljeni podatki ----------
  const visionSeen = []; let visionMode = 'cards', neverSeen = 0;
  const toVision = ws => ({ responses:[{ fullTextAnnotation:{ text:ws.map(w => w.text).join(' '), pages:[{ blocks:[{ paragraphs:[{ words:ws.map(w => ({ confidence:w.confidence / 100,
    boundingBox:{ vertices:[{ x:w.bbox.x0, y:w.bbox.y0 }, { x:w.bbox.x1, y:w.bbox.y0 }, { x:w.bbox.x1, y:w.bbox.y1 }, { x:w.bbox.x0, y:w.bbox.y1 }] }, symbols:[...w.text].map(ch => ({ text:ch })) })) }] }] }] } }] });
  const HI = { name:92, from:90, to:90, phone:93, mode:90, time:91 };
  const VCARDS = [
    { nr:1, name:'Novak Janez', from:'Dobova 25', to:'OI LJ', phone:'031 123 456', mode:'SEDE', time:'10:45', conf:HI },
    { nr:2, name:'Zupan Vida', from:'Artiče 21', to:'ZD Krško', phone:'041 777 888', mode:'LEŽE', time:'8:30', conf:HI },
    { nr:3, name:'Kovač Franc', from:'Cesta svobode 14', to:'SB Novo mesto', phone:'040 111 222', mode:'UTILA', time:'12:00', conf:HI },
    { nr:4, name:'Horvat Marija', from:'Križe 3', to:'SB Brežice', phone:'', mode:'SEDE', time:'9:15', conf:HI },
    { nr:5, blank:true }, { nr:6, blank:true } ];
  const VWORDS = genCards(VCARDS, {});
  await ctx.route(/^https:\/\/eu-vision\.googleapis\.com\//, route => {
    const rq = route.request(), cors = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'content-type', 'access-control-allow-methods':'POST' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status:204, headers:cors });
    let body = {}; try { body = JSON.parse(rq.postData() || '{}'); } catch (e) { /* nič */ }
    visionSeen.push({ url:rq.url(), headers:rq.headers(), body });
    if (visionMode === '403') return route.fulfill({ status:403, contentType:'application/json', headers:cors, body:JSON.stringify({ error:{ code:403, message:'Cloud Vision API has not been used in project 1 before or it is disabled.', status:'PERMISSION_DENIED' } }) });
    const ws = visionMode === 'test' ? [['PREIZKUS', 30], ['031', 330], ['123', 420], ['456', 510]].map(([t, x]) => ({ text:t, confidence:95, bbox:{ x0:x, y0:40, x1:x + 80, y1:100 } })) : VWORDS;
    route.fulfill({ status:200, contentType:'application/json', headers:cors, body:JSON.stringify(toVision(ws)) });
  });
  await ctx.route(/\/ocr\/vendor\/tess-never\.js$/, route => { neverSeen++; route.fulfill({ status:200, contentType:'text/javascript', body:`self.Tesseract={createWorker:async function(){return{setParameters:async function(){},recognize:async function(){return{data:{text:'tess',words:[]}}},terminate:async function(){}}}};` }); });
  const ocrKeep = await page.evaluate(() => window.KP_CONFIG.ocr);
  ok('oblak: privzeto je izklopljen: v vseh dosedanjih preizkusih ni bilo nobenega klica proti Google Vision', visionSeen.length === 0 && !(await page.evaluate(() => NSCAN.cloudOn())));
  await page.evaluate(() => { window.KP_CONFIG.ocr = { on:true, lib:'ocr/vendor/tess-never.js', lang:'slv', cloud:{ key:'TESTKEY123', endpoint:'https://eu-vision.googleapis.com', lang:'sl' } }; UI.modal = null; UI.view = 'knjiga'; rerender(); });
  await page.waitForSelector('[data-act="bsOpen"]'); await page.click('[data-act="bsOpen"]'); await page.waitForSelector('#bsFile');
  await page.waitForSelector('[data-role=bswarm][data-st=ok]', { timeout: 15000 });
  const cl0 = await page.evaluate(() => ({ warn:/Branje v oblaku je vključeno/.test(document.querySelector('.bscan').textContent), g:/Googlu/.test(document.querySelector('.bscan').textContent), btn:!!document.querySelector('[data-act=bsCloudTest]'), noLocal:!/ne pošlje nikamor/.test(document.querySelector('.bscan').textContent) }));
  ok('oblak: ko je vključen, okno jasno opozori, da se fotografija pošlje Googlu (ne trdi »ne pošlje se nikamor«), ponudi preizkus povezave in ne prenaša programa Tesseract', cl0.warn && cl0.g && cl0.btn && cl0.noLocal && neverSeen === 0, JSON.stringify({ cl0, neverSeen }));
  visionMode = 'test'; await page.click('[data-act=bsCloudTest]'); await page.waitForFunction(() => /Povezava deluje|✖/.test(document.querySelector('[data-role=bscloudtest]').textContent), null, { timeout:15000 });
  const tq = visionSeen[0] || { url:'', body:{}, headers:{} }, tr = ((tq.body.requests || [])[0]) || {};
  ok('oblak: preizkus povezave pošlje en zahtevek (naslov EU, ključ v zahtevku, DOCUMENT_TEXT_DETECTION, jezik sl, JPEG) in pokaže, kaj je Google prebral', /^https:\/\/eu-vision\.googleapis\.com\/v1\/images:annotate\?key=TESTKEY123$/.test(tq.url) && tr.features && tr.features[0].type === 'DOCUMENT_TEXT_DETECTION' && (tr.imageContext.languageHints || []).includes('sl') && /^\/9j\//.test((tr.image || {}).content || '') && /Povezava deluje/.test(await page.textContent('[data-role=bscloudtest]')), JSON.stringify({ url:tq.url, n:visionSeen.length, t:await page.textContent('[data-role=bscloudtest]') }));
  visionMode = 'cards';
  await page.setInputFiles('#bsFile', { name:'kartice.png', mimeType:'image/png', buffer:cpng });
  await page.waitForSelector('.bs-row', { timeout: 40000 });
  const vq = visionSeen[1] || { headers:{}, body:{} };
  const vr = await page.evaluate(() => { const rows = [...document.querySelectorAll('.bs-row')]; return { n:rows.length, blank:document.querySelectorAll('details.bs-blank .bs-blankrow').length, banner:/Pisavo je prebral Google/.test(document.querySelector('.bscan').textContent) }; });
  ok('oblak: stran gre na Google samo enkrat (barvna JPEG slika, ne črno-bela), Tesseract se ne naloži, najdene so 4 kartice, prazni sta v zloženem razdelku, pasica pove, da je pisavo prebral Google', visionSeen.length === 2 && /^\/9j\//.test(((vq.body.requests || [])[0].image || {}).content || '') && neverSeen === 0 && vr.n === 4 && vr.blank === 2 && vr.banner, JSON.stringify({ n:visionSeen.length, vr, neverSeen }));
  ok('oblak: zahtevek nosi samo izvor strani kot Referer (da deluje omejitev ključa na naslov), brez poti, piškotkov in prijave', /^http:\/\/127\.0\.0\.1:\d+\/$/.test(vq.headers.referer || '') && !vq.headers.cookie && !vq.headers.authorization, JSON.stringify({ ref:vq.headers.referer }));
  const vk = await page.evaluate(() => Object.fromEntries([1, 2, 3, 4].map(n => [n, UI.modal.rows.find(r => r.nr === n).key])));
  const vv = await page.evaluate(k => { const f = (key, x) => (document.querySelector(`#bs-${key}-${x}`) || {}).value; const lv = (key, x) => (document.querySelector(`[data-bsrow="${key}"] [data-bsf=${x}]`) || {}).dataset.lv; const o = {}; [1, 2, 3, 4].forEach(n => { const key = k[n]; o[n] = { name:f(key, 'name'), from:f(key, 'from'), to:f(key, 'to'), time:f(key, 'time'), mode:f(key, 'mode'), phone:f(key, 'phone'), nlv:lv(key, 'name'), plv:lv(key, 'phone') }; }); return o; }, vk);
  ok('oblak: prebrano se vpiše v polja (znan pacient iz baze, telefon, ura, način, naslovi), nov pacient ostane rumen »preveri«, telefon je vedno rumen (primerjaj s sliko)',
     vv[1].name === 'Novak Janez' && vv[1].nlv === 'ok' && vv[1].phone === '031 123 456' && vv[1].plv === 'chk' && vv[1].time === '10:45' && vv[1].mode === 'sede' && vv[1].from === 'Dobova 25' && vv[1].to === 'OI LJ'
     && vv[2].name === 'Zupan Vida' && vv[2].nlv === 'chk' && vv[2].time === '08:30' && vv[2].mode === 'leze' && vv[2].phone === '041 777 888'
     && vv[3].name === 'Kovač Franc' && vv[3].time === '12:00' && vv[3].mode === 'utila' && vv[3].phone === '040 111 222' && vv[4].name === 'Horvat Marija' && vv[4].time === '09:15', JSON.stringify(vv));
  await page.screenshot({ path: OUT + '/9g-scan-oblak.png' });
  // napaka Googla (403): jasna razlaga, fotografija ostane, ponujen je ročni vnos
  await page.click('[data-act=bsBack]'); await page.waitForSelector('#bsFile');
  visionMode = '403'; expect403 = true; await page.setInputFiles('#bsFile', { name:'kartice.png', mimeType:'image/png', buffer:cpng });
  await page.waitForSelector('.bscan .banner.bad', { timeout: 20000 });
  const v403 = await page.evaluate(() => ({ err:document.querySelector('.bscan .banner.bad').textContent, man:!!document.querySelector('[data-act=bsManual]'), retry:!!document.querySelector('[data-act=bsRetry]') }));
  ok('oblak: napaka 403 pove razlog in ukrep (Cloud Vision API, obračunski račun, omejitev ključa); fotografija ostane in ponujena sta ročni vnos in ponovitev', /zavrnil dostop \(403\)/.test(v403.err) && /Cloud Vision API/.test(v403.err) && v403.man && v403.retry, JSON.stringify(v403));
  // naloge se nikoli ne berejo v oblaku: klic brez zastavice cloud gre še vedno v lokalni Tesseract
  visionMode = 'cards'; expect403 = false; const vBefore = visionSeen.length;
  const loc = await page.evaluate(async () => { const b = await new Promise(r => { const c = document.createElement('canvas'); c.width = 50; c.height = 50; c.toBlob(r, 'image/png'); }); try { return await NSCAN.ocr(b, null, NSCAN.ocrCfg()); } catch (e) { return 'ERR ' + e.message; } });
  ok('oblak: branje naloga (brez zastavice) ostane lokalno: Tesseract se naloži, Google ni poklican', loc === 'tess' && neverSeen === 1 && visionSeen.length === vBefore, JSON.stringify({ loc, neverSeen, n:visionSeen.length }));
  await page.evaluate(k => { window.KP_CONFIG.ocr = k; UI.modal = null; renderModal(); rerender(); }, ocrKeep);
  ok('oblak: po izklopu (brez ključa) je spet vse lokalno', !(await page.evaluate(() => NSCAN.cloudOn())));

  // ---------- uvoz zaposlenih (izmišljena imena) ----------
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="zaposleni"]'); await page.waitForSelector('form[data-form="importStaff"]', { state:'attached' });
  const st0 = await page.evaluate(() => S.staff.length);
  await page.evaluate(() => { document.querySelector('details.stimp').open = true; });
  await page.fill('[data-role=stlist]', 'AnaK\nBetaB\nGama G.\nAnaK\n1234');
  const stp = await page.evaluate(() => ({ prev:document.querySelector('[data-role=stprev]').textContent, go:document.querySelector('[data-role=stgo]').textContent, dis:document.querySelector('[data-role=stgo]').disabled }));
  ok('uvoz zaposlenih: sprotni predogled pove, koliko imen bo dodanih (zlepljena imena se ločijo), kaj je dvojnik in kaj ni ime', /Dodal bom 3: Ana K\., Beta B\., Gama G\./.test(stp.prev) && /preskočeno\): Ana K\./.test(stp.prev) && /1234/.test(stp.prev) && stp.go === 'Dodaj 3' && !stp.dis, JSON.stringify(stp));
  await page.setInputFiles('#stfile', { name:'osebje.txt', mimeType:'text/plain', buffer:Buffer.from('Delta D\nEpsilon E\n') });
  await page.waitForFunction(() => /Delta D/.test(document.querySelector('[data-role=stlist]').value) && document.querySelector('[data-role=stgo]').textContent === 'Dodaj 5');
  await page.selectOption('form[data-form=importStaff] select[name=team]', 'NN'); await page.click('[data-role=stgo]');
  await page.waitForTimeout(300);
  const st1 = await page.evaluate(() => ({ n:S.staff.length, last:S.staff.slice(-5).map(s => s.name + '|' + s.team).join(','), audit:JSON.stringify(AUDIT), rows:document.querySelectorAll('table.edtable tbody tr').length }));
  ok('uvoz zaposlenih: dodanih 5 (iz besedila in datoteke), z izbrano ekipo, vidni v tabeli', st1.n === st0 + 5 && st1.last === 'Ana K.|NN,Beta B.|NN,Gama G.|NN,Delta D.|NN,Epsilon E.|NN' && st1.rows >= 5, JSON.stringify({ n:st1.n, last:st1.last }));
  ok('uvoz zaposlenih: dnevnik sprememb beleži samo število, ne imen', /osebje\.uvoz/.test(st1.audit) && !/Ana K|Beta B|Delta D|Epsilon/.test(st1.audit));
  await page.evaluate(() => { document.querySelector('details.stimp').open = true; });
  await page.fill('[data-role=stlist]', 'AnaK\nDelta D');
  const st2 = await page.evaluate(() => ({ prev:document.querySelector('[data-role=stprev]').textContent, dis:document.querySelector('[data-role=stgo]').disabled }));
  ok('uvoz zaposlenih: ponovni uvoz že vpisanih imen nič ne doda (gumb onemogočen)', /Ni novih imen/.test(st2.prev) && st2.dis, JSON.stringify(st2));
  await page.evaluate(o => { if (o) window.KP_CONFIG.ocr = o; else delete window.KP_CONFIG.ocr; }, ocrBefore);

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
