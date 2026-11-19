// anatomy3d.js - studio + exploded-view kit for "anatomy" shots (ES module, three r186 in vendor/three186).
//
//   import { Studio, Exploded, tex } from './lib/anatomy3d.js';
//   const st = new Studio(canvas, { bg: ['#EFE6D8', '#6A6157'] });
//   const ex = new Exploded();  ex.add(mesh, { off: [0, 12, 0], at: .2, label: 'Balance wheel', anchor: [4, 0, 0] });
//   ex.set(k)                       // 0 assembled ... 1 fully apart (each part eases in its own window)
//   st.render(); st.project(v3)     // -> [x, y] in the 1080x1920 frame, for 2D labels
//
// The look that reads as real 3D on a phone: a lit studio with falloff (not a flat colour), environment
// reflections, contact shadows + ambient occlusion (GTAO), a touch of bloom on highlights, shallow depth of
// field, and metal with micro texture (Côtes de Genève, perlage, sunburst).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };
const W = 1080, H = 1920;

// ---------------------------------------------------------------- procedural textures
function canvasTex(w, h, draw, srgb = false, rep = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; return t;
}
export const tex = {
  // radial studio backdrop
  backdrop: (c1, c2) => canvasTex(512, 910, (x, w, h) => { const g = x.createRadialGradient(w * .5, h * .38, 10, w * .5, h * .45, h * .75); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, w, h); }, true),
  // Côtes de Genève: parallel stripes, each a soft gradient (use as roughness + bump)
  cotes: (n = 9) => canvasTex(512, 512, (x, w, h) => { const sw = w / n; for (let i = 0; i < n; i++) { const g = x.createLinearGradient(i * sw, 0, (i + 1) * sw, 0); g.addColorStop(0, '#5a5a5a'); g.addColorStop(.5, '#d8d8d8'); g.addColorStop(1, '#5a5a5a'); x.fillStyle = g; x.fillRect(i * sw, 0, sw + 1, h); } }),
  // perlage: overlapping circular swirls
  perlage: () => canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#888'; x.fillRect(0, 0, w, h); const r = 22; for (let yy = -r; yy < h + r; yy += r * 1.2) for (let xx = -r; xx < w + r; xx += r * 1.2) { const g = x.createRadialGradient(xx, yy, 1, xx, yy, r); g.addColorStop(0, '#e6e6e6'); g.addColorStop(.6, '#9a9a9a'); g.addColorStop(1, '#6a6a6a'); x.fillStyle = g; x.beginPath(); x.arc(xx, yy, r, 0, Math.PI * 2); x.fill(); } }, false, 3),
  // sunburst: fine radial lines (for a dial's bump/roughness)
  sunburst: () => canvasTex(1024, 1024, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); x.translate(w / 2, h / 2); for (let i = 0; i < 720; i++) { x.rotate(Math.PI * 2 / 720); x.strokeStyle = i % 2 ? '#9a9a9a' : '#6a6a6a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * .72, 0); x.stroke(); } }),
  // floor contact falloff
  floorAlpha: () => canvasTex(512, 512, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, '#fff'); g.addColorStop(.55, '#bbb'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, h); }),
  // printed ring of minute marks / numerals on a dial
  dialPrint: (ink = '#F2EDE2', numerals = true) => canvasTex(1024, 1024, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.translate(w / 2, h / 2); x.fillStyle = ink; x.strokeStyle = ink;
    for (let i = 0; i < 60; i++) { x.save(); x.rotate(i * Math.PI / 30); x.fillRect(-1.5, -w * .47, 3, i % 5 ? 14 : 26); x.restore(); }
    if (numerals) { x.font = 'bold 38px FreeSans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; if (i % 3) continue; x.fillText(String(i * 5).padStart(2, '0'), Math.sin(a) * w * .405, -Math.cos(a) * w * .405); } }
  }, true),
};

// ---------------------------------------------------------------- studio
export class Studio {
  constructor(canvas, o = {}) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1); r.setSize(W, H, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = o.exposure ?? .85;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const s = this.scene = new THREE.Scene();
    this.bgTex = tex.backdrop(...(o.bg || ['#F1E8DA', '#625A50'])); s.background = this.bgTex;
    const pm = new THREE.PMREMGenerator(r); s.environment = pm.fromScene(new RoomEnvironment(), .04).texture; s.environmentIntensity = o.env ?? .9;
    this.camera = new THREE.PerspectiveCamera(o.fov ?? 28, W / H, .5, 2000);
    // lights: soft key with shadows, warm and cool rims, a moving glint light for sweeps across glass
    const key = this.key = new THREE.SpotLight('#FFFFFF', o.key ?? 2600, 0, .55, .65, 1.6); key.position.set(60, 140, 90); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0003; key.shadow.radius = 5; s.add(key, key.target);
    const rimW = new THREE.DirectionalLight('#FFD9A8', 1.4); rimW.position.set(-90, 40, -60); s.add(rimW);
    const rimC = new THREE.DirectionalLight('#BFD8FF', 1.1); rimC.position.set(90, 20, -80); s.add(rimC);
    s.add(new THREE.HemisphereLight('#FFF4E6', '#5A5048', .35));
    this.glint = new THREE.PointLight('#FFFFFF', 0, 120, 1.2); s.add(this.glint);
    const fl = this.floor = new THREE.Mesh(new THREE.CircleGeometry(220, 96), new THREE.MeshStandardMaterial({ color: o.floor || '#BDB2A3', roughness: .95, transparent: true, alphaMap: tex.floorAlpha() }));
    fl.rotation.x = -Math.PI / 2; fl.position.y = o.floorY ?? -14; fl.receiveShadow = true; s.add(fl);
    // post: AO for contact depth, bloom on hot highlights, shallow DOF
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    const c = this.composer = new EffectComposer(r, rt); c.setPixelRatio(1); c.setSize(W, H);
    c.addPass(new RenderPass(s, this.camera));
    if (o.ao !== false) { const ao = this.ao = new GTAOPass(s, this.camera, W, H); ao.output = GTAOPass.OUTPUT.Default; ao.blendIntensity = o.aoStrength ?? .9; ao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.4, thickness: 2, scale: 1, samples: 12 }); ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 }); c.addPass(ao); }
    if (o.dof !== false) { this.bokeh = new BokehPass(s, this.camera, { focus: 150, aperture: o.aperture ?? .00004, maxblur: .004 }); c.addPass(this.bokeh); }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), o.bloom ?? .07, .35, .95); c.addPass(this.bloom);
    c.addPass(new OutputPass());
    this.target = new THREE.Vector3();
  }
  look(px, py, pz, tx, ty, tz, fov) { const cm = this.camera; cm.position.set(px, py, pz); this.target.set(tx, ty, tz); cm.lookAt(this.target); if (fov) { cm.fov = fov; cm.updateProjectionMatrix(); } if (this.bokeh) this.bokeh.uniforms.focus.value = cm.position.distanceTo(this.target); }
  orbit(t, radius, height, speedDeg, phaseDeg, tx = 0, ty = 0, tz = 0, fov) { const a = (phaseDeg + speedDeg * t) * Math.PI / 180; this.look(tx + radius * Math.sin(a), ty + height, tz + radius * Math.cos(a), tx, ty, tz, fov); }
  project(v) { const p = v.clone().project(this.camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; }
  render() { this.composer.render(); }
}

// ---------------------------------------------------------------- exploded view
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
export class Exploded {
  constructor() { this.parts = []; }
  // off: where the part goes when apart; at: when it starts moving (0..1 of the explode); len: how long it takes
  add(obj, o = {}) { const p = { obj, base: obj.position.clone(), off: new THREE.Vector3(...(o.off || [0, 0, 0])), rot: o.rot || 0, at: o.at ?? 0, len: o.len ?? .5, label: o.label, ml: o.ml, anchor: new THREE.Vector3(...(o.anchor || [0, 0, 0])), side: o.side ?? 1, key: o.key }; this.parts.push(p); return p; }
  set(k) { this.parts.forEach(p => { const u = ease(Math.min(1, Math.max(0, (k - p.at) / p.len))); p.u = u; p.obj.position.copy(p.base).addScaledVector(p.off, u * (this.spread ?? 1)); if (p.rot) p.obj.rotation.y = p.rot * u; }); }
  anchors() { return this.parts.filter(p => p.label).map(p => ({ p, world: p.obj.localToWorld(p.anchor.clone()) })); }
}

// ---------------------------------------------------------------- geometry helpers shared by models
export function gearGeo(n, R, o = {}) {
  const TAU = Math.PI * 2, depth = o.depth ?? Math.max(.18, R * .09), tip = o.tip ?? .26, thick = o.thick ?? .5;
  const s = new THREE.Shape(), step = TAU / n, r0 = R - depth;
  for (let i = 0; i < n; i++) { const a = i * step; [[r0, a], [R, a + step * (.5 - tip) / 2 + step * .05], [R, a + step * (.5 + tip) / 2 - step * .05], [r0, a + step * .5]].forEach(([r, aa], k) => { const x = r * Math.cos(aa), y = r * Math.sin(aa); (i === 0 && k === 0) ? s.moveTo(x, y) : s.lineTo(x, y); }); s.lineTo(r0 * Math.cos(a + step), r0 * Math.sin(a + step)); }
  if (o.hole) { const h = new THREE.Path(); h.absarc(0, 0, o.hole, 0, TAU, true); s.holes.push(h); }
  if (o.spokes) { const rIn = r0 - R * .14, rHub = (o.hole || .3) + R * .22, k = o.spokes, w = .26 / Math.max(1, R * .4);
    for (let i = 0; i < k; i++) { const a1 = i * TAU / k + w + .12, a2 = (i + 1) * TAU / k - w - .12, h = new THREE.Path(); h.absarc(0, 0, rIn, a1, a2, false); h.lineTo(rHub * Math.cos(a2), rHub * Math.sin(a2)); h.absarc(0, 0, rHub, a2, a1, true); h.closePath(); s.holes.push(h); } }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 2, curveSegments: 12 }); g.rotateX(-Math.PI / 2); return g;
}
// a watch bridge: rounded hull around pivot circles, extruded with a bevel
export function bridgeGeo(circles, thick = .8, holes = []) {
  const pts = []; circles.forEach(([x, y, r]) => { for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } });
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1)); const s = new THREE.Shape(); hull.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  holes.forEach(([x, y, r]) => { const h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); s.holes.push(h); });
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: .12, bevelSize: .12, bevelSegments: 3, curveSegments: 16 });
  g.rotateX(-Math.PI / 2); g.computeBoundingBox(); const bb = g.boundingBox; const uv = g.attributes.uv; const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / 12, (pos.getZ(i) - bb.min.z) / 12);   // planar UVs so stripes run straight across
  return g;
}
export function spiralTube(rIn, rOut, turns, radius = .05, seg = 800) {
  const pts = []; for (let k = 0; k <= seg; k++) { const u = k / seg, a = u * turns * Math.PI * 2, r = rIn + (rOut - rIn) * u; pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a))); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, radius, 6, false);
}
export function ribbonSpiral(rIn, rOut, turns, h, seg = 900) {
  const pos = [], idx = []; for (let k = 0; k <= seg; k++) { const u = k / seg, a = u * turns * Math.PI * 2, r = rIn + (rOut - rIn) * Math.pow(u, .9), x = r * Math.cos(a), z = r * Math.sin(a); pos.push(x, 0, z, x, h, z); if (k < seg) { const i = k * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
