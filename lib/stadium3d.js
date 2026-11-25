// stadium3d.js - a farm plot that becomes a floodlit cricket stadium (Vaibhav Sooryavanshi reel; ES module, three r186).
//
//   import { StadiumWorld } from './lib/stadium3d.js';
//   const W = new StadiumWorld(canvas);  W.ST.farm = 1;  W.ST.night = 0;  W.render(t);  W.screen('ball') -> [x, y]
//
// Units are metres. The 22-yard pitch runs along z (batting end z = +10.06, bowling end z = -10.06).
// ST.farm      1 = golden-hour farm plot (soil furrows, crops, fence, a SOLD peg, a bat leaning on the fence); 0 = cricket pitch
// ST.stadium   0 = open country with trees; 1 = tiered stands, floodlight towers and an LED scoreboard risen from the ground
// ST.night     0 = golden hour (low sun); 1 = night under floodlights
// ST.explode   the hero ball comes apart: leather halves, stitched seam, wound twine, cork core (labels via explodedLabels())
// ST.sixes     0..28: glowing balls launched from the batting crease out over the stands, one after another
// ST.rain      0..1: the 28 balls fall back out of the sky into the plot
// ST.board     scoreboard mode (0 off, 1 auction, 2 target, 3 innings, 4 result, 5 photo + AGE 15; modes 1, 3 and 5 show the photo from setPhotos({ player })); ST.price, ST.runs, ST.balls, ST.six, ST.overs feed it
import * as THREE from 'three';
import { Studio, Exploded } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
const rnd = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; }
const PL = 22, PW = 3.05, SZ = 10.06;           // pitch strip, stumps line
const PLOT = { w: 9, l: 25 };                    // the farm plot
const BALL = { x: 0, y: 1.05, z: 8.4 };          // hero ball for the anatomy shot
const CREASE = new THREE.Vector3(0, 1.1, 8.9);    // where the sixes start

export class StadiumWorld {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#F3C27B', '#7AA7D6'], floorY: -.02, fov: 40, exposure: 1.0, aperture: .00002, bloom: .3, floor: '#3A5A22', env: .45, aoStrength: .6 });
    const s = this.scene = st.scene; s.background = null; st.floor.visible = false;
    st.key.intensity = 0; st.key.castShadow = false;
    s.children.filter(o => o.isDirectionalLight || o.isHemisphereLight).forEach(o => o.intensity *= .25);
    s.fog = new THREE.Fog('#E9B97A', 40, 260);
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .45, distanceExponent: 1.3, thickness: .4, scale: 1, samples: 12 });
    if (st.bloom) { st.bloom.threshold = .72; st.bloom.radius = .5; }
    this.buildSky(); this.buildGround(); this.buildPlot(); this.buildPitch(); this.buildBat(); this.buildStadium(); this.buildBoard(); this.buildBall(); this.buildSixes(); this.buildLights();
    this.ST = { cam: { px: 0, py: 2, pz: 16, tx: 0, ty: .5, tz: 0, fov: 40, roll: 0, near: .05 }, aperture: .00002, exposure: 1.0,
      farm: 1, stadium: 0, night: 0, explode: 0, ballOn: 0, ballSpin: 0, ballGlow: 0, sixes: 0, rain: 0, board: 0, price: 0, runs: 0, balls: 0, six: 0, overs: 0, peg: 1, batOn: 1, bx: 0, by: 0, bz: 0 };
  }

  // ------------------------------------------------------------ golden-hour sky and night sky (two domes, crossfaded)
  buildSky() {
    const dome = (stops, glow) => { const t = ctex(16, 1024, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); }, true);
      const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, depthWrite: false, fog: false, transparent: true, toneMapped: true });
      const d = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 32), m); this.scene.add(d); return m; };
    this.dayMat = dome([[0, '#3E78C2'], [.32, '#8FB8E0'], [.47, '#F7D39A'], [.5, '#FFB15E'], [.53, '#C88A52'], [1, '#5A4630']]);
    this.nightMat = dome([[0, '#01030A'], [.38, '#06101F'], [.49, '#16304E'], [.5, '#22466A'], [.53, '#0B1420'], [1, '#05080C']]);
    // the low sun: a soft disc on the horizon behind the bowling end
    this.sun = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ color: '#FFE2A8', fog: false, toneMapped: false, transparent: true }));
    this.sun.position.set(-60, 26, -420); this.sun.lookAt(0, 0, 0); this.scene.add(this.sun);
  }

  // ------------------------------------------------------------ the ground: patchwork fields (day farm) under a striped outfield (stadium)
  buildGround() {
    const fields = ctex(2048, 2048, (x, w, h) => { x.fillStyle = '#56702E'; x.fillRect(0, 0, w, h);
      const cols = ['#6E8A33', '#8A9A3C', '#B49A4A', '#5E7A2C', '#7C8E3A', '#A08C44', '#4E6A2A'];
      for (let i = 0; i < 70; i++) { x.save(); x.translate(rnd() * w, rnd() * h); x.rotate((rnd() - .5) * .5); x.fillStyle = cols[i % cols.length]; const fw = 180 + rnd() * 420, fh = 140 + rnd() * 380; x.fillRect(-fw / 2, -fh / 2, fw, fh);
        x.strokeStyle = 'rgba(40,30,15,.35)'; x.lineWidth = 2; for (let k = -fw / 2; k < fw / 2; k += 9) { x.beginPath(); x.moveTo(k, -fh / 2); x.lineTo(k, fh / 2); x.stroke(); } x.restore(); }
      for (let i = 0; i < 60000; i++) { x.fillStyle = `rgba(${rnd() < .5 ? 0 : 255},${rnd() < .5 ? 40 : 255},0,${rnd() * .06})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, true, 3, 3);
    this.fieldMat = new THREE.MeshStandardMaterial({ map: fields, roughness: .95 });
    const fg = new THREE.Mesh(new THREE.CircleGeometry(400, 96), this.fieldMat); fg.rotation.x = -Math.PI / 2; fg.position.y = -.03; fg.receiveShadow = true; this.scene.add(fg);
    // outfield: mown stripes along the pitch, a fine grain, slightly brighter square in the middle
    const grass = ctex(2048, 2048, (x, w, h) => { for (let i = 0; i < 24; i++) { x.fillStyle = i % 2 ? '#3F7A2C' : '#4C8A33'; x.fillRect(i * w / 24, 0, w / 24 + 1, h); }
      for (let i = 0; i < 160000; i++) { x.fillStyle = `rgba(${rnd() < .5 ? 20 : 170},${rnd() < .5 ? 60 : 200},${rnd() < .5 ? 10 : 90},${rnd() * .09})`; x.fillRect(rnd() * w, rnd() * h, 1, 3); }
      const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .5); g.addColorStop(0, 'rgba(255,255,220,.06)'); g.addColorStop(1, 'rgba(0,0,0,.12)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, true);
    this.grassMat = new THREE.MeshStandardMaterial({ map: grass, roughness: .88, transparent: true, opacity: 0 });
    const og = this.outfield = new THREE.Mesh(new THREE.CircleGeometry(52, 128), this.grassMat); og.rotation.x = -Math.PI / 2; og.position.y = -.015; og.receiveShadow = true; this.scene.add(og);
    // boundary rope
    this.ropeMat = new THREE.MeshStandardMaterial({ color: '#F2F2F2', roughness: .5, transparent: true, opacity: 0 });
    const rope = new THREE.Mesh(new THREE.TorusGeometry(46, .08, 8, 256), this.ropeMat); rope.rotation.x = Math.PI / 2; rope.position.y = .08; this.scene.add(rope);
    // tree line around the farm (sinks when the stadium rises)
    const trees = this.trees = new THREE.Group(); this.scene.add(trees);
    const N = 260, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, .4, 4, 7), new THREE.MeshStandardMaterial({ color: '#3A2C1E', roughness: .9 }), N);
    const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.6, 1), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .9 }), N * 6);
    const o = new THREE.Object3D(); let k = 0;
    const tc = new THREE.Color(); for (let i = 0; i < N; i++) { const a = rnd() * TAU, r = 120 + rnd() * 90, sc = 1.2 + rnd() * .9, x = Math.sin(a) * r, z = Math.cos(a) * r;
      o.position.set(x, 2 * sc, z); o.scale.setScalar(sc); o.rotation.set(0, 0, 0); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
      for (let j = 0; j < 6; j++) { o.position.set(x + (rnd() - .5) * 4 * sc, (4.6 + rnd() * 2.6) * sc, z + (rnd() - .5) * 4 * sc); o.scale.set(sc * (1 + rnd() * .5), sc * (.7 + rnd() * .3), sc * (1 + rnd() * .5)); o.rotation.set(rnd(), rnd(), rnd()); o.updateMatrix(); crown.setMatrixAt(k, o.matrix); tc.setHSL(.24 + rnd() * .06, .35 + rnd() * .2, .16 + rnd() * .1); crown.setColorAt(k, tc); k++; } }
    [trunk, crown].forEach(m => { m.castShadow = true; m.frustumCulled = false; trees.add(m); });
  }

  // ------------------------------------------------------------ the farm plot: furrowed soil, crop rows, a fence, a SOLD peg
  buildPlot() {
    const g = this.plot = new THREE.Group(); this.scene.add(g);
    const soil = ctex(1024, 2048, (x, w, h) => { x.fillStyle = '#6A4A30'; x.fillRect(0, 0, w, h);
      const rows = 18; for (let i = 0; i < rows; i++) { const cx = (i + .5) * w / rows; const gr = x.createLinearGradient(cx - w / rows / 2, 0, cx + w / rows / 2, 0); gr.addColorStop(0, '#4A3220'); gr.addColorStop(.5, '#8A6444'); gr.addColorStop(1, '#4A3220'); x.fillStyle = gr; x.fillRect(cx - w / rows / 2, 0, w / rows, h); }
      for (let i = 0; i < 90000; i++) { const v = rnd(); x.fillStyle = `rgba(${v < .5 ? 30 : 190},${v < .5 ? 20 : 150},${v < .5 ? 10 : 110},${rnd() * .22})`; x.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3); } }, true);
    const sb = ctex(1024, 2048, (x, w, h) => { const rows = 18; for (let i = 0; i < rows; i++) { const cx = (i + .5) * w / rows; const gr = x.createLinearGradient(cx - w / rows / 2, 0, cx + w / rows / 2, 0); gr.addColorStop(0, '#202020'); gr.addColorStop(.5, '#E0E0E0'); gr.addColorStop(1, '#202020'); x.fillStyle = gr; x.fillRect(cx - w / rows / 2, 0, w / rows, h); }
      for (let i = 0; i < 50000; i++) { x.fillStyle = `rgba(${rnd() < .5 ? 0 : 255},${rnd() < .5 ? 0 : 255},${rnd() < .5 ? 0 : 255},${rnd() * .3})`; x.fillRect(rnd() * w, rnd() * h, 3, 3); } }, false);
    this.soilMat = new THREE.MeshStandardMaterial({ map: soil, bumpMap: sb, bumpScale: 2.2, roughness: .97, transparent: true });
    const plotM = this.plotMesh = new THREE.Mesh(new THREE.PlaneGeometry(PLOT.w, PLOT.l, 1, 1), this.soilMat); plotM.rotation.x = -Math.PI / 2; plotM.position.y = .012; plotM.receiveShadow = true; g.add(plotM);
    // crops: young green shoots in the furrows (instanced blades)
    const blade = new THREE.ConeGeometry(.016, .3, 3, 1); blade.translate(0, .15, 0);
    const N = 5200, crops = this.crops = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .7 }), N); const cc = new THREE.Color();
    const o = new THREE.Object3D(); this.cropBase = [];
    for (let i = 0; i < N; i++) { const row = i % 18, x = -PLOT.w / 2 + (row + .5) * PLOT.w / 18 + (rnd() - .5) * .08, z = -PLOT.l / 2 + .4 + rnd() * (PLOT.l - .8);
      const sc = .6 + rnd() * .8, ry = rnd() * TAU, tx = (rnd() - .5) * .7, tz = (rnd() - .5) * .7; this.cropBase.push([x, z, sc, ry, tx, tz]); cc.setHSL(.22 + rnd() * .07, .45 + rnd() * .2, .28 + rnd() * .12); crops.setColorAt(i, cc); }
    crops.castShadow = true; crops.frustumCulled = false; g.add(crops); this._o = o;
    // fence: wooden posts + two wire rails around the plot
    const posts = []; const fx = PLOT.w / 2 + .4, fz = PLOT.l / 2 + .4;
    for (let z = -fz; z <= fz + .01; z += 2.08) { posts.push([-fx, z], [fx, z]); } for (let x = -fx + 2.25; x < fx - .5; x += 2.25) { posts.push([x, -fz], [x, fz]); }
    const wood = new THREE.MeshStandardMaterial({ color: '#7A5C3E', roughness: .85, map: ctex(128, 512, (x, w, h) => { x.fillStyle = '#7A5C3E'; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(${rnd() < .5 ? 40 : 160},${rnd() < .5 ? 25 : 120},10,.35)`; x.lineWidth = 1 + rnd() * 2; x.beginPath(); const xx = rnd() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + 8, h * .3, xx - 8, h * .6, xx + 4, h); x.stroke(); } }, true) });
    const pm = this.posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .075, 1.3, 8), wood, posts.length);
    posts.forEach(([x, z], i) => { o.position.set(x, .65, z); o.rotation.set((rnd() - .5) * .06, 0, (rnd() - .5) * .06); o.scale.setScalar(1); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); });
    pm.castShadow = true; g.add(pm);
    const wire = new THREE.MeshStandardMaterial({ color: '#9A9A92', metalness: .8, roughness: .4 });
    for (const yy of [.55, 1.05]) { for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, fz * 2, 4), wire); r.rotation.x = Math.PI / 2; r.position.set(sx * fx, yy, 0); g.add(r); }
      for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, fx * 2, 4), wire); r.rotation.z = Math.PI / 2; r.position.set(0, yy, sz * fz); g.add(r); } }
    // the SOLD peg in the corner of the plot nearest the camera
    const peg = this.peg = new THREE.Group(); peg.position.set(-3.2, 0, 10.6); g.add(peg);
    const stake = new THREE.Mesh(new RoundedBoxGeometry(.07, 1.4, .07, 2, .01), wood); stake.position.y = .7; stake.castShadow = true; peg.add(stake);
    const signT = ctex(640, 400, (x, w, h) => { x.fillStyle = '#F4EEE0'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(120,90,50,${rnd() * .08})`; x.fillRect(rnd() * w, rnd() * h, 3, 3); }
      x.strokeStyle = '#B3261E'; x.lineWidth = 14; x.strokeRect(20, 20, w - 40, h - 40); x.fillStyle = '#B3261E'; x.font = '900 190px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SOLD', w / 2, h / 2 + 8); }, true);
    const sign = new THREE.Mesh(new RoundedBoxGeometry(.62, .39, .025, 2, .006), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: signT, roughness: .7 }), wood]);
    sign.position.set(0, 1.18, .05); sign.rotation.z = -.05; sign.castShadow = true; peg.add(sign);
    peg.rotation.y = .5;
  }

  // ------------------------------------------------------------ the 22-yard pitch with creases, and the stumps
  buildPitch() {
    const T = ctex(512, 3712, (x, w, h) => { const mx = w / PW, mz = h / PL; x.fillStyle = '#C9B488'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 70000; i++) { const v = rnd(); x.fillStyle = `rgba(${v < .5 ? 120 : 245},${v < .5 ? 95 : 230},${v < .5 ? 60 : 190},${rnd() * .18})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
      for (const e of [-1, 1]) { const g = x.createRadialGradient(w / 2, h / 2 + e * 8.8 * mz, 5, w / 2, h / 2 + e * 8.8 * mz, 2.4 * mz); g.addColorStop(0, 'rgba(110,80,45,.45)'); g.addColorStop(1, 'rgba(110,80,45,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      x.strokeStyle = 'rgba(90,65,40,.4)'; x.lineWidth = 1.5; for (let i = 0; i < 160; i++) { let px = rnd() * w, py = rnd() * h; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (rnd() - .5) * 40; py += (rnd() - .5) * 40; x.lineTo(px, py); } x.stroke(); }
      x.fillStyle = '#FAFAF6'; const lw = .05 * mz;
      for (const e of [-1, 1]) { const zs = h / 2 + e * SZ * mz, zp = h / 2 + e * (SZ - 1.22) * mz;
        x.fillRect(0, zs - lw / 2, w, lw); x.fillRect(0, zp - lw / 2, w, lw);
        for (const sx of [-1, 1]) x.fillRect(w / 2 + sx * 1.32 * mx - lw / 2, Math.min(zp, zs + e * 1.22 * mz) - (e > 0 ? 0 : 0), lw, Math.abs(zs + e * 1.22 * mz - zp) + 2.44 * mz * 0); } }, true);
    this.pitchMat = new THREE.MeshStandardMaterial({ map: T, roughness: .92, transparent: true, opacity: 0 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), this.pitchMat); p.rotation.x = -Math.PI / 2; p.position.y = .02; p.receiveShadow = true; this.scene.add(p);
    // stumps: three ash stumps + two bails at each end
    const ash = new THREE.MeshPhysicalMaterial({ color: '#E9DCC0', roughness: .45, clearcoat: .6, clearcoatRoughness: .3,
      map: ctex(128, 512, (x, w, h) => { x.fillStyle = '#EADDC2'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(150,110,60,${.1 + rnd() * .15})`; x.lineWidth = 1 + rnd(); const xx = rnd() * w; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx + (rnd() - .5) * 10, h); x.stroke(); } x.fillStyle = '#1F4FA0'; x.fillRect(0, h * .1, w, h * .08); }, true) });
    this.stumps = new THREE.Group(); this.scene.add(this.stumps);
    for (const e of [-1, 1]) { for (const sx of [-1, 0, 1]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .711, 16), ash); s.position.set(sx * .1, .3555, e * SZ); s.castShadow = true; this.stumps.add(s);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(.018, .06, 16), ash); tip.position.set(sx * .1, -.03, e * SZ); this.stumps.add(tip); }
      for (const sx of [-.5, .5]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.009, .09, 4, 10), ash); b.rotation.z = Math.PI / 2; b.position.set(sx * .1, .72, e * SZ); b.castShadow = true; this.stumps.add(b); } }
  }

  // ------------------------------------------------------------ a willow bat leaning on the fence (blade with a spine, cane handle, rubber grip)
  buildBat() {
    const g = this.bat = new THREE.Group(); g.position.set(-4.82, 0, 9.0); g.rotation.set(0, Math.PI / 2 + .25, -.28); this.scene.add(g);
    const willow = ctex(256, 1024, (x, w, h) => { x.fillStyle = '#EAD9B2'; x.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(170,130,80,${.25 + rnd() * .2})`; x.lineWidth = 1.5; const xx = 10 + i * (w - 20) / 13; x.beginPath(); x.moveTo(xx, 0); x.bezierCurveTo(xx + 4, h * .3, xx - 4, h * .7, xx + 2, h); x.stroke(); } for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(150,110,60,${rnd() * .08})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, true);
    const wm = new THREE.MeshPhysicalMaterial({ map: willow, roughness: .5, clearcoat: .5, clearcoatRoughness: .35 });
    const sh = new THREE.Shape(); const bw = .054, bl = .56; sh.moveTo(-bw, .02); sh.quadraticCurveTo(-bw, 0, -bw + .02, 0); sh.lineTo(bw - .02, 0); sh.quadraticCurveTo(bw, 0, bw, .02); sh.lineTo(bw, bl - .04); sh.quadraticCurveTo(bw, bl, bw - .03, bl); sh.lineTo(-bw + .03, bl); sh.quadraticCurveTo(-bw, bl, -bw, bl - .04); sh.closePath();
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 3, curveSegments: 10 }), wm);
    blade.position.z = -.015; blade.castShadow = true; g.add(blade);
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, bl - .08, 24, 1, false, 0, Math.PI), wm); spine.scale.set(1, 1, .9); spine.rotation.y = Math.PI / 2; spine.position.set(0, bl / 2 + .01, -.018); spine.rotation.set(0, -Math.PI / 2, 0); spine.castShadow = true; g.add(spine);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(.016, .017, .3, 24), new THREE.MeshStandardMaterial({ color: '#C9A877', roughness: .6 })); handle.position.y = bl + .15; g.add(handle);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(.0185, .0195, .25, 32), new THREE.MeshStandardMaterial({ color: '#1D3E8A', roughness: .75,
      bumpMap: ctex(64, 256, (x, w, h) => { for (let j = 0; j < h; j += 6) { x.fillStyle = j % 12 ? '#222' : '#ddd'; x.fillRect(0, j, w, 6); } }, false), bumpScale: 1.5 })); grip.position.y = bl + .17; grip.castShadow = true; g.add(grip);
  }

  // ------------------------------------------------------------ tiered stands, roof, floodlight towers (rise with ST.stadium)
  buildStadium() {
    const g = this.stadiumG = new THREE.Group(); this.scene.add(g);
    const prof = [[50, 0], [50, 1.2], [52, 1.2]]; for (let i = 0; i < 26; i++) { const r = 52 + i * .9, y = 1.2 + i * .62; prof.push([r, y], [r + .9, y]); } prof.push([75.5, 17.3], [76, 0]);
    const seats = ctex(4096, 256, (x, w, h) => { x.fillStyle = '#1A2230'; x.fillRect(0, 0, w, h); const cols = ['#2050B0', '#2A62C8', '#1B3E8C', '#E8E4DA', '#D84A2A', '#F2C14E'];
      for (let i = 0; i < 9000; i++) { x.fillStyle = rnd() < .75 ? cols[(rnd() * 3) | 0] : cols[3 + ((rnd() * 3) | 0)]; x.fillRect(rnd() * w, rnd() * h, 3, 4); } }, true, 6, 1);
    const stands = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 160), new THREE.MeshStandardMaterial({ map: seats, roughness: .8, side: THREE.DoubleSide }));
    stands.receiveShadow = true; g.add(stands);
    // a cantilever roof ring with a glowing underside edge
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(78, 64, 1.2, 160, 1, true), new THREE.MeshStandardMaterial({ color: '#2A2F38', roughness: .5, metalness: .4, side: THREE.DoubleSide })); roof.position.y = 22; g.add(roof);
    this.roofGlow = new THREE.Mesh(new THREE.TorusGeometry(64, .12, 6, 200), new THREE.MeshBasicMaterial({ color: '#CFE3FF', toneMapped: false })); this.roofGlow.rotation.x = Math.PI / 2; this.roofGlow.position.y = 21.4; g.add(this.roofGlow);
    // four floodlight towers
    this.panels = []; const steel = new THREE.MeshStandardMaterial({ color: '#7D838C', metalness: .7, roughness: .4 });
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.sin(a) * 70, z = Math.cos(a) * 70; const tw = new THREE.Group(); tw.position.set(x, 0, z); tw.lookAt(0, 0, 0); g.add(tw);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.1, 46, 12), steel); mast.position.y = 23; tw.add(mast);
      const head = new THREE.Mesh(new THREE.BoxGeometry(10, 6, .6), steel); head.position.set(0, 47, .6); head.rotation.x = -.35; tw.add(head);
      const lm = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }); this.panels.push(lm);
      const lamps = new THREE.InstancedMesh(new THREE.CircleGeometry(.32, 16), lm, 40); const o = new THREE.Object3D();
      for (let k = 0; k < 40; k++) { o.position.set(-4.2 + (k % 8) * 1.2, -2 + Math.floor(k / 8) * 1.0, .32); o.updateMatrix(); lamps.setMatrixAt(k, o.matrix); } lamps.position.copy(head.position); lamps.rotation.copy(head.rotation); tw.add(lamps); }
  }

  // ------------------------------------------------------------ the LED scoreboard (redrawn whenever its content changes)
  buildBoard() {
    const g = this.boardG = new THREE.Group(); g.position.set(0, 0, -66); this.stadiumG.add(g);
    const c = this.boardCanvas = document.createElement('canvas'); c.width = 1600; c.height = 720; this.boardCtx = c.getContext('2d');
    const t = this.boardTex = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    this.boardMat = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(30, 13.5), this.boardMat); scr.position.y = 30; g.add(scr);
    const fr = new THREE.Mesh(new RoundedBoxGeometry(31, 14.5, .8, 2, .2), new THREE.MeshStandardMaterial({ color: '#15181D', roughness: .5, metalness: .5 })); fr.position.set(0, 30, -.5); g.add(fr);
    for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 24, 1.2), new THREE.MeshStandardMaterial({ color: '#30353D', metalness: .6, roughness: .45 })); leg.position.set(sx * 11, 12, -.6); g.add(leg); }
    this.boardKey = '';
  }
  setPhotos(o) { this.photos = o; this.boardKey = ''; }
  drawBoard(S) {
    const m = Math.round(S.board), r = Math.round(S.runs), b = Math.round(S.balls), six = Math.round(S.six), p = S.price, ob = Math.round(S.overs), ovs = Math.floor(ob / 6) + '.' + (ob % 6);
    const key = [m, r, b, six, p.toFixed(2), ob].join('|'); if (key === this.boardKey) return; this.boardKey = key;
    const x = this.boardCtx, w = 1600, h = 720; x.fillStyle = '#04070C'; x.fillRect(0, 0, w, h);
    const T = (s, px, py, size, col, wt = 900, al = 'center') => { x.font = `${wt} ${size}px Inter`; x.fillStyle = col; x.textAlign = al; x.textBaseline = 'middle'; x.fillText(s, px, py); };
    // the real photo of the player (set with setPhotos), cover-cropped into a rect, with a dark fade on its right edge
    const P = this.photos && this.photos.player, face = (pw) => { if (!P) return 0; const r = Math.max(pw / P.width, h / P.height); x.drawImage(P, (pw - P.width * r) / 2, 0, P.width * r, P.height * r);
      const g = x.createLinearGradient(pw * .7, 0, pw, 0); g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(1, 'rgba(4,7,12,1)'); x.fillStyle = g; x.fillRect(pw * .7, 0, pw * .3 + 1, h); return pw; };
    if (m === 1) { const pw = face(560), cx = pw ? pw + (w - pw) / 2 : w / 2; T('IPL AUCTION', cx, 120, 92, '#FFC94A'); T('AGE 13', cx, 250, 84, '#FFFFFF', 800); T('₹ ' + p.toFixed(2) + ' CR', cx, 470, pw ? 190 : 230, '#7CF06B'); }
    else if (m === 2) { T('INDIA A  v  UAE', w / 2, 120, 92, '#FFFFFF'); T('TARGET', w / 2, 270, 90, '#FFC94A', 800); T('250', w / 2, 480, 270, '#FFFFFF'); }
    else if (m === 3) { const pw = face(460), cx = pw ? pw + (w - pw) / 2 : w / 2, sc = pw ? .82 : 1; T('SOORYAVANSHI', cx, 110, 88, '#FFC94A'); T(String(r), cx - 190 * sc, 380, 300 * sc, '#FFFFFF'); T(`(${b})`, cx + 330 * sc, 400, 150 * sc, '#9FB4CC', 800);
      T('6s', cx - 280 * sc, 620, 70, '#9FB4CC', 800); T(String(six), cx - 140 * sc, 620, 90, '#7CF06B'); T('BALLS ' + b, cx + 280 * sc, 620, 70, '#9FB4CC', 800); }
    else if (m === 5) { const pw = face(720), cx = pw ? pw + (w - pw) / 2 : w / 2; T('VAIBHAV', cx, 140, 96, '#FFFFFF'); T('AGE', cx, 290, 90, '#FFC94A', 800); T('15', cx, 500, 300, '#FFC94A'); }
    else if (m === 4) { T('INDIA A WON', w / 2, 120, 96, '#7CF06B'); T('254/3', w / 2, 330, 190, '#FFFFFF'); T('OVERS ' + ovs + ' / 50', w / 2, 520, 84, '#FFC94A', 800);
      x.fillStyle = '#1C2633'; x.fillRect(200, 610, 1200, 46); x.fillStyle = '#7CF06B'; x.fillRect(200, 610, 1200 * Math.min(1, ob / 300), 46); }
    else { T('INDIA A  v  UAE', w / 2, h / 2, 110, '#3A4A5E'); }
    // LED pixel grid
    x.fillStyle = 'rgba(0,0,0,.28)'; for (let i = 0; i < w; i += 5) x.fillRect(i, 0, 1, h); for (let j = 0; j < h; j += 5) x.fillRect(0, j, w, 1);
    this.boardTex.needsUpdate = true;
  }

  // ------------------------------------------------------------ the hero ball, built in layers for the exploded view
  buildBall() {
    const g = this.ballG = new THREE.Group(); g.position.set(BALL.x, BALL.y, BALL.z); this.scene.add(g); this.spinners = [];
    const holder = m => { const h = new THREE.Group(); g.add(h); h.add(m); this.spinners.push(m); return h; };
    const R = .036, ex = this.ex = new Exploded(); ex.spread = 1;
    const leather = ctex(1024, 512, (x, w, h) => { x.fillStyle = '#A3141C'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { const v = rnd(); x.fillStyle = `rgba(${v < .5 ? 60 : 230},${v < .5 ? 0 : 60},${v < .5 ? 5 : 60},${rnd() * .12})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
      x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 18; i++) x.fillRect(0, rnd() * h, w, 1); }, true);
    const bump = ctex(512, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let i = 0; i < 30000; i++) { x.fillStyle = rnd() < .5 ? '#6a6a6a' : '#9a9a9a'; x.fillRect(rnd() * w, rnd() * h, 1, 1); } }, false);
    const lm = this.leatherMat = new THREE.MeshPhysicalMaterial({ map: leather, roughness: .36, clearcoat: .8, clearcoatRoughness: .22, bumpMap: bump, bumpScale: .35, side: THREE.DoubleSide, emissive: '#FF3A1A', emissiveIntensity: 0 });
    const top = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48, 0, TAU, 0, Math.PI / 2 - .015), lm), bot = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48, 0, TAU, Math.PI / 2 + .015, Math.PI / 2 - .015), lm);
    // inner quarter seams on each half (two thin raised lines across the cap)
    const qs = new THREE.MeshStandardMaterial({ color: '#7C0E14', roughness: .5 });
    for (const [m, s] of [[top, 1], [bot, -1]]) { m.castShadow = true; const q = new THREE.Mesh(new THREE.TorusGeometry(R * 1.001, .0006, 4, 96, Math.PI * .8), qs); q.rotation.set(0, Math.PI / 2, 0); q.rotateZ(s > 0 ? Math.PI * .1 : Math.PI * 1.1); m.add(q); }
    // the stitched seam: six rows of white stitching around the equator
    const stitch = ctex(1024, 32, (x, w, h) => { x.fillStyle = '#C9B796'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFFDF4'; for (let i = 0; i < w; i += 8) x.fillRect(i, 2, 5, h - 4); }, true, 6, 1);
    const seam = new THREE.Group();
    for (let k = -2; k <= 2; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(R * 1.002, .0011, 6, 160), new THREE.MeshStandardMaterial({ map: stitch, roughness: .6 })); r.rotation.x = Math.PI / 2; r.position.y = k * .0024; seam.add(r); }
    const twine = ctex(1024, 512, (x, w, h) => { x.fillStyle = '#C8B48A'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.strokeStyle = `rgba(${rnd() < .5 ? 120 : 235},${rnd() < .5 ? 95 : 220},${rnd() < .5 ? 60 : 180},.55)`; x.lineWidth = 2; x.beginPath(); const y = rnd() * h, a = (rnd() - .5) * .9; x.moveTo(0, y); x.lineTo(w, y + Math.tan(a) * w); x.stroke(); } }, true);
    const wound = new THREE.Mesh(new THREE.SphereGeometry(R * .84, 64, 32), new THREE.MeshStandardMaterial({ map: twine, roughness: .85 })); wound.castShadow = true;
    const corkT = ctex(512, 256, (x, w, h) => { x.fillStyle = '#9A6A3A'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = rnd(); x.fillStyle = `rgba(${v < .5 ? 70 : 200},${v < .5 ? 40 : 150},${v < .5 ? 15 : 90},${.3 + rnd() * .4})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 0, TAU); x.fill(); } }, true);
    const core = new THREE.Mesh(new THREE.SphereGeometry(R * .5, 48, 24), new THREE.MeshStandardMaterial({ map: corkT, roughness: .9 })); core.castShadow = true;
    ex.add(holder(bot), { off: [0, -.075, 0], at: 0, len: .5, label: 'LEATHER CASE', anchor: [R * .9, -R * .4, 0], side: 1 });
    ex.add(holder(core), { off: [0, 0, 0], at: 0, len: .5, label: 'CORK CORE', anchor: [-R * .5, 0, 0], side: -1 });
    ex.add(holder(wound), { off: [0, .07, 0], at: .1, len: .5, label: 'WOUND TWINE', anchor: [R * .84, 0, 0], side: 1 });
    ex.add(holder(top), { off: [0, .145, 0], at: .2, len: .5, label: 'LEATHER CASE ', anchor: [-R * .9, R * .4, 0], side: -1 });
    ex.add(holder(seam), { off: [0, .2, 0], at: .3, len: .5, label: 'HAND-STITCHED SEAM', anchor: [R, 0, 0], side: 1 });
    this.ballLight = new THREE.PointLight('#FFE7C2', 0, 3, 2); this.ballLight.position.set(.4, .35, .5); g.add(this.ballLight);
  }

  // ------------------------------------------------------------ 28 glowing balls with short trails (the sixes, and the rain back into the plot)
  buildSixes() {
    const TR = 7, N = 28; this.sixN = N; this.trailN = TR;
    const m = this.sixMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.55, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }), N * TR);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * TR * 3), 3); m.frustumCulled = false; this.scene.add(m);
    this.sixPath = []; for (let i = 0; i < N; i++) { const a = Math.PI + (rnd() - .5) * 2.4 + (i % 2 ? .25 : -.25), d = 70 + rnd() * 30; this.sixPath.push({ end: new THREE.Vector3(Math.sin(a) * d, 10 + rnd() * 8, CREASE.z + Math.cos(a) * d), apex: 16 + rnd() * 9 }); }
    this.rainPath = []; for (let i = 0; i < N; i++) { const row = i % 7, col = Math.floor(i / 7); this.rainPath.push({ from: new THREE.Vector3((rnd() - .5) * 40, 70 + rnd() * 20, -30 + (rnd() - .5) * 40), to: new THREE.Vector3(-3.2 + row * 1.07, .25, -9 + col * 6 + (rnd() - .5)) }); }
    this.splash = new THREE.PointLight('#FFC98A', 0, 30, 1.6); this.splash.position.set(0, 3, 0); this.scene.add(this.splash);
  }

  // ------------------------------------------------------------ sun (day) and floodlights (night)
  buildLights() {
    const s = this.scene;
    const sun = this.sunL = new THREE.DirectionalLight('#FFC88A', 3.2); sun.position.set(-30, 14, -40); sun.target.position.set(0, 0, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; s.add(sun, sun.target);
    this.hemi = new THREE.HemisphereLight('#FFE4C0', '#4A3A26', 1.1); s.add(this.hemi);
    this.floods = [0, 1, 2, 3].map(i => { const a = Math.PI / 4 + i * Math.PI / 2; const l = new THREE.SpotLight('#EAF2FF', 0, 0, .42, .6, 2); l.position.set(Math.sin(a) * 66, 46, Math.cos(a) * 66); l.target.position.set(0, 0, 0); s.add(l, l.target); return l; });
    const key = this.pitchKey = new THREE.SpotLight('#F2F6FF', 0, 0, .32, .55, 2); key.position.set(14, 34, 22); key.target.position.set(0, 0, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0003; key.shadow.radius = 3; s.add(key, key.target);
    this.boardLight = new THREE.PointLight('#9CC4FF', 0, 60, 1.5); this.boardLight.position.set(0, 26, -58); s.add(this.boardLight);
  }

  anchor(name) {
    switch (name) {
      case 'ball': this.ballG.updateMatrixWorld(true); return this.ballG.getWorldPosition(new THREE.Vector3());
      case 'peg': return new THREE.Vector3(-3.2, 1.2, 10.6);
      case 'board': return new THREE.Vector3(0, 30, -66);
      case 'crease': return CREASE.clone();
      case 'plot': return new THREE.Vector3(0, .2, 0);
    }
    return new THREE.Vector3();
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { this.ballG.updateMatrixWorld(true); return this.ex.anchors().map(({ p, world }) => { const [x, y, z] = this.studio.project(world); return { label: p.label.trim(), side: p.side, u: p.u ?? 0, x, y, z }; }); }

  render(t) {
    const S = this.ST, st = this.studio, r = st.renderer; r.toneMappingExposure = S.exposure;
    const n = cl(S.night), d = 1 - n, farm = cl(S.farm), stad = sm(S.stadium);
    // sky + fog + lights
    this.dayMat.opacity = 1; this.nightMat.opacity = n; this.sun.material.opacity = d; this.sun.visible = d > .01;
    this.scene.fog.color.set('#E9B97A').lerp(new THREE.Color('#081220'), n); this.scene.fog.near = 40 + 110 * n; this.scene.fog.far = 260 + 160 * n;
    this.sunL.intensity = 3.2 * d; this.sunL.castShadow = d > .05; this.hemi.intensity = .9 * d + .25 * n; this.hemi.color.set('#FFE4C0').lerp(new THREE.Color('#9DB6E0'), n); this.hemi.groundColor.set('#4A3A26').lerp(new THREE.Color('#0C1610'), n);
    const fl = n * stad; this.floods.forEach(l => l.intensity = 5200 * fl); this.pitchKey.intensity = 2600 * fl; this.pitchKey.castShadow = fl > .05;
    this.panels.forEach(m => m.color.setScalar(.15 + 2.2 * fl)); this.roofGlow.material.color.set('#CFE3FF').multiplyScalar(.1 + 1.2 * fl);
    st.scene.environmentIntensity = .45 * d + .25 * n;
    // farm <-> pitch
    this.soilMat.opacity = farm; this.plotMesh.visible = farm > .005; this.pitchMat.opacity = 1 - farm; this.stumps.scale.y = Math.max(.001, sm((1 - farm - .3) / .7)); this.stumps.visible = farm < .7;
    const o = this._o; const cs = sm((farm - .15) / .85);
    this.cropBase.forEach(([x, z, sc, ry, tx, tz], i) => { o.position.set(x, 0, z); o.rotation.set(tx * cs, ry, tz * cs); o.scale.set(sc, Math.max(.001, sc * cs), sc); o.updateMatrix(); this.crops.setMatrixAt(i, o.matrix); }); this.crops.instanceMatrix.needsUpdate = true; this.crops.visible = cs > .01;
    this.posts.visible = farm > .02; this.plot.children.forEach(c => { if (c.isMesh && c.geometry.type === 'CylinderGeometry' && c !== this.posts) c.visible = farm > .3; });
    this.peg.visible = S.peg > .01 && farm > .3; this.peg.scale.setScalar(Math.max(.001, cl(S.peg))); this.bat.visible = S.batOn > .01 && farm > .3;
    // stadium rises, trees sink
    this.stadiumG.position.y = -80 * (1 - stad); this.stadiumG.visible = stad > .005; this.trees.position.y = -12 * stad; this.trees.visible = stad < .995;
    this.grassMat.opacity = stad; this.ropeMat.opacity = stad; this.fieldMat.color.set('#FFFFFF').lerp(new THREE.Color('#28402A'), n * .7);
    this.drawBoard(S); this.boardMat.color.setScalar(stad > .5 ? 1 : .2); this.boardLight.intensity = 900 * stad * (S.board > 0 ? 1 : .2);
    // hero ball: rises from the soil (lift), turns, comes apart
    this.ballG.visible = S.ballOn > .01; this.ballG.scale.setScalar(Math.max(.001, cl(S.ballOn)));
    this.ballG.position.set(BALL.x + S.bx, BALL.y + S.by, BALL.z + S.bz); this.spinners.forEach(m => m.rotation.set(.35, S.ballSpin, .25 + S.ballSpin * .3)); this.ex.set(S.explode);
    this.leatherMat.emissiveIntensity = .9 * S.ballGlow; this.ballLight.intensity = 2.2 * cl(S.ballOn) * (.5 + .5 * n);
    // the sixes: ball i flies while (sixes - i) runs 0 -> 2.6; trails sample the path a little earlier
    const M = this.sixMesh, N = this.sixN, TR = this.trailN, col = new THREE.Color(); let any = false; let sp = 0;
    for (let i = 0; i < N; i++) { const P = this.sixPath[i], R = this.rainPath[i];
      for (let k = 0; k < TR; k++) { const idx = i * TR + k; let u = (S.sixes - i) / 2.6 - k * .022, show = u > 0 && u < 1 && S.sixes > 0, p = new THREE.Vector3();
        if (show) { p.lerpVectors(CREASE, P.end, u); p.y = CREASE.y + (P.end.y - CREASE.y) * u + 4 * P.apex * u * (1 - u); }
        let rv = (S.rain * 1.7 - i / N * .7) - k * .03; const rshow = S.rain > 0 && rv > 0 && rv < 1;
        if (!show && rshow) { const e = rv * rv; p.lerpVectors(R.from, R.to, e); show = true; if (rv > .9 && k === 0) sp = Math.max(sp, 1 - Math.abs(rv - .95) / .05); }
        const s = show ? (k === 0 ? 1 : .8 - k * .1) * (rshow && !(u > 0 && u < 1 && S.sixes > 0) ? .4 : 1) : 0; o.position.copy(p); o.rotation.set(0, 0, 0); o.scale.setScalar(Math.max(.0001, s)); o.updateMatrix(); M.setMatrixAt(idx, o.matrix);
        col.set(k === 0 ? '#FFF2D6' : '#FF7A2E').multiplyScalar(k === 0 ? 2.2 : 1.4 * (1 - k / TR)); M.setColorAt(idx, col); if (show) any = true; } }
    M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true; M.visible = any; this.splash.intensity = 60 * sp;
    // camera
    const c = S.cam; st.camera.near = c.near || .05; st.camera.far = 1200; st.camera.updateProjectionMatrix(); st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.render();
  }
}
