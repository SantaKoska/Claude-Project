/* batter2d.js: a 2.5D batter drawn in SVG, with a real photo cut-out as the head (owner's request, 25 Nov 2026).
 *
 *   const b = Batter(svgGroup, { head: 'build/svphotos/head.png', left: true });
 *   b.S = { x, y, s, swing, celebrate, look }   // swing: whole number = shots played; the fraction is the phase of the current shot
 *   b.render()                                  // call every frame; same S -> same picture (time-only render)
 *   b.impactPhase                               // phase (0..1) at which bat meets ball, for timing the hit sound
 *
 * Local units: feet at (0, 0), head top at y = -1000. Faces the camera; the bat swings across the body (a lofted six),
 * a red ball comes in low from the right and leaves high over the left shoulder with a glowing trail.
 * Shading: cylinder gradients on limbs and torso, sphere gradients on gloves, a soft contact shadow, floodlight rim.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const ss = u => u * u * (3 - 2 * u), cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u;
  let N = 0;

  // pose keys: [phase, hand x, hand y, bat angle (deg, 0 = pointing right, 90 = down), body lean (deg)]
  const K = [[0, 40, -530, 96, 0], [.3, 150, -800, -100, -5], [.4, 125, -700, -40, -3], [.5, -10, -520, 160, 4], [.66, -170, -870, 300, 8], [.8, -170, -870, 300, 8], [1, 40, -530, 456, 0]];
  const IMPACT = .5;
  function pose(u) { for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i], v = (u - a[0]) / (b[0] - a[0]), e = i === 3 ? v * v : ss(v); return [1, 2, 3, 4].map(j => lerp(a[j], b[j], e)); } return K[0].slice(1); }

  function Batter(parent, o = {}) {
    const id = 'bt' + (N++), svg = parent.ownerSVGElement || parent, D = svg.querySelector('defs') || mk('defs', {}, svg);
    const lin = (nm, stops, x2 = 1, y2 = 0) => { const g = mk('linearGradient', { id: id + nm, x1: 0, y1: 0, x2, y2 }, D); stops.forEach(([of, c]) => mk('stop', { offset: of, 'stop-color': c }, g)); return `url(#${id + nm})`; };
    const rad = (nm, stops) => { const g = mk('radialGradient', { id: id + nm, cx: .62, cy: .35, r: .75 }, D); stops.forEach(([of, c, op]) => mk('stop', { offset: of, 'stop-color': c, 'stop-opacity': op ?? 1 }, g)); return `url(#${id + nm})`; };
    const G = {
      jersey: lin('j', [[0, '#0B2A66'], [.25, '#1846A0'], [.6, '#2A63C8'], [.85, '#1D4FAE'], [1, '#0E2F72']]),
      white: lin('w', [[0, '#9AA3AE'], [.25, '#DADDE2'], [.6, '#FAFAF8'], [.85, '#E6E8EB'], [1, '#A9B0B9']]),
      pad: lin('p', [[0, '#A7AEB8'], [.2, '#E3E6EA'], [.55, '#FFFFFF'], [.85, '#E9EBEE'], [1, '#B3B9C2']]),
      willow: lin('b', [[0, '#B48A50'], [.35, '#E8CF9C'], [.7, '#F3E1B8'], [1, '#C59D62']], 0, 1),
      glove: rad('g', [[0, '#FFFFFF'], [.6, '#E4E7EC'], [1, '#9EA6B2']]),
      shoe: rad('s', [[0, '#5A5F68'], [1, '#14171C']]),
      shadow: rad('sh', [[0, '#000', .55], [1, '#000', 0]]),
      ball: rad('ba', [[0, '#FF8A70'], [.5, '#C8141E'], [1, '#5A0508']]),
      trail: lin('tr', [[0, '#FFB15A'], [1, '#FFB15A']]),
    };
    mk('stop', {}, D); // keep defs non-empty for old renderers
    const root = mk('g', {}, parent), flip = mk('g', {}, root);
    mk('ellipse', { cx: 0, cy: 6, rx: 230, ry: 34, fill: G.shadow }, flip);
    const body = mk('g', {}, flip);

    // legs (static stance, front knee slightly bent): thigh in whites, pad on the shin, shoe
    const leg = (hx, kx, ax) => { const g = mk('g', {}, body);
      mk('path', { d: `M${hx - 44} -480 L${hx + 44} -480 L${kx + 40} -250 L${kx - 40} -250 Z`, fill: G.white }, g);
      const pg = mk('g', { transform: `translate(${(kx + ax) / 2} -150) rotate(${Math.atan2(ax - kx, 230) * -57.3})` }, g);
      mk('rect', { x: -46, y: -125, width: 92, height: 235, rx: 22, fill: G.pad }, pg);
      for (const dx of [-24, 0, 24]) mk('rect', { x: dx - 4, y: -110, width: 8, height: 205, rx: 4, fill: '#C9CFD7', opacity: .75 }, pg);
      mk('ellipse', { cx: 0, cy: -118, rx: 46, ry: 26, fill: G.pad }, pg);
      mk('ellipse', { cx: ax + 10, cy: -18, rx: 62, ry: 26, fill: G.shoe }, g); mk('rect', { x: ax - 52, y: -12, width: 124, height: 10, rx: 5, fill: '#EDEFF2' }, g);
      return g; };
    leg(-58, -84, -102); leg(58, 96, 124);
    // trousers seat + belt line
    mk('path', { d: 'M-100 -500 Q0 -520 100 -500 L106 -430 Q0 -410 -106 -430 Z', fill: G.white }, body);
    // torso: jersey with orange shoulder piping, a V collar and "INDIA" across the chest
    mk('path', { d: 'M-128 -772 Q-60 -800 -36 -796 L0 -742 L36 -796 Q60 -800 128 -772 Q150 -740 140 -700 L104 -690 Q96 -600 98 -490 Q0 -470 -98 -490 Q-96 -600 -104 -690 L-140 -700 Q-150 -740 -128 -772 Z', fill: G.jersey }, body);
    mk('path', { d: 'M-128 -772 Q-60 -800 -36 -796 M36 -796 Q60 -800 128 -772', stroke: '#FF8A1E', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, body);
    mk('path', { d: 'M-36 -796 L0 -742 L36 -796', stroke: '#FF8A1E', 'stroke-width': 6, fill: 'none', 'stroke-linejoin': 'round' }, body);
    const t = mk('text', { x: 0, y: -650, 'font-size': 40, 'font-family': 'Inter', 'font-weight': 900, fill: '#FFFFFF', 'text-anchor': 'middle', 'letter-spacing': 3, opacity: .92 }, body); t.textContent = 'INDIA'; if (o.left) t.setAttribute('transform', 'scale(-1 1)');
    mk('path', { d: 'M126 -770 Q146 -740 138 -702', stroke: '#BFD6FF', 'stroke-width': 5, fill: 'none', opacity: .45 }, body); // floodlight rim
    // head: the real photo cut-out (neck tucks under the collar)
    const headG = mk('g', {}, flip); const HS = o.headScale || 1.3, HW = 164 * HS, HH = 238 * HS; // a slightly big head so the real face reads at reel size
    mk('image', { href: o.head, x: -HW / 2, y: -778 - HH * .979, width: HW, height: HH, preserveAspectRatio: 'xMidYMid meet', transform: o.left ? 'scale(-1 1)' : '' }, headG);
    body.parentNode.insertBefore(headG, body); // behind the collar
    // bat, then arms and gloves in front of it
    const bat = mk('g', {}, flip);
    mk('rect', { x: -46, y: -10, width: 150, height: 20, rx: 9, fill: '#24272C' }, bat);
    for (let k = 0; k < 7; k++) mk('rect', { x: -38 + k * 19, y: -10, width: 5, height: 20, fill: '#3B4048' }, bat);
    mk('path', { d: 'M100 -14 Q118 -26 140 -27 L420 -30 Q446 -30 448 0 Q446 30 420 30 L140 27 Q118 26 100 14 Z', fill: G.willow, stroke: '#9C7A45', 'stroke-width': 2 }, bat);
    mk('rect', { x: 150, y: -22, width: 70, height: 44, rx: 6, fill: '#1846A0', opacity: .9 }, bat); mk('rect', { x: 150, y: -6, width: 70, height: 12, fill: '#FF8A1E' }, bat);
    mk('path', { d: 'M150 -24 L430 -26', stroke: '#FFF6E0', 'stroke-width': 4, opacity: .7 }, bat);
    const blur = mk('path', { fill: '#FFF4DC', opacity: 0 }, flip); bat.parentNode.insertBefore(blur, bat);
    const armG = mk('g', {}, flip);
    const arm = () => { const g = mk('g', {}, armG); return { sk: mk('path', { fill: 'none', stroke: '#9A6A48', 'stroke-width': 44, 'stroke-linecap': 'round' }, g), up: mk('path', { fill: 'none', stroke: '#1846A0', 'stroke-width': 58, 'stroke-linecap': 'round' }, g), upH: mk('path', { fill: 'none', stroke: '#3D78DA', 'stroke-width': 16, 'stroke-linecap': 'round', opacity: .7 }, g),
      fo: mk('path', { fill: 'none', stroke: '#9A6A48', 'stroke-width': 40, 'stroke-linecap': 'round' }, g), foH: mk('path', { fill: 'none', stroke: '#C08A63', 'stroke-width': 12, 'stroke-linecap': 'round', opacity: .8 }, g),
      gl: mk('circle', { r: 31, fill: G.glove, stroke: '#1846A0', 'stroke-width': 6 }, g) }; };
    const A1 = arm(), A2 = arm();
    // the ball and its trail
    const ballG = mk('g', {}, flip), trail = mk('path', { fill: 'none', stroke: '#FFB15A', 'stroke-width': 18, 'stroke-linecap': 'round', opacity: .0 }, ballG);
    const glow = mk('circle', { r: 46, fill: '#FFC98A', opacity: 0 }, ballG), ball = mk('circle', { r: 20, fill: G.ball }, ballG);
    const flash = mk('circle', { r: 10, fill: '#FFFFFF', opacity: 0 }, flip);

    const S = { x: 540, y: 1300, s: .7, swing: 0, celebrate: 0, look: 0 };
    const SL = [-118, -752], SR = [118, -752], L1 = 150, L2 = 158;
    const elbow = (sx, sy, hx, hy, bend) => { let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy); const dd = Math.min(d, L1 + L2 - 1); const a = Math.acos(cl((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1)); const b = Math.atan2(dy, dx) + bend * a; return [sx + Math.cos(b) * L1, sy + Math.sin(b) * L1, sx + dx / d * dd, sy + dy / d * dd]; };
    const setArm = (A, s, hx, hy, bend) => { const [ex, ey, hx2, hy2] = elbow(s[0], s[1], hx, hy, bend); const u = `M${s[0]} ${s[1]} L${ex.toFixed(1)} ${ey.toFixed(1)}`, f = `M${ex.toFixed(1)} ${ey.toFixed(1)} L${hx2.toFixed(1)} ${hy2.toFixed(1)}`;
      const mx = s[0] + (ex - s[0]) * .55, my = s[1] + (ey - s[1]) * .55; A.sk.setAttribute('d', u);
      A.up.setAttribute('d', `M${s[0]} ${s[1]} L${mx.toFixed(1)} ${my.toFixed(1)}`); A.upH.setAttribute('d', `M${s[0] + 10} ${s[1] - 6} L${(mx + 10).toFixed(1)} ${(my - 6).toFixed(1)}`); A.fo.setAttribute('d', f); A.foH.setAttribute('d', `M${(ex + 8).toFixed(1)} ${(ey - 5).toFixed(1)} L${(hx2 + 8).toFixed(1)} ${(hy2 - 5).toFixed(1)}`);
      A.gl.setAttribute('cx', hx2.toFixed(1)); A.gl.setAttribute('cy', hy2.toFixed(1)); };

    function render() {
      flip.setAttribute('transform', o.left ? 'scale(-1 1)' : '');
      root.setAttribute('transform', `translate(${S.x} ${S.y}) scale(${S.s})`);
      const n = Math.floor(S.swing), u = S.swing > 0 ? S.swing - n : 0;
      let [hx, hy, phi, lean] = pose(u);
      // celebrate: bat raised in one hand beside the head, the other arm down in a fist
      const c = ss(cl(S.celebrate)); hx = lerp(hx, -200, c); hy = lerp(hy, -1030, c); phi = lerp(phi > 200 ? phi - 360 : phi, -88, c); lean = lerp(lean, 0, c);
      body.setAttribute('transform', `rotate(${lean.toFixed(2)} 0 -470)`);
      headG.setAttribute('transform', `rotate(${(lean * .6 + S.look * 6).toFixed(2)} 0 -800) translate(${(lean * 2).toFixed(1)} 0)`);
      const r = phi * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r);
      bat.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${phi.toFixed(2)})`);
      setArm(A1, SL, hx, hy, 1); setArm(A2, SR, lerp(hx + ux * 50, 190, c), lerp(hy + uy * 50, -560, c), -1);
      // ball: in from low right to the sweet spot, then out high over the left shoulder
      const sx = -10 + Math.cos(160 * Math.PI / 180) * 300, sy = -520 + Math.sin(160 * Math.PI / 180) * 300, inn = (u - .36) / (IMPACT - .36), outv = (u - IMPACT) / .3;
      let bx = 0, by = 0, bs = 0, tr = 0;
      if (S.swing > 0 && c < .5 && inn >= 0 && inn < 1) { const e = inn; bx = lerp(520, sx, e); by = lerp(-300, sy, e) - Math.sin(e * Math.PI) * 60; bs = .8 + .2 * e; }
      else if (S.swing > 0 && c < .5 && outv >= 0 && outv < 1) { const e = 1 - Math.pow(1 - outv, 2); bx = lerp(sx, -900 + (n % 3) * 260, e); by = lerp(sy, -1700 - (n % 2) * 200, e); bs = 1 - .5 * e; tr = 1 - outv;
        trail.setAttribute('d', `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${((sx + bx) / 2 - 40).toFixed(1)} ${((sy + by) / 2 + 60).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`); }
      ball.setAttribute('cx', bx.toFixed(1)); ball.setAttribute('cy', by.toFixed(1)); ball.setAttribute('r', (20 * bs).toFixed(1)); ballG.setAttribute('opacity', bs > 0 ? 1 : 0);
      glow.setAttribute('cx', bx.toFixed(1)); glow.setAttribute('cy', by.toFixed(1)); glow.setAttribute('opacity', (tr * .35).toFixed(3)); trail.setAttribute('opacity', (tr * .55).toFixed(3));
      const fl = S.swing > 0 && c < .5 ? cl(1 - Math.abs(u - IMPACT) / .04) : 0; flash.setAttribute('cx', sx.toFixed(1)); flash.setAttribute('cy', sy.toFixed(1)); flash.setAttribute('r', (14 + 34 * fl).toFixed(1)); flash.setAttribute('opacity', (fl * .85).toFixed(3));
      // swing blur: a pale wedge from where the bat toe was a moment ago to where it is now (fast part of the swing only)
      const bw = S.swing > 0 && c < .5 && u > .41 && u < .56 ? cl(1 - Math.abs(u - .48) / .08) : 0; blur.setAttribute('opacity', (bw * .32).toFixed(3));
      if (bw > 0) { const q = pose(Math.max(.4, u - .05)), qr = q[2] * Math.PI / 180; blur.setAttribute('d', `M${(hx + ux * 100).toFixed(1)} ${(hy + uy * 100).toFixed(1)} L${(q[0] + Math.cos(qr) * 440).toFixed(1)} ${(q[1] + Math.sin(qr) * 440).toFixed(1)} L${(hx + ux * 440).toFixed(1)} ${(hy + uy * 440).toFixed(1)} Z`); }
    }
    render();
    return { S, render, root, impactPhase: IMPACT };
  }
  window.Batter = Batter;
})();
