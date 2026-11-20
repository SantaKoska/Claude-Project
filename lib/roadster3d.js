// roadster3d.js - one bright test hangar, one car that flips on compressed air, built to come apart (ES module, three r186).
//
//   import { RoadsterWorld } from './lib/roadster3d.js';
//   const W = new RoadsterWorld(canvas);  W.ST.pose = 1; W.ST.rampU = .7;  W.render(t);  W.screen('tank') -> [x, y]
//
// Units are metres; the car faces +x, the floor is y = 0. The car is our own low two-seat coupe (no Tesla styling or
// badge). Its insides follow what Tesla said at the October 2026 unveiling: suction fans in the floor, carbon-fibre
// tanks of compressed air behind the seats, ten cold-gas thrusters around the body. Inner parts of the tank and the
// thrusters are a generic composite pressure vessel and a generic solenoid cold-gas valve (illustrative).
import * as THREE from 'three';
import { Studio, Exploded } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}
const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const noise = new SimplexNoise({ random: rnd });

// ---------------------------------------------------------------- lofted shells (superellipse sections along x)
// prof(s) -> { w, yb, yt, n, nb, hb } for s in [0, L]; ring angle 0 = +z side, PI/2 = top, PI = -z side, 3PI/2 = floor
function loft(L, prof, steps, ring = 96, caps = true) {
  const pos = [], uv = [], idx = [];
  const sp = (c, n) => Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, s = L * u, p = prof(s), hb = Math.min(p.hb ?? .3, (p.yt - p.yb) * .4), yc = p.yb + hb, ht = p.yt - yc;
    for (let j = 0; j <= ring; j++) {
      const th = j / ring * TAU, c = Math.cos(th), si = Math.sin(th), top = si >= 0;
      pos.push(s, yc + (top ? ht : hb) * sp(si, top ? p.n : (p.nb ?? 4)), (top ? p.w : (p.wb ?? p.w)) * sp(c, top ? p.n : (p.nb ?? 4))); uv.push(u, j / ring);
    }
  }
  const R = ring + 1;
  for (let i = 0; i < steps; i++) for (let j = 0; j < ring; j++) { const a = i * R + j, b = a + R; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  if (caps) [[0, true], [steps, false]].forEach(([i, flip]) => { const p = prof(L * i / steps), hb = Math.min(p.hb ?? .3, (p.yt - p.yb) * .4); const c0 = pos.length / 3; pos.push(L * i / steps, p.yb + hb, 0); uv.push(i / steps, .75); for (let j = 0; j < ring; j++) { const a = i * R + j; flip ? idx.push(c0, a, a + 1) : idx.push(c0, a + 1, a); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// piecewise-smooth profile from keyframes [[s, w, yb, yt], ...]
const keyed = (keys, n = 3.2, nb = 4.5, hb = .3) => s => {
  let i = 0; while (i < keys.length - 2 && s > keys[i + 1][0]) i++;
  const [s0, ...a] = keys[i], [s1, ...b] = keys[i + 1], u = sm(cl((s - s0) / (s1 - s0)));
  return { w: lerp(a[0], b[0], u), yb: lerp(a[1], b[1], u), yt: lerp(a[2], b[2], u), n, nb, hb };
};

// 2x2 twill carbon weave (idea from the MIT airsup-lab), as colour + a bump-like roughness map
function carbonTex(rep = 6, light = false) {
  return ctex(256, 256, (g, w, h) => { const cell = 16; for (let i = 0; i < w / cell; i++) for (let j = 0; j < h / cell; j++) { const horiz = ((i + j) >> 1) % 2 === 0; const gr = horiz ? g.createLinearGradient(0, j * cell, 0, (j + 1) * cell) : g.createLinearGradient(i * cell, 0, (i + 1) * cell, 0); gr.addColorStop(0, light ? '#202327' : '#0b0c0e'); gr.addColorStop(.5, horiz ? (light ? '#4a4f56' : '#2b2e33') : (light ? '#3a3e44' : '#1f2226')); gr.addColorStop(1, light ? '#202327' : '#0b0c0e'); g.fillStyle = gr; g.fillRect(i * cell, j * cell, cell, cell); } }, true, rep, rep);
}
// carbon hoop wrap: fine bands running around the tank
const hoopTex = () => ctex(64, 512, (g, w, h) => { for (let y = 0; y < h; y += 8) { const gr = g.createLinearGradient(0, y, 0, y + 8); gr.addColorStop(0, '#0c0d0f'); gr.addColorStop(.5, '#34383e'); gr.addColorStop(1, '#0c0d0f'); g.fillStyle = gr; g.fillRect(0, y, w, 8); } }, true, 1, 3);

// fresnel x-ray shell (the teardown skill's "ghost")
const ghostMat = (col = '#8FC4FF') => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0-abs(dot(normalize(vN),normalize(vV))),0.0,1.0),2.0); gl_FragColor = vec4(uCol, uA*(0.05+0.8*f)); }' });

// cold-gas jet: a mist cone, dense at the nozzle, flowing outward, with soft edges
const jetMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uT: { value: 0 } },
  vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: `uniform float uA; uniform float uT; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){ float along = vUv.y; float face = abs(dot(normalize(vN), normalize(vV)));
      float n = n2(vec2(vUv.x*14.0, along*6.0 - uT*9.0))*0.6 + n2(vec2(vUv.x*31.0, along*13.0 - uT*15.0))*0.4;
      float a = 1.6 * uA * pow(1.0-along, 1.0) * (0.35 + 0.65*n) * smoothstep(0.0, 0.6, face) * smoothstep(0.0, 0.04, along);
      gl_FragColor = vec4(mix(vec3(0.5,0.84,1.0), vec3(0.12,0.52,0.86), clamp(along*0.8 + (1.0-face)*0.6, 0.0, 1.0)), min(a, 0.85)); }` });

// flowing streamline tubes (suction air)
const flowTex = () => ctex(256, 8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(79,216,255,0)'); gr.addColorStop(.55, 'rgba(79,216,255,.25)'); gr.addColorStop(.9, 'rgba(200,245,255,1)'); gr.addColorStop(1, 'rgba(79,216,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true, 3, 1);

function tyreGeo(R, wd) { const r0 = R * .64, prof = [[r0, -wd / 2], [R - .05, -wd / 2], [R - .012, -wd / 2 + .025], [R, -wd / 2 + .07], [R, wd / 2 - .07], [R - .012, wd / 2 - .025], [R - .05, wd / 2], [r0, wd / 2]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(prof, 64); }
function rimGeo(R, spokes = 5) { // aero disc with spoke cut-outs, in the xy plane
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, TAU, false);
  for (let i = 0; i < spokes; i++) { const a0 = i / spokes * TAU + .32, a1 = (i + 1) / spokes * TAU - .32, h = new THREE.Path(); h.absarc(0, 0, R * .86, a0, a1, false); h.absarc(0, 0, R * .36, a1 - .1, a0 + .1, true); h.closePath(); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: .04, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 2, curveSegments: 32 }); g.translate(0, 0, -.02); return g;
}
function arrowGeo(len = .9, r = .05) { const a = new THREE.CylinderGeometry(r, r, len * .7, 16); a.translate(0, len * .35, 0); const b = new THREE.ConeGeometry(r * 2.6, len * .3, 24); b.translate(0, len * .85, 0); return mergeGeometries([a, b]); }
const helix = (r, y0, y1, turns, tube) => { const pts = []; for (let k = 0; k <= 160; k++) { const u = k / 160, a = u * turns * TAU; pts.push(new THREE.Vector3(r * Math.cos(a), lerp(y0, y1, u), r * Math.sin(a))); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, tube, 8, false); };
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ten thrusters, car-local: position of the nozzle exit and the direction the jet leaves in (Tesla said ten; the layout is ours)
const THRUSTERS = [
  [[2.02, .46, .74], [1, 0, 1]], [[2.02, .46, -.74], [1, 0, -1]], [[-2.08, .55, .74], [-1, 0, 1]], [[-2.08, .55, -.74], [-1, 0, -1]],
  [[.95, .5, .95], [0, 0, 1]], [[-.95, .56, .97], [0, 0, 1]], [[.95, .5, -.95], [0, 0, -1]], [[-.95, .56, -.97], [0, 0, -1]],
  [[1.25, .12, 0], [0, -1, 0]], [[-1.3, .12, 0], [0, -1, 0]],
].map(([p, d], i) => { const dv = new THREE.Vector3(...d).normalize(); return { p: new THREE.Vector3(...p).addScaledVector(dv, [.13, .13, .16, .16, .06, .05, .06, .05, 0, 0][i]), d: dv }; });   // nozzles sit on the body surface

export class RoadsterWorld {
  constructor(canvas) {
    const st = this.studio = new Studio(canvas, { bg: ['#F2F4F6', '#39414A'], floorY: 0, fov: 30, exposure: .95, aperture: .00003, bloom: .06, floor: '#A7AEB4' });
    const s = this.scene = st.scene; st.renderer.localClippingEnabled = true;
    st.key.position.set(10, 22, 14); st.key.angle = .8; st.key.distance = 0; st.key.intensity = 150; st.key.decay = 1.6; st.key.penumbra = .75;
    st.key.shadow.camera.near = 4; st.key.shadow.camera.far = 80; st.key.shadow.bias = -.0004; st.key.shadow.normalBias = .02;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .5, distanceExponent: 1.4, thickness: .7, scale: 1, samples: 12 });
    st.glint.distance = 20; st.glint.decay = 1.3;
    st.floor.geometry = new THREE.CircleGeometry(90, 96); st.floor.material.roughness = .62; st.floor.material.metalness = .05;
    // polished concrete: soft mottling + saw cuts every 4 m
    st.floor.material.map = ctex(1024, 1024, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; let v = 214 + 8 * noise.noise(xx / 120, yy / 120) + 4 * noise.noise(xx / 18, yy / 18) + 4 * (rnd() - .5); if (xx % 256 < 2 || yy % 256 < 2) v -= 26; img.data.set([v, v, v * 1.01, 255], i * 4); } x.putImageData(img, 0, 0); }, true, 22, 22);
    this.M = {
      paint: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: .35, roughness: .3, clearcoat: 1, clearcoatRoughness: .035, envMapIntensity: 1.25 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0A1016', metalness: .3, roughness: .06, clearcoat: 1, envMapIntensity: 1.6 }),
      black: new THREE.MeshStandardMaterial({ color: '#15171A', roughness: .5, metalness: .2 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#17181A', roughness: .88 }),
      rim: new THREE.MeshStandardMaterial({ color: '#8A9198', roughness: .22, metalness: 1 }),
      alu: new THREE.MeshStandardMaterial({ color: '#C9CED4', roughness: .26, metalness: 1 }),
      steel: new THREE.MeshStandardMaterial({ color: '#AEB4BA', roughness: .2, metalness: 1 }),
      darkSteel: new THREE.MeshStandardMaterial({ color: '#5E646B', roughness: .3, metalness: 1 }),
      copper: new THREE.MeshStandardMaterial({ color: '#C8743F', roughness: .3, metalness: 1, emissive: '#000000' }),
      carbon: new THREE.MeshPhysicalMaterial({ map: carbonTex(8), roughness: .38, metalness: .2, clearcoat: 1, clearcoatRoughness: .08 }),
      carbonTank: new THREE.MeshPhysicalMaterial({ map: carbonTex(10, true), roughness: .35, metalness: .25, clearcoat: 1, clearcoatRoughness: .06 }),
      hoop: new THREE.MeshPhysicalMaterial({ map: hoopTex(), roughness: .35, metalness: .25, clearcoat: 1, clearcoatRoughness: .06 }),
      leather: new THREE.MeshStandardMaterial({ color: '#1C1E21', roughness: .62 }),
      clay: new THREE.MeshPhysicalMaterial({ color: '#59606A', roughness: .66, metalness: 0, clearcoat: .2, clearcoatRoughness: .4 }),
      ramp: new THREE.MeshStandardMaterial({ color: '#8D949B', roughness: .8 }),
      rail: new THREE.MeshStandardMaterial({ color: '#F2F2F0', roughness: .4 }),
      frame: new THREE.MeshStandardMaterial({ color: '#2E3338', roughness: .45, metalness: .7 }),
      line: new THREE.MeshStandardMaterial({ color: '#9AA1A8', roughness: .35, metalness: .9 }),
      lampW: new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#F4F8FF', emissiveIntensity: 1.3 }),
      lampR: new THREE.MeshStandardMaterial({ color: '#FF2A2A', emissive: '#FF1A1A', emissiveIntensity: .9 }),
      plinth: new THREE.MeshPhysicalMaterial({ color: '#1A1C1F', roughness: .25, metalness: .2, clearcoat: 1 }),
      arrow: new THREE.MeshStandardMaterial({ color: '#4FD8FF', emissive: '#1C9FD0', emissiveIntensity: .8, transparent: true }),
      glow: new THREE.MeshBasicMaterial({ color: '#7FE6FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    };
    this.buildCar(); this.buildRamp(); this.buildVehicles(); this.buildHeroTank();
    this.ST = { cam: { px: 7, py: 2, pz: 8, tx: 0, ty: .6, tz: 0, fov: 30, roll: 0 }, aperture: .00003, exposure: .95, sweep: 0,
      pose: 0, padX: 0, padZ: 0, padYaw: 0, rampU: 0, flightU: 0, carLift: 0, roll: 0,
      ghost: 0, bodyLift: 0, explode: 0, fans: 0, flow: 0, force: 0, jets: 0, jetMask: 0, jetLen: 1, num: 0,
      tExplode: 0, thrOut: 0, poppet: 0, frost: 0, push: 0, tankCut: 0, tankExplode: 0, tankVis: 1, glowT: 0, wheelSpin: 0 };
  }

  // ------------------------------------------------------------ the car
  buildCar() {
    const M = this.M, car = this.car = new THREE.Group(); this.scene.add(car);
    const L = 4.4, X0 = -L / 2;
    // livery: deep red clearcoat, black sills, a thin dark shut line where the doors are (our own design)
    const liv = ctex(2048, 1024, (x, w, h) => {
      x.fillStyle = '#A50F18'; x.fillRect(0, 0, w, h);
      // canvas y = (1 - v) * h; v .25 is the roof, .75 the floor: black from the lower sides around the floor
      const g = x.createLinearGradient(0, h * .1, 0, h * .47); g.addColorStop(0, '#121417'); g.addColorStop(.86, '#121417'); g.addColorStop(1, '#A50F18'); x.fillStyle = g; x.fillRect(0, h * .1, w, h * .37);
      x.strokeStyle = 'rgba(20,0,0,.55)'; x.lineWidth = 3; [[.47, .66]].forEach(([a, b]) => [[0, .5], [.5, 1]].forEach(([v0, v1]) => { x.beginPath(); x.moveTo(a * w, v0 * h); x.lineTo(a * w, v1 * h); x.stroke(); x.beginPath(); x.moveTo(b * w, v0 * h); x.lineTo(b * w, v1 * h); x.stroke(); }));
    });
    const bodyProf = keyed([[0, .84, .24, .86], [.25, .93, .2, .92], [.9, .99, .17, .9], [1.6, .98, .17, .84], [2.4, .95, .17, .8], [3.2, .96, .17, .82], [3.6, .96, .17, .82], [4.1, .9, .2, .66], [4.4, .6, .26, .46]], 3.6, 4.5);
    const bodyGeo = loft(L, bodyProf, 120, 112); bodyGeo.translate(X0, 0, 0);
    const cabProf = keyed([[0, .5, .74, .9], [.45, .6, .74, 1.07], [.95, .64, .74, 1.13], [1.45, .63, .74, 1.08], [2.25, .55, .74, .8]], 2.4, 3, .06);
    const cabGeo = loft(2.25, cabProf, 60, 96); cabGeo.translate(X0 + 1.05, 0, 0);
    const cabTex = ctex(1024, 512, (x, w, h) => { x.fillStyle = '#0B1117'; x.fillRect(0, 0, w, h); const g = x.createLinearGradient(0, h * .64, 0, h * .86); g.addColorStop(0, '#0B1117'); g.addColorStop(.16, '#A50F18'); g.addColorStop(.84, '#A50F18'); g.addColorStop(1, '#0B1117'); x.fillStyle = g; x.fillRect(0, h * .64, w * .74, h * .22); });
    // wheel arches: the paint shader drops fragments inside each arch (object space) and an arch liner closes the hole
    const arches = `vec2 ac[4]; ac[0]=vec2(1.38,.36); ac[1]=vec2(-1.36,.36);`;
    const addArch = m => { m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('void main() {', 'void main() {\n if (abs(vObj.z) > .5 && (length(vObj.xy - vec2(1.38,.36)) < .42 || length(vObj.xy - vec2(-1.36,.36)) < .42)) discard;'); }; m.customProgramCacheKey = () => 'arch'; };
    this.bodyMat = M.paint.clone(); this.bodyMat.map = liv; addArch(this.bodyMat);
    this.cabMat = M.glass.clone(); this.cabMat.map = cabTex; this.cabMat.color.set('#FFFFFF'); this.cabMat.roughness = .1;
    const shell = this.shell = new THREE.Group(); car.add(shell);
    const body = new THREE.Mesh(bodyGeo, this.bodyMat), cab = new THREE.Mesh(cabGeo, this.cabMat); body.castShadow = cab.castShadow = true; body.receiveShadow = true; shell.add(body, cab);
    this.ghostBody = new THREE.Mesh(bodyGeo, ghostMat()); this.ghostCab = new THREE.Mesh(cabGeo, ghostMat()); shell.add(this.ghostBody, this.ghostCab);
    // arch liners, lamps, mirrors-free clean sides
    [[1.38, 1], [1.38, -1], [-1.36, 1], [-1.36, -1]].forEach(([x, sz]) => { const lg = new THREE.CylinderGeometry(.42, .42, .36, 40, 1, true, Math.PI / 2, Math.PI); lg.rotateX(Math.PI / 2); const li = new THREE.Mesh(lg, M.black); li.position.set(x, .36, sz * .62); li.material = new THREE.MeshStandardMaterial({ color: '#0A0B0C', roughness: .95, side: THREE.DoubleSide }); shell.add(li); });
    const hl = new RoundedBoxGeometry(.34, .03, .07, 2, .012); [1, -1].forEach(sz => { const m = new THREE.Mesh(hl, M.lampW); m.position.set(1.95, .62, sz * .58); m.rotation.set(0, sz * .5, -.42); shell.add(m); });
    const tlb = new THREE.Mesh(new RoundedBoxGeometry(.04, .035, 1.5, 2, .015), M.lampR); tlb.position.set(X0 + .03, .8, 0); shell.add(tlb);
    // wheels
    this.wheels = [];
    const tg = tyreGeo(.36, .29), rg = rimGeo(.235); rg.rotateY(0);
    [[1.38, .8], [1.38, -.8], [-1.36, .82], [-1.36, -.82]].forEach(([x, z]) => { const wg = new THREE.Group(); const ty = new THREE.Mesh(tg, M.rubber); ty.rotation.x = Math.PI / 2; const rm = new THREE.Mesh(rg, M.rim); rm.position.z = Math.sign(z) * .1; const disc = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .03, 32), M.darkSteel); disc.rotation.x = Math.PI / 2; ty.castShadow = rm.castShadow = true; wg.add(ty, rm, disc); wg.position.set(x, .36, z); car.add(wg); this.wheels.push(wg); });
    // ---- insides
    const inner = this.inner = new THREE.Group(); car.add(inner);
    const tub = new THREE.Mesh(new RoundedBoxGeometry(3.9, .09, 1.66, 3, .04), M.carbon); tub.position.set(.05, .24, 0); tub.receiveShadow = tub.castShadow = true; inner.add(tub);
    this.seats = new THREE.Group(); inner.add(this.seats);
    [.38, -.38].forEach(z => { const c = new THREE.Mesh(new RoundedBoxGeometry(.5, .12, .44, 3, .05), M.leather); c.position.set(.02, .35, z); const b = new THREE.Mesh(new RoundedBoxGeometry(.12, .6, .44, 3, .05), M.leather); b.position.set(-.26, .64, z); b.rotation.z = .22; const bol = new THREE.Mesh(new RoundedBoxGeometry(.5, .07, .06, 2, .03), M.leather); [.2, -.2].forEach(dz => { const q = bol.clone(); q.position.set(.02, .44, z + dz); this.seats.add(q); }); c.castShadow = b.castShadow = true; this.seats.add(c, b); });
    const sw = new THREE.Mesh(new THREE.TorusGeometry(.16, .02, 10, 40), M.black); sw.position.set(.52, .72, .38); sw.rotation.set(0, Math.PI / 2, .35); this.seats.add(sw);
    // two carbon-fibre air tanks behind the seats, lying across the car
    this.tanks = new THREE.Group(); inner.add(this.tanks);
    const tankGeo = (r, lc) => { const g = lathe([[0, -lc / 2 - r], ...Array.from({ length: 13 }, (_, k) => { const a = -Math.PI / 2 + k / 12 * Math.PI / 2; return [r * Math.cos(a), -lc / 2 + r * Math.sin(a)]; }), ...Array.from({ length: 13 }, (_, k) => { const a = k / 12 * Math.PI / 2; return [r * Math.cos(a), lc / 2 + r * Math.sin(a)]; }), [0, lc / 2 + r]], 64); return g; };
    this.tankGeo = tankGeo;
    [-.62, -1.12].forEach((x, i) => { const tk = new THREE.Group(); const m = new THREE.Mesh(tankGeo(.23, 1.0), M.carbonTank); m.rotation.x = Math.PI / 2; m.castShadow = true; tk.add(m); [-1, 1].forEach(sz => { const boss = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .07, 24), M.alu); boss.rotation.x = Math.PI / 2; boss.position.z = sz * .74; tk.add(boss); }); tk.position.set(x, .52, 0); this.tanks.add(tk); });
    const man = new THREE.Mesh(new RoundedBoxGeometry(.62, .08, .1, 2, .02), M.alu); man.position.set(-.87, .52, .8); this.tanks.add(man);
    // thrusters: a generic solenoid cold-gas valve and nozzle (illustrative); the first one (front-left) is the hero that comes apart
    this.thr = []; this.jets = [];
    const nozG = lathe([[.016, -.07], [.022, -.06], [.012, -.045], [.02, -.02], [.036, 0], [.042, 0], [.042, -.012], [.03, -.04], [.03, -.07]], 40);
    const seatG = lathe([[.012, 0], [.03, 0], [.03, .012], [.012, .012]], 32);
    const popG = mergeGeometries([new THREE.CylinderGeometry(.004, .004, .06, 12).translate(0, -.03, 0), new THREE.ConeGeometry(.014, .016, 24).rotateX(Math.PI).translate(0, .008, 0), new THREE.CylinderGeometry(.014, .014, .01, 24).translate(0, -.004, 0)]);
    const sprG = helix(.011, -.06, -.012, 7, .0022);
    const coilG = lathe([[.016, -.07], [.04, -.07], [.04, 0], [.016, 0]], 40);
    const houG = lathe([[.035, 0], [.05, 0], [.052, -.01], [.052, -.15], [.05, -.16], [.02, -.16], [.02, -.15]], 48);
    const inG = mergeGeometries([new THREE.CylinderGeometry(.014, .014, .05, 16).translate(0, -.025, 0), new THREE.CylinderGeometry(.02, .02, .012, 6).translate(0, -.01, 0)]);
    const up = new THREE.Vector3(0, 1, 0);
    this.cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
    THRUSTERS.forEach(({ p, d }, i) => {
      const g = new THREE.Group(); g.position.copy(p); g.quaternion.setFromUnitVectors(up, d); inner.add(g);
      const hero = i === 0, hm = hero ? M.alu.clone() : M.alu; if (hero) { hm.clippingPlanes = [this.cutPlane]; hm.side = THREE.DoubleSide; }
      const parts = {
        noz: new THREE.Mesh(nozG, hero ? M.steel.clone() : M.steel), seat: new THREE.Mesh(seatG, M.darkSteel), pop: new THREE.Mesh(popG, M.steel), spr: new THREE.Mesh(sprG, M.steel),
        coil: new THREE.Mesh(coilG, M.copper), hou: new THREE.Mesh(houG, hm), inl: new THREE.Mesh(inG, M.alu) };
      parts.seat.position.y = -.082; parts.pop.position.y = -.095; parts.spr.position.y = -.098; parts.coil.position.y = -.09; parts.hou.position.y = -.05; parts.inl.position.y = -.21;
      Object.values(parts).forEach(m => { m.castShadow = true; g.add(m); });
      const base = {}; for (const k in parts) base[k] = parts[k].position.y;
      // jet: a mist cone along +local y from the nozzle exit
      const jg = new THREE.CylinderGeometry(.2, .028, 1.6, 40, 8, true); jg.translate(0, .8, 0); const uv = jg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, 1 - uv.getY(k));
      const jet = new THREE.Mesh(jg, jetMat()); jet.renderOrder = 5; g.add(jet);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.046, .006, 8, 40), M.glow.clone()); ring.rotation.x = Math.PI / 2; ring.position.y = .002; g.add(ring);
      this.thr.push({ g, parts, base, p, d, jet, ring }); this.jets.push(jet);
    });
    // braided air lines from the manifold to every thruster inlet
    this.lines = new THREE.Group(); inner.add(this.lines);
    this.thr.forEach(({ p, d }, i) => { const inlet = p.clone().addScaledVector(d, -.26); const a = new THREE.Vector3(-.87 + (i % 5 - 2) * .1, .52, .8); const mid = new THREE.Vector3(lerp(a.x, inlet.x, .5), .3, cl(lerp(a.z, inlet.z, .5), -.7, .7));
      const tg2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x, .34, a.z * .9), mid, inlet.clone().setY(Math.max(.3, inlet.y)), inlet]), 64, .011, 8, false); this.lines.add(new THREE.Mesh(tg2, M.line)); });
    // two suction fans in the floor (ducted, nine blades)
    this.fans = []; const bladeG = (() => { const s = new THREE.Shape(); s.moveTo(.05, -.018); s.quadraticCurveTo(.2, -.05, .27, -.02); s.lineTo(.27, .03); s.quadraticCurveTo(.18, .02, .05, .018); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: .008, bevelEnabled: false }); g.rotateX(-Math.PI / 2 + .35); return g; })();
    [[.95, 0], [-.35, 0]].forEach(([x, z]) => { const f = new THREE.Group(); f.position.set(x, .16, z); inner.add(f);
      const duct = new THREE.Mesh(lathe([[.3, -.07], [.315, -.07], [.315, .07], [.3, .07], [.29, 0]], 64), M.frame); duct.material = M.frame.clone(); duct.material.side = THREE.DoubleSide; f.add(duct);
      const rotor = new THREE.Group(); f.add(rotor); for (let k = 0; k < 9; k++) { const b = new THREE.Mesh(bladeG, M.darkSteel); b.rotation.y = k / 9 * TAU; rotor.add(b); }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .09, 24), M.alu); rotor.add(hub);
      const grill = new THREE.Mesh(new THREE.RingGeometry(.06, .3, 48, 1), M.black.clone()); grill.material.side = THREE.DoubleSide; grill.material.transparent = true; grill.material.opacity = .25; grill.rotation.x = -Math.PI / 2; grill.position.y = -.075; f.add(grill);
      this.fans.push({ f, rotor }); });
    // suction streamlines: air pulled in from under the edges of the floor, up through the fans and out the back
    this.flowT = flowTex(); const flowM = new THREE.MeshBasicMaterial({ map: this.flowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); this.flowM = flowM;
    const fl = []; this.fans.forEach(({ f }) => { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .2, cx = f.position.x; const p0 = new THREE.Vector3(cx + Math.cos(a) * 1.0, .04, Math.sin(a) * .95), p1 = new THREE.Vector3(cx + Math.cos(a) * .45, .05, Math.sin(a) * .42), p2 = new THREE.Vector3(cx + Math.cos(a) * .12, .14, Math.sin(a) * .12), p3 = new THREE.Vector3(cx - .1, .42, Math.sin(a) * .2), p4 = new THREE.Vector3(cx - .6, .5, Math.sin(a) * .35); fl.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]), 48, .012, 6, false)); } });
    this.flowMesh = new THREE.Mesh(mergeGeometries(fl), flowM); this.flowMesh.renderOrder = 6; inner.add(this.flowMesh);
    // force arrows: the car is pressed onto the track
    this.forceArrows = []; [[1.1, .3], [-.2, -.3], [-1.3, .25]].forEach(([x, z]) => { const a = new THREE.Mesh(arrowGeo(.8, .045), M.arrow); a.rotation.z = Math.PI; a.position.set(x, 2.1, z); car.add(a); this.forceArrows.push(a); });
    // push arrow (the car moves opposite to the jet)
    this.pushArrow = new THREE.Mesh(arrowGeo(1.2, .06), M.arrow.clone()); this.scene.add(this.pushArrow);
    // exploded view
    const ex = this.ex = new Exploded();
    this.exTanks = ex.add(this.tanks, { off: [0, 1.25, 0], at: .15, len: .5, label: 'Carbon air tanks', anchor: [-.62, .25, -.5], side: -1 });
    this.exSeats = ex.add(this.seats, { off: [0, .55, 0], at: .1, len: .5 });
    this.exLines = ex.add(this.lines, { off: [0, .3, 0], at: .2, len: .5, label: 'Air lines', anchor: [-.4, .3, .55], side: 1 });
    this.fans.forEach((f, i) => ex.add(f.f, { off: [0, -.55, 0], at: .25, len: .5, label: i === 0 ? 'Suction fans' : undefined, anchor: [.3, 0, 0], side: 1 }));
    this.thr.forEach((t, i) => ex.add(t.g, { off: t.d.toArray().map(v => v * .55), at: .3, len: .5, label: i === 0 ? 'Thrusters ×10' : undefined, anchor: [0, 0, 0], side: 1 }));
    this.wheels.forEach(w => ex.add(w, { off: [0, 0, Math.sign(w.position.z) * .45], at: .05, len: .45 }));
    ex.add(tub, { off: [0, 0, 0], label: 'Carbon tub', anchor: [-1.7, 0, .7], side: -1 });
    // hero thruster parts come apart along its axis
    this.thrEx = { noz: .16, seat: .1, pop: .05, spr: -.01, coil: -.08, hou: -.17, inl: -.27 };
  }

  // ------------------------------------------------------------ the loop ramp (straight run-in, a half loop, then a ceiling run)
  buildRamp() {
    const g = this.rampG = new THREE.Group(); this.scene.add(g);
    const R = this.rR = 3.3, X1 = this.rX1 = 9, RUN = 3, CEIL = 4.5; this.rLen = [RUN, Math.PI * R, CEIL]; this.rTot = RUN + Math.PI * R + CEIL;
    const N = 160, W2 = 1.45, TH = .28; const pos = [], idx = [], uv = [];
    const at = u => this.rampAt(u);
    const top = [], bot = [];
    for (let i = 0; i <= N; i++) { const u = i / N, { p, n } = at(u); top.push(p.clone().addScaledVector(n, .0)); bot.push(p.clone().addScaledVector(n, -TH)); }
    const quad = (a, b, c, d, v0, v1) => { const k = pos.length / 3; pos.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...d.toArray()); uv.push(0, v0, 1, v0, 0, v1, 1, v1); idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); };
    const z = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < N; i++) { const v0 = i / N * this.rTot / 2, v1 = (i + 1) / N * this.rTot / 2; const T0 = top[i], T1 = top[i + 1], B0 = bot[i], B1 = bot[i + 1];
      const L = (p, s) => p.clone().addScaledVector(z, s * W2);
      quad(L(T0, 1), L(T0, -1), L(T1, 1), L(T1, -1), v0, v1); quad(L(B0, -1), L(B0, 1), L(B1, -1), L(B1, 1), v0, v1); quad(L(T0, -1), L(B0, -1), L(T1, -1), L(B1, -1), v0, v1); quad(L(B0, 1), L(T0, 1), L(B1, 1), L(T1, 1), v0, v1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const rm = this.M.ramp.clone(); rm.side = THREE.DoubleSide;
    rm.map = ctex(512, 512, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const xx = i % w, yy = (i / w) | 0; let v = 120 + 10 * noise.noise(xx / 40, yy / 40) + 9 * (rnd() - .5); img.data.set([v, v, v * 1.03, 255], i * 4); } x.putImageData(img, 0, 0);
      // edge safety stripes and a centre dash
      for (let y = 0; y < h; y += 64) { x.fillStyle = '#E8B818'; x.fillRect(0, y, 18, 32); x.fillRect(w - 18, y, 18, 32); x.fillStyle = '#121212'; x.fillRect(0, y + 32, 18, 32); x.fillRect(w - 18, y + 32, 18, 32); }
      x.fillStyle = 'rgba(240,240,236,.85)'; for (let y = 0; y < h; y += 128) x.fillRect(w / 2 - 4, y, 8, 64); }, true, 1, 1);
    const mesh = new THREE.Mesh(geo, rm); mesh.receiveShadow = mesh.castShadow = true; g.add(mesh);
    // steel frame on the far side only, so the camera always has a clean view from +z
    const col = (x, y0, y1) => { const m = new THREE.Mesh(new RoundedBoxGeometry(.32, y1 - y0, .32, 2, .04), this.M.frame); m.position.set(x, (y0 + y1) / 2, -2.1); m.castShadow = true; g.add(m); return m; };
    const H = 2 * R; [X1 - 3.4, X1 - .6, X1 + 2.0, X1 + R + .6].forEach(x => col(x, 0, H + .9));
    const beam = (x0, x1, y) => { const m = new THREE.Mesh(new RoundedBoxGeometry(x1 - x0, .28, .28, 2, .04), this.M.frame); m.position.set((x0 + x1) / 2, y, -2.1); g.add(m); };
    beam(X1 - 3.6, X1 + R + .8, H + .8); beam(X1 - 3.6, X1 + R + .8, 2.2);
    // cross arms over the ceiling run and the loop, holding the track from behind
    for (const x of [X1 - 3.4, X1 - 1.8, X1 - .6, X1 + 1, X1 + 2.0]) { const m = new THREE.Mesh(new RoundedBoxGeometry(.2, .2, 2.1, 2, .03), this.M.frame); m.position.set(x, x < X1 + .1 ? H + .65 : H + .65, -1.05); g.add(m); const h = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .62, 8), this.M.steel); h.position.set(x, H + .45, -.6); g.add(h); }
    for (const a of [.25, .55, .85]) { const ang = -Math.PI / 2 + a * Math.PI, px = X1 + R * Math.cos(ang) + (R + .55) * Math.cos(ang) / R * 0, py = R + R * Math.sin(ang); const arm = new THREE.Mesh(new RoundedBoxGeometry(.2, .2, 2.0, 2, .03), this.M.frame); arm.position.set(X1 + (R + .45) * Math.cos(ang), R + (R + .45) * Math.sin(ang), -1.05); g.add(arm); }
  }
  // point on the ramp at u (0..1): surface position, inward normal (the car's up), heading angle about z
  rampAt(u) {
    const R = this.rR, X1 = this.rX1, [a, b, c] = this.rLen, s = u * this.rTot;
    if (s <= a) return { p: new THREE.Vector3(X1 - a + s, .02, 0), n: new THREE.Vector3(0, 1, 0), th: 0 };
    if (s <= a + b) { const ang = -Math.PI / 2 + (s - a) / R, p = new THREE.Vector3(X1 + R * Math.cos(ang), R + R * Math.sin(ang), 0); return { p, n: new THREE.Vector3(-Math.cos(ang), -Math.sin(ang), 0), th: ang + Math.PI / 2 }; }
    return { p: new THREE.Vector3(X1 - (s - a - b), 2 * R, 0), n: new THREE.Vector3(0, -1, 0), th: Math.PI };
  }

  // ------------------------------------------------------------ five clay vehicles in a row (studio models, not copies of any design)
  buildVehicles() {
    const M = this.M, g = this.vehG = new THREE.Group(); this.scene.add(g);
    this.LANE_Z = 9; this.vehX = [-15.5, -12.5, -9.3, -6.1, -3.2];
    const wheel = (r, w) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 32), M.rubber); m.rotation.x = Math.PI / 2; return m; };
    const make = (L, prof, wb, r, track, extra) => { const v = new THREE.Group(); const b = new THREE.Mesh(loft(L, prof, 60, 64), M.clay); b.position.x = -L / 2; b.castShadow = b.receiveShadow = true; v.add(b);
      wb.forEach(x => [1, -1].forEach(sz => { const w = wheel(r, .26); w.position.set(x, r, sz * track); v.add(w); })); if (extra) extra(v); return v; };
    const pod = make(3.6, keyed([[0, .72, .2, 1.0], [.6, .8, .18, 1.38], [2.2, .8, .18, 1.42], [3.2, .76, .2, 1.0], [3.6, .6, .26, .7]], 2.6, 4), [1.2, -1.2], .33, .74);
    const truck = new THREE.Group(); { const s = new THREE.Shape(); [[-2.85, .35], [-2.85, 1.15], [-.2, 1.92], [2.75, .98], [2.85, .55], [2.6, .35]].forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); const eg = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1 }); eg.translate(0, 0, -.95); const b = new THREE.Mesh(eg, M.clay); b.castShadow = b.receiveShadow = true; truck.add(b); [2.0, -1.9].forEach(x => [1, -1].forEach(sz => { const w = wheel(.42, .32); w.position.set(x, .42, sz * .86); truck.add(w); })); }
    const semi = new THREE.Group(); { const cab = new THREE.Mesh(loft(3.0, keyed([[0, 1.25, .9, 3.6], [.8, 1.25, .9, 3.85], [2.4, 1.25, .9, 3.7], [3.0, 1.2, .9, 2.0]], 4, 4, .2), 50, 64), M.clay); cab.position.x = 0; cab.castShadow = true; semi.add(cab); const fr = new THREE.Mesh(new RoundedBoxGeometry(3.8, .35, 1.1, 2, .05), M.frame); fr.position.set(-1.6, .85, 0); semi.add(fr); const fw = new THREE.Mesh(new RoundedBoxGeometry(1.4, .12, 1.4, 2, .04), M.darkSteel); fw.position.set(-2.2, 1.1, 0); semi.add(fw); [2.2, -1.2, -2.6].forEach(x => [1, -1].forEach(sz => { const w = wheel(.52, .34); w.position.set(x, .52, sz * 1.0); semi.add(w); })); semi.position.x = .4; }
    const suv = make(4.75, keyed([[0, .9, .22, 1.2], [.5, .97, .2, 1.58], [2.6, .97, .2, 1.64], [3.7, .95, .22, 1.2], [4.5, .9, .3, .98], [4.75, .7, .36, .8]], 2.8, 4), [1.45, -1.45], .37, .82);
    const sedan = make(4.7, keyed([[0, .9, .22, 1.08], [.5, .96, .2, 1.12], [1.2, .97, .2, 1.4], [2.6, .97, .2, 1.44], [3.5, .95, .22, .98], [4.45, .9, .3, .8], [4.7, .7, .36, .68]], 2.8, 4), [1.42, -1.42], .36, .8);
    this.vehicles = [pod, truck, semi, suv, sedan];
    this.vehicles.forEach((v, i) => { v.rotation.y = Math.PI / 2; v.position.set(this.vehX[i], 0, this.LANE_Z); g.add(v); v.traverse(m => { if (m.isMesh) m.castShadow = true; }); });
    this.vehTop = [1.45, 1.95, 3.9, 1.65, 1.45];
  }
  // the jump: run-in along x on the lane, take-off, a kickflip (full roll about the car's long axis) over the row, landing
  flightAt(u) {
    const x = lerp(-24, 2, u), up = cl((u - .14) / .74), y = 6.3 * Math.sin(Math.PI * up) * (1 - .12 * up);
    const roll = TAU * sm(cl((u - .3) / .42)), pitch = -.08 * Math.sin(Math.PI * up);
    return { p: new THREE.Vector3(x, y, this.LANE_Z), roll, pitch, air: up > 0 && up < 1 };
  }

  // ------------------------------------------------------------ the hero tank (standing on the pad): liner, hoop wrap, helical wrap, boss and valve
  buildHeroTank() {
    const M = this.M, g = this.heroTank = new THREE.Group(); this.scene.add(g); g.position.set(2.7, 0, 4.4);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.42, .46, .1, 64), M.plinth); plinth.position.y = .05; plinth.receiveShadow = plinth.castShadow = true; g.add(plinth);
    this.tCutA = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 9); this.tCutB = new THREE.Plane(new THREE.Vector3(0, 0, -1), 9);
    const cut = m => { m = m.clone(); m.clippingPlanes = [this.tCutA, this.tCutB]; m.clipIntersection = true; m.side = THREE.DoubleSide; return m; };
    const shellGeo = (r, lc, t) => { const o = []; for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + k / 12 * Math.PI / 2; o.push([r * Math.cos(a), -lc / 2 + r * Math.sin(a)]); } for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI / 2; o.push([r * Math.cos(a), lc / 2 + r * Math.sin(a)]); } return lathe(o.filter(([rr]) => rr > .045), 72); };
    const Y = .1 + .23 + .5 + .02;
    this.tl = {
      liner: new THREE.Mesh(shellGeo(.205, 1.0), cut(M.alu)),
      hoop: new THREE.Mesh(new THREE.CylinderGeometry(.218, .218, 1.0, 72, 1, true), cut(M.hoop)),
      helix: new THREE.Mesh(shellGeo(.232, 1.0), cut(M.carbonTank)),
      boss: new THREE.Mesh(lathe([[.03, 0], [.065, 0], [.065, .05], [.045, .07], [.045, .1], [.03, .1]], 48), M.alu),
      valve: new THREE.Group(),
    };
    const vb = new THREE.Mesh(new RoundedBoxGeometry(.12, .1, .1, 2, .02), M.steel); vb.position.y = .05; const knob = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .03, 24), M.black); knob.position.set(0, .115, 0); const gauge = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .025, 32), M.steel); gauge.rotation.z = Math.PI / 2; gauge.position.set(.075, .05, 0);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.038, 32), new THREE.MeshBasicMaterial({ color: '#F4F4F2' })); face.rotation.y = Math.PI / 2; face.position.set(.0885, .05, 0); this.tl.valve.add(vb, knob, gauge, face);
    this.tl.liner.position.y = Y; this.tl.hoop.position.y = Y; this.tl.helix.position.y = Y; this.tl.boss.position.y = Y + .5 + .2; this.tl.valve.position.y = Y + .5 + .2 + .1;
    Object.values(this.tl).forEach(m => { m.traverse(q => { if (q.isMesh) q.castShadow = true; }); g.add(m); });
    this.tlBase = {}; for (const k in this.tl) this.tlBase[k] = this.tl[k].position.y;
    this.tlOff = { liner: .42, hoop: .2, helix: 0, boss: .66, valve: .82 };
  }

  // ------------------------------------------------------------ anchors for labels
  anchor(name) {
    const v = new THREE.Vector3(); this.scene.updateMatrixWorld(true);
    const T = this.thr[0], H = this.heroTank;
    switch (name) {
      case 'tank': return this.tanks.children[0].localToWorld(v.set(0, .2, .45));
      case 'tankCar': return this.tanks.localToWorld(v.set(-.87, .3, .3));
      case 'fan': return this.fans[0].f.localToWorld(v.set(0, 0, 0));
      case 'fan2': return this.fans[1].f.localToWorld(v.set(0, 0, 0));
      case 'thr0': return T.g.localToWorld(v.set(0, .0, 0));
      case 'noz': return T.parts.noz.localToWorld(v.set(.03, -.02, 0));
      case 'seat': return T.parts.seat.localToWorld(v.set(.03, 0, 0));
      case 'pop': return T.parts.pop.localToWorld(v.set(.012, 0, 0));
      case 'spr': return T.parts.spr.localToWorld(v.set(.012, -.03, 0));
      case 'coil': return T.parts.coil.localToWorld(v.set(.04, -.035, 0));
      case 'hou': return T.parts.hou.localToWorld(v.set(.052, -.12, 0));
      case 'liner': return this.tl.liner.localToWorld(v.set(.15, -.2, .14));
      case 'hoop': return this.tl.hoop.localToWorld(v.set(.2, .1, .08));
      case 'helix': return this.tl.helix.localToWorld(v.set(-.16, 0, .16));
      case 'valve': return this.tl.valve.localToWorld(v.set(0, .06, 0));
      case 'heroTank': return H.localToWorld(v.set(0, .9, 0));
      case 'car': return this.car.localToWorld(v.set(0, .6, 0));
      case 'cockpit': return this.car.localToWorld(v.set(.05, .7, .38));
      default: { const m = /^veh(\d)$/.exec(name); if (m) { const i = +m[1]; return v.set(this.vehX[i], this.vehTop[i] + .3, this.LANE_Z); } return v.set(0, 0, 0); }
    }
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { return this.ex.anchors().map(({ p, world }) => { const [x, y, z] = this.studio.project(world); return { label: p.label, side: p.side, u: p.u ?? 0, x, y, z }; }); }

  // ------------------------------------------------------------ one frame
  render(t) {
    const S = this.ST, st = this.studio, car = this.car;
    st.renderer.toneMappingExposure = S.exposure;
    // car pose
    let pos, quat = new THREE.Quaternion(), e = new THREE.Euler();
    if (S.pose === 1) { const r = this.rampAt(Math.min(1, S.rampU)); pos = r.p.clone(); e.set(0, 0, r.th); quat.setFromEuler(e); }
    else if (S.pose === 2) { const f = this.flightAt(cl(S.flightU)); pos = f.p.clone(); const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, f.pitch)), q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), f.roll); quat.copy(q1).multiply(q2);
      // the kickflip turns about the car's centre of mass, not its floor: shift so the roll pivots at ~0.55 m
      const c = new THREE.Vector3(0, .55, 0); pos.add(c.clone().sub(c.clone().applyQuaternion(quat))); }
    else { pos = new THREE.Vector3(S.padX, S.carLift, S.padZ); e.set(0, S.padYaw, 0); quat.setFromEuler(e); }
    car.position.copy(pos); car.quaternion.copy(quat);
    // body: ghost and lift
    const gh = cl(S.ghost), op = 1 - gh, tr = op < .999;
    [this.bodyMat, this.cabMat].forEach(m => { if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = op; m.depthWrite = !tr; });
    this.shell.children.forEach(m => { if (m.material && m.material.isMeshStandardMaterial && m.material !== this.bodyMat && m.material !== this.cabMat) { const mm = m.material; if (mm.transparent !== tr) { mm.transparent = tr; mm.needsUpdate = true; } mm.opacity = op; } });
    this.ghostBody.material.uniforms.uA.value = gh; this.ghostCab.material.uniforms.uA.value = gh; this.ghostBody.visible = this.ghostCab.visible = gh > .01;
    this.shell.visible = true; this.shell.position.y = S.bodyLift * 2.1;
    this.inner.visible = true;   // jets live on the thrusters, and the nozzles show through the body
    this.ex.set(S.explode);
    // wheels spin with distance
    this.wheels.forEach(w => { w.children[0].rotation.y = 0; w.rotation.z = -S.wheelSpin; });
    // fans
    this.fans.forEach(({ rotor }, i) => rotor.rotation.y = t * 38 * S.fans + i);
    this.flowM.opacity = .95 * S.flow; this.flowT.offset.x = -t * 1.6; this.flowMesh.visible = S.flow > .01;
    this.forceArrows.forEach((a, i) => { a.visible = S.force > .01; a.material.opacity = S.force; a.scale.setScalar(.6 + .4 * S.force); a.position.y = 2.15 + .12 * Math.sin(t * 6 + i * 1.7) * S.force; });
    // thrusters and jets: jetMask is a 10-bit mask of which thrusters fire, jets is the intensity
    const mask = Math.round(S.jetMask);
    this.thr.forEach((T, i) => { const on = (mask >> i) & 1 ? S.jets : 0; T.jet.visible = on > .01; T.jet.material.uniforms.uA.value = on; T.jet.material.uniforms.uT.value = t + i; T.jet.scale.set(1, S.jetLen * (.75 + .25 * on), 1);
      const lit = cl(S.num * 10 - i); T.ring.material.opacity = Math.max(lit * (1 - cl(S.num - 1.5)), on * .8) * .9; T.ring.scale.setScalar(1 + .5 * Math.sin(Math.PI * cl(S.num * 10 - i)));
    });
    // hero thruster: comes apart, poppet lifts, frost on the nozzle, half the housing cut away to show inside
    const H = this.thr[0], te = cl(S.tExplode);
    for (const k in H.parts) H.parts[k].position.y = H.base[k] + this.thrEx[k] * sm(te) + (k === 'pop' ? -.012 * S.poppet : 0);
    H.g.position.addScaledVector(H.d, .4 * sm(cl(S.thrOut)));
    const nz = H.parts.noz.material; nz.color.set('#AEB4BA').lerp(new THREE.Color('#F4FAFF'), S.frost); nz.roughness = .2 + .55 * S.frost; nz.metalness = 1 - .6 * S.frost;
    // cut plane: through the hero thruster's axis, facing the camera when tExplode > 0
    H.g.updateMatrixWorld(true); const hp = H.g.localToWorld(new THREE.Vector3(0, -.08, 0)); const cdir = new THREE.Vector3().subVectors(st.camera.position, hp); const ax = H.d.clone().applyQuaternion(car.quaternion); cdir.addScaledVector(ax, -cdir.dot(ax)).normalize();
    if (te > .01) this.cutPlane.setFromNormalAndCoplanarPoint(cdir.negate(), hp); else this.cutPlane.set(new THREE.Vector3(0, 1, 0), 1e4);
    H.parts.coil.material.emissive.set('#FF7A2A'); H.parts.coil.material.emissiveIntensity = .9 * S.poppet * (mask & 1 ? 1 : 0) + .0;
    // push arrow (opposite to the hero jet)
    const pa = this.pushArrow; pa.visible = S.push > .01; if (pa.visible) { const d = new THREE.Vector3(); this.thr.forEach((T, i) => { if ((mask >> i) & 1) d.add(T.d); }); d.applyQuaternion(car.quaternion).negate().setY(0).normalize(); pa.position.copy(car.localToWorld(new THREE.Vector3(0, 1.0, 0))).addScaledVector(d, 1.2); pa.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); pa.material.opacity = S.push; pa.scale.setScalar(.7 + .3 * S.push); }
    // hero tank: cutaway wedge and stepped layers
    const tc = sm(cl(S.tankCut)), hpos = this.heroTank.position; this.tCutA.constant = lerp(9, hpos.x, tc) - (tc > .99 ? 0 : 0); this.tCutB.constant = lerp(9, hpos.z, tc);
    this.tCutA.normal.set(-1, 0, 0); this.tCutA.constant = tc > .001 ? hpos.x + (1 - tc) * .5 : 99; this.tCutB.normal.set(0, 0, -1); this.tCutB.constant = tc > .001 ? hpos.z + (1 - tc) * .5 : 99;
    this.heroTank.visible = S.tankVis > .5;
    const tx2 = sm(cl(S.tankExplode)); for (const k in this.tl) this.tl[k].position.y = this.tlBase[k] + this.tlOff[k] * tx2;
    // vehicles fade when not needed (they are far away anyway)
    // camera with roll, light sweep
    const c = S.cam; const dd = Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz), nr = cl(dd * .06, .02, .5); if (Math.abs(st.camera.near - nr) > 1e-4) { st.camera.near = nr; st.camera.updateProjectionMatrix(); }
    st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.glint.intensity = 40 * Math.sin(Math.PI * cl(S.sweep)); st.glint.position.set(c.tx - 3 + 6 * S.sweep, c.ty + 2.5, c.tz + 3);
    st.key.position.set(c.tx + 10, 22, c.tz + 14); st.key.target.position.set(c.tx, 0, c.tz); st.key.target.updateMatrixWorld();
    st.render();
  }
}
