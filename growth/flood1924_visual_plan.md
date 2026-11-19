# 1924 flood (Munnar's vanished train): visual plan

Voice: `audio/flood.mp3` (49.8 s, script v1). Look: a real 3D Munnar world, not cartoon: tea-terraced hills in morning mist, a narrow-gauge steam train with tea chests, then the storm, the river, the landslide, the gap where the line was.

## GitHub research

| repo | licence | stars | decision |
| --- | --- | --- | --- |
| three.js examples `Sky.js` (official) | MIT | - | **Use**: physically based dawn sky for the bright opening and the misty ending |
| three.js `SimplexNoise` / `ImprovedNoise` (official) | MIT | - | **Use**: terrain heights, mist, rain variation; no extra dependency |
| IceCreamYou/THREE.Terrain | MIT | 926 | Skipped: does what a 40-line fBm terrain does here; would add an old global build |
| jbouny/ocean, three `Water.js` | MIT | 807 | Skipped: ocean reflections need an extra render pass and a normal map file; the flood is muddy brown water, done with a physical material + animated normals |
| SahilK-027/Elemental-Serenity | MIT | 271 | Reference only: its rain diorama idea (instanced streaks) is rebuilt in our time-only style |
| dzikribassyril/landslide-simulation | MIT | 0 | Skipped: no track record; the landslide is our own terrain deformation |
| sirioberati/ai-filmmaking-camera-control | MIT | 137 | Skipped: tied to an AI video service; our camera moves are keyframed |
| Real elevation data (SRTM) | - | - | Not reachable from here; terrain is procedural, shaped like Munnar's valleys (labelled as a reconstruction, not a survey) |

Reused from our kit: `lib/anatomy3d.js` (studio pipeline: AO, DOF, bloom, PMREM), `lib/maps` (official Kerala districts, extruded in 3D), our caption/sync/audio pipeline.

## Look per subject

| subject | approach |
| --- | --- |
| Munnar hills | 3D terrain (fBm ridges), tea-row texture on slopes, darker forest on ridges, fog + drifting mist layers, dawn Sky |
| The train | procedural narrow-gauge steam loco + wagons with tea chests on a rail line that follows the hillside; steam puffs |
| Monorail beginning | a single-rail trolley with tea chests (simplified) |
| The storm | sky to overcast, fog thickens, instanced rain streaks, wet darker ground, river rising |
| Periyar overflowing | brown flood water plane rising up the valley, animated ripples |
| Karinthiri landslide | a hillside section slides down (vertex deformation + mud colour + tumbling rocks), the road strip and the rails go with it |
| Aftermath | grey morning, mist, rails hanging over the gap |
| 1099 / 2018 | Kerala as a 3D extruded map; flood water rises over the central districts named in the sources (Thrissur, Ernakulam, Idukki, Kottayam, Alappuzha) |
| Top Station | misty cliff edge with a weathered signboard, camera pulls back into the clouds |

## Shot list (script v1)

| line | shot | why |
| --- | --- | --- |
| മൂന്നാറിൽ ഒരിക്കൽ ഒരു തീവണ്ടി ഓടിയിരുന്നു. | Drone pass over sunlit tea hills, train enters frame with steam | bright, real first frame + the subject |
| ഇന്ന്... അതിന്റെ ഒരു പാളം പോലുമില്ല. | Match cut: same hillside, empty, the line fades out | the open loop, shown |
| ...മോണോറെയിലായിട്ടായിരുന്നു തുടക്കം. ചായപ്പെട്ടികളുമായി അത് മല കയറി. | Low push-in on the single-rail trolley, then a tracking shot alongside the train climbing | the "person" of the story |
| 1924 ജൂലൈ. മഴ തുടങ്ങി... പക്ഷേ നിന്നില്ല. | Wide hold as the sky darkens; rain begins; macro of rain on the rail with shallow focus | tension builds |
| ദിവസങ്ങളോളം പെയ്തു. പെരിയാർ കരകവിഞ്ഞു. | Drone over the valley, brown water rising and spreading | scale of the flood |
| കരിന്തിരി എന്നൊരു മല... ഒന്നാകെ ഒലിച്ചുപോയി. ഒപ്പം ...റോഡും. | Wide on the hill, then the landslide with rocks and the road snapping, camera shake | the event |
| മഴ തോർന്നപ്പോൾ... | Hold: silence, rain thins, grey light | the silence beat |
| ആ തീവണ്ടിപ്പാത, ഇല്ലായിരുന്നു. | Slow push to the broken rails hanging over the gap | the turn |
| അത് പിന്നീട് ഒരിക്കലും പുനർനിർമ്മിച്ചില്ല. | Pull back over the empty valley, stamp "പുനർനിർമ്മിച്ചില്ല" | payoff |
| കൊല്ലവർഷം 1099... തൊണ്ണൂറ്റിയൊമ്പതിലെ വെള്ളപ്പൊക്കം. | Rise over the 3D Kerala map, water floods the central districts, "1099" | the name |
| 2018-ൽ വെള്ളം കയറിയപ്പോൾ... | Same map, label flips to 2018, water rises again | the modern link |
| ...ടോപ്പ് സ്റ്റേഷൻ എന്ന ഒരു പേരിൽ. | Misty cliff with the signboard, pull back into clouds | callback |
