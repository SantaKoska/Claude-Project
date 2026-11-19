# How watches work: the crystal that broke Switzerland (Video 11)

**Our way:** small cause -> giant effect in the first breath (a tiny crystal cost 60,000+ Swiss jobs), then how (open the watch: mechanical, automatic, quartz), a silence, the twist (an ordinary quartz watch keeps better time than a Rolex), payoff and callback.
**Emotion:** wonder (what's inside), then surprise. **Share reason:** everyone owns a watch; the Rolex twist is made to be sent to a friend.
**Hook card (0-3 s):** ഒരു കുഞ്ഞു ക്രിസ്റ്റൽ. 60,000 ജോലി.

## ElevenLabs paste block

```
ഒരു കുഞ്ഞു ക്രിസ്റ്റൽ...

സ്വിറ്റ്സർലൻഡിലെ അറുപതിനായിരത്തിലേറെ പേരുടെ ജോലി കളഞ്ഞു!

എങ്ങനെ? ആദ്യം ഒരു വാച്ച് തുറന്നു നോക്കാം.

മെക്കാനിക്കൽ വാച്ചിൽ ബാറ്ററിയില്ല. ഉള്ളിൽ ചുരുട്ടിവെച്ച ഒരു സ്പ്രിംഗ് മാത്രം.

അത് അയയുമ്പോൾ ഗിയറുകൾ കറങ്ങും. പക്ഷേ ഒറ്റയടിക്ക് അയയാതിരിക്കാൻ... ഈ ബാലൻസ് വീൽ.

സെക്കൻഡിൽ എട്ട് തവണ ആടി, അത് സമയം അളന്ന് മുറിച്ച് വിടുന്നു.

ഓട്ടോമാറ്റിക് വാച്ചിൽ, കൈ അനങ്ങുമ്പോൾ ഒരു റോട്ടർ കറങ്ങി, ആ സ്പ്രിംഗ് താനേ മുറുക്കും.

പിന്നെ, 1969-ലെ ക്രിസ്മസ് ദിനം. ജപ്പാനിൽ സെയ്കോ ഒരു പുതിയ വാച്ച് ഇറക്കി.

ഉള്ളിൽ ഒരു ക്വാർട്സ് ക്രിസ്റ്റൽ. ബാറ്ററി തൊട്ടാൽ, അത് സെക്കൻഡിൽ മുപ്പത്തിരണ്ടായിരത്തിലേറെ തവണ വിറയ്ക്കും.

...

അതുകൊണ്ടാണ് സാധാരണ ഒരു ക്വാർട്സ് വാച്ച് പോലും... ലക്ഷങ്ങളുടെ റോളക്സിനേക്കാൾ കൃത്യമായി സമയം പറയുന്നത്.

സ്വിസ് വാച്ച് കമ്പനികൾ ഒന്നൊന്നായി പൂട്ടി. 1970-ൽ തൊണ്ണൂറായിരം പേർ. 1988-ൽ ഇരുപത്തിയെട്ടായിരം.

എല്ലാം... ആ ഒരു കുഞ്ഞു ക്രിസ്റ്റൽ കാരണം.
```

## English, line by line

| # | beat | English |
| --- | --- | --- |
| 1-2 | hook: small cause, giant effect | One tiny crystal... cost more than sixty thousand people in Switzerland their jobs! |
| 3 | open loop | How? First, let's open up a watch. |
| 4 | how (mechanical) | A mechanical watch has no battery. Inside, just a coiled spring. |
| 5 | how | As it unwinds, the gears turn. But so it doesn't unwind all at once... this balance wheel. |
| 6 | how | Swinging eight times a second, it measures time out piece by piece. |
| 7 | how (automatic) | In an automatic, when your hand moves, a rotor spins and winds that spring by itself. |
| 8 | the turn arrives | Then, Christmas Day 1969. In Japan, Seiko released a new watch. |
| 9 | how (quartz) | Inside, a quartz crystal. Touch it with a battery and it vibrates over thirty-two thousand times a second. |
| 10 | silence | ... |
| 11 | twist | That's why even an ordinary quartz watch... tells time more accurately than a Rolex worth lakhs. |
| 12 | payoff | Swiss watch companies shut one after another. 90,000 people in 1970. 28,000 in 1988. |
| 13 | callback | All because of... that one tiny crystal. |

## Visual plan (new skills)

| beat | visual | tool |
| --- | --- | --- |
| 1-2 | Bright frame: a glowing crystal slams in, then a field of Swiss factory figures fading out row by row | `reel-visuals` kinetic hook + people |
| 3 | The watch case back unscrews and the movement lifts out in an exploded view | `anatomy` (isometric, four-tone shading) or `teardown` (real 3D) |
| 4-6 | Mainspring barrel unwinds -> gear train turns -> escapement and balance wheel tick at 4 Hz (8 beats/s), the part doing the work highlighted | `teardown`: one input (time) drives every gear with real ratios |
| 7 | A hand swings, the rotor spins, the mainspring tightens | `teardown` + people rig |
| 8 | 1969 calendar card, Tokyo, Christmas | kinetic type |
| 9 | Battery -> crystal tuning fork vibrating, counter racing to 32,768, a divider halving it 15 times down to 1 tick per second | `anatomy` isometric + counter |
| 10 | Silence: two watches side by side | |
| 11 | Split screen: quartz drifts about 20 s a month, Rolex up to 2 s a day (about 60 s a month) | data card |
| 12 | Swiss map, workshop lights going out, the 90,000 -> 28,000 counter | map + counter |
| 13 | Back to the glowing crystal | callback |

## Sources

- Quartz crisis: Astron unveiled 25 Dec 1969 in Tokyo; Swiss watch employment 90,000 (1970) to 28,000 (1988). https://en.wikipedia.org/wiki/Quartz_crisis , https://www.watchtime.com/featured/1969-seikos-breakout-year/ , https://www.gearpatrol.com/watches/a35132235/seiko-astron/
- 32,768 Hz tuning-fork crystal and the 15-stage divider: https://chronocentric.com/watches/accuracy.shtml
- Quartz about ±20 s per month, mechanical several seconds per day (Japan Clock & Watch Association): https://jcwa.or.jp/en/time/qa/qa07.html
- COSC mechanical +6/-4 s/day; Rolex Superlative Chronometer -2/+2 s/day: https://cosc.swiss/en/certification/quartz-movements , https://www.bobswatches.com/rolex-blog/?p=70318
- Mechanical and automatic basics, 28,800 vibrations per hour (8 per second): https://www.watchtime.com/brands/automatic-watches/how-does-a-mechanical-watch-actually-work , https://shop.orientwatchusa.com/blogs/orient-blog/so-how-does-a-mechanical-watch-work

## Accuracy notes

- "60,000+ jobs" = 90,000 minus 28,000. Sources differ on the end year (1978, 1983 or 1988); 1988 is the most common and is what the script says. The 90,000 includes indirect jobs.
- The Swiss also responded slowly (their Beta 21 quartz movement came in 1970); quartz wasn't the only cause, but it is the one every source names. The script says the crystal "cost" the jobs, which is how the quartz crisis is told; keep the caption honest ("the quartz crisis").
- "Eight times a second" is for the common 28,800 vibrations per hour; some watches run at 21,600 (6 per second).
- The Rolex comparison uses Rolex's own -2/+2 s/day standard against a typical quartz ±20 s/month. Individual watches vary. "Ordinary quartz" (സാധാരണ), not "₹500", because the cheapest watches may be worse.
- "First quartz wristwatch": Seiko Astron is widely described as the first on sale.

## Length

About 95 Malayalam words, roughly 45 s. If the voice comes out over 48 s, cut line 7 (automatic) to "ഓട്ടോമാറ്റിക് വാച്ചിൽ കൈയുടെ ചലനം തന്നെ സ്പ്രിംഗ് മുറുക്കും."

## English voiceover version (for an English narration)

```
One tiny crystal...

cost more than sixty thousand people in Switzerland their jobs.

How? Let's open a watch.

A mechanical watch has no battery. Just a tightly coiled spring.

As it unwinds, the gears turn. But to stop it unwinding all at once... there's this. The balance wheel.

It swings eight times every second, letting time out one tiny step at a time.

In an automatic watch, every move of your wrist spins a rotor, and the rotor winds the spring for you.

Then, Christmas Day, 1969. In Japan, Seiko released a new kind of watch.

Inside was a quartz crystal. Touch it with a battery, and it vibrates over thirty-two thousand times a second.

...

That's why an ordinary quartz watch keeps better time than a Rolex.

Swiss watchmakers shut down one after another. Ninety thousand jobs in 1970. Twenty-eight thousand by 1988.

All because of... one tiny crystal.
```

About 110 words, roughly 42-45 s at a steady narration pace. Same facts and sources as the Malayalam version above.
