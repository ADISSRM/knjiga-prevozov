'use strict';
/* Preizkusi cestnega usmerjanja in planerja. Zagon: node tests/run.js  (Node 18+, brez omrežja, brez namestitve paketov)
   Strežnik OSRM je posnetek dokumentiranega API-ja (tests/mock-osrm.js). Prava povezava: v aplikaciji Nastavitve → Planiranje → »Preveri cestne podatke«. */
const vm = require('vm'), assert = require('assert'), path = require('path');
const { load } = require('./load.js'), { createMock } = require('./mock-osrm.js'), { createGoogleMock } = require('./mock-google.js'), { createNominatimMock } = require('./mock-nominatim.js');
const SRC = path.join(__dirname, '..', 'src') + path.sep;
const FILES = ['20-data.js', '30-core.js', '35-db.js', '37-geocode.js', '38-routing.js', '39-google.js', '40-planner.js', '45-pacienti.js', '54-quick.js'].map(f => SRC + f);
const URLS = { url:'https://osrm.test', fallback:['https://osrm2.test'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATE = '2026-11-10';   // torek

function boot(o = {}){
  const mock = createMock(o.mock || {});
  const gm = createGoogleMock(o.gmock || {});
  const nm = createNominatimMock(o.nmock || {});
  const ctx = load(FILES, { config:{ routing:o.routing || URLS, google:o.google, geocode:o.geocode || { url:'https://nominatim.test' } }, mem:o.mem, fetch:mock.fetch });
  ctx.__mock = mock.fetch; ctx.__gmock = gm.fetch; ctx.__nmock = nm.fetch;
  const ev = code => vm.runInContext(code, ctx);
  const js = code => JSON.parse(ev('JSON.stringify(' + code + ')'));
  ev('ROUTE.fetch = __mock; ROUTE.gap = 0; GOOGLE.fetch = __gmock; GOOGLE.minGap = 0; GEOC.fetch = __nmock; GEOC.minGap = 0; S = defaultState(); normalizeState();');
  return { ctx, ev, js, mock, gm, nm };
}
const VEH = [
  { id:'v04', name:'Avto 04', tip:'sanitetno', ns:'redna', sede:3, leze:1, utila:0, skupaj:4, sedeMax:3, lezeMax:1, utilaMax:0, skupajMax:4, aktiv:true },
  { id:'v13', name:'Avto 13', tip:'sanitetno', ns:'redna', sede:4, leze:0, utila:0, skupaj:4, sedeMax:6, lezeMax:0, utilaMax:0, skupajMax:6, aktiv:true },
  { id:'c1', name:'C1 rdeči', tip:'sanitetno', ns:'oboje', sede:2, leze:0, utila:0, skupaj:2, sedeMax:2, lezeMax:0, utilaMax:0, skupajMax:2, aktiv:true },
  { id:'ost', name:'OSTALO', tip:'ostalo', ns:'oboje', sede:0, leze:0, utila:0, skupaj:0, sedeMax:0, lezeMax:0, utilaMax:0, skupajMax:0, aktiv:true }
];
/* Postavi dan: opts.vehicles (id-ji), opts.duty [{name, team, role, from, to, ot, vehicleId}], opts.rides, opts.settings */
function day(t, o){
  const sc = { date:o.date || DATE, vehicles:VEH.filter(v => !o.vehicles || o.vehicles.includes(v.id) || v.id === 'ost'), duty:o.duty || [{ name:'Voznik A', team:'redna', role:'voznik' }], rides:o.rides || [], settings:o.settings, routing:o.routing, optimize:o.optimize, rules:o.rules, dayMode:o.dayMode || 'samodejno' };
  t.ev(`(function(sc){
    S.settings.routing.on = sc.routing === true; if (sc.optimize !== undefined) S.settings.optimize = sc.optimize;
    S.vehicles = sc.vehicles; normalizeState();
    S.duty[sc.date] = sc.duty.map((d, i) => ({ id:'d' + i, staffId:'', from:'', to:'', ot:0, vehicleId:'', ...d }));
    if (sc.rules) Object.assign(S.rules, sc.rules); if (sc.settings) Object.assign(S.settings, sc.settings);
    S.dayRules[sc.date] = { mode:sc.dayMode };
    const a = ensureDay(sc.date); sc.rides.forEach((r, i) => { while (a.length <= i) a.push(blankRide()); Object.assign(a[i], blankRide(), r, { id:'r' + i }); });
    rev++; PLAN_CACHE.clear();
  })(${JSON.stringify(sc)})`);
}
const planOf = (t, date = DATE) => t.ev(`(() => { const p = computePlan(${JSON.stringify(date)}); return p; })()`);
/* Povzetek načrta kot navaden objekt */
const sum = (t, date = DATE) => t.js(`(() => { const p = computePlan(${JSON.stringify(date)}); return { km:p.totals.km, min:p.totals.min, late:p.totals.late, un:p.unassigned.map(u => ({ nr:u.ride.nr, reason:u.reason, shiftNeed:u.shiftNeed })), est:p.totals.estLegs, wait:p.totals.waitLegs, real:p.totals.realLegs, variant:p.opts.id, eff:p.eff,
    warn:p.warnings.map(w => w.level + ':' + w.text), conf:p.conflicts.map(c => c.type), sug:(p.suggestions || []).map(s => s.k + ':' + s.text),
    crews:p.crews.map(c => ({ id:c.id, trips:c.trips.map(t => ({ kind:t.kind, nrs:t.rides.map(r => r.nr), dests:(t.dests || []).map(d => d.label), start:t.start, depart:t.depart, end:t.end, late:t.late, slack:t.slack, km:t.ev.km, dur:t.ev.dur, info:t.info, stops:t.stopsAbs.map(s => [s.type, s.t, s.pt.label]) })) })) }; })()`);

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/* ------------------------------------------------------------------ geokodiranje */
test('geo: mesta izven občine, naselja, ustanove', () => {
  const t = boot();
  const g = s => t.js(`(() => { const g = geo(${JSON.stringify(s)}); return { kind:g.kind, label:g.label, key:g.key }; })()`);
  assert.deepStrictEqual(g('Kandijska cesta 5, Novo mesto'), { kind:'mesto', label:'Novo mesto', key:'t:Novo mesto' });
  assert.strictEqual(g('Slovenska cesta 10, Ljubljana').label, 'Ljubljana');
  assert.strictEqual(g('UKC Ljubljana').kind, 'poi');
  assert.strictEqual(g('Onkološki inštitut Ljubljana').kind, 'poi');
  assert.strictEqual(g('Dobova 25').kind, 'naselje');
  assert.strictEqual(g('Krška vas 3').label, 'Krška vas');          // ne sme postati Krško
  assert.strictEqual(g('Cesta krških žrtev 12, Krško').label, 'Krško');
  assert.strictEqual(g('Neznana ulica 5').kind, 'neznano');
  assert.strictEqual(g('').kind, 'prazno');
});

/* ------------------------------------------------------------------ odjemalec OSRM */
test('OSRM: zahtevek vsebuje samo koordinate (lon,lat), brez piškotkov in referrerja; razdalje se berejo pravilno', async () => {
  const t = boot();
  const km = t.js(`(() => { const a = geo('Dobova 25'), b = geo('UKC Ljubljana'); return ROUTE.leg(a, b); })()`);
  assert.strictEqual(km, null, 'pred prenosom podatka ni');
  const v0 = t.ev('ROUTE.version'); await t.ev('ROUTE.settle()');
  const r = t.js(`(() => { const a = geo('Dobova 25'), b = geo('UKC Ljubljana'); return { leg:ROUTE.leg(a, b), back:ROUTE.leg(b, a), a:[a.lat, a.lon], b:[b.lat, b.lon] }; })()`);
  const expect = t.mock.roadKm([r.a[1], r.a[0]], [r.b[1], r.b[0]]);
  assert.ok(Math.abs(r.leg.km - expect) < 0.01, `km ${r.leg.km} vs ${expect}`);
  assert.ok(r.leg.min > 50 && r.leg.min < 120, 'trajanje v verjetnem območju ' + r.leg.min);
  assert.ok(t.ev('ROUTE.version') > v0, 'verzija se poveča, ko pridejo podatki');
  assert.strictEqual(t.mock.log.length, 1);
  const L = t.mock.log[0];
  assert.match(L.url, /^https:\/\/osrm\.test\/table\/v1\/driving\/15\.66000,45\.90000;14\.52500,46\.05400\?/, 'lon,lat; Dobova nato UKC');
  assert.ok(/annotations=duration,distance/.test(L.url) && /sources=/.test(L.url) && /destinations=/.test(L.url));
  assert.strictEqual(L.init.credentials, 'omit'); assert.strictEqual(L.init.referrerPolicy, 'no-referrer'); assert.ok(!L.init.headers, 'brez posebnih glav (brez preflight)');
  assert.ok(!/Dobova|Ljubljana|UKC/i.test(L.url), 'v URL-ju ni imen ali naslovov');
});
test('OSRM: matrika po blokih (največ 80 koordinat na zahtevek), izvoz in uvoz razdalje.json', async () => {
  const t = boot();
  const n = t.ev('ROUTE.warmPoints().length');
  await t.ev('ROUTE.warm()');
  const sizes = t.mock.log.map(l => l.url.match(/driving\/([^?]+)/)[1].split(';').length);
  assert.ok(Math.max(...sizes) <= 80, 'največ 80 koordinat: ' + Math.max(...sizes));
  assert.ok(t.mock.log.length >= 9, 'več blokov: ' + t.mock.log.length);
  const ex = t.js('(() => { const e = ROUTE.exportShared(); return { n:e.pts.length, missing:e.missing, len:e.d.length, built:!!e.built }; })()');
  assert.strictEqual(ex.n, n); assert.strictEqual(ex.missing, 0); assert.strictEqual(ex.len, n * n);
  // druga seja: samo razdalje.json, strežnik ni dosegljiv
  const file = t.ev('JSON.stringify(ROUTE.exportShared())');
  const t2 = boot({ mock:{ down:() => 'throw' } });
  assert.strictEqual(t2.ev(`ROUTE.setShared(JSON.parse(${JSON.stringify(file)}))`), true);
  const r = t2.js(`(() => { const a = geo('Dobova 25'), b = geo('UKC Ljubljana'), c = geo('SB Novo mesto'); return [ROUTE.leg(a, b), ROUTE.leg(b, c), ROUTE.leg(geo('Pišece 7'), geo('Celje'))]; })()`);
  assert.ok(r[0] && r[1] && r[2], 'vse relacije iz datoteke');
  assert.strictEqual(t2.mock.log.length, 0, 'brez klica strežnika');
  assert.strictEqual(t2.ev('ROUTE.setShared({v:1,pts:[[1,2]],d:[0,0],t:[0]})'), false, 'neveljavna datoteka se zavrne');
});
test('OSRM: trajni predpomnilnik hrani samo splošne točke, hišni naslovi ostanejo v pomnilniku', async () => {
  const mem = new Map();
  const t = boot({ mem });
  t.ev(`(() => { ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'));
    globalThis.house = { key:'a:test', lat:45.9123, lon:15.6012, kind:'addr', label:'Hiša 1' }; ROUTE.leg(house, geo('UKC Ljubljana')); })()`);
  await t.ev('ROUTE.settle()'); t.ev('ROUTE.persist()');
  const raw = mem.get('kp.route.v1'); assert.ok(raw, 'shranjeno');
  assert.ok(!raw.includes('45.91230,15.60120'), 'koordinate hiše se ne shranijo trajno');
  assert.ok(raw.includes('46.05400,14.52500'), 'splošne točke so shranjene');
  assert.ok(t.js(`ROUTE.leg(house, geo('UKC Ljubljana'))`), 'v tej seji hiša deluje');
  // nova seja: podatki iz shrambe, brez klica
  const t2 = boot({ mem, mock:{ down:() => 'throw' } }); t2.ev('ROUTE.init()');
  assert.ok(t2.js(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`), 'predpomnilnik se naloži');
  assert.strictEqual(t2.js(`ROUTE.leg({ key:'a:test', lat:45.9123, lon:15.6012, kind:'addr' }, geo('UKC Ljubljana'))`), null, 'hiša po novi seji ni v predpomnilniku');
});
test('OSRM: rezervni strežnik, napaka, počasni ponovni poskusi (brez zanke)', async () => {
  const t = boot({ mock:{ down:{ 'https://osrm.test':'throw' } } });
  t.ev(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`); await t.ev('ROUTE.settle()');
  assert.ok(t.mock.log.some(l => l.base === 'https://osrm2.test' || l.url.startsWith('https://osrm2.test')), 'uporabljen rezervni strežnik');
  assert.strictEqual(t.ev('ROUTE.info().url'), 'https://osrm2.test');
  assert.ok(t.js(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`));
  // oba nedosegljiva
  const t2 = boot({ mock:{ down:() => 'throw' } });
  t2.ev(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`); await t2.ev('ROUTE.settle()');
  const n1 = t2.mock.log.length; assert.strictEqual(t2.ev('ROUTE.info().status'), 'error'); assert.ok(/Failed|dosegljiv|fetch/i.test(t2.ev('ROUTE.info().err')));
  for (let i = 0; i < 5; i++){ t2.ev(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`); await sleep(40); }
  assert.strictEqual(t2.mock.log.length, n1, 'med mirovanjem ni novih zahtevkov');
  // strežnik brez razdalj
  const t3 = boot({ mock:{ noDistances:true } });
  t3.ev(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`); await t3.ev('ROUTE.settle()');
  assert.ok(/razdalj/.test(t3.ev('ROUTE.info().err')), t3.ev('ROUTE.info().err'));
});
test('OSRM: 429 → ponovni poskus, nato rezervni strežnik', async () => {
  const t = boot({ mock:{ down:{ 'https://osrm.test':429 } } });
  t.ev(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`); await t.ev('ROUTE.settle(8000)');
  assert.ok(t.js(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`), 'rezervni strežnik je odgovoril');
  assert.ok(t.mock.log.filter(l => l.url.startsWith('https://osrm.test')).length >= 2, 'ponovni poskus na prvem strežniku');
});
test('OSRM: relacija brez poti se ne ponavlja v neskončnost, planer jo označi kot oceno', async () => {
  const t = boot({ mock:{ noRoute:(a, b) => Math.abs(a[0] - 15.66) < 0.001 && Math.abs(b[0] - 14.525) < 0.001 } });
  t.ev(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`); await t.ev('ROUTE.settle()');
  const n = t.mock.log.length;
  for (let i = 0; i < 3; i++){ assert.strictEqual(t.js(`ROUTE.leg(geo('Dobova 25'), geo('UKC Ljubljana'))`), null); await sleep(30); }
  assert.strictEqual(t.mock.log.length, n);
  const l = t.js(`(() => { const L = makeLeg(S.settings)(geo('Dobova 25'), geo('UKC Ljubljana')); return { est:L.est, real:L.real, wait:L.wait }; })()`);
  assert.strictEqual(l.est, true); assert.ok(!l.real);
});
test('OSRM: preizkus povezave in geometrija poti', async () => {
  const t = boot();
  const r = await t.ev('ROUTE.test()');
  assert.strictEqual(r.ok, true, r.msg); assert.ok(r.km > 100 && r.km < 160); assert.strictEqual(r.url, 'https://osrm.test');
  const p = await t.ev(`ROUTE.path([geo('ZD Brežice'), geo('Dobova 25'), geo('UKC Ljubljana')])`);
  assert.ok(p.coords.length >= 3 && p.km > 100);
  assert.ok(t.ev(`ROUTE.pathCached([geo('ZD Brežice'), geo('Dobova 25'), geo('UKC Ljubljana')])`));
  const bad = boot({ mock:{ down:() => 'throw' } }); const r2 = await bad.ev('ROUTE.test()'); assert.strictEqual(r2.ok, false); assert.ok(/ni uspela/.test(r2.msg));
  const none = boot({ routing:{ url:'' } }); assert.strictEqual((await none.ev('ROUTE.test()')).ok, false); assert.strictEqual(none.ev('ROUTE.enabled()'), false);
});

/* ------------------------------------------------------------------ planer: cestni podatki */
test('planer: pred prenosom ocena (označena), po prenosu pravi cestni podatki, razpored se osveži', async () => {
  const t = boot();
  day(t, { routing:true, rides:[{ name:'Ivan', from:'Dobova 25', to:'UKC Ljubljana', time:'09:00', phone:'1' }] });
  let updates = []; t.ctx.__upd = k => updates.push(k); t.ev('ROUTE.onUpdate = __upd');
  const a = sum(t);
  assert.ok(a.wait > 0 && a.real === 0, 'najprej ocena');
  assert.ok(a.warn.some(w => /nalagajo/.test(w)), 'opozorilo, da se podatki nalagajo');
  await t.ev('ROUTE.settle()');
  assert.ok(updates.includes('data'), 'obvestilo o novih podatkih');
  const b = sum(t);
  assert.strictEqual(b.wait, 0); assert.strictEqual(b.est, 0); assert.ok(b.real >= 3, 'vse relacije po cestah: ' + b.real);
  assert.ok(!b.warn.some(w => /nalagajo|niso dosegljivi/.test(w)));
  assert.ok(Math.abs(a.km - b.km) > 1, 'ocena in cestni podatek se razlikujeta (' + a.km.toFixed(1) + ' vs ' + b.km.toFixed(1) + ')');
  // km na poti tja mora biti vsota pravih cestnih razdalj
  const trip = b.crews[0].trips[0];
  const a1 = t.js(`geo('ZD Brežice')`), a2 = t.js(`geo('Dobova 25')`), a3 = t.js(`geo('UKC Ljubljana')`);
  const R = (x, y) => t.mock.roadKm([x.lon, x.lat], [y.lon, y.lat]);
  assert.ok(Math.abs(trip.km - R(a2, a3)) < 0.5, `${trip.km} vs ${R(a2, a3)}`);
  const n = t.mock.log.length; sum(t); sum(t); await sleep(250); assert.strictEqual(t.mock.log.length, n, 'brez dodatnih zahtevkov');
  assert.ok(b.sug.some(s => s.startsWith('road:')), 'predlog sporoča, da so vsi časi po cestah');
});
test('planer: Ljubljana in Novo mesto – pravi cestni časi določajo uro odhoda', async () => {
  const t = boot();
  day(t, { routing:true, rides:[
    { name:'Ana', from:'Bizeljsko 40', to:'SB Novo mesto', time:'10:00', phone:'1' },
    { name:'Boris', from:'Pišece 7', to:'UKC Ljubljana', time:'10:00', phone:'1' }], vehicles:['v13', 'c1'],
    duty:[{ name:'V1', team:'redna', role:'voznik' }, { name:'V2', team:'redna', role:'voznik' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const s = sum(t);
  assert.strictEqual(s.late, 0); assert.strictEqual(s.un.length, 0); assert.strictEqual(s.est, 0);
  const trips = s.crews.flatMap(c => c.trips);
  const nm = trips.find(x => x.dests.includes('SB Novo mesto')), lj = trips.find(x => x.dests.includes('UKC Ljubljana'));
  assert.ok(nm && lj, 'dve vožnji');
  assert.ok(lj.km > 90 && lj.km < 140 && nm.km > 50 && nm.km < 100, `km Lj ${lj.km.toFixed(0)}, NM ${nm.km.toFixed(0)}`);
  assert.ok(lj.dur > 55 && lj.dur < 110, 'trajanje do Ljubljane ' + lj.dur);
  assert.ok(lj.slack >= 15 && nm.slack >= 15, 'rezerva pred preiskavo ≥ 15 min');
  assert.ok(lj.depart < nm.depart + 120, 'ura odhoda je izračunana iz cestnega časa');
});

/* ------------------------------------------------------------------ planer: več ciljev, združevanje */
test('planer: sorodni cilji v Ljubljani so ena vožnja z vrstnim redom izstopov; osnovni razpored bi zamujal', async () => {
  const t = boot();
  const rides = [
    { name:'Ivan', from:'Dobova 25', to:'UKC Ljubljana', time:'08:45', phone:'1' },
    { name:'Marija', from:'Čatež ob Savi 12', to:'Onkološki inštitut Ljubljana', time:'09:00', phone:'1' },
    { name:'Franc', from:'Cesta prvih borcev 14, Brežice', to:'URI Soča Ljubljana', time:'09:00', phone:'1' }];
  day(t, { routing:true, rides, vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const opt = sum(t);
  const trip = opt.crews[0].trips;
  assert.strictEqual(trip.length, 1, 'ena vožnja'); assert.strictEqual(trip[0].dests.length, 3, 'trije cilji');
  assert.strictEqual(opt.late, 0); assert.strictEqual(opt.un.length, 0);
  assert.notStrictEqual(opt.variant, 'osnovni');
  // vsak pacient ima svojo rezervo do svoje ure preiskave
  Object.values(trip[0].info).forEach(i => assert.ok(i.slack >= 15, 'rezerva ' + i.slack));
  const drops = trip[0].stops.filter(s => s[0] === 'do').map(s => s[2]);
  assert.strictEqual(new Set(drops).size, 3);
  assert.ok(opt.sug.some(s => s.startsWith('merge:') && /URI Soča/.test(s)), 'predlog pojasni združitev');
  // osnovni (prvotni) algoritem: trije ločeni obiski z istim vozilom
  day(t, { routing:true, rides, vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], optimize:false });
  const base = sum(t);
  assert.strictEqual(base.variant, 'osnovni'); assert.ok(base.crews[0].trips.length >= 2, 'osnovni razpored: več vožnj');
  assert.ok(opt.km < base.km - 50, `optimizacija prihrani km: ${opt.km.toFixed(0)} vs ${base.km.toFixed(0)}`);
  assert.ok(opt.late < base.late || opt.un.length < base.un.length || base.late === 0, 'ni slabše');
});
test('planer: ODVOZ z več izhodišči (UKC + Onkološki) – čakanje je izračunano po urah pacientov', async () => {
  const t = boot();
  day(t, { routing:true, vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides:[
    { name:'Ana', from:'UKC Ljubljana', to:'Dobova 25', time:'11:00', phone:'1' },
    { name:'Boris', from:'Onkološki inštitut Ljubljana', to:'Čatež ob Savi 12', time:'11:20', phone:'1' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const s = sum(t), tr = s.crews[0].trips;
  assert.strictEqual(tr.length, 1); assert.strictEqual(tr[0].kind, 'from'); assert.strictEqual(tr[0].dests.length, 2);
  const pu = tr[0].stops.filter(x => x[0] === 'pu');
  assert.strictEqual(pu.length, 2, 'dve pobiranji');
  const ids = Object.values(tr[0].info); assert.ok(ids.every(i => i.pickT != null && i.dropT > i.pickT));
  assert.strictEqual(s.late, 0, 'noben pacient ne čaka predolgo');
});
test('planer: kapaciteta, tip prevoza in nosila (leže) – vozilo brez nosil ne pelje leže pacienta', async () => {
  const t = boot();
  day(t, { vehicles:['v13', 'c1'], duty:[{ name:'V1', team:'redna', role:'voznik' }, { name:'V2', team:'redna', role:'voznik' }], rides:[
    { name:'Leže', from:'Dobova 25', to:'UKC Ljubljana', time:'09:00', mode:'leze', phone:'1' }] });
  const s = sum(t);
  assert.strictEqual(s.un.length, 1); assert.ok(s.warn.some(w => /leže potrebuje 2 reševalca|nosil/.test(w)));
  // z vozilom z nosili in dvema reševalcema se razporedi
  day(t, { vehicles:['v04', 'v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }, { name:'V2', team:'redna', role:'spremljevalec' }], rides:[
    { name:'Leže', from:'Dobova 25', to:'UKC Ljubljana', time:'09:00', mode:'leze', phone:'1' }] });
  const s2 = sum(t); assert.strictEqual(s2.un.length, 0); assert.strictEqual(s2.crews[0].id, 'v04');
});
test('planer: primerna vozila – sede pacienta ne pelje vozilo z nosili, ko ga ta dan potrebuje leže pacient', async () => {
  const t = boot();
  const duty = [{ name:'V1', team:'redna', role:'voznik' }, { name:'V2', team:'redna', role:'spremljevalec' }, { name:'V3', team:'redna', role:'voznik' }, { name:'V4', team:'redna', role:'voznik' }];
  day(t, { vehicles:['v04', 'v13', 'c1'], duty, rides:[
    { name:'A', from:'Dobova 25', to:'SB Brežice', time:'09:00', phone:'1' }, { name:'Leže', from:'Pišece 7', to:'SB Brežice', time:'13:00', mode:'leze', phone:'1' }] });
  const s = sum(t); assert.strictEqual(s.un.length, 0); assert.strictEqual(s.late, 0);
  const carryingA = s.crews.find(c => c.trips.some(x => x.nrs.includes(1))).id, carryingL = s.crews.find(c => c.trips.some(x => x.nrs.includes(2))).id;
  assert.strictEqual(carryingL, 'v04', 'leže pacient: vozilo z nosili');
  assert.notStrictEqual(carryingA, 'v04', 'sede pacient ne zaseda vozila z nosili: ' + carryingA);
  assert.strictEqual(carryingA, 'c1', 'najmanjše primerno vozilo');
  day(t, { vehicles:['v04', 'v13', 'c1'], duty, optimize:false, rides:[
    { name:'A', from:'Dobova 25', to:'SB Brežice', time:'09:00', phone:'1' }, { name:'Leže', from:'Pišece 7', to:'SB Brežice', time:'13:00', mode:'leze', phone:'1' }] });
  assert.strictEqual(sum(t).variant, 'osnovni');
});

/* ------------------------------------------------------------------ konflikti, nerazporejeno, predlogi */
test('konflikti: isti pacient hkrati v dveh vozilih, dva termina v različnih mestih, nelogična ura odvoza', async () => {
  const t = boot();
  const duty = [{ name:'V1', team:'redna', role:'voznik' }, { name:'V2', team:'redna', role:'voznik' }];
  day(t, { vehicles:['v13', 'c1'], duty, rides:[
    { name:'Ivan Primer', from:'Dobova 25', to:'UKC Ljubljana', time:'09:00', phone:'1' },
    { name:'Ivan Primer', from:'Dobova 25', to:'SB Novo mesto', time:'09:00', phone:'1' },
    { name:'Zora', from:'Pišece 7', to:'SB Brežice – dializa', time:'09:00', phone:'1' },
    { name:'Zora', from:'SB Brežice – dializa', to:'Pišece 7', time:'09:05', phone:'1' }] });
  const s = sum(t);
  assert.ok(s.conf.includes('pacient-termina'), 'termina v Ljubljani in Novem mestu ob isti uri: ' + s.conf.join(','));
  assert.ok(s.conf.includes('cas-odvoza'), 'odvoz pred koncem preiskave: ' + s.conf.join(','));
  assert.ok(s.warn.some(w => /Ivan Primer: prevoza 1 \(UKC Ljubljana, 09:00\) in 2 \(SB Novo mesto, 09:00\)/.test(w)), s.warn.join('|'));
  // isti pacient hkrati v dveh vozilih (dva odvoza ob isti uri v različna naselja, dve vozili)
  day(t, { vehicles:['v13', 'c1'], duty, rides:[
    { name:'Marta', from:'SB Novo mesto', to:'Dobova 25', time:'12:00', phone:'1' },
    { name:'Marta', from:'SB Novo mesto', to:'Pišece 7', time:'12:00', phone:'1' }] });
  const s2 = sum(t); assert.ok(s2.conf.includes('pacient-dvojno'), s2.conf.join(','));
});
test('konflikti: prevoz v teku se ne prestavi na drugo vozilo; če vozila ni več, je opozorilo', async () => {
  const t = boot();
  const rides = [{ name:'A', from:'Dobova 25', to:'SB Brežice', time:'09:00', phone:'1', status:'na_poti', runKey:DATE + '_c1' },
                 { name:'B', from:'Čatež ob Savi 12', to:'SB Brežice', time:'09:00', phone:'1' }];
  day(t, { vehicles:['v13', 'c1'], duty:[{ name:'V1', team:'redna', role:'voznik' }, { name:'V2', team:'redna', role:'voznik' }], rides });
  const s = sum(t);
  const c1 = s.crews.find(c => c.id === 'c1'); assert.ok(c1 && c1.trips.some(x => x.nrs.includes(1)), 'prevoz 1 ostane pri C1');
  assert.ok(!s.conf.includes('zaklep'));
  day(t, { vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides });
  const s2 = sum(t); assert.ok(s2.warn.some(w => /že v teku pri vozilu, ki ni več v razporedu/.test(w)), s2.warn.join('|'));
});
test('nerazporejeno: izmena se konča prej – predlog podaljšanja; prosto vozilo brez posadke', async () => {
  const t = boot();
  day(t, { vehicles:['v13', 'c1'], duty:[{ name:'V1', team:'redna', role:'voznik', from:'06:00', to:'08:00' }], rides:[
    { name:'A', from:'Dobova 25', to:'UKC Ljubljana', time:'14:00', phone:'1' }], dayMode:'strogo' });
  const s = sum(t);
  assert.strictEqual(s.un.length, 1); assert.ok(s.un[0].shiftNeed > 0, 'koliko minut manjka');
  assert.ok(s.sug.some(x => x.startsWith('shift:') && /podaljšaj izmeno/.test(x)), s.sug.join('|'));
  // nerazporejen, ker nima posadke (sede), a je prosto vozilo
  day(t, { vehicles:['v13', 'c1'], duty:[], rides:[{ name:'A', from:'Dobova 25', to:'SB Brežice', time:'09:00', phone:'1' }] });
  const s2 = sum(t); assert.strictEqual(s2.un.length, 1); assert.ok(s2.warn.some(w => /Ni nobene posadke/.test(w)));
  assert.ok(s2.sug.some(x => x.startsWith('veh:') && /Prosta vozila brez posadke: Avto 13, C1/.test(x)), s2.sug.join('|'));
});
test('nerazporejeno: strogi način predlaga prilagoditev pravil', async () => {
  const t = boot();
  const rides = ['A', 'B', 'C', 'D', 'E'].map((n, i) => ({ name:n, from:['Dobova 25', 'Čatež ob Savi 12', 'Mostec 4', 'Globoko 6', 'Pišece 7'][i], to:'SB Brežice', time:'09:00', phone:'1' }));
  day(t, { vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides, dayMode:'strogo' });
  const s = sum(t);
  assert.ok(s.un.length + s.late >= 1, 'pet pacientov ob isti uri ne gre v vozilo s 4 običajnimi mesti: zamuda ali nerazporejen');
  assert.ok(s.sug.some(x => x.startsWith('bend:')), s.sug.join('|'));
  day(t, { vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides, dayMode:'samodejno' });
  assert.strictEqual(sum(t).un.length, 0, 'v samodejnem načinu se pravila prilagodijo');
});
test('ETA v živo: čas iz sporočenega koraka + cestni čas do naslednje točke', async () => {
  const t = boot();
  day(t, { routing:true, vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides:[{ name:'Ana', from:'Dobova 25', to:'UKC Ljubljana', time:'10:00', phone:'1' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const p = sum(t), st = p.crews[0].trips[0].stops;
  const got = t.js(`(() => { const a = ensureDay(${JSON.stringify(DATE)})[0]; const d = new Date(2026, 10, 10, 8, 0, 0); a.status = 'v_vozilu'; a.times = { v_vozilu:d.toISOString() };
    const e = liveEta(${JSON.stringify(DATE)}, a); return e; })()`);
  assert.ok(got && got.what === 'prihod na cilj');
  assert.ok(got.t > 8 * 60 + 55 && got.t < 8 * 60 + 130, 'ETA 8:00 + ~65 min: ' + got.t);
  const e2 = t.js(`(() => { const a = ensureDay(${JSON.stringify(DATE)})[0]; a.status = 'na_poti'; a.times = { na_poti:new Date(2026, 10, 10, 7, 0, 0).toISOString() }; return liveEta(${JSON.stringify(DATE)}, a); })()`);
  assert.strictEqual(e2.what, 'prihod k pacientu'); assert.ok(e2.t > 7 * 60 && e2.t < 7 * 60 + 40);
  assert.strictEqual(t.js(`(() => { const a = ensureDay(${JSON.stringify(DATE)})[0]; a.status = 'nova'; return liveEta(${JSON.stringify(DATE)}, a); })()`), null);
});
test('besedilo razporeda: cilji, ETA, km, vir podatkov', async () => {
  const t = boot();
  day(t, { routing:true, vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides:[
    { name:'Ivan', from:'Dobova 25', to:'UKC Ljubljana', time:'08:45', phone:'1' }, { name:'Marija', from:'Čatež ob Savi 12', to:'Onkološki inštitut Ljubljana', time:'09:00', phone:'1' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const txt = t.ev(`planText(${JSON.stringify(DATE)})`);
  assert.ok(/UKC Ljubljana/.test(txt) && /Onkološki/.test(txt) && /preiskava 08:45/.test(txt) && /vožnja: \d+ km/.test(txt));
  assert.ok(/po cestah \(OpenStreetMap\)/.test(txt)); assert.ok(!/~\d\d:\d\d/.test(txt), 'brez ocenjenih časov');
});
test('nastavitve: stari podatki dobijo privzete vrednosti za cestne podatke', () => {
  const t = boot();
  const o = t.js(`(() => { const s = mergeDefaults({ speed:45, road:1.3 }, defaultState().settings); return { on:s.routing.on, f:s.routing.factor, d:s.destMin, o:s.optimize }; })()`);
  assert.deepStrictEqual(o, { on:true, f:1, d:12, o:true });
});

/* ------------------------------------------------------------------ klinike, čakanje na pregled */
test('klinike: »UKC LJ – očesna klinika« je cilj s svojim ključem; ujemanje je najdaljše ime; lastna klinika in ustanova', () => {
  const t = boot();
  const g = s => t.js(`(() => { const g = geo(${JSON.stringify(s)}); return { kind:g.kind, label:g.label, key:g.key, stay:poiStay(g), extra:poiExtra(g), gq:g.poi && g.poi.gq }; })()`);
  assert.strictEqual(g('UKC LJ - očesna klinika').label, 'UKC Ljubljana – Očesna klinika');
  assert.strictEqual(g('UKC Ljubljana, Očesna klinika').key, 'poi:UKC Ljubljana – Očesna klinika');
  assert.strictEqual(g('ukc lj kardiološka amb.').label, 'UKC Ljubljana – Kardiološka ambulanta');
  assert.strictEqual(g('UKC Ljubljana').label, 'UKC Ljubljana');
  assert.strictEqual(g('UKC Ljubljana').extra, 10);
  assert.strictEqual(g('SB Celje – Očesni oddelek').label, 'SB Celje – Očesni oddelek');
  assert.strictEqual(g('UKC LJ - očesna klinika').stay, 45);
  assert.ok(/Očesna klinika, Grablovičeva ulica 46, Ljubljana/.test(g('UKC LJ - očesna klinika').gq));
  t.ev(`S.places.push({ id:'x1', parent:'SB Brežice', n:'Ortopedska ambulanta', al:['orto'], addr:'', lat:null, lon:null, stay:30, extra:null }); S.places.push({ id:'x2', parent:'', n:'Privatna klinika Test', al:[], addr:'Cesta 1, Krško', lat:null, lon:null, stay:20, extra:2 }); rev++;`);
  assert.strictEqual(g('SB Brežice orto').label, 'SB Brežice – Ortopedska ambulanta');
  assert.strictEqual(g('sb brezice – orto').stay, 30);
  assert.strictEqual(g('Privatna klinika Test').kind, 'neznano');        // lastna ustanova brez koordinat: Google jo razreši
  t.ev(`S.places.find(x => x.id === 'x2').lat = 46.0; S.places.find(x => x.id === 'x2').lon = 15.5; rev++;`);
  assert.strictEqual(g('Privatna klinika Test').kind, 'poi');
  assert.strictEqual(g('Dobova 25').kind, 'naselje');
});
test('čakanje na pregled: reševalec počaka, pacienta odpelje nazaj; čas, km in konec vožnje vključujejo vrnitev', async () => {
  const t = boot();
  day(t, { routing:true, vehicles:['v13'], rides:[
    { name:'Ana', from:'Dobova 25', to:'UKC LJ - očesna klinika', time:'10:00', phone:'1', stay:45 },
    { name:'Boris', from:'Dobova 30', to:'UKC LJ - očesna klinika', time:'10:30', phone:'1', stay:45 }, { name:'Cene', from:'Bizeljsko 4', to:'SB Brežice', time:'16:30', phone:'1' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const s = sum(t), tr = s.crews[0].trips;
  assert.strictEqual(s.late, 0); assert.strictEqual(s.un.length, 0);
  assert.strictEqual(tr.length, 2); assert.deepStrictEqual([...tr[0].nrs].sort(), [1, 2]);
  const st = tr[0].stops.map(x => x[0] + ':' + x[2]);
  assert.deepStrictEqual(st, ['pu:Dobova', 'pu:Dobova', 'do:UKC Ljubljana – Očesna klinika', 'pu:UKC Ljubljana – Očesna klinika', 'do:Dobova', 'do:Dobova'], st.join(','));
  assert.ok(tr[0].km > 220, 'km vključuje pot nazaj: ' + tr[0].km);                         // ~2 × 115 km
  const a = t.js(`computePlan(DATE0).assign`.replace('DATE0', JSON.stringify(DATE)));
  assert.ok(a.r1.retPickT >= 10 * 60 + 30 + 45 + 10 - 0.01, 'pacienta pobere šele po koncu pregleda (10:30 + 45 + 10 min): ' + a.r1.retPickT);
  assert.ok(a.r1.retT > a.r1.retPickT && a.r0.retT >= a.r0.retPickT);
  assert.ok(s.warn.some(w => /počaka na pregled približno/.test(w)), s.warn.join('|'));
  assert.ok(tr[0].end > tr[0].stops[2][1] + 100, 'konec vožnje je po vrnitvi');
  assert.ok(tr[1].start >= tr[0].end, 'naslednja vožnja šele po vrnitvi');
});
test('čakanje na pregled: en pacient čaka, drugi ne – posadka se vrne samo po prvega; ura vrnitve = ura pregleda + trajanje + pot od vhoda', async () => {
  const t = boot();
  day(t, { routing:true, vehicles:['v13'], rides:[
    { name:'Ana', from:'Dobova 25', to:'UKC LJ - kardiološka amb.', time:'09:00', phone:'1', stay:60 },
    { name:'Boris', from:'Dobova 30', to:'UKC LJ - kardiološka amb.', time:'09:00', phone:'1' }] });
  sum(t); await t.ev('ROUTE.settle()');
  const s = sum(t), tr = s.crews[0].trips[0];
  assert.deepStrictEqual(tr.stops.filter(x => x[0] === 'pu' && /Kardiološka/.test(x[2])).length, 1);
  const a = t.js(`computePlan(${JSON.stringify(DATE)}).assign`);
  assert.strictEqual(a.r0.retPickT, 9 * 60 + 60 + 10, 'vrnitev ob 10:10 (pregled 9:00 + 60 min + 10 min do izhoda)');
  assert.strictEqual(a.r1.retPickT, null); assert.strictEqual(s.late, 0);
});
test('časi nalaganja: leže in utila potrebujeta več časa kot sede (nastavljivo)', async () => {
  const mk = mode => { const t = boot(); day(t, { routing:true, vehicles:['v04'], duty:[{ name:'V', team:'redna', role:'voznik' }, { name:'E', team:'redna', role:'spremljevalec' }], rides:[{ name:'A', from:'Dobova 25', to:'SB Brežice', time:'09:00', phone:'1', mode }] }); sum(t); return t.ev('ROUTE.settle()').then(() => sum(t).crews.flatMap(c => c.trips)[0].dur); };
  const sede = await mk('sede'), leze = await mk('leze');
  assert.ok(Math.abs((leze - sede) - ((10 - 4) + (8 - 3))) < 0.01, `leže +${leze - sede} min`);
});
test('dializa: termin dopoldanska/popoldanska iz registra; stare skupine se pretvorijo; dializna posadka vozi po koncu dialize tudi sede prevoze', async () => {
  const t = boot();
  // migracija: stara skupina D2 → popoldanska, stare ure iz settings.dia
  t.ev(`S.patients.push(blankPatient({ name:'Stari', dia:'D2' })); S.settings.dia = { D1:{ start:'06:00', end:'10:00', days:[1,3,5] }, D2:{ start:'11:15', end:'15:15', days:[1,3,5] } }; normalizeState();`);
  assert.deepStrictEqual(t.js(`(() => { const p = S.patients.find(x => x.name === 'Stari'); return { t:p.dt.t, d:p.dt.d, dia:p.dia }; })()`), { t:'pop', d:[1, 3, 5] });
  assert.deepStrictEqual(t.js(`S.settings.diaT`), { dop:{ start:'06:00', end:'10:00' }, pop:{ start:'11:15', end:'15:15' } });
  assert.strictEqual(t.ev(`S.settings.dia`), undefined);
  // register: torek (2) = dopoldanska
  t.ev(`S.settings.diaT = { dop:{ start:'06:30', end:'10:30' }, pop:{ start:'11:30', end:'15:30' } };
    ['Milan','Vida','Tone'].forEach((n, i) => S.patients.push(blankPatient({ name:n, addr:['Dobova 5','Mostec 4','Čatež ob Savi 8'][i], phone:'1', dt:{ t:'dop', d:[2, 4, 6] } })));
    S.patients.push(blankPatient({ name:'Zora', addr:'Pišece 3', phone:'1', dt:{ t:'pop', d:[1, 3, 5] } }));`);
  assert.deepStrictEqual(t.js(`diaTermsFor(${JSON.stringify(DATE)})`), ['dop']);
  day(t, { routing:true, vehicles:['v13', 'v04'], rides:[
    { name:'Marko', from:'Bizeljsko 4', to:'SB Novo mesto', time:'12:30', phone:'1' }, { name:'Nina', from:'Pišece 7', to:'UKC Ljubljana', time:'08:30', phone:'1' }],
    duty:[{ name:'V1', team:'redna', role:'voznik', vehicleId:'v13', from:'05:00' }, { name:'V2', team:'redna', role:'voznik', vehicleId:'v04', from:'05:00' }] });
  t.ev(`S.vehicles.find(v => v.id === 'v13').fn = 'dializa'; normalizeState(); loadDialysis(${JSON.stringify(DATE)})`);
  assert.strictEqual(t.ev(`loadDialysis(${JSON.stringify(DATE)})`), 0, 'drugič ne dodaja podvojenih prevozov');
  assert.strictEqual(t.js(`ensureDay(${JSON.stringify(DATE)}).filter(r => r.dia).length`), 6);
  sum(t); await t.ev('ROUTE.settle()');
  const s = sum(t);
  assert.strictEqual(s.un.length, 0, s.warn.join('|')); assert.strictEqual(s.late, 0, s.warn.join('|'));
  assert.ok(!s.conf.includes('prekrivanje'));
  const dia = s.crews.find(c => c.id === 'v13');
  assert.ok(dia.trips.length >= 2, 'dializna posadka ima vožnje');
  const nrsOf = c => c.trips.flatMap(x => x.nrs);
  const sedeNrs = [1, 2]; const onDia = sedeNrs.filter(n => nrsOf(dia).includes(n));
  assert.ok(s.crews.every(c => c.trips.every((x, i, a) => !i || a[i - 1].end <= x.depart + 0.5)), 'vožnje posadke se ne prekrivajo');
  console.log('   (sede prevozi na dializni posadki: ' + (onDia.join(',') || 'nobeden') + '; različica: ' + s.variant + ')');
});
test('dializa: ena posadka – dializna jutranja vožnja, sede prevoz v vrzeli in vračanje z dialize brez zamude (polnjenje vrzeli)', async () => {
  const t = boot();
  t.ev(`['Milan','Vida'].forEach((n, i) => S.patients.push(blankPatient({ name:n, addr:['Dobova 5','Mostec 4'][i], phone:'1', dt:{ t:'dop', d:[2] } })));`);
  day(t, { routing:true, vehicles:['v13'], duty:[{ name:'V1', team:'redna', role:'voznik', from:'05:00' }], rides:[{ name:'Marko', from:'Bizeljsko 4', to:'SB Brežice', time:'08:30', phone:'1' }, { name:'Zala', from:'Pišece 7', to:'SB Brežice', time:'13:00', phone:'1' }] });
  t.ev(`S.vehicles.find(v => v.id === 'v13').fn = 'dializa'; loadDialysis(${JSON.stringify(DATE)})`);
  sum(t); await t.ev('ROUTE.settle()'); const s = sum(t);
  assert.strictEqual(s.un.length, 0, s.warn.join('|')); assert.strictEqual(s.late, 0, s.warn.join('|'));
  const trips = s.crews[0].trips; assert.ok(trips.length >= 3);
});

/* ------------------------------------------------------------------ Google: natančna kilometrina */
const GKEY = { key:'AIzaSyFAKE_KEY_FOR_TESTS_0123456789abcd' };
test('Google: zahtevek vsebuje samo naslova OD in DO (brez imen, telefona, ure); glave, maska polj, referrer; km = distanceMeters / 1000', async () => {
  const t = boot({ google:GKEY });
  const r = await t.ev(`GOOGLE.ride('Dobova 25', 'UKC LJ - očesna klinika')`);
  const L = t.gm.log[0];
  assert.strictEqual(L.url, 'https://routes.googleapis.com/directions/v2:computeRoutes'); assert.strictEqual(L.init.method, 'POST');
  assert.strictEqual(L.init.headers['X-Goog-Api-Key'], GKEY.key);
  assert.ok(/routes\.distanceMeters/.test(L.init.headers['X-Goog-FieldMask']) && !/\s/.test(L.init.headers['X-Goog-FieldMask']));
  assert.strictEqual(L.init.credentials, 'omit'); assert.strictEqual(L.init.referrerPolicy, 'strict-origin-when-cross-origin');
  assert.deepStrictEqual(L.body.origin, { address:'Dobova 25, Slovenija' });
  assert.deepStrictEqual(L.body.destination, { address:'Očesna klinika, Grablovičeva ulica 46, Ljubljana' });
  assert.strictEqual(L.body.travelMode, 'DRIVE'); assert.strictEqual(L.body.routingPreference, 'TRAFFIC_UNAWARE'); assert.strictEqual(L.body.regionCode, 'SI');
  assert.deepStrictEqual(Object.keys(L.body).sort(), ['destination', 'languageCode', 'origin', 'regionCode', 'routingPreference', 'travelMode', 'units']);
  assert.ok(r.km > 100 && r.km < 150 && r.min > 60, 'km ' + r.km);
  assert.ok(Array.isArray(r.f) && Array.isArray(r.t));
  await t.ev(`GOOGLE.ride('Dobova 25', 'UKC LJ - očesna klinika')`);
  assert.strictEqual(t.gm.log.length, 1, 'isti par: iz predpomnilnika');
  await Promise.all([t.ev(`GOOGLE.ride('Bizeljsko 4', 'SB Novo mesto')`), t.ev(`GOOGLE.ride('Bizeljsko 4', 'SB Novo mesto')`)]);
  assert.strictEqual(t.gm.log.length, 2, 'sočasna enaka zahtevka sta eden');
});
test('Google: hišna številka v cilju → vpisano besedilo (ne ime ustanove); tujina; brez ključa ni klica', async () => {
  const t = boot({ google:GKEY });
  assert.strictEqual(t.ev(`GOOGLE.queryOf('UKC Ljubljana, Zaloška cesta 2')`), 'UKC Ljubljana, Zaloška cesta 2, Slovenija');
  assert.strictEqual(t.ev(`GOOGLE.queryOf('Zagreb')`), 'KBC Zagreb, Kišpatićeva 12, Zagreb, Hrvaška');
  assert.strictEqual(t.ev(`GOOGLE.queryOf('Ilica 5, Zagreb')`), 'Ilica 5, Zagreb, Hrvaška');
  const n = boot({ google:{ key:'' } });
  assert.strictEqual(n.ev('GOOGLE.enabled()'), false);
  await assert.rejects(() => n.ev(`GOOGLE.ride('Dobova 25', 'SB Brežice')`), /ni vklopljen/);
  assert.strictEqual(n.gm.log.length, 0);
  t.ev(`S.settings.google.on = false`); assert.strictEqual(t.ev('GOOGLE.enabled()'), false);
});
test('Google: km prevoza se shrani v vpis, zastari ob spremembi naslova, ročni vnos ima prednost; čakanje na pregled šteje pot nazaj', async () => {
  const t = boot({ google:GKEY });
  day(t, { rides:[{ name:'Ana', from:'Dobova 25', to:'UKC LJ - očesna klinika', time:'10:00', phone:'031 111 222', stay:45 }, { name:'Boris', from:'Bizeljsko 4', to:'SB Brežice', time:'11:00' }] });
  const r = await t.ev(`KM.ensure(DATE0, 'r0')`.replace('DATE0', JSON.stringify(DATE)));
  assert.strictEqual(r.kmSrc, 'google'); assert.ok(r.km > 100); assert.ok(r.kmBack > 100, 'pot nazaj (DO → OD)');
  assert.strictEqual(t.gm.log.length, 2);
  const bodies = JSON.stringify(t.gm.log.map(x => x.body));
  assert.ok(!/Ana|031 111|10:00|Boris/.test(bodies), 'v zahtevku ni osebnih podatkov');
  const inf = t.js(`KM.info(rideById(${JSON.stringify(DATE)}, 'r0').r)`);
  assert.ok(inf.exact && inf.src === 'google' && Math.abs(inf.total - (inf.km + inf.back)) < 1e-9);
  t.ev(`rideById(${JSON.stringify(DATE)}, 'r0').r.to = 'SB Brežice'`);
  assert.strictEqual(t.js(`KM.info(rideById(${JSON.stringify(DATE)}, 'r0').r)`).exact, false, 'zastarelo po spremembi naslova');
  t.ev(`KM.setManual(${JSON.stringify(DATE)}, 'r0', '12,5')`);
  const m = t.js(`KM.info(rideById(${JSON.stringify(DATE)}, 'r0').r)`); assert.strictEqual(m.km, 12.5); assert.strictEqual(m.src, 'rocno');
  t.ev(`KM.setManual(${JSON.stringify(DATE)}, 'r0', '')`); assert.strictEqual(t.js(`KM.info(rideById(${JSON.stringify(DATE)}, 'r0').r)`).exact, false);
  // rezultat se zavrže, če se je besedilo med izračunom spremenilo
  const t2 = boot({ google:GKEY }); day(t2, { rides:[{ name:'C', from:'Dobova 25', to:'SB Brežice', time:'10:00' }] });
  const pr = t2.ev(`KM.ensure(${JSON.stringify(DATE)}, 'r0')`); t2.ev(`rideById(${JSON.stringify(DATE)}, 'r0').r.to = 'SB Novo mesto'`); assert.strictEqual(await pr, null);
  assert.strictEqual(t2.js(`rideById(${JSON.stringify(DATE)}, 'r0').r.km`), null);
});
test('Google: planer uporabi natančne koordinate (hišni naslov, ne središče naselja); hišne točke niso v trajnem predpomnilniku poti', async () => {
  const mem = new Map(); const t = boot({ google:GKEY, mem });
  day(t, { routing:true, vehicles:['v13'], rides:[{ name:'Ana', from:'Dobova 25', to:'SB Brežice', time:'10:00', phone:'1' }, { name:'Boris', from:'Dobova 30', to:'SB Brežice', time:'10:00', phone:'1' }] });
  const before = t.js(`computePlan(${JSON.stringify(DATE)}).pending.map(r => r.from.key)`);
  assert.deepStrictEqual(before, ['n:Dobova', 'n:Dobova']);
  await t.ev(`KM.day(${JSON.stringify(DATE)})`);
  const after = t.js(`computePlan(${JSON.stringify(DATE)}).pending.map(r => ({ k:r.from.key, ex:r.from.exact, lat:r.from.lat }))`);
  assert.ok(after.every(x => /^g:45\.[89]/.test(x.k) && x.ex), JSON.stringify(after)); assert.notStrictEqual(after[0].k, after[1].k, 'dve hiši = dve točki');
  sum(t); await t.ev('ROUTE.settle()'); t.ev('ROUTE.persist()');
  const stored = mem.get('kp.route.v1'); assert.ok(stored && stored.length > 20, 'predpomnilnik poti ima splošne točke (preizkus ni prazen)');
  assert.ok(!/45\.8992|45\.9003|15\.6572|15\.6590/.test(stored), 'hišni naslov (Google koordinata) ni shranjen v trajni predpomnilnik');
  const s = sum(t); assert.strictEqual(s.un.length, 0); assert.strictEqual(s.late, 0);
});
test('Google: napake – 403, 429, brez povezave, ni poti: razumljivo sporočilo, brez zanke; po 403 samodejni izračun počiva', async () => {
  const t = boot({ google:GKEY, gmock:{ fail:(n, b) => (b.origin.address || '').startsWith('Pišece') ? { status:403, message:'Requests from referer https://x.github.io/ are blocked.', gstatus:'PERMISSION_DENIED' } : null } });
  await assert.rejects(() => t.ev(`GOOGLE.ride('Pišece 3', 'SB Brežice')`), /referrer|HTTP referrer|dovoljen/i);
  assert.strictEqual(t.ev('GOOGLE.info().status'), 'error'); assert.strictEqual(t.gm.log.length, 1, '403 se ne ponavlja');
  assert.strictEqual(t.ev('GOOGLE.auto()'), false, 'po zavrnitvi ključa samodejni izračun počiva');
  const t2 = boot({ google:GKEY, gmock:{ fail:n => n < 3 ? { status:429, gstatus:'RESOURCE_EXHAUSTED' } : null } });
  const r = await t2.ev(`GOOGLE.ride('Dobova 25', 'SB Brežice')`); assert.ok(r.km > 0); assert.strictEqual(t2.gm.log.length, 3, '2 × 429 → ponovni poskus uspe');
  const t3 = boot({ google:GKEY, gmock:{ fail:() => 'throw' } });
  await assert.rejects(() => t3.ev(`GOOGLE.ride('Dobova 25', 'SB Brežice')`), /povezave/); assert.ok(t3.gm.log.length <= 3);
  const t4 = boot({ google:GKEY });
  await assert.rejects(() => t4.ev(`GOOGLE.ride('Neznan kraj 5', 'SB Brežice')`), /ne najde poti/);
  const tt = await boot({ google:GKEY }).ev('GOOGLE.test()'); assert.strictEqual(tt.ok, true); assert.ok(tt.km > 80 && tt.km < 160);
  const bad = await boot({ google:{ key:'' } }).ev('GOOGLE.test()'); assert.strictEqual(bad.ok, false);
});
test('kilometrina: mesečno poročilo (km po prevozih, vozilih, vir), CSV z BOM in decimalno vejico; brez Googla ceste OSM ali ocena', async () => {
  const t = boot({ google:GKEY });
  day(t, { routing:true, vehicles:['v13'], rides:[{ name:'Ana', from:'Dobova 25', to:'UKC LJ - očesna klinika', time:'10:00', phone:'1', stay:45 }, { name:'Boris', from:'Bizeljsko 4', to:'SB Brežice', time:'16:00', phone:'1' }] });
  await t.ev(`KM.day(${JSON.stringify(DATE)})`);
  const rep = t.js(`KM.month(2026, 10)`);
  assert.strictEqual(rep.rows.length, 2);
  const a = rep.rows[0].i; assert.ok(a.exact && a.total > 2 * 100 && Math.abs(a.total - (a.km + a.back)) < 1e-9);
  assert.ok(Math.abs(rep.total - rep.rows.reduce((x, r) => x + r.i.total, 0)) < 1e-6); assert.strictEqual(rep.missing, 0);
  assert.ok(rep.veh['Avto 13'] > 200 && rep.days.length === 1);
  const csv = t.ev(`KM.csv(2026, 10, true)`); assert.ok(csv.startsWith('﻿datum;št.;ura;pacient;od;do;način;km OD→DO'), csv.slice(0, 60));
  assert.ok(/Ana;Dobova 25;UKC LJ - očesna klinika;Sede;\d+,\d;\d+,\d;\d+,\d;Google;Avto 13/.test(csv), csv);
  assert.ok(!/Ana/.test(t.ev(`KM.csv(2026, 10, false)`)), 'CSV brez imen pacientov');
  const n = boot({ google:{ key:'' } }); day(n, { routing:true, rides:[{ name:'C', from:'Dobova 25', to:'SB Brežice', time:'10:00' }] }); await n.ev('ROUTE.settle && ROUTE.settle()'); sum(n); await n.ev('ROUTE.settle()');
  const inf = n.js(`KM.info(rideById(${JSON.stringify(DATE)}, 'r0').r)`); assert.ok(inf.src === 'osrm' || inf.src === 'ocena'); assert.strictEqual(inf.exact, false);
});

/* ------------------------------------------------------------------ dispečerski žargon, hitri vnos, kopiranje in ponavljanje */
test('hitri vnos: dispečerski žargon (OI LJ, O.I. LJ, SBB, Doma, ob 9.30, leže, vzorci) razbere ime, od, do, uro, način', async () => {
  const t = boot();
  t.ev(`S.patients.push(blankPatient({ name:'Ivan Novak', addr:'Dobova 25', phone:'031111111', mode:'sede' }))`);
  const q = x => t.js(`parseQuick(${JSON.stringify(x)})`);
  let p = q('Ivan Novak, Doma, OI LJ, 8:00');
  assert.strictEqual(p.name, 'Ivan Novak'); assert.strictEqual(p.from, 'Dobova 25', '»Doma« → naslov pacienta iz baze'); assert.strictEqual(p.to, 'OI LJ'); assert.strictEqual(p.time, '08:00'); assert.ok(p.pid);
  p = q('Pacient 08, Dobova 14, O.I. LJ, 08:00'); assert.deepStrictEqual([p.name, p.from, p.to, p.time], ['Pacient 08', 'Dobova 14', 'O.I. LJ', '08:00'], 'ime s številko ni naslov');
  p = q('Marija Horvat; Brežice, Cesta svobode 10 > UKC LJ; ob 9.30; leže'); assert.deepStrictEqual([p.name, p.from, p.to, p.time, p.mode], ['Marija Horvat', 'Brežice, Cesta svobode 10', 'UKC LJ', '09:30', 'leze'], 'z ločilom ; ali > se vejice v naslovu ohranijo');
  p = q('Pacient 10, Doma, Dializa KK, 7:00, utila'); assert.deepStrictEqual([p.name, p.from, p.to, p.time, p.mode], ['Pacient 10', 'Doma', 'Dializa KK', '07:00', 'utila']);
  p = q('Pacient 11, Velika Dolina 2, SB B. – krg. amb., 14:00'); assert.strictEqual(p.to, 'SB B. – krg. amb.'); assert.strictEqual(p.from, 'Velika Dolina 2');
  p = q('Novak Ivan Dobova 25 OI LJ 8:00'); assert.deepStrictEqual([p.name, p.from, p.to, p.time], ['Ivan Novak', 'Dobova 25', 'OI LJ', '08:00'], 'brez ločil: ime po bazi, cilj kot ustanova');
  p = q('vzorci, IMI LJ, 10:00'); assert.deepStrictEqual([p.mode, p.to, p.time, p.name], ['vzorci', 'IMI LJ', '10:00', '']);
  p = q('Pacient 02, Veliki Obrež 2, UKC LJ, 10, brez spremljevalca'); assert.deepStrictEqual([p.from, p.to, p.time, p.note], ['Veliki Obrež 2', 'UKC LJ', '10:00', 'brez spremljevalca']);
  p = q('Pacient 12, SBB, Dobova 7, 15:00'); assert.deepStrictEqual([p.from, p.to], ['SBB', 'Dobova 7'], 'ustanova pred naslovom = odvoz');
  p = q('Pacient 09, Levstikova 12, OI LJ 8'); assert.deepStrictEqual([p.from, p.to, p.time], ['Levstikova 12', 'OI LJ', '08:00'], 'ura na koncu cilja');
  assert.strictEqual(q('').ok, false);
});
test('hitri vnos: prevoz pride v prvo prosto polje, pacient iz baze dobi telefon in nalog, ustanova je prepoznana', async () => {
  const t = boot();
  t.ev(`S.patients.push(blankPatient({ name:'Ivan Novak', addr:'Dobova 25', phone:'031111111', mode:'sede' }))`);
  const r = t.js(`(() => { const r = addQuickRide('${DATE}', parseQuick('Ivan Novak, Doma, OI LJ, 8:00')); return { id:r.id, name:r.name, from:r.from, to:r.to, time:r.time, phone:r.phone, mode:r.mode, nr:rideById('${DATE}', r.id).nr, pid:r.patientId, g:geo(r.to).kind }; })()`);
  assert.deepStrictEqual([r.name, r.from, r.to, r.time, r.phone, r.nr, r.g], ['Ivan Novak', 'Dobova 25', 'OI LJ', '08:00', '031111111', 1, 'poi']); assert.ok(r.pid);
  t.ev(`addQuickRide('${DATE}', parseQuick('Pacient 02, Veliki Obrež 2, UKC LJ, 10:00'))`);
  assert.strictEqual(t.js(`filledRides('${DATE}').map(x => x.nr)`).join(), '1,2');
});
test('kopiranje z drugega dne in ponavljanje: polja, preskok podvojenih, samo delovni dnevi, brez stanja', async () => {
  const t = boot();
  t.ev(`(() => { const a = ensureDay('2026-11-09'); Object.assign(a[0], blankRide(), { id:a[0].id, name:'A', from:'Dobova 25', to:'OI LJ', time:'08:00', note:'brez spremljevalca', done:true, status:'v_vozilu', odpovedano:false });
    Object.assign(a[1], blankRide(), { id:a[1].id, name:'B', from:'Pišece 7', to:'UKC LJ', time:'10:00', odpovedano:true }); })()`);
  let res = t.js(`copyRides('2026-11-09', '${DATE}')`); assert.strictEqual(res.n, 1, 'odpovedan prevoz se ne kopira');
  const c = t.js(`ensureDay('${DATE}')[0]`); assert.deepStrictEqual([c.name, c.from, c.to, c.time, c.note, c.done, c.status], ['A', 'Dobova 25', 'OI LJ', '08:00', 'brez spremljevalca', false, 'nova']);
  res = t.js(`copyRides('2026-11-09', '${DATE}')`); assert.strictEqual(res.n, 0); assert.strictEqual(res.skipped, 1, 'podvojen prevoz se preskoči');
  // ponovi: torek 10.11. → sreda, četrtek, petek (do konca tedna), sobota/nedelja se preskočita
  const id = c.id; let rr = t.js(`repeatRide('${DATE}', '${id}', 'week')`); assert.deepStrictEqual(rr.dates, ['2026-11-11', '2026-11-12', '2026-11-13']);
  rr = t.js(`repeatRide('${DATE}', '${id}', 'week')`); assert.strictEqual(rr.n, 0, 'ponovitev ne podvaja');
  const five = t.js(`repeatDates('2026-11-13', 'five')`); assert.deepStrictEqual(five, ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'], 'od petka: pon–pet');
  assert.deepStrictEqual(t.js(`repeatDates('2026-11-13', 'next')`), ['2026-11-16']);
});

test('žargon ustanov: O.I. LJ, SBB, ZD KK, IMI LJ; ulice v Brežicah brez kraja; Dolenja vas', async () => {
  const t = boot();
  const g = x => t.js(`(() => { const p = geo(${JSON.stringify(x)}); return { kind:p.kind, label:p.label }; })()`);
  assert.ok(/Onkolo/.test(g('O.I. LJ').label) && g('O.I. LJ').kind === 'poi', 'O.I. LJ');
  assert.ok(/Onkolo/.test(g('OI LJ').label)); assert.ok(/Onkolo/.test(g('Lj - Onkološko').label));
  assert.ok(/SB Bre/.test(g('SBB').label), 'SBB'); assert.ok(/SB Bre/.test(g('SB B. – krg. amb.').label), 'SB B. – krg. amb.');
  assert.ok(/Kr[sš]ko/.test(g('ZD KK zobar').label), 'ZD KK'); assert.ok(/IMI|Mikrobiolog/.test(g('IMI LJ').label), 'IMI LJ');
  assert.strictEqual(g('Cankarjeva 5').label, 'Brežice', 'ulica v Brežicah brez imena kraja'); assert.strictEqual(g('Levstikova 12').kind, 'naselje');
  assert.notStrictEqual(g('Dolenja vas 2 pri Artičah').kind, 'neznano');
  assert.ok(/Brežice|ZD/.test(g('ZD').label) && g('ZD').kind === 'poi', 'sam »ZD« je ZD Brežice');
});
test('vzorci: vožnja brez pacienta ne zaseda sedeža in se pripelje z istim vozilom kot pacienti v isto mesto', async () => {
  const t = boot();
  day(t, { vehicles:['c1'], duty:[{ name:'V1', team:'redna', role:'voznik' }], rides:[
    { name:'Ana', from:'Dobova 25', to:'UKC Ljubljana', time:'10:00', phone:'1', mode:'sede' },
    { name:'Vzorci IMI', from:'', to:'IMI Ljubljana', time:'', phone:'', mode:'vzorci' }] });
  const s = sum(t); assert.strictEqual(s.un.length, 0, 'vzorci ne zasedejo sedeža (c1 ima 2 sedeža)');
  const idA = t.js(`computePlan('${DATE}').assign['r0'].crewId`), idV = t.js(`computePlan('${DATE}').assign['r1'] && computePlan('${DATE}').assign['r1'].crewId`);
  assert.strictEqual(idA, idV, 'ista posadka');
});
test('NN ekipa: dolge vožnje (nad nastavljenim polmerom) prednostno redna posadka', async () => {
  const mk = lim => { const t = boot(); day(t, { vehicles:['v13', 'c1'], settings:{ nnMaxKm:lim }, duty:[{ name:'Redna', team:'redna', role:'voznik' }, { name:'NN1', team:'NN', role:'voznik' }, { name:'NN2', team:'NN', role:'spremljevalec' }], rides:[
    { name:'Ana', from:'Dobova 25', to:'UKC Ljubljana', time:'09:00', phone:'1' }] }); return t; };
  const t1 = mk(60); sum(t1); const c1 = t1.js(`computePlan('${DATE}').assign['r0'].crewId`);
  assert.strictEqual(c1, 'v13', 'redna posadka vozi v Ljubljano, ko je prosta: ' + c1);
});

test('dializni center: »Dializa KK« je privzeto dializni center v Krškem, nastavitev ga preusmeri na izbrano ustanovo', async () => {
  const t = boot();
  const lab = () => t.js(`geo('Dializa KK')`).label;
  assert.strictEqual(lab(), 'Dializni center Krško', 'privzeto: ' + lab());
  assert.strictEqual(t.js(`geo('Nefrodial KK').label`), 'Dializni center Krško');
  assert.strictEqual(t.js(`geo('SB Brežice – dializa').label`), 'SB Brežice – dializa', 'dializa v SB Brežice ostane na voljo');
  t.ev(`S.settings.diaPlace = 'ZD Krško'`);
  assert.strictEqual(lab(), 'ZD Krško', 'po nastavitvi: ' + lab());
  assert.strictEqual(t.js(`geo('dializa').label`), 'ZD Krško');
  t.ev(`S.settings.diaPlace = 'SB Brežice – dializa'`);
  assert.strictEqual(lab(), 'SB Brežice – dializa');
  t.ev(`S.settings.diaPlace = ''`); assert.strictEqual(lab(), 'Dializni center Krško');
});

/* ------------------------------------------------------------------ resnični dnevi (anonimizirano) */
const REAL = require('./real-days.js');
const planMap = (t, date) => t.js(`(() => { const p = computePlan('${date}'); const m = {}; p.crews.forEach(c => c.trips.forEach(tr => tr.rides.forEach(r => { m[r.nr] = c.vehicle.name; }))); return { m, un:p.unassigned.length, trips:p.crews.map(c => c.trips.length) }; })()`);

test('resnični dnevi (10 dni iz papirne knjige, anonimizirano): razpored se z dispečerjevim ujema v ≥ 70 % parov (dneva 6 in 9 skoraj popolnoma), po lastni oceni pa je vsaj tako dober kot dispečerjev', async () => {
  let ok = 0, pairs = 0; const per = {}, T = { a:0, d:0, am:0, dm:0 };
  for (const k of Object.keys(REAL.DAYS)){
    const day = REAL.DAYS[k], t = boot();
    REAL.setup(t.ev, day);
    const r = planMap(t, day.date); assert.strictEqual(r.un, 0, `dan ${day.date}: nerazporejeni prevozi`);
    const a = REAL.agreement(day, r.m); per[k] = a.share; ok += a.ok; pairs += a.pairs;
    const sa = REAL.planStats(t.ev, day.date), t2 = boot(); REAL.setup(t2.ev, day); REAL.pinReal(t2.ev, day); const sd = REAL.planStats(t2.ev, day.date);
    if (!sd.un){ T.a += sa.obj; T.d += sd.obj; T.am += sa.lateMin; T.dm += sd.lateMin; }
  }
  assert.ok(ok / pairs >= 0.7, 'ujemanje ' + (100 * ok / pairs).toFixed(1) + ' % (' + JSON.stringify(per) + ')');
  assert.ok(per[6] >= 0.95 && per[9] >= 0.95, 'dneva 6 in 9: ' + JSON.stringify(per));
  assert.ok(Object.values(per).every(x => x >= 0.5), 'dan z ujemanjem pod 50 %: ' + JSON.stringify(per));
  assert.ok(T.a <= T.d && T.am <= T.dm, `ocena aplikacije ${T.a} (zamude ${T.am} min) proti dispečerjevi ${T.d} (zamude ${T.dm} min)`);
});

test('žargon s strani knjige: Stara vas, Zakot, Ginekolog LJ, Poliklinika LJ, SB Trbovlje, ZD Sevnica, KT, ITP, Carlos/Spar; kratice dobijo tudi že shranjene klinike', async () => {
  const t = boot(); const g = s => t.js(`geo(${JSON.stringify(s)})`);
  assert.ok(/Bizeljsko/.test(g('Stara vas 4').label), 'Stara vas'); assert.strictEqual(g('Zakot').label, 'Brežice', 'Zakot je del Brežic');
  assert.ok(/Ginekolo/.test(g('Ginekolog LJ').label), 'Ginekolog LJ: ' + g('Ginekolog LJ').label); assert.ok(/UKC/.test(g('Poliklinika LJ').label), 'Poliklinika LJ');
  assert.ok(/Trbovlje/.test(g('SB Trbovlje UZ AVF').label) && g('SB Trbovlje').kind === 'poi', 'SB Trbovlje'); assert.ok(/Sevnica/.test(g('ZD Sevnica kardiolog').label), 'ZD Sevnica');
  assert.ok(/SB Bre/.test(g('KT').label) && /SB Bre/.test(g('ITP').label), 'KT, ITP');
  assert.ok(g('Carlos/Spar').kind === 'poi' && /Spar/.test(g('Carlos/Spar').label), 'Carlos/Spar');
  assert.ok(/Ginekolo/.test(g('ORL klinika LJ').label) === false && /ORL/.test(g('ORL klinika LJ').label), 'ORL klinika LJ ostane ORL');
  t.ev(`S.places.find(x => x.n === 'Ginekološka klinika').al = ['ginekologija']; delete S.settings.v4; normalizeState();`);
  assert.ok(t.js(`S.places.find(x => x.n === 'Ginekološka klinika').al`).includes('ginekolog'), 'migracija doda kratico že shranjeni kliniki');
});

test('dializa brez ure (v knjigi »Dop« / »Pop«): ura termina iz Nastavitve → Dializa, tja = začetek, nazaj = konec', async () => {
  const t = boot();
  day(t, { vehicles:['v13'], rides:[
    { name:'A', from:'Dobova', to:'Dializa KK', time:'', dia:'dop', phone:'1' }, { name:'B', from:'Dobova', to:'Dializa KK', time:'', dia:'pop', phone:'1' },
    { name:'C', from:'Dializa KK', to:'Dobova', time:'', dia:'dop', phone:'1' }] });
  const T = t.js(`computePlan('${DATE}').pending.map(r => [r.name, r.time, r.timeTxt])`);
  assert.deepStrictEqual(T.map(x => x[1]), [390, 690, 630], JSON.stringify(T));
  assert.deepStrictEqual(T.map(x => x[2]), ['06:30', '11:30', '10:30']);
});

test('oddaljeni cilji: ena vožnja v Ljubljano tudi pri razponu ur do 180 min, če ni prostega drugega vozila (windowFar); brez tega dve vožnji', async () => {
  const rides = [['A', '08:00'], ['B', '08:45'], ['C', '09:30'], ['D', '11:00']].map(([n, h]) => ({ name:n, from:'Dobova', to:'O.I. LJ', time:h, phone:'1' }));
  const mk = far => { const t = boot(); day(t, { vehicles:['v13'], settings:{ windowFar:far }, rides }); return t.js(`computePlan('${DATE}').crews.map(c => c.trips.length)`); };
  assert.deepStrictEqual(mk(180).filter(x => x), [1], 'z oknom 180: ena vožnja');
  assert.deepStrictEqual(mk(0).filter(x => x), [2], 'brez okna: dve vožnji');
});

test('hitri vnos: Dop / Pop (termin dialize), Vzemi vzorce za IMI, opombe javijo uro / prej pokliči', async () => {
  const t = boot(); const q = x => t.js(`parseQuick(${JSON.stringify(x)})`);
  let p = q('Pacient 49, Doma, Dializa KK, pop, utila'); assert.deepStrictEqual([p.dia, p.time, p.mode, p.to], ['pop', '', 'utila', 'Dializa KK']);
  p = q('Vzemi vzorce za IMI LJ'); assert.deepStrictEqual([p.mode, p.to, p.name], ['vzorci', 'IMI LJ', '']);
  p = q('Pacient 95, KT, Stara vas, javijo uro'); assert.deepStrictEqual([p.from, p.to, p.note], ['KT', 'Stara vas', 'javijo uro']);
  p = q('Pacient 73, Carlos/Spar, O.I. LJ, 11:00, prej pokliči'); assert.deepStrictEqual([p.from, p.to, p.time, p.note], ['Carlos/Spar', 'O.I. LJ', '11:00', 'prej pokliči']);
  t.ev(`S.settings.routing.on = false`); const r = t.js(`(() => { const x = addQuickRide('${DATE}', parseQuick('Pacient 49, Doma, Dializa KK, pop, utila')); return { dia:x.dia, mode:x.mode, time:x.time }; })()`);
  assert.deepStrictEqual([r.dia, r.mode, r.time], ['pop', 'utila', '']);
});

test('besedišče iz knjige (7.–22. 10., 12. 11.): DSO Loka ≠ DSO Brežice, zdravilišča, kliniki v Ljubljani, naselja z drugačnim zapisom', async () => {
  const t = boot(); const g = x => t.js(`geo(${JSON.stringify(x)}).label`);
  assert.strictEqual(g('DSO Loka'), 'DSO Loka'); assert.strictEqual(g('DSO BR'), 'DSO Brežice'); assert.strictEqual(g('DSO'), 'DSO Brežice');
  assert.strictEqual(g('Šmarješke Toplice'), 'Šmarješke Toplice'); assert.strictEqual(g('Zdravilišče Laško'), 'Zdravilišče Laško'); assert.strictEqual(g('Terme Čatež'), 'Terme Čatež');
  assert.strictEqual(g('Stomatološka klinika LJ'), 'Stomatološka klinika Ljubljana');
  assert.ok(/Dermatovenerološka/.test(g('Dermatološka klinika LJ')), g('Dermatološka klinika LJ'));
  assert.strictEqual(g('UKC Maribor'), 'UKC Maribor');
  assert.strictEqual(g('Orešje'), 'Orešje na Bizeljskem'); assert.strictEqual(g('Gornje Skopice'), 'Gorenje Skopice');
  const p = t.js(`parseQuick('Pacient 5, Globoko, Dializa KK, dop, utila, dodatna dializa')`);
  assert.deepStrictEqual([p.dia, p.mode, p.note], ['dop', 'utila', 'dodatna dializa']);
});

test('dializa ob 6.30 je pravočasna in prva v dnevu vozila (pred drugimi vožnjami istega vozila)', async () => {
  const t = boot(); const d = DATE;
  t.ev(`S.settings.routing.on = false; S.vehicles = [{ id:'vN', name:'N1', tip:'resevalni', ns:'oboje', sede:2, leze:1, utila:2, skupaj:4, sedeMax:3, lezeMax:1, utilaMax:2, skupajMax:4, aktiv:true }]; S.duty['${d}'] = [{ id:'d1', staffId:'', name:'Voznik N', team:'redna', role:'voznik', from:'', to:'', ot:0, vehicleId:'' }]; S.dayRules['${d}'] = { mode:'samodejno' };
    const a = ensureDay('${d}'); const add = (i, o) => Object.assign(a[i], blankRide(), o, { id:'r' + i });
    add(0, { name:'Pacient 1', from:'Brežice', to:'SB Novo mesto', time:'08:20', mode:'sede' }); add(1, { name:'Pacient 2', from:'Doma', to:'Dializa KK', time:'', mode:'utila', dia:'dop' }); add(2, { name:'Pacient 3', from:'Doma', to:'Dializa KK', time:'', mode:'utila', dia:'dop' }); rev++; PLAN_CACHE.clear();`);
  const r = JSON.parse(t.js(`JSON.stringify(computePlan('${d}').crews.flatMap(c => c.trips.map(x => ({ dia:x.rides.some(r => r.dia), late:x.late || 0, start:x.start }))))`));
  const dia = r.filter(x => x.dia), other = r.filter(x => !x.dia);
  assert.ok(dia.length && dia.every(x => x.late <= 30), 'dializa zamuja: ' + JSON.stringify(r));
  assert.ok(dia.every(x => other.every(o => x.start <= o.start)), 'dializa ni prva: ' + JSON.stringify(r));
});

/* ------------------------------------------------------------------ brezplačna natančna kilometrina (OSM naslovi + OSRM) */
const D = JSON.stringify(DATE);
test('Naslovi: zahtevek Nominatim vsebuje samo besedilo naslova (brez imen, telefona, ure); omejitev na kraj, brez piškotkov; točka je hišna', async () => {
  const t = boot();
  day(t, { rides:[{ name:'Ana Novak', from:'Dobova 25', to:'SB Brežice', time:'10:00', phone:'031 111 222' }] });
  const res = await t.ev(`GEOC.resolve('Dobova 25')`);
  assert.strictEqual(res.prec, 'hisna'); assert.ok(Math.abs(res.lat - 45.8991) < 1e-6 && Math.abs(res.lon - 15.6572) < 1e-6);
  assert.strictEqual(t.nm.log.length, 1);
  const L = t.nm.log[0], u = new URL(L.url);
  assert.strictEqual(u.origin + u.pathname, 'https://nominatim.test/search');
  assert.strictEqual(u.searchParams.get('q'), 'Dobova 25'); assert.strictEqual(u.searchParams.get('format'), 'jsonv2'); assert.strictEqual(u.searchParams.get('countrycodes'), 'si');
  assert.strictEqual(u.searchParams.get('bounded'), '1', 'prepoznan kraj → iskanje samo v njegovi okolici');
  assert.strictEqual(L.init.credentials, 'omit'); assert.strictEqual(L.init.referrerPolicy, 'strict-origin-when-cross-origin', 'Referer je potreben po pravilih Nominatim'); assert.ok(!L.init.headers, 'brez posebnih glav');
  assert.ok(!/Ana|Novak|031|10:00|Brežice/.test(decodeURIComponent(L.url.split('q=')[1])), 'v poizvedbi ni osebnih podatkov: ' + L.url);
});
test('Naslovi: natančnost točke (hišna, samo ulica, zadetek v drugem kraju, kraj ni naveden, naselje brez številke, ustanova brez klica)', async () => {
  const t = boot();
  const get = async a => JSON.parse(await t.ev(`GEOC.resolve(${JSON.stringify(a)}).then(r => JSON.stringify(r))`));
  assert.strictEqual((await get('Cesta prvih borcev 18, Brežice')).prec, 'hisna');
  const ul = await get('Dobova 99'); assert.strictEqual(ul.prec, 'ulica'); assert.ok(/hišne številke/.test(ul.warn));
  const far = await get('Prešernova 5, Brežice');      // isto ime ulice v Mariboru: zavrnjeno, ostane središče naselja
  assert.strictEqual(far.prec, 'naselje'); assert.ok(/ni v OSM/.test(far.warn)); assert.ok(Math.abs(far.lat - 45.9) < 0.05, 'središče Brežic, ne Maribor');
  const unc = await get('Selice 3'); assert.strictEqual(unc.prec, 'nejasno', 'kraj ni prepoznan: ni zaupanja'); assert.ok(/preveri točko/.test(unc.warn));
  const n0 = t.nm.log.length;
  assert.strictEqual((await get('Dobova')).prec, 'naselje');
  const poi = await get('SB Brežice'); assert.strictEqual(poi.prec, 'ustanova'); assert.strictEqual(poi.src, 'poi');
  assert.strictEqual(t.nm.log.length, n0, 'naselje brez številke in ustanova ne zahtevata iskanja');
  await assert.rejects(t.ev(`GEOC.resolve('Doma')`), /ni prepoznan/);
  assert.strictEqual(t.js(`GEOC.analyse('Doma').mode`), 'unknown'); assert.strictEqual(t.nm.log.length, n0);
  // hrvaški naslov: countrycodes=hr
  const hr = await get('Ulica 5, Zagreb'); assert.strictEqual(hr.prec, 'hisna'); assert.strictEqual(new URL(t.nm.log[t.nm.log.length - 1].url).searchParams.get('countrycodes'), 'hr');
});
test('Naslovi: vrsta (1 zahtevek naenkrat, razmik), pomnilnik seje, pacient shrani točko in je ne išče znova, ročni popravek ima prednost', async () => {
  const t = boot({ nmock:{ delay:5 } }); t.ev('GEOC.minGap = 60');
  const t0 = Date.now();
  const all = await Promise.all(['Dobova 25', 'Dobova 30', 'Mostec 4', 'Dobova 25'].map(a => t.ev(`GEOC.resolve(${JSON.stringify(a)})`)));
  assert.strictEqual(t.nm.log.length, 3, 'podvojen naslov se išče enkrat (isti čas, ista vrsta)'); assert.strictEqual(t.nm.maxLive, 1, 'nikoli dva zahtevka hkrati');
  const gaps = t.nm.log.slice(1).map((l, i) => l.t - t.nm.log[i].t); assert.ok(gaps.every(g => g >= 55), 'razmik med zahtevki: ' + gaps);
  assert.strictEqual(all[0].lat, all[3].lat);
  await t.ev(`GEOC.resolve('Dobova 25')`); assert.strictEqual(t.nm.log.length, 3, 'pomnilnik seje');
  // pacient z naslovom: točka se zapiše v p.gc; nova seja jo prebere brez zahtevka
  t.ev(`S.patients.push(blankPatient({ name:'Pacient 1', addr:'Mostec 4' }))`);
  const mem = new Map(); const t2 = boot({ mem });
  t2.ev(`S.patients.push(blankPatient({ name:'Pacient 1', addr:'Dobova 30' })); S.patients[0].id = 'p1'`);
  await t2.ev(`GEOC.resolve('Dobova 30')`);
  const gc = t2.js('S.patients[0].gc'); assert.ok(gc && gc.k === 'dobova 30' && gc.prec === 'hisna' && Math.abs(gc.lat - 45.9002) < 1e-6, JSON.stringify(gc));
  const t3 = boot({ nmock:{ fail:'throw' } });
  t3.ev(`S.patients.push(Object.assign(blankPatient({ name:'Pacient 1', addr:'Dobova 30' }), { gc:${JSON.stringify(gc)} }))`);
  const r3 = JSON.parse(await t3.ev(`GEOC.resolve('Dobova 30').then(r => JSON.stringify(r))`)); assert.strictEqual(t3.nm.log.length, 0, 'brez zahtevka, točka je pri pacientu'); assert.ok(Math.abs(r3.lat - 45.9002) < 1e-6);
  t3.ev(`S.patients[0].addr = 'Dobova 25'`); await assert.rejects(t3.ev(`GEOC.resolve('Dobova 25')`), /povezave|strežnik/i, 'spremenjen naslov ne uporabi stare točke');
  // ročni popravek
  t.ev(`GEOC.setFix('Dobova 25', 45.9, 15.65)`);
  const fx = await t.ev(`GEOC.resolve('Dobova 25')`); assert.strictEqual(fx.prec, 'rocno'); assert.strictEqual(fx.lat, 45.9);
  assert.ok(t.ev(`GEOC.hasFix('dobova 25')`)); assert.strictEqual(t.ev(`GEOC.clearFix('Dobova 25')`), true);
  assert.notStrictEqual((await t.ev(`GEOC.resolve('Dobova 25')`)).prec, 'rocno');
});
test('Naslovi: napake – 429 (premor, brez novih zahtevkov), 403, brez povezave, izklopljeno; neznan naslov se 10 min ne išče znova', async () => {
  const t = boot({ nmock:{ fail:n => n === 1 ? 429 : 0 } });
  await assert.rejects(t.ev(`GEOC.resolve('Dobova 25')`), /429/);
  assert.ok(t.ev('GEOC.info().cooling') > 30000); assert.strictEqual(t.ev('GEOC.auto()'), false, 'samodejni izračun počiva');
  await assert.rejects(t.ev(`GEOC.resolve('Dobova 30')`)); assert.strictEqual(t.nm.log.length, 1, 'med premorom ni novih zahtevkov');
  const t2 = boot({ nmock:{ fail:403 } }); await assert.rejects(t2.ev(`GEOC.resolve('Dobova 25')`), /zavrnil/); assert.ok(t2.ev('GEOC.info().cooling') > 300000);
  const t3 = boot({ nmock:{ fail:'throw' } }); await assert.rejects(t3.ev(`GEOC.resolve('Dobova 25')`), /povezave/); assert.strictEqual(t3.ev('GEOC.info().status'), 'error');
  const t4 = boot({ geocode:{ url:'' } }); assert.strictEqual(t4.ev('GEOC.enabled()'), false); await assert.rejects(t4.ev(`GEOC.resolve('Dobova 25')`), /izklopljeno/); assert.strictEqual(t4.nm.log.length, 0);
  const t5 = boot(); t5.ev('S.settings.geocode.on = false'); assert.strictEqual(t5.ev('GEOC.enabled()'), false);
  const t6 = boot(); const g6 = JSON.parse(await t6.ev(`GEOC.resolve('Gradišče 12, Brežice').then(r => JSON.stringify(r))`));
  assert.strictEqual(g6.prec, 'naselje'); assert.ok(/ni v OSM/.test(g6.warn)); assert.strictEqual(t6.nm.log.length, 2, 'omejeno in nato neomejeno iskanje');
  const t7 = boot(); await assert.rejects(t7.ev(`GEOC.resolve('Neznana 5, Nekje')`), /ni mogoče najti/); const n7 = t7.nm.log.length;
  await assert.rejects(t7.ev(`GEOC.resolve('Neznana 5, Nekje')`)); assert.strictEqual(t7.nm.log.length, n7, 'negativni predpomnilnik');
});
test('Kilometrina OSM: točka naslova + cestna pot OSRM; vir »osm«, natančnost, čakanje na pregled šteje pot nazaj, ročni vnos ima prednost', async () => {
  const t = boot();
  assert.strictEqual(t.ev('KM.engine()'), 'osm'); assert.strictEqual(t.ev('KM.can()'), true);
  day(t, { routing:true, rides:[{ name:'Ana Novak', from:'Dobova 25', to:'UKC LJ - očesna klinika', time:'10:00', phone:'031 111 222', stay:45 }, { name:'Boris', from:'Dobova 99', to:'SB Brežice', time:'11:00' }, { name:'Cene', from:'Dobova', to:'SB Brežice', time:'12:00' }] });
  const r = await t.ev(`KM.ensure(${D}, 'r0')`);
  assert.strictEqual(r.kmSrc, 'osm'); assert.deepStrictEqual(JSON.parse(JSON.stringify(r.gp)), ['hisna', 'ustanova']);
  const ukc = t.js(`geo('UKC LJ - očesna klinika')`);
  const exp = t.mock.roadKm([15.6572, 45.8991], [ukc.lon, ukc.lat]);
  assert.ok(Math.abs(r.km - Math.round(exp * 10) / 10) < 0.06, `km ${r.km} vs ${exp}`); assert.ok(r.kmBack > 50, 'pot nazaj (DO → OD)');
  assert.ok(Math.abs(r.gf[0] - 45.8991) < 1e-6, 'točka OD je hiša, ne središče naselja');
  const rl = t.mock.log.filter(l => /\/route\//.test(l.url)); assert.strictEqual(rl.length, 2); assert.ok(rl.every(l => l.init.referrerPolicy === 'no-referrer' && l.init.credentials === 'omit'));
  assert.ok(!/Ana|Novak|031|Dobova|Ljubljana/.test(rl.map(l => l.url).join(' ')), 'cestni strežnik dobi samo koordinate');
  assert.ok(!/Ana|Novak|031|10:00/.test(t.nm.log.map(l => decodeURIComponent(l.url)).join(' ')));
  const inf = t.js(`KM.info(rideById(${D}, 'r0').r)`); assert.ok(inf.exact && inf.src === 'osm' && Math.abs(inf.total - (inf.km + inf.back)) < 1e-9);
  // samo ulica / središče naselja: približno (~)
  const r1 = await t.ev(`KM.ensure(${D}, 'r1')`); assert.deepStrictEqual(JSON.parse(JSON.stringify(r1.gp)), ['ulica', 'ustanova']);
  assert.strictEqual(t.js(`KM.info(rideById(${D}, 'r1').r)`).exact, false); assert.ok(/hišne številke/.test(r1.kmWarn));
  const r2 = await t.ev(`KM.ensure(${D}, 'r2')`); assert.strictEqual(r2.gp[0], 'naselje'); assert.strictEqual(t.js(`KM.info(rideById(${D}, 'r2').r)`).exact, false);
  // zastaranje, ročni vnos
  t.ev(`rideById(${D}, 'r0').r.to = 'SB Brežice'`); assert.strictEqual(t.js(`KM.info(rideById(${D}, 'r0').r)`).exact, false);
  t.ev(`KM.setManual(${D}, 'r0', '12,5')`); const m = t.js(`KM.info(rideById(${D}, 'r0').r)`); assert.strictEqual(m.km, 12.5); assert.strictEqual(m.src, 'rocno');
  assert.strictEqual(t.gm.log.length, 0, 'Google ni bil poklican');
  // ročni vnos med tekočim izračunom ni prepisan z rezultatom izračuna
  const t3 = boot(); day(t3, { routing:true, rides:[{ name:'M', from:'Dobova 30', to:'SB Brežice', time:'10:00' }] });
  const pm = t3.ev(`KM.ensure(${D}, 'r0')`); t3.ev(`KM.setManual(${D}, 'r0', '7,5')`); assert.strictEqual(await pm, null);
  assert.strictEqual(t3.js(`rideById(${D}, 'r0').r.km`), 7.5); assert.strictEqual(t3.js(`rideById(${D}, 'r0').r.kmSrc`), 'rocno');
  // rezultat se zavrže, če se je naslov med izračunom spremenil
  const t2 = boot(); day(t2, { routing:true, rides:[{ name:'C', from:'Dobova 25', to:'SB Brežice', time:'10:00' }] });
  const pr = t2.ev(`KM.ensure(${D}, 'r0')`); t2.ev(`rideById(${D}, 'r0').r.to = 'SB Novo mesto'`); assert.strictEqual(await pr, null); assert.strictEqual(t2.js(`rideById(${D}, 'r0').r.km`), null);
});
test('Kilometrina OSM: popravek točke preračuna prevoze z istim naslovom od včeraj naprej; km se spremeni; stari dnevi ostanejo', async () => {
  const t = boot(); const today = t.ev('todayStr()'), old = '2026-01-05';
  const mk = (id, from) => ({ name:'P' + id, from, to:'SB Brežice', time:'10:00' });
  day(t, { routing:true, date:today, rides:[mk(0, 'Dobova 25'), mk(1, 'Dobova 30')] }); day(t, { routing:true, date:old, rides:[mk(0, 'Dobova 25')] });
  await t.ev(`KM.ensure('${today}', 'r0')`); await t.ev(`KM.ensure('${today}', 'r1')`); await t.ev(`KM.ensure('${old}', 'r0')`);
  const k0 = t.js(`rideById('${today}', 'r0').r.km`), kOld = t.js(`rideById('${old}', 'r0').r.km`);
  t.ev(`GEOC.setFix('Dobova 25', 45.93, 15.70)`); const n = t.ev(`KM.refix('Dobova 25')`); assert.strictEqual(n, 1, 'samo današnji prevoz z tem naslovom');
  assert.strictEqual(t.ev(`KM.fresh(rideById('${today}', 'r0').r)`), false);
  const r = await t.ev(`KM.ensure('${today}', 'r0')`); assert.deepStrictEqual(JSON.parse(JSON.stringify(r.gp)), ['rocno', 'ustanova']); assert.notStrictEqual(r.km, k0);
  assert.ok(Math.abs(r.gf[0] - 45.93) < 1e-6); assert.ok(t.js(`KM.info(rideById('${today}', 'r0').r)`).exact, 'ročna točka je natančna');
  assert.strictEqual(t.js(`rideById('${old}', 'r0').r.km`), kOld, 'pretekli dan ostane, kot je bil zapisan');
  // popravki se prenesejo prek nastavitev (cfg/main) na druge naprave
  const doc = t.js('cfgDoc()'); assert.ok(doc.geoFix.some(x => x.k === 'dobova 25' && x.lat === 45.93));
  const t2 = boot(); t2.ev(`applyCfg(${JSON.stringify(doc)})`); assert.deepStrictEqual(t2.js(`S.geoFix['dobova 25'].slice(0, 2)`), [45.93, 15.7]);
});
test('Kilometrina: Google ima prednost, če je ključ vnesen; brez iskanja naslovov in brez ključa je izračun izklopljen', async () => {
  const t = boot({ google:GKEY }); assert.strictEqual(t.ev('KM.engine()'), 'google');
  day(t, { rides:[{ name:'A', from:'Dobova 25', to:'SB Brežice', time:'10:00' }] });
  const r = await t.ev(`KM.ensure(${D}, 'r0')`); assert.strictEqual(r.kmSrc, 'google'); assert.strictEqual(t.nm.log.length, 0, 'Nominatim ni poklican');
  const t2 = boot({ geocode:{ url:'' } }); assert.strictEqual(t2.ev('KM.engine()'), ''); assert.strictEqual(t2.ev('KM.can()'), false); assert.strictEqual(t2.ev('KM.auto()'), false);
  day(t2, { rides:[{ name:'A', from:'Dobova 25', to:'SB Brežice', time:'10:00' }] }); assert.strictEqual(await t2.ev(`KM.ensure(${D}, 'r0')`), null);
  assert.strictEqual(t2.nm.log.length + t2.gm.log.length, 0);
  const t3 = boot(); const tt = await t3.ev('GEOC.test()'); assert.ok(tt.ok && tt.d < 400, JSON.stringify(tt));
});
test('Kilometrina OSM: planer uporabi točko naslova (hiša, ne središče naselja); hišne točke niso v trajnem predpomnilniku poti', async () => {
  const mem = new Map(); const t = boot({ mem });
  day(t, { routing:true, vehicles:['v13'], rides:[{ name:'Ana', from:'Dobova 25', to:'SB Brežice', time:'10:00', phone:'1' }, { name:'Boris', from:'Dobova 30', to:'SB Brežice', time:'10:00', phone:'1' }] });
  await t.ev(`KM.day(${D})`);
  const after = t.js(`computePlan(${D}).pending.map(r => ({ k:r.from.key, ex:r.from.exact }))`);
  assert.ok(after.every(x => /^g:45\.[89]/.test(x.k) && x.ex), JSON.stringify(after)); assert.notStrictEqual(after[0].k, after[1].k);
  sum(t); await t.ev('ROUTE.settle()'); t.ev('ROUTE.persist()');
  const stored = mem.get('kp.route.v1'); assert.ok(stored && stored.length > 20);
  assert.ok(!/45\.8991|45\.9002|15\.6572|15\.6590/.test(stored), 'hišna točka ni v trajnem predpomnilniku');
});

/* ------------------------------------------------------------------ zagon */
(async () => {
  let pass = 0, fail = 0;
  for (const { name, fn } of tests){
    const t0 = Date.now();
    try { await fn(); pass++; console.log('  ok   ' + name + ' (' + (Date.now() - t0) + ' ms)'); }
    catch(e){ fail++; console.log('  FAIL ' + name + '\n       ' + String(e && e.stack || e).split('\n').slice(0, 4).join('\n       ')); }
  }
  console.log(`\n${pass} uspešnih, ${fail} neuspešnih`);
  process.exit(fail ? 1 : 0);
})();
