/* =====================================================================
   VMESNIK: skeniranje naloga (pregled prebranega) in tisk dopolnil na nalog; nastavitve tiska
   ===================================================================== */

/* ---------- Skeniranje naloga ---------- */
const NS_FIELDS = [
  ['name', 'Ime in priimek', 'text'], ['zzzs', 'Številka zavarovane osebe', 'text'], ['addr', 'Domači naslov (ulica hišna št., kraj)', 'text', 'full'], ['phone', 'Telefon', 'text'],
  ['stevilka', 'Številka naloga', 'text'], ['narocnik', 'Naročnik (izvajalec, ki je izdal nalog)', 'text', 'full'], ['zdravnik', 'Zdravnik', 'text'],
  ['od', 'Relacija: OD', 'text', 'full'], ['do', 'Relacija: DO', 'text', 'full'], ['razlog', 'Razlog prevoza', 'text'],
  ['izdan', 'Velja od (datum izdaje)', 'date'], ['veljaDo', 'Velja do', 'date']
];
function nsOpen(){
  UI.modal = { type:'nscan', step:'in', text:'', busy:'', err:'', f:{}, src:{}, notes:[], match:null, usePid:'', raw:'' };
  renderModal();
}
function nsSetText(m, text){
  m.raw = text;
  if (!String(text).trim()){ m.err = 'Besedila ni; prilepi besedilo ali izberi sliko.'; return false; }
  const r = NSCAN.parse(text);
  m.f = Object.assign({}, r.fields); m.src = r.src; m.notes = r.notes; m.found = r.found; m.total = r.total;
  const mt = NSCAN.matchPatient(m.f); m.match = mt; m.usePid = mt ? mt.p.id : '';
  m.step = 'review'; m.err = ''; return true;
}
async function nsFile(file){
  const m = UI.modal; if (!m || m.type !== 'nscan' || !file) return;
  m.err = ''; m.busy = 'Pripravljam sliko …'; renderModal();
  try {
    const png = await NSCAN.prepare(file);
    if (!NSCAN.ocrEnabled()) throw new Error('Razpoznava besedila iz slike ni vklopljena (config.js → ocr). Prilepi besedilo, ki ga prebere telefon (Kamera → Skeniraj besedilo).');
    m.busy = 'Razpoznavam besedilo (prvič lahko traja minuto ali dve) …'; renderModal();
    const text = await NSCAN.ocr(png, p => { const el = document.querySelector('[data-role=nsbusy]'); if (el){ const pc = p.pct != null && isFinite(p.pct) ? ' ' + Math.round(p.pct * 100) + ' %' : ''; el.textContent = (p.stage === 'lib' ? 'Nalagam razpoznavo besedila …' : 'Razpoznavam besedilo …' + pc); } });
    m.busy = ''; if (UI.modal !== m) return;
    if (!nsSetText(m, text)) m.text = text;
  } catch (e) { m.busy = ''; m.err = String(e && e.message || e); }
  if (UI.modal === m) renderModal();
}
function nsSave(){
  const m = UI.modal; if (!m || m.type !== 'nscan') return;
  const f = m.f;
  if (!String(f.name || '').trim()){ m.err = 'Vpiši vsaj ime in priimek pacienta.'; renderModal(); return; }
  const r = NSCAN.apply(f, { pid:m.usePid });
  UI.pid = r.p.id; UI.nid = r.n.id; UI.modal = null; renderModal();
  toast(r.created ? 'Pacient in nalog shranjena. Preveri podatke.' : r.updated ? 'Nalog posodobljen.' : 'Nalog dodan pacientu.');
  go('pacienti');
}
function renderScan(host, m){
  host.hidden = false; delete host.dataset.pk;
  const f = m.f || {}, miss = k => !String(f[k] || '').trim();
  const ocrOn = NSCAN.ocrEnabled();
  let body;
  if (m.step === 'review'){
    const grid = NS_FIELDS.map(([k, l, type, cls]) => `<div class="field ${cls || ''} ${miss(k) ? 'ns-miss' : ''}"><label for="ns-${k}">${esc(l)}${miss(k) ? ' <span class="dim">· ni prebrano</span>' : ''}</label><input id="ns-${k}" data-ns="${k}" type="${type}" value="${esc(f[k] || '')}" autocomplete="off"></div>`).join('');
    const sel = (k, label, opts) => `<div class="field"><label for="ns-${k}">${label}</label><select id="ns-${k}" data-ns="${k}">${opts.map(([v, l]) => `<option value="${v}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
    const known = m.match ? `<div class="banner"><span>${IC.info}</span><div>Pacient je že v bazi (${esc(m.match.how)}). <label class="row" style="gap:8px;flex-wrap:nowrap;margin-top:6px"><input type="radio" name="nsWho" data-nswho="${m.match.p.id}" ${m.usePid === m.match.p.id ? 'checked' : ''}> Dodaj nalog pacientu <b>${esc(m.match.p.name)}</b></label>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="radio" name="nsWho" data-nswho="" ${m.usePid ? '' : 'checked'}> Ustvari novega pacienta</label></div></div>` : '';
    body = `${known}
      <p class="hint" style="margin:0">Prebrano je ${m.found || 0} od ${m.total || 5} ključnih podatkov. Preveri vsako polje, popravi, kar je narobe, in shrani. Polja z oznako »ni prebrano« izpolni ročno.${(m.notes || []).length ? ' ' + esc(m.notes.join(' ')) : ''}</p>
      <div class="formgrid">${grid}
        ${sel('mode', 'Način prevoza', Object.entries(MODES))}
        ${sel('vrsta', 'Vrsta naloga', Object.entries(NALOG_VRSTE).map(([k, v]) => [k, v.l]))}
        <div class="field full"><label for="ns-opombe">Opombe</label><textarea id="ns-opombe" data-ns="opombe" rows="2">${esc(f.opombe || '')}</textarea></div></div>
      <details class="hintdet"><summary>Prebrano besedilo (za primerjavo)</summary><pre class="nsraw">${esc(m.raw)}</pre></details>
      <p class="hint" style="margin:0">Datum rojstva in e-pošta se ne shranita. Slika in besedilo se ne hranita; shrani se samo, kar potrdiš.</p>
      ${m.err ? `<div class="banner" style="background:var(--warn-soft);color:var(--warn)"><span>${IC.info}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row" style="justify-content:space-between"><button type="button" class="btn" data-act="nsBack">Nazaj</button><button type="button" class="btn primary" data-act="nsSave">Shrani pacienta in nalog</button></div>`;
  } else {
    body = `<div class="banner"><span>${IC.info}</span><div>Fotografiraj nalog ali izberi PDF-sken. Aplikacija prebere besedilo in izpolni podatke; pred shranjevanjem vse preveriš. <b>Slika se ne pošlje nikamor in se ne shrani</b>; branje poteka v tej napravi (prvič se prenese program za razpoznavo besedila).</div></div>
      <div class="stack" style="gap:8px"><label class="btn primary" for="nsFile" style="cursor:pointer;justify-self:start">${ocrOn ? 'Izberi fotografijo ali PDF' : 'Izberi fotografijo ali PDF (razpoznava izklopljena)'}</label>
        <input id="nsFile" type="file" accept="image/*,application/pdf,.pdf" style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        ${m.busy ? `<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span data-role="nsbusy" role="status">${esc(m.busy)}</span></div>` : ''}</div>
      <div class="field"><label for="nsText">ali prilepi besedilo</label><textarea id="nsText" rows="7" placeholder="Prilepi besedilo naloga …">${esc(m.text)}</textarea>
        <span class="hint">iPhone: v polje se dotakni → ikona kamere → »Skeniraj besedilo«. Android: Google Lens → kopiraj besedilo. PDF z besedilom: označi vse, kopiraj, prilepi.</span></div>
      ${m.err ? `<div class="banner" style="background:var(--warn-soft);color:var(--warn)"><span>${IC.info}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button><button type="button" class="btn primary" data-act="nsParse" ${m.busy ? 'disabled' : ''}>Preberi besedilo</button></div>`;
  }
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Skeniraj nalog za prevoz</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div><div class="stack" style="gap:12px">${body}</div></div>`;
}

/* ---------- Tisk dopolnil na nalog ---------- */
function npOpen(pid, nid){
  const p = patientById(pid), n = p && (p.naloge || []).find(x => x.id === nid); if (!p || !n) return;
  const today = todayStr();
  const rows = NP.ridesFor(p, n).map(x => Object.assign(x, { on:!x.printed && x.done && x.date <= today }));
  UI.modal = { type:'nprint', pid, nid, rows, start:NP.nextRow(n), printed:{}, saved:false, err:'' };
  renderModal();
}
function npGroups(m){
  const sel = m.rows.filter(x => x.on);
  return NP.layout(sel, Math.max(1, Math.floor(+m.start) || 1));
}
function npDynHTML(m){
  const groups = npGroups(m), n = groups.reduce((a, g) => a + g.items.length, 0);
  if (!n) return `<div class="empty-state">Izberi vsaj en prevoz.</div>`;
  const pend = groups.filter(g => m.printed[g.key]);
  const btns = groups.map(g => `<button type="button" class="btn ${m.printed[g.key] ? '' : 'primary'}" data-act="npPrint" data-k="${g.key}">${IC.print || ''} ${esc(NP.groupLabel(g))}${m.printed[g.key] ? ' · natisnjeno' : ''}</button>`).join('');
  const first = groups[0], pv = NP.pageHTML(first.page, first.items.map(it => ({ line:it.line, f:it.x.f })), { guide:true });
  const sheets = new Set(groups.map(g => g.sheet));
  return `<div class="npv-wrap"><div class="npv" aria-label="Predogled: ${esc(NP.groupLabel(first))}">${pv}</div>
    <div class="stack" style="gap:8px">
      <p class="hint" style="margin:0">Predogled prve strani. Rdeče črte so samo pomoč pri poravnavi in se ne natisnejo.</p>
      ${sheets.size > 1 ? `<div class="banner"><span>${IC.info}</span><div>Prevozov je več, kot jih stane na en list (40 vrstic): za vsak list vstavi nov obrazec.</div></div>` : ''}
      <div class="stack" style="gap:6px">${btns}</div>
      <p class="hint" style="margin:0">Tiskalnik: papir A4, merilo <b>100 %</b> (ne »prilagodi strani«), brez glave in noge. Obrazec položi tako, da se natisne na stran s tabelo PREVOZI (sprednja stran: spodaj; hrbtna: od vrha).</p>
      ${pend.length ? `<div class="banner" style="background:var(--ok-soft,var(--soft));"><span>${IC.info}</span><div>Je izpis uspel? <button type="button" class="btn sm primary" data-act="npDone">Da, zapomni vrstice</button> Potem teh prevozov ne ponudimo več.</div></div>` : ''}</div></div>`;
}
function renderNPrint(host, m){
  host.hidden = false; delete host.dataset.pk;
  const p = patientById(m.pid), n = p && (p.naloge || []).find(x => x.id === m.nid);
  const cell = (i, k, v, w, cls = '') => `<td><input data-np="${i}|${k}" value="${esc(v)}" style="width:${w}" class="${cls}" autocomplete="off" aria-label="${k}"></td>`;
  const rows = m.rows.map((x, i) => `<tr class="${x.printed ? 'np-done' : ''}"><td><input type="checkbox" data-npon="${i}" ${x.on ? 'checked' : ''} aria-label="Natisni"></td>
    ${cell(i, 'datum', x.f.datum, '88px')}${cell(i, 'od', x.f.od, '58px')}${cell(i, 'do', x.f.do, '58px')}${cell(i, 'reg', x.f.reg, '92px')}${cell(i, 'km', x.f.km, '56px')}${cell(i, 'st', x.f.st, '52px')}${cell(i, 'spr', x.f.spr, '130px')}${cell(i, 'voz', x.f.voz, '120px')}
    <td class="dim">${x.printed ? `natisnjeno (št. ${x.row})` : x.done ? '' : 'še ni opravljen'}</td></tr>`).join('');
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide nprint" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Natisni v nalog ${n && n.stevilka ? '· ' + esc(n.stevilka) : ''}</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="stack" style="gap:12px">
      <div class="banner"><span>${IC.info}</span><div>Natisnejo se <b>samo podatki posadke</b> v tabelo PREVOZI: datum, čas od–do, reg. št., km, štartnina, spremljevalec in ime voznika (podpis voznika in pacienta ostane lastnoročen). Podatki pacienta se ne natisnejo. Vrednosti lahko popraviš pred tiskom.</div></div>
      ${m.rows.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th></th><th>Datum</th><th>Od</th><th>Do</th><th>Reg. št.</th><th>km</th><th>Štartnina</th><th>Spremljevalec</th><th>Voznik</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="row"><label for="npStart">Začni v vrstici št.</label><input id="npStart" data-npstart="1" type="number" min="1" max="400" value="${m.start}" style="width:72px"><span class="hint">Prva prosta vrstica po že natisnjenih je ${NP.nextRow(n)}. Vrstice 1–11 so na sprednji strani, 12–40 na hrbtni.</span></div>
      <div data-role="npdyn" class="stack" style="gap:10px">${npDynHTML(m)}</div>` : `<div class="empty-state">Za ta nalog še ni prevozov v knjigi. Prevoz dodaj v dnevno knjigo in izberi pacienta; nato ga tukaj natisneš.</div>`}
      <div class="row" style="justify-content:space-between"><span class="hint">Poravnavo položaja nastaviš v Nastavitve → Tisk naloga.</span><button type="button" class="btn" data-act="closeModal">Zapri</button></div>
    </div></div>`;
}
function npRefreshDyn(){
  const m = UI.modal; if (!m || m.type !== 'nprint') return;
  const d = document.querySelector('[data-role=npdyn]'); if (d) d.innerHTML = npDynHTML(m);
}
function npPrintGroup(key){
  const m = UI.modal; if (!m || m.type !== 'nprint') return;
  const g = npGroups(m).find(x => x.key === key); if (!g) return;
  NP.printGroup(g); m.printed[key] = true; npRefreshDyn();
}
function npDone(){
  const m = UI.modal; if (!m || m.type !== 'nprint') return;
  const p = patientById(m.pid), n = p && (p.naloge || []).find(x => x.id === m.nid); if (!n) return;
  const at = new Date().toISOString(); let cnt = 0, max = +n.tiskRows || 0;
  npGroups(m).filter(g => m.printed[g.key]).forEach(g => g.items.forEach(it => {
    const hit = rideById(it.x.date, it.x.r.id); if (!hit) return;
    hit.r.pr = { row:it.row, sheet:g.sheet, at, f:Object.assign({}, it.x.f) }; cnt++; max = Math.max(max, it.row);
  }));
  if (cnt){ n.tiskRows = max; audit('nalog.tisk', { pid:p.id, nid:n.id, vrstic:cnt }); save(); toast(`Zapomnjenih vrstic: ${cnt}.`); }
  UI.modal = null; renderModal(); if (UI.view === 'pacienti') render();
}

/* ---------- Nastavitve → Tisk naloga ---------- */
function tiskCard(){
  const T = NP.cfg(), pv = (page) => `<div class="npv npv-s" aria-label="Preizkusna stran (${page === 'f' ? 'sprednja' : 'hrbtna'})">${NP.calibHTML(page)}</div>`;
  const num = (path, v, step, label, unit) => `<div class="field"><label for="tk-${path}">${label} <span class="dim">(${unit})</span></label>${field(path, v, { num:1, step, label })}</div>`;
  const regs = S.vehicles.filter(v => v.tip !== 'ostalo');
  return `<div class="card card-pad stack" style="gap:14px"><div class="card-head" style="margin:0"><h3>Tisk naloga za prevoz (dopolnila na obrazec)</h3></div>
    <div class="banner"><span>${IC.info}</span><div>Papirnati obrazec <b>Nalog za prevoz (NLG/05)</b> položiš v tiskalnik; aplikacija natisne <b>samo podatke posadke</b> v tabelo PREVOZI (datum, čas od–do, reg. št., km, štartnina, spremljevalec, ime voznika). Pacientovih podatkov ne natisne. Gumb »Natisni v nalog« je pri nalogu pacienta (Pacienti).</div></div>
    <div class="formgrid">
      <div class="field"><label for="tk-st">Štartnina <span class="dim">(€, natisne se pri vsakem prevozu; prazno = ne natisne)</span></label>${field('settings.tisk.startnina', T.startnina, { label:'Štartnina', ph:'npr. 3,50' })}</div>
      <div class="field"><label for="tk-kd">Decimalke pri km</label><select data-path="settings.tisk.kmDec" id="tk-kd"><option value="1" ${+T.kmDec === 1 ? 'selected' : ''}>ena (23,4)</option><option value="0" ${+T.kmDec === 0 ? 'selected' : ''}>cele km (23)</option></select></div>
      <div class="field"><label for="tk-od">Čas »od« je</label><select data-path="settings.tisk.od" id="tk-od"><option value="v_vozilu" ${T.od !== 'na_poti' ? 'selected' : ''}>pacient v vozilu (začetek poti OD → DO)</option><option value="na_poti" ${T.od === 'na_poti' ? 'selected' : ''}>odhod posadke k pacientu</option></select></div>
      <div class="field"><span class="lbl">Ime voznika</span><label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="settings.tisk.voznik" data-bool="1" ${T.voznik ? 'checked' : ''}> natisni v celico »Podpis voznika« (podpis ostane lastnoročen)</label></div>
    </div>
    <div class="card-head" style="margin:4px 0 0"><h3 style="font-size:15px">Poravnava na obrazec</h3></div>
    <p class="hint" style="margin:0">Obrazec predpostavlja list A4. Natisni preizkusno stran na navaden papir, jo skupaj z obrazcem pridrži proti svetlobi in popravi, če črte ne sedejo. Premik: pozitivno pomakne desno/navzdol.</p>
    <div class="formgrid">${num('settings.tisk.dx', T.dx, 0.5, 'Premik vodoravno', 'mm')}${num('settings.tisk.dy', T.dy, 0.5, 'Premik navpično', 'mm')}${num('settings.tisk.sx', T.sx, 0.5, 'Širina', '%')}${num('settings.tisk.sy', T.sy, 0.5, 'Višina', '%')}${num('settings.tisk.fs', T.fs, 0.5, 'Velikost pisave', 'pt')}</div>
    <div class="row"><button type="button" class="btn" data-act="npCalib" data-p="f">Natisni preizkus: sprednja stran</button><button type="button" class="btn" data-act="npCalib" data-p="b">Natisni preizkus: hrbtna stran</button></div>
    <div class="row" style="gap:16px;align-items:flex-start">${pv('f')}${pv('b')}</div>
    <p class="hint" style="margin:0">Registrske tablice so pri vozilih (Nastavitve → Vozila): ${regs.length ? regs.map(v => `${esc(v.name)} ${v.reg ? '<b>' + esc(v.reg) + '</b>' : '<span class="dim">(ni vnešena)</span>'}`).join(' · ') : 'ni vozil'}. Posadka (voznik, spremljevalec) in vozilo se vzamejo iz razporeda dneva, čas in km iz zabeleženih časov in kilometrine.</p></div>`;
}

/* ---------- Dogodki obrazcev (vnos v modalih) ---------- */
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('input', e => {
    const t = e.target, m = UI.modal; if (!t || !m) return;
    if (m.type === 'nscan'){ if (t.id === 'nsText') m.text = t.value; else if (t.dataset && t.dataset.ns){ m.f[t.dataset.ns] = t.value; } }
  });
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m) return;
    if (m.type === 'nscan'){
      if (t.id === 'nsFile'){ const fl = t.files && t.files[0]; t.value = ''; nsFile(fl); }
      else if (t.dataset && t.dataset.ns !== undefined){ m.f[t.dataset.ns] = t.value; if (t.dataset.ns === 'vrsta' || t.dataset.ns === 'izdan'){ if (t.dataset.ns === 'vrsta' && !m.f.veljaDo){ /* privzeta veljavnost se izračuna ob shranjevanju */ } } }
      else if (t.dataset && t.dataset.nswho !== undefined){ m.usePid = t.dataset.nswho; }
    } else if (m.type === 'nprint'){
      if (t.dataset && t.dataset.npon !== undefined){ m.rows[+t.dataset.npon].on = t.checked; npRefreshDyn(); }
      else if (t.dataset && t.dataset.np){ const [i, k] = t.dataset.np.split('|'); m.rows[+i].f[k] = t.value; npRefreshDyn(); }
      else if (t.dataset && t.dataset.npstart){ m.start = Math.max(1, Math.floor(+t.value) || 1); npRefreshDyn(); }
    }
  });
}
