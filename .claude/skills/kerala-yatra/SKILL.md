---
name: kerala-yatra
description: The Kerala Yatra travel series for info.inmalayalam - one district a day, top 5 places, told by a calm narrator-navigator over a real satellite map with India's official boundary, district outlines, a traveller marker moving along a blue navigation line, and photo pop-ups at each stop. Use for every Kerala Yatra script, voice, map, route or episode build, whenever the owner mentions the trip series, a district episode, "yatra", or the next district, so the owner never has to explain the format again.
---

# Kerala Yatra (owner's rules, 22 Nov 2026)

One district a day, all 14 districts of Kerala in road order, then the next state. Posted at **1:00 PM IST**; the explainer reels (hook-twist style) go at 7:30 PM and stay separate. **Never mix the two styles.**

Road order: 1 Thiruvananthapuram · 2 Kollam · 3 Pathanamthitta · 4 Alappuzha · 5 Kottayam · 6 Idukki · 7 Ernakulam · 8 Thrissur · 9 Palakkad · 10 Malappuram · 11 Kozhikode · 12 Wayanad · 13 Kannur · 14 Kasaragod. The 5 stops in each district run in road order and the last stop is on the side facing the next district.

## 1. Script: narrator and navigator, not a vlog, not a hook-twist

- Malayalam, first person plural ("നമ്മൾ", "നമ്മുടെ യാത്ര"), calm and warm, like a travel documentary narrator sitting next to you. No shock lines, no twist, no CTA. Never say we are foreigners or tourists.
- Every stop has the same four beats: **how we get there** (taxi / auto / KSRTC bus / train / bike + time) -> **name** -> **what we see** -> **one fact or tip** (dress code, closed day, best time, how to get up).
- Episode 1 opens from space (Earth -> India -> Kerala -> "14 districts" -> landing at the airport). Later episodes open on the map where the last one ended: "<previous district>-ൽ നിന്ന് നമ്മുടെ യാത്ര തുടരുന്നു".
- Ending handoff: "<district> ഇവിടെ തീരുന്നു. നമ്മുടെ യാത്ര തുടരുന്നു... <direction>, <next district>-ലേക്ക്."
- About 130-140 words, synced to about 70 s (calm tempo, about 1.15).
- Research rules as always: keep sources in `growth/kerala_trip_NN_<district>_script.md`, real road distances from OSRM, nothing invented, no fares (they change).

## 2. The map: real, exact, satellite (never a hand-drawn map)

**Data (already in the repo; never redraw India by hand):**
- India outline: `tools/mapdata/india_official.geojson` = datameet `Country/india-composite.geojson` (CC0), India's official boundary as shown by the Survey of India, with all of Jammu & Kashmir and Ladakh. Never use Natural Earth / world-atlas outlines for India: they show disputed lines.
- Kerala's 14 districts: `tools/mapdata/kerala_districts.geojson` (datameet, MIT), property `DISTRICT`.
- Roads and real routes: OSRM (`router.project-osrm.org/route/v1/driving/lon,lat;lon,lat?overview=full&geometries=geojson`), OpenStreetMap data (ODbL, credit "© OpenStreetMap contributors"). Major roads for context from Overpass (`overpass-api.de`).

**Satellite imagery (real photos of the Earth, graded to a lush green):**
- Globe and India: NASA Blue Marble Next Generation via NASA GIBS WMS, public domain: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=BlueMarble_NextGeneration&STYLES=&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=<lat0>,<lon0>,<lat1>,<lon1>&WIDTH=..&HEIGHT=..` (8192x4096 for the globe texture, in tiles).
- Kerala and district zooms: EOX **Sentinel-2 cloudless 2016** (`s2cloudless_3857`, CC BY 4.0, 10 m): `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{row}/{col}.jpg` (row = y, col = x, Web Mercator). Credit: "Sentinel-2 cloudless – https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)". Do NOT use the 2017+ layers (CC BY-NC-SA, non-commercial).
- Cache downloaded tiles in `build/tiles/` (not committed); stitch per episode into one big texture.
- The raw imagery is dim: grade it (brightness, contrast, saturation toward rich green, deep blue sea) so Kerala looks green and alive.

**Camera sequence (code-rendered in three.js on top of the real imagery):**
1. (Episode 1 only) A 3D Earth with the Blue Marble texture turns, the camera dives toward India; India's official outline traces in light.
2. Satellite India; Kerala's outline glows; the camera drops to Kerala.
3. Satellite Kerala with **all 14 districts outlined and labelled separately**, numbered in road order; the current district fills with a soft highlight, the next one is marked "NEXT".
4. Satellite district view, tilted slightly like a navigation app.

## 3. Navigation: like a maps app

- The route is a **blue navigation line** (Google-Maps blue #4285F4 with a white casing) that draws along the real OSRM road geometry from stop to stop; the travelled part stays solid, the next leg previews as a lighter dashed line.
- **The traveller ("us") is a marker that moves along the line**: a round avatar puck with a direction arrow (no real person's face), and the vehicle icon changes with the transport (taxi, auto, KSRTC bus, train, bike). The camera follows the marker smoothly.
- A **top navigation bar** like a maps app: next stop name, distance and time, transport icon (e.g. "KOVALAM · 12 km · 20 min · TAXI").
- Stop pins numbered 1-5; visited pins turn green.

## 4. At each stop: the pop-up

- When the marker arrives, the pin bounces and a **place card pops up**: 2-3 real photos (Wikimedia Commons, free licence only: CC0 / CC BY / CC BY-SA; record author + licence for the description), the number and name ("1 · KOVALAM"), one line about it, and a fact or tip chip (e.g. "CLOSED MONDAYS", "DRESS CODE: MUNDU / SAREE", "1,100 m · 22 HAIRPINS").
- Photos move slowly (Ken Burns) and the card stays while the voice talks about the place, then folds back into the pin before the marker drives on.
- Opening card: "KERALA YATRA · EP n/14 · DISTRICT". Ending: the marker drives over the district border and the next district lights up "NEXT · EP n+1/14 · <NEXT>".

## 5. Safe zones, captions, checks

- Same house rules: text out of the top 230 px, bottom 400 px, right 140 px; Malayalam captions for the voice; English names on the map and cards; about -10 LUFS; bright first frame.
- Credits for every episode in the YouTube description: Sentinel-2 cloudless (EOX, CC BY 4.0), NASA Blue Marble (public domain), © OpenStreetMap contributors, datameet, and each photo's author + licence.
- Before the full render: screenshot every stop and check readability; run the stride check (0 mismatches).

## 6. The build, step by step (from episode 1)

1. Script + sources in `growth/kerala_trip_NN_<district>_script.md`; voice MP3 to `audio/yatraNN.mp3`.
2. Episode definition `yatra/epNN.json`: start point, 5 stops (name, card title, one line, chip, lat/lon, legs with mode, photo search words), next district point.
3. `python3 tools/yatra_data.py yatra/epNN.json` -> `build/yatra/epNN/` (OSRM routes, Blue Marble globe + India, Sentinel-2 Kerala / district / city mosaics, outlines, `data.js`). Tiles are cached in `build/tiles/`.
4. `python3 -u tools/yatra_photos.py yatra/epNN.json 3` -> 3 candidates per stop with licence + author. **Wikimedia allows about 600 KB per minute from this machine**, so it runs about 2 photos a minute (the script paces itself); it needs `commons.wikimedia.org` and `thumb.wikimedia.org` allowed. Look at a contact sheet, put the picks in the page's `<script id="photos">`, write `yatra/epNN_photo_credits.md`.
5. Copy `yatra01.html` to `yatraNN.html`, change the config phrases, the data import path and the scenes that differ (episode 1's space intro becomes "<previous district>-ൽ നിന്ന് നമ്മുടെ യാത്ര തുടരുന്നു" on the Kerala map), then `python3 tools/sync.py yatraNN.html`. If the sync's phrase lengths look wrong (a 1-word phrase of 3 s), merge the phrases where the voice does not pause.
6. Screenshot every stop; stride check (0 mismatches); render with `WORKERS=3 tools/build.sh`.

Engine notes (`lib/yatra.js`): every state key must start as a number in `ST` (GSAP turns a key it has never seen into the string "0", which is truthy). Finer imagery layers fade in by camera height, so no imagery rectangle shows from far away. India's simplified outline is for the India view only; fade it out at the Kerala step.
