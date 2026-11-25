#!/usr/bin/env python3
"""Kerala Yatra data prep: real routes, real satellite imagery, real outlines for one episode.

Usage: python3 tools/yatra_data.py yatra/ep01.json
Writes build/yatra/epNN/: india.jpg, kerala.jpg, district.jpg, city.jpg, globe.jpg (graded), data.js
Sources (credit in every episode description):
  - NASA Blue Marble Next Generation via NASA GIBS (public domain)
  - Sentinel-2 cloudless 2016 by EOX IT Services GmbH (CC BY 4.0), contains modified Copernicus Sentinel data 2016
  - routes: OSRM on OpenStreetMap data (© OpenStreetMap contributors, ODbL)
  - outlines: datameet (India official boundary CC0; Kerala districts MIT)
Tiles are cached in build/tiles/ so re-runs and later episodes are fast.
"""
import json, math, os, sys, io, time, urllib.request
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EP = json.load(open(sys.argv[1]))
OUT = os.path.join(ROOT, 'build', 'yatra', 'ep%02d' % EP['ep']); os.makedirs(OUT, exist_ok=True)
TILES = os.path.join(ROOT, 'build', 'tiles'); os.makedirs(TILES, exist_ok=True)
UA = {'User-Agent': 'reel-map-builder/1.0'}

def get(url, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r: return r.read()
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(1.5 * (k + 1))

# ---- Web Mercator, normalised: X, Y in [0, 1] (Y down)
def merc(lon, lat):
    s = math.sin(math.radians(lat)); return (lon + 180) / 360, .5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)
def unmerc(X, Y):
    return X * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * Y))))

def grade(im, b=1.18, c=1.18, s=1.45):
    im = ImageEnhance.Brightness(im).enhance(b); im = ImageEnhance.Contrast(im).enhance(c); return ImageEnhance.Color(im).enhance(s)

def eox_mosaic(name, lon0, lat0, lon1, lat1, z):
    """Stitch Sentinel-2 cloudless 2016 tiles covering the box; returns the exact mercator bounds of the image."""
    n = 2 ** z; X0, Y0 = merc(lon0, lat1); X1, Y1 = merc(lon1, lat0)
    tx0, tx1, ty0, ty1 = int(X0 * n), int(X1 * n), int(Y0 * n), int(Y1 * n)
    im = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            p = os.path.join(TILES, 's2c16_%d_%d_%d.jpg' % (z, ty, tx))
            if not os.path.exists(p): open(p, 'wb').write(get('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/%d/%d/%d.jpg' % (z, ty, tx)))
            im.paste(Image.open(p).convert('RGB'), ((tx - tx0) * 256, (ty - ty0) * 256))
    grade(im).save(os.path.join(OUT, name + '.jpg'), quality=90)
    print(name, im.size, 'z%d' % z, (tx1 - tx0 + 1) * (ty1 - ty0 + 1), 'tiles')
    return {'img': name + '.jpg', 'X0': tx0 / n, 'Y0': ty0 / n, 'X1': (tx1 + 1) / n, 'Y1': (ty1 + 1) / n}

def gibs_merc(name, lon0, lat0, lon1, lat1, w):
    """NASA Blue Marble NG in Web Mercator for a box (India)."""
    R = 6378137.0; mx = lambda lon: math.radians(lon) * R; my = lambda lat: R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    x0, x1, y0, y1 = mx(lon0), mx(lon1), my(lat0), my(lat1); h = int(round(w * (y1 - y0) / (x1 - x0)))
    p = os.path.join(TILES, 'bm_%s_%d.jpg' % (name, w))
    if not os.path.exists(p): open(p, 'wb').write(get('https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=BlueMarble_NextGeneration&STYLES=&FORMAT=image/jpeg&SRS=EPSG:3857&BBOX=%f,%f,%f,%f&WIDTH=%d&HEIGHT=%d' % (x0, y0, x1, y1, w, h)))
    grade(Image.open(p).convert('RGB'), 1.1, 1.12, 1.3).save(os.path.join(OUT, name + '.jpg'), quality=90)
    X0, Y0 = merc(lon0, lat1); X1, Y1 = merc(lon1, lat0); print(name, (w, h)); return {'img': name + '.jpg', 'X0': X0, 'Y0': Y0, 'X1': X1, 'Y1': Y1}

def gibs_globe(w=8192):
    """Equirectangular world texture for the 3D globe, fetched in 4 quadrants."""
    out = os.path.join(OUT, 'globe.jpg')
    im = Image.new('RGB', (w, w // 2)); q = w // 2
    for i, (la0, lo0) in enumerate([(0, -180), (0, 0), (-90, -180), (-90, 0)]):
        p = os.path.join(TILES, 'bm_globe_%d_%d.jpg' % (w, i))
        if not os.path.exists(p): open(p, 'wb').write(get('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=BlueMarble_NextGeneration&STYLES=&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=%d,%d,%d,%d&WIDTH=%d&HEIGHT=%d' % (la0, lo0, la0 + 90, lo0 + 180, q, q // 2)))
        im.paste(Image.open(p).convert('RGB'), ((i % 2) * q, (i // 2) * (q // 2)))
    grade(im, 1.08, 1.1, 1.25).save(out, quality=88); print('globe', im.size)

# ---- outlines: Douglas-Peucker in mercator space
def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]; dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) or 1e-12
    dmax, k = -1, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x1 * y0 - y1 * x0) / L
        if d > dmax: dmax, k = d, i
    if dmax > eps: return rdp(pts[:k + 1], eps)[:-1] + rdp(pts[k:], eps)
    return [pts[0], pts[-1]]
def rings(geom):
    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    return [p[0] for p in polys]
def outline(geom, eps, minpts=4):
    out = []
    for r in rings(geom):
        m = [merc(lo, la) for lo, la in r]; k = len(m) // 2; s = rdp(m[:k + 1], eps)[:-1] + rdp(m[k:], eps)  # closed ring: simplify in two halves
        if len(s) >= minpts: out.append([[round(x, 7), round(y, 7)] for x, y in s])
    return out

def osrm(a, b):
    u = 'https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson' % (a['lon'], a['lat'], b['lon'], b['lat'])
    r = json.loads(get(u))['routes'][0]; return r['geometry']['coordinates'], r['distance'], r['duration']

def water(a, b, via):
    # a boat leg: a smooth line over the water through hand-picked waypoints [[lat, lon], ...] (OSRM only knows roads)
    import math
    P = [(a['lon'], a['lat'])] + [(lo, la) for la, lo in via] + [(b['lon'], b['lat'])]; out = []
    for i in range(len(P) - 1):
        for k in range(12): u = k / 12; out.append((P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u))
    out.append(P[-1]); sm = [out[0]] + [((out[i - 1][0] + out[i][0] * 2 + out[i + 1][0]) / 4, (out[i - 1][1] + out[i][1] * 2 + out[i + 1][1]) / 4) for i in range(1, len(out) - 1)] + [out[-1]]
    d = sum(6371000 * math.hypot(math.radians(sm[i + 1][0] - sm[i][0]) * math.cos(math.radians(sm[i][1])), math.radians(sm[i + 1][1] - sm[i][1])) for i in range(len(sm) - 1))
    return [list(c) for c in sm], d, d / 3.0  # houseboat speed about 11 km/h

# ---- 1. routes
legs = []; prev = EP['start']
for s in EP['stops']:
    for lg in s['legs']:
        to = lg.get('to', s); coords, dist, dur = water(prev, to, lg['via']) if 'via' in lg else osrm(prev, to)
        legs.append({'stop': s['n'], 'mode': lg['mode'], 'km': round(dist / 1000, 1), 'min': round(dur / 60), 'pts': [[round(x, 7), round(y, 7)] for x, y in (merc(lo, la) for lo, la in coords)]})
        print('leg', s['n'], lg['mode'], legs[-1]['km'], 'km', len(coords), 'pts'); prev = to; time.sleep(.5)
coords, _, _ = water(prev, EP['nextPoint'], EP['exitVia']) if 'exitVia' in EP else osrm(prev, EP['nextPoint']); exitLeg = [[round(x, 7), round(y, 7)] for x, y in (merc(lo, la) for lo, la in coords)]

# ---- 2. imagery
lats = [EP['start']['lat']] + [s['lat'] for s in EP['stops']]; lons = [EP['start']['lon']] + [s['lon'] for s in EP['stops']]
for lg in legs:
    for X, Y in lg['pts']: lo, la = unmerc(X, Y); lats.append(la); lons.append(lo)
img = {}
img['india'] = gibs_merc('india', 66.0, 5.0, 99.5, 37.6, 4096)
img['kerala'] = eox_mosaic('kerala', 74.7, 8.05, 77.6, 12.9, 9)
img['district'] = eox_mosaic('district', min(lons) - .12, min(lats) - .08, max(lons) + .12, max(lats) + .14, 12)
cl = [s for s in EP['stops'] if s['n'] <= 3] + [EP['start']]
img['city'] = eox_mosaic('city', min(s['lon'] for s in cl) - .03, min(s['lat'] for s in cl) - .03, max(s['lon'] for s in cl) + .03, max(s['lat'] for s in cl) + .03, 14)
if not os.path.exists(os.path.join(OUT, 'globe.jpg')): gibs_globe()

# ---- 3. outlines
india = json.load(open(os.path.join(ROOT, 'tools/mapdata/india_official.geojson')))
ind = []
for f in india['features']: ind += outline(f['geometry'], 1.5e-4, 6)
kd = json.load(open(os.path.join(ROOT, 'tools/mapdata/kerala_districts.geojson')))
ORDER = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod']
dist = []
for f in kd['features']:
    nm = f['properties']['DISTRICT']; rs = outline(f['geometry'], 4e-6, 4)
    big = max(rs, key=len); cx = sum(p[0] for p in big) / len(big); cy = sum(p[1] for p in big) / len(big)
    dist.append({'name': nm, 'n': ORDER.index(nm) + 1, 'rings': rs, 'c': [cx, cy]})
dist.sort(key=lambda d: d['n'])

data = {'ep': EP, 'legs': legs, 'exit': exitLeg, 'img': img, 'india': ind, 'districts': dist,
        'pts': {'start': merc(EP['start']['lon'], EP['start']['lat']), 'stops': [merc(s['lon'], s['lat']) for s in EP['stops']], 'next': merc(EP['nextPoint']['lon'], EP['nextPoint']['lat'])}}
open(os.path.join(OUT, 'data.js'), 'w').write('export const DATA = ' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('data.js', os.path.getsize(os.path.join(OUT, 'data.js')) // 1024, 'KB; india rings', len(ind), sum(len(r) for r in ind), 'pts')
