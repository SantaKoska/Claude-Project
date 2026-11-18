/* people.js — reusable flat-vector character rig (side profile), drawn in SVG.
 *
 *   const p = Person(parentG, { skin, hair, hairStyle, top, topStyle, stripe, pants, shoes, height });
 *   p.S = { x, y, s, face: 1|-1, walk, run, sit, lean, armN:[a,e], armF:[a,e], talk, smile, look, blinkSeed }
 *   p.render(t, mouthOpen)   // call every frame (time-only: same t → same picture)
 *
 * v2 (interaction + acting):
 *   p.S.reachN = { x, y, w }   // IK: near hand reaches a point in the parent's coordinates; w 0..1 blends from the pose
 *   p.S.reachF = { x, y, w }   // same for the far hand
 *   p.hold(svgGroup, 'N'|'F')  // the object rides in that hand and stays upright; p.release(side) lets go
 *   p.handIn(group, side)      // hand position in another group's coordinates (pass objects person to person)
 *   p.S.headTilt (deg, + = nod down), p.S.surprise 0..1 (wide eyes, raised brows, "o" mouth), p.S.frown 0..1
 *   breathing is automatic (p.S.breath = 0 to switch off)
 *
 * v3 (2.5D look): every part is shaded as a volume (cylinder limbs, sphere head and hands), rim light behind,
 * occlusion at shoulders, joints and neck, soft contact shadow, eyes with iris + catchlight.
 *   options: rim: '#FFE9C4', rimOpacity: .35 (match the scene's back light), iris, mustache: true,
 *            lower: 'mundu' (+ mundu colour, kasavu border colour)
 *
 * Angles are degrees, "forward" positive. walk/run/sit are 0..1 blends, so GSAP can tween them.
 * Everything is driven by p.S and t, so it works with window.seek(t).
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const shade = (hex, f) => {               // f < 0 darker, > 0 lighter
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]
      .map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const lerp = (a, b, u) => a + (b - a) * u;

  // v3 "2.5D" shading: shared gradients so flat shapes read as rounded volumes (key light front-top, rim light behind)
  let DEFS = null; const GC = {};
  function defs(node) { if (DEFS && DEFS.isConnected) return DEFS; const svg = node.ownerSVGElement || node; DEFS = svg.querySelector('defs') || mk('defs', {}, svg); return DEFS; }
  function grad(node, kind, c) {
    const id = 'pg_' + kind + '_' + c.slice(1); if (GC[id] && GC[id].isConnected) return `url(#${id})`;
    const D = defs(node); let g;
    if (kind === 'cyl') { g = mk('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0 }, D);
      [[0, shade(c, -.45)], [.2, shade(c, -.2)], [.55, c], [.8, shade(c, .2)], [1, shade(c, -.02)]].forEach(([o, col]) => mk('stop', { offset: o, 'stop-color': col }, g)); }
    else if (kind === 'sph') { g = mk('radialGradient', { id, cx: .64, cy: .36, r: .78 }, D);
      [[0, shade(c, .22)], [.45, c], [1, shade(c, -.38)]].forEach(([o, col]) => mk('stop', { offset: o, 'stop-color': col }, g)); }
    else if (kind === 'top') { g = mk('linearGradient', { id, x1: 0, y1: 0, x2: .25, y2: 1 }, D);
      [[0, shade(c, .3)], [.45, c], [1, shade(c, -.35)]].forEach(([o, col]) => mk('stop', { offset: o, 'stop-color': col }, g)); }
    else if (kind === 'ao') { g = mk('radialGradient', { id }, D); mk('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': .45 }, g); mk('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }, g); }
    GC[id] = g; return `url(#${id})`;
  }
  let RIM = { c: '#FFE9C4', o: .35 };

  function limb(parent, len1, len2, w1, w2, c1, c2, endFn) {
    const root = mk('g', {}, parent);
    const seg = (p, w, len, c) => { mk('rect', { x: -w / 2, y: -w / 2, width: w, height: len + w / 2, rx: w / 2, fill: grad(parent, 'cyl', c) }, p);
      mk('rect', { x: -w / 2 + 2, y: -w / 2 + 10, width: w * .13, height: len + w / 2 - 20, rx: w * .065, fill: RIM.c, opacity: RIM.o * .55 }, p); };
    seg(root, w1, len1, c1);
    const j2 = mk('g', { transform: `translate(0 ${len1})` }, root);
    seg(j2, w2, len2, c2);
    mk('ellipse', { cx: 0, cy: 0, rx: w2 * .55, ry: w2 * .3, fill: grad(parent, 'ao', '#000'), opacity: .5 }, j2);   // crease at the joint
    const end = mk('g', { transform: `translate(0 ${len2})` }, j2);
    endFn(end);
    return { root, j2, end, len1 };
  }

  window.Person = function (parent, o = {}) {
    const P = Object.assign({ skin: '#C98B5E', hair: '#1E1A17', hairStyle: 'short', top: '#3A86FF', topStyle: 'tee',
      stripe: '#FFFFFF', pants: '#1F2A44', shoes: '#F4F4F4', height: 1, lower: 'pants', mundu: '#F6F2E6', kasavu: '#D4A73A',
      mustache: false, iris: '#4A2C1A', rim: '#FFE9C4', rimOpacity: .35 }, o);
    RIM = { c: P.rim, o: P.rimOpacity };
    if (P.lower === 'mundu') P.pants = P.mundu;
    const g = mk('g', {}, parent);
    const shadow = mk('ellipse', { cx: 0, cy: 0, rx: 90, ry: 16, fill: grad(parent, 'ao', '#000'), opacity: 1 }, g);
    const body = mk('g', {}, g);                      // flipped for face
    const hip = mk('g', {}, body);                    // origin = hip joint
    const far = -0.28;                                // far limbs darker
    const shoe = (c) => (e) => { mk('path', { d: 'M-16 -6 Q-18 14 -10 16 L44 16 Q52 16 50 6 Q46 -8 22 -8 L4 -10Z', fill: c }, e);
      mk('rect', { x: -16, y: 12, width: 66, height: 5, rx: 2.5, fill: shade(c, -.35) }, e); };
    const hand = (c) => (e) => { mk('circle', { cx: 0, cy: 4, r: 15, fill: grad(parent, 'sph', c) }, e); mk('path', { d: 'M8 -4 Q16 4 10 14', stroke: shade(c, -.3), 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, e); };
    const legF = limb(hip, 100, 96, 54, 44, shade(P.pants, far), shade(P.pants, far), shoe(shade(P.shoes, far)));
    const armF = limb(hip, 92, 84, 38, 32, shade(P.top, far), shade(P.topStyle === 'tee' ? P.skin : P.top, far), hand(shade(P.skin, far)));
    // torso
    const torso = mk('g', {}, hip);
    mk('path', { d: 'M-42 6 L-46 -118 Q-48 -180 2 -184 Q56 -182 56 -118 L48 6 Z', fill: grad(parent, 'cyl', P.top) }, torso);
    mk('path', { d: 'M-46 -118 Q-48 -180 2 -184 L-6 -176 Q-38 -170 -38 -118 L-34 4 L-42 6Z', fill: P.rim, opacity: P.rimOpacity * .8 }, torso);
    mk('path', { d: 'M-20 -40 Q10 -30 44 -44', stroke: shade(P.top, -.3), 'stroke-width': 3, fill: 'none', opacity: .5 }, torso);   // cloth fold
    mk('ellipse', { cx: 14, cy: -160, rx: 34, ry: 46, fill: grad(parent, 'ao', '#000'), opacity: .55 }, torso);                  // shoulder occlusion
    mk('path', { d: 'M30 -170 Q52 -150 50 -110 L48 -20', stroke: '#fff', 'stroke-width': 6, opacity: .18, fill: 'none', 'stroke-linecap': 'round' }, torso);
    if (P.topStyle !== 'tee') mk('path', { d: 'M8 -178 L8 4', stroke: shade(P.top, -.25), 'stroke-width': 4 }, torso);
    if (P.topStyle === 'tracksuit') {
      mk('path', { d: 'M-30 -150 L-34 0', stroke: P.stripe, 'stroke-width': 7, 'stroke-linecap': 'round' }, torso);
      mk('path', { d: 'M-4 -182 Q10 -168 26 -180', stroke: P.stripe, 'stroke-width': 6, fill: 'none' }, torso);
    } else if (P.topStyle === 'tee') {
      mk('path', { d: 'M-2 -180 Q12 -166 28 -178', stroke: shade(P.top, -.3), 'stroke-width': 5, fill: 'none' }, torso);
    }
    mk('rect', { x: -46, y: -12, width: 96, height: 18, rx: 6, fill: P.pants }, torso);
    // head
    const head = mk('g', { transform: 'translate(6 -205)' }, torso);
    const torsoG = torso;
    mk('rect', { x: -12, y: -6, width: 26, height: 34, rx: 8, fill: grad(parent, 'cyl', shade(P.skin, -.12)) }, head);
    mk('ellipse', { cx: 4, cy: 0, rx: 22, ry: 12, fill: grad(parent, 'ao', '#000'), opacity: .8 }, head);   // jaw shadow on the neck
    const hd = mk('g', { transform: 'translate(2 -70) scale(1.32)' }, head);
    const hairBack = mk('g', {}, hd);
    if (P.hairStyle === 'long') mk('path', { d: 'M-52 -20 Q-60 50 -30 70 L10 66 Q-10 30 -6 -10Z', fill: P.hair }, hairBack);
    if (P.hairStyle === 'bun') mk('circle', { cx: -44, cy: -38, r: 24, fill: P.hair }, hairBack);
    mk('path', { d: 'M-44 -10 Q-48 -58 0 -62 Q46 -60 50 -18 L56 2 Q60 10 52 12 L50 26 Q48 48 22 52 Q-30 58 -44 22Z', fill: grad(parent, 'sph', P.skin) }, hd);
    mk('path', { d: 'M-44 -10 Q-48 -58 0 -62 L-4 -54 Q-38 -50 -38 -10 Q-38 16 -30 34 Q-44 26 -44 -10Z', fill: P.rim, opacity: P.rimOpacity * .7 }, hd);
    mk('path', { d: 'M48 -2 Q40 6 46 12', stroke: shade(P.skin, -.28), 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, hd);   // nose side shade
    mk('path', { d: 'M56 2 Q64 8 56 14', fill: shade(P.skin, -.12) }, hd);       // nose tip
    mk('ellipse', { cx: -14, cy: 4, rx: 10, ry: 14, fill: shade(P.skin, -.12) }, hd); // ear
    mk('ellipse', { cx: 26, cy: 26, rx: 10, ry: 6, fill: '#FF8A80', opacity: .35 }, hd); // cheek
    const eye = mk('g', { transform: 'translate(30 -8)' }, hd);
    const eyeIn = eye;
    mk('ellipse', { cx: 0, cy: 0, rx: 9, ry: 10, fill: '#fff' }, eye);
    const pupil = mk('g', { transform: 'translate(3 1)' }, eye);
    mk('circle', { cx: 0, cy: 0, r: 6, fill: P.iris }, pupil); mk('circle', { cx: 0, cy: 0, r: 3.3, fill: '#0E0B0A' }, pupil); mk('circle', { cx: 2, cy: -2.4, r: 1.9, fill: '#FFF' }, pupil);
    mk('path', { d: 'M-10 -6 Q0 -13 10 -6', stroke: '#2A1A14', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, eye);   // upper lash line
    const lid = mk('rect', { x: -11, y: -12, width: 22, height: 0, fill: P.skin }, eye);
    const brow = mk('path', { d: 'M18 -26 Q30 -32 42 -26', stroke: P.hair, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, hd);
    const mouth = mk('path', { fill: '#5A1E2B', stroke: '#5A1E2B', 'stroke-width': 3, 'stroke-linejoin': 'round' }, hd);
    const hairFront = mk('g', {}, hd);
    const H = {
      short: 'M-48 -6 Q-56 -60 2 -66 Q50 -66 52 -30 Q30 -44 6 -38 Q-10 -30 -22 -6 Q-36 -12 -48 -6Z',
      long: 'M-50 0 Q-58 -64 4 -68 Q54 -66 54 -26 Q30 -44 4 -36 Q-14 -20 -16 10 Q-34 4 -50 0Z',
      buzz: 'M-46 -8 Q-50 -58 2 -62 Q46 -62 50 -32 Q24 -48 -4 -44 Q-26 -36 -46 -8Z',
      side: 'M-48 -4 Q-56 -62 6 -68 Q56 -64 54 -24 Q44 -40 20 -44 L24 -30 Q0 -40 -20 -4 Q-34 -10 -48 -4Z',
      bun: 'M-46 -6 Q-52 -60 4 -64 Q50 -62 52 -30 Q26 -46 0 -40 Q-18 -28 -24 -6 Q-36 -10 -46 -6Z',
    };
    mk('path', { d: H[P.hairStyle] || H.short, fill: grad(parent, 'top', P.hair) }, hairFront);
    mk('path', { d: 'M-20 -54 Q8 -64 34 -52', stroke: '#FFFFFF', 'stroke-width': 5, opacity: .16, fill: 'none', 'stroke-linecap': 'round' }, hairFront);   // shine
    if (P.mustache) mk('path', { d: 'M28 16 Q40 9 54 15 Q50 21 41 19 Q34 21 28 16Z', fill: P.hair }, hd);
    const legN = limb(hip, 100, 96, 54, 44, P.pants, P.pants, shoe(P.shoes));
    // mundu: a wrap cloth from the waist to the ankles that follows the legs, with a gold kasavu border
    let mundu = null, munduBorder = null;
    if (P.lower === 'mundu') { mundu = mk('path', { fill: grad(parent, 'cyl', P.mundu) }, hip); munduBorder = mk('path', { fill: 'none', stroke: P.kasavu, 'stroke-width': 9, 'stroke-linecap': 'round' }, hip);
      mk('rect', { x: -48, y: -14, width: 100, height: 16, rx: 6, fill: shade(P.mundu, -.12) }, hip); }
    const armN = limb(hip, 92, 84, 38, 32, P.top, P.topStyle === 'tee' ? P.skin : P.top, hand(P.skin));
    if (P.topStyle === 'tee') { /* short sleeve: forearm is skin */ }

    const S = { x: 0, y: 0, s: 1, face: 1, walk: 0, run: 0, sit: 0, lean: 0, armN: null, armF: null,
      talk: 0, smile: .6, look: 0, blinkSeed: Math.random() * 10, speed: 1, phase0: 0,
      // v2: IK reach targets {x, y, w} in the PARENT's coordinates (same space as S.x/S.y), head tilt, expressions
      reachN: null, reachF: null, headTilt: 0, surprise: 0, frown: 0, breath: 1, holdN: null, holdF: null };
    const sc = 0.62 * P.height;

    function setLimb(L, x, y, a, k) {  // a = forward angle at root, k = bend at joint (+ = forward)
      L.root.setAttribute('transform', `translate(${x} ${y}) rotate(${-a})`);
      L.j2.setAttribute('transform', `translate(0 ${L.len1}) rotate(${-k})`);
    }

    // two-bone IK: angles (a, k) so the hand lands on (vx, vy) measured from the shoulder in body space
    const L1 = 92, L2 = 88;
    function ik(vx, vy) {
      const d = Math.max(1, Math.min(L1 + L2 - .5, Math.hypot(vx, vy)));
      const phi = Math.atan2(vx, vy);                                   // 0 = straight down, + = forward
      const al = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
      const be = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2))));
      const D = 180 / Math.PI; return [(phi - al) * D, (Math.PI - be) * D];
    }
    function reachAngles(R, shX, hipY, lean) {      // R in parent coords -> angles in body space
      const k = S.s * sc; let lx = (R.x - S.x) / k * S.face, ly = (R.y - S.y) / k;
      ly -= hipY; const r = -(lean) * Math.PI / 180, c = Math.cos(r), s2 = Math.sin(r);
      const ux = lx * c - ly * s2, uy = lx * s2 + ly * c;
      return ik(ux - shX, uy + 166);
    }
    const lim = { N: null, F: null };
    function render(t, mouthOpen = 0) {
      const ph = (t * S.speed * (1.6 + 1.2 * S.run)) * Math.PI * 2 + S.phase0;
      const amp = lerp(26, 46, S.run) * Math.max(S.walk, S.run);
      const sw = Math.sin(ph);
      // legs: walking/running swing, blended with sitting pose
      const kneeN = lerp(8, 70, S.run) * Math.max(0, Math.sin(ph + 1.3)) * Math.max(S.walk, S.run);
      const kneeF = lerp(8, 70, S.run) * Math.max(0, Math.sin(ph + 1.3 + Math.PI)) * Math.max(S.walk, S.run);
      const lN = lerp(amp * sw, 88, S.sit), lF = lerp(-amp * sw, 84, S.sit);
      const kN = lerp(-kneeN, -92, S.sit), kF = lerp(-kneeF, -90, S.sit);
      setLimb(legN, 6, 0, lN, kN); setLimb(legF, -6, 0, lF, kF);
      if (mundu) { const R = Math.PI / 180, ank = (x0, a, k) => [x0 + 100 * Math.sin(a * R) + 96 * Math.sin((a + k) * R), 100 * Math.cos(a * R) + 96 * Math.cos((a + k) * R)];
        const A1 = ank(6, lN, kN), A2 = ank(-6, lF, kF), fr = A1[0] > A2[0] ? A1 : A2, bk = A1[0] > A2[0] ? A2 : A1, by = Math.min(fr[1], bk[1]) - 16;
        const fx = Math.max(fr[0] + 30, 54), bx = Math.min(bk[0] - 30, -50);
        mundu.setAttribute('d', `M-48 -8 L52 -8 Q${fx + 6} ${by * .5} ${fx} ${fr[1] - 16} L${bx} ${bk[1] - 16} Q${bx - 4} ${by * .5} -48 -8Z`);
        munduBorder.setAttribute('d', `M${bx + 4} ${bk[1] - 22} L${fx - 4} ${fr[1] - 22}`); }
      // arms: counter-swing, or explicit pose
      const elb = lerp(14, 85, S.run);
      let aN = S.armN || [-amp * .8 * sw, elb + 6], aF = S.armF || [amp * .8 * sw, elb];
      // body bob + lean, sitting lowers the hips
      const bob = Math.max(S.walk, S.run) * lerp(5, 12, S.run) * (1 - Math.cos(2 * ph)) / 2;
      const hipY = -205 * 1 + lerp(0, 92, S.sit) + bob, lean = S.lean + 10 * S.run;
      const mix = (A, B, w) => [lerp(A[0], B[0], w), lerp(A[1], B[1], w)];
      if (S.reachN && S.reachN.w > 0) aN = mix(aN, reachAngles(S.reachN, 12, hipY, lean), Math.min(1, S.reachN.w));
      if (S.reachF && S.reachF.w > 0) aF = mix(aF, reachAngles(S.reachF, -6, hipY, lean), Math.min(1, S.reachF.w));
      setLimb(armN, 12, -166, aN[0], aN[1]); setLimb(armF, -6, -166, aF[0], aF[1]);
      lim.N = aN; lim.F = aF;
      // held objects stay upright: cancel the arm's rotation inside the hand
      [['N', armN, aN, S.holdN], ['F', armF, aF, S.holdF]].forEach(([, L, A, H]) => { if (H) H.setAttribute('transform', `rotate(${(A[0] + A[1] - lean) * 1})`); });
      hip.setAttribute('transform', `translate(0 ${hipY}) rotate(${lean})`);
      // breathing: tiny chest rise, so still characters never look frozen
      torsoG.setAttribute('transform', `translate(0 ${-1.5 * S.breath * Math.sin(t * 2.1 + S.blinkSeed)})`);
      head.setAttribute('transform', `translate(6 -205) rotate(${S.headTilt})`);
      body.setAttribute('transform', `scale(${S.face} 1)`);
      g.setAttribute('transform', `translate(${S.x} ${S.y}) scale(${S.s * sc})`);
      shadow.setAttribute('rx', 70 - bob * 2);
      // face: blink, look, mouth
      const bt = (t + S.blinkSeed) % 3.9, bl = bt < .14 ? Math.sin(bt / .14 * Math.PI) : 0;
      lid.setAttribute('height', 24 * bl * (1 - S.surprise * .7));
      eyeIn.setAttribute('transform', `translate(30 -8) scale(${1 + .35 * S.surprise})`);
      pupil.setAttribute('transform', `translate(${3 + 2.5 * S.look} 1)`);
      const open = Math.max(0, Math.min(1, mouthOpen * S.talk));
      if (S.surprise > .3 && open <= .05) {
        const r = 4 + 7 * S.surprise; mouth.setAttribute('d', `M${34 - r * .7} 30 a${r * .7} ${r} 0 1 0 ${r * 1.4} 0 a${r * .7} ${r} 0 1 0 ${-r * 1.4} 0Z`);
      } else if (open > .05) {
        const h = 4 + 16 * open;
        mouth.setAttribute('d', `M24 ${24} Q36 ${22} 46 ${23} Q44 ${24 + h} 34 ${24 + h} Q26 ${24 + h} 24 24Z`);
      } else {
        const c = 4 + 8 * S.smile;
        mouth.setAttribute('d', `M26 26 Q36 ${26 + c} 46 24 Q36 ${27 + c * .6} 26 26Z`);
      }
      brow.setAttribute('transform', `translate(0 ${-3 * open - 10 * S.surprise + 4 * S.frown}) rotate(${12 * S.frown - 6 * S.surprise} 30 -28)`);
    }
    // attach an SVG group to a hand ('N' near, 'F' far); it follows the hand and stays upright
    function hold(obj, side = 'N') { const L = side === 'N' ? armN : armF; const w = mk('g', {}, L.end); w.appendChild(obj); S['hold' + side] = w; return w; }
    function release(side = 'N') { const w = S['hold' + side]; S['hold' + side] = null; return w; }
    // where a hand is, in the coordinates of any other group (for handing objects between people)
    function handIn(target, side = 'N') { const L = side === 'N' ? armN : armF; const m = target.getCTM().inverse().multiply(L.end.getCTM());
      return [m.e + m.c * 4, m.f + m.d * 4]; }
    return { g, S, render, P, hold, release, handIn, head };
  };
})();
