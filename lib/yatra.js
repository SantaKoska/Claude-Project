// yatra.js - the Kerala Yatra map engine (ES module, three r186). One instance per episode page.
//
//   import { YatraMap } from './lib/yatra.js';
//   const M = new YatraMap({ map: canvas, globe: canvas2, svg: svgGroup, data: DATA, base: 'build/yatra/ep01/' });
//   await M.load();  M.ST.cam = {...};  M.render(t);  M.screen(X, Y) -> [x, y]
//
// Real data only (see tools/yatra_data.py): NASA Blue Marble globe + India, Sentinel-2 cloudless 2016 for Kerala,
// the district and the city, India's official outline (datameet / Survey of India), Kerala district outlines
// (datameet), routes from OSRM on OpenStreetMap roads. Imagery is drawn by three.js; outlines, the blue navigation
// line, pins and the traveller marker are drawn as SVG each frame, projected through the same camera, so lines stay
// crisp at every zoom.
import * as THREE from 'three';

const NS = 'http://www.w3.org/2000/svg', D2R = Math.PI / 180, cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), sm = u => u * u * (3 - 2 * u);
const SCALE = 1000; // world units per whole Mercator width
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const loadTex = url => new Promise((ok, no) => new THREE.TextureLoader().load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ok(t); }, undefined, no));

// small vehicle glyphs (white, drawn in a 40x40 box centred on 0,0)
const GLYPH = {
  taxi: 'M-13 4 L-11 -4 Q-10 -7 -6 -7 L6 -7 Q10 -7 11 -4 L13 4 L13 8 L-13 8 Z M-8 -5 L-9 0 L9 0 L8 -5 Z',
  auto: 'M-12 8 L-12 -2 Q-12 -9 -3 -9 L6 -9 Q12 -9 13 -2 L13 8 Z M-8 -5 L-8 1 L4 1 L4 -5 Z',
  bus: 'M-12 9 L-12 -9 Q-12 -11 -10 -11 L10 -11 Q12 -11 12 -9 L12 9 Z M-9 -8 L-9 -1 L9 -1 L9 -8 Z',
  train: 'M-10 9 L-10 -8 Q-10 -12 0 -12 Q10 -12 10 -8 L10 9 Z M-7 -8 L-7 -2 L7 -2 L7 -8 Z',
  plane: 'M0 -14 L3 -4 L13 2 L13 5 L3 2 L2 9 L6 12 L6 14 L0 12 L-6 14 L-6 12 L-2 9 L-3 2 L-13 5 L-13 2 L-3 -4 Z',
};

export class YatraMap {
  constructor({ map, globe, svg, data, base }) {
    this.D = data; this.base = base; this.svg = svg;
    const W = map.width, H = map.height; this.W = W; this.H = H;
    const r = this.rm = new THREE.WebGLRenderer({ canvas: map, antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(W, H, false); r.outputColorSpace = THREE.SRGBColorSpace;
    this.sm = new THREE.Scene(); this.sm.background = new THREE.Color('#0B2A4A');
    this.cm = new THREE.PerspectiveCamera(40, W / H, .001, 5000); this.cm.up.set(0, 0, -1);
    const g = this.rg = new THREE.WebGLRenderer({ canvas: globe, antialias: true, alpha: true, preserveDrawingBuffer: true }); g.setPixelRatio(1); g.setSize(W, H, false); g.outputColorSpace = THREE.SRGBColorSpace;
    this.sg = new THREE.Scene(); this.cg = new THREE.PerspectiveCamera(30, W / H, .01, 100);
    const O = this.O = data.pts.start; // world origin = the airport, so numbers stay small
    this.w = (X, Y) => new THREE.Vector3((X - O[0]) * SCALE, 0, (Y - O[1]) * SCALE);
    this.ST = { globe: 1, g: { lat: 15, lon: 40, dist: 4.2 }, cam: { x: 0, z: 0, h: 150, tilt: 0, fov: 40 },
      india: 0, kerala: 0, dists: 0, distHi: 0, nextHi: 0, labels: 0, route: 0, leg: -1, u: 0, marker: 0, mode: 'taxi', pinsOn: 0, visited: 0, preview: -1, exitU: 0, doneHi: 0, plane: 0, planeU: 0, follow: 0, bounce: 0, bounceI: -1, labelNext: 0 }; // every key a number from the start, or GSAP sets strings
  }

  async load() {
    const D = this.D, B = this.base;
    // feathered alpha so each imagery layer blends into the one below
    const feather = (f = .06) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const img = x.createImageData(256, 256);
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 255, v = j / 255, e = Math.min(u, 1 - u, v, 1 - v); const a = Math.round(255 * sm(cl(e / f))); img.data.set([a, a, a, 255], (j * 256 + i) * 4); } x.putImageData(img, 0, 0); return new THREE.CanvasTexture(c); };
    let order = 0; this.layers = {};
    for (const k of ['india', 'kerala', 'district', 'city']) {
      const L = D.img[k], tex = await loadTex(B + L.img); const a = this.w(L.X0, L.Y0), b = this.w(L.X1, L.Y1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(b.x - a.x, b.z - a.z), new THREE.MeshBasicMaterial({ map: tex, alphaMap: k === 'india' ? null : feather(k === 'kerala' ? .04 : .08), transparent: true, depthTest: false, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set((a.x + b.x) / 2, 0, (a.z + b.z) / 2); m.renderOrder = order++; this.sm.add(m); this.layers[k] = m;
    }
    // the globe: Blue Marble, a sun, and a soft blue atmosphere rim
    const gt = await loadTex(B + 'globe.jpg');
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, 192, 128), new THREE.MeshStandardMaterial({ map: gt, roughness: .9, metalness: 0 })); this.sg.add(this.earth);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.06, 96, 64), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 p = modelViewMatrix * vec4(position,1.); vP = p.xyz; gl_Position = projectionMatrix * p; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vP; void main(){ float r = dot(normalize(-vP), vN); float a = pow(clamp(1.0 + r * 1.6, 0., 1.), 3.0); gl_FragColor = vec4(.35,.6,1.,1.) * a * .9; }' }));
    this.sg.add(atm);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(1.008, 96, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 p = modelViewMatrix * vec4(position,1.); vP = p.xyz; gl_Position = projectionMatrix * p; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vP; void main(){ float f = 1.0 - abs(dot(normalize(-vP), vN)); gl_FragColor = vec4(.45,.7,1.,1.) * pow(f, 3.0) * .8; }' }));
    this.sg.add(rim);
    this.sun = new THREE.DirectionalLight('#FFFFFF', 2.6); this.sg.add(this.sun, new THREE.AmbientLight('#8FA8C8', .55));
    // stars
    const sp = []; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 2500; i++) { const v = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize().multiplyScalar(40); sp.push(v.x, v.y, v.z); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); this.sg.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#DDE6FF', size: .06, sizeAttenuation: true })));
    this.buildOverlay(); return this;
  }

  // lat/lon on the unit globe (three.js SphereGeometry: u = 0 at lon -180)
  gv(lat, lon, r = 1) { const ph = (lon + 180) * D2R, th = (90 - lat) * D2R; return new THREE.Vector3(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)); }
  unmerc(X, Y) { return [X * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * Y))) / D2R]; }
  screen(X, Y) { const p = this.w(X, Y).project(this.cm); return [(p.x + 1) / 2 * this.W, (1 - p.y) / 2 * this.H, p.z]; }

  // ------------------------------------------------------------ SVG overlay: built once, positions updated per frame
  buildOverlay() {
    const D = this.D, g = this.svg; this.ov = {};
    const mk = (cls, attrs) => el('path', Object.assign({ fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, attrs), g);
    this.ov.india = mk('india', { stroke: '#FFE9A8', 'stroke-width': 5, filter: 'url(#glowY)' });
    this.ov.indiaG = mk('indiaG', { stroke: '#FFE9A8', 'stroke-width': 4, filter: 'url(#glowY)' });
    this.ov.dist = D.districts.map(d => ({ d, fill: el('path', { fill: '#FFC94A', 'fill-opacity': 0, stroke: 'none' }, g), line: mk('dist', { stroke: '#FFFFFF', 'stroke-width': 2.5, 'stroke-opacity': .9 }) }));
    this.ov.kerala = mk('kerala', { stroke: '#FFE9A8', 'stroke-width': 5, filter: 'url(#glowY)' });
    this.ov.lab = D.districts.map(d => { const t = el('g', {}, g); const c = el('circle', { r: 23, fill: '#14110C', stroke: '#FFFFFF', 'stroke-width': 3 }, t); const n = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Inter', 'font-weight': 800, 'font-size': 24, fill: '#FFFFFF' }, t); n.textContent = d.n; const nm = el('text', { x: 30, 'dominant-baseline': 'central', 'font-family': 'Inter', 'font-weight': 800, 'font-size': 31, fill: '#FFFFFF', stroke: '#0A1A2A', 'stroke-width': 6, 'paint-order': 'stroke' }, t); nm.textContent = d.name.toUpperCase(); return { t, d, c, nm }; });
    // route: white casing + blue line per leg, dashed preview of the next leg
    this.ov.prevw = mk('prev', { stroke: '#9EC2FF', 'stroke-width': 9, 'stroke-dasharray': '2 16', opacity: .95 });
    this.ov.legs = D.legs.map(() => ({ casing: mk('cas', { stroke: '#FFFFFF', 'stroke-width': 17 }), line: mk('line', { stroke: '#4285F4', 'stroke-width': 10 }) }));
    this.ov.exit = { casing: mk('cas', { stroke: '#FFFFFF', 'stroke-width': 15 }), line: mk('line', { stroke: '#4285F4', 'stroke-width': 9 }) };
    // pins: start (airport) + numbered stops
    const pin = (label, col) => { const p = el('g', {}, g); el('ellipse', { cx: 0, cy: 2, rx: 12, ry: 5, fill: '#000', opacity: .35 }, p); const body = el('path', { d: 'M0 0 C-6 -14 -24 -26 -24 -44 A24 24 0 1 1 24 -44 C24 -26 6 -14 0 0 Z', fill: col, stroke: '#FFFFFF', 'stroke-width': 3 }, p); el('circle', { cx: 0, cy: -44, r: 13, fill: '#FFFFFF' }, p); const t = el('text', { x: 0, y: -43, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Inter', 'font-weight': 900, 'font-size': 18, fill: '#14110C' }, p); t.textContent = label; return { p, body }; };
    this.ov.start = pin('✈', '#1A73E8'); this.ov.pins = D.ep.stops.map(s => pin(String(s.n), '#EA4335'));
    // the traveller: a blue puck with a heading cone and a vehicle glyph
    const m = this.ov.marker = el('g', {}, g); this.ov.cone = el('path', { d: 'M0 -70 L-26 -18 L26 -18 Z', fill: '#4285F4', opacity: .35 }, m);
    el('circle', { r: 32, fill: '#FFFFFF', filter: 'url(#shadowS)' }, m); el('circle', { r: 26, fill: '#1A73E8' }, m); this.ov.glyph = el('path', { d: GLYPH.taxi, fill: '#FFFFFF', transform: 'scale(1.15)' }, m);
    const pl = this.ov.plane = el('g', {}, g); el('path', { d: GLYPH.plane, fill: '#FFFFFF', stroke: '#1A73E8', 'stroke-width': 1.2, transform: 'scale(3.4)', filter: 'url(#shadowS)' }, pl);
  }

  path(pts, proj, maxU = 1) { // polyline -> SVG d, cut at fraction maxU of its length
    if (maxU <= 0) return ''; let n = pts.length, cut = n - 1, frac = 1;
    if (maxU < 1) { const L = this.lens(pts); const target = L.total * maxU; let k = 1; while (k < n && L.cum[k] < target) k++; cut = Math.min(k, n - 1); const a = L.cum[cut - 1], b = L.cum[cut]; frac = b > a ? (target - a) / (b - a) : 1; }
    let d = ''; for (let i = 0; i <= cut; i++) { let X = pts[i][0], Y = pts[i][1]; if (i === cut && frac < 1) { X = pts[i - 1][0] + (X - pts[i - 1][0]) * frac; Y = pts[i - 1][1] + (Y - pts[i - 1][1]) * frac; } const [x, y, z] = proj(X, Y); if (z > 1) return d; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    return d;
  }
  lens(pts) { if (pts._L) return pts._L; const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); pts._L = { cum, total: cum[cum.length - 1] }; return pts._L; }
  at(pts, u) { const L = this.lens(pts), target = L.total * cl(u); let k = 1; while (k < pts.length - 1 && L.cum[k] < target) k++; const a = L.cum[k - 1], b = L.cum[k], f = b > a ? (target - a) / (b - a) : 0; const X = pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, Y = pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f; return [X, Y, Math.atan2(pts[k][0] - pts[k - 1][0], -(pts[k][1] - pts[k - 1][1]))]; }
  // the traveller's mercator position for leg i at progress u (u < 0 -> at the leg start)
  where(i, u) { if (i < 0) return [...this.D.pts.start, 0]; if (i >= this.D.legs.length) return this.at(this.D.exit, u); return this.at(this.D.legs[i].pts, u); }

  // ------------------------------------------------------------ one frame
  render() {
    const S = this.ST, D = this.D;
    // globe camera: orbit position from lat/lon, looking at the centre, north up
    const gc = this.gv(S.g.lat, S.g.lon, S.g.dist); this.cg.position.copy(gc); this.cg.up.set(0, 1, 0); this.cg.lookAt(0, 0, 0); this.cg.updateProjectionMatrix();
    this.sun.position.copy(this.gv(S.g.lat + 18, S.g.lon - 35, 10));
    // map camera: target (x, z) world, height h, tilt from vertical (degrees), camera south of the target
    const c = S.cam, tr = c.tilt * D2R; this.cm.fov = c.fov; this.cm.near = Math.max(.0005, c.h * .02); this.cm.far = c.h * 40; this.cm.updateProjectionMatrix();
    this.cm.position.set(c.x, c.h * Math.cos(tr), c.z + c.h * Math.sin(tr)); this.cm.up.set(0, 0, -1); this.cm.lookAt(c.x, 0, c.z);
    // each finer layer fades in as the camera comes down, so no imagery rectangle shows from far away
    const fadeIn = { india: [1e9, 1e9], kerala: [30, 22.5], district: [9, 5], city: [2.2, 1.4] };
    for (const k in this.layers) { const [a, b] = fadeIn[k]; const o = k === 'india' ? 1 : cl((a - c.h) / (a - b)); this.layers[k].visible = o > .001; this.layers[k].material.opacity = o; }
    if (S.globe < 1) this.rm.render(this.sm, this.cm); if (S.globe > 0) this.rg.render(this.sg, this.cg);
    this.rm.domElement.style.opacity = S.globe >= 1 ? 0 : 1; this.rg.domElement.style.opacity = S.globe.toFixed(3);
    this.drawOverlay();
  }

  drawOverlay() {
    const S = this.S = this.ST, D = this.D, ov = this.ov, pm = (X, Y) => this.screen(X, Y);
    const vis = (e, a) => { e.setAttribute('opacity', cl(a).toFixed(3)); return a > .002; };
    // India outline on the globe (traced) or on the map
    if (vis(ov.indiaG, S.globe > .02 ? S.india * S.globe : 0)) { let d = ''; const cdir = this.cg.position.clone().normalize();
      D.india.forEach(r => { let pen = false; const n = Math.max(2, Math.floor(r.length * S.india)); for (let i = 0; i < n; i++) { const [lo, la] = this.unmerc(r[i][0], r[i][1]); const v = this.gv(la, lo, 1.002); if (v.clone().normalize().dot(cdir) < .05) { pen = false; continue; } const p = v.project(this.cg); const x = (p.x + 1) / 2 * this.W, y = (1 - p.y) / 2 * this.H; d += (pen ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); pen = true; } });
      ov.indiaG.setAttribute('d', d); }
    const mapOn = S.globe < 1;
    if (vis(ov.india, mapOn ? S.india * (1 - S.globe) : 0)) ov.india.setAttribute('d', D.india.map(r => this.path(r, pm) + 'Z').join(''));
    // districts: outlines, highlight of this district, NEXT district, labels
    ov.dist.forEach(({ d, fill, line }, i) => { const a = mapOn ? cl(S.dists * 14 - i) : 0; if (!vis(line, a) && S.distHi <= 0 && S.nextHi <= 0 && S.doneHi <= 0) { fill.setAttribute('fill-opacity', 0); return; }
      const dd = d.rings.map(r => this.path(r, pm) + 'Z').join(''); line.setAttribute('d', dd); fill.setAttribute('d', dd);
      const hi = d.n === D.ep.ep ? S.distHi : d.n === D.ep.ep + 1 ? S.nextHi : d.n < D.ep.ep ? S.doneHi : 0; fill.setAttribute('fill', d.n === D.ep.ep ? '#FFC94A' : d.n < D.ep.ep ? '#4285F4' : '#34A853'); fill.setAttribute('fill-opacity', (.32 * hi).toFixed(3)); });
    if (vis(ov.kerala, mapOn ? S.kerala : 0)) ov.kerala.setAttribute('d', D.districts.map(d => d.rings.map(r => this.path(r, pm) + 'Z').join('')).join(''));
    ov.lab.forEach(({ t, d, c, nm }, i) => { const a = mapOn && (!S.labelNext || d.n === D.ep.ep + 1) ? cl(S.labels * 14 - i) : 0; if (!vis(t, a)) return; const [x, y] = pm(d.c[0], d.c[1]); const left = x > this.W * .62; nm.setAttribute('x', left ? -30 : 30); nm.setAttribute('text-anchor', left ? 'end' : 'start'); t.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(.85 + .15 * sm(cl(S.labels * 14 - i))).toFixed(3)})`); c.setAttribute('fill', d.n === D.ep.ep ? '#E37400' : d.n === D.ep.ep + 1 ? '#188038' : d.n < D.ep.ep && S.doneHi > .5 ? '#1A73E8' : '#14110C'); });
    // route legs: completed legs full, current leg up to u, dashed preview of leg S.preview
    ov.legs.forEach((L, i) => { const u = i < S.leg ? 1 : i === S.leg ? S.u : 0; const a = mapOn ? S.route : 0; const d = a > 0 && u > 0 ? this.path(D.legs[i].pts, pm, u) : ''; L.casing.setAttribute('d', d); L.line.setAttribute('d', d); L.casing.setAttribute('opacity', a); L.line.setAttribute('opacity', a); });
    { const d = mapOn && S.preview >= 0 && S.preview < D.legs.length ? this.path(D.legs[S.preview].pts, pm) : ''; ov.prevw.setAttribute('d', d); }
    { const d = mapOn && S.exitU > 0 ? this.path(D.exit, pm, S.exitU) : ''; ov.exit.casing.setAttribute('d', d); ov.exit.line.setAttribute('d', d); }
    // pins
    const pinAt = (pn, X, Y, a, sc = 1, col) => { if (!vis(pn.p, mapOn ? a : 0)) return; const [x, y] = pm(X, Y); pn.p.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})`); if (col) pn.body.setAttribute('fill', col); };
    pinAt(ov.start, ...D.pts.start, S.pinsOn); D.ep.stops.forEach((s, i) => { const pop = cl(S.pinsOn * 5 - i); pinAt(ov.pins[i], ...D.pts.stops[i], pop, .6 + .4 * sm(pop) + (S.bounce && S.bounceI === i ? .35 * Math.sin(Math.PI * cl(S.bounce)) : 0), i < S.visited ? '#34A853' : '#EA4335'); });
    // traveller marker
    if (vis(ov.marker, mapOn ? S.marker : 0)) { const [X, Y, hd] = S.exitU > 0 ? this.at(D.exit, S.exitU) : this.where(S.leg, S.leg < 0 ? 0 : S.u); const [x, y] = pm(X, Y);
      // heading on screen: project a point slightly ahead
      const [x2, y2] = pm(X + Math.sin(hd) * 1e-5, Y - Math.cos(hd) * 1e-5); const ang = Math.atan2(x2 - x, -(y2 - y)) / D2R;
      ov.marker.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); ov.cone.setAttribute('transform', `rotate(${ang.toFixed(1)})`); if (ov.glyph._m !== S.mode) { ov.glyph.setAttribute('d', GLYPH[S.mode] || GLYPH.taxi); ov.glyph._m = S.mode; } }
    // the landing plane: from the sea in the north-west down onto the airport
    if (vis(ov.plane, mapOn ? S.plane : 0)) { const [ax, ay] = pm(...D.pts.start); const u = sm(cl(S.planeU)); const sx = ax - 520 * (1 - u), sy = ay - 640 * (1 - u); const sc = 1.25 - .45 * u; ov.plane.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(141) scale(${sc.toFixed(3)})`); }
  }
}
