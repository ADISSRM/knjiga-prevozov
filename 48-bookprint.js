/* =====================================================================
   TISK KNJIGE ZA CEL MESEC (na koncu meseca): kot papirna knjiga, pripravljena za vezavo
   Naslovnica → kazalo → vsak dan v obliki obrazca OBR REŠ 08 (prevozi 1–10, 11–24, posadke po vozilih, posebnosti) → mesečni povzetek.
   Vsi prevozi so zapisani tako, kot so bili opravljeni: ura prevoza, ura pobiranja (dejanska, če jo je posadka zabeležila, sicer po razporedu),
   vozilo (iz razporeda, objavljenega razporeda ali imena v »Kdo je naredil odvoz«), odpovedani prečrtani, opomba in kdo je prevoz opravil.
   Stran je A4 pokonci; pri obojestranskem tisku ima notranji rob za vezavo menjajoče strani (lihe: levo, sode: desno),
   vsak dan se začne na desni strani, zadnja stran dneva pa je črtana stran za opombe.
   Podatki o pacientih gredo samo na tiskalnik te naprave (kot v papirni knjigi); v dnevnik sprememb se zapiše samo mesec.
   ===================================================================== */
const BOOK = (() => {
  const P1 = 10, P2 = 24, CONT = 14;                   // vrstice: prva stran 1–10, druga 11–24, nadaljevanje po 14
  const DEF = { front:true, summary:true, duplex:true, skipEmpty:false, km:false, gut:12 };
  const clampN = (v, a, b, d) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) ? Math.min(b, Math.max(a, x)) : d; };
  const opts = o => { const x = Object.assign({}, DEF, o || {}); x.gut = clampN(x.gut, 0, 30, DEF.gut); ['front', 'summary', 'duplex', 'skipEmpty', 'km'].forEach(k => { x[k] = !!x[k]; }); return x; };
  const hmIso = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const kmTxt = r => { try { const i = KM.info(r); return i.total == null ? '' : (i.exact && i.backExact ? '' : '~') + KM.fmtKm(i.total); } catch (e) { return ''; } };
  const kmNum = r => { try { const i = KM.info(r); return i.total == null ? null : i.total; } catch (e) { return null; } };

  /* ---------- Podatki enega dne: vsak prevoz z vozilom in uro pobiranja ---------- */
  function dayData(date){
    const all = filledRides(date);
    const pending = all.some(({ r }) => !r.done && !r.odpovedano);
    let plan = null;
    try { plan = computePlan(date); } catch (e) { plan = null; }
    const rides = all.map(({ r, nr }) => {
      const a = plan && plan.assign ? plan.assign[r.id] : null, t = r.times || {};
      let veh = a ? a.veh : '', pick = '', ret = '', est = false, crew = null;
      if (!veh || r.done){
        try { crew = NP.crewOf(date, r); if (crew && crew.vehName && !veh) veh = crew.vehName; } catch (e) { crew = null; }
      }
      const real = hmIso(t.v_vozilu || t.na_kraju || t.na_poti);
      if (r.done && real) pick = real;
      else if (a && a.pickT != null){ pick = fmtT(a.pickT); est = a.late > 0; if (a.retPickT != null) ret = fmtT(a.retPickT); }
      else if (real) pick = real;
      return { r, nr, veh, pick, ret, est, crew };
    });
    return { date, all, rides, plan, pending };
  }

  function rowHTML(x, o){
    const r = x.r, can = r.odpovedano;
    const notes = [r.mode !== 'sede' ? (MODES[r.mode] || r.mode) : '', r.dia ? 'dializa' : '', +r.stay > 0 ? `čaka ${+r.stay} min` : '', r.note || ''].filter(Boolean).join(', ');
    const by = r.done ? '✓' + (r.doneBy ? ' ' + r.doneBy : '') : '';
    const pick = can ? '' : (x.est ? '~' : '') + x.pick + (x.ret ? ` · nazaj ${x.ret}` : '');
    return `<tr class="${can ? 'p-cancel' : ''}"><td class="pd-nr">${x.nr}</td><td>${esc(r.name || '')}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td class="pd-t">${esc(r.time || '')}</td><td class="pd-t">${esc(pick)}</td><td class="pd-v">${can ? '' : esc(x.veh)}</td>${o.km ? `<td class="pd-t">${can ? '' : esc(kmTxt(r))}</td>` : ''}<td>${can ? '<b>ODPOVEDANO</b> ' : ''}${r.chk ? `<b class="pd-chk">⚠ preveri (${esc(r.chk)})</b> ` : ''}${esc(notes)}${by ? `<div class="pd-by">${esc(by)}</div>` : ''}</td></tr>`;
  }
  const emptyRow = (nr, o) => `<tr class="pd-empty"><td class="pd-nr">${nr}</td><td></td><td></td><td></td><td></td><td></td><td></td>${o.km ? '<td></td>' : ''}<td></td></tr>`;
  const colgroup = o => `<colgroup><col style="width:9mm"><col style="width:${o.km ? 27 : 30}mm"><col style="width:${o.km ? 23 : 26}mm"><col style="width:${o.km ? 23 : 26}mm"><col style="width:15mm"><col style="width:20mm"><col style="width:17mm">${o.km ? '<col style="width:13mm">' : ''}<col></colgroup>`;
  const thead = o => `${colgroup(o)}<thead><tr><th class="pd-nr">Št.</th><th>Ime in priimek</th><th>Od</th><th>Do</th><th>Ura prev.</th><th>Pobere</th><th>Vozilo</th>${o.km ? '<th>Km</th>' : ''}<th>Opomba</th></tr></thead>`;

  function head(date, n, N, title, noDate){
    const form = esc((S.settings.formCode || 'OBR REŠ 08').trim()), hol = holiday(date);
    return `<header class="pd-head"><div class="pd-logos">${logoInner()}</div><div class="pd-title"><b>${esc(title || 'KNJIGA REŠEVALNIH PREVOZOV')}</b><span>Reševalna postaja Brežice · ${form}</span></div>
      <div class="pd-date">${noDate ? '' : `<div>DATUM: <b>${fmtDMY(date)}</b></div><div>DAN: <b>${DOW_LONG[dow(date)]}</b>${hol ? ' · ' + esc(hol) : ''}</div>${n ? `<div class="pd-pg">list ${n}/${N}</div>` : ''}`}</div></header>`;
  }
  const lines = h => `<div class="pd-ruled">${'<div class="pd-ln"></div>'.repeat(Math.max(1, Math.floor(h / 22)))}</div>`;

  /* ---------- Strani enega dne ---------- */
  function dayPages(date, o){
    const d = dayData(date), by = {}; d.rides.forEach(x => { by[x.nr] = x; });
    const last = d.all.reduce((m, x) => Math.max(m, x.nr), 0), total = Math.max(P2, last);
    const book = S.crewBook[date] || {}, ostTxt = (book.ost && book.ost.text) || '';
    const notices = (S.notices || []).filter(n => !n.closed && n.from <= date && (!n.to || n.to >= date));
    const posebnosti = [S.dayNote[date] || '', ostTxt ? 'Ostalo: ' + ostTxt : '', ...notices.map(n => `${(S.vehicles.find(v => v.id === n.vehicleId) || {}).name || ''}: ${n.tip}${n.note ? ' – ' + n.note : ''}`)].filter(Boolean);
    const crewList = [];
    const seen = new Set();
    S.vehicles.forEach(v => {
      if (v.tip === 'ostalo') return;
      const nrs = d.rides.filter(x => x.veh === v.name && !x.r.odpovedano).map(x => x.nr);
      const cell = book[v.id] && book[v.id].text;
      let txt = cell || '', start = '';
      const pc = d.plan && d.plan.crews ? d.plan.crews.find(c => c.vehicle && c.vehicle.id === v.id) : null;
      if (!txt && pc){ try { txt = crewLabel(pc); } catch (e) { txt = ''; } }
      if (!txt){ const dn = d.rides.find(x => x.veh === v.name && x.crew && x.crew.voz); if (dn) txt = [dn.crew.voz, dn.crew.spr ? dn.crew.spr + ' (sp.)' : ''].filter(Boolean).join(', '); }
      if (pc && pc.trips && pc.trips.length){ try { start = 'ob ' + fmtT(pc.firstDepart); } catch (e) { start = ''; } }
      if (!txt && !nrs.length) return;
      seen.add(v.name); crewList.push({ veh:v.name, txt, nrs, start });
    });
    d.rides.forEach(x => { if (x.veh && !x.r.odpovedano && !seen.has(x.veh)){ seen.add(x.veh); crewList.push({ veh:x.veh, txt:[x.crew && x.crew.voz, x.crew && x.crew.spr ? x.crew.spr + ' (sp.)' : ''].filter(Boolean).join(', '), nrs:d.rides.filter(y => y.veh === x.veh && !y.r.odpovedano).map(y => y.nr), start:'' }); } });
    const stats = { n:d.all.filter(x => !x.r.odpovedano).length, canc:d.all.filter(x => x.r.odpovedano).length, done:d.all.filter(x => !x.r.odpovedano && x.r.done).length };
    const empty = !d.all.length && !posebnosti.length && !crewList.length;
    const crewRows = crewList.map(c => `<tr><td><b>${esc(c.veh)}</b></td><td>${esc(c.txt || '')}</td><td>${c.nrs.join(', ') || '–'}</td><td>${esc(c.start)}</td></tr>`).join('');
    const crewTab = `<table class="pd-tab pd-crew"><thead><tr><th>Vozilo</th><th>Posadka</th><th>Prevozi (št.)</th><th>Posebnosti</th></tr></thead><tbody>${crewRows || '<tr><td colspan="4">Ni posadk.</td></tr>'}</tbody></table>`;
    const posBlock = `<div class="pd-pos"><b>Posebnosti:</b>${posebnosti.length ? '<ul>' + posebnosti.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : lines(90)}</div>`;
    const pages = [];
    const rowsOf = (a, b) => Array.from({ length:b - a }, (_, j) => by[a + j + 1] ? rowHTML(by[a + j + 1], o) : emptyRow(a + j + 1, o)).join('');
    const tab = (a, b) => `<table class="pd-tab">${thead(o)}<tbody>${rowsOf(a, b)}</tbody></table>`;
    const vehLine = crewList.filter(c => c.nrs.length).map(c => esc(c.veh)).join(' · ') || '–';
    const ctrl = [];   // [html z rezervo za »list n/N«]
    if (!d.all.length){
      pages.push({ kind:'prazno', date, inner:() => `${head(date, 0, 0)}<p class="pd-empty-day">Ni vpisanih prevozov.</p>${crewList.length ? crewTab : ''}${posBlock}` });
    } else {
      ctrl.push(N => `${head(date, ctrl.k, N)}<div class="pd-veh">VOZILA: <b>${vehLine}</b></div>${tab(0, P1)}`);
      ctrl.push(N => `${head(date, ctrl.k, N)}${tab(P1, P2)}`);
      for (let a = P2; a < total; a += CONT){ const b = Math.min(total, a + CONT); ctrl.push(N => `${head(date, ctrl.k, N)}<p class="pd-fine" style="margin:0 0 6px">nadaljevanje: prevozi ${a + 1}–${b}</p>${tab(a, b)}`); }
      ctrl.push(N => `${head(date, ctrl.k, N)}
        ${crewTab}
        ${posBlock}
        <p class="pd-fine">Prevozov: ${stats.n}${stats.canc ? ` · odpovedanih: ${stats.canc}` : ''} · opravljenih: ${stats.done}. ${d.pending ? 'Del prevozov še ni opravljen: ure »Pobere« so tam ocena razporeda.' : 'Ure »Pobere« so dejanske, kjer jih je posadka zabeležila; sicer ocena razporeda.'}</p>
        <div class="pd-sign"><span>Dispečer: ______________________</span></div>`);
      const N = ctrl.length;
      ctrl.forEach((f, i) => { pages.push({ kind:i === N - 1 ? 'posadke' : 'prevozi', date, inner:() => { ctrl.k = i + 1; return f(N); } }); });
    }
    return { pages, stats, rides:d.rides, crewList, empty };
  }

  /* ---------- Posebne strani ---------- */
  const noteBlank = (date, o) => ({ kind:'opombe', date, inner:() => `${head(date, 0, 0, 'OPOMBE')}<p class="pd-fine" style="margin:0 0 8px">Prostor za ročne dopolnitve (${DOW_LONG[dow(date)]}, ${fmtDMY(date)}).</p>${lines(880)}` });
  function monthTotals(y, m, o){
    const n = daysInMonth(y, m), days = [], veh = {};
    let tot = 0, canc = 0, done = 0, km = 0, kmEx = true, kmN = 0;
    for (let k = 1; k <= n; k++){
      const date = `${y}-${pad(m + 1)}-${pad(k)}`, dp = dayPages(date, o);
      dp.rides.forEach(x => {
        if (x.r.odpovedano) return;
        const key = x.veh || '(brez vozila)', v = veh[key] || (veh[key] = { n:0, km:0 });
        v.n++; const kk = kmNum(x.r); if (kk != null){ v.km += kk; km += kk; kmN++; try { const i = KM.info(x.r); if (!(i.exact && i.backExact)) kmEx = false; } catch (e) { kmEx = false; } }
      });
      tot += dp.stats.n; canc += dp.stats.canc; done += dp.stats.done;
      days.push({ date, dp });
    }
    return { days, veh, tot, canc, done, km, kmEx, kmN };
  }

  /* ---------- Cela knjiga ---------- */
  function build(y, m, o0){
    const o = opts(o0), T = monthTotals(y, m, o), pages = [];
    const title = `${MONTHS[m]} ${y}`;
    const shown = T.days.filter(d => !(o.skipEmpty && d.dp.empty));
    const front = o.front ? 2 : 0;                                    // naslovnica + kazalo
    const isOdd = i => i % 2 === 0;                                   // indeks 0 = stran 1
    const dayStart = [];
    let count = front;
    const seq = [];
    shown.forEach(({ date, dp }) => {
      const ps = dp.pages.slice();
      if (o.duplex && (ps.length % 2)) ps.push(noteBlank(date, o));
      dayStart.push({ date, page:count + 1, dp });
      seq.push(...ps); count += ps.length;
    });
    if (o.summary){ seq.push({ kind:'povzetek' }); count++; }
    const N = count;
    const foot = pn => `<footer class="pb-foot"><span>Knjiga reševalnih prevozov · ${esc(title)}</span><span>str. ${pn} / ${N}</span></footer>`;
    const sec = (pn, inner) => `<section class="pb-page ${(!o.duplex || pn % 2 === 1) ? 'pb-odd' : 'pb-even'}" data-pn="${pn}">${inner}${foot(pn)}</section>`;
    const out = [];
    if (o.front){
      const nonEmpty = T.days.filter(d => !d.dp.empty).length;
      out.push(sec(1, `<div class="pb-cover"><div class="pd-logos" style="justify-content:center">${logoInner()}</div><h1>KNJIGA REŠEVALNIH PREVOZOV</h1><h2>${esc(title)}</h2>
        <p>Reševalna postaja Brežice · Zdravstveni dom Brežice</p><p class="pb-big">${T.tot}</p><p>prevozov v mesecu${T.canc ? ` (odpovedanih: ${T.canc})` : ''}</p>
        <p class="pd-fine">Izpisano ${new Date().toLocaleString('sl-SI')} · dni z vpisi: ${nonEmpty} od ${T.days.length}</p></div>`));
      const kz = dayStart.map(s => `<tr><td>${fmtDMY(s.date)}</td><td>${DOW_LONG[dow(s.date)]}${holiday(s.date) ? ' · ' + esc(holiday(s.date)) : ''}</td><td class="num">${s.dp.stats.n || ''}</td><td class="num">${s.dp.stats.canc || ''}</td><td class="num">${s.page}</td></tr>`).join('');
      out.push(sec(2, `${head(`${y}-${pad(m + 1)}-01`, 1, 1, 'KAZALO · ' + title.toUpperCase(), true)}
        <table class="pd-tab pb-index"><colgroup><col style="width:30mm"><col><col style="width:26mm"><col style="width:30mm"><col style="width:18mm"></colgroup><thead><tr><th>Datum</th><th>Dan</th><th class="num">Prevozov</th><th class="num">Odpovedanih</th><th class="num">Stran</th></tr></thead><tbody>${kz || '<tr><td colspan="5">Ni dni.</td></tr>'}</tbody></table>`));
    }
    seq.forEach((p, i) => {
      const pn = front + i + 1;
      if (p.kind === 'povzetek'){
        const vr = Object.keys(T.veh).sort().map(k => `<tr><td><b>${esc(k)}</b></td><td class="num">${T.veh[k].n}</td><td class="num">${T.veh[k].km ? KM.fmtKm(T.veh[k].km) : ''}</td></tr>`).join('');
        out.push(sec(pn, `${head(`${y}-${pad(m + 1)}-01`, 1, 1, 'MESEČNI POVZETEK · ' + title.toUpperCase(), true)}
          <table class="pd-tab pb-sum"><tbody><tr><td>Prevozov (brez odpovedanih)</td><td class="num"><b>${T.tot}</b></td></tr><tr><td>Opravljenih (označenih)</td><td class="num"><b>${T.done}</b></td></tr><tr><td>Odpovedanih</td><td class="num"><b>${T.canc}</b></td></tr>
          <tr><td>Kilometrina prevozov (OD→DO${T.kmEx ? '' : ', del je ocena ~'})</td><td class="num"><b>${T.kmN ? (T.kmEx ? '' : '~') + KM.fmtKm(T.km) + ' km' : 'ni izračunana'}</b></td></tr></tbody></table>
          <h3 style="margin:14px 0 4px">Po vozilih</h3><table class="pd-tab pb-sum"><thead><tr><th>Vozilo</th><th class="num">Prevozov</th><th class="num">Km</th></tr></thead><tbody>${vr || '<tr><td colspan="3">Ni podatkov.</td></tr>'}</tbody></table>
          <p class="pd-fine">Vozilo je določeno iz razporeda ali objavljenega razporeda oziroma po imenu v »Kdo je naredil odvoz«; prevozi brez znanega vozila so v vrstici »(brez vozila)«. Kilometrina je razdalja OD→DO po cestah (osebni avto), ne vožnja reševalca do pacienta in nazaj.</p>
          <h3 style="margin:14px 0 4px">Opombe meseca</h3>${lines(200)}
          <div class="pd-sign"><span>Pregledal: ______________________</span><span>Datum: ______________</span></div>`));
      } else out.push(sec(pn, p.inner()));
    });
    return { y, m, title, html:out.join(''), pagesHtml:out, pages:N, sheets:Math.ceil(N / (o.duplex ? 2 : 1)), days:shown.length, rides:T.tot, canc:T.canc, opts:o, dayStart:dayStart.map(s => ({ date:s.date, page:s.page })), totals:T };
  }

  /* ---------- Možnosti se zapomnijo samo v tej napravi ---------- */
  const KEY = 'kp.book.opts';
  const load = () => { try { return opts(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return opts({}); } };
  const store = o => { try { localStorage.setItem(KEY, JSON.stringify(opts(o))); } catch (e) { /* brez shranjevanja */ } };

  /* ---------- Predogled, tisk in PDF ----------
     Knjiga se NE tiska več iz glavnega okna aplikacije: vsaka pot (predogled strani, tisk, odpiranje v novem zavihku) dobi samostojen dokument z isto
     stilsko tabelo (css()), zato je predogled enak natisnjenemu. Dokument nima skript (CSP), samo oznake in stil. */
  const CSS = [
    '@page{size:A4 portrait;margin:0}',
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    'html,body{margin:0;padding:0;background:#fff;color:#000}',
    'body{font:11px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--gut:12mm}',
    'h1,h2,h3,h4{font-family:inherit;margin:0;text-wrap:balance;letter-spacing:-.01em}',
    'table{border-collapse:collapse;width:100%;font-size:13.5px}',
    'th{font-size:11px;letter-spacing:.07em;text-transform:uppercase;text-align:left;font-weight:600;padding:9px 12px;white-space:nowrap}',
    'td{padding:10px 12px;vertical-align:top}',
    '.logoitem{display:inline-flex;align-items:center} .logoitem img{height:32px;width:auto;max-width:190px;object-fit:contain;display:block} .logoitem .lf{font:700 13px system-ui,sans-serif;color:#0D1A2C} .logoitem .lf[hidden]{display:none}',
    '#printArea{display:block;background:#fff;color:#000;font:11px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '#printArea h2{margin:0 0 2px;font-size:18px} #printArea h3{margin:12px 0 4px;font-size:13px;text-transform:capitalize}',
    '#printArea section{break-inside:avoid} #printArea table{width:100%;border-collapse:collapse}',
    '#printArea th,#printArea td{border:1px solid #888;padding:2px 5px;text-align:left;vertical-align:top;color:#000;background:#fff}',
    '#printArea th{background:#e8e8e8} #printArea tr.p-cancel td{background:#fde2e2;color:#b00020} #printArea td.num,#printArea th.num{text-align:right}',
    '.pd-head{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px}',
    '.pd-logos{display:flex;gap:8px;align-items:center;min-height:34px} .pd-logos img{max-height:34px;width:auto} .pd-logos i{display:none}',
    '.pd-title{display:flex;flex-direction:column;text-align:center} .pd-title b{font-size:15px;letter-spacing:.04em} .pd-title span{font-size:11px}',
    '.pd-date{text-align:right;line-height:1.5} .pd-date b{font-size:13px} .pd-pg{font-size:10px;color:#444}',
    '.pd-veh{margin:0 0 6px;font-size:12px}',
    '.pd-tab{width:100%;border-collapse:collapse;table-layout:fixed}',
    '.pd-tab th,.pd-tab td{border:1px solid #000;padding:3px 4px;vertical-align:top;word-break:break-word;height:19px;color:#000;background:#fff}',
    '.pd-tab th{background:#e6e6e6;font-size:10px;text-transform:uppercase}',
    '.pd-tab .pd-nr{width:9.5mm;padding-left:1px;padding-right:1px;text-align:center;font-weight:700;white-space:nowrap} .pd-tab .pd-t{width:15mm;text-align:center;font-family:ui-monospace,Menlo,monospace} .pd-tab .pd-v{width:14mm;text-align:center}',
    '.pd-tab tr.pd-empty td{height:30px}',
    '.pd-tab tr.p-cancel td{color:#c00000;text-decoration:line-through} .pd-tab tr.p-cancel td b{text-decoration:none;display:inline-block}',
    '.pd-crew td{height:34px;font-size:12px} .pd-pos{margin-top:12px} .pd-pos ul{margin:4px 0 0 16px;padding:0} .pd-lines{height:90px;background:repeating-linear-gradient(transparent 0 21px,#999 21px 22px)}',
    '.pd-sign{display:flex;justify-content:space-between;margin-top:22px;font-size:12px} .pd-fine{font-size:9.5px;color:#444;margin:8px 0 0} .pd-warn{color:#c00000;font-weight:700;margin:8px 0 0}',
    '.pb-page{box-sizing:border-box;width:210mm;height:296mm;padding:9mm 9mm 15mm;position:relative;break-after:page;break-inside:auto}',
    '.pb-page:last-child{break-after:auto}',
    '.pb-odd{padding-left:calc(9mm + var(--gut))} .pb-even{padding-right:calc(9mm + var(--gut))}',
    '.pb-foot{position:absolute;bottom:6mm;display:flex;justify-content:space-between;font-size:9.5px;color:#444;border-top:1px solid #999;padding-top:2px}',
    '.pb-odd .pb-foot{left:calc(9mm + var(--gut));right:9mm} .pb-even .pb-foot{left:9mm;right:calc(9mm + var(--gut))}',
    '.pb-cover{text-align:center;margin-top:55mm} .pb-cover h1{font-size:26px;letter-spacing:.04em;margin:26px 0 6px} .pb-cover h2{font-size:34px;text-transform:capitalize;margin:0 0 22px} .pb-cover p{margin:4px 0;font-size:13px}',
    '.pb-cover .pb-big{font-size:64px;font-weight:700;margin:26px 0 0;line-height:1} .pb-cover .pd-logos img{max-height:56px} .pb-cover .pd-logos{justify-content:center}',
    '.pb-index td,.pb-sum td{height:auto;padding:2px 6px} .pb-index td.num,.pb-sum td.num,.pb-index th.num,.pb-sum th.num{text-align:right}',
    '.pd-empty-day{font-size:14px;margin:22px 0;color:#444}',
    '.pd-by{font-size:9px;color:#333;margin-top:1px} .pd-chk{color:#b45309} .pd-ruled{margin-top:6px} .pd-ln{height:22px;border-bottom:1px solid #999}',
    '#printArea .pd-tab th{font-size:9px;padding:3px 2px;letter-spacing:0}',
    /* samo na zaslonu (predogled, odprt zavihek): ozadje, senca strani in siv pas notranjega roba za vezavo; pri tisku se nič od tega ne izpiše */
    '@media screen{',
    ' .pb-odd{background-image:linear-gradient(90deg,#e6ebf3 0,#e6ebf3 var(--gut),transparent var(--gut))} .pb-even{background-image:linear-gradient(270deg,#e6ebf3 0,#e6ebf3 var(--gut),transparent var(--gut))}',
    ' body.m-view{overflow:hidden;background:#fff}',
    ' body.m-tab{background:#cfd6e2;padding:0 0 28px} body.m-tab #printArea{background:transparent} body.m-tab .pb-page{margin:14px auto;box-shadow:0 2px 14px rgba(0,0,0,.28);background-color:#fff}',
    ' .bk-bar{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#0d1a2c;color:#fff;font:13px/1.4 system-ui,sans-serif}',
    ' .bk-bar b{font-size:14px} .bk-bar span{flex:1 1 280px;opacity:.92} .bk-bar button{font:700 14px system-ui,sans-serif;padding:9px 16px;border:0;border-radius:8px;background:#DD5207;color:#fff;cursor:pointer}',
    ' @media (pointer:coarse){.bk-bar{font-size:26px;padding:18px 22px;gap:16px} .bk-bar b{font-size:28px} .bk-bar button{font-size:28px;padding:16px 28px;border-radius:14px}}',
    '}',
    '@media print{.bk-bar{display:none!important} body.m-tab .pb-page{margin:0;box-shadow:none}}'
  ].join('\n');
  const css = () => CSS;
  /* mode: 'print' (cela knjiga), 'tab' (cela knjiga za zaslon: odprt zavihek), 'view' (ena stran za predogled; page = številka strani) */
  function doc(b, mode, page){
    mode = mode || 'print'; const dt = 'Knjiga prevozov ' + b.title;
    const pages = mode === 'view' ? [b.pagesHtml[Math.min(b.pages, Math.max(1, +page || 1)) - 1] || ''] : b.pagesHtml;
    const bar = mode === 'tab' ? `<div class="bk-bar"><b>${esc(dt)}</b><span>${b.pages} strani. Za tisk ali PDF izberi v meniju brskalnika (⋮ ali »Deli«) možnost <b>Natisni</b>; tam lahko izbereš tudi »Shrani kot PDF«. Papir A4 pokončno, merilo 100 %.</span><button type="button" id="bkGo">Natisni / PDF</button></div>` : '';
    return `<!doctype html><html lang="sl"><head><meta charset="utf-8"><title>${esc(dt)}</title>${mode === 'tab' ? '<meta name="viewport" content="width=794">' : ''}<style>${CSS}</style></head><body class="m-${mode}" style="--gut:${b.opts.gut}mm">${bar}<div id="printArea" class="pbook">${pages.join('')}</div></body></html>`;
  }
  const hooks = { print:null, open:null };
  /* tisk: skrit okvir s celotno knjigo, nato print() samo tega okvirja (ne glavnega okna). Na nekaterih telefonih (iOS) to ne deluje: tam »odpri v zavihku«. */
  function printFrame(b){
    const html = doc(b, 'print');
    audit('knjiga.tisk.mesec', { mesec:`${b.y}-${pad(b.m + 1)}`, strani:b.pages });
    if (hooks.print) return hooks.print(html, b);
    const old = document.getElementById('bkPrintFrame'); if (old) old.remove();
    const fr = document.createElement('iframe'); fr.id = 'bkPrintFrame'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.title = 'Knjiga za tisk';
    fr.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px;height:1123px;border:0;visibility:hidden';
    let done = false;
    const clean = () => { if (done) return; done = true; setTimeout(() => fr.remove(), 1500); };
    fr.onload = () => {
      try { const w = fr.contentWindow; w.addEventListener('afterprint', clean); w.focus(); w.print(); setTimeout(clean, 10 * 60 * 1000); }
      catch (e) { clean(); toast('Tiskanja ni mogoče zagnati v tem brskalniku. Uporabi »Odpri za tisk / PDF«.'); }
    };
    fr.srcdoc = html; document.body.appendChild(fr);
    return fr;
  }
  /* odpre knjigo v novem zavihku (telefon: Deli/⋮ → Natisni → Shrani kot PDF). Vrne okno ali null, če je brskalnik blokiral pojavno okno. */
  function openTab(b){
    const html = doc(b, 'tab').replace(/(\ssrc=")(?!data:|blob:|https?:)([^"]*)"/g, (m, a, u) => { try { return a + new URL(u.replace(/&amp;/g, '&'), location.href).href + '"'; } catch (e) { return m; } });
    audit('knjiga.odprto.mesec', { mesec:`${b.y}-${pad(b.m + 1)}`, strani:b.pages });
    if (hooks.open) return hooks.open(html, b);
    let url = ''; try { url = URL.createObjectURL(new Blob([html], { type:'text/html;charset=utf-8' })); } catch (e) { return null; }
    const w = window.open(url, '_blank');
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { /* nič */ } }, 15 * 60 * 1000);
    if (w){ try { w.addEventListener('load', () => { const bt = w.document.getElementById('bkGo'); if (bt) bt.addEventListener('click', () => w.print()); }); } catch (e) { /* gumb je dodatek: meni brskalnika deluje vedno */ } }
    return w || null;
  }
  /* zgodovinsko ime: tisk celotne knjige */
  function print(y, m, o, built){ const b = built || build(y, m, o); printFrame(b); return b; }
  /* so podatki za mesec že naloženi iz skupne baze? (v lokalnem načinu vedno) */
  function monthReady(y, m){
    const a = `${y}-${pad(m + 1)}-01`, b = `${y}-${pad(m + 1)}-${pad(daysInMonth(y, m))}`;
    if (typeof SY === 'undefined' || !SY.range) return true;
    return a >= SY.range.from && b <= SY.range.to && !!SY.dayReady;
  }
  return { DEF, opts, build, print, printFrame, openTab, doc, css, hooks, load, store, dayData, dayPages, monthReady, P1, P2, CONT };
})();
