// flood3d.js - the 1924 flood as a museum-grade 3D diorama (ES module, three r186 in vendor/three186).
//   import { FloodDiorama } from './lib/flood3d.js';
//   const F = new FloodDiorama(canvas);  F.ST.<...> (tween with GSAP);  F.render(t)
// A square block of Munnar hillside on a plinth, lit in the anatomy studio (lib/anatomy3d.js): tea slopes with
// shade trees, the hill railway on a bench cut into the slope, the road below, the river in the valley. The cut
// sides show the soil layers (the anatomy of a landslide). Rain falls on the model, the river rises, the Karinthiri
// slope slides and takes the road and the rails. Also a 3D Kerala map (official boundaries) and the Top Station sign.
import * as THREE from 'three';
import { Studio } from './anatomy3d.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const rand = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
function ctex(w, h, draw, rep = 1, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t; }
const HALF = 80;   // the model is 160 x 160 units

export class FloodDiorama {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#EFE6D6', '#5A5249'], floorY: -34, exposure: .9, aperture: .00003, fov: 32 });
    const s = this.scene = st.scene; this.camera = st.camera;
    st.key.position.set(-120, 220, -160); st.key.angle = .7; st.key.intensity = 5200; st.key.shadow.camera.far = 800;
    const noise = this.noise = new SimplexNoise({ random: (() => { let q = 11; return () => (q = (q * 16807) % 2147483647) / 2147483647; })() });
    this.model = new THREE.Group(); s.add(this.model);

    // ---------------- landscape functions (model units)
    const riverZ = this.riverZ = x => 9 * Math.sin(x / 40) - 30;
    const railZ = this.railZ = x => riverZ(x) + 40 + 4 * Math.sin(x / 24);
    const roadZ = this.roadZ = x => riverZ(x) + 20 + 2 * Math.sin(x / 30 + 1);
    const fbm = (x, z) => { let a = 0, f = 1, amp = 1; for (let o = 0; o < 5; o++) { a += amp * noise.noise(x * f, z * f); f *= 2.03; amp *= .5; } return a; };
    const hRaw = (x, z) => { const ridge = 1 - Math.abs(noise.noise(x / 70 + 3, z / 70)); let h = 7 * fbm(x / 90, z / 90) + 10 * ridge * ridge + 10;
      const d = z - riverZ(x); h += .42 * Math.max(0, d) - .1 * Math.max(0, -d); h -= 14 * Math.exp(-Math.pow(d / 13, 2)); return h; };
    const smoothAlong = (zf, off) => { const tab = []; for (let x = -HALF - 10; x <= HALF + 10; x += 2) tab.push(hRaw(x, zf(x))); const sm = tab.map((_, i) => { let a = 0, n = 0; for (let k = -8; k <= 8; k++) { const j = i + k; if (j >= 0 && j < tab.length) { a += tab[j]; n++; } } return a / n + off; }); return x => { const u = (x + HALF + 10) / 2, i = Math.max(0, Math.min(sm.length - 2, Math.floor(u))), f = u - i; return sm[i] * (1 - f) + sm[i + 1] * f; }; };
    const railY = this.railY = smoothAlong(railZ, .15), roadY = this.roadY = smoothAlong(roadZ, .1);
    const height = this.height = (x, z) => { let h = hRaw(x, z); const wr = Math.exp(-Math.pow((z - railZ(x)) / 2.6, 2)), wd = Math.exp(-Math.pow((z - roadZ(x)) / 2.2, 2)); h = h * (1 - wr) + (railY(x) - .15) * wr; h = h * (1 - wd) + (roadY(x) - .1) * wd; return h; };
    this.slideC = new THREE.Vector2(22, railZ(22) + 3);

    // ---------------- terrain block
    const SEG = 260; const tg = new THREE.PlaneGeometry(HALF * 2, HALF * 2, SEG, SEG); tg.rotateX(-Math.PI / 2);
    const P = tg.attributes.position, N = P.count, base = new Float32Array(N * 3), col = new Float32Array(N * 3);
    this.slideMask = new Float32Array(N);
    const cTea = new THREE.Color('#7FB04A'), cTea2 = new THREE.Color('#5E9838'), cForest = new THREE.Color('#2F5226'), cSoil = new THREE.Color('#9A6340'), cBed = new THREE.Color('#8A8272'), cRoad = new THREE.Color('#7A766E'), tmp = new THREE.Color();
    for (let i = 0; i < N; i++) { const x = P.getX(i), z = P.getZ(i), y = height(x, z); P.setY(i, y); base.set([x, y, z], i * 3);
      const steep = Math.abs(height(x + 1, z) - height(x - 1, z)) + Math.abs(height(x, z + 1) - height(x, z - 1));
      tmp.copy(cTea).lerp(cTea2, .5 + .5 * noise.noise(x / 12, z / 12)).lerp(cForest, Math.max(sstep(40, 52, y), sstep(3.2, 5, steep) * .6, sstep(.35, .7, noise.noise(x / 35 + 9, z / 35)) * .8));
      tmp.lerp(cBed, Math.exp(-Math.pow((z - riverZ(x)) / 6, 2)));
      tmp.lerp(cSoil, Math.exp(-Math.pow((z - railZ(x)) / 1.4, 2)) * .9); tmp.lerp(cRoad, Math.exp(-Math.pow((z - roadZ(x)) / 1.1, 2)));
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
      const ds = Math.hypot(x - this.slideC.x, (z - this.slideC.y) * .85); this.slideMask[i] = sstep(20, 4, ds) * (z > roadZ(x) - 6 ? 1 : 0); }
    tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals();
    this.tBase = base; this.tCol0 = col.slice(); this.terrainGeo = tg;
    const teaTex = ctex(512, 512, (x, w, h) => { x.fillStyle = '#a0a0a0'; x.fillRect(0, 0, w, h); for (let yy = 0; yy < h; yy += 6) { x.fillStyle = '#e0e0e0'; x.beginPath(); x.moveTo(0, yy); for (let xx = 0; xx <= w; xx += 6) x.lineTo(xx, yy + 2 * Math.sin(xx / 30 + yy * .3)); x.lineTo(w, yy + 4); x.lineTo(0, yy + 4); x.fill(); } }, 90, true);
    this.terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: teaTex, bumpMap: teaTex, bumpScale: .3, roughness: .9 });
    const terrain = new THREE.Mesh(tg, this.terrainMat); terrain.castShadow = terrain.receiveShadow = true; this.model.add(terrain);
    // cut sides: soil strata (topsoil, laterite, weathered rock, rock)
    const strata = ctex(64, 512, (x, w, h) => { const bands = [['#3A2A1C', .06], ['#6A3E24', .12], ['#A85A32', .28], ['#B87A4A', .18], ['#7E7266', .2], ['#5E5850', .16]]; let y0 = 0; bands.forEach(([c, f]) => { x.fillStyle = c; x.fillRect(0, y0, w, f * h + 1); y0 += f * h; });
      for (let k = 0; k < 1600; k++) { x.fillStyle = `rgba(0,0,0,${rand(k, 51) * .18})`; x.fillRect(rand(k, 52) * w, rand(k, 53) * h, 2 + rand(k, 54) * 3, 1 + rand(k, 55) * 2); } }, 1, true);
    strata.repeat.set(6, 1);
    const sideMat = new THREE.MeshStandardMaterial({ map: strata, roughness: .95, bumpMap: strata, bumpScale: .6, side: THREE.DoubleSide });
    const BOT = -18;
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([ax, az]) => { const n = SEG, pos = [], uv = [], idx = [];
      for (let k = 0; k <= n; k++) { const u = k / n, a = -HALF + u * 2 * HALF; const x = az ? a : ax * HALF, z = az ? az * HALF : a; const y = height(x, z); pos.push(x, y, z, x, BOT, z); uv.push(u, 1 - (y - BOT) / 72, u, 1); }
      for (let k = 0; k < n; k++) { const i = k * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, sideMat); m.castShadow = m.receiveShadow = true; this.model.add(m); });
    // plinth + brass plaque
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2 + 8, 12, HALF * 2 + 8), new THREE.MeshStandardMaterial({ color: '#1E1B19', roughness: .4, metalness: .2 })); plinth.position.y = BOT - 6; plinth.receiveShadow = plinth.castShadow = true; this.model.add(plinth);
    const plaqueTex = ctex(1024, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#E8C27A'); g.addColorStop(1, '#B88A3E'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#3A2810'; x.font = 'bold 96px FreeSans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MUNNAR · 1924', w / 2, h / 2 + 4); });
    const brassM = new THREE.MeshStandardMaterial({ color: '#B88A3E', metalness: .9, roughness: .3 });
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(56, 7, .6), [brassM, brassM, brassM, brassM, new THREE.MeshStandardMaterial({ map: plaqueTex, metalness: .9, roughness: .3 }), brassM]); plaque.position.set(0, BOT - 6, -HALF - 4.4); plaque.rotation.y = Math.PI; this.model.add(plaque);

    let best = [0, -1e9, 0]; for (let x = 20; x <= HALF - 8; x += 2) for (let z = railZ(x) + 12; z <= HALF - 8; z += 2) { const y = height(x, z); if (y > best[1]) best = [x, y, z]; }
    this.best = best;
    // ---------------- shade trees (smooth canopies)
    const trunkG = new THREE.CylinderGeometry(.1, .16, 3.4, 6); trunkG.translate(0, 1.7, 0);
    let crownG = new THREE.IcosahedronGeometry(1.25, 3); crownG.deleteAttribute('normal'); crownG.deleteAttribute('uv'); crownG = mergeVertices(crownG);
    { const cp = crownG.attributes.position; for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + .2 * noise.noise3d(x * 1.6, y * 1.6, z * 1.6) + .08 * noise.noise3d(x * 5, y * 5, z * 5); cp.setXYZ(i, x * k, y * k * 1.3, z * k); } crownG.computeVertexNormals(); }
    crownG.translate(0, 3.9, 0);
    const NT = 900, trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: '#4A3A2A', roughness: 1 }), NT), crowns = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .85 }), NT);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(); let n = 0; this.treeData = [];
    for (let k = 0; k < 8000 && n < NT; k++) { const x = (rand(k, 3) - .5) * (HALF * 2 - 4), z = (rand(k, 4) - .5) * (HALF * 2 - 4); const y = height(x, z);
      if (Math.abs(z - railZ(x)) < 3.4 || Math.abs(z - roadZ(x)) < 2.8 || Math.abs(z - riverZ(x)) < 9 || Math.hypot(x - best[0], z - best[2]) < 17) continue;
      const dense = sstep(30, 50, y) * .9 + .12; if (rand(k, 5) > dense) continue;
      const s2 = .6 + rand(k, 6) * .7; sc.set(s2, s2 * (.85 + rand(k, 7) * .4), s2); pos.set(x, y - .2, z); m4.compose(pos, q, sc); trunks.setMatrixAt(n, m4); crowns.setMatrixAt(n, m4);
      crowns.setColorAt(n, new THREE.Color().setHSL(.25 + rand(k, 8) * .07, .42, .24 + rand(k, 9) * .1)); this.treeData.push([x, y - .2, z, s2, sc.y]); n++; }
    trunks.count = crowns.count = n; trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true; this.model.add(trunks, crowns); this.trees = { trunks, crowns, n };

    // ---------------- railway
    const railPts = []; for (let x = -HALF + 1; x <= HALF - 1; x += 1.5) railPts.push(new THREE.Vector3(x, railY(x), railZ(x)));
    this.railCurve = new THREE.CatmullRomCurve3(railPts);
    const steel = new THREE.MeshStandardMaterial({ color: '#8A8580', metalness: .95, roughness: .35 }), wood = new THREE.MeshStandardMaterial({ color: '#4E3624', roughness: .9 });
    this.railSegs = []; const segLen = 2.4, nSeg = Math.floor(this.railCurve.getLength() / segLen);
    const railBox = new THREE.BoxGeometry(segLen + .02, .08, .06), sleeperG = new THREE.BoxGeometry(.14, .07, .8);
    for (let k = 0; k < nSeg; k++) { const u = (k + .5) / nSeg, p = this.railCurve.getPointAt(u), tng = this.railCurve.getTangentAt(u); const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().add(tng)); g.rotateY(-Math.PI / 2);
      [-.22, .22].forEach(zz => { const rl = new THREE.Mesh(railBox, steel); rl.position.set(0, .14, zz); g.add(rl); });
      for (let j = 0; j < 4; j++) { const sl = new THREE.Mesh(sleeperG, wood); sl.position.set(-segLen / 2 + .3 + j * .6, .05, 0); g.add(sl); }
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); this.model.add(g); this.railSegs.push({ g, u, p: p.clone(), base: g.position.clone(), rot: g.rotation.clone() }); }

    // ---------------- train (scale model)
    const train = this.train = new THREE.Group(); this.model.add(train);
    const blk = new THREE.MeshStandardMaterial({ color: '#1C2420', metalness: .6, roughness: .4 }), red = new THREE.MeshStandardMaterial({ color: '#7A2A1E', metalness: .3, roughness: .55 }), brass = new THREE.MeshStandardMaterial({ color: '#D2A04A', metalness: 1, roughness: .3 });
    const chest = new THREE.MeshStandardMaterial({ color: '#8B5E34', roughness: .8 }), chestTop = new THREE.MeshStandardMaterial({ color: '#A8763F', roughness: .8 });
    const S0 = .42; this.wheels = [];
    const wheel = (p, x, z, r0 = .55) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0, .18, 20), red); w.rotation.x = Math.PI / 2; w.position.set(x, r0, z); p.add(w); this.wheels.push(w); return w; };
    const loco = new THREE.Group(); loco.scale.setScalar(S0); train.add(loco);
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 3.6, 24), blk); boiler.rotation.z = Math.PI / 2; boiler.position.set(.6, 1.7, 0); loco.add(boiler);
    [-.9, .2, 1.3].forEach(x => { const b = new THREE.Mesh(new THREE.TorusGeometry(.86, .05, 6, 24), brass); b.rotation.y = Math.PI / 2; b.position.set(x, 1.7, 0); loco.add(b); });
    const chim = this.chimney = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 1.1, 12), blk); chim.position.set(2.0, 2.9, 0); loco.add(chim);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 10), brass); dome.position.set(.6, 2.6, 0); loco.add(dome);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.9), red); cab.position.set(-1.8, 1.9, 0); loco.add(cab);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, .12, 2.2), blk); roof.position.set(-1.8, 2.95, 0); loco.add(roof);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5, .3, 1.5), blk); frame.position.set(0, .75, 0); loco.add(frame);
    [-1.4, -.2, 1.0, 2.0].forEach(x => [-.62, .62].forEach(z => wheel(loco, x, z)));
    this.cars = [{ g: loco, off: 0 }];
    for (let k = 0; k < 3; k++) { const wg = new THREE.Group(); wg.scale.setScalar(S0); train.add(wg); const bed = new THREE.Mesh(new THREE.BoxGeometry(3.6, .25, 1.6), new THREE.MeshStandardMaterial({ color: '#3A2A1E', roughness: .8 })); bed.position.y = .85; wg.add(bed);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) { const ch = new THREE.Mesh(new THREE.BoxGeometry(1.0, .7, .7), (a + b + c) % 2 ? chest : chestTop); ch.position.set(-1.15 + a * 1.15, 1.35 + c * .72, -.36 + b * .72); ch.rotation.y = (rand(k * 13 + a * 5 + b * 3 + c) - .5) * .12; wg.add(ch); }
      [-1.2, 1.2].forEach(x => [-.62, .62].forEach(z => wheel(wg, x, z, .42))); this.cars.push({ g: wg, off: (5.6 + k * 4.2) * S0 }); }
    train.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const puffTex = ctex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.5, 'rgba(245,245,245,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    this.puffs = []; for (let k = 0; k < 22; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false })); this.model.add(sp); this.puffs.push(sp); }
    // monorail trolley on a single rail (the line's first form, simplified)
    const mono = this.mono = new THREE.Group(); this.model.add(mono);
    const mrail = new THREE.Mesh(new THREE.BoxGeometry(24, .09, .07), steel); mrail.position.y = .14; mono.add(mrail);
    for (let j = 0; j < 24; j++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(.14, .06, .5), wood); sl.position.set(-11.5 + j, .05, 0); mono.add(sl); }
    const trol = this.trolley = new THREE.Group(); trol.scale.setScalar(S0); mono.add(trol);
    const tb = new THREE.Mesh(new THREE.BoxGeometry(2.4, .2, 1.4), new THREE.MeshStandardMaterial({ color: '#4E3624', roughness: .8 })); tb.position.y = 1.05; trol.add(tb);
    [-.8, .8].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .16, 18), red); w.rotation.x = Math.PI / 2; w.position.set(x, .75, 0); trol.add(w); this.wheels.push(w); });
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const ch = new THREE.Mesh(new THREE.BoxGeometry(.9, .65, .6), (a + b) % 2 ? chest : chestTop); ch.position.set(-.5 + a * 1.0, 1.5, -.32 + b * .64); trol.add(ch); }
    mono.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // ---------------- water (river rising into a flood)
    const nTex = this.waterTex = ctex(256, 256, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const v = 128 + 70 * noise.noise(xx / 16, yy / 16) + 30 * noise.noise(xx / 5, yy / 5); img.data.set([v, v, v, 255], i * 4); } x.putImageData(img, 0, 0); }, 6, false);
    const water = this.water = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2 - .1, 1, HALF * 2 - .1), new THREE.MeshStandardMaterial({ color: '#4A3626', roughness: .55, metalness: 0, bumpMap: nTex, bumpScale: .5, envMapIntensity: .08 }));
    water.receiveShadow = true; this.model.add(water);

    // ---------------- rain over the model, landslide rocks, low cloud
    const NR = 3500; this.rain = new THREE.InstancedMesh(new THREE.BoxGeometry(.04, 2.0, .04), new THREE.MeshBasicMaterial({ color: '#E8F0F6', transparent: true, opacity: .4, depthWrite: false }), NR); this.rain.frustumCulled = false; this.model.add(this.rain); this.NR = NR;
    this.NK = 160; this.rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.5, 1), new THREE.MeshStandardMaterial({ color: '#4A3A2E', roughness: .95 }), this.NK); this.rocks.castShadow = true; this.model.add(this.rocks);
    const mistTex = ctex(512, 512, (x, w, h) => { for (let k = 0; k < 60; k++) { const cx = rand(k, 11) * w, cy = rand(k, 12) * h, rr = 30 + rand(k, 13) * 80; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }, 1);
    this.mist = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, opacity: .45, depthWrite: false })); this.mist.rotation.x = -Math.PI / 2; this.mist.position.y = 46; this.model.add(this.mist);

    // ---------------- Top Station sign on the highest point
    const tg2 = this.topG = new THREE.Group(); tg2.position.set(best[0], best[1], best[2]); this.model.add(tg2); this.topPos = tg2.position.clone();
    const post = new THREE.MeshStandardMaterial({ color: '#4A3626', roughness: .85 });
    [-1.1, 1.1].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.14, 2.1, .14), post); p.position.set(x, 1.05, 0); tg2.add(p); });
    const signTex = ctex(1024, 340, (x, w, h) => { x.fillStyle = '#F2EBD8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2A2420'; x.lineWidth = 18; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = '#2A2420'; x.font = 'bold 128px FreeSans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TOP STATION', w / 2, h / 2 + 6); for (let k = 0; k < 2500; k++) { x.fillStyle = `rgba(90,70,50,${rand(k, 21) * .12})`; x.fillRect(rand(k, 22) * w, rand(k, 23) * h, 3, 3); } }, 1);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.8, .95, .08), [post, post, post, post, new THREE.MeshStandardMaterial({ map: signTex, roughness: .8 }), post]); board.position.set(0, 1.65, .1); tg2.add(board);
    tg2.rotation.y = Math.PI; tg2.traverse(o => { if (o.isMesh) o.castShadow = true; });

    // ---------------- Kerala 3D map (its own plinth, replaces the hillside when shown)
    this.mapG = new THREE.Group(); s.add(this.mapG); this.buildMap();
    this.ST = { cam: { px: -150, py: 120, pz: -170, tx: 0, ty: 12, tz: 0, fov: 32 }, shake: 0, aperture: .00003, storm: 0, rain: 0, water: -2, slide: 0,
      trainU: .2, trainOn: 1, monoOn: 0, railFade: 0, show: 0, mapFlood: 0, mist: .22, exposure: .9 };
    this._slide = -1;
  }

  buildMap() {
    const M = window.MAP; if (!M) return; const g = this.mapG, loader = new SVGLoader();
    const kb = M.kerala.box, cx = (kb[0] + kb[2]) / 2, cy = (kb[1] + kb[3]) / 2, k = 1.05;
    const toShapes = d => loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths.flatMap(p => SVGLoader.createShapes(p));
    const clip = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 75), new THREE.Plane(new THREE.Vector3(1, 0, 0), 75), new THREE.Plane(new THREE.Vector3(0, 0, -1), 95), new THREE.Plane(new THREE.Vector3(0, 0, 1), 95)];
    const mk = (d, mat, depth) => { const geo = new THREE.ExtrudeGeometry(toShapes(d), { depth, bevelEnabled: true, bevelThickness: .4, bevelSize: .3, bevelSegments: 2, curveSegments: 4 }); geo.translate(-cx, -cy, 0); geo.scale(k, k, 1); geo.rotateX(Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; return m; };
    const base = new THREE.Mesh(new THREE.BoxGeometry(150, 6, 190), new THREE.MeshStandardMaterial({ color: '#2C5A6E', roughness: .3, metalness: .1 })); base.position.y = -3; base.receiveShadow = true; g.add(base);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(158, 12, 198), new THREE.MeshStandardMaterial({ color: '#1E1B19', roughness: .4, metalness: .2 })); plinth.position.y = -12; g.add(plinth);
    ['Karnataka', 'Tamil Nadu'].forEach(n => { const st = M.states.find(s2 => s2.name === n); if (st) { const m = mk(st.d, new THREE.MeshStandardMaterial({ color: '#C9BBA2', roughness: .85, clippingPlanes: clip }), 3); m.position.y = 3; g.add(m); } });
    this.affected = ['Thrissur', 'Ernakulam', 'Idukki', 'Kottayam', 'Alappuzha']; this.mapDist = {};
    M.districts.forEach((dd, i) => { const m = mk(dd.d, new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.29 - i * .005, .42, .38 + (i % 3) * .04), roughness: .75 }), 6); m.position.y = 6; g.add(m); this.mapDist[dd.name] = m; });
    const wm = this.mapWaterMat = new THREE.MeshStandardMaterial({ color: '#7A6448', roughness: .12, metalness: .05, transparent: true, opacity: 0, bumpMap: this.waterTex, bumpScale: .3 });
    this.mapWater = M.districts.filter(dd => this.affected.includes(dd.name)).map(dd => { const m = mk(dd.d, wm, .5); m.position.y = 6.2; m.castShadow = false; g.add(m); return m; });
    this.studio.renderer.localClippingEnabled = true;
    this.mapCenter = new THREE.Vector3(0, 6, 0); g.rotation.y = -.42;
  }

  render(t) {
    const S = this.ST, st = this.studio, storm = S.storm;
    st.renderer.toneMappingExposure = S.exposure;
    this.scene.backgroundIntensity = 1 - .55 * storm; st.key.intensity = 5200 * (1 - .65 * storm); st.floor.material.color.set('#BDB2A3').multiplyScalar(1 - .5 * storm);
    this.terrainMat.roughness = .9 - .5 * S.rain;
    this.model.visible = S.show === 0; this.mapG.visible = S.show === 1;
    // landslide
    if (Math.abs(S.slide - this._slide) > 1e-4) { const P = this.terrainGeo.attributes.position, C = this.terrainGeo.attributes.color, b = this.tBase, c0 = this.tCol0, s2 = S.slide;
      for (let i = 0; i < P.count; i++) { const m = this.slideMask[i]; if (m <= 0) continue; const e = m * s2, mud = Math.min(1, e * 1.8);
        P.setXYZ(i, b[i * 3], b[i * 3 + 1] - 9 * e, b[i * 3 + 2] - 14 * e); C.setXYZ(i, c0[i * 3] + (.48 - c0[i * 3]) * mud, c0[i * 3 + 1] + (.32 - c0[i * 3 + 1]) * mud, c0[i * 3 + 2] + (.2 - c0[i * 3 + 2]) * mud); }
      P.needsUpdate = C.needsUpdate = true; this.terrainGeo.computeVertexNormals(); this._slide = S.slide;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sv = new THREE.Vector3();
      this.treeData.forEach(([x, y, z, s3, sy], i) => { const ds = Math.hypot(x - this.slideC.x, (z - this.slideC.y) * .85), e = sstep(20, 4, ds) * (z > this.roadZ(x) - 6 ? 1 : 0) * s2; q.setFromEuler(new THREE.Euler(-e * 1.4, 0, e * .5)); v.set(x, y - 9 * e, z - 14 * e); sv.set(s3, sy, s3); m4.compose(v, q, sv); this.trees.trunks.setMatrixAt(i, m4); this.trees.crowns.setMatrixAt(i, m4); });
      this.trees.trunks.instanceMatrix.needsUpdate = this.trees.crowns.instanceMatrix.needsUpdate = true; }
    // rails: fade out piece by piece, or go with the slide (two ends left hanging over the gap)
    this.railSegs.forEach(r => { const ds = Math.hypot(r.p.x - this.slideC.x, (r.p.z - this.slideC.y) * .85), m = sstep(17, 6, ds), e = m * S.slide;
      r.g.position.set(r.base.x, r.base.y - 9 * e, r.base.z - 14 * e); r.g.rotation.set(r.rot.x + e * 1.2 * (rand(r.u * 99) - .5), r.rot.y, r.rot.z - e * .5 * Math.sign(r.p.x - this.slideC.x));
      r.g.visible = !(S.railFade > rand(r.u * 57, 3)) && !(e > .5 && m > .75); });
    // train
    const on = S.trainOn > .5; this.train.visible = on;
    if (on) { const L = this.railCurve.getLength(); this.cars.forEach(c => { const u = Math.max(0, Math.min(1, S.trainU - c.off / L)), p = this.railCurve.getPointAt(u), tg = this.railCurve.getTangentAt(u); c.g.position.copy(p).add(new THREE.Vector3(0, .1, 0)); c.g.lookAt(p.clone().add(tg).add(new THREE.Vector3(0, .1, 0))); c.g.rotateY(-Math.PI / 2); }); }
    this.wheels.forEach(w => w.rotation.y = -S.trainU * 3000 - t * 4);
    const chimW = new THREE.Vector3(); this.chimney.getWorldPosition(chimW); const back = this.railCurve.getTangentAt(Math.min(1, Math.max(0, S.trainU))).multiplyScalar(-1);
    this.puffs.forEach((sp, k) => { const age = ((t * .8 + k / this.puffs.length) % 1); sp.visible = on && storm < .5; sp.position.copy(chimW).addScaledVector(back, age * 4).add(new THREE.Vector3(Math.sin(k) * age, age * 4.5, Math.cos(k * 1.7) * age)); const s2 = .5 + age * 3.2; sp.scale.set(s2, s2, 1); sp.material.opacity = .8 * (1 - age); });
    // monorail
    this.mono.visible = S.monoOn > .5; if (this.mono.visible) { const x0 = -48; this.mono.position.set(x0, this.railY(x0), this.railZ(x0)); this.mono.rotation.y = -Math.atan2(this.railZ(x0 + 1) - this.railZ(x0 - 1), 2); this.trolley.position.x = -9 + ((t * .9) % 18); }
    // water level
    const wl = S.water; this.water.position.y = wl - .5; this.water.visible = wl > -1.9; this.waterTex.offset.set(t * .02, t * .04);
    // rain
    const R = S.rain, m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(.1, 0, .06)), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    this.rain.visible = R > .01; this.rain.count = Math.floor(this.NR * Math.min(1, R));
    if (this.rain.visible) { for (let i = 0; i < this.rain.count; i++) { const x = (rand(i, 31) - .5) * HALF * 2, z = (rand(i, 32) - .5) * HALF * 2, top = 70, y = top - (t * 40 + rand(i, 33) * top) % top; v.set(x, y, z); m4.compose(v, q, one); this.rain.setMatrixAt(i, m4); } this.rain.instanceMatrix.needsUpdate = true; }
    this.mist.material.opacity = S.mist * (1 - .5 * storm); this.mist.material.map.offset.set(t * .006, t * .003);
    // rocks
    const rk = this.rocks; rk.visible = S.slide > .02 && S.slide < .995;
    if (rk.visible) { for (let i = 0; i < this.NK; i++) { const a = rand(i, 41) * Math.PI * 2, rr = rand(i, 42) * 14, x = this.slideC.x + Math.cos(a) * rr, z0 = this.slideC.y + Math.sin(a) * rr * .7; const e = Math.min(1, S.slide * (1.1 + rand(i, 43))); const z = z0 - 20 * e, y = this.height(x, z0) - 11 * e + Math.abs(Math.sin(e * 10 + i)); q.setFromEuler(new THREE.Euler(e * 9 + i, e * 7, 0)); const s3 = .4 + rand(i, 44) * 1.1; m4.compose(v.set(x, y, z), q, new THREE.Vector3(s3, s3, s3)); rk.setMatrixAt(i, m4); } rk.instanceMatrix.needsUpdate = true; }
    // map
    if (this.mapWaterMat) { this.mapWaterMat.opacity = .92 * S.mapFlood; this.mapWater.forEach(m => m.position.y = 6 + 1.2 * S.mapFlood); }
    // camera with shake
    const sh = S.shake; st.look(S.cam.px + sh * Math.sin(t * 61), S.cam.py + sh * .8 * Math.sin(t * 47 + 1), S.cam.pz + sh * Math.cos(t * 53), S.cam.tx, S.cam.ty, S.cam.tz, S.cam.fov);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.glint.intensity = 0;
    st.render();
  }
}
