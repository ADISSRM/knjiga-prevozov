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

order = ['20-data', '30-core', '35-db', '37-geocode', '38-routing', '39-google', '40-planner', '45-pacienti', '50-views', '52-views2', '54-quick', '55-live', '56-map', '60-main']
js = '\n'.join((src / f'{n}.js').read_text(encoding='utf-8') for n in order)
(out / 'app.js').write_text(js, encoding='utf-8')
body = (src / '10-body.html').read_text(encoding='utf-8')
assert '<script' not in body and not re.search(r'\son[a-z]+=', body), 'v telesu je inline skripta'

csp = "; ".join([
    "default-src 'none'",
    "script-src 'self' https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    # podlaga zemljevida: ploščice OpenStreetMap. Če v config.js zamenjaš tiles.url, dodaj njegov izvor sem.
    "img-src 'self' data: blob: https://tile.openstreetmap.org",
    "font-src 'self'",
    # povezave: Firebase + strežnik za cestno usmerjanje (OSRM; samo koordinate) + iskanje naslovov (Nominatim; samo besedilo naslova). Če ju zamenjaš (config.js → routing / geocode), dodaj izvor sem.
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://router.project-osrm.org https://routing.openstreetmap.de https://nominatim.openstreetmap.org",
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

for lf in (dep / 'logos').glob('*.png'): shutil.copy(lf, out / 'logos' / lf.name)      # logotipa ZD Brežice in NMP (Nastavitve → Logotipi ju lahko zamenja na posamezni napravi)
shutil.copy(dep / 'logos' / 'README.txt', out / 'logos' / 'README.txt') if (dep / 'logos' / 'README.txt').exists() else None
for f in ('config.js', 'boot.js', 'manifest.webmanifest', '.nojekyll'): shutil.copy(dep / f, out / f)
if (dep / 'naslovi.json').exists(): shutil.copy(dep / 'naslovi.json', out / 'naslovi.json')
if (dep / 'razdalje.json').exists(): shutil.copy(dep / 'razdalje.json', out / 'razdalje.json')
build = hashlib.sha256(''.join((out / n).read_text(encoding='utf-8') for n in ('app.js', 'style.css', 'index.html', 'boot.js')).encode()).hexdigest()[:10]
(out / 'sw.js').write_text((dep / 'sw.js').read_text(encoding='utf-8').replace('__BUILD__', build), encoding='utf-8')
print('dist OK, build', build, {p.name: p.stat().st_size for p in out.iterdir() if p.is_file()})
