# The war that should have lifted gold: visual plan

Voice: `audio/gold.mp3` (Roger, Malayalam), 57.2 s raw. Speech splits into exactly 29 phrases, the same as the script's 29, so the recording matches the script line by line. Synced at tempo 1.17 with tighter pauses: **45.9 s**, with a 0.9 s held silence before the twist.

## The idea: one set, one scale

The whole story is a **balance**. One premium jeweller's counter, shot from many angles like the Roadster hangar:

- **A traditional brass jeweller's scale (thraasu)** in the middle. Gold sits on the left pan. Each cause in the story drops onto the right pan: an oil barrel, price tags, savings coins, then bundles of dollars. The scale tips step by step until the gold pan hangs high in the air. Viewers *see* gold losing weight in the market.
- **A split-flap rate board** on the wall behind: "ഇന്നത്തെ സ്വർണ്ണവില, 22K, 1 പവൻ". It flips digit by digit, ₹1,00,920 → ₹92,080 (Kerala share reason).
- **Two towers of gold bars** as a 3D chart: JAN 2026 ($5,589/oz) vs NOW. The top third of the NOW tower slides off and falls to the marble (−36%).
- **A Kerala steel almirah** with its locker: the bangle inside, "0%".
- **An AI chip** in front of a glowing share-price line that crashes; the chip cracks.
- **The hero:** a 22K gold bangle with diamond-cut engraving and a stack of pavan coins on a green velvet jeweller's tray.

Materials: real metals from an environment map (gold with fine scratches and a slightly red 22K tone, 999.9 bars with stamped faces, brass, silver, painted steel), polished cream marble with veins, dark walnut wall, velvet with sheen. Warm key light, rims, a glint that sweeps across the gold, AO, shallow depth of field, gentle bloom on hot highlights, grain at the end. Bright, warm first frame.

## GitHub research (21 Nov 2026)

| search | best result | decision |
| --- | --- | --- |
| gold bar three.js | nothing usable (0★ demos, no licence) | Built in code: tapered bevelled bar + stamped face via bump map |
| balance scale three.js | no results | Built in code: lathe brass parts, beam tilt drives hanging pans |
| split flap display three.js | abgebaumt/splitflap-board (1★, MIT, Blender generator) | Reference only (needs Blender/GLB); our flap board is planes with a glyph atlas |
| coin 3d procedural three.js | NullAITech/badge3d-coin-generator (0★, MIT, WebGPU) | Skipped (WebGPU; our renderer is WebGL); coins are lathe profiles with a raised rim |
| installed: `anatomy3d.js` Studio, `teardown`, `reel-visuals` | MIT | **Use**: studio, AO, DOF, bloom, callouts, the one-set camera grammar from the Roadster reel |

## Shot list (times after sync)

| time | line | shot |
| --- | --- | --- |
| 0.0-1.8 | ലോകത്ത് ഒരു യുദ്ധം നടക്കുന്നു... | Bright macro on the bangle and coins on velvet, glint sweep, slow push. Hook card from frame 0 |
| 1.8-4.1 | സാധാരണ, സ്വർണ്ണവില കുതിക്കേണ്ട സമയം | Rise to a low angle: the gold tower builds bar by bar, up arrow ("WAR = GOLD ↑") |
| 4.1-8.6 | പക്ഷേ കേരളത്തിൽ... കുറഞ്ഞു! | Push in on the rate board; digits flip down to ₹92,080, red "−₹8,840 IN A WEEK" |
| 8.6-12.7 | ജനുവരിയിൽ റെക്കോർഡ്... മൂന്നിലൊന്ന് താഴെ | Dolly along the two towers (JAN 2026 $5,589 / NOW); the top third of NOW slides off and falls |
| 12.7-13.9 | എന്താണ് സംഭവിച്ചത്? | Pull back to reveal the whole set: the scale balanced, gold on the left pan, the right pan empty |
| 13.9-16.2 | യുദ്ധം വന്നപ്പോൾ, എണ്ണവില കത്തിക്കയറി | Low angle: an oil barrel drops onto the right pan, the scale tips ("OIL $112") |
| 16.2-19.6 | എല്ലാത്തിനും വില കൂടും... വിലക്കയറ്റം | Price tags drop in and swing; the scale tips more ("US INFLATION ↑") |
| 19.6-22.9 | പലിശ കൂട്ടുമെന്ന് | A brass gauge "US INTEREST RATE", needle climbs ("DEC 9 · HIKE ~96% LIKELY") |
| 22.9-27.3 | ബാങ്കിൽ 4-5%... അലമാരയിൽ... ഒന്നും കിട്ടില്ല | Silver coins stack up on the right pan ("SAVINGS 4-5%"); then the steel almirah locker opens on the bangle ("GOLD 0%") |
| 27.3-31.5 | ഡോളറിലേക്ക് ഓടി + silence | Dollar bundles slam onto the pan, the scale tips fully, the gold pan rises; slow orbit in the silence |
| 30.6-34.1 | ട്വിസ്റ്റ്. AI ഓഹരികൾ തകർന്നു | AI chip glowing in front of a rising line that crashes; the chip cracks in two |
| 34.1-38.3 | കടം... അവർ വിറ്റത്... സ്വർണ്ണം | "MARGIN CALL" stamp; on "സ്വർണ്ണം" the gold bars lift off the left pan |
| 38.3-41.8 | മോശമായതുകൊണ്ടല്ല... വേഗം വിൽക്കാൻ | Macro: a gold bar flips and lands as a bundle of cash ("FASTEST TO SELL") |
| 41.8-45.9 | സ്വർണ്ണത്തെ കയറ്റേണ്ട യുദ്ധം... താഴെയിട്ടു | Back to the bangle; the board behind reads ₹92,080; the hook line returns |

No war imagery (no flags, weapons or leaders): the war is only the cause in the voice, which keeps the reel neutral. Dollar notes are plain green bundles with a "$" band, not a copy of real banknote art.
