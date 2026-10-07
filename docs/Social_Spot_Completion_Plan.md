# Social Spot - Website Completion Blueprint

Version 2.0 | 07 October 2026 | 128 pages

This document distinguishes audited implementation, proposed work, owner decisions and acceptance evidence.


## Page 001 - Social Spot completion blueprint

*Reading guide*

128 pages of product, engineering and visual production specifications.

Delivery owner: product lead and engineer.

Evidence: Repository: cartelug/social-spot


## Page 002 - The completion decision

*Reading guide*

The next release must make the venue easier to understand while preparing a dependable path to online reservations.

Social Spot already has a designed public site, authentic venue imagery, a weekly programme and code for tickets, bookings and staff operations. The production site currently runs on GitHub Pages with no API configured. Visitors can explore the offering and call 0393 103 799; they cannot complete durable online bookings or verified payments there.

This plan treats visual presentation and operational readiness as separate deliverables. The accompanying visual update adds four restorations from real photographs, a building feature, an expanded gallery and practical visit answers. The remaining chapters specify future work, with dependencies and evidence for every major area. A good screenshot alone does not establish a working sales system.

The engineering priority is dependable state: prevent double allocation, preserve payment evidence, control staff permissions and recover from interrupted writes. The visual priority is recognition: retain the actual amenities, remove ambiguity from prices and directions, and commission photographs where the existing archive cannot establish the room or service.


| Contract | Detail |

| --- | --- |

| Release now | Publish verified supporting imagery and visit guidance; preserve current call-to-reserve behaviour. |

| Build next | Deploy a persistent server after transactional writes, security review and end-to-end rehearsal. |

| Owner decisions | Confirm merchant accounts, operating rules, exact map location, event details and real missing-room photographs. |


**Acceptance evidence**

A completion claim must name the delivered scope. Brochure completion, transaction readiness and event-day readiness each have independent acceptance gates; none implies the others.

Delivery owner: product lead and engineer.

Evidence: config.js; src/backend-brochure.js; shared/catalog.js; server/store.js


## Page 003 - How to use this blueprint

*Reading guide*

Read by responsibility, then work through the numbered contracts in dependency order.

The venue owner should start with the baseline, journeys, booking policies and staff sections. A designer should use the visual and image chapters together: composition must support the customer action, and a polished photograph must still represent the physical venue. An engineer should read the frontend, backend, sales, security and release chapters before estimating changes.

Status language is deliberate. Audited describes code or assets inspected for this plan. Implemented describes the accompanying visual release. Proposed describes work that remains to be built or verified. Owner decision describes facts that the developer cannot responsibly infer, such as refund policy, approved merchant account and actual bed configuration.

Each specification identifies the trigger, implementation contract and observable acceptance evidence. Create an issue from a page only after resolving its inputs. Attach screenshots, traces, test output or operator sign-off to that issue. Record deviations as architecture decisions with a reason and review date, rather than quietly changing the meaning of a booking or payment state.


| Contract | Detail |

| --- | --- |

| Product and design | Pages 7-46 establish outcomes, content, visual treatment and reference-based image prompts. |

| Engineering | Pages 47-94 cover modules, persistence, booking rules, money, operations and security. |

| Validation and delivery | Pages 95-128 define usability, budgets, measurement, release gates and handover records. |


**Acceptance evidence**

The delivery team can map each outstanding task to one specification page, an owner, a dependency and a concrete pass condition. There are no implied guarantees of revenue, rankings or payment-provider approval.

Delivery owner: product lead and engineer.


## Page 004 - Contents / product and architecture

*Reading guide*

Use the PDF bookmarks to open any of the 128 page specifications.

The contents are arranged by decisions and dependencies, rather than by screen count. A customer journey can require work in several chapters: booking presentation, resource allocation, payment verification, notification delivery and operator recovery must agree on the same record.

Page numbers are fixed for this edition. The ten appendices provide prioritised work packages, requirement traceability, acceptance examples, a prompt registry, a shipping runbook and primary references. The editable Markdown source and renderer live with the website repository so later changes can preserve the structure.


| Contract | Detail |

| --- | --- |

| 01 / Pages 7-14 | Product strategy and verified baseline |

| 02 / Pages 15-22 | Customer journeys and content contracts |

| 03 / Pages 23-30 | Visual system, typography and motion |

| 04 / Pages 31-38 | Image fidelity and production workflow |

| 05 / Pages 39-46 | Production image prompts and shot briefs |

| 06 / Pages 47-54 | Frontend architecture and integration |

| 07 / Pages 55-62 | Backend, persistence and data integrity |


**Acceptance evidence**

Choose a chapter by the decision you own. Follow referenced pages when a rule crosses design, data and operations; do not implement a screen in isolation.

Delivery owner: product lead and engineer.


## Page 005 - Contents / operations and delivery

*Reading guide*

Use the PDF bookmarks to open any of the 128 page specifications.

The contents are arranged by decisions and dependencies, rather than by screen count. A customer journey can require work in several chapters: booking presentation, resource allocation, payment verification, notification delivery and operator recovery must agree on the same record.

Page numbers are fixed for this edition. The ten appendices provide prioritised work packages, requirement traceability, acceptance examples, a prompt registry, a shipping runbook and primary references. The editable Markdown source and renderer live with the website repository so later changes can preserve the structure.


| Contract | Detail |

| --- | --- |

| 08 / Pages 63-70 | Booking rules and resource allocation |

| 09 / Pages 71-78 | Payments, ticketing and admission |

| 10 / Pages 79-86 | Staff workflows and service delivery |

| 11 / Pages 87-94 | Security, privacy and abuse resistance |

| 12 / Pages 95-102 | Accessibility, resilience and performance |

| 13 / Pages 103-110 | Search, measurement and campaign readiness |

| 14 / Pages 111-118 | Testing, release, recovery and handover |

| Appendices / 119-128 | Backlog, traceability, test cases, prompts, launch checklist and sources. |


**Acceptance evidence**

Choose a chapter by the decision you own. Follow referenced pages when a rule crosses design, data and operations; do not implement a screen in isolation.

Delivery owner: product lead and engineer.


## Page 006 - Verified starting point

*Reading guide*

Audit baseline: main commit 677c722, inspected on 07 October 2026; this plan accompanies the supporting-image release.

The repository is a vanilla JavaScript application built with esbuild. Public pages use Barlow Condensed and DM Sans; staff pages use Manrope. The photo pipeline supplies AVIF and JPEG variants, fixed aspect ratios, placeholders and mobile crops. A native dialog supports enlarged photos, keyboard navigation and focus restoration.

The backend is present in source but is not connected to the public GitHub Pages deployment. It uses Node and a SQLite document table mirrored in memory. Engine mutations share an application lock; the store currently writes each document individually. That controls concurrent operations inside one process but does not make a multi-document operation crash-atomic.

The supplied photo archive establishes the gym, turf, terrace, penthouse dining/balcony, bar, exterior, entrance and parking. It contains no usable sauna interior, bedroom inventory or finished menu photography. The existing sauna macro is labelled illustrative. The four new supporting images are reference restorations, with originals preserved and prompt provenance recorded.


| Contract | Detail |

| --- | --- |

| Public production | GitHub Pages at https://cartelug.github.io/social-spot/; config.js api is empty. |

| Operational code | Tickets, seven booking types, staff roles, door scanning and manual payment confirmation exist in source. |

| Current quality evidence | 27 engine tests passed in the preceding release; this visual update receives fresh responsive image and browser checks. |

| Not yet established | Live API, payment accounts, provider callbacks, recovery objectives, legal approval and production load measurements. |


**Acceptance evidence**

Before a transaction launch, refresh this baseline against the exact release commit and production configuration. Keep source implementation evidence distinct from evidence that a feature actually works in production.

Delivery owner: product lead and engineer.

Evidence: README.md; package.json; src/components.js; src/photo-viewer.js; assets-src/photos/photos.json


## Page 007 - A product definition that can be completed

*01 / Product strategy*

Proposed contract: Social Spot must help a visitor choose an activity, understand the terms and reach a confirmed next step.

The website serves a venue with several different reasons to visit. A person choosing a gym pass needs a usable timetable and price; a football organiser needs available hours; a family needs group arrangements; a penthouse guest needs trustworthy room and stay information. One generic reservation form cannot adequately explain all of these decisions.

Define completion through outcomes rather than decorative features. The visitor should identify the location and relevant activity without interpreting a dense event poster. The chosen route should present its price unit, booking basis, capacity rule and contact option before asking for personal information. The final state must say whether a request, reservation or payment has actually been confirmed.

Keep the existing brand identity and extend its meaning through content: sport, fitness, stays and social gatherings in one compound. Add sections only when they answer a customer question or establish confidence. Evaluate a new animation, image or tool by whether it supports that decision and remains usable on a modest phone connection.


| Contract | Detail |

| --- | --- |

| Primary outcome | A visitor reaches an appropriate activity page and a usable booking or call action. |

| Secondary outcome | A staff member can find, understand and service the resulting request without reconstructing missing details. |

| Completion boundary | The public brochure may ship independently; online sales require operational and data-integrity gates. |


**Acceptance evidence**

Observe five representative visitors using a phone. Each can name the venue location, choose their activity and describe the next step accurately. Record confusion and change the relevant copy or sequence.

Delivery owner: product lead and engineer.

Evidence: src/views/public.js; src/views/booking.js


## Page 008 - The gap register

*01 / Product strategy*

Proposed contract: classify every gap by business impact, evidence and dependency before scheduling implementation.

A visual gap is not the same as a blocked business capability. The site can improve the clarity of its arrival photographs today. It cannot honestly show live availability from the brochure backend, because that backend uses a fresh in-memory store. Treat missing operational connections as separate work packages that remain visible until verified.

Create four gap classes: content facts awaiting owner confirmation, visual assets awaiting photographs or restoration, software changes awaiting implementation, and operating processes awaiting rehearsal. Assign an evidence field to each. The owner should know exactly which input would close a gap; the engineer should know exactly which test would demonstrate the resulting behaviour.

Inspect the existing implementation before creating replacement work. The photo viewer, motion preference and booking rules already exist; improve or verify them instead of duplicating them. Conversely, do not assume a README capability is deployed merely because its source files are committed. Capture environment and configuration when recording a successful check.


| Contract | Detail |

| --- | --- |

| P0 / launch blockers | Persistent backend, transaction integrity, merchant ownership, staff access and recoverable backups. |

| P1 / customer clarity | Exact location, real room photographs, current timetable, price terms and truthful availability copy. |

| P2 / optimisation | Campaign landing pages, experiments, advanced analytics and optional motion refinements. |


**Acceptance evidence**

A backlog review can explain why each item matters, what it depends on and what evidence closes it. Remove duplicates and mark existing functionality for verification rather than automatic reconstruction.

Delivery owner: product lead and engineer.

Evidence: config.js; README.md; docs/design-upgrade-2026-10-07.md


## Page 009 - Requirements and evidence levels

*01 / Product strategy*

Proposed contract: a requirement is complete only when its customer outcome and failure behaviour are both demonstrated.

Use stable requirement identifiers such as SS-BOOK-001 for turf exclusivity and SS-IMG-001 for venue-image fidelity. Link the requirement to its implementation module, test scenario, owner and release. This traceability keeps a later design edit from silently removing a critical state explanation or confirmation step.

Separate proof levels. A code inspection establishes that an intended check exists. A unit test establishes behaviour for a controlled input. A browser test establishes a user path in a test environment. A production rehearsal establishes that configured infrastructure and operator processes work together. A payment integration requires the latter before it can be called ready.

Write requirements in terms of triggers and observable results. For example: when two visitors request the same last hour, exactly one durable booking is created and the other receives a useful alternative. Avoid requirements such as premium or flawless without a measurable interpretation. Visual goals can still have evidence: legible type, real geometry, correct crops and recognisable entrance.


| Contract | Detail |

| --- | --- |

| Traceability record | ID; user trigger; rule; module; scenario; owner; evidence URL; release commit. |

| Change impact | A change to price, capacity or status copy must identify all affected screens, exports and notifications. |

| Closure rule | Pass evidence is attached and unresolved owner inputs are absent; a source file alone is insufficient. |


**Acceptance evidence**

Select one booking, one image and one staff requirement. Follow each from specification to source, test and release evidence without guessing which version was tested.

Delivery owner: product lead and engineer.

Evidence: test/engine.test.js; shared/engine.js


## Page 010 - Decision rights and responsibilities

*01 / Product strategy*

Proposed contract: technical implementation should progress while business facts remain owned by the venue.

The product lead owns customer priorities and coherent presentation. The venue owner owns prices, merchant accounts, cancellation rules, opening hours, safety procedures and what each stay package actually contains. The engineer owns implementation choices within these constraints, including persistence, interfaces, monitoring and release controls.

Use an accountable owner for each work package and a named reviewer for sensitive outcomes. Payment reconciliation should be reviewed by the venue finance lead; admission rehearsals should include the door supervisor; images should be checked by someone who knows the compound. The same person may hold multiple roles in a small team, but the responsibilities should remain explicit.

Avoid blocking routine reversible work on unspecified preferences. Crop exports, copy clarity, bug fixes and source-grounded restorations can progress under the authorised scope. Decisions that introduce a new fee, imply a new amenity or connect a financial account need factual input. Preserve a short decision log so the operating team can maintain the site after handover.


| Contract | Detail |

| --- | --- |

| Venue owner | Approves factual inventory, public terms, contact details, account ownership and operating capacity. |

| Product and designer | Own information order, conversion clarity, visual consistency and photographic authenticity. |

| Engineer and operator | Own integrity, security, deployment, backups, recovery and test evidence. |


**Acceptance evidence**

Every P0 issue has one accountable owner and one reviewer. A missing business fact is recorded precisely rather than converted into a guessed default.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; server/auth.js


## Page 011 - Success measures without invented promises

*01 / Product strategy*

Proposed contract: measure useful customer progress and service outcomes before judging the redesign by traffic.

A professional venue website should make it easier for an interested visitor to act. Measure activity-page engagement, call taps, direction taps, qualified booking requests and completed paid orders when the backend is active. Distinguish a tap from a successful call, a request from a confirmation, and a submitted transaction ID from a verified payment.

Operational measures provide a second view: time to review a payment, time to answer a request, correction rate, duplicate allocation attempts, admission exceptions and backup recovery success. These explain whether the website helps staff rather than simply moving work into an unfamiliar dashboard. Avoid combining these events into a single conversion metric with no definition.

Start with a baseline period after reliable instrumentation is deployed. Compare similar weekdays and activities, record campaign sources and note outages. The initial plan proposes targets for review, not claims of existing performance. Use small-volume observations carefully; do not promise a specific percentage uplift or attribute every improvement to imagery.


| Contract | Detail |

| --- | --- |

| Customer funnel | Activity view -> relevant action -> qualified request -> confirmation -> verified value. |

| Service funnel | New request -> first response -> decision -> fulfilled visit -> follow-up where consent allows. |

| Data limits | No phone numbers, ticket tokens, transaction IDs or child names in public analytics events. |


**Acceptance evidence**

The team can compute each measure from a defined event or record, explain its denominator and identify the environment. Uninstrumented outcomes remain unknown rather than appearing as zero.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js; src/core.js


## Page 012 - A bounded first transaction release

*01 / Product strategy*

Proposed contract: open a controlled online flow before enabling every ticket and booking capability at once.

The existing engine covers many domains. Enabling them simultaneously increases the number of policies, staff actions and failure paths that must be rehearsed. Choose a first transaction scope with the owner: for example, table requests and gym enquiries before scarce-resource reservations, then turf and event tickets once payment and inventory gates pass.

For each enabled flow, list the complete operating path. A form submission must reach a durable record; the customer must receive a stable confirmation link; staff must see and process it; the record must survive a restart; support must know what to do after an interrupted payment. Disable unsupported mutations through capability information rather than leaving apparently functional buttons.

Keep the brochure experience available while operational work is completed. If the backend is unavailable, show a useful call option and avoid displaying empty-store availability as fact. A staged rollout reduces ambiguity and allows real operators to learn the system without risking all event inventory on the first day.


| Contract | Detail |

| --- | --- |

| Stage A | Public discovery and call-to-reserve; current production behaviour. |

| Stage B | Controlled durable requests with staff review, support process and restart checks. |

| Stage C | Scarce resources and ticket sales after integrity, payment and recovery rehearsal. |


**Acceptance evidence**

One complete pilot flow passes on production infrastructure with approved operators and account details. The launch record names the enabled activities, remaining exclusions and rollback action.

Delivery owner: product lead and engineer.

Evidence: src/backend-brochure.js; src/backend-http.js; server/index.js


## Page 013 - Dependency sequence

*01 / Product strategy*

Proposed contract: schedule by prerequisites so the last week is not consumed by missing facts and untested connections.

Begin with owner inputs and operational design, because interface polish cannot resolve unknown inventory or account ownership. In parallel, finish photographic coverage and source-grounded public content. Then implement persistence integrity and capability responses, deploy a staging server and connect a staging frontend to it.

Only after durable records and permissions are established should the team rehearse scarce-resource bookings, payment verification, ticket issue and door scanning. Notification delivery and recovery drills follow the same record lifecycle. Production activation comes after operator training, a verified backup and an explicit inventory and merchant review.

Express the schedule as conditional stages with estimated effort, rather than a fixed calendar promise that ignores missing inputs. A delayed sauna photograph need not block reliable turf booking. An unresolved merchant account must block online payment instructions. Keep these dependencies visible to protect both progress and factual accuracy.


| Contract | Detail |

| --- | --- |

| Inputs first | Approved catalogue, exact arrival facts, real room photos, merchant ownership and staff list. |

| Engineering next | Atomic persistence -> staging -> capability gating -> complete booking/payment paths. |

| Readiness last | Operator rehearsal -> restore drill -> production smoke -> controlled activation. |


**Acceptance evidence**

The release board distinguishes independent visual work from transaction blockers. Every scheduled task has available inputs or an explicit dependency owner.

Delivery owner: product lead and engineer.

Evidence: README.md; shared/catalog.js


## Page 014 - Definition of done and handover

*01 / Product strategy*

Proposed contract: finish a feature with its source, evidence and operating instructions in the same release.

A feature is done when the agreed customer path works, the failure path is useful, sensitive data is handled appropriately and an operator can maintain the result. Include the implementation, any migration, test evidence, rollback implications and relevant support copy. Do not mark a payment flow done after its happy-path screen appears.

For visual work, record the original, accepted restoration, prompt, crop metadata and page placements. For business rules, record the approved policy and price version. For deployments, record the exact commit, configuration changes and health checks. These artefacts make a future update understandable without reconstructing the conversation.

The final handover should include a short owner walkthrough, staff rehearsal and clear boundaries. Explain which systems are live, how to change public facts, how to back up the database, how to pause sales and who responds to an incident. A dense technical plan should support these practical tasks rather than replace them.


| Contract | Detail |

| --- | --- |

| Feature closure | Source and build agree; relevant tests pass; user and staff copy reflect real states. |

| Operational closure | Runbook, owner contact, recovery procedure and access ownership are verified. |

| Visual closure | Source provenance, fidelity review, responsive crops and disclosure for illustrations are retained. |


**Acceptance evidence**

A second team member can perform the feature walkthrough and its recovery procedure using the handover material alone. Record any unresolved limitation in the release notes.

Delivery owner: product lead and engineer.

Evidence: assets-src/photos/IMAGE_PLAN.md; README.md


## Page 015 - A route map organised around intent

*02 / Customer journeys*

Proposed contract: every public destination should answer a distinct visitor question before asking for action.

The current navigation links to The Replay, booking, Quiz Night and ticket recovery. Preserve these recognisable destinations and make the booking hub an activity chooser. A visitor arriving from a football ad should reach turf or tables directly; someone looking for a stay should see penthouse information without scanning a long event-led homepage.

Use the homepage to establish the venue, then provide a fast route into relevant details. Amenity cards need a truthful photograph, a clear unit price and a matching call to action. The gallery supports recognition and atmosphere; it should not carry facts that belong in readable text. Arrival guidance should remain reachable from every public footer.

Document route purposes before adding new pages. A food menu may deserve its own route after the real menu and photographs are available. Avoid creating thin pages with generated claims simply to increase page count. The route map should remain small enough for staff to keep dates, prices and contact details current.


| Contract | Detail |

| --- | --- |

| Discovery routes | / and /book explain the venue and activity choices. |

| Decision routes | /book/turf, gym, sauna, penthouse, kids and table explain activity-specific terms. |

| Event and recovery | /replay, /quiz and /tickets handle event information and established customer needs. |


**Acceptance evidence**

For each route, state its entry source, main customer question, primary action and successful exit. No two routes require contradictory prices or availability language.

Delivery owner: product lead and engineer.

Evidence: src/views/public.js; src/views/booking.js


## Page 016 - The first visit on a small phone

*02 / Customer journeys*

Proposed contract: the opening screen must establish Social Spot, its location and a useful next action with readable type.

A first-time visitor may arrive on a shared WhatsApp link with little context. The hero should communicate that Social Spot is a physical venue in Akright City with turf, fitness and social spaces. The event feature can support the current programme, but it should not make a gym visitor assume the entire venue is a one-night event.

Keep the first-screen copy brief and concrete. Preserve the strong headline, readable supporting sentence and activity CTA. Put the landmark in text and offer directions later without requiring an embedded map download. The preloader must have a visible skip control and a failsafe; it cannot be a dependency for accessing prices or calling the venue.

Assess the real experience at 320 and 390 pixels wide, with larger text settings and a slow connection. The customer should not need perfect image loading to understand the offer. Buttons must remain separate, titles must avoid clipping and the site should reveal meaningful content as soon as it can.


| Contract | Detail |

| --- | --- |

| First-screen facts | Venue name, Akright City/Bwebajja location, activity breadth and a clear primary action. |

| Interaction order | Read -> choose an activity -> review details -> reserve or call. |

| Resilience | Broken image or skipped intro leaves the core message and contact action usable. |


**Acceptance evidence**

A new visitor identifies the business, location and relevant action in a short observation session. Verify layout with browser text enlargement and with image requests blocked.

Delivery owner: product lead and engineer.

Evidence: src/preloader.js; src/views/public.js; src/experience.css


## Page 017 - Turf organiser journey

*02 / Customer journeys*

Proposed contract: a team organiser must understand the hourly rate, open-session restrictions and confirmation basis.

The journey begins from the turf card or a direct link. Present the real day and floodlit photos, followed by the day and night hourly prices from the catalogue. Explain that open soccer sessions have a separate per-person rate and cannot be reserved as private turf hire. These are different products, not merely different price labels.

In online mode, show an availability grid that distinguishes booked, available, past and open-session hours. Adjacent selected hours should have a clear start/end summary, total price and date in East Africa Time. In brochure mode, replace live-looking stock claims with a call action and a concise list of the details the organiser should provide.

The organiser should know what happens after choosing: whether the hour is immediately confirmed, awaits payment or requires staff review. This policy is an owner decision if changed from the current engine. Carry the team name, player count, selected hours and contact information into staff views and confirmations without requiring a second conversation.


| Contract | Detail |

| --- | --- |

| Price source | Day UGX 50,000/hour; night UGX 70,000/hour from 18:00; confirm defaults before activation. |

| Availability boundary | Wed-Fri 19:00-23:00 open sessions block private hire; current maximum is three adjacent hours. |

| Fallback request | Date, preferred start time, duration, team/group size and a return contact. |


**Acceptance evidence**

A visitor can distinguish private hire from open soccer. A contested last hour produces one successful durable allocation and a useful alternative for the other visitor.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: turfSlots and bookingCreate


## Page 018 - Fitness and wellness journey

*02 / Customer journeys*

Proposed contract: customers must distinguish a day pass, a membership and a booked sauna session.

The gym card should show the real room, then make the daily and recurring plans easy to compare. A day pass is a low-commitment choice; monthly and annual plans need a clear period and inclusion list. The catalogue includes combined gym and sauna plans, so copy must say what the selected package includes rather than treating every pass as identical.

Sauna availability is a separate capacity-based session flow. Display the adult and child price units, slot time and number of people. Do not infer health benefits or medical suitability from a wellness image. Any venue rules, age limits, session duration or equipment policy must be supplied by the owner and presented before confirmation.

Use the labelled illustrative macro until a real sauna interior is photographed. The image can create atmosphere but cannot establish the room size, heater, benches or actual finish. A real gym image and factual timetable are stronger evidence than an invented spa scene. Keep the phone fallback available if someone wants help choosing a plan.


| Contract | Detail |

| --- | --- |

| Gym distinction | Plan, price, period, included services and selected morning/evening session. |

| Sauna distinction | Date, time, adults, children, remaining capacity and clear payment/confirmation state. |

| Missing facts | Owner supplies session duration, facility rules and real sauna interior photography. |


**Acceptance evidence**

A customer can explain the selected product and its period. The sauna image is visibly labelled where used, and no generated architecture is presented as the actual room.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; src/views/booking.js; assets-src/photos/IMAGE_PLAN.md


## Page 019 - Penthouse guest journey

*02 / Customer journeys*

Proposed contract: the guest must know exactly which space is offered and whether their stay is a request or a confirmation.

The existing real penthouse photograph establishes a dining table, chairs, checkerboard floor, pendant and balcony view. It does not establish bedroom count, bed sizes, bathroom finish or every room in each package. Keep this distinction in the page content and commission a room inventory before presenting a detailed accommodation gallery.

Compare the five catalogue packages with their prices in USD, maximum guests and included access. Dates must be interpreted as check-in and check-out, with the check-out night excluded. Show the number of nights and total before collecting contact details. Any local-currency payment conversion must be approved and captured explicitly rather than silently assuming a rate.

The current engine treats all packages as competing for the same penthouse nights and creates a requested status. Confirm this conservative policy with the venue: independent room inventory would require a different allocation model. Avoid advertising separate room availability until the physical resource map and operating rules support it.


| Contract | Detail |

| --- | --- |

| Current defaults | USD 50-200/night across five packages; guest limits range from two to ten. |

| Stay summary | Package, check-in, check-out, nights, guests, currency and requested/confirmed status. |

| Photography inputs | One truthful wide view per actual room, bathrooms, balcony access and room-to-package map. |


**Acceptance evidence**

A guest can distinguish the package inclusions and final status. Adjacent stays can share a checkout/check-in date without overlapping occupied nights.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: penthouseNights and bookingCreate


## Page 020 - Groups, tables and family visits

*02 / Customer journeys*

Proposed contract: group planning should collect the few facts staff need and make the reservation basis explicit.

A table visitor needs the date, arrival time, party size and occasion. The current catalogue allows groups of one to thirty and treats a table reservation as a request with no reservation charge. Food and drinks are purchased separately. Keep these facts close to the action so free to reserve is not mistaken for a free meal.

Use the real terrace and bar photographs to establish seating atmosphere and football viewing. A television photograph proves there is a screen; it does not prove a particular fixture will be shown tonight. Ask the visitor to check the match programme with staff, and publish verified fixtures only after someone owns schedule maintenance.

For family visits, explain Sunday Family Dinner using the current venue programme without inventing a bundle, child policy or menu price. A new menu requires owner-approved dishes, portions, prices and photographs. The accompanying visit FAQ provides immediate practical help while those inputs remain pending.


| Contract | Detail |

| --- | --- |

| Group request | Date, arrival time, party size, occasion and contact; avoid unnecessary personal fields. |

| Price clarity | Reservation is free; food and drinks are bought on the day. |

| Staff decision | Confirm seating feasibility and arrangements; do not convert every request into a guaranteed table. |


**Acceptance evidence**

A visitor understands what is free and what is paid. Staff see the full request and can confirm or decline it with a useful reason and contact option.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; src/views/public.js; shared/engine.js: table branch


## Page 021 - Event visitor and recovery journey

*02 / Customer journeys*

Proposed contract: The Replay must connect event information, sale eligibility, payment and ticket recovery coherently.

The event route should establish its date, gate time, venue and age rule before ticket tiers. The catalogue currently sets The Replay for 12 December 2026 with gates at 16:00 and scheduled releases. These are baseline facts to reconfirm with the event owner, not permanent copy that can safely remain untouched after the event.

A ticket buyer needs the selected release, quantity, price, hold deadline and payment method. A lounge buyer additionally needs table inclusions, deposit amount, balance deadline and guest-name requirements. Show each next step in the current state; do not suggest that a submitted transaction ID already creates a usable QR ticket.

Recovery should be easy for legitimate customers and resistant to disclosure. The current engine requires a matching phone number plus order reference, pass code or booking code; it does not use a phone number alone. Review guessing resistance and link disclosure before activation, consider verified link delivery where needed, and explain expired, transferred and used tickets clearly.


| Contract | Detail |

| --- | --- |

| Event facts | Date, gates, age restriction, venue, release schedule and approved terms. |

| Sales states | Not yet open, on sale, held, payment submitted, verified, expired, cancelled and transferred. |

| Recovery objective | Restore access without revealing tickets to someone who only knows a phone number. |


**Acceptance evidence**

A buyer accurately describes when a QR becomes valid. A recovery rehearsal protects account and ticket details while returning a usable link to the rightful holder.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; src/views/public.js; shared/engine.js


## Page 022 - Copy, facts and editorial governance

*02 / Customer journeys*

Proposed contract: every public claim should have a source, owner and review trigger.

The catalogue currently drives prices, programme and rules, while some view copy is embedded in JavaScript. Inventory these facts and identify duplicate statements. A rate change should not update one amenity card while leaving a story section, FAQ or booking page stale. Prefer shared formatting and data-driven values for anything that changes operationally.

Maintain a content register for event dates, recurring offers, staff host names, prices, room inclusions, location and policies. Record who confirms each item and when it must be reviewed. Event content needs an automatic end-state and an archive decision; recurring programme content needs periodic owner review and a fast correction path.

Write in plain, useful language. Explain the next action, the unit of price and any meaningful restriction. Use enthusiastic brand language sparingly around factual content. Avoid invented testimonials, guest counts, room features or claims that a service is available without current evidence. The source archive and approved catalogue remain the starting authority.


| Contract | Detail |

| --- | --- |

| Fact register | Claim; source; owner; review date; affected routes; change trigger. |

| Editorial rule | Use short headings and one clear action; preserve essential terms near the decision. |

| Implementation rule | Reuse catalogue values for dynamic facts; keep missing facts visibly pending. |


**Acceptance evidence**

Change a test price and timetable in the configured source. All relevant page summaries, comparisons and confirmations reflect the same value, with no stale literal duplicate.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; src/views/public.js; src/views/booking.js


## Page 023 - Typography as a working system

*03 / Visual design*

Proposed contract: extend the existing type hierarchy so headings attract attention and operational text stays easy to read.

The public site already uses self-hosted Barlow Condensed headings and DM Sans body text. Retain this distinction instead of adding competing families. Condensed display type works for short, expressive headings; prices, terms, form labels and descriptions need the wider text face. Staff screens retain Manrope because their dense tables and controls have different reading demands.

Document roles rather than a disconnected list of sizes. Define display, page title, section title, card heading, lead, body, supporting text and numerical metadata. Use fluid sizes only within tested minimum and maximum bounds. A desktop headline must not force a fixed-size mobile title that clips an important word or creates horizontal scrolling.

Review line length and spacing with actual content: the penthouse package names are longer than Gym, and terms can span several sentences. Avoid shrinking all text to make a card fit. Use consistent padding, readable body line height and short headings; let content determine the necessary height.


| Contract | Detail |

| --- | --- |

| Public roles | Short display headings; DM Sans for body, form labels, descriptions and price context. |

| Operational roles | Manrope for staff views; monospace only for references, times and codes where useful. |

| Proposed bounds | Body typically 16-18px; supporting text stays legible; mobile form inputs at least 16px to avoid unwanted zoom. |


**Acceptance evidence**

Review the homepage and longest booking page at 320px, 1440px and enlarged text. Headings remain readable, essential labels retain their meaning and no text is clipped.

Delivery owner: product lead and engineer.

Evidence: src/experience.css; scripts/build.js


## Page 024 - Colour, surfaces and contrast

*03 / Visual design*

Proposed contract: use the established black, warm white and red identity with measurable readability.

The site already has a dark editorial direction. Define semantic colour tokens for page background, elevated panel, primary text, secondary text, divider, accent, success, warning and error. The accent red should guide attention without becoming the only way a visitor can distinguish a state. Payment and admission statuses need text and an icon as well as colour.

Photo overlays must be reviewed against the lightest and darkest part of each crop. A translucent gradient can improve text legibility, but the image should still communicate the real venue. Place longer explanatory content on a stable surface rather than relying on a photograph to remain uniformly dark across responsive crops.

Treat contrast checks as part of the component contract. Test navigation, thin outlines, muted hints, focus rings, disabled controls and error text. A dramatic heading may tolerate a decorative treatment that would be inappropriate for a transaction reference or payment instruction. The plan targets WCAG 2.2 AA and a project preference for larger usable controls.


| Contract | Detail |

| --- | --- |

| Token ownership | A small semantic palette defined centrally; no one-off nearly identical greys in new components. |

| Status meaning | Text labels and shape/icon cues accompany red, amber and green states. |

| Photo text | Gradient and crop reviewed together; important instructions use a stable text surface. |


**Acceptance evidence**

Measure representative text and control contrast, then inspect each image overlay at all target crops. Document any unresolved contrast defect before marking the component ready.

Delivery owner: product lead and engineer.

Evidence: src/styles.css; src/experience.css; S01 / WCAG 2.2


## Page 025 - Layout and spacing rules

*03 / Visual design*

Proposed contract: responsive composition must preserve reading order and decision context across device widths.

The existing homepage contains a hero, photo gallery, weekly programme, amenity cards, alternating space stories, event content and arrival guidance. Keep this sequence understandable on a phone. Large desktop sections can become long mobile pages, so titles, anchor links and clear activity routes should help customers find a relevant decision quickly.

Create spacing tokens for page gutters, section separation, card padding and related controls. Distinguish space that groups a price with its unit from space that separates two unrelated services. Avoid arbitrary negative margins to fix a single screenshot if they break longer copy or another route. Preserve fixed image proportions to prevent layout shifts.

For alternating story sections, the mobile DOM order should remain image then explanatory content, unless a deliberate accessibility review establishes a better sequence. The new building feature adds context but should not force every visitor to scroll past four stories to book. Keep the activity hub accessible from the top navigation and relevant calls to action.


| Contract | Detail |

| --- | --- |

| Phone composition | One primary reading column; predictable gutters; no essential horizontal comparison tables. |

| Desktop composition | Consistent maximum content width and balanced photo/text columns without overly long body lines. |

| Responsive evidence | 320, 390, 768 and 1440px checks include the longest titles and price labels. |


**Acceptance evidence**

All content is reachable without horizontal page scrolling. Resize between breakpoints and inspect reading order, image proportions and sticky-control overlap.

Delivery owner: product lead and engineer.

Evidence: src/experience.css; src/views/public.js


## Page 026 - Amenity cards and comparison clarity

*03 / Visual design*

Proposed contract: a card should communicate the service, its starting price and the right next action in one scan.

A card is a small decision surface, not a condensed brochure. Use one truthful image, a short service title, a starting price with unit, a concise description and a relevant action. Additional rates should be grouped consistently. If an illustrative image is used, its visible label must remain attached to the media rather than disappearing when the card is cropped.

The six current amenity cards cover turf, gym, sauna, penthouse, kids soccer and tables. Their products have different units: hour, pass, person, night, session and reservation. Treat the unit as part of the price. From USD 50/night should not be read as the total for every stay; free to reserve should not imply complimentary food.

Keep card heights visually coherent without truncating material information. The photo crop should establish the real activity at mobile sizes; the call to action should match the status model. Request a stay and Book the turf can mean different things, so confirmation copy needs to make the final distinction explicit.


| Contract | Detail |

| --- | --- |

| Required content | Photo or disclosed illustration; title; unit price; concise context; correct destination. |

| Data rule | Rates and package comparisons come from the current catalogue or configured settings. |

| Interaction rule | Use a clear action with keyboard focus; avoid making both card and nested controls compete. |


**Acceptance evidence**

Ask a visitor to compare two activities. They identify the price unit and next step correctly. Check the sauna label and long penthouse names at the smallest width.

Delivery owner: product lead and engineer.

Evidence: src/views/public.js: amenityCard; src/components.js: photoNote


## Page 027 - A preloader that earns its place

*03 / Visual design*

Proposed contract: the existing brand intro remains brief, skippable and independent of core page access.

The previous upgrade shortened the original-logo assembly to a nominal 1.45-second sequence and added Skip intro, Escape handling, session memory and a 4.5-second failsafe. Preserve these safeguards. A preloader is a brand moment; it should not pretend that an animation progress bar represents a measured download or block a returning customer from a ticket link.

Review its timing on slow phones and failed asset requests. The underlying page should prepare while the intro plays. If motion is reduced or the visitor skips, reveal the content immediately and ensure focus is not stranded on a removed button. Avoid adding audio or another compulsory transition to extend the experience.

Future refinements should improve the original mark assembly, typographic balance and transition, with a small rendering footprint. A stronger design does not require a longer wait. Keep deep links, back navigation and the staff interface free from unnecessary replay of the intro.


| Contract | Detail |

| --- | --- |

| Existing safeguards | Skip control, Escape, session memory, reduced motion and exit failsafe remain. |

| Timing target | Retain a short nominal intro; test actual interaction access rather than timing the animation alone. |

| Failure behaviour | Missing logo part or interrupted load still exits and presents usable content. |


**Acceptance evidence**

Exercise first visit, repeat visit, direct booking link, reduced motion, Escape and a failed logo request. Each reaches usable content and sensible focus without a trapped overlay.

Delivery owner: product lead and engineer.

Evidence: src/preloader.js; src/boot.js; docs/design-upgrade-2026-10-07.md


## Page 028 - Motion with purpose and limits

*03 / Visual design*

Proposed contract: animation should help orientation and feedback while remaining optional and inexpensive.

The site already uses hero entrances, finite photo zoom, scroll reveals, ticket tilt and hover response. Extend this vocabulary carefully. A reveal can introduce a section; a short pressed state can acknowledge a tap; a panel transition can explain a change. Repeated movement behind payment instructions or long lists adds distraction without helping the decision.

Keep motion primarily in opacity and transform where practical, and profile any effect that changes layout or paints large blurred areas. Avoid persistent JavaScript frame loops and scroll interception. Route-specific observers, event listeners and timers must be released when the route changes. Long-lived motion controls should have one owner and consistent labels.

Reduced motion and the existing pause preference should make every content item visible, not leave it in the unrevealed starting state. Keyboard focus should also reveal a target before the visitor interacts. Animated count-downs need readable static context and must not announce every second to assistive technology.


| Contract | Detail |

| --- | --- |

| Motion roles | Entrance for orientation; feedback for interaction; finite atmosphere where it does not obscure facts. |

| Suggested durations | Short feedback around 120-220ms; section entrances around 350-650ms, tuned through device checks. |

| Resource lifecycle | Observers, listeners and timers are cleaned on navigation; no unnecessary perpetual frame loop. |


**Acceptance evidence**

Toggle motion off mid-page, navigate away repeatedly and inspect listener/timer growth. All content stays visible, controls stay usable and route changes do not accumulate work.

Delivery owner: product lead and engineer.

Evidence: src/motion.js; src/experience.css


## Page 029 - Navigation, focus and small-screen controls

*03 / Visual design*

Proposed contract: the menu and sticky actions must remain usable with touch, keyboard and assistive technology.

The mobile menu already includes an accessible dialog role, background inertness, scroll locking, Escape dismissal, focus containment and focus return. Verify these behaviours after adding links or changing layout. A visually polished sheet can still fail if a keyboard user reaches hidden page controls while it is open.

Use clear active-page states and short navigation labels. The sticky action bar should not hide the last form fields, the FAQ content or browser safe areas. Its primary action must reflect the operating mode: a brochure site should not imply a live payment or guaranteed reservation merely because the button remains styled as a sale CTA.

Touch targets should be comfortably sized and separated. The project adopts a preferred 44px control height, while the formal accessibility review covers applicable WCAG requirements and exceptions. Test icon-only buttons such as close, copy and gallery expand with meaningful accessible names and visible focus.


| Contract | Detail |

| --- | --- |

| Menu lifecycle | Open -> focus inside -> cycle controls -> Escape or choose route -> return focus appropriately. |

| Sticky behaviour | Respect safe areas and content padding; remain comprehensible when bookings are unavailable. |

| Control naming | Every icon action has a purpose-specific name; current page and expanded state are correct. |


**Acceptance evidence**

Run keyboard-only navigation and a phone-sized session from hero to footer. No control is unreachable, hidden beneath a fixed bar or missing a meaningful accessible name.

Delivery owner: product lead and engineer.

Evidence: src/views/public.js: openMenu; src/styles.css; S01 / WCAG 2.2


## Page 030 - Brand icons across browser surfaces

*03 / Visual design*

Proposed contract: maintain the crisp pin mark consistently in tabs, bookmarks and home-screen icons.

The preceding release replaced a squashed wordmark favicon with a red location pin on a dark rounded square. The repository supplies SVG, ICO and several PNG sizes, plus a touch icon and maskable icon. Preserve the original logo for the full brand presentation and the compact pin for surfaces too small to read a wordmark.

Verify the head links after the base-path script so the project subdirectory resolves correctly. Test favicon.ico, the SVG, the 96px PNG, the touch icon and manifest icons from the live deployment. Browsers may retain a cached icon, so a local screenshot is not proof that every visitor has refreshed the asset.

Google Search favicon eligibility is a separate concern from Chrome tab display. Google defines a site by hostname, so Social Spot on a shared GitHub project path does not independently control the hostname favicon. A dedicated domain improves brand ownership; it still does not guarantee an icon or rich result will appear immediately.


| Contract | Detail |

| --- | --- |

| Current assets | social-spot-mark.svg; ICO; PNG variants; touch icon; 192/512 and maskable manifest assets. |

| Technical check | Square proportions, decoded resources, correct MIME types, stable paths and manifest scope. |

| Future domain step | Configure approved dedicated hostname, canonical URLs and crawlable stable icon links. |


**Acceptance evidence**

Open the production tab, inspect the manifest and fetch every linked icon. Record cache behaviour and hostname limits rather than claiming universal immediate search display.

Delivery owner: product lead and engineer.

Evidence: scripts/prepare_icons.py; scripts/build.js; S05 / Google favicon guidance


## Page 031 - An image truth policy

*04 / Image production*

Proposed contract: every venue image has a known origin and a declared relationship to the actual amenity.

Classify assets as original venue photographs, reference restorations or illustrative concepts. The category is about what the image can establish. A restored courtyard can help a visitor recognise the gate; a towels-and-stones macro cannot establish the sauna interior. Keep originals unchanged and record the source for every accepted restoration.

An edit may improve exposure, noise, compression and minor distraction removal while preserving the physical scene. It must not add an amenity, widen a room, invent a bed or alter the number of floors. Generated reconstruction can change fine details, so review both geometry and surface plausibility before publishing.

Missing references are a commissioning task. Do not solve them by inventing a luxury room and placing it among documentary photographs. The current sauna illustration remains labelled on the card, booking page and viewer until a real interior image is available.


| Contract | Detail |

| --- | --- |

| Documentary use | Real venue photographs establish physical features; restorations retain that scene and record edits. |

| Illustrative use | Concepts are visibly labelled and cannot support claims about real architecture or stock. |

| Review authority | A person familiar with the venue checks geometry and practical recognition before acceptance. |


**Acceptance evidence**

Every published image maps to a source record and approved placement. A visitor can distinguish the illustrative wellness asset from photographs of real rooms.

Delivery owner: product lead and engineer.

Evidence: assets-src/photos/IMAGE_PLAN.md; assets-src/photos/supporting-prompts-v2.json


## Page 032 - Building restoration / geometry first

*04 / Image production*

Implemented asset: building-restored-v2.jpg, derived from IMG_7665.HEIC.

The supporting exterior establishes the real building above the terrace. The restoration retains the storeys, pergola beams, glass balconies, stone-clad columns, rooftop sign, burgundy plants and white furniture. Its role is recognition and venue breadth; it does not establish any unphotographed bedroom or facility.

The accepted output improves shaded facade detail and colour balance and removes incidental visitors. Compare the rooftop and balcony geometry before considering aesthetics. Signs partly hidden in the original remain partly hidden; completing unseen letters would create unsupported evidence.

Use a portrait crop on phones and a measured architecture crop beside the building story. The enlarged viewer should offer the full frame so the customer can inspect the actual venue.


| Contract | Detail |

| --- | --- |

| Locked features | Floor count, balcony lines, roof structure, glazing, foreground plant and terrace furniture. |

| Allowed changes | Exposure, noise, mild colour correction and incidental-person cleanup. |

| Placement | Homepage building story and gallery; full-frame version in photo viewer. |


**Acceptance evidence**

Review full and card crops together. No added floor, room, pool or furniture appears, and the building remains recognisable from the source photograph.

Delivery owner: product lead and engineer.

Evidence: IMG_7665.HEIC; supporting-prompts-v2.json / building-day


## Page 033 - Entrance restoration / arrival recognition

*04 / Image production*

Implemented asset: entrance-restored-v2.jpg, derived from IMG_2465.HEIC.

The entrance image is practical guidance, not simply a decorative courtyard photograph. It should show the black gate, cream gatehouse, boundary wall and paving clearly enough for someone arriving to recognise the location. The SUV and surrounding trees remain in their real positions.

The restoration removes incidental people and improves clarity without widening the compound or adding parking markings. Keep the original ornamental gate design; invented signage or a redesigned entrance could actively misdirect visitors. Fine paving reconstruction is acceptable only when it does not alter the route or boundary.

The card crop is centred higher than a car-focused crop so the gatehouse and gate remain visible. Provide the full portrait through the image inventory and retain a separate original parking photo for context.


| Contract | Detail |

| --- | --- |

| Locked features | Gate design, gatehouse door/windows, wall, courtyard proportions, trees and SUV. |

| Allowed changes | Light balancing, sensor cleanup and removal of the incidental visitors. |

| Arrival use | Gate photo supports directions; it does not establish a surveyed map coordinate. |


**Acceptance evidence**

A venue representative recognises the arrival area. The card crop retains the gate and gatehouse, and no caption claims an exact map pin has been verified.

Delivery owner: product lead and engineer.

Evidence: IMG_2465.HEIC; photos.json / entrance


## Page 034 - Bar-screen restoration / useful atmosphere

*04 / Image production*

Implemented asset: bar-screen-restored-v2.jpg, derived from IMG_4765.jpg.

The real bar photograph establishes a wall-mounted screen, bottle shelf, hanging glasses and low-light interior. The restoration lifts the shadows enough to read the setting while preserving its subdued atmosphere. It supports the table story and gallery without asserting any future match schedule.

Generated retouching can reconstruct tiny broadcast text and bottle details imperfectly. The source photograph remains authoritative for such details; the website caption describes football viewing generally rather than using the image as proof of a named fixture, score or stock list.

Review the television position, shelf geometry and surrounding materials. Do not add a second screen, new seating, premium bottles or plated food. The asset should communicate the existing space rather than an idealised sports bar.


| Contract | Detail |

| --- | --- |

| Locked features | Single screen, wall position, shelf, mesh, hanging glasses, ceiling and ornamental leaves. |

| Allowed changes | Moderate shadow recovery, noise cleanup, reduced screen bloom and incidental-person removal. |

| Copy boundary | Football on the bar screen; call to check the match programme. |


**Acceptance evidence**

The bar layout matches the source. No fixture, score, equipment count or food claim depends on fine generated image detail.

Delivery owner: product lead and engineer.

Evidence: IMG_4765.jpg; supporting-prompts-v2.json / match-viewing


## Page 035 - Night turf restoration / honest darkness

*04 / Image production*

Implemented asset: turf-night-restored-v2.jpg, derived from IMG_4766.HEIC.

The floodlit turf is a distinct customer decision from daytime play. The source shows the enclosed pitch, goal, line markings, brick edge, lawn, bench, parked vehicle and distant lights. The restoration improves usable detail without changing the turf into a larger stadium or adding players.

Keep the sky genuinely dark and the warm lamps believable. Excessive brightening would misrepresent the night atmosphere and flatten the image. Check nets, posts and line intersections for reconstruction errors; regular geometry is often where an attractive generated edit becomes visibly implausible.

The updated card crop retains the goal and enclosure rather than centring only the foreground lawn. The full frame remains available for context. Vegetation texture is a retouched detail, not evidence of a newly landscaped facility.


| Contract | Detail |

| --- | --- |

| Locked features | Pitch perimeter, goal, net perspective, lines, wall, bench and vehicle position. |

| Allowed changes | Noise reduction, restrained shadow recovery, highlight control and incidental-person cleanup. |

| Responsive role | Card for activity choice; portrait for atmosphere; full frame for inspection. |


**Acceptance evidence**

Compare goal, poles and boundary against the original. The pitch size and lighting remain recognisable, with no new amenity or exaggerated stadium treatment.

Delivery owner: product lead and engineer.

Evidence: IMG_4766.HEIC; photos.json / turf-night


## Page 036 - The responsive image pipeline

*04 / Image production*

Proposed contract: export only useful widths, preserve crop intent and give every format a working fallback.

The existing prepare_photos.py pipeline reads source metadata, applies crops and writes content-hashed AVIF and JPEG variants. It creates a small placeholder, average colour and intrinsic dimensions. The recent native-width cap avoids upscaling a restoration merely to satisfy a requested 1600px width.

Keep crop decisions in photos.json rather than hidden in page-specific CSS. Each asset needs an alt description, source, crop ratios and focal points. Use --only for selected images so unrelated exports remain stable. For each placement, make sizes describe the actual display width and choose a mobile crop only when it improves the subject.

Compression should be assessed at the rendered size, with gradients, glass, netting and dark scenes checked carefully. Higher quality can increase bytes without improving recognition. Strip location and camera metadata from public derivatives. Intact originals remain in the source archive; a public repository still exposes tracked originals, so rights and metadata need an explicit review.


| Contract | Detail |

| --- | --- |

| Existing encodes | AVIF quality 62 and JPEG quality 84; review actual visual result and byte size. |

| Width policy | Export requested widths up to native crop width; keep a native final variant; never silently upscale. |

| Integration policy | Fixed dimensions, AVIF source, JPEG fallback, lazy loading below the hero and correct alt text. |


**Acceptance evidence**

Decode every new variant and verify width metadata, aspect ratio, EXIF removal and fallback paths. Inspect card, band, portrait and full crops at real display sizes.

Delivery owner: product lead and engineer.

Evidence: scripts/prepare_photos.py; src/components.js; S04 / MDN picture


## Page 037 - Prompt evaluation and rejection rules

*04 / Image production*

Proposed contract: judge the output against the source and use case, not against attractiveness alone.

Use a two-stage review. First, check invariants: room geometry, floor count, equipment, perspective, product identity and labels. Any material failure rejects the image even if it is visually impressive. Second, assess the finish: light, texture, edge quality, colour, crop usefulness and visible generation artefacts.

Record one reason for each rejected output and change only the prompt element needed to address it. The earlier turf attempt was rejected for widening the scene; the accepted version used a locked source frame. This shows why detailed constraints matter more than repeatedly asking for a higher tier of quality.

Use a project rubric rather than a claim of guaranteed realism. Rate geometry, source recognisability, material plausibility, composition, artefacts and customer usefulness from one to five. Require full geometry fidelity and no misleading amenities; a high average cannot compensate for an invented facility.


| Contract | Detail |

| --- | --- |

| Hard rejection | New architecture, changed capacity implication, distorted equipment, wrong identity or unsupported room feature. |

| Soft revision | Noise, inconsistent light, oversaturation, crop imbalance or a small texture defect. |

| Review record | Source, prompt, output, reviewer, accepted/rejected status, reason and intended placements. |


**Acceptance evidence**

A reviewer can explain why an output was accepted and what its limitations are. The chosen crop is checked in the actual page, not only in a standalone full-resolution preview.

Delivery owner: product lead and engineer.

Evidence: assets-src/photos/retouch-prompts.json; assets-src/photos/supporting-prompts-v2.json


## Page 038 - The remaining photography commission

*04 / Image production*

Proposed contract: acquire missing documentary coverage before replacing illustrations or adding detailed product claims.

The highest-value missing images are the actual sauna interior, each penthouse bedroom and bathroom, finished dishes and a consented kids-soccer session. These assets answer questions that current exterior and atmosphere photos cannot. Give the photographer a room and product list approved by the owner before the shoot.

Capture truthful wide, medium and detail frames under consistent light. A room wide should show its real proportions; a dish photo should show the portion sold; a children session requires suitable consent and a plan for removal requests. Avoid ultra-wide stretching, temporary decor that will not be present and stock-looking scenes that change the service impression.

Deliver intact originals, selected JPEG previews and a caption sheet mapping each image to the actual package or activity. Only then apply restoration prompts. Missing inputs remain recorded as pending, so a future editor does not mistake a concept brief for an already photographed facility.


| Contract | Detail |

| --- | --- |

| Sauna | One accurate doorway-wide frame, bench/heater detail and owner-confirmed capacity/rules. |

| Accommodation | Room-by-room package map; bed layout, bathroom and balcony access photographs. |

| Food and people | Actual menu items and portions; written usage rights and consent where people are identifiable. |


**Acceptance evidence**

The shot list maps every planned asset to a real subject, rights record and website placement. No generated substitute is presented as documentary coverage of a missing room.

Delivery owner: product lead and engineer.

Evidence: assets-src/photos/IMAGE_PLAN.md; shared/catalog.js


## Page 039 - Prompt / real building exterior

*05 / Image prompts*

Executed reference-restoration prompt. Source: IMG_7665.HEIC. Method: built-in image generation.

Use case: precise-object-edit. Asset type: supporting architecture photograph for the real Social Spot venue website in Akright City. Input image 1 is the edit target and the sole geometry authority. Restore this exact photograph, with the same camera position and portrait framing. Preserve every visible storey, white pergola beam, glass balcony, grey stone-clad column, roofline, window, burgundy foreground plant, parasol and white terrace chair in its real location. Preserve the partially visible rooftop sign exactly as visible; do not invent missing letters, substitute a logo, or complete hidden signage. Improve exposure in the shaded facade, gently neutralise the blue cast, recover glass and concrete detail, smooth compression and sensor noise while retaining true materials and ordinary wear. Keep the real clear daytime sky and lighting direction. Remove only the two incidental people on the balcony and incidental empty bottles where visible; keep furniture and structure unchanged. The result must look like a carefully restored real architectural photograph, not a new luxury resort or a CGI render. No added floors, pool, room, furniture, decorations, palm trees or amenities; no outpainting; no text overlay; no watermark. Output one polished portrait photo, matching the reference composition.

Production review: compare the output with the source before exporting crops. Keep the untouched original and versioned accepted master. The prompt requests invariants; acceptance still depends on visual review, because generated fine detail is not a guaranteed pixel-exact reproduction.


| Contract | Detail |

| --- | --- |

| Source role | One exact edit target locks geometry and camera position; this is not a general style reference. |

| Output role | building-restored-v2.jpg; responsive variants are generated separately by the deterministic crop pipeline. |


**Acceptance evidence**

Reject any changed architecture, new facility or altered product scale. Check visible text and fine regular geometry; describe only facts that remain supported by the original photograph.

Image owner: venue representative and visual editor.

Evidence: IMG_7665.HEIC; assets-src/photos/supporting-prompts-v2.json


## Page 040 - Prompt / recognisable arrival area

*05 / Image prompts*

Executed reference-restoration prompt. Source: IMG_2465.HEIC. Method: built-in image generation.

Use case: precise-object-edit. Asset type: truthful arrival/wayfinding photograph for Social Spot website. Input image 1 is the edit target and the sole authority for venue layout. Restore this exact elevated portrait photograph of the paved courtyard: the black ornamental gate at left, cream flat-roofed gatehouse with its door and two narrow green windows, stone boundary at right, black SUV in the foreground, tree canopy and hillside behind. Keep their positions, size, perspective and proportions unchanged. Remove only the three incidental people and their shadows; naturally reconstruct the small exposed paving and doorway behind them from adjacent real textures. Preserve the SUV, gate, motorcycle if visible, wall, plants and gatehouse. Improve balanced exposure, subtle natural colour, fine paving detail and noise; keep lived-in surfaces. Do not invent a Social Spot sign or change gate lettering, do not widen the courtyard, add parking bays, roads, greenery or buildings. The image must let a visitor recognise the real entrance. No outpainting, no creative remodel, no dramatic sky replacement, no embedded labels, no watermark. Output one portrait photograph matching the reference composition.

Production review: compare the output with the source before exporting crops. Keep the untouched original and versioned accepted master. The prompt requests invariants; acceptance still depends on visual review, because generated fine detail is not a guaranteed pixel-exact reproduction.


| Contract | Detail |

| --- | --- |

| Source role | One exact edit target locks geometry and camera position; this is not a general style reference. |

| Output role | entrance-restored-v2.jpg; responsive variants are generated separately by the deterministic crop pipeline. |


**Acceptance evidence**

Reject any changed architecture, new facility or altered product scale. Check visible text and fine regular geometry; describe only facts that remain supported by the original photograph.

Image owner: venue representative and visual editor.

Evidence: IMG_2465.HEIC; assets-src/photos/supporting-prompts-v2.json


## Page 041 - Prompt / actual bar and screen

*05 / Image prompts*

Executed reference-restoration prompt. Source: IMG_4765.jpg. Method: built-in image generation.

Use case: precise-object-edit. Asset type: supporting bar and football-viewing photograph for Social Spot website. Input image 1 is the exact edit target. Restore the same portrait frame and camera position: single wall-mounted television below the dark bottle shelf, black metal mesh, hanging wine glasses, green-red ornamental leaves above, real cream ceiling, surrounding bottles and warm low-light interior. Improve shadow detail modestly so the shelf and glasses are legible, remove digital noise and harsh screen colour bloom, keep the subdued bar atmosphere. Keep the television size, angle, frame and exact football image with the existing scoreboard unchanged; do not create match text, replace the broadcast, sharpen invented letters, add screens or invent any date or fixture. Remove only the cropped incidental person at the right edge and reconstruct the small dark wall behind them. Preserve bottle positions and labels as photographed without redesigning or promoting labels; no new beverages or food. Keep materials realistic and not glossy. No outpainting, luxury redesign, added seating, people, text overlay, watermark or architecture changes. Output one polished portrait venue photograph matching the reference.

Production review: compare the output with the source before exporting crops. Keep the untouched original and versioned accepted master. The prompt requests invariants; acceptance still depends on visual review, because generated fine detail is not a guaranteed pixel-exact reproduction.


| Contract | Detail |

| --- | --- |

| Source role | One exact edit target locks geometry and camera position; this is not a general style reference. |

| Output role | bar-screen-restored-v2.jpg; responsive variants are generated separately by the deterministic crop pipeline. |


**Acceptance evidence**

Reject any changed architecture, new facility or altered product scale. Check visible text and fine regular geometry; describe only facts that remain supported by the original photograph.

Image owner: venue representative and visual editor.

Evidence: IMG_4765.jpg; assets-src/photos/supporting-prompts-v2.json


## Page 042 - Prompt / actual floodlit turf

*05 / Image prompts*

Executed reference-restoration prompt. Source: IMG_4766.HEIC. Method: built-in image generation.

Use case: precise-object-edit. Asset type: supporting night football-turf photograph for Social Spot website. Input image 1 is the edit target and locks all geometry. Restore the exact elevated portrait photograph, showing the existing fenced artificial turf at lower-left, white goal and line markings, fine enclosing nets, warm strip lights, brick perimeter, narrow lawn and burgundy plants, wooden bench in the foreground, parked black SUV at right and distant city lights under a black sky. Keep every pitch boundary, pole, goal, net perspective, bench and SUV where it is. Lift the pitch and lawn shadows modestly, tame blown-out strip lights, remove sensor noise and improve clear natural detail while retaining genuine night darkness and warm lamp colours. Remove only the cropped incidental visitor at the very bottom-left; preserve the bench. Do not turn this into a stadium, enlarge the pitch, create extra lines, goals, floodlight towers or crowds, add signs, brighten the sky to daylight, or invent any amenity. No outpainting; no text overlay; no watermark. Output one polished portrait photograph with exactly the reference composition.

Production review: compare the output with the source before exporting crops. Keep the untouched original and versioned accepted master. The prompt requests invariants; acceptance still depends on visual review, because generated fine detail is not a guaranteed pixel-exact reproduction.


| Contract | Detail |

| --- | --- |

| Source role | One exact edit target locks geometry and camera position; this is not a general style reference. |

| Output role | turf-night-restored-v2.jpg; responsive variants are generated separately by the deterministic crop pipeline. |


**Acceptance evidence**

Reject any changed architecture, new facility or altered product scale. Check visible text and fine regular geometry; describe only facts that remain supported by the original photograph.

Image owner: venue representative and visual editor.

Evidence: IMG_4766.HEIC; assets-src/photos/supporting-prompts-v2.json


## Page 043 - Prompt / the real sauna after photography

*05 / Image prompts*

Proposed prompt; blocked on a real sauna interior photograph. The current labelled macro remains in use.

Shoot brief: photograph the actual room from the doorway with the whole visible bench layout, heater position, door frame and ventilation. Supply one detail image and an owner-confirmed caption. Keep the room empty, clean and in its normal guest-ready state. Avoid an extreme wide-angle lens that exaggerates capacity.

Use case: precise-object-edit. Asset type: documentary sauna interior supporting image for Social Spot. Input image 1 is the exact edit target and sole authority for room geometry. Restore this same camera position and framing. Preserve the real benches, heater, wood or tile materials, door, vents, room dimensions and number of seats. Improve balanced exposure, modest noise and colour accuracy; retain believable surface texture and ordinary wear. Remove only incidental clutter that is not part of the facility. Do not add benches, spa pools, windows, hidden rooms, towels, decorations or luxury finishes absent from the reference. Do not create heavy steam that hides the equipment. No people, text overlay or watermark. Output one truthful restored photograph matching the reference.

Before use, compare every fixed feature with the source and have the venue confirm the image. A room that merely looks plausible is insufficient; the actual amenity must remain recognisable.


| Contract | Detail |

| --- | --- |

| Required input | A real sauna interior image and owner-confirmed layout/rules; absent from the current archive. |

| Publication rule | Replace the illustrative macro only after the documentary image passes review and all placements update. |


**Acceptance evidence**

The source and output show the same room, seating and heater. Remove the illustrative label only from the new documentary asset, preserving the old asset category in the registry.

Image owner: venue manager; photography owner: commissioned photographer.

Evidence: assets-src/photos/IMAGE_PLAN.md


## Page 044 - Prompt / bedroom and bathroom fidelity

*05 / Image prompts*

Proposed prompt; blocked on room-by-room photographs and a package inventory signed off by the owner.

Shoot brief: capture each actual bedroom from two useful corners, the bed and storage details, and the associated bathroom. Label the room identifier and which packages include it. Photograph real bedding, furniture and balcony access as guests will receive them. Do not use a staged room that belongs to another package.

Use case: precise-object-edit. Asset type: documentary accommodation image for Social Spot penthouse. Input image 1 is the exact room edit target; input image 2, if supplied, confirms materials only. Preserve camera position, room dimensions, bed size and count, window, door, ceiling, floor, furniture and balcony access. Improve natural exposure and fine noise while keeping textile weave, wood, tile and glass realistic. Straighten only minor camera tilt without expanding the room. Remove only incidental temporary clutter identified in the brief. Do not add a bed, ensuite, view, balcony, television, air conditioner, decorative object or luxury material absent from the actual image. No people, embedded labels or watermark. Output one carefully restored photo matching the real room.

The room-to-package mapping is as important as the image finish. Use captions to state factual inclusion, and keep unavailable rooms out of a package gallery.


| Contract | Detail |

| --- | --- |

| Required input | Room IDs, real photos, bed configuration and package inclusion map. |

| High-risk drift | Larger beds, added ensuite, widened floor area or a balcony that the package does not include. |


**Acceptance evidence**

A guest can match every gallery image to the selected package. The owner confirms each room and inclusion, and no crop implies access to a closed balcony.

Image owner: accommodation manager and photographer.

Evidence: shared/catalog.js: penthouse packages


## Page 045 - Prompt / actual menu photography

*05 / Image prompts*

Proposed prompt; blocked on an approved menu and photographs of portions prepared by the Social Spot kitchen.

Shoot brief: prepare the dishes exactly as sold, with the actual plate, portion and accompaniments. Photograph a three-quarter hero and overhead comparison under soft natural light. Record dish name, ingredients requiring clear disclosure, price and availability. Use table surfaces from the venue when practical; avoid introducing a restaurant identity from stock imagery.

Use case: precise-object-edit. Asset type: accurate menu product photograph for Social Spot. Input image 1 is the real plated dish and sole authority for food identity and portion. Preserve the number and size of portions, ingredients, garnish, accompaniments, plate, serving vessel and arrangement. Improve neutral light, colour accuracy, fine texture and a clean background while retaining natural food surfaces. Remove only incidental crumbs or stains outside the dish. Do not increase meat quantity, add ingredients, create false steam, change the plate, add a premium side or substitute a different food. Keep perspective and plausible scale. No hands, people, invented branding, text overlay or watermark. Output one polished editorial food photograph faithful to the original serving.

A food image is a product claim. Beautiful retouching must not increase the apparent value beyond the portion the kitchen will actually provide.


| Contract | Detail |

| --- | --- |

| Required input | Approved dish name, actual portion photograph, price and serving inclusion. |

| Publication rule | Match image and menu entry; do not imply generated food is currently sold. |


**Acceptance evidence**

Kitchen staff recognise the dish and confirm portion accuracy. The image, description and price correspond to the same approved menu version.

Image owner: kitchen lead and photographer.

Evidence: Photography commission / page 38


## Page 046 - Prompt / consented kids soccer

*05 / Image prompts*

Proposed prompt; blocked on a real session photograph and appropriate publication consent.

Shoot brief: photograph a real coached session on the existing turf with guardian consent for identifiable children. Capture the activity, coach and equipment naturally, without altering children to create a more attractive scene. Record permitted channels and a removal contact. A wide action frame with minimal identifying detail may serve better than a portrait.

Use case: identity-preserve. Asset type: documentary kids-soccer activity photograph for Social Spot. Input image 1 is the exact consented session edit target. Preserve each person identity, face, age appearance, body size, skin tone, posture, clothing and position, and preserve the real coach, ball, turf, enclosure and goal. Improve balanced light and modest phone noise only. Keep skin texture natural and movement believable. Do not beautify faces, change bodies, add children, invent actions, change uniforms, replace the coach or enlarge the pitch. Do not remove or add a participant unless the authorised brief explicitly requires it. No text overlay, watermark or dramatic composite. Output one clean restored documentary photograph matching the original session.

The existing turf photograph remains the safe factual supporting asset until a real session is available. Do not generate substitute children and describe them as Social Spot participants.


| Contract | Detail |

| --- | --- |

| Required input | Actual session image, rights/consent record, activity caption and permitted placements. |

| Identity rule | Preserve all photographed identities and body proportions; restrict the edit to restoration. |


**Acceptance evidence**

The accepted image is traced to the real session and rights record. The guardian-facing removal procedure is clear, and no fictional participant appears as a real customer.

Image owner: programme manager and consented photographer.

Evidence: assets-src/photos/IMAGE_PLAN.md


## Page 047 - Preserve the small application architecture

*06 / Frontend engineering*

Proposed contract: improve the existing vanilla application through clear boundaries before considering a framework migration.

The repository already separates shared domain rules, front-end views, backend adapters and a small core. This architecture can serve a focused venue product without a new framework. The first engineering step is to make its responsibilities explicit: views present state, adapters handle transport, the engine owns business rules and the store owns durability.

Avoid moving price calculation or inventory decisions into decorative components. The same rule should be exercised by the server and preview without divergence. When adding an activity, extend a documented contract rather than copying a near-identical flow with slightly different validation. Keep public presentation changes isolated from door and finance operations where their needs differ.

Profile the current bundle before splitting it. A future build can separate staff routes and scanner libraries from the public entry, but only with reliable deep-link and loading-state checks. The goal is less initial work and clearer ownership, not a framework rewrite justified by the word professional.


| Contract | Detail |

| --- | --- |

| Presentation | src/views and shared components render state and gather user input. |

| Transport | backend-http, brochure and preview adapters present consistent capabilities and errors. |

| Domain and storage | shared/engine owns policy; store adapters own persistence and transaction semantics. |


**Acceptance evidence**

For a representative booking, identify one authoritative calculation and one durable write boundary. A public design change does not modify staff permissions or booking policy accidentally.

Delivery owner: product lead and engineer.

Evidence: src/core.js; shared/engine.js; server/store.js


## Page 048 - Route lifecycle and asynchronous state

*06 / Frontend engineering*

Proposed contract: route changes must cancel or ignore obsolete work and release owned resources.

The custom router mounts views and supplies cleanup hooks. Extend this discipline to fetches, timers, observers, photo dialogs, scanner streams and temporary listeners. A slow request from a previous route must not overwrite the new route, restore a removed dialog or show an unrelated error after navigation.

Use an abort controller or route-generation token around asynchronous work. The response may still arrive after the user changes direction; check ownership before rendering it. Keep submit state bound to the current form and preserve recoverable input when an operation fails. A navigation should not leave body scrolling locked because a gallery or menu was removed unexpectedly.

Measure the repeated-route experience: open home, a booking page, the gallery, admin and back again. Watch active listeners and pending timers. Keep global preferences and shell behaviour installed once, while view-specific resources belong to the route. Tests should exercise rapid navigation during a delayed request, not merely steady-state pages.


| Contract | Detail |

| --- | --- |

| Resource ownership | Every observer, timer, event subscription and stream has a cleanup action. |

| Stale response rule | Only the current route or form generation may apply a response. |

| Navigation outcome | Dialog closes, scroll lock releases and focus lands on meaningful new content. |


**Acceptance evidence**

Delay an availability request, navigate away and return. No stale content appears and repeated cycles do not increase listener count, camera activity or scroll locks.

Delivery owner: product lead and engineer.

Evidence: src/core.js; src/motion.js; src/photo-viewer.js


## Page 049 - Environment and capability discovery

*06 / Frontend engineering*

Proposed contract: the interface should use explicit service capabilities rather than infer readiness from an empty API string.

The current startup attempts the HTTP backend and falls back to a brochure backend when the server is absent. The brochure exposes site facts and a synthetic availability calculation while rejecting mutations. This keeps pages visible, but the interface must not treat the empty store as actual live stock.

Add a versioned capability object to the site response: operating mode, enabled booking types, payment readiness, ticket sales readiness, notification status and public support contact. Treat it as public non-sensitive configuration. Use it to decide which actions and stock messages are appropriate, while the server remains authoritative for every mutation.

Distinguish a deliberately disabled service from a transient outage. An outage should retain useful known content and offer retry or call; it should not silently replace real availability with an empty demo store. The same page can present the same visual design with different honest actions according to capability.


| Contract | Detail |

| --- | --- |

| Suggested fields | apiVersion, mode, bookingsEnabled, enabledTypes, paymentsReady, ticketSalesReady and supportPhone. |

| Brochure UI | No live stock claims; call-to-reserve with activity-specific information. |

| Outage UI | Known facts remain; unavailable operation explains the failure and offers a safe next step. |


**Acceptance evidence**

Test intentional brochure mode, reachable staging, disabled sales and network outage. Each exposes correct controls without false availability or accidental test transactions.

Delivery owner: product lead and engineer.

Evidence: src/boot.js; src/backend-brochure.js; src/backend-http.js


## Page 050 - API contracts and error vocabulary

*06 / Frontend engineering*

Proposed contract: the transport layer should expose stable, versioned responses with useful machine-readable errors.

The HTTP adapter currently expects a JSON envelope with ok and data, or error and code. Keep a documented contract for each RPC method: required input, validation constraints, success payload, permissions, idempotency and failure codes. A view should not need to parse a human error sentence to decide whether a time slot was taken.

Separate validation errors, permission errors, conflicts, rate limits and service failures. Use safe customer messages and a request identifier for support. Staff details, database paths and raw provider errors belong in protected logs rather than public responses. Preserve existing codes where practical and version incompatible changes.

Add client timeouts and an explicit uncertain-result state for mutations. A network timeout after submission can mean the booking was saved even though the response was lost. Automatic blind retry is unsafe until the operation has an idempotency key and a lookup path for its outcome.


| Contract | Detail |

| --- | --- |

| Request contract | Method, schema version, validated fields and optional idempotency key for mutations. |

| Response contract | Stable envelope; durable identifier; current state; safe error code and support request ID. |

| Retry contract | Reads can retry within bounds; writes require idempotency or an outcome check first. |


**Acceptance evidence**

Contract tests cover success, conflict, invalid fields, forbidden action, timeout and malformed response. The UI offers the right recovery action for each category.

Delivery owner: product lead and engineer.

Evidence: src/backend-http.js; server/index.js; shared/engine.js


## Page 051 - Forms that preserve intent

*06 / Frontend engineering*

Proposed contract: users should enter only necessary data, receive specific errors and recover safely after failure.

The shared contact component collects name, phone, optional email and optional marketing consent. Keep these fields understandable and use correct autocomplete and input modes. Activity-specific data belongs beside the decision it affects: people count near a sauna slot, dates near a stay package and duration near turf selection.

Validation must happen on both client and server. Client validation helps the visitor correct errors quickly; server validation establishes the actual rule and price. Preserve valid values when one field fails and move attention to a concise error summary or the relevant field. Associate errors with inputs so assistive technology can explain them.

Do not clear a form after a network failure or show a success state until the response establishes a durable result. For uncertain writes, provide an outcome-check action with the same idempotency key. Optional marketing permission stays unchecked and must not be required to reserve or receive essential service messages.


| Contract | Detail |

| --- | --- |

| Field design | Visible labels, sensible defaults, clear units, optional status and minimal personal data. |

| Error design | Specific field error plus useful summary; retain user input and focus correctly. |

| Submit design | Busy state prevents duplicate taps; uncertain results use lookup rather than blind creation. |


**Acceptance evidence**

Submit invalid and valid data, interrupt the connection and retry. Required corrections are obvious, input survives and only one durable reservation results.

Delivery owner: product lead and engineer.

Evidence: src/components.js: contactFields; src/views/booking.js; shared/engine.js: validContact


## Page 052 - Photographs and the enlarged viewer

*06 / Frontend engineering*

Proposed contract: image enhancement must preserve accessible controls and a lightweight route experience.

The current photo helper outputs responsive picture elements with AVIF and JPEG, intrinsic dimensions, placeholders and mobile crops. The viewer uses a native dialog, previous/next controls, arrow keys, Escape and focus return. Preserve this complete behaviour when expanding the gallery or changing photo inventory.

The view should load the appropriate full image when opened, not download every master on the initial page. Keep alt text, title and illustrative note in the viewer. Do not duplicate captions into an overlong accessible name. Maintain a direct highest-quality JPEG fallback when the required dialog API is absent.

A failed image should leave a readable caption and usable controls. Photo navigation must not trap a user on a loading state. Closing the viewer releases body scroll and restores focus to its opener when still connected. Route changes should remove the viewer and its listeners even if the image request is pending.


| Contract | Detail |

| --- | --- |

| Current gallery | Eleven source-linked photographs/illustrative details in the supporting-image release. |

| Viewer lifecycle | Open -> decode -> navigate -> close -> focus return; route cleanup is mandatory. |

| Failure path | Caption, close action and direct JPEG fallback remain useful after a failed decode or unsupported API. |


**Acceptance evidence**

Exercise keyboard navigation, Tab wrapping, Escape, a missing image, route change and older-browser fallback. The sauna disclosure remains visible in every relevant view.

Delivery owner: product lead and engineer.

Evidence: src/components.js; src/photo-viewer.js; src/views/public.js


## Page 053 - Static routes and discoverable content

*06 / Frontend engineering*

Proposed contract: public information should remain understandable to crawlers, shared-link previews and users whose JavaScript fails.

The build currently produces index.html, a 404 fallback and a hashed app bundle. Client-side routes provide the interactive experience, but a single static document can limit route-specific titles, descriptions and previews. Audit what a crawler and messaging preview actually receive before assuming every route has distinct discoverable content.

A practical next step is deterministic prerendering of public informational routes from the approved catalogue. Emit correct titles, descriptions, canonical URLs, social images and basic readable content, then attach interactive behaviour. Do not prerender private ticket tokens, staff views or synthetic live availability. Keep price and event metadata tied to the same source version.

Implement this as an incremental build change rather than a wholesale application migration. Test root-domain and project-path hosting, direct links and the 404 fallback. A static form must not suggest that it can submit without the transaction service; retain a usable phone action in the basic page.


| Contract | Detail |

| --- | --- |

| Candidate routes | Home, activity overview, selected amenity information, event and quiz information. |

| Excluded content | Private token pages, staff data, customer details and live resource allocation. |

| Build contract | Route metadata, canonical base and visible facts come from approved configuration. |


**Acceptance evidence**

Fetch each public route without executing JavaScript and inspect title, core content, contact action and sharing metadata. Direct navigation still works after deployment.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; 404.html; src/views/public.js


## Page 054 - Build reproducibility and asset ownership

*06 / Frontend engineering*

Proposed contract: the committed public build must correspond to the reviewed source and configuration.

The build copies brand assets, generates font CSS and asset manifests, bundles JavaScript and writes content-hashed public files. Keep this process deterministic enough to explain which input changed an output. Generated files should never be edited manually because the next build would overwrite the correction.

Record the Node version, lockfile, build command and public URL for each release. Use a clean checkout and install pinned dependencies before building in CI. The build must preserve config.js intentionally; configuration changes need their own review and production verification. Source photos remain under assets-src, while only the selected derivatives are publicly served.

If future route splitting or prerendering changes the build topology, update the server allowlist, static-host tests and deployment workflow together. Remove obsolete hashed assets only after the new entry document is ready, and consider visitors who still hold an older page during rollout.


| Contract | Detail |

| --- | --- |

| Authoritative inputs | src, shared catalogue, photo metadata, source assets and dependency lockfile. |

| Release evidence | Exact commit, tool versions, build command, output manifest and deployment result. |

| Mutation rule | Change source then rebuild; preserve approved configuration and test both host layouts. |


**Acceptance evidence**

A clean build reproduces the expected public files, loads at / and /social-spot/, and contains no server code, original photo archive or private data in its served paths.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; server/index.js: isPublic; package.json


## Page 055 - Deployment topology and persistence

*07 / Backend engineering*

Proposed contract: choose a hosting topology that gives the transaction server a persistent database and a controlled public address.

GitHub Pages serves the public static site but does not run the Node booking server. The repository supports either one service serving both site and API, or a static site calling a separate API. For this project, a single service on a dedicated domain is operationally simpler; a split topology is viable if CORS, canonical URLs, token handling and outage behaviour are deliberately tested.

The database must live on persistent storage that survives deploys and restarts. Run one server process per current database and in-memory mirror. A platform that starts multiple independent replicas against the same file would violate this application assumption even if SQLite itself can manage concurrent connections. Do not enable autoscaling without changing and testing the storage architecture.

Document ownership of the domain, service account, data volume, secrets and backups. Use a separate staging database and merchant test process. Hosting selection and spend remain owner decisions; the plan does not assume a paid provider account has already been configured.


| Contract | Detail |

| --- | --- |

| Single-service option | Dedicated HTTPS service; public site and API share origin; persistent DATA_DIR. |

| Split option | Static frontend plus HTTPS API; explicit origin policy, service capabilities and support fallback. |

| Current constraint | One process owns one database and mirror; no horizontal replicas until the design changes. |


**Acceptance evidence**

Create a staging record, deploy and restart, then confirm the record persists. Verify direct links, HTTPS, private-file exclusion and public URL generation on the selected topology.

Delivery owner: product lead and engineer.

Evidence: README.md; server/index.js; server/store.js; S08 / GitHub Pages


## Page 056 - Atomic writes beyond the application lock

*07 / Backend engineering*

Proposed contract: a business mutation commits all related records or none, including its outbox entry.

The engine mutex serialises writes inside one process, while SqliteStore.put commits one row at a time and updates the memory mirror immediately. A crash between an order write and its message write can leave inconsistent state. The mutex therefore provides sequencing but not crash atomicity. Correct this before opening online sales.

Add a transaction boundary to the store contract. Stage changed documents in an operation-local overlay, write all durable changes inside an explicit SQLite transaction, commit, then publish the new mirror state. Rollback must discard both SQL changes and the overlay. Public reads must not observe an intermediate globally mutated mirror while the operation is awaiting another write.

Keep network calls outside the transaction. Build a durable notification intent inside it, then trigger delivery after commit. A process crash after commit but before mirror publication is recovered by reloading the committed database at startup. Fault-injection tests should establish this behaviour at every meaningful write boundary.


| Contract | Detail |

| --- | --- |

| Suggested boundary | store.withTransaction(operation) stages document changes and commits order/booking, history and outbox together. |

| Failure invariant | Thrown validation or database error leaves durable state and visible mirror unchanged. |

| Post-commit work | SMS dispatch, web callbacks and external side effects run only after committed intent exists. |


**Acceptance evidence**

Inject failures after each staged write and around COMMIT. After restart, observe either the complete old state or complete new state, never an allocation without its required ledger/history intent.

Delivery owner: product lead and engineer.

Evidence: server/store.js; shared/engine.js; S06 / SQLite transactions


## Page 057 - Idempotency and uncertain outcomes

*07 / Backend engineering*

Proposed contract: retrying the same customer operation must return its existing result without creating another allocation.

A customer can double-tap, reload or lose the response after a successful write. A busy button helps but does not solve transport uncertainty. Introduce durable idempotency records for order creation, booking creation, payment submission and sensitive operator actions. Keep the key, input fingerprint and result identity in the same transaction as the business change.

The client creates a high-entropy key once for an intended operation and keeps it until an outcome is known. Repeating the same key and equivalent payload returns the prior result. Reusing the key with different material fields is a conflict, not a new operation. Scope staff keys to the authenticated actor and method; protect anonymous outcome keys as opaque capabilities rather than analytics identifiers.

Define retention and lookup behaviour explicitly. Expiring an idempotency record too soon can recreate a booking after a delayed retry. Retain enough evidence for the customer workflow and support period, and avoid logging raw outcome keys or returned private tokens.


| Contract | Detail |

| --- | --- |

| Suggested record | Operation scope; opaque key hash; payload hash; resource ID; result state; created/expiry timestamps. |

| Atomicity rule | Business change and idempotency result commit together; no success record points to a missing allocation. |

| Retry UX | An uncertain response offers Check outcome using the original key, then retries only when safe. |


**Acceptance evidence**

Send concurrent identical requests, lose a response and retry after restart. Exactly one resource exists and each accepted retry returns the same durable identity.

Delivery owner: product lead and engineer.

Evidence: src/backend-http.js; shared/engine.js; server/store.js


## Page 058 - Data model and integrity boundaries

*07 / Backend engineering*

Proposed contract: document relationships should be explicit even while the first production version uses a JSON document table.

The current store keeps collections in one docs table with a composite primary key. Orders embed passes and payments; bookings embed contact, details, payment and history; scans and outbox messages are separate. Inventory is calculated from those documents. This is manageable at current scale, but important uniqueness and relationships need an explicit enforcement strategy.

Document invariants for resource identity, transaction IDs, pass codes, booking codes and notification deduplication. The application checks several of these by scanning documents. Keep them under the transaction boundary and add focused database-backed indexes or auxiliary constraint tables where needed. A wholesale relational migration is optional until measurements or integrity requirements justify it.

Avoid treating the memory mirror as an uncontrolled mutable cache. Return cloned or immutable read values and stage updates through the store. Define which data is a source of truth and which is derived, so a dashboard count does not become another independently editable field that can disagree with inventory.


| Contract | Detail |

| --- | --- |

| Sources of truth | Approved settings, durable orders/bookings, verified payment ledger and admission history. |

| Derived data | Availability, dashboard counts, current release, remaining places and customer summaries. |

| Constraint candidates | Unique provider transaction reference, current pass code, booking code and idempotency scope/key. |


**Acceptance evidence**

Attempt duplicate identifiers and corrupted relationships in staging. The system rejects or flags them before they can produce a second allocation or payment credit.

Delivery owner: product lead and engineer.

Evidence: server/store.js; shared/engine.js; shared/memstore.js


## Page 059 - Money, price snapshots and schema versions

*07 / Backend engineering*

Proposed contract: historical bookings retain the agreed price and currency even when the public catalogue changes.

The catalogue uses UGX for most activities and USD for penthouse packages. Keep currency explicit throughout forms, records, exports and payment review. Do not silently sum different currencies or assume that a USD quote can be paid using an unrecorded exchange rate. Any conversion requires an approved rate and a captured source/date in the agreement.

Store the selected product key, price version, unit rate, quantity, currency and total at creation. Later catalogue changes affect new bookings, while historical records preserve their accepted basis. Use a documented integer minor-unit convention for new money records and an explicit migration for existing integer-dollar stay prices, rather than inferring scale from a number.

Add schemaVersion to durable records and migration metadata to the database. Migrations should be repeatable, backed up and verified against counts and totals. Reject unsupported versions with an operator-facing message instead of accepting partially understood records or silently discarding fields.


| Contract | Detail |

| --- | --- |

| Money contract | Integer amount, documented scale, currency, unit, quantity, price version and captured total. |

| Price change rule | Existing agreement is preserved; corrections use an audited adjustment rather than overwriting history. |

| Migration contract | Versioned transformation, pre/post checks, backup reference and rollback compatibility decision. |


**Acceptance evidence**

Change a staging rate after creating a booking. The old record retains its total and new bookings use the new rate. Exports keep currencies separate and migration totals reconcile.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: bookingCreate and recalc


## Page 060 - Time, deadlines and deterministic clocks

*07 / Backend engineering*

Proposed contract: all business dates use East Africa Time and tests can control the server clock.

The domain helpers already model East Africa Time and accept an injected clock in the engine. Preserve this single interpretation for release openings, holds, gym sessions, sauna slots, stay nights and transfer deadlines. Browser locale formatting must not alter the underlying booking date or cutoff.

Store event instants as unambiguous timestamps and local business dates as documented YYYY-MM-DD values where appropriate. A stay night is a date-based allocation; a payment hold is an instant. Keep these types distinct. Show the relevant timezone in event and deadline context when a visitor may be outside Uganda.

Use the server as the authority for availability and deadline decisions. The client can display a countdown with clock-skew information, but cannot extend a hold by changing its clock. Test exact boundaries: one millisecond before and at expiry, midnight release opening, rate change at 18:00 and checkout date exclusion.


| Contract | Detail |

| --- | --- |

| Clock authority | Engine clock for policy; client countdown is display only and cannot grant eligibility. |

| Date semantics | Stay interval [check-in, check-out); hourly slots use local date plus defined time. |

| Boundary coverage | Release opening, hold expiry, transfer cutoff, past slots and event end are tested explicitly. |


**Acceptance evidence**

Run the same scenarios with browsers in different timezones and shifted local clocks. Server outcomes remain identical, and displayed local business dates do not drift.

Delivery owner: product lead and engineer.

Evidence: shared/util.js; shared/engine.js: clock parameter


## Page 061 - Backups that can actually restore service

*07 / Backend engineering*

Proposed contract: recovery must include the database, configuration and authentication material needed to resume operations.

The current admin JSON backup excludes staff records and is a useful export, not a complete system recovery package. The SQLite database and session secret or approved replacement procedure are separate concerns. A copied active database file is also not automatically a consistent backup when WAL writes are in progress.

Choose a consistent SQLite backup method supported by the deployed runtime, then store encrypted copies outside the service volume. Include a versioned configuration manifest and a protected access-recovery procedure. Keep backup contents out of the public repository and ordinary message channels because they contain customer data and private links.

Propose recovery objectives for owner approval: during active ticket sales, no more than 15 minutes of acknowledged-write loss and restoration within 60 minutes. These are targets to validate, not current capabilities. A stricter ticket-night objective may require more frequent snapshots or a different architecture. Only a timed restore drill can establish whether the selected approach meets the target.


| Contract | Detail |

| --- | --- |

| Recovery inputs | Consistent DB snapshot, schema version, deployment version, config manifest and secret/account recovery plan. |

| Backup checks | Successful creation, checksum, age, encryption/access controls and off-volume availability. |

| Restore drill | Restore into an isolated service; reconcile inventory, payments, staff access and private links before reopening. |


**Acceptance evidence**

An operator restores a selected backup on a fresh service within the approved objective. Counts and financial totals reconcile and no customer-facing operation resumes before verification.

Delivery owner: product lead and engineer.

Evidence: server/store.js: dump; server/index.js: admin.backup; S07 / SQLite backup


## Page 062 - Observability and scale thresholds

*07 / Backend engineering*

Proposed contract: measure service behaviour and establish a migration trigger before changing the architecture.

The current engine scans document collections and the store loads them into memory at startup. This is acceptable only within a measured operating envelope. Track record counts, memory, startup duration, mutation queue wait, database write latency, request latency and error categories. Event-day bursts matter more than an average quiet-day request.

Create structured, redacted logs with a request ID and operation name. Track read-only health separately from write readiness and notification backlog. A healthy HTTP process can still have a full disk or a broken payment workflow. Alert on meaningful conditions that an operator can act on, such as write failures or growing undelivered confirmations.

Set a review trigger when measured latency, memory or recovery time exceeds the approved budget. At that point evaluate indexed queries, reducing the mirror, separate worker ownership or a relational service. Do not introduce replicas, queues and distributed coordination merely because they sound advanced; each additional component needs a failure and operating model.


| Contract | Detail |

| --- | --- |

| Initial measurements | p50/p95 latency, queue wait, write failures, memory, disk capacity, startup and outbox age. |

| Proposed load gate | Expected campaign/event burst plus a defined safety factor, on production-like infrastructure. |

| Scale decision | Measured constraint, options, migration cost, data-integrity impact and recovery consequences. |


**Acceptance evidence**

A load rehearsal produces a report with limits and bottlenecks. Alerts contain an actionable runbook and no customer token, payment secret or unnecessary personal information.

Delivery owner: product lead and engineer.

Evidence: server/index.js; server/store.js; S12 / OWASP logging


## Page 063 - Booking states and formal invariants

*08 / Booking domain*

Proposed contract: status transitions must express real allocation and service decisions, with rules for every exit path.

The engine uses requested, confirmed and checked_in as live booking states, with completed, cancelled and no_show as other outcomes. Requested gym, penthouse and table records currently participate in the live set. The owner must understand that requested can reserve inventory even before staff approval, particularly for penthouse nights.

Write a transition table for each activity. A valid transition names the actor, precondition, allocation effect, payment effect and notification. Cancellation, rejection and expiry need explicit policies; a request cannot remain a permanent hold simply because no one reviewed it. Keep booking status and payment status separate because confirmed does not necessarily mean paid.

Define core invariants: allocation never exceeds capacity; a cancelled record no longer consumes a resource; quoted totals match captured rates; only allowed actors change state; a transition is durable with its history. Check these after every mutation in property-based and fault-injection tests.


| Contract | Detail |

| --- | --- |

| Suggested invariant | For each resource interval, sum of active allocation units <= approved capacity. |

| Transition record | Previous state, next state, actor, reason, timestamp, allocation and payment consequences. |

| Policy input | Owner defines request timeout, cancellation rules, payment deadlines and staff confirmation authority. |


**Acceptance evidence**

Exercise every allowed transition and attempt forbidden transitions. Allocation totals remain valid, history is complete and the customer sees an accurate final state.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: BOOKING_LIVE and adminUpdateBooking


## Page 064 - Turf intervals and private hire

*08 / Booking domain*

Proposed contract: only one private booking owns an hour, and open soccer sessions remain unavailable for private hire.

The current turf model uses hourly slots from the configured opening time to closing time. A selection must contain adjacent hours and no more than the configured maximum. Day and night rates are selected by the slot start time, with the default night boundary at 18:00. Open-session periods are not private availability.

Treat allocation as a transaction: recalculate the selected slots at commit time, then insert the booking and related history together. A stale availability page cannot grant a right to the hour. If one selected slot is taken, reject the whole requested block and offer current alternatives rather than silently shortening the booking.

Define maintenance closures and exceptional dates without overwriting recurring rules. Staff should be able to close a slot with a reason, and reopening should not conflict with an existing booking. Do not infer pitch dimensions or the number of simultaneous teams from the photo; the catalogue establishes one exclusive hourly resource.


| Contract | Detail |

| --- | --- |

| Current defaults | 07:00-23:00; day UGX 50,000/hour; night UGX 70,000/hour; maximum three adjacent hours. |

| Overlap invariant | Two active private bookings may not share the same local date/hour resource key. |

| Special sessions | Wed-Fri 19:00-23:00 are open soccer by default and block private allocation. |


**Acceptance evidence**

Submit overlapping and adjacent requests concurrently, including a day/night boundary and open-session hour. One conflicting block succeeds at most once; totals match per-slot rates.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: turfSlots


## Page 065 - Sauna capacity by session

*08 / Booking domain*

Proposed contract: every accepted session respects its person capacity and prices adults and children explicitly.

The current sauna catalogue defines six places per slot and adult/child rates. Availability derives from active bookings for the date and time. A customer chooses the people count, so the allocation unit is a person rather than one booking. The transaction must recalculate remaining places before accepting the entire party.

Reject fractional, negative or unreasonably large counts at the boundary. The current implementation floors numeric input; a stricter schema should require integers and provide a clear error. Apply the adult and child unit prices from the captured catalogue version, and keep confirmation and payment states distinct.

The owner must approve the operating session length, changeover time, actual safe capacity and age rules. The software default of six is an operational configuration, not independent proof of physical suitability. Do not publish health advice or infer facility rules from the illustrative macro. Add exceptional closures for maintenance and unavailable staff.


| Contract | Detail |

| --- | --- |

| Capacity invariant | Sum(adults + children) across active bookings for one slot <= approved capacity. |

| Price invariant | Total = adult count x adult rate + child count x child rate in UGX. |

| Policy input | Real capacity, age rules, session duration, maintenance and cancellation/late-arrival handling. |


**Acceptance evidence**

Race two parties for the final places, test exact capacity and malformed counts, then cancel one booking. The released capacity becomes available and price evidence remains intact.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: saunaSlots


## Page 066 - Penthouse nights and package exclusivity

*08 / Booking domain*

Proposed contract: accommodation allocation must match the real physical resource model, not just the package names.

The current engine blocks penthouse nights across all packages. This conservative rule prevents two packages from sharing a night, even if one is a small room. Keep it until the owner confirms whether rooms can operate independently and which shared spaces or balconies each package requires.

A stay allocates dates in the interval [check-in, check-out). Validate the booking horizon, maximum nights and package guest limit. Create the request and night allocation atomically, and define how long a requested stay remains reserved without staff approval or payment. Do not allow an unreviewed request to block the calendar indefinitely.

If independent room sales are introduced, model real resource IDs and package resource sets. A full-floor package conflicts with every included room; a master-room package conflicts only with the resources it consumes plus any exclusive shared space. Test these intersections before changing the public availability language.


| Contract | Detail |

| --- | --- |

| Current rule | All five packages compete for the same penthouse night resource. |

| Night semantics | Check-out date is excluded; back-to-back stays can share a boundary date. |

| Possible future model | Package -> explicit room/shared-space resource set; owner-approved exclusivity and turnover rules. |


**Acceptance evidence**

Test overlapping dates, boundary dates, each guest limit and full-floor versus room conflicts. No package is sold on the basis of unconfirmed independent-room assumptions.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: penthouseNights


## Page 067 - Gym passes and membership lifecycle

*08 / Booking domain*

Proposed contract: a requested pass should become a service entitlement with an explicit period and activation rule.

The catalogue offers gym-only and combined gym/sauna plans for day, month and year periods. The current booking creates a requested record with the chosen start date, plan and session. It does not by itself establish a complete membership entitlement model, usage ledger or loyalty redemption process.

Define activation and expiry with the venue: whether a monthly plan starts on the selected date or first attendance, whether sauna access requires a separate slot, and whether morning/evening selection restricts access. Capture the agreed rules in the plan version and confirmation rather than leaving staff to interpret them differently.

For the advertised nine paid sessions and tenth free, define eligible activities, verified payment basis, customer identity, redemption and reversals. Do not count an unpaid request as a loyalty visit. Start with a transparent staff-managed ledger if automation is not yet specified, and ensure corrections preserve an audit trail.


| Contract | Detail |

| --- | --- |

| Entitlement fields | Plan/version, activation date, expiry rule, included services, access restrictions and status. |

| Payment dependency | Activation depends on the approved policy and verified payment, not a typed transaction ID alone. |

| Loyalty dependency | Owner-approved eligibility, completed/paid usage record, one redemption and reversal handling. |


**Acceptance evidence**

Staff and customer calculate the same expiry and inclusions for example day, month and year plans. A cancelled or unpaid request does not earn a paid-session reward.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js: gym and loyalty; shared/engine.js: gym branch


## Page 068 - Kids soccer and Quiz Night capacity

*08 / Booking domain*

Proposed contract: recurring activities need date-specific limits, accurate registration and privacy-conscious participant data.

Kids soccer defaults to Saturday, capacity forty and a six-week horizon, with coached and kids-only prices. Quiz Night defaults to Saturday 20:00, twenty teams and two to six players per team. These settings should be confirmed by the owner before activation, particularly the blank kids-session time currently in the catalogue.

For kids registrations, collect only what the operating team requires. The current flow records child name and age with the guardian contact. Any additional safety or emergency information needs an approved purpose and restricted access. Photography consent is separate from the permission to register and should never be inferred from attendance.

Quiz registration must check team-name uniqueness for the selected night, capacity and duplicate contact registrations. Normalisation should be defined so case changes or extra spaces do not create confusing duplicates. Brochure pages must not display synthetic remaining team counts as live inventory; use programme facts and a call action instead.


| Contract | Detail |

| --- | --- |

| Kids contract | Valid Saturday, approved session time, age range, option, guardian contact and remaining places. |

| Quiz contract | Date, normalised team name, two-to-six players and no duplicate team/contact registration. |

| Privacy boundary | Participant service data and photography/marketing permission remain separate records. |


**Acceptance evidence**

Test the last registration, duplicate name variants, cancelled capacity release and missing session time. Staff can identify the correct guardian without exporting unnecessary child details.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: kids and quiz branches


## Page 069 - Table requests and staff confirmation

*08 / Booking domain*

Proposed contract: requested seating must remain a request until staff can promise the arrangement.

The current table flow accepts an arrival time within the configured range and party size of one to thirty, creates a requested record and charges zero. It does not model physical table inventory or seating duration. Preserve truthful request language until the owner supplies the seating map and operating policy.

Staff review needs a practical queue sorted by date and time, with party size, occasion and contact. Confirmation should capture the agreed arrangement and notify the customer. Declining should provide a reason or alternative without deleting the record. Define how changes to date, time or party size are revalidated.

If automatic seating is later desired, introduce table IDs, capacities, combinable sets and time intervals. A free-form party-size limit is not enough to establish available seats. Event lounge tables are a different product with paid packages and fixed inventory; do not merge them with ordinary dining requests.


| Contract | Detail |

| --- | --- |

| Current contract | Date, 12:00-21:30 arrival range, one-to-thirty party, occasion, contact and requested state. |

| Staff action | Confirm or decline with actor/time/reason; customer receives the actual arrangement. |

| Future allocation | Physical table map, seating duration, combinations and closure rules supplied by the venue. |


**Acceptance evidence**

Submit, amend, confirm and decline sample requests. The customer never sees a guaranteed table before the authorised confirmation, and event table inventory remains separate.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js: table; shared/engine.js: table branch


## Page 070 - Cancellations, amendments and allocation release

*08 / Booking domain*

Proposed contract: changes preserve history and apply the same rules as a new reservation.

A customer cancellation and staff cancellation can have different eligibility and financial consequences. Document who may act, the cutoff, refund/credit policy and which allocation is released. The current public flow prevents some late cancellations and asks the customer to call; retain a useful explanation rather than a generic forbidden error.

An amendment to scarce resources is a replacement allocation decision, not an unchecked edit of fields. Revalidate date, availability, capacity, package and price while excluding the existing booking only where appropriate. Commit release of the old allocation and acquisition of the new one atomically, or leave the original untouched if the new choice is unavailable.

Payment adjustments should be ledger entries with reasons and reviewers. Changing the booking total does not automatically refund or collect money. Customer messages must state what changed, whether staff action or balance payment is needed and which confirmation link remains valid.


| Contract | Detail |

| --- | --- |

| Cancellation record | Actor, reason, eligibility, allocation release and separately documented financial outcome. |

| Amendment invariant | Either the complete old allocation or complete new allocation exists; never a partial combination. |

| Support copy | Clear change summary, outstanding balance/credit and correct contact or follow-up action. |


**Acceptance evidence**

Race an amendment against another booking, then simulate failure mid-operation. The original is preserved on failure and totals/history explain every successful change.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: bookingCancel and adminUpdateBooking


## Page 071 - Manual verification and future automation

*09 / Sales and admission*

Proposed contract: the customer must know whether payment is being checked by staff or confirmed by an integrated provider.

The existing product uses merchant-code payment and a submitted transaction ID, followed by staff review against the merchant statement. It is not a live automated payment gateway. Merchant codes are blank in the default catalogue, and the server can require a configured merchant before sales open. Do not activate public payment instructions until ownership and names are approved.

The manual process can be a valid first release when staff response times and reconciliation are defined. A typed ID is a claim, not payment evidence. Staff confirm the actual amount and method, reject incorrect submissions with a reason, and preserve the audit trail. The customer remains in a payment-being-confirmed state until verification succeeds.

Provider automation is a later integration with its own credentials, callback authentication, duplicate handling and reconciliation. Keep the same payment ledger and state vocabulary so automation does not introduce a second incompatible way to decide whether a ticket is paid. Select the provider and current integration contract only after the owner approves the account and operating approach.


| Contract | Detail |

| --- | --- |

| Current model | Customer pays merchant code -> submits ID -> staff checks statement -> verified ledger credit. |

| Owner input | Approved merchant code/name, account access, reviewer, response expectations and dispute procedure. |

| Future model | Authenticated provider event -> idempotent ledger update -> reconciliation -> customer state update. |


**Acceptance evidence**

A controlled payment rehearsal distinguishes submitted, verified and rejected states. No usable paid QR is issued solely because a visitor typed a plausible transaction ID.

Delivery owner: product lead and engineer.

Evidence: src/components.js: payPanel; shared/engine.js: adminVerify; shared/catalog.js: payments


## Page 072 - Payment evidence and duplicate prevention

*09 / Sales and admission*

Proposed contract: the same verified external payment can credit only one intended obligation.

The engine checks transaction ID reuse across orders and bookings. Strengthen this into a durable uniqueness rule under the transaction boundary. Normalisation must be provider-aware and documented; a superficial difference in case or whitespace should not make the same reference reusable, while two providers may legitimately use different reference namespaces.

Store the submitted claim separately from verified evidence: method, normalised reference, payer contact where required, claimed amount, actual received amount, verification actor/time and statement or provider evidence reference. Avoid storing unnecessary screenshots in the public application. If evidence attachments are introduced, give them private access and a retention policy.

Handle partial and excess payments deliberately. The current verifier accepts an actual amount, so the ledger and customer state must explain any remaining balance or credit. Never overwrite a verified payment to correct it; create an audited adjustment or reversal and recalculate the obligation from ledger entries.


| Contract | Detail |

| --- | --- |

| Uniqueness key | Approved provider/account namespace plus normalised external reference. |

| Evidence record | Claimed and received amounts remain distinct; actor, timestamp and verification basis are retained. |

| Correction rule | Audited adjustment/reversal preserves the original verification and prevents double credit. |


**Acceptance evidence**

Submit equivalent ID variants against two obligations and race two reviewers. At most one credit is applied, and any partial or excess amount has an explicit documented outcome.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: txnInUse, adminVerify and bookingSubmitPayment


## Page 073 - Ticket releases and shared capacity

*09 / Sales and admission*

Proposed contract: release inventory and total event capacity must agree at the same commit point.

The catalogue defines Founders, Advance, Final and Door releases. Unsold quantities roll forward and selling out can open the next eligible release. The Door release has an event-night restriction. Price selection must be recalculated at order creation so an old page cannot buy a new release at an obsolete price.

Capacity includes general admission, paid tables and complimentary passes. The baseline release quantities total 300 general tickets; five six-person Signature tables and nine five-person VIP tables add 75 paid guests; planned complimentary allocation adds 75. This reaches the configured 450 threshold. These figures require owner approval and must not be treated as a physical safety certification.

Inventory calculations must include active unpaid holds according to policy, not only paid orders. Creation, cancellation, expiry and payment verification can change commitments. Define a single allocation invariant and enforce it transactionally, including late payments and exceptional staff actions that revive an expired order.


| Contract | Detail |

| --- | --- |

| Current release defaults | 100 at UGX 35,000; 130 at 45,000; 50 at 55,000; 20 Door at 70,000. |

| Capacity invariant | Active committed entry units across all access types <= approved event threshold. |

| Price conflict | Return current release/price and ask the customer to review, rather than silently changing the total. |


**Acceptance evidence**

Test scheduled opening, sell-out rollover, unsold rollover, Door timing and mixed access types near capacity. No path can revive or issue entry beyond the approved limit.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; shared/engine.js: inventory and orderCreate


## Page 074 - Holds, expiry and late payment

*09 / Sales and admission*

Proposed contract: a late payment must not silently reclaim inventory already allocated to another customer.

The current unpaid ticket hold is thirty minutes. Submitting a transaction ID changes the order to awaiting verification and removes the hold deadline; an incorrect submission can therefore retain inventory until staff act. Set an owner-approved verification review deadline and an escalation process so unreviewed claims do not lock stock indefinitely.

The engine flags over_capacity when an expired order submits payment and its previous allocation is no longer available. This flag must become an enforced exception workflow, not merely a warning in the staff UI. Before verification reactivates admission, recalculate capacity and the specific table or release eligibility inside the transaction.

If money arrived but inventory cannot be restored, preserve the received-payment evidence and route the case to authorised staff for an alternative, refund or credit under the approved policy. Do not issue a QR and leave door staff to resolve an oversold promise. The customer needs a clear explanation that the payment was received but fulfilment is under review.


| Contract | Detail |

| --- | --- |

| Expiry rule | Deadline determined by server clock; released inventory can be taken by a later customer. |

| Review rule | Awaiting-verification claims have an approved operational deadline and queue owner. |

| Late-payment rule | Verification rechecks inventory; unavailable fulfilment enters a tracked exception without automatic admission. |


**Acceptance evidence**

Expire an order, sell its last resource elsewhere, then submit and verify the old payment. No extra valid entry is created; the money and exception remain auditable.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: effStatus, orderSubmitPayment and adminVerify


## Page 075 - Event tables, deposits and balances

*09 / Sales and admission*

Proposed contract: a deposit secures the approved table arrangement but does not make every guest pass fully paid.

The event catalogue defines Signature Lounge and VIP Reserved tables, their guest counts, prices and perks. A fifty-percent deposit is allowed until the configured balance deadline. The table record needs its specific ID, package version, total, paid amount, remaining balance and guest-name deadline.

The current pass model distinguishes balance_due from valid. Preserve that distinction so a deposit-only table is sent to the exception desk when its balance is outstanding. A full payment should activate entry only after verification, and repeated verification must not add the same amount twice. After the deposit cutoff, new purchases should clearly require full payment.

Guest-name changes and table transfers can invalidate old codes. Capture actor and reason, apply deadline rules and notify the right contact. Table held-until rules are operational and must be approved by the event team; the software should explain them without inventing an automatic resale policy that staff cannot support.


| Contract | Detail |

| --- | --- |

| Current packages | Signature: five tables, six guests, UGX 1,200,000; VIP: nine tables, five guests, UGX 650,000. |

| Financial state | Total, verified paid amount, deposit threshold, remaining balance and payment history. |

| Admission rule | Balance due is explicit; valid entry follows the approved settled-balance policy. |


**Acceptance evidence**

Rehearse deposit, partial balance, full balance, duplicate submission, name change and a late guest. Staff and customer see consistent table, balance and pass states.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js: event.tables; shared/engine.js: recalc and passState


## Page 076 - QR credentials and transfers

*09 / Sales and admission*

Proposed contract: each current pass code identifies one entitlement and replaced codes can never admit a guest.

The engine creates distinct pass codes and tokens and tracks prior codes when holders change. A QR is a bearer credential: anyone with a usable code may attempt entry. Avoid exposing codes in analytics, search indexing, public screenshots or unrestricted support messages. Private ticket links should carry a restrictive sharing and referrer policy.

A transfer must atomically update the holder, replace the current code and preserve the old-code history. Check the transfer deadline on the server. A response lost after a successful transfer should be recoverable through idempotency, without issuing yet another code on retry. Both customer and door views must agree on the active code.

Distinguish entry credentials from management links. A guest who receives one pass should not automatically receive the whole order control token. Limit what each token authorises and what personal details it exposes. Any support recovery path should preserve this scope rather than returning the broadest available link by convenience.


| Contract | Detail |

| --- | --- |

| Credential scope | Order control, individual pass access and door scan code are separate capabilities. |

| Transfer invariant | Exactly one current code per entitlement; every prior code returns Replaced or invalid. |

| Privacy rule | No indexing or analytics capture of private links/codes; support uses least necessary scope. |


**Acceptance evidence**

Transfer a pass, retry the operation and scan both codes concurrently. Only the new code can admit, the old code is recognised as replaced and unrelated order controls remain inaccessible.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: applyHolderChanges and passIndex; src/qr.js


## Page 077 - Door scanning and admission authority

*09 / Sales and admission*

Proposed contract: a scan result reflects a durable admission decision and stays safe under duplicate requests and capacity pressure.

The door flow checks current/replaced codes, payment state, previous check-in and capacity. It then records admission and a scan event. These related writes must share the transaction boundary. Two phones scanning one code at once should produce one admission and one duplicate result, with no contradictory green responses.

Clarify what the configured capacity counts. The current insideCount counts passes with checkedInAt; there is no complete exit-tracking model. It is therefore not automatically a real-time occupancy system. If re-entry or departures must change occupancy, define a separate owner-approved model rather than using undo to simulate normal exits.

The screen needs a short result, guest/access information and a clear next action. Amber unpaid or balance-due cases go to the exception desk. A scanner must never invent admission offline from a cached paid list; if the network fails, use the approved manual contingency with reconciliation and controlled authority.


| Contract | Detail |

| --- | --- |

| Admission invariant | One current pass receives at most one normal check-in; capacity checked at the same durable decision. |

| Operator states | Admit, already in, replaced, not found, unpaid, balance due and capacity reached have clear actions. |

| Network boundary | No unsynchronised automatic offline admission; documented contingency is owned by the door supervisor. |


**Acceptance evidence**

Rehearse duplicate concurrent scans, the last capacity place, stale codes and a network loss. Every green response corresponds to one durable admission and scan record.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: doorScan and insideCount; src/views/door.js


## Page 078 - Reconciliation and financial exceptions

*09 / Sales and admission*

Proposed contract: the venue can reconcile received money, fulfilled entry and unresolved obligations each day.

Create a daily reconciliation view with provider/account totals, verified ledger amounts, unsettled claims, refunds/credits and exception cases. Keep currencies separate. A ticket sales dashboard should not equate order total with money received or count an awaiting-verification amount as settled revenue.

For each discrepancy, identify the record, external reference, expected amount, received amount, actor and resolution. Use an append-only correction history rather than deleting a problematic order. Overpayments, wrong account payments, charge reversals and money received after expiry require approved handling and customer communication.

Event-day reconciliation should compare issued valid passes, admissions, door sales, complimentary entries and table balances. Export controlled CSVs with formula neutralisation and access logs. The finance lead should sign off the closing report and unresolved cases before the system is handed to the next shift.


| Contract | Detail |

| --- | --- |

| Financial view | Expected obligations, verified receipts, outstanding balances and corrections by currency/account. |

| Exception view | Owner, reason, evidence, customer contact, next action and resolution timestamp. |

| Closing controls | Finance review, controlled export, inventory/admission reconciliation and preserved audit history. |


**Acceptance evidence**

Prepare sample partial, excess, late and duplicate payments. The report reconciles to the ledger and no amount is counted twice or mixed across currencies.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: adminDashboard and adminExport


## Page 079 - Staff workspaces by responsibility

*10 / Staff operations*

Proposed contract: staff should see the tasks they can act on without being encouraged to perform unauthorised operations.

The current application has admin and door roles. Admin covers finance, settings, bookings and management; door handles admission, lookup and door sales. Keep the interface aligned with server permission checks. Hiding a button improves clarity but is not an access-control mechanism.

Separate daily work into queues: new requests, payment verification, upcoming bookings, messages needing action and admission exceptions. Each item should display urgency, relevant facts and the next authorised step. Avoid putting every metric and control on one dashboard with no clear operational priority.

If the team needs a narrower finance, reservations or content role, add it as a documented permission set rather than sharing admin credentials. Account creation and deactivation should be owned by a responsible manager. Staff should be able to recognise their current account and role before performing a high-impact action.


| Contract | Detail |

| --- | --- |

| Current roles | Admin and door; review whether narrower roles are required before expanding the team. |

| Workspace priority | Actionable queues with due time, state, customer context and one primary next step. |

| Access ownership | Named accounts, role assignment, deactivation and a retained active-admin recovery path. |


**Acceptance evidence**

Rehearse the day with one account per role. Each can complete its authorised task and receives a server rejection for out-of-scope RPC calls.

Delivery owner: product lead and engineer.

Evidence: server/auth.js; src/views/admin.js; shared/engine.js: ROLE_RANK


## Page 080 - Booking review and scheduling

*10 / Staff operations*

Proposed contract: staff confirmation must be fast, factual and traceable to the booking record.

A booking queue needs date, time, activity, party size, contact, payment state and request age. Sorting by creation time alone can hide a visit happening today. Provide activity/date filters and clear requested-versus-confirmed labels, with priority for imminent visits and unanswered requests.

A staff member opens the record, checks arrangements and chooses an allowed transition. Confirmation should state the actual activity and time; decline should record a reason or alternative. Amendments should invoke domain validation rather than allowing arbitrary edits that can create overlapping turf hours or penthouse nights.

Avoid requiring staff to reconstruct information from screenshots or separate chats. Keep relevant notes on the record, with sensitive notes restricted. When an offline call produces a reservation, provide a staff-create path that uses the same allocation and validation rules as a public request.


| Contract | Detail |

| --- | --- |

| Queue fields | Activity, date/time, party, status, payment, request age and responsible staff. |

| Decision fields | Action, reason, confirmed arrangements, actor, timestamp and customer notice. |

| Phone bookings | Staff creation uses the same resource checks and price snapshot as online creation. |


**Acceptance evidence**

An operator handles a phone request, confirms a table, changes a turf time and declines an unavailable stay. Each record, customer message and inventory view agrees.

Delivery owner: product lead and engineer.

Evidence: src/views/admin.js; shared/engine.js: adminBookings and adminUpdateBooking


## Page 081 - Payment verification desk

*10 / Staff operations*

Proposed contract: payment reviewers should verify evidence once and resolve ambiguous submissions without unsafe shortcuts.

The reviewer needs the obligation total, claimed method/reference, payer contact, submission time, actual merchant evidence and prior payments. Keep the claimed amount and verified amount visually distinct. A transaction ID should be copyable but should not be treated as proof that the amount shown was received.

Before confirming, check account, method, amount, reference uniqueness and current fulfilment eligibility. A late payment flagged for capacity or table conflict requires the exception workflow. The confirm action should be idempotent and leave a clear history entry. If a second reviewer opens the same item, the UI should refresh its state rather than offer a second credit.

Reject submissions with a short specific reason and a customer next step. A wrong reference can be resubmitted under policy; a received payment with an unavailable resource needs an authorised resolution. Do not encourage staff to edit verified ledger entries or bypass a capacity rule to make the dashboard look clean.


| Contract | Detail |

| --- | --- |

| Review context | Obligation, claim, evidence, account, amount, current allocation and prior ledger. |

| Confirm control | One durable credit, actor/time recorded, latest state checked and duplicate review prevented. |

| Exception control | Late/ambiguous payments remain tracked until finance and fulfilment agree on resolution. |


**Acceptance evidence**

Two staff members review the same sample payment concurrently. Only one credit is recorded and the other sees the updated outcome; a capacity exception cannot become an ordinary valid ticket.

Delivery owner: product lead and engineer.

Evidence: src/views/admin.js; shared/engine.js: adminVerify


## Page 082 - Messages and notification delivery

*10 / Staff operations*

Proposed contract: a durable notification intent should survive failures, while delivery status reflects actual evidence.

The current outbox and SMS adapter queue service messages and can send through Africa's Talking when credentials are configured. Otherwise staff see messages for manual action. Keep essential service notices separate from marketing permission: a booking confirmation is part of the service, while an offer campaign requires the recorded permission and an opt-out process.

Store a deduplication key for each business event and recipient. Commit the intent with the underlying state change, then deliver outside the transaction. Use bounded retries, backoff and a visible failed-message queue. A provider acceptance response means accepted for delivery; it is not necessarily proof that the handset received the message.

External exactly-once delivery cannot be assumed. A provider may accept a message before a network timeout prevents acknowledgement; retry can duplicate it. Use provider idempotency where supported, preserve provider IDs and make customer messages safe when repeated. Staff manual resend must record channel and action rather than erase the original failure.


| Contract | Detail |

| --- | --- |

| Message record | Event/resource, recipient, template version, dedupe key, attempts, provider ID and status. |

| Status vocabulary | Queued, sending/claimed, accepted, failed and delivered only with delivery evidence. |

| Retry policy | Bounded attempts, backoff, operator escalation and safe repeat content. |


**Acceptance evidence**

Simulate failure before send, provider acceptance with lost response and staff resend. The underlying booking stays correct, message history explains each attempt and no status overstates delivery.

Delivery owner: product lead and engineer.

Evidence: server/sms.js; shared/engine.js: enqueue; src/views/admin.js


## Page 083 - Customer records and consent

*10 / Staff operations*

Proposed contract: staff can service customers without converting every operational record into marketing permission.

The current engine derives customer summaries from bookings and orders and stores marketing choices. Keep consent purpose, channel, timestamp and source clear. A customer who registers for an event should receive essential ticket messages; that does not automatically authorise recurring promotional SMS or WhatsApp broadcasts.

Staff search should expose the information needed for the task and restrict bulk exports. Avoid matching customers solely by display names or mixing two people who share a phone. Normalised contact information helps lookup, but corrections need a record so old private links and notifications do not go to the wrong person.

Define retention and deletion handling with the owner and an appropriate privacy review. Financial and operational records may have different retention needs from marketing lists or child-programme details. The software should support a documented response to a correction or removal request without destroying necessary audit history blindly.


| Contract | Detail |

| --- | --- |

| Consent record | Purpose, channel, choice, timestamp, source and withdrawal action. |

| Service access | Task-specific customer context; role-restricted search and bulk exports. |

| Correction process | Verify the request, record the change and review notification/private-link consequences. |


**Acceptance evidence**

Withdraw marketing permission for a sample customer. Promotional selection excludes them while essential service messaging remains correctly tied to their active booking.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: customers and adminBroadcast; src/components.js: contactFields


## Page 084 - Catalogue and content maintenance

*10 / Staff operations*

Proposed contract: staff changes to business facts should be validated, previewed and reflected consistently.

The current admin settings can override catalogue prices, dates and rules. Treat a change as a versioned configuration update with validation and actor history. A mistaken capacity, empty session time or malformed release date can affect allocation, not just page copy. Provide a review summary before committing consequential settings.

Separate image/content production from operational price editing. A venue manager may update a timetable or rate; source-based image restoration and build changes require a controlled repository workflow. Keep the visible public facts and staff configuration tied to a shared version so a brochure build does not remain stale after server settings change.

For dated events, define an archive and rollover procedure. The Replay date and release schedule should not automatically become next year's event merely because the current one ended. Preserve historical orders and event IDs while creating an approved new event configuration.


| Contract | Detail |

| --- | --- |

| Configuration change | Validated values, impact summary, actor/time, version and rollback note. |

| Content maintenance | Named owner for programme, menus, room inclusions, photographs and arrival facts. |

| Event rollover | New event identity and approved dates; historical tickets and financial records preserved. |


**Acceptance evidence**

Change a staging rate and programme item, then review public pages, confirmations and staff views. Invalid or conflicting settings are rejected before they affect allocations.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: adminSaveSettings and validateSettings; shared/catalog.js


## Page 085 - Exports, reporting and controlled access

*10 / Staff operations*

Proposed contract: reports should answer an operating question without leaking private credentials or mixing incompatible values.

The engine provides CSV exports and neutralises spreadsheet formulas. Preserve that protection and define the purpose of each report: finance reconciliation, booking schedule, guest list, admission log or consented outreach. Include only the fields necessary for that purpose and mark the reporting period and configuration version.

Private ticket tokens and booking management links should not appear in ordinary marketing or finance exports. Door backup lists may need codes under controlled event-day access; document who receives them and how they are removed afterwards. Bulk downloads should be audited, with an operator identity and time.

Totals must distinguish expected order value, verified receipts, outstanding balances and refunds/credits, and must separate currencies. A dashboard chart can be attractive while financially misleading if it combines those categories. Validate reports against a small set of records whose results are calculated independently.


| Contract | Detail |

| --- | --- |

| Report definition | Purpose, filters, fields, units, currency, recipient role and retention. |

| Export protection | Formula neutralisation, least data, private-link exclusion and download audit. |

| Reconciliation proof | Independent sample calculation plus checks against durable ledger and inventory. |


**Acceptance evidence**

Export records containing formula-like names, multiple currencies and private tokens. Spreadsheet cells remain data and reports expose only the approved fields and totals.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: adminExport; shared/util.js: toCsv; test/engine.test.js


## Page 086 - Event-day operating rehearsal

*10 / Staff operations*

Proposed contract: staff should rehearse the complete customer and exception paths before the first large crowd arrives.

Prepare named roles for lane scanning, exception desk, finance, table hosts, support and incident coordination. The rehearsal should use production-like devices and network conditions with test records clearly separated from real customers. Include normal entry, deposit balance, replaced code, duplicate scan, invalid code and capacity pressure.

Practice failure handling as deliberately as the happy path. Lose network connectivity, restart a scanner, let a payment response time out and recover a ticket link. Staff should know who can make an exception and which action creates an audit record. A shared password and an informal instruction to admit everyone cannot substitute for a controlled contingency.

End with a reconciliation exercise and a short debrief. Record confusing copy, slow screens, missing data and authority gaps. Update the operating runbook and repeat only the changed high-risk scenarios. The goal is a team that can explain and perform the process, not a one-time demonstration by the developer.


| Contract | Detail |

| --- | --- |

| Rehearsal roles | Door supervisor, lane staff, exception desk, finance reviewer, table host and support owner. |

| Scenario set | Paid, balance due, replaced, duplicate, late payment, network outage and final capacity place. |

| Completion evidence | Operator sign-off, corrected issues, recovery timing and reconciled test ledger/admission totals. |


**Acceptance evidence**

Operators complete scenarios using the written instructions without developer intervention. Any unresolved admission, money or authority defect blocks event activation.

Delivery owner: product lead and engineer.

Evidence: README.md: On the night; src/views/door.js; shared/engine.js


## Page 087 - A threat model for this venue system

*11 / Security*

Proposed contract: protect the assets and abuse paths that actually exist in Social Spot.

The valuable assets are booking inventory, received-payment evidence, entry credentials, staff authority, customer contact data and service continuity. The public brochure has a smaller attack surface than the transaction server. Model the two separately, then model the trust boundary between a static frontend, API, database, staff devices and notification provider.

Identify realistic misuse: hoarding unpaid inventory, reusing a transaction reference, guessing recovery codes, sharing a QR, replaying a staff action, injecting content into notes, stealing a stored bearer token and manipulating rate-limit identity through proxy headers. Consider accidental misuse as well, such as two reviewers confirming a payment or a staff member changing capacity incorrectly.

For each scenario, record the asset, entry point, precondition, existing control, remaining gap and verification. Use OWASP ASVS as a review structure, with versioned requirement mappings where applied. This plan is an engineering blueprint, not a completed penetration test or a compliance certificate.


| Contract | Detail |

| --- | --- |

| Trust boundaries | Browser -> API -> engine/store; staff identity -> privileged RPC; outbox -> external delivery. |

| Priority assets | Money, exclusive allocations, valid entry, private links, customer data and recovery. |

| Review record | Scenario, control, test, residual risk, owner and release decision. |


**Acceptance evidence**

The security review covers a complete booking and ticket lifecycle. Every high-impact scenario has a tested control or an explicit blocker before transaction launch.

Delivery owner: product lead and engineer.

Evidence: server/index.js; shared/engine.js; S03 / OWASP ASVS


## Page 088 - Authentication and account recovery

*11 / Security*

Proposed contract: staff access must resist guessing and remain recoverable without shared credentials.

The current implementation hashes passwords with scrypt, salts each hash, compares safely and rate-limits login by IP and email. It creates named admin/door accounts and preserves at least one active admin. Review password policy and workload under attack before production activation; a source-level hash choice alone does not establish a complete authentication posture.

Use password-manager-friendly fields and avoid blocking paste. Consider stronger authentication for admin accounts if the operating environment supports it. Sensitive changes such as merchant settings, staff roles and account recovery should require recent authentication or another approved verification step. Do not publish real credentials in handover documents or commit them to the repository.

Define a recovery process that verifies the authorised manager, resets access and invalidates old sessions. Store recovery ownership and emergency contacts securely. A forgotten password should not lead staff to create an unaudited second administrator or reuse a known test password in production.


| Contract | Detail |

| --- | --- |

| Existing controls | Salted scrypt, constant-time comparison, login throttling and named roles. |

| Proposed hardening | Reviewed password policy, admin MFA where feasible and recent-auth checks for sensitive changes. |

| Recovery controls | Verified owner, audited reset, session invalidation and preserved active-admin access. |


**Acceptance evidence**

Test unknown user, wrong password, throttling, password reset and deactivation. Error messages do not disclose account existence, and old sessions stop working after a reset.

Delivery owner: product lead and engineer.

Evidence: server/auth.js; server/index.js: login; S11 / OWASP authentication


## Page 089 - Bearer tokens and session lifecycle

*11 / Security*

Proposed contract: losing or revoking a staff session must have a predictable effect on server authority.

The current signed bearer token contains staff ID, session version and a fourteen-hour expiry. The server checks the current account and version. The browser stores the token in localStorage, and logout clears it locally; the current logout endpoint does not revoke the signed token on the server. A copied token can therefore remain valid until expiry or version change.

Choose a documented session design. A same-origin deployment can use secure HttpOnly cookies with appropriate CSRF controls; the split deployment can retain bearer tokens with stronger lifetime, revocation and XSS protection. Neither option is automatically superior without considering the host topology and staff devices.

Implement server-side session revocation or a clearly documented version invalidation action. An administrator should be able to end a lost-device session without deactivating all staff. Avoid long-lived shared device tokens and ensure staff can identify the signed-in account. Protect signing material and test rotation and recovery consequences.


| Contract | Detail |

| --- | --- |

| Current limitation | Local logout removes the browser token but does not invalidate a previously copied token. |

| Proposed control | Revocable sessions or explicit account/session-version invalidation with tested expiry. |

| Storage decision | Topology-specific choice; document token exposure, CSRF/XSS controls and lost-device handling. |


**Acceptance evidence**

Copy a staging token, log out or revoke the session, then attempt a privileged request. The result matches the documented policy; reset/deactivation always removes authority.

Delivery owner: product lead and engineer.

Evidence: server/auth.js; src/backend-http.js; server/index.js: auth/logout


## Page 090 - Authorization and least privilege

*11 / Security*

Proposed contract: every privileged action must be checked on the server with the intended actor and resource scope.

The engine maps methods to public, door or admin roles, and staff management has separate server checks. Preserve this central enforcement and audit the full RPC list whenever a method is added. A route guard or hidden button is not sufficient because a caller can send a request directly.

Define whether door staff should be able to undo an admission or create a door sale, and whether finance should change catalogue settings. These are owner decisions about authority, not simply implementation conveniences. Introduce narrower roles only when the operational need is clear and the server matrix is tested.

Public management tokens also grant authority. A booking token can cancel or submit payment for its own record; an order token can manage multiple passes. Validate token scope and object ownership before every operation. Do not accept a client-supplied role, staff name or record ID as evidence of authority.


| Contract | Detail |

| --- | --- |

| Staff matrix | Each method lists minimum role, allowed resources, sensitive fields and audit requirement. |

| Public capabilities | Opaque token authorises only its documented booking/order/pass scope. |

| Change process | New method requires permission tests and a review of data returned to each role. |


**Acceptance evidence**

Call every privileged method as public, door and admin in a permission test matrix. Cross-record tokens and forged actor fields cannot access or mutate another record.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js: METHODS and ROLE_RANK; server/index.js: staff methods


## Page 091 - HTTP policy, CORS and content security

*11 / Security*

Proposed contract: deployment-specific browser policy should support the intended site while reducing accidental exposure.

The server currently adds security headers, a CSP for served HTML and wildcard CORS for API responses. Bearer tokens are explicitly attached rather than ambient cookies, but wildcard CORS still deserves a deliberate review. Restrict approved frontend origins where practical; CORS complements authentication and never replaces it.

The current CSP permits same-origin scripts plus hashed inline startup code and inline styles. If the frontend uses a separate API, update connect-src for the approved origin and test all required resources. If staff authentication changes to cookies, review CSRF and credentialed CORS together. Do not weaken policy broadly to silence a single console error.

Check HTTPS termination, trusted proxy settings, MIME types and private-file routing on the actual host. GitHub Pages responses do not inherit the Node server headers, so assess the static frontend independently. Service and token routes should use no-store and appropriate referrer policy, with search exclusion for private content.


| Contract | Detail |

| --- | --- |

| Origin rule | Document approved frontend/API origins and test allowed and denied browser requests. |

| CSP rule | Minimum required scripts, styles, images, fonts and connections; no blanket relaxation. |

| Host rule | HTTPS, trusted proxy chain, correct resource MIME and private-path exclusion verified in production. |


**Acceptance evidence**

Inspect live response headers and run both hosting topologies in staging. Intended requests work; unauthorised requests still fail server checks and private files are not served.

Delivery owner: product lead and engineer.

Evidence: server/index.js: CSP, CORS and isPublic; S13 / MDN CSP; S14 / OWASP REST security


## Page 092 - Abuse limits and resource protection

*11 / Security*

Proposed contract: rate limits should restrain hoarding and guessing without blocking normal shared-network visitors.

The application already limits public creations, logins and the number of unpaid orders or upcoming bookings per contact. Review these together: many legitimate mobile visitors can share an IP, while a determined caller can vary contact details. Use operation-specific limits, payload validation and allocation deadlines rather than relying on one broad IP threshold.

The server currently trusts x-forwarded-for unless TRUST_PROXY is zero. On a direct deployment, an attacker-controlled header could undermine IP-based limits. Configure a known proxy boundary or ignore forwarded headers, then test the actual host path. Keep request size, processing time and expensive password work bounded.

Protect hold inventory with expiry and payment-review deadlines. Detect patterns of repeated unreconciled claims without inventing an automatic fraud verdict. Add operator tools to pause sales, review suspicious allocations and recover stock under an approved policy. Escalation should preserve records and avoid silently deleting legitimate customer requests.


| Contract | Detail |

| --- | --- |

| Request controls | Schema validation, body limit, method-specific throttling and known proxy identity. |

| Inventory controls | Unpaid hold cap, request deadline, payment-review deadline and safe release. |

| Operator controls | Sales pause, exception queue, audit history and clear customer support path. |


**Acceptance evidence**

Test shared-IP normal traffic, varied-contact hoarding, spoofed forwarded headers and repeated login attempts. The system limits abuse while retaining a usable legitimate path.

Delivery owner: product lead and engineer.

Evidence: server/index.js: limited and clientIp; shared/engine.js: creation limits


## Page 093 - Input, output and repository safety

*11 / Security*

Proposed contract: untrusted content remains data across HTML, CSV, SQL, file paths and operational logs.

The core HTML helper escapes ordinary interpolated values, while raw explicitly bypasses that protection. Keep raw restricted to trusted code-generated markup. Review notes, names, team titles, song requests and settings wherever they appear in public or staff views. A short input field can still carry an injection payload.

The SQLite store uses prepared statements for document writes, and CSV exports neutralise formulas. Preserve these controls when adding indexes, uploads or report features. Validate expected types and lengths before expensive work; reject unsupported fields rather than blindly merging an arbitrary object into settings.

Source originals, server code, database files and environment secrets must stay outside public serving paths. The Node allowlist helps, but GitHub Pages publication has its own file exposure model. Confirm that the chosen Pages configuration does not expose sensitive source assets or data, and never commit live database or credential material.


| Contract | Detail |

| --- | --- |

| HTML rule | Escaped values by default; raw only for reviewed trusted markup and never user text. |

| Boundary rule | Explicit schemas, prepared statements, safe CSV and constrained file/path handling. |

| Publication rule | Public derivatives only; verify repository visibility and hosting paths for original photographs and source files. |


**Acceptance evidence**

Use hostile strings in names, notes, team titles and exports. No script or formula executes, paths cannot escape the public boundary and no secret or live data file is published.

Delivery owner: product lead and engineer.

Evidence: src/core.js: html/raw; server/store.js; shared/util.js: toCsv; server/index.js: isPublic


## Page 094 - Privacy, retention and incident response

*11 / Security*

Proposed contract: collect necessary data, explain its use and prepare a clear response when access or integrity fails.

Bookings require contact and service details; marketing, child-programme information and photographs have different purposes. Create a data inventory with fields, purpose, access roles, retention and deletion/correction process. Obtain an appropriate local privacy and terms review before declaring legal compliance; this engineering plan does not establish it.

Reduce exposure of private links and payment evidence. Redact tokens and unnecessary personal fields from logs, analytics and screenshots. Restrict exports and backups, and keep audit records sufficient to explain money and allocation changes. A deletion workflow should consider required recordkeeping and avoid destroying a ledger without review.

Define incident ownership and actions: pause affected sales, revoke access, preserve evidence, restore integrity, communicate accurately and review the root cause. The operating team needs a short practical runbook with verified contacts, rather than a generic security checklist no one knows how to execute.


| Contract | Detail |

| --- | --- |

| Data inventory | Field, purpose, source, access, retention, correction/removal route and storage location. |

| Incident triggers | Unauthorised access, duplicate allocation, lost verified payment evidence or leaked credentials/private links. |

| Response sequence | Contain -> preserve -> assess -> recover -> communicate under approved policy -> improve controls. |


**Acceptance evidence**

Run a tabletop lost-device and data-integrity incident. Staff identify the owner, revoke authority, pause affected actions and preserve the evidence needed for recovery.

Delivery owner: product lead and engineer.

Evidence: server/auth.js; server/store.js; S12 / OWASP logging


## Page 095 - An accessibility target with real evidence

*12 / Quality attributes*

Proposed contract: review the complete customer process against WCAG 2.2 AA, using automated and human checks.

Accessibility applies to the whole journey: finding an activity, reading prices, choosing dates, correcting errors, paying, retrieving a ticket and showing it at the door. A homepage scan alone cannot establish conformance. Prioritise essential controls and information first, then review optional motion and decorative treatment.

Use semantic landmarks, headings, labels and native controls where practical. The existing skip link, mobile-menu focus handling and photo dialog are useful foundations. Test their behaviour with keyboard navigation and representative assistive technology rather than assuming that ARIA attributes automatically make the interaction accessible.

Maintain an issue register with the affected route, criterion, user impact, reproduction and fix evidence. Separate a project preference such as generous 44px controls from a formal minimum requirement. Do not publish an accessibility certification or claim that every criterion passes until the complete review has evidence.


| Contract | Detail |

| --- | --- |

| Scope | Public discovery, booking, payment, recovery, gallery and essential staff/door workflows. |

| Method | Automated checks plus keyboard, screen-reader, zoom, text resize and touch review. |

| Evidence | Criterion mapping, route/state tested, defect severity, fix and retest result. |


**Acceptance evidence**

A reviewer completes the core booking and ticket-recovery journeys using keyboard and assistive technology. No critical issue remains hidden behind a passing automated score.

Delivery owner: product lead and engineer.

Evidence: S01 / WCAG 2.2; src/views/public.js; src/components.js


## Page 096 - Focus, dialogs and form feedback

*12 / Quality attributes*

Proposed contract: the visitor always knows where they are and how to recover from an error.

Focus should follow meaning. Opening the menu or photo viewer moves it inside; closing returns it to the opener when appropriate. A route change should expose the new page title or main region without leaving focus in detached markup. Sticky headers and controls must not conceal the focused element.

Form errors need visible text and a programmatic association with the relevant input. A polite status region can announce completion or an important change, but should not announce every countdown second or gallery animation. Busy state should communicate progress without removing a label or replacing the form with unexplained blank space.

Test focus order after validation, date selection and modal dismissal. The native dialog provides useful browser behaviour, while the existing viewer adds explicit wrapping for consistent keyboard control. Keep an older-browser fallback and avoid custom overlays that duplicate incomplete versions of native functionality.


| Contract | Detail |

| --- | --- |

| Focus rules | Logical order, visible indicator, no obscured target and sensible route/modal transition. |

| Error rules | Specific visible message, field association, retained input and one useful correction action. |

| Status rules | Announce meaningful state changes; avoid noisy repeated or purely decorative announcements. |


**Acceptance evidence**

Use Tab, Shift+Tab and Escape through menu, viewer and an invalid booking form. Focus never escapes an active modal, disappears or lands under fixed content.

Delivery owner: product lead and engineer.

Evidence: src/photo-viewer.js; src/views/public.js: openMenu; S15 / MDN dialog


## Page 097 - Text resizing, contrast and touch

*12 / Quality attributes*

Proposed contract: a premium layout remains usable when visitors enlarge text, zoom or use imprecise touch.

Test browser zoom, text-only enlargement where available and narrow layouts with long content. Essential information must not be truncated to maintain a visual grid. A price and its unit should wrap together sensibly; terms and errors should remain readable instead of shrinking to a tiny caption.

Measure text and control contrast, including muted hints and thin outline buttons. State cannot depend on colour alone. On photographs, review each responsive crop because the background behind a caption changes. Keep sufficient separation between neighbouring actions such as cancel, pay and next, where an accidental touch can have a meaningful consequence.

Use comfortable control sizes and natural page scrolling. Horizontal galleries may be supplemental, but essential price comparisons and form completion cannot depend on a precise swipe. Respect safe areas and virtual-keyboard viewport changes, and avoid fixed controls covering the final input or confirmation.


| Contract | Detail |

| --- | --- |

| Text tests | 200% text/zoom review and reflow at narrow widths, with long headings and package names. |

| Contrast tests | Body, hint, state, outline, focus and image captions measured and visually checked. |

| Touch tests | Comfortable target size, separation, safe-area handling and visible form controls with keyboard open. |


**Acceptance evidence**

Complete a booking at enlarged text settings and on a 320px viewport. The customer can read every material fact and activate the intended control without hidden content.

Delivery owner: product lead and engineer.

Evidence: src/styles.css; src/experience.css; S01 / WCAG 2.2


## Page 098 - Performance budgets and field metrics

*12 / Quality attributes*

Proposed contract: define customer-facing budgets, then measure them on representative devices and connections.

The current supporting-image build contains approximately 274KB of uncompressed JavaScript and 71KB of CSS, with self-hosted fonts and responsive photographs. These are build observations, not measured field performance. Establish a compressed transfer baseline, parse cost and image selection on a modest phone before choosing optimisations.

Core Web Vitals currently use LCP, INP and CLS. The plan targets good thresholds at the seventy-fifth percentile: LCP at or below 2.5 seconds, INP at or below 200ms and CLS at or below 0.1. Lab measurements help diagnose problems, but field data is needed to describe real user performance across mobile and desktop.

Use project budgets for initial code, fonts and hero media as investigation triggers, not arbitrary universal limits. Start by eliminating unnecessary eager downloads and staff-only work. A new supporting image should remain lazy below the fold; a new animation should not add substantial input latency or repeated long tasks.


| Contract | Detail |

| --- | --- |

| Field goals | LCP <=2.5s; INP <=200ms; CLS <=0.1 at p75, segmented by device where data permits. |

| Initial investigation | Compressed bytes, parse/execute, hero request timing, font blocking and long tasks. |

| Budget ownership | Engineer sets measured budgets with product; regressions require a documented reason and review. |


**Acceptance evidence**

Produce a baseline report and one targeted before/after comparison on the same device/network. Do not report a passing performance goal without the appropriate measurement context.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; S02 / Web Vitals


## Page 099 - Image and font loading priorities

*12 / Quality attributes*

Proposed contract: spend early bandwidth on the first useful view and defer lower-page atmosphere.

The photo helper makes the hero eager with high fetch priority and lower-page images lazy. Preserve that distinction. Verify the browser-selected currentSrc at actual display widths; incorrect sizes can download a much larger image than the card needs. A portrait crop can reduce visual confusion without requiring a larger transfer.

The build defines several font families and weights, but not every weight is needed on the opening screen. Check actual requests and subset usage. Keep font-display behaviour, a suitable fallback and stable line wrapping. Preload only an established critical font or hero asset; indiscriminate preload can compete with the very content it is intended to accelerate.

The enlarged viewer should fetch the selected full image on demand and optionally prefetch one neighbour after the current image is ready. Avoid loading all full-resolution masters with the gallery. Dark night photographs require careful compression review because banding and noise can remain visible even at small sizes.


| Contract | Detail |

| --- | --- |

| Priority order | Document and critical code/styles -> first useful hero -> selected text font -> below-fold media as needed. |

| Responsive check | currentSrc, sizes, intrinsic dimensions, mobile crop and JPEG fallback. |

| Viewer check | Full image on demand; restrained neighbour prefetch; no initial download of all masters. |


**Acceptance evidence**

Inspect network traces at 390px and 1440px, with viewer closed and open. Early bytes serve the opening decision and below-fold images do not compete unnecessarily.

Delivery owner: product lead and engineer.

Evidence: src/components.js; scripts/build.js; src/photo-viewer.js; S04 / MDN picture


## Page 100 - Offline, weak networks and graceful failure

*12 / Quality attributes*

Proposed contract: connection failures should preserve the visitor's intent without fabricating success or availability.

The brochure fallback gives the public site a useful read-only mode. A transient API outage is a different state: keep known catalogue facts and a contact action, but do not create an empty synthetic store and show it as fresh stock. The user should understand whether online action is disabled or merely temporarily unreachable.

Use bounded read retries and visible retry controls. For mutation uncertainty, preserve the idempotency key and check the outcome. Do not say failed if the server may have committed the booking, and do not say confirmed if only the form was sent. Keep phone contact and a concise summary available so staff can help without asking for every detail again.

Avoid adding a service worker to cache dynamic bookings, payment states or private tickets without a separate design. Static asset caching can be useful, but stale private state or unsynchronised door decisions introduce risks. If offline admission is required, specify reconciliation and authority as a new operating capability.


| Contract | Detail |

| --- | --- |

| Read failure | Known facts, clear stale/unavailable context, retry and call option. |

| Write uncertainty | Retained intent and key; check outcome before creating another record. |

| Cache boundary | Static assets only initially; no unreviewed caching of credentials, stock or payment/admission state. |


**Acceptance evidence**

Throttle and disconnect during reads and writes. The site retains input, offers a safe next action and never creates a second booking through a blind retry.

Delivery owner: product lead and engineer.

Evidence: src/backend-http.js; src/backend-brochure.js; src/boot.js


## Page 101 - Compatibility and real-device coverage

*12 / Quality attributes*

Proposed contract: support a documented browser/device set and provide useful fallbacks for optional features.

The build targets older browser versions for code and CSS, while some features depend on newer APIs. Establish the real support matrix from expected visitors and staff devices. Include Chrome on Android, Safari on iPhone, desktop Chrome/Edge and the event-day scanning phones; version promises should be validated rather than assumed from a compile target.

Test dialog support, IntersectionObserver, storage access, camera permission, QR decoding, picture/AVIF selection and touch input. Where a feature is supplemental, provide a fallback: the photo viewer can open a JPEG directly, and motion can render content without observers. Essential transaction actions need a clear compatibility or contact path.

Automated Chromium coverage is valuable but does not replace Safari or a real camera test. Keep a small device checklist and capture any browser-specific defect with a reproducible state. Test browser back/forward and direct deep links, including the GitHub project path and future dedicated domain.


| Contract | Detail |

| --- | --- |

| Visitor matrix | Representative Android/iPhone and desktop browsers, small screens and restricted storage. |

| Staff matrix | Actual scanning devices, HTTPS camera access, network conditions and battery/session duration. |

| Fallback matrix | Optional motion, full-image view, decode failure and unsupported API have useful alternatives. |


**Acceptance evidence**

The supported device list has test evidence for core journeys. Every unsupported optional feature fails gracefully, and staff camera scanning is rehearsed on actual hardware.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; src/photo-viewer.js; src/views/door.js


## Page 102 - Reliability objectives and error budgets

*12 / Quality attributes*

Proposed contract: service targets should reflect the consequences of losing a booking or admission decision.

Separate availability from correctness. A site may answer requests quickly while returning stale stock or crediting a payment twice. Define service-level indicators for successful durable mutations, safe conflict handling, payment review latency and notification backlog, alongside ordinary HTTP availability.

Propose initial targets for owner and engineering review: no acknowledged mutation lost in a normal restart, no duplicate resource allocation, and a documented recovery window for a severe infrastructure failure. Track transaction failures and uncertain outcomes during the pilot. Do not label the system highly available without infrastructure and recovery evidence.

Use an error budget to decide whether to prioritise stabilisation or new features. A significant payment, inventory or credential defect should pause the affected capability until resolved. Visual refinements can continue independently, but they should not distract from an integrity issue that threatens customer promises.


| Contract | Detail |

| --- | --- |

| Correctness indicators | Duplicate allocation/credit, acknowledged-write loss and invalid admission decisions. |

| Service indicators | Mutation success, p95 latency, payment queue age, notification age and recovery time. |

| Decision rule | Integrity failure blocks affected transactions; repeated service failure triggers stabilisation and review. |


**Acceptance evidence**

A pilot report names indicators, observation window, target, measured result and limitations. A failure has an owner and runbook, not simply a new retry button.

Delivery owner: product lead and engineer.

Evidence: server/index.js; shared/engine.js; server/store.js


## Page 103 - Domain, location and brand ownership

*13 / Discovery and growth*

Proposed contract: own a stable public address and verify the actual arrival location before promoting directions broadly.

The current public address is a GitHub project path, and the Maps action searches for the Elite High School landmark. This is useful context but is not a verified Social Spot place ID or surveyed coordinate. Confirm the exact venue listing and arrival pin with the owner before replacing the query with a direct place link.

A dedicated domain can make the site easier to remember and improve ownership of canonical URLs, favicon identity and sharing. Domain selection, registration and hosting costs require owner input. Do not redirect production traffic until the certificate, root/deep routes, public URL generation and support links are tested.

Maintain one authoritative name, area, landmark and phone across site, business listing and campaign materials. Record who controls the domain and listing so maintenance does not depend on a developer's personal account. Keep the old public address redirect or canonical relationship consistent after migration.


| Contract | Detail |

| --- | --- |

| Current facts | Social Spot; Akright City, Bwebajja; next to Elite High School; 0393 103 799. |

| Verification task | Owner-approved place listing, entrance pin, arrival directions and account ownership. |

| Domain task | Chosen hostname, DNS/certificate, canonical base, redirects and live route/icon checks. |


**Acceptance evidence**

A visitor using the approved map link reaches the correct gate in a real arrival check. New domain routes and private confirmation links remain usable after migration.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; src/views/public.js: Maps link; S05 / Google favicon guidance


## Page 104 - Public route search fundamentals

*13 / Discovery and growth*

Proposed contract: each public information route needs meaningful content, metadata and a coherent canonical URL.

Audit what the initial HTML, rendered page and shared-link preview expose for home, activity pages, The Replay and Quiz Night. JavaScript-rendered content can be discovered, but route-specific static or prerendered content is useful for visitors and preview systems that do not execute the application. The current 404 fallback also deserves direct-route status review.

Use unique titles and concise descriptions that describe the real service and location. Keep canonical URLs consistent with the approved hostname and route. Build a sitemap of public informational pages after route metadata is established, and keep private ticket, order, booking and staff routes out of discoverable content.

Avoid thin search pages or keyword-filled captions for every possible neighbourhood. A focused turf page with real rates and venue images is more useful than many duplicate pages. Unknown routes should produce a proper not-found experience rather than a homepage that looks like a successful result for any path.


| Contract | Detail |

| --- | --- |

| Page metadata | Title, description, canonical URL and relevant social image tied to the approved content version. |

| Public index set | Useful informational routes only; no customer tokens, staff pages or synthetic live stock. |

| Route behaviour | Direct links, meaningful not-found state, crawlable navigation and consistent domain base. |


**Acceptance evidence**

Inspect fetched and rendered content for each intended public route. The title, location, contact and primary service facts are correct, and private routes are excluded.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; src/core.js; S16 / Google JavaScript SEO


## Page 105 - Local business structured data

*13 / Discovery and growth*

Proposed contract: structured data should describe verified venue facts already visible to visitors.

Create a LocalBusiness representation only after the owner confirms the business name, address/listing, contact and operating hours. The website's weekly activity times are not necessarily the venue's general opening hours. Do not translate a gym morning session into a claim that every service is open at that time.

Keep structured fields consistent with visible content and approved records. Use actual image URLs and a stable business identifier. Do not create aggregate ratings, reviews, price ranges or geo coordinates from assumptions. If the correct business subtype is unclear, choose a conservative representation and validate against the current official requirements.

Google's structured-data documentation provides required/recommended fields and validation guidance, but eligibility does not guarantee a special search appearance. The implementation should pass validation and content checks, with Search Console monitoring after deployment. Treat search display as an observed external result, not a launch promise.


| Contract | Detail |

| --- | --- |

| Verified inputs | Name, approved address, contact, URL, images, general hours and actual listing identity. |

| Consistency rule | Markup agrees with visible facts and does not imply unsupported amenities or ratings. |

| Validation rule | Rich Results Test where applicable, live inspection and monitored crawl/index status. |


**Acceptance evidence**

Compare generated JSON-LD with the approved fact register and visible page. No invented review, coordinate or opening-hour claim appears, and validation errors are resolved.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; S09 / Google LocalBusiness


## Page 106 - Event metadata and expiry

*13 / Discovery and growth*

Proposed contract: event pages should preserve correct status before sale, during the event and afterwards.

The Replay currently has a future date, release schedule and venue terms in the catalogue. Structured Event data must reflect the real event status and visible information. Offer fields must not claim an available online purchase while the site is in brochure mode or the release has not opened.

Define the lifecycle: announced, sales scheduled, on sale, sold out, paused, postponed/cancelled and ended. Some are business states and some are external schema fields; map them deliberately rather than using one label for all. A date change requires updating visible copy, countdowns, customer messages and metadata together.

After the event, remove misleading current-sale actions and preserve useful historical content under an archive strategy. A new edition receives its own approved identity and dates. Do not carry a December 2026 event forward automatically or leave a stale countdown as the main homepage feature months later.


| Contract | Detail |

| --- | --- |

| Event facts | Approved name, date/time with timezone, venue, images, terms and status. |

| Offer facts | Actual release eligibility, price/currency, availability and working purchase/contact URL. |

| Expiry action | Ended-state copy, archive decision, homepage replacement and historical-record preservation. |


**Acceptance evidence**

Advance a staging clock through release opening and event end, then simulate postponement. Page copy, actions, countdown and metadata agree on the same approved state.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js: event; S10 / Google Event guidance


## Page 107 - Sharing previews and campaign destinations

*13 / Discovery and growth*

Proposed contract: a shared link should explain the relevant offer before the recipient opens the page.

The build includes a venue share image, but route-specific campaigns may need distinct previews. Use real venue imagery and concise text that remains readable at small preview sizes. The icon and wordmark must have different roles: the compact pin works at tiny sizes, while the full logo can support a larger campaign image.

A football-turf campaign should land on turf details, a fitness campaign on gym options and a stay campaign on the penthouse package comparison. Match the ad claim, page heading, unit price and action. Do not send every campaign to a long homepage and expect the visitor to reconstruct the intended offer.

Preview systems cache images and metadata, so test fresh route URLs and approved asset versions without promising instant refresh everywhere. Never use private booking or ticket links as campaign destinations. Keep source tags minimal and prevent user-entered contact information from becoming a URL parameter.


| Contract | Detail |

| --- | --- |

| Preview contract | Venue identity, relevant activity, readable image composition and accurate description. |

| Destination contract | Offer, price unit, restrictions and next action match the campaign. |

| Privacy contract | Public informational URL only; no tokens, phone numbers or transaction IDs in tracking parameters. |


**Acceptance evidence**

Share representative public links in the intended channels and inspect their previews. The recipient understands the activity, then reaches a page with the same factual offer.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; assets-src/og.jpg; src/views/booking.js


## Page 108 - An analytics event dictionary

*13 / Discovery and growth*

Proposed contract: measurement should distinguish intent, durable outcomes and operator completion without collecting private credentials.

Define a small event dictionary before installing analytics. Public events can include activity view, call tap, directions tap, gallery open and booking start. Transaction outcomes should originate from the durable server record where appropriate: booking created, payment verified, ticket issued and admission recorded. A button tap is not equivalent to a successful outcome.

Each event needs a name, trigger, environment, allowed fields and denominator. Use activity type, public campaign source and state category where useful. Exclude phone numbers, names, child details, transaction references and private tokens. Protect server-side identifiers used for reconciliation, and avoid exposing them as unrestricted marketing parameters.

Track consent and applicable measurement requirements with the chosen tool and local review. A privacy-friendly aggregate approach may fit the early brochure better than extensive third-party tracking. Verify instrumentation in staging, then use a baseline period before interpreting changes.


| Contract | Detail |

| --- | --- |

| Intent events | activity_view, call_tap, directions_tap, gallery_open and booking_start. |

| Outcome events | Durable booking/order creation, verified payment, issued ticket and recorded admission. |

| Allowed dimensions | Environment, activity, public source, device class and state; never personal/token fields. |


**Acceptance evidence**

Inspect emitted payloads and reconcile outcome counts to durable records. Duplicate retries do not produce additional successful-conversion events.

Delivery owner: product lead and engineer.

Evidence: src/core.js; shared/engine.js; server/index.js


## Page 109 - Conversion experiments with honest inference

*13 / Discovery and growth*

Proposed contract: improve one decision at a time and distinguish observation from a causal claim.

Start with qualitative friction: can visitors find the right activity, understand a rate and complete the next step? Fix obvious issues before testing alternate button copy or photo order. The supporting-image release creates clearer recognition and visit information; its conversion effect still needs measurement rather than a guaranteed uplift claim.

For a controlled experiment, state the hypothesis, primary outcome, guardrails, allocation method and stopping rule before launch. Example: a clearer turf summary may increase qualified reservation starts without increasing wrong-date enquiries. Keep pricing and availability equal between variants so the test measures the intended presentation difference.

Low traffic can make percentage changes unstable. Estimate the sample requirement from the baseline and effect worth detecting, and use qualitative sessions when quantitative power is inadequate. Record campaign mix, weekdays and outages. Avoid selecting the most flattering metric after seeing results or calling a few extra clicks a proven revenue improvement.


| Contract | Detail |

| --- | --- |

| Hypothesis record | Change, expected user effect, primary metric, guardrail and success/stop rule. |

| Test integrity | Comparable traffic, fixed measurement definition and no mid-test policy changes. |

| Decision record | Observed result, uncertainty, practical importance and follow-up action. |


**Acceptance evidence**

The experiment can be evaluated using its original definition. If evidence is insufficient, the report says so and uses customer observations to guide the next reversible change.

Delivery owner: product lead and engineer.

Evidence: Measurement specification / page 108; src/views/public.js


## Page 110 - Campaign readiness and content cadence

*13 / Discovery and growth*

Proposed contract: a promotion goes live only when its landing page and operating team can fulfil the offer.

For each campaign, confirm the actual product, price, dates, capacity, image rights and next action. A strong creative cannot compensate for a broken destination or a staff team that does not know the offer. The current call-to-reserve site can support campaigns when the phone response and request process are staffed.

Maintain a weekly content review for recurring programme facts and an event-specific review before each release. Update verified fixtures, offers and availability through the assigned owner. The bar-screen photo should remain general; a particular match poster needs a checked schedule and confirmation that the venue will show it.

Create a small asset library by placement: website card, wide banner, mobile portrait and social preview. Keep prompt provenance and authentic geometry. Reuse accepted photography instead of generating a new invented venue for every campaign. Retire dated creatives and record the source version of any price shown.


| Contract | Detail |

| --- | --- |

| Campaign gate | Approved offer, factual image, matching destination, capacity and staffed response path. |

| Maintenance cadence | Weekly programme review; release/event checks; prompt/rights review for new imagery. |

| Asset set | Purpose-specific crops and copy; source/master/derivative relationship retained. |


**Acceptance evidence**

Open the exact campaign link on a phone, verify the price and contact path, then have staff explain how they will service the enquiry. Resolve any mismatch before publishing.

Delivery owner: product lead and engineer.

Evidence: shared/catalog.js; assets-src/photos/photos.json; src/views/booking.js


## Page 111 - A test strategy matched to risk

*14 / Delivery*

Proposed contract: test the smallest layer that can establish each important behaviour, then rehearse complete high-impact paths.

The repository has twenty-seven engine tests covering tickets, payment claims, capacity, turf, quiz, sauna, stays, permissions and CSV protection. These establish important domain examples using the memory store. They do not by themselves prove SQLite crash atomicity, deployment configuration, real camera scanning or provider delivery.

Add storage-adapter and fault-injection tests for durability, contract tests for API boundaries, browser tests for interaction and a controlled production rehearsal for operating readiness. Keep low-impact copy and styling changes verified through focused visual review rather than duplicating implementation in unit tests. Tests should address a concrete risk or required gate.

Use representative synthetic data and deterministic clocks. Avoid real customer data and real outbound messages in routine tests. Separate staging records from production and clean them through a documented process. A passing suite should state what it covers and what remains outside its scope.


| Contract | Detail |

| --- | --- |

| Domain layer | Rates, intervals, capacity, states, permissions and duplicate identifiers. |

| Integration layer | SQLite transaction/restart, API schema, auth lifecycle, outbox and migration. |

| User/operation layer | Responsive journeys, assistive use, actual camera devices and controlled money/admission rehearsal. |


**Acceptance evidence**

Map each P0 requirement to at least one meaningful test or rehearsal. The test report records environment and limitations rather than treating a green unit suite as complete production proof.

Delivery owner: product lead and engineer.

Evidence: test/engine.test.js; test/e2e.py; test/static_host.py


## Page 112 - Model-based and concurrency verification

*14 / Delivery*

Proposed contract: generate state sequences and contested requests that can expose failures beyond hand-picked examples.

Build a simple reference model for allocation and financial state. Generate sequences of create, expire, submit, verify, cancel, amend, transfer and scan actions under a seeded clock. After every step, compare resource commitments, balances and active credentials with the model. Retain the seed and minimal failing sequence for diagnosis.

State invariants include: allocated units never exceed capacity; one external payment receives one credit; one entitlement has one current pass code; an old code never admits; a failed amendment preserves the prior allocation; and acknowledged results survive a restart. Include the expired-payment branch because the current implementation only flags its conflict.

Concurrency tests must use the actual persistence path, not merely independent memory engines. Race requests for the last slot, table and capacity place, then inject response loss. Distinguish request serialisation, database atomicity and externally observed results. A valid result should be explainable as one ordered durable decision.


| Contract | Detail |

| --- | --- |

| Generated actions | Create, expiry, payment claim/verification, cancel, amend, transfer and scan. |

| Contested resources | Final turf hour, final sauna places, shared penthouse night, event table and final admission place. |

| Failure injection | Before write, between staged records, during commit, after commit and before response. |


**Acceptance evidence**

A reproducible run verifies invariants across many seeded sequences and restarts. Every failure produces a compact counterexample and a regression case, not a random unexplained screenshot.

Delivery owner: product lead and engineer.

Evidence: shared/engine.js; server/store.js; test/engine.test.js


## Page 113 - Browser, visual and image acceptance

*14 / Delivery*

Proposed contract: the public release must load correct imagery and preserve interaction across representative widths.

The supporting-image release was checked at 320, 390, 768 and 1440 pixels wide. It includes eleven gallery items, four story sections, six amenity cards, an enlarged viewer and five visit questions. The six amenity pages plus booking hub were checked for loaded images and page overflow, with reduced motion and keyboard viewer controls.

Future visual checks should focus on changes: longest titles, unit prices, illustrative labels, crop boundaries, sticky actions and route transitions. Decode every referenced image and verify the browser-selected path, not only that a picture element exists. Inspect actual screenshots for clipping, uneven balance and unreadable overlays.

Use image provenance checks alongside visual checks. A technically valid AVIF can still depict the wrong room or an enlarged pitch. Keep source comparison, crop metadata, no-upscale rules and disclosure assertions. Optional broad reruns should respond to a changed risk rather than repeating the whole suite indefinitely.


| Contract | Detail |

| --- | --- |

| Visual matrix | Small phone, standard phone, tablet and desktop; long content and enlarged text. |

| Interaction matrix | Menu, gallery, FAQ, call/directions, viewer focus/keys and reduced motion. |

| Image matrix | Decode, dimensions, format fallback, EXIF removal, crop usefulness and source fidelity. |


**Acceptance evidence**

The release evidence includes inspected screenshots and focused assertions. All new image paths resolve, no horizontal page overflow appears and the sauna disclosure survives each placement.

Delivery owner: product lead and engineer.

Evidence: src/views/public.js; src/photo-viewer.js; scripts/prepare_photos.py


## Page 114 - Continuous integration and release artefacts

*14 / Delivery*

Proposed contract: each publishable commit should carry the source, generated build and evidence required for review.

Create a CI path that installs from the lockfile, runs relevant domain/integration checks, builds with the approved public URL and verifies generated outputs. A static site deployment should publish only the intended public artefacts. Review the workflow independently from the Node server allowlist, because they have different exposure models.

Use a release manifest containing commit, tool versions, configuration version, build hashes and test results. The image manifest should refer only to files present in the deployed tree. A stale HTML file referencing a deleted bundle can break visitors during rollout, so deployment should switch the entry document and assets coherently.

Protect credentials in environment settings, limit build permissions and keep provider keys out of logs. Dependency updates should have an explicit compatibility check rather than silently changing the runtime during a venue launch. A failed gate blocks the affected release and provides a useful diagnostic.


| Contract | Detail |

| --- | --- |

| Required stages | Install -> domain/integration checks -> build -> static/browser smoke -> package -> publish. |

| Release manifest | Commit, runtime, configuration, hashes, image inventory and validation evidence. |

| Publication scope | Public built files only; no live DB, secrets, customer export or unintended source originals. |


**Acceptance evidence**

A clean CI run publishes a tree whose entry files and assets match the manifest. A deliberately missing image or failing integrity test stops publication with a clear reason.

Delivery owner: product lead and engineer.

Evidence: package.json; scripts/build.js; server/index.js; S08 / GitHub Pages


## Page 115 - Production gates and controlled activation

*14 / Delivery*

Proposed contract: activate customer transactions only after infrastructure, business facts and operators all pass their gates.

The brochure visual release can publish after responsive, image and route checks. Transaction activation has additional gates: persistent storage, atomic writes, idempotency, account ownership, staff authority, verified public facts, secure private links and a successful recovery rehearsal. Keep these gates visible rather than inferring readiness from a deployment success badge.

Use a small controlled pilot with approved test customers and operators. Record a real permitted payment verification, confirmation delivery and admission/booking fulfilment where relevant. Review outstanding errors, late claims and operator response times before increasing promotion. Do not enable all products merely because one table request succeeded.

The activation record names enabled capabilities, responsible staff, support coverage, inventory and payment configuration versions, known limitations and rollback action. A first transaction release should be reversible by disabling new sales while preserving existing customer records and service access.


| Contract | Detail |

| --- | --- |

| Brochure gate | Correct facts/images, responsive use, call/directions and stable live assets. |

| Transaction gate | Durability, duplicate prevention, permissions, merchant review, recovery and complete pilot path. |

| Operating gate | Named staff, support coverage, review queues, exception process and rehearsal sign-off. |


**Acceptance evidence**

A release reviewer can point to evidence for every active capability. If a gate fails, the corresponding action remains disabled while the public informational experience stays useful.

Delivery owner: product lead and engineer.

Evidence: README.md; config.js; server/index.js


## Page 116 - Deploy, smoke test and rollback

*14 / Delivery*

Proposed contract: publication should be followed by live checks, and rollback should preserve customer data and obligations.

Publish the reviewed commit, monitor the deployment job and fetch the live entry, bundle and selected photo files. Compare bytes or hashes with local output where possible. A successful Git push is not evidence that the live site is serving the new release; CDN caching and failed build steps can leave older files visible.

Smoke-test homepage, direct activity links, contact actions and any enabled transaction path. For a backend release, verify readiness, persistence, staff login and schema compatibility. Keep sales disabled while checking a changed storage or payment configuration if the gate requires it.

Rollback the application to a known compatible release without blindly restoring an old database over new customer records. If a migration is irreversible, use the approved forward-fix or recovery process and reconcile acknowledged changes. Keep a sales-pause action available so staff can preserve existing commitments while stabilising the system.


| Contract | Detail |

| --- | --- |

| Publish evidence | Remote commit, deployment completion, live entry/bundle hashes and selected image matches. |

| Smoke evidence | Public routes, contact, icons, enabled API, staff access and persistent record check. |

| Rollback rule | Preserve new obligations; verify schema compatibility; pause affected capabilities before recovery. |


**Acceptance evidence**

Rehearse rollback in staging with records created after the newer release. Those acknowledged obligations remain intact or are reconciled through the documented recovery process.

Delivery owner: product lead and engineer.

Evidence: scripts/build.js; server/store.js; README.md


## Page 117 - Delivery stages and architecture decisions

*14 / Delivery*

Proposed contract: estimate work in bounded stages and record decisions that affect future maintenance.

Use the proposed stage sequence as a planning basis, subject to inputs and measured complexity. Stage one closes catalogue and photography facts while finishing public content. Stage two hardens transaction integrity and auth/capabilities. Stage three completes staging flows and operator rehearsal. Stage four runs the pilot, recovery drill and controlled production activation.

An initial effort range is five to ten engineering days for focused integrity, capability and test work, plus three to six days for integration/rehearsal and one to three days for rollout support. These are planning ranges, not a fixed quotation or deadline. Provider automation, independent room inventory and missing photography are separately estimated after their requirements are known.

Record architecture decisions with context, options, chosen direction, consequences and review trigger. Initial decisions include retaining vanilla JS, one process/SQLite owner, atomic document transactions, durable idempotency, manual payment verification first, explicit capability gating and reference-only documentary imagery.


| Contract | Detail |

| --- | --- |

| Decision template | ID, date, context, options, decision, consequences, evidence and review trigger. |

| Priority sequence | Facts -> integrity/auth -> staging journeys -> operating rehearsal -> recovery/pilot -> activation. |

| Estimate rule | Resolve inputs and unknowns before committing dates; record optional scope separately. |


**Acceptance evidence**

The delivery board links each work package to an owner, dependencies and gate. A change in topology or payment model has a recorded decision rather than an unexplained implementation pivot.

Delivery owner: product lead and engineer.

Evidence: Dependency sequence / page 13; Backlog / pages 119-121


## Page 118 - Handover and continuing maintenance

*14 / Delivery*

Proposed contract: the venue should be able to operate and update the system with clear ownership after delivery.

Deliver a concise owner guide alongside this technical blueprint. It should show how to update approved facts, handle requests, verify payments, pause sales, manage staff, export controlled reports and request image/content changes. Keep live credentials and secret values in the approved secure channel rather than embedding them in the PDF.

Train operators using the rehearsal scenarios, then have them repeat the actions without developer help. Transfer domain, hosting and notification-account ownership, verify recovery contacts and document support hours. The source repository should retain build instructions, prompt provenance and decisions so a future developer can safely continue.

Create a maintenance calendar: weekly programme review, event release checks, dependency/security review, backup monitoring, periodic restore rehearsal and image/rights refresh. Review the metrics and support cases after the first month to choose improvements. Completion is a specific verified release followed by owned maintenance, not a promise that the site will never need attention.


| Contract | Detail |

| --- | --- |

| Owner handover | Verified account ownership, practical guide, staff training and support/recovery contacts. |

| Technical handover | Repository, build/runtime, config map, migrations, test evidence, decisions and prompt registry. |

| Maintenance | Content cadence, backup/restore checks, access review, dependency review and incident follow-up. |


**Acceptance evidence**

The venue owner and a second operator complete the routine tasks and a recovery tabletop from the handover instructions. Outstanding limitations are explicit and assigned.

Delivery owner: product lead and engineer.

Evidence: README.md; docs/Social_Spot_Completion_Plan.md; assets-src/photos/supporting-prompts-v2.json


## Page 119 - P0 / transaction-launch work packages

*Appendix / delivery backlog*

Proposed backlog: these items block the affected online capability; the public brochure can remain live.

Create one issue for each work package below, with the specification page, accountable owner and evidence link. Resolve owner inputs first. The P0 designation means the item protects a customer obligation, authority or recovery path; it does not mean every item must block independent image or content work.

Implement and verify in dependency order. Transaction boundaries underpin idempotency, outbox consistency and safe late-payment reactivation. Authentication and deployment checks can progress alongside these changes. Do not connect the production frontend to an unverified service simply to make the booking button appear active.


| Contract | Detail |

| --- | --- |

| P0-01 / Atomic persistence | Engineer. Pages 56-57. Stage mirror changes; commit related records and outbox atomically. Pass fault/restart tests. |

| P0-02 / Safe payment reactivation | Engineer and finance. Page 74. Enforce capacity/table eligibility at late-payment verification; tracked exception when unavailable. |

| P0-03 / Durable retries | Engineer. Page 57. Persist idempotency key, payload fingerprint and result with mutation; prove one allocation after response loss. |

| P0-04 / Staff authority | Engineer and venue manager. Pages 88-90. Named accounts, tested permissions and documented revocation/recovery. |

| P0-05 / Production service | Engineer and owner. Pages 55 and 115. Persistent volume, one process, HTTPS, approved configuration and capability gates. |

| P0-06 / Recovery and reconciliation | Engineer, finance and operator. Pages 61, 78 and 116. Consistent backup, timed restore and preserved acknowledged obligations. |

| P0-07 / Merchant and operating inputs | Owner. Pages 71 and 86. Approved merchant/name, review queue, support coverage and operator rehearsal. |


**Acceptance evidence**

Every active transaction capability has all applicable P0 evidence. An unresolved item remains a visible blocker with an owner and does not become an assumed future fix.

Delivery owner: product lead and engineer.

Evidence: Pages 55-94; Pages 111-118


## Page 120 - P1 / factual and customer-experience completion

*Appendix / delivery backlog*

Proposed backlog: close the remaining gaps that affect customer understanding and trustworthy presentation.

These work packages improve the customer's ability to choose and arrive. Several require venue facts rather than code. The new supporting imagery and visit FAQ already improve recognition; the remaining photographs and policy descriptions should use the same source-grounded approach.

Schedule commissioning early. A real sauna image or room inventory cannot be reconstructed from the terrace archive, and leaving it until launch encourages misleading substitutions. Content changes should update every affected route and notification through the approved source, with a review date.


| Contract | Detail |

| --- | --- |

| P1-01 / Exact arrival | Owner and editor. Page 103. Verify venue place link, gate pin and practical directions; perform real arrival check. |

| P1-02 / Sauna documentary coverage | Owner and photographer. Page 43. Shoot actual interior, confirm rules/capacity and replace the labelled illustration only after review. |

| P1-03 / Room/package evidence | Accommodation manager. Page 44. Photograph bedrooms/bathrooms and map inclusions to each package before independent-room claims. |

| P1-04 / Food and programme | Kitchen and programme leads. Pages 45 and 110. Approved dishes/portions/prices; verify session times and recurring offers. |

| P1-05 / Truthful brochure states | Engineer/editor. Pages 49 and 68. Remove synthetic live-stock implications and gate actions by explicit capabilities. |

| P1-06 / Accessibility closure | Designer and engineer. Pages 95-97. Complete keyboard, screen-reader, text/contrast and touch review for core processes. |

| P1-07 / Public route metadata | Engineer and editor. Pages 53, 104-107. Route-specific content, canonical URLs, sharing and verified structured data. |


**Acceptance evidence**

Each completed item has factual owner approval and page-level evidence. The public site does not imply unavailable rooms, live inventory or unapproved offers.

Delivery owner: product lead and engineer.

Evidence: Pages 15-46; Pages 95-110


## Page 121 - P2 / optimisation and optional expansion

*Appendix / delivery backlog*

Proposed backlog: start after the relevant foundation is measured and operating reliably.

P2 work should earn its cost through a specific opportunity or observed constraint. A framework migration, automated payment gateway or independent-room engine is not automatically necessary for a professional website. These changes introduce operating and verification work beyond visual polish.

Select a small next batch from customer behaviour and staff feedback after the pilot. Write a hypothesis, define the expected outcome and preserve a reversible release path where possible. Keep optional scope out of the core-launch estimate until its inputs and consequences are understood.


| Contract | Detail |

| --- | --- |

| P2-01 / Route splitting | Engineer. Page 47. Profile public parse/loading cost; isolate staff/scanner work only when the measured gain justifies build complexity. |

| P2-02 / Provider payment automation | Finance and engineer. Page 71. Approved account and current API contract; authenticated callbacks, deduplication and reconciliation. |

| P2-03 / Independent accommodation | Owner and engineer. Page 66. Real resource map, shared-space rules and tested package intersections. |

| P2-04 / Loyalty automation | Owner and engineer. Page 67. Approved eligible usage, redemption and reversals; no unpaid request earns a reward. |

| P2-05 / Controlled experiments | Product lead. Page 109. One decision, defined metric/guardrail, adequate evidence and honest uncertainty. |

| P2-06 / Richer media | Visual editor. Pages 31-46. Real reference coverage, rights, responsive budgets and purpose-specific placement. |

| P2-07 / Scale redesign | Engineer. Page 62. Triggered by measured memory, latency or recovery constraint; documented options and migration. |


**Acceptance evidence**

An optional feature has a justified outcome, complete inputs, operating owner and validation cost. It does not bypass existing money, privacy or inventory gates.

Delivery owner: product lead and engineer.

Evidence: Pages 47-62; Pages 103-118


## Page 122 - Requirement traceability matrix

*Appendix / engineering evidence*

Suggested identifiers connect public promises to authoritative rules and acceptance evidence.

Use these identifiers as a starting register, then extend it when a requirement changes. The matrix intentionally spans visual and transactional work: a wrong image or price can mislead the customer before the engine is invoked. The evidence column should point to an actual result at the release commit, not merely a specification.

For every change, identify affected requirements and rerun their meaningful checks. If the price model, resource map or host topology changes, revisit downstream confirmations, exports and operating instructions. A traceability matrix is useful only when it reflects the current implementation and remaining gaps.


| Contract | Detail |

| --- | --- |

| SS-IMG-001 | Real venue geometry retained; photos.json/prompts; source comparison and crop review. Pages 31-46. |

| SS-UI-001 | Readable mobile decision path; public views/styles; 320/390px and enlarged-text journey. Pages 15-30. |

| SS-BOOK-001 | No overlapping private turf hours; turfSlots/bookingCreate; contested-slot and restart tests. Page 64. |

| SS-BOOK-002 | Sauna person capacity maintained; saunaSlots; final-place race and cancellation release. Page 65. |

| SS-STAY-001 | Package resource/night exclusivity; penthouseNights; overlap and boundary tests. Page 66. |

| SS-PAY-001 | One external payment gets one ledger credit; payment/constraint layer; duplicate-review and retry test. Page 72. |

| SS-ENTRY-001 | One current credential admits once within approved capacity; doorScan; concurrent scans and old-code test. Pages 76-77. |

| SS-OPS-001 | Acknowledged obligations recover consistently; store/backup; fault injection and timed restore. Pages 56 and 61. |


**Acceptance evidence**

A reviewer can follow each identifier to the governing rule, implementation, pass evidence and owner. Requirements without completed evidence remain explicitly pending.

Delivery owner: product lead and engineer.


## Page 123 - Formal acceptance contracts

*Appendix / engineering evidence*

The following are proposed invariants and result contracts for the first transaction release.

Use a reference state model and captured configuration version to evaluate each mutation. Let Active(r,t) be the set of allocations consuming resource r at time t, and units(b,r) its demand. A valid committed state satisfies the capacity rule for every relevant interval, not merely the one shown on a client page.

Let Apply(k,p) represent a request with operation key k and material payload p. Repeating the same key/payload returns the same durable identity. A changed payload under that key is a conflict. This contract applies across process restarts; in-memory duplicate detection is insufficient.

These contracts describe project behaviour, not a claim that the current implementation already proves them. Implement transactional storage and independent tests before marking them satisfied. A failure must produce a useful user/operator outcome as well as preserve the invariant.


| Contract | Detail |

| --- | --- |

| Capacity | For every r,t: sum(units(b,r) for b in Active(r,t)) <= capacity(r,t). Check commit-time state. |

| Crash atomicity | After interruption/restart, state equals complete pre-operation or complete committed post-operation state. |

| Idempotency | Apply(k,p) repeated has one effect and one durable resource ID; Apply(k,p2) with p2 != p is rejected. |

| Payment uniqueness | A verified external reference maps to one ledger credit obligation; adjustment history remains explicit. |

| Credential uniqueness | Each entitlement has one current code; replaced codes never admit; check-in effect occurs at most once. |

| Amendment preservation | Unavailable or failed amendment leaves original allocation and financial basis unchanged. |


**Acceptance evidence**

The test suite checks these after generated state sequences, concurrent calls and fault injection. A support-visible uncertainty or conflict never bypasses the underlying invariant.

Delivery owner: product lead and engineer.

Evidence: Pages 56-70; Pages 71-78; Page 112


## Page 124 - High-value test scenarios

*Appendix / engineering evidence*

A compact execution matrix for the risks not established by the existing twenty-seven engine examples.

Run these scenarios against staging with the actual persistence adapter and production-like configuration. Use deterministic clocks for boundary cases, then repeat the relevant flow with actual staff devices. Capture resource IDs, state snapshots, request IDs and the exact release version without including private credentials in the report.

The expected result is a behavioural contract, not a prescribed internal function call. If the architecture changes, retain the scenario and update its setup. Stop broad reruns once required checks pass unless another change or unresolved risk justifies them.


| Contract | Detail |

| --- | --- |

| Last turf hour | Two concurrent creates for the same final slot -> one durable booking; other receives a taken/conflict result. |

| Sauna final places | Two parties jointly exceed remaining capacity -> only a valid whole-party allocation; no partial hidden booking. |

| Penthouse boundary | Checkout on date D plus next check-in on D -> allowed; overlapping night -> rejected. |

| Lost creation response | Commit booking, drop response, restart and retry same key -> same resource identity, no duplicate. |

| Late ticket payment | Expire hold, allocate resource elsewhere, then verify old claim -> tracked fulfilment exception, no extra valid pass. |

| Duplicate scan | Two scanner requests for one current code -> one admission, one duplicate, complete scan history. |

| Revoked staff session | Revoke/reset account and reuse copied token -> denied according to the documented server policy. |

| Restore and reconcile | Restore snapshot on fresh service -> counts, currencies, ledger, active credentials and staff access verified before reopening. |


**Acceptance evidence**

Every scenario has observed output and retained evidence. Any money, allocation, admission or authority failure blocks the affected capability until corrected.

Delivery owner: product lead and engineer.

Evidence: test/engine.test.js; server/store.js; server/auth.js


## Page 125 - Prompt and asset registry

*Appendix / image and launch registry*

Executed and pending image work are separate categories; originals remain the authority.

The repository retains the earlier gym, day-turf, penthouse, terrace and illustrative-sauna prompts in retouch-prompts.json. This release adds four supporting restorations in supporting-prompts-v2.json. Generated masters are copied into the project because the website consumes them; responsive derivatives are exported deterministically.

The four future prompts are gated by missing real inputs. A prompt brief is not evidence that the scene was photographed or that a facility feature exists. Keep source, rights, output, reviewer, edit limits and page placements together. The full executed wording appears on pages 39-42; future briefs appear on pages 43-46.


| Contract | Detail |

| --- | --- |

| Building / executed | IMG_7665.HEIC -> building-restored-v2.jpg. Building story/gallery; no new floor or completed hidden signage. |

| Entrance / executed | IMG_2465.HEIC -> entrance-restored-v2.jpg. Arrival photo; gate, gatehouse and courtyard unchanged. |

| Bar / executed | IMG_4765.jpg -> bar-screen-restored-v2.jpg. Table story/gallery; no future fixture or precise reconstructed-score claim. |

| Night turf / executed | IMG_4766.HEIC -> turf-night-restored-v2.jpg. Turf pages/gallery; same pitch, goal, nets and night context. |

| Sauna interior / pending | Requires real room photograph and rules; existing towels/stones macro remains visibly illustrative. |

| Bedrooms / pending | Requires room/package inventory and actual bedroom/bathroom frames. |

| Food / pending | Requires kitchen-approved menu, portion photographs, prices and product identity. |

| Kids session / pending | Requires actual session photograph, permitted usage and appropriate consent. |


**Acceptance evidence**

Every executed asset has a source and accepted versioned master. Pending assets remain unpublished as documentary venue photographs until their real inputs and review are complete.

Delivery owner: product lead and engineer.

Evidence: assets-src/photos/retouch-prompts.json; assets-src/photos/supporting-prompts-v2.json


## Page 126 - The shipping runbook

*Appendix / image and launch registry*

Use this sequence for a complete, reviewable release; transaction activation adds the operating gates.

The user has authorised publishing website improvements to main. Routine reversible implementation and verification can proceed within that scope. The release owner still needs factual business inputs for new financial accounts, changed policies or claims about unphotographed amenities. Keep those as specific dependencies rather than pausing unrelated work.

For the accompanying visual update, publish the reviewed source/build, confirm deployment and fetch live files. The transaction steps below remain proposed until their engineering and owner gates pass. Record both the successful scope and any capability that remains disabled.


| Contract | Detail |

| --- | --- |

| 01 / Establish version | Confirm clean base, current remote main and scoped changes; avoid overwriting another contributor. |

| 02 / Review images | Check source invariants, accepted masters, prompts, crops, labels and image paths. |

| 03 / Build | Run approved public-URL build; source and hashed public assets agree. |

| 04 / Verify | Relevant tests, browser checks, image decode, diff checks and inspected screenshots pass. |

| 05 / Commit and publish | Commit complete artefacts; push main without force; monitor the deployment job. |

| 06 / Check live | Fetch entry, bundle, CSS, icons and selected image bytes; open direct public routes. |

| 07 / Record release | Commit, deployed scope, evidence, limitations and support owner documented. |

| 08 / Prepare transactions | Persistent server, integrity/auth gates, approved merchants, capability config and backup. |

| 09 / Rehearse and pilot | Operators complete payment, booking, admission and recovery scenarios on approved infrastructure. |

| 10 / Activate and monitor | Enable only passed capabilities; watch queues/errors; pause affected sales if integrity fails. |


**Acceptance evidence**

A release is complete only when the live deployment matches reviewed artefacts. A transaction launch additionally has evidence for money, inventory, authority and recovery.

Delivery owner: product lead and engineer.

Evidence: Pages 111-118


## Page 127 - Primary references / platform and standards

*Appendix / primary references*

Official sources checked on 07 October 2026. Project-specific recommendations and target values are identified as proposed.

The plan uses primary documentation to verify browser behaviour, search eligibility, accessibility and storage semantics. It does not reproduce those standards in full. The engineering contracts are tailored to the inspected Social Spot source, and a cited standard is not proof that the current deployment conforms to it.

Requirements and browser/provider behaviour can change. Recheck the relevant official source at implementation time, pin versions where appropriate and record the selected version in review evidence. The repository files listed throughout the plan are the direct evidence for the current application baseline.


| Contract | Detail |

| --- | --- |

| S01 / W3C WCAG 2.2 | https://www.w3.org/TR/WCAG22/
Accessibility target and complete-process review basis. |

| S02 / Web Vitals | https://web.dev/articles/vitals
LCP, INP, CLS and p75 target interpretation. |

| S03 / OWASP ASVS | https://owasp.org/projects/asvs
Security-verification structure; the reviewed page identifies ASVS 5.0.0. |

| S04 / MDN picture | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture
Responsive formats, art direction and fallback. |

| S05 / Google favicon | https://developers.google.com/search/docs/appearance/favicon-in-search
Hostname scope, stable icon and eligibility limits. |

| S06 / SQLite transactions | https://sqlite.org/lang_transaction.html
Explicit transaction and write-ownership semantics. |

| S07 / SQLite backup | https://sqlite.org/backup.html
Consistent backup approach and restore planning. |

| S08 / GitHub Pages | https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
Static-site hosting boundary. |


**Acceptance evidence**

Use the source that governs the specific decision. A software budget, recovery target or proposed architecture in this plan is a project choice unless explicitly described as an external requirement.

Delivery owner: product lead and engineer.


## Page 128 - Primary references / search and security

*Appendix / primary references*

These references support the remaining platform checks; the project still needs implementation-specific validation.

Search appearance and message delivery are external outcomes. Passing a markup validator or receiving a provider acceptance response does not guarantee a special search result or handset delivery. Preserve the distinction between configured intent, observed evidence and an unsupported promise.

Authentication, logging and HTTP references guide review but do not replace testing the actual host, roles and data flows. The blueprint identifies concrete current limitations such as local-only logout, per-document writes and late-payment capacity warnings. Resolve them with source changes and retained evidence before enabling the affected operational capabilities.


| Contract | Detail |

| --- | --- |

| S09 / Google LocalBusiness | https://developers.google.com/search/docs/appearance/structured-data/local-business
Verified business facts and structured-data eligibility. |

| S10 / Google Event | https://developers.google.com/search/docs/appearance/structured-data/event
Event/offer facts, status and validation. |

| S11 / OWASP authentication | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
Staff authentication and recovery review. |

| S12 / OWASP logging | https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
Useful security evidence with sensitive-data protection. |

| S13 / MDN CSP | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
Deployment-specific browser resource policy. |

| S14 / OWASP REST security | https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
API and transport review structure. |

| S15 / MDN dialog | https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
Native dialog API and compatibility review. |

| S16 / Google JavaScript SEO | https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
Crawling/rendering and public route metadata. |


**Acceptance evidence**

Recheck current official documentation before a provider or platform integration. Final readiness is established by the project gates, operator rehearsal and production evidence, not by citation alone.

Delivery owner: product lead and engineer.
