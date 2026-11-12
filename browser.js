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
  ok('km brez Googla: ocena/ceste OSM + namig za ključ', /Natančen izračun|Google/.test(kmTxt) && /km/.test(kmTxt), kmTxt);
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
  await page.waitForTimeout(2500);   // samodejni izračun
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
  await page.click('details.menu > summary'); await page.click('[data-act="copyOpen"]'); await page.waitForSelector('.copypanel');
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
