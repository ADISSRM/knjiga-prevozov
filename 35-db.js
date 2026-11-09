/* =====================================================================
   PODATKOVNI SLOJ
   Dva načina, ista pot v kodi:
   - "local": podatki v tem brskalniku (demo, preizkus, artifact). Več zavihkov istega brskalnika se sinhronizira.
   - "firebase": skupna baza (Cloud Firestore) in prijava (Firebase Authentication). Za pravo uporabo.
   Dokumenti: cfg/main, days/{datum}, patients/{id}, crew/{datum}_{uid}, runs/{datum}_{vozilo}[/events/{id}], users/{uid}, audit/{id}
   ===================================================================== */
const KPC = window.KP_CONFIG || {};
const BACKEND = (KPC.mode === 'firebase' && KPC.firebase && KPC.firebase.apiKey && !/VSTAVI|YOUR_|xxxx/i.test(String(KPC.firebase.apiKey))) ? 'firebase' : 'local';
const FB_USER_DOMAIN = KPC.userDomain || 'rp-brezice.example';
let DB = null;

/* ---------- Pomočniki: razlika in zlivanje dokumentov (polje za poljem) ---------- */
const J = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
function diffDoc(a, b, prefix = '', ops = { set:{}, del:[], n:0 }){
  for (const k of Object.keys(b)){
    const p = prefix ? prefix + '.' + k : k;
    if (!(k in a)){ ops.set[p] = b[k]; ops.n++; }
    else if (isObj(a[k]) && isObj(b[k])) diffDoc(a[k], b[k], p, ops);
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])){ ops.set[p] = b[k]; ops.n++; }
  }
  for (const k of Object.keys(a)) if (!(k in b)){ ops.del.push(prefix ? prefix + '.' + k : k); ops.n++; }
  return ops;
}
function applyOps(doc, ops){
  const d = doc || {};
  for (const [p, v] of Object.entries(ops.set || {})){
    const parts = p.split('.'); let o = d;
    for (let i = 0; i < parts.length - 1; i++){ if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = J(v);
  }
  for (const p of (ops.del || [])){
    const parts = p.split('.'); let o = d;
    for (let i = 0; i < parts.length - 1 && o; i++) o = o[parts[i]];
    if (o && isObj(o)) delete o[parts[parts.length - 1]];
  }
  return d;
}
const inRange = (id, r) => !r || ((r.from == null || id >= r.from) && (r.to == null || id <= r.to + '\uf8ff'));
const parentOf = p => p.slice(0, p.lastIndexOf('/'));
const idOf = p => p.slice(p.lastIndexOf('/') + 1);
const newId = () => Date.now().toString(36) + uid();

/* ---------- Lokalni adapter ---------- */
function localAdapter(){
  const PFX = 'kp2.d.', mem = new Map(), dW = new Map(), cW = new Map();
  try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k && k.startsWith(PFX)){ try { mem.set(k.slice(PFX.length), JSON.parse(localStorage.getItem(k))); } catch(e){} } } } catch(e){}
  const persist = p => { try { if (mem.has(p)) localStorage.setItem(PFX + p, JSON.stringify(mem.get(p))); else localStorage.removeItem(PFX + p); } catch(e){} };
  const cur = p => (mem.has(p) ? clone(mem.get(p)) : null);
  const emit = p => {
    (dW.get(p) || []).forEach(f => f(cur(p)));
    const col = parentOf(p), id = idOf(p);
    (cW.get(col) || []).forEach(w => { if (inRange(id, w.range)) w.cb([{ id, data:cur(p) }], { initial:false }); });
  };
  const listIn = (col, range) => [...mem.keys()].filter(p => parentOf(p) === col && inRange(idOf(p), range)).sort().map(p => ({ id:idOf(p), data:cur(p) }));
  window.addEventListener('storage', e => {
    if (!e.key || !e.key.startsWith(PFX)) return;
    const p = e.key.slice(PFX.length);
    if (e.newValue == null) mem.delete(p); else { try { mem.set(p, JSON.parse(e.newValue)); } catch(_){ return; } }
    emit(p);
  });
  // revizijska sled v lokalnem načinu: obdrži zadnjih 1500
  const au = [...mem.keys()].filter(p => parentOf(p) === 'audit').sort();
  au.slice(0, Math.max(0, au.length - 1500)).forEach(p => { mem.delete(p); persist(p); });
  return {
    kind:'local',
    async get(p){ return cur(p); },
    async set(p, d){ mem.set(p, J(d)); persist(p); emit(p); },
    async patch(p, ops){ mem.set(p, applyOps(mem.has(p) ? clone(mem.get(p)) : {}, ops)); persist(p); emit(p); },
    async add(col, d){ const id = newId(); mem.set(col + '/' + id, { ...J(d), ts:new Date().toISOString() }); persist(col + '/' + id); emit(col + '/' + id); return id; },
    async del(p){ mem.delete(p); persist(p); emit(p); },
    async list(col, range){ return listIn(col, range); },
    watchDoc(p, cb){ const a = dW.get(p) || new Set(); dW.set(p, a); a.add(cb); setTimeout(() => cb(cur(p)), 0); return () => a.delete(cb); },
    watchCol(col, cb, range){ const w = { cb, range }, a = cW.get(col) || new Set(); cW.set(col, a); a.add(w); setTimeout(() => { if (a.has(w)) cb(listIn(col, range), { initial:true }); }, 0); return () => a.delete(w); },
    wipe(){ [...mem.keys()].forEach(p => { mem.delete(p); persist(p); }); },
    async shutdown(){}
  };
}

/* ---------- Firebase adapter (SDK se naloži z Googlovega CDN, fiksna različica) ---------- */
const fromFs = v => {
  if (v && typeof v === 'object'){
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (Array.isArray(v)) return v.map(fromFs);
    const o = {}; for (const k of Object.keys(v)) o[k] = fromFs(v[k]); return o;
  }
  return v;
};
async function firebaseAdapter(){
  const base = `https://www.gstatic.com/firebasejs/${KPC.sdkVersion || '10.14.1'}/`;
  const [A, AU, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const app = A.initializeApp(KPC.firebase);
  const auth = AU.getAuth(app);
  let db;
  try { db = F.initializeFirestore(app, KPC.offline === false ? {} : { localCache:F.persistentLocalCache({ tabManager:F.persistentMultipleTabManager() }) }); }
  catch(e){ db = F.getFirestore(app); }
  const dref = p => F.doc(db, p);
  const mkQuery = (col, range) => {
    let q = F.collection(db, col);
    if (range){ const cs = []; if (range.from != null) cs.push(F.where(F.documentId(), '>=', range.from)); if (range.to != null) cs.push(F.where(F.documentId(), '<=', range.to + '\uf8ff')); if (cs.length) q = F.query(q, ...cs); }
    return q;
  };
  const wErr = (what, cb) => err => { console.warn('Firestore listener', what, err && err.code); if (DB && DB.onError) DB.onError(what, err); if (cb) cb(); };
  return {
    kind:'firebase', auth, AU, F,
    async get(p){ const s = await F.getDoc(dref(p)); return s.exists() ? fromFs(s.data()) : null; },
    async set(p, d){ await F.setDoc(dref(p), J(d)); },
    async patch(p, ops){
      const upd = {}; Object.entries(ops.set).forEach(([k, v]) => { upd[k] = J(v); }); ops.del.forEach(k => { upd[k] = F.deleteField(); });
      try { await F.updateDoc(dref(p), upd); }
      catch(e){ if (e && e.code === 'not-found') await F.setDoc(dref(p), applyOps({}, { set:ops.set, del:[] })); else throw e; }
    },
    async add(col, d){ const r = await F.addDoc(F.collection(db, col), { ...J(d), ts:F.serverTimestamp() }); return r.id; },
    async del(p){ await F.deleteDoc(dref(p)); },
    async list(col, range){ const s = await F.getDocs(mkQuery(col, range)); return s.docs.map(d => ({ id:d.id, data:fromFs(d.data()) })); },
    watchDoc(p, cb){ return F.onSnapshot(dref(p), s => cb(s.exists() ? fromFs(s.data()) : null), wErr(p, () => cb(null))); },
    watchCol(col, cb, range){
      let first = true;
      return F.onSnapshot(mkQuery(col, range), snap => {
        const ch = snap.docChanges().map(c => ({ id:c.doc.id, data:c.type === 'removed' ? null : fromFs(c.doc.data()) }));
        const initial = first; first = false;
        if (ch.length || initial) cb(ch, { initial });
      }, wErr(col, () => { if (first){ first = false; cb([], { initial:true }); } }));
    },
    async shutdown(){ try { await F.terminate(db); await F.clearIndexedDbPersistence(db); } catch(e){} try { await AU.signOut(auth); } catch(e){} }
  };
}

/* ---------- Dokumenti: pretvorba med stanjem aplikacije in zbirkami ---------- */
function normalizeState(){
  S.settings.lim = Object.assign({ naselje:50, izven:90, hitra:110, avtocesta:130 }, S.settings.lim || {});
  if (S.settings.eff == null) S.settings.eff = 85;
  S.vehicles.forEach(v => { if (!v.vrsta) v.vrsta = (+v.leze > 0) ? 'resevalni' : 'osebno'; if (!v.fn) v.fn = 'vse'; });
  S.vehicles.forEach(v => {
    ['sede','leze','utila','skupaj'].forEach(k => { v[k + 'Max'] = Math.max(+v[k] || 0, v[k + 'Max'] == null ? (+v[k] || 0) : +v[k + 'Max']); });
  });
  S.patients = S.patients || [];
  if (S.settings.dia){   // stare dializne skupine → dopoldanska / popoldanska
    const d = S.settings.dia, T = S.settings.diaT = S.settings.diaT || {};
    if (d.D1 && d.D1.start) T.dop = { start:d.D1.start, end:d.D1.end };
    if (d.D2 && d.D2.start) T.pop = { start:d.D2.start, end:d.D2.end };
    delete S.settings.dia;
  }
  S.settings.google = Object.assign({ on:true, auto:true, traffic:false }, S.settings.google || {});
  S.places = Array.isArray(S.places) ? S.places : defaultState().places;
  if (S.diaPatients && S.diaPatients.length){
    S.diaPatients.forEach(dp => { if (!S.patients.some(p => norm(p.name) === norm(dp.name))) S.patients.push(migratePatient(blankPatient({ name:dp.name, addr:dp.from, phone:dp.phone, mode:dp.mode, dia:dp.group, demo:dp.demo }))); });
    S.diaPatients = [];
  }
  S.patients.forEach(migratePatient);
}
/* Stara skupina dialize (D1, D2, SaD4, D3) → termin dialize pacienta { t:'dop'|'pop', d:[dnevi v tednu] } */
function migratePatient(p){
  if (p.dia !== undefined){ if (p.dia && !p.dt) p.dt = { t:diaTermOf(p.dia), d:p.dia === 'D3' ? [2, 4, 6] : [1, 3, 5] }; delete p.dia; }
  if (p.dt === undefined) p.dt = null;
  return p;
}
function cfgDoc(){
  return J({ v:2, settings:S.settings, rules:S.rules, vehicles:S.vehicles, staff:S.staff, notices:S.notices, addrBook:S.addrBook, places:S.places,
    coordOv:Object.entries(S.coordOv || {}).map(([n, c]) => ({ n, lat:c[0], lon:c[1] })) });
}
function applyCfg(d){
  const def = defaultState();
  S.settings = mergeDefaults(d.settings || {}, def.settings);
  S.rules = mergeDefaults(d.rules || {}, def.rules);
  S.vehicles = d.vehicles || def.vehicles; S.staff = d.staff || []; S.notices = d.notices || []; S.addrBook = d.addrBook || []; S.places = d.places || def.places;
  S.coordOv = {}; (d.coordOv || []).forEach(o => { S.coordOv[o.n] = [o.lat, o.lon]; });
  normalizeState();
}
function dayDoc(date){
  const rides = {};
  (S.rides[date] || []).forEach((r, i) => { if (isFilled(r)) rides[r.id] = { ...r, nr:i + 1 }; });
  const duty = {}; (S.duty[date] || []).forEach((d, i) => { duty[d.id] = { ...d, ord:i }; });
  const out = { rides, duty, vehOff:S.vehOff[date] || [], crewBook:S.crewBook[date] || {}, dayNote:S.dayNote[date] || '', dayRules:S.dayRules[date] || {}, published:S.published[date] || {} };
  return J(out);
}
function applyDay(date, d){
  d = d || {};
  const arr = [];
  Object.values(d.rides || {}).sort((a, b) => (a.nr || 0) - (b.nr || 0)).forEach(r => {
    let nr = Math.max(1, r.nr || 1); while (arr[nr - 1]) nr++;
    const o = { ...blankRide(), ...r }; delete o.nr; arr[nr - 1] = o;
  });
  const len = Math.max(arr.length, S.settings.slots);
  for (let i = 0; i < len; i++) if (!arr[i]) arr[i] = blankRide();
  S.rides[date] = arr;
  const duty = Object.values(d.duty || {}).sort((a, b) => (a.ord || 0) - (b.ord || 0)).map(x => { const o = { ...x }; delete o.ord; return o; });
  if (duty.length) S.duty[date] = duty; else delete S.duty[date];
  if ((d.vehOff || []).length) S.vehOff[date] = d.vehOff; else delete S.vehOff[date];
  if (Object.keys(d.crewBook || {}).length) S.crewBook[date] = d.crewBook; else delete S.crewBook[date];
  if (d.dayNote) S.dayNote[date] = d.dayNote; else delete S.dayNote[date];
  if (Object.keys(d.dayRules || {}).length) S.dayRules[date] = d.dayRules; else delete S.dayRules[date];
  if (Object.keys(d.published || {}).length) S.published[date] = d.published; else delete S.published[date];
}
const allDays = () => [...new Set([...Object.keys(S.rides), ...Object.keys(S.duty), ...Object.keys(S.crewBook), ...Object.keys(S.dayNote), ...Object.keys(S.vehOff), ...Object.keys(S.dayRules), ...Object.keys(S.published)])];

/* ---------- Sinhronizacija ---------- */
const SY = { snap:{}, unsubs:[], runUnsubs:{}, cfgReady:false, patReady:false, dayReady:false, range:null, started:false, onRemote:null };
async function flush(){
  if (!DB || !ME || !isStaffRole() || !SY.started) return;
  const jobs = [];
  const sync = (path, doc) => {
    const old = SY.snap[path];
    if (!old) jobs.push({ path, doc, p:DB.set(path, doc) });
    else { const ops = diffDoc(old, doc); if (ops.n) jobs.push({ path, doc, p:DB.patch(path, ops) }); }
  };
  if (SY.cfgReady) sync('cfg/main', cfgDoc());
  if (SY.patReady){
    const ids = new Set();
    S.patients.forEach(p => { ids.add(p.id); sync('patients/' + p.id, J(p)); });
    Object.keys(SY.snap).filter(k => k.startsWith('patients/') && !ids.has(k.slice(9))).forEach(k => { jobs.push({ path:k, doc:null, p:DB.del(k) }); });
  }
  if (SY.dayReady) allDays().forEach(d => { if (dayLoaded(d)) sync('days/' + d, dayDoc(d)); });
  const res = await Promise.allSettled(jobs.map(j => j.p));
  let err = null;
  res.forEach((r, i) => { if (r.status === 'fulfilled'){ if (jobs[i].doc) SY.snap[jobs[i].path] = jobs[i].doc; else delete SY.snap[jobs[i].path]; } else err = err || r.reason; });
  if (err) throw err;
}
const dayLoaded = d => !SY.range || (d >= SY.range.from && d <= SY.range.to);

function mergeRemote(path, remote, localDoc){
  const old = SY.snap[path];
  const pend = old ? diffDoc(old, localDoc) : { set:{}, del:[], n:0 };
  SY.snap[path] = J(remote || {});
  return pend.n ? applyOps(J(remote || {}), pend) : (remote || {});
}
function remoteChanged(){ rev++; PLAN_CACHE.clear(); if (SY.onRemote) SY.onRemote(); }
function onCfgDoc(d){
  if (d){ applyCfg(mergeRemote('cfg/main', d, cfgDoc())); }
  else if (!SY.cfgReady){ normalizeState(); }
  SY.cfgReady = true; remoteChanged();
}
function onPatients(changes, meta){
  changes.forEach(c => {
    const path = 'patients/' + c.id, i = S.patients.findIndex(p => p.id === c.id);
    if (!c.data){ if (i >= 0) S.patients.splice(i, 1); delete SY.snap[path]; return; }
    const merged = mergeRemote(path, c.data, i >= 0 ? J(S.patients[i]) : {});
    const p = migratePatient({ ...blankPatient(), ...merged, id:c.id });
    if (i >= 0) S.patients[i] = p; else S.patients.push(p);
  });
  if (meta && meta.initial) SY.patReady = true;
  remoteChanged();
}
function onDays(changes, meta){
  changes.forEach(c => {
    const path = 'days/' + c.id;
    if (!c.data){ if (SY.snap[path]){ delete SY.snap[path]; applyDay(c.id, {}); } return; }
    applyDay(c.id, mergeRemote(path, c.data, dayDoc(c.id)));
  });
  if (meta && meta.initial) SY.dayReady = true;
  remoteChanged();
}
function watchDays(range){
  SY.dayUnsub && SY.dayUnsub();
  SY.range = range; SY.dayReady = !range ? SY.dayReady : false;
  SY.dayUnsub = DB.watchCol('days', onDays, range);
}
function ensureRange(from, to){
  if (!SY.range || !SY.started) return;
  if (from >= SY.range.from && to <= SY.range.to) return;
  watchDays({ from:from < SY.range.from ? from : SY.range.from, to:to > SY.range.to ? to : SY.range.to });
}
async function startSync(){
  if (SY.started) return;
  SY.started = false; SY.cfgReady = SY.patReady = SY.dayReady = false;
  const waits = [];
  const once = () => { let res; const p = new Promise(r => { res = r; }); return [p, res]; };
  const [pc, rc] = once(), [pp, rp] = once(), [pd, rd] = once();
  const today = todayStr();
  SY.unsubs.push(DB.watchDoc('cfg/main', d => { onCfgDoc(d); rc(); }));
  SY.unsubs.push(DB.watchCol('patients', (c, m) => { onPatients(c, m); if (m && m.initial) rp(); }));
  SY.range = DB.kind === 'local' ? null : { from:addDays(today, -35), to:addDays(today, 70) };
  SY.dayUnsub = DB.watchCol('days', (c, m) => { onDays(c, m); if (m && m.initial) rd(); }, SY.range);
  SY.unsubs.push(() => SY.dayUnsub && SY.dayUnsub());
  SY.unsubs.push(DB.watchCol('runs', (c) => onRuns(c), { from:addDays(today, -2), to:addDays(today, 3) }));
  await Promise.race([Promise.all([pc, pp, pd]), new Promise(r => setTimeout(r, 9000))]);
  SY.started = true;
  if (!S.vehicles.length) S.vehicles = defaultState().vehicles;
  await flush().catch(() => {});
}
function stopSync(){
  SY.unsubs.forEach(u => { try { u(); } catch(e){} }); SY.unsubs = [];
  Object.values(SY.runUnsubs).forEach(u => { try { u(); } catch(e){} }); SY.runUnsubs = {};
  SY.started = false; SY.snap = {};
}

/* ---------- Revizijska sled (samo dodajanje) ---------- */
const AUDIT = [];
function audit(action, detail = {}){
  if (!DB || !ME) return;
  const e = { t:new Date().toISOString(), uid:String(ME.id), who:ME.name, role:ME.role, action, detail:J(detail) || {} };
  AUDIT.unshift(e); if (AUDIT.length > 300) AUDIT.pop();
  DB.add('audit', e).catch(() => {});
}
const initials = n => String(n || '').trim().split(/\s+/).map(w => (w[0] || '').toUpperCase()).join('.').slice(0, 5);
