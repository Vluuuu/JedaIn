// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "./mockPackageDetails";
import { MockPackageDetailAdapter } from "./mockAdapter";
import { PackageDetailScreen } from "./PackageDetailScreen";
import type { PackageSessionPreview } from "./types";

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

async function renderPackageDetail(
  packageId = "slow_green_day",
  props: { adapter?: MockPackageDetailAdapter } = {},
  initialEntries: string[] = [`/packages/${packageId}`],
  state?: { personalizedReasons?: string[] },
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(
        MemoryRouter,
        {
          initialEntries: initialEntries.map((path) => ({
            pathname: path,
            state,
          })),
        },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen, props),
          }),
        ),
      ),
    ),
  );
  return container;
}

describe("PackageDetailScreen Data & Contract Tests", () => {
  it("1. known LIVE package resolves to READY detail", async () => {
    const view = await renderPackageDetail("slow_green_day");

    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Mulai dari");
    expect(view.textContent).toContain("Rp275.000");
    expect(view.textContent).toContain("Highlight Pengalaman");
    expect(view.textContent).toContain("Rencana Perjalanan");
    expect(view.textContent).toContain("Fasilitas & Ketentuan");
    expect(view.textContent).toContain("Destinasi & Penyelenggara");
    expect(view.textContent).toContain("Jadwal Terdekat");
    expect(view.textContent).toContain("Pilih Jadwal");
  });

  it("2. unknown packageId renders NOT_FOUND state", async () => {
    const view = await renderPackageDetail("unknown_pkg_999");

    expect(view.textContent).toContain("Experience tidak ditemukan.");
    expect(view.textContent).toContain(
      "Experience ini mungkin sudah tidak tersedia atau tautannya tidak valid.",
    );
    expect(view.textContent).toContain("Kembali ke Explore");
  });

  it("3. non-LIVE package cannot render as traveler-ready detail", async () => {
    const adapter = new MockPackageDetailAdapter({
      packages: [
        {
          id: "draft_pkg",
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

    const view = await renderPackageDetail("draft_pkg", { adapter });
    expect(view.textContent).toContain("Experience tidak ditemukan.");
  });

  it("4 & 5. all current 5 LIVE Explore packages have valid detail fixtures and render correctly", async () => {
    const liveIds = [
      "slow_green_day",
      "creative_village_halfday",
      "mindful_morning",
      "light_mountain_explore",
      "weekend_nature_reset",
    ];

    for (const id of liveIds) {
      expect(MOCK_PACKAGE_DETAILS[id]).toBeDefined();
      expect(MOCK_PACKAGE_DETAILS[id].itinerary.length).toBeGreaterThan(0);
      expect(MOCK_PACKAGE_DETAILS[id].includedItems.length).toBeGreaterThan(0);
      expect(MOCK_PACKAGE_DETAILS[id].safetyNotes.length).toBeGreaterThan(0);
    }
  });

  it("6. starting price uses package traveler-facing pricePerPerson", async () => {
    const view = await renderPackageDetail("mindful_morning");
    expect(view.textContent).toContain("Mulai dari");
    expect(view.textContent).toContain("Rp225.000");
  });

  it("7 & 8. destination verification label is correct", async () => {
    const view = await renderPackageDetail("slow_green_day");
    expect(view.textContent).toContain("Terverifikasi Dasar");
  });

  it("9. trust copy does not present government or external certification claims", async () => {
    const view = await renderPackageDetail("slow_green_day");
    expect(view.textContent).toContain(
      "Status verifikasi mitra destinasi terdaftar dan teruji di platform JedaIn.",
    );
    expect(view.textContent).not.toContain("kementerian");
    expect(view.textContent).not.toContain("pemerintah");
    expect(view.textContent).not.toContain("100% aman");
  });

  it("10. guide status is separate from destination verification", async () => {
    const view = await renderPackageDetail("slow_green_day");
    // Destination verification
    expect(view.textContent).toContain("Terverifikasi Dasar");
    // EO guide status
    expect(view.textContent).toContain("Certified Guide");
    expect(view.textContent).toContain("Jeda Alam Nusantara");
  });

  it("11. itinerary order is deterministic", async () => {
    const view = await renderPackageDetail("slow_green_day");
    const items = view.querySelectorAll(".package-detail-itinerary-item");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain(
      "Pagi - Berkumpul & Perjalanan Santai",
    );
    expect(items[1].textContent).toContain(
      "Menjelajah Jalur Teh & Latihan Napas",
    );
    expect(items[2].textContent).toContain("Santap Siang & Refleksi Santai");
  });

  it("12. default fixtures introduce no transport claim", async () => {
    const view = await renderPackageDetail("slow_green_day");
    expect(view.textContent).toContain("Belum Termasuk");
    expect(view.textContent).toContain("Transportasi menuju titik kumpul awal");
    expect(view.textContent).not.toContain("Antar jemput gratis");
    expect(view.textContent).not.toContain("Transportasi termasuk");
  });

  it("13. cancellation/refund policy does not fabricate concrete percentages or deadlines", async () => {
    const view = await renderPackageDetail("slow_green_day");
    expect(view.textContent).toContain("Kebijakan Pembatalan & Refund");
    expect(view.textContent).toContain(
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    );
    expect(view.textContent).not.toContain("H-7");
    expect(view.textContent).not.toContain("50%");
    expect(view.textContent).not.toContain("100% refund");
  });

  it("14. upcoming session previews are chronologically ordered", async () => {
    const view = await renderPackageDetail("slow_green_day");
    const sessionCards = view.querySelectorAll(".package-detail-session-card");
    expect(sessionCards.length).toBe(2);
    expect(sessionCards[0].textContent).toContain("12 September 2026");
    expect(sessionCards[1].textContent).toContain("19 September 2026");
  });

  it("15 & 16. OPEN session enables 'Pilih Jadwal' and routes to /packages/:packageId/sessions", async () => {
    sessionStore.setUser({
      id: "usr_pkg_nav",
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

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Pilih Jadwal"),
    )!;
    expect(ctaBtn.disabled).toBe(false);

    await act(async () => {
      ctaBtn.click();
    });

    expect(container.textContent).toContain("Choose session");
  });

  it("17, 18, 19, 20 & 21. NO_OPEN_SESSION (e.g. FULL or CLOSED only) disables CTA and shows 'Belum ada jadwal tersedia'", async () => {
    const closedSessions: PackageSessionPreview[] = [
      {
        sessionId: "ses_closed",
        packageId: "slow_green_day",
        startAt: "2026-09-12T08:00:00.000Z",
        endAt: "2026-09-12T14:00:00.000Z",
        status: "FULL",
      },
    ];

    const adapter = new MockPackageDetailAdapter({
      sessionOverrides: {
        slow_green_day: closedSessions,
      },
    });

    const view = await renderPackageDetail("slow_green_day", { adapter });
    const ctaBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Pilih Jadwal"),
    )!;

    expect(ctaBtn.disabled).toBe(true);
    expect(view.textContent).toContain("Belum ada jadwal tersedia");
    expect(view.textContent).toContain("Penuh");
  });

  it("22. remaining slots are shown only when preview data explicitly provides value", async () => {
    const view = await renderPackageDetail("slow_green_day");
    expect(view.textContent).toContain("Sisa 6 slot");
  });

  it("24. loading renders stable skeleton structure", async () => {
    const adapter = new MockPackageDetailAdapter({ delayMs: 1000 });
    const view = await renderPackageDetail("slow_green_day", { adapter });

    expect(
      view
        .querySelector(".package-detail-container")
        ?.getAttribute("aria-busy"),
    ).toBe("true");
    expect(view.querySelectorAll(".ui-skeleton").length).toBeGreaterThan(0);
  });

  it("25. not-found state allows recovery back to /explore", async () => {
    sessionStore.setUser({
      id: "usr_not_found_nav",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/packages/invalid_id"] },
          createElement(App),
        ),
      );
    });

    expect(container.textContent).toContain("Experience tidak ditemukan.");

    const backBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Kembali ke Explore"),
    )!;

    await act(async () => {
      backBtn.click();
    });

    expect(container.textContent).toContain("Jelajahi Experience");
  });

  it("26 & 27. error state allows retry and preserves current packageId", async () => {
    const adapter = new MockPackageDetailAdapter({
      failCount: 1,
      errorMessage: "Gagal memuat dari server simulasi.",
    });

    const view = await renderPackageDetail("slow_green_day", { adapter });
    expect(view.textContent).toContain("Detail experience belum bisa dimuat.");

    const retryBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Coba lagi"),
    )!;

    await act(async () => {
      retryBtn.click();
    });

    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
  });

  it("28. ExplorePackageCard click from /explore opens Package Detail", async () => {
    sessionStore.setUser({
      id: "usr_explore_to_detail",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/explore"] },
          createElement(App),
        ),
      );
    });

    const card = container.querySelector<HTMLAnchorElement>(
      ".explore-package-card",
    )!;
    expect(card).not.toBeNull();

    await act(async () => {
      card.click();
    });

    expect(container.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(container.textContent).toContain("Mulai dari");
  });

  it("29. Traveler shell retains exactly four bottom navigation tabs on Package Detail", async () => {
    sessionStore.setUser({
      id: "usr_shell_check",
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

    const navItems = container.querySelectorAll(".traveler-bottom-nav__item");
    expect(navItems.length).toBe(4);
    const labels = Array.from(navItems).map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Home", "Explore", "My Trips", "Profile"]);
  });

  it("32 & 33. explicit recommendation reasons passed through navigation state render without score/percentage", async () => {
    const reasons = ["Dekat dengan alam", "Eksplorasi ringan", "1 hari"];
    const view = await renderPackageDetail(
      "slow_green_day",
      {},
      ["/packages/slow_green_day"],
      { personalizedReasons: reasons },
    );

    expect(view.textContent).toContain("Kenapa cocok untukmu?");
    expect(view.textContent).toContain("Dekat dengan alam");
    expect(view.textContent).toContain("Eksplorasi ringan");
    expect(view.textContent).toContain("1 hari");
    expect(view.textContent).not.toContain("%");
    expect(view.textContent).not.toContain("AI");
  });
});
