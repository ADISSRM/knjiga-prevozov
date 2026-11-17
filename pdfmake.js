'use strict';
/* Najmanjši PDF s slikami strani, kot ga naredijo telefoni (Flate surovi RGB, neobvezno s predikatorjem PNG »Up«, ali JPEG). Samo za preizkuse. */
const zlib = require('zlib');
function pixels(w, h, comps){ const b = Buffer.alloc(w * h * comps); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < comps; c++) b[(y * w + x) * comps + c] = (x * 3 + y * 5 + c * 40) & 255; return b; }
function makePdf(pages){
  const parts = [Buffer.from('%PDF-1.3\n%\xc4\xe5\xf2\xe5\n', 'latin1')]; let n = 1;
  pages.forEach((p, i) => {
    const comps = p.comps || 3, raw = p.raw || pixels(p.w, p.h, comps);
    let data, filt = '', extra = '';
    if (p.kind === 'dct'){ data = p.jpeg; filt = '/Filter /DCTDecode'; }
    else if (p.predictor){
      const rowLen = p.w * comps, out = Buffer.alloc(p.h * (rowLen + 1));
      for (let y = 0; y < p.h; y++){ out[y * (rowLen + 1)] = 2; for (let x = 0; x < rowLen; x++) out[y * (rowLen + 1) + 1 + x] = (raw[y * rowLen + x] - (y ? raw[(y - 1) * rowLen + x] : 0)) & 255; }
      data = zlib.deflateSync(out); filt = '/Filter /FlateDecode'; extra = `/DecodeParms << /Predictor 15 /Colors ${comps} /BitsPerComponent 8 /Columns ${p.w} >>`;
    } else { data = zlib.deflateSync(raw); filt = '/Filter /FlateDecode'; }
    const cs = comps === 1 ? '/DeviceGray' : '/DeviceRGB';
    parts.push(Buffer.from(`${n} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im${i} ${n + 1} 0 R >> >> >>\nendobj\n`, 'latin1')); n++;
    parts.push(Buffer.from(`${n} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace ${cs} /BitsPerComponent 8 /Length ${data.length} ${filt} ${extra} >>\nstream\n`, 'latin1'), data, Buffer.from('\nendstream\nendobj\n', 'latin1')); n++;
  });
  parts.push(Buffer.from('trailer\n<< /Root 1 0 R >>\n%%EOF\n', 'latin1'));
  return Buffer.concat(parts);
}
module.exports = { makePdf, pixels };
