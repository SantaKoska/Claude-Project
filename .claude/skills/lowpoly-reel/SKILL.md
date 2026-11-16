---
name: lowpoly-reel
description: Make a 9:16 Malayalam (or any language) reel in the low-poly 3D style - faceted characters with faces and glasses, a night-blue pine forest, crescent moon, warm laptop or campfire light, drifting glow motes and a slow cinematic camera - synced word by word to a voiceover MP3, rendered frame-exact to MP4. Use whenever the user asks for a "3D" or "low-poly" video, "this type of 3D animation", a reel like a cosy night-forest explainer, or a story with animated 3D people. Built on lib/lowpoly.js and lowpoly_reel.html in this repo.
---

# lowpoly-reel

The house 3D style for info.inmalayalam. One HTML page, Three.js (vendored, no CDN), one paused GSAP timeline, `window.seek(t)` - every frame depends only on time.

## Files

| file | job |
| --- | --- |
| `lib/lowpoly.js` | the kit: `LP.renderer`, `LP.world`, `LP.person`, `LP.laptop`, `LP.log`, `LP.campfire`, `LP.pine`, `LP.orbit`, `LP.toScreen`, `LP.speakFrom`, `LP.glowTexture` |
| `lowpoly_reel.html` | template page: config, cast, shots, captions, labels that follow 3D points. Copy it per video (`<topic>_3d.html`). |
| `tools/sync.py` | voice -> phrases -> word times + beat grid (writes `<script id="timings">`) |
| `tools/render.js` | Playwright + SwiftShader WebGL, 4 workers, JPEG frames -> H.264 yuv420p |
| `tools/audio.py` | music + SFX in code, ducking, master to about -10 LUFS |
| `tools/build.sh page.html out.mp4` | all of the above |
| `tools/shots.js` | `PAGE=page.html node tools/shots.js outdir t1 t2 ... [guides]` |

## Workflow

1. **Script first.** Research, sources, Malayalam script with "..." pauses, no follow request (share/comment ask instead). Get the user's OK, then they record in ElevenLabs.
2. **Copy the template** to `<topic>_3d.html`. Set `voice`, `sentences` (phrases must match pauses), `world.palette` (`night`, `dusk`, `day`) and the `cast`.
3. **Run `python3 tools/sync.py <page>`** (never pipe it into `head` - a broken pipe stops it before it saves).
4. **Write shots per sentence** with `sStart/pS/wT` times, the same way the 2D pages do: tween `CAM` and each person's `S` state on the timeline; pop SVG labels with `anchor(Vector3)` so they ride on 3D points.
5. **Check 10+ moments** with `tools/shots.js ... guides`, read the contact sheet, fix, repeat. Zoom into captions for Malayalam conjuncts.
6. **Build** with `tools/build.sh <page> out/<name>.mp4`, run it in the foreground (or `run_in_background` on the command itself - never `&` inside a background command, it gets killed). Then verify: `ffprobe -count_frames` must equal duration x 30, loudness about -10 LUFS, `tools/cuecheck.py <stem>` all hits on the beat. Pull 6-8 frames from the final MP4 and look at them.

## The person (`LP.person`)

```js
const p = LP.person(R.scene, { skin, hair, hairStyle: 'curly'|'short'|'long'|'bun'|'buzz', top, collar, pants, shoes, glasses: true, seed });
p.S = { x, y, z, ry,            // position (m) and facing (deg, 0 faces +z / the camera)
        walk, run, sit, seat,    // 0..1 blends, seat = hip height when sitting (~.44 on a log)
        armL, armR,              // [shoulder fwd, elbow bend, inward] in deg; null = walk swing
        look, tilt, nod, lean,   // head yaw / roll / pitch, chest lean
        talk, smile, speed }     // talk 1 + p.speakFn = LP.speakFrom(words) moves the mouth on each word
p.update(t, mouthOpen)           // call in render(t); blinks by itself
```

Poses that work:
- **typing on a laptop:** `sit 1, seat .44, lean 10, nod 8, armL/armR [30, 62, 28]`, laptop at `(0, .6, .4)` on the person's root, small `sin(t*9)` jitter added in render.
- **waving:** the arm nearer the camera, `[150, 25, -35]`, elbow `25 + 25*sin(t*9)`.
- **walking in:** `walk 1, speed .9`, tween `x`, then `walk 0` and turn `ry` toward the other person.
- **pointing:** `[95, 5, 10]`.

## Look rules

- **Original characters only.** Never recreate a specific creator's, brand's or film's character, and never try to copy a real person's face. Real people (Pliny, Cowan) get fitting clothes and hair, nothing more.
- **Palette:** night-blue sky `#121F48`, faceted ground, 4 tree blues, warm key from a laptop screen or campfire, cool moon key from the upper left, blue rim from behind. ACES tone mapping, exposure ~1.15.
- **Warm light on faces:** every scene needs a warm source (laptop, campfire, lantern) near the face, or faces go dark.
- **Framing in 9:16:** the horizontal view is narrow. One person: camera 3-4.5 m. Two people: keep them within ~1.2 m of each other and pull back to 6-7 m; a walk-in wide shot needs 9-11 m. Keep heads between y 300 and 1100 px.
- **Camera menu:** slow push-in (`dist` down 20 % over 3-4 s), gentle orbit (`yaw` +-15 deg), wide-to-medium cut on a scene change. No fast spins, no dutch angles.
- **Text stays out** of the top 230 px, bottom 400 px and right 140 px. Captions live in the HTML layer, labels in the SVG layer.

## Pitfalls already hit (don't repeat)

- `Object.assign(mesh, { position })` throws - Three.js positions are read-only. Use `LP.at(mesh, x, y, z)` or `position.set`.
- The laptop screen must face the user (-z of the laptop group); the camera sees the lid back with the logo.
- Arms reaching forward splay outward unless you give the third (inward) value.
- A waving arm on the far side is hidden by the body; wave with the near arm.
- MeshBasic flames get washed out by tone mapping: `toneMapped: false` plus an additive glow sprite.
- Labels anchored above a head can drift into the top 230 px when the camera tilts - check with `guides`.
- WebGL in headless Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` (already in `tools/render.js` and `tools/shots.js`).

## Cost

About 0.3 s per frame with 4 workers on this machine: a 45 s reel (1,350 frames) renders in about 6-7 minutes.
