#!/bin/bash
# Sestavi app.html (vsebina za Artifact) in index.html (samostojna stran za GitHub Pages)
set -e
cd "$(dirname "$0")"
{
  cat src/00-head.html
  cat src/10-body.html
  echo '<script>'
  cat src/20-data.js src/30-core.js src/35-db.js src/40-planner.js src/45-pacienti.js src/50-views.js src/52-views2.js src/55-live.js src/60-main.js
  echo '</script>'
} > app.html
{
  echo '<!doctype html>'
  echo '<html lang="sl">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo '<meta name="robots" content="noindex, nofollow">'
  echo '<meta name="color-scheme" content="light dark">'
  echo '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>'
  echo '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%278%27 fill=%27%23DD5207%27/%3E%3Cpath d=%27M16 8v16M8 16h16%27 stroke=%27white%27 stroke-width=%273.5%27 stroke-linecap=%27round%27/%3E%3C/svg%3E">'
  cat src/00-head.html
  echo '</head>'
  echo '<body>'
  cat src/10-body.html
  echo '<script>'
  cat src/20-data.js src/30-core.js src/35-db.js src/40-planner.js src/45-pacienti.js src/50-views.js src/52-views2.js src/55-live.js src/60-main.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > index.html
wc -c app.html index.html
