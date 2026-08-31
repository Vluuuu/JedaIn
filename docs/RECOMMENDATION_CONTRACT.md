# JedaIn — Traveler Recommendation Contract

**Version:** 1.0  
**Date:** 31 Agustus 2026  
**Status:** MVP Prototype Contract  
**Applies to:** T05 Recommendation Result / Issue #8

> Dokumen ini mengunci kontrak implementasi recommendation MVP/prototype JedaIn setelah Mandatory Quiz. Tujuannya bukan membuat recommendation engine production-grade, melainkan memastikan alur demo `Quiz → Recommendation → Home/Package Detail` konsisten, explainable, deterministic, dan tidak mengarang AI/ML. Dokumen ini tidak boleh mengoverride keputusan yang lebih tinggi di `PRD.md`, `docs/SYSTEM_FLOW.md`, `docs/WIREFRAME_SPEC.md`, atau `docs/UI_SPEC.md`.

---

# 1. Product Goal

Recommendation Result adalah payoff langsung setelah traveler menyelesaikan quiz.

Untuk MVP lomba, recommendation harus:

1. menggunakan jawaban quiz terbaru sebagai current intent utama,
2. menghasilkan satu rekomendasi utama yang mudah dipahami,
3. memberi 2 alternatif yang masih relevan,
4. menjelaskan **kenapa** package dipilih dengan faktor yang berasal dari quiz/package metadata,
5. mempunyai fallback ketika tidak ada package yang cukup cocok,
6. mencatat unmet demand melalui adapter/mock behavior,
7. tidak menampilkan AI/ML claim atau precision palsu.

Target implementasi adalah **alur sistem + UI/UX prototype**, bukan recommendation backend production.

---

# 2. Source Priority

Jika terjadi conflict, gunakan:

```text
PRD.md
> SYSTEM_FLOW.md
> WIREFRAME_SPEC.md
> UI_SPEC.md
> QUIZ_CONTENT_CONTRACT.md
> RECOMMENDATION_CONTRACT.md
> DESIGN_SYSTEM.md
> Issue #8 implementation notes
> implementation
```

Keputusan yang masih `PENDING` di source yang lebih tinggi tidak boleh diam-diam dianggap business-final oleh dokumen ini. Rule di bawah adalah **deterministic MVP prototype rule** dan harus mudah diganti/configure pada fase berikutnya.

---

# 3. Input Contract

Recommendation membaca `QuizDraft` final dari Issue #7:

```text
current_intent
preferred_activities[]
budget_band
duration_preference
departure_area_id
departure_area_label
group_type
group_size_band
```

Current quiz/latest intent tetap menjadi signal utama sesuai PRD.

Behavior history, rating/popularity, dan data tambahan boleh menjadi tie-breaker/fallback sesuai source, tetapi Issue #8 prototype tidak perlu membangun analytics/behavior backend.

---

# 4. Package Metadata Contract — MVP

Recommendation data tidak boleh hardcoded di visual components.

Minimal mock package shape:

```text
PackageRecommendationSource
- id
- title
- shortSummary
- destinationName
- locationLabel
- image / visualAsset
- status                    // LIVE required for recommendation
- verificationLevel         // BASIC | PLUS
- pricePerPerson
- durationType
- departureAreas[]
- experienceIntents[]
- activityTags[]
- suitableGroupTypes[]
- suitableGroupSizeBands[]
- rating
- popularityRank / bookingPopularity
```

## 4.1 Package vs Session

`Package != Session` tetap berlaku.

Issue #8 meranking **package**.

Jangan menggunakan session capacity sebagai quiz/recommendation hard rule pada prototype ini. Actual availability/capacity tetap authoritative pada Session/Booking flow berikutnya.

Package yang bisa masuk candidate recommendation minimum harus:

```text
status = LIVE
```

---

# 5. Signal Mapping

## 5.1 Current Intent

Quiz:

```text
RECHARGE
NATURE
NOVELTY
REFLECTION
ACTIVE
SOCIAL
```

Package counterpart:

```text
experienceIntents[]
```

`intentMatch = true` jika `current_intent` traveler ada pada `experienceIntents` package.

Ini adalah signal relevance utama.

## 5.2 Preferred Activities

Quiz:

```text
preferred_activities[] // max 2
```

Package counterpart:

```text
activityTags[]
```

Hitung overlap:

```text
activityOverlap = 0 | 1 | 2
```

Jangan mengubah overlap menjadi persentase user-facing.

## 5.3 Budget

Budget pada MVP diperlakukan sebagai **spending comfort ceiling untuk feasibility**, bukan harga minimum yang harus dihabiskan.

Prototype ceiling:

```text
UP_TO_200K       -> <= 200000
AROUND_200_300K  -> <= 300000
AROUND_300_500K  -> <= 500000
ABOVE_500K       -> no upper ceiling in MVP prototype
```

Package yang lebih murah tidak dianggap mismatch hanya karena berada di bawah band yang dipilih.

Exact pricing semantics tetap dapat berubah jika business model pricing/transport berubah.

**Transport inclusion tetap PENDING BUSINESS DECISION.** Jangan infer transport dari budget.

## 5.4 Duration

Duration berasal dari waktu realistis traveler **kali ini**.

Prototype relation:

```text
EXACT
SHORTER_BUT_FEASIBLE
TOO_LONG
```

Order durasi:

```text
HALF_DAY
< FULL_DAY
< TWO_D_ONE_N
< THREE_D_TWO_N_PLUS
```

Rule:

- package dengan durasi sama -> `EXACT`,
- package lebih pendek -> `SHORTER_BUT_FEASIBLE`,
- package lebih panjang dari waktu traveler -> `TOO_LONG`.

Recommendation utama memprioritaskan `EXACT`, tetapi package lebih pendek masih dapat menjadi alternatif/fallback.

## 5.5 Departure Area

Departure Area hanya berarti **starting-area relevance**.

`departureMatch = true` jika departure area traveler cocok dengan `departureAreas[]` package.

Untuk `OTHER`, prototype tidak perlu geocoding atau menghitung jarak. Custom label disimpan dan dapat menghasilkan no exact departure match.

Departure Area **tidak berarti**:

- pickup,
- shuttle,
- transport termasuk,
- transport gratis,
- transport add-on.

## 5.6 Group Context

Package dapat mempunyai:

```text
suitableGroupTypes[]
suitableGroupSizeBands[]
```

`groupCompatible` menjadi soft compatibility signal.

Ini **bukan** pengganti actual Session capacity.

---

# 6. Deterministic MVP Matching Rule

Tidak menggunakan formula persentase atau bobot numerik seperti `Intent 40%`.

## 6.1 Candidate Eligibility

Mulai dari semua package:

```text
status = LIVE
```

## 6.2 Sufficient Match

Sebuah package termasuk `SUFFICIENT_MATCH` jika seluruh kondisi berikut terpenuhi:

```text
intentMatch = true
AND activityOverlap >= 1
AND budgetFeasible = true
AND durationRelation != TOO_LONG
```

Departure dan group context membantu ranking, tetapi tidak menjadi syarat sufficient match karena keduanya masih konteks/compatibility dan actual logistics/capacity berada di flow lain.

## 6.3 Ranking Sufficient Matches

Jika ada lebih dari satu `SUFFICIENT_MATCH`, sort secara deterministic dengan priority berikut:

```text
1. duration EXACT > SHORTER_BUT_FEASIBLE
2. activityOverlap 2 > 1
3. departureMatch true > false
4. groupCompatible true > false
5. rating lebih tinggi
6. popularity lebih tinggi sebagai final tie-breaker
```

Semua sufficient matches sudah mempunyai `intentMatch=true`, sehingga latest/current intent tetap menjadi gerbang relevance utama.

## 6.4 Normal Result

Jika minimal satu sufficient match tersedia:

```text
state = MATCHED
```

- rank #1 -> top recommendation,
- next best candidates -> alternatives,
- tampilkan maksimal **2 alternatives** untuk prototype.

Tidak perlu menampilkan seluruh catalog pada screen hasil; user dapat lanjut ke Explore/Home kemudian.

---

# 7. Fallback Rule

Jika **tidak ada** `SUFFICIENT_MATCH`:

```text
state = FALLBACK
```

System tetap menampilkan pilihan terdekat.

Fallback sort priority:

```text
1. intentMatch true > false
2. activityOverlap 2 > 1 > 0
3. budgetFeasible true > false
4. duration EXACT > SHORTER_BUT_FEASIBLE > TOO_LONG
5. departureMatch true > false
6. groupCompatible true > false
7. rating
8. popularity
```

Ambil:

```text
1 top fallback
+ maksimal 2 alternatives
```

Jangan menunjukkan fake high match percentage pada fallback.

## 7.1 Fallback Copy — LOCKED

Gunakan copy source-backed:

> **Belum ada yang pas banget, tapi ini pilihan yang paling mendekati preferensimu.**

Boleh ada supporting copy singkat yang tidak mengarang promise, misalnya:

> Kamu tetap bisa melihat experience yang paling dekat dengan pilihanmu sekarang.

---

# 8. Unmatched Demand Logging — Adapter Behavior

Fallback harus memicu adapter/mock behavior:

```text
logUnmatchedDemand()
```

Minimal conceptual payload:

```text
UnmatchedDemandEvent
- quizSignalSnapshot
- timestamp
- reason = NO_SUFFICIENT_MATCH
```

Tidak perlu production analytics/database di Issue #8.

Do not expose logging internals pada UI traveler.

Data ini dipersiapkan agar future EO/Admin Insight dapat melihat kombinasi preference yang supply-nya belum cukup.

---

# 9. Recommendation Result Data Shape

Suggested UI-facing adapter result:

```text
RecommendationResult
- state: MATCHED | FALLBACK
- topRecommendation: RecommendationItem
- alternatives: RecommendationItem[] // max 2

RecommendationItem
- package
- reasons[] // max 3 user-facing reasons
- internalSignals // optional, not rendered directly
```

Do not send raw scoring/debug fields directly ke visual component unless needed for tests/debug.

---

# 10. Explanation Contract

Research on explainable recommendation supports showing concise reasons so users can understand **why** an item was recommended. Untuk JedaIn, explanation harus berasal dari actual matched signals, bukan copy generik yang sama untuk semua package.

## 10.1 Maximum Reasons

Tampilkan maksimal **3 alasan** pada top recommendation supaya tetap ringkas.

Priority reason selection:

```text
1. Current intent match
2. Preferred activity match (maksimal 1 label paling relevan)
3. Duration exact jika ada
4. Departure match
5. Budget feasible
6. Group compatibility
```

Gunakan tiga faktor pertama yang benar-benar valid untuk package tersebut.

## 10.2 Valid Examples

```text
Dekat dengan alam
Eksplorasi ringan
1 hari
```

atau human-readable sentence:

> Kamu mencari jeda dekat alam dengan eksplorasi ringan dan punya waktu sekitar satu hari.

UI boleh memakai chips + satu kalimat pendek, tetapi jangan text-heavy.

## 10.3 Invalid Examples

Jangan tampilkan:

```text
92% cocok
AI memilih ini untukmu
93% confidence
Pasti bikin kamu lebih tenang
Terbukti mengatasi burnout
```

Tidak ada calibrated probability, AI/ML, atau health outcome pada MVP.

---

# 11. Match Percentage Decision — LOCKED FOR MVP

**Tidak menampilkan numeric match percentage pada MVP.**

Reason:

- rule engine tidak menghasilkan calibrated probability,
- angka seperti `92%` memberi precision palsu,
- explanation berbasis faktor lebih mudah dipertanggungjawabkan kepada traveler/juri.

Gunakan label seperti:

```text
Pilihan utama untukmu
```

bukan numeric score.

---

# 12. Result UI Content Contract

## 12.1 MATCHED

Heading:

> **Ini jeda yang paling cocok buat kamu sekarang.**

Suggested short supporting copy:

> Berdasarkan pilihan terbarumu, ini experience yang paling relevan untuk dicoba lebih dulu.

Top recommendation:

- large experience visual,
- badge `Pilihan utama`,
- title,
- destination/location,
- duration,
- price per person / starting price consistent with package data,
- verification badge,
- section `Kenapa ini cocok?`,
- max 3 explanation factors.

Primary CTA:

```text
Lihat Experience
```

Destination:

```text
/packages/:packageId
```

Alternative section:

```text
Pilihan lain yang juga dekat
```

Show max 2 alternative cards.

Secondary action:

```text
Lanjut ke Home
```

Destination:

```text
/home
```

## 12.2 FALLBACK

Use locked fallback heading above.

Do not use:

- `Pilihan utama` as if it were a strong personalized match,
- numeric match percentage,
- language claiming package fully fits all preferences.

Use neutral label such as:

```text
Pilihan terdekat
```

## 12.3 LOADING

Suggested copy:

```text
Menyiapkan rekomendasi untukmu...
```

Use skeleton/visual placeholder and avoid layout jump.

## 12.4 ERROR

Suggested copy:

> **Rekomendasi belum bisa dimuat.**
>
> Jawaban kuismu tetap tersimpan. Coba lagi untuk melihat pilihanmu.

Primary CTA:

```text
Coba lagi
```

Do not send user back through the whole quiz for a recoverable recommendation error.

---

# 13. Mock Package Set for Competition Prototype

Issue #8 may use a small deterministic mock catalog so matching/fallback can be demonstrated without production backend.

These names are **fictional prototype data**, not claims about real businesses or verified live operators.

## P1 — `slow_green_day`

```text
Title: Sehari Pelan di Lereng Hijau
Location: Batu / Malang Raya
Status: LIVE
Verification: BASIC
Price: 275000
Duration: FULL_DAY
Departure: [MALANG]
Intents: [RECHARGE, NATURE, REFLECTION]
Activities: [NATURE_SCENERY, MINDFULNESS_RELAXATION, LIGHT_EXPLORATION]
Groups: [SOLO, PARTNER, FRIENDS]
Size bands: [ONE, TWO, THREE_TO_FOUR]
```

## P2 — `creative_village_halfday`

```text
Title: Ruang Kreatif Desa
Location: Malang Raya
Status: LIVE
Verification: BASIC
Price: 190000
Duration: HALF_DAY
Departure: [MALANG]
Intents: [NOVELTY, REFLECTION, SOCIAL]
Activities: [LOCAL_CULTURE, CREATIVE_WORKSHOP]
Groups: [PARTNER, FRIENDS, FAMILY]
Size bands: [TWO, THREE_TO_FOUR, FIVE_PLUS]
```

## P3 — `mindful_morning`

```text
Title: Pagi Hening & Mindful Reset
Location: Mojokerto Raya
Status: LIVE
Verification: BASIC
Price: 225000
Duration: HALF_DAY
Departure: [SURABAYA]
Intents: [RECHARGE, REFLECTION, NATURE]
Activities: [MINDFULNESS_RELAXATION, NATURE_SCENERY]
Groups: [SOLO, PARTNER, FRIENDS]
Size bands: [ONE, TWO, THREE_TO_FOUR]
```

## P4 — `light_mountain_explore`

```text
Title: Jelajah Santai Pegunungan
Location: Pasuruan Raya
Status: LIVE
Verification: BASIC
Price: 325000
Duration: FULL_DAY
Departure: [SURABAYA]
Intents: [NOVELTY, ACTIVE, NATURE]
Activities: [LIGHT_EXPLORATION, OUTDOOR_ACTIVE, NATURE_SCENERY]
Groups: [PARTNER, FRIENDS, FAMILY]
Size bands: [TWO, THREE_TO_FOUR, FIVE_PLUS]
```

## P5 — `weekend_nature_reset`

```text
Title: Weekend Nature Reset
Location: Mojokerto Raya
Status: LIVE
Verification: BASIC
Price: 475000
Duration: TWO_D_ONE_N
Departure: [SURABAYA]
Intents: [RECHARGE, NATURE, SOCIAL]
Activities: [NATURE_SCENERY, MINDFULNESS_RELAXATION, LIGHT_EXPLORATION]
Groups: [PARTNER, FRIENDS, FAMILY]
Size bands: [TWO, THREE_TO_FOUR, FIVE_PLUS]
```

Mock catalog boleh disesuaikan secara visual selama semantics signal di atas tetap tersedia dan tidak berubah menjadi claim tentang partner real.

---

# 14. Deterministic Example Scenarios

## Scenario A — Strong Malang Nature Match

Traveler:

```text
current_intent = NATURE
activities = [NATURE_SCENERY, LIGHT_EXPLORATION]
budget = AROUND_200_300K
duration = FULL_DAY
departure = MALANG
group = FRIENDS / THREE_TO_FOUR
```

Expected top candidate:

```text
Sehari Pelan di Lereng Hijau
```

Reasons dapat berupa:

```text
Dekat dengan alam
Eksplorasi ringan
1 hari
```

## Scenario B — Creative Half-Day

Traveler:

```text
current_intent = NOVELTY
activities = [CREATIVE_WORKSHOP, LOCAL_CULTURE]
budget = UP_TO_200K
duration = HALF_DAY
departure = MALANG
group = FRIENDS / THREE_TO_FOUR
```

Expected top candidate:

```text
Ruang Kreatif Desa
```

## Scenario C — No Sufficient Match / Fallback

Traveler example:

```text
current_intent = ACTIVE
activities = [OUTDOOR_ACTIVE]
budget = UP_TO_200K
duration = HALF_DAY
departure = OTHER
group = SOLO / ONE
```

Dengan mock catalog di atas, tidak ada package yang memenuhi seluruh sufficient-match rule.

Expected:

```text
state = FALLBACK
logUnmatchedDemand()
show nearest packages
no numeric match percentage
```

---

# 15. Scope Boundaries — Issue #8

## Implement

- adapter/mock recommendation boundary,
- centralized mock package catalog,
- deterministic rule-based matching,
- MATCHED state,
- FALLBACK state,
- LOADING state,
- ERROR/RETRY state,
- top recommendation,
- max 2 alternatives,
- human-readable explanation,
- unmatched-demand mock logging,
- navigation package detail + Home,
- tests.

## Do Not Implement

- ML/AI,
- personalization model training,
- production database/API,
- geocoding,
- route-distance calculation,
- transport inclusion/pricing,
- live session capacity filtering,
- payment,
- real partner claims,
- final global UI art-direction consolidation,
- Issue #9 Home implementation.

---

# 16. Visual Direction for Issue #8

Actual screen harus tetap memakai current JedaIn design foundation dan TASTE SKILL, tetapi final global UI polish dilakukan setelah core Traveler screens tersedia.

Recommendation Result sebaiknya terasa seperti **reward/reveal setelah quiz**, bukan dashboard atau list catalog biasa.

Prioritas visual:

- strong destination/experience visual hierarchy,
- satu top recommendation dominan,
- concise `Kenapa ini cocok?`,
- 2 alternatives lebih kecil,
- verification/trust visible tetapi tidak mendominasi,
- CTA jelas,
- mobile-first,
- calm nature + travel discovery.

Hindari:

- generic SaaS card wall,
- terlalu banyak text,
- random gradient/glow,
- fake AI badge,
- numeric match score,
- tiga card dengan hierarchy sama kuat.

---

# 17. Research Rationale

External research hanya menjadi pendukung desain, bukan menggantikan source-of-truth JedaIn.

1. Explainable recommendation literature menunjukkan bahwa memberikan alasan yang intuitif membantu user memahami `why` di balik recommendation dan dapat meningkatkan transparency, trustworthiness, dan satisfaction.  
   https://www.researchwithrutgers.org/en/publications/explainable-recommendation-a-survey-and-new-perspectives/

2. Tourism-specific research juga menekankan bahwa recommendation lebih mudah diterima ketika explanation-nya comprehensible dan sesuai common sense traveler.  
   https://link.springer.com/chapter/10.1007/978-3-031-58839-6_37

3. Choice-overload research menunjukkan efek banyak pilihan bergantung pada complexity dan decision difficulty. Untuk prototype JedaIn, menampilkan satu top choice + dua alternatives menjaga keputusan tetap fokus tanpa mengklaim bahwa tiga adalah angka universal terbaik.  
   https://doi.org/10.1016/j.jcps.2014.08.002

Karena itu MVP memilih **factor-based explanation + 1 top recommendation + max 2 alternatives**, bukan numeric score atau catalog panjang pada result screen.
