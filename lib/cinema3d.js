// cinema3d.js - a dark premium cinema hall for the Avengers: Doomsday reel (ES module, three r186).
//
//   import { CinemaWorld } from './lib/cinema3d.js';
//   const W = new CinemaWorld(canvas, images);  W.ST.scrA = 'logo';  W.render(t);  W.screen('screen') -> [x, y]
//
// Units are metres. The screen is at z = -4 (centre y = 3.3), the seat rows climb towards +z. The hall is lit almost
// only by the screen (its colour follows the picture), aisle step lights and warm wall sconces, plus a projector beam
// with drifting dust. The screen shows real images (logos and freely licensed photos), passed in as HTMLImageElements.
import * as THREE from 'three';
import { Studio } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = u => u * u * (3 - 2 * u);
const rnd = (() => { let s = 23; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const noise = new SimplexNoise({ random: rnd });
function ctex(w, h, draw, srgb = true, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; }
const SW = 9.6, SH = 5.4, SY = 3.4, SZ = -4;

export class CinemaWorld {
  constructor(canvas, screens) {
    const st = this.studio = new Studio(canvas, { bg: ['#101219', '#030407'], floorY: 0, fov: 36, exposure: 1.0, aperture: .00002, bloom: .2, floor: '#14080A', env: .18, aoStrength: .7 });
    const s = this.scene = st.scene; s.fog = new THREE.FogExp2('#05060A', .035);
    st.key.intensity = 0; st.key.castShadow = false; st.glint.distance = 6;
    if (st.ao) st.ao.updateGtaoMaterial({ radius: .4, distanceExponent: 1.3, thickness: .4, scale: 1, samples: 12 });
    if (st.bloom) { st.bloom.threshold = .55; st.bloom.radius = .5; }
    st.floor.geometry = new THREE.PlaneGeometry(40, 40); st.floor.material.alphaMap = null; st.floor.material.transparent = false; st.floor.material.color.set('#FFFFFF'); st.floor.material.roughness = .95;
    st.floor.material.map = ctex(512, 512, (x, w, h) => { x.fillStyle = '#2A0C10'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${rnd() < .5 ? 0 : 90},0,10,${rnd() * .18})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } x.strokeStyle = 'rgba(160,110,40,.18)'; x.lineWidth = 3; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(w / 2, h / 2, 30 + i * 30, 0, TAU); x.stroke(); } }, true, 14, 14);
    this.M = {
      velvet: new THREE.MeshPhysicalMaterial({ color: '#7A1018', roughness: .85, sheen: 1, sheenRoughness: .45, sheenColor: '#FF5A6A', map: ctex(256, 256, (x, w, h) => { const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 200 + 40 * noise.noise((i % w) / 4, ((i / w) | 0) / 4); img.data.set([v, v, v, 255], i * 4); } x.putImageData(img, 0, 0); }, true, 2, 2) }),
      plastic: new THREE.MeshPhysicalMaterial({ color: '#16171B', roughness: .45, clearcoat: .4 }),
      wall: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .95, map: ctex(512, 512, (x, w, h) => { x.fillStyle = '#17181E'; x.fillRect(0, 0, w, h); for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { x.fillStyle = (i + j) % 2 ? '#1C1D24' : '#15161C'; x.fillRect(i * 256 + 6, j * 128 + 6, 244, 116); } }, true, 6, 2) }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#C9A050', metalness: 1, roughness: .3 }),
    };
    this.buildHall(); this.buildScreen(screens); this.buildSeats(); this.buildBeam(); this.buildTickets();
    this.ST = { cam: { px: 0, py: 3, pz: 12, tx: 0, ty: 3, tz: SZ, fov: 36, roll: 0 }, aperture: .00002, exposure: 1.0, scrA: 0, scrB: 0, scrMix: 0, scrOn: 1, scrZoom: 0, beam: 1, tickets: 0, sconce: 1, flare: 0 };
  }

  // ------------------------------------------------------------ walls, ceiling, sconces, aisle lights
  buildHall() {
    const wl = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.M.wall); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; this.scene.add(m); return m; };
    wl(26, 9, -7.2, 4.5, 4, Math.PI / 2); wl(26, 9, 7.2, 4.5, 4, -Math.PI / 2); wl(16, 9, 0, 4.5, 14, Math.PI); wl(16, 9, 0, 4.5, SZ - .2, 0);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 26), new THREE.MeshStandardMaterial({ color: '#08090C', roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 8.4, 4); this.scene.add(ceil);
    // warm wall sconces (emissive + a little point light each)
    this.sconces = []; const sm2 = new THREE.MeshStandardMaterial({ color: '#FFD9A0', emissive: '#FFB45A', emissiveIntensity: 2.2 });
    for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) { const g = new THREE.Mesh(new RoundedBoxGeometry(.18, .5, .06, 2, .03), sm2); g.position.set(sd * 7.15, 3.6 + i * .25, -1 + i * 3); g.rotation.y = -sd * Math.PI / 2; this.scene.add(g); const l = new THREE.PointLight('#FFB45A', .9, 4.5, 1.6); l.position.set(sd * 6.7, 3.7 + i * .25, -1 + i * 3); this.scene.add(l); this.sconces.push(l); }
    this.sconceMat = sm2;
    // aisle step lights
    const am = new THREE.MeshStandardMaterial({ color: '#FFE2B0', emissive: '#FFC070', emissiveIntensity: 2.5 });
    for (let r = 0; r < 10; r++) for (const x of [-5.95, 5.95]) { const d = new THREE.Mesh(new THREE.BoxGeometry(.25, .04, .03), am); d.position.set(x, .1 + r * .32, 1.0 + r * 1.05 + .5); this.scene.add(d); }
    // the stage strip under the screen
    const stage = new THREE.Mesh(new RoundedBoxGeometry(11, .5, 1.6, 2, .04), new THREE.MeshPhysicalMaterial({ color: '#0D0E12', roughness: .6, clearcoat: .3 })); stage.position.set(0, .25, SZ + .8); this.scene.add(stage);
  }

  // ------------------------------------------------------------ the screen: two image layers crossfading; its light spills on the hall
  buildScreen(images) {
    const fit = (x, w, h, img, mode) => { const r = Math.max(w / img.width, h / img.height) * (mode === 'contain' ? 0 : 1) || Math.min(w / img.width, h / img.height); const iw = img.width * r, ih = img.height * r; x.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih); };
    this.screens = (images || []).map(sc => { let avg = new THREE.Color('#888888');
      const tex = ctex(1600, 900, (x, w, h) => {
        const VW = w * .44; // a vertical reel sees only the middle of the screen: compose for that column
        if (sc.kind === 'logo') { const g = x.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * .5); g.addColorStop(0, sc.bg || '#2A1416'); g.addColorStop(1, '#05060A'); x.fillStyle = g; x.fillRect(0, 0, w, h);
          const r = Math.min(VW * .96 / sc.img.width, h * .42 / sc.img.height); const iw = sc.img.width * r, ih = sc.img.height * r; if (sc.tint) x.filter = sc.tint; x.drawImage(sc.img, (w - iw) / 2, (h - ih) / 2, iw, ih); x.filter = 'none'; }
        else if (sc.kind === 'text') { x.fillStyle = sc.bg || '#05060A'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle';
          if (sc.text) { x.fillStyle = sc.fg || '#FFC94A'; let f = sc.size || 300; x.font = `900 ${f}px Inter`; while (x.measureText(sc.text).width > VW * .95) { f -= 8; x.font = `900 ${f}px Inter`; } x.fillText(sc.text, w / 2, h * .42); }
          if (sc.sub) { x.fillStyle = '#E8E4DC'; let f = 64; x.font = `800 ${f}px Inter`; while (x.measureText(sc.sub).width > VW * .95) { f -= 2; x.font = `800 ${f}px Inter`; } x.fillText(sc.sub, w / 2, h * .72); }
          if (sc.sub2) { x.fillStyle = '#9A958C'; let f = 40; x.font = `700 ${f}px Inter`; while (x.measureText(sc.sub2).width > VW * .95) { f -= 2; x.font = `700 ${f}px Inter`; } x.fillText(sc.sub2, w / 2, h * .84); } }
        else { const img = sc.img, portrait = img.height > img.width * .9;
          x.fillStyle = '#000'; x.fillRect(0, 0, w, h); const rc = Math.max(w / img.width, h / img.height); x.filter = 'blur(28px) brightness(.45)'; x.drawImage(img, (w - img.width * rc) / 2, (h - img.height * rc) / 2, img.width * rc, img.height * rc); x.filter = 'none';
          if (portrait) { const r = h / img.height; x.drawImage(img, (w - img.width * r) / 2 + (sc.dx || 0) * VW, (sc.dy || 0) * h, img.width * r, img.height * r); }
          else { const r = Math.max(VW / img.width, h / img.height) * (sc.zoom || 1); x.drawImage(img, (w - img.width * r) / 2 + (sc.dx || 0) * img.width * r, (h - img.height * r) / 2, img.width * r, img.height * r); }
          const v = x.createRadialGradient(w / 2, h / 2, h * .35, w / 2, h / 2, w * .5); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = v; x.fillRect(0, 0, w, h); }
        const d = x.getImageData(0, 0, w, h).data; let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; } avg = new THREE.Color(R / n / 255, G / n / 255, B / n / 255);
      }, true); return { tex, avg, key: sc.key }; });
    const geo = new THREE.PlaneGeometry(SW, SH);
    this.scrMatA = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }); this.scrMatB = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, toneMapped: false });
    const a = new THREE.Mesh(geo, this.scrMatA), b = new THREE.Mesh(geo, this.scrMatB); a.position.set(0, SY, SZ); b.position.set(0, SY, SZ + .005); this.scene.add(a, b); this.scrA = a; this.scrB = b;
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(SW + .5, SH + .5), new THREE.MeshStandardMaterial({ color: '#030304', roughness: 1 })); fr.position.set(0, SY, SZ - .01); this.scene.add(fr);
    // light thrown by the screen into the hall
    this.scrLight = new THREE.SpotLight('#FFFFFF', 0, 30, .9, .9, 1.2); this.scrLight.position.set(0, SY, SZ + .4); this.scrLight.target.position.set(0, 1.5, 8); this.scene.add(this.scrLight, this.scrLight.target);
    this.scrFill = new THREE.PointLight('#FFFFFF', 0, 18, 1.4); this.scrFill.position.set(0, SY - 1, SZ + 2); this.scene.add(this.scrFill);
  }

  // ------------------------------------------------------------ red velvet seats on stepped risers
  buildSeats() {
    const rows = 10, cols = 14, seatW = .68;
    const back = new RoundedBoxGeometry(.6, .78, .14, 3, .05), cush = new RoundedBoxGeometry(.6, .16, .52, 3, .05), arm = new RoundedBoxGeometry(.07, .08, .5, 2, .03);
    const bI = new THREE.InstancedMesh(back, this.M.velvet, rows * cols), cI = new THREE.InstancedMesh(cush, this.M.velvet, rows * cols), aI = new THREE.InstancedMesh(arm, this.M.plastic, rows * (cols + 1));
    const o = new THREE.Object3D(); let k = 0, ka = 0;
    for (let r = 0; r < rows; r++) { const y = r * .32, z = 1.2 + r * 1.05;
      const riser = new THREE.Mesh(new THREE.BoxGeometry(11.4, .32, 1.05), new THREE.MeshStandardMaterial({ color: '#160709', roughness: 1, map: this.scene.children.find(c => c === this.studio.floor)?.material.map || null })); riser.position.set(0, y - .16 + .32, z + .2); if (r) this.scene.add(riser);
      for (let c = 0; c < cols; c++) { const x = (c - (cols - 1) / 2) * seatW; if (Math.abs(x) < .01) continue;
        o.position.set(x, y + .32 + .62, z + .25); o.rotation.set(-.12, 0, 0); o.updateMatrix(); bI.setMatrixAt(k, o.matrix);
        o.position.set(x, y + .32 + .42, z); o.rotation.set(0, 0, 0); o.updateMatrix(); cI.setMatrixAt(k, o.matrix); k++; }
      for (let c = 0; c <= cols; c++) { const x = (c - cols / 2) * seatW; o.position.set(x, y + .32 + .6, z); o.updateMatrix(); aI.setMatrixAt(ka++, o.matrix); } }
    bI.count = cI.count = k; aI.count = ka; [bI, cI, aI].forEach(m => { m.castShadow = m.receiveShadow = true; this.scene.add(m); });
    this.firstRowZ = 1.2;
  }

  // ------------------------------------------------------------ projector beam with drifting dust
  buildBeam() {
    const from = new THREE.Vector3(0, 6.6, 13.6), to = new THREE.Vector3(0, SY, SZ); const L = from.distanceTo(to);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(SW * .48, .08, L, 48, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { op: { value: .25 }, col: { value: new THREE.Color('#BFD4FF') } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); vec4 p = modelViewMatrix*vec4(position,1.); vP = p.xyz; gl_Position = projectionMatrix*p; }',
      fragmentShader: 'uniform float op; uniform vec3 col; varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ float f = pow(abs(dot(normalize(-vP), vN)), 1.6); float a = op * f * (0.25 + 0.75*vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y)); gl_FragColor = vec4(col * a, a); }' }));
    cone.position.copy(from).lerp(to, .5); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()); cone.renderOrder = 5; this.scene.add(cone); this.beam = cone;
    const N = 520, pos = new Float32Array(N * 3); this.dust = []; for (let i = 0; i < N; i++) { const u = rnd(), a = rnd() * TAU, rr = Math.sqrt(rnd()) * (SW * .48 * (1 - u) + .08 * u) * .95; this.dust.push({ u, a, rr, sp: .2 + rnd() * .6, ph: rnd() * TAU }); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.dustPts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFF4E0', size: .014, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); this.scene.add(this.dustPts);
    this.beamFrom = from; this.beamTo = to;
  }

  // ------------------------------------------------------------ a stack of printed tickets on the front-row armrest (the ₹48 crore beat)
  buildTickets() {
    const map = ctex(800, 300, (x, w, h) => { x.fillStyle = '#F2E8D2'; x.fillRect(0, 0, w, h); x.fillStyle = '#B5121B'; x.fillRect(0, 0, 150, h); x.fillStyle = '#FFF'; x.save(); x.translate(75, h / 2); x.rotate(-Math.PI / 2); x.font = '900 46px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ADMIT ONE', 0, 0); x.restore();
      x.fillStyle = '#1A1A1A'; x.font = '900 64px Inter'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('DOOMSDAY', 190, 90); x.font = '700 38px Inter'; x.fillText('17 DEC · 12:01 AM · FIRST SHOW', 190, 170); x.font = '600 32px "DejaVu Sans Mono"'; x.fillStyle = '#555'; x.fillText('ROW F  ·  SEAT 12  ·  SCREEN 1', 190, 240);
      x.setLineDash([10, 8]); x.strokeStyle = '#999'; x.lineWidth = 3; x.beginPath(); x.moveTo(150, 0); x.lineTo(150, h); x.stroke(); }, true);
    const tm = new THREE.MeshStandardMaterial({ map, roughness: .7 }), side = new THREE.MeshStandardMaterial({ color: '#E8DCC0', roughness: .8 });
    const geo = new THREE.BoxGeometry(.32, .0025, .12); this.tix = new THREE.InstancedMesh(geo, [side, side, tm, side, side, side], 160); this.tixMats = { tm };
    const o = new THREE.Object3D(); for (let i = 0; i < 160; i++) { o.position.set((rnd() - .5) * .012, i * .0027, (rnd() - .5) * .01); o.rotation.set(0, (rnd() - .5) * .25, 0); o.updateMatrix(); this.tix.setMatrixAt(i, o.matrix); }
    this.tix.count = 0; this.tix.frustumCulled = false; this.tixG = new THREE.Group(); this.tixG.add(this.tix); this.tixG.position.set(.34 + .34 * 0, 1.27, 1.2); this.scene.add(this.tixG); this.tix.castShadow = true;
    // one hero ticket for close-ups
    const hero = this.heroTicket = new THREE.Mesh(new THREE.BoxGeometry(.32, .002, .12), [side, side, tm, side, side, side]); hero.position.set(-.34, 1.27, 1.2); hero.rotation.y = .3; hero.castShadow = true; this.scene.add(hero);
  }

  anchor(name) {
    switch (name) {
      case 'screen': return new THREE.Vector3(0, SY, SZ);
      case 'screenTop': return new THREE.Vector3(0, SY + SH / 2, SZ);
      case 'tickets': return this.tixG.position.clone().add(new THREE.Vector3(0, this.tix.count * .0027 + .02, 0));
      case 'hero': return this.heroTicket.position.clone();
    }
    return new THREE.Vector3();
  }
  screen(name) { return this.studio.project(this.anchor(name)); }
  explodedLabels() { return []; }

  render(t) {
    const S = this.ST, st = this.studio; st.renderer.toneMappingExposure = S.exposure;
    // screen layers
    const A = this.screens[S.scrA | 0], B = this.screens[S.scrB | 0];
    if (A && this.scrMatA.map !== A.tex) { this.scrMatA.map = A.tex; this.scrMatA.needsUpdate = true; }
    if (B && this.scrMatB.map !== B.tex) { this.scrMatB.map = B.tex; this.scrMatB.needsUpdate = true; }
    const mix = cl(S.scrMix), on = cl(S.scrOn); this.scrMatB.opacity = mix; this.scrMatA.color.setScalar(.86 * on); this.scrMatB.color.setScalar(.86 * on);
    const z = 1 + .06 * S.scrZoom; this.scrA.scale.set(1, 1, 1); this.scrB.scale.set(1, 1, 1);
    [this.scrMatA, this.scrMatB].forEach(m => { if (m.map) { m.map.repeat.set(1 / z, 1 / z); m.map.offset.set((1 - 1 / z) / 2, (1 - 1 / z) / 2); } });
    const col = (A ? A.avg.clone() : new THREE.Color('#888')).lerp(B ? B.avg : new THREE.Color('#888'), mix); const lum = .3 + col.r * .3 + col.g * .5 + col.b * .2;
    this.scrLight.color.copy(col).lerp(new THREE.Color('#FFFFFF'), .35); this.scrLight.intensity = 26 * on * lum; this.scrFill.color.copy(this.scrLight.color); this.scrFill.intensity = 2.5 * on * lum;
    this.beam.material.uniforms.op.value = .22 * S.beam * on; this.beam.material.uniforms.col.value.copy(col).lerp(new THREE.Color('#CFE0FF'), .5);
    const P = this.dustPts.geometry.attributes.position, dir = this.beamTo.clone().sub(this.beamFrom); const ax = dir.clone().normalize(), sideV = new THREE.Vector3(1, 0, 0), upV = new THREE.Vector3().crossVectors(ax, sideV).normalize();
    this.dust.forEach((d, i) => { const u = (d.u + t * .004 * d.sp) % 1, a = d.a + Math.sin(t * .3 * d.sp + d.ph) * .3; const rr = d.rr * (1 - u) / (1 - d.u + 1e-6) * .0 + (SW * .48 * (1 - u) + .08 * u) * (d.rr / (SW * .48)); const c = this.beamFrom.clone().addScaledVector(dir, 1 - u); P.setXYZ(i, c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr * .6 + Math.sin(t * .5 + d.ph) * .02, c.z); });
    P.needsUpdate = true; this.dustPts.material.opacity = .45 * S.beam * on;
    this.sconces.forEach(l => l.intensity = .9 * S.sconce); this.sconceMat.emissiveIntensity = 2.2 * S.sconce;
    this.tix.count = Math.round(160 * cl(S.tickets));
    const c = S.cam; st.camera.near = .05; st.camera.updateProjectionMatrix(); st.look(c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.fov); if (c.roll) st.camera.rotateZ(c.roll);
    if (st.bokeh) st.bokeh.uniforms.aperture.value = S.aperture;
    st.render();
  }
}
