# Social Spot · website, The Replay tickets and bookings

One app for Social Spot, Akright City, Bwebajja:

- **Public website**: home with the logo-assembly preloader, the weekly programme, amenities and prices, Quiz Night, find-us.
- **The Replay ticketing**: Founders → Advance → Final → Door release ladder (prices rise as each sells out; unsold tickets roll into the next release), Signature Lounge and VIP tables with 50% deposits, a 30-minute hold while people pay, MTN MoMo / Airtel Money payment with transaction-ID confirmation, unique QR tickets, guest naming and transfers with re-issued codes, find-my-ticket, waitlist and pre-launch “notify me”, ambassador referral codes, song requests.
- **Door**: live camera QR scanning per lane, one scan per code, duplicate and old-code blocking, balance-due and unpaid checks, a hard stop at capacity (450), exception-desk lookup, door sales, and a CSV guest list for backup.
- **Venue bookings**: turf by the hour (day/night rates, open sessions blocked), gym passes, steam & sauna slots with capacity, penthouse stays (no double-booked nights), kids soccer Saturdays, Quiz Night team registration (unique names, team cap), table reservations.
- **Admin**: dashboard, payments to confirm, orders, tables board, guest passes (named, per group, ceiling 100), bookings, customers with consent choices and CSV exports, waitlist, ambassadors and commission, messages (SMS through Africa’s Talking or one-tap WhatsApp), settings for every price, date and rule, staff logins (admin or door), and JSON backups.

No frameworks and no runtime dependencies: Node 22.13+ and its built-in SQLite.

## What's in this folder

The website sits at the top of the folder (`index.html`, `404.html`, `config.js`, `app.*.js`, `app.*.css`, `assets/`, `fonts/`, `vendor/`), already built. The server that sells tickets and runs the staff area is in `server/`. It serves that same website, and it never serves its own code or data.

## Run it

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm start
# → http://localhost:3000   (staff: http://localhost:3000/admin)
```

The website files are already built. Run `npm install && npm run build` only after editing `src/`, `shared/` or `assets-src/`. The build never overwrites your `config.js`.

## Go-live checklist (Founders opens Mon 12 Oct)

1. Deploy (below) with `PUBLIC_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. Sign in at `/admin` → **Settings → Payments**: add the MTN MoMo and/or Airtel Money merchant codes. Ticket sales stay closed until at least one is set.
3. **Settings → Ticket sales**: check release dates, quantities and prices. Founders opens automatically at midnight on 12 Oct; “Open a release early” overrides that.
4. **Staff logins**: create a door login for each scanning phone.
5. Buy one ticket yourself with a small real payment, confirm it in **Payments to confirm**, scan it at **Door**, then undo the check-in.
6. Optional: add Africa’s Talking keys so confirmations and ticket links go out by SMS automatically.

## How payments work

Buyers pay a Social Spot merchant code with MTN MoMo or Airtel Money, using their order reference as the reason, then type the transaction ID. It lands in **Payments to confirm**; staff check it against the merchant statement and tap **Confirm**. Tickets go live instantly and the buyer’s page updates on its own. A transaction ID can only ever pay for one order. Wrong IDs are rejected with a message asking the buyer to resubmit; their tickets stay held for 24 hours. One phone number can hold at most two unpaid orders at a time, so nobody can sit on stock they never pay for.

## On the night

- Every scanning phone opens `/admin/door`, picks its lane (GA 1, GA 2, Tables & VIP, Accreditation, Exception desk) and taps **Start scanning** (HTTPS needed for the camera).
- Green **Admit**, red **Already in / Old code / Not found / Capacity reached**, amber **Not paid / Balance due** (send to the exception desk).
- Run the exception desk on an **admin** login: it uses **Guest lookup** (name, phone, RPL- or SS- code), confirms late payments and takes table balances (Open order → Record payment). Door logins scan, look guests up and sell at the door.
- Download the guest list CSV in the morning as an offline backup.

## Deploy

Tickets, bookings and the staff area need the Social Spot server running somewhere with a disk for its database. Pick one setup.

### A · One service (simplest)

Push this folder to GitHub → Render → New → Blueprint → pick the repo. `render.yaml` creates the service with a persistent disk. Fill in `PUBLIC_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. The server shows the website at its own address (and on your domain once you point it there). A persistent disk needs a paid instance; without one the database is wiped on every deploy.

### B · Website on GitHub Pages, server on Render

Same repo, two hosts:

1. Run the server as in A. Note its address, e.g. `https://social-spot.onrender.com`.
2. In `config.js`, set `api: 'https://social-spot.onrender.com'` and commit.
3. GitHub → repo → Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`. The site appears at `https://<user>.github.io/<repo>/`, and deep links such as ticket pages work through `404.html`.
4. On the server, set `PUBLIC_URL` to the Pages address (e.g. `https://cartelug.github.io/social-spot`) so ticket links in messages open the website.

GitHub Pages on its own (no `api`) shows the whole website with a “call us to book” notice, and the staff area explains how to connect the server. Nothing is sold or booked until the server is connected.

Staff logins work across the two domains: sign-in returns a token that the browser sends with each staff request, never a cookie.

**Railway / Fly.io**: deploy with the `Dockerfile`, mount a volume at `/data`.

**Any VPS**: install Node 22, copy the folder, run `npm start` under pm2 or systemd behind nginx with HTTPS, and set `DATA_DIR` to a backed-up folder.

Run **one** server process per database file.

## Data and backups

Everything lives in `DATA_DIR/socialspot.db` (SQLite). **Settings → Backup** downloads all records as JSON. Copy the database file too before the event.

## Environment

See `.env.example`. `PUBLIC_URL` (ticket links in SMS), `DATA_DIR`, `PORT`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` (first admin), `SESSION_SECRET`, `AT_USERNAME`/`AT_API_KEY`/`AT_SENDER_ID`/`AT_SANDBOX` (SMS), `TRUST_PROXY`.

## Code map

| Path | What it is |
| --- | --- |
| `shared/engine.js` | All business rules (tickets, tables, holds, capacity, door, bookings, exports). Runs on the server and in the live preview. |
| `shared/catalog.js` | Default prices, dates, programme and terms (all editable in Settings). |
| `server/` | HTTP server, SQLite store, staff auth, SMS sender. |
| `src/` | Front end (views, styles, QR scanner, preloader). |
| `scripts/build.js` | Builds the website files at the top of the folder and the single-file preview. |
| `scripts/extract_logo.py` | Cuts the supplied logo into its parts for the preloader without redrawing anything; the parts recompose the original pixel for pixel. |
| `test/` | `npm test` runs the engine tests. Browser tests expect a fresh server on port 3100 (`PORT=3100 ADMIN_EMAIL=admin@socialspot.test ADMIN_PASSWORD=TestPass123`, empty `DATA_DIR`): run `python3 test/e2e.py http://localhost:3100`, then start `node test/pages-emulator.mjs 3300 social-spot http://localhost:3100` and `node test/pages-emulator.mjs 3301 social-spot` and run `python3 test/static_host.py`. |

Staff passwords are hashed with scrypt, staff sessions are signed tokens that expire after 14 hours, public actions are rate-limited, and exports neutralise spreadsheet formulas.
