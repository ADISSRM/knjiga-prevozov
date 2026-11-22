/* =====================================================================
   VMESNIK: tisk knjige za mesec (pogovorno okno) in skeniranje strani papirne knjige (pregled z označbami nejasnega)
   ===================================================================== */

/* ---------- Tisk knjige za mesec ---------- */
function bkOpen(){
  const { y, m } = UI.month;
  UI.modal = { type:'bprint', y, m, o:BOOK.load(), b:null, wait:false, tries:0, err:'', t:0 };
  bkEnsure(UI.modal); renderModal(); bkBuildSoon(UI.modal, 30);
}
function bkEnsure(m){
  const a = `${m.y}-${pad(m.m + 1)}-01`, b = `${m.y}-${pad(m.m + 1)}-${pad(daysInMonth(m.y, m.m))}`;
  try { ensureRange(a, b); } catch (e) { /* lokalni način */ }
}
function bkBuildSoon(m, delay){
  clearTimeout(m.t); m.b = null;
  m.t = setTimeout(() => {
    if (UI.modal !== m) return;
    if (!BOOK.monthReady(m.y, m.m)){
      m.tries++; m.wait = m.tries < 20; if (!m.wait) m.err = 'Podatkov za ta mesec ni mogoče naložiti (preveri povezavo).';
      renderModal(); if (m.wait) m.t = setTimeout(() => bkBuildSoon(m, 0), 1200); return;
    }
    m.wait = false; m.err = '';
    try { m.b = BOOK.build(m.y, m.m, m.o); } catch (e) { m.err = 'Knjige ni mogoče sestaviti: ' + String(e && e.message || e); }
    if (UI.modal === m) renderModal();
  }, delay);
}
function renderBPrint(host, m){
  host.hidden = false; delete host.dataset.pk;
  const o = m.o, b = m.b;
  const chk = (k, label, hint) => `<label class="row bk-opt" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-bk="${k}" ${o[k] ? 'checked' : ''}><span><b>${label}</b>${hint ? `<span class="hint" style="display:block">${hint}</span>` : ''}</span></label>`;
  const info = m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>`
    : m.wait ? '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span role="status">Podatki za ta mesec se nalagajo …</span></div>'
    : !b ? '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span role="status">Sestavljam knjigo …</span></div>'
    : `<div class="banner"><span>${IC.info}</span><div role="status"><b>${b.pages}</b> strani${o.duplex ? ` (<b>${b.sheets}</b> listov, obojestransko)` : ''} · ${b.days} dni · <b>${b.rides}</b> prevozov${b.canc ? `, ${b.canc} odpovedanih` : ''}.</div></div>`;
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide bprint" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Natisni knjigo meseca</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="stack" style="gap:12px">
      <div class="field"><label for="bk-ym">Mesec</label><input id="bk-ym" type="month" data-bk="ym" value="${m.y}-${pad(m.m + 1)}" style="max-width:220px"></div>
      <div class="stack" style="gap:8px">
        ${chk('front', 'Naslovnica in kazalo', 'prva stran: naslovnica, druga: kazalo z datumi in številkami strani')}
        ${chk('duplex', 'Obojestransko, vsak dan na nov list', 'dan se začne na desni strani; zadnja stran dneva je črtana stran za opombe; rob za vezavo se menja po straneh')}
        ${chk('summary', 'Mesečni povzetek na koncu', 'število prevozov, kilometrina in prevozi po vozilih, podpis')}
        ${chk('skipEmpty', 'Izpusti dneve brez vpisov', 'privzeto so v knjigi vsi dnevi meseca, tudi prazni')}
        ${chk('km', 'Stolpec »Km« pri prevozih', 'ga v papirni knjigi ni; kilometrina OD→DO po cestah')}
        <div class="field" style="max-width:220px"><label for="bk-gut">Rob za vezavo (mm)</label><input id="bk-gut" type="number" min="0" max="30" step="1" data-bk="gut" value="${o.gut}" inputmode="numeric"></div>
      </div>
      ${info}
      <p class="hint" style="margin:0">Tiskalnik: papir <b>A4 pokončno</b>, merilo <b>100 %</b> (ne »prilagodi strani«), brez glave in noge. Obojestransko: obrni ob <b>dolgem robu</b>. V pogovornem oknu tiskanja lahko izbereš tudi »Shrani kot PDF«. Strani so oštevilčene in v kazalu.</p>
      <p class="hint" style="margin:0">Opravljeni prevozi imajo dejansko uro pobiranja, vozilo in ime tistega, ki je prevoz opravil (✓), če je to vpisano. Prevozi z oznako ⚠ so bili prebrani s fotografije in še niso potrjeni.</p>
      <div class="row" style="justify-content:space-between;flex-wrap:wrap"><button type="button" class="btn" data-act="bkList" title="Starejši, krajši izpis: ena tabela po dnevih, A4 ležeče">Samo seznam (ležeče)</button>
        <span class="row"><button type="button" class="btn" data-act="closeModal">Zapri</button><button type="button" class="btn primary" data-act="bkPrint" ${(b && !m.wait) ? '' : 'disabled'}>Natisni knjigo</button></span></div>
    </div></div>`;
}
function bkPrint(){
  const m = UI.modal; if (!m || m.type !== 'bprint') return;
  if (!BOOK.monthReady(m.y, m.m)){ m.err = 'Podatki za ta mesec se še nalagajo. Počakaj trenutek.'; renderModal(); return; }
  BOOK.store(m.o);
  let b; try { b = BOOK.build(m.y, m.m, m.o); } catch (e) { m.err = 'Knjige ni mogoče sestaviti: ' + String(e && e.message || e); renderModal(); return; }
  BOOK.print(m.y, m.m, m.o, b);
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bprint' || !t.dataset || t.dataset.bk === undefined) return;
    const k = t.dataset.bk;
    if (k === 'ym'){
      const mm = /^(\d{4})-(\d{2})$/.exec(t.value); if (!mm) return;
      m.y = +mm[1]; m.m = +mm[2] - 1; m.tries = 0; bkEnsure(m);
    } else if (k === 'gut') m.o.gut = t.value;
    else m.o[k] = t.checked;
    m.o = BOOK.opts(m.o); BOOK.store(m.o);
    renderModal(); bkBuildSoon(m, 30);
  });
}

/* ---------- Skeniranje strani papirne knjige ----------
   Fotografija → branje v napravi (BSCAN) → pregled vsake vrstice s sliko izreza in označbami:
   ✔ zeleno = prebrano zanesljivo, ⚠ rumeno = preveri, ✖ rdeče = popravi. Karkoli ostane nepotrjeno, se vpiše z oznako ⚠ (ride.chk),
   ki ostane vidna v dnevu, v opozorilih in v natisnjeni knjigi, dokler dispečer ne pritisne »Preverjeno«. Slika in besedilo se ne shranita. */
const BS_LABEL = { ok:'prebrano', chk:'preveri', bad:'popravi' };
const BS_SYM = { ok:'✔', chk:'⚠', bad:'✖' };
const BS_FIELDS = [['name', 'Ime in priimek', 'text', 'bs-c4'], ['from', 'Od', 'text', 'bs-c4'], ['to', 'Do', 'text', 'bs-c4'], ['time', 'Ura', 'text', 'bs-c2']];
const bsWorst = (a, b) => (BSCAN.LV[b] > BSCAN.LV[a] ? b : a);
const bsNr = row => { const n = parseInt(String(row.nrEdit == null ? '' : row.nrEdit).trim(), 10); return n >= 1 && n <= 60 ? n : null; };
const bsDateOk = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !isNaN(new Date(d + 'T12:00:00'));
function bsOpen(){
  UI.modal = { type:'bscan', step:'in', busy:'', err:'', date:(UI.view === 'dan' && UI.date) || '', dateSrc:(UI.view === 'dan' && UI.date) ? 'user' : '', dateTouched:false, rows:[], notes:[], only:false, done:null, doneTouched:false, pages:0, words:0, empties:0, jumpKey:'' };
  renderModal();
}
/* raven polja po popravkih dispečerja: urejeno polje velja za pregledano, če ni prazno (ura: veljavna) */
function bsLvl(row, k){
  const fl = row.fl[k]; if (!fl) return 'ok';
  if (!row.touched[k]) return fl.lvl;
  const v = String(row.f[k] || '').trim();
  if (k === 'time') return v ? (BSCAN.parseTime(v).v ? 'ok' : 'bad') : ((row.f.dia || row.f.mode === 'vzorci') ? 'ok' : 'chk');
  if (k === 'note') return 'ok';
  if (k === 'from' && row.f.mode === 'vzorci') return 'ok';
  return v ? 'ok' : 'bad';
}
function bsNrLvl(m, row){
  const n = bsNr(row); if (n == null) return 'bad';
  const dup = m.rows.some(x => x !== row && x.on && bsNr(x) === n);
  if (row.touched.nr) return dup ? 'chk' : 'ok';
  return dup || row.nrLvl === 'chk' ? 'chk' : 'ok';
}
function bsRowLvl(m, row){
  let l = 'ok'; ['name', 'from', 'to', 'time', 'note'].forEach(k => { l = bsWorst(l, bsLvl(row, k)); });
  const nl = bsNrLvl(m, row); if (nl !== 'ok') l = bsWorst(l, 'chk');
  return l;
}
function bsTodo(m, row){
  const t = ['name', 'from', 'to', 'time', 'note'].filter(k => bsLvl(row, k) !== 'ok').map(k => BSCAN.FIELD_LABEL[k]);
  if (bsNrLvl(m, row) !== 'ok') t.push('št. polja');
  return t.join(', ');
}
function bsReason(row, k){
  const fl = row.fl[k], l = bsLvl(row, k);
  if (l === 'ok') return row.touched[k] && fl && fl.lvl !== 'ok' ? '✔ popravljeno' : ((fl && fl.why && fl.why[0] && /prepoznano kot/.test(fl.why[0])) ? fl.why[0] : '');
  if (row.touched[k]) return k === 'time' ? 'ure ne razberem: vpiši npr. 8:30' : 'polje je prazno';
  const why = (fl && fl.why || []).join('; ');
  return (BS_SYM[l] + ' ') + (why || (l === 'bad' ? 'ni prebrano' : 'preveri s sliko'));
}
function bsStats(m){
  const s = { ok:0, chk:0, bad:0, on:0, flagged:0 };
  m.rows.forEach(r => { const l = bsRowLvl(m, r); s[l]++; if (r.on){ s.on++; if (l !== 'ok') s.flagged++; } });
  return s;
}
function bsFieldHTML(m, row, k, label, cls){
  const id = `bs-${row.key}-${k}`, l = bsLvl(row, k), why = bsReason(row, k), sug = (row.fl[k].sug || []).slice(0, 3);
  const chips = (l !== 'ok' && !row.touched[k]) ? sug.map((s, i) => `<button type="button" class="chip toggle bs-sug" data-act="bsSug" data-k="${row.key}|${k}|${i}">${esc(s.label)}</button>`).join('') : '';
  return `<div class="field bs-f ${cls || ''}" data-lv="${l}" data-bsf="${k}"><label for="${id}">${esc(label)}</label>
    <input id="${id}" type="text" data-bs="f" data-key="${row.key}" data-k="${k}" value="${esc(row.f[k] || '')}" autocomplete="off" ${k === 'time' ? 'inputmode="numeric" maxlength="8" placeholder="08:00"' : ''} ${l === 'bad' ? 'aria-invalid="true"' : ''} aria-describedby="${id}-w">
    <div class="bs-reason" id="${id}-w" role="note">${esc(why)}</div><div class="bs-sugs">${chips}</div></div>`;
}
function bsRowHTML(m, row){
  const l = bsRowLvl(m, row), todo = bsTodo(m, row);
  const modeSel = `<div class="field bs-f bs-c2" data-lv="ok"><label for="bs-${row.key}-mode">Način</label><select id="bs-${row.key}-mode" data-bs="f" data-key="${row.key}" data-k="mode">${Object.entries(MODES).map(([v, t]) => `<option value="${v}" ${(row.f.mode || 'sede') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  const diaSel = `<div class="field bs-f bs-c2" data-lv="ok"><label for="bs-${row.key}-dia">Dializa</label><select id="bs-${row.key}-dia" data-bs="f" data-key="${row.key}" data-k="dia"><option value="" ${!row.f.dia ? 'selected' : ''}>ne</option><option value="dop" ${row.f.dia === 'dop' ? 'selected' : ''}>dopoldne</option><option value="pop" ${row.f.dia === 'pop' ? 'selected' : ''}>popoldne</option></select></div>`;
  return `<article class="bs-row" data-bsrow="${row.key}" data-lv="${l}" ${m.only && l === 'ok' ? 'hidden' : ''}>
    <div class="bs-head"><label class="check bs-on"><input type="checkbox" data-bs="on" data-key="${row.key}" ${row.on ? 'checked' : ''}> Vpiši</label>
      <label class="bs-nr" for="bs-${row.key}-nr">Polje <input id="bs-${row.key}-nr" type="number" min="1" max="60" inputmode="numeric" data-bs="nr" data-key="${row.key}" value="${esc(row.nrEdit)}" data-lv="${bsNrLvl(m, row)}"></label>
      <span class="bs-lv" data-role="bslv"><span aria-hidden="true">${BS_SYM[l]}</span> ${BS_LABEL[l]}</span><span class="bs-todo" data-role="bstodo">${todo ? '· ' + esc(todo) : ''}</span><span class="sp"></span>
      <button type="button" class="btn sm" data-act="bsConfirm" data-key="${row.key}" data-role="bsconf" ${l === 'ok' ? 'hidden' : ''} title="Primerjal sem s sliko: vse je prav">Vse je prav</button></div>
    ${row.crop ? `<div class="bs-cropwrap"><img class="bs-crop" src="${row.crop}" alt="Izrez vrstice ${esc(row.nrEdit || '')} s fotografije"></div>` : ''}
    <div class="bs-grid">${BS_FIELDS.map(([k, lb, , c]) => bsFieldHTML(m, row, k, lb, c)).join('')}${modeSel}${diaSel}
      <div class="field bs-f bs-c6" data-lv="${bsLvl(row, 'note')}" data-bsf="note"><label for="bs-${row.key}-note">Opomba</label><input id="bs-${row.key}-note" type="text" data-bs="f" data-key="${row.key}" data-k="note" value="${esc(row.f.note || '')}" autocomplete="off"><div class="bs-reason">${esc(bsReason(row, 'note'))}</div></div></div></article>`;
}
function bsSumHTML(m){
  const s = bsStats(m), bad = s.chk + s.bad;
  const head = !m.rows.length ? '' : bad ? `<span class="bs-cnt" data-lv="ok">✔ ${s.ok} prebrano</span><span class="bs-cnt" data-lv="chk">⚠ ${s.chk} preveri</span><span class="bs-cnt" data-lv="bad">✖ ${s.bad} popravi</span>`
    : `<span class="bs-cnt" data-lv="ok">✔ Vseh ${s.ok} vrstic je prebranih zanesljivo.</span>`;
  return `${head}<span class="sp"></span>${bad ? `<button type="button" class="btn sm primary" data-act="bsJump">Skoči na naslednje nejasno</button>` : ''}
    <label class="check"><input type="checkbox" data-bs="only" ${m.only ? 'checked' : ''}> Samo nejasno</label>`;
}
function bsApplyLabel(m){
  const s = bsStats(m);
  return `Vpiši ${s.on} ${s.on === 1 ? 'prevoz' : 'prevozov'}${bsDateOk(m.date) ? ' v ' + fmtLong(m.date) : ''}${s.flagged ? ` (${s.flagged} z oznako ⚠)` : ''}`;
}
function bsDateHTML(m){
  const ok = bsDateOk(m.date), l = !ok ? 'bad' : (m.dateSrc === 'ocr' && !m.dateTouched ? 'chk' : 'ok');
  const why = !ok ? '✖ datuma na strani ni mogoče prebrati: vpiši ga' : l === 'chk' ? '⚠ datum je prebran s fotografije: preveri, preden vpišeš' : '';
  const have = ok ? (S.rides[m.date] || []).filter(isFilled).length : 0;
  return `<div class="field bs-f" data-lv="${l}" data-role="bsdate" style="max-width:260px"><label for="bs-date">Datum strani</label><input id="bs-date" type="date" data-bs="date" value="${esc(m.date)}" ${l === 'bad' ? 'aria-invalid="true"' : ''}><div class="bs-reason">${esc(why)}</div></div>
    ${have ? `<div class="banner"><span>${IC.info}</span><div>Ta dan ima že <b>${have}</b> vpisov. Vrstice se vpišejo v svoje polje; če je zasedeno, v prvo prosto. Enaki prevozi se preskočijo.</div></div>` : ''}`;
}
function renderBScan(host, m){
  host.hidden = false; delete host.dataset.pk;
  const ocrOn = NSCAN.ocrEnabled();
  let body;
  if (m.step === 'review'){
    const list = m.rows.map(r => bsRowHTML(m, r)).join('');
    body = `<div class="bs-sum" data-role="bssum" role="status">${bsSumHTML(m)}</div>
      ${m.notes.length ? `<div class="banner" style="background:var(--warn-soft);color:var(--warn)"><span>${IC.alert}</span><div>${m.notes.map(n => esc(n)).join('<br>')}</div></div>` : ''}
      <div class="row" style="gap:16px;align-items:flex-start;flex-wrap:wrap">${bsDateHTML(m)}
        <label class="check" style="margin-top:22px" title="Prevozi s te strani so že narejeni (knjiga za nazaj): označijo se kot opravljeni"><input type="checkbox" data-bs="done" ${m.done ? 'checked' : ''}> Prevozi so že opravljeni</label></div>
      <p class="hint" style="margin:0">Primerjaj vsako vrstico s sliko izreza. Rumena in rdeča polja so tista, ki jih nisem razumel: izberi predlog, popravi ali pritisni »Vse je prav«. Rdeče vrstice niso izbrane za vpis. Karkoli ostane nepotrjeno, se vpiše z oznako <b>⚠ preveri</b>, ki ostane vidna v dnevu in v natisnjeni knjigi, dokler je ne potrdiš.${m.empties ? ` · Prazne vrstice: ${m.empties}.` : ''}</p>
      <div class="bs-list" data-role="bslist">${list || '<div class="empty-state">Na strani ni vpisanih vrstic.</div>'}</div>
      ${m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row bs-foot" style="justify-content:space-between;flex-wrap:wrap"><button type="button" class="btn" data-act="bsBack">Nazaj (nova fotografija)</button>
        <span class="row"><button type="button" class="btn" data-act="closeModal">Prekliči</button><button type="button" class="btn primary" data-act="bsApply" data-role="bsapply">${esc(bsApplyLabel(m))}</button></span></div>`;
  } else {
    body = `<div class="banner"><span>${IC.info}</span><div>Fotografiraj stran papirne knjige (ali izberi PDF-sken). Aplikacija prebere številke polj, imena, naslove in ure ter jih postavi v dan. <b>Fotografija se ne pošlje nikamor in se ne shrani</b>; branje poteka v tej napravi (prvič se prenese program za razpoznavo besedila).</div></div>
      <div class="stack" style="gap:8px"><div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn primary" for="bsFile" style="cursor:pointer">${ocrOn ? 'Izberi fotografije ali PDF' : 'Razpoznava izklopljena'}</label>
        <label class="btn" for="bsCam" style="cursor:pointer">Fotografiraj</label></div>
        <input id="bsFile" type="file" accept="image/*,application/pdf,.pdf" multiple style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        <input id="bsCam" type="file" accept="image/*" capture="environment" style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        ${m.busy ? `<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span data-role="bsbusy" role="status">${esc(m.busy)}</span></div>` : ''}</div>
      <ul class="hint bs-tips" style="margin:0;padding-left:18px">
        <li>Knjigo položi ravno, v celoti v kader, brez sence in bliska; telefon drži vzporedno z listom.</li>
        <li>Ena fotografija = ena stran. Za dan z več stranmi izberi več fotografij naenkrat (isti dan).</li>
        <li><b>Tiskano ali lepo berljivo pisavo</b> aplikacija prebere dobro. <b>Hitro ročno pisavo pogosto napačno</b>: takšna polja dobijo oznako ⚠ ali ✖ in jih preveriš s sliko vrstice. Nič se ne vpiše neopazno.</li>
      </ul>
      ${m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button></div>`;
  }
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide bscan" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Skeniraj stran knjige</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div><div class="stack" style="gap:12px">${body}</div></div>`;
}
async function bsFiles(list){
  const m = UI.modal; if (!m || m.type !== 'bscan') return;
  const files = Array.from(list || []).filter(Boolean); if (!files.length) return;
  if (!NSCAN.ocrEnabled()){ m.err = 'Razpoznava besedila iz slike ni vklopljena (config.js → ocr).'; renderModal(); return; }
  m.err = ''; m.busy = 'Pripravljam sliko …'; renderModal();
  try {
    const res = await BSCAN.run(files, p => {
      const el = document.querySelector('[data-role=bsbusy]'); if (!el) return;
      const pc = p.pct != null && isFinite(p.pct) && p.pct > 0 ? ' ' + Math.round(p.pct * 100) + ' %' : '';
      el.textContent = (p.page && p.pages > 1 ? `Stran ${p.page}/${p.pages}: ` : '') + (p.stage === 'lib' ? 'nalagam razpoznavo besedila (prvič lahko traja minuto ali dve) …' : p.stage === 'prep' ? 'pripravljam sliko …' : 'berem besedilo …' + pc);
    });
    if (UI.modal !== m) return;
    bsLoad(m, res);
  } catch (e) { m.err = String(e && e.message || e); }
  m.busy = '';
  if (UI.modal === m) renderModal();
}
function bsLoad(m, res){
  const rows = res.rows.filter(r => !r.empty);
  m.rows = rows.map(r => Object.assign({}, r, { f:Object.assign({}, r.f), touched:{}, on:r.lvl !== 'bad', nrEdit:r.nr == null ? '' : String(r.nr) }));
  m.empties = res.rows.length - rows.length; m.notes = res.notes || []; m.pages = res.pages.length; m.words = res.words;
  if (res.date && res.date.iso){ m.date = res.date.iso; m.dateSrc = 'ocr'; m.dateTouched = false; }
  if (!rows.length){ m.step = 'in'; m.err = 'Na sliki nisem našel nobene vpisane vrstice. Poskusi znova: stran naj bo ravna, v celoti v kadru in dobro osvetljena.'; return; }
  if (!m.doneTouched) m.done = bsDateOk(m.date) && m.date < todayStr();
  m.step = 'review'; m.err = ''; m.jumpKey = '';
}
/* osvežitev prikaza brez ponovnega izrisa (ohrani fokus in drsenje) */
function bsPaintRow(m, row){
  const card = document.querySelector(`[data-bsrow="${row.key}"]`); if (!card) return;
  const l = bsRowLvl(m, row); card.dataset.lv = l;
  const lv = card.querySelector('[data-role=bslv]'); if (lv) lv.innerHTML = `<span aria-hidden="true">${BS_SYM[l]}</span> ${BS_LABEL[l]}`;
  const td = card.querySelector('[data-role=bstodo]'); if (td){ const t = bsTodo(m, row); td.textContent = t ? '· ' + t : ''; }
  const cf = card.querySelector('[data-role=bsconf]'); if (cf) cf.hidden = l === 'ok';
  const nr = card.querySelector('[data-bs=nr]'); if (nr) nr.dataset.lv = bsNrLvl(m, row);
  card.querySelectorAll('.bs-f[data-bsf]').forEach(w => {
    const k = w.dataset.bsf, lk = bsLvl(row, k); w.dataset.lv = lk;
    const r = w.querySelector('.bs-reason'); if (r) r.textContent = bsReason(row, k);
    const inp = w.querySelector('input'); if (inp){ if (lk === 'bad') inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
    const sg = w.querySelector('.bs-sugs'); if (sg && (lk === 'ok' || row.touched[k])) sg.innerHTML = '';
  });
}
function bsPaintAll(m){
  m.rows.forEach(r => bsPaintRow(m, r));
  const sm = document.querySelector('[data-role=bssum]'); if (sm) sm.innerHTML = bsSumHTML(m);
  const ap = document.querySelector('[data-role=bsapply]'); if (ap) ap.textContent = bsApplyLabel(m);
}
function bsPaintDate(m){
  const w = document.querySelector('[data-role=bsdate]'); if (!w) return;
  const wrap = document.createElement('div'); wrap.innerHTML = bsDateHTML(m);
  const nw = wrap.querySelector('[data-role=bsdate]'); w.dataset.lv = nw.dataset.lv; w.querySelector('.bs-reason').textContent = nw.querySelector('.bs-reason').textContent;
  const ap = document.querySelector('[data-role=bsapply]'); if (ap) ap.textContent = bsApplyLabel(m);
  const ban = w.nextElementSibling && w.nextElementSibling.classList.contains('banner') ? w.nextElementSibling : null, nb = wrap.querySelector('.banner');
  if (ban && !nb) ban.remove(); else if (ban && nb) ban.innerHTML = nb.innerHTML; else if (!ban && nb) w.insertAdjacentElement('afterend', nb);
}
function bsRow(m, key){ return m.rows.find(r => r.key === key); }
function bsConfirm(key){
  const m = UI.modal; if (!m || m.type !== 'bscan') return; const row = bsRow(m, key); if (!row) return;
  ['name', 'from', 'to', 'time', 'note', 'nr'].forEach(k => { row.touched[k] = true; });
  row.on = true; const cb = document.querySelector(`[data-bsrow="${key}"] [data-bs=on]`); if (cb) cb.checked = true;
  bsPaintAll(m);
}
function bsSug(el){
  const m = UI.modal; if (!m || m.type !== 'bscan') return; const [key, k, i] = String(el.dataset.k).split('|'), row = bsRow(m, key); if (!row) return;
  const s = (row.fl[k].sug || [])[+i]; if (!s) return;
  row.f[k] = s.label; row.touched[k] = true; if (k === 'name') row.f.pid = s.pid || '';
  const inp = document.getElementById(`bs-${key}-${k}`); if (inp) inp.value = s.label;
  bsPaintAll(m);
}
function bsJump(){
  const m = UI.modal; if (!m || m.type !== 'bscan') return;
  const all = [...document.querySelectorAll('.bs-row')];
  const from = m.jumpKey ? all.findIndex(c => c.dataset.bsrow === m.jumpKey) + 1 : 0;
  const next = all.slice(from).find(c => c.dataset.lv !== 'ok' && !c.hidden) || all.find(c => c.dataset.lv !== 'ok' && !c.hidden);
  if (!next){ toast('Nič več ni označeno'); return; }
  m.jumpKey = next.dataset.bsrow;
  try { next.scrollIntoView({ block:'center', behavior:'smooth' }); } catch (e) { next.scrollIntoView(); }
  next.classList.remove('bs-flash'); void next.offsetWidth; next.classList.add('bs-flash');
  const inp = next.querySelector('.bs-f[data-lv=bad] input, .bs-f[data-lv=chk] input') || next.querySelector('input[data-bs=f]');
  if (inp) { try { inp.focus({ preventScroll:true }); } catch (e) { inp.focus(); } }
}
function bsBack(){ const m = UI.modal; if (!m || m.type !== 'bscan') return; m.step = 'in'; m.rows = []; m.err = ''; m.notes = []; renderModal(); }
function bsApply(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.step !== 'review') return;
  if (!bsDateOk(m.date)){ m.err = 'Vpiši datum strani.'; renderModal(); return; }
  const date = m.date, mm = { y:+date.slice(0, 4), m:+date.slice(5, 7) - 1 };
  bkEnsure(mm);
  if (!BOOK.monthReady(mm.y, mm.m)){ m.err = 'Podatki za ta mesec se še nalagajo. Počakaj trenutek in poskusi znova.'; renderModal(); return; }
  const sel = m.rows.filter(r => r.on).sort((a, b) => (bsNr(a) == null ? 999 : bsNr(a)) - (bsNr(b) == null ? 999 : bsNr(b)));
  if (!sel.length){ m.err = 'Ni izbranih vrstic za vpis.'; renderModal(); return; }
  const a = ensureDay(date); let n = 0, dup = 0, moved = 0, flagged = 0; const put = [];
  for (const row of sel){
    const f = row.f, nr = bsNr(row), nm = String(f.name || '').trim(), fr = String(f.from || '').trim(), to = String(f.to || '').trim();
    if (!nm && !fr && !to) continue;
    if (a.some(x => isFilled(x) && !x.odpovedano && norm(x.name) === norm(nm) && norm(x.from) === norm(fr) && norm(x.to) === norm(to) && (x.time || '') === (f.time || ''))){ dup++; continue; }
    let i = -1;
    if (nr){ while (a.length < nr) a.push(blankRide()); if (!isFilled(a[nr - 1])) i = nr - 1; }
    if (i < 0){ i = a.findIndex(x => !isFilled(x)); if (i < 0){ a.push(blankRide()); i = a.length - 1; } if (nr) moved++; }
    const t = a[i], tm = f.time ? (BSCAN.parseTime(f.time).v || '') : '';
    Object.assign(t, blankRide(), { id:t.id, name:nm, from:fr, to, time:tm, mode:f.mode || 'sede', dia:f.dia || '', note:f.note || '' });
    if (t.mode === 'vzorci' && !t.name) t.name = 'Vzorci';
    if (f.pid){ applyPatientToRide(date, t.id, f.pid, { keepMode:!!f.mode }); t.from = fr || t.from; t.to = to || t.to; t.note = f.note || ''; }
    if (m.done){ t.done = true; t.doneAt = ''; }
    t.chk = bsTodo(m, row); if (t.chk) flagged++;
    put.push({ t, ok:!t.chk }); n++;
  }
  save();
  put.forEach(({ t, ok }) => { try { afterAddressChange(date, t, 'to'); } catch (e) { /* kilometrina se izračuna pozneje */ } if (ok && t.from && typeof learnAddress === 'function') learnAddress(t.from); });
  audit('knjiga.skenirano', { dan:date, n, chk:flagged, strani:m.pages });
  UI.modal = null; renderModal(); UI.date = date;
  toast(`Vpisanih ${n} prevozov${flagged ? ` · ${flagged} z oznako ⚠ preveri` : ''}${dup ? ` · ${dup} že vpisanih preskočenih` : ''}${moved ? ` · ${moved} v drugo polje (zasedeno)` : ''}`);
  go('dan');
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('input', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bscan' || !t.dataset) return;
    if (t.dataset.bs === 'f'){ const row = bsRow(m, t.dataset.key); if (row){ row.f[t.dataset.k] = t.value; if (t.dataset.k === 'name') row.f.pid = ''; } }
    else if (t.dataset.bs === 'nr'){ const row = bsRow(m, t.dataset.key); if (row) row.nrEdit = t.value; }
  });
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bscan') return;
    if (t.id === 'bsFile' || t.id === 'bsCam'){ const fl = t.files ? Array.from(t.files) : []; t.value = ''; bsFiles(fl); return; }
    const b = t.dataset && t.dataset.bs; if (b === undefined) return;
    if (b === 'f'){
      const row = bsRow(m, t.dataset.key), k = t.dataset.k; if (!row) return;
      row.f[k] = t.value; if (k === 'name') row.f.pid = '';
      if (k === 'time'){ const p = BSCAN.parseTime(t.value); if (p.v){ row.f.time = p.v; t.value = p.v; } else if (p.dia){ row.f.dia = p.dia; row.f.time = ''; t.value = ''; } }
      if (['name', 'from', 'to', 'time'].includes(k)) row.touched[k] = true;
      if (k === 'mode' && t.value === 'vzorci') row.touched.from = true;
      bsPaintAll(m);
    } else if (b === 'nr'){ const row = bsRow(m, t.dataset.key); if (row){ row.nrEdit = t.value; row.touched.nr = true; bsPaintAll(m); } }
    else if (b === 'on'){ const row = bsRow(m, t.dataset.key); if (row){ row.on = t.checked; bsPaintAll(m); } }
    else if (b === 'only'){ m.only = t.checked; renderModal(); }
    else if (b === 'done'){ m.done = t.checked; m.doneTouched = true; }
    else if (b === 'date'){ m.date = t.value; m.dateTouched = true; m.dateSrc = 'user'; if (!m.doneTouched) { m.done = bsDateOk(m.date) && m.date < todayStr(); const cb = document.querySelector('[data-bs=done]'); if (cb) cb.checked = m.done; } bsPaintDate(m); }
  });
}
