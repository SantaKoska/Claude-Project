# How a maglev train works: visual plan

Voice: `audio/maglev.mp3` (68.7 s raw, matches `growth/maglev_script.md` word for word; checked with a Whisper base.en ONNX model via sherpa-onnx, downloaded from GitHub releases). Pauses tightened and tempo 1.1 to bring it toward 55 s; a held 0.9 s silence before the twist.

Look: a premium cool-grey studio (pale, reads in a feed), real 3D with physically based materials: clearcoat white car paint, tinted glass, brushed stainless cryostats, copper windings, resin coil panels, board-formed concrete. One accent per shot: magnetic blue/red for poles, cyan for field lines.

## GitHub research (20 Nov 2026)

| source | licence | decision |
| --- | --- | --- |
| `teardown` skill (installed) | MIT | **Use its rules and two techniques**: the fresnel "ghost" shell (x-ray the car body so the magnets inside show) and "the part doing the work opens up"; taste numbers (labels ≥ 34 px, machine fills 60-70 % of frame, entrance/exit easings) |
| `anatomy` skill (installed) | MIT | **Use its idea** of a calm exploded stack with precise labelled parts; our real-3D version is `lib/anatomy3d.js` (studio, AO, DOF, bloom, `Exploded`) |
| `hyperframes-registry` (installed) | see THIRD_PARTY | Checked for speed-line and kinetic-number blocks; built ours in the same time-only style so it renders with the 3D canvas |
| FanXuTheRealOne/shanghai-maglev-diorama-eazo | none | Skipped: no licence, 0 stars |
| JuanCan00/laboratorio-levitacion-magnetica | none | Skipped: no licence |
| BinaryNectar/magnetic-dipole-simulation | none | Reference only for the idea; our field lines are integrated from two dipoles in code |
| k2-fsa/sherpa-onnx + Whisper base.en ONNX (GitHub releases) | Apache-2.0 / MIT | **Use**: speech-to-text works here (Hugging Face is blocked); confirms the voice matches the script |

## Look per subject

| subject | approach |
| --- | --- |
| Two magnets (hook, callback) | Two nickel-plated neodymium blocks, engraved N/N faces; repelling field lines as glowing tubes integrated from two dipoles; a flowing pulse along each line |
| The train | Our own long-nose design (not a copy of any livery): lofted superellipse body, clearcoat white with a deep blue band, dark glass window band and cockpit |
| Guideway | U-shaped concrete with side walls; figure-eight levitation/guidance coils and propulsion coils as resin panels with copper windings |
| Bogie anatomy | Steel frame, two superconducting magnet units (stainless cryostat, 4 NbTi racetrack coils, radiation shield, liquid-helium tank, cryocooler), rubber support wheels on folding struts, side guide wheels; explodes and snaps back, labelled |
| -269 °C | Frost on the cryostat, cold blue rim light, counter |
| Levitation + guidance | Cross-section along the guideway: coils glow as the magnet passes, force arrows up and to the centre, a 10 cm gap dimension |
| Propulsion | Travelling wave: wall coils flip red/blue (N/S), the train's magnets pulled from the front and pushed from behind |
| Twist (wheels) | Macro on the folding support wheel: it drops, rolls, then tucks up as the train rises |
| 603 km/h | Track-level tracking shot along an elevated guideway, speed streaks, ground rushing, big counter |
| 1934 patent | A paper sheet in the studio with our own simple schematic of a wheel-less train (not the patent drawing), typed caption, stamp |

## Shot list

| line | shot |
| --- | --- |
| Two magnets... pushing each other away. | Bright studio, macro on two magnets; they slide toward each other and stop; field lines bloom and bend apart (push-in) |
| ...lift a train into the air, fastest train on Earth. | Match cut: field-line glow becomes the guideway; the train rises off its wheels, slow hero orbit with a light sweep |
| How? Let's take one apart. | Rise to 3/4 as the car body lifts away (x-ray ghost) and the bogie separates into labelled parts |
| 1934. Hermann Kemper patents a train with no wheels. | Push-in on the paper sheet, typewriter date, stamp "PATENT 1934" |
| Decades later, Japan builds its own. | Hero orbit of the assembled train on the guideway, "JAPAN" lower third |
| Under every car, superconducting magnets, -269 degrees. | Car body turns to ghost; push in to the magnet unit; cryostat opens to show the coils; frost; counter to -269 °C |
| In the walls of the track, figure-eight coils... 10 cm... centre. | Cross-section front view: figure-eight coils glow, force arrows, gap dimension 10 cm, then side arrows to centre |
| No engine on board. The track is the motor. Coils flip N/S... | Low tracking shot: the wave of red/blue coils runs along the wall; pull/push arrows at the front and back magnets |
| ... | Hold: the train hovering, still, music drop |
| But here's the surprise. This train has wheels... like a plane. | Macro on the wheel unfolding; the train rolls, then lifts and the wheels tuck up |
| April 21st 2015. Yamanashi, Japan. 603 km/h. | Track-level speed run, streaks, counter 0 -> 603 KM/H |
| All from two magnets... that refuse to touch. | Back to the studio: the two magnets and the gap between them |
