import { app, html, icon, when, rpc, render, on, toast, act, errText, formValues, saveFile } from '../core.js';
import { adminRoute } from './admin.js';
import { cameraAvailable, startCamera, decodeImageFile } from '../qr.js';
import { fmtDate, fmtTime, fmtUGX, eatTime, fmtStamp } from '../../shared/util.js';

const RESULTS = {
  admitted: ['admitted', 'Admit'],
  duplicate: ['deny', 'Already in'],
  unpaid: ['check', 'Not paid'],
  balance_due: ['check', 'Balance due'],
  void: ['deny', 'Not valid'],
  replaced: ['deny', 'Old code'],
  not_found: ['deny', 'Not found'],
  capacity: ['deny', 'Capacity reached'],
};
function resultHtml(r, lane) {
  if (!r) return html`<div class="result" aria-live="assertive"><span class="big dim">Ready</span><span class="muted">Scan a QR code or type the code below.</span></div>`;
  const [cls, label] = RESULTS[r.result] || ['deny', r.result];
  const p = r.pass;
  let detail = '';
  if (r.result === 'admitted') detail = html`<b style="font-size:20px">${p.holder}</b><span>${p.accessLabel}${p.table ? ` · Table ${p.table}` : ''}${p.comp ? ` · ${p.comp}` : ''}</span>${when(p.lane && lane && !laneMatches(p.lane, lane), html`<span class="small">Belongs at the ${p.lane}</span>`)}`;
  else if (r.result === 'duplicate') detail = html`<b>${p.holder}</b><span>First scanned at ${eatTime(p.checkedInAt)} · ${p.checkedLane}. Do not admit again.</span>`;
  else if (r.result === 'unpaid') detail = html`<b>${p.holder}</b><span>Payment isn’t confirmed (order ${p.ref}). Send them to the exception desk.</span>`;
  else if (r.result === 'balance_due') detail = html`<b>${p.holder} · Table ${p.table}</b><span>${fmtUGX(p.balance)} still owed. Send them to the exception desk to pay it.</span>`;
  else if (r.result === 'void') detail = html`<span>This ticket was cancelled${p ? ` (order ${p.ref})` : ''}.</span>`;
  else if (r.result === 'replaced') detail = html`<span>This code was reissued${p ? ` to ${p.holder}` : ''}. Ask for the current QR code.</span>`;
  else if (r.result === 'not_found') detail = html`<span>No ticket has code <b class="mono">${r.code}</b>. Check it, or look the guest up.</span>`;
  else if (r.result === 'capacity') detail = html`<span>The venue has reached ${r.max} guests. Entry is closed.</span>`;
  return html`<div class="result ${cls}" aria-live="assertive"><span class="big">${label}</span>${detail}</div>`;
}
const laneMatches = (passLane, lane) => (passLane.startsWith('GA') ? lane.startsWith('GA') : passLane.startsWith('Tables') ? lane.startsWith('Tables') : lane.startsWith('Accreditation')) || lane.startsWith('Exception');

function statsHtml(st) {
  const lanes = Object.entries(st.byLane).sort((a, b) => b[1] - a[1]);
  return html`<div class="panel tight stack" style="--gap:10px"><div class="inside"><b>${st.inside}</b><span class="muted">/ ${st.max} inside</span></div>
    <div class="bar"><i class="${st.inside / st.max > 0.92 ? '' : 'ok'}" style="width:${Math.min(100, (st.inside / Math.max(1, st.max)) * 100)}%"></i></div>
    ${lanes.length ? html`<dl class="kv small">${lanes.map(([l, n]) => html`<dt>${l}</dt><dd>${n}</dd>`)}</dl>` : html`<p class="hint">Nobody scanned in yet.</p>`}</div>
    <div class="stack" style="--gap:6px"><h3 class="h4">Recent scans</h3>${st.recent.length ? html`<ul class="log">${st.recent.slice(0, 8).map((x) => html`<li><time>${eatTime(x.at)}</time><span><b>${(RESULTS[x.result] || [0, x.result])[1]}</b> · ${x.holder || x.code} <span class="dim">· ${x.lane}</span></span></li>`)}</ul>` : html`<p class="hint">Scans appear here.</p>`}</div>`;
}

adminRoute('/admin/door', 'door', async (_p, ctx) => {
  const [st, site] = await Promise.all([rpc('door.stats'), rpc('site.get')]);
  let lane = st.lanes[0];
  try { lane = localStorage.getItem('ss-lane') || lane; } catch { /* ignore */ }
  if (!st.lanes.includes(lane)) lane = st.lanes[0];
  const cur = site.releases.find((r) => r.key === site.current);
  const cam = cameraAvailable();
  const notToday = st.today !== st.eventDate;
  let stop = null;
  let inflight = false;
  let last = null;
  return {
    title: 'Door',
    body: html`<div class="stack">
      <div class="page-head"><div><h1>Door</h1><p class="muted" style="margin-top:4px">${site.event.name} · ${fmtDate(st.eventDate, { long: true, longMonth: true })} · gates ${fmtTime(site.event.gatesOpen)}</p></div>
        <label class="field" style="min-width:220px"><span>This device is at</span><select data-lane>${st.lanes.map((l) => html`<option ${l === lane ? 'selected' : ''}>${l}</option>`)}</select></label></div>
      ${when(notToday, html`<div class="notice">${icon('info')}<div>It isn’t event day yet, so scans here are tests. They still check people in; undo a test from the guest lookup.</div></div>`)}
      <div class="door">
        <div class="stack" style="--gap:14px">
          <div class="cam" data-cam>${cam
            ? html`<video data-video playsinline muted hidden></video><span class="frame" data-frame hidden></span><div class="idle" data-idle>${icon('camera')}<p>Point the camera at the guest’s QR code.</p><button class="btn" data-start>Start scanning</button></div>`
            : html`<div class="idle">${icon('camera')}<p>${app.mode === 'preview' ? 'Live camera scanning runs on the deployed website. Here, take or choose a photo of the QR code:' : 'This browser can’t open the camera. Take or choose a photo of the QR code:'}</p>
                <label class="btn">${icon('camera')}Scan a photo<input type="file" accept="image/*" capture="environment" data-photo class="sr-only"></label></div>`}
          </div>
          <div data-result>${resultHtml(null)}</div>
          <form class="row" data-manual style="--gap:8px" novalidate><input name="code" class="mono" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="SS-XXXX-XXXX" aria-label="Ticket code" style="flex:1 1 200px"><button class="btn" type="submit">Check code</button></form>
        </div>
        <div class="stack" style="--gap:16px">
          <div data-stats>${statsHtml(st)}</div>
          <section class="stack" style="--gap:10px"><h3 class="h4">Guest lookup</h3>
            <form class="row" data-lookup style="--gap:8px"><input type="search" name="q" placeholder="Name, phone, RPL- or SS- code" style="flex:1 1 180px"><button class="btn line sm" type="submit">${icon('search')}Find</button></form>
            <div data-found></div></section>
          ${when(cur, () => html`<form class="panel tight form" data-sell><h3 class="h4">Sell at the door · ${cur.name} ${fmtUGX(cur.price)}</h3>
            <div class="two"><label class="field"><span>Tickets</span><input name="qty" type="number" min="1" max="20" value="1"></label><label class="field"><span>Paid by</span><select name="method"><option value="cash">Cash</option><option value="mtn">MTN MoMo</option><option value="airtel">Airtel Money</option></select></label></div>
            <div class="two"><label class="field"><span>Name</span><input name="name" placeholder="Door guest"></label><label class="field"><span>Txn ID <em>(MoMo/Airtel)</em></span><input name="txnId" class="mono"></label></div>
            <label class="check"><input type="checkbox" name="admit" checked><span>Check them in now</span></label><p class="form-error" data-err></p><button class="btn sm" type="submit">Record sale</button></form>`)}
          ${when(app.me.role === 'admin', html`<button class="btn line sm" data-export="guestlist" style="align-self:flex-start">Download guest list (backup)</button>`)}
        </div>
      </div></div>`,
    mount(root) {
      const resultBox = root.querySelector('[data-result]');
      const show = (r) => {
        last = r;
        resultBox.innerHTML = String(resultHtml(r, lane));
        if (navigator.vibrate) try { navigator.vibrate(r.result === 'admitted' ? 120 : [90, 60, 90, 60, 90]); } catch { /* ignore */ }
      };
      const refreshStats = async () => { try { root.querySelector('[data-stats]').innerHTML = String(statsHtml(await rpc('door.stats'))); } catch { /* offline */ } };
      const scan = async (code) => {
        if (inflight) return;
        inflight = true;
        try { show(await rpc('door.scan', { code, lane })); refreshStats(); } catch (e) { toast(errText(e), 'bad'); } finally { inflight = false; }
      };
      root.querySelector('[data-lane]').addEventListener('change', (e) => { lane = e.target.value; try { localStorage.setItem('ss-lane', lane); } catch { /* ignore */ } });
      on(root, 'submit', '[data-manual]', (f, e) => { e.preventDefault(); const v = formValues(f).code.trim(); if (v) { scan(v); f.reset(); f.querySelector('input').focus(); } });
      on(root, 'click', '[data-start]', async (b) => {
        const video = root.querySelector('[data-video]');
        try {
          stop = await startCamera(video, scan);
          video.hidden = false; root.querySelector('[data-frame]').hidden = false; root.querySelector('[data-idle]').hidden = true;
        } catch (e) { toast(e && e.name === 'NotAllowedError' ? 'Allow camera access in your browser settings, then try again.' : errText(e), 'bad'); }
      });
      on(root, 'change', '[data-photo]', async (input) => {
        const f = input.files && input.files[0];
        input.value = '';
        if (!f) return;
        try {
          const code = await decodeImageFile(f);
          if (code) scan(code); else toast('No QR code found in that photo. Try again closer, or type the code.', 'bad');
        } catch (e) { toast(errText(e), 'bad'); }
      });
      const doLookup = async (q) => {
        const box = root.querySelector('[data-found]');
        try {
          const r = await rpc('door.lookup', { q });
          box.innerHTML = String(r.results.length ? html`<div class="stack" style="--gap:8px">${r.results.map((p) => html`<div class="panel tight stack" style="--gap:6px"><div class="row between"><b>${p.holder}</b><span class="pill ${p.state === 'valid' ? 'ok' : p.state === 'used' ? 'plain' : 'warn'}">${{ valid: 'Valid', used: 'Checked in', pending: 'Not paid', balance_due: 'Balance due', void: 'Void' }[p.state]}</span></div>
            <span class="small muted">${p.accessLabel}${p.table ? ` · ${p.table}` : ''} · <span class="mono">${p.code}</span> · ${p.ref}${p.buyer !== p.holder ? ` · bought by ${p.buyer}` : ''}</span>
            ${when(p.state === 'used', html`<span class="tiny dim">In at ${eatTime(p.checkedInAt)} · ${p.checkedLane}</span>`)}
            <div class="row" style="--gap:6px">${when(p.state === 'valid', html`<button class="btn ok xs" data-admit="${p.passId}">Admit</button>`)}${when(p.state === 'used', html`<button class="btn line xs" data-undo="${p.passId}">Undo check-in</button>`)}${when(app.me.role === 'admin', html`<a class="btn ghost xs" href="/admin/orders/${p.orderId}">Open order</a>`)}</div></div>`)}</div>` : html`<p class="hint">Nobody matches “${q}”.</p>`);
        } catch (e) { box.innerHTML = String(html`<p class="form-error">${errText(e)}</p>`); }
      };
      on(root, 'submit', '[data-lookup]', (f, e) => { e.preventDefault(); doLookup(formValues(f).q); });
      on(root, 'click', '[data-admit]', async (b) => { const r = await act(b, () => rpc('door.admit', { passId: b.dataset.admit, lane })); if (r) { show({ result: 'admitted', pass: r.pass, inside: r.inside, max: r.max }); refreshStats(); doLookup(root.querySelector('[data-lookup] input').value); } });
      on(root, 'click', '[data-undo]', async (b) => { if (await act(b, () => rpc('door.undo', { passId: b.dataset.undo }), { okMsg: 'Check-in undone' })) { refreshStats(); doLookup(root.querySelector('[data-lookup] input').value); } });
      on(root, 'submit', '[data-sell]', async (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        const r = await act(f.querySelector('button[type="submit"]'), () => rpc('door.sell', { ...v, lane }), { errorEl: f.querySelector('[data-err]') });
        if (r) { toast(`Sold ${r.order.qty}: ${r.order.passes.map((p) => p.code).join(', ')}`, 'ok'); f.reset(); refreshStats(); }
      });
      on(root, 'click', '[data-export]', async (b) => {
        const r = await act(b, () => rpc('admin.export', { kind: b.dataset.export }));
        if (r) { try { await saveFile(r.filename, r.csv); } catch (e) { toast(errText(e), 'bad'); } }
      });
      ctx.every(10000, refreshStats);
      ctx.onCleanup(() => { if (stop) stop(); });
      root.querySelector('[data-manual] input').focus({ preventScroll: true });
    },
  };
});
