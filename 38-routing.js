/* =====================================================================
   CESTNO USMERJANJE: pravi cestni podatki iz OpenStreetMap (OSRM)
   Razdalja in trajanje vožnje po dejanskem cestnem omrežju (ne zračna črta). Planer (40-planner.js) bere podatke
   SINHRONO iz predpomnilnika; kar manjka, se v ozadju prenese (OSRM »table«) in razpored se nato sam ponovno izračuna.
   Dokler podatkov ni, planer uporabi OCENO (zračna črta × faktor) in to vedno pokaže (»ocena«).

   Kaj gre ven iz brskalnika: SAMO koordinate (lat, lon) točk. Nikoli imena, naslovi kot besedilo, telefoni ali ID-ji.
   Brez piškotkov, brez »Referer« glave. Točke hišnih naslovov (uvoz CSV) so samo v pomnilniku, nikoli v trajnem predpomnilniku.
   Strežnik: config.js → routing.url (privzeto javni OSRM; priporočen lasten strežnik, glej NAVODILA.md).
   Pomoč pri težavah: Nastavitve → Planiranje → »Preveri cestne podatke«.
   Podatki o cestah: © prispevajoči k OpenStreetMap (ODbL).
   ===================================================================== */
const ROUTE = (() => {
  const RC = (window.KP_CONFIG && window.KP_CONFIG.routing) || {};
  const DEF_URLS = ['https://router.project-osrm.org', 'https://routing.openstreetmap.de/routed-car'];
  const urls = () => (RC.url === undefined ? DEF_URLS : [].concat(RC.url || [], RC.fallback || []))
    .filter(x => typeof x === 'string' && /^https:\/\//.test(x)).map(x => x.replace(/\/+$/, ''));
  const NONE = Object.freeze({ m:-1, s:-1 });                 // OSRM: poti ni
  const cache = new Map();                                    // 'ključ>ključ' -> [metri, sekunde]  (-1 = poti ni)
  const gen = new Set();                                      // ključi splošnih točk (naselje, ustanova, mesto): smejo v trajni predpomnilnik
  const pending = new Map();                                  // točke, za katere manjkajo razdalje
  const snapFar = new Map();                                  // ključ točke -> razdalja do najbližje ceste (m)
  const geoCache = new Map();
  let shared = null;                                          // vnaprej pripravljena matrika razdalje.json
  let timer = null, busy = false, coolUntil = 0, backoff = 0, saveTimer = null, chg = 0, active = 0;
  const R = { version:0, status:'idle', err:'', url:'', lastOk:0, gap:350, timeoutMs:15000, onUpdate:null, fetch:(u, o) => fetch(u, o) };

  const key = p => p.lat.toFixed(5) + ',' + p.lon.toFixed(5);
  const enabled = () => urls().length > 0 && !(typeof S !== 'undefined' && S && S.settings && S.settings.routing && S.settings.routing.on === false);
  const routable = p => !!p && isFinite(p.lat) && isFinite(p.lon) && p.kind !== 'neznano' && p.kind !== 'prazno';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function setStatus(st, err){ R.status = st; R.err = err || ''; }
  function notify(kind){ if (R.onUpdate){ try { R.onUpdate(kind); } catch(e){ console.error(e); } } }

  /* ---------- Branje (sinhrono) ---------- */
  function lookup(a, b){
    const ka = key(a), kb = key(b);
    if (ka === kb) return { m:0, s:0 };
    if (shared){
      const i = shared.idx.get(ka), j = shared.idx.get(kb);
      if (i !== undefined && j !== undefined){ const m = shared.d[i * shared.n + j]; if (m >= 0) return { m, s:shared.t[i * shared.n + j] }; }
    }
    const v = cache.get(ka + '>' + kb);
    return v ? (v[0] < 0 ? NONE : { m:v[0], s:v[1] }) : null;
  }
  function want(a, b){
    if (Date.now() < coolUntil) return;
    [a, b].forEach(p => { const k = key(p); if (!pending.has(k)) pending.set(k, { key:k, lat:p.lat, lon:p.lon, gen:p.kind !== 'addr' }); });
    if (!timer && !busy) timer = setTimeout(() => { timer = null; flush(); }, 150);
  }
  /* Vrne { km, min } (min brez faktorja) ali null, če podatka ni (takrat se zahteva prenos in uporabi ocena). */
  function leg(a, b){
    if (!enabled() || !routable(a) || !routable(b)) return null;
    const v = lookup(a, b);
    if (v === NONE) return null;
    if (v) return { km:v.m / 1000, min:v.s / 60 };
    want(a, b); return null;
  }

  /* ---------- Omrežje ---------- */
  async function http(path){
    const list = urls(); if (!list.length) throw new Error('Cestni strežnik ni nastavljen (config.js → routing.url).');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Ni povezave z internetom.');
    let last = null;
    for (let k = 0; k < list.length; k++){
      const base = list[(active + k) % list.length];
      for (let attempt = 0; attempt < 2; attempt++){
        const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const to = setTimeout(() => { if (ac) ac.abort(); }, R.timeoutMs);
        try {
          const res = await R.fetch(base + path, { method:'GET', mode:'cors', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', signal:ac ? ac.signal : undefined });
          clearTimeout(to);
          if (res.status === 429){ last = new Error('Strežnik omejuje število zahtev (429).'); await sleep(attempt ? 0 : 1500); if (attempt) break; continue; }
          let j = null; try { j = await res.json(); } catch(e){}
          if (res.status >= 500){ last = new Error('Strežnik ' + res.status); break; }
          if (!j){ last = new Error('Neveljaven odgovor strežnika (' + res.status + ').'); break; }
          active = (active + k) % list.length; R.url = base;
          return j;
        } catch(e){ clearTimeout(to); last = e && e.name === 'AbortError' ? new Error('Strežnik ne odgovarja (časovna omejitev).') : e; break; }
      }
    }
    throw last || new Error('Cestni strežnik ni dosegljiv.');
  }

  /* Matrika vseh parov med točkami (bloki po 40 koordinat na vsako stran: največ 80 na zahtevek, javni OSRM dovoli 100). */
  async function fetchMatrix(pts, progress){
    const B = 40, blocks = [];
    for (let i0 = 0; i0 < pts.length; i0 += B) for (let j0 = 0; j0 < pts.length; j0 += B) blocks.push([pts.slice(i0, i0 + B), pts.slice(j0, j0 + B)]);
    let done = 0;
    for (const [src, dst] of blocks){
      done++;
      let need = false;
      for (const a of src){ for (const b of dst){ if (a.key !== b.key && !lookup(a, b)){ need = true; break; } } if (need) break; }
      if (!need){ if (progress) progress(done, blocks.length); continue; }
      const coords = [], idx = new Map();
      const add = p => { if (!idx.has(p.key)){ idx.set(p.key, coords.length); coords.push(p); } return idx.get(p.key); };
      const si = src.map(add), di = dst.map(add);
      const path = '/table/v1/driving/' + coords.map(p => p.lon.toFixed(5) + ',' + p.lat.toFixed(5)).join(';') + '?sources=' + si.join(';') + '&destinations=' + di.join(';') + '&annotations=duration,distance';
      const res = await http(path);
      if (res.code !== 'Ok' || !Array.isArray(res.durations) || !Array.isArray(res.distances)) throw new Error('OSRM: ' + (res.code || 'neveljaven odgovor') + (res.message ? ' – ' + res.message : '') + (res.code === 'Ok' ? ' (strežnik ne vrača razdalj)' : ''));
      src.forEach((a, x) => {
        if (res.sources && res.sources[x] && isFinite(res.sources[x].distance)) snapFar.set(a.key, res.sources[x].distance);
        dst.forEach((b, y) => {
          if (a.key === b.key) return;
          const dur = res.durations[x] && res.durations[x][y], dis = res.distances[x] && res.distances[x][y];
          cache.set(a.key + '>' + b.key, (dur == null || dis == null) ? [-1, -1] : [Math.round(dis), Math.round(dur)]);
          if (a.gen) gen.add(a.key); if (b.gen) gen.add(b.key);
          chg++;
        });
      });
      if (cache.size > 45000){ let n = 0; for (const k of cache.keys()){ cache.delete(k); if (++n >= 5000) break; } }
      if (progress) progress(done, blocks.length);
      if (done < blocks.length && R.gap) await sleep(R.gap);
    }
  }

  async function flush(){
    if (busy) return;
    busy = true; setStatus('loading'); chg = 0; notify('status');
    try {
      while (pending.size){
        const pts = [...pending.values()].slice(0, 160); pts.forEach(p => pending.delete(p.key));
        try { await fetchMatrix(pts); } catch(e){ pts.forEach(p => pending.set(p.key, p)); throw e; }
      }
      backoff = 0; coolUntil = 0; R.lastOk = Date.now(); setStatus('ok');
    } catch(e){
      backoff = Math.min(300000, (backoff || 15000) * 2); coolUntil = Date.now() + backoff;
      setStatus('error', String((e && e.message) || e));
      if (!timer) timer = setTimeout(() => { timer = null; if (pending.size) flush(); }, backoff + 50);
    } finally { busy = false; }
    if (chg){ R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); persistSoon(); }
    notify(chg ? 'data' : 'status');
  }
  /* Počakaj, da se manjkajoči podatki prenesejo (npr. pred objavo razporeda), največ ms. */
  function settle(ms = 9000){
    return new Promise(res => { const t0 = Date.now(); const tick = () => { if ((!busy && !timer && !pending.size) || Date.now() - t0 > ms || Date.now() < coolUntil) return res(); setTimeout(tick, 80); }; tick(); });
  }

  /* ---------- Trajni predpomnilnik: samo splošne točke (naselja, ustanove, mesta) ---------- */
  function persistSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(persist, 1500); }
  function persist(){
    try {
      const pts = [], ix = new Map(), p = []; let n = 0;
      const id = k => { if (!ix.has(k)){ ix.set(k, pts.length); pts.push(k); } return ix.get(k); };
      for (const [pk, v] of cache){ const [ka, kb] = pk.split('>'); if (!gen.has(ka) || !gen.has(kb)) continue; p.push(id(ka), id(kb), v[0], v[1]); if (++n >= 30000) break; }
      store.set('kp.route.v1', JSON.stringify({ v:1, pts, p }));
    } catch(e){}
  }
  function loadLocal(){
    try {
      const o = JSON.parse(store.get('kp.route.v1') || 'null'); if (!o || o.v !== 1 || !Array.isArray(o.p)) return;
      for (let i = 0; i + 3 < o.p.length; i += 4){ const ka = o.pts[o.p[i]], kb = o.pts[o.p[i + 1]]; if (!ka || !kb) continue; cache.set(ka + '>' + kb, [o.p[i + 2], o.p[i + 3]]); gen.add(ka); gen.add(kb); }
    } catch(e){}
  }
  /* Skupna datoteka razdalje.json (v mapi spletne strani, poleg index.html): enaka na vseh napravah, brez klicev strežnika. */
  function setShared(o){
    if (!o || o.v !== 1 || !Array.isArray(o.pts) || !Array.isArray(o.d) || !Array.isArray(o.t)) return false;
    const n = o.pts.length; if (o.d.length !== n * n || o.t.length !== n * n) return false;
    const idx = new Map(); o.pts.forEach((q, i) => idx.set(q[0].toFixed(5) + ',' + q[1].toFixed(5), i));
    shared = { n, idx, d:Int32Array.from(o.d), t:Int32Array.from(o.t), built:o.built || '' };
    return true;
  }
  async function loadShared(){
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    try { const r = await fetch('razdalje.json', { cache:'no-cache' }); if (!r.ok) return; if (setShared(await r.json())){ R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); notify('data'); } } catch(e){}
  }
  function init(){ loadLocal(); loadShared(); }

  /* ---------- Vse relacije vnaprej (naselja, ustanove, mesta) ---------- */
  function warmPoints(){
    const m = new Map();
    const add = p => { const k = key(p); if (!m.has(k)) m.set(k, { key:k, lat:p.lat, lon:p.lon, gen:true }); };
    SETTLEMENTS.forEach(s => add(S ? settlementPoint(s) : s)); POIS.forEach(add); TOWNS.forEach(add);
    return [...m.values()];
  }
  async function warm(progress){
    if (!enabled()) throw new Error('Cestni podatki so izklopljeni.');
    if (busy) throw new Error('Prenos že poteka.');
    busy = true; setStatus('loading'); chg = 0;
    try { await fetchMatrix(warmPoints(), progress); setStatus('ok'); R.lastOk = Date.now(); }
    catch(e){ setStatus('error', String((e && e.message) || e)); throw e; }
    finally { busy = false; if (chg){ R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); persist(); } notify('data'); }
    return chg;
  }
  function exportShared(){
    const pts = warmPoints(), n = pts.length, d = new Array(n * n), t = new Array(n * n); let missing = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const v = i === j ? { m:0, s:0 } : lookup(pts[i], pts[j]);
      if (v && v !== NONE){ d[i * n + j] = v.m; t[i * n + j] = v.s; } else { d[i * n + j] = -1; t[i * n + j] = -1; missing++; }
    }
    return { v:1, built:new Date().toISOString(), source:'OpenStreetMap / OSRM', pts:pts.map(p => [+p.lat.toFixed(5), +p.lon.toFixed(5)]), d, t, missing };
  }

  /* ---------- Geometrija poti (za prikaz na karti) ---------- */
  async function path(points){
    const pts = points.filter(routable).filter((p, i, a) => !i || key(p) !== key(a[i - 1]));
    if (pts.length < 2) return null;
    const k = pts.map(key).join('|');
    if (geoCache.has(k)) return geoCache.get(k);
    const res = await http('/route/v1/driving/' + pts.map(p => p.lon.toFixed(5) + ',' + p.lat.toFixed(5)).join(';') + '?overview=simplified&geometries=geojson&steps=false');
    if (res.code !== 'Ok' || !res.routes || !res.routes[0]) throw new Error('OSRM: ' + (res.code || 'brez poti'));
    const r0 = res.routes[0];
    const out = { km:r0.distance / 1000, min:r0.duration / 60, coords:(r0.geometry && r0.geometry.coordinates) || [], pts };
    geoCache.set(k, out); if (geoCache.size > 80) geoCache.delete(geoCache.keys().next().value);
    return out;
  }
  const pathCached = points => { const pts = points.filter(routable).filter((p, i, a) => !i || key(p) !== key(a[i - 1])); return geoCache.get(pts.map(key).join('|')) || null; };

  /* ---------- Preizkus povezave: ZD Brežice → UKC Ljubljana ---------- */
  async function test(){
    const a = BASE_POI, b = POIS.find(p => p.n === 'UKC Ljubljana'), t0 = Date.now();
    const out = { ok:false, ms:0, url:'', km:0, min:0, msg:'' };
    if (!urls().length){ out.msg = 'Cestni strežnik ni nastavljen (config.js → routing.url).'; return out; }
    try {
      const j = await http('/route/v1/driving/' + a.lon.toFixed(5) + ',' + a.lat.toFixed(5) + ';' + b.lon.toFixed(5) + ',' + b.lat.toFixed(5) + '?overview=false');
      out.ms = Date.now() - t0; out.url = R.url;
      if (j.code !== 'Ok' || !j.routes || !j.routes[0]){ out.msg = 'Odgovor strežnika: ' + (j.code || '?') + (j.message ? ' – ' + j.message : ''); return out; }
      out.km = j.routes[0].distance / 1000; out.min = j.routes[0].duration / 60;
      const sane = out.km > 70 && out.km < 160 && out.min > 40 && out.min < 150;
      out.ok = sane; out.msg = sane ? 'Povezava deluje.' : 'Strežnik je odgovoril, a vrednosti so nenavadne (pričakovano ≈ 100 km, ≈ 65 min). Preveri, ali strežnik vsebuje zemljevid Slovenije.';
      setStatus(sane ? 'ok' : R.status, '');
    } catch(e){ out.ms = Date.now() - t0; out.msg = 'Povezava ni uspela: ' + String((e && e.message) || e); setStatus('error', out.msg); }
    return out;
  }

  function clear(){ cache.clear(); gen.clear(); pending.clear(); snapFar.clear(); geoCache.clear(); coolUntil = 0; backoff = 0; store.del('kp.route.v1'); R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); notify('data'); }
  /* Ob odjavi: pozabi vse, kar ni splošna točka (npr. hišni naslovi pacientov), in geometrije poti. Splošne točke ostanejo v predpomnilniku. */
  function forget(){
    for (const k of [...cache.keys()]){ const [a, b] = k.split('>'); if (!gen.has(a) || !gen.has(b)) cache.delete(k); }
    for (const k of [...snapFar.keys()]) if (!gen.has(k)) snapFar.delete(k);
    for (const [k, v] of [...pending]) if (!v.gen) pending.delete(k);
    geoCache.clear(); R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear();
  }
  const info = () => ({ on:enabled(), configured:urls().length > 0, urls:urls(), status:R.status, err:R.err, url:R.url, cached:cache.size, shared:shared ? shared.n : 0, sharedBuilt:shared ? shared.built : '', pending:pending.size, busy, cooling:Math.max(0, coolUntil - Date.now()) });

  Object.assign(R, { enabled, routable, key, leg, lookup, init, settle, flush, warm, warmPoints, exportShared, setShared, path, pathCached, test, clear, forget, info, snapFar:p => snapFar.get(key(p)) || 0, fetchMatrix, persist, retry:() => { coolUntil = 0; backoff = 0; if (pending.size) flush(); } });
  return R;
})();
