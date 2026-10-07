// Shared UI pieces for the public site.
import { html, raw, icon, app, when } from './core.js';
import { fmtDate, fmtTime, fmtMoney, fmtUGX, eatTime, minutesOf } from '../shared/util.js';

export const money = (n, cur = 'UGX') => fmtMoney(n, cur);

// ---------------------------------------------------------------- venue photos
// Crops and sizes come from assets-src/photos/photos.json (scripts/prepare_photos.py).
// AVIF with a JPEG fallback, the right width for the screen, a blurred placeholder
// while it loads, and fixed proportions so nothing jumps. `mobile` names a second
// crop for phones (art direction). Returns '' when the photo isn't built (preview).
const PHONE = '(max-width: 699px)';
const srcset = (list) => list.map(([w, f]) => `${f} ${w}w`).join(', ');
export const hasPhoto = (id) => Boolean(app.assets.photos && app.assets.photos[id]);
export function photo(id, crop, { mobile = '', sizes = '100vw', eager = false, cls = '', alt } = {}) {
  const p = hasPhoto(id) && app.assets.photos[id];
  const c = p && p.crops[crop];
  if (!c) return '';
  const m = mobile && p.crops[mobile];
  const jpg = c.files.jpg;
  const style = `--ar:${c.w}/${c.h};${m ? `--ar-m:${m.w}/${m.h};` : ''}background-color:${c.color};background-image:url(${c.lqip})`;
  return html`<picture class="ph ${cls}" style="${style}">${when(m, () => html`<source media="${PHONE}" type="image/avif" srcset="${srcset(m.files.avif)}" sizes="100vw"><source media="${PHONE}" type="image/jpeg" srcset="${srcset(m.files.jpg)}" sizes="100vw">`)}<source type="image/avif" srcset="${srcset(c.files.avif)}" sizes="${sizes}"><img src="${jpg[Math.min(1, jpg.length - 1)][1]}" srcset="${srcset(jpg)}" sizes="${sizes}" width="${c.w}" height="${c.h}" alt="${alt == null ? p.alt : alt}" ${eager ? raw('fetchpriority="high"') : raw('loading="lazy"')} decoding="async"></picture>`;
}
/** A photo, or the logo on a dark tile when there's no photo of this yet (keeps card grids even). */
export function photoOrTile(id, crop, opts = {}) {
  return photo(id, crop, opts) || html`<div class="ph ph-tile ${opts.cls || ''}" style="--ar:3/2" aria-hidden="true"><img src="${app.assets.logoSmall}" alt="" width="520" height="172"></div>`;
}
/** Turf photo for the time of day: the floodlit one from the night rate onwards. */
export function turfPhotoId(nightFrom) {
  const now = minutesOf(eatTime(Date.now()));
  return now >= minutesOf(nightFrom || '18:00') || now < 6 * 60 ? 'turf-night' : 'turf-day';
}

export function contactFields(v = {}, { email = true, marketing = true, nameLabel = 'Full name' } = {}) {
  return html`
    <div class="two">
      <label class="field"><span>${nameLabel}</span><input name="name" autocomplete="name" required minlength="2" maxlength="60" value="${v.name || ''}" placeholder="e.g. Grace Namata"></label>
      <label class="field"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required value="${v.phone || ''}" placeholder="0772 123 456"><small class="hint">We send your confirmation here.</small></label>
    </div>
    ${when(email, html`<label class="field"><span>Email <em>(optional)</em></span><input name="email" type="email" autocomplete="email" value="${v.email || ''}" placeholder="you@example.com"></label>`)}
    ${when(marketing, html`<label class="check"><input type="checkbox" name="marketing" ${v.marketing ? 'checked' : ''}><span>Send me Social Spot offers and event news by SMS or WhatsApp<small>Optional. Stop any time.</small></span></label>`)}`;
}

/** Where to send money + the transaction-ID form. */
export function payPanel({ amount, currency = 'UGX', reference, holdUntil = null, title = 'Pay with mobile money', submitLabel = 'Send for confirmation', note = '', optional = false, id = 'pay-h' }) {
  const p = app.site.payments;
  const ready = p.ready;
  const rows = [];
  if (p.mtnMerchantCode) rows.push(html`<div class="merchant"><div><small>MTN MoMo · merchant code</small><b>${p.mtnMerchantCode}</b>${when(p.mtnMerchantName, html`<small>${p.mtnMerchantName}</small>`)}</div><button type="button" class="btn line sm" data-copy="${p.mtnMerchantCode}">${icon('copy')}Copy</button></div>`);
  if (p.airtelMerchantCode) rows.push(html`<div class="merchant"><div><small>Airtel Money · merchant code</small><b>${p.airtelMerchantCode}</b>${when(p.airtelMerchantName, html`<small>${p.airtelMerchantName}</small>`)}</div><button type="button" class="btn line sm" data-copy="${p.airtelMerchantCode}">${icon('copy')}Copy</button></div>`);
  return html`
  <section class="panel stack" style="--gap:18px" aria-labelledby="${id}">
    <div class="row between top">
      <div><p class="eyebrow">${optional ? 'Optional' : 'Amount due'}</p><h2 class="h2 num" id="${id}" style="margin-top:6px">${money(amount, currency)}</h2></div>
      ${when(holdUntil, () => { const ms = Math.max(0, holdUntil - (Date.now() + (app.clockSkew || 0))); return html`<div class="pill warn plain">Held for <span class="timer" data-timer="${holdUntil}">${Math.floor(ms / 6e4)}:${String(Math.floor((ms % 6e4) / 1e3)).padStart(2, '0')}</span></div>`; })}
    </div>
    ${when(note, html`<p class="muted small">${note}</p>`)}
    ${ready
      ? html`<ol class="pay-steps">
          <li><div>Pay <b class="num">${money(amount, currency)}</b> to a Social Spot merchant code with MTN MoMo or Airtel Money.</div></li>
          <li><div>Use <b class="mono">${reference}</b> as the reason. <button type="button" class="link-btn" data-copy="${reference}">Copy it</button></div></li>
          <li><div>Type the transaction ID from your confirmation SMS below.</div></li>
        </ol>
        <div class="stack" style="--gap:10px">${rows}</div>
        ${when(p.note, html`<p class="hint">${p.note}</p>`)}`
      : html`<div class="notice warn">${icon('info')}<div><b>Merchant codes aren’t published yet.</b> ${app.mode === 'preview' ? 'Add them in Admin → Settings. You can still test the flow with any transaction ID.' : html`Call <a href="tel:${app.site.venue.phone.replace(/\s/g, '')}">${app.site.venue.phone}</a> and we’ll take your payment.`}</div></div>`}
    <form class="form" data-pay novalidate>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Paid with</legend>
        <div class="seg"><label><input type="radio" name="method" value="mtn" checked><span>MTN MoMo</span></label><label><input type="radio" name="method" value="airtel"><span>Airtel Money</span></label></div>
      </fieldset>
      <div class="two">
        <label class="field"><span>Transaction ID</span><input name="txnId" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="From the SMS, e.g. 51234567890" class="mono"></label>
        <label class="field"><span>Paid from <em>(if not your number)</em></span><input name="payerPhone" type="tel" inputmode="tel" placeholder="0772 123 456"></label>
      </div>
      <p class="form-error" data-err aria-live="polite"></p>
      <button class="btn lg" type="submit">${submitLabel}${icon('arrow')}</button>
    </form>
  </section>`;
}

export function statusHead(tone, title, text) {
  return html`<div class="status-head"><span class="dot ${tone}"></span><div class="stack" style="--gap:6px"><h1 class="h1">${title}</h1>${when(text, html`<p class="lead">${text}</p>`)}</div></div>`;
}

export function stubHtml(pass, ev, { showActions = false, ownerName = '' } = {}) {
  const state = pass.state;
  const top = html`<div class="stub-top"><span class="ev">${ev.name}</span><span class="ed">${ev.edition}</span>
    <span class="who">${pass.holder.name}</span><span class="acc">${pass.accessLabel}${pass.table ? ` · Table ${pass.table}` : ''} · ${fmtDate(ev.date)} · Gates ${fmtTime(ev.gatesOpen)}</span></div>`;
  let body;
  if (state === 'valid' || state === 'used') {
    body = html`<div class="stub-qr"><div data-qr="${pass.code}" style="width:min(220px,70vw);aspect-ratio:1"></div><span class="code">${pass.code}</span><span class="lane">${pass.lane}</span></div>`;
  } else if (state === 'balance_due') {
    body = html`<div class="stub-hold"><b>Activates when the table balance is paid</b><span>The QR code appears here as soon as payment is confirmed.</span></div>`;
  } else if (state === 'void') {
    body = html`<div class="stub-hold"><b>This pass is no longer valid</b><span>It was cancelled or reissued to someone else.</span></div>`;
  } else {
    body = html`<div class="stub-hold"><b>Activates when payment is confirmed</b><span>Keep this page. The QR code appears here automatically.</span></div>`;
  }
  return html`<article class="stub ${state === 'used' ? 'used' : ''}" data-pass="${pass.id}">
    ${top}<div class="perf"></div>${body}
    ${when(state === 'used', html`<span class="stamp">Checked in</span>`)}
    ${when(state === 'void', html`<span class="stamp">Void</span>`)}
    ${when(showActions, () => html`<div class="stub-actions">${showActions}</div>`)}
  </article>`;
}

export function kv(rows) {
  return html`<dl class="kv">${rows.filter(Boolean).map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>`;
}

export { fmtDate, fmtTime, fmtUGX };
export const raws = raw;
