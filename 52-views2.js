/* =====================================================================
   ZASLONI 2: pacienti in nalogi, živo stanje, aplikacija posadke, pravila, uporabniki, varnost, logotipi, podatki, predogled
   ===================================================================== */
let USERS_REMOTE = [];
const RULE_MODES = { strogo:'Strogo', samodejno:'Samodejno', prosto:'Prosto' };
const RULE_DESC = {
  strogo:'Samo običajne vrednosti. Če se prevoz ne izide, ostane nerazporejen z razlogom. Ročna izjema na prevozu ali pripeto vozilo še vedno dovolita prilagoditev.',
  samodejno:'Najprej običajne vrednosti. Če se prevoz ne izide ali bi zamudil, se pravila prilagodijo samo toliko, kot je treba, in vsaka prilagoditev je izpisana.',
  prosto:'Prilagoditve so vedno dovoljene: največja kapaciteta vozila, daljše poti, krajša rezerva in nadure.'
};
const NALOG_RAZLOGI = ['Dializa', 'Obsevanje', 'Kemoterapija', 'Rehabilitacija', 'Specialistični pregled', 'Preiskava (RTG, CT, MR)', 'Sprejem v bolnišnico', 'Odpust iz bolnišnice', 'Kontrola po operaciji', 'Drugo'];

/* ---------- Opozorila o nalogih ---------- */
function alertsBanner(){
  const al = nalogAlerts(); if (!al.length) return '';
  const exp = al.filter(a => a.s.st === 'potekel').length, soon = al.length - exp;
  return `<div class="banner ${exp ? 'bad' : 'warn'}"><span>${IC.alert}</span><div><b>${al.length} ${al.length === 1 ? 'nalog' : 'nalogov'} za prevoz</b>: ${soon ? `kmalu poteče (${soon})` : ''}${soon && exp ? ', ' : ''}${exp ? `potekel (${exp})` : ''}. <button type="button" class="linkbtn" data-act="pfAlerts">Odpri seznam</button></div></div>`;
}

/* ---------- Dispečer: pravila za dan in objava ---------- */
function rulesBar(date, plan, wBend){
  const mode = dayMode(date), own = !!(S.dayRules[date] && S.dayRules[date].mode), nb = (wBend || []).length;
  return `<details class="card card-pad sect ctrl" data-sect="rules" ${UI.sect.rules ? 'open' : ''}><summary><h3>Pravila razporejanja</h3><span class="chip ${own ? 'accent' : ''}">${esc(RULE_MODES[mode])}${own ? ' · samo za ta dan' : ''}</span>${nb ? `<span class="chip accent">${nb} prilagoditev</span>` : ''}</summary>
    <div class="stack" style="gap:8px;margin-top:10px"><div class="ctrl-row"><span class="lbl">Način</span>
    <div class="seg" role="group" aria-label="Način pravil">${Object.entries(RULE_MODES).map(([k, l]) => `<button type="button" data-act="dayMode" data-k="${k}" aria-pressed="${mode === k}">${l}</button>`).join('')}</div>
    ${own ? '<button type="button" class="btn sm ghost" data-act="dayModeReset">Uporabi privzeto</button>' : '<span class="chip">privzeto</span>'}</div>
    <p class="hint" style="margin:0"><b>${esc(RULE_MODES[mode])}:</b> ${RULE_DESC[mode]}</p>
    ${nb ? `<ul class="warnlist">${wBend.map(w => `<li class="w-bend"><span class="chip accent">prilagojeno</span> ${esc(w.text)}</li>`).join('')}</ul>` : ''}</div></details>`;
}
function publishBar(date, plan){
  const st = publishState(date), pub = S.published[date];
  const duty = S.duty[date] || [], noAcc = duty.filter(d => { const s = staffOfDuty(d); return !(s && s.userId); });
  const chip = st === 'ok' ? `<span class="chip ok">objavljeno ob ${timeOf(pub.at)}</span>` : st === 'spremenjeno' ? '<span class="chip warn">spremenjeno po objavi</span>' : '<span class="chip">ni objavljeno</span>';
  return `<div class="card card-pad stack ctrl" style="gap:8px"><div class="ctrl-row"><span class="lbl">Posadke</span>${chip}${noAcc.length ? `<span class="chip warn" title="Brez računa ne vidijo razporeda v aplikaciji: ${esc(noAcc.map(d => d.name).join(', '))}. Poveži v Nastavitve → Zaposleni.">${noAcc.length} brez računa</span>` : ''}<span class="sp"></span>
    <button type="button" class="btn" data-nav="zivo" data-live="${date}">${IC.pulse} Živo stanje</button>
    <button type="button" class="btn primary" data-act="publish" data-date="${date}" ${plan.crews.some(c => c.trips.length) ? '' : 'disabled'} title="Vsaka posadka v aplikaciji vidi samo svoje prevoze in javlja korake. Časi se vpišejo v knjigo.">${IC.send} ${st === 'ni' ? 'Objavi razpored' : 'Objavi znova'}</button></div></div>`;
}

/* ---------- Pacienti ---------- */
function patientMatches(p){
  const q = norm(UI.pq);
  if (q && !norm([p.name, p.addr, p.phone].join(' ')).includes(q)) return false;
  const sm = patientNalogSummary(p);
  if (UI.pf === 'opozorila') return ['kmalu', 'potekel'].includes(sm.st) && !!nalogAlerts().find(a => a.p.id === p.id);
  if (UI.pf === 'dializa') return !!p.dt;
  if (UI.pf === 'brez') return !(p.naloge || []).length || sm.st === 'brez';
  return true;
}
function nalogCardHTML(p, n){
  const s = nalogState(n), miss = missingNalog(n), open = UI.nid === n.id;
  const head = `<div class="ncard-head"><span class="chip nt nt-${n.vrsta}">${esc(NALOG_VRSTE[n.vrsta].l)}</span><b class="mono">${esc(n.stevilka || 'brez številke')}</b>${nalogChip(n)}${miss.length ? `<span class="chip warn" title="Manjka: ${esc(miss.join(', '))}">nepopoln</span>` : ''}</div>`;
  const sum = `<div class="hint ncard-sum">${esc(n.od || '–')} → ${esc(n.do || '–')} · ${esc(MODES[n.mode] || n.mode)} · ${fmtDMY(n.veljaOd)} – ${fmtDMY(n.veljaDo)}${n.razlog ? ' · ' + esc(n.razlog) : ''}</div>`;
  const acts = `<div class="row" style="gap:6px">
    <button type="button" class="btn sm" data-act="editNalog" data-id="${n.id}">${open ? 'Zapri' : 'Uredi'}</button>
    <button type="button" class="btn sm" data-act="previewNalog" data-id="${n.id}" ${miss.length ? 'disabled title="Najprej izpolni vsa polja"' : ''}>${IC.eye} Predogled</button>
    <button type="button" class="btn sm" data-act="renewNalog" data-id="${n.id}">Podaljšaj</button>
    ${n.vrsta === 'enkratna' ? `<button type="button" class="btn sm" data-act="usedNalog" data-id="${n.id}">${n.porabljen ? 'Odznači porabljen' : 'Označi porabljen'}</button>` : ''}
    <button type="button" class="btn sm" data-act="cancelNalog" data-id="${n.id}">${n.preklican ? 'Obnovi' : 'Prekliči'}</button>
    <button type="button" class="btn sm danger" data-act="delNalog" data-id="${n.id}">Izbriši</button></div>`;
  let form = '';
  if (open){
    const f = (k, label, type = 'text', extra = '') => `<div class="field"><label for="nf-${k}">${label}</label><input id="nf-${k}" data-nf="${k}" type="${type}" value="${esc(n[k] || '')}" autocomplete="off" ${extra}></div>`;
    form = `<div class="nform"><div class="formgrid">
      <div class="field"><label for="nf-vrsta">Vrsta naloga</label><select id="nf-vrsta" data-nf="vrsta">${Object.entries(NALOG_VRSTE).map(([k, v]) => `<option value="${k}" ${n.vrsta === k ? 'selected' : ''}>${v.l}</option>`).join('')}</select></div>
      ${f('stevilka', 'Številka naloga')}
      ${f('narocnik', 'Naročnik (ustanova / zdravnik)')}
      ${f('izvajalec', 'Izvajalec prevoza')}
      ${f('zdravnik', 'Zdravnik (ime in priimek)')}
      <div class="field"><label for="nf-zv">Zdravnik je</label><select id="nf-zv" data-nf="zdravnikVrsta">${ZDRAVNIK_VRSTE.map(z => `<option ${n.zdravnikVrsta === z ? 'selected' : ''}>${z}</option>`).join('')}</select></div>
      <div class="field"><label for="nf-razlog">Razlog prevoza</label><input id="nf-razlog" data-nf="razlog" list="razlogList" value="${esc(n.razlog || '')}" autocomplete="off"><datalist id="razlogList">${NALOG_RAZLOGI.map(r => `<option value="${esc(r)}"></option>`).join('')}</datalist></div>
      <div class="field"><label for="nf-mode">Način prevoza</label><select id="nf-mode" data-nf="mode">${Object.entries(PMODES).map(([k, v]) => `<option value="${k}" ${n.mode === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="nf-od">Relacija: od</label><input id="nf-od" data-nf="od" data-suggest="from" value="${esc(n.od || '')}" autocomplete="off" placeholder="npr. domači naslov"></div>
      <div class="field"><label for="nf-do">Relacija: do</label><input id="nf-do" data-nf="do" data-suggest="to" value="${esc(n.do || '')}" autocomplete="off" placeholder="npr. Dializni center Krško"></div>
      ${f('veljaOd', 'Velja od', 'date')}
      <div class="field"><label for="nf-veljaDo">Velja do ${n.auto ? '<span class="dim">(predlog)</span>' : ''}</label><input id="nf-veljaDo" data-nf="veljaDo" type="date" value="${esc(n.veljaDo || '')}"></div>
      ${f('dnevi', 'Dnevi / pogostost (npr. pon, sre, pet)')}
      <div class="field full"><label for="nf-opombe">Opombe</label><textarea id="nf-opombe" data-nf="opombe" rows="2">${esc(n.opombe || '')}</textarea></div>
      </div>
      <p class="hint nform-hint" style="margin:6px 0 0">Predlog veljavnosti: ${esc(NALOG_VRSTE[n.vrsta].hint)}. Pred shranjevanjem preveri datuma na nalogu.${miss.length ? ` <b>Manjka:</b> ${esc(miss.join(', '))}.` : ' Vsa polja so izpolnjena.'}</p></div>`;
  }
  return `<article class="ncard ${s.tone}" data-nalog="${n.id}">${head}${sum}${acts}${form}</article>`;
}
function patientDetailHTML(p){
  const sw = Array.from({ length:PCOLORS }, (_, i) => `<button type="button" class="swatch pc${i}" data-act="pColor" data-c="${i}" aria-pressed="${p.color === i}" aria-label="Barva ${i + 1}"></button>`).join('');
  const nl = (p.naloge || []).slice().sort((a, b) => (b.veljaDo || '').localeCompare(a.veljaDo || ''));
  return `<section class="card card-pad stack pdetail ${p.color >= 0 ? 'pc' + p.color : ''}" style="gap:14px">
    <div class="card-head" style="margin:0"><div class="row" style="gap:10px">${avatarP(p)}<h3>${esc(p.name || 'Nov pacient')}</h3>${p.demo ? '<span class="chip warn">PRIMER</span>' : ''}</div>
      <div class="row"><button type="button" class="btn sm" data-act="pBack">Nazaj na seznam</button><button type="button" class="btn sm danger" data-act="delPatient" data-id="${p.id}">Izbriši pacienta</button></div></div>
    <div class="formgrid">
      <div class="field"><label for="pf-name">Ime in priimek</label><input id="pf-name" data-pf="name" value="${esc(p.name)}" autocomplete="off"></div>
      <div class="field"><label for="pf-phone">Telefon / kontakt</label><input id="pf-phone" data-pf="phone" type="tel" value="${esc(p.phone)}" autocomplete="off"></div>
      <div class="field full"><label for="pf-addr">Domači naslov</label><input id="pf-addr" data-pf="addr" data-suggest="from" value="${esc(p.addr)}" autocomplete="off" placeholder="npr. Dobova 25"></div>
      <div class="field"><span class="lbl">Običajni način prevoza</span><div class="seg" role="group">${Object.entries(PMODES).map(([k, v]) => `<button type="button" data-act="pMode" data-mode="${k}" aria-pressed="${p.mode === k}">${v}</button>`).join('')}</div></div>
      <div class="field"><label for="pf-zzzs">Št. zavarovane osebe (neobvezno)</label><input id="pf-zzzs" data-pf="zzzs" value="${esc(p.zzzs || '')}" autocomplete="off" inputmode="numeric"></div>
      <div class="field"><span class="lbl">Barva pacienta</span><div class="swatches">${sw}</div></div>
      <div class="field full"><label for="pf-note">Opomba (npr. voziček, kisik, hišni ključ)</label><textarea id="pf-note" data-pf="note" rows="2">${esc(p.note || '')}</textarea></div>
    </div>
    <div class="card-head" style="margin:6px 0 0"><h3>Nalogi za prevoz</h3>
      <div class="row" style="gap:6px">${Object.entries(NALOG_VRSTE).map(([k, v]) => `<button type="button" class="btn sm" data-act="addNalog" data-v="${k}">${IC.plus} ${v.l}</button>`).join('')}</div></div>
    ${nl.length ? nl.map(n => nalogCardHTML(p, n)).join('') : '<div class="empty-state">Pacient še nima naloga. Dodaj letni, mesečni, enkratni nalog ali nalog za čas zdravljenja.</div>'}
  </section>`;
}
function renderPatients(){
  const sel = patientById(UI.pid);
  if (sel) logPatientOpen(sel.id);
  const all = S.patients.slice().sort((a, b) => a.name.localeCompare(b.name, 'sl'));
  const list = all.filter(patientMatches);
  const al = nalogAlerts();
  const rows = list.map(p => { const sm = patientNalogSummary(p); return `<button type="button" class="prow ${p.color >= 0 ? 'pc' + p.color : ''}" data-act="openPatient" data-id="${p.id}" aria-current="${UI.pid === p.id}">${avatarP(p)}<span class="pr-main"><b>${esc(p.name || '(brez imena)')}</b><span class="hint">${esc(p.addr || 'brez naslova')}${p.phone ? ' · ' + esc(p.phone) : ''}</span></span><span class="pr-side">${p.dt ? `<span class="chip" title="Dializa: ${DIA_TERMS[p.dt.t].toLowerCase()}">dial. ${p.dt.t === 'dop' ? 'dop.' : 'pop.'}</span>` : ''}${sm.n ? nalogChip(sm.n) : '<span class="chip">brez naloga</span>'}</span></button>`; }).join('');
  $('#view').innerHTML = `${demoBanner()}${alertsBanner()}
    <div class="plist ${sel ? 'has-sel' : ''}">
      <div class="stack" style="gap:12px">
        <div class="toolbar"><input type="search" id="patSearch" placeholder="Išči po imenu, naslovu, telefonu" value="${esc(UI.pq)}" aria-label="Išči pacienta"><button type="button" class="btn primary" data-act="newPatient">${IC.plus} Nov pacient</button></div>
        <div class="seg" role="group" aria-label="Filter">${[['vsi', `Vsi (${all.length})`], ['opozorila', `Opozorila (${al.length})`], ['brez', 'Brez naloga']].map(([k, l]) => `<button type="button" data-act="pf" data-k="${k}" aria-pressed="${UI.pf === k}">${l}</button>`).join('')}</div>
        <div class="prows">${rows || '<div class="empty-state">Ni pacientov za ta filter. Pacienta dodaš z gumbom »Nov pacient« ali v dnevni knjigi z »Shrani v bazo«.</div>'}</div>
      </div>
      <div class="stack">${sel ? patientDetailHTML(sel) : '<div class="empty-state">Izberi pacienta na seznamu ali dodaj novega. Ko pacienta izbereš v dnevni knjigi, se podatki izpolnijo sami.</div>'}</div>
    </div>`;
}
function cleanupEmptyPatient(){
  const p = patientById(UI.pid);
  if (p && !p.name.trim() && !p.addr.trim() && !p.phone.trim() && !(p.naloge || []).length){ S.patients = S.patients.filter(x => x.id !== p.id); save(); }
}

/* ---------- Živo stanje (dispečer) ---------- */
/* Ocena prihoda glede na zadnje sporočilo posadke (po cestnih podatkih); prazno, če prevoz ni v teku */
function etaChip(date, r){
  let e = null; try { e = liveEta(date, r); } catch(err){}
  if (!e) return '';
  const late = e.appt != null && e.t > e.appt;
  return `<span class="eta ${late ? 'bad' : ''}" title="Ocena iz zadnjega sporočila posadke in cestnih podatkov">${esc(e.what)} ~${fmtT(e.t)}${late ? ' · po uri preiskave' : ''}</span>`;
}
function renderLive(){
  const today = todayStr(), tom = addDays(today, 1), date = UI.lDate || today;
  const sum = liveSummary(date), rows = liveRows(date), pub = S.published[date], st = publishState(date);
  const problems = rows.filter(x => ['odklonjena', 'ni_doma'].includes(x.r.status));
  const byRun = {}; rows.forEach(x => { const k = x.run ? x.run.key : '_'; (byRun[k] = byRun[k] || []).push(x); });
  const order = x => (x.r.time || '99:99');
  const runCards = ((pub && pub.runs) || []).map(run => {
    const items = (byRun[run.key] || []).sort((a, b) => order(a).localeCompare(order(b)));
    if (!items.length) return '';
    const done = items.filter(x => ['zakljucena'].includes(x.r.status)).length;
    return `<section class="card crewcard"><header><div><h3>${esc(run.vehName)} · ${esc((run.names || []).join(', '))}</h3><div class="timeline-note">${items.length} prevozov · ${done} zaključenih</div></div><div class="meta">${run.uids && run.uids.length ? `<span class="chip ok">${run.uids.length} v aplikaciji</span>` : '<span class="chip warn">nihče v aplikaciji</span>'}</div></header>
      <div class="livelist">${items.map(({ r, nr }) => `<div class="liverow ${pcClass(r.patientId)}"><span class="pdot ${pcClass(r.patientId)}"></span><div class="lr-main"><b>${esc(r.name || '(brez imena)')}</b> <span class="chip mono">št. ${nr}</span> <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span><div class="hint">${esc(r.from)} → ${esc(r.to)} · ura ${esc(r.time || '–')}${r.statusBy ? ' · ' + esc(r.statusBy) : ''}${r.statusNote ? ' · ' + esc(r.statusNote) : ''}</div></div><div class="lr-side">${stChip(r.status || 'nova')}${etaChip(date, r)}<div class="row" style="gap:4px;justify-content:flex-end">${timesChips(r)}</div></div></div>`).join('')}</div></section>`;
  }).join('');
  const loose = (byRun._ || []).filter(x => !['zakljucena', 'preklicana'].includes(x.r.status) && !x.r.done);
  $('#view').innerHTML = `${demoBanner()}
    <div class="row"><div class="seg inline" role="group" aria-label="Dan"><button type="button" data-act="lDate" data-date="${today}" aria-pressed="${date === today}">Danes · ${fmtShort(today)}</button><button type="button" data-act="lDate" data-date="${tom}" aria-pressed="${date === tom}">Jutri · ${fmtShort(tom)}</button></div>
      ${st === 'ok' ? `<span class="chip ok">objavljeno ob ${timeOf(pub.at)}</span>` : st === 'spremenjeno' ? '<span class="chip warn">spremenjeno po objavi</span>' : '<span class="chip">ni objavljeno</span>'}
      <button type="button" class="btn sm" data-act="gotoDisp" data-date="${date}">${IC.route} Razpored</button></div>
    <div class="stats">${['dodeljena', 'sprejeta', 'na_poti', 'na_kraju', 'v_vozilu', 'zakljucena'].map(k => `<div class="stat"><b>${(sum[k] || 0) + (k === 'zakljucena' ? (sum.na_cilju || 0) : 0)}</b><span>${esc(STATUSI[k].s)}</span></div>`).join('')}</div>
    ${problems.length ? `<div class="banner bad"><span>${IC.alert}</span><div>${problems.map(x => `<div><b>${esc(x.r.name)}</b> (št. ${x.nr}): ${esc(STATUSI[x.r.status].l)}${x.r.statusNote ? ' – ' + esc(x.r.statusNote) : ''}${x.r.statusBy ? ' · ' + esc(x.r.statusBy) : ''}. <button type="button" class="linkbtn" data-act="reassign" data-date="${date}" data-id="${x.r.id}">Vrni v razpored</button></div>`).join('')}</div></div>` : ''}
    ${runCards || '<div class="empty-state">Razpored za ta dan še ni objavljen. V pogledu Dispečer klikni »Objavi razpored«.</div>'}
    ${loose.length ? `<div class="card card-pad stack" style="gap:8px"><h3>Brez posadke (ni objavljeno)</h3><div class="row" style="gap:6px">${loose.map(x => `<span class="chip mono">${x.nr} ${esc(x.r.name)}</span>`).join('')}</div></div>` : ''}`;
}

/* ---------- Aplikacija posadke (voznik, spremljevalec) ---------- */
function crewRideCard(date, doc, rid, r){
  const stt = crewRideState(doc.runKey, rid), s = stt.status;
  const idx = STATUS_FLOW.indexOf(s), nextBtn = STATUS_BTN[s];
  const pc = r.color >= 0 ? 'pc' + r.color : '';
  const toPick = !['v_vozilu', 'na_cilju', 'zakljucena'].includes(s);
  const tel = String(r.phone || '').replace(/[^\d+]/g, '');
  const chips = STATUS_FLOW.filter(k => CASI_KLJUC[k] && stt.times[k]).map(k => `<span class="chip mono">${esc(STATUSI[k].s)} ${timeOf(stt.times[k])}</span>`).join('');
  const lastKey = stt.last && stt.last.status, lastT = lastKey && stt.times[lastKey];
  const hh = lastT ? timeOf(lastT) : '';
  let extra = '';
  if (['na_poti', 'na_kraju'].includes(s)) extra += `<button type="button" class="btn sm danger" data-act="crewNoHome" data-ride="${rid}" data-date="${date}">Pacienta ni na naslovu</button>`;
  if (s === 'dodeljena') extra += `<details class="decline"><summary class="btn sm danger">Ne morem prevzeti</summary><div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" data-cnote="${rid}" placeholder="Razlog (neobvezno)" maxlength="120" aria-label="Razlog"><button type="button" class="btn sm danger" data-act="crewDecline" data-ride="${rid}" data-date="${date}">Pošlji</button></div></details>`;
  if (lastT && !['dodeljena'].includes(s)) extra += `<details class="decline"><summary class="btn sm">Popravi uro (${esc(STATUSI[s].s)})</summary><div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="time" data-cfix="${rid}" value="${hh}" aria-label="Pravilna ura"><button type="button" class="btn sm" data-act="crewFix" data-ride="${rid}" data-date="${date}">Shrani uro</button></div></details>`;
  let primary = '';
  if (nextBtn) primary = `<button type="button" class="btn primary big" data-act="crewStep" data-ride="${rid}" data-date="${date}" data-st="${STATUS_FLOW[idx + 1]}">${esc(nextBtn)}</button>`;
  else if (s === 'ni_doma') primary = `<button type="button" class="btn primary big" data-act="crewStep" data-ride="${rid}" data-date="${date}" data-st="na_poti">Poskusim znova (na poti)</button>`;
  else if (s === 'odklonjena') primary = `<button type="button" class="btn primary big" data-act="crewStep" data-ride="${rid}" data-date="${date}" data-st="sprejeta">Vseeno sprejmem</button>`;
  else if (s === 'zakljucena') primary = `<div class="donebar">${IC.check} Prevoz zaključen</div>`;
  return `<article class="rcard ${pc} st-card-${s}"><div class="rc-head"><span class="chip mono">${esc(r.pickT || r.time || '')}</span><span class="chip mono">št. ${r.nr}</span><span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span>${r.dia ? `<span class="chip mono">${esc(r.dia)}</span>` : ''}<span class="sp"></span>${stChip(s)}</div>
    <h3 class="rc-name"><span class="pdot ${pc}"></span>${esc(r.name)}</h3>
    <div class="rc-addr"><div><span class="lbl">Od</span><div>${esc(r.from)}</div></div><div><span class="lbl">Do</span><div>${esc(r.to)}</div></div></div>
    ${r.time || /\d/.test(r.dropT || '') ? `<div class="hint">${r.time ? `Ura preiskave / dogovorjena ura: <b>${esc(r.time)}</b>` : ''}${/\d/.test(r.dropT || '') ? `${r.time ? ' · ' : ''}predviden ${r.kind === 'from' ? 'prihod domov' : 'prihod na cilj'}: <b class="mono">${esc(r.dropT)}</b>` : ''}</div>` : ''}
    ${r.note ? `<div class="banner warn" style="padding:8px 12px"><span>${IC.info}</span><div>${esc(r.note)}</div></div>` : ''}
    ${r.nalog ? `<div class="hint">Nalog: ${esc(r.nalog.v)}${r.nalog.st ? ', št. ' + esc(r.nalog.st) : ''}</div>` : ''}
    <div class="row" style="gap:6px">${tel ? `<a class="btn sm" href="tel:${esc(tel)}">${IC.phone} Pokliči</a>` : ''}<a class="btn sm" href="${esc(navUrl(toPick ? r.from : r.to))}" target="_blank" rel="noopener noreferrer">${IC.pin} Navigacija</a></div>
    ${chips ? `<div class="row" style="gap:4px">${chips}</div>` : ''}${stt.note ? `<div class="hint">${esc(stt.note)}</div>` : ''}
    ${primary}<div class="row" style="gap:6px;align-items:flex-start">${extra}</div></article>`;
}
function renderCrewApp(){
  const today = todayStr(), dates = [addDays(today, -1), today, addDays(today, 1)].filter(d => d !== addDays(today, -1) || CREW.docs[d]);
  if (!UI.cDate || !dates.includes(UI.cDate)) UI.cDate = today;
  const date = UI.cDate, doc = CREW.docs[date];
  const tabs = `<div class="seg" role="group" aria-label="Dan">${dates.map(d => `<button type="button" data-act="cDate" data-date="${d}" aria-pressed="${date === d}">${d === today ? 'Danes' : d === addDays(today, 1) ? 'Jutri' : 'Včeraj'}<small> ${fmtShort(d)}</small></button>`).join('')}</div>`;
  let body;
  if (!CREW.ready) body = '<div class="empty-state">Nalagam razpored …</div>';
  else if (!doc) body = `<div class="empty-state">Za ${date === today ? 'danes' : fmtShort(date)} razpored še ni objavljen ali nisi v nobeni posadki.<br><span class="hint">Ko dispečer objavi razpored, se prikaže tukaj.</span></div>`;
  else {
    const done = Object.keys(doc.rides).filter(id => crewRideState(doc.runKey, id).status === 'zakljucena').length, total = Object.keys(doc.rides).length;
    body = `<div class="card card-pad stack" style="gap:6px"><div class="row" style="justify-content:space-between"><h3>${esc(doc.vehName)}</h3><span class="chip mono">${done}/${total} zaključenih</span></div>
      <div class="muted">${esc((doc.names || []).join(', '))}</div><div class="hint">Štart iz postaje: <b class="mono">${esc(doc.depart || '–')}</b></div></div>
      ${(doc.trips || []).map((t, ti) => `<section class="stack" style="gap:10px"><div class="row" style="gap:8px"><span class="chip ${t.kind === 'from' ? 'ok' : 'info'}">${t.kind === 'from' ? 'ODVOZ' : 'TJA'}</span><b>${t.kind === 'to' ? esc(t.anchor || 'cilj') : 'Iz: ' + esc(t.anchor || 'ustanova')}</b><span class="hint mono">štart ${esc(t.depart)}</span></div>
        <details class="stopsum"><summary>Postanki (${t.stops.length})</summary><ul>${t.stops.map(s => `<li><time class="mono">${esc(s.t)}</time> ${s.type === 'pu' ? 'pobere' : 'izstop'}: ${esc(s.label)}${s.rideIds.length ? ' · ' + s.rideIds.map(id => esc((doc.rides[id] || {}).name || '')).join(', ') : ''}</li>`).join('')}</ul></details>
        ${[...new Set(t.stops.flatMap(s => s.rideIds))].filter(id => doc.rides[id]).sort((a, b) => String(doc.rides[a].pickT).localeCompare(String(doc.rides[b].pickT))).map(id => crewRideCard(date, doc, id, doc.rides[id])).join('')}</section>`).join('')}`;
  }
  $('#view').innerHTML = `${tabs}<div style="height:12px"></div><div class="stack">${body}</div>
    <p class="hint" style="margin-top:14px">Koraki se zapišejo z uro ob pritisku. Če ni povezave, počakaj, da se vrne; aplikacija naj ostane odprta.</p>
    <details class="card card-pad" style="margin-top:10px"><summary><b>Moj račun</b> · spremeni geslo</summary><div style="height:10px"></div>${pwFormHTML()}</details>`;
}

/* ---------- Pravila (skrbnik) ---------- */
function rulesTab(){
  const r = S.rules, st = S.settings, n = (path, v, step = 1) => field(path, v, { num:1, step, label:path });
  const rows = [
    ['Najdaljša vožnja pacienta v vozilu', 'min', 'settings.maxRide', st.maxRide, 'rules.bend.maxRide', r.bend.maxRide, 'Koliko minut največ sme pacient sedeti v vozilu.'],
    ['Dodaten čas za soprevoznika', 'min', 'settings.detour', st.detour, 'rules.bend.detour', r.bend.detour, 'Za koliko se vožnja podaljša, da se vzame še en pacient.'],
    ['Okno združevanja po uri', 'min', 'settings.window', st.window, 'rules.bend.window', r.bend.window, 'Največja razlika v uri preiskave pri pacientih v istem vozilu.'],
    ['Rezerva pred preiskavo', 'min', 'settings.buffer', st.buffer, 'rules.bend.buffer', r.bend.buffer, 'Koliko minut pred preiskavo naj pacient prispe.']
  ];
  return `<div class="stack"><div class="card card-pad stack"><h3>Način pravil (privzeto)</h3>
    <div class="seg" role="group" aria-label="Privzeti način">${Object.entries(RULE_MODES).map(([k, l]) => `<button type="button" data-act="ruleMode" data-k="${k}" aria-pressed="${r.mode === k}">${l}</button>`).join('')}</div>
    <p class="muted" style="margin:0">${RULE_DESC[r.mode]}</p>
    <p class="hint" style="margin:0">Dispečer lahko način spremeni tudi samo za en dan (Dispečer → Pravila za ta dan). Posamezen prevoz lahko dobi »Izjemo pravil« v dnevni knjigi.</p></div>
    <div class="card card-pad stack"><h3>Običajne in prilagojene vrednosti</h3>
    <div class="tablewrap"><table class="edtable"><thead><tr><th>Pravilo</th><th>Običajno</th><th>Prilagojeno</th><th>Pomen</th></tr></thead><tbody>
    ${rows.map(x => `<tr><td><b>${x[0]}</b><div class="hint">${x[1]}</div></td><td>${n(x[2], x[3], 5)}</td><td>${n(x[4], x[5], 5)}</td><td class="hint">${x[6]}</td></tr>`).join('')}
    <tr><td><b>Kapaciteta vozila</b></td><td colspan="2" class="hint">Običajno / izjemoma največ: Nastavitve → Vozila</td><td class="hint">Npr. vozilo s 6 sedeži, ki običajno vozi 4 paciente.</td></tr></tbody></table></div></div>
    <div class="card card-pad stack"><h3>Izmene in nadure</h3>
    <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="rules.enforceShift" data-bool="1" ${r.enforceShift ? 'checked' : ''}> Pazi na dolžino izmene (velja za zaposlene, ki imajo v Dispečerju vpisan začetek ali konec izmene)</label>
    <div class="kv"><label for="k-sh">Običajna dolžina izmene <span class="dim">(ur)</span></label>${field('rules.shiftHours', r.shiftHours, { num:1, step:1, label:'Dolžina izmene' }).replace('data-path', 'id="k-sh" data-path')}
    <label for="k-ot">Največ nadur ob prilagoditvi <span class="dim">(min)</span></label>${field('rules.overtimeMax', r.overtimeMax, { num:1, step:15, label:'Nadure' }).replace('data-path', 'id="k-ot" data-path')}
    <label for="k-wd">Opozorilo: letni nalog <span class="dim">(dni vnaprej)</span></label>${field('rules.opozoriloDni', r.opozoriloDni, { num:1, step:1, label:'Opozorilo o poteku letnega naloga' }).replace('data-path', 'id="k-wd" data-path')}
    <label for="k-wk">Opozorilo: mesečni in zdravljenje <span class="dim">(dni vnaprej)</span></label>${field('rules.opozoriloKratki', r.opozoriloKratki ?? 7, { num:1, step:1, label:'Opozorilo o poteku mesečnega naloga' }).replace('data-path', 'id="k-wk" data-path')}</div>
    <p class="hint" style="margin:0">Nadure lahko dispečer tudi vnaprej odobri pri posameznem zaposlenem (Dispečer → zaposleni na delu → Nadure). Če začetek in konec izmene nista vpisana, dolžina izmene ni omejena.</p></div></div>`;
}

/* ---------- Uporabniki ---------- */
async function loadRemoteUsers(){
  if (!DB || BACKEND !== 'firebase') return;
  try { const l = await DB.list('users'); USERS_REMOTE = l.map(x => ({ id:x.id, ...x.data })); } catch(e){ USERS_REMOTE = []; }
  if (ME && UI.view === 'nastavitve' && ['uporabniki', 'zaposleni'].includes(UI.setTab)) scheduleRender();
}
const pwFormHTML = () => `<form class="card card-pad stack" data-form="chPw" style="gap:10px"><h3>Spremeni svoje geslo</h3><div class="formgrid"><div class="field"><label for="po">Staro geslo</label><input id="po" name="old" type="password" autocomplete="current-password" required></div><div class="field"><label for="pn">Novo geslo (vsaj 10 znakov)</label><input id="pn" name="pw" type="password" minlength="10" autocomplete="new-password" required></div></div><button class="btn" type="submit">Spremeni geslo</button><div class="auth-err" id="pwErr"></div></form>`;
function usersTab(){
  const roleOpts = sel => Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${v}</option>`).join('');
  const pwForm = pwFormHTML();
  if (BACKEND === 'firebase'){
    return `<div class="two"><div class="stack"><form class="card card-pad stack" data-form="remoteRole" style="gap:12px"><h3>Dodeli vlogo računu</h3>
      <div class="banner"><span>${IC.info}</span><div>1) V Firebase konzoli (Authentication) ustvari uporabnika. 2) Kopiraj njegov <b>UID</b>. 3) Tukaj mu dodeli ime in vlogo. Brez vloge se uporabnik ne more prijaviti.</div></div>
      <div class="field"><label for="ru">UID (iz Firebase konzole)</label><input id="ru" name="uid" required autocomplete="off" spellcheck="false"></div><div class="field"><label for="rn">Ime in priimek</label><input id="rn" name="name" required autocomplete="off"></div>
      <div class="field"><label for="rr">Vloga</label><select id="rr" name="role">${roleOpts('dispecer')}</select></div><button class="btn primary" type="submit">Shrani vlogo</button><div class="auth-err" id="userErr"></div></form>${pwForm}</div>
      <div class="stack"><div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Uporabniki</h3><button type="button" class="btn sm" data-act="reloadUsers">Osveži</button></div>
      <div class="tablewrap"><table><thead><tr><th>Ime</th><th>Vloga</th><th>Aktiven</th><th>UID</th></tr></thead><tbody>${USERS_REMOTE.map(u => `<tr><td>${esc(u.name || '')}</td><td><select data-urole="${esc(u.id)}" aria-label="Vloga">${roleOpts(u.role)}</select></td><td><input type="checkbox" data-uactive="${esc(u.id)}" ${u.active !== false ? 'checked' : ''} ${u.id === ME.id ? 'disabled' : ''} aria-label="Aktiven"></td><td class="mono hint" style="word-break:break-all">${esc(u.id)}</td></tr>`).join('') || '<tr><td colspan="4" class="hint">Ni uporabnikov ali seznam se še nalaga.</td></tr>'}</tbody></table></div>
      <p class="hint" style="margin:0">Če uporabnik zapusti ekipo: odstrani kljukico »Aktiven« (prijava preneha delovati takoj) in ga nato izbriši v Firebase konzoli.</p></div></div></div>`;
  }
  return `<div class="two"><div class="stack"><form class="card card-pad stack" data-form="addUser" style="gap:12px"><h3>Nov uporabnik</h3>
      <div class="field"><label for="uu">Uporabniško ime</label><input id="uu" name="username" required autocomplete="off"></div><div class="field"><label for="un">Ime in priimek</label><input id="un" name="name" autocomplete="off"></div>
      <div class="field"><label for="ur">Vloga</label><select id="ur" name="role">${roleOpts('dispecer')}</select></div>
      <div class="field"><label for="us">Poveži z zaposlenim (za voznike in spremljevalce)</label><select id="us" name="staffId"><option value="">ni povezan</option>${S.staff.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="up">Geslo (vsaj 10 znakov)</label><input id="up" name="pw" type="password" minlength="10" required autocomplete="new-password"></div>
      <button class="btn primary" type="submit">Ustvari račun</button><div class="auth-err" id="userErr"></div></form>${pwForm}</div>
    <div class="stack"><div class="card card-pad stack"><h3>Uporabniki</h3><div class="tablewrap"><table><thead><tr><th>Ime</th><th>Uporabnik</th><th>Vloga</th><th></th></tr></thead><tbody>${USERS.map(u => `<tr><td>${esc(u.name)}${u.demo ? ' <span class="chip warn">PRIMER</span>' : ''}</td><td class="mono">${esc(u.username)}</td><td><span class="chip ${u.role === 'skrbnik' ? 'accent' : ''}">${esc(ROLES[u.role] || u.role)}</span></td><td>${u.id === ME.id ? '<span class="hint">ti</span>' : `<button type="button" class="icon-btn" data-act="delUser" data-id="${u.id}" aria-label="Izbriši ${esc(u.username)}">${IC.x}</button>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint" style="margin:0">Lokalni način: računi so samo v tem brskalniku (za preizkus). Za pravo uporabo na več napravah uporabi način Firebase (glej navodila).</p></div></div></div>`;
}

/* ---------- Varnost ---------- */
function securityChecks(){
  const out = [];
  const secure = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  out.push({ ok:secure, t:'Povezava je šifrirana (HTTPS)', d:secure ? 'Stran se nalaga prek varne povezave.' : 'Stran ni odprta prek HTTPS. Prijava in podatki niso zaščiteni.' });
  out.push({ ok:BACKEND === 'firebase' ? true : 'warn', t:'Skupna baza z vlogami', d:BACKEND === 'firebase' ? 'Podatki so v Cloud Firestore, dostop urejajo pravila po vlogah (firestore.rules).' : 'Lokalni način: podatki so samo v tem brskalniku. Uporabi samo z izmišljenimi podatki. Za pravo uporabo preklopi na Firebase.' });
  const csp = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  out.push({ ok:csp ? true : 'warn', t:'Content-Security-Policy', d:csp ? 'Brskalnik dovoli samo kodo in povezave, ki jih aplikacija potrebuje.' : 'Ni nastavljena (predogled). Na GitHub Pages je vključena v index.html.' });
  out.push({ ok:S.settings.idleMin <= 30, t:'Samodejna odjava', d:`Po ${S.settings.idleMin} min nedejavnosti. Priporočeno je 30 min ali manj.` });
  const cfgOk = KPC.mode !== 'firebase' || BACKEND === 'firebase';
  out.push({ ok:cfgOk, t:'Nastavitve Firebase (config.js)', d:cfgOk ? (BACKEND === 'firebase' ? 'Povezava z vašim projektom je nastavljena.' : 'Ni v uporabi (lokalni način).') : 'config.js vsebuje še nadomestne vrednosti.' });
  const sw = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  out.push({ ok:sw ? true : 'warn', t:'Namestljiva aplikacija (PWA)', d:sw ? 'Service worker je aktiven: aplikacija deluje kot nameščena in nalaga zadnjo različico.' : 'Service worker še ni aktiven (potrebuje HTTPS in ponovni zagon).' });
  out.push({ ok:'warn', t:'Podatki na napravi', d:'Pri vključenem delovanju brez povezave Firebase hrani kopijo podatkov na napravi. Na skupnih računalnikih se po odjavi izbriše; telefone zaščiti z zaklepom zaslona.' });
  return out;
}
const PERM_EXPECT = { skrbnik:{ book:1, publish:1, patients:1, settings:1, users:1, audit:1, crew:0 }, dispecer:{ book:1, publish:1, patients:1, settings:0, users:0, audit:0, crew:0 }, voznik:{ book:0, publish:0, patients:0, settings:0, users:0, audit:0, crew:1 }, spremljevalec:{ book:0, publish:0, patients:0, settings:0, users:0, audit:0, crew:1 } };
async function runSelfTest(){
  const res = [], add = (name, pass, detail = '') => res.push({ name, pass, detail });
  const denied = async fn => { try { await fn(); return false; } catch(e){ return !!(e && (e.code === 'permission-denied' || /permission|insufficient/i.test(String(e.message || '')))); } };
  const allowed = async fn => { try { await fn(); return true; } catch(e){ return false; } };
  // 1) matrika pravic v vmesniku
  let ok = true; const saved = ME;
  for (const [role, exp] of Object.entries(PERM_EXPECT)) for (const [perm, v] of Object.entries(exp)){ ME = { ...saved, role }; if (can(perm) !== !!v) ok = false; }
  ME = saved; add('Matrika pravic po vlogah (vmesnik)', ok, 'Voznik in spremljevalec ne smeta urejati knjige, pacientov, nastavitev in uporabnikov.');
  add('Izhod HTML je varen', !/[<>"]/.test(esc('<img src=x onerror=alert(1)>"')), 'Znaki < > " se pretvorijo, vpisano besedilo ne more zagnati kode.');
  try { const s1 = b64e(crypto.getRandomValues(new Uint8Array(16))), s2 = b64e(crypto.getRandomValues(new Uint8Array(16))); const h1 = await hashPw('test-geslo', s1, 1000), h2 = await hashPw('test-geslo', s2, 1000); add('Gesla so soljena in zgoščena (PBKDF2)', h1 !== h2 && h1.length > 30, 'Isto geslo z drugo soljo da drugačno vrednost.'); } catch(e){ add('Gesla so soljena in zgoščena (PBKDF2)', false, 'Brskalnik ne podpira WebCrypto.'); }
  const a = { x:{ y:1, z:[1, 2] }, k:1 }, b = { x:{ y:2, z:[1, 2] }, n:5 }; const ops = diffDoc(a, b); add('Sinhronizacija spreminja samo spremenjena polja', JSON.stringify(applyOps(J(a), ops)) === JSON.stringify(b) && ops.n === 3, 'Dve osebi lahko hkrati urejata različni polji istega dne brez prepisovanja.');
  // 2) žive preizkušnje pravil baze
  if (BACKEND !== 'firebase'){ add('Pravila baze (Firestore)', null, 'Ni na voljo v lokalnem načinu. V načinu Firebase se tukaj preizkusijo zavrnjeni dostopi za tvojo vlogo.'); return res; }
  const today = todayStr();
  add('Preberem lasten profil (kontrola)', await allowed(() => DB.get('users/' + ME.id)), 'Pozitivna kontrola: če ta spodleti, so pravila ali omrežje narobe.');
  if (isStaffRole()){
    add('Ne morem si sam dodeliti vloge skrbnika', ME.role === 'skrbnik' ? null : await denied(() => DB.patch('users/' + ME.id, { set:{ role:'skrbnik' }, del:[], n:1 })), ME.role === 'skrbnik' ? 'Preskočeno: si skrbnik.' : 'Dispečer ne sme spreminjati vlog.');
    const id = await DB.add('audit', { t:new Date().toISOString(), uid:String(ME.id), who:ME.name, role:ME.role, action:'varnostni.test', detail:{} }).catch(() => null);
    add('Revizijske sledi ni mogoče spremeniti', id ? await denied(() => DB.patch('audit/' + id, { set:{ action:'x' }, del:[], n:1 })) : false, 'Zapis v revizijski sledi ostane nespremenjen.');
    add('Revizijske sledi ni mogoče izbrisati', id ? await denied(() => DB.del('audit/' + id)) : false, '');
  } else {
    add('Ne morem prebrati baze pacientov', await denied(() => DB.list('patients')), 'Posadka vidi samo svoje prevoze.');
    add('Ne morem prebrati dnevne knjige', await denied(() => DB.get('days/' + today)), '');
    add('Ne morem prebrati nastavitev', await denied(() => DB.get('cfg/main')), '');
    add('Ne morem pisati v tuj razpored', await denied(() => DB.set('crew/' + today + '_tuj-uporabnik', { date:today, uid:'tuj-uporabnik', uids:['tuj-uporabnik'] })), '');
    add('Ne morem javljati korakov za tuje vozilo', await denied(() => DB.add('runs/' + today + '_nic/events', { rideId:'x', status:'sprejeta', t:new Date().toISOString(), c:new Date().toISOString(), uid:String(ME.id), by:ME.name })), '');
  }
  return res;
}
function securityTab(){
  const checks = securityChecks(), st = UI.selfTest;
  const mark = v => v === true ? '<span class="chip ok">v redu</span>' : v === false ? '<span class="chip bad">pozor</span>' : '<span class="chip warn">preveri</span>';
  return `<div class="stack"><div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Varnostni pregled</h3><button type="button" class="btn primary" data-act="selfTest" ${st && st.running ? 'disabled' : ''}>${IC.shield} ${st && st.running ? 'Preizkušam …' : 'Zaženi preizkus'}</button></div>
    <div class="checks">${checks.map(c => `<div class="check-row">${mark(c.ok)}<div><b>${esc(c.t)}</b><div class="hint">${esc(c.d)}</div></div></div>`).join('')}</div>
    ${st && st.results ? `<h3 style="margin-top:8px">Rezultat preizkusa (${new Date(st.at).toLocaleTimeString('sl-SI', { hour:'2-digit', minute:'2-digit' })})</h3><div class="checks">${st.results.map(r => `<div class="check-row">${r.pass === true ? '<span class="chip ok">uspelo</span>' : r.pass === false ? '<span class="chip bad">NI USPELO</span>' : '<span class="chip">preskočeno</span>'}<div><b>${esc(r.name)}</b>${r.detail ? `<div class="hint">${esc(r.detail)}</div>` : ''}</div></div>`).join('')}</div>` : ''}</div>
    <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Revizijska sled</h3><button type="button" class="btn sm" data-act="loadAudit">Osveži</button></div>
    <div class="scrollbox" style="max-height:340px"><table><thead><tr><th>Čas</th><th>Kdo</th><th>Dejanje</th><th>Podrobnosti</th></tr></thead><tbody>${AUDIT.slice(0, 120).map(e => `<tr><td class="mono hint" style="white-space:nowrap">${new Date(e.t).toLocaleString('sl-SI', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</td><td>${esc(e.who || '')} <span class="hint">${esc(ROLES[e.role] || e.role || '')}</span></td><td class="mono">${esc(e.action)}</td><td class="hint">${esc(JSON.stringify(e.detail || {}))}</td></tr>`).join('') || '<tr><td colspan="4" class="hint">Še ni zapisov.</td></tr>'}</tbody></table></div>
    <p class="hint" style="margin:0">Beleži se prijava, odjava, objava razporeda, ogled in sprememba pacientov ter nalogov, izvoz podatkov in spremembe uporabnikov. Zapisi se dodajajo; urejanje in brisanje nista mogoča. V zapisih ni zdravstvenih podatkov, samo začetnice in oznake.</p></div></div>`;
}
async function loadAudit(){
  if (!DB) return;
  try { const l = await DB.list('audit'); const arr = l.map(x => x.data).filter(x => x && x.t).sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, 300); AUDIT.length = 0; arr.forEach(x => AUDIT.push(x)); } catch(e){ toast('Revizijske sledi ni mogoče prebrati.'); }
  if (UI.view === 'nastavitve') rerender();
}

/* ---------- Logotipi ---------- */
function logosTab(){
  const one = k => { const src = store.get('kp.logo.' + k); return `<div class="card card-pad stack" style="gap:10px"><h3>${esc(LOGOS[k].label)}</h3><div class="logoprev">${src ? `<img src="${esc(src)}" alt="${esc(LOGOS[k].label)}">` : '<span class="hint">Ni naloženega logotipa. Prikazano je besedilo.</span>'}</div>
    <input type="file" data-logo-file="${k}" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-label="Naloži logotip ${esc(LOGOS[k].label)}">${src ? `<button type="button" class="btn sm danger" data-act="rmLogo" data-k="${k}">Odstrani</button>` : ''}
    <p class="hint" style="margin:0">Uradni logotip prejmeš od ZD Brežice (komunikacije/uprava). Za vse naprave ga shrani v mapo <span class="mono">${esc(LOGOS[k].file)}</span> v repozitoriju. Tukaj naložen logotip velja samo na tej napravi. Največ 400 KB.</p></div>`; };
  return `<div class="two">${one('zd')}${one('nmp')}</div>`;
}

/* ---------- Podatki ---------- */
function dataTab(){
  const adm = isAdmin();
  return `<div class="stack"><div class="card card-pad stack"><h3>Varnostna kopija</h3><p class="muted" style="margin:0">${BACKEND === 'firebase' ? 'Podatki so v skupni bazi. Izvoz prenese celotno knjigo (vse dneve), paciente in nastavitve v datoteko. Brezplačni Firebase nima samodejnih varnostnih kopij: izvozi enkrat na teden in datoteko shrani šifrirano (glej navodila, razdelek Varnostne kopije).' : 'Podatki so shranjeni v tem brskalniku. Izvozi kopijo in jo uvozi na drugem računalniku.'} Datoteka vsebuje podatke o pacientih, zato jo hrani šifrirano in varno.</p>
      ${adm ? `<div class="row"><button type="button" class="btn" data-act="exportData">Izvozi podatke</button><button type="button" class="btn" data-act="importData">Uvozi podatke</button><input type="file" id="jsonFile" accept=".json,application/json" style="max-width:260px"></div>
      <textarea id="dataBox" placeholder="Tu se prikaže izvoz. Za uvoz sem prilepi vsebino kopije ali izberi datoteko (podprta je tudi kopija prve različice)." style="min-height:110px;font-family:var(--font-mono);font-size:12px"></textarea>` : '<p class="hint">Izvoz in uvoz je na voljo skrbniku.</p>'}</div>
    <div class="card card-pad stack"><h3>Primeri</h3><p class="muted" style="margin:0">Izmišljeni pacienti, zaposleni in dializni vpisi, označeni s »PRIMER«.</p><div class="row"><button type="button" class="btn danger" data-act="rmDemo" ${hasDemo() ? '' : 'disabled'}>Odstrani vse primere</button></div></div>
    ${adm && BACKEND !== 'firebase' ? `<div class="card card-pad stack"><h3>Brisanje</h3><p class="muted" style="margin:0">Izbriše vse prevoze, paciente in nastavitve v tem brskalniku. Računi ostanejo.</p><div class="row"><button type="button" class="btn danger" data-act="wipe">Izbriši vse podatke</button></div></div>` : ''}</div>`;
}

/* ---------- Predogled za kopiranje ---------- */
function openPreview(title, variants){ UI.modal = { title, variants, idx:0 }; renderModal(); }
function renderModal(){
  const host = $('#modal'), m = UI.modal;
  if (!m){ host.hidden = true; host.innerHTML = ''; delete host.dataset.pk; return; }
  if (m.type === 'pick'){ renderPick(host, m); return; }
  delete host.dataset.pk;
  const v = m.variants[m.idx], lines = v.text.split('\n');
  host.hidden = false;
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">${esc(m.title)}</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    ${m.variants.length > 1 ? `<div class="seg" role="group" aria-label="Oblika">${m.variants.map((x, i) => `<button type="button" data-act="pvVariant" data-i="${i}" aria-pressed="${i === m.idx}">${esc(x.label)}</button>`).join('')}</div>` : ''}
    <div class="pv" role="group" aria-label="Predogled">${lines.map((l, i) => `<button type="button" class="pvline" data-act="copyLine" data-i="${i}" title="Klikni za kopiranje vrstice">${esc(l) || '&nbsp;'}</button>`).join('')}</div>
    <p class="hint" style="margin:0">Klikni vrstico za kopiranje samo te vrstice.</p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button><button type="button" class="btn primary" data-act="copyVariant">${IC.copy} Kopiraj vse</button></div></div>`;
  const b = host.querySelector('.btn.primary'); if (b) b.focus();
}


/* ---------- Točka naslova na zemljevidu: pregled in popravek (kilometrina) ----------
   Dispečer vidi, kje aplikacija meni, da je naslov OD ali DO, in lahko z dotikom na zemljevidu postavi pravo točko. Popravek je ročen vpis (S.geoFix),
   velja za vse prevoze z istim naslovom od včeraj naprej in na vseh napravah. Za ustanove točke ni treba popravljati tukaj (Nastavitve → Klinike in ustanove). */
const pickText = m => { const hit = rideById(m.date, m.id); return hit ? String(hit.r[m.side] || '').trim() : ''; };
function pickSpec(m){
  const pins = [];
  if (m.cur && GEOC.isPoint(m.cur)) pins.push({ id:'cur', lon:m.cur.lon, lat:m.cur.lat, kind:'pu', label:'•', name:'Trenutna točka', html:`<b>Trenutna točka</b><br>${esc(GEOC.PREC[m.cur.prec] || '')}${m.cur.warn ? '<br>' + esc(m.cur.warn) : ''}` });
  if (m.pick) pins.push({ id:'new', lon:m.pick[0], lat:m.pick[1], kind:'do', label:'✓', name:'Nova točka', html:'<b>Nova točka</b><br>Shrani jo spodaj.' });
  return { routes:[], pins, pick:m.canFix ? { cb:pickAt } : null };
}
function pickAt(lon, lat){
  const m = UI.modal; if (!m || m.type !== 'pick') return;
  m.pick = [lon, lat]; const v = MAP.views[m.key]; if (v) v.user = true;
  pickRefresh(m);
}
function pickRefresh(m){
  const host = $('#modal'); if (!host || UI.modal !== m) return;
  const txt = pickText(m), st = host.querySelector('[data-role=pickst]');
  if (st){
    let t = '', warn = false;
    if (m.status){ t = m.status; warn = !!m.err; }
    else if (m.pick) t = 'Nova točka je izbrana. Shrani jo, da se kilometrina preračuna.';
    else if (m.cur){ t = 'Trenutna točka: ' + (GEOC.PREC[m.cur.prec] || '') + (m.cur.warn ? ' (' + m.cur.warn + ')' : '') + '.'; warn = !GEOC.exactPrec(m.cur.prec); }
    if (m.canFix === false && !m.status) t += ' Točka ustanove se ureja v Nastavitve → Klinike in ustanove.';
    else if (m.canFix && !MAP.tilesOn()) t += ' Podlaga zemljevida je izklopljena ali ni dosegljiva: točke ne moreš natančno izbrati.';
    else if (m.canFix && !m.pick) t += ' Dotakni se zemljevida tam, kjer je hiša (povečaj s + ali koleščkom).';
    st.textContent = t.trim(); st.classList.toggle('warn', warn);
  }
  const sv = host.querySelector('[data-act="pickSave"]'), cl = host.querySelector('[data-act="pickClear"]');
  if (sv) sv.disabled = !m.pick || !m.canFix;
  if (cl) cl.disabled = !GEOC.hasFix(txt);
  MAP.update(m.key, pickSpec(m));
}
async function pickLoad(m){
  const txt = pickText(m), side = m.side, an = GEOC.analyse(txt);
  m.cur = null; m.pick = null; m.err = false; m.canFix = ['search', 'unknown', 'settlement'].includes(an.mode) || (an.mode === 'import' ? false : GEOC.hasFix(txt));
  m.status = 'Iščem točko …'; pickRefresh(m);
  try { m.cur = await GEOC.resolve(txt); m.status = ''; }
  catch(e){
    m.status = e.message; m.err = true;
    if (an.g && isFinite(an.g.lat) && an.g.kind !== 'neznano') m.cur = { lat:an.g.lat, lon:an.g.lon, prec:'naselje', warn:'središče naselja' };
  }
  if (UI.modal !== m || m.side !== side) return;
  pickRefresh(m);
}
function openPick(date, id){
  const hit = rideById(date, id); if (!hit) return;
  const r = hit.r, side = (r.to || '').trim() && geo(r.to).kind !== 'poi' ? 'to' : 'from';
  UI.modal = { type:'pick', date, id, side }; renderModal(); pickLoad(UI.modal);
}
function renderPick(host, m){
  const hit = rideById(m.date, m.id); if (!hit){ UI.modal = null; renderModal(); return; }
  const k = m.key = 'pick|' + m.id + '|' + m.side;
  if (host.dataset.pk === k && host.querySelector('.imap[data-map="' + k + '"]')){ pickRefresh(m); return; }   // ponovni izris strani ne uniči zemljevida
  host.dataset.pk = k; host.hidden = false;
  const r = hit.r, short = s => { const t = String(s || '').trim() || '–'; return t.length > 34 ? t.slice(0, 33) + '…' : t; };
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Točka naslova na zemljevidu</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="seg" role="group" aria-label="Konec poti">${[['from', 'OD'], ['to', 'DO']].map(([s, l]) => `<button type="button" data-act="pickSide" data-s="${s}" aria-pressed="${m.side === s}">${l}: ${esc(short(r[s]))}</button>`).join('')}</div>
    ${MAP.html(k, pickSpec(m), { label:'Zemljevid za izbiro točke naslova' })}
    <div class="pickst" data-role="pickst" aria-live="polite"></div>
    <div class="pickbar"><button type="button" class="btn primary" data-act="pickSave" disabled>Shrani točko in preračunaj km</button><button type="button" class="btn" data-act="pickClear" disabled>Odstrani popravek</button><button type="button" class="btn" data-act="closeModal">Zapri</button></div>
    <p class="hint" style="margin:0">Točka se shrani kot popravek naslova za vse prevoze z istim naslovom (od včeraj naprej) in na vseh napravah. Podatki zemljevida: © prispevajoči OpenStreetMap.</p></div>`;
  MAP.mountAll(host);
  const b = host.querySelector('.seg button[aria-pressed="true"]'); if (b) b.focus();
}

/* ---------- Tisk knjige prevozov za mesec ---------- */
const kmPrint = r => { const i = KM.info(r); return i.total == null ? '' : (i.exact && i.backExact ? '' : '~') + KM.fmtKm(i.total); };
function printMonthHTML(){
  const { y, m } = UI.month, n = daysInMonth(y, m); let body = '', total = 0, canc = 0;
  for (let d = 1; d <= n; d++){
    const date = `${y}-${pad(m + 1)}-${pad(d)}`, rs = filledRides(date), note = ((S.crewBook[date] || {}).ost || {}).text || '';
    if (!rs.length && !note) continue;
    rs.forEach(({ r }) => { if (r.odpovedano) canc++; else total++; });
    const rows = rs.map(({ r, nr }) => `<tr class="${r.odpovedano ? 'p-cancel' : ''}"><td>${nr}</td><td>${esc(r.time)}</td><td>${esc(r.name)}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td>${esc(MODES[r.mode] || '')}</td><td class="num">${r.odpovedano ? '' : kmPrint(r)}</td><td>${esc(r.note || '')}</td><td>${r.odpovedano ? '<b>ODPOVEDANO</b>' : r.done ? 'opravljeno' + (r.doneBy ? ' · ' + esc(r.doneBy) : '') : ''}</td></tr>`).join('');
    const hol = holiday(date);
    body += `<section><h3>${DOW_LONG[dow(date)]}, ${fmtDMY(date)}${hol ? ' · ' + esc(hol) : ''}</h3>${rs.length ? `<table><thead><tr><th>Št.</th><th>Ura</th><th>Pacient</th><th>Od</th><th>Do</th><th>Način</th><th>Km</th><th>Opomba</th><th>Stanje</th></tr></thead><tbody>${rows}</tbody></table>` : ''}${note ? `<p class="p-note"><b>Ostalo:</b> ${esc(note)}</p>` : ''}</section>`;
  }
  return `<h2>Knjiga prevozov · ${MONTHS[m]} ${y}</h2><p>Reševalna postaja Brežice · prevozov: ${total}${canc ? ` · odpovedanih: ${canc}` : ''}</p>${body || '<p>Ni vpisov.</p>'}`;
}
function printMonth(){
  let el = document.getElementById('printArea');
  if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
  el.className = ''; el.innerHTML = printMonthHTML();
  window.print();
}

/* ---------- Tisk knjige dneva (obrazec OBR REŠ 08: prevozi 1–10, 11–24, posadke po vozilih, posebnosti) ---------- */
function printDayHTML(date){
  const plan = computePlan(date), form = esc((S.settings.formCode || 'OBR REŠ 08').trim()), rides = ensureDay(date);
  const total = Math.max(24, rides.reduce((m, r, i) => isFilled(r) ? i + 1 : m, 0)), pageSplit = [[0, 10], [10, total]];
  const head = (n, N) => `<header class="pd-head"><div class="pd-logos">${logoInner()}</div><div class="pd-title"><b>KNJIGA REŠEVALNIH PREVOZOV</b><span>Reševalna postaja Brežice · ${form}</span></div>
    <div class="pd-date"><div>DATUM: <b>${fmtDMY(date)}</b></div><div>DAN: <b>${DOW_LONG[dow(date)]}</b></div><div class="pd-pg">list ${n}/${N}</div></div></header>`;
  const vehLine = plan.crews.filter(c => c.trips.length).map(c => esc(c.vehicle.name)).join(' · ') || '–';
  const row = i => {
    const r = rides[i], nr = i + 1;
    if (!r || !isFilled(r)) return `<tr class="pd-empty"><td class="pd-nr">${nr}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    const a = plan.assign[r.id], can = r.odpovedano;
    const pick = a && a.pickT != null ? fmtT(a.pickT) : '';
    const ret = a && a.retPickT != null ? ` · nazaj ${fmtT(a.retPickT)}` : '';
    const notes = [r.mode !== 'sede' ? (MODES[r.mode] || r.mode) : '', r.dia ? 'dializa' : '', +r.stay > 0 ? `čaka ${+r.stay} min` : '', r.note || ''].filter(Boolean).join(', ');
    return `<tr class="${can ? 'p-cancel' : ''}"><td class="pd-nr">${nr}</td><td>${esc(r.name || '')}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td class="pd-t">${esc(r.time || '')}</td><td class="pd-t">${can ? '' : (a && a.late > 0 ? '~' : '') + pick + ret}</td><td class="pd-v">${can ? '' : esc(a ? a.veh : '')}</td><td>${can ? '<b>ODPOVEDANO</b> ' : ''}${esc(notes)}</td></tr>`;
  };
  const N = 3;
  const page = ([a, b], k) => `<section class="pd-page">${head(k + 1, N)}${k === 0 ? `<div class="pd-veh">VOZILA: <b>${vehLine}</b></div>` : ''}
    <table class="pd-tab"><thead><tr><th class="pd-nr">Št.</th><th>Ime in priimek</th><th>Od</th><th>Do</th><th>Ura prev.</th><th>Pobere</th><th>Vozilo</th><th>Opomba</th></tr></thead><tbody>${Array.from({ length:b - a }, (_, j) => row(a + j)).join('')}</tbody></table></section>`;
  const crewRows = plan.crews.filter(c => c.trips.length || c.vehicle.tip !== 'ostalo').map(c => `<tr><td><b>${esc(c.vehicle.name)}</b></td><td>${esc(c.driver.name)}${c.team === 'NN' ? ' <b>(NN)</b>' : ''}${c.escorts.map(e => `<div>${esc(e.name)} (sp.)</div>`).join('')}${(c.helpers || []).map(h => `<div>${esc(h.name)} (${ROLE_TAG[h.role] || ''})</div>`).join('')}</td><td>${c.rideNrs.join(', ') || '–'}</td><td>${c.trips.length ? `ob ${fmtT(c.firstDepart)}` : ''}</td></tr>`).join('');
  const notices = S.notices.filter(n => !n.closed && n.from <= date && (!n.to || n.to >= date));
  const posebnosti = [S.dayNote[date] || '', ...notices.map(n => `${(S.vehicles.find(v => v.id === n.vehicleId) || {}).name || ''}: ${n.tip}${n.note ? ' – ' + n.note : ''}`)].filter(Boolean);
  const unas = plan.unassigned.length ? `<p class="pd-warn">Nerazporejeni prevozi: ${plan.unassigned.map(u => u.ride.nr).join(', ')}</p>` : '';
  return page(pageSplit[0], 0) + page(pageSplit[1], 1) + `<section class="pd-page">${head(3, N)}
    <table class="pd-tab pd-crew"><thead><tr><th>Vozilo</th><th>Voznik</th><th>Prevozi (št.)</th><th>Posebnosti</th></tr></thead><tbody>${crewRows || '<tr><td colspan="4">Ni posadk.</td></tr>'}</tbody></table>${unas}
    <div class="pd-pos"><b>Posebnosti:</b>${posebnosti.length ? '<ul>' + posebnosti.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : '<div class="pd-lines"></div>'}</div>
    <div class="pd-sign"><span>Dispečer: ______________________</span><span>Izpisano: ${new Date().toLocaleString('sl-SI')}</span></div>
    <p class="pd-fine">Ure »Pobere« so ocena razporeda (cestni podatki); dejanske ure vpiše posadka.</p></section>`;
}
function printDay(date){
  let el = document.getElementById('printArea');
  if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
  el.className = 'pday'; el.innerHTML = printDayHTML(date);
  audit('knjiga.tisk', { dan:date });
  window.print();
}
