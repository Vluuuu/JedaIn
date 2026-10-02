# Departure options — implementation and validation

Date: 2 October 2026 (follow-up to the 1 October delivery). Base: latest `main` at `2752a75fba65ae8b602a78283df494f8e40193cf`. Branch: `feat/departure-options-and-traveler-pricing`. PR [#119](https://github.com/Vluuuu/JedaIn/pull/119) targets `main`; merging requires the user's explicit approval.

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

Deployed `partner-demo-account` version 6 (`ACTIVE`, `verify_jwt=true`). Its early guard rejects an unapproved Destination before token acquisition or Auth updates. Retrieved the deployed files to verify the guard and preserved the newer server's named Destination-account email/collision handling when aligning repository source. An unauthenticated POST returned 401; OPTIONS returned 200. Deployment did not invoke approval/reissue or create/update any Auth users. Handler regressions cover the Destination guard and existing account naming/collision behavior.

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

## Follow-up audit and fixes (2 October)

- A session becoming unavailable at checkout and an expired payment now recover to Session Selection with the previous departure ID in the URL.
- Package Detail subtracts occupied participants in the same shared reservation ledger used by checkout/session selection, and presents FULL when no slots remain.
- Direct protected-route consent establishes a local guest identity without skipping consent or the mandatory quiz. Checkout without a Traveler identity disables submission and provides a login/guest entry.
- TO Bookings distinguishes a failed owned-catalog fetch from a successfully empty catalog, with a retry action. Supabase repository regressions exercise both response errors and transport failures.
- Negative authored prices remain invalid in the editor rather than silently becoming positive. Authored checkout summary labels identify the departure price.
- Active demo instructions now use authored prices, shared capacity and both participant multiplications; earlier formula/application notes are explicitly historical.

Additional local browser QA started anonymously at a direct checkout route, completed consent and all six quiz steps, then loaded checkout with the same Tamu identity. Two participants and policy acknowledgment survived the contact-demo return; the legacy package's new booking total was Rp600,000 + Rp15,000 = Rp615,000. Payment survived reload and completed through the existing simulator; the ticket retained the booking. Package Detail then showed 4 remaining slots after 2 participants occupied a 6-slot session. Mobile payment width and document width were both 390 px; the expanded ticket also had no horizontal overflow. No Supabase account or production payment was involved.

## Automated validation and limits

## Traveler, TO and Admin follow-up (2 October)

User clarification extends this PR with a backend-backed Admin catalog and one newly authorized Admin Auth account; existing EO/Destination Auth accounts and catalog records remain intact. Public `/partner` now presents only TO; `/partner/destination/login` preserves existing destination access. This supersedes the historical two-role portal and mock-only Admin access in older specifications.

My Trips and Trip Detail use the authored package cover; TO session package cards use the same package cover with destination fallback. New bookings persist session start/end timestamps alongside departure snapshots. Completed demo bookings retain their known fixture dates even after review/save adds them to the transaction store. Trip Detail opens itinerary and operational details by default and includes outbound/return transport from the package detail source. Home uses plain `Perjalanan berikutnya` status text. Departure legends sit inside their fieldsets. Margin and departure prices use formatted whole-Rupiah inputs; an unset price says `Belum diisi` with a link to Step 3, while submission still requires positive prices.

`AdminCatalogPanel` and `adminCatalogRepository` provide real Admin login, a TO directory with actual Live-package/active-session counts, destination listing, loading/error/retry states, and verified-destination creation. Server authorization is rechecked for every operation; failed remote inserts never become local successes. Creation does not create Destination Auth accounts. Missing photos remain empty placeholders. `20261002013033_admin_verified_destination_management.sql` adds Admin-only INSERT rights and an unexposed, narrowly scoped role helper to avoid recursive profile RLS.

Remote transactional checks passed for Admin directory/valid INSERT, rejection of unverified destinations, and rejection of EO/anonymous INSERT. All test rows rolled back. Existing four Auth IDs remained and exactly one Admin ID was added. Account setup used server-only `auth.admin.createUser`; its temporary Edge Function was disabled immediately and deleted. Credentials are kept in a private local attachment, outside the repository. Supabase security advisors reported no finding for the new helper/policies; pre-existing registration RPC and leaked-password-protection advisories remain outside this slice.

Sources read in canonical order; relevant IDs: REQ-TRV-06/07/13, REQ-EO-07/08/09, REQ-MIT-01/02, REQ-XR-01. The prototype booking ledger remains same-tab sessionStorage; it is not a production transaction backend. Old orders without any surviving date source display an honest missing-record message. Existing financial values are not guessed or rewritten; formatting and validation support correcting authored values explicitly.

All local gates passed: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test -- --run` (896 tests, 75 files), `npm run build`, and `git diff --check`. The test suite covers all 20 requested areas, including invalid prices/choices, persisted IDs, navigation, fees for 2/4 participants, snapshots, legacy records, Supabase save/reload and error propagation, Destination authority/login compatibility, and package/session lifecycle, plus the follow-up recovery/guest/capacity/error regressions. Build retains the existing large-chunk advisory; it is successful. PR/CI and preview status are reported with the final commit.

- The current schema has no booking/payment tables. Transactions, reservation ledger and payment/OTP remain the existing prototype simulation in session storage; persistence is limited to the same browser tab, not other devices. No production payment or email infrastructure was introduced.
- Recommendation weights, payment timeout and final cancellation/refund policy remain existing configurable/mock decisions. No additional product decision was invented.

Browser follow-up: real Supabase Admin login and local logout passed. A clearly labeled temporary destination was created through the UI, its cost/activity fields were re-fetched from Supabase, and it survived a page reload. Only that exact temporary row was deleted after QA. The real TO and destination lists remained visible; the Admin account remains available.

TO browser QA: existing EO credentials still sign in. Budug Asu session cover loaded at natural width 1200px from its authored package image; fetching the destination directory on cold load also restored its actual name/location. The departure legend stays inside the card at desktop and 390px. Input 149.870 renders Rp149.870; margin 49.870 plus destination base 100.000 renders reference Rp149.870; clearing the option price renders Belum diisi and recovery to Step 3. Mobile action buttons wrap, with document width 375px in a 390px viewport and no overflowing button. Only the newly auto-saved QA draft was removed; existing three packages remain. Viewport override was reset.

## Product-facing TO terminology (2 October)

The user's reminder confirms the active 27 September terminology contract: all authored role labels use TO / Travel Organizer. This follow-up replaces remaining EO copy in Admin navigation/review queues, Traveler login, Destination approval copy, TO overview/insights/profile/reviews/login and shared package/session validation messages. Admin complaint targets and audit actions/entities render readable TO labels; authentication errors map canonical roles to product labels. Internal role/guide-source enums, audit records, IDs, ownership checks and existing routes retain their compatibility values. Related requirement: REQ-XR-01.

Existing navigation, role/ownership, Supabase authorization, login, insights and destination tests assert the new terminology. Audit rendering rejects visible EO while the recorded action enums remain canonical. Format, lint, typecheck, build and full tests are checked again for this follow-up; final preview and CI evidence are recorded in PR #119.

## Additive departure-cost correction (2 October)

The user clarified that Rp175,000/Rp110,000 are departure travel costs, not final prices. This supersedes the previous independent-final-price decision. Step 3 authors departureCostPerPerson separately; Step 4 computes destination base + applicable local guide + TO margin + each departure cost. With base Rp100,000 and margin Rp150,000, Malang is Rp425,000 and Singosari Rp360,000; checkout adds Rp7,500 per participant. TO allocation is not labeled guaranteed net profit.

Shared domain and mock/Supabase draft repositories normalize final prices without adding twice. Builder summaries/review, Traveler preview/catalog and checkout use the same computed prices. Traveler DTOs omit internal cost/margin data. Zero travel cost is supported; blank, negative and fractional costs cannot be submitted. Existing approved/Live legacy final prices and booking snapshots remain compatible; material Live changes require a draft/re-approval. Existing editable draft amounts adopt the user's clarified cost meaning while retaining option IDs and labels.

Applied migration 20261002093728_additive_departure_cost_pricing. The SECURITY INVOKER trigger computes canonical destination/guide costs and final option/customer prices, validates cost inputs and retains the approved-package edit guard. Only editable drafts are adopted; no Auth user or grant changes. The user's actual Budug Asu draft now persists costs 175000/110000 and final prices 425000/360000. Transactional remote tests passed canonical-cost/forged-price normalization, margin recalculation, zero cost, negative/fractional/unset rejection and Live material-edit rejection; test changes rolled back. Security advisors introduce no finding for the changed trigger; existing registration RPC/password-protection findings remain as documented above.

Relevant sources read in canonical order. Requirement IDs: REQ-TRV-07-13, REQ-EO-07/08/09/11, REQ-XR-01. Full suite: 901 tests in 75 files, including additive cost arithmetic, zero/unset inputs, live builder margin updates, Traveler preview, selected-price checkout with participant fees, immutable booking snapshots, and Supabase save/reload/review without double charging. Format, lint, typecheck, build and diff checks passed. The prototype same-tab booking/payment boundary is unchanged; current CI/preview evidence is in PR #119.

Browser QA with the actual Supabase draft verified Step 3 cost inputs Rp175,000/Rp110,000, Step 4 shared cost Rp250,000 and final Rp425,000/Rp360,000, Step 5 review, and the shared Traveler preview with the same options and no internal margin. The authored cover and departure labels remain present; no form data was changed during this inspection.

## Recommendation cover and departure selection follow-up (2 October)

The quiz result previously called the image resolver without the package's authored cover, causing recommendations to show a fallback while Home/Detail used the actual image. Main and alternative recommendation cards now pass visualAsset through the existing shared resolver; fixture illustration fallbacks remain labeled honestly. Detail Experience and the shared TO Traveler preview list all authored departure areas, meeting points, times and final per-person prices inside the preparation/access disclosure. Detail has no departure radios or preselected-price CTA; Pilih Jadwal is the only selection surface and carries the chosen option to checkout. Legacy authored logistics remain supported, including time-only or absent-location cases.

Sources read in canonical order: PRD_HOLOGY_PROTOTYPE.md, PRD.md, docs/SYSTEM_FLOW.md, docs/WIREFRAME_SPEC.md, docs/UI_SPEC.md and docs/DESIGN_SYSTEM.md. The user's clarification supersedes the earlier duplicate selection behavior; active PRD/UI contracts are updated. Relevant requirements: REQ-TRV-05/06/07/08 and REQ-EO-07/08. Affected routes: /onboarding/result, /packages/:packageId and Builder Traveler preview; session/checkout business rules remain unchanged.

Local checks passed format, lint, typecheck, build and diff checks; 903 tests across 75 files. Regression coverage includes authored covers for both matched/fallback recommendations and alternatives, all departures despite a legacy detail query, a single selection in the session-to-checkout flow, preview parity and legacy logistics. Browser QA completed a synthetic guest quiz against the actual Supabase LIVE Budug Asu catalog: the uploaded WebP cover loaded at natural width 1200px and exactly matched Detail's image source; Detail contained no radios and its disclosure displayed Kota Malang/Area Alun-Alun Malang/02.30 plus Singosari/Area Parkir Kebun Teh Wonosari/03.45. At a 390px viewport, document width was 375px and both cards remained within it. The viewport override was reset. No database, Auth or package-record mutations were made for this follow-up. Current CI/deployment evidence is in PR #119; the existing bundle-size advisory remains.
