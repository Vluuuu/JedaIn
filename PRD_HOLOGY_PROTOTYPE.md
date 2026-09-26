# JedaIn — PRD HOLOGY Competition Prototype

**Nama Produk:** JedaIn  
**Kompetisi:** HoloBiz — HOLOGY 9.0  
**Dokumen:** Product Requirements Document untuk prototype lomba  
**Versi:** 1.0 Canonical  
**Tanggal:** 24 September 2026  
**Status:** CANONICAL — source of truth competition prototype HOLOGY  
**Canonicalized via:** PR #74 pada 24 September 2026  
**Implementation Baseline:** 4208dddf2e86e607ed92b578c0102945b9ee903b

> Dokumen ini merangkum requirement produk JedaIn berdasarkan prototype yang benar-benar sudah dibangun, evaluasi/discovery terbaru, dan kebutuhan demo kompetisi. Dokumen ini sengaja tidak mendefinisikan JedaIn sebagai aplikasi production-grade. Fokusnya adalah prototype yang stabil, jelas, dapat didemokan, dan konsisten untuk penjurian.

---

# 1. Purpose dan Source of Truth

PRD ini dibuat untuk menjadi acuan baru development JedaIn setelah discovery, implementasi improvement, regression, dan deployment prototype.

Dokumen ini menjawab empat pertanyaan utama:

1. JedaIn prototype saat ini sebenarnya produk apa?
2. Flow tiap role harus berjalan seperti apa?
3. Requirement apa yang wajib dipertahankan saat development berikutnya?
4. Hal apa yang sengaja tidak perlu dibangun untuk lomba?

## 1.1 Hierarki Dokumen Setelah PRD Ini Disetujui

Setelah PRD ini direview dan di-merge sebagai canonical:

1. PRD_HOLOGY_PROTOTYPE.md — requirement dan product rule prototype lomba.
2. docs/SYSTEM_FLOW.md — detail alur/state yang masih relevan.
3. kontrak screen/flow di folder docs/ — detail implementasi layar.
4. source code dan tests — implementasi nyata.

PRD.md lama tetap disimpan sebagai historical/legacy product reference dan tidak dihapus.

Jika PRD lama bertentangan dengan keputusan prototype yang secara eksplisit dikunci di PRD ini, PRD prototype ini yang menjadi acuan setelah resmi diadopsi tim.

---

# 2. Prototype Context — LOCKED

JedaIn yang dibangun untuk HOLOGY adalah **competition prototype**, bukan aplikasi komersial production-ready.

Konsekuensi produk:

- Guest/demo mode diperbolehkan dan berguna agar juri dapat mencoba flow tanpa friction.
- Quick demo account untuk EO, Mitra Destinasi, dan Admin diperbolehkan.
- Mock store, fixture, in-memory state, dan simulasi pembayaran diperbolehkan.
- Backend production, real database, production OAuth, real OTP provider, payment gateway nyata, dan production security hardening bukan requirement wajib lomba.
- Live hosting di jedain.biz.id berfungsi sebagai demo hosting, bukan klaim production readiness.
- Development diprioritaskan berdasarkan dampak terhadap:
  - demo reliability,
  - kejelasan value proposition,
  - usability,
  - visual polish,
  - pengalaman juri,
  - konsistensi lintas role.
- Engineering production-grade hanya dilakukan jika perubahan tersebut memberi manfaat nyata pada prototype.

## 2.1 Product Principles

P-01. Jangan mengubah business rule inti hanya demi mempercantik demo.

P-02. Jangan membuat data atau state yang tidak ada seolah-olah fakta nyata.

P-03. Prototype boleh memakai data simulasi, tetapi harus diberi konteks yang jujur.

P-04. UI harus membedakan general information, session-specific information, dan state operasional.

P-05. WhatsApp/telepon/manual process boleh tetap menjadi bagian operasi yang tidak didigitalisasi penuh.

P-06. Fitur baru harus membantu juri memahami loop tiga sisi JedaIn, bukan sekadar menambah jumlah menu.

---

# 3. Product Overview

JedaIn adalah ekosistem wellness tourism tiga sisi yang menghubungkan:

1. **Traveler**
   - mencari jeda/perjalanan yang sesuai kebutuhan,
   - mendapatkan recommendation berbasis preference,
   - memilih paket dan jadwal,
   - melakukan simulasi booking/payment,
   - melihat trip dan memberi review.

2. **EO / Travel Organizer**
   - membaca demand insight,
   - memilih destinasi terverifikasi,
   - merancang package,
   - menentukan margin,
   - mengajukan package,
   - membuka session,
   - melihat booking dan mengelola informasi operasional.

3. **Mitra Destinasi**
   - mendaftarkan destinasi,
   - menjalani verification,
   - menyediakan context kapasitas, biaya dasar, fasilitas, aktivitas, dan guide readiness,
   - melihat jadwal EO dan peserta terkonfirmasi,
   - membaca operational summary.

4. **Admin / Tim Kurasi**
   - mengelola trust layer,
   - memproses approval EO,
   - verifikasi destinasi,
   - review package,
   - memonitor booking, complaint, trust, dan audit.

## 3.1 Core Product Loop

Traveler Need  
→ Preference / Recommendation  
→ Demand Insight  
→ EO Creates Experience  
→ Admin / Trust Review  
→ Package LIVE  
→ EO Opens Session  
→ Traveler Booking & Payment  
→ Trip  
→ Review / Trust Signal  
→ Insight baru

## 3.2 Target Users dan Core Needs

Target Traveler yang dibawa dari product/business context sebelumnya:

- **Young Professional Burnout (24–32 tahun)** sebagai target primer.
- **Mahasiswa / Fresh Graduate Self-Explorer (19–25 tahun)** sebagai target sekunder.

Untuk competition prototype, kebutuhan yang harus terlihat di produk adalah:

**Traveler**

- menemukan pengalaman yang terasa relevan dengan kebutuhan jeda saat ini,
- memahami apa yang akan dijalani sebelum booking,
- mendapat kejelasan jadwal, meeting point/access, trust context, dan biaya,
- tidak harus mengulang flow demo hanya karena refresh.

**EO / Travel Organizer**

- mendapat demand context yang membantu ideasi tanpa dianggap sebagai jaminan demand,
- memahami kapasitas umum, cost scope, guide context, dan kondisi destinasi,
- merancang package dan session dengan state yang jelas,
- melihat booking dan operational context yang relevan.

**Mitra Destinasi**

- memahami perbedaan kapasitas umum destinasi dan kuota session EO,
- mengetahui peserta terkonfirmasi tanpa membutuhkan PII Traveler,
- melihat cost scope, guide readiness, schedule, dan operational summary,
- menerima informasi session sebagai read-only bila authority berada di EO.

**Admin / Tim Kurasi**

- menunjukkan trust layer melalui review/verification/approval,
- melihat state lintas role yang konsisten,
- membantu juri memahami bahwa marketplace tidak berjalan tanpa governance/trust.

## 3.3 Evidence Boundary

PRD ini menggabungkan:

- behavior yang benar-benar ada di prototype,
- regression/smoke verification,
- proposal/business context,
- synthetic proxy discovery yang dipakai untuk mengarahkan UX improvement.

Synthetic proxy discovery **bukan human/market validation**.

Karena itu:

- jangan menyatakan synthetic proxy interview sebagai bukti perilaku pengguna nyata,
- jangan menyatakan Demand Insight prototype sebagai hasil market validation,
- klaim pasar/segmentasi harus mengikuti sumber proposal/riset yang memang dimiliki tim,
- requirement prototype boleh tetap memakai synthetic evidence sebagai design input selama wording-nya jujur.

---

# 4. Competition Objective

Prototype harus membuat juri dapat memahami nilai JedaIn tanpa membutuhkan penjelasan teknis panjang.

Target experience:

- Traveler dapat mengalami personalized discovery sampai checkout/payment.
- EO dapat menunjukkan bahwa demand insight dipakai untuk merancang package.
- Admin menunjukkan trust/approval layer.
- Mitra Destinasi menunjukkan kesiapan operasional dan visibility session.
- Shared state lintas role dapat ditunjukkan pada golden demo.

## 4.1 Competition Success Criteria

Prototype dianggap siap demo jika:

- tidak ada blank page atau runtime crash pada golden flow,
- role utama dapat diakses dengan cepat,
- route utama dapat didemokan ulang,
- state penting konsisten,
- wording tidak menyesatkan,
- payment adalah simulasi yang terlihat jelas,
- demo tidak bergantung pada service eksternal production,
- flow dapat dijalankan di desktop juri dan tetap usable di mobile/tablet dasar.

---

# 5. Roles dan Access Model

| Role            | Primary Surface                             | Fungsi Utama                              |
| --------------- | ------------------------------------------- | ----------------------------------------- |
| Traveler        | /, /login, /home, /explore                  | discovery, recommendation, booking, trip  |
| EO              | /partner, /partner/eo atau eo.jedain.biz.id | insight, package, sessions, bookings      |
| Mitra Destinasi | /partner/destination                        | destination operation, schedule, capacity |
| Admin           | /admin                                      | verification, approval, trust, audit      |

## 5.1 Demo Access

Competition prototype boleh menyediakan:

- Lanjut sebagai Tamu untuk Traveler,
- quick demo EO,
- quick demo Mitra Destinasi,
- quick demo Admin,
- deterministic demo reset bila diperlukan.

Demo access bukan dianggap celah produk; ini adalah competition facilitation.

## 5.2 Role Isolation

REQ-XR-01 — Protected operational workspace tidak boleh terbuka hanya karena user mengetik URL role lain.

Acceptance:

- Traveler tidak otomatis menjadi Admin/EO/Mitra.
- EO tidak otomatis mendapat authority Mitra/Admin.
- Mitra tidak otomatis mendapat authority EO/Admin.
- Admin session tidak otomatis mengubah partner identity.
- Demo helper boleh mengatur session prototype secara eksplisit.

Status: IMPLEMENTED / regression guarded.

## 5.3 Requirement Status Vocabulary

Gunakan status berikut secara konsisten:

- **LIVE / VERIFIED** — sudah ada di main, ter-deploy pada demo hosting, dan sudah diverifikasi pada flow terkait.
- **IMPLEMENTED** — sudah ada di codebase, tetapi requirement ini tidak membutuhkan klaim production verification khusus.
- **PARTIAL** — renderer/flow tersedia tetapi dependency konten/data belum lengkap.
- **OPEN** — membutuhkan keputusan tim; developer tidak boleh mengunci sendiri.
- **OUT OF SCOPE** — sengaja tidak dibangun untuk competition prototype.

Demo criticality:

- **MUST** — jika gagal, golden demo/value proposition utama terganggu.
- **SHOULD** — meningkatkan clarity/trust/usability secara nyata.
- **OPTIONAL** — polish yang hanya dikerjakan jika waktu dan risiko memungkinkan.

Requirement yang terkait langsung dengan golden flow Traveler, EO, Mitra, Admin, payment, role isolation, dan shared state diperlakukan sebagai **MUST** kecuali ditulis lain.

---

# 6. Canonical Terminology dan Semantic Guard

Istilah di bagian ini harus dipertahankan agar copy baru tidak menciptakan business rule yang sebenarnya tidak ada.

## 6.1 Capacity

**Kapasitas umum destinasi per sesi**
= general capacity context milik destinasi.

Tidak otomatis berarti:

- slot yang bisa dijual,
- ketersediaan aktual,
- kapasitas fisik absolut,
- remaining slot.

**Kuota Sesi EO**
= kapasitas/quota untuk session EO tertentu.

**Peserta Terkonfirmasi**
= jumlah peserta yang berasal dari booking state yang relevan.

**Selisih Operasional**
= selisih angka untuk membantu observasi operasional.

Tidak boleh dilabeli sebagai "slot tersedia" kecuali memang berasal dari remainingSlots canonical.

## 6.2 Guide

guideReady:

- capability/readiness umum destinasi,
- bukan identitas guide individual pada satu session.

EO guideStatus:

- capability/status EO,
- bukan bukti guide individual sudah assigned.

guideSource:

- sumber pemandu untuk package: DESTINATION atau EO,
- bukan pembagian keseluruhan tanggung jawab operasional.

## 6.3 Operational Note

operationalNote:

- catatan deskriptif session,
- memiliki timestamp update,
- dapat diedit EO dan dibaca Mitra pada prototype saat ini.

operationalNote BUKAN:

- approval,
- destination consent,
- readiness confirmation,
- safety authorization,
- traveler notification,
- session status.

## 6.4 Demand Insight

Demand Insight prototype:

- data simulasi/directional,
- membantu EO memahami arah konsep,
- bukan market validation,
- bukan proyeksi penjualan.

Distribusi tiap dimensi ditampilkan terpisah dan tidak otomatis menunjukkan intersection preferensi antar-dimensi.

## 6.5 Media

- Actual photo hanya boleh disebut actual jika memang berasal dari asset foto destinasi.
- SVG fallback harus diperlakukan sebagai ilustrasi.
- Prototype tidak boleh mengklaim ilustrasi sebagai kondisi destinasi terkini.

---

# 7. Traveler User Flow

## 7.1 Golden Flow

Landing  
→ Login / Guest Demo  
→ Consent  
→ Preference Quiz  
→ Recommendation  
→ Home / Explore  
→ Package Detail  
→ Session Selection  
→ Checkout  
→ Contact Verification bila diperlukan  
→ Pending Payment  
→ Payment Simulation  
→ Payment Result  
→ My Trips  
→ Trip Detail  
→ Prototype Completion  
→ Destination Review + EO/Guide Review

## 7.2 Alternative Flow

Existing traveler dengan onboarding COMPLETED:
Login  
→ Home / Explore

Traveler sedang onboarding:
Login / refresh  
→ lanjut state onboarding sesuai session state

Traveler memiliki payment aktif:
browsing boleh tetap berjalan, tetapi flow pembayaran mengikuti pending-payment behavior existing.

---

# 8. Traveler Functional Requirements

## REQ-TRV-01 — Entry, Login, dan Guest Demo

Traveler dapat masuk melalui login/form prototype atau Guest Demo.

Requirements:

- Guest mode diperbolehkan untuk competition prototype.
- Guest tetap mengikuti onboarding requirement seperti traveler baru.
- Guest mode tidak boleh diinterpretasikan sebagai production authentication design.
- CTA harus jelas dan tidak membuat juri terjebak.

Status: IMPLEMENTED LIVE.

## REQ-TRV-02 — Consent dan Mandatory Onboarding

Traveler baru/guest harus melalui consent dan quiz sebelum masuk ke personalized flow.

Minimum state:

- NOT_STARTED
- IN_PROGRESS
- COMPLETED

Acceptance:

- first-time path diarahkan ke consent,
- quiz tidak dilewati diam-diam,
- completed state mengizinkan protected Traveler surface,
- retake preference tetap dapat dilakukan dari profile.

Status: IMPLEMENTED LIVE.

## REQ-TRV-03 — Temporary Session Persistence

Tujuan: refresh browser tidak memaksa juri mengulang flow dari awal.

Requirement:

- Traveler SessionState dapat dipertahankan sementara menggunakan browser sessionStorage.
- Persisted state mencakup user prototype, onboarding state, dan quiz draft.
- logout/reset membersihkan persisted state.
- corrupt storage tidak boleh crash.
- jika storage tidak tersedia, prototype fallback ke in-memory state.

Catatan:

- tidak menggunakan localStorage untuk persistence jangka panjang,
- ini bukan production auth session.

Status: IMPLEMENTED LIVE / VERIFIED — Batch D2 commit 4208ddd.

## REQ-TRV-04 — Preference Quiz

Quiz harus menangkap sinyal yang cukup untuk recommendation prototype.

Existing preference dimensions mencakup:

- intent,
- aktivitas,
- budget,
- durasi,
- departure area,
- group context.

Acceptance:

- input tidak perlu ditambah hanya agar terlihat kompleks,
- current intent terbaru menjadi basis recommendation,
- draft dapat dipertahankan selama browser session jika D2 sudah dirilis.

Status: IMPLEMENTED.

## REQ-TRV-05 — Recommendation

Recommendation prototype menggunakan deterministic/rule-based logic.

Acceptance:

- recommendation memiliki alasan yang dapat dipahami,
- sistem boleh menampilkan alternatif,
- jika tidak ada match sempurna, jangan mengarang confidence tinggi,
- hasil recommendation terhubung ke package yang tersedia.

Status: IMPLEMENTED.

## REQ-TRV-06 — Home dan Explore

Traveler harus dapat:

- melihat package,
- melihat upcoming trip/pending state bila ada,
- mencari atau mengeksplor package,
- membuka package detail.

Acceptance:

- non-LIVE/ineligible package tidak tampil sebagai sellable,
- empty state tidak crash,
- navigation mobile tetap usable.

Status: IMPLEMENTED.

## REQ-TRV-07 — Package Detail

Package detail minimum menampilkan:

- title/value proposition,
- price per person,
- destination,
- itinerary,
- duration/intensity,
- inclusions/exclusions package,
- EO / guide context,
- verification/trust explanation,
- upcoming session,
- meeting point/access bila data tersedia,
- media.

Acceptance:

- meeting point hanya tampil jika ada data,
- waktu keberangkatan mengikuti session ketika memang session-specific,
- transport/access note tidak boleh dikarang,
- actual photo diprioritaskan jika tersedia,
- fallback illustration harus jujur,
- trust badge explanation tidak menjanjikan hal yang tidak dibuktikan,
- seeded/sample package rating yang tampil ke Traveler diberi provenance/label contoh sebelum dipakai sebagai social proof,
- runtime post-trip rating tidak dilabeli sebagai contoh.

Status:

- core detail IMPLEMENTED,
- meeting point/access IMPLEMENTED,
- media path IMPLEMENTED,
- actual photography PARTIAL karena asset foto riil belum tersedia.

## REQ-TRV-08 — Session Selection

Requirement:

- past session tidak tampil sebagai upcoming selectable session,
- future valid session tetap dapat dipilih,
- tanggal/jam/price/remaining slot terlihat jelas,
- wording menggunakan "kuota sesi" untuk session-level capacity,
- general destination capacity tidak dipakai sebagai remainingSlots.

Acceptance:

- direct checkout untuk past session ditolak aman,
- empty future session menghasilkan empty state,
- future OPEN session tetap dapat dipilih.

Status: IMPLEMENTED LIVE.

## REQ-TRV-09 — Participant Quantity

Traveler dapat memilih jumlah peserta sesuai logic existing.

Acceptance:

- increment/decrement mempertahankan min/max existing,
- subtotal mengikuti quantity,
- accessible name tersedia untuk tombol quantity,
- current value dapat dibaca assistive technology,
- visual stepper tetap sederhana.

Status:

- logic IMPLEMENTED LIVE,
- accessibility polish IMPLEMENTED LIVE / VERIFIED — Batch D1 commit 32d698f.

## REQ-TRV-10 — Checkout dan Payment Breakdown

Current competition prototype behavior:

Package unit price:
Destination Base Cost + EO Margin.

Checkout menampilkan:

- unit/package price,
- participant count,
- subtotal,
- fixed traveler service fee Rp7.500 per transaksi pada implementasi prototype saat ini,
- total.

Total = subtotal + service fee.

Acceptance:

- breakdown konsisten antara Checkout, Payment, Payment Result, dan related trip/payment state,
- service fee tidak diduplikasi per participant,
- corrupted/legacy payment state ditangani deterministik,
- perubahan monetization commercial model bukan bagian requirement prototype ini.

Status: IMPLEMENTED LIVE.

## REQ-TRV-11 — Contact Verification dan Pending Payment

Prototype mempertahankan flow contact verification dan pending payment existing.

Acceptance:

- flow tidak boleh crash,
- tidak boleh membuat booking baru dari invalid/past session,
- satu payment flow harus merujuk pada booking yang sama,
- pending-payment behavior existing dipertahankan.

Status: IMPLEMENTED.

## REQ-TRV-12 — Payment Simulation

Payment adalah simulasi competition prototype.

Acceptance:

- user memahami bahwa flow adalah demo/simulation,
- payment menghasilkan state yang konsisten untuk shared demo,
- tidak ada requirement payment gateway nyata.

Status: IMPLEMENTED.

## REQ-TRV-13 — My Trips, Post-Booking Trip Brief, dan Review

Traveler dapat:

- melihat trip,
- membuka detail,
- melihat post-booking Trip Brief yang menggunakan source data existing,
- pada demo mensimulasikan completion bila control tersedia,
- memberi Destination review,
- memberi EO/Guide review.

Trip Brief dapat menampilkan, ketika source data tersedia:

- waktu keberangkatan dari session booking,
- meeting point,
- destination/location context,
- access notes.

Acceptance:

- Trip Brief tidak mengarang meeting point, koordinat, transport, atau informasi operasional baru,
- jika meeting point belum tersedia, fallback harus netral dan hanya menyatakan data belum dicantumkan,
- internal `operationalNote` tidak boleh diekspos ke Traveler,
- safety/preparation notes existing tidak perlu diduplikasi jika sudah tampil pada Trip Detail,
- review hanya terkait booking/trip yang eligible menurut prototype,
- Destination dan EO review tetap terpisah,
- review dapat terlihat pada surface partner terkait,
- review copy diposisikan sebagai penilaian traveler dan tidak diklaim sebagai penilaian objektif atau bukti pengalaman production nyata,
- Guest Demo tetap boleh menjadi prototype Traveler identity untuk mendemonstrasikan completion → Destination review → EO/Guide review; ini bukan requirement production authentication.

Status: IMPLEMENTED LIVE — diperkuat pada F3.1 / PR #80 dan diklarifikasi kembali setelah final role simulation.

---

# 9. EO User Flow

Partner Entry  
→ Login / EO Demo / EO Application  
→ Approved EO Workspace  
→ Overview  
→ Demand Insights  
→ Destination Catalog / Detail  
→ Create Package  
→ Destination & Guide Source  
→ Insight Context  
→ Itinerary  
→ Pricing  
→ Review & Submit  
→ Admin Review  
→ Approved  
→ Publish LIVE  
→ Create / Manage Session  
→ Monitor Bookings  
→ Update Session Operational Note  
→ Reviews / Profile

## 9.1 EO Alternative / Exception Flow

New applicant:
Partner Entry  
→ EO Application  
→ Application Status  
→ Pending / Rejected / Approved

Jika rejected:

- existing application data boleh dipakai untuk re-apply sesuai behavior prototype,
- rejection tidak membuat identity demo approved,
- user tidak boleh memperoleh operational workspace hanya dari URL.

Jika package belum approved:

- package tidak boleh dipublikasikan sebagai LIVE.

Jika session tidak valid/past/non-sellable:

- session tidak boleh menjadi checkout path Traveler.

---

# 10. EO Functional Requirements

## REQ-EO-01 — Partner Entry dan EO Demo

Partner portal harus menyediakan jalur jelas untuk:

- demo EO existing,
- EO baru yang ingin apply.

Acceptance:

- new application tidak terisi identitas demo,
- demo EO tetap dapat membuka workspace,
- tidak ada kebocoran application state.

Status: IMPLEMENTED LIVE.

## REQ-EO-02 — EO Application

Form EO baru harus dapat diisi dalam state bersih.

Acceptance:

- sample/demo identity tidak menjadi submitted value,
- lifecycle review existing tetap digunakan,
- product tidak menciptakan approval otomatis baru.

Status: IMPLEMENTED LIVE.

Open decision:

- canonical default guide category untuk applicant baru masih perlu keputusan tim bila ingin dikunci di PRD ini.

## REQ-EO-03 — Demand Insight

EO dapat melihat data prototype tentang:

- preference themes,
- budget,
- duration,
- departure area,
- sample/context yang tersedia.

Acceptance:

- jelas bahwa data adalah simulasi prototype,
- reference date/sample context tampil,
- distribusi dimensi tidak dinarasikan sebagai intersection,
- tidak menambahkan confidence/intent score tanpa data,
- EO Overview tidak menarasikan count simulasi sebagai traveler nyata/traction; count memakai wording respons simulasi,
- simulated unmet-demand description tetap internal sebagai creative context dan tidak otomatis menjadi Traveler-facing package summary.

Status: IMPLEMENTED LIVE — disclosure dan Builder isolation diperkuat pada F4.3 / PR #92.

## REQ-EO-04 — Destination Catalog dan Detail

EO dapat melihat:

- verification,
- location,
- general destination capacity,
- base cost per person,
- cost scope bila tersedia,
- guide readiness/capability,
- activities/facilities,
- operational notes,
- media.

Acceptance:

- capacity tidak disebut otomatis sebagai session quota,
- guideReady tidak disebut individual assignment,
- cost scope destinasi tidak disamakan dengan package inclusions,
- illustration tidak disebut actual photo.

Status: IMPLEMENTED.

## REQ-EO-05 — Destination Cost Scope

Destination dapat menyediakan optional:

- baseCostIncludes
- baseCostExcludes

Acceptance:

- scope melekat pada destination base cost,
- tidak mengubah customer-price formula,
- tidak menciptakan dynamic pricing,
- data tampil pada EO detail/builder/summary dan Mitra profile jika tersedia.

Status: IMPLEMENTED LIVE.

## REQ-EO-06 — Guide Source

Package menyimpan guide source:

- DESTINATION
- EO

Acceptance:

- label hanya menjelaskan sumber pemandu,
- capability EO/destination tidak dianggap assignment individual,
- eligibility rule existing tidak diubah melalui UI polish.

Status: IMPLEMENTED.

## REQ-EO-07 — Package Builder

Builder harus membantu EO merangkai package dari data yang sudah tersedia.

Minimum flow:

1. destination & guide source,
2. insight context,
3. itinerary,
4. pricing,
5. review/submit.

Pada Step 5, EO dapat membuka Traveler-facing draft preview yang bersifat read-only sebelum submit Admin review.

Acceptance:

- relevant destination facts tetap visible,
- pricing tidak menyembunyikan base-cost context,
- form tidak mengarang operational confirmation,
- Traveler-facing preview hanya memakai current in-memory draft/source-backed fields,
- preview tidak mengubah store, step, submission state, approval state, publish state, atau lifecycle package,
- preview tidak menampilkan EO Margin, platform commission, checkout Service Fee, fake review/rating/session, transactional CTA, atau internal operationalNote,
- unknown/mock image tidak disebut actual photo,
- new draft dari Demand Insight boleh mempertahankan Insight context tetapi Traveler-facing short summary tidak diisi otomatis dari simulated unmet-demand description,
- existing saved draft summary tetap dipertahankan,
- submission tetap mengikuti lifecycle existing.

Status: IMPLEMENTED LIVE — diperkuat pada F3.2 / PR #81.

## REQ-EO-08 — Operational Summary

EO package detail harus memiliki read-only operational summary yang menyatukan data existing.

Dapat mencakup jika tersedia:

- destination,
- location,
- general capacity,
- guide source,
- base cost/cost scope,
- itinerary/duration,
- package update time,
- destination operational note.

Acceptance:

- package.updatedAt tidak disebut latest operational update session,
- summary tidak menjadi approval/status baru.

Status: IMPLEMENTED LIVE.

## REQ-EO-09 — Publish dan Session Management

Package yang memenuhi lifecycle existing dapat dipublikasikan dan dibuat session.

Session minimum:

- package,
- start/end time,
- capacity,
- remaining state,
- price,
- status.

Acceptance:

- `createSession` menolak timestamp invalid, `startAt <= now`, dan `endAt <= startAt`,
- Session yang start time-nya sudah lewat tidak dapat dibuka ulang menjadi `OPEN`,
- future Session tetap dapat disiapkan untuk package `APPROVED` atau `LIVE`,
- `APPROVED` tetap bukan `LIVE`; publication EO tetap state terpisah,
- past session tidak menjadi sellable Traveler session,
- session lifecycle existing dipertahankan,
- tidak menambah destination approval workflow baru hanya untuk prototype improvement.

Status: IMPLEMENTED LIVE — temporal integrity diperkuat pada F4.2 / PR #90.

## REQ-EO-10 — Session Operational Note

EO dapat menambah/mengedit optional operationalNote untuk session.

Acceptance:

- update note mengubah note + timestamp saja,
- tidak mengubah OPEN/FULL/CLOSED/CANCELLED,
- tidak mengubah booking, capacity, checkout eligibility, atau pricing,
- Mitra membaca note sebagai read-only.

Status: IMPLEMENTED LIVE.

## REQ-EO-11 — Bookings dan Reviews

EO dapat melihat booking dan review yang relevan.

Acceptance:

- shared booking harus merujuk transaksi yang sama,
- EO tidak melihat data role lain yang tidak diperlukan,
- review target tetap sesuai EO/guide context,
- review copy tidak mengklaim opini traveler sebagai objektif.

Status: IMPLEMENTED LIVE — review copy diperkuat pada F3.4 / PR #86.

---

# 11. Mitra Destinasi User Flow

Partner Entry  
→ Destination Demo atau Destination Application  
→ Verification Flow  
→ Destination Workspace  
→ Overview  
→ Profile  
→ Capacity  
→ Schedule  
→ Session Operational Summary  
→ Reviews / Settings

## 11.1 Mitra Alternative / Exception Flow

New destination applicant:
Partner Entry  
→ Destination Application  
→ Application / Verification State  
→ Approved operational workspace jika lifecycle existing mengizinkan

Guard:

- registration tidak boleh kembali ke entry gate yang sama tanpa next action,
- unapproved/rejected identity tidak memperoleh operational authority hanya lewat direct URL,
- Mitra tidak mempunyai approve/reject authority terhadap session EO hanya karena dapat membaca schedule,
- missing cost scope/media/operational note harus menghasilkan neutral empty state, bukan data buatan.

---

# 12. Mitra Destinasi Functional Requirements

## REQ-MIT-01 — Entry dan Registration

Calon Mitra harus memiliki jalur application yang tidak looping.

Acceptance:

- CTA "Daftar sebagai Destinasi" membawa ke flow yang dapat dilanjutkan,
- user tidak dikembalikan ke gerbang yang sama tanpa next action,
- demo Mitra existing tetap dapat masuk cepat.

Status: IMPLEMENTED LIVE.

## REQ-MIT-02 — Destination Application

Application dapat menangkap data prototype yang relevan seperti:

- identity/contact,
- location,
- facilities,
- activities,
- general capacity,
- base cost,
- guide readiness,
- optional base-cost scope.

Acceptance:

- helper/copy tidak menciptakan rule pricing/capacity baru,
- cost scope optional,
- lifecycle verification existing dipertahankan.

Status: IMPLEMENTED.

## REQ-MIT-03 — Overview Metrics

Mitra dashboard harus membedakan:

- Kapasitas Umum Destinasi,
- peserta terkonfirmasi,
- jadwal/session mendatang.

Overview dapat menyediakan Akses Cepat read-only menuju route canonical:

- Schedule,
- Capacity,
- Destination Profile,
- Reviews.

Acceptance:

- tidak membuat general capacity tampak sebagai slot yang bisa dijual,
- progress session-level memakai Peserta Terkonfirmasi terhadap Kuota Sesi EO, bukan terhadap Kapasitas Umum Destinasi,
- Kapasitas Umum Destinasi tetap venue context terpisah,
- Quick Actions hanya navigasi/read-only dan tidak memberi authority baru atas session/package EO,
- wording action tidak mengimplikasikan approve, edit quota, atau supervisory authority,
- traveler review tidak diklaim sebagai data objektif,
- spacing/copy harus terbaca jelas,
- terminology mengikuti semantic guard.

Status:

- core IMPLEMENTED LIVE,
- spacing polish D1 IMPLEMENTED LIVE / VERIFIED,
- Quick Actions F3.3 IMPLEMENTED LIVE / PR #83.

## REQ-MIT-04 — Schedule dan Kuota Sesi EO

Schedule menampilkan session EO.

Acceptance:

- session quota dilabeli "Kuota Sesi EO",
- confirmed participants terpisah,
- derived difference jika ada menggunakan "Selisih Operasional",
- derived difference tidak memakai wording "Sisa X Orang" atau tone yang mengesankan sellable availability,
- table mobile boleh horizontal scroll di container.

Status:

- semantic core IMPLEMENTED LIVE,
- header consistency D1 IMPLEMENTED LIVE / VERIFIED,
- sellable-inventory ambiguity diperkuat pada F4.3 / PR #92.

## REQ-MIT-05 — Session Operational Summary

Mitra dapat membuka ringkasan session yang mudah discan.

Dapat menampilkan:

- package,
- EO,
- date/time,
- quota,
- confirmed participants,
- status,
- guide source,
- activities,
- safety/operational notes.

Acceptance:

- field tidak ada tidak diisi dengan asumsi,
- operationalNote EO read-only,
- tidak ada approve/reject session baru.

Status: IMPLEMENTED LIVE.

## REQ-MIT-06 — Destination Cost Scope

Profile Mitra dapat menampilkan:

- base cost,
- termasuk biaya dasar,
- belum termasuk.

Acceptance:

- read-only sesuai data destinasi,
- tidak disamakan dengan package inclusions/exclusions.

Status: IMPLEMENTED LIVE.

## REQ-MIT-07 — Media

Destination profile memprioritaskan destination.imageUrl jika tersedia.

Acceptance:

- asset aktual boleh ditampilkan bila tim menyediakannya,
- prototype fallback tetap illustration,
- tidak perlu persistent upload infrastructure untuk lomba.

Status: PARTIAL — renderer ready, actual photography belum tersedia.

## REQ-MIT-08 — Reviews dan Settings

Mitra dapat melihat review yang terkait destinasi dan mengakses setting/profile surface existing.

Acceptance:

- review tetap berasal dari target destinasi yang benar,
- copy tidak menyebut opini traveler sebagai objektif,
- copy tidak mengklaim pengalaman production nyata; wording pascatrip/tercatat lebih aman untuk prototype.

Status: IMPLEMENTED LIVE — review copy diperkuat pada F3.4 / PR #86.

---

# 13. Admin User Flow

Admin Login / Demo  
→ Overview / Queue  
→ EO Application Review  
→ Destination Verification  
→ Package Approval  
→ Booking Monitoring  
→ Complaint / Trust  
→ Audit

## 13.1 Admin Decision / Exception Flow

Admin review dapat menghasilkan approval atau rejection sesuai lifecycle existing.

Guard:

- keputusan admin harus diterapkan pada record yang sama yang dibaca role terkait,
- rejected/non-approved entity tidak boleh otomatis mendapat operational authority,
- approved package tetap mengikuti publish lifecycle sebelum menjadi Traveler-sellable jika implementation membedakan APPROVED dan LIVE,
- admin demo tidak boleh mengubah rule hanya agar golden demo lebih cepat,
- stale/not-found review target harus gagal aman.

---

# 14. Admin Functional Requirements

## REQ-ADM-01 — Demo Entry

Admin competition prototype dapat menyediakan quick demo access.

Status: IMPLEMENTED.

## REQ-ADM-02 — EO Approval

Admin dapat melihat EO application dan mengambil keputusan sesuai lifecycle existing.

Acceptance:

- rejection/approval tidak dihasilkan dari UI demo secara diam-diam,
- partner state harus membaca decision yang sama.

Status: IMPLEMENTED.

## REQ-ADM-03 — Destination Verification

Admin dapat melihat destination application dan verification context.

Acceptance:

- approved destination mapping menghasilkan canonical destination sesuai flow existing,
- canonical `guideReady` harus konsisten dengan hasil verification Admin `approvedGuideReady`,
- BASIC/PLUS verification dan Guide Ready tetap dua dimensi terpisah,
- destination `guideReady=false` tetap dapat ACTIVE/BASIC tetapi tidak boleh diklaim guide-ready atau menjadi EO-eligible destination,
- cost-scope fields optional dapat diteruskan,
- lifecycle tidak berubah karena discovery polish.

Status: IMPLEMENTED LIVE — destination guide-ready consistency diperkuat pada F4.2 / PR #90.

## REQ-ADM-04 — Package Review

Admin dapat review package sesuai prototype trust loop.

Acceptance:

- package tidak tampil Traveler sebelum lifecycle marketplace mengizinkan,
- approval dan publish tetap state terpisah jika flow existing membedakannya.

Status: IMPLEMENTED.

## REQ-ADM-05 — Booking, Complaint, Trust, Audit

Admin prototype dapat menunjukkan:

- booking/payment visibility,
- complaint surface,
- trust signals,
- audit decisions.

Requirement utama lomba:
membuat trust layer terlihat, bukan membangun full production operations platform.

Status: IMPLEMENTED.

---

# 15. Cross-Role Shared-State Requirements

## REQ-XR-02 — Package Publication Integrity

Paket yang belum sellable tidak boleh muncul sebagai Traveler package sellable.

Acceptance:

- non-LIVE/ineligible package tidak tampil sebagai sellable Traveler package,
- approval Admin dan publication EO tetap dibedakan bila lifecycle existing membedakannya,
- destination eligibility existing tetap dihormati.

Status: IMPLEMENTED / regression guarded.  
Criticality: MUST.

## REQ-XR-03 — Session Integrity

EO session yang valid dapat muncul ke Traveler.
Past/non-sellable session tidak boleh lolos checkout.

Acceptance:

- future sellable session dapat dipilih,
- session creation menolak start time yang sudah lewat/now dan end time yang tidak valid,
- Session lampau tidak dapat diubah kembali menjadi `OPEN`,
- past/closed/cancelled/non-sellable session tidak membuat booking baru,
- session.capacity tidak diganti dengan destination.capacityPerSession.

Status: LIVE / VERIFIED — domain guard diperkuat pada F4.2 / PR #90.  
Criticality: MUST.

## REQ-XR-04 — Booking Integrity

Traveler, EO, Admin, dan Mitra harus membaca state transaksi/session yang konsisten dari prototype shared stores.

Acceptance:

- satu booking/payment tidak direplikasi menjadi record berbeda hanya untuk tiap role,
- participant effect pada session berasal dari transaction/booking state yang sama,
- perubahan quantity/payment mengikuti invariant checkout existing.

Status: IMPLEMENTED / regression guarded.  
Criticality: MUST.

## REQ-XR-05 — Review Propagation

Destination review tampil pada Mitra surface terkait.
EO/Guide review tampil pada EO surface terkait.
Admin trust boleh membaca aggregate signal dari record yang sama.

Acceptance:

- Destination review dan EO/Guide review tetap dua record/target berbeda,
- review hanya muncul pada target yang benar,
- empty review state tidak diisi fake rating/comment.

Status: IMPLEMENTED.  
Criticality: SHOULD untuk demo singkat, MUST bila trust-loop review didemokan.

## REQ-XR-06 — Privacy

Traveler internal/private data tidak boleh dipresentasikan ke partner bila tidak relevan.

Secara khusus:

- operationalNote internal session tidak ditampilkan pada Traveler,
- Mitra tidak membutuhkan biodata lengkap peserta,
- Demand Insight tidak menampilkan Traveler PII.

Acceptance:

- operationalNote EO/Mitra tidak bocor ke Traveler,
- partner schedule/capacity cukup memakai participant aggregate,
- Demand Insight tetap aggregate/simulated context tanpa identitas Traveler.

Status: LIVE / VERIFIED pada scope improvement terbaru.  
Criticality: MUST.

---

# 16. Pricing dan Payment Prototype

## 16.1 Package Price

Current package formula yang dipertahankan di prototype:

Customer Package Price = Destination Base Cost + EO Margin

Formula ini adalah harga paket sebelum traveler service fee.

## 16.2 Traveler Checkout Fee

Current prototype checkout menambahkan fixed service fee Rp7.500 per transaksi booking.

Current traveler-facing payment breakdown:

Subtotal = Unit Package Price × Participant Count

Total = Subtotal + Rp7.500 Service Fee

Acceptance:

- service fee muncul transparan sebelum pembayaran,
- service fee dikenakan per booking/transaksi, bukan per participant,
- checkout/payment/result menggunakan breakdown yang sama.

Status: LIVE / VERIFIED.

## 16.3 Canonical Business Model Narrative

Berdasarkan **Draf PROPOSAL HOLOGY saat ini**, JedaIn memiliki dua sumber pendapatan pada setiap transaksi:

1. **Platform commission sebesar 10% dari GMV**, dan
2. **Service Fee flat Rp7.500 per transaksi booking**.

Interpretasi yang harus dipakai agar proposal dan prototype konsisten:

- commission 10% dihitung dari GMV sebagai economics/platform take rate,
- commission **bukan** line item tambahan yang dibebankan ke Traveler pada checkout,
- proposal menjelaskan EO tetap menerima margin bersih setelah potongan commission,
- service fee Rp7.500 adalah fee Traveler yang ditampilkan transparan sebagai line item terpisah,
- prototype Traveler saat ini hanya mensimulasikan traveler-facing checkout/payment breakdown,
- prototype **tidak wajib** mensimulasikan payout/settlement EO atau pemotongan commission 10% di UI.

Dengan demikian, tidak ada kebutuhan menambahkan line item "commission 10%" ke checkout Traveler.

Developer tidak boleh mengubah formula package, service fee, atau membuat settlement EO baru tanpa task/requirement khusus.

Status: BUSINESS NARRATIVE RESOLVED FOR COMPETITION PRD.

---

# 17. Data dan State Requirements

Prototype tidak membutuhkan database production.

Current architecture boleh memakai:

- TypeScript interfaces,
- fixtures,
- in-memory stores,
- module-level state,
- React state,
- data URI media untuk demo tertentu,
- sessionStorage untuk temporary Traveler session dan same-tab Traveler transaction ledger.

## 17.1 Key Product Entities

Minimum conceptual entities:

- Traveler Session
- Quiz Draft
- Recommendation
- Destination
- EO
- Package
- Session
- Booking
- Payment Breakdown
- Review
- Verification/Application
- Operational Note

## 17.2 Important Fields Introduced/Clarified

Destination:

- capacityPerSession
- baseCostPerPerson
- baseCostIncludes optional
- baseCostExcludes optional
- guideReady
- imageUrl optional
- operationalNotes

Package:

- destinationBaseCost
- eoMargin
- customerPrice
- guideSource
- includedItems
- excludedItems
- meetingPointLabel optional
- accessNotes optional
- visualAsset/image source

Session:

- capacity
- remainingSlots
- operationalNote optional
- operationalNoteUpdatedAt optional

Traveler SessionState:

- user
- onboarding
- quizDraft

Traveler Transaction Session State:

- booking records,
- payment attempt records,
- idempotency linkage yang dibutuhkan untuk replay invariant,
- persisted hanya pada sessionStorage per browser tab/session,
- bukan production database, bukan cross-tab synchronization.

## 17.3 Data Honesty

Fixture data adalah data prototype.

Jangan menyatakan:

- titik kumpul fixture sebagai informasi operasional nyata,
- illustration sebagai foto aktual,
- demand sample simulasi sebagai market validation,
- operational note sebagai approval.

---

# 18. Route / Screen Map

Route map ini mengikuti route yang benar-benar tersedia pada current prototype. Tidak semua route wajib ditunjukkan saat demo.

## Traveler

| Route                                | Purpose                            |
| ------------------------------------ | ---------------------------------- |
| /                                    | Landing                            |
| /login                               | Traveler login / guest             |
| /onboarding/consent                  | Consent                            |
| /onboarding/quiz                     | Preference quiz                    |
| /onboarding/result                   | Recommendation                     |
| /home                                | Personalized home                  |
| /explore                             | Catalog/explore                    |
| /packages/:packageId                 | Package detail                     |
| /packages/:packageId/sessions        | Session selection                  |
| /checkout/:sessionId                 | Checkout                           |
| /checkout/:sessionId/contact         | Contact verification               |
| /checkout/:sessionId/pending-payment | Pending payment handling           |
| /payment/:bookingId                  | Payment simulation                 |
| /payment/:bookingId/result           | Payment result                     |
| /trips                               | My Trips                           |
| /trips/:bookingId                    | Trip detail                        |
| /trips/:bookingId/review             | Destination + EO/Guide review flow |
| /profile                             | Profile                            |
| /profile/settings                    | Profile settings / logout          |
| /profile/activity                    | Traveler activity                  |
| /profile/preferences                 | Retake preference                  |
| /profile/verify-phone                | Profile phone verification         |
| /travelers/search                    | Prototype traveler discovery       |
| /travelers/:travelerId               | Public traveler profile            |
| /travelers/:travelerId/followers     | Followers                          |
| /travelers/:travelerId/following     | Following                          |
| /complaints/new                      | Prototype complaint placeholder    |

## Partner / EO

| Route                                    | Purpose                    |
| ---------------------------------------- | -------------------------- |
| /partner                                 | Partner entry              |
| /partner/login                           | Partner login              |
| /partner/eo/login                        | EO login alias             |
| /eo/login                                | EO login alias             |
| /partner/apply/eo                        | EO application             |
| /partner/application                     | Application status         |
| /partner/eo                              | EO overview                |
| /partner/eo/insights                     | Demand insight             |
| /partner/eo/destinations                 | Destination catalog        |
| /partner/eo/destinations/:destinationId  | Destination detail         |
| /partner/eo/packages                     | Package list               |
| /partner/eo/packages/new                 | Package builder            |
| /partner/eo/packages/:packageId          | Package detail             |
| /partner/eo/packages/:packageId/sessions | Package session management |
| /partner/eo/sessions                     | Session management         |
| /partner/eo/bookings                     | Booking view               |
| /partner/eo/reviews                      | EO reviews                 |
| /partner/eo/profile                      | EO profile                 |

Pada EO subdomain, root/login aliases mengarahkan ke EO-oriented entry dan operational workspace tetap memakai route `/partner/eo/*`.

## Destination Partner

| Route                                 | Purpose                   |
| ------------------------------------- | ------------------------- |
| /partner/apply/destination            | Destination application   |
| /partner/application                  | Shared application status |
| /partner/destination                  | Overview                  |
| /partner/destination/profile          | Destination profile       |
| /partner/destination/verification     | Verification badge/status |
| /partner/destination/schedule         | EO schedule               |
| /partner/destination/capacity         | Capacity view             |
| /partner/destination/reviews          | Destination reviews       |
| /partner/destination/profile-settings | Settings                  |

## Admin

| Route                                           | Purpose                         |
| ----------------------------------------------- | ------------------------------- |
| /admin/login                                    | Admin entry                     |
| /admin                                          | Overview                        |
| /admin/eo-approvals                             | EO review queue                 |
| /admin/eo-approvals/:applicationId              | EO application review           |
| /admin/destination-verifications                | Destination review queue        |
| /admin/destination-verifications/:applicationId | Destination verification detail |
| /admin/package-approvals                        | Package review queue            |
| /admin/package-approvals/:submissionId          | Package review checklist        |
| /admin/bookings                                 | Booking monitoring              |
| /admin/complaints                               | Complaint handling              |
| /admin/complaints/:complaintId                  | Complaint detail                |
| /admin/trust                                    | Trust status                    |
| /admin/audit                                    | Audit activity                  |

---

# 19. UX State Requirements

Setiap surface penting harus menangani state yang relevan tanpa crash.

Minimum categories:

- loading jika memang async,
- empty,
- not found,
- unavailable/stale,
- error yang recoverable,
- protected-route redirect.

Examples:

- package ID tidak ada → friendly not-found state,
- tidak ada future session → empty future-session state,
- past session direct checkout → unavailable,
- cost scope kosong → neutral unavailable copy,
- operational note kosong → tidak mengarang update.

---

# 20. Responsive Requirements

Prototype harus dapat didemokan minimal pada:

- 360 × 800
- 390 × 844
- 768 × 1024
- 1440 × 900

Acceptance:

- tidak ada accidental page-level horizontal overflow,
- table operational boleh memiliki internal horizontal scroll,
- primary CTA tidak tertutup,
- dialog/form tetap usable,
- Traveler mobile navigation tetap nyaman.

Status: current audit PASS pada surface utama.

---

# 21. Accessibility Requirements

Prototype tidak perlu compliance certification formal, tetapi basic accessibility harus dijaga.

Minimum:

- form label valid,
- icon button memiliki accessible name,
- focus terlihat,
- dialog dapat ditutup jelas,
- image alt jujur,
- heading cukup terstruktur,
- status tidak hanya bergantung pada warna,
- action target cukup nyaman,
- quantity stepper dapat dibaca assistive technology.

Batch D1 memperbaiki ParticipantQuantity semantics.

Status:
core IMPLEMENTED,
D1 polish IMPLEMENTED LIVE / VERIFIED.

---

# 22. Performance Requirements

Performance adalah prototype polish, bukan business blocker.

Current audit:

- bundle awal cukup besar karena eager imports,
- Vite memberi large-chunk warning.

Requirement:

- aplikasi harus terasa responsif pada demo,
- jangan melakukan optimasi berisiko besar hanya untuk mengejar angka bundle,
- route-level code splitting dapat dilakukan sebagai optional Batch D3 jika stabil.

Priority:
P2 / OPTIONAL PROTOTYPE POLISH.

D1/D2 sudah memiliki production checkpoint yang stabil pada commit 4208ddd. D3 tetap optional dan hanya perlu dilakukan jika performance benar-benar mengganggu pengalaman demo.

---

# 23. Media Requirements

Current:

- rendering path mendukung imageUrl/custom package image,
- fallback illustration tersedia,
- real photographic destination assets belum tersedia di repository.

Requirement:

- jika tim memiliki foto destinasi nyata, gunakan pada surface Traveler/EO/Mitra yang relevan,
- caption/context boleh ditambahkan,
- jangan membangun media backend production hanya untuk lomba,
- video tidak mandatory.

Status: PARTIAL / CONTENT DEPENDENCY.

---

# 24. Demo Reliability Requirements

REQ-DEMO-01 — Quick Role Access  
Juri dapat masuk ke role tanpa setup teknis panjang.

REQ-DEMO-02 — Deterministic Story  
Golden demo dapat dijalankan dengan data prototype yang stabil.

REQ-DEMO-03 — No Demo Dead End  
Tidak ada redirect loop, stale past-session checkout, blank page, atau role dead end pada path utama.

REQ-DEMO-04 — Shared-State Story  
Jika demo memakai package/session/booking lintas role, state harus terasa berasal dari objek yang sama.

REQ-DEMO-05 — Honest Prototype Labels  
Simulation/demo controls tidak ditampilkan sebagai kemampuan production nyata.

REQ-DEMO-06 — Reset Capability  
Jika demo reset digunakan, reset harus mengembalikan baseline tanpa merusak immutable fixtures.

---

# 25. Non-Functional Quality Gate

Sebelum commit besar dinyatakan siap:

- format check pass,
- lint pass,
- typecheck pass,
- tests pass,
- build pass.

Current verified competition baseline setelah F4.3:

- current app feature commit: b0b1122a25ee403ab8923c28838c291410ba5faf,
- 48 suites / 679 tests,
- format check PASS,
- lint PASS,
- typecheck PASS,
- tests PASS,
- production build PASS,
- PR #79 Package Gallery, PR #80 Post-Booking Trip Brief, PR #81 EO Traveler-Facing Draft Preview, PR #83 Mitra Destination Overview Quick Actions, PR #86 Final Trust & Interaction Cleanup, PR #88 Traveler Transaction Session Persistence, PR #90 Session & Destination Governance Integrity, dan PR #92 Final Semantic Truthfulness Hardening sudah merged.

Catatan: production/live deployment tetap mengikuti hasil deploy platform; baseline di atas adalah current canonical app source pada `main`.

Test count boleh bertambah.
Existing test count tidak boleh turun tanpa alasan yang dijelaskan.

---

# 26. Implementation Status Summary

## LIVE pada baseline 4208ddd

Implemented and verified:

- stale-session protection,
- EO new-application hygiene,
- destination registration-loop fix,
- Traveler session slot/date clarity,
- trust badge explanation,
- EO capacity context,
- guide context,
- Mitra capacity vs session quota separation,
- EO operational summary,
- Mitra session operational summary,
- Demand Insight context/disclaimer,
- Traveler meeting point/access,
- Traveler Package Detail gallery dengan prototype-safe visual views (F3.0 / PR #79),
- Traveler post-booking Trip Brief pada Trip Detail (F3.1 / PR #80),
- EO Traveler-facing draft preview pada Package Builder Step 5 (F3.2 / PR #81),
- Mitra Destination Overview Quick Actions read-only (F3.3 / PR #83),
- final review truthfulness copy + Traveler shell dead-affordance cleanup (F3.4 / PR #86),
- Traveler transaction ledger same-tab refresh persistence menggunakan sessionStorage (F4.1 / PR #88),
- future-only EO Session temporal guard + destination guide-ready governance consistency (F4.2 / PR #90),
- sample-vs-post-trip rating provenance, Demand Insight disclosure/Builder isolation, APPROVED-vs-LIVE guidance, Mitra capacity semantic truthfulness, dan conditional re-review copy (F4.3 / PR #92),
- media renderer/source priority,
- destination cost scope,
- session operational note,
- payment breakdown + fixed Rp7.500 service fee,
- capacity copy spacing,
- Mitra schedule header "Kuota Sesi EO",
- checkout quantity accessibility,
- Traveler SessionState persistence using sessionStorage,
- corruption fallback,
- reset/logout storage clearing,
- quiz draft refresh persistence,
- production demo smoke test on Traveler/EO/Mitra/payment,
- D1 + D2 production smoke verification.

## PARTIAL

- actual destination photos:
  rendering path siap, asset fotografi nyata belum tersedia.

## OPTIONAL NEXT

- Batch D3 route-level code splitting/performance optimization.

---

# 27. Out of Scope untuk Competition Prototype

Jangan diprioritaskan kecuali tim secara eksplisit mengubah scope:

- full production backend,
- production database,
- production OAuth/token architecture,
- real payment gateway,
- full in-app chat,
- mandatory destination video,
- dynamic pricing engine,
- complex multi-EO scheduling automation,
- full guide assignment/calendar engine,
- broad participant biodata,
- production notification infrastructure,
- complete operational history/audit engine untuk session notes,
- production media upload/CDN system,
- production-grade security hardening project.

---

# 28. Product Decisions dan Remaining Content Dependency

## RESOLVED-01 — EO Applicant Guide Category Default

Source comparison:

- historical PRD pernah menyebut new EO default `CONCEPT_ONLY`,
- current `EoApplicationScreen` memulai form dengan `CERTIFIED_GUIDE` sebagai selected UI default,
- Draf PROPOSAL saat ini menjelaskan dua status — `Certified Guide` dan `Concept Only` — tetapi **tidak menetapkan default product rule** untuk applicant baru.

Canonical competition-prototype rule:

- kedua kategori valid,
- PRD **tidak mengunci default business rule** ke salah satu kategori,
- selected default `CERTIFIED_GUIDE` pada current form diperlakukan sebagai **prototype UI convenience**, bukan kebijakan kelayakan EO,
- demo account Certified dan Concept-Only tetap boleh tersedia,
- eligibility package tetap mengikuti guide capability/source rules yang sudah ada.

Tidak ada code change yang diwajibkan dari keputusan dokumentasi ini.

Jika tim nanti ingin applicant benar-benar membuat pilihan eksplisit, blank/unselected placeholder dapat menjadi UX polish terpisah.

Status: RESOLVED FOR PRD SCOPE.

## RESOLVED-02 — Commercial Monetization Narrative

Draf PROPOSAL saat ini secara eksplisit menggunakan dua sumber pendapatan:

- platform commission 10% dari GMV,
- Service Fee flat Rp7.500 per booking.

Canonical competition narrative:

- harga package berasal dari Destination Base Cost + EO Margin,
- commission 10% adalah economics platform dan tidak ditambahkan sebagai commission line item ke Traveler,
- service fee Rp7.500 ditampilkan transparan kepada Traveler,
- prototype checkout tidak perlu mensimulasikan settlement/payout EO.

Ini membuat Bab IV proposal dan current Traveler checkout dapat dijelaskan secara konsisten tanpa perubahan code.

Status: RESOLVED FOR COMPETITION PRD.

## OPEN-03 — Real Destination Photography

Need:
foto aktual bernilai untuk trust dan judge-facing visual credibility.

Dependency:
asset dari tim/content owner.

Status:
CONTENT DEPENDENCY, bukan technical blocker.

---

# 29. Requirements Traceability — Discovery Improvement to Product Requirement

| Improvement                      | Canonical Requirement                   |
| -------------------------------- | --------------------------------------- |
| Past session filtering           | REQ-TRV-08                              |
| EO application hygiene           | REQ-EO-01 / REQ-EO-02                   |
| Destination registration loop    | REQ-MIT-01                              |
| Session slot clarity             | REQ-TRV-08                              |
| Trust badge explanation          | REQ-TRV-07                              |
| Capacity context                 | Section 6 + REQ-EO-04 + REQ-MIT-03/04   |
| Guide context                    | Section 6 + REQ-EO-06                   |
| EO operational summary           | REQ-EO-08                               |
| Mitra operational summary        | REQ-MIT-05                              |
| Demand insight context           | REQ-EO-03                               |
| Meeting point/access             | REQ-TRV-07                              |
| Package Detail gallery           | REQ-TRV-07 + media semantics            |
| Post-booking Trip Brief          | REQ-TRV-13 + REQ-TRV-07                 |
| EO Traveler-facing draft preview | REQ-EO-07                               |
| Destination cost scope           | REQ-EO-05 + REQ-MIT-06                  |
| Session operational note         | REQ-EO-10 + REQ-MIT-05                  |
| D1 accessibility/copy            | REQ-TRV-09 + REQ-MIT-03/04 + Section 21 |
| D2 session persistence           | REQ-TRV-03                              |

---

# 30. Golden Demo Acceptance Flow

Untuk demo utama, tim dapat memakai sequence:

1. Traveler masuk via login/guest demo.
2. Traveler menyelesaikan consent + quiz.
3. Traveler melihat recommendation.
4. EO Demo membuka Demand Insights.
5. EO menunjukkan destination context dan package design.
6. Admin menunjukkan trust/approval layer.
7. EO menunjukkan package/session.
8. Traveler membuka package detail dan memilih future session.
9. Traveler melihat meeting point/access dan trust context.
10. Traveler checkout dengan participant quantity.
11. Checkout menunjukkan subtotal + service fee + total.
12. Payment simulation selesai.
13. Booking/trip terlihat pada Traveler, termasuk Trip Brief berisi departure time, meeting point/location context, dan access notes bila source data tersedia.
14. EO/Admin/Mitra memperlihatkan state terkait jika diperlukan.
15. Mitra menunjukkan kapasitas umum, kuota sesi EO, peserta terkonfirmasi, dan operational summary.
16. EO menunjukkan operational note yang sama dibaca Mitra.
17. Trip completion/review dapat disimulasikan bila dibutuhkan untuk trust-loop story.

Demo tidak wajib menunjukkan setiap menu.
Prioritas adalah membuat core value loop mudah dipahami.

---

# 31. Development Rules Setelah PRD Ini Menjadi Canonical

Sebelum coding:

1. baca PRD ini,
2. identifikasi REQ ID yang disentuh,
3. pastikan change tidak mengubah requirement lain diam-diam,
4. jika change menyentuh Open Decision, stop dan minta keputusan tim,
5. tulis acceptance criteria,
6. run full regression.

Untuk prototype:

- lebih baik satu improvement kecil yang terlihat jelas daripada infrastruktur besar yang tidak terlihat juri,
- jangan melakukan production engineering karena asumsi "aplikasi live berarti harus production-grade",
- jangan menghapus demo helpers yang memang mempermudah penjurian tanpa alasan.

---

# 32. Revision Policy

PRD ini harus diperbarui bila:

- tim mengubah business rule,
- requirement baru resmi masuk prototype,
- open decision dikunci,
- user flow utama berubah,
- implementation yang sudah dianggap canonical berubah secara material.

PRD tidak perlu diperbarui untuk:

- refactor internal tanpa behavior change,
- rename private helper,
- test-only implementation detail,
- cosmetic polish yang tidak mengubah requirement.

Setiap update sebaiknya menyebut:

- tanggal,
- requirement ID yang berubah,
- alasan,
- implementation status.

---

# 33. PRD Canonicalization Checklist

Checklist ini telah direview untuk canonical merge PR #74:

- [x] Prototype scope: competition prototype, bukan production app.
- [x] Guest/demo mode tetap diperbolehkan.
- [x] Traveler golden flow sesuai demo yang ingin ditunjukkan.
- [x] EO golden flow sesuai cara tim menjelaskan demand → package.
- [x] Mitra flow cukup untuk menunjukkan capacity/cost/operational context.
- [x] Admin flow cukup untuk menunjukkan trust/approval layer.
- [x] Terminologi capacity / guide / operationalNote disetujui.
- [x] Current prototype service fee Rp7.500 boleh tetap ditampilkan.
- [x] Narasi monetization untuk proposal/pitch diputuskan atau minimal tidak kontradiktif.
- [x] EO applicant guide category dipahami: tidak ada product-level default yang dikunci; current CERTIFIED_GUIDE adalah UI convenience.
- [x] Monetization narrative dipahami: 10% GMV commission + Rp7.500 traveler service fee.
- [x] Prototype checkout tidak perlu menampilkan commission 10% sebagai Traveler line item.
- [x] Actual destination photo tetap content dependency, bukan blocker engineering.
- [x] Route map sesuai current implementation.
- [x] D1 + D2 tetap terjaga.
- [x] F3.0 Traveler Package Gallery merged melalui PR #79 tanpa business-rule change.
- [x] F3.1 Traveler Post-Booking Trip Brief merged melalui PR #80 tanpa business-rule change.
- [x] F3.2 EO Traveler-Facing Draft Preview merged melalui PR #81 tanpa business-rule change.
- [x] F3.3 Mitra Destination Overview Quick Actions merged melalui PR #83 tanpa business-rule change.
- [x] F3.4 Final Trust & Interaction Cleanup merged melalui PR #86 tanpa business-rule change.
- [x] F4.1 Traveler Transaction Session Persistence merged melalui PR #88 tanpa business-rule change.
- [x] F4.2 Session & Destination Governance Integrity merged melalui PR #90 tanpa business-rule change.
- [x] F4.3 Final Semantic Truthfulness Hardening merged melalui PR #92 tanpa business-rule change.
- [x] Guest Demo tetap diperbolehkan sebagai prototype Traveler identity untuk mendemonstrasikan booking → completion → Destination review + EO/Guide review.
- [x] Accepted findings dari Traveler / EO / Mitra / Admin-Judge simulation sudah ditutup sampai F4.3.
- [x] Current canonical app baseline: b0b1122a25ee403ab8923c28838c291410ba5faf dengan 48 suites / 679 tests PASS.
- [x] Tidak ada requirement production infrastructure yang tanpa sengaja menjadi wajib.

Jika business rule baru muncul di luar keputusan di atas, PRD boleh menyimpannya sebagai **OPEN** dan developer tidak boleh menguncinya sendiri.

---

# 34. Current Decision

JedaIn tetap dikembangkan sebagai **competition prototype yang matang**, bukan production platform.

Definition of "matang" untuk tahap ini:

- requirement jelas,
- user flow jelas,
- wording semantik konsisten,
- demo stabil,
- interaction enak untuk juri,
- state lintas role dapat dipahami,
- prototype jujur tentang simulasi dan keterbatasannya,
- engineering proporsional terhadap tujuan lomba.

---

# 35. F3 — Cross-Role Experience Clarity Revision Log

Tanggal revision log: 25–26 September 2026.

Scope F3 tetap berada di bawah feature-freeze exception: judge-critical UX clarity dengan scope kecil dan tanpa perubahan business model.

## F3.0 — Traveler Package Detail Gallery

PR: #79  
Merge commit: `9369830a47a5d852ad7ec11aa6cd1e626e4b39b0`

Perubahan canonical:

- Package Detail memiliki gallery suasana dengan tiga selectable visual views.
- Gallery memakai existing prototype visual source.
- Copy eksplisit menyatakan visual prototype bukan dokumentasi kondisi aktual destinasi.
- Home dan Explore tetap single-cover.
- Tidak ada backend/media-upload architecture baru.

Requirement impact:

- memperkuat traveler-facing media clarity pada package detail,
- tidak mengubah pricing, trust authority, package lifecycle, capacity, payment, atau review semantics.

## F3.1 — Traveler Post-Booking Trip Brief

PR: #80  
Merge commit: `01b517fbdd94d10586fb4ad113d334f754e588cb`

Perubahan canonical:

- Traveler Trip Detail menampilkan section `Informasi Keberangkatan`.
- Data berasal dari source existing: session date/time, meeting point, destination/location context, dan access notes.
- Jika meeting point tidak tersedia, copy canonical bersifat netral: `Belum dicantumkan pada detail experience.`
- Access notes di-omit ketika tidak tersedia.
- Safety/preparation notes existing tetap berada pada `Sebelum Berangkat` agar tidak diduplikasi.
- Internal `operationalNote` tetap tidak pernah ditampilkan pada Traveler.

Quality gate setelah F3.1:

- 43 test suites,
- 627 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS.

Business rule impact:

- NONE.
- Package Price tetap Destination Base Cost + EO Margin.
- Traveler Service Fee tetap Rp7.500 / booking.
- Platform Commission tetap 10% GMV dan bukan Traveler line item.
- Tidak ada perubahan role authority, refund policy, payment simulation boundary, atau cross-role persistence architecture.

## F3.2 — EO Traveler-Facing Draft Preview

PR: #81  
Merge commit: `f9a067514713753f7063a08e7889dfa50da921c3`

Perubahan canonical:

- EO Package Builder Step 5 memiliki action `Preview sebagai Traveler`.
- Preview bersifat read-only dan memakai current in-memory Builder state.
- Preview dapat menampilkan visual utama bila tersedia, title, destination/location, duration, short summary, customer price, itinerary, dan safety notes yang source-backed.
- Jika visual belum tersedia, UI memakai neutral placeholder dan tidak mengarang foto destinasi.
- Preview tidak menampilkan EO Margin, platform commission, checkout Service Fee Rp7.500, fake LIVE/Approved state, fake reviews/ratings, fake session availability, booking/checkout/payment CTA, atau internal `operationalNote`.
- Included/excluded, meeting point, dan access notes tidak ditambahkan bila Builder belum memiliki authoritative current-state fields untuk itu.
- Membuka/menutup preview tidak menyimpan draft baru, submit, publish, mengubah step, atau memutasi lifecycle package.

Quality gate setelah F3.2:

- 44 test suites,
- 633 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS.

Business rule impact:

- NONE.
- Package Price tetap Destination Base Cost + EO Margin.
- Traveler Service Fee tetap Rp7.500 / booking dan hanya checkout-level line item.
- Platform Commission tetap 10% GMV dan bukan Traveler line item.
- Admin tetap package approval authority.
- APPROVED tetap tidak sama dengan LIVE; publish tetap tindakan EO.

## F3.3 — Mitra Destination Overview Quick Actions

PR: #83  
Merge commit: `0c2a0cd0a588f7c2708e9450e17bd3a36b64b0f1`

Perubahan canonical:

- Destination Overview memiliki section `Akses Cepat` langsung setelah metric band.
- Quick Actions menuju route canonical:
  - `/partner/destination/schedule` — `Lihat Jadwal`,
  - `/partner/destination/capacity` — `Lihat Rincian Kapasitas`,
  - `/partner/destination/profile` — `Lihat Profil Destinasi`,
  - `/partner/destination/reviews` — `Lihat Semua Ulasan`.
- Seluruh action menggunakan client-side navigation dan bersifat read-only.
- Copy capacity menggunakan wording netral `Konteks daya tampung venue dan alokasi sesi EO`.
- Review copy tidak mengklaim traveler review sebagai objektif.
- Quick Actions tetap tersedia ketika upcoming sessions atau reviews kosong.
- Existing Overview metrics, schedule preview, profile summary, review preview, capacity semantics, dan participant semantics tetap tidak berubah.

Quality gate setelah F3.3:

- 45 test suites,
- 638 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS.

Business rule impact:

- NONE.
- Mitra tidak mendapat approve/reject authority terhadap package atau session EO.
- `Kapasitas Umum Destinasi` tetap general venue context, bukan sellable availability.
- `Peserta Terkonfirmasi` tetap booking-derived participant aggregate.
- Tidak ada perubahan pricing, payment, refund, lifecycle, atau cross-role state architecture.

## F3.4 — Final Trust & Interaction Cleanup

PR: #86  
Merge commit: `399f869e380df628c5c30040383d319ee0e275b1`

Perubahan canonical:

- Traveler review form menggunakan traveler-authored wording `Bagikan penilaianmu...` dan tidak lagi menyebut evaluasi sebagai objektif.
- EO Reviews tidak lagi menyebut traveler review sebagai objektif.
- Destination Reviews tidak lagi menggunakan klaim `Ulasan objektif` atau `Ulasan pengalaman nyata`; helper menggunakan wording pascatrip/tercatat.
- Review eligibility tetap terikat pada authenticated Traveler, booking milik Traveler, dan status `COMPLETED`.
- Destination review dan EO/Guide review tetap dua target/record terpisah.
- Traveler notification bell yang inert dihapus dari app shell karena tidak memiliki action, route, atau source-backed notification state.
- Tidak ada notification route/store/push/email/SMS infrastructure yang ditambahkan.
- Home, Explore, My Trips, dan Profile bottom navigation tetap tidak berubah.

Quality gate setelah F3.4:

- 45 test suites,
- 639 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

Business rule impact:

- NONE.
- Package Price, Traveler Service Fee Rp7.500, Platform Commission 10% GMV, payment simulation, refund semantics, role authority, approval/publish lifecycle, capacity semantics, dan cross-role state architecture tidak berubah.

Feature-freeze decision:

- F3.4 menutup batch F3.
- Setelah F3.4, default mode kembali ke feature freeze.
- Coding baru hanya dilakukan bila simulasi role/judge menemukan P0 blocker, factual correction, atau judge-critical P1 yang kecil dan evidence-backed.

## F4.1 — Traveler Transaction Session Persistence

PR: #88  
Merge commit: `68da872cf3f7c12f75241ba41f1df1fab95984a7`

Finding addressed:

- TR-01 dari Traveler adversarial simulation: Payment Result dan Trip Detail kehilangan transaksi baru setelah normal browser refresh.

Perubahan canonical:

- `mockTransactionStore` tetap authoritative shared booking/payment ledger.
- Booking, PaymentAttempt, dan idempotency linkage yang diperlukan untuk replay invariant dipersist ke versioned `sessionStorage` key per browser tab/session.
- Same-tab refresh dapat memulihkan pending payment, successful payment result, My Trips, dan Trip Detail untuk booking yang sama.
- `paymentExpiresAt` tetap authoritative; refresh tidak memulai ulang countdown.
- Expired pending payment tetap direkonsiliasi menjadi `EXPIRED` dan reservation dilepas.
- `PAID` / `COMPLETED` persisted state hanya valid bila memiliki matching `PaymentAttempt` berstatus `SUCCEEDED` serta timestamp lifecycle yang koheren.
- Malformed atau incoherent persisted payload ditolak secara aman dan tidak boleh memfabrikasi successful payment/trip.
- Restored idempotency linkage wajib cocok dengan booking/payment yang sama dan input booking canonical.
- Traveler logout hanya menghapus Traveler session/auth state; logout tidak menghapus shared authoritative transaction ledger.
- Ownership checks tetap mencegah Traveler lain membaca booking yang bukan miliknya.
- Explicit competition/demo reset tetap dapat membersihkan transaction ledger.

Quality gate setelah F4.1:

- 46 test suites,
- 655 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

Business / architecture impact:

- Tidak ada perubahan Package Price, Destination Base Cost, EO Margin, Traveler Service Fee Rp7.500, Platform Commission 10% GMV, refund semantics, payment simulation semantics, review eligibility, atau role authority.
- Tidak ada `localStorage`, IndexedDB, BroadcastChannel, backend/database, atau cross-tab synchronization.
- F4.1 tidak menyelesaikan seluruh cross-role hard-reload constraint; scope hanya same-tab Traveler transaction recovery yang dibutuhkan oleh explicit Traveler contracts.

Feature-freeze status:

- F4.1 adalah targeted judge-critical P1 reopening dari feature freeze berdasarkan external Traveler simulation.
- Di luar accepted final-hardening findings, feature freeze tetap berlaku.

## F4.2 — Session & Destination Governance Integrity

PR: #90  
Merge commit: `c41547ef9217af267c36131d1ab54283e8f8fba9`

Findings addressed:

- EO-F01: EO dapat membuat/reopen Session `OPEN` dengan waktu mulai yang sudah lewat.
- ADM-F01: Hutan Bambu Trawas memiliki `approvedGuideReady=false` pada Admin verification tetapi canonical destination sebelumnya `guideReady=true`.

Perubahan canonical:

- `mockEoPackageStore.createSession` menolak timestamp invalid, `startAt <= now`, dan `endAt <= startAt`.
- `updateSessionStatus(..., "OPEN")` menolak Session yang start time-nya sudah lewat.
- UI EO Session memakai future-safe datetime default yang berasal dari waktu browser, bukan hard-coded competition date.
- Package `APPROVED` maupun `LIVE` tetap dapat menyiapkan future Session; `APPROVED` tetap tidak berarti marketplace `LIVE`.
- `dest_hutan_trawas` tetap `ACTIVE` + `BASIC`, tetapi canonical `guideReady=false` sesuai Admin verification.
- Copy yang mengklaim kesiapan pemandu pada Hutan Bambu dihapus/diturunkan menjadi not-ready factual context.
- Existing EO eligibility tetap membutuhkan `ACTIVE` + BASIC/PLUS + `guideReady=true`; Hutan Bambu tidak lagi EO-eligible selama `guideReady=false`.
- Direct EO destination detail untuk destination yang tidak eligible tetap dapat dibaca sebagai context, tetapi tidak menawarkan active create-package CTA.
- Admin Trust dan Mitra surfaces membaca Guide Ready dari canonical destination yang sama dan tidak lagi mengklaim Hutan Bambu Guide Ready.
- Test temporal yang berhasil dibuat calendar-safe agar tidak kedaluwarsa karena tanggal tetap.

Quality gate setelah F4.2:

- 47 test suites,
- 668 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

Business / authority impact:

- NONE.
- Tidak ada perubahan Package Price, Destination Base Cost, EO Margin, Traveler Service Fee Rp7.500, Platform Commission 10% GMV, payment/refund semantics, F4.1 transaction persistence, review semantics, atau role authority.
- Tidak ada guide roster/assignment engine, destination approval workflow baru, backend, atau cross-tab persistence.

Feature-freeze status:

- F4.2 adalah targeted judge-critical P1 hardening dari EO/Admin-Judge simulations.
- Accepted semantic findings yang tersisa ditangani pada F4.3; selain itu feature freeze tetap berlaku.

## F4.3 — Final Semantic Truthfulness Hardening

PR: #92  
Merge commit: `b0b1122a25ee403ab8923c28838c291410ba5faf`

Findings addressed:

- TR-03: seeded/sample package rating muncul di early Traveler surfaces tanpa provenance yang cukup jelas.
- EO-F02: Demand Insight simulated dapat terbaca sebagai real demand dan unmet-demand copy dapat auto-leak ke Traveler-facing summary.
- EO-F03: package guidance belum cukup jelas membedakan `APPROVED` dari marketplace `LIVE`.
- MIT-01: session progress/capacity wording dapat membuat Kuota Sesi EO terbaca sebagai Kapasitas Umum Destinasi atau sellable inventory.
- MIT-02: Destination Profile sebelumnya mengunci re-verification policy yang sebenarnya belum final.

Perubahan canonical:

- Traveler package read model membawa explicit rating provenance: `SAMPLE`, `POST_TRIP`, atau no-rating state.
- Lima seeded package canonical memakai provenance `SAMPLE`; Explore dan Package Detail hero menampilkan label `(contoh)`.
- Dynamic LIVE EO package yang memiliki runtime post-trip rating memakai provenance `POST_TRIP` dan tidak dilabeli contoh.
- Package Detail review heading/rating copy mengikuti provenance dan tidak mengklaim objectivity.
- EO Overview Demand Opportunity menampilkan `respons simulasi` + visible disclosure bahwa data adalah prototype directional signal, bukan market validation.
- New Builder draft dari Insight tetap menyimpan Insight context tetapi tidak auto-prefill Traveler-facing `shortSummary` dari `unmetDemandDescription`.
- Existing authored/saved draft summary tetap dipertahankan.
- PENDING dan APPROVED package guidance menjelaskan lifecycle `APPROVED → EO Publish → LIVE`; Session tetap boleh disiapkan pada `APPROVED`.
- Mitra Overview session progress memakai `Peserta Terkonfirmasi / Kuota Sesi EO`; Kapasitas Umum Destinasi tetap venue context terpisah.
- Capacity screen mengganti `Sisa X Orang` menjadi neutral `Selisih operasional` dan menegaskan bahwa angka tersebut bukan kuota penjualan baru.
- Destination Profile mengganti policy absolut `memerlukan verifikasi ulang` dengan conditional `dapat memerlukan peninjauan ulang`; tidak ada workflow/policy baru yang dibuat.
- Guest Demo review flow tetap dipertahankan sebagai prototype capability untuk menunjukkan end-to-end review loop.

Quality gate setelah F4.3:

- 48 test suites,
- 679 tests PASS,
- format PASS,
- lint PASS,
- typecheck PASS,
- production build PASS,
- Cloudflare Pages preview PASS.

Business / authority impact:

- NONE.
- Package Price tetap Destination Base Cost + EO Margin.
- Traveler Service Fee tetap Rp7.500 per booking.
- Platform Commission tetap 10% GMV dan bukan Traveler checkout line item.
- Tidak ada perubahan payment/refund semantics, F4.1 transaction persistence, F4.2 Session temporal guard, review target separation, Admin approval authority, EO publish authority, atau Mitra read-only authority.
- Tidak ada production auth/KYC, re-verification workflow, inventory engine, notification system, backend, atau cross-tab persistence baru.

Final freeze decision:

- F4.3 menutup seluruh accepted findings dari Traveler, EO, Mitra, dan Admin/Judge adversarial simulations.
- App kembali ke HARD FEATURE FREEZE.
- Development tidak dibuka lagi untuk wishlist atau generic production features.
- Perubahan setelah ini hanya jika final rehearsal menemukan regression/P0 demo blocker atau factual contradiction yang nyata.
- Fokus berikutnya: end-to-end golden rehearsal, judge/demo checklist, dan final live sanity check.
