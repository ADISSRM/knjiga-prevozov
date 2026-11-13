/* =====================================================================
   NATANČNA KILOMETRINA: Google Maps Platform (Routes API, računanje poti OD → DO)
   Za vsak prevoz se razdalja OD → DO izračuna z Googlom (cestna razdalja po najboljši poti za osebni avto, kot v Google Zemljevidih).
   Google vrne tudi natančne koordinate obeh naslovov; planer jih uporabi namesto središča naselja (točnejši čas vožnje, ETA, združevanje).
   Dogovor o podatkih:
   - Google dobi SAMO besedilo naslova OD in DO (npr. »Dobova 25« in »UKC Ljubljana«). Ne dobi imena pacienta, telefona, naloga ali ure.
   - Rezultat (km, vir, koordinati) se shrani v vpis prevoza (knjiga = poslovna evidenca). Predpomnilnik poti je samo v pomnilniku.
   - Brez ključa ali izklopljeno: aplikacija računa po cestah OpenStreetMap (OSRM), brez tega pa oceni. Vir je pri vsakem km označen.
   Ključ API (HTTP referrer omejitev!) je v config.js (google.key) ali samo na tej napravi (Nastavitve → Izračun).
   ===================================================================== */
const GOOGLE = (() => {
  const GC = (window.KP_CONFIG && window.KP_CONFIG.google) || {};
  const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const MASK_TWO = 'routes.distanceMeters,routes.duration,routes.legs.startLocation,routes.legs.endLocation';
  const MASK_MULTI = 'routes.distanceMeters,routes.duration,routes.legs.distanceMeters,routes.legs.duration,routes.legs.startLocation,routes.legs.endLocation';
  const cache = new Map();        // 'od>do' (poizvedbi) -> rezultat
  const inflight = new Map();
  const wait = [];
  let active = 0, coolUntil = 0;
  const R = { status:'idle', err:'', lastOk:0, calls:0, errors:0, version:0, concurrency:2, minGap:120, onUpdate:null, fetch:(u, o) => fetch(u, o) };

  const keyVal = () => (store.get('kp.gkey') || GC.key || '').trim();
  const configured = () => /^[A-Za-z0-9_\-]{20,}$/.test(keyVal());
  const gs = () => (typeof S !== 'undefined' && S && S.settings && S.settings.google) || { on:true, auto:true, traffic:false };
  const enabled = () => configured() && gs().on !== false;
  const auto = () => enabled() && gs().auto !== false && Date.now() >= coolUntil;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* Besedilo naslova → poizvedba za Google. Ustanova/klinika (brez hišne številke): polno ime in naslov; sicer vpisan naslov + država. */
  const FOREIGN = /(sloveni|hrva|croat|avstri|austri|ital|madzar|hungar)/i;
  const HR_TOWNS = ['Zagreb', 'Samobor', 'Jastrebarsko', 'Krapina'];
  function queryOf(text){
    const t = String(text || '').replace(/\s+/g, ' ').trim(); if (!t) return '';
    let g = null; try { g = geo(t); } catch(e){ g = null; }
    if (g && g.kind === 'poi' && g.poi && g.poi.gq && !/\d/.test(t)) return g.poi.gq;
    if (g && g.kind === 'neznano' && g.poi && g.poi.gq && !/\d/.test(t)) return g.poi.gq;
    if (FOREIGN.test(t)) return t;
    return t + ((g && g.kind === 'mesto' && HR_TOWNS.includes(g.label)) ? ', Hrvaška' : ', Slovenija');
  }
  const wp = q => (typeof q === 'string' ? { address:q } : { location:{ latLng:{ latitude:q.lat, longitude:q.lon } } });
  const ll = o => (o && o.latLng && isFinite(o.latLng.latitude) && isFinite(o.latLng.longitude)) ? [+o.latLng.latitude, +o.latLng.longitude] : null;
  const secs = d => { const m = /^(\d+(?:\.\d+)?)s$/.exec(String(d || '')); return m ? +m[1] : null; };

  function setStatus(st, err){ R.status = st; R.err = err || ''; if (R.onUpdate){ try { R.onUpdate('status'); } catch(e){} } }
  function explain(status, httpStatus, msg){
    const m = String(msg || '');
    if (httpStatus === 403 || /PERMISSION_DENIED|API_KEY|referer|not authorized|has not been used|disabled/i.test(status + m)){
      if (/referer|referrer/i.test(m)) return 'Ključ ni dovoljen za ta naslov strani (omejitev HTTP referrer). Dodaj naslov strani v omejitve ključa.';
      if (/has not been used|disabled|not enabled/i.test(m)) return 'Routes API ni vklopljen v projektu (Google Cloud → APIs → Routes API → Enable).';
      return 'Google je zavrnil ključ (preveri ključ, omejitve in da je vklopljen Routes API in obračun).';
    }
    if (httpStatus === 400 && /API key|API_KEY/i.test(m)) return 'Ključ API ni veljaven.';
    if (httpStatus === 400) return 'Google ne razume naslova ali zahtevka' + (m ? ' (' + m.slice(0, 120) + ')' : '') + '.';
    if (httpStatus === 404 || status === 'NOT_FOUND') return 'Google ne najde enega od naslovov.';
    if (httpStatus === 429 || status === 'RESOURCE_EXHAUSTED') return 'Presežena kvota ali preveč zahtevkov (Google). Poskusi pozneje.';
    return 'Napaka Google (' + (httpStatus || 'brez povezave') + ')' + (m ? ': ' + m.slice(0, 120) : '') + '.';
  }
  const AUTH_ERR = e => e && (e.http === 403 || (e.http === 400 && /API key/i.test(e.message || '')));

  async function post(body, mask, tries = 2){
    const key = keyVal(); if (!configured()) throw Object.assign(new Error('Ključ Google ni nastavljen.'), { code:'nokey' });
    let last = null;
    for (let i = 0; i <= tries; i++){
      if (i) await sleep(600 * i);
      let r;
      R.calls++;
      try {
        r = await R.fetch(ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Goog-Api-Key':key, 'X-Goog-FieldMask':mask }, body:JSON.stringify(body), credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin' });   // Referer (samo izvor strani) je potreben za omejitev ključa; ostalih povezav to ne spremeni
      } catch(e){ last = Object.assign(new Error('Brez povezave z Google (' + (e && e.message || 'napaka') + ').'), { code:'net' }); continue; }
      let data = null; try { data = await r.json(); } catch(e){ data = null; }
      if (r.status >= 200 && r.status < 300) return data || {};
      const er = (data && data.error) || {};
      last = Object.assign(new Error(explain(er.status, r.status, er.message)), { http:r.status, gstatus:er.status || '', code:'http' });
      if (r.status === 429 || r.status >= 500) continue;
      break;
    }
    throw last || new Error('Napaka Google.');
  }

  /* Izvajanje po vrsti (največ 2 hkrati), da nas ne zaustavi kvota in da je poraba predvidljiva. */
  function run(job){
    return new Promise((res, rej) => { wait.push({ job, res, rej }); pump(); });
  }
  async function pump(){
    while (active < R.concurrency && wait.length){
      const w = wait.shift(); active++;
      (async () => {
        try { const v = await w.job(); w.res(v); }
        catch(e){ w.rej(e); }
        finally { active--; if (R.minGap) await sleep(R.minGap); pump(); }
      })();
    }
  }

  /* Razdalja in čas OD → DO (vozni, brez prometa razen če je vklopljeno). Vrne { km, min, f:[lat,lon], t:[lat,lon], q:{f,t} } */
  function ride(fromText, toText, o = {}){
    const qf = queryOf(fromText), qt = queryOf(toText);
    if (!qf || !qt) return Promise.reject(Object.assign(new Error('Manjka naslov OD ali DO.'), { code:'empty' }));
    if (!enabled()) return Promise.reject(Object.assign(new Error('Google ni vklopljen.'), { code:'off' }));
    const traffic = !!gs().traffic && !!o.departIso;
    const k = qf + '>' + qt + (traffic ? '@' + o.departIso.slice(0, 13) : '');
    if (!o.fresh && cache.has(k)) return Promise.resolve(cache.get(k));
    if (inflight.has(k)) return inflight.get(k);
    const p = run(async () => {
      const body = { origin:wp(qf), destination:wp(qt), travelMode:'DRIVE', routingPreference:traffic ? 'TRAFFIC_AWARE' : 'TRAFFIC_UNAWARE', languageCode:'sl-SI', regionCode:'SI', units:'METRIC' };
      if (traffic) body.departureTime = o.departIso;
      const t0 = Date.now();
      const d = await post(body, MASK_TWO);
      const rt = d && d.routes && d.routes[0];
      if (!rt || !isFinite(rt.distanceMeters)) throw Object.assign(new Error('Google ne najde poti med naslovoma.'), { code:'noroute' });
      const lg = (rt.legs && rt.legs[0]) || {};
      const out = { km:rt.distanceMeters / 1000, min:(secs(rt.duration) || 0) / 60, f:ll(lg.startLocation), t:ll(lg.endLocation), q:{ f:qf, t:qt }, ms:Date.now() - t0, at:new Date().toISOString() };
      cache.set(k, out); R.lastOk = Date.now(); R.version++; setStatus('ok');
      return out;
    }).catch(e => { R.errors++; setStatus('error', e.message); if (AUTH_ERR(e)) coolUntil = Date.now() + 120000; throw e; })
      .finally(() => inflight.delete(k));
    inflight.set(k, p);
    return p;
  }

  /* Vožnja z več postanki (npr. postaja → pacient 1 → pacient 2 → cilj → postaja): skupni km in km po odsekih. points: [{q}|{lat,lon}] */
  async function multi(points){
    if (!enabled()) throw Object.assign(new Error('Google ni vklopljen.'), { code:'off' });
    const wps = points.map(p => wp(p.q ? p.q : p));
    if (wps.length < 2) throw new Error('Premalo točk.');
    const k = 'M:' + JSON.stringify(wps);
    if (cache.has(k)) return cache.get(k);
    return run(async () => {
      const body = { origin:wps[0], destination:wps[wps.length - 1], intermediates:wps.slice(1, -1), travelMode:'DRIVE', routingPreference:'TRAFFIC_UNAWARE', languageCode:'sl-SI', regionCode:'SI', units:'METRIC' };
      const d = await post(body, MASK_MULTI), rt = d && d.routes && d.routes[0];
      if (!rt) throw Object.assign(new Error('Google ne najde poti.'), { code:'noroute' });
      const out = { km:rt.distanceMeters / 1000, min:(secs(rt.duration) || 0) / 60, legs:(rt.legs || []).map(l => ({ km:(l.distanceMeters || 0) / 1000, min:(secs(l.duration) || 0) / 60 })) };
      cache.set(k, out); R.lastOk = Date.now(); setStatus('ok'); return out;
    }).catch(e => { setStatus('error', e.message); throw e; });
  }

  async function test(){
    if (!configured()) return { ok:false, msg:'Ključ Google ni nastavljen (config.js → google.key ali vpiši v polje spodaj).' };
    const t0 = Date.now();
    try {
      const r = await ride('Splošna bolnišnica Brežice, Brežice', 'UKC Ljubljana, Zaloška cesta 2, Ljubljana', { fresh:true });
      const ok = r.km > 80 && r.km < 160;
      return { ok, km:r.km, min:r.min, ms:Date.now() - t0, msg:ok ? 'Povezava z Googlom deluje.' : 'Google je vrnil nenavadno razdaljo (' + r.km.toFixed(1) + ' km). Preveri naslove.' };
    } catch(e){ return { ok:false, msg:e.message, code:e.code }; }
  }
  function clear(){ cache.clear(); inflight.clear(); R.version++; coolUntil = 0; setStatus('idle'); }
  function forget(){ clear(); wait.length = 0; }
  const info = () => ({ configured:configured(), on:enabled(), auto:auto(), traffic:!!gs().traffic, status:R.status, err:R.err, calls:R.calls, errors:R.errors, cached:cache.size, queued:wait.length + active, lastOk:R.lastOk, cooling:Math.max(0, coolUntil - Date.now()), keyTail:keyVal() ? '…' + keyVal().slice(-4) : '' });
  Object.assign(R, { configured, enabled, auto, queryOf, ride, multi, test, clear, forget, info, ENDPOINT });
  return R;
})();

/* =====================================================================
   KILOMETRINA PREVOZA (vpis v knjigi): km OD → DO, vir, natančnost, zastarelost, samodejni izračun
   Dva načina računanja (KM.engine()):
   - 'osm' (BREZPLAČNO, privzeto): točka naslova iz OpenStreetMap (37-geocode.js: ulica + hišna številka) in cestna razdalja OSRM (38-routing.js)
   - 'google' (neobvezno, ko je vnesen ključ): Google Routes API, kot v Google Zemljevidih
   Polja prevoza: km (OD → DO), kmBack (DO → OD, samo ko reševalec počaka na pregled), kmSrc ('osm' | 'google' | 'rocno'), kk (besedilo OD>DO ob izračunu),
   gf / gt (koordinate OD in DO), gp (natančnost točk [OD, DO]: hisna | ulica | nejasno | naselje | ustanova | rocno), kmAt (čas izračuna).
   ===================================================================== */
const KM = (() => {
  const timers = new Map();
  const r1 = x => Math.round(x * 10) / 10;
  const fmtKm = x => (x == null || !isFinite(x)) ? '–' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
  const fresh = r => r.km != null && (r.kmSrc === 'rocno' || r.kk === rideKk(r));
  const needBack = r => +r.stay > 0 && r.kmBack == null && r.kmSrc !== 'rocno';          // čakanje je bilo vklopljeno po izračunu: manjka pot nazaj
  const done = r => fresh(r) && (r.kmSrc === 'rocno' || (r.gf && r.gt)) && !needBack(r);
  const SRC = { osm:'naslov + ceste OSM', google:'Google', rocno:'ročno', osrm:'ceste OSM', ocena:'ocena' };
  /* Način računanja: Google, če je vnesen ključ; sicer brezplačno OSM (iskanje naslova + OSRM). */
  const engine = () => GOOGLE.enabled() ? 'google' : ((GEOC.enabled() && ROUTE.enabled()) ? 'osm' : '');
  const can = () => engine() !== '';
  const autoOn = () => { const e = engine(); return e === 'google' ? GOOGLE.auto() : e === 'osm' ? GEOC.auto() : false; };
  const queued = () => GOOGLE.info().queued + GEOC.info().queued;
  const precOf = r => (r.kmSrc === 'osm' && Array.isArray(r.gp)) ? r.gp : null;
  const precExact = r => { const p = precOf(r); return !p || p.every(x => GEOC.exactPrec(x)); };
  /* Km prevoza za prikaz: shranjeno (Google ali ročno) ali sproti iz cestnih podatkov (OSM) oziroma ocena. */
  function info(r){
    const stay = +r.stay > 0;
    if (r.from && r.to && fresh(r)){
      const back = stay ? (r.kmBack != null ? r.kmBack : r.km) : 0;
      const ex = precExact(r);
      return { km:r.km, back, total:r.km + back, src:r.kmSrc || 'google', exact:ex, backExact:ex && (!stay || r.kmBack != null), prec:precOf(r) };
    }
    if (!(r.from || '').trim() || !(r.to || '').trim()) return { km:null, back:0, total:null, src:'', exact:false };
    const L = makeLeg(S.settings), l = L(ridePt(r, 'from'), ridePt(r, 'to')), src = l.real ? 'osrm' : 'ocena';
    return { km:l.km, back:stay ? l.km : 0, total:l.km * (stay ? 2 : 1), src, exact:false, backExact:false };
  }
  /* Izračun kilometrine za en prevoz (OD → DO in, če počaka, DO → OD): brezplačno z OSM ali z Googlom, če je ključ. Rezultat se zavrže, če se je besedilo medtem spremenilo. */
  async function ensure(date, id, o = {}){
    const hit = rideById(date, id); if (!hit) return null;
    const r0 = hit.r; if (!isFilled(r0) || r0.odpovedano || !(r0.from || '').trim() || !(r0.to || '').trim()) return null;
    const eng = engine(); if (!eng) return null;
    if (!o.force && done(r0)) return null;
    const kk0 = rideKk(r0), departIso = r0.time ? new Date(`${date}T${r0.time}:00`).toISOString() : '';
    let a, b = null, fa = null, ta = null;
    try {
      if (eng === 'google'){
        a = await GOOGLE.ride(r0.from, r0.to, { fresh:!!o.force, departIso });
        if (+r0.stay > 0) b = await GOOGLE.ride(r0.to, r0.from, { fresh:!!o.force, departIso });
      } else {
        fa = await GEOC.resolve(r0.from, { fresh:!!o.force }); ta = await GEOC.resolve(r0.to, { fresh:!!o.force });
        a = await ROUTE.exact(fa, ta);
        if (+r0.stay > 0) b = await ROUTE.exact(ta, fa);
      }
    } catch(e){ if (o.silent !== false && e.code !== 'off') note(id, e.message); return null; }
    const cur = rideById(date, id); if (!cur) return null;
    const r = cur.r; if (rideKk(r) !== kk0) return null;   // naslov se je medtem spremenil
    if (r.kmSrc === 'rocno' && !o.force) return null;      // dispečer je med izračunom vpisal km ročno: ročni vnos ima prednost
    if (eng === 'google'){ r.km = r1(a.km); r.kmBack = b ? r1(b.km) : null; r.kmSrc = 'google'; r.gf = a.f; r.gt = a.t; r.gp = null; r.kmWarn = ''; r.kmAt = a.at; }
    else {
      r.km = r1(a.km); r.kmBack = b ? r1(b.km) : null; r.kmSrc = 'osm'; r.gf = [fa.lat, fa.lon]; r.gt = [ta.lat, ta.lon]; r.gp = [fa.prec, ta.prec]; r.kmAt = new Date().toISOString();
      r.kmWarn = [fa.warn && 'OD: ' + fa.warn, ta.warn && 'DO: ' + ta.warn].filter(Boolean).join(' · ');
      if (Math.max(...a.snap) > 400) r.kmWarn = (r.kmWarn ? r.kmWarn + ' · ' : '') + 'točka je več kot 400 m od ceste';
    }
    r.kk = kk0;
    save(); if (KM.onUpdate) KM.onUpdate(date, id);
    return r;
  }
  const noted = new Map();
  function note(id, msg){ const t = Date.now(); if (noted.get('m') === msg && t - (noted.get('t') || 0) < 60000) return; noted.set('m', msg); noted.set('t', t); if (typeof toast === 'function') toast('Kilometrina: ' + msg); }
  function schedule(date, id){
    if (!autoOn()) return;
    const k = date + '|' + id; clearTimeout(timers.get(k));
    timers.set(k, setTimeout(() => { timers.delete(k); ensure(date, id); }, engine() === 'osm' ? 1500 : 900));   // OSM: iskanje šele, ko vnos mirujejo (pravilo Nominatim: brez samodokončanja)
  }
  /* Dispečer je na zemljevidu popravil točko naslova: vsi prevozi od včeraj naprej s tem naslovom se izračunajo znova (pretekli ostanejo, kot so bili zapisani). */
  function refix(text, from = addDays(todayStr(), -1)){
    const k = GEOC.key(text); let n = 0;
    Object.keys(S.rides || {}).forEach(date => {
      if (date < from) return;
      (S.rides[date] || []).forEach(r => {
        if (!isFilled(r) || r.odpovedano || r.kmSrc === 'rocno') return;
        if (GEOC.key(r.from || '') === k || GEOC.key(r.to || '') === k){ r.kk = ''; n++; schedule(date, r.id); }
      });
    });
    if (n) save();
    return n;
  }
  /* Vsi prevozi dneva brez svežega km (samodejno ob odprtju dneva ali na gumb) */
  function day(date, o = {}){
    const todo = filledRides(date).filter(({ r }) => !r.odpovedano && r.kmSrc !== 'rocno' && (o.force || !done(r))).map(({ r }) => r.id);   // ročni vnos km se pri množičnem preračunu ne prepiše
    return Promise.all(todo.map(id => ensure(date, id, { force:!!o.force, silent:false }))).then(() => todo.length);
  }
  function setManual(date, id, val){
    const hit = rideById(date, id); if (!hit) return;
    const r = hit.r, v = parseFloat(String(val).replace(',', '.'));
    if (!isFinite(v) || v < 0){ r.km = null; r.kmBack = null; r.kmSrc = ''; r.kk = ''; }
    else { r.km = r1(v); r.kmSrc = 'rocno'; r.kk = rideKk(r); r.kmAt = new Date().toISOString(); }
    save();
  }
  /* Poročilo za mesec: prevozi z km in viri; seštevki po dnevih in vozilih */
  function month(y, m){
    const n = daysInMonth(y, m), rows = [], days = [], veh = {};
    let tot = 0, ex = 0, miss = 0;
    for (let d = 1; d <= n; d++){
      const date = `${y}-${pad(m + 1)}-${pad(d)}`, list = filledRides(date).filter(({ r }) => !r.odpovedano);
      if (!list.length) continue;
      const plan = computePlan(date); let dt = 0;
      list.forEach(({ r, nr }) => {
        const i = info(r), a = plan.assign[r.id];
        const vehName = a ? a.veh : '';
        rows.push({ date, nr, r, i, veh:vehName });
        if (i.total != null){ tot += i.total; dt += i.total; if (i.exact) ex += i.total; if (vehName){ veh[vehName] = (veh[vehName] || 0) + i.total; } } else miss++;
      });
      days.push({ date, km:dt, n:list.length, vehKm:plan.totals.km });
    }
    return { rows, days, veh, total:tot, exact:ex, missing:miss };
  }
  const csvCell = v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function csv(y, m, withNames = true){
    const rep = month(y, m);
    const head = ['datum', 'št.', 'ura', ...(withNames ? ['pacient'] : []), 'od', 'do', 'način', 'km OD→DO', 'km nazaj', 'km skupaj', 'vir', 'vozilo'];
    const lines = [head.join(';')].concat(rep.rows.map(x => [x.date, x.nr, x.r.time, ...(withNames ? [x.r.name] : []), x.r.from, x.r.to, MODES[x.r.mode] || x.r.mode,
      x.i.km == null ? '' : fmtKm(x.i.km), x.i.back ? fmtKm(x.i.back) : '', x.i.total == null ? '' : fmtKm(x.i.total), SRC[x.i.src] || '', x.veh].map(csvCell).join(';')));
    lines.push(['', '', '', ...(withNames ? [''] : []), '', '', 'SKUPAJ', '', '', fmtKm(rep.total), '', ''].join(';'));
    return '﻿' + lines.join('\r\n');
  }
  return { onUpdate:null, fresh, info, ensure, schedule, refix, day, setManual, month, csv, fmtKm, SRC, r1, engine, can, auto:autoOn, queued };
})();
