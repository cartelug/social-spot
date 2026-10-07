// Tiny app core: safe HTML templates, router, RPC, toasts, dialogs, icons.
import { esc, waNumber } from '../shared/util.js';

export const app = {
  backend: null, // { mode, call(method, params), me(), login?, logout? }
  site: null, // public site payload (refreshed often)
  me: null, // staff session (server) or preview owner
  mode: 'server',
  assets: {},
  stack: [], // memory-mode history
  path: '/',
  view: null,
  base: '/', // where the site lives, e.g. '/' or '/social-spot/' on GitHub Pages
};

// ---------------------------------------------------------------- templates
class Safe {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Safe(String(s ?? ''));
const fmt = (v) => (v == null || v === false ? '' : v instanceof Safe ? v.s : Array.isArray(v) ? v.map(fmt).join('') : esc(v));
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += fmt(vals[i]) + strings[i + 1];
  return new Safe(out);
}
export const when = (cond, a, b = '') => (cond ? (typeof a === 'function' ? a() : a) : typeof b === 'function' ? b() : b);

// ---------------------------------------------------------------- icons (24px stroke)
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  cal: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.4"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 20v-1.5a4 4 0 0 0-3-3.9M15.5 4.1a3.5 3.5 0 0 1 0 6.8"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.6M20 3v5.6h-5.6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
};
export const icon = (name, cls = '') => raw(`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`);

// ---------------------------------------------------------------- rpc
export async function rpc(method, params = {}) {
  try {
    return await app.backend.call(method, params);
  } catch (e) {
    if (e && e.code === 'forbidden' && app.mode === 'server' && (method.startsWith('admin.') || method.startsWith('door.') || method.startsWith('staff.'))) {
      app.me = null;
      setTimeout(() => navigate('/admin/login', { replace: true }), 0);
    }
    throw e;
  }
}
/** The element the app renders into (never <body> itself: the preview keeps its <style> and <script> there). */
export function rootEl() {
  if (!app.el) {
    app.el = document.getElementById('app');
    if (!app.el) { app.el = document.createElement('div'); app.el.id = 'app'; document.body.prepend(app.el); }
  }
  return app.el;
}
export function errText(e) {
  return (e && (e.message || e.error)) || 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------- router
const routes = [];
export function route(pattern, view, opts = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ re, keys, view, ...opts });
}
function match(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) return { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}
export function currentPath() {
  return app.path;
}
export function navigate(path, { replace = false, keepScroll = false } = {}) {
  if (app.mode === 'server') {
    const url = toUrl(path);
    if (replace) history.replaceState({}, '', url);
    else history.pushState({}, '', url);
  } else {
    if (replace) app.stack[app.stack.length - 1] = path;
    else app.stack.push(path);
    const top = path.split('/')[1] || '';
    try { if (/^[a-z]+$/.test(top)) history.replaceState(null, '', '#' + top); else if (!top) history.replaceState(null, '', location.pathname); } catch { /* sandboxed */ }
  }
  return render(path, { keepScroll });
}
export function back(fallback = '/') {
  if (app.mode === 'server') {
    if (history.length > 1) history.back();
    else navigate(fallback);
  } else {
    app.stack.pop();
    render(app.stack[app.stack.length - 1] || fallback);
  }
}

// Scroll-in motion: blocks below the fold fade up once as they reach the screen.
// Skipped for reduced motion and for in-place refreshes (nothing should replay).
const REVEAL = '.sec-head, .amenity, .shot, .day, .track, .tier, .board, .facts, .quiz-band > *, .cta-grid > *, .arrive figure, .split > .panel, details.faq';
let revealer = null;
function reveal(root) {
  if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  revealer = revealer || new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    revealer.unobserve(el);
    setTimeout(() => el.classList.remove('rv', 'in'), 1100); // hand transforms back to hover effects
  }), { rootMargin: '0px 0px -6% 0px' });
  const fold = window.innerHeight;
  root.querySelectorAll(REVEAL).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < fold || (r.left > window.innerWidth)) return; // already on screen, or off to the side in a scroller
    const i = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--rv-d', `${(i % 4) * 70}ms`);
    el.classList.add('rv');
    revealer.observe(el);
  });
}

let renderSeq = 0;
export async function render(path, { keepScroll = false } = {}) {
  const seq = ++renderSeq;
  const [pathq, frag = ''] = path.split('#');
  const [p, query = ''] = pathq.split('?');
  app.fragment = frag;
  app.path = p;
  app.fullPath = pathq;
  app.query = Object.fromEntries(new URLSearchParams(query));
  const hit = match(p) || match('/404');
  if (app.view && app.view.cleanup) app.view.cleanup();
  const ctx = makeCtx();
  app.view = ctx;
  try {
    const layout = hit.r.layout || 'public';
    const outlet = await app.layouts[layout](p);
    if (seq !== renderSeq) return;
    const res = await hit.r.view(hit.params, ctx);
    if (seq !== renderSeq) { ctx.cleanup(); return; }
    if (res && res.redirect) return navigate(res.redirect, { replace: true });
    document.title = res.title ? `${res.title} · Social Spot` : 'Social Spot · Bwebajja';
    const root = document.createElement('div');
    root.className = 'view';
    root.innerHTML = String(res.body);
    outlet.replaceChildren(root);
    ctx.root = root;
    linkify(rootEl());
    if (res.mount) await res.mount(root, ctx);
    if (app.fragment) {
      const el = document.getElementById(app.fragment);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    } else if (!keepScroll) window.scrollTo(0, 0);
    if (!keepScroll) reveal(root);
    if (app.onRoute) app.onRoute(p, layout);
  } catch (e) {
    console.error(e);
    const outlet = document.querySelector('[data-outlet]');
    if (outlet) { outlet.innerHTML = String(html`<div class="wrap section"><div class="notice red">${icon('alert')}<div><b>That page didn’t load.</b><br>${errText(e)}</div></div><p class="mt"><a href="/" class="btn line" style="margin-top:16px">Go to the home page</a></p></div>`); linkify(outlet); }
  }
}

function makeCtx() {
  const timers = [];
  const offs = [];
  const ctx = {
    root: null,
    every(ms, fn) { const t = setInterval(fn, ms); timers.push(t); return t; },
    later(ms, fn) { const t = setTimeout(fn, ms); timers.push(t); return t; },
    onCleanup(fn) { offs.push(fn); },
    cleanup() { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); offs.forEach((f) => { try { f(); } catch { /* ignore */ } }); },
  };
  return ctx;
}

/** In-app path ('/replay') -> real URL under the site's base ('/social-spot/replay'). */
export function toUrl(path) {
  return app.base + String(path || '/').replace(/^\//, '');
}
/** Absolute link to an in-app path, e.g. for sharing on WhatsApp. */
export function absUrl(path) {
  return new URL(toUrl(path), location.origin).href;
}
function routeFromLocation() {
  let p = location.pathname;
  p = p.startsWith(app.base) ? '/' + p.slice(app.base.length) : p;
  if (p === '/index.html' || p === '/404.html') p = '/';
  return p + location.search + location.hash;
}
/** Point in-app links at real URLs (so long-press / open-in-new-tab work under a sub-folder). */
export function linkify(root) {
  if (app.mode !== 'server' || !root) return;
  root.querySelectorAll('a[href^="/"]:not([data-route])').forEach((a) => {
    const route = a.getAttribute('href');
    a.dataset.route = route;
    a.setAttribute('href', toUrl(route));
  });
}

/** delegate events inside a root: on(root, 'click', '[data-act="x"]', (el, ev) => …) */
export function on(root, type, selector, fn) {
  root.addEventListener(type, (ev) => {
    const el = ev.target.closest(selector);
    if (el && root.contains(el)) fn(el, ev);
  });
}

export function startRouter() {
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href]');
    if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const href = a.dataset.route || a.getAttribute('href');
    if (a.target === '_blank' || /^(https?:|mailto:|tel:|sms:|whatsapp:)/.test(href)) return;
    if (href.startsWith('#')) {
      ev.preventDefault();
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (!href.startsWith('/')) return;
    ev.preventDefault();
    navigate(href);
  });
  if (app.mode === 'server') {
    window.addEventListener('popstate', () => render(routeFromLocation()));
    return render(routeFromLocation());
  }
  const h = (location.hash || '').slice(1);
  const start = /^[a-z]+$/.test(h) ? '/' + h : '/';
  app.stack = [start];
  return render(start);
}

// ---------------------------------------------------------------- toast, dialog
export function toast(msg, kind = '') {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  box.append(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 6000 : 3800);
}

/** Modal built into the page (the preview frame has no native confirm/prompt). */
export function dialog({ title, body = '', actions = [{ label: 'Close', value: null, kind: 'line' }], mount } = {}) {
  return new Promise((resolve) => {
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML = String(html`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <header><h2 class="h3" id="dlg-t">${title}</h2><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>
      <form class="stack" data-dlg novalidate>${body}<p class="form-error" data-err></p>
      <div class="actions">${actions.map((a, i) => html`<button type="${a.submit ? 'submit' : 'button'}" class="btn ${a.kind || ''}" data-i="${i}">${a.label}</button>`)}</div></form></div>`);
    const prevFocus = document.activeElement;
    const close = (v) => { scrim.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    scrim.addEventListener('click', (e) => { if (e.target === scrim || e.target.closest('[data-close]')) close(null); });
    const form = scrim.querySelector('[data-dlg]');
    const err = scrim.querySelector('[data-err]');
    const run = async (a, btn) => {
      if (!a.handler) return close(a.value === undefined ? true : a.value);
      err.textContent = '';
      busy(btn, true);
      try {
        const v = await a.handler(formValues(form), scrim);
        if (v !== false) close(v === undefined ? true : v);
      } catch (e) {
        err.textContent = errText(e);
      } finally { busy(btn, false); }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); const i = actions.findIndex((a) => a.submit); if (i >= 0) run(actions[i], form.querySelector(`[data-i="${i}"]`)); });
    scrim.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', (e) => { const a = actions[+b.dataset.i]; if (a.submit) return; e.preventDefault(); run(a, b); }));
    document.body.append(scrim);
    if (mount) mount(scrim);
    const first = scrim.querySelector('input, select, textarea, button.btn');
    if (first) first.focus();
  });
}
export const confirmDialog = (title, text, label = 'Confirm', kind = '', noLabel = 'Go back') =>
  dialog({ title, body: html`<p class="muted">${text}</p>`, actions: [{ label: noLabel, value: false, kind: 'line' }, { label, value: true, kind }] });

// ---------------------------------------------------------------- forms
export function formValues(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
    else out[el.name] = el.value;
  }
  return out;
}
export function busy(btn, on, label) {
  if (!btn) return;
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${label ? esc(label) : esc(btn.textContent.trim())}`;
  } else if (btn.dataset.label != null) {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.label;
    delete btn.dataset.label;
  }
}
/** Run an async action from a button with spinner + error toast/inline error. */
export async function act(btn, fn, { errorEl, okMsg } = {}) {
  if (errorEl) errorEl.textContent = '';
  busy(btn, true);
  try {
    const r = await fn();
    if (okMsg) toast(okMsg, 'ok');
    return r;
  } catch (e) {
    if (errorEl) errorEl.textContent = errText(e);
    else toast(errText(e), 'bad');
    return undefined;
  } finally {
    busy(btn, false);
  }
}

export async function copyText(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
  }
  toast(ok ? 'Copied' : 'Select the text and copy it', ok ? 'ok' : '');
  if (btn && ok) { const t = btn.innerHTML; btn.innerHTML = String(icon('check')); setTimeout(() => (btn.innerHTML = t), 1200); }
  return ok;
}
export const waLink = (phone, text) => `https://wa.me/${waNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const waShare = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Save a generated file: native download in the browser, downloads capability in the preview. */
export async function saveFile(filename, text, type = 'text/csv') {
  if (app.backend.saveFile) return app.backend.saveFile(filename, text);
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

// ---------------------------------------------------------------- live clocks
export function startClocks() {
  setInterval(() => {
    const now = Date.now() + (app.clockSkew || 0);
    document.querySelectorAll('[data-countdown]').forEach((el) => {
      const ms = Math.max(0, Number(el.dataset.countdown) - now);
      const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
      const parts = el.querySelectorAll('b');
      if (parts.length === 4) { parts[0].textContent = d; parts[1].textContent = String(h).padStart(2, '0'); parts[2].textContent = String(m).padStart(2, '0'); parts[3].textContent = String(s).padStart(2, '0'); }
    });
    document.querySelectorAll('[data-timer]').forEach((el) => {
      const ms = Math.max(0, Number(el.dataset.timer) - now);
      el.textContent = `${Math.floor(ms / 6e4)}:${String(Math.floor((ms % 6e4) / 1e3)).padStart(2, '0')}`;
    });
  }, 1000);
}
export function countdownHtml(target, onDark = false) {
  const ms = Math.max(0, target - (Date.now() + (app.clockSkew || 0)));
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
  return html`<div class="countdown ${onDark ? 'on-dark' : ''}" data-countdown="${target}" aria-label="Time until gates open">
    <span><b>${d}</b><small>days</small></span><span><b>${String(h).padStart(2, '0')}</b><small>hrs</small></span><span><b>${String(m).padStart(2, '0')}</b><small>min</small></span><span><b>${String(s).padStart(2, '0')}</b><small>sec</small></span></div>`;
}

export async function refreshSite() {
  app.site = await rpc('site.get');
  app.clockSkew = app.site.now - Date.now();
  return app.site;
}
