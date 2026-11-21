// gold3d.js - one premium jeweller's counter for the gold-price reel (ES module, three r186).
//
//   import { GoldWorld } from './lib/gold3d.js';
//   const W = new GoldWorld(canvas);  W.ST.tilt = .2;  W.render(t);  W.screen('panR') -> [x, y]
//
// Units are metres; the counter top is y = 0, the camera mostly looks from +z. Everything stays on one set:
// a brass jeweller's scale (gold on the left pan, the causes drop onto the right pan), a split-flap rate board on
// the wall, two towers of gold bars (a 3D chart), a gauge, a Kerala steel almirah, an AI chip with a share line.
// Notes are plain green bundles with a "$" band, not real banknote art.
import * as THREE from 'three';
import { Studio } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const rnd = (() => { let s = 23; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const noise = new SimplexNoise({ random: rnd });
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}
const ML = '"FreeSans", sans-serif', LAT = '"Inter", "FreeSans", sans-serif';
function lathe(pts, seg = 96) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
// fine scratches / polish marks: roughness variation for metals
const scratchTex = (rep = 2) => ctex(512, 512, (x, w, h) => { x.fillStyle = '#5c5c5c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const a = rnd() * TAU, l = 8 + rnd() * 60, X = rnd() * w, Y = rnd() * h; x.strokeStyle = `rgba(${rnd() < .5 ? 150 : 30},${rnd() < .5 ? 150 : 30},${rnd() < .5 ? 150 : 30},.25)`; x.lineWidth = .6 + rnd(); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); } }, false, rep, rep);

export class GoldWorld {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#FFF7EA', '#8C7558'], floorY: 0, fov: 30, exposure: 1.0, aperture: .00003, bloom: .08, floor: '#EEE6DA', env: 1.0 });
    const s = this.scene = st.scene;
    st.key.position.set(1.5, 3.2, 2.2); st.key.angle = .9; st.key.distance = 0; st.key.intensity = 22; st.key.decay = 1.6; st.key.penumbra = .8;
    st.key.shadow.camera.near = .5; st.key.shadow.camera.far = 12; st.key.shadow.bias = -.0002; st.key.shadow.normalBias = .004; st.key.shadow.radius = 4;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .06, distanceExponent: 1.4, thickness: .05, scale: 1, samples: 12 });
    st.glint.distance = 3; st.glint.decay = 1.2;
    // polished cream marble with soft grey veins
    st.floor.geometry = new THREE.CircleGeometry(7, 96); st.floor.material.roughness = .34; st.floor.material.metalness = 0; st.floor.material.color.set('#FFFFFF');
    st.floor.material.map = ctex(1024, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const n = noise.noise(xx / 260, yy / 260) * 3 + noise.noise(xx / 60, yy / 60) * .6; const vein = Math.pow(Math.abs(Math.sin(xx / 140 + yy / 300 + n)), 18) * 46 + Math.pow(Math.abs(Math.sin(xx / 70 - yy / 160 + n * 1.7)), 40) * 30; const v = 240 + 6 * noise.noise(xx / 30, yy / 30) - vein; img.data.set([v, v * .985, v * .955, 255], i * 4); } x.putImageData(img, 0, 0); }, true, 4, 4);
    const scr = scratchTex(3);
    this.M = {
      gold22: new THREE.MeshPhysicalMaterial({ color: '#F0B24C', metalness: 1, roughness: .17, roughnessMap: scr, envMapIntensity: 1.5 }),
      gold999: new THREE.MeshPhysicalMaterial({ color: '#F7C65A', metalness: 1, roughness: .14, roughnessMap: scr, envMapIntensity: 1.5 }),
      brass: new THREE.MeshPhysicalMaterial({ color: '#C79A4E', metalness: 1, roughness: .26, roughnessMap: scr, envMapIntensity: 1.3 }),
      silver: new THREE.MeshPhysicalMaterial({ color: '#C4C9CF', metalness: 1, roughness: .32, roughnessMap: scr }),
      steel: new THREE.MeshStandardMaterial({ color: '#AEB4BA', roughness: .22, metalness: 1 }),
      almirah: new THREE.MeshPhysicalMaterial({ color: '#9FAAA6', metalness: .45, roughness: .32, clearcoat: .6, clearcoatRoughness: .2 }),
      almIn: new THREE.MeshStandardMaterial({ color: '#4A524F', roughness: .6, metalness: .3 }),
      velvet: new THREE.MeshPhysicalMaterial({ color: '#05211A', roughness: 1, sheen: .45, sheenColor: '#2A5E4C', sheenRoughness: .5 }),
      redVelvet: new THREE.MeshPhysicalMaterial({ color: '#6E0D1C', roughness: 1, sheen: 1, sheenColor: '#D0506A', sheenRoughness: .5 }),
      walnut: new THREE.MeshPhysicalMaterial({ color: '#3B2416', roughness: .6, clearcoat: .25, clearcoatRoughness: .45, map: ctex(512, 1024, (x, w, h) => { for (let yy = 0; yy < h; yy++) { const v = 128 + 40 * noise.noise(yy / 40, 0) + 18 * noise.noise(yy / 6, 3); x.fillStyle = `rgb(${v},${v * .78 | 0},${v * .6 | 0})`; x.fillRect(0, yy, w, 1); } }, true) }),
      black: new THREE.MeshPhysicalMaterial({ color: '#111214', roughness: .35, metalness: .2, clearcoat: .6 }),
      chip: new THREE.MeshPhysicalMaterial({ color: '#16181B', roughness: .55, metalness: .1, clearcoat: .3 }),
      barrel: new THREE.MeshPhysicalMaterial({ color: '#1F3442', metalness: .5, roughness: .38, clearcoat: .7 }),
      paper: new THREE.MeshStandardMaterial({ color: '#F1E7D2', roughness: .85 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0, roughness: .02, transmission: 1, thickness: .004, transparent: true, opacity: .25, envMapIntensity: 1.5 }),
    };
    this.buildSet(); this.buildTray(); this.buildScale(); this.buildTowers(); this.buildBoard(); this.buildGauge(); this.buildAlmirah(); this.buildChip(); this.buildFlip();
    this.ST = { cam: { px: 0, py: .35, pz: 1.6, tx: 0, ty: .2, tz: 0, fov: 30, roll: 0 }, aperture: .00003, exposure: 1.0, sweep: 0,
      riseA: 1, riseB: 1, cutB: 0, tilt: 0, swing: 0, barrel: 0, tags: 0, coins: 0, usd: 0, soldL: 0, board: 0, rate: 0, alm: 0,
      chart: 0, crash: 0, crack: 0, flip: 0, chipGlow: 0 };
  }

  // ------------------------------------------------------------ walnut wall behind the counter
  buildSet() {
    const wall = new THREE.Mesh(new RoundedBoxGeometry(4.2, 3.2, .05, 2, .01), this.M.walnut); wall.position.set(0, 1.6, -1.15); wall.receiveShadow = true; this.scene.add(wall);
    // brass strip along the wall foot
    const strip = new THREE.Mesh(new THREE.BoxGeometry(4.2, .02, .012), this.M.brass); strip.position.set(0, .03, -1.12); this.scene.add(strip);
  }

  // ------------------------------------------------------------ pieces of gold
  bangleGeo(rIn = .03, wR = .005, hh = .014) {
    const p = [], n = 18; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; p.push([rIn + wR * .35 + Math.cos(a) * wR * .65, Math.sin(a) * hh / 2]); }
    for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + Math.PI * i / 6; p.push([rIn + wR * .35 + Math.cos(a) * wR * .35, Math.sin(a) * hh / 2]); }
    return lathe(p, 160);
  }
  bangleMat() {
    // diamond-cut engraving round the band: bump + roughness
    const b = ctex(2048, 128, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); const n = 48, sw = w / n; for (let i = 0; i < n; i++) { const cx = i * sw + sw / 2; x.fillStyle = '#d8d8d8'; x.beginPath(); x.moveTo(cx, 10); x.lineTo(cx + sw * .42, h / 2); x.lineTo(cx, h - 10); x.lineTo(cx - sw * .42, h / 2); x.closePath(); x.fill(); x.fillStyle = '#3a3a3a'; x.beginPath(); x.moveTo(cx, 26); x.lineTo(cx + sw * .2, h / 2); x.lineTo(cx, h - 26); x.lineTo(cx - sw * .2, h / 2); x.closePath(); x.fill(); } }, false);
    b.repeat.set(1, 1); const m = this.M.gold22.clone(); m.bumpMap = b; m.bumpScale = 4; m.roughnessMap = b; m.roughness = .3; return m;
  }
  coinGeo(r = .0115, h = .0016) { return lathe([[0, 0], [r - .0006, 0], [r, .0003], [r, h - .0003], [r - .0006, h], [r - .0012, h], [r - .0014, h - .0003], [0, h - .0003]], 96); }
  coinMat() {
    const t = ctex(256, 256, (x, w, h) => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b8b8b8'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 104, 0, TAU); x.stroke(); x.fillStyle = '#c8c8c8'; x.font = `bold 64px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('916', 128, 112); x.font = `bold 34px ${LAT}`; x.fillText('8 g', 128, 170); }, false);
    const m = this.M.gold22.clone(); m.bumpMap = t; m.bumpScale = 1.4; return m;
  }
  barGeo(L = .1, H = .026, D = .048) {
    const g = new RoundedBoxGeometry(L, H, D, 3, .0035), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = lerp(1, .84, (p.getY(i) + H / 2) / H); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    g.computeVertexNormals(); g.translate(0, H / 2, 0); return g;
  }
  makeBar() {
    const g = new THREE.Group(); const b = new THREE.Mesh(this.BARG, this.M.gold999); b.castShadow = b.receiveShadow = true; g.add(b);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(.068, .03), this.STAMP); s.rotation.x = -Math.PI / 2; s.position.y = .0262; g.add(s); return g;
  }
  buildTray() {
    this.BARG = this.barGeo();
    this.STAMP = this.M.gold999.clone(); this.STAMP.bumpMap = ctex(512, 224, (x, w, h) => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#5a5a5a'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#4a4a4a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 46px ${LAT}`; x.fillText('FINE GOLD', w / 2, 60); x.font = `bold 64px ${LAT}`; x.fillText('999.9', w / 2, 124); x.font = `bold 34px ${LAT}`; x.fillText('1 kg', w / 2, 180); }, false); this.STAMP.bumpScale = 2;
    const tray = this.tray = new THREE.Group(); tray.position.set(-.32, 0, .28); this.scene.add(tray);
    const pad = new THREE.Mesh(new RoundedBoxGeometry(.34, .018, .2, 3, .006), this.M.velvet); pad.position.y = .009; pad.receiveShadow = true; tray.add(pad);
    const rimMat = this.M.brass; [[0, .1], [0, -.1]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(.344, .022, .006), rimMat); r.position.set(x, .011, z); tray.add(r); });
    const bg = this.bangleGeo(), bm = this.bangleMat();
    const b1 = this.bangle = new THREE.Mesh(bg, bm); b1.position.set(-.06, .018 + .007, .01); b1.castShadow = b1.receiveShadow = true; tray.add(b1);
    const b2 = new THREE.Mesh(bg, bm); b2.position.set(-.045, .018 + .007 + .0141, .018); b2.rotation.z = .03; b2.castShadow = true; tray.add(b2);
    // a third bangle standing on its edge, leaning
    const b3 = new THREE.Mesh(bg, bm); b3.rotation.x = Math.PI / 2; b3.rotation.y = .5; b3.position.set(.03, .018 + .036, -.05); b3.castShadow = true; tray.add(b3);
    const cg = this.coinGeo(), cm = this.coinMat(); this.COING = cg; this.COINM = cm;
    for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(cg, cm); c.position.set(.095 + (rnd() - .5) * .0016, .018 + i * .00165, .04 + (rnd() - .5) * .0016); c.rotation.y = rnd() * TAU; c.castShadow = c.receiveShadow = true; tray.add(c); }
    const lone = new THREE.Mesh(cg, cm); lone.position.set(.125, .018, -.015); lone.rotation.set(.0, .3, 0); tray.add(lone);
  }

  // ------------------------------------------------------------ the brass jeweller's scale
  buildScale() {
    const g = this.scaleG = new THREE.Group(); g.position.set(0, 0, -.15); this.scene.add(g); const B = this.M.brass;
    const base = new THREE.Mesh(lathe([[0, 0], [.11, 0], [.115, .006], [.1, .016], [.03, .022], [.02, .03], [0, .03]], 96), B); base.castShadow = base.receiveShadow = true; g.add(base);
    const post = new THREE.Mesh(lathe([[0, .03], [.012, .03], [.009, .08], [.008, .44], [.013, .45], [.013, .47], [.006, .48], [.006, .52], [0, .52]], 48), B); post.castShadow = true; g.add(post);
    // the beam pivots at y .5
    const beam = this.beam = new THREE.Group(); beam.position.y = .5; g.add(beam);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .56, 24), B); bar.rotation.z = Math.PI / 2; bar.castShadow = true; beam.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .02, 32), B); hub.rotation.x = Math.PI / 2; beam.add(hub);
    [-1, 1].forEach(sd => { const k = new THREE.Mesh(new THREE.SphereGeometry(.008, 24, 16), B); k.position.x = sd * .28; beam.add(k); });
    const needle = new THREE.Mesh(new THREE.ConeGeometry(.004, .13, 12), this.M.steel); needle.position.y = .065; beam.add(needle);
    // pointer arc behind the needle
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.12, .0025, 8, 48, Math.PI * .5), B); arc.rotation.z = Math.PI * .25; arc.position.set(0, .5, -.012); g.add(arc);
    // pans hang from the beam ends by three chains each
    this.pans = [-1, 1].map(sd => {
      const pg = new THREE.Group(); g.add(pg);
      const pan = new THREE.Mesh(lathe([[0, 0], [.07, .002], [.11, .014], [.118, .022], [.113, .023], [.105, .016], [.068, .006], [0, .004]], 96), B); pan.scale.set(.86, 1, .86); pan.castShadow = pan.receiveShadow = true; pg.add(pan);
      const chains = []; for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .5; const c = new THREE.Mesh(new THREE.CylinderGeometry(.0011, .0011, 1, 6), this.CHAIN || (this.CHAIN = new THREE.MeshStandardMaterial({ color: '#9C8558', metalness: 1, roughness: .45 }))); c.userData.a = a; pg.add(c); chains.push(c); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.006, .0015, 8, 16), B); pg.add(ring);
      const load = new THREE.Group(); load.position.y = .006; pg.add(load);
      return { g: pg, chains, ring, load, sd };
    });
    // left pan: gold (two bars and coins)
    const L = this.pans[0].load; this.goldL = [];
    [[-.025, 0, .012, .3], [.03, 0, -.01, -.2]].forEach(([x, y, z, r]) => { const b = this.makeBar(); b.scale.setScalar(.7); b.position.set(x * .9, y, z); b.rotation.y = r; L.add(b); this.goldL.push({ o: b, base: b.position.clone() }); });
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(this.COING, this.COINM); c.position.set(.0 + (rnd() - .5) * .002, .0185 + i * .00165, .048); L.add(c); this.goldL.push({ o: c, base: c.position.clone() }); }
    // right pan: what pulls gold down, in story order
    const R = this.pans[1].load; this.loadR = {};
    const brl = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .07, 48), this.M.barrel); body.position.y = .035; body.castShadow = true; brl.add(body);
    [.012, .035, .058].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(.0262, .0016, 8, 48), this.M.barrel); r.rotation.x = Math.PI / 2; r.position.y = y; brl.add(r); });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, .002, 48), this.M.steel); lid.position.y = .0705; brl.add(lid);
    const lbl = new THREE.Mesh(new THREE.CylinderGeometry(.0263, .0263, .02, 48, 1, true, -.9, 1.8), new THREE.MeshStandardMaterial({ map: ctex(256, 64, (x, w, h) => { x.fillStyle = '#E8DCC0'; x.fillRect(0, 0, w, h); x.fillStyle = '#1F3442'; x.font = `800 40px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('OIL', w / 2, h / 2 + 2); }), roughness: .7 })); lbl.position.y = .046; brl.add(lbl);
    brl.position.set(-.03, 0, -.035); R.add(brl); this.loadR.barrel = { o: brl, base: brl.position.clone() };
    // price tags (paper, red up-arrows)
    this.loadR.tags = ['FUEL', 'FOOD', 'RENT'].map((w, k) => { const t = new THREE.Group(); const card = new THREE.Mesh(new RoundedBoxGeometry(.046, .0016, .028, 2, .0007), [this.M.paper, this.M.paper, new THREE.MeshStandardMaterial({ map: ctex(256, 160, (x, W, H) => { x.fillStyle = '#F3E9D3'; x.fillRect(0, 0, W, H); x.fillStyle = '#1A1A1A'; x.font = `800 54px ${LAT}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(w, 22, 58); x.fillStyle = '#D42A2A'; x.beginPath(); x.moveTo(200, 120); x.lineTo(232, 120); x.lineTo(216, 92); x.fill(); x.fillRect(209, 120, 14, 26); x.font = `800 44px ${LAT}`; x.fillText('$', 26, 122); x.beginPath(); x.arc(W - 22, 30, 9, 0, TAU); x.fillStyle = '#B9AE98'; x.fill(); }), roughness: .85 }), this.M.paper, this.M.paper, this.M.paper]); card.position.y = .0008; t.add(card); t.position.set(-.045 + k * .042, .012, .05 - (k % 2) * .01); t.rotation.set(1.05, (k - 1) * .35, 0, 'YXZ'); R.add(t); return { o: t, base: t.position.clone(), k }; });
    // savings: a stack of silver coins
    this.loadR.coins = []; for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(this.coinGeo(.016, .0024), this.M.silver); c.position.set(.048 + (rnd() - .5) * .002, i * .0024, -.008); c.castShadow = true; R.add(c); this.loadR.coins.push({ o: c, base: c.position.clone() }); }
    // dollars: two banded bundles
    this.NOTE = this.noteMats(); this.loadR.usd = [0, 1].map(k => { const b = this.makeBundle(); b.position.set(-.005 + k * .006, .072 + k * .013, .02 - k * .004); b.rotation.y = .25 - k * .35; R.add(b); return { o: b, base: b.position.clone(), k }; });
  }
  noteMats() {
    const face = new THREE.MeshStandardMaterial({ roughness: .8, map: ctex(512, 224, (x, w, h) => { x.fillStyle = '#6F9269'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3E5C3C'; x.lineWidth = 6; x.strokeRect(12, 12, w - 24, h - 24); x.lineWidth = 1.5; for (let i = 0; i < 40; i++) { x.beginPath(); x.ellipse(w / 2, h / 2, 60 + i * 4, 30 + i * 2.5, 0, 0, TAU); x.stroke(); } x.fillStyle = '#3F5F3E'; x.beginPath(); x.arc(w / 2, h / 2, 60, 0, TAU); x.fill(); x.fillStyle = '#DDE8D8'; x.font = `800 86px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', w / 2, h / 2 + 4); x.fillStyle = '#3F5F3E'; x.font = `800 40px ${LAT}`; x.fillText('100', 60, 46); x.fillText('100', w - 60, h - 46); }) });
    const edge = new THREE.MeshStandardMaterial({ roughness: .9, map: ctex(64, 256, (x, w, h) => { for (let y = 0; y < h; y++) { const v = 165 + (y % 3) * 14; x.fillStyle = `rgb(${v * .88 | 0},${v | 0},${v * .85 | 0})`; x.fillRect(0, y, w, 1); } }) });
    const band = new THREE.MeshStandardMaterial({ roughness: .7, map: ctex(128, 256, (x, w, h) => { x.fillStyle = '#D9B865'; x.fillRect(0, 0, w, h); x.fillStyle = '#6B4E14'; x.font = `800 70px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', w / 2, h / 2); }) });
    return { face, edge, band };
  }
  makeBundle() {
    const g = new THREE.Group(), N = this.NOTE; const b = new THREE.Mesh(new RoundedBoxGeometry(.078, .012, .034, 2, .0008), [N.edge, N.edge, N.face, N.face, N.edge, N.edge]); b.position.y = .006; b.castShadow = b.receiveShadow = true; g.add(b);
    const band = new THREE.Mesh(new THREE.BoxGeometry(.016, .0126, .0346), N.band); band.position.y = .006; g.add(band); return g;
  }

  // ------------------------------------------------------------ two towers of bars: JAN 2026 vs NOW
  buildTowers() {
    this.towers = [.62, .8].map((x, ti) => { const g = new THREE.Group(); g.position.set(x, 0, .05); this.scene.add(g); const bars = []; for (let k = 0; k < 11; k++) { const b = this.makeBar(); b.position.y = k * .0262; b.rotation.y = (k % 2 ? .04 : -.03) + (rnd() - .5) * .03; g.add(b); bars.push({ o: b, base: b.position.clone(), rot: b.rotation.y }); } return { g, bars }; });
    // where the top four bars of NOW land on the marble
    this.fallTo = [[.98, .12, .5], [1.04, -.02, -.7], [.93, .22, 1.3], [1.12, .1, .2]];
  }

  // ------------------------------------------------------------ split-flap rate board on the wall
  buildBoard() {
    const g = this.boardG = new THREE.Group(); g.position.set(0, .86, -1.11); this.scene.add(g);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(1.22, .62, .04, 3, .008), this.M.black); frame.position.z = .0; frame.castShadow = true; g.add(frame);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.2, .006, .045), this.M.brass); trim.position.y = .14; g.add(trim);
    const head = new THREE.Mesh(new THREE.PlaneGeometry(1.16, .17), new THREE.MeshBasicMaterial({ toneMapped: false, map: ctex(1160, 170, (x, w, h) => { x.fillStyle = '#0E0F11'; x.fillRect(0, 0, w, h); x.fillStyle = '#F6C35B'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 66px ${ML}`; x.fillText('ഇന്നത്തെ സ്വർണ്ണവില', w / 2, 62); x.fillStyle = '#E9E2D2'; x.font = `bold 40px ${ML}`; x.fillText('22K  ·  1 പവൻ (8 ഗ്രാം)', w / 2, 132); }) }));
    head.position.set(0, .215, .021); g.add(head);
    // glyph atlas: blank, digits, comma
    const CH = ' 0123456789,', N = CH.length; this.CH = CH;
    const atlas = ctex(128 * N, 200, (x, w, h) => { for (let i = 0; i < N; i++) { const X = i * 128; const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2A2C30'); gr.addColorStop(.5, '#1C1E21'); gr.addColorStop(1, '#25272B'); x.fillStyle = gr; x.fillRect(X + 4, 4, 120, h - 8); x.fillStyle = '#F4EFE4'; x.font = `800 150px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(CH[i], X + 64, h / 2 + 8); x.fillStyle = '#070708'; x.fillRect(X + 4, h / 2 - 2, 120, 4); } });
    atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping; atlas.anisotropy = 8;
    const fm = new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false, side: THREE.DoubleSide });
    const cw = .1, chh = .17, gap = .012, n = 8, x0 = -((n - 1) * (cw + gap)) / 2 + .06;
    const rs = new THREE.Mesh(new THREE.PlaneGeometry(.1, .17), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, map: ctex(128, 200, (x, w, h) => { x.fillStyle = '#F6C35B'; x.font = `800 130px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', w / 2, h / 2 + 6); }) })); rs.position.set(x0 - cw - gap + .01, -.07, .021); g.add(rs);
    const half = top => { const ge = new THREE.PlaneGeometry(cw, chh / 2); ge.translate(0, top ? chh / 4 : -chh / 4, 0); return new THREE.Mesh(ge, fm); };
    this.cells = []; const OLD = '1,00,920', NEW = '  92,080';
    for (let k = 0; k < n; k++) {
      const c = new THREE.Group(); c.position.set(x0 + k * (cw + gap), -.07, .021); g.add(c);
      const top = half(true), bot = half(false), flap = half(true); flap.position.z = .002; c.add(top, bot, flap);
      // a few in-between characters, like a real split-flap
      const a = CH.indexOf(OLD[k]), b = CH.indexOf(NEW[k]); const seq = [a]; if (a !== b) { const steps = 2 + (k % 3); for (let j = 1; j < steps; j++) seq.push(1 + ((a + j * 3 + k) % 10)); seq.push(b); }
      this.cells.push({ c, top, bot, flap, seq, k });
    }
    this.cellW = cw; this.cellH = chh; this.setCells(0);
  }
  uv(mesh, i, top) { const N = this.CH.length, u0 = i / N + .002, u1 = (i + 1) / N - .002, v0 = top ? .5 : 0, v1 = top ? 1 : .5; const a = mesh.geometry.attributes.uv; a.setXY(0, u0, v1); a.setXY(1, u1, v1); a.setXY(2, u0, v0); a.setXY(3, u1, v0); a.needsUpdate = true; }
  setCells(p) {
    const H = this.cellH;
    this.cells.forEach(cel => {
      const n = cel.seq.length - 1; if (!n) { this.uv(cel.top, cel.seq[0], true); this.uv(cel.bot, cel.seq[0], false); cel.flap.visible = false; return; }
      // each cell starts a little after the one to its right
      const q = cl(p * (1 + .09 * 7) - (7 - cel.k) * .09) * n, i = Math.min(n - 1, Math.floor(q)), f = q >= n ? 1 : q - i;
      const cur = cel.seq[q >= n ? n : i], nxt = cel.seq[Math.min(n, i + 1)];
      if (q >= n) { this.uv(cel.top, cel.seq[n], true); this.uv(cel.bot, cel.seq[n], false); cel.flap.visible = false; return; }
      this.uv(cel.top, nxt, true); cel.flap.visible = true;
      if (f < .5) { this.flapHalf(cel, true); this.uv(cel.bot, cur, false); this.uv(cel.flap, cur, true); cel.flap.rotation.x = f * 2 * Math.PI / 2; }
      else { this.flapHalf(cel, false); this.uv(cel.bot, cur, false); this.uv(cel.flap, nxt, false); cel.flap.rotation.x = -(1 - (f - .5) * 2) * Math.PI / 2; this.flapHalf(cel, false); if (f > .98) this.uv(cel.bot, nxt, false); }
    });
  }
  flapHalf(cel, top) { if (cel.flapTop === top) return; cel.flapTop = top; const ge = new THREE.PlaneGeometry(this.cellW, this.cellH / 2); ge.translate(0, top ? this.cellH / 4 : -this.cellH / 4, 0); cel.flap.geometry.dispose(); cel.flap.geometry = ge; }

  // ------------------------------------------------------------ brass gauge: US interest rate
  buildGauge() {
    const g = this.gaugeG = new THREE.Group(); g.position.set(-.62, 0, -.22); g.rotation.y = .35; this.scene.add(g); const B = this.M.brass;
    const foot = new THREE.Mesh(new RoundedBoxGeometry(.16, .02, .08, 2, .006), this.M.walnut); foot.position.y = .01; foot.castShadow = true; g.add(foot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.008, .01, .06, 24), B); stem.position.y = .05; g.add(stem);
    const head = new THREE.Group(); head.position.y = .2; g.add(head);
    const bez = new THREE.Mesh(new THREE.TorusGeometry(.115, .012, 24, 96), B); bez.castShadow = true; head.add(bez);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(.118, .118, .03, 96), B); back.rotation.x = Math.PI / 2; back.position.z = -.016; head.add(back);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.108, 96), new THREE.MeshStandardMaterial({ roughness: .5, map: ctex(1024, 1024, (x, w, h) => {
      x.fillStyle = '#E2DACA'; x.fillRect(0, 0, w, h); x.translate(w / 2, h / 2); const a0 = -Math.PI * .75, a1 = Math.PI * .75;
      x.lineWidth = 46; x.strokeStyle = '#D23B32'; x.beginPath(); x.arc(0, 0, 380, a0 + (a1 - a0) * .72 - Math.PI / 2, a1 - Math.PI / 2); x.stroke();
      x.strokeStyle = '#2F7D57'; x.beginPath(); x.arc(0, 0, 380, a0 - Math.PI / 2, a0 + (a1 - a0) * .3 - Math.PI / 2); x.stroke();
      x.fillStyle = '#1B1B1B'; for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; x.save(); x.rotate(a); x.fillRect(-2.5, -440, 5, i % 5 ? 30 : 60); x.restore(); }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 58px ${LAT}`; x.fillText('LOW', Math.sin(a0) * 330 + 40, -Math.cos(a0) * 330 + 40); x.fillText('HIGH', Math.sin(a1) * 330 - 40, -Math.cos(a1) * 330 + 40);
      x.font = `800 64px ${LAT}`; x.fillText('US', 0, 110); x.font = `700 46px ${LAT}`; x.fillText('INTEREST RATE', 0, 170);
    }), color: '#CFC7B8' })); face.material.roughness = .8; face.position.z = .0; head.add(face);
    const nd = this.needle = new THREE.Group(); nd.position.z = .006; head.add(nd);
    const nm = new THREE.MeshStandardMaterial({ color: '#B0201C', roughness: .4, metalness: .3 }); const blade = new THREE.Mesh(new THREE.BoxGeometry(.006, .095, .002), nm); blade.position.y = .04; nd.add(blade);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.0045, .014, 3), nm); tip.position.y = .094; nd.add(tip);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .008, 32), B); cap.rotation.x = Math.PI / 2; cap.position.z = .004; nd.add(cap);
        this.gaugeHead = head;
  }

  // ------------------------------------------------------------ steel almirah with a locker shelf
  buildAlmirah() {
    const g = this.almG = new THREE.Group(); g.position.set(-1.15, 0, -.3); g.rotation.y = .3; this.scene.add(g); const S = this.M.almirah;
    const Wd = .44, Hh = .64, Dd = .32, t = .01;
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(t, Hh, Dd), S); sideL.position.set(-Wd / 2 + t / 2, Hh / 2, 0); const sideR = sideL.clone(); sideR.position.x = Wd / 2 - t / 2;
    const top = new RoundedBoxGeometry(Wd + .01, .02, Dd + .01, 2, .004); const tp = new THREE.Mesh(top, S); tp.position.y = Hh; const bt = new THREE.Mesh(new THREE.BoxGeometry(Wd, .04, Dd), S); bt.position.y = .02;
    const bk = new THREE.Mesh(new THREE.BoxGeometry(Wd, Hh, t), this.M.almIn); bk.position.set(0, Hh / 2, -Dd / 2 + t / 2);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(Wd - 2 * t, .008, Dd - t), this.M.almIn); sh.position.set(0, .3, 0);
    [sideL, sideR, tp, bt, bk, sh].forEach(m => { m.castShadow = m.receiveShadow = true; g.add(m); });
    // jewel box on the shelf: red velvet, lid open, a bangle inside
    const jb = new THREE.Group(); jb.position.set(0, .304, .0); g.add(jb);
    const box = new THREE.Mesh(new RoundedBoxGeometry(.13, .04, .11, 2, .006), this.M.redVelvet); box.position.y = .02; jb.add(box);
    const lid = new THREE.Mesh(new RoundedBoxGeometry(.13, .012, .11, 2, .005), this.M.redVelvet); lid.position.set(0, .04, -.055); lid.geometry.translate(0, 0, .055); lid.rotation.x = -1.9; jb.add(lid);
    const bgl = this.lockerBangle = new THREE.Mesh(this.bangleGeo(), this.bangleMat()); bgl.position.set(0, .043, .0); bgl.castShadow = true; jb.add(bgl);
    // two doors, hinged at the outer edges
    this.doors = [-1, 1].map(sd => { const hg = new THREE.Group(); hg.position.set(sd * Wd / 2, 0, Dd / 2); g.add(hg); const d = new THREE.Mesh(new RoundedBoxGeometry(Wd / 2 - .003, Hh - .05, .012, 2, .003), S); d.position.set(-sd * (Wd / 4), Hh / 2 + .01, .006); d.castShadow = true; hg.add(d);
      const pr = new THREE.Mesh(new RoundedBoxGeometry(Wd / 2 - .05, Hh - .14, .004, 2, .002), S); pr.position.set(-sd * (Wd / 4), Hh / 2 + .01, .013); hg.add(pr);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .1, 16), this.M.steel); hd.position.set(-sd * (Wd / 2 - .03), Hh / 2 + .01, .026); hg.add(hd); [-.05, .05].forEach(y => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.0035, .0035, .016, 12), this.M.steel); p.rotation.x = Math.PI / 2; p.position.set(-sd * (Wd / 2 - .03), Hh / 2 + .01 + y, .018); hg.add(p); });
      return { hg, sd }; });
  }

  // ------------------------------------------------------------ AI chip and a share-price line that crashes
  buildChip() {
    const g = this.chipG = new THREE.Group(); g.position.set(1.3, 0, .2); this.scene.add(g);
    const scr = new THREE.Mesh(new RoundedBoxGeometry(.38, .3, .02, 2, .006), this.M.black); scr.position.set(0, .21, -.16); g.add(scr);
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(.35, .27), new THREE.MeshBasicMaterial({ toneMapped: false, map: ctex(700, 540, (x, w, h) => { x.fillStyle = '#07090C'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,140,160,.25)'; x.lineWidth = 2; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); } for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(0, i * h / 6); x.lineTo(w, i * h / 6); x.stroke(); } x.fillStyle = 'rgba(210,222,235,.85)'; x.font = `800 40px ${LAT}`; x.textAlign = 'center'; x.fillText('AI STOCKS', w / 2, 52); }) })); grid.position.set(0, .21, -.149); g.add(grid);
    // the line: rises with wiggles, then a crash
    const P = []; for (let i = 0; i <= 40; i++) { const u = i / 40; P.push(new THREE.Vector3(-.155 + u * .23, .13 + u * .15 + .008 * Math.sin(i * 1.9) + .004 * Math.sin(i * 4.1), -.146)); }
    const Q = [P[40].clone()]; for (let i = 1; i <= 14; i++) { const u = i / 14; Q.push(new THREE.Vector3(.075 + u * .085, .28 - .17 * Math.pow(u, .8) + .006 * Math.sin(i * 2.7) * (1 - u), -.146)); }
    const tube = (pts, col) => { const ge = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 6, .0026, 8); const m = new THREE.Mesh(ge, new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); g.add(m); return m; };
    this.lineUp = tube(P, '#3BE38A'); this.lineDn = tube(Q, '#FF3B3B'); this.lineUpN = this.lineUp.geometry.index.count; this.lineDnN = this.lineDn.geometry.index.count;
    this.lineTip = Q[Q.length - 1];
    // the chip: two halves that crack apart
    const pinM = this.M.gold22; this.halves = [-1, 1].map(sd => { const hg = new THREE.Group(); g.add(hg); const body = new THREE.Mesh(new RoundedBoxGeometry(.06, .012, .12, 2, .002), this.M.chip); body.position.set(sd * .03, .016, 0); body.castShadow = true; hg.add(body);
      for (let k = 0; k < 7; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.004, .002, .014), pinM); p.position.set(sd * .006 + sd * k * .0075, .011, .064); hg.add(p); const p2 = p.clone(); p2.position.z = -.064; hg.add(p2); }
      for (let k = 0; k < 7; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.014, .002, .004), pinM); p.position.set(sd * .064, .011, -.045 + k * .015); hg.add(p); }
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.06, .12), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, map: ctex(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#7FE8FF'; x.font = `800 210px ${LAT}`; x.textAlign = sd < 0 ? 'right' : 'left'; x.textBaseline = 'middle'; x.fillText(sd < 0 ? 'A' : 'I', sd < 0 ? w - 6 : 6, h / 2 + 8); }) })); lbl.rotation.x = -Math.PI / 2; lbl.position.set(sd * .03, .0225, 0); hg.add(lbl); hg.userData.lbl = lbl;
      hg.position.set(0, 0, -.02); return hg; });
    this.glowRing = new THREE.Mesh(new THREE.PlaneGeometry(.26, .26), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, map: ctex(256, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(90,220,255,.85)'); gr.addColorStop(.5, 'rgba(60,170,255,.25)'); gr.addColorStop(1, 'rgba(60,170,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }) })); this.glowRing.rotation.x = -Math.PI / 2; this.glowRing.position.set(0, .093, -.02); g.add(this.glowRing);
    const riser = new THREE.Mesh(new RoundedBoxGeometry(.17, .09, .17, 3, .008), this.M.black); riser.position.set(0, .045, -.02); riser.castShadow = riser.receiveShadow = true; g.add(riser);
  }

  // ------------------------------------------------------------ one bar that flips into a bundle of cash
  buildFlip() {
    const g = this.flipG = new THREE.Group(); g.position.set(.3, 0, .34); this.scene.add(g);
    this.flipBar = this.makeBar(); this.flipBar.position.y = 0; g.add(this.flipBar);
    this.flipCash = new THREE.Group(); [0, 1, 2].forEach(k => { const b = this.makeBundle(); b.scale.set(1.25, 1, 1.25); b.position.set((k - 1) * .004, k * .0152, (k - 1) * .003); b.rotation.y = (k - 1) * .12; this.flipCash.add(b); }); g.add(this.flipCash);
  }

  // ------------------------------------------------------------ anchors for labels
  anchor(name) {
    const v = new THREE.Vector3(), wp = o => o.getWorldPosition(new THREE.Vector3());
    this.scene.updateMatrixWorld(true);
    switch (name) {
      case 'bangle': return wp(this.bangle).add(new THREE.Vector3(0, .01, 0));
      case 'tray': return wp(this.tray).add(new THREE.Vector3(0, .03, 0));
      case 'board': return wp(this.boardG);
      case 'digits': return wp(this.cells[5].c);
      case 'towerA': return wp(this.towers[0].g).add(new THREE.Vector3(0, 11 * .0262 + .01, 0));
      case 'towerB': return wp(this.towers[1].g).add(new THREE.Vector3(0, (this.ST.cutB > .3 ? 7 : 11) * .0262 + .01, 0));
      case 'scale': return wp(this.beam);
      case 'panL': return wp(this.pans[0].g).add(new THREE.Vector3(0, .03, 0));
      case 'panR': return wp(this.pans[1].g).add(new THREE.Vector3(0, .05, 0));
      case 'barrel': return wp(this.loadR.barrel.o).add(new THREE.Vector3(0, .07, 0));
      case 'gauge': return wp(this.gaugeHead);
      case 'almirah': return wp(this.almG).add(new THREE.Vector3(0, .5, 0));
      case 'locker': return wp(this.lockerBangle);
      case 'chip': return wp(this.chipG).add(new THREE.Vector3(0, .11, -.02));
      case 'lineTip': return this.chipG.localToWorld(this.lineTip.clone());
      case 'flip': return wp(this.flipG).add(new THREE.Vector3(0, .05, 0));
    }
    return v;
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { return []; }

  // ------------------------------------------------------------ one frame
  render(t) {
    const S = this.ST, st = this.studio;
    st.renderer.toneMappingExposure = S.exposure;
    // towers: bars drop in as riseA / riseB go 0..1; cutB knocks the top four of NOW off onto the marble
    this.towers.forEach((tw, ti) => { const r = ti ? S.riseB : S.riseA; tw.bars.forEach((b, k) => { const u = cl(r * 11 - k); b.o.visible = u > 0; b.o.position.copy(b.base); b.o.position.y += (1 - sm(u)) * .18; b.o.rotation.set(0, b.rot, 0);
      if (ti === 1 && k >= 7) { const j = 10 - k, v = cl(S.cutB * 1.45 - j * .15); if (v > 0) { const e = this.fallTo[j], pg = tw.g.position; const ex = e[0] - pg.x, ez = e[1] - pg.z, w = sm(v); b.o.position.set(lerp(b.base.x, ex, w), lerp(b.base.y, .0, Math.pow(v, 1.7)) + Math.sin(Math.PI * v) * .05, lerp(b.base.z, ez, w)); b.o.rotation.set(0, lerp(b.rot, e[2], w), Math.sin(Math.PI * v) * .6 * (j % 2 ? 1 : -1)); } } }); });
    // scale: tilt (+ = right pan down), a slow swing on top
    const tl = S.tilt + S.swing * .03 * Math.sin(t * 2.4); this.beam.rotation.z = -tl;
    this.pans.forEach(p => { const e = new THREE.Vector3(p.sd * .28, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -tl); const top = new THREE.Vector3(e.x, .5 + e.y, 0); p.g.position.set(top.x, top.y - .3, 0);
      p.ring.position.set(0, .3, 0); p.chains.forEach(c => { const a = c.userData.a, bx = Math.cos(a) * .09, bz = Math.sin(a) * .09; const from = new THREE.Vector3(bx, .02, bz), to = new THREE.Vector3(0, .3, 0); const mid = from.clone().add(to).multiplyScalar(.5), d = to.clone().sub(from); c.position.copy(mid); c.scale.set(1, d.length(), 1); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }); });
    // right pan loads drop in from above (the page eases them with a bounce)
    const drop = (o, base, u, h = .3) => { o.visible = u > 0; o.position.copy(base); o.position.y += (1 - u) * h; };
    drop(this.loadR.barrel.o, this.loadR.barrel.base, S.barrel, .35);
    this.loadR.tags.forEach(tg => { const u = cl(S.tags * 1.5 - tg.k * .25); drop(tg.o, tg.base, u, .25); });
    this.loadR.coins.forEach((c, i) => { const u = cl(S.coins * 9 - i); drop(c.o, c.base, u, .12); });
    this.loadR.usd.forEach(b => { const u = cl(S.usd * 1.4 - b.k * .4); drop(b.o, b.base, u, .3); });
    // the gold on the left pan is sold: it lifts off and away
    this.goldL.forEach((gq, i) => { const u = cl(S.soldL * 1.3 - (i % 4) * .1); gq.o.position.copy(gq.base); gq.o.position.y += sm(u) * .5; gq.o.position.x -= sm(u) * .12; gq.o.visible = u < .98; });
    // board, gauge, almirah
    this.setCells(S.board);
    this.needle.rotation.z = -lerp(-Math.PI * .45, Math.PI * .58, cl(S.rate));
    this.doors.forEach(d => { d.hg.rotation.y = d.sd * 1.55 * sm(cl(S.alm)); });
    // chip: glow, line draws, crash, crack
    this.glowRing.material.opacity = S.chipGlow; this.halves.forEach(h => h.userData.lbl.material.opacity = .25 + .75 * S.chipGlow);
    this.lineUp.geometry.setDrawRange(0, Math.floor(this.lineUpN * cl(S.chart) / 3) * 3); this.lineDn.geometry.setDrawRange(0, Math.floor(this.lineDnN * cl(S.crash) / 3) * 3); this.lineDn.visible = S.crash > 0;
    this.halves.forEach((h, i) => { const sd = i ? 1 : -1, u = sm(cl(S.crack)); h.position.set(sd * .025 * u, 0, -.02); h.rotation.set(0, sd * .18 * u, sd * .12 * u); h.position.y = .09 + .012 * u * Math.sin(Math.PI * u) + .004 * u; });
    // flip: bar rises, turns over, comes down as cash
    { const u = cl(S.flip), up = Math.sin(Math.PI * u) * .12, rot = Math.PI * sm(u); [this.flipBar, this.flipCash].forEach(o => { o.position.y = up; o.rotation.x = rot; }); this.flipBar.visible = u < .5; this.flipCash.visible = u >= .5; if (u >= .5) { this.flipCash.rotation.x = rot - Math.PI; } }
    // camera, light sweep
    const c = S.cam; const dd = Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz), nr = cl(dd * .05, .005, .2); if (Math.abs(st.camera.near - nr) > 1e-5) { st.camera.near = nr; st.camera.updateProjectionMatrix(); }
    st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.glint.intensity = 3 * Math.sin(Math.PI * cl(S.sweep)); st.glint.position.set(c.tx - .5 + 1 * S.sweep, c.ty + .35, c.tz + .45);
    st.key.position.set(c.tx + 1.4, 3.0, c.tz + 2.2); st.key.target.position.set(c.tx, 0, c.tz); st.key.target.updateMatrixWorld();
    st.render();
  }
}
