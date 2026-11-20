// maglev3d.js - a superconducting maglev in a studio (and outdoors for the speed run), built to come apart (ES module, three r186).
//
//   import { MaglevWorld } from './lib/maglev3d.js';
//   const W = new MaglevWorld(canvas);  W.ST.lev = 1;  W.render(t);  W.screen('scm') -> [x, y]
//
// Units are metres. The guideway runs along x, the train faces +x, the slab top is y = 0. Parts follow the real
// SCMaglev layout (our own body design, no livery copied): superconducting magnet units on each side of every bogie
// face the guideway side walls, where figure-eight levitation/guidance coils sit in front of the propulsion coils.
// Rubber support wheels and side guide wheels fold away once the train floats (~10 cm).
import * as THREE from 'three';
import { Studio, Exploded } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => u * u * (3 - 2 * u);
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}
const noise = new SimplexNoise({ random: (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })() });

// ---------------------------------------------------------------- body loft (superellipse sections)
// prof(s) -> { w, yb, yt, n } for s in [0, L]; the ring angle th: 0 = right side (+z), PI/2 = roof, PI = left, 3PI/2 = floor
function loftBody(L, prof, steps, ring = 96, capStart = true, capEnd = true) {
  const pos = [], uv = [], idx = [];
  const sp = (c, n) => Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, s = L * u, p = prof(s), hb = Math.min(p.hb ?? .5, (p.yt - p.yb) * .32), yc = p.yb + hb, ht = p.yt - yc;
    for (let j = 0; j <= ring; j++) {
      const th = j / ring * TAU, c = Math.cos(th), si = Math.sin(th), top = si >= 0;
      const z = p.w * sp(c, top ? p.n : (p.nb ?? 4.5)), y = yc + (top ? ht : hb) * sp(si, top ? p.n : (p.nb ?? 4.5));
      pos.push(s, y, z); uv.push(u, j / ring);
    }
  }
  const R = ring + 1;
  for (let i = 0; i < steps; i++) for (let j = 0; j < ring; j++) { const a = i * R + j, b = a + R; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const addCap = (i, flip) => { const p = prof(L * i / steps); const c0 = pos.length / 3; const s = L * i / steps, hb = Math.min(p.hb ?? .5, (p.yt - p.yb) * .32); pos.push(s, p.yb + hb, 0); uv.push(i / steps, .25); for (let j = 0; j < ring; j++) { const a = i * R + j; flip ? idx.push(c0, a, a + 1) : idx.push(c0, a + 1, a); } };
  if (capStart) addCap(0, false); if (capEnd) addCap(steps, true);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// livery: white clearcoat, a deep-blue band, a dark window band, cockpit glass on the nose (our own design)
function liveryTex(L, noseLen, isLead) {
  return ctex(4096, 1024, (x, w, h) => {
    const V = v => (1 - v) * h, U = s => s / L * w; const th = a => a / TAU;
    x.fillStyle = '#F3F5F7'; x.fillRect(0, 0, w, h);
    // floor + lower skirt
    x.fillStyle = '#2A3036'; x.fillRect(0, V(th(TAU - .55)), w, V(th(Math.PI + .55)) - V(th(TAU - .55)));
    // blue band (both sides) with a thin light pinstripe
    const band = (a0, a1, col) => { x.fillStyle = col; [[a0, a1], [Math.PI - a1, Math.PI - a0]].forEach(([p, q]) => { const pa = p < 0 ? p + TAU : p, qa = q < 0 ? q + TAU : q; x.fillRect(0, V(th(qa)), w, V(th(pa)) - V(th(qa))); }); };
    band(-.34, -.13, '#173E8C'); band(-.11, -.085, '#4E8EE8');
    // window band: dark glass strip with window frames
    const winStart = isLead ? noseLen + .8 : .9, winEnd = L - .9;
    [[.27, .53], [Math.PI - .53, Math.PI - .27]].forEach(([a0, a1]) => {
      const y0 = V(th(a1)), y1 = V(th(a0));
      x.fillStyle = '#1B2229'; x.fillRect(U(winStart), y0, U(winEnd) - U(winStart), y1 - y0);
      for (let s = winStart + .35; s < winEnd - .6; s += 1.15) { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#3E5568'); g.addColorStop(.5, '#121A21'); g.addColorStop(1, '#2A3A48'); x.fillStyle = g; x.beginPath(); x.roundRect(U(s), y0 + 10, U(s + .62) - U(s), y1 - y0 - 20, 14); x.fill(); }
    });
    if (isLead) { // cockpit windscreen on the nose roof
      const s0 = noseLen * .52, s1 = noseLen * .83; const g = x.createLinearGradient(U(s0), 0, U(s1), 0); g.addColorStop(0, '#0F151B'); g.addColorStop(1, '#2C3E4E'); x.fillStyle = g;
      x.beginPath(); x.ellipse((U(s0) + U(s1)) / 2, V(th(Math.PI / 2)), (U(s1) - U(s0)) / 2, (V(th(Math.PI / 2 - .85)) - V(th(Math.PI / 2 + .85))) / 2, 0, 0, TAU); x.fill();
    }
    // panel seams
    x.strokeStyle = 'rgba(40,50,60,.35)'; x.lineWidth = 3; for (let s = isLead ? noseLen : 0; s < L; s += 4.4) { x.beginPath(); x.moveTo(U(s), 0); x.lineTo(U(s), h); x.stroke(); }
  });
}

// fresnel x-ray shell (the teardown skill's "ghost"): bright at the silhouette, nearly clear face on
const ghostMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uCol: { value: new THREE.Color('#7FB8FF') }, uA: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0-abs(dot(normalize(vN),normalize(vV))),0.0,1.0),2.2); gl_FragColor = vec4(uCol, uA*(0.06+0.75*f)); }' });

// rounded-rect loop as a tube (coil windings)
function loopTube(w, h, r, tube, z = 0, yc = 0) {
  const pts = [], n = 10, hw = w / 2 - r, hh = h / 2 - r;
  [[hw, hh, 0], [-hw, hh, 1], [-hw, -hh, 2], [hw, -hh, 3]].forEach(([cx, cy, q]) => { for (let k = 0; k <= n; k++) { const a = (q + k / n) * Math.PI / 2; pts.push(new THREE.Vector3(cx + r * Math.cos(a), yc + cy + r * Math.sin(a), z)); } });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, tube, 6, true);
}
function racetrack(w, h, rw, depth) { // flat coil ring in the xy plane
  const s = new THREE.Shape(), r = h / 2; s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  const hpath = new THREE.Path(), ri = r - rw; hpath.absarc(-w / 2 + r, 0, ri, Math.PI * 1.5, Math.PI / 2, true); hpath.absarc(w / 2 - r, 0, ri, Math.PI / 2, -Math.PI / 2, true); s.holes.push(hpath);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2, curveSegments: 24 }); g.translate(0, 0, -depth / 2); return g;
}
function tyreGeo(R, wd) { const prof = []; const r0 = R * .62; [[r0, -wd / 2], [R - .06, -wd / 2], [R - .015, -wd / 2 + .03], [R, -wd / 2 + .08], [R, wd / 2 - .08], [R - .015, wd / 2 - .03], [R - .06, wd / 2], [r0, wd / 2]].forEach(([r, y]) => prof.push(new THREE.Vector2(r, y))); return new THREE.LatheGeometry(prof, 64); }
function arrowGeo() { const a = new THREE.CylinderGeometry(.045, .045, .75, 16); a.translate(0, .375, 0); const b = new THREE.ConeGeometry(.12, .3, 24); b.translate(0, .9, 0); return mergeGeometries([a, b]); }

export class MaglevWorld {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#E9EDF1', '#2E363E'], floorY: -.62, fov: 30, exposure: .9, aperture: .00003, bloom: .05, floor: '#8A939B' });
    const s = this.scene = st.scene;
    // lights in metres
    st.key.position.set(14, 26, 18); st.key.angle = .7; st.key.distance = 0; st.key.intensity = 230; st.key.decay = 1.6; st.key.penumbra = .7;
    st.key.shadow.camera.near = 5; st.key.shadow.camera.far = 90; st.key.shadow.bias = -.0004; st.key.shadow.normalBias = .02;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .45, distanceExponent: 1.4, thickness: .6, scale: 1, samples: 12 });
    st.glint.distance = 30; st.glint.decay = 1.4;
    this.studioBg = s.background;

    // ---------------- materials
    const conc = ctex(1024, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; let v = 178 + 9 * noise.noise(xx / 140, yy / 140) + 5 * noise.noise(xx / 14, yy / 14) + 5 * (Math.random() - .5); if (yy % 256 < 3) v -= 30; img.data.set([v, v, v * 1.01, 255], i * 4); } x.putImageData(img, 0, 0); }, true, 2, 1);
    const concB = conc.clone(); concB.colorSpace = THREE.NoColorSpace;
    const brushed = ctex(512, 512, (x, w, h) => { x.fillStyle = '#888'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const y = Math.random() * h; x.fillStyle = `rgba(${Math.random() > .5 ? 255 : 0},${Math.random() > .5 ? 255 : 0},${Math.random() > .5 ? 255 : 0},.06)`; x.fillStyle = Math.random() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; x.fillRect(0, y, w, 1 + Math.random()); } }, false, 3, 1);
    const winding = ctex(256, 256, (x, w, h) => { for (let i = 0; i < h; i += 4) { x.fillStyle = i % 8 ? '#9a9a9a' : '#5c5c5c'; x.fillRect(0, i, w, 4); } }, false, 1, 6);
    const M = this.M = {
      paint: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .32, metalness: .05, clearcoat: 1, clearcoatRoughness: .06 }),
      conc: new THREE.MeshStandardMaterial({ color: '#BFC3C6', map: conc, roughness: .92, bumpMap: concB, bumpScale: .5 }),
      steel: new THREE.MeshStandardMaterial({ color: '#3B434B', roughness: .45, metalness: .7 }),
      stainless: new THREE.MeshStandardMaterial({ color: '#D4D9DE', roughness: .34, metalness: 1, roughnessMap: brushed, bumpMap: brushed, bumpScale: .15, envMapIntensity: 1.5 }),
      polish: new THREE.MeshStandardMaterial({ color: '#E2E6EA', roughness: .08, metalness: 1 }),
      alu: new THREE.MeshStandardMaterial({ color: '#C8CED6', roughness: .3, metalness: .9, transparent: true, opacity: .55 }),
      copper: new THREE.MeshStandardMaterial({ color: '#C9794A', roughness: .3, metalness: 1, bumpMap: winding, bumpScale: .4 }),
      coilCu: new THREE.MeshStandardMaterial({ color: '#B8703F', roughness: .32, metalness: 1 }),
      resin: new THREE.MeshStandardMaterial({ color: '#3C4650', roughness: .35, metalness: .1 }),
      resinP: new THREE.MeshStandardMaterial({ color: '#8C6A3A', roughness: .45, metalness: .1 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#1A1C1E', roughness: .82, metalness: 0 }),
      rim: new THREE.MeshStandardMaterial({ color: '#B9C0C7', roughness: .22, metalness: 1 }),
      dark: new THREE.MeshStandardMaterial({ color: '#23292F', roughness: .5, metalness: .3 }),
      nickel: new THREE.MeshStandardMaterial({ color: '#E8EBEE', roughness: .26, metalness: 1, roughnessMap: brushed, envMapIntensity: 1.6 }),
      red: new THREE.MeshStandardMaterial({ color: '#D6312B', roughness: .3, metalness: .3 }),
      blue: new THREE.MeshStandardMaterial({ color: '#2B5BD6', roughness: .3, metalness: .3 }),
      plinth: new THREE.MeshPhysicalMaterial({ color: '#15181B', roughness: .18, metalness: .2, clearcoat: 1, clearcoatRoughness: .1 }),
    };

    // ---------------- guideway: instanced segments so it can scroll forever for the speed run
    this.SEG = 12; this.PITCH = 1.2; this.NSEG = 30; const NC = this.SEG / this.PITCH;
    this.WALL_IN = 1.75; this.MAG_Y = .78;
    const gw = this.gw = new THREE.Group(); s.add(gw);
    const inst = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; gw.add(m); return m; };
    this.slabI = inst(new RoundedBoxGeometry(this.SEG - .03, .62, 4.8, 2, .03), M.conc, this.NSEG);
    this.wallI = inst(new RoundedBoxGeometry(this.SEG - .03, 1.55, .5, 2, .04), M.conc, this.NSEG * 2);
    this.pierI = inst(new THREE.CylinderGeometry(.9, 1.05, 1, 32), M.conc, this.NSEG);
    // coils on the inner faces of both walls: propulsion coils (ochre resin, big single loop) behind the figure-eight coils
    const fig8 = mergeGeometries([loopTube(.78, .44, .1, .03, 0, .23), loopTube(.78, .44, .1, .03, 0, -.23)]);
    const prop = loopTube(1.08, 1.2, .16, .035, 0, 0);
    const nCo = this.NSEG * NC * 2; this.nCo = nCo;
    this.propPlateI = inst(new RoundedBoxGeometry(1.14, 1.26, .05, 2, .02), M.resinP, nCo);
    this.propCuI = inst(prop, M.coilCu, nCo);
    this.f8PlateI = inst(new RoundedBoxGeometry(.86, 1.0, .05, 2, .02), M.resin, nCo);
    this.f8CuI = inst(fig8, M.coilCu, nCo);
    const glowMat = () => new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.propGlowI = new THREE.InstancedMesh(prop, glowMat(), nCo); this.f8GlowI = new THREE.InstancedMesh(fig8, glowMat(), nCo);
    [this.propGlowI, this.f8GlowI].forEach(m => { m.frustumCulled = false; m.scale.setScalar(1); gw.add(m); m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nCo * 3), 3); });
    this.coilX = new Float32Array(nCo); this.coilSide = new Int8Array(nCo);

    // ---------------- outdoor set for the speed run (hidden in the studio)
    this.outdoor = new THREE.Group(); s.add(this.outdoor); this.outdoor.visible = false;
    const sky = this.sky = new Sky(); sky.scale.setScalar(4000); this.outdoor.add(sky);
    const su = sky.material.uniforms; su.turbidity.value = 2.5; su.rayleigh.value = 2.2; su.mieCoefficient.value = .004; su.mieDirectionalG.value = .85;
    const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(72), THREE.MathUtils.degToRad(200)); su.sunPosition.value.copy(sun);
    const fields = ctex(1024, 1024, (x, w, h) => { const img = x.createImageData(w, h); const pal = [[104, 140, 74], [126, 156, 84], [92, 126, 64], [150, 160, 96], [84, 118, 70], [138, 132, 88]];
      for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const cell = Math.floor((noise.noise(xx / 160, yy / 70) + 1) * 3) % pal.length; const c = pal[cell]; const n = 1 + .08 * noise.noise(xx / 9, yy / 9) + .05 * (Math.random() - .5); const row = (Math.floor(yy / 6) % 2) ? 1 : .96; img.data.set([c[0] * n * row, c[1] * n * row, c[2] * n * row, 255], i * 4); }
      x.putImageData(img, 0, 0); x.strokeStyle = 'rgba(60,70,50,.55)'; x.lineWidth = 3; for (let i = 0; i < 7; i++) { const y = Math.random() * h; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .3, y + 60, w * .6, y - 60, w, y); x.stroke(); } }, true, 14, 14);
    this.fieldTex = fields;
    // a copy smeared along the direction of travel, faded in at speed (reads as motion blur)
    const fb = document.createElement('canvas'); fb.width = fb.height = 1024; const fx = fb.getContext('2d'); fx.globalAlpha = 1 / 18; for (let k = 0; k < 36; k++) { fx.drawImage(fields.image, k * 5 - 90, 0); fx.drawImage(fields.image, k * 5 - 90 + 1024, 0); fx.drawImage(fields.image, k * 5 - 90 - 1024, 0); }
    const fbt = this.fieldBlur = new THREE.CanvasTexture(fb); fbt.colorSpace = THREE.SRGBColorSpace; fbt.wrapS = fbt.wrapT = THREE.RepeatWrapping; fbt.repeat.copy(fields.repeat);
    const ground = this.ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: fields, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -14; ground.receiveShadow = true; this.outdoor.add(ground);
    // distant hills and a big mountain on the horizon (static: far enough that parallax is tiny)
    const hills = new THREE.Group(); this.outdoor.add(hills);
    const hillMat = new THREE.MeshStandardMaterial({ color: '#5F7A86', roughness: 1 });
    for (let k = 0; k < 14; k++) { const r = 160 + 140 * ((k * 37) % 11) / 11; const g = new THREE.ConeGeometry(r, r * .42, 7, 1); const m = new THREE.Mesh(g, hillMat); const a = -1.2 + k * .2; m.position.set(900 * Math.cos(a) + 200, -14 + r * .2, -900 * Math.sin(a) - 300); m.rotation.y = k; hills.add(m); }
    const fuji = new THREE.Mesh(new THREE.ConeGeometry(520, 300, 64, 1, true), new THREE.MeshStandardMaterial({ color: '#6F8794', roughness: 1 })); fuji.position.set(600, 130, -1500); hills.add(fuji);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(150, 86, 64), new THREE.MeshStandardMaterial({ color: '#EEF2F5', roughness: .8 })); cap.position.set(600, 237, -1500); hills.add(cap);
    s.fog = null; this.fog = new THREE.Fog('#CFDCE4', 120, 1600);

    // ---------------- train: lead car (nose) + second car
    this.train = new THREE.Group(); s.add(this.train);
    const NOSE = 14, L1 = 26, L2 = 22;
    const leadProf = sx => { const u = cl(sx / NOSE), tk = Math.sqrt(cl((L1 - sx) / .6)); const w = sx < NOSE ? Math.max(.05, 1.48 * Math.pow(1 - Math.pow(1 - u, 1.7), .75)) : 1.48; const yb = 1.55 + .25 * Math.pow(1 - u, 3);
      const yt = sx < NOSE ? 1.85 + 2.5 * (1 - Math.pow(1 - u, 2.3)) : 4.35; return { w: sx < NOSE ? w : w * (.86 + .14 * tk), yb, yt: Math.max(yb + .12, sx < NOSE ? yt : yt - .25 * (1 - tk)), n: sx < NOSE ? 2.2 + .5 * u : 2.7, nb: 4.5, hb: .5 }; };
    const leadGeo = loftBody(L1, s0 => leadProf(L1 - s0), 150, 128, true, true); // s0 = 0 at the tail, L1 at the nose tip
    const leadTex = liveryTex(L1, NOSE, true); // painted from the nose: flip u
    leadTex.repeat.x = -1; leadTex.offset.x = 1;
    const paintL = M.paint.clone(); paintL.map = leadTex;
    this.lead = new THREE.Mesh(leadGeo, paintL); this.lead.position.x = -12; this.lead.castShadow = this.lead.receiveShadow = true; this.train.add(this.lead);
    const car2Prof = sx => { const e = Math.min(sx, L2 - sx), k = cl(e / .6); return { w: 1.48 * (.86 + .14 * Math.sqrt(k)), yb: 1.55, yt: 4.35 - .25 * (1 - Math.sqrt(k)), n: 2.7, nb: 4.5, hb: .5 }; };
    const car2 = new THREE.Mesh(loftBody(L2, car2Prof, 60, 128), (() => { const m = M.paint.clone(); m.map = liveryTex(L2, 0, false); return m; })()); car2.position.x = -12 - .7 - L2; car2.castShadow = car2.receiveShadow = true; this.train.add(car2);
    const gang = new THREE.Mesh(new RoundedBoxGeometry(1.2, 2.6, 2.4, 3, .2), M.dark); gang.position.set(-12.35, 2.95, 0); this.train.add(gang);
    this.bodies = [this.lead, car2, gang];
    // x-ray ghosts of the bodies
    this.ghosts = [this.lead, car2].map(b => { const g = new THREE.Mesh(b.geometry, ghostMat()); g.position.copy(b.position); g.visible = false; g.renderOrder = 5; this.train.add(g); return g; });
    this.leadNoseX = this.lead.position.x + L1;

    // ---------------- bogies: the front one (under the nose root) is the anatomy hero
    this.bogies = [0, -12.35, -33.5].map((bx, i) => this.buildBogie(bx, i === 0));
    this.hero = this.bogies[0];

    // ---------------- two magnets (hook + callback) on a black plinth
    this.magG = new THREE.Group(); s.add(this.magG); this.buildMagnets();
    // ---------------- the 1934 sheet
    this.paperG = new THREE.Group(); s.add(this.paperG); this.buildPaper();
    // ---------------- force arrows (levitation up, guidance to the centre)
    const aG = arrowGeo(), aM = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, toneMapped: false, depthTest: false });
    this.arrows = { up: [], in: [] };
    [-1, 1].forEach(side => { const up = new THREE.Mesh(aG, aM('#FFB238')); up.renderOrder = 9; s.add(up); this.arrows.up.push({ m: up, side });
      const inn = new THREE.Mesh(aG, aM('#4FD8FF')); inn.renderOrder = 9; s.add(inn); this.arrows.in.push({ m: inn, side }); });
    this.pushPull = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(aG, aM(i < 2 ? '#4FD8FF' : '#FF6A4F')); m.renderOrder = 9; s.add(m); return m; });

    // speed streaks for the run
    const sg = new THREE.BufferGeometry(); const N = 260, sp = new Float32Array(N * 6); this.streakSeed = []; for (let i = 0; i < N; i++) this.streakSeed.push([Math.random() * 400 - 200, (Math.random() - .3) * 18, (Math.random() - .5) * 60]); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.streaks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false })); this.streaks.frustumCulled = false; s.add(this.streaks);

    this.ST = { cam: { px: 6, py: 3, pz: 9, tx: 0, ty: 1.2, tz: 0, fov: 30 }, aperture: .00003, mode: 0, magY: 3.2, field: 0, flow: 0,
      dist: 0, speed: 0, lev: 0, wheels: 1, explode: 0, bodyLift: 0, ghost: 0, cold: 0, f8: 0, prop: 0, propPhase: 0, forces: 0, pushPull: 0,
      gwLen: 30, gwY: 0, cutNear: 0, xray: 0, exposure: .92, sweep: 0, shake: 0, coilOpen: 0, streak: 0, trainX: 0, magBob: 1 };
    this.layoutGuideway(0);
  }

  // ---------------------------------------------------------------- bogie (frame, 2 superconducting magnet units, wheels)
  buildBogie(bx, hero) {
    const M = this.M, g = new THREE.Group(); g.position.x = bx; this.train.add(g); const ex = new Exploded(); ex.spread = 1;
    const add = (p, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
    // frame: two side beams, cross beams, a centre pivot under the body
    const frame = new THREE.Group(); g.add(frame);
    [-1, 1].forEach(sz => add(frame, new THREE.Mesh(new RoundedBoxGeometry(4.6, .34, .3, 2, .05), M.steel), 0, 1.12, sz * .98));
    [-1.6, 0, 1.6].forEach(x => add(frame, new THREE.Mesh(new RoundedBoxGeometry(.32, .3, 2.1, 2, .05), M.steel), x, 1.12, 0));
    add(frame, new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .3, 32), M.polish), 0, 1.4, 0);
    [-1, 1].forEach(sz => [-1, 1].forEach(sx => add(frame, new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .26, 24), M.dark), sx * 1.1, 1.42, sz * .7))); // air springs
    ex.add(frame, { off: [0, 0, 0], at: 0, label: hero ? 'Bogie frame' : null, anchor: [-1.6, 1.12, .98] });
    const parts = { frame, scm: [], coils: [], wheels: [], guides: [], tanks: [], shells: [] };
    [-1, 1].forEach(sz => {
      // superconducting magnet unit, facing the wall at z = sz * 1.75
      const scm = new THREE.Group(); scm.position.set(0, this.MAG_Y, sz * 1.38); g.add(scm);
      const back = add(scm, new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.02, .14, 3, .05), M.stainless), 0, 0, -sz * .07);
      const shield = add(scm, new THREE.Mesh(new RoundedBoxGeometry(3.95, .86, .1, 2, .03), M.alu), 0, 0, sz * .05); shield.castShadow = false;
      const coils = []; [-1.5, -.5, .5, 1.5].forEach((x, i) => { const c = add(scm, new THREE.Mesh(racetrack(.88, .66, .14, .06), M.copper), x, 0, sz * .07); coils.push(c); });
      const glow = coils.map(c => { const m = new THREE.Mesh(c.geometry, new THREE.MeshBasicMaterial({ color: '#000000', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); m.position.copy(c.position); m.scale.setScalar(1.02); scm.add(m); return m; });
      const front = add(scm, new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.02, .05, 3, .02), M.stainless), 0, 0, sz * .14);
      const tank = add(scm, new THREE.Mesh(new THREE.CapsuleGeometry(.15, 3.3, 8, 24), M.polish), 0, .66, 0); tank.rotation.z = Math.PI / 2;
      const cooler = new THREE.Group(); scm.add(cooler); cooler.position.set(.4, .86, 0); add(cooler, new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .42, 24), M.stainless), 0, .1, 0); for (let k = 0; k < 6; k++) add(cooler, new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .02, 24), M.polish), 0, -.05 + k * .05, 0);
      // frost (points) on the cold unit
      const fp = []; for (let i = 0; i < 260; i++) fp.push((Math.random() - .5) * 4.2, (Math.random() - .5) * 1.0, sz * (.17 + Math.random() * .03));
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
      const frost = new THREE.Points(fg, new THREE.PointsMaterial({ color: '#EAF6FF', size: .035, transparent: true, opacity: 0, depthWrite: false })); scm.add(frost);
      if (hero) {
        const side = sz > 0 ? 1 : -1;
        ex.add(scm, { off: [0, 0, sz * 1.1], at: .1, len: .5, label: sz > 0 ? 'Superconducting magnet' : null, anchor: [-2.1, -.2, sz * .1], side });
        ex.add(front, { off: [0, 1.5, sz * .45], at: .3, len: .4, label: sz > 0 ? 'Cryostat shell' : null, anchor: [2.1, .3, 0], side });
        ex.add(shield, { off: [0, .8, sz * .25], at: .34, len: .4 });
        coils.forEach((c, i) => ex.add(c, { off: [0, 0, sz * .42], at: .4 + i * .02, len: .4, label: sz > 0 && i === 3 ? 'NbTi coils' : null, anchor: [.44, 0, 0], side }));
        glow.forEach((m, i) => ex.add(m, { off: [0, 0, sz * .42], at: .4 + i * .02, len: .4 }));
        ex.add(tank, { off: [0, 2.3, 0], at: .3, len: .45, label: sz > 0 ? 'Liquid-helium tank' : null, anchor: [0, 0, 0], side: -1 });
        ex.add(cooler, { off: [0, 2.9, 0], at: .32, len: .45 });
        ex.add(frost, { off: [0, 1.5, sz * .45], at: .3, len: .4 });
      }
      parts.scm.push({ scm, sz, coils, glow, frost, back, front }); parts.shells.push(back, front);
      // rubber support wheels on folding struts (pivot at the frame), and horizontal guide wheels at the ends
      [-1, 1].forEach(sx => {
        const strut = new THREE.Group(); strut.position.set(sx * 1.55, 1.05, sz * .62); g.add(strut);
        const arm = add(strut, new THREE.Mesh(new RoundedBoxGeometry(.16, .7, .16, 2, .04), M.steel), -sx * .18, -.3, 0); arm.rotation.z = sx * .5;
        const wheel = new THREE.Group(); wheel.position.set(-sx * .32, -.63, 0); strut.add(wheel);
        const tyre = add(wheel, new THREE.Mesh(tyreGeo(.42, .3), M.rubber)); tyre.rotation.x = Math.PI / 2;
        const rim = add(wheel, new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .31, 32), M.rim)); rim.rotation.x = Math.PI / 2;
        for (let k = 0; k < 5; k++) { const b = add(wheel, new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .33, 8), M.dark), .15 * Math.cos(k * TAU / 5), .15 * Math.sin(k * TAU / 5), 0); b.rotation.x = Math.PI / 2; }
        parts.wheels.push({ strut, wheel, sx });
        if (hero) ex.add(strut, { off: [0, -.9, sz * .2], at: .5, len: .4, label: sz > 0 && sx > 0 ? 'Rubber tyres' : null, anchor: [-sx * .32, -.63, sz * .16], side: 1 });
        const gw = new THREE.Group(); gw.position.set(sx * 2.42, this.MAG_Y, sz * 1.47); g.add(gw);
        add(gw, new THREE.Mesh(tyreGeo(.23, .16), M.rubber)); add(gw, new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .17, 24), M.rim));
        add(gw, new THREE.Mesh(new RoundedBoxGeometry(.3, .12, .3, 2, .03), M.steel), -sx * .18, .12, -sz * .12);
        parts.guides.push({ gw, sz, sx, base: gw.position.clone() });
        if (hero) ex.add(gw, { off: [sx * .9, 0, sz * .4], at: .52, len: .4, label: sz > 0 && sx > 0 ? 'Guide wheels' : null, anchor: [0, .2, 0], side: 1 });
      });
    });
    g.traverse(m => { if (m.isMesh && m.material !== M.alu && !m.material.blending) { m.castShadow = true; m.receiveShadow = true; } });
    return { g, ex, parts, hero, bx };
  }

  // ---------------------------------------------------------------- the two magnets and their field
  buildMagnets() {
    const M = this.M, g = this.magG; g.visible = false;
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(5.2, .6, 5.2, 4, .05), M.plinth); plinth.position.y = -.3; plinth.receiveShadow = true; g.add(plinth);
    const letter = (ch, col) => ctex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = col; x.font = '800 190px Inter, FreeSans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, w / 2, h / 2 + 8); });
    const block = (nUp) => { const b = new THREE.Group(); const body = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.0, 1.0, 4, .07), M.nickel); body.castShadow = body.receiveShadow = true; b.add(body);
      // thin anodised pole bands (red = north, blue = south) and the letter on the north face's side
      const bandN = new THREE.Mesh(new RoundedBoxGeometry(1.012, .16, 1.012, 2, .03), M.red), bandS = new THREE.Mesh(new RoundedBoxGeometry(1.012, .16, 1.012, 2, .03), M.blue);
      bandN.position.y = nUp ? .38 : -.38; bandS.position.y = nUp ? -.38 : .38; b.add(bandN, bandS);
      [[0, 0, .507, 0], [.507, 0, 0, Math.PI / 2]].forEach(([x, y, z, ry]) => { [['N', nUp ? .16 : -.16, '#D6312B'], ['S', nUp ? -.16 : .16, '#2B5BD6']].forEach(([ch, yy, col]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.26, .26), new THREE.MeshStandardMaterial({ map: letter(ch, col), transparent: true, roughness: .4, metalness: .2 })); p.position.set(x, yy, z); p.rotation.y = ry; b.add(p); }); });
      g.add(b); return b; };
    this.magA = block(true); this.magA.position.y = .5;      // bottom magnet, north face up
    this.magB = block(false);                               // top magnet, north face down: they repel
    // field lines: magnetic charges on the faces, traced in the (rho, y) half plane and revolved about the shared axis
    this.fieldG = new THREE.Group(); g.add(this.fieldG);
    const flow = this.flowTex = ctex(256, 8, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.7, 'rgba(255,255,255,.9)'); gr.addColorStop(.78, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }, true, 6, 1);
    this.fieldMat = new THREE.MeshBasicMaterial({ color: '#7FDcFF', map: flow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.fieldBase = new THREE.MeshBasicMaterial({ color: '#3FA8FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.buildField(2.25);
  }
  buildField(gapTopY) { // magnets: A spans y 0..1 (N at 1), B spans gapTopY..gapTopY+1 (N at gapTopY)
    this.fieldG.clear();
    const Q = [], face = (y, q) => { for (const r of [0, .22, .38]) Q.push({ y, r, q: q * (r ? 1 : .6) }); };
    face(1, 1); face(0, -1); face(gapTopY, 1); face(gapTopY + 1, -1);
    // ring charges approximated by 12 points around the axis, evaluated in the xz plane (rho along x)
    const B = (rho, y) => { let bx = 0, by = 0; for (const c of Q) { const n = c.r ? 12 : 1; for (let k = 0; k < n; k++) { const a = k / n * TAU, cx = c.r * Math.cos(a), cz = c.r * Math.sin(a); const dx = rho - cx, dz = -cz, dy = y - c.y, d2 = dx * dx + dy * dy + dz * dz + 1e-4, f = c.q / n / (d2 * Math.sqrt(d2)); bx += f * dx; by += f * dy; } } return [bx, by]; };
    const inside = (rho, y) => Math.abs(rho) < .5 && ((y > .02 && y < .98) || (y > gapTopY + .02 && y < gapTopY + .98));
    const lines = [];
    const trace = (rho, y, dir) => { const pts = [[rho, y]]; for (let i = 0; i < 700; i++) { const [bx, by] = B(rho, y), m = Math.hypot(bx, by) || 1, h = .022 * dir; const mx = rho + bx / m * h / 2, my = y + by / m * h / 2; const [b2x, b2y] = B(mx, my), m2 = Math.hypot(b2x, b2y) || 1; rho += b2x / m2 * h; y += b2y / m2 * h; if (rho < 0) break; if (inside(rho, y) || Math.hypot(rho, y - gapTopY / 2) > 4.2 || y < .0) break; pts.push([rho, y]); } return pts; };
    [.06, .16, .26, .36, .45].forEach(r0 => { lines.push(trace(r0, 1.03, 1)); lines.push(trace(r0, gapTopY - .03, 1)); });
    [.2, .45, .7].forEach(y0 => { lines.push(trace(.53, y0, 1)); lines.push(trace(.53, gapTopY + y0, 1)); });
    const geos = [], geosB = [];
    for (let k = 0; k < 10; k++) { const phi = k / 10 * TAU + .15; lines.forEach(pl => { if (pl.length < 8) return; const pts = pl.filter((_, i) => i % 3 === 0).map(([r, y]) => new THREE.Vector3(r * Math.cos(phi), y, r * Math.sin(phi))); if (pts.length < 4) return; const c = new THREE.CatmullRomCurve3(pts); geos.push(new THREE.TubeGeometry(c, Math.min(160, pts.length * 2), .009, 5, false)); geosB.push(new THREE.TubeGeometry(c, Math.min(160, pts.length * 2), .005, 4, false)); }); }
    const a = new THREE.Mesh(mergeGeometries(geos), this.fieldMat), b = new THREE.Mesh(mergeGeometries(geosB), this.fieldBase); a.renderOrder = b.renderOrder = 6; this.fieldG.add(b, a);
  }

  // ---------------------------------------------------------------- 1934 sheet (our own schematic, not the patent drawing)
  buildPaper() {
    const g = this.paperG; g.visible = false;
    const t = ctex(1240, 1754, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#F4ECD8'); gr.addColorStop(1, '#E6D9BC'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(120,90,50,${Math.random() * .05})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      x.strokeStyle = '#2A2622'; x.fillStyle = '#2A2622'; x.lineWidth = 4; x.font = '600 54px "Courier 10 Pitch", FreeMono, monospace'; x.textAlign = 'center';
      x.fillText('MAGNETIC SUSPENSION RAILWAY', w / 2, 170); x.font = '500 40px "Courier 10 Pitch", FreeMono, monospace'; x.fillText('vehicle without wheels', w / 2, 232);
      x.beginPath(); x.moveTo(140, 270); x.lineTo(w - 140, 270); x.stroke();
      // side elevation: a long body floating above a rail, magnets drawn in the gap
      const y0 = 760; x.lineWidth = 5; x.beginPath(); x.moveTo(180, y0); x.lineTo(900, y0); x.quadraticCurveTo(1060, y0 - 10, 1080, y0 - 160); x.quadraticCurveTo(1000, y0 - 330, 820, y0 - 330); x.lineTo(240, y0 - 330); x.quadraticCurveTo(180, y0 - 330, 180, y0 - 260); x.closePath(); x.stroke();
      for (let k = 0; k < 6; k++) { x.strokeRect(280 + k * 105, y0 - 280, 70, 90); }
      x.lineWidth = 3; for (let k = 0; k < 7; k++) { x.strokeRect(240 + k * 110, y0 + 18, 80, 34); }
      x.lineWidth = 6; x.beginPath(); x.moveTo(140, y0 + 96); x.lineTo(w - 140, y0 + 96); x.stroke(); x.lineWidth = 3; for (let k = 0; k < 18; k++) { x.beginPath(); x.moveTo(160 + k * 52, y0 + 96); x.lineTo(130 + k * 52, y0 + 140); x.stroke(); }
      x.setLineDash([12, 10]); x.beginPath(); x.moveTo(1120, y0 + 52); x.lineTo(1120, y0 + 96); x.stroke(); x.setLineDash([]); x.font = '500 34px "Courier 10 Pitch", FreeMono, monospace'; x.textAlign = 'left'; x.fillText('gap', 1060, y0 + 140);
      // cross-section
      const cx = w / 2, cy = 1250; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, cy - 60, 190, 170, 0, Math.PI, 0); x.lineTo(cx + 190, cy + 40); x.lineTo(cx - 190, cy + 40); x.closePath(); x.stroke();
      x.strokeRect(cx - 230, cy + 60, 80, 50); x.strokeRect(cx + 150, cy + 60, 80, 50); x.lineWidth = 7; x.beginPath(); x.moveTo(cx - 300, cy + 150); x.lineTo(cx + 300, cy + 150); x.stroke();
      x.textAlign = 'center'; x.font = '500 34px "Courier 10 Pitch", FreeMono, monospace'; x.fillText('fig. 1', 300, y0 + 220); x.fillText('fig. 2', cx, cy + 230);
      x.font = '500 30px "Courier 10 Pitch", FreeMono, monospace'; x.fillStyle = 'rgba(42,38,34,.75)'; x.fillText('schematic redrawn for illustration', w / 2, h - 90);
    }, true);
    const geo = new THREE.PlaneGeometry(2.1, 2.97, 40, 56); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, .05 * Math.pow(Math.abs(x) / 1.05, 3) + .03 * Math.sin(y * 1.3)); } geo.computeVertexNormals();
    const sheet = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: .9, side: THREE.DoubleSide })); sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = .12; sheet.position.y = .02; sheet.castShadow = sheet.receiveShadow = true; g.add(sheet);
    const desk = new THREE.Mesh(new RoundedBoxGeometry(6, .3, 6, 4, .04), new THREE.MeshStandardMaterial({ color: '#4A3526', roughness: .55 })); desk.position.y = -.16; desk.receiveShadow = true; g.add(desk);
    const pen = new THREE.Mesh(new THREE.CapsuleGeometry(.035, .9, 6, 16), new THREE.MeshStandardMaterial({ color: '#141414', roughness: .2, metalness: .5 })); pen.rotation.z = Math.PI / 2; pen.rotation.y = .7; pen.position.set(1.3, .06, .6); pen.castShadow = true; g.add(pen);
    this.sheet = sheet;
  }

  // ---------------------------------------------------------------- guideway layout (scroll + visible length)
  layoutGuideway(dist) {
    const SEG = this.SEG, N = this.NSEG, NC = SEG / this.PITCH, m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
    const off = ((dist % SEG) + SEG) % SEG, len = this.ST ? this.ST.gwLen : 30, outdoor = this.ST && this.ST.mode === 3;
    let ci = 0;
    for (let i = 0; i < N; i++) {
      const x = (i - N / 2) * SEG - off + SEG / 2, vis = Math.abs(x) - SEG / 2 <= len + .01 ? 1 : 0;
      sc.set(vis, vis, vis); q.identity();
      m.compose(v.set(x, -.31, 0), q, sc); this.slabI.setMatrixAt(i, m);
      m.compose(v.set(x, .775, this.WALL_IN + .25), q, sc); this.wallI.setMatrixAt(i * 2, m);
      const cn = this.ST && this.ST.cutNear ? 0 : vis; m.compose(v.set(x, .775, -this.WALL_IN - .25), q, sc.set(cn, cn, cn)); this.wallI.setMatrixAt(i * 2 + 1, m); sc.set(vis, vis, vis);
      const ps = outdoor && vis ? 1 : 0; m.compose(v.set(x, -.62 - 11, 0), q, sc.set(ps, ps ? 22 : 0, ps)); this.pierI.setMatrixAt(i, m); sc.set(vis, vis, vis);
      for (let k = 0; k < NC; k++) {
        const cx = x - SEG / 2 + (k + .5) * this.PITCH;
        [-1, 1].forEach(sz => {
          const vv = sz < 0 && this.ST && this.ST.cutNear >= 2 ? 0 : vis; sc.set(vv, vv, vv);
          const ry = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sz > 0 ? Math.PI : 0);
          const pl = sz < 0 && this.ST && this.ST.cutNear ? 0 : vis; sc.set(pl, pl, pl);
          m.compose(v.set(cx, this.MAG_Y, sz * (this.WALL_IN - .028)), ry, sc); this.propPlateI.setMatrixAt(ci, m);
          sc.set(vv, vv, vv);
          m.compose(v.set(cx, this.MAG_Y, sz * (this.WALL_IN - .06)), ry, sc); this.propCuI.setMatrixAt(ci, m); m.compose(v.set(cx, this.MAG_Y, sz * (this.WALL_IN - .068)), ry, sc); this.propGlowI.setMatrixAt(ci, m);
          sc.set(pl, pl, pl); m.compose(v.set(cx, this.MAG_Y, sz * (this.WALL_IN - .085)), ry, sc); this.f8PlateI.setMatrixAt(ci, m); sc.set(vv, vv, vv);
          m.compose(v.set(cx, this.MAG_Y, sz * (this.WALL_IN - .115)), ry, sc); this.f8CuI.setMatrixAt(ci, m); m.compose(v.set(cx, this.MAG_Y, sz * (this.WALL_IN - .124)), ry, sc); this.f8GlowI.setMatrixAt(ci, m);
          this.coilX[ci] = vv ? cx : 1e9; this.coilSide[ci] = sz; ci++;
        });
      }
    }
    [this.slabI, this.wallI, this.pierI, this.propPlateI, this.propCuI, this.f8PlateI, this.f8CuI, this.propGlowI, this.f8GlowI].forEach(im => im.instanceMatrix.needsUpdate = true);
  }

  // world position of a named feature, for 2D labels
  anchor(name) {
    const h = this.hero, P = h.parts, v = new THREE.Vector3();
    const at = (o, x, y, z) => o.localToWorld(v.set(x, y, z));
    switch (name) {
      case 'body': return at(this.lead, 18, 4.3, 0);
      case 'scm': return at(P.scm[1].scm, -1.2, -.2, .15);
      case 'coil': return at(P.scm[1].coils[2], 0, .34, .05);
      case 'tank': return at(P.scm[1].scm, -1.2, .66, 0);
      case 'wheel': return at(P.wheels[3].wheel, 0, 0, .16);
      case 'wallF8': return v.set(1.8, this.MAG_Y + .5, this.WALL_IN - .12);
      case 'wallProp': return v.set(3.0, this.MAG_Y - .55, this.WALL_IN - .06);
      case 'gapTop': return v.set(0, this.MAG_Y, this.WALL_IN);
      case 'front': return v.set(this.hero.g.position.x + 3.3, this.MAG_Y + 1.15, -1.6).add(this.train.position);
      case 'back': return v.set(this.hero.g.position.x - 3.3, this.MAG_Y + 1.15, -1.6).add(this.train.position);
      case 'nose': return v.set(this.leadNoseX - 2, 2.2, 0).add(this.train.position);
      case 'magGap': return v.set(0, (1 + this.ST.magY) / 2, 0).add(this.magG.position);
      default: return v.set(0, 0, 0);
    }
  }
  screen(name) { this.train.updateMatrixWorld(true); return this.studio.project(this.anchor(name)); }
  // labelled exploded parts of the hero bogie -> [{ label, side, u, x, y }]
  explodedLabels() { this.train.updateMatrixWorld(true); return this.hero.ex.anchors().map(({ p, world }) => { const [x, y, z] = this.studio.project(world); return { label: p.label, side: p.side, u: p.u ?? 0, x, y, z }; }); }

  // ---------------------------------------------------------------- one frame
  render(t) {
    const S = this.ST, st = this.studio, s = this.scene;
    st.renderer.toneMappingExposure = S.exposure;
    const mode = S.mode; // 0 magnets, 1 train studio, 2 paper, 3 outdoor run
    this.magG.visible = mode === 0; this.paperG.visible = mode === 2; this.outdoor.visible = mode === 3;
    const showTrain = mode === 1 || mode === 3; this.train.visible = showTrain; this.gw.visible = showTrain;
    st.floor.visible = mode !== 3; s.background = mode === 3 ? null : this.studioBg; s.fog = mode === 3 ? this.fog : null;
    s.environmentIntensity = mode === 3 ? .6 : .9;
    // ---- magnets
    if (mode === 0) {
      const bob = .025 * Math.sin(t * 2.1) * S.magBob; this.magB.position.y = S.magY + .5 + bob; this.magB.rotation.y = .3 + .05 * Math.sin(t * .7);
      this.magA.rotation.y = .3;
      this.fieldMat.opacity = S.field * .8; this.fieldBase.opacity = S.field * .55; this.flowTex.offset.x = -t * .55; this.fieldG.position.y = bob * .5;
    }
    // ---- train pose
    const lev = sm(cl(S.lev)), rise = .1 * lev;
    this.train.position.set(S.trainX, rise, 0);
    const dist = S.dist; this.gw.position.y = S.gwY;
    this.layoutGuideway(dist);
    // wheels: deploy (1 down) / tuck (0 up), and roll with distance
    this.bogies.forEach(b => {
      b.ex.set(b.hero ? S.explode : 0);
      b.parts.wheels.forEach(w => { if (!b.hero || S.explode < .5) w.strut.rotation.z = w.sx * (1 - S.wheels) * 1.25; w.wheel.rotation.z = -dist / .42; });
      b.parts.guides.forEach(gw => { if (!b.hero || S.explode < .5) gw.gw.position.z = gw.base.z - gw.sz * (1 - S.wheels) * .28; gw.gw.rotation.y = dist / .23 * gw.sz; });
      b.parts.scm.forEach(u => { u.frost.material.opacity = 0; u.back.visible = u.front.visible = !S.xray; });
    });
    this.M.stainless.color.set(new THREE.Color('#D4D9DE').lerp(new THREE.Color('#EEF6FF'), S.cold)); this.M.stainless.metalness = 1 - .55 * S.cold; this.M.stainless.roughness = .34 + .4 * S.cold;
    // body lift (anatomy) and x-ray ghost
    const gh = cl(S.ghost);
    this.bodies.forEach(b => { b.position.y = S.bodyLift * 4.2; b.visible = gh < .98; const tr = gh > .01; if (b.material.transparent !== tr) { b.material.transparent = tr; b.material.needsUpdate = true; } b.material.opacity = 1 - gh; b.material.depthWrite = gh < .5; });
    this.ghosts.forEach((g, i) => { g.visible = gh > .01; g.position.y = this.bodies[i].position.y; g.material.uniforms.uA.value = gh; });
    // ---- coil glows
    const hx = this.hero.g.position.x + S.trainX, lam = this.PITCH * 2;
    const f8c = new THREE.Color(), pc = new THREE.Color(), RED = new THREE.Color('#FF4A3A'), BLU = new THREE.Color('#3A7BFF'), CY = new THREE.Color('#1FB4FF');
    for (let i = 0; i < this.nCo; i++) {
      const x = this.coilX[i];
      if (x > 1e8) { this.f8GlowI.instanceColor.setXYZ(i, 0, 0, 0); this.propGlowI.instanceColor.setXYZ(i, 0, 0, 0); continue; }
      // figure-eight coils light up where the magnets pass (all bogies)
      let near = 0; this.bogies.forEach(b => { near = Math.max(near, 1 - cl(Math.abs(x - (b.g.position.x + S.trainX)) / 2.6)); });
      f8c.copy(CY).multiplyScalar(S.f8 * (.15 + 1.6 * near * near));
      this.f8GlowI.instanceColor.setXYZ(i, f8c.r, f8c.g, f8c.b);
      // propulsion coils: a travelling north/south wave locked to the train
      const ph = Math.sin(TAU * (x - S.trainX) / lam + S.propPhase), pol = Math.sign(ph) * Math.pow(Math.abs(ph), .35);
      pc.copy(pol > 0 ? RED : BLU).multiplyScalar(S.prop * Math.abs(pol) * 1.4);
      this.propGlowI.instanceColor.setXYZ(i, pc.r, pc.g, pc.b);
    }
    this.f8GlowI.instanceColor.needsUpdate = true; this.propGlowI.instanceColor.needsUpdate = true;
    // train magnet coils: alternate N/S (glow in the propulsion shot)
    this.bogies.forEach(b => b.parts.scm.forEach(u => u.glow.forEach((m, k) => { const c = (k % 2 ? BLU : RED).clone().multiplyScalar(S.prop * 1.3 + S.coilOpen * .0); m.material.color.copy(c); })));
    // ---- arrows
    const A = this.arrows, fz = S.forces;
    A.up.forEach(({ m, side }) => { m.visible = fz > .01; m.position.set(hx - 2.4, this.MAG_Y - .9 + rise, side * 1.25); m.scale.setScalar(.8 * fz); m.rotation.set(0, 0, 0); m.material.opacity = fz; });
    const gz = cl(S.forces * 2 - 1);
    A.in.forEach(({ m, side }) => { m.visible = gz > .01; m.position.set(hx + 2.6, this.MAG_Y + rise, side * (this.WALL_IN + .05)); m.rotation.set(-side * Math.PI / 2, 0, 0); m.scale.setScalar(.6 * gz); m.material.opacity = gz; });
    const pp = S.pushPull; this.pushPull.forEach((m, i) => { m.visible = pp > .01; const front = i < 2, sz = i % 2 ? 1 : -1; const bxw = hx + (front ? 2.9 : -2.9); m.position.set(bxw + (front ? .9 : -.9) * 0, this.MAG_Y + .9 + rise, sz * 1.6); m.rotation.set(0, 0, -Math.PI / 2); m.scale.setScalar(.75 * pp * (1 + .08 * Math.sin(t * 9 + i))); m.material.opacity = pp; });
    // ---- outdoor run: elevated guideway, ground and streaks
    if (mode === 3) {
      this.gw.position.y = 8; this.train.position.y += 8;
      const fo = dist / 3000 * this.fieldTex.repeat.x; this.fieldTex.offset.x = fo; this.fieldBlur.offset.x = fo; this.ground.material.map = S.speed > .5 ? this.fieldBlur : this.fieldTex;
      const sp = this.streaks.geometry.attributes.position, L = 4 + S.speed * 22; this.streaks.material.opacity = S.streak * .55;
      this.streakSeed.forEach(([x0, y0, z0], i) => { const x = ((x0 - dist * 1.0) % 400 + 600) % 400 - 200; sp.setXYZ(i * 2, x, y0 + 8, z0); sp.setXYZ(i * 2 + 1, x + L, y0 + 8, z0); }); sp.needsUpdate = true;
    } else this.streaks.material.opacity = 0;
    // ---- camera, light sweep
    const c = S.cam, sh = S.shake;
    st.look(c.px + sh * Math.sin(t * 37), c.py + sh * Math.sin(t * 41 + 1), c.pz + sh * Math.cos(t * 29), c.tx, c.ty, c.tz, c.fov);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.glint.intensity = 60 * Math.sin(Math.PI * cl(S.sweep)); st.glint.position.set(c.tx - 8 + 16 * S.sweep, c.ty + 4, c.tz + 5);
    if (mode === 3) { st.key.position.set(c.tx + 30, 70, c.tz + 40); st.key.target.position.set(c.tx, 8, c.tz); } else { st.key.position.set(c.tx + 14, 26, c.tz + 18); st.key.target.position.set(c.tx, c.ty * .3, c.tz); }
    st.key.target.updateMatrixWorld();
    st.render();
  }
}
