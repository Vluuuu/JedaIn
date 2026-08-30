# JedaIn

Frontend JedaIn dibangun sebagai single-page application dengan React, TypeScript, Vite, dan React Router.

## Prasyarat

- Node.js 20.19+, 22.12+, atau 24+
- npm 10 atau lebih baru

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

## Pemeriksaan kualitas

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment

Salin `.env.example` ke `.env.local` untuk konfigurasi lokal. Variabel yang perlu tersedia di browser harus diawali `VITE_`; jangan menaruh secret pada variabel tersebut.

- `VITE_API_BASE_URL`: base URL API ketika kontrak backend sudah tersedia. Nilai kosong berarti belum dikonfigurasi.

Akses environment melalui `src/lib/config/env.ts`, bukan langsung dari komponen. File `.env.local` diabaikan Git melalui pola `*.local`.
