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
