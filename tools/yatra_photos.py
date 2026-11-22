#!/usr/bin/env python3
"""Kerala Yatra photos: free-licence images from Wikimedia Commons for each stop, with credits.

Usage: python3 tools/yatra_photos.py yatra/ep01.json [N candidates per stop]
Downloads candidates to build/yatra/epNN/photos/s<n>_<k>.jpg (1280 px wide) and writes candidates.json with
author, licence and source page for each. Pick the ones to use in yatra/epNN.json ("pick": [k, k]); credits.md is
written from the picks. Only CC0 / Public domain / CC BY / CC BY-SA files are kept.
"""
import json, os, re, sys, time, urllib.parse, urllib.request, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPF = sys.argv[1]; EP = json.load(open(EPF)); N = int(sys.argv[2]) if len(sys.argv) > 2 else 6
OUT = os.path.join(ROOT, 'build', 'yatra', 'ep%02d' % EP['ep'], 'photos'); os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'reel-map-builder/1.0 (educational short videos)'}
OK = re.compile(r'^(cc0|public domain|pd|cc by(-sa)? [0-9.]+)', re.I)

def get(url):
    for k in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r: return r.read()
        except Exception:
            if k == 7: raise
            time.sleep(45)

def strip(s): return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()

cands = {}
for s in EP['stops']:
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': s['photos'] + ' filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': 30,
                                'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1600})
    pages = json.loads(get('https://commons.wikimedia.org/w/api.php?' + q)).get('query', {}).get('pages', {})
    rows = sorted(pages.values(), key=lambda p: p.get('index', 99)); got = []
    for p in rows:
        ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata', {})
        lic = strip(md.get('LicenseShortName', {}).get('value'))
        if not OK.match(lic) or ii.get('width', 0) < 1600 or ii.get('width', 0) < ii.get('height', 1) * 1.1: continue
        k = len(got); fn = 's%d_%d.jpg' % (s['n'], k)
        u = ii['url']; base = u.split('/')[-1]; th = u.replace('/wikipedia/commons/', '/wikipedia/commons/thumb/') + '/1280px-' + base  # 1280 is a standard bucket on upload.wikimedia.org
        if not re.search(r'\.(jpe?g|png)$', base, re.I): th += '.jpg'  # tif/webp thumbs are served as jpg
        try: b = get(th)
        except Exception as e: print('skip', p['title'][:60], e); continue
        open(os.path.join(OUT, fn), 'wb').write(b)
        got.append({'k': k, 'file': fn, 'title': p['title'], 'license': lic, 'author': strip(md.get('Artist', {}).get('value'))[:120],
                    'page': ii.get('descriptionurl'), 'w': ii['width'], 'h': ii['height']})
        print(s['n'], k, lic, '|', got[-1]['author'][:40], '|', p['title'][:70])
        if len(got) >= N: break
        time.sleep(30)  # upload.wikimedia.org allows ~600 KB/min per client
    cands[s['n']] = got; time.sleep(3)
json.dump(cands, open(os.path.join(OUT, 'candidates.json'), 'w'), indent=1, ensure_ascii=False)
