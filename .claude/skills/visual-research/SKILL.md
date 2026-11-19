---
name: visual-research
description: Before building any info.inmalayalam reel, research how to make its visuals look premium and real - which GitHub skills or repos fit this topic, which 3D approach, which cinematic shots - and write a visual plan the owner can see. Use every time the owner sends a voice MP3 or a finished script, before writing the page, and whenever they ask for better, more cinematic, less cartoon-like visuals.
---

# visual-research

The owner's rule (19 Nov 2026): when a script or voice arrives, first research which skills from GitHub, which 3D approach and which cinematic shots will make this video look "damn good", so viewers think "wow, that's interesting". **Not cartoon.** Real-looking, classy, clear.

## Step 1: what does this topic need to show?

List every visual subject in the script: objects (a watch, an engine, a train), places (Munnar hills, a Kerala map), events (a flood, a landslide), people, numbers. For each, decide: **real 3D object**, **3D environment**, **map**, **data card**, or **people**.

## Step 2: search GitHub for this topic (every time)

- `gh api -X GET search/repositories -f q='<topic> three.js' -f sort=stars` and similar: "<object> 3d model procedural", "<effect> shader three.js" (water, rain, fire, smoke, terrain, landslide), "claude skill <topic>", "exploded view", "cinematic camera three.js".
- Check what's already installed first: `teardown` (real 3D machines), `anatomy` (isometric exploded), `hyperframes-registry` (450 blocks: transitions, titles, camera moves), `bang-motion`, `reel-visuals`, `lib/anatomy3d.js`.
- Only take repos with a clear licence (MIT, Apache-2.0, CC0) and a real star count; read the SKILL.md or README before installing; never run telemetry; never pull assets of unclear origin.
- Write down what you found and why you used or skipped each one.

## Step 3: pick the look (never cartoon)

| subject | approach |
| --- | --- |
| Machine or object | `lib/anatomy3d.js` studio: real materials with micro texture, bevels, reflections, AO, DOF, then the exploded anatomy shot (reel-visuals section 8) |
| Landscape, weather, disaster | three.js terrain from height data or noise, fog and volumetric light, particle rain, water with reflections, landslide as moving terrain; a slow aerial drone-style camera |
| Map | real data (`lib/maps`, datameet), extruded 3D slab, lit like a physical model, tilt-shift DOF |
| History moment with people | 3D-shaded people (`lib/people.js` v3) inside a lit, layered set with depth of field and rim light, never flat on a plain background |
| Numbers | big kinetic type over the 3D scene, not a separate flat slide when it can be avoided |

Rules that keep it from looking like a cartoon: physically based materials (metalness/roughness), soft shadows and ambient occlusion, a lit backdrop with falloff, realistic proportions, restrained colour (one accent), film grain and a gentle grade at the end, no thick outlines, no bouncy toy motion on serious topics.

## Step 4: the shot list (cinematic grammar)

For each line of the script, choose one shot from this library and say why:

- **Hero orbit**: slow 10-15 deg/s orbit around the object, light sweeping across it (openings, callbacks)
- **Push-in**: camera moves toward the detail that matters while the background blurs (reveals)
- **Rise to 3/4**: camera climbs as the object separates, so the whole exploded stack reads (anatomy)
- **Macro**: very close with shallow focus on one working part (balance wheel, crystal) and a slow-motion ramp
- **Drone pass**: high, slow aerial move over a landscape with fog layers (places, disasters)
- **Match cut**: one shape becomes another across a cut (crystal -> map pin)
- **Whip / iris / flash**: fast transitions on beats, at most one every 5-7 s
- **Hold**: 1 s of stillness before the twist (the silence beat)

## Step 5: write the plan, then build

Save `growth/<topic>_visual_plan.md`: GitHub findings (used / skipped and why), the look per subject, the shot list per script line, and which existing libraries are reused or extended. Tell the owner the plan in a few lines, then build. Screenshot every shot before the full render and check clarity (labels readable, no haze, nothing cut off) against the watch anatomy benchmark (`out/watch_anatomy_test.mp4`).
