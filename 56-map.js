/* ============================================================================
   INTERAKTIVNI ZEMLJEVID (brez zunanjih knjižnic)
   - povleci (miška / prst), povečaj (kolešček, dvojni klik ali dotik, dva prsta, gumba +/−, tipke), cela pot, čez cel zaslon
   - podlaga: ploščice OpenStreetMap (config.js → tiles; po napravi izklopljivo). Brez ploščic (izklop, brez povezave, blokirano)
     se še vedno prikaže pot in točke na nevtralni mreži.
   - pot po cestah (geometrija OSRM), puščice smeri, oštevilčene točke z okenci (kdo, kdaj, kje), merilo, pripisovanje virov
   Zemljevid se ob ponovnem izrisu strani znova ustvari; pogled (središče, povečava) si zapomni po ključu zemljevida.
   ============================================================================ */
const MAP = (() => {
  const TS = 256, MAXLAT = 85.05112878, MINZ = 2;
  const M = { specs:{}, views:{}, inst:new Set(), full:'' };
  const cfg = () => {
    const t = (window.KP_CONFIG && window.KP_CONFIG.tiles) || {};
    let url = t.url === undefined ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' : String(t.url || '');
    if (url && !(/^https:\/\//.test(url) && url.includes('{z}') && url.includes('{x}') && url.includes('{y}'))) url = '';
    const link = String(t.link || 'https://www.openstreetmap.org/copyright');
    return { url, attr:String(t.attribution || '© prispevajoči OpenStreetMap'), link:/^https:\/\//.test(link) ? link : '', maxZoom:Math.max(5, Math.min(20, +t.maxZoom || 19)), subs:String(t.subdomains || '') };
  };
  const tilesOn = () => !!cfg().url && store.get('kp.map.tiles') !== 'off';
  const tileUrl = (c, z, x, y) => c.url.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{s}', c.subs ? c.subs[(x + y) % c.subs.length] : '');
  /* Web Mercator: koordinate v slikovnih točkah sveta pri povečavi z */
  const px = (lon, lat, z) => { const s = TS * Math.pow(2, z), la = Math.max(-MAXLAT, Math.min(MAXLAT, lat)) * Math.PI / 180; return [(lon + 180) / 360 * s, (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * s]; };
  const ll = (x, y, z) => { const s = TS * Math.pow(2, z); y = Math.max(0, Math.min(s, y)); return [x / s * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y / s))) * 180 / Math.PI]; };
  const ok = p => p && isFinite(p.lon) && isFinite(p.lat);

  const SVGI = {
    plus:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    minus:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    fit:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="10" cy="10" r="2" fill="currentColor"/></svg>',
    full:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 8V4h4M12 4h4v4M16 12v4h-4M8 16H4v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    close:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    layers:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 3l7 4-7 4-7-4 7-4zM3 11l7 4 7-4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" fill="none"/></svg>'
  };

  /* HTML za mesto zemljevida. spec: { routes:[{coords:[[lon,lat],…], color, est}], pins:[{id, lon, lat, kind:'base'|'pu'|'do', label, color, html}] } */
  function html(key, spec, o = {}){
    M.specs[key] = spec;
    return `<div class="rmap"><div class="imap${o.tall ? ' imap-tall' : ''}${M.full === key ? ' imap-full' : ''}" data-map="${esc(key)}"><div class="imap-vp" tabindex="0" role="application" aria-label="${esc(o.label || 'Zemljevid poti')}. Puščice premikajo, plus in minus spreminjata povečavo, 0 prilagodi na celotno pot."></div></div>${o.legend ? `<div class="rleg">${o.legend}</div>` : ''}</div>`;
  }

  function create(el, key, spec0){
    let spec = spec0;
    const vp = el.querySelector('.imap-vp'); if (!vp) return null;
    const c = cfg(); let on = tilesOn();
    const attrHtml = c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener noreferrer">${esc(c.attr)}</a>` : esc(c.attr);
    vp.innerHTML = `<div class="imap-tiles"></div><svg class="imap-svg" aria-hidden="true"></svg><div class="imap-pins"></div>
      <div class="imap-ctl" role="group" aria-label="Upravljanje zemljevida"><button type="button" data-mc="in" aria-label="Povečaj" title="Povečaj">${SVGI.plus}</button><button type="button" data-mc="out" aria-label="Pomanjšaj" title="Pomanjšaj">${SVGI.minus}</button><button type="button" data-mc="fit" aria-label="Prikaži celotno pot" title="Cela pot">${SVGI.fit}</button><button type="button" data-mc="full" aria-label="Čez cel zaslon" title="Čez cel zaslon">${SVGI.full}</button><button type="button" data-mc="tiles" aria-label="Vklopi ali izklopi podlago zemljevida" aria-pressed="${on}" title="Podlaga zemljevida">${SVGI.layers}</button></div>
      <div class="imap-pop" hidden></div><div class="imap-scale" aria-hidden="true"></div><div class="imap-note" hidden></div><div class="imap-attr">${on ? attrHtml : 'Podlaga izklopljena'}</div>`;
    const $t = vp.querySelector('.imap-tiles'), $s = vp.querySelector('.imap-svg'), $p = vp.querySelector('.imap-pins'), $pop = vp.querySelector('.imap-pop'),
      $note = vp.querySelector('.imap-note'), $sc = vp.querySelector('.imap-scale'), $full = vp.querySelector('[data-mc="full"]');
    const tiles = new Map(), bad = new Set();
    let W = 0, H = 0, okN = 0, errN = 0, openId = '', clusters = [], raf = 0, purgeT = 0, dead = false, ro = null;
    let v = M.views[key]; if (!v) v = M.views[key] = { lon:15.59, lat:45.9, zoom:11, user:false };
    const maxZ = () => on ? c.maxZoom : 18;
    const clampZ = z => Math.max(MINZ, Math.min(maxZ(), z));
    const routes = () => (spec.routes || []).filter(r => r.coords && r.coords.length > 1);
    const allPts = () => { const a = []; routes().forEach(r => r.coords.forEach(p => a.push(p))); (spec.pins || []).forEach(p => { if (ok(p)) a.push([p.lon, p.lat]); }); return a.filter(p => isFinite(p[0]) && isFinite(p[1])); };

    function fit(){
      if (!W || !H) return;
      const pts = allPts();
      if (!pts.length){ v.lon = 15.59; v.lat = 45.9; v.zoom = 11; return; }
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pts.forEach(([lo, la]) => { const [x, y] = px(lo, la, 0); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const pL = 40, pR = 66, pV = 44, sx = Math.max(x1 - x0, 1e-7), sy = Math.max(y1 - y0, 1e-7);   // desno je prostor za gumbe
      const z = Math.min(Math.log2((W - pL - pR) / sx), Math.log2((H - 2 * pV) / sy));
      v.zoom = clampZ(Math.min(15.5, isFinite(z) ? z : 14));
      const k = Math.pow(2, v.zoom);
      [v.lon, v.lat] = ll((x0 + x1) / 2 * k + (pR - pL) / 2, (y0 + y1) / 2 * k, v.zoom);
      v.user = false;
    }
    const centerPx = () => px(v.lon, v.lat, v.zoom);
    function pan(dx, dy){ const [cx, cy] = centerPx(); [v.lon, v.lat] = ll(cx - dx, cy - dy, v.zoom); v.user = true; }
    function zoomAt(nz, sx, sy){
      nz = clampZ(nz); if (nz === v.zoom) return;
      const [cx, cy] = centerPx(), wx = cx - W / 2 + sx, wy = cy - H / 2 + sy, k = Math.pow(2, nz - v.zoom);
      [v.lon, v.lat] = ll(wx * k - sx + W / 2, wy * k - sy + H / 2, nz); v.zoom = nz; v.user = true;
    }
    const schedule = () => { if (!raf && !dead) raf = requestAnimationFrame(() => { raf = 0; render(); }); };

    /* ----- ploščice ----- */
    function settle(){
      /* ko so vse potrebne ploščice naložene (ali neuspešne), pobriši tiste izven pogleda ali stare povečave */
      const need = [...tiles.values()].filter(t => t.need);
      if (need.some(t => !t.img.classList.contains('ok') && !t.failed)) return false;
      for (const [k, t] of [...tiles]) if (!t.need){ t.img.remove(); tiles.delete(k); }
      return true;
    }
    function drawTiles(ox, oy){
      if (!on){ for (const t of tiles.values()) t.img.remove(); tiles.clear(); return; }
      const zt = Math.max(0, Math.min(c.maxZoom, Math.round(v.zoom))), n = Math.pow(2, zt), ts = TS * Math.pow(2, v.zoom - zt);
      const tx0 = Math.floor(ox / ts), tx1 = Math.floor((ox + W) / ts), ty0 = Math.max(0, Math.floor(oy / ts)), ty1 = Math.min(n - 1, Math.floor((oy + H) / ts));
      for (const t of tiles.values()) t.need = false;
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 90) return;          // zaščita pred nenavadno velikim pogledom
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){
        const k = zt + '/' + tx + '/' + ty;
        let t = tiles.get(k);
        if (!t){
          if (bad.has(k)) continue;
          const wx = ((tx % n) + n) % n, img = new Image();
          img.className = 'imap-t'; img.alt = ''; img.draggable = false; img.decoding = 'async';
          img.referrerPolicy = 'origin';        // pravila strežnika ploščic zahtevajo Referer (samo izvor, brez poti); stran sicer pošilja no-referrer
          img.style.zIndex = zt;
          t = { img, z:zt, tx, ty, need:true, failed:false };
          img.onload = () => { img.classList.add('ok'); okN++; $note.hidden = true; if (!purgeT) purgeT = setTimeout(() => { purgeT = 0; settle(); }, 60); };
          img.onerror = () => { t.failed = true; bad.add(k); errN++; img.remove(); tiles.delete(k); if (errN >= 3 && !okN){ $note.textContent = 'Podlaga zemljevida ni dosegljiva (brez povezave ali blokirana). Prikazana sta samo pot in točke.'; $note.hidden = false; } if (!purgeT) purgeT = setTimeout(() => { purgeT = 0; settle(); }, 60); };
          img.src = tileUrl(c, zt, wx, ty);
          $t.appendChild(img); tiles.set(k, t);
        }
        t.need = true;
      }
      for (const t of tiles.values()){
        const s = TS * Math.pow(2, v.zoom - t.z);
        t.img.style.width = t.img.style.height = (s + 0.6) + 'px';
        t.img.style.transform = `translate(${(t.tx * s - ox).toFixed(1)}px,${(t.ty * s - oy).toFixed(1)}px)`;
      }
      if (!purgeT) purgeT = setTimeout(() => { purgeT = 0; settle(); }, 400);
    }

    /* ----- pot (SVG) ----- */
    function drawRoutes(ox, oy){
      let out = '';
      for (const r of routes()){
        let d = '', lx = -1e9, ly = -1e9, arrows = '', acc = 0, px0 = null;
        r.coords.forEach(([lo, la], i) => {
          const [x, y] = px(lo, la, v.zoom), X = x - ox, Y = y - oy;
          if (i && Math.abs(X - lx) < 1.2 && Math.abs(Y - ly) < 1.2 && i < r.coords.length - 1) return;
          d += (d ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
          if (px0){
            const seg = Math.hypot(X - px0[0], Y - px0[1]); acc += seg;
            if (acc > 130 && seg > 6 && X > -20 && X < W + 20 && Y > -20 && Y < H + 20){ acc = 0; arrows += `<path class="imap-arrow" d="M-4 -4L3 0L-4 4" transform="translate(${((X + px0[0]) / 2).toFixed(1)} ${((Y + px0[1]) / 2).toFixed(1)}) rotate(${(Math.atan2(Y - px0[1], X - px0[0]) * 180 / Math.PI).toFixed(0)})"/>`; }
          }
          px0 = [X, Y]; lx = X; ly = Y;
        });
        if (!d) continue;
        out += `<path class="imap-casing" d="${d}"/><path class="imap-line${r.est ? ' est' : ''}" style="stroke:${r.color || 'var(--info)'}" d="${d}"/>${r.est ? '' : arrows}`;
      }
      $s.setAttribute('viewBox', `0 0 ${W} ${H}`); $s.setAttribute('width', W); $s.setAttribute('height', H);
      $s.innerHTML = out;
    }

    /* ----- točke (združene, če so blizu skupaj) ----- */
    function drawPins(ox, oy){
      const items = (spec.pins || []).filter(ok).map(p => { const [x, y] = px(p.lon, p.lat, v.zoom); return { p, x:x - ox, y:y - oy }; }).filter(q => q.x > -30 && q.x < W + 30 && q.y > -30 && q.y < H + 30);
      clusters = [];
      for (const q of items){
        let cl = clusters.find(k => Math.hypot(k.x - q.x, k.y - q.y) < 19);
        if (!cl){ cl = { x:q.x, y:q.y, items:[] }; clusters.push(cl); }
        cl.items.push(q.p);
      }
      $p.innerHTML = clusters.map((k, i) => {
        const non = k.items.filter(p => p.kind !== 'base'), base = !non.length;
        const labels = [...new Set(non.map(p => p.label).filter(Boolean))], lab = base ? '' : (labels.join(',').length > 9 ? labels.slice(0, 3).join(',') + '…' : labels.join(','));
        const drop = non.some(p => p.kind === 'do'), col = (non[0] && non[0].color) || '';
        const ids = k.items.map(p => p.id).join(',');
        const name = k.items.map(p => p.name || p.label || '').filter(Boolean).join('; ');
        return `<button type="button" class="imap-pin${base ? ' base' : ''}${drop ? ' do' : ''}${!base && k.items.some(p => p.kind === 'base') ? ' mixed' : ''}${openId && k.items.some(p => p.id === openId) ? ' sel' : ''}" data-ci="${i}" data-ids="${esc(ids)}" style="transform:translate(${k.x.toFixed(1)}px,${k.y.toFixed(1)}px)${col ? ';--pc:' + col : ''}" aria-label="${esc(base ? 'Postaja' : 'Postanek ' + lab)}${name ? ': ' + esc(name) : ''}">${esc(lab)}</button>`;
      }).join('');
      placePop();
    }
    function placePop(){
      if (!openId){ $pop.hidden = true; return; }
      const k = clusters.find(q => q.items.some(p => p.id === openId));
      if (!k){ $pop.hidden = true; return; }
      if ($pop.dataset.for !== openId){
        $pop.innerHTML = `<button type="button" class="imap-x" data-mc="pop-x" aria-label="Zapri okno">${SVGI.close}</button>` + k.items.map(p => `<div class="imap-pi">${p.html || esc(p.label || '')}</div>`).join('');
        $pop.dataset.for = openId;
      }
      $pop.hidden = false;
      const w = $pop.offsetWidth, h = $pop.offsetHeight;
      let left = Math.max(6, Math.min(W - w - 6, k.x - w / 2)), top = k.y - 20 - h;
      if (top < 6) top = Math.min(H - h - 6, k.y + 20);
      $pop.style.left = left + 'px'; $pop.style.top = Math.max(6, top) + 'px';
    }
    function scale(){
      const mpp = 156543.03392 * Math.cos(v.lat * Math.PI / 180) / Math.pow(2, v.zoom);
      const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000], target = 90 * mpp;
      let m = steps[0]; for (const s of steps) if (s <= target) m = s;
      $sc.style.width = Math.max(18, m / mpp) + 'px'; $sc.textContent = m >= 1000 ? (m / 1000) + ' km' : m + ' m';
    }
    function render(){
      if (dead) return;
      W = vp.clientWidth; H = vp.clientHeight; if (!W || !H) return;
      if (!v.user && !v.fitted){ fit(); }
      const [cx, cy] = centerPx(), ox = cx - W / 2, oy = cy - H / 2;
      drawTiles(ox, oy); drawRoutes(ox, oy); drawPins(ox, oy); scale();
    }

    /* ----- upravljanje ----- */
    const ptrs = new Map(); let moved = false, downPin = null, lastTap = { t:0, x:0, y:0 }, pinch = null, travel = 0;
    const rect = () => vp.getBoundingClientRect();
    vp.addEventListener('pointerdown', e => {
      if (e.target.closest('.imap-ctl, .imap-pop, .imap-attr')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { vp.setPointerCapture(e.pointerId); } catch(_){}
      ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });
      if (ptrs.size === 1){ moved = false; travel = 0; downPin = e.target.closest('.imap-pin'); }
      if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch = { d:Math.hypot(a.x - b.x, a.y - b.y) || 1, z:v.zoom, mx:(a.x + b.x) / 2, my:(a.y + b.y) / 2 }; moved = true; downPin = null; }
      vp.classList.add('grab');
    });
    vp.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1){
        travel += Math.abs(dx) + Math.abs(dy);
        if (travel > 5){ moved = true; pan(dx, dy); schedule(); }
      } else if (ptrs.size === 2 && pinch){
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = rect();
        pan(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my;
        zoomAt(pinch.z + Math.log2(d / pinch.d), mx - r.left, my - r.top); schedule();
      }
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return;
      const wasOne = ptrs.size === 1; ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (!ptrs.size) vp.classList.remove('grab');
      if (e.type === 'pointerup' && wasOne && !moved){
        if (downPin){ openPin(downPin); }
        else {
          const now = Date.now(), r = rect(), x = e.clientX - r.left, y = e.clientY - r.top;
          if (now - lastTap.t < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 30){ zoomAt(v.zoom + 1, x, y); schedule(); lastTap.t = 0; }
          else { lastTap = { t:now, x, y }; if (openId){ openId = ''; $pop.dataset.for = ''; placePop(); drawPins(...origin()); } }
        }
      }
      downPin = null;
    };
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    const origin = () => { const [cx, cy] = centerPx(); return [cx - W / 2, cy - H / 2]; };
    vp.addEventListener('wheel', e => {
      e.preventDefault();
      const r = rect(), d = -e.deltaY * (e.deltaMode ? 0.05 : 0.0022);
      zoomAt(v.zoom + Math.max(-0.7, Math.min(0.7, d)), e.clientX - r.left, e.clientY - r.top); schedule();
    }, { passive:false });
    function openPin(btn){
      const ids = (btn.dataset.ids || '').split(','), first = ids[0]; if (!first) return;
      openId = openId === first ? '' : first; $pop.dataset.for = '';
      drawPins(...origin());
    }
    $p.addEventListener('click', e => { const b = e.target.closest('.imap-pin'); if (b && e.detail === 0) openPin(b); });   // tipkovnica (Enter/preslednica)
    function setFull(on2){
      M.full = on2 ? key : ''; el.classList.toggle('imap-full', on2); document.documentElement.classList.toggle('imap-lock', on2);
      $full.setAttribute('aria-label', on2 ? 'Zapri celozaslonski prikaz' : 'Čez cel zaslon'); $full.innerHTML = on2 ? SVGI.close : SVGI.full;
      if (on2) vp.focus(); schedule();
    }
    function setTiles(x){ store.set('kp.map.tiles', x ? 'on' : 'off'); on = tilesOn(); vp.querySelector('[data-mc="tiles"]').setAttribute('aria-pressed', on); vp.querySelector('.imap-attr').innerHTML = on ? attrHtml : 'Podlaga izklopljena'; if (!on){ $note.hidden = true; for (const t of tiles.values()) t.img.remove(); tiles.clear(); } v.zoom = clampZ(v.zoom); schedule(); }
    vp.addEventListener('click', e => {
      const b = e.target.closest('[data-mc]'); if (!b) return;
      const a = b.dataset.mc, cxx = W / 2, cyy = H / 2;
      if (a === 'in') zoomAt(Math.floor(v.zoom + 1e-6) + 1, cxx, cyy);
      else if (a === 'out') zoomAt(Math.ceil(v.zoom - 1e-6) - 1, cxx, cyy);
      else if (a === 'fit'){ v.user = false; v.fitted = false; fit(); }
      else if (a === 'full') setFull(!el.classList.contains('imap-full'));
      else if (a === 'tiles') setTiles(!on);
      else if (a === 'pop-x'){ openId = ''; $pop.dataset.for = ''; }
      schedule();
    });
    vp.addEventListener('keydown', e => {
      if (e.target.closest('.imap-pin, .imap-ctl, .imap-pop')){ if (e.key === 'Escape' && openId){ openId = ''; $pop.dataset.for = ''; schedule(); e.stopPropagation(); } return; }
      const k = e.key; let h = true;
      if (k === 'ArrowLeft') pan(60, 0); else if (k === 'ArrowRight') pan(-60, 0); else if (k === 'ArrowUp') pan(0, 60); else if (k === 'ArrowDown') pan(0, -60);
      else if (k === '+' || k === '=') zoomAt(v.zoom + 0.5, W / 2, H / 2); else if (k === '-' || k === '_') zoomAt(v.zoom - 0.5, W / 2, H / 2);
      else if (k === '0' || k === 'Home'){ v.user = false; v.fitted = false; fit(); }
      else if (k === 'Escape'){ if (openId){ openId = ''; $pop.dataset.for = ''; } else if (el.classList.contains('imap-full')) setFull(false); else h = false; }
      else h = false;
      if (h){ e.preventDefault(); schedule(); }
    });
    if (typeof ResizeObserver !== 'undefined'){ ro = new ResizeObserver(() => schedule()); ro.observe(vp); }
    if (el.classList.contains('imap-full')){ document.documentElement.classList.add('imap-lock'); $full.innerHTML = SVGI.close; }
    render();

    const api = {
      el, key, render, fit:() => { v.user = false; v.fitted = false; fit(); schedule(); },
      focusPin(id, z){
        const p = (spec.pins || []).find(q => q.id === id); if (!p || !ok(p)) return false;
        v.zoom = clampZ(Math.max(v.zoom, z || 14)); v.lon = p.lon; v.lat = p.lat; v.user = true; openId = id; $pop.dataset.for = ''; render(); return true;
      },
      setSpec(sp){ spec = sp; $pop.dataset.for = ''; schedule(); },
      destroy(){ dead = true; if (ro) ro.disconnect(); clearTimeout(purgeT); cancelAnimationFrame(raf); tiles.clear(); }
    };
    return api;
  }

  function mountAll(root){
    for (const m of [...M.inst]) if (!m.el.isConnected){ m.destroy(); M.inst.delete(m); }
    if (M.full && !document.querySelector('.imap.imap-full')){ M.full = ''; document.documentElement.classList.remove('imap-lock'); }
    (root || document).querySelectorAll('.imap[data-map]').forEach(el => {
      if (el.__imap) return;
      const spec = M.specs[el.dataset.map]; if (!spec) return;
      el.__imap = create(el, el.dataset.map, spec); if (el.__imap) M.inst.add(el.__imap);
    });
  }
  /* zamenjaj vsebino že prikazanega zemljevida (npr. ko se naložijo ceste), pogled ostane */
  function update(key, spec){
    M.specs[key] = spec;
    for (const m of M.inst) if (m.key === key && m.el.isConnected) m.setSpec(spec);
  }
  /* pomakni zemljevid na točko (klik na postanek v seznamu) */
  function focus(key, id){
    for (const m of M.inst) if (m.key === key && m.el.isConnected){ m.el.scrollIntoView({ block:'nearest', behavior:'smooth' }); return m.focusPin(id); }
    return false;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && M.full){ const m = [...M.inst].find(x => x.key === M.full); const b = m && m.el.querySelector('[data-mc="full"]'); if (b) b.click(); } });
  return Object.assign(M, { html, mountAll, update, focus, cfg, tilesOn, px, ll });
})();
