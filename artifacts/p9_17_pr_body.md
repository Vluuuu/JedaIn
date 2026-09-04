Part of #47

DO NOT MERGE.

### Overview
Addresses direct product owner visual and architectural requirements for **P9.17 — Traveler Trip Detail T17/T18 Visual Polish + Post-Purchase EO Contact + Completed Trip Review Experience**:

1. **North Star & Companion Experience**:
   - Reimagined Trip Detail as a personal travel companion for a trip the user has already booked ("this is my upcoming journey"), moving away from admin booking receipts and generic card stacks.
   - For COMPLETED trips (T18), seamlessly transitions from upcoming operations into a reflective memory and dual-target completion loop (Destinasi & EO / Guide).

2. **Source-Backed Post-Purchase EO Contact Resolution**:
   - Extended `TripDetailViewModel` with optional `organizerContact` (`contactPerson`, `phone`, `email`).
   - Centrally resolved inside `MockTripsAdapter` by matching `detail.organizer.id` against approved applications in `mockApplicationStore` using canonical `resolveOrganizerReviewRef`.
   - Strictly post-purchase: Contact information is completely isolated from pre-purchase discovery models (`PackageOrganizerProfile`, Explore, Package Detail, Session Selection, and Checkout).
   - Displayed inside an editorial contact card with direct `tel:` action ("Hubungi EO") and `mailto:` link.

3. **Experience Identity & Inline Lifecycle Status System**:
   - Integrated authentic visual thumbnails via `getPackageVisual` from `packageImages.ts` (16:9 mobile aspect ratio, wide on desktop).
   - Replaced generic badges with clean, flat inline status dot + uppercase caption (`Trip Terkonfirmasi` in forest tone, `Trip Selesai` in stone neutral).
   - Highlighted departure schedule directly within the hero via a prominent calm schedule banner with calendar icon.

4. **Itinerary Timeline & Content Hierarchy**:
   - Replaced repeated pale background boxes with a clean vertical travel timeline featuring marker dots, time of day/duration metadata, and clear typography.
   - Structured package inclusions and exclusions into an aligned dual-column grid without circular icon bubbles.
   - Displayed source-backed safety notes ("Sebelum Berangkat") and cancellation policy in plain explanatory typography.

5. **Completed Trip Review Section & Deterministic Priority**:
   - Consolidated review targets into a cohesive "Penilaian Pengalaman" section while preserving two distinct targets (`DESTINATION` and `EO_GUIDE`).
   - Implemented deterministic priority: Destination is primary (`ui-button--primary`) while EO is secondary (`ui-button--secondary`); when Destination is reviewed, EO becomes primary; when both are completed, both render clean flat checked states (`✓ Sudah dinilai`) with no extra CTAs.

6. **Discreet Prototype Demo Control**:
   - Replaced prominent dashed developer controls near the hero with a native collapsed `<details>` disclosure at the bottom of the page (`Kontrol Demo`), completely hidden on COMPLETED status.

7. **Resilient Local Presentation States & Navigation**:
   - Replaced character arrows with the canonical 18px SVG back arrow.
   - Replaced coupled `.payment-state-box` with scoped `.trip-detail-state` and added separate retryable ERROR state and clear NOT_FOUND recovery.

### Verification
- `npm run format:check` - Passed
- `npm run lint` - Passed (0 warnings, 0 errors)
- `npm run typecheck` - Passed
- `npm test` - Passed (27 test files, 422 tests passing)
- `npm run build` - Passed
- `git diff --check` - Clean
- Undefined token audit: 0 undefined CSS variables
- Em-dash / En-dash audit: 0 banned dashes
