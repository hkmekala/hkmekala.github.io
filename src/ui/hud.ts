import gsap from 'gsap';
import { zones, type Zone } from '../data/site';
import { byId, el, isTouch, link } from './dom';

/** Everything drawn over the 3D world: timeline, info card, hints, toasts. */
export class Hud {
  private readonly root = byId('hud', HTMLDivElement);
  private readonly card = byId('card', HTMLElement);
  private readonly hint = byId('hint', HTMLParagraphElement);
  private readonly toast = byId('toast', HTMLDivElement);
  private readonly count = byId('token-count', HTMLSpanElement);
  private readonly stops = new Map<string, HTMLButtonElement>();
  private toastTimer = 0;

  constructor(onTravel: (zoneId: string) => void) {
    const journey = byId('journey', HTMLElement);
    for (const zone of zones) {
      const stop = el('button', { class: 'stop', type: 'button', label: `Go to ${zone.title}` }, [
        el('span', { class: 'stop-dot' }),
        el('span', { class: 'stop-year', text: zone.year }),
        el('span', { class: 'stop-name', text: zone.kind === 'start' ? 'Start' : zone.title }),
      ]);
      stop.style.setProperty('--zone', zone.color);
      stop.addEventListener('click', () => {
        onTravel(zone.id);
        stop.blur();
      });
      journey.append(stop);
      this.stops.set(zone.id, stop);
    }
    this.hint.textContent = isTouch()
      ? 'Drag the stick to move. Roll into a glowing ring to read that chapter.'
      : 'WASD or arrow keys to move · Space to jump · Shift to boost · R to reset';
    this.root.classList.toggle('touch', isTouch());
    // on small screens the card starts collapsed; tap it to read the details
    this.card.addEventListener('click', (e) => {
      if (e.target instanceof HTMLAnchorElement) return;
      this.card.classList.toggle('expanded');
    });
  }

  show(): void {
    this.root.hidden = false;
    gsap.fromTo('.hud-top', { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 1.6, ease: 'power3.out' });
    gsap.fromTo(this.hint, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 2.4 });
    gsap.fromTo('#stick, #jump', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, delay: 2.2, stagger: 0.1, ease: 'back.out(2)' });
  }

  hide(): void {
    this.root.hidden = true;
  }

  fadeHint(): void {
    gsap.to(this.hint, { opacity: 0, y: 10, duration: 0.8, delay: 2.5 });
  }

  setTokens(collected: number, total: number): void {
    this.count.textContent = `${collected} / ${total} tech`;
    gsap.fromTo(this.count, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  }

  say(message: string, color = '#5eead4'): void {
    window.clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.style.setProperty('--zone', color);
    gsap.killTweensOf(this.toast);
    gsap.fromTo(this.toast, { opacity: 0, y: 16, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2.5)' });
    this.toastTimer = window.setTimeout(() => {
      gsap.to(this.toast, { opacity: 0, y: -10, duration: 0.4 });
    }, 1500);
  }

  setZone(zone: Zone | null): void {
    for (const [id, stop] of this.stops) stop.classList.toggle('active', id === zone?.id);
    gsap.killTweensOf(this.card);
    if (!zone) {
      gsap.to(this.card, { opacity: 0, x: 30, duration: 0.3, onComplete: () => this.card.classList.remove('open') });
      return;
    }
    this.fill(zone);
    this.card.classList.remove('expanded');
    this.card.classList.add('open');
    this.card.scrollTop = 0;
    gsap.fromTo(this.card, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' });
    gsap.fromTo(
      this.card.querySelectorAll('.chip, li, .card-link'),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.035, delay: 0.15, ease: 'power2.out' },
    );
  }

  private fill(zone: Zone): void {
    this.card.style.setProperty('--zone', zone.color);
    const children: HTMLElement[] = [
      el('p', { class: 'card-kicker', text: zone.kind === 'start' ? 'About' : zone.kind === 'contact' ? 'Contact' : zone.period }),
      el('h2', { text: zone.title }),
      el('p', { class: 'card-sub', text: zone.kind === 'contact' ? zone.subtitle : `${zone.subtitle}` }),
    ];
    if (zone.tech.length) {
      children.push(el('div', { class: 'chips' }, zone.tech.map((name) => el('span', { class: 'chip', text: name }))));
    }
    children.push(el('ul', {}, zone.bullets.map((text) => el('li', { text }))));
    if (zone.links.length) {
      children.push(el('div', { class: 'card-links' }, zone.links.map((item) => link(item.label, item.href, 'card-link'))));
    }
    this.card.replaceChildren(...children);
  }
}
