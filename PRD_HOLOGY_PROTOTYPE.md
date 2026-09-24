# JedaIn — PRD HOLOGY Competition Prototype

**Nama Produk:** JedaIn  
**Kompetisi:** HoloBiz — HOLOGY 9.0  
**Dokumen:** Product Requirements Document untuk prototype lomba  
**Versi:** 1.0 Candidate Canonical  
**Tanggal:** 24 September 2026  
**Status:** DRAFT UNTUK REVIEW TIM — belum menggantikan PRD.md lama sampai tim menyetujui dan merge  
**Branch Dokumen:** docs/hology-prototype-prd-v1

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

| Role | Primary Surface | Fungsi Utama |
|---|---|---|
| Traveler | /, /login, /home, /explore | discovery, recommendation, booking, trip |
| EO | /partner, /partner/eo atau eo.jedain.biz.id | insight, package, sessions, bookings |
| Mitra Destinasi | /partner/destination | destination operation, schedule, capacity |
| Admin | /admin | verification, approval, trust, audit |

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

Status: IMPLEMENTED LOCAL, PENDING RELEASE — Batch D2 commit 4208ddd.

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
- trust badge explanation tidak menjanjikan hal yang tidak dibuktikan.

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
- accessibility polish IMPLEMENTED LOCAL, PENDING RELEASE — Batch D1 commit 32d698f.

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

## REQ-TRV-13 — My Trips dan Review

Traveler dapat:
- melihat trip,
- membuka detail,
- pada demo mensimulasikan completion bila control tersedia,
- memberi Destination review,
- memberi EO/Guide review.

Acceptance:

- review hanya terkait booking/trip yang eligible menurut prototype,
- Destination dan EO review tetap terpisah,
- review dapat terlihat pada surface partner terkait.

Status: IMPLEMENTED.

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
- tidak menambahkan confidence/intent score tanpa data.

Status: IMPLEMENTED LIVE.

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

Acceptance:

- relevant destination facts tetap visible,
- pricing tidak menyembunyikan base-cost context,
- form tidak mengarang operational confirmation,
- submission tetap mengikuti lifecycle existing.

Status: IMPLEMENTED.

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

- past session tidak menjadi sellable Traveler session,
- session lifecycle existing dipertahankan,
- tidak menambah destination approval workflow baru hanya untuk prototype improvement.

Status: IMPLEMENTED.

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
- review target tetap sesuai EO/guide context.

Status: IMPLEMENTED.

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

Acceptance:

- tidak membuat general capacity tampak sebagai slot yang bisa dijual,
- spacing/copy harus terbaca jelas,
- terminology mengikuti semantic guard.

Status:
- core IMPLEMENTED LIVE,
- spacing polish D1 PENDING RELEASE.

## REQ-MIT-04 — Schedule dan Kuota Sesi EO

Schedule menampilkan session EO.

Acceptance:

- session quota dilabeli "Kuota Sesi EO",
- confirmed participants terpisah,
- derived difference jika ada menggunakan "Selisih Operasional",
- table mobile boleh horizontal scroll di container.

Status:
- semantic core IMPLEMENTED LIVE,
- header consistency D1 PENDING RELEASE.

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

Status: IMPLEMENTED.

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
- cost-scope fields optional dapat diteruskan,
- lifecycle tidak berubah karena discovery polish.

Status: IMPLEMENTED.

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

## REQ-XR-03 — Session Integrity

EO session yang valid dapat muncul ke Traveler.
Past/non-sellable session tidak boleh lolos checkout.

## REQ-XR-04 — Booking Integrity

Traveler, EO, Admin, dan Mitra harus membaca state transaksi/session yang konsisten dari prototype shared stores.

## REQ-XR-05 — Review Propagation

Destination review tampil pada Mitra surface terkait.
EO/Guide review tampil pada EO surface terkait.
Admin trust boleh membaca aggregate signal dari record yang sama.

## REQ-XR-06 — Privacy

Traveler internal/private data tidak boleh dipresentasikan ke partner bila tidak relevan.

Secara khusus:
- operationalNote internal session tidak ditampilkan pada Traveler,
- Mitra tidak membutuhkan biodata lengkap peserta,
- Demand Insight tidak menampilkan Traveler PII.

---

# 16. Pricing dan Payment Prototype

## 16.1 Package Price

Current formula yang dipertahankan:

Customer Package Price = Destination Base Cost + EO Margin

## 16.2 Traveler Checkout Fee

Current prototype checkout menambahkan fixed service fee Rp7.500 per transaksi.

Current payment breakdown:

Subtotal = Unit Package Price × Participant Count

Total = Subtotal + Rp7.500 Service Fee

## 16.3 Product Interpretation

Service fee Rp7.500 adalah **current prototype behavior**.

Ini belum otomatis mengunci model monetization komersial JedaIn.

PRD lama yang menyatakan platform commission dipotong dari EO margin dicatat sebagai historical conflict.

Keputusan komersial final:
OPEN / PRODUCT OWNER DECISION.

Developer tidak boleh mengubah fee atau formula hanya berdasarkan discovery atau refactor teknis.

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
- sessionStorage untuk temporary Traveler session.

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

## 17.3 Data Honesty

Fixture data adalah data prototype.

Jangan menyatakan:
- titik kumpul fixture sebagai informasi operasional nyata,
- illustration sebagai foto aktual,
- demand sample simulasi sebagai market validation,
- operational note sebagai approval.

---

# 18. Route / Screen Map

## Traveler

| Route | Purpose |
|---|---|
| / | Landing |
| /login | Traveler login / guest |
| /onboarding/consent | Consent |
| /onboarding/quiz | Preference quiz |
| /onboarding/result | Recommendation |
| /home | Personalized home |
| /explore | Catalog/explore |
| /packages/:packageId | Package detail |
| /packages/:packageId/sessions | Session selection |
| /checkout/:sessionId | Checkout |
| /checkout/:sessionId/contact | Contact verification |
| /checkout/:sessionId/pending-payment | Pending payment handling |
| /payment/:bookingId | Payment simulation |
| /payment/:bookingId/result | Result |
| /trips | My Trips |
| /trips/:bookingId | Trip detail |
| /trips/:bookingId/review | Review |
| /profile | Profile |
| /profile/preferences | Retake preference |

## Partner / EO

| Route | Purpose |
|---|---|
| /partner | Partner entry |
| /partner/apply/eo | EO application |
| /partner/eo | EO overview |
| /partner/eo/insights | Demand insight |
| /partner/eo/destinations | Destination catalog |
| /partner/eo/destinations/:destinationId | Destination detail |
| /partner/eo/packages | Package list |
| /partner/eo/packages/new | Package builder |
| /partner/eo/packages/:packageId | Package detail |
| /partner/eo/packages/:packageId/sessions | Package session management |
| /partner/eo/sessions | Session management |
| /partner/eo/bookings | Booking view |
| /partner/eo/reviews | EO reviews |
| /partner/eo/profile | EO profile |

EO subdomain may expose the same EO competition workspace.

## Destination Partner

| Route | Purpose |
|---|---|
| /partner/apply/destination | Destination application |
| /partner/destination | Overview |
| /partner/destination/profile | Destination profile |
| /partner/destination/verification | Verification badge/status |
| /partner/destination/schedule | EO schedule |
| /partner/destination/capacity | Capacity view |
| /partner/destination/reviews | Destination reviews |
| /partner/destination/profile-settings | Settings |

## Admin

| Route | Purpose |
|---|---|
| /admin/login | Admin entry |
| /admin | Overview |
| /admin/eo-approvals | EO review |
| /admin/destination-verifications | Destination review |
| /admin/package-approvals | Package review |
| /admin/bookings | Booking monitoring |
| /admin/complaints | Complaint handling |
| /admin/trust | Trust status |
| /admin/audit | Audit activity |

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
D1 polish PENDING RELEASE.

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

D3 tidak boleh dimulai sebelum D1/D2 memiliki checkpoint yang stabil jika tim mengikuti release plan saat ini.

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

Latest verified live baseline setelah release C3/payment integration:
- 37 suites / 592 tests.

Latest local development baseline setelah D1:
- 38 suites / 595 tests.

Latest local development baseline setelah D2:
- 39 suites / 607 tests.

Test count boleh bertambah.
Existing test count tidak boleh turun tanpa alasan yang dijelaskan.

---

# 26. Implementation Status Summary

## LIVE pada baseline c72681f

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
- media renderer/source priority,
- destination cost scope,
- session operational note,
- payment breakdown + fixed Rp7.500 service fee,
- production demo smoke test on Traveler/EO/Mitra/payment.

## LOCAL, PENDING PUSH/RELEASE

Batch D1 — commit 32d698f:
- capacity copy spacing,
- Mitra schedule header "Kuota Sesi EO",
- checkout quantity accessibility.

Batch D2 — commit 4208ddd:
- Traveler SessionState persistence using sessionStorage,
- corruption fallback,
- reset/logout storage clearing,
- quiz draft refresh persistence.

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

# 28. Known Open Decisions

## OPEN-01 — EO Applicant Default Guide Category

Historical PRD menyebut new EO default CONCEPT_ONLY.
Current implementation context pernah menunjukkan default/fallback yang berbeda.

Status:
TEAM DECISION REQUIRED jika perlu dikunci.

Jangan mengubah otomatis dari discovery.

## OPEN-02 — Commercial Monetization Model

Current prototype:
fixed traveler service fee Rp7.500 per transaction.

Historical PRD:
platform commission deductible dari EO margin.

Status:
OPEN untuk business plan/commercial model.
Prototype boleh mempertahankan behavior sekarang selama lomba.

## OPEN-03 — Real Destination Photography

Need:
foto aktual bernilai untuk trust.

Dependency:
asset dari tim/content owner.

Status:
CONTENT DECISION, bukan technical blocker.

---

# 29. Requirements Traceability — Discovery Improvement to Product Requirement

| Improvement | Canonical Requirement |
|---|---|
| Past session filtering | REQ-TRV-08 |
| EO application hygiene | REQ-EO-01 / REQ-EO-02 |
| Destination registration loop | REQ-MIT-01 |
| Session slot clarity | REQ-TRV-08 |
| Trust badge explanation | REQ-TRV-07 |
| Capacity context | Section 6 + REQ-EO-04 + REQ-MIT-03/04 |
| Guide context | Section 6 + REQ-EO-06 |
| EO operational summary | REQ-EO-08 |
| Mitra operational summary | REQ-MIT-05 |
| Demand insight context | REQ-EO-03 |
| Meeting point/access | REQ-TRV-07 |
| Destination cost scope | REQ-EO-05 + REQ-MIT-06 |
| Session operational note | REQ-EO-10 + REQ-MIT-05 |
| D1 accessibility/copy | REQ-TRV-09 + REQ-MIT-03/04 + Section 21 |
| D2 session persistence | REQ-TRV-03 |

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
13. Booking/trip terlihat pada Traveler.
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

# 33. Current Decision

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

