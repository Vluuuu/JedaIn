# JedaIn — Traveler Contact Verification Contract (T11)

**Version:** 1.0  
**Status:** LOCKED for MVP implementation  
**Screen:** T11 — Contact / Phone Verification  
**Route:** `/checkout/:sessionId/contact`

> This document locks the MVP behavior for Traveler contact/phone verification between Checkout Summary (T10) and the return to the same Checkout context. It does not override higher-priority product documents.

---

## 1. Source Priority

When implementation details conflict, use this order:

1. `PRD.md`
2. `docs/SYSTEM_FLOW.md`
3. `docs/WIREFRAME_SPEC.md`
4. `docs/UI_SPEC.md`
5. `docs/RECOMMENDATION_CONTRACT.md`
6. `docs/HOME_CONTRACT.md`
7. `docs/EXPLORE_CONTRACT.md`
8. `docs/PACKAGE_DETAIL_CONTRACT.md`
9. `docs/SESSION_SELECTION_CONTRACT.md`
10. `docs/CHECKOUT_SUMMARY_CONTRACT.md`
11. `docs/CONTACT_VERIFICATION_CONTRACT.md`
12. `docs/DESIGN_SYSTEM.md`
13. `docs/TRAVELER_VISUAL_DIRECTION.md`
14. issue notes
15. implementation

This contract is intentionally narrow. It must not invent booking, payment, refund, transport, legal, or notification rules that are not already sourced.

---

## 2. Purpose

T11 exists only when Checkout determines that a required contact/phone is not verified.

Core flow:

```text
T10 Checkout Summary
  → required contact verified?
      → YES: continue T10 submit flow
      → NO: T11 Contact Verification
              → verify phone/contact
              → return to SAME /checkout/:sessionId
              → T10 re-evaluates all current rules again
```

T11 is not authentication/login.

T11 must not:

- create a Traveler identity,
- switch the logged-in Traveler,
- mark onboarding complete,
- reserve capacity,
- create a Booking,
- create a PaymentAttempt,
- start payment countdown,
- bypass the active `PENDING_PAYMENT` guard,
- bypass latest Session/price/capacity validation.

---

## 3. Route & Access

Route:

```text
/checkout/:sessionId/contact
```

Requirements:

- authenticated Traveler,
- onboarding `COMPLETED`,
- reuse `OnboardingRouteGuard`,
- reuse the focused checkout shell,
- `TravelerAppShell showBottomNav={false}`,
- no guest verification.

The route carries the concrete `sessionId` so success can return to the same Checkout context.

Direct reload must work without relying only on React Router `location.state`.

---

## 4. Entry Conditions

Normal entry is T10 returning:

```text
CONTACT_VERIFICATION_REQUIRED
```

T11 should resolve enough centralized context to know that `sessionId` belongs to a known LIVE Package/Session checkout path.

Do not duplicate Package or Session fixtures.

Reuse centralized data already used by T09/T10.

If the `sessionId` cannot be resolved safely:

```text
NOT_FOUND
```

Recovery:

```text
Kembali ke Explore
```

T11 does not need to authoritatively reserve or revalidate capacity while verifying contact. T10 remains responsible for latest Session/package/price/capacity checks after success.

---

## 5. Verification Is Separate From Phone Presence

Locked rule from T10:

```text
phone exists != phone verified
```

`AuthUser.phone` is contact/display data only.

Verification state must remain separate and server/adapter-shaped.

A verified state should be bound to at least:

```text
travelerId
verifiedPhone
verifiedAt
```

Do not store only:

```text
travelerId -> true
```

because changing the phone number must not silently keep a different number verified.

Recommended MVP shared store:

```text
mockContactVerificationStore
```

This store should become the shared source used by both:

- T10 Checkout contact requirement,
- T11 verification result.

Do not maintain independent verification booleans in T10 and T11.

---

## 6. Contact Update Semantics

T11 may start with:

- the current `AuthUser.phone`, or
- an empty phone field if none exists.

The Traveler may edit the phone before requesting an OTP.

Successful verification means:

1. the exact submitted phone is marked verified for the current Traveler,
2. the current Traveler contact phone is updated to that verified phone,
3. the verified state is persisted in the shared mock verification store,
4. the user returns to the same Checkout route.

If the Traveler edits the phone after an OTP was requested:

- the previous OTP verification session must no longer apply to the new phone,
- return to phone-entry/request state,
- the new phone requires a new OTP request.

Do not mark a newly edited phone verified merely because a previous phone was verified.

---

## 7. Phone Input Rules

UI:

- label: `Nomor HP`,
- `type="tel"`,
- `inputMode="tel"`,
- preserve input after recoverable errors.

Minimum MVP validation:

- trim whitespace,
- non-empty required value.

Do not invent a strict Indonesia-only regex, E.164 conversion, carrier validation, or country-code rewriting unless a higher source is added later.

Do not claim WhatsApp support, emergency-contact behavior, marketing usage, or SMS delivery guarantees.

---

## 8. Explanation Copy

T11 must explain why the contact is requested.

Source-backed direction:

```text
Nomor HP digunakan untuk kebutuhan trip dan notifikasi terkait pemesanan.
```

Equivalent concise wording is allowed.

Do not claim uses not defined by product sources.

---

## 9. OTP Request

Primary phone-entry action:

```text
Kirim Kode OTP
```

Request flow:

```text
PHONE_ENTRY
  → REQUESTING_OTP
  → OTP_SENT
```

Request must be adapter-shaped.

Suggested result:

```text
OtpVerificationSession
- verificationId
- travelerId
- phone
- requestedAt
- expiresAt?
- resendAvailableAt
```

T11 must not use the login/auth adapter in a way that creates/logs-in an account.

It may reuse visual primitives or small pure helpers from the existing Phone OTP UI, but contact verification behavior must be isolated from authentication side effects.

---

## 10. OTP Resend Countdown

`UI_SPEC.md` explicitly requires a countdown for OTP resend only.

The UI countdown must derive from an adapter/server-shaped timestamp such as:

```text
resendAvailableAt
```

Do not scatter a magic hard-coded number through UI components.

If the mock requires a cooldown duration, keep it in centralized prototype configuration and clearly treat it as non-final product configuration.

Do not confuse this with `payment_expires_at`.

T11 must not render payment-expiry countdown.

Before resend is available:

- resend action disabled,
- display remaining OTP resend time.

After it becomes available:

- enable `Kirim ulang kode`.

Resending creates/replaces the active OTP verification session for that phone.

---

## 11. OTP Verification

Primary OTP action exact direction:

```text
Verifikasi & Lanjut
```

Verification input:

- label: `Kode OTP`,
- numeric-friendly input mode,
- `autocomplete="one-time-code"`,
- preserve phone after OTP errors.

Verification must check that the OTP attempt belongs to:

```text
current traveler
+
current phone
+
active verificationId
```

A stale verification session for another phone or Traveler must not verify the current phone.

---

## 12. Mock OTP Semantics

This is a competition MVP; no real SMS provider is required.

Keep provider behavior behind a dedicated adapter.

Allowed mock behavior:

- deterministic successful code path,
- deterministic invalid/expired path,
- request failure override,
- verify failure override,
- delay override for loading-state tests.

Do not expose a fake production provider or claim real SMS delivery.

If a demo OTP is used, keep it centralized in prototype/mock configuration rather than scattering it in UI code.

---

## 13. Success

On successful verification:

```text
verification store updated
+
sessionStore user phone updated
+
navigate /checkout/:sessionId
```

Locked rule:

```text
return to checkout context, not Home
```

T11 must not directly create the booking after verification.

T10 must run again and re-check:

- verified contact,
- active `PENDING_PAYMENT`,
- current Package/Session availability,
- exact Session price,
- effective capacity,
- policy acknowledgement/local Checkout draft as applicable.

If Checkout state changed while T11 was open, T10 owns the resulting recovery state.

---

## 14. Already Verified Direct Entry

If the current Traveler already has the exact current phone verified and opens T11 directly:

- do not ask for another OTP,
- return to `/checkout/:sessionId`.

Verification comparison must be against the exact verified phone value, not only Traveler ID.

---

## 15. Recoverable Errors

Required error categories:

### OTP request failure

Copy direction:

```text
Kode OTP belum bisa dikirim. Coba lagi.
```

- remain on phone-entry state,
- preserve phone input,
- retry allowed.

### Invalid / expired OTP

Copy direction:

```text
Kode OTP tidak valid atau sudah kedaluwarsa.
```

- remain in OTP state when retry is still meaningful,
- allow resend according to adapter-provided resend timing.

### Verification request/network failure

Copy direction:

```text
Verifikasi belum bisa diproses. Coba lagi.
```

- preserve phone,
- preserve active OTP session where valid,
- retry allowed.

Do not turn a recoverable contact error into logout or Home redirect.

---

## 16. Required UI States

Implement at minimum:

```text
LOADING
PHONE_ENTRY
REQUESTING_OTP
OTP_SENT
VERIFYING_OTP
REQUEST_ERROR
VERIFY_ERROR
NOT_FOUND
```

Success is a transition back to Checkout rather than a long-lived success screen.

Optional short success acknowledgement is allowed only if it does not delay or replace returning to Checkout.

---

## 17. Information Hierarchy

Recommended order:

1. back/context link to Checkout,
2. heading `Verifikasi Nomor HP`,
3. concise explanation of trip/booking-notification use,
4. compact Checkout/package context if useful,
5. phone field,
6. request OTP action,
7. OTP input after request succeeds,
8. resend countdown/action,
9. `Verifikasi & Lanjut`,
10. inline/request errors.

Do not reproduce full Checkout Summary.

Do not show participant pricing/payment controls on T11.

---

## 18. Back Behavior

Back action should return to:

```text
/checkout/:sessionId
```

without verifying.

No booking/payment/reservation mutation occurs.

Do not send the user to Home as the default back action.

---

## 19. Shared Verification Store Integration

T11 implementation should replace T10's default adapter-local verification state with a shared mock source.

Suggested shape:

```text
ContactVerificationRecord
- travelerId
- phone
- verifiedAt
```

Suggested API:

```text
getVerifiedPhone(travelerId)
isPhoneVerified(travelerId, phone)
markPhoneVerified(travelerId, phone)
clearForTraveler(travelerId)
reset()
```

Test-only override injection may remain available, but production/default mock flow should use one shared store so:

```text
T11 success
→ T10 reload
→ phoneVerified === true
```

without special router state hacks.

---

## 20. Transaction Boundary

T11 must prove zero mutation to:

```text
mockTransactionStore bookings
mockTransactionStore paymentAttempts
mockTransactionStore reserved quantity
```

for all of:

- page load,
- phone edit,
- OTP request,
- OTP resend,
- OTP verify success,
- OTP verify failure,
- back to Checkout.

Only T10 atomic submit may create reservation/Booking/PaymentAttempt.

---

## 21. Pending Payment Boundary

T11 does not resolve active pending payments.

After successful contact verification:

```text
return Checkout
```

If an active `PENDING_PAYMENT` now exists, T10 sends the Traveler to T12.

Do not jump from T11 directly to T12 based on stale assumptions.

---

## 22. Visual Direction

Before final UI refinement:

**INVOKE TASTE SKILL.**

Target feel:

- focused,
- calm,
- trustworthy,
- lightweight verification step,
- clearly still part of the Traveler booking journey.

Avoid:

- generic banking/KYC UI,
- alarming security language,
- payment countdown styling,
- excessive OTP boxes/decoration,
- glassmorphism-heavy auth screen,
- full redesign of Traveler authentication,
- dashboard layout.

Reuse the existing Traveler design system and focused T10 shell.

---

## 23. Responsive

Primary:

```text
390px
```

Desktop:

```text
1440px
```

Mobile:

- approximately 16px gutters,
- no bottom nav,
- 44px+ primary controls,
- keyboard-friendly tel/OTP inputs,
- sticky CTA only if it improves the flow without covering the keyboard/content,
- no horizontal overflow.

Desktop:

- intentional narrow verification composition,
- not a tiny phone mockup floating in huge whitespace.

---

## 24. Accessibility

Required:

- `TravelerAppShell` owns `<main>`,
- no nested `<main>`,
- semantic `h1`,
- real form labels,
- `type="tel"` for phone,
- numeric-friendly OTP input,
- `autocomplete="one-time-code"`,
- request/verify errors announced,
- countdown text available to assistive technology without noisy per-second assertive announcements,
- disabled resend state is semantic,
- visible focus,
- 44px+ targets,
- reduced-motion respected.

Do not rely on color alone for verification/error state.

---

## 25. Out of Scope

T11 does not implement:

- production SMS provider,
- production OTP fraud/rate-limit system,
- production phone normalization library,
- identity KYC,
- WhatsApp verification,
- email verification,
- account linking,
- T12 pending-payment continue/cancel,
- T13 provider/payment countdown,
- booking creation,
- capacity reservation,
- payment result,
- notification delivery infrastructure.

---

## 26. Required Tests

At minimum cover:

### Route / Context

1. valid Checkout session resolves T11,
2. unknown session → NOT_FOUND,
3. protected shell reused,
4. bottom navigation hidden,
5. direct reload works,
6. back → same `/checkout/:sessionId`.

### Phone State

7. existing `AuthUser.phone` pre-fills field,
8. missing phone starts empty,
9. phone required/non-empty,
10. recoverable request error preserves phone,
11. editing phone after OTP request invalidates previous OTP session.

### Shared Verification

12. phone presence alone is not verified,
13. verification bound to Traveler + exact phone,
14. different phone is not treated as verified,
15. already-verified exact phone direct entry returns to Checkout,
16. successful verification updates shared verification store,
17. successful verification updates current `sessionStore.user.phone`.

### OTP Request / Resend

18. request OTP → OTP_SENT,
19. request loading/disabled state,
20. resend disabled before `resendAvailableAt`,
21. countdown derives from timestamp,
22. resend enabled after timestamp,
23. resend replaces active verification session,
24. no payment countdown copy/state appears.

### Verification

25. valid OTP → same Checkout route,
26. invalid OTP remains recoverable,
27. expired/stale verification does not verify,
28. verification request failure preserves useful state,
29. wrong Traveler/phone/verificationId cannot verify.

### Transaction Safety

30. OTP request creates zero booking/payment/reservation,
31. resend creates zero booking/payment/reservation,
32. successful OTP verification creates zero booking/payment/reservation,
33. failed verification creates zero booking/payment/reservation.

### T10 Integration

34. unverified T10 → T11,
35. verify in T11 → return T10,
36. returned T10 now renders exact phone as `Terverifikasi`,
37. T10 remains responsible for new pending-payment/session/capacity/price checks.

### Accessibility / Regression

38. semantic form labels,
39. OTP autocomplete/input mode,
40. resend disabled semantics,
41. single main landmark,
42. 390px and 1440px smoke,
43. no new console errors/warnings,
44. existing Auth/Login OTP flow remains unchanged.

---

## 27. Acceptance Criteria

T11 is accepted when:

- `/checkout/:sessionId/contact` is a real protected Traveler screen,
- no bottom navigation is shown,
- phone input + OTP request + OTP verification are implemented through an isolated adapter,
- OTP resend countdown is separate from payment countdown and timestamp-driven,
- phone presence does not imply verification,
- verification is bound to the exact Traveler + phone,
- T11 and T10 use one shared verification source,
- successful verification updates the Traveler contact phone,
- success returns to the same Checkout context,
- no booking/payment/reservation is created inside T11,
- recoverable errors preserve useful input/session state,
- direct already-verified entry does not request OTP again,
- full regression/quality gates remain green,
- 390px and 1440px smoke pass,
- Taste Skill is invoked for final visual refinement.

---

## 28. Final Product Boundary

The business boundary is:

```text
T11 proves contact readiness.
T10 owns transaction readiness.
```

Therefore:

```text
T11 success
!= booking created
!= slot reserved
!= payment started
```

It only makes the current contact verified and returns the Traveler to Checkout for authoritative re-evaluation.
