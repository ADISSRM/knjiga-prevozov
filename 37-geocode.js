/* =====================================================================
   NASLOVI → TOČKE (brezplačno): ulica in hišna številka iz OpenStreetMap (Nominatim)
   Zakaj: kilometrina OD → DO je točna le, če je točka naslova pravi naslov in ne središče naselja. Za ustanove in klinike so koordinate
   v aplikaciji že znane. Za hišne naslove (»Dobova 25«, »Cesta prvih borcev 18, Brežice«) se tukaj poišče točka, razdaljo po cesti pa
   nato izračuna OSRM (38-routing.js, ROUTE.exact). Tako kilometrina ni več odvisna od Google Zemljevidov.

   Kaj gre ven iz brskalnika: SAMO besedilo naslova (npr. »Dobova 25«), brez imena pacienta, telefona, naloga ali ure. Strežnik vidi še IP naslov
   naprave in izvor strani (Referer), kot zahtevajo pravila javnega strežnika (operations.osmfoundation.org/policies/nominatim).
   Pravila tega strežnika, ki jih aplikacija upošteva: največ 1 zahtevek na sekundo (vrsta, razmik 1,1 s), rezultati se ne iščejo znova
   (pomnilnik seje, polje pacienta gc in ročni popravki S.geoFix), brez samodokončanja med tipkanjem (iskanje šele po potrditvi vnosa).
   Natančnost vsake točke je zapisana (hisna | ulica | naselje | ustanova | rocno) in se pokaže ob kilometrini: ~ pomeni, da OSM za ta naslov
   nima hišne številke. Takrat dispečer točko popravi na zemljevidu (shrani se v S.geoFix in velja za vse naprave).
   Podatki: © prispevajoči k OpenStreetMap (ODbL). Lasten strežnik ali drug Nominatim-združljiv: config.js → geocode.url.
   ===================================================================== */
const GEOC = (() => {
  const GC = (window.KP_CONFIG && window.KP_CONFIG.geocode) || {};
  const DEF_URL = 'https://nominatim.openstreetmap.org';
  const base = () => { const u = GC.url === undefined ? DEF_URL : String(GC.url || ''); return /^https:\/\//.test(u) ? u.replace(/\/+$/, '') : ''; };
  const gs = () => (typeof S !== 'undefined' && S && S.settings && S.settings.geocode) || { on:true, auto:true };
  const enabled = () => !!base() && gs().on !== false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mem = new Map();          // ključ naslova -> rezultat (samo ta seja)
  const inflight = new Map();
  const neg = new Map();           // naslovi, ki jih OSM ne pozna: 10 minut se ne iščejo znova
  const wait = [];
  let running = false, coolUntil = 0, lastCall = 0;
  const R = { status:'idle', err:'', calls:0, errors:0, lastOk:0, minGap:1100, timeoutMs:12000, onUpdate:null, fetch:(u, o) => fetch(u, o) };

  const PREC = { hisna:'hišna številka', ulica:'samo ulica', nejasno:'kraj ni potrjen', naselje:'središče naselja', ustanova:'ustanova', rocno:'točka na zemljevidu' };
  const RANK = { rocno:0, ustanova:0, hisna:0, ulica:1, nejasno:1, naselje:2 };
  const exactPrec = p => RANK[p] === 0;
  const worst = (a, b) => (RANK[a] ?? 2) >= (RANK[b] ?? 2) ? a : b;
  const key = t => norm(t).replace(/[,.;]+/g, ' ').replace(/\s+/g, ' ').trim();
  const dkm = (a, b, c, d) => { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  function setStatus(st, err){ R.status = st; R.err = err || ''; if (R.onUpdate){ try { R.onUpdate('status'); } catch(e){} } }

  /* ---------- Ročni popravki točk (S.geoFix: ključ -> [lat, lon, čas]) in točke pacientov (p.gc) ---------- */
  const fixOf = k => { const f = (typeof S !== 'undefined' && S && S.geoFix) ? S.geoFix[k] : null; return f && isFinite(f[0]) && isFinite(f[1]) ? f : null; };
  const patientHit = k => { const ps = (typeof S !== 'undefined' && S && S.patients) || []; for (const p of ps) if (p.gc && p.gc.k === k && p.addr && key(p.addr) === k && isFinite(p.gc.lat) && isFinite(p.gc.lon)) return p.gc; return null; };
  function remember(k, res){
    mem.set(k, res);
    if (res.src !== 'osm') return;
    let any = false;
    for (const p of ((typeof S !== 'undefined' && S && S.patients) || [])) if (p.addr && key(p.addr) === k){ p.gc = { k, lat:+res.lat.toFixed(6), lon:+res.lon.toFixed(6), prec:res.prec, at:new Date().toISOString() }; any = true; }
    if (any && typeof save === 'function') save();
  }
  function setFix(text, lat, lon){
    const k = key(text); if (!k || !isFinite(lat) || !isFinite(lon)) return false;
    S.geoFix = S.geoFix || {}; S.geoFix[k] = [+(+lat).toFixed(6), +(+lon).toFixed(6), new Date().toISOString()];
    mem.delete(k); for (const p of S.patients || []) if (p.gc && p.gc.k === k) delete p.gc;
    save(); return true;
  }
  function clearFix(text){ const k = key(text); if (S.geoFix && S.geoFix[k]){ delete S.geoFix[k]; mem.delete(k); save(); return true; } return false; }
  const hasFix = text => !!fixOf(key(text));

  /* ---------- Kaj je treba iskati ---------- */
  const HR_TOWN = /(hrva|croat|zagreb|samobor|jastrebarsko|krapina)/i;
  function analyse(text){
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return { mode:'empty', t };
    let g = null; try { g = geo(t); } catch(e){ g = null; }
    if (!g || g.kind === 'prazno') return { mode:'empty', t };
    if (g.kind === 'poi') return { mode:'poi', t, g };
    if (g.kind === 'addr') return { mode:'import', t, g };
    const settl = g.kind === 'naselje' || g.kind === 'mesto';
    if (/\d/.test(t)) return { mode:'search', t, g, cen:settl ? g : null };
    return settl ? { mode:'settlement', t, g } : { mode:'unknown', t, g };
  }
  const isPoint = res => res && isFinite(res.lat) && isFinite(res.lon);

  /* ---------- Nominatim ---------- */
  function classify(x){
    const a = x.address || {};
    if (a.house_number || (+x.place_rank >= 28)) return 'hisna';
    if (x.category === 'highway' || x.class === 'highway' || (+x.place_rank >= 26 && +x.place_rank <= 27)) return 'ulica';
    return 'naselje';
  }
  async function http(path){
    const b = base(); if (!b) throw Object.assign(new Error('Iskanje naslovov ni nastavljeno (config.js → geocode.url).'), { code:'off' });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw Object.assign(new Error('Ni povezave z internetom.'), { code:'net' });
    const gap = lastCall + R.minGap - Date.now(); if (gap > 0) await sleep(gap);
    lastCall = Date.now(); R.calls++;
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(() => { if (ac) ac.abort(); }, R.timeoutMs);
    let res;
    try { res = await R.fetch(b + path, { method:'GET', mode:'cors', credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin', signal:ac ? ac.signal : undefined }); }
    catch(e){ clearTimeout(to); throw Object.assign(new Error(e && e.name === 'AbortError' ? 'Strežnik za naslove ne odgovarja (časovna omejitev).' : 'Brez povezave s strežnikom za naslove.'), { code:'net' }); }
    clearTimeout(to);
    if (res.status === 429){ coolUntil = Date.now() + 60000; throw Object.assign(new Error('Strežnik za naslove omejuje število zahtev (429). Počakam minuto.'), { code:'limit' }); }
    if (res.status === 403 || res.status === 401){ coolUntil = Date.now() + 600000; throw Object.assign(new Error('Strežnik za naslove je zavrnil zahtevek (' + res.status + '): preveri, da stran teče na https in da ni blokiran Referer.'), { code:'blocked' }); }
    if (res.status >= 500) throw Object.assign(new Error('Strežnik za naslove ima težavo (' + res.status + ').'), { code:'net' });
    let j = null; try { j = await res.json(); } catch(e){ j = null; }
    if (!Array.isArray(j)) throw Object.assign(new Error('Neveljaven odgovor strežnika za naslove.'), { code:'net' });
    return j;
  }
  function searchPath(q, o = {}){
    const p = ['format=jsonv2', 'addressdetails=1', 'limit=5', 'dedupe=1', 'accept-language=sl', 'countrycodes=' + (o.cc || 'si'), 'q=' + encodeURIComponent(q)];
    if (o.box){ p.push('viewbox=' + o.box.map(x => x.toFixed(5)).join(','), 'bounded=1'); }
    else if (o.bias){ p.push('viewbox=15.10000,46.15000,16.10000,45.70000'); }          // kraj ni naveden: raje zadetek v Posavju (ne omeji)
    if (GC.email) p.push('email=' + encodeURIComponent(GC.email));
    return '/search?' + p.join('&');
  }
  const queue = job => new Promise((res, rej) => { wait.push({ job, res, rej }); pump(); });
  async function pump(){
    if (running) return; running = true;
    try {
      while (wait.length){
        const w = wait.shift();
        try { w.res(await w.job()); } catch(e){ w.rej(e); }
      }
    } finally { running = false; }
  }

  /* Najdi točko za besedilo naslova. Vrne { lat, lon, prec, src, warn? } ali zavrne z napako (code: empty | off | net | limit | blocked | unknown). */
  function resolve(text, o = {}){
    const an = analyse(text), k = key(text);
    if (an.mode === 'empty') return Promise.reject(Object.assign(new Error('Naslov je prazen.'), { code:'empty' }));
    if (an.mode === 'poi'){ const p = an.g; return Promise.resolve({ lat:p.lat, lon:p.lon, prec:'ustanova', src:'poi' }); }
    const fx = fixOf(k); if (fx) return Promise.resolve({ lat:fx[0], lon:fx[1], prec:'rocno', src:'rocno' });
    if (an.mode === 'import') return Promise.resolve({ lat:an.g.lat, lon:an.g.lon, prec:'hisna', src:'uvoz' });
    if (an.mode === 'unknown') return Promise.reject(Object.assign(new Error('Naslov ni prepoznan: dodaj kraj ali hišno številko.'), { code:'unknown' }));
    if (an.mode === 'settlement') return Promise.resolve({ lat:an.g.lat, lon:an.g.lon, prec:'naselje', src:'naselje', warn:'brez hišne številke' });
    if (!o.fresh){
      if (mem.has(k)) return Promise.resolve(mem.get(k));
      const pg = patientHit(k); if (pg) return Promise.resolve({ lat:pg.lat, lon:pg.lon, prec:pg.prec || 'hisna', src:'osm' });
    }
    if (!enabled()) return Promise.reject(Object.assign(new Error('Iskanje naslovov je izklopljeno (Nastavitve → Izračun).'), { code:'off' }));
    if (Date.now() < coolUntil) return Promise.reject(Object.assign(new Error(R.err || 'Iskanje naslovov počiva (omejitev strežnika).'), { code:'limit' }));
    if (inflight.has(k)) return inflight.get(k);
    if ((neg.get(k) || 0) > Date.now() && !o.fresh) return Promise.reject(Object.assign(new Error('Naslova ni mogoče najti v OpenStreetMap: dodaj kraj ali popravi zapis.'), { code:'unknown' }));
    const p = queue(() => lookup(an, k)).catch(e => { if (e.code === 'unknown') neg.set(k, Date.now() + 600000); else { R.errors++; setStatus('error', e.message); } throw e; }).finally(() => inflight.delete(k));
    inflight.set(k, p); return p;
  }
  async function lookup(an, k){
    const cen = an.cen, g = an.g, hr = HR_TOWN.test(an.t) || (g.kind === 'mesto' && HR_TOWN.test(g.label || ''));
    let q = an.t;
    const town = String((cen && cen.label) || '').split(' - ')[0];
    if (cen && town && !norm(q).includes(norm(town))) q += ', ' + town;       // »Cankarjeva 5« brez kraja → naselje, ki ga je app prepoznala
    const o = { cc:hr ? 'hr' : (cen ? 'si' : 'si,hr'), bias:!cen && !hr };
    let list = [];
    if (cen){ const dLon = cen.kind === 'mesto' ? 0.14 : 0.09, dLat = cen.kind === 'mesto' ? 0.1 : 0.065; list = await http(searchPath(q, { ...o, box:[cen.lon - dLon, cen.lat + dLat, cen.lon + dLon, cen.lat - dLat] })); }
    if (!list.length) list = await http(searchPath(q, o));
    const maxOff = cen ? (cen.kind === 'mesto' ? 16 : 9) : 1e9;
    let hit = null;
    for (const x of list){
      const lat = +x.lat, lon = +x.lon; if (!isFinite(lat) || !isFinite(lon)) continue;
      if (cen && dkm(lat, lon, cen.lat, cen.lon) > maxOff) continue;       // zadetek v drugem kraju (npr. isto ime ulice drugje): ne zaupaj
      hit = { lat, lon, prec:classify(x), src:'osm', disp:String(x.display_name || '').slice(0, 160) }; break;
    }
    let res;
    if (hit){
      if (!cen && hit.prec !== 'naselje'){ hit.prec = 'nejasno'; hit.warn = 'kraj ni naveden ali prepoznan: preveri točko na zemljevidu'; }
      else if (hit.prec === 'naselje') hit.warn = 'OSM nima ulice ali hišne številke';
      else if (hit.prec === 'ulica') hit.warn = 'OSM nima te hišne številke (točka je na ulici)';
      res = hit;
    } else if (cen){
      res = { lat:cen.lat, lon:cen.lon, prec:'naselje', src:'naselje', warn:'naslova ni v OSM: uporabljeno središče naselja' };
    } else {
      throw Object.assign(new Error('Naslova ni mogoče najti v OpenStreetMap: dodaj kraj ali popravi zapis.'), { code:'unknown' });
    }
    R.lastOk = Date.now(); setStatus('ok');
    if (res.src === 'osm') remember(k, res); else mem.set(k, res);
    return res;
  }

  /* Preizkus: poišče Zdravstveni dom Brežice in primerja z znano točko postaje (en zahtevek). */
  async function test(){
    const t0 = Date.now();
    if (!base()) return { ok:false, msg:'Iskanje naslovov ni nastavljeno (config.js → geocode.url).' };
    try {
      const list = await queue(() => http(searchPath('Zdravstveni dom Brežice, Brežice', { cc:'si' })));
      const x = list.find(y => isFinite(+y.lat) && isFinite(+y.lon) && dkm(+y.lat, +y.lon, BASE_POI.lat, BASE_POI.lon) < 3);
      if (!x) return { ok:false, ms:Date.now() - t0, msg:'Strežnik je odgovoril, a Zdravstvenega doma Brežice ni našel v bližini postaje.' };
      const d = Math.round(dkm(+x.lat, +x.lon, BASE_POI.lat, BASE_POI.lon) * 1000);
      setStatus('ok'); R.lastOk = Date.now();
      return { ok:true, ms:Date.now() - t0, d, prec:classify(x), msg:'Povezava deluje.' };
    } catch(e){ setStatus('error', e.message); return { ok:false, ms:Date.now() - t0, msg:e.message, code:e.code }; }
  }

  const auto = () => enabled() && gs().auto !== false && Date.now() >= coolUntil;
  function clear(){ mem.clear(); neg.clear(); inflight.clear(); coolUntil = 0; setStatus('idle'); }
  /* Ob odjavi pozabi vse naslove iz pomnilnika (točke pacientov ostanejo samo v njihovem zapisu v bazi). */
  function forget(){ clear(); wait.length = 0; }
  const info = () => ({ configured:!!base(), on:enabled(), auto:auto(), status:R.status, err:R.err, calls:R.calls, errors:R.errors, cached:mem.size, queued:wait.length + (running ? 1 : 0), lastOk:R.lastOk, cooling:Math.max(0, coolUntil - Date.now()), host:(() => { try { return new URL(base()).host; } catch(e){ return ''; } })() });
  Object.assign(R, { enabled, auto, resolve, analyse, classify, setFix, clearFix, hasFix, test, clear, forget, info, key, PREC, RANK, exactPrec, worst, searchPath, isPoint, dkm });
  return R;
})();
