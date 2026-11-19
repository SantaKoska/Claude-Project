# info.inmalayalam reels: house rules

Malayalam-narrated 9:16 reels built in code (SVG + GSAP, time-only render, Playwright frames, ffmpeg). Read these before any script or video work.

## Storytelling: our way (owner's rule)

Every script uses the table-tennis pattern (see `.claude/skills/story-script/SKILL.md`, "OUR WAY"):
small cause -> giant effect stated in the first breath, then how (year, place, person, problem, rising beats), a silence beat, one surprise twist, payoff and a callback to the hook.
Example hook: "ഒരു പയ്യൻ ബസ് മാറിക്കയറി... ആ ഒരു തെറ്റ്, ലോകത്തിലെ രണ്ട് വൻശക്തികളെ വീണ്ടും അടുപ്പിച്ചു!"

## Quality bar (owner, 19 Nov 2026)

The watch anatomy test (`out/watch_anatomy_test.mp4`, `anatomy_lab.html`) is the standard every future reel is judged against. The owner's words: clarity, quality and cinematic camera movement "mean a lot for the viewers" and grow views and subscribers.

- Classy, premium-looking shots first: real 3D with micro-textured materials, bevels, reflections, ambient occlusion, soft depth of field. Never flat or "2D-feeling" objects.
- Whenever a topic has a physical object, show its anatomy so people look deeper: the whole object, then it separating into labelled parts, still working, then snapping back.
- Cinematic camera: slow orbits, push-ins, rises to a 3/4 view, light sweeping across surfaces. Nothing static.
- Check frames for clarity before every render: readable labels, no haze, nothing cut off.
- When a script or voice arrives, run the `visual-research` skill first: search GitHub for skills and repos that fit this topic, choose the 3D approach and the cinematic shot for every line, save `growth/<topic>_visual_plan.md`, then build. Never cartoon-looking: real materials, real light, real proportions, so viewers think "wow".

## Other rules

- No calls to action anywhere (no follow, like, comment or share asks).
- Research first, keep sources, never invent facts, people or dialogue (`growth/<topic>_script.md` holds sources and accuracy notes).
- 35-45 s. Bright first frame, big hook card for 0-3 s (`growth/log.md` has the numbers behind this).
- Visuals: `.claude/skills/reel-visuals/SKILL.md` (kinetic hook, cinematic camera, parallax, India/Kerala map kit, 3D-shaded people with object interaction). The low-poly night 3D style was rejected; don't use it. For machines and "how it works" reels use the installed `teardown` (real 3D) and `anatomy` (isometric exploded) skills; `hyperframes` for ready-made blocks (never run its telemetry).
- Every "how it works" reel needs a real 3D exploded anatomy shot (the object separating into its parts, labelled): `lib/anatomy3d.js` + a model like `lib/watch_anatomy.js` (see reel-visuals section 8). No 2D drawings of the object itself.
- Text stays out of the top 230 px, bottom 400 px and right 140 px. Master about -10 LUFS.
- Read `growth/log.md` before every script and add new insights to it.
- Posting: `growth/posting_strategy.md` (7:30 PM IST weekdays, 5 hashtags max on Instagram, keyword-first YouTube titles, bilingual captions: English hook + Malayalam line + keywords).
