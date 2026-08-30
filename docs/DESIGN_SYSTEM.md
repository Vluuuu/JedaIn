# JedaIn — Design System

**Version:** 0.1  
**Date:** 30 Agustus 2026  
**Product Source of Truth:** [`../PRD.md`](../PRD.md)  
**UI Specification:** [`UI_SPEC.md`](UI_SPEC.md)  
**Status:** Initial Design Baseline — visual tokens can evolve, interaction semantics are stable

> Tujuan dokumen ini adalah memberi satu bahasa visual dan interaction baseline yang konsisten untuk Traveler, Partner, dan Admin. Nilai token di v0.1 adalah rekomendasi awal untuk MVP/prototype dan harus disimpan terpusat agar dapat diubah tanpa membongkar seluruh UI.

---

# 1. Brand Direction

JedaIn harus terasa:

- **calm** — membantu user merasa tidak terburu-buru,
- **trustworthy** — penting karena transaksi, destinasi, dan aktivitas offline,
- **contemporary** — relevan untuk Gen Z/Milenial tanpa terasa kekanak-kanakan,
- **local & human** — dekat dengan pengalaman lokal, bukan teknologi yang dingin,
- **clear** — keputusan booking dan status harus mudah dipahami,
- **experience-led** — imagery dan itinerary lebih penting daripada dekorasi abstrak.

JedaIn **bukan**:

- aplikasi spa mewah yang serba gold/black,
- marketplace diskon agresif,
- dashboard fintech yang terlalu corporate,
- aplikasi wisata penuh warna tanpa hierarchy,
- produk AI futuristik/neon.

### Visual keyword

`calm nature + clean digital product + trustworthy marketplace`

---

# 2. Surface Personality

Satu brand, tiga mode penggunaan.

## 2.1 Traveler

- warmer,
- photography-led,
- generous whitespace,
- rounded but not childish,
- concise copy,
- discovery-oriented.

## 2.2 Partner

- same brand palette,
- denser spacing than Traveler,
- stronger information hierarchy,
- charts/cards/forms,
- practical SaaS feel.

## 2.3 Admin

- most operational,
- neutral surfaces,
- status readability first,
- destructive/risk state clear,
- minimal decorative imagery.

Do not create three unrelated visual brands.

---

# 3. Color System

## 3.1 Primary Brand — Forest

Recommended baseline:

```text
forest-50   #F1F8F3
forest-100  #DCEFE1
forest-200  #B9DFC4
forest-300  #8BC79C
forest-400  #5DAE76
forest-500  #3A915B
forest-600  #2E7549
forest-700  #285E3D
forest-800  #234B34
forest-900  #1E3D2C
forest-950  #0F2117
```

Primary interactive token:

```text
brand-primary = forest-700
brand-primary-hover = forest-800
brand-primary-active = forest-900
brand-primary-soft = forest-50
```

Reason: natural/wellness association without becoming bright “eco green”.

## 3.2 Warm Accent — Sand

Use sparingly for warmth, highlighted information, featured experience.

```text
sand-50   #FBF8F0
sand-100  #F5EEDC
sand-200  #EADDBB
sand-300  #DCC58C
sand-400  #CBAA5F
sand-500  #B98F3E
sand-600  #9E7330
sand-700  #805826
sand-800  #684721
sand-900  #563B1E
```

Do not use sand as primary CTA color.

## 3.3 Neutral — Stone

```text
stone-0    #FFFFFF
stone-25   #FCFCFA
stone-50   #F8F8F5
stone-100  #F0F0EB
stone-200  #E3E3DC
stone-300  #CECEC5
stone-400  #A5A59B
stone-500  #77776F
stone-600  #5B5B55
stone-700  #41413D
stone-800  #2B2B28
stone-900  #1D1D1B
stone-950  #111110
```

Recommended:

```text
page-bg = stone-25
surface = stone-0
surface-subtle = stone-50
border = stone-200
text-primary = stone-900
text-secondary = stone-600
text-muted = stone-500
```

## 3.4 Semantic Colors

### Success

```text
success-bg = #EEF8F1
success-border = #B7E2C1
success-text = #24613A
success-solid = #347A49
```

### Warning

```text
warning-bg = #FFF8E7
warning-border = #F0D795
warning-text = #775712
warning-solid = #B98717
```

### Danger

```text
danger-bg = #FFF1F0
danger-border = #F2B8B5
danger-text = #8B2D28
danger-solid = #B43C35
```

### Info

```text
info-bg = #EFF6FF
info-border = #B9D5F6
info-text = #285C91
info-solid = #3E78B2
```

### Rule

Never convey semantic status by color alone. Pair with text/icon/shape.

---

# 4. Typography

## 4.1 Font recommendation

Use a modern, highly readable sans-serif available through normal web distribution.

Recommended preference order:

```text
Inter
Geist
system-ui
sans-serif
```

Do not use decorative display fonts for body UI.

## 4.2 Type Scale

Recommended tokens:

```text
display-lg   48 / 56 / 700
heading-xl   36 / 44 / 700
heading-lg   30 / 38 / 700
heading-md   24 / 32 / 650
heading-sm   20 / 28 / 650
body-lg      18 / 28 / 400
body-md      16 / 24 / 400
body-sm      14 / 20 / 400
label-md     14 / 20 / 600
label-sm     12 / 16 / 600
caption      12 / 16 / 400
```

Format: `font-size / line-height / font-weight`.

## 4.3 Traveler usage

- landing hero: `display-lg` desktop, `heading-xl` mobile,
- page title: `heading-lg`/`heading-md`,
- card title: `heading-sm` or semibold body,
- supporting text: `body-md`,
- metadata: `body-sm`.

## 4.4 Partner/Admin usage

- dashboard page title: `heading-md`,
- section heading: `heading-sm`,
- table: `body-sm`,
- metric value: `heading-lg/md` depending density.

---

# 5. Spacing System

Base unit: `4px`.

Recommended tokens:

```text
space-0   0
space-1   4
space-2   8
space-3   12
space-4   16
space-5   20
space-6   24
space-8   32
space-10  40
space-12  48
space-16  64
space-20  80
space-24  96
```

Rules:

- mobile page horizontal padding: 16 px,
- tablet: 24 px,
- desktop content: 32 px typical,
- avoid arbitrary values such as 17/29/37 unless layout genuinely requires it.

---

# 6. Radius

```text
radius-sm   8px
radius-md   12px
radius-lg   16px
radius-xl   24px
radius-pill 999px
```

Usage:

- input/button: 12 px,
- standard card: 16 px,
- large experience hero: 24 px,
- chips/badges: pill or 8 px depending shape.

Avoid excessive “bubble UI”.

---

# 7. Shadows & Borders

Prefer borders + subtle elevation rather than heavy shadows.

```text
shadow-xs: 0 1px 2px rgba(17,17,16,.05)
shadow-sm: 0 2px 8px rgba(17,17,16,.07)
shadow-md: 0 8px 24px rgba(17,17,16,.10)
```

Usage:

- standard card: border + optional `shadow-xs`,
- floating dropdown/dialog: `shadow-md`,
- sticky mobile CTA: top border/shadow-sm,
- dashboard: mostly border, minimal shadow.

---

# 8. Iconography

Recommended style:

- outline icons,
- consistent 1.75–2 px stroke,
- rounded line joins,
- 16/20/24 px sizes.

Do not mix multiple icon libraries casually.

Icons never replace critical labels in complex actions.

---

# 9. Photography & Imagery

Traveler UI should use real or realistic destination/experience photography.

Preferred:

- nature,
- local activities,
- calm human interaction,
- authentic group scale,
- daylight/natural lighting,
- destination context visible.

Avoid:

- generic spa stock photos,
- overly staged influencer imagery,
- heavy text embedded in images,
- AI-looking fantasy landscapes for factual package cards,
- inconsistent image aspect ratios.

Recommended aspect ratios:

```text
Package card: 4:3
Horizontal featured card: 16:10
Hero/detail: 16:9 or 3:2
Destination thumbnail: 4:3
Avatar/logo: 1:1
```

Always provide neutral placeholder/fallback.

---

# 10. Button System

## 10.1 Sizes

```text
sm: 32px min height
md: 40px min height
lg: 48px min height
mobile primary: prefer 48px
```

Touch target should be >= 44x44 px even when visual control smaller.

## 10.2 Variants

### Primary

- forest-700 background,
- white text,
- forest-800 hover,
- visible focus ring.

### Secondary

- white/surface background,
- stone border,
- primary text.

### Ghost

- transparent,
- no border,
- subtle hover background.

### Danger

- danger solid or danger outline depending severity.

### Disabled

- reduced contrast but still readable,
- cursor/aria disabled,
- no hover effect.

## 10.3 Copy rule

Use action verbs:

```text
Pilih Jadwal
Lanjut Checkout
Bayar Sekarang
Lanjutkan Pembayaran
Submit untuk Review
Perbaiki Pengajuan
```

Avoid generic `OK` when a specific action exists.

---

# 11. Form System

## 11.1 Input anatomy

```text
Label
Optional helper
Input
Error/help text
```

Rules:

- placeholder is not label,
- required/optional state explicit,
- error appears near field,
- preserve input after recoverable error,
- disabled/read-only visually distinct.

## 11.2 Form density

Traveler:

- larger controls,
- fewer fields per screen,
- one-question quiz flow.

Partner/Admin:

- more compact,
- grouped sections,
- stepper for long application/build flows.

---

# 12. Badge & Status System

## 12.1 Verification Badge

Use forest/success semantic style.

Examples:

```text
Terverifikasi Dasar
Terverifikasi Plus
Siap sebagai Guide
Certified Guide
```

Badges require tooltip/help text when terminology may be unclear to traveler.

## 12.2 Workflow Status Badge

Neutral/info/warning/danger semantic mapping:

```text
DRAFT              neutral
SUBMITTED          info
PENDING_REVIEW     warning
APPROVED           success
LIVE               success
REJECTED           danger
AUTO_REJECTED      danger
FULL               warning
CANCELLED          neutral/danger depending context
EXPIRED            neutral/warning
REFUNDED           info
NEEDS_ADMIN_RESOLUTION warning/danger
```

Do not hardcode colors per page. Use centralized status mapping.

---

# 13. Card System

## 13.1 `PackageCard`

Minimum anatomy:

1. image
2. match badge optional
3. package title
4. location + duration
5. price
6. verification badge
7. rating if available

Variants:

```text
vertical
horizontal
compact
featured
```

Do not create different markup for every discovery section if the same information works.

## 13.2 `PendingPaymentBanner`

Semantic: warning/critical but not danger.

Must include:

- payment context,
- countdown,
- CTA.

It should be more prominent than promotional content.

## 13.3 `UpcomingTripCard`

Calm/info style, not warning.

Shows operational date/context + CTA.

## 13.4 Dashboard Metric Card

Minimal:

- label,
- value,
- optional change only if comparison data exists.

Do not generate fake percentage changes.

---

# 14. Navigation System

## 14.1 Traveler Bottom Nav

Tabs:

```text
Home
Explore
My Trips
Profile
```

Rules:

- 4 items only for MVP,
- active state uses icon + label emphasis,
- no central oversized FAB,
- hide during payment/onboarding when distraction is harmful.

## 14.2 Partner/Admin Sidebar

Recommended width:

```text
expanded: 240–264px
collapsed: 72–80px
```

Group related items; avoid >10 top-level entries.

---

# 15. Stepper

Use in:

- onboarding quiz progress,
- EO application,
- destination application,
- Trip Builder.

### Traveler quiz

Prefer progress indicator + current step count, not desktop horizontal five-label stepper.

### Partner wizard

Horizontal or vertical labeled stepper acceptable.

Completed/current/upcoming states must be distinguishable without color alone.

---

# 16. Data Visualization

Insights should be understandable without specialist analytics knowledge.

Preferred MVP charts:

- horizontal bar,
- vertical bar,
- donut only for simple small category set,
- ranked list,
- metric cards.

Avoid:

- 3D charts,
- radar charts unless strong reason,
- complex multi-axis chart,
- decorative charts with no decision value.

All charts require:

- title,
- timeframe,
- accessible value representation,
- empty state if insufficient data.

---

# 17. Tables

Partner/Admin tables:

- sticky header optional for long data,
- readable row height 44–52 px,
- row primary action at right,
- status represented with standardized badge,
- mobile/tablet can switch to cards only when necessary.

Do not make every cell clickable.

---

# 18. Dialogs & Destructive Actions

Confirmation required for:

- cancel pending booking,
- reject application/submission,
- refund,
- downgrade,
- suspend,
- destructive package/session action.

Dialog must state:

1. action,
2. affected entity,
3. consequence,
4. primary destructive/non-destructive CTA,
5. cancel/back.

Never use vague `Are you sure?` alone.

---

# 19. Toast & Inline Feedback

Use toast for:

- lightweight success,
- non-blocking update,
- copied value,
- save confirmation.

Use inline/block state for:

- validation,
- payment failure,
- application rejection,
- critical operational status.

Critical information must not disappear only as toast.

---

# 20. Loading System

## Skeleton

Use for:

- PackageCard list,
- dashboard metrics,
- package detail section,
- insights.

## Inline spinner/progress

Use inside action button for submit.

## Full transition state

Use only when transition genuinely needs user to wait, e.g. final quiz recommendation generation.

Avoid artificial loading delays.

---

# 21. Empty State Language

Tone:

- direct,
- useful,
- not blamey,
- next-action oriented.

Examples:

```text
Belum ada trip di sini.
Cari pengalaman yang cocok untuk jedamu.
[Explore Jeda]
```

```text
Belum ada data insight yang cukup.
Insight akan muncul setelah preference traveler mulai terkumpul.
```

---

# 22. Copy & Tone

JedaIn copy should be:

- Bahasa Indonesia natural,
- concise,
- friendly but not slang-heavy,
- calming without sounding therapeutic/medical,
- transparent for money/status.

Preferred:

```text
Mau jeda seperti apa hari ini?
Pilihan untuk kamu
Kenapa cocok?
Lanjutkan pembayaran
Pengajuan sedang ditinjau
```

Avoid:

```text
Best deal!!!
Buruan sebelum kehabisan!!!
AI kami tahu apa yang kamu butuhkan
Healing dijamin berhasil
```

Do not make mental-health treatment claims.

---

# 23. Responsive Density

## Traveler mobile

- 16 px outer padding,
- 12–16 px card inner spacing,
- 16–24 px vertical section gaps,
- card horizontal carousels may extend to viewport edge with consistent inset.

## Traveler desktop

- increase whitespace,
- do not simply stretch mobile card to full width,
- use grid and max-width container.

## Partner/Admin desktop

- 24–32 px page padding,
- 16–24 px card padding,
- compact form/table controls where readability remains good.

---

# 24. Focus & Accessibility Tokens

Recommended focus ring:

```text
2px solid forest-500
2px offset
```

Requirements:

- focus visible on all interactive components,
- do not remove outline without replacement,
- minimum contrast target WCAG AA,
- status icons paired with text,
- semantic HTML first.

---

# 25. Motion Tokens

Recommended:

```text
motion-fast    120ms
motion-normal  180ms
motion-slow    280ms
```

Easing:

```text
standard: cubic-bezier(.2,.8,.2,1)
```

Use for:

- hover,
- accordion,
- drawer,
- step transition.

Respect reduced motion.

---

# 26. Recommended CSS Token Shape

Implementation may use CSS variables/Tailwind tokens. Example conceptual naming:

```css
--color-bg-page
--color-bg-surface
--color-text-primary
--color-text-secondary
--color-border-default
--color-brand-primary
--color-brand-primary-hover
--color-success
--color-warning
--color-danger

--space-1
--space-2
--space-3
--space-4
--space-6
--space-8

--radius-sm
--radius-md
--radius-lg
--radius-xl

--shadow-xs
--shadow-sm
--shadow-md
```

Do not scatter raw hex values through page components.

---

# 27. Component Acceptance Checklist

Before a shared component is considered ready:

- default state,
- hover/focus/active,
- disabled where applicable,
- loading where applicable,
- error where applicable,
- responsive behavior,
- keyboard behavior,
- accessible label/role,
- no raw business-state branching duplicated across pages.

---

# 28. Initial Visual Decisions — LOCKED FOR MVP

The following are accepted as baseline unless the team explicitly changes them:

1. Traveler is light-theme first.
2. Primary brand direction uses deep natural green + warm neutral background.
3. Traveler uses rounded cards but not overly bubbly UI.
4. Partner/Admin retain same brand but use denser neutral surfaces.
5. Primary CTA uses forest green.
6. Semantic warning/danger colors are distinct from brand green.
7. Traveler navigation has exactly 4 main tabs for MVP.
8. Imagery is destination/experience-led, not abstract AI illustration-led.
9. Typography uses modern readable sans-serif.
10. All design values live in centralized tokens.

---

# 29. Still Open / Can Evolve

These visual choices can change without affecting product flow:

- final logo treatment,
- exact font family,
- exact green/sand shade after brand review,
- illustration style,
- detailed photography art direction,
- dark mode roadmap,
- advanced chart styling.

These should **not** block initial Traveler UI implementation.

---

# 30. Agent Rule

Codex/AI agent must treat this document as the design-token and visual-behavior baseline. If a requested issue conflicts with this file, the issue must explicitly state the intended override. The agent should prefer consistency over introducing a new visual convention for one screen.