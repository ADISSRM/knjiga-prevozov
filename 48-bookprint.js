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
    return { html:out.join(''), pages:N, sheets:Math.ceil(N / (o.duplex ? 2 : 1)), days:shown.length, rides:T.tot, canc:T.canc, opts:o, dayStart:dayStart.map(s => ({ date:s.date, page:s.page })), totals:T };
  }

  /* ---------- Možnosti se zapomnijo samo v tej napravi ---------- */
  const KEY = 'kp.book.opts';
  const load = () => { try { return opts(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return opts({}); } };
  const store = o => { try { localStorage.setItem(KEY, JSON.stringify(opts(o))); } catch (e) { /* brez shranjevanja */ } };

  function print(y, m, o, built){
    let el = document.getElementById('printArea');
    if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
    const b = built || build(y, m, o);
    el.className = 'pbook'; el.style.setProperty('--gut', b.opts.gut + 'mm'); el.innerHTML = b.html;
    audit('knjiga.tisk.mesec', { mesec:`${y}-${pad(m + 1)}`, strani:b.pages });
    window.print();
    return b;
  }
  /* so podatki za mesec že naloženi iz skupne baze? (v lokalnem načinu vedno) */
  function monthReady(y, m){
    const a = `${y}-${pad(m + 1)}-01`, b = `${y}-${pad(m + 1)}-${pad(daysInMonth(y, m))}`;
    if (typeof SY === 'undefined' || !SY.range) return true;
    return a >= SY.range.from && b <= SY.range.to && !!SY.dayReady;
  }
  return { DEF, opts, build, print, load, store, dayData, dayPages, monthReady, P1, P2, CONT };
})();
