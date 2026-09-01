# JedaIn — Destination Partner Golden Flow Contract

**Status:** LOCKED FOR COMPETITION MVP  
**Scope:** DP01–DP11  
**Depends on:** Traveler Golden Flow, EO Golden Flow, Admin Trust Loop

This contract locks the competition-MVP behavior for the Mitra Destinasi surface. It does not replace `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, or `docs/UI_SPEC.md`.

Conflict priority:

`PRD > SYSTEM_FLOW > WIREFRAME_SPEC > UI_SPEC > IMPLEMENTATION_PLAN > DESTINATION_PARTNER_GOLDEN_FLOW_CONTRACT > DESIGN_SYSTEM > issue > implementation`.

---

## 1. Competition Story

Destination Partner must complete the three-sided JedaIn story without becoming a second EO dashboard.

Locked story:

`Partner Entry → Destination Application → Admin Verification → BASIC / BASIC + guide_ready → Destination Workspace → Venue Profile → Verification → EO Session Schedule → Capacity Visibility → Venue Reviews → Profile`

Cross-surface proof:

`Destination Partner submits one shared application → Admin sees the same record → Admin approves → same Destination Partner identity becomes operational → canonical destination becomes eligible for EO Builder`.

---

## 2. Scope

Implement in one competition sprint:

- DP01 Partner Landing / Role Selection — Must
- DP02 Destination Login / Register — Must
- DP03 Destination Application — Must
- DP04 Verification Status — Must
- DP05 Destination Overview — Must
- DP06 Destination Profile — Must
- DP07 Verification & Badge — Must
- DP08 Schedule / Sessions — Must
- DP09 Capacity — Must
- DP10 Reviews — Should
- DP11 Profile — Should

Out of scope:

- production auth/OAuth,
- real KYC/legal document storage,
- real geospatial verification,
- production trust scoring,
- automated PLUS upgrade,
- automated downgrade/suspension thresholds,
- refund/payout/settlement,
- direct control of EO-owned package/session lifecycle,
- final global UI rebuild,
- final Traveler marketplace publication bridge.

---

## 3. Routes

Use the existing Partner surface:

```text
/partner
/partner/login
/partner/apply/destination
/partner/application

/partner/destination
/partner/destination/profile
/partner/destination/verification
/partner/destination/schedule
/partner/destination/capacity
/partner/destination/reviews
/partner/destination/profile-settings
```

`/partner/application` may resolve EO or Destination application status based on the authenticated Partner role/context. Do not create ambiguous cross-role mutations.

---

## 4. Destination Partner Navigation

Operational sidebar exactly:

```text
Overview
Destination Profile
Verification
Schedule
Capacity
Reviews
Profile
```

Partner/Admin layouts remain desktop/tablet-first.

---

## 5. Destination Partner Session Boundary

Destination operational workspace requires:

- authenticated Partner identity,
- role = `DESTINATION`,
- authoritative shared destination verification application = `APPROVED`,
- linked canonical destination exists and is active.

Do not reuse Traveler `OnboardingRouteGuard` or EO-only approval logic.

Create a small `DestinationRouteGuard` or equivalent.

A Partner session must carry/resolve a stable mapping between:

- Partner identity,
- verification application,
- canonical `destinationId`.

Caller-provided `destinationId` is not mutation authority. Destination mutations must resolve the current authenticated Destination Partner and its linked destination.

---

## 6. Deterministic Demo Identities

Provide separate deterministic demo paths:

### Approved Destination Demo

Use one approved partner identity linked to an existing canonical verified destination, preferably `dest_lereng_hijau`, so schedule/review integration can be demonstrated from existing shared data.

### Pending / Rejected Application Demo

Use a separate identity/application record for application/status demonstration.

Do not turn a PENDING or REJECTED application into APPROVED through a Partner-side shortcut. Admin remains the trust authority.

A juror shortcut may switch to the separate already-approved demo identity, but must not mutate the current application.

---

## 7. Shared Verification Application Authority

The Destination Partner sprint must reuse the same centralized verification application data consumed by Admin A05/A06.

No second Destination application database/store is allowed.

Current `mockDestinationVerificationStore` may be reused in place for competition speed. File relocation is not required merely for architecture purity. If moved, preserve one authoritative store/API and all Admin behavior.

A verification application should support at least:

```text
applicationId
partnerIdentityId
destinationIdentityId
name
locationLabel
province
city
management/legal prototype metadata
description
facilities/highlights
capacityPerSession
baseCostPerPerson
guideReadinessEvidence
submittedAt
status
rejectionReason?
reviewedAt?
approvedLevel?
approvedGuideReady?
```

The application `partnerIdentityId` and canonical `destinationIdentityId` are separate concepts.

Authoritative review states:

```text
PENDING_REVIEW
APPROVED
REJECTED
```

Form draft state may be stored separately before first submission, but Admin must not see an application until it is submitted.

---

## 8. Destination Application — DP03

Locked stepper from source:

```text
1 Management / Legal
2 Location
3 Facilities & Activities
4 Capacity & Base Cost
5 Guide Readiness
6 Review & Submit
```

Real file upload is not required. Use proposal-safe prototype metadata:

- filename,
- attached/not attached,
- short management/legal statement,
- location documentation placeholder metadata.

Never claim that a real document, location, or safety inspection occurred.

Primary CTA:

`Submit untuk Verifikasi`

Submission must:

- require authenticated Destination Partner identity,
- create/update exactly one application for that identity,
- bind the application to one stable canonical destination identity,
- validate required fields,
- be idempotent on repeated submit,
- transition into `PENDING_REVIEW`,
- never self-approve,
- never create `PLUS`.

---

## 9. Rejected Re-Apply

Admin rejection reason is authoritative and must appear exactly on Destination verification/application status.

Flow:

`REJECTED → edit same application/identity → resubmit → PENDING_REVIEW`.

Do not create a new Partner identity merely to re-apply.

Repeated submit while already `PENDING_REVIEW` or `APPROVED` must not create a duplicate review cycle.

---

## 10. Admin Approval Cross-Surface

Destination approval remains an Admin command.

Locked initial Admin outcomes:

```text
Reject + reason
Approve BASIC
Approve BASIC + guide_ready
```

Initial approval must NEVER grant `PLUS`.

Successful approval:

- verification application → `APPROVED`,
- `approvedLevel = BASIC`,
- `approvedGuideReady = true|false`,
- canonical `mockDestinationStore` upserted once,
- canonical destination `status = ACTIVE`,
- same Destination Partner identity becomes eligible for `/partner/destination/*`,
- EO Builder reads the newly approved destination through the existing canonical destination eligibility source.

---

## 11. Destination Status Dimensions — DP04/DP07

Display separately:

```text
verificationLevel = BASIC | PLUS
guideReady = true | false
```

Do not collapse them into one opaque application state.

Proposal-safe labels may combine them visually:

- Terverifikasi Dasar
- Terverifikasi Dasar + Siap sebagai Guide
- Terverifikasi Plus
- Terverifikasi Plus + Siap sebagai Guide

But combination is presentation only.

For this sprint, `PLUS` may be displayed for existing seeded canonical destinations. Destination Partner cannot self-promote to PLUS.

---

## 12. Destination Overview — DP05

Overview must derive from shared stores, not component-local numbers.

Minimum widgets:

- verification level,
- guide-ready state,
- upcoming sessions using this venue,
- expected/confirmed visitor count from shared booking/capacity data,
- latest/average venue rating when reviews exist,
- profile completeness.

Profile completeness must be derived from an explicit required-field checklist. Prefer wording such as `6/6 informasi inti lengkap` instead of fabricated vanity percentages.

No fake:

- revenue,
- growth,
- occupancy trend,
- conversion,
- popularity growth,
- satisfaction trend.

---

## 13. Destination Profile — DP06

Show the canonical operational destination profile:

- name,
- location,
- description,
- highlights/facilities,
- base cost,
- base capacity,
- verification level,
- guide-ready state.

Exact re-review rules for verified-critical fields are PENDING in source.

Competition lock:

- verified-critical fields such as destination identity/location, base cost, base capacity, verification level, and guide readiness are not silently changed from the operational page,
- non-critical descriptive content may be edited if implemented through an authenticated Destination Partner command boundary,
- if a verified-critical edit affordance is shown, label it as requiring re-verification; do not directly mutate published authoritative values in this sprint.

---

## 14. Destination Mutation Command Boundary

Create one small server-shaped Destination Partner command/service boundary for Partner-side mutations.

It must:

1. resolve `partnerSessionStore.get()`,
2. require role `DESTINATION`,
3. resolve the Partner's linked application/destination,
4. validate lifecycle/ownership,
5. mutate the shared authoritative store,
6. return refreshed data/result.

Direct command call without valid Destination Partner session:

- fails,
- zero mutation.

A Destination Partner must never mutate another destination by supplying a forged `destinationId`.

---

## 15. Schedule / Sessions — DP08

Destination schedule is operationally read-only in this competition sprint.

Source of truth:

- EO package store,
- EO session store,
- shared transaction/capacity store.

A Destination Partner sees only sessions whose package uses its canonical `destinationId`.

Minimum rows/cards:

- EO/package,
- date/time,
- session status,
- session capacity,
- confirmed/booked participant count,
- pending reservation count only if the shared store can provide it accurately.

No Traveler PII:

- no traveler name,
- no phone,
- no email,
- no quiz/preferences.

Destination Partner cannot:

- create an EO session,
- close/open an EO session,
- change EO package status.

---

## 16. Capacity — DP09

Show separately:

- base venue capacity from canonical destination,
- per-session allocation/capacity from EO sessions,
- confirmed booked participants,
- remaining operational headroom when derivable safely.

Wireframe leaves direct editing of published session capacity unresolved.

Competition lock:

**Destination Partner does NOT directly edit already-published EO session capacity.**

Do not create conflicting capacity authorities.

If a future capacity-change affordance is shown, it must be clearly non-production/prototype and must not silently mutate EO sessions.

---

## 17. Reviews — DP10

Destination Reviews consumes the existing shared Traveler review store.

Only venue/destination reviews are shown.

Do not mix `EO_GUIDE` reviews.

Resolve the review target through one centralized destination review-reference helper/mapping. For current fixtures this may map canonical destination ID to the existing destination-name review target.

Display:

- average rating only when records exist,
- review count,
- rating,
- comment if present,
- booking reference if appropriate.

Do not show:

- raw travelerId,
- traveler phone/email,
- fake comments,
- fake 5.0 when there are zero reviews.

Empty comment → `Tanpa komentar` or omit comment area.

---

## 18. Profile — DP11

Keep account/profile settings minimal.

Show:

- Partner identity,
- destination relationship,
- contact person/contact metadata if available,
- verification/application summary.

Any editable contact field must persist in one centralized prototype source. Do not build a broad settings system.

---

## 19. Shared Schedule Metrics

Destination Partner may derive operational metrics from existing stores.

Recommended definitions:

- `upcomingSessionCount`: sessions belonging to packages at this destination and considered upcoming/operational,
- `confirmedParticipants`: sum of shared `bookedQuantity` for relevant sessions,
- `reservedParticipants`: sum of active shared reserved quantity only if exposed by an authoritative helper,
- `venueReviewAverage`: average of destination review records only.

Do not infer participant identities.

---

## 20. No Fake Cross-Surface State

The following must be the same records across roles:

```text
Destination Application
Destination Verification Result
Canonical Destination
EO Destination Eligibility
EO Sessions using Destination
Traveler Venue Reviews
```

Admin, EO, Destination Partner, and Traveler must not maintain separate contradictory copies of those states for the demo.

---

## 21. Golden Demo

Primary Destination Partner demo:

```text
/partner
→ Pengelola Destinasi
→ Destination Demo Approved
→ Overview
→ Destination Profile
→ Verification
→ Schedule
→ Capacity
→ Reviews
→ Profile
```

Trust cross-surface demo:

```text
Destination Pending Application
→ Admin Destination Verification Queue
→ Approve BASIC + guide_ready
→ same Destination Partner identity becomes operational
→ canonical destination appears in EO eligibility source.
```

Rejection demo:

```text
Admin Reject with specific reason
→ same Destination Partner status shows exact reason
→ edit/re-apply same identity/application.
```

---

## 22. Required High-Value Tests

### Access / identity

- logged-out `/partner/destination` cannot enter operational workspace,
- EO session cannot enter Destination workspace,
- approved Destination demo can enter,
- PENDING/REJECTED Destination identity cannot enter,
- forged destinationId mutation is blocked.

### Application / Admin bridge

- new Destination application submission creates exactly one shared `PENDING_REVIEW` record,
- Admin queue sees the same record,
- duplicate submit creates no duplicate,
- Admin approve BASIC opens same identity workspace,
- Admin approve BASIC + guide_ready opens same identity workspace and EO eligibility includes destination,
- initial approval never PLUS,
- Admin rejection reason is visible exactly to Destination Partner,
- rejected reapply uses same identity/application.

### Profile / verification

- verificationLevel and guideReady display independently,
- Destination Partner cannot self-change verification/guideReady,
- canonical profile fields come from shared destination store,
- runtime profile snapshot cannot mutate store by reference.

### Schedule / capacity

- Destination sees only sessions for packages using its destination,
- unrelated destination sessions hidden,
- confirmed participant counts derive from transaction store,
- no Traveler PII rendered,
- Destination cannot mutate EO session status/capacity,
- base venue capacity and session capacity are shown as separate concepts.

### Reviews

- actual Traveler destination review target appears in Destination Reviews,
- EO_GUIDE review excluded,
- average/count derived from actual records,
- zero reviews has no fake rating,
- empty comment has no fabricated quote,
- raw travelerId hidden.

### Regression

- all Traveler tests green,
- all EO tests green,
- all Admin tests green.

---

## 23. Visual Direction

Before final Destination Partner visual pass:

**INVOKE TASTE SKILL.**

This is not the global final UI rebuild.

Destination Partner should feel:

- local destination operations,
- calm wellness hospitality,
- trusted verification,
- schedule/capacity clarity,
- collaborative with EO.

Avoid:

- generic ERP,
- hotel PMS imitation,
- fintech dashboard,
- industrial logistics UI,
- random gradients/glass,
- dense KPI walls.

Use canonical JedaIn tokens and existing Partner `WorkspaceShell`.

---

## 24. Responsive / Accessibility

Primary validation:

- 1440x900,
- 1280 desktop,
- narrow/tablet,
- basic mobile fallback.

Requirements:

- one `main` from shell,
- semantic headings,
- real table headers,
- keyboard-operable stepper/forms,
- visible focus,
- labels,
- status not color-only,
- 44px actions where practical,
- no accidental horizontal overflow except intentional table scrolling,
- reduced motion respected.

---

## 25. Quality Gate

Before PR is review-ready:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
npm audit --audit-level=high
```

All must pass.

Admin/EO/Destination-specific new warnings: 0.

Known legacy Explore `act(...)` warnings and current Vite bundle-size notice are not blockers for this competition sprint, but must be reported accurately.

---

## 26. Delivery Rule

One PR for DP01–DP11.

Suggested branch:

`feat/p7-destination-golden-flow`

PR body:

`Closes <Destination Sprint Issue>`

Do not merge automatically. After independent review and merge, move to Phase 8 cross-surface integration/demo hardening, then final global UI rebuild/polish.