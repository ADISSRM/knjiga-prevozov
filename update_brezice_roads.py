#!/usr/bin/env python3
"""Download all OSM highway ways in the Municipality of Brezice and write GeoJSON.

Data source: OpenStreetMap / Overpass API.
The query includes all mapped ways tagged highway=* (roads, service roads,
tracks, paths, footways, cycleways, etc.). It does not guarantee that every
physical road is mapped in OSM, and this is not an official municipal road register.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

OVERPASS_URL = os.environ.get(
    "OVERPASS_URL", "https://overpass-api.de/api/interpreter"
)
OUTFILE = "data/brezice-roads.geojson"

# Municipality-level administrative boundary in Slovenia is commonly admin_level=8.
# Use a named administrative area, not a rectangular bounding box.
QUERY = r'''
[out:json][timeout:180];
area["name"="Brežice"]["boundary"="administrative"]["admin_level"="8"]->.municipality;
way(area.municipality)["highway"];
out geom;
'''

def fetch():
    headers = {
        "User-Agent": "ZD-Brezice-TransportBook-road-data-updater/1.0 (GitHub Actions)"
    }
    for attempt in range(5):
        try:
            response = requests.post(
                OVERPASS_URL,
                data={"data": QUERY},
                headers=headers,
                timeout=(30, 240),
            )
            response.raise_for_status()
            payload = response.json()
            if "elements" not in payload:
                raise RuntimeError("Overpass response has no 'elements' array.")
            return payload["elements"]
        except Exception as exc:
            if attempt == 4:
                raise
            wait = 10 * (attempt + 1)
            print(f"Overpass attempt {attempt + 1} failed: {exc}. Waiting {wait}s.")
            time.sleep(wait)

def main():
    elements = fetch()
    features = []

    for way in elements:
        tags = way.get("tags", {})
        coords = [
            [node["lon"], node["lat"]]
            for node in way.get("geometry", [])
            if "lon" in node and "lat" in node
        ]
        if len(coords) < 2:
            continue

        # OSM way geometry is a sequence of points. Use LineString.
        properties = {
            "osm_id": way.get("id"),
            "name": tags.get("name"),
            "name_sl": tags.get("name:sl"),
            "ref": tags.get("ref"),
            "highway": tags.get("highway"),
            "surface": tags.get("surface"),
            "smoothness": tags.get("smoothness"),
            "access": tags.get("access"),
            "vehicle": tags.get("vehicle"),
            "motor_vehicle": tags.get("motor_vehicle"),
            "oneway": tags.get("oneway"),
            "maxspeed": tags.get("maxspeed"),
            "lanes": tags.get("lanes"),
            "bridge": tags.get("bridge"),
            "tunnel": tags.get("tunnel"),
            "source": "OpenStreetMap",
        }

        features.append({
            "type": "Feature",
            "id": f"osm-way-{way.get('id')}",
            "properties": properties,
            "geometry": {
                "type": "LineString",
                "coordinates": coords,
            },
        })

    if not features:
        raise RuntimeError(
            "No road features returned. Boundary lookup may have failed; "
            "refusing to overwrite the existing file with empty data."
        )

    os.makedirs(os.path.dirname(OUTFILE), exist_ok=True)
    output = {
        "type": "FeatureCollection",
        "metadata": {
            "municipality": "Brežice, Slovenia",
            "source": "OpenStreetMap",
            "source_license": "ODbL 1.0",
            "attribution": "© OpenStreetMap contributors",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "feature_count": len(features),
            "query_scope": "All OSM ways tagged highway=* within the OSM municipality boundary",
        },
        "features": features,
    }

    tmp = OUTFILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, OUTFILE)

    print(f"Wrote {len(features)} road/way features to {OUTFILE}")
    print("OSM attribution required in app: © OpenStreetMap contributors")
    print("OSM data is licensed under ODbL: https://www.openstreetmap.org/copyright")

if __name__ == "__main__":
    main()
