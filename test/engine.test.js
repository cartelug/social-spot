import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../shared/engine.js';
import { MemStore } from '../shared/memstore.js';
import { eatToMs } from '../shared/util.js';

function setup(at = '2026-10-12T10:00') {
  const store = new MemStore();
  let now = eatToMs(...at.split('T'));
  const clock = () => now;
  const engine = createEngine({ store, clock, host: { mode: 'server', publicUrl: 'https://tickets.example', dispatch: false } });
  const admin = { role: 'admin', staffName: 'Test Admin' };
  const door = { role: 'door', staffName: 'Gate 1' };
  const pub = { role: 'public' };
  const call = (m, p, ctx = pub) => engine.call(m, p, ctx);
  const set = (stamp) => { now = eatToMs(...stamp.split('T')); };
  const advance = (ms) => { now += ms; };
  const buyer = (n = 1) => ({ name: `Buyer ${n}`, phone: `07720000${String(n).padStart(2, '0')}` });
  const consents = { terms: true, adult: true };
  return { store, engine, call, admin, door, pub, set, advance, buyer, consents };
}

async function buyGA(t, qty, n = 1, txn) {
  const o = await t.call('order.create', { kind: 'ga', qty, buyer: t.buyer(n), consents: t.consents });
  const sub = await t.call('order.submitPayment', { token: o.token, method: 'mtn', txnId: txn || `TXN${n}X${qty}${Math.random().toString(36).slice(2, 8)}` });
  const id = t.store.all('orders').find((x) => x.token === o.token).id;
  await t.call('admin.verifyPayment', { id }, t.admin);
  return { token: o.token, id, ref: o.ref };
}

test('nothing is on sale before Founders opens', async () => {
  const t = setup('2026-10-05T12:00');
  const site = await t.call('site.get');
  assert.equal(site.current, null);
  assert.equal(site.releases[0].state, 'upcoming');
  assert.equal(site.tablesOnSale, false);
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(), consents: t.consents }), /isn’t on sale/);
});

test('admin can open a release early', async () => {
  const t = setup('2026-10-05T12:00');
  await t.call('admin.saveSettings', { patch: { event: { forceRelease: 'founders' } } }, t.admin);
  const site = await t.call('site.get');
  assert.equal(site.current, 'founders');
  assert.equal(site.gaAvailable, 100);
  assert.equal(site.tablesOnSale, true);
});

test('holds reserve stock for 30 minutes, payment submission keeps it', async () => {
  const t = setup();
  const o = await t.call('order.create', { kind: 'ga', qty: 3, buyer: t.buyer(), consents: t.consents, release: 'founders' });
  assert.equal(o.status, 'pending_payment');
  assert.equal(o.total, 105000);
  assert.equal((await t.call('site.get')).gaAvailable, 97);
  t.advance(31 * 60 * 1000);
  assert.equal((await t.call('site.get')).gaAvailable, 100, 'expired hold releases stock');
  const o2 = await t.call('order.create', { kind: 'ga', qty: 2, buyer: t.buyer(2), consents: t.consents });
  await t.call('order.submitPayment', { token: o2.token, method: 'airtel', txnId: 'AIR12345678' });
  t.advance(5 * 3600 * 1000);
  assert.equal((await t.call('site.get')).gaAvailable, 98, 'submitted payment keeps holding stock');
});

test('verify issues valid QR passes and queues the SMS', async () => {
  const t = setup();
  const { token } = await buyGA(t, 2, 1, 'MP261012AB');
  const view = await t.call('order.get', { token });
  assert.equal(view.status, 'paid');
  assert.equal(view.passes.length, 2);
  assert.ok(view.passes.every((p) => p.state === 'valid' && /^SS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(p.code)));
  const msgs = t.store.all('outbox');
  assert.ok(msgs.some((m) => m.kind === 'order_paid' && m.body.includes('https://tickets.example/t/' + token)));
});

test('the same transaction ID cannot pay for two orders', async () => {
  const t = setup();
  await buyGA(t, 1, 1, 'SAMEID12345');
  const o = await t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(2), consents: t.consents });
  await assert.rejects(t.call('order.submitPayment', { token: o.token, method: 'mtn', txnId: 'sameid12345' }), /already attached/);
});

test('sell-out opens the next release at the next price', async () => {
  const t = setup();
  for (let i = 0; i < 10; i++) await buyGA(t, 10, i + 1);
  const site = await t.call('site.get');
  assert.equal(site.releases[0].state, 'soldout');
  assert.equal(site.current, 'advance');
  assert.equal(site.releases[1].price, 45000);
  assert.equal(site.gaAvailable, 130);
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(), consents: t.consents, release: 'founders' }), /Advance release is now on sale/);
});

test('unsold Founders tickets roll into Advance when Founders closes', async () => {
  const t = setup();
  await buyGA(t, 10, 1);
  t.set('2026-11-01T09:00');
  const site = await t.call('site.get');
  assert.equal(site.releases[0].state, 'ended');
  assert.equal(site.current, 'advance');
  assert.equal(site.gaAvailable, 220, '130 advance + 90 unsold founders');
});

test('door release only opens on the night', async () => {
  const t = setup('2026-11-23T09:00');
  let site = await t.call('site.get');
  assert.equal(site.current, 'final');
  t.set('2026-12-12T09:00');
  site = await t.call('site.get');
  assert.equal(site.current, 'door');
  assert.equal(site.releases.find((r) => r.key === 'door').price, 70000);
  assert.equal(site.gaAvailable, 300, 'all unsold GA is available at the door price');
  assert.equal(site.tablesOnSale, true);
  t.set('2026-12-12T16:30');
  assert.equal((await t.call('site.get')).tablesOnSale, false, 'tables stop at gate time');
  t.set('2026-12-13T07:00');
  site = await t.call('site.get');
  assert.equal(site.current, null);
  assert.ok(site.releases.every((r) => r.state === 'closed'));
});

test('table deposit, balance, scan rules', async () => {
  const t = setup();
  const o = await t.call('order.create', { kind: 'table', tier: 'vip', tableId: 'V3', payPlan: 'deposit', buyer: t.buyer(), consents: t.consents });
  assert.equal(o.amountDue, 325000);
  assert.equal(o.passes.length, 5);
  await assert.rejects(t.call('order.create', { kind: 'table', tier: 'vip', tableId: 'V3', payPlan: 'full', buyer: t.buyer(2), consents: t.consents }), /just taken/);
  await t.call('order.submitPayment', { token: o.token, method: 'mtn', txnId: 'DEPOSIT0001' });
  const id = t.store.all('orders').find((x) => x.token === o.token).id;
  await t.call('admin.verifyPayment', { id }, t.admin);
  let view = await t.call('order.get', { token: o.token });
  assert.equal(view.status, 'deposit_paid');
  assert.equal(view.balance, 325000);
  assert.ok(view.passes.every((p) => p.state === 'balance_due' && p.code === null), 'QR hidden until fully paid');
  const code = t.store.get('orders', id).passes[0].code;
  assert.equal((await t.call('door.scan', { code, lane: 'Tables & VIP' }, t.door)).result, 'balance_due');
  await t.call('admin.recordPayment', { id, method: 'cash', amount: 325000 }, t.admin);
  view = await t.call('order.get', { token: o.token });
  assert.equal(view.status, 'paid');
  assert.equal((await t.call('door.scan', { code: code.toLowerCase().replace(/-/g, ''), lane: 'Tables & VIP' }, t.door)).result, 'admitted');
  const dup = await t.call('door.scan', { code, lane: 'GA lane 1' }, t.door);
  assert.equal(dup.result, 'duplicate');
  assert.equal(dup.pass.checkedLane, 'Tables & VIP');
});

test('deposits close after the balance date', async () => {
  const t = setup('2026-12-06T10:00');
  const o = await t.call('order.create', { kind: 'table', tier: 'signature', payPlan: 'deposit', buyer: t.buyer(), consents: t.consents });
  assert.equal(o.payPlan, 'full');
  assert.equal(o.amountDue, 1200000);
});

test('renaming a guest issues a new code and kills the old one', async () => {
  const t = setup();
  const { token, id } = await buyGA(t, 2, 1);
  const before = t.store.get('orders', id).passes[1];
  const view = await t.call('order.updateHolders', { token, changes: [{ passId: before.id, name: 'Amina N', phone: '0701234567' }] });
  const after = view.passes[1];
  assert.equal(after.holder.name, 'Amina N');
  assert.notEqual(after.code, before.code);
  assert.equal((await t.call('door.scan', { code: before.code }, t.door)).result, 'replaced');
  const pass = await t.call('pass.get', { token: after.token });
  assert.equal(pass.pass.code, after.code);
  t.set('2026-12-11T09:00');
  await assert.rejects(t.call('order.updateHolders', { token, changes: [{ passId: before.id, name: 'Someone Else' }] }), /Changes closed/);
});

test('door stops at capacity and counts every access type', async () => {
  const t = setup();
  await t.call('admin.saveSettings', { patch: { event: { maxScans: 3 } } }, t.admin);
  const { id } = await buyGA(t, 2, 1);
  const comp = await t.call('admin.issueComp', { name: 'Press Guest', group: 'media', access: 'accredited' }, t.admin);
  assert.equal((await t.call('site.get')).gaAvailable, 0, 'capacity guard includes comps');
  const codes = [...t.store.get('orders', id).passes.map((p) => p.code), comp.passes[0].code];
  assert.equal((await t.call('door.scan', { code: codes[0] }, t.door)).result, 'admitted');
  await t.call('admin.saveSettings', { patch: { event: { maxScans: 1 } } }, t.admin);
  const r = await t.call('door.scan', { code: codes[2] }, t.door);
  assert.equal(r.result, 'capacity');
});

test('guest-pass ceiling and group allocation', async () => {
  const t = setup();
  await t.call('admin.saveSettings', { patch: { event: { comps: { ceiling: 3, groups: [{ key: 'mtn', name: 'MTN', alloc: 1 }] } } } }, t.admin);
  await t.call('admin.issueComp', { name: 'Guest One', group: 'mtn' }, t.admin);
  await assert.rejects(t.call('admin.issueComp', { name: 'Guest Two', group: 'mtn' }, t.admin), /used its 1/);
  await t.call('admin.issueComp', { name: 'Guest Two', group: 'mtn', override: true }, t.admin);
  await t.call('admin.issueComp', { name: 'Guest Three', group: 'mtn', override: true }, t.admin);
  await assert.rejects(t.call('admin.issueComp', { name: 'Guest Four', group: 'mtn', override: true }, t.admin), /ceiling/);
});

test('rejected payment returns the order for resubmission', async () => {
  const t = setup();
  const o = await t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(), consents: t.consents });
  await t.call('order.submitPayment', { token: o.token, method: 'mtn', txnId: 'WRONG12345' });
  const id = t.store.all('orders')[0].id;
  await t.call('admin.rejectPayment', { id, reason: 'Not on statement' }, t.admin);
  let v = await t.call('order.get', { token: o.token });
  assert.equal(v.status, 'pending_payment');
  await t.call('order.submitPayment', { token: o.token, method: 'mtn', txnId: 'RIGHT12345' });
  await t.call('admin.verifyPayment', { id }, t.admin);
  v = await t.call('order.get', { token: o.token });
  assert.equal(v.status, 'paid');
  assert.ok(t.store.all('outbox').some((m) => m.kind === 'payment_rejected'));
});

test('find my ticket needs the matching phone and code', async () => {
  const t = setup();
  const { token, ref } = await buyGA(t, 1, 7);
  const r = await t.call('order.lookup', { phone: '+256 772 000 007', code: ref.toLowerCase() });
  assert.equal(r.token, token);
  await assert.rejects(t.call('order.lookup', { phone: '0772000008', code: ref }), /No ticket matches/);
});

test('paused sales block new orders', async () => {
  const t = setup();
  await t.call('admin.saveSettings', { patch: { event: { salesMode: 'paused' } } }, t.admin);
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(), consents: t.consents }), /paused/);
});

test('ticket terms and age confirmation are required', async () => {
  const t = setup();
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(), consents: { terms: true } }), /18 or older/);
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: { name: 'A', phone: '123' }, consents: t.consents }), /full name/);
});

test('door sale on the night, with instant admit', async () => {
  const t = setup('2026-12-12T17:00');
  const r = await t.call('door.sell', { qty: 2, name: 'Walk In', method: 'cash', admit: true, lane: 'GA lane 2' }, t.door);
  assert.equal(r.order.status, 'paid');
  assert.equal(r.order.total, 140000);
  assert.equal(t.engine.insideCount(), 2);
});

test('referrals pay commission on settled tickets only', async () => {
  const t = setup();
  await t.call('admin.saveAmbassador', { name: 'Joan K', code: 'JOAN' }, t.admin);
  const o = await t.call('order.create', { kind: 'ga', qty: 4, buyer: t.buyer(), consents: t.consents, referral: 'joan' });
  await t.call('order.create', { kind: 'ga', qty: 2, buyer: t.buyer(2), consents: t.consents, referral: 'JOAN' });
  await t.call('order.submitPayment', { token: o.token, method: 'mtn', txnId: 'REF0000001' });
  const id = t.store.all('orders').find((x) => x.token === o.token).id;
  await t.call('admin.verifyPayment', { id }, t.admin);
  const a = (await t.call('admin.ambassadors', {}, t.admin)).rows[0];
  assert.equal(a.tickets, 4);
  assert.equal(a.commission, 14000);
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: t.buyer(3), consents: t.consents, referral: 'NOPE' }), /referral code/);
});

test('turf: hourly slots, open sessions, conflicts', async () => {
  const t = setup('2026-10-12T10:00'); // Monday
  const c = { name: 'Team Lead', phone: '0752000111' };
  const b = await t.call('booking.create', { type: 'turf', date: '2026-10-13', slots: ['18:00', '19:00'], contact: c, details: { team: 'Akright FC' } });
  assert.equal(b.status, 'confirmed');
  assert.equal(b.price, 140000);
  await assert.rejects(t.call('booking.create', { type: 'turf', date: '2026-10-13', slots: ['19:00'], contact: c }), /just booked/);
  await assert.rejects(t.call('booking.create', { type: 'turf', date: '2026-10-14', slots: ['20:00'], contact: c }), /open soccer session/);
  await assert.rejects(t.call('booking.create', { type: 'turf', date: '2026-10-13', slots: ['08:00', '10:00'], contact: c }), /next to each other/);
  await assert.rejects(t.call('booking.create', { type: 'turf', date: '2026-10-12', slots: ['09:00'], contact: c }), /passed/);
  const day = await t.call('booking.create', { type: 'turf', date: '2026-10-13', slots: ['09:00'], contact: c });
  assert.equal(day.price, 50000);
  const av = await t.call('booking.availability', { type: 'turf', date: '2026-10-14' });
  assert.equal(av.slots.find((s) => s.time === '20:00').state, 'open_session');
});

test('quiz night: unique team names and a team cap', async () => {
  const t = setup('2026-10-12T10:00');
  await t.call('admin.saveSettings', { patch: { amenities: { quiz: { maxTeams: 2 } } } }, t.admin);
  const site = await t.call('site.get');
  const sat = site.quizDays[0].date;
  assert.equal(sat, '2026-10-17');
  const c = (n) => ({ name: `Captain ${n}`, phone: `07010000${n}0` });
  await t.call('booking.create', { type: 'quiz', date: sat, details: { team: 'Quizzards', size: 4 }, contact: c(1) });
  await assert.rejects(t.call('booking.create', { type: 'quiz', date: sat, details: { team: 'quizzards', size: 4 }, contact: c(2) }), /name is taken/);
  await t.call('booking.create', { type: 'quiz', date: sat, details: { team: 'Brain Gain', size: 3 }, contact: c(2) });
  await assert.rejects(t.call('booking.create', { type: 'quiz', date: sat, details: { team: 'Late Team', size: 3 }, contact: c(3) }), /full/);
  await assert.rejects(t.call('booking.create', { type: 'quiz', date: '2026-10-16', details: { team: 'Friday Team', size: 3 }, contact: c(3) }), /upcoming Quiz Night/);
});

test('sauna capacity and penthouse nights', async () => {
  const t = setup('2026-10-12T10:00');
  const c = { name: 'Guest Person', phone: '0782000999' };
  await t.call('booking.create', { type: 'sauna', date: '2026-10-13', time: '18:00', details: { adults: 4, kids: 1 }, contact: c });
  await assert.rejects(t.call('booking.create', { type: 'sauna', date: '2026-10-13', time: '18:00', details: { adults: 2 }, contact: c }), /Only 1 place/);
  const p = await t.call('booking.create', { type: 'penthouse', date: '2026-10-20', endDate: '2026-10-23', details: { package: 'master', guests: 2 }, contact: c });
  assert.equal(p.price, 240);
  assert.equal(p.currency, 'USD');
  assert.equal(p.status, 'requested');
  await assert.rejects(t.call('booking.create', { type: 'penthouse', date: '2026-10-22', endDate: '2026-10-24', details: { package: 'small', guests: 1 }, contact: c }), /taken on/);
  await t.call('booking.create', { type: 'penthouse', date: '2026-10-23', endDate: '2026-10-24', details: { package: 'small', guests: 1 }, contact: c });
});

test('public visitors cannot call staff actions', async () => {
  const t = setup();
  await assert.rejects(t.call('admin.dashboard', {}), /sign in/);
  await assert.rejects(t.call('door.scan', { code: 'SS-AAAA-BBBB' }), /sign in/);
  await assert.rejects(t.call('admin.dashboard', {}, t.door), /sign in/);
});

test('exports escape spreadsheet formulas', async () => {
  const t = setup();
  const o = await t.call('order.create', { kind: 'ga', qty: 1, buyer: { name: '=HYPERLINK("x")', phone: '0772000001' }, consents: t.consents });
  assert.ok(o);
  const { csv } = await t.call('admin.export', { kind: 'orders' }, t.admin);
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
});

test('one phone can hold at most two unpaid orders', async () => {
  const t = setup();
  const b = t.buyer(9);
  await t.call('order.create', { kind: 'ga', qty: 1, buyer: b, consents: t.consents });
  await t.call('order.create', { kind: 'ga', qty: 1, buyer: b, consents: t.consents });
  await assert.rejects(t.call('order.create', { kind: 'ga', qty: 1, buyer: b, consents: t.consents }), /waiting for payment/);
  t.advance(31 * 60 * 1000);
  await t.call('order.create', { kind: 'ga', qty: 1, buyer: b, consents: t.consents });
});

test('one phone can hold at most four upcoming bookings per amenity, one quiz team per night', async () => {
  const t = setup('2026-10-12T10:00');
  const c = { name: 'Busy Booker', phone: '0752111222' };
  for (const h of ['07:00', '09:00', '11:00', '13:00']) await t.call('booking.create', { type: 'turf', date: '2026-10-13', slots: [h], contact: c });
  await assert.rejects(t.call('booking.create', { type: 'turf', date: '2026-10-13', slots: ['15:00'], contact: c }), /4 upcoming turf hire bookings/);
  const sat = (await t.call('site.get')).quizDays[0].date;
  await t.call('booking.create', { type: 'quiz', date: sat, details: { team: 'Team One', size: 3 }, contact: c });
  await assert.rejects(t.call('booking.create', { type: 'quiz', date: sat, details: { team: 'Team Two', size: 3 }, contact: c }), /already registered a team/);
});

test('a release runs until the next opens, then unsold stock rolls forward', async () => {
  const t = setup('2026-10-31T23:00');
  let s = await t.call('site.get');
  assert.equal(s.current, 'founders');
  t.set('2026-11-01T00:01');
  s = await t.call('site.get');
  assert.equal(s.current, 'advance');
  assert.equal(s.releases.find((r) => r.key === 'founders').state, 'ended');
});
