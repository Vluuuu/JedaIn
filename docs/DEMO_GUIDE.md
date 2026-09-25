# JedaIn — Panduan Demo & Evaluasi Juri (Competition Golden Demo Guide)

Panduan operasional dan evaluasi penjurian untuk menguji integrasi lintas 4 peran (**Traveler**, **Event Organizer / EO**, **Admin Tim Kurasi**, dan **Mitra Destinasi**) pada platform JedaIn.

Demo URL utama: `https://jedain.biz.id`

Partner portal: `https://jedain.biz.id/partner`

EO demo surface: `https://eo.jedain.biz.id/`

> Dokumen ini adalah panduan internal demo lomba. Gunakan URL live di atas untuk penjurian. Data, insight, payment, OTP, dan operational state tertentu adalah simulasi prototype yang dibuat deterministik agar alur dapat diuji berulang.

---

## 0. Recommended Judge Demo — 5–7 Menit

Bagian ini adalah urutan presentasi yang direkomendasikan ketika waktu juri terbatas. Ini **bukan business flow baru**; hanya shortcut demonstrasi dari requirement canonical.

### Sebelum mulai

1. Buka `/partner` atau `/admin/login`.
2. Klik **↺ Reset Demo State** satu kali.
3. Pastikan tidak ada session demo lama yang masih aktif.

### A. Traveler — personalisasi sampai keputusan booking

1. Buka `/` dan tunjukkan opening proposition:
   - **Temukan jeda yang benar-benar kamu butuhkan**
   - supporting copy tentang wellness experience terkurasi + destinasi lokal terverifikasi
   - CTA **Mulai Cari Jedamu**
2. Lanjut ke `/login` melalui CTA tersebut.
3. Klik **Lanjut sebagai Tamu**.
4. Tunjukkan Consent → Quiz → Recommendation.
5. Masuk ke satu Package Detail dan tunjukkan:
   - alasan pengalaman relevan,
   - trust/verification context,
   - meeting point/access jika tersedia,
   - upcoming session,
   - harga.
6. Buka Checkout dan tunjukkan bahwa:
   - quantity mengubah subtotal,
   - **Service Fee Rp7.500** tampil transparan,
   - total = subtotal + service fee.
7. Jelaskan singkat bahwa payment adalah simulasi prototype.

### B. EO — dari insight ke experience

1. Buka `/partner`.
2. Klik **Masuk sebagai EO Demo (Certified)**.
3. Tunjukkan **Demand Insights**.
4. Jelaskan bahwa insight adalah **data simulasi/directional untuk prototype**, bukan market validation atau jaminan penjualan.
5. Buka satu destinasi/package dan tunjukkan:
   - kapasitas umum destinasi,
   - cost scope,
   - guide context,
   - operational summary.

### C. Mitra Destinasi — kesiapan operasional

1. Kembali ke `/partner`.
2. Klik **Masuk sebagai Mitra Destinasi Demo**.
3. Tunjukkan `/partner/destination/schedule`.
4. Bedakan:
   - **Kapasitas umum destinasi per sesi**,
   - **Kuota Sesi EO**,
   - **Peserta Terkonfirmasi**,
   - **Selisih Operasional** bila tampil.
5. Tunjukkan operational note sebagai informasi read-only, bukan approval.

### D. Admin — trust layer

1. Buka `/admin/login`.
2. Klik **Masuk sebagai Admin Demo**.
3. Tunjukkan queue kurasi/verifikasi dan jelaskan bahwa Admin adalah trust/governance layer.
4. Jika waktu masih ada, lanjutkan ke full shared-state demo pada Bagian 3.

### Story yang harus tertangkap juri

`Traveler Need → Insight → EO Experience → Trust/Verification → Session/Booking → Operational Visibility → Review/Trust Signal`

---

## 1. Akses Demo & Titik Masuk Peran (Entry Points)

| Peran | Rute Akses | Keterangan |
|---|---|---|
| **Traveler (Wisatawan)** | `/` atau `/explore` atau `/login` | Pencarian paket, kuis preferensi, checkout, tiket trip, dan ulasan |
| **Mitra Partner (Portal)** | `/partner` | Landing portal mitra (EO & Destinasi) dengan tombol akses cepat demo |
| **Mitra EO (Workspace)** | `/partner/eo` | Wawasan demand insight, package builder, dan manajemen sesi |
| **Mitra Destinasi (Workspace)** | `/partner/destination` | Jadwal sesi venue, pengawasan kapasitas, dan ulasan kawasan |
| **Admin Tim Kurasi** | `/admin` atau `/admin/login` | Kurasi izin EO, verifikasi destinasi, kurasi paket, dan audit kepatuhan |

---

## 2. Identitas Cepat Demo (Quick Demo Access)

Tanpa perlu mengetik kredensial atau registrasi manual, sistem menyediakan tombol akses cepat di halaman login:

- **EO Demo (Certified Guide):** `Budi Santoso` (`Jeda Alam Nusantara` — ID: `eo_jeda_alam`)
- **EO Demo (Concept-Only):** `Dewi Lestari` (`Ruang Kreatif Wellness` — ID: `eo_kreatif_desa`)
- **Mitra Destinasi Demo:** `Hadi Purnomo` (`Lereng Hijau Batu` — ID: `dest_partner_lereng_hijau`)
- **Admin Demo:** `Trust Operations Lead` (`admin@jedain.id` — ID: `admin_trust_demo`)
- **Traveler Demo:** Klik **Lanjut sebagai Tamu** di `/login` untuk masuk cepat tanpa membuat akun production

---

## 3. Alur Utama Golden Demo (End-to-End Golden Flow)

### Langkah 1: Kebutuhan Traveler (Traveler Demand)
1. Buka rute `/login` → untuk demo cepat klik **Lanjut sebagai Tamu**.
2. Masuk ke `/onboarding/consent` → Berikan persetujuan mindful travel.
3. Selesaikan Kuis Preferensi di `/onboarding/quiz` (Pilih suasana alam, recharge, durasi 1 hari, Malang).
4. Lihat rekomendasi personal di `/onboarding/result` lalu masuk ke `/home`.

### Langkah 2: EO Merancang Paket dari Demand Insight (EO Package Builder)
1. Buka rute `/partner` → Klik **Masuk sebagai EO Demo (Certified)** (`eo_jeda_alam`).
2. Buka menu **Demand Insights** (`/partner/eo/insights`).
3. Pilih insight **Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya** (`ins_nature_batu_1d`) → Klik **Buat Paket dari Insight Ini**.
4. Di **Package Builder** (`/partner/eo/packages/new`):
   - **Tahap 1 (Destinasi):** Pilih destinasi terverifikasi aktif **Lereng Hijau Batu** (`dest_lereng_hijau`).
   - **Tahap 2 (Sinyal Insight):** Tinjau keselarasan intent dan target area Malang/Surabaya.
   - **Tahap 3 (Rencana Itinerary):** Periksa susunan aktivitas hening dan catatan keselamatan.
   - **Tahap 4 (Skema Harga):** Tentukan margin EO (misal Rp150.000, modal otomatis Rp125.000, total harga Rp275.000).
   - **Tahap 5 (Tinjau & Submit):** Klik **Ajukan untuk Review Kurator Admin** → Status paket menjadi `PENDING_ADMIN_REVIEW`.

### Langkah 3: Kurasi & Persetujuan Admin (Admin Approval)
1. Buka rute `/admin/login` → Klik **Masuk sebagai Admin Demo**.
2. Masuk ke menu **Kurasi Paket** (`/admin/package-approvals`).
3. Buka detail pengajuan paket yang baru dibuat.
4. Periksa checklist standar kurasi (formula harga, destinasi terverifikasi, alur mindful).
5. Isi catatan audit persetujuan (misal *"Itinerary mindful dan harga transparan lolos kurasi"*).
6. Klik **Setujui Paket (APPROVED)**.
7. *Catatan Validasi:* Paket berstatus `APPROVED` dan belum tampil di Marketplace Traveler sebelum EO mempublikasikannya.

### Langkah 4: Publikasi Paket & Pembukaan Sesi (EO Publish LIVE & Session Creation)
1. Kembali ke workspace EO (`/partner/eo/packages`).
2. Buka detail paket yang telah disetujui → Klik **Publish ke Marketplace** → Status berubah menjadi `LIVE`.
3. Klik **Atur Jadwal Sesi** (`/partner/eo/packages/:packageId/sessions`).
4. Buka sesi baru (misal tanggal Sabtu depan, kuota 6 orang, harga Rp275.000) → Sesi dibuka dengan status `OPEN`.

### Langkah 5: Penemuan & Pemesanan Traveler (Traveler Marketplace & Checkout)
1. Kembali ke sisi Traveler (`/explore`).
2. Paket baru dari EO kini tampil secara dinamis di katalog dan hasil pencarian.
3. Klik paket tersebut untuk membuka **Detail Paket** (`/packages/:packageId`).
4. Klik **Pilih Jadwal Sesi** (`/packages/:packageId/sessions`) → Pilih sesi yang baru dibuat EO.
5. Di halaman **Checkout** (`/checkout/:sessionId`):
   - Jika nomor HP belum diverifikasi, lakukan verifikasi OTP (Kode demo default: `111111`).
   - Tinjau jumlah peserta dan breakdown harga.
   - Traveler-facing total prototype: `subtotal + Service Fee Rp7.500 per booking`.
   - Platform commission 10% dari GMV adalah economics platform/EO pada proposal dan **bukan** line item tambahan pada checkout Traveler.
   - Klik **Lanjut ke Pembayaran**.
6. Di halaman **Pembayaran** (`/payment/:bookingId`):
   - Selesaikan pembayaran simulasi → Status menjadi `PAID` / Terkonfirmasi.

### Langkah 6: Bukti Shared State Lintas 4 Peran
1. **Traveler:** Buka `/trips` → Tiket pesanan aktif muncul di tab **Trip Mendatang**.
2. **EO:** Buka `/partner/eo/bookings` → Booking yang sama muncul di daftar pesanan masuk EO dengan status `Terkonfirmasi`.
3. **Admin:** Buka `/admin/bookings` → Booking dan transaksi pembayaran tercatat di shared transaction ledger Admin.
4. **Destinasi:** Buka `/partner/destination/schedule` dan `/partner/destination/capacity` (login sebagai Mitra Destinasi Lereng Hijau Batu) → Sesi EO muncul di jadwal venue dan jumlah peserta terkonfirmasi bertambah secara otomatis pada venue Lereng Hijau Batu tanpa ekspos data pribadi (PII) traveler.

### Langkah 7: Penyelesaian Trip & Ulasan Dua Sisi (Trip Completed & Reviews)
1. Di Traveler `/trips/:bookingId`, klik tombol **Prototype Demo: Simulasikan Trip Selesai**.
2. Status perjalanan berubah dari `PAID` menjadi `COMPLETED`.
3. Muncul panel **Penilaian Pengalaman**:
   - Klik **Beri Nilai Destinasi** → Berikan rating bintang 5 dan ulasan tentang keasrian Lereng Hijau Batu.
   - Klik **Beri Nilai EO / Guide** → Berikan rating bintang 5 dan ulasan tentang keramahan pemandu Jeda Alam Nusantara.
4. **Verifikasi Propagasi Ulasan:**
   - Buka `/partner/destination/reviews` → Ulasan destinasi masuk ke mitra destinasi Lereng Hijau Batu.
   - Buka `/partner/eo/reviews` → Ulasan kepemanduan masuk ke profil EO Jeda Alam Nusantara.
   - Buka `/admin/trust` → Skor rating dan jumlah ulasan mitra terakumulasi secara objektif.

---

## 4. Prosedur Reset State Demo (Deterministic Demo Reset)

Untuk mengulang seluruh simulasi dari awal tanpa meninggalkan sampah data:
1. Buka halaman `/partner` atau `/admin/login`.
2. Klik tombol **↺ Reset Demo State**.
3. Seluruh store (transaksi, paket dinamis, sesi, ulasan, audit, dan sesi login) akan kembali ke kondisi baseline bersih deterministik, dan seluruh peran kembali ke status logged out.

---

## 5. Batasan Prototipe yang Diketahui (Known Prototype Limitations)

- **Pembayaran:** Berjalan menggunakan simulasi local/shared prototype store; bukan transaksi payment gateway nyata.
- **OTP:** Kode demo `111111` adalah shortcut prototype; tidak ada SMS production.
- **Demand Insight:** Data bersifat simulated/directional untuk mendemokan workflow EO; bukan human/market validation dan bukan proyeksi penjualan.
- **Penyelesaian Trip:** Disediakan tombol simulasi eksplisit (*"Prototype Demo: Simulasikan Trip Selesai"*) karena automasi batch job kronologis di luar cakupan prototype.
- **Media:** Renderer mendukung foto, tetapi beberapa surface masih memakai fallback illustration bila asset fotografi aktual belum tersedia.
- **Session Traveler:** State onboarding/quiz disimpan sementara via `sessionStorage` agar refresh tidak memaksa pengulangan demo; ini bukan production auth.
- **Performance:** Optimasi bundle lanjutan bersifat optional selama app tetap responsif pada perangkat demo.

---

## 6. Demo Truth Guard

Saat presentasi, gunakan framing berikut:

- sebut **prototype**, **simulasi**, atau **demo** pada payment/OTP/state yang memang mock,
- sebut Demand Insight sebagai **sinyal/insight directional**, bukan "permintaan nyata terukur" bila sumbernya fixture prototype,
- jangan menyebut fallback illustration sebagai foto aktual destinasi,
- jangan menyebut operational note sebagai approval/readiness confirmation,
- jangan menyebut general destination capacity sebagai slot yang masih tersedia,
- jangan menjelaskan commission 10% sebagai biaya tambahan Traveler,
- service fee Rp7.500 boleh dijelaskan sebagai current traveler-facing prototype behavior.

## 7. Refresh / Recovery Check Sebelum Presentasi

Sebelum masuk ruang demo:

1. Selesaikan sekali Traveler onboarding.
2. Refresh `/home` dan satu protected package route.
3. Pastikan session Traveler tetap bertahan.
4. Logout lalu refresh dan pastikan session lama tidak muncul kembali.
5. Jalankan **Reset Demo State** sebelum rehearsal terakhir.

Verified implementation baseline untuk behavior ini:
`4208ddd` — D1 + D2 live verified, 39 suites / 607 tests.
