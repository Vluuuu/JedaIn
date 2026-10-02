# JedaIn — Strategi GTM dan Scale-Up

*Dokumentasi pribadi. Versi 30 September 2026 (diperbarui: target utilisasi, kebutuhan EO, dan aturan kompensasi dari dokumen Proyeksi Keuangan). Melengkapi dokumen "JedaIn — Model Bisnis Baru".*

---

## 1. Prinsip Dasar

1. **Rencana ini untuk dijalankan, bukan hanya untuk kompetisi.** GTM dirancang untuk memitigasi risiko implementasi yang sudah teridentifikasi.
2. **Urutan penjualan ke tiga pihak:** Destinasi → Wisatawan → EO. Tanpa program tidak ada yang dijual, dan EO baru mau bergabung setelah ada bukti trip berjalan.
3. **Trip hanya dimulai setelah program benar-benar ada.** Kesan pertama wisatawan harus berupa produk yang berbeda, bukan trip berendam biasa.
4. **Transisi antar-fase dipicu pencapaian, bukan tanggal.**
5. **Teknologi mengikuti traksi.** Manual dan no-code dulu, platform dibangun saat pekerjaan manual menjadi hambatan nyata.
6. **Data dicatat rapi sejak trip pertama.**

---

## 2. Asumsi Kapasitas Tim

| Asumsi | Nilai |
|---|---|
| Tim inti | 3 orang × 10 jam/minggu = **30 jam/minggu** (hari kerja) |
| Kehadiran akhir pekan | 3 orang, **di luar** 10 jam/minggu |
| Pendamping per trip | Minimal 2 orang |
| Tim total | 3–6 orang, ditambah 1 developer mulai akhir fase 2 |

**Estimasi beban kerja:**

| Pekerjaan | Estimasi |
|---|---|
| Konten dan pemasaran rutin | ±5 jam/minggu |
| Administrasi, keuangan, legal | ±3 jam/minggu |
| Relasi destinasi | ±2 jam/minggu per destinasi |
| Persiapan dan penutupan satu trip | ±8 jam/trip |
| Pengembangan satu destinasi | ±80 jam, tersebar 2–3 bulan |
| Rekrutmen satu EO | ±6 jam |

**Kesimpulan kapasitas:**
- Trip internal: aman **1 trip per akhir pekan** (±4 trip/bulan, maksimal ±48 peserta/bulan).
- Pengembangan destinasi: realistis **±2 destinasi di tahun pertama**.
- Satu destinasi butuh ±1,7 trip/bulan untuk balik modal. Tim internal sanggup menopang 1 destinasi. Destinasi kedua (±3,4 trip/bulan) mendekati batas kapasitas, sehingga **EO mitra harus masuk sebelum destinasi kedua berjalan penuh.**

---

## 3. Keputusan Strategis GTM

| Kode | Keputusan |
|---|---|
| **Trip dengan program** | Trip dimulai hanya setelah program ada (menggantikan usulan awal "uji coba dengan trip tanpa program") |
| **Pilot program terlindungi** | Sebelum program dirancang, destinasi menandatangani perjanjian pilot: program milik JedaIn sejak awal, destinasi tidak boleh menjalankan program di luar JedaIn selama pilot dan beberapa bulan sesudahnya jika tidak lanjut, JedaIn mendapat hak pertama atas kontrak eksklusif. Kontrak eksklusif penuh ditandatangani setelah pilot memenuhi target. |
| **Program versi ringan** | Program pilot ±Rp4 juta. Penyempurnaan setelah kontrak ±Rp6 juta. **Total tetap Rp10 juta per destinasi**, hanya waktu pengeluarannya yang dipecah. |
| **Pre-sale** | Permintaan divalidasi lewat daftar tunggu dan pre-sale dengan DP selama program dikembangkan |
| **Pasar awal: Malang Raya** | Fokus pada paket Malang kumpul di lokasi (Rp249.000) dan shuttle Malang. Paket Surabaya diuji lewat 1–2 trip pre-sale, penjualan rutinnya diserahkan ke EO mitra berbasis Surabaya. |
| **EO sebagai syarat ekspansi** | Onboarding EO mitra wajib sebelum destinasi kedua dijalankan penuh. Setelah EO masuk, tim internal fokus ke pengembangan destinasi. |
| **Trip awal oleh tim internal** | Tim internal menjalankan trip di awal sambil bernegosiasi dengan EO calon mitra |
| **Destinasi pilot** | Swasta atau BUMDes, bukan milik pemerintah |

Catatan: klausul penyeimbang nomor 4 di perjanjian destinasi kini berbunyi **"pilot program terlindungi sebelum eksklusif"**.

Catatan jujur soal perlindungan program: ide dan cara menjalankan program sulit dilindungi secara hukum. Yang kuat dilindungi adalah **nama program** (pendaftaran merek) dan **SOP** (klausul kerahasiaan). Perjanjian pilot lebih berfungsi sebagai komitmen tertulis dan penjaga relasi.

---

## 4. Strategi Teknologi Bertahap

**Pendekatan:** concierge MVP (layanan dijalankan manual di belakang layar, rapi dari sisi pelanggan), lalu platform dibangun ketika pemicu tercapai.

| Fungsi | Tahap pilot | Tahap operasi awal | Tahap platform |
|---|---|---|---|
| Katalog paket dan program | Landing page sederhana | Katalog dengan jadwal | Katalog penuh dengan filter |
| Booking | Formulir online | Booking online, kuota real-time | Otomatis |
| Pembayaran | Tautan pembayaran/QRIS, pencairan manual setelah trip | Payment gateway dengan pembagian dan penahanan dana | Otomatis |
| Skrining kesehatan | Formulir dengan persetujuan eksplisit | Terintegrasi di booking | Terintegrasi |
| Komunikasi | Grup WhatsApp per trip | WhatsApp + konfirmasi otomatis | Notifikasi otomatis |
| Kuota | Spreadsheet/kalender bersama | Sistem kuota per EO | Otomatis |
| Pengajuan paket EO | Belum perlu | Formulir + approval manual | Builder Konsep |
| Rating | Formulir | Formulir otomatis setelah trip | Terintegrasi (venue, EO, program) |
| Verifikasi | Checklist dokumen | Checklist + arsip | Sistem verifikasi |
| Data dan metrik | **Spreadsheet dengan metrik tetap sejak hari pertama** | Dasbor sederhana | Data & Insight Engine |

**Perhatian:**
- **Data skrining kesehatan** termasuk kategori khusus di UU PDP: persetujuan eksplisit, data seminimal mungkin, akses terbatas, jangan disimpan di spreadsheet yang dibagikan luas.
- **Payment gateway** dengan fitur pembagian dan penahanan dana umumnya butuh badan usaha. Di tahap pilot, penahanan dana dijalankan manual.

**Pemicu pembangunan platform MVP** (salah satu terpenuhi): 3 EO aktif, atau ±8 trip/bulan, atau 2 destinasi aktif.

**Cakupan platform MVP:** katalog dengan jadwal, booking dengan kuota real-time, payment gateway dengan pembagian dan penahanan dana, formulir pengajuan paket EO, rating tiga dimensi (venue, EO, program).

**Developer:** 1 anggota tambahan khusus pengembangan platform, **bergabung di akhir fase 2** supaya memahami alur manual sebelum mengotomatisasinya.

**Untuk pitching:** tahap pilot dibingkai sebagai "MVP manual untuk validasi" sebelum "MVP platform" di proposal.

---

## 5. Linimasa Fase

| Fase | Perkiraan bulan | Inti | Pemicu naik fase |
|---|---|---|---|
| 0. Persiapan | Bulan 1 | Fondasi legal, mitra ahli, perangkat | Mitra ahli bersedia, ≥5 kandidat destinasi, template perjanjian pilot siap, badan usaha diproses |
| 1. Destinasi pertama dan program pilot | Bulan 2–4 | Perjanjian pilot, program ringan, pre-sale. **Belum ada trip berbayar.** | Program lulus uji internal, pre-sale ≥75% |
| 2. Trip perdana hingga rutin | Bulan 5–7 | Trip pilot, kontrak eksklusif, trip rutin | Kontrak eksklusif berjalan, target kuartal 1 tercapai, SOP trip tertulis, ≥1 EO siap |
| 3. Operasi awal dengan EO | Bulan 8–13 | EO mitra masuk, destinasi 2 dimulai, platform MVP | ≥2 EO menjalankan sebagian besar trip, destinasi 1 sesuai target, SOP pengembangan destinasi terdokumentasi, platform MVP berjalan |
| 4. Mesin pengembangan destinasi | Mulai bulan ±13 | Playbook destinasi, perluasan ke dekat Surabaya, saluran korporat | Pemicu hibrida (bagian 7) |

Trip berbayar pertama baru berjalan sekitar **bulan 4–5**. Proyeksi Tahun 1 harus memperhitungkan jeda ini.

---

## 6. Rincian per Fase

### Fase 0: Persiapan (±1 bulan)

**Tujuan:** fondasi agar fase 1 tidak tersendat legal, kredibilitas, atau perangkat.

| Area | Aktivitas |
|---|---|
| Legal | Pilih bentuk usaha (CV, PT biasa, atau PT Perorangan atas nama satu orang). NIB lewat OSS, cek KBLI termasuk penjualan paket perjalanan (izin sendiri atau bermitra dengan biro perjalanan berizin). Rekening usaha, cek syarat akun payment gateway. |
| Mitra ahli | Dosen atau praktisi fisioterapi, kesehatan olahraga, atau wellness. Opsi hemat biaya: skema pengabdian masyarakat dosen. |
| Kandidat destinasi | 5–8 kandidat swasta/BUMDes di Malang Raya. Kriteria: sumber daya wellness, status pengelola jelas, akses ≤±1,5 jam dari Malang, fasilitas dasar (toilet, ruang ganti), kapasitas ≥12 orang. |
| Asuransi | Produk asuransi kecelakaan per peserta per trip |
| Perangkat | Landing page dan formulir daftar tunggu, spreadsheet metrik, template perjanjian pilot (ditinjau pihak yang paham hukum, misalnya lembaga bantuan hukum kampus) |
| Konten | Buka akun media sosial, konten di balik layar proses mencari destinasi |

**Risiko yang dimitigasi:** P1–P4, X5.

---

### Fase 1: Destinasi Pertama dan Program Pilot (±2–3 bulan)

**Tujuan:** satu destinasi setuju bermitra, program versi ringan siap dan aman, permintaan terbukti lewat pre-sale.

| Sisi | Aktivitas |
|---|---|
| Destinasi | Kunjungi 5–8 kandidat → saring 2–3 serius → tanda tangan perjanjian pilot dengan 1 destinasi, jaga 1 kandidat cadangan. Bahan pendekatan: satu halaman ringkas berisi contoh program, pendapatan Rp600.000/trip, dukungan mitra ahli. Program versi ringan dirancang bersama ahli (alur sesi, skrining, SOP keselamatan). Latih 2 fasilitator destinasi. |
| Uji internal | Satu kali uji coba program dengan tim dan beberapa sukarelawan, tanpa dijual, untuk menguji keamanan dan alur |
| Wisatawan | Konten proses pengembangan program dan edukasi wellness → daftar tunggu. Saluran: jaringan pribadi, komunitas kampus, komunitas olahraga/yoga, coworking Malang. Setelah lulus uji internal, buka pre-sale 2 trip perdana dengan DP. |
| EO | Petakan 5–10 EO calon mitra (utamakan berbasis Surabaya). Ajak 2–3 EO ikut trip perdana sebagai pengamat. |

**Target:**

| Metrik | Target |
|---|---|
| Perjanjian pilot | 1 ditandatangani + 1 kandidat cadangan |
| Program versi ringan | Selesai, lulus uji internal tanpa insiden |
| Daftar tunggu | ±100 orang |
| Pre-sale 2 trip perdana | ≥75% slot terisi dengan DP (±18 dari 24) |
| EO | 5–10 dipetakan, 2–3 diundang mengamati |

**Titik keputusan:** jika pre-sale tidak mencapai target, perbaiki harga atau program sebelum trip dijalankan.

**Beban tim:** ±25–30 jam/minggu.
**Biaya utama:** program ringan ±Rp4 juta, legal sesuai bentuk usaha, perangkat hampir nol.
**Risiko yang dimitigasi:** D1, D2, D3, O2, T3, P4.

---

### Fase 2: Trip Perdana hingga Rutin (±3 bulan)

**Tujuan:** membuktikan program disukai dan aman, orang membayar berulang, dan destinasi bersedia terikat kontrak eksklusif.

**Langkah:**
1. **Trip pilot:** 2 trip perdana hasil pre-sale.
2. **Kontrak eksklusif 18 bulan** jika kriteria pilot tercapai. Program disempurnakan (±Rp6 juta: SOP lengkap, pelatihan lanjutan, pendaftaran merek).
3. **Trip rutin bertahap:** bulan 1: 2 trip → bulan 2: 3 trip → bulan 3: 4 trip (1/minggu).

**Kriteria keberhasilan pilot** (dicantumkan di perjanjian pilot):

| Kriteria | Target |
|---|---|
| Trip terlaksana | 2 |
| Keterisian | ≥75% |
| Rating program | ≥4,3/5 |
| Insiden keselamatan serius | Nol |
| Kepuasan destinasi | Pengelola bersedia lanjut |

Rating program dinilai **terpisah** dari rating venue dan EO.

**Target kinerja kontrak eksklusif (nilai X, bertahap):**

| Kuartal kontrak | Minimal peserta |
|---|---|
| Kuartal 1 | 30 |
| Kuartal 2 | 45 |
| Kuartal 3 dst. | 60 |

**Aktivitas per sisi:**

| Sisi | Aktivitas |
|---|---|
| Wisatawan | Fokus paket Malang kumpul di lokasi + shuttle Malang. 1–2 trip pre-sale paket Surabaya untuk validasi harga. Saluran: rujukan (voucher ±Rp10.000), konten peserta, komunitas, coworking. Uji **booking rombongan utuh** (satu komunitas/kantor mengisi 12 slot). |
| Program saja | Soft launch di bulan ketiga, jadwal sesi tetap atau mengisi slot kosong sesi rombongan |
| EO | Negosiasi dengan 2–3 EO pengamat. Tawaran: akses program eksklusif, pendampingan di trip pertama, komisi 10%. Target 1–2 surat minat. |
| Destinasi | Evaluasi bulanan + laporan kunjungan. Jaga relasi dengan kandidat cadangan, destinasi kedua belum dikembangkan sebelum ada EO mitra. |

**Operasional yang wajib tertulis:**
- SOP trip (H-7, H-1, hari H, H+1)
- Protokol insiden
- Aturan kuota minimum (contoh: <8 peserta pada H-3 → digabung atau dijadwal ulang dengan opsi refund)
- Kebijakan cuaca dan pembatalan, termasuk jika destinasi ditutup
- Penahanan dana manual

**Target:**

| Metrik | Target |
|---|---|
| Kontrak eksklusif | Ditandatangani setelah pilot |
| Trip | ±11 (2 pilot + 9 rutin), ±100–130 peserta |
| Keterisian | ≥75% |
| Rating program | ≥4,5 |
| Peserta dari rujukan | ≥20% peserta baru |
| Trip Surabaya | 1–2 dengan keterisian ≥75% |
| EO | 1–2 surat minat |
| Target kinerja kuartal 1 | ≥30 peserta |

**Titik keputusan:**
- Rating program rendah → perbaiki program sebelum kontrak eksklusif.
- Trip Surabaya tidak terisi → tunda paket Surabaya atau sesuaikan harga, penjualan sepenuhnya lewat EO Surabaya.
- Booking rombongan utuh berhasil → prioritaskan saluran B2B dan komunitas di fase 3.

**Beban tim:** akhir pekan 1 trip/minggu (2 dari 3 orang). Hari kerja ±27 jam/minggu. Kapasitas hampir penuh.
**Developer bergabung di akhir fase ini.**
**Catatan keuangan:** pendapatan pertama muncul. Karena trip dijalankan tim internal, margin EO (20%) juga menjadi milik JedaIn. Cara pencatatannya diputuskan di proyeksi keuangan.

---

### Fase 3: Operasi Awal dengan EO Mitra (±3–6 bulan)

**Tujuan:** eksekusi trip pindah ke EO mitra, tim fokus ke destinasi kedua, dan terbukti model tetap berjalan ketika trip tidak dijalankan tim sendiri.

| Sisi | Aktivitas |
|---|---|
| EO | Onboarding 2–3 EO: verifikasi (legalitas, asuransi liability), pelatihan SOP, protokol serah terima dengan fasilitator destinasi. Trip pertama tiap EO didampingi tim. EO Surabaya menjual paket Surabaya. |
| Tim internal | Trip internal turun dari 4 menjadi 1–2 per bulan. Waktu dialihkan ke destinasi kedua dan dukungan EO. |
| Wisatawan | Audiens milik EO, booking rombongan kantor/komunitas, kemitraan coworking, micro-influencer skema barter, rujukan. Program saja rutin. |
| Destinasi 1 | Kejar target kuartal 2 (45) dan kuartal 3 (60). Laporan bulanan. |
| Destinasi 2 | Siklus fase 1 dimulai **setelah minimal 1 EO menjalankan trip.** |

**Aturan operasional:**

*Pembagian kuota antar-EO:*
- Slot akhir pekan dibuka per bulan dengan batas maksimal slot per EO.
- **Tim internal mengalah ke EO** jika bentrok slot.

*Modal kerja EO — pencairan sebagian sebelum trip:*
- Hanya untuk EO yang sudah menyelesaikan minimal 2 trip dengan baik.
- Sebatas DP vendor (transport, katering) dengan bukti invoice.
- Maksimal 30% dari nilai trip.
- EO wajib mengembalikan dana jika trip batal karena kelalaian EO.

*Pemantauan kebocoran:* catat pelanggan berulang tiap EO, pastikan program tidak dijalankan di luar JedaIn.

**Target:**

| Metrik | Target akhir fase |
|---|---|
| EO aktif | 2–3 |
| Porsi trip oleh EO | ≥50% |
| Total trip | 6–8/bulan (internal 1–2, EO 4–6) |
| Destinasi 1 | Kuartal 2 ≥45, kuartal 3 ≥60 peserta |
| Destinasi 2 | Perjanjian pilot + program ringan siap |
| Retensi EO | Semua EO masih aktif setelah 3 bulan |
| Kebocoran | Tidak ada indikasi program di luar JedaIn |
| Platform MVP | Dibangun jika pemicu tercapai |

**Titik keputusan:**
- EO sulit menjual → tim internal menopang, destinasi kedua diperlambat.
- EO mengeluh margin → cek ulang asumsi margin 20% terhadap biaya riil EO.
- Destinasi 1 gagal target kuartal 2 → evaluasi: masalah permintaan (perbaiki pemasaran) atau program (perbaiki program).

**Beban tim inti:** ±33 jam/minggu, sedikit di atas kapasitas. Pembangunan platform ditangani developer. Fase ini adalah titik di mana anggota tambahan benar-benar dibutuhkan.

**Konsekuensi biaya developer:** jika kompensasi setara subsisten tim inti, ±Rp15 juta/tahun. Bentuk kompensasi diputuskan di proyeksi keuangan.

---

### Fase 4: Mesin Pengembangan Destinasi (mulai ±bulan 13)

**Tujuan:** pengembangan destinasi menjadi proses yang bisa diulang, sehingga pertumbuhan tidak bergantung penuh pada tim inti.

| Sisi | Aktivitas |
|---|---|
| Destinasi | Playbook pengembangan destinasi dari pengalaman destinasi 1 dan 2. Pipeline sebagai corong: kandidat → pilot → kontrak. Target **2–4 destinasi baru per tahun.** Program kedua di destinasi 1 (variasi musiman atau korporat). |
| Perluasan wilayah | Prioritas: **destinasi dekat Surabaya** (misalnya kawasan air panas Pacet, Mojokerto) untuk menurunkan biaya transport paket Surabaya secara struktural. Status pengelola tetap harus dicek. |
| EO | Jaringan 5–8 EO, dengan EO di setiap wilayah destinasi |
| Wisatawan | **Saluran korporat** (program wellness karyawan lewat HR). Trip korporat bisa di **hari kerja**, memakai kapasitas destinasi di luar akhir pekan. Target utilisasi **8 trip per destinasi per bulan** mulai Tahun 2 (tuas L2). Saluran korporat harus mulai digarap sebelum Tahun 2. |
| Tim | Kompensasi tim tetap subsisten sampai payback (±bulan 39), baru naik setelahnya (tuas L1). Koordinator regional ditunda sampai keuangan memungkinkan. |
| Pendanaan | Hibah, inkubator, kerja sama pemda berbekal data traksi. Program desa wisata provinsi (Dewi Cemara) sebagai pintu masuk ke destinasi BUMDes. |

**Siklus lulus:** kontrak destinasi 1 ditandatangani ±bulan 6–7, sehingga destinasi 1 baru lulus sekitar **Tahun 4**. Selama Tahun 2–3 semua destinasi berprogram berada di lapis eksklusif.

**Risiko khas fase 4:**

| Risiko | Mitigasi |
|---|---|
| Ekspansi terlalu cepat, mutu turun | Destinasi baru hanya dibuka jika destinasi lama memenuhi target kinerja |
| Tim inti kelelahan | Kompensasi naik setelah payback, aturan disepakati seluruh tim sejak awal |
| Kebutuhan modal naik | Pengembangan destinasi dibiayai arus kas destinasi berjalan dan hibah |
| Pesaing merebut destinasi | Pipeline kandidat lebih panjang dari kapasitas, relasi dengan program pemerintah sejak awal |

---

### Target operasional dari proyeksi keuangan

| Tahun | Destinasi aktif (rata-rata) | Trip/bulan | Kebutuhan |
|---|---|---|---|
| Tahun 1 | 1 | naik ke ±7 | Trip mulai bulan 5, EO mulai bulan 8 |
| Tahun 2 | 2 | ±16 | Trip internal ±4,8/bulan, di atas kapasitas aman 4 → porsi EO ±75% atau anggota tambahan ikut bertugas di akhir pekan |
| Tahun 3 | 4 | ±32 | ±27 trip EO/bulan → **minimal 8 EO aktif** |
| Tahun 4 | 6 | ±48 | ±41 trip EO/bulan, jaringan EO tumbuh sejalan |

Jadwal destinasi baru (mulai pilot): D2 bulan 10, D3 bulan 16, D4 bulan 20, D5 bulan 28, D6 bulan 32, D7 bulan 40, D8 bulan 44.

---

## 7. Strategi Scale-Up Menuju Marketplace

**Visi jangka panjang:** marketplace tiga sisi terkurasi dengan dua lapis (terbuka dan eksklusif). Lihat dokumen model bisnis untuk definisinya.

**Penyesuaian penting:** lapis terbuka **tidak perlu menunggu destinasi lulus.** Venue terverifikasi tanpa program (trip tanpa program tetap boleh) bisa menjadi isi awal lapis terbuka jauh sebelum Tahun 4.

| Transisi | Pemicu (semua harus terpenuhi) | Perkiraan waktu |
|---|---|---|
| **Pengembang destinasi → Hibrida** | ≥4 destinasi berprogram aktif, ≥8 EO aktif, ≥30% booking langsung ke JedaIn (bukan dari audiens EO), verifikasi bisa dijalankan koordinator (bukan tim inti) | Tahun 3–4 |
| **Hibrida → Marketplace terkurasi** | ≥10 destinasi (terbuka + eksklusif), ≥50% booking langsung ke JedaIn, destinasi mulai mengajukan diri tanpa didekati, verifikasi mandiri berjalan di platform | Tahun 5+ |

**Pemicu terpenting: porsi booking langsung ke JedaIn.** Ini ukuran penguasaan permintaan, syarat agar marketplace tidak mengulang kelemahan model proposal (kebocoran).

---

## 8. Daftar Risiko Implementasi

| Kode | Risiko | Tahap | Mitigasi di GTM |
|---|---|---|---|
| P1 | Payment gateway lengkap butuh badan usaha | 0 | Penahanan dana manual di pilot |
| P2 | PT Perorangan hanya untuk 1 pemilik | 0 | Pilih bentuk usaha di fase 0 |
| P3 | Belum ada mitra ahli | 0 | Mitra ahli sebagai pemicu fase 0 |
| P4 | Dana awal belum pasti | 0 | Program versi ringan, investasi dipecah |
| D1 | Birokrasi destinasi pemerintah | 1 | Destinasi pilot swasta/BUMDes |
| D2 | Kredibilitas tim mahasiswa | 1 | Mitra ahli, dukungan kampus |
| D3 | Bergantung pada satu destinasi | 1 | Kandidat cadangan |
| D4 | Program bocor sebelum dikunci | 1 | Perjanjian pilot terlindungi |
| T1 | Jaringan tim dominan Malang, daya beli rendah | 2 | Fokus paket Malang kumpul di lokasi, Surabaya lewat EO |
| T2 | Kuota minimum tidak terpenuhi | 2 | Aturan kuota minimum, booking rombongan utuh |
| T3 | Minat tidak menjadi pembayaran | 1–2 | Pre-sale dengan DP |
| O1 | Siapa menjalankan trip awal | 2 | Tim internal dulu, EO mitra di fase 3 |
| O2 | Insiden pertama | 1–2 | Uji internal, skrining, protokol insiden, asuransi |
| O3 | Arus kas harian (DP vendor sebelum dana cair) | 2–3 | Pencairan sebagian bersyarat |
| X1 | Waktu dan komitmen tim | Semua | Kapasitas dihitung eksplisit, EO dan developer menambah kapasitas |
| X2 | Kompensasi subsisten bertahun-tahun | Semua | Kompensasi naik setelah payback (±bulan 39), aturan disepakati sejak awal |
| X3 | Membangun platform terlalu dini | Semua | Teknologi bertahap dengan pemicu |
| X4 | Musim hujan dan kalender akademik | Semua | Perlu dimasukkan ke proyeksi volume |
| X5 | Tidak ada pencatatan data | Semua | Metrik tetap sejak trip pertama |

---

## 9. Log Keputusan GTM

| No | Keputusan |
|---|---|
| 1 | Trip awal dijalankan tim internal sambil bernegosiasi dengan EO calon mitra |
| 2 | Destinasi pilot: swasta atau BUMDes |
| 3 | Teknologi bertahap: manual/no-code di pilot, platform saat pemicu tercapai |
| 4 | Kapasitas: 3 orang inti × 10 jam/minggu, 3 orang di akhir pekan (di luar 10 jam) |
| 5 | Trip hanya dimulai setelah program ada |
| 6 | Pilot program terlindungi, program versi ringan (Rp4 juta + Rp6 juta), pre-sale |
| 7 | Pasar awal Malang Raya, paket Surabaya lewat EO Surabaya |
| 8 | EO mitra wajib sebelum destinasi kedua berjalan penuh |
| 9 | Kriteria keberhasilan pilot dan target kinerja bertahap (30, 45, 60 peserta/kuartal) |
| 10 | Pencairan sebagian sebelum trip, dengan syarat (≥2 trip, invoice, maks 30%, wajib kembali jika batal karena kelalaian EO) |
| 11 | Tambah 1 developer, bergabung akhir fase 2 |
| 12 | Fase 4 dan pemicu scale-up menuju marketplace |
| 13 | Dari proyeksi keuangan: target 8 trip/destinasi/bulan mulai Tahun 2, kompensasi subsisten sampai payback, koordinator regional ditunda |

---

## 10. Yang Masih Terbuka

1. ~~BEP dan proyeksi keuangan~~ → selesai (dokumen Proyeksi Keuangan)
2. Bentuk badan usaha
3. Kerentanan model bisnis yang belum ditangani penuh: kredibilitas dan tanggung jawab program kesehatan (sebagian sudah dimitigasi lewat mitra ahli, skrining, uji internal, asuransi)
4. Pembersihan inkonsistensi proposal lama untuk bahan pitching
