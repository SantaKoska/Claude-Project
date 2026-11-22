# Performance log

Numbers from the owner's Instagram and YouTube insights. Add a row after every post; read this before writing the next script.

| video | date | platform | views | skip rate | share | like | save | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Table tennis (ping-pong diplomacy) | Nov 2026 | Instagram | 1.6k in first hour | ? | ? | ? | ? | Best so far. Bright, saturated frame; a person mid-action from frame 1 ("ഒരു പയ്യൻ ബസ് മാറിക്കയറി"); 46.7 s |
| GTA started as a police game | 18 Nov 2026 | IG 146 + FB 1,141 = 1,287 | 1,287 | **61.0% (higher)** | 0.0% (lower) | 4.1% (lower) | **0.8% (higher)** | Opened on the topic name ("GTA ആദ്യം ഒരു പോലീസ് ഗെയിം... നിങ്ങൾക്കറിയാമോ?"), dark night grade, small caption, 56 s |
| GTA started as a police game | 18 Nov 2026 | YouTube Shorts | 879 | | | 10 likes | | Title paste didn't show in owner view; check Edit |

## What the GTA numbers say

- **Skip rate 61% is the problem.** Most people swiped in the first 2-3 seconds, before the story started. Reach is ranked on this first.
- **Save rate is above typical.** People who stayed found it worth keeping, so the content is fine; the opening loses them.
- **Shares 0.** Nothing in it that a Malayali would send to a friend: no Kerala/Mallu angle, no "you won't believe this" moment for the group chat.
- **Facebook gave 8x the Instagram views.** Cross-posting to Facebook is worth keeping on.

## Rules taken from it (applied in `story-script` and the build)

1. Never open on the topic name or a "did you know" question. Open on a person or a moment.
2. First frame: bright, high contrast, something moving, and a big hook line on screen from frame 0 to about 3 s. No fade from black, no dark empty frame, no caption gaps in the first 3 s.
3. Keep it 35-45 s. 56 s is too long for a cold audience.
4. Give every script one share reason: a Kerala/India link, or a moment people want to show a friend. (Still no CTA lines.)

## Tools learned (20 Nov 2026)

- **Speech-to-text works offline here**: Whisper base.en as ONNX via `sherpa-onnx` (pip) with the model from the k2-fsa/sherpa-onnx GitHub releases (Hugging Face is blocked). Use it to confirm a voice MP3 matches the script before syncing.
- `tools/sync.py` now takes `"say"` (how numbers are spoken, so "603 km/h." is weighed like "six hundred and three kilometres an hour") and per-sentence `"holdAfter"` (a deliberate silence beat before the twist).
- The English maglev voice ran 68.7 s raw; tempo 1.1 + tightened pauses brought it to 59 s. For 35-45 s, English scripts need ~95 words at Roger's laid-back pace, not 125.

## Render lesson: shaking shot from overlapping camera moves (maglev, 20 Nov 2026)
- Symptom: in the maglev coils front shot every third frame jumped sideways (looked like shaking).
- Cause: a camera move (`m3`) ran past the next camera set (`c3`) inside the same scene. The render splits frames across 3 workers that each skip ahead 3 frames, so one worker landed on the old move's value.
- Fix: `c3` now shortens any earlier camera move so it ends before the set (`tl.recent()` gives the tween; `tl.to` returns the timeline, not the tween).
- Check before every full render: seek the page in the 3-worker pattern and compare the state against sequential seeking (scratchpad `stride_all.js`); any mismatch means a frame will jitter.

## Build lessons: Roadster thrusters reel (20 Nov 2026)
- Owner's direction: not many different shots; one set, one event, seen from several angles. Built as one hangar (car pad, loop ramp, five clay vehicles, hero tank) and every scene is a camera move inside it.
- Lofted bodies: check the triangle winding (a flipped index order shows the inside of the shell and looks like a hollow trough). Canvas textures are flipped (canvas y = (1 - v) * h).
- Cut-away wheel arches: discard fragments in object space inside each arch circle, then close the hole with a dark half-cylinder liner.
- A camera roll must be reset on every cut (c3 now defaults roll to 0), or it tilts every later shot.
- Macro shots need a near plane close to the camera (near = distance × 0.06).
- Cold-gas jets on a pale set: white mist disappears; a cyan-tinted plume that darkens along its length reads clearly. Keep the cone narrow (about 0.2 m at 1.6 m) or a close camera ends up inside it.
- Anything parented to a hidden group disappears with it (the jets lived in the car's insides group).
- In a 9:16 frame the horizontal field of view is only about 56 % of the vertical one: aim the target at the object itself, not beside it.

## Build lessons: gold price reel (21 Nov 2026)
- Economics topics still get one physical set: a jeweller's counter where a brass scale carries the story (each cause drops onto the right pan, the gold pan rises). A metaphor the viewer can watch beats a slideshow of charts.
- Malayalam voice check without ASR: if the coarse speech islands (−40 dB, 0.25 s gaps) count exactly the script's phrases, the take matches line by line. 57.2 s raw -> 45.9 s at tempo 1.17 with tight gaps.
- In 9:16 a wide object (a scale beam) only fits from a 3/4 angle (about 45-55° off its axis); straight-on the pans fall outside the frame.
- Polished floors and clearcoat walls catch the key light as a white hot spot that blooms; roughness .34 on marble and a matte walnut wall fixed it.
- Caption pages overlapped for a few frames: fade the old page out before the next phrase's first word (next start − 0.22 s).
- A sound effect name must be in SFX_GAIN in tools/audio.py, or the mix fails after hours of rendering (the Roadster build lost its mix step this way).

## Build lessons: 1983 cricket reel (22 Nov 2026)
- History stories also work as one physical set: a 1983 board president's desk where every beat is an object (pass + rubber stamp, wall scoreboard, ball arcing into the cup, desk globe, cash box, microphone, envelopes, coin-stack chart). No faces of real people needed.
- A desk globe with real coastlines: world-atlas 2.0.2 (Natural Earth, public domain) converted once to `lib/maps/world50.js`; highlight countries with a second transparent sphere (an emissive map on the base sphere washed out under tone mapping).
- InstancedMesh whose count starts at 0 gets an empty bounding sphere and is culled forever: set `frustumCulled = false` for growing stacks.
- Cream walls + paper under a strong key light blow out: key 13 (not 22), bloom .035, darker paper (#E6D8BC), exposure .92-.95.
- Overlapping flat objects (envelopes) only read when the top one is fully visible: cascade them, don't fan them.
- In 9:16 a row of objects (coin stacks, scoreboard) needs a high 3/4 view along the row, or only one fits across.

## Build lessons: 1950 football reel (22 Nov 2026)
- English voice (Roger): 104 words ran 51.9 s raw; tempo 1.1 + tight gaps gave 43.1 s. Offline Whisper (sherpa-onnx) confirmed the take word for word before syncing.
- The barefoot myth works as the twist: set up "the story everyone tells" with an object (the boots), hold the silence, then remove the object.
- A period football reads as real when built as a cube-sphere (BoxGeometry spherified) with three strips per face and the radius pushed in along strip seams; alternate the strip direction per face.
- Owner feedback: procedural boots and the period 18-panel ball "don't look like boots or football". Viewers recognise an object by its familiar silhouette, not period accuracy: the panelled ball and a real scanned shoe with studs fixed it. For any everyday object with a complex shape (shoes, hands, food), use a licensed scan (Khronos glTF-Sample-Assets, CC0/CC BY) before building it in code, and show the owner a still before the 2-hour render.
- GLB on a file:// page: fetch() is refused; load the bytes with XMLHttpRequest and GLTFLoader.parseAsync. The vendored three needed GLTFLoader.js + SkeletonUtils.js from three@0.186.0.
- A row of name blocks in 9:16: shoot along the row from its front-left end (about 40° off its axis), not straight on.
- Metallic brass plates with an emissive glow bloom into an unreadable blob; use a less metallic plate (metalness .35) and a small glow.
