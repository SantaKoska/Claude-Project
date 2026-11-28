# info.inmalayalam reels: house rules

Malayalam-narrated 9:16 reels built in code (SVG + GSAP, time-only render, Playwright frames, ffmpeg). Read these before any script or video work.

## Storytelling: our way (owner's rule)

Every script uses the table-tennis pattern (see `.claude/skills/story-script/SKILL.md`, "OUR WAY"):
small cause -> giant effect stated in the first breath, then how (year, place, person, problem, rising beats), a silence beat, one surprise twist, payoff and a callback to the hook.
Example hook: "ഒരു പയ്യൻ ബസ് മാറിക്കയറി... ആ ഒരു തെറ്റ്, ലോകത്തിലെ രണ്ട് വൻശക്തികളെ വീണ്ടും അടുപ്പിച്ചു!"

Exception: the **Kerala Yatra** travel series uses a calm narrator/navigator style instead (how we get there, what we see, why it matters, one tip), not the hook-twist pattern. Rules in the `kerala-yatra` skill (`.claude/skills/kerala-yatra/SKILL.md`): real satellite maps (NASA Blue Marble, Sentinel-2), India's official boundary (datameet, Survey of India), all 14 districts outlined, a traveller marker on a blue navigation line, photo pop-ups at each stop.

Second exception: the **split series** ("ഒരു രൂപയുടെ കണക്ക്", from 25 Nov 2026) splits the price of an everyday thing (a ₹15 tea, a ticket, a litre of petrol) into its real costs: a real 3D object separates into labelled cost layers while a coin stack shrinks to the seller's profit. Hook = the price everyone knows, twist = the surprising part, payoff = what the seller keeps and the break-even volume. One example business, our own calculation from sourced prices, "EXAMPLE · APPROX." on screen, no advice or income promises; scripts in `growth/split_NN_<topic>_script.md`. **Look (owner, 26 Nov 2026):** the clean business-breakdown pattern he shared, in our own art: white tile wall, lime highlight-bar titles, navy info cards and "+ item ₹price" pills, navy caption box (Baloo Chettan 2) with lime karaoke words, one credited real photo in a white frame, slide transitions. Polished flat vector illustration is allowed for this series. See `growth/split_01_chaya_visual_plan.md`.

**Daily plan (owner, 25 Nov 2026):** three series. Every day one Kerala Yatra (1 PM) plus one more reel (7:30 PM): a news explainer when the news is trending hard, otherwise a split episode. Details in `growth/posting_strategy.md`.

## Every video (owner, 28 Nov 2026)

Run the growth checklist in `growth/growth_playbook.md` for every video: topic gate, 3 hooks scored with the `virality` skill (hookscore) and judged against our own winners (Doomsday ~36k, gold ~32k, tea 6k likes in a day), `yt-package` title + cover lint, ig-caption rules with exactly 5 hashtags by job, the best voice and a series-fitting sound mix ("audio skills"), and a 24 h / 7 d stats entry plus `yt-retention` after posting.

## Workflow (owner, 28 Nov 2026)

Script first; once the owner says "approve", do everything in one go: generate the narration with **OmniVoice** (male, low pitch; setup in the session scratchpad, model k2-fsa/OmniVoice, Malayalam `language='ml'`, one paragraph at a time with natural pauses), sync it, build, check frames and shake (stride check), render, verify and deliver. The owner no longer records ElevenLabs voices (from Mary Celeste Part 3 onwards).

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
