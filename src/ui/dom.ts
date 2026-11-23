/** Typed DOM lookups and a tiny element builder. No casts needed. */

export function byId<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof ctor)) throw new Error(`Expected #${id} to be a ${ctor.name}`);
  return node;
}

interface Attrs {
  class?: string;
  text?: string;
  href?: string;
  src?: string;
  alt?: string;
  type?: string;
  label?: string;
  style?: string;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs.class) node.className = attrs.class;
  if (attrs.text) node.textContent = attrs.text;
  if (attrs.href) node.setAttribute('href', attrs.href);
  if (attrs.src) node.setAttribute('src', attrs.src);
  if (attrs.alt !== undefined) node.setAttribute('alt', attrs.alt);
  if (attrs.type) node.setAttribute('type', attrs.type);
  if (attrs.label) node.setAttribute('aria-label', attrs.label);
  if (attrs.style) node.setAttribute('style', attrs.style);
  node.append(...children);
  return node;
}

/** A link that opens safely in a new tab (mailto links stay in place). */
export function link(label: string, href: string, className: string): HTMLAnchorElement {
  const a = el('a', { class: className, text: label, href });
  if (!href.startsWith('mailto:')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

/** Splits text into one span per letter so each can be animated. */
export function splitLetters(target: HTMLElement, text: string): HTMLSpanElement[] {
  target.textContent = '';
  const letters: HTMLSpanElement[] = [];
  for (const word of text.split(' ')) {
    const wordEl = el('span', { class: 'word' });
    for (const char of word) {
      const span = el('span', { class: 'letter', text: char });
      span.setAttribute('aria-hidden', 'true');
      wordEl.append(span);
      letters.push(span);
    }
    target.append(wordEl, ' ');
  }
  return letters;
}

export const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = (): boolean => window.matchMedia('(pointer: coarse)').matches;
