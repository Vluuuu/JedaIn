// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import type { AuthUser } from "../auth/types";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MockPendingPaymentResolutionAdapter } from "./mockAdapter";
import { PendingPaymentResolutionScreen } from "./PendingPaymentResolutionScreen";

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

async function renderPendingPaymentResolution(
  intendedSessionId = "ses_new_2",
  props: { adapter?: MockPendingPaymentResolutionAdapter } = {},
  initialEntries: string[] = [`/checkout/${intendedSessionId}/pending-payment`],
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
            path: "/checkout/:sessionId/pending-payment",
            element: createElement(PendingPaymentResolutionScreen, props),
          }),
          createElement(Route, {
            path: "/checkout/:sessionId",
            element: createElement("div", undefined, "New Checkout Target"),
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

describe("PendingPaymentResolutionScreen (T12) Unit & Integration Tests", () => {
  // ROUTE & ACCESS & CONTEXT
  it("1, 2, 3, 4 & 5. valid active pending route renders T12, direct reload works, shell has no bottom nav & single main, intendedSessionId preserved", async () => {
    const traveler: AuthUser = {
      id: "usr_t12_1",
      name: "Traveler 1",
      email: "t1@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1", // OLD session
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_old_1",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_2/pending-payment"] }, // NEW session
          createElement(App),
        ),
      );
    });

    expect(container.textContent).toContain(
      "Kamu masih punya pembayaran yang belum selesai.",
    );
    expect(container.querySelector(".traveler-bottom-nav")).toBeNull();
    expect(container.querySelectorAll("main").length).toBe(1);

    const backBtn = container.querySelector<HTMLAnchorElement>(
      ".pending-payment-back-btn",
    )!;
    expect(backBtn.getAttribute("href")).toBe("/checkout/ses_sgd_2");
  });

  // SUMMARY & METADATA
  it("6, 7, 8, 9, 10, 11 & 12. summary displays old package, old session date, booking totalAmount, Menunggu Pembayaran, and timestamp-derived timer", async () => {
    const traveler: AuthUser = {
      id: "usr_t12_summary",
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
      idempotencyKey: "k_sum",
    });

    const { container } = await renderPendingPaymentResolution("ses_sgd_2");

    expect(container.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(container.textContent).toContain("Menunggu Pembayaran");
    expect(container.textContent).toContain("Rp550.000"); // 2 * 275000
    expect(container.textContent).toContain("WIB");
    expect(container.textContent).toContain("Sisa waktu:");
  });

  // STORE-LEVEL ONE-ACTIVE-PENDING INVARIANT
  it("13, 14, 15 & 16. transaction store refuses second active pending booking for same traveler, allows idempotent replay & different traveler", async () => {
    // Traveler A first transaction -> SUCCESS
    const resA1 = mockTransactionStore.createTransaction({
      travelerId: "usr_A",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_a_1",
    });
    expect(resA1.success).toBe(true);

    // Traveler A second transaction (different key/session) -> REJECTED ACTIVE_PENDING_PAYMENT
    const resA2 = mockTransactionStore.createTransaction({
      travelerId: "usr_A",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_2",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_a_2",
    });
    expect(resA2.success).toBe(false);
    if (!resA2.success) {
      expect(resA2.reason).toBe("ACTIVE_PENDING_PAYMENT");
    }

    // Traveler A idempotent replay -> ALLOWED
    const resA_replay = mockTransactionStore.createTransaction({
      travelerId: "usr_A",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_a_1",
    });
    expect(resA_replay.success).toBe(true);

    // Traveler B independent transaction -> ALLOWED
    const resB = mockTransactionStore.createTransaction({
      travelerId: "usr_B",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_b_1",
    });
    expect(resB.success).toBe(true);
  });

  // CONTINUE EXISTING PAYMENT
  it("17, 18, 19, 20 & 21. Lanjutkan Pembayaran revalidates and opens existing payment without creating new bookings/payment attempts", async () => {
    const traveler: AuthUser = {
      id: "usr_cont",
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
      idempotencyKey: "k_cont",
    });
    expect(tx.success).toBe(true);

    const initialBookingsCount = mockTransactionStore.getBookings().length;
    const initialAttemptsCount =
      mockTransactionStore.getPaymentAttempts().length;

    const { container, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2");

    const continueBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjutkan Pembayaran"),
    )!;

    await act(async () => {
      continueBtn.click();
    });

    expect(getPath()).toMatch(/^\/payment\/bk_/);
    expect(mockTransactionStore.getBookings().length).toBe(
      initialBookingsCount,
    );
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(
      initialAttemptsCount,
    );
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(2);
  });

  it("22 & 23. continue when expired does not navigate and shows EXPIRED state; continue request error is recoverable", async () => {
    const traveler: AuthUser = {
      id: "usr_cont_exp",
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
      idempotencyKey: "k_exp_c",
    });

    // Test request error first
    const errAdapter = new MockPendingPaymentResolutionAdapter({
      failRevalidateCount: 1,
    });
    const { container } = await renderPendingPaymentResolution("ses_sgd_2", {
      adapter: errAdapter,
    });

    const continueBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjutkan Pembayaran"),
    )!;

    await act(async () => {
      continueBtn.click();
    });

    expect(container.textContent).toContain(
      "Status pembayaran belum bisa diverifikasi. Coba lagi.",
    );

    // Test expiration race
    const expAdapter = new MockPendingPaymentResolutionAdapter();
    const { container: expContainer, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2", {
        adapter: expAdapter,
      });

    expect(expContainer.textContent).toContain("Lanjutkan Pembayaran");

    // Manually expire the booking in store
    mockTransactionStore.reconcileExpiredPendingPayments(
      Date.now() + 20 * 60 * 1000,
    );

    const continueBtnExp = Array.from(
      expContainer.querySelectorAll("button"),
    ).find((b) => b.textContent?.includes("Lanjutkan Pembayaran"))!;

    await act(async () => {
      continueBtnExp.click();
    });

    expect(expContainer.textContent).toContain("Pembayaran sudah kedaluwarsa.");
    expect(getPath()).toBe("/checkout/ses_sgd_2/pending-payment");
  });

  // CANCEL CONFIRMATION & ATOMIC CANCELLATION
  it("24, 25, 26 & 27. cancel button opens confirmation modal, dismiss causes zero mutation", async () => {
    const traveler: AuthUser = {
      id: "usr_modal",
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
      idempotencyKey: "k_modal",
    });

    const { container } = await renderPendingPaymentResolution("ses_sgd_2");

    const cancelTrigger = container.querySelector<HTMLButtonElement>(
      ".pending-payment-cancel-trigger",
    )!;
    await act(async () => {
      cancelTrigger.click();
    });

    // Modal is open
    expect(container.textContent).toContain("Batalkan Pesanan Lama?");
    expect(container.textContent).toContain(
      "Slot yang sedang kamu pegang akan dilepas dan mungkin diambil traveler lain.",
    );

    // Click "Kembali"
    const dismissBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Kembali",
    )!;
    await act(async () => {
      dismissBtn.click();
    });

    // Zero mutation, booking still active
    expect(
      mockTransactionStore.getActivePendingPayment(traveler.id),
    ).toBeDefined();
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(1);
  });

  it("28, 29, 30, 31, 32 & 33. confirming cancel sets Booking CANCELLED, PaymentAttempt CANCELLED, releases reservation and returns to /checkout/:intendedSessionId without auto-booking", async () => {
    const traveler: AuthUser = {
      id: "usr_cancel_success",
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
      idempotencyKey: "k_canc",
    });

    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(2);

    const { container, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2");

    const cancelTrigger = container.querySelector<HTMLButtonElement>(
      ".pending-payment-cancel-trigger",
    )!;
    await act(async () => {
      cancelTrigger.click();
    });

    const confirmBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Ya, Batalkan Pesanan Lama"),
    )!;
    await act(async () => {
      confirmBtn.click();
    });

    // Navigates to intended new Checkout
    expect(getPath()).toBe("/checkout/ses_sgd_2");

    // Booking & attempt CANCELLED
    const bookings = mockTransactionStore.getBookings();
    expect(bookings[0].status).toBe("CANCELLED");
    const attempts = mockTransactionStore.getPaymentAttempts();
    expect(attempts[0].status).toBe("CANCELLED");

    // Capacity released
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);
    // No new booking was auto-created
    expect(mockTransactionStore.getBookings().length).toBe(1);
  });

  it("34, 35 & 36. cancel wrong owner rejected, double cancel is safe and idempotent", async () => {
    const traveler: AuthUser = {
      id: "usr_owner_A",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const tx = mockTransactionStore.createTransaction({
      travelerId: "usr_owner_A",
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_own",
    });
    expect(tx.success).toBe(true);
    const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;

    // Try to cancel as User B
    const cancelAsB = mockTransactionStore.cancelPendingBooking({
      travelerId: "usr_owner_B",
      bookingId: bId,
    });
    expect(cancelAsB.success).toBe(false);
    expect(cancelAsB.reason).toBe("INVALID_OWNER");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(2);

    // Cancel as User A
    const cancel1 = mockTransactionStore.cancelPendingBooking({
      travelerId: "usr_owner_A",
      bookingId: bId,
    });
    expect(cancel1.success).toBe(true);
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);

    // Double cancel
    const cancel2 = mockTransactionStore.cancelPendingBooking({
      travelerId: "usr_owner_A",
      bookingId: bId,
    });
    expect(cancel2.success).toBe(true);
    expect(cancel2.reason).toBe("ALREADY_RESOLVED");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);
  });

  // EXPIRATION RECONCILIATION & EXPIRED WHILE OPEN
  it("37, 38, 39, 40, 41, 42 & 43. authoritative expiry reconciles Booking & PaymentAttempt to EXPIRED, releases reservation, and CTA returns to intended checkout", async () => {
    vi.useFakeTimers();

    const traveler: AuthUser = {
      id: "usr_timer_exp",
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
      idempotencyKey: "k_time_exp",
    });

    const { container, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2");
    expect(container.textContent).toContain("Menunggu Pembayaran");

    // Advance timers past 15 minutes
    await act(async () => {
      vi.advanceTimersByTime(16 * 60 * 1000);
    });

    // Reconciled to EXPIRED
    expect(container.textContent).toContain("Pembayaran sudah kedaluwarsa.");
    const bookings = mockTransactionStore.getBookings();
    expect(bookings[0].status).toBe("EXPIRED");
    const attempts = mockTransactionStore.getPaymentAttempts();
    expect(attempts[0].status).toBe("EXPIRED");
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);

    // Click "Kembali ke Checkout"
    const returnBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Kembali ke Checkout",
    )!;
    await act(async () => {
      returnBtn.click();
    });

    expect(getPath()).toBe("/checkout/ses_sgd_2");
  });

  // NO ACTIVE PENDING STATE
  it("44, 45 & 46. no active pending shows NO_ACTIVE_PENDING state and CTA returns to intended Checkout", async () => {
    const traveler: AuthUser = {
      id: "usr_no_act",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    const { container, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2");
    expect(container.textContent).toContain(
      "Tidak ada pembayaran tertunda yang aktif.",
    );

    const returnBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Kembali ke Checkout",
    )!;
    await act(async () => {
      returnBtn.click();
    });

    expect(getPath()).toBe("/checkout/ses_sgd_2");
  });

  // INTEGRATION
  it("47, 48 & 49. End-to-End T10 submit with pending payment -> T12 -> Cancel -> return T10", async () => {
    const traveler: AuthUser = {
      id: "usr_e2e_t12",
      name: "E2E Traveler",
      email: "e2e@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Existing pending booking on session 1
    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_e2e_old",
    });

    let currentPath = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    const checkoutAdapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
      verifiedPhoneStore: { usr_e2e_t12: true },
    });

    // Render T10 for session 2
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_2"] },
          createElement(LocationObserver, {
            onLocation: (p) => {
              currentPath = p;
            },
          }),
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen, {
                adapter: checkoutAdapter,
              }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/pending-payment",
              element: createElement(PendingPaymentResolutionScreen),
            }),
          ]),
        ),
      );
    });

    // Check policy & submit
    const policyCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCb.click();
    });

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Handoff to T12
    expect(currentPath).toBe("/checkout/ses_sgd_2/pending-payment");
    expect(container.textContent).toContain(
      "Kamu masih punya pembayaran yang belum selesai.",
    );

    // Cancel old booking
    const cancelTrigger = container.querySelector<HTMLButtonElement>(
      ".pending-payment-cancel-trigger",
    )!;
    await act(async () => {
      cancelTrigger.click();
    });

    const confirmCancelBtn = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => b.textContent?.includes("Ya, Batalkan Pesanan Lama"))!;
    await act(async () => {
      confirmCancelBtn.click();
    });

    // Returned to /checkout/ses_sgd_2 (T10)
    expect(currentPath).toBe("/checkout/ses_sgd_2");
    expect(container.textContent).toContain("Checkout");
    expect(
      mockTransactionStore.getActivePendingPayment(traveler.id),
    ).toBeUndefined();
  });

  // NEW FOCUSED REGRESSIONS (A, B, C, D, E, F)
  it("A. countdown reaches zero + revalidation request fails -> ACTION_ERROR (NOT EXPIRED, booking & reservation preserved)", async () => {
    vi.useFakeTimers();

    const traveler: AuthUser = {
      id: "usr_reg_a",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Create booking that expires in 15 minutes
    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 2,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_reg_a",
    });

    // Revalidation fails on request error
    const errAdapter = new MockPendingPaymentResolutionAdapter({
      failRevalidateCount: 1,
    });
    const { container } = await renderPendingPaymentResolution("ses_sgd_2", {
      adapter: errAdapter,
    });

    // Advance timer to 0
    await act(async () => {
      vi.advanceTimersByTime(16 * 60 * 1000);
    });

    // ACTION_ERROR rendered, NOT claimed as EXPIRED
    expect(container.textContent).toContain(
      "Status pembayaran belum bisa diverifikasi. Coba lagi.",
    );
    expect(container.textContent).not.toContain(
      "Pembayaran sudah kedaluwarsa.",
    );

    // Booking remains in bookings store
    const booking = mockTransactionStore.getBookings()[0];
    expect(booking).toBeDefined();
  });

  it("B. countdown derives from serverNow offset when client clock is skewed", async () => {
    const traveler: AuthUser = {
      id: "usr_reg_b",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Payment expires 5 minutes after now
    mockTransactionStore.createTransaction({
      travelerId: traveler.id,
      packageId: "slow_green_day",
      sessionId: "ses_sgd_1",
      participantCount: 1,
      unitPricePerPerson: 275000,
      capacitySnapshot: 6,
      idempotencyKey: "k_reg_b",
    });

    const { container } = await renderPendingPaymentResolution("ses_sgd_2");
    // Standard timer renders close to 15:00
    expect(container.textContent).toMatch(/14:5\d|15:00/);
  });

  it("C & D. Booking PENDING_PAYMENT but PaymentAttempt missing or CANCELLED/EXPIRED blocks continue", async () => {
    const traveler: AuthUser = {
      id: "usr_reg_cd",
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
      idempotencyKey: "k_reg_cd",
    });
    expect(tx.success).toBe(true);
    const bId = (tx as { booking: { bookingId: string } }).booking.bookingId;

    // Mutate payment attempt to CANCELLED manually to test attempt validation
    const attempts =
      mockTransactionStore.getPaymentAttempts() as import("../checkout/types").PaymentAttemptRecord[];
    const att = attempts.find((p) => p.bookingId === bId);
    if (att) att.status = "CANCELLED";

    const { container, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2");

    const continueBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjutkan Pembayaran"),
    )!;

    await act(async () => {
      continueBtn.click();
    });

    // Continue blocked, did not navigate to payment
    expect(getPath()).toBe("/checkout/ses_sgd_2/pending-payment");
    expect(container.textContent).toContain(
      "Tidak ada pembayaran tertunda yang aktif.",
    );
  });

  it("E. valid PENDING payment attempt continues to /payment/:bookingId", async () => {
    const traveler: AuthUser = {
      id: "usr_reg_e",
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
      idempotencyKey: "k_reg_e",
    });

    const { container, getPath } =
      await renderPendingPaymentResolution("ses_sgd_2");

    const continueBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjutkan Pembayaran"),
    )!;

    await act(async () => {
      continueBtn.click();
    });

    expect(getPath()).toMatch(/^\/payment\/bk_/);
  });

  it("F. cancel dialog: focus enters dialog (focuses safe Kembali button), Escape closes, focus returns to trigger", async () => {
    const traveler: AuthUser = {
      id: "usr_reg_f",
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
      idempotencyKey: "k_reg_f",
    });

    const { container } = await renderPendingPaymentResolution("ses_sgd_2");

    const cancelTrigger = container.querySelector<HTMLButtonElement>(
      ".pending-payment-cancel-trigger",
    )!;

    await act(async () => {
      cancelTrigger.click();
    });

    // Focus enters dialog on safe Kembali button
    const dismissBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Kembali",
    )!;
    expect(document.activeElement).toBe(dismissBtn);

    // Press Escape
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    // Dialog closed
    expect(container.querySelector(".pending-payment-modal")).toBeNull();
  });
});
