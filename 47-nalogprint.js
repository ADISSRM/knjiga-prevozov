/* =====================================================================
   TISK DOPOLNIL NA OBRAZEC »NALOG ZA PREVOZ« (Obr. NLG/05)
   Papirnati nalog ima na sprednji strani polja 1–13 (izpolni zdravnik) in tabelo PREVOZI; hrbtna stran je nadaljevanje tabele.
   Reševalec list položi v tiskalnik, aplikacija natisne SAMO podatke, ki jih izpolni posadka, v pravo vrstico tabele:
   datum, čas (od–do), reg. št. vozila, km, štartnina, spremljevalec in ime voznika (podpis ostane lastnoročen).
   NIČ od pacienta (ime, naslov, številka zavarovane osebe) se ne natisne.
   Položaj je v milimetrih (list A4), izmerjen na fotografiji praznega obrazca; zaradi razlik v tiskalnikih in obrazcih ga je mogoče
   v Nastavitve → Tisk naloga premakniti (mm) in raztegniti (%). Preizkusna stran s črtami celic pomaga pri poravnavi.
   ===================================================================== */
const NP = (() => {
  const PT = 0.3528;                                   // 1 pt v mm
  /* Stolpci (mm od levega roba lista): Datum | Čas (od-do) | Reg. št. vozila | km/min | Štartnina | Spremljevalec | Podpis voznika | Podpis zavarovane osebe */
  const COLS = [9.6, 33.6, 57.8, 85.0, 96.4, 108.0, 141.0, 171.9, 200.0];
  const PAGES = {
    f:{ head:178.0, top:186.4, pitch:8.56, rows:11 },   // sprednja stran: glava tabele, prva vrstica, višina vrstice, število vrstic
    b:{ head:11.8, top:20.2, pitch:8.45, rows:29 }      // hrbtna stran
  };
  const SHEET = PAGES.f.rows + PAGES.b.rows;           // 40 vrstic na list
  const FIELDS = ['datum', 'od', 'do', 'reg', 'km', 'st', 'spr', 'voz'];
  const DEF = { startnina:'', kmDec:1, voznik:true, od:'v_vozilu', dx:0, dy:0, sx:100, sy:100, fs:9 };
  const cfg = () => Object.assign({}, DEF, (typeof S !== 'undefined' && S && S.settings && S.settings.tisk) || {});
  const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) ? x : null; };
  const clamp = (v, a, b, d) => { const x = num(v); return x == null ? d : Math.min(b, Math.max(a, x)); };

  /* ---------- Oblikovanje ---------- */
  const fmtDate = d => { if (!d) return ''; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d)); return m ? `${m[3]}.${m[2]}.${m[1]}` : String(d); };
  const fmtKm = v => { const x = num(v); if (x == null) return ''; const dec = clamp(cfg().kmDec, 0, 1, 1); return x.toFixed(dec).replace('.', ','); };
  const fmtMoney = v => { const s = String(v ?? '').trim(); if (!s) return ''; const x = num(s); return x == null ? s : x.toFixed(2).replace('.', ','); };
  const hm = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  /* ---------- Mesto vrstice: vrstica 1–40 na listu, 41+ je naslednji list ---------- */
  function loc(row){
    const k = (row - 1) % SHEET, sheet = Math.floor((row - 1) / SHEET) + 1, front = k < PAGES.f.rows;
    return { sheet, page:front ? 'f' : 'b', line:front ? k : k - PAGES.f.rows, key:sheet + (front ? 'f' : 'b') };
  }

  /* ---------- Posadka in vozilo, s katerim je bil prevoz opravljen ---------- */
  function crewOf(date, r){
    let veh = null, voz = '', spr = [], plan = null;
    const fromCrew = c => { veh = S.vehicles.find(v => v.id === c.id) || c.vehicle; voz = c.driver ? c.driver.name : ''; spr = (c.escorts || []).map(e => e.name).filter(Boolean); };
    try {
      plan = computePlan(date);
      const a = plan && plan.assign[r.id], c = a && plan.crews.find(x => x.id === a.crewId);
      if (c) fromCrew(c);
    } catch (e) { /* brez razporeda: poskusi drugje */ }
    /* objavljen razpored / ključ ekipe (»datum_idVozila«) */
    if (!veh && r.runKey){
      const run = (((S.published || {})[date] || {}).runs || []).find(x => x.key === r.runKey);
      if (run){ veh = S.vehicles.find(v => v.id === run.vehId) || { name:run.vehName, reg:'' }; const nm = run.names || []; voz = nm[0] || ''; spr = nm.slice(1); }
      else if (String(r.runKey).startsWith(date + '_')) veh = S.vehicles.find(v => v.id === String(r.runKey).slice(date.length + 1)) || null;
    }
    /* opravljen prevoz ni več v razporedu: ekipo poišči po imenu v »Kdo je naredil odvoz«, sicer če je tisti dan le ena ekipa */
    if (!veh && plan && plan.crews && plan.crews.length){
      const by = norm(r.doneBy || '');
      let c = by ? plan.crews.find(x => (x.driver && x.driver.name && by.includes(norm(x.driver.name))) || (x.escorts || []).some(e => e.name && by.includes(norm(e.name)))) : null;
      if (!c && plan.crews.length === 1) c = plan.crews[0];
      if (c) fromCrew(c);
    }
    if (!voz && r.doneBy){ const parts = String(r.doneBy).split(/\s*,\s*/).filter(Boolean); voz = parts[0] || ''; spr = parts.slice(1); }
    return { veh, vehName:veh ? veh.name : '', reg:veh && veh.reg ? String(veh.reg).trim().toUpperCase() : '', voz, spr:spr.join(', ') };
  }

  /* ---------- Vrednosti vrstice: shranjene (r.pr) > izračunane ---------- */
  function defaults(date, r){
    const c = cfg(), cr = crewOf(date, r), t = r.times || {};
    let pl = null; try { const p = computePlan(date); pl = p && p.assign[r.id] || null; } catch (e) { /* ni razporeda */ }
    const od = hm(t[c.od === 'na_poti' ? 'na_poti' : 'v_vozilu'] || t.v_vozilu || t.na_poti || t.na_kraju) || (pl ? fmtT(pl.pickT) : '');
    const doo = hm(t.na_cilju || t.zakljucena) || (pl ? fmtT(pl.dropT) : '');
    let km = '';
    try { const i = KM.info(r); if (i && i.total != null) km = fmtKm(i.total); } catch (e) { /* brez km */ }
    return { datum:fmtDate(date), od:od === '–' ? '' : od, do:doo === '–' ? '' : doo, reg:cr.reg, km, st:fmtMoney(c.startnina), spr:cr.spr, voz:c.voznik ? cr.voz : '', _veh:cr.vehName };
  }
  function entryFor(date, r){
    const d = defaults(date, r), s = r.pr && r.pr.f ? r.pr.f : {};
    const f = {}; FIELDS.forEach(k => { f[k] = s[k] != null ? s[k] : d[k]; });
    return f;
  }

  /* ---------- Prevozi, ki spadajo k nalogu ---------- */
  function ridesFor(p, n){
    const out = [];
    Object.keys(S.rides).sort().forEach(date => {
      S.rides[date].forEach((r, i) => {
        if (!r || r.patientId !== p.id || r.odpovedano || r.status === 'preklicana') return;
        if (r.nalogId ? r.nalogId !== n.id : !(n.veljaOd && n.veljaDo && date >= n.veljaOd && date <= n.veljaDo && (p.naloge || []).filter(x => !x.preklican && x.veljaOd <= date && x.veljaDo >= date).length === 1)) return;
        out.push({ date, r, nr:i + 1, f:entryFor(date, r), printed:!!(r.pr && r.pr.row), row:r.pr ? r.pr.row : 0, done:!!(r.done || (r.times && (r.times.zakljucena || r.times.na_cilju))) });
      });
    });
    return out;
  }
  const nextRow = n => Math.max(0, Math.floor(+n.tiskRows || 0)) + 1;

  /* ---------- Besedilo v celici: pomanjšaj, da stane; nikoli ne prelomi vrstice ---------- */
  function fitPt(text, widthMm, ptMax, ptMin = 6){
    const len = Math.max(1, String(text).length);
    const pt = widthMm / (len * 0.52 * PT);            // ocena povprečne širine znaka 0,52 em
    return Math.max(ptMin, Math.min(ptMax, Math.round(pt * 10) / 10));
  }
  function cell(page, line, col, text, o = {}){
    if (text == null || String(text).trim() === '') return '';
    const g = PAGES[page], x0 = COLS[col], w = COLS[col + 1] - COLS[col], y0 = g.top + line * g.pitch;
    const pad = o.pad == null ? 1 : o.pad, ww = w - 2 * pad;
    const ptMax = o.pt || clamp(cfg().fs, 6, 14, 9), min = o.min || 6, len = Math.max(1, String(text).length);
    const al = o.al || 'center', top = o.top;
    let pt = fitPt(text, ww, ptMax, min), two = false;
    if (!top && o.wrap && pt < 7.5 && /[\s-]/.test(String(text))){ pt = Math.max(min, Math.min(ptMax, Math.round(ww * 1.85 / (len * 0.52 * PT) * 10) / 10)); two = true; }   // predolgo za eno vrstico: dve vrstici
    const st = `left:${(x0 + pad).toFixed(2)}mm;top:${top ? (y0 + 0.6).toFixed(2) : y0.toFixed(2)}mm;width:${ww.toFixed(2)}mm;height:${top ? (g.pitch * .42).toFixed(2) : g.pitch.toFixed(2)}mm;font-size:${pt}pt;text-align:${al};${top ? '' : 'align-items:center;display:flex;justify-content:' + (al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center')}${two ? ';white-space:normal;line-height:1.05' : ''}`;
    return `<div class="nc${top ? ' nc-top' : ''}" style="${st}"><span>${esc(String(text))}</span></div>`;
  }
  /* vrstica 'line' (0-based) strani 'page' z vrednostmi f */
  function rowHTML(page, line, f){
    const c = cfg(), time = [f.od, f.do].some(Boolean) ? `${f.od || ''}–${f.do || ''}` : '';
    return cell(page, line, 0, f.datum) + cell(page, line, 1, time) + cell(page, line, 2, f.reg) + cell(page, line, 3, f.km) + cell(page, line, 4, f.st)
      + cell(page, line, 5, f.spr, { al:'left', pad:1.2, wrap:true }) + (c.voznik ? cell(page, line, 6, f.voz, { al:'left', pad:1.2, top:true, pt:7.5, min:5.5 }) : '');
  }
  /* črte celic (samo za preizkusno stran in predogled; na pravem natisu jih ni) */
  function guideHTML(page){
    const g = PAGES[page], x0 = COLS[0], x1 = COLS[COLS.length - 1], y0 = g.head, y1 = g.top + g.rows * g.pitch;
    let h = '';
    for (let i = 0; i <= g.rows + 1; i++){ const y = i === 0 ? g.head : g.top + (i - 1) * g.pitch; h += `<i class="ng ng-h" style="left:${x0}mm;top:${y.toFixed(2)}mm;width:${(x1 - x0).toFixed(2)}mm"></i>`; }
    COLS.forEach(x => { h += `<i class="ng ng-v" style="left:${x}mm;top:${y0}mm;height:${(y1 - y0).toFixed(2)}mm"></i>`; });
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => { h += `<i class="ng ng-x" style="left:${(x - 3).toFixed(2)}mm;top:${(y - 3).toFixed(2)}mm"></i>`; });
    return h;
  }
  /* ena stran: entries = [{ line, f }] */
  function pageHTML(page, entries, o = {}){
    const c = cfg(), sx = clamp(c.sx, 80, 120, 100) / 100, sy = clamp(c.sy, 80, 120, 100) / 100, dx = clamp(c.dx, -30, 30, 0), dy = clamp(c.dy, -30, 30, 0);
    const body = (o.guide ? guideHTML(page) : '') + entries.map(e => rowHTML(page, e.line, e.f)).join('');
    const label = o.label ? `<div class="ng-lbl" style="left:12mm;top:${page === 'f' ? 289 : 4}mm">${esc(o.label)}</div>` : '';
    return `<section class="npg${o.guide ? ' npg-guide' : ''}"><div class="npg-in" style="transform:translate(${dx}mm,${dy}mm) scale(${sx},${sy})">${body}</div>${label}</section>`;
  }

  /* ---------- Razporeditev izbranih prevozov po vrsticah in straneh ---------- */
  function layout(rows, start){
    const groups = [], by = {};
    rows.forEach((x, i) => {
      const row = start + i, L = loc(row);
      let g = by[L.key]; if (!g){ g = by[L.key] = { key:L.key, sheet:L.sheet, page:L.page, items:[], from:row, to:row }; groups.push(g); }
      g.items.push({ line:L.line, row, x }); g.to = row;
    });
    return groups;
  }
  const groupLabel = g => `List ${g.sheet} · ${g.page === 'f' ? 'sprednja stran' : 'hrbtna stran'} · vrstic ${g.items.length} (št. ${g.from}${g.to > g.from ? '–' + g.to : ''})`;

  /* ---------- Tisk ---------- */
  function printArea(html){
    let el = document.getElementById('printArea');
    if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
    el.className = 'pnalog'; el.innerHTML = html;
    window.print();
  }
  function printGroup(g){
    printArea(pageHTML(g.page, g.items.map(it => ({ line:it.line, f:it.x.f })), {}));
  }
  /* Preizkusna stran: črte celic + nekaj izmišljenih vrstic. Natisni na navaden papir in primerjaj z obrazcem proti svetlobi. */
  const SAMPLE = [{ datum:'01.01.2026', od:'08:00', do:'09:15', reg:'KK AB-123', km:'23,4', st:'3,50', spr:'Ime Spremljevalec', voz:'Ime Voznik' },
    { datum:'02.01.2026', od:'10:30', do:'12:05', reg:'KK AB-123', km:'61,0', st:'3,50', spr:'Ime Spremljevalec', voz:'Ime Voznik' }];
  function calibHTML(page){
    const g = PAGES[page], last = g.rows - 1;
    const items = [{ line:0, f:SAMPLE[0] }, { line:1, f:SAMPLE[1] }, { line:last, f:{ ...SAMPLE[0], datum:'31.12.2026' } }];
    return pageHTML(page, items, { guide:true, label:'PREIZKUSNA STRAN: črte morajo ležati na črtah obrazca (' + (page === 'f' ? 'sprednja' : 'hrbtna') + ' stran)' });
  }
  function printCalib(page){ printArea(calibHTML(page)); }

  return { COLS, PAGES, SHEET, FIELDS, DEF, cfg, loc, crewOf, defaults, entryFor, ridesFor, nextRow, fitPt, pageHTML, guideHTML, rowHTML, layout, groupLabel, printGroup, printCalib, calibHTML,
    fmtDate, fmtKm, fmtMoney, hm, SAMPLE };
})();
