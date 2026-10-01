# Departure options — implementation and validation

Date: 1 October 2026. Base: latest `main` at `2752a75fba65ae8b602a78283df494f8e40193cf`. Branch: `feat/departure-options-and-traveler-pricing`. PR targets `main`; merging requires the user's explicit approval.

## Active contract and affected files

The requested decisions supersede the earlier single-price formula, fixed per-booking service fee, and Destination self-registration flow. Sources were read in order: `PRD_HOLOGY_PROTOTYPE.md`, `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, `docs/UI_SPEC.md`, `docs/DESIGN_SYSTEM.md`, then the supplied task. No GitHub issue number was supplied. Relevant requirements: REQ-TRV-07–13, REQ-EO-04/07/08/09/11, REQ-MIT-01/02, REQ-XR-01. Historical decision records have a superseded note.

- `src/features/departure/`: stable option IDs, legacy fallback, minimum pricing, shared radio cards and departure summaries.
- `src/features/eo/DepartureOptionsEditor.tsx`, `EoPackageBuilderScreen.tsx`, `mockEoPackageStore.ts`, `buildTravelerDraftPreview.ts`: Step 3 supports one or more authored departures. Submit requires complete labels, unique IDs and positive whole-rupiah prices. Saving the first draft updates `draftId` in the URL for reopening after reload. Step 4 retains destination/guide/margin economics as internal reference. Preview reuses the real Traveler detail and hides internal margin/commission.
- `EoPackagesScreen.tsx`, `EoPackageDetailScreen.tsx`, `EoBookingsScreen.tsx`: minimum price, full option details and immutable booking choice. Bookings read the EO's catalog through repositories after a cold reload.
- `PackageDetailScreen.tsx`, `SessionSelectionScreen.tsx`, `CheckoutScreen.tsx`, contact-verification and pending-payment screens: choice survives navigation and recovery. Direct session/checkout routes provide the chooser. Options share one session capacity. Checkout validates the selected option and current price at the adapter boundary.
- Checkout pricing, transaction store/types, Payment, My Trips and Trip Detail: snapshot ID, area, meeting point, departure time and agreed unit price. Same-tab reload restores the snapshot. New fee = Rp7,500 × participant count. Historical bookings retain their agreed pricing version.
- Partner portal/login, registration repository, `DestinationAuthorityScreen.tsx`, partner-demo-account handler: destinations are added by team/Admin. Existing Destination login and demo workspace remain available. The old registration route shows a neutral authority notice.
- `src/lib/supabase/database.types.ts`, `mappers.ts`, `src/data/packageRepository.ts`: nullable JSONB round-trip and repository persistence.

## Checkout examples

| Departure | Participants | Package subtotal | Service fee | Total |
| --- | ---: | ---: | ---: | ---: |
| Malang, Rp249,000/person | 2 | Rp498,000 | Rp15,000 | Rp513,000 |
| Surabaya, Rp451,400/person | 1 | Rp451,400 | Rp7,500 | Rp458,900 |
| Surabaya, Rp451,400/person | 2 | Rp902,800 | Rp15,000 | Rp917,800 |
| Surabaya, Rp451,400/person | 4 | Rp1,805,600 | Rp30,000 | Rp1,835,600 |

The 10% GMV commission remains internal and is not added to Traveler checkout.

## Supabase verification

Applied `supabase/migrations/20261001143841_departure_options_and_destination_authority.sql` to the linked project. Remote migration inventory confirms version `20261001143841`. The additive change introduces `packages.departure_options` (JSONB, nullable for legacy records), validates authored options and minimum customer price, blocks material option edits after approval, and guards destination creation/application activation. Existing ownership and LIVE-only read policies were retained; no additional write grants or Auth-user mutations were made.

`supabase/tests/departure_options_and_destination_authority.sql` was executed against the live database. It passed validation, duplicate/empty/zero-price guards, legacy NULL compatibility, LIVE edit protection, Destination registration/activation blocking, ownership and anonymous LIVE-only visibility. All rows created by that SQL test were rolled back.

For browser QA, a new temporary package was saved/reopened, submitted, demo-approved and published through the existing EO account, then given one OPEN session. IDs remained stable after repository reload. Only those newly created QA package/session rows were removed after verification, with exact-ID/title/owner guards. Original counts remain: 2 destinations, 8 partner profiles, 2 partner applications, 0 packages and 0 sessions. Existing destination/demo rows were preserved.

The security advisor reported the same pre-existing SECURITY DEFINER execution/password-protection notices before and after this migration. No new advisor finding was introduced. Existing remediation references: [anonymous function execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated function execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Manual browser QA

Verified at desktop 1440 px and Traveler mobile 390 px:

| Surface | Observed result |
| --- | --- |
| TO builder, one option | All departure fields and price entry work within the existing Step 3 layout. |
| TO builder, two options | Malang Rp249,000 and Surabaya Rp451,400 persist with stable IDs. |
| Traveler draft preview | Real Package Detail renders both options without internal costs or unavailable lifecycle data. |
| TO package detail | Both options and the minimum price render; approval/publish/session lifecycle completes. |
| Traveler detail desktop/mobile | Unselected multi-option CTA requires a choice; selected radio/border/check is clear. Header shows the minimum; selected CTA shows Rp451,400. |
| Session Selection | Surabaya remains selected; one shared session is shown, without per-option capacity splitting. |
| Checkout, one participant | Chosen departure appears on desktop/mobile; unit Rp451,400, fee Rp7,500, total Rp458,900. |
| Checkout, two participants | Both multiplications are shown; fee Rp15,000 and total Rp917,800. Desktop side summary uses the selected price. |
| Contact verification demo return | Departure, quantity 2 and policy state survive the demo bypass. |
| Payment and same-tab reload | Surabaya, Gubeng, 05.00 WIB and total Rp917,800 survive reload; prototype payment succeeds. |
| My Trips/Ticket and reload | Meeting point and booked total remain tied to the immutable booking snapshot. |
| TO Bookings and cold reload | Selected Surabaya departure and total Rp917,800 appear after fetching the owned catalog. |
| Existing Destination account | Existing credentials open the Lereng Hijau workspace; no self-registration entry is visible. |

Mobile DOM width checks returned 390 px for viewport and document on detail/session/checkout/payment/ticket. Currency alignment, spacing and selection hierarchy were inspected in screenshots; sticky actions remain accessible above bottom navigation. Screenshots are local QA artifacts outside the repository.

## Automated validation and limits

All local gates passed: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test -- --run` (876 tests, 74 files), `npm run build`, and `git diff --check`. The test suite covers all 20 requested areas, including invalid prices/choices, persisted IDs, navigation, fees for 2/4 participants, snapshots, legacy records, Supabase save/reload and error propagation, Destination authority/login compatibility, and package/session lifecycle. Build retains the existing large-chunk advisory; it is successful. PR/CI and preview status are reported with the final commit.

- The current schema has no booking/payment tables. Transactions, reservation ledger and payment/OTP remain the existing prototype simulation in session storage; persistence is limited to the same browser tab, not other devices. No production payment or email infrastructure was introduced.
- The partner-demo-account Edge Function source has the additional early guard and automated handler tests. That Edge Function was not redeployed; the applied database guard also blocks the previous server path before an unapproved Destination account token can be acquired.
- Recommendation weights, payment timeout and final cancellation/refund policy remain existing configurable/mock decisions. No additional product decision was invented.
