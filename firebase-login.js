// Preizkus prijave v načinu Firebase proti nadomestnemu SDK-ju (tests/mock-firebase.js): sporočila ob napakah in uspešna prijava.
// Zagon: cd source && node tests/firebase-login.js
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { install } = require('./mock-firebase.js');
const DIST = path.join(__dirname, '..', 'dist');
const mkCfg = dom => `window.KP_CONFIG={mode:'firebase',userDomain:${dom},sdkVersion:'10.14.1',offline:true,firebase:{apiKey:'AIzaSyD-test1234567890abcdefghijklmnopq',authDomain:'moj.firebaseapp.com',projectId:'moj',appId:'1:123456789012:web:abcdef1234567890'}};`;
let CFG = mkCfg("'rp-brezice.example'");
const srv = http.createServer((q, s) => { let p = q.url.split('?')[0]; if (p === '/') p = '/index.html'; if (p === '/config.js'){ s.writeHead(200, { 'content-type':'text/javascript' }); return s.end(CFG); }
  const f = path.join(DIST, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const UID = 'uid-skrbnik-0001';
const baseState = o => Object.assign({ users:[{ email:'skrbnik@rp-brezice.example', pw:'dolgo-geslo-123', uid:UID }, { email:'ana@primer.si', pw:'dolgo-geslo-123', uid:'uid-ana' }], docs:{ ['users/' + UID]:{ name:'Skrbnik Test', role:'skrbnik', active:true } } }, o || {});
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const b = await chromium.launch(); let ok = 0, bad = 0; const consoleErrors = [];
  const run = async (name, state, user, pw, check) => {
    const c = await b.newContext({ serviceWorkers:'block' }); await c.route(u => !/127\.0\.0\.1|gstatic\.com/.test(u.hostname), r => r.abort());
    await install(c, state); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:' + srv.address().port + '/'); await p.waitForSelector('#loginForm');
    await p.fill('#lu', user); await p.fill('#lp', pw); await p.click('#loginForm button[type=submit]');
    await p.waitForTimeout(1800);
    const t = await p.evaluate(() => ({ err:(document.getElementById('authErr') || {}).textContent || '', authHidden:document.getElementById('auth').hidden, hint:(document.querySelector('#authCard p.hint') || {}).textContent || '', me:typeof ME !== 'undefined' && ME ? { role:ME.role, name:ME.name } : null, fb:globalThis.__FB }));
    try { await check(t, errs); ok++; console.log('  ✓ ' + name); } catch(e){ bad++; console.log('  ✗ ' + name + ' – ' + String(e.message).slice(0, 500) + ' | prikaz: ' + t.err.slice(0, 220)); }
    await c.close();
  };
  await run('napačno geslo: sporočilo pove, kot kateri e-naslov teče prijava', baseState(), 'skrbnik', 'napačno', t => { assert.ok(/Napačno uporabniško ime ali geslo/.test(t.err)); assert.ok(t.err.includes('skrbnik@rp-brezice.example')); assert.ok(/celoten e-naslov/.test(t.err)); });
  await run('drug e-naslov v Firebase: vnos s celim e-naslovom deluje', baseState(), 'ana@primer.si', 'dolgo-geslo-123', t => { assert.ok(t.fb.tried === 'ana@primer.si'); assert.ok(/Račun nima|manjka dokument/.test(t.err), t.err); });
  await run('prijava z e-pošto in geslom izklopljena v Firebase', baseState({ authErr:'auth/operation-not-allowed' }), 'skrbnik', 'x', t => assert.ok(/Email\/Password → Enable/.test(t.err)));
  await run('API ključ omejen na drug naslov (referer)', baseState({ authErr:'auth/requests-from-referer-https://drug.si-are-blocked' }), 'skrbnik', 'x', t => assert.ok(/API ključ omejen na drug naslov/.test(t.err) && /HTTP referrers/.test(t.err)));
  await run('neznana koda napake se izpiše', baseState({ authErr:'auth/nekaj-novega' }), 'skrbnik', 'x', t => assert.ok(/Prijava ni uspela \(auth\/nekaj-novega\)/.test(t.err)));
  await run('napaka pri nastavitvi obstojnosti prijave se izpiše s kodo', baseState({ persistErr:'auth/operation-not-supported-in-this-environment' }), 'skrbnik', 'dolgo-geslo-123', t => assert.ok(/operation-not-supported-in-this-environment/.test(t.err)));
  await run('prijava uspe, dokument users/UID manjka: sporočilo vsebuje UID', baseState({ docs:{} }), 'skrbnik', 'dolgo-geslo-123', t => { assert.ok(t.err.includes('users/' + UID) && /manjka dokument/.test(t.err)); assert.strictEqual(t.me, null); });
  await run('prijava uspe, pravila baze zavračajo branje profila', baseState({ deny:['^users/'] }), 'skrbnik', 'dolgo-geslo-123', t => assert.ok(/permission-denied/.test(t.err) && /firestore\.rules/.test(t.err)));
  await run('profil z active = false', baseState({ docs:{ ['users/' + UID]:{ name:'S', role:'skrbnik', active:false } } }), 'skrbnik', 'dolgo-geslo-123', t => assert.ok(/onemogočen/.test(t.err)));
  await run('profil z active kot besedilo »true« (pravila ga zavrnejo)', baseState({ docs:{ ['users/' + UID]:{ name:'S', role:'skrbnik', active:'true' } } }), 'skrbnik', 'dolgo-geslo-123', t => assert.ok(/boolean true/.test(t.err) && /besedilo/.test(t.err)));
  await run('profil z napačno vlogo (velika začetnica)', baseState({ docs:{ ['users/' + UID]:{ name:'S', role:'Skrbnik', active:true } } }), 'skrbnik', 'dolgo-geslo-123', t => assert.ok(/nima veljavne vloge/.test(t.err) && /Skrbnik/.test(t.err)));
  await run('uspešna prijava skrbnika: odpre se aplikacija, ustvarijo se nastavitve (cfg/main), ni napak', baseState(), 'skrbnik', 'dolgo-geslo-123', (t, errs) => { assert.deepStrictEqual(t.me, { role:'skrbnik', name:'Skrbnik Test' }); assert.strictEqual(t.authHidden, true); assert.deepStrictEqual(errs, []); assert.ok(t.fb.docs['cfg/main'], 'cfg/main ni bil ustvarjen: ' + JSON.stringify(t.fb.log || []).slice(0, 300)); });
  const crewSt = role => baseState({ users:[{ email:role + '@rp-brezice.example', pw:'dolgo-geslo-123', uid:'uid-' + role }], docs:{ ['users/uid-' + role]:{ name:'Posadka Test', role, active:true } } });
  for (const role of ['voznik', 'spremljevalec']) await run('uspešna prijava (' + role + '): odpre se pogled posadke brez napak', crewSt(role), role, 'dolgo-geslo-123', (t, errs) => { assert.strictEqual(t.me && t.me.role, role); assert.strictEqual(t.authHidden, true); assert.deepStrictEqual(errs, []); });
  // »Preveri povezavo« na prijavi
  const chk = async (name, state, check) => {
    const c = await b.newContext({ serviceWorkers:'block' }); await c.route(u => !/127\.0\.0\.1|gstatic\.com/.test(u.hostname), r => r.abort()); await install(c, state);
    const p = await c.newPage(); await p.goto('http://127.0.0.1:' + srv.address().port + '/'); await p.waitForSelector('#fbCheck', { state:'attached' });
    await p.evaluate(() => { document.querySelector('.fbhelp').open = true; }); await p.click('#fbCheck'); await p.waitForFunction(() => /Povezava je v redu|Odpravi prvo rdečo/.test(document.getElementById('fbCheckOut').textContent), null, { timeout:20000 });
    const txt = await p.evaluate(() => document.getElementById('fbCheckOut').innerText);
    try { check(txt); ok++; console.log('  ✓ ' + name); } catch(e){ bad++; console.log('  ✗ ' + name + ' – ' + e.message.slice(0, 300) + ' | ' + txt.replace(/\n+/g, ' | ').slice(0, 400)); }
    await c.close();
  };
  await chk('preverjanje povezave: vse v redu (baza zavrača nepooblaščene)', baseState({ deny:['^users/'] }), t => assert.ok(/Povezava je v redu/.test(t) && !/✗/.test(t)));
  await chk('preverjanje povezave: izklopljena prijava z e-pošto se pokaže pri Authentication', baseState({ deny:['^users/'], authErr:'auth/operation-not-allowed' }), t => assert.ok(/✗ Authentication/.test(t) && /Email\/Password/.test(t) && /Odpravi prvo rdečo/.test(t)));
  await chk('preverjanje povezave: baza brez pravil (odprto branje) se označi z napako', baseState(), t => assert.ok(/✗ Baza Firestore/.test(t) && /firestore\.rules/.test(t)));
  await chk('preverjanje povezave: nedosegljiva baza', baseState({ deny:['^users/'], dbErr:'unavailable' }), t => assert.ok(/✗ Baza Firestore/.test(t) && /ne odgovarja/.test(t)));
  // userDomain: več domen; računi z drugimi e-naslovi
  CFG = mkCfg("['rp-brezice.example', 'zd-brezice.si']");
  const stDom = baseState({ users:[{ email:'matej@zd-brezice.si', pw:'dolgo-geslo-123', uid:'uid-m' }], docs:{ 'users/uid-m':{ name:'Matej Test', role:'dispecer', active:true } } });
  await run('userDomain seznam: »matej« najde račun matej@zd-brezice.si (druga domena)', stDom, 'matej', 'dolgo-geslo-123', t => { assert.deepStrictEqual(t.me, { role:'dispecer', name:'Matej Test' }); assert.strictEqual(t.fb.tried, 'matej@zd-brezice.si'); });
  await run('userDomain seznam: napačno geslo navede vse poskušene e-naslove', stDom, 'matej', 'napačno', t => { assert.ok(t.err.includes('matej@rp-brezice.example ali matej@zd-brezice.si'), t.err); assert.ok(/ime@rp-brezice\.example ali ime@zd-brezice\.si/.test(t.hint), 'namig na prijavi: ' + t.hint); });
  CFG = mkCfg("'gmail.com, rp-brezice.example'");
  await run('userDomain kot niz z vejico: deluje', baseState({ users:[{ email:'ana@gmail.com', pw:'dolgo-geslo-123', uid:'uid-ana' }], docs:{ 'users/uid-ana':{ name:'Ana Test', role:'dispecer', active:true } } }), 'ana', 'dolgo-geslo-123', t => assert.deepStrictEqual(t.me, { role:'dispecer', name:'Ana Test' }));
  await run('druge napake (izklopljena prijava) ne preizkušajo še drugih domen', baseState({ authErr:'auth/operation-not-allowed' }), 'ana', 'x', t => assert.ok(/Email\/Password/.test(t.err)));
  CFG = mkCfg("'rp-brezice.example'");
  // dispečer ob nastavitvah iz starejše izdaje (brez settings.tisk in reg pri vozilih): odjemalec ne sme pisati v cfg/main (pravila to dovolijo samo skrbniku)
  let cfgDoc = null;
  await run('(priprava) skrbnik ustvari cfg/main', baseState(), 'skrbnik', 'dolgo-geslo-123', t => { cfgDoc = t.fb.docs['cfg/main']; assert.ok(cfgDoc); });
  if (cfgDoc){
    const old = JSON.parse(JSON.stringify(cfgDoc)); if (old.settings) delete old.settings.tisk; (old.vehicles || []).forEach(v => delete v.reg);
    const st = baseState({ users:[{ email:'dispecer@rp-brezice.example', pw:'dolgo-geslo-123', uid:'uid-d' }], docs:{ 'users/uid-d':{ name:'Dispečer Test', role:'dispecer', active:true }, 'cfg/main':old } });
    await run('dispečer s starejšimi nastavitvami: prijava uspe in v cfg/main ne piše (to sme samo skrbnik)', st, 'dispecer', 'dolgo-geslo-123', t => {
      assert.deepStrictEqual(t.me, { role:'dispecer', name:'Dispečer Test' });
      const w = (t.fb.log || []).filter(x => /^(set|update|delete) cfg\//.test(x)); assert.deepStrictEqual(w, [], 'dispečer je pisal v: ' + w.join(', ') + ' [' + (t.fb.upd || []).join(' | ').slice(0, 600) + ']');
    });
  }
  if (cfgDoc){   // dovoljene spremembe dispečerja (obvestila) še vedno gredo v cfg/main, nedovoljene (settings) ne
    const old2 = JSON.parse(JSON.stringify(cfgDoc)); if (old2.settings) delete old2.settings.tisk;
    const st2 = baseState({ users:[{ email:'dispecer@rp-brezice.example', pw:'dolgo-geslo-123', uid:'uid-d' }], docs:{ 'users/uid-d':{ name:'Dispečer Test', role:'dispecer', active:true }, 'cfg/main':old2 } });
    const c = await b.newContext({ serviceWorkers:'block' }); await c.route(u => !/127\.0\.0\.1|gstatic\.com/.test(u.hostname), r => r.abort()); await install(c, st2);
    const p = await c.newPage(); await p.goto('http://127.0.0.1:' + srv.address().port + '/'); await p.waitForSelector('#loginForm');
    await p.fill('#lu', 'dispecer'); await p.fill('#lp', 'dolgo-geslo-123'); await p.click('#loginForm button[type=submit]'); await p.waitForTimeout(1500);
    await p.evaluate(() => { S.notices.push({ id:'ob1', t:'Preizkus obvestila', at:'2026-11-18' }); S.settings.window = 77; save(); }); await p.waitForTimeout(1500);
    const f = await p.evaluate(() => globalThis.__FB);
    try { assert.ok((f.upd || []).some(x => /^cfg\/main: .*notices/.test(x)), 'obvestilo ni bilo zapisano: ' + JSON.stringify(f.upd)); assert.ok(!(f.upd || []).some(x => /settings/.test(x)), 'dispečer je poskusil zapisati settings: ' + JSON.stringify(f.upd)); ok++; console.log('  ✓ dispečer: obvestila se shranijo, settings ne'); }
    catch(e){ bad++; console.log('  ✗ dispečer: obvestila se shranijo, settings ne – ' + e.message.slice(0, 400)); }
    await c.close();
  }
  await b.close(); srv.close(); console.log(`\n${ok} uspešnih, ${bad} neuspešnih`); process.exit(bad ? 1 : 0);
})();
