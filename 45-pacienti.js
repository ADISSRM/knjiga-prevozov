/* =====================================================================
   PACIENTI IN NALOGI ZA PREVOZ
   Baza pacientov (shranjena enkrat, nato se izbere), nalogi: letni, mesečni, enkratni, za čas zdravljenja.
   Veljavnost se računa samodejno, en mesec pred iztekom se prikaže opozorilo.
   Privzete veljavnosti so predlog: pri vsakem nalogu preveri datum na papirnatem/elektronskem nalogu.
   ===================================================================== */
const blankPatient = (extra = {}) => ({ id:uid(), name:'', addr:'', phone:'', mode:'sede', dia:'', color:-1, zzzs:'', note:'', naloge:[], demo:false, created:new Date().toISOString(), ...extra });
const blankNalog = (vrsta = 'letna', from = todayStr()) => ({ id:uid(), vrsta, stevilka:'', narocnik:'', izvajalec:'Reševalna postaja Brežice (ZD Brežice)', zdravnik:'', zdravnikVrsta:'osebni', razlog:'', od:'', do:'', mode:'sede',
  veljaOd:from, veljaDo:defaultValidTo(vrsta, from), dnevi:'', opombe:'', preklican:false, porabljen:'', auto:true, created:new Date().toISOString() });
const patientById = id => S.patients.find(p => p.id === id) || null;
const fmtDMY = s => { if (!s) return '–'; const d = parseYmd(s); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
function endOfMonthStr(s){ const d = parseYmd(s); return ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }
function defaultValidTo(vrsta, from){
  if (!from) return '';
  if (vrsta === 'letna'){ const d = parseYmd(from); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return ymd(d); }
  if (vrsta === 'mesecna') return endOfMonthStr(from);
  if (vrsta === 'enkratna') return from;
  return addDays(from, 27);   // za čas zdravljenja: predlog 4 tedni, vpiši po nalogu
}

/* ---------- Stanje naloga ---------- */
function nalogState(n, onDate = todayStr()){
  /* Letni nalog: opozorilo 30 dni vnaprej (nastavljivo). Mesečni in za čas zdravljenja: krajše okno (7 dni), sicer bi bil opozorjen ves mesec. Enkratni: samo na dan veljavnosti. */
  const warnDays = n.vrsta === 'letna' ? (S.rules.opozoriloDni ?? 30) : n.vrsta === 'enkratna' ? 0 : (S.rules.opozoriloKratki ?? 7);
  if (n.preklican) return { st:'preklican', tone:'', label:'preklican', days:null };
  if (n.vrsta === 'enkratna' && n.porabljen) return { st:'porabljen', tone:'', label:'porabljen ' + fmtDMY(n.porabljen), days:null };
  if (!n.veljaOd || !n.veljaDo) return { st:'nepopoln', tone:'warn', label:'datum veljavnosti manjka', days:null };
  if (onDate < n.veljaOd) return { st:'prihodnji', tone:'info', label:'velja od ' + fmtDMY(n.veljaOd), days:daysBetween(onDate, n.veljaOd) };
  const left = daysBetween(onDate, n.veljaDo);
  if (left < 0) return { st:'potekel', tone:'bad', label:`potekel ${fmtDMY(n.veljaDo)}`, days:left };
  if (left <= warnDays) return { st:'kmalu', tone:'warn', label: left === 0 ? 'poteče danes' : left === 1 ? 'poteče jutri' : `poteče čez ${left} dni`, days:left };
  return { st:'ok', tone:'ok', label:`velja do ${fmtDMY(n.veljaDo)}`, days:left };
}
/* Nalog, ki velja na dani dan (če jih je več, prednost: najkasneje potečejo ne; najprej tisti, ki je bolj specifičen) */
function activeNalog(p, date = todayStr()){
  if (!p) return null;
  const rank = { enkratna:0, zdravljenje:1, mesecna:2, letna:3 };
  const list = (p.naloge || []).filter(n => !n.preklican && !(n.vrsta === 'enkratna' && n.porabljen) && n.veljaOd <= date && n.veljaDo >= date);
  list.sort((a, b) => (rank[a.vrsta] - rank[b.vrsta]) || a.veljaDo.localeCompare(b.veljaDo));
  return list[0] || null;
}
/* Ali je nalog podaljšan z novejšim nalogom? Potem opozorilo ni potrebno. */
function renewed(p, n){
  return (p.naloge || []).some(m => m.id !== n.id && !m.preklican && m.veljaOd <= addDays(n.veljaDo, 1) && m.veljaDo > n.veljaDo);
}
/* Povzetek za seznam pacientov: najpomembnejše stanje na dan */
function patientNalogSummary(p, date = todayStr()){
  const nl = p.naloge || [];
  if (!nl.length) return { st:'brez', tone:'', label:'brez naloga', n:null };
  const act = activeNalog(p, date);
  if (act){ const s = nalogState(act, date); if (s.st === 'kmalu' && renewed(p, act)) return { ...nalogState({ ...act, veljaDo:act.veljaDo }, date), st:'ok', tone:'ok', label:'podaljšan do ' + fmtDMY(nl.filter(m => !m.preklican).reduce((x, m) => m.veljaDo > x ? m.veljaDo : x, act.veljaDo)), n:act }; return { ...s, n:act }; }
  const fut = nl.filter(n => !n.preklican && n.veljaOd > date).sort((a, b) => a.veljaOd.localeCompare(b.veljaOd))[0];
  if (fut) return { ...nalogState(fut, date), n:fut };
  const last = nl.filter(n => !n.preklican).sort((a, b) => b.veljaDo.localeCompare(a.veljaDo))[0];
  if (last) return { ...nalogState(last, date), n:last };
  return { st:'brez', tone:'', label:'brez veljavnega naloga', n:null };
}
/* Opozorila za nadzorno ploščo: vsi pacienti, ki jim nalog kmalu poteče ali je potekel */
let ALERT_CACHE = { rev:-1, day:'', list:[] };
function nalogAlerts(){
  const today = todayStr();
  if (ALERT_CACHE.rev === rev && ALERT_CACHE.day === today) return ALERT_CACHE.list;
  const list = [];
  S.patients.forEach(p => {
    (p.naloge || []).forEach(n => {
      if (n.preklican || (n.vrsta === 'enkratna' && n.porabljen)) return;
      const s = nalogState(n, today);
      if (s.st !== 'kmalu' && s.st !== 'potekel') return;
      if (n.vrsta === 'enkratna') return;   // enkratni nalog se ne spremlja kot potek
      if (renewed(p, n)) return;
      // potekel: samo če je potekel v zadnjih 60 dneh in pacient nima drugega veljavnega naloga
      if (s.st === 'potekel' && (s.days < -60 || activeNalog(p, today))) return;
      list.push({ p, n, s });
    });
  });
  list.sort((a, b) => (a.s.days ?? 0) - (b.s.days ?? 0));
  ALERT_CACHE = { rev, day:today, list };
  return list;
}
function nalogChip(n, date){
  if (!n) return '<span class="chip">brez naloga</span>';
  const s = nalogState(n, date || todayStr());
  const icon = s.tone === 'bad' ? '⚠ ' : s.tone === 'warn' ? '⏳ ' : '';
  return `<span class="chip ${s.tone}" title="${esc(NALOG_VRSTE[n.vrsta].l)} nalog ${esc(n.stevilka || '')}">${icon}${esc(NALOG_VRSTE[n.vrsta].l)} · ${esc(s.label)}</span>`;
}

/* ---------- Barve pacientov ---------- */
function nextColor(){
  const use = Array(PCOLORS).fill(0); S.patients.forEach(p => { if (p.color >= 0 && p.color < PCOLORS) use[p.color]++; });
  return use.indexOf(Math.min(...use));
}
const pcOf = pid => { const p = patientById(pid); return p && p.color >= 0 ? p.color : -1; };
const pcClass = pid => { const c = pcOf(pid); return c >= 0 ? `pc${c}` : ''; };
const avatarP = p => `<span class="pav ${p.color >= 0 ? 'pc' + p.color : ''}" aria-hidden="true">${esc(initials(p.name).replace(/\./g, '').slice(0, 2) || '?')}</span>`;

/* ---------- Preverjanje in predogled za kopiranje ---------- */
const NALOG_REQ = [['stevilka', 'številka naloga'], ['narocnik', 'naročnik'], ['izvajalec', 'izvajalec prevoza'], ['zdravnik', 'zdravnik'], ['razlog', 'razlog prevoza'], ['od', 'relacija: od'], ['do', 'relacija: do'], ['veljaOd', 'velja od'], ['veljaDo', 'velja do']];
const missingNalog = n => NALOG_REQ.filter(([k]) => !String(n[k] || '').trim()).map(x => x[1]);
function nalogVariants(p, n){
  const s = nalogState(n);
  const v = NALOG_VRSTE[n.vrsta].l;
  const full = [
    `NALOG ZA PREVOZ · ${v.toUpperCase()}`,
    `Številka naloga: ${n.stevilka || '–'}`,
    `Pacient: ${p.name}${p.addr ? ' · ' + p.addr : ''}${p.phone ? ' · tel. ' + p.phone : ''}${p.zzzs ? ' · št. zavarovane osebe ' + p.zzzs : ''}`,
    `Naročnik: ${n.narocnik || '–'}`,
    `Izvajalec prevoza: ${n.izvajalec || '–'}`,
    `Zdravnik: ${n.zdravnik || '–'}${n.zdravnikVrsta ? ' (' + n.zdravnikVrsta + ')' : ''}`,
    `Razlog prevoza: ${n.razlog || '–'}`,
    `Relacija: ${n.od || '–'} → ${n.do || '–'}${n.dnevi ? ' · ' + n.dnevi : ''}`,
    `Način prevoza: ${MODES[n.mode] || n.mode}`,
    `Veljavnost: ${fmtDMY(n.veljaOd)} – ${fmtDMY(n.veljaDo)} (${s.label})`,
    n.opombe ? `Opombe: ${n.opombe}` : ''
  ].filter(Boolean).join('\n');
  const short = `${p.name} · ${v} nalog št. ${n.stevilka || '–'} · ${n.od || '–'} → ${n.do || '–'} · ${MODES[n.mode] || n.mode} · velja do ${fmtDMY(n.veljaDo)}`;
  const book = `${p.name}; ${n.od || ''} → ${n.do || ''}; ${MODES[n.mode] || n.mode}; ${p.phone || ''}; nalog ${n.stevilka || ''} (${v}, do ${fmtDMY(n.veljaDo)})`;
  return [{ key:'full', label:'Celoten nalog', text:full }, { key:'short', label:'Kratko (Viber / SMS)', text:short }, { key:'book', label:'Vrstica za knjigo', text:book }];
}
function rideVariants(date, r, nr){
  const p = patientById(r.patientId), n = p ? (p.naloge || []).find(x => x.id === r.nalogId) : null;
  const dir = rideDir(r) === 'from' ? 'ODVOZ' : 'PREVOZ TJA';
  const full = [
    `${dir} št. ${nr} · ${fmtLong(date)}`,
    `Pacient: ${r.name || '–'}${r.phone ? ' · tel. ' + r.phone : ''}`,
    `Ura: ${r.time || '–'}`,
    `Od: ${r.from || '–'}`,
    `Do: ${r.to || '–'}`,
    `Način prevoza: ${MODES[r.mode] || r.mode}${r.dia ? ' · dializa ' + r.dia : ''}`,
    n ? `Nalog: ${NALOG_VRSTE[n.vrsta].l}, št. ${n.stevilka || '–'}, velja do ${fmtDMY(n.veljaDo)}` : '',
    r.note ? `Opomba: ${r.note}` : ''
  ].filter(Boolean).join('\n');
  const short = `${r.time || ''} ${r.name || ''}: ${r.from || ''} → ${r.to || ''} (${MODES[r.mode] || r.mode})${r.phone ? ', ' + r.phone : ''}`.trim();
  return [{ key:'full', label:'Celoten prevoz', text:full }, { key:'short', label:'Kratko (Viber / SMS)', text:short }];
}

/* ---------- Povezava pacienta in prevoza ---------- */
function applyPatientToRide(date, rideId, pid, opts = {}){
  const hit = rideById(date, rideId), p = patientById(pid); if (!hit || !p) return false;
  const r = hit.r, nl = activeNalog(p, date);
  r.patientId = p.id; r.name = p.name;
  if (!r.phone || opts.overwrite) r.phone = p.phone;
  if (!opts.keepMode) r.mode = nl ? nl.mode || p.mode : p.mode;
  if (p.dia && !r.dia) r.dia = p.dia;
  r.nalogId = nl ? nl.id : '';
  const homeFrom = nl && nl.od && !/^SB |UKC|ZD /i.test(nl.od) ? nl.od : p.addr;
  if (!r.from.trim()) r.from = homeFrom || p.addr;
  if (!r.to.trim()) r.to = nl && nl.do ? nl.do : '';
  save(); return true;
}
function patientSuggestions(raw){
  const q = norm(raw); if (q.length < 2) return [];
  const today = todayStr();
  return S.patients.filter(p => norm([p.name, p.phone, p.addr].join(' ')).includes(q))
    .sort((a, b) => (norm(a.name).startsWith(q) ? 0 : 1) - (norm(b.name).startsWith(q) ? 0 : 1) || a.name.localeCompare(b.name)).slice(0, 6)
    .map(p => { const s = patientNalogSummary(p, today); return { label:p.name, sub:`${p.addr || 'brez naslova'} · ${s.n ? NALOG_VRSTE[s.n.vrsta].l + ' nalog, ' + s.label : 'brez naloga'}`, ins:p.name, pid:p.id, score:norm(p.name).startsWith(q) ? 0 : 1 }; });
}
function savePatientFromRide(date, rideId){
  const hit = rideById(date, rideId); if (!hit) return null;
  const r = hit.r; if (!r.name.trim()) return null;
  let p = S.patients.find(x => norm(x.name) === norm(r.name));
  if (!p){ p = blankPatient({ name:r.name.trim(), addr:rideDir(r) === 'from' ? r.to : r.from, phone:r.phone, mode:r.mode, dia:r.dia || '', color:nextColor() }); S.patients.push(p); audit('pacient.dodan', { id:p.id, kdo:initials(p.name) }); }
  r.patientId = p.id; save(); return p;
}
function removePatient(id){
  const p = patientById(id); if (!p) return;
  S.patients = S.patients.filter(x => x.id !== id);
  Object.values(S.rides).forEach(a => a.forEach(r => { if (r.patientId === id){ r.patientId = ''; r.nalogId = ''; } }));
  audit('pacient.izbrisan', { id, kdo:initials(p.name) }); save();
}
const lastOpened = {};
function logPatientOpen(id){ const t = Date.now(); if (lastOpened[id] && t - lastOpened[id] < 300000) return; lastOpened[id] = t; const p = patientById(id); audit('pacient.ogled', { id, kdo:p ? initials(p.name) : '' }); }
