# Posting strategy: when, keywords, hashtags, caption language

Researched 18 Nov 2026. Most "best time" data comes from marketing blogs, not Instagram or YouTube, and there is **no Kerala-specific time-of-day study**. Treat the times below as a starting point; our own Insights beat every blog after about 10 posts.

## 1. When to post (IST)

| platform | first choice | second choice | notes |
| --- | --- | --- | --- |
| Instagram Reels | **7:30 PM, Mon-Fri** | Sat 8:30 PM; Sun 2-5 PM | Blogs agree on weekday evenings 6-10 PM IST. Post 30 min before the peak so the first viewers arrive as people open the app. |
| YouTube Shorts | **6:30-8 PM, Mon-Fri** | 1-3 PM weekdays | Shorts keep getting pushed for days, so the hour matters less than on Instagram. |
| Facebook (cross-post) | same as Instagram | | It gave 8x the Instagram views on the GTA reel; keep cross-posting on. |

- **Gulf Malayalis:** 7:30 PM IST is 6:00 PM in the UAE and 5:00 PM in Saudi Arabia, so the same slot catches people after work there too.
- **Test plan:** alternate 7:30 PM and 1:00 PM for the next 6 posts, log reach after 24 h in `growth/log.md`, then keep the winner.
- After about 100 followers, Instagram Insights (Followers -> Most active times) and YouTube Studio (Audience -> When your viewers are on YouTube) show our real peak. Switch to that.

## 2. Hashtags vs keywords

### Instagram
- **Hard limit: 5 hashtags per post or reel** since 18 Dec 2025 (comments count too). More than 5 cannot be posted.
- Adam Mosseri (head of Instagram): hashtags are not a way to get more reach. They label the post for search.
- Instagram Search reads the **caption, username, name, bio and place**. Keywords in the caption now matter more than hashtags.
- Put keywords and hashtags **in the caption, not the first comment**.
- Use 3-5 specific tags (#KeralaHistory beats #history).

### YouTube Shorts
- Hashtags help categorise; they rarely add reach. Use **3-5** in the description (the first three show above the title). More than 60 and YouTube ignores all of them.
- **The title does the work**: put the main search term first ("Munnar train 1924", "Kerala flood 99"). The hidden Tags field barely matters.
- `#shorts` is optional (vertical, under 3 minutes is enough), but harmless.

### The real ranking signal on both
The first 2-3 seconds (skip rate) and watch time decide reach. No caption or tag fixes a weak hook. That's why our storytelling rule exists.

## 3. Caption language: English or Malayalam?

**Recommendation: bilingual, not English-only.**

- **Why not English-only:** the video is Malayalam voice. An English-only caption can pull in non-Malayalam viewers who swipe away at the first Malayalam word, and that raises the skip rate, the one number that hurts us most.
- **Why English still matters:** most people type searches in English or Manglish ("kerala flood 1924", "munnar train"), so English keywords make the reel findable.
- **Why Malayalam matters:** it tells the algorithm and the viewer "this is for Malayalis", and it's what makes people share with family.
- Meta's AI Reel translation added Bengali, Tamil, Telugu, Kannada and Marathi in Jan 2026; I didn't find Malayalam in that list, so we can't rely on auto-translation yet.
- No study compares Malayalam vs English captions directly. Claims of "20-30% more engagement for regional captions" come from blogs without data. So we test.

**Format:**
```
Line 1 (English hook, under 125 characters, shows before "more"):
One rain washed away a whole hill in Kerala, and a railway with it. 🌧️

Line 2 (Malayalam, the feeling):
മൂന്നാറിലെ ആ തീവണ്ടി ഇന്ന് ഒരു പേരിൽ മാത്രം ബാക്കി.

Line 3 (keywords people search, written naturally):
Kerala flood 1924, the great flood of 99, Munnar history, Kundala Valley Railway, Top Station.

#KeralaHistory #Munnar #KeralaFlood #Malayalam #Kerala
```

**Test:** for 6 posts, alternate "English hook first" and "Malayalam hook first". Compare reach from Explore/Search and skip rate in `growth/log.md`.

## 4. Keyword bank for our niche

English: Kerala history, Kerala facts, Malayalam facts, Kerala unknown facts, Indian history, Kerala story, history in Malayalam, did you know Kerala, Malayali, Mallu, Munnar, Kochi, Kozhikode, Travancore, world history Malayalam.

Malayalam (people do search these): കേരള ചരിത്രം, മലയാളം ഫാക്ട്സ്, അറിയാക്കഥകൾ, ചരിത്രം, കേരളം.

Hashtag pool (pick 5): #KeralaHistory #Kerala #Malayalam #Malayali #MalayalamFacts #IndianHistory #Mallu, plus one topic tag (#Munnar #GTA6 #TableTennis).

## Sources

- Instagram 5-hashtag limit: https://www.businesstoday.in/technology/news/story/no-more-hashtag-stuffing-instagram-limits-hashtag-usage-to-just-5-per-reel-and-post-507444-2025-12-19
- Mosseri on hashtags vs keywords: https://www.phable.io/phable-labs/instagram-hashtags-keywords-discovery , https://www.latestly.com/technology/instagram-caps-hashtags-at-five-per-post-in-new-policy-shift-amidst-head-of-instagram-mosseris-myth-claims-7245760.html
- India Reels times: https://www.socialpilot.co/?p=553523 , https://www.wscubetech.com/blog/instagram-post-time/ , https://bosswallah.com/blog/creator-hub/best-instagram-reels-posting-time-in-india-boost-views-engagement/ , https://buffer.com/library/best-time-to-post-on-instagram
- YouTube Shorts times (India): https://timetopost.co/best-time-to-post/youtube/india/ , https://www.wscubetech.com/blog/best-time-to-post-on-youtube/ , https://buffer.com/library/best-time-to-post-on-youtube/
- YouTube hashtags: https://subscribr.ai/p/youtube-shorts-hashtags-virality , https://www.opus.pro/blog/maximize-your-views-choosing-the-right-hashtags-for-youtube-shorts , https://subscribr.ai/youtube-strategy/youtube-shorts-seo-guide
- Meta Reel translation languages: https://www.indiatvnews.com/technology/news/instagram-expands-meta-ai-reel-translations-to-bengali-tamil-telugu-kannada-and-marathi-2026-01-17-1026257 , https://about.fb.com/news/2025/11/instagram-empowers-creators-to-go-global-with-local-voice-translations-and-fonts/embed/
- GitHub: searched for posting-time and hashtag tools; found only scraping API lists (against Instagram's terms), nothing worth using.

## Length limit (owner, 20 Nov 2026)
Keep both the Instagram caption and the YouTube Shorts title to **100 characters or fewer**, hashtags included (an emoji counts as 2). Check with: `python3 -c "import sys;print(len(sys.argv[1].encode('utf-16-le'))//2)" '<text>'`

## 5. Two posts a day (owner's plan, 22 Nov 2026)

| lane | what | slot (IST) | why this slot |
| --- | --- | --- | --- |
| **A. Explainer** | "What is this? Why is it happening?": news, cricket, football, world events, history | **7:30 PM** | Our biggest format (the gold reel) gets the prime slot; trending topics need the evening crowd the same day |
| **B. Kerala Yatra series** | One district a day in road order, top 5 places with map, route, photos and how to travel | **1:00 PM** | Travel plans get saved and shared over lunch; 6.5 h apart, so the two posts don't compete |

- Series order (road order, 14 days): Thiruvananthapuram, Kollam, Pathanamthitta, Alappuzha, Kottayam, Idukki, Ernakulam, Thrissur, Palakkad, Malappuram, Kozhikode, Wayanad, Kannur, Kasaragod. Then the next state.
- Every series post is labelled the same way: "KERALA YATRA · EP 1/14 · THIRUVANANTHAPURAM", the same title format and one series hashtag (#KeralaYatra), and a YouTube playlist. The countdown makes people look for the next one without any call to action.
- Keep a buffer of 2 finished series episodes, so a slow explainer day never breaks the daily chain.
- Log each lane separately in `growth/log.md` (views, skip rate, saves, shares) and swap the slots if lane B beats lane A.

## The three series and the daily plan (owner, 25 Nov 2026)
1. **Kerala Yatra** (travel series, calm narrator): one episode **every day**, 1:00 PM IST.
2. **News / explainers** (the hook-twist reels we started with: latest news, information, "how it works").
3. **Split series** ("ഒരു രൂപയുടെ കണക്ക്": split the price of an everyday thing, how much the seller actually makes).

Every day = **one Kerala Yatra + one more reel, either a news explainer or a split episode**, whichever is stronger that day, at 7:30 PM IST. When a news story is trending hard (like Avengers: Doomsday or Sooryavanshi's 204), the news reel takes the slot; on quieter news days, post a split episode. Keep a split episode ready in reserve so a slow news day never leaves the slot empty.
