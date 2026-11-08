// Test harness: loads the app's source files into a Node vm with minimal browser stubs.
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
function makeCtx(opts = {}){
  const mem = opts.mem || new Map();
  const ls = { getItem:k => mem.has(k) ? mem.get(k) : null, setItem:(k,v) => mem.set(k, String(v)), removeItem:k => mem.delete(k), key:i => [...mem.keys()][i] ?? null, get length(){ return mem.size; } };
  const noop = () => {};
  const el = () => ({ addEventListener:noop, classList:{ add:noop, remove:noop, toggle:noop }, style:{}, dataset:{}, appendChild:noop, remove:noop, setAttribute:noop, querySelector:() => null, querySelectorAll:() => [] });
  const ctx = { console, setTimeout, clearTimeout, setInterval:() => 0, clearInterval:noop, Math, JSON, Date, Map, Set, Promise, Intl, URL, AbortController, TextEncoder,
    localStorage:ls, sessionStorage:{ getItem:() => null, setItem:noop, removeItem:noop },
    document:{ addEventListener:noop, querySelector:() => null, querySelectorAll:() => [], createElement:el, activeElement:null, body:el(), documentElement:{ dataset:{} } },
    navigator:{ onLine:true, clipboard:{} }, location:{ protocol:'https:', host:'x', hash:'' }, performance:{ now:() => Date.now() },
    fetch: opts.fetch || (async () => { throw new TypeError('no network (test)'); }),
    crypto:{ getRandomValues:a => a }, btoa:s => Buffer.from(s, 'binary').toString('base64'), atob:s => Buffer.from(s, 'base64').toString('binary') };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.window.KP_CONFIG = opts.config || {};
  ctx.window.addEventListener = noop;
  return vm.createContext(ctx);
}
function load(files, opts = {}){
  const ctx = makeCtx(opts);
  const code = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  vm.runInContext(code, ctx, { filename:'app-bundle.js' });
  return ctx;
}
module.exports = { load, makeCtx };
