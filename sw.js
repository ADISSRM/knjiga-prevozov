/* Service worker: samo lupina aplikacije (HTML/JS/CSS/ikone). Podatkov o pacientih NE shranjuje –
   za to skrbi Firestore (šifriran prenos, lokalna kopija v brskalniku, ki se ob odjavi izbriše).
   Strategija: najprej omrežje (vedno sveža različica), ob izpadu signala predpomnilnik. */
const CACHE = 'kp-shell-6577cd09d9';
const SHELL = ['./', 'index.html', 'app.js', 'style.css', 'config.js', 'boot.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kp-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;     // Firebase in vse tuje gre mimo predpomnilnika
  e.respondWith(fetch(r).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
