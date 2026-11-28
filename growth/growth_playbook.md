# Growth playbook (owner, 28 Nov 2026): every video, every time

Where we are: 175 followers. Winners so far: **Avengers: Doomsday (~36k views)**, **Kerala gold price (~32k views)**; the **₹15 tea split** got ~6k likes in its first day. Goal: turn one-off hits into followers.

## What the winners have in common (our own data beats any formula)
- **Mass, timely Kerala interest:** gold rate (every family checks it), a huge film (Marvel), money in daily life (tea). Niche history topics (1924 flood, 1950 World Cup) did far less.
- **A number in the first frame:** "₹48 കോടി", "₹8,840 ഇടിഞ്ഞു", "₹15".
- **A question every viewer already has:** "why did gold fall?", "how much does the tea man keep?".
- Note: the English hook scorer (virality/hookscore.py) rated these winners only 44-48. It is built for English creator hooks, so it is a *check*, not the judge. Our Malayalam data comes first.

## The checklist for every new video (do all of it, every time)
1. **Topic gate:** would a typical Malayali family talk about this at dinner this week? Prefer money, gold/fuel/prices, big films, Kerala places, viral Kerala people. Niche history only inside the mystery series.
2. **Hook:** first frame = the number or the strange fact on a big card, spoken in the first 2 s. Write 3 hooks, run `python3 .claude/skills/virality/tools/hookscore.py hooks.txt`, then pick using our winners' pattern above (number + question everyone has).
3. **Script polish:** `python3 .claude/skills/virality/tools/speech.py` to time lines; `humanize.py` on any English text (captions, descriptions); no em dashes.
4. **Voice and sound (the "audio skills"):** the best voice we have (ElevenLabs Adam until an OmniVoice test beats it), voice-led mix at about -10 LUFS, a sound bed that fits the series (bright for split/news, the dark kit for mysteries: drone, creaks, heartbeat, riser before cuts), sfx on every reveal.
5. **Title + cover:** `python3 .claude/skills/yt-package/title.py --title "..." --thumb "..."` (title and cover text must say different things); cover = the hook card.
6. **Caption:** ig-caption skill rules: hook line under 100 chars (English hook + Malayalam line), the search keywords people type (e.g. "gold rate today kerala", "tea shop profit"), **exactly 5 hashtags**.
7. **After posting:** log views/likes/saves/shares at 24 h and 7 d in `growth/log.md`; export YouTube retention for every reel and run `yt-retention`.

## Hashtags: 5, chosen by job
| slot | job | examples |
| --- | --- | --- |
| 1 | the exact search term for the topic | #GoldPrice #GoldRateToday #AvengersDoomsday #TeaShopBusiness |
| 2 | a second topic term (synonym / English spelling people type) | #GoldRate #MovieTicket #MaryCeleste |
| 3 | Kerala | #Kerala (or the district: #Idukki) |
| 4 | Malayalam audience | #Malayalam (or #Malayali) |
| 5 | our series tag (same every episode, so the series becomes searchable) | #KeralaYatra · #OruRupayudeKanakku · #IruttileKathakal · #infoinindia |
- Mosseri (head of Instagram): hashtags label the post for search; they do not add reach. Keywords in the caption matter more. So the caption must contain the words people actually type.
- YouTube: 3 hashtags in the title/description (the first three show above the title).

## Names (profile and series)
- The Instagram **name field** is searchable. Use it for what people search, e.g. `Malayalam Facts · Kerala · Money` (the ig-profile skill can score the profile when the owner pastes it).
- Series names stay fixed so people can binge: "Kerala Yatra", "ഒരു രൂപയുടെ കണക്ക്", "ഇരുട്ടിലെ കഥകൾ". Use the same cover style per series.
