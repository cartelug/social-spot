# Social Spot — typography and motion upgrade

## Audit and plan

The existing site already had working booking and ticketing rules, venue photography,
a gallery, and a logo assembly. Its public typography used the same Manrope family
as the operational screens; supporting information was often small, the opening
copy was dense, and the 2.5-second intro delayed entry. The desktop booking grid
also became narrow at wide viewport sizes.

The plan was to establish a distinct public identity, simplify the first screen,
improve the size hierarchy and spacing, add coordinated motion, and preserve the
business logic and the real venue imagery. The existing black/red identity and
original logo are retained.

## Implementation

- Self-hosted Barlow Condensed headlines with DM Sans text, navigation and forms.
  Font licenses ship with the files. Staff screens retain Manrope.
- Reworked hero, event ticket, cream ticker, photo captions, programme, three-column
  desktop amenities grid, booking cards, footer and numbered mobile menu.
- Shortened original-logo assembly (1.45-second nominal sequence), curtain exit,
  Skip intro button, Escape handling, session memory and 4.5-second exit failsafe.
- Staggered hero/page entrances, finite photo zoom, photo-mask reveals, scroll
  reveals, hover response, ticket tilt, animated navigation and scroll progress.
- Pause/resume controls and native reduced-motion support. No scroll interception,
  perpetual JavaScript frame loop, animation dependency or new runtime dependency.
- Route-owned motion observers and listeners are cleaned up on navigation.
- Mobile-menu focus containment, Escape dismissal, background scroll locking,
  focus restoration and correct expanded/active navigation states.
- Skip-to-content link and keyboard-visible reveal targets.

## Validation

- Production build succeeds; generated, content-hashed JS/CSS and HTML are committed.
- All 27 existing engine tests pass (bookings, tickets, payments, capacity, access).
- Browser checks cover 320, 390, 768, 1024 and 1440px home layouts.
- Ten public routes checked at 390 and 1440px, including all six booking types,
  Replay, Quiz Night and ticket lookup; no horizontal overflow or JavaScript errors.
- Font/photo requests, once-per-session intro, Skip intro, pause/resume,
  reduced-motion, menu Escape/focus and subpath active navigation checked.

## Hosting note

The checked-in `config.js` has no API URL. On GitHub Pages the existing brochure
fallback therefore displays the venue and asks visitors to call for bookings.
This design change does not configure a production payment or booking server.
