import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type { Zone, ZoneKind } from '../data/site';
import { box, glowMat, labelMesh, mesh, PALETTE, solidMat } from './kit';
import type { Physics } from './physics';

/**
 * One landmark per career stop. Everything is built from simple shapes.
 * Landmarks sit on the far (-z) side of the zone so the camera sees them
 * behind the player.
 */

type Update = (time: number, dt: number, active: boolean) => void;

export interface ZoneView {
  zone: Zone;
  update: Update;
}

interface Ctx {
  zone: Zone;
  group: THREE.Group;
  scene: THREE.Scene;
  physics: Physics;
  font: Font;
  color: THREE.Color;
}

const TAU = Math.PI * 2;

/** Static collider given in zone-local coordinates. */
function collide(ctx: Ctx, x: number, y: number, z: number, w: number, h: number, d: number): void {
  ctx.physics.addStaticBox(ctx.zone.x + x, y, ctx.zone.z + z, w, h, d);
}

/** A knockable crate, placed in zone-local coordinates. */
function crate(ctx: Ctx, x: number, y: number, z: number, size: number, material: THREE.Material, mass = 0.5): THREE.Mesh {
  const m = box(size, size, size, material);
  m.position.set(ctx.zone.x + x, y, ctx.zone.z + z);
  ctx.scene.add(m);
  ctx.physics.addProp(m, size, size, size, mass);
  return m;
}

function add<T extends THREE.Object3D>(ctx: Ctx, object: T, x: number, y: number, z: number): T {
  object.position.set(x, y, z);
  ctx.group.add(object);
  return object;
}

function buildStart(ctx: Ctx): Update {
  const textMat = solidMat(PALETTE.white, { emissive: PALETTE.teal, emissiveIntensity: 0.35, flatShading: false });
  const line = (text: string, size: number, y: number): void => {
    const geometry = new TextGeometry(text, { font: ctx.font, size, depth: 0.7, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (bounds) geometry.translate(-(bounds.max.x + bounds.min.x) / 2, 0, 0);
    add(ctx, mesh(geometry, textMat), 0, y, -7.5);
  };
  line('HARIKRISHNA', 2.1, 3.1);
  line('MEKALA', 2.1, 0.25);
  collide(ctx, 0, 2.7, -7.2, 21, 5.4, 1);

  const hint = (text: string, x: number, z: number): void => {
    const plate = labelMesh([{ text, size: 44, weight: 600, color: '#9be8dc' }], '#5eead4', 0.9);
    plate.rotation.x = -Math.PI / 2;
    add(ctx, plate, x, 0.06, z);
  };
  hint('WASD or arrows to move', 0, -2.4);
  hint('Space to jump', -6.5, -4.6);
  hint('Shift to boost', 6.5, -4.6);

  // a little wall of containers to smash on the way out
  const colors = [0x38bdf8, 0x5eead4, 0xa78bfa, 0xf472b6, 0xfbbf24];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4 - row; col++) {
      crate(ctx, -12.5 + col * 1.25 + row * 0.62, 0.6 + row * 1.2, -12 - col * 1.25 - row * 0.62, 1.2, solidMat(colors[(row + col) % colors.length] ?? 0x38bdf8));
    }
  }
  return () => undefined;
}

function buildConsulting(ctx: Ctx): Update {
  // training-video screen
  add(ctx, box(8, 4.6, 0.4, solidMat(PALETTE.dark)), 0, 3.6, -6.5);
  const screen = add(ctx, box(7.4, 4, 0.1, glowMat(0x1d4ed8, 0.9)), 0, 3.6, -6.25);
  const playShape = new THREE.Shape([new THREE.Vector2(-0.6, -0.8), new THREE.Vector2(0.9, 0), new THREE.Vector2(-0.6, 0.8)]);
  const play = add(ctx, mesh(new THREE.ShapeGeometry(playShape), glowMat(0xffffff, 2.4), false), 0, 3.6, -6.18);
  for (const x of [-3.2, 3.2]) add(ctx, box(0.3, 1.4, 0.3, solidMat(PALETTE.steel)), x, 0.7, -6.5);
  collide(ctx, 0, 3, -6.5, 8, 6, 0.6);

  // invoices fluttering out of a printer
  add(ctx, box(1.8, 1.1, 1.4, solidMat(0xcbd5e1)), 5.6, 0.55, -3.5);
  collide(ctx, 5.6, 0.55, -3.5, 1.8, 1.1, 1.4);
  const sheets = [0, 1, 2].map((i) => add(ctx, mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }), false), 5.6, 1.4 + i, -3.5));

  // docker-style containers, knockable
  const blue = solidMat(0x2563eb);
  const light = solidMat(0x60a5fa);
  for (let i = 0; i < 6; i++) crate(ctx, -5.4 + (i % 3) * 1.15, 0.55 + Math.floor(i / 3) * 1.1, -3.4, 1.1, i % 2 ? blue : light);

  return (time) => {
    play.scale.setScalar(1 + Math.sin(time * 3) * 0.12);
    screen.scale.x = 1 + Math.sin(time * 1.3) * 0.004;
    sheets.forEach((sheet, i) => {
      const t = (time * 0.5 + i / 3) % 1;
      sheet.position.set(5.6 + Math.sin(t * 5 + i) * 0.6, 1.2 + t * 3.4, -3.5 + t * 1.2);
      sheet.rotation.set(t * 3, t * 4 + i, 0);
      sheet.scale.setScalar(1 - t * 0.7);
    });
  };
}

function buildIntegration(ctx: Ctx): Update {
  // two systems joined by a bridge that carries data back and forth
  const towerMat = solidMat(0x2e2a5c);
  for (const x of [-4.6, 4.6]) {
    add(ctx, box(2.6, 6, 2.6, towerMat), x, 3, -6);
    add(ctx, box(2.9, 0.3, 2.9, glowMat(ctx.color, 1.5)), x, 6.1, -6);
    collide(ctx, x, 3, -6, 2.6, 6, 2.6);
    for (let i = 0; i < 4; i++) add(ctx, box(1.6, 0.25, 0.1, glowMat(i % 2 ? 0xc4b5fd : 0x7c3aed, 1.6)), x, 1.2 + i * 1.2, -4.66);
  }
  add(ctx, box(6.8, 0.3, 0.9, solidMat(PALETTE.steel)), 0, 4.6, -6);
  const packets = [0, 1, 2, 3, 4].map(() => add(ctx, box(0.5, 0.5, 0.5, glowMat(0xddd6fe, 2.6)), 0, 5.05, -6));

  const gear = (radius: number, x: number, y: number): THREE.Group => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(radius, radius, 0.4, 20), solidMat(0xa78bfa, { metalness: 0.5, roughness: 0.35 })));
    const teeth = Math.round(radius * 8);
    for (let i = 0; i < teeth; i++) {
      const tooth = box(0.36, 0.4, 0.36, solidMat(0xa78bfa, { metalness: 0.5, roughness: 0.35 }));
      const a = (i / teeth) * TAU;
      tooth.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      tooth.rotation.y = -a;
      g.add(tooth);
    }
    g.rotation.x = Math.PI / 2;
    return add(ctx, g, x, y, -4.2);
  };
  const big = gear(1.3, -0.95, 1.7);
  const small = gear(0.8, 1.25, 1.2);
  collide(ctx, 0, 1.4, -4.2, 4.6, 2.8, 0.6);

  return (time) => {
    big.rotation.y = time * 0.8;
    small.rotation.y = -time * 1.3 + 0.2;
    packets.forEach((p, i) => {
      const t = (time * 0.35 + i / packets.length) % 1;
      const dir = i % 2 ? 1 - t : t;
      p.position.x = -3.2 + dir * 6.4;
      p.rotation.y = time * 2 + i;
    });
  };
}

function buildSecurity(ctx: Ctx): Update {
  // firewall: an arc of bricks, a few of them hot
  const brickGeometry = new THREE.BoxGeometry(1.5, 0.7, 0.8);
  const cold = solidMat(0x5b2330);
  const hot = glowMat(0xfb923c, 1.8);
  let n = 0;
  for (let row = 0; row < 6; row++) {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.18 + ((i + (row % 2) * 0.5) / 9) * 0.64);
      const brick = mesh(brickGeometry, n++ % 7 === 3 ? hot : cold);
      add(ctx, brick, Math.cos(a) * 8, 0.35 + row * 0.72, Math.sin(a) * 8 + 1.5).rotation.y = -a + Math.PI / 2;
    }
  }
  collide(ctx, 0, 2.2, -6.2, 13, 4.4, 1.2);
  collide(ctx, -6.4, 2.2, -3.6, 1.2, 4.4, 3);
  collide(ctx, 6.4, 2.2, -3.6, 1.2, 4.4, 3);

  const shield = add(ctx, mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 6), glowMat(0x4ade80, 1.7)), 0, 5.6, -5.2);
  shield.rotation.x = Math.PI / 2;
  const sweep = add(ctx, mesh(new THREE.CircleGeometry(5.2, 24, 0, 0.5), new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }), false), 0, 0.07, 0);
  sweep.rotation.x = -Math.PI / 2;

  // a DDoS swarm of little bots to bowl over
  const botMat = solidMat(0xef4444);
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) {
      const bot = box(0.6, 1.3, 0.6, botMat);
      bot.position.set(ctx.zone.x + (i - row / 2) * 1.05, 0.65, ctx.zone.z - 1.2 - row * 1.0);
      ctx.scene.add(bot);
      ctx.physics.addProp(bot, 0.6, 1.3, 0.6, 0.25);
    }
  }

  return (time) => {
    shield.rotation.z = time * 0.9;
    shield.position.y = 5.6 + Math.sin(time * 1.6) * 0.2;
    sweep.rotation.z = -time * 1.4;
    hot.emissiveIntensity = 1.5 + Math.sin(time * 4) * 0.6;
  };
}

function buildMarkets(ctx: Ctx): Update {
  // a live candlestick chart
  const up = glowMat(0x34d399, 1.5);
  const down = glowMat(0xf87171, 1.5);
  const wickMat = solidMat(0x94a3b8);
  const candles = Array.from({ length: 11 }, (_, i) => {
    const x = -5.5 + i * 1.1;
    const body = add(ctx, box(0.7, 1, 0.7, i % 3 === 1 ? down : up), x, 1, -6);
    const wick = add(ctx, box(0.1, 1, 0.1, wickMat), x, 1, -6);
    return { body, wick, height: 1, target: 1 + i * 0.35, seed: i * 1.7 };
  });
  add(ctx, box(12.6, 0.3, 1.6, solidMat(PALETTE.steel)), 0, 0.15, -6);
  collide(ctx, 0, 2.2, -6, 12.6, 4.4, 1.2);

  const coin = add(ctx, mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.22, 28), solidMat(0xfbbf24, { metalness: 0.8, roughness: 0.25, flatShading: false, emissive: 0xfbbf24, emissiveIntensity: 0.25 })), 6.6, 2.4, -2.6);
  coin.rotation.x = Math.PI / 2;
  const stat = labelMesh([{ text: '4.5M users', size: 60, weight: 700, color: '#bbf7d0' }, { text: 'served by the Scorecard API', size: 28, color: '#94a3b8' }], ctx.zone.color, 1.5);
  add(ctx, stat, -6.4, 2.2, -2.4).rotation.y = 0.45;

  return (time, dt) => {
    for (const c of candles) {
      const wave = Math.sin(time * 0.9 + c.seed) * 0.9 + Math.sin(time * 0.37 + c.seed * 2) * 0.5;
      const target = Math.max(0.5, c.target + wave);
      c.height += (target - c.height) * Math.min(1, dt * 3);
      c.body.scale.y = c.height;
      c.body.position.y = 0.3 + c.height / 2;
      c.wick.scale.y = c.height + 1;
      c.wick.position.y = 0.3 + (c.height + 1) / 2;
    }
    coin.rotation.z = time * 1.8;
    coin.position.y = 2.4 + Math.sin(time * 2) * 0.3;
  };
}

function buildCloud(ctx: Ctx): Update {
  // on-prem racks on the left, the cloud on the right, data lifting across
  const rackMat = solidMat(0x0f1b3d, { metalness: 0.4, roughness: 0.4 });
  const leds: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const x = -6 + i * 1.9;
    add(ctx, box(1.5, 3.8, 1.5, rackMat), x, 1.9, -6);
    for (let row = 0; row < 7; row++) {
      const led = glowMat(row % 3 === 0 ? 0x38bdf8 : 0x4ade80, 2);
      leds.push(led);
      add(ctx, box(1.1, 0.12, 0.06, led), x, 0.6 + row * 0.45, -5.22);
    }
  }
  collide(ctx, -4.1, 1.9, -6, 5.4, 3.8, 1.5);

  const cloud = new THREE.Group();
  const puff = solidMat(0xf8fafc, { flatShading: false, emissive: 0x7dd3fc, emissiveIntensity: 0.3, roughness: 1 });
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 1.7],
    [-1.7, -0.3, 0.1, 1.2],
    [1.7, -0.25, 0, 1.3],
    [0.8, 0.7, -0.2, 1.1],
    [-0.8, 0.6, 0.2, 1.0],
  ];
  for (const [x, y, z, r] of puffs) {
    const p = mesh(new THREE.SphereGeometry(r, 16, 12), puff);
    p.position.set(x, y, z);
    cloud.add(p);
  }
  add(ctx, cloud, 4.4, 6.6, -6);
  add(ctx, box(0.3, 4.6, 0.3, solidMat(PALETTE.steel)), 4.4, 2.3, -6);
  collide(ctx, 4.4, 2.3, -6, 0.8, 4.6, 0.8);

  const count = 16;
  const lift = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), glowMat(0x7dd3fc, 2.8), count);
  lift.frustumCulled = false;
  ctx.group.add(lift);
  const dummy = new THREE.Object3D();

  return (time) => {
    cloud.position.y = 6.6 + Math.sin(time * 0.9) * 0.3;
    leds.forEach((led, i) => {
      led.emissiveIntensity = Math.sin(time * (3 + (i % 5)) + i) > 0.2 ? 2.4 : 0.3;
    });
    for (let i = 0; i < count; i++) {
      const t = (time * 0.22 + i / count) % 1;
      dummy.position.set(-4.1 + t * 8.5, 4 + Math.sin(t * Math.PI) * 3 + t * 2.2, -6 + Math.sin(i * 2.4) * 0.5);
      dummy.rotation.set(time + i, time * 1.3 + i, 0);
      dummy.scale.setScalar(Math.sin(t * Math.PI) * 0.9 + 0.2);
      dummy.updateMatrix();
      lift.setMatrixAt(i, dummy.matrix);
    }
    lift.instanceMatrix.needsUpdate = true;
  };
}

function buildAi(ctx: Ctx): Update {
  // a model core with three providers orbiting it (hot-switching between them)
  add(ctx, mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.2, 8), solidMat(0x2a1840)), 0, 0.6, -6);
  collide(ctx, 0, 0.6, -6, 5.6, 1.2, 5.6);
  const shell = add(ctx, new THREE.Mesh(new THREE.IcosahedronGeometry(2.3, 1), new THREE.MeshBasicMaterial({ color: 0xf472b6, wireframe: true, transparent: true, opacity: 0.55 })), 0, 4.6, -6);
  const coreMat = glowMat(0xf472b6, 2);
  const core = add(ctx, mesh(new THREE.IcosahedronGeometry(1.15, 2), coreMat, false), 0, 4.6, -6);
  const providers = [0x60a5fa, 0x34d399, 0xfb923c].map((color) => add(ctx, mesh(new THREE.SphereGeometry(0.42, 16, 12), glowMat(color, 2.2), false), 0, 4.6, -6));
  const halo = add(ctx, mesh(new THREE.TorusGeometry(3.3, 0.04, 6, 64), glowMat(0xf9a8d4, 1.4), false), 0, 4.6, -6);

  const count = 40;
  const tokens = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), glowMat(0xfbcfe8, 2.6), count);
  tokens.frustumCulled = false;
  ctx.group.add(tokens);
  const dummy = new THREE.Object3D();

  return (time, _dt, active) => {
    shell.rotation.set(time * 0.25, time * 0.4, 0);
    const pulse = 1 + Math.sin(time * (active ? 5 : 2.4)) * 0.1;
    core.scale.setScalar(pulse);
    core.rotation.y = -time * 0.6;
    coreMat.emissiveIntensity = active ? 3 : 2;
    halo.rotation.set(Math.PI / 2 + Math.sin(time * 0.5) * 0.3, time * 0.3, 0);
    providers.forEach((p, i) => {
      const a = time * 1.1 + (i / 3) * TAU;
      p.position.set(Math.cos(a) * 3.3, 4.6 + Math.sin(a * 2 + i) * 0.5, -6 + Math.sin(a) * 3.3);
      // the provider nearest the front is the "live" one
      p.scale.setScalar(Math.sin(a) > 0.8 ? 1.5 : 1);
    });
    for (let i = 0; i < count; i++) {
      const t = (time * 0.3 + i / count) % 1;
      const a = i * 2.4 + time * 0.8;
      const r = 2.8 * (1 - t);
      dummy.position.set(Math.cos(a) * r, 1.2 + t * 3.4, -6 + Math.sin(a) * r);
      dummy.scale.setScalar(1 - t * 0.6);
      dummy.updateMatrix();
      tokens.setMatrixAt(i, dummy.matrix);
    }
    tokens.instanceMatrix.needsUpdate = true;
  };
}

function buildVault(ctx: Ctx): Update {
  // Vault: the door swings open when you arrive. Pulse: a heartbeat above it.
  const steel = solidMat(0x334155, { metalness: 0.7, roughness: 0.35 });
  add(ctx, box(9, 6.4, 4, steel), 0, 3.2, -7.5);
  collide(ctx, 0, 3.2, -7.5, 9, 6.4, 4);
  add(ctx, mesh(new THREE.CircleGeometry(2.3, 40), glowMat(0xfbbf24, 1.1), false), 0, 3.1, -5.48);
  for (let i = 0; i < 3; i++) add(ctx, box(1.3 - i * 0.3, 0.4, 0.4, solidMat(0xfbbf24, { metalness: 0.9, roughness: 0.2, emissive: 0xfbbf24, emissiveIntensity: 0.4 })), 0, 2.2 + i * 0.42, -5.3);

  const hinge = add(ctx, new THREE.Group(), -2.5, 3.1, -5.3);
  const door = mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.5, 40), solidMat(0x64748b, { metalness: 0.8, roughness: 0.3, flatShading: false }));
  door.rotation.x = Math.PI / 2;
  door.position.x = 2.5;
  hinge.add(door);
  const wheel = new THREE.Group();
  wheel.add(mesh(new THREE.TorusGeometry(1, 0.12, 8, 28), solidMat(0xe2e8f0, { metalness: 0.9, roughness: 0.2, flatShading: false })));
  for (let i = 0; i < 3; i++) {
    const spoke = box(2, 0.14, 0.14, solidMat(0xe2e8f0, { metalness: 0.9, roughness: 0.2 }));
    spoke.rotation.z = (i / 3) * Math.PI;
    wheel.add(spoke);
  }
  wheel.position.set(2.5, 0, 0.36);
  hinge.add(wheel);

  const count = 48;
  const pulse = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), glowMat(0x5eead4, 3), count);
  pulse.frustumCulled = false;
  ctx.group.add(pulse);
  const dummy = new THREE.Object3D();
  const beat = (u: number): number => {
    const p = ((u % 1) + 1) % 1;
    if (p > 0.38 && p < 0.44) return (p - 0.38) * 22;
    if (p >= 0.44 && p < 0.5) return 1.32 - (p - 0.44) * 45;
    if (p >= 0.5 && p < 0.55) return -1.38 + (p - 0.5) * 27.6;
    return Math.sin(p * TAU * 2) * 0.06;
  };
  let open = 0;

  return (time, dt, active) => {
    open += ((active ? 1 : 0) - open) * Math.min(1, dt * 2.2);
    hinge.rotation.y = -open * 1.9;
    wheel.rotation.z = time * 0.5 + open * 4;
    for (let i = 0; i < count; i++) {
      const u = i / count;
      dummy.position.set(-4.3 + u * 8.6, 7.3 + beat(u * 2 - time * 0.45) * 0.7, -6.4);
      dummy.updateMatrix();
      pulse.setMatrixAt(i, dummy.matrix);
    }
    pulse.instanceMatrix.needsUpdate = true;
  };
}

function buildContact(ctx: Ctx): Update {
  // a beacon sending out rings
  add(ctx, mesh(new THREE.CylinderGeometry(1.6, 2.2, 0.8, 8), solidMat(PALETTE.steel)), 0, 0.4, -6);
  add(ctx, mesh(new THREE.CylinderGeometry(0.12, 0.5, 7, 8), solidMat(0xcbd5e1, { metalness: 0.6, roughness: 0.3 })), 0, 4.3, -6);
  collide(ctx, 0, 2, -6, 3.6, 4, 3.6);
  const tip = add(ctx, mesh(new THREE.SphereGeometry(0.42, 16, 12), glowMat(PALETTE.teal, 3.4), false), 0, 8, -6);
  const rings = [0, 1, 2].map(() => {
    const material = new THREE.MeshBasicMaterial({ color: PALETTE.teal, transparent: true, opacity: 0.8, depthWrite: false });
    const ring = add(ctx, new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 48), material), 0, 8, -6);
    ring.rotation.x = Math.PI / 2;
    return { ring, material };
  });
  const envelope = add(ctx, box(2.2, 1.4, 0.2, solidMat(0xf1f5f9, { emissive: 0xffffff, emissiveIntensity: 0.15 })), 5.4, 2.2, -3.4);
  const flap = mesh(new THREE.ConeGeometry(1.1, 0.7, 3), solidMat(0xcbd5e1));
  flap.rotation.set(0, Math.PI / 6, Math.PI);
  flap.scale.z = 0.12;
  flap.position.set(0, 0.36, 0.12);
  envelope.add(flap);

  return (time) => {
    tip.scale.setScalar(1 + Math.sin(time * 4) * 0.18);
    rings.forEach(({ ring, material }, i) => {
      const t = (time * 0.4 + i / 3) % 1;
      ring.scale.setScalar(0.6 + t * 6);
      material.opacity = (1 - t) * 0.7;
    });
    envelope.position.y = 2.2 + Math.sin(time * 1.7) * 0.3;
    envelope.rotation.y = Math.sin(time * 0.8) * 0.5;
  };
}

const BUILDERS: Record<ZoneKind, (ctx: Ctx) => Update> = {
  start: buildStart,
  consulting: buildConsulting,
  integration: buildIntegration,
  security: buildSecurity,
  markets: buildMarkets,
  cloud: buildCloud,
  ai: buildAi,
  vault: buildVault,
  contact: buildContact,
};

/** Signs sit at different heights so they clear each landmark. */
const SIGN_Y: Record<ZoneKind, number> = {
  start: 0,
  consulting: 6.9,
  integration: 7.3,
  security: 7.7,
  markets: 7.2,
  cloud: 6.2,
  ai: 8.1,
  vault: 8.7,
  contact: 5.6,
};

/** A few signs sit off-centre so they do not cover the landmark. */
const SIGN_X: Partial<Record<ZoneKind, number>> = { cloud: -3.4, contact: -6 };

export function buildZone(zone: Zone, scene: THREE.Scene, physics: Physics, font: Font): ZoneView {
  const group = new THREE.Group();
  group.position.set(zone.x, 0, zone.z);
  scene.add(group);
  const color = new THREE.Color(zone.color);
  const ctx: Ctx = { zone, group, scene, physics, font, color };

  const ringMat = glowMat(color, 0.8);
  ringMat.side = THREE.DoubleSide;
  const ring = new THREE.Mesh(new THREE.RingGeometry(zone.radius - 0.18, zone.radius, 72), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(zone.radius - 0.18, 72),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.05, depthWrite: false }),
  );
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.04;
  group.add(fill);

  let sign: THREE.Mesh | null = null;
  if (zone.kind !== 'start') {
    sign = labelMesh(
      [
        { text: zone.title, size: 76, weight: 700, color: '#f4f7fb' },
        { text: zone.kind === 'contact' ? zone.period : `${zone.subtitle}  ·  ${zone.period}`, size: 32, color: '#9fb3c8' },
      ],
      zone.color,
      1.9,
    );
    sign.position.set(SIGN_X[zone.kind] ?? 0, SIGN_Y[zone.kind], -6);
    sign.rotation.x = -0.18;
    group.add(sign);
  }

  const inner = BUILDERS[zone.kind](ctx);
  let glow = 0;
  const baseY = SIGN_Y[zone.kind];

  return {
    zone,
    update(time, dt, active) {
      glow += ((active ? 1 : 0) - glow) * Math.min(1, dt * 4);
      ringMat.emissiveIntensity = 0.7 + glow * 0.7 + Math.sin(time * 3) * 0.2 * glow;
      ring.scale.setScalar(1 + glow * 0.03 * Math.sin(time * 3));
      fill.material.opacity = 0.05 + glow * 0.08;
      if (sign) sign.position.y = baseY + Math.sin(time * 1.2 + zone.x) * 0.15;
      inner(time, dt, active);
    },
  };
}
