// Nadomestni (lažni) Firebase SDK za preizkuse prijave: tri ES-modula, ki jih brskalnik dobi namesto https://www.gstatic.com/firebasejs/<verzija>/…
// Stanje (uporabniki, dokumenti, napake) nastavi preizkus prek globalThis.__FB (addInitScript).
const APP = `export const initializeApp = c => ({ c });`;
const AUTH = `
const fb = () => globalThis.__FB; let cur = null; const ls = [];
const err = code => Object.assign(new Error(code), { code });
export const getAuth = () => ({ get currentUser(){ return cur; } });
export const browserLocalPersistence = { t:'local' }, browserSessionPersistence = { t:'session' };
export const setPersistence = async () => { if (fb().persistErr) throw err(fb().persistErr); };
export const onAuthStateChanged = (a, cb) => { ls.push(cb); setTimeout(() => cb(cur), 0); return () => {}; };
export const signInWithEmailAndPassword = async (a, email, pw) => {
  const f = fb(); f.tried = email; if (f.authErr) throw err(f.authErr);
  const u = f.users.find(x => x.email === email); if (!u || u.pw !== pw) throw err('auth/invalid-credential');
  cur = { uid:u.uid, email }; ls.slice().forEach(l => l(cur)); return { user:cur };
};
export const signOut = async () => { cur = null; ls.slice().forEach(l => l(null)); };
export class EmailAuthProvider { static credential(){ return {}; } }
export const reauthenticateWithCredential = async () => {}; export const updatePassword = async () => {};`;
const FS = `
const fb = () => globalThis.__FB; const err = code => Object.assign(new Error(code), { code });
const D = () => (fb().docs = fb().docs || {});
const DEL = { __del:true };
const snapOf = (id, data) => ({ id, exists: () => data != null, data: () => data == null ? undefined : JSON.parse(JSON.stringify(data)) });
export const initializeFirestore = () => ({}); export const getFirestore = () => ({});
export const persistentLocalCache = () => ({}); export const persistentMultipleTabManager = () => ({});
export const doc = (db, p) => ({ path:p, id:p.split('/').pop() });
export const collection = (db, c) => ({ col:c });
export const where = () => ({}); export const documentId = () => ({}); export const query = (c) => c;
export const serverTimestamp = () => Date.now(); export const deleteField = () => DEL;
const guard = (p, op) => { const f = fb(); if (f.dbErr) throw err(f.dbErr); if (f.deny && f.deny.some(rx => new RegExp(rx).test(p))) throw err('permission-denied'); (f.log = f.log || []).push(op + ' ' + p); };
export const getDoc = async r => { guard(r.path, 'get'); return snapOf(r.id, D()[r.path]); };
export const setDoc = async (r, d) => { guard(r.path, 'set'); D()[r.path] = JSON.parse(JSON.stringify(d)); };
export const updateDoc = async (r, upd) => { (fb().upd = fb().upd || []).push(r.path + ': ' + Object.keys(upd).join(', ')); guard(r.path, 'update'); const cur = D()[r.path]; if (!cur) throw err('not-found'); for (const [k, v] of Object.entries(upd)){ const parts = k.split('.'); let o = cur; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] = o[parts[i]] || {}; if (v && v.__del) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = JSON.parse(JSON.stringify(v)); } };
export const deleteDoc = async r => { guard(r.path, 'delete'); delete D()[r.path]; };
export const addDoc = async (c, d) => { const id = 'auto' + Math.random().toString(36).slice(2, 8); guard(c.col + '/' + id, 'add'); D()[c.col + '/' + id] = JSON.parse(JSON.stringify(d)); return { id }; };
const colDocs = c => Object.keys(D()).filter(k => k.startsWith(c + '/') && k.split('/').length === 2).map(k => snapOf(k.split('/')[1], D()[k]));
export const getDocs = async c => { guard(c.col, 'list'); return { docs:colDocs(c.col) }; };
export const onSnapshot = (r, cb, onErr) => {
  try {
    if (r.path){ guard(r.path, 'watch'); setTimeout(() => cb(snapOf(r.id, D()[r.path])), 0); }
    else { guard(r.col, 'watch'); const docs = colDocs(r.col); setTimeout(() => cb({ docs, docChanges: () => docs.map(d => ({ type:'added', doc:d })) }), 0); }
  } catch(e){ setTimeout(() => onErr && onErr(e), 0); }
  return () => {};
};
export const terminate = async () => {}; export const clearIndexedDbPersistence = async () => {};`;
async function install(ctx, state, version = '10.14.1'){
  await ctx.addInitScript(s => { globalThis.__FB = s; }, state);
  const mods = { 'firebase-app.js':APP, 'firebase-auth.js':AUTH, 'firebase-firestore.js':FS };
  await ctx.route(new RegExp('^https://www\\.gstatic\\.com/firebasejs/' + version.replace(/\./g, '\\.') + '/firebase-(app|auth|firestore)\\.js$'), r => {
    const f = r.request().url().split('/').pop();
    r.fulfill({ status:200, contentType:'text/javascript', headers:{ 'access-control-allow-origin':'*' }, body:mods[f] });
  });
}
module.exports = { install };
