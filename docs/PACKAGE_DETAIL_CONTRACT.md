# JedaIn — Traveler Package Detail Contract

**Version:** 1.0  
**Date:** 31 Agustus 2026  
**Status:** MVP Prototype Contract  
**Applies to:** T08 `/packages/:packageId`

> Dokumen ini mengunci perilaku MVP untuk Traveler Package Detail setelah T07 Explore selesai. Tujuannya adalah membantu traveler memahami satu Package `LIVE` sebelum memilih Trip Session, tanpa mencampur Package dengan Session, mengarang transport/capacity/refund rule, atau membuat klaim trust yang tidak didukung source of truth.

---

# 1. Source Priority

Untuk product/interaction semantics:

```text
PRD.md
> SYSTEM_FLOW.md
> WIREFRAME_SPEC.md
> UI_SPEC.md
> RECOMMENDATION_CONTRACT.md
> HOME_CONTRACT.md
> EXPLORE_CONTRACT.md
> PACKAGE_DETAIL_CONTRACT.md
> DESIGN_SYSTEM.md
> TRAVELER_VISUAL_DIRECTION.md
> issue implementation notes
> implementation
```

Jika higher source menandai sesuatu sebagai `PENDING` / `DISCUSSION`, aturan prototype di dokumen ini harus tetap mudah diganti dan tidak boleh dipresentasikan sebagai business-final.

---

# 2. Purpose

T08 adalah **decision-support surface** antara discovery dan pemilihan jadwal.

Flow:

```text
Recommendation / Home / Explore
→ Package Detail
→ Choose Session
→ Checkout
```

Package Detail harus menjawab:

1. experience ini apa,
2. berlangsung di mana,
3. siapa EO/guide yang terkait,
4. apa garis besar itinerary-nya,
5. apa yang termasuk / tidak termasuk bila datanya tersedia,
6. informasi safety/basic note apa yang relevan,
7. bagaimana status trust destinasi,
8. berapa starting price,
9. apakah ada session mendatang yang dapat dipilih,
10. apa langkah traveler berikutnya.

T08 **bukan** tempat traveler membeli template Package secara abstrak.

Traveler tetap melakukan booking terhadap **Trip Session** konkret pada flow berikutnya.

---

# 3. Route, Access & Shell

Route:

```text
/packages/:packageId
```

MVP menggunakan existing authenticated Traveler architecture:

- traveler harus authenticated,
- onboarding harus `COMPLETED`,
- gunakan existing `OnboardingRouteGuard`,
- gunakan existing `TravelerAppShell`,
- jangan membuat guest Package Detail khusus pada issue ini.

Bottom navigation tetap mengikuti Traveler shell:

```text
Home | Explore | My Trips | Profile
```

Package Detail bukan tab utama, jadi implementasi tidak perlu memaksa salah satu tab menjadi aktif hanya karena user datang dari Home/Explore/Recommendation.

Sticky CTA harus berada di atas mobile bottom navigation dan menghormati safe-area.

Payment flow tetap satu-satunya flow yang memakai distraction-free behavior khusus sesuai UI spec.

---

# 4. Package vs Session — LOCKED

## Package

Package adalah template experience yang dibuat EO dan sudah melalui approval.

Minimum source-backed fields:

- title,
- description / value proposition,
- destination,
- itinerary,
- base/starting pricing rule,
- current approved/live version,
- status.

## Session

Session adalah occurrence konkret dari Package.

Minimum source-backed fields:

- package id,
- start time,
- end time,
- capacity,
- reserved slots,
- booked slots,
- status.

Traveler membeli **Session**, bukan Package template.

T08 hanya boleh menampilkan **session preview** dan CTA ke T09.

T08 tidak memilih session, tidak membuat booking, tidak reserve slot, dan tidak membuat payment.

---

# 5. Eligible Package Rule

Traveler-facing Package Detail hanya menampilkan current package version yang dapat diperlakukan sebagai current `LIVE` version pada prototype.

Rules:

- Package dari centralized catalog harus ditemukan berdasarkan `packageId`,
- Package non-`LIVE` tidak boleh ditampilkan sebagai purchasable traveler package,
- Package id tidak dikenal → `NOT_FOUND`,
- jangan diam-diam fallback ke package lain,
- jangan expose draft/submitted/rejected package ke Traveler UI.

Current LIVE package version adalah source detail traveler saat ini.

MVP belum perlu menampilkan version number ke user.

Material edit/versioning backend tetap mengikuti PRD dan tidak diimplementasikan pada T08.

---

# 6. Centralized Data Strategy

T08 wajib reuse existing centralized package catalog:

```text
MOCK_RECOMMENDATION_PACKAGES
```

Jangan duplicate:

- title,
- destinationName,
- locationLabel,
- status,
- verificationLevel,
- pricePerPerson,
- durationType,
- rating,
- existing package illustration identity.

Tambahkan **centralized Package Detail fixture/adapter boundary** untuk metadata yang belum ada di catalog.

Suggested architecture:

```text
PackageDetailSource
- packageId
- valueProposition / longSummary
- highlights[]
- itinerary[]
- includedItems[]
- excludedItems[]
- safetyNotes[]
- cancellationPolicySummary
- organizer
- destinationDetail
- upcomingSessionPreviews[]
- optional reviewPreview
```

Exact TypeScript shape boleh berbeda selama semantics sama.

Detail fixture tidak boleh tersebar di JSX.

Untuk MVP lima-package catalog saat ini, setiap Package `LIVE` yang dapat dibuka dari Explore sebaiknya memiliki detail fixture sehingga demo tidak berakhir pada placeholder acak.

Semua organizer, itinerary, review text, dan detail experience tambahan yang belum berasal dari real partner harus diperlakukan sebagai **fictional competition prototype content**.

Content harus:

- konsisten dengan title/summary/intents/activity tags yang sudah ada,
- tidak mengaku sebagai real partner,
- tidak mengaku sebagai real destination photo/content,
- tidak membuat medical/wellness outcome claim,
- tidak membuat transport promise,
- tidak membuat certification claim yang tidak ada di PRD.

---

# 7. Recommended Package Detail View Model

Suggested adapter result:

```text
PackageDetailViewModel
- state: LOADING | READY | NOT_FOUND | ERROR
- package
- detail
- organizer
- destination
- upcomingSessions[]
- hasOpenSession
- optional personalizedContext
- optional reviewPreview
```

Data fetching/mock loading logic harus berada pada adapter boundary, bukan JSX.

---

# 8. Locked Section Order

Gunakan gabungan hierarchy dari Wireframe + UI Spec dengan prioritas higher source.

Recommended T08 order:

1. Hero media / visual
2. Title + short value proposition
3. Rating + destination verification trust
4. Starting price + duration/highlights
5. Optional personalized match explanation
6. Destination/location summary
7. EO / guide identity + guide status
8. Experience summary / package highlights
9. Itinerary
10. What's included / excluded
11. Safety / basic notes
12. Cancellation / refund policy summary
13. Upcoming session preview
14. Reviews preview
15. Sticky primary CTA `Pilih Jadwal`

Section dapat dikomposisikan responsif, tetapi informasi penting tidak boleh hilang.

Do not turn every section into an identical white Card.

---

# 9. Hero Media

Use existing centralized prototype-safe package illustrations.

Current assets are **illustrations**, not factual photographs.

Accessibility wording must remain accurate, e.g.:

```text
Ilustrasi suasana {package title}
```

Do not label them as:

- foto destinasi,
- foto partner,
- dokumentasi trip asli.

MVP dapat menggunakan satu strong hero visual. Multiple gallery items are optional, not required if no truthful additional asset exists.

Do not fabricate a fake photo gallery by presenting the same illustration as several “real photos”.

---

# 10. Title, Summary & Value Proposition

Required visible information:

- package title,
- concise value proposition,
- destination/location context,
- duration,
- starting price.

Copy harus concise dan non-medical.

Avoid claims such as:

- menyembuhkan burnout,
- guaranteed healing,
- clinically proven relaxation,
- guaranteed mental-health outcome.

JedaIn menjual curated wellness experience, bukan medical treatment.

---

# 11. Price Semantics

Display top-level Package price as traveler-facing **starting price**.

Source for current prototype:

```text
package.pricePerPerson
```

Recommended display:

```text
Mulai dari Rp275.000 / orang
```

Do not expose internal business formula to traveler:

```text
Destination Base Cost
EO Margin
Platform Commission
```

Those are internal pricing mechanics from PRD.

Do not add platform fee to customer price unless a future higher source explicitly defines it.

Transport must not be inferred as included from price.

---

# 12. Personalized Match Explanation

Higher sources allow match explanation **if relevant/personalized context exists**.

MVP rule:

- Package Detail may accept explicit recommendation context from navigation state/adapter,
- if real recommendation reasons are available, show at most 2–3 concise reasons,
- reuse Issue #8 human-readable reason semantics,
- do not recompute a second scoring formula inside T08,
- do not fabricate personalized reasons for generic Explore entry,
- do not show numeric match percentage,
- direct deep link without recommendation context simply omits this section.

T08 completion does not require modifying the recommendation engine.

---

# 13. Destination Trust

Destination information minimum:

- destination name,
- location label,
- verification level.

User-facing verification treatment:

```text
BASIC → Terverifikasi Dasar
PLUS  → Terverifikasi Plus
```

Important:

Verification badge represents **JedaIn destination-partner verification/trust state**, not government certification and not an external tourism certification unless explicitly sourced later.

Tooltip/details may explain that status is a JedaIn trust signal.

Do not invent a detailed difference between BASIC and PLUS that is not defined by higher sources.

Do not change destination verification state from frontend display logic.

---

# 14. EO / Guide Identity

Wireframe requires EO / guide identity + guide status.

MVP may use centralized fictional organizer profiles tied to package fixtures.

Minimum:

```text
Organizer display name
Guide status
optional concise role/description
```

Guide status source values:

```text
CONCEPT_ONLY
CERTIFIED_GUIDE
```

User-facing copy must make clear this is JedaIn/product trust context and must not imply unrelated professional/government licensing.

Destination `guide_ready` and EO guide status are different dimensions.

Do not collapse them into one generic “verified guide” badge.

---

# 15. Package Highlights

Highlights are concise decision aids, not business claims.

Recommended maximum:

```text
3–5 highlights
```

Examples of allowed dimensions when supported by fixture:

- activity style,
- duration,
- small-group suitability,
- nature/culture/workshop focus.

Do not add:

- pickup included,
- free transport,
- guaranteed private group,
- remaining seat claims,
- medical benefit claims,

unless explicit fixture/source says so.

---

# 16. Itinerary

Itinerary is **Package-level template itinerary**.

Recommended item shape:

```text
ItineraryItem
- order
- title
- description
- optional timeOfDayLabel / durationLabel
```

T08 itinerary must not imply a specific trip date/session unless the text explicitly comes from a Session.

Avoid inventing:

- pickup route,
- shuttle schedule,
- departure transport,
- exact meeting point,

unless source data explicitly exists.

Use activity-focused itinerary wording consistent with package tags.

---

# 17. Included / Excluded

Higher wireframe requires visible What's Included / Excluded.

Rules:

- list only explicit fixture items,
- if an item is unknown, omit it rather than guessing,
- do not assume transport is included or excluded,
- do not assume meals, lodging, equipment, tickets, insurance, or guide services unless the fixture explicitly defines them,
- no hidden fee language that conflicts with traveler price.

For competition mock data, any included/excluded items must be centralized and clearly fictional prototype content internally.

---

# 18. Safety / Basic Notes

Show concise package-level safety/basic notes from fixture.

Good categories:

- recommended personal preparation,
- accessibility/activity intensity note,
- follow organizer/venue instructions,
- weather-sensitive activity note when relevant.

Do not claim:

- “100% aman”,
- zero risk,
- medical suitability,
- medical supervision,

unless a future source explicitly supports it.

Safety information is a material Package field in PRD and must not be changed silently for existing bookings in a production system; versioning itself is out of scope here.

---

# 19. Cancellation / Refund Policy Summary

T08 must show a policy summary, but detailed cancellation/refund thresholds are not finalized in current source docs.

Therefore MVP must **NOT invent**:

- cancellation deadlines,
- refund percentages,
- admin fees,
- automatic refund windows,
- no-refund conditions.

Safe prototype direction:

```text
Kebijakan pembatalan & refund
Detail ketentuan akan ditampilkan kembali saat checkout sebelum pembayaran.
```

Additional neutral explanation is allowed only if it does not create a business-final rule.

T10/booking flow later owns the exact acknowledgement surface.

---

# 20. Upcoming Session Preview

T08 must show upcoming sessions as a **read-only preview**.

Suggested preview fields:

```text
sessionId
packageId
startAt
endAt
status
optional pricePerPerson
optional remainingSlots
```

Allowed preview statuses:

```text
OPEN
FULL
CLOSED
```

`CANCELLED` should not be promoted as an upcoming purchasable session.

MVP recommended display:

- max 2–3 nearest upcoming relevant sessions,
- chronological order,
- date/time,
- status,
- session price if available,
- remaining slots only if reliable mock/server-shaped data exists.

Important:

- remaining slots is display only,
- frontend does not reserve capacity,
- visible slots can change,
- actual availability/capacity is revalidated later,
- T08 does not create booking.

T09 will own full selection semantics.

---

# 21. Session Availability → CTA Rule

Primary sticky CTA:

```text
Pilih Jadwal
```

If at least one upcoming `OPEN` session exists:

```text
CTA enabled
→ /packages/:packageId/sessions
```

If no upcoming `OPEN` session exists:

```text
CTA disabled
Message: Belum ada jadwal tersedia
```

Do not route directly to checkout from T08.

Do not auto-select a Session from Package Detail.

Do not reserve capacity on CTA click.

An existing pending payment must **not block browsing Package Detail or opening session selection**. The pending-payment guard remains a checkout/payment creation concern.

---

# 22. Reviews Preview

Wireframe includes Reviews Preview.

Current MVP can use:

- existing package rating as the concise rating summary,
- optional fictional review excerpts only when explicit centralized review fixture exists.

Do not invent:

- fake review counts,
- fake booking counts,
- “1000+ travelers”,
- fake verified-review statistics.

If text review data is absent:

- show rating summary,
- optionally show a lightweight empty preview such as `Belum ada ulasan tertulis yang ditampilkan.`,
- do not fabricate comments.

Any future mock review record shown as verified must be tied to a mock `COMPLETED` booking because PRD only permits reviews from completed bookings.

Separate venue and EO/guide review semantics remain the business rule; T08 does not implement review submission.

---

# 23. Save / Favorite / Share

Wireframe lists Save/Favorite and Share as secondary actions.

For the 5-day MVP these are **not required for T08 completion**.

Do not implement persistence/favorites backend in this issue.

A share control is optional only if it is lightweight and does not distract from golden flow.

Primary focus remains:

```text
Understand Package → Pilih Jadwal
```

---

# 24. Location / Map

Wireframe allows destination + map/location summary **if needed**.

T08 MVP should show textual destination/location context.

Do not implement:

- geocoding,
- route planning,
- distance calculation,
- map pin claims,
- inferred pickup location.

A real map is not required for T08 completion.

---

# 25. Required States

## LOADING

- preserve hero/detail skeleton structure,
- preserve sticky CTA area shape,
- avoid full blank page + spinner only.

## READY

- render current LIVE package detail,
- render all source-backed sections,
- render session preview,
- CTA state derived from upcoming session data.

## NO_OPEN_SESSION

This is a READY substate:

- package content remains fully browsable,
- upcoming schedule area shows no available session,
- sticky CTA disabled,
- visible message `Belum ada jadwal tersedia`.

## NOT_FOUND

For unknown/non-LIVE package id:

Suggested copy:

```text
Experience tidak ditemukan.
```

Supporting:

```text
Experience ini mungkin sudah tidak tersedia atau tautannya tidak valid.
```

CTA:

```text
Kembali ke Explore
→ /explore
```

Do not fallback to another package.

## ERROR

Suggested copy:

```text
Detail experience belum bisa dimuat.
```

Supporting:

```text
Coba lagi tanpa kehilangan halaman yang sedang kamu buka.
```

CTA:

```text
Coba lagi
```

Retry must preserve current `packageId`.

---

# 26. Visual Direction

Use the Traveler visual language established by Issue #20 and reused by T07.

Before final T08 UI completion:

**INVOKE TASTE SKILL.**

T08 visual target:

- image-led travel detail,
- strong hero payoff,
- editorial but scannable information,
- trustworthy marketplace detail,
- clear section rhythm,
- sticky booking progression CTA.

Avoid:

- SaaS dashboard layout,
- one giant white card containing the whole page,
- every subsection rendered as identical card,
- giant walls of text,
- excessive pills,
- fake statistics,
- unrelated gradients/glows,
- final-payment styling on a pre-session screen.

Use hierarchy through:

- hero visual,
- typography scale,
- section spacing,
- tonal surface shifts,
- dividers,
- compact trust/status treatment.

Do not redesign Login/Consent/Quiz/Recommendation/Home/Explore in this issue.

---

# 27. Responsive Contract

Primary viewport:

```text
390px
```

Desktop smoke:

```text
1440px
```

## Mobile

- hero visual should feel substantial,
- content gutter around 16px unless intentional edge-to-edge hero,
- section reading order remains clear,
- sticky `Pilih Jadwal` sits above bottom nav/safe area,
- no horizontal page overflow,
- session previews remain tappable/readable,
- touch targets >=44px where appropriate.

## Desktop

- detail content should not become a tiny mobile card floating in empty space,
- detail pages may use ~960–1200px intentional content width,
- hero/details can use composed two-column layouts where helpful,
- sticky/side CTA panel is acceptable if it preserves the same primary action,
- do not turn Traveler detail into a partner/admin dashboard.

---

# 28. Accessibility

Required:

- one main page landmark from existing Traveler shell,
- semantic heading hierarchy,
- hero illustration alt/role semantics accurate,
- verification badge explanation accessible by keyboard,
- guide status understandable without color alone,
- itinerary represented semantically,
- included/excluded lists represented as lists,
- session status conveyed by text,
- disabled CTA state explained with text,
- visible focus,
- touch targets >=44px where appropriate,
- sticky CTA must not cover content,
- reduced-motion support,
- error/not-found recovery actions keyboard accessible.

---

# 29. Out of Scope

T08 does **not** implement:

- T09 full Session Selection,
- participant selection,
- atomic capacity reservation,
- checkout creation,
- pending-payment resolution,
- payment,
- contact verification,
- real geocoding/map routing,
- transport planning,
- favorite persistence,
- production review system,
- package editing/versioning UI,
- admin approval,
- EO dashboard,
- production backend/API,
- deployment.

---

# 30. Required Tests

At minimum cover:

1. known LIVE package resolves to READY detail,
2. unknown package id → NOT_FOUND,
3. non-LIVE package cannot render as traveler-ready detail,
4. detail adapter reuses centralized package catalog rather than duplicated base fields,
5. all current LIVE catalog packages used by Explore resolve to detail data,
6. starting price uses package traveler-facing `pricePerPerson`,
7. destination verification BASIC label is correct,
8. destination verification PLUS label is correct when fixture uses PLUS,
9. trust copy does not present government/external certification,
10. guide status is separate from destination verification,
11. itinerary order is deterministic,
12. no transport claim is introduced by default fixture,
13. no cancellation/refund percentages/deadlines are fabricated,
14. upcoming session previews are chronologically ordered,
15. OPEN session enables `Pilih Jadwal`,
16. `Pilih Jadwal` routes to `/packages/:packageId/sessions`,
17. no OPEN session disables CTA and shows `Belum ada jadwal tersedia`,
18. FULL/CLOSED session does not make CTA selectable by itself,
19. remaining slots are shown only when preview data explicitly provides reliable value,
20. T08 CTA does not create/reserve booking state,
21. package detail remains browsable even if traveler has pending-payment state elsewhere,
22. generic Explore entry does not fabricate personalized match explanation,
23. explicit recommendation reasons, if passed, are reused without numeric percentage,
24. NOT_FOUND CTA routes `/explore`,
25. ERROR retry preserves `packageId`,
26. loading renders stable skeleton structure,
27. Package Detail does not create nested `<main>` inside Traveler shell,
28. mobile sticky CTA does not replace/remove the existing four-tab Traveler navigation,
29. no fake review/booking count is rendered,
30. no session-selection/checkout logic is implemented inside T08.

---

# 31. MVP Acceptance Summary

T08 is complete when:

- `/packages/:packageId` replaces current placeholder,
- screen is protected by existing completed-Traveler architecture,
- only current LIVE package detail is traveler-visible,
- existing centralized package catalog/illustrations are reused,
- richer detail content is centralized in a dedicated adapter/fixture boundary,
- hero/title/price/trust/destination/EO/itinerary/include-exclude/safety/policy/session/review-preview hierarchy is present,
- Package and Session semantics remain separate,
- session preview drives only the availability state of `Pilih Jadwal`,
- `Pilih Jadwal` routes to T09 placeholder and does not reserve capacity,
- no open session produces a clear disabled state,
- cancellation/refund numbers are not invented,
- transport is not inferred,
- verification is not overstated as external certification,
- LOADING/READY/NOT_FOUND/ERROR are implemented,
- 390px and 1440px browser smoke passes,
- existing Traveler flows remain green,
- Taste Skill is invoked for a T08-specific final polish pass.
