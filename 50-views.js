/* =====================================================================
   ZASLONI
   ===================================================================== */
const UI = { view:'knjiga', month:null, date:null, dDate:null, lDate:null, cDate:null, filter:'vsi', q:'', setTab:'vozila', bookRev:'', pid:'', nid:'', pf:'vsi', pq:'', modal:null, stale:false, selfTest:null };
const IC = {
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M9 8h6M9 12h6"/></svg>',
  day:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  kidney:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C8 3 5 6 5 10s2 5 2 8a3 3 0 0 0 6 0c0-2 4-3 4-8a7 7 0 0 0-5-7z"/></svg>'
};
const SV = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
Object.assign(IC, {
  pulse:SV('<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>'),
  users:SV('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.5-3.4 2.6-5 5.5-5s5 1.6 5.5 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.7.6 2.6 2.2 2.9 4.7"/>'),
  shield:SV('<path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  phone:SV('<path d="M5 4h3.5l1.7 4.2-2.2 1.4a11 11 0 0 0 5.4 5.4l1.4-2.2L19 14.5V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  pin:SV('<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  eye:SV('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  send:SV('<path d="M21 3 10 14M21 3l-6.5 18-3.5-7-7-3.5z"/>'),
  check:SV('<path d="m5 12.5 4.2 4.2L19 7"/>')
});
const NAV_ALL = [
  { id:'knjiga', label:'Knjiga', short:'Knjiga', ic:'book' },
  { id:'dan', label:'Dan', short:'Dan', ic:'day' },
  { id:'dispecer', label:'Dispečer', short:'Razpored', ic:'route' },
  { id:'zivo', label:'Živo', short:'Živo', ic:'pulse' },
  { id:'pacienti', label:'Pacienti', short:'Pacienti', ic:'users' },
  { id:'posebnosti', label:'Posebnosti', short:'Okvare', ic:'alert' },
  { id:'nastavitve', label:'Nastavitve', short:'Nastav.', ic:'gear' }
];
const TITLES = {
  knjiga:['Knjiga prevozov', 'Mesečni pregled. Pod vsakim dnevom je polje Ostalo za opombe.'],
  dan:['Dnevna knjiga', ''],
  dispecer:['Dispečer', 'Zaposleni in vozila vpišeš ti. Razpored in vrstni red izračuna aplikacija.'],
  zivo:['Živo stanje', 'Posadke sporočajo korake prevoza. Tukaj vidiš status in čase.'],
  pacienti:['Pacienti in nalogi', 'Baza pacientov z nalogi za prevoz. Opozorilo: letni nalog 30 dni, mesečni 7 dni pred iztekom.'],
  posebnosti:['Posebnosti', 'Okvare vozil, servisi in drugo, kar vpliva na razpored.'],
  nastavitve:['Nastavitve', 'Vozila, zaposleni, pravila, dializa, uporabniki, varnost in podatki.'],
  moji:['Moji prevozi', '']
};

/* ---------- Logotipi: datoteka iz mape logos/, ali naložen v Nastavitve → Logotipi; sicer samo besedilo ---------- */
const LOGOS = { zd:{ label:'ZD Brežice', file:'logos/zd-brezice.png' }, nmp:{ label:'NMP', file:'logos/nmp.png' } };
const logoSrc = k => store.get('kp.logo.' + k) || (BACKEND === 'firebase' || location.protocol.startsWith('http') && !/claude|sandbox/.test(location.host) ? LOGOS[k].file : '');
const logoItem = k => { const src = logoSrc(k), l = LOGOS[k]; return `<span class="logoitem" data-logo="${k}">${src ? `<img src="${esc(src)}" alt="${esc(l.label)}" height="30">` : ''}<span class="lf" ${src ? 'hidden' : ''}>${esc(l.label)}</span></span>`; };
const logoBar = cls => `<div class="logobar ${cls || ''}">${logoItem('zd')}<i></i>${logoItem('nmp')}</div>`;
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.logoitem')){ t.hidden = true; const f = t.nextElementSibling; if (f) f.hidden = false; } }, true);

const navItems = () => (ME && isCrew()) ? [] : NAV_ALL;
function renderNav(){
  const liveN = isStaffRole() ? Object.entries(liveSummary(todayStr())).filter(([k]) => ['odklonjena', 'ni_doma'].includes(k)).reduce((n, [, v]) => n + v, 0) : 0;
  const alerts = isStaffRole() ? nalogAlerts().length : 0;
  const late = isStaffRole() && computePlan(addDays(todayStr(), 1)).totals.late;
  const badge = id => id === 'dispecer' && late ? '<span class="count">!</span>' : id === 'zivo' && liveN ? `<span class="count">${liveN}</span>` : id === 'pacienti' && alerts ? `<span class="count">${alerts}</span>` : '';
  $('#nav').innerHTML = navItems().map(n => `<button type="button" data-nav="${n.id}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${IC[n.ic]}<span>${n.label}</span>${badge(n.id)}</button>`).join('');
  $('#tabbar').innerHTML = navItems().map(n => `<button type="button" data-nav="${n.id}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${IC[n.ic]}<span>${n.short}</span>${badge(n.id) ? '<i class="dotbadge"></i>' : ''}</button>`).join('');
}
function setHeader(){
  const [t, s] = TITLES[UI.view] || TITLES.knjiga;
  $('#pageTitle').textContent = UI.view === 'dan' ? fmtLong(UI.date) : t;
  let sub = s;
  if (UI.view === 'dan'){ const h = holiday(UI.date); sub = `${h ? 'Praznik: ' + h + '. ' : ''}${isStandby(UI.date) ? 'Vikend/praznik: pripravljenost.' : 'Delovni dan.'}`; }
  $('#pageSub').textContent = sub;
  $('#topActions').innerHTML = `<span class="savepill" id="savepill"><i></i> Shranjeno</span>`;
}
const demoBanner = () => hasDemo() ? `<div class="banner"><span>${IC.info}</span><div><b>Prikazani so primeri.</b> Pacienti in zaposleni so izmišljeni. Odstrani jih v Nastavitve → Podatki, ko začneš z resničnimi vpisi.</div></div>` : '';
const hasDemo = () => Object.values(S.rides).some(a => a.some(r => r.demo)) || S.staff.some(s => s.demo) || S.patients.some(p => p.demo);

/* ---------- Mesečna knjiga ---------- */
function renderMonth(){
  const { y, m } = UI.month, n = daysInMonth(y, m), today = todayStr();
  let tr = 0, td = 0, dd = 0, tcn = 0; const cards = [];
  for (let d = 1; d <= n; d++){
    const date = `${y}-${pad(m+1)}-${pad(d)}`;
    const all = (S.rides[date] || []).filter(isFilled), filled = all.filter(r => !r.odpovedano), canc = all.length - filled.length, done = filled.filter(r => r.done).length;
    tcn += canc; tr += filled.length; td += done; if (filled.length) dd++;
    const hol = holiday(date), wk = isStandby(date), groups = diaGroupsFor(date, S);
    const book = S.crewBook[date] || {};
    const oc = (S.crewBook[date] || {}).ost || { text:'', manual:false };
    const rows = `<div class="crew-row"><label>Opomba</label><input type="text" data-crew="${date}|ost" value="${esc(oc.text)}" placeholder="kaj je narobe / opomba" aria-label="Ostalo, ${fmtShort(date)}"></div>`;
    cards.push(`<article class="day ${date === today ? 'today' : ''} ${wk ? 'wk' : ''} ${date < today ? 'past' : ''}">
      <button type="button" class="day-head" data-act="openDay" data-date="${date}">
        <span class="dnum tnum">${pad(d)}</span>
        <span class="dtxt"><span class="dname">${DOW_LONG[dow(date)]}</span>
          <span class="dmeta">${date === today ? '<span class="chip accent">danes</span>' : ''}${hol ? `<span class="chip warn" title="${esc(hol)}">praznik</span>` : ''}${wk ? '<span class="chip info">pripravljenost</span>' : ''}${groups.map(g => `<span class="chip mono" title="Dializa">${g}</span>`).join('')}</span></span>
        <span class="dcount"><b>${filled.length}</b>${filled.length ? `${done}/${filled.length} ✓` : 'prevozov'}${canc ? `<span class="chip bad">${canc} odpov.</span>` : ''}</span>
      </button>
      <div class="crew"><h4>Ostalo</h4>${rows}</div></article>`);
  }
  $('#view').innerHTML = `
    ${demoBanner()}${alertsBanner()}
    <div class="monthbar">
      <button type="button" class="btn" data-act="monthPrev" aria-label="Prejšnji mesec">${IC.left}</button>
      <h2>${MONTHS[m]} ${y}</h2>
      <button type="button" class="btn" data-act="monthNext" aria-label="Naslednji mesec">${IC.right}</button>
      <button type="button" class="btn" data-act="monthToday">Danes</button>
      <button type="button" class="btn" data-act="printMonth">Natisni mesec</button>
      <div class="stats" style="margin-left:auto">
        <div class="stat"><b>${tr}</b><span>prevozov v mesecu</span></div>
        <div class="stat"><b>${td}</b><span>opravljenih</span></div>
        <div class="stat"><b>${dd}</b><span>dni z vpisi</span></div>
        <div class="stat"><b>${tcn}</b><span>odpovedanih</span></div>
      </div>
    </div>
    <div class="days">${cards.join('')}</div>`;
}

/* ---------- Dnevna knjiga (35 polj) ---------- */
function modeSeg(mode){
  return `<div class="seg" role="group" aria-label="Način prevoza">${Object.entries(MODES).map(([k, v]) => `<button type="button" data-mode="${k}" data-act="mode" aria-pressed="${mode === k}">${v}</button>`).join('')}</div>`;
}
function pinfoHTML(date, r){
  const p = r.patientId ? patientById(r.patientId) : null;
  if (p){
    const opts = (p.naloge || []).filter(n => !n.preklican).map(n => `<option value="${n.id}" ${r.nalogId === n.id ? 'selected' : ''}>${esc(NALOG_VRSTE[n.vrsta].l)} ${esc(n.stevilka || '')} (${fmtDMY(n.veljaOd)}–${fmtDMY(n.veljaDo)})</option>`).join('');
    const sel = (p.naloge || []).find(n => n.id === r.nalogId);
    const chip = sel ? nalogChip(sel, date) : (activeNalog(p, date) ? '' : '<span class="chip bad">ni veljavnega naloga</span>');
    return `<div class="pinfo">${avatarP(p)}<div class="pinfo-main"><div class="row" style="gap:6px"><select data-f="nalogId" aria-label="Nalog za prevoz"><option value="">Nalog: ni izbran</option>${opts}</select>${chip}</div></div>
      <button type="button" class="icon-btn" data-act="openPatient" data-id="${p.id}" title="Odpri pacienta" aria-label="Odpri pacienta">${IC.users}</button></div>`;
  }
  if ((r.name || '').trim()) return `<div class="pinfo none"><span class="hint">Pacient ni v bazi.</span><button type="button" class="btn sm" data-act="savePat">${IC.plus} Shrani v bazo</button></div>`;
  return '';
}
function boxHTML(date, r, nr, plan){
  const filled = isFilled(r), dir = filled ? rideDir(r) : '';
  const a = plan.assign[r.id];
  const g = r.from.trim() ? geo(r.from) : null;
  const pc = pcClass(r.patientId);
  const ptc = r.patientId ? patientById(r.patientId) : null, nlc = ptc ? ((ptc.naloge || []).find(n => n.id === r.nalogId) || activeNalog(ptc, date)) : null;
  const nt = ptc ? 'nt-' + (nlc ? nlc.vrsta : 'none') : '';
  const showSt = r.status && r.status !== 'nova';
  return `<article class="box ${pc} ${nt} ${filled ? '' : 'empty'} ${r.done ? 'done' : ''} ${r.odpovedano ? 'cancelled' : ''}" data-ride="${r.id}" data-date="${date}" data-nr="${nr}">
    <div class="bhead"><span class="nr">${nr}</span>
      <span class="chip ${dir === 'from' ? 'ok' : 'info'}" data-role="dir" ${filled ? '' : 'hidden'}>${dir === 'from' ? 'ODVOZ' : 'TJA'}</span>
      ${r.dia ? `<span class="chip mono">${esc(r.dia)}</span>` : ''}
      ${r.demo ? '<span class="chip warn">PRIMER</span>' : ''}
      ${r.odpovedano ? '<span class="chip bad cancel-chip">ODPOVEDANO</span>' : ''}
      ${showSt ? stChip(r.status) : ''}
      <span class="sp"></span>
      <span class="assign ${a && a.late > 0 ? 'late' : ''}" data-role="assign" ${a ? '' : 'hidden'}>${a ? esc(a.veh) + ' · ' + fmtT(a.t) : ''}</span>
      ${filled ? `<button type="button" class="icon-btn" data-act="rideView" title="Predogled za kopiranje" aria-label="Predogled za kopiranje">${IC.eye}</button>` : ''}
      <button type="button" class="icon-btn" data-act="clearRide" title="Počisti polje ${nr}" aria-label="Počisti polje ${nr}">${IC.x}</button>
    </div>
    <div class="bgrid">
      <div class="field"><label for="n-${r.id}">Ime in priimek</label><input id="n-${r.id}" type="text" data-f="name" data-suggest="patient" value="${esc(r.name)}" autocomplete="off" placeholder="išči v bazi pacientov"></div>
      <div class="field"><label for="t-${r.id}" title="Ura preiskave. Pri odvozu iz ustanove: ura, ko je pacient pripravljen.">Ura</label><input id="t-${r.id}" type="time" data-f="time" value="${esc(r.time)}"></div>
      <div class="field full"><span class="lbl">Način prevoza</span>${modeSeg(r.mode)}</div>
      <div class="field full"><label for="f-${r.id}">Od (naslov hiše)</label><input id="f-${r.id}" type="text" data-f="from" data-suggest="from" class="${g && g.kind === 'neznano' ? 'warnfield' : ''}" value="${esc(r.from)}" autocomplete="off" placeholder="npr. Dobova 25"></div>
      <div class="field full"><label for="o-${r.id}">Do (kam)</label><input id="o-${r.id}" type="text" data-f="to" data-suggest="to" value="${esc(r.to)}" autocomplete="off" placeholder="npr. UKC Ljubljana"></div>
      <div class="field"><label for="p-${r.id}">Telefon / kontakt</label><input id="p-${r.id}" type="tel" data-f="phone" value="${esc(r.phone)}" autocomplete="off"></div>
      <div class="field"><label for="d-${r.id}">Dializa</label><select id="d-${r.id}" data-f="dia"><option value="">–</option>${DIA_GROUPS.map(x => `<option ${r.dia === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="field full"><label for="x-${r.id}">Opomba (npr. voziček, kisik, spremljevalec)</label><input id="x-${r.id}" type="text" data-f="note" value="${esc(r.note || '')}" autocomplete="off"></div>
    </div>
    ${pinfoHTML(date, r)}
    ${showSt && r.times && Object.keys(r.times).length ? `<div class="row" style="gap:4px">${timesChips(r)}</div>` : ''}
    <div class="donerow">
      <label class="check"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label>
      <label class="check cancel-check" title="Prevoz je odpovedan: označen je rdeče in ni v razporedu"><input type="checkbox" data-f="odpovedano" ${r.odpovedano ? 'checked' : ''}> Odpovedano</label>
      <label class="check" title="Dovoli, da se za ta prevoz pravila prilagodijo (npr. več pacientov v vozilu, daljša pot)"><input type="checkbox" data-f="exc" ${r.exc ? 'checked' : ''}> Izjema pravil</label>
      <div class="field whodid"><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz" autocomplete="off"></div>
    </div>
  </article>`;
}
function refreshStaffList(date){
  const names = new Set([...(S.duty[date] || []).map(d => d.name), ...S.staff.map(s => s.name)]);
  $('#staffList').innerHTML = [...names].map(n => `<option value="${esc(n)}"></option>`).join('');
}
function renderDay(){
  const date = UI.date, today = todayStr(), a = ensureDay(date), plan = computePlan(date);
  refreshStaffList(date);
  const filled = a.filter(isFilled).length, done = a.filter(r => isFilled(r) && r.done).length, groups = diaGroupsFor(date, S);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const warns = dayWarnings(date);
  $('#view').innerHTML = `
    ${demoBanner()}
    <div class="daybar">
      <div class="row">
        <button type="button" class="btn" data-act="dayPrev" aria-label="Prejšnji dan">${IC.left}</button>
        <input type="date" id="dayPick" value="${date}" style="width:auto" aria-label="Izberi datum">
        <button type="button" class="btn" data-act="dayNext" aria-label="Naslednji dan">${IC.right}</button>
        <button type="button" class="btn ${date === today ? 'primary' : ''}" data-act="dayToday">Danes</button>
        <button type="button" class="btn ${date === addDays(today,1) ? 'primary' : ''}" data-act="dayTomorrow">Jutri</button>
      </div>
      <div class="row">${groups.map(g => `<span class="chip mono" title="Dializa ta dan">${IC.kidney.replace('<svg','<svg width="13" height="13"')}${g}</span>`).join('')}
        <span class="chip" id="fillcount"><span class="mono">${filled}</span>/${a.length} polj</span><span class="chip ok" id="donecount"><span class="mono">${done}</span> opravljenih</span></div>
    </div>
    ${blocked.length ? `<div class="banner bad"><span>${IC.alert}</span><div>${blocked.map(v => `<b>${esc(v.name)}</b>: ${esc(vehBlocked(date, v.id).tip)}${vehBlocked(date, v.id).note ? ' (' + esc(vehBlocked(date, v.id).note) + ')' : ''}`).join(' · ')}. Vozilo ni v razporedu.</div></div>` : ''}
    ${S.dayNote[date] ? `<div class="banner warn"><span>${IC.info}</span><div><b>Opomba dneva:</b> ${esc(S.dayNote[date])}</div></div>` : ''}
    <div class="toolbar">
      <div class="seg inline" role="group" aria-label="Filter">${[['vsi','Vsa polja'],['zasedena','Zasedena'],['cakajo','Čakajo'],['opravljeni','Opravljeni']].map(([k, l]) => `<button type="button" data-act="filter" data-k="${k}" aria-pressed="${UI.filter === k}">${l}</button>`).join('')}</div>
      <input type="search" id="rideSearch" placeholder="Išči po imenu ali naslovu" value="${esc(UI.q)}" aria-label="Išči">
      ${groups.length ? `<button type="button" class="btn" data-act="loadDia">${IC.kidney.replace('<svg','<svg width="16" height="16"')} Naloži dializne paciente</button>` : ''}
      <button type="button" class="btn" data-act="addSlots">${IC.plus} 5 polj več</button>
      <button type="button" class="btn" data-act="gotoDisp" data-date="${date}">${IC.route} Razpored</button>
    </div>
    ${warns.length ? `<details class="warnbox"><summary>${warns.length} opozoril za ta dan</summary><ul class="warnlist">${warns.slice(0,40).map(w => `<li>${esc(w.text)}</li>`).join('')}</ul></details>` : ''}
    <div class="boxes" id="boxes">${a.map((r, i) => boxHTML(date, r, i + 1, plan)).join('')}</div>`;
  applyFilter();
}
function applyFilter(){
  const q = norm(UI.q);
  $$('#boxes .box').forEach(el => {
    const r = rideById(el.dataset.date, el.dataset.ride); if (!r) return;
    const f = isFilled(r.r);
    let show = true;
    if (UI.filter === 'zasedena') show = f; else if (UI.filter === 'cakajo') show = f && !r.r.done; else if (UI.filter === 'opravljeni') show = f && r.r.done;
    if (show && q) show = norm([r.r.name, r.r.from, r.r.to, r.r.phone].join(' ')).includes(q);
    el.hidden = !show;
  });
}
function updateDayCounts(){
  const a = ensureDay(UI.date), f = a.filter(isFilled).length, d = a.filter(r => isFilled(r) && r.done).length;
  const fc = $('#fillcount'), dc = $('#donecount');
  if (fc) fc.innerHTML = `<span class="mono">${f}</span>/${a.length} polj`;
  if (dc) dc.innerHTML = `<span class="mono">${d}</span> opravljenih`;
}
function refreshBox(el){
  const date = el.dataset.date, hit = rideById(date, el.dataset.ride); if (!hit) return;
  const r = hit.r, filled = isFilled(r);
  el.classList.toggle('empty', !filled); el.classList.toggle('done', !!r.done);
  const dir = $('[data-role=dir]', el);
  if (dir){ dir.hidden = !filled; const d = filled ? rideDir(r) : 'to'; dir.textContent = d === 'from' ? 'ODVOZ' : 'TJA'; dir.className = 'chip ' + (d === 'from' ? 'ok' : 'info'); dir.dataset.role = 'dir'; }
  const fi = $('[data-f=from]', el); if (fi){ const g = r.from.trim() ? geo(r.from) : null; fi.classList.toggle('warnfield', !!g && g.kind === 'neznano'); }
  $$('.seg [data-mode]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === r.mode)));
  updateDayCounts();
}

/* ---------- Dispečer ---------- */
function dutyHTML(date){
  const duty = S.duty[date] || [], avail = availableVehicles(date);
  const onNames = new Set(duty.map(d => d.name));
  const chips = S.staff.map(s => `<button type="button" class="chip toggle" data-act="toggleStaff" data-id="${s.id}" aria-pressed="${onNames.has(s.name)}">${esc(s.name)}${s.team === 'NN' ? ' · NN' : ''}</button>`).join('');
  const otOpts = [[0, 'Nadure: brez'], [30, 'Nadure do 30 min'], [60, 'Nadure do 1 h'], [120, 'Nadure do 2 h'], [180, 'Nadure do 3 h'], [240, 'Nadure do 4 h']];
  const items = duty.map((d, i) => { const st = staffOfDuty(d); return `<div class="duty-item" data-di="${i}">
      <div class="dn">${esc(d.name)} ${st && st.userId ? '<span class="chip ok" title="Ima račun in vidi razpored v aplikaciji">račun</span>' : '<span class="chip warn" title="Brez računa ne vidi razporeda v aplikaciji. Poveži v Nastavitve → Zaposleni.">brez računa</span>'}</div><button type="button" class="icon-btn" data-act="rmDuty" data-i="${i}" aria-label="Odstrani ${esc(d.name)}">${IC.x}</button>
      <div class="dsel">
        <select data-duty="team" aria-label="Ekipa"><option value="redna" ${d.team==='redna'?'selected':''}>Redna ekipa</option><option value="NN" ${d.team==='NN'?'selected':''}>NN ekipa</option><option value="pripravljenost" ${d.team==='pripravljenost'?'selected':''}>Pripravljenost</option></select>
        <select data-duty="role" aria-label="Vloga"><option value="voznik" ${!['spremljevalec','student','dijak'].includes(d.role)?'selected':''}>Voznik</option><option value="spremljevalec" ${d.role==='spremljevalec'?'selected':''}>Spremljevalec</option><option value="student" ${d.role==='student'?'selected':''}>Študent</option><option value="dijak" ${d.role==='dijak'?'selected':''}>Dijak</option></select>
        <label class="mini">Začetek izmene<input type="time" data-duty="from" value="${esc(d.from||'')}" title="Prazno = izmena ni omejena"></label>
        <label class="mini">Konec izmene<input type="time" data-duty="to" value="${esc(d.to||'')}" title="Prazno = začetek + ${S.rules.shiftHours} h (če je vpisan začetek)"></label>
        <select data-duty="vehicleId" aria-label="Vozilo"><option value="">Vozilo: samodejno</option>${avail.map(v => `<option value="${v.id}" ${d.vehicleId===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select>
        <select data-duty="ot" aria-label="Nadure">${otOpts.map(([v, l]) => `<option value="${v}" ${(+d.ot || 0) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div></div>`; }).join('');
  return `<div class="card card-pad stack" style="gap:12px">
    <div class="card-head" style="margin:0"><h3>Zaposleni na delu</h3><span class="chip mono">${duty.length}</span></div>
    ${chips ? `<div class="row" style="gap:6px">${chips}</div><div class="hint">Tapni ime, da ga dodaš ali odstraniš.</div>` : '<div class="hint">Seznam zaposlenih dodaš v Nastavitve → Zaposleni ali kar spodaj.</div>'}
    ${items || '<div class="empty-state" style="padding:14px">Še nihče ni vpisan za ta dan.</div>'}
    <form class="row" data-form="addDuty" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime novega zaposlenega" list="staffList" aria-label="Ime zaposlenega" autocomplete="off"><button class="btn primary" type="submit">Dodaj</button></form>
    <label class="check"><input type="checkbox" data-act="daySplit" ${S.dayRules[date] && S.dayRules[date].split ? 'checked' : ''}> Ekipa se razdeli na 2 voznika (vsak v svojem vozilu)</label>
    <div class="hint">NN ekipa ima 2 reševalca: voznik in spremljevalec (samodejno). Leže pacient vedno potrebuje voznika + spremljevalca in vozilo z nosili. Študent in dijak sta dodatna pomočnika.</div>
    <div class="row"><button type="button" class="btn sm" data-act="copyDuty">${IC.copy} Kopiraj osebje od prejšnjega dne</button></div>
  </div>`;
}
function vehiclesHTML(date){
  return `<div class="card card-pad stack" style="gap:10px"><div class="card-head" style="margin:0"><h3>Vozila na voljo</h3></div>
    ${S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo').map(v => {
      const b = vehBlocked(date, v.id), off = vehOff(date, v.id);
      return `<div class="veh-item ${b || off ? 'off' : ''}"><label><input type="checkbox" data-act="vehToggle" data-id="${v.id}" ${!off && !b ? 'checked' : ''} ${b ? 'disabled' : ''}><span><span class="vn">${esc(v.name)}</span><br><span class="hint">${esc(VEH_VRSTE[v.vrsta] || '')} · ${esc(capText(v))}${v.fn === 'dializa' ? ' · primarno dializa' : ''}</span></span></label>${b ? `<span class="chip bad">${esc(b.tip)}</span>` : (v.ns === 'NN' ? '<span class="chip">NN</span>' : '')}</div>`;
    }).join('') || '<div class="hint">Vozila dodaš v Nastavitve → Vozila.</div>'}
  </div>`;
}
function stopRow(c, t, s, L, prev){
  const ppl = (s.people || []).filter(Boolean);
  const personRow = (t.kind === 'to' && s.type === 'pu') || (t.kind === 'from' && s.type === 'do');
  const pt = s.pt, label = s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : (pt.label || '');
  const base = prev ? `<li class="legline"><span></span><i></i><span>${Math.max(1, Math.round(s.t - prev.t - (prev.type === 'pu' ? S.settings.pickMin * ((prev.people || []).length || 1) : S.settings.dropMin)))} min · ${L(prev.pt, pt).km.toFixed(1)} km</span></li>` : '';
  let body;
  if (personRow && ppl.length){
    const r = ppl[0];
    const rr = rideById(UI.dDate, r.id), rs = rr ? rr.r : null;
    body = `<div><div class="who"><span class="pdot ${pcClass(r.pid)}"></span>${esc(r.name)} <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span> <span class="chip mono">št. ${r.nr}</span>${rs && rs.status && rs.status !== 'nova' ? ' ' + stChip(rs.status) : ''}${rs && rs.exc ? ' <span class="chip accent">izjema</span>' : ''}</div>
      <div class="addr">${esc(r.kind === 'to' ? r.fromTxt : r.toTxt)}${r.phone ? ` · <span class="mono">${esc(r.phone)}</span>` : ''}${r.timeTxt ? ` · ura ${esc(r.timeTxt)}` : ''}</div></div>
      <div class="pin"><select data-act="pin" data-ride="${r.id}" aria-label="Prestavi prevoz ${r.nr} na vozilo"><option value="">Samodejno</option>${CREWS_PIN.map(v => `<option value="${v.id}" ${r.pin===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>`;
  } else {
    const who = ppl.map(r => `${esc(r.name)} <span class="chip mono">št. ${r.nr}</span>`).join(' ');
    body = `<div><div class="who">${s.type === 'pu' ? 'Pobere' : 'Izstop'}: ${esc(label)}</div><div class="addr">${who}${t.kind === 'to' && s.type === 'do' && t.slack != null ? ` · preiskava ${fmtT(t.ref)}, rezerva ${t.slack} min` : ''}</div></div><div></div>`;
  }
  return `${base}<li class="stop"><time>${fmtT(s.t)}</time><span class="dot ${s.type === 'do' ? 'do' : ''}"></span>${body}</li>`;
}
function renderDispatch(){
  const date = UI.dDate, today = todayStr(), tom = addDays(today, 1);
  const plan = computePlan(date), L = makeLeg(S.settings);
  if (UI.bookRev !== date + '#' + rev){ writeBook(date); UI.bookRev = date + '#' + rev; }
  CREWS_PIN = plan.crews.map(c => c.vehicle);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const tot = plan.totals;
  const rows = plan.crews.map(c => `<tr>
      <td><b>${esc(c.vehicle.name)}</b><div class="hint">${esc(capText(c.vehicle))}</div></td>
      <td>${esc(c.driver.name)}${c.team === 'NN' ? ' <span class="chip">NN</span>' : ''}${c.escorts.map(e => `<div class="hint">${esc(e.name)} (sp.)</div>`).join('')}${(c.helpers || []).map(h => `<div class="hint">${esc(h.name)} (${ROLE_TAG[h.role] || ''})</div>`).join('')}</td>
      <td><div class="numchips">${c.rideNrs.length ? c.rideNrs.map(n => `<span class="chip mono">${n}</span>`).join('') : '<span class="dim">–</span>'}</div></td>
      <td>${c.trips.length ? `<b class="mono">Štart ${fmtT(c.firstDepart)}</b> iz postaje<div class="hint">${c.trips.map(t => `${fmtT(t.depart)} → ${esc(t.kind === 'to' ? (t.anchor.label || '') : (t.anchor.label || '') + ' (odvoz)')}`).join(' · ')}</div>${c.trips.some(t=>t.late>0) ? '<div><span class="chip bad">zamuda</span></div>' : ''}${c.overtime > 0 ? `<div><span class="chip accent">nadure ~${c.overtime} min</span></div>` : ''}` : '<span class="dim">Brez prevozov</span>'}</td></tr>`).join('');
  const blockedRows = blocked.map(v => { const b = vehBlocked(date, v.id); return `<tr><td><b>${esc(v.name)}</b></td><td colspan="2"><span class="chip bad">${esc(b.tip)}</span></td><td class="muted">${esc(b.note || 'Vozilo ni na voljo')}</td></tr>`; }).join('');
  const unRows = plan.unassigned.map(u => `<span class="chip bad mono" title="${esc(u.reason)}">${u.ride.nr}</span>`).join(' ');
  const cards = plan.crews.filter(c => c.trips.length).map(c => `<section class="card crewcard">
      <header><div><h3>${esc(c.vehicle.name)} · ${esc(crewLabel(c))}</h3><div class="timeline-note">Štart iz postaje ${fmtT(c.firstDepart)} · konec ob ${fmtT(c.trips[c.trips.length-1].end)}</div></div>
      <div class="meta"><span class="chip mono">${c.rideNrs.length} prevozov</span><span class="chip mono">${c.km.toFixed(0)} km</span><span class="chip mono">${fmtDur(c.busy)}</span></div></header>
      ${c.trips.map((t, ti) => `<div class="trip"><div class="trip-head">
          <span class="chip ${t.kind === 'from' ? 'ok' : 'info'}">${t.kind === 'from' ? 'ODVOZ' : 'TJA'}</span><b>${t.kind === 'to' ? esc(t.anchor.label || 'cilj') : 'Iz: ' + esc(t.anchor.label || 'ustanova')}</b>
          <span class="chip mono">${t.rides.length} pac.</span><span class="chip mono">${t.ev.km.toFixed(0)} km</span><span class="chip mono">${fmtDur(t.ev.dur)}</span>
          ${t.late > 0 ? `<span class="chip bad">${t.kind === 'from' ? 'pacient čaka ~' + t.wait + ' min' : 'zamuda ~' + t.late + ' min'}</span>` : (t.kind === 'to' && t.slack != null ? `<span class="chip ok">rezerva ${t.slack} min</span>` : '')}
          ${t.sbReturn && c.team === 'NN' ? '<span class="chip">NN ekipa</span>' : ''}</div>
        <ul class="stops">
          <li class="stop"><time>${fmtT(t.depart)}</time><span class="dot base"></span><div><div class="who">Štart: ${ti === 0 ? 'RP Brežice (ZD)' : 'prejšnji cilj'}</div><div class="addr">Vožnja do prvega pobiranja ${L(t.from, t.stopsAbs[0].pt).km.toFixed(1)} km</div></div><div></div></li>
          ${t.stopsAbs.map((s, i) => stopRow(c, t, s, L, i ? t.stopsAbs[i-1] : null)).join('')}
        </ul></div>`).join('')}
    </section>`).join('');
  const closeList = (date <= tom) ? filledRides(date).map(({ r, nr }) => `<div class="duty-item" style="grid-template-columns:auto minmax(0,1fr) minmax(0,1.1fr);align-items:center" data-ride="${r.id}" data-date="${date}">
        <span class="nr">${nr}</span><div class="dn" style="min-width:0"><div style="overflow:hidden;text-overflow:ellipsis">${esc(r.name || '(brez imena)')} <span class="mono dim">${esc(r.time)}</span></div><div class="hint" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.from)} → ${esc(r.to)}</div></div>
        <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="row" style="gap:6px;flex-wrap:nowrap;font-weight:600"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz, prevoz ${nr}" style="${r.done ? '' : 'visibility:hidden'}"></div></div>`).join('') : '';
  refreshStaffList(date);
  $('#view').innerHTML = `
    ${demoBanner()}
    <div class="row">
      <div class="seg inline" role="group" aria-label="Izbira dneva"><button type="button" data-act="dDate" data-date="${today}" aria-pressed="${date === today}">Danes · ${fmtShort(today)}</button><button type="button" data-act="dDate" data-date="${tom}" aria-pressed="${date === tom}">Jutri · ${fmtShort(tom)}</button></div>
      <input type="date" id="dispPick" value="${date}" style="width:auto" aria-label="Drug datum">
      <span class="chip ${plan.standby ? 'info' : ''}">${plan.standby ? 'Pripravljenost (vikend/praznik)' : 'Delovni dan'}</span>
      ${diaGroupsFor(date, S).map(g => `<span class="chip mono">${g}</span>`).join('')}
    </div>
    <div class="dispatch">
      <div class="stack">
        ${dutyHTML(date)}${vehiclesHTML(date)}
        <div class="card card-pad stack" style="gap:8px"><h3>Opomba dneva</h3><textarea id="dayNote" placeholder="npr. ob 9:00 sestanek, cesta zaprta, pacient potrebuje spremljevalca">${esc(S.dayNote[date] || '')}</textarea></div>
      </div>
      <div class="stack">
        ${rulesBar(date, plan)}${publishBar(date, plan)}
        <div class="stats"><div class="stat"><b>${tot.rides}</b><span>prevozov za razporeditev</span></div><div class="stat"><b>${tot.vehicles}/${plan.crews.length}</b><span>vozil v uporabi</span></div><div class="stat"><b>${tot.km.toFixed(0)}</b><span>km skupaj (ocena)</span></div><div class="stat"><b style="color:${tot.late ? 'var(--bad)' : 'var(--ok)'}">${tot.late}</b><span>prevozov z zamudo</span></div></div>
        ${plan.warnings.length ? `<details class="warnbox" ${plan.warnings.some(w => w.level === 'bad' || w.level === 'bend') ? 'open' : ''}><summary>${plan.warnings.length} opozoril in prilagoditev</summary><ul class="warnlist">${plan.warnings.map(w => `<li class="w-${w.level}">${w.level === 'bend' ? '<span class="chip accent">prilagojeno</span> ' : ''}${esc(w.text)}</li>`).join('')}</ul></details>` : ''}
        <div class="card card-pad">
          <div class="card-head"><h3>Razpored za ${fmtShort(date)}</h3><div class="row"><button type="button" class="btn sm" data-act="copyPlan">${IC.copy} Kopiraj kot besedilo</button></div></div>
          ${plan.crews.length || blocked.length ? `<div class="tablewrap"><table><thead><tr><th>Vozilo</th><th>Voznik</th><th>Prevozi (št. v knjigi)</th><th>Posebnosti · ure štarta</th></tr></thead><tbody>${rows}${blockedRows}</tbody></table></div>`
            : '<div class="empty-state">Vpiši zaposlene na delu in označi vozila. Razpored se sestavi sam.</div>'}
          ${unRows ? `<p style="margin:10px 0 0"><b>Nerazporejeni prevozi:</b> ${unRows}</p>` : ''}
          <p class="hint" style="margin:10px 0 0">Časi so ocena: zračna razdalja × ${S.settings.road}, omejitve ${S.settings.lim.naselje}/${S.settings.lim.izven}/${S.settings.lim.hitra}/${S.settings.lim.avtocesta} km/h (naselje/izven/hitra/avtocesta), dejansko ${S.settings.eff} %, rezerva ${S.settings.buffer} min pred preiskavo. Razpored se vpiše tudi v mesečno knjigo.</p>
        </div>
        ${cards}
        ${closeList ? `<div class="card card-pad stack" style="gap:10px"><div class="card-head" style="margin:0"><h3>Zaključek prevozov</h3><span class="hint">Označi opravljeno in vpiši, kdo je naredil odvoz.</span></div>${closeList}</div>` : ''}
      </div>
    </div>`;
}

/* ---------- Posebnosti ---------- */
function renderNotices(){
  const today = todayStr();
  const list = S.notices.slice().sort((a,b) => (a.closed - b.closed) || b.from.localeCompare(a.from));
  const tipChip = n => `<span class="chip ${n.tip === 'okvara' ? 'bad' : n.tip === 'servis' ? 'warn' : 'info'}">${esc(n.tip)}</span>`;
  $('#view').innerHTML = `
    <div class="two">
      <form class="card card-pad stack" data-form="addNotice" style="gap:12px">
        <h3>Nova posebnost</h3>
        <div class="formgrid">
          <div class="field full"><label for="nv">Vozilo</label><select id="nv" name="vehicleId">${S.vehicles.filter(v => v.tip !== 'ostalo').map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="nt">Vrsta</label><select id="nt" name="tip"><option>okvara</option><option>servis</option><option>pregled</option><option>drugo</option></select></div>
          <div class="field"><label for="nf">Od</label><input id="nf" type="date" name="from" value="${today}" required></div>
          <div class="field"><label for="nto">Do (prazno = do preklica)</label><input id="nto" type="date" name="to"></div>
          <div class="field full"><label for="nn">Opis</label><input id="nn" type="text" name="note" placeholder="npr. pokvarjen zavorni sistem, redni servis v Krškem" autocomplete="off"></div>
        </div>
        <button class="btn primary" type="submit">Dodaj posebnost</button>
        <p class="hint" style="margin:0">Okvara in servis samodejno izločita vozilo iz razporeda za vse dni v obdobju.</p>
      </form>
      <div class="stack">
        <div class="card card-pad"><div class="card-head"><h3>Stanje vozil danes</h3></div>
          <div class="row" style="gap:8px">${S.vehicles.filter(v => v.tip !== 'ostalo').map(v => { const b = vehBlocked(today, v.id); return `<span class="chip ${b ? 'bad' : 'ok'}">${esc(v.name)} · ${b ? esc(b.tip) : 'v redu'}</span>`; }).join('')}</div></div>
        ${list.length ? list.map(n => `<div class="notice ${n.closed ? 'closed' : ''}">${tipChip(n)}<div><b>${esc((vehById(n.vehicleId) || { name:'(izbrisano vozilo)' }).name)}</b> <span class="mono dim">${n.from}${n.to ? ' → ' + n.to : ' → do preklica'}</span><div class="muted">${esc(n.note || '')}</div></div>
          <div class="row">${n.closed ? '<span class="chip">zaključeno</span>' : `<button type="button" class="btn sm" data-act="closeNotice" data-id="${n.id}">Zaključi</button>`}<button type="button" class="icon-btn" data-act="delNotice" data-id="${n.id}" aria-label="Izbriši">${IC.x}</button></div></div>`).join('')
          : '<div class="empty-state">Ni vpisanih posebnosti. Ko vozilo odpove ali gre na servis, ga vpiši tukaj.</div>'}
      </div>
    </div>`;
}

/* ---------- Nastavitve ---------- */
const field = (path, val, opts={}) => `<input data-path="${path}" ${opts.num ? 'type="number" data-num="1" step="' + (opts.step || 1) + '"' : (opts.time ? 'type="time"' : 'type="text"')} value="${esc(val)}" ${opts.sug ? 'data-suggest="from"' : ''} ${opts.ph ? 'placeholder="' + esc(opts.ph) + '"' : ''} ${opts.label ? 'aria-label="' + esc(opts.label) + '"' : ''}>`;
function settingsTabs(){
  const t = [['vozila','Vozila',true],['zaposleni','Zaposleni',false],['pravila','Pravila',true],['dializa','Dializa',false],['planiranje','Izračun',true],['naslovi','Naslovi in naselja',true],['uporabniki','Uporabniki',true],['varnost','Varnost',true],['logotipi','Logotipi',true],['podatki','Podatki',false]];
  return `<div class="tabs" role="tablist">${t.filter(x => !x[2] || isAdmin()).map(x => `<button type="button" role="tab" data-act="setTab" data-k="${x[0]}" aria-selected="${UI.setTab === x[0]}">${x[1]}</button>`).join('')}</div>`;
}
const accountOptions = cur => {
  const list = BACKEND === 'firebase' ? USERS_REMOTE.map(u => ({ id:u.id, name:u.name, role:u.role })) : USERS.map(u => ({ id:u.id, name:u.name, role:u.role }));
  return `<option value="">brez računa</option>` + list.map(u => `<option value="${esc(u.id)}" ${cur === u.id ? 'selected' : ''}>${esc(u.name)} (${esc(ROLES[u.role] || u.role)})</option>`).join('');
};
function renderSettings(){
  if (!isAdmin() && ['vozila','pravila','planiranje','naslovi','uporabniki','varnost','logotipi'].includes(UI.setTab)) UI.setTab = 'zaposleni';
  let body = '';
  const T = UI.setTab;
  if (T === 'vozila'){
    const num = (i, k, v, lbl) => field(`vehicles.${i}.${k}`, v, { num:1, label:lbl });
    body = `<div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Vozila in kapaciteta</h3><button type="button" class="btn primary sm" data-act="addVeh">${IC.plus} Dodaj vozilo</button></div>
      <div class="banner"><span>${IC.info}</span><div><b>Običajno</b> je število pacientov, ki jih vozilo vozi po pravilih. <b>Izjemoma</b> je največ, kar vozilo še lahko pelje, kadar je treba pravila prilagoditi (npr. vozilo s 6 sedeži, ki običajno vozi 4 paciente). Prilagoditev se uporabi samo, ko je potrebna, in je vedno izpisana. Vrstica »OSTALO« ni vozilo, ampak mesto za zaposlene brez vozila. Začetne številke so ocena, popravi jih.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th rowspan="2">Ime</th><th rowspan="2">Vrsta</th><th rowspan="2">Tip vozila</th><th rowspan="2">Namen</th><th rowspan="2">Ekipa</th><th colspan="4">Običajno</th><th colspan="4">Izjemoma največ</th><th rowspan="2">Aktivno</th><th rowspan="2"></th></tr><tr><th>Sede</th><th>Leže</th><th>Utila</th><th>Skupaj</th><th>Sede</th><th>Leže</th><th>Utila</th><th>Skupaj</th></tr></thead><tbody>
      ${S.vehicles.map((v, i) => `<tr><td>${field(`vehicles.${i}.name`, v.name, { label:'Ime' })}</td>
        <td><select data-path="vehicles.${i}.tip" aria-label="Vrsta"><option value="sanitetno" ${v.tip==='sanitetno'?'selected':''}>Sanitetno</option><option value="resevalno" ${v.tip==='resevalno'?'selected':''}>Reševalno</option><option value="ostalo" ${v.tip==='ostalo'?'selected':''}>Ostalo (brez vozila)</option></select></td>
        <td><select data-path="vehicles.${i}.vrsta" aria-label="Tip vozila">${Object.entries(VEH_VRSTE).map(([k, l]) => `<option value="${k}" ${v.vrsta === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        <td><select data-path="vehicles.${i}.fn" aria-label="Namen">${Object.entries(VEH_FN).map(([k, l]) => `<option value="${k}" ${v.fn === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        <td><select data-path="vehicles.${i}.ns" aria-label="Ekipa"><option value="redna" ${v.ns==='redna'?'selected':''}>Redna</option><option value="NN" ${v.ns==='NN'?'selected':''}>NN</option><option value="oboje" ${v.ns==='oboje'?'selected':''}>Oboje</option></select></td>
        <td>${num(i,'sede',v.sede,'Sede')}</td><td>${num(i,'leze',v.leze,'Leže')}</td><td>${num(i,'utila',v.utila,'Utila')}</td><td>${num(i,'skupaj',v.skupaj,'Skupaj')}</td>
        <td>${num(i,'sedeMax',v.sedeMax,'Sede največ')}</td><td>${num(i,'lezeMax',v.lezeMax,'Leže največ')}</td><td>${num(i,'utilaMax',v.utilaMax,'Utila največ')}</td><td>${num(i,'skupajMax',v.skupajMax,'Skupaj največ')}</td>
        <td><input type="checkbox" data-path="vehicles.${i}.aktiv" data-bool="1" ${v.aktiv ? 'checked' : ''} aria-label="Aktivno"></td>
        <td><button type="button" class="icon-btn" data-act="delVeh" data-i="${i}" aria-label="Izbriši vozilo">${IC.x}</button></td></tr>`).join('')}
      </tbody></table></div>
      <p class="hint" style="margin:0">Nosil (leže) aplikacija nikoli ne »ustvari«: če vozilo nima nosil, ostane pacient leže nerazporejen in dobiš opozorilo.</p></div>`;
  } else if (T === 'zaposleni'){
    body = `<div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Zaposleni</h3></div>
      <form class="row" data-form="addStaff" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime in priimek" aria-label="Ime zaposlenega" required autocomplete="off"><select name="team" style="width:auto" aria-label="Ekipa"><option value="redna">Redna ekipa</option><option value="NN">NN ekipa</option></select><button class="btn primary" type="submit">Dodaj</button></form>
      ${S.staff.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th>Ime in priimek</th><th>Privzeta ekipa</th><th>Račun za aplikacijo posadke</th><th></th></tr></thead><tbody>${S.staff.map((s, i) => `<tr><td>${field(`staff.${i}.name`, s.name, { label:'Ime' })}${s.demo ? ' <span class="chip warn">PRIMER</span>' : ''}</td><td><select data-path="staff.${i}.team" aria-label="Ekipa"><option value="redna" ${s.team==='redna'?'selected':''}>Redna</option><option value="NN" ${s.team==='NN'?'selected':''}>NN</option></select></td><td><select data-path="staff.${i}.userId" aria-label="Račun">${accountOptions(s.userId)}</select></td><td><button type="button" class="icon-btn" data-act="delStaff" data-i="${i}" aria-label="Izbriši">${IC.x}</button></td></tr>`).join('')}</tbody></table></div>
      <p class="hint" style="margin:0">Zaposlenega poveži z računom (Nastavitve → Uporabniki), da bo po »Objavi razpored« videl svoje prevoze v aplikaciji in javljal korake.</p>` : '<div class="empty-state">Še ni zaposlenih. Dodani zaposleni se v Dispečerju izberejo z enim dotikom.</div>'}</div>`;
  } else if (T === 'pravila'){
    body = rulesTab();
  } else if (T === 'dializa'){
    const dg = DIA_GROUPS.map(g => { const c = S.settings.dia[g]; return `<tr><td><b class="mono">${g}</b></td><td>${field(`settings.dia.${g}.start`, c.start, { time:1, label:g + ' začetek' })}</td><td>${field(`settings.dia.${g}.end`, c.end, { time:1, label:g + ' konec' })}</td>
      <td><div class="row" style="gap:10px">${[1,2,3,4,5,6,0].map(d => `<label class="row" style="gap:4px;flex-wrap:nowrap"><input type="checkbox" data-diaday="${g}|${d}" ${c.days.includes(d) ? 'checked' : ''}> ${DOW_SHORT[d]}</label>`).join('')}</div></td></tr>`; }).join('');
    const dp = S.patients.filter(p => p.dia);
    body = `<div class="stack"><div class="card card-pad stack"><h3>Skupine dialize</h3><div class="banner"><span>${IC.info}</span><div>Začetne ure so ocena. Vpiši dejanske ure dialize. Prevoz tja je ob začetku, prevoz nazaj ob koncu.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th>Skupina</th><th>Začetek</th><th>Konec</th><th>Dnevi</th></tr></thead><tbody>${dg}</tbody></table></div></div>
      <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Dializni pacienti</h3><button type="button" class="btn sm" data-nav="pacienti">Odpri bazo pacientov</button></div>
      <p class="muted" style="margin:0">Dializni pacienti so v bazi pacientov (polje »Dializa«). Za vsakega vpiši letni nalog, aplikacija pa opozori mesec pred iztekom.</p>
      ${dp.length ? `<div class="row" style="gap:6px">${dp.map(p => `<button type="button" class="chip toggle ${pcClass(p.id)}" data-act="openPatient" data-id="${p.id}"><span class="pdot ${pcClass(p.id)}"></span>${esc(p.name)} · ${esc(p.dia)}</button>`).join('')}</div>` : '<div class="empty-state">Še ni dializnih pacientov. V bazi pacientov izberi skupino dialize.</div>'}</div></div>`;
  } else if (T === 'planiranje'){
    const k = (label, path, step=1, unit='') => `<label for="k-${path}">${label}${unit ? ' <span class="dim">(' + unit + ')</span>' : ''}</label>${field(path, S.settings[path.split('.')[1]], { num:1, step, label })}`.replace('data-path', `id="k-${path}" data-path`);
    const kl = (label, key) => `<label for="k-lim-${key}">${label} <span class="dim">(km/h)</span></label>${field('settings.lim.' + key, S.settings.lim[key], { num:1, step:1, label }).replace('data-path', 'id="k-lim-' + key + '" data-path')}`;
    body = `<div class="card card-pad stack"><h3>Parametri izračuna</h3><div class="kv">
      ${kl('Omejitev v naselju','naselje')}${kl('Omejitev izven naselij','izven')}${kl('Omejitev na hitri cesti','hitra')}${kl('Omejitev na avtocesti','avtocesta')}${k('Dejanska hitrost glede na omejitev','settings.eff',1,'%')}${k('Faktor ceste (cesta / zračna črta)','settings.road',0.05)}${k('Čas pobiranja pacienta','settings.pickMin',1,'min')}${k('Čas odpuščanja pacienta','settings.dropMin',1,'min')}
      ${k('Rezerva pred preiskavo','settings.buffer',1,'min')}${k('Okno združevanja po uri','settings.window',5,'min')}${k('Največji dodaten čas za soprevoznika','settings.detour',5,'min')}${k('Najdaljša vožnja pacienta v vozilu','settings.maxRide',5,'min')}
      ${k('Čakanje pri odvozu brez zamude','settings.waitTol',1,'min')}${k('Število polj v knjigi na dan','settings.slots',1,'polj')}${k('Samodejna odjava','settings.idleMin',5,'min')}
      <label for="k-shift">Privzet začetek izmene</label><input id="k-shift" type="time" data-path="settings.shift" value="${esc(S.settings.shift)}"></div>
      <p class="hint" style="margin:0">Spremembe veljajo takoj. Razpored za današnji in jutrišnji dan se ponovno izračuna.</p></div>`;
  } else if (T === 'naslovi'){
    body = `<div class="stack"><div class="card card-pad stack"><h3>Naslovi za samodejno dopolnjevanje</h3>
      <p class="muted" style="margin:0">Predlogi zajemajo vseh ${SETTLEMENTS.length} naselij Občine Brežice, ustanove, del ulic v Brežicah in naslove, ki jih že vpisuješ (${S.addrBook.length}). Za predloge do hišne številke uvozi CSV z naslovi (npr. iz odprtih podatkov GURS, register prostorskih enot). Stolpci: ulica, hišna številka, naselje, ter koordinate (lat, lon v WGS84 ali E, N v D96/TM); stolpec občina je neobvezen (uvozijo se samo naslovi Občine Brežice). Da bodo naslovi na vseh napravah, po uvozu klikni »Prenesi naslovi.json« in datoteko naloži na GitHub poleg index.html (glej navodila).</p>
      <div class="row"><input type="file" id="csvFile" accept=".csv,text/csv,text/plain" style="max-width:320px"><span class="chip mono">uvoženih: ${ADDR.list.length}${SHARED_ADDR.length ? ' (skupnih: ' + SHARED_ADDR.length + ')' : ''}</span><button type="button" class="btn sm" data-act="exportAddr">Prenesi naslovi.json</button><button type="button" class="btn sm danger" data-act="clearAddr">Izbriši uvožene</button><button type="button" class="btn sm" data-act="clearLearned">Pozabi naučene naslove</button></div></div>
      <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Koordinate naselij</h3><span class="chip warn">približne vrednosti</span></div>
      <p class="muted" style="margin:0">Izračun razdalj uporablja te točke. Če poznaš boljše koordinate, jih popravi. Spremenjene vrstice so označene.</p>
      <div class="scrollbox"><table class="edtable"><thead><tr><th>Naselje</th><th>Širina (lat)</th><th>Dolžina (lon)</th><th></th></tr></thead><tbody>${SETTLEMENTS.map((s, i) => { const o = S.coordOv[s.n]; return `<tr><td>${esc(s.n)}</td><td class="coord"><input type="number" step="0.001" data-coord="${i}|0" value="${o ? o[0] : s.lat}" aria-label="${esc(s.n)} lat"></td><td class="coord"><input type="number" step="0.001" data-coord="${i}|1" value="${o ? o[1] : s.lon}" aria-label="${esc(s.n)} lon"></td><td>${o ? '<span class="chip accent">spremenjeno</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div></div></div>`;
  } else if (T === 'uporabniki'){
    body = usersTab();
  } else if (T === 'varnost'){
    body = securityTab();
  } else if (T === 'logotipi'){
    body = logosTab();
  } else {
    body = dataTab();
  }
  $('#view').innerHTML = `${settingsTabs()}<div style="height:14px"></div>${body}`;
}

/* ---------- Prijava ---------- */
function renderAuth(mode, msg=''){
  const first = BACKEND !== 'firebase' && USERS.length === 0;
  const card = $('#authCard');
  const local = BACKEND !== 'firebase' ? `<div class="banner warn" style="font-size:12.5px"><span>${IC.info}</span><div><b>Lokalni način.</b> Podatki so samo v tem brskalniku. Uporabi samo izmišljene podatke. Za pravo uporabo glej navodila (Firebase).</div></div>` : '';
  if (first){
    card.innerHTML = `<h2>Prvi zagon</h2><p class="muted" style="margin:0">Ustvari račun skrbnika. Pozneje dodaš še račune za dispečerje in posadke.</p>${local}
      <form id="setupForm"><div class="field"><label for="su">Uporabniško ime</label><input id="su" name="username" required autocomplete="username"></div>
      <div class="field"><label for="sn">Ime in priimek</label><input id="sn" name="name" autocomplete="name"></div>
      <div class="field"><label for="sp">Geslo (vsaj 10 znakov)</label><input id="sp" name="pw" type="password" minlength="10" required autocomplete="new-password"></div>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" name="demo" checked> Naloži primere (izmišljeni pacienti, voznik in spremljevalec)</label>
      <button class="btn primary" type="submit">Ustvari račun in začni</button><div class="auth-err" id="authErr" role="alert">${esc(msg)}</div></form>
      <p class="legalnote">Podatki o pacientih se ne shranjujejo na GitHub. Prijava deluje v tem brskalniku.</p>`;
  } else {
    card.innerHTML = `<h2>Prijava</h2><p class="muted" style="margin:0">Dostop imajo samo zaposleni Reševalne postaje Brežice.</p>${local}
      <form id="loginForm"><div class="field"><label for="lu">${BACKEND === 'firebase' ? 'Uporabniško ime ali e-pošta' : 'Uporabniško ime'}</label><input id="lu" name="username" required autocomplete="username" autocapitalize="none" spellcheck="false" autofocus></div>
      <div class="field"><label for="lp">Geslo</label><input id="lp" name="pw" type="password" required autocomplete="current-password"></div>
      ${BACKEND === 'firebase' ? '<label class="row" style="gap:8px;flex-wrap:nowrap;font-size:13px"><input type="checkbox" name="remember"> Ostani prijavljen na tej napravi (ne na skupnem računalniku)</label>' : ''}
      <button class="btn primary" type="submit">Prijava</button><div class="auth-err" id="authErr" role="alert">${esc(msg)}</div></form>
      <p class="legalnote">Podatke o pacientih obravnavaj skladno z internimi pravili zdravstvenega doma. Vsaka prijava in ogled pacienta se beležita.</p>`;
  }
}
