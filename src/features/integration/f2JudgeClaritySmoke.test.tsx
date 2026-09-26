// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { PackageDetailScreen } from "../packageDetail/PackageDetailScreen";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { DestinationScheduleScreen } from "../destination/DestinationScheduleScreen";
import { DestinationCapacityScreen } from "../destination/DestinationCapacityScreen";
import { DestinationReviewsScreen } from "../destination/DestinationReviewsScreen";
import { WorkspaceShell } from "../../components/shells/WorkspaceShell";
import { partnerDestinationNavigation } from "../../components/shells/navigation";
import { resetCompetitionDemoState } from "../demo/demoReset";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  resetCompetitionDemoState();
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
});

describe("F2 Judge Clarity Manual Smoke Automated Checks", () => {
  it("Traveler smoke part 1: Package Detail verifies review clarity and truthful refund copy", async () => {
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: [{ pathname: "/packages/slow_green_day" }] },
          createElement(Routes, undefined, [
            createElement(Route, {
              key: "pkg",
              path: "/packages/:packageId",
              element: createElement(PackageDetailScreen),
            }),
          ]),
        ),
      );
    });

    expect(container.textContent).toContain("Contoh Ulasan Paket");
    expect(container.textContent).toContain(
      "Data contoh pada prototype untuk menggambarkan tampilan ulasan paket. Ulasan Destinasi dan EO/Guide pascatrip dicatat terpisah.",
    );
    expect(container.textContent).toContain("Rating paket contoh: 4.8 / 5.0");
    expect(container.textContent).toContain(
      "Pada prototype ini, kebijakan pembatalan dan refund belum menetapkan batas waktu atau persentase pengembalian dana. Ketentuan operasional final akan ditetapkan sebelum transaksi nyata.",
    );
    expect(container.textContent).not.toContain("Ulasan Traveler");
    expect(container.textContent).not.toContain("H-7");
  });

  it("Traveler smoke part 2: Checkout verifies unchanged Rp7.500 fee, truthful acknowledgement, and no commission", async () => {
    const traveler = {
      id: "usr_smoke_traveler",
      name: "Smoke Traveler",
      email: "smoke@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED" as const,
    };
    sessionStore.setUser(traveler);

    const adapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_smoke_traveler: true },
    });

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: [{ pathname: "/checkout/ses_sgd_1" }] },
          createElement(Routes, undefined, [
            createElement(Route, {
              key: "checkout",
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen, { adapter }),
            }),
          ]),
        ),
      );
    });

    // Wait for async checkout load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Verify Service Fee Rp7.500 unchanged
    expect(container.textContent).toContain("Biaya layanan");
    expect(container.textContent).toContain("Rp7.500");
    // Verify no commission line
    expect(container.textContent).not.toContain("Komisi platform");
    expect(container.textContent).not.toContain("Commission");

    // Verify acknowledgement copy is truthful
    const checkbox = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);
    expect(container.textContent).toContain(
      "Saya memahami bahwa ketentuan pembatalan & refund pada prototype ini belum merupakan kebijakan operasional final.",
    );

    // Verify CTA click without checkbox shows truthful validation error
    const submitBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      submitBtn.click();
    });
    expect(container.textContent).toContain(
      "Konfirmasi pemahaman kebijakan pembatalan & refund prototype untuk melanjutkan.",
    );

    // Verify checking allows proceeding
    await act(async () => {
      checkbox.click();
    });
    expect(checkbox.checked).toBe(true);
    expect(container.textContent).not.toContain(
      "Konfirmasi pemahaman kebijakan pembatalan & refund prototype untuk melanjutkan.",
    );
  });

  it("Mitra Destination smoke: sidebar exposes all 7 routes, schedule/capacity/reviews render without PII or approval controls", async () => {
    partnerSessionStore.loginAsDemoDestination();

    // 1. Sidebar navigation in WorkspaceShell
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/destination"] },
          createElement(WorkspaceShell, {
            surface: "partner",
            title: "Destination Partner Workspace",
            navigation: partnerDestinationNavigation,
            children: createElement(
              "div",
              null,
              "Destination Overview Content",
            ),
          }),
        ),
      );
    });

    const expectedLabels = [
      "Overview",
      "Destination Profile",
      "Verification",
      "Schedule",
      "Capacity",
      "Reviews",
      "Profile",
    ];
    for (const label of expectedLabels) {
      expect(container.textContent).toContain(label);
    }
    // No EO routes in Destination workspace
    expect(container.textContent).not.toContain("Insights");
    expect(container.textContent).not.toContain("Packages");
    expect(container.textContent).not.toContain("Sessions");
    expect(container.textContent).not.toContain("Bookings");

    // 2. Schedule screen
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/destination/schedule"] },
          createElement(DestinationScheduleScreen),
        ),
      );
    });
    expect(container.textContent).toContain("Jadwal Sesi Perjalanan di Lokasi");
    expect(container.textContent).not.toContain("@example.com");
    expect(container.textContent).not.toContain("Setujui");
    expect(container.textContent).not.toContain("Tolak");

    // 3. Capacity screen
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/destination/capacity"] },
          createElement(DestinationCapacityScreen),
        ),
      );
    });
    expect(container.textContent).toContain(
      "Kapasitas & Alokasi Pengunjung Venue",
    );
    expect(container.textContent).not.toContain("@example.com");
    expect(container.textContent).not.toContain("Setujui");
    expect(container.textContent).not.toContain("Tolak");

    // 4. Reviews screen
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/destination/reviews"] },
          createElement(DestinationReviewsScreen),
        ),
      );
    });
    expect(container.textContent).toContain("Ulasan & Rating Destinasi");
    expect(container.textContent).not.toContain("Ulasan objektif");
    expect(container.textContent).not.toContain("Ulasan pengalaman nyata");
    expect(container.textContent).not.toContain("@example.com");
    expect(container.textContent).not.toContain("Setujui");
    expect(container.textContent).not.toContain("Tolak");
  });
});
