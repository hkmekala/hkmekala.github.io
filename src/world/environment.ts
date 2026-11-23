import * as THREE from 'three';
import type { Zone } from '../data/site';
import { box, circuitTextures, glowMat, mesh, PALETTE, solidMat } from './kit';
import type { Physics } from './physics';
import { seededRandom } from './zoneLogic';

export const BOARD = { halfX: 60, halfZ: 66, centerZ: -2, thickness: 3 };

export interface Animated {
  update(time: number, dt: number): void;
}

/** Gradient sky dome plus stars. */
export function createSky(scene: THREE.Scene): Animated {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(420, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x050818) },
        mid: { value: new THREE.Color(0x1a1550) },
        low: { value: new THREE.Color(0x0f4a5c) },
      },
      vertexShader: 'varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'varying vec3 vPos; uniform vec3 top; uniform vec3 mid; uniform vec3 low;' +
        'void main(){ float h = normalize(vPos).y; vec3 c = mix(low, mid, smoothstep(-0.25, 0.12, h)); c = mix(c, top, smoothstep(0.1, 0.7, h)); gl_FragColor = vec4(c, 1.0); }',
    }),
  );
  scene.add(sky);

  const rand = seededRandom(9);
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 1.5 - 0.5);
    const r = 380;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xcfe4ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false }),
  );
  scene.add(stars);

  return {
    update(time) {
      stars.rotation.y = time * 0.004;
    },
  };
}

/** The circuit-board island: ground, glowing rim, underside, floating debris. */
export function createBoard(scene: THREE.Scene, physics: Physics, zones: readonly Zone[]): Animated {
  const { halfX, halfZ, centerZ, thickness } = BOARD;
  const textures = circuitTextures();
  const top = solidMat(0xffffff, {
    map: textures.map,
    emissive: 0xffffff,
    emissiveMap: textures.glow,
    emissiveIntensity: 0.55,
    flatShading: false,
    roughness: 0.85,
  });
  const side = solidMat(PALETTE.boardEdge);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(halfX * 2, thickness, halfZ * 2), [side, side, top, side, side, side]);
  ground.position.set(0, -thickness / 2, centerZ);
  ground.receiveShadow = true;
  scene.add(ground);
  physics.addStaticBox(0, -thickness / 2, centerZ, halfX * 2, thickness, halfZ * 2);

  // glowing rim
  const rimMat = glowMat(PALETTE.teal, 1.6);
  const rims: [number, number, number, number][] = [
    [0, centerZ - halfZ, halfX * 2, 0.3],
    [0, centerZ + halfZ, halfX * 2, 0.3],
    [-halfX, centerZ, 0.3, halfZ * 2],
    [halfX, centerZ, 0.3, halfZ * 2],
  ];
  for (const [x, z, w, d] of rims) {
    const rim = box(w, 0.16, d, rimMat);
    rim.position.set(x, 0.08, z);
    rim.castShadow = false;
    scene.add(rim);
  }

  // underside: stepped layers so it reads as a floating slab
  const under = solidMat(0x0a1230);
  [0.86, 0.66, 0.42].forEach((scale, i) => {
    const layer = box(halfX * 2 * scale, 5, halfZ * 2 * scale, under);
    layer.position.set(0, -thickness - 2.5 - i * 5, centerZ);
    layer.castShadow = false;
    scene.add(layer);
  });
  const core = mesh(new THREE.ConeGeometry(9, 18, 6), glowMat(PALETTE.teal, 0.9), false);
  core.rotation.x = Math.PI;
  core.position.set(0, -thickness - 22, centerZ);
  scene.add(core);

  // surface components: flat chips you roll over, tall capacitors you bump into
  const rand = seededRandom(1234);
  const chipGeometry = new THREE.BoxGeometry(1, 1, 1);
  const chips = new THREE.InstancedMesh(chipGeometry, solidMat(0x05080f, { roughness: 0.35, metalness: 0.3 }), 44);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < chips.count; i++) {
    // keep chips out of the zones so the rings stay clean
    do {
      dummy.position.set((rand() * 2 - 1) * (halfX - 3), 0.06, centerZ + (rand() * 2 - 1) * (halfZ - 3));
    } while (zones.some((zone) => Math.hypot(zone.x - dummy.position.x, zone.z - dummy.position.z) < zone.radius + 2.5));
    dummy.scale.set(1.2 + rand() * 2.4, 0.12, 1.2 + rand() * 2);
    dummy.rotation.y = rand() < 0.5 ? 0 : Math.PI / 2;
    dummy.updateMatrix();
    chips.setMatrixAt(i, dummy.matrix);
  }
  chips.receiveShadow = true;
  scene.add(chips);

  // debris floating around the island
  const debrisMat = solidMat(0x121c40);
  const debris: THREE.Mesh[] = [];
  for (let i = 0; i < 26; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 95 + rand() * 80;
    const piece = box(3 + rand() * 9, 0.8 + rand() * 1.4, 3 + rand() * 9, debrisMat);
    piece.position.set(Math.cos(angle) * dist, -18 + rand() * 40, centerZ + Math.sin(angle) * dist);
    piece.rotation.set(rand() * 0.6, rand() * Math.PI, rand() * 0.6);
    piece.castShadow = false;
    piece.userData.phase = rand() * Math.PI * 2;
    piece.userData.baseY = piece.position.y;
    scene.add(piece);
    debris.push(piece);
  }

  return {
    update(time) {
      core.rotation.y = time * 0.3;
      for (const piece of debris) {
        piece.position.y = Number(piece.userData.baseY) + Math.sin(time * 0.4 + Number(piece.userData.phase)) * 1.6;
        piece.rotation.y += 0.0008;
      }
    },
  };
}

/** Tall capacitors scattered away from the zones and the road. */
export function createObstacles(scene: THREE.Scene, physics: Physics, zones: readonly Zone[], curve: THREE.Curve<THREE.Vector3>): void {
  const rand = seededRandom(77);
  const samples = curve.getSpacedPoints(120);
  const bodyMat = solidMat(0x1d2a57, { flatShading: false, metalness: 0.4, roughness: 0.4 });
  const capMat = solidMat(0xb9c4dc, { flatShading: false, metalness: 0.6, roughness: 0.3 });
  let placed = 0;
  let guard = 0;
  while (placed < 18 && guard++ < 600) {
    const x = (rand() * 2 - 1) * (BOARD.halfX - 5);
    const z = BOARD.centerZ + (rand() * 2 - 1) * (BOARD.halfZ - 5);
    const nearZone = zones.some((zone) => Math.hypot(zone.x - x, zone.z - z) < zone.radius + 5);
    const nearRoad = samples.some((p) => Math.hypot(p.x - x, p.z - z) < 4.5);
    if (nearZone || nearRoad) continue;
    const r = 0.7 + rand() * 0.7;
    const h = 1.8 + rand() * 2.4;
    const can = mesh(new THREE.CylinderGeometry(r, r, h, 18), bodyMat);
    can.position.set(x, h / 2, z);
    scene.add(can);
    const cap = mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.12, 18), capMat);
    cap.position.set(x, h + 0.06, z);
    scene.add(cap);
    physics.addStaticBox(x, h / 2, z, r * 1.7, h, r * 1.7);
    placed++;
  }
}

/** The road: a glowing trace through every zone, with data packets flowing along it. */
export function createRoad(scene: THREE.Scene, zones: readonly Zone[]): { curve: THREE.CatmullRomCurve3; animated: Animated } {
  const curve = new THREE.CatmullRomCurve3(
    zones.map((zone) => new THREE.Vector3(zone.x, 0, zone.z)),
    false,
    'catmullrom',
    0.5,
  );
  const steps = 400;
  const points = curve.getSpacedPoints(steps);

  const ribbon = (width: number, y: number, material: THREE.Material): THREE.Mesh => {
    const positions: number[] = [];
    const indices: number[] = [];
    points.forEach((p, i) => {
      const next = points[Math.min(i + 1, steps)];
      const prev = points[Math.max(i - 1, 0)];
      const dir = new THREE.Vector3().subVectors(next, prev).normalize();
      const nx = -dir.z * (width / 2);
      const nz = dir.x * (width / 2);
      positions.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz);
      if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const m = new THREE.Mesh(geometry, material);
    m.receiveShadow = true;
    return m;
  };

  scene.add(ribbon(2.6, 0.02, new THREE.MeshStandardMaterial({ color: 0x13224d, roughness: 0.6, side: THREE.DoubleSide })));
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x05070f, emissive: PALETTE.teal, emissiveIntensity: 0.9, side: THREE.DoubleSide });
  scene.add(ribbon(0.22, 0.04, edgeMat));

  const packetCount = 46;
  const packets = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), glowMat(0xa5f3fc, 2.6), packetCount);
  packets.frustumCulled = false;
  scene.add(packets);
  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3();
  const ahead = new THREE.Vector3();

  return {
    curve,
    animated: {
      update(time) {
        for (let i = 0; i < packetCount; i++) {
          const lane = i % 2 === 0 ? 0.75 : -0.75;
          const speed = i % 2 === 0 ? 0.016 : -0.012;
          const t = (((i / packetCount + time * speed) % 1) + 1) % 1;
          curve.getPointAt(t, point);
          curve.getPointAt(Math.min(t + 0.003, 1), ahead);
          const dx = ahead.x - point.x;
          const dz = ahead.z - point.z;
          const len = Math.hypot(dx, dz) || 1;
          dummy.position.set(point.x + (-dz / len) * lane, 0.12, point.z + (dx / len) * lane);
          dummy.rotation.y = Math.atan2(dx, dz);
          dummy.updateMatrix();
          packets.setMatrixAt(i, dummy.matrix);
        }
        packets.instanceMatrix.needsUpdate = true;
      },
    },
  };
}
