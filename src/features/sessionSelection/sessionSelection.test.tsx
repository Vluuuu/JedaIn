// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
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

  it("26 & 27. revalidation failure (session becomes FULL) clears selection, stays on T09, and displays warning notice", async () => {
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

    expect(view.textContent).toContain(
      "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
    );
    // Selection was cleared
    const radios = view.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );
    expect(radios[0].checked).toBe(false);
    expect(ctaBtn.disabled).toBe(true);
  });

  it("29. revalidation failure due to REQUEST_ERROR keeps selection and allows retry", async () => {
    const adapter = new MockSessionSelectionAdapter({
      failValidationCount: 1,
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

    // 1st attempt -> request error
    await act(async () => {
      ctaBtn.click();
    });

    expect(view.textContent).toContain(
      "Jadwal belum bisa diverifikasi. Coba lagi.",
    );
    // Selected radio is still preserved
    expect(firstRadio.checked).toBe(true);
  });

  it("31 & 32. formats same-day and cross-date sessions in Asia/Jakarta WIB", async () => {
    const view = await renderSessionSelection("weekend_nature_reset");
    expect(view.textContent).toContain("Sabtu, 26 September 2026 • 14.00 WIB");
    expect(view.textContent).toContain("Minggu, 27 September 2026 • 11.00 WIB");
    expect(view.textContent).toContain("2 Hari 1 Malam");
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
});
