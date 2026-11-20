# A tank of air (2026 Tesla Roadster thrusters): visual plan

Voice: `audio/roadster.mp3`, 45.9 s raw, matches `growth/roadster_script.md` word for word (checked with Whisper base.en via sherpa-onnx). Pauses tightened toward ~42 s, with a held silence before "The surprise?".

**The owner's direction for this one:** not many different shots. **One set, one car, one continuous story, seen from different angles.** The camera moves around the same moment (the flip, the hang on the ramp, the car on the pad) like a film crew covering one stunt with several cameras, so the reel feels like one cinematic event instead of a slideshow.

## The set (stays for the whole reel)

A bright, premium test hangar: pale concrete floor with a soft falloff, a big curved loop-ramp rising off the pad into an upside-down section, five clay-grey vehicle models parked in a row beside it, and one car: our own low two-seat sports coupe in deep red clearcoat with dark glass.

- Materials: clearcoat red paint, tinted glass, carbon weave (from the MIT `airsup-lab` carbon texture idea), anodised aluminium, brushed steel valves, copper solenoid windings, matte clay for the five vehicles (studio-model look, so none of them copy a real design).
- Air is the accent: cold-gas jets as white mist cones with a flowing texture and frost on the nozzles; suction airflow as thin cyan streamlines.
- Light: one soft key, two rims, a glint light that sweeps across the paint; AO, depth of field, a touch of bloom; grain and a gentle grade at the end.

## GitHub research (20 Nov 2026)

| source | licence | decision |
| --- | --- | --- |
| `teardown` skill (installed) | MIT | **Use**: fresnel ghost body, "the part doing the work opens up", labels ≥ 34 px |
| `anatomy` skill (installed) + `lib/anatomy3d.js` | MIT | **Use**: studio, AO, DOF, bloom, `Exploded` |
| Moh4696/open-3d-skills, `exploded-view` skill (438★) | MIT | **Use its rules**: explode in the order a mechanic would (shells first, then inner parts), one main axis, big shells move up so the core stays visible, camera distance follows the explode amount, say which internal details are illustrative |
| AirsupHQ/airsup-lab (62★, Cybertruck/F1 machines built in code) | MIT | **Adapt two ideas**: superellipse loft with undercut width (`wb`) for a smooth car body, 2x2 twill carbon texture. Skipped its plume ray-marcher (tied to its own render pipeline); our jets are lighter mist cones |
| ancient2k/roadster-flight-test (1★) | MIT | Reference only (an unofficial sim); nothing taken |
| Phoenix0415/ev-anatomy | none | Skipped: no licence |
| k2-fsa/sherpa-onnx + Whisper base.en | Apache-2.0 / MIT | **Use**: confirms the voice matches the script |

## Anatomy (all illustrative where Tesla has not published details; the page says so in the description)

| part | how it is shown |
| --- | --- |
| Whole car | Ghost body lifts away; chassis tub, two seats, battery floor, 2 carbon tanks behind the seats, air lines to 10 thrusters, suction fans in the floor |
| Suction fans | Two ducted fans under the floor: rotor blades spinning, cyan streamlines pulled up through the floor, force arrows toward the ramp surface |
| Air tank (COPV) | Separates along its axis: inner liner, carbon hoop layer, helical carbon layer, end boss, valve; pressure gauge needle climbs |
| Thruster | Separates along its axis: solenoid coil (copper), spring, poppet, valve seat, nozzle; the poppet lifts and a white jet blasts out |
| 10 thrusters | Top view: ten nozzles light up and count 1-10 around the body |

## Shot list: one set, many angles

| line | shot |
| --- | --- |
| A tank of air... | Bright macro on one carbon tank standing on the pad (hook card A TANK OF AIR), slow push-in, glint sweep |
| ...flipped a car over five others. | Same set, wide: the car mid-kickflip over the five vehicles, slow motion, camera orbits under the arc (5 CARS CLEARED) |
| October 2026, Texas. Climbs a ramp... upside down. | Side angle: the car drives up the loop ramp; camera rises and rolls to look up at it hanging upside down (tags OCTOBER 2026 / TEXAS) |
| How? Let's take it apart. | Same car, now on the pad: body turns to ghost and lifts, parts separate (rise to 3/4), labels |
| Under the floor, fans suck it to the track. | Back to the hang on the ramp, low angle from below the ramp: floor x-ray, fans spin, streamlines, arrows (HOLDS IT UPSIDE DOWN) |
| Behind the seats, carbon-fibre tanks of squeezed air. | Push-in through the ghost body to the tanks; one tank separates into its layers, gauge (600 L, HUNDREDS × AIR PRESSURE) |
| Around the body, ten thrusters... valve snaps open... other way. Fire one corner... it spins. | Top-down crane: ten thrusters light up 1-10; macro: one thruster separates, poppet lifts, jet, push arrow; crane back up: one corner fires and the car spins on the pad |
| (silence) | Hold: the car frozen mid-flip, music drop |
| The surprise? Nothing burns. No fuel. No flame. Just air. | Macro on the nozzle: white cold jet, frost on the metal (NO FUEL · NO FLAME) |
| It cleared a Cybercab... Model 3. With no one inside. | The same kickflip from the hook, now from beside the row: each vehicle gets its name as the car passes over; then inside: the empty seat as the world turns |
| All from a tank of air. | Back to the tank macro, the car lands softly in the background |
