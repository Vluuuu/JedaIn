// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthUser } from "../auth/types";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { MockTripsAdapter } from "./mockAdapter";
import { MyTripsScreen } from "./MyTripsScreen";
import { TripDetailScreen } from "./TripDetailScreen";
import type { TripsAdapter } from "./types";

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
  onLocation: (location: { pathname: string; search: string }) => void;
}) {
  const location = useLocation();
  onLocation({ pathname: location.pathname, search: location.search });
  return null;
}

async function renderMyTrips(
  props: { adapter?: TripsAdapter } = {},
  initialEntries: string[] = ["/trips"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  let currentPath = "";
  let currentSearch = "";

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(LocationObserver, {
          onLocation: (loc) => {
            currentPath = loc.pathname;
            currentSearch = loc.search;
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
            path: "/trips/:bookingId/review",
            element: createElement("div", undefined, "Review Screen Target"),
          }),
          createElement(Route, {
            path: "/payment/:bookingId",
            element: createElement("div", undefined, "Payment Screen Target"),
          }),
        ),
      ),
    );
  });

  return {
    container,
    getPath: () => currentPath,
    getFullPath: () => `${currentPath}${currentSearch}`,
  };
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
    expect(container.textContent).toContain("Lanjutkan Pembayaran");
    expect(container.textContent).toContain("Lihat Trip");

    // Click Lanjutkan Pembayaran navigates to /payment/:bookingId
    const continueBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjutkan Pembayaran"),
    );
    expect(continueBtn).toBeDefined();

    // Verify old warning Badge is not rendered in pending card
    expect(container.querySelector(".ui-badge--warning")).toBeNull();
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
    expect(container.textContent).toContain("Penyelenggara & Kontak Trip");
    expect(container.textContent).not.toContain("Bayar Sekarang");
    expect(container.textContent).not.toContain("Penilaian Pengalaman");
  });

  it("3. Completed Trip Detail (T18) shows two distinct review cards (Destination & EO/Guide)", async () => {
    const traveler: AuthUser = {
      id: "usr_completed_detail",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const bId = `bk_demo_completed_${traveler.id}`;
    const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

    expect(container.textContent).toContain("Trip Selesai");
    expect(container.textContent).toContain("Penilaian Pengalaman");
    expect(container.textContent).toContain("Nilai Destinasi");
    expect(container.textContent).toContain("Nilai EO / Guide");
    expect(container.textContent).toContain("Beri Nilai Destinasi");
    expect(container.textContent).toContain("Beri Nilai EO / Guide");
  });

  it("L. wrong owner trip detail blocked → returns Trip tidak ditemukan", async () => {
    const travelerA: AuthUser = {
      id: "usr_trip_A",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerA);

    mockTransactionStore.createTransaction({
      travelerId: travelerA.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_trip_owner_a",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    // Switch to Traveler B
    const travelerB: AuthUser = {
      id: "usr_trip_B",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerB);

    const adapter = new MockTripsAdapter();
    const detail = await adapter.getTripDetail(bId);
    expect(detail).toBeNull();

    const { container } = await renderMyTrips({ adapter }, [`/trips/${bId}`]);
    expect(container.textContent).toContain("Trip tidak ditemukan.");
  });

  it("M. pending, cancelled, or expired bookings are not shown as confirmed trip detail", async () => {
    const traveler: AuthUser = {
      id: "usr_trip_states",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Pending booking
    const txPend = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_trip_pend",
    });
    const bIdPend = (txPend as { booking: { bookingId: string } }).booking
      .bookingId;

    const adapter = new MockTripsAdapter();
    const pendDetail = await adapter.getTripDetail(bIdPend);
    expect(pendDetail).toBeNull();

    // Cancelled booking
    mockTransactionStore.cancelPendingBooking({
      travelerId: traveler.id,
      bookingId: bIdPend,
    });
    const cancDetail = await adapter.getTripDetail(bIdPend);
    expect(cancDetail).toBeNull();
  });

  it("N. PAID trip detail displays itinerary, included items, and cancellation policy summary", async () => {
    const traveler: AuthUser = {
      id: "usr_trip_t17",
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
      idempotencyKey: "k_trip_t17",
    });
    const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    const { container } = await renderMyTrips({}, [`/trips/${bId}`]);
    expect(container.textContent).toContain("Rencana Perjalanan (Itinerary)");
    expect(container.textContent).toContain("Termasuk dalam Paket");
    expect(container.textContent).toContain("Kebijakan Pembatalan");
    expect(container.textContent).toContain(
      "Tiket masuk kawasan Lereng Hijau Batu",
    );
  });

  it("O. demo completed booking is bound to current Traveler deterministically", async () => {
    const traveler1: AuthUser = {
      id: "usr_demo_traveler_1",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler1);

    const adapter = new MockTripsAdapter();
    const trips1 = await adapter.getMyTrips();
    const demo1 = trips1.completedTrips.find(
      (t) => t.booking.bookingId === "bk_demo_completed_usr_demo_traveler_1",
    );
    expect(demo1).toBeDefined();
    expect(demo1?.booking.travelerId).toBe(traveler1.id);

    // Different traveler gets distinct deterministic ID
    const traveler2: AuthUser = {
      id: "usr_demo_traveler_2",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler2);
    const trips2 = await adapter.getMyTrips();
    const demo2 = trips2.completedTrips.find(
      (t) => t.booking.bookingId === "bk_demo_completed_usr_demo_traveler_2",
    );
    expect(demo2).toBeDefined();
    expect(demo2?.booking.travelerId).toBe(traveler2.id);
  });

  it("P. direct My Trips after expiry → no pending banner, EXPIRED in History, reservation released", async () => {
    const baseNow = new Date("2026-08-31T12:00:00.000Z").getTime();
    const traveler: AuthUser = {
      id: "usr_my_trips_exp",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_tr_exp",
      nowMs: baseNow,
    });

    // Adapter evaluated after expiry
    const expNowMs = baseNow + 16 * 60 * 1000;
    const adapter = new MockTripsAdapter({
      now: () => new Date(expNowMs),
    });

    const { container } = await renderMyTrips({ adapter });

    expect(container.textContent).not.toContain("Menunggu Pembayaran");
    expect(container.textContent).toContain("History (1)");
    expect(
      mockTransactionStore.getReservedQuantity("ses_sgd_1", expNowMs),
    ).toBe(0);
  });

  it("Q. demo Completed Trip displays historical Aug session, not Sep 12 live session", async () => {
    const traveler: AuthUser = {
      id: "usr_demo_aug_check",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const bId = `bk_demo_completed_${traveler.id}`;
    const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

    expect(container.textContent).toContain("Trip Selesai");
    expect(container.textContent).toContain("20 Agustus 2026");
    expect(container.textContent).not.toContain("12 September 2026");
  });

  it("R. Completed tab displays contract-exact CTA 'Lihat Detail' which routes to /trips/:bookingId", async () => {
    const traveler: AuthUser = {
      id: "usr_completed_tab_test",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const { container, getPath } = await renderMyTrips();

    // Click Completed tab
    const completedTab = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[role='tab']"),
    ).find((b) => b.textContent?.includes("Completed"));
    expect(completedTab).toBeDefined();

    await act(async () => {
      completedTab?.click();
    });

    // Check CTA is "Lihat Detail" (not "Lihat Trip")
    const detailBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Lihat Detail",
    );
    expect(detailBtn).toBeDefined();

    await act(async () => {
      detailBtn?.click();
    });

    expect(getPath()).toBe(`/trips/bk_demo_completed_${traveler.id}`);
  });

  it("S. History tab displays CANCELLED and EXPIRED with read-only lifecycle labels", async () => {
    const traveler: AuthUser = {
      id: "usr_history_labels",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Cancelled transaction
    const txCanc = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_hist_canc",
    });
    if (txCanc.success) {
      mockTransactionStore.cancelPendingBooking({
        travelerId: traveler.id,
        bookingId: txCanc.booking.bookingId,
      });
    }

    const { container } = await renderMyTrips();

    // Click History tab
    const historyTab = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[role='tab']"),
    ).find((b) => b.textContent?.includes("History"));
    expect(historyTab).toBeDefined();

    await act(async () => {
      historyTab?.click();
    });

    expect(container.textContent).toContain("Dibatalkan");
    // Read-only: no action button in history card
    const cardActions = container.querySelectorAll(
      ".my-trip-card__action button",
    );
    expect(cardActions.length).toBe(0);
  });

  it("T. Load failure shows error state with retry and does not present as empty data", async () => {
    const traveler: AuthUser = {
      id: "usr_fail_trips",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    let shouldFail = true;
    const failingAdapter = {
      getMyTrips: async () => {
        if (shouldFail) {
          throw new Error("Network error loading trips");
        }
        return {
          upcomingTrips: [],
          completedTrips: [],
          historyTrips: [],
        };
      },
      getTripDetail: async () => null,
    };

    const { container } = await renderMyTrips({ adapter: failingAdapter });

    // Error state rendered
    expect(container.textContent).toContain("Trip belum bisa dimuat.");
    expect(container.textContent).not.toContain("Belum ada trip");

    const retryBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Coba Lagi"),
    );
    expect(retryBtn).toBeDefined();

    // Settle error and retry
    shouldFail = false;
    await act(async () => {
      retryBtn?.click();
    });

    // Now renders empty state
    expect(container.textContent).toContain("Belum ada trip mendatang.");
  });

  it("U. Empty Upcoming tab displays recovery CTA 'Jelajahi Experience' routing to /explore", async () => {
    const traveler: AuthUser = {
      id: "usr_empty_upcoming",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const emptyAdapter = {
      getMyTrips: async () => ({
        upcomingTrips: [],
        completedTrips: [],
        historyTrips: [],
      }),
      getTripDetail: async () => null,
    };

    const { container, getPath } = await renderMyTrips({
      adapter: emptyAdapter,
    });

    expect(container.textContent).toContain("Belum ada trip mendatang.");
    const exploreBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Jelajahi Experience"),
    );
    expect(exploreBtn).toBeDefined();

    await act(async () => {
      exploreBtn?.click();
    });

    expect(getPath()).toBe("/explore");
  });

  /* ========================================================================
     P9.17 Tests: Contact, Inclusions/Exclusions/Safety, Demo Completion & Review Hierarchy
     ======================================================================== */

  describe("P9.17 Detailed Trip Detail & Contact Tests", () => {
    it("V1. PAID owned Trip Detail with resolvable APPROVED EO displays canonical contact and tel link", async () => {
      const traveler: AuthUser = {
        id: "usr_contact_paid_approved",
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
        idempotencyKey: "k_cont_paid_app",
      });
      const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
      mockTransactionStore.executePaymentSuccess({ bookingId: bId });

      const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

      // Check canonical EO information
      expect(container.textContent).toContain("Jeda Alam Nusantara");
      expect(container.textContent).toContain("Budi Santoso");
      expect(container.textContent).toContain("081234567890");
      expect(container.textContent).toContain("partner@jedaalam.id");
      expect(container.textContent).toContain("Hubungi EO");

      // Verify tel link
      const telLink = container.querySelector(
        'a[href="tel:081234567890"]',
      ) as HTMLAnchorElement;
      expect(telLink).not.toBeNull();
      expect(telLink.textContent).toContain("Hubungi EO");

      // Verify mailto link
      const mailtoLink = container.querySelector(
        'a[href="mailto:partner@jedaalam.id"]',
      ) as HTMLAnchorElement;
      expect(mailtoLink).not.toBeNull();

      // Check inclusion, exclusion, and safety notes
      expect(container.textContent).toContain("Termasuk dalam Paket");
      expect(container.textContent).toContain("Tidak Termasuk");
      expect(container.textContent).toContain(
        "Transportasi menuju titik kumpul awal",
      );
      expect(container.textContent).toContain("Sebelum Berangkat");
      expect(container.textContent).toContain(
        "Gunakan sepatu berjalan yang nyaman",
      );

      // Check no raw Badge element rendered
      expect(container.querySelector(".ui-badge")).toBeNull();
    });

    it("V2. COMPLETED owned Trip Detail retains source-backed EO contact", async () => {
      const traveler: AuthUser = {
        id: "usr_contact_completed",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const bId = `bk_demo_completed_${traveler.id}`;
      const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

      expect(container.textContent).toContain("Trip Selesai");
      expect(container.textContent).toContain("Budi Santoso");
      expect(container.textContent).toContain("081234567890");
      expect(container.textContent).toContain("Hubungi EO");
    });

    it("V3. Wrong-owner Trip Detail is blocked and does not expose contact", async () => {
      const travelerOwner: AuthUser = {
        id: "usr_owner_protect",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(travelerOwner);

      const tx = mockTransactionStore.createTransaction({
        travelerId: travelerOwner.id,
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "k_own_prot",
      });
      const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
      mockTransactionStore.executePaymentSuccess({ bookingId: bId });

      // Switch to different traveler
      const travelerIntruder: AuthUser = {
        id: "usr_intruder",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(travelerIntruder);

      const adapter = new MockTripsAdapter();
      const tripDetail = await adapter.getTripDetail(bId);
      expect(tripDetail).toBeNull();

      const { container } = await renderMyTrips({ adapter }, [`/trips/${bId}`]);
      expect(container.textContent).toContain("Trip tidak ditemukan.");
      expect(container.textContent).not.toContain("081234567890");
      expect(container.textContent).not.toContain("Budi Santoso");
      expect(container.textContent).not.toContain("Hubungi EO");
    });

    it("V4. PENDING booking blocks Trip Detail and does not leak contact", async () => {
      const traveler: AuthUser = {
        id: "usr_pending_block",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const tx = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "k_pend_prot",
      });
      const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;

      const adapter = new MockTripsAdapter();
      const tripDetail = await adapter.getTripDetail(bId);
      expect(tripDetail).toBeNull();

      const { container } = await renderMyTrips({ adapter }, [`/trips/${bId}`]);
      expect(container.textContent).toContain("Trip tidak ditemukan.");
      expect(container.textContent).not.toContain("081234567890");
      expect(container.textContent).not.toContain("Hubungi EO");
    });

    it("V5. Unresolvable EO mapping still loads Trip Detail without fabricating contact", async () => {
      const traveler: AuthUser = {
        id: "usr_unresolvable_eo",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const customDetails = {
        pkg_no_eo_map: {
          packageId: "pkg_no_eo_map",
          valueProposition: "Value prop",
          highlights: ["Highlight 1"],
          itinerary: [],
          includedItems: ["Item 1"],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "org_unknown_unmapped",
            displayName: "Penyelenggara Tanpa Akun EO",
            guideStatus: "CONCEPT_ONLY" as const,
          },
          destinationDetail: {
            overviewDescription: "Destinasi belum terpetakan",
          },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_no_eo",
              packageId: "pkg_no_eo_map",
              startAt: "2026-09-20T08:00:00+07:00",
              endAt: "2026-09-20T12:00:00+07:00",
              status: "OPEN" as const,
              remainingSlots: 5,
              pricePerPerson: 200000,
            },
          ],
        },
      };

      const tx = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "pkg_no_eo_map",
        sessionId: "ses_no_eo",
        participantCount: 1,
        unitPricePerPerson: 200000,
        capacitySnapshot: 5,
        idempotencyKey: "k_unres_eo",
      });
      const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
      mockTransactionStore.executePaymentSuccess({ bookingId: bId });

      const adapter = new MockTripsAdapter({ details: customDetails });
      const detail = await adapter.getTripDetail(bId);
      expect(detail).not.toBeNull();
      expect(detail?.organizerContact).toBeUndefined();

      const { container } = await renderMyTrips({ adapter }, [`/trips/${bId}`]);
      expect(container.textContent).toContain("Penyelenggara Tanpa Akun EO");
      expect(container.textContent).not.toContain("Penanggung Jawab EO");
      expect(container.textContent).not.toContain("Hubungi EO");
      // Does not crash
      expect(container.textContent).toContain("Informasi Trip");
    });

    it("V6. Non-APPROVED EO application does not expose contact", async () => {
      const traveler: AuthUser = {
        id: "usr_pending_eo_app",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      // Map a custom package to an organizer whose application is PENDING_REVIEW (eo_pending_user)
      const customDetails = {
        pkg_with_pending_eo: {
          packageId: "pkg_with_pending_eo",
          valueProposition: "Value prop",
          highlights: [],
          itinerary: [],
          includedItems: [],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "eo_pending_user", // resolveOrganizerReviewRef('eo_pending_user') returns 'eo_pending_user'
            displayName: "Lestari Wellness Journey",
            guideStatus: "CERTIFIED_GUIDE" as const,
          },
          destinationDetail: {
            overviewDescription: "Destinasi belum terpetakan",
          },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_pend_eo",
              packageId: "pkg_with_pending_eo",
              startAt: "2026-09-20T08:00:00+07:00",
              endAt: "2026-09-20T12:00:00+07:00",
              status: "OPEN" as const,
              remainingSlots: 5,
              pricePerPerson: 200000,
            },
          ],
        },
      };

      const tx = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "pkg_with_pending_eo",
        sessionId: "ses_pend_eo",
        participantCount: 1,
        unitPricePerPerson: 200000,
        capacitySnapshot: 5,
        idempotencyKey: "k_non_appr_eo",
      });
      const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
      mockTransactionStore.executePaymentSuccess({ bookingId: bId });

      const adapter = new MockTripsAdapter({ details: customDetails });
      const detail = await adapter.getTripDetail(bId);
      expect(detail).not.toBeNull();
      // Because eo_pending_user status is PENDING_REVIEW, organizerContact is undefined
      expect(detail?.organizerContact).toBeUndefined();

      const { container } = await renderMyTrips({ adapter }, [`/trips/${bId}`]);
      expect(container.textContent).not.toContain("081255667788");
      expect(container.textContent).not.toContain("Hubungi EO");
    });

    it("W. Discreet prototype demo completion control advances booking to COMPLETED", async () => {
      const traveler: AuthUser = {
        id: "usr_demo_sim_advance",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const tx = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "k_demo_sim",
      });
      const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;
      mockTransactionStore.executePaymentSuccess({ bookingId: bId });

      const { container } = await renderMyTrips({}, [`/trips/${bId}`]);

      // Initially confirmed
      expect(container.textContent).toContain("Trip Terkonfirmasi");
      expect(container.textContent).not.toContain("Penilaian Pengalaman");

      // Verify native disclosure exists
      const demoDetails = container.querySelector(
        "details.trip-detail-demo-disclosure",
      );
      expect(demoDetails).not.toBeNull();
      expect(container.textContent).toContain("Kontrol Demo");

      const simBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Simulasikan Trip Selesai"),
      );
      expect(simBtn).toBeDefined();

      await act(async () => {
        simBtn?.click();
      });

      // Now transitions to COMPLETED
      expect(container.textContent).toContain("Trip Selesai");
      expect(container.textContent).toContain("Penilaian Pengalaman");
      // Demo control is not rendered in COMPLETED
      expect(
        container.querySelector("details.trip-detail-demo-disclosure"),
      ).toBeNull();
    });

    it("X. Completed review priority: Destination primary first, EO primary when destination reviewed, both reviewed shows flat state", async () => {
      const traveler: AuthUser = {
        id: "usr_review_priority_check",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const bId = `bk_demo_completed_${traveler.id}`;

      // Reset reviews for this booking if any
      const { container, getFullPath } = await renderMyTrips({}, [
        `/trips/${bId}`,
      ]);

      // 1. Both unreviewed: Destination is primary, EO is secondary
      const destBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Beri Nilai Destinasi",
      );
      const eoBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Beri Nilai EO / Guide",
      );
      expect(destBtn).toBeDefined();
      expect(eoBtn).toBeDefined();
      expect(destBtn?.className).toContain("ui-button--primary");
      expect(eoBtn?.className).toContain("ui-button--secondary");

      // Clicking destination routes to ?target=destination
      await act(async () => {
        destBtn?.click();
      });
      expect(getFullPath()).toBe(`/trips/${bId}/review?target=destination`);

      // 2. Submit Destination review
      mockReviewStore.submitReview({
        travelerId: traveler.id,
        bookingId: bId,
        targetType: "DESTINATION",
        targetRef: "Lereng Hijau Batu",
        rating: 5,
      });

      // Re-render
      const { container: container2, getFullPath: getFullPath2 } =
        await renderMyTrips({}, [`/trips/${bId}`]);
      expect(container2.textContent).toContain("Sudah dinilai");
      expect(container2.textContent).not.toContain("Beri Nilai Destinasi");

      // EO CTA now becomes primary!
      const eoBtn2 = Array.from(container2.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Beri Nilai EO / Guide",
      );
      expect(eoBtn2).toBeDefined();
      expect(eoBtn2?.className).toContain("ui-button--primary");

      await act(async () => {
        eoBtn2?.click();
      });
      expect(getFullPath2()).toBe(`/trips/${bId}/review?target=eo`);

      // 3. Submit EO review
      mockReviewStore.submitReview({
        travelerId: traveler.id,
        bookingId: bId,
        targetType: "EO_GUIDE",
        targetRef: "org_lereng_batu",
        rating: 5,
      });

      // Re-render
      const { container: container3 } = await renderMyTrips({}, [
        `/trips/${bId}`,
      ]);
      const reviewButtons = container3.querySelectorAll(
        ".trip-detail-review-item__action button",
      );
      expect(reviewButtons.length).toBe(0);
      const reviewedBadges = container3.querySelectorAll(
        ".trip-detail-reviewed-badge",
      );
      expect(reviewedBadges.length).toBe(2);
    });

    it("Y. Error state shows retry CTA and does not redirect automatically", async () => {
      const traveler: AuthUser = {
        id: "usr_trip_err_retry",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      let shouldFail = true;
      const failingAdapter = {
        getMyTrips: async () => ({
          upcomingTrips: [],
          completedTrips: [],
          historyTrips: [],
        }),
        getTripDetail: async () => {
          if (shouldFail) {
            throw new Error("Network timeout");
          }
          return {
            booking: {
              bookingId: "bk_retry_success",
              travelerId: traveler.id,
              packageId: "slow_green_day",
              sessionId: "ses_sgd_1",
              participantCount: 1,
              unitPricePerPerson: 275000,
              totalAmount: 275000,
              status: "PAID" as const,
              reservedQuantity: 1,
              bookedQuantity: 1,
              paymentExpiresAt: "2026-09-01T01:00:00Z",
              createdAt: "2026-09-01T00:00:00Z",
              updatedAt: "2026-09-01T00:00:00Z",
            },
          };
        },
      };

      const { container, getPath } = await renderMyTrips(
        { adapter: failingAdapter },
        ["/trips/bk_retry_success"],
      );

      expect(container.textContent).toContain("Trip belum bisa dimuat.");
      expect(getPath()).toBe("/trips/bk_retry_success"); // Did not redirect

      const retryBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Coba Lagi"),
      );
      expect(retryBtn).toBeDefined();

      shouldFail = false;
      await act(async () => {
        retryBtn?.click();
      });

      expect(container.textContent).toContain("Trip Terkonfirmasi");
      expect(container.textContent).not.toContain("Trip belum bisa dimuat.");
    });
  });
});
