# JedaIn — Traveler Pending Payment Resolution Contract (T12)

**Version:** 0.1  
**Date:** 1 September 2026  
**Status:** LOCKED FOR MVP  
**Screen:** T12 — Pending Payment Resolution

> This contract locks the MVP behavior of the Traveler pending-payment resolution step. It refines implementation details without overriding higher product sources.

---

# 1. Source Priority

Implementation decisions must follow:

```text
PRD.md
> docs/SYSTEM_FLOW.md
> docs/WIREFRAME_SPEC.md
> docs/UI_SPEC.md
> docs/RECOMMENDATION_CONTRACT.md
> docs/HOME_CONTRACT.md
> docs/EXPLORE_CONTRACT.md
> docs/PACKAGE_DETAIL_CONTRACT.md
> docs/SESSION_SELECTION_CONTRACT.md
> docs/CHECKOUT_SUMMARY_CONTRACT.md
> docs/CONTACT_VERIFICATION_CONTRACT.md
> docs/PENDING_PAYMENT_RESOLUTION_CONTRACT.md
> docs/DESIGN_SYSTEM.md
> docs/TRAVELER_VISUAL_DIRECTION.md
> issue notes
> implementation
```

If a lower source conflicts with a higher source, the higher source wins.

---

# 2. Product Purpose

T12 exists because JedaIn permits at most **one active `PENDING_PAYMENT` per Traveler**.

The business flow is:

```text
Traveler attempts a new Checkout
→ active PENDING_PAYMENT exists
→ DO NOT create another payment/booking/reservation
→ show the existing pending payment
→ Traveler chooses:
   A. continue the existing payment
   B. cancel the old pending booking
```

T12 is **not** the payment-provider screen. T13 owns payment execution/provider/countdown completion behavior.

Browsing remains allowed while a pending payment exists. Only creation of a new checkout transaction/payment is blocked.

---

# 3. Route & New-Checkout Context

For the current MVP, T12 is implemented as a dedicated route:

```text
/checkout/:sessionId/pending-payment
```

`sessionId` is the **new Checkout Session the Traveler was trying to buy**, not the Session belonging to the existing pending booking.

This distinction is important:

```text
route sessionId
= intended new Checkout context

existing pending booking.sessionId
= old/currently reserved transaction
```

After the old pending booking is cancelled or is no longer active, recovery returns to:

```text
/checkout/:sessionId
```

T12 must never silently replace the intended new `sessionId` with the old pending Session.

---

# 4. Access & Shell

T12 requires:

- authenticated Traveler,
- onboarding `COMPLETED`,
- existing `OnboardingRouteGuard`,
- focused Traveler checkout shell,
- `TravelerAppShell showBottomNav={false}`.

Do not show the normal Traveler bottom navigation on T12.

No guest flow.

---

# 5. Entry Conditions

Normal entry is from T10 after required contact readiness is satisfied and the new Checkout submit detects an active pending payment.

Locked order remains:

```text
T10 local draft
→ contact readiness
→ active pending-payment guard
→ if active: T12
```

T12 must not create a second transaction on entry.

Direct URL reload is allowed.

On direct reload:

- if an active pending payment exists for the authenticated Traveler → render ACTIVE,
- if no active pending payment exists anymore → render `NO_ACTIVE_PENDING`,
- do not create a replacement booking/payment automatically.

---

# 6. Authoritative Pending-Payment Source

T12 must reuse the shared Checkout transaction boundary/store created in T10.

Current source:

```text
src/features/checkout/mockTransactionStore.ts
```

Do not create a second independent pending-payment fixture database.

T12 may add a dedicated adapter/view model over the shared store.

Suggested feature boundary:

```text
src/features/pendingPayment/
  types.ts
  mockAdapter.ts
  PendingPaymentResolutionScreen.tsx
  PendingPaymentSummary.tsx
  pendingPayment.css
  pendingPayment.test.tsx
  index.ts
```

Exact file names may vary.

---

# 7. One-Active-Pending Invariant Must Be Store-Level

The one-active-pending rule is a critical business rule and must not depend only on T10 UI/adapter pre-checks.

The shared transaction store must enforce:

```text
at most one non-expired PENDING_PAYMENT Booking per Traveler
```

inside the atomic transaction creation boundary.

Required transaction order for a NEW transaction:

1. idempotent replay check,
2. reconcile expired pending records,
3. check active pending payment for Traveler,
4. if active → reject new creation with `ACTIVE_PENDING_PAYMENT`,
5. otherwise perform capacity check,
6. create one Booking + one PaymentAttempt atomically.

This closes the race where two new Checkout requests both pass an adapter-level pre-check before either transaction commits.

T10 must map a store-level `ACTIVE_PENDING_PAYMENT` race result back to the existing T12 handoff behavior.

Idempotent replay of the already-committed same transaction remains allowed and must not be blocked by its own pending booking.

---

# 8. Existing Pending Summary

T12 must show the **existing** pending transaction, not details of the new Checkout draft.

Required information from higher sources:

- existing Package,
- existing Session,
- amount,
- payment expiration time,
- remaining time,
- payment status.

Traveler-facing active status label:

```text
Menunggu Pembayaran
```

Title:

```text
Kamu masih punya pembayaran yang belum selesai.
```

Required notice direction:

```text
Selesaikan atau batalkan pembayaran ini sebelum membuat pembayaran baru.
```

Equivalent concise wording is allowed, but it must not imply the new Checkout was already booked.

---

# 9. Existing Package / Session Resolution

Use the Booking record as the transaction identity source:

```text
booking.packageId
booking.sessionId
```

Resolve display metadata from the existing centralized Package/Session catalogs when available:

```text
MOCK_RECOMMENDATION_PACKAGES
MOCK_PACKAGE_DETAILS
```

Do not duplicate Package/Session fixtures for T12.

The old Booking amount must come from the Booking transaction snapshot:

```text
booking.totalAmount
```

Do not recompute the old payable amount from the current Package starting price.

If current catalog metadata cannot be resolved, the transaction must still never be silently replaced by another Package/Session. A recoverable/degraded error state is preferable to displaying the wrong transaction.

---

# 10. Session Date / Time

If the existing Session metadata is resolvable, reuse:

```text
formatSessionDateTimeRange()
```

Timezone remains:

```text
Asia/Jakarta
WIB
```

Do not create a second Session date formatter.

---

# 11. Payment Expiration Timestamp

`payment_expires_at` / `Booking.paymentExpiresAt` is authoritative transaction data.

Display the exact expiration timestamp in Traveler-friendly form using `Asia/Jakarta` / `WIB`.

Do not hardcode a new timeout duration in T12.

The current prototype timeout configuration may continue to live in the shared Checkout transaction configuration.

The UI must not assume that every payment always has 15 minutes remaining when T12 opens.

---

# 12. Remaining-Time Countdown

T12 is required to show remaining time.

However:

```text
frontend countdown != payment authority
```

Server/store payment state and expiration timestamp remain the source of truth.

Recommended adapter-shaped model:

```text
expiresAt
serverNow
```

The UI may derive a visual countdown from the authoritative timestamps and tick locally between refreshes.

When the visible countdown reaches zero:

1. do not independently mutate Booking state from React,
2. revalidate/reconcile through the adapter/store,
3. render the authoritative result.

Do not create a new payment countdown configuration in the component.

---

# 13. Countdown Accessibility

Do not live-announce the numeric countdown every second.

The visible countdown may update every second, but assistive technology should receive meaningful state changes rather than constant announcements.

Announce once when the transaction becomes expired, for example:

```text
Pembayaran sudah kedaluwarsa.
```

No assertive per-second live region.

---

# 14. Primary Action — Continue Existing Payment

Primary CTA exact copy:

```text
Lanjutkan Pembayaran
```

Before navigation, revalidate the existing transaction through the adapter/store.

Required checks:

- Booking belongs to authenticated Traveler,
- Booking is still `PENDING_PAYMENT`,
- expiration is still authoritative-active,
- associated PaymentAttempt is still valid for continuation in the current MVP.

If still active:

```text
/payment/:bookingId
```

T12 must **not** create:

- a new Booking,
- a second PaymentAttempt,
- a new reservation,
- a new payment expiration timestamp.

It opens the already-created payment flow.

---

# 15. Continue Race / Stale State

If the pending Booking expires between page render and `Lanjutkan Pembayaran`:

- remain in T12,
- do not navigate to an expired Payment as if still active,
- reconcile authoritative expiry,
- render `EXPIRED`.

If the Booking is already cancelled/resolved elsewhere:

- do not create anything,
- render `NO_ACTIVE_PENDING` or equivalent resolved state,
- provide recovery to the intended new Checkout.

A recoverable request failure must not mutate the transaction.

---

# 16. Secondary Action — Cancel Old Booking

Secondary destructive CTA for MVP:

```text
Batalkan Pesanan Lama
```

This wording follows the wireframe distinction that the Traveler is cancelling the **old** pending booking, not the new Checkout they were attempting.

Cancellation must not happen on the first tap.

A confirmation step/dialog is required.

Required warning:

```text
Slot yang sedang kamu pegang akan dilepas dan mungkin diambil traveler lain.
```

The destructive confirmation must be visually and semantically distinct from the primary continue action.

---

# 17. Atomic Cancellation Boundary

Cancellation is a transaction-store operation, not a collection of unrelated UI mutations.

Suggested store action:

```text
cancelPendingBooking({
  travelerId,
  bookingId
})
```

For an active pending booking, the operation must atomically:

1. verify authenticated Traveler owns the Booking,
2. reconcile expiry first,
3. require current Booking state `PENDING_PAYMENT`,
4. transition Booking → `CANCELLED`,
5. close the associated mock PaymentAttempt as `CANCELLED`,
6. release the Booking's reserved quantity,
7. return a deterministic result.

For MVP, marking the shared mock PaymentAttempt `CANCELLED` is internal transaction consistency; it does not claim a production payment gateway cancellation API exists.

There is no refund in this flow because the Booking is still unpaid/pending.

---

# 18. Reservation Release

After successful cancellation:

```text
Booking = CANCELLED
reserved slot released
```

The shared capacity ledger must immediately stop counting that Booking's `reservedQuantity` as active reservation.

Do not manually decrement canonical Session fixture capacity.

Do not release twice on retries/double clicks.

---

# 19. After Cancellation

After successful cancellation:

```text
/checkout/:sessionId
```

where `sessionId` is the intended new Checkout route parameter.

Important:

T12 cancellation **does not automatically create the new Booking**.

T10 must run its normal rules again:

- contact readiness,
- pending-payment guard,
- current Session/package status,
- exact Session price,
- capacity,
- policy acknowledgement / Checkout draft.

The new Session may have become unavailable while the Traveler was resolving the old payment.

---

# 20. Cancellation Idempotency

Cancellation must be safe against:

- double click,
- UI retry,
- lost response followed by retry.

Repeating cancellation for the same already-cancelled Booking must not:

- release capacity twice,
- create/delete another PaymentAttempt,
- change a different Booking.

Return a deterministic already-resolved/cancelled result.

---

# 21. Expiration Reconciliation

The current transaction store must evolve from merely *ignoring* expired pending Bookings to explicitly reconciling their transaction state.

For a `PENDING_PAYMENT` Booking where authoritative time is at/after `paymentExpiresAt`:

```text
Booking → EXPIRED
associated PENDING PaymentAttempt → EXPIRED
reserved quantity released
```

This reconciliation belongs in the shared transaction/store boundary.

Suggested behavior:

```text
reconcileExpiredPendingPayments(now)
```

or an equivalent internal helper called by pending-payment reads/actions.

Do not depend on the T12 component staying mounted for expiration correctness.

---

# 22. Expired While Screen Is Open

Wireframe behavior is locked:

When the pending payment expires while T12 is open:

- UI transitions to an expired state,
- active payment actions disappear/disable,
- reservation has been released through authoritative reconciliation,
- CTA becomes:

```text
Kembali ke Checkout
```

Destination:

```text
/checkout/:sessionId
```

Do not automatically create a replacement Booking.

---

# 23. No Active Pending State

A direct/reloaded T12 route can race with another tab, cancellation, or expiration.

If the authenticated Traveler has no active pending payment:

State:

```text
NO_ACTIVE_PENDING
```

Copy direction:

```text
Tidak ada pembayaran tertunda yang aktif.
```

CTA:

```text
Kembali ke Checkout
```

Destination:

```text
/checkout/:sessionId
```

No new transaction is created by this state.

---

# 24. Ownership / Identity Safety

T12 must never show or mutate another Traveler's pending payment.

Every adapter/store action must bind to the authenticated Traveler identity.

Do not trust an arbitrary `travelerId` supplied only by the UI.

Cancellation and continuation must verify Booking ownership at the authoritative mock boundary.

---

# 25. Booking / Payment Status Model Needed by T12

The existing prototype types may be expanded minimally for T12.

Booking statuses needed here:

```text
PENDING_PAYMENT
CANCELLED
EXPIRED
```

PaymentAttempt statuses needed here:

```text
PENDING
CANCELLED
EXPIRED
```

Do not implement `PAID`, gateway success/failure reconciliation, refund, or payment-result behavior in T12 unless a small type-compatible extension is strictly required for future-safe code.

T13/T14/T15 own the rest of payment lifecycle implementation.

---

# 26. State Model

Minimum T12 states:

```text
LOADING
ACTIVE
CONTINUING
CANCEL_CONFIRM
CANCELLING
EXPIRED
NO_ACTIVE_PENDING
ERROR
ACTION_ERROR
```

State meanings:

### LOADING
Resolve intended Checkout context + authenticated Traveler's pending transaction.

### ACTIVE
Existing active pending payment summary is shown.

### CONTINUING
Revalidating existing payment before routing to T13.

### CANCEL_CONFIRM
Explicit confirmation visible before destructive mutation.

### CANCELLING
Atomic cancellation request in progress.

### EXPIRED
Existing pending transaction is now authoritatively expired.

### NO_ACTIVE_PENDING
No active pending transaction exists anymore.

### ERROR
Initial screen data could not be loaded.

### ACTION_ERROR
Continue/cancel revalidation failed in a recoverable way.

---

# 27. Error Copy

Initial load error:

```text
Pembayaran tertunda belum bisa dimuat. Coba lagi.
```

Continue/revalidation error:

```text
Status pembayaran belum bisa diverifikasi. Coba lagi.
```

Cancellation request error:

```text
Pesanan belum bisa dibatalkan. Coba lagi.
```

Errors must preserve the useful existing summary when it is already known.

Do not claim cancellation failed permanently when authoritative outcome is uncertain; cancellation retries are idempotent.

---

# 28. Information Hierarchy

Recommended order:

1. focused Checkout context/back affordance if useful,
2. title `Kamu masih punya pembayaran yang belum selesai.`,
3. short blocking explanation,
4. existing Package + Session summary,
5. amount,
6. `Menunggu Pembayaran` status,
7. expiration time,
8. remaining time,
9. primary `Lanjutkan Pembayaran`,
10. secondary `Batalkan Pesanan Lama`,
11. cancellation confirmation when requested.

Do not reproduce the full old Checkout Summary.

Do not show payment method/provider controls in T12.

---

# 29. Visual Direction

Before final UI refinement:

**INVOKE TASTE SKILL.**

Target feel:

- clear interruption/resolution,
- calm rather than alarming,
- trustworthy transaction summary,
- one dominant continue action,
- cancellation available but intentionally secondary.

Avoid:

- banking dashboard styling,
- fake payment gateway UI,
- excessive red danger treatment on the entire page,
- urgency tricks,
- giant countdown typography,
- coupon/cart UI,
- generic SaaS modal styling,
- bottom navigation distraction.

Use existing JedaIn semantic tokens and focused Checkout visual language.

---

# 30. Responsive

Primary viewport:

```text
390px
```

Desktop validation:

```text
1440px
```

Mobile:

- approximately 16px page gutters,
- no bottom navigation,
- 44px+ actions,
- summary remains readable above actions,
- confirmation does not overflow the viewport,
- safe-area respected where sticky actions are used,
- no horizontal overflow.

Desktop:

- intentional focused transaction layout,
- not a tiny mobile card in excessive whitespace,
- destructive action visually secondary.

---

# 31. Accessibility

Required:

- `TravelerAppShell` owns `<main>`,
- no nested `<main>`,
- semantic `h1`,
- status not color-only,
- countdown readable but not live-announced every second,
- state change to expired announced once,
- confirmation uses accessible dialog/confirmation semantics,
- focus moves into confirmation and returns appropriately,
- destructive action labelled clearly,
- visible `:focus-visible`,
- 44px+ targets,
- keyboard operation,
- `aria-busy` during continue/cancel mutations,
- reduced-motion respected.

---

# 32. Out of Scope

T12 does **not** implement:

- payment provider UI,
- payment-method selection,
- gateway callback handling,
- success/failure payment result,
- refund logic for paid bookings,
- T13 payment page implementation,
- T14/T15 result implementation,
- My Trips,
- production backend/database,
- production gateway cancellation API,
- production notification sending.

---

# 33. Required Test Coverage

At minimum cover independently:

## Route / Access

1. valid intended Checkout route + active pending renders T12,
2. direct reload works while pending is active,
3. protected focused Traveler shell reused,
4. bottom navigation hidden,
5. route `sessionId` remains the intended NEW Checkout Session.

## Summary

6. existing pending Booking belongs to authenticated Traveler,
7. existing Package title resolves from `booking.packageId`,
8. existing Session resolves from `booking.sessionId`,
9. amount uses `booking.totalAmount` snapshot,
10. status label is `Menunggu Pembayaran`,
11. expiration timestamp shown,
12. remaining time derived from authoritative timestamps.

## One-Pending Store Invariant

13. transaction store refuses a second active pending Booking for same Traveler,
14. race between two different new Checkout intents still creates at most one pending Booking,
15. idempotent replay of the same committed transaction remains allowed,
16. different Traveler is not blocked by someone else's pending Booking.

## Continue Existing Payment

17. `Lanjutkan Pembayaran` revalidates existing Booking,
18. active existing Booking → `/payment/:bookingId`,
19. continue creates zero new Booking,
20. continue creates zero new PaymentAttempt,
21. continue changes zero reserved quantity,
22. expired-before-click does not navigate as active,
23. continue request error remains recoverable.

## Cancel Confirmation

24. first cancel tap does not mutate transaction,
25. warning states reserved slot will be released,
26. confirmation is keyboard/accessibly operable,
27. dismiss confirmation performs zero mutation.

## Atomic Cancellation

28. confirmed active pending Booking → `CANCELLED`,
29. associated mock PaymentAttempt → `CANCELLED`,
30. reserved quantity becomes released,
31. no new Booking/PaymentAttempt created,
32. success returns `/checkout/:intendedSessionId`,
33. cancellation does not automatically create the new Checkout transaction,
34. cancel wrong Traveler rejected,
35. double cancel/retry does not double-release capacity,
36. lost-response-style cancel retry remains idempotent.

## Expiration

37. authoritative expired pending Booking reconciles to `EXPIRED`,
38. associated PENDING PaymentAttempt reconciles to `EXPIRED`,
39. expiration releases reservation,
40. countdown hitting zero triggers authoritative revalidation rather than direct React mutation,
41. expired while screen open renders `EXPIRED`,
42. expired state CTA is `Kembali ke Checkout`,
43. expiry/cancel race cannot release twice.

## No Active Pending

44. no active pending → `NO_ACTIVE_PENDING`,
45. CTA returns intended Checkout,
46. no active state creates zero transaction.

## Integration / Regression

47. T10 active-pending guard still routes to T12,
48. T11 success returns T10 and T10 may still route T12 if pending exists,
49. after T12 cancel, T10 re-opens intended Session context,
50. T10 transaction tests remain green,
51. Home/Explore browsing remains unaffected by pending state,
52. `/payment/:bookingId` remains T13 placeholder in this issue.

## Accessibility / Responsive

53. single main landmark,
54. no bottom nav,
55. 390px smoke,
56. 1440px smoke,
57. no new T12 console/test warnings.

Do not claim 57 tests unless there are actually 57 Vitest test cases. Report actual test-case count separately from acceptance coverage.

---

# 34. Acceptance Criteria

T12 is accepted when:

- `/checkout/:sessionId/pending-payment` replaces the placeholder,
- focused protected Traveler shell remains in use,
- existing pending Package/Session/amount/status/expiry are shown,
- remaining countdown is timestamp-derived and non-authoritative,
- `Lanjutkan Pembayaran` opens the existing `/payment/:bookingId`,
- continuing creates no new transaction state,
- `Batalkan Pesanan Lama` requires explicit confirmation,
- successful cancellation sets Booking `CANCELLED`, closes mock PaymentAttempt, and releases reservation atomically,
- cancellation returns to the intended new Checkout Session without auto-booking it,
- expired pending state is explicitly reconciled as `EXPIRED` and releases reservation,
- expired-while-open transitions to the locked recovery state,
- one-active-pending invariant is enforced inside the shared transaction-store boundary,
- identity ownership is enforced,
- direct no-active route is recoverable,
- T13/payment-provider behavior remains out of scope,
- full regression and quality gates are green,
- 390px + 1440px smoke pass,
- Taste Skill is invoked for final visual refinement.

---

# 35. Final Product Boundary

The locked boundary is:

```text
T10 decides whether a NEW transaction may be created.
T12 resolves the OLD active pending transaction.
T13 executes/displays the EXISTING payment.
```

Therefore:

```text
T12 continue
= open existing payment
!= create payment

T12 cancel
= cancel old pending Booking + release its reservation
!= create new Booking

T12 expiry
= reconcile old Booking as EXPIRED + release reservation
!= frontend timer inventing transaction state
```
