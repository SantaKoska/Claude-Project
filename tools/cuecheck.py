#!/usr/bin/env python3
"""Check that visual hits land on the beat grid.  Usage: python3 tools/cuecheck.py <stem>"""
import json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
stem = sys.argv[1] if len(sys.argv) > 1 else "index"
m = json.load(open(os.path.join(ROOT, "build", stem, "sfx.json")))
b = m.get("beat")
if not b: sys.exit("no beat grid in sfx.json (page must expose window.BEAT)")
beat = 30 / b["bpm"]   # 8th-note grid
on = ("pop", "hit", "thud", "chime", "whoosh")
offs = [(e["t"], e["type"], ((e["t"] - b["t0"] + beat / 2) % beat) - beat / 2) for e in m["sfx"] if e["type"] in on]
bad = [o for o in offs if abs(o[2]) > 0.017]
print(f"{b['bpm']} BPM: {len(offs) - len(bad)}/{len(offs)} hits within half a frame of a beat")
for t, k, d in bad[:20]: print(f"  {t:7.3f}s {k:7s} off by {d*1000:+.0f} ms")
