# The passes that moved cricket to India: visual plan

Voice: `audio/cricket.mp3` (Adam, Malayalam), 63.6 s raw. Speech splits into 32 phrases that line up one-for-one with the script. Synced at tempo 1.26 with tight pauses: **46.2 s**, with a held 1.0 s silence before the twist.

## The idea: one desk, 1983 to today

The whole story sits on **one cricket board president's desk in a cream, wood-panelled pavilion room**, shot from many angles (the camera grammar of the gold and Roadster reels). Every beat is a real object on that desk:

- **The pass:** a printed card "WORLD CUP FINAL · LORD'S · 25 JUNE 1983 · COMPLIMENTARY PASS". A wooden rubber stamp comes down and leaves a red **REFUSED** mark (hook, Salve's "no", callback).
- **The manual scoreboard** on the wall: black board, white painted tiles drop onto hooks: INDIA 183 / WEST INDIES 140.
- **A red leather cricket ball** with a raised stitched seam: the catch is the ball arcing in slow motion and freezing at its peak.
- **A bookmaker's slate** "INDIA 66-1" for "nobody rated India".
- **A golden cup** on a walnut plinth for "world champions" (a generic cup, not a copy of the Prudential trophy).
- **A brass nameplate** "N.K.P. SALVE · PRESIDENT, BCCI".
- **A desk globe** (real Natural Earth coastlines): India and Pakistan light up together; a gold arc carries the Cup from England to India (1987).
- **A steel cash box** that opens empty (the twist).
- **A vintage chrome microphone** under a spotlight (Lata Mangeshkar's concert, no likeness), then 14 envelopes "₹1,00,000" fan out.
- **Stacks of gold coins** as a 3D chart: INDIA 38.5% towering over ENGLAND 6.89%, AUSTRALIA 6.25%, PAKISTAN 5.75%.

No faces of real people anywhere (Kapil Dev, Salve, Lata Mangeshkar, players): objects carry the story.

Materials: walnut desk with a green leather blotter, cream painted panelling, brass, chrome, red leather with stitched seam, card stock with print texture, painted steel, gold. Warm key light plus a green-shaded banker's lamp, glint sweeps, AO, shallow depth of field, bloom on highlights, grain at the end. Bright, warm first frame with the hook card.

## GitHub research (22 Nov 2026)

| search | best result | decision |
| --- | --- | --- |
| cricket ball three.js | aryyann/cricket-review-simulator (0★, MIT) | Skipped: ball tracking demo, no model worth reusing; ball built in code (sphere, seam as stitched rings, bump) |
| cricket stadium threejs | aakash-aimonk/ThreeJs-Cricket-Stadium (0★, no licence) | Skipped (no licence); the story stays on one desk anyway |
| trophy 3d procedural three.js | none | Built in code: lathe cup + handles |
| globe three.js earth texture | MohanChoukse/ThreeJs-Earth (3★, no licence) | Skipped; globe texture drawn from **world-atlas 2.0.2** (ISC, Natural Earth public-domain data), saved as `lib/maps/world50.js` |
| installed: `anatomy3d.js` Studio, gold3d.js patterns | MIT / ours | **Use**: studio, AO, DOF, bloom, callouts, `c3`/`m3` camera helpers |

No anatomy (exploded) shot: this is a history story, not a "how it works" machine reel.

## Shot list (times after sync)

| time | line | shot |
| --- | --- | --- |
| 0.0-3.8 | 1983. ലണ്ടനിൽ... പാസുകൾ നിഷേധിച്ചു... | Bright macro, slow push over the pass; the rubber stamp slams "REFUSED" on നിഷേധിച്ചു. Hook card from frame 0 |
| 3.8-6.6 | ആ ഒരു "നോ"... ഇന്ത്യയിലെത്തിച്ചു! | Rise and pull back from the stamped pass to the desk; the globe turns to India in the background, "1983 → TODAY" |
| 6.6-9.1 | ജൂൺ 25, ലോർഡ്സ്. ലോകകപ്പ് ഫൈനൽ. | Push in on the wall scoreboard as tiles drop: date tag "25 JUNE 1983 · LORD'S" |
| 9.1-12.5 | ആരും വില കൽപ്പിക്കാത്ത... ക്യാച്ച്... ചാമ്പ്യന്മാർ! | Slate "66-1"; the ball arcs in slow motion and freezes ("KAPIL DEV'S CATCH"); the cup rises into a glint, INDIA 183 / WI 140 |
| 12.5-17.1 | ഫൈനലിന് മുമ്പ്... സാൽവെ... ചോദിച്ചു. മറുപടി... ഇല്ല. | Nameplate macro, then the pass slides across the desk; the stamp comes down on ഇല്ല: "NO" |
| 17.1-19.6 | ആ അപമാനം... പാകിസ്ഥാനുമായി കൈകോർത്തു. | Globe, low 3/4: India and Pakistan light up together |
| 19.6-22.8 | നാല് വർഷം കഴിഞ്ഞ്... ഇന്ത്യയിലേക്ക്. | Globe turns; a gold arc runs England → India; "1987: FIRST WORLD CUP OUTSIDE ENGLAND" |
| 22.8-23.8 | (silence) | Hold, slow orbit, music drop |
| 23.8-27.8 | പക്ഷേ ഒരു ട്വിസ്റ്റ്... പണമില്ലായിരുന്നു. | Cash box lid opens: empty. "THE TWIST", "BCCI: NO MONEY FOR PRIZES" |
| 27.8-32.0 | ലതാ മങ്കേഷ്കർ... ഒരു ലക്ഷം രൂപ. | Spotlit vintage microphone; envelopes "₹1,00,000" fan out, "FREE CONCERT · DELHI 1983" |
| 32.0-37.4 | ഇന്ന്? ഐസിസി... പത്ത് ശതമാനം പോലുമില്ല. | Coin stacks grow: INDIA 38.5% towers over ENG 6.89, AUS 6.25, PAK 5.75; "ICC REVENUE SHARE 2024-27" |
| 37.4-46.2 | എല്ലാം തുടങ്ങിയത്... പാസുകളിൽ നിന്ന്. | Back to the stamped pass on the desk, the coin tower behind it; hook card returns |
