import gsap from 'gsap';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { zones, type Zone } from '../data/site';
import type { Controls } from './controls';
import { BOARD, createBoard, createObstacles, createRoad, createSky, type Animated } from './environment';
import { Physics } from './physics';
import { Player } from './player';
import { Tokens } from './tokens';
import { findActiveZone } from './zoneLogic';
import { buildZone, type ZoneView } from './zones';

export interface WorldEvents {
  onZone(zone: Zone | null): void;
  onToken(name: string, collected: number, total: number): void;
  onMoved(): void;
}

const CAMERA_OFFSET = new THREE.Vector3(0, 10.5, 16);
/** Helvetiker Bold from the three.js examples, served from /public. */
const FONT_URL = '/fonts/helvetiker_bold.typeface.json';
const OVERVIEW = new THREE.Vector3(0, 120, 95);

export class World {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.5, 900);
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly physics = new Physics();
  private readonly timer = new THREE.Timer();
  private readonly sun = new THREE.DirectionalLight(0xdfe8ff, 2.1);
  private readonly animated: Animated[] = [];
  private readonly views: ZoneView[] = [];
  private readonly look = new THREE.Vector3();
  private readonly desired = new THREE.Vector3();
  private player: Player | null = null;
  private tokens: Tokens | null = null;
  private activeZone: Zone | null = null;
  private lastZone: Zone = zones[0];
  private running = false;
  private frame = 0;
  private zoom = 1;
  private moved = false;
  private introDone = false;
  /** 1 = looking at the whole island from above, 0 = following the player. */
  private readonly intro = { value: 1 };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly controls: Controls,
    private readonly events: WorldEvents,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.fog = new THREE.Fog(0x141a4a, 70, 260);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.5, 0.95);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.scene.add(new THREE.HemisphereLight(0x9db8ff, 0x1a1640, 1.15));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const cam = this.sun.shadow.camera;
    cam.left = cam.bottom = -42;
    cam.right = cam.top = 42;
    cam.near = 1;
    cam.far = 140;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);
    const rim = new THREE.DirectionalLight(0x5eead4, 0.55);
    rim.position.set(-30, 20, -40);
    this.scene.add(rim);

    this.resize();
    window.addEventListener('resize', this.resize);
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
  }

  /** Builds the whole scene. `progress` gets 0..1 as work completes. */
  async init(progress: (value: number) => void): Promise<void> {
    progress(0.1);
    const font = await new FontLoader().loadAsync(FONT_URL);
    progress(0.35);
    await this.breathe();

    this.animated.push(createSky(this.scene), createBoard(this.scene, this.physics, zones));
    const road = createRoad(this.scene, zones);
    this.animated.push(road.animated);
    createObstacles(this.scene, this.physics, zones, road.curve);
    progress(0.55);
    await this.breathe();

    for (const zone of zones) this.views.push(buildZone(zone, this.scene, this.physics, font));
    progress(0.8);
    await this.breathe();

    this.tokens = new Tokens(this.scene, zones);
    const start = zones[0];
    this.player = new Player(this.physics, this.scene, new THREE.Vector3(start.x, 1.2, start.z + 2));
    this.look.copy(this.player.position);
    this.camera.position.copy(OVERVIEW);
    this.camera.lookAt(0, 0, BOARD.centerZ);

    // compile shaders up front so the first frame does not stutter
    this.renderer.compile(this.scene, this.camera);
    this.render(0, 0);
    progress(1);
  }

  private breathe(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  /** Fly the camera down from the overview to the player. */
  enter(): void {
    this.start();
    gsap.to(this.intro, {
      value: 0,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2.6,
      ease: 'power3.inOut',
      onComplete: () => {
        this.introDone = true;
        this.controls.enabled = this.running;
      },
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.controls.enabled = this.introDone;
    this.timer.update();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    // hand the keyboard back to the page (Space and arrows scroll the résumé)
    this.controls.enabled = false;
    cancelAnimationFrame(this.frame);
  }

  travelTo(zoneId: string): void {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone || !this.player) return;
    this.player.teleport(zone.x, 1.4, zone.z + 2.5);
    this.lastZone = zone;
  }

  get tokenTotal(): number {
    return this.tokens?.total ?? 0;
  }

  private readonly tick = (): void => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.tick);
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.render(dt, this.timer.getElapsed());
  };

  private render(dt: number, time: number): void {
    const player = this.player;
    if (!player) return;

    if (dt > 0) {
      player.update(dt, time, this.controls);
      this.physics.step(dt);
      if (this.controls.consumeReset() || player.position.y < -18) this.respawn();
    }

    if (!this.moved && player.speed > 2 && this.controls.enabled) {
      this.moved = true;
      this.events.onMoved();
    }

    const zone = findActiveZone({ x: player.position.x, z: player.position.z }, zones);
    if (zone !== this.activeZone) {
      this.activeZone = zone;
      if (zone) this.lastZone = zone;
      this.events.onZone(zone);
    }
    for (const view of this.views) view.update(time, dt, view.zone === this.activeZone);
    for (const item of this.animated) item.update(time, dt);

    const tokens = this.tokens;
    if (tokens && this.controls.enabled) {
      for (const name of tokens.update(time, player.position)) this.events.onToken(name, tokens.collected, tokens.total);
    } else if (tokens) {
      tokens.update(time, OVERVIEW);
    }

    // camera: follow the player, blended with the overview during the intro
    const follow = 1 - Math.exp(-4.5 * dt);
    this.look.lerp(player.position, dt > 0 ? follow : 1);
    this.desired.copy(CAMERA_OFFSET).multiplyScalar(this.zoom).add(this.look);
    const k = this.intro.value;
    this.camera.position.lerpVectors(this.desired, OVERVIEW, k);
    this.camera.lookAt(this.look.x * (1 - k), (this.look.y + 3) * (1 - k), this.look.z * (1 - k) + BOARD.centerZ * k);

    this.sun.position.set(player.position.x + 22, 38, player.position.z + 16);
    this.sun.target.position.copy(player.position);

    this.composer.render();
  }

  private respawn(): void {
    this.player?.teleport(this.lastZone.x, 3, this.lastZone.z + 2.5);
  }

  private readonly onWheel = (e: WheelEvent): void => {
    this.zoom = THREE.MathUtils.clamp(this.zoom + e.deltaY * 0.0008, 0.6, 1.7);
  };

  private readonly resize = (): void => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.resolution.set(width, height);
    this.camera.aspect = width / height;
    // pull the camera back on tall phone screens so landmarks still fit
    this.camera.fov = width < height ? 62 : 50;
    this.camera.updateProjectionMatrix();
  };
}
