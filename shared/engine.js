// Social Spot engine: The Replay ticketing, door control and venue bookings.
// Pure business logic over a small document store, so the exact same rules run
// on the production server (SQLite) and in the live preview (artifact database).
//
// Store contract (reads are synchronous from an in-memory mirror, writes are durable):
//   store.all(col) -> doc[]     store.get(col, id) -> doc|null
//   store.put(col, doc) -> Promise   store.del(col, id) -> Promise
// Collections: settings, orders, bookings, scans, waitlist, ambassadors, outbox.

import { DEFAULTS, BOOKING_TYPES, weekProgramme } from './catalog.js';
import {
  UserError, createMutex, deepMerge, newId, newToken, newPassCode, newOrderRef, newBookingCode, normalizeCode,
  eatDate, eatTime, eatToMs, eatStampToMs, addDays, dowOf, daysBetween, isDate, isTime, minutesOf, timeOf,
  fmtDate, fmtTime, fmtMoney, fmtUGX, normPhone, displayPhone, cleanText, isEmail, toCsv,
} from './util.js';

const ROLE_RANK = { public: 0, door: 1, admin: 2 };
const LIVE = new Set(['pending_payment', 'awaiting_verification', 'paid', 'deposit_paid']);
const BOOKING_LIVE = new Set(['requested', 'confirmed', 'checked_in']);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const STATUS_LABEL = {
  pending_payment: 'Awaiting payment',
  awaiting_verification: 'Payment being confirmed',
  paid: 'Paid',
  deposit_paid: 'Deposit paid',
  rejected: 'Payment not confirmed',
  expired: 'Hold expired',
  cancelled: 'Cancelled',
  requested: 'Requested',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  no_show: 'No-show',
};

export function createEngine({ store, clock = () => Date.now(), host = {} } = {}) {
  const lock = createMutex();
  const mode = host.mode || 'server';

  // ------------------------------------------------------------ settings
  function settings() {
    const o = store.get('settings', 'main');
    const s = deepMerge(DEFAULTS, (o && o.data) || {});
    if (host.publicUrl) s.venue.publicUrl = host.publicUrl.replace(/\/+$/, '');
    return s;
  }
  const link = (kind, token) => {
    const base = settings().venue.publicUrl;
    if (!base || !token) return '';
    return `${base}/${kind}/${token}`;
  };

  // ------------------------------------------------------------ orders & inventory
  const orders = () => store.all('orders');
  function effStatus(o, now) {
    if (o.status === 'pending_payment' && o.holdUntil && o.holdUntil < now) return 'expired';
    return o.status;
  }
  const isLive = (o, now) => LIVE.has(effStatus(o, now));
  const eventEndMs = (s) => eatToMs(addDays(s.event.date, 1), '06:00');

  function inventory(s, now, excludeOrderId = null) {
    const ev = s.event;
    const live = orders().filter((o) => o.id !== excludeOrderId && isLive(o, now));
    const soldBy = {};
    const takenTables = {};
    let committed = 0, comps = 0, paidGuests = 0;
    for (const o of live) {
      committed += o.passes.length;
      if (o.kind === 'ga') soldBy[o.release] = (soldBy[o.release] || 0) + o.passes.length;
      if (o.kind === 'table') takenTables[o.table.id] = o.id;
      if (o.kind === 'comp') comps += 1;
      if (o.kind !== 'comp' && effStatus(o, now) === 'paid') paidGuests += o.passes.length;
    }
    const rel = ev.releases;
    const opensAt = rel.map((r) => eatStampToMs(r.opens));
    let cur = -1;
    rel.forEach((r, i) => { if (now >= opensAt[i]) cur = i; });
    if (ev.forceRelease) {
      const k = rel.findIndex((r) => r.key === ev.forceRelease);
      if (k > cur) cur = k;
    }
    const poolCap = (i) => rel.slice(0, i + 1).reduce((a, r) => a + r.qty, 0);
    const poolSold = (i) => rel.slice(0, i + 1).reduce((a, r) => a + (soldBy[r.key] || 0), 0);
    while (cur >= 0 && cur < rel.length - 1 && poolCap(cur) - poolSold(cur) <= 0 && !rel[cur + 1].doorOnly) cur++;

    const room = Math.max(0, ev.maxScans - committed);
    const over = now >= eventEndMs(s);
    const paused = ev.salesMode === 'paused';
    let gaAvailable = 0;
    const releases = rel.map((r, i) => {
      const sold = soldBy[r.key] || 0;
      let state;
      if (over) state = 'closed';
      else if (cur < 0 || i > cur) state = 'upcoming';
      else if (i < cur) state = sold >= r.qty ? 'soldout' : 'ended';
      else {
        const left = poolCap(cur) - poolSold(cur);
        if (left <= 0) state = 'soldout';
        else if (paused) state = 'paused';
        else { state = 'onsale'; gaAvailable = Math.min(left, room); if (gaAvailable <= 0) state = 'soldout'; }
      }
      return { key: r.key, name: r.name, qty: r.qty, price: r.price, opens: r.opens, doorOnly: !!r.doorOnly, sold, state };
    });
    const current = releases.find((r) => r.state === 'onsale') || null;
    const salesStarted = cur >= 0;
    const tablesOnSale = salesStarted && !paused && !over && now < eatToMs(ev.date, ev.gatesOpen);
    const tables = ev.tables.map((t) => {
      const ids = Array.from({ length: t.count }, (_, i) => `${t.prefix}${i + 1}`);
      const free = ids.filter((id) => !takenTables[id]);
      return { key: t.key, name: t.name, guests: t.guests, price: t.price, perks: t.perks, ids, free, sold: ids.length - free.length };
    });
    return { releases, current, gaAvailable, tables, tablesOnSale, committed, comps, paidGuests, room, over, paused, salesStarted, takenTables };
  }

  function passIndex() {
    const cur = new Map();
    const prev = new Map();
    for (const o of orders()) {
      o.passes.forEach((p) => {
        cur.set(p.code, { o, p });
        for (const c of p.prevCodes || []) prev.set(c, { o, p });
      });
    }
    return { cur, prev };
  }
  function freshPassCode(idx) {
    for (;;) {
      const c = newPassCode();
      if (!idx.cur.has(c) && !idx.prev.has(c)) return c;
    }
  }
  function newPass(access, holder, idx) {
    return { id: newId('P'), code: freshPassCode(idx), token: newToken(), access, holder: { name: holder.name, phone: holder.phone || '' }, checkedInAt: null, lane: '', voidedAt: null, prevCodes: [] };
  }

  function accessLabel(a, s) {
    if (a === 'ga') return 'General admission';
    const t = s.event.tables.find((x) => x.key === a);
    if (t) return t.name;
    if (a === 'comp-ga') return 'Guest · general';
    if (a === 'comp-vip') return 'Guest · tables & VIP';
    if (a === 'accredited') return 'Accredited · media/partner';
    return a;
  }
  function laneFor(a) {
    if (a === 'ga' || a === 'comp-ga') return 'GA lanes';
    if (a === 'accredited') return 'Accreditation lane';
    return 'Tables & VIP lane';
  }
  function passState(o, p, now) {
    const st = effStatus(o, now);
    if (p.voidedAt || st === 'cancelled' || st === 'rejected') return 'void';
    if (st === 'deposit_paid') return 'balance_due';
    if (st !== 'paid') return 'pending';
    if (p.checkedInAt) return 'used';
    return 'valid';
  }
  const endOfDay = (date) => eatToMs(date, '23:59') + 59 * 1000;

  function publicOrder(o, now, s = settings()) {
    const st = effStatus(o, now);
    const ev = s.event;
    const isTable = o.kind === 'table';
    const changeDeadline = isTable ? ev.guestNamesDue : ev.transferDeadline;
    const changesOpen = (st === 'paid' || st === 'deposit_paid') && now <= endOfDay(changeDeadline) && o.kind !== 'comp';
    return {
      ref: o.ref, token: o.token, kind: o.kind, status: st, statusLabel: STATUS_LABEL[st] || st,
      createdAt: o.createdAt, holdUntil: st === 'pending_payment' ? o.holdUntil : null,
      buyer: { name: o.buyer.name, phone: displayPhone(o.buyer.phone) },
      releaseName: o.releaseName || '', table: o.table || null,
      qty: o.passes.length, unitPrice: o.unitPrice, total: o.total, amountDue: o.amountDue, amountPaid: o.amountPaid,
      balance: Math.max(0, o.total - o.amountPaid), payPlan: o.payPlan,
      nextPayment: st === 'deposit_paid' ? Math.max(0, o.total - o.amountPaid) : (st === 'pending_payment' || st === 'expired' || st === 'awaiting_verification') ? Math.max(0, o.amountDue - o.amountPaid) : 0,
      payments: o.payments.map((p) => ({ method: p.method, txnId: p.txnId, amount: p.amount, status: p.status, submittedAt: p.submittedAt })),
      passes: o.passes.map((p) => {
        const state = passState(o, p, now);
        return {
          id: p.id, token: p.token, holder: { name: p.holder.name, phone: displayPhone(p.holder.phone) },
          access: p.access, accessLabel: accessLabel(p.access, s), lane: laneFor(p.access), table: o.table ? o.table.id : '',
          state, code: state === 'valid' || state === 'used' ? p.code : null, checkedInAt: p.checkedInAt,
        };
      }),
      changesOpen, changeDeadline, transferDeadline: ev.transferDeadline, guestNamesDue: ev.guestNamesDue, balanceDue: ev.balanceDue,
      event: { name: ev.name, edition: ev.edition, date: ev.date, gatesOpen: ev.gatesOpen, tableHeldUntil: ev.tableHeldUntil },
      flag: o.flag || '',
    };
  }

  function orderByToken(token) {
    const o = orders().find((x) => x.token === token);
    if (!o) throw new UserError('We couldn’t find that order. Check the link or use Find my ticket.', 'not_found');
    return o;
  }
  function orderById(id) {
    const o = store.get('orders', id);
    if (!o) throw new UserError('Order not found.', 'not_found');
    return o;
  }
  function validBuyer(b = {}) {
    const name = cleanText(b.name, 60);
    if (name.length < 2) throw new UserError('Please enter your full name.');
    const phone = normPhone(b.phone);
    if (!phone) throw new UserError('Please enter a valid phone number, e.g. 0772 123 456.');
    const email = cleanText(b.email, 120);
    if (email && !isEmail(email)) throw new UserError('That email address doesn’t look right.');
    return { name, phone, email };
  }
  function findAmbassador(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return null;
    return store.all('ambassadors').find((a) => a.code === c && a.active !== false) || null;
  }
  function txnInUse(txnId, exceptId) {
    const t = txnId.toUpperCase();
    const inOrders = orders().some((o) => o.id !== exceptId && o.payments.some((p) => p.txnId.toUpperCase() === t && p.status !== 'rejected' && p.status !== 'replaced'));
    const inBookings = store.all('bookings').some((b) => b.id !== exceptId && b.payment && b.payment.txnId && b.payment.txnId.toUpperCase() === t && b.payment.status !== 'rejected');
    return inOrders || inBookings;
  }
  function cleanTxn(raw) {
    const t = String(raw || '').toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9.\-]{5,40}$/.test(t)) throw new UserError('Enter the transaction ID from your payment SMS (letters and numbers).');
    return t;
  }
  const hist = (o, ctx, action, detail = '') => {
    o.history = o.history || [];
    o.history.push({ at: clock(), by: ctx && ctx.staffName ? ctx.staffName : ctx && ctx.role !== 'public' ? ctx.role : 'customer', action, detail });
  };

  // ------------------------------------------------------------ messages (outbox)
  async function enqueue(to, body, kind, ref = '') {
    if (!to) return;
    const s = settings();
    const msg = { id: newId('M'), to, body: body.slice(0, 600), kind, ref, createdAt: clock(), status: 'queued', channel: 'sms', attempts: 0, error: '' };
    if (host.dispatch === false || mode === 'preview') msg.status = 'manual';
    await store.put('outbox', msg);
    if (host.onMessage) host.onMessage(msg, s);
  }
  function orderMessage(o, kind, s = settings()) {
    const ev = s.event;
    const l = link('t', o.token);
    const when = `${fmtDate(ev.date)} · gates ${fmtTime(ev.gatesOpen)} · ${s.venue.name}, ${s.venue.area}`;
    const what = o.kind === 'table' ? `${o.table.tierName} table ${o.table.id}` : `${o.passes.length} ticket${o.passes.length > 1 ? 's' : ''}`;
    switch (kind) {
      case 'received':
        return `${ev.name}: we received your payment details for order ${o.ref} (${what}). We’ll confirm shortly.${l ? ' Track it: ' + l : ''}`;
      case 'paid':
        return `Payment received. Your ${ev.name} ${o.passes.length > 1 ? 'tickets are' : 'ticket is'} ready (${o.ref}). ${when}.${l ? ' Open: ' + l : ' Show your QR at the gate.'}`;
      case 'deposit':
        return `Deposit received for ${what} (${o.ref}). Your table is held. Balance ${fmtUGX(o.total - o.amountPaid)} due ${fmtDate(ev.balanceDue)}.${l ? ' ' + l : ''}`;
      case 'rejected':
        return `${ev.name}: we couldn’t confirm the payment for order ${o.ref}. Please check the transaction ID and resubmit${l ? ': ' + l : '.'} Help: ${s.venue.phone}`;
      default:
        return '';
    }
  }

  // ------------------------------------------------------------ public: site
  function upcomingDays(dow, count, cutoffTime, now) {
    const today = eatDate(now);
    const out = [];
    let d = today;
    while (dowOf(d) !== dow) d = addDays(d, 1);
    if (d === today && cutoffTime && now >= eatToMs(d, cutoffTime)) d = addDays(d, 7);
    for (let i = 0; i < count; i++) out.push(addDays(d, i * 7));
    return out;
  }
  const bookings = () => store.all('bookings');
  const liveBookings = (type, date) => bookings().filter((b) => b.type === type && BOOKING_LIVE.has(b.status) && (date ? b.date === date : true));

  function siteGet(_p, ctx, now) {
    const s = settings();
    const inv = inventory(s, now);
    const ev = s.event;
    const a = s.amenities;
    const quizDays = upcomingDays(a.quiz.day, a.quiz.weeksAhead, a.quiz.time, now).map((d) => {
      const teams = liveBookings('quiz', d).length;
      return { date: d, teams, max: a.quiz.maxTeams, full: teams >= a.quiz.maxTeams };
    });
    const kidsDays = upcomingDays(a.kids.day, a.kids.weeksAhead, '12:00', now).map((d) => {
      const kids = liveBookings('kids', d).length;
      return { date: d, kids, max: a.kids.capacity, full: kids >= a.kids.capacity };
    });
    const pay = s.payments;
    const tablesLeft = inv.tables.reduce((x, t) => x + t.free.length, 0);
    return {
      now,
      mode,
      today: eatDate(now),
      venue: s.venue,
      event: {
        name: ev.name, edition: ev.edition, date: ev.date, gatesOpen: ev.gatesOpen, pitch: ev.pitch,
        programme: ev.programme, promise: ev.promise, dress: ev.dress, terms: ev.terms, tableTerms: ev.tableTerms,
        maxPerOrder: ev.maxPerOrder, holdMinutes: ev.holdMinutes, depositPct: ev.depositPct, balanceDue: ev.balanceDue,
        guestNamesDue: ev.guestNamesDue, transferDeadline: ev.transferDeadline, tableHeldUntil: ev.tableHeldUntil,
        depositOpen: now <= endOfDay(ev.balanceDue),
        startsAt: eatToMs(ev.date, ev.gatesOpen), over: inv.over, paused: inv.paused,
      },
      releases: inv.releases.map((r) => ({ ...r, left: r.state === 'onsale' ? inv.gaAvailable : null, sold: undefined })),
      current: inv.current ? inv.current.key : null,
      gaAvailable: inv.gaAvailable,
      tables: inv.tables.map((t) => ({ key: t.key, name: t.name, guests: t.guests, price: t.price, perks: t.perks, ids: t.ids, free: t.free })),
      tablesOnSale: inv.tablesOnSale,
      waitlistOpen: !inv.over && inv.salesStarted && (!inv.current || tablesLeft === 0),
      payments: {
        mtnMerchantCode: pay.mtnMerchantCode, mtnMerchantName: pay.mtnMerchantName,
        airtelMerchantCode: pay.airtelMerchantCode, airtelMerchantName: pay.airtelMerchantName, note: pay.note,
        ready: !!(pay.mtnMerchantCode || pay.airtelMerchantCode),
      },
      amenities: a,
      week: weekProgramme(s),
      quizDays,
      kidsDays,
      bookingTypes: BOOKING_TYPES,
      role: ctx.role,
    };
  }

  // ------------------------------------------------------------ public: orders
  async function orderCreate(p, ctx, now) {
    const s = settings();
    const ev = s.event;
    if (ev.salesMode === 'paused') throw new UserError('Ticket sales are paused right now. Please check back soon.', 'paused');
    if (host.requireMerchant && !(s.payments.mtnMerchantCode || s.payments.airtelMerchantCode)) {
      throw new UserError(`Online payment is being set up. Call ${s.venue.phone} to buy tickets.`, 'payments_not_ready');
    }
    const buyer = validBuyer(p.buyer);
    const openHolds = orders().filter((o) => o.buyer.phone === buyer.phone && effStatus(o, now) === 'pending_payment');
    if (openHolds.length >= 2) throw new UserError(`You already have orders waiting for payment. Pay for one, or wait up to ${ev.holdMinutes} minutes for the hold to end.`, 'too_many_holds');
    const consents = p.consents || {};
    if (!consents.terms || !consents.adult) throw new UserError('Please confirm you are 18 or older and accept the ticket terms.');
    let referral = '';
    if (p.referral) {
      const amb = findAmbassador(p.referral);
      if (!amb) throw new UserError('That referral code wasn’t found. Check it, or leave it blank.');
      referral = amb.code;
    }
    const inv = inventory(s, now);
    const idx = passIndex();
    const base = {
      id: newId('O'), ref: newOrderRef(), token: newToken(), createdAt: now, updatedAt: now,
      status: 'pending_payment', holdUntil: now + ev.holdMinutes * MIN,
      buyer, source: cleanText(p.source, 40), referral, song: cleanText(p.song, 100),
      consents: { terms: true, adult: true, marketing: !!consents.marketing, partners: !!consents.partners, at: now },
      channel: 'online', payments: [], amountPaid: 0, history: [],
    };
    let order;
    if (p.kind === 'ga') {
      const qty = Math.floor(Number(p.qty));
      if (!(qty >= 1 && qty <= ev.maxPerOrder)) throw new UserError(`Choose between 1 and ${ev.maxPerOrder} tickets.`);
      if (!inv.current) throw new UserError(inv.paused ? 'Ticket sales are paused right now.' : 'General admission isn’t on sale right now.', 'not_on_sale');
      if (p.release && p.release !== inv.current.key) throw new UserError(`The ${inv.current.name} release is now on sale at ${fmtUGX(inv.current.price)}. Please review your order.`, 'price_changed');
      if (qty > inv.gaAvailable) throw new UserError(`Only ${inv.gaAvailable} left at this price.`, 'sold_out');
      const r = inv.current;
      order = {
        ...base, kind: 'ga', release: r.key, releaseName: r.name, unitPrice: r.price, total: qty * r.price, amountDue: qty * r.price, payPlan: 'full',
        passes: Array.from({ length: qty }, (_, i) => newPass('ga', i === 0 ? buyer : { name: `Guest ${i + 1}` }, idx)),
      };
    } else if (p.kind === 'table') {
      const tier = inv.tables.find((t) => t.key === p.tier);
      if (!tier) throw new UserError('Choose a table type.');
      if (!inv.tablesOnSale) throw new UserError('Tables aren’t on sale right now.', 'not_on_sale');
      let tableId = p.tableId && tier.free.includes(p.tableId) ? p.tableId : null;
      if (p.tableId && !tableId) throw new UserError(`Table ${p.tableId} was just taken. Please pick another.`, 'sold_out');
      if (!tableId) tableId = tier.free[0];
      if (!tableId) throw new UserError(`All ${tier.name} tables are taken.`, 'sold_out');
      if (inv.room < tier.guests) throw new UserError('The event is at capacity.', 'sold_out');
      const depositAllowed = now <= endOfDay(ev.balanceDue);
      const plan = p.payPlan === 'deposit' && depositAllowed ? 'deposit' : 'full';
      const deposit = Math.round((tier.price * ev.depositPct) / 100);
      const tcfg = ev.tables.find((t) => t.key === tier.key);
      order = {
        ...base, kind: 'table', table: { tier: tier.key, tierName: tier.name, id: tableId, guests: tier.guests },
        unitPrice: tcfg.price, total: tcfg.price, amountDue: plan === 'deposit' ? deposit : tcfg.price, payPlan: plan,
        passes: Array.from({ length: tier.guests }, (_, i) => newPass(tier.key, i === 0 ? buyer : { name: `Guest ${i + 1}` }, idx)),
      };
    } else {
      throw new UserError('Choose tickets or a table.');
    }
    hist(order, ctx, 'created', order.kind === 'table' ? `${order.table.tierName} ${order.table.id}` : `${order.passes.length} × ${order.releaseName}`);
    await store.put('orders', order);
    return publicOrder(order, now, s);
  }

  async function orderSubmitPayment(p, ctx, now) {
    const o = structuredClone(orderByToken(p.token));
    const s = settings();
    const st = effStatus(o, now);
    if (st === 'cancelled' || st === 'rejected') throw new UserError('This order was cancelled. Please start a new order or call us.');
    if (st === 'paid') throw new UserError('This order is already paid.');
    const method = p.method === 'airtel' ? 'airtel' : p.method === 'mtn' ? 'mtn' : null;
    if (!method) throw new UserError('Choose MTN MoMo or Airtel Money.');
    const txnId = cleanTxn(p.txnId);
    if (txnInUse(txnId, o.id)) throw new UserError('That transaction ID is already attached to another order. Check the ID or call us.', 'duplicate_txn');
    if (st === 'expired') {
      const inv = inventory(s, now, o.id);
      const ok = o.kind === 'ga' ? inv.current && inv.gaAvailable >= o.passes.length && inv.current.key === o.release
        : o.kind === 'table' ? !inv.takenTables[o.table.id] && inv.room >= o.passes.length : true;
      if (!ok) o.flag = 'over_capacity';
    }
    for (const x of o.payments) if (x.status === 'submitted') x.status = 'replaced';
    const amount = st === 'deposit_paid' ? o.total - o.amountPaid : Math.max(0, o.amountDue - o.amountPaid);
    o.payments.push({ id: newId('Y'), method, txnId, payerPhone: normPhone(p.payerPhone) || o.buyer.phone, amount, status: 'submitted', submittedAt: now });
    if (st !== 'deposit_paid') { o.status = 'awaiting_verification'; o.holdUntil = null; }
    o.updatedAt = now;
    hist(o, ctx, 'payment submitted', `${method.toUpperCase()} ${txnId} · ${fmtUGX(amount)}`);
    await store.put('orders', o);
    await enqueue(o.buyer.phone, orderMessage(o, 'received', s), 'order_received', o.ref);
    return publicOrder(o, now, s);
  }

  function orderGet(p, _ctx, now) {
    return publicOrder(orderByToken(p.token), now);
  }

  function orderLookup(p, _ctx, now) {
    const phone = normPhone(p.phone);
    const code = normalizeCode(p.code);
    const fail = () => { throw new UserError('No ticket matches that phone number and code. Check both and try again.', 'not_found'); };
    if (!phone || !code) fail();
    for (const o of orders()) {
      if (o.kind === 'comp' && !o.buyer.phone) continue;
      if (o.buyer.phone === phone && (o.ref === code || o.passes.some((x) => x.code === code))) return { kind: 'order', token: o.token };
      const pass = o.passes.find((x) => x.code === code && x.holder.phone === phone);
      if (pass) return { kind: 'pass', token: pass.token };
    }
    for (const b of bookings()) {
      if (b.contact.phone === phone && b.code === code) return { kind: 'booking', token: b.token };
    }
    return fail();
  }

  function passGet(p, _ctx, now) {
    const s = settings();
    for (const o of orders()) {
      const pass = o.passes.find((x) => x.token === p.token);
      if (!pass) continue;
      const view = publicOrder(o, now, s);
      const pv = view.passes.find((x) => x.id === pass.id);
      return { pass: pv, order: { ref: o.ref, kind: o.kind, table: o.table || null, status: view.status, statusLabel: view.statusLabel, buyerName: o.buyer.name }, event: view.event };
    }
    throw new UserError('This pass link is no longer valid. Ask the person who sent it for the current link.', 'not_found');
  }

  function applyHolderChanges(o, changes, ctx, now, s, asAdmin) {
    const st = effStatus(o, now);
    if (!(st === 'paid' || st === 'deposit_paid')) throw new UserError('Guest names can be set once payment is confirmed.');
    if (o.kind === 'comp' && !asAdmin) throw new UserError('Guest passes can’t be transferred.');
    if (!asAdmin) {
      const deadline = o.kind === 'table' ? s.event.guestNamesDue : s.event.transferDeadline;
      if (now > endOfDay(deadline)) throw new UserError(`Changes closed on ${fmtDate(deadline)}. Call ${s.venue.phone} for help.`);
    }
    const idx = passIndex();
    let changed = 0;
    for (const c of changes || []) {
      const pass = o.passes.find((x) => x.id === c.passId);
      if (!pass) throw new UserError('Pass not found.');
      if (pass.checkedInAt) throw new UserError(`${pass.holder.name} has already been scanned in.`);
      const name = cleanText(c.name, 60);
      if (name.length < 2) throw new UserError('Each guest needs a name.');
      const phone = c.phone ? normPhone(c.phone) : '';
      if (c.phone && !phone) throw new UserError(`Check the phone number for ${name}.`);
      if (name === pass.holder.name && (phone || '') === (pass.holder.phone || '')) continue;
      pass.prevCodes = [...(pass.prevCodes || []), pass.code];
      pass.code = freshPassCode(idx);
      pass.token = newToken();
      const before = pass.holder.name;
      pass.holder = { name, phone: phone || '' };
      hist(o, ctx, 'pass reassigned', `${before} → ${name}`);
      changed++;
    }
    return changed;
  }
  async function orderUpdateHolders(p, ctx, now) {
    const o = structuredClone(orderByToken(p.token));
    const s = settings();
    const n = applyHolderChanges(o, p.changes, ctx, now, s, false);
    if (n) { o.updatedAt = now; await store.put('orders', o); }
    return publicOrder(o, now, s);
  }

  async function waitlistJoin(p, ctx, now) {
    const name = cleanText(p.name, 60);
    const phone = normPhone(p.phone);
    if (name.length < 2 || !phone) throw new UserError('Add your name and a valid phone number.');
    const qty = Math.min(20, Math.max(1, Math.floor(Number(p.qty) || 1)));
    const wants = p.wants === 'table' ? 'table' : 'ga';
    const reason = p.reason === 'prelaunch' ? 'prelaunch' : 'soldout';
    const existing = store.all('waitlist').find((w) => w.phone === phone && w.status === 'waiting');
    const w = existing ? { ...existing, qty, wants, name, reason } : { id: newId('W'), name, phone, qty, wants, reason, createdAt: now, status: 'waiting', marketing: !!p.marketing };
    await store.put('waitlist', w);
    const ahead = store.all('waitlist').filter((x) => x.status === 'waiting' && x.createdAt < w.createdAt).length;
    return { ok: true, position: ahead + 1 };
  }

  // ------------------------------------------------------------ door
  function insideCount() {
    let n = 0;
    for (const o of orders()) for (const p of o.passes) if (p.checkedInAt) n++;
    return n;
  }
  function doorPassView(o, p, now, s) {
    return {
      passId: p.id, orderId: o.id, ref: o.ref, kind: o.kind, holder: p.holder.name, phone: displayPhone(p.holder.phone || (o.passes[0] === p ? o.buyer.phone : '')),
      buyer: o.buyer.name, access: p.access, accessLabel: accessLabel(p.access, s), lane: laneFor(p.access), table: o.table ? o.table.id : '',
      state: passState(o, p, now), status: effStatus(o, now), balance: Math.max(0, o.total - o.amountPaid), code: p.code,
      checkedInAt: p.checkedInAt, checkedLane: p.lane, comp: o.comp ? o.comp.groupName : '',
    };
  }
  function admitPass(o, p, lane, ctx, now) {
    p.checkedInAt = now;
    p.lane = lane;
    p.checkedInBy = ctx.staffName || ctx.role;
    o.updatedAt = now;
  }
  async function doorScan(p, ctx, now) {
    const s = settings();
    const code = normalizeCode(p.code);
    const lane = cleanText(p.lane, 40) || s.event.lanes[0];
    const idx = passIndex();
    let result, view = null;
    const hit = idx.cur.get(code);
    if (!hit) {
      const old = idx.prev.get(code);
      if (old) { result = 'replaced'; view = doorPassView(old.o, old.p, now, s); }
      else result = 'not_found';
    } else {
      const o = structuredClone(hit.o);
      const pass = o.passes.find((x) => x.id === hit.p.id);
      const st = passState(o, pass, now);
      view = doorPassView(o, pass, now, s);
      if (st === 'void') result = 'void';
      else if (st === 'pending') result = 'unpaid';
      else if (st === 'balance_due') result = 'balance_due';
      else if (st === 'used') result = 'duplicate';
      else if (insideCount() >= s.event.maxScans) result = 'capacity';
      else {
        admitPass(o, pass, lane, ctx, now);
        await store.put('orders', o);
        result = 'admitted';
        view = doorPassView(o, pass, now, s);
      }
    }
    await store.put('scans', { id: newId('S'), at: now, code, lane, by: ctx.staffName || ctx.role, result, ref: view ? view.ref : '', holder: view ? view.holder : '' });
    return { result, code, pass: view, inside: insideCount(), max: s.event.maxScans };
  }
  function doorLookup(p, _ctx, now) {
    const s = settings();
    const q = String(p.q || '').trim();
    if (q.length < 3) throw new UserError('Type at least 3 characters: a name, phone, order ref or code.');
    const code = normalizeCode(q);
    const phone = normPhone(q);
    const ql = q.toLowerCase();
    const out = [];
    for (const o of orders()) {
      for (const pass of o.passes) {
        const m = pass.code === code || o.ref === code || (phone && (o.buyer.phone === phone || pass.holder.phone === phone))
          || pass.holder.name.toLowerCase().includes(ql) || o.buyer.name.toLowerCase().includes(ql);
        if (m) out.push(doorPassView(o, pass, now, s));
        if (out.length >= 30) break;
      }
    }
    return { results: out };
  }
  async function doorAdmit(p, ctx, now) {
    const s = settings();
    const o = structuredClone(orders().find((x) => x.passes.some((y) => y.id === p.passId)) || null);
    if (!o || !o.id) throw new UserError('Pass not found.');
    const pass = o.passes.find((x) => x.id === p.passId);
    const st = passState(o, pass, now);
    if (st !== 'valid') throw new UserError(st === 'used' ? 'Already checked in.' : st === 'balance_due' ? 'Table balance is still due. Record the payment first.' : st === 'pending' ? 'Payment isn’t confirmed yet.' : 'This pass is void.');
    if (insideCount() >= s.event.maxScans) throw new UserError('Capacity reached. Entry is closed.');
    const lane = cleanText(p.lane, 40) || 'Exception desk';
    admitPass(o, pass, lane, ctx, now);
    hist(o, ctx, 'manual admit', `${pass.holder.name} at ${lane}`);
    await store.put('orders', o);
    await store.put('scans', { id: newId('S'), at: now, code: pass.code, lane, by: ctx.staffName || ctx.role, result: 'admitted', ref: o.ref, holder: pass.holder.name, manual: true });
    return { ok: true, pass: doorPassView(o, pass, now, s), inside: insideCount(), max: s.event.maxScans };
  }
  async function doorUndo(p, ctx, now) {
    const o = structuredClone(orders().find((x) => x.passes.some((y) => y.id === p.passId)) || null);
    if (!o || !o.id) throw new UserError('Pass not found.');
    const pass = o.passes.find((x) => x.id === p.passId);
    if (!pass.checkedInAt) throw new UserError('This pass isn’t checked in.');
    pass.checkedInAt = null;
    pass.lane = '';
    hist(o, ctx, 'check-in undone', pass.holder.name);
    o.updatedAt = now;
    await store.put('orders', o);
    return { ok: true, inside: insideCount() };
  }
  function doorStats(_p, _ctx, now) {
    const s = settings();
    const byLane = {};
    for (const o of orders()) for (const p of o.passes) if (p.checkedInAt) byLane[p.lane || '—'] = (byLane[p.lane || '—'] || 0) + 1;
    const scans = store.all('scans').sort((a, b) => b.at - a.at);
    return { inside: insideCount(), max: s.event.maxScans, byLane, recent: scans.slice(0, 25), lanes: s.event.lanes, eventDate: s.event.date, today: eatDate(now) };
  }
  async function doorSell(p, ctx, now) {
    const s = settings();
    const inv = inventory(s, now);
    if (!inv.current) throw new UserError('No general admission release is on sale right now.');
    const qty = Math.floor(Number(p.qty));
    if (!(qty >= 1 && qty <= 20)) throw new UserError('Choose 1 to 20 tickets.');
    if (qty > inv.gaAvailable) throw new UserError(`Only ${inv.gaAvailable} left.`);
    const name = cleanText(p.name, 60) || 'Door guest';
    const phone = p.phone ? normPhone(p.phone) : '';
    if (p.phone && !phone) throw new UserError('Check the phone number.');
    const method = ['cash', 'mtn', 'airtel'].includes(p.method) ? p.method : 'cash';
    const txnId = method === 'cash' ? `CASH-${newId('').slice(0, 6)}` : cleanTxn(p.txnId);
    if (method !== 'cash' && txnInUse(txnId)) throw new UserError('That transaction ID is already used.');
    const idx = passIndex();
    const r = inv.current;
    const total = qty * r.price;
    const o = {
      id: newId('O'), ref: newOrderRef(), token: newToken(), createdAt: now, updatedAt: now, status: 'paid', holdUntil: null,
      buyer: { name, phone: phone || '', email: '' }, source: 'door', referral: '', song: '', consents: { terms: true, adult: true, marketing: false, partners: false, at: now },
      channel: 'door', kind: 'ga', release: r.key, releaseName: r.name, unitPrice: r.price, total, amountDue: total, amountPaid: total, payPlan: 'full',
      payments: [{ id: newId('Y'), method, txnId, payerPhone: phone || '', amount: total, status: 'verified', submittedAt: now, verifiedAt: now, verifiedBy: ctx.staffName || ctx.role }],
      passes: Array.from({ length: qty }, (_, i) => newPass('ga', { name: qty > 1 ? `${name} ${i + 1}` : name, phone: i === 0 ? phone : '' }, idx)),
      history: [],
    };
    hist(o, ctx, 'door sale', `${qty} × ${r.name} · ${method}`);
    if (p.admit) {
      if (insideCount() + qty > s.event.maxScans) throw new UserError('Not enough capacity left to admit them all.');
      const lane = cleanText(p.lane, 40) || 'Exception desk';
      for (const x of o.passes) { x.checkedInAt = now; x.lane = lane; x.checkedInBy = ctx.staffName || ctx.role; }
    }
    await store.put('orders', o);
    return { ok: true, order: publicOrder(o, now, s), adminId: o.id };
  }

  // ------------------------------------------------------------ admin: orders & payments
  function adminOrderRow(o, now, s) {
    const st = effStatus(o, now);
    const pending = o.payments.filter((x) => x.status === 'submitted');
    return {
      id: o.id, ref: o.ref, kind: o.kind, channel: o.channel, status: st, statusLabel: STATUS_LABEL[st], createdAt: o.createdAt, updatedAt: o.updatedAt,
      buyer: o.buyer.name, phone: displayPhone(o.buyer.phone), what: o.kind === 'table' ? `${o.table.tierName} · ${o.table.id}` : o.kind === 'comp' ? `Guest pass · ${o.comp.groupName}` : `${o.passes.length} × ${o.releaseName}`,
      guests: o.passes.length, total: o.total, paid: o.amountPaid, due: Math.max(0, o.total - o.amountPaid),
      pendingPayment: pending.length ? pending[pending.length - 1] : null, flag: o.flag || '', referral: o.referral || '',
      checkedIn: o.passes.filter((p) => p.checkedInAt).length,
    };
  }
  function adminOrders(p, _ctx, now) {
    const s = settings();
    let list = orders().slice().sort((a, b) => b.createdAt - a.createdAt);
    const q = String(p.q || '').trim().toLowerCase();
    const code = normalizeCode(p.q);
    const phone = normPhone(p.q);
    if (p.kind) list = list.filter((o) => o.kind === p.kind);
    if (p.awaiting) list = list.filter((o) => o.payments.some((x) => x.status === 'submitted'));
    if (p.status) list = list.filter((o) => (p.status === 'live' ? isLive(o, now) : effStatus(o, now) === p.status));
    if (q) list = list.filter((o) => o.ref === code || o.passes.some((x) => x.code === code) || (phone && o.buyer.phone === phone) || o.buyer.name.toLowerCase().includes(q) || o.passes.some((x) => x.holder.name.toLowerCase().includes(q)));
    return { total: list.length, rows: list.slice(0, Math.min(500, p.limit || 200)).map((o) => adminOrderRow(o, now, s)) };
  }
  function adminOrder(p, _ctx, now) {
    const s = settings();
    const o = orderById(p.id);
    const view = publicOrder(o, now, s);
    return {
      ...adminOrderRow(o, now, s), view,
      buyerFull: { ...o.buyer, phoneDisplay: displayPhone(o.buyer.phone) }, consents: o.consents, source: o.source, song: o.song, comp: o.comp || null,
      payments: o.payments, history: (o.history || []).slice().reverse(), table: o.table || null, payPlan: o.payPlan,
      passes: o.passes.map((x) => ({ ...doorPassView(o, x, now, s), token: x.token, prevCodes: x.prevCodes || [] })),
      links: { order: link('t', o.token) },
    };
  }
  function recalc(o, s) {
    const deposit = o.kind === 'table' ? Math.round((o.total * s.event.depositPct) / 100) : o.total;
    if (o.amountPaid >= o.total) o.status = 'paid';
    else if (o.kind === 'table' && o.payPlan === 'deposit' && o.amountPaid >= deposit) o.status = 'deposit_paid';
    else if (o.payments.some((x) => x.status === 'submitted')) o.status = 'awaiting_verification';
  }
  async function adminVerify(p, ctx, now) {
    const s = settings();
    const o = structuredClone(orderById(p.id));
    const pay = p.paymentId ? o.payments.find((x) => x.id === p.paymentId) : [...o.payments].reverse().find((x) => x.status === 'submitted');
    if (!pay || pay.status !== 'submitted') throw new UserError('There is no submitted payment to verify on this order.');
    const amount = p.amount != null && p.amount !== '' ? Math.round(Number(p.amount)) : pay.amount;
    if (!(amount > 0)) throw new UserError('Enter the amount received.');
    const before = effStatus(o, now);
    pay.status = 'verified';
    pay.amount = amount;
    pay.verifiedAt = now;
    pay.verifiedBy = ctx.staffName || ctx.role;
    o.amountPaid += amount;
    o.holdUntil = null;
    recalc(o, s);
    if (o.status === 'awaiting_verification' && !o.payments.some((x) => x.status === 'submitted')) {
      // part-payment: keep the order alive for a day so the rest can be paid
      o.status = 'pending_payment';
      o.holdUntil = now + 24 * HOUR;
    }
    o.updatedAt = now;
    hist(o, ctx, 'payment verified', `${pay.method.toUpperCase()} ${pay.txnId} · ${fmtUGX(amount)}`);
    await store.put('orders', o);
    if (o.status === 'paid' && before !== 'paid') await enqueue(o.buyer.phone, orderMessage(o, 'paid', s), 'order_paid', o.ref);
    else if (o.status === 'deposit_paid' && before !== 'deposit_paid') await enqueue(o.buyer.phone, orderMessage(o, 'deposit', s), 'order_deposit', o.ref);
    return adminOrder({ id: o.id }, ctx, now);
  }
  async function adminReject(p, ctx, now) {
    const s = settings();
    const o = structuredClone(orderById(p.id));
    const pay = p.paymentId ? o.payments.find((x) => x.id === p.paymentId) : [...o.payments].reverse().find((x) => x.status === 'submitted');
    if (!pay || pay.status !== 'submitted') throw new UserError('There is no submitted payment to reject.');
    pay.status = 'rejected';
    pay.rejectReason = cleanText(p.reason, 140) || 'Not found in our statement';
    pay.verifiedAt = now;
    pay.verifiedBy = ctx.staffName || ctx.role;
    if (o.status === 'awaiting_verification') {
      o.status = 'pending_payment';
      o.holdUntil = now + 24 * HOUR;
    }
    o.updatedAt = now;
    hist(o, ctx, 'payment rejected', `${pay.txnId}: ${pay.rejectReason}`);
    await store.put('orders', o);
    await enqueue(o.buyer.phone, orderMessage(o, 'rejected', s), 'payment_rejected', o.ref);
    return adminOrder({ id: o.id }, ctx, now);
  }
  async function adminRecordPayment(p, ctx, now) {
    const s = settings();
    const o = structuredClone(orderById(p.id));
    const st = effStatus(o, now);
    if (st === 'cancelled' || st === 'rejected') throw new UserError('This order is cancelled.');
    const method = ['cash', 'mtn', 'airtel', 'bank'].includes(p.method) ? p.method : 'cash';
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new UserError('Enter the amount received.');
    const txnId = method === 'cash' ? `CASH-${newId('').slice(0, 6)}` : cleanTxn(p.txnId);
    if (method !== 'cash' && txnInUse(txnId, o.id)) throw new UserError('That transaction ID is already used on another order.');
    const before = st;
    for (const x of o.payments) if (x.status === 'submitted') x.status = 'replaced';
    o.payments.push({ id: newId('Y'), method, txnId, payerPhone: '', amount, status: 'verified', submittedAt: now, verifiedAt: now, verifiedBy: ctx.staffName || ctx.role, note: cleanText(p.note, 140) });
    o.amountPaid += amount;
    o.holdUntil = null;
    recalc(o, s);
    if (o.status === 'pending_payment' || o.status === 'awaiting_verification') { o.status = 'pending_payment'; o.holdUntil = now + 24 * HOUR; }
    o.updatedAt = now;
    hist(o, ctx, 'payment recorded', `${method.toUpperCase()} · ${fmtUGX(amount)}`);
    await store.put('orders', o);
    if (o.status === 'paid' && before !== 'paid') await enqueue(o.buyer.phone, orderMessage(o, 'paid', s), 'order_paid', o.ref);
    else if (o.status === 'deposit_paid' && before !== 'deposit_paid') await enqueue(o.buyer.phone, orderMessage(o, 'deposit', s), 'order_deposit', o.ref);
    return adminOrder({ id: o.id }, ctx, now);
  }
  async function adminCancel(p, ctx, now) {
    const o = structuredClone(orderById(p.id));
    if (o.passes.some((x) => x.checkedInAt)) throw new UserError('Someone on this order is already checked in. Undo the check-in first.');
    o.status = 'cancelled';
    o.holdUntil = null;
    o.cancelReason = cleanText(p.reason, 140);
    for (const x of o.passes) x.voidedAt = now;
    o.updatedAt = now;
    hist(o, ctx, 'cancelled', o.cancelReason);
    await store.put('orders', o);
    return adminOrder({ id: o.id }, ctx, now);
  }
  async function adminUpdateHolders(p, ctx, now) {
    const s = settings();
    const o = structuredClone(orderById(p.id));
    const n = applyHolderChanges(o, p.changes, ctx, now, s, true);
    if (n) { o.updatedAt = now; await store.put('orders', o); }
    return adminOrder({ id: o.id }, ctx, now);
  }
  async function adminResend(p, ctx, now) {
    const s = settings();
    const o = orderById(p.id);
    const st = effStatus(o, now);
    const kind = st === 'paid' ? 'paid' : st === 'deposit_paid' ? 'deposit' : 'received';
    const to = normPhone(p.to) || o.buyer.phone;
    await enqueue(to, orderMessage(o, kind, s), 'resend', o.ref);
    return { ok: true, body: orderMessage(o, kind, s), to };
  }

  // comps
  function compSummary(s, now) {
    const ev = s.event;
    const live = orders().filter((o) => o.kind === 'comp' && isLive(o, now));
    const groups = ev.comps.groups.map((g) => ({ ...g, used: live.filter((o) => o.comp.group === g.key).length }));
    return { planned: ev.comps.planned, ceiling: ev.comps.ceiling, issued: live.length, groups };
  }
  function adminComps(_p, _ctx, now) {
    const s = settings();
    const rows = orders().filter((o) => o.kind === 'comp').sort((a, b) => b.createdAt - a.createdAt).map((o) => ({ ...adminOrderRow(o, now, s), group: o.comp.groupName, note: o.comp.note, access: accessLabel(o.passes[0].access, s), code: o.passes[0].code, passToken: o.passes[0].token }));
    return { ...compSummary(s, now), rows };
  }
  async function adminIssueComp(p, ctx, now) {
    const s = settings();
    const ev = s.event;
    const sum = compSummary(s, now);
    const g = ev.comps.groups.find((x) => x.key === p.group);
    if (!g) throw new UserError('Choose a guest group.');
    if (sum.issued >= ev.comps.ceiling) throw new UserError(`The guest-pass ceiling (${ev.comps.ceiling}) is reached.`);
    const used = sum.groups.find((x) => x.key === g.key).used;
    if (used >= g.alloc && !p.override) throw new UserError(`${g.name} has used its ${g.alloc} passes. Tick “over allocation” to issue anyway.`, 'over_alloc');
    const inv = inventory(s, now);
    if (inv.room < 1) throw new UserError('The event is at capacity.');
    const name = cleanText(p.name, 60);
    if (name.length < 2) throw new UserError('Every guest pass needs a name.');
    const phone = p.phone ? normPhone(p.phone) : '';
    if (p.phone && !phone) throw new UserError('Check the phone number.');
    const access = ['comp-ga', 'comp-vip', 'accredited'].includes(p.access) ? p.access : 'comp-ga';
    const idx = passIndex();
    const o = {
      id: newId('O'), ref: newOrderRef(), token: newToken(), createdAt: now, updatedAt: now, status: 'paid', holdUntil: null,
      buyer: { name, phone: phone || '', email: '' }, source: 'comp', referral: '', song: '', consents: { terms: true, adult: true, marketing: false, partners: false, at: now },
      channel: 'comp', kind: 'comp', comp: { group: g.key, groupName: g.name, note: cleanText(p.note, 140), overAlloc: used >= g.alloc },
      release: '', releaseName: '', unitPrice: 0, total: 0, amountDue: 0, amountPaid: 0, payPlan: 'full', payments: [],
      passes: [newPass(access, { name, phone }, idx)], history: [],
    };
    hist(o, ctx, 'guest pass issued', `${g.name}${o.comp.note ? ' · ' + o.comp.note : ''}`);
    await store.put('orders', o);
    if (phone && p.notify) {
      const l = link('p', o.passes[0].token);
      await enqueue(phone, `${ev.name}: ${name}, you’re on the guest list. ${fmtDate(ev.date)}, gates ${fmtTime(ev.gatesOpen)}, ${s.venue.name}.${l ? ' Your pass: ' + l : ' Code ' + o.passes[0].code}`, 'comp', o.ref);
    }
    return adminOrder({ id: o.id }, ctx, now);
  }

  function adminTables(_p, _ctx, now) {
    const s = settings();
    const inv = inventory(s, now);
    const byTable = {};
    for (const o of orders()) if (o.kind === 'table' && isLive(o, now)) byTable[o.table.id] = o;
    return {
      balanceDue: s.event.balanceDue, guestNamesDue: s.event.guestNamesDue,
      tiers: inv.tables.map((t) => ({
        key: t.key, name: t.name, guests: t.guests, price: t.price,
        tables: t.ids.map((id) => {
          const o = byTable[id];
          if (!o) return { id, state: 'free' };
          const st = effStatus(o, now);
          const named = o.passes.filter((x) => !/^Guest \d+$/.test(x.holder.name)).length;
          return { id, state: st, orderId: o.id, ref: o.ref, buyer: o.buyer.name, phone: displayPhone(o.buyer.phone), paid: o.amountPaid, due: Math.max(0, o.total - o.amountPaid), named, guests: o.passes.length, checkedIn: o.passes.filter((x) => x.checkedInAt).length };
        }),
      })),
    };
  }

  // ------------------------------------------------------------ dashboard
  function adminDashboard(_p, _ctx, now) {
    const s = settings();
    const ev = s.event;
    const inv = inventory(s, now);
    let gross = 0, potential = 0, depositGuests = 0, pendingGuests = 0, awaiting = 0, awaitingAmount = 0, flagged = 0;
    const byChannel = { online: 0, door: 0, comp: 0 };
    const relSold = {};
    let tablesPaid = 0, tablesDeposit = 0;
    for (const o of orders()) {
      const st = effStatus(o, now);
      gross += o.amountPaid;
      if (!isLive(o, now)) continue;
      if (st === 'paid' || st === 'deposit_paid') { potential += o.total; byChannel[o.channel === 'door' ? 'door' : o.kind === 'comp' ? 'comp' : 'online'] += o.passes.length; }
      if (st === 'deposit_paid') depositGuests += o.passes.length;
      if (st === 'pending_payment' || st === 'awaiting_verification') pendingGuests += o.passes.length;
      if (o.payments.some((x) => x.status === 'submitted')) { awaiting++; awaitingAmount += o.payments.filter((x) => x.status === 'submitted').reduce((a, x) => a + x.amount, 0); }
      if (o.flag) flagged++;
      if (o.kind === 'ga' && (st === 'paid')) relSold[o.release] = (relSold[o.release] || 0) + o.passes.length;
      if (o.kind === 'table') { if (st === 'paid') tablesPaid++; if (st === 'deposit_paid') tablesDeposit++; }
    }
    const today = eatDate(now);
    const bk = bookings();
    const todays = bk.filter((b) => b.date === today && BOOKING_LIVE.has(b.status));
    const comps = compSummary(s, now);
    const pay = s.payments;
    const queued = store.all('outbox').filter((m) => m.status === 'queued' || m.status === 'manual').length;
    return {
      now, today,
      event: { name: ev.name, date: ev.date, gatesOpen: ev.gatesOpen, daysToGo: daysBetween(today, ev.date), maxScans: ev.maxScans, paidTarget: ev.paidTarget, paidFloor: ev.paidFloor, salesMode: ev.salesMode, forceRelease: ev.forceRelease },
      tickets: {
        paidGuests: inv.paidGuests, depositGuests, pendingGuests, comps: comps.issued, compsPlanned: comps.planned, compsCeiling: comps.ceiling,
        committed: inv.committed, room: inv.room, gross, potential, awaiting, awaitingAmount, flagged, byChannel,
        releases: inv.releases.map((r) => ({ ...r, paid: relSold[r.key] || 0 })),
        current: inv.current, gaAvailable: inv.gaAvailable,
        tables: { paid: tablesPaid, deposit: tablesDeposit, total: inv.tables.reduce((a, t) => a + t.ids.length, 0), free: inv.tables.reduce((a, t) => a + t.free.length, 0) },
      },
      door: { inside: insideCount(), max: ev.maxScans },
      bookings: {
        today: todays.length,
        todayByType: Object.fromEntries(Object.keys(BOOKING_TYPES).map((k) => [k, todays.filter((b) => b.type === k).length])),
        requests: bk.filter((b) => b.status === 'requested').length,
        awaitingPayment: bk.filter((b) => b.payment && b.payment.status === 'awaiting_verification').length,
        upcoming: bk.filter((b) => BOOKING_LIVE.has(b.status) && b.date >= today).length,
      },
      waitlist: store.all('waitlist').filter((w) => w.status === 'waiting').length,
      messages: queued,
      readiness: [
        { label: 'MoMo or Airtel merchant code set', ok: !!(pay.mtnMerchantCode || pay.airtelMerchantCode), fix: 'settings' },
        { label: 'Public website address set (for ticket links in SMS)', ok: !!s.venue.publicUrl, fix: mode === 'preview' ? '' : 'env', hide: mode === 'preview' },
        { label: 'Ticket sales not paused', ok: ev.salesMode !== 'paused', fix: 'settings' },
      ].filter((x) => !x.hide),
      mode,
    };
  }

  // ------------------------------------------------------------ bookings
  function bookingByToken(token) {
    const b = bookings().find((x) => x.token === token);
    if (!b) throw new UserError('We couldn’t find that booking.', 'not_found');
    return b;
  }
  function bookingStart(b) {
    const t = b.time || (b.slots && b.slots[0]) || '00:00';
    return eatToMs(b.date, t);
  }
  function publicBooking(b, now, s = settings()) {
    return {
      code: b.code, token: b.token, type: b.type, typeName: BOOKING_TYPES[b.type].name, status: b.status, statusLabel: STATUS_LABEL[b.status] || b.status,
      date: b.date, endDate: b.endDate || '', time: b.time || '', slots: b.slots || [], details: b.details, price: b.price, currency: b.currency,
      payment: b.payment, contact: { name: b.contact.name, phone: displayPhone(b.contact.phone) }, createdAt: b.createdAt,
      canCancel: BOOKING_LIVE.has(b.status) && b.status !== 'checked_in' && bookingStart(b) > now + 2 * HOUR,
      payments: { mtnMerchantCode: s.payments.mtnMerchantCode, airtelMerchantCode: s.payments.airtelMerchantCode },
    };
  }
  function turfSlots(date, now, s, excludeId) {
    const t = s.amenities.turf;
    const dow = dowOf(date);
    const taken = {};
    for (const b of liveBookings('turf', date)) if (b.id !== excludeId) for (const x of b.slots) taken[x] = b;
    const out = [];
    for (let m = minutesOf(t.open); m < minutesOf(t.close); m += 60) {
      const time = timeOf(m);
      const open = t.openSessions.find((o) => o.days.includes(dow) && m >= minutesOf(o.from) && m < minutesOf(o.to));
      const night = m >= minutesOf(t.nightFrom);
      let state = 'free';
      if (eatToMs(date, time) <= now) state = 'past';
      else if (open) state = 'open_session';
      else if (taken[time]) state = 'booked';
      out.push({ time, state, rate: night ? t.nightRate : t.dayRate, night, label: open ? open.label : '' });
    }
    return out;
  }
  function saunaSlots(date, now, s) {
    const c = s.amenities.sauna;
    const used = {};
    for (const b of liveBookings('sauna', date)) used[b.time] = (used[b.time] || 0) + b.details.adults + b.details.kids;
    return c.slots.map((time) => ({ time, left: Math.max(0, c.capacity - (used[time] || 0)), past: eatToMs(date, time) <= now }));
  }
  function penthouseNights(s, excludeId) {
    const nights = new Set();
    for (const b of liveBookings('penthouse')) {
      if (b.id === excludeId) continue;
      for (let d = b.date; d < b.endDate; d = addDays(d, 1)) nights.add(d);
    }
    return nights;
  }
  function bookingAvailability(p, _ctx, now) {
    const s = settings();
    const today = eatDate(now);
    const date = isDate(p.date) ? p.date : today;
    switch (p.type) {
      case 'turf': return { date, slots: turfSlots(date, now, s) };
      case 'sauna': return { date, slots: saunaSlots(date, now, s) };
      case 'penthouse': return { booked: [...penthouseNights(s)].filter((d) => d >= today).sort() };
      default: return {};
    }
  }
  function validContact(c = {}) {
    const name = cleanText(c.name, 60);
    if (name.length < 2) throw new UserError('Please enter your name.');
    const phone = normPhone(c.phone);
    if (!phone) throw new UserError('Please enter a valid phone number, e.g. 0772 123 456.');
    const email = cleanText(c.email, 120);
    if (email && !isEmail(email)) throw new UserError('That email address doesn’t look right.');
    return { name, phone, email };
  }
  function dateInWindow(date, today, daysAhead, label = 'date') {
    if (!isDate(date)) throw new UserError(`Choose a ${label}.`);
    if (date < today) throw new UserError('That date has passed.');
    if (daysBetween(today, date) > daysAhead) throw new UserError(`Bookings open up to ${daysAhead} days ahead.`);
  }
  async function bookingCreate(p, ctx, now) {
    const s = settings();
    const a = s.amenities;
    const today = eatDate(now);
    const type = p.type;
    if (!BOOKING_TYPES[type]) throw new UserError('Choose what you’d like to book.');
    const contact = validContact(p.contact);
    const mine = bookings().filter((x) => x.type === type && x.contact.phone === contact.phone && BOOKING_LIVE.has(x.status) && (x.endDate || x.date) >= today);
    if (mine.length >= 4) throw new UserError(`You already have ${mine.length} upcoming ${BOOKING_TYPES[type].name.toLowerCase()} bookings. Call ${s.venue.phone} to book more.`, 'too_many');
    const b = {
      id: newId('B'), code: newBookingCode(), token: newToken(), type, createdAt: now, updatedAt: now, status: 'confirmed',
      date: '', time: '', slots: [], details: {}, contact, price: 0, currency: 'UGX',
      payment: { status: 'unpaid', method: '', txnId: '', amount: 0 }, consents: { marketing: !!(p.consents && p.consents.marketing), at: now },
      note: cleanText(p.note, 300), history: [],
    };
    const d = p.date;
    if (type === 'turf') {
      dateInWindow(d, today, a.turf.daysAhead);
      const slots = Array.isArray(p.slots) ? [...new Set(p.slots)].filter(isTime).sort() : [];
      if (!slots.length) throw new UserError('Pick at least one hour.');
      if (slots.length > a.turf.maxHours) throw new UserError(`You can book up to ${a.turf.maxHours} hours at a time.`);
      for (let i = 1; i < slots.length; i++) if (minutesOf(slots[i]) - minutesOf(slots[i - 1]) !== 60) throw new UserError('Pick hours next to each other.');
      const grid = turfSlots(d, now, s);
      for (const t of slots) {
        const g = grid.find((x) => x.time === t);
        if (!g) throw new UserError('That hour isn’t available.');
        if (g.state === 'booked') throw new UserError(`${fmtTime(t)} was just booked. Please pick another hour.`, 'taken');
        if (g.state === 'open_session') throw new UserError(`${fmtTime(t)} is an open soccer session. Walk in and join.`);
        if (g.state === 'past') throw new UserError(`${fmtTime(t)} has passed.`);
      }
      b.date = d; b.slots = slots; b.time = slots[0];
      b.details = { team: cleanText(p.details && p.details.team, 60), players: Math.max(0, Math.min(30, Math.floor(Number(p.details && p.details.players) || 0))) };
      b.price = slots.reduce((x, t) => x + grid.find((g) => g.time === t).rate, 0);
    } else if (type === 'sauna') {
      dateInWindow(d, today, 30);
      const time = p.time;
      const slot = saunaSlots(d, now, s).find((x) => x.time === time);
      if (!slot) throw new UserError('Choose a time.');
      if (slot.past) throw new UserError('That time has passed.');
      const adults = Math.max(0, Math.floor(Number(p.details && p.details.adults) || 0));
      const kids = Math.max(0, Math.floor(Number(p.details && p.details.kids) || 0));
      if (adults + kids < 1) throw new UserError('Add at least one person.');
      if (adults + kids > slot.left) throw new UserError(slot.left ? `Only ${slot.left} place${slot.left > 1 ? 's' : ''} left at ${fmtTime(time)}.` : `${fmtTime(time)} is full.`, 'taken');
      b.date = d; b.time = time; b.details = { adults, kids };
      b.price = adults * a.sauna.adult + kids * a.sauna.kid;
    } else if (type === 'gym') {
      dateInWindow(d, today, 60, 'start date');
      const plan = a.gym.plans.find((x) => x.key === (p.details && p.details.plan));
      if (!plan) throw new UserError('Choose a plan.');
      const session = a.gym.sessions.find((x) => x.key === (p.details && p.details.session)) || a.gym.sessions[0];
      b.date = d; b.time = session.from; b.status = 'requested';
      b.details = { plan: plan.key, planName: plan.name, period: plan.period, session: session.key, sessionName: `${session.name} · ${fmtTime(session.from)}–${fmtTime(session.to)}` };
      b.price = plan.price;
    } else if (type === 'penthouse') {
      const end = p.endDate;
      dateInWindow(d, today, a.penthouse.daysAhead, 'check-in date');
      if (!isDate(end) || end <= d) throw new UserError('Choose a check-out date after check-in.');
      const nights = daysBetween(d, end);
      if (nights > a.penthouse.maxNights) throw new UserError(`Stays are up to ${a.penthouse.maxNights} nights. Call us for longer stays.`);
      const pkg = a.penthouse.packages.find((x) => x.key === (p.details && p.details.package));
      if (!pkg) throw new UserError('Choose a package.');
      const guests = Math.max(1, Math.floor(Number(p.details && p.details.guests) || 1));
      if (guests > pkg.guests) throw new UserError(`${pkg.name} sleeps up to ${pkg.guests}.`);
      const booked = penthouseNights(s);
      for (let x = d; x < end; x = addDays(x, 1)) if (booked.has(x)) throw new UserError(`The penthouse is taken on ${fmtDate(x)}. Try other dates.`, 'taken');
      b.date = d; b.endDate = end; b.time = '14:00'; b.status = 'requested'; b.currency = a.penthouse.currency;
      b.details = { package: pkg.key, packageName: pkg.name, guests, nights, rate: pkg.price };
      b.price = nights * pkg.price;
    } else if (type === 'kids') {
      const day = siteKidsDay(d, now, s);
      if (day.full) throw new UserError('That Saturday is full. Try the next one.', 'taken');
      const child = cleanText(p.details && p.details.child, 60);
      if (child.length < 2) throw new UserError('Add your child’s name.');
      const age = Math.floor(Number(p.details && p.details.age));
      if (!(age >= 3 && age <= 17)) throw new UserError('Kids training is for ages 3 to 17.');
      const coach = (p.details && p.details.option) !== 'kidsOnly';
      b.date = d; b.time = a.kids.time || '';
      b.details = { child, age, option: coach ? 'withCoach' : 'kidsOnly', optionName: coach ? 'With a coach' : 'Kids only' };
      b.price = coach ? a.kids.withCoach : a.kids.kidsOnly;
    } else if (type === 'quiz') {
      const days = upcomingDays(a.quiz.day, a.quiz.weeksAhead, a.quiz.time, now);
      if (!days.includes(d)) throw new UserError('Choose an upcoming Quiz Night.');
      const live = liveBookings('quiz', d);
      if (live.length >= a.quiz.maxTeams) throw new UserError('That Quiz Night is full. Pick the next Saturday.', 'taken');
      const team = cleanText(p.details && p.details.team, 40);
      if (team.length < 2) throw new UserError('Give your team a name.');
      if (live.some((x) => x.details.team.toLowerCase() === team.toLowerCase())) throw new UserError('That team name is taken for that night. Try another.', 'taken');
      if (live.some((x) => x.contact.phone === contact.phone)) throw new UserError('You’ve already registered a team for that night.', 'taken');
      const size = Math.floor(Number(p.details && p.details.size));
      if (!(size >= a.quiz.minSize && size <= a.quiz.maxSize)) throw new UserError(`Teams are ${a.quiz.minSize} to ${a.quiz.maxSize} players.`);
      b.date = d; b.time = a.quiz.time; b.details = { team, size };
      b.price = a.quiz.entry || 0;
    } else if (type === 'table') {
      dateInWindow(d, today, a.table.daysAhead);
      const time = p.time;
      if (!isTime(time) || minutesOf(time) < minutesOf(a.table.from) || minutesOf(time) > minutesOf(a.table.to)) throw new UserError(`Choose a time between ${fmtTime(a.table.from)} and ${fmtTime(a.table.to)}.`);
      if (eatToMs(d, time) <= now) throw new UserError('That time has passed.');
      const party = Math.floor(Number(p.details && p.details.party));
      if (!(party >= a.table.minParty && party <= a.table.maxParty)) throw new UserError(`Party size is ${a.table.minParty} to ${a.table.maxParty}. Call us for bigger groups.`);
      b.date = d; b.time = time; b.status = 'requested';
      b.details = { party, occasion: cleanText(p.details && p.details.occasion, 60) };
      b.price = 0;
    }
    if (p.payment && p.payment.txnId && b.price > 0) {
      const txnId = cleanTxn(p.payment.txnId);
      if (txnInUse(txnId)) throw new UserError('That transaction ID is already attached to another booking.', 'duplicate_txn');
      b.payment = { status: 'awaiting_verification', method: p.payment.method === 'airtel' ? 'airtel' : 'mtn', txnId, amount: b.price, submittedAt: now };
    }
    hist(b, ctx, 'booked', '');
    await store.put('bookings', b);
    await enqueue(contact.phone, bookingMessage(b, s), 'booking', b.code);
    return publicBooking(b, now, s);
  }
  function siteKidsDay(d, now, s) {
    const a = s.amenities;
    const days = upcomingDays(a.kids.day, a.kids.weeksAhead, '12:00', now);
    if (!days.includes(d)) throw new UserError('Choose an upcoming Saturday.');
    const kids = liveBookings('kids', d).length;
    return { date: d, kids, full: kids >= a.kids.capacity };
  }
  function bookingWhen(b) {
    if (b.type === 'penthouse') return `${fmtDate(b.date)} to ${fmtDate(b.endDate)}`;
    if (b.type === 'turf') return `${fmtDate(b.date)}, ${fmtTime(b.slots[0])}–${fmtTime(timeOf(minutesOf(b.slots[b.slots.length - 1]) + 60))}`;
    if (b.type === 'gym') return `from ${fmtDate(b.date)}`;
    return `${fmtDate(b.date)}${b.time ? ', ' + fmtTime(b.time) : ''}`;
  }
  function bookingMessage(b, s) {
    const l = link('b', b.token);
    const what = BOOKING_TYPES[b.type].name;
    const state = b.status === 'requested' ? 'is received. We’ll confirm shortly' : 'is confirmed';
    return `${s.venue.name}: your ${what} booking ${b.code} for ${bookingWhen(b)} ${state}.${l ? ' ' + l : ' Show this code at reception.'} Help: ${s.venue.phone}`;
  }
  function bookingGet(p, _ctx, now) {
    return publicBooking(bookingByToken(p.token), now);
  }
  async function bookingCancel(p, ctx, now) {
    const b = structuredClone(bookingByToken(p.token));
    const view = publicBooking(b, now);
    if (!view.canCancel) throw new UserError('This booking can’t be cancelled online any more. Please call us.');
    b.status = 'cancelled';
    b.updatedAt = now;
    hist(b, ctx, 'cancelled by customer');
    await store.put('bookings', b);
    return publicBooking(b, now);
  }
  async function bookingSubmitPayment(p, ctx, now) {
    const b = structuredClone(bookingByToken(p.token));
    if (!BOOKING_LIVE.has(b.status)) throw new UserError('This booking is not active.');
    if (!(b.price > 0)) throw new UserError('This booking is free.');
    if (b.payment.status === 'paid') throw new UserError('This booking is already paid.');
    const txnId = cleanTxn(p.txnId);
    if (txnInUse(txnId, b.id)) throw new UserError('That transaction ID is already used.', 'duplicate_txn');
    b.payment = { status: 'awaiting_verification', method: p.method === 'airtel' ? 'airtel' : 'mtn', txnId, amount: b.price, submittedAt: now };
    b.updatedAt = now;
    hist(b, ctx, 'payment submitted', txnId);
    await store.put('bookings', b);
    return publicBooking(b, now);
  }

  function adminBookingRow(b, now) {
    return {
      id: b.id, code: b.code, type: b.type, typeName: BOOKING_TYPES[b.type].name, status: b.status, statusLabel: STATUS_LABEL[b.status] || b.status,
      date: b.date, endDate: b.endDate || '', time: b.time, slots: b.slots, when: bookingWhen(b), details: b.details, contact: { ...b.contact, phoneDisplay: displayPhone(b.contact.phone) },
      price: b.price, currency: b.currency, payment: b.payment, note: b.note, createdAt: b.createdAt, history: (b.history || []).slice().reverse(), token: b.token,
      link: link('b', b.token),
    };
  }
  function adminBookings(p, _ctx, now) {
    let list = bookings().slice();
    if (p.type) list = list.filter((b) => b.type === p.type);
    if (p.status) list = list.filter((b) => (p.status === 'live' ? BOOKING_LIVE.has(b.status) : p.status === 'unpaid' ? b.price > 0 && b.payment.status !== 'paid' && BOOKING_LIVE.has(b.status) : b.status === p.status));
    if (p.from) list = list.filter((b) => (b.endDate || b.date) >= p.from);
    if (p.to) list = list.filter((b) => b.date <= p.to);
    const q = String(p.q || '').trim().toLowerCase();
    if (q) {
      const phone = normPhone(q);
      const code = normalizeCode(q);
      list = list.filter((b) => b.code === code || (phone && b.contact.phone === phone) || b.contact.name.toLowerCase().includes(q) || (b.details.team || '').toLowerCase().includes(q));
    }
    list.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')) || a.createdAt - b.createdAt);
    return { total: list.length, rows: list.slice(0, 500).map((b) => adminBookingRow(b, now)) };
  }
  async function adminUpdateBooking(p, ctx, now) {
    const s = settings();
    const b = structuredClone(store.get('bookings', p.id) || null);
    if (!b || !b.id) throw new UserError('Booking not found.');
    const notes = [];
    if (p.status && p.status !== b.status) {
      if (!['requested', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'].includes(p.status)) throw new UserError('Unknown status.');
      if (BOOKING_LIVE.has(p.status) && !BOOKING_LIVE.has(b.status)) {
        // re-activating: re-check conflicts
        if (b.type === 'turf') {
          const grid = turfSlots(b.date, now - 365 * 24 * HOUR, s, b.id);
          if (b.slots.some((t) => grid.find((g) => g.time === t).state === 'booked')) throw new UserError('Those hours have been booked by someone else.');
        }
        if (b.type === 'penthouse') {
          const booked = penthouseNights(s, b.id);
          for (let x = b.date; x < b.endDate; x = addDays(x, 1)) if (booked.has(x)) throw new UserError('The penthouse is now taken on some of those nights.');
        }
      }
      notes.push(`${STATUS_LABEL[b.status]} → ${STATUS_LABEL[p.status]}`);
      const wasRequested = b.status === 'requested';
      b.status = p.status;
      if (wasRequested && p.status === 'confirmed' && p.notify !== false) await enqueue(b.contact.phone, bookingMessage(b, s), 'booking_confirmed', b.code);
    }
    if (p.payment) {
      const st = p.payment.status;
      if (st === 'paid') {
        const method = ['cash', 'mtn', 'airtel', 'bank'].includes(p.payment.method) ? p.payment.method : b.payment.method || 'cash';
        b.payment = { ...b.payment, status: 'paid', method, amount: Number(p.payment.amount) || b.price, verifiedAt: now, verifiedBy: ctx.staffName || ctx.role, txnId: p.payment.txnId ? cleanTxn(p.payment.txnId) : b.payment.txnId || '' };
        notes.push(`paid · ${method}`);
      } else if (st === 'rejected') {
        b.payment = { ...b.payment, status: 'rejected', verifiedAt: now };
        notes.push('payment rejected');
      } else if (st === 'unpaid') {
        b.payment = { status: 'unpaid', method: '', txnId: '', amount: 0 };
        notes.push('payment reset');
      }
    }
    if (p.time !== undefined && isTime(p.time)) { b.time = p.time; notes.push(`time ${fmtTime(p.time)}`); }
    if (p.price !== undefined && Number(p.price) >= 0) { b.price = Math.round(Number(p.price)); notes.push(`price ${fmtMoney(b.price, b.currency)}`); }
    if (p.staffNote !== undefined) { b.staffNote = cleanText(p.staffNote, 300); }
    b.updatedAt = now;
    hist(b, ctx, 'updated', notes.join(', '));
    await store.put('bookings', b);
    return adminBookingRow(b, now);
  }

  // ------------------------------------------------------------ customers, exports
  function customers(now) {
    const map = new Map();
    const touch = (phone, name, email, at, consents, src) => {
      if (!phone) return null;
      let c = map.get(phone);
      if (!c) { c = { phone, name, email: email || '', firstSeen: at, lastSeen: at, orders: 0, tickets: 0, bookings: 0, spend: 0, marketing: false, partners: false, consentAt: 0, sources: new Set(), types: new Set() }; map.set(phone, c); }
      if (at >= c.lastSeen) { c.lastSeen = at; c.name = name || c.name; if (email) c.email = email; }
      if (at < c.firstSeen) c.firstSeen = at;
      if (consents && consents.at >= c.consentAt) { c.marketing = !!consents.marketing; c.partners = !!consents.partners; c.consentAt = consents.at; }
      if (src) c.sources.add(src);
      return c;
    };
    for (const o of orders()) {
      if (o.kind === 'comp') continue;
      const c = touch(o.buyer.phone, o.buyer.name, o.buyer.email, o.createdAt, o.consents, o.source);
      if (!c) continue;
      c.orders++;
      const st = effStatus(o, now);
      if (st === 'paid' || st === 'deposit_paid') c.tickets += o.passes.length;
      c.spend += o.amountPaid;
      c.types.add('replay');
    }
    for (const b of bookings()) {
      const c = touch(b.contact.phone, b.contact.name, b.contact.email, b.createdAt, b.consents && { ...b.consents, partners: false }, '');
      if (!c) continue;
      c.bookings++;
      c.types.add(b.type);
      if (b.payment.status === 'paid' && b.currency === 'UGX') c.spend += b.payment.amount || 0;
    }
    return [...map.values()].map((c) => ({ ...c, sources: [...c.sources].filter(Boolean), types: [...c.types], phoneDisplay: displayPhone(c.phone) })).sort((a, b) => b.lastSeen - a.lastSeen);
  }
  function adminCustomers(p, _ctx, now) {
    let list = customers(now);
    const q = String(p.q || '').trim().toLowerCase();
    if (q) { const phone = normPhone(q); list = list.filter((c) => (phone && c.phone === phone) || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)); }
    if (p.marketing) list = list.filter((c) => c.marketing);
    return { total: list.length, optedIn: list.filter((c) => c.marketing).length, rows: list.slice(0, 500) };
  }
  function adminExport(p, _ctx, now) {
    const s = settings();
    const stamp = eatDate(now);
    const kind = p.kind;
    if (kind === 'guestlist') {
      const rows = [['Code', 'Guest', 'Access', 'Table', 'Order', 'Buyer', 'Buyer phone', 'Status', 'Checked in']];
      for (const o of orders()) for (const x of o.passes) {
        const st = passState(o, x, now);
        if (st === 'void') continue;
        rows.push([x.code, x.holder.name, accessLabel(x.access, s), o.table ? o.table.id : '', o.ref, o.buyer.name, displayPhone(o.buyer.phone), st, x.checkedInAt ? eatTime(x.checkedInAt) : '']);
      }
      rows.splice(1, rows.length - 1, ...rows.slice(1).sort((a, b) => a[1].localeCompare(b[1])));
      return { filename: `replay-guest-list-${stamp}.csv`, csv: toCsv(rows) };
    }
    if (kind === 'orders') {
      const rows = [['Ref', 'Created', 'Kind', 'Status', 'Buyer', 'Phone', 'Email', 'Item', 'Guests', 'Total', 'Paid', 'Due', 'Payment IDs', 'Referral', 'Source', 'Song', 'Marketing opt-in', 'Partner opt-in']];
      for (const o of orders().sort((a, b) => a.createdAt - b.createdAt)) {
        const r = adminOrderRow(o, now, s);
        rows.push([o.ref, fmtDateTime(o.createdAt), o.kind, r.statusLabel, o.buyer.name, displayPhone(o.buyer.phone), o.buyer.email || '', r.what, o.passes.length, o.total, o.amountPaid, r.due, o.payments.map((x) => `${x.method}:${x.txnId}:${x.status}`).join(' '), o.referral, o.source, o.song, o.consents.marketing ? 'yes' : 'no', o.consents.partners ? 'yes' : 'no']);
      }
      return { filename: `replay-orders-${stamp}.csv`, csv: toCsv(rows) };
    }
    if (kind === 'customers' || kind === 'marketing') {
      const list = customers(now).filter((c) => kind === 'customers' || c.marketing);
      const rows = [['Name', 'Phone', 'Email', 'First seen', 'Last seen', 'Orders', 'Tickets', 'Bookings', 'Spend (UGX)', 'Marketing opt-in', 'Partner opt-in', 'Interests']];
      for (const c of list) rows.push([c.name, c.phoneDisplay, c.email, fmtDateTime(c.firstSeen), fmtDateTime(c.lastSeen), c.orders, c.tickets, c.bookings, c.spend, c.marketing ? 'yes' : 'no', c.partners ? 'yes' : 'no', c.types.join(' ')]);
      return { filename: `social-spot-${kind === 'marketing' ? 'marketing-list' : 'customers'}-${stamp}.csv`, csv: toCsv(rows) };
    }
    if (kind === 'bookings') {
      const rows = [['Code', 'Type', 'Status', 'When', 'Name', 'Phone', 'Details', 'Price', 'Currency', 'Payment', 'Txn ID', 'Created']];
      for (const b of bookings().sort((a, b2) => (a.date + a.time).localeCompare(b2.date + b2.time))) {
        rows.push([b.code, BOOKING_TYPES[b.type].name, STATUS_LABEL[b.status], bookingWhen(b), b.contact.name, displayPhone(b.contact.phone), detailText(b), b.price, b.currency, b.payment.status, b.payment.txnId || '', fmtDateTime(b.createdAt)]);
      }
      return { filename: `social-spot-bookings-${stamp}.csv`, csv: toCsv(rows) };
    }
    if (kind === 'scans') {
      const rows = [['Time', 'Lane', 'Result', 'Code', 'Guest', 'Order', 'Staff']];
      for (const x of store.all('scans').sort((a, b) => a.at - b.at)) rows.push([fmtDateTime(x.at), x.lane, x.result, x.code, x.holder, x.ref, x.by]);
      return { filename: `replay-door-log-${stamp}.csv`, csv: toCsv(rows) };
    }
    throw new UserError('Unknown export.');
  }
  const fmtDateTime = (ms) => `${eatDate(ms)} ${eatTime(ms)}`;
  function detailText(b) {
    const d = b.details;
    switch (b.type) {
      case 'turf': return [d.team, d.players ? `${d.players} players` : ''].filter(Boolean).join(' · ');
      case 'sauna': return `${d.adults} adult${d.adults === 1 ? '' : 's'}${d.kids ? `, ${d.kids} kid${d.kids === 1 ? '' : 's'}` : ''}`;
      case 'gym': return `${d.planName} · ${d.sessionName}`;
      case 'penthouse': return `${d.packageName} · ${d.guests} guest${d.guests === 1 ? '' : 's'} · ${d.nights} night${d.nights === 1 ? '' : 's'}`;
      case 'kids': return `${d.child}, ${d.age} · ${d.optionName}`;
      case 'quiz': return `${d.team} · ${d.size} players`;
      case 'table': return `${d.party} people${d.occasion ? ' · ' + d.occasion : ''}`;
      default: return '';
    }
  }

  // ------------------------------------------------------------ waitlist, ambassadors, songs, messages
  function adminWaitlist() {
    return { rows: store.all('waitlist').sort((a, b) => a.createdAt - b.createdAt).map((w) => ({ ...w, phoneDisplay: displayPhone(w.phone) })) };
  }
  async function adminUpdateWaitlist(p, ctx, now) {
    const w = structuredClone(store.get('waitlist', p.id) || null);
    if (!w || !w.id) throw new UserError('Not found.');
    if (!['waiting', 'contacted', 'converted', 'removed'].includes(p.status)) throw new UserError('Unknown status.');
    w.status = p.status;
    w.updatedAt = now;
    await store.put('waitlist', w);
    return adminWaitlist();
  }
  function adminAmbassadors(_p, _ctx, now) {
    const s = settings();
    const pct = s.event.commissionPct;
    const rows = store.all('ambassadors').map((a) => {
      const os = orders().filter((o) => o.referral === a.code);
      const settled = os.filter((o) => effStatus(o, now) === 'paid');
      const tickets = settled.reduce((x, o) => x + o.passes.length, 0);
      const faceValue = settled.reduce((x, o) => x + o.total, 0);
      return { ...a, phoneDisplay: displayPhone(a.phone), orders: os.length, settledOrders: settled.length, tickets, faceValue, commission: Math.round((faceValue * pct) / 100), pending: os.filter((o) => isLive(o, now) && effStatus(o, now) !== 'paid').length };
    }).sort((a, b) => b.tickets - a.tickets || a.name.localeCompare(b.name));
    return { pct, rows };
  }
  async function adminSaveAmbassador(p, ctx, now) {
    const name = cleanText(p.name, 60);
    if (name.length < 2) throw new UserError('Add the ambassador’s name.');
    const phone = p.phone ? normPhone(p.phone) : '';
    if (p.phone && !phone) throw new UserError('Check the phone number.');
    let code = String(p.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!code) code = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) + String(store.all('ambassadors').length + 1);
    if (code.length < 3) throw new UserError('Codes need at least 3 letters or numbers.');
    const existing = p.id ? store.get('ambassadors', p.id) : null;
    if (store.all('ambassadors').some((a) => a.code === code && (!existing || a.id !== existing.id))) throw new UserError('That code is already in use.');
    const a = existing ? { ...existing, name, phone, code, active: p.active !== false, updatedAt: now } : { id: newId('A'), name, phone, code, active: true, createdAt: now };
    if (existing && existing.code !== code && orders().some((o) => o.referral === existing.code)) throw new UserError('This code already has sales, so it can’t be renamed.');
    await store.put('ambassadors', a);
    return adminAmbassadors({}, ctx, now);
  }
  function adminSongs(_p, _ctx, now) {
    const tally = new Map();
    for (const o of orders()) {
      if (!o.song || !isLive(o, now)) continue;
      const key = o.song.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
      if (!key) continue;
      const t = tally.get(key) || { song: o.song, votes: 0 };
      t.votes += 1;
      tally.set(key, t);
    }
    return { rows: [...tally.values()].sort((a, b) => b.votes - a.votes).slice(0, 100) };
  }
  function adminMessages(p) {
    let list = store.all('outbox').sort((a, b) => b.createdAt - a.createdAt);
    if (p.status) list = list.filter((m) => m.status === p.status);
    return { total: list.length, rows: list.slice(0, 300).map((m) => ({ ...m, toDisplay: displayPhone(m.to) })), smsEnabled: host.smsEnabled ? host.smsEnabled() : false };
  }
  async function adminMarkMessage(p, ctx, now) {
    const m = structuredClone(store.get('outbox', p.id) || null);
    if (!m || !m.id) throw new UserError('Message not found.');
    if (!['sent', 'manual', 'queued', 'cancelled'].includes(p.status)) throw new UserError('Unknown status.');
    m.status = p.status;
    if (p.status === 'sent') { m.sentAt = now; m.channel = p.channel || 'whatsapp'; m.by = ctx.staffName || ctx.role; }
    await store.put('outbox', m);
    return { ok: true };
  }
  async function adminBroadcast(p, ctx, now) {
    const s = settings();
    const body = cleanText(p.body, 600);
    if (body.length < 5) throw new UserError('Write the message first.');
    const phones = new Set();
    if (p.audience === 'replay_paid' || p.audience === 'replay_all') {
      for (const o of orders()) {
        const st = effStatus(o, now);
        if (o.kind !== 'comp' && (st === 'paid' || st === 'deposit_paid' || (p.audience === 'replay_all' && isLive(o, now)))) phones.add(o.buyer.phone);
      }
    } else if (p.audience === 'marketing') {
      for (const c of customers(now)) if (c.marketing) phones.add(c.phone);
    } else if (p.audience === 'waitlist') {
      for (const w of store.all('waitlist')) if (w.status === 'waiting') phones.add(w.phone);
    } else if (p.audience === 'quiz_next') {
      const next = upcomingDays(s.amenities.quiz.day, 1, s.amenities.quiz.time, now)[0];
      for (const b of liveBookings('quiz', next)) phones.add(b.contact.phone);
    } else throw new UserError('Choose who should get this message.');
    phones.delete('');
    if (!phones.size) throw new UserError('Nobody matches that audience yet.');
    if (p.dryRun) return { count: phones.size };
    for (const ph of phones) await enqueue(ph, body, `broadcast:${p.audience}`);
    return { count: phones.size };
  }

  // ------------------------------------------------------------ settings (admin)
  function adminSettings() {
    const o = store.get('settings', 'main');
    return { settings: settings(), overrides: (o && o.data) || {}, defaults: DEFAULTS, mode };
  }
  async function adminSaveSettings(p, ctx, now) {
    const patch = p.patch || {};
    const allowed = ['venue', 'event', 'payments', 'amenities'];
    for (const k of Object.keys(patch)) if (!allowed.includes(k)) throw new UserError(`Can’t change ${k}.`);
    if (patch.venue && 'publicUrl' in patch.venue) delete patch.venue.publicUrl;
    const cur = store.get('settings', 'main');
    const next = deepMerge((cur && cur.data) || {}, patch);
    const merged = deepMerge(DEFAULTS, next);
    validateSettings(merged);
    await store.put('settings', { id: 'main', data: next, updatedAt: now, by: ctx.staffName || ctx.role });
    return adminSettings();
  }
  function validateSettings(s) {
    const ev = s.event;
    if (!isDate(ev.date) || !isTime(ev.gatesOpen)) throw new UserError('Check the event date and gate time.');
    if (!['scheduled', 'paused'].includes(ev.salesMode)) throw new UserError('Unknown sales mode.');
    if (ev.forceRelease && !ev.releases.some((r) => r.key === ev.forceRelease)) throw new UserError('Unknown release.');
    for (const r of ev.releases) {
      if (!(r.qty >= 0 && r.price >= 0)) throw new UserError(`Check quantity and price for ${r.name}.`);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(r.opens)) throw new UserError(`Check the opening date for ${r.name}.`);
    }
    for (const t of ev.tables) if (!(t.price > 0 && t.count >= 0 && t.guests > 0)) throw new UserError(`Check the ${t.name} table settings.`);
    if (!(ev.maxScans > 0)) throw new UserError('Capacity must be above zero.');
    for (const d of [ev.balanceDue, ev.guestNamesDue, ev.transferDeadline]) if (!isDate(d)) throw new UserError('Check the deadline dates.');
  }
  async function adminResetPreview(_p, ctx) {
    if (mode !== 'preview') throw new UserError('Only available in the preview.');
    for (const col of ['orders', 'bookings', 'scans', 'waitlist', 'outbox']) for (const d of store.all(col)) await store.del(col, d.id);
    return { ok: true };
  }

  // ------------------------------------------------------------ dispatcher
  const METHODS = {
    'site.get': { role: 'public', fn: siteGet },
    'order.create': { role: 'public', fn: orderCreate, write: true, limited: true },
    'order.submitPayment': { role: 'public', fn: orderSubmitPayment, write: true, limited: true },
    'order.get': { role: 'public', fn: orderGet },
    'order.lookup': { role: 'public', fn: orderLookup, limited: true },
    'order.updateHolders': { role: 'public', fn: orderUpdateHolders, write: true, limited: true },
    'pass.get': { role: 'public', fn: passGet },
    'waitlist.join': { role: 'public', fn: waitlistJoin, write: true, limited: true },
    'booking.availability': { role: 'public', fn: bookingAvailability },
    'booking.create': { role: 'public', fn: bookingCreate, write: true, limited: true },
    'booking.get': { role: 'public', fn: bookingGet },
    'booking.cancel': { role: 'public', fn: bookingCancel, write: true, limited: true },
    'booking.submitPayment': { role: 'public', fn: bookingSubmitPayment, write: true, limited: true },

    'door.scan': { role: 'door', fn: doorScan, write: true },
    'door.lookup': { role: 'door', fn: doorLookup },
    'door.admit': { role: 'door', fn: doorAdmit, write: true },
    'door.undo': { role: 'door', fn: doorUndo, write: true },
    'door.stats': { role: 'door', fn: doorStats },
    'door.sell': { role: 'door', fn: doorSell, write: true },

    'admin.dashboard': { role: 'admin', fn: adminDashboard },
    'admin.orders': { role: 'admin', fn: adminOrders },
    'admin.order': { role: 'admin', fn: adminOrder },
    'admin.verifyPayment': { role: 'admin', fn: adminVerify, write: true },
    'admin.rejectPayment': { role: 'admin', fn: adminReject, write: true },
    'admin.recordPayment': { role: 'admin', fn: adminRecordPayment, write: true },
    'admin.cancelOrder': { role: 'admin', fn: adminCancel, write: true },
    'admin.updateHolders': { role: 'admin', fn: adminUpdateHolders, write: true },
    'admin.resend': { role: 'admin', fn: adminResend, write: true },
    'admin.comps': { role: 'admin', fn: adminComps },
    'admin.issueComp': { role: 'admin', fn: adminIssueComp, write: true },
    'admin.tables': { role: 'admin', fn: adminTables },
    'admin.bookings': { role: 'admin', fn: adminBookings },
    'admin.updateBooking': { role: 'admin', fn: adminUpdateBooking, write: true },
    'admin.customers': { role: 'admin', fn: adminCustomers },
    'admin.export': { role: 'admin', fn: adminExport },
    'admin.waitlist': { role: 'admin', fn: adminWaitlist },
    'admin.updateWaitlist': { role: 'admin', fn: adminUpdateWaitlist, write: true },
    'admin.ambassadors': { role: 'admin', fn: adminAmbassadors },
    'admin.saveAmbassador': { role: 'admin', fn: adminSaveAmbassador, write: true },
    'admin.songs': { role: 'admin', fn: adminSongs },
    'admin.messages': { role: 'admin', fn: adminMessages },
    'admin.markMessage': { role: 'admin', fn: adminMarkMessage, write: true },
    'admin.broadcast': { role: 'admin', fn: adminBroadcast, write: true },
    'admin.settings': { role: 'admin', fn: adminSettings },
    'admin.saveSettings': { role: 'admin', fn: adminSaveSettings, write: true },
    'admin.resetPreview': { role: 'admin', fn: adminResetPreview, write: true },
  };

  async function call(method, params, ctx = { role: 'public' }) {
    const m = METHODS[method];
    if (!m) throw new UserError('Unknown action.', 'not_found');
    if ((ROLE_RANK[ctx.role] ?? -1) < ROLE_RANK[m.role]) throw new UserError('Please sign in to do that.', 'forbidden');
    const run = () => m.fn(params || {}, ctx, clock());
    return m.write ? lock(run) : run();
  }

  return { call, settings, methods: METHODS, inventory: (now = clock()) => inventory(settings(), now), insideCount };
}
