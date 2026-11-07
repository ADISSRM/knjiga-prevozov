# Brežice OSM road-network updater

## What it does
GitHub Actions runs every day and fetches every OpenStreetMap way tagged
`highway=*` within the OSM administrative boundary for the Municipality of Brežice.
It writes `data/brezice-roads.geojson` and commits the file if it changed.

Included categories can include roads, residential/service roads, tracks,
paths, footways, cycleways, and other `highway=*` ways. This is intentionally
a broad export; the application should filter drivable road classes for ambulance
routing, rather than treating footways and paths as drivable.

## Install
1. Extract this ZIP into the root of your existing GitHub repository.
2. Keep the existing app files; merge these folders rather than replacing the repo.
3. In GitHub, open **Settings → Actions → General**.
4. Under Workflow permissions, enable **Read and write permissions**.
5. Open **Actions → Update Brezice road network → Run workflow** for the first run.
6. The result will be committed to `data/brezice-roads.geojson`.
7. The workflow then runs daily automatically.

## Use in your app
Fetch the generated file from your GitHub Pages site, e.g.:
`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/data/brezice-roads.geojson`

Use the actual repository and GitHub Pages URL. Do not hardcode this example URL.

## Important
- This fetches OpenStreetMap data, not the municipality's official BCP road inventory.
- OSM may omit some roads or have incomplete attributes. It is not a guarantee of literally every physical road.
- This data is road geometry, not the official address/house-number dataset.
- OSM requires attribution: **© OpenStreetMap contributors** and compliance with ODbL:
  https://www.openstreetmap.org/copyright
- Do not use all `highway=*` features for vehicle routing. Filter out footways, steps,
  pedestrian-only roads and inaccessible ways based on access tags and vehicle profile.
- Overpass API is a shared service and may occasionally be unavailable. The script retries
  and does not replace the output if it gets no features.
