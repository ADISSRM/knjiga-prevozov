#!/usr/bin/env python3
"""Sestavi produkcijsko mapo dist/ (to naložiš na GitHub Pages): index.html, app.js, style.css, config.js, boot.js,
sw.js, manifest.webmanifest, icons/, logos/. Brez inline skript, s strogim CSP, brez zunanjih pisav."""
import re, hashlib, shutil, pathlib
from PIL import Image, ImageDraw

root = pathlib.Path(__file__).parent
src, dep, out = root / 'src', root / 'deploy', root / 'dist'
if out.exists(): shutil.rmtree(out)
(out / 'icons').mkdir(parents=True); (out / 'logos').mkdir()

head = (src / '00-head.html').read_text(encoding='utf-8')
css = '\n'.join(re.findall(r'<style>(.*?)</style>', head, re.S))
assert css.strip(), 'CSS ni najden'
(out / 'style.css').write_text(css, encoding='utf-8')

order = ['20-data', '30-core', '35-db', '40-planner', '45-pacienti', '50-views', '52-views2', '55-live', '60-main']
js = '\n'.join((src / f'{n}.js').read_text(encoding='utf-8') for n in order)
(out / 'app.js').write_text(js, encoding='utf-8')
body = (src / '10-body.html').read_text(encoding='utf-8')
assert '<script' not in body and not re.search(r'\son[a-z]+=', body), 'v telesu je inline skripta'

csp = "; ".join([
    "default-src 'none'",
    "script-src 'self' https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "manifest-src 'self'", "worker-src 'self'",
    "base-uri 'none'", "form-action 'self'", "object-src 'none'"])
html = f'''<!doctype html>
<html lang="sl">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<meta name="referrer" content="no-referrer">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#0D1A2C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Prevozi">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Knjiga reševalnih prevozov</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
{body}
<script src="boot.js"></script>
<script src="config.js"></script>
<script src="app.js"></script>
</body>
</html>
'''
(out / 'index.html').write_text(html, encoding='utf-8')

# ikone: splošen znak križa (NI uradni logotip ZD Brežice ali NMP)
def icon(size, maskable=False):
    s = size * 4
    im = Image.new('RGBA', (s, s), (13, 26, 44, 255))
    d = ImageDraw.Draw(im)
    if not maskable:
        m = Image.new('L', (s, s), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * .22), fill=255)
        bg = Image.new('RGBA', (s, s), (0, 0, 0, 0)); bg.paste(im, (0, 0), m); im = bg; d = ImageDraw.Draw(im)
    k = .30 if maskable else .36            # polovica dolžine kraka; varno območje za maskable ikone
    w = s * (.15 if maskable else .17) / 2
    c = s / 2
    d.rounded_rectangle((c - w, c - s * k, c + w, c + s * k), radius=w * .5, fill=(221, 82, 7, 255))
    d.rounded_rectangle((c - s * k, c - w, c + s * k, c + w), radius=w * .5, fill=(221, 82, 7, 255))
    return im.resize((size, size), Image.LANCZOS)
icon(192).save(out / 'icons/icon-192.png'); icon(512).save(out / 'icons/icon-512.png')
icon(512, True).save(out / 'icons/icon-maskable-512.png'); icon(32).save(out / 'icons/icon-32.png')
ai = icon(180, True); ai.convert('RGB').save(out / 'icons/apple-touch-icon.png')

(out / 'logos/README.txt').write_text('Sem skopiraj logotipa (PNG, prosojno ozadje, višina vsaj 120 px):\n  zd-brezice.png  (logotip ZD Brežice)\n  nmp.png         (logotip NMP)\nČe datotek ni, aplikacija pokaže besedilo. Logotipe lahko naložiš tudi v Nastavitve > Logotipi (velja samo za ta telefon/brskalnik).\n', encoding='utf-8')
for f in ('config.js', 'boot.js', 'manifest.webmanifest', '.nojekyll'): shutil.copy(dep / f, out / f)
if (dep / 'naslovi.json').exists(): shutil.copy(dep / 'naslovi.json', out / 'naslovi.json')
build = hashlib.sha256(''.join((out / n).read_text(encoding='utf-8') for n in ('app.js', 'style.css', 'index.html', 'boot.js')).encode()).hexdigest()[:10]
(out / 'sw.js').write_text((dep / 'sw.js').read_text(encoding='utf-8').replace('__BUILD__', build), encoding='utf-8')
print('dist OK, build', build, {p.name: p.stat().st_size for p in out.iterdir() if p.is_file()})
