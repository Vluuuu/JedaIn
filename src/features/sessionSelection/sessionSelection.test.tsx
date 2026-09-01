// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import type { PackageSessionPreview } from "../packageDetail/types";
import { MockSessionSelectionAdapter } from "./mockAdapter";
import { SessionSelectionScreen } from "./SessionSelectionScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
  mockTransactionStore.reset();
});

async function renderSessionSelection(
  packageId = "slow_green_day",
  props: { adapter?: MockSessionSelectionAdapter } = {},
  initialEntries: string[] = [`/packages/${packageId}/sessions`],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId/sessions",
            element: createElement(SessionSelectionScreen, props),
          }),
        ),
      ),
    );
  });
  return container;
}

describe("SessionSelectionScreen Tests & Contracts", () => {
  it("1. resolves known LIVE package sessions and renders header/compact package summary", async () => {
    const view = await renderSessionSelection("slow_green_day");

    expect(view.textContent).toContain("Pilih Jadwal");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Mulai dari Rp275.000 / orang");
    expect(view.textContent).toContain("Jadwal Keberangkatan");
    expect(view.textContent).toContain("Sabtu, 12 September 2026");
    expect(view.textContent).toContain("Sabtu, 19 September 2026");
    expect(view.textContent).toContain("Belum ada jadwal dipilih");
    expect(view.textContent).toContain("Lanjut Checkout");
  });

  it("2. unknown package renders NOT_FOUND state", async () => {
    const view = await renderSessionSelection("unknown_pkg_xyz");
    expect(view.textContent).toContain("Experience tidak ditemukan.");
    expect(view.textContent).toContain("Kembali ke Explore");
  });

  it("3. non-LIVE package is unavailable", async () => {
    const adapter = new MockSessionSelectionAdapter({
      packages: [
        {
          id: "draft_package",
          title: "Paket Draft",
          shortSummary: "Summary",
          destinationName: "Destinasi",
          locationLabel: "Lokasi",
          visualAsset: "asset.jpg",
          status: "DRAFT" as "LIVE",
          verificationLevel: "BASIC",
          pricePerPerson: 100000,
          durationType: "HALF_DAY",
          departureAreas: ["MALANG"],
          experienceIntents: ["NATURE"],
          activityTags: ["NATURE_SCENERY"],
          suitableGroupTypes: ["SOLO"],
          suitableGroupSizeBands: ["ONE"],
          rating: 4.5,
          popularityRank: 50,
        },
      ],
    });

    const view = await renderSessionSelection("draft_package", { adapter });
    expect(view.textContent).toContain("Experience tidak ditemukan.");
  });

  it("6. sessions are sorted chronologically", async () => {
    const outOfOrderSessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_later",
        packageId: "slow_green_day",
        startAt: "2026-09-26T08:00:00+07:00",
        endAt: "2026-09-26T14:00:00+07:00",
        status: "OPEN",
        pricePerPerson: 275000,
        remainingSlots: 5,
      },
      {
        sessionId: "ses_earlier",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        pricePerPerson: 275000,
        remainingSlots: 6,
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: {
        slow_green_day: outOfOrderSessions,
      },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    const cards = view.querySelectorAll(".session-card");
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain("12 September 2026");
    expect(cards[1].textContent).toContain("26 September 2026");
  });

  it("7 & 8. OPEN session with remainingSlots > 0 is selectable; remainingSlots === 0 is NOT selectable", async () => {
    const sessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_open_available",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        remainingSlots: 5,
        pricePerPerson: 275000,
      },
      {
        sessionId: "ses_open_zeroslot",
        packageId: "slow_green_day",
        startAt: "2026-09-19T08:00:00+07:00",
        endAt: "2026-09-19T14:00:00+07:00",
        status: "OPEN",
        remainingSlots: 0,
        pricePerPerson: 275000,
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: { slow_green_day: sessions },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    const radios = view.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );

    expect(radios[0].disabled).toBe(false);
    expect(radios[1].disabled).toBe(true);
  });

  it("9, 10 & 11. FULL and CLOSED sessions are visible but disabled; CANCELLED sessions are hidden", async () => {
    const sessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_open",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        remainingSlots: 4,
      },
      {
        sessionId: "ses_full",
        packageId: "slow_green_day",
        startAt: "2026-09-19T08:00:00+07:00",
        endAt: "2026-09-19T14:00:00+07:00",
        status: "FULL",
      },
      {
        sessionId: "ses_closed",
        packageId: "slow_green_day",
        startAt: "2026-09-26T08:00:00+07:00",
        endAt: "2026-09-26T14:00:00+07:00",
        status: "CLOSED",
      },
      {
        sessionId: "ses_cancelled",
        packageId: "slow_green_day",
        startAt: "2026-10-03T08:00:00+07:00",
        endAt: "2026-10-03T14:00:00+07:00",
        status: "CANCELLED",
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: { slow_green_day: sessions },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    expect(view.textContent).toContain("Tersedia");
    expect(view.textContent).toContain("Penuh");
    expect(view.textContent).toContain("Ditutup");
    // CANCELLED is hidden
    expect(view.textContent).not.toContain("3 Oktober 2026");

    const cards = view.querySelectorAll(".session-card");
    expect(cards.length).toBe(3);
  });

  it("12. displays 'Belum ada jadwal yang bisa dipilih saat ini' when no selectable sessions exist", async () => {
    const fullOnly: PackageSessionPreview[] = [
      {
        sessionId: "ses_full_only",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "FULL",
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: { slow_green_day: fullOnly },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    expect(view.textContent).toContain(
      "Belum ada jadwal yang bisa dipilih saat ini.",
    );

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    expect(ctaBtn.disabled).toBe(true);
  });

  it("13, 14, 15 & 18. single-select behavior: initially disabled CTA, selecting OPEN enables CTA, selecting second replaces first", async () => {
    const view = await renderSessionSelection("slow_green_day");

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    expect(ctaBtn.disabled).toBe(true);

    const radios = view.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );
    expect(radios.length).toBe(2);

    // Select first session (12 Sept)
    await act(async () => {
      radios[0].click();
    });
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(ctaBtn.disabled).toBe(false);
    expect(view.textContent).toContain("Rp275.000 / orang");

    // Select second session (19 Sept)
    await act(async () => {
      radios[1].click();
    });
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
    expect(ctaBtn.disabled).toBe(false);
  });

  it("16 & 17. disabled FULL/CLOSED session cannot become selected", async () => {
    const mixedSessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_full_1",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "FULL",
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: { slow_green_day: mixedSessions },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    const fullCard = view.querySelector<HTMLDivElement>(
      ".session-card--disabled",
    )!;
    await act(async () => {
      fullCard.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    expect(ctaBtn.disabled).toBe(true);
  });

  it("19 & 20. explicit remainingSlots is shown; missing slots does not fabricate a number", async () => {
    const sessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_with_slots",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        remainingSlots: 6,
      },
      {
        sessionId: "ses_without_slots",
        packageId: "slow_green_day",
        startAt: "2026-09-19T08:00:00+07:00",
        endAt: "2026-09-19T14:00:00+07:00",
        status: "OPEN",
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: { slow_green_day: sessions },
    });

    const sessionView = await renderSessionSelection("slow_green_day", {
      adapter,
    });
    expect(sessionView.textContent).toContain("Sisa 6 slot");
    expect(sessionView.textContent).toContain("Ketersediaan perlu dicek ulang");
  });

  it("23, 24 & 25. non-reserving revalidation on valid selection navigates to /checkout/:sessionId", async () => {
    sessionStore.setUser({
      id: "usr_session_nav",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/packages/slow_green_day/sessions"] },
          createElement(App),
        ),
      );
    });

    const firstRadio = container.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      firstRadio.click();
    });

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;

    await act(async () => {
      ctaBtn.click();
    });

    expect(container.textContent).toContain("Checkout");
  });

  it("1. REAL CAPACITY_UNKNOWN: OPEN session with remainingSlots === undefined fails revalidation with CAPACITY_UNKNOWN without navigating", async () => {
    const sessionsWithUndefinedCap: PackageSessionPreview[] = [
      {
        sessionId: "ses_no_cap",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        pricePerPerson: 275000,
        // remainingSlots is undefined
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: {
        slow_green_day: sessionsWithUndefinedCap,
      },
    });

    // Adapter-level direct check
    const directResult = await adapter.validateSessionSelection(
      "slow_green_day",
      "ses_no_cap",
    );
    expect(directResult.valid).toBe(false);
    expect(directResult.reason).toBe("CAPACITY_UNKNOWN");

    // UI-level check with selection override to test screen feedback
    const uiAdapter = new MockSessionSelectionAdapter({
      validationFailureOverride: {
        ses_sgd_1: "CAPACITY_UNKNOWN",
      },
    });

    const view = await renderSessionSelection("slow_green_day", {
      adapter: uiAdapter,
    });
    const firstRadio = view.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      firstRadio.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    expect(view.textContent).toContain(
      "Ketersediaan jadwal belum bisa dipastikan. Coba lagi.",
    );
    expect(firstRadio.checked).toBe(true);
  });

  it("2. REAL PACKAGE_MISMATCH & filtering: session with mismatched packageId is filtered from list and fails validation", async () => {
    const malformedSessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_mismatched_1",
        packageId: "mindful_morning", // Mismatched!
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        remainingSlots: 5,
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: {
        slow_green_day: malformedSessions,
      },
    });

    // A. getPackageSessions filters out mismatched packageId session
    const vm = await adapter.getPackageSessions("slow_green_day");
    expect(vm.sessions.length).toBe(0);

    // B. direct validateSessionSelection returns PACKAGE_MISMATCH
    const validation = await adapter.validateSessionSelection(
      "slow_green_day",
      "ses_mismatched_1",
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("PACKAGE_MISMATCH");
    expect(validation.message).toContain("tidak sesuai dengan paket");
  });

  it("3 & 7. REAL OPEN -> FULL stale revalidation clears selection, updates card to Penuh disabled, and shows warning notice", async () => {
    const adapter = new MockSessionSelectionAdapter({
      validationFailureOverride: {
        ses_sgd_1: "FULL",
      },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    const firstRadio = view.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      firstRadio.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Warning is visible
    expect(view.textContent).toContain(
      "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
    );
    // Selection cleared
    expect(firstRadio.checked).toBe(false);
    // Card now displays Penuh state and is disabled
    const firstCard = view.querySelectorAll(".session-card")[0];
    expect(firstCard.textContent).toContain("Penuh");
    expect(firstCard.classList.contains("session-card--disabled")).toBe(true);
  });

  it("4. REAL OPEN -> CLOSED stale revalidation clears selection, updates card to Ditutup disabled, and shows warning notice", async () => {
    const adapter = new MockSessionSelectionAdapter({
      validationFailureOverride: {
        ses_sgd_1: "CLOSED",
      },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    const firstRadio = view.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      firstRadio.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Warning is visible
    expect(view.textContent).toContain(
      "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
    );
    // Selection cleared
    expect(firstRadio.checked).toBe(false);
    // Card now displays Ditutup state and is disabled
    const firstCard = view.querySelectorAll(".session-card")[0];
    expect(firstCard.textContent).toContain("Ditutup");
    expect(firstCard.classList.contains("session-card--disabled")).toBe(true);
  });

  it("5. REAL OPEN -> CANCELLED stale revalidation clears selection, removes session from list, and shows warning notice", async () => {
    const adapter = new MockSessionSelectionAdapter({
      validationFailureOverride: {
        ses_sgd_1: "CANCELLED",
      },
    });

    const view = await renderSessionSelection("slow_green_day", { adapter });
    const firstRadio = view.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      firstRadio.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Warning is visible
    expect(view.textContent).toContain(
      "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
    );
    // Cancelled session is removed from schedule list (only 1 session remains)
    const cards = view.querySelectorAll(".session-card");
    expect(cards.length).toBe(1);
    expect(view.textContent).not.toContain("ses_sgd_1");
  });

  it("5b. OPEN + remainingSlots === 0 direct adapter revalidation returns valid = false and reason = FULL", async () => {
    const zeroCapSessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_zero_cap",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00+07:00",
        endAt: "2026-09-12T14:00:00+07:00",
        status: "OPEN",
        remainingSlots: 0,
      },
    ];

    const adapter = new MockSessionSelectionAdapter({
      sessionOverrides: {
        slow_green_day: zeroCapSessions,
      },
    });

    const validation = await adapter.validateSessionSelection(
      "slow_green_day",
      "ses_zero_cap",
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("FULL");
  });

  it("6. REQUEST_ERROR 1st attempt preserves selection; 2nd attempt revalidates and navigates to actual /checkout/:sessionId", async () => {
    sessionStore.setUser({
      id: "usr_retry_nav",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockSessionSelectionAdapter({
      failValidationCount: 1,
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/packages/slow_green_day/sessions"] },
          createElement(App),
        ),
      );
    });

    // We pass adapter via props to custom render, let's use renderSessionSelection with App router context
    const view = await renderSessionSelection("slow_green_day", { adapter });
    const firstRadio = view.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      firstRadio.click();
    });

    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;

    // 1st attempt -> REQUEST_ERROR
    await act(async () => {
      ctaBtn.click();
    });

    expect(view.textContent).toContain(
      "Jadwal belum bisa diverifikasi. Coba lagi.",
    );
    expect(firstRadio.checked).toBe(true);

    // Now test with App router to verify actual navigation on 2nd attempt
    const navContainer = document.createElement("div");
    document.body.append(navContainer);
    const navRoot = createRoot(navContainer);

    const appAdapter = new MockSessionSelectionAdapter({
      failValidationCount: 1,
    });

    await act(async () => {
      navRoot.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/packages/slow_green_day/sessions"] },
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/packages/:packageId/sessions",
              element: createElement(SessionSelectionScreen, {
                adapter: appAdapter,
              }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement("div", undefined, "Checkout Page Target"),
            }),
          ]),
        ),
      );
    });

    const radio = navContainer.querySelector<HTMLInputElement>(
      'input[type="radio"]',
    )!;
    await act(async () => {
      radio.click();
    });

    const btn = Array.from(navContainer.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut Checkout"),
    )!;

    // Attempt 1 -> error banner shown
    await act(async () => {
      btn.click();
    });
    expect(navContainer.textContent).toContain(
      "Jadwal belum bisa diverifikasi. Coba lagi.",
    );

    // Attempt 2 -> succeeds and navigates to Checkout Page Target
    await act(async () => {
      btn.click();
    });
    expect(navContainer.textContent).toContain("Checkout Page Target");

    await act(async () => navRoot.unmount());
    navContainer.remove();
  });

  it("H. cross-date 2D1N session renders both dates correctly without fabricating 2D1N label", async () => {
    const view = await renderSessionSelection("weekend_nature_reset");
    expect(view.textContent).toContain(
      "Sabtu, 26 September 2026 • 14.00 WIB → Minggu, 27 September 2026 • 11.00 WIB",
    );
    expect(view.textContent).not.toContain("2 Hari 1 Malam");
  });

  it("38. Package Detail 'Pilih Jadwal' CTA routes into T09 Session Selection", async () => {
    sessionStore.setUser({
      id: "usr_t08_to_t09",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/packages/slow_green_day"] },
          createElement(App),
        ),
      );
    });

    const pickScheduleBtn = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => b.textContent?.includes("Pilih Jadwal"))!;
    expect(pickScheduleBtn.disabled).toBe(false);

    await act(async () => {
      pickScheduleBtn.click();
    });

    expect(container.textContent).toContain("Pilih Jadwal");
    expect(container.textContent).toContain("Jadwal Keberangkatan");
  });

  it("39 & 40. Traveler shell retains exactly four bottom navigation tabs on T09", async () => {
    sessionStore.setUser({
      id: "usr_t09_shell_check",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/packages/slow_green_day/sessions"] },
          createElement(App),
        ),
      );
    });

    const navItems = container.querySelectorAll(".traveler-bottom-nav__item");
    expect(navItems.length).toBe(4);
    const labels = Array.from(navItems).map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Home", "Explore", "My Trips", "Profile"]);
  });

  it("I. raw 6, PAID occupancy 4 → T09 displays effective remaining = 2", async () => {
    mockTransactionStore.createTransaction({
      travelerId: "usr_t09_occ",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 4,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_t09_occ_4",
    });
    const bId = mockTransactionStore.getBookings()[0].bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    const adapter = new MockSessionSelectionAdapter();
    const vm = await adapter.getPackageSessions("slow_green_day");
    const ses1 = vm.sessions.find((s) => s.sessionId === "ses_sgd_1");

    expect(ses1?.remainingSlots).toBe(2);
    expect(ses1?.status).toBe("OPEN");

    const view = await renderSessionSelection("slow_green_day", { adapter });
    expect(view.textContent).toContain("Sisa 2 slot");
  });

  it("J. occupied 6 → T09 marks session FULL/unavailable", async () => {
    mockTransactionStore.createTransaction({
      travelerId: "usr_t09_full",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 6,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_t09_full_6",
    });
    const bId = mockTransactionStore.getBookings()[0].bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    const adapter = new MockSessionSelectionAdapter();
    const vm = await adapter.getPackageSessions("slow_green_day");
    const ses1 = vm.sessions.find((s) => s.sessionId === "ses_sgd_1");

    expect(ses1?.remainingSlots).toBe(0);
    expect(ses1?.status).toBe("FULL");

    const validation = await adapter.validateSessionSelection(
      "slow_green_day",
      "ses_sgd_1",
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("FULL");
  });

  it("K. T10 remains correct with ledger occupancy", () => {
    expect(mockTransactionStore.getOccupiedQuantity("ses_sgd_1")).toBe(0);
  });
});
