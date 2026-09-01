// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth/types";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MockPaymentAdapter } from "./mockAdapter";
import { PaymentResultScreen } from "./PaymentResultScreen";
import { PaymentScreen } from "./PaymentScreen";

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
  vi.useRealTimers();
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

async function renderPayment(
  bookingId = "bk_test_pay",
  props: { adapter?: MockPaymentAdapter } = {},
  initialEntries: string[] = [`/payment/${bookingId}`],
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
            path: "/payment/:bookingId",
            element: createElement(PaymentScreen, props),
          }),
          createElement(Route, {
            path: "/payment/:bookingId/result",
            element: createElement(PaymentResultScreen, props),
          }),
          createElement(Route, {
            path: "/trips/:bookingId",
            element: createElement("div", undefined, "Trip Detail Target"),
          }),
          createElement(Route, {
            path: "/home",
            element: createElement("div", undefined, "Home Screen Target"),
          }),
        ),
      ),
    );
  });

  return { container, getPath: () => currentPath };
}

describe("Payment & Result Feature (T13, T14, T15) Tests", () => {
  it("1. owner access renders payment summary, exact amount snapshot, countdown & unauthenticated is blocked", async () => {
    const traveler: AuthUser = {
      id: "usr_pay_owner",
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
      idempotencyKey: "k_pay_1",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    const { container } = await renderPayment(bId);

    expect(container.textContent).toContain("Konfirmasi Pembayaran");
    expect(container.textContent).toContain("Rp550.000");
    expect(container.textContent).toContain("Sisa Waktu Pembayaran");
    expect(container.textContent).toContain("Bayar Sekarang");

    // Unauthenticated traveler blocked
    sessionStore.setUser({
      id: "usr_different",
      onboardingStatus: "COMPLETED",
    });
    const { container: blockedContainer } = await renderPayment(bId);
    expect(blockedContainer.textContent).toContain(
      "Pembayaran tidak ditemukan.",
    );
  });

  it("2. Bayar Sekarang triggers VERIFYING state and navigates to Payment Result on success (booking PAID, attempt SUCCEEDED, bookedQuantity updated)", async () => {
    const traveler: AuthUser = {
      id: "usr_pay_succ",
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
      idempotencyKey: "k_pay_succ",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    const { container, getPath } = await renderPayment(bId);

    const payBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Bayar Sekarang"),
    )!;

    await act(async () => {
      payBtn.click();
    });

    // Navigated to /payment/:bookingId/result
    expect(getPath()).toBe(`/payment/${bId}/result`);
    expect(container.textContent).toContain("Pembayaran Berhasil");
    expect(container.textContent).toContain("Siap untuk jedamu!");

    // Store state: Booking PAID, bookedQuantity 2, attempt SUCCEEDED
    const booking = mockTransactionStore.getBookingById(bId);
    expect(booking?.status).toBe("PAID");
    expect(booking?.reservedQuantity).toBe(0);
    expect(booking?.bookedQuantity).toBe(2);

    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bId);
    expect(attempt?.status).toBe("SUCCEEDED");

    // Live capacity still reduced by 2 booked slots
    expect(mockTransactionStore.getOccupiedQuantity("ses_sgd_1")).toBe(2);
  });

  it("3. double payment execution is idempotent and does not increment capacity twice", async () => {
    const traveler: AuthUser = {
      id: "usr_idemp_pay",
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
      idempotencyKey: "k_idemp_pay",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    const adapter = new MockPaymentAdapter();

    const res1 = await adapter.executePayment(bId);
    expect(res1.success).toBe(true);
    expect(mockTransactionStore.getOccupiedQuantity("ses_sgd_1")).toBe(2);

    const res2 = await adapter.executePayment(bId);
    expect(res2.success).toBe(true);
    expect(mockTransactionStore.getOccupiedQuantity("ses_sgd_1")).toBe(2);
  });

  it("4. simulated payment failure leaves booking PENDING_PAYMENT, preserves reservation, and allows Coba Lagi", async () => {
    const traveler: AuthUser = {
      id: "usr_fail_pay",
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
      idempotencyKey: "k_fail_pay",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    const adapter = new MockPaymentAdapter({ simulateFailureCount: 1 });

    const { container, getPath } = await renderPayment(bId, { adapter });

    const payBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Bayar Sekarang"),
    )!;

    await act(async () => {
      payBtn.click();
    });

    expect(getPath()).toBe(`/payment/${bId}/result`);
    expect(container.textContent).toContain("Pembayaran Gagal");
    expect(container.textContent).toContain(
      "Slot pemesananmu masih tersimpan.",
    );

    // Booking remains PENDING_PAYMENT & reservation remains held
    const booking = mockTransactionStore.getBookingById(bId);
    expect(booking?.status).toBe("PENDING_PAYMENT");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(2);

    // Click Coba Lagi returns to Payment Screen
    const retryBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Coba Lagi"),
    )!;

    await act(async () => {
      retryBtn.click();
    });

    expect(getPath()).toBe(`/payment/${bId}`);
  });

  it("5. payment cancellation marks booking CANCELLED and releases capacity", async () => {
    const traveler: AuthUser = {
      id: "usr_cancel_pay",
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
      idempotencyKey: "k_canc_pay",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    const { container, getPath } = await renderPayment(bId);

    const cancelTrigger = container.querySelector<HTMLButtonElement>(
      ".payment-cancel-btn",
    )!;
    await act(async () => {
      cancelTrigger.click();
    });

    const confirmBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Ya, Batalkan",
    )!;
    await act(async () => {
      confirmBtn.click();
    });

    expect(getPath()).toBe(`/payment/${bId}/result`);
    expect(container.textContent).toContain("Pesanan Dibatalkan");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);
  });

  it("6. Payment Result primary action 'Lihat Trip' navigates to /trips/:bookingId", async () => {
    const traveler: AuthUser = {
      id: "usr_res_trip",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_res_trip",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    const { container, getPath } = await renderPayment(bId, {}, [
      `/payment/${bId}/result`,
    ]);

    expect(container.textContent).toContain("Pembayaran Berhasil");

    const lihatTripBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lihat Trip"),
    )!;

    await act(async () => {
      lihatTripBtn.click();
    });

    expect(getPath()).toBe(`/trips/${bId}`);
  });

  it("A. wrong owner execute → rejected with zero mutation and unchanged occupancy", async () => {
    const travelerA: AuthUser = {
      id: "usr_traveler_A",
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
      idempotencyKey: "k_owner_a",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;

    // Switch to Traveler B
    const travelerB: AuthUser = {
      id: "usr_traveler_B",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(travelerB);

    const adapter = new MockPaymentAdapter();
    const res = await adapter.executePayment(bId);

    expect(res.success).toBe(false);

    // Booking unchanged
    const booking = mockTransactionStore.getBookingById(bId);
    expect(booking?.status).toBe("PENDING_PAYMENT");
    expect(booking?.reservedQuantity).toBe(2);
    expect(booking?.bookedQuantity).toBe(0);

    // PaymentAttempt unchanged
    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bId);
    expect(attempt?.status).toBe("PENDING");

    // Occupancy unchanged
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(2);
    expect(mockTransactionStore.getBookedQuantity("ses_sgd_1")).toBe(0);
  });

  it("B. success with missing PaymentAttempt → rejected in store", async () => {
    const booking = {
      bookingId: "bk_missing_attempt",
      travelerId: "usr_1",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "PENDING_PAYMENT" as const,
      reservedQuantity: 1,
      bookedQuantity: 0,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date(Date.now() + 100000).toISOString(),
    };
    mockTransactionStore.addDirectBooking(booking); // No payment attempt added

    const res = mockTransactionStore.executePaymentSuccess({
      bookingId: "bk_missing_attempt",
    });
    expect(res.success).toBe(false);
    expect(res.reason).toBe("INVALID_STATE");

    const saved = mockTransactionStore.getBookingById("bk_missing_attempt");
    expect(saved?.status).toBe("PENDING_PAYMENT");
  });

  it("C. success from CANCELLED/EXPIRED → rejected", async () => {
    const bookingCancelled = {
      bookingId: "bk_canc_test",
      travelerId: "usr_1",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "CANCELLED" as const,
      reservedQuantity: 0,
      bookedQuantity: 0,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date(Date.now() + 100000).toISOString(),
    };
    mockTransactionStore.addDirectBooking(bookingCancelled, {
      paymentAttemptId: "pay_canc",
      bookingId: "bk_canc_test",
      status: "CANCELLED",
      expiresAt: bookingCancelled.paymentExpiresAt,
    });

    const resCanc = mockTransactionStore.executePaymentSuccess({
      bookingId: "bk_canc_test",
    });
    expect(resCanc.success).toBe(false);

    const bookingExpired = {
      bookingId: "bk_exp_test",
      travelerId: "usr_1",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "EXPIRED" as const,
      reservedQuantity: 0,
      bookedQuantity: 0,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date(Date.now() - 100000).toISOString(),
    };
    mockTransactionStore.addDirectBooking(bookingExpired, {
      paymentAttemptId: "pay_exp",
      bookingId: "bk_exp_test",
      status: "EXPIRED",
      expiresAt: bookingExpired.paymentExpiresAt,
    });

    const resExp = mockTransactionStore.executePaymentSuccess({
      bookingId: "bk_exp_test",
    });
    expect(resExp.success).toBe(false);
  });

  it("D. failure cannot mutate PAID", async () => {
    const bookingPaid = {
      bookingId: "bk_paid_immut",
      travelerId: "usr_1",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "PAID" as const,
      reservedQuantity: 0,
      bookedQuantity: 1,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date(Date.now() + 100000).toISOString(),
      paidAt: new Date().toISOString(),
    };
    mockTransactionStore.addDirectBooking(bookingPaid, {
      paymentAttemptId: "pay_paid_immut",
      bookingId: "bk_paid_immut",
      status: "SUCCEEDED",
      expiresAt: bookingPaid.paymentExpiresAt,
    });

    const res = mockTransactionStore.executePaymentFailure({
      bookingId: "bk_paid_immut",
    });
    expect(res.success).toBe(false);
    expect(mockTransactionStore.getBookingById("bk_paid_immut")?.status).toBe(
      "PAID",
    );
  });

  it("E. cancel cannot cancel PAID/COMPLETED", async () => {
    const bookingPaid = {
      bookingId: "bk_paid_no_cancel",
      travelerId: "usr_1",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "PAID" as const,
      reservedQuantity: 0,
      bookedQuantity: 1,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date(Date.now() + 100000).toISOString(),
      paidAt: new Date().toISOString(),
    };
    mockTransactionStore.addDirectBooking(bookingPaid, {
      paymentAttemptId: "pay_no_canc",
      bookingId: "bk_paid_no_cancel",
      status: "SUCCEEDED",
      expiresAt: bookingPaid.paymentExpiresAt,
    });

    const res = mockTransactionStore.cancelPendingBooking({
      travelerId: "usr_1",
      bookingId: "bk_paid_no_cancel",
    });
    expect(res.success).toBe(false);
    expect(
      mockTransactionStore.getBookingById("bk_paid_no_cancel")?.status,
    ).toBe("PAID");
  });

  it("F. countdown zero + revalidation error → NOT EXPIRED, reservation still held", async () => {
    vi.useFakeTimers();
    const baseNow = new Date("2026-08-31T12:00:00.000Z").getTime();
    vi.setSystemTime(baseNow);

    const traveler: AuthUser = {
      id: "usr_cd_err",
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
      idempotencyKey: "k_cd_err",
      nowMs: baseNow,
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;

    // Create adapter that fails on subsequent getPayment calls
    const adapter = new MockPaymentAdapter({ now: () => new Date(baseNow) });
    const origGetPayment = adapter.getPayment.bind(adapter);
    let callCount = 0;
    adapter.getPayment = async (id: string) => {
      callCount++;
      if (callCount > 1) {
        throw new Error("Network error");
      }
      return origGetPayment(id);
    };

    const { container } = await renderPayment(bId, { adapter });
    expect(container.textContent).toContain("Konfirmasi Pembayaran");

    // Advance client timer by 15 mins so countdown hits zero, but freeze system time for store check or check unexpired store record
    await act(async () => {
      vi.advanceTimersByTime(15 * 60 * 1000);
    });

    // Should show recoverable error notice without falsely stating expired
    expect(container.textContent).toContain(
      "Status pembayaran belum bisa diverifikasi. Coba lagi.",
    );
    expect(container.textContent).not.toContain(
      "Waktu pembayaran telah habis.",
    );
    expect(container.textContent).toContain("Rp550.000");

    // Reservation is still held in store
    const booking = mockTransactionStore.getBookingById(bId);
    expect(booking?.status).toBe("PENDING_PAYMENT");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1", baseNow)).toBe(
      2,
    );
  });

  it("G. paid /payment direct reopen → result recovery, not 'Pembayaran tidak ditemukan'", async () => {
    const traveler: AuthUser = {
      id: "usr_reopen_paid",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_reopen",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    mockTransactionStore.executePaymentSuccess({ bookingId: bId });

    // Open /payment/:bookingId directly
    const { container, getPath } = await renderPayment(bId);

    expect(getPath()).toBe(`/payment/${bId}/result`);
    expect(container.textContent).toContain("Pembayaran Berhasil");
    expect(container.textContent).not.toContain("Pembayaran tidak ditemukan.");
  });

  it("H. pending result URL → not falsely FAILED", async () => {
    const traveler: AuthUser = {
      id: "usr_pending_res",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_pend_res",
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;

    const { container } = await renderPayment(bId, {}, [
      `/payment/${bId}/result`,
    ]);

    expect(container.textContent).toContain("Pembayaran Belum Selesai");
    expect(container.textContent).not.toContain("Pembayaran Gagal");
    expect(container.textContent).toContain("Lanjutkan Pembayaran");
  });

  it("J. FAILED attempt + expiry → Booking EXPIRED, attempt EXPIRED, reservation released", () => {
    const baseNow = new Date("2026-08-31T12:00:00.000Z").getTime();
    mockTransactionStore.createTransaction({
      travelerId: "usr_fail_exp",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_fail_exp",
      nowMs: baseNow,
    });

    const bId = mockTransactionStore.getBookings()[0].bookingId;
    mockTransactionStore.executePaymentFailure({
      bookingId: bId,
      nowMs: baseNow,
    });

    // Attempt is FAILED, booking is PENDING_PAYMENT
    const attempt1 = mockTransactionStore.getPaymentAttemptForBooking(bId);
    expect(attempt1?.status).toBe("FAILED");

    // Advance time past expiry and reconcile
    mockTransactionStore.reconcileExpiredPendingPayments(
      baseNow + 16 * 60 * 1000,
    );

    const bookingExp = mockTransactionStore.getBookingById(bId);
    const attemptExp = mockTransactionStore.getPaymentAttemptForBooking(bId);

    expect(bookingExp?.status).toBe("EXPIRED");
    expect(attemptExp?.status).toBe("EXPIRED");
    expect(
      mockTransactionStore.getReservedQuantity(
        "ses_sgd_1",
        baseNow + 16 * 60 * 1000,
      ),
    ).toBe(0);
  });

  it("K. missing or inconsistent PaymentAttempt → Payment page not actionable ACTIVE (renders ERROR/NOT_FOUND)", async () => {
    const traveler: AuthUser = {
      id: "usr_inconsist",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const booking = {
      bookingId: "bk_inconsistent",
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      totalAmount: 275000,
      status: "PENDING_PAYMENT" as const,
      reservedQuantity: 1,
      bookedQuantity: 0,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date(Date.now() + 100000).toISOString(),
    };
    mockTransactionStore.addDirectBooking(booking); // No attempt added

    const adapter = new MockPaymentAdapter();
    const res = await adapter.getPayment("bk_inconsistent");
    expect(res.state).toBe("ERROR");

    const { container } = await renderPayment("bk_inconsistent", { adapter });
    expect(container.textContent).not.toContain("Bayar Sekarang");
  });
});
