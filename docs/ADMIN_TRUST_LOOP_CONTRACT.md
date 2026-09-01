# JedaIn — Admin Trust Loop Competition Contract

**Status:** LOCKED FOR COMPETITION MVP  
**Date:** 1 September 2026  
**Scope:** A01–A13 / Admin Trust & Approval Core

This contract bundles the Admin surface after Traveler and EO golden flows are complete. The purpose is to make the trust layer visible and operational without overbuilding production administration.

## 1. Source Priority

When implementation details conflict, use:

`PRD.md > SYSTEM_FLOW.md > WIREFRAME_SPEC.md > UI_SPEC.md > IMPLEMENTATION_PLAN.md > ADMIN_TRUST_LOOP_CONTRACT.md > DESIGN_SYSTEM.md > issue notes > implementation`.

Do not invent a business rule when source documents leave a decision open. If a prototype-only value is necessary, label it clearly as prototype/configurable.

## 2. Competition Goal

The Admin flow must make JedaIn's trust loop visible:

`EO Application → Admin Approval → EO Builds Package → Automatic Validation → Admin Package Review → Approved Package → Session/Booking → Reviews/Complaints → Trust Inspection → Audit Trail`.

The Admin is a trust operator, not a second content creator. Admin screens are inspection-first, queue-oriented, and every manual state change must be attributable and auditable.

## 3. Priority Boundary

Source documents classify:

- A01 Admin Login — Must
- A02 Admin Overview — Must
- A03 EO Approval Queue — Must
- A04 EO Application Review — Must
- A05 Destination Verification Queue — Must
- A06 Destination Verification Detail — Must
- A07 Package Approval Queue — Must
- A08 Package Review Checklist — Must
- A09 Bookings / Payments — Should
- A10 Complaint Queue — Should / Must if demoed
- A11 Complaint Classification — Should / Must if demoed
- A12 Trust & Status — Should
- A13 Audit Activity — Should

Competition-sprint delivery remains one PR. A01–A08 must be fully demoable. A09–A13 should be implemented as a compact trust/inspection layer so the juror can understand the closed loop without production-grade back-office complexity.

## 4. Routes

Use the routes already present in App/UI specs:

- `/admin/login`
- `/admin`
- `/admin/eo-approvals`
- `/admin/eo-approvals/:applicationId`
- `/admin/destination-verifications`
- `/admin/destination-verifications/:applicationId`
- `/admin/package-approvals`
- `/admin/package-approvals/:submissionId`
- `/admin/bookings`
- `/admin/complaints`
- `/admin/complaints/:complaintId`
- `/admin/trust`
- `/admin/audit`

Admin navigation remains exactly:

`Overview | EO Approvals | Destination Verification | Package Approvals | Bookings / Payments | Complaints | Trust & Status | Audit / Activity`.

## 5. Admin Access Boundary — A01

Admin is a separate surface with no public admin registration.

Competition MVP:

- use a centralized prototype `adminSessionStore` or equivalent,
- provide one deterministic demo Admin identity,
- `/admin/*` operational routes require an authenticated Admin session,
- `/admin/login` remains reachable while logged out,
- do not reuse Traveler onboarding guard or EO PartnerRouteGuard,
- no real OAuth/KYC/admin provisioning backend in this sprint.

The demo shortcut must be explicit, e.g. `Masuk sebagai Admin Demo`.

## 6. Admin Overview — A02

Overview is queue-first, not vanity-metric-first.

Top queues required by wireframe:

1. EO applications pending,
2. Destination verifications pending,
3. Package approvals pending,
4. Critical complaints.

Use counts derived from centralized stores only.

May also show compact operational summaries from existing shared stores:

- active/open sessions,
- paid/completed bookings,
- latest audit events.

Do not invent growth rates, GMV trends, conversion rates, or production SLAs.

Primary action should open the highest-priority non-empty queue.

## 7. Shared Admin Audit Store

Create one centralized audit store reusable by Admin actions and later cross-surface hardening.

Minimum event shape:

- `auditId`
- `actorId`
- `actorLabel`
- `actionType`
- `entityType`
- `entityId`
- `reason`
- `createdAt`
- optional concise `metadata` / previous-next status where already known.

Rules:

- every manual Admin state-changing action requires a non-empty audit reason/note,
- state mutation and audit creation must behave atomically from the prototype caller perspective,
- rejected/invalid mutation must not create a false successful audit event,
- repeated idempotent action must not create duplicate state changes; audit behavior should be deterministic,
- UI components are not the audit source of truth.

## 8. EO Approval Queue — A03

Read directly from `mockApplicationStore` created by EO sprint.

Queue source:

`status === PENDING_REVIEW`.

Minimum queue information:

- application/business identity,
- contact person,
- guide status,
- submitted date,
- current status,
- review action.

Filtering/search may be lightweight.

Click → `/admin/eo-approvals/:applicationId`.

Do not duplicate EO applications into an Admin-only database.

## 9. EO Application Review — A04

Review the authoritative application record.

Show application information already stored by EO flow, including where available:

- business information,
- contact person,
- experience/portfolio summary,
- guide status,
- prototype document metadata/status,
- SOP agreement,
- submission timestamp,
- prior rejection reason/history if represented.

Actions:

- Approve
- Reject

Rules:

- only `PENDING_REVIEW` may be approved/rejected,
- reject requires a specific rejection reason,
- every approve/reject also requires an Admin audit reason/note,
- use `mockApplicationStore.approveApplication()` / `rejectApplication()` or hardened wrappers around those authoritative helpers,
- invalid/stale review must fail safely with zero mutation,
- approval must immediately make the EO operational guard recognize the application as APPROVED,
- rejection must immediately be visible on the EO application-status surface and remain re-applicable with the same identity.

Golden cross-surface proof:

`EO PENDING_REVIEW → Admin Approve → same EO identity can open /partner/eo`.

and:

`EO PENDING_REVIEW → Admin Reject(reason) → EO status shows same reason`.

## 10. Destination Verification Boundary — A05/A06

Destination Partner UI is not implemented yet, but Admin must have a reusable verification boundary ready for that upcoming sprint.

Create one centralized `mockDestinationVerificationStore` (or equivalent) for verification applications. It must be separate from the canonical verified destination directory while able to promote an approved application into that directory.

Minimum verification application shape:

- `applicationId`
- stable `destinationIdentityId` / destination owner identity reference
- proposed destination name/location
- operational/profile summary needed for review
- guide-readiness evidence/answer represented as prototype metadata
- submitted date
- status
- rejection reason if rejected.

Seed at least one deterministic `PENDING_REVIEW` application for Admin demo.

Later Destination Partner sprint must submit into this same store rather than creating a second queue.

## 11. Destination Verification Decision — A06

Wireframe locks initial decisions to:

- Reject + reason
- Approve BASIC
- Approve BASIC + `guide_ready`

`PLUS` is not an initial-application approval result; PLUS belongs to later trust lifecycle.

Rules:

- only pending verification applications may be decided,
- reject requires specific reason,
- approval creates/updates the canonical destination directory through one authoritative store helper,
- initial verification level is `BASIC`,
- `guideReady` is explicit true/false based on chosen Admin decision and reviewed prototype evidence,
- do not silently create `PLUS` on first approval,
- every decision requires audit reason/note and creates one audit event,
- duplicate approval/reject attempts are deterministic and do not duplicate canonical destinations.

This is the bridge required for the next Destination Partner sprint.

## 12. Package Approval Queue — A07

Read directly from `mockEoPackageStore`.

Queue source:

`status === PENDING_ADMIN_REVIEW`.

Minimum columns/content:

- package title,
- EO/business identity,
- destination,
- submitted date,
- automatic validation status,
- review action.

Click → `/admin/package-approvals/:submissionId` where `submissionId` maps to the authoritative EO `packageId` for MVP unless a separate stable submission ID already exists.

Do not create an Admin-only package copy.

## 13. Package Review Checklist — A08

Admin reviews the exact EO submission snapshot/read model.

Main preview should expose the information needed to inspect:

- package title/value proposition,
- EO/guide identity/status,
- selected destination + verification/guide readiness,
- selected aggregate insight where present,
- itinerary coherence,
- duration,
- safety/operational notes,
- pricing formula breakdown,
- centralized automatic validation result.

The wireframe explicitly includes itinerary coherence and leaves other final checklist details pending business-team validation. Therefore do not invent a large scoring rubric.

Competition checklist may be a concise human-review layer around already-known rules:

- automatic validation passed,
- destination still verified/active,
- guide rule still valid,
- itinerary is readable/coherent,
- pricing snapshot is internally coherent,
- safety/operational notes present.

Actions:

- Approve
- Reject

Reject reason is mandatory.

Rules:

- only `PENDING_ADMIN_REVIEW` may be approved/rejected,
- every action requires audit reason/note,
- use existing `mockEoPackageStore.approvePackage()` / `rejectPackage()` authoritative helpers,
- Admin approval changes package to `APPROVED`, not directly `LIVE`,
- do not auto-create Traveler marketplace entry,
- do not auto-create a session,
- rejected package must surface the same reason in EO package detail/revision flow,
- stale/invalid package state must fail safely.

Golden proof:

`EO submits PENDING_ADMIN_REVIEW → Admin Approve → EO sees APPROVED and can manage/create session`.

and:

`EO submits → Admin Reject(reason) → EO sees REJECTED reason and can revise`.

## 14. Bookings / Payments — A09

Inspection-first and read-only for competition MVP.

Use shared `mockTransactionStore`. Do not create another booking/payment database.

Minimum useful fields:

- booking reference,
- package/session,
- booking status,
- payment-attempt status where available,
- participant count,
- total snapshot,
- created/paid/expired timing where available.

Admin may inspect but must not:

- fabricate refunds,
- fabricate payout settlement,
- mutate successful payments,
- override capacity ledger from this screen.

No Traveler quiz answers or unnecessary private contact data.

## 15. Complaint Queue / Classification — A10/A11

Complaint UI is supporting scope but useful to demonstrate trust-loop closure.

Create one centralized prototype complaint store only if needed for this bundle. It must be explicitly prototype data and reusable by later Traveler complaint implementation.

Minimum complaint record:

- `complaintId`
- booking/package/session reference where available
- target entity reference if relevant
- concise category/classification field
- description/summary
- status
- createdAt
- unresolved duration derived from timestamp, not fake trend data.

The exact production classification taxonomy is not fully locked in current sources. Keep the competition taxonomy deliberately small and label it prototype/configurable; do not claim a final moderation policy.

A11 may allow Admin to confirm a classification and add an internal note. Any state-changing classification action requires audit reason and creates an audit event.

Do not implement refunds/financial dispute resolution.

## 16. Trust & Status — A12

Purpose: inspect entity trust state and demonstrate that approvals/reviews/complaints feed a trust-control surface.

Entity search/list may cover:

- EO,
- Destination.

Show only signals backed by shared data:

- application/verification status,
- destination verification level,
- guide readiness,
- stored EO or Destination review average/count,
- complaint count if complaint store exists.

Wireframe allows `Downgrade / Suspend / Inspect`, but the exact production trust taxonomy and downstream suspension behavior are not fully locked.

Competition rule:

- inspection is required,
- if implementing a manual `Suspend` or `Downgrade`, label it prototype and keep the state model minimal,
- every manual trust-state change requires non-empty reason and audit event,
- never silently invent automatic penalties or thresholds,
- initial Destination `PLUS` must not be granted from A06; a PLUS demo transition may only occur here if clearly labeled a manual trust-lifecycle prototype action.

Do not break Traveler/EO flows with speculative cross-surface suspension behavior in this sprint; enforcement propagation belongs to final cross-surface hardening unless already defined by authoritative source.

## 17. Audit Activity — A13

Read from the shared Admin audit store.

Timeline/table minimum:

- timestamp,
- Admin actor,
- action,
- entity type/id/label,
- reason,
- previous → next status where available.

Filters may be lightweight by entity/action.

Audit is append-only from UI perspective.

No delete/edit controls for audit events.

## 18. Data Authority Map

Admin must consume existing shared stores rather than duplicate them:

- EO applications → `mockApplicationStore`
- EO package submissions → `mockEoPackageStore`
- verified destinations → `mockDestinationStore`
- EO-created sessions → `mockEoPackageStore` session helpers
- Traveler bookings/payments → `mockTransactionStore`
- Traveler reviews → `mockReviewStore`
- Destination verification applications → new centralized verification store
- Complaints → compact centralized complaint store if implemented
- Admin actions → new centralized audit store
- Admin session → new small Admin session store.

## 19. Cross-Surface Atomicity Expectations

For competition prototype, an Admin decision should behave like one server-shaped command:

1. validate authenticated Admin,
2. validate current authoritative entity state,
3. validate required decision reason,
4. execute the state transition,
5. append audit event,
6. return refreshed authoritative snapshot.

A failed validation must cause zero successful business mutation.

Avoid direct state mutation from React components.

## 20. Admin UI Direction

Admin is desktop-first, information-dense but readable.

Before final Admin visual refinement: **INVOKE TASTE SKILL**.

Visual personality:

- calm operational trust console,
- clear queues,
- readable tables,
- strong status hierarchy,
- checklist-based review,
- clear destructive/approval decisions,
- still recognizably JedaIn.

Avoid:

- generic fintech dashboard,
- giant vanity KPI cards,
- neon/gradient admin template,
- random glassmorphism,
- dense enterprise UI with dozens of unsupported controls,
- fake analytics charts.

This is not the final global UI rebuild; final visual harmonization happens after Admin + Destination Partner + cross-surface completion.

## 21. Responsive & Accessibility

Primary validation viewport: `1440 x 900`.

Also validate 1280 desktop, narrow/tablet fallback, and basic mobile access where practical.

Requirements:

- reuse existing `WorkspaceShell` and `adminNavigation`,
- one `main` landmark from shell,
- no nested `main`,
- semantic h1/h2,
- tables use proper headers,
- decision forms use real labels,
- keyboard-accessible queue/detail actions,
- visible focus,
- destructive/reject actions visually distinct and confirmed where appropriate,
- dialogs manage focus,
- status is not color-only,
- reduced-motion preference respected.

## 22. Required Test Matrix

Use high-value integration tests, not one test per sentence.

### Access

- logged-out `/admin/*` cannot access workspace,
- Admin demo login opens workspace,
- Partner/Traveler identity cannot implicitly count as Admin.

### EO Approval

- queue reads shared EO applications,
- approve pending application → APPROVED,
- reject pending application → REJECTED with exact reason,
- invalid/stale transition rejected,
- EO operational guard reacts to approval,
- EO status page reacts to rejection.

### Destination Verification

- pending seeded application appears,
- approve BASIC creates/updates canonical destination once,
- approve BASIC + guide_ready sets guideReady true,
- reject reason persists,
- initial approval never grants PLUS,
- duplicate decision is idempotent.

### Package Approval

- queue reads shared EO package submissions,
- automatic validation visible,
- approve pending → APPROVED only,
- reject pending → REJECTED with exact reason,
- approval does not auto-LIVE or auto-publish Traveler catalog,
- EO sees updated state after Admin action.

### Audit

- successful manual Admin actions create audit events,
- missing reason blocks mutation,
- failed mutation does not create success audit,
- audit event contains actor/entity/action/reason/timestamp.

### Bookings

- reads shared transaction store,
- shows authoritative booking/payment status,
- no duplicate ledger,
- no payment mutation controls.

### Complaints/Trust

- if implemented, queue/classification use centralized prototype store,
- no fake automatic trust penalty,
- any manual trust action requires reason + audit.

### Regression

- all Traveler tests remain green,
- all EO tests remain green.

## 23. Browser Golden Demo

At 1440px smoke:

`Admin Login → Overview → EO Approvals → pending EO → Approve → EO application becomes APPROVED → Package Approvals → pending package → checklist → Approve → package becomes APPROVED → Bookings/Payments → Trust & Status → Audit Activity`.

Also smoke:

- EO rejection with exact reason,
- Package rejection with exact reason,
- Destination verification: Approve BASIC + guide_ready,
- invalid/stale decision recovery,
- audit event for each successful manual decision.

Validate narrow/tablet fallback.

Console:

- 0 new Admin errors,
- 0 new Admin warnings.

Legacy Explore test warnings are unrelated/out of scope.

## 24. Out of Scope

Do not implement in this Admin sprint:

- production RBAC/IAM,
- real admin provisioning,
- production KYC/document verification,
- real fraud/risk scoring,
- real payment gateway controls,
- refunds/payouts/settlement,
- automated complaint moderation,
- final trust-scoring algorithm,
- production audit backend,
- Destination Partner operational UI,
- Traveler complaint creation UI unless required by a tiny compatibility fixture,
- final global UI rebuild.

## 25. Completion Boundary

Admin competition MVP is complete when a juror can see that JedaIn does not rely on unreviewed marketplace listings: EO applications and packages enter explicit Admin queues, destination verification is a controlled trust boundary, decisions propagate back to partner state, and every manual decision is visible in the audit trail.

After merge, move directly to Destination Partner golden-flow bundle, then final cross-surface integration, then final UI rebuild/polish.