/* =====================================================================
   RAZPORED: dnevne knjige, dializa, parjenje voznikov in vozil, združevanje in vrstni red prevozov
   Razdalje in časi vožnje: PRAVI CESTNI PODATKI (OpenStreetMap / OSRM, glej 38-routing.js). Samo če jih ni (strežnik se nalaga ali ni
   dosegljiv, naslov brez koordinat), je vožnja OCENA: zračna razdalja × faktor ceste, hitrosti po ZPrCP. Ocenjene relacije so vedno označene.
   Razširitve: vožnje z več cilji (vrstni red izstopov), združevanje sorodnih ciljev, primerjava več razporedov (optimizacija),
   konflikti, ocena prihodov (ETA) in predlogi. Osnovni (»osnovni«) razpored je nespremenjen prvotni algoritem; ostali so izbrani le, če so boljši.
   ===================================================================== */
const PLAN_CACHE = new Map();

/* ---------- Knjiga: polja ---------- */
const blankRide = () => ({ id:uid(), name:'', time:'', from:'', to:'', phone:'', mode:'sede', dia:'', diaKey:'', stay:0, km:null, kmBack:null, kmSrc:'', kk:'', gf:null, gt:null, kmAt:'', done:false, doneBy:'', doneAt:'', pin:'', demo:false,
  patientId:'', nalogId:'', note:'', exc:false, odpovedano:false, prevStatus:'', status:'nova', times:{}, statusBy:'', runKey:'' });
const isFilled = r => !!((r.name||'').trim() || (r.from||'').trim() || (r.to||'').trim());
function ensureDay(date){
  let a = S.rides[date]; if (!a) a = S.rides[date] = [];
  while (a.length < S.settings.slots) a.push(blankRide());
  return a;
}
function addSlots(date, n){ const a = ensureDay(date); for (let i = 0; i < n; i++) a.push(blankRide()); save(); }
function filledRides(date){ return ensureDay(date).map((r,i) => ({ r, nr:i+1 })).filter(x => isFilled(x.r)); }
function rideById(date, id){ const a = ensureDay(date); const i = a.findIndex(r => r.id === id); return i < 0 ? null : { r:a[i], nr:i+1 }; }
const rideKk = r => norm(r.from) + '>' + norm(r.to);
/* Točka vožnje: ustanova/klinika ali naselje. Če je Google za ta naslov že vrnil natančne koordinate (r.gf / r.gt, glej 39-google.js) in se besedilo
   od takrat ni spremenilo, se uporabijo te: hišni naslov je točka (ne središče naselja). Takšne točke se nikoli ne shranijo v trajni predpomnilnik poti. */
function ridePt(r, side){
  const g = geo(r[side] || ''), ll = side === 'from' ? r.gf : r.gt;
  if (!ll || g.kind === 'prazno' || !r.kk || r.kk !== rideKk(r) || !isFinite(ll[0]) || !isFinite(ll[1])) return g;
  if (g.kind === 'poi' && g.poi.fixed) return g;
  if (g.kind === 'poi') return { ...g, lat:ll[0], lon:ll[1], exact:true };
  return { ...g, kind:'addr', key:'g:' + (+ll[0]).toFixed(4) + ',' + (+ll[1]).toFixed(4), lat:ll[0], lon:ll[1], label:(r[side] || '').trim(), exact:true };
}
function rideDir(r){
  const f = geo(r.from), t = geo(r.to);
  if (f.kind === 'poi' && t.kind !== 'poi' && t.kind !== 'prazno') return 'from';
  return 'to';
}

/* ---------- Dializa: register pacientov (Nastavitve → Dializa), termin dopoldanska / popoldanska ----------
   Za vsakega pacienta, ki ta dan dializira, se vpiše prevoz tja (ura = začetek termina) in nazaj (ura = konec termina). */
function loadDialysis(date){
  const terms = diaTermsFor(date); if (!terms.length) return 0;
  const a = ensureDay(date); let added = 0;
  const place = obj => {
    let i = a.findIndex(r => !isFilled(r));
    if (i < 0){ a.push(blankRide()); i = a.length - 1; }
    Object.assign(a[i], blankRide(), obj); added++;
  };
  for (const p of S.patients){
    const dt = p.dt; if (!dt || !terms.includes(dt.t) || !(dt.d || []).includes(dow(date))) continue;
    const g = (S.settings.diaT || {})[dt.t]; if (!g) continue;
    const nl = activeNalog(p, date);
    const base = { name:p.name, phone:p.phone, mode:p.mode, dia:dt.t, demo:!!p.demo, patientId:p.id, nalogId:nl ? nl.id : '' };
    const k1 = p.id + ':tja', k2 = p.id + ':nazaj';
    if (!a.some(r => r.diaKey === k1)) place({ ...base, time:g.start, from:p.addr, to:'SB Brežice – dializa', diaKey:k1 });
    if (!a.some(r => r.diaKey === k2)) place({ ...base, time:g.end, from:'SB Brežice – dializa', to:p.addr, diaKey:k2 });
  }
  if (added) save();
  return added;
}

/* ---------- Vozila, posebnosti ---------- */
function vehBlocked(date, vid){
  return S.notices.find(n => n.vehicleId === vid && !n.closed && (n.tip === 'okvara' || n.tip === 'servis') && n.from <= date && (!n.to || n.to >= date)) || null;
}
const vehOff = (date, vid) => (S.vehOff[date] || []).includes(vid);
function availableVehicles(date){
  return S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo' && !vehOff(date, v.id) && !vehBlocked(date, v.id));
}
const vehById = id => S.vehicles.find(v => v.id === id);
/* Kapaciteta: običajna (sede/leze/utila/skupaj) in največja dovoljena (…Max). Največja se uporabi samo, ko se pravila prilagajajo. */
const capOf = (v, lvl) => lvl
  ? { sede:Math.max(v.sede, v.sedeMax ?? v.sede), leze:Math.max(v.leze, v.lezeMax ?? v.leze), utila:Math.max(v.utila, v.utilaMax ?? v.utila), skupaj:Math.max(v.skupaj, v.skupajMax ?? v.skupaj) }
  : { sede:v.sede, leze:v.leze, utila:v.utila, skupaj:v.skupaj };
const capText = v => {
  const m = capOf(v, 1), bent = m.skupaj > v.skupaj || m.sede > v.sede || m.leze > v.leze || m.utila > v.utila;
  return `${v.sede} sede · ${v.leze} leže · ${v.utila} utila · skupaj ${v.skupaj}` + (bent ? ` (izjemoma do ${m.skupaj})` : '');
};
const fits = (counts, v, lvl = 0) => { const c = capOf(v, lvl); return counts.sede <= c.sede && counts.leze <= c.leze && counts.utila <= c.utila && (counts.sede + counts.leze + counts.utila) <= c.skupaj; };
const countModes = rides => { const c = { sede:0, leze:0, utila:0 }; rides.forEach(r => { c[r.mode] = (c[r.mode] || 0) + 1; }); return c; };

/* ---------- Parjenje: kateri zaposleni vozi katero vozilo ---------- */
const isHelperRole = r => r === 'student' || r === 'dijak';
const ROLE_TAG = { spremljevalec:'sp.', student:'štud.', dijak:'dij.' };
/* Posadka = voznik + spremljevalec (NN in pripravljenost: 2 reševalca samodejno). Študent in dijak sta dodatna pomočnika,
   ne vozita in ne nadomestita spremljevalca. Leže pacient vedno potrebuje voznika + spremljevalca in vozilo z nosili. */
function pairCrews(date){
  const duty = S.duty[date] || [];
  const split = !!(S.dayRules[date] && S.dayRules[date].split);   // ekipa se razdeli: vsak je voznik v svojem vozilu
  const veh = availableVehicles(date);
  const used = new Set(), crews = [], notes = [];
  const roleMap = new Map(), roleOf = d => roleMap.get(d) || d.role || 'voznik';
  if (!split) ['NN', 'pripravljenost'].forEach(tm => {   // 2 reševalca v ekipi: eden je voznik, drugi spremljevalec
    const V = duty.filter(d => d.team === tm && !isHelperRole(roleOf(d)) && roleOf(d) !== 'spremljevalec');
    const E = duty.filter(d => d.team === tm && roleOf(d) === 'spremljevalec');
    V.slice(Math.ceil((V.length + E.length) / 2)).forEach(d => roleMap.set(d, 'spremljevalec'));
  });
  const helpers = duty.filter(d => isHelperRole(roleOf(d)));
  const drivers = duty.filter(d => !isHelperRole(roleOf(d)) && (split || roleOf(d) !== 'spremljevalec'));
  const escorts = split ? [] : duty.filter(d => roleOf(d) === 'spremljevalec');
  const needLeze = (S.rides[date] || []).some(r => isFilled(r) && !r.done && !r.odpovedano && r.status !== 'preklicana' && r.mode === 'leze');
  const take = (d, v) => {
    used.add(v.id);
    const shift = toMin(d.from) ?? toMin(S.settings.shift) ?? 360;
    const explicit = !!(d.from || d.to);
    let end = null;
    if (explicit && S.rules.enforceShift){ end = d.to ? toMin(d.to) : shift + (S.rules.shiftHours || 8) * 60; if (end != null && end <= shift) end += 1440; }
    crews.push({ id:v.id, vehicle:v, driver:d, escorts:[], helpers:[], team:d.team, shift, end, ot:Math.max(0, +d.ot || 0) });
  };
  drivers.forEach(d => { if (d.vehicleId){ const v = veh.find(x => x.id === d.vehicleId && !used.has(x.id)); if (v) take(d, v); } });
  const rest = drivers.filter(d => !crews.some(c => c.driver === d));
  const hasMate = d => !split && escorts.some(e => e.team === d.team);
  const pickFor = d => {
    const free = veh.filter(v => !used.has(v.id));
    const want = d.team === 'NN' ? ['NN','oboje'] : ['redna','oboje'];
    const lz = needLeze && hasMate(d) ? free.filter(v => v.leze > 0) : [];   // ekipa z dvema: vozilo z nosili, če je leže prevoz
    return lz.find(v => want.includes(v.ns)) || lz[0] || free.find(v => want.includes(v.ns)) || free[0] || null;
  };
  [...rest.filter(d => d.team === 'NN'), ...rest.filter(d => d.team !== 'NN')].forEach(d => { const v = pickFor(d); if (v) take(d, v); });
  const unpaired = rest.filter(d => !crews.some(c => c.driver === d));
  const order = veh.map(v => v.id);
  const sortCrews = () => crews.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
  sortCrews();
  const looseEsc = [], looseHelp = [];
  const fewest = () => crews.slice().sort((a, b) => a.escorts.length - b.escorts.length || (needLeze ? (b.vehicle.leze > 0) - (a.vehicle.leze > 0) : 0));
  escorts.forEach(e => { const cand = fewest(), c = cand.find(c => !c.escorts.length && c.team === e.team) || cand.find(c => !c.escorts.length) || cand[0]; if (c) c.escorts.push(e); else looseEsc.push(e); });
  helpers.forEach(h => { const cand = crews.slice().sort((a, b) => a.helpers.length - b.helpers.length), c = cand.find(c => c.team === h.team) || cand[0]; if (c) c.helpers.push(h); else looseHelp.push(h); });
  /* Leže: če nobena posadka nima spremljevalca in vozila z nosili, aplikacija sama sestavi posadko (voznik + spremljevalec) */
  if (needLeze && !split && !crews.some(c => c.escorts.length && c.vehicle.leze > 0)){
    const lezV = veh.filter(v => v.leze > 0), setVeh = (c, v) => { c.vehicle = v; c.id = v.id; };
    const freeLez = () => lezV.find(v => !used.has(v.id));
    let lead = crews.find(c => c.escorts.length) || null;
    if (lead){
      if (lead.vehicle.leze <= 0){
        const f = freeLez();
        if (f){ used.delete(lead.vehicle.id); used.add(f.id); setVeh(lead, f); }
        else { const oth = crews.find(c => c !== lead && c.vehicle.leze > 0); if (oth){ const tv = lead.vehicle; setVeh(lead, oth.vehicle); setVeh(oth, tv); } }
      }
    } else if (crews.length >= 2 && lezV.length){
      lead = crews.find(c => c.vehicle.leze > 0) || crews[0];
      if (lead.vehicle.leze <= 0){ const f = freeLez(); if (f){ used.delete(lead.vehicle.id); used.add(f.id); setVeh(lead, f); } }
      if (lead.vehicle.leze > 0){
        const donor = crews.filter(c => c !== lead).sort((a, b) => (a.team === lead.team ? 0 : 1) - (b.team === lead.team ? 0 : 1) || a.vehicle.skupaj - b.vehicle.skupaj)[0];
        if (donor){
          lead.escorts.push(donor.driver); lead.helpers.push(...donor.helpers);
          crews.splice(crews.indexOf(donor), 1); used.delete(donor.vehicle.id);
          notes.push(`Zaradi prevoza leže sta ${lead.driver.name} (voznik) in ${donor.driver.name} (spremljevalec) združena v eno posadko (${lead.vehicle.name}).`);
        }
      }
    }
    sortCrews();
  }
  crews.forEach(c => { c.solo = c.escorts.length === 0; });   // solo = samo voznik, leže pacienta ne more peljati
  return { crews, unpaired, looseEsc, looseHelp, notes, split };
}

/* ---------- Geometrija in cestni podatki ---------- */
function hav(a, b){
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lon - a.lon);
  const h = Math.sin(dLa/2)**2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/* OCENA (samo če cestnih podatkov ni): zračna razdalja × faktor ceste, hitrosti po ZPrCP. */
function estLeg(a, b, cfg){
  const km = Math.max(hav(a, b) * cfg.road, a.key === b.key ? 1.2 : 0.8);
  /* Omejitve po ZPrCP (46. člen): naselje 50, izven naselij 90, hitra cesta 110, avtocesta 130 km/h.
     Profil poti: prvih 6 km naselje, nato 14 km izven naselij, 15 km hitra cesta, preostanek avtocesta. */
  const L = cfg.lim || {}, e = (cfg.eff || 85) / 100;
  const s1 = Math.min(km, 6), s2 = Math.min(Math.max(km - 6, 0), 14), s3 = Math.min(Math.max(km - 20, 0), 15), s4 = Math.max(km - 35, 0);
  return { km, min: (s1 / (L.naselje || 50) + s2 / (L.izven || 90) + s3 / (L.hitra || 110) + s4 / (L.avtocesta || 130)) / e * 60 + 1, est:true };
}
/* Vožnja med dvema točkama: { km, min, real } po cestah (OSRM), sicer ocena { est:true }.
   wait = cestni podatek za to relacijo se še nalaga ali ga strežnik ni vrnil; local = ista točka (npr. dva naslova v istem naselju). */
function makeLeg(cfg){
  const memo = new Map();
  return (a, b) => {
    const k = a.key + '>' + b.key;
    let v = memo.get(k);
    if (!v){
      const rr = a.key === b.key ? null : ROUTE.leg(a, b);
      if (rr){
        const f = (S.settings.routing && +S.settings.routing.factor) || 1;
        v = { km:Math.max(rr.km, 0.2), min:Math.max(rr.min * f, 0.5) + 1, real:true };   // +1 min: ustavljanje, parkiranje, vstop
      } else {
        v = estLeg(a, b, cfg);
        if (a.key === b.key) v.local = true;
        else if (ROUTE.enabled() && ROUTE.routable(a) && ROUTE.routable(b)) v.wait = true;
      }
      memo.set(k, v);
    }
    return v;
  };
}
function permute(arr, cb){
  const n = arr.length, c = new Array(n).fill(0), a = arr.slice();
  cb(a.slice());
  let i = 0;
  while (i < n){
    if (c[i] < i){ const j = i % 2 === 0 ? 0 : c[i]; [a[j], a[i]] = [a[i], a[j]]; cb(a.slice()); c[i]++; i = 0; }
    else { c[i] = 0; i++; }
  }
}
/* Točke obiska (cilji pri TJA, izhodišča pri ODVOZU) po ključu, v vrstnem redu pojavitve */
function uniqBy(arr, f){
  const m = new Map();
  arr.forEach(x => { const p = f(x); if (!m.has(p.key)) m.set(p.key, { pt:p, rides:[] }); m.get(p.key).rides.push(x); });
  return [...m.values()];
}
/* Vrstni redi obiska točk: do 4 točk vse permutacije, sicer najbližji sosed od začetne točke */
function visitOrders(groups, from, leg){
  if (groups.length <= 1) return [groups];
  if (groups.length <= 4){ const out = []; permute(groups, p => out.push(p)); return out; }
  const left = groups.slice(), seq = []; let cur = from;
  while (left.length){ let bi = 0; left.forEach((g, i) => { if (cur && leg(cur, g.pt).min < leg(cur, left[bi].pt).min) bi = i; }); const g = left.splice(bi, 1)[0]; seq.push(g); cur = g.pt; }
  return [seq];
}
/* Čas nalaganja / odpuščanja glede na način prevoza (leže in utila potrebujejo več časa kot sede) */
const loadOf = (r, cfg, side) => { const k = side === 'pick' ? 'pick' : 'drop', m = r.mode; const v = m === 'leze' ? cfg[k + 'Leze'] : m === 'utila' ? cfg[k + 'Utila'] : cfg[k + 'Min']; return (v != null && isFinite(v)) ? +v : +cfg[k + 'Min']; };
const loadSum = (rides, cfg, side) => rides.reduce((x, r) => x + loadOf(r, cfg, side), 0);
/* Konec vožnje: pri vožnji s čakanjem na pregled (stay) je vrnitev šele, ko je pregled končan (ura pregleda + trajanje + pot od vhoda) */
function retStartOf(ev, start){ return Math.max(start + ev.outDur, ev.readyAbs != null ? ev.readyAbs : -1e9, ev.readyRel != null ? start + ev.readyRel : -1e9); }
const tripEnd = (ev, start) => ev.ret ? retStartOf(ev, start) + ev.ret.dur : start + ev.dur;
const legCount = (l, c) => { if (l.real) c.real++; else if (!l.local){ c.est++; if (l.wait) c.wait++; } };

/* ---------- Ocena poti ene vožnje ----------
   TJA: pobiranje (vrstni red pobiranja) → en ali več ciljev (vrstni red izstopov). ODVOZ: en ali več izhodišč → izstopi doma.
   Pri enem cilju/izhodišču je rezultat enak prvotnemu izračunu. */
function evalTo(order, dest, cfg, leg){
  let t = 0, km = 0, prev = null; const stops = [], ride = {}, cnt = { real:0, est:0, wait:0 };
  for (const r of order){
    if (prev){ const l = leg(prev, r.from); t += l.min; km += l.km; legCount(l, cnt); }
    stops.push({ type:'pu', off:t, pt:r.from, rideId:r.id });
    t += loadOf(r, cfg, 'pick'); ride[r.id] = t; prev = r.from;
  }
  const groups = uniqBy(order, r => r.to), ptOf = g => (dest && g.pt.key === dest.key ? dest : g.pt);
  const ret = order.filter(r => r.stay > 0);
  let best = null;
  for (const seq of visitOrders(groups, prev, leg)){
    let tt = t, kk = km, pv = prev; const dstops = [], arrAt = {}, c2 = { ...cnt };
    for (const g of seq){
      const pt = ptOf(g), l = leg(pv, pt); tt += l.min; kk += l.km; legCount(l, c2);
      dstops.push({ type:'do', off:tt, pt, rideIds:g.rides.map(r => r.id) });
      g.rides.forEach(r => { arrAt[r.id] = tt; });
      tt += loadSum(g.rides, cfg, 'drop'); pv = pt;
    }
    let maxRide = 0; const rideMin = {};
    order.forEach(r => { rideMin[r.id] = arrAt[r.id] - ride[r.id]; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id]; });
    let dl = null, early = 0;                                   // dl = najmanjša rezerva do ure preiskave (brez varnostne rezerve); pot od vhoda do ambulante (extra) je všteta
    order.forEach(r => { if (r.time != null){ const d = r.time - arrAt[r.id] - (r.extra || 0); if (dl == null || d < dl) dl = d; } });
    if (seq.length > 1 && dl != null) order.forEach(r => { if (r.time != null) early += (r.time - arrAt[r.id] - (r.extra || 0)) - dl; });   // pacienti, ki bi čakali na cilju
    const ev = { order, stops:dstops.length ? stops.concat(dstops) : stops, arr:dstops[0].off, dur:tt, outDur:tt, km:kk, maxRide, rideMin, arrAt, dl, visit:seq.map(ptOf), lastPt:pv, nReal:c2.real, nEst:c2.est, nWait:c2.wait, ret:null, readyAbs:null, readyRel:null, waitNom:0 };
    /* Čakanje na pregled: po izstopu reševalec počaka do konca pregleda, nato pacienta odpelje nazaj na izhodišče (vožnja nazaj je všteta). */
    if (ret.length && seq.length === 1){
      const T0 = dl != null ? dl - cfg.buffer : null;           // nominalni začetek vožnje (prihod točno z rezervo pred pregledom)
      let nomMax = 0;
      ret.forEach(r => {
        if (r.time != null){ const abs = r.time + r.stay + (r.extra || 0); ev.readyAbs = ev.readyAbs == null ? abs : Math.max(ev.readyAbs, abs); nomMax = Math.max(nomMax, abs - (T0 ?? 0)); }
        else { const rel = arrAt[r.id] + loadOf(r, cfg, 'drop') + (r.extra || 0) + r.stay; ev.readyRel = ev.readyRel == null ? rel : Math.max(ev.readyRel, rel); nomMax = Math.max(nomMax, rel); }
      });
      const back = ret.map(r => r.vret || (r.vret = { id:r.id, nr:r.nr, name:r.name, mode:r.mode, from:r.to, to:r.from, time:null, extra:0, stay:0, kind:'from', pid:r.pid }));
      const er = evalFrom(back, pv, cfg, leg);
      ev.ret = { stops:er.stops, dur:er.dur, km:er.km, rideMin:er.rideMin, maxRide:er.maxRide, visit:er.visit, lastPt:er.lastPt };
      ev.waitNom = Math.max(0, nomMax - tt);
      ev.dur = tt + ev.waitNom + er.dur; ev.km = kk + er.km; ev.lastPt = er.lastPt;
      ev.nReal = c2.real + er.nReal; ev.nEst = c2.est + er.nEst; ev.nWait = c2.wait + er.nWait;
      if (er.maxRide > maxRide) ev.maxRide = er.maxRide;
    }
    ev.score = ev.dur + (ev.maxRide > cfg.maxRide ? 1000 : 0) + (seq.length > 1 ? early * 0.3 : 0);
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
function evalFrom(order, origin, cfg, leg){
  const groups = uniqBy(order, r => r.from), ptOf = g => (origin && g.pt.key === origin.key ? origin : g.pt);
  let best = null;
  for (const seq of visitOrders(groups, null, leg)){
    let t = 0, km = 0, prev = null; const stops = [], boarded = {}, pickOff = {}, cnt = { real:0, est:0, wait:0 };
    for (const g of seq){
      const pt = ptOf(g);
      if (prev){ const l = leg(prev, pt); t += l.min; km += l.km; legCount(l, cnt); }
      stops.push({ type:'pu', off:t, pt, rideIds:g.rides.map(r => r.id) });
      g.rides.forEach(r => { pickOff[r.id] = t; });
      t += loadSum(g.rides, cfg, 'pick');
      g.rides.forEach(r => { boarded[r.id] = t; });
      prev = pt;
    }
    let maxRide = 0; const rideMin = {};
    for (const r of order){
      const l = leg(prev, r.to); t += l.min; km += l.km; legCount(l, cnt);
      stops.push({ type:'do', off:t, pt:r.to, rideId:r.id });
      rideMin[r.id] = t - boarded[r.id]; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id];
      t += loadOf(r, cfg, 'drop'); prev = r.to;
    }
    let rd = null;                                              // najzgodnejši začetek vožnje, da noben pacient ne čaka
    order.forEach(r => { if (r.time != null){ const d = r.time - pickOff[r.id]; if (rd == null || d > rd) rd = d; } });
    const ev = { order, stops, arr:0, dur:t, outDur:t, km, maxRide, rideMin, pickOff, rd, ret:null, readyAbs:null, readyRel:null, visit:seq.map(ptOf), lastPt:prev, nReal:cnt.real, nEst:cnt.est, nWait:cnt.wait,
      score:t + (maxRide > cfg.maxRide ? 1000 : 0) + (seq.length > 1 && rd != null ? rd : 0) };
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
const evalTrip = (kind, order, anchor, cfg, leg) => kind === 'from' ? evalFrom(order, anchor, cfg, leg) : evalTo(order, anchor, cfg, leg);
function bestInsert(kind, order, r, anchor, cfg, leg){
  let best = null;
  for (let i = 0; i <= order.length; i++){
    const o = order.slice(0, i).concat([r], order.slice(i));
    const ev = evalTrip(kind, o, anchor, cfg, leg);
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
function bestExact(kind, rides, anchor, cfg, leg){
  if (rides.length > 7 || rides.length < 2) return evalTrip(kind, rides, anchor, cfg, leg);
  let best = null;
  permute(rides, p => { const ev = evalTrip(kind, p, anchor, cfg, leg); if (!best || ev.score < best.score) best = ev; });
  return best;
}

/* ---------- Pravila: stroga in prilagojena ----------
   Stroga pravila = običajne vrednosti (kapaciteta vozila, najdaljša vožnja, okno, rezerva, dolžina izmene).
   Prilagojena pravila = največje dovoljene vrednosti (S.rules.bend, kapaciteta …Max, nadure).
   Način "samodejno": najprej stroga pravila; če bi bil prevoz nerazporejen ali bi zamudil, se pravila prilagodijo samo toliko, kot je treba,
   in vsaka prilagoditev je izpisana. Način "prosto": prilagoditve so vedno dovoljene. Način "strogo": prilagoditev ni (razen ročnih izjem).
   Ročna izjema na prevozu (kljukica "Izjema") ali pripeto vozilo vedno dovoljujeta prilagoditev za ta prevoz. */
const dayMode = date => (S.dayRules[date] && S.dayRules[date].mode) || S.rules.mode || 'samodejno';
const cfgFor = lvl => lvl ? { ...S.settings, ...S.rules.bend } : S.settings;
const planProblem = p => p.unassigned.length > 0 || p.totals.late > 0;
const planScore = p => p.unassigned.length * 1000 + p.totals.late * 50 + p.bends.length * 3 + p.totals.km * 0.05;
/* Cilj optimizacije (manj je bolje): nerazporejeno ≫ zamude ≫ konflikti ≫ prilagoditve, nato nadure, čakanje, kilometri in čas voženj */
const planObjective = p => p.unassigned.length * 1000 + p.totals.late * 300 + p.totals.lateMin * 1 + p.conflicts.filter(c => c.pen).length * 200 + p.bends.length * 3
  + p.totals.overtime * 0.3 + p.totals.wait * 0.1 + p.totals.km * 0.1 + p.totals.min * 0.03 + p.totals.waste * 0.3 + p.totals.stretcherUse * 2;
/* Prevozi, ki so že v teku pri posadki: razpored jih ne prestavlja na drugo vozilo */
const LIVE_LOCK = ['sprejeta', 'na_poti', 'na_kraju', 'v_vozilu', 'na_cilju'];
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const seedOf = (str, k) => { let h = 2166136261; for (const ch of str + '#' + k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/* Različice izračuna. Prva (»osnovni«) je prvotni algoritem; ostale preizkušajo združevanje sorodnih ciljev, primernejša vozila
   in drugačen vrstni red dodeljevanja. Izbrana je različica z najnižjim ciljem (pri enakosti prva). Deterministično (seme iz datuma). */
function variantList(date){
  const v = [{ id:'osnovni' }];
  if (S.settings.optimize === false) return v;
  const n = ensureDay(date).filter(r => isFilled(r) && !r.done && !r.odpovedano && r.status !== 'preklicana').length;
  if (n < 2) return v;
  v.push({ id:'sorodni cilji', cluster:true });
  v.push({ id:'sorodni cilji + primerna vozila', cluster:true, fit:0.6 });
  v.push({ id:'primerna vozila', fit:0.6 });
  v.push({ id:'sorodni cilji, najdaljše prve', cluster:true, order:'dur' });
  v.push({ id:'najdaljše prve + polnjenje vrzeli', gaps:true, cluster:true, order:'dur' });
  v.push({ id:'polnjenje vrzeli', gaps:true });
  v.push({ id:'polnjenje vrzeli + sorodni cilji', gaps:true, cluster:true });
  v.push({ id:'polnjenje vrzeli + sorodni cilji + primerna vozila', gaps:true, cluster:true, fit:0.6 });
  for (let k = 1; k <= 6; k++) v.push({ id:'iskanje ' + k, gaps:true, cluster:true, fit:0.3, jit:40, seed:seedOf(date, k) });
  for (let k = 7; k <= 9; k++) v.push({ id:'iskanje ' + k, jit:40, seed:seedOf(date, k) });
  return v;
}
function bestPlan(date, level){
  let best = null, base = null, n = 0;
  for (const opts of variantList(date)){
    const p = planLevel(date, level, opts); n++;
    if (!base) base = p;
    /* Trda pravila: razpored ni sprejet, če ima več nerazporejenih prevozov, ali več zamud, razen če zato razporedi več prevozov */
    const ok = p === base || p.unassigned.length < base.unassigned.length || (p.unassigned.length === base.unassigned.length && p.totals.late <= base.totals.late);
    if (ok && (!best || planObjective(p) < planObjective(best) - 1e-9)) best = p;
  }
  const brief = p => ({ km:p.totals.km, min:p.totals.min, late:p.totals.late, unassigned:p.unassigned.length, vehicles:p.totals.vehicles });
  best.eff = { tried:n, variant:best.opts.id, base:brief(base), saved:{ km:base.totals.km - best.totals.km, min:base.totals.min - best.totals.min, late:base.totals.late - best.totals.late, unassigned:base.unassigned.length - best.unassigned.length } };
  return best;
}

function computePlan(date){
  const mode = dayMode(date);
  const ck = date + '#' + rev + '#' + mode + '#' + ROUTE.version;
  if (PLAN_CACHE.has(ck)) return PLAN_CACHE.get(ck);
  let plan;
  if (mode === 'strogo') plan = bestPlan(date, 0);
  else if (mode === 'prosto') plan = bestPlan(date, 1);
  else {
    const p0 = bestPlan(date, 0);
    if (!planProblem(p0)) plan = p0;
    else { const p1 = bestPlan(date, 1); plan = planScore(p1) < planScore(p0) ? p1 : p0; }
  }
  plan.mode = mode;
  plan.suggestions = suggestFixes(plan, date, mode);
  PLAN_CACHE.set(ck, plan);
  return plan;
}

function planLevel(date, level, opts = {}){
  const cfgS = S.settings, cfgB = cfgFor(1), leg = makeLeg(cfgS);
  const rng = opts.seed ? mulberry(opts.seed) : null;
  const plan = { date, level, opts, crews:[], unassigned:[], warnings:[], bends:[], conflicts:[], assign:{}, totals:{ rides:0, km:0, min:0, late:0, lateMin:0, wait:0, overtime:0, vehicles:0, estLegs:0, waitLegs:0, realLegs:0, waste:0, stretcherUse:0, stayWait:0 }, pairing:null, standby:isStandby(date), pending:[] };

  // 1) vožnje, ki jih je treba opraviti
  const rides = [];
  ensureDay(date).forEach((r, i) => {
    if (!isFilled(r) || r.done || r.odpovedano || r.status === 'preklicana') return;
    const f = ridePt(r, 'from'), t = ridePt(r, 'to'), kind0 = rideDir(r);
    const lock = LIVE_LOCK.includes(r.status) && r.runKey && r.runKey.startsWith(date + '_') ? r.runKey.slice(date.length + 1) : '';
    rides.push({ id:r.id, nr:i+1, name:(r.name || '').trim() || '(brez imena)', mode:r.mode || 'sede', phone:r.phone || '', time:toMin(r.time), timeTxt:r.time || '',
      from:f, to:t, fromTxt:r.from || '', toTxt:r.to || '', kind:kind0, pin:r.pin || lock, locked:!r.pin && !!lock, exc:!!r.exc, force:!!(r.exc || r.pin), pid:r.patientId || '', dia:r.dia ? diaTermOf(r.dia) : '',
      stay:kind0 === 'to' ? Math.max(0, +r.stay || 0) : 0, extra:kind0 === 'to' ? poiExtra(t) : 0 });
    if (f.kind === 'prazno' || t.kind === 'prazno') plan.warnings.push({ level:'warn', nr:i+1, text:`Prevoz ${i+1}: manjka naslov (${f.kind === 'prazno' ? 'od' : 'do'}). Razdalja je ocenjena iz centra Brežic.` });
  });
  plan.totals.rides = rides.length;
  plan.pending = rides;

  // 2) posadke
  const pr = pairCrews(date); plan.pairing = pr;
  const crews = pr.crews.map(c => ({ ...c, free:c.shift, pos:BASE_POINT_G(), trips:[], km:0, busy:0 }));
  pr.unpaired.forEach(d => plan.warnings.push({ level:'warn', text:`${d.name} je na delu, a ni prostega vozila.` }));
  pr.looseEsc.forEach(d => plan.warnings.push({ level:'info', text:`${d.name} (spremljevalec) nima voznika.` }));
  pr.looseHelp.forEach(d => plan.warnings.push({ level:'info', text:`${d.name} (${d.role === 'dijak' ? 'dijak' : 'študent'}) nima posadke.` }));
  pr.notes.forEach(t => plan.warnings.push({ level:'info', text:t }));
  if (!crews.length && rides.length) plan.warnings.push({ level:'bad', text:'Ni nobene posadke z vozilom. Dodaj zaposlene in razpoložljiva vozila.' });
  if (plan.standby && crews.length > 1) plan.warnings.push({ level:'info', text:'Vikend/praznik: običajno sta v pripravljenosti 2 zaposlena (ena posadka).' });

  // 3) združevanje v vožnje (stroga pravila najprej, prilagojena samo če je treba)
  //    Isti cilj ali (različica »sorodni cilji«) bližnji cilji, npr. UKC in Onkološki inštitut v Ljubljani: ena vožnja z več cilji.
  const maxCaps = crews.length ? crews.map(c => c.vehicle) : availableVehicles(date);
  const capable = (counts, lv) => maxCaps.some(v => fits(counts, v, lv));
  const timed = rides.filter(r => r.time != null).sort((a,b) => a.time - b.time);
  const untimed = rides.filter(r => r.time == null);
  let trips = [];
  const refOf = t => { const ts = t.rides.map(r => r.time).filter(x => x != null); if (!ts.length) return null; return t.kind === 'from' ? Math.max(...ts) : Math.min(...ts); };
  const anchorOf = r => r.kind === 'from' ? r.from : r.to;
  const destMin = cfgS.destMin ?? 12, maxDests = cfgS.maxDests ?? 3;
  const okPt = p => p.kind !== 'neznano' && p.kind !== 'prazno';
  const similar = (a, b) => a.key === b.key || (opts.cluster && okPt(a) && okPt(b) && leg(a, b).min <= destMin && leg(b, a).min <= destMin);
  for (const r of [...timed, ...untimed]){
    const anchor = anchorOf(r);
    const stages = (level === 1 || r.force) ? [0, 1] : [0];
    let best = null, bestStage = 0;
    for (const st of stages){
      const cf = st ? cfgB : cfgS;
      for (const t of trips){
        if (t.kind !== r.kind || t.pin !== r.pin) continue;
        if ((r.stay > 0 || t.rides.some(x => x.stay > 0)) && !t.pts.some(p => p.key === anchor.key)) continue;   // čakanje na pregled: samo isti cilj (reševalec se vrne po pacienta)
        if (!t.pts.some(p => p.key === anchor.key)){
          if (!opts.cluster || t.pts.length >= maxDests || !t.pts.every(p => similar(p, anchor))) continue;
        }
        const ref = refOf(t);
        if (ref != null && r.time != null && Math.abs(ref - r.time) > cf.window) continue;
        if (anchor.kind === 'neznano' && !t.pts.some(p => p.key === anchor.key)) continue;
        if (!capable(countModes([...t.rides, r]), st)) continue;
        const ev = bestInsert(r.kind, t.ev.order, r, t.anchor, cf, leg);
        if (ev.maxRide > cf.maxRide) continue;
        const extra = ev.dur - t.ev.dur;
        if (extra > cf.detour) continue;
        if (!best || extra < best.extra) best = { t, ev, extra };
      }
      if (best){ bestStage = st; break; }
    }
    if (best){ best.t.rides.push(r); best.t.ev = best.ev; if (!best.t.pts.some(p => p.key === anchor.key)) best.t.pts.push(anchor); if (bestStage || r.force) best.t.lvl = 1; }
    else trips.push({ id:uid(), kind:r.kind, anchor, pts:[anchor], rides:[r], ev:evalTrip(r.kind, [r], anchor, cfgS, leg), pin:r.pin, lvl:r.force ? 1 : 0 });
  }
  trips.forEach(t => { t.ev = bestExact(t.kind, t.ev.order, t.anchor, t.lvl ? cfgB : cfgS, leg); });

  // 4) ključni časi vožnje
  const qkey = t => (opts.order === 'dur' ? -t.ev.dur : (t.need ?? 1e6)) + (rng ? (rng() - 0.5) * opts.jit : 0) + (opts.gaps && t.rides.some(r => r.dia) ? -1e5 : 0);   // dializni prevozi imajo fiksne ure: najprej njih
  const prep = t => {
    t.ref = refOf(t);
    t.counts = countModes(t.rides);
    const ev = t.ev, vis = ev.visit;
    t.anchor = vis[0];
    t.first = t.kind === 'from' ? vis[0] : ev.order[0].from;
    t.last = ev.lastPt;
    t.rdy = t.kind === 'from' ? ev.rd : null;                 // ODVOZ: najzgodnejši začetek, da noben pacient ne čaka
    if (t.kind === 'to'){ t.latestS = ev.dl == null ? null : ev.dl - cfgS.buffer; t.latestB = ev.dl == null ? null : ev.dl - cfgB.buffer; t.need = t.latestS; }
    else { t.latestS = t.latestB = null; t.need = t.rdy; }
    t.sbReturn = t.kind === 'from' && vis.every(p => p.kind === 'poi' && p.poi.home);
    t.force = t.rides.some(r => r.force);
    t.qk = qkey(t);
  };
  trips.forEach(prep);
  const hasNN = crews.some(c => c.team === 'NN');
  const hasLeze = rides.some(r => r.mode === 'leze');
  const baseG = BASE_POINT_G();

  // 5) razdelitev vožnj med posadke
  const queue = trips.slice().sort((a,b) => a.qk - b.qk);
  const crewFor = pin => crews.filter(c => !pin || c.id === pin);
  /* Mesta v dnevu posadke, kamor se lahko vstavi vožnja. Osnovni razpored: samo na konec (kot prej). Napredni: tudi v vrzeli med vožnjami
     (npr. dializna posadka po koncu dializnih voženj, ali med prevozom tja in nazaj). */
  const slotsOf = c => {
    if (!opts.gaps) return [{ i:c.trips.length, free:c.free, pos:c.pos, next:null }];
    const out = []; let free = c.shift, pos = baseG;
    for (let i = 0; i <= c.trips.length; i++){
      out.push({ i, free, pos, next:c.trips[i] || null });
      if (c.trips[i]){ free = c.trips[i].end; pos = c.trips[i].last; }
    }
    return out;
  };
  let guard = 0;
  while (queue.length && guard++ < 800){
    const t = queue.shift();
    let pool = crewFor(t.pin);
    if (t.pin && !crews.some(c => c.id === t.pin)){
      pool = crews;
      const lockedN = t.rides.filter(r => r.locked).map(r => r.nr);
      plan.warnings.push({ level:lockedN.length ? 'bad' : 'info', text:lockedN.length ? `Prevoz ${lockedN.join(', ')} je že v teku pri vozilu, ki ni več v razporedu; izbrano je drugo vozilo. Posadki sporoči spremembo.` : `Pripeto vozilo za prevoz ${t.rides.map(r => r.nr).join(', ')} ni na voljo; izbrano je drugo vozilo.` });
    }
    const stages = (level === 1 || t.force || t.lvl) ? [0, 1] : [0];
    const isDia = t.rides.some(r => r.dia);
    let best = null, capOk = false, shiftBlocked = false, lezNoTeam = false, shiftNeed = null, shiftCrew = null;
    for (const st of stages){
      for (const c of pool){
        if (t.counts.leze > 0 && c.solo){ lezNoTeam = true; continue; }   // leže: 2 reševalca za nošenje
        if (!fits(t.counts, c.vehicle, st)) continue;
        capOk = true;
        const latest = st ? t.latestB : t.latestS;
        for (const sl of slotsOf(c)){
          const d = leg(sl.pos, t.first), arrive = sl.free + d.min;
          let start = arrive, late = 0;
          if (t.kind === 'to' && latest != null){ start = Math.max(arrive, latest); late = Math.max(0, arrive - latest); }
          else if (t.kind === 'from' && t.rdy != null){ start = Math.max(arrive, t.rdy); late = Math.max(0, arrive - t.rdy - cfgS.waitTol); }
          const endT = tripEnd(t.ev, start);
          let detour = 0;
          if (sl.next){   // vstavljanje v vrzel med dvema vožnjama: do naslednje mora biti dovolj časa (naslednja vožnja se ne premakne)
            const ln = leg(t.last, sl.next.first);
            if (endT + ln.min > sl.next.start + 1e-6) continue;
            detour = Math.max(0, ln.min - leg(sl.pos, sl.next.first).min);
          } else {
            const endAbs = endT + leg(t.last, baseG).min;
            if (c.end != null){ const okOt = Math.max(c.ot, st ? (S.rules.overtimeMax || 0) : 0); if (endAbs > c.end + okOt){ shiftBlocked = true; const need = Math.ceil(endAbs - (c.end + okOt)); if (shiftNeed == null || need < shiftNeed){ shiftNeed = need; shiftCrew = c; } continue; } }
          }
          const idle = start - arrive;
          let cost = late * 20 + d.min + detour + idle * 0.05 + c.trips.length * 0.5 + (st ? 25 : 0);
          if (c.vehicle.fn === 'dializa'){
            if (!opts.gaps) cost += isDia ? -15 : 45;   // osnovni razpored: dializno vozilo za druge prevoze samo po potrebi
            else if (isDia) cost -= 30;
            else cost += c.trips.some(x => x.dia) ? (sl.next && sl.next.dia ? 12 : 0) : 6;   // po koncu dializnih voženj je posadka prosta za sede prevoze; med njimi le, če je vrzel dovolj velika
          }
          if (t.sbReturn){ if (c.team === 'NN') cost -= 20; else if (hasNN) cost += 15; }
          if (opts.fit){   // primerno vozilo: ne zasedaj večjega vozila, kot je treba, in ne vozila z nosili, če jih ta dan potrebuje leže pacient
            const cap = capOf(c.vehicle, st), n = t.counts.sede + t.counts.leze + t.counts.utila;
            cost += opts.fit * Math.max(0, cap.skupaj - n);
            if (hasLeze && !t.counts.leze && c.vehicle.leze > 0) cost += 8;
          }
          if (!best || cost < best.cost) best = { c, d, arrive, start, late, cost, st, latest, sl };
        }
      }
    }
    if (!best && lezNoTeam) plan.warnings.push({ level:'bad', text:`Prevoz ${t.rides.map(r => r.nr).join(', ')}: pacient leže potrebuje 2 reševalca (voznik + spremljevalec) in vozilo z nosili.` });
    if (!best){
      if (t.rides.length > 1){
        t.rides.forEach(r => { const a = anchorOf(r); const nt = { id:uid(), kind:r.kind, anchor:a, pts:[a], rides:[r], ev:evalTrip(r.kind,[r],a,cfgS,leg), pin:r.pin, lvl:r.force ? 1 : 0 }; prep(nt); queue.push(nt); });
        queue.sort((a,b) => a.qk - b.qk);
      } else {
        const r = t.rides[0];
        const why = !crews.length ? 'ni posadke z vozilom'
          : !capOk ? `nobeno razpoložljivo vozilo ne sprejme načina prevoza (${MODES[r.mode] || r.mode})`
          : shiftBlocked ? 'izmena posadke se konča prej (vpiši nadure pri zaposlenem ali dovoli prilagoditev pravil)' : 'ni primerne posadke';
        plan.unassigned.push({ ride:r, reason:why, shiftNeed:shiftBlocked ? shiftNeed : null, shiftCrew:shiftBlocked && shiftCrew ? shiftCrew.driver.name : '', shiftVeh:shiftBlocked && shiftCrew ? shiftCrew.vehicle.name : '' });
      }
      continue;
    }
    const { c, d, start, late, sl } = best;
    const trip = { id:t.id, kind:t.kind, rides:t.ev.order, ev:t.ev, anchor:t.anchor, dests:t.ev.visit, start, depart:start - d.min, deadKm:d.km, from:sl.pos, first:t.first, last:t.last, dia:isDia, late:Math.round(late), counts:t.counts, ref:t.ref, sbReturn:t.sbReturn, pin:t.pin,
      wait: t.kind === 'from' && t.rdy != null ? Math.max(0, Math.round(best.arrive - t.rdy)) : 0, stage:best.st, forced:t.force,
      latestDepart: best.latest != null ? best.latest - d.min : null, shiftLimited: t.kind === 'to' && best.latest != null && c.trips.length === 0 && late > 0 };
    trip.end = tripEnd(t.ev, start);
    c.trips.splice(sl.i, 0, trip);
    if (!opts.gaps){ c.free = trip.end; c.pos = t.last; }
  }

  // 6) izhod: časi postankov, ETA, skupne vrednosti
  const seen = new Set(), cntAll = { real:0, est:0, wait:0 };
  const countLeg = (a, b) => { const k = a.key + '>' + b.key; if (seen.has(k)) return; seen.add(k); legCount(leg(a, b), cntAll); };
  for (const c of crews){
    c.trips.sort((a,b) => a.start - b.start);
    /* verižen izračun: odhod, prazne vožnje (km), zasedenost; vožnje s čakanjem na pregled imajo konec šele po vrnitvi */
    c.km = 0; c.busy = 0; let prevPt = baseG;
    for (const t of c.trips){
      const ev = t.ev;
      if (ev.ret){ t.retStart = retStartOf(ev, t.start); t.waitMin = Math.max(0, Math.round(t.retStart - (t.start + ev.outDur))); t.end = t.retStart + ev.ret.dur; }
      const dd = leg(prevPt, t.first); t.from = prevPt; t.deadKm = dd.km; t.depart = t.start - dd.min;
      c.km += dd.km + ev.km; c.busy += dd.min + (t.end - t.start); prevPt = t.last;
    }
    c.pos = prevPt;
    const back = leg(c.pos, baseG); if (c.trips.length) c.km += back.km;
    c.rideNrs = [];
    for (const t of c.trips){
      const mk = (s, base, isRet) => { const o = { ...s, t:base + s.off, ret:isRet }; const ids = s.rideIds || [s.rideId]; o.people = ids.map(id => t.rides.find(r => r.id === id)); return o; };
      t.stopsAbs = t.ev.stops.map(s => mk(s, t.start, false)).concat(t.ev.ret ? t.ev.ret.stops.map(s => mk(s, t.retStart, true)) : []);
      t.arrive = t.kind === 'to' ? t.start + t.ev.arr : null;
      // ETA za vsakega pacienta: pobiranje, prihod na cilj, rezerva do ure preiskave oziroma čakanje na odvoz
      t.info = {};
      t.stopsAbs.forEach(s => { (s.rideIds || [s.rideId]).forEach(id => { const o = t.info[id] || (t.info[id] = {}); if (s.ret){ if (s.type === 'pu') o.retPickT = s.t; else o.retDropT = s.t; } else if (s.type === 'pu') o.pickT = s.t; else o.dropT = s.t; }); });
      t.rides.forEach(r => {
        const o = t.info[r.id];
        if (t.kind === 'to' && r.time != null) o.slack = Math.round(r.time - o.dropT - (r.extra || 0));
        if (t.kind === 'from' && r.time != null) o.wait = Math.max(0, Math.round(o.pickT - r.time));
      });
      const sl = t.rides.map(r => t.info[r.id].slack).filter(x => x != null);
      t.slack = t.kind === 'to' && sl.length ? Math.min(...sl) : null;
      let prevPt = t.from; t.stopsAbs.forEach(s => { countLeg(prevPt, s.pt); prevPt = s.pt; });
      t.rides.forEach((r, i) => {
        c.rideNrs.push(r.nr);
        const pu = t.stopsAbs.find(s => s.type === 'pu' && (s.rideId === r.id || (s.rideIds && s.rideIds.includes(r.id))));
        const inf = t.info[r.id];
        plan.assign[r.id] = { crewId:c.id, veh:c.vehicle.name, t:pu ? pu.t : t.start, order:i+1, trip:t.id, late:t.late, rideMin:Math.round(t.ev.rideMin[r.id] || 0),
          pickT:inf.pickT, dropT:inf.dropT, retPickT:inf.retPickT ?? null, retT:inf.retDropT ?? null, stay:r.stay || 0, slack:inf.slack ?? null, wait:inf.wait ?? 0, kind:t.kind };
      });
      if (t.late > 0){
        const nrs = t.rides.map(r => r.nr).join(', ');
        const txt = t.shiftLimited ? `${c.vehicle.name}: za pravočasen prihod (prevoz ${nrs}) bi moral voznik štartati ob ${fmtT(t.latestDepart)}, izmena pa se začne ob ${fmtT(c.shift)}. Nastavi zgodnejši začetek izmene.`
          : t.kind === 'from' ? `${c.vehicle.name}: pri odvozu ${nrs} bo pacient čakal približno ${t.wait} min.`
          : `${c.vehicle.name}: prevoz ${nrs} bo zamudil približno ${t.late} min. Dodaj vozilo ali prerazporedi.`;
        plan.warnings.push({ level:'bad', text:txt });
      }
      if (t.ev.ret && t.waitMin > 0) plan.warnings.push({ level:'info', text:`${c.vehicle.name}: prevoz ${t.rides.map(r => r.nr).join(', ')} počaka na pregled približno ${fmtDur(t.waitMin)} (do ${fmtT(t.retStart)}), nato pacienta odpelje nazaj.` });
      plan.totals.stayWait += t.waitMin || 0;
      plan.totals.late += t.late > 0 ? t.rides.length : 0;
      plan.totals.lateMin += t.late > 0 ? t.late * t.rides.length : 0;
      plan.totals.wait += t.wait || 0;
      /* primernost vozila: neizkoriščena mesta in vozilo z nosili za pacienta, ki leže ne potrebuje (ko ta dan nekdo leže potrebuje nosila) */
      plan.totals.waste += Math.max(0, capOf(c.vehicle, t.stage).skupaj - (t.counts.sede + t.counts.leze + t.counts.utila));
      if (hasLeze && !t.counts.leze && c.vehicle.leze > 0) plan.totals.stretcherUse++;
    }
    if (c.trips.length) countLeg(c.pos, baseG);
    c.rideNrs.sort((a,b) => a - b);
    c.firstDepart = c.trips.length ? Math.min(...c.trips.map(t => t.depart)) : null;
    c.endAbs = c.trips.length ? c.trips[c.trips.length-1].end + back.min : null;
    c.overtime = c.end != null && c.endAbs != null ? Math.max(0, Math.round(c.endAbs - c.end)) : 0;
    if (c.trips.length && c.firstDepart < c.shift - 1) plan.warnings.push({ level:'warn', text:`${c.vehicle.name}: štart ob ${fmtT(c.firstDepart)} je pred začetkom izmene (${fmtT(c.shift)}).` });
    plan.totals.km += c.km; plan.totals.min += c.busy; plan.totals.overtime += c.overtime; if (c.trips.length) plan.totals.vehicles++;
  }
  plan.totals.realLegs = cntAll.real; plan.totals.estLegs = cntAll.est; plan.totals.waitLegs = cntAll.wait;
  plan.crews = crews;
  plan.unassigned.forEach(u => plan.warnings.push({ level:'bad', nr:u.ride.nr, text:`Prevoz ${u.ride.nr} (${u.ride.name}) ni razporejen: ${u.reason}.` }));

  // 7) prilagoditve pravil: vsaka, ki je bila uporabljena, je izpisana
  for (const c of crews){
    for (const t of c.trips){
      const nrs = t.rides.map(r => r.nr).join(', '), n = t.rides.length, std = capOf(c.vehicle, 0), mx = capOf(c.vehicle, 1);
      if (!fits(t.counts, c.vehicle, 0)) plan.bends.push({ k:'kap', text:`${c.vehicle.name}: ${n} pacientov v vozilu (običajno do ${std.skupaj}, izjemoma do ${mx.skupaj}). Prevozi ${nrs}.` });
      const over = t.rides.filter(r => (t.ev.rideMin[r.id] || 0) > cfgS.maxRide);
      if (over.length) plan.bends.push({ k:'voznja', text:`${c.vehicle.name}: pot v vozilu je daljša od običajnih ${cfgS.maxRide} min (prevoz ${over.map(r => r.nr).join(', ')}).` });
      const ts = t.rides.map(r => r.time).filter(x => x != null);
      if (ts.length > 1 && Math.max(...ts) - Math.min(...ts) > cfgS.window) plan.bends.push({ k:'okno', text:`${c.vehicle.name}: ure pacientov se razlikujejo za več kot običajnih ${cfgS.window} min (prevozi ${nrs}).` });
      if (t.kind === 'to' && t.slack != null && t.slack >= 0 && t.slack < cfgS.buffer) plan.bends.push({ k:'rezerva', text:`${c.vehicle.name}: rezerva pred preiskavo je ${t.slack} min (običajno ${cfgS.buffer} min). Prevozi ${nrs}.` });
    }
    if (c.overtime > 0) plan.bends.push({ k:'nadure', text:`${c.driver.name}: nadure približno ${c.overtime} min (izmena se običajno konča ob ${fmtT(c.end)}).` });
  }
  plan.rides = rides;
  rides.filter(r => r.force && plan.assign[r.id]).forEach(r => plan.bends.push({ k:'rocno', text:`Prevoz ${r.nr} (${r.name}): ročna izjema ali pripeto vozilo.` }));
  plan.bends.forEach(b => plan.warnings.push({ level:'bend', text:b.text }));

  analyzeConflicts(plan, cfgS);
  return plan;
}
function BASE_POINT_G(){ return { key:'poi:'+BASE_POI.n, lat:BASE_POINT.lat, lon:BASE_POINT.lon, kind:'poi', label:BASE_POI.n }; }

/* ---------- Konflikti in opozorila o izvedljivosti ----------
   Vsak konflikt je v plan.conflicts (tip, resnost) in v plan.warnings (prikaz). Prekrivanja posadke, istega pacienta v dveh vožnjah hkrati,
   prevozov v teku, ki bi jih razpored prestavil na drugo vozilo, nelogičnih ur odvoza, dolgega čakanja in ocenjenih (ne cestnih) relacij. */
function analyzeConflicts(plan, cfgS){
  const add = (sev, type, text, nrs, pen) => { plan.conflicts.push({ sev, type, text, nrs:nrs || [], pen:!!pen }); plan.warnings.push({ level:sev, text, conflict:type, nr:(nrs || [])[0] }); };
  const nrsOf = t => t.rides.map(r => r.nr);
  // 1) posadka ali vozilo v dveh vožnjah hkrati
  const vehIds = plan.crews.map(c => c.id);
  if (new Set(vehIds).size !== vehIds.length) add('bad', 'vozilo-dvojno', 'Isto vozilo je v razporedu dvakrat.', [], true);
  for (const c of plan.crews){
    for (let i = 1; i < c.trips.length; i++){
      const a = c.trips[i - 1], b = c.trips[i];
      if (b.depart < a.end - 0.5) add('bad', 'prekrivanje', `${c.vehicle.name}: vožnji (prevozi ${nrsOf(a).join(', ')} in ${nrsOf(b).join(', ')}) se časovno prekrivata.`, [...nrsOf(a), ...nrsOf(b)], true);
    }
  }
  // 2) isti pacient v dveh vožnjah hkrati; ura odvoza pred koncem preiskave
  const byP = new Map(), lg = makeLeg(cfgS);
  plan.rides.forEach(r => { const k = r.pid || norm(r.name); if (!k || r.name === '(brez imena)') return; if (!byP.has(k)) byP.set(k, []); byP.get(k).push(r); });
  for (const list of byP.values()){
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++){
      const A = list[i], B = list[j], a = plan.assign[A.id], b = plan.assign[B.id];
      if (a && b && a.pickT < b.dropT - 0.5 && b.pickT < a.dropT - 0.5)
        add('bad', 'pacient-dvojno', `${A.name} je hkrati v prevozih ${A.nr} (${fmtT(a.pickT)}–${fmtT(a.dropT)}) in ${B.nr} (${fmtT(b.pickT)}–${fmtT(b.dropT)}). Morebiten dvojni vpis.`, [A.nr, B.nr], true);
      if (A.kind === 'to' && B.kind === 'to' && A.time != null && B.time != null){   // dva termina, ki ju pacient fizično ne more doseči
        const need = A.to.key === B.to.key ? 15 : lg(A.to, B.to).min + cfgS.buffer;
        if (Math.abs(A.time - B.time) < need) add('bad', 'pacient-termina', `${A.name}: prevoza ${A.nr} (${A.to.label}, ${A.timeTxt}) in ${B.nr} (${B.to.label}, ${B.timeTxt}) sta preblizu, da bi ga ena oseba dosegla${A.to.key === B.to.key ? ' (morebiten dvojni vpis)' : ' (vožnja med cilji ~' + Math.round(lg(A.to, B.to).min) + ' min)'}.`, [A.nr, B.nr]);
      }
      const to = A.kind === 'to' ? A : (B.kind === 'to' ? B : null), fr = A.kind === 'from' ? A : (B.kind === 'from' ? B : null);
      if (to && fr && to.time != null && fr.time != null && to.to.key === fr.from.key && fr.time < to.time + 15)
        add('warn', 'cas-odvoza', `${to.name}: odvoz (št. ${fr.nr}) je ob ${fr.timeTxt}, prevoz tja (št. ${to.nr}) pa ob ${to.timeTxt}. Preveri uri.`, [to.nr, fr.nr]);
    }
  }
  // 3) prevozi v teku, ki bi jih razpored prestavil na drugo vozilo
  plan.rides.filter(r => r.locked).forEach(r => {
    const a = plan.assign[r.id];
    if (a && a.crewId !== r.pin){ const v = vehById(r.pin); add('bad', 'zaklep', `Prevoz ${r.nr} (${r.name}) je že v teku pri vozilu ${v ? v.name : r.pin}, razpored ga zdaj dodeljuje vozilu ${a.veh}. Posadki sporoči spremembo.`, [r.nr], true); }
  });
  // 4) pacient bi na cilju dolgo čakal
  const wm = cfgS.waitMax ?? 90;
  for (const c of plan.crews) for (const t of c.trips) if (t.kind === 'to') t.rides.forEach(r => {
    const sl = t.info[r.id].slack;
    if (sl != null && sl > wm) add('warn', 'cakanje', `Prevoz ${r.nr} (${r.name}): pacient bo na cilju približno ${sl} min pred uro preiskave. Razmisli o drugem vrstnem redu ali vozilu.`, [r.nr]);
  });
  // 5) cestni podatki: ocenjene relacije in naslovi daleč od ceste
  const rs = ROUTE.info();
  if (rs.on && plan.totals.waitLegs > 0){
    if (rs.status === 'error') add('warn', 'ocena', `Cestni podatki niso dosegljivi (${rs.err || 'napaka'}): ${plan.totals.waitLegs} relacij je ocenjenih (zračna črta × ${cfgS.road}). Časi so lahko netočni.`, []);
    else add('info', 'ocena', `Cestni podatki se nalagajo: ${plan.totals.waitLegs} relacij je za zdaj ocenjenih. Razpored se osveži sam.`, []);
  }
  const far = new Map();
  plan.rides.forEach(r => [r.from, r.to].forEach(p => { if (ROUTE.routable(p) && p.kind !== 'poi'){ const d = ROUTE.snapFar(p); if (d > 2500) far.set(p.key, { p, d, nr:r.nr }); } }));
  far.forEach(({ p, d, nr }) => add('warn', 'cesta-daleč', `Prevoz ${nr}: točka »${p.label}« je ${(d / 1000).toFixed(1)} km od najbližje ceste. Preveri koordinate v Nastavitve → Naslovi.`, [nr]));
}

/* ---------- Predlogi za učinkovitejši razpored ---------- */
function suggestFixes(plan, date, mode){
  const out = [], nrs = a => a.map(x => x.ride ? x.ride.nr : x).join(', ');
  const tot = plan.totals, eff = plan.eff;
  if (eff && eff.tried > 1 && (eff.saved.km > 1 || eff.saved.min > 5 || eff.saved.late > 0 || eff.saved.unassigned > 0)){
    const bits = [];
    if (eff.saved.unassigned > 0) bits.push(`${eff.saved.unassigned} nerazporejenih prevozov manj`);
    if (eff.saved.late > 0) bits.push(`${eff.saved.late} zamud manj`);
    if (eff.saved.km > 1) bits.push(`${Math.round(eff.saved.km)} km manj`);
    if (eff.saved.min > 5) bits.push(`${Math.round(eff.saved.min)} min manj voženj in čakanja`);
    out.push({ k:'opt', tone:'ok', text:`Optimizacija: od ${eff.tried} preizkušenih razporedov je izbran »${eff.variant}« (${bits.join(', ')} kot pri osnovnem razporedu).` });
  }
  const multi = []; plan.crews.forEach(c => c.trips.forEach(t => { if (t.dests && t.dests.length > 1) multi.push({ c, t }); }));
  multi.forEach(({ c, t }) => out.push({ k:'merge', tone:'info', text:`${c.vehicle.name}: prevozi ${t.rides.map(r => r.nr).join(', ')} so v eni vožnji (${tripTitle(t)}), ker so cilji blizu skupaj. Vožnja ${t.kind === 'to' ? 'po vrstnem redu izstopov' : 'po vrstnem redu pobiranja'}: ${t.dests.map(p => p.label).join(' → ')}.` }));
  const un = plan.unassigned;
  if (un.length){
    const sh = un.filter(u => u.shiftNeed != null);
    sh.forEach(u => out.push({ k:'shift', tone:'bad', text:`Prevoz ${u.ride.nr} (${u.ride.name}): podaljšaj izmeno ${u.shiftCrew ? u.shiftCrew + ' (' + u.shiftVeh + ')' : ''} za približno ${u.shiftNeed} min ali dovoli nadure.` }));
    const avail = availableVehicles(date), used = new Set(plan.crews.map(c => c.id)), free = avail.filter(v => !used.has(v.id));
    const need = un.filter(u => u.shiftNeed == null);
    if (need.length && free.length){
      const ok = free.filter(v => need.some(u => fits(countModes([u.ride]), v, 1)));
      if (ok.length) out.push({ k:'veh', tone:'bad', text:`${ok.length > 1 ? 'Prosta vozila' : 'Prosto vozilo'} brez posadke: ${ok.map(v => v.name).join(', ')}. Z dodatnim voznikom bi se rešili prevozi ${nrs(need)}.` });
    }
  }
  if (mode === 'strogo' && plan.level === 0 && planProblem(plan)){
    const alt = bestPlan(date, 1);
    if (planScore(alt) < planScore(plan)) out.push({ k:'bend', tone:'warn', text:`Z načinom »Samodejno« ali »Prosto« (prilagoditev pravil) bi bilo ${alt.unassigned.length} nerazporejenih prevozov in ${alt.totals.late} zamud namesto ${un.length} in ${tot.late}.` });
  }
  plan.crews.forEach(c => c.trips.forEach(t => {
    if (t.late > 0 && t.kind === 'to' && !t.shiftLimited){
      out.push({ k:'late', tone:'bad', text:`${c.vehicle.name}: prevoz ${t.rides.map(r => r.nr).join(', ')} bo zamudil ~${t.late} min. Prestavi uro preiskave za vsaj ${t.late} min, dodaj vozilo ali določi zgodnejši začetek izmene.` });
    }
  }));
  if (ROUTE.enabled() && tot.waitLegs === 0 && tot.realLegs > 0) out.push({ k:'road', tone:'ok', text:`Vse vožnje (${tot.realLegs} relacij) so izračunane po dejanskih cestah (OpenStreetMap).` });
  return out;
}

/* ---------- Opisi vožnje, pot za prikaz in ocena prihoda v živo ---------- */
const tripTitle = t => [...new Set((t.dests && t.dests.length ? t.dests : [t.anchor]).map(p => p.label || (p.poi && p.poi.n) || ''))].filter(Boolean).join(' + ');
function tripWaypoints(t){
  const pts = [t.from, ...t.stopsAbs.map(s => s.pt)];
  return pts.filter((p, i) => !i || p.key !== pts[i - 1].key);
}
const stopDwell = s => { const pp = (s.people || []).filter(Boolean); return pp.length ? loadSum(pp, S.settings, s.type === 'pu' ? 'pick' : 'drop') : (s.type === 'pu' ? S.settings.pickMin : S.settings.dropMin); };
/* ETA glede na dejanski potek: iz časa, ko je posadka sporočila korak (na poti, v vozilu …), naprej po razporedu po cestnih podatkih */
function liveEta(date, r){
  if (!r || !['na_poti', 'na_kraju', 'v_vozilu'].includes(r.status)) return null;
  const plan = computePlan(date), a = plan.assign[r.id]; if (!a) return null;
  const c = plan.crews.find(x => x.id === a.crewId), t = c && c.trips.find(x => x.id === a.trip); if (!t) return null;
  const tm = k => { const iso = r.times && r.times[k]; if (!iso) return null; const d = new Date(iso); return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
  const leg = makeLeg(S.settings), st = t.stopsAbs;
  const has = (s, id) => s.rideId === id || (s.rideIds && s.rideIds.includes(id));
  const iPu = st.findIndex(s => s.type === 'pu' && has(s, r.id)), iDo = st.findIndex(s => s.type === 'do' && has(s, r.id));
  if (iPu < 0 || iDo < 0) return null;
  if (r.status === 'na_poti' && tm('na_poti') != null) return { t:tm('na_poti') + leg(iPu ? st[iPu - 1].pt : t.from, st[iPu].pt).min, what:'prihod k pacientu' };
  if (r.status === 'na_kraju' && tm('na_kraju') != null) return { t:tm('na_kraju') + stopDwell(st[iPu]), what:'odhod s pacientom' };
  if (r.status === 'v_vozilu' && tm('v_vozilu') != null){
    let x = tm('v_vozilu');
    for (let k = iPu + 1; k <= iDo; k++){ x += leg(st[k - 1].pt, st[k].pt).min; if (k < iDo) x += stopDwell(st[k]); }
    return { t:x, what:'prihod na cilj', appt:r.time ? toMin(r.time) : null };
  }
  return null;
}

/* ---------- Knjiga: samodejni vpis posadk v mesečni pregled ---------- */
const shortName = n => n;
function crewLabel(c){ return [c.driver.name, ...c.escorts.map(e => e.name + ' (sp.)'), ...(c.helpers || []).map(h => h.name + ' (' + (ROLE_TAG[h.role] || '') + ')')].join(', '); }
function writeBook(date){
  const duty = S.duty[date] || [];
  const book = S.crewBook[date] || (S.crewBook[date] = {});
  const pr = computePlan(date).pairing;
  const auto = {};
  pr.crews.forEach(c => { auto[c.id] = crewLabel(c); });
  const ost = S.vehicles.find(v => v.tip === 'ostalo');
  if (ost){ const names = [...pr.unpaired.map(d => d.name), ...pr.looseEsc.map(d => d.name)]; if (names.length) auto[ost.id] = names.join(', '); }
  for (const v of S.vehicles){
    const cell = book[v.id] || (book[v.id] = { text:'', manual:false });
    if (cell.manual || v.tip === 'ostalo') continue;   // »Ostalo« je prosto polje za opombe, ga ne prepisujemo
    cell.text = auto[v.id] || '';
  }
  if (!duty.length && !Object.values(book).some(c => c.text || c.manual)) delete S.crewBook[date];
  queueFlush();
}

/* ---------- Opozorila v knjigi ---------- */
function dayWarnings(date){
  const out = []; const rides = filledRides(date);
  const names = {};
  const avail = availableVehicles(date);
  rides.forEach(({ r, nr }) => {
    if (r.odpovedano) return;
    if (!r.name.trim()) out.push({ nr, text:`Polje ${nr}: manjka ime in priimek.` });
    if (!r.time) out.push({ nr, text:`Polje ${nr}: manjka ura preiskave.` });
    if (!r.from.trim() || !r.to.trim()) out.push({ nr, text:`Polje ${nr}: manjka naslov ${!r.from.trim() ? 'od' : 'do'}.` });
    else { const g = geo(r.from); if (g.kind === 'neznano') out.push({ nr, text:`Polje ${nr}: naslova »${r.from}« ni v Občini Brežice. Razdalja bo ocenjena iz centra Brežic.` }); }
    if (!r.phone.trim() && !r.done) out.push({ nr, text:`Polje ${nr}: manjka telefonska številka.` });
    const pt = r.patientId ? patientById(r.patientId) : null;
    if (pt && !r.done){
      const nl = (r.nalogId && (pt.naloge || []).find(x => x.id === r.nalogId)) || activeNalog(pt, date);
      if (!nl) out.push({ nr, text:`Polje ${nr}: pacient ${pt.name} nima veljavnega naloga za ta dan.` });
      else { const s2 = nalogState(nl, date); if (s2.st === 'potekel') out.push({ nr, text:`Polje ${nr}: nalog za prevoz je potekel (${fmtDMY(nl.veljaDo)}).` }); else if (s2.st === 'prihodnji') out.push({ nr, text:`Polje ${nr}: nalog še ne velja (${s2.label}).` }); else if (s2.st === 'kmalu') out.push({ nr, text:`Polje ${nr}: nalog za prevoz ${s2.label} (${fmtDMY(nl.veljaDo)}). Pripravi novega.` }); else if (s2.st === 'nepopoln') out.push({ nr, text:`Polje ${nr}: nalog je nepopoln.` }); }
    }
    const k = norm(r.name) + '|' + (r.dia ? r.diaKey : r.time) + '|' + rideDir(r);
    if (r.name.trim()){ (names[k] = names[k] || []).push(nr); }
    if (r.mode === 'leze'){
      if (avail.length && !avail.some(v => v.leze > 0)) out.push({ nr, text:`Polje ${nr}: pacient leže, razpoložljivo vozilo pa nima nosil.` });
      else if ((S.duty[date] || []).length && !pairCrews(date).crews.some(c => !c.solo && c.vehicle.leze > 0)) out.push({ nr, text:`Polje ${nr}: pacient leže potrebuje voznika in spremljevalca (2 reševalca) ter vozilo z nosili. Vpiši še enega zaposlenega ali izključi razdelitev ekipe.` });
    }
  });
  Object.values(names).filter(a => a.length > 1).forEach(a => out.push({ nr:a[0], text:`Polja ${a.join(' in ')}: ista oseba z isto uro (morebitni dvojni vpis).` }));
  return out;
}

/* ---------- Besedilo razporeda (za kopiranje v Viber/SMS) ---------- */
function planText(date){
  const p = computePlan(date);
  const lines = [`RAZPORED PREVOZOV · ${fmtLong(date)}`];
  const nd = S.dayNote[date]; if (nd) lines.push(`Opomba dneva: ${nd}`);
  if (!p.crews.length) lines.push('Ni posadk z vozilom.');
  p.crews.forEach(c => {
    lines.push('', `${c.vehicle.name} · ${crewLabel(c)}`);
    if (!c.trips.length){ lines.push('  (brez prevozov)'); return; }
    lines.push(`  Štart iz postaje: ${fmtT(c.firstDepart)} · prevozi št. ${c.rideNrs.join(', ')}`);
    c.trips.forEach(t => {
      const est = t.ev.nEst > 0 ? '~' : '';
      t.stopsAbs.forEach(s => {
        const who = (s.people || []).filter(Boolean).map(r => r.name).join(', ');
        const where = s.pt.label || (s.pt.poi && s.pt.poi.n) || '';
        const lbl = s.type === 'pu' ? 'pobere' : 'odpelje';
        const times = s.type === 'do' && t.kind === 'to' ? [...new Set((s.people || []).filter(r => r && r.time != null).map(r => r.timeTxt))] : [];
        lines.push(`  ${est}${fmtT(s.t)} ${lbl}: ${who} (${where})${times.length ? ' · preiskava ' + times.join('/') : ''}`);
      });
      lines.push(`  vožnja: ${t.ev.km.toFixed(0)} km · ${fmtDur(t.ev.dur)}${t.ev.nEst ? ' (ocena)' : ''}`);
    });
    lines.push(`  Skupaj: ${c.km.toFixed(0)} km · konec ob ${fmtT(c.endAbs)}`);
  });
  if (p.bends.length) lines.push('', 'PRILAGOJENA PRAVILA:', ...p.bends.map(b => '  ' + b.text));
  const cf = p.conflicts.filter(x => x.sev !== 'info');
  if (cf.length) lines.push('', 'KONFLIKTI IN OPOZORILA:', ...cf.map(x => '  ' + x.text));
  if (p.unassigned.length) lines.push('', 'NEZARAZPOREJENO: ' + p.unassigned.map(u => `št. ${u.ride.nr} ${u.ride.name}`).join('; '));
  lines.push('', p.totals.waitLegs ? 'Opomba: nekateri časi so ocena (cestni podatki se nalagajo ali niso dosegljivi).' : (p.totals.realLegs ? 'Časi in razdalje: po cestah (OpenStreetMap).' : 'Časi so ocena.'));
  return lines.join('\n');
}
