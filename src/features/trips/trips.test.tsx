// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthUser } from "../auth/types";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { DEMO_TRAVELER_HISTORY } from "./demoHistory";
import { MockTripsAdapter } from "./mockAdapter";
import { MyTripsScreen } from "./MyTripsScreen";
import { TripDetailScreen } from "./TripDetailScreen";

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
  mockReviewStore.reset();
});

function LocationObserver({
  onLocation,
}: {
  onLocation: (pathname: string) => void;
}) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

async function renderMyTrips(
  props: { adapter?: MockTripsAdapter } = {},
  initialEntries: string[] = ["/trips"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  let currentPath = "";

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(LocationObserver, {
          onLocation: (p) => {
            currentPath = p;
          },
        }),
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/trips",
            element: createElement(MyTripsScreen, props),
          }),
          createElement(Route, {
            path: "/trips/:bookingId",
            element: createElement(TripDetailScreen, props),
          }),
          createElement(Route, {
            path: "/payment/:bookingId",
            element: createElement("div", undefined, "Payment Screen Target"),
          }),
        ),
      ),
    );
  });

  return { container, getPath: () => currentPath };
}

describe("My Trips & Trip Detail (T16, T17, T18) Tests", () => {
  it("1. My Trips renders Pending Payment banner, Upcoming tab, Completed tab with demo history, and History tab", async () => {
    const traveler: AuthUser = {
      id: "usr_trips_1",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // 1. Pending booking
    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_tr_pending",
    });

    // 2. Paid upcoming booking
    const txPaid = mockTransactionStore.createTransaction({
      travelerId: "usr_other_temp",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_2",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_tr_paid",
    });
    if (txPaid.success) {
      mockTransactionStore.executePaymentSuccess({
        bookingId: txPaid.booking.bookingId,
      });
      // Re-assign traveler
      txPaid.booking.travelerId = traveler.id;
    }

    const { container } = await renderMyTrips();

    expect(container.textContent).toContain("My Trips");
    expect(container.textContent).toContain("Menunggu Pembayaran");
    expect(container.textContent).toContain("Upcoming (1)");
    expect(container.textContent).toContain("Completed (1)"); // DEMO_TRAVELER_HISTORY
    expect(container.textContent).toContain("History (0)");
  });

  it("2. Upcoming Trip Detail (T17) shows trip details without payment CTA", async () => {
    const traveler: AuthUser = {
      id: "usr_upcoming_detail",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_up_det",
    });
    expect(tx.success).toBe(true);
    const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

    expect(container.textContent).toContain("Trip Terkonfirmasi");
    expect(container.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(container.textContent).toContain("Penyelenggara & Panduan");
    expect(container.textContent).not.toContain("Bayar Sekarang");
    expect(container.textContent).not.toContain("Penilaian Pengalaman");
  });

  it("3. Completed Trip Detail (T18) shows two distinct review cards (Destination & EO/Guide)", async () => {
    const traveler: AuthUser = {
      id: "usr_completed_detail",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const bId = DEMO_TRAVELER_HISTORY.bookingId;
    const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

    expect(container.textContent).toContain("Trip Selesai");
    expect(container.textContent).toContain("Penilaian Pengalaman");
    expect(container.textContent).toContain("Nilai Destinasi");
    expect(container.textContent).toContain("Nilai EO / Guide");
    expect(container.textContent).toContain("Beri Nilai Destinasi");
    expect(container.textContent).toContain("Beri Nilai EO / Guide");
  });
});
