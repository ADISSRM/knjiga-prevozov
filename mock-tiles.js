'use strict';
/* Posnetek strežnika ploščic za preizkuse (brez omrežja): vsaka ploščica je majhna SVG slika z oznako z/x/y.
   Ni pravi zemljevid: preverja samo postavitev ploščic, povečavo, glavo Referer in obnašanje ob napaki. */
function createTileMock(opts = {}){
  const seen = [];
  const svg = (z, x, y) => `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${(x + y) % 2 ? '#e6efe0' : '#f1eee6'}"/><rect x="0.5" y="0.5" width="255" height="255" fill="none" stroke="#c9d2c4"/><text x="128" y="134" font-size="22" text-anchor="middle" fill="#7d887c" font-family="monospace">${z}/${x}/${y}</text></svg>`;
  async function handle(route){
    const rq = route.request(), m = /\/(\d+)\/(\d+)\/(\d+)\.png/.exec(rq.url());
    seen.push({ url:rq.url(), referer:rq.headers()['referer'] || '', z:m ? +m[1] : -1 });
    if (opts.fail) return route.abort('failed');
    if (!m) return route.fulfill({ status:404, body:'' });
    return route.fulfill({ status:200, contentType:'image/svg+xml', headers:{ 'access-control-allow-origin':'*', 'cache-control':'max-age=3600' }, body:svg(+m[1], +m[2], +m[3]) });
  }
  return { handle, seen, setFail(v){ opts.fail = v; } };
}
module.exports = { createTileMock };
