# JedaIn — Traveler Core Visual Direction

**Version:** 1.0  
**Date:** 31 Agustus 2026  
**Status:** Visual Consolidation Contract for Competition MVP  
**Applies to:** Traveler Core `Login → Consent → Quiz → Recommendation → Home`

> Dokumen ini mengunci arah visual untuk pass konsolidasi UI Traveler setelah core flow T02–T06 selesai. Tujuannya bukan mengubah business flow, tetapi membuat JedaIn terasa seperti produk travel/wellness yang hidup, khas, dan layak dipresentasikan di kompetisi — bukan frontend generik hasil template/AI.

---

# 1. Scope & Preservation Rules

## 1.1 Screens in this pass

```text
/login
/onboarding/consent
/onboarding/quiz
/onboarding/result
/home
```

## 1.2 What this pass MAY change

- visual hierarchy,
- typography treatment,
- spacing rhythm,
- surface/background treatment,
- image treatment,
- card proportions,
- iconography consistency,
- button visual treatment,
- progress presentation,
- responsive composition,
- micro-interactions,
- empty/loading/error presentation,
- reusable visual variants,
- visual-only design tokens where centralized.

## 1.3 What this pass MUST NOT change

- business rules,
- auth semantics,
- onboarding state machine,
- quiz wording/options/data contract,
- recommendation rules/ranking/fallback semantics,
- Home module order/state behavior,
- routes/navigation destinations,
- pending-payment semantics,
- transport decisions,
- package/session distinction,
- mock adapter business behavior,
- acceptance-tested interaction contracts.

If visual polish requires changing business behavior, stop and treat it as a separate product decision.

---

# 2. Source Priority

For product/interaction semantics:

```text
PRD.md
> SYSTEM_FLOW.md
> WIREFRAME_SPEC.md
> UI_SPEC.md
> QUIZ_CONTENT_CONTRACT.md / RECOMMENDATION_CONTRACT.md / HOME_CONTRACT.md
> DESIGN_SYSTEM.md interaction/accessibility rules
> TRAVELER_VISUAL_DIRECTION.md
> issue implementation notes
> implementation
```

For **visual-only art direction**, this document may refine the initial visual-token recommendations in `DESIGN_SYSTEM.md` because that document explicitly marks its visual tokens as an evolvable MVP baseline.

Any token change must remain centralized. Do not scatter raw colors, radii, or shadows across feature CSS.

---

# 3. Visual North Star

JedaIn Traveler should communicate:

```text
nature
+ wellness
+ travel discovery
+ curated experience
+ trustworthy marketplace
+ personal recommendation
```

The product should feel:

- calm, but not empty,
- warm, but not childish,
- modern, but not futurist/AI-styled,
- visual, but not decorative for decoration's sake,
- premium enough for trust, but not luxury spa/gold-black,
- local and human, not corporate SaaS,
- personal without making medical/mental-health promises.

Desired first impression:

> “Ini aplikasi buat menemukan experience wellness/travel yang dikurasi buat aku.”

Not:

> “Ini dashboard SaaS warna hijau.”

---

# 4. Anti-Slop Rules

Avoid all of these as default patterns:

- white page + repeated identical white cards,
- every section boxed inside a card,
- random glassmorphism,
- purple/blue AI gradients,
- neon glows,
- oversized blob decoration without product meaning,
- giant empty hero with tiny content,
- overuse of pills/chips for everything,
- excessive rounded “bubble UI”,
- decorative charts/statistics with invented data,
- fake AI labels/confidence/match percentages,
- stock wellness cliché imagery dominated by spa towels/candles,
- identical forest gradient used as every package image,
- dense text paragraphs on consumer discovery screens,
- three equally dominant recommendation cards,
- excessive shadows,
- visual novelty that damages accessibility or clarity.

Every visual element should support at least one of:

```text
orientation
choice
trust
personal relevance
experience imagery
transaction status
progress
```

---

# 5. Reference Direction

References are pattern sources, not templates to copy.

## 5.1 Primary JedaIn reference pack supplied by the team

1. Travel & Hotel Booking App UI Design — Modern Mobile UX  
   https://id.pinterest.com/pin/1121959326099057486/

2. Travel App Exploration Web Design Concept  
   https://id.pinterest.com/pin/1035687245565949887/

3. Navel | Nature Travel Booking App | CIPHERSLAB  
   https://id.pinterest.com/pin/1044694444808222279/

4. GoTour — Tour & Travel App Figma UI Kit  
   https://id.pinterest.com/pin/1122170432124277065/

5. Travel Mobile App | Fiverr Solutions  
   https://id.pinterest.com/pin/1087689747534253642/

6. Travelling UI App — SHEESHPAL KOTWAL  
   https://id.pinterest.com/pin/2744449768039559/

7. Mobile App UI/UX Inspiration  
   https://id.pinterest.com/pin/1125337025669241425/

Use these for:

- mobile composition,
- image-led cards,
- destination discovery,
- section rhythm,
- visual depth,
- modern travel-app feel.

Do not clone a single reference screen.

## 5.2 Supplemental real-product references

### Airbnb Experiences
Use as reference for:

- activity/experience-first discovery,
- photography-led cards,
- concise metadata hierarchy,
- local experience positioning,
- trust + booking context without over-decoration.

Reference:
https://www.airbnb.com/indonesia/things-to-do

### Headspace
Use selectively for:

- calm visual pacing,
- friendly but clear hierarchy,
- low-friction personalized content,
- expressive visual moments without turning JedaIn into a meditation app.

Reference:
https://www.headspace.com/app

### Calm
Use selectively for:

- immersive imagery,
- calm content discovery,
- clear separation between primary personalized content and broader discovery.

Reference:
https://www.calm.com/

## 5.3 Taste Skill

Before implementation and again before finalizing:

**INVOKE TASTE SKILL.**

Use its audit-first/redesign behavior for the existing frontend.

Taste Skill is a visual-quality framework only. It cannot override source-of-truth product behavior.

Reference:
https://www.tasteskill.dev/

---

# 6. Global Composition Language

## 6.1 Page background

Prefer warm neutral/off-white page background instead of pure white everywhere.

Use existing centralized Stone/Sand/Forest tokens before inventing new color families.

Recommended visual relationship:

```text
page background -> warm stone / soft sand tint
primary surface -> clean light surface
personalized highlight -> forest/sage-soft treatment
transaction status -> semantic surface
imagery -> primary source of visual richness
```

Do not make the entire application green.

## 6.2 Surface strategy

Use three levels instead of “card for everything”:

1. **Open page sections** — typography + content directly on page.
2. **Soft grouped surfaces** — subtle tinted background/border for related information.
3. **Elevated focal cards** — only for things that truly need dominance, e.g. recommendation hero.

## 6.3 Shape language

Keep rounded geometry but controlled:

- controls: medium radius,
- standard cards: medium/large radius,
- hero image cards: larger radius,
- chips: pill only where semantically appropriate.

Avoid every container being radius-24.

## 6.4 Elevation

Prefer:

- borders,
- image contrast,
- spacing,
- tonal surfaces,

before shadows.

Use stronger shadow only for actual floating layers/dialogs.

---

# 7. Typography Direction

Keep a highly readable sans-serif stack. Do not add a decorative font dependency just to look different.

Visual personality comes from:

- stronger size contrast,
- tighter heading line-height,
- restrained use of heavier weight,
- metadata with smaller contrast,
- intentional whitespace,
- short copy blocks.

Traveler hierarchy target:

```text
Hero / Result payoff
  strong, compact, visually memorable

Screen title / question
  dominant but not huge

Section title
  clear, short, repeated rhythm

Card title
  medium emphasis

Metadata
  compact and quiet
```

Avoid pages where heading, body, metadata, and buttons all feel like the same size/weight.

---

# 8. Image & Visual Asset Direction

Imagery is a major part of the final JedaIn Traveler identity.

Preferred visual content:

- Indonesian nature context,
- hills/forest/rice fields/village/open-air environments,
- local workshops/cultural activity,
- small-group human interaction,
- calm daylight,
- authentic environmental context.

Avoid:

- fantasy AI landscapes presented as real destinations,
- influencer-like glamour photography,
- generic corporate stock,
- repetitive spa imagery,
- fake partner logos.

## 8.1 Image usage

```text
Login visual              -> atmospheric destination/experience crop
Quiz                       -> lightweight contextual visual accents, not full photo every step
Recommendation hero        -> strongest image moment in onboarding
Home personalized hero     -> strong image, but slightly less cinematic than Result
Popular package card       -> 4:3 or 16:10 image-led
Destination tile           -> compact image-led tile
```

## 8.2 Prototype image policy

If production images are unavailable:

- keep imagery source centralized,
- use clearly prototype-safe/local assets,
- provide consistent fallback treatment,
- do not use the same generic gradient for all packages.

Do not embed external hotlinked production assets without a deliberate licensing/source decision.

---

# 9. Screen-Specific Direction

# 9.1 Login `/login`

Goal: welcoming entry to JedaIn, not a generic auth form.

Mobile:

- brand mark compact,
- one meaningful visual/illustrative destination moment,
- concise value statement,
- auth actions clearly stacked,
- legal/partner links visually secondary.

Desktop:

- use a purposeful split/asymmetric composition,
- one side visual/brand story,
- one side compact auth surface,
- do not stretch the auth form across the full page.

Avoid:

- giant centered white login card floating in empty space,
- huge logo,
- too much marketing copy.

# 9.2 Consent `/onboarding/consent`

Goal: make privacy/consent feel clear and trustworthy without looking like a legal wall of text.

Direction:

- calm editorial layout,
- three purpose items with meaningful icons/visual markers,
- compact privacy detail,
- consent checkbox visually clear,
- CTA hierarchy obvious,
- preserve distraction-free onboarding context.

Avoid making each purpose bullet a heavy card.

# 9.3 Quiz `/onboarding/quiz`

Goal: make six questions feel like personalized discovery, not a form/survey.

Direction:

- strong single-question focus,
- progress visible but quiet,
- expressive option cards for Q1/Q2/Q6,
- cleaner compact choice cards for budget/duration,
- conditional fields feel integrated, not like a second form,
- selected states visually satisfying and unmistakable,
- small contextual icons/illustrative motifs allowed.

The UI should answer:

> “Aku sedang membentuk jeda yang cocok buatku.”

Not:

> “Aku sedang mengisi Google Form.”

# 9.4 Recommendation `/onboarding/result`

Goal: strongest payoff moment after Quiz.

Direction:

- cinematic/top-heavy reveal,
- one dominant recommendation hero,
- experience image receives real visual space,
- package info compact and readable,
- `Kenapa ini cocok?` feels integrated, not a separate analytics box,
- alternatives clearly secondary,
- matched vs fallback visually different but within same brand,
- CTA remains obvious.

Do not show numerical match percentage.

# 9.5 Home `/home`

Goal: feel like a real discovery product with personalization and status.

Direction:

- greeting compact,
- pending payment/upcoming trip clearly distinct from discovery,
- personalized recommendation is first discovery focal point,
- Search should be easy to find but not dominate,
- Mood section can use richer icon/chip treatment,
- Popular / Departure / Destinations should not all use identical card dimensions,
- horizontal mobile rows should feel intentionally cropped/scrollable,
- desktop should expand into a composed marketplace layout, not a narrow phone column centered on screen.

The page should have visible section rhythm:

```text
personal status
↓
personalized discovery
↓
intent/mood exploration
↓
marketplace discovery
↓
trusted destination discovery
```

---

# 10. Component Consolidation Targets

During this pass, inspect whether current visual duplication can be reduced without changing business behavior.

Preferred reusable variants:

```text
PackageCard
  compact
  discovery
  featured

VerificationBadge
  BASIC
  PLUS

StatusBanner
  pending-payment
  upcoming-trip/info

ChoiceCard
  single
  multi
  compact
  expressive

SectionHeader
  title
  optional secondary action
```

Do not force one component variant to solve every layout if it creates awkward composition.

Do not introduce duplicate business logic while consolidating visuals.

---

# 11. Interaction & Motion

Motion should support orientation, not perform for its own sake.

Recommended:

- button/choice feedback: quick,
- card hover/focus on desktop: subtle,
- quiz step transition: short directional fade/slide,
- recommendation reveal: restrained entrance,
- skeleton-to-content: no dramatic animation,
- bottom-nav active transition: minimal.

Respect `prefers-reduced-motion`.

Avoid:

- bouncing cards,
- continuous floating objects,
- parallax for basic app screens,
- delayed animations that slow the demo.

---

# 12. Responsive Direction

Primary Traveler viewport:

```text
390px
```

Desktop validation:

```text
1440px
```

## Mobile

- 16px primary page gutters unless screen-specific composition needs edge-to-edge imagery,
- readable text width,
- 44px+ action targets,
- intentional horizontal card scroll,
- bottom nav must not cover content,
- avoid stacking too many nested surfaces.

## Desktop

- use available width intentionally,
- image/content split where useful,
- cards may become grid,
- preserve hierarchy rather than merely increasing column count,
- onboarding can remain centered but should not look like a tiny mobile card floating in empty space.

---

# 13. Accessibility Guardrails

Visual polish cannot regress:

- semantic headings,
- keyboard navigation,
- visible focus,
- sufficient contrast,
- error/status text beyond color,
- accessible labels,
- image alt strategy,
- reduced motion,
- touch target size,
- screen-reader-readable progress/state.

If a visual effect conflicts with readability/accessibility, readability wins.

---

# 14. Implementation Process — Audit First

Before changing code:

1. invoke **TASTE SKILL**,
2. run a visual audit of all five screens at 390px and 1440px,
3. identify inconsistencies and generic/template patterns,
4. define the shared visual language first,
5. update centralized tokens/variants where necessary,
6. polish screens in flow order,
7. perform a final cross-screen consistency pass.

Do not redesign one screen in isolation and then force the others to catch up later.

Recommended implementation order:

```text
A. global token/component refinement
B. Login
C. Consent
D. Quiz
E. Recommendation
F. Home
G. cross-screen polish
```

Home and Recommendation should receive the strongest imagery treatment.

---

# 15. Visual Acceptance Criteria

The pass is complete only when:

- [ ] all existing business/flow tests still pass,
- [ ] Login, Consent, Quiz, Recommendation, Home clearly feel like one product,
- [ ] UI no longer reads as generic white-card SaaS,
- [ ] imagery hierarchy is meaningful and non-repetitive,
- [ ] Quiz feels like personalized discovery rather than a survey,
- [ ] Recommendation feels like a payoff/reveal,
- [ ] Home feels like a real travel/wellness discovery product,
- [ ] matched/fallback semantics remain intact,
- [ ] transactional status remains visually clear,
- [ ] mobile 390px is strong and comfortable,
- [ ] desktop 1440px uses space intentionally,
- [ ] loading/error/empty states visually belong to the same system,
- [ ] no new fake statistics/AI claims/transport promises are introduced,
- [ ] no accessibility regression,
- [ ] no console errors/warnings,
- [ ] Taste Skill pre-flight/audit is completed before final report.

---

# 16. Out of Scope for This Pass

Do not implement:

- Explore/T07 business functionality,
- Package Detail/T08,
- booking/payment business screens,
- Partner/Admin visual redesign,
- production image CMS,
- new recommendation logic,
- analytics,
- backend changes,
- brand/logo redesign unless a tiny visual adjustment is required to make existing mark consistent.

This pass is specifically the **Traveler Core visual consolidation gate before T07**.
