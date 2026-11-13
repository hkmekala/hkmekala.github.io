import gsap from 'gsap';
import './styles.css';
import { profile } from './data/site';
import { animatePlain, renderPlain } from './plain/plain';
import { byId, prefersReducedMotion, splitLetters } from './ui/dom';
import { Hud } from './ui/hud';
import type { World } from './world/World';

type Mode = 'intro' | 'world' | 'plain';

const canvas = byId('world', HTMLCanvasElement);
const intro = byId('intro', HTMLElement);
const plain = byId('plain', HTMLElement);
const enterWorld = byId('enter-world', HTMLButtonElement);
const enterPlain = byId('enter-plain', HTMLButtonElement);
const toPlain = byId('to-plain', HTMLButtonElement);
const progressBar = byId('progress-bar', HTMLDivElement);
const introNote = byId('intro-note', HTMLParagraphElement);

let world: World | null = null;
let entered = false;

function hasWebGL(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function setMode(mode: Mode): void {
  document.body.className = `mode-${mode}`;
  plain.hidden = mode !== 'plain';
  if (mode === 'plain') {
    world?.stop();
    hud.hide();
    window.scrollTo(0, 0);
    animatePlain();
    history.replaceState(null, '', '#resume');
  } else if (mode === 'world') {
    history.replaceState(null, '', location.pathname);
  }
}

const hud = new Hud((zoneId) => world?.travelTo(zoneId));

function showWorld(): void {
  if (!world) return;
  setMode('world');
  hud.show();
  if (entered) {
    world.start();
    return;
  }
  entered = true;
  world.enter();
}

function leaveIntro(next: () => void): void {
  gsap.to(intro, {
    opacity: 0,
    duration: 0.6,
    ease: 'power2.in',
    onComplete: () => {
      intro.hidden = true;
      next();
    },
  });
}

async function loadWorld(): Promise<void> {
  const [{ World }, { Controls }] = await Promise.all([import('./world/World'), import('./world/controls')]);
  await document.fonts.load('700 64px "Space Grotesk"').catch(() => undefined);
  const controls = new Controls(byId('stick', HTMLDivElement), byId('knob', HTMLDivElement), byId('jump', HTMLButtonElement));
  const instance = new World(canvas, controls, {
    onZone: (zone) => hud.setZone(zone),
    onToken: (name, collected, total) => {
      hud.setTokens(collected, total);
      hud.say(collected === total ? 'Full stack collected!' : `+ ${name}`);
    },
    onMoved: () => hud.fadeHint(),
  });
  await instance.init((value) => {
    gsap.to(progressBar, { scaleX: value, duration: 0.4, ease: 'power2.out' });
  });
  world = instance;
  hud.setTokens(0, instance.tokenTotal);
  enterWorld.disabled = false;
  enterWorld.textContent = 'Enter the world';
  gsap.fromTo(enterWorld, { scale: 0.92 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
}

// --- boot -----------------------------------------------------------------

const webgl = hasWebGL();
renderPlain(webgl ? () => (world ? showWorld() : undefined) : null);

const letters = splitLetters(byId('intro-name', HTMLHeadingElement), profile.name);
if (!prefersReducedMotion()) {
  gsap.from('.intro-mascot', { scale: 0, rotate: -20, duration: 1, ease: 'back.out(1.8)' });
  gsap.from(letters, { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.03, ease: 'power4.out', delay: 0.25 });
  gsap.from('#intro .eyebrow, .intro-role, .progress, .intro-actions, .intro-note', { y: 18, opacity: 0, duration: 0.6, stagger: 0.08, delay: 0.6 });
}

enterWorld.addEventListener('click', () => leaveIntro(showWorld));
enterPlain.addEventListener('click', () => leaveIntro(() => setMode('plain')));
toPlain.addEventListener('click', () => setMode('plain'));

const openResumeFromHash = (): void => {
  if (location.hash !== '#resume' || document.body.classList.contains('mode-plain')) return;
  intro.hidden = true;
  setMode('plain');
};
window.addEventListener('hashchange', openResumeFromHash);
openResumeFromHash();

if (webgl) {
  loadWorld().catch((error: unknown) => {
    console.error('World failed to load', error);
    enterWorld.hidden = true;
    introNote.textContent = 'The 3D world could not start on this device, but the résumé view has everything.';
  });
} else {
  enterWorld.hidden = true;
  introNote.textContent = 'This browser cannot run the 3D world, but the résumé view has everything.';
}
