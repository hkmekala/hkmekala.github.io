import gsap from 'gsap';
import * as THREE from 'three';
import type { Zone } from '../data/site';
import { glowMat, labelSprite } from './kit';

interface Token {
  group: THREE.Group;
  gem: THREE.Mesh;
  name: string;
  taken: boolean;
  phase: number;
}

const REACH = 1.5;

/** Floating tech chips around each zone. Roll into one to collect it. */
export class Tokens {
  readonly total: number;
  collected = 0;
  private readonly items: Token[] = [];
  private readonly sparkGeometry = new THREE.OctahedronGeometry(0.12);

  constructor(
    private readonly scene: THREE.Scene,
    zones: readonly Zone[],
  ) {
    const gemGeometry = new THREE.OctahedronGeometry(0.42);
    for (const zone of zones) {
      const n = zone.tech.length;
      zone.tech.forEach((name, i) => {
        // spread along the front arc of the zone, facing the camera
        const angle = Math.PI * (0.12 + (0.76 * (i + 0.5)) / n);
        const group = new THREE.Group();
        group.position.set(zone.x + Math.cos(angle) * 7.4, 1.1, zone.z + Math.sin(angle) * 7.4);
        const gem = new THREE.Mesh(gemGeometry, glowMat(zone.color, 1.25));
        group.add(gem);
        const label = labelSprite(name, zone.color, 0.62);
        label.position.y = 1.05;
        group.add(label);
        scene.add(group);
        this.items.push({ group, gem, name, taken: false, phase: i * 0.9 });
      });
    }
    this.total = this.items.length;
  }

  /** Returns the names collected this frame. */
  update(time: number, player: THREE.Vector3): string[] {
    const got: string[] = [];
    for (const token of this.items) {
      if (token.taken) continue;
      token.gem.rotation.y = time * 1.6 + token.phase;
      token.gem.position.y = Math.sin(time * 2 + token.phase) * 0.16;
      const p = token.group.position;
      if (Math.hypot(p.x - player.x, p.z - player.z) < REACH && Math.abs(p.y - player.y) < 2.4) {
        token.taken = true;
        this.collected++;
        got.push(token.name);
        this.pop(token);
      }
    }
    return got;
  }

  private pop(token: Token): void {
    const { group, gem } = token;
    gsap.to(group.position, { y: group.position.y + 2.2, duration: 0.5, ease: 'power2.out' });
    gsap.to(group.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5,
      ease: 'back.in(2)',
      onComplete: () => {
        this.scene.remove(group);
      },
    });
    for (let i = 0; i < 8; i++) {
      const spark = new THREE.Mesh(this.sparkGeometry, gem.material);
      spark.position.copy(group.position);
      this.scene.add(spark);
      const angle = (i / 8) * Math.PI * 2;
      gsap.to(spark.position, {
        x: spark.position.x + Math.cos(angle) * 2.2,
        y: spark.position.y + 1.2 + (i % 2),
        z: spark.position.z + Math.sin(angle) * 2.2,
        duration: 0.6,
        ease: 'power2.out',
      });
      gsap.to(spark.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.6,
        ease: 'power1.in',
        onComplete: () => {
          this.scene.remove(spark);
        },
      });
    }
  }
}
