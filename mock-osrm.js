'use strict';
/* Poenostavljen OSRM strežnik za preizkuse (brez omrežja). Odgovarja v obliki dokumentiranega OSRM v5 HTTP API-ja:
   /table/v1/driving/{lon,lat;…}?sources=…&destinations=…&annotations=duration,distance
   /route/v1/driving/{lon,lat;…}?overview=…&geometries=geojson
   Razdalja = zračna × 1,28 (+0,4 km); hitrost narašča z dolžino poti (naselje → avtocesta). Ni prava cestna mreža: preverja samo pogodbo in logiko. */
const hav = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dLa = r(b[1] - a[1]), dLo = r(b[0] - a[0]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const roadKm = (a, b) => hav(a, b) * 1.28 + 0.4;
const roadSec = km => { const s1 = Math.min(km, 8), s2 = Math.min(Math.max(km - 8, 0), 25), s3 = Math.max(km - 33, 0); return (s1 / 45 + s2 / 75 + s3 / 105) * 3600; };
function createMock(opts = {}){
  const log = [], bases = {};
  const handler = base => async (url, init) => {
    const u = new URL(url); const path = u.pathname.replace(/^\/routed-car/, '');
    log.push({ base, url:String(url), init });
    const down = typeof opts.down === 'function' ? opts.down(base, log.length) : (opts.down && opts.down[base]);
    if (down === 'throw') throw new TypeError('Failed to fetch');
    if (typeof down === 'number') return { status:down, json: async () => ({ code:'Error' }) };
    const m = path.match(/^\/(table|route)\/v1\/driving\/([^?]+)$/); if (!m) return { status:400, json: async () => ({ code:'InvalidUrl' }) };
    const coords = m[2].split(';').map(s => s.split(',').map(Number));
    if (coords.length > (opts.maxTable || 100)) return { status:400, json: async () => ({ code:'TooBig' }) };
    if (m[1] === 'table'){
      const q = u.searchParams, si = q.get('sources') ? q.get('sources').split(';').map(Number) : coords.map((_, i) => i), di = q.get('destinations') ? q.get('destinations').split(';').map(Number) : coords.map((_, i) => i);
      const wantDist = (q.get('annotations') || '').includes('distance');
      const dur = si.map(i => di.map(j => i === j ? 0 : (opts.noRoute && opts.noRoute(coords[i], coords[j]) ? null : roadSec(roadKm(coords[i], coords[j])))));
      const dis = si.map(i => di.map(j => i === j ? 0 : (opts.noRoute && opts.noRoute(coords[i], coords[j]) ? null : roadKm(coords[i], coords[j]) * 1000)));
      const wp = idx => idx.map(i => ({ hint:'x', distance:opts.snap ? opts.snap(coords[i]) : 35, name:'', location:coords[i] }));
      const body = { code:'Ok', durations:dur, sources:wp(si), destinations:wp(di) }; if (wantDist && !opts.noDistances) body.distances = dis;
      return { status:200, json: async () => body };
    }
    let km = 0, sec = 0; const line = [coords[0]];
    for (let i = 1; i < coords.length; i++){ const k = roadKm(coords[i - 1], coords[i]); km += k; sec += roadSec(k); line.push([(coords[i - 1][0] + coords[i][0]) / 2 + 0.01, (coords[i - 1][1] + coords[i][1]) / 2 + 0.005], coords[i]); }
    return { status:200, json: async () => ({ code:'Ok', routes:[{ distance:km * 1000, duration:sec, geometry:{ type:'LineString', coordinates:line }, legs:[] }], waypoints:[] }) };
  };
  const fetchFor = async (url, init) => { const base = Object.keys(bases).find(b => String(url).startsWith(b)) || String(url).split('/').slice(0, 3).join('/'); return handler(base)(url, init); };
  return { fetch:fetchFor, log, roadKm, roadSec, hav };
}
module.exports = { createMock, roadKm, roadSec, hav };
