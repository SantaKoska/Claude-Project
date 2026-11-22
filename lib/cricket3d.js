// cricket3d.js - one board president's desk in a cream pavilion room for the 1983 reel (ES module, three r186).
//
//   import { CricketWorld } from './lib/cricket3d.js';
//   const W = new CricketWorld(canvas);  W.ST.stamp = .5;  W.render(t);  W.screen('pass') -> [x, y]
//
// Units are metres; the desk top is y = 0, the camera mostly looks from +z. Everything is one set:
// a complimentary pass and a rubber stamp (REFUSED), a manual scoreboard on the wall, a red leather ball that arcs into
// a golden cup, a bookmaker's slate, a brass nameplate, a desk globe (Natural Earth coastlines), a cash box, a vintage
// microphone with envelopes, and stacks of gold coins as a 3D chart of ICC revenue shares. No real person's likeness.
import * as THREE from 'three';
import { Studio } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { WORLD } from './maps/world50.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const rnd = (() => { let s = 41; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const noise = new SimplexNoise({ random: rnd });
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}
const LAT = '"Inter", "FreeSans", sans-serif', SERIF = '"DejaVu Serif", "Liberation Serif", serif';
function lathe(pts, seg = 96) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
const scratchTex = (rep = 2) => ctex(512, 512, (x, w, h) => { x.fillStyle = '#5c5c5c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const a = rnd() * TAU, l = 8 + rnd() * 60, X = rnd() * w, Y = rnd() * h; x.strokeStyle = `rgba(${rnd() < .5 ? 150 : 30},${rnd() < .5 ? 150 : 30},${rnd() < .5 ? 150 : 30},.25)`; x.lineWidth = .6 + rnd(); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); } }, false, rep, rep);
// lat/lon -> point on a sphere built like THREE.SphereGeometry (u = 0 at lon -180)
const llv = (lat, lon, r) => { const ph = (lon + 180) * D2R, th = (90 - lat) * D2R; return new THREE.Vector3(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)); };

export class CricketWorld {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#FFF6E6', '#8E7656'], floorY: 0, fov: 30, exposure: 1.0, aperture: .00003, bloom: .035, floor: '#E7D9C4', env: 1.0 });
    const s = this.scene = st.scene;
    st.key.position.set(1.5, 3.2, 2.2); st.key.angle = .9; st.key.distance = 0; st.key.intensity = 13; st.key.decay = 1.6; st.key.penumbra = .8;
    st.key.shadow.camera.near = .5; st.key.shadow.camera.far = 12; st.key.shadow.bias = -.0002; st.key.shadow.normalBias = .004; st.key.shadow.radius = 4;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .06, distanceExponent: 1.4, thickness: .05, scale: 1, samples: 12 });
    st.glint.distance = 3; st.glint.decay = 1.2;
    // the desk: polished walnut planks
    st.floor.geometry = new THREE.CircleGeometry(7, 96); st.floor.material.roughness = .42; st.floor.material.metalness = 0; st.floor.material.color.set('#FFFFFF');
    st.floor.material.map = ctex(1024, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const plank = Math.floor(yy / 128); const g = noise.noise(xx / 380 + plank * 7, yy / 9) * .5 + noise.noise(xx / 60 + plank, yy / 3) * .25; const seam = (yy % 128) < 2 ? -38 : 0; const v = 118 + 34 * g + seam + plank % 2 * 6; img.data.set([v * 1.0, v * .66, v * .44, 255], i * 4); } x.putImageData(img, 0, 0); }, true, 3, 3);
    const scr = scratchTex(3);
    this.M = {
      gold: new THREE.MeshPhysicalMaterial({ color: '#F2B84E', metalness: 1, roughness: .16, roughnessMap: scr, envMapIntensity: 1.5 }),
      brass: new THREE.MeshPhysicalMaterial({ color: '#C79A4E', metalness: 1, roughness: .26, roughnessMap: scr, envMapIntensity: 1.3 }),
      chrome: new THREE.MeshPhysicalMaterial({ color: '#DDE2E6', metalness: 1, roughness: .1, roughnessMap: scr, envMapIntensity: 1.6 }),
      walnut: new THREE.MeshPhysicalMaterial({ color: '#4A2C18', roughness: .5, clearcoat: .5, clearcoatRoughness: .3, map: ctex(512, 1024, (x, w, h) => { for (let yy = 0; yy < h; yy++) { const v = 128 + 40 * noise.noise(yy / 40, 0) + 18 * noise.noise(yy / 6, 3); x.fillStyle = `rgb(${v},${v * .78 | 0},${v * .6 | 0})`; x.fillRect(0, yy, w, 1); } }, true) }),
      leather: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .62, sheen: .3, sheenColor: '#4C7A5E', map: ctex(1024, 512, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const n = noise.noise(xx / 7, yy / 7) * .5 + noise.noise(xx / 40, yy / 40) * .5; const v = 1 + .1 * n; img.data.set([22 * v, 70 * v, 48 * v, 255], i * 4); } x.putImageData(img, 0, 0); x.strokeStyle = '#C9A04F'; x.lineWidth = 5; x.strokeRect(26, 26, w - 52, h - 52); x.lineWidth = 2; x.strokeRect(40, 40, w - 80, h - 80); }, true) }),
      steel: new THREE.MeshPhysicalMaterial({ color: '#45544C', metalness: .55, roughness: .3, clearcoat: .7, clearcoatRoughness: .2 }),
      steelIn: new THREE.MeshStandardMaterial({ color: '#8C948F', metalness: .6, roughness: .45 }),
      black: new THREE.MeshPhysicalMaterial({ color: '#141516', roughness: .35, metalness: .2, clearcoat: .6 }),
      paper: new THREE.MeshStandardMaterial({ color: '#E6D8BC', roughness: .85 }),
      greenGlass: new THREE.MeshPhysicalMaterial({ color: '#1F6B3A', roughness: .15, clearcoat: 1, emissive: '#2E7A3E', emissiveIntensity: .25 }),
    };
    this.buildRoom(); this.buildPass(); this.buildScoreboard(); this.buildBall(); this.buildCup(); this.buildSlate(); this.buildNameplate(); this.buildGlobe(); this.buildCashBox(); this.buildMic(); this.buildEnvelopes(); this.buildStacks(); this.buildLamp();
    this.ST = { cam: { px: 0, py: .35, pz: 1.6, tx: 0, ty: .2, tz: 0, fov: 30, roll: 0 }, aperture: .00003, exposure: 1.0, sweep: 0,
      stamp: 0, ink: 0, slide: 0, score: 0, fly: 0, cupGlow: 0, lon: 0, indpak: 0, arc: 0, ukPin: 0, box: 0, spot: 0, env: 0, share: 0, share2: 0 };
  }

  // ------------------------------------------------------------ cream panelled wall, green leather blotter
  buildRoom() {
    const wallMap = ctex(1024, 768, (x, w, h) => { x.fillStyle = '#E2D1B2'; x.fillRect(0, 0, w, h); const pw = w / 4; for (let i = 0; i < 4; i++) { const X = i * pw + 26, Y = 120, W = pw - 52, H = h - 220; x.strokeStyle = 'rgba(120,90,50,.35)'; x.lineWidth = 6; x.strokeRect(X, Y, W, H); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.strokeRect(X + 5, Y + 5, W - 10, H - 10); } x.fillStyle = 'rgba(120,90,50,.25)'; x.fillRect(0, h - 70, w, 6); x.fillRect(0, 70, w, 5); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * .025})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, true);
    const wall = new THREE.Mesh(new RoundedBoxGeometry(4.2, 3.2, .05, 2, .01), new THREE.MeshStandardMaterial({ map: wallMap, roughness: .78 })); wall.position.set(0, 1.6, -1.15); wall.receiveShadow = true; this.scene.add(wall);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, .05, .03), this.M.walnut); rail.position.set(0, .03, -1.11); this.scene.add(rail);
    const blot = new THREE.Mesh(new RoundedBoxGeometry(.92, .006, .5, 2, .002), this.M.leather); blot.position.set(0, .003, .14); blot.receiveShadow = true; this.scene.add(blot);
    [-1, 1].forEach(sd => { const e = new THREE.Mesh(new RoundedBoxGeometry(.05, .012, .52, 2, .004), this.M.walnut); e.position.set(sd * .485, .006, .14); e.castShadow = e.receiveShadow = true; this.scene.add(e); });
  }

  // ------------------------------------------------------------ the complimentary pass + the rubber stamp
  buildPass() {
    const g = this.passG = new THREE.Group(); g.position.set(0, .006, .22); g.rotation.y = .06; this.scene.add(g);
    const W = .17, H = .1;
    const map = ctex(1360, 800, (x, w, h) => {
      x.fillStyle = '#E9DBBE'; x.fillRect(0, 0, w, h); for (let i = 0; i < 20000; i++) { x.fillStyle = `rgba(90,60,20,${rnd() * .05})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
      const stub = w * .78; x.fillStyle = '#6B1420'; x.fillRect(0, 0, stub, 120); x.fillStyle = '#F6EEDB'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `bold 62px ${SERIF}`; x.fillText('WORLD CUP FINAL', stub / 2, 64);
      x.fillStyle = '#2A1A10'; x.font = `bold 58px ${SERIF}`; x.fillText("LORD'S GROUND · LONDON", stub / 2, 210);
      x.font = `48px ${SERIF}`; x.fillText('SATURDAY, 25th JUNE 1983', stub / 2, 300);
      x.strokeStyle = '#6B1420'; x.lineWidth = 4; x.strokeRect(70, 360, stub - 140, 150); x.fillStyle = '#6B1420'; x.font = `bold 66px ${SERIF}`; x.fillText('COMPLIMENTARY PASS', stub / 2, 412); x.font = `40px ${SERIF}`; x.fillText('ADMIT ONE  ·  PAVILION', stub / 2, 470);
      x.fillStyle = '#2A1A10'; x.font = `36px ${SERIF}`; x.fillText('Not transferable. To be shown on demand.', stub / 2, 600); x.font = `bold 44px ${LAT}`; x.textAlign = 'left'; x.fillText('No. 0417', 70, 720);
      x.setLineDash([14, 12]); x.strokeStyle = '#2A1A10'; x.lineWidth = 3; x.beginPath(); x.moveTo(stub, 0); x.lineTo(stub, h); x.stroke(); x.setLineDash([]);
      x.save(); x.translate(stub + (w - stub) / 2, h / 2); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.font = `bold 52px ${SERIF}`; x.fillText('1983 FINAL', 0, -40); x.font = `bold 44px ${LAT}`; x.fillText('No. 0417', 0, 40); x.restore();
    }, true);
    const card = new THREE.Mesh(new RoundedBoxGeometry(W, .0015, H, 2, .0006), [this.M.paper, this.M.paper, new THREE.MeshStandardMaterial({ map, roughness: .8 }), this.M.paper, this.M.paper, this.M.paper]);
    card.castShadow = card.receiveShadow = true; g.add(card);
    // RoundedBoxGeometry has one material group; use a top plane for the print instead
    card.material = this.M.paper; const top = new THREE.Mesh(new THREE.PlaneGeometry(W - .001, H - .001), new THREE.MeshStandardMaterial({ map, roughness: .8 })); top.rotation.x = -Math.PI / 2; top.position.y = .0008; top.receiveShadow = true; g.add(top);
    // red REFUSED ink
    const inkMap = ctex(1024, 400, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#B30F19'; x.fillStyle = '#B30F19'; x.lineWidth = 22; x.strokeRect(24, 24, w - 48, h - 48); x.lineWidth = 6; x.strokeRect(50, 50, w - 100, h - 100); x.font = `bold 190px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('REFUSED', w / 2, h / 2 + 8); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(0,0,0,${.3 + rnd() * .7})`; const r = 1 + rnd() * 4; x.beginPath(); x.arc(rnd() * w, rnd() * h, r, 0, TAU); x.fill(); } }, true);
    const ink = this.ink = new THREE.Mesh(new THREE.PlaneGeometry(.11, .043), new THREE.MeshStandardMaterial({ map: inkMap, transparent: true, roughness: .6, depthWrite: false, opacity: 0 }));
    ink.rotation.set(-Math.PI / 2, 0, .2); ink.position.set(-.012, .0012, .004); g.add(ink);
    // the rubber stamp: walnut knob + handle, brass ferrule, block, red rubber
    const sp = this.stampG = new THREE.Group(); this.scene.add(sp);
    const knob = new THREE.Mesh(lathe([[0, .1], [.014, .1], [.018, .108], [.016, .118], [.008, .124], [0, .125]], 48), this.M.walnut);
    const handle = new THREE.Mesh(lathe([[0, .035], [.011, .035], [.008, .06], [.008, .088], [.011, .1], [0, .1]], 48), this.M.walnut);
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .008, 32), this.M.brass); fer.position.y = .033;
    const block = new THREE.Mesh(new RoundedBoxGeometry(.12, .026, .05, 2, .004), this.M.walnut); block.position.y = .016;
    const rub = new THREE.Mesh(new THREE.BoxGeometry(.114, .004, .046), new THREE.MeshStandardMaterial({ color: '#7A1016', roughness: .7 })); rub.position.y = .002;
    [knob, handle, fer, block, rub].forEach(m => { m.castShadow = true; sp.add(m); });
    this.stampPark = new THREE.Vector3(.2, .0, .32); this.stampHit = new THREE.Vector3(-.012, .0075, .224);
  }

  // ------------------------------------------------------------ manual scoreboard on the wall
  buildScoreboard() {
    const g = this.boardG = new THREE.Group(); g.position.set(0, .86, -1.115); this.scene.add(g);
    const BW = 1.06, BH = .64;
    const frame = new THREE.Mesh(new RoundedBoxGeometry(BW + .06, BH + .06, .04, 2, .008), this.M.walnut); frame.castShadow = true; g.add(frame);
    const face = ctex(1060, 640, (x, w, h) => { x.fillStyle = '#18241E'; x.fillRect(0, 0, w, h); for (let i = 0; i < 12000; i++) { x.fillStyle = `rgba(255,255,255,${rnd() * .03})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } x.fillStyle = '#EDE6D6'; x.textBaseline = 'middle'; x.font = `bold 56px ${SERIF}`; x.textAlign = 'center'; x.fillText('WORLD CUP FINAL · 1983', w / 2, 70); x.fillRect(80, 118, w - 160, 4); x.textAlign = 'left'; x.font = `bold 74px ${SERIF}`; x.fillText('INDIA', 80, 230); x.fillText('WEST INDIES', 80, 380); x.font = `40px ${SERIF}`; x.fillText('RUNS', 800, 160);
      // hooks for tiles
      x.fillStyle = '#B9955A'; [[700, 200], [800, 200], [900, 200], [700, 350], [800, 350], [900, 350]].forEach(([a, b]) => { x.beginPath(); x.arc(a + 40, b - 40, 7, 0, TAU); x.fill(); }); }, true);
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: face, roughness: .85 })); fm.position.z = .021; g.add(fm);
    // number tiles drop onto the hooks
    const tile = (str, w2, h2, fs) => new THREE.MeshStandardMaterial({ roughness: .7, map: ctex(256, 300, (x, w, h) => { x.fillStyle = '#F2ECDD'; x.fillRect(0, 0, w, h); x.fillStyle = '#121212'; x.font = `bold ${fs}px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(str, w / 2, h / 2 + 10); x.fillStyle = '#9C7A45'; x.beginPath(); x.arc(w / 2, 22, 9, 0, TAU); x.fill(); }, true) });
    const tg = new RoundedBoxGeometry(.088, .104, .008, 2, .003);
    this.tiles = [];
    const put = (str, X, Y, k) => { const m = new THREE.Mesh(tg, [this.M.paper]); m.material = tile(str, 0, 0, 230); m.castShadow = true; const base = new THREE.Vector3(X, Y, .03); m.position.copy(base); g.add(m); this.tiles.push({ m, base, k }); };
    // board pixels -> local metres: x = (px / 1060 - .5) * BW, y = (.5 - py / 640) * BH
    const px = (a, b) => [(a / 1060 - .5) * BW, (.5 - b / 640) * BH];
    ['1', '8', '3'].forEach((d, i) => { const [X, Y] = px(740 + i * 100, 230); put(d, X, Y, i); });
    ['1', '4', '0'].forEach((d, i) => { const [X, Y] = px(740 + i * 100, 380); put(d, X, Y, 3 + i); });
    // result plate
    const rm = new THREE.MeshStandardMaterial({ roughness: .7, map: ctex(1024, 128, (x, w, h) => { x.fillStyle = '#C9A04F'; x.fillRect(0, 0, w, h); x.fillStyle = '#18241E'; x.font = `bold 78px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('INDIA WON BY 43 RUNS', w / 2, h / 2 + 4); }, true) });
    const res = new THREE.Mesh(new RoundedBoxGeometry(.86, .1, .008, 2, .003), rm); const [rx, ry] = px(530, 540); const rb = new THREE.Vector3(rx, ry, .03); res.position.copy(rb); res.castShadow = true; g.add(res); this.tiles.push({ m: res, base: rb, k: 6 });
    // the result plate's colour is on all faces (RoundedBoxGeometry has one group) - fine, it's a painted plate
  }

  // ------------------------------------------------------------ red leather ball with a stitched seam
  buildBall() {
    const R = .036, g = this.ballG = new THREE.Group(); this.scene.add(g); const spin = this.ballSpin = new THREE.Group(); g.add(spin);
    const lmap = ctex(1024, 512, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const n = noise.noise(xx / 9, yy / 9) * .5 + noise.noise(xx / 70, yy / 50) * .5; const v = 1 + .14 * n; img.data.set([150 * v, 22 * v, 30 * v, 255], i * 4); } x.putImageData(img, 0, 0);
      // quarter seams (thin, unraised) on both halves
      x.strokeStyle = 'rgba(70,6,10,.8)'; x.lineWidth = 3; [w * .25, w * .75].forEach(X => { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, h * .46); x.stroke(); x.beginPath(); x.moveTo(X + w * .25, h * .54); x.lineTo(X + w * .25, h); x.stroke(); });
      // gold foil maker's oval
      x.strokeStyle = '#D9B15C'; x.lineWidth = 6; x.beginPath(); x.ellipse(w * .62, h * .26, 70, 34, 0, 0, TAU); x.stroke(); x.fillStyle = '#D9B15C'; x.font = `bold 26px ${LAT}`; x.textAlign = 'center'; x.fillText('5½ OZ', w * .62, h * .27); }, true);
    const bump = ctex(1024, 512, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const v = 128 + 30 * noise.noise(xx / 5, yy / 5); img.data.set([v, v, v, 255], i * 4); } x.putImageData(img, 0, 0); }, false);
    const ball = this.ball = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshPhysicalMaterial({ map: lmap, roughness: .38, clearcoat: .7, clearcoatRoughness: .25, bumpMap: bump, bumpScale: .4 }));
    ball.castShadow = ball.receiveShadow = true; spin.add(ball);
    // raised main seam: a low band + six rows of stitches (three each side)
    const band = new THREE.Mesh(new THREE.TorusGeometry(R, .0016, 12, 160), new THREE.MeshPhysicalMaterial({ color: '#7E1218', roughness: .5, clearcoat: .4 })); band.rotation.x = Math.PI / 2; spin.add(band);
    const stitchG = new THREE.CapsuleGeometry(.00075, .0026, 3, 6); stitchG.rotateZ(Math.PI / 2);
    const N = 74, rows = [-.0058, -.0042, -.0026, .0026, .0042, .0058], sm2 = new THREE.MeshStandardMaterial({ color: '#F1E9DA', roughness: .6 });
    const inst = new THREE.InstancedMesh(stitchG, sm2, N * rows.length); const o = new THREE.Object3D(); let k = 0;
    rows.forEach(off => { const yy = off, rr = Math.sqrt(R * R - yy * yy) + .0004; for (let i = 0; i < N; i++) { const a = (i + (off > 0 ? .5 : 0)) / N * TAU; o.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr); o.rotation.set(0, -a + Math.PI / 2, Math.sign(off) * .35); o.updateMatrix(); inst.setMatrixAt(k++, o.matrix); } });
    inst.castShadow = true; spin.add(inst);
    spin.rotation.set(.35, 0, .5);
    this.ballR = R;
    // flight path: from the front of the desk, a high arc, down into the cup
    this.flyA = new THREE.Vector3(-.12, R, .38); this.flyB = new THREE.Vector3(.0, .95, -.15); this.flyC = new THREE.Vector3(.34, .245, -.22);
  }

  // ------------------------------------------------------------ the golden cup on a walnut plinth
  buildCup() {
    const g = this.cupG = new THREE.Group(); g.position.set(.34, 0, -.22); this.scene.add(g);
    const pl = new THREE.Mesh(new RoundedBoxGeometry(.15, .07, .15, 3, .006), this.M.walnut); pl.position.y = .035; pl.castShadow = pl.receiveShadow = true; g.add(pl);
    const band = new THREE.Mesh(new THREE.BoxGeometry(.152, .016, .152), this.M.brass); band.position.y = .055; g.add(band);
    const cup = new THREE.Mesh(lathe([[0, .07], [.05, .07], [.052, .076], [.032, .084], [.014, .094], [.012, .13], [.022, .14], [.012, .15], [.016, .16], [.045, .18], [.062, .215], [.068, .26], [.066, .262], [.06, .22], [.044, .19], [.012, .168], [0, .166]], 128), this.M.gold);
    cup.castShadow = cup.receiveShadow = true; g.add(cup);
    [-1, 1].forEach(sd => { const h = new THREE.Mesh(new THREE.TorusGeometry(.03, .0045, 16, 48, Math.PI * 1.15), this.M.gold); h.position.set(sd * .07, .215, 0); h.rotation.z = sd > 0 ? -Math.PI * .57 : Math.PI * .43; h.castShadow = true; g.add(h); });
    this.cup = cup;
  }

  // ------------------------------------------------------------ bookmaker's slate "INDIA 66-1"
  buildSlate() {
    const g = this.slateG = new THREE.Group(); g.position.set(-.36, 0, -.16); g.rotation.y = .32; this.scene.add(g);
    const map = ctex(800, 600, (x, w, h) => { x.fillStyle = '#26292B'; x.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { x.strokeStyle = `rgba(255,255,255,${rnd() * .05})`; x.lineWidth = 8 + rnd() * 30; x.beginPath(); const X = rnd() * w, Y = rnd() * h; x.moveTo(X, Y); x.lineTo(X + 60, Y + rnd() * 20); x.stroke(); } x.fillStyle = '#F2F0E8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 70px ${LAT}`; x.fillText('ODDS · 1983', w / 2, 90); x.font = `bold 120px ${LAT}`; x.fillText('INDIA', w / 2, 250); x.fillStyle = '#FFD45A'; x.font = `bold 190px ${LAT}`; x.fillText('66-1', w / 2, 440); x.fillStyle = '#F2F0E8'; x.font = `48px ${LAT}`; x.fillText('to win the Cup', w / 2, 560); }, true);
    const fr = new THREE.Mesh(new RoundedBoxGeometry(.2, .155, .012, 2, .004), this.M.walnut); fr.castShadow = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(.184, .138), new THREE.MeshStandardMaterial({ map, roughness: .9 })); face.position.z = .0065;
    const lean = new THREE.Group(); lean.position.set(0, .075, 0); lean.rotation.x = -.22; lean.add(fr, face); g.add(lean);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.012, .14, .008), this.M.walnut); leg.position.set(0, .068, -.04); leg.rotation.x = .35; g.add(leg);
  }

  // ------------------------------------------------------------ brass nameplate
  buildNameplate() {
    const g = this.plateG = new THREE.Group(); g.position.set(-.2, 0, .0); g.rotation.y = .12; this.scene.add(g);
    const blk = new THREE.Mesh(new RoundedBoxGeometry(.22, .03, .04, 2, .005), this.M.walnut); blk.position.set(0, .015, 0); blk.castShadow = blk.receiveShadow = true; g.add(blk);
    const map = ctex(1200, 260, (x, w, h) => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1e1e1e'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 120px ${SERIF}`; x.fillText('N. K. P. SALVE', w / 2, 92); x.font = `bold 64px ${SERIF}`; x.fillText('PRESIDENT, B.C.C.I.', w / 2, 200); }, false);
    const pm = this.M.brass.clone(); pm.bumpMap = map; pm.bumpScale = 2; pm.roughness = .3;
    const col = ctex(1200, 260, (x, w, h) => { x.fillStyle = '#C79A4E'; x.fillRect(0, 0, w, h); x.fillStyle = '#2A1E0E'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 120px ${SERIF}`; x.fillText('N. K. P. SALVE', w / 2, 92); x.font = `bold 64px ${SERIF}`; x.fillText('PRESIDENT, B.C.C.I.', w / 2, 200); }, true);
    pm.map = col; pm.color.set('#FFFFFF');
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.2, .043), pm); plate.position.set(0, .032, .006); plate.rotation.x = -Math.PI / 2 + .75; g.add(plate);
  }

  // ------------------------------------------------------------ desk globe with real coastlines
  buildGlobe() {
    const g = this.globeG = new THREE.Group(); g.position.set(-.66, 0, -.36); this.scene.add(g); const R = this.gR = .16;
    const base = new THREE.Mesh(lathe([[0, 0], [.1, 0], [.1, .012], [.085, .024], [.03, .034], [.016, .06], [0, .06]], 64), this.M.walnut); base.castShadow = base.receiveShadow = true; g.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.008, .01, .12, 24), this.M.brass); post.position.y = .11; g.add(post);
    const tilt = this.globeTilt = new THREE.Group(); tilt.position.y = .34; tilt.rotation.z = 23.4 * D2R; g.add(tilt);
    const mer = new THREE.Mesh(new THREE.TorusGeometry(R + .012, .0045, 12, 128, Math.PI * 1.25), this.M.brass); mer.rotation.z = -Math.PI * .125 + Math.PI / 2; mer.rotation.y = Math.PI / 2; tilt.add(mer);
    const proj = (lon, lat, w, h) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
    const drawRings = (x, rings, w, h) => { x.beginPath(); rings.forEach(r => { r.forEach(([lo, la], i) => { const [X, Y] = proj(lo, la, w, h); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); }); };
    const map = ctex(4096, 2048, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i += 1) { const xx = i % w, yy = (i / w) | 0; const n = noise.noise(xx / 300, yy / 300) * .5 + noise.noise(xx / 40, yy / 40) * .2; img.data.set([38 + 14 * n, 78 + 14 * n, 88 + 12 * n, 255], i * 4); } x.putImageData(img, 0, 0);
      x.strokeStyle = 'rgba(220,200,150,.22)'; x.lineWidth = 2; for (let lo = -180; lo <= 180; lo += 15) { const [X] = proj(lo, 0, w, h); x.beginPath(); x.moveTo(X, 0); x.lineTo(X, h); x.stroke(); } for (let la = -75; la <= 75; la += 15) { const [, Y] = proj(0, la, w, h); x.beginPath(); x.moveTo(0, Y); x.lineTo(w, Y); x.stroke(); }
      drawRings(x, WORLD.land, w, h); x.fillStyle = '#E3CFA2'; x.fill('evenodd'); x.strokeStyle = '#7A5A30'; x.lineWidth = 3; x.stroke();
      x.lineWidth = 2.5; x.strokeStyle = 'rgba(70,40,20,.75)'; drawRings(x, WORLD.India, w, h); x.stroke(); drawRings(x, WORLD.Pakistan, w, h); x.stroke(); drawRings(x, WORLD.UK, w, h); x.stroke(); }, true);
    const hi = ctex(4096, 2048, (x, w, h) => { x.clearRect(0, 0, w, h); x.lineJoin = 'round'; drawRings(x, WORLD.India, w, h); x.fillStyle = '#FF8A00'; x.fill(); x.strokeStyle = '#FFE08A'; x.lineWidth = 5; x.stroke(); drawRings(x, WORLD.Pakistan, w, h); x.fillStyle = '#1FA05A'; x.fill(); x.stroke(); }, true);
    this.globeMat = new THREE.MeshPhysicalMaterial({ map, roughness: .5, clearcoat: .35, clearcoatRoughness: .3 });
    this.hiMat = new THREE.MeshStandardMaterial({ map: hi, transparent: true, opacity: 0, roughness: .5, emissive: '#FFFFFF', emissiveMap: hi, emissiveIntensity: .35, depthWrite: false });
    const spin = this.globeSpin = new THREE.Group(); tilt.add(spin);
    const sph = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), this.globeMat); sph.castShadow = true; spin.add(sph);
    spin.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.002, 128, 96), this.hiMat));
    // England -> India arc (a raised great-circle) and a pin at London
    const A = llv(51.5, -0.1, R), B = llv(22.5, 78.5, R), pts = [];
    for (let i = 0; i <= 80; i++) { const u = i / 80; const p = new THREE.Vector3().copy(A).normalize().lerp(B.clone().normalize(), u).normalize(); pts.push(p.multiplyScalar(R * (1 + .16 * Math.sin(Math.PI * u)))); }
    const curve = new THREE.CatmullRomCurve3(pts); this.arcCurve = curve;
    const tube = this.arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .0028, 10), new THREE.MeshStandardMaterial({ color: '#FFC94A', emissive: '#FFB020', emissiveIntensity: 1.2, metalness: .4, roughness: .3 })); spin.add(tube); this.arcN = tube.geometry.index.count;
    const head = this.arcHead = new THREE.Mesh(new THREE.SphereGeometry(.007, 24, 16), new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFD060', emissiveIntensity: 2.5 })); spin.add(head);
    const pin = this.ukPin = new THREE.Group(); const pn = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0012, .03, 8), this.M.chrome); pn.position.y = .015; const ph = new THREE.Mesh(new THREE.SphereGeometry(.0055, 20, 14), new THREE.MeshPhysicalMaterial({ color: '#D7262E', roughness: .25, clearcoat: 1 })); ph.position.y = .031; pin.add(pn, ph);
    pin.position.copy(A); pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), A.clone().normalize()); spin.add(pin);
    this.llA = A; this.llB = B;
  }

  // ------------------------------------------------------------ painted steel cash box (opens empty)
  buildCashBox() {
    const g = this.boxG = new THREE.Group(); g.position.set(.6, 0, .12); g.rotation.y = -.42; this.scene.add(g);
    const W = .22, H = .075, Dp = .15, t = .004;
    const shell = (w, h, d, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .002), m);
    const parts = [[W, t, Dp, 0, t / 2, 0], [W, H, t, 0, H / 2, Dp / 2 - t / 2], [W, H, t, 0, H / 2, -Dp / 2 + t / 2], [t, H, Dp, W / 2 - t / 2, H / 2, 0], [t, H, Dp, -W / 2 + t / 2, H / 2, 0]];
    parts.forEach(([w, h, d, x, y, z]) => { const m = shell(w, h, d, this.M.steel); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); });
    const tray = shell(W - .012, .004, Dp - .012, this.M.steelIn); tray.position.y = .03; g.add(tray);
    for (let i = 1; i < 4; i++) { const dv = shell(.003, .02, Dp - .014, this.M.steelIn); dv.position.set(-W / 2 + i * W / 4, .04, 0); g.add(dv); }
    const lid = this.lid = new THREE.Group(); lid.position.set(0, H, -Dp / 2); g.add(lid);
    const lt = shell(W + .004, .012, Dp + .004, this.M.steel); lt.position.set(0, .006, Dp / 2); lt.castShadow = true; lid.add(lt);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(.03, .004, 12, 32, Math.PI), this.M.brass); hd.position.set(0, .012, Dp / 2); hd.rotation.y = 0; lid.add(hd);
    const lock = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .004, 24), this.M.brass); lock.rotation.x = Math.PI / 2; lock.position.set(0, H - .012, Dp / 2 + .002); g.add(lock);
  }

  // ------------------------------------------------------------ vintage chrome microphone + spotlight
  buildMic() {
    const g = this.micG = new THREE.Group(); g.position.set(.78, 0, -.36); this.scene.add(g);
    const base = new THREE.Mesh(lathe([[0, 0], [.07, 0], [.072, .006], [.06, .016], [.012, .02], [0, .02]], 64), this.M.chrome); base.castShadow = base.receiveShadow = true; g.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .3, 24), this.M.chrome); pole.position.y = .17; pole.castShadow = true; g.add(pole);
    const head = this.micHead = new THREE.Group(); head.position.y = .38; head.rotation.y = -.5; g.add(head);
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(.034, .004, 12, 48, Math.PI), this.M.chrome); yoke.rotation.z = Math.PI; yoke.position.y = -.005; head.add(yoke);
    const grille = ctex(512, 512, (x, w, h) => { x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1a1a'; for (let i = 0; i < 26; i++) x.fillRect(0, 20 + i * 18, w, 7); }, false);
    const gm = this.M.chrome.clone(); gm.bumpMap = grille; gm.bumpScale = 3; gm.roughnessMap = grille;
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(.03, .05, 12, 48), gm); cap.castShadow = true; head.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.0305, .003, 10, 64), this.M.chrome); ring.rotation.x = Math.PI / 2; head.add(ring);
    const spot = this.spot = new THREE.SpotLight('#FFE7C0', 0, 3, .32, .6, 1.2); spot.position.set(.78, 1.4, -.1); spot.target.position.set(.78, .3, -.36); this.scene.add(spot, spot.target);
    const cone = this.cone = new THREE.Mesh(new THREE.ConeGeometry(.32, 1.1, 48, 1, true), new THREE.MeshBasicMaterial({ color: '#FFE2B0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    cone.position.set(.78, .87, -.3); cone.rotation.x = -.18; this.scene.add(cone);
  }

  // ------------------------------------------------------------ 14 envelopes "₹1,00,000"
  buildEnvelopes() {
    const map = ctex(720, 400, (x, w, h) => { x.fillStyle = '#EADCBC'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,80,40,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(w / 2, h * .55); x.lineTo(w, 0); x.stroke(); x.fillStyle = '#8E1218'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 96px ${LAT}`; x.fillText('₹1,00,000', w / 2, h * .74); x.fillStyle = '#4A3420'; x.font = `bold 36px ${LAT}`; x.fillText('B.C.C.I. · 1983', w / 2, h * .92); }, true);
    const m = new THREE.MeshStandardMaterial({ map, roughness: .85 }), side = new THREE.MeshStandardMaterial({ color: '#E2D2B0', roughness: .85 });
    const geo = new THREE.BoxGeometry(.15, .0016, .085);
    this.envs = [];
    for (let i = 0; i < 14; i++) { const e = new THREE.Mesh(geo, [side, side, m, side, side, side]); e.castShadow = e.receiveShadow = true; this.scene.add(e); const j = 13 - i, to = new THREE.Vector3(.17 - j * .013, .0016 + i * .0017, -.02 - j * .007), from = to.clone().add(new THREE.Vector3(.45, .06, -.12)); this.envs.push({ e, from, to, rot: .08 + j * .012, k: i }); }
  }

  // ------------------------------------------------------------ gold coin stacks: ICC revenue share 2024-27
  buildStacks() {
    const cg = lathe([[0, 0], [.03, 0], [.0312, .0006], [.0312, .0034], [.03, .004], [.027, .004], [.0265, .0036], [0, .0036]], 64);
    const cm = this.M.gold.clone(); cm.bumpMap = ctex(256, 256, (x, w, h) => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b8b8b8'; x.lineWidth = 8; x.beginPath(); x.arc(128, 128, 100, 0, TAU); x.stroke(); }, false); cm.bumpScale = 1;
    const data = [['INDIA', 38.5], ['ENGLAND', 6.89], ['AUSTRALIA', 6.25], ['PAKISTAN', 5.75]];
    this.stacks = []; const o = new THREE.Object3D();
    data.forEach(([name, pct], i) => { const n = Math.round(pct * 2), x = -.3 + i * .2; const im = new THREE.InstancedMesh(cg, cm, n); im.castShadow = im.receiveShadow = true;
      for (let k = 0; k < n; k++) { o.position.set(x + (rnd() - .5) * .0016, k * .0041, -.62 + (rnd() - .5) * .0016); o.rotation.set(0, rnd() * TAU, 0); o.updateMatrix(); im.setMatrixAt(k, o.matrix); }
      im.count = 0; im.frustumCulled = false; this.scene.add(im);
      const pm = this.M.brass.clone(); pm.color.set('#FFFFFF'); pm.map = ctex(600, 220, (x, w, h) => { x.fillStyle = '#C79A4E'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7A5A28'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#20160A'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 66px ${LAT}`; x.fillText(name, w / 2, 70); x.font = `bold 84px ${LAT}`; x.fillText(pct + '%', w / 2, 160); }, true);
      const pg = new THREE.Group(); pg.position.set(x, 0, -.5); this.scene.add(pg);
      const blk = new THREE.Mesh(new RoundedBoxGeometry(.15, .03, .05, 2, .004), this.M.walnut); blk.position.y = .015; blk.castShadow = true; pg.add(blk);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(.14, .051), pm); plate.position.set(0, .031, .006); plate.rotation.x = -Math.PI / 2 + .55; pg.add(plate);
      this.stacks.push({ im, n, x, name });
    });
  }

  // ------------------------------------------------------------ green-shaded banker's lamp
  buildLamp() {
    const g = this.lampG = new THREE.Group(); g.position.set(-.5, 0, -.86); g.rotation.y = .5; this.scene.add(g);
    const base = new THREE.Mesh(new RoundedBoxGeometry(.16, .02, .1, 2, .006), this.M.brass); base.position.y = .01; base.castShadow = true; g.add(base);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .3, 16), this.M.brass); st.position.y = .16; g.add(st);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .26, 48, 1, true, 0, Math.PI), this.M.greenGlass); shade.rotation.set(0, 0, Math.PI / 2); shade.rotation.order = 'ZYX'; shade.position.set(0, .32, .02); shade.castShadow = true; g.add(shade);
    const capL = new THREE.Mesh(new THREE.CircleGeometry(.06, 32, 0, Math.PI), this.M.brass); capL.position.set(-.13, .32, .02); capL.rotation.y = -Math.PI / 2; g.add(capL);
    const lp = this.lampLight = new THREE.PointLight('#FFD9A0', .6, 1.2, 1.5); lp.position.set(0, .28, .04); g.add(lp);
  }

  // ------------------------------------------------------------ anchors for labels
  anchor(name) {
    const wp = o => o.getWorldPosition(new THREE.Vector3());
    this.scene.updateMatrixWorld(true);
    switch (name) {
      case 'pass': return wp(this.passG).add(new THREE.Vector3(0, .01, 0));
      case 'stamp': return wp(this.stampG).add(new THREE.Vector3(0, .12, 0));
      case 'board': return wp(this.boardG);
      case 'score1': return this.tiles[1].m.getWorldPosition(new THREE.Vector3());
      case 'score2': return this.tiles[4].m.getWorldPosition(new THREE.Vector3());
      case 'ball': return wp(this.ballG);
      case 'cup': return wp(this.cupG).add(new THREE.Vector3(0, .26, 0));
      case 'slate': return wp(this.slateG).add(new THREE.Vector3(0, .1, 0));
      case 'plate': return wp(this.plateG).add(new THREE.Vector3(0, .04, .01));
      case 'globe': return wp(this.globeTilt);
      case 'uk': return this.ukPin.localToWorld(new THREE.Vector3(0, .031, 0));
      case 'india': return this.globeSpin.localToWorld(this.llB.clone().multiplyScalar(1.01));
      case 'pak': return this.globeSpin.localToWorld(llv(30, 69.5, this.gR * 1.01));
      case 'arcHead': return wp(this.arcHead);
      case 'box': return wp(this.boxG).add(new THREE.Vector3(0, .08, 0));
      case 'mic': return wp(this.micHead);
      case 'env': return new THREE.Vector3(.16, .03, .0);
      case 'stackI': case 'stackE': case 'stackA': case 'stackP': { const s = this.stacks['IEAP'.indexOf(name[5])]; return new THREE.Vector3(s.x, s.im.count * .0041 + .01, -.62); }
    }
    return new THREE.Vector3();
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { return []; }

  // ------------------------------------------------------------ one frame
  render(t) {
    const S = this.ST, st = this.studio;
    st.renderer.toneMappingExposure = S.exposure;
    // rubber stamp: 0 parked, .5 pressed on the pass, 1 lifted clear
    { const u = cl(S.stamp), hit = this.stampHit.clone(); hit.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0); const above = hit.clone().add(new THREE.Vector3(0, .1, 0));
      let p; if (u < .5) { const a = sm(cl(u / .38)), d = Math.pow(cl((u - .38) / .12), 2); p = this.stampPark.clone().lerp(above, a); p.y = lerp(p.y, hit.y, d); }
      else { const a = sm(cl((u - .5) / .5)); p = hit.clone().lerp(above.clone().add(new THREE.Vector3(.1, .08, -.08)), a); }
      this.stampG.position.copy(p); this.stampG.rotation.set(0, .26 - .2 * sm(cl(u * 2)) + .2 * sm(cl(u * 2 - 1)), 0); this.stampG.visible = u > 0 && u < 1; }
    this.ink.material.opacity = cl(S.ink);
    // the pass slides away across the desk and back
    this.passG.position.z = .22 - .3 * sm(cl(S.slide)); this.passG.position.x = .06 * Math.sin(Math.PI * cl(S.slide));
    // scoreboard tiles drop onto their hooks
    this.tiles.forEach(tl => { const u = cl(S.score * 7.2 - tl.k); tl.m.visible = u > 0; tl.m.position.copy(tl.base); tl.m.position.y += (1 - sm(u)) * .07; tl.m.rotation.z = (1 - u) * .2 * Math.sin(tl.k * 3.1); });
    // ball: rests by the slate, flies a quadratic arc into the cup
    { const u = cl(S.fly); const a = this.flyA, b = this.flyB, c = this.flyC; const p = new THREE.Vector3(); p.x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * b.x + u * u * c.x; p.y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * b.y + u * u * c.y; p.z = (1 - u) * (1 - u) * a.z + 2 * (1 - u) * u * b.z + u * u * c.z; this.ballG.position.copy(p); this.ballSpin.rotation.set(.35 + u * 9, 0, .5 + u * 4); }
    this.M.gold.emissive.set('#FFB020'); this.M.gold.emissiveIntensity = .25 * S.cupGlow;
    // globe: spin so longitude S.lon faces the camera side, India + Pakistan glow, the arc draws
    this.globeSpin.rotation.y = -(S.lon + 90) * D2R;
    this.hiMat.opacity = cl(S.indpak);
    { const u = cl(S.arc); this.arc.visible = u > 0; this.arc.geometry.setDrawRange(0, Math.floor(this.arcN * u / 3) * 3); this.arcHead.visible = u > 0 && u < 1; this.arcHead.position.copy(this.arcCurve.getPointAt(Math.min(.999, u))); }
    this.ukPin.scale.setScalar(Math.max(.001, sm(cl(S.ukPin))));
    // cash box lid, spotlight, envelopes, coin stacks
    this.lid.rotation.x = -1.95 * sm(cl(S.box));
    this.spot.intensity = 9 * S.spot; this.cone.material.opacity = .07 * S.spot;
    this.envs.forEach(e => { const u = sm(cl(S.env * 3.6 - e.k * .2)); e.e.visible = u > 0; e.e.position.copy(e.from).lerp(e.to, u); e.e.position.y = lerp(e.from.y, e.to.y, u) + Math.sin(Math.PI * u) * .02; e.e.rotation.set(0, lerp(-.6, e.rot, u), 0); });
    this.stacks.forEach((s, i) => { s.im.count = Math.round(s.n * cl(i ? S.share2 * 1.4 - (i - 1) * .2 : S.share)); });
    // camera, light sweep
    const c = S.cam; const dd = Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz), nr = cl(dd * .05, .005, .2); if (Math.abs(st.camera.near - nr) > 1e-5) { st.camera.near = nr; st.camera.updateProjectionMatrix(); }
    st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.glint.intensity = 3 * Math.sin(Math.PI * cl(S.sweep)); st.glint.position.set(c.tx - .5 + 1 * S.sweep, c.ty + .35, c.tz + .45);
    st.key.position.set(c.tx + 1.4, 3.0, c.tz + 2.2); st.key.target.position.set(c.tx, 0, c.tz); st.key.target.updateMatrixWorld();
    st.render();
  }
}
