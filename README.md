# Malayalam facts reel (code-only, 9:16)

`index.html` is the whole animation: SVG shapes + GSAP on one paused timeline,
with `window.seek(t)`. Edit the **CONFIG** block at its top (facts, phrases, labels,
colours, hero-object drawing), replace `audio/voice.mp3`, then:

```bash
./tools/build.sh out/my_reel.mp4
```

Pipeline: `tools/sync.py` (silence detection → tighten pauses → word timings written into
index.html) → `tools/render.js` (Playwright, 30 fps frames → H.264 yuv420p) →
`tools/audio.py` (generated music + whoosh/pop/tick/chime/thud, ducking, master to ≈ −10 LUFS) → mux.

Preview: open `index.html?play` and click (plays with voice), `?t=12.5` to freeze a frame,
`?guides` to show the Instagram-covered zones.  Font: FreeSans (installed, Malayalam-capable).

## Beat style (from Video 5 on)

Borrowed from lemo-opuscar's TECHNIQUE.md ("one timeline drives everything"):
- `tools/sync.py` picks a tempo + downbeat phase so scene changes fall on beats (`timings.beat`).
- The page exposes `window.BEAT` and snaps every visual hit (pops, stamps, scene cuts) to the grid;
  captions stay locked to the voice. Pops snap in ~0.13 s with overshoot and hold until the next beat;
  the key reveal of each video gets a freeze-on-the-beat.
- `tools/audio.py` writes the music on the same grid and adds a `hit` (boom + crash) on scene downbeats.
- `python3 tools/cuecheck.py <stem>` reports any hit that misses its beat by more than half a frame.
