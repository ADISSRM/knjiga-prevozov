/* =====================================================================
   RAZPORED: dnevne knjige, dializa, parjenje voznikov in vozil, združevanje in vrstni red prevozov
   Čas vožnje je OCENA: zračna razdalja × faktor ceste; prvih 10 km po lokalnih cestah, preostanek po hitrejših.
   ===================================================================== */
import { setupDynamicOSMAutocomplete } from './brezice-osm-autocomplete.js';

const PLAN_CACHE = new Map();

/* ---------- Knjiga: polja ---------- */
const blankRide = () => ({ id:uid(), name:'', time:'', from:'', to:'', phone:'', mode:'sede', dia:'', diaKey:'', done:false, doneBy:'', doneAt:'', pin:'', demo:false,
  patientId:'', nalogId:'', note:'', exc:false, odpovedano:false, prevStatus:'', status:'nova', times:{}, statusBy:'', runKey:'' });
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
const isHelperRole = r => r === 'student' || r === 'dijak';
const ROLE_TAG = { spremljevalec:'sp.', student:'štud.', dijak:'dij.' };
/* Posadka = voznik + spremljevalec (NN in pripravljenost: 2 reševalca samodejno). Študent in dijak sta dodatna pomočnika,
   ne vozita in ne nadomestita spremljevalca. Leže pacient vedno potrebuje voznika + spremljevalca in vozilo z nosili. */
function pairCrews(date){
  const duty = S.duty[date] || [];
  const split = !!(S.dayRules[date] && S.dayRules[date].split);   // ekipa se razdeli: vsak je voznik v svojem vozilu
  const veh = availableVehicles(date);
  const used = new Set(), crews = [], notes = [];
  const roleMap = new Map(), roleOf = d => roleMap.get(d) || d.role || 'voznik';
  if (!split) ['NN', 'pripravljenost'].forEach(tm => {   // 2 reševalca v ekipi: eden je voznik, drugi spremljevalec
    const V = duty.filter(d => d.team === tm && !isHelperRole(roleOf(d)) && roleOf(d) !== 'spremljevalec');
    const E = duty.filter(d => d.team === tm && roleOf(d) === 'spremljevalec
