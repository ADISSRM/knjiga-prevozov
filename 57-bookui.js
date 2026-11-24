/* =====================================================================
   VMESNIK: tisk knjige za mesec (pogovorno okno) in skeniranje strani papirne knjige (pregled z označbami nejasnega)
   ===================================================================== */

/* ---------- Predogled in tisk knjige za mesec ----------
   Okno: mesec → predogled strani (ena stran naenkrat, enaka natisnjeni; telefon in računalnik) → tisk ali odpiranje v zavihku (PDF).
   Predogled je izoliran okvir (sandbox, brez skript) z istim dokumentom, kot gre v tisk (BOOK.doc). */
const BK_W = 794, BK_H = 1119;   // A4 (210 × 296 mm) v CSS pikslih pri 96 dpi
function bkOpen(){
  const { y, m } = UI.month, wide = typeof window !== 'undefined' && window.innerWidth >= 900;
  UI.modal = { type:'bprint', y, m, o:BOOK.load(), b:null, wait:false, tries:0, err:'', msg:'', t:0, pg:1, zoom:'fit', optOpen:wide, bid:0 };
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
    try { m.b = BOOK.build(m.y, m.m, m.o); m.bid++; m.pg = Math.min(m.b.pages, Math.max(1, m.pg | 0)); } catch (e) { m.err = 'Knjige ni mogoče sestaviti: ' + String(e && e.message || e); }
    if (UI.modal === m) renderModal();
  }, delay);
}
const bkCoarse = () => { try { return !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches); } catch (e) { return false; } };
function bkJumps(b){
  const o = b.opts, out = [];
  if (o.front){ out.push(['Naslovnica', 1], ['Kazalo', 2]); }
  b.dayStart.forEach(d => out.push([`${fmtDMY(d.date)} · ${DOW_LONG[dow(d.date)]}`, d.page]));
  if (o.summary) out.push(['Mesečni povzetek', b.pages]);
  return out;
}
function renderBPrint(host, m){
  host.hidden = false; delete host.dataset.pk;
  const o = m.o, b = m.b, coarse = bkCoarse();
  const chk = (k, label, hint) => `<label class="row bk-opt" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-bk="${k}" ${o[k] ? 'checked' : ''}><span><b>${label}</b>${hint ? `<span class="hint" style="display:block">${hint}</span>` : ''}</span></label>`;
  const info = m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>`
    : m.wait ? '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span role="status">Podatki za ta mesec se nalagajo …</span></div>'
    : !b ? '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span role="status">Sestavljam knjigo …</span></div>'
    : `<div class="banner"><span>${IC.info}</span><div role="status"><b>${b.pages}</b> strani${o.duplex ? ` (<b>${b.sheets}</b> listov, obojestransko)` : ''} · ${b.days} dni · <b>${b.rides}</b> prevozov${b.canc ? `, ${b.canc} odpovedanih` : ''}.</div></div>`;
  const ready = !!(b && !m.wait);
  const jumps = ready ? bkJumps(b) : [];
  const prev = ready ? `<section class="bk-prevbox" aria-label="Predogled knjige">
      <div class="bk-nav">
        <button type="button" class="btn sm" data-act="bkPg" data-d="-1" aria-label="Prejšnja stran" data-role="bkprevbtn">◀</button>
        <label class="bk-pgn">Stran <input type="number" min="1" max="${b.pages}" step="1" inputmode="numeric" data-bk="pg" value="${m.pg}" aria-label="Številka strani"> / ${b.pages}</label>
        <button type="button" class="btn sm" data-act="bkPg" data-d="1" aria-label="Naslednja stran" data-role="bknextbtn">▶</button>
        <select data-bk="jump" aria-label="Skoči na dan" data-role="bkjump">${jumps.map(([t, p]) => `<option value="${p}">str. ${p} · ${esc(t)}</option>`).join('')}</select>
        <select data-bk="zoom" aria-label="Povečava predogleda"><option value="fit" ${m.zoom === 'fit' ? 'selected' : ''}>Prilagodi zaslonu</option><option value="1" ${m.zoom === '1' ? 'selected' : ''}>100 %</option><option value="1.5" ${m.zoom === '1.5' ? 'selected' : ''}>150 %</option></select>
      </div>
      <div class="bk-prev" data-role="bkprev"><div class="bk-sheet" data-role="bksheet"><iframe class="bk-frame" sandbox title="Predogled strani knjige" data-role="bkframe" tabindex="-1"></iframe></div></div>
      <p class="hint" style="margin:6px 0 0">Predogled je enak natisu. Siv pas ob notranjem robu je prostor za vezavo (ne natisne se).</p></section>`
    : `<section class="bk-prevbox bk-prevwait" aria-label="Predogled knjige">${m.err ? '' : '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span>Predogled se pripravlja …</span></div>'}</section>`;
  const btnPrint = `<button type="button" class="btn ${coarse ? '' : 'primary'}" data-act="bkPrint" ${ready ? '' : 'disabled'}>Natisni knjigo</button>`;
  const btnTab = `<button type="button" class="btn ${coarse ? 'primary' : ''}" data-act="bkTab" ${ready ? '' : 'disabled'} title="Knjiga se odpre v novem zavihku: tam izberi Natisni ali Shrani kot PDF (priporočeno na telefonu)">Odpri za tisk / PDF</button>`;
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide bprint" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Knjiga meseca: predogled in tisk</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="bk-grid">
      <div class="bk-top stack" style="gap:10px"><div class="field"><label for="bk-ym">Mesec</label><input id="bk-ym" type="month" data-bk="ym" value="${m.y}-${pad(m.m + 1)}" style="max-width:220px"></div>${info}</div>
      ${prev}
      <div class="bk-act stack" style="gap:8px">
        ${m.msg ? `<div class="banner bad" role="alert"><span>${IC.alert}</span><div>${esc(m.msg)}</div></div>` : ''}
        <div class="row" style="gap:8px;flex-wrap:wrap">${coarse ? btnTab + btnPrint : btnPrint + btnTab}</div>
        <p class="hint" style="margin:0"><b>Telefon:</b> pritisni »Odpri za tisk / PDF«, nato v meniju brskalnika (⋮ ali »Deli«) izberi »Natisni« ali »Shrani kot PDF«. <b>Računalnik:</b> »Natisni knjigo« odpre okno tiskanja (tam je tudi »Shrani kot PDF«).</p>
        <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><button type="button" class="btn" data-act="bkList" title="Starejši, krajši izpis: ena tabela po dnevih, A4 ležeče">Samo seznam (ležeče)</button><button type="button" class="btn" data-act="closeModal">Zapri</button></div>
      </div>
      <details class="bk-opts" data-role="bkopts" ${m.optOpen ? 'open' : ''}><summary>Možnosti knjige</summary><div class="stack" style="gap:8px;margin-top:8px">
        ${chk('front', 'Naslovnica in kazalo', 'prva stran: naslovnica, druga: kazalo z datumi in številkami strani')}
        ${chk('duplex', 'Obojestransko, vsak dan na nov list', 'dan se začne na desni strani; zadnja stran dneva je črtana stran za opombe; rob za vezavo se menja po straneh')}
        ${chk('summary', 'Mesečni povzetek na koncu', 'število prevozov, kilometrina in prevozi po vozilih, podpis')}
        ${chk('skipEmpty', 'Izpusti dneve brez vpisov', 'privzeto so v knjigi vsi dnevi meseca, tudi prazni')}
        ${chk('km', 'Stolpec »Km« pri prevozih', 'ga v papirni knjigi ni; kilometrina OD→DO po cestah')}
        <div class="field" style="max-width:220px"><label for="bk-gut">Rob za vezavo (mm)</label><input id="bk-gut" type="number" min="0" max="30" step="1" data-bk="gut" value="${o.gut}" inputmode="numeric"></div>
        <p class="hint" style="margin:0">Tiskalnik: papir <b>A4 pokončno</b>, merilo <b>100 %</b> (ne »prilagodi strani«), brez glave in noge. Obojestransko: obrni ob <b>dolgem robu</b>.</p>
      </div></details>
      <p class="hint bk-note" style="margin:0">Opravljeni prevozi imajo dejansko uro pobiranja, vozilo in ime tistega, ki je prevoz opravil (✓), če je to vpisano. Prevozi z oznako ⚠ so bili prebrani s fotografije in še niso potrjeni.</p>
    </div></div>`;
  bkPaintPrev(m);
}
/* predogled: nastavi stran in merilo (okvir je vedno velik kot A4 pri 96 dpi in se samo pomanjša/poveča) */
function bkPaintPrev(m){
  if (UI.modal !== m || !m.b) return;
  const fr = document.querySelector('[data-role=bkframe]'), prev = document.querySelector('[data-role=bkprev]'), sheet = document.querySelector('[data-role=bksheet]'); if (!fr || !prev || !sheet) return;
  const n = m.b.pages; m.pg = Math.min(n, Math.max(1, m.pg | 0 || 1));
  const sig = m.bid + ':' + m.pg;
  if (fr.dataset.sig !== sig){ fr.dataset.sig = sig; fr.srcdoc = BOOK.doc(m.b, 'view', m.pg); }
  const cw = Math.max(120, prev.clientWidth - 16), wide = window.innerWidth >= 900, maxH = wide ? Math.max(380, window.innerHeight * 0.68) : 1e9;
  const k = m.zoom === 'fit' ? Math.min(1.5, cw / BK_W, maxH / BK_H) : (+m.zoom || 1);
  sheet.style.width = Math.round(BK_W * k) + 'px'; sheet.style.height = Math.round(BK_H * k) + 'px';
  fr.style.transform = 'scale(' + k + ')'; m.k = k;
  const inp = document.querySelector('input[data-bk=pg]'); if (inp && document.activeElement !== inp) inp.value = m.pg;
  const pb = document.querySelector('[data-role=bkprevbtn]'), nb = document.querySelector('[data-role=bknextbtn]'); if (pb) pb.disabled = m.pg <= 1; if (nb) nb.disabled = m.pg >= n;
  const jp = document.querySelector('[data-role=bkjump]'); if (jp){ let sel = null; [...jp.options].forEach(op => { if (+op.value <= m.pg) sel = op; }); if (sel) jp.value = sel.value; }
}
function bkGoto(m, p){ if (!m || m.type !== 'bprint' || !m.b) return; m.pg = Math.min(m.b.pages, Math.max(1, parseInt(p, 10) || 1)); bkPaintPrev(m); }
/* sveža knjiga iz trenutnih podatkov (za tisk in odpiranje) */
function bkFresh(m){
  if (!BOOK.monthReady(m.y, m.m)){ m.msg = 'Podatki za ta mesec se še nalagajo. Počakaj trenutek.'; renderModal(); return null; }
  BOOK.store(m.o); m.msg = '';
  try { return BOOK.build(m.y, m.m, m.o); } catch (e) { m.msg = 'Knjige ni mogoče sestaviti: ' + String(e && e.message || e); renderModal(); return null; }
}
function bkPrint(){
  const m = UI.modal; if (!m || m.type !== 'bprint') return;
  const b = bkFresh(m); if (!b) return;
  try { BOOK.printFrame(b); } catch (e) { m.msg = 'Tiskanja ni mogoče zagnati: ' + String(e && e.message || e) + ' Poskusi »Odpri za tisk / PDF«.'; renderModal(); }
}
function bkTab(){
  const m = UI.modal; if (!m || m.type !== 'bprint') return;
  const b = bkFresh(m); if (!b) return;
  const w = BOOK.openTab(b);
  if (!w){ m.msg = 'Brskalnik je blokiral novo okno. Dovoli pojavna okna za to stran in poskusi znova.'; renderModal(); }
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bprint' || !t.dataset || t.dataset.bk === undefined) return;
    const k = t.dataset.bk;
    if (k === 'pg'){ bkGoto(m, t.value); return; }
    if (k === 'jump'){ bkGoto(m, t.value); return; }
    if (k === 'zoom'){ m.zoom = t.value; bkPaintPrev(m); return; }
    if (k === 'ym'){
      const mm = /^(\d{4})-(\d{2})$/.exec(t.value); if (!mm) return;
      m.y = +mm[1]; m.m = +mm[2] - 1; m.tries = 0; m.pg = 1; bkEnsure(m);
    } else if (k === 'gut') m.o.gut = t.value;
    else m.o[k] = t.checked;
    m.o = BOOK.opts(m.o); BOOK.store(m.o);
    renderModal(); bkBuildSoon(m, 30);
  });
  document.addEventListener('toggle', e => { const t = e.target, m = UI.modal; if (t && t.dataset && t.dataset.role === 'bkopts' && m && m.type === 'bprint'){ m.optOpen = t.open; bkPaintPrev(m); } }, true);
  document.addEventListener('keydown', e => {
    const m = UI.modal; if (!m || m.type !== 'bprint' || !m.b || e.altKey || e.ctrlKey || e.metaKey) return;
    const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft'){ bkGoto(m, m.pg - 1); e.preventDefault(); } else if (e.key === 'ArrowRight'){ bkGoto(m, m.pg + 1); e.preventDefault(); }
  });
  window.addEventListener('resize', () => { const m = UI.modal; if (m && m.type === 'bprint') bkPaintPrev(m); });
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
  UI.modal = { type:'bscan', step:'in', busy:'', err:'', date:(UI.view === 'dan' && UI.date) || '', dateSrc:(UI.view === 'dan' && UI.date) ? 'user' : '', dateTouched:false, rows:[], notes:[], only:false, done:null, doneTouched:false, pages:0, words:0, empties:0, jumpKey:'', warm:'', warmMsg:'', photos:[], manual:false, photoOpen:false, zoom:false, ctl:null, lastFiles:null, seq:0 };
  renderModal(); bsWarm(UI.modal);
}
/* raven polja po popravkih dispečerja: urejeno polje velja za pregledano, če ni prazno (ura: veljavna) */
function bsLvl(row, k){
  if (row.manual){ if (k !== 'time') return 'ok'; const v = String(row.f.time || '').trim(), p = v ? BSCAN.parseTime(v) : null; return p && !p.v && !p.dia ? 'bad' : 'ok'; }
  const fl = row.fl[k]; if (!fl) return 'ok';
  if (!row.touched[k]) return fl.lvl;
  const v = String(row.f[k] || '').trim();
  if (k === 'time') return v ? (BSCAN.parseTime(v).v ? 'ok' : 'bad') : ((row.f.dia || row.f.mode === 'vzorci') ? 'ok' : 'chk');
  if (k === 'note') return 'ok';
  if (k === 'from' && row.f.mode === 'vzorci') return 'ok';
  return v ? 'ok' : 'bad';
}
function bsNrLvl(m, row){
  const n = bsNr(row); if (n == null) return row.manual && !bsFilled(row) ? 'ok' : 'bad';
  const dup = m.rows.some(x => x !== row && x.on && bsNr(x) === n);
  if (row.touched.nr) return dup ? 'chk' : 'ok';
  return dup || row.nrLvl === 'chk' ? 'chk' : 'ok';
}
const bsFilled = row => !!(String(row.f.name || '').trim() || String(row.f.from || '').trim() || String(row.f.to || '').trim());
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
  m.rows.forEach(r => { const l = bsRowLvl(m, r); s[l]++; if (r.on && bsFilled(r)){ s.on++; if (l !== 'ok') s.flagged++; } });
  return s;
}
function bsFieldHTML(m, row, k, label, cls){
  const id = `bs-${row.key}-${k}`, l = bsLvl(row, k), why = bsReason(row, k), sug = ((row.fl[k] || {}).sug || []).slice(0, 3);
  const chips = (l !== 'ok' && !row.touched[k]) ? sug.map((s, i) => `<button type="button" class="chip toggle bs-sug" data-act="bsSug" data-k="${row.key}|${k}|${i}">${esc(s.label)}</button>`).join('') : '';
  return `<div class="field bs-f ${cls || ''}" data-lv="${l}" data-bsf="${k}"><label for="${id}">${esc(label)}</label>
    <input id="${id}" type="text" data-bs="f" data-key="${row.key}" data-k="${k}" value="${esc(row.f[k] || '')}" autocomplete="off" ${k === 'time' ? 'inputmode="numeric" maxlength="8" placeholder="08:00"' : ''} ${k === 'name' ? 'list="bsPat"' : ''} ${l === 'bad' ? 'aria-invalid="true"' : ''} aria-describedby="${id}-w">
    <div class="bs-reason" id="${id}-w" role="note">${esc(why)}</div><div class="bs-sugs">${chips}</div></div>`;
}
function bsRowHTML(m, row){
  const l = bsRowLvl(m, row), todo = bsTodo(m, row);
  const modeSel = `<div class="field bs-f bs-c2" data-lv="ok"><label for="bs-${row.key}-mode">Način</label><select id="bs-${row.key}-mode" data-bs="f" data-key="${row.key}" data-k="mode">${Object.entries(MODES).map(([v, t]) => `<option value="${v}" ${(row.f.mode || 'sede') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  const diaSel = `<div class="field bs-f bs-c2" data-lv="ok"><label for="bs-${row.key}-dia">Dializa</label><select id="bs-${row.key}-dia" data-bs="f" data-key="${row.key}" data-k="dia"><option value="" ${!row.f.dia ? 'selected' : ''}>ne</option><option value="dop" ${row.f.dia === 'dop' ? 'selected' : ''}>dopoldne</option><option value="pop" ${row.f.dia === 'pop' ? 'selected' : ''}>popoldne</option></select></div>`;
  return `<article class="bs-row" data-bsrow="${row.key}" data-lv="${l}" ${m.only && l === 'ok' ? 'hidden' : ''}>
    <div class="bs-head"><label class="check bs-on"><input type="checkbox" data-bs="on" data-key="${row.key}" ${row.on ? 'checked' : ''}> Vpiši</label>
      <label class="bs-nr" for="bs-${row.key}-nr">Polje <input id="bs-${row.key}-nr" type="number" min="1" max="60" inputmode="numeric" data-bs="nr" data-key="${row.key}" value="${esc(row.nrEdit)}" data-lv="${bsNrLvl(m, row)}"></label>
      <span class="bs-lv" data-role="bslv" ${row.manual && l === 'ok' ? 'hidden' : ''}><span aria-hidden="true">${BS_SYM[l]}</span> ${BS_LABEL[l]}</span><span class="bs-todo" data-role="bstodo">${todo ? '· ' + esc(todo) : ''}</span><span class="sp"></span>
      <button type="button" class="btn sm" data-act="bsConfirm" data-key="${row.key}" data-role="bsconf" ${l === 'ok' ? 'hidden' : ''} title="Primerjal sem s sliko: vse je prav">Vse je prav</button></div>
    ${row.crop ? `<div class="bs-cropwrap"><img class="bs-crop" src="${row.crop}" alt="Izrez vrstice ${esc(row.nrEdit || '')} s fotografije"></div>` : ''}
    <div class="bs-grid">${BS_FIELDS.map(([k, lb, , c]) => bsFieldHTML(m, row, k, lb, c)).join('')}${modeSel}${diaSel}
      <div class="field bs-f bs-c6" data-lv="${bsLvl(row, 'note')}" data-bsf="note"><label for="bs-${row.key}-note">Opomba</label><input id="bs-${row.key}-note" type="text" data-bs="f" data-key="${row.key}" data-k="note" value="${esc(row.f.note || '')}" autocomplete="off"><div class="bs-reason">${esc(bsReason(row, 'note'))}</div></div></div></article>`;
}
function bsSumHTML(m){
  const s = bsStats(m), bad = s.chk + s.bad;
  if (m.manual){ const n = m.rows.filter(r => r.on && bsFilled(r)).length; return `<span class="bs-cnt" data-lv="ok">✎ Ročni vnos: ${n} ${n === 1 ? 'izpolnjena vrstica' : 'izpolnjenih vrstic'}</span><span class="sp"></span>${bad ? `<button type="button" class="btn sm primary" data-act="bsJump">Skoči na naslednje nejasno</button>` : ''}`; }
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
      ${bsPhotosHTML(m)}
      <p class="hint" style="margin:0">${m.manual ? 'Ročni vnos ob fotografiji: vpiši ime, od, do in uro za vsak prevoz; prazne vrstice se preskočijo. Ime lahko izbereš s seznama bolnikov. Ročno vpisane vrstice niso označene z ⚠.' : 'Primerjaj vsako vrstico s sliko izreza. Rumena in rdeča polja so tista, ki jih nisem razumel: izberi predlog, popravi ali pritisni »Vse je prav«. Rdeče vrstice niso izbrane za vpis. Karkoli ostane nepotrjeno, se vpiše z oznako <b>⚠ preveri</b>, ki ostane vidna v dnevu in v natisnjeni knjigi, dokler je ne potrdiš.'}${m.empties ? ` · Prazne vrstice: ${m.empties}.` : ''}</p>
      <div class="bs-list" data-role="bslist">${list || '<div class="empty-state">Na strani ni vpisanih vrstic.</div>'}</div>
      <div class="row"><button type="button" class="btn sm" data-act="bsAddRow">+ Dodaj vrstico</button></div>
      <datalist id="bsPat">${S.patients.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'sl')).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
      ${m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row bs-foot" style="justify-content:space-between;flex-wrap:wrap"><button type="button" class="btn" data-act="bsBack">Nazaj (nova fotografija)</button>
        <span class="row"><button type="button" class="btn" data-act="closeModal">Prekliči</button><button type="button" class="btn primary" data-act="bsApply" data-role="bsapply">${esc(bsApplyLabel(m))}</button></span></div>`;
  } else {
    body = `<div class="banner"><span>${IC.info}</span><div>Fotografiraj stran papirne knjige (ali izberi PDF-sken). Aplikacija prebere številke polj, imena, naslove in ure ter jih postavi v dan. <b>Fotografija se ne pošlje nikamor in se ne shrani</b>; branje poteka v tej napravi. Program za branje se ob odprtju okna enkrat prenese (približno 7 MB) in nato velja za vse strani.</div></div>
      ${ocrOn ? `<div class="bs-warm" data-role="bswarm" data-st="${esc(m.warm)}" role="status">${esc(bsWarmText(m))}</div>` : ''}
      <div class="stack" style="gap:8px"><div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn primary" for="bsFile" style="cursor:pointer">${ocrOn ? 'Izberi fotografije ali PDF' : 'Razpoznava izklopljena'}</label>
        <label class="btn" for="bsCam" style="cursor:pointer">Fotografiraj</label></div>
        <input id="bsFile" type="file" accept="image/*,application/pdf,.pdf" multiple style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        <input id="bsCam" type="file" accept="image/*" capture="environment" style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        ${m.busy ? `<div class="bs-busy" role="status"><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="spin" aria-hidden="true"></span><span data-role="bsbusy" style="flex:1;min-width:0">${esc(m.busy)}</span><span class="hint" data-role="bsel" style="white-space:nowrap"></span></div>
          <progress data-role="bsbar" max="100" aria-label="Napredek branja"></progress><div class="hint" data-role="bsslow" hidden>Na telefonu lahko branje ene strani traja do dve minuti. Če se ne premakne, pritisni »Prekini« in prevoze vnesi ročno ob fotografiji.</div>
          <div class="row"><button type="button" class="btn sm" data-act="bsCancel">Prekini</button></div></div>` : ''}</div>
      <ul class="hint bs-tips" style="margin:0;padding-left:18px">
        <li>Knjigo položi ravno, v celoti v kader, brez sence in bliska; telefon drži vzporedno z listom.</li>
        <li>Ena fotografija = ena stran. Za dan z več stranmi izberi več fotografij naenkrat (isti dan).</li>
        <li><b>Tiskano ali lepo berljivo pisavo</b> aplikacija prebere dobro. <b>Hitro ročno pisavo pogosto napačno</b>: takšna polja dobijo oznako ⚠ ali ✖ in jih preveriš s sliko vrstice. Nič se ne vpiše neopazno.</li>
      </ul>
      ${m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>` : ''}
      ${m.err && !m.busy && m.photos.some(Boolean) ? `<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-act="bsManual">Vnesi ročno ob fotografiji</button>${m.lastFiles ? '<button type="button" class="btn" data-act="bsRetry">Poskusi znova</button>' : ''}</div>` : ''}
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button></div>`;
  }
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide bscan" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Skeniraj stran knjige</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div><div class="stack" style="gap:12px">${body}</div></div>`;
}
const bsWarmText = m => m.warm === 'ok' ? '✔ Razpoznava je pripravljena: strani se berejo brez novega prenosa.'
  : m.warm === 'busy' ? 'Razpoznava se pripravlja v ozadju' + (m.warmP ? ' (' + BSCAN.stageLabel(m.warmP) + ')' : '') + '. Fotografijo lahko izbereš že zdaj.'
  : m.warm === 'err' ? '⚠ Razpoznave ni bilo mogoče pripraviti vnaprej: ' + (m.warmMsg || 'neznana napaka') + ' Ob izbiri fotografije poskusim znova.' : '';
function bsPaintWarm(m){
  if (UI.modal !== m) return; const el = document.querySelector('[data-role=bswarm]'); if (!el) return;
  el.dataset.st = m.warm; el.textContent = bsWarmText(m);
}
/* vnaprejšnji zagon branja (jedro in model) takoj ob odprtju okna: do izbire fotografije je že pripravljeno */
function bsWarm(m){
  if (!NSCAN.ocrEnabled()) return;
  m.warm = 'busy'; m.warmP = null; bsPaintWarm(m);
  let p; try { p = BSCAN.warm(x => { m.warmP = x.stage; bsPaintWarm(m); }); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(() => { m.warm = 'ok'; bsPaintWarm(m); }, e => { m.warm = 'err'; m.warmMsg = String(e && e.message || e); bsPaintWarm(m); });
}
function bsProgress(m, p){
  if (UI.modal !== m) return;
  const el = document.querySelector('[data-role=bsbusy]'); if (!el) return;
  const pc = p.pct > 0 && p.pct <= 1 ? Math.round(p.pct * 100) : 0;
  el.textContent = p.label + (pc ? ' ' + pc + ' %' : ' …');
  const bar = document.querySelector('[data-role=bsbar]'); if (bar){ if (pc) bar.value = pc; else bar.removeAttribute('value'); }
}
async function bsFiles(list){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.busy) return;
  const files = Array.from(list || []).filter(Boolean); if (!files.length) return;
  if (!NSCAN.ocrEnabled()){ m.err = 'Razpoznava besedila iz slike ni vklopljena (config.js → ocr).'; renderModal(); return; }
  m.err = ''; m.busy = 'berem fotografijo …'; m.photos = []; m.manual = false; m.lastFiles = files; m.ctl = { cancelled:false }; m.t0 = Date.now(); renderModal();
  const ctl = m.ctl;
  const timer = setInterval(() => {
    if (UI.modal !== m || !m.busy){ clearInterval(timer); if (UI.modal !== m){ BSCAN.cancel(ctl); } return; }
    const sec = Math.round((Date.now() - m.t0) / 1000), el = document.querySelector('[data-role=bsel]'), sl = document.querySelector('[data-role=bsslow]');
    if (el) el.textContent = sec + ' s'; if (sl && sec >= 60) sl.hidden = false;
  }, 1000);
  BSCAN.hooks.onPhoto = (i, url) => { if (UI.modal === m) m.photos[i] = url; };
  try {
    const res = await BSCAN.run(files, p => bsProgress(m, p), ctl);
    if (UI.modal !== m) return;
    bsLoad(m, res);
  } catch (e) { m.err = e && e.canceled ? 'Branje je prekinjeno.' : String(e && e.message || e); }
  finally { clearInterval(timer); BSCAN.hooks.onPhoto = null; }
  m.busy = '';
  if (UI.modal === m) renderModal();
}
function bsCancel(){ const m = UI.modal; if (!m || m.type !== 'bscan' || !m.busy) return; m.busy = 'prekinjam …'; const el = document.querySelector('[data-role=bsbusy]'); if (el) el.textContent = m.busy; BSCAN.cancel(m.ctl); }
function bsRetry(){ const m = UI.modal; if (!m || m.type !== 'bscan' || m.busy || !m.lastFiles) return; bsFiles(m.lastFiles); }
/* če razpoznava ne uspe: prevoze vneseš sam, ob celi fotografiji (prazne vrstice 1–12, po potrebi še dodaš) */
function bsBlankRow(m){
  const n = m.rows.length + 1, key = 'm' + (++m.seq);
  return { key, page:1, nr:n, nrEdit:String(n), nrLvl:'ok', lvl:'ok', todo:[], manual:true, on:true, touched:{}, fl:{}, crop:'', f:{ name:'', from:'', to:'', time:'', mode:'sede', dia:'', note:'', pid:'' } };
}
function bsManual(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.busy) return;
  m.rows = []; for (let i = 0; i < 12; i++) m.rows.push(bsBlankRow(m));
  m.manual = true; m.step = 'review'; m.err = ''; m.notes = []; m.empties = 0; m.photoOpen = true; m.only = false; m.pages = m.photos.filter(Boolean).length; renderModal();
}
function bsAddRow(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.step !== 'review') return;
  const row = Object.assign(bsBlankRow(m), { nr:null }); row.nrEdit = String(Math.max(0, ...m.rows.map(r => bsNr(r) || 0)) + 1);
  m.rows.push(row); renderModal();
  const last = document.querySelector('.bs-row:last-child input[data-k=name]'); if (last){ try { last.focus({ preventScroll:false }); } catch (e) { last.focus(); } }
}
function bsZoom(){ const m = UI.modal; if (!m || m.type !== 'bscan') return; m.zoom = !m.zoom; const el = document.querySelector('[data-role=bsphoto]'); if (el) el.classList.toggle('zoom', m.zoom); }
function bsPhotosHTML(m){
  if (!m.photos || !m.photos.some(Boolean)) return '';
  return `<details class="bs-photos" data-role="bsphotos" ${m.photoOpen ? 'open' : ''}><summary>Cela fotografija strani (za primerjavo)</summary>
    <div class="bs-photo ${m.zoom ? 'zoom' : ''}" data-role="bsphoto">${m.photos.map((u, i) => u ? `<img src="${u}" alt="Fotografija strani ${i + 1}">` : '').join('')}</div>
    <div class="row"><button type="button" class="btn sm" data-act="bsZoom">Povečaj / pomanjšaj</button></div></details>`;
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
  const lv = card.querySelector('[data-role=bslv]'); if (lv){ lv.innerHTML = `<span aria-hidden="true">${BS_SYM[l]}</span> ${BS_LABEL[l]}`; lv.hidden = !!row.manual && l === 'ok'; }
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
function bsBack(){ const m = UI.modal; if (!m || m.type !== 'bscan') return; m.step = 'in'; m.rows = []; m.err = ''; m.notes = []; m.manual = false; m.photos = []; renderModal(); bsPaintWarm(m); }
function bsApply(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.step !== 'review') return;
  if (!bsDateOk(m.date)){ m.err = 'Vpiši datum strani.'; renderModal(); return; }
  const date = m.date, mm = { y:+date.slice(0, 4), m:+date.slice(5, 7) - 1 };
  bkEnsure(mm);
  if (!BOOK.monthReady(mm.y, mm.m)){ m.err = 'Podatki za ta mesec se še nalagajo. Počakaj trenutek in poskusi znova.'; renderModal(); return; }
  const sel = m.rows.filter(r => r.on && bsFilled(r)).sort((a, b) => (bsNr(a) == null ? 999 : bsNr(a)) - (bsNr(b) == null ? 999 : bsNr(b)));
  if (!sel.length){ m.err = m.manual ? 'Vpiši vsaj eno vrstico (ime, od, do).' : 'Ni izbranih vrstic za vpis.'; renderModal(); return; }
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
  audit('knjiga.skenirano', { dan:date, n, chk:flagged, strani:m.pages, rocno:m.manual ? 1 : 0 });
  UI.modal = null; renderModal(); UI.date = date;
  toast(`Vpisanih ${n} prevozov${flagged ? ` · ${flagged} z oznako ⚠ preveri` : ''}${dup ? ` · ${dup} že vpisanih preskočenih` : ''}${moved ? ` · ${moved} v drugo polje (zasedeno)` : ''}`);
  go('dan');
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('toggle', e => { const t = e.target, m = UI.modal; if (t && t.dataset && t.dataset.role === 'bsphotos' && m && m.type === 'bscan') m.photoOpen = t.open; }, true);
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
      row.f[k] = t.value; if (k === 'name'){ const pt = t.value.trim() ? S.patients.find(x => norm(x.name) === norm(t.value)) : null; row.f.pid = pt ? pt.id : ''; }
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
