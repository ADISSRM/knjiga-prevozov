/* =====================================================================
   JEDRO: pomočniki, datumi, shramba, uporabniki, geokodiranje, predlogi naslovov
   ===================================================================== */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g,'d').toLowerCase().trim();
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, '0');

/* ---------- Datumi ---------- */
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate()+n); return ymd(d); };
const todayStr = () => ymd(new Date());
const dow = s => parseYmd(s).getDay();
const dowName = s => DOW_LONG[dow(s)];
const fmtLong = s => { const d = parseYmd(s); return `${DOW_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = s => { const d = parseYmd(s); return `${DOW_SHORT[d.getDay()]} ${d.getDate()}. ${d.getMonth()+1}.`; };
const daysInMonth = (y, m) => new Date(y, m+1, 0).getDate();

function easter(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
        h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
        mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y, mo-1, da);
}
const HOLI_FIXED = {'01-01':'novo leto','01-02':'novo leto','02-08':'Prešernov dan','04-27':'dan upora proti okupatorju','05-01':'praznik dela','05-02':'praznik dela','06-25':'dan državnosti','08-15':'Marijino vnebovzetje','10-31':'dan reformacije','11-01':'dan spomina na mrtve','12-25':'božič','12-26':'dan samostojnosti in enotnosti'};
function holiday(s){
  const d = parseYmd(s), key = `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  if (HOLI_FIXED[key]) return HOLI_FIXED[key];
  const e = easter(d.getFullYear()); const em = new Date(e); em.setDate(e.getDate()+1);
  if (ymd(em) === s) return 'velikonočni ponedeljek';
  return '';
}
/* Vikend in prazniki: pripravljenost (2 zaposlena) */
const isStandby = s => { const w = dow(s); return w === 0 || w === 6 || !!holiday(s); };
/* Dializa: termini (dopoldanska / popoldanska), v katerih ta dan vozi vsaj en pacient iz registra dialize */
const diaTermsFor = s => Object.keys(DIA_TERMS).filter(t => S.patients.some(p => p.dt && p.dt.t === t && (p.dt.d || []).includes(dow(s))));

/* ---------- Čas ---------- */
const toMin = t => { if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null; const [h,m] = t.split(':').map(Number); return h*60+m; };
const fmtT = m => { if (m == null || !isFinite(m)) return '–'; m = Math.round(m); const neg = m < 0; m = Math.abs(m) % 1440; return (neg?'-':'') + pad(Math.floor(m/60)) + ':' + pad(m%60); };
const fmtDur = m => { m = Math.round(m); return m >= 60 ? `${Math.floor(m/60)} h ${pad(m%60)} min` : `${m} min`; };

/* ---------- Shramba (try/catch: brskalnik lahko shranjevanje blokira) ---------- */
const memStore = {};
const store = {
  get(k){ try { const v = localStorage.getItem(k); return v === null ? (memStore[k] ?? null) : v; } catch(e){ return memStore[k] ?? null; } },
  set(k, v){ memStore[k] = v; try { localStorage.setItem(k, v); } catch(e){} },
  del(k){ delete memStore[k]; try { localStorage.removeItem(k); } catch(e){} }
};
const sess = {
  get(k){ try { return sessionStorage.getItem(k); } catch(e){ return memStore['s.'+k] ?? null; } },
  set(k, v){ memStore['s.'+k] = v; try { sessionStorage.setItem(k, v); } catch(e){} },
  del(k){ delete memStore['s.'+k]; try { sessionStorage.removeItem(k); } catch(e){} }
};

let S = null;       // stanje aplikacije (vse, kar uporabnik trenutno vidi)
let USERS = [];     // lokalni uporabniki (samo lokalni način)
let ME = null;      // prijavljen uporabnik {id, name, role, staffId, username}
let rev = 0;        // števec sprememb (za razveljavitev predpomnilnika razporeda)
let flushTimer = null;

function mergeDefaults(target, def){
  for (const k of Object.keys(def)){
    if (target[k] === undefined) target[k] = clone(def[k]);
    else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object') mergeDefaults(target[k], def[k]);
  }
  return target;
}
function setSaving(busy){
  const el = $('#savepill'); if (!el) return;
  el.classList.toggle('busy', busy);
  el.lastChild.textContent = busy ? ' Shranjujem …' : ' Shranjeno';
}
/* queueFlush: zapiši spremembe v bazo (brez razveljavitve predpomnilnika razporeda) */
function queueFlush(){
  setSaving(true);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(async () => {
    try { await flush(); } catch(e){ console.error(e); toast('Shranjevanje ni uspelo. Preveri povezavo in vlogo.'); }
    setSaving(false);
  }, 350);
}
function save(){ rev++; PLAN_CACHE.clear(); queueFlush(); }
function saveUsers(){ store.set('kp.users', JSON.stringify(USERS)); }
function toast(msg){
  const t = $('#toast'); if (!t) return;
  const d = document.createElement('div'); d.textContent = msg; t.appendChild(d);
  setTimeout(() => d.remove(), 2800);
}
async function copyText(text, ok='Kopirano'){
  try { await navigator.clipboard.writeText(text); toast(ok); }
  catch(e){
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(ok); } catch(e2){ toast('Kopiranje ni uspelo. Označi besedilo ročno.'); }
    ta.remove();
  }
}

/* ---------- Gesla (lokalni način, PBKDF2) ---------- */
const b64e = u8 => btoa(String.fromCharCode(...u8));
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function hashPw(pw, saltB64, iter=150000){
  if (!(window.crypto && crypto.subtle)) throw new Error('nosubtle');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:b64d(saltB64), iterations:iter, hash:'SHA-256' }, key, 256);
  return b64e(new Uint8Array(bits));
}
async function makeUser(username, name, role, pw, extra={}){
  const salt = b64e(crypto.getRandomValues(new Uint8Array(16)));
  return { id:uid(), username:username.trim(), name:name.trim() || username.trim(), role, salt, iter:150000, hash: await hashPw(pw, salt, 150000), ...extra };
}
const isAdmin = () => !!(ME && ME.role === 'skrbnik');
const can = a => !!(ME && (PERM[ME.role] || []).includes(a));
const isCrew = () => !!(ME && (ME.role === 'voznik' || ME.role === 'spremljevalec'));
let lastActivity = Date.now();
['click','keydown','input','touchstart'].forEach(ev => document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive:true }));
const idleLimit = () => ((S && S.settings && S.settings.idleMin) || 30) * 60000;
setInterval(() => { if (ME && Date.now() - lastActivity > idleLimit()) logout('Odjava zaradi nedejavnosti.'); }, 30000);

/* ---------- Geokodiranje (naselja, ustanove, uvoženi naslovi) ---------- */
let ADDR = { list:[], map:new Map() };   // uvoženi naslovi: {t, n, lat, lon}
let SHARED_ADDR = [];   // skupna datoteka naslovi.json (v mapi spletne strani): enaka na vseh napravah
async function loadSharedAddr(){
  if (!/^https?:$/.test(location.protocol)) return;
  try { const r = await fetch('naslovi.json', { cache:'no-cache' }); if (!r.ok) return; const a = await r.json(); if (Array.isArray(a)){ SHARED_ADDR = a.filter(x => Array.isArray(x) && typeof x[0] === 'string' && isFinite(x[1]) && isFinite(x[2])).slice(0, 40000); loadAddr(); } } catch(e){}
}
function loadAddr(){
  let raw = []; try { raw = JSON.parse(store.get('kp.addr') || '[]'); } catch(e){ raw = []; }
  raw = SHARED_ADDR.concat(raw);
  ADDR.list = raw.map(r => ({ t:r[0], n:norm(r[0]), lat:r[1], lon:r[2] }));
  ADDR.map = new Map(ADDR.list.map(a => [a.n, a]));
}
const SET_IDX = SETTLEMENTS.map(s => ({ ...s, nn:norm(s.n), re:new RegExp('(^|[^a-z0-9])' + norm(s.n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?![a-z0-9])') }))
                           .sort((a,b) => b.nn.length - a.nn.length);
const TOWN_IDX = TOWNS.map(s => ({ ...s, nn:norm(s.n), re:new RegExp('(^|[^a-z0-9])' + norm(s.n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?![a-z0-9])') }))
                      .sort((a,b) => b.nn.length - a.nn.length);
const BASE_POINT = { lat:BASE_POI.lat, lon:BASE_POI.lon };
function settlementPoint(s){ const o = S.coordOv[s.n]; return o ? { lat:o[0], lon:o[1] } : { lat:s.lat, lon:s.lon }; }

/* ---------- Ustanove, klinike in lastne ustanove (S.places) ----------
   Klinika je cilj »UKC Ljubljana – Očesna klinika«: enaka točka kot bolnišnica (ali lastna koordinata), svoj ključ, čas pregleda (stay)
   in pot od vhoda do ambulante (extra). Ujemanje: najdaljše ujemajoče ime (bolnišnica + klinika) ima prednost pred samo bolnišnico. */
const sepNorm = t => norm(t).replace(/[–—\-,\/.()]+/g, ' ').replace(/\s+/g, ' ').trim();
let PL = { rev:-1, S:null, all:[], match:[] };
function placeIndex(){
  if (PL.rev === rev && PL.S === S) return PL;
  const num = v => (v != null && v !== '' && isFinite(+v)) ? +v : null;
  const parents = new Map(POIS.map(p => [p.n, p]));
  const all = [];
  ((S && S.places) || []).filter(x => !x.parent && x.n).forEach(x => {   // lastne ustanove
    const la = num(x.lat), lo = num(x.lon);
    const p = { n:x.n, al:[norm(x.n), ...(x.al || []).map(norm)], lat:la ?? BASE_POI.lat, lon:lo ?? BASE_POI.lon, sub:x.addr || 'ustanova', extra:num(x.extra), stay:num(x.stay), gq:x.addr ? x.n + ', ' + x.addr : x.n, custom:true, noCoord:la == null || lo == null, fixed:la != null && lo != null, id:x.id };
    parents.set(p.n, p); all.push(p);
  });
  const clinics = [];
  ((S && S.places) || []).filter(x => x.parent && x.n).forEach(x => {
    const par = parents.get(x.parent); if (!par) return;
    const la = num(x.lat), lo = num(x.lon);
    clinics.push({ n:par.n + ' – ' + x.n, short:x.n, al:(x.al || []).map(norm), parent:par.n, parentAl:[norm(par.n), ...(par.al || [])], clinic:true,
      lat:la ?? par.lat, lon:lo ?? par.lon, sub:x.addr || par.sub, extra:num(x.extra) ?? par.extra ?? null, stay:num(x.stay), gq:[x.n, x.addr || par.gq || par.n].join(', '),
      noCoord:la == null && !!par.noCoord, fixed:la != null && lo != null, id:x.id });
  });
  const match = [], seen = new Map();
  clinics.forEach(c => { const b = sepNorm(c.short); seen.set(b, (seen.get(b) || 0) + 1); });
  clinics.forEach(c => {
    const names = [sepNorm(c.short), ...c.al.map(sepNorm)];
    c.parentAl.forEach(pa => names.filter(Boolean).forEach(cn => match.push({ s:sepNorm(pa) + ' ' + cn, poi:c })));
    const b = sepNorm(c.short); if (b.length >= 10 && seen.get(b) === 1) match.push({ s:b, poi:c });
  });
  all.push(...clinics);
  PL = { rev, S, all, match, customs:all.filter(p => p.custom) };
  return PL;
}
const poiPoint = p => ({ kind:p.noCoord ? 'neznano' : 'poi', poi:p, key:'poi:' + p.n, lat:p.lat, lon:p.lon, label:p.n });
/* Čas čakanja na pregled (min) in pot od vhoda do ambulante za cilj */
const poiExtra = g => (g && g.poi) ? (g.poi.extra != null ? g.poi.extra : (S.settings.extraDef ?? 5)) : 0;
const poiStay = g => (g && g.poi && g.poi.stay != null) ? g.poi.stay : (S.settings.stayDef ?? 45);

function geo(text){
  const t = norm(text);
  if (!t) return { kind:'prazno', key:'', lat:BASE_POINT.lat, lon:BASE_POINT.lon, label:'' };
  // 1) klinike (»UKC Ljubljana – Očesna klinika«) in lastne ustanove
  const pi = placeIndex();
  if (pi.all.length){
    const tn = sepNorm(text); let hit = null;
    for (const m of pi.match) if ((tn === m.s || tn.startsWith(m.s + ' ')) && (!hit || m.s.length > hit.s.length)) hit = m;
    if (hit) return poiPoint(hit.poi);
    for (const p of pi.customs){ const nn = [sepNorm(p.n), ...p.al.map(sepNorm)]; if (nn.some(a => a && (tn === a || tn.startsWith(a + ' ')))) return poiPoint(p); }
  }
  // 1b) ustanove
  for (const p of POIS){
    const names = [norm(p.n), ...p.al];
    if (names.some(a => t === a || t.startsWith(a + ' ') || t.startsWith(a + ',') || (a.length > 7 && t.includes(a))))
      return { kind:'poi', poi:p, key:'poi:'+p.n, lat:p.lat, lon:p.lon, label:p.n };
  }
  // 2) uvoženi naslovi (natančni)
  const ex = ADDR.map.get(t) || ADDR.map.get(t.replace(/,\s*/g, ' ').replace(/\s+/g,' '));
  if (ex) return { kind:'addr', key:'a:'+ex.n, lat:ex.lat, lon:ex.lon, label:ex.t, naselje:'' };
  // 3) naselje: zadnja omemba v besedilu, najdaljše ime
  let best = null;
  for (const s of SET_IDX){
    const m = s.re.exec(t); if (!m) continue;
    const pos = m.index + m[1].length;
    if (!best || pos > best.pos || (pos === best.pos && s.nn.length > best.s.nn.length)) best = { s, pos };
  }
  if (best){ const pt = settlementPoint(best.s); return { kind:'naselje', key:'n:'+best.s.n, lat:pt.lat, lon:pt.lon, label:best.s.n, naselje:best.s.n }; }
  // 4) večje mesto izven občine (Ljubljana, Novo mesto, Krško …): središče mesta; zadnja omemba v besedilu
  let bt = null;
  for (const s of TOWN_IDX){
    const m = s.re.exec(t); if (!m) continue;
    const pos = m.index + m[1].length;
    if (!bt || pos > bt.pos || (pos === bt.pos && s.nn.length > bt.s.nn.length)) bt = { s, pos };
  }
  if (bt) return { kind:'mesto', key:'t:' + bt.s.n, lat:bt.s.lat, lon:bt.s.lon, label:bt.s.n, naselje:bt.s.n };
  // 5) brez ujemanja: center Brežic (cestnih podatkov za tak naslov ni; razdalja je ocena)
  return { kind:'neznano', key:'?:'+t, lat:BASE_POINT.lat, lon:BASE_POINT.lon, label:text.trim() };
}

/* ---------- Predlogi naslovov ---------- */
const hl = (label, q) => {
  if (!q) return esc(label);
  const i = norm(label).indexOf(q); if (i < 0) return esc(label);
  return esc(label.slice(0,i)) + '<mark>' + esc(label.slice(i, i+q.length)) + '</mark>' + esc(label.slice(i+q.length));
};
function suggestions(kind, raw){
  if (kind === 'patient') return patientSuggestions(raw);
  const q = norm(raw);
  const m = q.match(/^(.*?)(?:\s+(\d+\s?[a-z]?))?$/);
  const base = (m && m[1] ? m[1] : q).trim(), num = m && m[2] ? raw.trim().match(/(\d+\s?[a-zA-Z]?)\s*$/)[1].replace(/\s/g,'') : '';
  const out = [];
  const seen = new Set();
  const push = (label, sub, ins, score) => { if (seen.has(label)) return; seen.add(label); out.push({ label, sub, ins, score }); };
  const scoreOf = s => { const n = norm(s); if (!base) return 3; if (n.startsWith(base)) return 0; if (n.split(/[\s,-]+/).some(w => w.startsWith(base))) return 1; if (n.includes(base)) return 2; return 9; };
  if (!q){
    if (kind === 'to') POIS.slice(0,7).forEach(p => push(p.n, p.sub, p.n, 0));
    else { POIS.filter(p => p.home).forEach(p => push(p.n, 'ustanova v Brežicah', p.n, 0)); S.addrBook.slice(-4).reverse().forEach(a => push(a.t, 'zadnji naslovi', a.t, 1)); }
    return out.slice(0, 8);
  }
  POIS.forEach(p => { const sc = Math.min(scoreOf(p.n), ...p.al.map(scoreOf)); if (sc < 9) push(p.n, p.sub, p.n, sc - (kind==='to'?0.5:0)); });
  placeIndex().all.forEach(p => { const sc = Math.min(scoreOf(p.n), scoreOf(p.short || p.n), ...(p.al || []).map(scoreOf)); if (sc < 9) push(p.n, p.clinic ? 'klinika · ' + (p.sub || '') : p.sub, p.n, sc - (kind==='to'?0.7:0)); });
  S.addrBook.forEach(a => { const sc = scoreOf(a.t); if (sc < 9) push(a.t, 'že vpisan naslov', a.t, sc - 0.2); });
  if (ADDR.list.length){
    let c = 0;
    const toks = base.split(/\s+/).filter(Boolean);
    for (const a of ADDR.list){ if (toks.every(w => a.n.includes(w)) && (!num || a.n.includes(num.toLowerCase()))){ push(a.t, 'naslov (uvoz)', a.t, scoreOf(a.t)); if (++c >= 8) break; } }
  }
  BREZICE_STREETS.forEach(st => { const sc = scoreOf(st); if (sc < 9){ const full = num ? `${st} ${num}, Brežice` : null; if (full) push(full, 'ulica v Brežicah', full, sc); else push(st + ' …', 'ulica v Brežicah · dodaj hišno št.', st + ' ', sc + .1); } });
  SETTLEMENTS.forEach(s => { const sc = scoreOf(s.n); if (sc < 9){ const full = num ? `${s.n} ${num}` : s.n; push(full, 'naselje · Občina Brežice', full, sc + .3); } });
  TOWNS.forEach(s => { const sc = scoreOf(s.n); if (sc < 9){ const full = num ? `${s.n} ${num}` : s.n; push(full, 'mesto izven občine', full, sc + .4); } });
  out.sort((a,b) => a.score - b.score || a.label.length - b.label.length);
  return out.slice(0, 8);
}
let sg = { el:null, items:[], idx:-1, input:null, kind:'from' };
function sgRender(){
  const box = $('#suggest');
  if (!sg.input || !sg.items.length){ box.hidden = true; return; }
  const q = norm(sg.input.value);
  box.innerHTML = sg.items.map((it,i) => `<button type="button" role="option" data-i="${i}" aria-selected="${i===sg.idx}"><b>${hl(it.label, q)}</b><span>${esc(it.sub)}</span></button>`).join('');
  const r = sg.input.getBoundingClientRect();
  box.hidden = false;
  box.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 260)) + 'px';
  box.style.width = Math.max(r.width, 260) + 'px';
  const below = window.innerHeight - r.bottom;
  if (below < 220 && r.top > below){ box.style.top = 'auto'; box.style.bottom = (window.innerHeight - r.top + 4) + 'px'; }
  else { box.style.bottom = 'auto'; box.style.top = (r.bottom + 4) + 'px'; }
}
function sgOpen(input){
  sg.input = input; sg.kind = input.dataset.suggest; sg.items = suggestions(sg.kind, input.value); sg.idx = -1; sgRender();
}
function sgClose(){ sg.input = null; $('#suggest').hidden = true; }
function sgPick(i){
  const it = sg.items[i]; if (!it || !sg.input) return;
  const inp = sg.input;
  if (it.pid){
    const art = inp.closest('[data-ride]');
    if (art){ inp.value = it.ins; sgClose(); applyPatientToRide(art.dataset.date, art.dataset.ride, it.pid); rerender(); return; }
  }
  inp.value = it.ins;
  inp.dispatchEvent(new Event('input', { bubbles:true })); inp.dispatchEvent(new Event('change', { bubbles:true }));
  if (/\s$/.test(it.ins)) { inp.focus(); sgOpen(inp); } else sgClose();
}
/* Naslov, ki ga je dispečer vpisal, se shrani in je naslednjič med predlogi */
function learnAddress(text){
  const t = text.trim(); if (t.length < 4) return;
  const g = geo(t); if (g.kind === 'poi' || g.kind === 'neznano' || g.kind === 'prazno') return;
  if (S.addrBook.some(a => norm(a.t) === norm(t))) return;
  if ((g.kind === 'naselje' || g.kind === 'mesto') && norm(t) === norm(g.label)) return;
  S.addrBook.push({ t, s:g.naselje || '' }); if (S.addrBook.length > 3000) S.addrBook.shift();
}
