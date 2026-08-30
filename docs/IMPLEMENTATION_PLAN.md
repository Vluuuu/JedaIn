# JedaIn — Implementation Plan

**Version:** 0.1  
**Date:** 30 Agustus 2026  
**Agent Instructions:** [`../AGENTS.md`](../AGENTS.md)  
**Product Source:** [`../PRD.md`](../PRD.md)  
**System Flow:** [`SYSTEM_FLOW.md`](SYSTEM_FLOW.md)  
**UI Spec:** [`UI_SPEC.md`](UI_SPEC.md)  
**Design System:** [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)

> Plan ini memecah development menjadi vertical slices yang kecil, reviewable, dan cocok untuk Codex. Jangan mengimplementasikan seluruh produk dalam satu task besar.

---

# 1. Delivery Strategy

Urutan pembangunan:

```text
Foundation
  ↓
Traveler Auth & Onboarding
  ↓
Traveler Discovery
  ↓
Booking & Payment
  ↓
Trip & Review
  ↓
EO Partner
  ↓
Admin Trust Loop
  ↓
Destination Partner
  ↓
Integration / Hardening / Demo
```

Prinsip:

- setiap phase harus menghasilkan sesuatu yang bisa didemokan,
- business-critical state dikerjakan bersama happy path,
- mock data boleh dipakai sebelum backend selesai, tetapi harus melalui adapter/interface,
- jangan memblok UI work hanya karena payment gateway/business number belum final.

---

# 2. Phase 0 — Repository & Frontend Foundation

## P0.1 App Bootstrap

Goal:

- initialize web application,
- routing baseline,
- lint/typecheck/test baseline,
- environment/config structure.

Acceptance:

- app boots locally,
- lint passes,
- typecheck passes,
- tests command exists,
- no feature UI yet except minimal shell.

## P0.2 Design Tokens & UI Primitives

Implement from `DESIGN_SYSTEM.md`:

- color tokens,
- typography,
- spacing/radius/shadow,
- Button,
- Input,
- Checkbox,
- Badge,
- Card,
- Skeleton,
- EmptyState,
- ErrorState,
- Dialog.

Acceptance:

- no scattered raw brand colors in pages,
- accessible focus styles,
- basic component variants documented/tested.

## P0.3 App Shells

Implement:

- Traveler public shell,
- Traveler logged-in shell,
- Partner shell,
- Admin shell.

No business pages beyond placeholders.

---

# 3. Phase 1 — Traveler Authentication & Onboarding

## P1.1 Login/Register UI

Screens:

- T02.

Required states:

- idle,
- authenticating,
- OTP flow placeholder/adapter,
- recoverable error.

Do not implement guest access.

## P1.2 Consent & Onboarding Routing

Screens:

- T03.

State routing:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

Acceptance:

- new account cannot enter Home before onboarding complete,
- consent not pre-checked,
- resume logic represented cleanly.

## P1.3 Mandatory Quiz

Screens:

- T04.

MVP six-step wizard:

1. healing intent,
2. activity,
3. budget,
4. duration,
5. departure area,
6. group type/size.

Acceptance:

- progress,
- back/next,
- validation,
- resume state,
- final submit state.

## P1.4 Recommendation Result

Screen:

- T05.

Implement rule-based result presentation using mock/adapter data.

Acceptance:

- top match,
- `Kenapa cocok?`,
- fallback state with no misleading percentage.

---

# 4. Phase 2 — Traveler Discovery

## P2.1 Logged-in Home

Screen:

- T06.

Required states:

- normal,
- pending payment,
- upcoming trip,
- both,
- partial error/loading.

## P2.2 Explore / Search / Filter

Screen:

- T07.

Minimum filters:

- budget,
- duration,
- departure/location,
- destination.

## P2.3 Package Detail

Screen:

- T08.

Must display:

- itinerary,
- price,
- verification,
- EO/guide,
- destination,
- sessions preview,
- policy.

## P2.4 Session Selection

Screen:

- T09.

Must handle:

- OPEN,
- FULL,
- CLOSED,
- CANCELLED.

---

# 5. Phase 3 — Booking & Payment

## P3.1 Checkout Summary

Screen:

- T10.

Checks:

- session availability,
- contact readiness,
- pending payment guard.

## P3.2 Contact Verification

Screen/modal:

- T11.

Keep authentication/contact adapter isolated.

## P3.3 Pending Payment Guard

Screen:

- T12.

Acceptance:

- no second payment created while active pending payment exists,
- Continue flow,
- Cancel confirmation,
- slot release represented through service adapter.

## P3.4 Payment Countdown

Screen:

- T13.

Acceptance:

- countdown derives from server `expires_at`,
- refresh safe,
- expired state,
- failed state,
- no duplicate attempts through UI behavior.

## P3.5 Payment Result

Screens:

- T14/T15.

Success/failure/expired messaging must be authoritative and explicit.

---

# 6. Phase 4 — Trips & Trust

## P4.1 My Trips

Screens:

- T16/T17.

Sections:

- pending,
- upcoming,
- completed.

## P4.2 Completed Trip & Review Eligibility

Screen:

- T18.

Review CTA only for `COMPLETED` booking.

## P4.3 Venue Review

Screen:

- T19.

One per completed booking.

## P4.4 EO/Guide Review

Screen:

- T20.

Separate record/state from venue review.

---

# 7. Phase 5 — EO Partner Core

## P5.1 Partner Entry & EO Application

Screens:

- EO01–EO04.

Application state:

```text
DRAFT
SUBMITTED
PENDING_REVIEW
APPROVED
REJECTED
```

## P5.2 EO Dashboard

Screen:

- EO05.

## P5.3 Demand Insights

Screen:

- EO06.

Never fake historical trend values.

## P5.4 Packages List

Screen:

- EO07.

## P5.5 Trip Builder

Screens:

- EO08–EO12.

Stepper:

```text
Destination
Insight
Itinerary
Pricing
Review
```

## P5.6 Submission/Approval State

Screens:

- EO13/EO14.

Show exact backend validation/rejection reason.

## P5.7 Sessions & Bookings

Screens:

- EO15–EO18.

---

# 8. Phase 6 — Admin Trust Loop

## P6.1 Admin Shell & Dashboard

Screens:

- A01/A02.

## P6.2 EO Approval

Screens:

- A03/A04.

## P6.3 Destination Verification

Screens:

- A05/A06.

## P6.4 Package Approval

Screens:

- A07/A08.

Must display automatic validation before manual checklist.

## P6.5 Complaint & Trust

Screens:

- A10/A11/A12.

Do not finalize unresolved refund policy in frontend logic.

---

# 9. Phase 7 — Destination Partner

## P7.1 Application & Verification Status

Screens:

- DP01–DP04.

## P7.2 Destination Dashboard

Screens:

- DP05–DP09.

## P7.3 Reviews/Profile

Screens:

- DP10/DP11.

---

# 10. Phase 8 — Integration & Demo Hardening

Required:

- replace mocks with real adapters where available,
- validate route guards,
- validate canonical states,
- end-to-end golden demo,
- error and loading audit,
- responsive audit,
- accessibility pass,
- basic performance pass,
- demo seed data,
- documentation update.

Golden demo:

```text
Traveler Register
→ Consent
→ Quiz
→ Recommendation
→ Home
→ EO Insight
→ EO Builder
→ Admin Approval
→ Package LIVE
→ Traveler Session
→ Checkout
→ Payment
→ Trip COMPLETED
→ Venue + EO Review
```

---

# 11. Codex Issue Template

Every implementation issue should include:

```markdown
## Goal

## Source of Truth
- PRD section:
- System Flow section:
- Wireframe screen:
- UI Spec section:
- Design System section:

## Scope

## Out of Scope

## Required States

## Acceptance Criteria

## Tests / Checks

## Notes / Pending Decisions
```

---

# 12. Review Gate Between Phases

Do not start the next major phase automatically just because code exists.

Review:

1. flow correctness,
2. state correctness,
3. UI consistency,
4. test health,
5. unresolved product assumptions,
6. demo readiness.

A phase may overlap only when dependencies are clearly separated.

---

# 13. Immediate Next Work

Recommended first implementation sequence:

```text
P0.1 App Bootstrap
P0.2 Design Tokens & UI Primitives
P0.3 App Shells
P1.1 Login/Register
P1.2 Consent & Routing
P1.3 Quiz
P1.4 Recommendation Result
P2.1 Traveler Home
```

Do not ask Codex to implement all eight tasks in one prompt. Use separate issues/PRs so each change is reviewable.