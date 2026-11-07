'use strict';
/* =====================================================================
   PODATKI: naselja Občine Brežice, ustanove, privzete nastavitve
   Imena naselij: uradni seznam (gov.si, Upravna enota Brežice).
   KOORDINATE SO PRIBLIŽNE (ocena na ~1 km). Popravi jih v Nastavitve > Naselja,
   ali uvozi CSV naslovov (GURS RPE) v Nastavitve > Naslovi.
   ===================================================================== */
const SETTLEMENT_RAW =
'Arnovo selo|45.98|15.54;Artiče|45.94|15.49;Bizeljska vas|46.01|15.70;Bizeljsko|46.02|15.71;Blatno|45.98|15.69;Bojsno|46.03|15.66;Boršt|45.99|15.65;Bračna vas|45.99|15.57;Brezje|45.94|15.57;Brezovica na Bizeljskem|46.03|15.69;'+
'Brežice|45.90|15.59;Brvi|45.98|15.59;Bukošek|45.99|15.62;Bukovje|45.99|15.63;Bušeča vas|45.88|15.57;Cerina|45.95|15.52;Cerklje ob Krki|45.89|15.50;Cirnik|45.92|15.50;Cundrovec|45.93|15.62;Curnovec|45.95|15.64;'+
'Čatež ob Savi|45.89|15.62;Čedem|45.99|15.55;Črešnjice pri Cerkljah|45.88|15.48;Dečno selo|45.86|15.58;Dednja vas|45.86|15.55;Dobeno|45.97|15.65;Dobova|45.90|15.66;Dolenja Pirošica|45.97|15.50;Dolenja vas pri Artičah|45.93|15.48;Dolenje Skopice|45.90|15.54;'+
'Dramlja|45.97|15.53;Drenovec pri Bukovju|45.99|15.62;Dvorce|45.93|15.48;Gabrje|45.94|15.55;Gaj|45.92|15.51;Gazice|45.93|15.57;Globočice|45.91|15.66;Globoko|45.91|15.48;Glogov brod|45.95|15.58;Gorenja Pirošica|45.98|15.49;'+
'Gorenje Skopice|45.91|15.53;Gornji Lenart|45.88|15.58;Gregovce|45.96|15.62;Hrastje|45.92|15.51;Izvir|45.90|15.68;Jereslavec|45.95|15.60;Jesenice|45.86|15.64;Kamence|45.95|15.55;Kapele|45.97|15.61;Koritno|45.97|15.68;'+
'Kraška vas|45.88|15.54;Križe|45.94|15.65;Krška vas|45.88|15.48;Laze|45.99|15.59;Loče|45.99|15.58;Mala Dolina|45.89|15.54;Mali Cirnik|45.92|15.51;Mali Obrež|45.92|15.62;Mali Vrh|45.92|15.53;Mihalovec|45.87|15.62;'+
'Mostec|45.91|15.61;Mrzlava vas|45.88|15.49;Nova vas ob Sotli|46.03|15.75;Nova vas pri Mokricah|45.84|15.63;Obrežje|45.86|15.71;Oklukova gora|45.98|15.47;Orešje na Bizeljskem|46.03|15.68;Pavlova vas|46.02|15.69;Pečice|45.94|15.63;Perišče|45.96|15.58;'+
'Piršenbreg|45.92|15.57;Pišece|46.00|15.46;Podgorje|45.94|15.51;Podgračeno|45.99|15.51;Podvinje|45.95|15.66;Ponikve|45.98|15.64;Poštena vas|45.88|15.67;Prilipe|45.90|15.69;Račja vas|45.88|15.60;Rajec|45.99|15.47;'+
'Rakovec|45.88|15.68;Ribnica|45.95|15.71;Rigonce|45.97|15.58;Sela|45.90|15.63;Silovec|45.98|15.67;Slogonsko|45.90|15.47;Slovenska vas|45.87|15.69;Sobenja vas|45.99|15.68;Spodnja Pohanca|45.91|15.55;Sromlje|45.97|15.52;'+
'Stankovo|45.99|15.69;Stara vas - Bizeljsko|46.00|15.72;Stojanski vrh|45.98|15.70;Trebež|45.88|15.64;Velika Dolina|45.89|15.53;Velike Malence|45.90|15.55;Veliki Obrež|45.91|15.63;Vinji vrh|45.96|15.57;Vitna vas|45.94|15.61;Volčje|45.96|15.55;'+
'Vrhje|45.94|15.55;Vrhovska vas|45.98|15.53;Zasap|45.91|15.66;Zgornja Pohanca|45.92|15.54;Zgornji Obrež|45.92|15.64;Žejno|45.87|15.65;Župeča vas|45.92|15.69;Župelevec|45.87|15.56';

const SETTLEMENTS = SETTLEMENT_RAW.split(';').map(s => { const p = s.split('|'); return { n: p[0], lat: +p[1], lon: +p[2] }; });

/* Delni seznam ulic v mestu Brežice. Dopolni z uvozom CSV ali pa se naslovi naučijo sami. */
const BREZICE_STREETS = ['Cesta prvih borcev','Trg izgnancev','Cesta bratov Milavcev','Černelčeva cesta','Cesta svobode','Bizeljska cesta','Prešernova ulica','Aškerčeva ulica','Levstikova ulica','Gubčeva ulica'];

/* Ustanove (cilji prevozov). Koordinate približne. */
const POIS = [
  { n:'SB Brežice', al:['sb brezice','bolnisnica brezice','splosna bolnisnica brezice','sb brez'], lat:45.903, lon:15.590, sub:'Splošna bolnišnica Brežice', home:true },
  { n:'SB Brežice – dializa', al:['dializa','dializni center','sb brezice dializa'], lat:45.903, lon:15.590, sub:'Dializni center', home:true },
  { n:'ZD Brežice', al:['zd brezice','zdravstveni dom brezice','rp brezice','resevalna postaja'], lat:45.905, lon:15.589, sub:'Zdravstveni dom Brežice', home:true },
  { n:'ZD Krško', al:['zd krsko','zdravstveni dom krsko'], lat:45.959, lon:15.492, sub:'Zdravstveni dom Krško' },
  { n:'SB Novo mesto', al:['sb novo mesto','bolnisnica novo mesto','sb nm'], lat:45.803, lon:15.170, sub:'Splošna bolnišnica Novo mesto' },
  { n:'SB Celje', al:['sb celje','bolnisnica celje'], lat:46.237, lon:15.265, sub:'Splošna bolnišnica Celje' },
  { n:'UKC Ljubljana', al:['ukc ljubljana','ukc lj','ukcl','klinicni center','kc ljubljana'], lat:46.054, lon:14.525, sub:'Univerzitetni klinični center' },
  { n:'Onkološki inštitut Ljubljana', al:['onkoloski institut','oi ljubljana','onkologija'], lat:46.064, lon:14.521, sub:'Zaloška cesta, Ljubljana' },
  { n:'URI Soča Ljubljana', al:['uri soca','soca','rehabilitacija'], lat:46.062, lon:14.513, sub:'Linhartova, Ljubljana' },
  { n:'UKC Maribor', al:['ukc maribor','kc maribor'], lat:46.560, lon:15.635, sub:'Univerzitetni klinični center Maribor' },
  { n:'Klinika Golnik', al:['golnik','bolnisnica golnik'], lat:46.349, lon:14.338, sub:'Univerzitetna klinika Golnik' },
  { n:'KBC Zagreb', al:['zagreb','kbc zagreb'], lat:45.820, lon:15.990, sub:'Hrvaška' }
];
const BASE_POI = POIS.find(p => p.n === 'ZD Brežice');

const DIA_GROUPS = ['D1','D2','SaD4','D3'];
const DOW_LONG = ['nedelja','ponedeljek','torek','sreda','četrtek','petek','sobota'];
const DOW_SHORT = ['ned','pon','tor','sre','čet','pet','sob'];
const MONTHS = ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
const MODES = { sede:'Sede', leze:'Leže', utila:'Utila' };

/* ---------- Vloge, statusi prevoza, barve pacientov ---------- */
const ROLES = { skrbnik:'Skrbnik', dispecer:'Dispečer', voznik:'Voznik', spremljevalec:'Spremljevalec' };
const isCrewRole = r => r === 'voznik' || r === 'spremljevalec';
/* Potek prevoza. Voznik pritisne naslednji korak, čas se zapiše samodejno. */
const STATUSI = {
  nova:{ l:'Vpisan', s:'Vpisan', tone:'' },
  dodeljena:{ l:'Dodeljen posadki', s:'Dodeljen', tone:'info' },
  sprejeta:{ l:'Sprejet', s:'Sprejet', tone:'info' },
  na_poti:{ l:'Na poti do pacienta', s:'Na poti', tone:'warn' },
  na_kraju:{ l:'Na kraju (pri pacientu)', s:'Na kraju', tone:'warn' },
  v_vozilu:{ l:'Pacient v vozilu', s:'V vozilu', tone:'accent' },
  na_cilju:{ l:'Na cilju', s:'Na cilju', tone:'ok' },
  zakljucena:{ l:'Zaključen', s:'Zaključen', tone:'ok' },
  ni_doma:{ l:'Pacienta ni na naslovu', s:'Ni doma', tone:'bad' },
  odklonjena:{ l:'Posadka je odklonila', s:'Odklonjen', tone:'bad' },
  preklicana:{ l:'Preklican', s:'Preklican', tone:'bad' }
};
const STATUS_FLOW = ['dodeljena','sprejeta','na_poti','na_kraju','v_vozilu','na_cilju','zakljucena'];
const STATUS_BTN = { dodeljena:'Sprejmem prevoz', sprejeta:'Krenil sem k pacientu', na_poti:'Sem pri pacientu', na_kraju:'Pacient je v vozilu', v_vozilu:'Prispel na cilj', na_cilju:'Zaključi prevoz' };
const CASI_KLJUC = { sprejeta:'sprejeta', na_poti:'na_poti', na_kraju:'na_kraju', v_vozilu:'v_vozilu', na_cilju:'na_cilju', zakljucena:'zakljucena' };
const NALOG_VRSTE = {
  letna:{ l:'Letni', hint:'Dializa: velja do 1 leto (Navodilo ZZZS, 23. člen)' },
  mesecna:{ l:'Mesečni', hint:'Ponavljajoči prevozi v koledarskem mesecu pri istem izvajalcu' },
  enkratna:{ l:'Enkratni', hint:'Velja za en prevoz' },
  zdravljenje:{ l:'Za čas zdravljenja', hint:'Obsevanje ali kemoterapija: velja za čas zdravljenja' }
};
const ZDRAVNIK_VRSTE = ['osebni','nadomestni','NMP','napotni'];
/* 8 barv pacientov: odtenki so izbrani, da so berljivi na svetli in temni podlagi (glej CSS --pc0..--pc7) */
const PCOLORS = 8;

function defaultState(){
  return {
    v:2,
    settings:{
      speed:45, speedHw:85, road:1.3, pickMin:4, dropMin:3, buffer:15, window:60, detour:25, maxRide:120,
      shift:'06:00', idleMin:30, slots:35, waitTol:10,
      dia:{
        D1:{ start:'06:30', end:'10:30', days:[1,3,5] },
        D2:{ start:'11:00', end:'15:00', days:[1,3,5] },
        SaD4:{ start:'15:30', end:'19:30', days:[1,3,5] },
        D3:{ start:'06:30', end:'10:30', days:[2,4,6] }
      }
    },
    /* Prilagodljiva pravila: "običajno" velja, "prilagoditev" se uporabi samo, ko je potrebna (ali ko dispečer tako izbere). */
    rules:{
      mode:'samodejno',            // strogo | samodejno | prosto
      enforceShift:true, shiftHours:8, overtimeMax:240,
      bend:{ maxRide:180, detour:45, window:120, buffer:5 },
      opozoriloDni:30, opozoriloKratki:7
    },
    vehicles:[
      { id:'v04', name:'Avto 04', tip:'sanitetno', ns:'redna', sede:3, leze:1, utila:0, skupaj:4, sedeMax:3, lezeMax:1, utilaMax:0, skupajMax:4, aktiv:true },
      { id:'v13', name:'Avto 13', tip:'sanitetno', ns:'redna', sede:4, leze:0, utila:0, skupaj:4, sedeMax:6, lezeMax:0, utilaMax:0, skupajMax:6, aktiv:true },
      { id:'c1', name:'C1 rdeči', tip:'sanitetno', ns:'oboje', sede:2, leze:0, utila:0, skupaj:2, sedeMax:2, lezeMax:0, utilaMax:0, skupajMax:2, aktiv:true },
      { id:'ost', name:'OSTALO', tip:'ostalo', ns:'oboje', sede:0, leze:0, utila:0, skupaj:0, sedeMax:0, lezeMax:0, utilaMax:0, skupajMax:0, aktiv:true }
    ],
    staff:[], patients:[], duty:{}, vehOff:{}, rides:{}, crewBook:{}, notices:[], dayNote:{}, dayRules:{}, published:{}, nadure:{}, audit:[], diaPatients:[], addrBook:[], coordOv:{}, extraSlots:{}
  };
}

/* Dovoljenja po vlogah. Prava pravila varnosti so v firestore.rules; to je samo za vmesnik in lokalni način. */
const PERM = {
  skrbnik:['book','publish','patients','staff','settings','users','audit'],
  dispecer:['book','publish','patients','staff'],
  voznik:['crew'],
  spremljevalec:['crew']
};

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
const diaGroupsFor = (s, S) => DIA_GROUPS.filter(g => (S.settings.dia[g].days || []).includes(dow(s)));

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
const BASE_POINT = { lat:BASE_POI.lat, lon:BASE_POI.lon };
function settlementPoint(s){ const o = S.coordOv[s.n]; return o ? { lat:o[0], lon:o[1] } : { lat:s.lat, lon:s.lon }; }

function geo(text){
  const t = norm(text);
  if (!t) return { kind:'prazno', key:'', lat:BASE_POINT.lat, lon:BASE_POINT.lon, label:'' };
  // 1) ustanove
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
  // 4) brez ujemanja: center Brežic
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
  S.addrBook.forEach(a => { const sc = scoreOf(a.t); if (sc < 9) push(a.t, 'že vpisan naslov', a.t, sc - 0.2); });
  if (ADDR.list.length){
    let c = 0;
    const toks = base.split(/\s+/).filter(Boolean);
    for (const a of ADDR.list){ if (toks.every(w => a.n.includes(w)) && (!num || a.n.includes(num.toLowerCase()))){ push(a.t, 'naslov (uvoz)', a.t, scoreOf(a.t)); if (++c >= 8) break; } }
  }
  BREZICE_STREETS.forEach(st => { const sc = scoreOf(st); if (sc < 9){ const full = num ? `${st} ${num}, Brežice` : null; if (full) push(full, 'ulica v Brežicah', full, sc); else push(st + ' …', 'ulica v Brežicah · dodaj hišno št.', st + ' ', sc + .1); } });
  SETTLEMENTS.forEach(s => { const sc = scoreOf(s.n); if (sc < 9){ const full = num ? `${s.n} ${num}` : s.n; push(full, 'naselje · Občina Brežice', full, sc + .3); } });
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
  if (g.kind === 'naselje' && norm(t) === norm(g.label)) return;
  S.addrBook.push({ t, s:g.naselje || '' }); if (S.addrBook.length > 3000) S.addrBook.shift();
}

/* =====================================================================
   PODATKOVNI SLOJ
   Dva načina, ista pot v kodi:
   - "local": podatki v tem brskalniku (demo, preizkus, artifact). Več zavihkov istega brskalnika se sinhronizira.
   - "firebase": skupna baza (Cloud Firestore) in prijava (Firebase Authentication). Za pravo uporabo.
   Dokumenti: cfg/main, days/{datum}, patients/{id}, crew/{datum}_{uid}, runs/{datum}_{vozilo}[/events/{id}], users/{uid}, audit/{id}
   ===================================================================== */
const KPC = window.KP_CONFIG || {};
const BACKEND = (KPC.mode === 'firebase' && KPC.firebase && KPC.firebase.apiKey && !/VSTAVI|YOUR_|xxxx/i.test(String(KPC.firebase.apiKey))) ? 'firebase' : 'local';
const FB_USER_DOMAIN = KPC.userDomain || 'rp-brezice.example';
let DB = null;

/* ---------- Pomočniki: razlika in zlivanje dokumentov (polje za poljem) ---------- */
const J = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
function diffDoc(a, b, prefix = '', ops = { set:{}, del:[], n:0 }){
  for (const k of Object.keys(b)){
    const p = prefix ? prefix + '.' + k : k;
    if (!(k in a)){ ops.set[p] = b[k]; ops.n++; }
    else if (isObj(a[k]) && isObj(b[k])) diffDoc(a[k], b[k], p, ops);
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])){ ops.set[p] = b[k]; ops.n++; }
  }
  for (const k of Object.keys(a)) if (!(k in b)){ ops.del.push(prefix ? prefix + '.' + k : k); ops.n++; }
  return ops;
}
function applyOps(doc, ops){
  const d = doc || {};
  for (const [p, v] of Object.entries(ops.set || {})){
    const parts = p.split('.'); let o = d;
    for (let i = 0; i < parts.length - 1; i++){ if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = J(v);
  }
  for (const p of (ops.del || [])){
    const parts = p.split('.'); let o = d;
    for (let i = 0; i < parts.length - 1 && o; i++) o = o[parts[i]];
    if (o && isObj(o)) delete o[parts[parts.length - 1]];
  }
  return d;
}
const inRange = (id, r) => !r || ((r.from == null || id >= r.from) && (r.to == null || id <= r.to + '\uf8ff'));
const parentOf = p => p.slice(0, p.lastIndexOf('/'));
const idOf = p => p.slice(p.lastIndexOf('/') + 1);
const newId = () => Date.now().toString(36) + uid();

/* ---------- Lokalni adapter ---------- */
function localAdapter(){
  const PFX = 'kp2.d.', mem = new Map(), dW = new Map(), cW = new Map();
  try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k && k.startsWith(PFX)){ try { mem.set(k.slice(PFX.length), JSON.parse(localStorage.getItem(k))); } catch(e){} } } } catch(e){}
  const persist = p => { try { if (mem.has(p)) localStorage.setItem(PFX + p, JSON.stringify(mem.get(p))); else localStorage.removeItem(PFX + p); } catch(e){} };
  const cur = p => (mem.has(p) ? clone(mem.get(p)) : null);
  const emit = p => {
    (dW.get(p) || []).forEach(f => f(cur(p)));
    const col = parentOf(p), id = idOf(p);
    (cW.get(col) || []).forEach(w => { if (inRange(id, w.range)) w.cb([{ id, data:cur(p) }], { initial:false }); });
  };
  const listIn = (col, range) => [...mem.keys()].filter(p => parentOf(p) === col && inRange(idOf(p), range)).sort().map(p => ({ id:idOf(p), data:cur(p) }));
  window.addEventListener('storage', e => {
    if (!e.key || !e.key.startsWith(PFX)) return;
    const p = e.key.slice(PFX.length);
    if (e.newValue == null) mem.delete(p); else { try { mem.set(p, JSON.parse(e.newValue)); } catch(_){ return; } }
    emit(p);
  });
  // revizijska sled v lokalnem načinu: obdrži zadnjih 1500
  const au = [...mem.keys()].filter(p => parentOf(p) === 'audit').sort();
  au.slice(0, Math.max(0, au.length - 1500)).forEach(p => { mem.delete(p); persist(p); });
  return {
    kind:'local',
    async get(p){ return cur(p); },
    async set(p, d){ mem.set(p, J(d)); persist(p); emit(p); },
    async patch(p, ops){ mem.set(p, applyOps(mem.has(p) ? clone(mem.get(p)) : {}, ops)); persist(p); emit(p); },
    async add(col, d){ const id = newId(); mem.set(col + '/' + id, { ...J(d), ts:new Date().toISOString() }); persist(col + '/' + id); emit(col + '/' + id); return id; },
    async del(p){ mem.delete(p); persist(p); emit(p); },
    async list(col, range){ return listIn(col, range); },
    watchDoc(p, cb){ const a = dW.get(p) || new Set(); dW.set(p, a); a.add(cb); setTimeout(() => cb(cur(p)), 0); return () => a.delete(cb); },
    watchCol(col, cb, range){ const w = { cb, range }, a = cW.get(col) || new Set(); cW.set(col, a); a.add(w); setTimeout(() => { if (a.has(w)) cb(listIn(col, range), { initial:true }); }, 0); return () => a.delete(w); },
    wipe(){ [...mem.keys()].forEach(p => { mem.delete(p); persist(p); }); },
    async shutdown(){}
  };
}

/* ---------- Firebase adapter (SDK se naloži z Googlovega CDN, fiksna različica) ---------- */
const fromFs = v => {
  if (v && typeof v === 'object'){
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (Array.isArray(v)) return v.map(fromFs);
    const o = {}; for (const k of Object.keys(v)) o[k] = fromFs(v[k]); return o;
  }
  return v;
};
async function firebaseAdapter(){
  const base = `https://www.gstatic.com/firebasejs/${KPC.sdkVersion || '10.14.1'}/`;
  const [A, AU, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const app = A.initializeApp(KPC.firebase);
  const auth = AU.getAuth(app);
  let db;
  try { db = F.initializeFirestore(app, KPC.offline === false ? {} : { localCache:F.persistentLocalCache({ tabManager:F.persistentMultipleTabManager() }) }); }
  catch(e){ db = F.getFirestore(app); }
  const dref = p => F.doc(db, p);
  const mkQuery = (col, range) => {
    let q = F.collection(db, col);
    if (range){ const cs = []; if (range.from != null) cs.push(F.where(F.documentId(), '>=', range.from)); if (range.to != null) cs.push(F.where(F.documentId(), '<=', range.to + '\uf8ff')); if (cs.length) q = F.query(q, ...cs); }
    return q;
  };
  const wErr = (what, cb) => err => { console.warn('Firestore listener', what, err && err.code); if (DB && DB.onError) DB.onError(what, err); if (cb) cb(); };
  return {
    kind:'firebase', auth, AU, F,
    async get(p){ const s = await F.getDoc(dref(p)); return s.exists() ? fromFs(s.data()) : null; },
    async set(p, d){ await F.setDoc(dref(p), J(d)); },
    async patch(p, ops){
      const upd = {}; Object.entries(ops.set).forEach(([k, v]) => { upd[k] = J(v); }); ops.del.forEach(k => { upd[k] = F.deleteField(); });
      try { await F.updateDoc(dref(p), upd); }
      catch(e){ if (e && e.code === 'not-found') await F.setDoc(dref(p), applyOps({}, { set:ops.set, del:[] })); else throw e; }
    },
    async add(col, d){ const r = await F.addDoc(F.collection(db, col), { ...J(d), ts:F.serverTimestamp() }); return r.id; },
    async del(p){ await F.deleteDoc(dref(p)); },
    async list(col, range){ const s = await F.getDocs(mkQuery(col, range)); return s.docs.map(d => ({ id:d.id, data:fromFs(d.data()) })); },
    watchDoc(p, cb){ return F.onSnapshot(dref(p), s => cb(s.exists() ? fromFs(s.data()) : null), wErr(p, () => cb(null))); },
    watchCol(col, cb, range){
      let first = true;
      return F.onSnapshot(mkQuery(col, range), snap => {
        const ch = snap.docChanges().map(c => ({ id:c.doc.id, data:c.type === 'removed' ? null : fromFs(c.doc.data()) }));
        const initial = first; first = false;
        if (ch.length || initial) cb(ch, { initial });
      }, wErr(col, () => { if (first){ first = false; cb([], { initial:true }); } }));
    },
    async shutdown(){ try { await F.terminate(db); await F.clearIndexedDbPersistence(db); } catch(e){} try { await AU.signOut(auth); } catch(e){} }
  };
}

/* ---------- Dokumenti: pretvorba med stanjem aplikacije in zbirkami ---------- */
function normalizeState(){
  S.vehicles.forEach(v => {
    ['sede','leze','utila','skupaj'].forEach(k => { v[k + 'Max'] = Math.max(+v[k] || 0, v[k + 'Max'] == null ? (+v[k] || 0) : +v[k + 'Max']); });
  });
  S.patients = S.patients || [];
  if (S.diaPatients && S.diaPatients.length){
    S.diaPatients.forEach(dp => { if (!S.patients.some(p => norm(p.name) === norm(dp.name))) S.patients.push(blankPatient({ name:dp.name, addr:dp.from, phone:dp.phone, mode:dp.mode, dia:dp.group, demo:dp.demo })); });
    S.diaPatients = [];
  }
}
function cfgDoc(){
  return J({ v:2, settings:S.settings, rules:S.rules, vehicles:S.vehicles, staff:S.staff, notices:S.notices, addrBook:S.addrBook,
    coordOv:Object.entries(S.coordOv || {}).map(([n, c]) => ({ n, lat:c[0], lon:c[1] })) });
}
function applyCfg(d){
  const def = defaultState();
  S.settings = mergeDefaults(d.settings || {}, def.settings);
  S.rules = mergeDefaults(d.rules || {}, def.rules);
  S.vehicles = d.vehicles || def.vehicles; S.staff = d.staff || []; S.notices = d.notices || []; S.addrBook = d.addrBook || [];
  S.coordOv = {}; (d.coordOv || []).forEach(o => { S.coordOv[o.n] = [o.lat, o.lon]; });
  normalizeState();
}
function dayDoc(date){
  const rides = {};
  (S.rides[date] || []).forEach((r, i) => { if (isFilled(r)) rides[r.id] = { ...r, nr:i + 1 }; });
  const duty = {}; (S.duty[date] || []).forEach((d, i) => { duty[d.id] = { ...d, ord:i }; });
  const out = { rides, duty, vehOff:S.vehOff[date] || [], crewBook:S.crewBook[date] || {}, dayNote:S.dayNote[date] || '', dayRules:S.dayRules[date] || {}, published:S.published[date] || {} };
  return J(out);
}
function applyDay(date, d){
  d = d || {};
  const arr = [];
  Object.values(d.rides || {}).sort((a, b) => (a.nr || 0) - (b.nr || 0)).forEach(r => {
    let nr = Math.max(1, r.nr || 1); while (arr[nr - 1]) nr++;
    const o = { ...blankRide(), ...r }; delete o.nr; arr[nr - 1] = o;
  });
  const len = Math.max(arr.length, S.settings.slots);
  for (let i = 0; i < len; i++) if (!arr[i]) arr[i] = blankRide();
  S.rides[date] = arr;
  const duty = Object.values(d.duty || {}).sort((a, b) => (a.ord || 0) - (b.ord || 0)).map(x => { const o = { ...x }; delete o.ord; return o; });
  if (duty.length) S.duty[date] = duty; else delete S.duty[date];
  if ((d.vehOff || []).length) S.vehOff[date] = d.vehOff; else delete S.vehOff[date];
  if (Object.keys(d.crewBook || {}).length) S.crewBook[date] = d.crewBook; else delete S.crewBook[date];
  if (d.dayNote) S.dayNote[date] = d.dayNote; else delete S.dayNote[date];
  if (Object.keys(d.dayRules || {}).length) S.dayRules[date] = d.dayRules; else delete S.dayRules[date];
  if (Object.keys(d.published || {}).length) S.published[date] = d.published; else delete S.published[date];
}
const allDays = () => [...new Set([...Object.keys(S.rides), ...Object.keys(S.duty), ...Object.keys(S.crewBook), ...Object.keys(S.dayNote), ...Object.keys(S.vehOff), ...Object.keys(S.dayRules), ...Object.keys(S.published)])];

/* ---------- Sinhronizacija ---------- */
const SY = { snap:{}, unsubs:[], runUnsubs:{}, cfgReady:false, patReady:false, dayReady:false, range:null, started:false, onRemote:null };
async function flush(){
  if (!DB || !ME || !isStaffRole() || !SY.started) return;
  const jobs = [];
  const sync = (path, doc) => {
    const old = SY.snap[path];
    if (!old) jobs.push({ path, doc, p:DB.set(path, doc) });
    else { const ops = diffDoc(old, doc); if (ops.n) jobs.push({ path, doc, p:DB.patch(path, ops) }); }
  };
  if (SY.cfgReady) sync('cfg/main', cfgDoc());
  if (SY.patReady){
    const ids = new Set();
    S.patients.forEach(p => { ids.add(p.id); sync('patients/' + p.id, J(p)); });
    Object.keys(SY.snap).filter(k => k.startsWith('patients/') && !ids.has(k.slice(9))).forEach(k => { jobs.push({ path:k, doc:null, p:DB.del(k) }); });
  }
  if (SY.dayReady) allDays().forEach(d => { if (dayLoaded(d)) sync('days/' + d, dayDoc(d)); });
  const res = await Promise.allSettled(jobs.map(j => j.p));
  let err = null;
  res.forEach((r, i) => { if (r.status === 'fulfilled'){ if (jobs[i].doc) SY.snap[jobs[i].path] = jobs[i].doc; else delete SY.snap[jobs[i].path]; } else err = err || r.reason; });
  if (err) throw err;
}
const dayLoaded = d => !SY.range || (d >= SY.range.from && d <= SY.range.to);

function mergeRemote(path, remote, localDoc){
  const old = SY.snap[path];
  const pend = old ? diffDoc(old, localDoc) : { set:{}, del:[], n:0 };
  SY.snap[path] = J(remote || {});
  return pend.n ? applyOps(J(remote || {}), pend) : (remote || {});
}
function remoteChanged(){ rev++; PLAN_CACHE.clear(); if (SY.onRemote) SY.onRemote(); }
function onCfgDoc(d){
  if (d){ applyCfg(mergeRemote('cfg/main', d, cfgDoc())); }
  else if (!SY.cfgReady){ normalizeState(); }
  SY.cfgReady = true; remoteChanged();
}
function onPatients(changes, meta){
  changes.forEach(c => {
    const path = 'patients/' + c.id, i = S.patients.findIndex(p => p.id === c.id);
    if (!c.data){ if (i >= 0) S.patients.splice(i, 1); delete SY.snap[path]; return; }
    const merged = mergeRemote(path, c.data, i >= 0 ? J(S.patients[i]) : {});
    const p = { ...blankPatient(), ...merged, id:c.id };
    if (i >= 0) S.patients[i] = p; else S.patients.push(p);
  });
  if (meta && meta.initial) SY.patReady = true;
  remoteChanged();
}
function onDays(changes, meta){
  changes.forEach(c => {
    const path = 'days/' + c.id;
    if (!c.data){ if (SY.snap[path]){ delete SY.snap[path]; applyDay(c.id, {}); } return; }
    applyDay(c.id, mergeRemote(path, c.data, dayDoc(c.id)));
  });
  if (meta && meta.initial) SY.dayReady = true;
  remoteChanged();
}
function watchDays(range){
  SY.dayUnsub && SY.dayUnsub();
  SY.range = range; SY.dayReady = !range ? SY.dayReady : false;
  SY.dayUnsub = DB.watchCol('days', onDays, range);
}
function ensureRange(from, to){
  if (!SY.range || !SY.started) return;
  if (from >= SY.range.from && to <= SY.range.to) return;
  watchDays({ from:from < SY.range.from ? from : SY.range.from, to:to > SY.range.to ? to : SY.range.to });
}
async function startSync(){
  if (SY.started) return;
  SY.started = false; SY.cfgReady = SY.patReady = SY.dayReady = false;
  const waits = [];
  const once = () => { let res; const p = new Promise(r => { res = r; }); return [p, res]; };
  const [pc, rc] = once(), [pp, rp] = once(), [pd, rd] = once();
  const today = todayStr();
  SY.unsubs.push(DB.watchDoc('cfg/main', d => { onCfgDoc(d); rc(); }));
  SY.unsubs.push(DB.watchCol('patients', (c, m) => { onPatients(c, m); if (m && m.initial) rp(); }));
  SY.range = DB.kind === 'local' ? null : { from:addDays(today, -35), to:addDays(today, 70) };
  SY.dayUnsub = DB.watchCol('days', (c, m) => { onDays(c, m); if (m && m.initial) rd(); }, SY.range);
  SY.unsubs.push(() => SY.dayUnsub && SY.dayUnsub());
  SY.unsubs.push(DB.watchCol('runs', (c) => onRuns(c), { from:addDays(today, -2), to:addDays(today, 3) }));
  await Promise.race([Promise.all([pc, pp, pd]), new Promise(r => setTimeout(r, 9000))]);
  SY.started = true;
  if (!S.vehicles.length) S.vehicles = defaultState().vehicles;
  await flush().catch(() => {});
}
function stopSync(){
  SY.unsubs.forEach(u => { try { u(); } catch(e){} }); SY.unsubs = [];
  Object.values(SY.runUnsubs).forEach(u => { try { u(); } catch(e){} }); SY.runUnsubs = {};
  SY.started = false; SY.snap = {};
}

/* ---------- Revizijska sled (samo dodajanje) ---------- */
const AUDIT = [];
function audit(action, detail = {}){
  if (!DB || !ME) return;
  const e = { t:new Date().toISOString(), uid:String(ME.id), who:ME.name, role:ME.role, action, detail:J(detail) || {} };
  AUDIT.unshift(e); if (AUDIT.length > 300) AUDIT.pop();
  DB.add('audit', e).catch(() => {});
}
const initials = n => String(n || '').trim().split(/\s+/).map(w => (w[0] || '').toUpperCase()).join('.').slice(0, 5);

/* =====================================================================
   RAZPORED: dnevne knjige, dializa, parjenje voznikov in vozil, združevanje in vrstni red prevozov
   Čas vožnje je OCENA: zračna razdalja × faktor ceste; prvih 10 km po lokalnih cestah, preostanek po hitrejših.
   ===================================================================== */
const PLAN_CACHE = new Map();

/* ---------- Knjiga: polja ---------- */
const blankRide = () => ({ id:uid(), name:'', time:'', from:'', to:'', phone:'', mode:'sede', dia:'', diaKey:'', done:false, doneBy:'', doneAt:'', pin:'', demo:false,
  patientId:'', nalogId:'', note:'', exc:false, status:'nova', times:{}, statusBy:'', runKey:'' });
const isFilled = r => !!((r.name||'').trim() || (r.from||'').trim() || (r.to||'').trim());
function ensureDay(date){
  let a = S.rides[date]; if (!a) a = S.rides[date] = [];
  while (a.length < S.settings.slots) a.push(blankRide());
  return a;
}
function addSlots(date, n){ const a = ensureDay(date); for (let i = 0; i < n; i++) a.push(blankRide()); save(); }
function filledRides(date){ return ensureDay(date).map((r,i) => ({ r, nr:i+1 })).filter(x => isFilled(x.r)); }
function rideById(date, id){ const a = ensureDay(date); const i = a.findIndex(r => r.id === id); return i < 0 ? null : { r:a[i], nr:i+1 }; }
function rideDir(r){
  const f = geo(r.from), t = geo(r.to);
  if (f.kind === 'poi' && t.kind !== 'poi' && t.kind !== 'prazno') return 'from';
  return 'to';
}

/* ---------- Dializa (pacienti iz baze s skupino dialize) ---------- */
function loadDialysis(date){
  const groups = diaGroupsFor(date, S); if (!groups.length) return 0;
  const a = ensureDay(date); let added = 0;
  const place = obj => {
    let i = a.findIndex(r => !isFilled(r));
    if (i < 0){ a.push(blankRide()); i = a.length - 1; }
    Object.assign(a[i], blankRide(), obj); added++;
  };
  for (const p of S.patients){
    if (!p.dia || !groups.includes(p.dia)) continue;
    const g = S.settings.dia[p.dia];
    const nl = activeNalog(p, date);
    const base = { name:p.name, phone:p.phone, mode:p.mode, dia:p.dia, demo:!!p.demo, patientId:p.id, nalogId:nl ? nl.id : '' };
    const k1 = p.id + ':tja', k2 = p.id + ':nazaj';
    if (!a.some(r => r.diaKey === k1)) place({ ...base, time:g.start, from:p.addr, to:'SB Brežice – dializa', diaKey:k1 });
    if (!a.some(r => r.diaKey === k2)) place({ ...base, time:g.end, from:'SB Brežice – dializa', to:p.addr, diaKey:k2 });
  }
  if (added) save();
  return added;
}

/* ---------- Vozila, posebnosti ---------- */
function vehBlocked(date, vid){
  return S.notices.find(n => n.vehicleId === vid && !n.closed && (n.tip === 'okvara' || n.tip === 'servis') && n.from <= date && (!n.to || n.to >= date)) || null;
}
const vehOff = (date, vid) => (S.vehOff[date] || []).includes(vid);
function availableVehicles(date){
  return S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo' && !vehOff(date, v.id) && !vehBlocked(date, v.id));
}
const vehById = id => S.vehicles.find(v => v.id === id);
/* Kapaciteta: običajna (sede/leze/utila/skupaj) in največja dovoljena (…Max). Največja se uporabi samo, ko se pravila prilagajajo. */
const capOf = (v, lvl) => lvl
  ? { sede:Math.max(v.sede, v.sedeMax ?? v.sede), leze:Math.max(v.leze, v.lezeMax ?? v.leze), utila:Math.max(v.utila, v.utilaMax ?? v.utila), skupaj:Math.max(v.skupaj, v.skupajMax ?? v.skupaj) }
  : { sede:v.sede, leze:v.leze, utila:v.utila, skupaj:v.skupaj };
const capText = v => {
  const m = capOf(v, 1), bent = m.skupaj > v.skupaj || m.sede > v.sede || m.leze > v.leze || m.utila > v.utila;
  return `${v.sede} sede · ${v.leze} leže · ${v.utila} utila · skupaj ${v.skupaj}` + (bent ? ` (izjemoma do ${m.skupaj})` : '');
};
const fits = (counts, v, lvl = 0) => { const c = capOf(v, lvl); return counts.sede <= c.sede && counts.leze <= c.leze && counts.utila <= c.utila && (counts.sede + counts.leze + counts.utila) <= c.skupaj; };
const countModes = rides => { const c = { sede:0, leze:0, utila:0 }; rides.forEach(r => { c[r.mode] = (c[r.mode] || 0) + 1; }); return c; };

/* ---------- Parjenje: kateri zaposleni vozi katero vozilo ---------- */
function pairCrews(date){
  const duty = S.duty[date] || [];
  const veh = availableVehicles(date);
  const used = new Set(), crews = [];
  const drivers = duty.filter(d => d.role !== 'spremljevalec');
  const escorts = duty.filter(d => d.role === 'spremljevalec');
  const take = (d, v) => {
    used.add(v.id);
    const shift = toMin(d.from) ?? toMin(S.settings.shift) ?? 360;
    const explicit = !!(d.from || d.to);
    let end = null;
    if (explicit && S.rules.enforceShift){ end = d.to ? toMin(d.to) : shift + (S.rules.shiftHours || 8) * 60; if (end != null && end <= shift) end += 1440; }
    crews.push({ id:v.id, vehicle:v, driver:d, escorts:[], team:d.team, shift, end, ot:Math.max(0, +d.ot || 0) });
  };
  drivers.forEach(d => { if (d.vehicleId){ const v = veh.find(x => x.id === d.vehicleId && !used.has(x.id)); if (v) take(d, v); } });
  const rest = drivers.filter(d => !crews.some(c => c.driver === d));
  const pickFor = d => {
    const free = veh.filter(v => !used.has(v.id));
    const want = d.team === 'NN' ? ['NN','oboje'] : ['redna','oboje'];
    return free.find(v => want.includes(v.ns)) || free[0] || null;
  };
  [...rest.filter(d => d.team === 'NN'), ...rest.filter(d => d.team !== 'NN')].forEach(d => { const v = pickFor(d); if (v) take(d, v); });
  const unpaired = rest.filter(d => !crews.some(c => c.driver === d));
  const order = veh.map(v => v.id);
  crews.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
  const looseEsc = [];
  escorts.forEach((e, i) => { const c = crews[i % Math.max(crews.length,1)]; if (c && i < crews.length + 99 && crews.length) c.escorts.push(e); else looseEsc.push(e); });
  return { crews, unpaired, looseEsc };
}

/* ---------- Geometrija ---------- */
function hav(a, b){
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lon - a.lon);
  const h = Math.sin(dLa/2)**2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function makeLeg(cfg){
  const memo = new Map();
  return (a, b) => {
    const k = a.key + '>' + b.key;
    let v = memo.get(k);
    if (!v){
      const km = Math.max(hav(a, b) * cfg.road, a.key === b.key ? 1.2 : 0.8);
      /* prvih 10 km po lokalnih cestah, preostanek po hitrejših (magistralnih) cestah */
      const near = Math.min(km, 10), far = Math.max(0, km - 10);
      v = { km, min: near / cfg.speed * 60 + far / (cfg.speedHw || cfg.speed) * 60 + 1 };
      memo.set(k, v);
    }
    return v;
  };
}
function permute(arr, cb){
  const n = arr.length, c = new Array(n).fill(0), a = arr.slice();
  cb(a.slice());
  let i = 0;
  while (i < n){
    if (c[i] < i){ const j = i % 2 === 0 ? 0 : c[i]; [a[j], a[i]] = [a[i], a[j]]; cb(a.slice()); c[i]++; i = 0; }
    else { c[i] = 0; i++; }
  }
}

/* ---------- Ocena poti ene vožnje ---------- */
function evalTo(order, dest, cfg, leg){
  let t = 0, km = 0, prev = null; const stops = [], ride = {};
  for (const r of order){
    if (prev){ const l = leg(prev, r.from); t += l.min; km += l.km; }
    stops.push({ type:'pu', off:t, pt:r.from, rideId:r.id });
    t += cfg.pickMin; ride[r.id] = t; prev = r.from;
  }
  const l = leg(prev, dest); t += l.min; km += l.km;
  const arr = t;
  stops.push({ type:'do', off:t, pt:dest, rideIds:order.map(r => r.id) });
  t += cfg.dropMin * order.length;
  let maxRide = 0; const rideMin = {};
  order.forEach(r => { rideMin[r.id] = arr - ride[r.id]; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id]; });
  return { order, stops, arr, dur:t, km, maxRide, rideMin, score:t + (maxRide > cfg.maxRide ? 1000 : 0) };
}
function evalFrom(order, origin, cfg, leg){
  const n = order.length; let t = cfg.pickMin * n, km = 0, prev = origin; const boarded = t;
  const stops = [{ type:'pu', off:0, pt:origin, rideIds:order.map(r => r.id) }]; let maxRide = 0; const rideMin = {};
  for (const r of order){
    const l = leg(prev, r.to); t += l.min; km += l.km;
    stops.push({ type:'do', off:t, pt:r.to, rideId:r.id });
    rideMin[r.id] = t - boarded; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id];
    t += cfg.dropMin; prev = r.to;
  }
  return { order, stops, arr:0, dur:t, km, maxRide, rideMin, score:t + (maxRide > cfg.maxRide ? 1000 : 0) };
}
const evalTrip = (kind, order, anchor, cfg, leg) => kind === 'from' ? evalFrom(order, anchor, cfg, leg) : evalTo(order, anchor, cfg, leg);
function bestInsert(kind, order, r, anchor, cfg, leg){
  let best = null;
  for (let i = 0; i <= order.length; i++){
    const o = order.slice(0, i).concat([r], order.slice(i));
    const ev = evalTrip(kind, o, anchor, cfg, leg);
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
function bestExact(kind, rides, anchor, cfg, leg){
  if (rides.length > 7 || rides.length < 2) return evalTrip(kind, rides, anchor, cfg, leg);
  let best = null;
  permute(rides, p => { const ev = evalTrip(kind, p, anchor, cfg, leg); if (!best || ev.score < best.score) best = ev; });
  return best;
}

/* ---------- Pravila: stroga in prilagojena ----------
   Stroga pravila = običajne vrednosti (kapaciteta vozila, najdaljša vožnja, okno, rezerva, dolžina izmene).
   Prilagojena pravila = največje dovoljene vrednosti (S.rules.bend, kapaciteta …Max, nadure).
   Način "samodejno": najprej stroga pravila; če bi bil prevoz nerazporejen ali bi zamudil, se pravila prilagodijo samo toliko, kot je treba,
   in vsaka prilagoditev je izpisana. Način "prosto": prilagoditve so vedno dovoljene. Način "strogo": prilagoditev ni (razen ročnih izjem).
   Ročna izjema na prevozu (kljukica "Izjema") ali pripeto vozilo vedno dovoljujeta prilagoditev za ta prevoz. */
const dayMode = date => (S.dayRules[date] && S.dayRules[date].mode) || S.rules.mode || 'samodejno';
const cfgFor = lvl => lvl ? { ...S.settings, ...S.rules.bend } : S.settings;
const planProblem = p => p.unassigned.length > 0 || p.totals.late > 0;
const planScore = p => p.unassigned.length * 1000 + p.totals.late * 50 + p.bends.length * 3 + p.totals.km * 0.05;

function computePlan(date){
  const mode = dayMode(date);
  const ck = date + '#' + rev + '#' + mode;
  if (PLAN_CACHE.has(ck)) return PLAN_CACHE.get(ck);
  let plan;
  if (mode === 'strogo') plan = planLevel(date, 0);
  else if (mode === 'prosto') plan = planLevel(date, 1);
  else {
    const p0 = planLevel(date, 0);
    if (!planProblem(p0)) plan = p0;
    else { const p1 = planLevel(date, 1); plan = planScore(p1) < planScore(p0) ? p1 : p0; }
  }
  plan.mode = mode;
  PLAN_CACHE.set(ck, plan);
  return plan;
}

function planLevel(date, level){
  const cfgS = S.settings, cfgB = cfgFor(1), leg = makeLeg(cfgS);
  const plan = { date, level, crews:[], unassigned:[], warnings:[], bends:[], assign:{}, totals:{ rides:0, km:0, min:0, late:0, vehicles:0 }, pairing:null, standby:isStandby(date), pending:[] };

  // 1) vožnje, ki jih je treba opraviti
  const rides = [];
  ensureDay(date).forEach((r, i) => {
    if (!isFilled(r) || r.done || r.status === 'preklicana') return;
    const f = geo(r.from), t = geo(r.to);
    rides.push({ id:r.id, nr:i+1, name:(r.name || '').trim() || '(brez imena)', mode:r.mode || 'sede', phone:r.phone || '', time:toMin(r.time), timeTxt:r.time || '',
      from:f, to:t, fromTxt:r.from || '', toTxt:r.to || '', kind:rideDir(r), pin:r.pin || '', exc:!!r.exc, force:!!(r.exc || r.pin), pid:r.patientId || '' });
    if (f.kind === 'prazno' || t.kind === 'prazno') plan.warnings.push({ level:'warn', nr:i+1, text:`Prevoz ${i+1}: manjka naslov (${f.kind === 'prazno' ? 'od' : 'do'}). Razdalja je ocenjena iz centra Brežic.` });
  });
  plan.totals.rides = rides.length;
  plan.pending = rides;

  // 2) posadke
  const pr = pairCrews(date); plan.pairing = pr;
  const crews = pr.crews.map(c => ({ ...c, free:c.shift, pos:BASE_POINT_G(), trips:[], km:0, busy:0 }));
  pr.unpaired.forEach(d => plan.warnings.push({ level:'warn', text:`${d.name} je na delu, a ni prostega vozila.` }));
  pr.looseEsc.forEach(d => plan.warnings.push({ level:'info', text:`${d.name} (spremljevalec) nima voznika.` }));
  if (!crews.length && rides.length) plan.warnings.push({ level:'bad', text:'Ni nobene posadke z vozilom. Dodaj zaposlene in razpoložljiva vozila.' });
  if (plan.standby && crews.length > 1) plan.warnings.push({ level:'info', text:'Vikend/praznik: običajno sta v pripravljenosti 2 zaposlena (ena posadka).' });

  // 3) združevanje v vožnje (stroga pravila najprej, prilagojena samo če je treba)
  const maxCaps = crews.length ? crews.map(c => c.vehicle) : availableVehicles(date);
  const capable = (counts, lv) => maxCaps.some(v => fits(counts, v, lv));
  const timed = rides.filter(r => r.time != null).sort((a,b) => a.time - b.time);
  const untimed = rides.filter(r => r.time == null);
  let trips = [];
  const refOf = t => { const ts = t.rides.map(r => r.time).filter(x => x != null); if (!ts.length) return null; return t.kind === 'from' ? Math.max(...ts) : Math.min(...ts); };
  for (const r of [...timed, ...untimed]){
    const anchor = r.kind === 'from' ? r.from : r.to;
    const stages = (level === 1 || r.force) ? [0, 1] : [0];
    let best = null, bestStage = 0;
    for (const st of stages){
      const cf = st ? cfgB : cfgS;
      for (const t of trips){
        if (t.kind !== r.kind || t.anchor.key !== anchor.key || t.pin !== r.pin) continue;
        const ref = refOf(t);
        if (ref != null && r.time != null && Math.abs(ref - r.time) > cf.window) continue;
        if (anchor.kind === 'neznano' && anchor.key !== t.anchor.key) continue;
        if (!capable(countModes([...t.rides, r]), st)) continue;
        const ev = bestInsert(r.kind, t.ev.order, r, anchor, cf, leg);
        if (ev.maxRide > cf.maxRide) continue;
        const extra = ev.dur - t.ev.dur;
        if (extra > cf.detour) continue;
        if (!best || extra < best.extra) best = { t, ev, extra };
      }
      if (best){ bestStage = st; break; }
    }
    if (best){ best.t.rides.push(r); best.t.ev = best.ev; if (bestStage || r.force) best.t.lvl = 1; }
    else trips.push({ id:uid(), kind:r.kind, anchor, rides:[r], ev:evalTrip(r.kind, [r], anchor, cfgS, leg), pin:r.pin, lvl:r.force ? 1 : 0 });
  }
  trips.forEach(t => { t.ev = bestExact(t.kind, t.ev.order, t.anchor, t.lvl ? cfgB : cfgS, leg); });

  // 4) ključni časi vožnje
  const prep = t => {
    t.ref = refOf(t);
    t.counts = countModes(t.rides);
    t.first = t.kind === 'from' ? t.anchor : t.ev.order[0].from;
    t.last = t.kind === 'from' ? t.ev.order[t.ev.order.length-1].to : t.anchor;
    if (t.kind === 'to'){ t.latestS = t.ref == null ? null : t.ref - cfgS.buffer - t.ev.arr; t.latestB = t.ref == null ? null : t.ref - cfgB.buffer - t.ev.arr; t.need = t.latestS; }
    else { t.latestS = t.latestB = null; t.need = t.ref; }
    t.sbReturn = t.kind === 'from' && t.anchor.kind === 'poi' && t.anchor.poi.home;
    t.force = t.rides.some(r => r.force);
  };
  trips.forEach(prep);
  const hasNN = crews.some(c => c.team === 'NN');
  const baseG = BASE_POINT_G();

  // 5) razdelitev vožnj med posadke
  const queue = trips.slice().sort((a,b) => (a.need ?? 1e6) - (b.need ?? 1e6));
  const crewFor = pin => crews.filter(c => !pin || c.id === pin);
  let guard = 0;
  while (queue.length && guard++ < 800){
    const t = queue.shift();
    let pool = crewFor(t.pin);
    if (t.pin && !crews.some(c => c.id === t.pin)){ pool = crews; plan.warnings.push({ level:'info', text:`Pripeto vozilo za prevoz ${t.rides.map(r => r.nr).join(', ')} ni na voljo; izbrano je drugo vozilo.` }); }
    const stages = (level === 1 || t.force || t.lvl) ? [0, 1] : [0];
    let best = null, capOk = false, shiftBlocked = false;
    for (const st of stages){
      for (const c of pool){
        if (!fits(t.counts, c.vehicle, st)) continue;
        capOk = true;
        const d = leg(c.pos, t.first), arrive = c.free + d.min;
        const latest = st ? t.latestB : t.latestS;
        let start = arrive, late = 0;
        if (t.kind === 'to' && latest != null){ start = Math.max(arrive, latest); late = Math.max(0, arrive - latest); }
        else if (t.kind === 'from' && t.ref != null){ start = Math.max(arrive, t.ref); late = Math.max(0, arrive - t.ref - cfgS.waitTol); }
        const endAbs = start + t.ev.dur + leg(t.last, baseG).min;
        if (c.end != null){ const okOt = Math.max(c.ot, st ? (S.rules.overtimeMax || 0) : 0); if (endAbs > c.end + okOt){ shiftBlocked = true; continue; } }
        const idle = start - arrive;
        let cost = late * 20 + d.min + idle * 0.05 + c.trips.length * 0.5 + (st ? 25 : 0);
        if (t.sbReturn){ if (c.team === 'NN') cost -= 20; else if (hasNN) cost += 15; }
        if (!best || cost < best.cost) best = { c, d, arrive, start, late, cost, st, latest };
      }
    }
    if (!best){
      if (t.rides.length > 1){
        t.rides.forEach(r => { const a = r.kind === 'from' ? r.from : r.to; const nt = { id:uid(), kind:r.kind, anchor:a, rides:[r], ev:evalTrip(r.kind,[r],a,cfgS,leg), pin:r.pin, lvl:r.force ? 1 : 0 }; prep(nt); queue.push(nt); });
        queue.sort((a,b) => (a.need ?? 1e6) - (b.need ?? 1e6));
      } else {
        const r = t.rides[0];
        const why = !crews.length ? 'ni posadke z vozilom'
          : !capOk ? `nobeno razpoložljivo vozilo ne sprejme načina prevoza (${MODES[r.mode] || r.mode})`
          : shiftBlocked ? 'izmena posadke se konča prej (vpiši nadure pri zaposlenem ali dovoli prilagoditev pravil)' : 'ni primerne posadke';
        plan.unassigned.push({ ride:r, reason:why });
      }
      continue;
    }
    const { c, d, start, late } = best;
    const trip = { id:t.id, kind:t.kind, rides:t.ev.order, ev:t.ev, anchor:t.anchor, start, depart:start - d.min, deadKm:d.km, from:c.pos, late:Math.round(late), counts:t.counts, ref:t.ref, sbReturn:t.sbReturn, pin:t.pin,
      wait: t.kind === 'from' && t.ref != null ? Math.max(0, Math.round(best.arrive - t.ref)) : 0, stage:best.st, forced:t.force,
      latestDepart: best.latest != null ? best.latest - d.min : null, shiftLimited: t.kind === 'to' && best.latest != null && c.trips.length === 0 && late > 0 };
    trip.end = start + t.ev.dur;
    c.trips.push(trip); c.free = trip.end; c.pos = t.last; c.km += d.km + t.ev.km; c.busy += d.min + t.ev.dur;
  }

  // 6) izhod: časi postankov, skupne vrednosti
  for (const c of crews){
    c.trips.sort((a,b) => a.start - b.start);
    const back = leg(c.pos, baseG); if (c.trips.length) c.km += back.km;
    c.rideNrs = [];
    for (const t of c.trips){
      t.stopsAbs = t.ev.stops.map(s => {
        const o = { ...s, t: t.start + s.off };
        const ids = s.rideIds || [s.rideId]; o.people = ids.map(id => t.rides.find(r => r.id === id));
        return o;
      });
      t.arrive = t.kind === 'to' ? t.start + t.ev.arr : null;
      t.slack = t.kind === 'to' && t.ref != null ? Math.round(t.ref - t.arrive) : null;
      t.rides.forEach((r, i) => {
        c.rideNrs.push(r.nr);
        const pu = t.stopsAbs.find(s => s.type === 'pu' && (s.rideId === r.id || (s.rideIds && s.rideIds.includes(r.id))));
        plan.assign[r.id] = { crewId:c.id, veh:c.vehicle.name, t:pu ? pu.t : t.start, order:i+1, trip:t.id, late:t.late, rideMin:Math.round(t.ev.rideMin[r.id] || 0) };
      });
      if (t.late > 0){
        const nrs = t.rides.map(r => r.nr).join(', ');
        const txt = t.shiftLimited ? `${c.vehicle.name}: za pravočasen prihod (prevoz ${nrs}) bi moral voznik štartati ob ${fmtT(t.latestDepart)}, izmena pa se začne ob ${fmtT(c.shift)}. Nastavi zgodnejši začetek izmene.`
          : t.kind === 'from' ? `${c.vehicle.name}: pri odvozu ${nrs} bo pacient čakal približno ${t.wait} min.`
          : `${c.vehicle.name}: prevoz ${nrs} bo zamudil približno ${t.late} min. Dodaj vozilo ali prerazporedi.`;
        plan.warnings.push({ level:'bad', text:txt });
      }
      plan.totals.late += t.late > 0 ? t.rides.length : 0;
    }
    c.rideNrs.sort((a,b) => a - b);
    c.firstDepart = c.trips.length ? Math.min(...c.trips.map(t => t.depart)) : null;
    c.endAbs = c.trips.length ? c.trips[c.trips.length-1].end + back.min : null;
    c.overtime = c.end != null && c.endAbs != null ? Math.max(0, Math.round(c.endAbs - c.end)) : 0;
    if (c.trips.length && c.firstDepart < c.shift - 1) plan.warnings.push({ level:'warn', text:`${c.vehicle.name}: štart ob ${fmtT(c.firstDepart)} je pred začetkom izmene (${fmtT(c.shift)}).` });
    plan.totals.km += c.km; plan.totals.min += c.busy; if (c.trips.length) plan.totals.vehicles++;
  }
  plan.crews = crews;
  plan.unassigned.forEach(u => plan.warnings.push({ level:'bad', nr:u.ride.nr, text:`Prevoz ${u.ride.nr} (${u.ride.name}) ni razporejen: ${u.reason}.` }));

  // 7) prilagoditve pravil: vsaka, ki je bila uporabljena, je izpisana
  for (const c of crews){
    for (const t of c.trips){
      const nrs = t.rides.map(r => r.nr).join(', '), n = t.rides.length, std = capOf(c.vehicle, 0), mx = capOf(c.vehicle, 1);
      if (!fits(t.counts, c.vehicle, 0)) plan.bends.push({ k:'kap', text:`${c.vehicle.name}: ${n} pacientov v vozilu (običajno do ${std.skupaj}, izjemoma do ${mx.skupaj}). Prevozi ${nrs}.` });
      const over = t.rides.filter(r => (t.ev.rideMin[r.id] || 0) > cfgS.maxRide);
      if (over.length) plan.bends.push({ k:'voznja', text:`${c.vehicle.name}: pot v vozilu je daljša od običajnih ${cfgS.maxRide} min (prevoz ${over.map(r => r.nr).join(', ')}).` });
      const ts = t.rides.map(r => r.time).filter(x => x != null);
      if (ts.length > 1 && Math.max(...ts) - Math.min(...ts) > cfgS.window) plan.bends.push({ k:'okno', text:`${c.vehicle.name}: ure pacientov se razlikujejo za več kot običajnih ${cfgS.window} min (prevozi ${nrs}).` });
      if (t.kind === 'to' && t.slack != null && t.slack >= 0 && t.slack < cfgS.buffer) plan.bends.push({ k:'rezerva', text:`${c.vehicle.name}: rezerva pred preiskavo je ${t.slack} min (običajno ${cfgS.buffer} min). Prevozi ${nrs}.` });
    }
    if (c.overtime > 0) plan.bends.push({ k:'nadure', text:`${c.driver.name}: nadure približno ${c.overtime} min (izmena se običajno konča ob ${fmtT(c.end)}).` });
  }
  plan.rides = rides;
  rides.filter(r => r.force && plan.assign[r.id]).forEach(r => plan.bends.push({ k:'rocno', text:`Prevoz ${r.nr} (${r.name}): ročna izjema ali pripeto vozilo.` }));
  plan.bends.forEach(b => plan.warnings.push({ level:'bend', text:b.text }));
  return plan;
}
function BASE_POINT_G(){ return { key:'poi:'+BASE_POI.n, lat:BASE_POINT.lat, lon:BASE_POINT.lon, kind:'poi', label:BASE_POI.n }; }

/* ---------- Knjiga: samodejni vpis posadk v mesečni pregled ---------- */
const shortName = n => n;
function crewLabel(c){ return [c.driver.name, ...c.escorts.map(e => e.name + ' (sp.)')].join(', '); }
function writeBook(date){
  const duty = S.duty[date] || [];
  const book = S.crewBook[date] || (S.crewBook[date] = {});
  const pr = computePlan(date).pairing;
  const auto = {};
  pr.crews.forEach(c => { auto[c.id] = crewLabel(c); });
  const ost = S.vehicles.find(v => v.tip === 'ostalo');
  if (ost){ const names = [...pr.unpaired.map(d => d.name), ...pr.looseEsc.map(d => d.name)]; if (names.length) auto[ost.id] = names.join(', '); }
  for (const v of S.vehicles){
    const cell = book[v.id] || (book[v.id] = { text:'', manual:false });
    if (cell.manual) continue;
    cell.text = auto[v.id] || '';
  }
  if (!duty.length && !Object.values(book).some(c => c.text || c.manual)) delete S.crewBook[date];
  queueFlush();
}

/* ---------- Opozorila v knjigi ---------- */
function dayWarnings(date){
  const out = []; const rides = filledRides(date);
  const names = {};
  const avail = availableVehicles(date);
  rides.forEach(({ r, nr }) => {
    if (!r.name.trim()) out.push({ nr, text:`Polje ${nr}: manjka ime in priimek.` });
    if (!r.time) out.push({ nr, text:`Polje ${nr}: manjka ura preiskave.` });
    if (!r.from.trim() || !r.to.trim()) out.push({ nr, text:`Polje ${nr}: manjka naslov ${!r.from.trim() ? 'od' : 'do'}.` });
    else { const g = geo(r.from); if (g.kind === 'neznano') out.push({ nr, text:`Polje ${nr}: naslova »${r.from}« ni v Občini Brežice. Razdalja bo ocenjena iz centra Brežic.` }); }
    if (!r.phone.trim() && !r.done) out.push({ nr, text:`Polje ${nr}: manjka telefonska številka.` });
    const pt = r.patientId ? patientById(r.patientId) : null;
    if (pt && !r.done){
      const nl = (r.nalogId && (pt.naloge || []).find(x => x.id === r.nalogId)) || activeNalog(pt, date);
      if (!nl) out.push({ nr, text:`Polje ${nr}: pacient ${pt.name} nima veljavnega naloga za ta dan.` });
      else { const s2 = nalogState(nl, date); if (s2.st === 'potekel') out.push({ nr, text:`Polje ${nr}: nalog za prevoz je potekel (${fmtDMY(nl.veljaDo)}).` }); else if (s2.st === 'prihodnji') out.push({ nr, text:`Polje ${nr}: nalog še ne velja (${s2.label}).` }); else if (s2.st === 'kmalu') out.push({ nr, text:`Polje ${nr}: nalog za prevoz ${s2.label} (${fmtDMY(nl.veljaDo)}). Pripravi novega.` }); else if (s2.st === 'nepopoln') out.push({ nr, text:`Polje ${nr}: nalog je nepopoln.` }); }
    }
    const k = norm(r.name) + '|' + (r.dia ? r.diaKey : r.time) + '|' + rideDir(r);
    if (r.name.trim()){ (names[k] = names[k] || []).push(nr); }
    if (avail.length && r.mode === 'leze' && !avail.some(v => v.leze > 0)) out.push({ nr, text:`Polje ${nr}: pacient leže, razpoložljivo vozilo pa nima nosil.` });
  });
  Object.values(names).filter(a => a.length > 1).forEach(a => out.push({ nr:a[0], text:`Polja ${a.join(' in ')}: ista oseba z isto uro (morebitni dvojni vpis).` }));
  return out;
}

/* ---------- Besedilo razporeda (za kopiranje v Viber/SMS) ---------- */
function planText(date){
  const p = computePlan(date);
  const lines = [`RAZPORED PREVOZOV · ${fmtLong(date)}`];
  const nd = S.dayNote[date]; if (nd) lines.push(`Opomba dneva: ${nd}`);
  if (!p.crews.length) lines.push('Ni posadk z vozilom.');
  p.crews.forEach(c => {
    lines.push('', `${c.vehicle.name} · ${crewLabel(c)}`);
    if (!c.trips.length){ lines.push('  (brez prevozov)'); return; }
    lines.push(`  Štart iz postaje: ${fmtT(c.firstDepart)} · prevozi št. ${c.rideNrs.join(', ')}`);
    c.trips.forEach(t => {
      t.stopsAbs.forEach(s => {
        const who = (s.people || []).filter(Boolean).map(r => r.name).join(', ');
        const where = s.type === 'do' && t.kind === 'to' ? (t.anchor.label || t.anchor.poi?.n || '') : (s.pt.label || '');
        const lbl = s.type === 'pu' ? 'pobere' : 'odpelje';
        lines.push(`  ${fmtT(s.t)} ${lbl}: ${who} (${where})`);
      });
    });
  });
  if (p.bends.length) lines.push('', 'PRILAGOJENA PRAVILA:', ...p.bends.map(b => '  ' + b.text));
  if (p.unassigned.length) lines.push('', 'NEZARAZPOREJENO: ' + p.unassigned.map(u => `št. ${u.ride.nr} ${u.ride.name}`).join('; '));
  return lines.join('\n');
}

/* =====================================================================
   PACIENTI IN NALOGI ZA PREVOZ
   Baza pacientov (shranjena enkrat, nato se izbere), nalogi: letni, mesečni, enkratni, za čas zdravljenja.
   Veljavnost se računa samodejno, en mesec pred iztekom se prikaže opozorilo.
   Privzete veljavnosti so predlog: pri vsakem nalogu preveri datum na papirnatem/elektronskem nalogu.
   ===================================================================== */
const blankPatient = (extra = {}) => ({ id:uid(), name:'', addr:'', phone:'', mode:'sede', dia:'', color:-1, zzzs:'', note:'', naloge:[], demo:false, created:new Date().toISOString(), ...extra });
const blankNalog = (vrsta = 'letna', from = todayStr()) => ({ id:uid(), vrsta, stevilka:'', narocnik:'', izvajalec:'Reševalna postaja Brežice (ZD Brežice)', zdravnik:'', zdravnikVrsta:'osebni', razlog:'', od:'', do:'', mode:'sede',
  veljaOd:from, veljaDo:defaultValidTo(vrsta, from), dnevi:'', opombe:'', preklican:false, porabljen:'', auto:true, created:new Date().toISOString() });
const patientById = id => S.patients.find(p => p.id === id) || null;
const fmtDMY = s => { if (!s) return '–'; const d = parseYmd(s); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
function endOfMonthStr(s){ const d = parseYmd(s); return ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }
function defaultValidTo(vrsta, from){
  if (!from) return '';
  if (vrsta === 'letna'){ const d = parseYmd(from); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return ymd(d); }
  if (vrsta === 'mesecna') return endOfMonthStr(from);
  if (vrsta === 'enkratna') return from;
  return addDays(from, 27);   // za čas zdravljenja: predlog 4 tedni, vpiši po nalogu
}

/* ---------- Stanje naloga ---------- */
function nalogState(n, onDate = todayStr()){
  /* Letni nalog: opozorilo 30 dni vnaprej (nastavljivo). Mesečni in za čas zdravljenja: krajše okno (7 dni), sicer bi bil opozorjen ves mesec. Enkratni: samo na dan veljavnosti. */
  const warnDays = n.vrsta === 'letna' ? (S.rules.opozoriloDni ?? 30) : n.vrsta === 'enkratna' ? 0 : (S.rules.opozoriloKratki ?? 7);
  if (n.preklican) return { st:'preklican', tone:'', label:'preklican', days:null };
  if (n.vrsta === 'enkratna' && n.porabljen) return { st:'porabljen', tone:'', label:'porabljen ' + fmtDMY(n.porabljen), days:null };
  if (!n.veljaOd || !n.veljaDo) return { st:'nepopoln', tone:'warn', label:'datum veljavnosti manjka', days:null };
  if (onDate < n.veljaOd) return { st:'prihodnji', tone:'info', label:'velja od ' + fmtDMY(n.veljaOd), days:daysBetween(onDate, n.veljaOd) };
  const left = daysBetween(onDate, n.veljaDo);
  if (left < 0) return { st:'potekel', tone:'bad', label:`potekel ${fmtDMY(n.veljaDo)}`, days:left };
  if (left <= warnDays) return { st:'kmalu', tone:'warn', label: left === 0 ? 'poteče danes' : left === 1 ? 'poteče jutri' : `poteče čez ${left} dni`, days:left };
  return { st:'ok', tone:'ok', label:`velja do ${fmtDMY(n.veljaDo)}`, days:left };
}
/* Nalog, ki velja na dani dan (če jih je več, prednost: najkasneje potečejo ne; najprej tisti, ki je bolj specifičen) */
function activeNalog(p, date = todayStr()){
  if (!p) return null;
  const rank = { enkratna:0, zdravljenje:1, mesecna:2, letna:3 };
  const list = (p.naloge || []).filter(n => !n.preklican && !(n.vrsta === 'enkratna' && n.porabljen) && n.veljaOd <= date && n.veljaDo >= date);
  list.sort((a, b) => (rank[a.vrsta] - rank[b.vrsta]) || a.veljaDo.localeCompare(b.veljaDo));
  return list[0] || null;
}
/* Ali je nalog podaljšan z novejšim nalogom? Potem opozorilo ni potrebno. */
function renewed(p, n){
  return (p.naloge || []).some(m => m.id !== n.id && !m.preklican && m.veljaOd <= addDays(n.veljaDo, 1) && m.veljaDo > n.veljaDo);
}
/* Povzetek za seznam pacientov: najpomembnejše stanje na dan */
function patientNalogSummary(p, date = todayStr()){
  const nl = p.naloge || [];
  if (!nl.length) return { st:'brez', tone:'', label:'brez naloga', n:null };
  const act = activeNalog(p, date);
  if (act){ const s = nalogState(act, date); if (s.st === 'kmalu' && renewed(p, act)) return { ...nalogState({ ...act, veljaDo:act.veljaDo }, date), st:'ok', tone:'ok', label:'podaljšan do ' + fmtDMY(nl.filter(m => !m.preklican).reduce((x, m) => m.veljaDo > x ? m.veljaDo : x, act.veljaDo)), n:act }; return { ...s, n:act }; }
  const fut = nl.filter(n => !n.preklican && n.veljaOd > date).sort((a, b) => a.veljaOd.localeCompare(b.veljaOd))[0];
  if (fut) return { ...nalogState(fut, date), n:fut };
  const last = nl.filter(n => !n.preklican).sort((a, b) => b.veljaDo.localeCompare(a.veljaDo))[0];
  if (last) return { ...nalogState(last, date), n:last };
  return { st:'brez', tone:'', label:'brez veljavnega naloga', n:null };
}
/* Opozorila za nadzorno ploščo: vsi pacienti, ki jim nalog kmalu poteče ali je potekel */
let ALERT_CACHE = { rev:-1, day:'', list:[] };
function nalogAlerts(){
  const today = todayStr();
  if (ALERT_CACHE.rev === rev && ALERT_CACHE.day === today) return ALERT_CACHE.list;
  const list = [];
  S.patients.forEach(p => {
    (p.naloge || []).forEach(n => {
      if (n.preklican || (n.vrsta === 'enkratna' && n.porabljen)) return;
      const s = nalogState(n, today);
      if (s.st !== 'kmalu' && s.st !== 'potekel') return;
      if (n.vrsta === 'enkratna') return;   // enkratni nalog se ne spremlja kot potek
      if (renewed(p, n)) return;
      // potekel: samo če je potekel v zadnjih 60 dneh in pacient nima drugega veljavnega naloga
      if (s.st === 'potekel' && (s.days < -60 || activeNalog(p, today))) return;
      list.push({ p, n, s });
    });
  });
  list.sort((a, b) => (a.s.days ?? 0) - (b.s.days ?? 0));
  ALERT_CACHE = { rev, day:today, list };
  return list;
}
function nalogChip(n, date){
  if (!n) return '<span class="chip">brez naloga</span>';
  const s = nalogState(n, date || todayStr());
  const icon = s.tone === 'bad' ? '⚠ ' : s.tone === 'warn' ? '⏳ ' : '';
  return `<span class="chip ${s.tone}" title="${esc(NALOG_VRSTE[n.vrsta].l)} nalog ${esc(n.stevilka || '')}">${icon}${esc(NALOG_VRSTE[n.vrsta].l)} · ${esc(s.label)}</span>`;
}

/* ---------- Barve pacientov ---------- */
function nextColor(){
  const use = Array(PCOLORS).fill(0); S.patients.forEach(p => { if (p.color >= 0 && p.color < PCOLORS) use[p.color]++; });
  return use.indexOf(Math.min(...use));
}
const pcOf = pid => { const p = patientById(pid); return p && p.color >= 0 ? p.color : -1; };
const pcClass = pid => { const c = pcOf(pid); return c >= 0 ? `pc${c}` : ''; };
const avatarP = p => `<span class="pav ${p.color >= 0 ? 'pc' + p.color : ''}" aria-hidden="true">${esc(initials(p.name).replace(/\./g, '').slice(0, 2) || '?')}</span>`;

/* ---------- Preverjanje in predogled za kopiranje ---------- */
const NALOG_REQ = [['stevilka', 'številka naloga'], ['narocnik', 'naročnik'], ['izvajalec', 'izvajalec prevoza'], ['zdravnik', 'zdravnik'], ['razlog', 'razlog prevoza'], ['od', 'relacija: od'], ['do', 'relacija: do'], ['veljaOd', 'velja od'], ['veljaDo', 'velja do']];
const missingNalog = n => NALOG_REQ.filter(([k]) => !String(n[k] || '').trim()).map(x => x[1]);
function nalogVariants(p, n){
  const s = nalogState(n);
  const v = NALOG_VRSTE[n.vrsta].l;
  const full = [
    `NALOG ZA PREVOZ · ${v.toUpperCase()}`,
    `Številka naloga: ${n.stevilka || '–'}`,
    `Pacient: ${p.name}${p.addr ? ' · ' + p.addr : ''}${p.phone ? ' · tel. ' + p.phone : ''}${p.zzzs ? ' · št. zavarovane osebe ' + p.zzzs : ''}`,
    `Naročnik: ${n.narocnik || '–'}`,
    `Izvajalec prevoza: ${n.izvajalec || '–'}`,
    `Zdravnik: ${n.zdravnik || '–'}${n.zdravnikVrsta ? ' (' + n.zdravnikVrsta + ')' : ''}`,
    `Razlog prevoza: ${n.razlog || '–'}`,
    `Relacija: ${n.od || '–'} → ${n.do || '–'}${n.dnevi ? ' · ' + n.dnevi : ''}`,
    `Način prevoza: ${MODES[n.mode] || n.mode}`,
    `Veljavnost: ${fmtDMY(n.veljaOd)} – ${fmtDMY(n.veljaDo)} (${s.label})`,
    n.opombe ? `Opombe: ${n.opombe}` : ''
  ].filter(Boolean).join('\n');
  const short = `${p.name} · ${v} nalog št. ${n.stevilka || '–'} · ${n.od || '–'} → ${n.do || '–'} · ${MODES[n.mode] || n.mode} · velja do ${fmtDMY(n.veljaDo)}`;
  const book = `${p.name}; ${n.od || ''} → ${n.do || ''}; ${MODES[n.mode] || n.mode}; ${p.phone || ''}; nalog ${n.stevilka || ''} (${v}, do ${fmtDMY(n.veljaDo)})`;
  return [{ key:'full', label:'Celoten nalog', text:full }, { key:'short', label:'Kratko (Viber / SMS)', text:short }, { key:'book', label:'Vrstica za knjigo', text:book }];
}
function rideVariants(date, r, nr){
  const p = patientById(r.patientId), n = p ? (p.naloge || []).find(x => x.id === r.nalogId) : null;
  const dir = rideDir(r) === 'from' ? 'ODVOZ' : 'PREVOZ TJA';
  const full = [
    `${dir} št. ${nr} · ${fmtLong(date)}`,
    `Pacient: ${r.name || '–'}${r.phone ? ' · tel. ' + r.phone : ''}`,
    `Ura: ${r.time || '–'}`,
    `Od: ${r.from || '–'}`,
    `Do: ${r.to || '–'}`,
    `Način prevoza: ${MODES[r.mode] || r.mode}${r.dia ? ' · dializa ' + r.dia : ''}`,
    n ? `Nalog: ${NALOG_VRSTE[n.vrsta].l}, št. ${n.stevilka || '–'}, velja do ${fmtDMY(n.veljaDo)}` : '',
    r.note ? `Opomba: ${r.note}` : ''
  ].filter(Boolean).join('\n');
  const short = `${r.time || ''} ${r.name || ''}: ${r.from || ''} → ${r.to || ''} (${MODES[r.mode] || r.mode})${r.phone ? ', ' + r.phone : ''}`.trim();
  return [{ key:'full', label:'Celoten prevoz', text:full }, { key:'short', label:'Kratko (Viber / SMS)', text:short }];
}

/* ---------- Povezava pacienta in prevoza ---------- */
function applyPatientToRide(date, rideId, pid, opts = {}){
  const hit = rideById(date, rideId), p = patientById(pid); if (!hit || !p) return false;
  const r = hit.r, nl = activeNalog(p, date);
  r.patientId = p.id; r.name = p.name;
  if (!r.phone || opts.overwrite) r.phone = p.phone;
  if (!opts.keepMode) r.mode = nl ? nl.mode || p.mode : p.mode;
  if (p.dia && !r.dia) r.dia = p.dia;
  r.nalogId = nl ? nl.id : '';
  const homeFrom = nl && nl.od && !/^SB |UKC|ZD /i.test(nl.od) ? nl.od : p.addr;
  if (!r.from.trim()) r.from = homeFrom || p.addr;
  if (!r.to.trim()) r.to = nl && nl.do ? nl.do : '';
  save(); return true;
}
function patientSuggestions(raw){
  const q = norm(raw); if (q.length < 2) return [];
  const today = todayStr();
  return S.patients.filter(p => norm([p.name, p.phone, p.addr].join(' ')).includes(q))
    .sort((a, b) => (norm(a.name).startsWith(q) ? 0 : 1) - (norm(b.name).startsWith(q) ? 0 : 1) || a.name.localeCompare(b.name)).slice(0, 6)
    .map(p => { const s = patientNalogSummary(p, today); return { label:p.name, sub:`${p.addr || 'brez naslova'} · ${s.n ? NALOG_VRSTE[s.n.vrsta].l + ' nalog, ' + s.label : 'brez naloga'}`, ins:p.name, pid:p.id, score:norm(p.name).startsWith(q) ? 0 : 1 }; });
}
function savePatientFromRide(date, rideId){
  const hit = rideById(date, rideId); if (!hit) return null;
  const r = hit.r; if (!r.name.trim()) return null;
  let p = S.patients.find(x => norm(x.name) === norm(r.name));
  if (!p){ p = blankPatient({ name:r.name.trim(), addr:rideDir(r) === 'from' ? r.to : r.from, phone:r.phone, mode:r.mode, dia:r.dia || '', color:nextColor() }); S.patients.push(p); audit('pacient.dodan', { id:p.id, kdo:initials(p.name) }); }
  r.patientId = p.id; save(); return p;
}
function removePatient(id){
  const p = patientById(id); if (!p) return;
  S.patients = S.patients.filter(x => x.id !== id);
  Object.values(S.rides).forEach(a => a.forEach(r => { if (r.patientId === id){ r.patientId = ''; r.nalogId = ''; } }));
  audit('pacient.izbrisan', { id, kdo:initials(p.name) }); save();
}
const lastOpened = {};
function logPatientOpen(id){ const t = Date.now(); if (lastOpened[id] && t - lastOpened[id] < 300000) return; lastOpened[id] = t; const p = patientById(id); audit('pacient.ogled', { id, kdo:p ? initials(p.name) : '' }); }

/* =====================================================================
   ZASLONI
   ===================================================================== */
const UI = { view:'knjiga', month:null, date:null, dDate:null, lDate:null, cDate:null, filter:'vsi', q:'', setTab:'vozila', bookRev:'', pid:'', nid:'', pf:'vsi', pq:'', modal:null, stale:false, selfTest:null };
const IC = {
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M9 8h6M9 12h6"/></svg>',
  day:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  kidney:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C8 3 5 6 5 10s2 5 2 8a3 3 0 0 0 6 0c0-2 4-3 4-8a7 7 0 0 0-5-7z"/></svg>'
};
const SV = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
Object.assign(IC, {
  pulse:SV('<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>'),
  users:SV('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.5-3.4 2.6-5 5.5-5s5 1.6 5.5 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.7.6 2.6 2.2 2.9 4.7"/>'),
  shield:SV('<path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  phone:SV('<path d="M5 4h3.5l1.7 4.2-2.2 1.4a11 11 0 0 0 5.4 5.4l1.4-2.2L19 14.5V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  pin:SV('<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  eye:SV('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  send:SV('<path d="M21 3 10 14M21 3l-6.5 18-3.5-7-7-3.5z"/>'),
  check:SV('<path d="m5 12.5 4.2 4.2L19 7"/>')
});
const NAV_ALL = [
  { id:'knjiga', label:'Knjiga', short:'Knjiga', ic:'book' },
  { id:'dan', label:'Dan', short:'Dan', ic:'day' },
  { id:'dispecer', label:'Dispečer', short:'Razpored', ic:'route' },
  { id:'zivo', label:'Živo', short:'Živo', ic:'pulse' },
  { id:'pacienti', label:'Pacienti', short:'Pacienti', ic:'users' },
  { id:'posebnosti', label:'Posebnosti', short:'Okvare', ic:'alert' },
  { id:'nastavitve', label:'Nastavitve', short:'Nastav.', ic:'gear' }
];
const TITLES = {
  knjiga:['Knjiga prevozov', 'Mesečni pregled. Pod vsakim dnevom so vozila in zaposleni.'],
  dan:['Dnevna knjiga', ''],
  dispecer:['Dispečer', 'Zaposleni in vozila vpišeš ti. Razpored in vrstni red izračuna aplikacija.'],
  zivo:['Živo stanje', 'Posadke sporočajo korake prevoza. Tukaj vidiš status in čase.'],
  pacienti:['Pacienti in nalogi', 'Baza pacientov z nalogi za prevoz. Opozorilo: letni nalog 30 dni, mesečni 7 dni pred iztekom.'],
  posebnosti:['Posebnosti', 'Okvare vozil, servisi in drugo, kar vpliva na razpored.'],
  nastavitve:['Nastavitve', 'Vozila, zaposleni, pravila, dializa, uporabniki, varnost in podatki.'],
  moji:['Moji prevozi', '']
};

/* ---------- Logotipi: datoteka iz mape logos/, ali naložen v Nastavitve → Logotipi; sicer samo besedilo ---------- */
const LOGOS = { zd:{ label:'ZD Brežice', file:'logos/zd-brezice.png' }, nmp:{ label:'NMP', file:'logos/nmp.png' } };
const logoSrc = k => store.get('kp.logo.' + k) || (BACKEND === 'firebase' || location.protocol.startsWith('http') && !/claude|sandbox/.test(location.host) ? LOGOS[k].file : '');
const logoItem = k => { const src = logoSrc(k), l = LOGOS[k]; return `<span class="logoitem" data-logo="${k}">${src ? `<img src="${esc(src)}" alt="${esc(l.label)}" height="30">` : ''}<span class="lf" ${src ? 'hidden' : ''}>${esc(l.label)}</span></span>`; };
const logoBar = cls => `<div class="logobar ${cls || ''}">${logoItem('zd')}<i></i>${logoItem('nmp')}</div>`;
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.logoitem')){ t.hidden = true; const f = t.nextElementSibling; if (f) f.hidden = false; } }, true);

const navItems = () => (ME && isCrew()) ? [] : NAV_ALL;
function renderNav(){
  const liveN = isStaffRole() ? Object.entries(liveSummary(todayStr())).filter(([k]) => ['odklonjena', 'ni_doma'].includes(k)).reduce((n, [, v]) => n + v, 0) : 0;
  const alerts = isStaffRole() ? nalogAlerts().length : 0;
  const late = isStaffRole() && computePlan(addDays(todayStr(), 1)).totals.late;
  const badge = id => id === 'dispecer' && late ? '<span class="count">!</span>' : id === 'zivo' && liveN ? `<span class="count">${liveN}</span>` : id === 'pacienti' && alerts ? `<span class="count">${alerts}</span>` : '';
  $('#nav').innerHTML = navItems().map(n => `<button type="button" data-nav="${n.id}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${IC[n.ic]}<span>${n.label}</span>${badge(n.id)}</button>`).join('');
  $('#tabbar').innerHTML = navItems().map(n => `<button type="button" data-nav="${n.id}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${IC[n.ic]}<span>${n.short}</span>${badge(n.id) ? '<i class="dotbadge"></i>' : ''}</button>`).join('');
}
function setHeader(){
  const [t, s] = TITLES[UI.view] || TITLES.knjiga;
  $('#pageTitle').textContent = UI.view === 'dan' ? fmtLong(UI.date) : t;
  let sub = s;
  if (UI.view === 'dan'){ const h = holiday(UI.date); sub = `${h ? 'Praznik: ' + h + '. ' : ''}${isStandby(UI.date) ? 'Vikend/praznik: pripravljenost.' : 'Delovni dan.'}`; }
  $('#pageSub').textContent = sub;
  $('#topActions').innerHTML = `<span class="savepill" id="savepill"><i></i> Shranjeno</span>`;
}
const demoBanner = () => hasDemo() ? `<div class="banner"><span>${IC.info}</span><div><b>Prikazani so primeri.</b> Pacienti in zaposleni so izmišljeni. Odstrani jih v Nastavitve → Podatki, ko začneš z resničnimi vpisi.</div></div>` : '';
const hasDemo = () => Object.values(S.rides).some(a => a.some(r => r.demo)) || S.staff.some(s => s.demo) || S.patients.some(p => p.demo);

/* ---------- Mesečna knjiga ---------- */
function renderMonth(){
  const { y, m } = UI.month, n = daysInMonth(y, m), today = todayStr();
  let tr = 0, td = 0, dd = 0; const cards = [];
  for (let d = 1; d <= n; d++){
    const date = `${y}-${pad(m+1)}-${pad(d)}`;
    const filled = (S.rides[date] || []).filter(isFilled), done = filled.filter(r => r.done).length;
    tr += filled.length; td += done; if (filled.length) dd++;
    const hol = holiday(date), wk = isStandby(date), groups = diaGroupsFor(date, S);
    const book = S.crewBook[date] || {};
    const rows = S.vehicles.filter(v => v.aktiv).map(v => {
      const c = book[v.id] || { text:'', manual:false };
      return `<div class="crew-row"><label title="${esc(v.name)}">${esc(v.name)}</label><input type="text" data-crew="${date}|${v.id}" class="${c.text && !c.manual ? 'auto' : ''}" value="${esc(c.text)}" placeholder="zaposleni" aria-label="${esc(v.name)}, ${fmtShort(date)}"></div>`;
    }).join('');
    cards.push(`<article class="day ${date === today ? 'today' : ''} ${wk ? 'wk' : ''} ${date < today ? 'past' : ''}">
      <button type="button" class="day-head" data-act="openDay" data-date="${date}">
        <span class="dnum tnum">${pad(d)}</span>
        <span class="dtxt"><span class="dname">${DOW_LONG[dow(date)]}</span>
          <span class="dmeta">${date === today ? '<span class="chip accent">danes</span>' : ''}${hol ? `<span class="chip warn" title="${esc(hol)}">praznik</span>` : ''}${wk ? '<span class="chip info">pripravljenost</span>' : ''}${groups.map(g => `<span class="chip mono" title="Dializa">${g}</span>`).join('')}</span></span>
        <span class="dcount"><b>${filled.length}</b>${filled.length ? `${done}/${filled.length} ✓` : 'prevozov'}</span>
      </button>
      <div class="crew"><h4>Službena vozila · zaposleni</h4>${rows}</div></article>`);
  }
  $('#view').innerHTML = `
    ${demoBanner()}${alertsBanner()}
    <div class="monthbar">
      <button type="button" class="btn" data-act="monthPrev" aria-label="Prejšnji mesec">${IC.left}</button>
      <h2>${MONTHS[m]} ${y}</h2>
      <button type="button" class="btn" data-act="monthNext" aria-label="Naslednji mesec">${IC.right}</button>
      <button type="button" class="btn" data-act="monthToday">Danes</button>
      <div class="stats" style="margin-left:auto">
        <div class="stat"><b>${tr}</b><span>prevozov v mesecu</span></div>
        <div class="stat"><b>${td}</b><span>opravljenih</span></div>
        <div class="stat"><b>${dd}</b><span>dni z vpisi</span></div>
      </div>
    </div>
    <div class="days">${cards.join('')}</div>`;
}

/* ---------- Dnevna knjiga (35 polj) ---------- */
function modeSeg(mode){
  return `<div class="seg" role="group" aria-label="Način prevoza">${Object.entries(MODES).map(([k, v]) => `<button type="button" data-mode="${k}" data-act="mode" aria-pressed="${mode === k}">${v}</button>`).join('')}</div>`;
}
function pinfoHTML(date, r){
  const p = r.patientId ? patientById(r.patientId) : null;
  if (p){
    const opts = (p.naloge || []).filter(n => !n.preklican).map(n => `<option value="${n.id}" ${r.nalogId === n.id ? 'selected' : ''}>${esc(NALOG_VRSTE[n.vrsta].l)} ${esc(n.stevilka || '')} (${fmtDMY(n.veljaOd)}–${fmtDMY(n.veljaDo)})</option>`).join('');
    const sel = (p.naloge || []).find(n => n.id === r.nalogId);
    const chip = sel ? nalogChip(sel, date) : (activeNalog(p, date) ? '' : '<span class="chip bad">ni veljavnega naloga</span>');
    return `<div class="pinfo">${avatarP(p)}<div class="pinfo-main"><div class="row" style="gap:6px"><select data-f="nalogId" aria-label="Nalog za prevoz"><option value="">Nalog: ni izbran</option>${opts}</select>${chip}</div></div>
      <button type="button" class="icon-btn" data-act="openPatient" data-id="${p.id}" title="Odpri pacienta" aria-label="Odpri pacienta">${IC.users}</button></div>`;
  }
  if ((r.name || '').trim()) return `<div class="pinfo none"><span class="hint">Pacient ni v bazi.</span><button type="button" class="btn sm" data-act="savePat">${IC.plus} Shrani v bazo</button></div>`;
  return '';
}
function boxHTML(date, r, nr, plan){
  const filled = isFilled(r), dir = filled ? rideDir(r) : '';
  const a = plan.assign[r.id];
  const g = r.from.trim() ? geo(r.from) : null;
  const pc = pcClass(r.patientId);
  const showSt = r.status && r.status !== 'nova';
  return `<article class="box ${pc} ${filled ? '' : 'empty'} ${r.done ? 'done' : ''}" data-ride="${r.id}" data-date="${date}" data-nr="${nr}">
    <div class="bhead"><span class="nr">${nr}</span>
      <span class="chip ${dir === 'from' ? 'ok' : 'info'}" data-role="dir" ${filled ? '' : 'hidden'}>${dir === 'from' ? 'ODVOZ' : 'TJA'}</span>
      ${r.dia ? `<span class="chip mono">${esc(r.dia)}</span>` : ''}
      ${r.demo ? '<span class="chip warn">PRIMER</span>' : ''}
      ${showSt ? stChip(r.status) : ''}
      <span class="sp"></span>
      <span class="assign ${a && a.late > 0 ? 'late' : ''}" data-role="assign" ${a ? '' : 'hidden'}>${a ? esc(a.veh) + ' · ' + fmtT(a.t) : ''}</span>
      ${filled ? `<button type="button" class="icon-btn" data-act="rideView" title="Predogled za kopiranje" aria-label="Predogled za kopiranje">${IC.eye}</button>` : ''}
      <button type="button" class="icon-btn" data-act="clearRide" title="Počisti polje ${nr}" aria-label="Počisti polje ${nr}">${IC.x}</button>
    </div>
    <div class="bgrid">
      <div class="field"><label for="n-${r.id}">Ime in priimek</label><input id="n-${r.id}" type="text" data-f="name" data-suggest="patient" value="${esc(r.name)}" autocomplete="off" placeholder="išči v bazi pacientov"></div>
      <div class="field"><label for="t-${r.id}" title="Ura preiskave. Pri odvozu iz ustanove: ura, ko je pacient pripravljen.">Ura</label><input id="t-${r.id}" type="time" data-f="time" value="${esc(r.time)}"></div>
      <div class="field full"><span class="lbl">Način prevoza</span>${modeSeg(r.mode)}</div>
      <div class="field full"><label for="f-${r.id}">Od (naslov hiše)</label><input id="f-${r.id}" type="text" data-f="from" data-suggest="from" class="${g && g.kind === 'neznano' ? 'warnfield' : ''}" value="${esc(r.from)}" autocomplete="off" placeholder="npr. Dobova 25"></div>
      <div class="field full"><label for="o-${r.id}">Do (kam)</label><input id="o-${r.id}" type="text" data-f="to" data-suggest="to" value="${esc(r.to)}" autocomplete="off" placeholder="npr. UKC Ljubljana"></div>
      <div class="field"><label for="p-${r.id}">Telefon / kontakt</label><input id="p-${r.id}" type="tel" data-f="phone" value="${esc(r.phone)}" autocomplete="off"></div>
      <div class="field"><label for="d-${r.id}">Dializa</label><select id="d-${r.id}" data-f="dia"><option value="">–</option>${DIA_GROUPS.map(x => `<option ${r.dia === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="field full"><label for="x-${r.id}">Opomba (npr. voziček, kisik, spremljevalec)</label><input id="x-${r.id}" type="text" data-f="note" value="${esc(r.note || '')}" autocomplete="off"></div>
    </div>
    ${pinfoHTML(date, r)}
    ${showSt && r.times && Object.keys(r.times).length ? `<div class="row" style="gap:4px">${timesChips(r)}</div>` : ''}
    <div class="donerow">
      <label class="check"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label>
      <label class="check" title="Dovoli, da se za ta prevoz pravila prilagodijo (npr. več pacientov v vozilu, daljša pot)"><input type="checkbox" data-f="exc" ${r.exc ? 'checked' : ''}> Izjema pravil</label>
      <div class="field whodid"><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz" autocomplete="off"></div>
    </div>
  </article>`;
}
function refreshStaffList(date){
  const names = new Set([...(S.duty[date] || []).map(d => d.name), ...S.staff.map(s => s.name)]);
  $('#staffList').innerHTML = [...names].map(n => `<option value="${esc(n)}"></option>`).join('');
}
function renderDay(){
  const date = UI.date, today = todayStr(), a = ensureDay(date), plan = computePlan(date);
  refreshStaffList(date);
  const filled = a.filter(isFilled).length, done = a.filter(r => isFilled(r) && r.done).length, groups = diaGroupsFor(date, S);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const warns = dayWarnings(date);
  $('#view').innerHTML = `
    ${demoBanner()}
    <div class="daybar">
      <div class="row">
        <button type="button" class="btn" data-act="dayPrev" aria-label="Prejšnji dan">${IC.left}</button>
        <input type="date" id="dayPick" value="${date}" style="width:auto" aria-label="Izberi datum">
        <button type="button" class="btn" data-act="dayNext" aria-label="Naslednji dan">${IC.right}</button>
        <button type="button" class="btn ${date === today ? 'primary' : ''}" data-act="dayToday">Danes</button>
        <button type="button" class="btn ${date === addDays(today,1) ? 'primary' : ''}" data-act="dayTomorrow">Jutri</button>
      </div>
      <div class="row">${groups.map(g => `<span class="chip mono" title="Dializa ta dan">${IC.kidney.replace('<svg','<svg width="13" height="13"')}${g}</span>`).join('')}
        <span class="chip" id="fillcount"><span class="mono">${filled}</span>/${a.length} polj</span><span class="chip ok" id="donecount"><span class="mono">${done}</span> opravljenih</span></div>
    </div>
    ${blocked.length ? `<div class="banner bad"><span>${IC.alert}</span><div>${blocked.map(v => `<b>${esc(v.name)}</b>: ${esc(vehBlocked(date, v.id).tip)}${vehBlocked(date, v.id).note ? ' (' + esc(vehBlocked(date, v.id).note) + ')' : ''}`).join(' · ')}. Vozilo ni v razporedu.</div></div>` : ''}
    ${S.dayNote[date] ? `<div class="banner warn"><span>${IC.info}</span><div><b>Opomba dneva:</b> ${esc(S.dayNote[date])}</div></div>` : ''}
    <div class="toolbar">
      <div class="seg inline" role="group" aria-label="Filter">${[['vsi','Vsa polja'],['zasedena','Zasedena'],['cakajo','Čakajo'],['opravljeni','Opravljeni']].map(([k, l]) => `<button type="button" data-act="filter" data-k="${k}" aria-pressed="${UI.filter === k}">${l}</button>`).join('')}</div>
      <input type="search" id="rideSearch" placeholder="Išči po imenu ali naslovu" value="${esc(UI.q)}" aria-label="Išči">
      ${groups.length ? `<button type="button" class="btn" data-act="loadDia">${IC.kidney.replace('<svg','<svg width="16" height="16"')} Naloži dializne paciente</button>` : ''}
      <button type="button" class="btn" data-act="addSlots">${IC.plus} 5 polj več</button>
      <button type="button" class="btn" data-act="gotoDisp" data-date="${date}">${IC.route} Razpored</button>
    </div>
    ${warns.length ? `<details class="warnbox"><summary>${warns.length} opozoril za ta dan</summary><ul class="warnlist">${warns.slice(0,40).map(w => `<li>${esc(w.text)}</li>`).join('')}</ul></details>` : ''}
    <div class="boxes" id="boxes">${a.map((r, i) => boxHTML(date, r, i + 1, plan)).join('')}</div>`;
  applyFilter();
}
function applyFilter(){
  const q = norm(UI.q);
  $$('#boxes .box').forEach(el => {
    const r = rideById(el.dataset.date, el.dataset.ride); if (!r) return;
    const f = isFilled(r.r);
    let show = true;
    if (UI.filter === 'zasedena') show = f; else if (UI.filter === 'cakajo') show = f && !r.r.done; else if (UI.filter === 'opravljeni') show = f && r.r.done;
    if (show && q) show = norm([r.r.name, r.r.from, r.r.to, r.r.phone].join(' ')).includes(q);
    el.hidden = !show;
  });
}
function updateDayCounts(){
  const a = ensureDay(UI.date), f = a.filter(isFilled).length, d = a.filter(r => isFilled(r) && r.done).length;
  const fc = $('#fillcount'), dc = $('#donecount');
  if (fc) fc.innerHTML = `<span class="mono">${f}</span>/${a.length} polj`;
  if (dc) dc.innerHTML = `<span class="mono">${d}</span> opravljenih`;
}
function refreshBox(el){
  const date = el.dataset.date, hit = rideById(date, el.dataset.ride); if (!hit) return;
  const r = hit.r, filled = isFilled(r);
  el.classList.toggle('empty', !filled); el.classList.toggle('done', !!r.done);
  const dir = $('[data-role=dir]', el);
  if (dir){ dir.hidden = !filled; const d = filled ? rideDir(r) : 'to'; dir.textContent = d === 'from' ? 'ODVOZ' : 'TJA'; dir.className = 'chip ' + (d === 'from' ? 'ok' : 'info'); dir.dataset.role = 'dir'; }
  const fi = $('[data-f=from]', el); if (fi){ const g = r.from.trim() ? geo(r.from) : null; fi.classList.toggle('warnfield', !!g && g.kind === 'neznano'); }
  $$('.seg [data-mode]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === r.mode)));
  updateDayCounts();
}

/* ---------- Dispečer ---------- */
function dutyHTML(date){
  const duty = S.duty[date] || [], avail = availableVehicles(date);
  const onNames = new Set(duty.map(d => d.name));
  const chips = S.staff.map(s => `<button type="button" class="chip toggle" data-act="toggleStaff" data-id="${s.id}" aria-pressed="${onNames.has(s.name)}">${esc(s.name)}${s.team === 'NN' ? ' · NN' : ''}</button>`).join('');
  const otOpts = [[0, 'Nadure: brez'], [30, 'Nadure do 30 min'], [60, 'Nadure do 1 h'], [120, 'Nadure do 2 h'], [180, 'Nadure do 3 h'], [240, 'Nadure do 4 h']];
  const items = duty.map((d, i) => { const st = staffOfDuty(d); return `<div class="duty-item" data-di="${i}">
      <div class="dn">${esc(d.name)} ${st && st.userId ? '<span class="chip ok" title="Ima račun in vidi razpored v aplikaciji">račun</span>' : '<span class="chip warn" title="Brez računa ne vidi razporeda v aplikaciji. Poveži v Nastavitve → Zaposleni.">brez računa</span>'}</div><button type="button" class="icon-btn" data-act="rmDuty" data-i="${i}" aria-label="Odstrani ${esc(d.name)}">${IC.x}</button>
      <div class="dsel">
        <select data-duty="team" aria-label="Ekipa"><option value="redna" ${d.team==='redna'?'selected':''}>Redna ekipa</option><option value="NN" ${d.team==='NN'?'selected':''}>NN ekipa</option><option value="pripravljenost" ${d.team==='pripravljenost'?'selected':''}>Pripravljenost</option></select>
        <select data-duty="role" aria-label="Vloga"><option value="voznik" ${d.role!=='spremljevalec'?'selected':''}>Voznik</option><option value="spremljevalec" ${d.role==='spremljevalec'?'selected':''}>Spremljevalec</option></select>
        <label class="mini">Začetek izmene<input type="time" data-duty="from" value="${esc(d.from||'')}" title="Prazno = izmena ni omejena"></label>
        <label class="mini">Konec izmene<input type="time" data-duty="to" value="${esc(d.to||'')}" title="Prazno = začetek + ${S.rules.shiftHours} h (če je vpisan začetek)"></label>
        <select data-duty="vehicleId" aria-label="Vozilo"><option value="">Vozilo: samodejno</option>${avail.map(v => `<option value="${v.id}" ${d.vehicleId===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select>
        <select data-duty="ot" aria-label="Nadure">${otOpts.map(([v, l]) => `<option value="${v}" ${(+d.ot || 0) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div></div>`; }).join('');
  return `<div class="card card-pad stack" style="gap:12px">
    <div class="card-head" style="margin:0"><h3>Zaposleni na delu</h3><span class="chip mono">${duty.length}</span></div>
    ${chips ? `<div class="row" style="gap:6px">${chips}</div><div class="hint">Tapni ime, da ga dodaš ali odstraniš.</div>` : '<div class="hint">Seznam zaposlenih dodaš v Nastavitve → Zaposleni ali kar spodaj.</div>'}
    ${items || '<div class="empty-state" style="padding:14px">Še nihče ni vpisan za ta dan.</div>'}
    <form class="row" data-form="addDuty" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime novega zaposlenega" list="staffList" aria-label="Ime zaposlenega" autocomplete="off"><button class="btn primary" type="submit">Dodaj</button></form>
    <div class="row"><button type="button" class="btn sm" data-act="copyDuty">${IC.copy} Kopiraj osebje od prejšnjega dne</button></div>
  </div>`;
}
function vehiclesHTML(date){
  return `<div class="card card-pad stack" style="gap:10px"><div class="card-head" style="margin:0"><h3>Vozila na voljo</h3></div>
    ${S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo').map(v => {
      const b = vehBlocked(date, v.id), off = vehOff(date, v.id);
      return `<div class="veh-item ${b || off ? 'off' : ''}"><label><input type="checkbox" data-act="vehToggle" data-id="${v.id}" ${!off && !b ? 'checked' : ''} ${b ? 'disabled' : ''}><span><span class="vn">${esc(v.name)}</span><br><span class="hint">${esc(capText(v))}</span></span></label>${b ? `<span class="chip bad">${esc(b.tip)}</span>` : (v.ns === 'NN' ? '<span class="chip">NN</span>' : '')}</div>`;
    }).join('') || '<div class="hint">Vozila dodaš v Nastavitve → Vozila.</div>'}
  </div>`;
}
function stopRow(c, t, s, L, prev){
  const ppl = (s.people || []).filter(Boolean);
  const personRow = (t.kind === 'to' && s.type === 'pu') || (t.kind === 'from' && s.type === 'do');
  const pt = s.pt, label = s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : (pt.label || '');
  const base = prev ? `<li class="legline"><span></span><i></i><span>${Math.max(1, Math.round(s.t - prev.t - (prev.type === 'pu' ? S.settings.pickMin * ((prev.people || []).length || 1) : S.settings.dropMin)))} min · ${L(prev.pt, pt).km.toFixed(1)} km</span></li>` : '';
  let body;
  if (personRow && ppl.length){
    const r = ppl[0];
    const rr = rideById(UI.dDate, r.id), rs = rr ? rr.r : null;
    body = `<div><div class="who"><span class="pdot ${pcClass(r.pid)}"></span>${esc(r.name)} <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span> <span class="chip mono">št. ${r.nr}</span>${rs && rs.status && rs.status !== 'nova' ? ' ' + stChip(rs.status) : ''}${rs && rs.exc ? ' <span class="chip accent">izjema</span>' : ''}</div>
      <div class="addr">${esc(r.kind === 'to' ? r.fromTxt : r.toTxt)}${r.phone ? ` · <span class="mono">${esc(r.phone)}</span>` : ''}${r.timeTxt ? ` · ura ${esc(r.timeTxt)}` : ''}</div></div>
      <div class="pin"><select data-act="pin" data-ride="${r.id}" aria-label="Prestavi prevoz ${r.nr} na vozilo"><option value="">Samodejno</option>${CREWS_PIN.map(v => `<option value="${v.id}" ${r.pin===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>`;
  } else {
    const who = ppl.map(r => `${esc(r.name)} <span class="chip mono">št. ${r.nr}</span>`).join(' ');
    body = `<div><div class="who">${s.type === 'pu' ? 'Pobere' : 'Izstop'}: ${esc(label)}</div><div class="addr">${who}${t.kind === 'to' && s.type === 'do' && t.slack != null ? ` · preiskava ${fmtT(t.ref)}, rezerva ${t.slack} min` : ''}</div></div><div></div>`;
  }
  return `${base}<li class="stop"><time>${fmtT(s.t)}</time><span class="dot ${s.type === 'do' ? 'do' : ''}"></span>${body}</li>`;
}
function renderDispatch(){
  const date = UI.dDate, today = todayStr(), tom = addDays(today, 1);
  const plan = computePlan(date), L = makeLeg(S.settings);
  if (UI.bookRev !== date + '#' + rev){ writeBook(date); UI.bookRev = date + '#' + rev; }
  CREWS_PIN = plan.crews.map(c => c.vehicle);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const tot = plan.totals;
  const rows = plan.crews.map(c => `<tr>
      <td><b>${esc(c.vehicle.name)}</b><div class="hint">${esc(capText(c.vehicle))}</div></td>
      <td>${esc(c.driver.name)}${c.team === 'NN' ? ' <span class="chip">NN</span>' : ''}${c.escorts.map(e => `<div class="hint">${esc(e.name)} (sp.)</div>`).join('')}</td>
      <td><div class="numchips">${c.rideNrs.length ? c.rideNrs.map(n => `<span class="chip mono">${n}</span>`).join('') : '<span class="dim">–</span>'}</div></td>
      <td>${c.trips.length ? `<b class="mono">Štart ${fmtT(c.firstDepart)}</b> iz postaje<div class="hint">${c.trips.map(t => `${fmtT(t.depart)} → ${esc(t.kind === 'to' ? (t.anchor.label || '') : (t.anchor.label || '') + ' (odvoz)')}`).join(' · ')}</div>${c.trips.some(t=>t.late>0) ? '<div><span class="chip bad">zamuda</span></div>' : ''}${c.overtime > 0 ? `<div><span class="chip accent">nadure ~${c.overtime} min</span></div>` : ''}` : '<span class="dim">Brez prevozov</span>'}</td></tr>`).join('');
  const blockedRows = blocked.map(v => { const b = vehBlocked(date, v.id); return `<tr><td><b>${esc(v.name)}</b></td><td colspan="2"><span class="chip bad">${esc(b.tip)}</span></td><td class="muted">${esc(b.note || 'Vozilo ni na voljo')}</td></tr>`; }).join('');
  const unRows = plan.unassigned.map(u => `<span class="chip bad mono" title="${esc(u.reason)}">${u.ride.nr}</span>`).join(' ');
  const cards = plan.crews.filter(c => c.trips.length).map(c => `<section class="card crewcard">
      <header><div><h3>${esc(c.vehicle.name)} · ${esc(crewLabel(c))}</h3><div class="timeline-note">Štart iz postaje ${fmtT(c.firstDepart)} · konec ob ${fmtT(c.trips[c.trips.length-1].end)}</div></div>
      <div class="meta"><span class="chip mono">${c.rideNrs.length} prevozov</span><span class="chip mono">${c.km.toFixed(0)} km</span><span class="chip mono">${fmtDur(c.busy)}</span></div></header>
      ${c.trips.map((t, ti) => `<div class="trip"><div class="trip-head">
          <span class="chip ${t.kind === 'from' ? 'ok' : 'info'}">${t.kind === 'from' ? 'ODVOZ' : 'TJA'}</span><b>${t.kind === 'to' ? esc(t.anchor.label || 'cilj') : 'Iz: ' + esc(t.anchor.label || 'ustanova')}</b>
          <span class="chip mono">${t.rides.length} pac.</span><span class="chip mono">${t.ev.km.toFixed(0)} km</span><span class="chip mono">${fmtDur(t.ev.dur)}</span>
          ${t.late > 0 ? `<span class="chip bad">${t.kind === 'from' ? 'pacient čaka ~' + t.wait + ' min' : 'zamuda ~' + t.late + ' min'}</span>` : (t.kind === 'to' && t.slack != null ? `<span class="chip ok">rezerva ${t.slack} min</span>` : '')}
          ${t.sbReturn && c.team === 'NN' ? '<span class="chip">NN ekipa</span>' : ''}</div>
        <ul class="stops">
          <li class="stop"><time>${fmtT(t.depart)}</time><span class="dot base"></span><div><div class="who">Štart: ${ti === 0 ? 'RP Brežice (ZD)' : 'prejšnji cilj'}</div><div class="addr">Vožnja do prvega pobiranja ${L(t.from, t.stopsAbs[0].pt).km.toFixed(1)} km</div></div><div></div></li>
          ${t.stopsAbs.map((s, i) => stopRow(c, t, s, L, i ? t.stopsAbs[i-1] : null)).join('')}
        </ul></div>`).join('')}
    </section>`).join('');
  const closeList = (date <= tom) ? filledRides(date).map(({ r, nr }) => `<div class="duty-item" style="grid-template-columns:auto minmax(0,1fr) minmax(0,1.1fr);align-items:center" data-ride="${r.id}" data-date="${date}">
        <span class="nr">${nr}</span><div class="dn" style="min-width:0"><div style="overflow:hidden;text-overflow:ellipsis">${esc(r.name || '(brez imena)')} <span class="mono dim">${esc(r.time)}</span></div><div class="hint" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.from)} → ${esc(r.to)}</div></div>
        <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="row" style="gap:6px;flex-wrap:nowrap;font-weight:600"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz, prevoz ${nr}" style="${r.done ? '' : 'visibility:hidden'}"></div></div>`).join('') : '';
  refreshStaffList(date);
  $('#view').innerHTML = `
    ${demoBanner()}
    <div class="row">
      <div class="seg inline" role="group" aria-label="Izbira dneva"><button type="button" data-act="dDate" data-date="${today}" aria-pressed="${date === today}">Danes · ${fmtShort(today)}</button><button type="button" data-act="dDate" data-date="${tom}" aria-pressed="${date === tom}">Jutri · ${fmtShort(tom)}</button></div>
      <input type="date" id="dispPick" value="${date}" style="width:auto" aria-label="Drug datum">
      <span class="chip ${plan.standby ? 'info' : ''}">${plan.standby ? 'Pripravljenost (vikend/praznik)' : 'Delovni dan'}</span>
      ${diaGroupsFor(date, S).map(g => `<span class="chip mono">${g}</span>`).join('')}
    </div>
    <div class="dispatch">
      <div class="stack">
        ${dutyHTML(date)}${vehiclesHTML(date)}
        <div class="card card-pad stack" style="gap:8px"><h3>Opomba dneva</h3><textarea id="dayNote" placeholder="npr. ob 9:00 sestanek, cesta zaprta, pacient potrebuje spremljevalca">${esc(S.dayNote[date] || '')}</textarea></div>
      </div>
      <div class="stack">
        ${rulesBar(date, plan)}${publishBar(date, plan)}
        <div class="stats"><div class="stat"><b>${tot.rides}</b><span>prevozov za razporeditev</span></div><div class="stat"><b>${tot.vehicles}/${plan.crews.length}</b><span>vozil v uporabi</span></div><div class="stat"><b>${tot.km.toFixed(0)}</b><span>km skupaj (ocena)</span></div><div class="stat"><b style="color:${tot.late ? 'var(--bad)' : 'var(--ok)'}">${tot.late}</b><span>prevozov z zamudo</span></div></div>
        ${plan.warnings.length ? `<details class="warnbox" ${plan.warnings.some(w => w.level === 'bad' || w.level === 'bend') ? 'open' : ''}><summary>${plan.warnings.length} opozoril in prilagoditev</summary><ul class="warnlist">${plan.warnings.map(w => `<li class="w-${w.level}">${w.level === 'bend' ? '<span class="chip accent">prilagojeno</span> ' : ''}${esc(w.text)}</li>`).join('')}</ul></details>` : ''}
        <div class="card card-pad">
          <div class="card-head"><h3>Razpored za ${fmtShort(date)}</h3><div class="row"><button type="button" class="btn sm" data-act="copyPlan">${IC.copy} Kopiraj kot besedilo</button></div></div>
          ${plan.crews.length || blocked.length ? `<div class="tablewrap"><table><thead><tr><th>Vozilo</th><th>Voznik</th><th>Prevozi (št. v knjigi)</th><th>Posebnosti · ure štarta</th></tr></thead><tbody>${rows}${blockedRows}</tbody></table></div>`
            : '<div class="empty-state">Vpiši zaposlene na delu in označi vozila. Razpored se sestavi sam.</div>'}
          ${unRows ? `<p style="margin:10px 0 0"><b>Nerazporejeni prevozi:</b> ${unRows}</p>` : ''}
          <p class="hint" style="margin:10px 0 0">Časi so ocena: zračna razdalja × ${S.settings.road}, ${S.settings.speed} km/h lokalno in ${S.settings.speedHw} km/h na daljših relacijah, rezerva ${S.settings.buffer} min pred preiskavo. Razpored se vpiše tudi v mesečno knjigo.</p>
        </div>
        ${cards}
        ${closeList ? `<div class="card card-pad stack" style="gap:10px"><div class="card-head" style="margin:0"><h3>Zaključek prevozov</h3><span class="hint">Označi opravljeno in vpiši, kdo je naredil odvoz.</span></div>${closeList}</div>` : ''}
      </div>
    </div>`;
}

/* ---------- Posebnosti ---------- */
function renderNotices(){
  const today = todayStr();
  const list = S.notices.slice().sort((a,b) => (a.closed - b.closed) || b.from.localeCompare(a.from));
  const tipChip = n => `<span class="chip ${n.tip === 'okvara' ? 'bad' : n.tip === 'servis' ? 'warn' : 'info'}">${esc(n.tip)}</span>`;
  $('#view').innerHTML = `
    <div class="two">
      <form class="card card-pad stack" data-form="addNotice" style="gap:12px">
        <h3>Nova posebnost</h3>
        <div class="formgrid">
          <div class="field full"><label for="nv">Vozilo</label><select id="nv" name="vehicleId">${S.vehicles.filter(v => v.tip !== 'ostalo').map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="nt">Vrsta</label><select id="nt" name="tip"><option>okvara</option><option>servis</option><option>pregled</option><option>drugo</option></select></div>
          <div class="field"><label for="nf">Od</label><input id="nf" type="date" name="from" value="${today}" required></div>
          <div class="field"><label for="nto">Do (prazno = do preklica)</label><input id="nto" type="date" name="to"></div>
          <div class="field full"><label for="nn">Opis</label><input id="nn" type="text" name="note" placeholder="npr. pokvarjen zavorni sistem, redni servis v Krškem" autocomplete="off"></div>
        </div>
        <button class="btn primary" type="submit">Dodaj posebnost</button>
        <p class="hint" style="margin:0">Okvara in servis samodejno izločita vozilo iz razporeda za vse dni v obdobju.</p>
      </form>
      <div class="stack">
        <div class="card card-pad"><div class="card-head"><h3>Stanje vozil danes</h3></div>
          <div class="row" style="gap:8px">${S.vehicles.filter(v => v.tip !== 'ostalo').map(v => { const b = vehBlocked(today, v.id); return `<span class="chip ${b ? 'bad' : 'ok'}">${esc(v.name)} · ${b ? esc(b.tip) : 'v redu'}</span>`; }).join('')}</div></div>
        ${list.length ? list.map(n => `<div class="notice ${n.closed ? 'closed' : ''}">${tipChip(n)}<div><b>${esc((vehById(n.vehicleId) || { name:'(izbrisano vozilo)' }).name)}</b> <span class="mono dim">${n.from}${n.to ? ' → ' + n.to : ' → do preklica'}</span><div class="muted">${esc(n.note || '')}</div></div>
          <div class="row">${n.closed ? '<span class="chip">zaključeno</span>' : `<button type="button" class="btn sm" data-act="closeNotice" data-id="${n.id}">Zaključi</button>`}<button type="button" class="icon-btn" data-act="delNotice" data-id="${n.id}" aria-label="Izbriši">${IC.x}</button></div></div>`).join('')
          : '<div class="empty-state">Ni vpisanih posebnosti. Ko vozilo odpove ali gre na servis, ga vpiši tukaj.</div>'}
      </div>
    </div>`;
}

/* ---------- Nastavitve ---------- */
const field = (path, val, opts={}) => `<input data-path="${path}" ${opts.num ? 'type="number" data-num="1" step="' + (opts.step || 1) + '"' : (opts.time ? 'type="time"' : 'type="text"')} value="${esc(val)}" ${opts.sug ? 'data-suggest="from"' : ''} ${opts.ph ? 'placeholder="' + esc(opts.ph) + '"' : ''} ${opts.label ? 'aria-label="' + esc(opts.label) + '"' : ''}>`;
function settingsTabs(){
  const t = [['vozila','Vozila',true],['zaposleni','Zaposleni',false],['pravila','Pravila',true],['dializa','Dializa',false],['planiranje','Izračun',true],['naslovi','Naslovi in naselja',true],['uporabniki','Uporabniki',true],['varnost','Varnost',true],['logotipi','Logotipi',true],['podatki','Podatki',false]];
  return `<div class="tabs" role="tablist">${t.filter(x => !x[2] || isAdmin()).map(x => `<button type="button" role="tab" data-act="setTab" data-k="${x[0]}" aria-selected="${UI.setTab === x[0]}">${x[1]}</button>`).join('')}</div>`;
}
const accountOptions = cur => {
  const list = BACKEND === 'firebase' ? USERS_REMOTE.map(u => ({ id:u.id, name:u.name, role:u.role })) : USERS.map(u => ({ id:u.id, name:u.name, role:u.role }));
  return `<option value="">brez računa</option>` + list.map(u => `<option value="${esc(u.id)}" ${cur === u.id ? 'selected' : ''}>${esc(u.name)} (${esc(ROLES[u.role] || u.role)})</option>`).join('');
};
function renderSettings(){
  if (!isAdmin() && ['vozila','pravila','planiranje','naslovi','uporabniki','varnost','logotipi'].includes(UI.setTab)) UI.setTab = 'zaposleni';
  let body = '';
  const T = UI.setTab;
  if (T === 'vozila'){
    const num = (i, k, v, lbl) => field(`vehicles.${i}.${k}`, v, { num:1, label:lbl });
    body = `<div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Vozila in kapaciteta</h3><button type="button" class="btn primary sm" data-act="addVeh">${IC.plus} Dodaj vozilo</button></div>
      <div class="banner"><span>${IC.info}</span><div><b>Običajno</b> je število pacientov, ki jih vozilo vozi po pravilih. <b>Izjemoma</b> je največ, kar vozilo še lahko pelje, kadar je treba pravila prilagoditi (npr. vozilo s 6 sedeži, ki običajno vozi 4 paciente). Prilagoditev se uporabi samo, ko je potrebna, in je vedno izpisana. Vrstica »OSTALO« ni vozilo, ampak mesto za zaposlene brez vozila. Začetne številke so ocena, popravi jih.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th rowspan="2">Ime</th><th rowspan="2">Vrsta</th><th rowspan="2">Ekipa</th><th colspan="4">Običajno</th><th colspan="4">Izjemoma največ</th><th rowspan="2">Aktivno</th><th rowspan="2"></th></tr><tr><th>Sede</th><th>Leže</th><th>Utila</th><th>Skupaj</th><th>Sede</th><th>Leže</th><th>Utila</th><th>Skupaj</th></tr></thead><tbody>
      ${S.vehicles.map((v, i) => `<tr><td>${field(`vehicles.${i}.name`, v.name, { label:'Ime' })}</td>
        <td><select data-path="vehicles.${i}.tip" aria-label="Vrsta"><option value="sanitetno" ${v.tip==='sanitetno'?'selected':''}>Sanitetno</option><option value="resevalno" ${v.tip==='resevalno'?'selected':''}>Reševalno</option><option value="ostalo" ${v.tip==='ostalo'?'selected':''}>Ostalo (brez vozila)</option></select></td>
        <td><select data-path="vehicles.${i}.ns" aria-label="Ekipa"><option value="redna" ${v.ns==='redna'?'selected':''}>Redna</option><option value="NN" ${v.ns==='NN'?'selected':''}>NN</option><option value="oboje" ${v.ns==='oboje'?'selected':''}>Oboje</option></select></td>
        <td>${num(i,'sede',v.sede,'Sede')}</td><td>${num(i,'leze',v.leze,'Leže')}</td><td>${num(i,'utila',v.utila,'Utila')}</td><td>${num(i,'skupaj',v.skupaj,'Skupaj')}</td>
        <td>${num(i,'sedeMax',v.sedeMax,'Sede največ')}</td><td>${num(i,'lezeMax',v.lezeMax,'Leže največ')}</td><td>${num(i,'utilaMax',v.utilaMax,'Utila največ')}</td><td>${num(i,'skupajMax',v.skupajMax,'Skupaj največ')}</td>
        <td><input type="checkbox" data-path="vehicles.${i}.aktiv" data-bool="1" ${v.aktiv ? 'checked' : ''} aria-label="Aktivno"></td>
        <td><button type="button" class="icon-btn" data-act="delVeh" data-i="${i}" aria-label="Izbriši vozilo">${IC.x}</button></td></tr>`).join('')}
      </tbody></table></div>
      <p class="hint" style="margin:0">Nosil (leže) aplikacija nikoli ne »ustvari«: če vozilo nima nosil, ostane pacient leže nerazporejen in dobiš opozorilo.</p></div>`;
  } else if (T === 'zaposleni'){
    body = `<div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Zaposleni</h3></div>
      <form class="row" data-form="addStaff" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime in priimek" aria-label="Ime zaposlenega" required autocomplete="off"><select name="team" style="width:auto" aria-label="Ekipa"><option value="redna">Redna ekipa</option><option value="NN">NN ekipa</option></select><button class="btn primary" type="submit">Dodaj</button></form>
      ${S.staff.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th>Ime in priimek</th><th>Privzeta ekipa</th><th>Račun za aplikacijo posadke</th><th></th></tr></thead><tbody>${S.staff.map((s, i) => `<tr><td>${field(`staff.${i}.name`, s.name, { label:'Ime' })}${s.demo ? ' <span class="chip warn">PRIMER</span>' : ''}</td><td><select data-path="staff.${i}.team" aria-label="Ekipa"><option value="redna" ${s.team==='redna'?'selected':''}>Redna</option><option value="NN" ${s.team==='NN'?'selected':''}>NN</option></select></td><td><select data-path="staff.${i}.userId" aria-label="Račun">${accountOptions(s.userId)}</select></td><td><button type="button" class="icon-btn" data-act="delStaff" data-i="${i}" aria-label="Izbriši">${IC.x}</button></td></tr>`).join('')}</tbody></table></div>
      <p class="hint" style="margin:0">Zaposlenega poveži z računom (Nastavitve → Uporabniki), da bo po »Objavi razpored« videl svoje prevoze v aplikaciji in javljal korake.</p>` : '<div class="empty-state">Še ni zaposlenih. Dodani zaposleni se v Dispečerju izberejo z enim dotikom.</div>'}</div>`;
  } else if (T === 'pravila'){
    body = rulesTab();
  } else if (T === 'dializa'){
    const dg = DIA_GROUPS.map(g => { const c = S.settings.dia[g]; return `<tr><td><b class="mono">${g}</b></td><td>${field(`settings.dia.${g}.start`, c.start, { time:1, label:g + ' začetek' })}</td><td>${field(`settings.dia.${g}.end`, c.end, { time:1, label:g + ' konec' })}</td>
      <td><div class="row" style="gap:10px">${[1,2,3,4,5,6,0].map(d => `<label class="row" style="gap:4px;flex-wrap:nowrap"><input type="checkbox" data-diaday="${g}|${d}" ${c.days.includes(d) ? 'checked' : ''}> ${DOW_SHORT[d]}</label>`).join('')}</div></td></tr>`; }).join('');
    const dp = S.patients.filter(p => p.dia);
    body = `<div class="stack"><div class="card card-pad stack"><h3>Skupine dialize</h3><div class="banner"><span>${IC.info}</span><div>Začetne ure so ocena. Vpiši dejanske ure dialize. Prevoz tja je ob začetku, prevoz nazaj ob koncu.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th>Skupina</th><th>Začetek</th><th>Konec</th><th>Dnevi</th></tr></thead><tbody>${dg}</tbody></table></div></div>
      <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Dializni pacienti</h3><button type="button" class="btn sm" data-nav="pacienti">Odpri bazo pacientov</button></div>
      <p class="muted" style="margin:0">Dializni pacienti so v bazi pacientov (polje »Dializa«). Za vsakega vpiši letni nalog, aplikacija pa opozori mesec pred iztekom.</p>
      ${dp.length ? `<div class="row" style="gap:6px">${dp.map(p => `<button type="button" class="chip toggle ${pcClass(p.id)}" data-act="openPatient" data-id="${p.id}"><span class="pdot ${pcClass(p.id)}"></span>${esc(p.name)} · ${esc(p.dia)}</button>`).join('')}</div>` : '<div class="empty-state">Še ni dializnih pacientov. V bazi pacientov izberi skupino dialize.</div>'}</div></div>`;
  } else if (T === 'planiranje'){
    const k = (label, path, step=1, unit='') => `<label for="k-${path}">${label}${unit ? ' <span class="dim">(' + unit + ')</span>' : ''}</label>${field(path, S.settings[path.split('.')[1]], { num:1, step, label })}`.replace('data-path', `id="k-${path}" data-path`);
    body = `<div class="card card-pad stack"><h3>Parametri izračuna</h3><div class="kv">
      ${k('Hitrost po lokalnih cestah','settings.speed',1,'km/h')}${k('Hitrost na daljših relacijah','settings.speedHw',1,'km/h')}${k('Faktor ceste (cesta / zračna črta)','settings.road',0.05)}${k('Čas pobiranja pacienta','settings.pickMin',1,'min')}${k('Čas odpuščanja pacienta','settings.dropMin',1,'min')}
      ${k('Rezerva pred preiskavo','settings.buffer',1,'min')}${k('Okno združevanja po uri','settings.window',5,'min')}${k('Največji dodaten čas za soprevoznika','settings.detour',5,'min')}${k('Najdaljša vožnja pacienta v vozilu','settings.maxRide',5,'min')}
      ${k('Čakanje pri odvozu brez zamude','settings.waitTol',1,'min')}${k('Število polj v knjigi na dan','settings.slots',1,'polj')}${k('Samodejna odjava','settings.idleMin',5,'min')}
      <label for="k-shift">Privzet začetek izmene</label><input id="k-shift" type="time" data-path="settings.shift" value="${esc(S.settings.shift)}"></div>
      <p class="hint" style="margin:0">Spremembe veljajo takoj. Razpored za današnji in jutrišnji dan se ponovno izračuna.</p></div>`;
  } else if (T === 'naslovi'){
    body = `<div class="stack"><div class="card card-pad stack"><h3>Naslovi za samodejno dopolnjevanje</h3>
      <p class="muted" style="margin:0">Predlogi zajemajo vseh ${SETTLEMENTS.length} naselij Občine Brežice, ustanove, del ulic v Brežicah in naslove, ki jih že vpisuješ (${S.addrBook.length}). Za predloge do hišne številke uvozi CSV z naslovi (npr. iz odprtih podatkov GURS, register prostorskih enot). Stolpci: ulica, hišna številka, naselje, ter koordinate (lat, lon v WGS84 ali E, N v D96/TM); stolpec občina je neobvezen (uvozijo se samo naslovi Občine Brežice). Da bodo naslovi na vseh napravah, po uvozu klikni »Prenesi naslovi.json« in datoteko naloži na GitHub poleg index.html (glej navodila).</p>
      <div class="row"><input type="file" id="csvFile" accept=".csv,text/csv,text/plain" style="max-width:320px"><span class="chip mono">uvoženih: ${ADDR.list.length}${SHARED_ADDR.length ? ' (skupnih: ' + SHARED_ADDR.length + ')' : ''}</span><button type="button" class="btn sm" data-act="exportAddr">Prenesi naslovi.json</button><button type="button" class="btn sm danger" data-act="clearAddr">Izbriši uvožene</button><button type="button" class="btn sm" data-act="clearLearned">Pozabi naučene naslove</button></div></div>
      <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Koordinate naselij</h3><span class="chip warn">približne vrednosti</span></div>
      <p class="muted" style="margin:0">Izračun razdalj uporablja te točke. Če poznaš boljše koordinate, jih popravi. Spremenjene vrstice so označene.</p>
      <div class="scrollbox"><table class="edtable"><thead><tr><th>Naselje</th><th>Širina (lat)</th><th>Dolžina (lon)</th><th></th></tr></thead><tbody>${SETTLEMENTS.map((s, i) => { const o = S.coordOv[s.n]; return `<tr><td>${esc(s.n)}</td><td class="coord"><input type="number" step="0.001" data-coord="${i}|0" value="${o ? o[0] : s.lat}" aria-label="${esc(s.n)} lat"></td><td class="coord"><input type="number" step="0.001" data-coord="${i}|1" value="${o ? o[1] : s.lon}" aria-label="${esc(s.n)} lon"></td><td>${o ? '<span class="chip accent">spremenjeno</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div></div></div>`;
  } else if (T === 'uporabniki'){
    body = usersTab();
  } else if (T === 'varnost'){
    body = securityTab();
  } else if (T === 'logotipi'){
    body = logosTab();
  } else {
    body = dataTab();
  }
  $('#view').innerHTML = `${settingsTabs()}<div style="height:14px"></div>${body}`;
}

/* ---------- Prijava ---------- */
function renderAuth(mode, msg=''){
  const first = BACKEND !== 'firebase' && USERS.length === 0;
  const card = $('#authCard');
  const local = BACKEND !== 'firebase' ? `<div class="banner warn" style="font-size:12.5px"><span>${IC.info}</span><div><b>Lokalni način.</b> Podatki so samo v tem brskalniku. Uporabi samo izmišljene podatke. Za pravo uporabo glej navodila (Firebase).</div></div>` : '';
  if (first){
    card.innerHTML = `<h2>Prvi zagon</h2><p class="muted" style="margin:0">Ustvari račun skrbnika. Pozneje dodaš še račune za dispečerje in posadke.</p>${local}
      <form id="setupForm"><div class="field"><label for="su">Uporabniško ime</label><input id="su" name="username" required autocomplete="username"></div>
      <div class="field"><label for="sn">Ime in priimek</label><input id="sn" name="name" autocomplete="name"></div>
      <div class="field"><label for="sp">Geslo (vsaj 10 znakov)</label><input id="sp" name="pw" type="password" minlength="10" required autocomplete="new-password"></div>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" name="demo" checked> Naloži primere (izmišljeni pacienti, voznik in spremljevalec)</label>
      <button class="btn primary" type="submit">Ustvari račun in začni</button><div class="auth-err" id="authErr" role="alert">${esc(msg)}</div></form>
      <p class="legalnote">Podatki o pacientih se ne shranjujejo na GitHub. Prijava deluje v tem brskalniku.</p>`;
  } else {
    card.innerHTML = `<h2>Prijava</h2><p class="muted" style="margin:0">Dostop imajo samo zaposleni Reševalne postaje Brežice.</p>${local}
      <form id="loginForm"><div class="field"><label for="lu">${BACKEND === 'firebase' ? 'Uporabniško ime ali e-pošta' : 'Uporabniško ime'}</label><input id="lu" name="username" required autocomplete="username" autocapitalize="none" spellcheck="false" autofocus></div>
      <div class="field"><label for="lp">Geslo</label><input id="lp" name="pw" type="password" required autocomplete="current-password"></div>
      ${BACKEND === 'firebase' ? '<label class="row" style="gap:8px;flex-wrap:nowrap;font-size:13px"><input type="checkbox" name="remember"> Ostani prijavljen na tej napravi (ne na skupnem računalniku)</label>' : ''}
      <button class="btn primary" type="submit">Prijava</button><div class="auth-err" id="authErr" role="alert">${esc(msg)}</div></form>
      <p class="legalnote">Podatke o pacientih obravnavaj skladno z internimi pravili zdravstvenega doma. Vsaka prijava in ogled pacienta se beležita.</p>`;
  }
}

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
function rulesBar(date, plan){
  const mode = dayMode(date), own = !!(S.dayRules[date] && S.dayRules[date].mode);
  return `<div class="card card-pad stack" style="gap:10px"><div class="card-head" style="margin:0"><h3>Pravila za ta dan</h3>${own ? '<span class="chip accent">samo za ta dan</span> <button type="button" class="btn sm ghost" data-act="dayModeReset">Uporabi privzeto</button>' : `<span class="chip">privzeto: ${RULE_MODES[S.rules.mode]}</span>`}</div>
    <div class="seg" role="group" aria-label="Način pravil">${Object.entries(RULE_MODES).map(([k, l]) => `<button type="button" data-act="dayMode" data-k="${k}" aria-pressed="${mode === k}">${l}</button>`).join('')}</div>
    <p class="hint" style="margin:0">${RULE_DESC[mode]}</p>
    ${plan.bends.length ? `<div class="banner" style="background:var(--accent-soft);color:var(--accent)"><span>${IC.info}</span><div><b>${plan.bends.length} prilagoditev pravil.</b> Podrobnosti so v opozorilih spodaj. Prilagoditve za posamezen prevoz lahko izključiš z načinom »Strogo« ali z ročnim prestavljanjem.</div></div>` : ''}</div>`;
}
function publishBar(date, plan){
  const st = publishState(date), pub = S.published[date];
  const duty = S.duty[date] || [], noAcc = duty.filter(d => { const s = staffOfDuty(d); return !(s && s.userId); });
  const chip = st === 'ok' ? `<span class="chip ok">objavljeno ob ${timeOf(pub.at)}</span>` : st === 'spremenjeno' ? '<span class="chip warn">razpored se je spremenil po objavi</span>' : '<span class="chip">ni objavljeno</span>';
  return `<div class="card card-pad stack" style="gap:10px"><div class="card-head" style="margin:0"><h3>Objava posadkam</h3>${chip}</div>
    <div class="row"><button type="button" class="btn primary" data-act="publish" data-date="${date}" ${plan.crews.some(c => c.trips.length) ? '' : 'disabled'}>${IC.send} ${st === 'ni' ? 'Objavi razpored' : 'Objavi znova'}</button><button type="button" class="btn" data-nav="zivo" data-live="${date}">${IC.pulse} Živo stanje</button></div>
    <p class="hint" style="margin:0">Vsaka posadka v aplikaciji vidi samo svoje prevoze in javlja korake (sprejem, na poti, pri pacientu, v vozilu, na cilju). Časi se vpišejo v knjigo.</p>
    ${noAcc.length ? `<div class="banner warn"><span>${IC.alert}</span><div>Brez računa: <b>${noAcc.map(d => esc(d.name)).join(', ')}</b>. Ne bodo videli razporeda v aplikaciji (Nastavitve → Zaposleni).</div></div>` : ''}</div>`;
}

/* ---------- Pacienti ---------- */
function patientMatches(p){
  const q = norm(UI.pq);
  if (q && !norm([p.name, p.addr, p.phone].join(' ')).includes(q)) return false;
  const sm = patientNalogSummary(p);
  if (UI.pf === 'opozorila') return ['kmalu', 'potekel'].includes(sm.st) && !!nalogAlerts().find(a => a.p.id === p.id);
  if (UI.pf === 'dializa') return !!p.dia;
  if (UI.pf === 'brez') return !(p.naloge || []).length || sm.st === 'brez';
  return true;
}
function nalogCardHTML(p, n){
  const s = nalogState(n), miss = missingNalog(n), open = UI.nid === n.id;
  const head = `<div class="ncard-head"><span class="chip accent">${esc(NALOG_VRSTE[n.vrsta].l)}</span><b class="mono">${esc(n.stevilka || 'brez številke')}</b>${nalogChip(n)}${miss.length ? `<span class="chip warn" title="Manjka: ${esc(miss.join(', '))}">nepopoln</span>` : ''}</div>`;
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
      <div class="field"><label for="nf-mode">Način prevoza</label><select id="nf-mode" data-nf="mode">${Object.entries(MODES).map(([k, v]) => `<option value="${k}" ${n.mode === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="nf-od">Relacija: od</label><input id="nf-od" data-nf="od" data-suggest="from" value="${esc(n.od || '')}" autocomplete="off" placeholder="npr. domači naslov"></div>
      <div class="field"><label for="nf-do">Relacija: do</label><input id="nf-do" data-nf="do" data-suggest="to" value="${esc(n.do || '')}" autocomplete="off" placeholder="npr. SB Brežice – dializa"></div>
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
      <div class="field"><span class="lbl">Običajni način prevoza</span><div class="seg" role="group">${Object.entries(MODES).map(([k, v]) => `<button type="button" data-act="pMode" data-mode="${k}" aria-pressed="${p.mode === k}">${v}</button>`).join('')}</div></div>
      <div class="field"><label for="pf-dia">Dializa (skupina)</label><select id="pf-dia" data-pf="dia"><option value="">ni na dializi</option>${DIA_GROUPS.map(g => `<option ${p.dia === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
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
  const rows = list.map(p => { const sm = patientNalogSummary(p); return `<button type="button" class="prow ${p.color >= 0 ? 'pc' + p.color : ''}" data-act="openPatient" data-id="${p.id}" aria-current="${UI.pid === p.id}">${avatarP(p)}<span class="pr-main"><b>${esc(p.name || '(brez imena)')}</b><span class="hint">${esc(p.addr || 'brez naslova')}${p.phone ? ' · ' + esc(p.phone) : ''}</span></span><span class="pr-side">${p.dia ? `<span class="chip mono">${esc(p.dia)}</span>` : ''}${sm.n ? nalogChip(sm.n) : '<span class="chip">brez naloga</span>'}</span></button>`; }).join('');
  $('#view').innerHTML = `${demoBanner()}${alertsBanner()}
    <div class="plist ${sel ? 'has-sel' : ''}">
      <div class="stack" style="gap:12px">
        <div class="toolbar"><input type="search" id="patSearch" placeholder="Išči po imenu, naslovu, telefonu" value="${esc(UI.pq)}" aria-label="Išči pacienta"><button type="button" class="btn primary" data-act="newPatient">${IC.plus} Nov pacient</button></div>
        <div class="seg" role="group" aria-label="Filter">${[['vsi', `Vsi (${all.length})`], ['opozorila', `Opozorila (${al.length})`], ['dializa', 'Dializa'], ['brez', 'Brez naloga']].map(([k, l]) => `<button type="button" data-act="pf" data-k="${k}" aria-pressed="${UI.pf === k}">${l}</button>`).join('')}</div>
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
      <div class="livelist">${items.map(({ r, nr }) => `<div class="liverow ${pcClass(r.patientId)}"><span class="pdot ${pcClass(r.patientId)}"></span><div class="lr-main"><b>${esc(r.name || '(brez imena)')}</b> <span class="chip mono">št. ${nr}</span> <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span><div class="hint">${esc(r.from)} → ${esc(r.to)} · ura ${esc(r.time || '–')}${r.statusBy ? ' · ' + esc(r.statusBy) : ''}${r.statusNote ? ' · ' + esc(r.statusNote) : ''}</div></div><div class="lr-side">${stChip(r.status || 'nova')}<div class="row" style="gap:4px;justify-content:flex-end">${timesChips(r)}</div></div></div>`).join('')}</div></section>`;
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
    ${r.time ? `<div class="hint">Ura preiskave / dogovorjena ura: <b>${esc(r.time)}</b></div>` : ''}
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
  if (!m){ host.hidden = true; host.innerHTML = ''; return; }
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

/* =====================================================================
   OBJAVA RAZPOREDA, STATUSI PREVOZOV (dispečer) IN APLIKACIJA ZA POSADKE (voznik, spremljevalec)
   Tok: dispečer "Objavi razpored" → crew/{datum}_{uid} (vsak član posadke vidi samo svoj razpored) in runs/{datum}_{vozilo}.
   Posadka pritiska korake → runs/{ključ}/events/{id} (samo dodajanje). Dispečer te dogodke prenese v knjigo (čas, status, "kdo je naredil odvoz").
   ===================================================================== */
const EVENTS = {};      // runKey -> { eventId: event }
const RUNS = {};        // runKey -> run doc (pogled dispečerja)
let renderTimer = null;
const typingNow = () => { const a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest && a.closest('#view') && !['checkbox', 'button', 'radio'].includes(a.type)); };
function scheduleRender(){
  if (!ME) return;
  if (typingNow()){ UI.stale = true; return; }
  clearTimeout(renderTimer); renderTimer = setTimeout(() => { UI.stale = false; rerender(); }, 60);
}
document.addEventListener('focusout', () => { setTimeout(() => { if (UI.stale && !typingNow()){ UI.stale = false; scheduleRender(); } }, 250); });

const staffOfDuty = d => S.staff.find(s => s.id === d.staffId) || S.staff.find(s => norm(s.name) === norm(d.name)) || null;
const hashStr = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const timeOf = iso => { if (!iso) return '–'; const d = new Date(iso); return isNaN(d) ? '–' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- Objava ---------- */
function planSig(date){
  const plan = computePlan(date);
  const rides = ensureDay(date).filter(r => plan.assign[r.id]).map(r => [r.id, r.name, r.time, r.from, r.to, r.phone, r.mode, r.note]);
  return hashStr(JSON.stringify([plan.crews.map(c => [c.id, c.driver.name, c.escorts.map(e => e.name), c.trips.map(t => [fmtT(t.depart), t.rides.map(r => r.id)])]), rides]));
}
function publishState(date){
  const p = S.published[date]; if (!p || !p.at) return 'ni';
  return p.sig === planSig(date) ? 'ok' : 'spremenjeno';
}
async function publishDay(date){
  if (!can('publish')) return { ok:false, msg:'Nimaš pravice za objavo.' };
  const plan = computePlan(date), at = new Date().toISOString();
  const runs = [], noAccount = new Set(), ridesAssigned = new Set();
  for (const c of plan.crews){
    if (!c.trips.length) continue;
    const members = [c.driver, ...c.escorts], staffs = members.map(staffOfDuty);
    members.forEach((m, i) => { if (!(staffs[i] && staffs[i].userId)) noAccount.add(m.name); });
    const uids = [...new Set(staffs.map(s => s && s.userId).filter(Boolean))];
    const key = date + '_' + c.id, rides = {}, trips = [];
    c.trips.forEach(t => {
      t.rides.forEach(r => {
        const hit = rideById(date, r.id); if (!hit) return;
        const rr = hit.r, p = patientById(rr.patientId), n = p ? (p.naloge || []).find(x => x.id === rr.nalogId) : null;
        rides[r.id] = { nr:hit.nr, name:rr.name, time:rr.time, from:rr.from, to:rr.to, phone:rr.phone, mode:rr.mode, note:rr.note || '', dia:rr.dia || '', color:p && p.color >= 0 ? p.color : -1,
          nalog:n ? { v:NALOG_VRSTE[n.vrsta].l, st:n.stevilka } : null, pickT:fmtT(plan.assign[r.id].t), kind:t.kind };
        ridesAssigned.add(r.id);
      });
      trips.push({ id:t.id, kind:t.kind, anchor:t.anchor.label || '', depart:fmtT(t.depart), stops:t.stopsAbs.map(s => ({ t:fmtT(s.t), type:s.type, label:s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : (s.pt.label || ''), rideIds:(s.people || []).filter(Boolean).map(r => r.id) })) });
    });
    runs.push({ key, vehId:c.id, vehName:c.vehicle.name, uids, names:members.map(m => m.name), rides, trips, depart:fmtT(c.firstDepart), rideIds:Object.keys(rides) });
  }
  if (!runs.length) return { ok:false, msg:'Ni posadke s prevozi. Najprej sestavi razpored.' };
  const prev = (S.published[date] && S.published[date].runs) || [];
  const runJobs = [], crewJobs = [];
  for (const r of runs){
    runJobs.push(DB.set('runs/' + r.key, { date, vehId:r.vehId, vehName:r.vehName, uids:r.uids, names:r.names, rideIds:r.rideIds, at, by:ME.name }));
    r.uids.forEach(u => crewJobs.push(DB.set('crew/' + date + '_' + u, { date, vehId:r.vehId, vehName:r.vehName, runKey:r.key, uid:u, uids:r.uids, names:r.names, depart:r.depart, trips:r.trips, rides:r.rides, at, by:ME.name })));
  }
  // posadke, ki jih novi razpored ne vsebuje več
  prev.forEach(o => {
    const still = runs.find(r => r.key === o.key);
    if (!still) runJobs.push(DB.set('runs/' + o.key, { date, vehId:o.vehId || '', vehName:o.vehName, uids:[], names:[], rideIds:[], at, by:ME.name, withdrawn:true }));
    (o.uids || []).forEach(u => { if (!still || !still.uids.includes(u)) crewJobs.push(DB.del('crew/' + date + '_' + u)); });
  });
  // najprej "runs" (pravila za dogodke jih potrebujejo), nato razpored posameznih članov posadke
  await Promise.all(runJobs);
  await Promise.all(crewJobs);
  ensureDay(date).forEach(r => {
    const a = plan.assign[r.id];
    if (a){ r.runKey = date + '_' + a.crewId; if (!r.status || r.status === 'nova' || r.status === 'odklonjena') r.status = 'dodeljena'; }
  });
  S.published[date] = { at, by:ME.name, sig:planSig(date), runs:runs.map(r => ({ key:r.key, vehId:r.vehId, vehName:r.vehName, uids:r.uids, names:r.names, n:r.rideIds.length })) };
  audit('razpored.objavljen', { datum:date, vozila:runs.length, prevozov:ridesAssigned.size, prilagoditve:plan.bends.map(b => b.k) });
  save();
  return { ok:true, runs:runs.length, rides:ridesAssigned.size, noAccount:[...noAccount] };
}

/* ---------- Dispečer: sprejem dogodkov posadke ---------- */
function onRuns(changes){
  changes.forEach(c => {
    if (!c.data){ delete RUNS[c.id]; if (SY.runUnsubs[c.id]){ SY.runUnsubs[c.id](); delete SY.runUnsubs[c.id]; } return; }
    RUNS[c.id] = c.data;
    if (!SY.runUnsubs[c.id] && DB) SY.runUnsubs[c.id] = DB.watchCol('runs/' + c.id + '/events', ch => onEvents(c.id, ch));
  });
  remoteChanged();
}
function onEvents(key, changes){
  const m = EVENTS[key] = EVENTS[key] || {};
  changes.forEach(c => { if (c.data) m[c.id] = c.data; else delete m[c.id]; });
  remoteChanged();
}
const sortedEvents = key => Object.values(EVENTS[key] || {}).sort((a, b) => String(a.c || a.t).localeCompare(String(b.c || b.t)));
function applyAllEvents(){
  if (!ME || !isStaffRole()) return false;
  let changed = false;
  for (const key of Object.keys(EVENTS)){
    const run = RUNS[key]; if (!run || !run.date) continue;
    const day = S.rides[run.date]; if (!day) continue;
    const byRide = {};
    sortedEvents(key).forEach(e => { (byRide[e.rideId] = byRide[e.rideId] || []).push(e); });
    for (const [rid, evs] of Object.entries(byRide)){
      const r = day.find(x => x.id === rid); if (!r) continue;
      const times = { ...(r.times || {}) };
      evs.forEach(e => { if (CASI_KLJUC[e.status]) times[e.status] = e.t; });
      const last = evs[evs.length - 1];
      const sameT = JSON.stringify(times) === JSON.stringify(r.times || {});
      if (!sameT){ r.times = times; changed = true; }
      if (r.status !== last.status){ r.status = last.status; r.statusBy = last.by || ''; changed = true; }
      if (last.status === 'zakljucena' && !r.done){ r.done = true; r.doneAt = times.zakljucena || last.t; if (!r.doneBy) r.doneBy = (run.names || []).join(', '); changed = true; }
      if (last.status === 'odklonjena' && r.pin){ r.pin = ''; changed = true; }
      if (last.note && r.statusNote !== last.note){ r.statusNote = last.note; changed = true; }
    }
  }
  if (changed) save();
  return changed;
}
SY.onRemote = () => { if (isStaffRole()) applyAllEvents(); scheduleRender(); };

/* ---------- Dispečer: pogled "Živo" ---------- */
const ST_ORDER = ['odklonjena', 'ni_doma', 'na_kraju', 'na_poti', 'v_vozilu', 'sprejeta', 'dodeljena', 'nova', 'na_cilju', 'zakljucena', 'preklicana'];
const stChip = st => { const d = STATUSI[st] || STATUSI.nova; return `<span class="chip st-${st} ${d.tone}">${esc(d.s)}</span>`; };
function timesChips(r){
  const t = r.times || {};
  return STATUS_FLOW.filter(k => CASI_KLJUC[k] && t[k]).map(k => `<span class="chip mono" title="${esc(STATUSI[k].l)}">${esc(STATUSI[k].s)} ${timeOf(t[k])}</span>`).join('');
}
function liveSummary(date){
  const rows = filledRides(date).filter(x => x.r.status && x.r.status !== 'nova');
  const c = {}; rows.forEach(x => { c[x.r.status] = (c[x.r.status] || 0) + 1; });
  return c;
}
function liveRows(date){
  const published = S.published[date], out = [];
  filledRides(date).forEach(({ r, nr }) => { out.push({ r, nr, run:(published && published.runs || []).find(o => o.key === r.runKey) || null }); });
  return out;
}

/* ---------- Posadka: stanje in dejanja ---------- */
const CREW = { docs:{}, evs:{}, unsubs:[], evUnsub:{}, ready:false, date:null, err:'' };
function startCrew(){
  stopCrew();
  const today = todayStr(), ds = [addDays(today, -1), today, addDays(today, 1)];
  ds.forEach(d => CREW.unsubs.push(DB.watchDoc('crew/' + d + '_' + ME.id, doc => onCrewDoc(d, doc))));
  CREW.date = today;
}
function stopCrew(){
  CREW.unsubs.forEach(u => { try { u(); } catch(e){} }); CREW.unsubs = [];
  Object.values(CREW.evUnsub).forEach(u => { try { u(); } catch(e){} }); CREW.evUnsub = {};
  CREW.docs = {}; CREW.evs = {};
}
function onCrewDoc(d, doc){
  if (doc && doc.runKey){
    CREW.docs[d] = doc;
    if (!CREW.evUnsub[doc.runKey]) CREW.evUnsub[doc.runKey] = DB.watchCol('runs/' + doc.runKey + '/events', ch => onCrewEvents(doc.runKey, ch));
  } else delete CREW.docs[d];
  CREW.ready = true; scheduleRender();
}
function onCrewEvents(key, ch){
  const m = CREW.evs[key] = CREW.evs[key] || {};
  ch.forEach(c => { if (c.data) m[c.id] = c.data; else delete m[c.id]; });
  scheduleRender();
}
function crewRideState(runKey, rideId){
  const evs = Object.values(CREW.evs[runKey] || {}).filter(e => e.rideId === rideId).sort((a, b) => String(a.c || a.t).localeCompare(String(b.c || b.t)));
  const times = {}; evs.forEach(e => { if (CASI_KLJUC[e.status]) times[e.status] = e.t; });
  const last = evs[evs.length - 1];
  return { status:last ? last.status : 'dodeljena', times, last, note:last && last.note || '' };
}
async function sendStatus(date, rideId, status, opts = {}){
  const doc = CREW.docs[date]; if (!doc || !(CASI_KLJUC[status] || ['ni_doma', 'odklonjena'].includes(status))) return false;
  const now = new Date().toISOString();
  const e = { rideId, status, t:opts.t || now, c:now, uid:String(ME.id), by:ME.name };
  if (opts.note) e.note = String(opts.note).slice(0, 200);
  if (opts.corr) e.corr = true;
  try { await DB.add('runs/' + doc.runKey + '/events', e); return true; }
  catch(err){ console.error(err); toast('Pošiljanje ni uspelo. Poskusi znova.'); return false; }
}
const navUrl = addr => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent((addr || '') + ', Slovenija');

/* =====================================================================
   DOGODKI, PRIJAVA, ZAČETNI PODATKI, ZAGON
   ===================================================================== */
let CREWS_PIN = [];
const isStaffRole = () => !!(ME && (ME.role === 'skrbnik' || ME.role === 'dispecer'));
const STAFF_VIEWS = ['knjiga', 'dan', 'dispecer', 'zivo', 'pacienti', 'posebnosti', 'nastavitve'];
const logoInner = () => `${logoItem('zd')}<i></i>${logoItem('nmp')}`;
function fillLogos(){ ['authLogos', 'railLogos', 'crewLogos'].forEach(id => { const el = $('#' + id); if (el) el.innerHTML = logoInner(); }); }

function render(){
  if (!ME) return;
  setHeader(); renderNav();
  if (isCrew()){ renderCrewApp(); }
  else if (UI.view === 'knjiga') renderMonth();
  else if (UI.view === 'dan') renderDay();
  else if (UI.view === 'dispecer') renderDispatch();
  else if (UI.view === 'zivo') renderLive();
  else if (UI.view === 'pacienti') renderPatients();
  else if (UI.view === 'posebnosti') renderNotices();
  else renderSettings();
  if (UI.modal) renderModal();
}
function rerender(){ const y = window.scrollY; render(); window.scrollTo(0, y); }
function go(view, push = true){
  if (isCrew()) view = 'moji';
  else if (!STAFF_VIEWS.includes(view)) view = 'knjiga';
  if (UI.view === 'pacienti' && view !== 'pacienti') cleanupEmptyPatient();
  UI.view = view; sgClose();
  if (isStaffRole()){
    if (view === 'dan') ensureRange(addDays(UI.date, -1), addDays(UI.date, 1));
    if (view === 'knjiga') ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`);
    if (view === 'nastavitve') loadRemoteUsers();
  }
  if (push && !isCrew()){ try { if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view); } catch(e){} }
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { const v = (location.hash || '').slice(1); if (ME && isStaffRole() && STAFF_VIEWS.includes(v) && v !== UI.view) go(v, false); });

/* ---------- Izvedba akcij ---------- */
const dutyList = date => (S.duty[date] = S.duty[date] || []);
function addDuty(date, name, team){
  const list = dutyList(date); if (list.some(d => norm(d.name) === norm(name))) return false;
  const standby = isStandby(date);
  const hasDriver = list.some(d => d.role !== 'spremljevalec');
  const st = S.staff.find(s => norm(s.name) === norm(name));
  list.push({ id:uid(), name:name.trim(), staffId:st ? st.id : '', team: standby ? 'pripravljenost' : (team || 'redna'), role: standby && hasDriver ? 'spremljevalec' : 'voznik', from:'', to:'', ot:0, vehicleId:'' });
  return true;
}
function setPath(path, el){
  const parts = path.split('.'); let obj = S;
  for (let i = 0; i < parts.length - 1; i++){ obj = obj[parts[i]]; if (obj == null) return; }
  const key = parts[parts.length - 1];
  let val;
  if (el.dataset.bool) val = el.checked;
  else if (el.dataset.num){ val = parseFloat(el.value); if (!isFinite(val)) return; if (val < 0) val = 0; }
  else val = el.value;
  obj[key] = val;
  if (/^vehicles\.\d+\.(sede|leze|utila|skupaj)$/.test(path)){ // največ ne sme biti manj kot običajno
    const v = obj; ['sede', 'leze', 'utila', 'skupaj'].forEach(k => { if ((+v[k + 'Max'] || 0) < (+v[k] || 0)) v[k + 'Max'] = +v[k] || 0; });
  }
  save();
}
function onRideField(el){
  const art = el.closest('[data-ride]'); if (!art) return;
  const date = art.dataset.date, hit = rideById(date, art.dataset.ride); if (!hit) return;
  const r = hit.r, f = el.dataset.f;
  if (f === 'done'){ r.done = el.checked; r.doneAt = r.done ? new Date().toISOString() : ''; if (!r.done) r.doneBy = ''; else { const p = r.nalogId && patientById(r.patientId); const n = p && (p.naloge || []).find(x => x.id === r.nalogId); if (n && n.vrsta === 'enkratna' && !n.porabljen){ n.porabljen = date; } } }
  else if (el.type === 'checkbox') r[f] = el.checked;
  else r[f] = el.value;
  save();
  if (art.classList.contains('box')) refreshBox(art);
  return { r, f };
}

/* ---------- Naslovi: CSV (WGS84 ali D96/TM), pretvorba koordinat ---------- */
function d96ToWgs84(E, N){
  const a = 6378137, f = 1 / 298.257222101, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 0.9999, lon0 = 15 * Math.PI / 180;
  const x = E - 500000, y = N + 5000000, M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s = Math.sin(phi1), c = Math.cos(phi1), t = Math.tan(phi1);
  const C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = x / (N1 * k0);
  const lat = phi1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
  return { lat:lat * 180 / Math.PI, lon:lon * 180 / Math.PI };
}
function parseCSV(text){
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { rows:[], err:'Datoteka je prazna.' };
  const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const split = l => { const out = []; let cur = '', q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === delim && !q){ out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  const head = split(lines[0]).map(norm);
  const find = re => head.findIndex(h => re.test(h));
  const iU = find(/ulic|street|^ul_|ulica/), iH = find(/^hs$|hisn|^hs_|stevilk|number|^hn$/), iD = find(/^hd$|dodatek|suffix/), iN = find(/naselj|^na_|city|place|kraj/), iO = find(/obcin|^ob_/);
  const iLa = find(/^lat|^y_wgs|sirina/), iLo = find(/^lon|^lng|^x_wgs|dolzina/), iE = find(/^e$|^e_d96|^x$|^e_/), iNn = find(/^n$|^n_d96|^y$|^n_/);
  const geo84 = iLa >= 0 && iLo >= 0, d96 = !geo84 && iE >= 0 && iNn >= 0;
  if (!geo84 && !d96 || iN < 0) return { rows:[], err:'Manjkajo stolpci: naselje in koordinate (lat, lon ali E, N v D96/TM).' };
  const rows = []; let skipped = 0;
  for (let i = 1; i < lines.length && rows.length < 25000; i++){
    const c = split(lines[i]);
    if (iO >= 0 && c[iO] && !/brezic/.test(norm(c[iO]))){ skipped++; continue; }
    let lat, lon;
    if (geo84){ lat = parseFloat((c[iLa] || '').replace(',', '.')); lon = parseFloat((c[iLo] || '').replace(',', '.')); }
    else { const E = parseFloat((c[iE] || '').replace(',', '.')), N = parseFloat((c[iNn] || '').replace(',', '.')); if (!isFinite(E) || !isFinite(N)) continue; ({ lat, lon } = d96ToWgs84(E, N)); }
    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat < 45.78 || lat > 46.08 || lon < 15.3 || lon > 15.95){ skipped++; continue; }   // izven okolice Občine Brežice
    const street = iU >= 0 ? c[iU] : '', num = ((iH >= 0 ? c[iH] : '') + (iD >= 0 ? (c[iD] || '') : '')).trim(), nas = c[iN] || '';
    const t = (street ? street + ' ' + num : nas + ' ' + num).trim() + (street && nas ? ', ' + nas : '');
    rows.push([t, +lat.toFixed(5), +lon.toFixed(5)]);
  }
  return { rows, skipped, err:rows.length ? '' : 'Ni naslovov znotraj okolice Občine Brežice. Preveri stolpce in koordinate.' };
}
function removeDemo(){
  const dutyDates = Object.keys(S.duty).filter(d => S.duty[d].some(x => x.demo));
  Object.keys(S.rides).forEach(d => { S.rides[d] = S.rides[d].map(r => r.demo ? blankRide() : r); });
  S.staff = S.staff.filter(s => !s.demo); S.patients = S.patients.filter(p => !p.demo);
  dutyDates.forEach(d => { S.duty[d] = S.duty[d].filter(x => !x.demo); if (!S.duty[d].length) delete S.duty[d]; if (S.crewBook[d]) delete S.crewBook[d]; });
  if (BACKEND !== 'firebase'){ USERS = USERS.filter(u => !u.demo); saveUsers(); }
  save();
}

/* ---------- Klik ---------- */
const armBtn = (el, label, ms = 3500) => { el.dataset.arm = '1'; el.dataset.old = el.innerHTML; el.textContent = label; setTimeout(() => { if (el.isConnected && el.dataset.arm){ el.removeAttribute('data-arm'); el.innerHTML = el.dataset.old; } }, ms); };
document.addEventListener('click', async e => {
  const t = e.target;
  if (!t.closest('#suggest') && !t.closest('[data-suggest]')) sgClose();
  const sgb = t.closest('#suggest button'); if (sgb){ sgPick(+sgb.dataset.i); return; }
  const nav = t.closest('[data-nav]'); if (nav){ if (nav.dataset.live) UI.lDate = nav.dataset.live; UI.modal = null; go(nav.dataset.nav); return; }
  const el = t.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, date = el.dataset.date;
  switch (a){
    case 'openDay': UI.date = date; go('dan'); break;
    case 'monthPrev': UI.month.m--; if (UI.month.m < 0){ UI.month.m = 11; UI.month.y--; } ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`); render(); break;
    case 'monthNext': UI.month.m++; if (UI.month.m > 11){ UI.month.m = 0; UI.month.y++; } ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`); render(); break;
    case 'monthToday': { const d = new Date(); UI.month = { y:d.getFullYear(), m:d.getMonth() }; render(); break; }
    case 'dayPrev': UI.date = addDays(UI.date, -1); ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); break;
    case 'dayNext': UI.date = addDays(UI.date, 1); ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); break;
    case 'dayToday': UI.date = todayStr(); render(); break;
    case 'dayTomorrow': UI.date = addDays(todayStr(), 1); render(); break;
    case 'filter': UI.filter = el.dataset.k; $$('[data-act=filter]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); applyFilter(); break;
    case 'loadDia': { const n = loadDialysis(UI.date); toast(n ? `Dodanih ${n} dializnih prevozov` : 'Dializni pacienti so že v knjigi ali jih ni v bazi'); rerender(); break; }
    case 'addSlots': addSlots(UI.date, 5); rerender(); toast('Dodanih 5 polj'); break;
    case 'gotoDisp': UI.dDate = date; go('dispecer'); break;
    case 'mode': { const art = el.closest('[data-ride]'); const hit = rideById(art.dataset.date, art.dataset.ride); if (hit){ hit.r.mode = el.dataset.mode; save(); refreshBox(art); } break; }
    case 'clearRide': {
      if (el.dataset.arm){ const art = el.closest('[data-ride]'); const a2 = ensureDay(art.dataset.date); const i = a2.findIndex(r => r.id === art.dataset.ride); if (i >= 0){ a2[i] = blankRide(); save(); rerender(); toast(`Polje ${i+1} počiščeno`); } }
      else { el.dataset.arm = '1'; el.classList.add('danger'); el.style.width = 'auto'; el.style.padding = '0 8px'; el.textContent = 'Počisti?'; setTimeout(() => { if (el.isConnected && el.dataset.arm){ el.removeAttribute('data-arm'); el.removeAttribute('style'); el.classList.remove('danger'); el.innerHTML = IC.x; } }, 3500); }
      break; }
    case 'savePat': { const art = el.closest('[data-ride]'); const p = savePatientFromRide(art.dataset.date, art.dataset.ride); if (p){ toast('Pacient shranjen v bazo'); rerender(); } else toast('Najprej vpiši ime pacienta'); break; }
    case 'rideView': { const art = el.closest('[data-ride]'); const hit = rideById(art.dataset.date, art.dataset.ride); if (hit) openPreview(`Prevoz št. ${hit.nr}`, rideVariants(art.dataset.date, hit.r, hit.nr)); break; }
    case 'openPatient': { if (UI.pid !== el.dataset.id) cleanupEmptyPatient(); UI.pid = el.dataset.id; UI.nid = ''; if (UI.view !== 'pacienti') go('pacienti'); else { render(); window.scrollTo(0, 0); } break; }
    case 'newPatient': { cleanupEmptyPatient(); const p = blankPatient({ color:nextColor() }); S.patients.push(p); UI.pid = p.id; UI.nid = ''; save(); render(); const n = $('#pf-name'); if (n) n.focus(); break; }
    case 'pBack': cleanupEmptyPatient(); UI.pid = ''; UI.nid = ''; render(); break;
    case 'pf': UI.pf = el.dataset.k; render(); break;
    case 'pfAlerts': UI.pf = 'opozorila'; UI.pid = ''; go('pacienti'); break;
    case 'pMode': { const p = patientById(UI.pid); if (p){ p.mode = el.dataset.mode; save(); $$('[data-act=pMode]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); refreshPatientList(); } break; }
    case 'pColor': { const p = patientById(UI.pid); if (p){ p.color = +el.dataset.c; save(); rerender(); } break; }
    case 'delPatient': { if (el.dataset.arm){ removePatient(el.dataset.id); UI.pid = ''; render(); toast('Pacient izbrisan'); } else armBtn(el, 'Potrdi brisanje'); break; }
    case 'addNalog': { const p = patientById(UI.pid); if (!p) break; const n = blankNalog(el.dataset.v); n.od = p.addr || ''; n.mode = p.mode; n.zdravnikVrsta = 'osebni'; if (p.dia && el.dataset.v === 'letna'){ n.razlog = 'Dializa'; n.do = 'SB Brežice – dializa'; } p.naloge = p.naloge || []; p.naloge.push(n); UI.nid = n.id; audit('nalog.dodan', { pid:p.id, vrsta:n.vrsta }); save(); render(); break; }
    case 'editNalog': { UI.nid = UI.nid === el.dataset.id ? '' : el.dataset.id; render(); break; }
    case 'previewNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (p && n){ audit('nalog.predogled', { pid:p.id }); openPreview(`${NALOG_VRSTE[n.vrsta].l} nalog · ${p.name}`, nalogVariants(p, n)); } break; }
    case 'renewNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (!p || !n) break; const from = addDays(n.veljaDo, 1); const m = { ...clone(n), id:uid(), veljaOd:from, veljaDo:defaultValidTo(n.vrsta, from), auto:true, stevilka:'', preklican:false, porabljen:'', created:new Date().toISOString() }; p.naloge.push(m); UI.nid = m.id; audit('nalog.podaljsan', { pid:p.id }); save(); render(); toast('Nov nalog je pripravljen. Vpiši številko in preveri datume.'); break; }
    case 'usedNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (n){ n.porabljen = n.porabljen ? '' : todayStr(); save(); render(); } break; }
    case 'cancelNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (n){ n.preklican = !n.preklican; audit('nalog.preklic', { pid:p.id, preklican:n.preklican }); save(); render(); } break; }
    case 'delNalog': { if (el.dataset.arm){ const p = patientById(UI.pid); if (p){ p.naloge = p.naloge.filter(x => x.id !== el.dataset.id); Object.values(S.rides).forEach(arr => arr.forEach(r => { if (r.nalogId === el.dataset.id) r.nalogId = ''; })); audit('nalog.izbrisan', { pid:p.id }); save(); render(); } } else armBtn(el, 'Potrdi'); break; }
    case 'closeModal': UI.modal = null; renderModal(); break;
    case 'pvVariant': UI.modal.idx = +el.dataset.i; renderModal(); break;
    case 'copyVariant': copyText(UI.modal.variants[UI.modal.idx].text, 'Kopirano'); break;
    case 'copyLine': copyText(UI.modal.variants[UI.modal.idx].text.split('\n')[+el.dataset.i], 'Vrstica kopirana'); break;
    case 'dDate': UI.dDate = date; render(); break;
    case 'lDate': UI.lDate = date; render(); break;
    case 'dayMode': { const d = UI.dDate; S.dayRules[d] = { ...(S.dayRules[d] || {}), mode:el.dataset.k }; audit('pravila.dan', { datum:d, nacin:el.dataset.k }); save(); rerender(); break; }
    case 'dayModeReset': { delete S.dayRules[UI.dDate]; save(); rerender(); break; }
    case 'ruleMode': { S.rules.mode = el.dataset.k; audit('pravila.privzeto', { nacin:el.dataset.k }); save(); render(); break; }
    case 'publish': {
      el.disabled = true; const r = await publishDay(date).catch(err => ({ ok:false, msg:String(err && err.message || err) })); el.disabled = false;
      if (r.ok) toast(`Objavljeno: ${r.runs} posadk, ${r.rides} prevozov` + (r.noAccount.length ? `. Brez računa: ${r.noAccount.join(', ')}` : '')); else toast(r.msg || 'Objava ni uspela');
      rerender(); break; }
    case 'reassign': { const hit = rideById(date, el.dataset.id); if (hit){ hit.r.status = 'nova'; hit.r.pin = ''; hit.r.runKey = ''; save(); toast('Prevoz je vrnjen v razpored. Objavi razpored znova.'); rerender(); } break; }
    case 'toggleStaffDummy': break;
    case 'toggleStaff': { const s = S.staff.find(x => x.id === el.dataset.id); if (!s) break; const list = dutyList(UI.dDate); const i = list.findIndex(d => norm(d.name) === norm(s.name)); if (i >= 0) list.splice(i, 1); else addDuty(UI.dDate, s.name, s.team); save(); rerender(); break; }
    case 'rmDuty': dutyList(UI.dDate).splice(+el.dataset.i, 1); save(); rerender(); break;
    case 'copyDuty': { const prev = S.duty[addDays(UI.dDate, -1)] || []; if (!prev.length){ toast('Prejšnji dan nima vpisanega osebja'); break; } let n = 0; prev.forEach(d => { if (addDuty(UI.dDate, d.name, d.team === 'pripravljenost' ? 'redna' : d.team)) n++; }); save(); rerender(); toast(n ? `Kopiranih ${n} zaposlenih` : 'Vsi so že vpisani'); break; }
    case 'copyPlan': copyText(planText(UI.dDate), 'Razpored kopiran'); break;
    case 'closeNotice': { const n = S.notices.find(x => x.id === el.dataset.id); if (n){ n.closed = true; if (!n.to || n.to > todayStr()) n.to = todayStr(); save(); render(); } break; }
    case 'delNotice': S.notices = S.notices.filter(x => x.id !== el.dataset.id); save(); render(); break;
    case 'setTab': UI.setTab = el.dataset.k; if (UI.setTab === 'varnost') loadAudit(); if (UI.setTab === 'uporabniki') loadRemoteUsers(); render(); break;
    case 'addVeh': S.vehicles.push({ id:uid(), name:'Novo vozilo', tip:'sanitetno', ns:'redna', sede:3, leze:0, utila:0, skupaj:3, sedeMax:3, lezeMax:0, utilaMax:0, skupajMax:3, aktiv:true }); save(); rerender(); break;
    case 'delVeh': { const v = S.vehicles[+el.dataset.i]; if (!v) break; if (el.dataset.arm){ S.vehicles.splice(+el.dataset.i, 1); save(); rerender(); } else { el.dataset.arm = '1'; el.classList.add('danger'); el.style.width = 'auto'; el.style.padding = '0 8px'; el.textContent = 'Potrdi'; } break; }
    case 'delStaff': S.staff.splice(+el.dataset.i, 1); save(); rerender(); break;
    case 'exportAddr': {
      let rows = []; try { rows = JSON.parse(store.get('kp.addr') || '[]'); } catch(e){}
      if (!rows.length){ toast('Ni uvoženih naslovov za prenos'); break; }
      const u = URL.createObjectURL(new Blob([JSON.stringify(rows)], { type:'application/json' })); const l = document.createElement('a'); l.href = u; l.download = 'naslovi.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); audit('naslovi.izvoz', { vrstic:rows.length }); break; }
    case 'clearAddr': store.del('kp.addr'); loadAddr(); rerender(); toast('Uvoženi naslovi izbrisani'); break;
    case 'clearLearned': S.addrBook = []; save(); rerender(); toast('Naučeni naslovi izbrisani'); break;
    case 'delUser': { const u = USERS.find(x => x.id === el.dataset.id); USERS = USERS.filter(x => x.id !== el.dataset.id); S.staff.forEach(s => { if (s.userId === el.dataset.id) s.userId = ''; }); saveUsers(); audit('uporabnik.izbrisan', { uporabnik:u && u.username }); save(); rerender(); break; }
    case 'reloadUsers': await loadRemoteUsers(); rerender(); break;
    case 'selfTest': { UI.selfTest = { running:true }; rerender(); const results = await runSelfTest(); UI.selfTest = { running:false, results, at:Date.now() }; audit('varnostni.preizkus', { neuspesnih:results.filter(r => r.pass === false).length }); rerender(); break; }
    case 'loadAudit': await loadAudit(); break;
    case 'rmLogo': store.del('kp.logo.' + el.dataset.k); fillLogos(); rerender(); break;
    case 'exportData': {
      if (!isAdmin()) break;
      let days = null;   // v načinu Firebase izvozimo VSE dneve iz baze (ne samo naloženega obdobja)
      if (BACKEND === 'firebase'){ try { days = {}; (await DB.list('days')).forEach(x => { days[x.id] = x.data; }); } catch(err){ days = null; toast('Opozorilo: vsi dnevi niso bili preneseni, izvoz vsebuje le naloženo obdobje.'); } }
      const json = JSON.stringify({ app:'knjiga-prevozov', version:2, state:S, addr:ADDR.list.map(x => [x.t, x.lat, x.lon]), ...(days ? { days } : {}) });
      $('#dataBox').value = json.length < 1500000 ? json : ''; audit('podatki.izvoz', { dni:days ? Object.keys(days).length : 0 });
      try { const b = new Blob([json], { type:'application/json' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `knjiga-prevozov-${todayStr()}.json`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch(err){}
      if (json.length < 1500000) copyText(json, 'Izvoz kopiran v odložišče'); else toast('Izvoz shranjen kot datoteka (prevelik za odložišče)'); break; }
    case 'importData': {
      if (!isAdmin()) break;
      try {
        const o = JSON.parse($('#dataBox').value); if (!o.state || !Array.isArray(o.state.vehicles)) throw new Error('bad');
        const def = defaultState(); S = mergeDefaults(o.state, def); normalizeState();
        if (Array.isArray(o.addr)) store.set('kp.addr', JSON.stringify(o.addr));
        if (BACKEND === 'firebase' && o.days && typeof o.days === 'object'){ for (const [d, doc] of Object.entries(o.days)){ if (/^\d{4}-\d{2}-\d{2}$/.test(d)) await DB.set('days/' + d, doc); } }
        SY.snap = {}; loadAddr(); PLAN_CACHE.clear(); rev++; audit('podatki.uvoz', { verzija:o.version || 1 }); await flush().catch(() => {}); toast('Podatki uvoženi'); rerender();
      } catch(err){ toast('Uvoz ni uspel: datoteka ni veljavna kopija'); } break; }
    case 'rmDemo': removeDemo(); rerender(); toast('Primeri odstranjeni'); break;
    case 'wipe': {
      if (BACKEND === 'firebase' || !isAdmin()) break;
      if (el.dataset.arm){ DB.wipe(); const keep = S.settings; S = defaultState(); S.settings = keep; SY.snap = {}; PLAN_CACHE.clear(); rev++; save(); rerender(); toast('Podatki izbrisani'); }
      else { el.dataset.arm = '1'; el.textContent = 'Klikni še enkrat za potrditev'; setTimeout(() => { if (el.isConnected){ el.removeAttribute('data-arm'); el.textContent = 'Izbriši vse podatke'; } }, 6000); }
      break; }
    // ----- posadka -----
    case 'cDate': UI.cDate = date; render(); break;
    case 'crewStep': { el.disabled = true; const ok = await sendStatus(UI.cDate, el.dataset.ride, el.dataset.st); if (ok) toast(`${STATUSI[el.dataset.st].s} ob ${timeOf(new Date().toISOString())}`); el.disabled = false; break; }
    case 'crewNoHome': { if (el.dataset.arm){ el.disabled = true; await sendStatus(UI.cDate, el.dataset.ride, 'ni_doma', { note:'Pacienta ni na naslovu' }); toast('Dispečer je obveščen'); } else armBtn(el, 'Potrdi: ni na naslovu'); break; }
    case 'crewDecline': { const inp = $(`[data-cnote="${el.dataset.ride}"]`); el.disabled = true; await sendStatus(UI.cDate, el.dataset.ride, 'odklonjena', { note:inp ? inp.value.trim() || 'Brez razloga' : '' }); toast('Dispečer je obveščen'); break; }
    case 'crewFix': {
      const inp = $(`[data-cfix="${el.dataset.ride}"]`); if (!inp || !inp.value) break;
      const doc = CREW.docs[UI.cDate]; const st = crewRideState(doc.runKey, el.dataset.ride); if (!st.last) break;
      const iso = new Date(`${UI.cDate}T${inp.value}:00`).toISOString();
      await sendStatus(UI.cDate, el.dataset.ride, st.last.status, { t:iso, corr:true }); toast('Ura popravljena'); break; }
  }
});

/* ---------- Vnos ---------- */
function setPf(el){
  const p = patientById(UI.pid); if (!p) return;
  const k = el.dataset.pf; p[k] = el.value;
  if (k === 'name' || k === 'phone' || k === 'addr' || k === 'dia') refreshPatientList();
  save();
}
function refreshPatientList(){
  const p = patientById(UI.pid); const rows = $('.prows'); if (!rows) return;
  const all = S.patients.slice().sort((a, b) => a.name.localeCompare(b.name, 'sl')).filter(patientMatches);
  rows.innerHTML = all.map(q => { const sm = patientNalogSummary(q); return `<button type="button" class="prow ${q.color >= 0 ? 'pc' + q.color : ''}" data-act="openPatient" data-id="${q.id}" aria-current="${UI.pid === q.id}">${avatarP(q)}<span class="pr-main"><b>${esc(q.name || '(brez imena)')}</b><span class="hint">${esc(q.addr || 'brez naslova')}${q.phone ? ' · ' + esc(q.phone) : ''}</span></span><span class="pr-side">${q.dia ? `<span class="chip mono">${esc(q.dia)}</span>` : ''}${sm.n ? nalogChip(sm.n) : '<span class="chip">brez naloga</span>'}</span></button>`; }).join('') || '<div class="empty-state">Ni pacientov za ta filter.</div>';
  const h = $('.pdetail h3'); if (h && p) h.textContent = p.name || 'Nov pacient';
}
const lastNalogAudit = {};
function setNf(el){
  const p = patientById(UI.pid); const card = el.closest('[data-nalog]'); if (!p || !card) return;
  const n = (p.naloge || []).find(x => x.id === card.dataset.nalog); if (!n) return;
  const k = el.dataset.nf; n[k] = el.value;
  if (k === 'vrsta' || k === 'veljaOd'){ if (n.auto){ n.veljaDo = defaultValidTo(n.vrsta, n.veljaOd); const d = $('#nf-veljaDo', card); if (d) d.value = n.veljaDo; } }
  if (k === 'veljaDo'){ n.auto = false; }
  const head = $('.ncard-head', card), sum = $('.ncard-sum', card), hint = $('.nform-hint', card), pv = $('[data-act=previewNalog]', card);
  const tmp = document.createElement('div'); tmp.innerHTML = nalogCardHTML(p, n);
  if (head) head.innerHTML = $('.ncard-head', tmp).innerHTML; if (sum) sum.innerHTML = $('.ncard-sum', tmp).innerHTML; if (hint) hint.innerHTML = $('.nform-hint', tmp).innerHTML;
  if (pv) pv.disabled = missingNalog(n).length > 0;
  card.className = 'ncard ' + nalogState(n).tone;
  if (k === 'od' || k === 'do') learnAddress(el.value);
  const t = Date.now(); if (!lastNalogAudit[n.id] || t - lastNalogAudit[n.id] > 60000){ lastNalogAudit[n.id] = t; audit('nalog.spremenjen', { pid:p.id }); }
  save();
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-suggest]') && document.activeElement === el) sgOpen(el);
  if (el.dataset.f && el.type !== 'checkbox' && el.tagName !== 'SELECT') onRideField(el);
  if (el.dataset.pf && el.tagName !== 'SELECT') setPf(el);
  if (el.dataset.nf && el.tagName !== 'SELECT' && el.type !== 'date') setNf(el);
  if (el.id === 'dayNote'){ S.dayNote[UI.dDate] = el.value; if (!el.value) delete S.dayNote[UI.dDate]; save(); }
  if (el.id === 'rideSearch'){ UI.q = el.value; applyFilter(); }
  if (el.id === 'patSearch'){ UI.pq = el.value; refreshPatientList(); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.f){
    const res = onRideField(el);
    if (res && (res.f === 'from' || res.f === 'to') && el.value.trim()) learnAddress(el.value);
    if (res && (res.f === 'done' || res.f === 'nalogId' || res.f === 'exc') && (el.closest('.dispatch') || res.f === 'nalogId')) rerender();
    return;
  }
  if (el.dataset.pf){ setPf(el); return; }
  if (el.dataset.nf){ setNf(el); return; }
  if (el.dataset.crew){ const [date, vid] = el.dataset.crew.split('|'); const book = S.crewBook[date] = S.crewBook[date] || {}; const cell = book[vid] = book[vid] || { text:'', manual:false }; cell.text = el.value; cell.manual = el.value.trim() !== ''; el.classList.toggle('auto', false); save(); return; }
  if (el.dataset.duty){ const i = +el.closest('[data-di]').dataset.di; const d = dutyList(UI.dDate)[i]; if (d){ d[el.dataset.duty] = el.dataset.duty === 'ot' ? (+el.value || 0) : el.value; save(); rerender(); } return; }
  if (el.dataset.act === 'vehToggle'){ const list = S.vehOff[UI.dDate] = S.vehOff[UI.dDate] || []; const i = list.indexOf(el.dataset.id); if (el.checked && i >= 0) list.splice(i, 1); if (!el.checked && i < 0) list.push(el.dataset.id); save(); rerender(); return; }
  if (el.dataset.act === 'pin'){ const hit = rideById(UI.dDate, el.dataset.ride); if (hit){ hit.r.pin = el.value; save(); rerender(); } return; }
  if (el.dataset.diaday){ const [g, d] = el.dataset.diaday.split('|'); const days = S.settings.dia[g].days; const n = +d; const i = days.indexOf(n); if (el.checked && i < 0) days.push(n); if (!el.checked && i >= 0) days.splice(i, 1); save(); return; }
  if (el.dataset.coord){ const [i, k] = el.dataset.coord.split('|').map(Number); const s = SETTLEMENTS[i]; const row = el.closest('tr'); const ins = $$('input', row); const lat = parseFloat(ins[0].value), lon = parseFloat(ins[1].value); if (!isFinite(lat) || !isFinite(lon)) return; if (lat === s.lat && lon === s.lon) delete S.coordOv[s.n]; else S.coordOv[s.n] = [lat, lon]; row.lastElementChild.innerHTML = S.coordOv[s.n] ? '<span class="chip accent">spremenjeno</span>' : ''; save(); return; }
  if (el.dataset.urole){ try { await DB.patch('users/' + el.dataset.urole, { set:{ role:el.value }, del:[], n:1 }); audit('uporabnik.vloga', { uid:el.dataset.urole, vloga:el.value }); toast('Vloga spremenjena'); } catch(err){ toast('Ni uspelo: ' + (err.code || err.message)); } loadRemoteUsers(); return; }
  if (el.dataset.uactive){ try { await DB.patch('users/' + el.dataset.uactive, { set:{ active:el.checked }, del:[], n:1 }); audit('uporabnik.aktiven', { uid:el.dataset.uactive, aktiven:el.checked }); toast(el.checked ? 'Račun aktiviran' : 'Račun onemogočen'); } catch(err){ toast('Ni uspelo: ' + (err.code || err.message)); } loadRemoteUsers(); return; }
  if (el.dataset.path){ setPath(el.dataset.path, el); if (/^staff\.\d+\.userId$/.test(el.dataset.path)) audit('zaposleni.racun', {}); return; }
  if (el.dataset.logoFile){
    const f = el.files[0]; if (!f) return;
    if (f.size > 400 * 1024){ toast('Datoteka je prevelika (največ 400 KB)'); el.value = ''; return; }
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){ toast('Dovoljeni so PNG, JPEG, WebP in SVG'); el.value = ''; return; }
    const rd = new FileReader(); rd.onload = () => { store.set('kp.logo.' + el.dataset.logoFile, String(rd.result)); fillLogos(); rerender(); toast('Logotip naložen'); }; rd.readAsDataURL(f); return;
  }
  if (el.id === 'dayPick' && el.value){ UI.date = el.value; ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); return; }
  if (el.id === 'dispPick' && el.value){ UI.dDate = el.value; render(); return; }
  if (el.id === 'csvFile' && el.files[0]){ const txt = await el.files[0].text(); const { rows, err, skipped } = parseCSV(txt); if (err){ toast(err); return; } store.set('kp.addr', JSON.stringify(rows)); loadAddr(); audit('naslovi.uvoz', { vrstic:rows.length }); toast(`Uvoženih ${rows.length} naslovov` + (skipped ? ` (preskočenih ${skipped} izven občine)` : '')); rerender(); return; }
  if (el.id === 'jsonFile' && el.files[0]){ $('#dataBox').value = await el.files[0].text(); toast('Datoteka prebrana. Klikni »Uvozi podatke«.'); }
});
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('[data-suggest]')) sgOpen(e.target); });
/* Ko se z imena pacienta premakneš naprej in ime natančno ustreza pacientu v bazi, se pacient poveže samodejno */
document.addEventListener('focusout', e => {
  const el = e.target; if (!(el.dataset && el.dataset.f === 'name')) return;
  const art = el.closest('[data-ride]'); if (!art) return;
  const hit = rideById(art.dataset.date, art.dataset.ride); if (!hit || hit.r.patientId || !hit.r.name.trim()) return;
  const p = S.patients.find(x => norm(x.name) === norm(hit.r.name)); if (!p) return;
  const next = e.relatedTarget; applyPatientToRide(art.dataset.date, art.dataset.ride, p.id); rerender();
  if (next && next.id){ const n2 = document.getElementById(next.id); if (n2) n2.focus(); }
});
document.addEventListener('mousedown', e => { if (e.target.closest('#suggest')) e.preventDefault(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.modal){ UI.modal = null; renderModal(); return; }
  if (e.key === 'Tab' && UI.modal){ const f = $$('#modal button'); if (f.length){ const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); } } }
  if (!sg.input) return;
  const n = sg.items.length;
  if (e.key === 'ArrowDown'){ e.preventDefault(); sg.idx = (sg.idx + 1) % n; sgRender(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); sg.idx = (sg.idx - 1 + n) % n; sgRender(); }
  else if (e.key === 'Enter' && sg.idx >= 0){ e.preventDefault(); sgPick(sg.idx); }
  else if (e.key === 'Escape' || e.key === 'Tab') sgClose();
});
window.addEventListener('scroll', () => { if (sg.input) sgRender(); }, { passive:true });
window.addEventListener('resize', () => { if (sg.input) sgRender(); });

/* ---------- Obrazci ---------- */
const AUTH_ERR = { 'auth/invalid-credential':'Napačno uporabniško ime ali geslo.', 'auth/wrong-password':'Napačno uporabniško ime ali geslo.', 'auth/user-not-found':'Napačno uporabniško ime ali geslo.', 'auth/invalid-email':'Neveljavno uporabniško ime.', 'auth/too-many-requests':'Preveč poskusov. Počakaj nekaj minut in poskusi znova.', 'auth/network-request-failed':'Ni povezave z internetom.', 'auth/user-disabled':'Račun je onemogočen.' };
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.form || f.id;
  try {
    if (kind === 'addDuty'){ const name = (fd.get('name') || '').trim(); if (!name) return; if (!S.staff.some(s => norm(s.name) === norm(name))) S.staff.push({ id:uid(), name, team:'redna', userId:'' }); addDuty(UI.dDate, name, (S.staff.find(s => norm(s.name) === norm(name)) || {}).team); save(); rerender(); }
    else if (kind === 'addNotice'){ S.notices.push({ id:uid(), vehicleId:fd.get('vehicleId'), tip:fd.get('tip'), from:fd.get('from'), to:fd.get('to') || '', note:(fd.get('note') || '').trim(), closed:false }); save(); render(); toast('Posebnost dodana'); }
    else if (kind === 'addStaff'){ const name = (fd.get('name') || '').trim(); if (name){ S.staff.push({ id:uid(), name, team:fd.get('team'), userId:'' }); save(); rerender(); } }
    else if (kind === 'addUser'){
      if (!isAdmin()) return;
      const un = (fd.get('username') || '').trim(), pw = fd.get('pw') || '';
      if (USERS.some(u => u.username.toLowerCase() === un.toLowerCase())){ $('#userErr').textContent = 'To uporabniško ime že obstaja.'; return; }
      if (pw.length < 10){ $('#userErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      const nu = await makeUser(un, fd.get('name') || '', fd.get('role'), pw, { staffId:fd.get('staffId') || '' }); USERS.push(nu); saveUsers();
      if (nu.staffId){ const st = S.staff.find(s => s.id === nu.staffId); if (st) st.userId = nu.id; }
      audit('uporabnik.dodan', { uporabnik:un, vloga:nu.role }); save(); rerender(); toast('Račun ustvarjen');
    }
    else if (kind === 'remoteRole'){
      if (!isAdmin()) return;
      const id = (fd.get('uid') || '').trim(); if (!/^[A-Za-z0-9]{20,40}$/.test(id)){ $('#userErr').textContent = 'UID ni veljaven (kopiraj ga iz Firebase konzole).'; return; }
      await DB.set('users/' + id, { name:(fd.get('name') || '').trim(), role:fd.get('role'), active:true });
      audit('uporabnik.vloga', { uid:id, vloga:fd.get('role') }); f.reset(); await loadRemoteUsers(); toast('Vloga shranjena');
    }
    else if (kind === 'chPw'){
      const nuPw = fd.get('pw') || ''; if (nuPw.length < 10){ $('#pwErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      if (BACKEND === 'firebase'){
        const u = DB.auth.currentUser; const cred = DB.AU.EmailAuthProvider.credential(u.email, fd.get('old'));
        try { await DB.AU.reauthenticateWithCredential(u, cred); await DB.AU.updatePassword(u, nuPw); } catch(err){ $('#pwErr').textContent = AUTH_ERR[err.code] || 'Gesla ni mogoče spremeniti.'; return; }
      } else {
        const cur = USERS.find(x => x.id === ME.id);
        const old = await hashPw(fd.get('old'), cur.salt, cur.iter); if (old !== cur.hash){ $('#pwErr').textContent = 'Staro geslo ni pravilno.'; return; }
        const nu = await makeUser(cur.username, cur.name, cur.role, nuPw, { staffId:cur.staffId || '', demo:cur.demo }); nu.id = cur.id; USERS[USERS.findIndex(u => u.id === cur.id)] = nu; saveUsers();
      }
      audit('geslo.spremenjeno', {}); f.reset(); $('#pwErr').textContent = ''; toast('Geslo spremenjeno');
    }
    else if (kind === 'setupForm'){
      const pw = fd.get('pw') || ''; if (pw.length < 10){ $('#authErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      const u = await makeUser(fd.get('username') || '', fd.get('name') || '', 'skrbnik', pw); USERS.push(u); saveUsers();
      if (fd.get('demo')) await seedDemo(pw);
      await login(u);
    }
    else if (kind === 'loginForm'){
      if (Date.now() < lockUntil){ $('#authErr').textContent = `Preveč poskusov. Počakaj ${Math.ceil((lockUntil - Date.now()) / 1000)} s.`; return; }
      const un = (fd.get('username') || '').trim().toLowerCase();
      if (BACKEND === 'firebase'){
        const email = un.includes('@') ? un : `${un}@${FB_USER_DOMAIN}`;
        try { await DB.AU.setPersistence(DB.auth, fd.get('remember') ? DB.AU.browserLocalPersistence : DB.AU.browserSessionPersistence); await DB.AU.signInWithEmailAndPassword(DB.auth, email, fd.get('pw') || ''); fails = 0; }
        catch(err){ fails++; if (fails >= 5){ lockUntil = Date.now() + 30000; fails = 0; } $('#authErr').textContent = AUTH_ERR[err.code] || 'Prijava ni uspela.'; }
        return;
      }
      const u = USERS.find(x => x.username.toLowerCase() === un);
      const h = u ? await hashPw(fd.get('pw') || '', u.salt, u.iter) : null;
      if (u && h === u.hash){ fails = 0; await login(u); }
      else { fails++; if (fails >= 5){ lockUntil = Date.now() + 30000; fails = 0; } $('#authErr').textContent = 'Napačno uporabniško ime ali geslo.'; }
    }
  } catch(err){
    if (String(err.message) === 'nosubtle') { const m = $('#authErr'); if (m) m.textContent = 'Brskalnik ne podpira varne prijave. Odpri stran prek https.'; }
    else { console.error(err); toast('Napaka: ' + (err.code || err.message)); }
  }
});
let fails = 0, lockUntil = 0;

/* ---------- Prijava / odjava ---------- */
async function login(u){
  ME = { id:u.id, name:u.name, role:u.role, staffId:u.staffId || '', username:u.username || '' };
  if (BACKEND !== 'firebase') sess.set('kp.sess', JSON.stringify({ id:u.id, t:Date.now() }));
  lastActivity = Date.now();
  $('#auth').hidden = true; $('#app').hidden = false;
  document.body.dataset.role = ME.role; $('#app').classList.toggle('crewmode', isCrew());
  $('#crewLogos').hidden = !isCrew();
  $('#uName').textContent = ME.name; $('#uRole').textContent = ROLES[ME.role] || ME.role; $('#avatar').textContent = (ME.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  fillLogos();
  const d = new Date(); UI.month = { y:d.getFullYear(), m:d.getMonth() };
  UI.date = todayStr(); UI.dDate = d.getHours() >= 12 ? addDays(todayStr(), 1) : todayStr(); UI.lDate = todayStr();
  const h = (location.hash || '').slice(1); UI.view = isCrew() ? 'moji' : (STAFF_VIEWS.includes(h) ? h : 'knjiga');
  applyTheme();
  audit('prijava', {});
  if (isCrew()){ startCrew(); render(); }
  else { render(); await startSync(); loadRemoteUsers(); render(); }
}
async function logout(msg = ''){
  if (ME) audit('odjava', {});
  const wasFb = BACKEND === 'firebase';
  stopSync(); stopCrew(); ME = null; sess.del('kp.sess');
  $('#app').hidden = true; $('#auth').hidden = false; sgClose(); UI.modal = null; renderModal();
  S = defaultState(); normalizeState(); USERS_REMOTE = []; AUDIT.length = 0; Object.keys(EVENTS).forEach(k => delete EVENTS[k]); Object.keys(RUNS).forEach(k => delete RUNS[k]);
  if (wasFb){ try { await DB.shutdown(); } catch(e){} try { sessionStorage.setItem('kp.msg', msg); } catch(e){} location.reload(); return; }
  renderAuth('login', msg);
}
document.addEventListener('click', e => {
  if (e.target.closest('#logoutBtn')) logout();
  if (e.target.closest('#themeBtn')){ const cur = store.get('kp.theme') || 'auto'; const nx = { auto:'dark', dark:'light', light:'auto' }[cur]; store.set('kp.theme', nx); applyTheme(true); }
});
function applyTheme(force){
  const t = store.get('kp.theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else if (force) delete document.documentElement.dataset.theme;
  const b = $('#themeBtn'); if (b) b.textContent = 'Tema: ' + ({ dark:'temna', light:'svetla' }[t] || 'samodejno');
}

/* ---------- Primeri (izmišljeni podatki) ---------- */
async function seedDemo(pw){
  const today = todayStr(), tom = addDays(today, 1), d = n => addDays(today, n);
  const names = [['Matej V.','redna'],['Tina R.','redna'],['Luka B.','NN'],['Nina S.','redna'],['Boštjan Z.','redna'],['Maja T.','NN']];
  S.staff = names.map(([name, team]) => ({ id:uid(), name, team, demo:true, userId:'' }));
  const st = n => S.staff.find(s => s.name === n);
  // demo računi posadke (isto geslo kot skrbnik; odstranijo se z "Odstrani vse primere")
  for (const [un, nm, role, staff] of [['voznik.demo', 'Matej V. (demo)', 'voznik', 'Matej V.'], ['spremljevalec.demo', 'Nina S. (demo)', 'spremljevalec', 'Nina S.'], ['voznik2.demo', 'Boštjan Z. (demo)', 'voznik', 'Boštjan Z.']]){
    const u = await makeUser(un, nm, role, pw, { staffId:st(staff).id, demo:true }); USERS.push(u); st(staff).userId = u.id;
  }
  saveUsers();
  const mkDuty = (n, role, team) => ({ id:uid(), name:n, staffId:st(n).id, team:team || st(n).team, role:role || 'voznik', from:'', to:'', ot:0, vehicleId:'', demo:true });
  S.duty[today] = isStandby(today) ? [mkDuty('Matej V.', 'voznik', 'pripravljenost'), mkDuty('Nina S.', 'spremljevalec', 'pripravljenost')] : [mkDuty('Matej V.'), mkDuty('Boštjan Z.'), mkDuty('Maja T.')];
  S.duty[tom] = isStandby(tom) ? [mkDuty('Tina R.', 'voznik', 'pripravljenost'), mkDuty('Nina S.', 'spremljevalec', 'pripravljenost')] : [{ ...mkDuty('Matej V.'), from:'05:30' }, mkDuty('Tina R.'), mkDuty('Luka B.'), mkDuty('Nina S.', 'spremljevalec')];
  // pacienti in nalogi (različna stanja, da se vidijo opozorila)
  const nl = (vrsta, od, do_, extra = {}) => ({ ...blankNalog(vrsta, od), veljaDo:do_, auto:false, stevilka:'DEMO-' + Math.floor(1000 + Math.random() * 9000), narocnik:'ZD Brežice (osebni zdravnik)', zdravnik:'dr. Primer Vzorec', razlog:'Dializa', od:'', do:'SB Brežice – dializa', ...extra });
  const pt = (name, addr, phone, mode, dia, naloge) => { const p = blankPatient({ name, addr, phone, mode, dia, color:nextColor(), demo:true, naloge:naloge.map(n => ({ ...n, od:n.od || addr })) }); S.patients.push(p); return p; };
  pt('Milan Dializni', 'Velike Malence 3', '031 000 201', 'sede', 'D1', [nl('letna', d(-300), d(65))]);
  pt('Vida Dializna', 'Dobova 90', '031 000 202', 'sede', 'D1', [nl('letna', d(-347), d(18))]);
  pt('Tone Dializni', 'Bizeljsko 12', '031 000 203', 'leze', 'D2', [nl('letna', d(-370), d(-5))]);
  pt('Zora Dializna', 'Čatež ob Savi 4', '031 000 204', 'sede', 'SaD4', [nl('letna', d(-30), d(335))]);
  pt('Ludvik Dializni', 'Cerklje ob Krki 30', '031 000 205', 'sede', 'D3', [nl('letna', d(-120), d(245))]);
  pt('Rozalija Dializna', 'Pišece 18', '031 000 206', 'sede', 'D3', []);
  pt('Ivan Primer', 'Dobova 25', '031 000 101', 'sede', '', [nl('mesecna', d(-21), d(9), { razlog:'Rehabilitacija', do:'UKC Ljubljana' })]);
  pt('Marija Vzorec', 'Čatež ob Savi 12', '031 000 102', 'sede', '', [nl('enkratna', tom, tom, { razlog:'Specialistični pregled', do:'UKC Ljubljana' })]);
  pt('Franc Zgled', 'Cesta prvih borcev 14, Brežice', '031 000 103', 'leze', '', [nl('zdravljenje', d(-10), d(20), { razlog:'Obsevanje', do:'Onkološki inštitut Ljubljana' })]);
  pt('Slavka Zgled', 'Artiče 21', '031 000 108', 'sede', '', []);
  const put = (date, list) => { const a = ensureDay(date); list.forEach((x, i) => { const p = S.patients.find(q => q.name === x.name); Object.assign(a[i], { ...blankRide(), mode:'sede', ...x, demo:true, patientId:p ? p.id : '', nalogId:p && activeNalog(p, date) ? activeNalog(p, date).id : '' }); }); };
  put(tom, [
    { name:'Ivan Primer', time:'08:30', from:'Dobova 25', to:'UKC Ljubljana', phone:'031 000 101' },
    { name:'Marija Vzorec', time:'08:45', from:'Čatež ob Savi 12', to:'UKC Ljubljana', phone:'031 000 102' },
    { name:'Franc Zgled', time:'09:00', from:'Cesta prvih borcev 14, Brežice', to:'UKC Ljubljana', phone:'031 000 103', mode:'leze' },
    { name:'Ana Demo', time:'10:15', from:'Bizeljsko 40', to:'SB Novo mesto', phone:'031 000 104' },
    { name:'Jože Testni', time:'11:00', from:'Pišece 7', to:'SB Brežice', phone:'031 000 105' },
    { name:'Marta Primer', time:'10:30', from:'SB Brežice', to:'Cerklje ob Krki 15', phone:'031 000 106' },
    { name:'Anton Vzorec', time:'11:00', from:'SB Brežice', to:'Sromlje 9', phone:'031 000 107' },
    { name:'Slavka Zgled', time:'13:30', from:'Artiče 21', to:'Onkološki inštitut Ljubljana', phone:'031 000 108' },
    { name:'Peter Demo', time:'14:00', from:'Obrežje 5', to:'ZD Krško', phone:'031 000 109' }
  ]);
  put(today, [
    { name:'Darja Primer', time:'07:30', from:'Dobova 8', to:'SB Brežice', phone:'031 000 111', done:true, doneBy:'Matej V.' },
    { name:'Janez Vzorec', time:'09:00', from:'Mostec 4', to:'SB Brežice', phone:'031 000 112', done:true, doneBy:'Boštjan Z.' },
    { name:'Olga Zgled', time:'12:30', from:'SB Brežice', to:'Globoko 6', phone:'031 000 113' },
    { name:'Viktor Demo', time:'13:15', from:'Čatež ob Savi 31', to:'SB Celje', phone:'031 000 114', mode:'leze' }
  ]);
  [today, tom].forEach(dd => { loadDialysis(dd); });
}

/* ---------- Zagon ---------- */
async function boot(){
  applyTheme();
  S = defaultState(); normalizeState(); loadAddr(); loadSharedAddr(); fillLogos();
  let msg = ''; try { msg = sessionStorage.getItem('kp.msg') || ''; sessionStorage.removeItem('kp.msg'); } catch(e){}
  if (BACKEND === 'firebase'){
    $('#auth').hidden = false; renderAuth('login', 'Povezujem …');
    try { DB = await firebaseAdapter(); }
    catch(err){ console.error(err); renderAuth('login', 'Povezava s Firebase ni uspela. Preveri internet in config.js.'); return; }
    DB.onError = (what, err) => { if (err && err.code === 'permission-denied') toast('Dostop zavrnjen: ' + what); };
    let authMsg = msg;   // sporočilo, ki preživi odjavo (Firebase po signOut sproži še en klic z user = null)
    DB.AU.onAuthStateChanged(DB.auth, async user => {
      if (ME || !user){ if (!user && !ME){ renderAuth('login', authMsg); authMsg = ''; } return; }
      let prof = null; try { prof = await DB.get('users/' + user.uid); } catch(e){}
      if (!prof || !prof.role || prof.active === false){ authMsg = 'Račun nima dodeljene vloge ali je onemogočen. Obrni se na skrbnika.'; await DB.AU.signOut(DB.auth); return; }
      await login({ id:user.uid, name:prof.name || user.email, role:prof.role });
    });
    return;
  }
  DB = localAdapter();
  try { USERS = JSON.parse(store.get('kp.users') || '[]'); } catch(e){ USERS = []; }
  let sessUser = null;
  try { const s = JSON.parse(sess.get('kp.sess') || 'null'); if (s) sessUser = USERS.find(u => u.id === s.id); } catch(e){}
  if (sessUser){ await login(sessUser); }
  else { $('#auth').hidden = false; renderAuth('login', msg); }
}
boot();
