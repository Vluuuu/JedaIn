# PRD JedaIn

**Nama Produk:** JedaIn  
**Kompetisi:** HoloBiz – ICT Business Plan Competition, HOLOGY 9.0, Universitas Brawijaya  
**Subtema:** Ekonomi Digital  
**Tema Besar:** *Bloom Beyond: Where Ideas Take Root and Reach Further*  
**Versi:** 0.2 — Product/Development Revision  
**Tanggal:** 30 Agustus 2026

> Dokumen ini merupakan pembaruan PRD awal JedaIn agar lebih siap diturunkan menjadi desain produk, database, API, dan implementasi MVP. Bagian yang belum menjadi keputusan final tim ditandai **PENDING / DISCUSSION**.

---

## A. Overview

JedaIn adalah ekosistem digital tiga sisi yang menghubungkan:

1. **Wisatawan** — Young Professional Burnout (24–32 tahun) sebagai primary target, serta Mahasiswa/Fresh Grad Self-Explorer (19–25 tahun) sebagai secondary target.
2. **EO / Travel Organizer** — perancang pengalaman wellness tourism berbasis data insight.
3. **Mitra Destinasi** — pengelola destinasi lokal tier-2/tier-3 yang telah melalui proses verifikasi kualitas dan keberlanjutan.

### Positioning Statement

> **Platform yang membuka potensi destinasi lokal lewat kreativitas EO (didukung data insight), sambil menjamin kualitas & keberlanjutan lewat sistem verifikasi mitra destinasi.**

### Core Product Loop

`Demand Wisatawan → Insight → EO Membuat Experience → Verifikasi & Approval → Marketplace → Booking → Trip → Rating/Trust → Insight Baru`

JedaIn bukan hanya direktori atau marketplace tiket. Produk utama yang ditawarkan adalah **curated wellness experience** yang dirancang oleh EO berdasarkan sinyal demand dan menggunakan destinasi yang telah terverifikasi.

---

## B. Problem Statement

### Demand Side

Urban Gen Z dan Milenial di Surabaya–Malang jarang mempertimbangkan destinasi wellness tourism di luar destinasi mainstream. Discovery saat ini banyak bergantung pada Instagram/TikTok yang bersifat acak, tidak terstruktur, dan tidak selalu memberikan informasi mengenai kualitas, keamanan, atau kecocokan pengalaman dengan kebutuhan pengguna.

### Supply Side

Destinasi lokal memiliki potensi alam dan aktivitas yang layak dikembangkan, tetapi belum banyak pihak yang mengemasnya menjadi produk wellness tourism yang menarik, terstruktur, dan konsisten. EO kecil juga tidak selalu memiliki akses terhadap data demand yang dapat membantu mereka merancang paket secara tepat.

### Opportunity

JedaIn menghubungkan demand wisatawan, kreativitas EO, dan supply destinasi melalui:

- onboarding quiz dan demand insight,
- Trip Builder untuk EO,
- sistem verifikasi destinasi,
- booking dan pembayaran,
- rating serta trust system.

---

## C. Objectives & Goals

### C.1 Business Objectives — MVP

| Objective | Target |
|---|---|
| Validasi model tiga sisi | Minimal 1 EO pilot dan 1 paket wellness tourism yang dapat ditransaksikan |
| Validasi demand | Membuktikan adanya wisatawan yang bersedia memilih/booking paket wellness tourism tier-2/tier-3 |
| Minimum viable trust | Verifikasi mitra + approval EO berjalan secara hybrid manual dan otomatis |
| Extensible architecture | Struktur sistem siap multi-EO dan tiering walau MVP masih sederhana |

### C.2 Target MVP Kompetisi

- Minimal 1 EO pilot.
- Minimal 1 paket wellness tourism lengkap melalui Trip Builder.
- Minimal 1–2 Mitra Destinasi berstatus **Terverifikasi Dasar**.
- Minimal 1 mitra pilot memiliki badge **Siap sebagai Guide**.
- Demo end-to-end minimum:

`Login → Quiz → Recommendation/Insight → EO Builder → Approval → Catalog → Booking → Rating`

### C.3 Market Sizing

- TAM: ~630.000 orang.
- SAM: ~95.000–125.000 orang.
- SOM Tahun 1: 500–1.200 orang/tahun.
- SOM MVP: **PENDING**.

---

# D. Roles & Account Model

## D.1 Roles

Sistem memiliki empat role utama:

- `TRAVELER`
- `EO`
- `DESTINATION_PARTNER`
- `ADMIN`

### Multi-role Account — UPDATED

Satu account **dapat memiliki lebih dari satu role**.

Contoh:

- Admin internal dapat memiliki `ADMIN + EO`.
- Pengguna biasa dapat menjadi `TRAVELER`, lalu di kemudian hari mendaftar sebagai EO tanpa membuat identity baru.

Role harus dikelola sebagai permission/role assignment, bukan membuat model akun yang sepenuhnya terpisah.

---

# E. Core User Flows

## E.1 Wisatawan

`Login/Register → Quiz → Recommendation → Catalog → Trip Detail → Choose Session → Booking → Payment → Trip → Rating / Complaint`

## E.2 EO

`Login → EO Registration → Approval → Dashboard → Data Insight → Select Verified Destination → Trip Builder → Pricing → Submit → Automatic Validation → Admin Review → Package Live → Manage Sessions`

## E.3 Mitra Destinasi

`Register → Submit Legal/Operational Data → Manual Verification → Badge → Availability/Capacity → Used by EO Packages → Booking Schedule → Rating → Upgrade/Downgrade`

## E.4 Admin

`Review EO → Verify Destination → Review Trip Submission → Manage Trust Status → Review Complaint → Refund/Dispute Handling`

---

# F. Functional Requirements

## FR-1 — Authentication, Traveler Discovery & Recommendation

### FR-1.0 Authentication — UPDATED

Wisatawan dapat register/login melalui:

1. **Google OAuth** — recommended primary option untuk friction rendah.
2. **Nomor HP + OTP** melalui SMS/WhatsApp.
3. **Email** sebagai alternatif; implementasi MVP disarankan menggunakan OTP/magic link agar tidak menambah kompleksitas password management.

Rules:

- User yang login dengan Google/email tetap dapat browse katalog dan mengisi quiz tanpa nomor HP.
- **Nomor HP terverifikasi wajib tersedia sebelum booking/checkout**, karena digunakan sebagai contact trip dan notifikasi penting.
- Sesi login persistent di device.
- Account linking harus mencegah satu orang tidak sengaja membuat beberapa account dengan identity yang sama.

### FR-1.1 Onboarding Quiz

Quiz ringkas maksimal 5–8 pertanyaan, target waktu pengisian <3 menit.

Atribut minimum:

- jenis aktivitas / healing intent,
- budget range,
- durasi,
- lokasi keberangkatan,
- ukuran grup (jika digunakan dalam matching).

### FR-1.2 Consent Data

Consent wajib dan eksplisit sebelum preference quiz disimpan. Checkbox tidak boleh pre-checked.

### FR-1.3 Recommendation Engine — UPDATED

MVP menggunakan **rule-based recommendation**, bukan ML/AI.

Prioritas sinyal rekomendasi:

1. **Latest onboarding quiz / current intent** — sinyal utama.
2. **Behavior di dalam JedaIn** — search, view package, save/favorite, filter, booking history; hanya jika data telah tersedia.
3. **Departure location / area preference**.
4. **Rating dan popularity** sebagai tie-breaker atau fallback.

Prinsip: current intent dari quiz lebih tinggi prioritasnya dibanding historical behavior lama.

### FR-1.4 Cold Start & Fallback — UPDATED

#### User baru + mengisi quiz

Tampilkan paket berdasarkan skor quiz match. Jika skor sama, gunakan rating/popularity sebagai tie-breaker.

#### User baru + skip quiz

Tampilkan fallback seperti:

- popular/top-rated packages,
- package berdasarkan departure area yang dipilih,
- editorial/featured package jika tersedia.

**DISCUSSION:** urutan fallback final: rating vs booking popularity vs terbaru.

### FR-1.5 Unmatched Preference Logging

Jika tidak ada package yang memenuhi minimum match threshold, sistem:

1. menampilkan fallback package,
2. mencatat pola preference yang tidak terpenuhi.

Data yang dicatat minimal:

- kombinasi preference,
- timestamp,
- frekuensi pola yang mirip.

Data ini menjadi **Unmet Demand Insight** untuk EO/admin.

### FR-1.6 External Trend Data — ROADMAP, BUKAN MVP

JedaIn **tidak membaca personal Google Search History pengguna**.

Alasan:

- bukan capability standar dari Google OAuth,
- menambah risiko privacy/consent,
- tidak dibutuhkan untuk validasi MVP.

Sebagai roadmap, JedaIn dapat menggunakan **data trend publik/agregat** sebagai external market signal bagi EO, terpisah dari data pribadi pengguna.

### FR-1.7 Catalog

Wisatawan dapat melihat seluruh package berstatus `LIVE` dalam list/grid.

Minimum filters:

- budget,
- durasi,
- departure/location,
- destination.

### FR-1.8 Trip Detail

Minimum informasi:

- nama package,
- deskripsi,
- itinerary,
- harga,
- EO/guide,
- mitra destinasi,
- badge verifikasi,
- upcoming sessions,
- capacity/slot,
- cancellation/refund policy.

---

# FR-2 — EO & Trip Builder

## FR-2.1 EO Registration

EO eksternal wajib menyediakan:

- legalitas dasar,
- portfolio,
- contact person,
- bukti asuransi liability sesuai keputusan business/legal tim.

EO baru default memiliki guide status:

`CONCEPT_ONLY`

EO internal adalah akun tim/platform dan menggunakan Builder yang sama.

## FR-2.2 Data Insight

EO dapat melihat creative brief dari:

- aggregate onboarding quiz,
- unmatched preference,
- internal behavior signal jika sudah tersedia.

**PENDING:** akses seluruh EO vs admin-only pada MVP.

## FR-2.3 Select Destination

EO hanya dapat memilih mitra berstatus:

- `BASIC_VERIFIED`, atau
- `PLUS_VERIFIED`.

Jika EO = `CONCEPT_ONLY`, destination yang tersedia harus memiliki `guide_ready = true`.

Rule ini harus divalidasi backend, bukan hanya frontend filter.

## FR-2.4 Trip Builder

Builder minimum memiliki langkah:

1. pilih destination,
2. lihat Data Insight,
3. susun itinerary,
4. kalkulasi biaya,
5. submit untuk approval.

## FR-2.5 Pricing

Formula dasar MVP:

`Customer Price = Destination Base Cost + EO Margin`

Platform commission diambil secara **deductive dari EO Margin**, bukan menambahkan fee baru ke traveler.

Mitra menerima **100% base cost** di MVP.

EO margin menggunakan bounded range.

- Working range awal: 10–25%.
- **PENDING:** angka final lower bound dan upper bound.
- **PENDING:** flat platform commission rate.

Config tidak boleh tersebar hardcoded. Gunakan konfigurasi terpusat.

## FR-2.6 Automatic Validation

Sebelum masuk admin queue sistem memvalidasi:

- field lengkap,
- destination aktif,
- guide rule valid,
- capacity masuk akal,
- margin dalam bound.

Jika gagal, submission ditolak otomatis dengan alasan spesifik.

## FR-2.7 Manual Approval

Jika automatic validation lolos, admin melakukan review menggunakan checklist standar.

Hasil:

- `APPROVED`
- `REJECTED`

Reject wajib memiliki alasan spesifik.

## FR-2.8 Revision & Resubmit

EO dapat mengedit draft yang ditolak dan submit ulang tanpa membuat package baru.

Resubmit selalu melewati seluruh automatic validation dan manual review kembali.

## FR-2.9 Editing Live Package — NEW

Perubahan material pada package yang sudah `LIVE` tidak boleh langsung mengubah informasi yang telah dibeli traveler.

Material changes minimal:

- harga,
- destination,
- itinerary utama,
- duration,
- safety information,
- EO/guide.

Flow:

`Live Version → Create New Draft Version → Re-Approval → Publish New Version`

Booking lama menyimpan **snapshot/version package** yang berlaku pada saat transaksi.

Perubahan non-material (contoh typo/deskripsi minor) dapat ditentukan kemudian melalui policy admin.

## FR-2.10 EO Guide Status

Status guide:

- `CONCEPT_ONLY`
- `CERTIFIED_GUIDE`

Upgrade tidak otomatis. Sistem hanya memicu eligibility setelah threshold tercapai, lalu admin mengonfirmasi.

Downgrade/suspend mengikuti trust rule.

**PENDING:** threshold rating dan minimum trip untuk eligibility.

---

# FR-3 — Destination Verification & Trust

## FR-3.1 Destination Registration

Mitra mengirim:

- data legalitas/pengelolaan,
- dokumentasi lokasi,
- fasilitas,
- aktivitas,
- capacity/base cost,
- kesiapan SDM guide.

## FR-3.2 Manual Verification — MVP

Untuk 1–2 mitra pilot, verifikasi dilakukan tim internal secara manual dengan checklist legalitas, keamanan, kesesuaian klaim, dan kesiapan guide.

## FR-3.3 Destination Status Model — UPDATED

Simpan status sebagai dua dimensi, bukan satu string badge.

### Verification Level

- `BASIC`
- `PLUS`

### Guide Capability

- `guide_ready = false`
- `guide_ready = true`

UI kemudian dapat menampilkan kombinasi:

- Terverifikasi Dasar
- Terverifikasi Dasar + Siap sebagai Guide
- Terverifikasi Plus
- Terverifikasi Plus + Siap sebagai Guide

## FR-3.4 Failed Verification & Re-Apply

Mitra yang gagal menerima alasan spesifik dan dapat re-apply setelah memperbaiki kekurangan.

## FR-3.5 Rating & Review — UPDATED

Rating venue hanya dapat diberikan oleh traveler dengan booking `COMPLETED`.

Rules:

- 1 completed booking → maksimal 1 venue review.
- 1 completed booking → maksimal 1 EO/guide review.
- Venue review dan EO review disimpan sebagai dua review terpisah.
- Review harus terhubung ke booking untuk mencegah review publik anonim/tidak terverifikasi.

## FR-3.6 Upgrade/Downgrade/Suspend

Rating dan verified complaint dapat mengubah status destination/EO sesuai trust rule.

Rule awal dari PRD:

- repeated low rating → downgrade,
- verified Heavy-A complaint → downgrade,
- verified Heavy-B complaint → suspend.

Threshold final tetap configurable.

## FR-3.7 Suspension with Upcoming Bookings — NEW / DISCUSSION

Jika EO/destination di-suspend tetapi memiliki future bookings, sistem **tidak boleh diam-diam menghapus booking**.

Default safe flow MVP:

1. pihak di-suspend tidak dapat menerima booking baru,
2. future affected bookings ditandai `NEEDS_ADMIN_RESOLUTION`,
3. admin menentukan salah satu:
   - replacement EO/destination jika feasible,
   - cancellation + refund,
   - keputusan manual lain yang disepakati traveler,
4. traveler mendapat notifikasi status.

**DISCUSSION:** apakah kasus Heavy-B harus otomatis cancel/refund tanpa manual review.

---

# FR-4 — Trip Package, Schedule & Capacity

## FR-4.1 Separate Package and Session — NEW

Sistem membedakan:

### Trip Package

Template produk/experience yang dibuat EO.

Contoh:

> Weekend Nature Reset

Memiliki:

- title,
- description,
- destination,
- itinerary,
- base pricing rule,
- current approved version,
- verification/status.

### Trip Session

Keberangkatan/occurrence konkret dari Trip Package.

Contoh:

- 12 September 2026 — 20 slot
- 19 September 2026 — 20 slot

Minimal field:

- `package_id`
- date/time,
- capacity,
- booked/reserved slot,
- session status.

Traveler **booking Trip Session**, bukan hanya Trip Package.

## FR-4.2 Capacity Locking

Slot harus di-lock/decrement secara atomic pada proses booking/payment agar tidak terjadi overselling.

## FR-4.3 Real-Time Availability Consistency

Jika session penuh, destination inactive, atau session ditutup, perubahan harus langsung memengaruhi catalog/checkout dan Builder yang relevan.

---

# FR-5 — Booking, Payment & Financial State

## FR-5.1 Booking

Booking menghubungkan:

- traveler,
- Trip Session,
- package version snapshot,
- quantity/participant,
- price snapshot,
- payment,
- fulfillment status.

## FR-5.2 Payment Gateway

Payment menggunakan pihak ketiga berizin seperti Midtrans/Xendit. JedaIn tidak menyimpan card/payment credential sensitif.

## FR-5.3 Idempotency

Booking/payment retry harus idempotent untuk mencegah:

- double booking,
- double charge,
- slot hilang tanpa status jelas.

## FR-5.4 Payment State

Minimum logical states:

- `PENDING`
- `PAID`
- `HELD`
- `REFUNDED`
- `SPLIT`
- `PAID_OUT`
- `FAILED`

State final dapat disesuaikan dengan payment gateway saat implementasi.

## FR-5.5 Holding Period

Dana ditahan hingga H+1 s.d. H+3 pasca-trip sebelum split/payout sebagai buffer dispute.

Sistem mencatat status apakah dana masih `HELD` atau sudah `SPLIT`.

## FR-5.6 Audit Trail

Setiap perubahan financial status wajib menyimpan:

- timestamp,
- actor/system source,
- previous state,
- new state.

## FR-5.7 Cancellation / Refund Policy

Traveler harus melihat kebijakan cancel/refund sebelum konfirmasi booking.

---

# FR-6 — Complaint & Dispute

## FR-6.1 Complaint Submission

Traveler dengan booking yang relevan dapat mengajukan complaint.

Traveler tidak memilih sendiri severity final.

## FR-6.2 Complaint Classification

Admin menentukan:

- severity,
- responsible party.

Severity:

- `LIGHT`
- `HEAVY_A`
- `HEAVY_B`

Responsible party:

- `EO`
- `DESTINATION`
- `BOTH`

## FR-6.3 Resolution

- Light → EO handle, platform monitor.
- Heavy during holding → platform dapat memproses refund dari held funds.
- Heavy after split → platform tetap memfasilitasi dispute; kompensasi mengikuti business/legal policy dan insurance responsibility.

## FR-6.4 Trust Effect

- Heavy-A verified → downgrade responsible party.
- Heavy-B verified → suspend responsible party.

---

# G. Non-Functional Requirements

## NFR-1 Privacy & Security

- Explicit PDP consent untuk preference data.
- Encryption in transit dan at rest untuk data pribadi sensitif.
- Legal documents EO/mitra hanya dapat diakses role admin yang berwenang.
- Pengguna dapat request access/delete data melalui admin di MVP.
- Financial records mengikuti retention requirement yang berlaku (**PENDING exact duration**).

## NFR-2 Authentication & Authorization

- OAuth/OTP implementation harus menggunakan provider yang aman.
- Permission dicek berdasarkan role server-side.
- Multi-role account harus didukung tanpa menduplikasi identity.

## NFR-3 Performance

- Quiz → recommendation target <3 detik.
- Builder pricing calculation terasa real-time saat slider berubah.
- Payment flow menjadi critical path dengan target availability setinggi mungkin; target awal 99%+ bergantung payment provider.

## NFR-4 Data Integrity

- Idempotent payment operations.
- Atomic capacity reservation.
- Package version snapshot pada booking.
- Audit trail untuk perubahan financial/trust status penting.

## NFR-5 Scalability

Database disiapkan multi-EO dari awal.

Tiering EO boleh memiliki struktur data sejak MVP tetapi logic tier belum perlu aktif.

Training guide masih manual di MVP tetapi badge/status model harus extensible untuk e-learning di masa depan.

## NFR-6 UX

- UI Bahasa Indonesia.
- Tone sesuai Gen Z/Milenial tanpa mengorbankan kejelasan.
- Status seperti Certified Guide / Terverifikasi Plus wajib memiliki penjelasan/tooltip yang mudah dipahami.
- Quiz maksimum 5–8 pertanyaan.

---

# H. Recommended MVP Scope for Competition

## Must Have

1. Google OAuth atau HP OTP login.
2. Onboarding quiz.
3. Rule-based recommendation.
4. Catalog + Trip Detail.
5. Data Insight sederhana.
6. EO Trip Builder.
7. Destination verification badge.
8. Automatic validation + manual admin approval.
9. Trip Package + Trip Session.
10. Booking flow.
11. Rating venue + rating EO dari completed booking.

## Can Be Simulated / Simplified in Competition Demo

- real payment settlement/split,
- real WhatsApp notification,
- full financial payout automation,
- sophisticated complaint automation,
- EO tiering,
- e-learning guide training.

## Not MVP

- AI/ML recommendation,
- personal Google Search History ingestion,
- advanced personalization model,
- full automated payout infrastructure,
- advanced appeal workflow,
- external public trend integration.

---

# I. Configuration — Do Not Hardcode

Minimum configurable business parameters:

```text
MATCH_THRESHOLD
MIN_EO_MARGIN
MAX_EO_MARGIN
PLATFORM_COMMISSION_RATE
PLUS_RATING_THRESHOLD
CERTIFIED_GUIDE_RATING_THRESHOLD
CERTIFIED_GUIDE_MIN_TRIPS
LOW_RATING_DOWNGRADE_THRESHOLD
HOLDING_PERIOD_DAYS
```

---

# J. Open Decisions / Team Discussion

1. Exact matching threshold.
2. Exact EO margin lower/upper bound.
3. Exact platform commission rate.
4. Rating + minimum trip threshold untuk Certified Guide eligibility.
5. Threshold Terverifikasi Plus.
6. Default catalog fallback order: rating vs popularity vs terbaru.
7. Data Insight tersedia ke semua EO atau admin-only pada MVP.
8. Exact financial retention period.
9. SOM MVP.
10. Policy perubahan non-material pada live package.
11. Heavy-B future booking: manual resolution atau automatic cancel/refund.
12. Email auth implementation final: magic link/OTP atau password.

---

# K. Demo Narrative

Skenario demo yang direkomendasikan:

1. Traveler login dengan Google.
2. Traveler mengisi quiz: budget <Rp300k, nature, weekend, departure Malang.
3. Sistem menampilkan package dengan match score tertinggi.
4. Preference agregat muncul sebagai insight EO.
5. EO membuka Builder, memilih destination `Terverifikasi Dasar + Siap sebagai Guide`.
6. EO menyusun itinerary dan margin; harga dihitung otomatis.
7. EO submit → automatic validation lolos.
8. Admin melakukan manual approval.
9. Package dan session menjadi live di catalog.
10. Traveler memilih session dan membuat booking.
11. Setelah trip, traveler memberi dua rating terpisah: venue dan EO.
12. Rating masuk trust system.

Dengan flow ini, demo memperlihatkan core value JedaIn secara utuh:

> **Demand → Insight → Creation → Verification → Transaction → Trust**
