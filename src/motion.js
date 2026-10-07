// Every observer/listener is released on navigation; no permanent frame loop.
const REDUCED = '(prefers-reduced-motion: reduce)';
const TARGETS = '.sec-head, .amenity, .shot, .day, .track, .tier, .board, .facts, .quiz-band > *, .cta-grid > *, .arrive figure, .split > .panel, details.faq';
export const motionAllowed = () => !matchMedia(REDUCED).matches && !document.documentElement.hasAttribute('data-motion-off');
export function syncMotionControls() {
  const paused = !motionAllowed();
  document.querySelectorAll('[data-motion-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('[data-motion-label]').textContent = paused ? 'Resume animations' : 'Pause animations';
    button.querySelector('.motion-symbol').textContent = paused ? '▷' : 'Ⅱ';
  });
}
export function setupMotionPreference() {
  try { document.documentElement.toggleAttribute('data-motion-off', sessionStorage.getItem('ss-motion-off') === '1'); } catch { /* optional */ }
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-motion-toggle]')) return;
    const paused = document.documentElement.toggleAttribute('data-motion-off');
    try { sessionStorage.setItem('ss-motion-off', paused ? '1' : '0'); } catch { /* optional */ }
    document.dispatchEvent(new Event('ss:motionchange'));
    syncMotionControls();
  });
  matchMedia(REDUCED).addEventListener?.('change', () => {
    document.dispatchEvent(new Event('ss:motionchange'));
    syncMotionControls();
  });
}
export function mountMotion(root, ctx) {
  syncMotionControls();
  const timers = new Set();
  const clearReveal = (el) => el.classList.remove('rv', 'in', 'rv-media');
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      el.classList.add('in');
      io.unobserve(el);
      const timer = setTimeout(() => { clearReveal(el); timers.delete(timer); }, 1150);
      timers.add(timer);
    }
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0.02 }) : null;
  if (io && motionAllowed()) {
    root.querySelectorAll(TARGETS).forEach((el) => {
      const bounds = el.getBoundingClientRect();
      if (bounds.top < innerHeight && bounds.left < innerWidth) return;
      if (el.parentElement.closest('.rv')) return;
      const siblings = [...el.parentElement.children];
      el.style.setProperty('--rv-d', `${(siblings.indexOf(el) % 4) * 65}ms`);
      el.classList.add('rv');
      if (el.matches('.shot')) el.classList.add('rv-media');
      io.observe(el);
    });
  }
  let frame = 0;
  const progress = document.querySelector('.scroll-progress');
  const update = () => {
    frame = 0;
    if (!progress) return;
    const travel = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${travel > 0 ? Math.min(1, Math.max(0, scrollY / travel)) : 0})`;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
  const ticket = root.querySelector('.feature-ticket');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const resetTilt = () => { ticket?.style.removeProperty('--tilt-x'); ticket?.style.removeProperty('--tilt-y'); };
  const tilt = (event) => {
    if (!motionAllowed() || !finePointer.matches) return;
    const box = ticket.getBoundingClientRect();
    ticket.style.setProperty('--tilt-x', `${((event.clientY - box.top) / box.height - 0.5) * -4}deg`);
    ticket.style.setProperty('--tilt-y', `${((event.clientX - box.left) / box.width - 0.5) * 4}deg`);
  };
  ticket?.addEventListener('pointermove', tilt);
  ticket?.addEventListener('pointerleave', resetTilt);
  const onPreference = () => {
    if (motionAllowed()) return;
    io?.disconnect();
    root.querySelectorAll('.rv').forEach(clearReveal);
    resetTilt();
  };
  document.addEventListener('ss:motionchange', onPreference);
  const onFocus = (event) => {
    const target = event.target.closest('.rv');
    if (target) { io?.unobserve(target); clearReveal(target); }
  };
  root.addEventListener('focusin', onFocus);
  ctx.onCleanup(() => {
    io?.disconnect(); timers.forEach(clearTimeout); cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
    document.removeEventListener('ss:motionchange', onPreference); root.removeEventListener('focusin', onFocus);
    ticket?.removeEventListener('pointermove', tilt); ticket?.removeEventListener('pointerleave', resetTilt);
  });
}
