# JedaIn — F5 Post-Rehearsal Experience Improvement Plan

**Status:** IMPLEMENTED — F5.1–F5.4 MERGED / FINAL REHEARSAL NEXT  
**Date:** 27 September 2026  
**Source:** Internal team review + direct live prototype usage after F4.3 and Final Live-User UX Cleanup  
**Current app feature baseline:** `4ebde672a5be0d33c567aba4ad2a66d0af436056`  
**Current main incl. synchronized docs:** pending this documentation sync  
**Quality baseline:** 50 test suites / 696 tests PASS; format/lint/typecheck/build PASS; Cloudflare Pages PASS

---

## 1. Why F5 Exists

F1–F4 focused on:

- demo reliability,
- domain integrity,
- cross-role consistency,
- semantic truthfulness,
- trust clarity,
- final competition hardening.

The latest internal review found a different class of issue:

> The main flows already work, but several screens still feel too dense, too textual, too box-heavy, or too utilitarian for a human buyer/partner.

Therefore F5 is **not a major feature-expansion phase**.

F5 exists to improve:

1. **Traveler buying clarity** — make package/trip information easier to scan and act on.
2. **EO decision quality** — make destination selection, builder wording, and session setup easier to understand.
3. **Destination media quality** — make destination context more visual and reusable across roles.
4. **Demand-to-pricing usefulness** — demonstrate how simulated Traveler preference data can inform, but not dictate, EO pricing.

F5 must remain proportional to a competition prototype.

---

# 2. Decision Rules

Every new request from the meeting must be classified before coding.

| Classification | Meaning | Action |
|---|---|---|
| **DEVELOP** | Clear user/partner friction that affects understanding or task completion | May enter F5 |
| **UX / COPY POLISH** | Function already exists, but hierarchy, wording, or visual presentation is weak | Fix in focused batch |
| **OPEN / HOLD** | Requires new business/governance rule or meeting note is ambiguous | Do not code until team locks decision |
| **OPTIONAL / ASSET-DEPENDENT** | Valuable only if truthful source media/data exists | Implement only after higher-priority work |
| **NO CODE** | Production infrastructure or speculative feature not needed for prototype | Keep out of F5 |

### Non-negotiable principle

F5 does **not** mean “add as many features as possible.”

A change is justified only when it helps Traveler, EO, or Mitra:

- understand the page,
- make a decision,
- complete the current flow,
- trust the information,
- or see the role relationship more clearly.

---

# 3. Consolidated Findings from the Team Review

## 3.1 Traveler / Buyer

| Finding | Interpretation | Decision | Batch |
|---|---|---|---|
| Package Detail needs a clearer page context / page title | User should immediately know they are on an experience/package detail page | **DEVELOP** | F5.1 |
| Package Detail is too text-heavy | Existing information is useful but presented with too much reading burden | **DEVELOP** | F5.1 |
| Package Detail feels too dense | Too many sections/cards compete for attention | **DEVELOP** | F5.1 |
| Too many boxes | Visual hierarchy depends too much on cards/containers | **UX POLISH** | F5.1 |
| Use dropdown/accordion for secondary information | Progressive disclosure can reduce page length without deleting truthful information | **DEVELOP** | F5.1 |
| “Detail paket di enakim untuk buyer” | Reorder around buyer decision: image, title, trust, price, highlights, schedule CTA first | **DEVELOP** | F5.1 |
| EO identity on Traveler detail should be less dominant / possibly anonymous | Meeting note conflicts with later request to show organizer rating | **OPEN** | F5.1 partial |
| Show organizer rating on Traveler package detail | Existing EO/Guide review store can support actual post-trip aggregate when available | **DEVELOP**, subject to organizer identity decision | F5.1 |
| Trip Detail is too long | Important trip summary and secondary operational detail should be separated | **DEVELOP** | F5.1 |
| Add “Lihat Detail” for secondary trip information | Contact EO, payment detail, access, policy etc. should not dominate initial view | **DEVELOP** | F5.1 |
| Improve Trip page title; do not repeat JedaIn logo unnecessarily | Shell provides brand; page itself should provide context | **UX POLISH** | F5.1 |
| Completed Trip should prioritize rating CTA | Post-trip review is the primary next action after completion | **DEVELOP** | F5.1 |

---

## 3.2 EO / Travel Organizer

| Finding | Interpretation | Decision | Batch |
|---|---|---|---|
| Add location filter when choosing destination in package creation | EO needs to narrow destinations by existing city/province/location data | **DEVELOP** | F5.2 |
| Destination detail must be clearer before EO chooses it | Dedicated route already exists; improve it as a decision page rather than create a new system | **DEVELOP** | F5.2 |
| “Ringkasan Nilai & Janji Pengalaman” is unclear | Builder field label/helper is too abstract | **COPY / UX POLISH** | F5.2 |
| EO Session package selection should be more visual | Existing select is functional but utilitarian | **UX POLISH** | F5.2 |
| Pricing should show a system reference based on demand preferences | Strong fit with JedaIn core loop if clearly labeled as simulated reference, not optimal pricing | **DEVELOP** | F5.3 |
| Destination guide cost should appear in EO pricing | Changes canonical pricing formula and cost ownership | **OPEN / HOLD** | Decision needed |
| Destination should set guide price | Requires new destination data model and business rule | **OPEN / HOLD** | Decision needed |

---

## 3.3 Mitra Destinasi

| Finding | Interpretation | Decision | Batch |
|---|---|---|---|
| Remove “Deskripsi Ketenangan Kawasan” wording | Current label is overly artificial; destination description can use neutral wording | **COPY POLISH** | F5.2 |
| Destination verification should require guide availability | Team decision locked on 27 Sep: local-guide readiness is part of destination verification, not a second independent badge | **RESOLVED / IMPLEMENTED** | PR #105 |
| Destination gallery should exist | Destination currently has only a single optional image path; richer visual source would help EO decision-making | **DEVELOP** | F5.4 |
| EO should be able to choose destination image or add own package image | Fits package creation if provenance remains truthful | **DEVELOP** | F5.4 |
| 360° destination view | Useful visual demo only if truthful panorama/360 asset exists | **OPTIONAL / ASSET-DEPENDENT** | F5.4 optional |

---

## 3.4 Partner Entry / Registration

Meeting note: **“halaman daftar mitra”**.

This note is not specific enough to create a coding task safely.

Before implementation, the team must identify the exact issue:

- visual density?
- role choice?
- copy?
- application fields?
- login vs registration confusion?
- duplicated `/partner` vs `/partner/login` behavior?

**Status: OPEN — audit first, no code from this note alone.**

---

# 4. Open Decisions That Must NOT Be Invented by the Coding Agent

## OD-01 — Organizer identity on Traveler Package Detail

Two meeting requests currently coexist:

1. make EO anonymous / reduce EO identity prominence;
2. add organizer rating.

These are not automatically contradictory, but the exact disclosure model must be chosen.

Possible models for team decision:

### Option A — Named compact organizer

Example:

```text
Penyelenggara
Jeda Alam Nusantara
★ 4.8 · 24 ulasan pascatrip
```

Pros:

- strong trust transparency,
- rating has a clear owner.

### Option B — Anonymized organizer trust block

Example:

```text
Penyelenggara Terverifikasi
★ 4.8 · 24 ulasan pascatrip
```

Pros:

- EO identity is less dominant.

Cons:

- weaker transparency,
- rating owner is less explicit.

**Decision required before finalizing organizer presentation.**

---

## OD-02 — Destination verification requires a local guide — RESOLVED

**Decision locked on 27 September 2026.**

Canonical rule after PR #105:

- a destination cannot become verified unless a local guide is available and readiness evidence is present;
- initial successful verification produces **Terverifikasi Dasar (BASIC)**;
- `PLUS` remains a later trust-lifecycle level;
- local-guide readiness is part of destination verification and must not be presented as a second independent trust badge;
- a no-guide destination may remain as an internal/rejected/remediation record, but it is not an active verified destination and is not EO-selectable;
- `dest_hutan_trawas` is therefore REJECTED / INACTIVE in the canonical prototype baseline;
- EO guide certification remains optional; both Concept-Only and Certified EO see the same verified-destination catalog;
- package `guideSource` may still distinguish whether trip pemanduan comes from the destination or a certified EO where the existing package model supports it.

Implementation:

- Admin has one destination approval action;
- approval fails when local-guide readiness/evidence is missing;
- Destination, EO, and Admin trust surfaces use human labels such as `Terverifikasi Dasar`, `Terverifikasi Plus`, or `Belum Terverifikasi`;
- stacked labels such as `BASIC + Guide Ready` are removed.

**Status: RESOLVED / IMPLEMENTED — PR #105.**

---
## OD-03 — Destination guide fee

Current canonical package pricing:

```text
Customer Package Price = Destination Base Cost + EO Margin
```

Traveler Service Fee:

```text
Rp7.500 / booking
```

Platform Commission:

```text
10% GMV
```

Adding a separate guide fee raises unanswered questions:

- Is guide fee per person or per session?
- Is it mandatory?
- Does it apply only when `guideSource = DESTINATION`?
- Is it already included in `baseCostPerPerson`?
- What happens when `guideSource = EO`?
- Is the fee visible to Traveler or only internal to EO pricing?
- Does it change commission basis?

**Status: HOLD. No schema or pricing code until the team locks the rule.**

---

# 5. F5.1 — Traveler Buyer Experience

## Goal

Make Package Detail and Trip Detail easier to understand, scan, and act on without deleting useful information or changing business logic.

## 5.1.1 Package Detail — Buyer-First Hierarchy

### Problem

Current page contains many truthful sections, but the reading burden is high.

### Target first-screen hierarchy

```text
Page title / context
↓
Gallery / visual
↓
Package title + location
↓
Trust / rating
↓
Price + duration
↓
Key highlights
↓
Primary CTA: Pilih Jadwal
```

Secondary information should use progressive disclosure where appropriate.

Candidate accordion/disclosure groups:

- Yang kamu dapatkan
- Rencana perjalanan
- Persiapan & keamanan
- Titik kumpul & akses
- Kebijakan pembatalan
- Tentang penyelenggara

### Acceptance

- user immediately knows this is Detail Experience / Package Detail;
- primary buyer information is visible without reading every section;
- no important source-backed information is deleted;
- no internal operational note leaks to Traveler;
- no fake data is introduced;
- sticky `Pilih Jadwal` behavior remains;
- mobile page length and visual density are materially reduced;
- nested “box inside box” presentation is reduced;
- sample-vs-post-trip rating provenance remains truthful.

---

## 5.1.2 Organizer Trust Block

### Goal

Make organizer trust information compact and useful.

### Acceptance

- organizer rating, if displayed, must be derived from actual EO/Guide post-trip review records;
- no seeded fake organizer trust rating;
- zero-review state must say no rating / no reviews yet;
- exact organizer identity disclosure waits for OD-01;
- guide capability must not be described as individual assignment.

---

## 5.1.3 Trip Detail — Summary First

### Target hierarchy for active trip

```text
Detail Perjalanan
↓
Trip status
Package / destination
Date & time
Meeting point / key access info
↓
Lihat Detail Perjalanan
```

Secondary disclosure may contain:

- organizer contact,
- full itinerary,
- payment breakdown,
- access notes,
- cancellation/refund information,
- other secondary trip facts.

### Target hierarchy for completed trip

```text
Perjalanan Selesai
↓
Package / destination
Trip date
↓
PRIMARY NEXT ACTION
Nilai Destinasi
Nilai Penyelenggara
↓
Lihat Detail Perjalanan
```

### Acceptance

- review CTA becomes visually prioritized for `COMPLETED`;
- Destination and EO/Guide review remain separate;
- completed review eligibility remains booking-owned + COMPLETED;
- Guest Demo remains allowed to demonstrate review flow;
- active trip operational facts remain accessible;
- no route explosion is required unless a dedicated route clearly improves UX;
- progressive disclosure is preferred over duplicating data.

---

## F5.1 Non-goals

Do not change:

- checkout pricing,
- payment logic,
- booking status model,
- review eligibility,
- session selection,
- organizer authority,
- destination trust model.

---

## 5.1.4 Implementation Status — MERGED

F5.1 was implemented and merged through PR #97 on 27 September 2026.

Delivered behavior:

- Package Detail now has explicit `Detail Experience` context and a buyer-first hierarchy.
- Package identity, truthful trust/rating provenance, price, highlights, and upcoming sessions remain primary.
- Secondary destination, organizer, itinerary, inclusion/exclusion, preparation/access, cancellation, and review information use progressive disclosure.
- Organizer rating is derived only from actual EO/Guide post-trip review records; zero-review state remains truthful.
- Organizer identity remains secondary; OD-01 (named vs anonymous policy) is still open and was not silently resolved.
- Trip Detail now uses `Detail Perjalanan` / `Perjalanan Selesai` context.
- Date and meeting point remain primary trip facts.
- Booking/payment detail, EO contact, access, activities, itinerary, inclusions/exclusions, safety, and cancellation are grouped under one `Lihat Detail Perjalanan` disclosure.
- Completed trips prioritize separate Destination and EO/Guide review actions before secondary trip details.
- Guest Demo review, review eligibility, booking/payment semantics, pricing, session rules, and destination governance remain unchanged.

Verification after merge:

- 48 test files / 683 tests PASS,
- format check PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

F5.1 is closed. F5.2 is the next implementation batch.

---

# 6. F5.2 — EO Destination Discovery & Builder Clarity

## Goal

Help EO choose a destination and prepare a package with less cognitive friction.

---

## 6.1 Destination selection by location

Use existing destination fields only:

- `city`,
- `province`,
- `locationLabel`,
- existing eligible destination catalog.

Possible controls:

- location search,
- city/location filter,
- “Semua Lokasi” fallback.

### Acceptance

- only existing EO-eligible destinations remain selectable;
- filter does not bypass `guideReady` eligibility;
- no geospatial/radius engine;
- no map requirement;
- Builder query/deep-link behavior remains safe.

---

## 6.2 EO Destination Detail as a decision page

The route already exists:

```text
/partner/eo/destinations/:destinationId
```

Do **not** create a duplicate detail architecture.

Strengthen the existing page to surface:

1. visual/gallery if available,
2. destination name + location,
3. verification level,
4. guide readiness,
5. general destination capacity,
6. base cost,
7. base-cost inclusion/exclusion,
8. available activities,
9. facilities,
10. operational notes,
11. CTA to use/select the destination when eligible.

### Acceptance

- `guideReady=false` destination remains informational/read-only;
- “Kapasitas Umum Destinasi” remains venue context, not session quota;
- operational notes remain descriptive, not approval/safety certification;
- missing fields are not fabricated.

---

## 6.3 Builder wording cleanup

Current concept such as “Ringkasan Nilai & Janji Pengalaman” must be rewritten into user language.

Recommended direction:

**Field label:** `Ringkasan Pengalaman`

**Helper example:**

> Jelaskan dalam 1–2 kalimat pengalaman utama yang akan didapat Traveler. Hindari mengulang itinerary.

Alternative wording can be used if clearer, but the meaning must remain the Traveler-facing value proposition.

### Acceptance

- wording is understandable without product/marketing jargon;
- existing `valueProposition` data semantics remain;
- F4.3 rule remains: simulated unmet-demand description is not auto-copied into Traveler-facing summary.

---

## 6.4 EO Sessions package selector visual polish

Current `<select>` is functional but low-context.

Target:

- selectable compact package rows/cards,
- package visual,
- title,
- destination,
- lifecycle status (`APPROVED` / `LIVE`),
- selected state.

### Acceptance

- same underlying package/session logic;
- only `APPROVED` / `LIVE` remain eligible to create future Session;
- F4.2 temporal guards remain unchanged;
- no new package lifecycle.

---

## 6.5 Destination Profile wording

Replace artificial wording such as:

```text
Deskripsi Ketenangan Kawasan
```

with a neutral destination description label, e.g.:

```text
Tentang Destinasi
```

No destination data needs to be deleted.

---

## 6.6 Implementation Status — MERGED

F5.2 was implemented and merged through PR #99 on 27 September 2026.

Delivered behavior:

- EO Package Builder now exposes explicit location filtering using existing city/province data while preserving authoritative destination eligibility.
- Builder destination search and verification filters remain available.
- `Lihat Detail Destinasi` now reuses the dedicated `/partner/eo/destinations/:destinationId` decision page instead of duplicating detail in a modal.
- Builder draft context and explicit destination choice survive the detail-page round trip.
- EO Destination Detail now surfaces verification, guide readiness, Kapasitas Umum Destinasi, base cost, cost scope, activities, facilities, and descriptive operational notes.
- `guideReady=false` destinations remain informational/read-only and remain excluded from EO package selection.
- Builder wording is simplified to `Ringkasan Pengalaman` while retaining the existing `valueProposition` data semantics and F4.3 simulated-insight isolation.
- EO Sessions package selection is now visual, showing package image, title, destination, lifecycle status, selected state, and new-session eligibility.
- Only `APPROVED` / `LIVE` selected packages enable creation of a new Session; existing F4.2 temporal/store guards remain unchanged.
- Mitra Destination Profile now uses neutral `Tentang Destinasi` wording instead of `Deskripsi Ketenangan Kawasan`.

Verification after merge:

- 48 test files / 688 tests PASS,
- format check PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

F5.2 is closed. F5.3 is also merged; F5.4 is the next implementation batch.

---

# 7. F5.3 — Demand-Assisted Pricing Reference

## Goal

Demonstrate the value of JedaIn Demand Insight inside EO pricing without pretending the prototype has production price optimization.

## Concept

Add a non-authoritative pricing reference surface.

Example:

```text
Referensi Harga dari Sinyal Traveler

Preferensi budget pada insight ini:
Rp100k–Rp200k    41% respons simulasi
Rp200k–Rp300k    35% respons simulasi
> Rp300k          24% respons simulasi

Referensi rentang: Rp180.000–Rp260.000 / orang
```

Possible action:

```text
Lihat Referensi Harga
```

or

```text
Gunakan sebagai Referensi
```

If a value can be inserted, EO must remain in control and be able to edit it.

## Truthfulness rules

Must say:

- data simulasi prototype;
- respons simulasi;
- reference / directional signal.

Must **not** say:

- harga optimal,
- recommended by AI,
- guaranteed conversion,
- market-clearing price,
- forecast,
- real market validation.

## Data source

Use existing simulated Demand Insight distributions/context only.

Do not invent new statistical precision unless data exists in the prototype fixture.

## Acceptance

- pricing reference is optional;
- EO can ignore it;
- no automatic price lock;
- customer-price formula remains current canonical formula until OD-03 is resolved;
- no change to Rp7.500 service fee;
- no change to 10% GMV commission.

## 7.1 Implementation Status — MERGED

F5.3 was implemented and merged through PR #101 on 27 September 2026.

Delivered behavior:

- EO Package Builder Step 4 now provides an optional `Referensi Harga dari Sinyal Traveler` disclosure.
- The reference reads the existing canonical simulated budget distribution from `mockInsightStore`; no new market data or statistical precision is fabricated.
- The current canonical all-time prototype distribution is shown as:
  - Di bawah Rp200.000 — 22% / 224 respons simulasi,
  - Rp200.000–Rp300.000 — 48% / 490 respons simulasi,
  - Rp300.000–Rp500.000 — 21% / 214 respons simulasi,
  - Di atas Rp500.000 — 9% / 92 respons simulasi.
- The most-selected budget range is highlighted only as a directional prototype signal.
- When a Demand Insight is selected, its existing `preferredBudgetRange` is shown as context; the Builder does not generate a new “optimal” price.
- Copy explicitly states `Data simulasi prototype`, `respons simulasi`, and that the reference is optional.
- Opening or reading the reference never mutates EO Margin or Customer Price automatically.
- Canonical pricing remains `Destination Base Cost + EO Margin`; no guide fee, Traveler service-fee change, or commission change was introduced.

Verification after merge:

- 49 test files / 692 tests PASS,
- format check PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

F5.3 is closed. F5.4 Destination Media is also merged. 360° remains deferred and is not part of the implemented F5 baseline.

---

# 8. F5.4 — Destination Media & Package Visual Choice

## Goal

Make destinations easier to evaluate visually and allow EO to build a package using truthful media.

## 8.1 Destination gallery model

Potential evolution:

```ts
imageUrl?: string
```

toward a small prototype gallery representation.

Exact schema must be designed before implementation, but likely needs:

- media id,
- source/type,
- display URL,
- optional label/caption,
- prototype/source provenance.

### Roles

**Mitra Destinasi**

- can provide/manage destination visuals within prototype boundaries.

**EO**

- can choose an available destination visual for package presentation;
- or provide own package image through existing package image path.

**Traveler**

- sees the package visual/gallery with truthful provenance.

## Acceptance

- media source is clear;
- no prototype illustration is called an actual destination photo;
- EO selecting destination media does not mutate destination verification/trust;
- package media choice does not grant EO edit authority over destination data;
- existing fallback illustration remains safe when real/source media is unavailable.

---

## 8.2 360° destination view

Status: **OPTIONAL / ASSET-DEPENDENT**.

Only implement when there is a suitable panorama/360 asset or a clearly labeled prototype representation.

Required label if simulated:

```text
Preview 360° — Prototype
```

Do not present a normal static illustration as a real 360° capture.

This item must not delay F5.1–F5.3.


## 8.3 Implementation Status — MERGED

F5.4 was implemented and merged through PR #102 on 27 September 2026.

Delivered behavior:

- canonical `DestinationRecord` now supports a small `mediaGallery` with explicit media provenance;
- seeded galleries reuse existing JedaIn prototype-safe illustration assets and label them as `Visual prototype`;
- Mitra Destination Profile shows the destination gallery with explicit copy that it is not documentation of current real-world conditions;
- EO Destination Detail shows the same gallery as decision context;
- EO Package Builder can select one destination visual as the package cover while preserving the existing EO-owned image upload path;
- selecting media does not mutate destination verification, authority, or canonical destination content;
- no production media backend, CDN, upload service, or cross-role media authority was added;
- 360° was intentionally not implemented and remains deferred / asset-dependent.

Verification after merge:

- 50 test files / 696 tests PASS,
- format check PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

F5.4 is closed. The implemented F5 development sequence is complete; next action is final rehearsal and regression-only follow-up if evidence requires it.

---

# 9. Recommended Delivery Order

```text
F5.1 Traveler Buyer Experience
        ↓
AUDIT + TEST + LIVE CHECK
        ↓
F5.2 EO Destination Discovery & Builder Clarity
        ↓
AUDIT + TEST + LIVE CHECK
        ↓
LOCK OPEN BUSINESS DECISIONS IF READY
        ↓
F5.3 Demand-Assisted Pricing Reference
        ↓
AUDIT + TEST
        ↓
F5.4 Destination Media
        ↓
FINAL REHEARSAL
```

Why this order:

1. Traveler buyer UX has the most direct impact on comprehension and conversion story.
2. EO destination selection affects package creation quality and should be fixed before pricing/media expansion.
3. Demand-assisted pricing is useful but depends on Builder clarity.
4. Gallery/360 media is valuable but larger and more asset-dependent.

---

# 10. Batch Gates

Every batch must follow:

```text
Develop
→ Audit actual diff
→ Run full quality gate
→ Validate business/semantic guards
→ Merge
→ Sync JedaIn eval + PRD if accepted
→ Live sanity check
→ Freeze batch
```

Required quality commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Test count may increase.
Existing regression coverage must not be reduced without explicit justification.

---

# 11. Business & Semantic Guards That Remain Locked

Unless an OPEN decision is explicitly resolved, F5 must preserve:

## Pricing

```text
Package Price = Destination Base Cost + EO Margin
Traveler Service Fee = Rp7.500 / booking
Platform Commission = 10% GMV
```

Commission is not an extra Traveler line item.

## Capacity

- Kapasitas Umum Destinasi = venue context.
- Kuota Sesi EO = session quota.
- Peserta Terkonfirmasi = booking-derived participants.
- Selisih Operasional = neutral difference, not sellable slots.

## Guide semantics

- `guideReady` = destination capability/readiness, not person assignment.
- `guideSource` = source of guide, not total operational responsibility.
- EO/destination guide status must not be described as assignment unless assignment data exists.

## Reviews

- Destination review and EO/Guide review remain separate.
- Runtime review requires owned completed booking.
- Guest Demo remains a valid prototype Traveler identity.
- No fake organizer rating.

## Lifecycle

- Admin approval does not auto-publish.
- `APPROVED != LIVE`.
- EO owns Publish.
- APPROVED/LIVE may prepare future Sessions.
- Past Session cannot be reopened OPEN.

## Role authority

- Mitra cannot approve/reject EO package/session.
- EO cannot mutate Admin verification decision.
- Traveler does not see internal operational note.
- Partner surfaces do not need Traveler PII.

---

# 12. Explicit Non-Goals for F5

Do not use these meeting findings as justification to build:

- production backend/database,
- cross-tab shared-state architecture,
- real payment/refund/settlement,
- production KYC,
- guide staffing/roster engine,
- PMS/inventory engine,
- real-time dynamic pricing,
- ML price optimization,
- route planning/navigation engine,
- large chat/notification system,
- broad redesign of every page,
- new marketplace role,
- speculative analytics stack.

---

# 13. Definition of Done for F5

F5 is complete when the team can run the prototype and answer **yes** to these questions:

### Traveler

- Can a buyer understand the package quickly without reading a wall of text?
- Are primary decision facts visually prioritized?
- Can secondary detail still be accessed?
- Does a completed trip clearly prompt reviews?

### EO

- Can EO find a relevant destination by location?
- Can EO understand destination context before choosing it?
- Are Builder labels understandable without internal product jargon?
- Is choosing a package for Session management visually clear?
- Can demand preference data inform price thinking without being presented as “optimal price”?

### Mitra

- Is destination information neutral and clear?
- Can destination media support EO package creation without giving EO destination authority?
- Are guide/verification semantics still truthful?

### Cross-role

- Do all improvements preserve the core loop?

```text
Traveler Need
→ Recommendation
→ Demand Insight
→ EO Builds Experience
→ Admin Trust
→ LIVE
→ Booking
→ Trip
→ Review
```

---

# 14. Immediate Next Action

**Next action: final rehearsal / regression-only verification.**

F5.1–F5.4 are implemented and merged. Do not open another feature batch by default.

During final rehearsal:

1. run the current golden flow across Traveler → EO → Admin → Mitra;
2. verify the existing source-backed F5 surfaces rather than adding new capability;
3. patch only concrete regression, factual contradiction, or judge-critical P1 friction;
4. keep OD-01 open and OD-02 / OD-03 on hold unless the team explicitly locks those decisions;
5. keep 360° deferred unless a truthful suitable asset is provided;
6. after rehearsal, return to hard feature freeze if no blocker is found.

---

# 15. Planning Status Snapshot

| Batch / Decision | Status |
|---|---|
| F5.1 Traveler Buyer Experience | **MERGED — PR #97** |
| F5.2 EO Destination Discovery & Builder Clarity | **MERGED — PR #99** |
| F5.3 Demand-Assisted Pricing Reference | **MERGED — PR #101** |
| F5.4 Destination Media & Package Visual Choice | **MERGED — PR #102** |
| 360° destination view | **DEFERRED / ASSET-DEPENDENT** |
| OD-01 Organizer identity disclosure | **OPEN** |
| OD-02 Verification requires guide | **RESOLVED / MERGED — PR #105** |
| OD-03 Separate destination guide fee | **HOLD** |
| Partner registration-page issue | **OPEN — needs exact problem statement** |

**Planning conclusion:** F5.1–F5.4 are complete. Development returns to regression-only final rehearsal / hard feature freeze; broad feature expansion remains out of scope.
