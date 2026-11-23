import * as CANNON from 'cannon-es';
import type * as THREE from 'three';

interface Synced {
  mesh: THREE.Object3D;
  body: CANNON.Body;
  home: CANNON.Vec3;
  homeRotation: CANNON.Quaternion;
}

const FALL_LIMIT = -30;

/** Thin wrapper over cannon-es: one world, a few materials, mesh syncing. */
export class Physics {
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -24, 0) });
  readonly groundMaterial = new CANNON.Material('ground');
  readonly playerMaterial = new CANNON.Material('player');
  readonly propMaterial = new CANNON.Material('prop');
  private readonly synced: Synced[] = [];

  constructor() {
    this.world.allowSleep = true;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    const contact = (a: CANNON.Material, b: CANNON.Material, friction: number, restitution: number): void => {
      this.world.addContactMaterial(new CANNON.ContactMaterial(a, b, { friction, restitution }));
    };
    contact(this.playerMaterial, this.groundMaterial, 0.02, 0.05);
    contact(this.playerMaterial, this.propMaterial, 0.1, 0.25);
    contact(this.propMaterial, this.groundMaterial, 0.5, 0.2);
    contact(this.propMaterial, this.propMaterial, 0.4, 0.15);
  }

  /** A box that never moves: ground, walls, buildings. */
  addStaticBox(x: number, y: number, z: number, w: number, h: number, d: number): CANNON.Body {
    const body = new CANNON.Body({
      mass: 0,
      material: this.groundMaterial,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      position: new CANNON.Vec3(x, y, z),
    });
    this.world.addBody(body);
    return body;
  }

  /** A box you can knock around. The mesh follows the body every frame. */
  addProp(mesh: THREE.Object3D, w: number, h: number, d: number, mass: number): CANNON.Body {
    const body = new CANNON.Body({
      mass,
      material: this.propMaterial,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
      linearDamping: 0.15,
      angularDamping: 0.3,
      allowSleep: true,
      sleepSpeedLimit: 0.3,
      sleepTimeLimit: 0.6,
    });
    this.world.addBody(body);
    this.synced.push({ mesh, body, home: body.position.clone(), homeRotation: body.quaternion.clone() });
    return body;
  }

  step(dt: number): void {
    this.world.step(1 / 60, dt, 3);
    for (const item of this.synced) {
      const { body, mesh } = item;
      if (body.position.y < FALL_LIMIT) {
        body.position.copy(item.home);
        body.quaternion.copy(item.homeRotation);
        body.velocity.setZero();
        body.angularVelocity.setZero();
      }
      mesh.position.set(body.position.x, body.position.y, body.position.z);
      mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    }
  }

  /** True when the body is resting on something below it. */
  isGrounded(body: CANNON.Body): boolean {
    for (const c of this.world.contacts) {
      if (c.bi === body && -c.ni.y > 0.5) return true;
      if (c.bj === body && c.ni.y > 0.5) return true;
    }
    return false;
  }
}
