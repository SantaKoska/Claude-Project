/* watch3d.js - a real-3D watch built in three.js (r160, vendor/three.min.js), time-only.
 *
 *   const W = Watch3D(canvas);           // 1080x1920 WebGL canvas
 *   W.ST ...                             // state object (tween it with GSAP)
 *   W.setRate([[t, rate], ...])          // watch clock speed over time (1 = real time, .15 = slow motion)
 *   W.render(t)                          // draw frame t (pure function of t + ST)
 *
 * Parts: exterior watch (case, dial, hands, case back), a hand-wound / automatic movement
 * (mainspring barrel, gear train with real ratios, escape wheel, pallet fork, balance wheel and hairspring,
 * rotor) and a quartz module (battery, circuit, quartz tuning fork, stepper motor), plus a hero crystal.
 * One clock drives everything: the balance swings at 4 Hz (28,800 beats/hour), the pallet fork rocks with it,
 * the escape wheel steps once per beat and every wheel follows by its ratio, so nothing on screen disagrees.
 */
(function () {
  const T = window.THREE;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- geometry helpers
  function gearGeo(n, R, o = {}) {
    const depth = o.depth ?? Math.max(.18, R * .09), tip = o.tip ?? .26, thick = o.thick ?? .5;
    const s = new T.Shape(), step = TAU / n, r0 = R - depth;
    for (let i = 0; i < n; i++) {
      const a = i * step;
      const pts = [[r0, a], [R, a + step * (.5 - tip) / 2 + step * .05], [R, a + step * (.5 + tip) / 2 - step * .05], [r0, a + step * .5]];
      pts.forEach(([r, aa], k) => { const x = r * Math.cos(aa), y = r * Math.sin(aa); (i === 0 && k === 0) ? s.moveTo(x, y) : s.lineTo(x, y); });
      s.lineTo(r0 * Math.cos(a + step), r0 * Math.sin(a + step));
    }
    if (o.hole) { const h = new T.Path(); h.absarc(0, 0, o.hole, 0, TAU, true); s.holes.push(h); }
    if (o.spokes) {
      const rIn = r0 - R * .14, rHub = (o.hole || .3) + R * .2, k = o.spokes, w = .22 / Math.max(1, R * .4);
      for (let i = 0; i < k; i++) {
        const a1 = i * TAU / k + w + .12, a2 = (i + 1) * TAU / k - w - .12, h = new T.Path();
        h.absarc(0, 0, rIn, a1, a2, false); h.lineTo(rHub * Math.cos(a2), rHub * Math.sin(a2)); h.absarc(0, 0, rHub, a2, a1, true); h.closePath(); s.holes.push(h);
      }
    }
    const g = new T.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: .04, bevelSize: .03, bevelSegments: 1, curveSegments: 10 });
    g.rotateX(-Math.PI / 2); return g;
  }
  function ringGeo(R, r, thick) { const s = new T.Shape(); s.absarc(0, 0, R, 0, TAU, false); const h = new T.Path(); h.absarc(0, 0, r, 0, TAU, true); s.holes.push(h);
    const g = new T.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 64 }); g.rotateX(-Math.PI / 2); return g; }
  // vertical ribbon spiral (mainspring, hairspring); positions are rewritten in place by setSpiral
  function spiralMesh(N, mat) { const pos = new Float32Array((N + 1) * 2 * 3), idx = [];
    for (let k = 0; k < N; k++) { const a = k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx); const m = new T.Mesh(g, mat); m.userData.N = N; return m; }
  function setSpiral(m, rIn, rOut, turns, h, phase = 0) { const N = m.userData.N, p = m.geometry.attributes.position.array;
    for (let k = 0; k <= N; k++) { const u = k / N, a = phase + u * turns * TAU, r = rIn + (rOut - rIn) * Math.pow(u, .9), x = r * Math.cos(a), z = r * Math.sin(a);
      p.set([x, 0, z, x, h, z], k * 6); }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); }
  const cyl = (r, h, mat, seg = 40) => new T.Mesh(new T.CylinderGeometry(r, r, h, seg), mat);
  const box = (x, y, z, mat) => new T.Mesh(new T.BoxGeometry(x, y, z), mat);
  function glowTex(c1, c2) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, c1); g.addColorStop(.35, c2); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; }

  window.Watch3D = function (canvas) {
    const R = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.setSize(1080, 1920, false);
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .82; R.outputColorSpace = T.SRGBColorSpace;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene(); const BG = new T.Color('#DCD3C6'); scene.background = BG;
    const cam = new T.PerspectiveCamera(30, 1080 / 1920, .1, 600);

    // studio environment for reflections: a light room with soft boxes, prefiltered once
    const studio = new T.Scene(); studio.background = new T.Color('#5E5A55');
    const emis = (c, i) => new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(i) });
    [[0, 60, 0, 120, 4, 120, '#FFFFFF', 3], [-70, 20, 0, 4, 60, 100, '#FFE8CC', 2.2], [70, 25, 20, 4, 50, 60, '#DDEBFF', 2.5], [0, 10, -70, 100, 30, 4, '#FFFFFF', 1.4]].forEach(([x, y, z, sx, sy, sz, c, i]) => { const b = new T.Mesh(new T.BoxGeometry(sx, sy, sz), emis(c, i)); b.position.set(x, y, z); studio.add(b); });
    const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(studio, .03).texture; scene.environmentIntensity = .75;

    const hemi = new T.HemisphereLight('#FFF6EA', '#8C8378', .5); scene.add(hemi);
    const key = new T.DirectionalLight('#FFFFFF', 2.4); key.position.set(18, 40, 22); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 }); key.shadow.bias = -.0004; key.shadow.radius = 6; scene.add(key);
    const rim = new T.DirectionalLight('#BFD8FF', 1.2); rim.position.set(-25, 18, -30); scene.add(rim);
    const floor = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: '#E2DACD', roughness: 1, metalness: 0 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -6; floor.receiveShadow = true; scene.add(floor);

    // ---------------------------------------------------------------- materials
    const M = {
      steel: new T.MeshStandardMaterial({ color: '#BFC6CE', metalness: 1, roughness: .26 }),
      steelD: new T.MeshStandardMaterial({ color: '#9AA3AD', metalness: 1, roughness: .4 }),
      plate: new T.MeshStandardMaterial({ color: '#AEB5BD', metalness: 1, roughness: .42 }),
      gold: new T.MeshStandardMaterial({ color: '#D49A2E', metalness: 1, roughness: .28 }),
      brass: new T.MeshStandardMaterial({ color: '#C99A45', metalness: 1, roughness: .36 }),
      ruby: new T.MeshStandardMaterial({ color: '#C2185B', metalness: .1, roughness: .15, emissive: '#5A0020', emissiveIntensity: .4 }),
      blue: new T.MeshStandardMaterial({ color: '#2F55C8', metalness: .9, roughness: .3, side: T.DoubleSide }),
      spring: new T.MeshStandardMaterial({ color: '#B8C4D0', metalness: 1, roughness: .25, side: T.DoubleSide }),
      dial: new T.MeshStandardMaterial({ color: '#0F2748', metalness: .25, roughness: .45 }),
      white: new T.MeshStandardMaterial({ color: '#F4F1EA', metalness: .2, roughness: .3 }),
      accent: new T.MeshStandardMaterial({ color: '#FF6B2C', metalness: .3, roughness: .4 }),
      leather: new T.MeshStandardMaterial({ color: '#6B3E22', metalness: 0, roughness: .7 }),
      pcb: new T.MeshStandardMaterial({ color: '#145A3C', metalness: .1, roughness: .6 }),
      chip: new T.MeshStandardMaterial({ color: '#141414', metalness: .2, roughness: .4 }),
      copper: new T.MeshStandardMaterial({ color: '#C8743A', metalness: 1, roughness: .3 }),
      fork: new T.MeshStandardMaterial({ color: '#E8D6A8', metalness: .5, roughness: .22, emissive: '#FF9A2A', emissiveIntensity: 0 }),
      hot: new T.MeshStandardMaterial({ color: '#FF8A3D', metalness: .6, roughness: .3, emissive: '#FF6B2C', emissiveIntensity: 1 }),
    };
    const shadowAll = g => g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // ---------------------------------------------------------------- the movement (top view in the XZ plane, Y up)
    const mech = new T.Group(); scene.add(mech);
    const plateG = new T.Group(); mech.add(plateG);
    const plate = cyl(15.5, 1.2, M.plate, 96); plate.position.y = -.6; plateG.add(plate);
    // perlage-ish rings on the plate
    for (let i = 0; i < 9; i++) { const rr = new T.Mesh(new T.TorusGeometry(2 + i * 1.5, .04, 6, 96), M.steelD); rr.rotation.x = Math.PI / 2; rr.position.y = .02; plateG.add(rr); }
    const P = (x, z) => new T.Vector3(x, 0, z);
    // chain the wheels so each one really meshes with the next pinion
    const chain = []; let at = P(-6.5, -5.5);
    const spec = [ // name, wheel teeth, wheel R, pinion R, direction to next (deg), y level
      ['barrel', 72, 5.4, 0, 18, 0], ['center', 64, 4.0, 1.05, -40, 1.0], ['third', 60, 3.5, .9, 30, 2.0], ['fourth', 56, 3.1, .82, 80, 1.0], ['escape', 15, 2.1, .75, 120, 2.0]];
    spec.forEach(([name, n, Rw, rp, dir, y], i) => {
      const g = new T.Group(); g.position.copy(at); g.position.y = y; mech.add(g);
      const wheel = new T.Mesh(gearGeo(n, Rw, { hole: .3, spokes: name === 'barrel' ? 0 : (name === 'escape' ? 0 : 4), thick: name === 'barrel' ? .6 : .32, tip: name === 'escape' ? .1 : .26, depth: name === 'escape' ? .55 : undefined }), name === 'escape' ? M.steel : M.gold);
      g.add(wheel);
      if (rp) { const pin = new T.Mesh(gearGeo(8, rp, { thick: 1.0, tip: .3, depth: .22 }), M.steel); pin.position.y = -1.0; g.add(pin); }
      const arbor = cyl(.22, 3.6, M.steel, 16); arbor.position.y = .2; g.add(arbor);
      const jewel = cyl(.55, .2, M.ruby, 24); jewel.position.y = -y - .02 + .02; jewel.position.y = -y + .02; g.add(jewel);
      chain.push({ name, g, wheel, n, Rw, rp });
      const nx = spec[i + 1]; if (nx) { const d = Rw + nx[3] + .05, a = dir * Math.PI / 180; at = at.clone().add(P(Math.cos(a) * d, Math.sin(a) * d)); }
    });
    const W = Object.fromEntries(chain.map(c => [c.name, c]));
    // barrel: drum walls + the mainspring inside (cutaway: no lid)
    const drum = new T.Mesh(new T.CylinderGeometry(5.0, 5.0, 2.2, 72, 1, true), M.brass); drum.position.y = 1.2; W.barrel.g.add(drum);
    const drumIn = new T.Mesh(new T.CylinderGeometry(4.86, 4.86, 2.2, 72, 1, true), new T.MeshStandardMaterial({ color: '#8C6A30', metalness: 1, roughness: .5, side: T.BackSide })); drumIn.position.y = 1.2; W.barrel.g.add(drumIn);
    const mainspring = spiralMesh(900, M.spring); mainspring.position.y = .35; W.barrel.g.add(mainspring);
    const barArbor = cyl(.9, 2.6, M.steel, 24); barArbor.position.y = 1.2; W.barrel.g.add(barArbor);
    // pallet fork and balance
    const esc = W.escape.g.position;
    const fork = new T.Group(); const fa = (150) * Math.PI / 180; fork.position.set(esc.x + Math.cos(fa) * 3.2, 2.3, esc.z + Math.sin(fa) * 3.2); mech.add(fork);
    const lever = box(4.4, .3, .5, M.steel); lever.position.x = -2.0; fork.add(lever);
    const cross = box(.5, .3, 3.4, M.steel); cross.position.x = 1.1; fork.add(cross);
    [-1.5, 1.5].forEach(z => { const st = box(.7, .32, .35, M.ruby); st.position.set(1.5, 0, z); fork.add(st); });
    fork.rotation.y = Math.atan2(-(esc.z - fork.position.z), esc.x - fork.position.x);
    const forkPivot = cyl(.25, 2.4, M.steel, 12); forkPivot.position.y = -1; fork.add(forkPivot);
    const balG = new T.Group(); const fwd = new T.Vector3(fork.position.x - esc.x, 0, fork.position.z - esc.z).normalize(); balG.position.set(fork.position.x + fwd.x * 6.6, 3.0, fork.position.z + fwd.z * 6.6); mech.add(balG);
    const balWheel = new T.Group(); balG.add(balWheel);
    balWheel.add(new T.Mesh(ringGeo(4.6, 4.0, .55), M.gold));
    for (let i = 0; i < 3; i++) { const arm = box(8.2, .3, .45, M.gold); arm.rotation.y = i * Math.PI / 3; arm.position.y = .2; balWheel.add(arm); }
    for (let i = 0; i < 12; i++) { const sc = cyl(.28, .5, M.gold, 12); const a = i * TAU / 12; sc.rotation.z = Math.PI / 2; sc.rotation.y = -a; sc.position.set(Math.cos(a) * 4.75, .28, Math.sin(a) * 4.75); balWheel.add(sc); }
    const staff = cyl(.25, 3.2, M.steel, 16); staff.position.y = 0; balG.add(staff);
    const roller = cyl(.25, .5, M.ruby, 12); roller.position.set(.8, -.8, 0); balWheel.add(roller);
    const hair = spiralMesh(700, M.blue); hair.position.y = -.7; balG.add(hair);
    const balJewel = cyl(.6, .2, M.ruby, 24); balJewel.position.y = -3.0 + .02; balG.add(balJewel);
    // a few blued screws on the plate
    [[10, 6], [-11, 7], [11, -9], [-3, 12], [-12, -2]].forEach(([x, z]) => { const s = cyl(.55, .3, M.blue, 20); s.position.set(x, .15, z); mech.add(s); const sl = box(1.0, .05, .14, M.chip); sl.position.set(x, .32, z); mech.add(sl); });
    // automatic rotor (half disc over the movement)
    const rotorG = new T.Group(); rotorG.position.y = 5.2; mech.add(rotorG);
    const rs = new T.Shape(); rs.absarc(0, 0, 14.6, 0, Math.PI, false); rs.lineTo(-2, 0); rs.absarc(0, 0, 2, Math.PI, 0, true); rs.closePath();
    const rh = new T.Path(); rh.absarc(0, 0, 9.5, .35, Math.PI - .35, false); rh.absarc(0, 0, 4.2, Math.PI - .5, .5, true); rh.closePath(); rs.holes.push(rh);
    const rotorGeo = new T.ExtrudeGeometry(rs, { depth: .6, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2, curveSegments: 48 }); rotorGeo.rotateX(Math.PI / 2);
    const rotor = new T.Mesh(rotorGeo, M.gold); rotorG.add(rotor);
    const rotorHub = cyl(1.4, 1.2, M.steel, 32); rotorG.add(rotorHub);
    shadowAll(mech);

    // ---------------------------------------------------------------- exterior watch (dial up), case back underneath
    const watch = new T.Group(); scene.add(watch);
    const caseProf = [[0, -2.6], [16.2, -2.6], [17.6, -2.2], [18.4, -1], [18.6, .6], [18.2, 1.8], [17.2, 2.4], [16.4, 2.6], [15.8, 2.6]].map(([r, y]) => new T.Vector2(r, y));
    const caseM = new T.Mesh(new T.LatheGeometry(caseProf, 128), M.steel); watch.add(caseM);
    const dial = cyl(15.9, .3, M.dial, 128); dial.position.y = 2.2; watch.add(dial);
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12, ix = box(i % 3 ? .55 : .9, .3, i % 3 ? 2.2 : 3.2, M.white); ix.position.set(Math.sin(a) * 13.2, 2.45, -Math.cos(a) * 13.2); ix.rotation.y = -a; watch.add(ix); }
    const hand = (len, w, mat, y) => { const g = new T.Group(); const b = box(w, .18, len, mat); b.position.z = -len / 2 + 1; g.add(b); g.position.y = y; watch.add(g); return g; };
    const hH = hand(8.5, 1.0, M.white, 2.55), hM = hand(12.5, .7, M.white, 2.75), hS = hand(14, .25, M.accent, 2.95);
    const capC = cyl(.8, .4, M.steel, 24); capC.position.y = 3.05; watch.add(capC);
    const crown = cyl(1.6, 2.4, M.steel, 24); crown.rotation.z = Math.PI / 2; crown.position.set(19.6, 0, 0); watch.add(crown);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => { const l = box(3.2, 3.0, 6, M.steel); l.position.set(sx * 9.5, -.4, sz * 18.5); watch.add(l); });
    [-1, 1].forEach(sz => { const st = box(16, 2.2, 22, M.leather); st.position.set(0, -.6, sz * 31); watch.add(st); });
    const back = new T.Group(); back.position.y = -2.7; watch.add(back);
    const backD = cyl(15.8, .8, M.steel, 128); back.add(backD);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6, n = box(2.2, .5, 1.0, M.steelD); n.position.set(Math.cos(a) * 14.4, -.45, Math.sin(a) * 14.4); n.rotation.y = -a; back.add(n); }
    for (let i = 0; i < 3; i++) { const rr = new T.Mesh(new T.TorusGeometry(6 + i * 3, .08, 6, 96), M.steelD); rr.rotation.x = Math.PI / 2; rr.position.y = -.42; back.add(rr); }
    shadowAll(watch);

    // ---------------------------------------------------------------- quartz module
    const quartz = new T.Group(); scene.add(quartz);
    const pcb = cyl(15, .8, M.pcb, 96); quartz.add(pcb);
    for (let i = 0; i < 14; i++) { const tr = box(6 + (i % 4) * 2, .06, .25, M.copper); tr.position.set(-4 + (i % 5) * 2, .42, -8 + i * 1.2); quartz.add(tr); }
    const batt = new T.Group(); batt.position.set(-5.5, .4, -3.5); quartz.add(batt);
    const cell = cyl(6.2, 1.8, M.steel, 72); cell.position.y = .9; batt.add(cell); const cellTop = cyl(5.4, .1, M.steelD, 72); cellTop.position.y = 1.85; batt.add(cellTop);
    const plus1 = box(2.2, .12, .5, M.chip), plus2 = box(.5, .12, 2.2, M.chip); plus1.position.y = plus2.position.y = 1.9; batt.add(plus1, plus2);
    const chipM = box(3.4, .7, 3.4, M.chip); chipM.position.set(5.5, .75, -1); quartz.add(chipM);
    for (let i = 0; i < 8; i++) { const pin = box(.3, .2, .8, M.steel); pin.position.set(4.2 + (i % 4) * .85, .45, i < 4 ? -2.9 : .9); quartz.add(pin); }
    // the crystal: a steel can with the tuning fork visible (cutaway)
    const xtal = new T.Group(); xtal.position.set(5.5, 1.4, -7.5); quartz.add(xtal);
    const can = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 6, 40, 1, true, 0, Math.PI * 1.2), M.steel); can.rotation.z = Math.PI / 2; can.rotation.x = Math.PI * .6; xtal.add(can);
    const forkQ = new T.Group(); xtal.add(forkQ);
    const qBase = box(1.0, .5, 1.4, M.fork); qBase.position.x = -2.0; forkQ.add(qBase);
    const prongs = [-.4, .4].map(z => { const g = new T.Group(); g.position.set(-1.6, 0, z); const p = box(3.6, .35, .4, M.fork); p.position.x = 1.8; g.add(p); forkQ.add(g); return g; });
    // stepper motor: coil + stator + rotor
    const motor = new T.Group(); motor.position.set(-2, .4, 7.5); quartz.add(motor);
    const coil = cyl(1.4, 7, M.copper, 32); coil.rotation.z = Math.PI / 2; coil.position.set(-2.5, 1.4, 0); motor.add(coil);
    for (let i = 0; i < 18; i++) { const w = new T.Mesh(new T.TorusGeometry(1.42, .08, 6, 24), M.copper); w.rotation.y = Math.PI / 2; w.position.set(-5.8 + i * .38, 1.4, 0); motor.add(w); }
    const stator = box(10, .5, 2.6, M.steelD); stator.position.set(0, .3, 0); motor.add(stator);
    const mRot = new T.Group(); mRot.position.set(4.2, 1.2, 0); motor.add(mRot);
    const half = (c) => new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 1.2, 24, 1, false, 0, Math.PI), new T.MeshStandardMaterial({ color: c, metalness: .3, roughness: .4 }));
    const hn = half('#D93A3A'), hs = half('#2F55C8'); hs.rotation.y = Math.PI; mRot.add(hn, hs);
    const qGear = new T.Mesh(gearGeo(30, 2.6, { hole: .25, spokes: 3, thick: .3 }), M.gold); qGear.position.set(8, 1.6, 9); quartz.add(qGear);
    // pulses travelling battery -> chip -> crystal -> chip -> motor
    const pulseTex = glowTex('rgba(255,255,255,1)', 'rgba(255,170,70,.8)');
    const pulses = []; for (let i = 0; i < 6; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: pulseTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.set(2.4, 2.4, 1); quartz.add(s); pulses.push(s); }
    const pPath = [new T.Vector3(-5.5, 2.4, -3.5), new T.Vector3(5.5, 1.4, -1), new T.Vector3(5.5, 1.6, -7.5), new T.Vector3(5.5, 1.4, -1), new T.Vector3(1, 1.6, 6), new T.Vector3(2.2, 1.6, 7.5)];
    shadowAll(quartz);

    // ---------------------------------------------------------------- hero crystal (big tuning fork in light)
    const hero = new T.Group(); scene.add(hero);
    const hBase = box(2.6, 1.2, 3.6, M.fork); hBase.position.x = -5.2; hero.add(hBase);
    const hProngs = [-1.05, 1.05].map(z => { const g = new T.Group(); g.position.set(-4.2, 0, z); const p = box(10, .9, 1.0, M.fork); p.position.x = 5; g.add(p); hero.add(g); return g; });
    const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,255,240,1)', 'rgba(255,190,90,.55)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true })); halo.scale.set(22, 22, 1); hero.add(halo);
    const waves = []; for (let i = 0; i < 4; i++) { const w = new T.Mesh(new T.TorusGeometry(1, .06, 8, 96), new T.MeshBasicMaterial({ color: '#FFB84A', transparent: true, opacity: .6 })); w.rotation.x = Math.PI / 2; hero.add(w); waves.push(w); }
    shadowAll(hero); halo.castShadow = false; waves.forEach(w => w.castShadow = false);

    // ---------------------------------------------------------------- state + clock
    const ST = {
      cam: { px: 0, py: 60, pz: 40, tx: 0, ty: 0, tz: 0, fov: 30 }, orbit: 0, roll: 0,
      watch: 0, mech: 0, quartz: 0, hero: 0,           // visibility 0/1 (scale pops in)
      flip: 0, open: 0, explode: 0, rotorOn: 0, rotorAng: 0, wind: 0,
      hl: 0, hlAmt: 0,                                 // highlight: 1 barrel, 2 train, 3 escape+fork, 4 balance, 5 rotor, 6 crystal, 7 motor, 8 battery
      quartzOn: 0, heroGlow: 1, heroVib: 1, timeH: 10, timeM: 10,
      bg: '#DCD3C6', skip: 0,
    };
    let RATE = [[0, 1]];
    const setRate = keys => { RATE = keys.slice().sort((a, b) => a[0] - b[0]); };
    function clock(t) {      // integral of the piecewise-linear rate up to t
      let acc = 0; for (let i = 0; i < RATE.length; i++) { const [t0, r0] = RATE[i], nx = RATE[i + 1]; if (t <= t0) break; const t1 = nx ? Math.min(t, nx[0]) : t, r1 = nx ? r0 + (nx[1] - r0) * ((t1 - t0) / (nx[0] - t0)) : r0; acc += (t1 - t0) * (r0 + r1) / 2; if (!nx || t < nx[0]) break; }
      return acc; }
    const hlMats = [];
    function highlight(group, k) { group.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !hlMats.find(h => h.m === o.material && h.k === k)) { const m = o.material.clone(); o.material = m; hlMats.push({ m, k, base: m.emissive.clone(), bi: m.emissiveIntensity }); } }); }
    highlight(W.barrel.g, 1); [W.center, W.third, W.fourth].forEach(c => highlight(c.g, 2)); highlight(W.escape.g, 3); highlight(fork, 3); highlight(balG, 4); highlight(rotorG, 5); highlight(xtal, 6); highlight(motor, 7); highlight(batt, 8);

    function render(t) {
      if (ST.skip) return;
      scene.background.set(ST.bg); floor.material.color.set(ST.bg).multiplyScalar(.95);
      // camera with a slow orbit around the target
      const c = ST.cam, a = ST.orbit * t * Math.PI / 180, dx = c.px - c.tx, dz = c.pz - c.tz;
      cam.position.set(c.tx + dx * Math.cos(a) - dz * Math.sin(a), c.py, c.tz + dx * Math.sin(a) + dz * Math.cos(a));
      cam.fov = c.fov; cam.updateProjectionMatrix(); cam.up.set(Math.sin(ST.roll), Math.cos(ST.roll), 0); cam.lookAt(c.tx, c.ty, c.tz);
      watch.visible = ST.watch > .01; mech.visible = ST.mech > .01; quartz.visible = ST.quartz > .01; hero.visible = ST.hero > .01;
      watch.scale.setScalar(Math.max(.001, ST.watch)); quartz.scale.setScalar(Math.max(.001, ST.quartz)); hero.scale.setScalar(Math.max(.001, ST.hero));
      // the watch turns over, the case back unscrews and lifts away
      watch.rotation.x = Math.PI * ST.flip; watch.rotation.z = -.25 * Math.sin(Math.PI * ST.flip);
      const op = ST.open; back.rotation.y = -op * 2.4; back.position.y = -2.7 - Math.max(0, op - .35) / .65 * 28;
      // hands show 10:10 and the seconds hand sweeps with the clock
      const tc = clock(t);
      hH.rotation.y = -(ST.timeH % 12 + ST.timeM / 60) / 12 * TAU; hM.rotation.y = -ST.timeM / 60 * TAU; hS.rotation.y = -(Math.floor(tc * 8) / 8 % 60) / 60 * TAU;
      // movement: one clock drives the balance, fork, escape wheel and every wheel by its ratio
      const bal = Math.sin(TAU * 4 * tc), beats = Math.floor(tc * 8), frac = tc * 8 - beats, stepE = beats + Math.min(1, frac / .25);
      balWheel.rotation.y = bal * 3.6; hair.rotation.y = bal * 1.6;
      setSpiral(hair, .45, 2.8 + .12 * bal, 11, .16, 0);
      fork.rotation.y = Math.atan2(-(esc.z - fork.position.z), esc.x - fork.position.x) + .17 * Math.tanh(4 * bal);
      const angE = stepE * TAU / 30; W.escape.g.rotation.y = angE;
      const angF = -angE * W.escape.rp / W.fourth.Rw; W.fourth.g.rotation.y = angF;
      const angT = -angF * W.fourth.rp / W.third.Rw; W.third.g.rotation.y = angT;
      const angC = -angT * W.third.rp / W.center.Rw; W.center.g.rotation.y = angC;
      W.barrel.g.rotation.y = -angC * W.center.rp / W.barrel.Rw;
      setSpiral(mainspring, .95 + 2.0 * (1 - ST.wind), 3.0 + 1.8 * (1 - ST.wind), 9 - 2 * (1 - ST.wind), 1.5, -W.barrel.g.rotation.y * 0);
      mech.scale.setScalar(Math.max(.001, ST.mech));
      // exploded view: parts lift by level
      const ex = ST.explode * 6; W.barrel.g.position.y = 0 + ex * .5; W.center.g.position.y = 1 + ex; W.third.g.position.y = 2 + ex * 1.3; W.fourth.g.position.y = 1 + ex * 1.6; W.escape.g.position.y = 2 + ex * 2; fork.position.y = 2.3 + ex * 2.3; balG.position.y = 3 + ex * 2.8; rotorG.position.y = 5.2 + ex * 3.6;
      rotorG.visible = ST.rotorOn > .01; rotorG.rotation.y = ST.rotorAng; rotorG.scale.setScalar(Math.max(.001, ST.rotorOn));
      // quartz: fork vibrates, motor ticks once a second, pulses run along the circuit
      const qv = ST.quartzOn; prongs.forEach((g, i) => g.rotation.y = (i ? -1 : 1) * .05 * qv * Math.sin(t * 2 * Math.PI * 13));
      mRot.rotation.y = Math.floor(t) * Math.PI + Math.min(1, (t % 1) / .12) * Math.PI * (qv > .5 ? 1 : 0);
      qGear.rotation.y = -Math.floor(t) * TAU / 30 * qv;
      pulses.forEach((s, i) => { const u = ((t * .9 + i / pulses.length) % 1) * (pPath.length - 1), k = Math.floor(u), f = u - k; s.position.copy(pPath[k]).lerp(pPath[k + 1], f); s.material.opacity = qv; s.visible = qv > .01; });
      M.fork.emissiveIntensity = Math.max(.15 + .6 * qv, .35 * ST.heroGlow * (hero.visible ? 1 : 0));
      // hero crystal glow + vibration + sound rings
      hProngs.forEach((g, i) => g.rotation.y = (i ? -1 : 1) * .045 * ST.heroVib * Math.sin(t * 2 * Math.PI * 11));
      halo.material.opacity = .32 * ST.heroGlow * (.85 + .15 * Math.sin(t * 6)); halo.position.set(1, 0, 0);
      waves.forEach((w, i) => { const u = ((t * .6 + i / 4) % 1); w.scale.setScalar(4 + u * 16); w.material.opacity = .55 * (1 - u) * ST.heroGlow; w.position.x = 1; });
      // highlight the part doing the work
      hlMats.forEach(h => { const on = h.k === Math.round(ST.hl) ? ST.hlAmt : 0; h.m.emissive.copy(h.base).lerp(new T.Color('#FF7A2A'), on * .55); h.m.emissiveIntensity = h.bi + on * (.28 + .14 * Math.sin(t * 8)); });
      R.render(scene, cam);
    }
    return { ST, setRate, render, clock, parts: { W, fork, balG, mech, watch, quartz, hero } };
  };
})();
