# Split series ("ഒരു രൂപയുടെ കണക്ക്"), episode 1: a ₹15 glass of tea, split open

**New series (owner, 25 Nov 2026):** take something everyone buys every day and split its price into its real parts, the way the anatomy shots split an object. A real 3D object comes apart into labelled layers, each layer = one cost, and a coin stack shrinks until only the seller's profit is left. Hook = the price everyone knows; twist = the surprising part; payoff = what the seller really keeps. Runs alongside the daily news explainers and Kerala Yatra.
**Hook card (0-3 s):** ₹15 ചായ... ചായക്കാരന് എത്ര?
**Length:** 68 Malayalam words (Ramayana: 66 words = 40.2 s raw with Adam), so about 40-42 s raw, 36-40 s synced.

## ElevenLabs paste block

```
ഒരു ഗ്ലാസ് ചായ, പതിനഞ്ച് രൂപ. പക്ഷേ ചായക്കാരന് കിട്ടുന്നത് എത്ര? ഈ ഗ്ലാസ് നമുക്കൊന്ന് പിളർന്ന് നോക്കാം.

ആദ്യം പാൽ. ഏകദേശം നാല് രൂപ. പഞ്ചസാര, അറുപത് പൈസ. ഗ്യാസ്, അറുപത് പൈസ.

കടയുടെ വാടക, ഒന്നേമുക്കാൽ രൂപ. സഹായിയുടെ കൂലി, രണ്ടര രൂപ.

...

ഇനി ചായപ്പൊടി. ചായയുടെ പേര് തന്നെ അതാണ്... പക്ഷേ വില, വെറും അറുപത് പൈസ!

ബാക്കി, ഏകദേശം അഞ്ച് രൂപ. അതാണ് ലാഭം. അതും, ദിവസം ഇരുനൂറ് ചായ വിറ്റാൽ മാത്രം.

അടുത്ത തവണ പതിനഞ്ച് രൂപ കൊടുക്കുമ്പോൾ ഓർക്കുക... ചായപ്പൊടിക്ക്, വെറും അറുപത് പൈസ.
```

## Line by line

| # | beat | English | visual note |
| --- | --- | --- | --- |
| 1 | hook | A glass of tea, ₹15. But how much does the tea seller get? Let's split this glass open. | Bright: a real 3D Kerala tea glass (ribbed glass, frothy milky tea, steam) on a wet steel counter; hook card; a stack of 15 one-rupee coins beside it; the glass starts to separate into layers |
| 2 | ingredients | First, milk: about ₹4. Sugar: 60 paise. Gas: 60 paise. | Exploded layers lift out of the glass one by one with labels (MILK ~₹3.90 · 70 ml, SUGAR ₹0.60 · 10 g, GAS ₹0.60); coins slide off the stack into each layer |
| 3 | shop costs | The shop's rent: ₹1.75 a glass. The helper's wage: ₹2.50. | Two more layers: RENT ₹1.70 / glass, HELPER ₹2.50 / glass (+ small "POWER & WATER ₹0.25" chip on screen only); the coin stack shrinks |
| 4 | silence | ... | Hold: one thin dark layer left inside the glass, unlabelled |
| 5 | twist | Now the tea powder. The drink is named after it... but its cost: just 60 paise! | The thinnest layer lifts: TEA POWDER ₹0.60 · 3 g; slam "TEA = ONLY ₹0.60" |
| 6 | payoff | What's left: about ₹5. That's the profit. And only if the shop sells 200 teas a day. | The last coins glow gold: PROFIT ~₹4.85; a day meter: first ~95 glasses pay rent + helper, the rest is profit |
| 7 | callback | Next time you pay ₹15, remember... the tea powder costs just 60 paise. | The layers snap back into a whole glass; hook card returns |

## The model (our calculation; every input sourced, quantities are assumptions)

A small Kerala tea shop selling **200 glasses a day at ₹15**, open 30 days a month.

| part | assumption | cost per glass |
| --- | --- | --- |
| Milk | 70 ml per glass at ₹56/litre (Milma, from 1 June 2026) | ₹3.92 |
| Tea powder | 3 g of CTC dust at ₹200/kg (Kochi/Ernakulam hotel-blend listings ₹180-215/kg) | ₹0.60 |
| Sugar | 10 g at ₹61/kg (all-India retail average, Nov 2026) | ₹0.61 |
| Gas | about 4 g LPG per glass with the boiler kept hot all day; commercial 19 kg cylinder ₹2,840 in Kochi (1 Nov 2026) | ₹0.60 |
| Rent | ₹10,000/month for a small shop room in a town (listings: Kannur ₹6,000-15,000, Thrissur ₹10,000) ÷ 6,000 glasses | ₹1.67 |
| Helper | ₹15,000/month (Indeed average for a helper in Kerala, Feb 2026) ÷ 6,000 glasses | ₹2.50 |
| Power, water, washing | about ₹1,500/month ÷ 6,000 | ₹0.25 |
| **Total cost** | | **₹10.15** |
| **Profit** | ₹15 − ₹10.15 | **₹4.85 (~₹5)** |

Break-even: fixed costs ₹26,500/month = ₹883/day; each glass leaves ₹9.27 after ingredients and gas, so about **95 glasses a day** only cover rent, helper and power. At 200 glasses a day the owner keeps about ₹970 a day (~₹29,000 a month), which is also his own pay for a 12-hour day.

## Sources (searched 25 Nov 2026)

- Tea price: Kerala hotels raised a glass of tea from ₹12 to ₹16 in May 2026 after the commercial LPG hike (Manorama News https://www.manoramanews.com/kerala/latest/2026/05/09/hotel-food-prices-hike-in-kerala-tea-and-meals-costlier.html ; Janayugom https://janayugomonline.com/kerala-hotel-food-price-hike-cooking-gas-rate-increase/); roadside/small eatery tea ₹10-15 (Onmanorama, June 2026 https://www.onmanorama.com/food/features/2026/06/08/kerala-tea-price-hike-analysis.html). ₹15 is used as a typical small-shop price.
- Milk: Milma ₹4/litre hike from 1 June 2026, standard 1-litre pack ₹56 (Deshabhimani https://english.deshabhimani.com/deshabhimani-english-/kerala-news/milma-milk-price-hike-kerala-new-rates-june-2026-88895 ; Timeline Daily https://timelinedaily.com/business/milma-hikes-milk-price-by-rs-4-per-litre-from-today-83-of-extra-revenue-to-dairy-farmers)
- LPG: commercial 19 kg cylinder ₹2,840 in Kochi after the 1 Nov 2026 revision (Madhyamam https://madhyamamonline.com/kerala/commercial-lpg-cylinder-prices-increased-by-rs-1250-1568090 ; Goodreturns Kerala https://www.goodreturns.in/lpg-price-in-kerala-s18.html)
- Tea dust: IndiaMART listings, Ernakulam/Kochi CTC dust ₹180-215/kg (https://dir.indiamart.com/ernakulam/tea-dust.html ; https://dir.indiamart.com/kochi/tea-dust.html)
- Sugar: all-India average retail ₹60.53/kg on 12 Nov 2026 (Business Standard https://www.business-standard.com/industry/news/sugar-prices-rise-over-4-kg-despite-govt-steps-retail-rate-hits-59-50-126110401464_1.html ; Deccan Herald https://www.deccanherald.com/business/sugar-prices-jump-rs-4kg-in-a-month-despite-govt-steps-retail-at-rs-5950-4207034)
- Helper wage: Indeed, helper salary in Kerala ~₹15,095/month (Feb 2026) https://in.indeed.com/career/helper/salaries/Kerala
- Rent: Housing.com listings (Kannur ~₹6,000-15,000; Minalur, Thrissur ₹10,000) https://housing.com/commercial/rent/commercial-shop-for-rent-in-kannur-MA4P14djww4bmddnpj9z ; https://housing.com/commercial/rent/100452795-shop-for-rent-in-minalur-thrissur-for-rs-10000
- Per-cup cost range cross-check (₹3-8 ingredients; ₹3-5 net per cup at roadside stalls): https://tvanamm.com/blog/tea-shop-profit-per-month-india-2026 ; https://teaandhope.com/chai-business-profit/

## Accuracy notes

- This is **one example shop, our own calculation** from sourced prices. The screen says "EXAMPLE · APPROX. · VARIES BY SHOP" from the first frame of the split and "OUR CALCULATION" on the totals. Real shops differ (rent from ₹5,000 to ₹40,000, family members instead of a helper, more milk or less, snacks sold with tea).
- **Milk 70 ml and tea 3 g per glass** are assumptions for a Kerala-style milky tea in a ~100 ml glass; the voice says "about ₹4" for milk.
- **Gas** per glass is an estimate (boiler kept hot all day); the voice gives 60 paise, the screen "~₹0.60 (EST.)".
- **"Only if 200 a day":** the profit per glass depends on volume because rent and wages are fixed. At 100 glasses a day the shop barely breaks even (~95). The voice says "only if 200 teas a day".
- **No advice and no income promise:** the video explains where the money goes; it does not tell anyone to open a shop.
- **Visuals:** a generic 3D tea glass and coins, no brand names (no Milma or tea brand logos).
