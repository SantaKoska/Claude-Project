// keynote3d.js - a dark keynote stage for the Nvidia / Jensen Huang reel (ES module, three r186).
//
//   import { KeynoteWorld } from './lib/keynote3d.js';
//   const W = new KeynoteWorld(canvas, screens);  W.ST.scrA = 0;  W.ST.explode = 1;  W.render(t);  W.screen('chip') -> [x, y]
//
// Units are metres. An LED wall (z = -5) shows the real logo and photos and lights the stage with its colour.
// On a black plinth at the centre sits a data-centre GPU module built to scale x10 (circuit board, power stages,
// package substrate, GPU die, six HBM memory stacks, heat spreader and a finned heat sink); W.ST.explode takes it apart.
// To the left a glass column shows the company's market value (W.ST.cap, in trillions of dollars).
import * as THREE from 'three';
import { Studio, Exploded } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rnd = (() => { let s = 41; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; }
const SW = 12.8, SH = 7.2, SY = 4.2, SZ = -5;
const PY = .9;                 // plinth top
export const COL = { x: -2.3, z: .6, h: 4.2, max: 5 };   // market-value column: 5 T$ = full height

export class KeynoteWorld {
  constructor(canvas, screens) {
    const st = this.studio = new Studio(canvas, { bg: ['#0C1012', '#020304'], floorY: 0, fov: 36, exposure: 1.0, aperture: .00002, bloom: .22, floor: '#0A0C0D', env: .35, aoStrength: .7 });
    const s = this.scene = st.scene; s.fog = new THREE.FogExp2('#040506', .03);
    st.key.intensity = 0; st.key.castShadow = false;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .35, distanceExponent: 1.3, thickness: .35, scale: 1, samples: 12 });
    if (st.bloom) { st.bloom.threshold = .6; st.bloom.radius = .45; }
    // glossy black stage floor with a faint grid of panels
    st.floor.geometry = new THREE.PlaneGeometry(40, 40); st.floor.material = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .32, metalness: .2, clearcoat: 1, clearcoatRoughness: .12,
      map: ctex(1024, 1024, (x, w, h) => { x.fillStyle = '#0B0D0F'; x.fillRect(0, 0, w, h); x.strokeStyle = '#15191C'; x.lineWidth = 3; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke(); } for (let i = 0; i < 20000; i++) { x.fillStyle = `rgba(255,255,255,${rnd() * .025})`; x.fillRect(rnd() * w, rnd() * h, 1, 1); } }, true, 5, 5) });
    st.floor.receiveShadow = true;
    this.M = {
      alu: new THREE.MeshPhysicalMaterial({ color: '#C9CDD2', metalness: 1, roughness: .28, map: ctex(512, 512, (x, w, h) => { x.fillStyle = '#B8BCC2'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${rnd() < .5 ? 255 : 60},${rnd() < .5 ? 255 : 60},${rnd() < .5 ? 255 : 60},${rnd() * .08})`; x.fillRect(0, rnd() * h, w, 1); } }, true) }),
      nickel: new THREE.MeshPhysicalMaterial({ color: '#D7D9DC', metalness: 1, roughness: .18, clearcoat: .3 }),
      black: new THREE.MeshPhysicalMaterial({ color: '#121417', roughness: .4, metalness: .3, clearcoat: .5 }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#D9A646', metalness: 1, roughness: .25 }),
      ferrite: new THREE.MeshPhysicalMaterial({ color: '#3A3D42', roughness: .55, metalness: .4 }),
      plinth: new THREE.MeshPhysicalMaterial({ color: '#0C0D0F', roughness: .3, metalness: .5, clearcoat: 1, clearcoatRoughness: .1 }),
    };
    this.buildStage(); this.buildScreen(screens); this.buildGPU(); this.buildColumn();
    this.ST = { cam: { px: 0, py: 2, pz: 8, tx: 0, ty: 1.2, tz: 0, fov: 36, roll: 0 }, aperture: .00002, exposure: 1.0, scrA: 0, scrB: 0, scrMix: 0, scrOn: 1, scrZoom: 0,
      explode: 0, spin: 0, rim: 1, red: 0, cap: 4, colOn: 1, chipOn: 1, chipGlow: 0, house: 1 };
  }

  // ------------------------------------------------------------ plinth, rim lights, light strips on the stage
  buildStage() {
    const s = this.scene;
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.32, PY, 96, 1), this.M.plinth); pl.position.set(0, PY / 2, 0); pl.castShadow = pl.receiveShadow = true; s.add(pl);
    const ringMat = this.ringMat = new THREE.MeshBasicMaterial({ color: '#76B900', toneMapped: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.27, .012, 8, 160), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(0, PY - .04, 0); s.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.33, .008, 8, 160), ringMat); ring2.rotation.x = Math.PI / 2; ring2.position.set(0, .02, 0); s.add(ring2);
    // light strips along the floor towards the wall
    const sm = this.stripMat = new THREE.MeshBasicMaterial({ color: '#9FE870', toneMapped: false, transparent: true, opacity: .55 });
    for (const x of [-4.2, 4.2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.03, .01, 9), sm); b.position.set(x, .006, 0); s.add(b); }
    // lights: cool top key on the plinth, green rims from behind, warm fill from the front
    const key = this.keyL = new THREE.SpotLight('#EAF2FF', 34, 14, .42, .7, 1.4); key.position.set(1.5, 6.5, 3.5); key.target.position.set(0, PY, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.radius = 4; s.add(key, key.target);
    this.rims = [[-3, 2.6, -2.2], [3, 2.6, -2.2]].map(p => { const l = new THREE.SpotLight('#8CE04A', 30, 12, .5, .8, 1.3); l.position.set(...p); l.target.position.set(0, PY + .2, 0); s.add(l, l.target); return l; });
    this.fill = new THREE.PointLight('#FFE6C8', 3, 12, 1.5); this.fill.position.set(-1.5, 2.2, 5); s.add(this.fill);
    this.redL = new THREE.PointLight('#FF2A2A', 0, 14, 1.3); this.redL.position.set(0, 3.5, 2); s.add(this.redL);
    this.colL = new THREE.PointLight('#8CE04A', 0, 6, 1.6); this.colL.position.set(COL.x, 2, COL.z + .8); s.add(this.colL);
  }

  // ------------------------------------------------------------ the LED wall: two image layers crossfading; its light spills on the stage
  buildScreen(images) {
    this.screens = (images || []).map(sc => { let avg = new THREE.Color('#888888');
      const tex = ctex(1600, 900, (x, w, h) => {
        const VW = w * .3; // the 9:16 frame sees only the middle of the wall: compose for that column
        if (sc.kind === 'logo') { const g = x.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * .5); g.addColorStop(0, sc.bg || '#14200C'); g.addColorStop(1, '#030405'); x.fillStyle = g; x.fillRect(0, 0, w, h);
          const r = Math.min(VW * .9 / sc.img.width, h * .3 / sc.img.height); const iw = sc.img.width * r, ih = sc.img.height * r; x.drawImage(sc.img, (w - iw) / 2, (h - ih) / 2 - (sc.lift || 0) * h, iw, ih);
          if (sc.sub) { x.fillStyle = '#E8E4DC'; x.textAlign = 'center'; x.textBaseline = 'middle'; let f = 54; x.font = `800 ${f}px Inter`; while (x.measureText(sc.sub).width > VW * .9) { f -= 2; x.font = `800 ${f}px Inter`; } x.fillText(sc.sub, w / 2, h * .7); } }
        else if (sc.kind === 'text') { const g = x.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * .55); g.addColorStop(0, sc.bg || '#0A0B10'); g.addColorStop(1, '#020203'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle';
          const TW = w * (sc.vw || .3), cx = w / 2 + (sc.ox || 0) * w;
          if (sc.text) { x.fillStyle = sc.fg || '#76D13A'; let f = sc.size || 300; x.font = `900 ${f}px Inter`; while (x.measureText(sc.text).width > TW * .95) { f -= 8; x.font = `900 ${f}px Inter`; } x.fillText(sc.text, cx, h * .42); }
          if (sc.sub) { x.fillStyle = '#E8E4DC'; let f = 64; x.font = `800 ${f}px Inter`; while (x.measureText(sc.sub).width > TW * .95) { f -= 2; x.font = `800 ${f}px Inter`; } x.fillText(sc.sub, cx, h * .7); } }
        else { const img = sc.img, portrait = img.height > img.width * .9;
          x.fillStyle = '#000'; x.fillRect(0, 0, w, h); const rc = Math.max(w / img.width, h / img.height); x.filter = 'blur(28px) brightness(.4)'; x.drawImage(img, (w - img.width * rc) / 2, (h - img.height * rc) / 2, img.width * rc, img.height * rc); x.filter = sc.grade || 'none';
          if (portrait) { const r = h / img.height * (sc.zoom || 1); x.drawImage(img, (w - img.width * r) / 2 + (sc.dx || 0) * VW, (h - img.height * r) / 2 + (sc.dy || 0) * h, img.width * r, img.height * r); }
          else { const r = Math.max(VW / img.width, h / img.height) * (sc.zoom || 1); x.drawImage(img, (w - img.width * r) / 2 + (sc.dx || 0) * img.width * r, (h - img.height * r) / 2 + (sc.dy || 0) * h, img.width * r, img.height * r); }
          x.filter = 'none'; const v = x.createRadialGradient(w / 2, h / 2, h * .35, w / 2, h / 2, w * .5); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = v; x.fillRect(0, 0, w, h); }
        // LED pixel grid: very fine dark lines so the wall reads as a real video wall up close
        x.fillStyle = 'rgba(0,0,0,.16)'; for (let i = 0; i < w; i += 4) x.fillRect(i, 0, 1, h); for (let j = 0; j < h; j += 4) x.fillRect(0, j, w, 1);
        const d = x.getImageData(0, 0, w, h).data; let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; } avg = new THREE.Color(R / n / 255, G / n / 255, B / n / 255);
      }, true); return { tex, avg }; });
    const geo = new THREE.PlaneGeometry(SW, SH);
    this.scrMatA = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }); this.scrMatB = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, toneMapped: false });
    const a = new THREE.Mesh(geo, this.scrMatA), b = new THREE.Mesh(geo, this.scrMatB); a.position.set(0, SY, SZ); b.position.set(0, SY, SZ + .005); this.scene.add(a, b); this.scrA = a; this.scrB = b;
    const fr = new THREE.Mesh(new RoundedBoxGeometry(SW + .3, SH + .3, .2, 2, .05), new THREE.MeshStandardMaterial({ color: '#050506', roughness: .6 })); fr.position.set(0, SY, SZ - .12); this.scene.add(fr);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshStandardMaterial({ color: '#060708', roughness: 1 })); back.position.set(0, 7, SZ - .3); this.scene.add(back);
    this.scrLight = new THREE.SpotLight('#FFFFFF', 0, 30, .95, .9, 1.2); this.scrLight.position.set(0, SY, SZ + .4); this.scrLight.target.position.set(0, .5, 6); this.scene.add(this.scrLight, this.scrLight.target);
    this.scrFill = new THREE.PointLight('#FFFFFF', 0, 16, 1.4); this.scrFill.position.set(0, SY - 1.5, SZ + 2); this.scene.add(this.scrFill);
  }

  // ------------------------------------------------------------ the GPU module (x10 scale), every part a separate mesh for the exploded view
  buildGPU() {
    const g = this.gpu = new THREE.Group(); g.position.set(0, PY, 0); this.scene.add(g); const ex = this.ex = new Exploded(); ex.spread = 1;
    const shadow = m => { m.castShadow = m.receiveShadow = true; return m; };
    // circuit board: black solder mask, gold traces and pads, gold-finger edge
    const pcbMap = ctex(2048, 1280, (x, w, h) => { x.fillStyle = '#0E1512'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(190,150,60,.45)'; x.lineWidth = 2; for (let i = 0; i < 520; i++) { let px = rnd() * w, py = rnd() * h; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 4; k++) { if (rnd() < .5) px += (rnd() - .5) * 260; else py += (rnd() - .5) * 260; x.lineTo(px, py); } x.stroke(); }
      x.fillStyle = 'rgba(220,175,80,.85)'; for (let i = 0; i < 900; i++) x.fillRect(rnd() * w, rnd() * h, 6, 6);
      x.fillStyle = '#D6A64A'; for (let i = 0; i < 70; i++) x.fillRect(80 + i * 27, h - 46, 16, 40);
      x.fillStyle = 'rgba(235,235,235,.75)'; x.font = '700 30px "DejaVu Sans Mono"'; x.fillText('GPU MODULE · REV A01', 70, 70); }, true);
    const pcb = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.42, .035, .9, 2, .01), [this.M.black, this.M.black, new THREE.MeshPhysicalMaterial({ map: pcbMap, roughness: .45, clearcoat: .8, clearcoatRoughness: .2 }), this.M.black, this.M.black, this.M.black]));
    pcb.material = new THREE.MeshPhysicalMaterial({ map: pcbMap, roughness: .45, clearcoat: .8, clearcoatRoughness: .2, color: '#FFFFFF' });
    pcb.position.y = .018; g.add(pcb); ex.add(pcb, { off: [0, 0, 0], at: 0, label: 'CIRCUIT BOARD', anchor: [.62, .02, .36], side: 1 });
    // power stages: rows of chokes (grey ferrite cubes) and MOSFETs
    const vrm = new THREE.Group(); g.add(vrm);
    const choke = new THREE.InstancedMesh(new RoundedBoxGeometry(.05, .04, .05, 2, .006), this.M.ferrite, 64), fet = new THREE.InstancedMesh(new THREE.BoxGeometry(.035, .012, .03), this.M.black, 64);
    const o = new THREE.Object3D(); let k = 0;
    for (const sx of [-1, 1]) for (let c = 0; c < 2; c++) for (let r = 0; r < 8; r++) { o.position.set(sx * (.5 + c * .075), .055, -.33 + r * .088); o.updateMatrix(); choke.setMatrixAt(k, o.matrix); o.position.set(sx * (.5 + c * .075) - sx * .0, .041, -.33 + r * .088 + .04); o.updateMatrix(); fet.setMatrixAt(k, o.matrix); k++; }
    choke.count = fet.count = k; [choke, fet].forEach(m => { shadow(m); vrm.add(m); });
    ex.add(vrm, { off: [0, .12, 0], at: .25, len: .4, label: 'POWER STAGES', anchor: [-.575, .07, .28], side: -1 });
    // package substrate (dark green laminate with a ball-grid look on top)
    const subMap = ctex(1024, 800, (x, w, h) => { x.fillStyle = '#16301F'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(214,166,74,.55)'; for (let i = 0; i < 70; i++) for (let j = 0; j < 54; j++) if (rnd() < .5) x.fillRect(i * 14 + 6, j * 14 + 6, 4, 4); }, true);
    const sub = shadow(new THREE.Mesh(new RoundedBoxGeometry(.66, .025, .5, 2, .006), new THREE.MeshPhysicalMaterial({ map: subMap, roughness: .5, clearcoat: .6 }))); sub.position.y = .048; g.add(sub);
    ex.add(sub, { off: [0, .3, 0], at: .2, len: .45, label: 'PACKAGE SUBSTRATE', anchor: [.3, .012, .22], side: 1 });
    // GPU die: silicon with a visible grid of compute blocks, slightly iridescent
    const dieMap = ctex(1024, 900, (x, w, h) => { x.fillStyle = '#20232E'; x.fillRect(0, 0, w, h); const cols = 12, rows = 10; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const cx = 30 + i * (w - 60) / cols, cy = 30 + j * (h - 60) / rows; x.fillStyle = (i + j) % 3 ? '#2E3446' : '#363C52'; x.fillRect(cx + 3, cy + 3, (w - 60) / cols - 6, (h - 60) / rows - 6); x.fillStyle = 'rgba(150,170,220,.25)'; x.fillRect(cx + 8, cy + 8, 20, 10); } x.fillStyle = '#4A5068'; x.fillRect(w / 2 - 8, 30, 16, h - 60); }, true);
    const die = shadow(new THREE.Mesh(new THREE.BoxGeometry(.3, .012, .26), new THREE.MeshPhysicalMaterial({ map: dieMap, metalness: .55, roughness: .16, iridescence: .9, iridescenceIOR: 1.8, clearcoat: 1 }))); die.position.y = .067; g.add(die);
    this.die = die;
    ex.add(die, { off: [0, .62, 0], at: .15, len: .45, label: 'GPU DIE', anchor: [0, .006, -.13], side: -1 });
    // six HBM memory stacks: three each side of the die, layered
    const hbm = new THREE.Group(); g.add(hbm);
    for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) { const st = new THREE.Group(); st.position.set(sx * .225, .061, -.15 + r * .15);
      for (let l = 0; l < 5; l++) { const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(.075, .0045, .12), l % 2 ? this.M.ferrite : new THREE.MeshPhysicalMaterial({ color: '#2A2E36', metalness: .6, roughness: .25 }))); m.position.y = l * .0048; st.add(m); }
      hbm.add(st); }
    ex.add(hbm, { off: [0, .5, 0], at: .12, len: .45, label: 'HBM MEMORY', anchor: [.225, .03, .15], side: 1 });
    // heat spreader lid (nickel plated) with an engraved mark
    const lidMap = ctex(1024, 800, (x, w, h) => { x.fillStyle = '#D0D2D5'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${rnd() < .5 ? 255 : 90},${rnd() < .5 ? 255 : 90},${rnd() < .5 ? 255 : 90},${rnd() * .06})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } x.fillStyle = 'rgba(80,84,90,.7)'; x.font = '800 70px Inter'; x.textAlign = 'center'; x.fillText('AI ACCELERATOR', w / 2, h / 2 - 10); x.font = '600 40px "DejaVu Sans Mono"'; x.fillText('GPU · HBM3', w / 2, h / 2 + 60); }, true);
    const lid = shadow(new THREE.Mesh(new RoundedBoxGeometry(.62, .03, .46, 3, .008), [this.M.nickel, this.M.nickel, new THREE.MeshPhysicalMaterial({ map: lidMap, metalness: 1, roughness: .22 }), this.M.nickel, this.M.nickel, this.M.nickel])); lid.position.y = .1; g.add(lid);
    lid.material = new THREE.MeshPhysicalMaterial({ map: lidMap, metalness: 1, roughness: .22, color: '#FFFFFF' });
    ex.add(lid, { off: [0, .95, 0], at: .06, len: .45, label: 'HEAT SPREADER', anchor: [-.31, .015, 0], side: -1 });
    // finned heat sink with a copper base
    const hs = new THREE.Group(); hs.position.y = .118; g.add(hs);
    const base = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.0, .04, .78, 2, .008), new THREE.MeshPhysicalMaterial({ color: '#C77B4A', metalness: 1, roughness: .3 }))); base.position.y = .02; hs.add(base);
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(.006, .2, .76), this.M.alu, 64); for (let i = 0; i < 64; i++) { o.position.set(-.48 + i * .96 / 63, .14, 0); o.rotation.set(0, 0, 0); o.updateMatrix(); fins.setMatrixAt(i, o.matrix); } shadow(fins); hs.add(fins);
    const cap = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.0, .012, .78, 2, .004), this.M.black)); cap.position.y = .246; hs.add(cap);
    ex.add(hs, { off: [0, 1.45, 0], at: 0, len: .45, label: 'HEAT SINK', anchor: [.5, .14, 0], side: 1 });
    this.gpuGlow = new THREE.PointLight('#8CE04A', 0, 2.5, 1.5); this.gpuGlow.position.set(0, .3, 0); g.add(this.gpuGlow);
  }

  // ------------------------------------------------------------ market value column (glass tube, glowing green fill, ring marks every 1 T$)
  buildColumn() {
    const g = this.col = new THREE.Group(); g.position.set(COL.x, 0, COL.z); this.scene.add(g);
    const r = .34;
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(r, r, COL.h, 64, 1, true), new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .05, metalness: 0, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 }));
    glass.position.y = COL.h / 2 + .1; g.add(glass);
    const basePl = new THREE.Mesh(new THREE.CylinderGeometry(r + .12, r + .16, .1, 64), this.M.plinth); basePl.position.y = .05; basePl.castShadow = true; g.add(basePl);
    this.fillMat = new THREE.MeshPhysicalMaterial({ color: '#2E5A10', emissive: '#76B900', emissiveIntensity: .45, roughness: .25, transparent: true, opacity: .85 });
    const fill = this.colFill = new THREE.Mesh(new THREE.CylinderGeometry(r - .04, r - .04, 1, 64), this.fillMat); g.add(fill);
    this.capTop = new THREE.Mesh(new THREE.CylinderGeometry(r - .035, r - .035, .02, 64), new THREE.MeshBasicMaterial({ color: '#D8FFB0', toneMapped: false })); g.add(this.capTop);
    for (let i = 1; i <= COL.max; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(r + .01, .006, 6, 96), new THREE.MeshBasicMaterial({ color: '#7E8A90', toneMapped: false })); m.rotation.x = Math.PI / 2; m.position.y = .1 + COL.h * i / COL.max; g.add(m); }
  }
  colY(v) { return .1 + COL.h * v / COL.max; }

  anchor(name) {
    switch (name) {
      case 'screen': return new THREE.Vector3(0, SY, SZ);
      case 'chip': return new THREE.Vector3(0, PY + .2, 0);
      case 'colTop': return new THREE.Vector3(COL.x, this.colY(this.ST.cap), COL.z);
      case 'col': return new THREE.Vector3(COL.x, 0, COL.z);
    }
    if (name.startsWith('colAt:')) return new THREE.Vector3(COL.x + .36, this.colY(+name.slice(6)), COL.z);
    return new THREE.Vector3();
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { this.gpu.updateMatrixWorld(true); return this.ex.anchors().map(({ p, world }) => { const [x, y, z] = this.studio.project(world); return { label: p.label, side: p.side, u: p.u ?? 0, x, y, z }; }); }

  render(t) {
    const S = this.ST, st = this.studio; st.renderer.toneMappingExposure = S.exposure;
    const A = this.screens[S.scrA | 0], B = this.screens[S.scrB | 0];
    if (A && this.scrMatA.map !== A.tex) { this.scrMatA.map = A.tex; this.scrMatA.needsUpdate = true; }
    if (B && this.scrMatB.map !== B.tex) { this.scrMatB.map = B.tex; this.scrMatB.needsUpdate = true; }
    const mix = cl(S.scrMix), on = cl(S.scrOn); this.scrMatB.opacity = mix; this.scrMatA.color.setScalar(.82 * on); this.scrMatB.color.setScalar(.82 * on);
    const z = 1 + .06 * S.scrZoom; [this.scrMatA, this.scrMatB].forEach(m => { if (m.map) { m.map.repeat.set(1 / z, 1 / z); m.map.offset.set((1 - 1 / z) / 2, (1 - 1 / z) / 2); } });
    const col = (A ? A.avg.clone() : new THREE.Color('#888')).lerp(B ? B.avg : new THREE.Color('#888'), mix); const lum = .3 + col.r * .3 + col.g * .5 + col.b * .2;
    this.scrLight.color.copy(col).lerp(new THREE.Color('#FFFFFF'), .35); this.scrLight.intensity = 18 * on * lum; this.scrFill.color.copy(this.scrLight.color); this.scrFill.intensity = 2 * on * lum;
    // house lights: rims go green -> red in the scandal; everything dims for the silence
    const red = cl(S.red), H = S.house;
    this.rims.forEach(l => { l.color.set('#8CE04A').lerp(new THREE.Color('#FF3030'), red); l.intensity = 30 * S.rim * H; });
    this.ringMat.color.set('#76B900').lerp(new THREE.Color('#E02020'), red).multiplyScalar(Math.max(.05, H)); this.stripMat.color.set('#9FE870').lerp(new THREE.Color('#FF5050'), red); this.stripMat.opacity = .55 * H;
    this.redL.intensity = 14 * red * H; this.keyL.intensity = 34 * H; this.fill.intensity = 3 * H;
    // GPU: explode + a slow turn on its plinth
    this.ex.set(S.explode); this.gpu.rotation.y = S.spin; this.gpu.visible = S.chipOn > .01; this.gpuGlow.intensity = 3 * S.chipGlow;
    this.die.material.emissive = this.die.material.emissive || new THREE.Color(); this.die.material.emissive.set('#76B900'); this.die.material.emissiveIntensity = .5 * S.chipGlow;
    // market value column
    const v = Math.max(.02, S.cap), hgt = COL.h * v / COL.max; this.colFill.scale.y = hgt; this.colFill.position.y = .1 + hgt / 2; this.capTop.position.y = .1 + hgt + .01;
    this.fillMat.emissive.set('#76B900').lerp(new THREE.Color('#E02020'), red); this.col.visible = S.colOn > .01; this.colL.intensity = 2.5 * S.colOn * H; this.colL.position.y = .1 + hgt;
    const c = S.cam; st.camera.near = .05; st.camera.updateProjectionMatrix(); st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.render();
  }
}
