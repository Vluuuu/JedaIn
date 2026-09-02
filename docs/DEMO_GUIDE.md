# JedaIn — Panduan Demo & Evaluasi Juri (Competition Golden Demo Guide)

Panduan operasional dan evaluasi penjurian untuk menguji integrasi lintas 4 peran (**Traveler**, **Event Organizer / EO**, **Admin Tim Kurasi**, dan **Mitra Destinasi**) pada platform JedaIn.

Staging URL: `https://staging.jedain.biz.id` (atau `<STAGING_URL>`)

---

## 1. Akses Staging & Titik Masuk Peran (Entry Points)

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
- **Traveler Demo:** Registrasi instan via Form / Tombol Demo di `/login`

---

## 3. Alur Utama Golden Demo (End-to-End Golden Flow)

### Langkah 1: Kebutuhan Traveler (Traveler Demand)
1. Buka rute `/login`, masuk atau buat akun baru (misal nama `Ahmad Traveler`).
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
   - Jika nomor HP belum diverifikasi, lakukan verifikasi OTP (Kode demo default: `123456`).
   - Tinjau jumlah peserta, formula harga, dan setujui kebijakan pembatalan.
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

- **Pembayaran:** Berjalan menggunakan simulasi atomic store lokal (tanpa gateway kartu kredit/payment aggregator eksternal).
- **Penyelesaian Trip:** Disediakan tombol simulasi eksplisit (*"Prototype Demo: Simulasikan Trip Selesai"*) karena automasi batch job kronologis di luar cakupan frontend prototype.
- **Vite Bundle Size:** Terdapat notice build Vite >500 kB (wajar untuk single-bundle prototype bundling).
