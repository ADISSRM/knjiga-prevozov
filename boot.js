/* Zaščita pred vdelavo v tuj okvir + registracija PWA (service worker). Naloži se pred app.js. */
(function(){
  try { if (window.top !== window.self) { document.documentElement.style.display = 'none'; window.top.location = window.self.location; } } catch(e) { document.documentElement.style.display = 'none'; }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
  }
})();
