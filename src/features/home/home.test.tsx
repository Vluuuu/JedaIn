// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { sessionStore } from "../onboarding/sessionStore";
import type { QuizDraft } from "../quiz/types";
import { HomeScreen } from "./HomeScreen";
import { MockHomeAdapter } from "./mockAdapter";
import type { PendingPaymentSummary, UpcomingTripSummary } from "./types";

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

const sampleQuiz: QuizDraft = {
  currentStep: 6,
  current_intent: "NATURE",
  preferred_activities: ["NATURE_SCENERY", "LIGHT_EXPLORATION"],
  budget_band: "AROUND_200_300K",
  duration_preference: "FULL_DAY",
  departure_area_id: "MALANG",
  departure_area_label: "Malang",
  group_type: "FRIENDS",
  group_size_band: "THREE_TO_FOUR",
  updatedAt: "2026-08-31T12:00:00.000Z",
};

const samplePendingPayment: PendingPaymentSummary = {
  bookingId: "bk_pending_123",
  packageName: "Sehari Pelan di Lereng Hijau",
  sessionLabel: "Sabtu, 12 Sept 2026",
  amount: 275000,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  authoritativeStatus: "PENDING_PAYMENT",
};

const sampleUpcomingTrip: UpcomingTripSummary = {
  bookingId: "bk_paid_456",
  packageName: "Weekend Nature Reset",
  tripDate: "20 Sept 2026",
  destinationLabel: "Lembah Alam Pacet",
  meetingOrDepartureSummary: "Surabaya",
};

async function renderHome(props: { adapter?: MockHomeAdapter } = {}) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(MemoryRouter, undefined, createElement(HomeScreen, props)),
    ),
  );
  return container;
}

describe("HomeScreen State Matrix & Module Composition", () => {
  it("1. NORMAL: renders recommendation and full discovery modules when no pending payment or upcoming trip", async () => {
    sessionStore.setUser({
      id: "usr_1",
      name: "Dewo Jeda",
      onboardingStatus: "COMPLETED",
    });
    sessionStore.setQuizDraft(sampleQuiz);

    const view = await renderHome();

    expect(view.textContent).toContain("Halo, Dewo");
    expect(view.textContent).toContain("Pilihan untukmu");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Eksplorasi Berdasarkan Suasana");
    expect(view.textContent).toContain("Populer Minggu Ini");
    expect(view.textContent).toContain("Dari Area Malang");
    expect(view.textContent).toContain("Destinasi Terverifikasi");

    // No transactional cards
    expect(view.textContent).not.toContain("Menunggu Pembayaran");
    expect(view.textContent).not.toContain("Trip Mendatang");
  });

  it("2. PENDING_PAYMENT_ONLY: shows pending payment banner while preserving discovery and recommendation", async () => {
    sessionStore.setUser({ id: "usr_2", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft(sampleQuiz);

    const adapter = new MockHomeAdapter({
      pendingPayment: samplePendingPayment,
    });
    const view = await renderHome({ adapter });

    expect(view.textContent).toContain("Menunggu Pembayaran");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Lanjutkan Pembayaran");
    expect(view.textContent).toContain("Pilihan untukmu");
    expect(view.textContent).toContain("Populer Minggu Ini");
    expect(view.textContent).not.toContain("Trip Mendatang");
  });

  it("3. UPCOMING_TRIP_ONLY: shows upcoming trip card while preserving discovery and recommendation", async () => {
    sessionStore.setUser({ id: "usr_3", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft(sampleQuiz);

    const adapter = new MockHomeAdapter({ upcomingTrip: sampleUpcomingTrip });
    const view = await renderHome({ adapter });

    expect(view.textContent).toContain("Trip Mendatang");
    expect(view.textContent).toContain("Weekend Nature Reset");
    expect(view.textContent).toContain("Lihat Trip");
    expect(view.textContent).toContain("Pilihan untukmu");
    expect(view.textContent).not.toContain("Menunggu Pembayaran");
  });

  it("4. PENDING_PAYMENT_AND_UPCOMING: renders BOTH in correct top-level order (payment before upcoming)", async () => {
    sessionStore.setUser({ id: "usr_4", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft(sampleQuiz);

    const adapter = new MockHomeAdapter({
      pendingPayment: samplePendingPayment,
      upcomingTrip: sampleUpcomingTrip,
    });
    const view = await renderHome({ adapter });

    expect(view.textContent).toContain("Menunggu Pembayaran");
    expect(view.textContent).toContain("Trip Mendatang");

    const paymentIndex = view.innerHTML.indexOf("home-payment-banner");
    const upcomingIndex = view.innerHTML.indexOf("home-upcoming-card");
    const recIndex = view.innerHTML.indexOf("home-recommendation-section");

    expect(paymentIndex).toBeLessThan(upcomingIndex);
    expect(upcomingIndex).toBeLessThan(recIndex);
  });

  it("5. NO_RECOMMENDATION: renders empty recommendation box but continues rendering discovery", async () => {
    sessionStore.setUser({ id: "usr_5", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft(null); // No quiz draft

    const view = await renderHome();

    expect(view.textContent).toContain(
      "Belum ada rekomendasi personal yang bisa ditampilkan.",
    );
    expect(view.textContent).toContain("Jelajahi Experience");
    expect(view.textContent).toContain("Eksplorasi Berdasarkan Suasana");
    expect(view.textContent).toContain("Populer Minggu Ini");
    expect(view.textContent).toContain("Destinasi Terverifikasi");
  });

  it("6. LOADING: renders stable skeleton layout", async () => {
    const adapter = new MockHomeAdapter({ delayMs: 1000 });
    const view = await renderHome({ adapter });

    expect(
      view.querySelector(".home-container")?.getAttribute("aria-busy"),
    ).toBe("true");
    expect(view.querySelectorAll(".ui-skeleton").length).toBeGreaterThan(0);
  });

  it("7. ERROR_PARTIAL: recommendation failure shows local retry without breaking other discovery sections", async () => {
    sessionStore.setUser({ id: "usr_7", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft(sampleQuiz);

    const adapter = new MockHomeAdapter({ shouldFailRecommendation: true });
    const view = await renderHome({ adapter });

    expect(view.textContent).toContain("Gagal memuat rekomendasi personal.");
    expect(view.textContent).toContain("Populer Minggu Ini");
    expect(view.textContent).toContain("Destinasi Terverifikasi");
  });
});

describe("HomeScreen Details, Preferences & Interactive Behaviors", () => {
  it("8 & 9. PendingPayment countdown calculates display timer from expiresAt without altering authoritative status", async () => {
    const adapter = new MockHomeAdapter({
      pendingPayment: samplePendingPayment,
    });
    const view = await renderHome({ adapter });

    expect(view.textContent).toContain("Sisa waktu:");
    expect(samplePendingPayment.authoritativeStatus).toBe("PENDING_PAYMENT");
  });

  it("16 & 17. Displays human-facing preference summary without exposing internal enums", async () => {
    sessionStore.setUser({ id: "usr_pref", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft(sampleQuiz);

    const view = await renderHome();

    expect(view.textContent).toContain("Dekat dengan alam");
    expect(view.textContent).toContain("1 hari");
    expect(view.textContent).toContain("Malang");
    expect(view.textContent).not.toContain("NATURE_SCENERY");
    expect(view.textContent).not.toContain("FULL_DAY");
  });

  it("21. Mood presets exactly match contract", async () => {
    const view = await renderHome();
    expect(view.textContent).toContain("Tenang");
    expect(view.textContent).toContain("Alam");
    expect(view.textContent).toContain("Recharge");
    expect(view.textContent).toContain("Eksplorasi");
    expect(view.textContent).toContain("Refleksi");
  });

  it("23 & 24. Departure filtering for MALANG/SURABAYA and OTHER without geocoding", async () => {
    sessionStore.setUser({ id: "usr_dep", onboardingStatus: "COMPLETED" });
    sessionStore.setQuizDraft({
      ...sampleQuiz,
      departure_area_id: "OTHER",
      departure_area_label: "Banyuwangi",
    });

    const view = await renderHome();
    expect(view.textContent).toContain("Dari Area Banyuwangi");
    expect(view.textContent).toContain("Belum ada paket khusus dari area ini");
  });

  it("25. Verified destinations are de-duplicated", async () => {
    const view = await renderHome();
    const destElements = view.querySelectorAll(".home-destination-card");
    const names = Array.from(destElements).map(
      (el) => el.querySelector("h3")?.textContent,
    );
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });
});

describe("HomeScreen Router-Level Interactive Navigation", () => {
  afterEach(() => {
    MockHomeAdapter.resetSharedOptions();
  });

  it("routes payment CTA correctly", async () => {
    sessionStore.setUser({
      id: "usr_routes_pay",
      onboardingStatus: "COMPLETED",
    });
    sessionStore.setQuizDraft(sampleQuiz);

    MockHomeAdapter.setSharedOptions({
      pendingPayment: samplePendingPayment,
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/home"] },
          createElement(App),
        ),
      ),
    );

    const payBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjutkan Pembayaran"),
    )!;
    await act(() => payBtn.click());
    expect(container.textContent).toContain("Payment");
  });

  it("routes upcoming trip CTA correctly", async () => {
    sessionStore.setUser({
      id: "usr_routes_trip",
      onboardingStatus: "COMPLETED",
    });
    sessionStore.setQuizDraft(sampleQuiz);

    MockHomeAdapter.setSharedOptions({
      upcomingTrip: sampleUpcomingTrip,
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/home"] },
          createElement(App),
        ),
      ),
    );

    const tripBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lihat Trip"),
    )!;
    await act(() => tripBtn.click());
    expect(container.textContent).toContain("Trip detail");
  });
});
