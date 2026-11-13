import { clampAxis, type Point } from './zoneLogic';

const KEY_AXIS: Record<string, Point> = {
  KeyW: { x: 0, z: -1 },
  ArrowUp: { x: 0, z: -1 },
  KeyS: { x: 0, z: 1 },
  ArrowDown: { x: 0, z: 1 },
  KeyA: { x: -1, z: 0 },
  ArrowLeft: { x: -1, z: 0 },
  KeyD: { x: 1, z: 0 },
  ArrowRight: { x: 1, z: 0 },
};

/** Keyboard plus an on-screen stick for touch. */
export class Controls {
  enabled = false;
  private readonly held = new Set<string>();
  private stick: Point = { x: 0, z: 0 };
  private jumpQueued = false;
  private resetQueued = false;
  private readonly cleanups: (() => void)[] = [];

  constructor(stickEl: HTMLElement, knobEl: HTMLElement, jumpEl: HTMLElement) {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!this.enabled) return;
      // leave Space and arrows alone when a button or link has focus
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      if (e.code in KEY_AXIS || e.code === 'Space') e.preventDefault();
      if (e.code === 'Space' && !e.repeat) this.jumpQueued = true;
      if (e.code === 'KeyR' && !e.repeat) this.resetQueued = true;
      this.held.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      this.held.delete(e.code);
    };
    const onBlur = (): void => this.held.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    });

    const moveStick = (e: PointerEvent): void => {
      const rect = stickEl.getBoundingClientRect();
      const half = rect.width / 2;
      const raw = clampAxis((e.clientX - rect.left - half) / half, (e.clientY - rect.top - half) / half);
      this.stick = raw;
      knobEl.style.transform = `translate(${raw.x * half * 0.6}px, ${raw.z * half * 0.6}px)`;
    };
    const releaseStick = (): void => {
      this.stick = { x: 0, z: 0 };
      knobEl.style.transform = '';
    };
    stickEl.addEventListener('pointerdown', (e) => {
      stickEl.setPointerCapture(e.pointerId);
      moveStick(e);
    });
    stickEl.addEventListener('pointermove', (e) => {
      if (stickEl.hasPointerCapture(e.pointerId)) moveStick(e);
    });
    stickEl.addEventListener('pointerup', releaseStick);
    stickEl.addEventListener('pointercancel', releaseStick);
    jumpEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.jumpQueued = true;
    });
  }

  /** Direction the player wants to go, length 0..1. */
  axis(): Point {
    if (!this.enabled) return { x: 0, z: 0 };
    let x = this.stick.x;
    let z = this.stick.z;
    for (const code of this.held) {
      const dir = KEY_AXIS[code];
      if (dir) {
        x += dir.x;
        z += dir.z;
      }
    }
    return clampAxis(x, z);
  }

  get boosting(): boolean {
    return this.enabled && (this.held.has('ShiftLeft') || this.held.has('ShiftRight'));
  }

  consumeJump(): boolean {
    const queued = this.jumpQueued && this.enabled;
    this.jumpQueued = false;
    return queued;
  }

  consumeReset(): boolean {
    const queued = this.resetQueued && this.enabled;
    this.resetQueued = false;
    return queued;
  }

  dispose(): void {
    for (const cleanup of this.cleanups) cleanup();
  }
}
