// Preizkus prijavnega zaslona pri različnih config.js (pravi brskalnik, mapa dist; Firebase SDK ni dosegljiv).
// Zagon: cd source && node tests/config-scenarios.js
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist');
const REAL = "{apiKey:'AIzaSyD-test1234567890abcdefghijklmnopq',authDomain:'moj.firebaseapp.com',projectId:'moj',appId:'1:123456789012:web:abcdef1234567890'}";
const CASES = [
  ['pravi videz: ostane Firebase, napaka povezave (SDK ni dosegljiv), NE lokalni način', `window.KP_CONFIG={mode:'firebase',firebase:${REAL}};`, 'firebase', /Povezava s Firebase ni uspela/, /Lokalni način/],
  ['apiKey še VSTAVI', "window.KP_CONFIG={mode:'firebase',firebase:{apiKey:'VSTAVI-API-KEY',authDomain:'a.firebaseapp.com',projectId:'a',appId:'1:1:web:1'}};", 'local', /Zakaj: V config\.js so še prazne ali nadomestne vrednosti: apiKey/],
  ['projectId še VSTAVI (apiKey pravi)', `window.KP_CONFIG={mode:'firebase',firebase:{apiKey:'AIzaSyD-test1234567890abcdefghijklmnopq',authDomain:'a.firebaseapp.com',projectId:'VSTAVI-PROJECT-ID',appId:'1:1:web:1'}};`, 'local', /Zakaj: .*projectId/],
  ['mode local', "window.KP_CONFIG={mode:'local'};", 'local', /Zakaj: V config\.js je mode »local«/],
  ['napaka v zapisu (manjka vejica)', "window.KP_CONFIG={mode:'firebase' firebase:{apiKey:'AIza'}};", 'local', /Zakaj: config\.js vsebuje napako v zapisu/],
  ['config.js manjka (404)', null, 'local', /Zakaj: config\.js ni bil naložen/],
];
let cur = null;
const srv = http.createServer((q, s) => {
  let p = q.url.split('?')[0]; if (p === '/') p = '/index.html';
  if (p === '/config.js'){ if (cur === null){ s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type':'text/javascript' }); return s.end(cur); }
  const f = p === '/predogled.html' ? path.join(ROOT, 'predogled.html') : path.join(DIST, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const b = await chromium.launch(); let ok = 0, bad = 0;
  const run = async (name, cfg, backend, want, notWant, url = '/') => {
    cur = cfg; const c = await b.newContext({ serviceWorkers:'block' }); await c.route(u => !/127\.0\.0\.1/.test(u.hostname), r => r.abort()); const p = await c.newPage();
    await p.goto('http://127.0.0.1:' + srv.address().port + url); await p.waitForTimeout(2200);
    const t = await p.evaluate(() => ({ be:BACKEND, txt:document.getElementById('authCard').innerText }));
    try { assert.strictEqual(t.be, backend); assert.ok(want.test(t.txt), 'besedilo: ' + t.txt.replace(/\n+/g, ' | ').slice(0, 300)); if (notWant) assert.ok(!notWant.test(t.txt)); ok++; console.log('  ✓ ' + name); }
    catch (e){ bad++; console.log('  ✗ ' + name + ' – ' + e.message.slice(0, 400)); }
    await c.close();
  };
  for (const [n, cfg, be, want, nw] of CASES) await run(n, cfg, be, want, nw);
  await run('samostojna predstavitvena stran (predogled.html): lokalni način z razlogom', null, 'local', /Zakaj: To je samostojna predstavitvena stran brez config\.js/, null, '/predogled.html');
  await b.close(); srv.close(); console.log(`\n${ok} uspešnih, ${bad} neuspešnih`); process.exit(bad ? 1 : 0);
})();
