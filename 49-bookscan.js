/* =====================================================================
   SKENIRANJE STRANI PAPIRNE KNJIGE (fotografija strani → prevozi v dnevu)
   Pot: fotografija → poravnava (zasuk) in izboljšava kontrasta → razpoznava besed (OCR, izolirani okvir ocr/ocr.html; vrne besede z okvirji in zanesljivostjo)
        → vrstice (po številkah polj 1–24) in stolpci (po glavi tabele ali po poravnavi besed) → polja (ime, od, do, ura, način, opomba)
        → primerjava z znanim (baza pacientov, ustanove, klinike, naselja, ulice) → ocena zanesljivosti vsakega polja.
   Aplikacija NE ugiba tiho: vsako polje dobi stopnjo
        ok   = prebrano in potrjeno z znanimi podatki (npr. ime je v bazi, cilj je znana ustanova, ura je smiselna),
        chk  = prebrano, vendar ni potrjeno (novo ime, neznan kraj, slaba razpoznava): PREVERI,
        bad  = neberljivo, manjka ali nesmiselno: POPRAVI.
   Pri vsaki vrstici je v pregledu izrez fotografije, da se prebrano primerja z originalom. Nepotrjena polja ostanejo označena tudi v knjigi (r.chk), dokler jih dispečer ne potrdi.
   Rokopis: razpoznava besedila v brskalniku (Tesseract) je dobra pri tiskanem besedilu in razločni tiskani pisavi, pri tekočem rokopisu pogosto zgreši; zato je označevanje bistveno.
   Razčlenjevalec (parse) je čista funkcija nad besedami; slika in besedilo se NE shranita.
   ===================================================================== */
const BSCAN = (() => {
  const T_ = v => String(v ?? '');
  const N = s => norm(s);
  const med = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

  /* ---------- Razdalja med nizi, odporna na tipične napake OCR (0/o, 1/l, 5/s, rn/m …) ---------- */
  const CONF = new Set(['0o', '1l', '1i', 'il', 'li', '5s', '8b', '2z', '6g', '9g', '1t', 'tl', 'ce', 'ec', 'uv', 'vu', 'nh', 'hn', 'ao', 'oa', 'eo', 'oe']);
  const confusable = (a, b) => CONF.has(a + b) || CONF.has(b + a);
  const ocrNorm = s => N(s).replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function ed(a, b){
    const n = a.length, m = b.length; if (!n) return m; if (!m) return n;
    let prev = Array.from({ length:m + 1 }, (_, j) => j);
    for (let i = 1; i <= n; i++){
      const cur = [i];
      for (let j = 1; j <= m; j++){
        const c = a[i - 1] === b[j - 1] ? 0 : confusable(a[i - 1], b[j - 1]) ? 0.35 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
      }
      prev = cur;
    }
    return prev[m];
  }
  const sim = (a, b) => { const x = ocrNorm(a), y = ocrNorm(b), L = Math.max(x.length, y.length); return L ? 1 - ed(x, y) / L : 0; };
  const simNS = (a, b) => { const x = ocrNorm(a).replace(/ /g, ''), y = ocrNorm(b).replace(/ /g, ''), L = Math.max(x.length, y.length); return L ? 1 - ed(x, y) / L : 0; };
  /* imena: vrstni red besed ni pomemben (»Priimek Ime« = »Ime Priimek«) */
  const simName = (a, b) => {
    const x = ocrNorm(a).split(' ').filter(Boolean).sort().join(' '), y = ocrNorm(b).split(' ').filter(Boolean).sort().join(' '), L = Math.max(x.length, y.length);
    return L ? 1 - ed(x, y) / L : 0;
  };

  /* ---------- Besede ---------- */
  const trimTok = t => T_(t).replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}.:)]+$/u, '');
  function cleanWords(words){
    return (words || []).map(w => {
      const bb = w.bbox || {}, x0 = +(w.x0 ?? bb.x0), y0 = +(w.y0 ?? bb.y0), x1 = +(w.x1 ?? bb.x1), y1 = +(w.y1 ?? bb.y1);
      const c = +(w.conf ?? w.confidence ?? w.c);
      return { t:trimTok(w.text ?? w.t), c:isFinite(c) ? Math.max(0, Math.min(100, c)) : 0, x0, y0, x1, y1 };
    }).filter(w => w.t && /[\p{L}\p{N}]/u.test(w.t) && isFinite(w.x0 + w.y0 + w.x1 + w.y1) && w.x1 > w.x0 && w.y1 > w.y0);
  }
  const cx = w => (w.x0 + w.x1) / 2, cy = w => (w.y0 + w.y1) / 2;
  /* besede enega polja → besedilo in zanesljivost (uteženo z dolžino besede) */
  function cellOf(ws){
    const s = ws.slice().sort((a, b) => (Math.abs(cy(a) - cy(b)) > Math.min(a.y1 - a.y0, b.y1 - b.y0) * 0.6) ? cy(a) - cy(b) : a.x0 - b.x0);
    const text = s.map(w => w.t).join(' ').replace(/\s+/g, ' ').trim();
    let sw = 0, sc = 0, mn = 100; s.forEach(w => { const l = Math.max(1, w.t.length); sw += l; sc += w.c * l; mn = Math.min(mn, w.c); });
    return { text, conf:sw ? Math.round(sc / sw) : 0, min:s.length ? Math.round(mn) : 0, n:s.length, ws:s };
  }

  /* ---------- Poravnava številk (OCR) ---------- */
  const DIGFIX = { O:'0', o:'0', Q:'0', D:'0', l:'1', I:'1', '|':'1', i:'1', S:'5', s:'5', B:'8', Z:'2', z:'2', g:'9' };
  const fixNum = t => String(t).replace(/[OoQDlI|iSsBZzg]/g, c => DIGFIX[c] || c);
  const isNumTok = t => /^[0-9OoQDlI|iSsBZz]{1,2}[.)]?$/.test(t) && /\d|[lI|O]/.test(t);
  const numVal = t => { const v = parseInt(fixNum(String(t).replace(/[.)]$/, '')), 10); return isFinite(v) ? v : null; };

  /* ---------- Glava tabele ---------- */
  const HEAD_KEYS = [['nr', ['st', 'stev', 'zst']], ['name', ['ime', 'priimek', 'pacient', 'ime in priimek']], ['from', ['od', 'iz']], ['to', ['do', 'cilj', 'kam']], ['time', ['ura', 'cas', 'prev', 'uraprev', 'ura prevoza']], ['pick', ['pobere', 'pobira', 'pobiranje']], ['veh', ['vozilo', 'avto']], ['note', ['opomba', 'opombe', 'posebnosti']]];
  function headKey(t){
    const n = ocrNorm(t).replace(/ /g, ''); if (!n) return null;
    for (const [k, list] of HEAD_KEYS) for (const h of list){ if (n === h) return k; if (h.length >= 5 && n.length >= 4 && sim(n, h) >= 0.78) return k; }
    return null;
  }
  function findHeader(ws, mh){
    const hits = ws.map(w => ({ w, k:headKey(w.t) })).filter(x => x.k);
    if (hits.length < 3) return null;
    const groups = [];
    hits.sort((a, b) => cy(a.w) - cy(b.w)).forEach(h => { const g = groups.find(g => Math.abs(g.y - cy(h.w)) <= mh * 1.1); if (g){ g.items.push(h); g.y = (g.y * (g.items.length - 1) + cy(h.w)) / g.items.length; } else groups.push({ y:cy(h.w), items:[h] }); });
    const ok = groups.filter(g => new Set(g.items.map(i => i.k).filter(k => k !== 'nr')).size >= 3).sort((a, b) => a.y - b.y)[0];
    if (!ok) return null;
    const cols = {};
    ok.items.forEach(({ w, k }) => { if (!cols[k] || w.x0 < cols[k].x0) cols[k] = { key:k, x0:w.x0, x1:w.x1 }; });
    return { y:ok.y, y1:Math.max(...ok.items.map(i => i.w.y1)), cols:Object.values(cols).sort((a, b) => a.x0 - b.x0) };
  }

  /* ---------- Vrstice po številkah polj ---------- */
  function findRows(ws, mh, head, box){
    const top = head ? head.y1 : box.y0 - 1, leftLimit = head ? (head.cols.find(c => c.key === 'name') || head.cols[0]).x0 - mh * 0.3 : box.x0 + (box.x1 - box.x0) * 0.14;
    let cand = ws.filter(w => w.y0 >= top - 1 && cx(w) < leftLimit && isNumTok(w.t) && numVal(w.t) >= 1 && numVal(w.t) <= 60).sort((a, b) => cy(a) - cy(b));
    /* najdaljše zaporedje naraščajočih številk (OCR napačno prebrane številke izpustimo) */
    const best = [];
    const L = cand.map(() => 1), P = cand.map(() => -1);
    for (let i = 0; i < cand.length; i++) for (let j = 0; j < i; j++) if (numVal(cand[j].t) < numVal(cand[i].t) && L[j] + 1 > L[i]){ L[i] = L[j] + 1; P[i] = j; }
    let bi = 0; L.forEach((v, i) => { if (v > L[bi]) bi = i; });
    for (let i = bi; i >= 0 && cand.length; i = P[i]) best.unshift(cand[i]);
    cand = best;
    return cand.map(w => ({ nr:numVal(w.t), y:cy(w), conf:w.c, w, derived:false }));
  }
  /* manjkajoče številke izpelji iz razmika vrstic */
  function fillRows(rows){
    if (rows.length < 3) return rows;
    const pitch = med(rows.slice(1).map((r, i) => (r.y - rows[i].y) / Math.max(1, r.nr - rows[i].nr)));
    if (!(pitch > 0)) return rows;
    const out = [rows[0]];
    for (let i = 1; i < rows.length; i++){
      const a = rows[i - 1], b = rows[i], k = b.nr - a.nr;
      for (let j = 1; j < k; j++) out.push({ nr:a.nr + j, y:a.y + (b.y - a.y) * j / k, conf:0, w:null, derived:true });
      out.push(b);
    }
    return out;
  }
  /* brez številk: vrstice = vrstice besedila */
  function lineRows(ws, mh, top){
    const s = ws.filter(w => w.y0 >= top - 1).sort((a, b) => cy(a) - cy(b)), rows = [];
    s.forEach(w => { const r = rows[rows.length - 1]; if (r && Math.abs(cy(w) - r.y) <= mh * 0.65){ r.n++; r.y = (r.y * (r.n - 1) + cy(w)) / r.n; } else rows.push({ nr:null, y:cy(w), conf:0, w:null, derived:true, n:1 }); });
    return rows;
  }

  /* ---------- Stolpci ---------- */
  function startClusters(rowWords, mh, nRows){
    const xs = [];
    rowWords.forEach(ws => { const s = ws.slice().sort((a, b) => a.x0 - b.x0); s.forEach((w, i) => { if (i === 0 || w.x0 - s[i - 1].x1 > mh * 1.4) xs.push(w.x0); }); });
    xs.sort((a, b) => a - b);
    const cl = []; xs.forEach(x => { const c = cl[cl.length - 1]; if (c && x - c.last <= mh * 1.2){ c.v.push(x); c.last = x; } else cl.push({ v:[x], last:x }); });
    return cl.filter(c => c.v.length >= Math.max(3, nRows * 0.25)).map(c => med(c.v)).sort((a, b) => a - b);
  }

  /* glava: kratke besede (»Do«) OCR pogosto zgreši → manjkajoči stolpec dopolnimo iz poravnave besed v vrsticah */
  const COL_ORDER = ['nr', 'name', 'from', 'to', 'time', 'pick', 'veh', 'note'];
  function repairCols(cols, edges, mh){
    const free = edges.filter(e => !cols.some(k => Math.abs(k.x0 - e) < mh * 1.8));
    COL_ORDER.forEach((key, oi) => {
      if (cols.some(c => c.key === key)) return;
      const prev = cols.filter(c => COL_ORDER.indexOf(c.key) < oi).sort((a, b) => b.x0 - a.x0)[0], next = cols.filter(c => COL_ORDER.indexOf(c.key) > oi).sort((a, b) => a.x0 - b.x0)[0];
      if (!prev || !next) return;
      const cand = free.find(e => e > prev.x0 + mh * 2 && e < next.x0 - mh * 2);
      if (cand != null){ cols.push({ key, x0:cand, inferred:true }); free.splice(free.indexOf(cand), 1); }
    });
    return cols.sort((a, b) => a.x0 - b.x0);
  }

  /* ---------- Polja ---------- */
  const RE_TIME = /^(\d{1,2})\s*[:.,;h]\s*(\d{2})$/;
  const timeLike = t => { const s = fixNum(T_(t).trim()); return RE_TIME.test(s) || /^\d{3,4}$/.test(s) || /^(dop|pop)\.?$/i.test(T_(t).trim()); };
  function parseTime(text){
    const raw = T_(text).trim(); if (!raw) return { v:'', dia:'' };
    if (/^(dop|dopoldne|dopoldanska)\.?$/i.test(raw)) return { v:'', dia:'dop' };
    if (/^(pop|popoldne|popoldanska)\.?$/i.test(raw)) return { v:'', dia:'pop' };
    const s = fixNum(raw.replace(/\s+/g, '').replace(/^ob/i, ''));
    let h, m, mm;
    if ((mm = RE_TIME.exec(s))){ h = +mm[1]; m = +mm[2]; }
    else if ((mm = /^(\d{1,2})[hH]?$/.exec(s))){ h = +mm[1]; m = 0; }
    else if ((mm = /^(\d{1,2})(\d{2})$/.exec(s))){ h = +mm[1]; m = +mm[2]; }
    else return { v:null, dia:'' };
    if (h > 23 || m > 59) return { v:null, dia:'' };
    return { v:pad(h) + ':' + pad(m), dia:'' };
  }
  const MODE_WORDS = [['sede', 'sede'], ['sedece', 'sede'], ['leze', 'leze'], ['lezece', 'leze'], ['utila', 'utila'], ['utilo', 'utila'], ['vzorci', 'vzorci'], ['vzorec', 'vzorci'], ['vzorce', 'vzorci']];
  function modeIn(text){
    let mode = '', rest = [];
    T_(text).split(/\s+/).filter(Boolean).forEach(tk => {
      const n = ocrNorm(tk); const hit = MODE_WORDS.find(([w]) => n === w || (w.length >= 5 && sim(n, w) >= 0.8));
      if (hit && !mode) mode = hit[1]; else rest.push(tk);
    });
    return { mode, rest:rest.join(' ') };
  }
  const nameCase = s => { const t = T_(s).trim(); return (t === t.toUpperCase() || t === t.toLowerCase()) ? t.toLowerCase().replace(/(^|[\s\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : t; };

  /* znano besedišče za primerjavo (pacienti, ustanove, klinike, naselja, mesta, ulice) */
  let _voc = null, _vocKey = '';
  function vocab(){
    const key = (S.places || []).length + '|' + (S.addrBook || []).length + '|' + (S.patients || []).length;
    if (_voc && _vocKey === key) return _voc;
    const v = [], add = (s, label, kind) => { const x = ocrNorm(s); if (x && x.length >= 2) v.push({ s:x, label, kind }); };
    POIS.forEach(p => { add(p.n, p.n, 'ustanova'); (p.al || []).forEach(a => add(a, p.n, 'ustanova')); });
    (S.places || []).forEach(p => { const lb = p.parent ? p.parent + ' – ' + p.n : p.n; add(p.parent + ' ' + p.n, lb, 'klinika'); (p.al || []).forEach(a => add(p.parent + ' ' + a, lb, 'klinika')); });
    SETTLEMENTS.forEach(s => add(s.n, s.n, 'kraj')); TOWNS.forEach(s => add(s.n, s.n, 'kraj')); BREZICE_STREETS.forEach(s => add(s, s, 'ulica'));
    _voc = v; _vocKey = key; return v;
  }
  /* najboljši predlogi za besedilo kraja/ustanove; naslov brez hišne številke in z njo */
  function placeSuggest(text, max = 3){
    const m = /^(.*?)(?:\s+(\d+\s*[a-zA-Z]?))?$/.exec(T_(text).trim()), base = (m && m[1]) || T_(text), num = (m && m[2]) || '';
    const voc = vocab(), out = [];
    const full = ocrNorm(text);
    voc.forEach(e => { const sc = Math.max(sim(base, e.s), sim(text, e.s), simNS(base, e.s), simNS(text, e.s)); if (sc >= 0.74 && !(Math.abs(e.s.length - full.length) > 6 && e.s.length > 6 && full.length < 5)) out.push({ label:(e.kind === 'ulica' || e.kind === 'kraj') && num ? e.label + ' ' + num.replace(/\s+/g, '') : e.label, score:sc, kind:e.kind }); });
    const seen = new Set();
    return out.sort((a, b) => b.score - a.score).filter(o => !seen.has(o.label) && seen.add(o.label)).slice(0, max);
  }
  /* Rokopis OCR pogosto prebere samo priimek ali samo del imena: poleg primerjave celega imena velja tudi ujemanje posamezne besede (najmanj 4 črke, podobnost ≥ 0,8);
     tak predlog je vedno samo predlog (nikoli samodejno potrjen). */
  function patientSuggest(name, max = 3){
    const out = [], tk = ocrNorm(name).split(' ').filter(t => t.length >= 4);
    (S.patients || []).forEach(p => {
      let sc = simName(name, p.name);
      if (sc < 0.68 && tk.length){
        let best = 0; ocrNorm(p.name).split(' ').filter(q => q.length >= 4).forEach(q => tk.forEach(t => { const v = sim(t, q); if (v > best) best = v; }));
        if (best >= 0.8) sc = Math.max(sc, 0.68 + (best - 0.8) * 0.5);
      }
      if (sc >= 0.68) out.push({ p, score:sc });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, max);
  }

  const LV = { ok:0, chk:1, bad:2 };
  const worst = (a, b) => (LV[b] > LV[a] ? b : a);

  /* ---------- Ocena polj ---------- */
  function judgeName(cell, row, o){
    const text = cell.text, f = { v:text, lvl:'ok', why:[], sug:[], pid:'' };
    if (!text){ f.lvl = row.mode === 'vzorci' ? 'ok' : 'bad'; if (f.lvl === 'bad') f.why.push('ime manjka ali ni berljivo'); return f; }
    f.v = nameCase(text.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2'));
    const sg = patientSuggest(f.v);
    const top = sg[0], second = sg[1];
    if (top && top.score >= 0.88 && (!second || top.score - second.score >= 0.06)){ f.v = top.p.name; f.pid = top.p.id; f.why.push(`v bazi pacientov (${Math.round(top.score * 100)} %)`); if (cell.conf < 40) { f.lvl = 'chk'; f.why.push('slaba razpoznava, preveri ime'); } return f; }
    if (sg.length){ f.lvl = 'chk'; f.sug = sg.map(x => ({ label:x.p.name, pid:x.p.id, score:x.score })); f.why.push('podobno imenu v bazi: izberi ali popravi'); return f; }
    const toks = f.v.split(/\s+/).filter(t => /\p{L}{2,}/u.test(t));
    if (cell.conf >= 65 && toks.length >= 2 && !junkText(text)){ f.lvl = 'chk'; f.why.push('pacienta ni v bazi (nov pacient?): preveri črkovanje'); }
    else { f.lvl = 'bad'; f.why.push(cell.conf < 65 ? `slabo berljivo (${cell.conf} %)` : 'ime ni popolno'); if (junkText(text) || cell.conf < 45){ f.v = ''; f.why = ['rokopisa ne razberem: vpiši s slike']; } }
    return f;
  }
  function judgePlace(cell, side, row){
    const text = cell.text, f = { v:text, lvl:'ok', why:[], sug:[] };
    if (!text){ f.lvl = row.mode === 'vzorci' && side === 'from' ? 'ok' : 'bad'; if (f.lvl === 'bad') f.why.push(side === 'from' ? 'naslov OD manjka' : 'cilj DO manjka'); return f; }
    if (/^doma\.?$/i.test(text)) { f.v = 'Doma'; return f; }
    const fx = NSCAN.fixDigits(text);
    let g = null; try { g = geo(fx); } catch (e) { g = null; }
    if (g && g.kind !== 'neznano'){
      f.v = fx;
      f.why.push(g.kind === 'poi' ? 'znana ustanova' : g.kind === 'addr' ? 'znan naslov' : 'znan kraj');
      if (cell.conf < 45){ f.lvl = 'chk'; f.why.push(`slaba razpoznava (${cell.conf} %)`); }
      else if (g.kind !== 'poi' && g.kind !== 'addr' && cell.conf < 60){ f.lvl = 'chk'; f.why.push(`razpoznava ${cell.conf} %`); }
      return f;
    }
    f.v = fx;
    const ps = placeSuggest(fx);
    f.sug = ps.map(x => ({ label:x.label, score:x.score }));
    if (ps[0] && ps[0].score >= 0.94 && (ps[0].kind === 'ustanova' || ps[0].kind === 'klinika') && (!ps[1] || ps[0].score - ps[1].score >= 0.08) && cell.conf >= 50){
      f.v = ps[0].label; f.why.push('prepoznano kot ' + ps[0].label); f.sug = []; return f;
    }
    if (f.sug.length){ f.lvl = 'chk'; f.why.push('ni znano; morda je mišljeno ponujeno'); }
    else if (cell.conf >= 70 && !junkText(fx)){ f.lvl = 'chk'; f.why.push('kraja ali ustanove ne prepoznam (zunaj Občine Brežice?)'); }
    else { f.lvl = 'bad'; f.why.push(`neberljivo (${cell.conf} %)`); if (junkText(fx) || cell.conf < 45){ f.v = ''; f.why = ['rokopisa ne razberem: vpiši s slike']; } }
    return f;
  }
  function judgeTime(cell, row){
    const text = cell.text, f = { v:'', lvl:'ok', why:[], sug:[], dia:'' };
    const t = parseTime(text);
    if (t.dia){ f.dia = t.dia; f.why.push('dializa ' + (t.dia === 'pop' ? 'popoldne' : 'dopoldne')); return f; }
    if (!text){ f.lvl = row.dia || row.mode === 'vzorci' ? 'ok' : 'chk'; if (f.lvl === 'chk') f.why.push('ure ni'); return f; }
    if (t.v == null){ f.v = row.layout === 'card' ? '' : text; f.lvl = 'bad'; f.why.push('ure ne razberem: vpiši s slike'); return f; }
    /* rokopis: slabo prebrane ure ne vpišemo, ponudimo jih le kot predlog (napačna ura je napaka v prevozu) */
    if (row.layout === 'card' && cell.conf < 60){ f.lvl = 'bad'; f.sug = [{ label:t.v, score:cell.conf / 100 }]; f.why.push(`ure ne preberem zanesljivo (${cell.conf} %): morda ${t.v}`); return f; }
    f.v = t.v; const h = +t.v.slice(0, 2), m = +t.v.slice(3);
    if (h < 5 || h > 21){ f.lvl = 'chk'; f.why.push('nenavadna ura'); }
    else if (cell.conf < 55){ f.lvl = 'chk'; f.why.push(`slaba razpoznava (${cell.conf} %)`); }
    else if (m % 5 !== 0){ f.lvl = 'chk'; f.why.push('nenavadne minute'); }
    return f;
  }

  /* ---------- Postavitev »kartice« (obrazec OBR REŠ 08) ----------
     Vsak prevoz je okvir s tremi vrsticami:  1: št. · IME PRIIMEK … Čas:   2: OD: … DO: …   3: Tel: … Način prevoza: …
     Tiskane oznake OCR bere bistveno bolje kot rokopis. Po oznaki »Način prevoza« (ena na prevoz) poiščemo okvirje (tudi na ukrivljeni in nagnjeni strani),
     vsakemu izračunamo lokalni naklon, razporedimo besede v polja in pripravimo ravno izrezan posnetek prevoza. */
  const labelOf = w => {
    const n = ocrNorm(w.t).replace(/ /g, ''); if (!n || n.length > 9) return null;
    if (n.length >= 5 && sim(n, 'prevoza') >= 0.7 && !/^prevoz(i|ov|ih|e)$/.test(n)) return 'prevoza';
    if (n.length >= 4 && sim(n, 'nacin') >= 0.78) return 'nacin';
    if (n.length <= 3){
      if (sim(n, 'tel') >= 0.66) return 'tel';
      if (sim(n, 'cas') >= 0.66) return 'cas';
      if (n.length === 2 && sim(n, 'od') >= 0.8) return 'od';
      if (n.length === 2 && sim(n, 'do') >= 0.8) return 'do';
    }
    return null;
  };
  const CARD_V = { top:-0.86, r2:-0.46, r3:-0.155, bot:0.14 };   // meje vrstic v enotah razmika med prevozi (0 = vrstica »Način prevoza«)
  function findCardAnchors(ws, box){
    const bw = box.x1 - box.x0, lab = [];
    ws.forEach(w => { if (cx(w) < box.x0 + bw * 0.3) return; const k = labelOf(w); if (k === 'prevoza' || k === 'nacin') lab.push({ w, k }); });
    if (lab.length < 3) return null;
    lab.sort((a, b) => cy(a.w) - cy(b.w));
    const lh = med(lab.map(l => l.w.y1 - l.w.y0)) || 20;
    const inst = [];
    lab.forEach(l => { const g = inst[inst.length - 1]; if (g && Math.abs(cy(l.w) - g.y) <= lh * 1.5){ g.items.push(l); g.y = g.items.reduce((s, i) => s + cy(i.w), 0) / g.items.length; } else inst.push({ y:cy(l.w), items:[l] }); });
    inst.forEach(g => { g.x0 = Math.min(...g.items.map(i => i.w.x0)); g.x1 = Math.max(...g.items.map(i => i.w.x1)); g.hasN = g.items.some(i => i.k === 'nacin'); const p = g.items.find(i => i.k === 'prevoza'); g.pre = p ? p.w.x0 : null; });
    if (inst.length < 3) return null;
    const gs = inst.slice(1).map((g, i) => g.y - inst[i].y).sort((a, b) => a - b), g0 = gs[Math.floor((gs.length - 1) * 0.25)];
    const P = med(gs.filter(g => g <= g0 * 1.35));
    if (!(P > lh * 2.5)) return null;
    /* osamelci na robu (npr. naslov »KNJIGA REŠEVALNIH PREVOZOV«) */
    const odd = g => g > P * 2.3 || (g > P * 1.35 && g < P * 1.75);   // razmik, ki ni niti en niti dva razmika med okvirji
    while (inst.length > 3 && odd(inst[1].y - inst[0].y)) inst.shift();
    while (inst.length > 3 && odd(inst[inst.length - 1].y - inst[inst.length - 2].y)) inst.pop();
    /* manjkajoče oznake: izpelji iz razmika */
    const cards = [inst[0]];
    for (let i = 1; i < inst.length; i++){
      const a = inst[i - 1], b = inst[i], k = Math.round((b.y - a.y) / P);
      if (k < 1) continue;
      for (let j = 1; j < k && j <= 3; j++) cards.push({ y:a.y + (b.y - a.y) * j / k, x0:a.x0 + (b.x0 - a.x0) * j / k, x1:a.x1 + (b.x1 - a.x1) * j / k, derived:true, items:[], hasN:a.hasN, pre:a.pre });
      cards.push(b);
    }
    if (cards.length < 3) return null;
    return { cards, lh, P };
  }
  /* telefonska številka: samo številke, običajno 9 */
  function judgePhone(cell){
    const f = { v:'', lvl:'ok', why:[], sug:[] };
    const raw = T_(cell.text).trim(); if (!raw) return f;
    const d = fixNum(raw).replace(/[^\d]/g, '');
    /* napačna številka je huda napaka (reševalec pokliče napačno osebo): predizpolnimo samo številko običajne oblike, ostalo pusti prazno */
    if (!/^0[1-9]\d{6,7}$/.test(d)){ f.lvl = 'bad'; f.why.push('telefona ne razberem: vpiši s slike'); return f; }
    const nice = d.length === 9 ? d.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3') : d.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1 $2 $3');
    if (cell.conf < 75){ f.lvl = 'bad'; f.sug = [{ label:nice, score:cell.conf / 100 }]; f.why.push(`številke ne preberem zanesljivo (${cell.conf} %): morda ${nice}`); return f; }
    f.v = nice; f.lvl = 'chk'; f.why.push('preveri številko s sliko');
    return f;
  }
  const inFrame = (c, w) => { const dx = cx(w) - c.xa; return (cy(w) - c.y - c.s * dx) / c.P; };
  function parseCards(ws, mh, box, W, H, out){
    const A = findCardAnchors(ws, box); if (!A) return null;
    const { cards, lh:L } = A, n = cards.length;
    cards.forEach((c, i) => { c.xa = (c.x0 + c.x1) / 2; c.P = A.P; });
    /* lokalni razmik (perspektiva): povprečje razmika do sosednjih okvirjev */
    cards.forEach((c, i) => { const a = cards[i - 1], b = cards[i + 1]; c.P = a && b ? (b.y - a.y) / 2 : a ? c.y - a.y : b ? b.y - c.y : A.P; c.s = 0; });
    const labs = ws.map(w => ({ w, k:labelOf(w) })).filter(x => x.k && x.k !== 'prevoza' && x.k !== 'nacin');
    const colRaw = med(cards.map(c => c.hasN ? c.x0 - 0.6 * L : (c.pre != null ? c.pre - 3.2 * L : null)).filter(v => v != null));
    const isLeft = x => x < colRaw - 2 * L;
    const pick = (k, left, py, px, maxDy, sFn) => { let b = null; labs.forEach(({ w, k:kk }) => { if (kk !== k || isLeft(cx(w)) !== left) return; const dy = cy(w) - (py + (sFn ? sFn * (cx(w) - px) : 0)); if (Math.abs(dy) <= maxDy && (!b || Math.abs(dy) < Math.abs(b.dy))) b = { w, dy }; }); return b && b.w; };
    /* naklon: tiskani oznaki v isti vrstici levo (Tel:) in desno (Način prevoza:); najprej po vsem listu, nato po okvirjih (list je lahko ukrivljen) */
    const mT = cards.map(c => { const t = pick('tel', true, c.y, c.xa, 0.6 * c.P, 0); return t && c.xa - cx(t) > L * 8 ? { t, s:(c.y - cy(t)) / (c.xa - cx(t)) } : null; });
    const sg = med(mT.filter(Boolean).map(m => m.s)) || 0;
    const mO = cards.map(c => { const d = pick('do', false, c.y - 0.31 * c.P, c.xa, 0.3 * c.P, sg); if (!d) return null; const o = pick('od', true, cy(d), cx(d), 0.3 * c.P, sg); return o && cx(d) - cx(o) > L * 8 ? { d, o, s:(cy(d) - cy(o)) / (cx(d) - cx(o)) } : null; });
    const meas = cards.map((c, i) => { const e = [mT[i], mO[i]].filter(Boolean).map(m => m.s); return e.length ? e.reduce((x, y) => x + y, 0) / e.length : null; });
    /* naklon se po listu spreminja (ukrivljena stran, perspektiva): izmerjeno vrednost obdržimo, osamelce zavrnemo, vrzeli interpoliramo */
    const have = meas.map((v, i) => v != null ? i : -1).filter(i => i >= 0), ok = meas.map((v, i) => {
      if (v == null) return null;
      const others = have.filter(j => j !== i).sort((x, y) => Math.abs(x - i) - Math.abs(y - i)).slice(0, 2).map(j => meas[j]);
      return others.length >= 2 && Math.abs(v - med(others)) > 0.07 ? null : v; });
    cards.forEach((c, i) => {
      let v = ok[i];
      if (v == null){ let lo = -1, hi = -1; for (let j = i - 1; j >= 0; j--) if (ok[j] != null){ lo = j; break; } for (let j = i + 1; j < n; j++) if (ok[j] != null){ hi = j; break; }
        v = lo >= 0 && hi >= 0 ? ok[lo] + (ok[hi] - ok[lo]) * (i - lo) / (hi - lo) : lo >= 0 ? ok[lo] : hi >= 0 ? ok[hi] : sg; }
      c.s = Math.max(-0.2, Math.min(0.2, v));
    });
    /* oznake po okvirjih (z lokalnim naklonom) */
    const EXP = { tel:0, od:-0.31, do:-0.31, cas:-0.62 };
    cards.forEach(c => {
      c.lab = {};
      ['tel', 'od', 'do', 'cas'].forEach(k => {
        const left = k === 'tel' || k === 'od'; let best = null;
        labs.forEach(({ w, k:kk }) => { if (kk !== k || isLeft(cx(w)) !== left) return; const v = inFrame(c, w), d = Math.abs(v - EXP[k]); if (d <= 0.22 && (!best || d < best.d)) best = { w, d }; });
        if (best) c.lab[k] = best.w;
      });
    });
    /* stolpci: začetek desnega stolpca (DO:), levi rob polj (OD:, Tel:), Čas: */
    const col = cards.map(c => c.lab.do ? c.lab.do.x0 - 0.3 * L : colRaw), colM = med(col);
    cards.forEach((c, i) => { c.col = Math.abs(col[i] - colM) <= 2.5 * L ? col[i] : colM; });
    const leftX = [], casOff = [];
    cards.forEach(c => { if (c.lab.od) leftX.push(c.lab.od.x0); if (c.lab.tel) leftX.push(c.lab.tel.x0); if (c.lab.cas) casOff.push(c.lab.cas.x0 - c.col); });
    const odX = (leftX.length ? Math.min(med(leftX), ...leftX.filter(v => v <= med(leftX) + L)) : box.x0 + (colM - box.x0) * 0.3) - 0.3 * L;
    const offC = casOff.length ? med(casOff) : 0.75 * (colM - odX + 4 * L);
    cards.forEach(c => { c.cas = c.lab.cas ? c.lab.cas.x0 : c.col + offC; c.casEnd = c.lab.cas ? c.lab.cas.x1 : c.cas + 2.6 * L; c.right = Math.min(W, c.casEnd + 5 * L); });
    const right = Math.min(W, Math.max(...cards.map(c => c.right)));
    /* besede v okvirje */
    const body = ws.filter(w => !(labelOf(w) === 'prevoza' || labelOf(w) === 'nacin') || true);
    const cw = cards.map(() => []), upper = [];
    body.forEach(w => {
      let k = -1;
      for (let i = 0; i < n; i++){ const v = inFrame(cards[i], w); if (v >= CARD_V.top && v < CARD_V.bot){ k = i; break; } }
      if (k < 0){ if (inFrame(cards[0], w) < CARD_V.top) upper.push(w); return; }
      cw[k].push({ w, v:inFrame(cards[k], w) });
    });
    /* številke polj: levo od oznak, v 1. vrstici */
    const numTok = cards.map((c, i) => cw[i].filter(({ w, v }) => v < CARD_V.r2 && cx(w) < odX + 0.2 * L && isNumTok(w.t) && numVal(w.t) >= 1 && numVal(w.t) <= 60).sort((a, b) => b.w.c - a.w.c)[0] || null);
    const votes = {}; numTok.forEach((t, i) => { if (t){ const d = numVal(t.w.t) - i; votes[d] = (votes[d] || 0) + 1; } });
    let d0 = null, vb = 0; Object.entries(votes).forEach(([d, v]) => { if (v > vb){ vb = v; d0 = +d; } });
    const hasDatum = upper.some(w => sim(ocrNorm(w.t), 'datum') >= 0.7);
    let nrGuess = false;
    if (d0 == null || (vb < 2 && n >= 5)){ d0 = hasDatum ? 1 : 11; nrGuess = true; }
    else if (d0 + 0 < 1 - 0) { d0 = 1; nrGuess = true; }
    out.layout = 'card'; out.header = false;
    out.cards = n; out.dbg = { y:cards.map(c => Math.round(c.y) + (c.derived ? 'd' : '')), s:cards.map(c => +c.s.toFixed(3)), sg:+sg.toFixed(3), m:meas.map(v => v == null ? null : +v.toFixed(3)), mT:mT.map(m => m ? +m.s.toFixed(3) : null), mO:mO.map(m => m ? +m.s.toFixed(3) : null), nums:numTok.map(t => t ? t.w.t : null), votes, d0, L:Math.round(L), col:Math.round(colM), odX:Math.round(odX) };
    if (nrGuess) out.notes.push(`Številk polj na strani ni mogoče prebrati: prevozi so oštevilčeni od ${d0} naprej. Preveri številke.`);
    /* polja */
    const rows = cards.map((c, i) => {
      const cell = { name:[], from:[], to:[], phone:[], mode:[], time:[], margin:[] };
      const colL = c.col - 0.5 * L;
      const sorted = cw[i].slice().sort((a, b) => a.w.x0 - b.w.x0);
      const drop = {};   // prva oznaka v polju je tiskana oznaka, ne rokopis
      sorted.forEach(({ w, v }) => {
        const x = cx(w), kind = labelOf(w), left = x < colL;
        const row = v < CARD_V.r2 ? 1 : v < CARD_V.r3 ? 2 : 3;
        if (x < odX + 0.2 * L){ if (row === 1 && !(isNumTok(w.t))) { /* kljukica ali pobrana ura v robu: ne gre v polja */ } cell.margin.push(w); return; }
        if (row === 1){
          if (x >= c.cas - 0.5 * L){ if (kind === 'cas' && !drop.cas){ drop.cas = 1; return; } const t = fixNum(w.t); if (/\d/.test(t) || /^(dop|pop)\.?$/i.test(w.t)) cell.time.push(w); return; }
          if (isNumTok(w.t) && x < odX + 3 * L) return;   // številka polja ali kljukica ob njej
          cell.name.push(w); return;
        }
        if (row === 2){
          if (left){ if (kind === 'od' && !drop.od && x < odX + 4 * L){ drop.od = 1; return; } cell.from.push(w); }
          else { if (kind === 'do' && !drop.do && x < c.col + 4 * L){ drop.do = 1; return; } cell.to.push(w); }
          return;
        }
        if (left){ if (kind === 'tel' && !drop.tel && x < odX + 4 * L){ drop.tel = 1; return; } cell.phone.push(w); }
        else { if ((kind === 'nacin' || kind === 'prevoza') && x < c.x1 + 0.5 * L) return; cell.mode.push(w); }
      });
      return cell;
    });
    /* datum: besede nad prvim okvirjem */
    try {
      const up = upper.slice().sort((a, b) => cy(a) - cy(b) || a.x0 - b.x0), txt = up.map(w => w.t).join(' '), dd = NSCAN.dates(NSCAN.fixDigits(txt)).find(x => x.y >= 2000 && x.y <= 2100);
      if (dd) out.date = { iso:dd.iso, conf:Math.round(med(up.map(w => w.c))) };
    } catch (e) { /* brez datuma */ }
    const res = [];
    cards.forEach((c, i) => {
      const cl = rows[i], co = k => cl[k].length ? cellOf(cl[k]) : { text:'', conf:0, min:0, n:0, ws:[] };
      const cc = { name:co('name'), from:co('from'), to:co('to'), time:co('time'), phone:co('phone'), note:co('mode'), pick:co('margin') };
      const nr = d0 + i, rd = numTok[i] && numVal(numTok[i].w.t) === nr;
      const geo = { xa:c.xa, y:c.y, s:c.s, P:c.P, col:c.col, odX, cas:c.cas, casEnd:c.casEnd, x0:Math.max(0, odX - 5 * L), x1:right, L, pre:c.x1, derived:!!c.derived };
      const row = { nr, derived:false, y0:c.y - 0.9 * c.P, y1:c.y + 0.14 * c.P, geo, layout:'card', ctext:cellOf(cl.margin.concat(cl.name, cl.from, cl.to, cl.phone, cl.mode, cl.time)).text };
      res.push({ row, cc, nrLvl:nrGuess ? (hasDatum || i > 0 ? 'ok' : 'chk') : 'ok', words:cw[i].length, hw:['name', 'from', 'to', 'phone', 'mode', 'time'].reduce((a, k) => a + cl[k].length, 0) });
    });
    out.tbl = { x0:Math.max(0, odX - 5 * L), x1:right, y0:cards[0].y - 0.9 * cards[0].P, y1:cards[n - 1].y + 0.14 * cards[n - 1].P };
    out.cols = [];
    return res;
  }

  /* ---------- Ocena celotne vrstice (skupno za tabelo in kartice) ---------- */
  const EMPTYC = { text:'', conf:0, min:0, n:0, ws:[] };
  const junkText = t => { const s = T_(t).replace(/\s+/g, ''); if (!s) return false; const l = (s.match(/\p{L}/gu) || []).length; return l < 3 || l / s.length < 0.6; };
  const ROW_KEYS = ['name', 'from', 'to', 'time', 'note', 'phone', 'mode'];
  function judgeRow(row, c, out, card){
    c.phone = c.phone || EMPTYC;
    /* v stolpcu ure je lahko še kaj (npr. »10.30 leže« pri redkem stolpcu opomb): ura ostane, ostalo gre v opombo */
    if (!card && c.time.n > 1){
      const ti = c.time.ws.findIndex(w => timeLike(w.t));
      if (ti >= 0){ const rest2 = c.time.ws.filter((_, i) => i !== ti); c.time = cellOf([c.time.ws[ti]]); c.note = cellOf([...(c.note.ws || []), ...rest2]); }
    }
    /* način prevoza (leže, utila, vzorci) kjerkoli v vrstici (pri karticah: samo v polju »Način prevoza«) */
    let mode = '';
    (card ? ['note'] : ['name', 'from', 'to', 'note']).forEach(k => { const m = modeIn(c[k].text); if (m.mode && !mode){ mode = m.mode; if (k === 'note' || k === 'to') c[k] = Object.assign({}, c[k], { text:m.rest }); } });
    row.mode = mode; row.dia = '';
    if (/dializ/i.test(c.to.text + ' ' + c.note.text)) row.dia = row.dia || 'pop';   // dializa: ure ni nujno, izbira dop/pop ostane dispečerju
    const tj = judgeTime(c.time, row); row.dia = tj.dia || '';
    if (/dializ/i.test(c.to.text + ' ' + c.note.text) && !tj.v && !tj.dia) { tj.lvl = 'ok'; tj.why = ['dializa: ura po urniku skupine']; }
    const nj = judgeName(c.name, row), fj = judgePlace(c.from, 'from', row), dj = judgePlace(c.to, 'to', row), pj = judgePhone(c.phone);
    let noteTxt = c.note.text;
    const notej = { v:noteTxt, lvl:'ok', why:[], sug:[] };
    if (card && noteTxt && junkText(noteTxt)){ noteTxt = ''; notej.v = ''; }
    if (noteTxt && (card || c.note.conf < 45)){ notej.lvl = 'chk'; notej.why.push(card ? 'opomba ob načinu prevoza: preveri s sliko' : `opomba slabo berljiva (${c.note.conf} %)`); }
    const mj = { v:mode, lvl:'ok', why:[], sug:[] };
    if (card && !mode){ mj.lvl = 'chk'; mj.why.push(c.note.text && !junkText(c.note.text) ? 'načina prevoza ne prepoznam (sede, leže, utila): preveri' : 'načina prevoza ni mogoče prebrati: privzeto sede, preveri'); }
    row.f = { name:nj.v, from:fj.v, to:dj.v, time:tj.v, mode, dia:tj.dia, note:noteTxt, pid:nj.pid, phone:pj.v };
    row.fl = { name:nj, from:fj, to:dj, time:tj, note:notej, phone:pj, mode:mj };
    row.raw = { name:c.name.text, from:c.from.text, to:c.to.text, time:c.time.text, note:c.note.text, phone:c.phone.text };
    row.conf = { name:c.name.conf, from:c.from.conf, to:c.to.conf, time:c.time.conf, note:c.note.conf, phone:c.phone.conf };
    let lvl = 'ok'; ROW_KEYS.forEach(k => { lvl = worst(lvl, row.fl[k].lvl); }); lvl = worst(lvl, row.nrLvl === 'bad' ? 'chk' : 'ok');
    row.lvl = lvl;
    /* razlog vrstice za pregled */
    row.todo = ROW_KEYS.filter(k => row.fl[k].lvl !== 'ok');
    return row;
  }

  /* ---------- Glavni razčlenjevalec ---------- */
  function parse(words, W, H, opt = {}){
    const ws = cleanWords(words);
    const out = { rows:[], date:null, header:false, cols:[], stats:{ ok:0, chk:0, bad:0, empty:0 }, notes:[], words:ws.length };
    if (ws.length < 4){ out.notes.push('Na sliki skoraj ni prebranega besedila.'); return out; }
    const mh = Math.max(6, med(ws.map(w => w.y1 - w.y0)));
    const box = { x0:Math.min(...ws.map(w => w.x0)), y0:Math.min(...ws.map(w => w.y0)), x1:Math.max(...ws.map(w => w.x1)), y1:Math.max(...ws.map(w => w.y1)) };
    out.layout = 'table'; out.cols = out.cols || [];
    const cardRes = parseCards(ws, mh, box, W, H, out);
    if (cardRes){
      cardRes.forEach(({ row, cc, nrLvl, words, hw }) => {
        Object.assign(row, { text:row.ctext, raw:{}, f:{}, fl:{}, lvl:'ok', empty:false, nrLvl, words, touched:{} });
        judgeRow(row, cc, out, true);
        if (!hw){ row.empty = true; out.stats.empty++; } else out.stats[row.lvl]++;
        out.rows.push(row);
      });
      return out;
    }
    const head = findHeader(ws, mh); out.header = !!head;
    let rows = findRows(ws, mh, head, box), numbered = rows.length >= 2;
    if (numbered) rows = fillRows(rows);
    else { rows = lineRows(ws, mh, head ? head.y1 : box.y0); out.notes.push('Številk polj (1–24) ni prepoznati: vrstice so ugotovljene po vrstah besedila, preveri številke.'); }
    if (!rows.length){ out.notes.push('Vrstic prevozov ni mogoče ugotoviti.'); return out; }
    /* meje vrstic */
    const pitch = rows.length > 1 ? med(rows.slice(1).map((r, i) => r.y - rows[i].y)) : mh * 2.5;
    /* meja vrstice: pri oštevilčenih poljih tik nad številko naslednjega polja (številka je v zgornjem delu polja, daljše besedilo se lahko prelomi v več vrstic);
       brez številk: sredina med vrsticami besedila */
    const topOf = r => r.w ? r.w.y0 - mh * 0.9 : r.y - mh * 1.4;
    rows.forEach((r, i) => {
      if (numbered){ r.y0 = topOf(r); r.y1 = i < rows.length - 1 ? topOf(rows[i + 1]) : r.y + pitch * 2.2; }
      else { r.y0 = i ? (rows[i - 1].y + r.y) / 2 : r.y - pitch * 0.55; r.y1 = i < rows.length - 1 ? (r.y + rows[i + 1].y) / 2 : r.y + pitch * 0.55; }
    });
    const top = head ? head.y1 : rows[0].y0;
    const body = ws.filter(w => w.y0 >= top - 1);
    rows.forEach(r => { r.ws = body.filter(w => cy(w) >= r.y0 && cy(w) < r.y1); });
    /* datum strani: besede nad prvo vrstico */
    try {
      const upper = ws.filter(w => cy(w) < (head ? head.y : rows[0].y0)).sort((a, b) => cy(a) - cy(b) || a.x0 - b.x0);
      const txt = upper.map(w => w.t).join(' '), d = NSCAN.dates(NSCAN.fixDigits(txt)).find(x => x.y >= 2000 && x.y <= 2100);
      if (d) out.date = { iso:d.iso, conf:Math.round(med(upper.map(w => w.c))) };
    } catch (e) { /* brez datuma */ }
    /* stolpci */
    const keyOrder = ['name', 'from', 'to', 'time', 'note'];
    let cols = null;
    const numX = med(rows.filter(r => r.w).map(r => r.w.x0));
    if (head){
      cols = head.cols.map(c => ({ key:c.key, x0:c.x0 }));
      if (!cols.some(c => c.key === 'nr')) cols.unshift({ key:'nr', x0:Math.min(numX || box.x0, box.x0) });
      const edges = startClusters(rows.map(r => r.ws), mh, rows.length);
      cols = repairCols(cols, edges, mh);
      /* glavo OCR pogosto razbere slabše kot vrstice: levi rob stolpca se prilagodi najbližjemu robu, kjer res začenjajo besede */
      cols.forEach(c => {
        if (c.key === 'nr') return;
        /* OCR glave pogosto izgubi prvo besedo večbesedne oznake (»IME IN PRIIMEK«): rob je zato običajno levo od zaznanega sidra */
        const near = edges.filter(e => e >= c.x0 - mh * 4.5 && e <= c.x0 + mh * 2 && cols.every(k => k === c || Math.abs(k.x0 - e) > mh * 1.8)).sort((a, b) => Math.abs(a - c.x0) - Math.abs(b - c.x0))[0];
        if (near != null) c.x0 = near;
      });
      cols.sort((a, b) => a.x0 - b.x0);
    } else {
      const edges = startClusters(rows.map(r => r.ws), mh, rows.length);
      if (edges.length >= 3 && edges.length <= 10){
        cols = edges.map((x0, i) => ({ key:'c' + i, x0 }));
        /* prvi stolpec so številke polj, če so prisotne */
        if (numbered && Math.abs(cols[0].x0 - numX) < mh * 2) cols[0].key = 'nr'; else if (numbered) cols.unshift({ key:'nr', x0:numX });
        else cols.unshift({ key:'nr', x0:Math.min(...cols.map(c => c.x0)) - mh * 3 });
        const rest = cols.filter(c => c.key !== 'nr');
        /* stolpec ure = stolpec z največ časovnimi zapisi */
        const share = c => { const i = cols.indexOf(c), nx = cols[i + 1] ? cols[i + 1].x0 : Infinity; let t = 0, n = 0; rows.forEach(r => { const cw = r.ws.filter(w => w.x0 >= c.x0 - mh * 0.6 && w.x0 < nx - mh * 0.6); if (cw.length){ n++; if (timeLike(cellOf(cw).text)) t++; } }); return n ? t / n : 0; };
        const tc = rest.map(c => ({ c, s:share(c) })).sort((a, b) => b.s - a.s)[0];
        const timeCol = tc && tc.s >= 0.4 ? tc.c : null;
        const before = timeCol ? rest.slice(0, rest.indexOf(timeCol)) : rest.slice(0, 3), after = timeCol ? rest.slice(rest.indexOf(timeCol) + 1) : rest.slice(3);
        before.forEach((c, i) => { c.key = before.length >= 3 ? ['name', 'from', 'to'][Math.min(i, 2)] : before.length === 2 ? ['name', 'to'][i] : 'name'; if (before.length >= 3 && i > 2) c.key = 'note'; });
        if (timeCol) timeCol.key = 'time';
        after.forEach(c => { c.key = 'note'; });
        if (before.length === 2){ /* OD ali DO? po vsebini */
          const c = before[1], i = cols.indexOf(c), nx = cols[i + 1] ? cols[i + 1].x0 : Infinity; let poi = 0, n = 0;
          rows.forEach(r => { const cw = r.ws.filter(w => w.x0 >= c.x0 - mh * 0.6 && w.x0 < nx - mh * 0.6); if (cw.length){ n++; try { if (geo(cellOf(cw).text).kind === 'poi') poi++; } catch (e) { /* */ } } });
          c.key = n && poi / n >= 0.5 ? 'to' : 'from';
        }
      } else out.notes.push('Stolpcev tabele ni mogoče zanesljivo ugotoviti: besedilo vrstice je razdeljeno po presledkih, preveri vsako polje.');
    }
    out.cols = cols ? cols.map(c => ({ key:c.key, x0:Math.round(c.x0) })) : [];
    const tol = mh * 1.1;
    const colOf = w => { let k = 0; for (let i = 0; i < cols.length; i++) if (cols[i].x0 <= w.x0 + tol) k = i; return k; };
    rows.forEach(r => {
      const cells = {}; let rest = [];
      if (cols){ r.ws.forEach(w => { const c = cols[colOf(w)]; (cells[c.key] = cells[c.key] || []).push(w); }); }
      else rest = r.ws;
      const row = { nr:r.nr, derived:r.derived, y0:r.y0, y1:r.y1, text:cellOf(r.ws).text, raw:{}, f:{ name:'', from:'', to:'', time:'', mode:'', dia:'', note:'', pid:'', phone:'' }, fl:{}, lvl:'ok', empty:false };
      /* številka polja */
      const nrCells = cells.nr ? cellOf(cells.nr) : { text:'', conf:0 };
      if (r.nr == null){ const v = numVal(nrCells.text); row.nr = v && v < 61 ? v : null; }
      const content = Object.keys(cells).filter(k => k !== 'nr' && cells[k].length);
      if (!content.length && cols){ row.empty = true; out.stats.empty++; out.rows.push(row); return; }
      const c = {}; ['name', 'from', 'to', 'time', 'note', 'pick', 'veh'].forEach(k => { c[k] = cells[k] ? cellOf(cells[k]) : { text:'', conf:0, min:0, n:0, ws:[] }; });
      Object.keys(cells).forEach(k => { if (/^c\d+$/.test(k)) c.note = cellOf([...(cells.note || []), ...cells[k]]); });
      if (!cols){ c.name = cellOf(rest); }
      row.nrLvl = r.derived ? 'chk' : (nrCells.conf && nrCells.conf < 50 ? 'chk' : 'ok');
      if (row.nr == null) row.nrLvl = 'bad';
      judgeRow(row, c, out, false); out.stats[row.lvl]++; out.rows.push(row);
    });
    /* podvojene številke */
    const cnt = {}; out.rows.forEach(r => { if (r.nr != null && !r.empty) cnt[r.nr] = (cnt[r.nr] || 0) + 1; });
    out.rows.forEach(r => { if (r.nr != null && cnt[r.nr] > 1){ r.dupNr = true; if (r.lvl === 'ok'){ r.lvl = 'chk'; out.stats.ok--; out.stats.chk++; } } });
    out.tbl = { x0:box.x0, x1:box.x1, y0:top, y1:box.y1 };
    return out;
  }

  /* ---------- TSV (Tesseract) → besede ---------- */
  function tsvWords(tsv){
    const out = [];
    String(tsv || '').split(/\r?\n/).forEach(l => { const c = l.split('\t'); if (c.length < 12 || c[0] !== '5') return; const x = +c[6], y = +c[7], w = +c[8], h = +c[9]; out.push({ text:c.slice(11).join('\t'), confidence:+c[10], bbox:{ x0:x, y0:y, x1:x + w, y1:y + h } }); });
    return out;
  }
  const fromOcr = r => (r && r.words && r.words.length) ? r.words : tsvWords(r && r.tsv);

  /* ---------- Priprava fotografije (samo v brskalniku): zasuk, kontrast, izrezi ---------- */
  const MAX_SIDE = 2200, MAX_PAGES = 6, INK_BLANK = 0.03, INK_MAYBE = 0.10, BLANK_WORDS = 9;   /* 2200 px zadošča za tiskano mrežo in rokopis; večja slika razpoznavo samo upočasni */
  const tick = () => new Promise(r => setTimeout(r, 0));   /* umik zaslonu: telefon med težko obdelavo ne sme zamrzniti prikaza */
  const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  /* naklon vrstic v stopinjah (+ = vrstice se spuščajo proti desni): največja ostrina projekcije temnih točk na navpično os */
  function skewAngle(cv){
    const k = Math.min(1, 700 / Math.max(cv.width, cv.height)), c = cv2(cv.width * k, cv.height * k), w = c.width, h = c.height;
    const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(cv, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h); let sum = 0;
    for (let i = 0; i < w * h; i++){ g[i] = (d[i * 4] * 30 + d[i * 4 + 1] * 59 + d[i * 4 + 2] * 11) / 100 | 0; sum += g[i]; }
    const thr = sum / (w * h) * 0.82, pts = [];
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (g[yy * w + xx] < thr) pts.push(xx, yy);
    if (pts.length < 300) return 0;
    const score = a => {
      const r = a * Math.PI / 180, s = Math.sin(r), co = Math.cos(r), off = Math.ceil(Math.abs(s) * w) + 2, bins = new Float32Array(h + off * 2 + 4);
      for (let i = 0; i < pts.length; i += 2) bins[Math.round(pts[i + 1] * co - pts[i] * s + off)]++;
      let sc = 0; for (let j = 1; j < bins.length; j++){ const df = bins[j] - bins[j - 1]; sc += df * df; } return sc;
    };
    let best = 0, bs = -1;
    for (let a = -10; a <= 10.001; a += 0.5){ const sc = score(a); if (sc > bs){ bs = sc; best = a; } }
    const c0 = best; for (let a = c0 - 0.5; a <= c0 + 0.501; a += 0.1){ const sc = score(a); if (sc > bs){ bs = sc; best = a; } }
    return Math.round(best * 10) / 10;
  }
  function rotated(cv, deg){
    if (Math.abs(deg) < 0.3) return cv;
    const r = -deg * Math.PI / 180, s = Math.abs(Math.sin(r)), co = Math.abs(Math.cos(r)), w = cv.width * co + cv.height * s, h = cv.width * s + cv.height * co, c = cv2(w, h), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.translate(c.width / 2, c.height / 2); x.rotate(r); x.drawImage(cv, -cv.width / 2, -cv.height / 2);
    return c;
  }
  /* krajevni prag (svetloba po strani ni enakomerna: senca ob hrbtu knjige) → črno-bela slika za OCR */
  function binarize(cv){
    const w = cv.width, h = cv.height, x = cv.getContext('2d', { willReadFrequently:true }), im = x.getImageData(0, 0, w, h), d = im.data, n = w * h, g = new Uint8Array(n);
    for (let i = 0; i < n; i++) g[i] = (d[i * 4] * 30 + d[i * 4 + 1] * 59 + d[i * 4 + 2] * 11) / 100 | 0;
    const W1 = w + 1, I = new Uint32Array(W1 * (h + 1));
    for (let yy = 0; yy < h; yy++){ let row = 0; for (let xx = 0; xx < w; xx++){ row += g[yy * w + xx]; I[(yy + 1) * W1 + xx + 1] = I[yy * W1 + xx + 1] + row; } }
    const r = Math.max(8, Math.round(Math.min(w, h) / 45));
    for (let yy = 0; yy < h; yy++){
      const y0 = Math.max(0, yy - r), y1 = Math.min(h, yy + r + 1);
      for (let xx = 0; xx < w; xx++){
        const x0 = Math.max(0, xx - r), x1 = Math.min(w, xx + r + 1), cnt = (x1 - x0) * (y1 - y0);
        const m = (I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0]) / cnt, v = g[yy * w + xx] < m * 0.9 && g[yy * w + xx] < 215 ? 0 : 255;
        const o = (yy * w + xx) * 4; d[o] = d[o + 1] = d[o + 2] = v;
      }
    }
    /* črte tabele (dolge vodoravne in navpične črne proge) zbrišemo: motijo členitev strani pri razpoznavi */
    const bl = new Uint8Array(n); for (let i = 0; i < n; i++) bl[i] = d[i * 4] === 0 ? 1 : 0;
    const Lh = Math.max(40, Math.round(w * 0.035)), Lv = Math.max(40, Math.round(h * 0.02)), kill = new Uint8Array(n);
    for (let yy = 0; yy < h; yy++){ let st = -1; for (let xx = 0; xx <= w; xx++){ const on = xx < w && bl[yy * w + xx]; if (on && st < 0) st = xx; else if (!on && st >= 0){ if (xx - st >= Lh) for (let k = st; k < xx; k++) kill[yy * w + k] = 1; st = -1; } } }
    for (let xx = 0; xx < w; xx++){ let st = -1; for (let yy = 0; yy <= h; yy++){ const on = yy < h && bl[yy * w + xx]; if (on && st < 0) st = yy; else if (!on && st >= 0){ if (yy - st >= Lv) for (let k = st; k < yy; k++) kill[k * w + xx] = 1; st = -1; } } }
    for (let i = 0; i < n; i++) if (kill[i]){ const o = i * 4; d[o] = d[o + 1] = d[o + 2] = 255; }
    const c = cv2(w, h); c.getContext('2d').putImageData(im, 0, 0); return c;
  }
  /* datoteka → platna strani (PDF: vse strani s sliko, največ 6) */
  async function loadPages(file){
    const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '');
    if (!isPdf) return [await NSCAN.toCanvas({ kind:'blob', blob:file }, MAX_SIDE)];
    const imgs = await NSCAN.pdfImages(await file.arrayBuffer());
    if (!imgs.length) throw new Error('V tem PDF ni slike strani. Naredi fotografijo strani knjige ali izvozi stran kot sliko.');
    const out = []; for (const im of imgs.slice(0, MAX_PAGES)) out.push(await NSCAN.toCanvas(im, MAX_SIDE)); return out;
  }
  async function preparePage(cv){
    await tick(); const angle = skewAngle(cv);
    await tick(); const color = rotated(cv, angle);
    await tick(); const bw = binarize(color);
    await tick(); return { color, angle, bw, png:await NSCAN.toBlob(bw) };
  }
  /* izrez vrstice iz fotografije (za primerjavo prebranega z originalom) */
  function cropRow(color, row, tbl, pitch){
    const padY = Math.max(4, pitch * 0.12), x0 = Math.max(0, tbl.x0 - 12), x1 = Math.min(color.width, tbl.x1 + 12), y0 = Math.max(0, row.y0 - padY), y1 = Math.min(color.height, row.y1 + padY);
    const w = x1 - x0, h = y1 - y0; if (w < 10 || h < 6) return '';
    const k = Math.min(1, 1000 / w), c = cv2(w * k, h * k); c.getContext('2d').drawImage(color, x0, y0, w, h, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
  }
  /* izrez prevoza (kartice): zasukan po lokalnem naklonu okvirja, da so vrstice vodoravne */
  function cropCard(color, g){
    const top = -1.0, bot = 0.3, w = g.x1 - g.x0, h = (bot - top) * g.P;
    if (!(w > 20 && h > 10)) return '';
    const k = Math.min(1, 1000 / w), th = Math.atan(g.s), co = Math.cos(th), si = Math.sin(th);
    const ox = g.x0 - si * top * g.P, oy = g.y + g.s * (g.x0 - g.xa) + co * top * g.P;
    const c = cv2(w * k, h * k), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.setTransform(k * co, -k * si, k * si, k * co, -k * (co * ox + si * oy), k * (si * ox - co * oy));
    x.drawImage(color, 0, 0);
    try { return c.toDataURL('image/jpeg', 0.75); } catch (e) { return ''; }
  }
  /* gostota črnila (črne točke) v poljih za rokopis: prazna kartica ima skoraj nič; ločuje prazen okvir od nerazločnega rokopisa */
  function inkOf(bw, g){
    const w = bw.width, h = bw.height; if (!bw._d) bw._d = bw.getContext('2d', { willReadFrequently:true }).getImageData(0, 0, w, h).data;
    const d = bw._d, L = g.L;
    const Z = [[g.odX + 0.5 * L, g.cas - 0.5 * L, -0.84, -0.5], [g.odX + 2.6 * L, g.col - 0.4 * L, -0.44, -0.19], [g.col + 2.8 * L, g.x1 - 0.5 * L, -0.44, -0.19], [g.odX + 2.8 * L, g.col - 0.4 * L, -0.135, 0.1], [g.pre + 0.6 * L, g.x1 - 0.5 * L, -0.135, 0.1]];
    let best = 0;
    Z.forEach(([u0, u1, v0, v1]) => {
      let dark = 0, tot = 0;
      for (let u = u0; u < u1; u += 2){ const base = g.y + g.s * (u - g.xa), xi = Math.round(u); if (xi < 0 || xi >= w) continue;
        for (let v = v0; v < v1; v += 2 / g.P){ const yi = Math.round(base + v * g.P); if (yi < 0 || yi >= h) continue; tot++; if (d[(yi * w + xi) * 4] < 128) dark++; } }
      if (tot > 50) best = Math.max(best, dark / tot);
    });
    return best;
  }
  /* kartica brez rokopisa je prazna; nejasna kartica se nikoli ne preskoči tiho: prazne se v pregledu pokažejo na koncu (z izrezom) in jih je mogoče vnesti */
  function markCard(row, prep){
    row.ink = inkOf(prep.bw, row.geo);
    const blank = row.ink < INK_BLANK || ((row.words || 0) <= BLANK_WORDS && row.ink < INK_MAYBE);
    if (!blank && row.empty){ row.empty = false; row.fl.name = Object.assign({}, row.fl.name, { lvl:'bad', why:['rokopis je na sliki, a ga ne razberem: vpiši s slike'] }); row.lvl = worst(row.lvl, 'bad'); row.todo = ROW_KEYS.filter(k => row.fl[k].lvl !== 'ok'); }
    if (blank){ row.empty = true; row.blank = true; }
    row.crop = cropCard(prep.color, row.geo);
  }
  /* pomanjšana fotografija strani (JPEG): ostane na voljo tudi, če razpoznava odpove, da lahko prevoze vneseš ročno ob sliki */
  function photoUrl(cv){
    const k = Math.min(1, 1400 / Math.max(cv.width, cv.height)), c = cv2(cv.width * k, cv.height * k); c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.7); } catch (e) { return ''; }
  }
  const hooks = { onPhoto:null };
  const canceledErr = () => { const e = new Error('Razpoznava je bila prekinjena.'); e.canceled = true; return e; };
  /* vnaprejšnji zagon razpoznave (prenos jedra in modela) med tem, ko uporabnik izbira fotografijo */
  const warm = onProgress => NSCAN.ocrEnabled() ? NSCAN.ocrSession().warm(onProgress) : Promise.resolve();
  const cancel = ctl => { if (ctl) ctl.cancelled = true; NSCAN.ocrAbort(); };
  /* cel postopek za eno ali več slik/PDF: vrne vrstice vseh strani (slika se ne shrani nikamor). ctl = { cancelled } omogoča prekinitev. */
  async function run(files, onProgress, ctl){
    const cfg = NSCAN.ocrCfg(), pages = [], ctlr = ctl || {}; let n = 0;
    const say = (stage, i, np, pct) => { if (onProgress) onProgress({ stage, page:i + 1, pages:np, pct:pct || 0, label:(np > 1 ? `Stran ${i + 1}/${np}: ` : '') + NSCAN.stageLabel(stage) }); };
    const chk = () => { if (ctlr.cancelled) throw canceledErr(); };
    if (onProgress) onProgress({ stage:'prep', page:1, pages:1, pct:0, label:'berem fotografijo' });
    for (const f of files){ await tick(); for (const cv of await loadPages(f)){ if (n++ >= MAX_PAGES) break; pages.push(cv); } }
    chk();
    const res = { pages:[], rows:[], date:null, notes:[], words:0, photos:[] };
    pages.forEach((cv, i) => { const u = photoUrl(cv); res.photos.push(u); if (hooks.onPhoto) hooks.onPhoto(i, u, pages.length); });
    for (let i = 0; i < pages.length; i++){
      const tag = pages.length > 1 ? `Stran ${i + 1}/${pages.length}: ` : '';
      chk(); say('prep', i, pages.length, 0);
      const prep = await preparePage(pages[i]); chk();
      const ocrPsm = async psm => { try { return await NSCAN.ocr(prep.png, p => { say(p.stage, i, pages.length, p.pct); }, cfg, { words:true, psm }); } catch (e) { if (ctlr.cancelled) throw canceledErr(); throw e; } };
      /* redko besedilo (psm 11) najde kartice tudi na ukrivljeni in nagnjeni strani; če stran ni v obliki kartic (tabela), se prebere še enkrat s členitvijo po stolpcih (psm 4). config.js → ocr.bookPsm vse to preglasi. */
      let r = await ocrPsm(cfg.bookPsm || '11'); chk();
      let words = fromOcr(r), ps = parse(words, prep.color.width, prep.color.height);
      if (!cfg.bookPsm && ps.layout !== 'card'){ r = await ocrPsm('4'); chk(); words = fromOcr(r); ps = parse(words, prep.color.width, prep.color.height); }
      say('prep', i, pages.length, 1); await tick();
      const pitch = ps.rows.length > 1 ? med(ps.rows.slice(1).map((x, j) => (x.y0 + x.y1) / 2 - (ps.rows[j].y0 + ps.rows[j].y1) / 2)) : 60;
      ps.rows.forEach(row => {
        row.page = i + 1;
        if (row.geo) markCard(row, prep);
        else if (!row.empty) row.crop = cropRow(prep.color, row, ps.tbl, Math.abs(pitch));
      });
      res.pages.push({ w:prep.color.width, h:prep.color.height, angle:prep.angle, header:ps.header, layout:ps.layout, cards:ps.cards || 0, notes:ps.notes, words:ps.words });
      ps.notes.forEach(t => res.notes.push(tag + t)); res.words += ps.words;
      if (!res.date && ps.date) res.date = ps.date;
      ps.rows.forEach(row => res.rows.push(row));
    }
    res.rows.forEach((r, i) => { r.key = 'b' + i; });
    res.rows.sort((a, b) => (a.nr ?? 999) - (b.nr ?? 999) || a.page - b.page || a.y0 - b.y0);
    const seen = {}; res.rows.forEach(r => { if (!r.empty && r.nr != null){ (seen[r.nr] = seen[r.nr] || []).push(r); } });
    Object.values(seen).forEach(a => { if (a.length > 1) a.forEach(r => { r.dupNr = true; if (r.lvl === 'ok') r.lvl = 'chk'; }); });
    res.stats = { ok:0, chk:0, bad:0, empty:0 }; res.rows.forEach(r => { res.stats[r.empty ? 'empty' : r.lvl]++; });
    return res;
  }

  /* ---------- Iz vrstice v prevoz ---------- */
  const FIELD_LABEL = { name:'ime', from:'od', to:'do', time:'ura', note:'opomba', phone:'tel', mode:'način' };
  const chkText = row => (row.todo || []).map(k => FIELD_LABEL[k]).join(', ');

  return { parse, cleanWords, cellOf, ed, sim, simNS, simName, ocrNorm, parseTime, placeSuggest, patientSuggest, vocab, chkText, FIELD_LABEL, LV, headKey, tsvWords, fromOcr, skewAngle, rotated, binarize, loadPages, preparePage, cropRow, cropCard, inkOf, markCard, run, warm, cancel, hooks, photoUrl, MAX_SIDE };
})();
