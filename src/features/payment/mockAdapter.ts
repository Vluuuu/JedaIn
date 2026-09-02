import { mockTransactionStore } from "../checkout/mockTransactionStore";
import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
} from "../marketplace/marketplaceAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import type { PackageDetailSource } from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";
import type {
  PaymentAdapter,
  PaymentCancelResult,
  PaymentExecuteResult,
  PaymentResultViewModel,
  PaymentViewModel,
} from "./types";

export interface MockPaymentAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  delayMs?: number;
  failExecuteCount?: number;
  simulateFailureCount?: number;
  now?: () => Date;
}

export class MockPaymentAdapter implements PaymentAdapter {
  private explicitPackages?: PackageRecommendationSource[];
  private explicitDetails?: Record<string, PackageDetailSource>;
  private delayMs: number;
  private failExecuteCount: number;
  private simulateFailureCount: number;
  private now: () => Date;

  constructor(options: MockPaymentAdapterOptions = {}) {
    this.explicitPackages = options.packages;
    this.explicitDetails = options.details;
    this.delayMs = options.delayMs ?? 0;
    this.failExecuteCount = options.failExecuteCount ?? 0;
    this.simulateFailureCount = options.simulateFailureCount ?? 0;
    this.now = options.now ?? (() => new Date());
  }

  private resolvePackages(): PackageRecommendationSource[] {
    return this.explicitPackages ?? getCombinedCatalogPackages();
  }

  private resolveDetails(): Record<string, PackageDetailSource> {
    return this.explicitDetails ?? getCombinedPackageDetails();
  }

  async getPayment(bookingId: string): Promise<PaymentViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return {
        state: "NOT_FOUND",
        errorMessage: "Pengguna belum terautentikasi.",
      };
    }

    const nowMs = this.now().getTime();
    mockTransactionStore.reconcileExpiredPendingPayments(nowMs);

    const booking = mockTransactionStore.getBookingById(bookingId);
    if (!booking || booking.travelerId !== traveler.id) {
      return { state: "NOT_FOUND" };
    }

    if (booking.status === "EXPIRED") {
      return { state: "EXPIRED", booking };
    }

    if (booking.status === "CANCELLED") {
      return { state: "NOT_FOUND", booking };
    }

    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return { state: "NOT_FOUND", booking };
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return { state: "ERROR", booking };
    }

    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bookingId);
    if (!attempt) {
      return { state: "ERROR", booking };
    }

    // Only expose actionable ACTIVE if PaymentAttempt is in a retry-valid state (PENDING or FAILED)
    if (attempt.status !== "PENDING" && attempt.status !== "FAILED") {
      return { state: "ERROR", booking, paymentAttempt: attempt };
    }

    const packages = this.resolvePackages();
    const details = this.resolveDetails();

    const pkg = packages.find((p) => p.id === booking.packageId);
    const detail = details[booking.packageId];
    const session = detail?.upcomingSessionPreviews?.find(
      (s) => s.sessionId === booking.sessionId,
    );

    return {
      state: "ACTIVE",
      booking,
      paymentAttempt: attempt,
      package: pkg,
      session,
      serverNow: new Date(nowMs).toISOString(),
      expiresAt: booking.paymentExpiresAt,
    };
  }

  async executePayment(bookingId: string): Promise<PaymentExecuteResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return {
        success: false,
        status: "FAILED",
        message: "Pengguna belum terautentikasi.",
      };
    }

    const booking = mockTransactionStore.getBookingById(bookingId);
    if (!booking || booking.travelerId !== traveler.id) {
      return {
        success: false,
        status: "FAILED",
        message: "Pesanan tidak ditemukan atau bukan milik pengguna.",
      };
    }

    if (this.failExecuteCount > 0) {
      this.failExecuteCount--;
      throw new Error("Koneksi pembayaran terputus. Coba lagi.");
    }

    const nowMs = this.now().getTime();

    // Check injectable failure
    if (this.simulateFailureCount > 0) {
      this.simulateFailureCount--;
      mockTransactionStore.executePaymentFailure({ bookingId, nowMs });
      return {
        success: false,
        status: "FAILED",
        message: "Pembayaran tidak dapat diselesaikan.",
      };
    }

    const res = mockTransactionStore.executePaymentSuccess({
      bookingId,
      nowMs,
    });

    if (!res.success) {
      if (res.reason === "EXPIRED") {
        return {
          success: false,
          status: "EXPIRED",
          message: "Waktu pembayaran telah habis.",
        };
      }
      return {
        success: false,
        status: "FAILED",
        message: "Pesanan tidak dapat diproses.",
      };
    }

    return {
      success: true,
      status: "SUCCEEDED",
    };
  }

  async cancelPayment(bookingId: string): Promise<PaymentCancelResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return { success: false, status: "NOT_FOUND" };
    }

    const nowMs = this.now().getTime();
    const res = mockTransactionStore.cancelPendingBooking({
      travelerId: traveler.id,
      bookingId,
      nowMs,
    });

    if (!res.success) {
      if (res.reason === "EXPIRED") {
        return { success: false, status: "EXPIRED" };
      }
      return { success: false, status: "NOT_FOUND" };
    }

    return { success: true, status: "CANCELLED" };
  }

  async getPaymentResult(bookingId: string): Promise<PaymentResultViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return {
        status: "NOT_FOUND",
        errorMessage: "Pengguna belum terautentikasi.",
      };
    }

    const nowMs = this.now().getTime();
    mockTransactionStore.reconcileExpiredPendingPayments(nowMs);

    const booking = mockTransactionStore.getBookingById(bookingId);
    if (!booking || booking.travelerId !== traveler.id) {
      return { status: "NOT_FOUND" };
    }

    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bookingId);
    const packages = this.resolvePackages();
    const details = this.resolveDetails();

    const pkg = packages.find((p) => p.id === booking.packageId);
    const detail = details[booking.packageId];
    const session = detail?.upcomingSessionPreviews?.find(
      (s) => s.sessionId === booking.sessionId,
    );

    if (booking.status === "PAID" && attempt?.status === "SUCCEEDED") {
      return { status: "SUCCESS", booking, package: pkg, session };
    }

    if (booking.status === "EXPIRED" || attempt?.status === "EXPIRED") {
      return { status: "EXPIRED", booking, package: pkg, session };
    }

    if (booking.status === "CANCELLED" || attempt?.status === "CANCELLED") {
      return { status: "CANCELLED", booking, package: pkg, session };
    }

    if (attempt?.status === "FAILED") {
      return { status: "FAILED", booking, package: pkg, session };
    }

    if (
      booking.status === "PENDING_PAYMENT" &&
      (attempt?.status === "PENDING" || attempt?.status === "VERIFYING")
    ) {
      return { status: "PENDING", booking, package: pkg, session };
    }

    return { status: "ERROR", booking, package: pkg, session };
  }
}

export const defaultPaymentAdapter = new MockPaymentAdapter();
