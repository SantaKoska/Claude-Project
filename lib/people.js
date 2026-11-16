/* people.js — reusable flat-vector character rig (side profile), drawn in SVG.
 *
 *   const p = Person(parentG, { skin, hair, hairStyle, top, topStyle, stripe, pants, shoes, height });
 *   p.S = { x, y, s, face: 1|-1, walk, run, sit, lean, armN:[a,e], armF:[a,e], talk, smile, look, blinkSeed }
 *   p.render(t, mouthOpen)   // call every frame (time-only: same t → same picture)
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

  function limb(parent, len1, len2, w1, w2, c1, c2, endFn) {
    const root = mk('g', {}, parent);
    mk('rect', { x: -w1 / 2, y: -w1 / 2, width: w1, height: len1 + w1 / 2, rx: w1 / 2, fill: c1 }, root);
    const j2 = mk('g', { transform: `translate(0 ${len1})` }, root);
    mk('rect', { x: -w2 / 2, y: -w2 / 2, width: w2, height: len2 + w2 / 2, rx: w2 / 2, fill: c2 }, j2);
    const end = mk('g', { transform: `translate(0 ${len2})` }, j2);
    endFn(end);
    return { root, j2, end, len1 };
  }

  window.Person = function (parent, o = {}) {
    const P = Object.assign({ skin: '#C98B5E', hair: '#1E1A17', hairStyle: 'short', top: '#3A86FF', topStyle: 'tee',
      stripe: '#FFFFFF', pants: '#1F2A44', shoes: '#F4F4F4', height: 1 }, o);
    const g = mk('g', {}, parent);
    const shadow = mk('ellipse', { cx: 0, cy: 0, rx: 70, ry: 12, fill: '#000', opacity: .25 }, g);
    const body = mk('g', {}, g);                      // flipped for face
    const hip = mk('g', {}, body);                    // origin = hip joint
    const far = -0.28;                                // far limbs darker
    const shoe = (c) => (e) => { mk('path', { d: 'M-16 -6 Q-18 14 -10 16 L44 16 Q52 16 50 6 Q46 -8 22 -8 L4 -10Z', fill: c }, e);
      mk('rect', { x: -16, y: 12, width: 66, height: 5, rx: 2.5, fill: shade(c, -.35) }, e); };
    const hand = (c) => (e) => mk('circle', { cx: 0, cy: 4, r: 15, fill: c }, e);
    const legF = limb(hip, 100, 96, 54, 44, shade(P.pants, far), shade(P.pants, far), shoe(shade(P.shoes, far)));
    const armF = limb(hip, 92, 84, 38, 32, shade(P.top, far), shade(P.topStyle === 'tee' ? P.skin : P.top, far), hand(shade(P.skin, far)));
    // torso
    const torso = mk('g', {}, hip);
    mk('path', { d: 'M-42 6 L-46 -118 Q-48 -180 2 -184 Q56 -182 56 -118 L48 6 Z', fill: P.top }, torso);
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
    mk('rect', { x: -12, y: -6, width: 26, height: 34, rx: 8, fill: shade(P.skin, -.12) }, head);
    const hd = mk('g', { transform: 'translate(2 -70) scale(1.32)' }, head);
    const hairBack = mk('g', {}, hd);
    if (P.hairStyle === 'long') mk('path', { d: 'M-52 -20 Q-60 50 -30 70 L10 66 Q-10 30 -6 -10Z', fill: P.hair }, hairBack);
    if (P.hairStyle === 'bun') mk('circle', { cx: -44, cy: -38, r: 24, fill: P.hair }, hairBack);
    mk('path', { d: 'M-44 -10 Q-48 -58 0 -62 Q46 -60 50 -18 L56 2 Q60 10 52 12 L50 26 Q48 48 22 52 Q-30 58 -44 22Z', fill: P.skin }, hd);
    mk('path', { d: 'M56 2 Q64 8 56 14', fill: shade(P.skin, -.12) }, hd);       // nose tip
    mk('ellipse', { cx: -14, cy: 4, rx: 10, ry: 14, fill: shade(P.skin, -.12) }, hd); // ear
    mk('ellipse', { cx: 26, cy: 26, rx: 10, ry: 6, fill: '#FF8A80', opacity: .35 }, hd); // cheek
    const eye = mk('g', { transform: 'translate(30 -8)' }, hd);
    mk('ellipse', { cx: 0, cy: 0, rx: 9, ry: 10, fill: '#fff' }, eye);
    const pupil = mk('circle', { cx: 3, cy: 1, r: 5.5, fill: '#1B1B24' }, eye);
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
    mk('path', { d: H[P.hairStyle] || H.short, fill: P.hair }, hairFront);
    const legN = limb(hip, 100, 96, 54, 44, P.pants, P.pants, shoe(P.shoes));
    const armN = limb(hip, 92, 84, 38, 32, P.top, P.topStyle === 'tee' ? P.skin : P.top, hand(P.skin));
    if (P.topStyle === 'tee') { /* short sleeve: forearm is skin */ }

    const S = { x: 0, y: 0, s: 1, face: 1, walk: 0, run: 0, sit: 0, lean: 0, armN: null, armF: null,
      talk: 0, smile: .6, look: 0, blinkSeed: Math.random() * 10, speed: 1, phase0: 0 };
    const sc = 0.62 * P.height;

    function setLimb(L, x, y, a, k) {  // a = forward angle at root, k = bend at joint (+ = forward)
      L.root.setAttribute('transform', `translate(${x} ${y}) rotate(${-a})`);
      L.j2.setAttribute('transform', `translate(0 ${L.len1}) rotate(${-k})`);
    }

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
      // arms: counter-swing, or explicit pose
      const elb = lerp(14, 85, S.run);
      const aN = S.armN || [-amp * .8 * sw, elb + 6], aF = S.armF || [amp * .8 * sw, elb];
      setLimb(armN, 12, -166, aN[0], aN[1]); setLimb(armF, -6, -166, aF[0], aF[1]);
      // body bob + lean, sitting lowers the hips
      const bob = Math.max(S.walk, S.run) * lerp(5, 12, S.run) * (1 - Math.cos(2 * ph)) / 2;
      const hipY = -205 * 1 + lerp(0, 92, S.sit) + bob;
      hip.setAttribute('transform', `translate(0 ${hipY}) rotate(${S.lean + 10 * S.run})`);
      body.setAttribute('transform', `scale(${S.face} 1)`);
      g.setAttribute('transform', `translate(${S.x} ${S.y}) scale(${S.s * sc})`);
      shadow.setAttribute('rx', 70 - bob * 2);
      // face: blink, look, mouth
      const bt = (t + S.blinkSeed) % 3.9, bl = bt < .14 ? Math.sin(bt / .14 * Math.PI) : 0;
      lid.setAttribute('height', 24 * bl);
      pupil.setAttribute('cx', 3 + 2.5 * S.look);
      const open = Math.max(0, Math.min(1, mouthOpen * S.talk));
      if (open > .05) {
        const h = 4 + 16 * open;
        mouth.setAttribute('d', `M24 ${24} Q36 ${22} 46 ${23} Q44 ${24 + h} 34 ${24 + h} Q26 ${24 + h} 24 24Z`);
      } else {
        const c = 4 + 8 * S.smile;
        mouth.setAttribute('d', `M26 26 Q36 ${26 + c} 46 24 Q36 ${27 + c * .6} 26 26Z`);
      }
      brow.setAttribute('transform', `translate(0 ${-4 * S.smile * 0 - 3 * open})`);
    }
    return { g, S, render, P };
  };
})();
