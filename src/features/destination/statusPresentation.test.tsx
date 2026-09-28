// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { DestinationOverviewScreen } from "./DestinationOverviewScreen";
import { DestinationVerificationStatusScreen } from "./DestinationVerificationStatusScreen";
import { DestinationVerificationBadgeScreen } from "./DestinationVerificationBadgeScreen";
import { DestinationScheduleScreen } from "./DestinationScheduleScreen";
import { DestinationCapacityScreen } from "./DestinationCapacityScreen";
import { DestinationReviewsScreen } from "./DestinationReviewsScreen";
import { DestinationSettingsScreen } from "./DestinationSettingsScreen";
import { destinationSessionStatusLabels } from "./destinationOverviewData";

let container: HTMLDivElement;
let root: Root | undefined;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  partnerSessionStore.reset();
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

describe("Mitra destination status presentation", () => {
  it("keeps overview and verification status readable without filled badges", async () => {
    partnerSessionStore.loginAsDemoDestination();
    const overview = await render(createElement(DestinationOverviewScreen));
    expect(
      overview.querySelector(".dest-readiness__status-meta")?.textContent,
    ).toContain("Aktif");
    expect(
      overview.querySelector(".dest-readiness__status-meta .ui-badge"),
    ).toBeNull();
    expect(
      overview.querySelectorAll(".dest-session-row__status .inline-status")
        .length,
    ).toBeGreaterThan(0);
    await clear();

    const verification = await render(
      createElement(DestinationVerificationStatusScreen),
    );
    expect(
      verification.querySelector(".dest-verification-status-line")?.textContent,
    ).toContain("Disetujui");
    expect(
      verification.querySelector(".dest-verification-status-line .ui-badge"),
    ).toBeNull();
    await clear();

    const activeVerification = await render(
      createElement(DestinationVerificationBadgeScreen),
    );
    expect(
      activeVerification.querySelector(".dest-verification-single__app-status")
        ?.textContent,
    ).toContain("Disetujui");
    expect(
      activeVerification.querySelector(
        ".dest-verification-single__app-status .inline-status",
      ),
    ).not.toBeNull();
  });

  it("removes decorative headers and keeps session status in human language", async () => {
    partnerSessionStore.loginAsDemoDestination();
    const screens = [
      [DestinationScheduleScreen, "Jadwal Operasional Venue"],
      [DestinationCapacityScreen, "Pengawasan Kapasitas Kawasan"],
      [DestinationReviewsScreen, "Evaluasi Kualitas Kawasan"],
      [DestinationSettingsScreen, "Pengaturan Akun & Kemitraan"],
    ] as const;

    for (const [Screen, obsoleteLabel] of screens) {
      const view = await render(createElement(Screen));
      expect(view.querySelector("h1")).not.toBeNull();
      expect(view.textContent).not.toContain(obsoleteLabel);
      if (Screen === DestinationScheduleScreen) {
        expect(
          view.querySelector(".eo-table .inline-status")?.textContent,
        ).toBe("Terbuka");
        expect(view.querySelector(".eo-table .ui-badge")).toBeNull();
      }
      if (Screen === DestinationCapacityScreen) {
        expect(view.textContent).toContain("Selisih operasional:");
        expect(
          view.querySelector(".dest-capacity-headroom .ui-badge"),
        ).toBeNull();
      }
      await clear();
    }

    expect(destinationSessionStatusLabels).toEqual({
      OPEN: "Terbuka",
      FULL: "Penuh",
      CLOSED: "Ditutup",
      CANCELLED: "Dibatalkan",
    });
  });
});
