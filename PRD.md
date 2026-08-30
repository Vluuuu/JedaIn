# PRD JedaIn

**Nama Produk:** JedaIn  
**Kompetisi:** HoloBiz – ICT Business Plan Competition, HOLOGY 9.0, Universitas Brawijaya  
**Subtema:** Ekonomi Digital  
**Tema Besar:** *Bloom Beyond: Where Ideas Take Root and Reach Further*  
**Versi:** 0.3 — Product Flow Revision  
**Tanggal:** 30 Agustus 2026  
**Status:** Working PRD — keputusan yang belum final ditandai **PENDING / DISCUSSION**

> Dokumen ini menjadi source of truth kebutuhan produk JedaIn. Detail alur antar-layar, state, decision node, dan exception flow didokumentasikan terpisah di [`docs/SYSTEM_FLOW.md`](docs/SYSTEM_FLOW.md).

---

# 0. Revision Summary — v0.3

Perubahan utama dibanding v0.2:

1. **Tidak ada guest mode untuk traveler.** Pengguna wajib memiliki akun sebelum menggunakan pengalaman personal JedaIn.
2. **Register lebih dahulu, kemudian onboarding quiz wajib** untuk akun traveler baru.
3. Menghapus konsep ambigu "sudah punya preferensi" dan menggantinya dengan lifecycle onboarding yang eksplisit.
4. Traveler dapat **mengubah/mengulang quiz** setelah onboarding selesai; rekomendasi mengutamakan quiz terbaru sebagai current intent.
5. Menambahkan **pending payment guard**: traveler yang masih memiliki satu pembayaran aktif tidak dapat membuat pembayaran baru sebelum melanjutkan, membatalkan, atau menunggu pembayaran lama expired.
6. Menambahkan **payment countdown / expiration**, reservation slot, release capacity, dan state transaksi yang lebih eksplisit.
7. Memisahkan surface produk menjadi:
   - Traveler Portal
   - Partner Portal (EO + Mitra Destinasi)
   - Admin Portal
   Identity/backend tetap dapat digunakan lintas role.
8. Menambahkan lifecycle pendaftaran EO/partner yang lebih formal.
9. Memperjelas homepage traveler sebagai personalized discovery surface, termasuk state pending payment dan upcoming trip.
10. Menjadikan `docs/SYSTEM_FLOW.md` sebagai dokumen operasional flow sebelum wireframe/UI dibuat.

---

# A. Product Overview

JedaIn adalah ekosistem digital tiga sisi yang menghubungkan:

1. **Wisatawan** — Young Professional Burnout (24–32 tahun) sebagai target primer serta Mahasiswa/Fresh Grad Self-Explorer (19–25 tahun) sebagai target sekunder.
2. **EO / Travel Organizer** — perancang pengalaman wellness tourism berbasis demand insight.
3. **Mitra Destinasi** — pengelola destinasi lokal tier-2/tier-3 yang telah melalui proses verifikasi kualitas, keamanan dasar, dan kesiapan operasional.

Platform juga memiliki **Admin/Internal Team** sebagai trust operator untuk verifikasi, approval, dispute, dan status pihak-pihak di ekosistem.

## A.1 Positioning Statement

> **Platform yang membuka potensi destinasi lokal lewat kreativitas EO (didukung data insight), sambil menjamin kualitas & keberlanjutan lewat sistem verifikasi mitra destinasi.**

## A.2 Core Product Loop

`Demand Wisatawan → Insight → EO Membuat Experience → Verifikasi & Approval → Marketplace → Booking → Trip → Rating/Trust → Insight Baru`

JedaIn bukan sekadar direktori destinasi maupun marketplace tiket. Produk utamanya adalah **curated wellness experience** yang dirancang EO berdasarkan sinyal demand dan dijalankan bersama destinasi terverifikasi.

---

# B. Problem & Opportunity

## B.1 Demand Side

Urban Gen Z dan Milenial Surabaya–Malang jarang mempertimbangkan wellness tourism di destinasi tier-2/tier-3. Discovery banyak bergantung pada Instagram/TikTok yang bersifat acak, tidak terstruktur, dan tidak selalu menunjukkan kualitas, keamanan, atau kesesuaian pengalaman terhadap kebutuhan personal pengguna.

## B.2 Supply Side

Destinasi lokal mempunyai modal alam dan aktivitas yang berpotensi dijual, namun belum banyak pihak yang mengemasnya sebagai wellness experience yang menarik dan konsisten. EO kecil juga tidak selalu memiliki akses terhadap demand insight yang cukup untuk merancang paket berdasarkan kebutuhan nyata.

## B.3 Opportunity

JedaIn menjembatani tiga sisi tersebut melalui:

- mandatory onboarding quiz dan demand insight,
- rule-based recommendation,
- Trip Builder untuk EO,
- sistem verifikasi destinasi,
- booking, pembayaran, dan capacity reservation,
- rating terverifikasi dan trust lifecycle.

---

# C. Objectives & MVP Scope

## C.1 Business Objectives — MVP

| Objective | Target |
|---|---|
| Validasi model tiga sisi | Minimal 1 EO pilot dan 1 paket wellness tourism yang dapat ditransaksikan |
| Validasi demand | Membuktikan traveler bersedia memilih/booking paket wellness tourism tier-2/tier-3 |
| Minimum viable trust | Verifikasi mitra + approval EO berjalan secara hybrid manual/otomatis |
| Extensible architecture | Struktur siap multi-EO/tiering walau MVP masih sederhana |

## C.2 Target Demo Kompetisi

Minimal:

- 1 EO pilot,
- 1 paket wellness tourism lengkap,
- 1–2 Mitra Destinasi berstatus **Terverifikasi Dasar**,
- minimal 1 mitra pilot berstatus **Siap sebagai Guide**,
- demo end-to-end:

`Register → Mandatory Quiz → Recommendation → Insight → EO Builder → Admin Approval → Catalog → Session → Checkout → Payment → Trip → Rating`

## C.3 Market Sizing

- TAM: ~630.000 orang.
- SAM: ~95.000–125.000 orang.
- SOM Tahun 1: 500–1.200 orang/tahun.
- SOM MVP: **PENDING**.

---

# D. Product Surfaces, Roles & Identity

## D.1 Role Model

Role utama:

- `TRAVELER`
- `EO`
- `DESTINATION_PARTNER`
- `ADMIN`

Satu identity dapat memiliki lebih dari satu role jika dibutuhkan secara internal.

Contoh:

- anggota tim internal: `ADMIN + EO`,
- traveler yang kemudian mendaftar sebagai EO: identity yang sama dapat memperoleh role `EO` setelah approval.

## D.2 Portal Architecture — LOCKED FOR PRODUCT DESIGN

### Traveler Portal

Surface consumer utama.

Target production:

`jedain.id`

Karakter UI:

- mobile-first,
- visual dan discovery-oriented,
- sederhana dan personal,
- fokus recommendation, catalog, booking, trip, review.

### Partner Portal

Surface operasional untuk EO dan Mitra Destinasi.

Target production:

`partner.jedain.id`

Karakter UI:

- desktop/tablet-first,
- SaaS dashboard,
- data-driven,
- workflow/form heavy.

EO dan Mitra Destinasi menggunakan entry portal yang sama tetapi dashboard/menu mengikuti role.

### Admin Portal

Surface internal JedaIn.

Target production:

`admin.jedain.id`

Karakter UI:

- desktop-first,
- review queue,
- checklist,
- trust & dispute management,
- audit-oriented.

### Implementation Note

Untuk MVP seluruh portal dapat tetap berada pada satu codebase dan domain yang sama menggunakan route terpisah (`/`, `/partner`, `/admin`) jika lebih sederhana. Pemisahan subdomain adalah product surface boundary, **bukan kewajiban memisahkan backend/database**.

---

# E. Core User Flows

Detail lengkap: [`docs/SYSTEM_FLOW.md`](docs/SYSTEM_FLOW.md).

## E.1 Traveler — LOCKED BASE FLOW

`Landing → Login/Register → [New User: Consent → Mandatory Quiz] → Recommendation → Home/Catalog → Trip Detail → Choose Session → Checkout → Pending-Payment Check → Payment → Trip → Completed → Venue Rating + EO Rating`

Rules utama:

- tidak ada guest mode,
- akun baru wajib menyelesaikan onboarding quiz,
- existing user yang onboarding-nya sudah selesai langsung masuk Home,
- quiz dapat diulang/diperbarui dari profile/home,
- satu traveler hanya boleh memiliki **maksimal satu active pending payment** pada satu waktu,
- browsing tetap diperbolehkan saat ada pending payment; pembuatan payment baru yang diblok.

## E.2 EO

`Partner Login/Register → EO Application → Admin Review → Approved → Dashboard → Data Insight → Create Package → Select Verified Destination → Itinerary → Pricing → Preview → Automatic Validation → Admin Review → Live Package → Create/Manage Sessions → Manage Bookings`

## E.3 Mitra Destinasi

`Partner Login/Register → Destination Application → Manual Verification → Badge → Availability/Capacity → Used by EO Package → Session Schedule → Rating → Upgrade/Downgrade/Suspend`

## E.4 Admin

`Admin Login → Review Queue → EO Approval / Destination Verification / Package Review → Trust Monitoring → Complaint Classification → Refund/Resolution → Audit Trail`

---

# F. Functional Requirements

# FR-1 — Traveler Authentication, Onboarding & Discovery

## FR-1.0 Authentication — UPDATED

Traveler dapat register/login melalui:

1. **Google OAuth** — recommended primary option untuk friction rendah.
2. **Nomor HP + OTP** melalui SMS/WhatsApp.
3. **Email** sebagai alternatif; MVP disarankan memakai OTP/magic link jika digunakan agar tidak menambah kompleksitas password management.

Rules:

- **Tidak ada guest account / guest checkout.**
- Account linking harus mencegah duplikasi identity yang tidak disengaja.
- Sesi login persistent di device.
- Nomor HP terverifikasi wajib tersedia sebelum checkout jika diperlukan untuk kontak trip/notifikasi penting.

## FR-1.1 Mandatory First-Time Onboarding — UPDATED

Akun traveler baru harus melalui:

`Account Created → Explicit Consent → Onboarding Quiz → Recommendation Result → Home`

Tidak tersedia tombol `Skip Quiz` pada first-time onboarding MVP karena quiz adalah bagian inti value proposition dan demand collection JedaIn.

Lifecycle onboarding minimum:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

Sistem tidak boleh bergantung pada istilah abstrak "user sudah punya preferensi"; routing menggunakan status onboarding yang eksplisit.

Jika user menutup aplikasi saat quiz belum selesai, login berikutnya mengembalikan user ke proses onboarding yang belum selesai.

## FR-1.2 Onboarding Quiz

Maksimal 5–8 pertanyaan, target waktu pengisian <3 menit.

Atribut minimum:

- healing/activity intent,
- budget range,
- durasi,
- lokasi keberangkatan,
- ukuran grup bila digunakan untuk matching.

## FR-1.3 Consent Data

Consent wajib dan eksplisit sebelum preference quiz disimpan.

- checkbox tidak pre-checked,
- wording harus jelas,
- penyimpanan mengikuti requirement PDP.

## FR-1.4 Update / Retake Quiz — NEW

Traveler dengan onboarding `COMPLETED` dapat mengubah atau mengulang quiz.

Rules:

- hasil terbaru menjadi **current intent** utama,
- histori preference boleh disimpan untuk analitik agregat sesuai consent/retention policy,
- perubahan quiz memperbarui recommendation berikutnya.

## FR-1.5 Recommendation Engine

MVP menggunakan **rule-based recommendation**, bukan ML/AI.

Prioritas sinyal:

1. latest quiz/current intent,
2. behavior di dalam JedaIn jika data tersedia (search, view, save, booking history),
3. departure area/location preference,
4. rating/popularity sebagai tie-breaker/fallback.

Current intent dari quiz harus memiliki bobot lebih tinggi daripada historical behavior lama.

## FR-1.6 Cold Start & Fallback — UPDATED

Karena first-time quiz wajib, normal cold-start setelah registrasi selalu memiliki quiz result.

Fallback tetap dibutuhkan jika tidak ada paket dengan match memadai:

- top-rated,
- popular by bookings,
- relevant departure area,
- editorial/featured package.

**PENDING:** urutan fallback final dan minimum match threshold.

## FR-1.7 Unmatched Preference Logging

Jika tidak ada paket memenuhi threshold:

1. traveler tetap mendapat fallback recommendation,
2. backend mencatat pola kebutuhan yang belum terpenuhi.

Data minimum:

- kombinasi preference,
- timestamp,
- frequency cluster/pola serupa.

Output menjadi **Unmet Demand Insight** untuk EO/admin.

## FR-1.8 External Trend Data — ROADMAP

JedaIn **tidak membaca personal Google Search History pengguna**.

Roadmap dapat menggunakan data trend publik/agregat sebagai external market signal untuk EO, terpisah dari data pribadi traveler.

## FR-1.9 Traveler Catalog

Traveler dapat melihat semua package `LIVE`.

Minimum filters:

- budget,
- duration,
- departure/location,
- destination.

Search di dalam JedaIn dapat menjadi behavioral signal setelah jumlah data mencukupi.

## FR-1.10 Trip Detail

Minimum informasi:

- nama package,
- description/value proposition,
- itinerary,
- price,
- EO/guide,
- destination,
- verification badge,
- upcoming sessions,
- capacity/remaining slot,
- cancellation/refund policy.

---

# FR-2 — EO Partner & Trip Builder

## FR-2.1 EO Portal & Authentication — UPDATED

EO menggunakan Partner Portal, bukan UI login traveler.

Target surface:

`partner.jedain.id`

EO dapat:

- login jika sudah approved/terdaftar,
- memulai pendaftaran sebagai EO baru.

Identity backend dapat tetap shared dengan traveler tetapi akses dashboard menggunakan role/permission.

## FR-2.2 EO Application Lifecycle — UPDATED

EO eksternal wajib menyediakan:

- informasi dasar usaha,
- legalitas dasar,
- portfolio pengalaman,
- contact person,
- bukti asuransi liability sesuai keputusan business/legal,
- persetujuan SOP/standar operasional JedaIn.

Application states:

- `DRAFT`
- `SUBMITTED`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`

Jika rejected:

- alasan wajib spesifik,
- data aplikasi dapat diperbaiki,
- EO dapat re-apply tanpa membuat identity baru.

## FR-2.3 EO Dashboard

Minimum navigation MVP:

- Overview
- Insights
- Packages
- Sessions
- Bookings
- Destinations
- Reviews
- Profile

Primary CTA:

`+ Create Package`

Overview minimum menampilkan:

- live packages,
- upcoming sessions,
- booking summary,
- average rating,
- pending approval,
- latest demand insight.

## FR-2.4 Data Insight

EO dapat melihat creative brief dari:

- aggregate onboarding quiz,
- unmatched preference,
- internal behavioral signal jika sudah tersedia.

Minimum visualization:

- top activity/healing intent,
- budget distribution,
- duration distribution,
- departure area,
- unmet demand cards.

Recommended interaction:

`Create Package from Insight`

**PENDING:** apakah seluruh EO langsung memiliki akses insight lengkap atau limited pada fase pilot.

## FR-2.5 Select Destination

EO hanya dapat memilih destination dengan verification level:

- `BASIC`, atau
- `PLUS`.

Jika EO guide status = `CONCEPT_ONLY`, destination harus `guide_ready = true`.

Rule wajib divalidasi backend, bukan hanya frontend.

## FR-2.6 Trip Builder

Builder menggunakan stepper minimum:

1. Destination
2. Relevant Insight
3. Itinerary
4. Pricing
5. Review & Submit

## FR-2.7 Pricing

Formula MVP:

`Customer Price = Destination Base Cost + EO Margin`

Platform commission diambil secara **deductive dari EO Margin**, bukan menambahkan biaya baru ke traveler.

- Mitra menerima 100% base cost pada MVP.
- Working range margin EO awal: 10–25%.
- **PENDING:** lower/upper bound final.
- **PENDING:** flat platform commission rate.

Semua parameter bisnis disimpan pada konfigurasi terpusat, bukan tersebar hardcoded.

## FR-2.8 Automatic Validation

Sistem memvalidasi sebelum admin review:

- required field lengkap,
- destination aktif,
- guide rule valid,
- capacity masuk akal,
- margin dalam bound.

Jika gagal, submission ditolak otomatis dengan alasan spesifik.

## FR-2.9 Manual Package Approval

Jika automatic validation lolos, admin review berdasarkan checklist standar.

Result:

- `APPROVED`
- `REJECTED`

Reject wajib memiliki alasan spesifik.

## FR-2.10 Revision & Resubmit

Draft yang rejected dapat diedit dan resubmit.

Setiap resubmit selalu melalui automatic validation dan manual review lagi.

## FR-2.11 Editing Live Package

Material changes pada package `LIVE` tidak boleh langsung mengubah package version yang sudah dibeli traveler.

Material changes minimum:

- price,
- destination,
- main itinerary,
- duration,
- safety information,
- EO/guide.

Flow:

`Live Version → New Draft Version → Re-Approval → Publish New Version`

Booking lama menyimpan snapshot/version yang berlaku saat transaksi.

## FR-2.12 EO Guide Status

Status:

- `CONCEPT_ONLY`
- `CERTIFIED_GUIDE`

EO baru default `CONCEPT_ONLY`.

Upgrade:

- rating/minimum trip memicu eligibility,
- admin tetap harus mengonfirmasi.

Downgrade/suspend mengikuti trust rules.

**PENDING:** rating threshold dan minimum completed trips.

---

# FR-3 — Destination Partner & Verification

## FR-3.1 Partner Portal

Mitra Destinasi menggunakan Partner Portal yang sama dengan EO tetapi dashboard/permission mengikuti role `DESTINATION_PARTNER`.

Partner landing harus menawarkan entry role yang jelas:

- EO / Travel Organizer
- Pengelola Destinasi

## FR-3.2 Destination Registration

Data minimum:

- legalitas/pengelolaan,
- dokumentasi lokasi,
- fasilitas,
- aktivitas,
- capacity,
- base cost,
- kesiapan SDM guide.

## FR-3.3 Manual Verification — MVP

Untuk 1–2 pilot destination, tim internal melakukan verifikasi manual terhadap:

- legalitas/pengelolaan,
- keamanan dasar,
- kesesuaian klaim/foto,
- kesiapan guide.

## FR-3.4 Destination Status Model

Verification dimension:

- `BASIC`
- `PLUS`

Guide dimension:

- `guide_ready = false`
- `guide_ready = true`

UI dapat menghasilkan badge:

- Terverifikasi Dasar
- Terverifikasi Dasar + Siap sebagai Guide
- Terverifikasi Plus
- Terverifikasi Plus + Siap sebagai Guide

## FR-3.5 Failed Verification & Re-Apply

Mitra yang gagal mendapat alasan spesifik dan dapat re-apply setelah memperbaiki kekurangan.

## FR-3.6 Rating & Review

Hanya traveler dengan booking `COMPLETED` yang dapat memberi review.

Rules:

- maksimal 1 venue review per completed booking,
- maksimal 1 EO/guide review per completed booking,
- kedua review dipisah,
- review selalu terhubung ke booking.

## FR-3.7 Upgrade / Downgrade / Suspend

Rule awal:

- repeated low rating → downgrade,
- verified Heavy-A complaint → downgrade,
- verified Heavy-B complaint → suspend.

Threshold harus configurable.

## FR-3.8 Suspension with Future Bookings

Jika EO/destination di-suspend dan masih memiliki booking masa depan:

1. pihak terkait tidak menerima booking baru,
2. affected bookings → `NEEDS_ADMIN_RESOLUTION`,
3. admin menentukan replacement/cancellation/refund/manual resolution,
4. traveler menerima notifikasi.

**DISCUSSION:** Heavy-B apakah otomatis cancel/refund atau selalu admin review dulu.

---

# FR-4 — Trip Package, Session & Capacity

## FR-4.1 Package vs Session

### Trip Package

Template experience yang dibuat EO.

Minimum fields:

- title,
- description,
- destination,
- itinerary,
- base pricing rule,
- current approved version,
- status.

### Trip Session

Keberangkatan konkret dari suatu package.

Minimum fields:

- `package_id`
- `start_at`
- `end_at`
- `capacity`
- `reserved_slots`
- `booked_slots`
- `status`

Traveler melakukan booking terhadap **Trip Session**, bukan template package secara abstrak.

## FR-4.2 Capacity Source of Truth

Capacity session harus konsisten dengan batas venue dan konfigurasi EO/package.

Frontend tidak boleh menjadi source of truth capacity.

## FR-4.3 Atomic Capacity Reservation

Ketika traveler membuat booking pending payment:

- slot di-reserve secara atomic,
- dua transaksi tidak boleh merebut slot terakhir yang sama,
- reservation memiliki expiration mengikuti payment expiration.

## FR-4.4 Session Status

Minimum:

- `DRAFT`
- `OPEN`
- `FULL`
- `CLOSED`
- `CANCELLED`
- `COMPLETED`

---

# FR-5 — Booking, Payment & Pending-Payment Guard

## FR-5.1 Booking Creation

Sebelum membuat booking/payment baru, backend wajib mengecek apakah traveler memiliki **active pending payment** yang belum expired/cancelled.

Jika tidak ada:

1. validate session availability,
2. reserve capacity,
3. create booking `PENDING_PAYMENT`,
4. create payment attempt,
5. set `payment_expires_at`,
6. tampilkan payment page + countdown.

## FR-5.2 One Active Pending Payment per Traveler — NEW / LOCKED

Pada MVP, satu traveler hanya boleh memiliki **maksimal satu active pending payment**.

Jika traveler mencoba checkout baru ketika active pending payment masih berlaku:

- jangan buat payment baru,
- tampilkan blocking resolution modal/page,
- user dapat memilih:
  - **Lanjutkan Pembayaran**, atau
  - **Batalkan Pesanan**.

Traveler **tetap boleh browsing/search/detail package**; pembatasan hanya berlaku pada pembuatan checkout/payment baru.

## FR-5.3 Payment Countdown / Expiration — NEW

Payment page wajib menampilkan countdown berdasarkan server-side `payment_expires_at`.

Contoh UX:

`Selesaikan pembayaran dalam 08:42`

Durasi timeout harus configurable.

**PENDING default proposal:** 15 menit.

Server time adalah source of truth; countdown frontend hanya representasi visual.

## FR-5.4 Continue Existing Payment

Jika masih valid, traveler dapat membuka kembali existing pending booking/payment dari:

- Home pending-payment banner,
- My Trips / Orders,
- blocking checkout resolution.

## FR-5.5 Cancel Pending Booking

Jika traveler cancel:

`PENDING_PAYMENT → CANCELLED`

Sistem wajib:

- invalidate/close payment attempt jika didukung gateway,
- release reserved slot secara atomic,
- mengizinkan traveler membuat checkout baru.

## FR-5.6 Expired Payment

Saat `payment_expires_at` terlewati:

`PENDING_PAYMENT → EXPIRED`

Sistem wajib:

- payment tidak dianggap valid untuk checkout lama,
- release reserved slot,
- mengizinkan payment/booking baru,
- tidak membuat double charge jika callback terlambat tiba; reconciliation mengikuti gateway status/idempotency policy.

## FR-5.7 Payment Idempotency

Retry jaringan/callback tidak boleh menyebabkan:

- duplicate booking,
- duplicate charge,
- duplicate capacity decrement.

Payment/booking creation wajib menggunakan idempotency control.

## FR-5.8 Payment Success

Jika payment terverifikasi sukses sebelum expiry sesuai policy gateway:

`PENDING_PAYMENT → PAID`

Reserved slot menjadi booked slot.

## FR-5.9 Failed Payment

Payment failure harus memiliki state eksplisit dan pesan user-facing yang jelas.

User dapat retry sesuai gateway/policy tanpa membuat duplicate booking yang tidak perlu.

---

# FR-6 — Trip Execution, Reviews & Trust

## FR-6.1 Trip Completion

Session/traveler booking dapat masuk `COMPLETED` setelah trip selesai sesuai operational confirmation policy.

Review hanya dibuka untuk booking `COMPLETED`.

## FR-6.2 Separate Ratings

Traveler memberikan dua rating terpisah:

1. Venue/Destination Rating
2. EO/Guide Rating

UI harus menjelaskan bahwa keduanya mengevaluasi pihak berbeda.

## FR-6.3 Complaint Submission

Traveler dapat submit complaint dengan deskripsi bebas.

Traveler tidak memilih sendiri severity final.

## FR-6.4 Complaint Classification

Admin menentukan:

- `LIGHT`
- `HEAVY_A`
- `HEAVY_B`

serta pihak bertanggung jawab:

- EO
- Mitra
- Keduanya

## FR-6.5 Trust Enforcement

Setelah complaint berat terverifikasi, sistem mengeksekusi downgrade/suspend sesuai rule yang berlaku dan mencatat audit trail.

---

# FR-7 — Payment Holding, Split & Dispute

## FR-7.1 Collector Model

Platform collect pembayaran melalui payment gateway pihak ketiga berizin (contoh: Midtrans/Xendit), bukan menyimpan data kartu/pembayaran sensitif sendiri.

## FR-7.2 Holding Period

Dana ditahan H+1 s.d. H+3 pasca-trip sebelum split/payout sebagai buffer dispute/refund.

## FR-7.3 Fund State Tracking

Minimum financial state:

- `PAID`
- `HELD`
- `REFUNDED`
- `SPLIT`
- `PAID_OUT`

Sistem menyimpan apakah dana sudah di-split untuk menentukan jalur dispute.

## FR-7.4 Split Rules — MVP

- Mitra menerima 100% base cost.
- EO menerima margin setelah potongan platform.
- EO internal: seluruh margin menjadi milik platform.

## FR-7.5 Audit Trail

Setiap perubahan state finansial mencatat:

- timestamp,
- actor/system source,
- previous state,
- new state,
- reference transaction/payment.

---

# G. Homepage & Navigation Requirements

## G.1 Public Landing — Traveler

Tujuan: menjelaskan value JedaIn dan mengarahkan user membuat akun.

Recommended sections:

1. Hero + CTA `Mulai Cari Jedamu`
2. Value proposition
3. Featured wellness experiences
4. How it works: `Quiz → Match → Book → Jeda`
5. Verified destination/trust explanation
6. Entry link menuju `JedaIn Partner`

## G.2 Logged-in Traveler Home — UPDATED

Primary navigation MVP:

- Home
- Explore
- My Trips
- Profile

Recommended content priority:

1. critical state banner jika ada pending payment,
2. upcoming trip card jika ada,
3. personalized recommendation dari quiz terbaru,
4. search,
5. explore by mood/intent,
6. popular this week,
7. relevant departure area,
8. verified destinations.

### Pending Payment Home State

Jika ada active pending payment, Home menampilkan banner seperti:

> Selesaikan pembayaranmu — 08:42 tersisa

CTA:

`Lanjutkan Pembayaran`

## G.3 EO Navigation

- Overview
- Insights
- Packages
- Sessions
- Bookings
- Destinations
- Reviews
- Profile

## G.4 Destination Partner Navigation

MVP minimum:

- Overview
- Destination Profile
- Verification
- Sessions/Schedule
- Capacity
- Reviews
- Profile

## G.5 Admin Navigation

- Overview
- EO Approvals
- Destination Verification
- Package Approvals
- Bookings/Payments
- Complaints
- Trust & Status
- Audit/Activity

---

# H. Non-Functional Requirements

## H.1 Privacy & PDP

- explicit consent sebelum penyimpanan preference,
- data terenkripsi in-transit dan at-rest,
- request akses/hapus data dapat dilakukan manual melalui admin pada MVP,
- financial retention mengikuti aturan yang berlaku.

## H.2 Security

- payment-sensitive data tidak disimpan oleh JedaIn,
- legal documents hanya dapat diakses role admin berwenang,
- role-based access control untuk Traveler/EO/Mitra/Admin,
- server-side authorization wajib; UI hiding bukan security boundary.

## H.3 Performance

- rule-based recommendation target <3 detik,
- pricing calculator real-time tanpa reload,
- critical booking/payment flow target reliability tinggi dan mengikuti SLA payment gateway.

## H.4 Consistency & Concurrency

- atomic capacity reservation,
- idempotent booking/payment,
- server-side source of truth untuk payment expiry,
- venue/session status berubah harus terefleksi pada Builder/checkout sebelum commit.

## H.5 Extensibility

- multi-EO ready,
- tier fields dapat disiapkan tetapi inactive di MVP,
- training guide manual dapat diganti e-learning di masa depan tanpa mengganti status model utama.

## H.6 UX

- Bahasa Indonesia,
- tone Gen Z/Milenial namun tetap terpercaya,
- badge/status harus mudah dipahami,
- onboarding <3 menit,
- traveler mobile-first,
- partner/admin desktop-first.

---

# I. Core Domain States

## I.1 Traveler Onboarding

`NOT_STARTED → IN_PROGRESS → COMPLETED`

## I.2 EO Application

`DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED | REJECTED`

## I.3 Package

`DRAFT → SUBMITTED → AUTO_REJECTED | PENDING_REVIEW → APPROVED → LIVE`

Live edit:

`LIVE → NEW_DRAFT_VERSION → PENDING_REVIEW → NEW_LIVE_VERSION`

## I.4 Session

`DRAFT → OPEN → FULL/CLOSED → COMPLETED`

Exceptional:

`OPEN/FULL → CANCELLED`

## I.5 Booking

`PENDING_PAYMENT → PAID → CONFIRMED/UPCOMING → COMPLETED`

Exceptional:

- `PENDING_PAYMENT → CANCELLED`
- `PENDING_PAYMENT → EXPIRED`
- `PAID → CANCELLED/REFUNDED` sesuai policy
- affected trust incident → `NEEDS_ADMIN_RESOLUTION`

## I.6 Payment/Fund

Payment attempt:

`PENDING → SUCCEEDED | FAILED | CANCELLED | EXPIRED`

Fund lifecycle:

`PAID → HELD → SPLIT → PAID_OUT`

atau:

`PAID/HELD → REFUNDED`

---

# J. MVP Priority

## Must Have

- traveler authentication tanpa guest,
- mandatory quiz + consent,
- rule-based recommendation,
- catalog + trip detail,
- package/session model,
- EO onboarding/application,
- EO Insight dashboard,
- Trip Builder,
- automatic validation + admin approval,
- destination verification/badge,
- booking + capacity lock,
- pending payment guard + countdown/expiry,
- payment idempotency,
- completed-booking verified reviews,
- separate venue & EO rating.

## Simplified / Manual Allowed in MVP

- destination field verification,
- EO certification confirmation,
- complaint classification,
- appeal,
- payout/split execution jika payment gateway sandbox tidak mendukung full production flow,
- destination training.

## Not MVP / Roadmap

- personal Google Search history ingestion,
- ML/AI recommendation,
- advanced EO tiering UI,
- public external trend integration,
- full e-learning guide certification,
- complex automated appeal engine,
- advanced real-time date/availability filters.

---

# K. Open Decisions / Team Discussion

Keputusan berikut belum boleh diasumsikan developer sebagai final:

1. Exact quiz questions dan scoring weight.
2. Minimum recommendation match threshold.
3. Fallback ordering: rating vs bookings vs editorial.
4. Exact EO margin lower/upper bounds.
5. Platform flat commission rate MVP.
6. Certified Guide rating threshold + minimum trip.
7. Terverifikasi Plus threshold.
8. Default payment expiration duration — proposal awal **15 menit**.
9. Payment gateway final: Midtrans/Xendit/alternatif.
10. Cancellation/refund matrix per waktu sebelum trip.
11. Heavy-B future booking policy: auto-cancel/refund vs admin resolution.
12. Insight access depth untuk EO eksternal pada pilot.
13. Detail operational confirmation untuk menandai trip `COMPLETED`.
14. Final domain/subdomain implementation saat prototype/deployment.

---

# L. Product Design Process

Sebelum implementation UI production, tim mengikuti urutan:

1. **PRD** — product rules & requirements.
2. **System Flow** — [`docs/SYSTEM_FLOW.md`](docs/SYSTEM_FLOW.md).
3. **Screen Inventory** — diturunkan dari System Flow.
4. **Low-Fidelity Wireframe** — information architecture dan CTA.
5. **Design System** — typography, spacing, component, badge/status.
6. **High-Fidelity Prototype** — clickable end-to-end golden flow.
7. **Technical Architecture / Data Model / API Contract.**
8. **Implementation.**

Perubahan besar terhadap business rule harus memperbarui PRD/System Flow terlebih dahulu sebelum high-fidelity UI atau implementation diubah.

---

# M. Golden Demo Story

Alur demo yang menjadi acuan prototype:

1. Traveler membuat akun.
2. Traveler menyetujui consent dan menyelesaikan quiz.
3. JedaIn menampilkan personalized recommendation.
4. Data demand masuk ke aggregate insight.
5. EO membuka Partner Portal dan melihat insight.
6. EO membuat package melalui Trip Builder berdasarkan insight.
7. Admin memeriksa submission dan approve.
8. Package menjadi `LIVE` dan memiliki session.
9. Traveler memilih session dan checkout.
10. Sistem reserve slot dan membuat payment dengan countdown.
11. Payment sukses → booking confirmed.
12. Trip selesai → traveler memberi rating venue dan EO terpisah.
13. Rating kembali memperkuat trust system dan loop data JedaIn.

Golden demo harus dapat dipahami juri tanpa penjelasan teknis panjang dan harus memperlihatkan diferensiasi utama JedaIn: **Demand Insight + Creator Workflow + Verified Trust**.
