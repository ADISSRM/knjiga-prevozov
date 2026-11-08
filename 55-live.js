/* =====================================================================
   OBJAVA RAZPOREDA, STATUSI PREVOZOV (dispečer) IN APLIKACIJA ZA POSADKE (voznik, spremljevalec)
   Tok: dispečer "Objavi razpored" → crew/{datum}_{uid} (vsak član posadke vidi samo svoj razpored) in runs/{datum}_{vozilo}.
   Posadka pritiska korake → runs/{ključ}/events/{id} (samo dodajanje). Dispečer te dogodke prenese v knjigo (čas, status, "kdo je naredil odvoz").
   ===================================================================== */
const EVENTS = {};      // runKey -> { eventId: event }
const RUNS = {};        // runKey -> run doc (pogled dispečerja)
let renderTimer = null;
const typingNow = () => { const a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest && a.closest('#view') && !['checkbox', 'button', 'radio'].includes(a.type)); };
function scheduleRender(){
  if (!ME) return;
  if (typingNow()){ UI.stale = true; return; }
  clearTimeout(renderTimer); renderTimer = setTimeout(() => { UI.stale = false; rerender(); }, 60);
}
document.addEventListener('focusout', () => { setTimeout(() => { if (UI.stale && !typingNow()){ UI.stale = false; scheduleRender(); } }, 250); });

const staffOfDuty = d => S.staff.find(s => s.id === d.staffId) || S.staff.find(s => norm(s.name) === norm(d.name)) || null;
const hashStr = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const timeOf = iso => { if (!iso) return '–'; const d = new Date(iso); return isNaN(d) ? '–' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- Objava ---------- */
function planSig(date){
  const plan = computePlan(date);
  const rides = ensureDay(date).filter(r => plan.assign[r.id]).map(r => [r.id, r.name, r.time, r.from, r.to, r.phone, r.mode, r.note]);
  return hashStr(JSON.stringify([plan.crews.map(c => [c.id, c.driver.name, c.escorts.map(e => e.name), (c.helpers || []).map(h => h.name), c.trips.map(t => [fmtT(t.depart), t.rides.map(r => r.id)])]), rides]));
}
function publishState(date){
  const p = S.published[date]; if (!p || !p.at) return 'ni';
  return p.sig === planSig(date) ? 'ok' : 'spremenjeno';
}
async function publishDay(date){
  if (!can('publish')) return { ok:false, msg:'Nimaš pravice za objavo.' };
  // pred objavo počakaj na cestne podatke (prvi izračun jih samo zahteva), da so objavljeni časi izračunani po dejanskih cestah
  computePlan(date); try { await ROUTE.settle(); } catch(e){}
  const plan = computePlan(date), at = new Date().toISOString();
  const runs = [], noAccount = new Set(), ridesAssigned = new Set();
  for (const c of plan.crews){
    if (!c.trips.length) continue;
    const members = [c.driver, ...c.escorts, ...(c.helpers || [])], staffs = members.map(staffOfDuty);
    members.forEach((m, i) => { if (!(staffs[i] && staffs[i].userId)) noAccount.add(m.name); });
    const uids = [...new Set(staffs.map(s => s && s.userId).filter(Boolean))];
    const key = date + '_' + c.id, rides = {}, trips = [];
    c.trips.forEach(t => {
      t.rides.forEach(r => {
        const hit = rideById(date, r.id); if (!hit) return;
        const rr = hit.r, p = patientById(rr.patientId), n = p ? (p.naloge || []).find(x => x.id === rr.nalogId) : null;
        rides[r.id] = { nr:hit.nr, name:rr.name, time:rr.time, from:rr.from, to:rr.to, phone:rr.phone, mode:rr.mode, note:rr.note || '', dia:rr.dia || '', color:p && p.color >= 0 ? p.color : -1,
          nalog:n ? { v:NALOG_VRSTE[n.vrsta].l, st:n.stevilka } : null, pickT:fmtT(plan.assign[r.id].t), dropT:(t.ev && (t.ev.nEst || t.ev.nWait) ? '~' : '') + fmtT(plan.assign[r.id].dropT), kind:t.kind };
        ridesAssigned.add(r.id);
      });
      trips.push({ id:t.id, kind:t.kind, anchor:tripTitle(t) || t.anchor.label || '', depart:fmtT(t.depart), est:!!(t.ev && t.ev.nEst), stops:t.stopsAbs.map(s => ({ t:fmtT(s.t), type:s.type, label:s.pt.label || (s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : ''), rideIds:(s.people || []).filter(Boolean).map(r => r.id) })) });
    });
    runs.push({ key, vehId:c.id, vehName:c.vehicle.name, uids, names:members.map(m => m.name), rides, trips, depart:fmtT(c.firstDepart), rideIds:Object.keys(rides) });
  }
  if (!runs.length) return { ok:false, msg:'Ni posadke s prevozi. Najprej sestavi razpored.' };
  const prev = (S.published[date] && S.published[date].runs) || [];
  const runJobs = [], crewJobs = [];
  for (const r of runs){
    runJobs.push(DB.set('runs/' + r.key, { date, vehId:r.vehId, vehName:r.vehName, uids:r.uids, names:r.names, rideIds:r.rideIds, at, by:ME.name }));
    r.uids.forEach(u => crewJobs.push(DB.set('crew/' + date + '_' + u, { date, vehId:r.vehId, vehName:r.vehName, runKey:r.key, uid:u, uids:r.uids, names:r.names, depart:r.depart, trips:r.trips, rides:r.rides, at, by:ME.name })));
  }
  // posadke, ki jih novi razpored ne vsebuje več
  prev.forEach(o => {
    const still = runs.find(r => r.key === o.key);
    if (!still) runJobs.push(DB.set('runs/' + o.key, { date, vehId:o.vehId || '', vehName:o.vehName, uids:[], names:[], rideIds:[], at, by:ME.name, withdrawn:true }));
    (o.uids || []).forEach(u => { if (!still || !still.uids.includes(u)) crewJobs.push(DB.del('crew/' + date + '_' + u)); });
  });
  // najprej "runs" (pravila za dogodke jih potrebujejo), nato razpored posameznih članov posadke
  await Promise.all(runJobs);
  await Promise.all(crewJobs);
  ensureDay(date).forEach(r => {
    const a = plan.assign[r.id];
    if (a){ r.runKey = date + '_' + a.crewId; if (!r.status || r.status === 'nova' || r.status === 'odklonjena') r.status = 'dodeljena'; }
  });
  S.published[date] = { at, by:ME.name, sig:planSig(date), runs:runs.map(r => ({ key:r.key, vehId:r.vehId, vehName:r.vehName, uids:r.uids, names:r.names, n:r.rideIds.length })) };
  audit('razpored.objavljen', { datum:date, vozila:runs.length, prevozov:ridesAssigned.size, prilagoditve:plan.bends.map(b => b.k) });
  save();
  return { ok:true, runs:runs.length, rides:ridesAssigned.size, noAccount:[...noAccount] };
}

/* ---------- Dispečer: sprejem dogodkov posadke ---------- */
function onRuns(changes){
  changes.forEach(c => {
    if (!c.data){ delete RUNS[c.id]; if (SY.runUnsubs[c.id]){ SY.runUnsubs[c.id](); delete SY.runUnsubs[c.id]; } return; }
    RUNS[c.id] = c.data;
    if (!SY.runUnsubs[c.id] && DB) SY.runUnsubs[c.id] = DB.watchCol('runs/' + c.id + '/events', ch => onEvents(c.id, ch));
  });
  remoteChanged();
}
function onEvents(key, changes){
  const m = EVENTS[key] = EVENTS[key] || {};
  changes.forEach(c => { if (c.data) m[c.id] = c.data; else delete m[c.id]; });
  remoteChanged();
}
const sortedEvents = key => Object.values(EVENTS[key] || {}).sort((a, b) => String(a.c || a.t).localeCompare(String(b.c || b.t)));
function applyAllEvents(){
  if (!ME || !isStaffRole()) return false;
  let changed = false;
  for (const key of Object.keys(EVENTS)){
    const run = RUNS[key]; if (!run || !run.date) continue;
    const day = S.rides[run.date]; if (!day) continue;
    const byRide = {};
    sortedEvents(key).forEach(e => { (byRide[e.rideId] = byRide[e.rideId] || []).push(e); });
    for (const [rid, evs] of Object.entries(byRide)){
      const r = day.find(x => x.id === rid); if (!r) continue;
      const times = { ...(r.times || {}) };
      evs.forEach(e => { if (CASI_KLJUC[e.status]) times[e.status] = e.t; });
      const last = evs[evs.length - 1];
      const sameT = JSON.stringify(times) === JSON.stringify(r.times || {});
      if (!sameT){ r.times = times; changed = true; }
      if (r.status !== last.status){ r.status = last.status; r.statusBy = last.by || ''; changed = true; }
      if (last.status === 'zakljucena' && !r.done){ r.done = true; r.doneAt = times.zakljucena || last.t; if (!r.doneBy) r.doneBy = (run.names || []).join(', '); changed = true; }
      if (last.status === 'odklonjena' && r.pin){ r.pin = ''; changed = true; }
      if (last.note && r.statusNote !== last.note){ r.statusNote = last.note; changed = true; }
    }
  }
  if (changed) save();
  return changed;
}
SY.onRemote = () => { if (isStaffRole()) applyAllEvents(); scheduleRender(); };

/* ---------- Dispečer: pogled "Živo" ---------- */
const ST_ORDER = ['odklonjena', 'ni_doma', 'na_kraju', 'na_poti', 'v_vozilu', 'sprejeta', 'dodeljena', 'nova', 'na_cilju', 'zakljucena', 'preklicana'];
const stChip = st => { const d = STATUSI[st] || STATUSI.nova; return `<span class="chip st-${st} ${d.tone}">${esc(d.s)}</span>`; };
function timesChips(r){
  const t = r.times || {};
  return STATUS_FLOW.filter(k => CASI_KLJUC[k] && t[k]).map(k => `<span class="chip mono" title="${esc(STATUSI[k].l)}">${esc(STATUSI[k].s)} ${timeOf(t[k])}</span>`).join('');
}
function liveSummary(date){
  const rows = filledRides(date).filter(x => x.r.status && x.r.status !== 'nova');
  const c = {}; rows.forEach(x => { c[x.r.status] = (c[x.r.status] || 0) + 1; });
  return c;
}
function liveRows(date){
  const published = S.published[date], out = [];
  filledRides(date).forEach(({ r, nr }) => { out.push({ r, nr, run:(published && published.runs || []).find(o => o.key === r.runKey) || null }); });
  return out;
}

/* ---------- Posadka: stanje in dejanja ---------- */
const CREW = { docs:{}, evs:{}, unsubs:[], evUnsub:{}, ready:false, date:null, err:'' };
function startCrew(){
  stopCrew();
  const today = todayStr(), ds = [addDays(today, -1), today, addDays(today, 1)];
  ds.forEach(d => CREW.unsubs.push(DB.watchDoc('crew/' + d + '_' + ME.id, doc => onCrewDoc(d, doc))));
  CREW.date = today;
}
function stopCrew(){
  CREW.unsubs.forEach(u => { try { u(); } catch(e){} }); CREW.unsubs = [];
  Object.values(CREW.evUnsub).forEach(u => { try { u(); } catch(e){} }); CREW.evUnsub = {};
  CREW.docs = {}; CREW.evs = {};
}
function onCrewDoc(d, doc){
  if (doc && doc.runKey){
    CREW.docs[d] = doc;
    if (!CREW.evUnsub[doc.runKey]) CREW.evUnsub[doc.runKey] = DB.watchCol('runs/' + doc.runKey + '/events', ch => onCrewEvents(doc.runKey, ch));
  } else delete CREW.docs[d];
  CREW.ready = true; scheduleRender();
}
function onCrewEvents(key, ch){
  const m = CREW.evs[key] = CREW.evs[key] || {};
  ch.forEach(c => { if (c.data) m[c.id] = c.data; else delete m[c.id]; });
  scheduleRender();
}
function crewRideState(runKey, rideId){
  const evs = Object.values(CREW.evs[runKey] || {}).filter(e => e.rideId === rideId).sort((a, b) => String(a.c || a.t).localeCompare(String(b.c || b.t)));
  const times = {}; evs.forEach(e => { if (CASI_KLJUC[e.status]) times[e.status] = e.t; });
  const last = evs[evs.length - 1];
  return { status:last ? last.status : 'dodeljena', times, last, note:last && last.note || '' };
}
async function sendStatus(date, rideId, status, opts = {}){
  const doc = CREW.docs[date]; if (!doc || !(CASI_KLJUC[status] || ['ni_doma', 'odklonjena'].includes(status))) return false;
  const now = new Date().toISOString();
  const e = { rideId, status, t:opts.t || now, c:now, uid:String(ME.id), by:ME.name };
  if (opts.note) e.note = String(opts.note).slice(0, 200);
  if (opts.corr) e.corr = true;
  try { await DB.add('runs/' + doc.runKey + '/events', e); return true; }
  catch(err){ console.error(err); toast('Pošiljanje ni uspelo. Poskusi znova.'); return false; }
}
const navUrl = addr => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent((addr || '') + ', Slovenija');
