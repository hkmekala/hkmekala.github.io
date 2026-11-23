import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import type { Controls } from './controls';
import { glowMat, mesh, PALETTE, solidMat } from './kit';
import type { Physics } from './physics';
import { angleDelta } from './zoneLogic';

const RADIUS = 0.7;
const SPEED = 11;
const BOOST = 1.7;
const JUMP = 10.5;
const TRAIL = 22;

/** The panda in its hover pod. Physics is a sphere; the model is just for show. */
export class Player {
  readonly group = new THREE.Group();
  readonly body: CANNON.Body;
  readonly position = new THREE.Vector3();
  speed = 0;
  private readonly model = new THREE.Group();
  private readonly ring: THREE.Mesh;
  private readonly trail: THREE.Mesh[] = [];
  private trailIndex = 0;
  private trailTimer = 0;
  private heading = 0;
  private squash = 0;
  private wasGrounded = true;

  constructor(
    private readonly physics: Physics,
    scene: THREE.Scene,
    spawn: THREE.Vector3,
  ) {
    this.body = new CANNON.Body({
      mass: 4,
      material: physics.playerMaterial,
      shape: new CANNON.Sphere(RADIUS),
      position: new CANNON.Vec3(spawn.x, spawn.y, spawn.z),
      fixedRotation: true,
      allowSleep: false,
    });
    this.body.updateMassProperties();
    physics.world.addBody(this.body);

    const white = solidMat(PALETTE.white, { flatShading: false, roughness: 0.6 });
    const black = solidMat(PALETTE.ink, { flatShading: false, roughness: 0.5 });
    const sphere = (r: number, material: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): THREE.Mesh => {
      const m = mesh(new THREE.SphereGeometry(r, 20, 16), material);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      this.model.add(m);
      return m;
    };

    // pod
    const pod = mesh(new THREE.SphereGeometry(0.78, 24, 16, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), solidMat(0x14b8a6, { flatShading: false, metalness: 0.35, roughness: 0.35 }));
    pod.position.y = 0.12;
    this.model.add(pod);
    const rim = mesh(new THREE.TorusGeometry(0.76, 0.07, 10, 32), solidMat(0xe2f6f3, { flatShading: false, metalness: 0.5, roughness: 0.3 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.32;
    this.model.add(rim);
    this.ring = mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 28), glowMat(PALETTE.teal, 3.2), false);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = -0.52;
    this.model.add(this.ring);

    // panda (faces +z in model space)
    sphere(0.46, white, 0, 0.56, 0, 1, 0.95, 0.95); // body
    sphere(0.42, white, 0, 1.14, 0.04, 1.08, 0.95, 1); // head
    sphere(0.15, black, -0.31, 1.5, 0); // ears
    sphere(0.15, black, 0.31, 1.5, 0);
    sphere(0.13, black, -0.17, 1.2, 0.36, 1, 1.25, 0.5); // eye patches
    sphere(0.13, black, 0.17, 1.2, 0.36, 1, 1.25, 0.5);
    sphere(0.045, white, -0.16, 1.22, 0.43);
    sphere(0.045, white, 0.16, 1.22, 0.43);
    sphere(0.06, black, 0, 1.07, 0.45, 1.2, 0.8, 0.8); // nose
    sphere(0.16, black, -0.44, 0.62, 0.16, 0.8, 1.3, 0.8); // arms
    sphere(0.16, black, 0.44, 0.62, 0.16, 0.8, 1.3, 0.8);

    // antenna
    const stalk = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), solidMat(0xb6c2d6));
    stalk.position.set(-0.5, 0.6, -0.42);
    this.model.add(stalk);
    const tip = mesh(new THREE.SphereGeometry(0.07, 10, 8), glowMat(0xfbbf24, 3), false);
    tip.position.set(-0.5, 0.88, -0.42);
    this.model.add(tip);

    this.model.position.y = -0.15;
    this.group.add(this.model);
    this.group.scale.setScalar(1.2);
    scene.add(this.group);

    const trailGeometry = new THREE.SphereGeometry(0.16, 8, 6);
    for (let i = 0; i < TRAIL; i++) {
      const dot = new THREE.Mesh(trailGeometry, glowMat(PALETTE.teal, 2.4));
      dot.visible = false;
      scene.add(dot);
      this.trail.push(dot);
    }
    this.position.copy(spawn);
  }

  teleport(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.body.velocity.setZero();
  }

  update(dt: number, time: number, controls: Controls): void {
    const body = this.body;
    const grounded = this.physics.isGrounded(body);
    const axis = controls.axis();
    const moving = Math.hypot(axis.x, axis.z) > 0.05;
    const top = SPEED * (controls.boosting ? BOOST : 1);

    // ease the horizontal velocity towards where the stick points
    const rate = moving ? (grounded ? 7 : 2.5) : grounded ? 5 : 0.4;
    const blend = 1 - Math.exp(-rate * dt);
    body.velocity.x += (axis.x * top - body.velocity.x) * blend;
    body.velocity.z += (axis.z * top - body.velocity.z) * blend;

    if (controls.consumeJump() && grounded) {
      body.velocity.y = JUMP;
      this.squash = -0.35;
    }
    if (grounded && !this.wasGrounded) this.squash = 0.3;
    this.wasGrounded = grounded;

    this.position.set(body.position.x, body.position.y, body.position.z);
    this.speed = Math.hypot(body.velocity.x, body.velocity.z);

    // model: face the way we travel, lean into it, bob on the hover ring
    if (this.speed > 0.6) {
      const target = Math.atan2(body.velocity.x, body.velocity.z);
      this.heading += angleDelta(this.heading, target) * (1 - Math.exp(-10 * dt));
    }
    this.squash += (0 - this.squash) * (1 - Math.exp(-9 * dt));
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
    this.model.rotation.x = Math.min(this.speed / SPEED, 1.6) * 0.22;
    this.model.position.y = -0.15 + Math.sin(time * 3.2) * 0.06;
    this.model.scale.set(1 + this.squash * 0.5, 1 - this.squash, 1 + this.squash * 0.5);
    this.ring.scale.setScalar(1 + Math.sin(time * 9) * 0.06 + (controls.boosting ? 0.25 : 0));

    // trail
    this.trailTimer -= dt;
    if (this.speed > 3 && this.trailTimer <= 0) {
      this.trailTimer = controls.boosting ? 0.025 : 0.05;
      const dot = this.trail[this.trailIndex];
      this.trailIndex = (this.trailIndex + 1) % TRAIL;
      if (dot) {
        dot.visible = true;
        dot.position.set(this.position.x, this.position.y - 0.45, this.position.z);
        dot.scale.setScalar(controls.boosting ? 1.5 : 1);
      }
    }
    for (const dot of this.trail) {
      if (!dot.visible) continue;
      dot.scale.multiplyScalar(Math.exp(-3.4 * dt));
      if (dot.scale.x < 0.08) dot.visible = false;
    }
  }
}
