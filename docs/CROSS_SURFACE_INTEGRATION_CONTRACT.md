# JedaIn — Cross-Surface Integration & Demo Hardening Contract

**Status:** LOCKED FOR COMPETITION MVP  
**Phase:** Phase 8 — Integration & Demo Hardening  
**Purpose:** connect the already-implemented Traveler, EO, Admin, and Destination Partner surfaces into one authoritative, demoable marketplace/trust loop without doing the final global UI rebuild.

---

## 1. Source Priority

When this contract conflicts with implementation details, use this priority:

`PRD > SYSTEM_FLOW > WIREFRAME_SPEC > UI_SPEC > IMPLEMENTATION_PLAN > this contract > DESIGN_SYSTEM > issue > implementation`.

Required sources:

- `PRD.md`
- `docs/SYSTEM_FLOW.md`
- `docs/WIREFRAME_SPEC.md`
- `docs/UI_SPEC.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/EO_GOLDEN_FLOW_CONTRACT.md`
- `docs/ADMIN_TRUST_LOOP_CONTRACT.md`
- `docs/DESTINATION_PARTNER_GOLDEN_FLOW_CONTRACT.md`
- Traveler contracts under `docs/`
- `docs/DESIGN_SYSTEM.md`
- `AGENTS.md`

---

## 2. Product Goal

Phase 8 is successful when one competition demo can prove the JedaIn loop across the same shared records:

`Traveler demand → EO insight → EO package → Admin approval → EO publication → Traveler marketplace → session → booking/payment → trip completion → Traveler reviews → EO/Destination/Admin trust visibility`.

The objective is not to add another role or another large feature area. The objective is to eliminate cross-surface seams, duplicated authorities, stale fixtures, broken transitions, and demo-only dead ends.

---

## 3. Required Golden Demo

The implementation plan locks this sequence:

`Traveler Register → Consent → Quiz → Recommendation → Home → EO Insight → EO Builder → Admin Approval → Package LIVE → Traveler Session → Checkout → Payment → Trip COMPLETED → Venue + EO Review`.

For the competition build, the full visible proof should additionally show the already-implemented Destination Partner and Admin trust surfaces:

`Destination application/verification → canonical destination → EO eligibility → session on destination schedule → confirmed participants/capacity → destination review → Admin trust/audit inspection`.

The same package/session/booking/review records must be observable from the relevant roles.

---

## 4. Non-Goals

Phase 8 must NOT become:

- production backend migration,
- production authentication/OAuth,
- real KYC/document storage,
- real payment gateway/refund/payout/settlement,
- final global UI redesign,
- a new analytics platform,
- a full package versioning engine,
- automated trust suspension policy,
- a second booking/session/catalog database,
- a mass rewrite of Traveler, EO, Admin, or Destination architecture.

Mocks remain acceptable for competition MVP when they are centralized behind adapters/services and preserve authoritative lifecycle rules.

---

## 5. Shared Authority Rule

There must be one authoritative source per business concept.

Use the existing centralized stores/adapters:

- EO applications → `mockApplicationStore`
- Destination verification applications → `mockDestinationVerificationStore`
- Canonical verified destinations → `mockDestinationStore`
- Aggregate demand insight source → existing centralized EO insight source
- EO package drafts/submissions/lifecycle → `mockEoPackageStore`
- EO-created sessions → `mockEoPackageStore` session helpers/source
- Traveler bookings/payments/reservations → `mockTransactionStore`
- Traveler venue/EO reviews → `mockReviewStore`
- Admin audit → `mockAdminAuditStore`
- Complaints → `mockComplaintStore`

Phase 8 may add adapters/read models/resolvers around these authorities, but must not create parallel copies of authoritative business records.

---

## 6. Marketplace Publication Lifecycle

The source flow is:

`PENDING_ADMIN_REVIEW → APPROVED → Publish LIVE → Create / Manage Sessions`.

Existing Admin behavior remains locked:

- Admin approval changes `PENDING_ADMIN_REVIEW → APPROVED`.
- Admin approval does NOT auto-publish to Traveler.
- Admin approval does NOT auto-create a session.

Phase 8 must add/finish the explicit publication boundary.

Competition behavior:

- only the authenticated owner EO may publish its own `APPROVED` package,
- publication changes `APPROVED → LIVE`,
- `DRAFT`, `PENDING_ADMIN_REVIEW`, `REJECTED`, or foreign-owner package cannot publish,
- repeated publish on already `LIVE` is deterministic/idempotent,
- publication never bypasses Admin approval,
- publication must not mutate static Traveler fixture objects directly.

The UI may expose a clear EO action such as `Publish ke Marketplace` on an approved package.

---

## 7. Traveler Marketplace Bridge

Traveler discovery must be able to consume eligible EO-created LIVE packages through a centralized compatibility/read-model adapter.

Do NOT directly push into existing Traveler fixture arrays.

The Traveler package catalog source should combine:

1. existing canonical Traveler demo packages, and
2. EO packages that are eligible for marketplace publication.

An EO-created package is Traveler-visible only when:

- package lifecycle is `LIVE`,
- owner EO remains authoritative/approved where required by existing partner state,
- linked destination exists,
- linked destination is `ACTIVE`,
- destination verification state is valid,
- package has enough data to satisfy the existing Traveler package/detail contract.

`APPROVED` but not `LIVE` packages must not appear in Traveler Explore/Home/package routes.

---

## 8. Traveler Package Read Model

Create one adapter/resolver that maps an eligible EO LIVE package into the existing Traveler read contracts rather than forking Traveler screen logic.

It must provide the fields required by the current Traveler recommendation/package-detail screens using authoritative EO/destination data.

Do not invent business claims that are absent from EO/destination records.

Presentation-only fallback is acceptable only for non-business-critical visual decoration and must remain obviously prototype-safe. Never fabricate:

- rating,
- verification level,
- guide readiness,
- price,
- capacity,
- itinerary,
- review count,
- policy claims.

Existing static Traveler packages may remain supported through the same combined read layer.

---

## 9. Session Bridge

Traveler session selection must be able to read EO-created sessions for EO-created LIVE packages.

Use the centralized EO session source. Do not duplicate sessions into a Traveler session database.

Traveler-visible session requirements:

- linked package is `LIVE`,
- session belongs to the package,
- status is one of the supported Traveler session states,
- capacity and price snapshot come from the authoritative session record,
- occupied capacity derives from `mockTransactionStore` reservation + booked helpers,
- FULL behavior is derived consistently when occupied quantity reaches capacity.

Destination Schedule must continue reading the same EO session record.

---

## 10. Checkout Compatibility

Checkout must work for bridged EO-created package/session records without special-case duplicate business logic.

Existing T10–T15 contracts remain authoritative:

- contact verification before reservation where required,
- one active pending payment invariant,
- latest authoritative session/capacity/price check before reservation,
- atomic booking + reservation + payment attempt,
- payment success converts reservation to booked quantity,
- failed unexpired payment remains retryable,
- expiry/cancel releases reservation,
- no duplicate transaction creation.

Phase 8 must adapt lookup/read boundaries, not weaken these rules.

---

## 11. Cross-Role Booking Visibility

After a Traveler booking is created from an EO-created session, the SAME `mockTransactionStore` record must be visible appropriately to:

- Traveler My Trips,
- EO Bookings for the owning package,
- Admin Bookings / Payments,
- Destination Schedule/Capacity as aggregate participant counts for sessions hosted at that destination.

Privacy boundaries remain locked:

- EO and Destination do not receive Traveler quiz data,
- Destination does not receive Traveler identity/contact data,
- Admin inspection remains limited to fields already allowed by its contract.

---

## 12. Demo Trip Completion Boundary

The implementation plan requires the golden demo to reach `Trip COMPLETED`, but production trip-completion automation is outside MVP scope.

Phase 8 may add ONE clearly labeled prototype/demo lifecycle command so the SAME paid booking can progress:

`PAID → COMPLETED`.

Requirements:

- centralized service/store command, not arbitrary component mutation,
- only a `PAID` booking may transition,
- same Traveler owner must be preserved,
- idempotent for already `COMPLETED`,
- cannot complete `PENDING_PAYMENT`, `CANCELLED`, or `EXPIRED`,
- no capacity release on completion because the trip remains historically booked,
- UI control, if exposed, must be explicitly labeled as a competition/demo simulation and not a production operational capability.

Do not add Admin/EO force-completion as a production-looking feature.

---

## 13. Review Cross-Surface Bridge

After the SAME booking becomes `COMPLETED`, Traveler review eligibility remains governed by the existing review contract:

- one DESTINATION review per completed owned booking,
- one EO_GUIDE review per completed owned booking,
- rating integer 1–5,
- shared `mockReviewStore`.

The resulting records must become visible without copying them to:

- Destination Reviews → DESTINATION reviews only,
- EO Reviews → EO_GUIDE reviews only for the correct organizer review ref,
- Admin Trust & Status → aggregate signals derived from the same actual review records.

Zero-review and empty-comment truth rules remain locked. No fake 5.0, fake comments, or Traveler PII.

---

## 14. Identity Resolution

Create/reuse centralized resolvers for cross-surface identity mapping.

At minimum keep deterministic mappings for:

- EO identity → organizer review target ref,
- Destination partner identity → verification application → canonical destination,
- canonical destination → Traveler destination review target ref,
- package → EO owner + destination.

Do not scatter hard-coded identity mappings across screens.

---

## 15. Aggregate Insight Integrity

EO Insights remain aggregate and privacy-safe.

Phase 8 does NOT need production analytics or a full real-time aggregation engine.

The golden demo may use deterministic aggregate prototype data, but:

- no Traveler PII may be exposed,
- no claim that prototype counts are live production users,
- no unsupported historical trend claims,
- the Traveler quiz/recommendation story and EO insight story should be semantically consistent enough for the juror to understand the demand → supply loop.

Do not add a one-person "aggregate" view that effectively deanonymizes the current Traveler.

---

## 16. Role Switching / Session Isolation

Competition demo role switching must not leave conflicting authority behind.

Audit interactions between:

- Traveler auth/session/onboarding state,
- Partner EO session,
- Partner Destination session,
- Admin session.

Entering one role must not accidentally grant another role's protected routes.

If a demo role switcher/helper is added, it must explicitly set/clear the relevant prototype session state and must not mutate approval/business status just to grant access.

---

## 17. Route Guard Audit

Validate all major guarded surfaces:

Traveler:

- onboarding/auth guards remain correct.

EO:

- operational routes require authoritative approved EO.

Destination:

- operational routes require authenticated Destination + approved verification + active canonical destination.

Admin:

- operational routes require explicit Admin session.

Direct URLs and stale sessions must fail safely.

No role may gain access by passing an ID in URL/query/caller data.

---

## 18. Canonical State Audit

Phase 8 must test and repair cross-surface stale-state cases where necessary:

- rejected package is not Traveler-visible,
- approved-but-not-live package is not Traveler-visible,
- inactive/unverified destination blocks marketplace eligibility,
- closed/cancelled/full session cannot proceed through checkout as open,
- expired/cancelled booking does not occupy capacity,
- paid/completed booking remains booked capacity,
- rejected/pending partner cannot use operational workspace,
- stale Admin decision fails safely,
- no duplicate application/package/session/booking/review creation through repeated actions.

---

## 19. Deterministic Demo Seed / Reset

Provide a centralized competition demo reset/seed helper.

It should restore a deterministic state across the relevant centralized mock stores so a juror/demo operator can rerun the story without refreshing into mutated leftovers.

Reset must not mutate immutable seed constants by reference.

The implementation may expose a small clearly labeled demo reset control if useful, but must not present it as production functionality.

Do not reset automatically during normal navigation.

---

## 20. Error / Empty / Loading Audit

Audit all golden-demo routes for safe states.

Required where relevant:

- loading/skeleton only where real async behavior exists,
- empty queues/lists,
- not-found IDs,
- stale lifecycle,
- invalid owner/access,
- no eligible destination/session/review,
- recoverable error actions.

Do not invent fake async delays just to display loading states.

---

## 21. Responsive Audit

Primary demo viewport:

- 1440 × 900.

Also validate:

- 1280 desktop,
- tablet/narrow layout,
- basic mobile fallback.

Requirements:

- no accidental horizontal page overflow,
- intentional table horizontal scrolling is allowed,
- drawers remain usable,
- forms/steppers remain reachable,
- primary actions remain visible.

This is a hardening pass, not a global redesign.

---

## 22. Accessibility Audit

Validate at minimum:

- one main landmark per page/shell,
- semantic headings,
- form labels,
- keyboard navigation,
- visible focus,
- dialogs/sheets focus-safe,
- status not communicated by color alone,
- table headers,
- 44px action targets where practical,
- reduced-motion behavior,
- no obvious contrast regressions.

Fix cross-surface accessibility defects encountered in the golden demo, but do not rebuild every component solely for visual perfection.

---

## 23. Basic Performance Pass

Phase 8 requires a basic performance check.

At minimum:

- avoid obvious duplicate expensive computations in render loops,
- avoid accidental duplicate store reads/mutations,
- ensure images/assets do not block the demo unnecessarily,
- inspect production bundle warning and route payload.

Low-risk route-level lazy loading/code splitting may be implemented if it clearly improves the build without destabilizing routing/tests.

The existing Vite >500 kB warning alone is not a competition correctness blocker if the app remains responsive and the fix would create unnecessary scope/risk. Report it truthfully.

---

## 24. Demo Documentation

Add/update a concise competition demo guide, preferably `docs/DEMO_GUIDE.md`.

It should include:

- staging/demo entry URL placeholder,
- role entry points,
- approved/pending/rejected demo identities or quick-demo buttons,
- exact golden demo sequence,
- expected states at key transitions,
- how to reset deterministic demo state,
- known prototype-only controls such as demo trip completion,
- known non-blocking warnings/limitations.

Do not include secrets or real credentials.

---

## 25. Visual Rule

This phase is NOT the final global UI rebuild.

Use the current JedaIn design system and only fix visual inconsistencies that harm the cross-surface demo, responsiveness, accessibility, or trust clarity.

Do not spend Phase 8 on decorative redesign, new visual identity, or broad page-by-page restyling.

The final global UI pass happens only after Phase 8 is merged.

---

## 26. Required End-to-End Tests

Add high-value integration tests around the actual shared stores/read adapters.

At minimum prove:

### Package publication

1. Admin-approved package remains `APPROVED` and absent from Traveler before EO publish.
2. Authenticated owner EO publishes `APPROVED → LIVE`.
3. Foreign EO cannot publish another EO package.
4. Non-approved lifecycle cannot publish.
5. Published LIVE package becomes visible through Traveler catalog adapter.
6. Rejected/non-LIVE package remains hidden.
7. Inactive destination prevents Traveler marketplace eligibility.

### Session / checkout

8. EO-created session for LIVE package becomes visible to Traveler.
9. Session for non-LIVE package is hidden/not sellable to Traveler.
10. Traveler session capacity uses shared transaction occupancy.
11. Checkout creates one shared booking/payment record for bridged session.
12. EO sees the SAME booking.
13. Admin sees the SAME booking/payment state.
14. Destination sees aggregate participant effect on the SAME session.
15. No duplicate booking/session copies are introduced.

### Completion / reviews

16. Demo completion allows only `PAID → COMPLETED` on the same booking.
17. Invalid lifecycle cannot be force-completed.
18. Completed booking unlocks venue + EO review eligibility.
19. Submitted venue review appears in Destination Reviews.
20. Submitted EO review appears in EO Reviews.
21. Admin Trust derives rating/count from the same review records.
22. No Traveler PII leaks into Destination/EO review surfaces.

### Guards / identity

23. Traveler cannot enter Admin/Partner operational surfaces by URL alone.
24. EO cannot enter Destination/Admin surfaces by identity hints.
25. Destination cannot enter EO/Admin surfaces.
26. Admin session does not grant Partner identity.
27. stale/rejected/pending partner state is handled safely.

### Reset

28. competition demo reset returns all shared stores to deterministic baseline.
29. reset does not corrupt immutable seeds.
30. rerunning the golden flow after reset does not collide with prior IDs/idempotency keys.

All existing Traveler, EO, Admin, and Destination test suites must remain green.

---

## 27. Browser Golden Demo Acceptance

Actually smoke the connected flow at 1440px:

1. Traveler login/register/onboarding/quiz/recommendation/home.
2. Partner EO approved demo → Insights → Create Package from Insight.
3. Builder → valid destination → itinerary → pricing → submit.
4. Admin Demo → Package Approvals → approve the SAME package.
5. Return EO → SAME package shows `APPROVED` → Publish LIVE.
6. Create/open a sellable session for the SAME package.
7. Traveler → Explore/package/session sees the SAME LIVE package/session.
8. Checkout → contact verification → pending payment → payment success.
9. EO Bookings sees the SAME booking.
10. Admin Bookings sees the SAME booking/payment.
11. Destination Schedule/Capacity sees the SAME session and participant count.
12. Demo lifecycle progression → SAME booking becomes COMPLETED.
13. Traveler submits Destination + EO reviews.
14. Destination Reviews sees the venue review.
15. EO Reviews sees the guide review.
16. Admin Trust & Status reflects review signals.
17. Admin Audit still contains prior trust decisions.

Also smoke:

- rejected package not published,
- approved but unpublished package absent from Traveler,
- session full/closed behavior,
- invalid direct URLs,
- narrow/tablet fallback,
- deterministic demo reset and rerun.

Console requirement:

- no new Phase 8/EO/Admin/Destination/Traveler integration errors,
- no new warnings introduced by Phase 8.

Known legacy Explore `act(...)` warnings may remain if unchanged and explicitly reported.

---

## 28. Quality Gate

Required before merge:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
- `npm audit --audit-level=high`

All must pass.

GitHub Actions exact-head must complete successfully.

Cloudflare Pages preview must deploy successfully.

---

## 29. Delivery Rule

Implement Phase 8 in ONE focused competition hardening PR unless a genuine blocking dependency makes that unsafe.

Suggested branch:

`feat/p8-cross-surface-hardening`

PR body:

`Closes <Phase 8 issue>`

Do not merge automatically. Independent review is required.

After Phase 8 is merged and main/staging are green, the application is ready for the separate final global UI rebuild/polish pass using the locked JedaIn visual direction and Taste Skill.
