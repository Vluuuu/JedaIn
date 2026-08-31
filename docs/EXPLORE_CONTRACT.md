# JedaIn — Traveler Explore Contract

**Version:** 1.0  
**Date:** 31 Agustus 2026  
**Status:** MVP Prototype Contract  
**Applies to:** T07 `/explore`

> Dokumen ini mengunci perilaku MVP untuk Traveler Explore / Search / Filter setelah Traveler Core visual consolidation selesai. Tujuannya adalah membuat discovery package LIVE yang deterministik, mudah didemokan, konsisten dengan Home, dan tidak mengarang ranking/transport/capacity rule baru.

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
> DESIGN_SYSTEM.md
> TRAVELER_VISUAL_DIRECTION.md
> issue implementation notes
> implementation
```

Jika higher source menandai sesuatu sebagai pending, aturan prototype di dokumen ini harus tetap replaceable dan tidak boleh diklaim sebagai business-final.

---

# 2. Purpose

Explore adalah surface untuk menjelajahi **seluruh Package `LIVE`** di luar recommendation utama.

Entry utama:

- bottom nav `Explore`,
- Search dari Home,
- Mood dari Home,
- Verified Destination dari Home,
- link Explore lain pada Traveler surface.

Explore tidak mengganti Recommendation Result dan tidak membuat recommendation engine kedua.

---

# 3. Access & Shell

Route:

```text
/explore
```

MVP menggunakan existing authenticated Traveler architecture:

- Traveler harus authenticated,
- onboarding harus `COMPLETED`,
- gunakan existing `OnboardingRouteGuard`,
- gunakan `TravelerAppShell`,
- bottom nav exactly `Home | Explore | My Trips | Profile`,
- `Explore` active di `/explore`.

Public landing boleh memiliki link menuju `/explore`, tetapi existing guard tetap menentukan redirect untuk user yang belum siap mengakses Traveler app. Tidak ada guest Explore khusus pada issue ini.

---

# 4. Data Source

Explore wajib reuse centralized fictional package catalog dari Recommendation feature.

Current source:

```text
MOCK_RECOMMENDATION_PACKAGES
```

Rules:

- candidate minimum `status = LIVE`,
- jangan duplicate package fixtures di JSX/Explore feature,
- jangan membuat production API contract palsu,
- package adalah Package, bukan Session,
- session capacity/status tidak dipakai untuk T07 filtering,
- package visuals reuse centralized prototype illustration strategy.

All current package/destination data remains fictional competition prototype data.

---

# 5. Explore View Model

Suggested adapter output:

```text
ExploreResult
- status: LOADING | READY | EMPTY | ERROR
- items[]
- resultCount
- activeQuery
- activeMood
- activeFilters
- activeSort
- availableDestinations[]
- availableDepartureAreas[]
```

Implementation may structure types differently as long as business behavior stays equivalent.

Filter/search/sort logic belongs to a feature engine/adapter boundary, not visual components.

---

# 6. URL State Contract

Explore state should be representable through query parameters so Home links and browser navigation remain deterministic.

Supported MVP params:

```text
query=
mood=
budget=
duration=
departure=
destination=
sort=
```

Canonical prototype values:

```text
mood:
  tenang
  alam
  recharge
  eksplorasi
  refleksi

budget:
  up_to_200k
  200_300k
  300_500k
  above_500k

duration:
  half_day
  full_day
  two_d_one_n
  three_d_two_n_plus

departure:
  malang
  surabaya

sort:
  popular
  rating
  price_low
```

`destination` uses the URL-encoded destination display name from the current LIVE catalog.

Rules:

- invalid/unknown values are ignored safely,
- invalid params must not crash the page,
- UI reflects valid URL state on initial render,
- Home-generated `query`, `mood`, and `destination` params must work,
- changing applied filters should update the URL,
- browser back/forward should restore the represented Explore state.

Do not encode internal QuizDraft as hidden URL state.

---

# 7. Search Contract

Search is lightweight deterministic MVP search, not AI/fuzzy/vector search.

Normalize query by:

1. trim,
2. lowercase,
3. collapse repeated whitespace.

Empty/whitespace query means no text constraint.

A package matches search when normalized query is contained in at least one human-facing searchable field:

- package title,
- short summary,
- destination name,
- location label,
- human-facing labels mapped from `experienceIntents[]`,
- human-facing labels mapped from `activityTags[]`.

Reuse centralized Quiz option labels where possible. Never expose enum strings like `NATURE_SCENERY` to users.

Search does not alter or retrain Recommendation semantics.

---

# 8. Mood Preset Contract

Mood is an explicit discovery preset coming from Home. It is **not** a new permanent business enum and does not add numerical weights.

MVP mapping:

```text
tenang
  -> RECHARGE OR REFLECTION OR MINDFULNESS_RELAXATION

alam
  -> NATURE OR NATURE_SCENERY

recharge
  -> RECHARGE

eksplorasi
  -> NOVELTY OR ACTIVE OR LIGHT_EXPLORATION OR OUTDOOR_ACTIVE

refleksi
  -> REFLECTION OR MINDFULNESS_RELAXATION
```

A package satisfies an active mood if it matches **at least one** mapped existing intent/activity signal.

Only one mood preset is active at a time in MVP.

Mood matching:

- is a filter/preset,
- does not produce a score,
- does not show match percentage,
- does not mutate the traveler QuizDraft.

Show active mood as a removable user-facing chip/context label.

---

# 9. Minimum Filters

Higher sources require:

- Budget,
- Duration,
- Departure/Location,
- Destination.

MVP uses one selected value per filter category to keep the prototype clear and deterministic.

Different categories combine using **AND**.

Example:

```text
query=alam
AND duration=full_day
AND departure=malang
```

A package must satisfy every active constraint.

---

# 10. Budget Filter

Budget filter is a catalog browsing range, separate from Recommendation's spending-comfort ceiling semantics.

MVP buckets:

```text
up_to_200k
  pricePerPerson <= 200000

200_300k
  pricePerPerson > 200000 AND <= 300000

300_500k
  pricePerPerson > 300000 AND <= 500000

above_500k
  pricePerPerson > 500000
```

Suggested user-facing labels:

```text
Sampai Rp200 ribu
Rp200–300 ribu
Rp300–500 ribu
Di atas Rp500 ribu
```

Do not infer transport inclusion from package price.

---

# 11. Duration Filter

Duration filter is exact catalog filtering.

Mappings:

```text
half_day -> HALF_DAY
full_day -> FULL_DAY
two_d_one_n -> TWO_D_ONE_N
three_d_two_n_plus -> THREE_D_TWO_N_PLUS
```

Unlike Recommendation feasibility logic, Explore duration filter does **not** automatically include shorter durations.

User explicitly selecting `1 hari` means show packages with `FULL_DAY`.

---

# 12. Departure Filter

Departure filter means **starting-area relevance only**.

MVP options are derived from current package metadata:

```text
Malang -> MALANG
Surabaya -> SURABAYA
```

Match rule:

```text
selected departure in package.departureAreas[]
```

This does NOT mean:

- pickup,
- shuttle,
- transport included,
- transport free,
- distance calculation,
- package physical location equals departure area.

Do not geocode `OTHER` in T07.

---

# 13. Destination Filter

Destination options are derived by de-duplicating `destinationName` from current LIVE package catalog.

Match is exact destination identity/name for MVP.

Do not invent production destination IDs/API if the current mock catalog does not have them.

A Home destination link such as:

```text
/explore?destination=...
```

must pre-apply the correct destination filter.

---

# 14. Hidden Personalization Rule

Explore must **not silently filter out packages based on QuizDraft**.

Default Explore with no explicit query/mood/filter shows all LIVE packages.

Quiz/recommendation personalization remains visible elsewhere in the product. T07 is user-controlled catalog discovery.

Do not create hidden preference filters or a second recommendation algorithm.

---

# 15. Sort Contract

Minimum sort options for MVP:

```text
POPULAR
RATING
PRICE_LOW
```

User-facing labels:

```text
Terpopuler
Rating tertinggi
Harga terendah
```

Default:

```text
POPULAR
```

Deterministic ordering:

## POPULAR

1. `popularityRank` descending,
2. `rating` descending,
3. title ascending final tie-break.

## RATING

1. `rating` descending,
2. `popularityRank` descending,
3. title ascending.

## PRICE_LOW

1. `pricePerPerson` ascending,
2. `rating` descending,
3. title ascending.

Do not invent booking counts or trend percentages to justify popularity.

---

# 16. Filter UI Behavior

Required top area:

1. Search
2. Filter trigger / quick filter controls
3. Sort
4. active filter/mood context
5. reliable result count

## Mobile

Use a filter sheet/drawer for the four minimum filters.

Recommended interaction:

- opening sheet copies current applied filters into draft filter state,
- changing values inside sheet does not mutate applied results until `Terapkan`,
- closing/cancelling without apply discards sheet-only draft changes,
- `Reset` clears draft filter values,
- `Terapkan` commits filters and URL state.

Search, active mood, and sort remain accessible outside the filter sheet.

## Desktop

Filters may be inline triggers/popovers/controls while preserving the same applied-state semantics.

Active filters must be clearly removable individually.

---

# 17. Reset Behavior

`Reset filter` clears all active Explore constraints for a guaranteed recovery to the default catalog:

- search query,
- mood preset,
- budget,
- duration,
- departure,
- destination,
- sort returns to `POPULAR`.

This is prototype behavior so EMPTY always has a clear path back to all LIVE packages.

---

# 18. Package Result Card

Minimum visible information from higher sources:

- package visual/illustration,
- package title,
- destination,
- location where useful,
- price per person,
- duration,
- rating,
- verification badge.

Tap/click:

```text
/packages/:packageId
```

Optional concise summary is allowed if it does not make cards text-heavy.

Do NOT show:

- numeric match percentage,
- AI confidence,
- fake booking count,
- live remaining capacity,
- session availability claim,
- transport claim.

Capacity belongs to Session and will be handled later.

---

# 19. Result Count

Because the MVP adapter has deterministic local/mock data, post-filter count is reliable.

Show concise count such as:

```text
5 experience
2 experience ditemukan
```

Do not label the count as real market inventory beyond the prototype catalog.

---

# 20. Required States

## LOADING

- preserve top search/filter structure,
- use package-card skeletons,
- avoid full blank page/spinner only.

## READY

- show controls,
- active filter context,
- result count,
- package results.

## EMPTY

Locked direction:

```text
Belum ada experience yang cocok dengan pencarian atau filter ini.
```

Primary recovery:

```text
Reset filter
```

## ERROR

Suggested copy:

```text
Experience belum bisa dimuat.
```

Supporting:

```text
Filter dan pencarianmu tetap tersimpan. Coba lagi beberapa saat.
```

CTA:

```text
Coba lagi
```

Retry must preserve current URL/query/filter state.

---

# 21. Visual Direction

Use the established Traveler visual language from `TRAVELER_VISUAL_DIRECTION.md` and the completed Taste Skill consolidation pass.

Explore should feel like a real image-led marketplace/discovery surface, not a dashboard.

Priorities:

- search/filter controls easy to scan,
- package visuals dominate cards,
- filter UI compact and understandable,
- active state obvious,
- result grid has comfortable rhythm,
- mobile first,
- desktop intentionally uses 2–4 columns based on width,
- bottom navigation remains stable.

Avoid:

- giant filter form before results,
- one Card around the entire page,
- repeated generic gradients,
- excessive chips,
- new unrelated visual language,
- decorative fake statistics.

Before finalizing T07 UI, invoke **TASTE SKILL** for a screen-specific polish pass while preserving this contract.

---

# 22. Accessibility

Required:

- semantic search form,
- keyboard-operable filters/sort,
- filter sheet focus management,
- visible focus,
- active filters communicated by text/state, not color only,
- touch targets >=44px where appropriate,
- result count announced/understandable,
- package card accessible name,
- illustration alt/decorative behavior consistent with current visual system,
- reduced motion respected.

---

# 23. Out of Scope

T07 does NOT implement:

- T08 Package Detail,
- Session selection,
- session capacity filtering,
- real geocoding/distance,
- transport rules,
- save/favorite,
- production search backend,
- AI/ML/fuzzy/vector search,
- recommendation scoring changes,
- pagination/infinite scroll,
- real market analytics,
- deployment.

Five-package prototype catalog does not require pagination.

---

# 24. Required Tests

At minimum cover:

1. only LIVE packages are candidates,
2. default Explore returns all LIVE packages,
3. search by title,
4. search by destination/location,
5. search by user-facing intent/activity label,
6. unknown search returns EMPTY,
7. each budget bucket boundary,
8. exact duration filter,
9. MALANG departure filter,
10. SURABAYA departure filter,
11. destination filter,
12. AND semantics across multiple categories,
13. each mood preset maps only through locked existing signals,
14. no hidden QuizDraft filtering,
15. POPULAR deterministic ordering,
16. RATING deterministic ordering,
17. PRICE_LOW deterministic ordering,
18. invalid URL params ignored safely,
19. Home `query` param pre-fills search,
20. Home `mood` param pre-applies mood,
21. Home `destination` param pre-applies destination,
22. active filter removal updates results/URL,
23. Reset filter returns default catalog,
24. EMPTY reset recovery,
25. ERROR retry preserves Explore state,
26. package card routes to `/packages/:packageId`,
27. bottom nav exactly four tabs with Explore active,
28. mobile filter-sheet apply/cancel/reset semantics.

---

# 25. MVP Acceptance Summary

T07 is complete when:

- `/explore` replaces the placeholder within existing protected Traveler shell,
- all candidates are LIVE centralized mock packages,
- Home query/mood/destination entry works,
- search/filter/sort are deterministic and URL-backed,
- minimum four filter categories exist,
- active filters can be removed/reset,
- no hidden Quiz personalization removes catalog items,
- package cards contain required metadata and route correctly,
- LOADING/READY/EMPTY/ERROR are implemented,
- no match percentage/AI/capacity/transport claims appear,
- 390px and 1440px are smoke-tested,
- accessibility and existing Traveler business tests remain green.
