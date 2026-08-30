# AGENTS.md — JedaIn

This repository is developed with human review and AI coding agents (including Codex). This file defines how agents must work in the repository.

## 1. Source-of-Truth Order

Before implementing any product/UI task, read documents in this order:

1. `PRD.md` — product/business requirements and canonical product rules.
2. `docs/SYSTEM_FLOW.md` — user/system flow, state transitions, edge cases.
3. `docs/WIREFRAME_SPEC.md` — per-screen purpose, CTA, state, navigation.
4. `docs/UI_SPEC.md` — UI contracts, routes, component behavior, responsive rules.
5. `docs/DESIGN_SYSTEM.md` — visual tokens, shared components, copy/tone baseline.
6. The GitHub issue being implemented — task-specific scope and acceptance criteria.

If documents conflict, higher items in the list win. Do not silently reconcile conflicts. Report the conflict in the PR/issue.

## 2. Core Product Rules Agents Must Not Break

- No traveler guest mode.
- New traveler registers first, then completes mandatory consent + onboarding quiz.
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
- Business-critical validation must not exist only in the frontend.
- Material edits to a LIVE package require a new draft/version and re-approval.

## 3. Scope Discipline

For every issue:

- implement only the requested vertical slice,
- do not add unrelated features,
- do not rename canonical statuses,
- do not invent unapproved business rules,
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

If API contracts are not yet defined:

- do not invent permanent endpoint structures as product truth,
- create typed interfaces/adapters that can later be wired to the backend,
- keep mock data separate from UI components,
- keep server-authoritative rules represented as server-returned state rather than recreated as frontend truth.

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
- implementation remains consistent with the docs above.
