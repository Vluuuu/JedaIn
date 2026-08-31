# JedaIn — Traveler Home Contract

**Version:** 1.0  
**Date:** 31 Agustus 2026  
**Status:** MVP Prototype Contract  
**Applies to:** T06 Logged-in Traveler Home / Issue #9

> Dokumen ini mengunci behavior dan state Home untuk MVP/prototype lomba JedaIn. Fokusnya adalah system flow + UI/UX yang dapat didemokan dengan jelas, bukan production backend atau final global art direction. Dokumen ini tidak boleh mengoverride keputusan yang lebih tinggi pada `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, atau `docs/UI_SPEC.md`.

---

# 1. Source Priority

Jika ada conflict:

```text
PRD.md
> SYSTEM_FLOW.md
> WIREFRAME_SPEC.md
> UI_SPEC.md
> QUIZ_CONTENT_CONTRACT.md
> RECOMMENDATION_CONTRACT.md
> HOME_CONTRACT.md
> DESIGN_SYSTEM.md
> Issue #9 implementation notes
> implementation
```

## 1.1 Resolved Module-Order Conflict

Ada perbedaan urutan antara source:

- `SYSTEM_FLOW.md` 4.3 memprioritaskan `Pending Payment -> Upcoming Trip -> Personalized Recommendation -> Search -> Discovery`.
- `WIREFRAME_SPEC.md` T06 menaruh Search sebelum Personalized Recommendation.
- `UI_SPEC.md` T06 menaruh Search lebih awal lagi.

Karena `SYSTEM_FLOW.md` lebih tinggi, Home MVP mengikuti **priority order dari SYSTEM_FLOW**.

Greeting/Header tetap berada paling atas sebagai shell/content context.

---

# 2. Product Goal

`/home` adalah:

1. personalized discovery hub,
2. traveler status hub,
3. entry point ke Explore, Package Detail, Payment, My Trips, Profile/Preferences.

Home harus tetap berguna ketika traveler memiliki critical state seperti pending payment atau upcoming trip.

**Pending payment tidak boleh memblok browsing/discovery.** Yang diblok adalah pembuatan checkout/payment baru pada flow berikutnya.

---

# 3. Locked Top-Level Module Order

Gunakan urutan:

```text
1. Greeting / App Header
2. PendingPaymentBanner — conditional
3. UpcomingTripCard — conditional
4. Personalized Recommendation
5. Search
6. Explore by Mood
7. Popular This Week
8. From Departure Area
9. Verified Destinations
10. Bottom Navigation
```

## 3.1 Preference Summary / Ubah Preferensi

PRD mengizinkan traveler dengan onboarding `COMPLETED` untuk retake/update quiz dari Profile/Home.

Untuk menjaga priority order di atas, preference summary bukan top-level module terpisah yang menggeser Search/Discovery.

Letakkan sebagai **compact secondary control di dalam/tepat setelah Personalized Recommendation section**.

Minimum:

- ringkasan maksimal 2–3 current signals yang berasal dari `QuizDraft` terbaru,
- action `Ubah preferensi`,
- target MVP: `/profile/preferences`.

Tidak perlu mengimplementasikan real retake screen pada Issue #9 jika route masih placeholder.

---

# 4. Home State Contract

Required states:

```text
NORMAL
PENDING_PAYMENT_ONLY
UPCOMING_TRIP_ONLY
PENDING_PAYMENT_AND_UPCOMING
NO_RECOMMENDATION
LOADING
ERROR_PARTIAL
```

## 4.1 NORMAL

```text
pendingPayment = none
upcomingTrip = none
personalizedRecommendation = available
```

Render recommendation + all discovery modules.

## 4.2 PENDING_PAYMENT_ONLY

```text
pendingPayment = active
upcomingTrip = none
```

PendingPaymentBanner tampil sebelum recommendation.

Discovery tetap tersedia.

## 4.3 UPCOMING_TRIP_ONLY

```text
pendingPayment = none
upcomingTrip = available
```

UpcomingTripCard tampil sebelum recommendation.

Discovery tetap tersedia.

## 4.4 PENDING_PAYMENT_AND_UPCOMING

Keduanya tampil bersamaan dengan urutan:

```text
PendingPaymentBanner
UpcomingTripCard
Personalized Recommendation
...
```

Jangan collapse salah satu hanya karena yang lain ada.

## 4.5 NO_RECOMMENDATION

Jika personalized recommendation tidak tersedia:

- jangan fabricate recommendation,
- tampilkan compact personalized empty state,
- CTA ke `/explore`,
- Search + Mood + Popular + Departure + Verified Destinations tetap tampil.

Suggested concise copy:

```text
Belum ada rekomendasi personal yang bisa ditampilkan.
```

Action:

```text
Jelajahi Experience
```

## 4.6 LOADING

Gunakan skeleton yang mempertahankan approximate layout.

Jangan blank white screen atau spinner-only untuk seluruh Home.

## 4.7 ERROR_PARTIAL

Satu module gagal tidak boleh menghapus module lain yang berhasil.

Contoh:

```text
recommendation fails
popular succeeds
departure succeeds
verified destinations succeeds
```

Result:

- recommendation menunjukkan compact error/retry state,
- module lain tetap render.

Home hanya boleh menggunakan full-page catastrophic state jika shell/core identity tidak dapat dirender sama sekali; itu bukan primary Issue #9 demo state.

---

# 5. Home Adapter / View Model — MVP

Gunakan satu Home adapter/mock boundary yang deterministic dan testable.

Suggested UI-facing shape:

```text
HomeViewModel
- state
- traveler
- quizDraft
- pendingPayment?
- upcomingTrip?
- personalizedRecommendation?
- popularPackages[]
- departureAreaPackages[]
- verifiedDestinations[]
- moodPresets[]
- moduleErrors?
```

Home visual components tidak boleh membuat business state sendiri dari random JSX hardcode.

Mock scenarios harus dapat memunculkan seluruh required state untuk demo/tests.

---

# 6. Traveler / Greeting

Gunakan identity dari existing session/auth architecture.

Greeting minimal:

```text
Halo, {firstName}
```

Jika nama tidak tersedia, jangan fabricate nama. Gunakan greeting netral seperti:

```text
Halo!
```

Notification icon adalah optional sesuai wireframe.

Jangan membuat notification backend pada Issue #9.

---

# 7. PendingPaymentBanner Contract

Conditional hanya jika adapter memberi active pending payment.

Minimum data:

```text
PendingPaymentSummary
- bookingId
- packageName
- sessionLabel optional
- amount optional
- expiresAt            // server-provided timestamp
- authoritativeStatus
```

Minimum visible UI:

- package/session name,
- remaining time derived for display dari `expiresAt`,
- amount jika tersedia,
- CTA `Lanjutkan Pembayaran`.

CTA:

```text
/payment/:bookingId
```

## 7.1 Countdown Rule

`expiresAt` dari server/mock adapter adalah source of truth untuk timestamp.

Frontend boleh menghitung **display remaining time** dari timestamp tersebut.

Frontend countdown tidak boleh sendirian mengubah booking/payment menjadi `EXPIRED`, `CANCELLED`, atau status authoritative lain.

Jika display mencapai 0, jangan mengarang status server baru. Tetap arahkan resolution/status check melalui payment flow.

## 7.2 Browsing Rule

Pending payment:

- visually prominent,
- does NOT hide recommendation,
- does NOT hide search/discovery,
- does NOT disable Home/Explore bottom nav.

Blocking checkout baru adalah responsibility flow checkout/payment berikutnya, bukan Home overlay.

---

# 8. UpcomingTripCard Contract

Conditional jika ada paid/upcoming booking.

Minimum data:

```text
UpcomingTripSummary
- bookingId
- packageName
- tripDate
- destinationLabel
- meetingOrDepartureSummary optional
```

Visible:

- package/trip name,
- date,
- destination,
- relative time optional,
- meeting/departure summary jika benar-benar tersedia,
- CTA `Lihat Trip`.

CTA:

```text
/trips/:bookingId
```

Jangan fabricate pickup/transport promise dari departure information.

---

# 9. Personalized Recommendation on Home

Reuse semantics dan existing implementation dari Issue #8.

Jangan membuat recommendation engine kedua.

Home recommendation sebaiknya mengambil top item dari existing rule-based recommendation adapter/engine atau shared helper.

## 9.1 Normal matched recommendation

Show one visually primary package card/hero with:

- package visual,
- package title,
- location,
- duration,
- price,
- verification,
- concise label such as `Pilihan untukmu`,
- max 2–3 concise reason chips if useful.

CTA/tap:

```text
/packages/:packageId
```

## 9.2 Recommendation fallback

Jika Issue #8 result adalah FALLBACK, Home tidak boleh mengubahnya menjadi exact/strong match.

Gunakan neutral label seperti:

```text
Pilihan terdekat untukmu
```

No percentage.

## 9.3 Missing/invalid QuizDraft

Do not fabricate synthetic preference.

Return/derive `NO_RECOMMENDATION` or module error while other discovery remains available.

---

# 10. Preference Summary

Derived only from latest QuizDraft.

Keep concise: maximum 3 chips/signals.

Recommended priority:

```text
1. current intent
2. duration
3. departure area
```

Can substitute one activity if it improves UI clarity.

Do not show internal enum names.

Action:

```text
Ubah preferensi -> /profile/preferences
```

---

# 11. Search Contract

Placeholder from wireframe:

```text
Cari healing, lokasi, atau experience...
```

Issue #9 only needs Home-side search interaction.

On submit:

```text
/home search -> /explore
```

Query may be preserved using query params or router state as an implementation detail, but Issue #9 does not implement the Explore search engine.

Empty submit should not navigate.

---

# 12. Explore by Mood

Locked visible presets from wireframe:

```text
Tenang
Alam
Recharge
Eksplorasi
Refleksi
```

Treat these as **discovery presets**, not new quiz/business enums.

Do not invent recommendation weights from mood clicks.

Mood click may navigate to `/explore` with an implementation-local preset/query parameter for future T07 consumption.

Use reusable `MoodChip` or equivalent product component.

---

# 13. Popular This Week

For competition MVP, use centralized fictional mock package catalog.

Do not claim these are real market statistics.

Prototype ordering may use existing `popularityRank` from mock packages.

Show a small discovery row/grid, not entire catalog.

Package tap:

```text
/packages/:packageId
```

---

# 14. From Departure Area

Use latest QuizDraft departure area.

For `MALANG` / `SURABAYA`:

- filter LIVE prototype packages by `departureAreas[]`,
- show concise section label contextual to traveler area.

For `OTHER` or no exact matching package:

- do not geocode,
- do not infer distance,
- use inline empty/fallback discovery state or a generic Explore action.

Departure area is starting-area relevance only; it does not imply transport service.

---

# 15. Verified Destinations

Can be derived from LIVE prototype package destination metadata for Issue #9 to avoid unnecessary separate backend.

Minimum DestinationCard fields:

```text
destinationName
locationLabel
verificationLevel
visualAsset if available
```

De-duplicate destinations.

Verification means JedaIn prototype BASIC/PLUS status only.

Do not add government certification, safety guarantee, or real partner claims.

Destination tap may route to Explore/filter context until a dedicated destination detail route exists.

---

# 16. Bottom Navigation

Must use existing `TravelerAppShell`.

Exactly:

```text
Home
Explore
My Trips
Profile
```

For `/home`:

```text
activeNav = Home
```

No fifth tab.

Do not put Search as bottom-nav item.

---

# 17. Contextual CTA Priority

Home has no single global CTA.

Contextual hierarchy follows source:

```text
1. Active pending payment -> Lanjutkan Pembayaran
2. Upcoming trip -> Lihat Trip
3. Personalized recommendation -> package detail
4. Discovery interactions
```

This is visual/action priority only.

It must NOT hide lower-priority content.

---

# 18. Prototype Mock Scenarios

Adapter should support deterministic fixtures for:

```text
NORMAL
PENDING_PAYMENT_ONLY
UPCOMING_TRIP_ONLY
PENDING_PAYMENT_AND_UPCOMING
NO_RECOMMENDATION
ERROR_PARTIAL
```

LOADING is represented by delayed adapter/request state.

Suggested mock data should reuse:

- existing authenticated traveler/session identity,
- QuizDraft from Issue #7,
- recommendation engine + package catalog from Issue #8.

Do not create production API/database.

---

# 19. Error & Retry Behavior

Module-level failures should have module-level retry where useful.

Rules:

- recommendation failure does not hide Popular/Departure/Verified modules,
- popular failure does not hide recommendation,
- retry must not reset QuizDraft/session,
- pending-payment failure must not fabricate `no pending payment` if state is unknown; display a small status-load error instead when scenario tests require it.

For MVP implementation, adapter can expose deterministic module-error fixtures.

---

# 20. Visual Direction — Issue #9

Invoke **TASTE SKILL** before implementing/finalizing Home.

Home should feel like a travel/wellness discovery product, not SaaS dashboard.

Prioritize:

- strong imagery hierarchy,
- horizontal discovery rows on mobile where useful,
- varied but coherent section composition,
- transactional states visually clear without dominating the whole page,
- personalized section distinct from generic popular discovery,
- concise copy,
- calm nature + travel discovery feel.

Avoid:

- generic white-card wall,
- every section using identical card composition,
- excessive text,
- random gradients/glows,
- fake AI styling,
- final global redesign of Login/Consent/Quiz/Recommendation.

**Final global art-direction consolidation happens after Issue #9.**

---

# 21. Accessibility / Responsive Baseline

Traveler is mobile-first.

Primary smoke widths:

```text
390px
1440px
```

Required:

- semantic headings/sections,
- keyboard-accessible search/cards/actions,
- visible focus,
- touch targets >= 44px where appropriate,
- countdown understandable without color only,
- verification text beyond color,
- reduced motion respected,
- bottom nav does not obscure content,
- mobile horizontal rows have usable scroll behavior,
- desktop uses available width intentionally rather than stretching mobile cards blindly.

---

# 22. Issue #9 Scope Boundary

## Implement

- real `/home` screen,
- state-aware module composition,
- Home adapter/mock boundary,
- PendingPaymentBanner,
- UpcomingTripCard,
- personalized recommendation reuse,
- preference summary / `Ubah preferensi`,
- Search interaction,
- MoodChip discovery,
- Popular This Week,
- From Departure Area,
- Verified Destinations,
- exactly four bottom-nav tabs via existing shell,
- loading / no-recommendation / partial-error states,
- tests + responsive smoke.

## Do Not Implement

- production backend/database,
- real payment gateway,
- authoritative payment expiration mutation from frontend countdown,
- real Explore filtering engine,
- Package Detail implementation,
- My Trips implementation,
- Profile Preferences/retake implementation,
- notification backend,
- geocoding/routing,
- real partner/destination claims,
- new recommendation algorithm,
- final global UI redesign.
