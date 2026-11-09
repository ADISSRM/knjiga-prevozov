'use strict';
/* Poenostavljen Google Routes API za preizkuse (brez omrežja). Obliko zahtevka in odgovora povzema dokumentacija
   (POST https://routes.googleapis.com/directions/v2:computeRoutes, glave X-Goog-Api-Key in X-Goog-FieldMask; odgovor routes[].distanceMeters,
   duration »123s«, legs[].startLocation.latLng / endLocation.latLng). Naslovi se razrešijo s tabelo; razdalja = zračna × 1,25.
   Ni pravi Google: preverja pogodbo in logiko aplikacije. Prava povezava: Nastavitve → Izračun → »Preveri Google«. */
const PLACES = [
  [/o[cč]esna klinika/i, [46.0567, 14.5170]], [/kardiolo/i, [46.0540, 14.5262]], [/UKC Ljubljana|Zalo[sš]ka/i, [46.0540, 14.5250]], [/Ljubljana/i, [46.0511, 14.5051]],
  [/Dobova 25/i, [45.8991, 15.6572]], [/Dobova 30/i, [45.9002, 15.6590]], [/Dobova/i, [45.9000, 15.6600]], [/Bizeljsko/i, [46.0210, 15.7110]],
  [/Splošna bolnišnica Brežice|SB Brežice/i, [45.9033, 15.5902]], [/Brežice/i, [45.9040, 15.5930]], [/Novo mesto/i, [45.8044, 15.1689]], [/Zagreb/i, [45.8150, 15.9819]], [/Pišece/i, [46.0000, 15.4600]]
];
const hav = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
function createGoogleMock(opts = {}){
  const log = [];
  const resolve = w => {
    if (w.location) return [w.location.latLng.latitude, w.location.latLng.longitude];
    const hit = PLACES.find(p => p[0].test(w.address || '')); return hit ? hit[1].slice() : null;
  };
  const fetch = async (url, init) => {
    log.push({ url:String(url), init, body:JSON.parse(init.body) });
    const n = log.length;
    if (typeof opts.fail === 'function'){ const f = opts.fail(n, JSON.parse(init.body)); if (f === 'throw') throw new TypeError('Failed to fetch'); if (f) return { status:f.status, json: async () => ({ error:{ code:f.status, message:f.message || '', status:f.gstatus || '' } }) }; }
    if (String(url) !== 'https://routes.googleapis.com/directions/v2:computeRoutes') return { status:404, json: async () => ({}) };
    if (!init.headers['X-Goog-Api-Key']) return { status:403, json: async () => ({ error:{ code:403, message:'API key not valid', status:'PERMISSION_DENIED' } }) };
    if (!init.headers['X-Goog-FieldMask']) return { status:400, json: async () => ({ error:{ code:400, message:'FieldMask is required', status:'INVALID_ARGUMENT' } }) };
    const b = JSON.parse(init.body), pts = [b.origin, ...(b.intermediates || []), b.destination].map(resolve);
    if (pts.some(p => !p)) return { status:200, json: async () => ({}) };            // ZERO_RESULTS: odgovor brez poti
    let m = 0; const legs = [];
    for (let i = 1; i < pts.length; i++){ const d = Math.round(hav(pts[i - 1], pts[i]) * 1250 + 150); m += d; legs.push({ distanceMeters:d, duration:Math.round(d / 1000 / 70 * 3600) + 's', startLocation:{ latLng:{ latitude:pts[i - 1][0] + 0.0001, longitude:pts[i - 1][1] } }, endLocation:{ latLng:{ latitude:pts[i][0] + 0.0001, longitude:pts[i][1] } } }); }
    return { status:200, json: async () => ({ routes:[{ distanceMeters:m, duration:Math.round(m / 1000 / 70 * 3600) + 's', legs }] }) };
  };
  return { fetch, log };
}
module.exports = { createGoogleMock };
