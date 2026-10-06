# Social Spot · website prompts

Two prompts you can paste into any capable AI model (Claude, etc.).

- **Prompt 1** tells the model to study the Social Spot website, then write a full brief for it.
- **Prompt 2** is that full brief, already written from this codebase. Use it as it is to build, rebuild or extend the site.

---

## Prompt 1 · Analyse the website, then write the master prompt

```text
You are a senior product designer, front-end engineer and conversion copywriter.
Your job has two stages. Do stage 1 completely before you start stage 2.

CONTEXT
Social Spot is a venue in Akright City, Bwebajja (Entebbe Road, Uganda), next to
Elite High School. It has a football turf, a gym with daily classes, steam and sauna,
a penthouse to rent, kids soccer on Saturdays, Quiz Night every Saturday at 8 PM,
Family Dinner on Sundays and Bucket Night on Fridays. Its flagship event is
"The Replay — The Year-End Edition" on Saturday 12 December 2026 (gates 4 PM,
capacity 450). Tickets are paid with MTN MoMo / Airtel Money merchant codes and
confirmed with a transaction ID. Most visitors are on mid-range Android phones on
mobile data.

I will give you: [the live URL and/or the repository / source files / screenshots].

STAGE 1 — ANALYSE (write this up under clear headings)
1. Inventory: every public page and route, every staff page, and what each one is for.
2. Audience and jobs-to-be-done: who arrives (ticket buyers, gym members, turf teams,
   quiz teams, families, penthouse guests, door staff, admins) and what each must get done.
3. Brand and visual system: colours, type, spacing, radii, components, motion, tone of
   voice. Note what is distinctive and must be kept (e.g. the logo assembly preloader,
   the perforated ticket stubs, the release price ladder).
4. Conversion audit of the ticket funnel (home → The Replay → checkout → pay → QR
   tickets) and of each booking flow: count the taps, list every point of friction or
   doubt, and every trust signal that is missing.
5. Mobile and performance: layout at 360px, tap-target sizes, bundle sizes, image
   weights, fonts, what blocks first paint, behaviour on a slow 3G connection.
6. Accessibility: contrast, focus order, keyboard use, labels, motion preferences,
   screen-reader announcements for live changes (timers, prices, payment status).
7. SEO and sharing: titles, descriptions, Open Graph image, structured data
   (Event, LocalBusiness, Offer), WhatsApp link previews.
8. Reliability: offline/slow states, error messages, what happens when the server is
   unreachable, duplicate submissions.
9. Competitive benchmark: compare with 3–5 strong event-ticketing and venue sites
   (local Ugandan ticketing platforms and international ones). Say what they do
   better and what Social Spot already does better.
10. Ranked opportunities: a table of improvements with impact (H/M/L), effort (H/M/L)
    and the evidence for each.

STAGE 2 — WRITE THE MASTER PROMPT
Using only what you learned in stage 1, write ONE self-contained prompt that another
AI engineer could follow, with no other context, to produce the best possible
version of the Social Spot website. It must include:
- Role, goal and success measures (ticket conversion, bookings, speed targets).
- The venue facts, prices, dates and rules exactly as found (mark anything uncertain).
- Brand system: tokens (colours, type scale, radii, shadows, motion curves) and the
  rules for using them.
- Page-by-page specification: purpose, sections in order, copy direction, states
  (loading, empty, sold out, paused, error, offline), and interactions.
- Ticketing and payment rules, and the door/admin requirements, written as acceptance
  criteria.
- Technical constraints (keep whatever the current stack requires; name budgets for
  JS, CSS, images and fonts; target browsers).
- Accessibility, SEO and performance requirements as a checklist.
- What must NOT change.
- The order to work in, and how to verify each step (tests, screenshots, Lighthouse).
Write the master prompt in a single fenced code block so it can be copied in one go.
```

---

## Prompt 2 · The master prompt for the Social Spot website

```text
ROLE
You are a senior front-end engineer and product designer. You are improving the
Social Spot website: the public site, The Replay ticketing, venue bookings, the door
scanner and the admin console. Work in the existing codebase. Ship changes that are
fast on mid-range Android phones over mobile data, beautiful on a laptop, and never
break a ticket sale.

SUCCESS MEASURES
- A first-time visitor on a phone can buy Replay tickets in under 60 seconds of
  their own time (excluding the mobile-money payment itself).
- Largest Contentful Paint under 2.5 s on a throttled 4G Moto G-class device;
  no layout shift from fonts or images; no horizontal scroll at 360px.
- Every flow works with a keyboard and a screen reader, and with reduced motion.
- Zero console errors. `npm test` and the browser tests in `test/` still pass.

THE VENUE (facts to keep exact; all prices and dates are editable in admin Settings)
- Social Spot, Akright City, Bwebajja — next to Elite High School. Phone 0393 103 799.
  Slogan: "Everything worth leaving the house for."
- Football turf by the hour: day rate until 6 PM, night rate after; open sessions
  Wed–Fri 7–11 PM per person (those hours cannot be hired).
- Gym: classes every day, mornings and evenings; day pass, monthly, gym + sauna monthly.
- Steam & sauna: timed slots with capacity; adult and kid prices.
- Penthouse: five packages priced in USD per night; no double-booked nights.
- Kids soccer on Saturdays (with a coach / kids only).
- Quiz Night every Saturday 8 PM: team registration, unique team names, team cap.
- Family Dinner on Sundays; Bucket Night on Fridays; free table reservations.
- Loyalty: 9 sessions paid, 10th free.

THE REPLAY — THE YEAR-END EDITION
- Saturday 12 December 2026, gates 4 PM, capacity 450, 18+.
- GA release ladder: Founders → Advance → Final → Door. Each release opens on its date
  or sooner when the previous one sells out; unsold tickets roll forward. Founders
  opens Monday 12 October.
- Tables: Signature Lounge and VIP Reserved, chosen by table number, with a 50%
  deposit option and a balance due date; each guest gets their own QR code.
- Checkout holds stock for 30 minutes. Payment: buyer pays an MTN MoMo or Airtel
  Money merchant code using the order reference as the reason, then types the
  transaction ID; staff confirm it; QR tickets appear on the order page by themselves.
- One transaction ID pays one order; at most two unpaid orders per phone number.
- Free name changes/transfers until the deadline; a transfer voids the old QR.
- Waitlist, pre-launch "notify me", ambassador referral codes (?ref=CODE), song requests.
- Door: per-lane camera QR scanning, one scan per code, duplicate/old-code blocking,
  amber for unpaid or balance due, hard stop at capacity, exception desk, CSV backup.

BRAND SYSTEM (keep it; refine, don't replace)
- One dark world: ink #0b0a0a ground, paper #f5f2ef type, one signal red #ce2b26
  (hover #f0473f) taken from the logo; status colours ok #44c486, warn #f0a93e.
- Type: Manrope 400–800 for everything, IBM Plex Mono for codes, references, timers.
  Big, tight, heavy headings (letter-spacing about -0.04em); sentence case.
- Shapes: pill buttons, 16px panel radius, perforated ticket stubs with punched
  notches, price boards and fixture grids — a venue noticeboard after dark.
- Motion: the logo-assembly preloader (built from cut pieces of the real logo, shown
  once per session), scroll reveals, a ticker band, a tilting feature ticket,
  spotlight hover on cards, view transitions between pages. Curves:
  ease-out cubic-bezier(.16,1,.3,1), spring cubic-bezier(.34,1.56,.64,1).
  Everything must switch off under prefers-reduced-motion.
- Voice: short, warm, direct, local. Prices always as "UGX 35,000". Say what happens
  next ("We confirm it and your QR codes appear").

PAGES (each needs loading, empty, error, offline and sold-out/paused states)
1. Home: logo + slogan hero with The Replay feature ticket (live countdown, current
   price, CTA); ticker of amenities; "This week" seven-day grid starting today;
   bookable amenity cards with prices; Quiz Night band with next date and places
   left; Find us with Maps link, tap-to-call and weekly times.
2. The Replay: hero with date, gates and venue; countdown; release price board with
   the live release highlighted and a sold-meter; quantity stepper and total; table
   tiers with table picker and deposit/full choice; "how your ticket works" steps;
   the night's programme as a tracklist; promise, dress code; ticket and table terms;
   FAQ; sticky mobile buy bar that hides when the ticket section is on screen.
3. Checkout: contact fields, source, referral, song; 18+ and terms consent required;
   separate optional marketing and partner consents; order summary with hold notice.
4. Order page (/t/:token): status header, payment panel with merchant codes, copy
   buttons and hold timer; resubmit wrong ID; QR ticket stubs with WhatsApp send,
   copy link and rename; guest names for tables; auto-refresh while waiting.
5. Single pass (/p/:token), Find my ticket (/tickets), booking pages (/book/*),
   booking status (/b/:token), Quiz Night (/quiz), 404.
6. Staff: /admin (dashboard KPIs, payments to confirm, orders, tables board, guest
   passes, bookings, customers + consent + CSV, waitlist, ambassadors, messages,
   settings, staff logins, backups) and /admin/door (lane picker, camera, big
   green/red/amber result, inside count, guest lookup, door sales).

TECHNICAL CONSTRAINTS
- No frameworks, no runtime dependencies. Node 22.13+ with built-in SQLite on the
  server; vanilla ES modules bundled by esbuild (`npm run build`) into hashed
  app.*.js / app.*.css at the repo root. Edit src/, shared/, assets-src/ — never the
  built files by hand.
- Templates go through the escaping html`` helper in src/core.js; never inject raw
  user text. Business rules live in shared/engine.js and must not move into views.
- The site must keep working at a domain root and under /repo/ on GitHub Pages, and
  must fall back to a "call us to book" brochure when the server is unreachable.
- Budgets: site JS ≤ 250 KB minified, CSS ≤ 60 KB, fonts self-hosted woff2 with
  font-display: swap, no third-party scripts, no layout shift.
- Browser targets: Chrome 80+, Safari 13+, Firefox 78+. Use progressive enhancement
  for newer features (View Transitions, ::details-content, backdrop-filter).

ACCESSIBILITY · SEO · PERFORMANCE CHECKLIST
- Visible focus everywhere; modals and the mobile menu trap focus, lock page scroll,
  close on Escape and return focus to the opener.
- Live regions for toasts, payment status and form errors; labels on every input;
  44px minimum tap targets; text contrast at least 4.5:1.
- Per-page <title> and description; Open Graph image; JSON-LD for Event (with Offers
  per release) and LocalBusiness; robots.txt keeps /admin, /t/, /p/, /b/ out.
- Tickets print cleanly on white paper.

DO NOT CHANGE
- Payment and confirmation rules, hold times, capacity, the release ladder logic,
  QR code format, anything in shared/engine.js without a matching test.
- The logo artwork (only ever use the supplied files or cut parts of them).

HOW TO WORK
1. Read README.md, src/core.js, src/views/*.js, src/styles.css, shared/catalog.js.
2. Make one improvement at a time. After each: `npm run build`, `npm test`, start the
   server (`PORT=3100 ADMIN_EMAIL=admin@socialspot.test ADMIN_PASSWORD=TestPass123
   npm start`) and run `python3 test/e2e.py http://localhost:3100`.
3. Screenshot home, The Replay, checkout, an order page, a booking page, admin and
   door at 390px and 1366px. Check there is no sideways scroll and no console error.
4. Summarise what changed, what you verified, and anything you could not verify.
```
