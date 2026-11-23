# One mask, ₹48 crore: visual plan

Voice: `audio/doomsday.mp3` (Adam, Malayalam), 45.0 s raw, 25 phrases aligned; synced to **37.3 s** with a 1.0 s hold before the reveal.

## Owner's direction (23 Nov 2026)
Premium, not overlit; show the real logos and real photos; use GitHub resources for a better look.

## Look
One set: a dark premium cinema hall (`lib/cinema3d.js`). Red velvet seats on stepped risers, acoustic wall panels, warm sconces, aisle step lights, a projector beam with fine dust, and a big screen that is the only strong light: its colour spills onto the seats and follows the picture. The real images play on that screen:
- Logos (Wikimedia Commons, public domain as plain text logos; trademarks of Marvel/Disney, used to report the news): Avengers: Doomsday, Avengers: Endgame, Marvel Studios.
- Photos (Wikimedia Commons, free licences, credited): Robert Downey Jr. at SDCC 2014 by Gage Skidmore (CC BY-SA 2.0); Hall H by Matt Boulton (CC BY-SA 2.0); Doctor Doom cosplay by Super Festivals (CC BY 2.0); Iron Man cosplay by Gage Skidmore (CC BY-SA 2.0).
- The 16:9 screen is composed for a vertical reel: logos and text are sized to the middle column; portrait photos sit at full height on a blurred copy of themselves.
- Overlay VFX in the spirit of the installed `hyperframes-registry` blocks (vfx-anamorphic-flare, light-leak, grain-overlay): an anamorphic flare streak at the unmasking, a warm light leak on the reveal, film grain in the final pass.

## GitHub research
| search | result | decision |
| --- | --- | --- |
| news explainer / kinetic typography video templates | only small Remotion/HTML template repos (0-10 stars) | Skipped; our page engine already does kinetic captions and pills |
| installed `hyperframes-registry` (450 blocks) | vfx-anamorphic-flare, lens-flare, light-leak, grain-overlay, light-sweep-pass | **Used** as the reference for the flare, leak and grain |
| Wikimedia Commons | logos (PD text logos) and CC photos | **Used**, fetched with the new `tools/commons_fetch.py` |

## Shot list
| time | line | shot |
| --- | --- | --- |
| 0.0-3.5 | ഒരു മുഖംമൂടി ഊരി... | Inside the hall, the Doomsday logo glowing on the screen; hook card |
| 3.5-6.7 | ...48 കോടി രൂപയുടെ ടിക്കറ്റുകൾ! | Front-row armrest: a stack of printed tickets grows; the screen reads ₹48 CR |
| 6.7-11.5 | 2019. എൻഡ്‌ഗെയിം... അയൺ മാൻ മരിക്കുന്നു | From the back rows: Endgame logo, then an Iron Man photo |
| 11.5-14.1 | ...പതിനെട്ട് ടിക്കറ്റുകൾ | The screen counts "18 · tickets every second" |
| 14.2-17.9 | 2024 ജൂലൈ. കോമിക്-കോൺ | High wide: Hall H photo, "JULY 2024 · SAN DIEGO COMIC-CON · HALL H" |
| 17.9-20.6 | പച്ച മേലങ്കിയിൽ... ഡോക്ടർ ഡൂം | Doctor Doom photo, the hall dims, slow push |
| 20.7-22.7 | അയാൾ മുഖംമൂടി ഊരി... (hold) | Screen and beam fade to black; an anamorphic flare builds |
| 22.8-26.5 | റോബർട്ട് ഡൗണി ജൂനിയർ... | Flash + light leak: Downey's photo; "IRON MAN → DOCTOR DOOM" |
| 26.7-30.2 | ഡിസംബർ 17... റെക്കോർഡ് | Back to the Doomsday logo; "SPIDER-MAN RECORD: BROKEN" |
| 30.2-33.7 | തിരുവനന്തപുരത്ത്, 12:01 | Close-up of a printed ticket "17 DEC · 12:01 AM · FIRST SHOW" |
| 33.8-37.3 | എല്ലാം തുടങ്ങിയത്... | Wide hall, logo; hook card returns |
