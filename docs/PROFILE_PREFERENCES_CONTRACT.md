# JedaIn - Traveler Profile & Preference Retake Contract

**Version:** 1.2\
**Date:** 4 September 2026\
**Status:** Feature Contract\
**Applies to:** T21 Profile (`/profile`), Settings (`/profile/settings`), Activity (`/profile/activity`), Phone Verification (`/profile/verify-phone`), Social Discovery (`/travelers/search`), Public Profile (`/travelers/:travelerId`), Follow Lists (`/travelers/:travelerId/followers`, `/travelers/:travelerId/following`), & T22 Preference Retake (`/profile/preferences`) / Issue #64 / PR #65

> Dokumen ini mengunci kontrak antarmuka, routing, state lifecycle, isolasi data, copy, dan aturan integrasi untuk Traveler Profile (T21), Settings, Activity, Verifikasi Nomor Mandiri, Penemuan Sosial (Search & Public Profile), serta Preference Retake (T22). Dokumen ini berakar langsung pada `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, `docs/UI_SPEC.md`, `docs/QUIZ_CONTENT_CONTRACT.md`, dan arahan visual v1.2.

---

## 1. Product Context & Objectives

### 1.1 Evolusi Konsep Profil (v1.1 ke v1.2: Visual Rebuild & Social Discovery)
Pada v1.2, Traveler Profile ditingkatkan dari prototipe fungsional menjadi *Personal Jeda Journal* yang berkarakter, ringkas, dan hidup dengan fitur penemuan sosial:

1. **Main Profile (`/profile`)**:
   - Menghapus blok rangkuman preferensi panjang (Aktivitas, Budget, Durasi, Keberangkatan, Grup, dan tombol Ubah Preferensi) dari halaman utama profil. Kebutuhan jeda cukup diwakili oleh micro-identity *Current Jeda* di Forest Hero (`Lagi butuh: [intent label]`).
   - Navigasi header atas memuat aksi **Cari Traveler** (`/travelers/search`) dan **Pengaturan Profil** (`/profile/settings`).
   - Menampilkan baris statistik sosial (`Jeda Selesai`, `Followers`, `Following`) yang interaktif menuju daftar followers/following.
   - Strip *Jeda Milestones* diperbarui dengan medallion ikon khas JedaIn (sprout/journey, trail/path, map pin, reflection star).
   - Nudge kontekstual verifikasi nomor telepon: hanya tampil jika traveler memiliki nomor HP dan belum terverifikasi, mengarahkan ke alur verifikasi nyata (`/profile/verify-phone`).
   - Aktivitas Terbaru (maksimal 3 entri dengan tautan ke `/profile/activity`) dan Momen Jeda.

2. **Pengaturan Profil (`/profile/settings`)**:
   - Rebuild visual editor identitas di bagian atas: lingkaran preview avatar, tombol ubah foto lokal (`<input type="file" accept="image/*">`), nama tampilan, dan bio singkat.
   - Menjadi satu-satunya pintu utama pengelolaan preferensi perjalanan dari permukaan profil (*Preferensi Jeda* &rarr; `Ubah Preferensi` &rarr; `/profile/preferences`).
   - Menyajikan informasi kontak, status nomor terverifikasi, transparansi data, dan logout.

3. **Verifikasi Nomor Telepon (`/profile/verify-phone`)**:
   - Alur verifikasi nomor telepon profil berbasis OTP demo (`111111`) yang memperbarui `mockContactVerificationStore`.

4. **Penemuan Sosial & Profil Publik (`/travelers/*`)**:
   - `/travelers/search`: Pencarian traveler prototype berbasis nama tampilan secara case-insensitive tanpa membocorkan data privat.
   - `/travelers/:travelerId`: Profil publik traveler lain yang aman (identitas publik, statistik perjalanan, milestone, aktivitas publik, dan momen publik) dilengkapi tombol fungsional **Follow / Following**. Dilarang menampilkan tombol Follow pada profil sendiri.
   - `/travelers/:travelerId/followers` dan `/travelers/:travelerId/following`: Daftar pengikut dan yang diikuti.

5. **Preference Retake (`/profile/preferences`)**:
   - Menjaga isolasi draft kerja (`RetakeQuizAdapter`), mulai dari Langkah 1, dan commit atomik pada Langkah 6.

---

## 2. Route & Shell Architecture

| Route | Shell | Guards | Nav Status |
|---|---|---|---|
| `/profile` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/profile/settings` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/profile/verify-phone` | `DistractionFreeShell` | `OnboardingRouteGuard` | Immersive focused form |
| `/profile/activity` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible, tab `profile` active |
| `/travelers/search` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible |
| `/travelers/:travelerId` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible |
| `/travelers/:travelerId/followers` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible |
| `/travelers/:travelerId/following` | `TravelerAppShell` | `OnboardingRouteGuard` | Bottom Nav visible |
| `/profile/preferences` | `DistractionFreeShell hideHeader` | `OnboardingRouteGuard` | Immersive full screen, no bottom nav |

---

## 3. Privacy & Public-Safe Boundaries

1. **Privasi Profil Publik (`/travelers/:travelerId`)**:
   - **Boleh Tampil**: Nama tampilan, bio, avatar, Jeda Selesai, Followers, Following, Milestones, Aktivitas publik, Momen publik, Tombol Follow/Following (kecuali profil sendiri).
   - **Dilarang Tampil**: Email, nomor telepon, status verifikasi kontak, opsi Settings, preferensi privat (Current Jeda disembunyikan di profil publik), ID booking, referensi transaksi, dan logout.

2. **Privasi Pencarian Traveler (`/travelers/search`)**:
   - Hasil pencarian hanya menampilkan: Nama tampilan, bio ringkas, jumlah Jeda Selesai, dan avatar monogram/gambar.
   - Dilarang memuat email, nomor telepon, atau data pembayaran.

---

## 4. Non-Negotiable Boundaries

- Dilarang membuat feed penemuan tanpa batas (infinite scroll), DM, komentar publik, atau likes.
- Dilarang menggunakan foto wajah orang acak dari internet atau avatar AI.
- Zero em-dashes (`—`).
- WCAG AA contrast dan touch target minimal 44px.
- Zero undefined CSS variables.
