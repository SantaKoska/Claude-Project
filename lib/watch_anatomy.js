// watch_anatomy.js - a detailed automatic wristwatch that comes apart into ~30 real parts (ES module).
//   import { buildWatch } from './lib/watch_anatomy.js';
//   const w = buildWatch(scene);  w.ex.set(k);  w.live(t, clockT);  w.ex.anchors() -> labels
// Real order from front to back: crystal, bezel, hands, dial, main plate, wheels + barrel + escapement + balance,
// bridges, rotor, case back. The case middle stays put while everything leaves it.
import { THREE, Exploded, tex, gearGeo, bridgeGeo, spiralTube, ribbonSpiral } from './anatomy3d.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildWatch(scene, o = {}) {
  const TAU = Math.PI * 2;
  const cotes = tex.cotes(10), perl = tex.perlage(), sun = tex.sunburst();
  const M = {
    polish: new THREE.MeshStandardMaterial({ color: '#D7DCE1', metalness: 1, roughness: .1 }),
    brushed: new THREE.MeshStandardMaterial({ color: '#C4CAD0', metalness: 1, roughness: .32 }),
    bridge: new THREE.MeshStandardMaterial({ color: '#CDD2D7', metalness: 1, roughness: .5, roughnessMap: cotes, bumpMap: cotes, bumpScale: .5 }),
    plate: new THREE.MeshStandardMaterial({ color: '#BFC5CB', metalness: 1, roughness: .55, roughnessMap: perl, bumpMap: perl, bumpScale: .4 }),
    gold: new THREE.MeshStandardMaterial({ color: '#E3AC45', metalness: 1, roughness: .2 }),
    goldB: new THREE.MeshStandardMaterial({ color: '#D99A35', metalness: 1, roughness: .32, roughnessMap: cotes, bumpMap: cotes, bumpScale: .4 }),
    steelD: new THREE.MeshStandardMaterial({ color: '#8E979F', metalness: 1, roughness: .35 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: '#B3123F', metalness: 0, roughness: .06, clearcoat: 1, emissive: '#3A0012', emissiveIntensity: .6 }),
    blue: new THREE.MeshStandardMaterial({ color: '#2346B8', metalness: .9, roughness: .22 }),
    spring: new THREE.MeshStandardMaterial({ color: '#D5DCE4', metalness: 1, roughness: .2, side: THREE.DoubleSide }),
    hair: new THREE.MeshStandardMaterial({ color: '#3A64D8', metalness: .9, roughness: .25 }),
    dial: new THREE.MeshStandardMaterial({ color: o.dial || '#0E3A52', metalness: .65, roughness: .38, roughnessMap: sun, bumpMap: sun, bumpScale: .35 }),
    print: new THREE.MeshStandardMaterial({ map: tex.dialPrint(), transparent: true, metalness: 0, roughness: .6, depthWrite: false }),
    lume: new THREE.MeshStandardMaterial({ color: '#F4F1E4', emissive: '#CFE8C8', emissiveIntensity: .15, roughness: .5 }),
    accent: new THREE.MeshStandardMaterial({ color: '#FF6B2C', metalness: .4, roughness: .3 }),
    leather: new THREE.MeshStandardMaterial({ color: '#5A341E', roughness: .75 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0, roughness: .02, transmission: 1, thickness: .6, ior: 1.6, transparent: true, opacity: 1, envMapIntensity: 1.2, specularIntensity: 1 }),
  };
  const root = new THREE.Group(); scene.add(root);
  const ex = new Exploded();
  const add = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const cyl = (r, h, m, seg = 64) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  const jewel = (p, x, y, z) => add(p, cyl(.42, .18, M.ruby, 24), x, y, z);
  const screw = (p, x, y, z) => { const s = add(p, cyl(.5, .3, M.blue, 24), x, y, z); const sl = add(p, new THREE.Mesh(new THREE.BoxGeometry(.85, .06, .12), M.steelD), x, y + .16, z); sl.rotation.y = x * 1.3 + z; return s; };

  // ---------------- case middle with lugs and crown (stays)
  const caseG = new THREE.Group(); root.add(caseG);
  const prof = [[14.4, -3.2], [17.4, -3.2], [18.9, -2.4], [19.6, -.6], [19.7, 1.4], [19.1, 3.0], [17.6, 3.6], [14.4, 3.6]].map(([r, y]) => new THREE.Vector2(r, y));
  add(caseG, new THREE.Mesh(new THREE.LatheGeometry(prof.concat([prof[0]]), 160), M.brushed));
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => { const l = add(caseG, new THREE.Mesh(new RoundedBoxGeometry(3.4, 4.2, 8, 3, .9), M.polish), sx * 9.2, .2, sz * 19.6); l.rotation.x = sz * .12; });
  const crown = new THREE.Group(); caseG.add(crown); crown.position.set(20.8, .4, 0);
  const cr = add(crown, cyl(2.0, 2.6, M.polish, 48), 1.0, 0, 0); cr.rotation.z = Math.PI / 2;
  for (let i = 0; i < 24; i++) { const r = add(crown, new THREE.Mesh(new THREE.BoxGeometry(2.6, .25, .25), M.brushed), 1.0, Math.cos(i / 24 * TAU) * 2.02, Math.sin(i / 24 * TAU) * 2.02); }
  const stem = add(crown, cyl(.35, 6, M.steelD, 16), -2.4, 0, 0); stem.rotation.z = Math.PI / 2;
  // strap (slides away when the watch opens)
  const strap = new THREE.Group(); root.add(strap);
  [-1, 1].forEach(sz => { const s = add(strap, new THREE.Mesh(new RoundedBoxGeometry(15.5, 2.4, 26, 3, .9), M.leather), 0, -.6, sz * 33.5); s.rotation.x = -sz * .1; });
  ex.add(strap, { off: [0, -70, 0], at: 0, len: .3 });

  // ---------------- crystal, bezel
  const crystal = add(root, new THREE.Mesh(new THREE.SphereGeometry(40, 96, 16, 0, TAU, 0, .36), M.glass), 0, 3.6 - 37.4, 0);
  ex.add(crystal, { off: [0, 50, 0], at: .02, label: 'Sapphire crystal', ml: 'ക്രിസ്റ്റൽ ഗ്ലാസ്', anchor: [13.5, 37.6, 0], side: 1 });
  const bezel = add(root, new THREE.Mesh(new THREE.TorusGeometry(15.6, 1.25, 24, 160), M.polish), 0, 3.7, 0); bezel.rotation.x = Math.PI / 2; bezel.scale.set(1, 1, .55);
  ex.add(bezel, { off: [0, 43, 0], at: .06, label: 'Bezel', ml: 'ബെസൽ', anchor: [-15.6, 0, 0], side: -1 });

  // ---------------- hands
  const hands = {}; const handGeo = (len, w) => { const s = new THREE.Shape(); s.moveTo(0, -1.4); s.lineTo(w, 0); s.lineTo(0, len); s.lineTo(-w, 0); s.closePath(); const h = new THREE.Path(); h.absarc(0, 0, .35, 0, TAU, true); s.holes.push(h); const g = new THREE.ExtrudeGeometry(s, { depth: .18, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); return g; };
  [['hour', 8.2, .9, 3.05, M.polish], ['minute', 12.2, .7, 3.25, M.polish]].forEach(([n, len, w, y, m]) => { const g = new THREE.Group(); g.position.y = y; root.add(g); const hm = add(g, new THREE.Mesh(handGeo(len, w), m)); const lm = add(g, new THREE.Mesh(new THREE.BoxGeometry(w * .45, .08, len * .55), M.lume), 0, .3, -len * .5); hands[n] = g; });
  { const g = new THREE.Group(); g.position.y = 3.45; root.add(g); add(g, new THREE.Mesh(new THREE.BoxGeometry(.2, .12, 15), M.accent), 0, 0, -5.5); add(g, cyl(.5, .25, M.accent, 24)); add(g, new THREE.Mesh(new THREE.BoxGeometry(.6, .14, 2.4), M.accent), 0, 0, 2.4); hands.second = g; }
  ex.add(hands.second, { off: [0, 36, 0], at: .1, label: 'Hands', ml: 'സൂചികൾ', anchor: [0, 0, -12], side: 1 });
  ex.add(hands.minute, { off: [0, 34, 0], at: .11 }); ex.add(hands.hour, { off: [0, 32.5, 0], at: .12 });

  // ---------------- dial: sunburst disc, printed track, applied indices
  const dialG = new THREE.Group(); dialG.position.y = 2.7; root.add(dialG);
  add(dialG, cyl(14.4, .35, M.dial, 128));
  const pr = add(dialG, new THREE.Mesh(new THREE.CircleGeometry(14.3, 128), M.print), 0, .19, 0); pr.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12, big = i % 3 === 0; const ix = add(dialG, new THREE.Mesh(new RoundedBoxGeometry(big ? 1.1 : .7, .5, big ? 3.2 : 2.3, 2, .12), M.polish), Math.sin(a) * 11.2, .4, -Math.cos(a) * 11.2); ix.rotation.y = -a; }
  ex.add(dialG, { off: [0, 27, 0], at: .16, label: 'Dial', ml: 'ഡയൽ', anchor: [-14.4, 0, 0], side: -1 });

  // ---------------- movement
  const mv = new THREE.Group(); mv.position.y = 0; root.add(mv);
  const plate = add(mv, cyl(13.6, .9, M.plate, 128), 0, 1.6, 0);
  [[-7, -2], [6, 6], [2, -9], [-4, 8]].forEach(([x, z]) => jewel(plate, x, -.5, z));
  ex.add(plate, { off: [0, 19, 0], at: .22, label: 'Main plate', ml: 'മെയിൻ പ്ലേറ്റ്', anchor: [13.6, 0, 0], side: 1 });
  // wheels chained so each meshes with the next pinion
  const chainSpec = [['barrel', 72, 5.2, 0, 20], ['center', 64, 3.9, 1.0, -38], ['third', 60, 3.4, .88, 34], ['fourth', 56, 3.0, .8, 82], ['escape', 15, 2.0, .72, 0]];
  const wheels = {}; let at = new THREE.Vector3(-5.2, 0, -4.6);
  chainSpec.forEach(([n, teeth, R, rp, dir], i) => {
    const g = new THREE.Group(); g.position.copy(at); g.position.y = n === 'barrel' ? -.9 : (i % 2 ? .1 : -.4); mv.add(g);
    add(g, new THREE.Mesh(gearGeo(teeth, R, { hole: .3, spokes: n === 'barrel' || n === 'escape' ? 0 : 5, thick: n === 'barrel' ? .55 : .3, tip: n === 'escape' ? .1 : .26, depth: n === 'escape' ? .5 : undefined }), n === 'escape' ? M.polish : M.gold));
    if (rp) add(g, new THREE.Mesh(gearGeo(8, rp, { thick: .9, tip: .3, depth: .2 }), M.polish), 0, .35, 0);
    add(g, cyl(.2, 3.0, M.polish, 16), 0, .4, 0);
    wheels[n] = { g, R, rp };
    const nx = chainSpec[i + 1]; if (nx) { const d = R + nx[3] + .05, a = dir * Math.PI / 180; at = at.clone().add(new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d)); }
  });
  // barrel drum + mainspring
  const drum = add(wheels.barrel.g, new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 1.8, 72, 1, true), M.goldB), 0, .55, 0);
  const ms = add(wheels.barrel.g, new THREE.Mesh(ribbonSpiral(1.0, 4.6, 8, 1.4), M.spring), 0, -.15, 0);
  add(wheels.barrel.g, cyl(.8, 2.2, M.polish, 24), 0, .5, 0);
  const lay = (n, y, at0, label, ml, side) => ex.add(wheels[n].g, { off: [0, y, 0], at: at0, label, ml, anchor: [wheels[n].R, 0, 0], side });
  lay('center', 11, .3, 'Gear train', 'ഗിയർ ട്രെയിൻ', -1); lay('third', 11.6, .31); lay('fourth', 12.2, .32);
  lay('barrel', 6, .28, 'Mainspring barrel', 'മെയിൻസ്പ്രിംഗ്', 1);
  // escapement: escape wheel + pallet fork; balance with hairspring
  const E = wheels.escape.g.position;
  const fork = new THREE.Group(); const fa = 150 * Math.PI / 180; fork.position.set(E.x + Math.cos(fa) * 3.0, 0, E.z + Math.sin(fa) * 3.0); mv.add(fork);
  const lever = add(fork, new THREE.Mesh(new RoundedBoxGeometry(4.2, .3, .5, 2, .1), M.polish), -1.9, 0, 0);
  add(fork, new THREE.Mesh(new RoundedBoxGeometry(.5, .3, 3.2, 2, .1), M.polish), 1.1, 0, 0);
  [-1.4, 1.4].forEach(z => add(fork, new THREE.Mesh(new THREE.BoxGeometry(.7, .34, .32), M.ruby), 1.5, 0, z));
  const fork0 = Math.atan2(-(E.z - fork.position.z), E.x - fork.position.x); fork.rotation.y = fork0;
  ex.add(fork, { off: [0, 9.4, 0], at: .34 });
  ex.add(wheels.escape.g, { off: [0, 9, 0], at: .33, label: 'Escapement', ml: 'എസ്കേപ്പ്മെന്റ്', anchor: [2, 0, 0], side: 1 });
  const dirB = new THREE.Vector3(fork.position.x - E.x, 0, fork.position.z - E.z).normalize();
  const balG = new THREE.Group(); balG.position.set(fork.position.x + dirB.x * 6.3, -.6, fork.position.z + dirB.z * 6.3); mv.add(balG);
  const balW = new THREE.Group(); balG.add(balW);
  const ringS = new THREE.Shape(); ringS.absarc(0, 0, 4.4, 0, TAU, false); const ringH = new THREE.Path(); ringH.absarc(0, 0, 3.85, 0, TAU, true); ringS.holes.push(ringH);
  const ringG = new THREE.ExtrudeGeometry(ringS, { depth: .5, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2, curveSegments: 72 }); ringG.rotateX(-Math.PI / 2); add(balW, new THREE.Mesh(ringG, M.gold));
  for (let i = 0; i < 3; i++) { const arm = add(balW, new THREE.Mesh(new THREE.BoxGeometry(7.8, .28, .4), M.gold), 0, .25, 0); arm.rotation.y = i * Math.PI / 3; }
  for (let i = 0; i < 10; i++) { const a = i * TAU / 10, s = add(balW, cyl(.26, .5, M.gold, 12), Math.cos(a) * 4.55, .25, Math.sin(a) * 4.55); s.rotation.z = Math.PI / 2; s.rotation.y = -a; }
  add(balG, cyl(.2, 3.0, M.polish, 16));
  const hair = add(balG, new THREE.Mesh(spiralTube(.4, 2.7, 12, .045, 900), M.hair), 0, .9, 0);
  ex.add(balG, { off: [0, 8, 0], at: .36, label: 'Balance wheel', ml: 'ബാലൻസ് വീൽ', anchor: [-4.4, 0, 0], side: -1 });
  // bridges (Côtes de Genève) with jewels and blued screws
  const C = (g) => [g.position.x, -g.position.z];
  const bc = C(wheels.barrel.g), cc = C(wheels.center.g), tc = C(wheels.third.g), fc = C(wheels.fourth.g), ec = C(wheels.escape.g), bl = C(balG);
  const mkBridge = (circles, y, label, ml, side, at0, off) => { const g = new THREE.Group(); mv.add(g); add(g, new THREE.Mesh(bridgeGeo(circles, .75), M.bridge), 0, y, 0); circles.forEach(([x, z, r], i) => { if (i < 2) jewel(g, x, y + .9, -z); }); circles.slice(0, 3).forEach(([x, z, r], i) => { const a = 1.3 + i; screw(g, x + Math.cos(a) * (r * .7), y + .95, -z - Math.sin(a) * (r * .7)); }); ex.add(g, { off: [0, off, 0], at: at0, label, ml, side, anchor: [circles[0][0] + circles[0][2], y, -circles[0][1]] }); return g; };
  mkBridge([[bc[0], bc[1], 5.6], [cc[0], cc[1], 2.4], [bc[0] - 3, bc[1] - 4, 1.6]], -1.9, 'Bridges', 'ബ്രിഡ്ജുകൾ', 1, .42, -2.4);
  mkBridge([[tc[0], tc[1], 2.0], [fc[0], fc[1], 2.0], [ec[0], ec[1], 1.8]], -1.9, null, null, 1, .43, -2.0);
  mkBridge([[bl[0], bl[1], 1.6], [bl[0] + dirB.x * 5, bl[1] - dirB.z * 5, 2.2]], -1.9, null, null, 1, .44, -1.6);
  // ratchet wheel on top of the barrel bridge
  const ratchet = add(mv, new THREE.Mesh(gearGeo(40, 3.6, { thick: .5, tip: .2 }), M.polish), wheels.barrel.g.position.x, -2.55, wheels.barrel.g.position.z);
  ex.add(ratchet, { off: [0, -5, 0], at: .45 });
  // rotor
  const rotorG = new THREE.Group(); rotorG.position.y = -3.0; mv.add(rotorG);
  const rs = new THREE.Shape(); rs.absarc(0, 0, 13.4, 0, Math.PI, false); rs.lineTo(-2, 0); rs.absarc(0, 0, 2, Math.PI, 0, true); rs.closePath();
  const rh = new THREE.Path(); rh.absarc(0, 0, 8.8, .4, Math.PI - .4, false); rh.absarc(0, 0, 4, Math.PI - .55, .55, true); rh.closePath(); rs.holes.push(rh);
  const rg = new THREE.ExtrudeGeometry(rs, { depth: .55, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 2, curveSegments: 64 }); rg.rotateX(Math.PI / 2);
  add(rotorG, new THREE.Mesh(rg, M.goldB)); add(rotorG, cyl(1.5, 1.0, M.polish, 32));
  // in the real watch the movement is upside down under the dial; here the movement keeps its working side up
  // for clarity and the whole movement sits under the dial
  mv.position.y = .45;
  ex.add(caseG, { off: [0, -21, 0], at: .4, label: 'Case', ml: 'കേസ്', anchor: [-19.7, 0, 0], side: -1 });
  ex.add(rotorG, { off: [0, -6, 0], at: .5, label: 'Rotor', ml: 'റോട്ടർ', anchor: [-13.4, 0, 0], side: -1 });
  // ---------------- case back (display back)
  const back = new THREE.Group(); back.position.y = -3.6; root.add(back);
  const bRing = new THREE.Shape(); bRing.absarc(0, 0, 16.6, 0, TAU, false); const bh = new THREE.Path(); bh.absarc(0, 0, 11.5, 0, TAU, true); bRing.holes.push(bh);
  const brg = new THREE.ExtrudeGeometry(bRing, { depth: .9, bevelEnabled: true, bevelThickness: .15, bevelSize: .15, bevelSegments: 3, curveSegments: 128 }); brg.rotateX(-Math.PI / 2); add(back, new THREE.Mesh(brg, M.brushed), 0, -.45, 0);
  const bGlass = add(back, cyl(11.6, .5, M.glass, 96), 0, 0, 0);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + .26; screw(back, Math.cos(a) * 14.2, .55, Math.sin(a) * 14.2); }
  ex.add(back, { off: [0, -36, 0], at: .52, label: 'Case back', ml: 'കേസ് ബാക്ക്', anchor: [16.6, 0, 0], side: 1 });
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  crystal.castShadow = false; bGlass.castShadow = false;

  // ---------------- motion: one clock drives balance, fork, escape wheel and the train by ratio
  function live(t, clk = t, rotorAng = 0) {
    const bal = Math.sin(TAU * 4 * clk), beats = Math.floor(clk * 8), f = clk * 8 - beats, step = beats + Math.min(1, f / .25);
    balW.rotation.y = bal * 3.6; hair.rotation.y = bal * 1.4; hair.scale.set(1 + .05 * bal, 1, 1 + .05 * bal);
    fork.rotation.y = fork0 + .16 * Math.tanh(4 * bal);
    const aE = step * TAU / 30; wheels.escape.g.rotation.y = aE;
    const aF = -aE * wheels.escape.rp / wheels.fourth.R; wheels.fourth.g.rotation.y = aF;
    const aT = -aF * wheels.fourth.rp / wheels.third.R; wheels.third.g.rotation.y = aT;
    const aC = -aT * wheels.third.rp / wheels.center.R; wheels.center.g.rotation.y = aC;
    wheels.barrel.g.rotation.y = -aC * wheels.center.rp / wheels.barrel.R;
    rotorG.rotation.y = rotorAng;
    hands.hour.rotation.y = -(10 + 10 / 60) / 12 * TAU; hands.minute.rotation.y = -10 / 60 * TAU; hands.second.rotation.y = -(Math.floor(clk * 8) / 8 % 60) / 60 * TAU;
  }
  return { root, ex, live, M, parts: { crystal, bezel, dialG, plate, wheels, fork, balG, rotorG, back, strap, caseG, hands } };
}
