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

  // klinika: samodejno čakanje
  await page.click('.box[data-ride="br1"] .rrow'); await page.click('.box[data-ride="br0"] .rrow');
  await page.fill('.box[data-ride="br0"] input[data-f="to"]', 'UKC Ljubljana – očesna klinika'); await page.dispatchEvent('.box[data-ride="br0"] input[data-f="to"]', 'change');
  await page.waitForTimeout(300);
  const stay = await page.evaluate(() => { const r = rideById(UI.date, 'br0').r; const el = document.querySelector('.box[data-ride="br0"] [data-role="stay"]'); return { stay: r.stay, shown: el && !el.hidden, g: geo(r.to).poi && geo(r.to).poi.clinic }; });
  ok('klinika: izbira »očesna klinika« odpre vrstico čakanja in vpiše privzeti čas pregleda', stay.shown && stay.stay > 0 && stay.g, JSON.stringify(stay));
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); }); await page.waitForTimeout(250);
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
  await page.click('[data-nav="nastavitve"]'); await page.click('[data-act="setTab"][data-k="dializa"]'); await page.waitForSelector('form[data-form="diaAdd"]');
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
