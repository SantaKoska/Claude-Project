# India qualified for the 1950 World Cup and never went: visual plan

Voice: `audio/football.mp3` (Roger, English), 51.9 s raw. Offline Whisper transcript matches the script word for word; 20 phrases. Synced at tempo 1.1 with tight pauses: **43.1 s**, with a held 1.0 s silence before the twist.

## The idea: one desk, Calcutta 1950

The cricket reel's grammar (one physical set, many angles) on a football federation desk: oiled teak, cream wall over a bottle-green wainscot, a green banker's lamp. Every beat is a real object, at real scale:

- **The 1950 entry card** "WORLD CUP · BRAZIL 1950 · QUALIFIED NATION: INDIA": a rubber stamp slams **WITHDRAWN** (hook, callback).
- **A desk globe** with Natural Earth coastlines (world-atlas 2.0.2, now with Brazil, Myanmar, Indonesia, Philippines, France): Brazil lights up as host.
- **Four brass name blocks**: BURMA, INDONESIA, PHILIPPINES topple one after another; INDIA stands and catches the light.
- **A panelled leather football** (12 dark pentagons, 20 tan hexagons, pressed seams). The owner found the period 18-panel ball read as a volleyball; the panelled pattern reads as "football" instantly.
- **Cotton bandage rolls**, one unrolling across the desk (the barefoot 1948 team).
- **A sea-passage ticket** "INDIA → RIO DE JANEIRO": stamped **DECLINED**.
- **A pair of leather football boots**: a real scanned shoe (Khronos glTF sample "Materials Variants Shoe", Shopify, CC BY 4.0) recoloured to dark leather with cream laces and a dark sole, plus studs. They drop onto the desk for "the story everyone tells", slide off for "boots weren't the reason".
- **The 1954 entry form** (Switzerland): stamped **NOT ACCEPTED**.

No faces, no FIFA or Olympic marks. The Manna quote is a text card credited "as reported".

## GitHub research (22 Nov 2026)

| search | result | decision |
| --- | --- | --- |
| football / soccer ball three.js procedural | only modern 32-panel ball demos, mostly unlicensed | Built in code: period 18-panel ball (cube-sphere, displaced seams) |
| boot / shoe 3D model | procedural boots were rejected by the owner ("doesn't look like boots"); Poly Haven blocked; Khronos glTF-Sample-Assets reachable | **Used** MaterialsVariantsShoe (CC BY 4.0, credit in the description), recoloured + studs |
| globe | world-atlas 2.0.2 (ISC, Natural Earth public domain) already in use | Extended `lib/maps/world50.js` |
| installed: `anatomy3d.js` Studio, `cricket3d.js` patterns | ours | Use: studio, AO, DOF, bloom, stamp, cards, globe, callouts |

No exploded anatomy shot: a history story, not a "how it works" reel.

## Shot list (after sync)

| time | line | shot |
| --- | --- | --- |
| 0.0-4.4 | 1950. India qualified... and never went. | Bright macro on the entry card, hook card "QUALIFIED. / NEVER WENT."; stamp WITHDRAWN on "never" |
| 4.4-7.4 | Seventy-six years on... | Rise and pull back over the desk: "76 YEARS ON / STILL NO WORLD CUP" |
| 7.4-8.6 | Brazil was hosting. | Globe turns to Brazil, Brazil lights green, "WORLD CUP 1950 / HOSTED BY BRAZIL" |
| 8.6-10.8 | In Asia, every rival pulled out. | Name blocks along the desk; BURMA, INDONESIA, PHILIPPINES topple on "pulled out" |
| 10.8-13.1 | India was in, without kicking a ball. | INDIA block alone, lit: "QUALIFIED / WITHOUT PLAYING A MATCH" |
| 13.1-14.7 | This team played barefoot. | A bandage unrolls across the desk: "BAREFOOT" |
| 14.7-19.3 | 1948 London Olympics... bandaged feet. | The leather ball beside the bandages, light sweep: "LONDON OLYMPICS 1948 / INDIA v FRANCE", callout "BANDAGED FEET" |
| 19.3-22.9 | FIFA offered... India still said no. | Passage ticket slides in; stamp DECLINED on "no": "INDIA SAID NO" |
| 22.9-27.7 | The story everyone tells... (hold) | Boots drop onto the desk, slow 3/4 drift; held silence |
| 27.7-29.1 | But boots weren't the reason. | Boots slide off the desk: "THE TWIST", "BOOTS WEREN'T THE REASON" |
| 29.1-33.9 | Sailen Manna... "the Olympics was everything." | Macro on the ball's lace; quote card |
| 33.9-38.1 | FIFA didn't forget... 1954 | 1954 entry form, stamp NOT ACCEPTED: "FIFA REFUSED INDIA'S ENTRY" |
| 38.1-43.1 | All because, in 1950... | Back to the WITHDRAWN entry card; hook card returns |
