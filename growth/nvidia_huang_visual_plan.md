# Visual plan: Nvidia / Jensen Huang return (video 19)

**Look:** a dark keynote stage, the "premium, not overlit" Doomsday mood moved to tech. A 12.8 m LED wall carries the real Nvidia logo and freely licensed photos and lights the stage with its colour; a glossy black floor; Nvidia-green rim lights that turn red in the scandal; a black plinth holding a real-3D data-centre GPU module; a glass column whose green fill is Nvidia's market value.

## GitHub / resources
- Reused our own engine: `lib/anatomy3d.js` (Studio: GTAO, bloom, DOF; Exploded) and the LED-wall code from `lib/cinema3d.js`; new world `lib/keynote3d.js`.
- `hyperframes-registry` blocks guided the flare, light leak and grain (no telemetry).
- Images via `tools/commons_fetch.py` (Wikimedia Commons, licences recorded in build/nvidia/credits.json).
- Skipped: GPU glTF models on Sketchfab and GitHub had unclear licences; the module is built in code instead (board, power stages, substrate, die, six HBM stacks, heat spreader, heat sink).

## Shot list
| beat | shot |
| --- | --- |
| hook | bright first frame: Huang (photo) on the LED wall, slow push-in, hook card; cut to the glass column surging $3T -> $4T, "+$950 BN · IN ONE DAY" |
| 1993 | wide stage push, wall "1993" -> Nvidia Endeavor HQ -> Huang portrait, "JENSEN HUANG · CO-FOUNDER & CEO" |
| chips | anatomy: 3/4 high orbit, the GPU separates into 7 labelled parts, then snaps back with a green glow |
| scandal | rims and plinth ring go red, wall "12 NOV", reported-not-proven pills, Huang's portrait greys, "HUANG RESIGNS" |
| fall | the column drains $4T+ -> ~$3T, "11 DAYS"; silence: wall dies, stage dark, thin green flare |
| twist | flash + light leak, "23 NOV · REINSTATED", "BOARD VOTE: UNANIMOUS", Trump portrait, "I MADE THE DEAL" |
| payoff | column surges again, wall "+31%", "THE PRICE OF ONE MAN" |
| quote | Huang among staff on the wall, quote card, "1 DEC · US HOUSE COMMITTEES" |
| callback | pull back to the wide stage, Nvidia logo, hook card returns |
