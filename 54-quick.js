/* ============================================================================
   HITRI VNOS IN PONAVLJANJE: dispečerjev žargon v prevoz, kopiranje prevozov z drugega dne, ponovitev prevoza za naslednje dni
   Dispečer na papirju piše kratko (»Novak, Dobova 25, OI LJ, 8:00«). Hitri vnos razbere ime, naslov OD, cilj DO, uro in način;
   ustanove prepozna po imenih in kraticah (O.I. LJ, SBB, UKC LJ, ZD KK …), pacienta po bazi pacientov (»Doma« → naslov pacienta).
   ============================================================================ */
const QUICK_MODES = { sede:'sede', leze:'leze', 'leže':'leze', lezece:'leze', 'ležeče':'leze', utila:'utila', utilo:'utila', vzorci:'vzorci', vzorec:'vzorci', vzorce:'vzorci' };
/* V knjigi je pri dializi namesto ure napisano »Dop« ali »Pop«: termin dialize; uro določi Nastavitve → Dializa */
const QUICK_DIA = { dop:'dop', dopoldne:'dop', dopoldanska:'dop', pop:'pop', popoldne:'pop', popoldanska:'pop' };
const NOTE_CHIPS =['brez spremljevalca', 's spremljevalcem', 'invalidski voziček', 'kisik', 'počaka na pregled', 'vrne se sam', 'vzame izvide'];
const QUICK_NOTE_RE = /^(brez|z|s)\s+spremljevalc|voziček|vozicek|kisik|izvid|\bsam\b|opomba|^javijo|^prej\s+poklic|^poklic|^dodatna\s+dializ|^sprejem|^ne\s+prej|^mrsa|^pride\s+pred|^po\s+\d{1,2}\s?h?$/i;
const qNorm = s => norm(String(s || '')).replace(/\./g, '');

function quickTime(part){
  const m = /^(?:ob\s*)?(\d{1,2})(?:\s*[:.h]\s*(\d{2}))?\s*(?:h|uri)?$/i.exec(String(part).trim());
  if (!m) return null;
  const hh = +m[1], mm = m[2] == null ? 0 : +m[2];
  if (hh > 23 || mm > 59) return null;
  const explicit = /[:.h]|^ob\s/i.test(String(part).trim());
  return { t:String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), explicit };
}
function quickPatient(name){
  const q = norm(name); if (!q || q.length < 3) return null;
  let hit = S.patients.filter(p => norm(p.name) === q);
  if (hit.length === 1) return hit[0];
  const toks = q.split(/\s+/);
  hit = S.patients.filter(p => { const n = norm(p.name); return toks.every(t => n.includes(t)); });
  return hit.length === 1 ? hit[0] : null;
}
const isPoiText = s => { const g = geo(s); return g.kind === 'poi'; };

/* Razčleni vrstico: deli ločeni z vejico, podpičjem, | ali puščico; brez ločil se ime, naslov, cilj, ura in način poiščejo po besedah. */
function parseQuick(text){
  const out = { name:'', from:'', to:'', time:'', mode:'', dia:'', note:'', pid:'', ok:false };
  let s = String(text || '').replace(/\s+/g, ' ').trim(); if (!s) return out;
  s = s.replace(/\s*(→|->|>)\s*/g, ';');
  const sepText = s;
  let parts = s.split(/;|\|/.test(sepText) ? /\s*[;|]\s*/ : /\s*,\s*/).filter(Boolean);
  const notes = [];
  let timeLoose = null;
  if (parts.length === 1){
    /* brez ločil: odstrani uro in način, cilj je najdaljši končni del, ki je ustanova, ime so prve besede pred naslovom */
    let toks = s.split(' '), keep = [];
    for (let i = 0; i < toks.length; i++){
      const tk = toks[i], nx = toks[i + 1];
      if (/^ob$/i.test(tk) && nx && quickTime(nx)){ out.time = quickTime(nx).t; i++; continue; }
      const qt = quickTime(tk); if (qt && qt.explicit && !out.time){ out.time = qt.t; continue; }
      if (QUICK_MODES[qNorm(tk)] && !out.mode){ out.mode = QUICK_MODES[qNorm(tk)]; continue; }
      if (QUICK_DIA[qNorm(tk)] && !out.dia){ out.dia = QUICK_DIA[qNorm(tk)]; continue; }
      keep.push(tk);
    }
    if (out.mode === 'vzorci'){   // »Vzemi vzorce za IMI«: ni pacienta, cel preostanek je cilj
      keep = keep.filter(x => !/^(vzemi|vzami|odnesi|odvoz|za|v|na|do)$/i.test(x));
      if (keep.length && isPoiText(keep.join(' '))){ out.to = keep.join(' '); keep = []; }
    }
    let cut = -1;
    for (let i = 1; i < keep.length; i++){ if (isPoiText(keep.slice(i).join(' '))){ cut = i; break; } }
    const head = cut < 0 ? keep : keep.slice(0, cut);
    if (cut >= 0) out.to = keep.slice(cut).join(' ');
    let d = head.findIndex(x => /\d/.test(x));
    let nameN = d <= 0 ? Math.min(2, head.length) : Math.max(1, d - 1);
    if (head.length <= 1) nameN = head.length;
    out.name = head.slice(0, nameN).join(' '); out.from = head.slice(nameN).join(' ');
    if (cut < 0 && out.from && isPoiText(out.from)){ out.to = out.from; out.from = ''; }
  } else {
    const rest = [];
    for (let raw of parts){
      const tm = /^(.*\S)\s+(?:ob\s+)?(\d{1,2}(?:[:.]\d{2})?\s*h?)$/i.exec(raw);
      if (tm && !out.time && isPoiText(tm[1]) && quickTime(tm[2])){ out.time = quickTime(tm[2]).t; raw = tm[1]; }
      const n = qNorm(raw);
      if (QUICK_MODES[n]){ if (!out.mode) out.mode = QUICK_MODES[n]; continue; }
      if (QUICK_DIA[n]){ if (!out.dia) out.dia = QUICK_DIA[n]; continue; }
      const qt = quickTime(raw);
      if (qt && qt.explicit && !out.time){ out.time = qt.t; continue; }
      if (qt && !qt.explicit && !timeLoose){ timeLoose = qt.t; continue; }
      if (QUICK_NOTE_RE.test(raw) && !isPoiText(raw)){ notes.push(raw.replace(/^opomba:?\s*/i, '')); continue; }
      rest.push(raw);
    }
    if (!out.time && timeLoose) out.time = timeLoose;
    let name = '';
    if (rest.length && quickPatient(rest[0])) name = rest.shift();
    else if (rest.length && !isPoiText(rest[0]) && qNorm(rest[0]) !== 'doma' && (!/\d/.test(rest[0]) || (rest.length >= 3 && geo(rest[0]).kind === 'neznano'))) name = rest.shift();
    out.name = name;
    const items = rest.map(x => { const iz = /^iz\s+/i.test(x); return { t:x.replace(/^(iz|v|na|do)\s+/i, ''), poi:isPoiText(x.replace(/^(iz|v|na|do)\s+/i, '')), iz }; });
    const pois = items.filter(i => i.poi), oth = items.filter(i => !i.poi);
    if (pois.length >= 2){ out.from = pois[0].t; out.to = pois[1].t; oth.slice(0).forEach(o => notes.push(o.t)); }
    else if (pois.length === 1){
      const pi = items.indexOf(pois[0]), firstOther = oth.length ? items.indexOf(oth[0]) : -1;
      if (firstOther >= 0 && pi < firstOther || pois[0].iz){ out.from = pois[0].t; out.to = oth.length ? oth[0].t : ''; }
      else { out.to = pois[0].t; out.from = oth.length ? oth[0].t : ''; }
      oth.slice(1).forEach(o => notes.push(o.t));
    } else { out.from = oth[0] ? oth[0].t : ''; out.to = oth[1] ? oth[1].t : ''; oth.slice(2).forEach(o => notes.push(o.t)); }
  }
  const p = quickPatient(out.name);
  if (p){
    out.pid = p.id; out.name = p.name;
    if (!out.mode) out.mode = p.mode || '';
  }
  if (qNorm(out.from) === 'doma' && p) out.from = p.addr || out.from;
  if (qNorm(out.to) === 'doma' && p) out.to = p.addr || out.to;
  out.note = notes.join('; ');
  out.ok = !!(out.name || out.from || out.to);
  return out;
}
const QUICK_HELP = 'Piši po dispečersko: ustanove in kratice (OI LJ, SBB, UKC LJ, ZD KK), »Doma« vzame naslov pacienta iz baze. Ura: 8:00 ali ob 8.30. Način: leže, utila, vzorci.';
const MODE_LABEL = k => MODES[k] || k;
function quickPreview(p){
  if (!p || !p.ok) return '';
  const bits = [p.name ? `<b>${esc(p.name)}</b>${p.pid ? ' <span class="chip ok">v bazi</span>' : ''}` : '<span class="chip warn">brez imena</span>'];
  bits.push(`Od: ${p.from ? esc(p.from) : '<span class="dim">–</span>'}`); bits.push(`Do: ${p.to ? esc(p.to) : '<span class="dim">–</span>'}`);
  bits.push(p.time ? `ura <b class="mono">${esc(p.time)}</b>` : '<span class="dim">brez ure</span>');
  bits.push(esc(MODE_LABEL(p.mode || 'sede')));
  if (p.dia) bits.push('dializa ' + (p.dia === 'pop' ? 'popoldne' : 'dopoldne'));
  if (p.note) bits.push('opomba: ' + esc(p.note));
  return bits.join(' · ');
}
/* Vpiše prevoz v prvo prosto polje dneva. Vrne vpisani prevoz. */
function addQuickRide(date, p){
  if (!p || !p.ok) return null;
  const a = ensureDay(date); let r = a.find(x => !isFilled(x));
  if (!r){ addSlots(date, 5); r = ensureDay(date).find(x => !isFilled(x)); }
  Object.assign(r, blankRide(), { id:r.id, name:p.name, from:p.from, to:p.to, time:p.time, mode:p.mode || 'sede', dia:p.dia || '', note:p.note });
  if (p.pid){ applyPatientToRide(date, r.id, p.pid, { keepMode:!!p.mode }); r.from = p.from || r.from; r.to = p.to || r.to; r.note = p.note; }
  if (p.mode === 'vzorci' && !r.name) r.name = 'Vzorci';
  save(); if (typeof afterAddressChange === 'function') afterAddressChange(date, r, 'to'); else KM.schedule(date, r.id);
  if (r.from && typeof learnAddress === 'function') learnAddress(r.from);
  return r;
}

/* ---------- Kopiranje in ponavljanje ---------- */
const COPY_FIELDS = ['name', 'time', 'from', 'to', 'phone', 'mode', 'patientId', 'nalogId', 'note', 'stay', 'stayAuto', 'stayTouched', 'km', 'kmBack', 'kmSrc', 'kk', 'gf', 'gt', 'kmAt'];
function cloneRideTo(r, date){
  const a = ensureDay(date);
  const dup = a.some(x => isFilled(x) && !x.odpovedano && norm(x.name) === norm(r.name) && (x.time || '') === (r.time || '') && norm(x.to) === norm(r.to) && norm(x.from) === norm(r.from));
  if (dup) return null;
  let t = a.find(x => !isFilled(x));
  if (!t){ addSlots(date, 5); t = ensureDay(date).find(x => !isFilled(x)); }
  Object.assign(t, blankRide(), { id:t.id });
  for (const k of COPY_FIELDS) if (r[k] !== undefined) t[k] = (r[k] && typeof r[k] === 'object') ? JSON.parse(JSON.stringify(r[k])) : r[k];
  if (r.patientId){ const p = patientById(r.patientId); const nl = p ? activeNalog(p, date) : null; t.nalogId = nl ? nl.id : ''; }
  return t;
}
function prevDayWithRides(date){
  for (let i = 1; i <= 21; i++){ const d = addDays(date, -i); if (filledRides(d).length) return d; }
  return addDays(date, -1);
}
function copyRides(src, dst, ids){
  let n = 0, skipped = 0;
  for (const { r } of filledRides(src)){ if (ids && !ids.includes(r.id)) continue; if (r.odpovedano) continue; if (cloneRideTo(r, dst)) n++; else skipped++; }
  if (n) save();
  return { n, skipped };
}
/* Ponovi prevoz za naslednje delovne dni: how = 'next' (naslednji delovni dan), 'week' (do petka), 'five' (naslednjih 5 delovnih dni) */
function repeatDates(date, how){
  const out = []; let d = date;
  const want = how === 'five' ? 5 : how === 'next' ? 1 : 99;
  for (let i = 0; i < 28 && out.length < want; i++){
    d = addDays(date, i + 1);
    if (how === 'week' && dow(d) === 1) break;                      // teden se konča z nedeljo
    if (isStandby(d)) continue;
    out.push(d);
    if (how === 'week' && dow(d) === 5) break;
  }
  return out;
}
function repeatRide(date, rideId, how){
  const hit = rideById(date, rideId); if (!hit) return { n:0, dates:[] };
  const dates = repeatDates(date, how), done = [];
  for (const d of dates){ const t = cloneRideTo(hit.r, d); if (t){ done.push(d); KM.schedule(d, t.id); } }
  if (done.length) save();
  return { n:done.length, dates:done, tried:dates.length };
}
