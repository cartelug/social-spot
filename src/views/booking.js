import { app, html, icon, when, rpc, route, navigate, render, on, toast, act, copyText, refreshSite, formValues, confirmDialog } from '../core.js';
import { contactFields, payPanel, statusHead, kv, money } from '../components.js';
import { fmtDate, fmtTime, fmtUGX, addDays, daysBetween, minutesOf, timeOf, eatDate } from '../../shared/util.js';

const TYPES = {
  turf: { title: 'Book the turf', eyebrow: 'Football turf', lead: 'Pick a day and up to three hours in a row. Day and night rates, paid at reception or by mobile money.' },
  gym: { title: 'Get a gym pass', eyebrow: 'Gym', lead: 'Choose a pass and when you’ll start. Pay at reception or by mobile money; we activate it when you arrive.' },
  sauna: { title: 'Book steam & sauna', eyebrow: 'Steam & sauna', lead: 'Pick a time and tell us who’s coming.' },
  penthouse: { title: 'Request a penthouse stay', eyebrow: 'Penthouse', lead: 'Choose how much of the floor you want and your dates. We confirm availability and payment with you by phone.' },
  kids: { title: 'Book kids soccer', eyebrow: 'Kids soccer', lead: 'Saturday training on the turf, with a coach or just for play.' },
  table: { title: 'Reserve a table', eyebrow: 'Tables', lead: 'Sunday Family Dinner, birthdays, team nights. Reservations are free; we confirm by SMS.' },
};

const dateRange = (from, n) => Array.from({ length: n }, (_, i) => addDays(from, i));
const chipDate = (d, today) => (d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : fmtDate(d).split(' ')[0]);
function chipsHtml(dates, sel, today, sub = () => '', dis = () => false, attr = 'data-date') {
  return html`<div class="chips" role="group" aria-label="Choose a date">${dates.map((d) => html`<button type="button" class="chip" ${attr}="${d}" aria-pressed="${d === sel ? 'true' : 'false'}" ${dis(d) ? 'disabled' : ''}><span>${chipDate(d, today)}</span><small>${sub(d) || fmtDate(d, { noDow: true })}</small></button>`)}</div>`;
}
function stepperHtml(name, value, min, max, label) {
  return html`<div class="field"><span>${label}</span><div class="stepper" data-stepper="${name}" data-min="${min}" data-max="${max}"><button type="button" data-d="-1" aria-label="Fewer" ${value <= min ? 'disabled' : ''}>−</button><output aria-live="polite">${value}</output><button type="button" data-d="1" aria-label="More" ${value >= max ? 'disabled' : ''}>+</button><input type="hidden" name="${name}" value="${value}"></div></div>`;
}
function bindSteppers(root, onChange) {
  on(root, 'click', '[data-stepper] [data-d]', (b) => {
    const box = b.closest('[data-stepper]');
    const input = box.querySelector('input');
    const min = Number(box.dataset.min), max = Number(box.dataset.max);
    const v = Math.min(max, Math.max(min, Number(input.value) + Number(b.dataset.d)));
    input.value = v;
    box.querySelector('output').textContent = v;
    box.querySelector('[data-d="-1"]').disabled = v <= min;
    box.querySelector('[data-d="1"]').disabled = v >= max;
    if (onChange) onChange(box.dataset.stepper, v);
  });
}
function payChoice(price, currency = 'UGX') {
  if (!(price > 0)) return '';
  const p = app.site.payments;
  return html`<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Payment</legend>
    <div class="seg"><label><input type="radio" name="payWhen" value="venue" checked><span>Pay at Social Spot</span></label><label><input type="radio" name="payWhen" value="momo"><span>I’ve paid by mobile money</span></label></div>
    <div data-momo hidden class="stack" style="--gap:12px;margin-top:12px">
      ${when(p.ready, html`<p class="hint">Pay ${currency === 'UGX' ? 'the amount below' : 'the amount we quote you'} to ${p.mtnMerchantCode ? html`MTN MoMo merchant <b class="mono">${p.mtnMerchantCode}</b>` : ''}${p.mtnMerchantCode && p.airtelMerchantCode ? ' or ' : ''}${p.airtelMerchantCode ? html`Airtel Money merchant <b class="mono">${p.airtelMerchantCode}</b>` : ''}, then enter the transaction ID.</p>`)}
      <div class="two"><label class="field"><span>Network</span><select name="payMethod"><option value="mtn">MTN MoMo</option><option value="airtel">Airtel Money</option></select></label>
      <label class="field"><span>Transaction ID</span><input name="txnId" class="mono" autocapitalize="characters" spellcheck="false" placeholder="From the SMS"></label></div>
    </div></fieldset>`;
}
function bindPayChoice(root) {
  on(root, 'change', 'input[name="payWhen"]', (r) => { const box = root.querySelector('[data-momo]'); if (box) box.hidden = r.value !== 'momo'; });
}
function shell(type, form, aside) {
  const t = TYPES[type];
  return html`<section class="section"><div class="wrap stack" style="--gap:26px">
    <a href="/book" class="btn ghost sm" style="justify-self:start">${icon('back')}All bookings</a>
    <div><p class="eyebrow red">${t.eyebrow}</p><h1 class="h1" style="margin-top:8px">${t.title}</h1><p class="lead" style="margin-top:12px">${t.lead}</p></div>
    <div class="split with-aside"><div class="min0">${form}</div><aside class="stack" style="--gap:14px;align-self:start">${aside}</aside></div>
  </div></section>`;
}
async function submit(form, payload) {
  const v = formValues(form);
  const body = {
    ...payload,
    contact: { name: v.name, phone: v.phone, email: v.email },
    consents: { marketing: v.marketing },
    note: v.note,
    payment: v.payWhen === 'momo' ? { method: v.payMethod, txnId: v.txnId } : null,
  };
  if (v.payWhen === 'momo' && !String(v.txnId || '').trim()) { form.querySelector('[data-err]').textContent = 'Enter the transaction ID, or choose to pay at Social Spot.'; return; }
  app.buyer = { ...(app.buyer || {}), name: v.name, phone: v.phone, email: v.email };
  const r = await act(form.querySelector('button[type="submit"]'), () => rpc('booking.create', body), { errorEl: form.querySelector('[data-err]') });
  if (r) navigate(`/b/${r.token}`, { replace: true });
}
const footer = (label) => html`<label class="field"><span>Anything we should know? <em>(optional)</em></span><textarea name="note" maxlength="300" rows="3"></textarea></label>
  <p class="form-error" data-err aria-live="polite"></p><button class="btn lg" type="submit">${label} ${icon('arrow')}</button>`;

// ------------------------------------------------------------------ hub
route('/book', async () => {
  const s = await refreshSite();
  const a = s.amenities;
  const cards = [
    ['/book/turf', 'Football turf', `From ${fmtUGX(a.turf.dayRate)} an hour`, 'Book by the hour, day or night.'],
    ['/book/gym', 'Gym pass', `From ${fmtUGX(a.gym.plans[0].price)} a day`, 'Day, monthly and annual passes.'],
    ['/book/sauna', 'Steam & sauna', `${fmtUGX(a.sauna.adult)} adults · ${fmtUGX(a.sauna.kid)} kids`, 'Pick a slot.'],
    ['/book/penthouse', 'Penthouse stay', `From ${money(Math.min(...a.penthouse.packages.map((p) => p.price)), 'USD')} a night`, 'Five ways to stay.'],
    ['/book/kids', 'Kids soccer', `From ${fmtUGX(a.kids.kidsOnly)}`, 'Saturday training.'],
    ['/quiz', 'Quiz Night team', a.quiz.entry ? fmtUGX(a.quiz.entry) : 'Free entry', `Saturdays, ${fmtTime(a.quiz.time)}.`],
    ['/book/table', 'Table reservation', 'Free', 'Family Dinner Sundays and group nights.'],
  ];
  return {
    title: 'Book',
    body: html`<section class="section"><div class="wrap stack" style="--gap:28px">
      <div><p class="eyebrow red">Book online</p><h1 class="h1" style="margin-top:8px">What are you coming for?</h1><p class="lead" style="margin-top:12px">Every booking gets a code by SMS. Show it at reception. ${a.loyalty}</p></div>
      <div class="grid" style="--min:280px">${cards.map(([href, name, price, text]) => html`<a class="amenity" href="${href}" style="text-decoration:none"><h2 class="h3">${name}</h2><p class="muted small">${text}</p><p class="h4 num">${price}</p><span class="btn line sm">Book ${icon('arrow')}</span></a>`)}</div>
      <p class="hint">Already booked? <a href="/tickets">Find your booking</a> with your phone number and SB- code.</p>
    </div></section>`,
  };
});

// ------------------------------------------------------------------ turf
route('/book/turf', async () => {
  const s = await refreshSite();
  const t = s.amenities.turf;
  const today = s.today;
  const dates = dateRange(today, 14);
  const state = { date: today, slots: [], grid: [] };
  const load = async () => { state.grid = (await rpc('booking.availability', { type: 'turf', date: state.date })).slots; };
  await load();
  if (!state.grid.some((g) => g.state === 'free')) { state.date = addDays(today, 1); await load(); }
  const slotsHtml = () => html`<div class="slots" role="group" aria-label="Hours">${state.grid.map((g) => {
    const free = g.state === 'free';
    const label = g.state === 'booked' ? 'Booked' : g.state === 'open_session' ? 'Open session' : g.state === 'past' ? 'Passed' : `${fmtUGX(g.rate)}`;
    return html`<button type="button" class="slot ${g.night ? 'night' : ''}" data-slot="${g.time}" aria-pressed="${state.slots.includes(g.time) ? 'true' : 'false'}" ${free ? '' : 'disabled'}><b>${fmtTime(g.time)}</b><small>${label}</small></button>`;
  })}</div>`;
  const summary = () => {
    if (!state.slots.length) return html`<div class="panel stack" style="--gap:8px"><h2 class="h4">Your booking</h2><p class="muted small">Pick one to ${t.maxHours} hours in a row.</p></div>`;
    const end = timeOf(minutesOf(state.slots[state.slots.length - 1]) + 60);
    const price = state.slots.reduce((x, tm) => x + state.grid.find((g) => g.time === tm).rate, 0);
    return html`<div class="panel stack" style="--gap:12px"><h2 class="h4">Your booking</h2>${kv([['Date', fmtDate(state.date, { long: true, longMonth: true })], ['Time', `${fmtTime(state.slots[0])} – ${fmtTime(end)}`], ['Hours', state.slots.length], ['Price', html`<b>${fmtUGX(price)}</b>`]])}</div>`;
  };
  return {
    title: 'Book the turf',
    body: shell('turf', html`<form class="form panel" data-book novalidate>
      <div class="field"><span>Day</span><div data-dates>${chipsHtml(dates, state.date, today)}</div></div>
      <div class="field"><span>Hours <em>· night rate from ${fmtTime(t.nightFrom)} · Wed–Fri 7–11 PM is an open session</em></span><div data-slots>${slotsHtml()}</div></div>
      <div class="two"><label class="field"><span>Team name <em>(optional)</em></span><input name="team" maxlength="60"></label><label class="field"><span>Players <em>(optional)</em></span><input name="players" type="number" min="1" max="30" inputmode="numeric"></label></div>
      ${contactFields(app.buyer)}
      ${payChoice(1)}
      ${footer('Book the turf')}
    </form>`, html`<div data-summary>${summary()}</div><div class="panel tight small muted">${kv([['Day rate', `${fmtUGX(t.dayRate)} / hr`], ['Night rate', `${fmtUGX(t.nightRate)} / hr`]])}</div>`),
    mount(root) {
      const redraw = () => { root.querySelector('[data-slots]').innerHTML = String(slotsHtml()); root.querySelector('[data-summary]').innerHTML = String(summary()); };
      bindPayChoice(root);
      on(root, 'click', '[data-date]', async (b) => {
        state.date = b.dataset.date; state.slots = [];
        root.querySelectorAll('[data-date]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        await load(); redraw();
      });
      on(root, 'click', '[data-slot]', (b) => {
        const tm = b.dataset.slot;
        const sl = state.slots;
        const m = minutesOf(tm);
        if (sl.includes(tm)) {
          state.slots = tm === sl[0] ? sl.slice(1) : tm === sl[sl.length - 1] ? sl.slice(0, -1) : [tm];
        } else if (sl.length && sl.length < t.maxHours && (m === minutesOf(sl[0]) - 60 || m === minutesOf(sl[sl.length - 1]) + 60)) {
          state.slots = [...sl, tm].sort();
        } else state.slots = [tm];
        redraw();
      });
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        if (!state.slots.length) { f.querySelector('[data-err]').textContent = 'Pick at least one hour.'; return; }
        const v = formValues(f);
        submit(f, { type: 'turf', date: state.date, slots: state.slots, details: { team: v.team, players: v.players } });
      });
    },
  };
});

// ------------------------------------------------------------------ sauna
route('/book/sauna', async () => {
  const s = await refreshSite();
  const c = s.amenities.sauna;
  const today = s.today;
  const dates = dateRange(today, 14);
  const state = { date: today, time: '', slots: [], adults: 1, kids: 0 };
  const load = async () => { state.slots = (await rpc('booking.availability', { type: 'sauna', date: state.date })).slots; };
  await load();
  if (!state.slots.some((x) => !x.past && x.left > 0)) { state.date = addDays(today, 1); await load(); }
  const timesHtml = () => html`<div class="chips wrap-chips">${state.slots.map((x) => html`<button type="button" class="chip" data-time="${x.time}" aria-pressed="${x.time === state.time ? 'true' : 'false'}" ${x.past || !x.left ? 'disabled' : ''}><span>${fmtTime(x.time)}</span><small>${x.past ? 'passed' : x.left ? `${x.left} left` : 'full'}</small></button>`)}</div>`;
  const price = () => state.adults * c.adult + state.kids * c.kid;
  const summary = () => html`<div class="panel stack" style="--gap:12px"><h2 class="h4">Your session</h2>${kv([['Date', fmtDate(state.date, { long: true, longMonth: true })], ['Time', state.time ? fmtTime(state.time) : 'Pick a time'], ['People', `${state.adults} adult${state.adults === 1 ? '' : 's'}${state.kids ? `, ${state.kids} kid${state.kids === 1 ? '' : 's'}` : ''}`], ['Price', html`<b>${fmtUGX(price())}</b>`]])}</div>`;
  return {
    title: 'Steam & sauna',
    body: shell('sauna', html`<form class="form panel" data-book novalidate>
      <div class="field"><span>Day</span>${chipsHtml(dates, state.date, today)}</div>
      <div class="field"><span>Time</span><div data-times>${timesHtml()}</div></div>
      <div class="row" style="--gap:24px">${stepperHtml('adults', 1, 0, c.capacity, `Adults · ${fmtUGX(c.adult)}`)}${stepperHtml('kids', 0, 0, c.capacity, `Kids · ${fmtUGX(c.kid)}`)}</div>
      ${contactFields(app.buyer)}
      ${payChoice(1)}
      ${footer('Book the session')}
    </form>`, html`<div data-summary>${summary()}</div>`),
    mount(root) {
      const redraw = () => { root.querySelector('[data-times]').innerHTML = String(timesHtml()); root.querySelector('[data-summary]').innerHTML = String(summary()); };
      bindPayChoice(root);
      bindSteppers(root, (n, v) => { state[n] = v; redraw(); });
      on(root, 'click', '[data-date]', async (b) => { state.date = b.dataset.date; state.time = ''; root.querySelectorAll('[data-date]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); await load(); redraw(); });
      on(root, 'click', '[data-time]', (b) => { state.time = b.dataset.time; redraw(); });
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        if (!state.time) { f.querySelector('[data-err]').textContent = 'Pick a time.'; return; }
        submit(f, { type: 'sauna', date: state.date, time: state.time, details: { adults: state.adults, kids: state.kids } });
      });
    },
  };
});

// ------------------------------------------------------------------ gym
route('/book/gym', async () => {
  const s = await refreshSite();
  const g = s.amenities.gym;
  const state = { plan: g.plans[0].key };
  const planOf = () => g.plans.find((p) => p.key === state.plan);
  const summary = () => html`<div class="panel stack" style="--gap:12px"><h2 class="h4">Your pass</h2>${kv([['Pass', planOf().name], ['Price', html`<b>${fmtUGX(planOf().price)}</b>`]])}<p class="hint">Weekly classes: ${g.classes.slice(1).concat(g.classes[0]).map((c, i) => `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]} ${c}`).join(' · ')}.</p></div>`;
  return {
    title: 'Gym pass',
    body: shell('gym', html`<form class="form panel" data-book novalidate>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:10px">Pass</legend>
        <div class="grid" style="--min:200px;--gap:10px">${g.plans.map((p, i) => html`<label class="panel tight" style="cursor:pointer;display:grid;gap:4px"><span class="row between"><b>${p.name}</b><input type="radio" name="plan" value="${p.key}" ${i === 0 ? 'checked' : ''} style="width:20px;min-height:0;height:20px;accent-color:#ce2b26"></span><span class="num muted">${fmtUGX(p.price)}</span></label>`)}</div></fieldset>
      <div class="two"><label class="field"><span>Start date</span><input type="date" name="date" required min="${s.today}" max="${addDays(s.today, 60)}" value="${s.today}"></label>
      <label class="field"><span>Usual session</span><select name="session">${g.sessions.map((x) => html`<option value="${x.key}">${x.name}, ${fmtTime(x.from)}–${fmtTime(x.to)}</option>`)}</select></label></div>
      ${contactFields(app.buyer)}
      ${payChoice(1)}
      ${footer('Request my pass')}
    </form>`, html`<div data-summary>${summary()}</div>`),
    mount(root) {
      bindPayChoice(root);
      on(root, 'change', 'input[name="plan"]', (r) => { state.plan = r.value; root.querySelector('[data-summary]').innerHTML = String(summary()); });
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        submit(f, { type: 'gym', date: v.date, details: { plan: v.plan, session: v.session } });
      });
    },
  };
});

// ------------------------------------------------------------------ penthouse
route('/book/penthouse', async () => {
  const s = await refreshSite();
  const ph = s.amenities.penthouse;
  const av = await rpc('booking.availability', { type: 'penthouse' });
  const booked = new Set(av.booked);
  const ranges = [];
  for (const d of av.booked) {
    const last = ranges[ranges.length - 1];
    if (last && addDays(last[1], 1) === d) last[1] = d; else ranges.push([d, d]);
  }
  const state = { pkg: ph.packages[0].key, from: addDays(s.today, 1), to: addDays(s.today, 2), guests: 2 };
  const pkgOf = () => ph.packages.find((p) => p.key === state.pkg);
  const nights = () => Math.max(0, daysBetween(state.from, state.to));
  const clash = () => { for (let d = state.from; d < state.to; d = addDays(d, 1)) if (booked.has(d)) return d; return null; };
  const summary = () => {
    const n = nights();
    const c = clash();
    return html`<div class="panel stack" style="--gap:12px"><h2 class="h4">Your stay</h2>${kv([['Package', pkgOf().name], ['Check-in', fmtDate(state.from, { long: true, longMonth: true })], ['Check-out', fmtDate(state.to, { long: true, longMonth: true })], ['Nights', n], ['Rate', `${money(pkgOf().price, 'USD')} / night`], ['Total', html`<b>${money(n * pkgOf().price, 'USD')}</b>`]])}
      ${when(c, html`<div class="notice red">${icon('alert')}<div>The penthouse is taken on ${fmtDate(c, { longMonth: true })}. Try other dates.</div></div>`)}
      <p class="hint">This is a request. We confirm availability and how to pay on the phone.</p></div>`;
  };
  return {
    title: 'Penthouse stay',
    body: shell('penthouse', html`<form class="form panel" data-book novalidate>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:10px">Package</legend>
        <div class="stack" style="--gap:8px">${ph.packages.map((p, i) => html`<label class="panel tight row between" style="cursor:pointer"><span class="row" style="--gap:12px"><input type="radio" name="pkg" value="${p.key}" ${i === 0 ? 'checked' : ''} style="width:20px;min-height:0;height:20px;accent-color:#ce2b26"><span><b>${p.name}</b><br><span class="hint">Sleeps up to ${p.guests}</span></span></span><b class="num">${money(p.price, 'USD')}<span class="hint"> / night</span></b></label>`)}</div></fieldset>
      <div class="two"><label class="field"><span>Check-in</span><input type="date" name="from" required min="${s.today}" max="${addDays(s.today, ph.daysAhead)}" value="${state.from}"></label>
      <label class="field"><span>Check-out</span><input type="date" name="to" required min="${addDays(s.today, 1)}" max="${addDays(s.today, ph.daysAhead + ph.maxNights)}" value="${state.to}"></label></div>
      ${when(ranges.length, html`<p class="hint">Already booked: ${ranges.slice(0, 8).map(([a, b]) => (a === b ? fmtDate(a, { noDow: true }) : `${fmtDate(a, { noDow: true })} – ${fmtDate(b, { noDow: true })}`)).join(', ')}.</p>`)}
      ${stepperHtml('guests', 2, 1, pkgOf().guests, 'Guests')}
      ${contactFields(app.buyer)}
      ${footer('Send my request')}
    </form>`, html`<div data-summary>${summary()}</div>`),
    mount(root) {
      const redraw = () => { root.querySelector('[data-summary]').innerHTML = String(summary()); };
      bindSteppers(root, (n, v) => { state[n] = v; });
      on(root, 'change', 'input[name="pkg"]', (r) => {
        state.pkg = r.value;
        const box = root.querySelector('[data-stepper="guests"]');
        box.dataset.max = pkgOf().guests;
        const inp = box.querySelector('input');
        if (Number(inp.value) > pkgOf().guests) { inp.value = pkgOf().guests; box.querySelector('output').textContent = pkgOf().guests; state.guests = pkgOf().guests; }
        box.querySelector('[data-d="1"]').disabled = Number(inp.value) >= pkgOf().guests;
        redraw();
      });
      on(root, 'change', 'input[name="from"], input[name="to"]', (i) => {
        state[i.name] = i.value;
        if (i.name === 'from' && state.to <= state.from) { state.to = addDays(state.from, 1); root.querySelector('input[name="to"]').value = state.to; }
        redraw();
      });
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        submit(f, { type: 'penthouse', date: v.from, endDate: v.to, details: { package: v.pkg, guests: v.guests } });
      });
    },
  };
});

// ------------------------------------------------------------------ kids
route('/book/kids', async () => {
  const s = await refreshSite();
  const k = s.amenities.kids;
  const days = s.kidsDays;
  const state = { date: (days.find((d) => !d.full) || days[0]).date, option: 'withCoach' };
  const summary = () => html`<div class="panel stack" style="--gap:12px"><h2 class="h4">Your booking</h2>${kv([['Saturday', fmtDate(state.date, { long: true, longMonth: true })], ['Session', k.time ? fmtTime(k.time) : 'Coach confirms the time by SMS'], ['Price', html`<b>${fmtUGX(state.option === 'withCoach' ? k.withCoach : k.kidsOnly)}</b>`]])}</div>`;
  return {
    title: 'Kids soccer',
    body: shell('kids', html`<form class="form panel" data-book novalidate>
      <div class="field"><span>Saturday</span>${chipsHtml(days.map((d) => d.date), state.date, s.today, (d) => { const x = days.find((y) => y.date === d); return x.full ? 'full' : `${x.max - x.kids} places`; }, (d) => days.find((y) => y.date === d).full)}</div>
      <div class="two"><label class="field"><span>Child’s name</span><input name="child" required maxlength="60"></label><label class="field"><span>Age</span><input name="age" type="number" min="3" max="17" required inputmode="numeric"></label></div>
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Session</legend><div class="seg"><label><input type="radio" name="option" value="withCoach" checked><span>With a coach · ${fmtUGX(k.withCoach)}</span></label><label><input type="radio" name="option" value="kidsOnly"><span>Kids only · ${fmtUGX(k.kidsOnly)}</span></label></div></fieldset>
      ${contactFields(app.buyer, { nameLabel: 'Parent or guardian' })}
      ${payChoice(1)}
      ${footer('Book Saturday')}
    </form>`, html`<div data-summary>${summary()}</div>`),
    mount(root) {
      const redraw = () => { root.querySelector('[data-summary]').innerHTML = String(summary()); };
      bindPayChoice(root);
      on(root, 'click', '[data-date]', (b) => { state.date = b.dataset.date; root.querySelectorAll('[data-date]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); redraw(); });
      on(root, 'change', 'input[name="option"]', (r) => { state.option = r.value; redraw(); });
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        submit(f, { type: 'kids', date: state.date, details: { child: v.child, age: v.age, option: v.option } });
      });
    },
  };
});

// ------------------------------------------------------------------ table reservation
route('/book/table', async () => {
  const s = await refreshSite();
  const t = s.amenities.table;
  const times = [];
  for (let m = minutesOf(t.from); m <= minutesOf(t.to); m += 30) times.push(timeOf(m));
  let first = s.today;
  while (new Date(`${first}T12:00:00Z`).getUTCDay() !== 0) first = addDays(first, 1);
  return {
    title: 'Reserve a table',
    body: shell('table', html`<form class="form panel" data-book novalidate>
      <div class="two"><label class="field"><span>Date</span><input type="date" name="date" required min="${s.today}" max="${addDays(s.today, t.daysAhead)}" value="${first}"><small class="hint">Sundays are Family Dinner Day.</small></label>
      <label class="field"><span>Arrival time</span><select name="time">${times.map((x) => html`<option value="${x}" ${x === '13:00' ? 'selected' : ''}>${fmtTime(x)}</option>`)}</select></label></div>
      <div class="two">${stepperHtml('party', 4, t.minParty, t.maxParty, 'People')}<label class="field"><span>Occasion <em>(optional)</em></span><select name="occasion"><option value="">None</option>${['Family dinner', 'Birthday', 'Team or work night', 'Date night', 'Watching a match', 'Other'].map((o) => html`<option>${o}</option>`)}</select></label></div>
      ${contactFields(app.buyer)}
      ${footer('Request the table')}
    </form>`, html`<div class="panel stack" style="--gap:10px"><h2 class="h4">How it works</h2><p class="muted small">Reservations are free. We confirm by SMS. Food and drinks are ordered on the day.</p><p class="muted small">Fridays are Bucket Night: ${s.amenities.bucketNight.offer}.</p></div>`),
    mount(root) {
      bindSteppers(root);
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        submit(f, { type: 'table', date: v.date, time: v.time, details: { party: v.party, occasion: v.occasion } });
      });
    },
  };
});

// ------------------------------------------------------------------ quiz night
route('/quiz', async () => {
  const s = await refreshSite();
  const q = s.amenities.quiz;
  const days = s.quizDays;
  const open = days.find((d) => !d.full);
  const state = { date: (open || days[0]).date };
  return {
    title: 'Quiz Night',
    body: html`<section class="replay-hero"><div class="wrap stack" style="--gap:14px">
        <p class="eyebrow red">Every Saturday · ${fmtTime(q.time)}</p><h1 class="display">Quiz Night</h1>
        <p class="lead">${q.rounds} rounds hosted by ${q.host}. ${q.entry ? fmtUGX(q.entry) + ' entry' : 'Free entry'}. Round winners take ${q.roundPrize.toLowerCase()}. Teams of ${q.minSize} to ${q.maxSize}.</p>
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap split with-aside">
        <form class="form panel" data-book novalidate>
          <h2 class="h3">Register your team</h2>
          <div class="field"><span>Which Saturday?</span>${chipsHtml(days.map((d) => d.date), state.date, s.today, (d) => { const x = days.find((y) => y.date === d); return x.full ? 'full' : `${x.max - x.teams} places`; }, (d) => days.find((y) => y.date === d).full)}</div>
          <div class="two"><label class="field"><span>Team name</span><input name="team" required maxlength="40" placeholder="Make it memorable"></label>${stepperHtml('size', Math.min(4, q.maxSize), q.minSize, q.maxSize, 'Players')}</div>
          ${contactFields(app.buyer, { nameLabel: 'Team captain' })}
          ${footer('Register the team')}
        </form>
        <aside class="stack" style="--gap:12px;align-self:start"><div class="facts">${days.slice(0, 4).map((d) => html`<div><b>${fmtDate(d.date, { noDow: true })}</b><span>${d.full ? 'Full' : `${d.teams} of ${d.max} teams in`}</span></div>`)}</div>
          <p class="hint">Arrive by ${fmtTime(timeOf(minutesOf(q.time) - 30))} to settle in. Team names must be unique each night.</p></aside>
      </div></section>`,
    mount(root) {
      bindSteppers(root);
      on(root, 'click', '[data-date]', (b) => { state.date = b.dataset.date; root.querySelectorAll('[data-date]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); });
      on(root, 'submit', '[data-book]', (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        submit(f, { type: 'quiz', date: state.date, details: { team: v.team, size: v.size } });
      });
    },
  };
});

// ------------------------------------------------------------------ booking page
route('/b/:token', async ({ token }) => {
  const [s, b] = await Promise.all([refreshSite(), rpc('booking.get', { token })]);
  const live = ['requested', 'confirmed', 'checked_in'].includes(b.status);
  const tone = b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed' ? 'ok' : b.status === 'cancelled' || b.status === 'no_show' ? 'bad' : '';
  const title = { requested: 'Request received', confirmed: 'You’re booked', checked_in: 'Checked in', completed: 'Thanks for coming', cancelled: 'Booking cancelled', no_show: 'Marked as a no-show' }[b.status] || b.statusLabel;
  const d = b.details;
  const when_ = b.type === 'penthouse' ? `${fmtDate(b.date, { long: true, longMonth: true })} to ${fmtDate(b.endDate, { long: true, longMonth: true })}`
    : b.type === 'turf' ? `${fmtDate(b.date, { long: true, longMonth: true })}, ${fmtTime(b.slots[0])} – ${fmtTime(timeOf(minutesOf(b.slots[b.slots.length - 1]) + 60))}`
      : b.type === 'gym' ? `Starting ${fmtDate(b.date, { long: true, longMonth: true })}` : `${fmtDate(b.date, { long: true, longMonth: true })}${b.time ? `, ${fmtTime(b.time)}` : ''}`;
  const rows = [['Booking', b.typeName], ['When', when_]];
  if (b.type === 'turf' && d.team) rows.push(['Team', d.team]);
  if (b.type === 'sauna') rows.push(['People', `${d.adults} adult${d.adults === 1 ? '' : 's'}${d.kids ? `, ${d.kids} kid${d.kids === 1 ? '' : 's'}` : ''}`]);
  if (b.type === 'gym') rows.push(['Pass', d.planName], ['Session', d.sessionName]);
  if (b.type === 'penthouse') rows.push(['Package', d.packageName], ['Guests', d.guests], ['Nights', d.nights]);
  if (b.type === 'kids') rows.push(['Child', `${d.child}, ${d.age}`], ['Session', d.optionName]);
  if (b.type === 'quiz') rows.push(['Team', d.team], ['Players', d.size]);
  if (b.type === 'table') rows.push(['People', d.party], d.occasion ? ['Occasion', d.occasion] : null);
  rows.push(['Price', b.price ? money(b.price, b.currency) : 'Free'], b.price ? ['Payment', { unpaid: 'Pay at Social Spot', awaiting_verification: 'Being confirmed', paid: 'Paid', rejected: 'Not confirmed. Pay at reception.' }[b.payment.status] || b.payment.status] : null, ['Name', b.contact.name]);
  const canPay = live && b.price > 0 && b.currency === 'UGX' && ['unpaid', 'rejected'].includes(b.payment.status);
  const sub = b.status === 'requested' ? 'We’ll confirm by SMS. Keep this page.' : live ? 'Show this code at reception.' : '';
  return {
    title: `Booking ${b.code}`,
    body: html`<section class="section"><div class="wrap stack" style="--gap:26px">
      ${statusHead(tone, title, sub)}
      <div class="split with-aside">
        <div class="stack" style="--gap:20px">
          <div class="panel stack" style="--gap:10px"><p class="eyebrow">Your code</p><div class="row between"><span class="big-code">${b.code}</span><button class="btn line sm" data-copy="${b.code}">${icon('copy')}Copy</button></div></div>
          ${when(canPay, () => payPanel({ amount: b.price, reference: b.code, title: 'Pay now', optional: true, submitLabel: 'Send for confirmation', note: 'Optional. You can also pay at reception.' }))}
          ${when(b.canCancel, html`<div><button class="btn line" data-act="cancel">Cancel this booking</button></div>`)}
        </div>
        <aside class="panel stack" style="--gap:12px;align-self:start"><div class="row between"><h2 class="h4">${b.typeName}</h2><span class="pill ${tone || 'warn'}">${b.statusLabel}</span></div>${kv(rows)}<hr class="hr"><p class="hint">Find it again with <a href="/tickets">Find my ticket</a> and ${b.code}. Help: <a href="tel:${s.venue.phone.replace(/\s/g, '')}">${s.venue.phone}</a></p></aside>
      </div></div></section>`,
    mount(root) {
      on(root, 'click', '[data-copy]', (x) => copyText(x.dataset.copy, x));
      on(root, 'submit', '[data-pay]', async (f, e) => {
        e.preventDefault();
        const r = await act(f.querySelector('button[type="submit"]'), () => rpc('booking.submitPayment', { token, ...formValues(f) }), { errorEl: f.querySelector('[data-err]') });
        if (r) { toast('Sent. We’ll confirm it.', 'ok'); render(app.path, { keepScroll: true }); }
      });
      on(root, 'click', '[data-act="cancel"]', async (x) => {
        if (!(await confirmDialog('Cancel this booking?', 'This frees the slot for someone else.', 'Yes, cancel it', '', 'Keep my booking'))) return;
        const r = await act(x, () => rpc('booking.cancel', { token }));
        if (r) { toast('Booking cancelled'); render(app.path); }
      });
    },
  };
});
