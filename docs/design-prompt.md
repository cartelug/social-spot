# Social Spot · Master design prompt

## Backgrounds, art direction and the visual system

You are the art director and lead design engineer for **Social Spot**, a venue in Akright City, Bwebajja, Uganda. Your job is to redesign the look and feel of its website in this repository, above all its backgrounds. The site should feel like the venue at night: floodlights over the turf, a red stage glow, a guitar string pulled tight across the page. Every page must stay fast on a mid-range Android phone on mobile data and stay accessible to everyone. Nothing you do may put a ticket sale at risk.

Read the whole brief before you change anything. Where it gives a number, the number is the spec. The code in the appendix was checked in headless Chromium 141 at 1366 × 860 and 390 × 844. Adapt its class names to the codebase; keep its techniques.

---

## 1. Facts you must get right

**Venue.** Social Spot, Akright City, Bwebajja, next to Elite High School. Phone 0393 103 799. Slogan: "Everything worth leaving the house for." It has:

- a football turf hired by the hour, with day and night rates and open soccer Wednesday to Friday, 7–11 PM;
- a gym with a class every day (mornings 7–10 AM, evenings 5–10 PM);
- steam and sauna;
- a penthouse with five ways to stay, priced in USD a night;
- kids soccer on Saturdays;
- Quiz Night every Saturday at 8 PM, hosted by Dr. Young King;
- Bucket Night on Fridays and Family Dinner on Sundays.

Loyalty: 9 sessions paid, the 10th free.

**The Replay: The Year-End Edition.** Saturday 12 December 2026, gates at 4 PM, 18+, capacity 450. The pitch: "A year-end homecoming built around the songs you know word for word." The night has five chapters:

| Time | Chapter | What happens |
| --- | --- | --- |
| 16:00 | Sunset Arrival | Gates open; relaxed classics, soul, R&B and rhumba |
| 18:00 | Recognition | Familiar records build the room; the first mass sing-along |
| 19:30 | The Official Moment | A short welcome, no speeches |
| 20:00 | Main Peak | 90s to 2010s anthems: Ugandan and East African, Afrobeats, R&B, hip-hop, dancehall |
| 22:00 | Afterglow | The highest-energy set, then a warm close |

Tickets sell in a release ladder (Founders → Advance → Final → Door). Tables are Signature Lounge and VIP Reserved. Buyers pay with MTN MoMo or Airtel Money and get one QR ticket per guest.

**Prices, dates and rules come from the server** (`app.site`, editable in Admin → Settings). Never hard-code them in markup, in CSS `content`, or in images.

**Audience.** Most visitors are on phones, most of those are mid-range Android, and many are on mobile data. Many arrive from a WhatsApp link, Instagram or TikTok. They pay with mobile money, so the payment pages must feel calm and trustworthy. Staff use the admin on laptops and the door scanner on phones, in a dark and noisy entrance.

## 2. The codebase

- **Stack.** No frameworks and no runtime dependencies. Vanilla ES modules are bundled by esbuild (`npm run build`) into hashed `app.*.js` and `app.*.css` at the repo root. Never edit the built files: edit the sources and rebuild.
- **`src/styles.css`.** The whole stylesheet, with tokens at the top.
- **`src/motion.js`.** The decoration engine. It handles:
  - the topbar state and scroll progress;
  - scroll reveal (it tags groups automatically on public pages in `afterRoute`);
  - the pointer spotlight (`--mx`/`--my`) and tilt (`data-tilt`);
  - the route progress bar and view transitions;
  - focus trap and scroll lock.

  Extend it; don't build a second one.
- **`src/core.js`.** The `html` tagged templates (they escape; use `raw()` only for trusted markup), the router, the 24 px stroke icon set, dialog, toast and countdown.
- **`src/components.js`.** The pay panel, the ticket stub (`stubHtml`) and the contact fields.
- **`src/views/public.js`.** The layout (topbar, footer, mobile menu), home, The Replay, checkout, order page, single pass, Find my ticket and 404.
- **`src/views/booking.js`.** The /book hub; the turf, gym, sauna, penthouse, kids and table pages; /quiz; booking status.
- **`src/views/admin.js`, `src/views/door.js`.** The staff console and the door scanner.
- **`src/preloader.js`.** The logo-assembly preloader. It is built from real cut pieces of the logo, plays once per session, and is skipped under reduced motion.
- **`scripts/build.js`.** Builds CSS and JS, self-hosts the fonts, and writes `index.html` and `404.html`, including the inline `html,body{background:#0b0a0a}` style. It also writes `build/preview.html`, a single-file preview with the CSS inlined, so keep backgrounds as data URIs, never external URLs.
- **`assets-src/`.** Copied to `assets/` by the build:
  - `logo-1200.png` (170 KB), `logo-520.png` (44 KB), `og.png` and the icons;
  - the logo cut into parts in `parts/`: `pin.png` (94 × 131), `pick.png` (80 × 87), `peg1–3.png`, `string.png`, `swoosh.png` and the letters.
- **In-place refreshes.** The Replay re-renders every 30 s when availability changes. Order pages re-render every 15 s while a payment is waiting. Decoration must survive both without flashing or replaying its entrance. `afterRoute` already skips reveals when the path hasn't changed.
- **Browser support.** The esbuild CSS target is Chrome 80, Safari 13 and Firefox 78. Treat newer features as enhancements: put them behind `@supports`, or declare a fallback first. esbuild keeps both declarations (verified with `overflow: hidden; overflow: clip` and `100vh; 100dvh`).

## 3. Audit findings: fix these first (all measured)

| # | Finding | Evidence | Fix |
| --- | --- | --- | --- |
| 1 | Tertiary text fails contrast | `--dim` #77706c measures 3.87:1 on ink-2 and 3.63:1 on ink-3, yet it sets dates, table headers and hints | Add `--text-3: #88807c` (4.56:1 on ink-3, 5.11:1 on ink) for all text; keep `--dim` for decoration only |
| 2 | Form controls barely show | `--line-2` #3b3434 is 1.63:1 against ink. WCAG 1.4.11 needs 3:1 for the edges of inputs, chips, slots and steppers | Add `--line-control: #6b635f` (3.00:1 on ink-3, 3.37:1 on ink) for interactive boundaries; `--line` and `--line-2` stay decorative |
| 3 | Red text on dark fails | `--red` #ce2b26 is 3.76:1 on ink | Red text on dark is always `--red-hi` #f0473f (5.35:1) |
| 4 | White on bright red fails | White on `--red-hi` is 3.70:1 | Never put white text on red-hi. Hover fill is `--red-lit` #d9302a (4.77:1); active is `--red-press` #b5231f (6.51:1) |
| 5 | Two reds without roles | The logo red is #ED0621, sampled from the original artwork; the UI red is #CE2B26 | Give each a job (section 5) |
| 6 | Fixed background layers are invisible | `build.js` writes `html,body{background:#0b0a0a}` inline. The body's own background then paints over any negative z-index layer: the test sky pixel read ink, not sunset | Add `html.has-sky body { background: transparent; }`; `html` keeps the ink |
| 7 | Heavy hero image | `logo-1200.png` is 170 KB and is the largest image above the fold on the home page, a likely LCP element. WebP q90 of the same pixels is about 68 KB | Serve WebP (and AVIF if your tooling allows) with the PNG as fallback in `<picture>`. Generate them in the build or commit them to `assets-src/`. Never redraw the logo |
| 8 | Generic decoration | The current hero glow and square grid (`.hero::before/::after`) could belong to any website. They are also on `.replay-hero`, which /quiz reuses. The glow is a 900 px layer that drifts forever (desktop only since its blur was removed) | Replace them with the scenes in section 7 |

## 4. Creative concept: FLOODLIT

Social Spot after dark. The turf is lit, the stage glows red, and the songs everybody knows are about to play. The site is built from light (soft beams, haze and coloured glows) over warm black. Its graphic language comes from the logo's own shapes.

**Graphic language.** Taken from the logo and from the venue. Never redrawn.

| Source | Becomes | Rules |
| --- | --- | --- |
| The white swoosh (the guitar body) | The logo only | Never used as decoration, except the footer watermark (section 7.4), which uses the real `swoosh.png` file |
| The red string (a tapered line) | Section dividers, the active-nav underline, scroll progress, meters | Thin at the left, full weight at the right, in logo red |
| The three pegs | Marks in threes: dividers, the three how-it-works steps, loading states | A logo-red ellipse on a short stem |
| The pin (the "o" in Spot) | Location, "today" in the week grid, "you are here" | Use `assets/parts/pin.png` or a matching CSS pin; it pulses only on Find us |
| The pick (it also reads as ▶) | The Replay's symbol: a play/replay glyph, Replay CTAs, chapter bullets | Brand moments use `assets/parts/pick.png`; UI icons use a rounded play triangle drawn in the icon set's style |
| The ticket stub | Anything the visitor owns: tickets, booking codes, the home feature ticket | Perforation and punched notches, on paper colour |
| The board | Anything that lists prices, times or fixtures: the release ladder, the week grid, scoreboard facts, the ticker | Rows like slats, tabular figures |

**Principles**

1. **Light is the material.** Backgrounds are made of light (beams, haze, glows) and structure (pitch lines, LED dots), drawn with CSS and SVG. No stock photos, no video.
2. **One red, used like a stage light.** Red means "act here" or "live now". Outside the Main Peak scene and the door's deny state, red covers less than 8% of any screen.
3. **Atmosphere behind, clarity in front.** Text never sits on texture. Every scene has a calm zone where the text lives, or the text sits on an opaque surface.
4. **Calm where money moves.** Checkout, payment, order and booking forms are the quietest pages on the site.
5. **Fast is part of the look.** A three-year-old Android on 4G gets the same polish through the Lite tier (section 7.3), not a broken copy of Full.
6. **Motion has a job.** Entrances, feedback and state changes only. The few loops (the ticker, live dots, haze drift) are slow and small, and they stop under reduced motion.
7. **It could only be Social Spot.** If a section could sit on any other venue's website, it isn't finished.

## 5. Colour

Neutrals are warm (OKLCH hue 17–50). Every value below was computed, and the ratios are WCAG 2.x contrast.

| Token | Hex | OKLCH | Role |
| --- | --- | --- | --- |
| `--ink` | #0b0a0a | 14.6% 0.002 17.4 | Page canvas |
| `--ink-2` | #131111 | 18.0% 0.003 17.5 | Raised surfaces: panels, cards |
| `--ink-3` | #1b1818 | 21.3% 0.005 17.5 | Inputs, hover |
| `--ink-4` | #242020 | 24.8% 0.006 17.6 | Pressed states, meter tracks |
| `--line` | #2b2626 | 27.4% 0.007 17.6 | Decorative hairlines |
| `--line-2` | #3b3434 | 33.2% 0.010 17.7 | Decorative borders |
| `--line-control` (new) | #6b635f | 50.6% 0.012 48.5 | Edges of anything you can click or type into |
| `--paper` | #f5f2ef | 96.3% 0.005 67.8 | Text 1 (17.7:1 on ink) |
| `--muted` | #a8a19d | 71.4% 0.010 52.0 | Text 2 (7.4:1 on ink-2) |
| `--text-3` (new) | #88807c | 60.6% 0.011 48.5 | Text 3 (4.56:1 on ink-3) |
| `--dim` | #77706c | 55.0% 0.011 52.0 | Decoration only, never text |
| `--logo-red` (new) | #ed0621 | 59.7% 0.241 26.3 | Brand graphics: string, pegs, pin, pick, live dots, stage light |
| `--red` | #ce2b26 | 55.5% 0.199 27.9 | Primary fills (white text 5.25:1) |
| `--red-lit` | #d9302a | 57.9% 0.206 27.9 | Hover fill (white 4.77:1) |
| `--red-press` | #b5231f | 50.3% 0.182 27.9 | Active fill (white 6.51:1) |
| `--red-hi` | #f0473f | 64.1% 0.207 27.4 | Red text and focus rings on dark (5.35:1); never behind white text |
| `--ok` | #44c486 | 73.4% 0.145 158.3 | Success (8.5:1 on ink-2) |
| `--warn` | #f0a93e | 78.5% 0.144 73.4 | Attention (9.4:1 on ink-2) |
| `--info` | #8fb2ee | 76.0% 0.095 261.0 | Information (8.8:1 on ink-2) |

These colours are for backgrounds only, never UI, and always at low alpha:

| Light | Value | Use |
| --- | --- | --- |
| `--light` | 255 240 222 (an RGB triplet for `rgb(var(--light) / a)`) | Floodlight warm white, alpha 0.04–0.20 |
| Amber | #f0a93e | Sunset and Afterglow, alpha ≤ 0.4. Never next to a warn chip |
| Dusk plum | 150 40 70 | The Replay's dusk only, alpha ≤ 0.35 |

**Rules**

- Measure text contrast against the brightest pixel of whatever is behind it, scenes included.
- Body text needs at least 4.5:1. Text of 24 px and up, or bold text of 18.66 px and up, needs 3:1. Control boundaries and focus indicators need 3:1.
- Red on paper (the stub, the feature ticket) measures 4.71:1 with `--red`. Logo red on paper is only 4.05:1, so logo red never sets small text.
- Write colours in hex. If you use OKLCH or `color-mix()`, declare the hex first.

## 6. Type, space, shape, depth

**Families.** Manrope 400–800 for everything. IBM Plex Mono 400–600 for codes, references, timers and table numbers. Both are self-hosted (115 KB of woff2 today). Add no new family unless it replaces one, stays under 35 KB, and you write down why.

**Scale.** Sizes are fluid between 360 px and 1280 px viewports:

`clamp(MIN, calc(MIN + (MAX − MIN) × ((100vw − 360px) / 920)), MAX)`

For example, the display size is `clamp(44px, calc(44px + 72 * ((100vw - 360px) / 920)), 116px)`.

| Token | Size (px, 360 → 1280) | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- |
| display | 44 → 116 | 0.92 | −0.045em | 800 |
| h1 | 34 → 64 | 1.0 | −0.035em | 800 |
| h2 | 26 → 40 | 1.08 | −0.03em | 800 |
| h3 | 19 → 22 | 1.2 | −0.015em | 800 |
| h4 | 16 → 17 | 1.3 | −0.01em | 700 |
| lead | 17 → 20 | 1.5 | 0 | 400, `--muted` |
| body | 16 → 17 | 1.55 | 0 | 400 |
| small | 14 | 1.45 | 0 | 400–600 |
| eyebrow | 12 | 1.2 | 0.14em, uppercase | 700 |
| micro (the minimum) | 11 | 1.2 | ≥ 0.1em when uppercase | 700 |

**Type rules**

- Use tabular figures for every price, time, count and countdown.
- Use sentence case everywhere. Uppercase is only for eyebrows, the ticker and stub labels.
- Headings get `text-wrap: balance`; paragraphs get `text-wrap: pretty`.
- Keep body text to 65 characters a line or less, and never justify it.

**Display treatments**

- Solid paper.
- The home slogan's existing paper-to-stone gradient.
- Outline type (`-webkit-text-stroke`), for decoration only (the ticker, echoes), never for information.
- **The echo.** The Replay's title repeated two or three times behind itself as outlined ghosts at 6–12% opacity: the "replay" idea made visible.

**Space.** A 4 px base: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128. Sections pad `clamp(48px, 8vw, 96px)`; a showpiece scene may take up to 160 px. Content keeps its 1180 px maximum width and `--gut` gutters; scenes run full-bleed while the content stays in the container. Leave at least 64 px below any floating element inside a scene, so a clipped scene never cuts off its shadow.

**Shape.** Radii: 6 for inner chips; 10 for inputs, slots and chips; 16 for panels, cards, stubs and dialogs; 999 for buttons and pills.

**Depth.** Four levels:

- **e0:** the flat page.
- **e1:** a panel (a 1 px `--line` border and a 1 px inner highlight on top).
- **e2:** a hover lift (2–4 px up, `--shadow-2`).
- **e3:** floating (the feature ticket, stubs, dialogs; `--shadow-3`).

The red glow belongs only to the primary button on hover and to live or selected states. Frosted glass (`backdrop-filter`) goes only on the topbar, the sticky buy bar and the dialog scrim, each with a solid fallback.

## 7. The background system

### 7.1 Layer stack, back to front

| Layer | What | Notes |
| --- | --- | --- |
| L0 | Canvas | The `html` background: ink |
| L1 | Sky | One fixed, page-wide layer; only The Replay uses it |
| L2 | Scene light | Beams, glows and haze, per section |
| L3 | Scene structure | Pitch lines, LED dots, ruling, line drawings |
| L4 | Grain | One fixed texture over everything; never takes input |
| L5 | Surfaces | Panels and cards, opaque (or at least 92% alpha), so text never sits on a scene |
| L6 | Content | |
| L7 | Chrome | Topbar, sticky buy bar, menu, dialogs, toasts |

### 7.2 Intensity

| Level | Name | What it allows |
| --- | --- | --- |
| 0 | Calm | Flat ink |
| 1 | Ambient | One soft glow at alpha ≤ 0.12, or one ghosted drawing |
| 2 | Feature | Light plus structure |
| 3 | Showpiece | Several layers; may animate once |

Each page gets at most one level-3 scene. Checkout, payment, order, booking forms and Find my ticket stay at level 1 or below. Admin and the door stay at 0.

### 7.3 Delivery tiers

Every scene defines all four tiers.

| Tier | When | What it shows |
| --- | --- | --- |
| Full | `(hover: hover) and (pointer: fine)` | Everything, including blend modes and conic beams |
| Lite | Phones and coarse pointers, `navigator.connection.saveData`, or `navigator.deviceMemory <= 2` | Radial glows only: no blend modes, no conic beams, half the layers, and no fixed layers except the Replay sky |
| Still | `prefers-reduced-motion: reduce` | No flicker, drift or marquee; the sky frozen at one moment |
| Solid | `prefers-reduced-transparency: reduce`, `prefers-contrast: more`, `forced-colors: active`, print | Scenes and grain off, flat ink, borders at `--line-control`, text 2 raised to paper |

### 7.4 Scene catalogue

| Where | Scene | Light (L2) | Structure (L3) | Motion | Level |
| --- | --- | --- | --- | --- | --- |
| Home hero | **Floodlit** | Two floodlights from the top corners, horizon haze, a red stage glow behind The Replay ticket | Pitch markings laid in perspective as the floor | "Lights on": one flicker after the preloader, then still | 3 |
| Home ticker | **Perimeter board** | None | A stadium LED dot matrix | A 38 s marquee that pauses on hover and focus | 2 |
| This week | **Fixture board** | A narrow spotlight down today's column | Ruled columns; the pin marks Today | None | 1 |
| Amenity cards (home and /book) | **Line drawings** | The pointer spotlight (already built) | One ghosted drawing per card: turf corner, weight plate, steam, balcony railing, ball, plate and fork, question mark | On hover, opacity 7% → 14% and a −6° turn | 1 |
| Quiz band and /quiz | **Scoreboard** | A warm spot on the host's side | Answer-sheet ruling and a giant ghost "?" | None | 2 |
| Find us | **Night map** | A soft glow at the venue | Schematic street lines (no real geometry; label only the area and the landmark) and the logo pin | The pin pulses every 2.4 s | 1 |
| Footer | **Lights out** | One warm spot at the bottom centre | The real swoosh (`assets/parts/swoosh.png`) as a 4% watermark | None | 1 |
| The Replay page | **The night** (the sky) | Five stages tied to the scroll position, one per chapter | None | Scroll-linked colour only | 3 |
| Replay hero | **Echo** | The sky's sunset | The title's outlined echoes | The echoes settle once | (within the page's level 3) |
| Replay price board | **Departure board** | The live row lit with a red rail and a soft glow | Slats; sold-out rows struck through | The meter fills once, then shimmers | 1 |
| Replay tables | **Materials** | Signature Lounge is velvet (a deep-red radial and a fine diagonal sheen); VIP is smoked glass (a cool-neutral frost and an inner highlight) | None | None | 1 |
| Checkout, payment, order, pass, find, booking forms | **Calm** | One ambient glow, top right, alpha ≤ 0.08 | None | None | 0–1 |
| Ticket stub | **Security print** | A red foil strip on the top edge | Guilloché on the header only | One floodlight sweep when the tickets go live | n/a |
| 404 | **Offside** | One off-centre floodlight | A dashed offside line, with the copy "That page is offside." | None | 1 |
| Admin | None | | | | 0 |
| Door | **State fields** | The result panel becomes a solid, saturated green, red or amber field, readable from two metres | None | Instant (≤ 100 ms) | n/a |

How the sky maps to the chapters (`--night` is scroll progress, 0 → 1):

| `--night` | Chapter in view | Sky |
| --- | --- | --- |
| 0.00 | Sunset Arrival | Amber and red, low on the horizon |
| 0.25 | Recognition | Dusk: plum and red |
| 0.50 | The Official Moment | Dusk deepening |
| 0.75 | Main Peak | Red stage beams from above, a red floor glow |
| 1.00 | Afterglow | Near-black with one warm spot |

### 7.5 Engineering rules for backgrounds

**What to build with**

- Use CSS gradients and inline SVG data URIs first.
- No bitmap backgrounds except real photography, and no video.
- No canvas or WebGL unless a level-3 scene truly needs it. Even then, start it lazily, pause it off-screen, and skip it in Lite.

**Budgets**

- One scene: ≤ 2 KB of CSS.
- One SVG motif: ≤ 1 KB.
- All scene CSS together: ≤ 10 KB minified.

**What may animate**

- Animate only `opacity` and `transform`, plus registered custom properties that feed nothing but opacity.
- Never animate gradients, `background-position`, `box-shadow`, `filter` or blur on large areas.
- Bake softness into the gradient stops. No `filter: blur()` on layers bigger than 400 × 400 px.
- No `background-attachment: fixed`; it is janky or ignored on iOS. Use `position: fixed` layers.

**The sky and other fixed layers**

- Scroll-linked custom properties live on the background element itself, never on `:root` or `body`. An inherited property changing on the root restyles the whole page every frame.
- A fixed layer must not have a transformed, filtered or `contain: paint` ancestor, or it stops being fixed.
- Mount the sky once in the public layout, outside `[data-outlet]`, and switch it on per route with `html.has-sky`. That way it survives the 30-second refresh and view transitions.

**Scene shells**

- Style them `position: relative; isolation: isolate; overflow: hidden; overflow: clip; contain: paint`. The `hidden` is the fallback: Safari before 16 has no `clip`.
- Decorative layers are `aria-hidden="true"` and `pointer-events: none`, and they never carry information.

**Text on the sky (measured)**

Only paper text may sit directly on the sky: it measured at least 5.56:1 against the brightest pixel of every stage. Other text failed:

| Text | Measured | Where |
| --- | --- | --- |
| Muted | 2.44:1 | Over the sunset horizon |
| Red-hi | 1.68:1 | Over the sunset horizon |
| Red eyebrow | 4.44:1 | Over Main Peak |

So on the sky, eyebrows switch to paper, and all other text sits on a surface.

## 8. Photography and illustration

Never present stock photography, or AI-generated images of people or places, as Social Spot. Until real photos exist, the scenes are the imagery. Never ship grey placeholder boxes.

**Shot list to commission.** Get each in 3:2 and 4:5 crops:

1. Floodlit turf at night, wide and low, players mid-move.
2. The same turf at golden hour.
3. A morning gym class in side light.
4. Steam and sauna textures, close up.
5. The penthouse balcony at golden hour, looking over the pitch.
6. Quiz Night: teams mid-laugh, the host with a mic.
7. Family Dinner, from above.
8. Bucket Night at the bar.
9. The entrance and signage, for Find us.
10. Crowd, DJ and lights from past nights, for The Replay, if any exist.

**Treatment.** A warm grade, blacks matched to #0b0a0a, red accents welcome. Behind text, use a duotone (ink → paper) or a red monotone at ≤ 30% opacity, with a gradient scrim to ink on the side the text sits.

**Delivery.**

- Use `<picture>` with AVIF, WebP and JPEG, at widths 480, 960, 1600 and 2400.
- Keep the hero under 140 KB at 1600 w.
- Set explicit `width` and `height` on every image, and `decoding="async"`.
- Use `loading="lazy"` below the fold, and `fetchpriority="high"` on the single LCP image only.

**Illustration.** Single-weight line drawings: a 2 px stroke on a 100-unit viewBox, round caps, white at 7–14% opacity. No fills, no gradients, one drawing per card.

**Icons.** Extend the existing set in `src/core.js` (24 px, 2 px stroke, round caps). Never mix in filled icons.

## 9. Motion

| Token | Duration | Use |
| --- | --- | --- |
| press | 90 ms | Active states |
| hover | 160 ms | Colour and border changes |
| state | 240 ms | Toggles, chips, selected slots |
| enter | 400 ms | Dialogs, menus, toasts, the sticky bar |
| reveal | 700–900 ms | Scroll reveals, the hero's entrance |
| lights | 1600 ms | The floodlight sequence, once per visit |

**Easing.** `--ease-out` is cubic-bezier(.16, 1, .3, 1), for entrances. `--ease-spring` is cubic-bezier(.34, 1.56, .64, 1), for small confirmations such as chips and stamps. Use linear only for scroll-linked and marquee motion.

**Rules**

- Reveal in reading order, staggered 60–70 ms apart, with at most 8 steps.
- The hero leads and the light follows. The floodlights come on after the preloader finishes (`boot.js` calls `pre.finish()`). If the preloader was skipped this session, they come on at once. Either way, the flicker plays once per visit.
- Never animate prices, totals, payment status, hold timers or door results. The countdown's digit tick is fine. Door results are instant.
- Errors appear instantly, with no shaking.
- **Allowed loops:** the ticker, the live-dot pulse, and a haze drift slower than 0.05 Hz on desktop. All of them stop under reduced motion and when off-screen.
- **One celebration:** when an order's tickets go live, a single floodlight sweep crosses the stub (≤ 1.2 s), once.
- Route changes cross-fade with a 10 px rise while the topbar holds still (`view-transition-name: topbar`). Same-page refreshes never animate.

## 10. Components

**Buttons**

- **Primary.** A red pill with a sheen on top. On hover: `--red-lit`, a glow and one sheen sweep. Active: `--red-press`. Focus: a 2 px `--red-hi` ring at a 2 px offset.
- **Line buttons.** Use `--line-control` for the border.
- **Size and number.** Hit areas are at least 44 px, even where the visual button is smaller. Allow one primary button per band of the view.

**Topbar.** Frosted glass that shrinks after 8 px of scroll. The active link gets a short string underline (tapered, logo red) instead of a dot.

**Feature ticket (home).** A paper stub with punched notches that tilts on desktop with a soft sheen. Countdown chips are dark, the price uses tabular figures, and the CTA sits inside the ticket.

**Price board (The Replay).** Departure-board rows, with the live row lit and sold-out rows struck through. The meter is logo red. Each release's name, price and state stay legible without colour.

**Table tiers.** Velvet and smoked-glass surfaces; paper text on them must pass 4.5:1. The table picker shows numbered seats in Plex Mono.

**Ticket stub**

- A red foil strip on the top edge.
- Guilloché on the header only, plus the perforation and notches.
- The QR code on pure white, with a quiet zone of at least 4 modules. No pattern, gradient or overlay behind it.
- The code in Plex Mono.
- "Checked in" and "Void" stamps.
- It prints cleanly on white.

**Week grid.** A fixture board. Today is marked with the pin and a spotlight; events get red dots; gym classes stay muted.

**Amenity cards.** A line drawing, dotted price leaders and a line button.

**Forms**

- Inputs sit on ink-3 with `--line-control` borders.
- Focus is a paper border plus a soft 4 px halo.
- Errors get a `--red-hi` border, with a message and icon below the field.
- Selected date chips fill paper ("your choice"). Selected time slots fill red ("what you're buying"). Keep those two meanings everywhere.

**Dialogs, menu, toasts.** Keep their current behaviour (focus trap, scroll lock, Escape to close, focus returned) and the motion tokens.

**Footer.** The Lights-out scene, the logo and three columns.

**Admin.** Dense and fast: no scenes, e1 KPI cards, sticky table headers, and status pills identical to the public site's.

**Door.** The state colour field, with the verdict word at 56–72 px, readable at arm's length in the dark. Always pair an icon with a word, never colour alone. Keep the vibration.

## 11. Page notes

- **Home.** On the first 390 × 844 screen, show the logo, the slogan and both CTAs. The feature ticket overlaps the pitch floor. Then come the ticker, the week, the booking cards, the Quiz band, Find us and the footer.
- **The Replay.** The scroll follows the night:
  - the hero (echo title, date, gates, venue, countdown) sits on the sunset;
  - the tickets (board, how-it-works, tables) arrive during Recognition;
  - the night's tracklist runs as the sky passes through Main Peak;
  - terms and FAQ sit in the afterglow.

  Keep the sticky buy bar clear of the sky's brightest zones.
- **Checkout, order, pass and find.** Calm. The order page is the one place that celebrates, once.
- **/book and the booking pages.** Calm forms. The hub uses amenity cards with drawings. Each booking page's header may carry its amenity's drawing at level 1.
- **/quiz.** A Scoreboard header (stop reusing `.replay-hero`), with the facts as scoreboard tiles in Plex Mono.
- **404.** Offside.
- **/admin and /admin/door.** As in section 10.

## 12. Share surfaces

Most buyers arrive from WhatsApp, so the link preview is their first impression.

- Design a 1200 × 630 share card for The Replay: the Floodlit scene, the title with its echo, the date, "gates 4 PM", and "from UGX …" taken from settings at build time. Keep all text inside a centred 1000 × 500 safe zone.
- Design a general venue card too.
- If the repo's tooling can't render them, deliver the SVG sources and say so.
- Per-page `og:` tags need the server to serve them, because WhatsApp doesn't run JavaScript. Propose that server change; don't hack around it.

## 13. Accessibility: must pass

- Contrast as in section 5, measured over the scenes.
- A visible focus state on everything interactive, and targets of at least 44 × 44 px.
- Reduced motion, reduced transparency, more contrast and forced colours each behave as in section 7.3.
- Decorative layers and the ticker are hidden from assistive technology; the ticker's words appear elsewhere on the page.
- Colour never carries meaning alone: release states, slot states and door results all have words.
- Content reflows at 320 px with no sideways scroll, and nothing overlaps at 200% zoom.

## 14. Performance budgets

**File sizes**

| What | Budget | Today |
| --- | --- | --- |
| CSS | ≤ 60 KB minified | 51 KB (≈ 12 KB gzip) |
| JS | ≤ 250 KB minified | 230 KB (≈ 72 KB gzip) |
| Fonts | ≤ 130 KB woff2 | 115 KB |

No new runtime dependencies, and no third-party scripts or CDNs.

**On a mid-range Android over 4G**

- LCP ≤ 2.5 s, CLS ≤ 0.05, INP ≤ 200 ms.
- Scrolling stays at 60 fps with every scene on. Check with Chrome remote debugging on a real phone, or DevTools at 4× CPU throttle with Fast 4G.
- No decoration causes a long task over 50 ms.

## 15. How to work

**Phase 0: Look.**

1. Build, then start the server: `PORT=3100 ADMIN_EMAIL=admin@socialspot.test ADMIN_PASSWORD=TestPass123 npm start`. Restart it after every build. The server hashes `index.html`'s inline start-up script for its Content-Security-Policy once, at startup, and each build changes that script (it names the new hashed CSS). A stale server blocks the script, and the page loads blank.
2. Screenshot these pages at 390 × 844 and 1366 × 860: home, /replay, /replay/checkout, an order page, /book, /book/turf, /quiz, /tickets, the 404, /admin and /admin/door.
3. List the ten biggest visual problems, each with evidence.

**Phase 1: Foundations.** The tokens in sections 5 and 6, and audit fixes 1–6.

Exit when all three hold:

- A script that computes every text/background pair in section 5 passes.
- `npm run build` passes.
- `npm test` passes.

**Phase 2: Backgrounds.** Build the scene shell and the tiers first. Then build the scenes in this order: home hero, Replay sky, ticker, amenity cards, week, Quiz, Find us, footer, stub, 404, door. Exit each scene with screenshots in Full, Lite, Still and Solid.

**Phase 3: Components** (section 10).

**Phase 4: Pages** (section 11).

**Phase 5: Motion pass** (section 9).

**Phase 6: QA.**

- Check the budgets.
- Run Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- Run the browser tests on a fresh server: `python3 test/e2e.py http://localhost:3100`.
- Confirm zero console errors.
- Retake the screenshot matrix.
- Check on a real phone.

After every phase, score the work against the rubric in section 16 and fix the three weakest points before you move on.

## 16. Rubric

Ship only when every line scores 4 or 5 out of 5.

| Criterion | Means |
| --- | --- |
| Distinctive | It could only be Social Spot |
| Atmosphere | It feels like the venue at night |
| Clarity | The next action is obvious within three seconds on every page |
| Legibility | Every text passes contrast; nothing sits on texture |
| Restraint | One showpiece per page; red used like a stage light |
| Consistency | Tokens only; no one-off colours, sizes or shadows |
| Speed | Budgets met; smooth on a mid-range phone |
| Trust | Checkout and payment are calm and clear |
| Inclusion | Keyboard, screen reader, reduced motion and transparency, forced colours |

For the quality bar, look to the atmosphere of Boiler Room and Resident Advisor event pages, the confidence of Nike Football, the polish of Linear and Stripe, and the ticket clarity of DICE. Never copy their layouts or assets.

## 17. Never

- Redraw, recolour or distort the logo, or crop it, except for the footer watermark made from the real swoosh part.
- Change business rules, prices, dates or copy facts, or touch `shared/engine.js`.
- Put a pattern, gradient or overlay behind a QR code.
- Add frameworks, CDNs, trackers, third-party fonts, video backgrounds, autoplay sound, scroll-jacking, custom cursors, or parallax that moves text.
- Leave decorative elements focusable or announced.
- Use colour as the only signal.

## 18. What to hand back

1. Commits, one per phase, with clear messages.
2. `docs/design-system.md`, kept short and current: the tokens, the scene catalogue with its tiers, the motion tokens and the component rules.
3. The screenshot matrix (every page at both viewports, and every scene in all four tiers), plus the contrast check's output.
4. A short report: what changed, the measured sizes and Lighthouse scores, what you couldn't verify, and any open questions (for example, when real photography will arrive).

---

## Appendix: reference recipes

These were checked in headless Chromium 141 at 1366 × 860 and on an emulated Pixel 7:

- The native scroll-driven path and the JavaScript fallback produced identical `--night` values at every scroll position.
- The phone tier drops the conic beams.
- Reduced motion stops the flicker and freezes the sky at `--night: 0.55`.
- Forced colours hides every scene layer and the grain.

### A1 · CSS

```css
/* R0 · tokens the recipes use */
:root { --logo-red: #ed0621; --light: 255 240 222; --amber: #f0a93e; }

/* R1 · scene shell: every decorated section */
.scene { position: relative; isolation: isolate; overflow: hidden; overflow: clip; contain: paint; }
.scene > .scene-layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; }

/* R2 · Floodlit (home hero): two floodlights, horizon haze, red stage glow */
.scene-floodlit .scene-layer.light {
  background:
    radial-gradient(38% 50% at 10% -12%, rgb(var(--light) / 0.20), transparent 70%),
    radial-gradient(38% 50% at 90% -12%, rgb(var(--light) / 0.15), transparent 70%),
    conic-gradient(from 132deg at 10% -12%, transparent 8deg, rgb(var(--light) / 0.06) 18deg, rgb(var(--light) / 0.12) 26deg, rgb(var(--light) / 0.06) 34deg, transparent 44deg),
    conic-gradient(from 184deg at 90% -12%, transparent 8deg, rgb(var(--light) / 0.05) 18deg, rgb(var(--light) / 0.10) 26deg, rgb(var(--light) / 0.05) 34deg, transparent 44deg),
    radial-gradient(70% 18% at 50% 100%, rgb(var(--light) / 0.07), transparent 70%),
    radial-gradient(45% 55% at 80% 78%, rgb(206 43 38 / 0.26), transparent 72%);
}
/* lights on after the preloader: visible by default, so a script failure never leaves the lights off */
html.lights-wait .scene-floodlit .scene-layer.light { opacity: 0; }
html.lights-on .scene-floodlit .scene-layer.light { animation: lights-on 1.6s steps(1, end) both 0.2s; }
@keyframes lights-on { 0% { opacity: 0; } 18% { opacity: 0.7; } 24% { opacity: 0.15; } 34% { opacity: 1; } 100% { opacity: 1; } }

/* R3 · the turf: pitch markings in perspective as the floor of the hero */
.scene-floodlit .scene-layer.pitch {
  inset: auto -30% -4% -30%; height: 72%;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1050 680' fill='none' stroke='%23fff' stroke-width='4'%3E%3Crect x='10' y='10' width='1030' height='660'/%3E%3Cpath d='M525 10v660M10 138h165v404H10M1040 138H875v404h165M10 248h55v184H10M1040 248h-55v184h55'/%3E%3Ccircle cx='525' cy='340' r='91.5'/%3E%3Ccircle cx='525' cy='340' r='5' fill='%23fff'/%3E%3C/svg%3E") center bottom / 100% auto no-repeat;
  transform: perspective(900px) rotateX(60deg); transform-origin: 50% 100%;
  opacity: 0.16;
  -webkit-mask-image: linear-gradient(to top, #000 15%, transparent 90%); mask-image: linear-gradient(to top, #000 15%, transparent 90%);
}

/* R4 · grain: desktop gets the blend, phones a plain low-opacity tile */
.grain { position: fixed; inset: 0; z-index: 400; pointer-events: none; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
@media (hover: hover) and (pointer: fine) { .grain { opacity: 0.06; mix-blend-mode: overlay; } }

/* R5 · the string: the logo's string and three pegs as a divider that plucks when revealed */
.string { position: relative; height: 22px; color: var(--logo-red); }
.string::before { content: ''; position: absolute; left: 0; right: 0; top: 13px; height: 4px; background: currentColor; clip-path: polygon(0 40%, 100% 0, 100% 100%, 0 60%); border-radius: 0 4px 4px 0; }
.string i { position: absolute; top: 0; width: 15px; height: 11px; border-radius: 50%; background: currentColor; }
.string i::after { content: ''; position: absolute; left: 5.5px; top: 9px; width: 4px; height: 5px; background: currentColor; }
.string i:nth-child(1) { right: 15%; } .string i:nth-child(2) { right: 10%; } .string i:nth-child(3) { right: 5%; }
.string.in::before { animation: pluck 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) both; }
@keyframes pluck { 0% { transform: scaleY(1); } 12% { transform: translateY(-2.5px) scaleY(1.6); } 28% { transform: translateY(2px); } 44% { transform: translateY(-1.2px); } 62% { transform: translateY(0.6px); } 100% { transform: none; } }

/* R6 · perimeter board: stadium LED dot matrix behind the ticker */
.board-led { background: radial-gradient(circle, rgb(255 255 255 / 0.07) 0.9px, transparent 1.3px) 0 0 / 4px 4px, linear-gradient(180deg, #160f0f, #0e0b0b); border-block: 1px solid #2b2626; box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04), inset 0 -12px 24px rgb(0 0 0 / 0.5); }

/* R7 · The Replay's night: the background moves from sunset to afterglow as you scroll */
@property --night { syntax: '<number>'; inherits: true; initial-value: 0; }
html.has-sky body { background: transparent; } /* audit 6: otherwise the body paints over the sky */
html:not(.has-sky) .sky { display: none; }
.sky { position: fixed; inset: 0; z-index: -2; pointer-events: none; --night: 0; background: #0b0a0a; }
.sky > i { position: absolute; inset: 0; }
.sky .sunset { background: radial-gradient(120% 60% at 50% 105%, rgb(240 169 62 / 0.38), transparent 62%), radial-gradient(90% 55% at 50% 100%, rgb(206 43 38 / 0.45), transparent 70%), linear-gradient(180deg, #0b0a0a 30%, #1d0f0b); opacity: clamp(0, calc(1 - var(--night) * 3.3), 1); }
.sky .dusk { background: radial-gradient(100% 60% at 50% 100%, rgb(150 40 70 / 0.35), transparent 70%), radial-gradient(70% 50% at 15% 0%, rgb(206 43 38 / 0.18), transparent 70%), linear-gradient(180deg, #0b0a0f, #150b14); opacity: clamp(0, min(calc((var(--night) - 0.05) * 5), calc((0.68 - var(--night)) * 6)), 1); }
.sky .peak { background: conic-gradient(from 160deg at 22% -8%, transparent 6deg, rgb(237 6 33 / 0.22) 16deg, transparent 28deg), conic-gradient(from 176deg at 78% -8%, transparent 6deg, rgb(237 6 33 / 0.18) 16deg, transparent 28deg), radial-gradient(55% 40% at 22% 0%, rgb(237 6 33 / 0.42), transparent 70%), radial-gradient(55% 40% at 78% 0%, rgb(237 6 33 / 0.34), transparent 70%), radial-gradient(90% 55% at 50% 108%, rgb(206 43 38 / 0.5), transparent 70%), linear-gradient(180deg, #120708, #0b0a0a); opacity: clamp(0, min(calc((var(--night) - 0.5) * 5), calc((0.97 - var(--night)) * 8)), 1); }
.sky .afterglow { background: radial-gradient(55% 45% at 50% 100%, rgb(240 169 62 / 0.28), transparent 70%), radial-gradient(30% 25% at 50% 100%, rgb(255 220 180 / 0.12), transparent 70%); opacity: clamp(0, calc((var(--night) - 0.82) * 6), 1); }
@supports (animation-timeline: scroll()) {
  .sky { animation: nightfall linear both; animation-timeline: scroll(root block); }
  @keyframes nightfall { from { --night: 0; } to { --night: 1; } }
}
@media (prefers-reduced-motion: reduce) { .sky { animation: none; --night: 0.55; } }

/* R8 · amenity line drawings: one per card, bottom right, ghosted */
.amenity[data-scene] { position: relative; isolation: isolate; overflow: hidden; }
.amenity[data-scene]::after { content: ''; position: absolute; z-index: -1; right: -18px; bottom: -18px; width: 168px; height: 168px; opacity: 0.07; background: var(--motif) center / contain no-repeat; transition: opacity 0.4s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none; }
.amenity[data-scene]:hover::after { opacity: 0.14; transform: rotate(-6deg) scale(1.06); }
[data-scene='turf'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='2'%3E%3Cpath d='M100 6H6v94M6 24a18 18 0 0 0 18-18M6 66h40V100'/%3E%3Ccircle cx='70' cy='82' r='4' fill='%23fff'/%3E%3C/svg%3E"); }
[data-scene='gym'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='2'%3E%3Ccircle cx='50' cy='50' r='44'/%3E%3Ccircle cx='50' cy='50' r='33'/%3E%3Ccircle cx='50' cy='50' r='9'/%3E%3C/svg%3E"); }
[data-scene='sauna'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M30 92c-10-12 10-20 0-32s10-20 0-32M50 92c-10-12 10-20 0-32s10-20 0-32M70 92c-10-12 10-20 0-32s10-20 0-32'/%3E%3C/svg%3E"); }
[data-scene='penthouse'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='2'%3E%3Cpath d='M4 40h92M4 46h92M12 46v50M24 46v50M36 46v50M48 46v50M60 46v50M72 46v50M84 46v50M30 40V18h40v22'/%3E%3C/svg%3E"); }
[data-scene='kids'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='2'%3E%3Ccircle cx='50' cy='50' r='44'/%3E%3Cpath d='M50 32l17 12-6 20H39l-6-20zM50 32V8M67 44l22-8M61 64l14 18M39 64 25 82M33 44l-22-8'/%3E%3C/svg%3E"); }
[data-scene='dinner'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='2'%3E%3Ccircle cx='50' cy='56' r='30'/%3E%3Ccircle cx='50' cy='56' r='20'/%3E%3Cpath d='M10 30v52M6 30v12a4 4 0 0 0 8 0V30M90 30c-6 6-6 22 0 26v26'/%3E%3C/svg%3E"); }
[data-scene='quiz'] { --motif: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23fff' stroke-width='6' stroke-linecap='round'%3E%3Cpath d='M32 34a18 18 0 1 1 26 16c-6 3-8 7-8 14'/%3E%3Ccircle cx='50' cy='84' r='3' fill='%23fff'/%3E%3C/svg%3E"); }

/* R9 · ticket security print: guilloché on the stub header only, never behind the QR */
.stub-top { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='24' fill='none' stroke='%23ce2b26' stroke-width='.6' opacity='.22'%3E%3Cpath d='M0 12c15-12 15 12 30 0s15 12 30 0 15 12 30 0 15 12 30 0M0 6c15-12 15 12 30 0s15 12 30 0 15 12 30 0 15 12 30 0M0 18c15-12 15 12 30 0s15 12 30 0 15 12 30 0 15 12 30 0'/%3E%3C/svg%3E") 0 0 / 120px 24px; }

/* R10 · delivery tiers */
@media (hover: none), (pointer: coarse) { /* Lite: radial glows only */
  .scene-floodlit .scene-layer.light { background: radial-gradient(60% 45% at 15% -10%, rgb(var(--light) / 0.16), transparent 70%), radial-gradient(60% 45% at 85% -10%, rgb(var(--light) / 0.12), transparent 70%), radial-gradient(60% 50% at 70% 85%, rgb(206 43 38 / 0.22), transparent 72%); }
}
html.save-data .scene-layer, html.save-data .grain { display: none; }
@media (prefers-reduced-motion: reduce) { html.lights-on .scene-floodlit .scene-layer.light, .ticker-track, .string.in::before { animation: none; } }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active), print { .scene-layer, .sky, .grain { display: none; } }
```

### A2 · Markup

```html
<!-- home hero -->
<section class="hero scene scene-floodlit">
  <div class="scene-layer light" aria-hidden="true"></div>
  <div class="scene-layer pitch" aria-hidden="true"></div>
  <div class="wrap hero-grid">…</div>
</section>

<!-- once, in publicLayout(), outside [data-outlet] -->
<div class="sky" aria-hidden="true"><i class="sunset"></i><i class="dusk"></i><i class="peak"></i><i class="afterglow"></i></div>

<!-- divider; add '.string' to SINGLES in motion.js so it gets .in (and plucks) when it scrolls into view.
     Don't write data-reveal in markup: motion.js only watches the elements it tags itself, and an
     untagged [data-reveal] stays hidden. -->
<div class="string" aria-hidden="true"><i></i><i></i><i></i></div>

<!-- the ticker as a perimeter board -->
<div class="ticker board-led" aria-hidden="true">…</div>

<!-- amenity cards -->
<article class="amenity" data-scene="turf">…</article>
```

### A3 · JavaScript (wire into `src/motion.js` and `src/boot.js`)

```js
// motion.js · afterRoute(path, layout): pages that use the night sky
document.documentElement.classList.toggle('has-sky', layout === 'public' && path === '/replay');

// motion.js · inside the existing rAF scroll handler: fallback where scroll-driven animations are missing
const sky = document.querySelector('.sky');
if (sky && document.documentElement.classList.contains('has-sky') && !reduced() && !CSS.supports('animation-timeline: scroll()')) {
  const max = document.documentElement.scrollHeight - innerHeight;
  sky.style.setProperty('--night', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0); // on the layer, never on :root
}

// motion.js · initMotion(): Lite/Solid hints
if (navigator.connection && navigator.connection.saveData) document.documentElement.classList.add('save-data');

// boot.js · the floodlights come on when the preloader leaves, once per visit
// (boot.js already imports `html` from core.js, so don't name the element `html`)
const docEl = document.documentElement;
docEl.classList.add('lights-wait');                   // before startPreloader(); the lights stay off behind it
// … after pre.finish():
docEl.classList.replace('lights-wait', 'lights-on');
setTimeout(() => docEl.classList.replace('lights-on', 'lights-done'), 2000); // later visits to home don't flicker again
```
