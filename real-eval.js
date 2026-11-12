'use strict';
/* Primerjava razporeda z dispečerjevo resnično razporeditvijo na anonimiziranih dnevih iz papirne knjige (real-days.js).
   Zagon:  node tests/real-eval.js [dan …]   Nastavitve za poskus:  SET='{"windowFar":120}' node tests/real-eval.js
   Izpiše delež parov prevozov, ki so v razporedu in v resnici v istem (ali različnem) vozilu, ter vozila po prevozih. Nov resnični dan dodaš v real-days.js. */
const vm = require('vm'), path = require('path');
const { load } = require('./load.js'), REAL = require('./real-days.js');
const SRC = path.join(__dirname, '..', 'src') + path.sep;
const FILES = ['20-data.js', '30-core.js', '35-db.js', '38-routing.js', '39-google.js', '40-planner.js', '45-pacienti.js'].map(f => SRC + f);
const SET = JSON.parse(process.env.SET || '{}');
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(REAL.DAYS);
let ok = 0, pairs = 0; const T = { a:{ km:0, lateMin:0, obj:0 }, d:{ km:0, lateMin:0, obj:0 } };
for (const k of want){
  const day = REAL.DAYS[k]; if (!day){ console.log('Ni dneva ' + k); continue; }
  const ctx = load(FILES, { config:{ routing:{ url:'' } } }), ev = c => vm.runInContext(c, ctx);
  ev('S = defaultState(); normalizeState();'); REAL.setup(ev, day, SET);
  const r = JSON.parse(ev(`JSON.stringify((() => { const p = computePlan('${day.date}'); const m = {}; p.crews.forEach(c => c.trips.forEach(t => t.rides.forEach(x => { m[x.nr] = c.vehicle.name; }))); return { m, un:p.unassigned.length, km:Math.round(p.totals.km), v:p.variant || p.opts && p.opts.id }; })())`));
  const a = REAL.agreement(day, r.m); ok += a.ok; pairs += a.pairs;
  const by = {}; day.rides.forEach((x, i) => { if (x.odpovedano) return; (by[r.m[i + 1] || '?'] = by[r.m[i + 1] || '?'] || new Set()).add(x.row); });
  console.log(`${day.date.slice(8)}. ${+day.date.slice(5,7)}.  ujemanje ${a.ok}/${a.pairs} = ${(100 * a.share).toFixed(0)} %  nerazporejeno ${r.un}  km ${r.km}`);
  const sa = REAL.planStats(ev, day.date);
  const ctx2 = load(FILES, { config:{ routing:{ url:'' } } }), ev2 = c => vm.runInContext(c, ctx2);
  ev2('S = defaultState(); normalizeState();'); REAL.setup(ev2, day, SET); REAL.pinReal(ev2, day); const sd = REAL.planStats(ev2, day.date);
  console.log(`   ocena (km / min zamude / skupna): aplikacija ${sa.km} / ${sa.lateMin} / ${sa.obj}   dispečer ${sd.km} / ${sd.lateMin} / ${sd.obj}${sd.un ? '  (dispečerjev razpored v modelu ne gre povsem: ' + sd.un + ' nerazporejeno)' : ''}`);
  if (!sd.un){ T.a.km += sa.km; T.a.lateMin += sa.lateMin; T.a.obj += sa.obj; T.d.km += sd.km; T.d.lateMin += sd.lateMin; T.d.obj += sd.obj; }
  console.log('   razpored: ' + Object.entries(by).map(([v, s]) => v + ':' + [...s].sort((x, y) => x - y).join(',')).join('   '));
  console.log('   dispečer: ' + Object.entries(day.real).map(([v, rows]) => v + ':' + rows.join(',')).join('   '));
}
console.log(`SKUPAJ ${(100 * ok / pairs).toFixed(1)} %  (${ok}/${pairs})`);
console.log(`Dnevi, kjer se dispečerjev razpored v modelu izide (km / min zamude / skupna ocena): aplikacija ${T.a.km} / ${T.a.lateMin} / ${T.a.obj}   dispečer ${T.d.km} / ${T.d.lateMin} / ${T.d.obj}`);
