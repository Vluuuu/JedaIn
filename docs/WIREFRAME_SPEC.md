# JedaIn — Wireframe Specification

**Version:** 0.1  
**Date:** 30 Agustus 2026  
**Source of Truth:** [`../PRD.md`](../PRD.md)  
**System Flow:** [`SYSTEM_FLOW.md`](SYSTEM_FLOW.md)  
**Status:** Working Wireframe Specification

> Dokumen ini adalah jembatan langsung dari system flow ke low-fidelity wireframe. Tujuannya agar setiap screen memiliki fungsi, entry condition, informasi, CTA, state, dan destination yang jelas sebelum masuk ke high-fidelity UI atau development.

---

# 1. Wireframe Principles

1. **Flow before visual.** Wireframe menentukan struktur informasi dan interaksi, bukan warna, font final, ilustrasi, atau branding detail.
2. **One primary action per screen.** Setiap screen harus memiliki satu CTA utama yang jelas.
3. **State-aware UI.** Pending payment, upcoming trip, approval, rejection, empty state, loading, dan error tidak boleh dipikirkan belakangan.
4. **Server-side business rule remains source of truth.** UI tidak boleh mengandalkan countdown, capacity, role visibility, atau validation lokal sebagai sumber kebenaran.
5. **Traveler is mobile-first.** Prioritas layout 390–430 px width.
6. **Partner/Admin is desktop-first.** Prioritas layout 1280–1440 px width dengan sidebar.
7. **MVP demo first.** Screen yang mendukung golden demo flow dikerjakan sebelum supporting screen.
8. **No fake business rule.** Nilai yang belum final harus ditampilkan sebagai configurable placeholder atau diberi label PENDING, bukan diasumsikan final.

---

# 2. Global Navigation Architecture

## 2.1 Traveler Portal

Target surface: `jedain.id`

### Public navigation

- Logo JedaIn
- Explore
- Tentang JedaIn
- Untuk Partner
- Masuk / Daftar

### Logged-in mobile navigation

Bottom navigation:

1. **Home**
2. **Explore**
3. **My Trips**
4. **Profile**

Optional persistent global action:

- Search dapat muncul pada Home dan Explore, bukan sebagai tab terpisah.

## 2.2 Partner Portal

Target surface: `partner.jedain.id`

EO navigation:

- Overview
- Insights
- Packages
- Sessions
- Bookings
- Destinations
- Reviews
- Profile

Destination Partner navigation:

- Overview
- Destination Profile
- Verification
- Schedule
- Capacity
- Reviews
- Profile

## 2.3 Admin Portal

Target surface: `admin.jedain.id`

- Overview
- EO Approvals
- Destination Verification
- Package Approvals
- Bookings / Payments
- Complaints
- Trust & Status
- Audit / Activity

---

# 3. Shared UI States

Semua screen wajib mempertimbangkan state berikut bila relevan:

- `LOADING`
- `EMPTY`
- `ERROR`
- `SUCCESS`
- `DISABLED`
- `OFFLINE/RETRY` untuk flow yang network-critical
- `PENDING_REVIEW`
- `REJECTED`
- `EXPIRED`
- `FULL`

## 3.1 Loading

Gunakan skeleton untuk catalog/card/dashboard data. Jangan membuat layout berpindah drastis setelah data selesai dimuat.

## 3.2 Error

Error harus menjawab:

1. apa yang gagal,
2. apakah data user aman,
3. apa aksi berikutnya.

Contoh:

> Pembayaran belum dapat diverifikasi. Pesananmu tetap tersimpan. Coba cek lagi beberapa saat.

## 3.3 Empty State

Empty state tidak boleh hanya berkata “Belum ada data”. Harus memberikan next action.

Contoh EO package kosong:

> Belum ada paket wellness yang kamu buat. Gunakan demand insight untuk mulai menyusun paket pertama.
>
> `+ Create Package`

---

# 4. Traveler Screens

# T01 — Public Landing

**Priority:** Must  
**Purpose:** menjelaskan value JedaIn dan mendorong user membuat akun.  
**Entry:** public URL, user belum login.

### Above the fold

- Logo / top navigation
- Hero headline
- Supporting text
- Primary CTA: **Mulai Cari Jedamu**
- Secondary CTA: **Masuk**
- Experience imagery / visual placeholder

Suggested message hierarchy:

> **Temukan jeda yang benar-benar kamu butuhkan.**
>
> Wellness experience terkurasi dari destinasi lokal terpercaya, disesuaikan dengan kebutuhanmu.

### Supporting sections

1. How it works: `Quiz → Match → Book → Jeda`
2. Why JedaIn:
   - personal recommendation,
   - curated experience,
   - verified destination.
3. Featured / popular packages
4. Partner CTA
5. Footer

### Primary CTA destination

`T02 Login / Register`

### State

- If already authenticated + onboarding completed: CTA berubah menjadi **Buka JedaIn** → `T06 Home`.
- If authenticated but onboarding incomplete: CTA → resume onboarding.

---

# T02 — Login / Register

**Priority:** Must  
**Purpose:** membuat atau mengakses traveler identity.  
**Entry:** landing CTA, protected route redirect.

### Layout

- JedaIn leaf brand mark
- Mode tabs: `SIGN IN` / `SIGN UP`
- Email & Password input fields (+ Name & Confirm Password on `SIGN UP`)
- Primary CTA: `SIGN IN` / `SIGN UP`
- Divider `or continue with`
- Google OAuth button: `Continue with Google`
- Mode switch link
- Link Terms & Conditions / Privacy Policy dialogs + Partner portal link

### Primary CTA

**SIGN IN / SIGN UP (or Continue with Google)**

### Secondary actions

- Continue with Google
- Mode switch (Sign in / Sign up)

### Rules

- Tidak ada guest mode.
- Existing identity → login.
- New identity → create traveler account.
- Setelah account baru berhasil dibuat → `T03 Consent`.
- Existing account dengan onboarding `COMPLETED` → `T06 Home`.
- Existing account `NOT_STARTED/IN_PROGRESS` → resume onboarding.

### Error states

- OAuth cancelled
- OTP invalid/expired
- Account linking conflict
- Network failure

Error tidak boleh menghapus input nomor/email yang sudah diisi.

---

# T03 — Explicit Data Consent

**Priority:** Must  
**Purpose:** memperoleh persetujuan sebelum preference quiz disimpan.  
**Entry:** account traveler baru atau onboarding belum memiliki consent.

### Visible information

- Simple explanation kenapa data ditanya
- Ringkasan penggunaan data:
  - recommendation,
  - aggregate demand insight,
  - product improvement
- Privacy link
- Unchecked consent checkbox

### Primary CTA

`Setuju & Lanjut`

CTA disabled sebelum checkbox aktif.

### Secondary

`Pelajari penggunaan data`

### Destination

→ `T04 Onboarding Quiz`

---

# T04 — Mandatory Onboarding Quiz

**Priority:** Must  
**Purpose:** menangkap current intent dan preference awal traveler.  
**Entry:** setelah consent / retake dari profile.

### Structure

Single-question stepper atau grouped steps, maksimal 5–8 pertanyaan.

Header:

- back button jika aman
- progress indicator `2 dari 6`
- optional close hanya jika progress tersimpan; user tetap akan diarahkan kembali saat login berikutnya.

### Proposed question groups — PRODUCT DRAFT

1. **Kamu lagi butuh jeda seperti apa?**
   - Tenang & recharge
   - Alam & udara segar
   - Eksplorasi ringan
   - Refleksi / self-development
   - Aktivitas lebih aktif

2. **Berapa budget yang nyaman?**
   - < Rp200k
   - Rp200–300k
   - Rp300–500k
   - > Rp500k

3. **Durasi ideal?**
   - Setengah hari
   - 1 hari
   - 2D1N
   - 3D2N+

4. **Berangkat dari area mana?**
   - Surabaya
   - Malang
   - area lain — input/select

5. **Biasanya pergi dengan berapa orang?**
   - sendiri
   - 2 orang
   - 3–4
   - 5+

6. Optional mood / preferred intensity question.

**PENDING:** wording dan opsi final harus divalidasi tim bisnis.

### Interaction

- Selectable cards/chips
- Auto-next optional, tetapi tombol Next lebih aman untuk accessibility
- Answers autosave setelah setiap step

### Primary CTA

Per step: `Lanjut`

Final: `Lihat Rekomendasiku`

### States

- loading save
- save failed → retry tanpa menghapus answer
- incomplete required answer → inline validation

### Completion

Set `onboarding = COMPLETED` → `T05 Recommendation Result`.

---

# T05 — Recommendation Result

**Priority:** Must  
**Purpose:** memberi payoff langsung setelah quiz dan menjelaskan bahwa JedaIn memahami kebutuhan user.  
**Entry:** first quiz completion / retake quiz completion.

### Layout

Header copy:

> **Ini jeda yang paling cocok buat kamu sekarang.**

Primary package card:

- package image
- title
- match indicator, contoh `92% cocok`
- destination/location
- duration
- starting price
- short reason: `Cocok karena kamu memilih nature, 1 hari, dan budget Rp200–300k`
- verification badge

Secondary recommendations: 2–4 cards.

### Primary CTA

`Lihat Experience` → `T08 Trip Detail`

### Secondary

`Lihat semua rekomendasi` → `T07 Explore`

### Fallback state

Jika match threshold tidak terpenuhi:

> Belum ada paket yang benar-benar pas dengan pilihanmu. Ini beberapa experience populer yang paling mendekati.

Backend tetap mencatat unmatched preference.

---

# T06 — Logged-in Home

**Priority:** Must  
**Purpose:** menjadi personalized discovery hub dan status hub traveler.  
**Entry:** successful login dengan onboarding completed / bottom nav Home.

### Module order — LOCKED

1. Greeting
2. Pending Payment Banner — conditional
3. Upcoming Trip Card — conditional
4. Search
5. Personalized Recommendation
6. Explore by Mood
7. Popular This Week
8. From Your Departure Area
9. Verified Destinations

### Header

- Greeting + first name
- notification icon optional
- avatar/profile shortcut

### Pending Payment Banner

Conditional jika active pending payment:

- package name
- remaining countdown
- amount
- CTA `Lanjutkan Pembayaran`

Do not block browsing.

### Upcoming Trip Card

Conditional jika ada booking upcoming:

- package
- date
- days remaining
- destination
- CTA `Lihat Trip`

### Search

Placeholder:

`Cari healing, lokasi, atau experience...`

### Personalized recommendation

- one hero card
- explanation tag `Pilihan untukmu`
- optional match percentage

### Explore by Mood

Chips/cards:

- Tenang
- Alam
- Recharge
- Eksplorasi
- Refleksi

### Primary behavioral principle

Home tidak memiliki satu global CTA; primary contextual CTA mengikuti state tertinggi:

1. pending payment → Continue Payment,
2. upcoming trip near date → View Trip,
3. otherwise → personalized package.

---

# T07 — Explore / Search / Filter

**Priority:** Must  
**Purpose:** eksplorasi seluruh package LIVE di luar recommendation utama.  
**Entry:** bottom nav Explore, search, category/mood.

### Top area

- Search bar
- Filter button
- Sort control

### Minimum filters

- budget
- duration
- departure area/location
- destination

### Package card minimum

- photo
- title
- destination
- price
- duration
- rating
- verification badge

Optional:

- match percentage jika user sudah onboarding

### Empty state

> Belum ada package yang cocok dengan filter ini.
>
> `Reset filter`

### Primary action

Tap package → `T08 Trip Detail`

---

# T08 — Trip Package Detail

**Priority:** Must  
**Purpose:** membantu traveler mengambil keputusan sebelum memilih jadwal.  
**Entry:** recommendation/catalog/package card.

### Information hierarchy

1. Hero image/gallery
2. Title + short value proposition
3. Rating + verified badge
4. Price starting from
5. Match explanation if relevant
6. Destination + map/location summary if needed
7. EO / guide identity + guide status
8. Experience summary
9. Itinerary
10. What's included / excluded
11. Safety/basic notes
12. Cancellation/refund policy summary
13. Upcoming sessions
14. Reviews preview

### Sticky mobile CTA

`Pilih Jadwal`

### Secondary

- Save/favorite
- Share

### State

If no open session:

- CTA disabled
- message `Belum ada jadwal tersedia`
- optional notify interest — roadmap/Should

---

# T09 — Choose Session

**Priority:** Must  
**Purpose:** memilih occurrence konkret dari package.  
**Entry:** package detail.

### Session card

- date
- start/end time
- departure point if applicable
- remaining slots
- price snapshot
- guide/EO if session-specific
- status

### States

- `OPEN` selectable
- `FULL` disabled
- `CLOSED` hidden or disabled based context

### Primary CTA

`Lanjut Checkout`

CTA only enabled after one session selected.

### Concurrency note

Display slot bukan reservation. Slot baru di-reserve ketika checkout create-booking berhasil.

---

# T10 — Checkout Summary

**Priority:** Must  
**Purpose:** final confirmation sebelum membuat booking/payment.  
**Entry:** selected session.

### Visible summary

- package
- session date/time
- destination
- participant count
- price breakdown
- traveler/contact
- cancellation/refund policy
- terms confirmation if needed

### Important message

> Slot baru diamankan setelah kamu lanjut ke pembayaran.

### Primary CTA

`Lanjut ke Pembayaran`

### Pre-submit checks

1. verified/required phone/contact?
2. session still OPEN?
3. capacity enough?
4. active pending payment exists?

### Routing

- phone/contact incomplete → `T11`
- pending payment exists → `T12`
- otherwise atomic reserve → booking `PENDING_PAYMENT` → `T13`

---

# T11 — Contact / Phone Verification

**Priority:** Must if required  
**Purpose:** melengkapi kontak yang dibutuhkan untuk trip/notifikasi.  
**Entry:** checkout check gagal.

### UI

- phone number field
- OTP input
- explanation use case

### Primary CTA

`Verifikasi & Lanjut`

### Success

Return to checkout context, bukan Home.

---

# T12 — Pending Payment Resolution

**Priority:** Must  
**Purpose:** mencegah multiple active pending payment dan memberi pilihan eksplisit.  
**Entry:** traveler mencoba checkout ketika ada pending payment aktif.

### Modal/full screen recommended on mobile

Title:

> **Kamu masih punya pembayaran yang belum selesai.**

Information:

- package
- session
- amount
- remaining time
- payment status

### Primary CTA

`Lanjutkan Pembayaran`

### Secondary destructive action

`Batalkan Pesanan Lama`

Batalkan harus meminta confirmation:

> Slot yang sedang kamu pegang akan dilepas dan mungkin diambil traveler lain.

### After cancellation

- booking → `CANCELLED`
- reserved slot released
- user kembali ke checkout package baru

### If expired while screen open

UI berubah menjadi expired state dan CTA:

`Kembali ke Checkout`

---

# T13 — Payment + Countdown

**Priority:** Must  
**Purpose:** menyelesaikan transaksi sebelum reservation expired.  
**Entry:** booking PENDING_PAYMENT aktif.

### Header priority

- countdown highly visible
- copy `Selesaikan pembayaran sebelum`
- absolute expiration time optional

### Summary

- package/session
- total
- payment method/gateway UI handoff
- booking ID/reference

### Primary CTA

Tergantung gateway:

- `Bayar Sekarang`
- atau payment instructions

### Secondary

`Batalkan Pesanan`

### Important implementation note

Countdown hanya representasi `payment_expires_at` dari server.

### States

- pending
- checking payment
- succeeded → `T14`
- failed → `T15`
- expired → `T15`
- cancelled → return Home / previous flow

---

# T14 — Payment Success

**Priority:** Must  
**Purpose:** memberikan confirmation kuat bahwa booking berhasil.  
**Entry:** verified gateway success.

### UI

- success icon/state
- package/session summary
- booking ID
- next-step note

### Primary CTA

`Lihat Trip` → `T17 Upcoming Trip Detail`

### Secondary

`Kembali ke Home`

---

# T15 — Payment Failed / Expired

**Priority:** Must  
**Purpose:** memberi recovery path tanpa ambiguity.  
**Entry:** payment failed/expired.

### Failed state

Jika reservation masih aktif dan retry diperbolehkan:

- explain failure
- CTA `Coba Lagi`

Jika expired:

- explain slot sudah dilepas
- CTA `Pilih Jadwal Lagi`

### Must not say

Jangan mengatakan booking sukses/slot aman jika server state belum authoritative.

---

# T16 — My Trips

**Priority:** Must  
**Purpose:** melihat booking traveler berdasarkan lifecycle.  
**Entry:** bottom nav.

Tabs:

- Upcoming
- Completed
- Cancelled / History

Card:

- package
- session date
- booking status
- payment/trip status

Pending payment dapat tampil sebagai special state di atas.

---

# T17 — Upcoming Trip Detail

**Priority:** Must  
**Purpose:** operational trip information setelah pembayaran.  
**Entry:** Home upcoming card / My Trips.

### Visible

- date/time
- meeting/departure point
- itinerary
- EO/guide contact information policy
- destination
- what to bring
- safety/contact info
- booking participants
- cancellation policy

### Primary CTA

Context-based:

- `Lihat Detail Keberangkatan`
- no payment CTA because already paid

### Secondary

`Ajukan Pembatalan` jika policy memungkinkan.

---

# T18 — Completed Trip

**Priority:** Must  
**Purpose:** menjadi entry point trust loop.  
**Entry:** completed booking.

### UI

- trip summary
- thank-you message
- review completion status

Two separate review cards:

- `Nilai Destinasi`
- `Nilai EO / Guide`

### Primary CTA

Review yang belum selesai pertama.

---

# T19 — Venue Rating

**Priority:** Must  
**Purpose:** mengumpulkan verified destination feedback.  
**Entry:** completed booking only.

### Minimum fields

- 1–5 rating
- optional text review
- optional structured tags later

### Copy

Jelaskan bahwa penilaian ditujukan pada tempat/destinasi, bukan EO.

### Primary CTA

`Kirim Penilaian Destinasi`

After success → T20 if EO review missing, else completed review state.

---

# T20 — EO / Guide Rating

**Priority:** Must  
**Purpose:** mengumpulkan feedback performa EO/guide secara terpisah.  
**Entry:** completed booking only.

### Fields

- 1–5 rating
- optional text review

### Primary CTA

`Kirim Penilaian EO`

### Success

Show review completion confirmation → T18/My Trips.

---

# T21 — Profile

**Priority:** Should

### Sections

- account identity
- phone/contact verification
- current preferences summary
- `Ubah Preferensi` / Retake Quiz
- privacy/data request
- logout

---

# T22 — Retake Quiz

Reuse `T04` components.

Difference:

- existing answers prefilled if desired
- copy `Perbarui jeda yang kamu butuhkan sekarang`
- result replaces current intent

---

# T23 — Complaint Form

**Priority:** Should / Must if complaint included in prototype  
**Entry:** eligible booking.

### Fields

- related booking fixed
- issue category high-level optional
- free-text description
- supporting evidence upload optional

Traveler **tidak menentukan Light / Heavy-A / Heavy-B**.

### Primary CTA

`Kirim Pengaduan`

### Success

Show complaint reference and expected next step.

---

# 5. EO Partner Screens

# EO01 — Partner Landing / Role Selection

**Priority:** Must

### Purpose

Memisahkan partner experience dari consumer experience.

### Layout

- JedaIn Partner branding
- EO / Travel Organizer card
- Pengelola Destinasi card
- login link

EO CTA → `EO02`
Destination CTA → `DP02`

---

# EO02 — EO Login / Register

**Priority:** Must

### Options

- Login partner
- `Daftar sebagai EO`

### Routing by state

- approved → EO05 Dashboard
- pending → EO04 Application Status
- rejected → EO04 with rejection
- no application → EO03

---

# EO03 — EO Application Wizard

**Priority:** Must

Stepper recommended:

1. Business Information
2. Legal Documents
3. Portfolio
4. Insurance / Required Docs
5. SOP Agreement
6. Review & Submit

### Persistent actions

- Save Draft
- Next

### Final CTA

`Submit Application`

### Validation

Inline, specific, file upload progress visible.

---

# EO04 — Application Status

**Priority:** Must

States:

### Pending review

- submitted date
- application ID
- summary
- disabled editing unless policy allows withdraw

### Rejected

- clear reason checklist/text
- CTA `Perbaiki Aplikasi`

### Approved

- success status
- CTA `Buka Dashboard`

---

# EO05 — Overview Dashboard

**Priority:** Must  
**Purpose:** orientasi bisnis dan next action.

### Desktop layout

Sidebar + top header + main grid.

### Above-fold widgets

- `+ Create Package`
- Live Packages
- Upcoming Sessions
- Total Bookings
- Average Rating

### Operational cards

- Packages Awaiting Approval
- Upcoming Sessions
- Recent Booking Activity
- Latest Demand Insight

### Empty new-EO state

> Kamu belum punya package. Lihat demand traveler atau mulai package pertamamu.

CTA:

- `Lihat Insight`
- `+ Create Package`

---

# EO06 — Demand Insights

**Priority:** Must  
**Purpose:** menunjukkan differentiation JedaIn: demand → product creation.

### Filters

- period
- departure area
- destination/region if data supports

### Widgets

- top healing intent
- budget distribution
- duration distribution
- departure-area distribution
- unmatched demand cards

### Unmet Demand card

Example:

> Nature + Batu + <Rp250k  
> 43 demand signals this period

CTA:

`Create Package from Insight`

### Important copy

Insight harus disebut agregat; jangan expose personal user data.

---

# EO07 — Packages List

**Priority:** Must

Tabs/filter by:

- Draft
- Pending Review
- Live
- Rejected
- Archived later

Columns/card:

- package name
- version
- destination
- price
- status
- sessions
- updated date

Primary CTA:

`+ Create Package`

---

# EO08 — Builder Step 1: Destination

**Priority:** Must

### Header

Stepper: `1 Destination / 2 Insight / 3 Itinerary / 4 Pricing / 5 Review`

### Destination card

- name
- verification level
- guide-ready badge
- base cost
- capacity
- location
- short facilities/activity summary

### Role-based filter

If EO `CONCEPT_ONLY`:

Only `verified + guide_ready` available.

Explain why unavailable destinations are hidden/disabled:

> Statusmu saat ini Concept Only, jadi package harus menggunakan destinasi dengan guide lokal yang siap.

### Primary CTA

`Gunakan Destinasi Ini`

---

# EO09 — Builder Step 2: Relevant Insight

**Priority:** Must

### Purpose

Bukan hanya dashboard data; berikan creative brief spesifik sebelum EO mendesain itinerary.

### Visible

- selected destination
- relevant demand summary
- budget target
- duration preference
- healing intent
- unmatched demand if applicable

### If created from insight

Highlight source insight:

> Kamu memulai package ini dari demand “Nature + Batu + <Rp250k”.

### Primary CTA

`Lanjut Susun Itinerary`

---

# EO10 — Builder Step 3: Itinerary

**Priority:** Must

### Fields

- package name
- short concept statement
- target segment
- duration
- activity timeline

Activity block:

- start time/order
- activity name
- duration
- description
- location/venue section if needed

Interaction:

- Add Activity
- Delete
- Reorder

### Primary CTA

`Lanjut ke Pricing`

### Validation

- activity minimum count if required
- total duration consistency
- required safety info later/review step

---

# EO11 — Builder Step 4: Pricing

**Priority:** Must

### Visible calculation

- destination base cost
- EO margin slider
- margin amount
- customer price
- platform deduction explanation
- estimated EO earning

### Margin

Bounded slider using centralized config.

Do not visually imply pending working range is permanent policy.

### Real-time interaction

Price recalculates without reload.

### Primary CTA

`Review Package`

---

# EO12 — Builder Step 5: Preview & Submit

**Priority:** Must

### Two-part layout

Left/main:

- traveler-facing preview

Right/sidebar:

- checklist completeness
- destination status
- guide rule
- margin validity

### Primary CTA

`Submit for Review`

### Secondary

`Save Draft`

---

# EO13 — Validation Error State

**Priority:** Must

Can be inline on EO12 or dedicated summary.

### Requirements

Every failed rule points to:

- exact field/rule
- why it failed
- navigation/edit link

Example:

> Capacity package 35 melebihi kapasitas destinasi 30.  
> `Perbaiki kapasitas`

No generic `Submission failed`.

---

# EO14 — Submission Status

**Priority:** Must

States:

- Pending admin review
- Approved
- Rejected

Rejected:

- list exact checklist reasons
- CTA `Edit & Resubmit`

Approved:

- publish/live state
- CTA `Create Session`

---

# EO15 — Package Detail / Version

**Priority:** Must

### Visible

- current live version
- draft/new version if exists
- sessions
- booking summary
- package performance lightweight

### Material edit

CTA `Edit Package` creates new Draft Version.

Explain:

> Booking lama tetap menggunakan versi yang dibeli.

---

# EO16 — Sessions List

**Priority:** Must

Columns:

- package
- date/time
- capacity
- booked/reserved
- remaining
- status

Primary CTA:

`+ Create Session`

---

# EO17 — Create / Edit Session

**Priority:** Must

Fields:

- package
- date
- time
- capacity
- booking cutoff optional
- departure/meeting point

### Validation

- package must be approved/live
- destination availability
- capacity rule

**PENDING:** whether destination must explicitly confirm before OPEN.

---

# EO18 — Bookings

**Priority:** Should

Table:

- booking ID
- session
- traveler display info limited to operational need
- participants
- payment status
- trip status

Do not expose unnecessary personal preference data.

---

# EO19 — Destinations Directory

**Priority:** Must

Cards/table:

- destination
- verification
- guide ready
- base cost
- capacity
- location

Filters by guide readiness/area.

---

# EO20 — Reviews

**Priority:** Should

- average EO rating
- verified reviews
- trend
- guide status implication explanation

---

# EO21 — Profile & Guide Status

**Priority:** Should

Show:

- business profile
- legal/insurance status
- `CONCEPT_ONLY` or `CERTIFIED_GUIDE`
- qualification/eligibility progress if available

Do not promise automatic upgrade if admin confirmation required.

---

# 6. Destination Partner Screens

# DP01 — Partner Landing Role Selection

Shared with EO01.

---

# DP02 — Destination Login / Register

**Priority:** Must

Routing:

- approved → DP05
- pending/rejected → DP04
- no application → DP03

---

# DP03 — Destination Application

**Priority:** Must

Stepper:

1. Management / Legal
2. Location
3. Facilities & Activities
4. Capacity & Base Cost
5. Guide Readiness
6. Review & Submit

Primary CTA:

`Submit untuk Verifikasi`

---

# DP04 — Verification Status

**Priority:** Must

States:

- pending field/manual verification
- rejected + specific reason
- BASIC verified
- guide readiness status

CTA rejected:

`Perbaiki & Ajukan Ulang`

---

# DP05 — Destination Overview

**Priority:** Must

Widgets:

- verification badge
- guide-ready status
- upcoming sessions using venue
- upcoming visitor capacity
- latest rating
- profile completeness

---

# DP06 — Destination Profile

**Priority:** Must

Operational profile fields; edits to verified-critical fields may require re-review depending policy.

**PENDING:** exact re-review rule.

---

# DP07 — Verification & Badge

**Priority:** Must

Explain separately:

- Verification Level: BASIC / PLUS
- Guide Capability: ready / not ready

Avoid representing them as one opaque backend state.

---

# DP08 — Schedule / Sessions

**Priority:** Must

Calendar/list:

- EO/package
- date
- expected participants
- capacity
- status

---

# DP09 — Capacity

**Priority:** Must

Show base venue capacity and session allocation.

**PENDING:** whether partner can directly edit already-published session capacity.

---

# DP10 — Reviews

**Priority:** Should

Venue-specific verified reviews only.

---

# DP11 — Profile

**Priority:** Should

Contact and account settings.

---

# 7. Admin Screens

# A01 — Admin Login

**Priority:** Must

Separate admin surface. No public admin registration.

---

# A02 — Admin Overview

**Priority:** Must

### Top queues

- EO applications pending
- Destination verifications pending
- Package approvals pending
- Critical complaints

### Secondary

- payment/booking issue summary
- recent audit activity

Primary contextual CTA:

Open highest-priority queue.

---

# A03 — EO Approval Queue

**Priority:** Must

Table:

- EO/business
- submission date
- completeness
- application status
- risk/flag if any

Click → A04.

---

# A04 — EO Application Review

**Priority:** Must

Two-column layout:

Main:

- business data
- portfolio
- documents

Sidebar:

- standard checklist
- approval decision

Actions:

- Approve
- Reject

Reject requires reason.

---

# A05 — Destination Verification Queue

**Priority:** Must

Columns:

- destination
- operator
- location
- submitted date
- verification progress

---

# A06 — Destination Verification Detail

**Priority:** Must

Sections:

- legal/management
- actual location evidence
- safety checklist
- claim/photo consistency
- capacity/base cost
- guide readiness

Decision:

- Reject + reason
- Approve BASIC
- Approve BASIC + guide_ready

PLUS status comes from later trust lifecycle, not initial application.

---

# A07 — Package Approval Queue

**Priority:** Must

Columns:

- package
- EO
- destination
- submitted date
- automatic validation status

---

# A08 — Package Review Checklist

**Priority:** Must

### Main preview

Traveler-facing package preview.

### Context panel

- EO status
- destination verification
- guide readiness
- pricing summary
- automatic validation result

### Manual checklist

- positioning/narrative
- safety/protocol completeness
- itinerary coherence
- other final checklist PENDING business team

Actions:

- Approve
- Reject

Reject reason mandatory.

---

# A09 — Bookings / Payments

**Priority:** Should

Table:

- booking
- traveler
- session
- payment state
- booking state
- fund state
- timestamps

Admin is inspection-first; manual state change requires audit reason.

---

# A10 — Complaint Queue

**Priority:** Should/Must if demoed

Columns:

- complaint ID
- booking
- submitted time
- unresolved duration
- current classification

---

# A11 — Complaint Classification

**Priority:** Should/Must if demoed

### Main

- complaint description
- booking/package context
- transaction/fund status
- EO and venue

### Required admin fields

1. responsible party: EO / Destination / Both
2. severity: Light / Heavy-A / Heavy-B
3. internal notes / evidence

### Warning

Display consequence before confirm:

- Heavy-A → downgrade
- Heavy-B → suspend

Primary CTA:

`Confirm Classification`

---

# A12 — Trust & Status

**Priority:** Should

Entity search/list:

- EO
- Destination

Show:

- current status
- rating evidence
- complaint evidence
- status history

Every manual status action requires reason and audit event.

---

# A13 — Audit Activity

**Priority:** Should

Timeline/table:

- actor
- action
- entity
- previous state
- new state
- timestamp
- reason/reference

---

# 8. Core Component Inventory

Komponen berikut sebaiknya dibuat reusable sejak low-fi karena muncul berulang.

## Traveler components

- Package Card
- Destination Badge
- Match Badge
- Session Card
- Rating Stars
- Status Banner
- Pending Payment Banner
- Upcoming Trip Card
- Search Bar
- Mood Chip
- Bottom Navigation

## Partner components

- Dashboard Metric Card
- Status Badge
- Data Insight Chart/Card
- Unmet Demand Card
- Stepper
- Validation Alert
- Approval Status Card
- Data Table
- Empty State

## Admin components

- Review Queue Table
- Standard Checklist
- Document Viewer Placeholder
- Decision Panel
- Audit Timeline
- Severity Badge

---

# 9. Status Vocabulary for UI

Backend enum tidak harus ditampilkan mentah kepada user.

| Internal State | Traveler-facing / Partner-facing label |
|---|---|
| PENDING_PAYMENT | Menunggu Pembayaran |
| PAID | Pembayaran Berhasil |
| UPCOMING | Trip Mendatang |
| COMPLETED | Selesai |
| EXPIRED | Pembayaran Kedaluwarsa |
| CANCELLED | Dibatalkan |
| PENDING_REVIEW | Sedang Ditinjau |
| REJECTED | Perlu Diperbaiki / Ditolak sesuai context |
| APPROVED | Disetujui |
| LIVE | Tayang |
| BASIC | Terverifikasi Dasar |
| PLUS | Terverifikasi Plus |
| CONCEPT_ONLY | Concept Only — UI needs explanatory tooltip |
| CERTIFIED_GUIDE | Certified Guide |

Status language untuk traveler harus sederhana; istilah internal hanya ditampilkan jika punya value dan dijelaskan.

---

# 10. Responsive Priority

## Traveler

Primary: mobile 390–430 px.

Secondary sanity check:

- tablet
- desktop web

On desktop, jangan sekadar memperlebar card tanpa batas. Gunakan centered content max-width dan multi-column catalog.

## Partner/Admin

Primary: 1280–1440 px.

Minimum supported design target MVP: 1024 px.

Mobile partner/admin tidak perlu full feature parity pada prototype kompetisi; minimal dapat menampilkan blocking notice jika workflow terlalu kompleks.

---

# 11. Accessibility Baseline

Wireframe harus sudah mengantisipasi:

- visible labels, bukan placeholder-only form,
- keyboard focus path partner/admin,
- CTA tidak dibedakan hanya berdasarkan warna,
- status icon + text,
- touch target mobile cukup besar,
- error terkait langsung dengan field,
- progress quiz/stepper dapat dipahami secara teks.

---

# 12. Prototype Golden Path

Prototype interaktif minimum harus memungkinkan cerita berikut tanpa dead end:

```text
Traveler
T02 Register
→ T03 Consent
→ T04 Quiz
→ T05 Recommendation
→ T08 Package Detail
→ T09 Session
→ T10 Checkout
→ T13 Payment
→ T14 Success

EO
EO05 Dashboard
→ EO06 Insight
→ EO08 Destination
→ EO09 Insight Context
→ EO10 Itinerary
→ EO11 Pricing
→ EO12 Review
→ EO14 Pending

Admin
A02 Dashboard
→ A07 Package Queue
→ A08 Review
→ Approve

Traveler
Package now LIVE / booking context
→ Completed Trip
→ T19 Venue Review
→ T20 EO Review
```

### Additional must-demo exception

`Traveler attempts second checkout while pending payment exists → T12 Continue/Cancel old payment.`

Ini menunjukkan bahwa prototype tidak hanya happy path tetapi memahami state transaksi.

---

# 13. Figma / Design File Structure Recommendation

Saat masuk Figma, gunakan struktur page:

```text
00 Cover & Notes
01 Foundations
02 Components
03 Traveler — Low Fi
04 EO — Low Fi
05 Destination — Low Fi
06 Admin — Low Fi
07 Prototype Golden Flow
08 Hi Fi — Traveler
09 Hi Fi — Partner
10 Hi Fi — Admin
```

Naming frame:

`T06 / Home / Default`

`T06 / Home / Pending Payment`

`T06 / Home / Upcoming Trip`

`EO14 / Submission Status / Rejected`

Jangan memberi nama frame seperti `Frame 128` atau `Homepage final final 2`.

---

# 14. Wireframe Build Order — LOCKED

## Sprint W1 — Traveler onboarding & discovery

1. T02 Login/Register
2. T03 Consent
3. T04 Quiz
4. T05 Recommendation
5. T06 Home
6. T07 Explore
7. T08 Package Detail
8. T09 Session

## Sprint W2 — Checkout/payment

1. T10 Checkout
2. T11 Contact Verification
3. T12 Pending Payment Resolution
4. T13 Payment
5. T14 Success
6. T15 Failed/Expired
7. T16 My Trips
8. T17 Upcoming Trip
9. T18–T20 Reviews

## Sprint W3 — EO differentiation

1. EO05 Dashboard
2. EO06 Insight
3. EO08–EO12 Builder
4. EO13 Validation Error
5. EO14 Status
6. EO16–EO17 Sessions

## Sprint W4 — Trust operator

1. A02 Admin Dashboard
2. A07 Queue
3. A08 Package Review
4. A06 Destination Verification
5. DP03–DP05 Destination onboarding

Supporting screens follow afterward.

---

# 15. Open UI/Product Decisions

These are intentionally unresolved and must not be silently invented during visual design:

1. Exact quiz wording/options/order.
2. Match threshold and whether match percentage should be shown numerically to traveler.
3. Payment timeout exact duration; current proposal 15 minutes.
4. Selected payment gateway and how much gateway UI is embedded vs redirected.
5. Phone verification rule: all accounts vs first checkout only.
6. Cancellation/refund wording and cutoffs.
7. Participant count rule: fixed package/session vs user-selectable group size.
8. Whether traveler can save/favorite package in MVP.
9. Final mood categories on Home.
10. Sorting default Explore.
11. Exact admin manual package checklist.
12. Destination re-verification rule after editing critical profile fields.
13. Destination confirmation requirement before EO session becomes OPEN.
14. Whether match explanation uses percentage, tags, or plain-language reasons only.
15. Whether external EO gets complete or limited Insight dashboard in pilot.

---

# 16. Definition of Wireframe Ready

A screen is ready to move from low-fi to high-fi only if:

- purpose is known,
- entry condition is known,
- all required information is listed,
- primary CTA is known,
- secondary actions are known,
- destination of actions is known,
- loading/error/empty state is known when relevant,
- role permission is known,
- no unresolved business rule is being disguised as visual detail,
- screen is connected into the prototype flow.

---

# 17. Next Artifact

Setelah low-fidelity Traveler + EO core disetujui tim, buat:

**`docs/DESIGN_SYSTEM.md`**

yang mendefinisikan:

- brand personality,
- typography,
- color semantics,
- spacing,
- radius,
- elevation,
- buttons,
- form controls,
- cards,
- status badges,
- tables,
- charts,
- accessibility rules.

High-fidelity UI hanya dimulai setelah wireframe core tidak lagi berubah secara struktural.