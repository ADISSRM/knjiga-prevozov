'use strict';
/* Poenostavljen Nominatim za preizkuse (brez omrežja). Oblika zahtevka in odgovora povzema dokumentacijo (nominatim.org/release-docs/latest/api/Search):
   GET /search?format=jsonv2&addressdetails=1&limit=5&q=…&countrycodes=si&viewbox=x1,y1,x2,y2&bounded=1 → polje zadetkov
   { lat, lon (nizi), display_name, category, type, place_rank, address:{ house_number, road, … } }.
   Podatki so izmišljeni poskusni naslovi (hišne točke so blizu središča kraja, ne pravih hiš). Ni pravi OSM: preverja pogodbo in logiko aplikacije. */
const hit = (re, lat, lon, o = {}) => ({ re, lat, lon, category:'place', type:'house', place_rank:30, address:{}, ...o });
const DB = [
  hit(/cesta prvih borcev 18/i, 45.9061, 15.5948, { address:{ house_number:'18', road:'Cesta prvih borcev', town:'Brežice', country_code:'si' } }),
  hit(/dobova 25/i, 45.8991, 15.6572, { address:{ house_number:'25', road:'Dobova', village:'Dobova', country_code:'si' } }),
  hit(/dobova 30/i, 45.9002, 15.6590, { address:{ house_number:'30', village:'Dobova', country_code:'si' } }),
  hit(/dobova 99/i, 45.9000, 15.6598, { category:'highway', type:'residential', place_rank:26, address:{ road:'Dobova', village:'Dobova', country_code:'si' } }),   // te hišne številke v OSM ni: vrne ulico
  hit(/mostec 4/i, 45.9102, 15.6105, { address:{ house_number:'4', village:'Mostec', country_code:'si' } }),
  hit(/ulica 5, zagreb/i, 45.8123, 15.9800, { address:{ house_number:'5', road:'Ulica', city:'Zagreb', country_code:'hr' } }),
  hit(/prešernova 5/i, 46.5547, 15.6459, { address:{ house_number:'5', road:'Prešernova ulica', city:'Maribor', country_code:'si' } }),     // ista ulica v drugem kraju
  hit(/selice 3/i, 45.8300, 15.5600, { address:{ house_number:'3', village:'Selice', country_code:'si' } }),
  hit(/zdravstveni dom brežice/i, 45.9057, 15.5894, { category:'amenity', type:'clinic', place_rank:30, address:{ road:'Cesta prvih borcev', town:'Brežice', country_code:'si' } })
];
function createNominatimMock(opts = {}){
  const log = []; let live = 0, maxLive = 0;
  const fetch = async (url, init) => {
    log.push({ url:String(url), init, t:Date.now() }); live++; maxLive = Math.max(maxLive, live);
    try {
      if (opts.delay) await new Promise(r => setTimeout(r, opts.delay));
      const f = typeof opts.fail === 'function' ? opts.fail(log.length, String(url)) : opts.fail;
      if (f === 'throw') throw new TypeError('Failed to fetch');
      if (typeof f === 'number') return { status:f, json: async () => ({ error:'x' }) };
      const u = new URL(url); if (u.pathname !== '/search') return { status:404, json: async () => ({}) };
      const q = u.searchParams.get('q') || '', cc = (u.searchParams.get('countrycodes') || '').split(',');
      let list = DB.filter(d => d.re.test(q) && (!cc[0] || cc.includes(d.address.country_code || 'si')));
      if (u.searchParams.get('bounded') === '1' && u.searchParams.get('viewbox')){
        const [x1, y1, x2, y2] = u.searchParams.get('viewbox').split(',').map(Number);
        list = list.filter(d => d.lon >= Math.min(x1, x2) && d.lon <= Math.max(x1, x2) && d.lat >= Math.min(y1, y2) && d.lat <= Math.max(y1, y2));
      }
      return { status:200, json: async () => list.map(d => ({ place_id:1, lat:String(d.lat), lon:String(d.lon), display_name:q, category:d.category, type:d.type, place_rank:d.place_rank, address:d.address })) };
    } finally { live--; }
  };
  return { fetch, log, get maxLive(){ return maxLive; } };
}
module.exports = { createNominatimMock };
