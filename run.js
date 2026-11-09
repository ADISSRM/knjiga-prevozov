'use strict';
/* Preizkusi cestnega usmerjanja in planerja. Zagon: node tests/run.js  (Node 18+, brez omrežja, brez namestitve paketov)
   Strežnik OSRM je posnetek dokumentiranega API-ja (tests/mock-osrm.js). Prava povezava: v aplikaciji Nastavitve → Planiranje → »Preveri cestne podatke«. */
const vm = require('vm'), assert = require('assert'), path = require('path');
const { load } = require('./load.js'), { createMock } = require('./mock-osrm.js'), { createGoogleMock } = require('./mock-google.js');
const SRC = path.join(__dirname, '..', 'src') + path.sep;
const FILES = ['20-data.js', '30-core.js', '35-db.js', '38-routing.js', '39-google.js', '40-planner.js', '45-pacienti.js'].map(f => SRC + f);
const URLS = { url:'https://osrm.test', fallback:['https://osrm2.test'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATE = '2026-11-10';   // torek

function boot(o = {}){
  const mock = createMock(o.mock || {});
  const gm = createGoogleMock(o.gmock || {});
  const ctx = load(FILES, { config:{ routing:o.routing || URLS, google:o.google }, mem:o.mem, fetch:mock.fetch });
  ctx.__mock = mock.fetch; ctx.__gmock = gm.fetch;
  const ev = code => vm.runInContext(code, ctx);
  const js = code => JSON.parse(ev('JSON.stringify(' + code + ')'));
  ev('ROUTE.fetch = __mock; ROUTE.gap = 0; GOOGLE.fetch = __gmock; GOOGLE.minGap = 0; S = defaultState(); normalizeState();');
  return { ctx, ev, js, mock, gm };
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
