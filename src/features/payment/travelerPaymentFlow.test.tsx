// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthUser } from "../auth/types";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import {
  calculatePaymentBreakdown,
  getBookingPaymentBreakdown,
  TRAVELER_SERVICE_FEE,
} from "../checkout/pricing";
import type { BookingRecord } from "../checkout/types";
import { sessionStore } from "../onboarding/sessionStore";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";
import { MockPaymentAdapter } from "./mockAdapter";
import { PaymentResultScreen } from "./PaymentResultScreen";
import { PaymentScreen } from "./PaymentScreen";
import { PendingPaymentSummary } from "../pendingPayment/PendingPaymentSummary";

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

const testPackage400k: PackageRecommendationSource = {
  id: "pkg_sentul_400k",
  title: "Eksplorasi Hutan Pinus Sentul",
  shortSummary: "Trip tenang di hutan pinus",
  destinationName: "Hutan Pinus Sentul",
  locationLabel: "Bogor, Jawa Barat",
  visualAsset: "data:image/svg+xml;utf8,<svg></svg>",
  status: "LIVE",
  verificationLevel: "PLUS",
  pricePerPerson: 400000,
  durationType: "FULL_DAY",
  departureAreas: ["MALANG"],
  experienceIntents: ["RECHARGE", "NATURE"],
  activityTags: ["NATURE_SCENERY"],
  suitableGroupTypes: ["SOLO", "PARTNER"],
  suitableGroupSizeBands: ["ONE", "TWO"],
};

const testSession400k: PackageSessionPreview = {
  sessionId: "ses_sentul_400k",
  packageId: "pkg_sentul_400k",
  startAt: "2026-10-10T08:00:00+07:00",
  endAt: "2026-10-10T14:00:00+07:00",
  status: "OPEN",
  pricePerPerson: 400000,
  remainingSlots: 10,
};

const testDetail400k: PackageDetailSource = {
  packageId: "pkg_sentul_400k",
  valueProposition: "Suasana tenang hutan pinus",
  itinerary: [],
  includedItems: ["Guide", "Air mineral"],
  excludedItems: [],
  safetyNotes: [],
  destinationDetail: { overviewDescription: "Kawasan pinus asri" },
  organizer: {
    id: "org_sentul",
    displayName: "Sentul Eco Guide",
    guideStatus: "CERTIFIED_GUIDE",
  },
  cancellationPolicySummary: "Kebijakan pembatalan fleksibel.",
  upcomingSessionPreviews: [testSession400k],
  highlights: ["Trekking santai"],
};

describe("Traveler Payment Flow & Payment Breakdown Tests", () => {
  describe("Mathematical Formula & Fee Invariant Tests (1-4)", () => {
    it("1. biaya layanan selalu 7500", () => {
      expect(TRAVELER_SERVICE_FEE).toBe(7500);

      const b1 = calculatePaymentBreakdown(400000, 1);
      expect(b1.serviceFee).toBe(7500);

      const b2 = calculatePaymentBreakdown(400000, 2);
      expect(b2.serviceFee).toBe(7500);
    });

    it("2. biaya layanan hanya sekali per transaksi, bukan per peserta", () => {
      // 1 peserta: 400.000 + 7.500 = 407.500
      const res1 = calculatePaymentBreakdown(400000, 1);
      expect(res1.serviceFee).toBe(7500);
      expect(res1.total).toBe(407500);

      // 2 peserta: 800.000 + 7.500 = 807.500 (bukan 800.000 + 15.000)
      const res2 = calculatePaymentBreakdown(400000, 2);
      expect(res2.serviceFee).toBe(7500);
      expect(res2.total).toBe(807500);

      // 5 peserta: 2.000.000 + 7.500 = 2.007.500 (bukan 2.000.000 + 37.500)
      const res5 = calculatePaymentBreakdown(400000, 5);
      expect(res5.serviceFee).toBe(7500);
      expect(res5.total).toBe(2007500);
    });

    it("3. subtotal = harga paket × jumlah peserta", () => {
      const b1 = calculatePaymentBreakdown(400000, 1);
      expect(b1.subtotal).toBe(400000);

      const b2 = calculatePaymentBreakdown(400000, 2);
      expect(b2.subtotal).toBe(800000);

      const b5 = calculatePaymentBreakdown(400000, 5);
      expect(b5.subtotal).toBe(2000000);
    });

    it("4. total = subtotal + 7500 (minimal test case: 400k x 2 = 800k + 7.5k = 807.5k)", () => {
      const breakdown = calculatePaymentBreakdown(400000, 2);
      expect(breakdown.unitPrice).toBe(400000);
      expect(breakdown.participantCount).toBe(2);
      expect(breakdown.subtotal).toBe(800000);
      expect(breakdown.serviceFee).toBe(7500);
      expect(breakdown.total).toBe(807500);

      // Backward compatible helper
      const bookingRecord: BookingRecord = {
        bookingId: "bk_test",
        travelerId: "usr_1",
        packageId: "pkg_1",
        sessionId: "ses_1",
        participantCount: 2,
        unitPricePerPerson: 400000,
        subtotal: 800000,
        serviceFee: 7500,
        total: 807500,
        totalAmount: 807500,
        status: "PENDING_PAYMENT",
        reservedQuantity: 2,
        bookedQuantity: 0,
        createdAt: "2026-09-06T00:00:00Z",
        paymentExpiresAt: "2026-09-06T00:15:00Z",
      };
      const recordBreakdown = getBookingPaymentBreakdown(bookingRecord);
      expect(recordBreakdown.subtotal).toBe(800000);
      expect(recordBreakdown.serviceFee).toBe(7500);
      expect(recordBreakdown.total).toBe(807500);
    });

    it("legacy BookingRecord fallback resolves consistent breakdown without omitting service fee", () => {
      const legacyBooking: Pick<
        BookingRecord,
        | "participantCount"
        | "unitPricePerPerson"
        | "totalAmount"
        | "subtotal"
        | "serviceFee"
        | "total"
      > = {
        participantCount: 2,
        unitPricePerPerson: 275000,
        totalAmount: 550000,
        subtotal: undefined,
        serviceFee: undefined,
        total: undefined,
      };

      const breakdown = getBookingPaymentBreakdown(legacyBooking);
      expect(breakdown.subtotal).toBe(550000);
      expect(breakdown.serviceFee).toBe(7500);
      expect(breakdown.total).toBe(557500);
      expect(breakdown.total).not.toBe(550000);
    });

    it("invariant assertion: breakdown.total === breakdown.subtotal + breakdown.serviceFee holds across cases", () => {
      // 1. Booking baru - 1 peserta
      const newBooking1 = calculatePaymentBreakdown(300000, 1);
      expect(newBooking1.total).toBe(
        newBooking1.subtotal + newBooking1.serviceFee,
      );

      // 2. Booking baru - beberapa peserta (contoh 2 peserta)
      const newBooking2 = calculatePaymentBreakdown(400000, 2);
      expect(newBooking2.total).toBe(
        newBooking2.subtotal + newBooking2.serviceFee,
      );

      // 3. Booking legacy - 1 peserta
      const legacyBooking1: Pick<
        BookingRecord,
        "participantCount" | "unitPricePerPerson" | "totalAmount"
      > = {
        participantCount: 1,
        unitPricePerPerson: 300000,
        totalAmount: 300000,
      };
      const breakdownLegacy1 = getBookingPaymentBreakdown(legacyBooking1);
      expect(breakdownLegacy1.subtotal).toBe(300000);
      expect(breakdownLegacy1.serviceFee).toBe(7500);
      expect(breakdownLegacy1.total).toBe(307500);
      expect(breakdownLegacy1.total).toBe(
        breakdownLegacy1.subtotal + breakdownLegacy1.serviceFee,
      );

      // 4. Booking legacy - beberapa peserta (contoh 3 peserta)
      const legacyBooking3: Pick<
        BookingRecord,
        "participantCount" | "unitPricePerPerson" | "totalAmount"
      > = {
        participantCount: 3,
        unitPricePerPerson: 275000,
        totalAmount: 825000,
      };
      const breakdownLegacy3 = getBookingPaymentBreakdown(legacyBooking3);
      expect(breakdownLegacy3.subtotal).toBe(825000);
      expect(breakdownLegacy3.serviceFee).toBe(7500);
      expect(breakdownLegacy3.total).toBe(832500);
      expect(breakdownLegacy3.total).toBe(
        breakdownLegacy3.subtotal + breakdownLegacy3.serviceFee,
      );
    });
  });

  describe("Screen-Level Consistency & UI Verification Tests (5-8)", () => {
    it("5 & 6. Checkout displays package detail, participant count, and exact payment breakdown (Rp807.500)", async () => {
      const traveler: AuthUser = {
        id: "usr_traveler_400k",
        name: "Traveler Jeda",
        email: "traveler@example.com",
        phone: "081234567890",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const checkoutAdapter = new MockCheckoutAdapter({
        packages: [testPackage400k],
        details: { pkg_sentul_400k: testDetail400k },
        verifiedPhoneStore: { usr_traveler_400k: true },
      });

      container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);

      let currentPath = "";

      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: ["/checkout/ses_sentul_400k"] },
            createElement(LocationObserver, {
              onLocation: (p) => {
                currentPath = p;
              },
            }),
            createElement(
              Routes,
              undefined,
              createElement(Route, {
                path: "/checkout/:sessionId",
                element: createElement(CheckoutScreen, {
                  adapter: checkoutAdapter,
                }),
              }),
              createElement(Route, {
                path: "/payment/:bookingId",
                element: createElement("div", undefined, "Payment Target"),
              }),
            ),
          ),
        );
      });

      // 5. Detail package tampil
      expect(container.textContent).toContain("Eksplorasi Hutan Pinus Sentul");
      expect(container.textContent).toContain("Hutan Pinus Sentul");
      expect(container.textContent).toContain("Bogor, Jawa Barat");
      expect(container.textContent).toContain("10 Oktober 2026");

      // Increment participant from 1 to 2
      const plusBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "Tambah jumlah peserta",
      )!;
      await act(async () => {
        plusBtn.click();
      });

      // 6. Jumlah peserta tampil
      expect(container.textContent).toContain("2 orang");

      // Rincian Pembayaran title & items
      expect(container.textContent).toContain("Rincian Pembayaran");
      expect(container.textContent).toContain("Harga paket");
      expect(container.textContent).toContain("Rp400.000 / orang");
      expect(container.textContent).toContain("Subtotal paket");
      expect(container.textContent).toContain("Rp800.000");
      expect(container.textContent).toContain("Biaya layanan");
      expect(container.textContent).toContain("Rp7.500");
      expect(container.textContent).toContain("Total Pembayaran");
      expect(container.textContent).toContain("Rp807.500");

      // No forbidden terminology
      expect(container.textContent).not.toContain("admin fee");
      expect(container.textContent).not.toContain("handling fee");
      expect(container.textContent).not.toContain("platform surcharge");
      expect(container.textContent).not.toContain("service charge");

      // Acknowledge policy and submit
      const ackCheckbox = container.querySelector<HTMLInputElement>(
        "#cancellation-policy-ack",
      )!;
      await act(async () => {
        ackCheckbox.click();
      });

      const submitBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Lanjut ke Pembayaran"),
      )!;
      await act(async () => {
        submitBtn.click();
      });

      expect(currentPath).toMatch(/^\/payment\/bk_/);
      const booking = mockTransactionStore.getBookings()[0];
      expect(booking).toBeDefined();
      expect(booking.participantCount).toBe(2);
      expect(booking.unitPricePerPerson).toBe(400000);
      expect(booking.subtotal).toBe(800000);
      expect(booking.serviceFee).toBe(7500);
      expect(booking.total).toBe(807500);
      expect(booking.totalAmount).toBe(807500);
    });

    it("7. Checkout dan Payment menampilkan total yang sama (Rp807.500)", async () => {
      const traveler: AuthUser = {
        id: "usr_consistent_user",
        name: "Consistent Traveler",
        email: "consistent@example.com",
        phone: "081234567890",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      // Create transaction in store with 2 participants at 400k
      const tx = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "pkg_sentul_400k",
        sessionId: "ses_sentul_400k",
        participantCount: 2,
        unitPricePerPerson: 400000,
        capacitySnapshot: 10,
        idempotencyKey: "k_consistency_test",
      });
      expect(tx.success).toBe(true);
      const bId = mockTransactionStore.getBookings()[0].bookingId;

      const paymentAdapter = new MockPaymentAdapter({
        packages: [testPackage400k],
        details: { pkg_sentul_400k: testDetail400k },
      });

      container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);

      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: [`/payment/${bId}`] },
            createElement(
              Routes,
              undefined,
              createElement(Route, {
                path: "/payment/:bookingId",
                element: createElement(PaymentScreen, {
                  adapter: paymentAdapter,
                }),
              }),
            ),
          ),
        );
      });

      // Payment screen assertions
      expect(container.textContent).toContain("Konfirmasi Pembayaran");
      expect(container.textContent).toContain("Eksplorasi Hutan Pinus Sentul");
      expect(container.textContent).toContain("Hutan Pinus Sentul");
      expect(container.textContent).toContain("Bogor, Jawa Barat");
      expect(container.textContent).toContain("Rincian Pembayaran");
      expect(container.textContent).toContain("Harga paket");
      expect(container.textContent).toContain("Rp400.000 / orang");
      expect(container.textContent).toContain("Jumlah peserta");
      expect(container.textContent).toContain("2 orang");
      expect(container.textContent).toContain("Subtotal paket");
      expect(container.textContent).toContain("Rp800.000");
      expect(container.textContent).toContain("Biaya layanan");
      expect(container.textContent).toContain("Rp7.500");
      expect(container.textContent).toContain("Total Pembayaran");
      expect(container.textContent).toContain("Rp807.500");
    });

    it("8. Payment Result mempertahankan total yang sama (Rp807.500) setelah pembayaran berhasil", async () => {
      const traveler: AuthUser = {
        id: "usr_result_user",
        name: "Result Traveler",
        email: "result@example.com",
        phone: "081234567890",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const tx = mockTransactionStore.createTransaction({
        travelerId: traveler.id,
        packageId: "pkg_sentul_400k",
        sessionId: "ses_sentul_400k",
        participantCount: 2,
        unitPricePerPerson: 400000,
        capacitySnapshot: 10,
        idempotencyKey: "k_result_test",
      });
      expect(tx.success).toBe(true);
      const bId = mockTransactionStore.getBookings()[0].bookingId;

      const paymentAdapter = new MockPaymentAdapter({
        packages: [testPackage400k],
        details: { pkg_sentul_400k: testDetail400k },
      });

      container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);

      let currentPath = "";

      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: [`/payment/${bId}`] },
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
                element: createElement(PaymentScreen, {
                  adapter: paymentAdapter,
                }),
              }),
              createElement(Route, {
                path: "/payment/:bookingId/result",
                element: createElement(PaymentResultScreen, {
                  adapter: paymentAdapter,
                }),
              }),
            ),
          ),
        );
      });

      // Click "Bayar Sekarang"
      const payBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Bayar Sekarang"),
      )!;
      await act(async () => {
        payBtn.click();
      });

      expect(currentPath).toBe(`/payment/${bId}/result`);
      expect(container.textContent).toContain("Pembayaran Berhasil");
      expect(container.textContent).toContain("Siap untuk jedamu!");
      expect(container.textContent).toContain("Eksplorasi Hutan Pinus Sentul");

      // Payment Result maintains exact same breakdown and total
      expect(container.textContent).toContain("Rincian Pembayaran");
      expect(container.textContent).toContain("Harga paket");
      expect(container.textContent).toContain("Rp400.000 / orang");
      expect(container.textContent).toContain("Jumlah peserta");
      expect(container.textContent).toContain("2 orang");
      expect(container.textContent).toContain("Subtotal paket");
      expect(container.textContent).toContain("Rp800.000");
      expect(container.textContent).toContain("Biaya layanan");
      expect(container.textContent).toContain("Rp7.500");
      expect(container.textContent).toContain("Total Pembayaran");
      expect(container.textContent).toContain("Rp807.500");
    });

    it("9. Legacy booking fallback does not leak fee-less nominal in pending-payment handoff, Payment, or Payment Result", async () => {
      const traveler: AuthUser = {
        id: "usr_legacy_tester",
        name: "Legacy User",
        email: "legacy@example.com",
        phone: "081234567890",
        onboardingStatus: "COMPLETED",
      };
      sessionStore.setUser(traveler);

      const legacyBookingRecord: BookingRecord = {
        bookingId: "bk_legacy_test_1",
        travelerId: traveler.id,
        packageId: "pkg_sentul_400k",
        sessionId: "ses_sentul_400k",
        participantCount: 2,
        unitPricePerPerson: 275000,
        totalAmount: 550000, // Legacy without service fee
        status: "PENDING_PAYMENT",
        reservedQuantity: 2,
        bookedQuantity: 0,
        createdAt: new Date().toISOString(),
        paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

      mockTransactionStore.addDirectBooking(legacyBookingRecord, {
        paymentAttemptId: "pay_legacy_1",
        bookingId: "bk_legacy_test_1",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      // 1. Pending payment handoff amount uses deterministic breakdown
      const handoff = mockTransactionStore.getActivePendingPayment(traveler.id);
      expect(handoff).toBeDefined();
      expect(handoff?.amount).toBe(557500);
      expect(handoff?.amount).not.toBe(550000);

      // 2. PendingPaymentSummary presentation
      container = document.createElement("div");
      document.body.append(container);
      root = createRoot(container);

      await act(async () => {
        root.render(
          createElement(PendingPaymentSummary, {
            summary: {
              booking: legacyBookingRecord,
              package: testPackage400k,
              session: testSession400k,
              serverNow: new Date().toISOString(),
              expiresAt: legacyBookingRecord.paymentExpiresAt,
            },
            secondsRemaining: 900,
          }),
        );
      });

      expect(container.textContent).toContain("Rp557.500");
      expect(container.textContent).not.toContain("Rp550.000");

      // 3. Payment Screen presentation
      const paymentAdapter = new MockPaymentAdapter({
        packages: [testPackage400k],
        details: { pkg_sentul_400k: testDetail400k },
      });

      let currentPath = "";

      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: ["/payment/bk_legacy_test_1"] },
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
                element: createElement(PaymentScreen, {
                  adapter: paymentAdapter,
                }),
              }),
              createElement(Route, {
                path: "/payment/:bookingId/result",
                element: createElement(PaymentResultScreen, {
                  adapter: paymentAdapter,
                }),
              }),
            ),
          ),
        );
      });

      expect(container.textContent).toContain("Rp557.500");
      expect(container.textContent).toContain("Subtotal paket");
      expect(container.textContent).toContain("Rp550.000");
      expect(container.textContent).toContain("Biaya layanan");
      expect(container.textContent).toContain("Rp7.500");
      expect(container.textContent).toContain("Total Pembayaran");

      // 4. Payment Result presentation
      const payBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Bayar Sekarang"),
      )!;
      await act(async () => {
        payBtn.click();
      });

      expect(currentPath).toBe("/payment/bk_legacy_test_1/result");
      expect(container.textContent).toContain("Pembayaran Berhasil");
      expect(container.textContent).toContain("Rp557.500");
      expect(container.textContent).toContain("Subtotal paket");
      expect(container.textContent).toContain("Rp550.000");
      expect(container.textContent).toContain("Biaya layanan");
      expect(container.textContent).toContain("Rp7.500");
    });
  });
});
