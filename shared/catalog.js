// Default configuration for Social Spot. Everything here can be changed from
// Admin → Settings; the admin's edits are stored as overrides on top of this.
// Sources: Social Spot Notion workspace (prices & weekly programme, July 2026),
// The Replay platform proposal (22 Sep 2026) and the year-end event plan v1.1 (29 Sep 2026).

export const DEFAULTS = {
  venue: {
    name: 'Social Spot',
    area: 'Akright City, Bwebajja',
    landmark: 'Next to Elite High School',
    phone: '0393 103 799',
    slogan: 'Everything worth leaving the house for.',
    publicUrl: '', // set by the server from PUBLIC_URL
  },

  event: {
    name: 'The Replay',
    edition: 'The Year-End Edition',
    date: '2026-12-12',
    gatesOpen: '16:00',
    pitch: 'A year-end homecoming built around the songs you know word for word.',
    salesMode: 'scheduled', // scheduled | paused
    forceRelease: '', // '' or a release key to put on sale now, ignoring its date
    maxScans: 450, // guests inside, all access types; entry stops here
    paidTarget: 375,
    paidFloor: 350,
    maxPerOrder: 10,
    holdMinutes: 30,
    releases: [
      { key: 'founders', name: 'Founders', qty: 100, price: 35000, opens: '2026-10-12T00:00' },
      { key: 'advance', name: 'Advance', qty: 130, price: 45000, opens: '2026-11-01T00:00' },
      { key: 'final', name: 'Final', qty: 50, price: 55000, opens: '2026-11-23T00:00' },
      { key: 'door', name: 'Door', qty: 20, price: 70000, opens: '2026-12-12T00:00', doorOnly: true },
    ],
    tables: [
      {
        key: 'signature', name: 'Signature Lounge', count: 5, guests: 6, price: 1200000, prefix: 'S',
        perks: ['Entry for 6 guests', 'Reserved table and seating', 'Host-led service and the table entry lane', 'Prime floor-edge position, numbered and named'],
      },
      {
        key: 'vip', name: 'VIP Reserved', count: 9, guests: 5, price: 650000, prefix: 'V',
        perks: ['Entry for 5 guests', 'Reserved table and seating', 'Table entry lane and a table host', 'Close to the table bar'],
      },
    ],
    depositPct: 50,
    balanceDue: '2026-12-05',
    guestNamesDue: '2026-12-09',
    transferDeadline: '2026-12-10',
    tableHeldUntil: '20:00',
    commissionPct: 10,
    comps: {
      planned: 75,
      ceiling: 100,
      groups: [
        { key: 'mtn', name: 'Partner · MTN', alloc: 12 },
        { key: 'pearl', name: 'Partner · Pearl Bank', alloc: 10 },
        { key: 'drinks', name: 'Partner · drinks', alloc: 8 },
        { key: 'media', name: 'Media & creators', alloc: 15 },
        { key: 'community', name: 'Akright community', alloc: 15 },
        { key: 'management', name: 'Management & business', alloc: 10 },
        { key: 'recovery', name: 'Service recovery', alloc: 5 },
      ],
    },
    lanes: ['GA lane 1', 'GA lane 2', 'Tables & VIP', 'Accreditation', 'Exception desk'],
    programme: [
      { time: '16:00', name: 'Sunset Arrival', text: 'Gates open. Food, drinks, photos and table settling to relaxed classics, soul, R&B and rhumba.' },
      { time: '18:00', name: 'Recognition', text: 'Familiar records build the room. The first mass sing-along lands around 6:30 PM.' },
      { time: '19:30', name: 'The Official Moment', text: 'A short welcome. No speeches.' },
      { time: '20:00', name: 'Main Peak', text: 'A journey from the 90s to the 2010s: Ugandan and East African anthems, Afrobeats, R&B, hip-hop and dancehall, plus the songs guests voted for.' },
      { time: '22:00', name: 'Afterglow', text: 'The highest-energy set of the night, then a warm close.' },
    ],
    promise: ['Entry in under 10 minutes', 'A free drinking-water point', 'Photo spots across the venue', 'Marshals on parking and the exit'],
    dress: 'Smart and stylish. No costume required.',
    terms: [
      '18+ event. Bring a valid ID; it may be checked at the gate.',
      'Every ticket is a unique QR code, scanned once. Screenshots of someone else’s ticket will not get in.',
      'Transfers are free until Thursday 10 December, from your ticket page.',
      'No refunds unless the event is cancelled or moved.',
      'Bags are searched. Prohibited items, or refusing a search, means no entry.',
      'Re-entry only with an intact wristband.',
      'Photography and filming take place on the night.',
      'Your details are used for your ticket and event updates. Offers only if you opt in.',
    ],
    tableTerms: [
      'A 50% deposit holds your table. The balance is due Saturday 5 December.',
      'Guest names are due Wednesday 9 December.',
      'Tables are transferable, not refundable.',
      'Your table is held until 8:00 PM on the night.',
      'Packages include entry and reserved seating. Food and drinks are bought on the night.',
    ],
  },

  payments: {
    // Fill these in Admin → Settings before sales open.
    mtnMerchantCode: '',
    mtnMerchantName: '',
    airtelMerchantCode: '',
    airtelMerchantName: '',
    note: 'Use your order reference as the payment reason.',
  },

  amenities: {
    gym: {
      plans: [
        { key: 'gym-day', name: 'Gym · day pass', price: 20000, period: 'day' },
        { key: 'gym-month', name: 'Gym · monthly', price: 250000, period: 'month' },
        { key: 'gym-year', name: 'Gym · annual', price: 2500000, period: 'year' },
        { key: 'gs-day', name: 'Gym & sauna · day pass', price: 30000, period: 'day' },
        { key: 'gs-month', name: 'Gym & sauna · monthly', price: 350000, period: 'month' },
        { key: 'gs-year', name: 'Gym & sauna · annual', price: 3500000, period: 'year' },
      ],
      sessions: [
        { key: 'morning', name: 'Morning', from: '07:00', to: '10:00' },
        { key: 'evening', name: 'Evening', from: '17:00', to: '22:00' },
      ],
      classes: ['Cardio Exercise', 'Body Toning', 'Spin Bike', 'Dance Fitness', 'Full Body Workout', 'Insanity Workout', 'Power Shift'], // by weekday, Sunday first
    },
    sauna: { adult: 20000, kid: 10000, capacity: 6, slots: ['07:00', '08:00', '09:00', '17:00', '18:00', '19:00', '20:00', '21:00'] },
    turf: {
      open: '07:00',
      close: '23:00',
      nightFrom: '18:00',
      dayRate: 50000,
      nightRate: 70000,
      maxHours: 3,
      daysAhead: 21,
      openSessions: [{ days: [3, 4, 5], from: '19:00', to: '23:00', label: 'Open soccer' }],
      adultPerPerson: 10000,
    },
    kids: { day: 6, withCoach: 20000, kidsOnly: 10000, time: '', weeksAhead: 6, capacity: 40 },
    quiz: {
      day: 6, time: '20:00', host: 'Dr. Young King', rounds: 5, entry: 0,
      roundPrize: 'Shots of tequila or 4 beers',
      maxTeams: 20, minSize: 2, maxSize: 6, weeksAhead: 6,
    },
    penthouse: {
      currency: 'USD',
      maxNights: 30,
      daysAhead: 240,
      packages: [
        { key: 'floor', name: 'Full floor, all balconies', price: 200, guests: 10 },
        { key: 'house', name: 'Whole house, one balcony facing the pitch', price: 150, guests: 8 },
        { key: 'two-bed', name: 'Two bedrooms and sitting room, balconies closed', price: 100, guests: 4 },
        { key: 'master', name: 'Master bedroom only', price: 80, guests: 2 },
        { key: 'small', name: 'Small room only', price: 50, guests: 2 },
      ],
    },
    table: { minParty: 1, maxParty: 30, from: '12:00', to: '21:30', daysAhead: 60 },
    bucketNight: { day: 5, offer: '5 beers for UGX 20,000' },
    loyalty: '9 sessions paid. 10th session free.',
  },
};

export const BOOKING_TYPES = {
  turf: { name: 'Turf hire', unit: 'hour' },
  gym: { name: 'Gym pass', unit: 'pass' },
  sauna: { name: 'Steam & sauna', unit: 'session' },
  penthouse: { name: 'Penthouse stay', unit: 'night' },
  kids: { name: 'Kids soccer', unit: 'session' },
  quiz: { name: 'Quiz Night team', unit: 'team' },
  table: { name: 'Table reservation', unit: 'table' },
};

const shortTime = (t) => {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 && h < 24 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')} ${ap}` : `${h} ${ap}`;
};

const shortRange = (a, b) => {
  const pa = shortTime(a), pb = shortTime(b);
  const sa = pa.slice(-2), sb = pb.slice(-2);
  return sa === sb ? `${pa.slice(0, -3)}–${pb}` : `${pa}–${pb}`;
};

/** Weekly rhythm shown on the home page; index = weekday (0 = Sunday). */
export function weekProgramme(s) {
  const a = s.amenities;
  const cls = a.gym.classes;
  const days = [];
  for (let d = 0; d < 7; d++) {
    const items = [{ kind: 'gym', text: `Gym · ${cls[d]}` }];
    for (const o of a.turf.openSessions) {
      if (o.days.includes(d)) items.push({ kind: 'turf', text: `${o.label} · ${shortRange(o.from, o.to)}` });
    }
    if (d === a.bucketNight.day) items.push({ kind: 'bar', text: `Bucket Night · ${a.bucketNight.offer}` });
    if (d === a.kids.day) items.push({ kind: 'kids', text: 'Kids soccer training' });
    if (d === a.quiz.day) items.push({ kind: 'quiz', text: `Quiz Night · ${shortTime(a.quiz.time)} · ${a.quiz.entry ? 'UGX ' + a.quiz.entry.toLocaleString('en-US') : 'free entry'}` });
    if (d === 0) items.push({ kind: 'family', text: 'Family Dinner Day' });
    days.push(items);
  }
  return days;
}
