'use strict';
/* Ustvari umetne besede (kot jih vrne OCR) za stran knjige: glava + vrstice. Samo izmišljeni podatki.
   Vsaka vrstica: { nr, cells:[ime, od, do, ura, opomba], conf:[...] } ; stolpci po x. */
const COLS = [ { k:'nr', x:60 }, { k:'name', x:140 }, { k:'from', x:420 }, { k:'to', x:700 }, { k:'time', x:980 }, { k:'note', x:1120 } ];
function word(t, x, y, c, h = 28){ return { text:t, confidence:c, bbox:{ x0:x, y0:y, x1:x + Math.max(14, t.length * 15), y1:y + h } }; }
function gen(rows, o = {}){
  const words = [], y0 = o.y0 || 300, pitch = o.pitch || 70;
  const put = (text, x, y, c) => { String(text).split(' ').filter(Boolean).forEach((t, i, a) => { const off = a.slice(0, i).reduce((s, w) => s + w.length * 15 + 15, 0); words.push(word(t, x + off, y, c)); }); };
  if (o.date) put(o.date, 700, 120, 90);
  if (o.header !== false){ [['Št.', 60], ['Ime in priimek', 140], ['Od', 420], ['Do', 700], ['Ura prev.', 980], ['Opomba', 1120]].forEach(([t, x]) => put(t, x, 220, 92)); }
  rows.forEach((r, i) => {
    const y = y0 + i * pitch + (o.skew ? i * 0 : 0);
    if (r.nr != null && !r.noNr) put(String(r.nr), 60, y, r.nrConf || 90);
    (r.cells || []).forEach((t, k) => { if (t) put(t, COLS[k + 1].x, y + 4, (r.conf || [])[k] != null ? r.conf[k] : 88); });
  });
  return words;
}
module.exports = { gen, COLS };

/* ---- Postavitev »kartice« (obrazec OBR REŠ 08): vsak prevoz = 3 vrstice; list je lahko nagnjen in ukrivljen. Samo izmišljeni podatki. ----
   card: { nr, name, from, to, phone, mode, time, conf:{ name, ... }, noNr, noLabel, blank }
   o: { tilt (naklon vrstic, dy/dx), fan (sprememba naklona od vrha do dna), pitch, y3 (vrstica »Način prevoza« 1. kartice), title, datum } */
function genCards(cards, o = {}){
  const words = [], P = o.pitch || 130, y3 = o.y3 || 420, X = { num:60, od:150, col:640, cas:1010 }, CW = 13, H = 22;
  const xa = X.col + 80, n = cards.length;
  const w2 = (t, x, y, c) => ({ text:t, confidence:c, bbox:{ x0:x, y0:y - H / 2, x1:x + Math.max(10, t.length * CW), y1:y + H / 2 } });
  const put = (text, x, y0, v, k, c, slope) => { let xx = x; String(text).split(' ').filter(Boolean).forEach(t => { const y = y0 + v * P + slope * (xx - xa); words.push(w2(t, xx, y, c)); xx += t.length * CW + 12; }); };
  if (o.title !== false){ [['KNJIGA', 400], ['REŠEVALNIH', 500], ['PREVOZOV', 650]].forEach(([t, x]) => words.push(w2(t, x, 90, 92))); }
  if (o.datum){ put('DATUM:', 100, 200, 0, 0, 90, 0); put(o.datum, 230, 200, 0, 0, 55, 0); }
  cards.forEach((c, k) => {
    const y0 = y3 + k * P + (o.skipGap && k >= o.skipGap ? 0 : 0), s = (o.tilt || 0) + (o.fan || 0) * (k - (n - 1) / 2) / Math.max(1, n - 1), cf = Object.assign({ name:60, from:60, to:60, phone:90, mode:80, time:80 }, c.conf || {});
    put('Čas:', X.cas, y0, -0.62, k, 90, s); put('OD:', X.od, y0, -0.31, k, 90, s); put('DO:', X.col, y0, -0.31, k, 90, s); put('Tel:', X.od, y0, 0, k, 90, s);
    if (!c.noLabel){ put('Način', X.col, y0, 0, k, 90, s); put('prevoza:', X.col + 75, y0, 0, k, 90, s); }
    if (c.nr != null && !c.noNr) put(c.nr + '.', X.num, y0, -0.62, k, 80, s);
    if (c.blank) return;
    if (c.name) put(c.name, X.od + 10, y0, -0.62, k, cf.name, s);
    if (c.from) put(c.from, X.od + 75, y0, -0.3, k, cf.from, s);
    if (c.to) put(c.to, X.col + 55, y0, -0.3, k, cf.to, s);
    if (c.phone) put(c.phone, X.od + 70, y0, 0.02, k, cf.phone, s);
    if (c.mode) put(c.mode, X.col + 175, y0, 0, k, cf.mode, s);
    if (c.time) put(c.time, X.cas + 75, y0, -0.66, k, cf.time, s);
  });
  return words;
}
module.exports.genCards = genCards;
