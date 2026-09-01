# JedaIn Traveler Session Selection Contract

**Screen:** T09 — Choose Session  
**Route:** `/packages/:packageId/sessions`  
**Status:** Locked MVP behavior for competition prototype  
**Purpose:** define the exact Traveler behavior between Package Detail and Checkout without reserving capacity or creating a booking.

---

# 1. Source Priority

When sources conflict, use:

`PRD.md > docs/SYSTEM_FLOW.md > docs/WIREFRAME_SPEC.md > docs/UI_SPEC.md > docs/RECOMMENDATION_CONTRACT.md > docs/HOME_CONTRACT.md > docs/EXPLORE_CONTRACT.md > docs/PACKAGE_DETAIL_CONTRACT.md > docs/SESSION_SELECTION_CONTRACT.md > docs/DESIGN_SYSTEM.md > docs/TRAVELER_VISUAL_DIRECTION.md > issue notes > implementation`

This contract only resolves T09 details left flexible by higher sources. It must not redefine booking, capacity, or payment business rules.

---

# 2. Core Product Invariant — Package != Session

A **Package** is the approved experience template.

A **Session** is one concrete occurrence/departure of that Package.

Traveler books a Session, not an abstract Package.

T09 owns **selection of one concrete Session**.

T09 does **not**:

- create a booking,
- reserve a slot,
- create checkout/payment state,
- decrement capacity,
- mark a Session FULL,
- enforce the active pending-payment guard.

The next screen, T10 Checkout, owns checkout confirmation and the pre-submit checks that eventually lead to atomic booking/capacity reservation.

---

# 3. Route & Access

Route:

```text
/packages/:packageId/sessions
```

Use the existing protected Traveler architecture:

- authenticated Traveler,
- onboarding `COMPLETED`,
- existing `TravelerAppShell`,
- existing four-tab bottom navigation remains unchanged.

T09 is not a primary bottom-navigation destination.

Do not create guest Session Selection.

---

# 4. Entry & Exit

Primary entry:

```text
T08 Package Detail
→ Pilih Jadwal
→ T09 Session Selection
```

Primary successful exit:

```text
selected valid session
→ Lanjut Checkout
→ /checkout/:sessionId
```

T09 must never route directly to Payment.

---

# 5. Eligible Package

Resolve `packageId` from the same centralized Package catalog used by Explore and Package Detail.

Rules:

- Package must exist,
- Package must be `LIVE`,
- unknown/non-LIVE Package → NOT_FOUND,
- never silently substitute another Package.

Package-level title, destination, location, starting price, illustration identity, and duration must reuse the canonical Package data rather than be copied into a second fixture.

---

# 6. Centralized Session Data

T09 must reuse the existing centralized session fixture/data boundary established by T08 instead of creating a duplicate independent schedule database.

Current MVP can reuse the session records associated with Package Detail fixtures and expose them through a dedicated T09 adapter/view model.

A traveler-facing Session source may include:

```text
sessionId
packageId
startAt
endAt
status
optional pricePerPerson
optional remainingSlots
optional departurePointLabel
optional sessionSpecificGuideLabel
```

Do not duplicate Package title/destination/price metadata inside every Session record unless the field is genuinely a Session snapshot.

---

# 7. Session Status Rules

PRD Session states are broader, but T09 traveler selection behavior is:

## OPEN

Visible and potentially selectable.

For the current deterministic MVP, an OPEN session is selectable only when the adapter has a reliable positive capacity snapshot for it.

```text
status = OPEN
AND remainingSlots > 0
→ selectable
```

## FULL

Visible but disabled.

Never selectable.

## CLOSED

Visible but disabled in the MVP so the traveler can understand that the occurrence exists but cannot be chosen.

This is the chosen deterministic interpretation of the higher-source allowance `hidden or disabled based context`.

## CANCELLED

Hidden from the normal selectable schedule list.

It must not be promoted as an upcoming choice.

## DRAFT / COMPLETED

Not traveler-selectable and should not be surfaced in the normal T09 selection list.

---

# 8. Capacity Semantics

Capacity is authoritative server/session state, not frontend-owned state.

T09 may display:

```text
Sisa 6 slot
```

only when `remainingSlots` is explicitly provided by the adapter as a reliable snapshot.

T09 must not derive authoritative remaining capacity by client arithmetic such as:

```text
capacity - reserved_slots - booked_slots
```

unless a future backend contract explicitly requires that calculation client-side.

For current MVP:

- positive explicit `remainingSlots` can support initial selectable presentation,
- `remainingSlots = 0` is not selectable even if a stale source status says OPEN,
- missing `remainingSlots` must not invent a number,
- the selected session is revalidated before entering Checkout.

Displayed slots are still only a snapshot and can change concurrently.

---

# 9. Selection State

Exactly one Session can be selected at a time.

Required behavior:

- clicking/selecting a valid OPEN session visibly marks it selected,
- selecting another valid Session replaces the previous selection,
- FULL/CLOSED/CANCELLED cannot become selected,
- selected state is communicated by more than color alone,
- CTA `Lanjut Checkout` remains disabled until one valid Session is selected.

For the competition MVP, local screen state is sufficient. T09 does not require a new URL query parameter solely to persist selection across a full reload.

Do not create a reservation when selected state changes.

---

# 10. Session Revalidation Before Checkout

`docs/SYSTEM_FLOW.md` requires:

```text
Choose Trip Session
→ Session OPEN and has capacity?
→ Checkout Summary
```

Therefore pressing `Lanjut Checkout` must perform a non-reserving revalidation through the Session Selection adapter before navigation.

Suggested adapter boundary:

```text
getPackageSessions(packageId)
validateSessionSelection(sessionId)
```

Validation checks the latest mock/server-shaped snapshot for:

- same Package,
- Session still exists,
- status still `OPEN`,
- capacity still available.

If valid:

```text
navigate /checkout/:sessionId
```

If it became invalid/full/closed/cancelled:

- stay on T09,
- clear invalid selected state,
- update to latest visible session state where applicable,
- show concise message such as:

```text
Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.
```

If revalidation fails because of a request/error state:

- keep the selected Session,
- do not create booking/reservation,
- show a retryable message such as:

```text
Jadwal belum bisa diverifikasi. Coba lagi.
```

This check is not the final atomic reservation. T10/booking creation still performs authoritative availability validation again.

---

# 11. Concurrency / Reservation Boundary

The following copy principle is locked:

```text
Memilih jadwal belum mengamankan slot.
```

Equivalent concise wording is allowed.

Slot reservation happens only when the later checkout flow successfully creates a booking pending payment and performs atomic capacity reservation.

T09 must never imply:

- `slot kamu sudah diamankan`,
- temporary hold started,
- countdown started,
- booking created,
- payment created.

No countdown belongs on T09.

---

# 12. Participant Quantity — Deferred to T10

Higher sources place participant quantity in **T10 Checkout Summary**, not T09.

Therefore T09 must **not add a participant-count selector** for this MVP.

T09 selects only one Session.

Participant quantity, if applicable, will be locked in the Checkout contract and used there for capacity/price validation.

Do not use Quiz group size as an automatic booking quantity.

---

# 13. Price Semantics

Package-level header may show canonical starting price:

```text
Mulai dari Rp275.000 / orang
```

For a Session card:

- if `session.pricePerPerson` is explicitly provided, display it as the Session price snapshot,
- if absent, do not invent an exact Session price.

Suggested exact Session display:

```text
Rp275.000 / orang
```

Do not expose:

- Destination Base Cost,
- EO Margin,
- Platform Commission,
- invented service/platform/transport fee.

T09 does not compute total checkout amount because participant quantity belongs to T10.

---

# 14. Date / Time

Reuse the deterministic T08 formatter behavior:

```text
Asia/Jakarta
WIB
```

Same-day example:

```text
Sabtu, 12 September 2026 • 08.00 - 14.00 WIB
```

Cross-date example:

```text
Sabtu, 26 September 2026 • 14.00 WIB
→ Minggu, 27 September 2026 • 11.00 WIB
```

Do not compare UTC calendar dates directly when deciding whether a Session crosses local dates.

---

# 15. Departure Point / Transport

Wireframe allows a departure point **if applicable**.

Current higher sources do not define transport/pickup promises for these Sessions.

Therefore current T09 MVP does not need to invent departure points.

If a future explicit fixture provides `departurePointLabel` or meeting-point data, render that factual label only.

Do not infer:

- pickup,
- shuttle,
- free transport,
- included transport,
- route duration.

---

# 16. Session-Specific EO / Guide

Wireframe allows guide/EO if Session-specific.

Current Package organizer remains the default context.

Only render a Session-specific guide/EO label if the Session fixture explicitly overrides it.

Do not duplicate or fabricate guide identities per Session.

---

# 17. Information Hierarchy

Recommended T09 structure:

1. Back/navigation context to Package Detail
2. Page title + concise helper copy
3. Compact Package summary
4. Session list
5. Selected-session summary/context
6. Concurrency note that selection does not reserve a slot
7. Sticky/clear primary CTA `Lanjut Checkout`

Avoid repeating the entire Package Detail page.

---

# 18. Session Card Minimum

Each visible Session card should communicate:

- date,
- start/end time,
- status,
- remaining capacity when reliable,
- Session price snapshot when explicit,
- departure point only if explicit,
- selected/unselected state.

Status must be readable without color alone.

Recommended user-facing status:

```text
OPEN   → Tersedia
FULL   → Penuh
CLOSED → Ditutup
```

CANCELLED is normally hidden.

---

# 19. Primary CTA

Exact CTA:

```text
Lanjut Checkout
```

No valid selection:

```text
CTA disabled
```

Valid selected Session:

```text
CTA enabled
```

On press:

1. enter validation/loading state,
2. non-reserving revalidate selected Session,
3. valid → `/checkout/:sessionId`,
4. invalid → remain on T09 and request another selection,
5. error → remain on T09 and allow retry.

Prevent accidental double-submit while validation is in progress.

---

# 20. Pending Payment Boundary

An existing active pending payment does **not** block:

- Package Detail,
- opening T09,
- browsing Sessions,
- choosing a Session.

The active-pending-payment guard belongs later in Checkout/payment creation.

T09 must not redirect to T12 merely because a pending payment exists.

---

# 21. Required States

## LOADING

- stable package/session skeleton,
- no blank spinner-only page,
- CTA region remains structurally stable.

## READY / SELECTABLE

At least one valid selectable Session exists.

## READY / NO_SELECTION

Sessions exist but none selected yet.

CTA disabled.

## READY / NO_SELECTABLE_SESSION

Examples:

- FULL-only,
- CLOSED-only,
- no visible traveler-selectable sessions.

Keep relevant disabled cards when useful.

Show concise message:

```text
Belum ada jadwal yang bisa dipilih saat ini.
```

No enabled Checkout CTA.

## REVALIDATING

After CTA press while latest availability is being checked.

- selected state remains visible,
- CTA shows loading/disabled state,
- no reservation claim.

## SELECTION_BECAME_UNAVAILABLE

Selected Session fails latest validation.

- selection cleared,
- latest state shown,
- user chooses another Session.

## NOT_FOUND

Unknown/non-LIVE Package.

Copy direction:

```text
Experience tidak ditemukan.
```

CTA:

```text
Kembali ke Explore
```

## ERROR

Initial schedule request failed.

Copy direction:

```text
Jadwal belum bisa dimuat.
```

CTA:

```text
Coba lagi
```

Retry preserves `packageId`.

---

# 22. Visual Direction

Continue the established Traveler visual language from Issue #20, Explore, and Package Detail.

Before final T09 UI completion, **INVOKE TASTE SKILL**.

Target feel:

```text
calm travel decision surface
clear schedule comparison
trustworthy marketplace
low-friction progression
```

Avoid:

- airline-seat-map complexity,
- SaaS/admin table styling,
- giant white form card,
- excessive pills,
- fake urgency,
- countdown/checkout visuals before Checkout,
- making disabled Sessions look selectable.

Use hierarchy and spacing so dates are the main scanning anchor.

---

# 23. Responsive

Primary viewport:

```text
390px
```

Desktop validation:

```text
1440px
```

Mobile:

- comfortable page gutters,
- session cards easy to tap,
- selected state obvious,
- CTA above existing bottom navigation,
- safe-area respected,
- no horizontal page overflow.

Desktop:

- intentional reading width,
- compact package context,
- Session cards may use a 2-column layout if it improves comparison,
- no tiny phone layout floating in a large blank canvas.

---

# 24. Accessibility

Required:

- one outer `main` landmark from TravelerAppShell,
- semantic page heading,
- Session choices behave like a single-select group (`radiogroup`/radio semantics or equivalent native controls),
- disabled Sessions are truly non-selectable,
- selected state is announced to assistive technology,
- status not conveyed by color alone,
- keyboard selection works,
- visible focus,
- relevant touch targets >= 44px,
- loading/revalidation communicated with `aria-busy` or equivalent,
- validation error announced accessibly,
- sticky CTA does not cover content or bottom nav,
- reduced-motion preference respected.

---

# 25. Adapter / MVP Architecture

Suggested T09 feature boundary:

```text
src/features/sessionSelection/
  types.ts
  mockAdapter.ts
  SessionSelectionScreen.tsx
  SessionCard.tsx
  sessionSelection.css
  sessionSelection.test.tsx
  adapter.test.ts (if useful)
  index.ts
```

Do not duplicate existing date formatter/session fixtures merely to fit this folder.

Reuse:

- canonical Package catalog,
- T08 centralized Session data,
- `formatSessionDateTimeRange`,
- existing Traveler shell/tokens/UI primitives.

---

# 26. Tests — Required Contract Coverage

At minimum:

## Package / Data

1. known LIVE Package resolves,
2. unknown Package → NOT_FOUND,
3. non-LIVE Package unavailable,
4. T09 reuses canonical Package metadata,
5. T09 reuses centralized Session records rather than duplicate fixtures,
6. Sessions sorted chronologically.

## Status / Visibility

7. OPEN + positive reliable slots selectable,
8. OPEN + zero slots not selectable,
9. FULL visible disabled,
10. CLOSED visible disabled,
11. CANCELLED hidden,
12. no selectable Session state works.

## Selection

13. no selection → CTA disabled,
14. selecting OPEN Session → selected state visible,
15. selecting second Session replaces first,
16. disabled Session cannot become selected,
17. exactly one selected Session at a time.

## Capacity / Price

18. explicit remaining slots shown,
19. missing remaining slots does not invent a number,
20. explicit Session price shown,
21. missing Session price does not fabricate exact price,
22. participant total is not computed in T09.

## Revalidation / Concurrency

23. CTA performs validation before navigation,
24. valid selection → `/checkout/:sessionId`,
25. validation does not reserve/mutate capacity,
26. selected Session becomes FULL → stay T09 + clear selection,
27. selected Session becomes CLOSED → stay T09 + clear selection,
28. selected Session becomes CANCELLED → stay T09 + clear selection,
29. validation request error → keep selection + retry,
30. double CTA press while validating does not duplicate validation/navigation.

## Date / Time

31. same-day WIB output,
32. cross-date WIB output with both local dates.

## Business Boundaries

33. no participant selector in T09,
34. no pending-payment redirect from T09,
35. no countdown,
36. no booking/payment state creation,
37. no transport/pickup claim without explicit fixture.

## Shell / Routing / Accessibility

38. Package Detail CTA reaches T09,
39. T09 retains exact four Traveler bottom-nav items,
40. no incorrect primary nav active state,
41. single main landmark through actual App shell,
42. session selection keyboard/accessible single-select semantics,
43. sticky CTA coexists with bottom nav at mobile layout level.

---

# 27. Browser Smoke

At `390px`:

- package with multiple OPEN Sessions,
- choose first then second,
- FULL card disabled,
- CLOSED card disabled,
- no-selectable-session state,
- revalidation success → Checkout placeholder,
- revalidation becomes unavailable,
- validation request error + retry,
- sticky CTA + bottom nav coexist.

At `1440px`:

- package/session context hierarchy,
- selection visibility,
- disabled statuses,
- CTA progression,
- no awkward dead space.

Console target:

```text
0 errors
0 warnings
```

---

# 28. Out of Scope for T09

Do not implement:

- participant quantity selection,
- contact verification,
- checkout price breakdown,
- cancellation-policy acknowledgement,
- pending-payment resolution,
- atomic capacity reservation,
- booking creation,
- payment attempt,
- payment countdown,
- payment gateway,
- My Trips,
- production real-time sockets,
- production backend.

---

# 29. Acceptance Criteria

T09 is complete when:

1. `/packages/:packageId/sessions` replaces its placeholder,
2. existing Traveler guard/shell is reused,
3. only LIVE Package context is selectable,
4. centralized Session data is reused,
5. OPEN/FULL/CLOSED/CANCELLED behavior follows this contract,
6. exactly one valid Session can be selected,
7. CTA remains disabled without a valid selection,
8. displayed slot count is clearly only a snapshot,
9. T09 performs non-reserving availability revalidation before Checkout,
10. stale/unavailable selection is handled without creating state,
11. successful validation routes to `/checkout/:sessionId`,
12. T09 never reserves capacity or creates booking/payment state,
13. participant quantity remains deferred to T10,
14. pending-payment guard remains deferred to Checkout/payment creation,
15. same-day and cross-date WIB formatting are correct,
16. price semantics do not invent fees/totals,
17. 390px and 1440px UI are convincing and usable,
18. accessibility requirements pass,
19. Taste Skill is invoked for final T09 polish,
20. regression/quality gates remain green.
