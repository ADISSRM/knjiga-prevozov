/* =====================================================================
   SKENIRANJE NALOGA ZA PREVOZ (Obr. NLG/05) → samodejno izpolnjevanje podatkov pacienta in naloga
   Tri poti do besedila (vse na napravi, brez pošiljanja slike nikamor):
     1) prilepljeno besedilo (iPhone: Kamera → »Skeniraj besedilo«, Android: Google Lens → kopiraj; ali besedilo iz PDF),
     2) slika (fotografija) ali PDF-sken: razpoznava besedila (OCR) v ločenem, izoliranem okvirju ocr/ocr.html,
     3) PDF, ki je samo slika (iPhone Zapiski, Google Drive …): slika se izvleče iz PDF (JPEG ali Flate), nato OCR.
   Razčlenjevalec (parse) je čista funkcija: pozna razporeditev obrazca (vrednost je NAD oznako), prenese šum OCR, nikoli ne ugiba brez opore
   in vsako polje pokaže v pregledu, kjer ga dispečer popravi pred shranjevanjem. Slika in besedilo se NE shranita; shrani se samo potrjeno.
   ===================================================================== */
const NSCAN = (() => {
  const S_ = v => String(v ?? '');
  const N = s => norm(s);
  const NOISE_STOP = /(razlog|obravnave|vrsta|prevoza|nujni|nenujni|sanitetni|helikopterski|bolezen|poskodba|poklicna|transplant|doplacila|zavarovan|zavarovalnic|policej?|veljavnost|enkratna|napotnic|zdravnik|izvajal|dejavnost|stevilka|datum|rojstva|telefonska|kontaktna|opombe|relacija|dializa|nepokretnost|skodljivost|javnega|spremstvo|tuji|brez)/;
  const title = s => S_(s).toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\s+/g, ' ').trim();
  const lines = text => S_(text).replace(/\r/g, '').split('\n').map(l => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean);

  /* Popravek najpogostejših napak OCR v številkah (O→0, l→1 …), samo v besedah, ki so večinoma števke */
  function fixTok(t){
    const d = (t.match(/\d/g) || []).length;
    if (t.length < 2 || d < t.length * 0.5) return t;
    return t.replace(/[OoQ]/g, '0').replace(/[Il|]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
  }
  const fixDigits = line => S_(line).split(' ').map(fixTok).join(' ');

  /* ---------- Vzorci ---------- */
  const RE_DATE = /(\d{1,2})\s*[.,/]\s*(\d{1,2})\s*[.,/]\s*((?:19|20)\d{2})/g;
  const RE_MAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const RE_PHONE = /(?:\+|00)?\s*(?:386)?[\s(-]*0?\d{1,2}[\s)\-/.]*\d{3}[\s\-/.]*\d{3}\b/;
  function dates(line){
    const out = []; let m; RE_DATE.lastIndex = 0;
    while ((m = RE_DATE.exec(line))){
      const d = +m[1], mo = +m[2], y = +m[3];
      if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
      out.push({ iso:`${y}-${pad(mo)}-${pad(d)}`, y, text:m[0], at:m.index });
    }
    return out;
  }
  /* 9-mestna številka zavarovane osebe (tudi razdeljena na skupine po 3 ali brez presledkov) */
  function zzzsIn(line){
    if (/\b(?:tel|gsm|mob)/i.test(N(line))) return '';   // vrstica s telefonom ni številka zavarovane osebe
    const f = fixDigits(line).replace(RE_DATE, ' ');
    const m = /(?:^|[^\d])(\d{3}[ .]?\d{3}[ .]?\d{3})(?!\d)/.exec(f);
    return m ? m[1].replace(/\D/g, '') : '';
  }
  const phoneIn = line => {
    const f = fixDigits(line).replace(RE_DATE, ' ').replace(RE_MAIL, ' ');
    const m = RE_PHONE.exec(f); if (!m) return '';
    return m[0].replace(/\s+/g, ' ').trim();
  };
  const isLabel = l => /^\(/.test(l);
  /* desni stolpci obrazca (npr. »03 -POKLICNA BOLEZEN 01 3- SANITETNI«) se odrežejo: leva vrednost je pred prvo oznako »številka -« */
  function cutRight(l){
    const m = /\s\d{1,2}\s*[-–—=]+\s*\S/.exec(' ' + l);
    return (m ? l.slice(0, Math.max(0, m.index - 1)) : l).trim();
  }
  const cleanText = s => S_(s).replace(/[^\p{L}\p{N}@.,;:'’()+/&\-–\s]/gu, ' ').replace(/\s+/g, ' ').replace(/(\s+[^\p{L}\p{N}\s]{0,2}){1,2}$/u, m => (/^[\s\p{L}\p{N}]*$/u.test(m) && m.trim().length > 2) ? m : '').trim();
  /* odstrani odvečne kratke ostanke OCR na koncu (npr. »… Krsko 3«, »… Primer Ne«) */
  const trimTail = s => S_(s).replace(/(?:\s+(?:[^\p{L}\d]{1,3}|\p{L}{1,2}[.,;:]?|\d))+$/u, '').trim();
  const stripNoise = s => S_(s).replace(/^[^\p{L}\d]*(\p{L}{1,2})\s+(?=\p{Lu})/u, (m, tok) => /^(zd|sb|ob|dh|um|zz)$/i.test(tok) ? m.replace(/^[^\p{L}\d]*/u, '') : '');
  const nameVal = c => {
    const t = trimTail(cleanText(cutRight(c).split(/[;|}{\\,]/)[0]).replace(/[^\p{L}\s'’\-]/gu, ' ').replace(/\s+/g, ' ').trim());
    if (t.length < 2 || t.length > 40 || t.split(' ').length > 3 || NOISE_STOP.test(N(t))) return '';
    if (!/\p{L}{2}/u.test(t)) return '';
    return t;
  };
  const streetVal = c => {
    const t = cleanText(cutRight(c)); const n = N(t);
    if (t.length < 3 || !/\p{L}{2}/u.test(t) || NOISE_STOP.test(n) || RE_MAIL.test(t)) return '';
    return t;
  };

  /* ---------- Razčlenjevanje ---------- */
  function parse(text){
    const L0 = lines(text), L = L0;
    const f = {}, src = {}, notes = [];
    const set = (k, v, how) => { if (v != null && String(v).trim() !== '' && !f[k]){ f[k] = String(v).trim(); src[k] = how || 'oznaka'; } };
    const now = new Date(), yNow = now.getFullYear();

    /* 0) številka naloga: 7-mestna številka v glavi (zgoraj desno) */
    for (let i = 0; i < Math.min(8, L.length); i++){
      const m = /(?:^|[^\d])(\d{7})(?!\d)/.exec(fixDigits(L[i]));
      if (m){ set('stevilka', m[1], 'glava'); break; }
    }

    /* 1) zavarovana oseba: vrednost je NAD oznako; sidro = vrstica s številko zavarovane osebe */
    let iA = L.findIndex((l, i) => zzzsIn(l) && (dates(fixDigits(l)).length || /zavarovane|rojstva/.test(N(L[i + 1] || ''))));
    if (iA < 0) iA = L.findIndex(l => zzzsIn(l));
    if (iA < 0){
      const k = L.findIndex(l => /zavarovane\s+osebe\)|datum\s+rojstva/.test(N(l)));
      if (k > 0) iA = k - 1;
    }
    let stop = L.length;
    if (iA >= 0){
      const z = zzzsIn(L[iA]); if (z) set('zzzs', z, 'vzorec');
      const dd = dates(fixDigits(L[iA])).filter(d => d.y < yNow + 1)[0]; if (dd) set('dob', dd.iso, 'vzorec');
      for (let i = iA + 1; i < L.length; i++){ if (/kontaktna\s+podatka|^\s*12\s*[-–—=.]|relacija\s+prevoza/.test(N(L[i]))){ stop = i; break; } }
      const seq = []; let cand = [];
      for (let i = iA + 1; i < stop; i++){
        if (isLabel(L[i])){ seq.push({ lab:N(L[i]), cand }); cand = []; } else cand.push(L[i]);
      }
      const KEY = [['zzzs', /zavarovane|rojstva|datum/], ['priimek', /pr?[il1]*[mn]?[ie]k|priim|primek|prlm/], ['ime', /^\(?\s*[il1|]me\s*\)?\*?$/], ['ulica', /ulic|hi[sgz]na|\bst\./], ['posta', /po[sš5]t|posin|kraj|krai|\bhl\b/], ['tel', /telef/], ['mail', /po[sš]ta|mail/]];
      const ORDER = ['zzzs', 'priimek', 'ime', 'ulica', 'posta', 'tel', 'mail'];
      let next = 0; const byField = {};
      seq.forEach(s => {
        let key = (KEY.find(([, re]) => re.test(s.lab)) || [])[0];
        if (!key) key = ORDER[Math.min(next, ORDER.length - 1)];
        next = Math.max(next, ORDER.indexOf(key)) + 1;
        if (!byField[key]) byField[key] = s.cand;
      });
      const last = list => list && list.length ? list : [];
      const pickLast = (list, fn) => { for (let i = list.length - 1; i >= 0; i--){ const v = fn(list[i]); if (v) return v; } return ''; };
      set('priimek', title(pickLast(last(byField.priimek), nameVal)), 'oznaka');
      set('ime', title(pickLast(last(byField.ime), nameVal)), 'oznaka');
      set('ulica', pickLast(last(byField.ulica), streetVal), 'oznaka');
      const pk = last(byField.posta);
      for (let i = pk.length - 1; i >= 0; i--){
        const m = /^(\d{4})\s*(.*)$/.exec(fixDigits(cleanText(cutRight(pk[i]))));
        if (m){ set('posta', m[1], 'oznaka'); const k = trimTail(m[2].replace(/[^\p{L}\s\-]/gu, ' ').replace(/\s+/g, ' ')); if (k) set('kraj', title(k), 'oznaka'); break; }
      }
      if (!f.posta){ const lone = pk.map(x => /^\s*(\d{4})\s*$/.exec(fixDigits(x))).filter(Boolean).pop(); if (lone) set('posta', lone[1], 'oznaka'); }
      if (!f.kraj){ const k = pickLast(pk.filter(x => !/\d{4}/.test(fixDigits(x))), nameVal); if (k) set('kraj', title(k), 'oznaka'); }
    }
    /* telefon in e-pošta: vzorec, kjerkoli v bloku zavarovane osebe (oznaka je pogosto pokvarjena) */
    const zoneEnd = stop < L.length ? stop : Math.min(L.length, (iA >= 0 ? iA : 0) + 30);
    for (let i = Math.max(0, iA); i < zoneEnd && i >= 0; i++){
      if (!f.mail){ const m = RE_MAIL.exec(L[i]); if (m) set('mail', m[0].toLowerCase(), 'vzorec'); }
      if (!f.phone && i !== iA){ const p = phoneIn(L[i]); if (p && !/\d{4}\s*(?:19|20)\d{2}/.test(p)) set('phone', p, 'vzorec'); }
    }
    if (!f.mail){ const m = RE_MAIL.exec(S_(text)); if (m) set('mail', m[0].toLowerCase(), 'vzorec'); }

    /* 2) izvajalec (naročnik) in zdravnik: samo ko je jasno; sicer prazno */
    const zi = L.findIndex(l => /\bdr\.?\s+[\p{Lu}]/u.test(l) || /\b(?:prim|asist|doc)\.?\s+dr\.?/i.test(l));
    if (zi >= 0){
      const m = /\b((?:prim\.?\s*|asist\.?\s*|doc\.?\s*)?dr\.?(?:\s*med\.?)?\s+[\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+)?)/u.exec(L[zi]);
      if (m) set('zdravnik', m[1].replace(/\s+/g, ' ').trim(), 'vzorec');
      const before = stripNoise(m ? L[zi].slice(0, m.index) : L[zi]);
      if (/(\bzd\b|zdravstven|bolnisnic|ambulant|klinik|ordinacij|zavod|d\.o\.o|\bsb\b|ukc|center|dom\b)/.test(N(before))) set('narocnik', trimTail(cleanText(before)).slice(0, 80), 'vzorec');
    }
    if (!f.narocnik){
      const k = L.findIndex(l => /(\bzd\b|zdravstven\w*\s+(?:dom|postaj|center)|splosna\s+bolnisnica|zdravstveni\s+dom)/.test(N(l)) && !/\d{5,}/.test(l) && !/reseval/.test(N(l)));
      if (k >= 0 && k < (iA >= 0 ? iA : L.length)) set('narocnik', trimTail(cleanText(stripNoise(cutRight(L[k])))).slice(0, 80), 'vzorec');
    }

    /* 3) relacija in opombe: besedilo za naslovom »12 – RELACIJA PREVOZA« in »13 – OPOMBE« */
    const iRel = L.findIndex(l => /(^|\s)12\s*[-–—=.]?\s*rela|relacija\s+prevoza/.test(N(l)));
    const iOp = L.findIndex((l, i) => i > Math.max(iRel, -1) && /(^|\s)13\s*[-–—=.]?\s*opomb|^\s*opombe/.test(N(l)));
    const endOp = (() => { const k = L.findIndex((l, i) => i > Math.max(iOp, iRel) && (/^\s*(?:\p{L}+\s+)?kraj\b.*\bdne\b|\bdne\b.*\bzig\b|podpis\s+zdravnika|^\s*datum\s+cas/u.test(N(l)) || /(^|\s)kraj\s+(?:dne|\d)/.test(N(l)))); return k < 0 ? L.length : k; })();
    if (iRel >= 0){
      const rel = [], head = L[iRel].replace(/^.*?relacija\s+prevoza\s*/i, '').trim();
      if (head) rel.push(head);
      for (let i = iRel + 1; i < (iOp > iRel ? iOp : endOp); i++) rel.push(L[i]);
      const raw = trimTail(cleanText(rel.join(' ').replace(/\\|\|/g, ' ')));
      if (raw){
        f.relacija = raw;
        const m = /^(.*?)\s+(?:[-–—>]+|=>|→)\s+(.+)$/.exec(raw) || /^(.*?)\s+do\s+(.+)$/i.exec(raw);
        if (m){ set('od', m[1].trim(), 'vzorec'); set('do', m[2].trim(), 'vzorec'); }
        src.relacija = 'oznaka';
      }
    }
    if (iOp >= 0){
      const op = [], head = L[iOp].replace(/^.*?opombe\s*/i, '').trim();
      if (head) op.push(head);
      for (let i = iOp + 1; i < endOp; i++) op.push(L[i]);
      const raw = op.map(x => trimTail(cleanText(x))).filter(x => x.length > 1).join('; ');
      if (raw){ f.opombe = raw; src.opombe = 'oznaka'; }
    }

    /* 4) datumi: veljavnost »2 – DO«, datum izdaje (pri »dne«); rojstni datum je že znan */
    const all = []; L.forEach((l, i) => dates(fixDigits(l)).forEach(d => all.push({ ...d, i, line:l })));
    const dne = all.slice().reverse().find(d => /\bdne\b|\bkraj\b/.test(N(d.line)) && d.iso !== f.dob);
    const doo = all.find(d => /(?:^|\s|\()2\s*[-–—=]\s*(?:do|d0|oo|00)\b/.test(N(d.line.slice(0, d.at + 1))) && d.iso !== f.dob) || all.find(d => d.i < (iA >= 0 ? iA : 99) && d.iso !== f.dob && d.y >= yNow - 1);
    if (dne) set('izdan', dne.iso, 'vzorec');
    if (doo && (!dne || doo.iso !== dne.iso)) set('veljaDo', doo.iso, 'vzorec');
    if (!f.izdan){ const x = all.filter(d => d.iso !== f.dob && d.iso !== f.veljaDo).pop(); if (x) set('izdan', x.iso, 'vzorec'); }

    /* 5) iz vsebine: razlog, način prevoza in vrsta naloga (predlog; pregled to prikaže kot izbiro) */
    const body = N([f.relacija, f.opombe].filter(Boolean).join(' '));
    if (/dializ|nefrodial|hemodial/.test(body)){ set('razlog', 'Dializa', 'besedilo'); }
    else if (/obseva|radioterap/.test(body)) set('razlog', 'Obsevanje', 'besedilo');
    else if (/kemoterap|kemo\b/.test(body)) set('razlog', 'Kemoterapija', 'besedilo');
    else if (/rehabilit/.test(body)) set('razlog', 'Rehabilitacija', 'besedilo');
    set('mode', /leze|lezec|nosil/.test(body) ? 'leze' : /utila/.test(body) ? 'utila' : 'sede', /leze|lezec|nosil|utila/.test(body) ? 'besedilo' : 'privzeto');
    const from = f.izdan || '';
    if (f.veljaDo && from){
      const span = Math.round((parseYmd(f.veljaDo) - parseYmd(from)) / 86400000);
      f.vrsta = span >= 300 ? 'letna' : span >= 25 && span <= 62 ? 'mesecna' : span > 0 && span < 25 ? 'zdravljenje' : 'enkratna';
    } else f.vrsta = f.razlog === 'Dializa' ? 'letna' : 'enkratna';
    src.vrsta = f.veljaDo ? 'datumi' : 'predlog';

    /* naslov za aplikacijo: »ulica, kraj« (kraj se izpusti, če je že v ulici: »Dobova 25«) */
    if (f.ulica){
      const sameTown = f.kraj && N(f.ulica).startsWith(N(f.kraj));
      f.addr = f.kraj && !sameTown ? `${f.ulica}, ${f.kraj}` : f.ulica;
    } else if (f.kraj) f.addr = f.kraj;
    if (f.ime || f.priimek) f.name = [f.ime, f.priimek].filter(Boolean).join(' ');

    const key = ['name', 'zzzs', 'addr', 'stevilka', 'relacija'];
    const found = key.filter(k => f[k]).length;
    if (!f.name) notes.push('Imena ni bilo mogoče prebrati.');
    if (!f.addr) notes.push('Naslova ni bilo mogoče prebrati.');
    if (!f.relacija) notes.push('Relacija prevoza ni prebrana.');
    return { fields:f, src, notes, found, total:key.length, lines:L0.length };
  }

  /* ---------- Povezava z bazo pacientov ---------- */
  const digitsOnly = s => S_(s).replace(/\D/g, '');
  function matchPatient(f){
    const z = digitsOnly(f.zzzs);
    if (z.length === 9){ const p = S.patients.find(x => digitsOnly(x.zzzs) === z); if (p) return { p, how:'številka zavarovane osebe' }; }
    const a = N([f.ime, f.priimek].filter(Boolean).join(' ')).split(' ').filter(Boolean).sort().join(' ');
    if (a){ const p = S.patients.find(x => N(x.name).split(' ').filter(Boolean).sort().join(' ') === a); if (p) return { p, how:'ime in priimek' }; }
    return null;
  }
  /* Shrani potrjene podatke: pacient (nov ali obstoječ: izpolni samo prazna polja) + nalog (novega, ali posodobi istega s številko) */
  function apply(f, o = {}){
    let p = o.pid ? patientById(o.pid) : null, created = false;
    const name = S_(f.name || [f.ime, f.priimek].filter(Boolean).join(' ')).trim();
    if (!p){
      p = blankPatient({ name, addr:f.addr || '', phone:f.phone || '', mode:f.mode || 'sede', zzzs:digitsOnly(f.zzzs), color:nextColor() });
      S.patients.push(p); created = true; audit('pacient.dodan', { id:p.id, kdo:initials(p.name), vir:'skeniran nalog' });
    } else {
      if (!p.addr && f.addr) p.addr = f.addr;
      if (!p.phone && f.phone) p.phone = f.phone;
      if (!p.zzzs && f.zzzs) p.zzzs = digitsOnly(f.zzzs);
    }
    p.naloge = p.naloge || [];
    const from = f.veljaOd || f.izdan || todayStr();
    let n = f.stevilka ? p.naloge.find(x => S_(x.stevilka).trim() === S_(f.stevilka).trim()) : null, updated = !!n;
    if (!n){ n = blankNalog(f.vrsta || 'enkratna', from); p.naloge.push(n); }
    const set = (k, v) => { if (v != null && S_(v).trim() !== '') n[k] = S_(v).trim(); };
    set('stevilka', f.stevilka); set('narocnik', f.narocnik); set('zdravnik', f.zdravnik); set('razlog', f.razlog); set('mode', f.mode);
    set('od', f.od || p.addr); set('do', f.do); set('opombe', f.opombe);
    n.vrsta = f.vrsta || n.vrsta; n.veljaOd = from;
    if (f.veljaDo){ n.veljaDo = f.veljaDo; n.auto = false; } else if (!updated){ n.veljaDo = defaultValidTo(n.vrsta, from); n.auto = true; }
    if (f.mail){ /* e-pošte ne hranimo: ni potrebna za prevoz */ }
    audit('nalog.skeniran', { pid:p.id, nov:created, posodobljen:updated });
    save();
    return { p, n, created, updated };
  }

  /* ---------- Slika iz PDF (JPEG ali Flate, kot ga ustvarijo telefoni) ---------- */
  const inflate = async (u8) => {
    if (typeof DecompressionStream === 'undefined') throw new Error('Brskalnik ne podpira branja tega PDF. Naredi fotografijo ali izvozi stran kot sliko.');
    const ds = new DecompressionStream('deflate'), w = ds.writable.getWriter(); w.write(u8); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  };
  function unpredict(raw, colors, columns, pred){
    if (pred < 10) return raw;
    const bpp = colors, rowLen = columns * colors;
    const rows = Math.floor(raw.length / (rowLen + 1)), res = new Uint8Array(rows * rowLen);
    for (let r = 0; r < rows; r++){
      const ft = raw[r * (rowLen + 1)], src = r * (rowLen + 1) + 1, dst = r * rowLen, up = dst - rowLen;
      for (let i = 0; i < rowLen; i++){
        const x = raw[src + i], a = i >= bpp ? res[dst + i - bpp] : 0, b = r ? res[up + i] : 0, c = (r && i >= bpp) ? res[up + i - bpp] : 0;
        let v;
        if (ft === 0) v = x; else if (ft === 1) v = x + a; else if (ft === 2) v = x + b; else if (ft === 3) v = x + ((a + b) >> 1);
        else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
        res[dst + i] = v & 255;
      }
    }
    return res;
  }
  /* vrne [{ kind:'jpeg', bytes }, { kind:'raw', w, h, comps, data }] po vrstnem redu v datoteki; slike, manjše od 300 px, preskoči */
  async function pdfImages(buf){
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf), out = [];
    let str = ''; const CH = 8192; for (let i = 0; i < u8.length; i += CH) str += String.fromCharCode.apply(null, u8.subarray(i, Math.min(u8.length, i + CH)));
    let from = 0;
    for (;;){
      const at = str.indexOf('/Subtype', from); if (at < 0) break; from = at + 8;
      if (!/^\s*\/Image\b/.test(str.slice(at + 8, at + 24))) continue;
      const st = str.lastIndexOf(' obj', at), ds = st < 0 ? Math.max(0, at - 400) : st, sIdx = str.indexOf('stream', at); if (sIdx < 0) break;
      const dict = str.slice(ds, sIdx);
      if (/\/ImageMask\s+true/.test(dict)) continue;
      const w = +(/\/Width\s+(\d+)/.exec(dict) || [])[1], h = +(/\/Height\s+(\d+)/.exec(dict) || [])[1];
      if (!(w >= 300 && h >= 300)) continue;
      let p = sIdx + 6; if (str[p] === '\r' && str[p + 1] === '\n') p += 2; else if (str[p] === '\n' || str[p] === '\r') p += 1;
      let len = (/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict) || [])[1]; len = len ? +len : 0;
      let end = len && str.startsWith('endstream', p + len) || str.startsWith('\nendstream', p + len) || str.startsWith('\r\nendstream', p + len) ? p + len : str.indexOf('endstream', p);
      if (end < 0) continue; if (!len) { while (end > p && (str[end - 1] === '\n' || str[end - 1] === '\r')) end--; }
      const data = u8.subarray(p, end);
      from = Math.max(from, end);
      const filt = /\/Filter\s*(?:\[\s*)?\/(\w+)/.exec(dict); const f = filt ? filt[1] : '';
      if (f === 'DCTDecode'){ out.push({ kind:'jpeg', bytes:data, w, h }); continue; }
      if (f === 'FlateDecode'){
        let raw = await inflate(data);
        const pr = /\/Predictor\s+(\d+)/.exec(dict), pred = pr ? +pr[1] : 1;
        const comps = /DeviceGray|\/N\s+1\b/.test(dict) && !/DeviceRGB/.test(dict) ? 1 : 0;
        const col = /\/Colors\s+(\d+)/.exec(dict);
        let c = comps || (col ? +col[1] : 0);
        if (pred >= 10){ c = c || 3; raw = unpredict(raw, c, w, pred); }
        if (!c) c = raw.length === w * h ? 1 : raw.length === w * h * 3 ? 3 : 0;
        if (!(c === 1 || c === 3) || raw.length < w * h * c || !/\/BitsPerComponent\s+8\b/.test(dict)) continue;
        out.push({ kind:'raw', w, h, comps:c, data:raw });
      }
    }
    return out;
  }

  /* ---------- Priprava slike in OCR (samo v brskalniku) ---------- */
  const MAXSIDE = 2600;
  async function toCanvas(src, max = MAXSIDE){
    let cv, w, h;
    if (src.kind === 'raw'){
      w = src.w; h = src.h; cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d'), im = ctx.createImageData(w, h), d = im.data, s = src.data;
      if (src.comps === 3) for (let i = 0, j = 0, n = w * h; i < n; i++, j += 3){ d[i * 4] = s[j]; d[i * 4 + 1] = s[j + 1]; d[i * 4 + 2] = s[j + 2]; d[i * 4 + 3] = 255; }
      else for (let i = 0, n = w * h; i < n; i++){ d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = s[i]; d[i * 4 + 3] = 255; }
      ctx.putImageData(im, 0, 0);
    } else {
      let bmp; try { bmp = await createImageBitmap(src.kind === 'jpeg' ? new Blob([src.bytes], { type:'image/jpeg' }) : src.blob); }
      catch (e) { throw new Error('Slike ni mogoče odpreti' + (src.blob && /hei[cf]/i.test((src.blob.type || '') + (src.blob.name || '')) ? ' (format HEIC: na iPhonu izberi Nastavitve → Kamera → Formati → »Najbolj združljivo« ali fotografiraj kar v aplikaciji)' : ' (poškodovana ali nepodprta datoteka)') + '.'); }
      w = bmp.width; h = bmp.height;
      /* velika fotografija (iPhone 12–48 MP) se pomanjša že pri risanju: cela slika v polni velikosti bi na telefonu lahko presegla omejitev pomnilnika platna */
      const k0 = Math.min(1, max / Math.max(w, h));
      cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * k0)); cv.height = Math.max(1, Math.round(h * k0));
      const g0 = cv.getContext('2d'); if (!g0) throw new Error('Slike ni mogoče pripraviti (premalo pomnilnika). Poskusi z manjšo fotografijo.');
      g0.imageSmoothingQuality = 'high'; g0.drawImage(bmp, 0, 0, cv.width, cv.height); if (bmp.close) bmp.close();
      return cv;
    }
    const k = Math.min(1, max / Math.max(w, h));
    if (k < 1){ const c2 = document.createElement('canvas'); c2.width = Math.round(w * k); c2.height = Math.round(h * k); const x = c2.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, c2.width, c2.height); cv = c2; }
    return cv;
  }
  /* sivine + raztegnitev kontrasta (2.–98. percentil): zeleni okvirji obrazca ne motijo OCR */
  function enhance(cv){
    const ctx = cv.getContext('2d'), im = ctx.getImageData(0, 0, cv.width, cv.height), d = im.data, hist = new Uint32Array(256), n = cv.width * cv.height;
    for (let i = 0; i < n; i++){ const g = (d[i * 4] * 30 + d[i * 4 + 1] * 59 + d[i * 4 + 2] * 11) / 100 | 0; d[i * 4] = g; hist[g]++; }
    let acc = 0, lo = 0, hi = 255; for (let v = 0; v < 256; v++){ acc += hist[v]; if (acc > n * .02){ lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--){ acc += hist[v]; if (acc > n * .02){ hi = v; break; } }
    const span = Math.max(40, hi - lo);
    for (let i = 0; i < n; i++){ const g = Math.max(0, Math.min(255, ((d[i * 4] - lo) * 255 / span) | 0)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; }
    ctx.putImageData(im, 0, 0); return cv;
  }
  const toBlob = cv => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('Slike ni mogoče pripraviti.')), 'image/png'));
  /* datoteka → PNG blob prve strani (PDF: prva slika) */
  async function prepare(file){
    const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '');
    let src;
    if (isPdf){
      const imgs = await pdfImages(await file.arrayBuffer());
      if (!imgs.length) throw new Error('V tem PDF ni slike strani. Če ima besedilo, ga označi, kopiraj in prilepi; sicer naredi fotografijo naloga.');
      src = imgs[0];
    } else src = { kind:'blob', blob:file };
    return toBlob(enhance(await toCanvas(src)));
  }
  /* OCR v izoliranem okvirju (brez dostopa do podatkov aplikacije); okvir naloži knjižnico samo ob uporabi */
  /* poti iz config.js so relativne na stran aplikacije; okvir je v mapi ocr/, zato jih pretvorimo v absolutne naslove */
  const abs = u => u ? new URL(String(u), (typeof location !== 'undefined' && location.href) || 'http://localhost/').href : '';
  /* privzete vrednosti: tudi config.js iz starejše izdaje (brez bloka »ocr«) ohrani skeniranje slik; lib: '' ali on: false ga izklopi */
  const OCR_DEFAULT = { on:true, lib:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', lang:'slv' };
  const ocrCfg = () => Object.assign({}, OCR_DEFAULT, (typeof window !== 'undefined' && window.KP_CONFIG && window.KP_CONFIG.ocr) || {});
  /* Seja razpoznave: en izoliran okvir in en delavec za vse slike. Okvir nima dovoljenja za shranjevanje (sandbox brez allow-same-origin), zato brskalnik v njem
     ne more hraniti prenesenih datotek: prenos jedra (~5 MB) in modela (~2 MB) se zato naredi ENKRAT na sejo (v ozadju, ob odprtju okna), ne za vsako sliko znova.
     Nadzor: če okvir 75 s ne pošlje nobenega napredka, se seja prekine z jasno napako; celotna omejitev 10 minut. Seja se po 6 minutah mirovanja sprosti (pomnilnik telefona). */
  const OCR_T = { silence:75000, hard:600000, idle:360000 };   // spremenljivo samo zaradi preizkusov
  const STAGE_LABEL = { lib:'nalagam program za razpoznavo', 'loading tesseract core':'prenašam jedro razpoznave (samo prvič v seji)', 'initializing tesseract':'zaganjam razpoznavo', 'loading language traineddata':'prenašam slovenski jezikovni model (samo prvič v seji)', 'initializing api':'zaganjam razpoznavo', 'recognizing text':'berem besedilo', cloud:'berem v oblaku (Google Vision)', prep:'pripravljam sliko' };
  const stageLabel = st => STAGE_LABEL[st] || String(st || 'delam');
  let SES = null;
  function makeSession(cfg){
    const fr = document.createElement('iframe'); let dead = false, deadErr = null, ready = false, readyRes, cur = null, silence = 0, hard = 0, idle = 0;
    const readyP = new Promise(res => { readyRes = res; });
    fr.setAttribute('sandbox', 'allow-scripts'); fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.style.cssText = 'position:fixed;width:1px;height:1px;left:-9px;top:-9px;border:0;opacity:0';
    const clear = () => { clearTimeout(silence); clearTimeout(hard); };
    const finish = (fn, v) => { if (!cur) return; const c = cur; cur = null; clear(); fn === 'ok' ? c.resolve(v) : c.reject(v); };
    const post = m => fr.contentWindow && fr.contentWindow.postMessage(m, '*');
    const destroy = err => { if (dead) return; dead = true; deadErr = err || null; clearTimeout(idle); clear(); try { post({ type:'close' }); } catch (e) { /* nič */ } window.removeEventListener('message', onMsg); fr.remove(); if (SES === api) SES = null; if (cur) finish('err', err || new Error('Razpoznava je bila prekinjena.')); };
    const arm = () => { clearTimeout(silence); silence = setTimeout(() => destroy(new Error(`Razpoznava se je ustavila (${Math.round(OCR_T.silence / 1000)} s brez napredka). Najpogostejši vzrok je prekinjena ali počasna internetna povezava do cdn.jsdelivr.net. Poskusi znova ali preveri povezavo.`)), OCR_T.silence); };
    const bump = () => { clearTimeout(idle); if (!dead) idle = setTimeout(() => destroy(), OCR_T.idle); };
    const onMsg = e => {
      if (e.source !== fr.contentWindow) return;
      const m = e.data || {};
      if (m.type === 'ready'){ ready = true; readyRes(); }
      else if (m.type === 'progress'){ if (cur){ arm(); cur.listeners.forEach(f => { try { f(m); } catch (e) { /* prikaz ne sme ustaviti razpoznave */ } }); } }
      else if (m.type === 'warmed'){ if (cur && cur.kind === 'warm') finish('ok'); }
      else if (m.type === 'done'){ if (cur && cur.kind === 'run') finish('ok', cur.words ? { text:S_(m.text), words:Array.isArray(m.words) ? m.words : [], tsv:S_(m.tsv) } : S_(m.text)); }
      else if (m.type === 'error'){ if (cur) finish('err', new Error(S_(m.msg) || 'Razpoznava besedila ni uspela.')); }
    };
    window.addEventListener('message', onMsg);
    fr.onerror = () => destroy(new Error('Okvir za razpoznavo besedila se ni naložil.'));
    fr.src = (cfg.frame || 'ocr/ocr.html'); document.body.appendChild(fr);
    const cfgMsg = () => ({ lib:abs(cfg.lib), lang:cfg.lang || 'slv', langPath:abs(cfg.langPath), workerPath:abs(cfg.workerPath), corePath:abs(cfg.corePath) });
    /* ena zahteva naenkrat; čakajoče zahteve ostanejo v vrsti */
    let chain = Promise.resolve(), warmSt = null;
    const request = (kind, msg, onProgress, words, listeners) => {
      const job = chain.then(async () => {
        if (dead) throw deadErr || new Error('Razpoznava je bila prekinjena.');
        clearTimeout(idle);
        await Promise.race([readyP, new Promise((_, rej) => setTimeout(() => rej(new Error('Okvir za razpoznavo besedila se ni odzval.')), 20000))]);
        return new Promise((resolve, reject) => {
          cur = { kind, resolve, reject, listeners:listeners || [onProgress], words }; arm(); clearTimeout(hard); hard = setTimeout(() => destroy(new Error('Razpoznava je trajala predolgo (' + Math.round(OCR_T.hard / 60000) + ' minut). Poskusi znova z manjšo ali boljšo fotografijo.')), OCR_T.hard);
          Promise.resolve(msg()).then(m => post(m), reject);
        });
      });
      chain = job.then(() => {}, () => {}).then(bump);
      return job;
    };
    const api = {
      cfg, get dead(){ return dead; }, get ready(){ return ready; },
      /* vnaprejšnji zagon: če teče, se ob kasnejšem run() njegov prikaz napredka pridruži istemu prenosu */
      warm: onProgress => { if (warmSt && !warmSt.done) { if (onProgress) warmSt.listeners.push(onProgress); return warmSt.p; } const st = warmSt = { done:false, listeners:[onProgress] }; st.p = request('warm', () => ({ type:'warm', cfg:cfgMsg() }), null, false, st.listeners).finally(() => { st.done = true; }); return st.p; },
      get busy(){ return !!cur; },
      run: async (png, onProgress, extra) => { if (warmSt && !warmSt.done && onProgress) warmSt.listeners.push(onProgress); const buf = await png.arrayBuffer(); return request('run', () => ({ type:'run', cfg:cfgMsg(), image:buf, words:!!(extra && extra.words), psm:extra && extra.psm ? String(extra.psm) : undefined }), onProgress, !!(extra && extra.words)); },
      close: () => destroy(new Error('Razpoznava je bila prekinjena.'))
    };
    bump();
    return api;
  }
  /* seja za trenutne nastavitve (nova, če so se nastavitve spremenile ali je bila stara ustavljena) */
  function ocrSession(cfg = ocrCfg()){
    const key = JSON.stringify([cfg.lib, cfg.lang, cfg.langPath, cfg.workerPath, cfg.corePath, cfg.frame]);
    if (SES && (SES.dead || SES.key !== key)){ const o = SES; SES = null; try { o.close(); } catch (e) { /* nič */ } }
    if (!SES){ SES = makeSession(cfg); SES.key = key; }
    return SES;
  }
  const ocrClose = () => { if (SES) SES.close(); };
  /* prekinitev uporabnika: seja se ustavi samo, če ravno bere; drugače ostane pripravljena za naslednjo sliko */
  const ocrAbort = () => { if (SES && SES.busy) SES.close(); if (CLOUD_AC) CLOUD_AC.abort(); };
  /* ---- NEOBVEZNO (privzeto izklopljeno): branje rokopisa v oblaku, Google Cloud Vision (config.js → ocr.cloud) ----
     Klic je iz glavne strani, NE iz izoliranega okvirja: okvir nima izvora in ne pošlje Referer, zato omejitev ključa na naslov strani ne bi delovala.
     Pošlje se samo slika strani; brez piškotkov in prijave; ključ je omejen na »Cloud Vision API« in na naslov te strani. */
  let CLOUD_AC = null;
  const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  function visionWords(j){
    const out = [], r = j && j.responses && j.responses[0], pages = (r && r.fullTextAnnotation && r.fullTextAnnotation.pages) || [];
    pages.forEach(pg => (pg.blocks || []).forEach(b => (b.paragraphs || []).forEach(p => (p.words || []).forEach(w => {
      const t = (w.symbols || []).map(s => s.text || '').join(''), v = (w.boundingBox && w.boundingBox.vertices) || [];
      if (!t || !v.length) return;
      const xs = v.map(q => q.x || 0), ys = v.map(q => q.y || 0);
      out.push({ text:t, confidence:Math.round((w.confidence == null ? 0.5 : +w.confidence) * 100), bbox:{ x0:Math.min(...xs), y0:Math.min(...ys), x1:Math.max(...xs), y1:Math.max(...ys) } });
    }))));
    return out;
  }
  function cloudMsg(status, err){
    const m = String((err && err.message) || '').replace(/\s+/g, ' ').slice(0, 220), c = (err && err.code) || status;
    if (c === 403 || c === 401) return `Google Vision je zavrnil dostop (${c}): preveri, da je vključen »Cloud Vision API«, da je projektu dodan obračunski račun (brezplačna kvota ostane) in da je ključ omejen na naslov te strani (HTTP referrer), ne na kak drug naslov. ${m}`;
    if (c === 429) return `Google Vision: presežena kvota (429). Počakaj ali preveri kvoto v Google Cloud konzoli. ${m}`;
    if (c === 400) return `Google Vision je zavrnil zahtevo (400): ${m} Preveri ključ v config.js (ocr.cloud.key).`;
    return `Google Vision ni uspel (${c}). ${m}`;
  }
  async function cloudRead(png, onProgress, cfg, extra){
    const c = cfg.cloud || {}, ep = String(c.endpoint || 'https://eu-vision.googleapis.com').replace(/\/+$/, '');
    if (!c.key) throw new Error('Branje v oblaku ni nastavljeno (config.js → ocr.cloud.key).');
    const tell = pct => { if (onProgress) { try { onProgress({ stage:'cloud', pct }); } catch (e) { /* prikaz ne sme ustaviti branja */ } } };
    const ac = CLOUD_AC = new AbortController(); let timedOut = false; const to = setTimeout(() => { timedOut = true; ac.abort(); }, 90000);
    tell(0);
    try {
      const body = JSON.stringify({ requests:[{ image:{ content:b64(await png.arrayBuffer()) }, features:[{ type:'DOCUMENT_TEXT_DETECTION' }], imageContext:{ languageHints:[c.lang || 'sl'] } }] });
      let r, j = {};
      try { r = await fetch(`${ep}/v1/images:annotate?key=${encodeURIComponent(c.key)}`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body, credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin', signal:ac.signal }); }
      catch (e) {
        if (timedOut) throw new Error('Branje v oblaku je trajalo predolgo (90 s). Poskusi znova ali na Wi-Fi.');
        if (ac.signal.aborted) throw new Error('Razpoznava je bila prekinjena.');
        throw new Error('Povezava z Google Vision ni uspela: preveri internet, vsebinski blokator ali naslov (ocr.cloud.endpoint).');
      }
      try { j = await r.json(); } catch (e) { j = {}; }
      const err = (j && j.error) || (j && j.responses && j.responses[0] && j.responses[0].error);
      if (!r.ok || err) throw new Error(cloudMsg(r.status, err));
      tell(1);
      const full = (j.responses && j.responses[0] && j.responses[0].fullTextAnnotation) || {};
      return extra && extra.words ? { text:S_(full.text), words:visionWords(j), tsv:'' } : S_(full.text);
    } finally { clearTimeout(to); if (CLOUD_AC === ac) CLOUD_AC = null; }
  }
  function ocr(png, onProgress, cfg = ocrCfg(), extra){ return extra && extra.cloud && cloudOn(cfg) ? cloudRead(png, onProgress, cfg, extra) : ocrSession(cfg).run(png, onProgress, extra); }
  /* neobvezno branje v oblaku (config.js → ocr.cloud.key; privzeto izklopljeno): samo za strani knjige, ne za naloge */
  const cloudOn = (cfg = ocrCfg()) => cfg.on !== false && !!(cfg.cloud && cfg.cloud.key);
  const ocrEnabled = (cfg = ocrCfg()) => cfg.on !== false && (!!cfg.lib || cloudOn(cfg));

  return { parse, matchPatient, apply, pdfImages, prepare, ocr, ocrSession, ocrClose, ocrAbort, ocrLimits:OCR_T, stageLabel, ocrEnabled, cloudOn, ocrCfg, lines, zzzsIn, dates, title, fixDigits, toCanvas, enhance, toBlob };
})();
