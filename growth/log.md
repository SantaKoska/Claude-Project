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
