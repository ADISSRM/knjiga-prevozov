/* =====================================================================
   ZASLONI
   ===================================================================== */
const UI = { view:'knjiga', month:null, date:null, dDate:null, lDate:null, cDate:null, filter:'vsi', q:'', setTab:'vozila', bookRev:'', pid:'', nid:'', pf:'vsi', pq:'', modal:null, stale:false, selfTest:null, maps:{}, routeBusy:'', sect:{}, openRide:'', kmRep:false, gTest:null, kmTried:{} };
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
  nastavitve:['Nastavitve', 'Vozila, zaposleni, dializa, klinike, izračun, uporabniki in podatki.'],
  moji:['Moji prevozi', '']
};

/* ---------- Logotipi: datoteka iz mape logos/, ali naložen v Nastavitve → Logotipi; sicer samo besedilo ---------- */
const LOGOS = { zd:{ label:'ZD Brežice', file:'logos/zd-brezice.png' }, nmp:{ label:'NMP', file:'logos/nmp.png' } };
const logoSrc = k => store.get('kp.logo.' + k) || LOGOS[k].file;   // če datoteke ni, se prikaže besedilo (glej poslušalec napake spodaj)
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

/* ---------- Kilometrina: oznaka in polje ---------- */
const KM_SRC_L = { google:'Google Zemljevidi', rocno:'ročni vnos', osrm:'ocena po cestah (OSM)', ocena:'ocena po zračni razdalji' };
function kmChipHTML(r){
  if (!isFilled(r) || r.odpovedano) return '<span class="kmchip" data-role="kmchip" hidden></span>';
  const i = KM.info(r); if (i.total == null) return '<span class="kmchip" data-role="kmchip" hidden></span>';
  const ex = i.exact && i.backExact, tip = `${KM_SRC_L[i.src] || ''}: ${KM.fmtKm(i.km)} km` + (i.back ? ` + nazaj ${KM.fmtKm(i.back)} km` : '');
  return `<span class="kmchip src-${i.src} ${ex ? 'ex' : 'est'}" data-role="kmchip" title="${esc(tip)}">${ex ? '' : '~'}${KM.fmtKm(i.total)} km</span>`;
}
function kmBoxHTML(r){
  if (!(r.from || '').trim() || !(r.to || '').trim()) return '<span class="hint">Vpiši OD in DO: kilometrina se izračuna sama.</span>';
  const i = KM.info(r), gi = GOOGLE.info(), tilde = x => x ? '' : '~';
  const parts = [`<b class="kmv">${tilde(i.exact)}${KM.fmtKm(i.km)} km</b>`];
  if (i.back) parts.push(`nazaj ${tilde(i.backExact)}${KM.fmtKm(i.back)} km`, `skupaj <b>${tilde(i.exact && i.backExact)}${KM.fmtKm(i.total)} km</b>`);
  const can = GOOGLE.enabled();
  return `<span class="srcbadge src-${i.src}">${KM_SRC_L[i.src] || ''}</span><span class="kmtxt">${parts.join(' · ')}</span>
    <input type="text" inputmode="decimal" class="kmin" data-km="manual" placeholder="ročno" aria-label="Ročni vnos kilometrov OD → DO" value="${r.kmSrc === 'rocno' && r.km != null ? KM.fmtKm(r.km) : ''}">
    ${can ? '<button type="button" class="btn sm" data-act="kmRecalc">Izračunaj z Googlom</button>' : `<span class="hint">${gi.configured ? 'Google je izklopljen.' : 'Natančen izračun: vnesi ključ Google (Nastavitve → Izračun).'}</span>`}`;
}

/* ---------- Mesečna knjiga ---------- */
function kmReportHTML(y, m){
  const rep = KM.month(y, m), share = rep.total ? Math.round(rep.exact / rep.total * 100) : 0;
  const vehRows = Object.entries(rep.veh).sort((a, b) => b[1] - a[1]).map(([v, k]) => `<tr><td>${esc(v)}</td><td class="num">${KM.fmtKm(k)} km</td></tr>`).join('');
  const dayRows = rep.days.map(d => `<tr><td>${fmtShort(d.date)}</td><td class="num">${d.n}</td><td class="num">${KM.fmtKm(d.km)} km</td></tr>`).join('');
  return `<section class="card card-pad stack kmrep" id="kmReport">
    <div class="card-head" style="margin:0"><h3>Kilometrina · ${MONTHS[m]} ${y}</h3>
      <div class="row" style="gap:6px"><button type="button" class="btn sm" data-act="kmMonth" ${GOOGLE.enabled() ? '' : 'disabled title="Najprej vnesi ključ Google (Nastavitve → Izračun)"'}>Izračunaj manjkajoče z Googlom</button><button type="button" class="btn sm" data-act="kmCsv" data-names="0">Prenesi CSV</button><button type="button" class="btn sm" data-act="kmCsv" data-names="1">CSV z imeni pacientov</button></div></div>
    <div class="sumline"><span><b class="mono">${KM.fmtKm(rep.total)}</b> km skupaj</span><span><b class="mono">${share} %</b> natančno (Google ali ročno)</span><span><b class="mono">${rep.missing}</b> prevozov brez km</span></div>
    ${rep.rows.length ? `<div class="two"><div class="tablewrap"><table><thead><tr><th>Dan</th><th class="num">Prevozov</th><th class="num">Km</th></tr></thead><tbody>${dayRows}</tbody></table></div>
      <div class="tablewrap"><table><thead><tr><th>Vozilo</th><th class="num">Km</th></tr></thead><tbody>${vehRows || '<tr><td colspan="2" class="muted">Vozila se pokažejo po razporeditvi.</td></tr>'}</tbody></table></div></div>` : '<div class="empty-state">V tem mesecu še ni prevozov.</div>'}
    <p class="hint" style="margin:0">Kilometrina prevoza = razdalja OD → DO po najboljši poti (Google Zemljevidi, osebni avto). Pri čakanju na pregled je prišteta tudi pot nazaj. Vožnja reševalca do pacienta in nazaj na postajo ni všteta. Oznaka ~ pomeni oceno (brez Googla).</p></section>`;
}
function renderMonth(){
  const { y, m } = UI.month, n = daysInMonth(y, m), today = todayStr();
  let tr = 0, td = 0, dd = 0, tcn = 0; const cards = [];
  for (let d = 1; d <= n; d++){
    const date = `${y}-${pad(m+1)}-${pad(d)}`;
    const all = (S.rides[date] || []).filter(isFilled), filled = all.filter(r => !r.odpovedano), canc = all.length - filled.length, done = filled.filter(r => r.done).length;
    tcn += canc; tr += filled.length; td += done; if (filled.length) dd++;
    const hol = holiday(date), wk = isStandby(date);
    const oc = (S.crewBook[date] || {}).ost || { text:'', manual:false };
    cards.push(`<article class="day ${date === today ? 'today' : ''} ${wk ? 'wk' : ''} ${date < today ? 'past' : ''}">
      <button type="button" class="day-head" data-act="openDay" data-date="${date}">
        <span class="dnum tnum">${pad(d)}</span>
        <span class="dtxt"><span class="dname">${DOW_LONG[dow(date)]}</span>
          <span class="dmeta">${date === today ? '<span class="chip accent">danes</span>' : ''}${hol ? `<span class="chip warn" title="${esc(hol)}">praznik</span>` : ''}${wk && !hol ? '<span class="chip info">pripravljenost</span>' : ''}</span></span>
        <span class="dcount"><b>${filled.length}</b>${filled.length ? `${done}/${filled.length} ✓` : 'prevozov'}${canc ? `<span class="chip bad">${canc} odpov.</span>` : ''}</span>
      </button>
      <div class="crew"><div class="crew-row"><label>Opomba</label><input type="text" data-crew="${date}|ost" value="${esc(oc.text)}" placeholder="kaj je narobe / opomba" aria-label="Ostalo, ${fmtShort(date)}"></div></div></article>`);
  }
  $('#view').innerHTML = `
    ${demoBanner()}${alertsBanner()}
    <div class="monthbar">
      <button type="button" class="btn" data-act="monthPrev" aria-label="Prejšnji mesec">${IC.left}</button>
      <h2>${MONTHS[m]} ${y}</h2>
      <button type="button" class="btn" data-act="monthNext" aria-label="Naslednji mesec">${IC.right}</button>
      <button type="button" class="btn" data-act="monthToday">Danes</button>
      <span class="sumline"><span><b class="mono">${tr}</b> prevozov</span><span><b class="mono">${td}</b> opravljenih</span>${tcn ? `<span><b class="mono">${tcn}</b> odpovedanih</span>` : ''}</span>
      <span class="sp" style="margin-left:auto"></span>
      <button type="button" class="btn ${UI.kmRep ? 'primary' : ''}" data-act="kmReport" aria-pressed="${UI.kmRep}">Kilometrina</button>
      <button type="button" class="btn" data-act="printMonth">Natisni</button>
    </div>
    ${UI.kmRep ? kmReportHTML(y, m) : ''}
    <div class="days">${cards.join('')}</div>`;
}

/* ---------- Dnevna knjiga: vrstice prevozov, ena odprta za urejanje ---------- */
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
function assignText(a){ return a ? esc(a.veh) + ' · ' + fmtT(a.t) : ''; }
function sumRowHTML(r, nr, a, open){
  const dir = rideDir(r), showSt = r.status && r.status !== 'nova';
  return `<button type="button" class="rrow" data-act="openRide" aria-expanded="${open}" aria-label="Prevoz ${nr}: ${esc(r.name || 'brez imena')}">
    <span class="nr">${nr}</span><span class="rtm" data-role="rtime">${esc(r.time || '–')}</span>
    <span class="rbody"><span class="rname" data-role="rname">${esc(r.name || '(brez imena)')}</span><span class="rroute" data-role="rroute">${esc(r.from)}${r.to ? ' → ' + esc(r.to) : ''}</span></span>
    <span class="rtags" data-role="rtags">${rowTags(r, dir)}${showSt ? stChip(r.status) : ''}${r.odpovedano ? '<span class="chip bad">odpovedano</span>' : ''}${r.demo ? '<span class="chip warn">PRIMER</span>' : ''}</span>
    ${kmChipHTML(r)}
    <span class="assign ${a && a.late > 0 ? 'late' : ''}" data-role="assign" ${a ? '' : 'hidden'}>${assignText(a)}</span>
    <span class="rcheck" aria-hidden="true">${r.done ? IC.check : ''}</span></button>`;
}
function rowTags(r, dir){
  return `${r.mode !== 'sede' ? `<span class="rtag m-${r.mode}">${MODES[r.mode]}</span>` : ''}${dir === 'from' ? '<span class="rtag">odvoz</span>' : ''}${+r.stay > 0 && dir === 'to' ? `<span class="rtag">čaka ${+r.stay} min</span>` : ''}${r.dia ? `<span class="rtag">dializa</span>` : ''}`;
}
/* Čakanje na pregled: prikaže se samo pri prevozu TJA na ustanovo/kliniko. */
function stayInfo(r, a){
  const g = geo(r.to || ''), on = +r.stay > 0;
  const show = rideDir(r) === 'to' && (g.kind === 'poi' || on);
  return { show, on, def:poiStay(g) || S.settings.stayDef || 45, text:on ? (a && a.retPickT != null ? `Pobere nazaj ob ${fmtT(a.retPickT)} (pregled ${+r.stay} min + pot do ambulante).` : `Po pregledu (${+r.stay} min) pobere pacienta nazaj.`) : 'Brez čakanja: prevoz nazaj se vpiše posebej.' };
}
function stayRowHTML(r, a){
  const s = stayInfo(r, a);
  return `<div class="field full stayrow" data-role="stay" ${s.show ? '' : 'hidden'}><label class="check" title="Pacient ima pregled, reševalec počaka in ga odpelje nazaj"><input type="checkbox" data-f="stayOn" ${s.on ? 'checked' : ''}> Reševalec počaka na pregled</label>
    <span class="staymin" data-role="stayMin" ${s.on ? '' : 'hidden'}><input type="number" data-f="stay" min="5" max="480" step="5" value="${s.on ? +r.stay : s.def}" aria-label="Trajanje pregleda v minutah"> <span class="dim">min</span></span>
    <span class="hint" data-role="stayInfo">${esc(s.text)}</span></div>`;
}
function boxHTML(date, r, nr, plan){
  const filled = isFilled(r), a = plan.assign[r.id], open = UI.openRide === r.id;
  const g = r.from.trim() ? geo(r.from) : null;
  const pc = pcClass(r.patientId);
  const ptc = r.patientId ? patientById(r.patientId) : null, nlc = ptc ? ((ptc.naloge || []).find(n => n.id === r.nalogId) || activeNalog(ptc, date)) : null;
  const nt = ptc ? 'nt-' + (nlc ? nlc.vrsta : 'none') : '';
  const editor = !open ? '' : `<div class="editor">
    <div class="bgrid">
      <div class="field"><label for="n-${r.id}">Ime in priimek</label><input id="n-${r.id}" type="text" data-f="name" data-suggest="patient" value="${esc(r.name)}" autocomplete="off" placeholder="išči v bazi pacientov"></div>
      <div class="field"><label for="t-${r.id}" title="Ura preiskave. Pri odvozu iz ustanove: ura, ko je pacient pripravljen.">Ura</label><input id="t-${r.id}" type="time" data-f="time" value="${esc(r.time)}"></div>
      <div class="field full"><span class="lbl">Način prevoza</span>${modeSeg(r.mode)}</div>
      <div class="field full"><label for="f-${r.id}">Od</label><input id="f-${r.id}" type="text" data-f="from" data-suggest="from" class="${g && g.kind === 'neznano' ? 'warnfield' : ''}" value="${esc(r.from)}" autocomplete="off" placeholder="npr. Dobova 25"></div>
      <div class="field full"><label for="o-${r.id}">Do</label><input id="o-${r.id}" type="text" data-f="to" data-suggest="to" value="${esc(r.to)}" autocomplete="off" placeholder="npr. UKC Ljubljana – Očesna klinika"></div>
      ${stayRowHTML(r, a)}
      <div class="field full kmrow" data-role="km">${kmBoxHTML(r)}</div>
      <div class="field"><label for="p-${r.id}">Telefon</label><input id="p-${r.id}" type="tel" data-f="phone" value="${esc(r.phone)}" autocomplete="off"></div>
      <div class="field"><label for="x-${r.id}" title="npr. voziček, kisik, spremljevalec">Opomba</label><input id="x-${r.id}" type="text" data-f="note" value="${esc(r.note || '')}" autocomplete="off"></div>
    </div>
    ${pinfoHTML(date, r)}
    ${r.status && r.status !== 'nova' && r.times && Object.keys(r.times).length ? `<div class="row" style="gap:4px">${timesChips(r)}</div>` : ''}
    <div class="donerow">
      <label class="check"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label>
      <div class="field whodid"><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz" autocomplete="off"></div>
      <span class="sp"></span>
      <details class="menu"><summary class="btn sm ghost">Več</summary><div class="menupop">
        <label class="check" title="Prevoz je odpovedan: označen je rdeče in ni v razporedu"><input type="checkbox" data-f="odpovedano" ${r.odpovedano ? 'checked' : ''}> Odpovedano</label>
        <label class="check" title="Dovoli, da se za ta prevoz pravila prilagodijo (npr. več pacientov v vozilu, daljša pot)"><input type="checkbox" data-f="exc" ${r.exc ? 'checked' : ''}> Izjema pravil</label>
        ${filled ? `<button type="button" class="btn sm" data-act="rideView">${IC.eye} Predogled za kopiranje</button>` : ''}
        <button type="button" class="btn sm danger" data-act="clearRide" title="Počisti polje ${nr}">Počisti prevoz</button></div></details>
      <button type="button" class="btn sm" data-act="closeRide">Zapri</button>
    </div></div>`;
  return `<article class="box ${pc} ${nt} ${open ? 'open' : ''} ${r.done ? 'done' : ''} ${r.odpovedano ? 'cancelled' : ''}" data-ride="${r.id}" data-date="${date}" data-nr="${nr}">${sumRowHTML(r, nr, a, open)}${editor}</article>`;
}
function refreshStaffList(date){
  const names = new Set([...(S.duty[date] || []).map(d => d.name), ...S.staff.map(s => s.name)]);
  $('#staffList').innerHTML = [...names].map(n => `<option value="${esc(n)}"></option>`).join('');
}
const kmSum = date => { let t = 0, all = true, any = false; filledRides(date).forEach(({ r }) => { if (r.odpovedano) return; const i = KM.info(r); if (i.total == null) return; any = true; t += i.total; if (!(i.exact && i.backExact)) all = false; }); return { t, all, any }; };
function renderDay(){
  const date = UI.date, today = todayStr(), a = ensureDay(date), plan = computePlan(date);
  refreshStaffList(date);
  const list = filledRides(date), filled = list.length, done = list.filter(x => x.r.done).length, terms = diaTermsFor(date);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const warns = dayWarnings(date), ks = kmSum(date);
  const openR = rideById(date, UI.openRide), openEmpty = openR && !isFilled(openR.r) ? openR : null;
  const tools = filled >= 6 || UI.q || UI.filter !== 'vsi';
  $('#view').innerHTML = `
    <div class="daybar">
      <div class="row">
        <button type="button" class="btn" data-act="dayPrev" aria-label="Prejšnji dan">${IC.left}</button>
        <input type="date" id="dayPick" value="${date}" style="width:auto" aria-label="Izberi datum">
        <button type="button" class="btn" data-act="dayNext" aria-label="Naslednji dan">${IC.right}</button>
        <button type="button" class="btn ${date === today ? 'primary' : ''}" data-act="dayToday">Danes</button>
        <button type="button" class="btn ${date === addDays(today,1) ? 'primary' : ''}" data-act="dayTomorrow">Jutri</button>
      </div>
      <div class="row">
        <button type="button" class="btn primary" data-act="gotoDisp" data-date="${date}">${IC.route} Razpored</button>
        <details class="menu right"><summary class="btn" aria-label="Več možnosti">Več</summary><div class="menupop">
          ${terms.length ? `<button type="button" class="btn sm" data-act="loadDia">${IC.kidney.replace('<svg', '<svg width="14" height="14"')} Naloži dializne paciente</button>` : ''}
          <button type="button" class="btn sm" data-act="kmDay" ${GOOGLE.enabled() ? '' : 'disabled title="Najprej vnesi ključ Google (Nastavitve → Izračun)"'}>Preračunaj kilometrino z Googlom</button></div></details>
      </div>
    </div>
    <div class="sumline" id="daySum"><span><b class="mono">${filled}</b> ${filled === 1 ? 'prevoz' : 'prevozov'}</span><span><b class="mono">${done}</b> opravljenih</span>${ks.any ? `<span title="${ks.all ? 'Vse razdalje so natančne (Google ali ročno)' : 'Del razdalj je ocena (~)'}"><b class="mono">${ks.all ? '' : '~'}${KM.fmtKm(ks.t)}</b> km</span>` : ''}${terms.map(t => `<span class="chip">${IC.kidney.replace('<svg', '<svg width="12" height="12"')} dializa ${t === 'dop' ? 'dopoldne' : 'popoldne'}</span>`).join('')}${warns.length ? `<details class="warnbox inline"><summary>${warns.length} opozoril</summary><ul class="warnlist">${warns.slice(0, 40).map(w => `<li>${esc(w.text)}</li>`).join('')}</ul></details>` : ''}</div>
    ${blocked.length ? `<div class="banner bad"><span>${IC.alert}</span><div>${blocked.map(v => `<b>${esc(v.name)}</b>: ${esc(vehBlocked(date, v.id).tip)}${vehBlocked(date, v.id).note ? ' (' + esc(vehBlocked(date, v.id).note) + ')' : ''}`).join(' · ')}. Vozilo ni v razporedu.</div></div>` : ''}
    ${S.dayNote[date] ? `<div class="banner warn"><span>${IC.info}</span><div><b>Opomba dneva:</b> ${esc(S.dayNote[date])}</div></div>` : ''}
    ${tools ? `<div class="toolbar"><div class="seg inline" role="group" aria-label="Filter">${[['vsi', 'Vsi'], ['cakajo', 'Čakajo'], ['opravljeni', 'Opravljeni']].map(([k, l]) => `<button type="button" data-act="filter" data-k="${k}" aria-pressed="${UI.filter === k}">${l}</button>`).join('')}</div>
      <input type="search" id="rideSearch" placeholder="Išči po imenu ali naslovu" value="${esc(UI.q)}" aria-label="Išči"></div>` : ''}
    <div class="boxes" id="boxes">${list.map(({ r, nr }) => boxHTML(date, r, nr, plan)).join('')}${openEmpty ? boxHTML(date, openEmpty.r, openEmpty.nr, plan) : ''}</div>
    ${list.length || openEmpty ? '' : '<div class="empty-state">Za ta dan še ni vpisanih prevozov.</div>'}
    <div class="row" style="margin-top:12px"><button type="button" class="btn ${list.length ? '' : 'primary'}" data-act="newRide">${IC.plus} Nov prevoz</button></div>`;
  applyFilter();
  kmAuto(date);
}
function applyFilter(){
  const q = norm(UI.q);
  $$('#boxes .box').forEach(el => {
    const hit = rideById(el.dataset.date, el.dataset.ride); if (!hit) return;
    const r = hit.r; let show = true;
    if (UI.filter === 'cakajo') show = !r.done; else if (UI.filter === 'opravljeni') show = !!r.done;
    if (show && q) show = norm([r.name, r.from, r.to, r.phone].join(' ')).includes(q);
    el.hidden = !show && UI.openRide !== r.id;
  });
}
function updateDayCounts(){
  const date = UI.date, list = filledRides(date), el = $('#daySum'); if (!el) return;
  const f = list.length, d = list.filter(x => x.r.done).length, ks = kmSum(date), spans = $$(':scope > span:not(.chip)', el);
  if (spans[0]) spans[0].innerHTML = `<b class="mono">${f}</b> ${f === 1 ? 'prevoz' : 'prevozov'}`;
  if (spans[1]) spans[1].innerHTML = `<b class="mono">${d}</b> opravljenih`;
  let kmEl = spans[2];
  if (ks.any){ if (!kmEl){ kmEl = document.createElement('span'); spans[1].after(kmEl); } kmEl.title = ks.all ? 'Vse razdalje so natančne (Google ali ročno)' : 'Del razdalj je ocena (~)'; kmEl.innerHTML = `<b class="mono">${ks.all ? '' : '~'}${KM.fmtKm(ks.t)}</b> km`; }
  else if (kmEl) kmEl.remove();
}
/* Lahka osvežitev vrstice med tipkanjem (ne zamenja polj, da fokus ostane) */
function refreshKm(el){
  const hit = rideById(el.dataset.date, el.dataset.ride); if (!hit) return;
  const r = hit.r, chip = $('[data-role=kmchip]', el);
  if (chip){ const tmp = document.createElement('div'); tmp.innerHTML = kmChipHTML(r); chip.replaceWith(tmp.firstElementChild); }
  const kb = $('[data-role=km]', el); if (kb && !kb.contains(document.activeElement)) kb.innerHTML = kmBoxHTML(r);
  updateDayCounts();
}
function refreshStay(el, a){
  const hit = rideById(el.dataset.date, el.dataset.ride); if (!hit) return;
  const r = hit.r, sr = $('[data-role=stay]', el); if (!sr) return;
  const s = stayInfo(r, a);
  sr.hidden = !s.show; const cb = $('[data-f=stayOn]', sr), mi = $('[data-f=stay]', sr), mw = $('[data-role=stayMin]', sr), tx = $('[data-role=stayInfo]', sr);
  if (cb) cb.checked = s.on; if (mw) mw.hidden = !s.on; if (mi && document.activeElement !== mi) mi.value = s.on ? +r.stay : s.def; if (tx) tx.textContent = s.text;
}
function refreshAssign(el){
  const date = el.dataset.date, hit = rideById(date, el.dataset.ride); if (!hit) return;
  const plan = computePlan(date), a = plan.assign[hit.r.id], b = $('[data-role=assign]', el);
  if (b){ b.hidden = !a; b.className = 'assign ' + (a && a.late > 0 ? 'late' : ''); b.innerHTML = assignText(a); }
  refreshStay(el, a);
}
function refreshBox(el){
  const date = el.dataset.date, hit = rideById(date, el.dataset.ride); if (!hit) return;
  const r = hit.r;
  el.classList.toggle('done', !!r.done); el.classList.toggle('cancelled', !!r.odpovedano);
  const set = (sel, txt) => { const n = $(sel, el); if (n) n.textContent = txt; };
  set('[data-role=rname]', r.name || '(brez imena)'); set('[data-role=rtime]', r.time || '–'); set('[data-role=rroute]', `${r.from}${r.to ? ' → ' + r.to : ''}`);
  const tg = $('[data-role=rtags]', el); if (tg){ const showSt = r.status && r.status !== 'nova'; tg.innerHTML = rowTags(r, rideDir(r)) + (showSt ? stChip(r.status) : '') + (r.odpovedano ? '<span class="chip bad">odpovedano</span>' : '') + (r.demo ? '<span class="chip warn">PRIMER</span>' : ''); }
  const chk = $('.rcheck', el); if (chk) chk.innerHTML = r.done ? IC.check : '';
  const fi = $('[data-f=from]', el); if (fi){ const g = r.from.trim() ? geo(r.from) : null; fi.classList.toggle('warnfield', !!g && g.kind === 'neznano'); }
  $$('.seg [data-mode]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === r.mode)));
  refreshStay(el, null); refreshKm(el);
}
/* Samodejni izračun kilometrine za današnji in bližnje dneve (enkrat na sejo in dan; pozneje ob spremembi naslova) */
function kmAuto(date){
  if (!GOOGLE.auto() || UI.kmTried[date]) return;
  const t = todayStr(); if (date < addDays(t, -1) || date > addDays(t, 14)) return;
  UI.kmTried[date] = 1; KM.day(date).catch(() => {});
}

/* ---------- Dispečer ---------- */
function dutyHTML(date){
  const duty = S.duty[date] || [], avail = availableVehicles(date);
  const onNames = new Set(duty.map(d => d.name));
  const chips = S.staff.map(s => `<button type="button" class="chip toggle" data-act="toggleStaff" data-id="${s.id}" aria-pressed="${onNames.has(s.name)}">${esc(s.name)}${s.team === 'NN' ? ' · NN' : ''}</button>`).join('');
  const otOpts = [[0, 'Nadure: brez'], [30, 'Nadure do 30 min'], [60, 'Nadure do 1 h'], [120, 'Nadure do 2 h'], [180, 'Nadure do 3 h'], [240, 'Nadure do 4 h']];
  const items = duty.map((d, i) => { const st = staffOfDuty(d), vn = d.vehicleId && vehById(d.vehicleId), sum = ['Izmena' + (d.from ? ' ' + d.from + (d.to ? '–' + d.to : '') : ''), vn ? vn.name : '', +d.ot ? 'nadure' : ''].filter(Boolean).join(' · '); return `<div class="duty-item" data-di="${i}">
      <div class="dn">${esc(d.name)}</div><button type="button" class="icon-btn" data-act="rmDuty" data-i="${i}" aria-label="Odstrani ${esc(d.name)}">${IC.x}</button>
      <div class="dsel">
        <select data-duty="team" aria-label="Ekipa"><option value="redna" ${d.team==='redna'?'selected':''}>Redna ekipa</option><option value="NN" ${d.team==='NN'?'selected':''}>NN ekipa</option><option value="pripravljenost" ${d.team==='pripravljenost'?'selected':''}>Pripravljenost</option></select>
        <select data-duty="role" aria-label="Vloga"><option value="voznik" ${!['spremljevalec','student','dijak'].includes(d.role)?'selected':''}>Voznik</option><option value="spremljevalec" ${d.role==='spremljevalec'?'selected':''}>Spremljevalec</option><option value="student" ${d.role==='student'?'selected':''}>Študent</option><option value="dijak" ${d.role==='dijak'?'selected':''}>Dijak</option></select>
      </div>
      <details class="more"><summary>${esc(sum)}</summary><div class="dsel">
        <label class="mini">Začetek izmene<input type="time" data-duty="from" value="${esc(d.from||'')}" title="Prazno = izmena ni omejena"></label>
        <label class="mini">Konec izmene<input type="time" data-duty="to" value="${esc(d.to||'')}" title="Prazno = začetek + ${S.rules.shiftHours} h (če je vpisan začetek)"></label>
        <select data-duty="vehicleId" aria-label="Vozilo"><option value="">Vozilo: samodejno</option>${avail.map(v => `<option value="${v.id}" ${d.vehicleId===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select>
        <select data-duty="ot" aria-label="Nadure">${otOpts.map(([v, l]) => `<option value="${v}" ${(+d.ot || 0) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div></details></div>`; }).join('');
  return `<div class="card card-pad stack" style="gap:12px">
    <div class="card-head" style="margin:0"><h3>Zaposleni na delu</h3><span class="chip mono">${duty.length}</span></div>
    ${chips ? `<div class="row" style="gap:6px">${chips}</div>` : '<div class="hint">Seznam zaposlenih dodaš v Nastavitve → Zaposleni ali kar spodaj.</div>'}
    ${items || '<div class="empty-state" style="padding:14px">Še nihče ni vpisan za ta dan.</div>'}
    <form class="row" data-form="addDuty" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime novega zaposlenega" list="staffList" aria-label="Ime zaposlenega" autocomplete="off"><button class="btn primary" type="submit">Dodaj</button></form>
    <label class="check"><input type="checkbox" data-act="daySplit" ${S.dayRules[date] && S.dayRules[date].split ? 'checked' : ''}> Ekipa se razdeli na 2 voznika (vsak v svojem vozilu)</label>
    <div class="row"><button type="button" class="btn sm" data-act="copyDuty">${IC.copy} Kopiraj osebje od prejšnjega dne</button></div>
    <details class="hintdet"><summary>Pravila ekip</summary><p class="hint">NN ekipa ima 2 reševalca: voznik in spremljevalec (samodejno). Leže pacient vedno potrebuje voznika + spremljevalca in vozilo z nosili. Študent in dijak sta dodatna pomočnika. Posadka dialize lahko po koncu dialize prevaža tudi sede paciente.</p></details>
  </div>`;
}
function vehiclesHTML(date){
  const vs = S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo'), onN = vs.filter(v => !vehOff(date, v.id) && !vehBlocked(date, v.id)).length;
  return `<details class="card card-pad sect" data-sect="veh" ${UI.sect.veh ? 'open' : ''}><summary><h3>Vozila na voljo</h3><span class="chip mono">${onN}/${vs.length}</span></summary><div class="stack" style="gap:10px;margin-top:10px">
    ${S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo').map(v => {
      const b = vehBlocked(date, v.id), off = vehOff(date, v.id);
      return `<div class="veh-item ${b || off ? 'off' : ''}"><label><input type="checkbox" data-act="vehToggle" data-id="${v.id}" ${!off && !b ? 'checked' : ''} ${b ? 'disabled' : ''}><span><span class="vn">${esc(v.name)}</span><br><span class="hint">${esc(VEH_VRSTE[v.vrsta] || '')} · ${esc(capText(v))}${v.fn === 'dializa' ? ' · primarno dializa' : ''}</span></span></label>${b ? `<span class="chip bad">${esc(b.tip)}</span>` : (v.ns === 'NN' ? '<span class="chip">NN</span>' : '')}</div>`;
    }).join('') || '<div class="hint">Vozila dodaš v Nastavitve → Vozila.</div>'}
  </div></details>`;
}
/* ---------- Cestni podatki, ETA in pot na zemljevidu ---------- */
const legKm = l => ((l.est || l.wait) ? '~' : '') + l.km.toFixed(1) + ' km';
const tripKey = (c, t) => c.id + '|' + t.kind + '|' + t.rides.map(r => r.id).sort().join(',');
const etaTone = sl => sl < 0 ? 'bad' : sl < 5 ? 'warn' : 'ok';
function routeBar(plan){
  const i = ROUTE.info(), tot = plan.totals, off = S.settings.routing && S.settings.routing.on === false, nEst = tot.estLegs + tot.waitLegs;
  let tone = 'ok', head, text, retry = false;
  const host = (() => { try { return new URL(i.url || i.urls[0]).host; } catch(e){ return ''; } })();
  if (!i.configured){ tone = 'warn'; head = 'Cestni podatki: ni nastavljeno'; text = `Razdalje so ocenjene (zračna razdalja × ${S.settings.road}). Cestni strežnik se nastavi v config.js (routing.url).`; }
  else if (off){ tone = 'warn'; head = 'Cestni podatki: izklopljeni'; text = `Razdalje so ocenjene (zračna razdalja × ${S.settings.road}). Vklopi v Nastavitve → Izračun.`; }
  else if (i.status === 'error' || i.cooling > 0){ tone = 'warn'; head = 'Cestni podatki: ni povezave'; text = `Cestni strežnik ni dosegljiv${i.err ? ' (' + (/failed to fetch|networkerror|load failed|aborted/i.test(i.err) ? 'brez povezave s strežnikom' : esc(i.err)) + ')' : ''}. Za relacije brez podatkov velja ocena (zračna razdalja × ${S.settings.road}); ponovni poskus teče samodejno.`; retry = true; }
  else if (i.pending || i.busy || i.status === 'loading'){ tone = 'info'; head = 'Cestni podatki: nalaganje'; text = `Prenašam razdalje po cestah${i.pending ? ' (' + i.pending + ' relacij)' : ''}. Do takrat veljajo ocene, označene z ~.`; retry = true; }
  else if (nEst > 0){ tone = 'warn'; head = 'Cestni podatki: deloma'; text = `${nEst} relacij ni mogoče usmeriti po cesti (npr. neznan kraj), zato so ocenjene (~).`; }
  else if (tot.realLegs > 0){ head = 'Cestni podatki: v redu'; text = `Vse vožnje (${tot.realLegs} relacij) so izračunane po dejanskih cestah (OpenStreetMap${i.cached === 0 && i.shared ? ', vnaprej pripravljena datoteka razdalje.json' : host ? ', ' + esc(host) : ''}).`; }
  else { head = 'Cestni podatki: pripravljeni'; text = `Razdalje in časi se računajo po cestah (OpenStreetMap${host ? ', ' + esc(host) : ''}).`; }
  if (tone === 'ok') return '';
  return `<div class="routebar" role="status"><span class="chip ${tone}">${head}</span><span class="rt">${text}</span>${retry ? '<button type="button" class="btn sm" data-act="routeRetry">Poskusi znova</button>' : ''}</div>`;
}
const SUG_LABEL = { opt:'optimizacija', merge:'združeno', shift:'izmena', veh:'vozilo', bend:'pravila', late:'zamuda', road:'ceste' };
function suggestHTML(plan){
  const sg = (plan.suggestions || []).filter(x => x.k !== 'road'), e = plan.eff;   // »road« je že v vrstici cestnih podatkov
  let eff = '';
  if (e && e.tried > 1 && !sg.some(x => x.k === 'opt')){
    const sv = e.saved, parts = [];
    if (sv.unassigned > 0) parts.push(`${sv.unassigned} več razporejenih prevozov`);
    if (sv.late > 0) parts.push(`${sv.late} manj zamud`);
    if (sv.km > 0.5) parts.push(`${sv.km.toFixed(0)} km manj`);
    if (sv.min > 1) parts.push(`${fmtDur(sv.min)} manj vožnje`);
    eff = e.variant !== 'osnovni' && parts.length ? `Optimizator je preizkusil ${e.tried} različic razporeda in izbral »${esc(e.variant)}«: ${parts.join(', ')}.` : `Razpored je že najboljši med ${e.tried} preizkušenimi različicami.`;
  }
  if (!sg.length && !eff) return '';
  return `<section class="card card-pad stack" style="gap:8px"><div class="card-head" style="margin:0"><h3>Predlogi za učinkovitejši razpored</h3></div>
    ${eff ? `<p class="hint" style="margin:0">${eff}</p>` : ''}
    ${sg.length ? `<ul class="sugg">${sg.map(x => `<li><span class="chip ${x.tone || ''}">${esc(SUG_LABEL[x.k] || 'predlog')}</span><span>${esc(x.text)}</span></li>`).join('')}</ul>` : ''}</section>`;
}
function tripMapHTML(c, t){
  const st = UI.maps[tripKey(c, t)]; if (!st) return '';
  const pts = tripWaypoints(t), g = ROUTE.pathCached(pts);
  if (st === 'load' && !g) return '<div class="rmap"><div class="rleg">Nalaganje poti …</div></div>';
  const stops = [t.from, ...t.stopsAbs.map(x => x.pt)].filter(p => p && isFinite(p.lat) && isFinite(p.lon));
  const all = (g && g.coords.length ? g.coords : []).concat(stops.map(p => [p.lon, p.lat]));
  if (all.length < 2) return '<div class="rmap"><div class="rleg">Za to vožnjo ni koordinat za prikaz.</div></div>';
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  all.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  const W = 640, H = 320, pad = 30, kx = Math.cos((y0 + y1) / 2 * Math.PI / 180);
  const sc = Math.min((W - 2 * pad) / (((x1 - x0) * kx) || 1e-6), (H - 2 * pad) / ((y1 - y0) || 1e-6));
  const ox = (W - (x1 - x0) * kx * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
  const X = lon => (ox + (lon - x0) * kx * sc).toFixed(1), Y = lat => (H - oy - (lat - y0) * sc).toFixed(1);
  const line = g && g.coords.length > 1 ? g.coords : stops.map(p => [p.lon, p.lat]);
  const cl = [];   // postanki na isti točki (npr. več bolnišnic v istem mestu) se združijo v eno oznako s skupnimi številkami
  stops.forEach((p, i) => {
    const x = +X(p.lon), y = +Y(p.lat), s = i ? t.stopsAbs[i - 1] : null;
    let c = cl.find(q => Math.hypot(q.x - x, q.y - y) < 11);
    if (!c){ c = { x, y, nums:[], base:!i, drop:false }; cl.push(c); }
    if (i) c.nums.push(i); if (s && s.type === 'do') c.drop = true;
  });
  const marks = cl.map(c => (c.base ? `<rect class="rp base" x="${c.x - 6}" y="${c.y - 6}" width="12" height="12" rx="2"/>` : '') + (c.nums.length ? `<circle class="rp ${c.drop ? 'do' : ''}" cx="${c.x}" cy="${c.y}" r="6.5"/><text x="${c.x + 9}" y="${c.y - 7}">${c.nums.join(',')}</text>` : '')).join('');
  const legend = g ? `Pot po cestah: ${g.km.toFixed(1)} km, ${fmtDur(g.min)} (brez postankov).` : (st && String(st).startsWith('err') ? 'Cestna geometrija ni na voljo (' + esc(String(st).slice(4)) + '); črtkana črta je samo orientacija med točkami, ne razdalja.' : 'Cestna geometrija ni na voljo; črtkana črta je samo orientacija med točkami, ne razdalja.');
  return `<div class="rmap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pot vožnje: ${stops.length - 1} postankov"><polyline class="rl ${g ? '' : 'est'}" points="${line.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}"/>${marks}</svg>
    <div class="rleg">${legend} Kvadrat = postaja ali prejšnji cilj, polni krog = izstop, številke = vrstni red postankov. Podatki cest: © prispevajoči OpenStreetMap.</div></div>`;
}
function stopRow(c, t, s, L, prev){
  const ppl = (s.people || []).filter(Boolean);
  const personRow = (t.kind === 'to' && s.type === 'pu') || (t.kind === 'from' && s.type === 'do');
  const pt = s.pt, label = pt.label || (s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : ''), ap = t.ev && (t.ev.nEst || t.ev.nWait) ? '~' : '';
  const inf = r => (t.info && t.info[r.id]) || {};
  const etaOf = r => {
    const o = inf(r), out = [];
    if (t.kind === 'to'){
      if (o.dropT != null) out.push(`<span class="eta">na cilju ${ap}${fmtT(o.dropT)}</span>`);
      if (o.slack != null) out.push(`<span class="eta ${etaTone(o.slack)}">${o.slack < 0 ? 'zamuda ' + (-o.slack) : 'rezerva ' + o.slack} min</span>`);
    } else {
      if (o.pickT != null) out.push(`<span class="eta">pobran ${ap}${fmtT(o.pickT)}</span>`);
      if (o.wait > 0) out.push(`<span class="eta ${o.wait > S.settings.waitTol ? 'warn' : ''}">čaka ${o.wait} min</span>`);
    }
    return out.join(' ');
  };
  const firstRet = !!(s.ret && prev && !prev.ret);
  const base = firstRet ? (t.waitMin > 0 ? `<li class="legline wait"><span></span><i></i><span>čaka na pregled ~${fmtDur(t.waitMin)}</span></li>` : '')
    : prev ? `<li class="legline"><span></span><i></i><span>${Math.max(1, Math.round(s.t - prev.t - stopDwell(prev)))} min · ${legKm(L(prev.pt, pt))}</span></li>` : '';
  let body;
  if (s.ret){   // vrnitev po pregledu: pobere nazaj na ustanovi, izstop doma
    const who = ppl.map(r => `<span class="pdot ${pcClass(r.pid)}"></span>${esc(r.name)} <span class="chip mono">št. ${r.nr}</span>`).join('<br>');
    body = s.type === 'pu'
      ? `<div><div class="who">Pobere nazaj: ${esc(label || (t.anchor && t.anchor.label) || 'ustanova')}</div><div class="addr">${who}</div></div><div></div>`
      : `<div><div class="who">Izstop doma</div><div class="addr">${ppl.map(r => `${esc(r.name)} · ${esc(r.fromTxt)}`).join('<br>')}</div></div><div></div>`;
  } else if (personRow && ppl.length){
    const r = ppl[0];
    const rr = rideById(UI.dDate, r.id), rs = rr ? rr.r : null;
    body = `<div><div class="who"><span class="pdot ${pcClass(r.pid)}"></span>${esc(r.name)} <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span> <span class="chip mono">št. ${r.nr}</span>${rs && rs.status && rs.status !== 'nova' ? ' ' + stChip(rs.status) : ''}${rs && rs.exc ? ' <span class="chip accent">izjema</span>' : ''}</div>
      <div class="addr">${esc(r.kind === 'to' ? r.fromTxt : r.toTxt)}${r.phone ? ` · <span class="mono">${esc(r.phone)}</span>` : ''}${r.timeTxt ? ` · ura ${esc(r.timeTxt)}` : ''}${t.kind === 'to' && r.toTxt ? ` · cilj ${esc(r.toTxt)}` : ''}</div>
      <div class="addr">${etaOf(r)}</div></div>
      <div class="pin"><select data-act="pin" data-ride="${r.id}" aria-label="Prestavi prevoz ${r.nr} na vozilo"><option value="">Samodejno</option>${CREWS_PIN.map(v => `<option value="${v.id}" ${r.pin===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>`;
  } else {
    const who = ppl.map(r => `${esc(r.name)} <span class="chip mono">št. ${r.nr}</span>${t.kind === 'to' && s.type === 'do' && r.timeTxt ? ` <span class="eta">preiskava ${esc(r.timeTxt)}</span> ${etaOf(r)}` : (t.kind === 'from' && s.type === 'pu' && r.timeTxt ? ` <span class="eta">ura ${esc(r.timeTxt)}</span> ${etaOf(r)}` : '')}`).join('<br>');
    body = `<div><div class="who">${s.type === 'pu' ? 'Pobere' : 'Izstop'}: ${esc(label)}</div><div class="addr">${who}</div></div><div></div>`;
  }
  return `${base}<li class="stop"><time>${ap}${fmtT(s.t)}</time><span class="dot ${s.type === 'do' ? 'do' : ''}"></span>${body}</li>`;
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
      <td>${c.trips.length ? `<b class="mono">Štart ${fmtT(c.firstDepart)}</b> iz postaje<div class="hint">${c.trips.map(t => `${fmtT(t.depart)} → ${esc(tripTitle(t) + (t.kind === 'to' ? '' : ' (odvoz)'))}`).join(' · ')}</div>${c.trips.some(t=>t.late>0) ? '<div><span class="chip bad">zamuda</span></div>' : ''}${c.overtime > 0 ? `<div><span class="chip accent">nadure ~${c.overtime} min</span></div>` : ''}` : '<span class="dim">Brez prevozov</span>'}</td></tr>`).join('');
  const blockedRows = blocked.map(v => { const b = vehBlocked(date, v.id); return `<tr><td><b>${esc(v.name)}</b></td><td colspan="2"><span class="chip bad">${esc(b.tip)}</span></td><td class="muted">${esc(b.note || 'Vozilo ni na voljo')}</td></tr>`; }).join('');
  const unRows = plan.unassigned.map(u => `<span class="chip bad mono" title="${esc(u.reason)}">${u.ride.nr}</span>`).join(' ');
  const cards = plan.crews.filter(c => c.trips.length).map(c => `<section class="card crewcard">
      <header><div><h3>${esc(c.vehicle.name)} · ${esc(crewLabel(c))}</h3><div class="timeline-note">Štart iz postaje ${fmtT(c.firstDepart)} · konec ob ${fmtT(c.trips[c.trips.length-1].end)}</div></div>
      <div class="meta"><span class="chip mono">${c.rideNrs.length} prevozov</span><span class="chip mono">${c.km.toFixed(0)} km</span><span class="chip mono">${fmtDur(c.busy)}</span></div></header>
      ${c.trips.map((t, ti) => `<div class="trip"><div class="trip-head">
          <span class="chip ${t.kind === 'from' ? 'ok' : 'info'}">${t.kind === 'from' ? 'ODVOZ' : 'TJA'}</span><b>${t.kind === 'to' ? esc(tripTitle(t) || 'cilj') : 'Iz: ' + esc(tripTitle(t) || 'ustanova')}</b>
          <span class="chip mono">${t.rides.length} pac.</span>${t.ev.ret ? `<span class="chip info" title="Reševalec po izstopu počaka na pregled in pacienta odpelje nazaj">počaka ~${fmtDur(t.waitMin || 0)}</span>` : ''}<span class="chip mono" title="${t.ev.nEst || t.ev.nWait ? 'Del poti je ocenjen (brez cestnih podatkov)' : 'Izračunano po cestah'}">${t.ev.nEst || t.ev.nWait ? '~' : ''}${t.ev.km.toFixed(0)} km</span><span class="chip mono">${t.ev.nEst || t.ev.nWait ? '~' : ''}${fmtDur(t.ev.dur)}</span>${new Set((t.dests || []).map(p => p.key)).size > 1 ? `<span class="chip info" title="Pacienti z blizu skupaj ležečimi cilji so v eni vožnji">${new Set(t.dests.map(p => p.key)).size} cilji</span>` : ''}
          ${t.late > 0 ? `<span class="chip bad">${t.kind === 'from' ? 'pacient čaka ~' + t.wait + ' min' : 'zamuda ~' + t.late + ' min'}</span>` : (t.kind === 'to' && t.slack != null ? `<span class="chip ok">rezerva ${t.slack} min</span>` : '')}
          ${t.sbReturn && c.team === 'NN' ? '<span class="chip">NN ekipa</span>' : ''}<button type="button" class="btn sm" data-act="tripMap" data-trip="${esc(tripKey(c, t))}" aria-expanded="${UI.maps[tripKey(c, t)] ? 'true' : 'false'}" style="margin-left:auto">${UI.maps[tripKey(c, t)] ? 'Skrij pot' : 'Pot'}</button></div>
        ${tripMapHTML(c, t)}
        <ul class="stops">
          <li class="stop"><time>${fmtT(t.depart)}</time><span class="dot base"></span><div><div class="who">Štart: ${ti === 0 ? 'RP Brežice (ZD)' : 'prejšnji cilj'}</div><div class="addr">Vožnja do prvega postanka ${legKm(L(t.from, t.stopsAbs[0].pt))}</div></div><div></div></li>
          ${t.stopsAbs.map((s, i) => stopRow(c, t, s, L, i ? t.stopsAbs[i-1] : null)).join('')}
        </ul></div>`).join('')}
    </section>`).join('');
  const closeList = (date <= tom) ? filledRides(date).map(({ r, nr }) => `<div class="duty-item" style="grid-template-columns:auto minmax(0,1fr) minmax(0,1.1fr);align-items:center" data-ride="${r.id}" data-date="${date}">
        <span class="nr">${nr}</span><div class="dn" style="min-width:0"><div style="overflow:hidden;text-overflow:ellipsis">${esc(r.name || '(brez imena)')} <span class="mono dim">${esc(r.time)}</span></div><div class="hint" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.from)} → ${esc(r.to)}</div></div>
        <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="row" style="gap:6px;flex-wrap:nowrap;font-weight:600"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz, prevoz ${nr}" style="${r.done ? '' : 'visibility:hidden'}"></div></div>`).join('') : '';
  refreshStaffList(date);
  const kms = kmSum(date);
  $('#view').innerHTML = `
    <div class="row">
      <div class="seg inline" role="group" aria-label="Izbira dneva"><button type="button" data-act="dDate" data-date="${today}" aria-pressed="${date === today}">Danes · ${fmtShort(today)}</button><button type="button" data-act="dDate" data-date="${tom}" aria-pressed="${date === tom}">Jutri · ${fmtShort(tom)}</button></div>
      <input type="date" id="dispPick" value="${date}" style="width:auto" aria-label="Drug datum">
      <span class="chip ${plan.standby ? 'info' : ''}">${plan.standby ? 'Pripravljenost (vikend/praznik)' : 'Delovni dan'}</span>
      ${diaTermsFor(date).map(t => `<span class="chip">${IC.kidney.replace('<svg', '<svg width="12" height="12"')} dializa ${t === 'dop' ? 'dopoldne' : 'popoldne'}</span>`).join('')}
    </div>
    <div class="dispatch">
      <div class="stack">
        ${dutyHTML(date)}${vehiclesHTML(date)}
        <details class="card card-pad sect" data-sect="note" ${UI.sect.note || S.dayNote[date] ? 'open' : ''}><summary><h3>Opomba dneva</h3>${S.dayNote[date] ? '<span class="chip">vpisana</span>' : ''}</summary><textarea id="dayNote" style="margin-top:10px" placeholder="npr. ob 9:00 sestanek, cesta zaprta, pacient potrebuje spremljevalca">${esc(S.dayNote[date] || '')}</textarea></details>
      </div>
      <div class="stack">
        ${rulesBar(date, plan)}${publishBar(date, plan)}${routeBar(plan)}
        <div class="stats"><div class="stat"><b>${tot.rides}</b><span>prevozov za razporeditev</span></div>${kms.any ? `<div class="stat" title="Vsota razdalj OD → DO po prevozih (v knjigo)"><b>${kms.all ? '' : '~'}${KM.fmtKm(kms.t)}</b><span>km prevozov${kms.all ? ' (natančno)' : ' (deloma ocena)'}</span></div>` : ''}<div class="stat"><b>${tot.vehicles}/${plan.crews.length}</b><span>vozil v uporabi</span></div><div class="stat"><b>${tot.km.toFixed(0)}</b><span>km vožnje ekip (${!ROUTE.enabled() ? 'ocena' : tot.estLegs + tot.waitLegs ? 'deloma ocena' : 'po cestah'})</span></div><div class="stat"><b style="color:${tot.late ? 'var(--bad)' : 'var(--ok)'}">${tot.late}</b><span>prevozov z zamudo</span></div></div>
        ${plan.warnings.length ? `<details class="warnbox" ${plan.warnings.some(w => w.level === 'bad' || w.level === 'bend') ? 'open' : ''}><summary>${plan.warnings.length} opozoril in prilagoditev</summary><ul class="warnlist">${plan.warnings.map(w => `<li class="w-${w.level}">${w.level === 'bend' ? '<span class="chip accent">prilagojeno</span> ' : ''}${esc(w.text)}</li>`).join('')}</ul></details>` : ''}
        <div class="card card-pad">
          <div class="card-head"><h3>Razpored za ${fmtShort(date)}</h3><div class="row"><button type="button" class="btn sm" data-act="copyPlan">${IC.copy} Kopiraj kot besedilo</button></div></div>
          ${plan.crews.length || blocked.length ? `<div class="tablewrap"><table><thead><tr><th>Vozilo</th><th>Voznik</th><th>Prevozi (št. v knjigi)</th><th>Posebnosti · ure štarta</th></tr></thead><tbody>${rows}${blockedRows}</tbody></table></div>`
            : '<div class="empty-state">Vpiši zaposlene na delu in označi vozila. Razpored se sestavi sam.</div>'}
          ${unRows ? `<p style="margin:10px 0 0"><b>Nerazporejeni prevozi:</b> ${unRows}</p>` : ''}
          <details class="hintdet" style="margin-top:10px"><summary>Kako se računa</summary><p class="hint" style="margin:6px 0 0">${ROUTE.enabled() ? 'Razdalje in časi vožnje so izračunani po dejanskih cestah (OpenStreetMap, brez prometnih zastojev' + (+S.settings.routing.factor !== 1 ? ', čas × ' + S.settings.routing.factor : '') + '); relacije brez cestnih podatkov so označene z ~ in ocenjene kot zračna razdalja × ' + S.settings.road + ' pri omejitvah ' : 'Časi so ocena: zračna razdalja × ' + S.settings.road + ', omejitve '}${S.settings.lim.naselje}/${S.settings.lim.izven}/${S.settings.lim.hitra}/${S.settings.lim.avtocesta} km/h (naselje/izven/hitra/avtocesta), dejansko ${S.settings.eff} %. Pobiranje ${S.settings.pickMin} min, izstop ${S.settings.dropMin} min na pacienta (leže ${S.settings.pickLeze}/${S.settings.dropLeze}, utila ${S.settings.pickUtila}/${S.settings.dropUtila}), rezerva ${S.settings.buffer} min pred preiskavo. Pri pregledu s čakanjem reševalec po izstopu počaka in pacienta odpelje nazaj. Razpored se vpiše tudi v mesečno knjigo.</p></details>
        </div>
        ${suggestHTML(plan)}
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
function routingCard(){
  const ri = ROUTE.info(), R = S.settings.routing, tst = UI.routeTest, wm = UI.routeWarm;
  const kn = (label, path, val, step, unit = '') => `<label for="k-${path}">${label}${unit ? ' <span class="dim">(' + unit + ')</span>' : ''}</label>${field(path, val, { num:1, step, label }).replace('data-path', `id="k-${path}" data-path`)}`;
  const host = (() => { try { return new URL(ri.url || ri.urls[0]).host; } catch(e){ return ''; } })();
  const stTone = !ri.configured || !ri.on ? 'warn' : ri.status === 'ok' ? 'ok' : ri.status === 'error' ? 'bad' : 'info';
  const stTxt = !ri.configured ? 'ni nastavljeno' : !ri.on ? 'izklopljeno' : ri.status === 'ok' ? 'deluje' : ri.status === 'error' ? 'ni povezave' : ri.status === 'loading' ? 'nalaganje' : 'pripravljeno';
  const test = tst ? (tst.running ? '<span class="chip info">Preverjam …</span>' : `<div class="banner" style="${tst.ok ? '' : 'background:var(--warn-soft);color:var(--warn)'}"><span>${IC.info}</span><div><b>${tst.ok ? 'Povezava deluje' : 'Preizkus ni uspel'}</b>${tst.url ? ' · ' + esc(tst.url) : ''}<br>${esc(tst.msg)}${tst.km ? ` Brežice → UKC Ljubljana: ${tst.km.toFixed(1)} km, ${fmtDur(tst.min)} (${tst.ms} ms).` : ''}</div></div>`) : '';
  const warm = wm ? (wm.running ? `<span class="chip info" id="routeProg">Prenos … ${wm.done}/${wm.total || '?'}</span>` : `<span class="chip ${wm.err ? 'bad' : 'ok'}">${esc(wm.msg || '')}</span>`) : '';
  return `<div class="card card-pad stack" style="gap:12px"><div class="card-head" style="margin:0"><h3>Cestno usmerjanje (OpenStreetMap)</h3><span class="chip ${stTone}">${stTxt}</span></div>
    <div class="banner"><span>${IC.info}</span><div>Razdalje in časi vožnje se računajo po dejanskem cestnem omrežju (OSRM nad podatki OpenStreetMap), tudi za Ljubljano, Novo mesto in druge kraje izven občine. Strežniku se pošljejo <b>samo koordinate</b> (brez imen, naslovov in podatkov o pacientih), brez piškotkov in brez povezave z vašo prijavo. Javni strežnik je brezplačen in brez jamstva; za redno delo z resničnimi pacienti uporabite lasten strežnik ali datoteko razdalje.json (glej NAVODILA.md).</div></div>
    <div class="stack" style="gap:8px">
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="settings.routing.on" data-bool="1" ${R.on !== false ? 'checked' : ''}> Uporabi dejanske ceste (če je izklopljeno ali strežnik ni dosegljiv: ocena po zračni razdalji)</label>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="settings.optimize" data-bool="1" ${S.settings.optimize !== false ? 'checked' : ''}> Samodejno poišči učinkovitejši razpored (združevanje bližnjih ciljev, primernejša vozila)</label></div>
    <div class="kv">${kn('Popravek časa vožnje (1 = brez popravka; npr. 1.15 za promet)', 'settings.routing.factor', R.factor, 0.05)}${kn('Združevanje ciljev: največ vožnje med cilji', 'settings.destMin', S.settings.destMin, 1, 'min')}${kn('Največ različnih ciljev v eni vožnji', 'settings.maxDests', S.settings.maxDests, 1)}${kn('Opozori, če pacient na cilju čaka več kot', 'settings.waitMax', S.settings.waitMax, 5, 'min')}</div>
    <div class="row"><button type="button" class="btn sm" data-act="routeTest">Preveri cestne podatke</button><button type="button" class="btn sm" data-act="routeWarm" ${ri.on && ri.configured ? '' : 'disabled'}>Predpripravi vse relacije</button><button type="button" class="btn sm" data-act="routeExport">Prenesi razdalje.json</button><button type="button" class="btn sm danger" data-act="routeClear">Izbriši predpomnilnik poti</button>${warm}</div>
    ${test}
    <p class="hint" style="margin:0">Predpomnilnik: ${ri.cached} relacij${ri.shared ? ', iz razdalje.json: ' + ri.shared + (ri.sharedBuilt ? ' (' + esc(String(ri.sharedBuilt).slice(0, 10)) + ')' : '') : ''}${ri.pending ? ', čaka na prenos: ' + ri.pending : ''}${host ? ' · strežnik: ' + esc(host) : ''}. V predpomnilnik gredo samo splošne točke (naselja, ustanove, mesta), nikoli hišni naslovi pacientov. Točnost: naselja so predstavljena s središčno točko, promet v živo ni upoštevan.</p></div>`;
}
/* ---------- Nastavitve: Google, dializa, klinike ---------- */
function googleCard(){
  const gi = GOOGLE.info(), G = S.settings.google || {}, t = UI.gTest;
  const cfgKey = !!(((window.KP_CONFIG && window.KP_CONFIG.google && window.KP_CONFIG.google.key) || '').trim()), local = !!store.get('kp.gkey');
  const tone = !gi.configured || !gi.on ? 'warn' : gi.status === 'error' ? 'bad' : gi.status === 'ok' ? 'ok' : 'info';
  const txt = !gi.configured ? 'ključ ni vnesen' : !gi.on ? 'izklopljeno' : gi.status === 'error' ? 'napaka' : gi.status === 'ok' ? 'deluje' : 'pripravljeno';
  const test = t ? (t.running ? '<span class="chip info">Preverjam …</span>' : `<div class="banner ${t.ok ? '' : 'warn'}"><span>${IC.info}</span><div><b>${t.ok ? 'Google deluje' : 'Preizkus ni uspel'}</b>${t.km ? ` · SB Brežice → UKC Ljubljana: ${KM.fmtKm(t.km)} km, ${Math.round(t.min)} min (${t.ms} ms)` : ''}<br>${esc(t.msg)}</div></div>`) : '';
  const chk = (path, on, label) => `<label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="${path}" data-bool="1" ${on ? 'checked' : ''}> ${label}</label>`;
  return `<div class="card card-pad stack" style="gap:12px"><div class="card-head" style="margin:0"><h3>Natančna kilometrina (Google Zemljevidi)</h3><span class="chip ${tone}">${txt}</span></div>
    <div class="banner"><span>${IC.info}</span><div>Kilometrina vsakega prevoza se izračuna z Googlom po najboljši cestni poti <b>OD → DO</b>, kot v Google Zemljevidih. Google dobi <b>samo besedilo naslova OD in DO</b> (brez imena, telefona in naloga). Rezultat se zapiše v knjigo z oznako vira. Naslovi pacientov so osebni podatki: pred uporabo se posvetuj s pooblaščencem za varstvo podatkov.</div></div>
    <div class="stack" style="gap:8px">
      ${chk('settings.google.on', G.on !== false, 'Uporabi Google za kilometrino')}
      ${chk('settings.google.auto', G.auto !== false, 'Izračunaj samodejno, ko vpišem OD in DO (in ob odprtju dneva od včeraj do 14 dni naprej)')}
      ${chk('settings.google.traffic', !!G.traffic, 'Upoštevaj promet pri času vožnje (dražja zahteva)')}</div>
    <div class="field full"><label for="gkey">Ključ API ${local ? '<span class="chip ok">shranjen na tej napravi</span>' : cfgKey ? '<span class="chip ok">v config.js</span>' : ''}</label>
      <div class="row" style="flex-wrap:nowrap"><input id="gkey" type="password" autocomplete="off" spellcheck="false" placeholder="${local ? 'vpiši novega, da zamenjaš' : 'AIza…'}"><button type="button" class="btn sm" data-act="gkeySave">Shrani</button>${local ? '<button type="button" class="btn sm danger" data-act="gkeyClear">Odstrani</button>' : ''}</div>
      <span class="hint">Ključ vpisan tu velja samo za to napravo. Za vse naprave ga vpiši v config.js (google.key); v obeh primerih ga omeji na naslov te strani in na Routes API.</span></div>
    <div class="row"><button type="button" class="btn sm" data-act="gTest" ${gi.configured ? '' : 'disabled'}>Preveri Google</button><span class="hint">Poskusni izračun: SB Brežice → UKC Ljubljana (en zahtevek).</span></div>
    ${test}
    <p class="hint" style="margin:0">V tej seji: ${gi.calls} zahtevkov, ${gi.errors} napak, ${gi.cached} poti v pomnilniku${gi.queued ? ', v čakalni vrsti ' + gi.queued : ''}.</p>
    <details class="hintdet"><summary>Kako dobiš ključ in koliko stane</summary><p class="hint" style="margin:6px 0 0">1) V Google Cloud Console ustvari projekt in vklopi obračun. 2) Vklopi »Routes API«. 3) Ustvari ključ API in ga omeji: aplikacije → spletna mesta (HTTP referrer) z naslovom te strani (npr. https://uporabnik.github.io/*), API-ji → samo Routes API. 4) Vnesi ga zgoraj ali v config.js. Google zaračunava po zahtevku; cena in brezplačna kvota se spreminjata, zato preveri trenutni cenik za Routes API (Compute Routes). Aplikacija uporablja Google samo za natančen km vpisanih prevozov, razpored pa računa po cestah OpenStreetMap, da je zahtevkov malo (za vsak prevoz eden, pri čakanju na pregled dva). Poti se ne shranjujejo v trajni predpomnilnik; Googlova pravila o shranjevanju podatkov preveri pred uvedbo.</p></details></div>`;
}
function diaTab(){
  const adm = isAdmin(), T = S.settings.diaT, byName = (a, b) => a.name.localeCompare(b.name, 'sl');
  const dp = S.patients.filter(p => p.dt).sort(byName), free = S.patients.filter(p => !p.dt).sort(byName);
  const tm = (t, k) => adm ? field(`settings.diaT.${t}.${k}`, T[t][k], { time:1, label:`${DIA_TERMS[t]} ${k === 'start' ? 'začetek' : 'konec'}` }) : `<b class="mono">${esc(T[t][k])}</b>`;
  const terms = Object.keys(DIA_TERMS).map(t => `<tr><td><b>${DIA_TERMS[t]} dializa</b></td><td>${tm(t, 'start')}</td><td>${tm(t, 'end')}</td></tr>`).join('');
  const rows = dp.map(p => `<tr data-pid="${p.id}"><td><button type="button" class="linkbtn" data-act="openPatient" data-id="${p.id}">${esc(p.name)}</button><div class="hint">${esc(p.addr || 'brez naslova')}</div></td>
    <td><div class="seg" role="group" aria-label="Termin dialize">${Object.keys(DIA_TERMS).map(t => `<button type="button" data-act="diaTerm" data-id="${p.id}" data-t="${t}" aria-pressed="${p.dt.t === t}">${DIA_TERMS[t]}</button>`).join('')}</div></td>
    <td><div class="row" style="gap:4px">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip toggle" data-act="diaDay" data-id="${p.id}" data-d="${d}" aria-pressed="${(p.dt.d || []).includes(d)}">${DOW_SHORT[d]}</button>`).join('')}</div></td>
    <td><button type="button" class="icon-btn" data-act="diaDel" data-id="${p.id}" aria-label="Odstrani ${esc(p.name)} iz dialize">${IC.x}</button></td></tr>`).join('');
  return `<div class="stack"><div class="card card-pad stack"><h3>Termina dialize</h3>
      <p class="muted" style="margin:0">Dializni bolniki imajo dopoldanski ali popoldanski termin. Prevoz tja je ob začetku termina, prevoz nazaj ob koncu. Posadka, ki pelje na dializo, lahko po koncu dialize prevaža tudi sede paciente: razpored jim jih doda v prostem času, če to ne ovira dialize.</p>
      <div class="tablewrap"><table class="edtable"><thead><tr><th>Termin</th><th>Začetek</th><th>Konec</th></tr></thead><tbody>${terms}</tbody></table></div>
      ${adm ? '' : '<p class="hint" style="margin:0">Ure terminov spreminja skrbnik.</p>'}</div>
    <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Dializni pacienti</h3><span class="chip mono">${dp.length}</span></div>
      <form class="row" data-form="diaAdd" style="flex-wrap:nowrap"><select name="pid" aria-label="Pacient" required><option value="">Izberi pacienta iz baze …</option>${free.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
        <select name="t" style="width:auto" aria-label="Termin">${Object.keys(DIA_TERMS).map(t => `<option value="${t}">${DIA_TERMS[t]}</option>`).join('')}</select><button class="btn primary" type="submit">Dodaj</button></form>
      ${dp.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th>Pacient</th><th>Termin</th><th>Dnevi</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-state">Še ni dializnih pacientov. Izberi pacienta iz baze in termin.</div>'}
      <p class="hint" style="margin:0">Dnevni prevozi tja in nazaj se vpišejo v knjigo z gumbom »Naloži dializne paciente« (v meniju Več pri dnevu). Pacient mora biti v bazi pacientov, nalog pa se vodi tam.</p></div></div>`;
}
function placesTab(){
  const parents = [...POIS.filter(p => !p.home || /^SB |UKC|UKM|OI |URI/.test(p.n)).map(p => p.n), ...S.places.filter(p => !p.parent && p.n).map(p => p.n)];
  const pl = (i, k, v, o = {}) => `<input data-pl="${i}|${k}" type="${o.num ? 'number' : 'text'}" ${o.num ? 'min="0" step="5" inputmode="numeric"' : ''} value="${esc(v == null ? '' : v)}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} aria-label="${esc(o.label || k)}" autocomplete="off">`;
  const list = S.places.map((p, i) => ({ p, i })).sort((a, b) => (a.p.parent || a.p.n).localeCompare(b.p.parent || b.p.n, 'sl') || a.p.n.localeCompare(b.p.n, 'sl'));
  const rows = list.map(({ p, i }) => `<tr><td><select data-pl="${i}|parent" aria-label="Ustanova"><option value="">(samostojna ustanova)</option>${[...new Set(parents)].filter(n => n !== p.n).map(n => `<option value="${esc(n)}" ${p.parent === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></td>
    <td>${pl(i, 'n', p.n, { label:'Ime klinike ali ustanove', ph:'npr. Očesna klinika' })}</td><td>${pl(i, 'al', (p.al || []).join(', '), { label:'Druga imena', ph:'oči, ocesna' })}</td>
    <td>${pl(i, 'addr', p.addr, { label:'Naslov (za Google)', ph:'ulica, kraj' })}</td>
    <td class="coord">${pl(i, 'stay', p.stay, { num:1, label:'Čakanje na pregled v minutah', ph:'min' })}</td><td class="coord">${pl(i, 'extra', p.extra, { num:1, label:'Pot do ambulante v minutah', ph:'min' })}</td>
    <td><details class="menu"><summary class="btn sm ghost">Točka</summary><div class="menupop"><label class="mini">Širina (lat)${pl(i, 'lat', p.lat, { label:'Širina' })}</label><label class="mini">Dolžina (lon)${pl(i, 'lon', p.lon, { label:'Dolžina' })}</label><span class="hint">Prazno = točka ustanove.</span></div></details></td>
    <td><button type="button" class="icon-btn" data-act="delPlace" data-i="${i}" aria-label="Izbriši ${esc(p.n)}">${IC.x}</button></td></tr>`).join('');
  return `<div class="stack"><div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Klinike, ambulante in druge ustanove</h3><div class="row" style="gap:6px"><button type="button" class="btn sm primary" data-act="addPlace" data-k="clinic">${IC.plus} Dodaj kliniko</button><button type="button" class="btn sm" data-act="addPlace" data-k="inst">${IC.plus} Dodaj ustanovo</button></div></div>
      <div class="banner"><span>${IC.info}</span><div>Vpiši »UKC Ljubljana – Očesna klinika« ali samo »očesna klinika« in aplikacija ve, kam voziti, kako dolgo traja pregled in koliko hoje je od vhoda do ambulante. <b>Čakanje na pregled</b>: če pacient potrebuje pregled, reševalec počaka in ga odpelje nazaj; razpored to upošteva (prevoz nazaj se ne vpisuje posebej). <b>Naslov</b> se uporabi za natančen izračun kilometrov z Googlom: začetni naslovi so predlogi, preveri jih.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th>Ustanova</th><th>Klinika / ambulanta</th><th>Druga imena</th><th>Naslov</th><th>Pregled (min)</th><th>Pot do amb. (min)</th><th></th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="muted">Ni vpisov.</td></tr>'}</tbody></table></div>
      <p class="hint" style="margin:0">Samostojna ustanova (npr. zasebna ordinacija ali zdravilišče) potrebuje naslov, po možnosti tudi točko (lat, lon); brez točke se za razpored uporabi središče Brežic, km pa vseeno izračuna Google po naslovu.</p></div></div>`;
}

const field = (path, val, opts={}) => `<input data-path="${path}" ${opts.num ? 'type="number" data-num="1" step="' + (opts.step || 1) + '"' : (opts.time ? 'type="time"' : 'type="text"')} value="${esc(val)}" ${opts.sug ? 'data-suggest="from"' : ''} ${opts.ph ? 'placeholder="' + esc(opts.ph) + '"' : ''} ${opts.label ? 'aria-label="' + esc(opts.label) + '"' : ''}>`;
function settingsTabs(){
  const t = [['vozila','Vozila',true],['zaposleni','Zaposleni',false],['dializa','Dializa',false],['ustanove','Klinike',false],['planiranje','Izračun',true],['pravila','Pravila',true],['naslovi','Naslovi in naselja',true],['uporabniki','Uporabniki',true],['varnost','Varnost',true],['logotipi','Logotipi',true],['podatki','Podatki',false]];
  return `<div class="tabs" role="tablist">${t.filter(x => !x[2] || isAdmin()).map(x => `<button type="button" role="tab" data-act="setTab" data-k="${x[0]}" aria-selected="${UI.setTab === x[0]}">${x[1]}</button>`).join('')}</div>`;
}
const accountOptions = cur => {
  const list = BACKEND === 'firebase' ? USERS_REMOTE.map(u => ({ id:u.id, name:u.name, role:u.role })) : USERS.map(u => ({ id:u.id, name:u.name, role:u.role }));
  return `<option value="">brez računa</option>` + list.map(u => `<option value="${esc(u.id)}" ${cur === u.id ? 'selected' : ''}>${esc(u.name)} (${esc(ROLES[u.role] || u.role)})</option>`).join('');
};
function renderSettings(){
  if (!isAdmin() && ['vozila','pravila','planiranje','naslovi','uporabniki','varnost','logotipi'].includes(UI.setTab)) UI.setTab = 'dializa';
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
    body = diaTab();
  } else if (T === 'ustanove'){
    body = placesTab();
  } else if (T === 'planiranje'){
    const k = (label, path, step=1, unit='') => `<label for="k-${path}">${label}${unit ? ' <span class="dim">(' + unit + ')</span>' : ''}</label>${field(path, S.settings[path.split('.')[1]], { num:1, step, label })}`.replace('data-path', `id="k-${path}" data-path`);
    const kl = (label, key) => `<label for="k-lim-${key}">${label} <span class="dim">(km/h)</span></label>${field('settings.lim.' + key, S.settings.lim[key], { num:1, step:1, label }).replace('data-path', 'id="k-lim-' + key + '" data-path')}`;
    body = `<div class="stack">${googleCard()}${routingCard()}<details class="card card-pad sect" data-sect="param" ${UI.sect.param ? 'open' : ''}><summary><h3>Parametri izračuna: hitrosti, časi pobiranja, rezerve</h3></summary><div class="kv" style="margin-top:12px">
      ${kl('Omejitev v naselju','naselje')}${kl('Omejitev izven naselij','izven')}${kl('Omejitev na hitri cesti','hitra')}${kl('Omejitev na avtocesti','avtocesta')}${k('Dejanska hitrost glede na omejitev','settings.eff',1,'%')}${k('Faktor ceste (samo za ocene brez cestnih podatkov)','settings.road',0.05)}${k('Pobiranje sede pacienta','settings.pickMin',1,'min')}${k('Odpuščanje sede pacienta','settings.dropMin',1,'min')}${k('Pobiranje leže pacienta','settings.pickLeze',1,'min')}${k('Odpuščanje leže pacienta','settings.dropLeze',1,'min')}${k('Pobiranje pacienta na vozičku','settings.pickUtila',1,'min')}${k('Odpuščanje pacienta na vozičku','settings.dropUtila',1,'min')}${k('Privzet čas pregleda (čakanje)','settings.stayDef',5,'min')}${k('Privzeta pot od vhoda do ambulante','settings.extraDef',1,'min')}
      ${k('Rezerva pred preiskavo','settings.buffer',1,'min')}${k('Okno združevanja po uri','settings.window',5,'min')}${k('Največji dodaten čas za soprevoznika','settings.detour',5,'min')}${k('Najdaljša vožnja pacienta v vozilu','settings.maxRide',5,'min')}
      ${k('Čakanje pri odvozu brez zamude','settings.waitTol',1,'min')}${k('Število polj v knjigi na dan','settings.slots',1,'polj')}${k('Samodejna odjava','settings.idleMin',5,'min')}
      <label for="k-shift">Privzet začetek izmene</label><input id="k-shift" type="time" data-path="settings.shift" value="${esc(S.settings.shift)}"></div>
      <p class="hint" style="margin:0">Spremembe veljajo takoj. Razpored za današnji in jutrišnji dan se ponovno izračuna.</p></details></div>`;
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
