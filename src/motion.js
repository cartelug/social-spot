// Motion and depth for the public site: topbar state, scroll progress, scroll-reveal,
// pointer spotlight on cards, the tilting feature ticket, and online/offline notices.
// Everything here is decoration: with reduced motion (or an old browser) the site
// renders exactly as before, just without the movement.
import { app, toast } from './core.js';

const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const finePointer = () => !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);

// groups whose children reveal one after another (index sets the stagger)
const STAGGER = ['.grid', '.week', '.stubs', '.facts', '.tracklist', '.queue', '.kpis'];
// single blocks that reveal on their own
const SINGLES = ['.section .wrap > div > .eyebrow', '.section h2.h2', '.section h2.h1', '.board', 'details.faq', '.terms', '.panel'];

let io = null;
let lastPath = null;
let progress = null;

export function initMotion() {
  if (!reduced() && 'IntersectionObserver' in window) document.documentElement.classList.add('js-motion');

  progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const bar = document.querySelector('.topbar');
      if (bar) bar.classList.toggle('scrolled', y > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      progress.hidden = app.layoutName !== 'public';
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  if (finePointer()) {
    // spotlight: one delegated listener feeds --mx/--my to whichever card is under the pointer
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.amenity, .tier, .kpi, .qcard, [data-tilt]');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      if (card.hasAttribute('data-tilt') && !reduced()) {
        card.classList.add('tilting');
        card.style.setProperty('--ry', `${((x / r.width) - 0.5) * 10}deg`);
        card.style.setProperty('--rx', `${(0.5 - (y / r.height)) * 8}deg`);
      }
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest && e.target.closest('[data-tilt]');
      if (!card || card.contains(e.relatedTarget)) return;
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }

  window.addEventListener('offline', () => toast('You’re offline. We’ll keep trying.', 'bad'));
  window.addEventListener('online', () => toast('Back online', 'ok'));
  onScroll();
}

/** Called after every route render. */
export function afterRoute(path, layout) {
  app.layoutName = layout;
  const root = app.view && app.view.root;
  const samePage = path === lastPath; // a live refresh of the page already on screen: no replay of the entrance
  lastPath = path;
  window.dispatchEvent(new Event('scroll'));
  if (!root || layout !== 'public' || !document.documentElement.classList.contains('js-motion')) return;

  const targets = new Set();
  STAGGER.forEach((sel) => root.querySelectorAll(sel).forEach((g) => [...g.children].forEach((c, i) => { c.style.setProperty('--i', Math.min(i, 8)); targets.add(c); })));
  SINGLES.forEach((sel) => root.querySelectorAll(sel).forEach((el) => { if (!el.closest('[data-reveal]') && !el.closest('.hero, .replay-hero')) targets.add(el); }));
  // nested targets would double-animate: keep only the outermost
  const list = [...targets].filter((el) => ![...targets].some((o) => o !== el && o.contains(el)));

  if (io) io.disconnect();
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  list.forEach((el) => {
    el.setAttribute('data-reveal', '');
    if (samePage) el.classList.add('in');
    else io.observe(el);
  });
}

/** A thin bar across the top while a page is loading (shown only if it takes a moment). */
export function routeProgress() {
  let bar = document.querySelector('.route-bar');
  if (!bar) { bar = document.createElement('div'); bar.className = 'route-bar'; bar.setAttribute('aria-hidden', 'true'); document.body.append(bar); }
  const t = setTimeout(() => { bar.classList.remove('done'); void bar.offsetWidth; bar.classList.add('run'); }, 120);
  return () => {
    clearTimeout(t);
    if (!bar.classList.contains('run')) return;
    bar.classList.remove('run');
    bar.classList.add('done');
  };
}

/** Swap page content inside a view transition where the browser supports it. */
export async function withTransition(swap, { animate = true } = {}) {
  if (!animate || reduced() || !document.startViewTransition || document.hidden) { swap(); return; }
  let done = false;
  const run = () => { if (!done) { done = true; swap(); } };
  try {
    await document.startViewTransition(run).updateCallbackDone;
  } catch {
    run();
  }
}

/** Keep keyboard focus inside a modal layer; returns a function that releases it. */
export function trapFocus(layer) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const items = [...layer.querySelectorAll(sel)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  layer.addEventListener('keydown', onKey);
  return () => layer.removeEventListener('keydown', onKey);
}

let locks = 0;
/** Stop the page behind a modal from scrolling; nested modals are counted. */
export function lockScroll() {
  if (locks++ === 0) document.documentElement.classList.add('locked');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) document.documentElement.classList.remove('locked');
  };
}
