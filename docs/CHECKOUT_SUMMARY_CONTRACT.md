# JedaIn Traveler Checkout Summary Contract

**Screen:** T10 — Checkout Summary  
**Route:** `/checkout/:sessionId`  
**Status:** Locked MVP behavior for competition prototype  
**Purpose:** define the final Traveler confirmation surface before JedaIn creates a pending booking, reserves capacity atomically, and hands the traveler to Payment.

---

# 1. Source Priority

When sources conflict, use:

`PRD.md > docs/SYSTEM_FLOW.md > docs/WIREFRAME_SPEC.md > docs/UI_SPEC.md > docs/RECOMMENDATION_CONTRACT.md > docs/HOME_CONTRACT.md > docs/EXPLORE_CONTRACT.md > docs/PACKAGE_DETAIL_CONTRACT.md > docs/SESSION_SELECTION_CONTRACT.md > docs/CHECKOUT_SUMMARY_CONTRACT.md > docs/DESIGN_SYSTEM.md > docs/TRAVELER_VISUAL_DIRECTION.md > issue notes > implementation`

This contract only resolves T10 details left flexible by higher sources. It must not redefine booking, capacity, payment, or cancellation business rules.

---

# 2. Core Product Role

T10 is the **final confirmation before booking/payment creation**.

Flow:

```text
T09 concrete Session selected
→ T10 Checkout Summary
→ contact requirement check
→ active pending-payment guard
→ latest Session/capacity validation
→ atomic slot reservation
→ Booking PENDING_PAYMENT
→ Payment attempt
→ T13 Payment
```

T10 is the first Traveler step in this flow that may create transactional state.

Before the primary submit succeeds, merely opening T10 or editing its draft must **not**:

- create a booking,
- reserve capacity,
- decrement available slots,
- create a payment attempt,
- start a payment countdown.

---

# 3. Route & Access

Primary route:

```text
/checkout/:sessionId
```

Use the existing protected Traveler architecture:

- authenticated Traveler,
- onboarding `COMPLETED`,
- existing `TravelerAppShell`.

Per `docs/UI_SPEC.md`, the checkout/payment flow must avoid distracting primary navigation. Therefore T10 uses the existing Traveler shell **with bottom navigation hidden**.

T10 must not invent a guest checkout.

---

# 4. Entry & Route Resolution

Primary entry:

```text
T09 Session Selection
→ valid non-reserving revalidation
→ /checkout/:sessionId
```

T10 must independently resolve the concrete Session from `sessionId`.

Do not trust only:

- router `location.state`,
- the T09 card that was previously clicked,
- stale client selection state.

Direct reload of a valid `/checkout/:sessionId` URL must still resolve the same Session and canonical Package from centralized data.

Unknown Session must never silently fall back to another Session.

---

# 5. Canonical Data Reuse

Reuse existing sources rather than creating a second catalog/schedule database:

```text
MOCK_RECOMMENDATION_PACKAGES
MOCK_PACKAGE_DETAILS
PackageSessionPreview
formatSessionDateTimeRange()
AuthUser/sessionStore identity
```

T10 may add a Checkout-specific adapter/view model and a minimal shared mock transaction boundary for later T12/T13 use.

Do not duplicate canonical Package fields such as:

- title,
- destination,
- location,
- illustration identity,
- Package status.

Do not duplicate Session fields such as:

- start/end time,
- status,
- Session price snapshot,
- remaining slot snapshot.

---

# 6. Checkout View Model

Suggested T10 view model shape:

```text
CheckoutViewModel
- state
- traveler
- package
- session
- contactRequirement
- participantCount
- unitPricePerPerson
- subtotal
- totalAmount
- cancellationPolicySummary
- activePendingPayment?
- errorMessage?
```

Suggested contact model:

```text
CheckoutContactRequirement
- name?
- email?
- phone?
- phoneRequired
- phoneVerified
```

Important:

A phone number being present does **not** automatically mean it is verified.

Current `AuthUser.phone` may be reused as display data, but verification state must be a separate adapter/server-shaped field.

---

# 7. Eligible Session on Checkout Load

A normal READY checkout requires:

- Session exists,
- Session maps to one Package,
- Package exists and is `LIVE`,
- Session belongs to that Package,
- Session status is `OPEN`,
- capacity snapshot is explicit and positive,
- an exact Session price snapshot is available for the current MVP.

If the Session is:

- `FULL`,
- `CLOSED`,
- `CANCELLED`,
- unknown,
- attached to a non-LIVE Package,

T10 must not offer an enabled payment CTA.

Use an unavailable/recovery state rather than silently substituting another Session.

---

# 8. Capacity Semantics

Capacity remains server/session authoritative.

T10 may display the latest explicit capacity snapshot such as:

```text
Sisa 6 slot
```

but must treat it as a snapshot, not a reservation.

Locked copy principle:

```text
Slot baru diamankan setelah kamu lanjut ke pembayaran.
```

Equivalent concise wording is allowed.

Before successful submit, T10 must not mutate:

```text
remainingSlots
capacity
reservedSlots
bookedSlots
```

by local participant controls.

---

# 9. Participant Quantity

Higher sources place participant quantity in T10, not T09.

For the current per-person MVP packages, T10 uses a required integer participant quantity.

Rules:

```text
minimum = 1
default = 1
```

The current reliable `remainingSlots` snapshot may constrain the visible quantity control.

Example:

```text
remainingSlots = 6
→ current selectable quantity range 1..6
```

However this is only a client-side convenience. Latest capacity must still be revalidated atomically on submit.

Do not:

- reserve slots when quantity changes,
- reduce `remainingSlots` locally as if authoritative,
- auto-fill booking quantity from Quiz group-size preference,
- assume `3–4 orang` preference means a booking quantity of 4.

If capacity becomes smaller than the selected participant quantity before submit, the transaction must fail safely and no booking/payment is created.

---

# 10. Participant Control UX

Use an accessible numeric stepper, select, or equivalent simple control.

Required behavior:

- clearly labeled `Jumlah peserta`,
- current quantity always visible,
- decrement disabled at 1,
- increment disabled at current reliable capacity snapshot,
- keyboard operable,
- changes immediately update the displayed checkout amount,
- changes do not imply capacity is reserved.

Avoid a large form for this simple decision.

---

# 11. Price Source of Truth

T08 Package Detail may show a **starting Package price**.

T09/T10 deal with a concrete Session.

For T10, exact payable unit price must come from the concrete Session/checkout pricing snapshot.

Preferred current source:

```text
session.pricePerPerson
```

If exact Session price is unavailable, T10 must not silently treat:

```text
package.pricePerPerson
```

or the Package `Mulai dari` price as an exact checkout price.

Missing exact price → pricing-unavailable state / disabled submit until resolved.

---

# 12. Price Breakdown

Current PRD formula:

```text
Customer Price = Destination Base Cost + EO Margin
```

Platform commission is deducted from EO Margin, not added as a new Traveler fee.

Therefore current T10 Traveler breakdown must remain simple:

```text
Harga experience
N peserta × RpX / orang
Subtotal
Total pembayaran
```

For current MVP without any other source-backed fee:

```text
subtotal = unitPricePerPerson × participantCount
totalAmount = subtotal
```

Do not expose internal economics:

- Destination Base Cost,
- EO Margin,
- Platform Commission.

Do not invent:

- service fee,
- platform fee,
- booking fee,
- transport fee,
- tax line not defined by source.

Use integer Rupiah values; do not introduce floating-point currency behavior.

---

# 13. Traveler / Contact Summary

Required section:

```text
Traveler/contact info
```

Display only known identity/contact data.

Suggested:

- traveler name,
- email when available,
- phone when available,
- verification state where relevant.

Do not invent a phone number or mark it verified merely because it exists.

Contact verification requirement is adapter/server-shaped state.

---

# 14. Contact Verification Boundary — T11

`docs/SYSTEM_FLOW.md` requires the contact check before new booking/payment creation.

On primary submit:

```text
required contact verified?
```

If yes:

continue T10 pre-submit flow.

If no:

handoff to T11 Contact Verification.

T10 must not:

- create booking,
- reserve slots,
- create payment

before required contact verification succeeds.

For MVP implementation, a dedicated placeholder route may be used for the next issue:

```text
/checkout/:sessionId/contact
```

because higher sources explicitly allow T11 to be a route or modal.

T11 must eventually return to the same checkout context.

If a Checkout draft must cross that route, preserve the draft using a small explicit Checkout draft mechanism rather than Quiz preferences or unrelated global state.

Do not implement OTP behavior in the T10 issue.

---

# 15. Cancellation / Refund Policy Acknowledgement

T10 must show the cancellation/refund policy summary before payment confirmation.

Reuse the Package-level centralized policy summary where available.

Current source does not finalize concrete refund thresholds/deadlines.

Therefore do **not** invent:

- H-7,
- H-3,
- 24 hours,
- 50%,
- 75%,
- 100%,
- admin fee,
- automatic refund timing.

Required acknowledgement:

- unchecked by default,
- explicit user action,
- user-facing copy equivalent to:

```text
Saya sudah membaca ringkasan kebijakan pembatalan & refund.
```

The primary submit CTA remains disabled until the required acknowledgement is checked.

Do not claim the traveler agreed to specific refund percentages that are not present in source data.

A separate generic Terms checkbox is not required unless later source defines one.

---

# 16. Active Pending Payment Guard

PRD locks:

```text
at most one active PENDING_PAYMENT per traveler
```

Opening T10 is allowed after T09; the guard acts before creating new transactional state.

On submit, after required contact is satisfied, T10 must check authoritative active pending-payment state.

If active pending payment exists:

- do not reserve new capacity,
- do not create a new booking,
- do not create a new payment attempt,
- hand off to T12 Pending Payment Resolution.

T12 owns the choices:

- continue existing payment,
- cancel old pending booking and release its reserved slot.

T10 must not cancel an existing booking itself.

For T10 tests, the adapter may return a deterministic `PendingPaymentSummary`/equivalent handoff object.

The permanent T12 route/surface may be finalized in the T12 contract; T10 must not bypass T12 by silently opening a different new payment.

---

# 17. Pre-Submit Order

Primary CTA exact label:

```text
Lanjut ke Pembayaran
```

Locked logical order:

```text
1. Validate local Checkout draft
2. Required contact verified?
3. Active pending payment exists?
4. Revalidate Session identity/status/price/capacity
5. Validate capacity >= participantCount
6. Atomically reserve participant slots
7. Create Booking PENDING_PAYMENT
8. Create Payment attempt
9. Set configurable payment_expires_at
10. Navigate to /payment/:bookingId
```

Steps 4–9 are represented as one backend-authoritative transaction boundary in product behavior.

Frontend must not split capacity reservation and booking creation into independent optimistic mutations.

---

# 18. Atomic Checkout Submit Boundary

Suggested adapter API:

```text
getCheckout(sessionId)
submitCheckout(input)
```

Possible submit input:

```text
CheckoutSubmitInput
- travelerId
- sessionId
- participantCount
- cancellationPolicyAcknowledged
- idempotencyKey
```

Possible result union:

```text
SUCCESS
CONTACT_VERIFICATION_REQUIRED
ACTIVE_PENDING_PAYMENT
SESSION_UNAVAILABLE
INSUFFICIENT_CAPACITY
PRICE_UNAVAILABLE
REQUEST_ERROR
```

The exact TypeScript names may vary; semantics must remain locked.

---

# 19. Idempotency

PRD requires payment/booking creation to avoid duplicate:

- booking,
- charge,
- capacity decrement.

T10 mock implementation must model this principle without overengineering a production payment service.

Use one stable checkout-attempt/idempotency key across retries of the same submit intent.

Required behavior:

- accidental double click while submitting → one transaction,
- network retry with same idempotency key → must not create a second booking or reserve slots twice.

A simple deterministic in-memory mock transaction repository is sufficient for competition MVP.

---

# 20. Successful Checkout Creation

On successful transaction, create a minimal pending booking/payment result suitable for T13 reuse.

Suggested booking snapshot:

```text
bookingId
travelerId
packageId
sessionId
participantCount
unitPricePerPerson
totalAmount
status = PENDING_PAYMENT
reservedQuantity
createdAt
paymentExpiresAt
```

Suggested payment attempt:

```text
paymentAttemptId
bookingId
status = PENDING
expiresAt
```

Booking stores transaction-time snapshots rather than reading future live Package changes as if they applied retroactively.

Do not expose internal base-cost/margin fields in Traveler UI.

---

# 21. Payment Expiration Configuration

PRD requires `payment_expires_at` but leaves the default timeout as a pending proposal.

Therefore T10 must not hardcode `15 menit` throughout UI/business logic as permanent truth.

If the MVP mock transaction needs an expiry, use one centralized configurable prototype value.

A 15-minute default may be used only as the existing PRD **proposal**, clearly centralized/configurable.

T10 itself does **not** render the Payment countdown.

Countdown belongs to T13.

---

# 22. Session Revalidation on Submit

T09 already performs non-reserving validation before entering T10.

T10 must revalidate again because availability can change while the traveler reviews Checkout.

Latest validation must confirm:

- Session still exists,
- same Session/package relationship,
- Package still eligible/LIVE,
- Session still `OPEN`,
- explicit latest capacity exists,
- latest capacity >= `participantCount`,
- exact checkout price remains resolvable.

This submit validation is the one immediately adjacent to the atomic reservation transaction.

---

# 23. Session Became Unavailable

If Session becomes FULL/CLOSED/CANCELLED or no longer exists before successful booking creation:

- remain out of Payment,
- create no booking,
- reserve no slots,
- create no payment attempt,
- show concise unavailable state.

Suggested copy:

```text
Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.
```

Primary recovery:

```text
Pilih Jadwal Lain
→ /packages/:packageId/sessions
```

Do not silently switch the traveler to another Session.

---

# 24. Insufficient Capacity

If latest capacity is still positive but smaller than `participantCount`:

- do not partially reserve,
- do not silently reduce participant quantity,
- no booking/payment created,
- show latest reliable capacity.

Suggested copy:

```text
Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.
```

The user must explicitly choose the new participant quantity.

---

# 25. Request / Submit Error

If submit fails because of a recoverable request/system error:

- stay on T10,
- preserve participant count,
- preserve acknowledgement state,
- do not claim whether payment succeeded unless authoritative result says so,
- allow retry using the same idempotency key.

Suggested copy:

```text
Checkout belum bisa diproses. Coba lagi.
```

If an idempotent retry discovers that the booking/payment was already created, return that same successful booking rather than creating another.

---

# 26. Checkout Draft State

T10 screen-local draft minimum:

```text
participantCount
cancellationPolicyAcknowledged
idempotencyKey
```

Rules:

- participant default = 1,
- acknowledgement default = false,
- quantity change updates amount only,
- no draft edit mutates authoritative Session capacity,
- retryable errors preserve draft,
- route to a required T11 contact step must not accidentally substitute Quiz group preference.

No URL query parameter is required solely for participant quantity in the current MVP.

---

# 27. Information Hierarchy

Recommended T10 structure:

1. Checkout header/back context
2. Package + Session summary
3. Participant quantity
4. Traveler/contact summary
5. Price breakdown
6. Cancellation/refund summary
7. Acknowledgement checkbox
8. Slot-reservation/concurrency notice
9. Sticky/clear primary CTA `Lanjut ke Pembayaran`

Do not repeat the whole T08 Package Detail page.

Do not turn T10 into a payment-method screen; that belongs to T13/provider flow.

---

# 28. Package / Session Summary Minimum

Show:

- Package title,
- destination/location,
- Session date/time via existing deterministic formatter,
- Session status/availability context if useful,
- exact Session unit price.

Optional compact illustration is allowed if it helps hierarchy.

Do not repeat:

- full itinerary,
- full reviews,
- long organizer bio,
- full Explore metadata.

---

# 29. Date / Time

Reuse:

```text
formatSessionDateTimeRange()
Asia/Jakarta
WIB
```

Same-day and cross-date semantics remain exactly as established by T08/T09.

Do not create a third date formatter.

---

# 30. Transport / Meeting Point

Only display departure/meeting-point information if explicit Session data exists.

Current source does not authorize invented transport promises.

Do not infer:

- pickup,
- shuttle,
- free transport,
- included transport,
- route duration.

---

# 31. Required UI States

## LOADING

- stable Checkout skeleton,
- Package/Session summary skeleton,
- price/CTA region shape remains stable,
- no blank spinner-only page.

## READY

- valid Session,
- exact price available,
- participant controls available,
- contact summary visible,
- policy acknowledgement available.

## CONTACT_REQUIRED

- Checkout summary remains understandable,
- clearly explain contact verification is required,
- submitting hands off to T11,
- no reservation/booking/payment.

## SUBMITTING

- primary CTA disabled/loading,
- participant and acknowledgement controls should not start another concurrent transaction,
- prevent duplicate submit.

## ACTIVE_PENDING_PAYMENT

- no new transaction created,
- handoff to T12.

## SESSION_UNAVAILABLE

- no enabled payment CTA,
- recovery to Session Selection.

## INSUFFICIENT_CAPACITY

- preserve Checkout context,
- show latest capacity,
- require explicit participant adjustment.

## PRICE_UNAVAILABLE

- do not fabricate exact total,
- disable submit,
- retry/recovery as appropriate.

## NOT_FOUND

Suggested copy:

```text
Jadwal checkout tidak ditemukan.
```

Recovery:

```text
Kembali ke Explore
```

## ERROR

Suggested copy:

```text
Checkout belum bisa dimuat.
```

CTA:

```text
Coba lagi
```

Retry preserves `sessionId`.

## SUBMIT_ERROR

Suggested copy:

```text
Checkout belum bisa diproses. Coba lagi.
```

Preserve draft and idempotency key.

---

# 32. Primary CTA State

Exact label:

```text
Lanjut ke Pembayaran
```

Disabled when:

- Checkout data not READY,
- participant quantity invalid,
- exact price unavailable,
- policy acknowledgement unchecked,
- submitting.

Contact verification and pending-payment checks may be discovered on submit; they must block transactional creation before reservation.

CTA loading label may be:

```text
Memproses...
```

Do not display a payment countdown in T10.

---

# 33. Bottom Navigation / Shell

T09 keeps the normal four-item Traveler bottom navigation.

T10 begins the focused checkout/payment flow.

Therefore:

```text
TravelerAppShell
showBottomNav = false
```

for T10.

A clear back control to the selected Package's Session Selection is required when safe.

Do not add a fifth Checkout nav item.

---

# 34. Visual Direction

T10 should feel like a calm final review, not a generic e-commerce checkout template.

Target:

- compact trip/session identity,
- obvious quantity control,
- transparent price math,
- trustworthy policy acknowledgement,
- calm transactional seriousness,
- one clear progression CTA.

Avoid:

- shopping-cart tropes,
- fake promo codes,
- coupon field,
- urgency countdown,
- payment-method selection in T10,
- excessive green cards,
- dashboard/table styling,
- random gradients/glass effects,
- fake trust statistics.

Before final visual completion, **INVOKE TASTE SKILL**.

Taste Skill remains visual-only and must not change booking/payment business rules.

---

# 35. Responsive Contract

Primary Traveler viewport:

```text
390px
```

Desktop verification:

```text
1440px
```

Mobile:

- ~16px readable gutters,
- compact Session summary,
- quantity control >=44px targets,
- price breakdown readable without horizontal scrolling,
- acknowledgement easy to tap,
- sticky CTA respects safe area,
- no bottom nav on T10.

Desktop:

- intentional centered Checkout composition,
- useful summary + price/action hierarchy,
- approximately 720–960px content region is appropriate,
- avoid tiny phone-width form floating in huge whitespace.

---

# 36. Accessibility

Required:

- `TravelerAppShell` owns the single `<main>` landmark,
- no nested `<main>`,
- semantic `h1`,
- participant control has programmatic label,
- increment/decrement buttons have accessible names if used,
- policy checkbox has full clickable label,
- checkbox not pre-checked,
- visible focus,
- >=44px touch targets,
- price math understandable without visual layout alone,
- status/error notices announced appropriately,
- `aria-busy` during submit where useful,
- reduced motion respected,
- disabled CTA state is perceivable beyond color.

---

# 37. Explicit Out of Scope for T10 Issue

Do not implement in the T10 PR:

- T11 OTP/contact verification internals,
- T12 cancel/continue pending-payment resolution internals,
- T13 payment-method/provider UI,
- payment countdown UI,
- gateway callback/polling,
- payment result screens,
- production database/backend,
- production payment gateway,
- full refund engine,
- every production concurrency edge case.

T10 may establish the minimal mock transaction contract/store needed for its own successful handoff to future T12/T13 screens.

---

# 38. Minimum Test Matrix

## Resolution / Data

1. known concrete Session resolves canonical Package + Session,
2. unknown Session → NOT_FOUND,
3. Session attached to non-LIVE Package unavailable,
4. FULL/CLOSED/CANCELLED unavailable,
5. canonical Package metadata reused,
6. centralized Session record reused,
7. T08/T09 date formatter reused.

## Participant Quantity

8. initial participant count = 1,
9. quantity cannot go below 1,
10. visible increment cannot exceed reliable current capacity snapshot,
11. quantity is not auto-filled from Quiz group-size preference,
12. quantity change updates amount,
13. quantity change does not mutate authoritative remaining slots.

## Price

14. exact Session price snapshot is used,
15. Package starting price is not silently substituted for missing Session price,
16. missing exact price disables transaction,
17. subtotal = unit × participant count,
18. total = subtotal for current no-extra-fee MVP,
19. no invented service/platform/transport fee,
20. no internal base-cost/margin/commission displayed.

## Contact

21. known contact data renders,
22. phone presence does not automatically imply verified state,
23. required unverified contact → T11 handoff,
24. T11 handoff creates no booking/reservation/payment.

## Policy

25. policy summary is visible,
26. acknowledgement starts unchecked,
27. submit disabled until acknowledgement,
28. no invented refund percentage/deadline.

## Pending Payment Guard

29. no active pending → can continue transaction path,
30. active pending → T12 handoff,
31. active pending creates no second booking/payment/reservation,
32. T10 does not cancel existing pending booking.

## Submit / Capacity

33. submit revalidates latest Session,
34. same Session/package identity enforced,
35. latest OPEN + enough capacity succeeds,
36. latest FULL/CLOSED/CANCELLED creates nothing,
37. latest capacity < participant count creates nothing,
38. insufficient capacity preserves checkout context,
39. capacity is reserved only on successful transaction boundary,
40. reserved quantity equals participant count,
41. successful result creates one PENDING_PAYMENT booking,
42. successful result creates one payment attempt,
43. success routes to `/payment/:bookingId`.

## Idempotency

44. double-click cannot create duplicate booking,
45. retry with same idempotency key does not reserve twice,
46. idempotent retry may return same successful booking.

## States / Recovery

47. loading skeleton,
48. load error + retry preserves sessionId,
49. submit error preserves participant count,
50. submit error preserves acknowledgement,
51. submit error preserves idempotency key,
52. unavailable recovery routes to Package Session Selection.

## Shell / Routing / Accessibility

53. actual T09 → T10 route works,
54. T10 bottom navigation hidden,
55. no incorrect fifth nav item,
56. single `<main>` landmark through App shell,
57. participant control accessible,
58. policy checkbox accessible and not pre-checked,
59. CTA exact label `Lanjut ke Pembayaran`,
60. no payment countdown on T10.

---

# 39. Browser Smoke Matrix

## 390px

Verify:

- normal checkout for `ses_sgd_1`,
- participant 1 → 2 → 1,
- price recalculation,
- policy acknowledgement,
- verified-contact golden path,
- contact-required handoff,
- active-pending guard handoff,
- insufficient-capacity state,
- submit request error + retry,
- successful transaction → Payment placeholder,
- no bottom-nav distraction,
- no overlap/overflow.

## 1440px

Verify:

- intentional checkout composition,
- package/session summary readable,
- quantity + price hierarchy clear,
- policy/acknowledgement clear,
- action hierarchy obvious,
- no dashboard/e-commerce-cart feel.

Console target for new T10 behavior:

```text
0 errors
0 warnings
```

---

# 40. Completion Definition

T10 is complete when:

1. `/checkout/:sessionId` is a real protected Checkout Summary,
2. it resolves a concrete centralized Session and canonical LIVE Package,
3. participant count belongs to T10 and defaults to 1,
4. exact Session pricing produces transparent total math,
5. contact requirement is shown and enforced before transaction creation,
6. cancellation/refund acknowledgement is explicit and not fabricated,
7. active pending payment blocks new transaction creation and hands off to T12,
8. submit revalidates latest Session/capacity,
9. capacity reservation + PENDING_PAYMENT booking + payment attempt are represented as one atomic mock transaction boundary,
10. retries are idempotent,
11. success routes to `/payment/:bookingId`,
12. T10 does not implement OTP, T12 resolution internals, Payment countdown/provider UI, or Payment results,
13. the Traveler checkout flow is responsive, accessible, and visually consistent,
14. full regression and quality gates remain green.
