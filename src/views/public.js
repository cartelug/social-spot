import { app, html, raw, icon, when, rpc, route, navigate, render, on, toast, dialog, act, errText, copyText, waShare, countdownHtml, refreshSite, formValues, busy, rootEl, linkify, absUrl } from '../core.js';
import { contactFields, payPanel, statusHead, stubHtml, kv, money, photo, hasPhoto, photoOrTile, photoNote, turfPhotoId } from '../components.js';
import { mountPhotoViewer } from '../photo-viewer.js';
import { fillQrs } from '../qr.js';
import { fmtDate, fmtTime, fmtUGX, eatStampToMs, DOW, dowOf, addDays } from '../../shared/util.js';

// ------------------------------------------------------------------ layout
const NAV = [
  ['/replay', 'The Replay', 'Tickets'],
  ['/book', 'Book', 'Turf, gym, sauna, stays'],
  ['/quiz', 'Quiz Night', 'Saturdays 8 PM'],
  ['/tickets', 'Find my ticket', 'Or booking'],
];
export function publicLayout() {
  const el = rootEl();
  if (el.dataset.layout !== 'public') {
    el.dataset.layout = 'public';
    const v = app.site.venue;
    el.innerHTML = String(html`
      ${when(app.mode === 'preview', html`<div class="preview-bar"><b>Live preview.</b> Orders and bookings made here are test data${app.me ? html` · <a href="/admin">Open admin</a>` : ''}.</div>`)}
      ${when(app.offline, () => html`<div class="preview-bar" role="status"><b>Online tickets and bookings aren’t available right now.</b> Call <a href="tel:${v.phone.replace(/\s/g, '')}">${v.phone}</a> to book.</div>`)}
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="topbar"><div class="scroll-progress" aria-hidden="true"></div><div class="wrap">
        <a class="brand" href="/" aria-label="Social Spot home"><img src="${app.assets.logoSmall}" alt="Social Spot" width="520" height="172"></a>
        <nav class="navlinks" aria-label="Main">${NAV.map(([h, t]) => html`<a href="${h}">${t}</a>`)}</nav>
        <div class="nav-actions"><a class="btn sm hide-sm" href="/replay#tickets">Get tickets</a><button class="menu-btn" data-menu aria-label="Open menu" aria-expanded="false">${icon('menu')}</button></div>
      </div></header>
      <main data-outlet id="main" tabindex="-1"></main>
      <footer class="footer"><div class="wrap footer-cta">
        <p class="h2">${v.slogan}</p>
        <div class="row"><a class="btn glow" href="tel:${v.phone.replace(/\s/g, '')}">${icon('phone')}Call ${v.phone}</a><a class="btn glass" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Elite High School Akright City Bwebajja')}" target="_blank" rel="noopener">${icon('pin')}Directions</a></div>
      </div><div class="wrap cols">
        <div><img src="${app.assets.logoSmall}" alt="Social Spot" width="520" height="172"><p>${v.area}. ${v.landmark}.</p></div>
        <div><h4>Visit</h4><ul><li>${v.area}</li><li>${v.landmark}</li><li><a href="tel:${v.phone.replace(/\s/g, '')}">${v.phone}</a></li></ul></div>
        <div><h4>Go to</h4><ul>${NAV.map(([h, t]) => html`<li><a href="${h}">${t}</a></li>`)}<li><a href="/admin">Staff login</a></li></ul></div>
      </div><div class="wrap footer-bottom"><p class="small muted">© ${new Date().getFullYear()} ${v.name}, ${v.area}.</p><button class="motion-toggle" data-motion-toggle aria-pressed="false"><span class="motion-symbol" aria-hidden="true">Ⅱ</span><span data-motion-label>Pause animations</span></button><a href="#main" class="back-top">Back to top ${icon('arrow')}</a></div></footer>`);
    el.querySelector('[data-menu]').addEventListener('click', openMenu);
    const onScroll = () => document.documentElement.classList.toggle('scrolled', window.scrollY > 12);
    // Assign once: switching between the staff and public layouts must not stack listeners.
    if (app.publicScroll) window.removeEventListener('scroll', app.publicScroll);
    app.publicScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  el.querySelectorAll('.navlinks a').forEach((a) => a.toggleAttribute('aria-current', app.path.startsWith(a.dataset.route || a.getAttribute('href'))));
  el.querySelectorAll('.navlinks a[aria-current]').forEach((a) => a.setAttribute('aria-current', 'page'));
  return el.querySelector('[data-outlet]');
}
function openMenu() {
  if (document.querySelector('.sheet')) return;
  const v = app.site.venue;
  const opener = document.activeElement;
  const appRoot = rootEl();
  const previousOverflow = document.body.style.overflow;
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Menu');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = String(html`<div class="sheet-top"><a href="/" class="brand"><img src="${app.assets.logoSmall}" alt="Social Spot"></a><button class="menu-btn" data-x aria-label="Close menu">${icon('x')}</button></div>
    <p class="eyebrow menu-eyebrow">Make a little time for a good time.</p>
    <nav>${[['/', 'Home', 'The good times start here'], ...NAV].map(([h, t, s], i) => html`<a href="${h}"><span class="menu-number">0${i + 1}</span><span>${t}<small>${s}</small></span>${icon('arrow')}</a>`)}</nav>
    <a class="btn lg block" href="/replay#tickets" style="margin-top:28px">Get Replay tickets</a>
    <div class="contact">${v.area} · ${v.landmark}<br><a href="tel:${v.phone.replace(/\s/g, '')}">${v.phone}</a></div>`);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    sheet.remove();
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = previousOverflow;
    appRoot.inert = false;
    appRoot.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'false');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key !== 'Tab') return;
    const focusable = [...sheet.querySelectorAll('a, button')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-x]') || e.target.closest('a')) close(); });
  document.addEventListener('keydown', onKey);
  appRoot.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'true');
  appRoot.inert = true;
  document.body.style.overflow = 'hidden';
  document.body.append(sheet);
  linkify(sheet);
  sheet.querySelector('[data-x]').focus();
}

const fresh = () => refreshSite();
const telHref = () => `tel:${app.site.venue.phone.replace(/\s/g, '')}`;
const fromPrice = (s) => {
  const cur = s.releases.find((r) => r.key === s.current);
  if (cur) return { label: `${cur.name} tickets`, price: cur.price };
  const next = s.releases.find((r) => r.state === 'upcoming');
  return next ? { label: `${next.name} tickets from`, price: next.price, opens: next.opens } : null;
};
function releaseNote(r, s) {
  if (r.state === 'onsale') return html`<span class="pill red">On sale</span><span class="num">${r.left} left</span>`;
  if (r.state === 'soldout') return html`<span class="pill plain">Sold out</span>`;
  if (r.state === 'ended') return html`<span class="pill plain">Ended</span>`;
  if (r.state === 'paused') return html`<span class="pill warn">Paused</span>`;
  if (r.state === 'closed') return html`<span class="pill plain">Closed</span>`;
  const i = s.releases.indexOf(r);
  const prev = s.releases[i - 1];
  if (r.doorOnly) return html`<span class="pill line">On the night</span><span>Sold online on ${fmtDate(r.opens.slice(0, 10))}, only if space remains</span>`;
  return html`<span class="pill line">Opens ${fmtDate(r.opens.slice(0, 10))}</span>${when(prev && !r.doorOnly, () => html`<span>or sooner if ${prev.name} sells out</span>`)}`;
}

// ------------------------------------------------------------------ home
route('/', async (_p, ctx) => {
  const s = await fresh();
  const ev = s.event;
  const fp = fromPrice(s);
  const today = dowOf(s.today);
  const order = Array.from({ length: 7 }, (_, i) => (today + i) % 7);
  const a = s.amenities;
  const nextQuiz = s.quizDays[0];
  const gym = a.gym;
  const plan = (k) => gym.plans.find((p) => p.key === k);
  const heroPhoto = hasPhoto('night-lanterns');
  const nightTurf = turfPhotoId(a.turf.nightFrom) === 'turf-night';
  const ticker = ['Play a little', 'Stay a little', 'Move a little', 'Make a night of it', 'Your people. Your spot.'];
  const shots = [
    ['night-lanterns', 'Lantern nights', 'The terrace after dark'],
    ['sunset-arrival', 'Golden hour', 'Sun going down over the terrace'],
    ['turf-night', 'Under the lights', `Night games from ${fmtTime(a.turf.nightFrom)}`],
    ['gym', 'The gym', 'Classes every day'],
    ['penthouse', 'Penthouse views', 'Dining space & balcony views'],
    ['quiz-sheet', 'Quiz Night', `Every Saturday, ${fmtTime(a.quiz.time)}`],
    ['main-peak', 'Big nights', `${ev.name}, ${fmtDate(ev.date, { noDow: true })}`],
    ['terrace', 'Room for your people', 'Tables, lounges & celebrations'],
    ['sauna-detail', 'Steam & sauna', 'Wellness detail · illustrative'],
    ['building-day', 'Your spot in Akright', 'Balconies above the terrace'],
    ['match-viewing', 'Match-day company', 'Football on the bar screen'],
  ].filter(([id]) => hasPhoto(id));
  return {
    title: '',
    body: html`
    <section class="hero hero-xl ${heroPhoto ? 'has-photo' : ''}">${when(heroPhoto, () => html`<div class="photo-bg kb">${photo('night-lanterns', 'wide', { mobile: 'tall', eager: true, alt: '' })}</div>`)}
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="kicker"><span class="live-dot" aria-hidden="true"></span>Your people. Your spot. <span class="kicker-location">${s.venue.area}</span></p>
          <h1 class="hero-title">${s.venue.slogan === 'Everything worth leaving the house for.' ? html`<span>Everything worth</span> <span>leaving the</span> <span class="hero-accent">house for.</span>` : s.venue.slogan}</h1>
          <p class="lead">From the first kick to the last song. Turf, fitness, food and good company — all at your spot in Akright City.</p>
          <div class="row cta-row"><a class="btn lg" href="/book">Find your thing ${icon('arrow')}</a><a class="btn lg glass" href="/replay">Explore ${ev.name} ${icon('arrow')}</a></div>
          <p class="hero-location">${icon('pin')}${s.venue.landmark} · ${s.venue.area}</p>
        </div>
        <a class="feature-ticket" href="/replay" style="text-decoration:none" aria-label="${ev.name}, ${ev.edition}, ${fmtDate(ev.date, { long: true, year: true })}">
          <div class="ticket-top"><p class="eyebrow">The next big night</p><span class="ticket-arrow" aria-hidden="true">${icon('arrow')}</span></div>
          <h2>${ev.name}</h2>
          <p class="ed">${ev.edition}</p>
          <div class="meta"><span>${fmtDate(ev.date, { long: true, longMonth: true, year: true })}</span><span>Gates open ${fmtTime(ev.gatesOpen)}</span><span>${s.venue.name}, ${s.venue.area.split(',')[0]}</span></div>
          <div class="perf"></div>
          ${when(!ev.over, () => countdownHtml(ev.startsAt))}
          <div class="foot" style="margin-top:14px">
            ${when(fp, () => html`<p class="from">${fp.label}<b class="num">${fmtUGX(fp.price)}</b>${when(fp.opens, () => html`On sale ${fmtDate(fp.opens.slice(0, 10))}`)}</p>`)}
            <span class="btn sm">Tickets ${icon('arrow')}</span>
          </div>
        </a>
      </div>
      <div class="wrap hero-bottom"><a href="${shots.length >= 4 ? '#spot-h' : '#week-h'}" class="scroll-cue"><span class="scroll-cue-icon" aria-hidden="true">↓</span>Discover your spot</a><span class="hero-index" aria-hidden="true">SPORT · SOUND · GOOD COMPANY</span><button class="motion-toggle" data-motion-toggle aria-pressed="false"><span class="motion-symbol" aria-hidden="true">Ⅱ</span><span data-motion-label>Pause animations</span></button></div>
    </section>
    <div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(() => html`<span class="marquee-set">${ticker.map((t) => html`<span>${t}</span><i>✦</i>`)}</span>`)}</div></div>

    ${when(shots.length >= 4, () => html`<section class="section gallery-sec" aria-labelledby="spot-h">
      <div class="wrap"><div class="sec-head row between"><div><p class="eyebrow red">01 / A place for your people</p><h2 class="h1" id="spot-h">Day to night.<br>One address.</h2></div>
        <p class="muted sec-aside">A turf, a gym, a terrace and a penthouse on one compound in Akright City.</p></div></div>
      <div class="gallery" role="list">${shots.map(([id, t, sub], i) => html`<figure class="shot ${i === 0 ? 'big' : ''}" role="listitem">${i >= 5 && hasPhoto(id) && app.assets.photos[id].crops.band ? photo(id, 'band', { mobile: 'tall', sizes: '(min-width: 900px) 600px, 78vw' }) : photo(id, 'tall', { sizes: i === 0 ? '(min-width: 900px) 600px, 78vw' : '(min-width: 900px) 300px, 78vw' })}<figcaption><b>${t}</b><span>${sub}</span></figcaption><button type="button" class="photo-open" data-photo-open="${id}" data-photo-title="${t}" aria-label="View ${t} photo"><span aria-hidden="true">↗</span></button></figure>`)}</div>
      <p class="wrap swipe-hint tiny dim">Swipe to explore · Tap a photo to view</p>
    </section>`)}

    <section class="section programme-section" aria-labelledby="week-h"><div class="wrap stack" style="--gap:28px">
      <div class="sec-head row between"><div><p class="eyebrow red">02 / Make it a regular thing</p><h2 class="h1" id="week-h">Your week. Sorted.</h2></div>
      <a class="btn line sm" href="/book">Book anything ${icon('arrow')}</a></div>
      <div class="week">${order.map((d, i) => html`<div class="day ${i === 0 ? 'today' : ''}">
        <header><h3>${i === 0 ? 'Today' : DOW[d]}</h3><span class="tiny dim">${fmtDate(addDays(s.today, i), { noDow: true })}</span></header>
        <ul>${s.week[d].map((it) => html`<li class="${it.kind === 'gym' ? '' : 'hl'}">${it.text}</li>`)}</ul></div>`)}</div>
    </div></section>

    <section class="section" aria-labelledby="book-h"><div class="wrap stack" style="--gap:32px">
      <div class="sec-head"><p class="eyebrow red">03 / Find your thing</p><h2 class="h1" id="book-h">A little more<br>life in your day.</h2>
      <p class="lead" style="margin-top:14px">${a.loyalty} Gym, turf and kids soccer.</p></div>
      <div class="grid cards" style="--min:300px;--gap:20px">
        ${amenityCard(nightTurf ? 'turf-night' : 'turf-day', 'Football turf', `From ${fmtUGX(a.turf.dayRate)} / hr`, 'Hire the turf by the hour for your team or your company.', [[`Day, until ${fmtTime(a.turf.nightFrom)}`, `${fmtUGX(a.turf.dayRate)} / hr`], [`Night, from ${fmtTime(a.turf.nightFrom)}`, `${fmtUGX(a.turf.nightRate)} / hr`], ['Open sessions, Wed–Fri 7–11 PM', `${fmtUGX(a.turf.adultPerPerson)} / person`]], '/book/turf', 'Book the turf')}
        ${amenityCard('gym', 'Gym', `Day pass ${fmtUGX(plan('gym-day').price)}`, `Classes every day. Mornings ${fmtTime(gym.sessions[0].from)}–${fmtTime(gym.sessions[0].to)}, evenings ${fmtTime(gym.sessions[1].from)}–${fmtTime(gym.sessions[1].to)}.`, [['Day pass', fmtUGX(plan('gym-day').price)], ['Monthly', fmtUGX(plan('gym-month').price)], ['Gym & sauna, monthly', fmtUGX(plan('gs-month').price)]], '/book/gym', 'Get a gym pass')}
        ${amenityCard('sauna-detail', 'Steam & sauna', `Adults ${fmtUGX(a.sauna.adult)}`, 'Book a slot, walk in, switch off.', [['Adults', fmtUGX(a.sauna.adult)], ['Kids', fmtUGX(a.sauna.kid)]], '/book/sauna', 'Book a session')}
        ${amenityCard('penthouse', 'Penthouse', `From ${money(Math.min(...a.penthouse.packages.map((p) => p.price)), 'USD')} / night`, 'Five ways to stay, from a single room to the full floor with every balcony.', a.penthouse.packages.slice(0, 3).map((p) => [p.name, `${money(p.price, 'USD')} / night`]), '/book/penthouse', 'Request a stay')}
        ${amenityCard('turf-day', 'Kids soccer', `From ${fmtUGX(a.kids.kidsOnly)}`, 'Saturday training on the turf.', [['With a coach', fmtUGX(a.kids.withCoach)], ['Kids only', fmtUGX(a.kids.kidsOnly)]], '/book/kids', 'Book a Saturday')}
        ${amenityCard('terrace', 'Tables & Family Dinner', 'Free to reserve', `Sundays are Family Dinner Day. Fridays are Bucket Night: ${a.bucketNight.offer}.`, [['Table reservation', 'Free'], ['Food and drinks', 'Bought on the day']], '/book/table', 'Reserve a table')}
      </div>
    </div></section>

    ${when(hasPhoto('penthouse'), () => html`<section class="section space-stories" aria-labelledby="spaces-h"><div class="wrap">
      <article class="space-story">
        <figure>${photo('building-day', 'card', { mobile: 'tall', sizes: '(min-width: 900px) 580px, 100vw' })}<figcaption>The Social Spot building, looking up from the terrace.</figcaption></figure>
        <div class="space-story-copy"><p class="eyebrow red">04 / One spot. Plenty of reasons.</p><h2 class="h1" id="spaces-h">Make a day<br>of it.</h2><p class="lead">A game on the turf. Time in the gym. A table with your people. Find us next to Elite High School in Akright City, Bwebajja, and choose the pace that suits you.</p>
          <div class="visit-tags"><span>Turf & fitness</span><span>Tables & good company</span><span>Penthouse stays</span></div>
          <a class="btn line" href="#visit-h">Plan your arrival ${icon('arrow')}</a></div>
      </article>
      <article class="space-story reverse">
        <figure>${photo('penthouse', 'card', { mobile: 'tall', sizes: '(min-width: 900px) 580px, 100vw' })}<figcaption>The penthouse dining space and balcony. The view is part of the stay.</figcaption></figure>
        <div class="space-story-copy"><p class="eyebrow red">Make yourself at home</p><h2 class="h1">Upstairs.<br>Unhurried.</h2><p class="lead">Stay a little longer. Choose a room or reserve the full penthouse floor, with space to gather and balconies overlooking Akright City.</p>
          <ul>${a.penthouse.packages.slice(0, 3).map((p) => html`<li><b>${p.name}</b> · ${money(p.price, 'USD')} / night</li>`)}</ul>
          <a class="btn line" href="/book/penthouse">Explore your stay ${icon('arrow')}</a></div>
      </article>
      <article class="space-story">
        <figure>${photo('gym', 'card', { mobile: 'tall', sizes: '(min-width: 900px) 580px, 100vw' })}<figcaption>The Social Spot gym. Cardio, strength and room to move.</figcaption></figure>
        <div class="space-story-copy"><p class="eyebrow red">Move. Unwind. Repeat.</p><h2 class="h1">A little time<br>for yourself.</h2><p class="lead">Make a workout part of your day, or book a steam and sauna session. A day pass makes it easy to start; monthly options make it a routine.</p>
          <ul><li><b>Gym day pass</b> · ${fmtUGX(plan('gym-day').price)}</li><li><b>Steam & sauna</b> · ${fmtUGX(a.sauna.adult)} per adult</li><li><b>Gym & sauna, monthly</b> · ${fmtUGX(plan('gs-month').price)}</li></ul>
          <div class="row"><a class="btn line" href="/book/gym">Choose a gym pass ${icon('arrow')}</a><a class="btn glass" href="/book/sauna">Steam & sauna ${icon('arrow')}</a></div></div>
      </article>
      ${when(hasPhoto('match-viewing'), () => html`<article class="space-story reverse">
        <figure>${photo('match-viewing', 'card', { mobile: 'tall', sizes: '(min-width: 900px) 580px, 100vw' })}<figcaption>Football on the screen inside the Social Spot bar.</figcaption></figure>
        <div class="space-story-copy"><p class="eyebrow red">Bring the whole table</p><h2 class="h1">Big screen.<br>Good company.</h2><p class="lead">Come for the football. Stay for the food, drinks and company. Reserve a table for your group and call us to check the match programme.</p>
          <a class="btn line" href="/book/table">Reserve your table ${icon('arrow')}</a></div>
      </article>`)}
    </div></section>`)}

    <section class="section band quiz-sec" aria-labelledby="quiz-h"><div class="wrap quiz-band">
      <div class="stack" style="--gap:16px"><p class="eyebrow red">Every Saturday</p><h2 class="display sm" id="quiz-h">Quiz Night</h2>
        <p class="lead">${a.quiz.rounds} rounds hosted by ${a.quiz.host}. ${a.quiz.entry ? fmtUGX(a.quiz.entry) + ' entry' : 'Free entry'}. Round winners take ${a.quiz.roundPrize.toLowerCase()}.</p>
        <div class="row"><a class="btn lg glow" href="/quiz">Register your team ${icon('arrow')}</a></div></div>
      <div class="stack" style="--gap:14px">${photo('quiz-sheet', 'band', { sizes: '(min-width: 900px) 520px, 100vw', cls: 'rounded' })}<div class="facts">
        <div><b>${fmtTime(a.quiz.time)}</b><span>Every Saturday</span></div>
        <div><b>${nextQuiz ? fmtDate(nextQuiz.date, { noDow: true }) : '—'}</b><span>Next quiz</span></div>
        <div><b class="num">${nextQuiz ? Math.max(0, nextQuiz.max - nextQuiz.teams) : '—'}</b><span>Team places left</span></div>
        <div><b>${a.quiz.minSize}–${a.quiz.maxSize}</b><span>Players per team</span></div>
      </div></div>
    </div></section>

    ${when(!ev.over, () => html`<section class="cta-band ${hasPhoto('night-crowd') ? 'has-photo' : ''}" aria-labelledby="cta-h">${when(hasPhoto('night-crowd'), () => html`<div class="photo-bg">${photo('night-crowd', 'wide', { mobile: 'tall', alt: '' })}</div>`)}
      <div class="wrap cta-grid">
        <div class="stack" style="--gap:14px"><p class="eyebrow">${s.venue.name} presents · ${fmtDate(ev.date, { long: true, longMonth: true })}</p>
          <h2 class="display glow-text" id="cta-h">${ev.name}</h2><p class="ed">${ev.edition}</p>
          <p class="lead">${ev.pitch}</p>
          <div class="row cta-row"><a class="btn lg glow" href="/replay#tickets">Get tickets ${icon('arrow')}</a><a class="btn lg glass" href="/replay">See the night</a></div></div>
        <div class="stack cta-count" style="--gap:12px"><p class="eyebrow">Gates open in</p>${countdownHtml(ev.startsAt, true)}
          ${when(fp, () => html`<p class="muted small">${fp.label} <b class="num" style="color:var(--paper)">${fmtUGX(fp.price)}</b></p>`)}</div>
      </div>
    </section>`)}

    <section class="section" aria-labelledby="visit-h"><div class="wrap split even">
      <div class="stack" style="--gap:16px"><p class="eyebrow red">Find us</p><h2 class="h1" id="visit-h">${s.venue.area}</h2><p class="lead">${s.venue.landmark}.</p>
        <div class="row"><a class="btn line" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Elite High School Akright City Bwebajja')}" target="_blank" rel="noopener">${icon('pin')}Open in Maps</a>
        <span class="copyline"><a class="btn" href="${telHref()}">${icon('phone')}${s.venue.phone}</a><button class="icon-btn" data-copy="${s.venue.phone}" aria-label="Copy phone number">${icon('copy')}</button></span></div>
        ${when(hasPhoto('entrance'), () => html`<div class="arrive">${[['entrance', 'The gate'], ['parking', 'Parking inside the gate']].map(([id, cap]) => html`<figure>${photo(id, 'card', { sizes: '(min-width: 900px) 280px, 50vw', cls: 'rounded' })}<figcaption>${cap}</figcaption></figure>`)}</div>`)}</div>
      <div class="panel stack" style="--gap:12px">
        <h3 class="h4">Weekly times</h3>
        ${kv([['Gym, mornings', `${fmtTime(gym.sessions[0].from)} – ${fmtTime(gym.sessions[0].to)}`], ['Gym, evenings', `${fmtTime(gym.sessions[1].from)} – ${fmtTime(gym.sessions[1].to)}`], ['Open soccer', 'Wed – Fri, 7 – 11 PM'], ['Quiz Night', `Saturdays, ${fmtTime(a.quiz.time)}`], ['Family Dinner', 'Sundays']])}
        <p class="hint">For anything else, call us before you set off.</p>
      </div>
    </div></section>

    <section class="section visit-help" aria-labelledby="help-h"><div class="wrap split even">
      <div class="stack" style="--gap:18px"><p class="eyebrow red">Before you set off</p><h2 class="h1" id="help-h">A good visit<br>starts here.</h2><p class="lead">Pick your activity, check the time and bring your people. Call us if you need help choosing.</p><a class="btn line" href="${telHref()}">${icon('phone')}Talk to Social Spot</a></div>
      <div class="stack" style="--gap:12px">
        <details class="faq"><summary>How do I reserve?</summary><p>${app.offline ? html`Call <a href="${telHref()}">${s.venue.phone}</a> with your activity, preferred date and group size. Our team will confirm the arrangements.` : html`Choose your activity on the <a href="/book">booking page</a>, or call our team for help with your plans.`}</p></details>
        <details class="faq"><summary>Where is the entrance?</summary><p>Find us ${s.venue.landmark.toLowerCase()}, in ${s.venue.area}. The gate and parking photos above show the arrival area. Call if you need help finding us.</p></details>
        <details class="faq"><summary>Can I come for a workout?</summary><p>A gym day pass is ${fmtUGX(plan('gym-day').price)}. Morning sessions run ${fmtTime(gym.sessions[0].from)}–${fmtTime(gym.sessions[0].to)}; evening sessions run ${fmtTime(gym.sessions[1].from)}–${fmtTime(gym.sessions[1].to)}. <a href="/book/gym">See the gym options</a>.</p></details>
        <details class="faq"><summary>What should I check for a group visit?</summary><p>Call with your date, arrival time, activity and group size. For football screenings, ask our team which matches are showing. <a href="/book/table">Table reservations</a> are free; food and drinks are bought on the day.</p></details>
        <details class="faq"><summary>Can we stay upstairs?</summary><p>Choose from the <a href="/book/penthouse">penthouse packages</a>, from ${money(Math.min(...a.penthouse.packages.map((p) => p.price)), 'USD')} per night. Contact our team to confirm the package and dates for your stay.</p></details>
      </div>
    </div></section>

    <div class="sticky-cta" data-sticky><p class="from">${ev.name}${when(fp, () => html`<b class="num">${fmtUGX(fp.price)}</b>`)}</p><div class="row" style="--gap:8px;flex-wrap:nowrap"><a class="btn line sm" href="/book">Book</a><a class="btn sm glow" href="/replay#tickets">Tickets</a></div></div>`,
    mount(root) {
      mountPhotoViewer(root, ctx);
      on(root, 'click', '[data-copy]', (b) => copyText(b.dataset.copy, b));
      const sticky = root.querySelector('[data-sticky]');
      const hero = root.querySelector('.hero');
      if (sticky && hero && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => sticky.classList.toggle('show', !es[0].isIntersecting), { threshold: 0 });
        io.observe(hero);
        ctx.onCleanup(() => io.disconnect());
      }
    },
  };
});
const CARD_SIZES = '(min-width: 1240px) 380px, (min-width: 700px) 45vw, 100vw';
function amenityCard(photoId, name, tag, text, prices, href, cta) {
  return html`<article class="amenity"><a class="amenity-media" href="${href}" tabindex="-1" aria-hidden="true">${photoOrTile(photoId, 'card', { sizes: CARD_SIZES, alt: '' })}<span class="price-tag">${tag}</span></a>${photoNote(photoId)}<h3 class="h3">${name}</h3><p class="muted small">${text}</p>
    <div class="prices">${prices.map(([k, v]) => html`<div><span>${k}</span><span>${v}</span></div>`)}</div>
    <a class="btn line sm" href="${href}">${cta} ${icon('arrow')}</a></article>`;
}

// ------------------------------------------------------------------ The Replay
// one photo per chapter of the night, in programme order (the April launch, shot from 4:30 PM to 10 PM)
const CHAPTER_PHOTOS = ['sunset-arrival', 'golden-hour', 'night-lanterns', 'main-peak', 'afterglow'];
route('/replay', async (_p, ctx) => {
  if (app.query.ref) { app.referral = app.query.ref.toUpperCase().slice(0, 12); try { sessionStorage.setItem('ss-ref', app.referral); } catch { /* ignore */ } }
  const s = await fresh();
  const ev = s.event;
  const cur = s.releases.find((r) => r.key === s.current);
  const state = { qty: 1 };
  const maxQty = cur ? Math.min(ev.maxPerOrder, cur.left) : 0;
  const payBlocked = app.mode === 'server' && !s.payments.ready;
  const firstUpcoming = s.releases.find((r) => r.state === 'upcoming');
  const notStarted = !cur && firstUpcoming && s.releases.every((r) => r.state === 'upcoming');
  const allGaGone = !cur && !notStarted && !ev.over;

  const gaBuy = () => {
    if (ev.over) return html`<div class="buy"><p class="muted">${ev.name} has happened. Thank you to everyone who came.</p></div>`;
    if (ev.paused) return html`<div class="buy"><div class="notice warn">${icon('info')}<div>Ticket sales are paused for a moment. Check back soon.</div></div></div>`;
    if (notStarted) return html`<div class="buy"><p><b>${firstUpcoming.name} tickets open ${fmtDate(firstUpcoming.opens.slice(0, 10), { long: true, longMonth: true })}.</b> Get an SMS the moment they do.</p><button class="btn" data-act="notify" data-reason="prelaunch">${icon('phone')}Notify me</button></div>`;
    if (allGaGone) return html`<div class="buy"><p><b>General admission is sold out${s.releases.some((r) => r.doorOnly && r.state === 'upcoming') ? ' until the door release on the night' : ''}.</b> Join the waitlist and we’ll SMS you if places come back.</p><button class="btn" data-act="notify" data-reason="soldout">Join the waitlist</button></div>`;
    if (payBlocked) return html`<div class="buy"><div class="notice warn">${icon('info')}<div>Online payment opens shortly. To buy now, call <a href="${telHref()}">${s.venue.phone}</a>.</div></div></div>`;
    return html`<form class="buy" data-ga>
      <div class="row between"><div><p class="label">${cur.name} · ${fmtUGX(cur.price)} each</p><p class="hint">Up to ${ev.maxPerOrder} per order. Each guest gets their own QR code.</p></div>
      <div class="stepper" role="group" aria-label="Number of tickets"><button type="button" data-step="-1" aria-label="One fewer">−</button><output data-qty aria-live="polite">1</output><button type="button" data-step="1" aria-label="One more">+</button></div></div>
      <div class="row between"><p class="total">Total<b data-total>${fmtUGX(cur.price)}</b></p><button class="btn lg" type="submit">Continue ${icon('arrow')}</button></div>
    </form>`;
  };
  const tierCard = (t) => {
    const free = new Set(t.free);
    const disabled = !s.tablesOnSale || !t.free.length || payBlocked;
    return html`<form class="panel tier" data-tier="${t.key}">
      <div class="row between top"><div><p class="eyebrow">${t.ids.length} tables · ${t.guests} guests each</p><h3 class="h3" style="margin-top:6px">${t.name}</h3></div><p class="price">${fmtUGX(t.price)}</p></div>
      <ul>${t.perks.map((p) => html`<li>${p}</li>`)}</ul>
      ${s.tablesOnSale
        ? t.free.length
          ? html`<div class="field"><span>Choose your table <em>(${t.free.length} of ${t.ids.length} left)</em></span><div class="chips wrap-chips">${t.ids.map((id) => html`<button type="button" class="chip table-chip" data-table="${id}" aria-pressed="${id === t.free[0] ? 'true' : 'false'}" ${free.has(id) ? '' : 'disabled'} aria-label="Table ${id}${free.has(id) ? '' : ', taken'}">${id}</button>`)}</div></div>
             <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Pay</legend><div class="seg">
               ${when(ev.depositOpen, html`<label><input type="radio" name="plan" value="deposit" checked><span>${ev.depositPct}% now · ${fmtUGX(Math.round((t.price * ev.depositPct) / 100))}</span></label>`)}
               <label><input type="radio" name="plan" value="full" ${ev.depositOpen ? '' : 'checked'}><span>In full · ${fmtUGX(t.price)}</span></label></div>
               ${when(ev.depositOpen, html`<small class="hint">Balance due ${fmtDate(ev.balanceDue, { long: true, longMonth: true })}.</small>`)}</fieldset>
             <button class="btn block" type="submit" ${disabled ? 'disabled' : ''}>Reserve this table ${icon('arrow')}</button>`
          : html`<p class="muted">All ${t.name} tables are taken.</p><button type="button" class="btn line" data-act="notify" data-reason="soldout" data-wants="table">Join the table waitlist</button>`
        : html`<p class="muted">${ev.over ? 'Table sales have closed.' : 'Tables go on sale with the first ticket release.'}</p>`}
    </form>`;
  };
  return {
    title: `${ev.name} · ${ev.edition}`,
    body: html`
    <section class="replay-hero ${hasPhoto('night-crowd') ? 'has-photo' : ''}">${when(hasPhoto('night-crowd'), () => html`<div class="photo-bg kb">${photo('night-crowd', 'wide', { mobile: 'tall', eager: true, alt: '' })}</div>`)}<div class="wrap split with-aside">
      <div>
        <p class="eyebrow">${s.venue.name} presents</p>
        <h1 class="display xl glow-text">${ev.name}</h1>
        <p class="ed">${ev.edition}</p>
        <div class="meta"><span>${icon('cal')}${fmtDate(ev.date, { long: true, longMonth: true, year: true })}</span><span>${icon('clock')}Gates ${fmtTime(ev.gatesOpen)}</span><span>${icon('pin')}${s.venue.name}, ${s.venue.area}</span></div>
        <p class="lead" style="margin-top:22px">${ev.pitch}</p>
        <div class="row cta-row" style="margin-top:26px"><a class="btn lg glow" href="#tickets">Get tickets ${icon('arrow')}</a><a class="btn lg glass" href="/tickets">Find my ticket</a></div>
      </div>
      <div class="stack" style="--gap:12px;align-self:end">${when(!ev.over, () => html`<p class="eyebrow">Gates open in</p>${countdownHtml(ev.startsAt, true)}`)}</div>
    </div></section>
    <div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(() => html`<span class="marquee-set">${ev.programme.map((p) => html`<span>${fmtTime(p.time)} · ${p.name}</span><i>✦</i>`)}</span>`)}</div></div>

    <section class="section" id="tickets" aria-labelledby="t-h" style="scroll-margin-top:84px"><div class="wrap stack" style="--gap:28px">
      <div class="sec-head"><p class="eyebrow red">Tickets</p><h2 class="h1" id="t-h">Prices rise as each release sells out.</h2></div>
      <div class="split">
        <div class="board">
          <div class="board-head"><h3 class="h3">General admission</h3><span class="muted small">Entry from ${fmtTime(ev.gatesOpen)} · main social floor</span></div>
          ${s.releases.map((r) => html`<div class="rel ${r.key === s.current ? 'now' : ''} ${['soldout', 'ended'].includes(r.state) ? 'past' : ''}">
            <span class="nm">${r.name}</span><span class="pr">${fmtUGX(r.price)}</span>
            <div class="st">${releaseNote(r, s)}${when(r.state === 'onsale', () => html`<span class="meter"><i style="width:${Math.max(4, Math.min(100, (r.left / Math.max(1, r.qty)) * 100))}%"></i></span>`)}</div></div>`)}
          ${gaBuy()}
        </div>
        <div class="stack" style="--gap:12px">
          <div class="panel tight stack" style="--gap:10px"><h3 class="h4">How your ticket works</h3>
            <ol class="pay-steps"><li><div>Choose tickets and pay with MTN MoMo or Airtel Money.</div></li><li><div>Enter your transaction ID. We confirm it and your QR codes appear.</div></li><li><div>Send each friend their own ticket on WhatsApp. One scan per code at the gate.</div></li></ol></div>
          <p class="hint">Lost your link? <a href="/tickets">Find my ticket</a> with your phone number.</p>
        </div>
      </div>
      ${photo('lounge-setup', 'band', { sizes: '(min-width: 1240px) 1180px, 100vw', cls: 'rounded banner' })}
      <div><h3 class="h3">Tables</h3><p class="muted" style="margin-top:6px">Reserved seating for your group, with its own entry lane.</p></div>
      <div class="grid" style="--min:320px">${s.tables.map(tierCard)}</div>
    </div></section>

    <section class="section" aria-labelledby="prog-h"><div class="wrap split">
      <div class="stack" style="--gap:22px"><div class="sec-head"><p class="eyebrow red">The night</p><h2 class="h1" id="prog-h">Five chapters, sunset to the last song.</h2></div>
        <div class="tracklist">${ev.programme.map((p, i) => { const ph = CHAPTER_PHOTOS[i] ? photo(CHAPTER_PHOTOS[i], 'square', { sizes: '(max-width: 560px) 72px, 96px', alt: '' }) : ''; return html`<div class="track ${ph ? 'has-ph' : ''}"><span class="no">${String(i + 1).padStart(2, '0')}</span><span class="tm">${fmtTime(p.time)}</span><div><h3>${p.name}</h3><p>${p.text}</p></div>${ph}</div>`; })}</div></div>
      <div class="stack" style="--gap:16px">
        <div class="panel stack" style="--gap:12px"><h3 class="h4">On the night</h3><ul class="terms">${ev.promise.map((p) => html`<li>${p}</li>`)}</ul><p class="small"><b>Dress:</b> ${ev.dress}</p></div>
      </div>
    </div></section>

    <section class="section" aria-labelledby="terms-h"><div class="wrap split even">
      <div class="stack" style="--gap:14px"><p class="eyebrow red">Before you buy</p><h2 class="h2" id="terms-h">Ticket terms</h2><ul class="terms" id="terms">${ev.terms.map((x) => html`<li>${x}</li>`)}</ul></div>
      <div class="stack" style="--gap:14px"><p class="eyebrow">Tables</p><h2 class="h2">Table terms</h2><ul class="terms">${ev.tableTerms.map((x) => html`<li>${x}</li>`)}</ul></div>
    </div></section>

    <section class="section" aria-labelledby="faq-h"><div class="wrap split">
      <div><p class="eyebrow red">Questions</p><h2 class="h2" id="faq-h" style="margin-top:8px">Good to know</h2></div>
      <div>${[
        ['How do I get my ticket?', 'Pay with MTN MoMo or Airtel Money, then enter the transaction ID from your SMS. As soon as we confirm it, your QR tickets appear on your order page. Keep that link, or find it again any time with your phone number.'],
        ['Can I buy for friends?', `Yes, up to ${ev.maxPerOrder} tickets per order. After payment, put each friend’s name on their ticket and send it to them on WhatsApp. Every ticket has its own QR code.`],
        ['Can I transfer a ticket?', `Yes, free, until ${fmtDate(ev.transferDeadline, { long: true, longMonth: true })}, from your order page. The old QR code stops working and the new holder gets a fresh one.`],
        ['How do tables work?', `Pick a table and pay a ${ev.depositPct}% deposit to hold it, then the balance by ${fmtDate(ev.balanceDue, { long: true, longMonth: true })}. Add your guests’ names by ${fmtDate(ev.guestNamesDue, { long: true, longMonth: true })}; each guest gets their own QR code.`],
        ['What time should I arrive?', `Gates open at ${fmtTime(ev.gatesOpen)} for the sunset arrival. Reserved tables are held until ${fmtTime(ev.tableHeldUntil)}.`],
        ['I can’t find my ticket', 'Use Find my ticket with the phone number you bought with and your order reference or ticket code. Still stuck? Call us.'],
      ].map(([q, a]) => html`<details class="faq"><summary>${q}</summary><p>${a}</p></details>`)}</div>
    </div></section>

    ${when(cur && !payBlocked, () => html`<div class="sticky-cta" data-sticky><p class="from">${cur.name}<b class="num">${fmtUGX(cur.price)}</b></p><a class="btn" href="#tickets">Get tickets</a></div>`)}`,
    mount(root) {
      const form = root.querySelector('[data-ga]');
      const sync = () => {
        if (!form) return;
        form.querySelector('[data-qty]').textContent = state.qty;
        form.querySelector('[data-total]').textContent = fmtUGX(state.qty * cur.price);
        form.querySelector('[data-step="-1"]').disabled = state.qty <= 1;
        form.querySelector('[data-step="1"]').disabled = state.qty >= maxQty;
      };
      sync();
      on(root, 'click', '[data-step]', (b) => { state.qty = Math.min(maxQty, Math.max(1, state.qty + Number(b.dataset.step))); sync(); });
      on(root, 'submit', '[data-ga]', (f, e) => {
        e.preventDefault();
        app.cart = { kind: 'ga', qty: state.qty, release: cur.key };
        navigate('/replay/checkout');
      });
      on(root, 'click', '[data-table]', (b) => {
        const box = b.closest('[data-tier]');
        box.querySelectorAll('[data-table]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      });
      on(root, 'submit', '[data-tier]', (f, e) => {
        e.preventDefault();
        const sel = f.querySelector('[data-table][aria-pressed="true"]');
        app.cart = { kind: 'table', tier: f.dataset.tier, tableId: sel ? sel.dataset.table : '', payPlan: (f.querySelector('input[name="plan"]:checked') || {}).value || 'full' };
        navigate('/replay/checkout');
      });
      on(root, 'click', '[data-act="notify"]', (b) => notifyDialog(b.dataset.reason, b.dataset.wants || 'ga'));
      const sticky = root.querySelector('[data-sticky]');
      const tickets = root.querySelector('#tickets');
      if (sticky && 'IntersectionObserver' in window) {
        let inView = false;
        const io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; update(); }, { threshold: 0.05 });
        io.observe(tickets);
        const update = () => sticky.classList.toggle('show', !inView && window.scrollY > 420);
        window.addEventListener('scroll', update, { passive: true });
        ctx.onCleanup(() => { io.disconnect(); window.removeEventListener('scroll', update); });
      }
      ctx.every(30000, async () => {
        const before = JSON.stringify([app.site.current, app.site.gaAvailable, app.site.tables.map((t) => t.free.length)]);
        await fresh().catch(() => {});
        const after = JSON.stringify([app.site.current, app.site.gaAvailable, app.site.tables.map((t) => t.free.length)]);
        if (before !== after && !document.activeElement.closest('form')) render(app.path, { keepScroll: true });
      });
    },
  };
});

export function notifyDialog(reason = 'soldout', wants = 'ga') {
  const pre = reason === 'prelaunch';
  return dialog({
    title: pre ? 'Get an SMS when tickets open' : 'Join the waitlist',
    body: html`<p class="muted">${pre ? 'We’ll send one message when the first release goes on sale.' : 'If places come back, we message the waitlist in the order people joined.'}</p>
      <label class="field"><span>Name</span><input name="name" required autocomplete="name"></label>
      <label class="field"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" required autocomplete="tel" placeholder="0772 123 456"></label>
      <div class="two"><label class="field"><span>How many?</span><input name="qty" type="number" min="1" max="20" value="${wants === 'table' ? 1 : 2}"></label>
      <label class="field"><span>Looking for</span><select name="wants"><option value="ga" ${wants === 'ga' ? 'selected' : ''}>General admission</option><option value="table" ${wants === 'table' ? 'selected' : ''}>A table</option></select></label></div>
      <label class="check"><input type="checkbox" name="marketing"><span>Also send me other Social Spot news<small>Optional.</small></span></label>`,
    actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: pre ? 'Notify me' : 'Join the waitlist', submit: true, handler: async (v) => {
      const r = await rpc('waitlist.join', { ...v, reason });
      toast(pre ? 'Done. We’ll text you when tickets open.' : `You’re number ${r.position} on the waitlist.`, 'ok');
    } }],
  });
}

// ------------------------------------------------------------------ checkout
route('/replay/checkout', async () => {
  const s = await fresh();
  const cart = app.cart;
  if (!cart) return { redirect: '/replay' };
  const ev = s.event;
  let lines, total, dueNow, note = '';
  if (cart.kind === 'ga') {
    const cur = s.releases.find((r) => r.key === cart.release);
    if (!cur || s.current !== cart.release) { app.cart = null; toast('Prices changed while you were choosing. Please check the new price.'); return { redirect: '/replay#tickets' }; }
    total = cur.price * cart.qty;
    dueNow = total;
    lines = [[`${cart.qty} × ${cur.name} general admission`, fmtUGX(total)]];
  } else {
    const t = s.tables.find((x) => x.key === cart.tier);
    if (!t) return { redirect: '/replay#tickets' };
    total = t.price;
    dueNow = cart.payPlan === 'deposit' ? Math.round((t.price * ev.depositPct) / 100) : t.price;
    lines = [[`${t.name} · table ${cart.tableId || 'next free'} · ${t.guests} guests`, fmtUGX(t.price)]];
    if (cart.payPlan === 'deposit') note = `Then ${fmtUGX(total - dueNow)} by ${fmtDate(ev.balanceDue, { long: true, longMonth: true })}.`;
  }
  let ref = app.referral || '';
  try { ref = ref || sessionStorage.getItem('ss-ref') || ''; } catch { /* ignore */ }
  const saved = app.buyer || {};
  return {
    title: 'Checkout',
    body: html`<section class="section"><div class="wrap stack" style="--gap:26px">
      <a href="/replay#tickets" class="btn ghost sm" style="justify-self:start">${icon('back')}Change tickets</a>
      <div><p class="eyebrow red">${ev.name} · ${fmtDate(ev.date, { year: true })}</p><h1 class="h1" style="margin-top:8px">Your details</h1></div>
      <div class="split with-aside">
        <form class="form panel" data-checkout novalidate>
          ${contactFields(saved, { marketing: false })}
          <div class="two">
            <label class="field"><span>Where did you hear about ${ev.name}?</span><select name="source"><option value="">Choose one</option>${['Instagram', 'TikTok', 'WhatsApp', 'A friend', 'Banner or flyer', 'An ambassador', 'I’m a Social Spot regular', 'Other'].map((o) => html`<option>${o}</option>`)}</select></label>
            <label class="field"><span>Referral code <em>(optional)</em></span><input name="referral" value="${ref}" autocapitalize="characters" placeholder="From an ambassador"></label>
          </div>
          <label class="field"><span>Your ${ev.name} song <em>(optional)</em></span><input name="song" maxlength="100" placeholder="The one song the DJs must play"><small class="hint">The most-requested songs land in the Main Peak.</small></label>
          <div class="stack" style="--gap:12px">
            <label class="check"><input type="checkbox" name="adult" required><span>I’m 18 or older, and so is everyone I’m buying for</span></label>
            <label class="check"><input type="checkbox" name="terms" required><span>I accept the <a href="/replay#terms" target="_blank">ticket terms</a></span></label>
            <label class="check"><input type="checkbox" name="marketing"><span>Send me Social Spot offers and event news<small>Optional. Stop any time.</small></span></label>
            <label class="check"><input type="checkbox" name="partners"><span>Share my name and number with ${ev.name} partners for their offers<small>Optional and separate. We never share your details without this tick.</small></span></label>
          </div>
          <p class="form-error" data-err aria-live="polite"></p>
          <button class="btn lg" type="submit">Continue to payment ${icon('arrow')}</button>
        </form>
        <aside class="panel stack" style="--gap:14px;align-self:start">
          <h2 class="h4">Order summary</h2>
          ${kv(lines)}
          <hr class="hr">
          ${kv([['Pay now', html`<b class="num">${fmtUGX(dueNow)}</b>`]])}
          ${when(note, html`<p class="hint">${note}</p>`)}
          <p class="hint">Your ${cart.kind === 'table' ? 'table is' : 'tickets are'} held for ${ev.holdMinutes} minutes while you pay.</p>
        </aside>
      </div></div></section>`,
    mount(root) {
      const form = root.querySelector('[data-checkout]');
      const err = form.querySelector('[data-err]');
      on(root, 'submit', '[data-checkout]', async (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        if (!v.adult || !v.terms) { err.textContent = 'Please confirm you are 18 or older and accept the ticket terms.'; return; }
        app.buyer = { name: v.name, phone: v.phone, email: v.email };
        const res = await act(f.querySelector('button[type="submit"]'), () => rpc('order.create', {
          ...cart, buyer: { name: v.name, phone: v.phone, email: v.email }, source: v.source, referral: v.referral, song: v.song,
          consents: { adult: v.adult, terms: v.terms, marketing: v.marketing, partners: v.partners },
        }), { errorEl: err });
        if (res) { app.cart = null; navigate(`/t/${res.token}`, { replace: true }); }
      });
    },
  };
});

// ------------------------------------------------------------------ order page
route('/t/:token', async ({ token }, ctx) => {
  const [s, o] = await Promise.all([fresh(), rpc('order.get', { token })]);
  const ev = o.event;
  const st = o.status;
  const what = o.kind === 'table' ? `${o.table.tierName} · table ${o.table.id}` : o.kind === 'comp' ? 'Guest pass' : `${o.qty} × ${o.releaseName} general admission`;
  const head = {
    pending_payment: ['', 'Complete your payment', `Order ${o.ref} · ${what}.`],
    expired: ['bad', 'Your hold expired', `You can still pay for order ${o.ref}. If tickets are still available we’ll confirm them; if not, we’ll call you.`],
    awaiting_verification: ['', 'Payment sent for confirmation', `We’re checking your transaction for order ${o.ref}. This page updates by itself.`],
    paid: ['ok', 'You’re in.', `${what} · ${fmtDate(ev.date, { long: true, longMonth: true })}, gates ${fmtTime(ev.gatesOpen)}. Show each QR code at the gate.`],
    deposit_paid: ['', 'Your table is held', `Pay the balance of ${fmtUGX(o.balance)} by ${fmtDate(o.balanceDue, { long: true, longMonth: true })} and every guest’s QR code goes live.`],
    cancelled: ['bad', 'This order is cancelled', `Order ${o.ref}. Questions? Call ${s.venue.phone}.`],
    rejected: ['bad', 'This order is cancelled', `Order ${o.ref}. Questions? Call ${s.venue.phone}.`],
  }[st] || ['', o.statusLabel, ''];
  const needsPay = ['pending_payment', 'expired'].includes(st) || (st === 'deposit_paid' && !o.payments.some((p) => p.status === 'submitted'));
  const waiting = st === 'awaiting_verification' || (st === 'deposit_paid' && o.payments.some((p) => p.status === 'submitted'));
  const lastPay = [...o.payments].reverse().find((p) => p.status === 'submitted');
  const isTable = o.kind === 'table';
  const share = (p) => {
    const linkTxt = app.mode === 'server' ? absUrl(`/p/${p.token}`) : `Ticket code ${p.code}`;
    return `${ev.name}: your ticket for ${fmtDate(ev.date, { long: true, longMonth: true })}, gates ${fmtTime(ev.gatesOpen)}, ${s.venue.name} ${s.venue.area}. ${linkTxt}`;
  };
  const actions = (p, i) => {
    if (p.state !== 'valid') return '';
    const btns = [html`<a class="btn line xs" href="${waShare(share(p))}" target="_blank" rel="noopener">${icon('chat')}Send on WhatsApp</a>`];
    if (app.mode === 'server') btns.push(html`<button type="button" class="btn line xs" data-copy="${absUrl(`/p/${p.token}`)}">${icon('copy')}Copy link</button>`);
    if (o.changesOpen && !isTable) btns.push(html`<button type="button" class="btn line xs" data-rename="${p.id}" data-name="${p.holder.name}">Change name</button>`);
    return html`${btns}`;
  };
  return {
    title: `Order ${o.ref}`,
    body: html`<section class="section"><div class="wrap stack" style="--gap:28px">
      ${statusHead(head[0], head[1], head[2])}
      ${when(o.flag === 'over_capacity', html`<div class="notice warn">${icon('alert')}<div>Your hold expired before payment and this release may be sold out. We’ll check your payment and call you.</div></div>`)}
      ${when(waiting && lastPay, () => html`<div class="notice">${icon('clock')}<div><b>${lastPay.method === 'airtel' ? 'Airtel Money' : 'MTN MoMo'} · <span class="mono">${lastPay.txnId}</span> · ${fmtUGX(lastPay.amount)}</b><br><span class="muted">Usually confirmed within the hour during the day. Wrong ID? <button class="link-btn" data-act="repay">Send it again</button>.</span></div></div>`)}
      <div class="split with-aside">
        <div class="stack" style="--gap:22px">
          ${when(needsPay, () => payPanel({ amount: o.nextPayment || o.balance, reference: o.ref, holdUntil: st === 'pending_payment' ? o.holdUntil : null, submitLabel: st === 'deposit_paid' ? 'Send balance for confirmation' : 'Send for confirmation' }))}
          ${when(waiting, () => html`<div data-repay hidden>${payPanel({ amount: o.nextPayment || o.balance, reference: o.ref, submitLabel: 'Send the corrected ID', id: 'repay-h' })}</div>`)}
          ${when(o.passes.length, () => html`<div class="stack" style="--gap:14px"><div class="row between"><h2 class="h3">${o.passes.length === 1 ? 'Your ticket' : `Tickets (${o.passes.length})`}</h2>${when(o.changesOpen, html`<span class="hint">Names can change until ${fmtDate(o.changeDeadline, { longMonth: true })}</span>`)}</div>
            <div class="stubs">${o.passes.map((p, i) => stubHtml(p, ev, { showActions: actions(p, i) }))}</div></div>`)}
          ${when(isTable && o.changesOpen, () => html`<form class="panel form" data-guests><div><h2 class="h3">Your guests</h2><p class="muted small" style="margin-top:4px">Add a name for each guest by ${fmtDate(o.guestNamesDue, { long: true, longMonth: true })}. Each gets their own QR code to show at the table lane. Changing a name issues a new code.</p></div>
            ${o.passes.map((p, i) => html`<div class="two"><label class="field"><span>Guest ${i + 1}${i === 0 ? ' (you)' : ''}</span><input name="n_${p.id}" value="${p.holder.name}" ${p.state === 'used' ? 'disabled' : ''}></label><label class="field"><span>Phone <em>(optional)</em></span><input name="p_${p.id}" type="tel" value="${p.holder.phone}" ${p.state === 'used' ? 'disabled' : ''}></label></div>`)}
            <p class="form-error" data-err></p><button class="btn" type="submit">Save guest names</button></form>`)}
        </div>
        <aside class="panel stack" style="--gap:14px;align-self:start">
          <div class="row between"><h2 class="h4">Order ${o.ref}</h2><span class="pill ${st === 'paid' ? 'ok' : ['cancelled', 'rejected', 'expired'].includes(st) ? 'red' : 'warn'}">${o.statusLabel}</span></div>
          ${kv([['Event', `${ev.name}, ${fmtDate(ev.date)}`], ['Gates', fmtTime(ev.gatesOpen)], ['Item', what], ['Total', fmtUGX(o.total)], ['Paid', fmtUGX(o.amountPaid)], o.balance && st !== 'pending_payment' ? ['Balance', fmtUGX(o.balance)] : null, ['Name', o.buyer.name], ['Phone', o.buyer.phone]])}
          <hr class="hr">
          <p class="hint">Save this page. You can always find it again with <a href="/tickets">Find my ticket</a> and the code <b class="mono">${o.ref}</b>.</p>
          <p class="hint">Help: <a href="${telHref()}">${s.venue.phone}</a></p>
        </aside>
      </div></div></section>`,
    async mount(root) {
      fillQrs(root);
      on(root, 'click', '[data-copy]', (b) => copyText(b.dataset.copy, b));
      on(root, 'click', '[data-act="repay"]', () => { const r = root.querySelector('[data-repay]'); r.hidden = false; r.scrollIntoView({ block: 'start' }); });
      on(root, 'submit', '[data-pay]', async (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        const r = await act(f.querySelector('button[type="submit"]'), () => rpc('order.submitPayment', { token, ...v }), { errorEl: f.querySelector('[data-err]') });
        if (r) { toast('Sent. We’ll confirm shortly.', 'ok'); render(app.path); }
      });
      on(root, 'click', '[data-rename]', (b) => renameDialog(token, b.dataset.rename, b.dataset.name));
      on(root, 'submit', '[data-guests]', async (f, e) => {
        e.preventDefault();
        const v = formValues(f);
        const changes = o.passes.filter((p) => p.state !== 'used').map((p) => ({ passId: p.id, name: v[`n_${p.id}`], phone: v[`p_${p.id}`] }));
        const r = await act(f.querySelector('button[type="submit"]'), () => rpc('order.updateHolders', { token, changes }), { errorEl: f.querySelector('[data-err]') });
        if (r) { toast('Guest names saved', 'ok'); render(app.path, { keepScroll: true }); }
      });
      if (waiting || st === 'pending_payment') {
        ctx.every(15000, async () => {
          try {
            const n = await rpc('order.get', { token });
            if (n.status !== st || n.payments.length !== o.payments.length) render(app.path, { keepScroll: true });
          } catch { /* offline: try again later */ }
        });
      }
    },
  };
});
function renameDialog(token, passId, name) {
  return dialog({
    title: 'Change the name on this ticket',
    body: html`<p class="muted small">The new holder gets a fresh QR code and the old one stops working.</p>
      <label class="field"><span>New holder’s name</span><input name="name" required value="${/^Guest \d+$/.test(name) ? '' : name}"></label>
      <label class="field"><span>Their phone <em>(optional)</em></span><input name="phone" type="tel" inputmode="tel" placeholder="0772 123 456"></label>`,
    actions: [{ label: 'Cancel', kind: 'line', value: null }, { label: 'Save', submit: true, handler: async (v) => {
      await rpc('order.updateHolders', { token, changes: [{ passId, name: v.name, phone: v.phone }] });
      toast('Ticket updated. Send them the new one.', 'ok');
      render(app.path, { keepScroll: true });
    } }],
  });
}

// ------------------------------------------------------------------ single pass
route('/p/:token', async ({ token }) => {
  const [s, r] = await Promise.all([fresh(), rpc('pass.get', { token })]);
  const ev = r.event;
  return {
    title: `${ev.name} ticket`,
    body: html`<section class="section"><div class="wrap stack" style="--gap:24px;max-width:560px;margin-inline:auto">
      <div><p class="eyebrow red">${s.venue.name} presents</p><h1 class="h1" style="margin-top:8px">${r.pass.state === 'valid' ? `See you there, ${r.pass.holder.name.split(' ')[0]}.` : 'Your ticket'}</h1>
      <p class="lead" style="margin-top:10px">${fmtDate(ev.date, { long: true, longMonth: true, year: true })} · gates ${fmtTime(ev.gatesOpen)} · ${s.venue.name}, ${s.venue.area}</p></div>
      ${stubHtml(r.pass, ev)}
      <p class="hint">Sent by ${r.order.buyerName}. Show the QR code at the ${r.pass.lane.toLowerCase()}. One scan per code.</p>
      <a class="btn line" href="/replay" style="justify-self:start">About ${ev.name}</a>
    </div></section>`,
    mount(root) { fillQrs(root); },
  };
});

// ------------------------------------------------------------------ find my ticket
route('/tickets', async () => {
  await fresh();
  return {
    title: 'Find my ticket',
    body: html`<section class="section"><div class="wrap split even">
      <div class="stack" style="--gap:14px"><p class="eyebrow red">Find my ticket</p><h1 class="h1">Lost the link? No problem.</h1>
        <p class="lead">Enter the phone number you used and any one code: your order reference (RPL-…), a ticket code (SS-…) or a booking code (SB-…).</p></div>
      <form class="panel form" data-find novalidate>
        <label class="field"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="0772 123 456"></label>
        <label class="field"><span>Order, ticket or booking code</span><input name="code" required autocapitalize="characters" spellcheck="false" class="mono" placeholder="RPL-7KQ2M9"></label>
        <p class="form-error" data-err aria-live="polite"></p>
        <button class="btn lg" type="submit">${icon('search')}Find it</button>
        <p class="hint">Still stuck? Call <a href="${telHref()}">${app.site.venue.phone}</a>.</p>
      </form></div></section>`,
    mount(root) {
      on(root, 'submit', '[data-find]', async (f, e) => {
        e.preventDefault();
        const r = await act(f.querySelector('button'), () => rpc('order.lookup', formValues(f)), { errorEl: f.querySelector('[data-err]') });
        if (r) navigate(r.kind === 'order' ? `/t/${r.token}` : r.kind === 'pass' ? `/p/${r.token}` : `/b/${r.token}`);
      });
    },
  };
});

route('/404', async () => {
  await fresh();
  return { title: 'Not found', body: html`<section class="section"><div class="wrap stack" style="--gap:16px"><p class="eyebrow red">404</p><h1 class="h1">That page isn’t here.</h1><p class="lead">The link may be old or mistyped.</p><div class="row"><a class="btn" href="/">Home</a><a class="btn line" href="/tickets">Find my ticket</a></div></div></section>` };
});
