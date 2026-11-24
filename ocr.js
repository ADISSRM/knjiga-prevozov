/* Okvir za razpoznavo besedila (OCR). Protokol (postMessage, samo s starševskim oknom):
   okvir → starš  { type:'ready' }                          okvir je pripravljen
   starš → okvir  { type:'warm', cfg }                      vnaprej naloži program, jedro in jezikovni model (v ozadju, med izbiro fotografije)
   okvir → starš  { type:'warmed' } | { type:'error', msg, phase:'warm' }
   starš → okvir  { type:'run', cfg:{lib,lang,langPath,workerPath,corePath}, image:ArrayBuffer(PNG), words?:true, psm?:'4' }
   okvir → starš  { type:'progress', stage, pct } … { type:'done', text, words?:[{text,confidence,bbox}], tsv?:string } | { type:'error', msg }
   starš → okvir  { type:'close' }                          ustavi delavca in sprosti pomnilnik
   words:true = vrni tudi besede z okvirji in zanesljivostjo (skeniranje strani knjige); psm = način členitve strani (privzeto 4).
   Delavec (Tesseract.js) se ustvari ENKRAT in se uporabi za vse slike: okvir je izoliran (sandbox brez allow-same-origin), zato brskalnik v njem
   ne more hraniti prenesenih datotek (jedro ~ 5 MB + model ~ 2 MB), zato se prenesejo samo prvič v tej seji, ne za vsako sliko znova.
   Knjižnica se naloži šele ob prvi uporabi, z naslova iz config.js → ocr.lib. */
(function () {
  'use strict';
  function send(m) { parent.postMessage(m, '*'); }
  function loadScript(src) {
    return new Promise(function (ok, err) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { err(new Error('Programa za razpoznavo besedila ni mogoče naložiti (cdn.jsdelivr.net). Preveri internetno povezavo.')); };
      document.head.appendChild(s);
    });
  }
  /* besede z okvirji: data.words (če obstaja) ali sprehod po data.blocks → odstavki → vrstice → besede */
  function pickWords(d) {
    var out = [];
    function add(w) { if (w && w.text != null && w.bbox) out.push({ text: String(w.text), confidence: +w.confidence, bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 } }); }
    if (d && Array.isArray(d.words) && d.words.length) { d.words.forEach(add); return out; }
    ((d && d.blocks) || []).forEach(function (b) { (b.paragraphs || []).forEach(function (p) { (p.lines || []).forEach(function (l) { (l.words || []).forEach(add); }); }); });
    return out;
  }
  var wkey = '', wp = null, queue = Promise.resolve();
  function getWorker(cfg) {
    var key = JSON.stringify([cfg.lib, cfg.lang, cfg.langPath, cfg.workerPath, cfg.corePath]);
    if (wp && wkey === key) return wp;
    if (wp) { var old = wp; wp = null; old.then(function (w) { try { w.terminate(); } catch (e) { /* nič */ } }, function () { /* nič */ }); }
    wkey = key;
    var mine = (async function () {
      if (!cfg.lib) throw new Error('Razpoznava besedila ni nastavljena (config.js → ocr.lib).');
      send({ type: 'progress', stage: 'lib', pct: 0 });
      if (!self.Tesseract) await loadScript(cfg.lib);
      if (!self.Tesseract || !self.Tesseract.createWorker) throw new Error('Program za razpoznavo besedila ni na voljo.');
      var opts = { logger: function (x) { if (x && x.status) send({ type: 'progress', stage: x.status, pct: x.progress }); } };
      ['workerPath', 'langPath', 'corePath'].forEach(function (k) { if (cfg[k]) opts[k] = cfg[k]; });
      return self.Tesseract.createWorker(cfg.lang || 'slv', 1, opts);
    })();
    wp = mine;
    mine.catch(function () { if (wp === mine) { wp = null; wkey = ''; } });   // po napaki se pri naslednji uporabi poskusi znova
    return mine;
  }
  function drop() { var p = wp; wp = null; wkey = ''; if (p) p.then(function (w) { try { w.terminate(); } catch (e) { /* nič */ } }, function () { /* nič */ }); }
  async function runJob(m) {
    var cfg = m.cfg || {}, worker = await getWorker(cfg);
    /* PSM 4: en stolpec besedila različnih velikosti, kar se je pri tem obrazcu izkazalo za najbolj zanesljivo urejeno */
    try { await worker.setParameters({ tessedit_pageseg_mode: String(m.psm || '4'), preserve_interword_spaces: '1' }); } catch (e1) { /* privzeti način */ }
    send({ type: 'progress', stage: 'recognizing text', pct: 0 });
    var r = await worker.recognize(new Blob([m.image], { type: 'image/png' }));
    var d = (r && r.data) || {}, msg = { type: 'done', text: d.text || '' };
    if (m.words) { msg.words = pickWords(d); if (!msg.words.length && d.tsv) msg.tsv = String(d.tsv); }
    return msg;
  }
  window.addEventListener('message', function (e) {
    if (e.source !== parent) return;
    var m = e.data || {};
    if (m.type === 'close') { drop(); return; }
    if (m.type === 'warm') {
      getWorker(m.cfg || {}).then(function () { send({ type: 'warmed' }); }, function (err) { send({ type: 'error', phase: 'warm', msg: String((err && err.message) || err) }); });
      return;
    }
    if (m.type !== 'run') return;
    queue = queue.then(function () {
      return runJob(m).then(send, function (err) { drop(); send({ type: 'error', msg: String((err && err.message) || err) }); });
    });
  });
  send({ type: 'ready' });
})();
