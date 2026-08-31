# JedaIn — Traveler Quiz Content Contract

**Version:** 1.0  
**Date:** 31 Agustus 2026  
**Status:** Product Content Contract for MVP  
**Applies to:** T04 Mandatory Onboarding Quiz / Issue #7

> Dokumen ini mengunci wording, pilihan jawaban, tipe input, dan semantics data untuk enam langkah onboarding quiz MVP JedaIn. Dokumen ini tidak boleh mengoverride keputusan yang lebih tinggi di `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, atau `docs/UI_SPEC.md`. Jika terjadi konflik, source yang lebih tinggi harus diprioritaskan dan dokumen ini diperbarui.

---

# 1. Tujuan Produk

Quiz bukan sekadar form onboarding. Quiz mempunyai dua fungsi inti:

1. **Traveler personalization** — menangkap current intent dan preference yang dapat dipakai oleh recommendation engine rule-based.
2. **Demand insight** — menghasilkan signal agregat yang dapat dipakai untuk memahami kebutuhan traveler dan unmet demand untuk EO/Admin.

Sesuai PRD:

- quiz terbaru menjadi **current intent** utama,
- first-time quiz wajib dan tidak memiliki Skip,
- recommendation MVP bersifat **rule-based**, bukan AI/ML,
- quiz maksimal 5–8 pertanyaan dengan target pengisian <3 menit,
- budget, duration, dan departure/location adalah signal penting untuk recommendation dan discovery.

---

# 2. Prinsip Content & UX

- Satu langkah berfokus pada satu keputusan utama.
- Copy user-facing menggunakan Bahasa Indonesia yang natural, singkat, dan tidak terdengar seperti asesmen psikologis/medis.
- Jangan menanyakan data yang tidak mempunyai fungsi langsung untuk recommendation, feasibility, atau demand insight.
- Jangan menampilkan istilah internal seperti `Healing Intent` kepada traveler.
- Jawaban yang sudah dipilih harus tersimpan saat user kembali ke langkah sebelumnya.
- Multi-select harus selalu menjelaskan batas jumlah pilihan.
- Budget dan duration option values harus centralized/configurable.
- Transport dari departure area **belum dikunci sebagai included/add-on/self-arrival**. Lihat bagian Pending Business Decision.

---

# 3. Enam Langkah Quiz MVP — LOCKED CONTENT V1

## Q1 — Current Intent

**Internal field:** `current_intent`  
**Type:** `SINGLE_SELECT`  
**Required:** yes

### Question

> **Jeda seperti apa yang paling kamu butuhkan sekarang?**

### Helper copy

> Pilih yang paling menggambarkan kebutuhanmu kali ini.

### Options

| Value | Label traveler |
|---|---|
| `RECHARGE` | Tenang & recharge |
| `NATURE` | Dekat dengan alam |
| `NOVELTY` | Eksplorasi & suasana baru |
| `REFLECTION` | Refleksi & me-time |
| `ACTIVE` | Bergerak & lebih aktif |
| `SOCIAL` | Quality time bareng orang dekat |

### Kenapa pertanyaan ini ada

Pertanyaan ini menangkap **WHY** di balik trip: alasan utama traveler mencari jeda saat ini. Ini adalah signal current intent utama, bukan personality permanen.

### Fungsi sistem

- primary relevance signal untuk recommendation,
- dasar human-readable match explanation,
- aggregate demand insight untuk EO/Admin.

### Future package counterpart

Package dapat memiliki metadata seperti:

```text
experience_intents[]
```

Contoh: `RECHARGE`, `NATURE`, `REFLECTION`.

---

## Q2 — Preferred Activity

**Internal field:** `preferred_activities`  
**Type:** `MULTI_SELECT`  
**Required:** yes  
**Selection limit:** minimum 1, maximum 2

### Question

> **Aktivitas seperti apa yang paling ingin kamu lakukan?**

### Helper copy

> Pilih maksimal 2 supaya rekomendasinya tetap fokus.

### Options

| Value | Label traveler |
|---|---|
| `NATURE_SCENERY` | Alam & pemandangan |
| `MINDFULNESS_RELAXATION` | Relaksasi & mindfulness |
| `LOCAL_CULTURE` | Budaya & pengalaman lokal |
| `CREATIVE_WORKSHOP` | Kreatif & workshop |
| `LIGHT_EXPLORATION` | Eksplorasi ringan |
| `OUTDOOR_ACTIVE` | Outdoor & aktif |

### Kenapa pertanyaan ini ada

Q1 menjawab **WHY** traveler ingin jeda. Q2 menjawab **WHAT** yang ingin dilakukan. Dua traveler dapat memiliki intent `RECHARGE` yang sama tetapi memilih aktivitas yang berbeda.

### Fungsi sistem

- activity/tag matching terhadap package,
- secondary relevance signal setelah current intent,
- aggregate activity demand insight.

### Future package counterpart

```text
activity_tags[]
```

---

## Q3 — Budget Comfort

**Internal field:** `budget_band`  
**Type:** `SINGLE_SELECT`  
**Required:** yes  
**Configuration:** centralized/configurable

### Question

> **Untuk satu experience, budget yang nyaman per orang berapa?**

### Helper copy

> Pilih kisaran yang paling realistis buat kamu kali ini.

### MVP Options

| Value | Label traveler |
|---|---|
| `UP_TO_200K` | Sampai Rp200 ribu |
| `AROUND_200_300K` | Sekitar Rp200–300 ribu |
| `AROUND_300_500K` | Sekitar Rp300–500 ribu |
| `ABOVE_500K` | Di atas Rp500 ribu |

### Kenapa pertanyaan ini ada

Minat saja tidak cukup untuk menghasilkan recommendation yang realistis. Budget membantu membedakan experience yang relevan secara tema tetapi tidak sesuai kemampuan belanja traveler saat ini.

### Fungsi sistem

- strong price-fit preference,
- ranking/fallback proximity,
- budget distribution untuk demand insight.

### Important rule

Budget tidak otomatis menjadi hard reject untuk near-match. Exact matching/ranking policy diputuskan pada Recommendation Contract / Issue #8.

### Transport note

Kisaran ini merujuk pada **harga experience/package yang ditampilkan JedaIn**. Jangan menyatakan bahwa transport dari departure area termasuk atau tidak termasuk sampai business decision dikunci.

---

## Q4 — Available Duration

**Internal field:** `duration_preference`  
**Type:** `SINGLE_SELECT`  
**Required:** yes  
**Configuration:** centralized/configurable

### Question

> **Berapa lama waktu yang realistis kamu punya untuk jeda kali ini?**

### Helper copy

> Biar rekomendasinya cocok dengan waktu yang benar-benar kamu punya.

### MVP Options

| Value | Label traveler |
|---|---|
| `HALF_DAY` | Setengah hari |
| `FULL_DAY` | 1 hari |
| `TWO_D_ONE_N` | 2 hari 1 malam |
| `THREE_D_TWO_N_PLUS` | 3 hari 2 malam atau lebih |

### Kenapa pertanyaan ini ada

Quiz terbaru merepresentasikan current intent. Karena itu yang ditanyakan adalah waktu yang realistis tersedia **kali ini**, bukan durasi liburan favorit secara permanen.

### Fungsi sistem

- feasibility / duration fit,
- ranking package,
- duration distribution untuk demand insight.

### Future package counterpart

Package harus memiliki duration machine-readable, tidak hanya display text.

---

## Q5 — Departure Area

**Internal fields:** `departure_area_id`, `departure_area_label`  
**Type:** `SINGLE_SELECT_WITH_OTHER`  
**Required:** yes

### Question

> **Kamu paling mungkin berangkat dari area mana?**

### Helper copy

> Ini membantu kami mencari experience yang lebih relevan dari titik awalmu.

### MVP Options

| Value | Label traveler |
|---|---|
| `MALANG` | Malang |
| `SURABAYA` | Surabaya |
| `OTHER` | Area lain |

Jika user memilih `OTHER`, tampilkan input/select area yang ringkas. Simpan display label yang diberikan user tanpa mengubahnya menjadi janji pickup/transport.

### Kenapa pertanyaan ini ada

Departure area adalah signal konteks/logistik yang membantu recommendation dan juga memberi insight tentang dari wilayah mana demand berasal.

### Fungsi sistem

- departure/location relevance,
- secondary recommendation ranking,
- departure-area demand insight,
- future supply planning.

### Important rule — LOCKED UNTIL BUSINESS DECISION

Departure area **tidak berarti**:

- pickup dari rumah,
- shuttle tersedia,
- transport gratis,
- transport sudah termasuk harga,
- transport adalah add-on.

Saat ini maknanya hanya **starting-area relevance**.

---

## Q6 — Group Context

**Internal fields:** `group_type`, `group_size_band`  
**Type:** `SINGLE_SELECT + CONDITIONAL_SIZE`  
**Required:** yes

### Question

> **Kamu rencananya menikmati jeda ini dengan siapa?**

### Group Type Options

| Value | Label traveler |
|---|---|
| `SOLO` | Sendiri |
| `PARTNER` | Pasangan |
| `FRIENDS` | Teman |
| `FAMILY` | Keluarga |

### Conditional size behavior

- `SOLO` → size = `ONE` otomatis.
- `PARTNER` → size = `TWO` otomatis.
- `FRIENDS` / `FAMILY` → minta size band dalam langkah yang sama:
  - `TWO`
  - `THREE_TO_FOUR`
  - `FIVE_PLUS`

User-facing size labels:

- `2 orang`
- `3–4 orang`
- `5+ orang`

### Kenapa pertanyaan ini ada

Group context membantu membedakan experience yang nyaman untuk solo traveler, pasangan, teman, atau keluarga. Group size juga relevan untuk feasibility/capacity context.

### Fungsi sistem

- package compatibility context,
- capacity feasibility context,
- group demand segmentation.

### Important rule

Issue #7 hanya menangkap dan menyimpan signal ini. Exact capacity filtering tetap mengikuti Session/Booking source-of-truth dan tidak ditentukan oleh quiz UI.

---

# 4. Signal Semantics untuk Recommendation

## 4.1 Jangan mengarang bobot numerik

MVP **tidak mengunci** formula seperti:

```text
Intent = 40%
Activity = 25%
Budget = 15%
...
```

Belum ada data yang cukup untuk membenarkan angka tersebut.

## 4.2 Conceptual hierarchy

Untuk Issue #7, cukup simpan signal dengan semantics berikut:

### Personalization relevance

- `current_intent`
- `preferred_activities`
- `group_type`

### Strong feasibility/context preferences

- `budget_band`
- `duration_preference`
- `departure_area`
- `group_size_band`

### Hard operational constraints

Hard constraints seperti session capacity, `OPEN/FULL/CLOSED`, dan booking availability **bukan bagian dari quiz** dan tetap berasal dari data package/session authoritative.

Exact ranking algorithm dikunci pada Issue #8.

---

# 5. Recommendation Explanation Contract — Forward Compatibility

Quiz harus menyimpan values yang memungkinkan #8 membuat explanation manusiawi tanpa mengarang AI score.

Contoh answer set:

```text
current_intent = NATURE
preferred_activities = [NATURE_SCENERY, LIGHT_EXPLORATION]
budget_band = AROUND_200_300K
duration_preference = FULL_DAY
departure_area = MALANG
group_type = FRIENDS
group_size_band = THREE_TO_FOUR
```

Contoh explanation yang valid di #8:

> Kamu mencari jeda dekat alam dengan eksplorasi ringan dan punya waktu sekitar satu hari.

atau faktor ringkas:

```text
Dekat dengan alam · 1 hari · Berangkat dari Malang
```

Jangan mengubah signal ini menjadi klaim probabilitas/AI tanpa contract yang jelas.

---

# 6. Demand Insight Mapping

Signal quiz yang dapat diagregasi untuk EO/Admin:

```text
current_intent distribution
preferred_activity distribution
budget distribution
duration distribution
departure area distribution
group context distribution
```

Unmatched combination dapat menjadi input `Unmet Demand Insight` di masa implementasi sesuai PRD.

Contoh conceptual cluster:

```text
Departure: Malang
Intent: NATURE + RECHARGE
Duration: FULL_DAY
Budget: AROUND_200_300K
Supply match: rendah
```

Issue #7 **tidak** perlu membangun EO insight atau analytics backend. Hanya data contract-nya harus memungkinkan penggunaan tersebut di fase berikutnya.

---

# 7. Save / Resume Contract

Setiap jawaban harus dapat disimpan per-step melalui abstraction/adapter.

Minimal draft shape:

```text
QuizDraft
- currentStep
- current_intent
- preferred_activities[]
- budget_band
- duration_preference
- departure_area_id
- departure_area_label
- group_type
- group_size_band
- updatedAt
```

Rules:

- answer yang valid disimpan ketika step disubmit/di-advance,
- back tidak menghapus previous answer,
- `IN_PROGRESS` resume ke latest incomplete step,
- final completion hanya terjadi setelah seluruh required answer valid,
- final success → onboarding `COMPLETED` → `/onboarding/result`,
- save failure tidak menghapus jawaban lokal user dan harus dapat retry.

---

# 8. Visual Interaction Direction

Ini content contract, bukan final art direction. Implementation #7 tetap wajib mengikuti `docs/DESIGN_SYSTEM.md` dan visual review.

Recommended interaction mapping:

- Q1: expressive selectable cards / visual choice cards,
- Q2: multi-select cards/chips, maximum 2 visibly communicated,
- Q3: concise price-band cards,
- Q4: duration cards with clear time hierarchy,
- Q5: area selector with `Area lain` conditional input,
- Q6: group-type cards + conditional size control in the same step.

Traveler UI harus mobile-first dan tidak terasa seperti survey/Google Form.

---

# 9. Pending Business Decisions

## Transport from departure area

**Status: PENDING BUSINESS DECISION.**

Belum diputuskan apakah transport:

- included dalam package,
- optional add-on,
- self-arrival,
- atau hybrid per package.

Sampai keputusan bisnis tersedia:

- Q5 hanya berarti starting-area relevance,
- jangan ubah budget semantics berdasarkan asumsi transport,
- jangan menambahkan transport price ke quiz,
- jangan membuat pickup/shuttle promise di recommendation atau UI.

Ketika keputusan bisnis dikunci, sinkronkan setidaknya:

```text
PRD
→ System Flow / package semantics
→ Trip Builder / Pricing
→ Package Detail
→ Checkout
→ Recommendation semantics
→ Quiz departure/budget helper copy bila perlu
```

---

# 10. Research Rationale

Contract ini menggunakan source-of-truth JedaIn sebagai authority utama dan riset eksternal hanya sebagai validasi arah product content.

Referensi pendukung:

1. Wellness-tourism motivation research menemukan faktor seperti relaxation/healing, novelty, self-examination/education, nature friendliness, dan social relationship sebagai motif yang berbeda dan relevan untuk segmentasi experience.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC9859326/

2. Tourism recommendation literature menunjukkan bahwa interest preference perlu dikombinasikan dengan trip constraints/context seperti departure location dan available duration agar rekomendasi lebih feasible.  
   https://www.sciencedirect.com/science/article/pii/S156849462301102X

3. GOV.UK form guidance menyarankan hanya menanyakan informasi yang memang diperlukan dan memulai dengan satu hal/pertanyaan per halaman untuk membantu fokus, mobile usability, autosave, dan error recovery.  
   https://www.gov.uk/service-manual/design/form-structure

Research tidak mengoverride PRD atau keputusan bisnis JedaIn.

---

# 11. Implementation Boundary Issue #7

Issue #7 boleh mengimplementasikan:

- enam langkah di atas,
- config/value contract,
- progress,
- validation,
- autosave/step-save abstraction,
- resume,
- final completion transition,
- UI states dan responsive behavior.

Issue #7 **tidak** boleh mengimplementasikan:

- recommendation scoring final,
- fake match percentage,
- EO insight dashboard,
- package schema besar di luar kebutuhan minimal adapter/mock,
- transport business rule,
- production backend/database,
- AI/ML recommendation.

Recommendation logic/detail dilanjutkan di Issue #8.