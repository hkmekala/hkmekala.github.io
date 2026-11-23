import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { allTech, contactLinks, EMAIL, jobsNewestFirst, profile, ROLE, TAGLINE, type Zone } from '../data/site';
import { byId, el, link, prefersReducedMotion, splitLetters } from '../ui/dom';

gsap.registerPlugin(ScrollTrigger);

const STATS: { value: number; suffix: string; label: string }[] = [
  { value: 7, suffix: '+', label: 'years building backends' },
  { value: 4.5, suffix: 'M', label: 'users served by one API' },
  { value: 6, suffix: '', label: 'companies, 3 industries' },
  { value: allTech.length, suffix: '', label: 'technologies shipped with' },
];

function jobCard(job: Zone, index: number): HTMLElement {
  const card = el('article', { class: `job ${index % 2 ? 'job-right' : 'job-left'}` }, [
    el('span', { class: 'job-dot' }),
    el('div', { class: 'job-card tilt' }, [
      el('p', { class: 'job-period', text: job.period }),
      el('h3', { text: job.title }),
      el('p', { class: 'job-role', text: job.subtitle }),
      el('div', { class: 'chips' }, job.tech.map((name) => el('span', { class: 'chip', text: name }))),
      el('ul', {}, job.bullets.map((text) => el('li', { text }))),
    ]),
  ]);
  card.style.setProperty('--zone', job.color);
  return card;
}

/** Builds the résumé page from the same data the 3D world uses. */
export function renderPlain(onEnterWorld: (() => void) | null): HTMLButtonElement {
  const root = byId('plain', HTMLElement);
  const name = el('h1', { class: 'hero-name', label: profile.name });
  splitLetters(name, profile.name);

  // main.ts enables this once the world has loaded, or hides it if it cannot
  const worldButton = el('button', { class: 'btn btn-primary magnetic', type: 'button', text: 'Loading 3D world…' });
  worldButton.disabled = true;
  if (onEnterWorld) worldButton.addEventListener('click', onEnterWorld);
  else worldButton.hidden = true;

  const marquee = (reverse: boolean): HTMLElement =>
    el('div', { class: `marquee ${reverse ? 'reverse' : ''}` }, [
      el('div', { class: 'marquee-track' }, [...allTech, ...allTech].map((name) => el('span', { text: name }))),
    ]);

  root.replaceChildren(
    el('div', { class: 'scroll-progress' }),
    el('section', { class: 'hero' }, [
      el('div', { class: 'hero-art' }, [el('img', { src: '/cover.jpg', alt: '' })]),
      el('div', { class: 'hero-copy' }, [
        el('p', { class: 'eyebrow', text: profile.greeting }),
        name,
        el('p', { class: 'hero-role', text: ROLE }),
        el('p', { class: 'hero-tag', text: TAGLINE }),
        el('div', { class: 'hero-actions' }, [
          worldButton,
          link('Résumé (PDF)', profile.social.resume, 'btn btn-ghost magnetic'),
          link(EMAIL, `mailto:${EMAIL}`, 'btn btn-ghost magnetic'),
        ]),
      ]),
      el('p', { class: 'scroll-cue', text: 'Scroll' }),
    ]),
    el('section', { class: 'stats' }, STATS.map((stat) =>
      el('div', { class: 'stat' }, [
        el('strong', { class: 'stat-value', text: `0${stat.suffix}` }),
        el('span', { text: stat.label }),
      ]),
    )),
    el('section', { class: 'about' }, [
      el('h2', { class: 'section-title', text: 'About' }),
      el('div', { class: 'about-body' }, profile.about.map((text) => el('p', { class: 'reveal', text }))),
    ]),
    el('section', { class: 'stack' }, [marquee(false), marquee(true)]),
    el('section', { class: 'journey' }, [
      el('h2', { class: 'section-title', text: 'Experience' }),
      el('div', { class: 'timeline' }, [el('div', { class: 'timeline-line' }), ...jobsNewestFirst.map(jobCard)]),
    ]),
    el('section', { class: 'contact' }, [
      el('p', { class: 'eyebrow', text: 'Got a hard backend problem?' }),
      el('h2', { class: 'contact-title', text: "Let's talk." }),
      el('div', { class: 'contact-links' }, contactLinks.map((item) => link(item.label, item.href, 'btn btn-ghost magnetic'))),
      el('p', { class: 'footer', text: `© ${new Date().getFullYear()} ${profile.name}` }),
    ]),
  );
  return worldButton;
}

let animated = false;

/** Wires up scroll and hover animation. Safe to call every time the page is shown. */
export function animatePlain(): void {
  const root = byId('plain', HTMLElement);
  if (animated) {
    ScrollTrigger.refresh();
    return;
  }
  animated = true;

  const stats = Array.from(root.querySelectorAll('.stat-value'));
  if (prefersReducedMotion()) {
    stats.forEach((node, i) => {
      const stat = STATS[i];
      if (stat) node.textContent = `${stat.value}${stat.suffix}`;
    });
    return;
  }

  // hero entrance
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('.hero-art img', { scale: 1.25, opacity: 0, duration: 1.8 })
    .from('.hero .eyebrow', { y: 20, opacity: 0, duration: 0.6 }, 0.2)
    .from('.hero-name .letter', { yPercent: 120, rotate: 8, opacity: 0, duration: 0.9, stagger: 0.035 }, 0.3)
    .from('.hero-role, .hero-tag', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.9)
    .from('.hero-actions > *', { y: 24, opacity: 0, duration: 0.6, stagger: 0.08 }, 1.1)
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, 1.6);

  // parallax and progress
  gsap.to('.hero-art img', { yPercent: 18, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });
  gsap.fromTo('.scroll-progress', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // stats count up
  stats.forEach((node, i) => {
    const stat = STATS[i];
    if (!stat) return;
    const counter = { value: 0 };
    gsap.to(counter, {
      value: stat.value,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: node, start: 'top 88%' },
      onUpdate: () => {
        node.textContent = `${Number.isInteger(stat.value) ? Math.round(counter.value) : counter.value.toFixed(1)}${stat.suffix}`;
      },
    });
  });
  gsap.from('.stat', { y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  // section titles and paragraphs
  for (const title of root.querySelectorAll('.section-title')) {
    gsap.from(title, { x: -60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: title, start: 'top 85%' } });
  }
  for (const node of root.querySelectorAll('.reveal')) {
    gsap.from(node, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: node, start: 'top 88%' } });
  }

  // timeline: the line draws as you scroll, cards fly in from their side
  gsap.fromTo('.timeline-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: 0.4 } });
  for (const job of root.querySelectorAll('.job')) {
    const fromLeft = job.classList.contains('job-left');
    const timeline = gsap.timeline({ scrollTrigger: { trigger: job, start: 'top 82%' } });
    timeline
      .from(job.querySelector('.job-dot'), { scale: 0, duration: 0.4, ease: 'back.out(3)' })
      .from(job.querySelector('.job-card'), { x: fromLeft ? -80 : 80, opacity: 0, rotateY: fromLeft ? 12 : -12, duration: 0.9, ease: 'power3.out' }, 0.05)
      .from(job.querySelectorAll('.chip'), { scale: 0.5, opacity: 0, duration: 0.35, stagger: 0.04, ease: 'back.out(2)' }, 0.35)
      .from(job.querySelectorAll('li'), { x: 20, opacity: 0, duration: 0.4, stagger: 0.05 }, 0.45);
  }

  // marquee leans with scroll speed
  ScrollTrigger.create({
    onUpdate: (self) => {
      gsap.to('.marquee-track', { skewX: gsap.utils.clamp(-12, 12, self.getVelocity() / -120), duration: 0.4, overwrite: true });
    },
  });

  // contact
  gsap.from('.contact-title', { yPercent: 60, opacity: 0, scale: 0.8, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: '.contact', start: 'top 75%' } });
  gsap.from('.contact-links > *', { y: 30, opacity: 0, duration: 0.6, stagger: 0.08, scrollTrigger: { trigger: '.contact-links', start: 'top 92%' } });

  // cards tilt towards the pointer and carry a glow
  for (const card of root.querySelectorAll('.tilt')) {
    if (!(card instanceof HTMLElement)) continue;
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      gsap.to(card, { rotateY: (px - 0.5) * 7, rotateX: (0.5 - py) * 7, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  }

  // buttons pull towards the pointer
  for (const button of root.querySelectorAll('.magnetic')) {
    if (!(button instanceof HTMLElement)) continue;
    button.addEventListener('pointermove', (e) => {
      const rect = button.getBoundingClientRect();
      gsap.to(button, { x: (e.clientX - rect.left - rect.width / 2) * 0.3, y: (e.clientY - rect.top - rect.height / 2) * 0.4, duration: 0.3 });
    });
    button.addEventListener('pointerleave', () => {
      gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  }
}
