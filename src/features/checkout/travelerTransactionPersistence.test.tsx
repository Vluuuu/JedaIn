// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { AuthUser } from "../auth/types";
import { sessionStore } from "../onboarding/sessionStore";
import { MockPaymentAdapter } from "../payment/mockAdapter";
import { PaymentResultScreen } from "../payment/PaymentResultScreen";
import { MockProfileAdapter } from "../profile/mockAdapter";
import { MockTripsAdapter } from "../trips/mockAdapter";
import { TripDetailScreen } from "../trips/TripDetailScreen";
import {
  CHECKOUT_MVP_CONFIG,
  mockTransactionStore,
  TRAVELER_TRANSACTIONS_STORAGE_KEY,
} from "./mockTransactionStore";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  sessionStore.reset();
  mockTransactionStore.reset();
  window.sessionStorage.clear();
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
  mockTransactionStore.reset();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

async function renderComponent(
  initialEntries: string[],
  routes: Array<{ path: string; element: React.ReactElement }>,
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
          routes.map((r) =>
            createElement(Route, {
              key: r.path,
              path: r.path,
              element: r.element,
            }),
          ),
        ),
      ),
    );
  });

  return container;
}

describe("F4.1 — Traveler Transaction Session Persistence (TR-01)", () => {
  const traveler: AuthUser = {
    id: "usr_tx_persist_1",
    name: "Traveler Persist",
    email: "persist@traveler.id",
    phone: "081234567890",
    onboardingStatus: "COMPLETED",
  };

  it("1. a newly-created PENDING_PAYMENT Booking and PaymentAttempt are written to sessionStorage", () => {
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_pending_1",
    });

    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const raw = window.sessionStorage.getItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
    );
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.bookings).toHaveLength(1);
    expect(parsed.bookings[0].bookingId).toBe(tx.booking.bookingId);
    expect(parsed.bookings[0].status).toBe("PENDING_PAYMENT");
    expect(parsed.bookings[0].reservedQuantity).toBe(2);
    expect(parsed.bookings[0].bookedQuantity).toBe(0);

    expect(parsed.paymentAttempts).toHaveLength(1);
    expect(parsed.paymentAttempts[0].paymentAttemptId).toBe(
      tx.payment.paymentAttemptId,
    );
    expect(parsed.paymentAttempts[0].status).toBe("PENDING");
  });

  it("2. hydration restores the same pending Booking ID and PaymentAttempt after memory is cleared", () => {
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_hydrate_2",
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const createdBookingId = tx.booking.bookingId;
    const createdAttemptId = tx.payment.paymentAttemptId;

    // Simulate same-tab refresh by wiping in-memory state without touching sessionStorage
    mockTransactionStore.clearMemoryForTesting();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);
    expect(mockTransactionStore.getPaymentAttempts()).toHaveLength(0);

    // Hydrate from sessionStorage
    mockTransactionStore.hydrateFromStorage();

    expect(mockTransactionStore.getBookings()).toHaveLength(1);
    const restoredBooking =
      mockTransactionStore.getBookingById(createdBookingId);
    expect(restoredBooking).toBeDefined();
    expect(restoredBooking?.status).toBe("PENDING_PAYMENT");
    expect(restoredBooking?.travelerId).toBe(traveler.id);
    expect(restoredBooking?.sessionId).toBe("ses_sgd_1");
    expect(restoredBooking?.participantCount).toBe(2);
    expect(restoredBooking?.reservedQuantity).toBe(2);

    const restoredAttempt =
      mockTransactionStore.getPaymentAttemptForBooking(createdBookingId);
    expect(restoredAttempt).toBeDefined();
    expect(restoredAttempt?.paymentAttemptId).toBe(createdAttemptId);
    expect(restoredAttempt?.status).toBe("PENDING");
  });

  it("3. a paid Booking survives hydration with correct booked/reserved quantities and SUCCEEDED attempt", () => {
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_paid_3",
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const bId = tx.booking.bookingId;
    const payRes = mockTransactionStore.executePaymentSuccess({
      bookingId: bId,
    });
    expect(payRes.success).toBe(true);

    // Clear memory and rehydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    const restored = mockTransactionStore.getBookingById(bId);
    expect(restored).toBeDefined();
    expect(restored?.status).toBe("PAID");
    expect(restored?.bookedQuantity).toBe(2);
    expect(restored?.reservedQuantity).toBe(0);
    expect(restored?.paidAt).toBeDefined();

    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bId);
    expect(attempt?.status).toBe("SUCCEEDED");
  });

  it("4. a demo-completed Booking survives hydration as COMPLETED with paidAt and completedAt intact", () => {
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_completed_4",
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const bId = tx.booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });
    const compRes = mockTransactionStore.completePaidBookingForDemo({
      travelerId: traveler.id,
      bookingId: bId,
    });
    expect(compRes.success).toBe(true);

    // Clear memory and hydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    const restored = mockTransactionStore.getBookingById(bId);
    expect(restored).toBeDefined();
    expect(restored?.status).toBe("COMPLETED");
    expect(restored?.bookedQuantity).toBe(1);
    expect(restored?.reservedQuantity).toBe(0);
    expect(restored?.paidAt).toBeDefined();
    expect(restored?.completedAt).toBeDefined();
  });

  it("5. direct Payment Result resolution after hydration finds the same Booking without router state", async () => {
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_result_5",
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const bId = tx.booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    // Simulate same-tab page refresh directly onto /payment/:bookingId/result
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    const paymentAdapter = new MockPaymentAdapter();
    const resultVm = await paymentAdapter.getPaymentResult(bId);
    expect(resultVm.status).toBe("SUCCESS");
    expect(resultVm.booking?.bookingId).toBe(bId);

    // Render PaymentResultScreen directly with no initial router state
    const view = await renderComponent(
      [`/payment/${bId}/result`],
      [
        {
          path: "/payment/:bookingId/result",
          element: createElement(PaymentResultScreen, {
            adapter: paymentAdapter,
          }),
        },
      ],
    );

    expect(view.textContent).toContain("Pembayaran Berhasil");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).not.toContain("Pembayaran tidak ditemukan");
  });

  it("6. My Trips / Trip Detail resolves restored paid/completed Booking after hydration", async () => {
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_trips_6",
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const bId = tx.booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    // Clear memory and rehydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    const tripsAdapter = new MockTripsAdapter();
    const myTrips = await tripsAdapter.getMyTrips();
    expect(myTrips.upcomingTrips.some((t) => t.booking.bookingId === bId)).toBe(
      true,
    );

    const tripDetail = await tripsAdapter.getTripDetail(bId);
    expect(tripDetail).not.toBeNull();
    expect(tripDetail?.booking.bookingId).toBe(bId);
    expect(tripDetail?.booking.status).toBe("PAID");

    // Render TripDetailScreen directly
    const view = await renderComponent(
      [`/trips/${bId}`],
      [
        {
          path: "/trips/:bookingId",
          element: createElement(TripDetailScreen, { adapter: tripsAdapter }),
        },
      ],
    );

    expect(view.textContent).toContain("Trip Terkonfirmasi");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).not.toContain("Trip tidak ditemukan.");
  });

  it("7. expired persisted PENDING_PAYMENT reconciles to EXPIRED and does not regain reservation", () => {
    sessionStore.setUser(traveler);

    const baseNow = new Date("2026-09-01T10:00:00.000Z").getTime();
    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_exp_7",
      nowMs: baseNow,
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const bId = tx.booking.bookingId;

    // Clear memory and hydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    // Fast-forward past 15-minute timeout
    const expiredNow =
      baseNow + (CHECKOUT_MVP_CONFIG.paymentTimeoutMinutes + 1) * 60 * 1000;
    mockTransactionStore.reconcileExpiredPendingPayments(expiredNow);

    const booking = mockTransactionStore.getBookingById(bId);
    expect(booking?.status).toBe("EXPIRED");
    expect(booking?.reservedQuantity).toBe(0);

    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bId);
    expect(attempt?.status).toBe("EXPIRED");

    // Reserved quantity in store is zero (no reservation regain)
    expect(
      mockTransactionStore.getReservedQuantity("ses_sgd_1", expiredNow),
    ).toBe(0);
  });

  it("8. refresh/hydration does NOT reset paymentExpiresAt", () => {
    sessionStore.setUser(traveler);

    const baseNow = new Date("2026-09-01T10:00:00.000Z").getTime();
    const tx = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_persist_no_reset_8",
      nowMs: baseNow,
    });
    expect(tx.success).toBe(true);
    if (!tx.success) return;

    const originalExpiresAt = tx.booking.paymentExpiresAt;

    // Clear memory and hydrate 5 minutes later
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    const restored = mockTransactionStore.getBookingById(tx.booking.bookingId);
    expect(restored?.paymentExpiresAt).toBe(originalExpiresAt);
    expect(restored?.paymentExpiresAt).not.toContain("10:20"); // Was not pushed forward
  });

  it("9. malformed JSON fails safely and clears invalid persisted state from storage", () => {
    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      "MALFORMED_JSON_{{{bad",
    );

    expect(() => {
      mockTransactionStore.hydrateFromStorage();
    }).not.toThrow();

    expect(mockTransactionStore.getBookings()).toHaveLength(0);
    // Malformed storage key is cleared
    expect(
      window.sessionStorage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY),
    ).toBeNull();
  });

  it("10. structurally invalid status/state fails safely without fabricating paid/completed bookings", () => {
    // 10a. Invalid status MAGIC_PAID
    const invalidStatusPayload = {
      version: 1,
      bookings: [
        {
          bookingId: "bk_invalid",
          travelerId: "usr_attacker",
          packageId: "slow_green_day",
          sessionId: "ses_sgd_1",
          participantCount: 1,
          unitPricePerPerson: 275000,
          totalAmount: 275000,
          status: "MAGIC_PAID",
          reservedQuantity: 0,
          bookedQuantity: 1,
          createdAt: new Date().toISOString(),
          paymentExpiresAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
        },
      ],
      paymentAttempts: [],
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(invalidStatusPayload),
    );
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);
    expect(
      window.sessionStorage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY),
    ).toBeNull();

    // 10b. Persisted PAID booking with NO matching PaymentAttempt -> rejected
    const paidNoAttemptPayload = {
      version: 1,
      bookings: [
        {
          bookingId: "bk_paid_no_attempt",
          travelerId: "usr_attacker",
          packageId: "slow_green_day",
          sessionId: "ses_sgd_1",
          participantCount: 1,
          unitPricePerPerson: 275000,
          totalAmount: 275000,
          status: "PAID",
          reservedQuantity: 0,
          bookedQuantity: 1,
          createdAt: new Date().toISOString(),
          paymentExpiresAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
        },
      ],
      paymentAttempts: [], // Missing attempt!
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(paidNoAttemptPayload),
    );
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);
    expect(
      window.sessionStorage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY),
    ).toBeNull();

    // 10c. Persisted PAID booking with missing paidAt -> rejected
    const paidMissingTimestampPayload = {
      version: 1,
      bookings: [
        {
          bookingId: "bk_paid_no_time",
          travelerId: "usr_attacker",
          packageId: "slow_green_day",
          sessionId: "ses_sgd_1",
          participantCount: 1,
          unitPricePerPerson: 275000,
          totalAmount: 275000,
          status: "PAID",
          reservedQuantity: 0,
          bookedQuantity: 1,
          createdAt: new Date().toISOString(),
          paymentExpiresAt: new Date().toISOString(),
          // missing paidAt!
        },
      ],
      paymentAttempts: [
        {
          paymentAttemptId: "pay_att_1",
          bookingId: "bk_paid_no_time",
          status: "SUCCEEDED",
          expiresAt: new Date().toISOString(),
        },
      ],
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(paidMissingTimestampPayload),
    );
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);

    // 10d. Persisted COMPLETED booking with no SUCCEEDED matching attempt -> rejected
    const completedPendingAttemptPayload = {
      version: 1,
      bookings: [
        {
          bookingId: "bk_comp_pending_att",
          travelerId: "usr_attacker",
          packageId: "slow_green_day",
          sessionId: "ses_sgd_1",
          participantCount: 1,
          unitPricePerPerson: 275000,
          totalAmount: 275000,
          status: "COMPLETED",
          reservedQuantity: 0,
          bookedQuantity: 1,
          createdAt: new Date().toISOString(),
          paymentExpiresAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      ],
      paymentAttempts: [
        {
          paymentAttemptId: "pay_att_2",
          bookingId: "bk_comp_pending_att",
          status: "PENDING", // Incoherent! Completed booking cannot have PENDING attempt
          expiresAt: new Date().toISOString(),
        },
      ],
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(completedPendingAttemptPayload),
    );
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);

    // 10e. Persisted COMPLETED booking missing completedAt -> rejected
    const completedMissingDatePayload = {
      version: 1,
      bookings: [
        {
          bookingId: "bk_comp_no_date",
          travelerId: "usr_attacker",
          packageId: "slow_green_day",
          sessionId: "ses_sgd_1",
          participantCount: 1,
          unitPricePerPerson: 275000,
          totalAmount: 275000,
          status: "COMPLETED",
          reservedQuantity: 0,
          bookedQuantity: 1,
          createdAt: new Date().toISOString(),
          paymentExpiresAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          // missing completedAt!
        },
      ],
      paymentAttempts: [
        {
          paymentAttemptId: "pay_att_3",
          bookingId: "bk_comp_no_date",
          status: "SUCCEEDED",
          expiresAt: new Date().toISOString(),
        },
      ],
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(completedMissingDatePayload),
    );
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);

    // 10f. Persisted PAID/COMPLETED booking with payment attempt belonging to another booking -> rejected
    const mismatchedBookingAttemptPayload = {
      version: 1,
      bookings: [
        {
          bookingId: "bk_paid_real",
          travelerId: "usr_attacker",
          packageId: "slow_green_day",
          sessionId: "ses_sgd_1",
          participantCount: 1,
          unitPricePerPerson: 275000,
          totalAmount: 275000,
          status: "PAID",
          reservedQuantity: 0,
          bookedQuantity: 1,
          createdAt: new Date().toISOString(),
          paymentExpiresAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
        },
      ],
      paymentAttempts: [
        {
          paymentAttemptId: "pay_att_other",
          bookingId: "bk_other_booking", // Mismatched bookingId!
          status: "SUCCEEDED",
          expiresAt: new Date().toISOString(),
        },
      ],
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(mismatchedBookingAttemptPayload),
    );
    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);
  });

  it("11. storage get/set exceptions do not crash normal in-memory operation", () => {
    sessionStore.setUser(traveler);

    // Mock sessionStorage.setItem to throw QuotaExceededError
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => {
      const res = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "slow_green_day",
        sessionId: "ses_sgd_1",
        participantCount: 1,
        unitPricePerPerson: 275000,
        capacitySnapshot: 6,
        idempotencyKey: "k_storage_throw_11",
      });
      expect(res.success).toBe(true);
    }).not.toThrow();

    // In-memory operation still succeeded
    expect(mockTransactionStore.getBookings()).toHaveLength(1);

    // Mock sessionStorage.getItem to throw SecurityError
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access Denied");
    });

    expect(() => {
      mockTransactionStore.hydrateFromStorage();
    }).not.toThrow();
  });

  it("12. explicit reset clears shared transaction data, but normal Traveler logout does NOT delete shared ledger", async () => {
    const travelerA: AuthUser = {
      id: "usr_alice_12",
      name: "Alice",
      onboardingStatus: "COMPLETED",
    };
    const travelerB: AuthUser = {
      id: "usr_bob_12",
      name: "Bob",
      onboardingStatus: "COMPLETED",
    };

    // 1. Traveler A creates and pays booking
    sessionStore.setUser(travelerA);
    const txA = mockTransactionStore.createTransaction({
      travelerId: travelerA.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_alice_12",
    });
    expect(txA.success).toBe(true);
    if (!txA.success) return;

    const bId = txA.booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    expect(
      window.sessionStorage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY),
    ).not.toBeNull();

    // 2. Normal Traveler logout via MockProfileAdapter (simulating settings screen)
    const profileAdapter = new MockProfileAdapter();
    await profileAdapter.logout();

    // Traveler session is cleared
    expect(sessionStore.get().user).toBeNull();

    // Authoritative shared transaction ledger still contains the booking in memory and storage!
    expect(mockTransactionStore.getBookings()).toHaveLength(1);
    expect(mockTransactionStore.getBookingById(bId)?.status).toBe("PAID");
    expect(
      window.sessionStorage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY),
    ).not.toBeNull();

    // 3. Traveler B logs in
    sessionStore.setUser(travelerB);

    // Traveler B cannot read Traveler A's Payment Result / Trip Detail / My Trips
    const paymentAdapter = new MockPaymentAdapter();
    const resultB = await paymentAdapter.getPaymentResult(bId);
    expect(resultB.status).toBe("NOT_FOUND");

    const tripsAdapter = new MockTripsAdapter();
    const myTripsB = await tripsAdapter.getMyTrips();
    expect(
      myTripsB.upcomingTrips.some((t) => t.booking.bookingId === bId),
    ).toBe(false);

    const tripDetailB = await tripsAdapter.getTripDetail(bId);
    expect(tripDetailB).toBeNull();

    // Shared ledger itself remains intact
    expect(mockTransactionStore.getBookings()).toHaveLength(1);

    // 4. Explicit mockTransactionStore.reset() (e.g. demo reset) clears memory and storage
    mockTransactionStore.reset();
    expect(mockTransactionStore.getBookings()).toHaveLength(0);
    expect(
      window.sessionStorage.getItem(TRAVELER_TRANSACTIONS_STORAGE_KEY),
    ).toBeNull();
  });

  it("13. no cross-user transaction is exposed through adapter ownership checks", async () => {
    const travelerA: AuthUser = {
      id: "usr_alice",
      onboardingStatus: "COMPLETED",
    };
    const travelerB: AuthUser = {
      id: "usr_bob",
      onboardingStatus: "COMPLETED",
    };

    sessionStore.setUser(travelerA);
    const txA = mockTransactionStore.createTransaction({
      travelerId: travelerA.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_alice_13",
    });
    expect(txA.success).toBe(true);
    if (!txA.success) return;

    const bIdA = txA.booking.bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bIdA });

    // Clear memory and rehydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    // Switch session to Traveler B
    sessionStore.setUser(travelerB);

    const paymentAdapter = new MockPaymentAdapter();
    const resultB = await paymentAdapter.getPaymentResult(bIdA);
    expect(resultB.status).toBe("NOT_FOUND");

    const tripsAdapter = new MockTripsAdapter();
    const tripsB = await tripsAdapter.getMyTrips();
    expect(tripsB.upcomingTrips.some((t) => t.booking.bookingId === bIdA)).toBe(
      false,
    );

    const tripDetailB = await tripsAdapter.getTripDetail(bIdA);
    expect(tripDetailB).toBeNull();
  });

  it("14. existing one-active-pending invariant remains green after hydration", () => {
    sessionStore.setUser(traveler);

    const tx1 = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_active_pending_14_a",
    });
    expect(tx1.success).toBe(true);

    // Clear memory and rehydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    // Attempting another transaction for same traveler while pending is active fails
    const tx2 = mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_active_pending_14_b",
    });

    expect(tx2.success).toBe(false);
    if (!tx2.success) {
      expect(tx2.reason).toBe("ACTIVE_PENDING_PAYMENT");
    }
  });

  it("15. existing payment idempotency replay remains green after hydration and incoherent entries are skipped", () => {
    sessionStore.setUser(traveler);

    const input = {
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_replay_idemp_15",
    };

    const tx1 = mockTransactionStore.createTransaction(input);
    expect(tx1.success).toBe(true);
    if (!tx1.success) return;

    const initialBookingId = tx1.booking.bookingId;

    // Clear memory and rehydrate
    mockTransactionStore.clearMemoryForTesting();
    mockTransactionStore.hydrateFromStorage();

    // Replay with exact same input and idempotencyKey
    const tx2 = mockTransactionStore.createTransaction(input);
    expect(tx2.success).toBe(true);
    if (!tx2.success) return;

    // Returns exact same booking without duplicate
    expect(tx2.booking.bookingId).toBe(initialBookingId);
    expect(mockTransactionStore.getBookings()).toHaveLength(1);

    // Conflict detection on parameter mismatch with same idempotencyKey
    const conflictTx = mockTransactionStore.createTransaction({
      ...input,
      participantCount: 3, // Mismatched participantCount
    });
    expect(conflictTx.success).toBe(false);
    if (!conflictTx.success) {
      expect(conflictTx.reason).toBe("IDEMPOTENCY_CONFLICT");
    }
  });

  it("16. incoherent persisted idempotency entries (mismatched paymentAttempt or inputs) are skipped during hydration", () => {
    const validBooking = {
      bookingId: "bk_idemp_coherent",
      travelerId: "usr_coherent",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "PENDING_PAYMENT" as const,
      reservedQuantity: 1,
      bookedQuantity: 0,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date().toISOString(),
    };

    const validAttempt = {
      paymentAttemptId: "pay_idemp_coherent",
      bookingId: "bk_idemp_coherent",
      status: "PENDING" as const,
      expiresAt: new Date().toISOString(),
    };

    const payloadWithIncoherentIdempotency = {
      version: 1,
      bookings: [validBooking],
      paymentAttempts: [validAttempt],
      idempotency: [
        // Incoherent entry 1: paymentAttempt belongs to another booking
        {
          key: "k_incoherent_1",
          input: {
            travelerId: "usr_coherent",
            sessionId: "ses_sgd_1",
            participantCount: 1,
            unitPricePerPerson: 275000,
          },
          bookingId: "bk_idemp_coherent",
          paymentAttemptId: "pay_different_attempt",
        },
        // Incoherent entry 2: input mismatch (participantCount: 5 vs booking.participantCount: 1)
        {
          key: "k_incoherent_2",
          input: {
            travelerId: "usr_coherent",
            sessionId: "ses_sgd_1",
            participantCount: 5,
            unitPricePerPerson: 275000,
          },
          bookingId: "bk_idemp_coherent",
          paymentAttemptId: "pay_idemp_coherent",
        },
        // Coherent entry
        {
          key: "k_coherent_valid",
          input: {
            travelerId: "usr_coherent",
            sessionId: "ses_sgd_1",
            participantCount: 1,
            unitPricePerPerson: 275000,
          },
          bookingId: "bk_idemp_coherent",
          paymentAttemptId: "pay_idemp_coherent",
        },
      ],
    };

    window.sessionStorage.setItem(
      TRAVELER_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(payloadWithIncoherentIdempotency),
    );

    mockTransactionStore.hydrateFromStorage();
    expect(mockTransactionStore.getBookings()).toHaveLength(1);

    // k_incoherent_1 was skipped
    expect(
      mockTransactionStore.getIdempotentTransaction("k_incoherent_1"),
    ).toBeUndefined();

    // k_incoherent_2 was skipped
    expect(
      mockTransactionStore.getIdempotentTransaction("k_incoherent_2"),
    ).toBeUndefined();

    // k_coherent_valid was restored
    const coherent =
      mockTransactionStore.getIdempotentTransaction("k_coherent_valid");
    expect(coherent).toBeDefined();
    expect(coherent?.result?.booking.bookingId).toBe("bk_idemp_coherent");
  });
});
