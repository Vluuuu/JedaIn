# JedaIn — Traveler Finalization Competition Sprint Contract

**Version:** 0.1  
**Date:** 1 September 2026  
**Status:** LOCKED FOR COMPETITION MVP  
**Scope:** T13–T20 — Payment, Result, My Trips, Trip Detail, Completed Trip, Destination Review, EO/Guide Review

> This contract intentionally bundles the remaining Traveler golden path for the HOLOGY competition prototype. It prioritizes visible end-to-end business flow, proposal-ready UI, and shared mock state over production payment infrastructure.

---

# 1. Source Priority

Implementation decisions must follow:

```text
PRD.md
> docs/SYSTEM_FLOW.md
> docs/WIREFRAME_SPEC.md
> docs/UI_SPEC.md
> docs/CHECKOUT_SUMMARY_CONTRACT.md
> docs/CONTACT_VERIFICATION_CONTRACT.md
> docs/PENDING_PAYMENT_RESOLUTION_CONTRACT.md
> docs/TRAVELER_FINALIZATION_CONTRACT.md
> docs/DESIGN_SYSTEM.md
> docs/TRAVELER_VISUAL_DIRECTION.md
> issue notes
> implementation
```

If a lower source conflicts with a higher source, the higher source wins.

---

# 2. Competition Sprint Principle

The goal is **not** a production payment gateway or production trip-operations backend.

The goal is a convincing, coherent Traveler flow that can be demonstrated and screenshotted for the business proposal:

```text
Checkout
→ Payment
→ Payment Result
→ My Trips
→ Upcoming Trip Detail
→ Completed Trip
→ Destination Review
→ EO / Guide Review
```

Engineering must remain correct at important business boundaries, but avoid production overengineering.

Prioritize:

1. visible business lifecycle,
2. authoritative mock state consistency,
3. proposal-quality UI,
4. deterministic demo behavior,
5. shared state that later EO / Destination / Admin surfaces can read.

---

# 3. Scope

This sprint implements:

```text
T13 Payment + Countdown
T14 Payment Success
T15 Payment Failed / Expired
T16 My Trips
T17 Upcoming Trip Detail
T18 Completed Trip
T19 Destination Rating
T20 EO / Guide Rating
```

Existing routes should become real screens:

```text
/payment/:bookingId
/payment/:bookingId/result
/trips
/trips/:bookingId
/trips/:bookingId/review
```

The exact internal review target may be represented by route state/query/internal step, provided direct navigation is deterministic and the booking remains the identity source.

---

# 4. Out of Scope

Do **not** implement:

- real Midtrans/Xendit/provider SDK,
- real QR/VA issuance,
- card data collection,
- gateway webhook infrastructure,
- production polling infrastructure,
- real refund settlement,
- payout/split implementation,
- production trip completion jobs,
- production notification delivery,
- production review moderation,
- complaint flow,
- Profile expansion,
- T21–T23 unless needed only for a tiny route compatibility fix.

Provider names must not be presented as integrated unless there is a real integration.

---

# 5. Shared Transaction Status Model

The shared Checkout transaction store remains authoritative for live prototype bookings.

Extend only as required.

Booking statuses for this sprint:

```text
PENDING_PAYMENT
PAID
COMPLETED
CANCELLED
EXPIRED
```

PaymentAttempt statuses:

```text
PENDING
VERIFYING
SUCCEEDED
FAILED
CANCELLED
EXPIRED
```

Do not create a second independent payment database.

---

# 6. Capacity After Payment Success

PRD requires:

```text
PENDING_PAYMENT → PAID
reserved slot → booked slot
```

Therefore a successful payment must **not** make capacity appear free again.

The shared store must distinguish active reserved capacity from booked capacity.

Recommended minimal shape:

```text
BookingRecord
- reservedQuantity
- bookedQuantity
```

Lifecycle:

```text
PENDING_PAYMENT:
reservedQuantity = participantCount
bookedQuantity = 0

PAID / COMPLETED:
reservedQuantity = 0
bookedQuantity = participantCount

CANCELLED / EXPIRED before payment:
reservedQuantity = 0
bookedQuantity = 0
```

T09/T10 effective availability must account for runtime prototype occupancy:

```text
active pending reservations
+
PAID/COMPLETED booked quantity
```

Do not mutate canonical `MOCK_PACKAGE_DETAILS.remainingSlots`.

---

# 7. T13 — Payment + Countdown

Route:

```text
/payment/:bookingId
```

Access:

- authenticated Traveler,
- onboarding COMPLETED,
- focused/distraction-free shell,
- no bottom nav.

Entry requires a Booking that belongs to the authenticated Traveler.

Normal actionable entry:

```text
Booking = PENDING_PAYMENT
current PaymentAttempt = PENDING / allowed retry state
```

Unknown booking / wrong owner must not expose another Traveler's transaction.

---

# 8. T13 Required Information

Show:

1. payment status,
2. Package / Session concise summary,
3. exact `booking.totalAmount`,
4. booking reference,
5. authoritative expiration timestamp,
6. visible remaining countdown,
7. prototype payment content,
8. concise help/reassurance text.

Do not recalculate amount from current Package price.

Do not duplicate full Checkout Summary.

---

# 9. Prototype Payment Content

Because no production gateway exists, use a clearly prototype-safe payment adapter/content surface.

Allowed direction:

```text
Pembayaran Prototype
```

or equivalent neutral wording.

Primary action:

```text
Bayar Sekarang
```

Do not claim a real bank/QR/provider transaction occurred.

The default golden-demo payment path may deterministically succeed after a short mock verification state.

Failure scenarios should be injectable/deterministic for tests and result-state demonstrations; do not expose developer-looking controls as the main consumer experience.

---

# 10. T13 Countdown

`booking.paymentExpiresAt` is authoritative.

The adapter should provide `serverNow` and the UI should derive a visual countdown using the same server-offset approach already used by T12.

Frontend countdown:

```text
!= transaction authority
```

When countdown reaches zero:

1. revalidate/reconcile through shared store/adapter,
2. if authoritative EXPIRED → result state,
3. request failure must not invent EXPIRED.

Do not announce numeric countdown every second with `aria-live`.

---

# 11. Payment Success Boundary

Mock payment success must be one authoritative store operation.

Required checks:

- authenticated Traveler owns Booking,
- Booking is `PENDING_PAYMENT`,
- Booking not expired,
- current PaymentAttempt is valid,
- idempotent outcome handling.

On successful verified mock payment:

```text
PaymentAttempt → SUCCEEDED
Booking → PAID
reservedQuantity → 0
bookedQuantity → participantCount
```

Then navigate:

```text
/payment/:bookingId/result
```

Repeated success/retry must not:

- create a new Booking,
- double-book capacity,
- create duplicate successful charge state.

---

# 12. Payment Verifying State

Primary payment action must visibly enter:

```text
VERIFYING
```

Copy direction:

```text
Memeriksa pembayaran...
```

During verifying:

- disable duplicate action,
- do not navigate early,
- do not say success before store result.

---

# 13. Failed Payment

A mock failed payment must be explicit.

Recommended transaction behavior for competition MVP:

```text
PaymentAttempt → FAILED
Booking remains PENDING_PAYMENT
reservation remains active
paymentExpiresAt remains unchanged
```

Only while authoritative expiry has not passed.

Result state must explain that payment did not complete and that the Traveler may retry while the reservation remains active.

Primary recovery:

```text
Coba Lagi
```

Retry must reuse the existing Booking/reservation and must not create another Booking.

A lightweight mock retry may reset/reopen the current prototype attempt rather than modeling production gateway attempt history.

---

# 14. Expired Payment

At/after `paymentExpiresAt`:

```text
Booking → EXPIRED
PaymentAttempt → EXPIRED
reserved quantity released
```

Result copy must clearly communicate that the slot is no longer held.

Primary recovery:

```text
Pilih Jadwal Lagi
```

Destination should return to the package/session-selection context when resolvable.

No automatic replacement booking.

---

# 15. Payment Cancellation

T13 secondary action may allow:

```text
Batalkan Pesanan
```

Use explicit confirmation before mutation because capacity will be released.

Reuse the shared atomic pending-cancellation boundary from T12 rather than implementing a second cancellation path.

After cancellation:

```text
Booking → CANCELLED
PaymentAttempt → CANCELLED
reserved quantity released
```

Recovery may return Home or relevant package/session flow according to available context.

No refund language because payment was not completed.

---

# 16. T14/T15 — Payment Result

Route:

```text
/payment/:bookingId/result
```

The result page reads authoritative current Booking + PaymentAttempt state.

It must not depend only on router state from T13.

Supported result presentations:

```text
SUCCESS
FAILED
EXPIRED
CANCELLED
ERROR / UNKNOWN
```

---

# 17. Success Result

Success is shown only when authoritative state confirms:

```text
Booking = PAID
PaymentAttempt = SUCCEEDED
```

Required:

- strong but calm confirmation,
- Package / Session summary,
- booking reference,
- total amount snapshot,
- next-step note.

Primary CTA exact:

```text
Lihat Trip
```

→ `/trips/:bookingId`

Secondary:

```text
Kembali ke Home
```

Never show success based on a frontend timer/button alone.

---

# 18. Failed / Expired Result

FAILED:

- explain payment was not completed,
- state whether reservation is still active,
- show remaining time if still pending,
- CTA `Coba Lagi` only if retry is still authoritative-valid.

EXPIRED:

- explain payment window ended,
- explain reserved slot was released,
- CTA `Pilih Jadwal Lagi`.

CANCELLED:

- explain pending order was cancelled,
- no claim of charge/refund,
- recovery to Home / package context.

Never imply the Traveler was charged unless authoritative status says success.

---

# 19. T16 — My Trips

Route:

```text
/trips
```

Traveler bottom navigation is visible with **My Trips** active.

Wireframe hierarchy:

```text
Pending payment special state
Upcoming
Completed
History
```

Recommended implementation:

- pending payment card/banner above lifecycle tabs if active,
- tabs: `Upcoming`, `Completed`, `History`,
- History contains `CANCELLED` / `EXPIRED` prototype records.

Do not visually mix pending payment with paid upcoming trips.

---

# 20. My Trips Data Sources

Runtime transaction records come from the shared transaction store.

For competition demonstration of a historical completed trip, one small centralized fictional prototype fixture is allowed because the team cannot wait for a real trip date.

If used, create a clearly named source such as:

```text
DEMO_TRAVELER_HISTORY
```

Rules:

- fictional/prototype-safe,
- references existing Package catalog data where possible,
- does **not** participate in live capacity ledger,
- has a stable `bookingId`,
- status `COMPLETED`,
- used to demonstrate T18–T20 review loop,
- must not be duplicated across multiple components.

Runtime paid bookings and demo historical bookings must remain distinguishable in code.

---

# 21. My Trips Card

Minimum:

- Package title,
- Session/trip date,
- destination/location,
- booking lifecycle status,
- concise amount/reference where useful.

Actions:

Pending:

```text
Lanjutkan Pembayaran
```

→ `/payment/:bookingId`

Upcoming `PAID`:

```text
Lihat Trip
```

→ `/trips/:bookingId`

Completed:

```text
Lihat Detail
```

→ `/trips/:bookingId`

History:

read-only recovery/context; no fake refund workflow.

---

# 22. T17 — Upcoming Trip Detail

Route:

```text
/trips/:bookingId
```

For `PAID` booking, render Upcoming Trip Detail.

Required supported information from existing centralized data:

- Package,
- destination,
- Session date/time,
- participant count,
- itinerary,
- included / preparation-relevant information where already available,
- organizer/guide identity where already available,
- cancellation policy summary.

Do not invent operational details that are absent from fixtures, such as exact emergency phone numbers or transport pickup promises.

No payment CTA.

---

# 23. T18 — Completed Trip

For `COMPLETED` booking on `/trips/:bookingId`, render Completed Trip state.

Required:

- trip summary,
- completion/thank-you message,
- review completion status,
- two clearly separate review cards:
  - `Nilai Destinasi`
  - `Nilai EO / Guide`

The two parties must not be conflated.

Primary CTA is the first still-missing review.

If both exist, show completed review state and return path to My Trips.

---

# 24. Review Eligibility

Only:

```text
Booking = COMPLETED
```

may submit reviews.

Rules from PRD:

- maximum 1 Destination review per completed booking,
- maximum 1 EO/Guide review per completed booking,
- reviews are separate records,
- both records are linked to booking.

Wrong Traveler / unknown Booking / non-COMPLETED booking must be blocked.

---

# 25. Shared Review Store

Create one small shared mock review store that can later be consumed by EO / Destination surfaces.

Suggested record:

```text
TravelerReviewRecord
- reviewId
- bookingId
- travelerId
- target: DESTINATION | EO_GUIDE
- targetRef
- rating: 1..5
- comment?
- createdAt
```

`targetRef` should use the best stable identifier available from existing centralized data:

- EO/Guide: organizer id from `PackageDetailSource.organizer.id`,
- Destination: use a single centralized destination reference derived by the trips adapter; do not create random component-local IDs.

If no canonical Destination ID exists yet, a deterministic prototype reference derived from existing destination data is acceptable and should be documented for later partner integration.

Store must enforce uniqueness:

```text
bookingId + target
```

---

# 26. T19 / T20 — Review UI

Route may reuse:

```text
/trips/:bookingId/review
```

with deterministic target state.

Destination review:

Heading/action must make it clear the Traveler is rating the place/destination.

Primary CTA exact:

```text
Kirim Penilaian Destinasi
```

EO/Guide review:

Primary CTA exact:

```text
Kirim Penilaian EO
```

Minimum fields:

- rating 1–5 required,
- optional text review.

Do not require structured tags in this sprint.

---

# 27. Review Submission

Submission boundary must validate:

1. authenticated Traveler owns Booking,
2. Booking is `COMPLETED`,
3. rating integer 1–5,
4. target resolves to correct Package destination or organizer,
5. no previous review for same `bookingId + target`.

Success:

- persist one review,
- return to Completed Trip,
- next missing review becomes primary.

Duplicate retry must return deterministic existing result rather than create a duplicate review.

---

# 28. Cross-Surface Readiness

This sprint should prepare, not implement, later partner/admin surfaces.

Expose clean read helpers such as:

```text
getReviewsForDestination(targetRef)
getReviewsForOrganizer(targetRef)
getReviewsForBooking(bookingId)
```

Later:

- Destination Reviews surface reads destination reviews,
- EO Reviews surface reads EO/guide reviews,
- Admin Trust surface can read both.

Do not build those dashboards in this sprint.

---

# 29. Golden Demo Path

The primary demo must work without manual state hacking:

```text
Traveler Checkout
→ Payment
→ Bayar Sekarang
→ Verifying
→ Success Result
→ Lihat Trip
→ Upcoming Trip Detail
→ My Trips
```

The review/trust part can use the centralized fictional completed-trip fixture:

```text
My Trips → Completed
→ Completed Trip
→ Nilai Destinasi
→ submit
→ Nilai EO / Guide
→ submit
→ both reviews completed
```

Failed and expired payment states must be implemented/testable even if the main live demo uses success.

---

# 30. Visual Direction

Before final visual refinement:

**INVOKE TASTE SKILL.**

Payment/result:

- calm transaction confidence,
- not a generic banking dashboard,
- countdown visible but not giant/urgent,
- no fake provider branding,
- clear hierarchy around amount/status/action.

My Trips / Trip Detail:

- travel-led imagery and context,
- lifecycle clarity,
- operational information easier to scan than Package Detail,
- avoid repetitive white-card grids.

Completed/review:

- warm completion tone,
- trust loop clearly explained,
- Destination and EO/Guide visually distinct,
- no gamified review manipulation.

Use canonical JedaIn tokens only.

---

# 31. Responsive / Shells

Payment/result:

```text
390px primary
1440px validation
focused shell
no bottom nav
```

My Trips / Trip Detail / Review:

```text
TravelerAppShell
bottom nav visible where normal Traveler navigation applies
390px primary
1440px intentional desktop
```

Review screen may use focused inner composition while retaining correct Traveler shell behavior.

Controls: 44px+ touch targets.

No horizontal overflow.

---

# 32. Accessibility

Required:

- one `<main>` landmark owned by shell,
- semantic heading order,
- payment status not color-only,
- countdown not live-announced every second,
- clear disabled/verifying semantics,
- visible focus,
- review stars/rating keyboard accessible,
- rating has accessible text equivalent,
- error messages announced appropriately,
- 44px+ touch controls,
- reduced-motion respected.

---

# 33. Required States

Payment:

```text
LOADING
PENDING
VERIFYING
FAILED
EXPIRED
CANCELLED
ERROR
```

Result:

```text
SUCCESS
FAILED
EXPIRED
CANCELLED
ERROR
```

My Trips:

```text
LOADING
READY
EMPTY
ERROR
```

Trip Detail:

```text
LOADING
UPCOMING
COMPLETED
NOT_FOUND
ERROR
```

Review:

```text
READY
SUBMITTING
ALREADY_SUBMITTED
NOT_ELIGIBLE
NOT_FOUND
ERROR
```

Do not declare states that never occur.

---

# 34. Minimum Regression Coverage

At minimum cover independently:

## Payment / Capacity

1. owner can open active pending payment,
2. wrong owner blocked,
3. booking total snapshot displayed,
4. countdown server-derived,
5. countdown zero revalidates authority,
6. success → Booking PAID,
7. success → PaymentAttempt SUCCEEDED,
8. reserved becomes booked quantity,
9. runtime availability remains reduced after payment,
10. double success idempotent,
11. verifying state shown,
12. failed payment explicit,
13. failed payment retains pending Booking/reservation while unexpired,
14. retry creates no duplicate Booking,
15. expiry releases reserved slot,
16. cancel reuses atomic cancellation path.

## Result

17. success result only from PAID/SUCCEEDED,
18. success `Lihat Trip`,
19. failed result does not imply charge,
20. expired result says slot released,
21. direct result reload uses authoritative store.

## My Trips / Detail

22. pending distinct from upcoming,
23. paid booking appears Upcoming,
24. completed fixture appears Completed,
25. cancelled/expired appear History,
26. `Lihat Trip` resolves exact booking,
27. upcoming detail has no payment CTA,
28. completed detail shows two separate review targets.

## Reviews

29. only COMPLETED eligible,
30. wrong owner blocked,
31. destination rating 1–5 required,
32. EO rating 1–5 required,
33. one destination review per booking,
34. one EO review per booking,
35. two review records remain separate,
36. duplicate retry idempotent,
37. completed screen updates after each review,
38. shared read helpers return correct target reviews.

## Regression / UI

39. T10/T11/T12 remain green,
40. payment/result no bottom nav,
41. My Trips bottom nav active,
42. 390px smoke,
43. 1440px smoke,
44. no new Traveler-finalization warnings.

Report **actual** Vitest test count, not acceptance item count.

---

# 35. Quality Gates

Required:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
npm audit --audit-level=high
```

All pass.

Existing unrelated Home/Explore `act()` warnings are outside this sprint unless touched by the implementation.

No new warnings from payment/trips/review tests.

---

# 36. Final Acceptance

This competition sprint is complete when:

- T13 payment placeholder is replaced,
- T14/T15 authoritative result screen is real,
- successful payment converts reservation into booked capacity,
- failure/expiry/cancel states are coherent,
- My Trips is real,
- paid booking appears as Upcoming,
- a centralized fictional completed-trip fixture supports proposal/demo review flow,
- Upcoming and Completed Trip detail states are real,
- Destination and EO/Guide reviews are separate and booking-linked,
- review store is reusable by future Partner/Admin surfaces,
- full Traveler golden demo is clickable,
- 390px and 1440px smoke pass,
- Taste Skill is invoked,
- full regression/quality gates are green.

---

# 37. Final Product Boundary

```text
T10 creates one PENDING_PAYMENT Booking + reservation.
T12 resolves an older pending transaction if it blocks a new checkout.
T13 executes the existing mock payment lifecycle.
T14/T15 explain authoritative payment outcome.
T16–T18 expose the Traveler booking/trip lifecycle.
T19/T20 close the trust loop with separate Destination and EO/Guide reviews.
```

This sprint intentionally completes the **Traveler business story** so development can move immediately to the EO, Destination Partner, Admin, and cross-surface competition demo.