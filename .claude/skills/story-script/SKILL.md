---
name: story-script
description: Write the voiceover script for an info.inmalayalam reel as a story, not a list of facts - a person, a moment, a problem, rising tension, a turn, a payoff and a callback - in spoken Malayalam, ready to paste into ElevenLabs. Use for every new reel script (history, science, Kerala, world facts, brands, games), whenever the user asks for a script, a hook, a voiceover or "make it interesting", and before writing any storyboard.
---

# story-script

From Video 8 on, every script is a story. Facts are the evidence inside the story, never the story itself. The goal: people stay to the end, feel something, and want the next one.

## The shape (35-45 s, 8-11 spoken lines)

| beat | time | job | how |
| --- | --- | --- | --- |
| **1. Cold open** | 0-3 s | Drop the viewer into a moment, mid-action, with a question they need answered | A scene, not a summary: "1995. സ്കോട്ട്ലൻഡിലെ ഒരു തണുത്ത ഓഫീസ്. രണ്ട് ചെറുപ്പക്കാർ ഒരു ഗെയിം ടെസ്റ്റ് ചെയ്യുകയാണ്..." |
| **2. The person** | 3-8 s | Give us someone to follow: a name, an age, a place, a want | Real people only, with only what sources support. If no named person, use "a group of", "a young engineer" etc. |
| **3. The problem** | 8-15 s | What stands in the way. Stakes: money, pride, time, danger | "പക്ഷേ ഒരു പ്രശ്നം..." "ആരും വിശ്വസിച്ചില്ല..." |
| **4. Rising tension** | 15-30 s | 2-3 short beats, each one making it worse or stranger | Every beat ends on a small open loop: "...അപ്പോഴാണ് അത് സംഭവിച്ചത്." |
| **5. The turn** | 30-38 s | The surprise that flips everything | One sentence, after a pause. This is where the music drops and comes back. |
| **6. The payoff** | 38-45 s | What it led to, with one big concrete number or image | "...മൂന്ന് ദിവസം കൊണ്ട് നൂറ് കോടി ഡോളർ." |
| **7. The callback** | last 3 s | Return to the first line with new meaning, so the loop invites a rewatch | Mirror the cold open: same place, same words, now understood. |

## Rules that make people stay

- **Never open with the topic name or "did you know".** Open with a moment, a sound, a person, a number that feels wrong.
- **One open loop always running.** Before the viewer gets one answer, give them the next question.
- **A pattern interrupt every 5-7 seconds:** a time jump, a number, a "but", a short sentence after long ones, a silence.
- **Short spoken sentences.** 4-10 words. Say it out loud; if you run out of breath, cut it.
- **Spoken Malayalam, not textbook Malayalam.** "അവർ ഞെട്ടി" not "അവർ ആശ്ചര്യപ്പെട്ടു". Talk like telling a friend at a tea shop.
- **Concrete over abstract.** A rainy window, a cold office, a red stamp, a dollar figure. These also become the visuals.
- **Feel something.** Each script picks one emotion to build toward: wonder, pride (Kerala, India), suspense, underdog joy, injustice.
- **No calls to action.** No follow, like, comment or share requests anywhere. End on the callback or a punchline.
- **Pauses are part of the script.** Use "..." where the voice should hold. ElevenLabs turns each blank line into a breath; the sync tool uses them to cut scenes.

## The first 3 seconds (from real numbers)

The GTA "police game" reel had a **61% skip rate** while its save rate was above typical: people who stayed liked it, but most left before the story began. It opened on the topic name and "നിങ്ങൾക്കറിയാമോ?" over a dark frame. The table-tennis reel (best so far) opened bright, on a person doing something. Check `growth/log.md` before every script.

- **Line 1 is a person or a moment, said within 0.3 s.** Never the topic name, never "did you know". Bad: "GTA ആദ്യം ഒരു പോലീസ് ഗെയിം ആയിരുന്നു." Good: "ഒരു 17 വയസ്സുകാരൻ. ഒരു ഹോട്ടൽ മുറി. ലോകം ഞെട്ടി."
- **Line 1 must be strange enough to stop a thumb:** a number that feels wrong, a contradiction, a stake. If it could be a textbook sentence, rewrite it.
- **Write a hook card** with each script: 3-6 Malayalam words that sit big on screen for 0-3 s (the visual promise of the story), separate from the word captions.
- **Give it a share reason:** a Kerala/India/Mallu link, or a moment a viewer wants to show a friend. This is not a CTA; never ask for the share.
- **Length 35-45 s raw.** Cut a beat before going over.

### Build rules for the opening (for the video page)

- Frame 0 is fully lit and colourful: no fade from black, no dark grade for the first 3 s (the documentary grade can settle in after).
- Something moves in frame 0 (camera push, object entering).
- The hook card is on screen from frame 0 to about 3 s, at least 90 px, high contrast, inside the safe area.
- No empty caption gaps in the first 3 s.

## Truth rules (unchanged, and stricter for stories)

- Research first, keep sources. A story feels true only if it is true.
- Never invent dialogue, thoughts, names, ages or scenes a source doesn't support. Dramatise with structure, rhythm and framing, not with made-up details.
- Mark anything popular but unproven ("it is said", "കരുതപ്പെടുന്നു") or leave it out.
- If the most dramatic version isn't supported, use the supported one and make the rhythm carry the drama.

## Output format

1. **Title + the one emotion** the story builds toward.
2. **ElevenLabs paste block** in a code fence, one line per beat, blank lines between beats.
3. **English line by line**, each tagged with its beat (cold open, person, problem...).
4. **Visual note per beat** (one line each) so the storyboard follows the story.
5. **Sources**, and **accuracy notes** for anything softened or left out.
6. **Length estimate** (about 9-10 Malayalam words per 5 s at Roger's pace; aim for 35-50 s raw).

## Checklist before showing the user

- [ ] First line is a moment, not the topic or "did you know"
- [ ] Hook card written (3-6 words for 0-3 s) and a share reason named
- [ ] Raw length 35-45 s
- [ ] There is a person (or group) to follow and something at stake
- [ ] Every 5-7 s something changes
- [ ] Exactly one big turn, set up by a pause
- [ ] Last line calls back to the first
- [ ] No CTA of any kind
- [ ] Every fact has a source; no invented dialogue or details
- [ ] Read aloud: every sentence fits in one breath

## Example: the GTA script rewritten as a story

```
1995. സ്കോട്ട്ലൻഡിലെ ഒരു തണുത്ത ഓഫീസ്.

ഒരു കൂട്ടം ചെറുപ്പക്കാർ ഒരു പുതിയ ഗെയിം ഉണ്ടാക്കുന്നു... പോലീസ് കള്ളനെ പിടിക്കുന്ന ഗെയിം.

പേര്, "റേസ് ആൻഡ് ചേസ്".

പക്ഷേ ടെസ്റ്റ് ചെയ്യുമ്പോൾ ഒരു വിചിത്രമായ കാര്യം അവർ ശ്രദ്ധിച്ചു...

ആരും പോലീസ് ആകാൻ ആഗ്രഹിക്കുന്നില്ല.

എല്ലാവർക്കും... കള്ളനാകണം.

അവർ ഒരു വലിയ തീരുമാനമെടുത്തു. കഥ തന്നെ തിരിച്ചിട്ടു.

ആ ഗെയിമിന് പുതിയ പേരും കിട്ടി... ഗ്രാൻഡ് തെഫ്റ്റ് ഓട്ടോ.

പതിനെട്ട് വർഷം കഴിഞ്ഞ്, അതിന്റെ അഞ്ചാം ഭാഗം, മൂന്ന് ദിവസം കൊണ്ട് നൂറ് കോടി ഡോളർ നേടി.

എല്ലാം തുടങ്ങിയത്... ആ തണുത്ത ഓഫീസിൽ, ആരും പോലീസ് ആകാൻ ആഗ്രഹിക്കാത്ത ഒരു ദിവസം.
```

Why it works: it opens on a place and a year (a moment), follows a group with a goal, sets a small mystery ("a strange thing"), lands the turn after a pause ("everyone wants to be the thief"), pays off with one huge number, and the last line returns to the cold office.
