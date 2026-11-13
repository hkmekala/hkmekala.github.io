import * as THREE from 'three';
import { seededRandom } from './zoneLogic';

/** Small building blocks shared by everything in the world. */

export const PALETTE = {
  navy: 0x0a1026,
  board: 0x0d1838,
  boardEdge: 0x16264f,
  teal: 0x5eead4,
  steel: 0x2a3558,
  dark: 0x111933,
  white: 0xf4f7fb,
  ink: 0x10131c,
};

export const FONT_STACK = '"Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif';

export function solidMat(
  color: THREE.ColorRepresentation,
  opts: THREE.MeshStandardMaterialParameters = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08, flatShading: true, ...opts });
}

/** A material that glows through the bloom pass. */
export function glowMat(color: THREE.ColorRepresentation, intensity = 2.2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x05070f,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0,
  });
}

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, shadows = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

export function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(w, h, d), material);
}

export interface LabelLine {
  text: string;
  size: number;
  color?: string;
  weight?: number;
}

interface LabelTexture {
  texture: THREE.CanvasTexture;
  aspect: number;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return ctx;
}

/** Draws lines of text on a rounded panel and returns it as a texture. */
export function labelTexture(lines: LabelLine[], accent: string, panel = true): LabelTexture {
  const canvas = document.createElement('canvas');
  const ctx = context2d(canvas);
  const pad = 36;
  const gap = 1.28;
  const fontOf = (line: LabelLine): string => `${line.weight ?? 600} ${line.size}px ${FONT_STACK}`;

  let width = 0;
  let height = pad * 2;
  for (const line of lines) {
    ctx.font = fontOf(line);
    width = Math.max(width, ctx.measureText(line.text).width);
    height += line.size * gap;
  }
  canvas.width = Math.ceil(width + pad * 2);
  canvas.height = Math.ceil(height);

  if (panel) {
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 28);
    ctx.fillStyle = 'rgba(7, 12, 30, 0.9)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = accent;
    ctx.stroke();
  }

  let y = pad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const line of lines) {
    ctx.font = fontOf(line);
    ctx.fillStyle = line.color ?? '#dbe6f3';
    ctx.fillText(line.text, canvas.width / 2, y + line.size * 0.12);
    y += line.size * gap;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { texture, aspect: canvas.width / canvas.height };
}

/** A flat sign in the world. `height` is in world units. */
export function labelMesh(lines: LabelLine[], accent: string, height: number, panel = true): THREE.Mesh {
  const { texture, aspect } = labelTexture(lines, accent, panel);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), material);
}

/** A small label that always faces the camera. */
export function labelSprite(text: string, accent: string, height: number): THREE.Sprite {
  const { texture, aspect } = labelTexture([{ text, size: 44, weight: 600 }], accent);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(height * aspect, height, 1);
  return sprite;
}

/** The printed-circuit pattern for the ground. Returns colour and glow maps. */
export function circuitTextures(): { map: THREE.CanvasTexture; glow: THREE.CanvasTexture } {
  const size = 2048;
  const base = document.createElement('canvas');
  const glow = document.createElement('canvas');
  base.width = base.height = glow.width = glow.height = size;
  const b = context2d(base);
  const g = context2d(glow);
  const rand = seededRandom(42);

  b.fillStyle = '#0c1634';
  b.fillRect(0, 0, size, size);
  g.fillStyle = '#000';
  g.fillRect(0, 0, size, size);

  // faint grid
  b.strokeStyle = 'rgba(94, 234, 212, 0.05)';
  b.lineWidth = 2;
  for (let i = 0; i <= size; i += 64) {
    b.beginPath();
    b.moveTo(i, 0);
    b.lineTo(i, size);
    b.moveTo(0, i);
    b.lineTo(size, i);
    b.stroke();
  }

  // traces: straight runs with 45 degree bends, ending in solder pads
  for (let i = 0; i < 150; i++) {
    let x = Math.round((rand() * size) / 32) * 32;
    let y = Math.round((rand() * size) / 32) * 32;
    const lit = rand() < 0.22;
    const points: [number, number][] = [[x, y]];
    let dir = Math.floor(rand() * 4);
    const segments = 2 + Math.floor(rand() * 4);
    for (let s = 0; s < segments; s++) {
      const len = 64 + Math.floor(rand() * 6) * 32;
      const dx = [1, 0, -1, 0][dir] ?? 0;
      const dy = [0, 1, 0, -1][dir] ?? 0;
      x += dx * len;
      y += dy * len;
      points.push([x, y]);
      const turn = rand() < 0.5 ? 1 : 3;
      const next = (dir + turn) % 4;
      const ndx = [1, 0, -1, 0][next] ?? 0;
      const ndy = [0, 1, 0, -1][next] ?? 0;
      x += (dx + ndx) * 32;
      y += (dy + ndy) * 32;
      points.push([x, y]);
      dir = next;
    }
    for (const ctx of lit ? [b, g] : [b]) {
      ctx.lineWidth = lit ? 5 : 6;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = ctx === g ? '#2a9d8f' : lit ? '#1e6f78' : '#15264f';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      points.forEach(([px, py], index) => (index === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.stroke();
      for (const [px, py] of [points[0], points[points.length - 1]]) {
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const map = new THREE.CanvasTexture(base);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const glowTexture = new THREE.CanvasTexture(glow);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  glowTexture.anisotropy = 8;
  return { map, glow: glowTexture };
}
