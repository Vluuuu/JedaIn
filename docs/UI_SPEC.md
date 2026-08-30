# JedaIn — UI Specification

**Version:** 0.1  
**Date:** 30 Agustus 2026  
**Product Source of Truth:** [`../PRD.md`](../PRD.md)  
**System Flow:** [`SYSTEM_FLOW.md`](SYSTEM_FLOW.md)  
**Wireframe Source:** [`WIREFRAME_SPEC.md`](WIREFRAME_SPEC.md)  
**Design System:** [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)  
**Status:** Agent-Ready Working Specification

> Dokumen ini menerjemahkan PRD + system flow + wireframe spec menjadi kontrak UI yang dapat diimplementasikan oleh AI coding agent tanpa menebak business rule. Jika terjadi konflik: `PRD.md` > `SYSTEM_FLOW.md` > `WIREFRAME_SPEC.md` > `UI_SPEC.md` > implementasi.

---

# 1. Implementation Principles

1. **Do not invent product rules.** Jika requirement belum diputuskan, gunakan konfigurasi/placeholder dan tandai sebagai pending.
2. **Server state is authoritative.** Countdown, payment validity, capacity, role access, approval state, dan trust status tidak boleh ditentukan frontend saja.
3. **One primary action per screen.** Secondary action boleh ada, tetapi hierarchy harus jelas.
4. **State-first implementation.** Loading, empty, error, disabled, rejected, expired, full, pending review harus dianggap bagian normal dari UI.
5. **Reusable primitives before page duplication.** Jangan membuat card/button/badge baru untuk kebutuhan yang sebenarnya sama.
6. **Mobile-first Traveler; desktop-first Partner/Admin.**
7. **No guest mode.** Protected traveler experience selalu memiliki identity.
8. **Accessibility baseline is mandatory.** Keyboard, focus, label, contrast, touch target, reduced motion.
9. **MVP first.** Implementasi golden flow lebih penting daripada polishing nice-to-have.
10. **Agent scope discipline.** Satu task/issue hanya boleh mengubah area yang diminta kecuali dependency kecil memang diperlukan.

---

# 2. Product Surface & Route Contract

## 2.1 Traveler Portal

Target product surface: `jedain.id`

Recommended route contract:

```text
/
/login
/onboarding/consent
/onboarding/quiz
/onboarding/result
/home
/explore
/packages/:packageId
/packages/:packageId/sessions
/checkout/:sessionId
/payment/:bookingId
/payment/:bookingId/result
/trips
/trips/:bookingId
/trips/:bookingId/review
/profile
/profile/preferences
/complaints/new?bookingId=:bookingId
```

### Traveler navigation

Mobile bottom navigation setelah onboarding selesai:

```text
Home | Explore | My Trips | Profile
```

Rules:

- onboarding screen tidak menampilkan bottom navigation,
- payment flow tidak menampilkan distracting bottom navigation,
- detail package boleh menampilkan back navigation + sticky CTA,
- pending payment tidak memblok browsing, hanya creation of new checkout/payment.

## 2.2 Partner Portal

Target product surface: `partner.jedain.id`

Recommended route contract:

```text
/partner
/partner/login
/partner/apply/eo
/partner/apply/destination
/partner/application
/partner/eo
/partner/eo/insights
/partner/eo/packages
/partner/eo/packages/new
/partner/eo/packages/:packageId
/partner/eo/packages/:packageId/sessions
/partner/eo/bookings
/partner/eo/destinations
/partner/eo/reviews
/partner/eo/profile
/partner/destination
/partner/destination/profile
/partner/destination/verification
/partner/destination/schedule
/partner/destination/capacity
/partner/destination/reviews
```

## 2.3 Admin Portal

Target product surface: `admin.jedain.id`

Recommended route contract:

```text
/admin/login
/admin
/admin/eo-approvals
/admin/eo-approvals/:applicationId
/admin/destination-verifications
/admin/destination-verifications/:applicationId
/admin/package-approvals
/admin/package-approvals/:submissionId
/admin/bookings
/admin/complaints
/admin/complaints/:complaintId
/admin/trust
/admin/audit
```

---

# 3. Responsive Layout Contract

## 3.1 Breakpoints

Recommended implementation baseline:

```text
xs: 0–479
sm: 480–767
md: 768–1023
lg: 1024–1279
xl: 1280–1535
2xl: 1536+
```

Do not bind component behavior to device names. Bind to available width.

## 3.2 Traveler

Primary design viewport: `390 x 844`.

Rules:

- page content width on mobile: full width with 16 px page padding,
- desktop traveler content max-width: ~1200 px,
- detail pages may use centered max-width ~960 px,
- package grids: 1 col mobile, 2 col tablet, 3–4 col desktop,
- horizontally scrollable discovery rows on mobile are allowed,
- sticky bottom CTA must respect safe-area inset.

## 3.3 Partner/Admin

Primary design viewport: `1440 x 900`.

Rules:

- persistent left sidebar on `lg+`,
- collapsed/drawer sidebar below `lg`,
- page content max-width may be fluid,
- tables must support horizontal overflow rather than destructive wrapping,
- form workflows should use centered content column ~720–880 px,
- review/detail pages may use two-column layout: content + action panel.

---

# 4. Global Shell Components

## 4.1 `TravelerPublicHeader`

Contains:

- JedaIn logo,
- Explore,
- Tentang JedaIn,
- Untuk Partner,
- Masuk/Daftar.

Mobile:

- logo,
- menu button,
- primary auth CTA optional.

## 4.2 `TravelerAppShell`

Contains:

- app header,
- page content,
- mobile bottom navigation,
- optional global toast region.

Required props/state:

```text
activeNav
hasUnreadNotification
showBottomNav
```

## 4.3 `PartnerShell`

Contains:

- sidebar,
- topbar,
- organization/user identity,
- page title,
- breadcrumb where useful,
- content.

## 4.4 `AdminShell`

Same general layout as Partner but visually more operational and information-dense.

Must reserve space for:

- queue counts,
- review status,
- audit metadata,
- high-risk action confirmation.

---

# 5. Shared Component Contracts

The coding agent should create reusable components instead of repeating markup.

## 5.1 Core primitives

```text
Button
IconButton
TextField
TextArea
Select
Combobox
Checkbox
Radio
Switch
Slider
Chip
Badge
Avatar
Divider
Tabs
Stepper
Tooltip
Dialog
Drawer
DropdownMenu
Toast
Skeleton
EmptyState
ErrorState
Pagination
DataTable
```

## 5.2 Product components

```text
PackageCard
PackageHero
MatchBadge
VerificationBadge
GuideStatusBadge
SessionCard
CapacityIndicator
PriceSummary
PendingPaymentBanner
UpcomingTripCard
MoodChip
SearchBar
FilterSheet
ReviewStars
ReviewSummary
StatusTimeline
ApplicationStatusCard
InsightMetricCard
InsightChartCard
UnmetDemandCard
DestinationCard
BuilderStepper
ItineraryEditor
PricingPanel
ApprovalChecklist
RejectionReasonPanel
ComplaintSeverityBadge
AuditEventRow
```

## 5.3 Component naming rule

- generic reusable UI: domain-neutral name,
- JedaIn business component: business-specific name,
- avoid names like `Card2`, `GreenButton`, `BigBox`, `NewComponent`.

---

# 6. Traveler UI Contract

# T01 — Public Landing

**Route:** `/`  
**Access:** Public  
**Primary goal:** convert visitor into registered traveler.

### Section order

1. Public Header
2. Hero
3. How JedaIn Works
4. Why JedaIn
5. Featured/Popular Packages
6. Trust / Verified Destination explanation
7. Partner CTA
8. Footer

### Hero

Required content:

- headline: `Temukan jeda yang benar-benar kamu butuhkan.`
- supporting copy: wellness experience terkurasi, personal, dan menggunakan destinasi terverifikasi,
- primary CTA: `Mulai Cari Jedamu`,
- secondary CTA: `Masuk`,
- experience-led visual.

### Acceptance criteria

- authenticated + onboarding complete: primary CTA → `/home`,
- authenticated + onboarding incomplete: primary CTA → resume onboarding,
- public user: primary CTA → `/login`,
- no fake statistics unless provided by product/business data.

---

# T02 — Login / Register

**Route:** `/login`  
**Access:** Public / unauthenticated preferred.

### Layout hierarchy

1. Logo
2. Short value statement
3. Google OAuth primary button
4. Divider `atau`
5. Phone/email authentication alternative
6. Terms/privacy links
7. Small Partner Portal link

### Required states

```text
IDLE
AUTHENTICATING
OTP_SENT
OTP_VERIFYING
ERROR
```

### Routing rules

```text
new account -> /onboarding/consent
existing + NOT_STARTED -> /onboarding/consent
existing + IN_PROGRESS -> /onboarding/quiz
existing + COMPLETED -> /home
```

### UX rules

- no guest button,
- preserve entered phone/email after recoverable error,
- OAuth cancellation is not shown as catastrophic error,
- form submit disabled while same request is in progress.

---

# T03 — Consent

**Route:** `/onboarding/consent`

### Layout hierarchy

1. Back control where safe
2. Heading
3. Short explanation
4. Three purpose bullets:
   - recommendation,
   - aggregated demand insight,
   - product improvement
5. Privacy detail link
6. unchecked consent checkbox
7. primary CTA `Setuju & Lanjut`

### Rules

- CTA disabled until consent checked,
- no pre-checked checkbox,
- consent submit failure must preserve user choice locally until retry,
- successful submit → `/onboarding/quiz`.

---

# T04 — Mandatory Quiz

**Route:** `/onboarding/quiz`

### Interaction model

One-question-per-step wizard.

Recommended MVP steps:

```text
1 Healing Intent
2 Preferred Activity
3 Budget
4 Duration
5 Departure Area
6 Group Type/Size
```

### Shared layout

1. Back button
2. `step / total`
3. progress bar
4. question heading
5. optional helper copy
6. answer options
7. primary CTA

### UX rules

- answer autosave or step-save,
- returning `IN_PROGRESS` user resumes latest incomplete step,
- prevent accidental data loss on navigation,
- final CTA: `Temukan Jedaku`,
- on final submit show processing/loading state before result.

### Validation

- required question cannot advance with no selection,
- multi-select must state if multiple choices are allowed,
- budget/duration values come from configuration, not copied across components.

---

# T05 — Recommendation Result

**Route:** `/onboarding/result`

### Primary layout

1. Result intro
2. Top Match Package Card/Hero
3. `Kenapa cocok?`
4. Alternative recommendations
5. CTA to package detail
6. CTA to Home

### Match explanation

Display human-readable factors such as:

```text
Nature
Budget sesuai
Durasi sesuai
Area keberangkatan relevan
```

Do not expose scoring formula details unless product later requires it.

### Fallback state

If no package crosses match threshold:

- do not show misleading high match percentage,
- use copy: `Belum ada yang pas banget, tapi ini pilihan yang paling mendekati preferensimu.`,
- show fallback packages,
- unmatched preference logging happens backend-side.

---

# T06 — Logged-in Home

**Route:** `/home`

### Module order

1. Greeting/Header
2. SearchBar
3. `PendingPaymentBanner` — conditional
4. `UpcomingTripCard` — conditional
5. Personalized Recommendation
6. Preference summary + `Ubah preferensi`
7. Explore by Mood
8. Popular This Week
9. From Departure Area
10. Verified Destinations
11. Bottom Navigation

### State combinations

Must support:

```text
NORMAL
PENDING_PAYMENT_ONLY
UPCOMING_TRIP_ONLY
PENDING_PAYMENT_AND_UPCOMING
NO_RECOMMENDATION
LOADING
ERROR_PARTIAL
```

### Priority rule

Critical transactional state is visually prominent but must not remove discovery content.

### `PendingPaymentBanner`

Shows:

- package/session name,
- server-derived remaining time,
- amount optional,
- CTA `Lanjutkan Pembayaran`.

Do not mark expired based only on frontend timer; server/payment state remains source of truth.

### `UpcomingTripCard`

Shows:

- trip name,
- date,
- relative time optional,
- departure/meeting point summary if available,
- CTA `Lihat Trip`.

---

# T07 — Explore

**Route:** `/explore`

### Required UI

- search input,
- quick filter chips,
- sort control,
- package result grid/list,
- mobile filter sheet,
- result count if reliable.

Minimum filters:

```text
Budget
Duration
Departure/Location
Destination
```

### States

- loading skeleton,
- no result with `Reset filter`,
- request error with retry,
- active filters clearly removable.

---

# T08 — Package Detail

**Route:** `/packages/:packageId`

### Section order

1. media/gallery
2. title + summary
3. price
4. match explanation if personalized context exists
5. verification/trust badges
6. package highlights
7. itinerary
8. EO/guide
9. destination
10. upcoming session preview
11. cancellation/refund policy
12. sticky primary CTA `Pilih Jadwal`

### Rules

- package version displayed must correspond to current live version,
- remaining capacity shown only when data is reliable,
- verified badges need tooltip/explanation.

---

# T09 — Choose Session

**Route:** `/packages/:packageId/sessions`

### SessionCard fields

```text
date
time
departure point
capacity remaining
price snapshot if applicable
session status
```

### Rules

- `FULL/CLOSED/CANCELLED` cannot be selected,
- selected session is visibly persistent,
- CTA `Lanjut Checkout` disabled with no valid selection.

---

# T10 — Checkout Summary

**Route:** `/checkout/:sessionId`

### Required sections

1. Package/session summary
2. Traveler/contact info
3. Participant quantity if applicable
4. Price breakdown
5. Cancellation/refund policy acknowledgement
6. Primary CTA `Lanjut ke Pembayaran`

### Pre-submit checks

- required phone/contact verified,
- session still available,
- no active pending payment.

If an active pending payment exists, route to T12 rather than creating a new booking/payment.

---

# T11 — Contact Verification

Can be route or modal depending implementation.

### Required behavior

- phone input,
- OTP request,
- countdown for OTP resend only,
- OTP verification,
- return to checkout after success.

Do not confuse OTP expiry countdown with payment expiry countdown.

---

# T12 — Pending Payment Resolution

### Trigger

Traveler attempts new checkout while another active `PENDING_PAYMENT` exists.

### Required information

- existing package/session,
- amount,
- payment expiration time,
- remaining time,
- notice that new payment cannot be created yet.

### Actions

Primary: `Lanjutkan Pembayaran`  
Secondary/destructive: `Batalkan Pesanan`

Cancel confirmation must state that reserved slot will be released.

---

# T13 — Payment + Countdown

**Route:** `/payment/:bookingId`

### Required UI

1. payment status
2. amount
3. payment method/provider content
4. server-derived expiration timestamp
5. countdown visualization
6. booking reference
7. help text

### States

```text
PENDING
VERIFYING
SUCCEEDED
FAILED
CANCELLED
EXPIRED
```

### Rules

- refresh/re-open returns to authoritative payment state,
- payment callback/status polling is idempotent,
- expiry releases reserved slot through backend,
- browser close must not create duplicate attempt on reopen.

---

# T14/T15 — Payment Result

Success:

- confirmation,
- trip summary,
- CTA `Lihat Trip`.

Failed/Expired:

- explain whether booking still exists,
- explain whether slot was released,
- show allowed next action,
- never imply user was charged unless payment status confirms it.

---

# T16–T23 — Supporting Traveler UI

## My Trips

Tabs/sections:

```text
Pending
Upcoming
Completed
Cancelled/Refunded (optional)
```

Pending payment must be visually distinct from paid upcoming trip.

## Trip Detail

Show operational information relevant to traveler, not internal admin fields.

## Completed Trip + Review

Review CTA appears only for `COMPLETED` booking.

Separate review flows:

- Venue Review
- EO/Guide Review

Each can be submitted once per booking.

## Profile

Minimum:

- identity/contact,
- preference summary,
- `Ubah preferensi`,
- privacy/data request entry,
- logout.

## Complaint

Only from eligible booking/trip. Traveler describes issue; traveler does **not** self-select Light/Heavy severity.

---

# 7. EO Partner UI Contract

# EO01–EO04 — Entry & Application

Partner landing asks role:

```text
EO / Travel Organizer
Pengelola Destinasi
```

EO application is a multi-step wizard:

```text
Business Info
Legal Documents
Portfolio
Insurance / Required Documents
SOP Agreement
Review & Submit
```

### Application status page

Must support:

```text
DRAFT
PENDING_REVIEW
APPROVED
REJECTED
```

Rejected state shows specific reasons + `Perbaiki Pengajuan`.

---

# EO05 — Overview Dashboard

### Sidebar

```text
Overview
Insights
Packages
Sessions
Bookings
Destinations
Reviews
Profile
```

### Page hierarchy

1. Page title + `+ Create Package`
2. Summary metrics
3. Pending approval callout
4. Upcoming sessions
5. Recent bookings
6. Latest demand insight

Avoid vanity metrics that do not exist in backend.

---

# EO06 — Demand Insights

### Required sections

- healing/activity intent distribution,
- budget distribution,
- duration distribution,
- departure area distribution,
- unmet demand,
- data time range.

### `UnmetDemandCard`

Shows:

```text
preference cluster
frequency
trend indicator only if historical comparison exists
CTA Create Package from Insight
```

Never fabricate trend arrows without prior-period data.

---

# EO07–EO15 — Packages & Builder

## Packages List

Tabs/filter:

```text
Draft
Pending Review
Live
Rejected
Archived (roadmap if needed)
```

## Builder layout

Desktop centered workflow with persistent `BuilderStepper`:

```text
1 Destination
2 Insight
3 Itinerary
4 Pricing
5 Review
```

### Step 1 — Destination

- search/filter verified destinations,
- verification badge,
- guide-ready badge,
- capacity/base-cost summary,
- backend enforces guide rule.

### Step 2 — Insight

- display relevant demand context,
- no need to force data visualization if no relevant data; use honest empty state.

### Step 3 — Itinerary

`ItineraryEditor` supports:

- add activity,
- edit title/description/duration,
- reorder,
- delete with confirmation/undo where practical.

### Step 4 — Pricing

Required:

```text
Destination Base Cost
EO Margin Slider/Input
Platform deduction explanation
Customer Price
Estimated EO proceeds
```

Use configured lower/upper margin bounds.

### Step 5 — Review

Preview product approximately as traveler will see it.

Primary CTA: `Submit untuk Review`.

### Validation errors

Show:

- field-level issue near field,
- summary at top for multi-error submit,
- exact reason from backend where safe.

Do not collapse all errors into generic `Submission failed`.

---

# EO16–EO21 — Sessions, Booking, Review, Profile

## Sessions

Session list fields:

```text
date
package
status
capacity
booked count
remaining slots
```

## Create/Edit Session

Must not allow OPEN if backend/business prerequisites fail.

## Reviews

Separate summary from venue review where relevant.

## Profile

Display:

- EO business identity,
- guide status,
- approval status,
- required documents status,
- SOP/legal metadata where useful.

---

# 8. Destination Partner UI Contract

Dashboard navigation:

```text
Overview
Destination Profile
Verification
Schedule
Capacity
Reviews
Profile
```

## Application

Multi-step form:

```text
Legal/Management
Location Documentation
Facilities & Activities
Capacity & Base Cost
Guide Readiness
Review & Submit
```

## Verification Status

Display dimensions separately:

```text
verification_level: BASIC | PLUS
guide_ready: true | false
```

UI renders combination badge but must not store combination as UI-only truth.

## Schedule

Show sessions/packages using destination, with date/capacity/status.

## Capacity

Modification permissions depend on locked business rule. Until final, UI must respect backend permission and not assume partner can edit every published session.

---

# 9. Admin UI Contract

Admin is desktop-first and operational.

## Queue pattern

Use consistent table/list pattern:

```text
Item
Submitted By
Submitted At
Risk/Status
Current Step
Action
```

## Review pattern

Preferred `lg+` layout:

```text
Main Content  |  Sticky Review Panel
```

Review panel contains:

- status,
- checklist,
- decision controls,
- specific rejection reason,
- audit metadata.

## High-risk action rule

Downgrade, suspend, refund, reject, and similar trust/financial actions require:

- explicit reason,
- confirmation dialog,
- affected entity summary,
- audit event.

## Package Approval

Must display:

- automatic validation result,
- package preview,
- destination status,
- EO guide status,
- pricing summary,
- safety/required fields,
- checklist.

## Complaint Classification

Traveler complaint text is read-only source input.

Admin selects:

```text
Responsible Party: EO | Destination | Both
Classification: Light | Heavy-A | Heavy-B
```

System then applies backend rule after confirmation.

---

# 10. Status Vocabulary Contract

UI labels must map to canonical backend states. Do not create synonymous states casually.

## Onboarding

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

## Application

```text
DRAFT
SUBMITTED
PENDING_REVIEW
APPROVED
REJECTED
```

## Package

```text
DRAFT
SUBMITTED
AUTO_REJECTED
PENDING_REVIEW
APPROVED
LIVE
REJECTED
```

## Session

```text
DRAFT
OPEN
FULL
CLOSED
CANCELLED
COMPLETED
```

## Booking

```text
PENDING_PAYMENT
PAID
UPCOMING
COMPLETED
CANCELLED
EXPIRED
REFUNDED
NEEDS_ADMIN_RESOLUTION
```

## Payment

```text
PENDING
SUCCEEDED
FAILED
CANCELLED
EXPIRED
```

## Fund

```text
PAID
HELD
SPLIT
PAID_OUT
REFUNDED
```

---

# 11. Loading, Error & Empty-State Contract

## Loading

- skeleton should preserve expected layout,
- button submit uses inline loading state,
- avoid full-screen spinner for small updates,
- critical transition may use explicit progress screen.

## Error

Error copy must answer:

1. what happened,
2. what remains safe,
3. what user can do next.

## Empty

Every empty state should offer a next step.

Examples:

- no EO package → `Create Package`,
- no Traveler trip → `Explore Jeda`,
- no search result → `Reset Filter`,
- no insight data → explain insufficient data rather than fake chart.

---

# 12. Motion & Interaction

- motion is supportive, not decorative,
- respect `prefers-reduced-motion`,
- loading/skeleton should not flash aggressively,
- step transitions may use subtle slide/fade,
- success state can use restrained micro-interaction,
- countdown should not animate every element; text update is sufficient.

---

# 13. Accessibility Contract

Minimum:

- WCAG AA contrast target,
- visible focus state,
- keyboard usable forms/menu/dialog,
- form fields have programmatic labels,
- errors connected to fields,
- touch target target >= 44x44 px,
- icon-only controls have accessible names,
- color is never the only status signal,
- heading hierarchy is semantic,
- dialog traps/restores focus correctly.

---

# 14. Agent Implementation Guardrails

When Codex/AI agent implements a UI issue:

1. Read linked issue scope.
2. Read `PRD.md` relevant section.
3. Read relevant `SYSTEM_FLOW.md` flow.
4. Read corresponding `WIREFRAME_SPEC.md` screen.
5. Read this `UI_SPEC.md`.
6. Read `DESIGN_SYSTEM.md`.
7. Reuse existing components before creating new ones.
8. Do not change business state names unless explicitly requested.
9. Do not invent backend API shape; use mock adapter/interface if API contract does not exist yet.
10. Implement loading/empty/error state in same task when specified.
11. Add basic tests for stateful or business-critical UI.
12. Keep task scope vertical and reviewable.

---

# 15. Recommended Frontend Folder Contract

Framework-agnostic concept; adapt if stack differs.

```text
src/
  app-or-routes/
  components/
    ui/
    traveler/
    partner/
    admin/
  features/
    auth/
    onboarding/
    discovery/
    packages/
    booking/
    payment/
    review/
    insights/
    verification/
    approval/
    complaints/
  lib/
    api/
    auth/
    config/
    validation/
  styles/
  types/
```

Rules:

- business logic belongs in feature/domain layer, not visual component,
- API access should be abstracted from page layout,
- design tokens come from one source,
- avoid page-specific duplicate primitives.

---

# 16. Golden UI Implementation Order

Implement in this order unless a newer project issue overrides it:

### Slice 1 — Traveler Auth & Onboarding

```text
T02 Login/Register
T03 Consent
T04 Quiz
T05 Recommendation Result
```

### Slice 2 — Traveler Discovery

```text
T06 Home
T07 Explore
T08 Package Detail
T09 Session Selection
```

### Slice 3 — Booking & Payment

```text
T10 Checkout
T11 Contact Verification
T12 Pending Payment Resolution
T13 Payment Countdown
T14/T15 Payment Result
```

### Slice 4 — Trip & Trust

```text
T16 My Trips
T17 Trip Detail
T18 Completed Trip
T19 Venue Rating
T20 EO Rating
```

### Slice 5 — EO Differentiator

```text
EO05 Dashboard
EO06 Insights
EO07 Packages
EO08–EO12 Builder
EO14 Submission Status
```

### Slice 6 — Admin Trust Loop

```text
A02 Dashboard
A07 Package Approval Queue
A08 Review Checklist
A05/A06 Destination Verification
```

### Slice 7 — Remaining Partner/Admin Support

Implement remaining screens after core demo is coherent.

---

# 17. Definition of UI-Ready

A screen is `UI-READY` when:

- route/access rule is known,
- entry state is known,
- required data is known,
- primary CTA is known,
- secondary actions are known,
- loading state is known,
- empty state is known where relevant,
- recoverable error path is known,
- responsive behavior is known,
- status vocabulary is canonical,
- no unresolved business rule must be invented by implementer.

Current recommendation: Traveler T02–T06 can move to implementation after the initial design-system tokens are accepted.