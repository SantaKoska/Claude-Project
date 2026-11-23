#!/usr/bin/env python3
"""Fetch named Wikimedia Commons files (API thumbnail, paced for the rate limit) with licence + author.
Usage: python3 tools/commons_fetch.py out_dir 'key=File title' ['key=File title' ...]  -> out_dir/<key>.<ext>, out_dir/credits.json
"""
import json, os, re, sys, time, html, urllib.parse, urllib.request
UA = {'User-Agent': 'reel-map-builder/1.0 (educational short videos)'}
def get(url, tries=8):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r: return r.read()
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(40)
strip = lambda s: html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()
out = sys.argv[1]; os.makedirs(out, exist_ok=True); cp = os.path.join(out, 'credits.json')
cred = json.load(open(cp)) if os.path.exists(cp) else {}
for arg in sys.argv[2:]:
    key, title = arg.split('=', 1)
    if key in cred and os.path.exists(os.path.join(out, cred[key]['file'])): continue
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': 'File:' + title, 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1280})
    pg = list(json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']['pages'].values())[0]; ii = pg['imageinfo'][0]; md = ii.get('extmetadata', {})
    th = ii['thumburl']; ext = os.path.splitext(th.split('?')[0])[1].lower() or '.jpg'
    open(os.path.join(out, key + ext), 'wb').write(get(th))
    cred[key] = {'file': key + ext, 'title': title, 'license': strip(md.get('LicenseShortName', {}).get('value')), 'author': strip(md.get('Artist', {}).get('value'))[:100], 'page': ii.get('descriptionurl')}
    json.dump(cred, open(cp, 'w'), indent=1, ensure_ascii=False); print(key, cred[key]['license'], '|', cred[key]['author'][:50], flush=True); time.sleep(25)
