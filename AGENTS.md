# AGENTS.md — JedaIn

This repository is developed with human review and AI coding agents (including Codex). This file defines how agents must work in the repository.

## 1. Source-of-Truth Order

Before implementing any product/UI task, read documents in this order:

1. `PRD_HOLOGY_PROTOTYPE.md` — current competition-prototype requirements, canonical user flows, requirement IDs, semantic guards, and implementation status.
2. `PRD.md` — legacy/historical product reference. Use only where it does not conflict with the competition-prototype PRD.
3. `docs/SYSTEM_FLOW.md` — user/system flow, state transitions, and edge cases that remain relevant.
4. `docs/WIREFRAME_SPEC.md` — per-screen purpose, CTA, state, navigation.
5. `docs/UI_SPEC.md` — UI contracts, routes, component behavior, responsive rules.
6. `docs/DESIGN_SYSTEM.md` — visual tokens, shared components, copy/tone baseline.
7. The GitHub issue being implemented — task-specific scope and acceptance criteria.

If documents conflict, higher items in the list win. Do not silently reconcile conflicts. Report the conflict in the PR/issue.

JedaIn in this repository is currently a **competition prototype**, not a production application. Optimize for demo reliability, clarity, usability, and judge experience. Do not introduce production-grade infrastructure unless explicitly requested or clearly needed for the prototype.

## 2. Core Product Rules Agents Must Not Break

- Traveler guest/demo mode is allowed for the competition prototype and must not be removed merely because the legacy PRD disallowed it.
- New traveler or guest-demo traveler completes mandatory consent + onboarding quiz before the personalized protected flow.
- Latest quiz/current intent is the primary recommendation signal.
- Recommendation MVP is rule-based, not ML/AI.
- At most one active `PENDING_PAYMENT` per traveler.
- Pending payment blocks new checkout/payment creation, not browsing.
- Payment expiry is based on server-authoritative `expires_at`.
- Capacity reservation/release is a backend-authoritative operation.
- Package and Session are separate entities.
- Reviews are allowed only for `COMPLETED` bookings.
- Venue review and EO/Guide review are separate records.
- Traveler, Partner, and Admin are separate product surfaces, but may share identity/backend.
- Important prototype validation should live in shared domain/store boundaries where practical, not only in visual copy or one screen.
- Material edits to a LIVE package require a new draft/version and re-approval.

## 3. Scope Discipline

For every issue:

- identify the relevant `REQ-*` IDs from `PRD_HOLOGY_PROTOTYPE.md`,
- implement only the requested vertical slice,
- do not add unrelated features,
- do not rename canonical statuses,
- do not invent unapproved business rules,
- do not implement items marked `OPEN` as if they were decided,
- do not refactor unrelated modules unless necessary for correctness,
- if a dependency is missing, create the smallest clean abstraction required.

## 4. UI Implementation Rules

- Traveler: mobile-first.
- Partner/Admin: desktop-first.
- Reuse shared primitives and product components.
- Use centralized design tokens; do not scatter raw colors/spacing values.
- Include loading/error/empty/disabled states required by specs.
- Preserve accessibility: labels, keyboard support, focus, contrast, touch targets.
- Do not fabricate analytics, ratings, counts, trend percentages, or destination claims.
- Use mock fixtures only when backend is unavailable; clearly isolate them behind data adapters/interfaces.

## 5. Backend/API Boundary

This repository may intentionally use mock/in-memory architecture for the competition prototype.

If API/backend contracts are not defined:

- do not invent permanent endpoint structures as product truth,
- typed interfaces/adapters are preferred where they improve clarity,
- keep mock data separate from UI components,
- do not add a real backend/database/auth stack unless the task explicitly requires it,
- treat production-grade infrastructure as out of scope unless it materially improves the competition demo.

## 6. Testing Expectations

At minimum, test business-critical UI behavior introduced by the issue.

Examples:

- onboarding routing by state,
- pending-payment guard,
- payment countdown rendering from `expires_at`,
- disabled selection for FULL/CLOSED sessions,
- review eligibility,
- role/approval routing,
- builder validation presentation.

Do not pursue arbitrary coverage numbers at the cost of useful tests.

## 7. Pull Request / Completion Notes

Every implementation should report:

- what changed,
- screens/routes/components affected,
- source-of-truth docs used,
- tests run,
- known limitations,
- any unresolved product decision encountered.

## 8. Never Assume PENDING Decisions

Items marked `PENDING` / `DISCUSSION` in source documents must remain configurable or mocked honestly until the team resolves them.

Examples include:

- exact payment timeout,
- exact recommendation threshold/weights,
- margin bounds/commission values,
- exact cancellation/refund policy,
- some complaint resolution rules,
- final payment gateway.

## 9. Definition of Done

An issue is done only when:

- requested happy path works,
- required error/empty/loading states work,
- responsive behavior matches the relevant surface,
- canonical state names are respected,
- no new product assumptions were introduced,
- tests/checks pass,
- implementation remains consistent with the docs above,
- the competition demo remains stable and easy for judges/testers to understand.
