// football3d.js - one football federation desk, Calcutta 1950, for the "qualified but never went" reel (ES module, three r186).
//
//   import { FootballWorld } from './lib/football3d.js';
//   const W = new FootballWorld(canvas);  W.ST.stamp = .5;  W.render(t);  W.screen('entry') -> [x, y]
//
// Units are metres at real scale; the desk top is y = 0, the camera mostly looks from +z. One set, every beat an object:
// the 1950 entry card (stamped WITHDRAWN), a desk globe (Natural Earth coastlines: India, Brazil, the Asian rivals),
// four name blocks (three topple), an 18-panel laced leather ball of the period, cotton bandage rolls, a sea-passage
// ticket (DECLINED), a pair of 1950 leather boots with leather studs, and the 1954 entry form (NOT ACCEPTED).
// No real person's likeness, no FIFA or Olympic marks.
import * as THREE from 'three';
import { Studio } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { WORLD } from './maps/world50.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const rnd = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const noise = new SimplexNoise({ random: rnd });
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}
const LAT = '"Inter", "FreeSans", sans-serif', SERIF = '"DejaVu Serif", "Liberation Serif", serif', MONO = '"DejaVu Sans Mono", "Liberation Mono", monospace';
function lathe(pts, seg = 96) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
const scratchTex = (rep = 2) => ctex(512, 512, (x, w, h) => { x.fillStyle = '#5c5c5c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const a = rnd() * TAU, l = 8 + rnd() * 60, X = rnd() * w, Y = rnd() * h; x.strokeStyle = `rgba(${rnd() < .5 ? 150 : 30},${rnd() < .5 ? 150 : 30},${rnd() < .5 ? 150 : 30},.25)`; x.lineWidth = .6 + rnd(); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); } }, false, rep, rep);
const llv = (lat, lon, r) => { const ph = (lon + 180) * D2R, th = (90 - lat) * D2R; return new THREE.Vector3(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)); };
const paperNoise = (x, w, h, n = 20000) => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(90,60,20,${rnd() * .05})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } };
// a rubber-stamp impression: double frame, bold word, worn by random holes
const inkTex = (word, col = '#B30F19', fs = 170) => ctex(1024, 400, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 22; x.strokeRect(24, 24, w - 48, h - 48); x.lineWidth = 6; x.strokeRect(50, 50, w - 100, h - 100); x.font = `bold ${fs}px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; let f = fs; while (x.measureText(word).width > w - 150) { f -= 6; x.font = `bold ${f}px ${LAT}`; } x.fillText(word, w / 2, h / 2 + 8); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(0,0,0,${.3 + rnd() * .7})`; const r = 1 + rnd() * 4; x.beginPath(); x.arc(rnd() * w, rnd() * h, r, 0, TAU); x.fill(); } }, true);

export class FootballWorld {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#FFF4E2', '#7C6A4E'], floorY: 0, fov: 30, exposure: 1.0, aperture: .00003, bloom: .035, floor: '#E7D9C4', env: 1.0 });
    const s = this.scene = st.scene;
    st.key.position.set(1.5, 3.2, 2.2); st.key.angle = .9; st.key.distance = 0; st.key.intensity = 13; st.key.decay = 1.6; st.key.penumbra = .8;
    st.key.shadow.camera.near = .5; st.key.shadow.camera.far = 12; st.key.shadow.bias = -.0002; st.key.shadow.normalBias = .004; st.key.shadow.radius = 4;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .06, distanceExponent: 1.4, thickness: .05, scale: 1, samples: 12 });
    st.glint.distance = 3; st.glint.decay = 1.2;
    // the desk: oiled teak planks
    st.floor.geometry = new THREE.CircleGeometry(7, 96); st.floor.material.roughness = .45; st.floor.material.metalness = 0; st.floor.material.color.set('#FFFFFF');
    st.floor.material.map = ctex(1024, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const plank = Math.floor(yy / 128); const g = noise.noise(xx / 380 + plank * 7, yy / 9) * .5 + noise.noise(xx / 60 + plank, yy / 3) * .25; const seam = (yy % 128) < 2 ? -38 : 0; const v = 128 + 34 * g + seam + plank % 2 * 6; img.data.set([v * 1.0, v * .7, v * .45, 255], i * 4); } x.putImageData(img, 0, 0); }, true, 3, 3);
    const scr = scratchTex(3);
    this.M = {
      brass: new THREE.MeshPhysicalMaterial({ color: '#C79A4E', metalness: 1, roughness: .26, roughnessMap: scr, envMapIntensity: 1.3 }),
      chrome: new THREE.MeshPhysicalMaterial({ color: '#DDE2E6', metalness: 1, roughness: .1, roughnessMap: scr, envMapIntensity: 1.6 }),
      walnut: new THREE.MeshPhysicalMaterial({ color: '#4A2C18', roughness: .5, clearcoat: .5, clearcoatRoughness: .3, map: ctex(512, 1024, (x, w, h) => { for (let yy = 0; yy < h; yy++) { const v = 128 + 40 * noise.noise(yy / 40, 0) + 18 * noise.noise(yy / 6, 3); x.fillStyle = `rgb(${v},${v * .78 | 0},${v * .6 | 0})`; x.fillRect(0, yy, w, 1); } }, true) }),
      paper: new THREE.MeshStandardMaterial({ color: '#E6D8BC', roughness: .85 }),
      greenGlass: new THREE.MeshPhysicalMaterial({ color: '#1F6B3A', roughness: .15, clearcoat: 1, emissive: '#2E7A3E', emissiveIntensity: .25 }),
    };
    this.buildRoom(); this.buildCards(); this.buildStamp(); this.buildGlobe(); this.buildBlocks(); this.buildBall(); this.buildBandages(); this.buildBoots(); this.buildLamp();
    this.ST = { cam: { px: 0, py: .35, pz: 1.6, tx: 0, ty: .2, tz: 0, fov: 30, roll: 0 }, aperture: .00003, exposure: 1.0, sweep: 0,
      stamp: 0, stampAt: 0, inkE: 0, inkT: 0, inkF: 0, ticket: 0, lon: 0, brazil: 0, rivals: 0, arc: 0, arcFade: 0, topple: 0, indiaGlow: 0, unroll: 0, boots: 0, bootsOut: 0, ballSpin: 0 };
  }

  // ------------------------------------------------------------ two-tone panelled wall: cream above, bottle-green wainscot
  buildRoom() {
    const wallMap = ctex(1024, 768, (x, w, h) => { x.fillStyle = '#E4D5B8'; x.fillRect(0, 0, w, h); const wy = h * .62; x.fillStyle = '#2F4A3A'; x.fillRect(0, wy, w, h - wy); const pw = w / 4; for (let i = 0; i < 4; i++) { const X = i * pw + 26; x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 6; x.strokeRect(X, wy + 40, pw - 52, h - wy - 80); x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 3; x.strokeRect(X + 5, wy + 45, pw - 62, h - wy - 90); } x.fillStyle = '#6E4A2A'; x.fillRect(0, wy - 14, w, 16); x.fillStyle = 'rgba(120,90,50,.25)'; x.fillRect(0, 70, w, 5); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * .025})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, true);
    const wall = new THREE.Mesh(new RoundedBoxGeometry(4.2, 3.2, .05, 2, .01), new THREE.MeshStandardMaterial({ map: wallMap, roughness: .78 })); wall.position.set(0, 1.6, -1.25); wall.receiveShadow = true; this.scene.add(wall);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, .05, .03), this.M.walnut); rail.position.set(0, .03, -1.21); this.scene.add(rail);
  }

  // ------------------------------------------------------------ printed cards: the 1950 entry, the sea passage, the 1954 form
  card(pos, rotY, W, H, draw, word) {
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = rotY; this.scene.add(g);
    const map = ctex(1360, Math.round(1360 * H / W), draw, true);
    const card = new THREE.Mesh(new RoundedBoxGeometry(W, .0015, H, 2, .0006), this.M.paper); card.castShadow = card.receiveShadow = true; g.add(card);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(W - .001, H - .001), new THREE.MeshStandardMaterial({ map, roughness: .8 })); top.rotation.x = -Math.PI / 2; top.position.y = .0008; top.receiveShadow = true; g.add(top);
    const ink = new THREE.Mesh(new THREE.PlaneGeometry(W * .66, W * .66 * .39), new THREE.MeshStandardMaterial({ map: inkTex(word), transparent: true, roughness: .6, depthWrite: false, opacity: 0 }));
    ink.rotation.set(-Math.PI / 2, 0, .16); ink.position.set(-W * .06, .0012, .02); g.add(ink);
    return { g, ink, W, H };
  }
  buildCards() {
    const W = .17, H = .1;
    this.entry = this.card(new THREE.Vector3(0, .006, .3), .06, W, H, (x, w, h) => {
      x.fillStyle = '#EBDDC0'; x.fillRect(0, 0, w, h); paperNoise(x, w, h);
      const stub = w * .78; x.fillStyle = '#1F5D3A'; x.fillRect(0, 0, stub, 120); x.fillStyle = '#F6EEDB'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `bold 60px ${SERIF}`; x.fillText('WORLD CUP · BRAZIL 1950', stub / 2, 64);
      x.fillStyle = '#2A1A10'; x.font = `44px ${SERIF}`; x.fillText('24 JUNE – 16 JULY 1950', stub / 2, 196);
      x.strokeStyle = '#1F5D3A'; x.lineWidth = 4; x.strokeRect(70, 250, stub - 140, 300); x.fillStyle = '#1F5D3A'; x.font = `bold 46px ${SERIF}`; x.fillText('QUALIFIED NATION', stub / 2, 310);
      x.fillStyle = '#2A1A10'; x.font = `bold 150px ${SERIF}`; x.fillText('INDIA', stub / 2, 445);
      x.font = `36px ${SERIF}`; x.fillText('All India Football Federation · Calcutta', stub / 2, 640);
      x.setLineDash([14, 12]); x.strokeStyle = '#2A1A10'; x.lineWidth = 3; x.beginPath(); x.moveTo(stub, 0); x.lineTo(stub, h); x.stroke(); x.setLineDash([]);
      x.save(); x.translate(stub + (w - stub) / 2, h / 2); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.font = `bold 56px ${SERIF}`; x.fillText('ENTRY', 0, -40); x.font = `bold 44px ${LAT}`; x.fillText('1950', 0, 40); x.restore();
    }, 'WITHDRAWN');
    this.ticket = this.card(new THREE.Vector3(-.3, .006, .32), -.1, W, H, (x, w, h) => {
      x.fillStyle = '#E9DFC8'; x.fillRect(0, 0, w, h); paperNoise(x, w, h);
      x.fillStyle = '#1E2F55'; x.fillRect(0, 0, w, 120); x.fillStyle = '#F6EEDB'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 66px ${SERIF}`; x.fillText('SEA PASSAGE · 1950', w / 2, 64);
      x.fillStyle = '#2A1A10'; x.font = `bold 80px ${SERIF}`; x.fillText('INDIA  →  RIO DE JANEIRO', w / 2, 230);
      x.font = `46px ${SERIF}`; x.fillText('INDIA FOOTBALL TEAM', w / 2, 330);
      x.strokeStyle = '#1E2F55'; x.lineWidth = 4; x.strokeRect(90, 400, w - 180, 140); x.fillStyle = '#1E2F55'; x.font = `bold 44px ${SERIF}`; x.fillText('MOST TRAVEL COSTS', w / 2, 448); x.fillText('OFFERED BY THE ORGANISERS', w / 2, 504);
      x.fillStyle = '#2A1A10'; x.font = `bold 40px ${MONO}`; x.textAlign = 'left'; x.fillText('VOYAGE  ·  CLASS III', 90, 660); x.textAlign = 'right'; x.fillText('No. 0612', w - 90, 660);
    }, 'DECLINED');
    this.form = this.card(new THREE.Vector3(.3, .006, .32), .12, W, H, (x, w, h) => {
      x.fillStyle = '#ECE3CF'; x.fillRect(0, 0, w, h); paperNoise(x, w, h);
      x.fillStyle = '#6B1420'; x.fillRect(0, 0, w, 120); x.fillStyle = '#F6EEDB'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold 58px ${SERIF}`; x.fillText('WORLD CUP 1954 · SWITZERLAND', w / 2, 64);
      x.fillStyle = '#2A1A10'; x.font = `bold 84px ${SERIF}`; x.fillText('ENTRY FORM', w / 2, 220);
      x.textAlign = 'left'; x.font = `44px ${SERIF}`; [['NATION', 'INDIA'], ['FEDERATION', 'A.I.F.F.']].forEach(([a, b], i) => { const y = 340 + i * 110; x.fillText(a + ':', 100, y); x.font = `bold 52px ${MONO}`; x.fillText(b, 420, y); x.font = `44px ${SERIF}`; x.fillRect(400, y + 34, w - 500, 3); });
      x.font = `36px ${SERIF}`; x.fillText('Signature ____________________', 100, 640);
    }, 'NOT ACCEPTED');
    this.ticketHome = this.ticket.g.position.clone(); this.ticketFrom = this.ticketHome.clone().add(new THREE.Vector3(-.45, 0, -.12));
  }

  // ------------------------------------------------------------ the rubber stamp (walnut knob, brass ferrule, red rubber)
  buildStamp() {
    const sp = this.stampG = new THREE.Group(); this.scene.add(sp);
    const knob = new THREE.Mesh(lathe([[0, .1], [.014, .1], [.018, .108], [.016, .118], [.008, .124], [0, .125]], 48), this.M.walnut);
    const handle = new THREE.Mesh(lathe([[0, .035], [.011, .035], [.008, .06], [.008, .088], [.011, .1], [0, .1]], 48), this.M.walnut);
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .008, 32), this.M.brass); fer.position.y = .033;
    const block = new THREE.Mesh(new RoundedBoxGeometry(.12, .026, .05, 2, .004), this.M.walnut); block.position.y = .016;
    const rub = new THREE.Mesh(new THREE.BoxGeometry(.114, .004, .046), new THREE.MeshStandardMaterial({ color: '#7A1016', roughness: .7 })); rub.position.y = .002;
    [knob, handle, fer, block, rub].forEach(m => { m.castShadow = true; sp.add(m); });
    this.stampPark = new THREE.Vector3(.16, 0, .46);
  }

  // ------------------------------------------------------------ desk globe: India, Brazil, the Asian rivals
  buildGlobe() {
    const g = this.globeG = new THREE.Group(); g.position.set(-.72, 0, -.5); this.scene.add(g); const R = this.gR = .16;
    const base = new THREE.Mesh(lathe([[0, 0], [.1, 0], [.1, .012], [.085, .024], [.03, .034], [.016, .06], [0, .06]], 64), this.M.walnut); base.castShadow = base.receiveShadow = true; g.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.008, .01, .12, 24), this.M.brass); post.position.y = .11; g.add(post);
    const tilt = this.globeTilt = new THREE.Group(); tilt.position.y = .34; tilt.rotation.z = 23.4 * D2R; g.add(tilt);
    const mer = new THREE.Mesh(new THREE.TorusGeometry(R + .012, .0045, 12, 128, Math.PI * 1.25), this.M.brass); mer.rotation.z = -Math.PI * .125 + Math.PI / 2; mer.rotation.y = Math.PI / 2; tilt.add(mer);
    const proj = (lon, lat, w, h) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
    const drawRings = (x, rings, w, h) => { x.beginPath(); rings.forEach(r => { r.forEach(([lo, la], i) => { const [X, Y] = proj(lo, la, w, h); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); }); };
    const map = ctex(4096, 2048, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i += 1) { const xx = i % w, yy = (i / w) | 0; const n = noise.noise(xx / 300, yy / 300) * .5 + noise.noise(xx / 40, yy / 40) * .2; img.data.set([38 + 14 * n, 78 + 14 * n, 88 + 12 * n, 255], i * 4); } x.putImageData(img, 0, 0);
      x.strokeStyle = 'rgba(220,200,150,.22)'; x.lineWidth = 2; for (let lo = -180; lo <= 180; lo += 15) { const [X] = proj(lo, 0, w, h); x.beginPath(); x.moveTo(X, 0); x.lineTo(X, h); x.stroke(); } for (let la = -75; la <= 75; la += 15) { const [, Y] = proj(0, la, w, h); x.beginPath(); x.moveTo(0, Y); x.lineTo(w, Y); x.stroke(); }
      drawRings(x, WORLD.land, w, h); x.fillStyle = '#E3CFA2'; x.fill('evenodd'); x.strokeStyle = '#7A5A30'; x.lineWidth = 3; x.stroke();
      x.lineWidth = 2.5; x.strokeStyle = 'rgba(70,40,20,.75)'; ['India', 'Brazil', 'Burma', 'Indonesia', 'Philippines'].forEach(k => { drawRings(x, WORLD[k], w, h); x.stroke(); }); }, true);
    const layer = (fill) => ctex(4096, 2048, (x, w, h) => { x.clearRect(0, 0, w, h); x.lineJoin = 'round'; fill(x, w, h); }, true);
    const hiIndia = layer((x, w, h) => { drawRings(x, WORLD.India, w, h); x.fillStyle = '#FF8A00'; x.fill(); x.strokeStyle = '#FFE08A'; x.lineWidth = 5; x.stroke(); });
    const hiBrazil = layer((x, w, h) => { drawRings(x, WORLD.Brazil, w, h); x.fillStyle = '#1FA05A'; x.fill(); x.strokeStyle = '#FFE08A'; x.lineWidth = 5; x.stroke(); });
    const hiRiv = layer((x, w, h) => { ['Burma', 'Indonesia', 'Philippines'].forEach(k => { drawRings(x, WORLD[k], w, h); x.fillStyle = '#C8202A'; x.fill(); x.strokeStyle = '#FFD0C0'; x.lineWidth = 4; x.stroke(); }); });
    this.globeMat = new THREE.MeshPhysicalMaterial({ map, roughness: .5, clearcoat: .35, clearcoatRoughness: .3 });
    const hm = t => new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: 0, roughness: .5, emissive: '#FFFFFF', emissiveMap: t, emissiveIntensity: .35, depthWrite: false });
    this.hiIndia = hm(hiIndia); this.hiBrazil = hm(hiBrazil); this.hiRiv = hm(hiRiv);
    const spin = this.globeSpin = new THREE.Group(); tilt.add(spin);
    const sph = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), this.globeMat); sph.castShadow = true; spin.add(sph);
    [this.hiIndia, this.hiBrazil, this.hiRiv].forEach((m, i) => spin.add(new THREE.Mesh(new THREE.SphereGeometry(R * (1.002 + i * .0008), 128, 96), m)));
    // India -> Brazil arc, raised; it is drawn part of the way, then fades (the trip that never happened)
    const A = llv(22.5, 80, R), B = llv(-12, -50, R), pts = [];
    for (let i = 0; i <= 80; i++) { const u = i / 80; const p = new THREE.Vector3().copy(A).normalize().lerp(B.clone().normalize(), u).normalize(); pts.push(p.multiplyScalar(R * (1 + .22 * Math.sin(Math.PI * u)))); }
    const curve = new THREE.CatmullRomCurve3(pts); this.arcCurve = curve;
    this.arcMat = new THREE.MeshStandardMaterial({ color: '#FFC94A', emissive: '#FFB020', emissiveIntensity: 1.2, metalness: .4, roughness: .3, transparent: true });
    const tube = this.arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .0028, 10), this.arcMat); spin.add(tube); this.arcN = tube.geometry.index.count;
    const head = this.arcHead = new THREE.Mesh(new THREE.SphereGeometry(.007, 24, 16), new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFD060', emissiveIntensity: 2.5, transparent: true })); spin.add(head);
    this.llA = A; this.llB = B;
  }

  // ------------------------------------------------------------ four name blocks: BURMA, INDONESIA, PHILIPPINES topple; INDIA stands
  buildBlocks() {
    this.blocks = [];
    ['BURMA', 'INDONESIA', 'PHILIPPINES', 'INDIA'].forEach((name, i) => {
      const piv = new THREE.Group(); piv.position.set(.38 + i * .135, 0, .06 - .02); piv.rotation.y = -.18; this.scene.add(piv);
      const g = new THREE.Group(); g.position.set(0, 0, .02); piv.add(g);
      const blk = new THREE.Mesh(new RoundedBoxGeometry(.13, .036, .04, 2, .005), this.M.walnut); blk.position.y = .018; blk.castShadow = blk.receiveShadow = true; g.add(blk);
      const india = name === 'INDIA';
      const pm = this.M.brass.clone(); pm.color.set('#FFFFFF'); pm.map = ctex(640, 200, (x, w, h) => { x.fillStyle = india ? '#E0B25A' : '#C79A4E'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7A5A28'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#20160A'; x.textAlign = 'center'; x.textBaseline = 'middle'; let f = 92; x.font = `bold ${f}px ${LAT}`; while (x.measureText(name).width > w - 60) { f -= 4; x.font = `bold ${f}px ${LAT}`; } x.fillText(name, w / 2, h / 2 + 4); }, true);
      if (india) { pm.metalness = .35; pm.roughness = .45; pm.emissive = new THREE.Color('#FFB040'); pm.emissiveMap = pm.map; pm.emissiveIntensity = 0; this.indiaPlate = pm; }
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(.122, .038), pm); plate.position.set(0, .044, .002); plate.rotation.x = -Math.PI / 2 + .6; g.add(plate);
      this.blocks.push({ piv, g, k: i, india, name });
    });
  }

  // ------------------------------------------------------------ a classic 32-panel leather football (12 pentagons, 20 hexagons), seams pressed in
  buildBall() {
    const R = this.ballR = .108, g = this.ballG = new THREE.Group(); g.position.set(-.36, R, -.16); this.scene.add(g); const spin = this.ballSpinG = new THREE.Group(); g.add(spin);
    const ico = new THREE.IcosahedronGeometry(1, 0), ip = ico.attributes.position, C = [], pent = [];
    const key = v => v.toArray().map(x => x.toFixed(3)).join(',');
    const seen = new Set(); for (let i = 0; i < ip.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(ip, i).normalize(); if (!seen.has(key(v))) { seen.add(key(v)); C.push(v); pent.push(true); } }
    for (let i = 0; i < ip.count; i += 3) { const v = new THREE.Vector3().fromBufferAttribute(ip, i).add(new THREE.Vector3().fromBufferAttribute(ip, i + 1)).add(new THREE.Vector3().fromBufferAttribute(ip, i + 2)).normalize(); C.push(v); pent.push(false); }
    const geo = new THREE.SphereGeometry(1, 384, 256), P = geo.attributes.position, col = [];
    const tan = new THREE.Color('#B5743C'), dark = new THREE.Color('#4A2412'), seamC = new THREE.Color('#2A140A');
    for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i).normalize(); let d1 = -2, d2 = -2, k1 = 0; C.forEach((c, k) => { const d = v.dot(c); if (d > d1) { d2 = d1; d1 = d; k1 = k; } else if (d > d2) d2 = d; });
      const gap = (Math.acos(Math.min(1, d2)) - Math.acos(Math.min(1, d1))); const groove = Math.exp(-Math.pow(gap / .022, 2)), pillow = Math.min(1, gap / .2);
      const r = R * (1 - .012 * groove + .004 * Math.sin(pillow * Math.PI / 2)); P.setXYZ(i, v.x * r, v.y * r, v.z * r);
      const c = (pent[k1] ? dark : tan).clone().lerp(seamC, groove * .85); col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const map = ctex(2048, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const n = noise.noise(xx / 5, yy / 5) * .3 + noise.noise(xx / 60, yy / 40) * .7; const wear = Math.max(0, noise.noise(xx / 160 + 4, yy / 90)); const v = 225 + 20 * n + 30 * wear; img.data.set([v, v * .97, v * .92, 255], i * 4); } x.putImageData(img, 0, 0); }, true);
    const bump = ctex(2048, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; const v = 128 + 45 * noise.noise(xx / 3, yy / 3) + 20 * noise.noise(xx / 25, yy / 12); img.data.set([v, v, v, 255], i * 4); } x.putImageData(img, 0, 0); }, false);
    const ball = this.ball = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, map, bumpMap: bump, bumpScale: .6, roughness: .5, clearcoat: .4, clearcoatRoughness: .35, sheen: .2, sheenColor: '#C08050' }));
    ball.castShadow = ball.receiveShadow = true; spin.add(ball);
    spin.rotation.set(.5, -.6, .15);
  }

  // ------------------------------------------------------------ cotton bandage rolls; one unrolls across the desk
  buildBandages() {
    const weave = (rep) => ctex(512, 512, (x, w, h) => { x.fillStyle = '#DCD2BE'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(140,120,90,.45)'; x.lineWidth = 2; for (let i = 0; i < w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(120,100,70,${rnd() * .08})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, true, rep, rep);
    const spiral = ctex(512, 512, (x, w, h) => { x.fillStyle = '#E6DDCB'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(130,110,80,.55)'; x.lineWidth = 3; x.beginPath(); for (let a = 0; a < TAU * 16; a += .05) { const r = 30 + a / TAU * 14; const X = w / 2 + Math.cos(a) * r, Y = h / 2 + Math.sin(a) * r; a ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); x.fillStyle = '#8A7A60'; x.beginPath(); x.arc(w / 2, h / 2, 22, 0, TAU); x.fill(); }, true);
    const side = new THREE.MeshStandardMaterial({ map: weave(2), roughness: .95 }), cap = new THREE.MeshStandardMaterial({ map: spiral, roughness: .95 });
    const roll = (r, len) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 48), [side, cap, cap]); m.castShadow = m.receiveShadow = true; return m; };
    const r2 = roll(.024, .06); r2.rotation.set(0, .5, Math.PI / 2); r2.position.set(-.16, .024, -.02); this.scene.add(r2);
    const r3 = roll(.02, .06); r3.position.set(-.2, .03, .07); this.scene.add(r3);
    // the unrolling strip: a long flat ribbon in a gentle S, drawn up to the roll
    const L = .42, SEG = 80, wid = .055; const strip = new THREE.PlaneGeometry(wid, L, 1, SEG); strip.rotateX(-Math.PI / 2); const sp = strip.attributes.position;
    const path = u => new THREE.Vector3(-.09 + .5 * u, .0009 + .0004 * Math.sin(u * 40), .12 + .05 * Math.sin(u * Math.PI * 1.3));
    for (let i = 0; i < sp.count; i++) { const zz = sp.getZ(i), xx = sp.getX(i); const u = (zz + L / 2) / L; const c = path(u), c2 = path(u + .01); const dir = c2.clone().sub(c).normalize(); const nrm = new THREE.Vector3(-dir.z, 0, dir.x); sp.setXYZ(i, c.x + nrm.x * xx, c.y, c.z + nrm.z * xx); }
    strip.computeVertexNormals();
    // index rows go from z = -L/2 (u = 0) outward, so the draw range reveals it from the start of the path
    const sm2 = new THREE.MeshStandardMaterial({ map: weave(1), roughness: .95, side: THREE.DoubleSide });
    const sm3 = this.strip = new THREE.Mesh(strip, sm2); sm3.receiveShadow = true; this.scene.add(sm3); this.stripN = strip.index.count; this.stripPath = path;
    this.roll1 = roll(.022, wid + .004); this.roll1.rotation.z = Math.PI / 2; this.scene.add(this.roll1);
  }

  // ------------------------------------------------------------ a pair of 1950 leather boots: high ankle, hard toe cap, leather studs, laces
  // ------------------------------------------------------------ a pair of leather football boots: a scanned shoe (Shopify, CC BY 4.0) recoloured to
  // dark leather with cream laces and a dark sole, plus nailed leather studs. Loaded in load().
  buildBoots() {
    this.bootL = new THREE.Group(); this.bootR = new THREE.Group(); [this.bootL, this.bootR].forEach(b => this.scene.add(b));
    this.bootHome = [new THREE.Vector3(.06, 0, -.12), new THREE.Vector3(.22, 0, -.05)];
    this.bootRot = [-.5, -.15];
  }
  async load() {
    const buf = await new Promise((ok, no) => { const r = new XMLHttpRequest(); r.open('GET', new URL('../vendor/models/shoe/shoe.glb', import.meta.url).href); r.responseType = 'arraybuffer'; r.onload = () => ok(r.response); r.onerror = no; r.send(); }); // XHR works on file:// pages, fetch does not
    const gl = await new GLTFLoader().parseAsync(buf, '');
    let mesh = null; gl.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    const src = mesh.material, img = src.map.image; const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, sat = mx - mn; const n = ((i * 7919) % 97) / 97;
      let o; if (sat > .18 && b > r) { const t = .55 + .7 * l; o = [92 * t, 54 * t, 28 * t]; } // blue upper -> brown leather
      else if (l > .7) { o = [40 + 10 * n, 26 + 6 * n, 16]; } // white foam sole -> dark sole
      else { const t = .7 + .5 * l; o = [226 * t, 212 * t, 184 * t]; } // grey laces / trims -> cream
      a[i] = Math.min(255, o[0]); a[i + 1] = Math.min(255, o[1]); a[i + 2] = Math.min(255, o[2]); }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = src.map.flipY; t.anisotropy = 8;
    const m = new THREE.MeshPhysicalMaterial({ map: t, normalMap: src.normalMap || null, normalScale: new THREE.Vector2(.25, .25), roughness: .45, clearcoat: .45, clearcoatRoughness: .35, sheen: .2, sheenColor: '#A06A40' });
    const sole = new THREE.MeshPhysicalMaterial({ color: '#24160C', roughness: .7 });
    mesh.geometry.computeBoundingBox(); const bb = mesh.geometry.boundingBox; const S = .28 / (bb.max.x - bb.min.x);
    [this.bootL, this.bootR].forEach((B, i) => { const inner = new THREE.Group(); const sm2 = new THREE.Mesh(mesh.geometry, m); sm2.castShadow = sm2.receiveShadow = true; inner.add(sm2);
      // studs under the sole, in shoe space (x along the length, z across)
      [[.62, .17], [.62, -.17], [.35, .2], [.35, -.2], [.08, .18], [.08, -.18], [-.62, .14], [-.62, -.14], [-.82, .12], [-.82, -.12]].forEach(([X, Z]) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, .09, 16), sole); s.position.set(X, bb.min.y - .03, Z); s.castShadow = true; inner.add(s); });
      inner.scale.setScalar(S); inner.position.y = -(bb.min.y - .075) * S; inner.rotation.y = Math.PI; if (i) inner.scale.z *= -1; B.add(inner); });
    return this;
  }

  // ------------------------------------------------------------ green-shaded banker's lamp
  buildLamp() {
    const g = this.lampG = new THREE.Group(); g.position.set(.55, 0, -.85); g.rotation.y = -.5; this.scene.add(g);
    const base = new THREE.Mesh(new RoundedBoxGeometry(.16, .02, .1, 2, .006), this.M.brass); base.position.y = .01; base.castShadow = true; g.add(base);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .3, 16), this.M.brass); st.position.y = .16; g.add(st);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .26, 48, 1, true, 0, Math.PI), this.M.greenGlass); shade.rotation.set(0, 0, Math.PI / 2); shade.rotation.order = 'ZYX'; shade.position.set(0, .32, .02); shade.castShadow = true; g.add(shade);
    const lp = this.lampLight = new THREE.PointLight('#FFD9A0', .6, 1.2, 1.5); lp.position.set(0, .28, .04); g.add(lp);
  }

  // ------------------------------------------------------------ anchors for labels
  anchor(name) {
    const wp = o => o.getWorldPosition(new THREE.Vector3());
    this.scene.updateMatrixWorld(true);
    switch (name) {
      case 'entry': return wp(this.entry.g).add(new THREE.Vector3(0, .01, 0));
      case 'ticket': return wp(this.ticket.g).add(new THREE.Vector3(0, .01, 0));
      case 'form': return wp(this.form.g).add(new THREE.Vector3(0, .01, 0));
      case 'globe': return wp(this.globeTilt);
      case 'india': return this.globeSpin.localToWorld(llv(22.5, 79, this.gR * 1.01));
      case 'brazil': return this.globeSpin.localToWorld(llv(-10, -52, this.gR * 1.01));
      case 'burma': return this.globeSpin.localToWorld(llv(21, 96, this.gR * 1.01));
      case 'indonesia': return this.globeSpin.localToWorld(llv(-2, 114, this.gR * 1.01));
      case 'philippines': return this.globeSpin.localToWorld(llv(12, 122.5, this.gR * 1.01));
      case 'arcHead': return wp(this.arcHead);
      case 'ball': return wp(this.ballG).add(new THREE.Vector3(0, this.ballR * .7, 0));
      case 'strip': return this.stripPath(.45);
      case 'boots': return wp(this.bootL).add(new THREE.Vector3(0, .13, 0));
      case 'blockI': return wp(this.blocks[3].g).add(new THREE.Vector3(0, .05, 0));
    }
    return new THREE.Vector3();
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { return []; }

  // ------------------------------------------------------------ one frame
  render(t) {
    const S = this.ST, st = this.studio;
    st.renderer.toneMappingExposure = S.exposure;
    // rubber stamp: 0 parked, .5 pressed on card S.stampAt (0 entry, 1 ticket, 2 form), 1 lifted clear
    { const c = [this.entry, this.ticket, this.form][S.stampAt | 0]; const hit = c.ink.getWorldPosition(new THREE.Vector3()); hit.y += .006; const above = hit.clone().add(new THREE.Vector3(0, .1, 0));
      const u = cl(S.stamp); let p; if (u < .5) { const a = sm(cl(u / .38)), d = Math.pow(cl((u - .38) / .12), 2); p = this.stampPark.clone().lerp(above, a); p.y = lerp(p.y, hit.y, d); }
      else { const a = sm(cl((u - .5) / .5)); p = hit.clone().lerp(above.clone().add(new THREE.Vector3(.1, .08, .08)), a); }
      this.stampG.position.copy(p); this.stampG.rotation.set(0, c.g.rotation.y + .2 - .2 * sm(cl(u * 2)) + .2 * sm(cl(u * 2 - 1)), 0); this.stampG.visible = u > 0 && u < 1; }
    this.entry.ink.material.opacity = cl(S.inkE); this.ticket.ink.material.opacity = cl(S.inkT); this.form.ink.material.opacity = cl(S.inkF);
    // the ticket slides in across the desk from the left
    { const u = sm(cl(S.ticket)); this.ticket.g.position.copy(this.ticketFrom).lerp(this.ticketHome, u); this.ticket.g.visible = S.ticket > 0; }
    // globe: spin so longitude S.lon faces the camera side; highlight layers; the India -> Brazil arc
    this.globeSpin.rotation.y = -(S.lon + 90) * D2R;
    this.hiIndia.opacity = cl(Math.max(S.brazil, S.rivals) > 0 ? 1 : 0) * cl(S.brazil + S.rivals); this.hiBrazil.opacity = cl(S.brazil); this.hiRiv.opacity = cl(S.rivals);
    { const u = cl(S.arc); this.arc.visible = u > 0 && S.arcFade < 1; this.arc.geometry.setDrawRange(0, Math.floor(this.arcN * u / 3) * 3); this.arcMat.opacity = 1 - cl(S.arcFade); this.arcHead.visible = this.arc.visible; this.arcHead.material.opacity = 1 - cl(S.arcFade); this.arcHead.position.copy(this.arcCurve.getPointAt(Math.min(.999, u))); }
    // the rival blocks topple backwards one after another
    this.blocks.forEach(b => { const u = b.india ? 0 : cl(S.topple * 3.4 - b.k * 1.1); const e = u < 1 ? Math.pow(u, 2.2) : 1; b.piv.rotation.x = -1.5708 * e + (u >= 1 ? 0 : 0); b.piv.rotation.z = 0; });
    if (this.indiaPlate) this.indiaPlate.emissiveIntensity = .07 * cl(S.indiaGlow);
    // ball slow turn
    this.ballSpinG.rotation.set(.5, -.6 + S.ballSpin, .15);
    // bandage strip unrolls; the roll travels to its end
    { const u = cl(S.unroll); const rows = Math.max(0, Math.floor(80 * u)); this.strip.geometry.setDrawRange(0, rows * 6); this.strip.visible = rows > 0; const p = this.stripPath(Math.max(.001, u)); this.roll1.position.set(p.x, .022 + .0004, p.z); this.roll1.rotation.set(0, -Math.atan2(this.stripPath(u + .01).z - p.z, this.stripPath(u + .01).x - p.x) + Math.PI / 2, Math.PI / 2); this.roll1.rotateY(u * 30); }
    // the boots drop onto the desk, then slide off to the right
    [this.bootL, this.bootR].forEach((b, i) => { const u = cl(S.boots * 1.6 - i * .6), o = sm(cl(S.bootsOut * 1.4 - i * .4)); const h = this.bootHome[i]; b.visible = u > 0 && o < 1; b.position.set(h.x + o * .9, (1 - sm(u)) * .25 + Math.sin(Math.PI * cl(u * 1.05)) * 0, h.z + o * .1); b.rotation.set((1 - sm(u)) * .4, this.bootRot[i] - o * .4, (1 - sm(u)) * .2); });
    // camera, light sweep
    const c = S.cam; const dd = Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz), nr = cl(dd * .05, .005, .2); if (Math.abs(st.camera.near - nr) > 1e-5) { st.camera.near = nr; st.camera.updateProjectionMatrix(); }
    st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.glint.intensity = 3 * Math.sin(Math.PI * cl(S.sweep)); st.glint.position.set(c.tx - .5 + 1 * S.sweep, c.ty + .35, c.tz + .45);
    st.key.position.set(c.tx + 1.4, 3.0, c.tz + 2.2); st.key.target.position.set(c.tx, 0, c.tz); st.key.target.updateMatrixWorld();
    st.render();
  }
}
