// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { getHumanStatusLabel } from "./packageHelpers";
import { EoPackagesScreen } from "./EoPackagesScreen";
import { EoSessionsScreen } from "./EoSessionsScreen";
import { EoBookingsScreen } from "./EoBookingsScreen";
import { EoReviewsScreen } from "./EoReviewsScreen";
import { EoProfileScreen } from "./EoProfileScreen";

let container: HTMLDivElement;
let root: Root | undefined;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  partnerSessionStore.reset();
  mockEoPackageStore.reset();
});

async function render(screen: React.ReactElement) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(createElement(MemoryRouter, null, screen));
  });
  return container;
}

async function clear() {
  await act(async () => root?.unmount());
  root = undefined;
  container.remove();
}

describe("Travel Organizer status presentation", () => {
  it("uses inline package lifecycle text and retains numeric filter counts", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await render(createElement(EoPackagesScreen));
    expect(
      view.querySelectorAll(".eo-pkg-card__status-col .inline-status").length,
    ).toBeGreaterThan(0);
    expect(view.querySelector(".eo-pkg-card__status-col .ui-badge")).toBeNull();
    const allTab = view.querySelector<HTMLElement>(
      '.eo-packages-filter__tab[role="tab"]',
    );
    expect(
      allTab?.querySelector(".eo-packages-filter__badge")?.textContent,
    ).toBe(String(mockEoPackageStore.getPackagesByEo("eo_jeda_alam").length));
    const liveTab = Array.from(
      view.querySelectorAll<HTMLElement>(
        '.eo-packages-filter__tab[role="tab"]',
      ),
    ).find((tab) => tab.textContent?.includes("Live"));
    await act(async () => liveTab?.click());
    expect(liveTab?.getAttribute("aria-selected")).toBe("true");
    expect(view.querySelectorAll(".eo-pkg-card")).toHaveLength(
      Number(liveTab?.querySelector(".eo-packages-filter__badge")?.textContent),
    );
    expect(
      ["DRAFT", "PENDING_ADMIN_REVIEW", "REJECTED", "APPROVED", "LIVE"].map(
        (status) =>
          getHumanStatusLabel(
            status as Parameters<typeof getHumanStatusLabel>[0],
          ),
      ),
    ).toEqual([
      "Draf",
      "Menunggu review",
      "Perlu perbaikan",
      "Disetujui",
      "Live",
    ]);
  });

  it("removes decorative headers and displays sessions and profile metadata without capsules", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const screens = [
      [EoSessionsScreen, "Manajemen Jadwal Keberangkatan"],
      [EoBookingsScreen, "Operasional Pemesanan"],
      [EoReviewsScreen, "Evaluasi Traveler"],
      [EoProfileScreen, "Identitas Terverifikasi"],
    ] as const;

    for (const [Screen, obsoleteLabel] of screens) {
      const view = await render(createElement(Screen));
      expect(view.querySelector("h1")).not.toBeNull();
      expect(view.textContent).not.toContain(obsoleteLabel);
      if (Screen === EoSessionsScreen) {
        expect(view.textContent).toContain("6 slot tersisa");
        expect(view.textContent).not.toContain("6 tersisa");
        expect(
          view.querySelector(".eo-table .inline-status")?.textContent,
        ).toBe("Terbuka");
        expect(view.querySelector(".eo-table .ui-badge")).toBeNull();
        expect(
          view.querySelector(".eo-session-package-card .inline-status"),
        ).not.toBeNull();
      }
      if (Screen === EoProfileScreen) {
        expect(view.textContent).toContain("Memiliki sertifikasi pemanduan");
        expect(view.querySelector(".ui-badge")).toBeNull();
      }
      await clear();
    }
  });
});
