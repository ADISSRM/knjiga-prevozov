/* =====================================================================
   DOGODKI, PRIJAVA, ZAČETNI PODATKI, ZAGON
   ===================================================================== */
let CREWS_PIN = [];
const isStaffRole = () => !!(ME && (ME.role === 'skrbnik' || ME.role === 'dispecer'));
const STAFF_VIEWS = ['knjiga', 'dan', 'dispecer', 'zivo', 'pacienti', 'posebnosti', 'nastavitve'];
const logoInner = () => `${logoItem('zd')}<i></i>${logoItem('nmp')}`;
function fillLogos(){ ['authLogos', 'railLogos', 'crewLogos'].forEach(id => { const el = $('#' + id); if (el) el.innerHTML = logoInner(); }); }

function render(){
  if (!ME) return;
  setHeader(); renderNav();
  if (isCrew()){ renderCrewApp(); }
  else if (UI.view === 'knjiga') renderMonth();
  else if (UI.view === 'dan') renderDay();
  else if (UI.view === 'dispecer') renderDispatch();
  else if (UI.view === 'zivo') renderLive();
  else if (UI.view === 'pacienti') renderPatients();
  else if (UI.view === 'posebnosti') renderNotices();
  else renderSettings();
  if (UI.modal) renderModal();
}
function rerender(){ const y = window.scrollY; render(); window.scrollTo(0, y); }
function go(view, push = true){
  if (isCrew()) view = 'moji';
  else if (!STAFF_VIEWS.includes(view)) view = 'knjiga';
  if (UI.view === 'pacienti' && view !== 'pacienti') cleanupEmptyPatient();
  UI.view = view; sgClose();
  if (isStaffRole()){
    if (view === 'dan') ensureRange(addDays(UI.date, -1), addDays(UI.date, 1));
    if (view === 'knjiga') ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`);
    if (view === 'nastavitve') loadRemoteUsers();
  }
  if (push && !isCrew()){ try { if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view); } catch(e){} }
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { const v = (location.hash || '').slice(1); if (ME && isStaffRole() && STAFF_VIEWS.includes(v) && v !== UI.view) go(v, false); });

/* ---------- Izvedba akcij ---------- */
const dutyList = date => (S.duty[date] = S.duty[date] || []);
function addDuty(date, name, team){
  const list = dutyList(date); if (list.some(d => norm(d.name) === norm(name))) return false;
  const standby = isStandby(date);
  const hasDriver = list.some(d => d.role !== 'spremljevalec');
  const st = S.staff.find(s => norm(s.name) === norm(name));
  list.push({ id:uid(), name:name.trim(), staffId:st ? st.id : '', team: standby ? 'pripravljenost' : (team || 'redna'), role: standby && hasDriver ? 'spremljevalec' : 'voznik', from:'', to:'', ot:0, vehicleId:'' });
  return true;
}
function setPath(path, el){
  const parts = path.split('.'); let obj = S;
  for (let i = 0; i < parts.length - 1; i++){ obj = obj[parts[i]]; if (obj == null) return; }
  const key = parts[parts.length - 1];
  let val;
  if (el.dataset.bool) val = el.checked;
  else if (el.dataset.num){ val = parseFloat(el.value); if (!isFinite(val)) return; if (val < 0) val = 0; }
  else val = el.value;
  obj[key] = val;
  if (/^vehicles\.\d+\.(sede|leze|utila|skupaj)$/.test(path)){ // največ ne sme biti manj kot običajno
    const v = obj; ['sede', 'leze', 'utila', 'skupaj'].forEach(k => { if ((+v[k + 'Max'] || 0) < (+v[k] || 0)) v[k + 'Max'] = +v[k] || 0; });
  }
  save();
}
function onRideField(el){
  const art = el.closest('[data-ride]'); if (!art) return;
  const date = art.dataset.date, hit = rideById(date, art.dataset.ride); if (!hit) return;
  const r = hit.r, f = el.dataset.f;
  if (f === 'done'){ r.done = el.checked; r.doneAt = r.done ? new Date().toISOString() : ''; if (!r.done) r.doneBy = ''; else { const p = r.nalogId && patientById(r.patientId); const n = p && (p.naloge || []).find(x => x.id === r.nalogId); if (n && n.vrsta === 'enkratna' && !n.porabljen){ n.porabljen = date; } } }
  else if (el.type === 'checkbox') r[f] = el.checked;
  else r[f] = el.value;
  save();
  if (art.classList.contains('box')) refreshBox(art);
  return { r, f };
}

/* ---------- Naslovi: CSV (WGS84 ali D96/TM), pretvorba koordinat ---------- */
function d96ToWgs84(E, N){
  const a = 6378137, f = 1 / 298.257222101, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 0.9999, lon0 = 15 * Math.PI / 180;
  const x = E - 500000, y = N + 5000000, M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s = Math.sin(phi1), c = Math.cos(phi1), t = Math.tan(phi1);
  const C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = x / (N1 * k0);
  const lat = phi1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
  return { lat:lat * 180 / Math.PI, lon:lon * 180 / Math.PI };
}
function parseCSV(text){
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { rows:[], err:'Datoteka je prazna.' };
  const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const split = l => { const out = []; let cur = '', q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === delim && !q){ out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  const head = split(lines[0]).map(norm);
  const find = re => head.findIndex(h => re.test(h));
  const iU = find(/ulic|street|^ul_|ulica/), iH = find(/^hs$|hisn|^hs_|stevilk|number|^hn$/), iD = find(/^hd$|dodatek|suffix/), iN = find(/naselj|^na_|city|place|kraj/), iO = find(/obcin|^ob_/);
  const iLa = find(/^lat|^y_wgs|sirina/), iLo = find(/^lon|^lng|^x_wgs|dolzina/), iE = find(/^e$|^e_d96|^x$|^e_/), iNn = find(/^n$|^n_d96|^y$|^n_/);
  const geo84 = iLa >= 0 && iLo >= 0, d96 = !geo84 && iE >= 0 && iNn >= 0;
  if (!geo84 && !d96 || iN < 0) return { rows:[], err:'Manjkajo stolpci: naselje in koordinate (lat, lon ali E, N v D96/TM).' };
  const rows = []; let skipped = 0;
  for (let i = 1; i < lines.length && rows.length < 25000; i++){
    const c = split(lines[i]);
    if (iO >= 0 && c[iO] && !/brezic/.test(norm(c[iO]))){ skipped++; continue; }
    let lat, lon;
    if (geo84){ lat = parseFloat((c[iLa] || '').replace(',', '.')); lon = parseFloat((c[iLo] || '').replace(',', '.')); }
    else { const E = parseFloat((c[iE] || '').replace(',', '.')), N = parseFloat((c[iNn] || '').replace(',', '.')); if (!isFinite(E) || !isFinite(N)) continue; ({ lat, lon } = d96ToWgs84(E, N)); }
    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat < 45.78 || lat > 46.08 || lon < 15.3 || lon > 15.95){ skipped++; continue; }   // izven okolice Občine Brežice
    const street = iU >= 0 ? c[iU] : '', num = ((iH >= 0 ? c[iH] : '') + (iD >= 0 ? (c[iD] || '') : '')).trim(), nas = c[iN] || '';
    const t = (street ? street + ' ' + num : nas + ' ' + num).trim() + (street && nas ? ', ' + nas : '');
    rows.push([t, +lat.toFixed(5), +lon.toFixed(5)]);
  }
  return { rows, skipped, err:rows.length ? '' : 'Ni naslovov znotraj okolice Občine Brežice. Preveri stolpce in koordinate.' };
}
function removeDemo(){
  const dutyDates = Object.keys(S.duty).filter(d => S.duty[d].some(x => x.demo));
  Object.keys(S.rides).forEach(d => { S.rides[d] = S.rides[d].map(r => r.demo ? blankRide() : r); });
  S.staff = S.staff.filter(s => !s.demo); S.patients = S.patients.filter(p => !p.demo);
  dutyDates.forEach(d => { S.duty[d] = S.duty[d].filter(x => !x.demo); if (!S.duty[d].length) delete S.duty[d]; if (S.crewBook[d]) delete S.crewBook[d]; });
  if (BACKEND !== 'firebase'){ USERS = USERS.filter(u => !u.demo); saveUsers(); }
  save();
}

/* ---------- Klik ---------- */
const armBtn = (el, label, ms = 3500) => { el.dataset.arm = '1'; el.dataset.old = el.innerHTML; el.textContent = label; setTimeout(() => { if (el.isConnected && el.dataset.arm){ el.removeAttribute('data-arm'); el.innerHTML = el.dataset.old; } }, ms); };
document.addEventListener('click', async e => {
  const t = e.target;
  if (!t.closest('#suggest') && !t.closest('[data-suggest]')) sgClose();
  const sgb = t.closest('#suggest button'); if (sgb){ sgPick(+sgb.dataset.i); return; }
  const nav = t.closest('[data-nav]'); if (nav){ if (nav.dataset.live) UI.lDate = nav.dataset.live; UI.modal = null; go(nav.dataset.nav); return; }
  const el = t.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, date = el.dataset.date;
  switch (a){
    case 'openDay': UI.date = date; go('dan'); break;
    case 'monthPrev': UI.month.m--; if (UI.month.m < 0){ UI.month.m = 11; UI.month.y--; } ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`); render(); break;
    case 'monthNext': UI.month.m++; if (UI.month.m > 11){ UI.month.m = 0; UI.month.y++; } ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`); render(); break;
    case 'monthToday': { const d = new Date(); UI.month = { y:d.getFullYear(), m:d.getMonth() }; render(); break; }
    case 'dayPrev': UI.date = addDays(UI.date, -1); ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); break;
    case 'dayNext': UI.date = addDays(UI.date, 1); ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); break;
    case 'dayToday': UI.date = todayStr(); render(); break;
    case 'dayTomorrow': UI.date = addDays(todayStr(), 1); render(); break;
    case 'filter': UI.filter = el.dataset.k; $$('[data-act=filter]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); applyFilter(); break;
    case 'loadDia': { const n = loadDialysis(UI.date); toast(n ? `Dodanih ${n} dializnih prevozov` : 'Dializni pacienti so že v knjigi ali jih ni v bazi'); rerender(); break; }
    case 'addSlots': addSlots(UI.date, 5); rerender(); toast('Dodanih 5 polj'); break;
    case 'gotoDisp': UI.dDate = date; go('dispecer'); break;
    case 'mode': { const art = el.closest('[data-ride]'); const hit = rideById(art.dataset.date, art.dataset.ride); if (hit){ hit.r.mode = el.dataset.mode; save(); refreshBox(art); } break; }
    case 'clearRide': {
      if (el.dataset.arm){ const art = el.closest('[data-ride]'); const a2 = ensureDay(art.dataset.date); const i = a2.findIndex(r => r.id === art.dataset.ride); if (i >= 0){ a2[i] = blankRide(); save(); rerender(); toast(`Polje ${i+1} počiščeno`); } }
      else { el.dataset.arm = '1'; el.classList.add('danger'); el.style.width = 'auto'; el.style.padding = '0 8px'; el.textContent = 'Počisti?'; setTimeout(() => { if (el.isConnected && el.dataset.arm){ el.removeAttribute('data-arm'); el.removeAttribute('style'); el.classList.remove('danger'); el.innerHTML = IC.x; } }, 3500); }
      break; }
    case 'savePat': { const art = el.closest('[data-ride]'); const p = savePatientFromRide(art.dataset.date, art.dataset.ride); if (p){ toast('Pacient shranjen v bazo'); rerender(); } else toast('Najprej vpiši ime pacienta'); break; }
    case 'rideView': { const art = el.closest('[data-ride]'); const hit = rideById(art.dataset.date, art.dataset.ride); if (hit) openPreview(`Prevoz št. ${hit.nr}`, rideVariants(art.dataset.date, hit.r, hit.nr)); break; }
    case 'openPatient': { if (UI.pid !== el.dataset.id) cleanupEmptyPatient(); UI.pid = el.dataset.id; UI.nid = ''; if (UI.view !== 'pacienti') go('pacienti'); else { render(); window.scrollTo(0, 0); } break; }
    case 'newPatient': { cleanupEmptyPatient(); const p = blankPatient({ color:nextColor() }); S.patients.push(p); UI.pid = p.id; UI.nid = ''; save(); render(); const n = $('#pf-name'); if (n) n.focus(); break; }
    case 'pBack': cleanupEmptyPatient(); UI.pid = ''; UI.nid = ''; render(); break;
    case 'pf': UI.pf = el.dataset.k; render(); break;
    case 'pfAlerts': UI.pf = 'opozorila'; UI.pid = ''; go('pacienti'); break;
    case 'pMode': { const p = patientById(UI.pid); if (p){ p.mode = el.dataset.mode; save(); $$('[data-act=pMode]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); refreshPatientList(); } break; }
    case 'pColor': { const p = patientById(UI.pid); if (p){ p.color = +el.dataset.c; save(); rerender(); } break; }
    case 'delPatient': { if (el.dataset.arm){ removePatient(el.dataset.id); UI.pid = ''; render(); toast('Pacient izbrisan'); } else armBtn(el, 'Potrdi brisanje'); break; }
    case 'addNalog': { const p = patientById(UI.pid); if (!p) break; const n = blankNalog(el.dataset.v); n.od = p.addr || ''; n.mode = p.mode; n.zdravnikVrsta = 'osebni'; if (p.dia && el.dataset.v === 'letna'){ n.razlog = 'Dializa'; n.do = 'SB Brežice – dializa'; } p.naloge = p.naloge || []; p.naloge.push(n); UI.nid = n.id; audit('nalog.dodan', { pid:p.id, vrsta:n.vrsta }); save(); render(); break; }
    case 'editNalog': { UI.nid = UI.nid === el.dataset.id ? '' : el.dataset.id; render(); break; }
    case 'previewNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (p && n){ audit('nalog.predogled', { pid:p.id }); openPreview(`${NALOG_VRSTE[n.vrsta].l} nalog · ${p.name}`, nalogVariants(p, n)); } break; }
    case 'renewNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (!p || !n) break; const from = addDays(n.veljaDo, 1); const m = { ...clone(n), id:uid(), veljaOd:from, veljaDo:defaultValidTo(n.vrsta, from), auto:true, stevilka:'', preklican:false, porabljen:'', created:new Date().toISOString() }; p.naloge.push(m); UI.nid = m.id; audit('nalog.podaljsan', { pid:p.id }); save(); render(); toast('Nov nalog je pripravljen. Vpiši številko in preveri datume.'); break; }
    case 'usedNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (n){ n.porabljen = n.porabljen ? '' : todayStr(); save(); render(); } break; }
    case 'cancelNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (n){ n.preklican = !n.preklican; audit('nalog.preklic', { pid:p.id, preklican:n.preklican }); save(); render(); } break; }
    case 'delNalog': { if (el.dataset.arm){ const p = patientById(UI.pid); if (p){ p.naloge = p.naloge.filter(x => x.id !== el.dataset.id); Object.values(S.rides).forEach(arr => arr.forEach(r => { if (r.nalogId === el.dataset.id) r.nalogId = ''; })); audit('nalog.izbrisan', { pid:p.id }); save(); render(); } } else armBtn(el, 'Potrdi'); break; }
    case 'closeModal': UI.modal = null; renderModal(); break;
    case 'pvVariant': UI.modal.idx = +el.dataset.i; renderModal(); break;
    case 'copyVariant': copyText(UI.modal.variants[UI.modal.idx].text, 'Kopirano'); break;
    case 'copyLine': copyText(UI.modal.variants[UI.modal.idx].text.split('\n')[+el.dataset.i], 'Vrstica kopirana'); break;
    case 'dDate': UI.dDate = date; render(); break;
    case 'lDate': UI.lDate = date; render(); break;
    case 'dayMode': { const d = UI.dDate; S.dayRules[d] = { ...(S.dayRules[d] || {}), mode:el.dataset.k }; audit('pravila.dan', { datum:d, nacin:el.dataset.k }); save(); rerender(); break; }
    case 'dayModeReset': { delete S.dayRules[UI.dDate]; save(); rerender(); break; }
    case 'ruleMode': { S.rules.mode = el.dataset.k; audit('pravila.privzeto', { nacin:el.dataset.k }); save(); render(); break; }
    case 'publish': {
      el.disabled = true; const r = await publishDay(date).catch(err => ({ ok:false, msg:String(err && err.message || err) })); el.disabled = false;
      if (r.ok) toast(`Objavljeno: ${r.runs} posadk, ${r.rides} prevozov` + (r.noAccount.length ? `. Brez računa: ${r.noAccount.join(', ')}` : '')); else toast(r.msg || 'Objava ni uspela');
      rerender(); break; }
    case 'reassign': { const hit = rideById(date, el.dataset.id); if (hit){ hit.r.status = 'nova'; hit.r.pin = ''; hit.r.runKey = ''; save(); toast('Prevoz je vrnjen v razpored. Objavi razpored znova.'); rerender(); } break; }
    case 'toggleStaffDummy': break;
    case 'toggleStaff': { const s = S.staff.find(x => x.id === el.dataset.id); if (!s) break; const list = dutyList(UI.dDate); const i = list.findIndex(d => norm(d.name) === norm(s.name)); if (i >= 0) list.splice(i, 1); else addDuty(UI.dDate, s.name, s.team); save(); rerender(); break; }
    case 'rmDuty': dutyList(UI.dDate).splice(+el.dataset.i, 1); save(); rerender(); break;
    case 'copyDuty': { const prev = S.duty[addDays(UI.dDate, -1)] || []; if (!prev.length){ toast('Prejšnji dan nima vpisanega osebja'); break; } let n = 0; prev.forEach(d => { if (addDuty(UI.dDate, d.name, d.team === 'pripravljenost' ? 'redna' : d.team)) n++; }); save(); rerender(); toast(n ? `Kopiranih ${n} zaposlenih` : 'Vsi so že vpisani'); break; }
    case 'copyPlan': copyText(planText(UI.dDate), 'Razpored kopiran'); break;
    case 'closeNotice': { const n = S.notices.find(x => x.id === el.dataset.id); if (n){ n.closed = true; if (!n.to || n.to > todayStr()) n.to = todayStr(); save(); render(); } break; }
    case 'delNotice': S.notices = S.notices.filter(x => x.id !== el.dataset.id); save(); render(); break;
    case 'setTab': UI.setTab = el.dataset.k; if (UI.setTab === 'varnost') loadAudit(); if (UI.setTab === 'uporabniki') loadRemoteUsers(); render(); break;
    case 'addVeh': S.vehicles.push({ id:uid(), name:'Novo vozilo', tip:'sanitetno', ns:'redna', sede:3, leze:0, utila:0, skupaj:3, sedeMax:3, lezeMax:0, utilaMax:0, skupajMax:3, aktiv:true }); save(); rerender(); break;
    case 'delVeh': { const v = S.vehicles[+el.dataset.i]; if (!v) break; if (el.dataset.arm){ S.vehicles.splice(+el.dataset.i, 1); save(); rerender(); } else { el.dataset.arm = '1'; el.classList.add('danger'); el.style.width = 'auto'; el.style.padding = '0 8px'; el.textContent = 'Potrdi'; } break; }
    case 'delStaff': S.staff.splice(+el.dataset.i, 1); save(); rerender(); break;
    case 'exportAddr': {
      let rows = []; try { rows = JSON.parse(store.get('kp.addr') || '[]'); } catch(e){}
      if (!rows.length){ toast('Ni uvoženih naslovov za prenos'); break; }
      const u = URL.createObjectURL(new Blob([JSON.stringify(rows)], { type:'application/json' })); const l = document.createElement('a'); l.href = u; l.download = 'naslovi.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); audit('naslovi.izvoz', { vrstic:rows.length }); break; }
    case 'clearAddr': store.del('kp.addr'); loadAddr(); rerender(); toast('Uvoženi naslovi izbrisani'); break;
    case 'clearLearned': S.addrBook = []; save(); rerender(); toast('Naučeni naslovi izbrisani'); break;
    case 'delUser': { const u = USERS.find(x => x.id === el.dataset.id); USERS = USERS.filter(x => x.id !== el.dataset.id); S.staff.forEach(s => { if (s.userId === el.dataset.id) s.userId = ''; }); saveUsers(); audit('uporabnik.izbrisan', { uporabnik:u && u.username }); save(); rerender(); break; }
    case 'reloadUsers': await loadRemoteUsers(); rerender(); break;
    case 'selfTest': { UI.selfTest = { running:true }; rerender(); const results = await runSelfTest(); UI.selfTest = { running:false, results, at:Date.now() }; audit('varnostni.preizkus', { neuspesnih:results.filter(r => r.pass === false).length }); rerender(); break; }
    case 'loadAudit': await loadAudit(); break;
    case 'rmLogo': store.del('kp.logo.' + el.dataset.k); fillLogos(); rerender(); break;
    case 'exportData': {
      if (!isAdmin()) break;
      let days = null;   // v načinu Firebase izvozimo VSE dneve iz baze (ne samo naloženega obdobja)
      if (BACKEND === 'firebase'){ try { days = {}; (await DB.list('days')).forEach(x => { days[x.id] = x.data; }); } catch(err){ days = null; toast('Opozorilo: vsi dnevi niso bili preneseni, izvoz vsebuje le naloženo obdobje.'); } }
      const json = JSON.stringify({ app:'knjiga-prevozov', version:2, state:S, addr:ADDR.list.map(x => [x.t, x.lat, x.lon]), ...(days ? { days } : {}) });
      $('#dataBox').value = json.length < 1500000 ? json : ''; audit('podatki.izvoz', { dni:days ? Object.keys(days).length : 0 });
      try { const b = new Blob([json], { type:'application/json' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `knjiga-prevozov-${todayStr()}.json`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch(err){}
      if (json.length < 1500000) copyText(json, 'Izvoz kopiran v odložišče'); else toast('Izvoz shranjen kot datoteka (prevelik za odložišče)'); break; }
    case 'importData': {
      if (!isAdmin()) break;
      try {
        const o = JSON.parse($('#dataBox').value); if (!o.state || !Array.isArray(o.state.vehicles)) throw new Error('bad');
        const def = defaultState(); S = mergeDefaults(o.state, def); normalizeState();
        if (Array.isArray(o.addr)) store.set('kp.addr', JSON.stringify(o.addr));
        if (BACKEND === 'firebase' && o.days && typeof o.days === 'object'){ for (const [d, doc] of Object.entries(o.days)){ if (/^\d{4}-\d{2}-\d{2}$/.test(d)) await DB.set('days/' + d, doc); } }
        SY.snap = {}; loadAddr(); PLAN_CACHE.clear(); rev++; audit('podatki.uvoz', { verzija:o.version || 1 }); await flush().catch(() => {}); toast('Podatki uvoženi'); rerender();
      } catch(err){ toast('Uvoz ni uspel: datoteka ni veljavna kopija'); } break; }
    case 'rmDemo': removeDemo(); rerender(); toast('Primeri odstranjeni'); break;
    case 'wipe': {
      if (BACKEND === 'firebase' || !isAdmin()) break;
      if (el.dataset.arm){ DB.wipe(); const keep = S.settings; S = defaultState(); S.settings = keep; SY.snap = {}; PLAN_CACHE.clear(); rev++; save(); rerender(); toast('Podatki izbrisani'); }
      else { el.dataset.arm = '1'; el.textContent = 'Klikni še enkrat za potrditev'; setTimeout(() => { if (el.isConnected){ el.removeAttribute('data-arm'); el.textContent = 'Izbriši vse podatke'; } }, 6000); }
      break; }
    // ----- posadka -----
    case 'cDate': UI.cDate = date; render(); break;
    case 'crewStep': { el.disabled = true; const ok = await sendStatus(UI.cDate, el.dataset.ride, el.dataset.st); if (ok) toast(`${STATUSI[el.dataset.st].s} ob ${timeOf(new Date().toISOString())}`); el.disabled = false; break; }
    case 'crewNoHome': { if (el.dataset.arm){ el.disabled = true; await sendStatus(UI.cDate, el.dataset.ride, 'ni_doma', { note:'Pacienta ni na naslovu' }); toast('Dispečer je obveščen'); } else armBtn(el, 'Potrdi: ni na naslovu'); break; }
    case 'crewDecline': { const inp = $(`[data-cnote="${el.dataset.ride}"]`); el.disabled = true; await sendStatus(UI.cDate, el.dataset.ride, 'odklonjena', { note:inp ? inp.value.trim() || 'Brez razloga' : '' }); toast('Dispečer je obveščen'); break; }
    case 'crewFix': {
      const inp = $(`[data-cfix="${el.dataset.ride}"]`); if (!inp || !inp.value) break;
      const doc = CREW.docs[UI.cDate]; const st = crewRideState(doc.runKey, el.dataset.ride); if (!st.last) break;
      const iso = new Date(`${UI.cDate}T${inp.value}:00`).toISOString();
      await sendStatus(UI.cDate, el.dataset.ride, st.last.status, { t:iso, corr:true }); toast('Ura popravljena'); break; }
  }
});

/* ---------- Vnos ---------- */
function setPf(el){
  const p = patientById(UI.pid); if (!p) return;
  const k = el.dataset.pf; p[k] = el.value;
  if (k === 'name' || k === 'phone' || k === 'addr' || k === 'dia') refreshPatientList();
  save();
}
function refreshPatientList(){
  const p = patientById(UI.pid); const rows = $('.prows'); if (!rows) return;
  const all = S.patients.slice().sort((a, b) => a.name.localeCompare(b.name, 'sl')).filter(patientMatches);
  rows.innerHTML = all.map(q => { const sm = patientNalogSummary(q); return `<button type="button" class="prow ${q.color >= 0 ? 'pc' + q.color : ''}" data-act="openPatient" data-id="${q.id}" aria-current="${UI.pid === q.id}">${avatarP(q)}<span class="pr-main"><b>${esc(q.name || '(brez imena)')}</b><span class="hint">${esc(q.addr || 'brez naslova')}${q.phone ? ' · ' + esc(q.phone) : ''}</span></span><span class="pr-side">${q.dia ? `<span class="chip mono">${esc(q.dia)}</span>` : ''}${sm.n ? nalogChip(sm.n) : '<span class="chip">brez naloga</span>'}</span></button>`; }).join('') || '<div class="empty-state">Ni pacientov za ta filter.</div>';
  const h = $('.pdetail h3'); if (h && p) h.textContent = p.name || 'Nov pacient';
}
const lastNalogAudit = {};
function setNf(el){
  const p = patientById(UI.pid); const card = el.closest('[data-nalog]'); if (!p || !card) return;
  const n = (p.naloge || []).find(x => x.id === card.dataset.nalog); if (!n) return;
  const k = el.dataset.nf; n[k] = el.value;
  if (k === 'vrsta' || k === 'veljaOd'){ if (n.auto){ n.veljaDo = defaultValidTo(n.vrsta, n.veljaOd); const d = $('#nf-veljaDo', card); if (d) d.value = n.veljaDo; } }
  if (k === 'veljaDo'){ n.auto = false; }
  const head = $('.ncard-head', card), sum = $('.ncard-sum', card), hint = $('.nform-hint', card), pv = $('[data-act=previewNalog]', card);
  const tmp = document.createElement('div'); tmp.innerHTML = nalogCardHTML(p, n);
  if (head) head.innerHTML = $('.ncard-head', tmp).innerHTML; if (sum) sum.innerHTML = $('.ncard-sum', tmp).innerHTML; if (hint) hint.innerHTML = $('.nform-hint', tmp).innerHTML;
  if (pv) pv.disabled = missingNalog(n).length > 0;
  card.className = 'ncard ' + nalogState(n).tone;
  if (k === 'od' || k === 'do') learnAddress(el.value);
  const t = Date.now(); if (!lastNalogAudit[n.id] || t - lastNalogAudit[n.id] > 60000){ lastNalogAudit[n.id] = t; audit('nalog.spremenjen', { pid:p.id }); }
  save();
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-suggest]') && document.activeElement === el) sgOpen(el);
  if (el.dataset.f && el.type !== 'checkbox' && el.tagName !== 'SELECT') onRideField(el);
  if (el.dataset.pf && el.tagName !== 'SELECT') setPf(el);
  if (el.dataset.nf && el.tagName !== 'SELECT' && el.type !== 'date') setNf(el);
  if (el.id === 'dayNote'){ S.dayNote[UI.dDate] = el.value; if (!el.value) delete S.dayNote[UI.dDate]; save(); }
  if (el.id === 'rideSearch'){ UI.q = el.value; applyFilter(); }
  if (el.id === 'patSearch'){ UI.pq = el.value; refreshPatientList(); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.f){
    const res = onRideField(el);
    if (res && (res.f === 'from' || res.f === 'to') && el.value.trim()) learnAddress(el.value);
    if (res && (res.f === 'done' || res.f === 'nalogId' || res.f === 'exc') && (el.closest('.dispatch') || res.f === 'nalogId')) rerender();
    return;
  }
  if (el.dataset.pf){ setPf(el); return; }
  if (el.dataset.nf){ setNf(el); return; }
  if (el.dataset.crew){ const [date, vid] = el.dataset.crew.split('|'); const book = S.crewBook[date] = S.crewBook[date] || {}; const cell = book[vid] = book[vid] || { text:'', manual:false }; cell.text = el.value; cell.manual = el.value.trim() !== ''; el.classList.toggle('auto', false); save(); return; }
  if (el.dataset.duty){ const i = +el.closest('[data-di]').dataset.di; const d = dutyList(UI.dDate)[i]; if (d){ d[el.dataset.duty] = el.dataset.duty === 'ot' ? (+el.value || 0) : el.value; save(); rerender(); } return; }
  if (el.dataset.act === 'vehToggle'){ const list = S.vehOff[UI.dDate] = S.vehOff[UI.dDate] || []; const i = list.indexOf(el.dataset.id); if (el.checked && i >= 0) list.splice(i, 1); if (!el.checked && i < 0) list.push(el.dataset.id); save(); rerender(); return; }
  if (el.dataset.act === 'pin'){ const hit = rideById(UI.dDate, el.dataset.ride); if (hit){ hit.r.pin = el.value; save(); rerender(); } return; }
  if (el.dataset.diaday){ const [g, d] = el.dataset.diaday.split('|'); const days = S.settings.dia[g].days; const n = +d; const i = days.indexOf(n); if (el.checked && i < 0) days.push(n); if (!el.checked && i >= 0) days.splice(i, 1); save(); return; }
  if (el.dataset.coord){ const [i, k] = el.dataset.coord.split('|').map(Number); const s = SETTLEMENTS[i]; const row = el.closest('tr'); const ins = $$('input', row); const lat = parseFloat(ins[0].value), lon = parseFloat(ins[1].value); if (!isFinite(lat) || !isFinite(lon)) return; if (lat === s.lat && lon === s.lon) delete S.coordOv[s.n]; else S.coordOv[s.n] = [lat, lon]; row.lastElementChild.innerHTML = S.coordOv[s.n] ? '<span class="chip accent">spremenjeno</span>' : ''; save(); return; }
  if (el.dataset.urole){ try { await DB.patch('users/' + el.dataset.urole, { set:{ role:el.value }, del:[], n:1 }); audit('uporabnik.vloga', { uid:el.dataset.urole, vloga:el.value }); toast('Vloga spremenjena'); } catch(err){ toast('Ni uspelo: ' + (err.code || err.message)); } loadRemoteUsers(); return; }
  if (el.dataset.uactive){ try { await DB.patch('users/' + el.dataset.uactive, { set:{ active:el.checked }, del:[], n:1 }); audit('uporabnik.aktiven', { uid:el.dataset.uactive, aktiven:el.checked }); toast(el.checked ? 'Račun aktiviran' : 'Račun onemogočen'); } catch(err){ toast('Ni uspelo: ' + (err.code || err.message)); } loadRemoteUsers(); return; }
  if (el.dataset.path){ setPath(el.dataset.path, el); if (/^staff\.\d+\.userId$/.test(el.dataset.path)) audit('zaposleni.racun', {}); return; }
  if (el.dataset.logoFile){
    const f = el.files[0]; if (!f) return;
    if (f.size > 400 * 1024){ toast('Datoteka je prevelika (največ 400 KB)'); el.value = ''; return; }
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){ toast('Dovoljeni so PNG, JPEG, WebP in SVG'); el.value = ''; return; }
    const rd = new FileReader(); rd.onload = () => { store.set('kp.logo.' + el.dataset.logoFile, String(rd.result)); fillLogos(); rerender(); toast('Logotip naložen'); }; rd.readAsDataURL(f); return;
  }
  if (el.id === 'dayPick' && el.value){ UI.date = el.value; ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); return; }
  if (el.id === 'dispPick' && el.value){ UI.dDate = el.value; render(); return; }
  if (el.id === 'csvFile' && el.files[0]){ const txt = await el.files[0].text(); const { rows, err, skipped } = parseCSV(txt); if (err){ toast(err); return; } store.set('kp.addr', JSON.stringify(rows)); loadAddr(); audit('naslovi.uvoz', { vrstic:rows.length }); toast(`Uvoženih ${rows.length} naslovov` + (skipped ? ` (preskočenih ${skipped} izven občine)` : '')); rerender(); return; }
  if (el.id === 'jsonFile' && el.files[0]){ $('#dataBox').value = await el.files[0].text(); toast('Datoteka prebrana. Klikni »Uvozi podatke«.'); }
});
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('[data-suggest]')) sgOpen(e.target); });
/* Ko se z imena pacienta premakneš naprej in ime natančno ustreza pacientu v bazi, se pacient poveže samodejno */
document.addEventListener('focusout', e => {
  const el = e.target; if (!(el.dataset && el.dataset.f === 'name')) return;
  const art = el.closest('[data-ride]'); if (!art) return;
  const hit = rideById(art.dataset.date, art.dataset.ride); if (!hit || hit.r.patientId || !hit.r.name.trim()) return;
  const p = S.patients.find(x => norm(x.name) === norm(hit.r.name)); if (!p) return;
  const next = e.relatedTarget; applyPatientToRide(art.dataset.date, art.dataset.ride, p.id); rerender();
  if (next && next.id){ const n2 = document.getElementById(next.id); if (n2) n2.focus(); }
});
document.addEventListener('mousedown', e => { if (e.target.closest('#suggest')) e.preventDefault(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.modal){ UI.modal = null; renderModal(); return; }
  if (e.key === 'Tab' && UI.modal){ const f = $$('#modal button'); if (f.length){ const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); } } }
  if (!sg.input) return;
  const n = sg.items.length;
  if (e.key === 'ArrowDown'){ e.preventDefault(); sg.idx = (sg.idx + 1) % n; sgRender(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); sg.idx = (sg.idx - 1 + n) % n; sgRender(); }
  else if (e.key === 'Enter' && sg.idx >= 0){ e.preventDefault(); sgPick(sg.idx); }
  else if (e.key === 'Escape' || e.key === 'Tab') sgClose();
});
window.addEventListener('scroll', () => { if (sg.input) sgRender(); }, { passive:true });
window.addEventListener('resize', () => { if (sg.input) sgRender(); });

/* ---------- Obrazci ---------- */
const AUTH_ERR = { 'auth/invalid-credential':'Napačno uporabniško ime ali geslo.', 'auth/wrong-password':'Napačno uporabniško ime ali geslo.', 'auth/user-not-found':'Napačno uporabniško ime ali geslo.', 'auth/invalid-email':'Neveljavno uporabniško ime.', 'auth/too-many-requests':'Preveč poskusov. Počakaj nekaj minut in poskusi znova.', 'auth/network-request-failed':'Ni povezave z internetom.', 'auth/user-disabled':'Račun je onemogočen.' };
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.form || f.id;
  try {
    if (kind === 'addDuty'){ const name = (fd.get('name') || '').trim(); if (!name) return; if (!S.staff.some(s => norm(s.name) === norm(name))) S.staff.push({ id:uid(), name, team:'redna', userId:'' }); addDuty(UI.dDate, name, (S.staff.find(s => norm(s.name) === norm(name)) || {}).team); save(); rerender(); }
    else if (kind === 'addNotice'){ S.notices.push({ id:uid(), vehicleId:fd.get('vehicleId'), tip:fd.get('tip'), from:fd.get('from'), to:fd.get('to') || '', note:(fd.get('note') || '').trim(), closed:false }); save(); render(); toast('Posebnost dodana'); }
    else if (kind === 'addStaff'){ const name = (fd.get('name') || '').trim(); if (name){ S.staff.push({ id:uid(), name, team:fd.get('team'), userId:'' }); save(); rerender(); } }
    else if (kind === 'addUser'){
      if (!isAdmin()) return;
      const un = (fd.get('username') || '').trim(), pw = fd.get('pw') || '';
      if (USERS.some(u => u.username.toLowerCase() === un.toLowerCase())){ $('#userErr').textContent = 'To uporabniško ime že obstaja.'; return; }
      if (pw.length < 10){ $('#userErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      const nu = await makeUser(un, fd.get('name') || '', fd.get('role'), pw, { staffId:fd.get('staffId') || '' }); USERS.push(nu); saveUsers();
      if (nu.staffId){ const st = S.staff.find(s => s.id === nu.staffId); if (st) st.userId = nu.id; }
      audit('uporabnik.dodan', { uporabnik:un, vloga:nu.role }); save(); rerender(); toast('Račun ustvarjen');
    }
    else if (kind === 'remoteRole'){
      if (!isAdmin()) return;
      const id = (fd.get('uid') || '').trim(); if (!/^[A-Za-z0-9]{20,40}$/.test(id)){ $('#userErr').textContent = 'UID ni veljaven (kopiraj ga iz Firebase konzole).'; return; }
      await DB.set('users/' + id, { name:(fd.get('name') || '').trim(), role:fd.get('role'), active:true });
      audit('uporabnik.vloga', { uid:id, vloga:fd.get('role') }); f.reset(); await loadRemoteUsers(); toast('Vloga shranjena');
    }
    else if (kind === 'chPw'){
      const nuPw = fd.get('pw') || ''; if (nuPw.length < 10){ $('#pwErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      if (BACKEND === 'firebase'){
        const u = DB.auth.currentUser; const cred = DB.AU.EmailAuthProvider.credential(u.email, fd.get('old'));
        try { await DB.AU.reauthenticateWithCredential(u, cred); await DB.AU.updatePassword(u, nuPw); } catch(err){ $('#pwErr').textContent = AUTH_ERR[err.code] || 'Gesla ni mogoče spremeniti.'; return; }
      } else {
        const cur = USERS.find(x => x.id === ME.id);
        const old = await hashPw(fd.get('old'), cur.salt, cur.iter); if (old !== cur.hash){ $('#pwErr').textContent = 'Staro geslo ni pravilno.'; return; }
        const nu = await makeUser(cur.username, cur.name, cur.role, nuPw, { staffId:cur.staffId || '', demo:cur.demo }); nu.id = cur.id; USERS[USERS.findIndex(u => u.id === cur.id)] = nu; saveUsers();
      }
      audit('geslo.spremenjeno', {}); f.reset(); $('#pwErr').textContent = ''; toast('Geslo spremenjeno');
    }
    else if (kind === 'setupForm'){
      const pw = fd.get('pw') || ''; if (pw.length < 10){ $('#authErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      const u = await makeUser(fd.get('username') || '', fd.get('name') || '', 'skrbnik', pw); USERS.push(u); saveUsers();
      if (fd.get('demo')) await seedDemo(pw);
      await login(u);
    }
    else if (kind === 'loginForm'){
      if (Date.now() < lockUntil){ $('#authErr').textContent = `Preveč poskusov. Počakaj ${Math.ceil((lockUntil - Date.now()) / 1000)} s.`; return; }
      const un = (fd.get('username') || '').trim().toLowerCase();
      if (BACKEND === 'firebase'){
        const email = un.includes('@') ? un : `${un}@${FB_USER_DOMAIN}`;
        try { await DB.AU.setPersistence(DB.auth, fd.get('remember') ? DB.AU.browserLocalPersistence : DB.AU.browserSessionPersistence); await DB.AU.signInWithEmailAndPassword(DB.auth, email, fd.get('pw') || ''); fails = 0; }
        catch(err){ fails++; if (fails >= 5){ lockUntil = Date.now() + 30000; fails = 0; } $('#authErr').textContent = AUTH_ERR[err.code] || 'Prijava ni uspela.'; }
        return;
      }
      const u = USERS.find(x => x.username.toLowerCase() === un);
      const h = u ? await hashPw(fd.get('pw') || '', u.salt, u.iter) : null;
      if (u && h === u.hash){ fails = 0; await login(u); }
      else { fails++; if (fails >= 5){ lockUntil = Date.now() + 30000; fails = 0; } $('#authErr').textContent = 'Napačno uporabniško ime ali geslo.'; }
    }
  } catch(err){
    if (String(err.message) === 'nosubtle') { const m = $('#authErr'); if (m) m.textContent = 'Brskalnik ne podpira varne prijave. Odpri stran prek https.'; }
    else { console.error(err); toast('Napaka: ' + (err.code || err.message)); }
  }
});
let fails = 0, lockUntil = 0;

/* ---------- Prijava / odjava ---------- */
async function login(u){
  ME = { id:u.id, name:u.name, role:u.role, staffId:u.staffId || '', username:u.username || '' };
  if (BACKEND !== 'firebase') sess.set('kp.sess', JSON.stringify({ id:u.id, t:Date.now() }));
  lastActivity = Date.now();
  $('#auth').hidden = true; $('#app').hidden = false;
  document.body.dataset.role = ME.role; $('#app').classList.toggle('crewmode', isCrew());
  $('#crewLogos').hidden = !isCrew();
  $('#uName').textContent = ME.name; $('#uRole').textContent = ROLES[ME.role] || ME.role; $('#avatar').textContent = (ME.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  fillLogos();
  const d = new Date(); UI.month = { y:d.getFullYear(), m:d.getMonth() };
  UI.date = todayStr(); UI.dDate = d.getHours() >= 12 ? addDays(todayStr(), 1) : todayStr(); UI.lDate = todayStr();
  const h = (location.hash || '').slice(1); UI.view = isCrew() ? 'moji' : (STAFF_VIEWS.includes(h) ? h : 'knjiga');
  applyTheme();
  audit('prijava', {});
  if (isCrew()){ startCrew(); render(); }
  else { render(); await startSync(); loadRemoteUsers(); render(); }
}
async function logout(msg = ''){
  if (ME) audit('odjava', {});
  const wasFb = BACKEND === 'firebase';
  stopSync(); stopCrew(); ME = null; sess.del('kp.sess');
  $('#app').hidden = true; $('#auth').hidden = false; sgClose(); UI.modal = null; renderModal();
  S = defaultState(); normalizeState(); USERS_REMOTE = []; AUDIT.length = 0; Object.keys(EVENTS).forEach(k => delete EVENTS[k]); Object.keys(RUNS).forEach(k => delete RUNS[k]);
  if (wasFb){ try { await DB.shutdown(); } catch(e){} try { sessionStorage.setItem('kp.msg', msg); } catch(e){} location.reload(); return; }
  renderAuth('login', msg);
}
document.addEventListener('click', e => {
  if (e.target.closest('#logoutBtn')) logout();
  if (e.target.closest('#themeBtn')){ const cur = store.get('kp.theme') || 'auto'; const nx = { auto:'dark', dark:'light', light:'auto' }[cur]; store.set('kp.theme', nx); applyTheme(true); }
});
function applyTheme(force){
  const t = store.get('kp.theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else if (force) delete document.documentElement.dataset.theme;
  const b = $('#themeBtn'); if (b) b.textContent = 'Tema: ' + ({ dark:'temna', light:'svetla' }[t] || 'samodejno');
}

/* ---------- Primeri (izmišljeni podatki) ---------- */
async function seedDemo(pw){
  const today = todayStr(), tom = addDays(today, 1), d = n => addDays(today, n);
  const names = [['Matej V.','redna'],['Tina R.','redna'],['Luka B.','NN'],['Nina S.','redna'],['Boštjan Z.','redna'],['Maja T.','NN']];
  S.staff = names.map(([name, team]) => ({ id:uid(), name, team, demo:true, userId:'' }));
  const st = n => S.staff.find(s => s.name === n);
  // demo računi posadke (isto geslo kot skrbnik; odstranijo se z "Odstrani vse primere")
  for (const [un, nm, role, staff] of [['voznik.demo', 'Matej V. (demo)', 'voznik', 'Matej V.'], ['spremljevalec.demo', 'Nina S. (demo)', 'spremljevalec', 'Nina S.'], ['voznik2.demo', 'Boštjan Z. (demo)', 'voznik', 'Boštjan Z.']]){
    const u = await makeUser(un, nm, role, pw, { staffId:st(staff).id, demo:true }); USERS.push(u); st(staff).userId = u.id;
  }
  saveUsers();
  const mkDuty = (n, role, team) => ({ id:uid(), name:n, staffId:st(n).id, team:team || st(n).team, role:role || 'voznik', from:'', to:'', ot:0, vehicleId:'', demo:true });
  S.duty[today] = isStandby(today) ? [mkDuty('Matej V.', 'voznik', 'pripravljenost'), mkDuty('Nina S.', 'spremljevalec', 'pripravljenost')] : [mkDuty('Matej V.'), mkDuty('Boštjan Z.'), mkDuty('Maja T.')];
  S.duty[tom] = isStandby(tom) ? [mkDuty('Tina R.', 'voznik', 'pripravljenost'), mkDuty('Nina S.', 'spremljevalec', 'pripravljenost')] : [{ ...mkDuty('Matej V.'), from:'05:30' }, mkDuty('Tina R.'), mkDuty('Luka B.'), mkDuty('Nina S.', 'spremljevalec')];
  // pacienti in nalogi (različna stanja, da se vidijo opozorila)
  const nl = (vrsta, od, do_, extra = {}) => ({ ...blankNalog(vrsta, od), veljaDo:do_, auto:false, stevilka:'DEMO-' + Math.floor(1000 + Math.random() * 9000), narocnik:'ZD Brežice (osebni zdravnik)', zdravnik:'dr. Primer Vzorec', razlog:'Dializa', od:'', do:'SB Brežice – dializa', ...extra });
  const pt = (name, addr, phone, mode, dia, naloge) => { const p = blankPatient({ name, addr, phone, mode, dia, color:nextColor(), demo:true, naloge:naloge.map(n => ({ ...n, od:n.od || addr })) }); S.patients.push(p); return p; };
  pt('Milan Dializni', 'Velike Malence 3', '031 000 201', 'sede', 'D1', [nl('letna', d(-300), d(65))]);
  pt('Vida Dializna', 'Dobova 90', '031 000 202', 'sede', 'D1', [nl('letna', d(-347), d(18))]);
  pt('Tone Dializni', 'Bizeljsko 12', '031 000 203', 'leze', 'D2', [nl('letna', d(-370), d(-5))]);
  pt('Zora Dializna', 'Čatež ob Savi 4', '031 000 204', 'sede', 'SaD4', [nl('letna', d(-30), d(335))]);
  pt('Ludvik Dializni', 'Cerklje ob Krki 30', '031 000 205', 'sede', 'D3', [nl('letna', d(-120), d(245))]);
  pt('Rozalija Dializna', 'Pišece 18', '031 000 206', 'sede', 'D3', []);
  pt('Ivan Primer', 'Dobova 25', '031 000 101', 'sede', '', [nl('mesecna', d(-21), d(9), { razlog:'Rehabilitacija', do:'UKC Ljubljana' })]);
  pt('Marija Vzorec', 'Čatež ob Savi 12', '031 000 102', 'sede', '', [nl('enkratna', tom, tom, { razlog:'Specialistični pregled', do:'UKC Ljubljana' })]);
  pt('Franc Zgled', 'Cesta prvih borcev 14, Brežice', '031 000 103', 'leze', '', [nl('zdravljenje', d(-10), d(20), { razlog:'Obsevanje', do:'Onkološki inštitut Ljubljana' })]);
  pt('Slavka Zgled', 'Artiče 21', '031 000 108', 'sede', '', []);
  const put = (date, list) => { const a = ensureDay(date); list.forEach((x, i) => { const p = S.patients.find(q => q.name === x.name); Object.assign(a[i], { ...blankRide(), mode:'sede', ...x, demo:true, patientId:p ? p.id : '', nalogId:p && activeNalog(p, date) ? activeNalog(p, date).id : '' }); }); };
  put(tom, [
    { name:'Ivan Primer', time:'08:30', from:'Dobova 25', to:'UKC Ljubljana', phone:'031 000 101' },
    { name:'Marija Vzorec', time:'08:45', from:'Čatež ob Savi 12', to:'UKC Ljubljana', phone:'031 000 102' },
    { name:'Franc Zgled', time:'09:00', from:'Cesta prvih borcev 14, Brežice', to:'UKC Ljubljana', phone:'031 000 103', mode:'leze' },
    { name:'Ana Demo', time:'10:15', from:'Bizeljsko 40', to:'SB Novo mesto', phone:'031 000 104' },
    { name:'Jože Testni', time:'11:00', from:'Pišece 7', to:'SB Brežice', phone:'031 000 105' },
    { name:'Marta Primer', time:'10:30', from:'SB Brežice', to:'Cerklje ob Krki 15', phone:'031 000 106' },
    { name:'Anton Vzorec', time:'11:00', from:'SB Brežice', to:'Sromlje 9', phone:'031 000 107' },
    { name:'Slavka Zgled', time:'13:30', from:'Artiče 21', to:'Onkološki inštitut Ljubljana', phone:'031 000 108' },
    { name:'Peter Demo', time:'14:00', from:'Obrežje 5', to:'ZD Krško', phone:'031 000 109' }
  ]);
  put(today, [
    { name:'Darja Primer', time:'07:30', from:'Dobova 8', to:'SB Brežice', phone:'031 000 111', done:true, doneBy:'Matej V.' },
    { name:'Janez Vzorec', time:'09:00', from:'Mostec 4', to:'SB Brežice', phone:'031 000 112', done:true, doneBy:'Boštjan Z.' },
    { name:'Olga Zgled', time:'12:30', from:'SB Brežice', to:'Globoko 6', phone:'031 000 113' },
    { name:'Viktor Demo', time:'13:15', from:'Čatež ob Savi 31', to:'SB Celje', phone:'031 000 114', mode:'leze' }
  ]);
  [today, tom].forEach(dd => { loadDialysis(dd); });
}

/* ---------- Zagon ---------- */
async function boot(){
  applyTheme();
  S = defaultState(); normalizeState(); loadAddr(); loadSharedAddr(); fillLogos();
  let msg = ''; try { msg = sessionStorage.getItem('kp.msg') || ''; sessionStorage.removeItem('kp.msg'); } catch(e){}
  if (BACKEND === 'firebase'){
    $('#auth').hidden = false; renderAuth('login', 'Povezujem …');
    try { DB = await firebaseAdapter(); }
    catch(err){ console.error(err); renderAuth('login', 'Povezava s Firebase ni uspela. Preveri internet in config.js.'); return; }
    DB.onError = (what, err) => { if (err && err.code === 'permission-denied') toast('Dostop zavrnjen: ' + what); };
    let authMsg = msg;   // sporočilo, ki preživi odjavo (Firebase po signOut sproži še en klic z user = null)
    DB.AU.onAuthStateChanged(DB.auth, async user => {
      if (ME || !user){ if (!user && !ME){ renderAuth('login', authMsg); authMsg = ''; } return; }
      let prof = null; try { prof = await DB.get('users/' + user.uid); } catch(e){}
      if (!prof || !prof.role || prof.active === false){ authMsg = 'Račun nima dodeljene vloge ali je onemogočen. Obrni se na skrbnika.'; await DB.AU.signOut(DB.auth); return; }
      await login({ id:user.uid, name:prof.name || user.email, role:prof.role });
    });
    return;
  }
  DB = localAdapter();
  try { USERS = JSON.parse(store.get('kp.users') || '[]'); } catch(e){ USERS = []; }
  let sessUser = null;
  try { const s = JSON.parse(sess.get('kp.sess') || 'null'); if (s) sessUser = USERS.find(u => u.id === s.id); } catch(e){}
  if (sessUser){ await login(sessUser); }
  else { $('#auth').hidden = false; renderAuth('login', msg); }
}
boot();
