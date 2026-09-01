# JedaIn — EO Golden Flow Competition Contract

**Status:** LOCKED FOR COMPETITION MVP  
**Date:** 1 September 2026  
**Scope:** EO01–EO18 / Phase 5 EO Partner Core

This contract bundles the EO Partner surface so JedaIn can move quickly from the completed Traveler golden flow to Admin, Destination Partner, and the final cross-surface demo.

## 1. Source Priority

When implementation details conflict, use:

`PRD.md > SYSTEM_FLOW.md > WIREFRAME_SPEC.md > UI_SPEC.md > IMPLEMENTATION_PLAN.md > EO_GOLDEN_FLOW_CONTRACT.md > DESIGN_SYSTEM.md > issue notes > implementation`.

Do not invent a new business rule to resolve an unresolved product decision. Use a clearly prototype/configurable value where needed.

## 2. Competition Goal

The EO flow must make JedaIn's core differentiation visible:

`Aggregated Traveler Demand → EO Insight → EO Builds Curated Experience → Validation → Admin-Review Submission → Sessions/Bookings → Reviews`.

The final UI should communicate that EO does not merely upload a tour listing; EO uses demand signals and verified local destinations to design a wellness experience.

## 3. Product Surface

EO uses the Partner Portal, not Traveler UI.

Recommended routes already locked by UI_SPEC:

- `/partner`
- `/partner/login`
- `/partner/apply/eo`
- `/partner/application`
- `/partner/eo`
- `/partner/eo/insights`
- `/partner/eo/packages`
- `/partner/eo/packages/new`
- `/partner/eo/packages/:packageId`
- `/partner/eo/packages/:packageId/sessions`
- `/partner/eo/sessions`
- `/partner/eo/bookings`
- `/partner/eo/destinations`
- `/partner/eo/reviews`
- `/partner/eo/profile`

Operational EO pages use the existing desktop-first Partner/Workspace shell and EO navigation:

`Overview | Insights | Packages | Sessions | Bookings | Destinations | Reviews | Profile`.

Partner entry/application screens may use a focused partner-auth/application layout rather than forcing the operational sidebar before approval.

## 4. EO Identity & Application

Application states:

`DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED`

or:

`PENDING_REVIEW → REJECTED → edit → resubmit`.

Required application information follows PRD:

- basic business information,
- contact person,
- legal/basic-document readiness,
- experience portfolio,
- insurance/required-document acknowledgement where applicable,
- agreement to JedaIn operating standards/SOP.

Competition MVP rules:

- no real KYC/document storage,
- no real insurance verification,
- uploaded documents may be represented by deterministic prototype metadata/status,
- rejection must contain a specific reason and allow correction/re-apply,
- re-apply must preserve the same EO identity.

The implementation must provide a deterministic APPROVED demo EO path so the juror can enter the operational surface without waiting for an Admin action, while application states remain visible/demoable.

## 5. Shared EO Application Store

EO application state must live in one centralized mock/server-shaped store or adapter boundary reusable by the later Admin sprint.

Minimum record:

- `applicationId`
- `identityId`
- `businessName`
- `contactPerson`
- application fields/document metadata needed by UI
- `status`
- `submittedAt?`
- `reviewedAt?`
- `rejectionReason?`

Expose read helpers for Admin later. Admin decision mutations may be added later; do not build Admin screens in this PR.

No application status may exist only in React component-local state.

## 6. EO Overview — EO05

Purpose: business orientation + clear next action.

Priority:

1. primary CTA `+ Create Package`,
2. packages awaiting approval,
3. upcoming sessions,
4. booking summary,
5. average EO rating,
6. recent demand insight.

Only show metrics backed by centralized prototype data. Do not invent historical growth percentages, GMV trends, or conversion rates not represented by the data source.

Empty state must provide a next action, e.g. create the first package from demand insight.

## 7. Demand Insights — EO06

Insights must be explicitly aggregate/prototype data, never personal Traveler data.

Minimum sections:

- healing/activity intent distribution,
- budget distribution,
- duration distribution,
- departure-area distribution,
- unmet-demand cards.

Required interaction:

`Create Package from Insight`.

Selecting an insight opens the builder with the selected insight context preserved.

Use one centralized deterministic aggregate-insight source. Do not create separate numbers in different components. No fake longitudinal trend claims.

## 8. Packages — EO07

EO Packages screen must make lifecycle visible.

Minimum package/submission states for competition MVP:

- `DRAFT`
- `PENDING_ADMIN_REVIEW`
- `REJECTED`
- `APPROVED`
- `LIVE`

Each package belongs to one EO identity.

Packages list should support useful status grouping/filtering and clear actions:

- edit draft,
- view submission status,
- create package,
- manage sessions for an approved/live package.

## 9. Shared EO Package Store

Create one centralized mock/server-shaped EO package store reusable by later Admin integration.

Minimum draft/submission data:

- `packageId`
- `eoId`
- `title`
- `shortSummary/valueProposition`
- selected `destinationId`
- selected `insightId?`
- itinerary items
- included/basic preparation information where supported
- pricing snapshot
- duration
- safety/basic operational notes needed by validation
- organizer/guide status
- lifecycle status
- validation result
- submission timestamp
- rejection reason if rejected

Do not make the Admin sprint parse JSX/local forms to discover submissions.

## 10. Destination Directory for Builder

EO can select only a verified destination:

- verification `BASIC`, or
- verification `PLUS`.

Guide rule:

- EO `CONCEPT_ONLY` → destination must also have `guide_ready = true`.
- EO `CERTIFIED_GUIDE` → any BASIC/PLUS verified destination may be selected.

This rule must be checked again at builder submit/validation boundary, not only hidden by the UI.

For competition MVP, create one centralized prototype destination directory that later Destination Partner/Admin surfaces can reuse. It may contain 1–2 fictional verified destinations as required by PRD demo scope.

Minimum destination data:

- `destinationId`
- name/location
- verification level
- `guideReady`
- base cost used by pricing
- capacity/operational summary if needed
- status.

Do not mutate Traveler package fixtures directly as the destination database.

## 11. Trip Builder — EO08–EO12

Stepper is locked:

1. Destination
2. Relevant Insight
3. Itinerary
4. Pricing
5. Review & Submit

A builder draft must survive moving backward/forward between steps during the session.

### Step 1 — Destination

- show only destinations allowed by verified/guide-ready rule,
- make verification and guide-readiness understandable,
- primary action selects a destination and continues.

### Step 2 — Relevant Insight

- show selected aggregate demand context,
- allow selecting/changing one relevant insight,
- builder can also be started without an insight from `+ Create Package`, but using demand insight is the preferred golden-demo path.

### Step 3 — Itinerary

Minimum editable item:

- order,
- title,
- description,
- time/duration label.

Allow add/remove/reorder in a competition-safe implementation.

### Step 4 — Pricing

MVP business formula:

`Customer Price = Destination Base Cost + EO Margin`.

Platform commission is a portion of the EO margin; do not invent a final commission percentage if not locked.

The UI must clearly distinguish:

- destination base cost,
- EO margin,
- customer price.

Use a prototype/configurable commission preview only if it is already defined centrally; otherwise do not claim a final payout number.

### Step 5 — Review & Submit

Show a reviewable package preview plus validation summary before submission.

Primary action submits the existing draft; it must not silently create multiple submissions on repeated click/retry.

## 12. Automatic Validation — EO13

Validation is server-shaped/centralized and returns specific rule failures.

Minimum competition validation:

- title/value proposition present,
- verified destination exists,
- guide-readiness rule satisfied,
- at least one valid itinerary item,
- price > destination base cost or otherwise internally coherent with EO margin,
- required duration/basic operational information present.

Every validation failure must point to the relevant builder step/field.

Never show only generic `Submission failed` when a business-rule failure is known.

Failed validation leaves the package `DRAFT` and editable.

## 13. Submission Status — EO14

After successful validation + submit:

`DRAFT → PENDING_ADMIN_REVIEW`.

The EO sees:

- package name,
- submitted status,
- submitted timestamp,
- validation passed summary,
- clear explanation that Admin review is pending.

No package becomes LIVE merely because EO submitted it.

Rejected state must show a specific Admin rejection reason and return to editable draft/revision flow.

Approved/LIVE state may be represented via seeded demo data in this sprint; actual interactive Admin approval will be implemented in the Admin sprint.

## 14. Admin Handoff Contract

Later Admin package approval must be able to consume EO submission records directly.

Required future transition support:

`PENDING_ADMIN_REVIEW → REJECTED`

or:

`PENDING_ADMIN_REVIEW → APPROVED → LIVE`.

Do not hardwire builder submission to Traveler catalog publication.

Create/export clear read/decision helpers so the Admin sprint can connect without rewriting the EO feature store.

## 15. Sessions — EO16/EO17

Only approved/live package lifecycle may create/manage sellable sessions.

Minimum session fields:

- `sessionId`
- `packageId`
- start/end date-time
- status (`OPEN`, `FULL`, `CLOSED`, optionally `CANCELLED` where already used)
- capacity
- price snapshot.

Session creation must not mutate Traveler canonical fixture objects directly.

Use a centralized shared session source or a clean compatibility bridge so later cross-surface integration can make an approved EO-created session visible to Traveler without component duplication.

For this sprint, one seeded LIVE EO package/session may be used to demonstrate Sessions even before Admin integration is interactive.

## 16. Bookings — EO18

Bookings screen is operational/read-only for competition MVP.

Use shared `mockTransactionStore` where applicable rather than creating a second booking database.

EO may see bookings only for packages owned by that EO.

Minimum visible data:

- booking reference,
- package/session,
- trip date,
- participant count,
- payment/booking lifecycle status,
- total amount snapshot where appropriate.

Do not expose unrelated Traveler private quiz/contact data.

No payout/refund engine in this sprint.

## 17. Destinations Surface

`/partner/eo/destinations` shows the verified destination directory available to the EO, with verification level and guide-readiness clarity.

It is not a Destination Partner management screen.

Primary action may open builder with destination context.

## 18. Reviews Surface

Reuse the Traveler `mockReviewStore` helpers created in T19/T20.

EO reviews screen shows only `EO_GUIDE` reviews targeting the current organizer/EO.

Minimum:

- average rating computed from actual stored reviews,
- review count,
- review cards/comment where available,
- empty state if none.

Do not combine Destination reviews into EO rating.

## 19. Profile

Keep EO Profile competition-safe and minimal:

- business/organizer identity,
- guide status,
- contact/basic application information,
- application/approval status.

No complex settings system.

## 20. Partner Session / Access Boundary

Do not reuse Traveler onboarding guard as EO role authorization.

Create a small Partner/EO session/role boundary appropriate for prototype use.

Operational `/partner/eo/*` routes require an APPROVED EO role/demo identity.

Application/status routes remain available before approval.

The demo must provide an obvious safe way to enter the approved EO workspace.

## 21. Cross-Surface Data Rule

The following must be centralized because later roles consume them:

- EO application state,
- destination directory/verification metadata,
- demand insights,
- EO package drafts/submissions,
- EO-created sessions,
- Traveler transaction/booking data,
- Traveler EO reviews.

UI components are never the source of truth for these records.

## 22. Required States

At minimum where relevant:

- `LOADING`
- `EMPTY`
- `ERROR`
- `DRAFT`
- `PENDING_REVIEW`
- `REJECTED`
- `APPROVED`
- builder validation errors
- no eligible destinations
- no insights
- no sessions/bookings/reviews.

## 23. Visual Direction

Partner portal is desktop/tablet-first and data/workflow-oriented, but still recognizably JedaIn.

Before final refinement: **INVOKE TASTE SKILL**.

Aim for:

- calm professional wellness-travel operations,
- strong information hierarchy,
- clear stepper/workflow state,
- readable insight visualizations,
- destination imagery where it adds meaning,
- one strong primary action per screen.

Avoid:

- generic fintech dashboard,
- generic admin template look,
- excessive identical statistic cards,
- random gradients/glassmorphism,
- vanity charts with unsupported numbers,
- turning every field into a pill.

Use canonical design tokens and existing UI primitives.

## 24. Responsive & Accessibility

Primary validation viewport: `1440 x 900`.

Also validate partner usability at tablet/narrow desktop and at least basic mobile fallback.

Requirements:

- existing Partner sidebar/drawer behavior remains keyboard usable,
- one `main` landmark from shell,
- no nested `main`,
- semantic headings,
- real form labels,
- keyboard builder controls,
- accessible chart summaries/text equivalents,
- visible focus,
- 44px interactive targets where practical,
- dialogs/drawers manage focus,
- reduced motion respected.

## 25. Competition Test Matrix

Use high-value tests, not one test per sentence.

Must prove at least:

### Application
- new identity/application routing,
- pending/rejected/approved states,
- rejection reason + reapply,
- approved workspace access.

### Insights
- aggregate data only,
- no personal Traveler data,
- create-from-insight preserves insight context.

### Builder
- destination eligibility rules,
- CONCEPT_ONLY guide-ready enforcement at UI and submit boundary,
- itinerary draft persistence,
- pricing formula display,
- validation errors point to builder step,
- valid submit → exactly one `PENDING_ADMIN_REVIEW` submission,
- repeated submit/retry idempotent.

### Packages/status
- draft/pending/rejected/approved/live lifecycle visible,
- submitted package does not auto-publish.

### Sessions
- only approved/live package can create sellable session,
- no direct mutation of Traveler fixture,
- session data centralized.

### Bookings/reviews
- EO sees only owned-package bookings,
- reads shared transaction store,
- EO review surface reads `EO_GUIDE` only,
- average/count derived from stored review records.

### Access
- unapproved EO cannot access operational workspace,
- application/status pages remain reachable.

### Regression
- all Traveler tests remain green.

## 26. Browser Golden Demo

At 1440px, smoke:

`Partner → EO → approved demo workspace → Overview → Insights → Create Package from Insight → select eligible Destination → Insight → Itinerary → Pricing → Review → Submit → PENDING_ADMIN_REVIEW → Packages → Sessions → Bookings → Reviews`.

Also smoke:

- rejected application/reapply,
- builder validation error,
- no eligible destination for CONCEPT_ONLY rule.

No new console errors/warnings from EO feature.

## 27. Out of Scope

Do not implement in this EO sprint:

- Admin UI/approval screens,
- Destination Partner management UI,
- real auth/OAuth,
- real document upload/storage,
- production analytics pipeline,
- real payment payout/split,
- refunds,
- complaints,
- package version migration engine,
- production persistence,
- final global UI rebuild.

## 28. Completion Boundary

EO competition MVP is complete when the juror can see the business differentiator end-to-end and the resulting submission/session/review data are ready for Admin/Destination cross-surface integration.

After merge, move directly to Admin Trust Loop bundle, then Destination Partner, then final cross-surface + UI polish.