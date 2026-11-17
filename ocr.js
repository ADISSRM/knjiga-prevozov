/* Okvir za razpoznavo besedila (OCR). Protokol (postMessage, samo s starševskim oknom):
   okvir → starš  { type:'ready' }                          okvir je pripravljen
   starš → okvir  { type:'run', cfg:{lib,lang,langPath,workerPath,corePath}, image:ArrayBuffer(PNG) }
   okvir → starš  { type:'progress', stage, pct } … { type:'done', text } | { type:'error', msg }
   Knjižnica (Tesseract.js) se naloži šele ob prvi uporabi, z naslova iz config.js → ocr.lib. */
(function () {
  'use strict';
  function send(m) { parent.postMessage(m, '*'); }
  function loadScript(src) {
    return new Promise(function (ok, err) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { err(new Error('Programa za razpoznavo besedila ni mogoče naložiti. Preveri internetno povezavo ali prilepi besedilo.')); };
      document.head.appendChild(s);
    });
  }
  window.addEventListener('message', function (e) {
    if (e.source !== parent) return;
    var m = e.data || {}; if (m.type !== 'run') return;
    (async function () {
      try {
        var cfg = m.cfg || {};
        if (!cfg.lib) throw new Error('Razpoznava besedila ni nastavljena (config.js → ocr.lib).');
        send({ type: 'progress', stage: 'lib', pct: 0 });
        await loadScript(cfg.lib);
        if (!self.Tesseract || !self.Tesseract.createWorker) throw new Error('Program za razpoznavo besedila ni na voljo.');
        var opts = { logger: function (x) { if (x && x.status) send({ type: 'progress', stage: x.status, pct: x.progress }); } };
        ['workerPath', 'langPath', 'corePath'].forEach(function (k) { if (cfg[k]) opts[k] = cfg[k]; });
        var worker = await self.Tesseract.createWorker(cfg.lang || 'slv', 1, opts);
        /* PSM 4: en stolpec besedila različnih velikosti, kar se je pri tem obrazcu izkazalo za najbolj zanesljivo urejeno */
        try { await worker.setParameters({ tessedit_pageseg_mode: '4', preserve_interword_spaces: '1' }); } catch (e1) { /* privzeti način */ }
        var r = await worker.recognize(new Blob([m.image], { type: 'image/png' }));
        try { await worker.terminate(); } catch (e2) { /* ni pomembno */ }
        send({ type: 'done', text: (r && r.data && r.data.text) || '' });
      } catch (err) {
        send({ type: 'error', msg: String((err && err.message) || err) });
      }
    })();
  });
  send({ type: 'ready' });
})();
