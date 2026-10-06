import { app, html, raw, icon, when, rpc, route, navigate, render, on, toast, dialog, act, errText, copyText, waLink, formValues, busy, confirmDialog, saveFile, rootEl, linkify, absUrl } from '../core.js';
import { kv, money } from '../components.js';
import { fmtDate, fmtTime, fmtUGX, fmtStamp, eatDate, eatTime, addDays } from '../../shared/util.js';

// ------------------------------------------------------------------ layout & guard
const NAV = [
  ['Overview', [['/admin', 'Dashboard', 'admin']]],
  ['The Replay', [['/admin/payments', 'Payments to confirm', 'admin', 'pay'], ['/admin/orders', 'Orders', 'admin'], ['/admin/tables', 'Tables', 'admin'], ['/admin/comps', 'Guest passes', 'admin'], ['/admin/door', 'Door & scanner', 'door'], ['/admin/waitlist', 'Waitlist', 'admin', 'wait'], ['/admin/ambassadors', 'Ambassadors', 'admin'], ['/admin/songs', 'Song requests', 'admin']]],
  ['Venue', [['/admin/bookings', 'Bookings', 'admin', 'book']]],
  ['People', [['/admin/customers', 'Customers', 'admin'], ['/admin/messages', 'Messages', 'admin', 'msg']]],
  ['Setup', [['/admin/settings', 'Settings', 'admin'], ['/admin/staff', 'Staff logins', 'admin', null, 'server']]],
];
const rank = { door: 1, admin: 2 };
const canSee = (need) => app.me && rank[app.me.role] >= rank[need];
let counts = {};
export async function loadCounts() {
  if (!canSee('admin')) return;
  try {
    const d = await rpc('admin.dashboard');
    counts = { pay: d.tickets.awaiting + d.bookings.awaitingPayment, book: d.bookings.requests, msg: d.messages, wait: d.waitlist };
  } catch { /* ignore */ }
}
function sideNav() {
  return html`${NAV.map(([group, items]) => {
    const vis = items.filter(([, , need, , mode]) => canSee(need) && (!mode || mode === app.mode));
    if (!vis.length) return '';
    return html`<div><h5>${group}</h5>${vis.map(([href, label, , c]) => html`<a href="${href}">${label}${when(c && counts[c], () => html`<span class="count">${counts[c]}</span>`)}</a>`)}</div>`;
  })}`;
}
export function adminLayout() {
  const el = rootEl();
  if (el.dataset.layout !== 'admin') {
    el.dataset.layout = 'admin';
    el.innerHTML = String(html`<div class="admin">
      <aside class="side" data-side></aside>
      <div class="min0"><div class="admin-top"><button class="menu-btn" data-menu aria-label="Open menu">${icon('menu')}</button><a href="/admin" class="brand"><img src="${app.assets.logoSmall}" alt="Social Spot"></a>
        <div class="row" style="--gap:8px;margin-left:auto">${when(app.mode === 'preview', html`<span class="pill warn plain hide-sm">Preview data</span>`)}<a class="btn line sm" href="/">${icon('ext')}Website</a></div></div>
        <main class="admin-main" data-outlet></main></div></div>`);
    el.querySelector('[data-menu]').addEventListener('click', () => {
      const sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.innerHTML = String(html`<div class="sheet-top"><a href="/admin" class="brand"><img src="${app.assets.logoSmall}" alt="Social Spot"></a><button class="menu-btn" data-x aria-label="Close menu">${icon('x')}</button></div><div class="side" style="display:flex;position:static;height:auto;border:0;padding:12px 0;flex-direction:column;gap:16px">${sideNav()}</div>`);
      sheet.addEventListener('click', (e) => { if (e.target.closest('[data-x]') || e.target.closest('a')) sheet.remove(); });
      document.body.append(sheet);
      linkify(sheet);
    });
  }
  const side = el.querySelector('[data-side]');
  side.innerHTML = String(html`<a href="/admin" class="brand"><img src="${app.assets.logoSmall}" alt="Social Spot"></a>${sideNav()}
    <div class="me">${app.me ? html`<span>${app.me.name}<br><span class="dim">${app.me.role === 'admin' ? 'Admin' : 'Door staff'}</span></span>${when(app.mode === 'server', html`<button class="btn line xs" data-logout>${icon('logout')}Sign out</button>`)}` : ''}</div>`);
  const best = [...side.querySelectorAll('a[href^="/admin"]')].filter((a) => app.path === a.getAttribute('href') || (a.getAttribute('href') !== '/admin' && app.path.startsWith(a.getAttribute('href')))).pop();
  if (best) best.setAttribute('aria-current', 'page');
  const lo = side.querySelector('[data-logout]');
  if (lo) lo.addEventListener('click', async () => { await app.backend.logout(); app.me = null; navigate('/admin/login'); });
  return el.querySelector('[data-outlet]');
}
export function bareLayout() {
  const el = rootEl();
  if (el.dataset.layout !== 'bare') {
    el.dataset.layout = 'bare';
    el.innerHTML = '<main data-outlet></main>';
  }
  return el.querySelector('[data-outlet]');
}
/** wrap an admin page: checks the role first */
export function adminRoute(path, need, view) {
  route(path, async (params, ctx) => {
    if (app.offline) return { redirect: '/admin/login' };
    if (!app.me) return app.mode === 'server' ? { redirect: '/admin/login' } : { title: 'Staff area', body: previewNoAccess() };
    if (!canSee(need)) return app.me.role === 'door' ? { redirect: '/admin/door' } : { title: 'Not allowed', body: html`<div class="notice red">${icon('alert')}<div>Your login can’t open this page.</div></div>` };
    if (need === 'admin') loadCounts().then(() => { if (rootEl().dataset.layout === 'admin') adminLayout(); });
    return view(params, ctx);
  }, { layout: 'admin' });
}
function previewNoAccess() {
  return html`<div class="stack" style="--gap:12px;max-width:560px"><h1 class="h2">Staff area</h1><p class="muted">Only the owner of this preview can manage it. On the live website, staff sign in with their own email and password.</p><a class="btn line" href="/">Back to the website</a></div>`;
}

// ------------------------------------------------------------------ login
function offlineHelp() {
  const o = app.offline;
  return html`<div class="wrap" style="max-width:640px;padding-block:10vh"><div class="stack" style="--gap:20px">
    <img src="${app.assets.logoSmall}" alt="Social Spot" style="width:150px">
    <div><h1 class="h2">Connect the ticket server</h1><p class="lead" style="margin-top:8px">This copy of the website can’t reach the Social Spot server, so tickets, bookings and the staff area are switched off. Visitors see the site with a “call us to book” notice.</p></div>
    ${o.api
      ? html`<div class="panel stack" style="--gap:10px"><p>This website is set to use the server at <b class="mono">${o.api}</b>, but it didn’t answer (${o.reason}).</p><p class="muted small">Check that the server is running and that the address in <b class="mono">config.js</b> is right, then reload this page.</p></div>`
      : html`<ol class="pay-steps panel">
          <li><div><b>Run the Social Spot server.</b> Deploy this folder to Render (see README). The server shows this same website, so its address works on its own.</div></li>
          <li><div><b>Keeping the site on GitHub Pages?</b> Open <b class="mono">config.js</b> in this folder and set <span class="mono">api</span> to the server’s address, for example <span class="mono">api: 'https://social-spot.onrender.com'</span>. Commit, wait a minute, then reload.</div></li>
          <li><div>On the server, set <span class="mono">PUBLIC_URL</span> to this website’s address so ticket links in messages open here.</div></li>
        </ol>`}
    <div class="row"><button class="btn" data-reload>${icon('refresh')}Reload</button><a class="btn line" href="/">Back to the website</a></div></div></div>`;
}

route('/admin/login', async () => {
  if (app.offline) return { title: 'Connect the server', body: offlineHelp(), mount(root) { on(root, 'click', '[data-reload]', () => location.reload()); } };
  if (app.me) return { redirect: app.me.role === 'door' ? '/admin/door' : '/admin' };
  if (app.mode !== 'server') return { redirect: '/admin' };
  return {
    title: 'Staff login',
    body: html`<div class="wrap" style="max-width:440px;padding-block:12vh"><div class="stack" style="--gap:22px">
      <img src="${app.assets.logoSmall}" alt="Social Spot" style="width:150px">
      <div><h1 class="h2">Staff login</h1><p class="muted" style="margin-top:6px">Admins and door staff.</p></div>
      <form class="form panel" data-login novalidate>
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="username" required></label>
        <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
        <p class="form-error" data-err aria-live="polite"></p>
        <button class="btn lg" type="submit">Sign in</button>
      </form><a href="/" class="hint">← Back to the website</a></div></div>`,
    mount(root) {
      on(root, 'submit', '[data-login]', async (f, e) => {
        e.preventDefault();
        const me = await act(f.querySelector('button'), () => app.backend.login(formValues(f)), { errorEl: f.querySelector('[data-err]') });
        if (me) { app.me = me; navigate(me.role === 'door' ? '/admin/door' : '/admin', { replace: true }); }
      });
    },
  };
}, { layout: 'bare' });

// ------------------------------------------------------------------ shared bits
const statusPill = (st, label) => {
  const cls = { paid: 'ok', deposit_paid: 'warn', awaiting_verification: 'warn', pending_payment: 'line', expired: 'plain', cancelled: 'red', rejected: 'red', confirmed: 'ok', requested: 'warn', checked_in: 'ok', completed: 'plain', no_show: 'red' }[st] || 'line';
  return html`<span class="pill ${cls}">${label}</span>`;
};
const head = (title, sub, actions = '') => html`<div class="page-head"><div><h1>${title}</h1>${when(sub, html`<p class="muted" style="margin-top:4px">${sub}</p>`)}</div>${when(actions, html`<div class="row">${actions}</div>`)}</div>`;
const pct = (a, b) => (b ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);
const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
async function exportCsv(kind, btn) {
  const r = await act(btn, () => rpc('admin.export', { kind }));
  if (!r) return;
  try { await saveFile(r.filename, r.csv); } catch (e) { toast(errText(e), 'bad'); }
}
const contactBtns = (phone, text = '') => phone ? html`<span class="row" style="--gap:6px"><a class="icon-btn" href="${waLink(phone.replace(/\s/g, '').replace(/^0/, '+256'), text)}" target="_blank" rel="noopener" aria-label="WhatsApp ${phone}">${icon('chat')}</a><button class="icon-btn" data-copy="${phone}" aria-label="Copy ${phone}">${icon('copy')}</button></span>` : '';
function bindCommon(root) {
  on(root, 'click', '[data-copy]', (b) => copyText(b.dataset.copy, b));
  on(root, 'click', '[data-export]', (b) => exportCsv(b.dataset.export, b));
}

// ------------------------------------------------------------------ dashboard
adminRoute('/admin', 'admin', async (_p, ctx) => {
  const [d, songs] = await Promise.all([rpc('admin.dashboard'), rpc('admin.songs')]);
  const t = d.tickets;
  const ev = d.event;
  const next = t.releases.find((r) => r.state === 'upcoming');
  const BT = { turf: 'Turf', gym: 'Gym', sauna: 'Sauna', penthouse: 'Penthouse', kids: 'Kids', quiz: 'Quiz', table: 'Tables' };
  const relState = { onsale: html`<span class="pill red">On sale</span>`, soldout: html`<span class="pill plain">Sold out</span>`, ended: html`<span class="pill plain">Ended</span>`, upcoming: html`<span class="pill line">Upcoming</span>`, paused: html`<span class="pill warn">Paused</span>`, closed: html`<span class="pill plain">Closed</span>` };
  return {
    title: 'Dashboard',
    body: html`<div class="stack">
      ${head(`${ev.name}`, `${fmtDate(ev.date, { long: true, longMonth: true, year: true })} · ${ev.daysToGo > 0 ? `${ev.daysToGo} days to go` : ev.daysToGo === 0 ? 'Tonight' : 'Event has passed'}`,
        html`${ev.salesMode === 'paused' ? html`<button class="btn sm" data-sales="scheduled">Resume sales</button>` : html`<button class="btn line sm" data-sales="paused">Pause sales</button>`}
        ${when(!t.current && next && ev.salesMode !== 'paused', () => html`<button class="btn sm" data-open="${next.key}">Open ${next.name} now</button>`)}`)}
      ${d.readiness.filter((x) => !x.ok).map((x) => html`<div class="notice warn">${icon('alert')}<div><b>${x.label}.</b> ${x.fix === 'settings' ? html`<a href="/admin/settings">Fix in Settings</a>` : x.fix === 'env' ? 'Set PUBLIC_URL on the server (see README).' : ''}</div></div>`)}
      <div class="kpis">
        <div class="kpi"><span class="lbl">Paid guests</span><span class="val">${t.paidGuests}<small> / ${ev.paidTarget}</small></span>
          <div class="bar" aria-hidden="true"><i class="ok" style="width:${pct(t.paidGuests, ev.paidTarget)}%"></i><span class="tick" style="left:${pct(ev.paidFloor, ev.paidTarget)}%"></span></div>
          <span class="sub">Floor ${ev.paidFloor} · ${t.depositGuests} on table deposits · ${t.pendingGuests} awaiting payment</span></div>
        <div class="kpi"><span class="lbl">Money in</span><span class="val num">${compact(t.gross)}<small> UGX</small></span><span class="sub">${fmtUGX(t.gross)} collected · ${fmtUGX(t.potential)} booked</span></div>
        <a class="kpi ${t.awaiting ? 'alert' : ''}" href="/admin/payments"><span class="lbl">Payments to confirm</span><span class="val">${t.awaiting}</span><span class="sub">${t.awaiting ? `${fmtUGX(t.awaitingAmount)} waiting${t.flagged ? ` · ${t.flagged} flagged` : ''}` : 'All caught up'}</span></a>
        <a class="kpi" href="/admin/door"><span class="lbl">Capacity</span><span class="val">${t.committed}<small> / ${ev.maxScans}</small></span>
          <div class="bar" aria-hidden="true"><i style="width:${pct(t.committed, ev.maxScans)}%"></i></div><span class="sub">${t.comps} guest passes · ${d.door.inside} inside now</span></a>
      </div>
      <section class="stack" style="--gap:12px"><div class="row between"><h2 class="h3">Ticket releases</h2><a class="btn line xs" href="/admin/settings#sales">Edit</a></div>
          <div class="scroll-x"><table class="tbl"><thead><tr><th>Release</th><th class="r">Price</th><th class="r">Paid</th><th class="r">Held</th><th class="r">Qty</th><th>State</th></tr></thead><tbody>
          ${t.releases.map((r) => html`<tr><td><b>${r.name}</b><br><span class="tiny dim">${r.doorOnly ? 'On the night' : `Opens ${fmtDate(r.opens.slice(0, 10))}`}</span></td><td class="r num">${fmtUGX(r.price)}</td><td class="r num">${r.paid}</td><td class="r num">${r.sold - r.paid}</td><td class="r num">${r.qty}</td><td>${relState[r.state]}${r.state === 'onsale' ? html` <span class="tiny dim">${t.gaAvailable} left</span>` : ''}</td></tr>`)}
          </tbody></table></div></section>
      <div class="detail-grid">
        <section class="stack" style="--gap:12px"><h2 class="h3">Tables & channels</h2>
          <div class="kpis">
            <a class="kpi" href="/admin/tables"><span class="lbl">Tables</span><span class="val">${t.tables.paid + t.tables.deposit}<small> / ${t.tables.total}</small></span><span class="sub">${t.tables.paid} paid · ${t.tables.deposit} deposit · ${t.tables.free} free</span></a>
            <div class="kpi"><span class="lbl">By channel</span><span class="sub" style="font-size:14px;color:var(--paper)">Online ${t.byChannel.online} · Door ${t.byChannel.door} · Guest passes ${t.byChannel.comp}</span></div>
          </div>
        </section>
        <section class="stack" style="--gap:12px"><h2 class="h3">Venue today</h2>
          <div class="panel tight stack" style="--gap:10px">${kv([...Object.entries(BT).map(([k, n]) => [n, d.bookings.todayByType[k] || 0]), ['Requests to confirm', html`<a href="/admin/bookings?status=requested">${d.bookings.requests}</a>`], ['Upcoming bookings', d.bookings.upcoming]])}</div>
          <div class="kpis"><a class="kpi" href="/admin/waitlist"><span class="lbl">Waitlist</span><span class="val">${d.waitlist}</span></a><a class="kpi" href="/admin/messages"><span class="lbl">Messages to send</span><span class="val">${d.messages}</span></a></div>
          ${when(songs.rows.length, () => html`<div class="panel tight stack" style="--gap:8px"><h3 class="h4">Top song requests</h3><ol style="padding-left:18px;list-style:decimal">${songs.rows.slice(0, 5).map((x) => html`<li class="small">${x.song} <span class="dim">· ${x.votes}</span></li>`)}</ol></div>`)}
        </section>
      </div>
    </div>`,
    mount(root) {
      on(root, 'click', '[data-sales]', async (b) => {
        const r = await act(b, () => rpc('admin.saveSettings', { patch: { event: { salesMode: b.dataset.sales } } }));
        if (r) { toast(b.dataset.sales === 'paused' ? 'Sales paused' : 'Sales resumed', 'ok'); render(app.path); }
      });
      on(root, 'click', '[data-open]', async (b) => {
        if (!(await confirmDialog(`Open ${b.textContent.replace('Open ', '').replace(' now', '')} now?`, 'Tickets go on sale immediately, before the scheduled date. Check that merchant codes are set first.', 'Open sales'))) return;
        const r = await act(b, () => rpc('admin.saveSettings', { patch: { event: { forceRelease: b.dataset.open } } }));
        if (r) { toast('On sale now', 'ok'); render(app.path); }
      });
      ctx.every(30000, () => { if (!document.querySelector('.scrim')) render(app.fullPath, { keepScroll: true }); });
    },
  };
});

// ------------------------------------------------------------------ payments queue
adminRoute('/admin/payments', 'admin', async (_p, ctx) => {
  const [o, b] = await Promise.all([rpc('admin.orders', { awaiting: true, limit: 500 }), rpc('admin.bookings', { status: 'live' })]);
  const queue = o.rows.filter((r) => r.pendingPayment).sort((a, c) => a.pendingPayment.submittedAt - c.pendingPayment.submittedAt);
  const bq = b.rows.filter((r) => r.payment && r.payment.status === 'awaiting_verification');
  return {
    title: 'Payments to confirm',
    body: html`<div class="stack">${head('Payments to confirm', 'Check each transaction ID against the MoMo or Airtel merchant statement, then confirm. Tickets go live the moment you do.')}
      ${queue.length ? html`<div class="queue">${queue.map((r) => html`<article class="qcard">
        <div class="row between top"><div><span class="eyebrow">${r.pendingPayment.method === 'airtel' ? 'Airtel Money' : 'MTN MoMo'} · ${fmtStamp(r.pendingPayment.submittedAt)}</span><div class="txn">${r.pendingPayment.txnId}</div></div><button class="btn line xs" data-copy="${r.pendingPayment.txnId}">${icon('copy')}Copy ID</button></div>
        <div class="qgrid"><div><span class="k">Expect</span><b class="num">${fmtUGX(r.pendingPayment.amount)}</b></div><div><span class="k">Order</span><a href="/admin/orders/${r.id}">${r.ref}</a></div><div><span class="k">Buyer</span>${r.buyer}<br><span class="dim">${r.phone}</span></div><div><span class="k">For</span>${r.what}</div></div>
        ${when(r.flag, html`<div class="notice warn">${icon('alert')}<div>Paid after the hold expired. Check there is still room before confirming.</div></div>`)}
        <div class="row"><button class="btn ok sm" data-verify="${r.id}" data-amount="${r.pendingPayment.amount}">${icon('check')}Confirm ${fmtUGX(r.pendingPayment.amount)}</button><button class="btn line sm" data-verify-other="${r.id}" data-amount="${r.pendingPayment.amount}">Different amount</button><button class="btn ghost sm" data-reject="${r.id}">Reject</button></div>
      </article>`)}</div>` : html`<div class="empty"><h3>No ticket payments waiting</h3><p>When a buyer submits a transaction ID it appears here for you to check against the statement.</p></div>`}
      <h2 class="h3" style="margin-top:12px">Booking payments</h2>
      ${bq.length ? html`<div class="queue">${bq.map((r) => html`<article class="qcard"><div class="row between top"><div><span class="eyebrow">${r.payment.method === 'airtel' ? 'Airtel Money' : 'MTN MoMo'} · ${r.typeName}</span><div class="txn">${r.payment.txnId}</div></div><button class="btn line xs" data-copy="${r.payment.txnId}">${icon('copy')}Copy ID</button></div>
        <div class="qgrid"><div><span class="k">Expect</span><b class="num">${money(r.price, r.currency)}</b></div><div><span class="k">Booking</span>${r.code}</div><div><span class="k">Customer</span>${r.contact.name}<br><span class="dim">${r.contact.phoneDisplay}</span></div><div><span class="k">When</span>${r.when}</div></div>
        <div class="row"><button class="btn ok sm" data-bpaid="${r.id}">${icon('check')}Confirm payment</button><button class="btn ghost sm" data-breject="${r.id}">Reject</button></div></article>`)}</div>` : html`<div class="empty"><h3>No booking payments waiting</h3><p>Bookings paid by mobile money show up here.</p></div>`}
    </div>`,
    mount(root) {
      bindCommon(root);
      const verify = async (b, amount) => { const r = await act(b, () => rpc('admin.verifyPayment', { id: b.dataset.verify || b.dataset.verifyOther, amount })); if (r) { toast(`${r.ref} confirmed · ${r.statusLabel}`, 'ok'); render(app.fullPath, { keepScroll: true }); } };
      on(root, 'click', '[data-verify]', (b) => verify(b, b.dataset.amount));
      on(root, 'click', '[data-verify-other]', (b) => dialog({
        title: 'Confirm a different amount', body: html`<p class="muted small">Enter what actually arrived. A part-payment keeps the order open for the rest.</p><label class="field"><span>Amount received (UGX)</span><input name="amount" type="number" inputmode="numeric" min="1" value="${b.dataset.amount}"></label>`,
        actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Confirm', submit: true, kind: 'ok', handler: async (v) => { await rpc('admin.verifyPayment', { id: b.dataset.verifyOther, amount: v.amount }); toast('Payment confirmed', 'ok'); render(app.fullPath, { keepScroll: true }); } }],
      }));
      on(root, 'click', '[data-reject]', (b) => dialog({
        title: 'Reject this payment?', body: html`<p class="muted small">The buyer gets a message asking them to check the ID and resubmit. Their tickets stay held for 24 hours.</p><label class="field"><span>Reason</span><select name="reason"><option>Not found in our statement</option><option>Amount is short</option><option>Already used on another order</option><option>Paid to the wrong number</option></select></label>`,
        actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Reject payment', submit: true, handler: async (v) => { await rpc('admin.rejectPayment', { id: b.dataset.reject, reason: v.reason }); toast('Payment rejected. Buyer notified.'); render(app.fullPath, { keepScroll: true }); } }],
      }));
      on(root, 'click', '[data-bpaid]', async (b) => { const r = await act(b, () => rpc('admin.updateBooking', { id: b.dataset.bpaid, payment: { status: 'paid' } })); if (r) { toast('Booking marked paid', 'ok'); render(app.fullPath, { keepScroll: true }); } });
      on(root, 'click', '[data-breject]', async (b) => { const r = await act(b, () => rpc('admin.updateBooking', { id: b.dataset.breject, payment: { status: 'rejected' } })); if (r) { toast('Payment rejected'); render(app.fullPath, { keepScroll: true }); } });
      ctx.every(20000, () => { if (!document.querySelector('.scrim')) render(app.fullPath, { keepScroll: true }); });
    },
  };
});

// ------------------------------------------------------------------ orders
adminRoute('/admin/orders', 'admin', async () => {
  const q = app.query.q || '';
  const status = app.query.status || '';
  const kind = app.query.kind || '';
  const r = await rpc('admin.orders', { q, status, kind });
  const opt = (v, l, cur) => html`<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`;
  return {
    title: 'Orders',
    body: html`<div class="stack">${head('Orders', `${r.total} order${r.total === 1 ? '' : 's'}`, html`<button class="btn line sm" data-export="orders">${icon('download')}Orders CSV</button><button class="btn line sm" data-export="guestlist">${icon('download')}Guest list CSV</button>`)}
      <form class="toolbar" data-filter><input type="search" name="q" value="${q}" placeholder="Name, phone, RPL- or SS- code"><select name="status">${opt('', 'Any status', status)}${opt('live', 'Live (held or paid)', status)}${opt('paid', 'Paid', status)}${opt('deposit_paid', 'Deposit paid', status)}${opt('awaiting_verification', 'Payment being confirmed', status)}${opt('pending_payment', 'Awaiting payment', status)}${opt('expired', 'Hold expired', status)}${opt('cancelled', 'Cancelled', status)}</select>
        <select name="kind">${opt('', 'All kinds', kind)}${opt('ga', 'General admission', kind)}${opt('table', 'Tables', kind)}${opt('comp', 'Guest passes', kind)}</select><button class="btn sm" type="submit">${icon('search')}Search</button></form>
      ${r.rows.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>Order</th><th>Buyer</th><th>Item</th><th class="r">Total</th><th class="r">Paid</th><th>Status</th><th>Created</th></tr></thead><tbody>
        ${r.rows.map((o) => html`<tr><td><a href="/admin/orders/${o.id}" class="mono">${o.ref}</a>${when(o.referral, html`<br><span class="tiny dim">ref ${o.referral}</span>`)}</td><td>${o.buyer}<br><span class="dim">${o.phone}</span></td><td>${o.what}${when(o.checkedIn, html`<br><span class="tiny dim">${o.checkedIn} checked in</span>`)}</td><td class="r num">${fmtUGX(o.total)}</td><td class="r num">${fmtUGX(o.paid)}</td><td>${statusPill(o.status, o.statusLabel)}</td><td class="tiny dim">${fmtStamp(o.createdAt)}</td></tr>`)}
      </tbody></table></div>` : html`<div class="empty"><h3>No orders ${q || status || kind ? 'match' : 'yet'}</h3><p>${q || status || kind ? 'Try a different search.' : 'Orders appear here as soon as someone starts checkout.'}</p></div>`}
    </div>`,
    mount(root) {
      bindCommon(root);
      on(root, 'submit', '[data-filter]', (f, e) => { e.preventDefault(); const v = formValues(f); const qs = new URLSearchParams(Object.entries(v).filter(([, x]) => x)).toString(); navigate(`/admin/orders${qs ? '?' + qs : ''}`, { replace: true }); });
    },
  };
});

adminRoute('/admin/orders/:id', 'admin', async ({ id }) => {
  const [o, s] = await Promise.all([rpc('admin.order', { id }), rpc('site.get')]);
  const ev = s.event;
  const passState = { valid: html`<span class="pill ok">Valid</span>`, used: html`<span class="pill plain">Checked in</span>`, pending: html`<span class="pill warn">Not paid</span>`, balance_due: html`<span class="pill warn">Balance due</span>`, void: html`<span class="pill red">Void</span>` };
  const submitted = o.payments.filter((p) => p.status === 'submitted');
  return {
    title: o.ref,
    body: html`<div class="stack">
      <a href="/admin/orders" class="btn ghost sm" style="justify-self:start">${icon('back')}Orders</a>
      ${head(html`<span class="mono">${o.ref}</span>`, html`${o.what} · ${statusPill(o.status, o.statusLabel)}`)}
      ${when(o.flag, html`<div class="notice warn">${icon('alert')}<div>Paid after the hold expired; capacity may be short. Confirm only if there is room.</div></div>`)}
      <div class="detail-grid">
        <div class="stack" style="--gap:18px">
          <section class="panel stack" style="--gap:14px"><div class="row between"><h2 class="h3">Payments</h2><span class="num">${fmtUGX(o.paid)} of ${fmtUGX(o.total)}</span></div>
            ${o.payments.length ? html`<div class="scroll-x" style="border:0"><table class="tbl" style="min-width:520px"><thead><tr><th>When</th><th>Method</th><th>Transaction</th><th class="r">Amount</th><th>Status</th><th></th></tr></thead><tbody>${o.payments.map((p) => html`<tr><td class="tiny">${fmtStamp(p.submittedAt)}</td><td>${p.method.toUpperCase()}</td><td class="mono">${p.txnId}</td><td class="r num">${fmtUGX(p.amount)}</td><td>${p.status}${when(p.rejectReason, html`<br><span class="tiny dim">${p.rejectReason}</span>`)}${when(p.verifiedBy, html`<br><span class="tiny dim">by ${p.verifiedBy}</span>`)}</td>
              <td>${when(p.status === 'submitted', html`<div class="row" style="--gap:6px"><button class="btn ok xs" data-verify="${p.id}">Confirm</button><button class="btn line xs" data-reject="${p.id}">Reject</button></div>`)}</td></tr>`)}</tbody></table></div>` : html`<p class="muted small">No payments yet.</p>`}
            ${when(o.due > 0 && !['cancelled', 'rejected'].includes(o.status), html`<form class="inline-form" data-record><label class="field"><span>Record payment</span><select name="method"><option value="cash">Cash</option><option value="mtn">MTN MoMo</option><option value="airtel">Airtel Money</option><option value="bank">Bank</option></select></label><label class="field"><span>Amount</span><input name="amount" type="number" inputmode="numeric" value="${o.due}"></label><label class="field"><span>Txn ID <em>(not for cash)</em></span><input name="txnId" class="mono"></label><button class="btn sm" type="submit">Record</button></form>`)}
          </section>
          <section class="stack" style="--gap:10px"><h2 class="h3">Passes</h2><div class="scroll-x"><table class="tbl"><thead><tr><th>Code</th><th>Guest</th><th>Access</th><th>State</th><th>Check-in</th><th></th></tr></thead><tbody>
            ${o.passes.map((p) => html`<tr><td class="mono">${p.code}${when(p.prevCodes.length, html`<br><span class="tiny dim">replaced ${p.prevCodes.length}×</span>`)}</td><td>${p.holder}${when(p.phone, html`<br><span class="dim">${p.phone}</span>`)}</td><td>${p.accessLabel}${p.table ? ` · ${p.table}` : ''}</td><td>${passState[p.state]}</td><td class="tiny">${p.checkedInAt ? html`${eatTime(p.checkedInAt)} · ${p.checkedLane}` : '—'}</td>
              <td><div class="row" style="--gap:6px">${when(p.state !== 'used' && p.state !== 'void', html`<button class="btn line xs" data-rename="${p.passId}" data-name="${p.holder}">Rename</button>`)}${when(p.state === 'valid', html`<button class="btn line xs" data-admit="${p.passId}">Check in</button>`)}${when(p.state === 'used', html`<button class="btn ghost xs" data-undo="${p.passId}">Undo</button>`)}</div></td></tr>`)}
          </tbody></table></div></section>
        </div>
        <div class="stack" style="--gap:18px">
          <section class="panel stack" style="--gap:12px"><div class="row between"><h2 class="h3">Buyer</h2>${contactBtns(o.buyerFull.phoneDisplay)}</div>
            ${kv([['Name', o.buyerFull.name], ['Phone', o.buyerFull.phoneDisplay], o.buyerFull.email ? ['Email', o.buyerFull.email] : null, o.source ? ['Heard via', o.source] : null, o.referral ? ['Referral', o.referral] : null, o.song ? ['Song', o.song] : null, ['Offers opt-in', o.consents.marketing ? 'Yes' : 'No'], ['Partner opt-in', o.consents.partners ? 'Yes' : 'No'], o.comp ? ['Guest group', o.comp.groupName] : null, o.comp && o.comp.note ? ['Note', o.comp.note] : null])}
            ${when(o.links.order, html`<button class="btn line sm" data-copy="${o.links.order}">${icon('copy')}Copy order link</button>`)}</section>
          <section class="panel stack" style="--gap:12px"><h2 class="h3">Message the buyer</h2><p class="muted small">Sends the right message for this order’s status: payment received, ticket ready or deposit received.</p><div class="row"><button class="btn line sm" data-resend>${icon('chat')}Prepare message</button></div></section>
          ${when(!['cancelled', 'rejected'].includes(o.status), html`<section class="panel stack" style="--gap:12px"><h2 class="h3">Cancel order</h2><p class="muted small">Voids every pass and frees the stock. Refunds are handled outside the system.</p><div><button class="btn line sm" data-cancel>Cancel this order</button></div></section>`)}
          <section class="stack" style="--gap:8px"><h2 class="h3">History</h2><ul class="log">${o.history.map((h) => html`<li><time>${fmtStamp(h.at)}</time><span><b>${h.action}</b>${h.detail ? ` · ${h.detail}` : ''} <span class="dim">· ${h.by}</span></span></li>`)}</ul></section>
        </div>
      </div></div>`,
    mount(root) {
      bindCommon(root);
      const reload = (msg) => { if (msg) toast(msg, 'ok'); render(app.fullPath, { keepScroll: true }); };
      on(root, 'click', '[data-verify]', async (b) => { if (await act(b, () => rpc('admin.verifyPayment', { id, paymentId: b.dataset.verify }))) reload('Payment confirmed'); });
      on(root, 'click', '[data-reject]', (b) => dialog({ title: 'Reject this payment?', body: html`<label class="field"><span>Reason</span><select name="reason"><option>Not found in our statement</option><option>Amount is short</option><option>Already used on another order</option><option>Paid to the wrong number</option></select></label>`, actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Reject', submit: true, handler: async (v) => { await rpc('admin.rejectPayment', { id, paymentId: b.dataset.reject, reason: v.reason }); reload('Payment rejected'); } }] }));
      on(root, 'submit', '[data-record]', async (f, e) => { e.preventDefault(); if (await act(f.querySelector('button'), () => rpc('admin.recordPayment', { id, ...formValues(f) }))) reload('Payment recorded'); });
      on(root, 'click', '[data-rename]', (b) => dialog({ title: 'Rename this pass', body: html`<p class="muted small">Issues a new QR code; the old one stops working.</p><label class="field"><span>Name</span><input name="name" required value="${/^Guest \d+$/.test(b.dataset.name) ? '' : b.dataset.name}"></label><label class="field"><span>Phone <em>(optional)</em></span><input name="phone" type="tel"></label>`, actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Save', submit: true, handler: async (v) => { await rpc('admin.updateHolders', { id, changes: [{ passId: b.dataset.rename, ...v }] }); reload('Pass renamed'); } }] }));
      on(root, 'click', '[data-admit]', async (b) => { if (await act(b, () => rpc('door.admit', { passId: b.dataset.admit, lane: 'Exception desk' }))) reload('Checked in'); });
      on(root, 'click', '[data-undo]', async (b) => { if (await act(b, () => rpc('door.undo', { passId: b.dataset.undo }))) reload('Check-in undone'); });
      on(root, 'click', '[data-cancel]', (b) => dialog({ title: 'Cancel this order?', body: html`<label class="field"><span>Reason</span><input name="reason" placeholder="e.g. buyer asked, duplicate order"></label>`, actions: [{ label: 'Keep order', kind: 'line', value: null }, { label: 'Cancel order', submit: true, handler: async (v) => { await rpc('admin.cancelOrder', { id, reason: v.reason }); reload('Order cancelled'); } }] }));
      on(root, 'click', '[data-resend]', async (b) => {
        const r = await act(b, () => rpc('admin.resend', { id }));
        if (!r) return;
        dialog({ title: 'Message ready', body: html`<p class="small" style="white-space:pre-wrap;background:var(--ink-3);padding:12px;border-radius:10px">${r.body}</p><p class="hint">${app.mode === 'server' ? 'Queued for SMS if SMS is switched on. You can also send it on WhatsApp.' : 'Send it on WhatsApp.'}</p><div class="row"><a class="btn" href="${waLink(r.to, r.body)}" target="_blank" rel="noopener">${icon('chat')}Open WhatsApp</a></div>`, actions: [{ label: 'Copy text', kind: 'line', handler: async () => { await copyText(r.body); return false; } }, { label: 'Done', kind: 'line', value: true }] });
      });
    },
  };
});

// ------------------------------------------------------------------ tables
adminRoute('/admin/tables', 'admin', async () => {
  const t = await rpc('admin.tables');
  const label = { free: 'Free', paid: 'Paid', deposit_paid: 'Deposit', pending_payment: 'Held', awaiting_verification: 'Checking' };
  return {
    title: 'Tables',
    body: html`<div class="stack">${head('Tables', `Balance due ${fmtDate(t.balanceDue, { longMonth: true })} · guest names due ${fmtDate(t.guestNamesDue, { longMonth: true })}`)}
      ${t.tiers.map((tier) => html`<section class="stack" style="--gap:12px"><h2 class="h3">${tier.name} <span class="muted small">· ${fmtUGX(tier.price)} · ${tier.guests} guests</span></h2>
        <div class="tables-board">${tier.tables.map((x) => x.state === 'free'
          ? html`<div class="tcell free"><span class="id">${x.id}</span><span class="small">Free</span></div>`
          : html`<a class="tcell ${x.state}" href="/admin/orders/${x.orderId}"><span class="row between"><span class="id">${x.id}</span><span class="pill ${x.state === 'paid' ? 'ok' : 'warn'} plain">${label[x.state] || x.state}</span></span><span class="small"><b>${x.buyer}</b></span><span class="tiny dim">${x.phone}</span><span class="tiny">${x.named}/${x.guests} named${x.due ? ` · ${fmtUGX(x.due)} due` : ''}${x.checkedIn ? ` · ${x.checkedIn} in` : ''}</span></a>`)}</div></section>`)}
    </div>`,
  };
});

// ------------------------------------------------------------------ guest passes (comps)
adminRoute('/admin/comps', 'admin', async () => {
  const c = await rpc('admin.comps');
  return {
    title: 'Guest passes',
    body: html`<div class="stack">${head('Guest passes', `${c.issued} issued · ${c.planned} planned · hard ceiling ${c.ceiling}. Every pass above ${c.planned} takes one paid place.`)}
      <div class="kpis">${c.groups.map((g) => html`<div class="kpi"><span class="lbl">${g.name}</span><span class="val">${g.used}<small> / ${g.alloc}</small></span><div class="bar"><i class="${g.used > g.alloc ? '' : 'ok'}" style="width:${pct(g.used, g.alloc)}%"></i></div></div>`)}</div>
      <form class="panel form" data-issue><h2 class="h3">Issue a guest pass</h2>
        <div class="two"><label class="field"><span>Guest name</span><input name="name" required></label><label class="field"><span>Phone <em>(to send the pass)</em></span><input name="phone" type="tel"></label></div>
        <div class="two"><label class="field"><span>Group</span><select name="group">${c.groups.map((g) => html`<option value="${g.key}">${g.name} (${g.used}/${g.alloc})</option>`)}</select></label>
        <label class="field"><span>Access</span><select name="access"><option value="comp-ga">General floor</option><option value="comp-vip">Tables & VIP area</option><option value="accredited">Accredited (media/partner lane)</option></select></label></div>
        <label class="field"><span>Note <em>(e.g. the content they owe)</em></span><input name="note" maxlength="140"></label>
        <div class="row"><label class="check"><input type="checkbox" name="notify" checked><span>Send the pass by SMS if a phone is given</span></label><label class="check"><input type="checkbox" name="override"><span>Over allocation (allowed up to the ceiling)</span></label></div>
        <p class="form-error" data-err></p><button class="btn" type="submit">Issue pass</button></form>
      ${c.rows.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>Guest</th><th>Group</th><th>Access</th><th>Code</th><th>Status</th><th></th></tr></thead><tbody>${c.rows.map((r) => html`<tr><td>${r.buyer}${when(r.phone, html`<br><span class="dim">${r.phone}</span>`)}${when(r.note, html`<br><span class="tiny dim">${r.note}</span>`)}</td><td>${r.group}</td><td>${r.access}</td><td class="mono">${r.code}</td><td>${statusPill(r.status, r.checkedIn ? 'Checked in' : r.statusLabel)}</td><td><a class="btn line xs" href="/admin/orders/${r.id}">Open</a></td></tr>`)}</tbody></table></div>` : html`<div class="empty"><h3>No guest passes yet</h3><p>Every guest pass is named and gets its own QR code. Unconfirmed passes return to paid stock at the cut-off.</p></div>`}
    </div>`,
    mount(root) {
      on(root, 'submit', '[data-issue]', async (f, e) => {
        e.preventDefault();
        const r = await act(f.querySelector('button[type="submit"]'), () => rpc('admin.issueComp', formValues(f)), { errorEl: f.querySelector('[data-err]') });
        if (r) { toast(`Guest pass issued: ${r.passes[0].code}`, 'ok'); render(app.path); }
      });
    },
  };
});

// ------------------------------------------------------------------ bookings
const BTYPES = [['', 'All'], ['turf', 'Turf'], ['gym', 'Gym'], ['sauna', 'Sauna'], ['penthouse', 'Penthouse'], ['kids', 'Kids'], ['quiz', 'Quiz'], ['table', 'Tables']];
adminRoute('/admin/bookings', 'admin', async () => {
  const s = await rpc('site.get');
  const type = app.query.type || '';
  const range = app.query.range || 'upcoming';
  const status = app.query.status || (range === 'past' ? '' : 'live');
  const q = app.query.q || '';
  const today = s.today;
  const params = { type, status, q };
  if (range === 'today') { params.from = today; params.to = today; }
  if (range === 'upcoming') params.from = today;
  if (range === 'past') params.to = addDays(today, -1);
  const r = await rpc('admin.bookings', params);
  const link = (k, v) => { const p = new URLSearchParams({ type, range, status, q, [k]: v }); for (const [a, b] of [...p]) if (!b) p.delete(a); return `/admin/bookings?${p}`; };
  const details = (b) => {
    const d = b.details;
    switch (b.type) {
      case 'turf': return `${b.slots.length}h${d.team ? ` · ${d.team}` : ''}${d.players ? ` · ${d.players} players` : ''}`;
      case 'sauna': return `${d.adults} adult${d.adults === 1 ? '' : 's'}${d.kids ? `, ${d.kids} kid${d.kids === 1 ? '' : 's'}` : ''}`;
      case 'gym': return `${d.planName} · ${d.sessionName}`;
      case 'penthouse': return `${d.packageName} · ${d.guests} guests · ${d.nights} night${d.nights === 1 ? '' : 's'}`;
      case 'kids': return `${d.child}, ${d.age} · ${d.optionName}`;
      case 'quiz': return `${d.team} · ${d.size} players`;
      case 'table': return `${d.party} people${d.occasion ? ` · ${d.occasion}` : ''}`;
      default: return '';
    }
  };
  const payLabel = (b) => !b.price ? 'Free' : b.payment.status === 'paid' ? html`<span class="pill ok plain">Paid</span>` : b.payment.status === 'awaiting_verification' ? html`<span class="pill warn plain">Checking ${b.payment.txnId}</span>` : html`<span class="pill line plain">Unpaid</span>`;
  return {
    title: 'Bookings',
    body: html`<div class="stack">${head('Bookings', `${r.total} booking${r.total === 1 ? '' : 's'}`, html`<button class="btn line sm" data-export="bookings">${icon('download')}Bookings CSV</button>`)}
      <div class="tabs" role="tablist">${BTYPES.map(([k, l]) => html`<a role="tab" href="${link('type', k)}" aria-selected="${k === type}">${l}</a>`)}</div>
      <form class="toolbar" data-filter><select name="range">${[['today', 'Today'], ['upcoming', 'Today & upcoming'], ['past', 'Past'], ['all', 'All dates']].map(([k, l]) => html`<option value="${k}" ${k === range ? 'selected' : ''}>${l}</option>`)}</select>
        <select name="status">${[['live', 'Active'], ['requested', 'Requests to confirm'], ['unpaid', 'Unpaid'], ['', 'Any status'], ['cancelled', 'Cancelled']].map(([k, l]) => html`<option value="${k}" ${k === status ? 'selected' : ''}>${l}</option>`)}</select>
        <input type="search" name="q" value="${q}" placeholder="Name, phone, team or SB- code"><button class="btn sm" type="submit">${icon('search')}Filter</button></form>
      ${r.rows.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>When</th><th>Booking</th><th>Customer</th><th>Details</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${r.rows.map((b) => html`<tr><td><b>${b.when}</b></td><td>${b.typeName}<br><span class="mono tiny">${b.code}</span></td><td>${b.contact.name}<br><span class="dim nowrap">${b.contact.phoneDisplay}</span> ${contactBtns(b.contact.phoneDisplay, `Hi ${b.contact.name.split(' ')[0]}, this is Social Spot about your ${b.typeName.toLowerCase()} booking ${b.code} (${b.when}).`)}</td>
          <td>${details(b)}${when(b.note, html`<br><span class="tiny dim">“${b.note}”</span>`)}</td><td><span class="nowrap">${b.price ? money(b.price, b.currency) : ''}</span><br>${payLabel(b)}</td><td>${statusPill(b.status, b.statusLabel)}</td>
          <td><div class="row" style="--gap:6px">
            ${when(b.status === 'requested', html`<button class="btn ok xs" data-bset="${b.id}" data-status="confirmed">Confirm</button>`)}
            ${when(['confirmed', 'requested'].includes(b.status), html`<button class="btn line xs" data-bset="${b.id}" data-status="checked_in">Check in</button>`)}
            ${when(b.status === 'checked_in', html`<button class="btn line xs" data-bset="${b.id}" data-status="completed">Done</button>`)}
            ${when(b.price && b.payment.status !== 'paid' && !['cancelled', 'no_show'].includes(b.status), html`<button class="btn line xs" data-bpay="${b.id}" data-price="${b.price}" data-cur="${b.currency}">Mark paid</button>`)}
            ${when(['confirmed', 'requested'].includes(b.status), html`<button class="btn ghost xs" data-bset="${b.id}" data-status="no_show">No-show</button><button class="btn ghost xs" data-bset="${b.id}" data-status="cancelled">Cancel</button>`)}
            ${when(b.type === 'kids' && !b.time && ['confirmed', 'requested'].includes(b.status), html`<button class="btn ghost xs" data-btime="${b.id}">Set time</button>`)}
          </div></td></tr>`)}
      </tbody></table></div>` : html`<div class="empty"><h3>No bookings here</h3><p>Change the filters, or share the booking pages: turf, gym, sauna, penthouse, kids soccer, Quiz Night and tables.</p></div>`}
    </div>`,
    mount(root) {
      bindCommon(root);
      on(root, 'submit', '[data-filter]', (f, e) => { e.preventDefault(); const v = formValues(f); const p = new URLSearchParams({ type, ...v }); for (const [a, b] of [...p]) if (!b) p.delete(a); if (!v.status) p.set('status', ''); navigate(`/admin/bookings?${p}`, { replace: true }); });
      on(root, 'click', '[data-bset]', async (b) => { const r = await act(b, () => rpc('admin.updateBooking', { id: b.dataset.bset, status: b.dataset.status })); if (r) { toast(`${r.code}: ${r.statusLabel}`, 'ok'); render(app.fullPath, { keepScroll: true }); } });
      on(root, 'click', '[data-bpay]', (b) => dialog({ title: 'Mark as paid', body: html`<div class="two"><label class="field"><span>Method</span><select name="method"><option value="cash">Cash</option><option value="mtn">MTN MoMo</option><option value="airtel">Airtel Money</option><option value="bank">Bank</option></select></label><label class="field"><span>Amount (${b.dataset.cur})</span><input name="amount" type="number" value="${b.dataset.price}"></label></div>`, actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Mark paid', kind: 'ok', submit: true, handler: async (v) => { await rpc('admin.updateBooking', { id: b.dataset.bpay, payment: { status: 'paid', method: v.method, amount: v.amount } }); toast('Marked paid', 'ok'); render(app.fullPath, { keepScroll: true }); } }] }));
      on(root, 'click', '[data-btime]', (b) => dialog({ title: 'Set the session time', body: html`<label class="field"><span>Time</span><input name="time" type="time" value="09:00"></label>`, actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Save', submit: true, handler: async (v) => { await rpc('admin.updateBooking', { id: b.dataset.btime, time: v.time }); render(app.fullPath, { keepScroll: true }); } }] }));
    },
  };
});

// ------------------------------------------------------------------ customers
adminRoute('/admin/customers', 'admin', async () => {
  const q = app.query.q || '';
  const mk = app.query.marketing === '1';
  const r = await rpc('admin.customers', { q, marketing: mk });
  return {
    title: 'Customers',
    body: html`<div class="stack">${head('Customers', `${r.total} people · ${r.optedIn} opted in to offers. Built from ticket orders and bookings.`, html`<button class="btn line sm" data-export="customers">${icon('download')}All customers</button><button class="btn line sm" data-export="marketing">${icon('download')}Opted-in list</button>`)}
      <form class="toolbar" data-filter><input type="search" name="q" value="${q}" placeholder="Name, phone or email"><label class="check"><input type="checkbox" name="marketing" ${mk ? 'checked' : ''}><span>Opted in only</span></label><button class="btn sm" type="submit">${icon('search')}Search</button></form>
      ${r.rows.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>Name</th><th>Phone</th><th class="r">Tickets</th><th class="r">Bookings</th><th class="r">Spend (UGX)</th><th>Interests</th><th>Opt-in</th><th>Last seen</th></tr></thead><tbody>
        ${r.rows.map((c) => html`<tr><td>${c.name}${when(c.email, html`<br><span class="tiny dim">${c.email}</span>`)}</td><td class="nowrap">${c.phoneDisplay} ${contactBtns(c.phoneDisplay)}</td><td class="r num">${c.tickets}</td><td class="r num">${c.bookings}</td><td class="r num">${c.spend.toLocaleString('en-US')}</td><td class="tiny">${c.types.join(', ')}</td><td>${c.marketing ? html`<span class="pill ok plain">Offers</span>` : html`<span class="dim">—</span>`}${when(c.partners, html` <span class="pill line plain">Partners</span>`)}</td><td class="tiny dim">${fmtStamp(c.lastSeen)}</td></tr>`)}
      </tbody></table></div>` : html`<div class="empty"><h3>No customers ${q || mk ? 'match' : 'yet'}</h3><p>Everyone who orders tickets or books appears here, with their consent choices.</p></div>`}
    </div>`,
    mount(root) {
      bindCommon(root);
      on(root, 'submit', '[data-filter]', (f, e) => { e.preventDefault(); const v = formValues(f); navigate(`/admin/customers?q=${encodeURIComponent(v.q)}${v.marketing ? '&marketing=1' : ''}`, { replace: true }); });
    },
  };
});

// ------------------------------------------------------------------ waitlist
adminRoute('/admin/waitlist', 'admin', async () => {
  const r = await rpc('admin.waitlist');
  const live = r.rows.filter((w) => w.status !== 'removed');
  return {
    title: 'Waitlist',
    body: html`<div class="stack">${head('Waitlist', 'People asking to be told when tickets open, or when places come back. First come, first served.', html`<a class="btn line sm" href="/admin/messages?audience=waitlist">Message everyone waiting</a>`)}
      ${live.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Wants</th><th>Why</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>
        ${live.map((w, i) => html`<tr><td class="num">${i + 1}</td><td>${w.name}</td><td class="nowrap">${w.phoneDisplay} ${contactBtns(w.phoneDisplay)}</td><td>${w.qty} × ${w.wants === 'table' ? 'table' : 'GA'}</td><td>${w.reason === 'prelaunch' ? 'Notify at launch' : 'Sold out'}</td><td class="tiny dim">${fmtStamp(w.createdAt)}</td><td>${w.status}</td>
          <td><div class="row" style="--gap:6px">${['contacted', 'converted', 'removed'].filter((x) => x !== w.status).map((x) => html`<button class="btn line xs" data-w="${w.id}" data-status="${x}">${x === 'contacted' ? 'Contacted' : x === 'converted' ? 'Bought' : 'Remove'}</button>`)}</div></td></tr>`)}
      </tbody></table></div>` : html`<div class="empty"><h3>Nobody is waiting</h3><p>The ticket page offers “Notify me” before launch and a waitlist when releases sell out.</p></div>`}
    </div>`,
    mount(root) {
      bindCommon(root);
      on(root, 'click', '[data-w]', async (b) => { if (await act(b, () => rpc('admin.updateWaitlist', { id: b.dataset.w, status: b.dataset.status }))) render(app.fullPath, { keepScroll: true }); });
    },
  };
});

// ------------------------------------------------------------------ ambassadors
adminRoute('/admin/ambassadors', 'admin', async () => {
  const r = await rpc('admin.ambassadors');
  const base = app.site.venue.publicUrl || (app.mode === 'server' ? absUrl('/').replace(/\/$/, '') : '');
  return {
    title: 'Ambassadors',
    body: html`<div class="stack">${head('Ambassadors', `${r.pct}% commission on settled ticket value. Guest passes, refunds and unpaid holds don’t count.`)}
      <form class="panel inline-form" data-amb><label class="field"><span>Name</span><input name="name" required></label><label class="field"><span>Phone</span><input name="phone" type="tel"></label><label class="field"><span>Code <em>(optional)</em></span><input name="code" autocapitalize="characters" placeholder="Auto"></label><button class="btn sm" type="submit">Add ambassador</button><p class="form-error" data-err style="grid-column:1/-1"></p></form>
      ${r.rows.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>Code</th><th>Ambassador</th><th class="r">Settled tickets</th><th class="r">Face value</th><th class="r">Commission</th><th class="r">Unsettled</th><th>Link</th><th></th></tr></thead><tbody>
        ${r.rows.map((a) => html`<tr><td class="mono"><b>${a.code}</b></td><td>${a.name}${when(a.phone, html`<br><span class="dim">${a.phoneDisplay}</span>`)}</td><td class="r num">${a.tickets}</td><td class="r num">${fmtUGX(a.faceValue)}</td><td class="r num"><b>${fmtUGX(a.commission)}</b></td><td class="r num">${a.pending}</td>
          <td>${base ? html`<button class="btn line xs" data-copy="${base}/replay?ref=${a.code}">${icon('copy')}Copy link</button>` : html`<span class="tiny dim">Code at checkout</span>`}</td><td><button class="btn ghost xs" data-toggle="${a.id}" data-name="${a.name}" data-phone="${a.phone}" data-code="${a.code}" data-active="${a.active !== false ? '1' : ''}">${a.active !== false ? 'Pause' : 'Reactivate'}</button></td></tr>`)}
      </tbody></table></div>` : html`<div class="empty"><h3>No ambassadors yet</h3><p>Each ambassador gets a code. Buyers type it at checkout${app.mode === 'server' ? ', or arrive through their personal link' : ''}.</p></div>`}
    </div>`,
    mount(root) {
      bindCommon(root);
      on(root, 'submit', '[data-amb]', async (f, e) => { e.preventDefault(); if (await act(f.querySelector('button'), () => rpc('admin.saveAmbassador', formValues(f)), { errorEl: f.querySelector('[data-err]') })) { toast('Ambassador added', 'ok'); render(app.path); } });
      on(root, 'click', '[data-toggle]', async (b) => { const d = b.dataset; if (await act(b, () => rpc('admin.saveAmbassador', { id: d.toggle, name: d.name, phone: d.phone, code: d.code, active: !d.active }))) render(app.fullPath, { keepScroll: true }); });
    },
  };
});

// ------------------------------------------------------------------ songs
adminRoute('/admin/songs', 'admin', async () => {
  const r = await rpc('admin.songs');
  return {
    title: 'Song requests',
    body: html`<div class="stack">${head('Song requests', 'What buyers typed as their must-play song at checkout. Hand the top of this list to the Main Peak DJ.')}
      ${r.rows.length ? html`<div class="scroll-x"><table class="tbl" style="min-width:420px"><thead><tr><th>#</th><th>Song</th><th class="r">Requests</th></tr></thead><tbody>${r.rows.map((x, i) => html`<tr><td class="num">${i + 1}</td><td>${x.song}</td><td class="r num">${x.votes}</td></tr>`)}</tbody></table></div>` : html`<div class="empty"><h3>No requests yet</h3><p>Buyers can add one song each at checkout.</p></div>`}</div>`,
  };
});

// ------------------------------------------------------------------ messages
adminRoute('/admin/messages', 'admin', async () => {
  const st = app.query.status || '';
  const r = await rpc('admin.messages', { status: st });
  const aud = app.query.audience || 'replay_paid';
  const AUD = [['replay_paid', 'Replay ticket holders (paid & deposits)'], ['replay_all', 'Everyone with a live Replay order'], ['waitlist', 'Waitlist'], ['marketing', 'Customers who opted in to offers'], ['quiz_next', 'Teams for the next Quiz Night']];
  const label = { queued: html`<span class="pill warn plain">Queued</span>`, manual: html`<span class="pill line plain">To send</span>`, sent: html`<span class="pill ok plain">Sent</span>`, failed: html`<span class="pill red plain">Failed</span>`, cancelled: html`<span class="pill plain">Skipped</span>` };
  return {
    title: 'Messages',
    body: html`<div class="stack">${head('Messages', r.smsEnabled ? 'SMS is on: messages send automatically through Africa’s Talking.' : 'SMS is off: messages wait here. Tap WhatsApp to send each one, then mark it sent.')}
      <form class="panel form" data-broadcast><h2 class="h3">Message a group</h2>
        <label class="field"><span>Send to</span><select name="audience">${AUD.map(([k, l]) => html`<option value="${k}" ${k === aud ? 'selected' : ''}>${l}</option>`)}</select></label>
        <label class="field"><span>Message</span><textarea name="body" maxlength="600" required placeholder="${app.site.event.name} is this Saturday. Gates open ${fmtTime(app.site.event.gatesOpen)}. Have your QR ready before you reach the scan lane."></textarea><small class="hint" data-count>0 / 160 characters (1 SMS)</small></label>
        <p class="form-error" data-err></p><div class="row"><button class="btn line sm" type="button" data-dry>Count recipients</button><button class="btn sm" type="submit">Queue messages</button></div></form>
      <div class="tabs">${[['', 'All'], ['manual', 'To send'], ['queued', 'Queued'], ['sent', 'Sent'], ['failed', 'Failed']].map(([k, l]) => html`<a href="/admin/messages${k ? `?status=${k}` : ''}" aria-selected="${k === st}">${l}</a>`)}</div>
      ${r.rows.length ? html`<div class="scroll-x"><table class="tbl"><thead><tr><th>To</th><th>Message</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>
        ${r.rows.map((m) => html`<tr><td class="nowrap">${m.toDisplay}${when(m.ref, html`<br><span class="tiny mono dim">${m.ref}</span>`)}</td><td style="max-width:460px">${m.body}${when(m.error, html`<br><span class="tiny red">${m.error}</span>`)}</td><td>${label[m.status] || m.status}</td><td class="tiny dim">${fmtStamp(m.createdAt)}</td>
          <td><div class="row" style="--gap:6px"><a class="btn line xs" href="${waLink(m.to, m.body)}" target="_blank" rel="noopener" data-wa="${m.id}">${icon('chat')}WhatsApp</a>${when(m.status !== 'sent', html`<button class="btn ghost xs" data-sent="${m.id}">Mark sent</button>`)}</div></td></tr>`)}
      </tbody></table></div>` : html`<div class="empty"><h3>No messages</h3><p>Order confirmations, booking codes and group messages collect here.</p></div>`}
    </div>`,
    mount(root) {
      const f = root.querySelector('[data-broadcast]');
      const ta = f.querySelector('textarea');
      ta.addEventListener('input', () => { const n = ta.value.length; f.querySelector('[data-count]').textContent = `${n} / ${n <= 160 ? 160 : Math.ceil(n / 153) * 153} characters (${n <= 160 ? 1 : Math.ceil(n / 153)} SMS)`; });
      on(root, 'click', '[data-dry]', async (b) => { const v = formValues(f); const r2 = await act(b, () => rpc('admin.broadcast', { ...v, body: v.body || 'count', dryRun: true }), { errorEl: f.querySelector('[data-err]') }); if (r2) toast(`${r2.count} recipient${r2.count === 1 ? '' : 's'}`); });
      on(root, 'submit', '[data-broadcast]', async (form, e) => {
        e.preventDefault();
        const v = formValues(form);
        const n = await act(form.querySelector('button[type="submit"]'), () => rpc('admin.broadcast', { ...v, dryRun: true }), { errorEl: form.querySelector('[data-err]') });
        if (!n) return;
        if (!(await confirmDialog(`Send to ${n.count} ${n.count === 1 ? 'person' : 'people'}?`, 'Each person gets this message once.', 'Queue messages'))) return;
        const r2 = await act(form.querySelector('button[type="submit"]'), () => rpc('admin.broadcast', v), { errorEl: form.querySelector('[data-err]') });
        if (r2) { toast(`${r2.count} messages queued`, 'ok'); render('/admin/messages'); }
      });
      on(root, 'click', '[data-wa]', (a) => { rpc('admin.markMessage', { id: a.dataset.wa, status: 'sent', channel: 'whatsapp' }).then(() => setTimeout(() => render(app.fullPath, { keepScroll: true }), 600)).catch(() => {}); });
      on(root, 'click', '[data-sent]', async (b) => { if (await act(b, () => rpc('admin.markMessage', { id: b.dataset.sent, status: 'sent' }))) render(app.fullPath, { keepScroll: true }); });
    },
  };
});

// ------------------------------------------------------------------ settings
adminRoute('/admin/settings', 'admin', async () => {
  const r = await rpc('admin.settings');
  const s = r.settings;
  const ev = s.event;
  const p = s.payments;
  const a = s.amenities;
  const field = (name, label, value, type = 'text', extra = '') => html`<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${value ?? ''}" ${raw(extra)}></label>`;
  return {
    title: 'Settings',
    body: html`<div class="stack">${head('Settings', 'Changes apply immediately to the website.')}
      <form class="panel settings-sec" data-sec="payments" id="payments"><h2 class="h3">Payments</h2><p class="muted small">Buyers pay these merchant codes, then type their transaction ID. Ticket sales on the live site stay closed until at least one code is set.</p>
        <div class="two">${field('mtnMerchantCode', 'MTN MoMo merchant code', p.mtnMerchantCode)}${field('mtnMerchantName', 'MTN merchant name', p.mtnMerchantName)}</div>
        <div class="two">${field('airtelMerchantCode', 'Airtel Money merchant code', p.airtelMerchantCode)}${field('airtelMerchantName', 'Airtel merchant name', p.airtelMerchantName)}</div>
        ${field('note', 'Extra payment instruction', p.note)}<p class="form-error" data-err></p><div><button class="btn sm" type="submit">Save payments</button></div></form>

      <form class="panel settings-sec" data-sec="sales" id="sales"><h2 class="h3">Ticket sales</h2><p class="muted small">Each release runs until the next one opens or it sells out. Unsold tickets roll into the next release at its price.</p>
        <div class="two"><label class="field"><span>Sales</span><select name="salesMode"><option value="scheduled" ${ev.salesMode === 'scheduled' ? 'selected' : ''}>On (follow the release dates)</option><option value="paused" ${ev.salesMode === 'paused' ? 'selected' : ''}>Paused</option></select></label>
        <label class="field"><span>Open a release early</span><select name="forceRelease"><option value="">No, follow the dates</option>${ev.releases.map((x) => html`<option value="${x.key}" ${ev.forceRelease === x.key ? 'selected' : ''}>${x.name} now</option>`)}</select></label></div>
        <div class="scroll-x"><table class="tbl" style="min-width:680px"><thead><tr><th>Release</th><th>Quantity</th><th>Price (UGX)</th><th>Opens (date)</th><th>Opens (time)</th></tr></thead><tbody>
          ${ev.releases.map((x, i) => html`<tr><td><b>${x.name}</b>${x.doorOnly ? html`<br><span class="tiny dim">sold on the night</span>` : ''}</td><td><input name="r${i}_qty" type="number" min="0" value="${x.qty}" style="min-height:40px"></td><td><input name="r${i}_price" type="number" min="0" step="500" value="${x.price}" style="min-height:40px"></td><td><input name="r${i}_od" type="date" value="${x.opens.slice(0, 10)}" style="min-height:40px"></td><td><input name="r${i}_ot" type="time" value="${x.opens.slice(11, 16)}" style="min-height:40px"></td></tr>`)}
        </tbody></table></div>
        <div class="two">${field('maxPerOrder', 'Max tickets per order', ev.maxPerOrder, 'number', 'min="1" max="20"')}${field('holdMinutes', 'Hold time while paying (minutes)', ev.holdMinutes, 'number', 'min="5" max="240"')}</div>
        <p class="form-error" data-err></p><div><button class="btn sm" type="submit">Save ticket sales</button></div></form>

      <form class="panel settings-sec" data-sec="event" id="event"><h2 class="h3">Event</h2>
        <div class="two">${field('name', 'Name', ev.name)}${field('edition', 'Edition', ev.edition)}</div>
        <div class="two">${field('date', 'Date', ev.date, 'date')}${field('gatesOpen', 'Gates open', ev.gatesOpen, 'time')}</div>
        ${field('pitch', 'One-line description', ev.pitch)}
        <div class="two">${field('maxScans', 'Guest capacity (entry stops here)', ev.maxScans, 'number')}${field('paidTarget', 'Paid target', ev.paidTarget, 'number')}</div>
        <div class="two">${field('paidFloor', 'Paid floor', ev.paidFloor, 'number')}${field('depositPct', 'Table deposit %', ev.depositPct, 'number', 'min="10" max="100"')}</div>
        <div class="two">${field('balanceDue', 'Table balance due', ev.balanceDue, 'date')}${field('guestNamesDue', 'Guest names due', ev.guestNamesDue, 'date')}</div>
        <div class="two">${field('transferDeadline', 'Last day for transfers', ev.transferDeadline, 'date')}${field('tableHeldUntil', 'Tables held until', ev.tableHeldUntil, 'time')}</div>
        <h3 class="h4">Tables</h3>
        ${ev.tables.map((t, i) => html`<div class="inline-form"><p class="label" style="align-self:center">${t.name}</p>${field(`t${i}_price`, 'Price (UGX)', t.price, 'number')}${field(`t${i}_count`, 'Tables', t.count, 'number', 'min="0" max="30"')}${field(`t${i}_guests`, 'Guests each', t.guests, 'number', 'min="1" max="20"')}</div>`)}
        <p class="form-error" data-err></p><div><button class="btn sm" type="submit">Save event</button></div></form>

      <form class="panel settings-sec" data-sec="venue" id="venue"><h2 class="h3">Venue</h2>
        <div class="two">${field('phone', 'Phone', s.venue.phone)}${field('area', 'Area', s.venue.area)}</div>
        <div class="two">${field('landmark', 'Landmark', s.venue.landmark)}${field('slogan', 'Slogan', s.venue.slogan)}</div>
        <p class="form-error" data-err></p><div><button class="btn sm" type="submit">Save venue</button></div></form>

      <form class="panel settings-sec" data-sec="amenities" id="amenities"><h2 class="h3">Prices & booking rules</h2>
        <h3 class="h4">Gym passes (UGX)</h3><div class="inline-form">${a.gym.plans.map((x, i) => field(`g${i}`, x.name, x.price, 'number'))}</div>
        <h3 class="h4">Turf</h3><div class="inline-form">${field('turf_day', 'Day rate / hr', a.turf.dayRate, 'number')}${field('turf_night', 'Night rate / hr', a.turf.nightRate, 'number')}${field('turf_nightFrom', 'Night rate from', a.turf.nightFrom, 'time')}${field('turf_open', 'First slot', a.turf.open, 'time')}${field('turf_close', 'Closes', a.turf.close, 'time')}${field('turf_maxHours', 'Max hours per booking', a.turf.maxHours, 'number')}${field('turf_adult', 'Open session / person', a.turf.adultPerPerson, 'number')}</div>
        <h3 class="h4">Steam & sauna</h3><div class="inline-form">${field('sauna_adult', 'Adult', a.sauna.adult, 'number')}${field('sauna_kid', 'Kid', a.sauna.kid, 'number')}${field('sauna_cap', 'People per slot', a.sauna.capacity, 'number')}<label class="field"><span>Slots (comma separated)</span><input name="sauna_slots" value="${a.sauna.slots.join(', ')}"></label></div>
        <h3 class="h4">Kids soccer</h3><div class="inline-form">${field('kids_coach', 'With a coach', a.kids.withCoach, 'number')}${field('kids_only', 'Kids only', a.kids.kidsOnly, 'number')}${field('kids_time', 'Session time', a.kids.time, 'time')}${field('kids_cap', 'Places per Saturday', a.kids.capacity, 'number')}</div>
        <h3 class="h4">Quiz Night</h3><div class="inline-form">${field('quiz_time', 'Start', a.quiz.time, 'time')}${field('quiz_host', 'Host', a.quiz.host)}${field('quiz_max', 'Max teams', a.quiz.maxTeams, 'number')}${field('quiz_min', 'Min players', a.quiz.minSize, 'number')}${field('quiz_maxSize', 'Max players', a.quiz.maxSize, 'number')}${field('quiz_entry', 'Entry (UGX, 0 = free)', a.quiz.entry, 'number')}${field('quiz_prize', 'Round prize', a.quiz.roundPrize)}</div>
        <h3 class="h4">Penthouse (USD per night)</h3><div class="inline-form">${a.penthouse.packages.map((x, i) => field(`ph${i}`, x.name, x.price, 'number'))}</div>
        <p class="form-error" data-err></p><div><button class="btn sm" type="submit">Save prices</button></div></form>

      ${when(app.mode === 'server', html`<section class="panel settings-sec"><h2 class="h3">Backup</h2><p class="muted small">Download every order, booking, scan, message and setting as one JSON file. Keep a copy before the event and after big sales days.</p><div><button class="btn line sm" data-backup>${icon('download')}Download backup</button></div></section>`)}
      ${when(app.mode === 'preview', html`<section class="panel settings-sec"><h2 class="h3">Preview data</h2><p class="muted small">Delete every test order, booking, scan, message and waitlist entry made in this preview. Settings and ambassadors stay.</p><div><button class="btn line sm" data-reset>Clear test data</button></div></section>`)}
    </div>`,
    mount(root) {
      const num = (v) => Number(v);
      const build = {
        payments: (v) => ({ payments: { mtnMerchantCode: v.mtnMerchantCode.trim(), mtnMerchantName: v.mtnMerchantName.trim(), airtelMerchantCode: v.airtelMerchantCode.trim(), airtelMerchantName: v.airtelMerchantName.trim(), note: v.note.trim() } }),
        sales: (v) => ({ event: { salesMode: v.salesMode, forceRelease: v.forceRelease, maxPerOrder: num(v.maxPerOrder), holdMinutes: num(v.holdMinutes),
          releases: ev.releases.map((x, i) => ({ ...x, qty: num(v[`r${i}_qty`]), price: num(v[`r${i}_price`]), opens: `${v[`r${i}_od`]}T${v[`r${i}_ot`] || '00:00'}` })) } }),
        event: (v) => ({ event: { name: v.name, edition: v.edition, date: v.date, gatesOpen: v.gatesOpen, pitch: v.pitch, maxScans: num(v.maxScans), paidTarget: num(v.paidTarget), paidFloor: num(v.paidFloor), depositPct: num(v.depositPct), balanceDue: v.balanceDue, guestNamesDue: v.guestNamesDue, transferDeadline: v.transferDeadline, tableHeldUntil: v.tableHeldUntil,
          tables: ev.tables.map((t, i) => ({ ...t, price: num(v[`t${i}_price`]), count: num(v[`t${i}_count`]), guests: num(v[`t${i}_guests`]) })) } }),
        venue: (v) => ({ venue: { phone: v.phone, area: v.area, landmark: v.landmark, slogan: v.slogan } }),
        amenities: (v) => ({ amenities: {
          gym: { plans: a.gym.plans.map((x, i) => ({ ...x, price: num(v[`g${i}`]) })) },
          turf: { dayRate: num(v.turf_day), nightRate: num(v.turf_night), nightFrom: v.turf_nightFrom, open: v.turf_open, close: v.turf_close, maxHours: num(v.turf_maxHours), adultPerPerson: num(v.turf_adult) },
          sauna: { adult: num(v.sauna_adult), kid: num(v.sauna_kid), capacity: num(v.sauna_cap), slots: v.sauna_slots.split(',').map((x) => x.trim()).filter((x) => /^\d{2}:\d{2}$/.test(x)) },
          kids: { withCoach: num(v.kids_coach), kidsOnly: num(v.kids_only), time: v.kids_time, capacity: num(v.kids_cap) },
          quiz: { time: v.quiz_time, host: v.quiz_host, maxTeams: num(v.quiz_max), minSize: num(v.quiz_min), maxSize: num(v.quiz_maxSize), entry: num(v.quiz_entry), roundPrize: v.quiz_prize },
          penthouse: { packages: a.penthouse.packages.map((x, i) => ({ ...x, price: num(v[`ph${i}`]) })) },
        } }),
      };
      on(root, 'submit', '[data-sec]', async (f, e) => {
        e.preventDefault();
        const patch = build[f.dataset.sec](formValues(f));
        const ok = await act(f.querySelector('button[type="submit"]'), () => rpc('admin.saveSettings', { patch }), { errorEl: f.querySelector('[data-err]') });
        if (ok) { toast('Saved', 'ok'); app.site = await rpc('site.get'); }
      });
      on(root, 'click', '[data-backup]', async (b) => {
        const r = await act(b, () => rpc('admin.backup'));
        if (r) await saveFile(`social-spot-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(r, null, 1), 'application/json');
      });
      on(root, 'click', '[data-reset]', async (b) => {
        if (!(await confirmDialog('Clear all test data?', 'Orders, bookings, scans, messages and the waitlist in this preview are deleted. This can’t be undone.', 'Clear test data'))) return;
        if (await act(b, () => rpc('admin.resetPreview'))) { toast('Test data cleared', 'ok'); navigate('/admin'); }
      });
    },
  };
});

// ------------------------------------------------------------------ staff (server only)
adminRoute('/admin/staff', 'admin', async () => {
  if (app.mode !== 'server') return { redirect: '/admin' };
  const r = await rpc('staff.list');
  return {
    title: 'Staff logins',
    body: html`<div class="stack">${head('Staff logins', 'Admins see everything. Door staff only get the scanner, guest lookup and door sales.')}
      <form class="panel form" data-staff><h2 class="h3">Add a login</h2><div class="two"><label class="field"><span>Name</span><input name="name" required></label><label class="field"><span>Email</span><input name="email" type="email" required></label></div>
        <div class="two"><label class="field"><span>Role</span><select name="role"><option value="door">Door staff</option><option value="admin">Admin</option></select></label><label class="field"><span>Password <em>(8+ characters)</em></span><input name="password" type="password" minlength="8" required autocomplete="new-password"></label></div>
        <p class="form-error" data-err></p><div><button class="btn sm" type="submit">Create login</button></div></form>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead><tbody>
        ${r.rows.map((u) => html`<tr><td>${u.name}${u.id === r.me ? html` <span class="pill line plain">You</span>` : ''}</td><td>${u.email}</td><td>${u.role === 'admin' ? 'Admin' : 'Door'}</td><td>${u.active ? 'Active' : 'Disabled'}</td><td class="tiny dim">${u.lastLoginAt ? fmtStamp(u.lastLoginAt) : 'Never'}</td>
          <td><button class="btn line xs" data-edit='${JSON.stringify(u)}'>Edit</button></td></tr>`)}
      </tbody></table></div></div>`,
    mount(root) {
      on(root, 'submit', '[data-staff]', async (f, e) => { e.preventDefault(); if (await act(f.querySelector('button'), () => rpc('staff.save', formValues(f)), { errorEl: f.querySelector('[data-err]') })) { toast('Login created', 'ok'); render(app.path); } });
      on(root, 'click', '[data-edit]', (b) => {
        const u = JSON.parse(b.dataset.edit);
        dialog({ title: `Edit ${u.name}`, body: html`<label class="field"><span>Name</span><input name="name" value="${u.name}"></label><label class="field"><span>Email</span><input name="email" type="email" value="${u.email}"></label>
          <div class="two"><label class="field"><span>Role</span><select name="role"><option value="door" ${u.role === 'door' ? 'selected' : ''}>Door staff</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option></select></label><label class="field"><span>New password <em>(leave blank to keep)</em></span><input name="password" type="password" autocomplete="new-password"></label></div>
          <label class="check"><input type="checkbox" name="active" ${u.active ? 'checked' : ''}><span>Active</span></label>`,
        actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Save', submit: true, handler: async (v) => { await rpc('staff.save', { id: u.id, ...v }); toast('Saved', 'ok'); render(app.path); } }] });
      });
    },
  };
});
