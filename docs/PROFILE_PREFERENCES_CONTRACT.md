# JedaIn — Traveler Profile & Preference Retake Contract

**Version:** 1.0  
**Date:** 4 September 2026  
**Status:** Feature Contract  
**Applies to:** T21 Profile (`/profile`) & T22 Preference Retake (`/profile/preferences`) / Issue #64  

> Dokumen ini mengunci kontrak antarmuka, routing, state lifecycle, isolasi data, copy, dan aturan integrasi untuk Traveler Profile (T21) dan Preference Retake (T22). Dokumen ini berakar langsung pada `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, `docs/UI_SPEC.md`, dan `docs/QUIZ_CONTENT_CONTRACT.md`.

---

## 1. Product Context & Objectives

1. **T21 Profile (`/profile`)**:
   - Sebagai personal quiet travel profile untuk traveler yang sudah menyelesaikan onboarding.
   - Menampilkan identitas akun, status verifikasi nomor telepon secara truthful, ringkasan preferensi perjalanan saat ini, entry point untuk ubah preferensi, informasi transparansi data/privasi, serta opsi logout (keluar sesi).
   - Tampil di dalam navigasi utama Traveler (`TravelerAppShell`), dengan tab "Profile" aktif.

2. **T22 Preference Retake (`/profile/preferences`)**:
   - Menggunakan kembali komponen kuis onboarding (T04) secara reusable dan konsisten.
   - Menampilkan visual kuis imersif layar penuh (`DistractionFreeShell hideHeader`).
   - Prefilled dengan preferensi yang tersimpan saat ini, tetapi **selalu mulai dari Langkah 1**.
   - Copy konteks retake: `"Perbarui jeda yang kamu butuhkan sekarang"`.
   - **ISOLASI WORKING DRAFT:** Perubahan jawaban selama retake tidak boleh mengubah preferensi aktif di `sessionStore` sampai seluruh 6 langkah berhasil diselesaikan dan divalidasi.
   - Setelah sukses complete, commit draft baru secara atomik ke `sessionStore`, status onboarding tetap `COMPLETED`, dan diarahkan ke `/onboarding/result` (T05 Recommendation Result) yang langsung mengkalkulasi rekomendasi baru dari intent terbaru.

---

## 2. Route & Shell Architecture

| Route | Shell | Guards | Nav Status |
|---|---|---|---|
| `/profile` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/profile/preferences` | `DistractionFreeShell hideHeader` | `OnboardingRouteGuard` | Immersive full screen, no bottom nav |

### Route Cleanup in `App.tsx`
- Hapus `"profile"` dan `"profile/preferences"` dari array `placeholderTravelerRoutes`.
- Tetap biarkan `["complaints/new", "New complaint"]` pada placeholder.
- Mount rute nyata:
  - `/profile` di dalam `TravelerAppShell` (bersama `/home`, `/explore`, `/trips`).
  - `/profile/preferences` di dalam `DistractionFreeShell hideHeader` membungkus `<TravelerQuizScreen mode="retake" adapter={...} />`.

---

## 3. T21 Profile Screen Specification

### 3.1 Layout & Hierarchy (Taste Direction: Quiet Personal Travel Profile)
- Lebar kontainer maksimal `48rem` (768px), terpusat, dengan padding aman mobile-first.
- Dominasi latar Warm Sand / Stone Off-White (`var(--color-bg-page)`), tipografi tenang dengan Forest Identity (`var(--color-brand-primary)`).
- **Anti-Card-Wall**: Tidak membungkus setiap elemen ke dalam kartu melayang bertumpuk. Menggunakan ritme editorial berkelanjutan dengan divider solid halus (`var(--color-border-default)`).
- Tidak ada badge gamefikasi, tier, reward points, follower/following, atau foto profil buatan.

### 3.2 Sections Order & Content
1. **Header Profil**:
   - Eyebrow / Label: `Profil`
   - Nama Traveler: `user.name` (fallback jika kosong: bagian depan email atau "Traveler JedaIn")
   - Email: `user.email`
   - Copy pendukung: `"Preferensi dan informasi perjalananmu di JedaIn."`
2. **Preferensi Saat Ini (Jeda yang kamu butuhkan sekarang)**:
   - Judul seksi: `Jeda yang kamu butuhkan sekarang`
   - Label Intent Utama: dipetakan dari `QUIZ_INTENT_OPTIONS` (contoh: *Dekat dengan alam*).
   - Fakta Pendukung (editorial typography & restrained chips):
     - **Aktivitas**: label dari `QUIZ_ACTIVITY_OPTIONS`.
     - **Budget**: label dari `QUIZ_BUDGET_OPTIONS`.
     - **Durasi**: label dari `QUIZ_DURATION_OPTIONS`.
     - **Berangkat dari**: label kota keberangkatan (`departure_area_label`).
     - **Pergi bersama**: tipe & ukuran grup dari `QUIZ_GROUP_TYPE_OPTIONS` / `QUIZ_GROUP_SIZE_OPTIONS`.
   - Tombol CTA: `Ubah Preferensi` &rarr; mengarah ke `/profile/preferences`.
   - **Empty State**: Jika `quizDraft` belum lengkap/kosong, tampilkan pesan tenang: `"Preferensi belum tersedia."` dengan tombol CTA `Atur Preferensi` &rarr; `/profile/preferences`.
3. **Identitas Akun & Kontak**:
   - Judul seksi: `Kontak & Akun`
   - Nama lengkap, Email.
   - Nomor Telepon + Status Verifikasi:
     - Menggunakan `mockContactVerificationStore.isPhoneVerified(user.id, user.phone)`.
     - **Verified**: Teks flat inline `✓ Nomor terverifikasi`.
     - **Unverified**: Teks flat inline `Belum terverifikasi` disertai catatan penjelasan bahwa verifikasi akan diminta saat transaksi pemesanan membutuhkan kontak valid.
     - **Tanpa button OTP palsu** (tidak ada flow OTP mandiri di profil).
4. **Privasi & Transparansi Data**:
   - Judul seksi: `Privasi & Data`
   - Penjelasan berbasis sumber resmi T03/PRD:
     *"Preferensimu digunakan untuk personalisasi rekomendasi dan insight agregat, bukan untuk menampilkan data pribadi ke partner."*
   - Bersifat informasional, tanpa alur palsu atau tombol tiket data tiruan.
5. **Logout (Keluar Sesi)**:
   - Tombol teks / secondary tenang: `Keluar dari Akun`.
   - Aksi: `sessionStore.reset()` &rarr; redirect ke `/login` via `navigate("/login", { replace: true })`.
   - Tidak menghapus booking, payment, review, atau storage sistem lain.

---

## 4. T22 Preference Retake Specification

### 4.1 Reusable Quiz Extension
- Props `TravelerQuizScreen`:
  - `mode?: "onboarding" | "retake"` (default: `"onboarding"`).
  - `adapter?: QuizAdapter`.
  - `onComplete?: (finalDraft: QuizDraft) => void`.
- Pada `mode === "retake"`:
  - Header copy konteks: `"Perbarui jeda yang kamu butuhkan sekarang"`.
  - Jawaban yang tersimpan dimuat sebagai nilai awal (prefill).
  - Penanda langkah **selalu mulai dari Langkah 1** (`currentStep = 1`), bukan langkah 6.
  - Tombol Kembali pada Langkah 1:
    - Menampilkan opsi keluar aman kembali ke `/profile` (`Kembali ke Profil`) tanpa merusak preferensi yang sedang aktif.
  - Tombol Kembali pada Langkah 2–6:
    - Mundur ke langkah pertanyaan sebelumnya seperti biasa.

### 4.2 Working Draft Isolation Contract
- Dibuat adapter khusus: `RetakeQuizAdapter implements QuizAdapter`.
- Mekanisme:
  1. Inisialisasi: mengklon data dari `sessionStore.getQuizDraft()`.
  2. `saveQuizStep(stepData)`:
     - **HANYA** memperbarui in-memory working draft di dalam adapter instance.
     - **DILARANG** memanggil `sessionStore.setQuizDraft(...)`.
  3. `completeQuiz(finalDraft)`:
     - Melakukan validasi 6 langkah kuis kanonikal secara ketat.
     - Hanya setelah validasi berhasil:
       - Memanggil `sessionStore.setQuizDraft(finalDraft)`.
       - Memastikan status onboarding tetap `COMPLETED` (`sessionStore.setOnboardingStatus("COMPLETED")`).
       - Mengembalikan hasil completion.
  4. Jika retake dibatalkan di tengah jalan (misal navigasi keluar sebelum submit step 6):
     - `sessionStore.getQuizDraft()` tetap utuh bernilai preferensi lama.
     - Home dan engine rekomendasi tetap memakai preferensi lama.
  5. Jika completeQuiz gagal (error jaringan/validasi):
     - Preferensi lama di `sessionStore` tetap tidak berubah.
     - State form pada layar retake tetap ada sehingga user dapat mencoba lagi.

---

## 5. Integration Contracts

1. **Home Integration**:
   - Link `Ubah preferensi` di `/home` mengarah ke `/profile/preferences`.
   - Mengklik link tersebut membuka kuis retake nyata, bukan placeholder.
2. **Recommendation Engine Integration**:
   - `MockHomeAdapter` dan `engine.ts` membaca preferensi dari `sessionStore.getQuizDraft()`.
   - Setelah retake selesai, navigasi ke `/onboarding/result` langsung mengevaluasi draft baru, dan kembali ke `/home` menampilkan kartu rekomendasi baru yang sinkron.

---

## 6. Non-Negotiable Boundaries

- Dilarang membuat sistem navigasi kedua.
- Dilarang membuat fake photo upload / avatar generator.
- Dilarang membuat mock OTP generator pada halaman profil.
- Dilarang membuat card wall / rounded boxes untuk setiap baris.
- Zero undefined CSS variables.
