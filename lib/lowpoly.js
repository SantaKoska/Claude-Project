/* lowpoly.js — reusable low-poly 3D kit for 9:16 reels (Three.js r160, global THREE).
 *
 *   const R = LP.renderer(canvas);                 // renderer + scene + camera
 *   const W = LP.world(R.scene, { seed: 7 });       // night forest, moon, stars, glow motes
 *   const p = LP.person(R.scene, { skin, hair, hairStyle, top, pants, shoes, glasses });
 *   p.S.walk = 1; p.S.sit = 0; p.S.armR = [80, 10]  // pose state (GSAP can tween these)
 *   LP.orbit(R.camera, { tx, ty, tz, dist, yaw, pitch });
 *   each frame:  W.update(t); p.update(t, mouthOpen); R.render();
 *
 * Rules: everything is driven by t (no Math.random at render time), so the same t
 * always gives the same frame. Characters are original designs built from parts.
 */
(function () {
  const T = THREE;
  const LP = {};
  const D2R = Math.PI / 180;

  LP.flat = (color, extra = {}) => new T.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: .9, metalness: 0 }, extra));
  LP.seeded = (s = 7) => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const cast = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  LP.at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

  // ------------------------------------------------------------------ renderer
  LP.renderer = function (canvas, o = {}) {
    const r = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(o.w || 1080, o.h || 1920, false);
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = o.exposure || 1.15;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(o.fov || 30, (o.w || 1080) / (o.h || 1920), .1, 300);
    return { renderer: r, scene, camera, render: () => r.render(scene, camera) };
  };

  // ------------------------------------------------------------------ camera
  // Orbit camera around a target. yaw 0 = camera in front (+z), pitch in degrees.
  LP.orbit = function (cam, c) {
    const y = (c.yaw || 0) * D2R, p = (c.pitch || 10) * D2R, d = c.dist || 8;
    cam.position.set(c.tx + d * Math.sin(y) * Math.cos(p), c.ty + d * Math.sin(p), c.tz + d * Math.cos(y) * Math.cos(p));
    cam.lookAt(c.tx, c.ty, c.tz);
    if (c.fov && cam.fov !== c.fov) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
  };
  // Screen position (1080x1920) of a world point, for SVG labels that follow 3D things.
  LP.toScreen = function (cam, v, w = 1080, h = 1920) {
    const p = v.clone().project(cam);
    return { x: (p.x * .5 + .5) * w, y: (-p.y * .5 + .5) * h, behind: p.z > 1 };
  };

  // ------------------------------------------------------------------ world
  const PALETTES = {
    night: { sky: '#121F48', fog: '#17295C', ground: '#22407A', trees: ['#1C4F70', '#22627F', '#19456A', '#276A8C'], hemiSky: '#8FB0FF', hemiGround: '#0A1230', key: '#AFC6FF', rim: '#6AA8FF', moon: true, mote: '#FFE2A8' },
    dusk: { sky: '#3B2550', fog: '#5A3460', ground: '#4A3A5E', trees: ['#2F4A55', '#3A5A5A', '#2A3F50', '#40605E'], hemiSky: '#FFB59A', hemiGround: '#20142C', key: '#FFC9A0', rim: '#B98CFF', moon: false, mote: '#FFD39A' },
    day: { sky: '#8FD3FF', fog: '#BDE6FF', ground: '#7CC47A', trees: ['#2F8F5B', '#3BA36A', '#2A7D50', '#46B276'], hemiSky: '#FFFFFF', hemiGround: '#5A8A4A', key: '#FFF4D6', rim: '#FFFFFF', moon: false, mote: '#FFFFFF' },
  };
  LP.world = function (scene, o = {}) {
    const P = Object.assign({}, PALETTES[o.palette || 'night'], o.colors || {});
    const rnd = LP.seeded(o.seed || 23);
    scene.background = new T.Color(P.sky);
    scene.fog = new T.Fog(P.fog, o.fogNear || 10, o.fogFar || 48);
    const hemi = new T.HemisphereLight(P.hemiSky, P.hemiGround, .75); scene.add(hemi);
    const key = new T.DirectionalLight(P.key, 1.15); key.position.set(-6, 12, -4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(key);
    const rim = new T.DirectionalLight(P.rim, .7); rim.position.set(5, 5, -7); scene.add(rim);

    // faceted ground with a flat clearing in the middle
    const clearing = o.clearing ?? 2.6;
    const gGeo = new T.PlaneGeometry(60, 60, 22, 22); gGeo.rotateX(-Math.PI / 2);
    const gp = gGeo.attributes.position;
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i), z = gp.getZ(i), d = Math.hypot(x, z);
      gp.setY(i, (d > clearing ? (Math.sin(x * .7) * .22 + Math.cos(z * .6) * .18) * Math.min(1, (d - clearing) / 3) : 0) - Math.max(0, d - clearing) * .012);
    }
    gGeo.computeVertexNormals();
    const ground = new T.Mesh(gGeo, LP.flat(P.ground)); ground.receiveShadow = true; scene.add(ground);

    // pine trees in a ring, leaving the clearing and the camera lane (+z) open
    const trees = new T.Group(); scene.add(trees);
    const nTrees = o.trees ?? 36;
    for (let i = 0; i < nTrees; i++) {
      const a = rnd() * Math.PI * 2, r = clearing + 2.5 + rnd() * 12;
      const x = Math.cos(a) * r, z = Math.sin(a) * r - 2;
      if (z > 1 && Math.abs(x) < 3.5) continue;
      trees.add(LP.pine(x, z, .7 + rnd() * 1.1, P.trees, rnd));
    }

    // moon + stars
    if (P.moon) {
      const disc = new T.Mesh(new T.CircleGeometry(1.3, 40), new T.MeshBasicMaterial({ color: '#F6F8FF', fog: false }));
      disc.position.set(-4.5, 11, -26); scene.add(disc);
      const cut = new T.Mesh(new T.CircleGeometry(1.2, 40), new T.MeshBasicMaterial({ color: P.sky, fog: false }));
      cut.position.set(-3.9, 11.35, -25.9); scene.add(cut);
      const stars = new T.InstancedMesh(new T.SphereGeometry(.05, 6, 4), new T.MeshBasicMaterial({ color: '#DCE6FF', fog: false }), 110);
      const d = new T.Object3D();
      for (let i = 0; i < 110; i++) { d.position.set((rnd() - .5) * 70, 5 + rnd() * 18, -22 - rnd() * 14); d.scale.setScalar(.5 + rnd() * 1.3); d.updateMatrix(); stars.setMatrixAt(i, d.matrix); }
      scene.add(stars);
    }

    // glow motes drifting upward (time-only)
    const N = o.motes ?? 70;
    const motes = new T.InstancedMesh(new T.OctahedronGeometry(.045, 0), new T.MeshBasicMaterial({ color: P.mote }), N);
    scene.add(motes);
    const dm = new T.Object3D();
    function update(t) {
      for (let i = 0; i < N; i++) {
        const u = (t * .045 + i / N) % 1;
        dm.position.set(Math.sin(i * 2.7) * 4.5 + Math.sin(t * .35 + i) * .35, .3 + u * 6.5, Math.cos(i * 1.9) * 3 + 1.2);
        dm.rotation.set(t + i, t * 1.3, 0); dm.scale.setScalar(.45 + .55 * Math.abs(Math.sin(i + t * 2.5))); dm.updateMatrix();
        motes.setMatrixAt(i, dm.matrix);
      }
      motes.instanceMatrix.needsUpdate = true;
    }
    return { update, ground, trees, key, rim, hemi, palette: P };
  };

  LP.pine = function (x, z, s, cols, rnd = Math.random) {
    const g = new T.Group();
    g.add(cast(LP.at(new T.Mesh(new T.CylinderGeometry(.09 * s, .12 * s, .9 * s, 5), LP.flat('#3B2A22')), 0, .45 * s, 0)));
    for (let k = 0; k < 4; k++) {
      const c = cast(new T.Mesh(new T.ConeGeometry((1.25 - k * .24) * s, (1.3 - k * .1) * s, 7), LP.flat(cols[Math.floor(rnd() * cols.length)])));
      c.position.y = (1.0 + k * .72) * s; c.rotation.y = rnd() * 3; g.add(c);
    }
    g.position.set(x, 0, z); return g;
  };

  // soft radial glow texture, drawn in code
  LP.glowTexture = function (rgb = '255,200,120') {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.3, `rgba(${rgb},.45)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  };

  // ------------------------------------------------------------------ props
  LP.laptop = function (parent, o = {}) {
    const g = new T.Group(); parent.add(g);
    g.add(cast(new T.Mesh(new T.BoxGeometry(.42, .02, .3), LP.flat(o.body || '#2A3353'))));
    const lid = new T.Group(); lid.position.set(0, .01, .15); g.add(lid);
    const back = cast(new T.Mesh(new T.BoxGeometry(.42, .28, .015), LP.flat(o.body || '#3A4772')));
    back.position.y = .14; lid.add(back);
    const screen = new T.Mesh(new T.PlaneGeometry(.38, .24), new T.MeshBasicMaterial({ color: o.glow || '#FFC58A' }));
    screen.position.set(0, .14, -.009); screen.rotation.y = Math.PI; lid.add(screen);
    const logo = new T.Mesh(new T.CircleGeometry(.025, 12), new T.MeshBasicMaterial({ color: '#FFE3BC' }));
    logo.position.set(0, .15, .009); lid.add(logo);
    lid.rotation.x = .3;                         // tilted back, screen facing the user
    const light = new T.PointLight(o.glow || '#FFB36A', o.intensity ?? 2.2, 1.8, 2); light.position.set(0, .25, -.05); g.add(light);
    return { g, lid, screen, light };
  };
  LP.log = function (parent, x = 0, z = 0, len = 1.4) {
    const m = cast(new T.Mesh(new T.CylinderGeometry(.22, .22, len, 7), LP.flat('#4A3327')));
    m.rotation.z = Math.PI / 2; m.position.set(x, .22, z); parent.add(m); return m;
  };
  LP.campfire = function (parent, x = 0, z = 0) {
    const g = new T.Group(); g.position.set(x, 0, z); parent.add(g);
    for (let i = 0; i < 6; i++) { const s = cast(new T.Mesh(new T.DodecahedronGeometry(.12, 0), LP.flat('#5D6475'))); const a = i / 6 * Math.PI * 2; s.position.set(Math.cos(a) * .35, .06, Math.sin(a) * .35); g.add(s); }
    for (let i = 0; i < 3; i++) { const l = cast(new T.Mesh(new T.CylinderGeometry(.04, .04, .5, 5), LP.flat('#4A3327'))); l.rotation.set(Math.PI / 2.4, i * 2.1, 0); l.position.y = .12; g.add(l); }
    const flames = [];
    [['#FF5A1F', .22, .55], ['#FF9A2E', .15, .42], ['#FFE07A', .08, .28]].forEach(([c, r, h]) => { const f = new T.Mesh(new T.ConeGeometry(r, h, 6), new T.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: .95 })); f.position.y = .15 + h / 2; g.add(f); flames.push(f); });
    const glow = new T.Sprite(new T.SpriteMaterial({ map: LP.glowTexture('255,150,60'), blending: T.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }));
    glow.scale.set(2.2, 2.2, 1); glow.position.y = .45; g.add(glow);
    const light = new T.PointLight('#FF9A4A', 4, 7, 1.8); light.position.y = .6; g.add(light);
    return { g, update: t => { glow.material.opacity = .75 + .2 * Math.sin(t * 9) * Math.sin(t * 4); flames.forEach((f, i) => { f.scale.set(1 + .12 * Math.sin(t * 9 + i), 1 + .18 * Math.sin(t * 7 + i * 2), 1 + .12 * Math.cos(t * 8 + i)); f.rotation.y = t * (1 + i); }); light.intensity = 3.6 + .8 * Math.sin(t * 11) * Math.sin(t * 5); } };
  };

  // ------------------------------------------------------------------ person
  // Jointed low-poly person. Units ~ metres: standing height ~2.05 (big head, friendly proportions).
  // Angles in degrees, forward positive. S.armL / S.armR = [shoulder, elbow, inward] override the walk swing.
  LP.person = function (parent, o = {}) {
    const C = Object.assign({ skin: '#E6A47A', hair: '#2B1E19', hairStyle: 'curly', top: '#1F1E27', collar: '#2C2B36', pants: '#2B3147', shoes: '#1B1A20', glasses: false, glassesColor: '#3F2E28', eyes: '#15110F', scale: 1 }, o);
    const M = { skin: LP.flat(C.skin), hair: LP.flat(C.hair), top: LP.flat(C.top), collar: LP.flat(C.collar), pants: LP.flat(C.pants), shoes: LP.flat(C.shoes) };
    const root = new T.Group(); parent.add(root);
    const body = new T.Group(); root.add(body);              // moves for bob / sit
    const hips = new T.Group(); hips.position.y = .95; body.add(hips);
    hips.add(cast(new T.Mesh(new T.BoxGeometry(.38, .2, .24), M.pants)));
    // torso + chest
    const chest = new T.Group(); chest.position.y = .08; hips.add(chest);
    const torso = cast(new T.Mesh(new T.CylinderGeometry(.22, .19, .56, 7), M.top)); torso.scale.z = .78; torso.position.y = .3; chest.add(torso);
    const collar = cast(new T.Mesh(new T.CylinderGeometry(.1, .16, .08, 7), M.collar)); collar.position.y = .6; chest.add(collar);
    // head
    const neck = new T.Group(); neck.position.y = .62; chest.add(neck);
    neck.add(cast(LP.at(new T.Mesh(new T.CylinderGeometry(.06, .07, .12, 6), M.skin), 0, .05, 0)));
    const head = new T.Group(); head.position.y = .32; neck.add(head);
    const skull = cast(new T.Mesh(new T.IcosahedronGeometry(.24, 1), M.skin)); skull.scale.set(.96, 1.06, .96); head.add(skull);
    [-1, 1].forEach(s => head.add(LP.at(new T.Mesh(new T.SphereGeometry(.045, 6, 5), M.skin), s * .235, -.01, 0)));
    // face
    const eyeW = new T.MeshStandardMaterial({ color: '#F7F2EA', roughness: .4 }), eyeP = new T.MeshStandardMaterial({ color: C.eyes, roughness: .3 });
    const lids = [], pupils = [];
    [-1, 1].forEach(s => {
      const w = new T.Mesh(new T.SphereGeometry(.03, 8, 6), eyeW); w.position.set(s * .085, .02, .215); w.scale.z = .5; head.add(w);
      const p = new T.Mesh(new T.SphereGeometry(.017, 8, 6), eyeP); p.position.set(s * .085, .018, .229); head.add(p); pupils.push(p);
      const lid = new T.Mesh(new T.BoxGeometry(.07, .02, .03), M.skin); lid.position.set(s * .085, .045, .222); head.add(lid); lids.push(lid);
      const br = new T.Mesh(new T.BoxGeometry(.075, .014, .02), M.hair); br.position.set(s * .085, .075, .222); br.rotation.z = -s * .12; head.add(br);
    });
    const nose = new T.Mesh(new T.ConeGeometry(.03, .07, 4), M.skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, -.025, .245); head.add(nose);
    const mouth = new T.Mesh(new T.BoxGeometry(.07, .014, .015), new T.MeshStandardMaterial({ color: '#6E2F33' })); mouth.position.set(0, -.095, .222); head.add(mouth);
    // hair
    const hairG = new T.Group(); head.add(hairG);
    const capS = { curly: [1.06, .82, 1.06], short: [1.04, .7, 1.04], long: [1.06, .85, 1.08], bun: [1.04, .72, 1.04], buzz: [1.02, .6, 1.02] }[C.hairStyle] || [1.04, .75, 1.04];
    const cap = cast(new T.Mesh(new T.IcosahedronGeometry(.25, 1), M.hair)); cap.scale.set(...capS); cap.position.set(0, .07, -.03); hairG.add(cap);
    if (C.hairStyle === 'curly') [[-.15, .17, .14, .1], [.02, .2, .17, .09], [.16, .16, .13, .09], [-.22, .05, .02, .09], [.22, .05, .02, .09], [-.1, .2, -.1, .1], [.12, .21, -.08, .1]].forEach(([x, y, z, r]) => { const k = cast(new T.Mesh(new T.DodecahedronGeometry(r, 0), M.hair)); k.position.set(x, y, z); hairG.add(k); });
    if (C.hairStyle === 'short') { const f = cast(new T.Mesh(new T.BoxGeometry(.36, .06, .08), M.hair)); f.position.set(.03, .17, .19); f.rotation.z = -.15; hairG.add(f); }
    if (C.hairStyle === 'long') { const b = cast(new T.Mesh(new T.BoxGeometry(.44, .45, .14), M.hair)); b.position.set(0, -.13, -.16); hairG.add(b); }
    if (C.hairStyle === 'bun') { const b = cast(new T.Mesh(new T.IcosahedronGeometry(.1, 0), M.hair)); b.position.set(0, .2, -.2); hairG.add(b); }
    // glasses
    if (C.glasses) {
      const gm = new T.MeshStandardMaterial({ color: C.glassesColor, roughness: .5 });
      [-1, 1].forEach(s => {
        const f = new T.Mesh(new T.TorusGeometry(.05, .009, 6, 14), gm); f.position.set(s * .085, .02, .238); head.add(f);
        const l = new T.Mesh(new T.CircleGeometry(.046, 14), new T.MeshStandardMaterial({ color: '#9FC4FF', transparent: true, opacity: .2, roughness: .1 })); l.position.set(s * .085, .02, .24); head.add(l);
        const a = new T.Mesh(new T.BoxGeometry(.012, .01, .2), gm); a.position.set(s * .14, .025, .14); head.add(a);
      });
      const br = new T.Mesh(new T.BoxGeometry(.05, .01, .01), gm); br.position.set(0, .025, .242); head.add(br);
    }
    // arms: shoulder -> elbow -> hand
    function arm(s) {
      const sh = new T.Group(); sh.position.set(s * .27, .52, 0); chest.add(sh);
      const up = cast(new T.Mesh(new T.CylinderGeometry(.065, .058, .32, 6), M.top)); up.position.y = -.16; sh.add(up);
      const el = new T.Group(); el.position.y = -.32; sh.add(el);
      const fo = cast(new T.Mesh(new T.CylinderGeometry(.056, .05, .28, 6), M.top)); fo.position.y = -.14; el.add(fo);
      const hand = cast(new T.Mesh(new T.DodecahedronGeometry(.055, 0), M.skin)); hand.position.y = -.31; el.add(hand);
      return { sh, el };
    }
    const aL = arm(-1), aR = arm(1);
    // legs: hip -> knee -> foot
    function leg(s) {
      const hp = new T.Group(); hp.position.set(s * .1, -.05, 0); hips.add(hp);
      const th = cast(new T.Mesh(new T.CylinderGeometry(.09, .078, .45, 6), M.pants)); th.position.y = -.225; hp.add(th);
      const kn = new T.Group(); kn.position.y = -.45; hp.add(kn);
      const sn = cast(new T.Mesh(new T.CylinderGeometry(.074, .066, .43, 6), M.pants)); sn.position.y = -.215; kn.add(sn);
      const ft = cast(new T.Mesh(new T.BoxGeometry(.12, .07, .24), M.shoes)); ft.position.set(0, -.44, .05); kn.add(ft);
      return { hp, kn };
    }
    const lL = leg(-1), lR = leg(1);
    root.scale.setScalar(C.scale);

    const S = { x: 0, y: 0, z: 0, ry: 0, walk: 0, run: 0, sit: 0, seat: .45, lean: 0, armL: null, armR: null,
      talk: 0, look: 0, tilt: 0, nod: 0, smile: .3, speed: 1, phase: 0, blink: 1.7 + (o.seed || 0) * .9 };
    const fwd = (g, a) => { g.rotation.x = -a * D2R; };
    function update(t, mouthOpen = 0) {
      const ph = t * S.speed * (1.7 + 1.1 * S.run) * Math.PI * 2 + S.phase;
      const g = Math.max(S.walk, S.run), amp = (28 + 18 * S.run) * g, sw = Math.sin(ph);
      // legs: walk swing blended into the seated pose
      const kneeL = (12 + 50 * S.run) * g * Math.max(0, Math.sin(ph + 1.3)), kneeR = (12 + 50 * S.run) * g * Math.max(0, Math.sin(ph + 1.3 + Math.PI));
      fwd(lL.hp, amp * sw * (1 - S.sit) + 88 * S.sit); fwd(lR.hp, -amp * sw * (1 - S.sit) + 88 * S.sit);
      lL.kn.rotation.x = (kneeL * (1 - S.sit) + 90 * S.sit) * D2R; lR.kn.rotation.x = (kneeR * (1 - S.sit) + 90 * S.sit) * D2R;
      // arms: counter-swing unless posed
      const elb = 12 + 70 * S.run;
      const L = S.armL || [-amp * .8 * sw, elb], R = S.armR || [amp * .8 * sw, elb];
      fwd(aL.sh, L[0]); aL.el.rotation.x = -L[1] * D2R; aL.sh.rotation.z = -.06; aL.sh.rotation.y = (L[2] || 0) * D2R;
      fwd(aR.sh, R[0]); aR.el.rotation.x = -R[1] * D2R; aR.sh.rotation.z = .06; aR.sh.rotation.y = -(R[2] || 0) * D2R;
      // body: bob, lean, sit height, breathing
      const bob = g * (.025 + .04 * S.run) * (1 - Math.cos(2 * ph)) / 2;
      hips.position.y = .95 - (.95 - S.seat) * S.sit + bob;
      chest.rotation.x = (S.lean + 10 * S.run) * D2R; chest.scale.y = 1 + .012 * Math.sin(t * 1.5);
      // head: look, tilt, nod
      head.rotation.y = S.look * D2R + Math.sin(t * .4) * .04; head.rotation.z = S.tilt * D2R; head.rotation.x = S.nod * D2R;
      // face: blink, pupils follow look, mouth talks
      const bt = (t + S.blink) % 3.7, bl = bt < .13 ? Math.sin(bt / .13 * Math.PI) : 0;
      lids.forEach(l => { l.scale.y = 1 + 3.2 * bl; l.position.y = .045 - .022 * bl; });
      pupils.forEach((p, i) => { p.position.x = (i ? 1 : -1) * .085 + Math.sin(S.look * D2R) * .012; });
      const m = Math.max(0, Math.min(1, mouthOpen * S.talk));
      mouth.scale.set(1 - .2 * m + .15 * S.smile * (1 - m), 1 + 2.2 * m, 1);
      root.position.set(S.x, S.y, S.z); root.rotation.y = S.ry * D2R;
    }
    update(0);
    return { root, head, S, update, colors: C };
  };

  // Speaking helper: mouth open from word times (same as the 2D reels).
  LP.speakFrom = words => t => { for (const w of words) { const d = t - w.t; if (d >= 0 && d < .2) return Math.sin(Math.PI * d / .2); } return 0; };

  // ------------------------------------------------------------------ coast kit
  // Animated faceted sea covering z < z0 (the shore line), with a moonlight streak.
  LP.sea = function (scene, o = {}) {
    const z0 = o.z0 ?? -3, W = o.w || 90, D = o.d || 60;
    const geo = new T.PlaneGeometry(W, D, 45, 30); geo.rotateX(-Math.PI / 2);
    const base = geo.attributes.position.array.slice();
    const mesh = new T.Mesh(geo, LP.flat(o.color || '#1E4F92', { roughness: .45, metalness: .1 }));
    mesh.position.set(0, -.02, z0 - D / 2); mesh.receiveShadow = true; scene.add(mesh);
    const streak = new T.Mesh(new T.PlaneGeometry(1.6, 30), new T.MeshBasicMaterial({ map: LP.glowTexture('200,215,255'), transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false }));
    streak.rotation.x = -Math.PI / 2; streak.position.set(o.streakX ?? -3.5, .05, z0 - 16); scene.add(streak);
    function update(t) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.setY(i, .09 * Math.sin(x * .55 + t * 1.1) + .07 * Math.cos(z * .5 + t * .8) + .03 * Math.sin((x + z) * 1.3 + t * 2)); }
      p.needsUpdate = true; geo.computeVertexNormals();
      streak.material.opacity = .3 + .08 * Math.sin(t * 1.7);
    }
    return { mesh, update, z0 };
  };
  LP.palm = function (x, z, s = 1, rnd = Math.random, cols = ['#2F7F5F', '#3A9468', '#27694F']) {
    const g = new T.Group(); g.position.set(x, 0, z);
    const lean = (rnd() - .5) * .5, segs = 7; let px = 0, py = 0;
    const trunkM = LP.flat('#6B4E34');
    for (let i = 0; i < segs; i++) {
      const r = (.13 - i * .008) * s, h = .48 * s;
      const c = cast(new T.Mesh(new T.CylinderGeometry(r * .9, r, h, 6), trunkM));
      px += Math.sin(lean) * h * (i / segs); c.position.set(px, py + h / 2, 0); c.rotation.z = -lean * (i / segs); g.add(c); py += h * .97;
    }
    const crown = new T.Group(); crown.position.set(px, py, 0); g.add(crown);
    for (let k = 0; k < 8; k++) {
      const f = new T.Group(); f.rotation.y = k / 8 * Math.PI * 2 + rnd() * .3; crown.add(f);
      const leaf = cast(new T.Mesh(new T.ConeGeometry(.22 * s, 1.6 * s, 4), LP.flat(cols[k % cols.length])));
      leaf.scale.z = .18; leaf.rotation.z = -Math.PI / 2 - .35 - rnd() * .3; leaf.position.x = .75 * s; leaf.position.y = -.12 * s; f.add(leaf);
    }
    for (let k = 0; k < 3; k++) { const n = cast(new T.Mesh(new T.IcosahedronGeometry(.08 * s, 0), LP.flat('#5A4326'))); n.position.set(Math.cos(k * 2.1) * .12 * s, -.1 * s, Math.sin(k * 2.1) * .12 * s); crown.add(n); }
    return g;
  };
  LP.sack = function (parent, x, y, z, s = 1, o = {}) {
    const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
    g.add(LP.at(cast(new T.Mesh(new T.CylinderGeometry(.2, .25, .46, 7), LP.flat(o.color || '#BFA06A'))), 0, .23, 0));
    g.add(LP.at(cast(new T.Mesh(new T.CylinderGeometry(.08, .18, .12, 7), LP.flat(o.color || '#A8894F'))), 0, .5, 0));
    const pm = LP.flat('#141414', { roughness: .4 });
    for (let i = 0; i < 7; i++) g.add(LP.at(new T.Mesh(new T.IcosahedronGeometry(.045, 0), pm), Math.cos(i) * .09 * (i % 3) / 2, .48 + (i % 2) * .03, Math.sin(i * 1.7) * .08 * (i % 3) / 2));
    return g;
  };
  // Low-poly Roman merchant ship (bow toward +x). update(t) billows the sail and rocks the hull.
  LP.ship = function (parent, o = {}) {
    const g = new T.Group(); parent.add(g);
    const body = new T.Group(); g.add(body);
    const sh = new T.Shape(); sh.moveTo(1.9, 0); sh.quadraticCurveTo(1.3, .75, -.9, .8); sh.lineTo(-1.8, .5); sh.lineTo(-1.8, -.5); sh.lineTo(-.9, -.8); sh.quadraticCurveTo(1.3, -.75, 1.9, 0);
    const hg = new T.ExtrudeGeometry(sh, { depth: .55, bevelEnabled: true, bevelSize: .08, bevelThickness: .06, bevelSegments: 1 }); hg.rotateX(-Math.PI / 2);
    body.add(LP.at(cast(new T.Mesh(hg, [LP.flat('#A8743F'), LP.flat('#6E4421')])), 0, -.1, 0));
    body.add(LP.at(cast(new T.Mesh(new T.BoxGeometry(3.2, .06, 1.15), LP.flat('#D9AE72'))), -.05, .47, 0));
    body.add(LP.at(cast(new T.Mesh(new T.BoxGeometry(3.4, .12, 1.7), LP.flat(o.stripe || '#B8323B'))), -.05, .25, 0));
    const stern = cast(new T.Mesh(new T.TorusGeometry(.35, .07, 5, 8, Math.PI), LP.flat('#8A5A2E'))); stern.position.set(-1.85, .75, 0); stern.rotation.set(0, Math.PI / 2, Math.PI / 2); body.add(stern);
    const wood = LP.flat('#5E3C1F');
    body.add(LP.at(cast(new T.Mesh(new T.CylinderGeometry(.06, .08, 3.4, 7), wood)), .1, 2.1, 0));
    const yard = cast(new T.Mesh(new T.CylinderGeometry(.045, .045, 2.6, 6), wood)); yard.rotation.x = Math.PI / 2; yard.position.set(.12, 3.3, 0); body.add(yard);
    const sailGeo = new T.PlaneGeometry(2.4, 2.2, 8, 8); sailGeo.rotateY(Math.PI / 2); const sailBase = sailGeo.attributes.position.array.slice();
    const sail = cast(new T.Mesh(sailGeo, LP.flat('#F3E6C8', { side: T.DoubleSide, emissive: '#3A3020' }))); sail.position.set(.16, 2.15, 0); body.add(sail);
    const band = new T.Mesh(new T.PlaneGeometry(.5, 2.2), LP.flat(o.stripe || '#B8323B', { side: T.DoubleSide })); band.rotation.y = Math.PI / 2; band.position.set(.55, 2.15, 0); body.add(band);
    for (let i = 0; i < 6; i++) { const oar = cast(new T.Mesh(new T.BoxGeometry(.05, .05, 1.1), wood)); oar.position.set(-1 + i * .38, .35, (i % 2 ? 1 : -1) * .9); oar.rotation.x = (i % 2 ? -1 : 1) * .5; body.add(oar); }
    const lantern = new T.Mesh(new T.BoxGeometry(.14, .2, .14), new T.MeshBasicMaterial({ color: '#FFD08A', toneMapped: false })); lantern.position.set(-1.7, 1.2, 0); body.add(lantern);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: LP.glowTexture('255,190,110'), blending: T.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); glow.scale.set(1.4, 1.4, 1); glow.position.copy(lantern.position); body.add(glow);
    const light = new T.PointLight('#FFB66A', 2.2, 5, 2); light.position.set(-1.6, 1.3, 0); body.add(light);
    const deck = new T.Group(); deck.position.y = .5; body.add(deck);      // put cargo here
    function update(t) {
      body.position.y = .08 * Math.sin(t * 1.6); body.rotation.set(.04 * Math.sin(t * 1.3), 0, .03 * Math.sin(t * 1.1));
      const p = sailGeo.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = sailBase[i * 3 + 1], z = sailBase[i * 3 + 2]; p.setX(i, sailBase[i * 3] + .35 * Math.cos(z * 1.25) * (1 - (y + 1.1) / 4) + .04 * Math.sin(t * 2 + z * 2)); }
      p.needsUpdate = true; sailGeo.computeVertexNormals();
    }
    return { g, body, deck, update };
  };
  // A flock of instanced gold coins whose positions come from a function of (i, t).
  LP.coins = function (scene, n = 40, r = .14) {
    const mesh = new T.InstancedMesh(new T.CylinderGeometry(r, r, r * .22, 14), new T.MeshStandardMaterial({ color: '#FFC93C', emissive: '#5A3A00', metalness: .55, roughness: .3 }), n);
    mesh.castShadow = true; scene.add(mesh);
    const d = new T.Object3D();
    function update(t, fn) {
      for (let i = 0; i < n; i++) { const s = fn(i, t, d.position, d.rotation); d.scale.setScalar(Math.max(.0001, s ?? 1)); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix); }
      mesh.instanceMatrix.needsUpdate = true;
    }
    return { mesh, update };
  };

  window.LP = LP;
})();
