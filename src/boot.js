// Shared start-up for both builds.
import './views/public.js';
import './views/booking.js';
import './views/admin.js';
import './views/door.js';
import { app, startRouter, startClocks, refreshSite, rootEl, html, icon, errText } from './core.js';
import { publicLayout } from './views/public.js';
import { adminLayout, bareLayout } from './views/admin.js';
import { startPreloader } from './preloader.js';
import { initMotion, afterRoute } from './motion.js';

function siteBase() {
  let b = window.SS_BASE || '/';
  try { b = new URL(document.baseURI).pathname; } catch { /* keep default */ }
  return b.endsWith('/') ? b : b + '/';
}

export async function boot({ assets, mode, makeBackend, fallbackBackend }) {
  app.assets = assets;
  app.mode = mode;
  app.layouts = { public: publicLayout, admin: adminLayout, bare: bareLayout };
  if (mode === 'server') app.base = siteBase();
  rootEl();
  const adminStart = mode === 'server' ? location.pathname.slice(app.base.length - 1).startsWith('/admin') : /^#admin/.test(location.hash || '');
  const pre = adminStart ? { ready: Promise.resolve(), finish() {} } : startPreloader(assets);
  try {
    app.backend = await makeBackend();
    try {
      await Promise.all([refreshSite(), app.backend.me().then((m) => { app.me = m; }), pre.ready]);
    } catch (e) {
      if (!fallbackBackend || !(e && (e.reason || e.code === 'offline'))) throw e;
      // No Social Spot server answering: show the site, switch bookings to "call us".
      app.offline = { reason: e.reason || 'it couldn’t be reached', api: app.backend.api || '' };
      app.backend = fallbackBackend();
      app.me = null;
      await Promise.all([refreshSite(), pre.ready]);
    }
  } catch (e) {
    console.error(e);
    pre.finish();
    rootEl().innerHTML = String(html`<div class="wrap section stack" style="--gap:16px"><img src="${assets.logoSmall}" alt="Social Spot" style="width:160px"><h1 class="h2">We couldn’t load the site.</h1><p class="lead">${errText(e)}</p><button class="btn" data-reload>${icon('refresh')}Try again</button></div>`);
    rootEl().querySelector('[data-reload]').addEventListener('click', () => location.reload());
    return;
  }
  startClocks();
  initMotion();
  app.onRoute = afterRoute;
  await startRouter();
  pre.finish();
}
