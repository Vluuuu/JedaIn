# JedaIn - Traveler Profile & Preference Retake Contract

**Version:** 1.1\
**Date:** 4 September 2026\
**Status:** Feature Contract\
**Applies to:** T21 Profile (`/profile`), Settings (`/profile/settings`), Activity (`/profile/activity`), & T22 Preference Retake (`/profile/preferences`) / Issue #64 / PR #65

> Dokumen ini mengunci kontrak antarmuka, routing, state lifecycle, isolasi data, copy, dan aturan integrasi untuk Traveler Profile (T21), Settings, Activity, serta Preference Retake (T22). Dokumen ini berakar langsung pada `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, `docs/UI_SPEC.md`, `docs/QUIZ_CONTENT_CONTRACT.md`, dan arahan produk v1.1.

---

## 1. Product Context & Objectives

### 1.1 Evolusi Konsep Profil (v1.0 ke v1.1)
Pada v1.0, Traveler Profile dirancang sebagai "Quiet account/settings profile". Pada v1.1, arahan produk berevolusi menjadi:

> **"Traveler identity + current Jeda + journey history + achievements + activity + memories"**

- **Profile (`/profile`)** = Identitas traveler, kebutuhan jeda saat ini (*Current Jeda*), riwayat perjalanan (*Jeda Selesai*), pencapaian objektif (*Jeda Milestones*), aktivitas terbaru (*Aktivitas Terbaru*), dan momen perjalanan (*Momen Jeda*).
- **Settings (`/profile/settings`)** = Manajemen akun, kontak, status verifikasi telepon, transparansi privasi, dan keluar sesi (*Keluar dari Akun*).
- **Activity (`/profile/activity`)** = Garis waktu lengkap aktivitas perjalanan traveler (*Aktivitas Perjalanan*), terurut kronologis terbaru.
- **Preference Retake (`/profile/preferences`)** = Evaluasi ulang kebutuhan jeda melalui 6 langkah kuis kanonikal secara terisolasi.

### 1.2 Dokumen & Aturan yang Diperbarui vs Dijamin Tetap
Revisi v1.1 **hanya menggantikan** batasan presentasi lama terkait larangan foto profil/avatar, follower/following, dan milestone/badge.
Revisi ini **TIDAK memperlemah** dan **MENJAGA 100%**:
- Kebenaran status verifikasi kontak (`mockContactVerificationStore.isPhoneVerified`).
- Batasan privasi (tidak ada pembocoran email, nomor HP, referensi pembayaran, atau OTP pada feed publik/aktivitas).
- Isolasi working-draft saat retake kuis (`RetakeQuizAdapter`).
- Sinkronisasi pembaruan rekomendasi ke Home setelah commit retake.
- Semantik logout (`sessionStore.reset() -> navigate("/login", { replace: true })`).
- Tanpa OTP palsu.
- Validasi ketat kelengkapan `QuizDraft`.

---

## 2. Route & Shell Architecture

| Route | Shell | Guards | Nav Status |
|---|---|---|---|
| `/profile` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/profile/settings` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/profile/activity` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/profile/preferences` | `DistractionFreeShell hideHeader` | `OnboardingRouteGuard` | Immersive full screen, no bottom nav |

---

## 3. T21 Profile Screen Specification (Main Profile)

### 3.1 Layout & Visual Hierarchy (North Star: Personal Jeda Journal)
- **Forest Identity Hero (Atas)**: Menggunakan nuansa Forest Green (`var(--color-forest-900)` / `var(--color-forest-700)`).
  - Avatar / monogram inisial nama (bukan foto orang acak internet atau stok gambar).
  - Nama traveler (`user.name`).
  - Bio singkat jika tersedia.
  - Micro-identity "Lagi butuh: [intent label]" (misal: "Dekat dengan alam"). Menggunakan opsi dari `QUIZ_INTENT_OPTIONS`.
  - Icon Gear / Pengaturan Profil di pojok kanan atas menuju `/profile/settings` (accessible label: `Pengaturan Profil`).
  - **TIDAK ADA**: level, score XP, badge anak-anak, nomor HP, email mencolok, tombol Follow pada profil sendiri.
- **Journey & Social Stat Row**:
  - 3 Kolom simetris:
    1. **Jeda Selesai**: Dihitung otoritatif dari booking dengan status `COMPLETED` milik traveler.
    2. **Followers**: Dikelola melalui store prototipe terpusat (`mockTravelerCommunityStore`), default 0 untuk traveler baru.
    3. **Following**: Dikelola melalui store prototipe terpusat (`mockTravelerCommunityStore`), default 0 untuk traveler baru.
  - Label konsisten: `Jeda Selesai`, `Followers`, `Following`.
- **Jeda Milestones (Pencapaian Perjalanan)**:
  - 4-5 milestone perjalanan berbasis data nyata (contoh: *Jeda Pertama*, *Tiga Jeda*, *Lima Destinasi*, *Pemberi Ulasan*).
  - Menampilkan status tercapai (*earned*) dan terkunci (*locked*) secara bermakna tanpa gamifikasi agresif.
  - **TIDAK ADA**: leaderboard, points, tier perunggu/perak/emas.
- **Transisi ke Kontainer Warm Sand**:
  - Transisi visual natural dari Forest Hero ke Warm Sand / Off-White (`var(--color-bg-page)`).
  - Kontainer konten dibatasi secara proporsional (`48rem` - `56rem` pada desktop), terpusat, mobile-first (`390px`).
- **Jeda yang kamu butuhkan sekarang**:
  - Ringkasan preferensi aktif (Intent, Aktivitas, Budget, Durasi, Keberangkatan, Grup).
  - Tombol aksi: `Ubah Preferensi` &rarr; `/profile/preferences`.
  - Empty state jika draft belum lengkap: `"Preferensi belum tersedia."`.
- **Aktivitas Terbaru**:
  - Menampilkan maksimal 3 entri aktivitas perjalanan terbaru (booking `COMPLETED`, ulasan selesai, milestone tercapai).
  - Tombol/link `Lihat Semua` / `Aktivitas Terbaru ->` &rarr; `/profile/activity`.
- **Momen Jeda**:
  - Galeri media foto/video dari perjalanan `COMPLETED` milik traveler bersangkutan.
  - Grid responsif (3 kolom mobile).
  - Jika belum ada media riil dari booking selesai: wajib menampilkan truthful empty state: `"Belum ada Momen Jeda."` dengan keterangan `"Setelah perjalanan selesai, foto dan video perjalananmu bisa tampil di sini."`.

---

## 4. Settings Screen Specification (`/profile/settings`)

Layar tenang dan utilitarian untuk pengelolaan akun:
1. **Header**: `Pengaturan Profil` dengan tombol kembali ke `/profile`.
2. **Edit Profil**: Pengaturan nama tampilan, bio singkat, dan inisial/avatar tanpa merusak autentikasi.
3. **Kontak & Akun**:
   - Nama lengkap, email.
   - Nomor HP dengan status verifikasi dari `mockContactVerificationStore.isPhoneVerified`.
   - Menampilkan `✓ Nomor terverifikasi` atau `Belum terverifikasi` dengan catatan kontekstual.
   - Tanpa tombol OTP berdiri sendiri.
4. **Preferensi**:
   - Ringkasan singkat intent saat ini dan tombol `Ubah Preferensi` &rarr; `/profile/preferences`.
5. **Privasi & Data**:
   - Copy transparansi: *"Preferensimu digunakan untuk personalisasi rekomendasi dan insight agregat, bukan untuk menampilkan data pribadi ke partner."*
6. **Keluar dari Akun (Logout)**:
   - Aksi: `sessionStore.reset()` &rarr; `navigate("/login", { replace: true })`.

---

## 5. Activity Screen Specification (`/profile/activity`)

- Header: `Aktivitas Perjalanan` dengan tombol kembali ke `/profile`.
- Menampilkan seluruh riwayat aktivitas perjalanan (perjalanan selesai, ulasan diserahkan, milestone diraih) secara kronologis (terbaru di atas).
- **Perlindungan Privasi**: Aktivitas TIDAK memuat email, nomor telepon, referensi pembayaran, token, atau rincian pembatalan.

---

## 6. Preference Retake Specification (`/profile/preferences`)

- Menggunakan `RetakeQuizAdapter` dengan isolasi working-draft.
- Prefill jawaban yang tersimpan, namun selalu mulai dari Langkah 1.
- Tombol `Ke Profil` / `Kembali ke Profil` pada Langkah 1 membatalkan retake tanpa mengubah preferensi aktif di `sessionStore`.
- Setelah Langkah 6 selesai divalidasi, preferensi baru di-commit ke `sessionStore`, status onboarding tetap `COMPLETED`, dan diarahkan ke `/onboarding/result`.

---

## 7. Non-Negotiable Boundaries

- Dilarang membuat feed penemuan publik, rute profil user lain, follow/unfollow interaktif, DM, atau komentar publik pada PR ini.
- Dilarang membuat fake photo upload pihak ketiga / fetching foto sembarang dari internet.
- Dilarang membuat card wall bertumpuk tanpa ritme desain.
- Zero undefined CSS variables.
- Mematuhi Taste Skill (0 em-dash, WCAG AA contrast, touch target >= 44px).
