/* =====================================================================
   RAZPORED: dnevne knjige, dializa, parjenje voznikov in vozil, združevanje in vrstni red prevozov
   Čas vožnje je OCENA: zračna razdalja × faktor ceste; prvih 10 km po lokalnih cestah, preostanek po hitrejših.
   ===================================================================== */
const PLAN_CACHE = new Map();

/* ---------- Knjiga: polja ---------- */
const blankRide = () => ({ id:uid(), name:'', time:'', from:'', to:'', phone:'', mode:'sede', dia:'', diaKey:'', done:false, doneBy:'', doneAt:'', pin:'', demo:false,
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
function rideDir(r){
  const f = geo(r.from), t = geo(r.to);
  if (f.kind === 'poi' && t.kind !== 'poi' && t.kind !== 'prazno') return 'from';
  return 'to';
}

/* ---------- Dializa (pacienti iz baze s skupino dialize) ---------- */
function loadDialysis(date){
  const groups = diaGroupsFor(date, S); if (!groups.length) return 0;
  const a = ensureDay(date); let added = 0;
  const place = obj => {
    let i = a.findIndex(r => !isFilled(r));
    if (i < 0){ a.push(blankRide()); i = a.length - 1; }
    Object.assign(a[i], blankRide(), obj); added++;
  };
  for (const p of S.patients){
    if (!p.dia || !groups.includes(p.dia)) continue;
    const g = S.settings.dia[p.dia];
    const nl = activeNalog(p, date);
    const base = { name:p.name, phone:p.phone, mode:p.mode, dia:p.dia, demo:!!p.demo, patientId:p.id, nalogId:nl ? nl.id : '' };
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

/* ---------- Geometrija ---------- */
function hav(a, b){
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lon - a.lon);
  const h = Math.sin(dLa/2)**2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function makeLeg(cfg){
  const memo = new Map();
  return (a, b) => {
    const k = a.key + '>' + b.key;
    let v = memo.get(k);
    if (!v){
      const km = Math.max(hav(a, b) * cfg.road, a.key === b.key ? 1.2 : 0.8);
      /* Omejitve po ZPrCP (46. člen): naselje 50, izven naselij 90, hitra cesta 110, avtocesta 130 km/h.
         Profil poti: prvih 6 km naselje, nato 14 km izven naselij, 15 km hitra cesta, preostanek avtocesta. */
      const L = cfg.lim || {}, e = (cfg.eff || 85) / 100;
      const s1 = Math.min(km, 6), s2 = Math.min(Math.max(km - 6, 0), 14), s3 = Math.min(Math.max(km - 20, 0), 15), s4 = Math.max(km - 35, 0);
      v = { km, min: (s1 / (L.naselje || 50) + s2 / (L.izven || 90) + s3 / (L.hitra || 110) + s4 / (L.avtocesta || 130)) / e * 60 + 1 };
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

/* ---------- Ocena poti ene vožnje ---------- */
function evalTo(order, dest, cfg, leg){
  let t = 0, km = 0, prev = null; const stops = [], ride = {};
  for (const r of order){
    if (prev){ const l = leg(prev, r.from); t += l.min; km += l.km; }
    stops.push({ type:'pu', off:t, pt:r.from, rideId:r.id });
    t += cfg.pickMin; ride[r.id] = t; prev = r.from;
  }
  const l = leg(prev, dest); t += l.min; km += l.km;
  const arr = t;
  stops.push({ type:'do', off:t, pt:dest, rideIds:order.map(r => r.id) });
  t += cfg.dropMin * order.length;
  let maxRide = 0; const rideMin = {};
  order.forEach(r => { rideMin[r.id] = arr - ride[r.id]; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id]; });
  return { order, stops, arr, dur:t, km, maxRide, rideMin, score:t + (maxRide > cfg.maxRide ? 1000 : 0) };
}
function evalFrom(order, origin, cfg, leg){
  const n = order.length; let t = cfg.pickMin * n, km = 0, prev = origin; const boarded = t;
  const stops = [{ type:'pu', off:0, pt:origin, rideIds:order.map(r => r.id) }]; let maxRide = 0; const rideMin = {};
  for (const r of order){
    const l = leg(prev, r.to); t += l.min; km += l.km;
    stops.push({ type:'do', off:t, pt:r.to, rideId:r.id });
    rideMin[r.id] = t - boarded; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id];
    t += cfg.dropMin; prev = r.to;
  }
  return { order, stops, arr:0, dur:t, km, maxRide, rideMin, score:t + (maxRide > cfg.maxRide ? 1000 : 0) };
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

function computePlan(date){
  const mode = dayMode(date);
  const ck = date + '#' + rev + '#' + mode;
  if (PLAN_CACHE.has(ck)) return PLAN_CACHE.get(ck);
  let plan;
  if (mode === 'strogo') plan = planLevel(date, 0);
  else if (mode === 'prosto') plan = planLevel(date, 1);
  else {
    const p0 = planLevel(date, 0);
    if (!planProblem(p0)) plan = p0;
    else { const p1 = planLevel(date, 1); plan = planScore(p1) < planScore(p0) ? p1 : p0; }
  }
  plan.mode = mode;
  PLAN_CACHE.set(ck, plan);
  return plan;
}

function planLevel(date, level){
  const cfgS = S.settings, cfgB = cfgFor(1), leg = makeLeg(cfgS);
  const plan = { date, level, crews:[], unassigned:[], warnings:[], bends:[], assign:{}, totals:{ rides:0, km:0, min:0, late:0, vehicles:0 }, pairing:null, standby:isStandby(date), pending:[] };

  // 1) vožnje, ki jih je treba opraviti
  const rides = [];
  ensureDay(date).forEach((r, i) => {
    if (!isFilled(r) || r.done || r.odpovedano || r.status === 'preklicana') return;
    const f = geo(r.from), t = geo(r.to);
    rides.push({ id:r.id, nr:i+1, name:(r.name || '').trim() || '(brez imena)', mode:r.mode || 'sede', phone:r.phone || '', time:toMin(r.time), timeTxt:r.time || '',
      from:f, to:t, fromTxt:r.from || '', toTxt:r.to || '', kind:rideDir(r), pin:r.pin || '', exc:!!r.exc, force:!!(r.exc || r.pin), pid:r.patientId || '', dia:r.dia || '' });
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
  const maxCaps = crews.length ? crews.map(c => c.vehicle) : availableVehicles(date);
  const capable = (counts, lv) => maxCaps.some(v => fits(counts, v, lv));
  const timed = rides.filter(r => r.time != null).sort((a,b) => a.time - b.time);
  const untimed = rides.filter(r => r.time == null);
  let trips = [];
  const refOf = t => { const ts = t.rides.map(r => r.time).filter(x => x != null); if (!ts.length) return null; return t.kind === 'from' ? Math.max(...ts) : Math.min(...ts); };
  for (const r of [...timed, ...untimed]){
    const anchor = r.kind === 'from' ? r.from : r.to;
    const stages = (level === 1 || r.force) ? [0, 1] : [0];
    let best = null, bestStage = 0;
    for (const st of stages){
      const cf = st ? cfgB : cfgS;
      for (const t of trips){
        if (t.kind !== r.kind || t.anchor.key !== anchor.key || t.pin !== r.pin) continue;
        const ref = refOf(t);
        if (ref != null && r.time != null && Math.abs(ref - r.time) > cf.window) continue;
        if (anchor.kind === 'neznano' && anchor.key !== t.anchor.key) continue;
        if (!capable(countModes([...t.rides, r]), st)) continue;
        const ev = bestInsert(r.kind, t.ev.order, r, anchor, cf, leg);
        if (ev.maxRide > cf.maxRide) continue;
        const extra = ev.dur - t.ev.dur;
        if (extra > cf.detour) continue;
        if (!best || extra < best.extra) best = { t, ev, extra };
      }
      if (best){ bestStage = st; break; }
    }
    if (best){ best.t.rides.push(r); best.t.ev = best.ev; if (bestStage || r.force) best.t.lvl = 1; }
    else trips.push({ id:uid(), kind:r.kind, anchor, rides:[r], ev:evalTrip(r.kind, [r], anchor, cfgS, leg), pin:r.pin, lvl:r.force ? 1 : 0 });
  }
  trips.forEach(t => { t.ev = bestExact(t.kind, t.ev.order, t.anchor, t.lvl ? cfgB : cfgS, leg); });

  // 4) ključni časi vožnje
  const prep = t => {
    t.ref = refOf(t);
    t.counts = countModes(t.rides);
    t.first = t.kind === 'from' ? t.anchor : t.ev.order[0].from;
    t.last = t.kind === 'from' ? t.ev.order[t.ev.order.length-1].to : t.anchor;
    if (t.kind === 'to'){ t.latestS = t.ref == null ? null : t.ref - cfgS.buffer - t.ev.arr; t.latestB = t.ref == null ? null : t.ref - cfgB.buffer - t.ev.arr; t.need = t.latestS; }
    else { t.latestS = t.latestB = null; t.need = t.ref; }
    t.sbReturn = t.kind === 'from' && t.anchor.kind === 'poi' && t.anchor.poi.home;
    t.force = t.rides.some(r => r.force);
  };
  trips.forEach(prep);
  const hasNN = crews.some(c => c.team === 'NN');
  const baseG = BASE_POINT_G();

  // 5) razdelitev vožnj med posadke
  const queue = trips.slice().sort((a,b) => (a.need ?? 1e6) - (b.need ?? 1e6));
  const crewFor = pin => crews.filter(c => !pin || c.id === pin);
  let guard = 0;
  while (queue.length && guard++ < 800){
    const t = queue.shift();
    let pool = crewFor(t.pin);
    if (t.pin && !crews.some(c => c.id === t.pin)){ pool = crews; plan.warnings.push({ level:'info', text:`Pripeto vozilo za prevoz ${t.rides.map(r => r.nr).join(', ')} ni na voljo; izbrano je drugo vozilo.` }); }
    const stages = (level === 1 || t.force || t.lvl) ? [0, 1] : [0];
    let best = null, capOk = false, shiftBlocked = false, lezNoTeam = false;
    for (const st of stages){
      for (const c of pool){
        if (t.counts.leze > 0 && c.solo){ lezNoTeam = true; continue; }   // leže: 2 reševalca za nošenje
        if (!fits(t.counts, c.vehicle, st)) continue;
        capOk = true;
        const d = leg(c.pos, t.first), arrive = c.free + d.min;
        const latest = st ? t.latestB : t.latestS;
        let start = arrive, late = 0;
        if (t.kind === 'to' && latest != null){ start = Math.max(arrive, latest); late = Math.max(0, arrive - latest); }
        else if (t.kind === 'from' && t.ref != null){ start = Math.max(arrive, t.ref); late = Math.max(0, arrive - t.ref - cfgS.waitTol); }
        const endAbs = start + t.ev.dur + leg(t.last, baseG).min;
        if (c.end != null){ const okOt = Math.max(c.ot, st ? (S.rules.overtimeMax || 0) : 0); if (endAbs > c.end + okOt){ shiftBlocked = true; continue; } }
        const idle = start - arrive;
        let cost = late * 20 + d.min + idle * 0.05 + c.trips.length * 0.5 + (st ? 25 : 0);
        if (c.vehicle.fn === 'dializa') cost += t.rides.some(r => r.dia) ? -15 : 45;   // dializno vozilo za druge prevoze samo po potrebi
        if (t.sbReturn){ if (c.team === 'NN') cost -= 20; else if (hasNN) cost += 15; }
        if (!best || cost < best.cost) best = { c, d, arrive, start, late, cost, st, latest };
      }
    }
    if (!best && lezNoTeam) plan.warnings.push({ level:'bad', text:`Prevoz ${t.rides.map(r => r.nr).join(', ')}: pacient leže potrebuje 2 reševalca (voznik + spremljevalec) in vozilo z nosili.` });
    if (!best){
      if (t.rides.length > 1){
        t.rides.forEach(r => { const a = r.kind === 'from' ? r.from : r.to; const nt = { id:uid(), kind:r.kind, anchor:a, rides:[r], ev:evalTrip(r.kind,[r],a,cfgS,leg), pin:r.pin, lvl:r.force ? 1 : 0 }; prep(nt); queue.push(nt); });
        queue.sort((a,b) => (a.need ?? 1e6) - (b.need ?? 1e6));
      } else {
        const r = t.rides[0];
        const why = !crews.length ? 'ni posadke z vozilom'
          : !capOk ? `nobeno razpoložljivo vozilo ne sprejme načina prevoza (${MODES[r.mode] || r.mode})`
          : shiftBlocked ? 'izmena posadke se konča prej (vpiši nadure pri zaposlenem ali dovoli prilagoditev pravil)' : 'ni primerne posadke';
        plan.unassigned.push({ ride:r, reason:why });
      }
      continue;
    }
    const { c, d, start, late } = best;
    const trip = { id:t.id, kind:t.kind, rides:t.ev.order, ev:t.ev, anchor:t.anchor, start, depart:start - d.min, deadKm:d.km, from:c.pos, late:Math.round(late), counts:t.counts, ref:t.ref, sbReturn:t.sbReturn, pin:t.pin,
      wait: t.kind === 'from' && t.ref != null ? Math.max(0, Math.round(best.arrive - t.ref)) : 0, stage:best.st, forced:t.force,
      latestDepart: best.latest != null ? best.latest - d.min : null, shiftLimited: t.kind === 'to' && best.latest != null && c.trips.length === 0 && late > 0 };
    trip.end = start + t.ev.dur;
    c.trips.push(trip); c.free = trip.end; c.pos = t.last; c.km += d.km + t.ev.km; c.busy += d.min + t.ev.dur;
  }

  // 6) izhod: časi postankov, skupne vrednosti
  for (const c of crews){
    c.trips.sort((a,b) => a.start - b.start);
    const back = leg(c.pos, baseG); if (c.trips.length) c.km += back.km;
    c.rideNrs = [];
    for (const t of c.trips){
      t.stopsAbs = t.ev.stops.map(s => {
        const o = { ...s, t: t.start + s.off };
        const ids = s.rideIds || [s.rideId]; o.people = ids.map(id => t.rides.find(r => r.id === id));
        return o;
      });
      t.arrive = t.kind === 'to' ? t.start + t.ev.arr : null;
      t.slack = t.kind === 'to' && t.ref != null ? Math.round(t.ref - t.arrive) : null;
      t.rides.forEach((r, i) => {
        c.rideNrs.push(r.nr);
        const pu = t.stopsAbs.find(s => s.type === 'pu' && (s.rideId === r.id || (s.rideIds && s.rideIds.includes(r.id))));
        plan.assign[r.id] = { crewId:c.id, veh:c.vehicle.name, t:pu ? pu.t : t.start, order:i+1, trip:t.id, late:t.late, rideMin:Math.round(t.ev.rideMin[r.id] || 0) };
      });
      if (t.late > 0){
        const nrs = t.rides.map(r => r.nr).join(', ');
        const txt = t.shiftLimited ? `${c.vehicle.name}: za pravočasen prihod (prevoz ${nrs}) bi moral voznik štartati ob ${fmtT(t.latestDepart)}, izmena pa se začne ob ${fmtT(c.shift)}. Nastavi zgodnejši začetek izmene.`
          : t.kind === 'from' ? `${c.vehicle.name}: pri odvozu ${nrs} bo pacient čakal približno ${t.wait} min.`
          : `${c.vehicle.name}: prevoz ${nrs} bo zamudil približno ${t.late} min. Dodaj vozilo ali prerazporedi.`;
        plan.warnings.push({ level:'bad', text:txt });
      }
      plan.totals.late += t.late > 0 ? t.rides.length : 0;
    }
    c.rideNrs.sort((a,b) => a - b);
    c.firstDepart = c.trips.length ? Math.min(...c.trips.map(t => t.depart)) : null;
    c.endAbs = c.trips.length ? c.trips[c.trips.length-1].end + back.min : null;
    c.overtime = c.end != null && c.endAbs != null ? Math.max(0, Math.round(c.endAbs - c.end)) : 0;
    if (c.trips.length && c.firstDepart < c.shift - 1) plan.warnings.push({ level:'warn', text:`${c.vehicle.name}: štart ob ${fmtT(c.firstDepart)} je pred začetkom izmene (${fmtT(c.shift)}).` });
    plan.totals.km += c.km; plan.totals.min += c.busy; if (c.trips.length) plan.totals.vehicles++;
  }
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
  return plan;
}
function BASE_POINT_G(){ return { key:'poi:'+BASE_POI.n, lat:BASE_POINT.lat, lon:BASE_POINT.lon, kind:'poi', label:BASE_POI.n }; }

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
      t.stopsAbs.forEach(s => {
        const who = (s.people || []).filter(Boolean).map(r => r.name).join(', ');
        const where = s.type === 'do' && t.kind === 'to' ? (t.anchor.label || t.anchor.poi?.n || '') : (s.pt.label || '');
        const lbl = s.type === 'pu' ? 'pobere' : 'odpelje';
        lines.push(`  ${fmtT(s.t)} ${lbl}: ${who} (${where})`);
      });
    });
  });
  if (p.bends.length) lines.push('', 'PRILAGOJENA PRAVILA:', ...p.bends.map(b => '  ' + b.text));
  if (p.unassigned.length) lines.push('', 'NEZARAZPOREJENO: ' + p.unassigned.map(u => `št. ${u.ride.nr} ${u.ride.name}`).join('; '));
  return lines.join('\n');
}
