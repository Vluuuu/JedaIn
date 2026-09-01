import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type { PackageDetailSource } from "../packageDetail/types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import type {
  CancelBookingResult,
  PendingPaymentResolutionAdapter,
  PendingPaymentSummaryModel,
  PendingPaymentViewModel,
} from "./types";

export interface MockPendingPaymentAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  delayMs?: number;
  failLoadCount?: number;
  failRevalidateCount?: number;
  failCancelCount?: number;
  now?: () => Date;
}

export class MockPendingPaymentResolutionAdapter implements PendingPaymentResolutionAdapter {
  private packages: PackageRecommendationSource[];
  private details: Record<string, PackageDetailSource>;
  private delayMs: number;
  private failLoadCount: number;
  private failRevalidateCount: number;
  private failCancelCount: number;
  private now: () => Date;

  constructor(options: MockPendingPaymentAdapterOptions = {}) {
    this.packages = options.packages ?? MOCK_RECOMMENDATION_PACKAGES;
    this.details = options.details ?? MOCK_PACKAGE_DETAILS;
    this.delayMs = options.delayMs ?? 0;
    this.failLoadCount = options.failLoadCount ?? 0;
    this.failRevalidateCount = options.failRevalidateCount ?? 0;
    this.failCancelCount = options.failCancelCount ?? 0;
    this.now = options.now ?? (() => new Date());
  }

  async getPendingPaymentResolution(
    intendedSessionId: string,
  ): Promise<PendingPaymentViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failLoadCount > 0) {
      this.failLoadCount--;
      throw new Error("Pembayaran tertunda belum bisa dimuat. Coba lagi.");
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return {
        step: "ERROR",
        intendedSessionId,
        errorMessage: "Pengguna belum terautentikasi.",
      };
    }

    const nowMs = this.now().getTime();
    const activeBooking = mockTransactionStore.getActiveBookingRecord(
      traveler.id,
      nowMs,
    );

    if (!activeBooking) {
      return {
        step: "NO_ACTIVE_PENDING",
        intendedSessionId,
      };
    }

    // Resolve existing package & session
    const pkg = this.packages.find((p) => p.id === activeBooking.packageId);
    const detail = this.details[activeBooking.packageId];
    const session = detail?.upcomingSessionPreviews?.find(
      (s) => s.sessionId === activeBooking.sessionId,
    );

    const summary: PendingPaymentSummaryModel = {
      booking: activeBooking,
      package: pkg,
      session,
      serverNow: new Date(nowMs).toISOString(),
      expiresAt: activeBooking.paymentExpiresAt,
    };

    return {
      step: "ACTIVE",
      intendedSessionId,
      summary,
    };
  }

  async revalidatePendingPayment(bookingId: string): Promise<{
    stillActive: boolean;
    booking?: import("../checkout/types").BookingRecord;
    reason?: "EXPIRED" | "NOT_FOUND" | "ALREADY_RESOLVED";
  }> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failRevalidateCount > 0) {
      this.failRevalidateCount--;
      throw new Error("Status pembayaran belum bisa diverifikasi. Coba lagi.");
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return { stillActive: false, reason: "NOT_FOUND" };
    }

    const nowMs = this.now().getTime();
    mockTransactionStore.reconcileExpiredPendingPayments(nowMs);

    const booking = mockTransactionStore
      .getBookings()
      .find((b) => b.bookingId === bookingId);

    if (!booking) {
      return { stillActive: false, reason: "NOT_FOUND" };
    }

    if (booking.travelerId !== traveler.id) {
      return { stillActive: false, reason: "NOT_FOUND" };
    }

    if (booking.status === "EXPIRED") {
      return { stillActive: false, reason: "EXPIRED", booking };
    }

    if (booking.status === "CANCELLED") {
      return { stillActive: false, reason: "ALREADY_RESOLVED", booking };
    }

    const expTime = new Date(booking.paymentExpiresAt).getTime();
    if (nowMs >= expTime) {
      mockTransactionStore.reconcileExpiredPendingPayments(nowMs);
      return { stillActive: false, reason: "EXPIRED", booking };
    }

    // Validate associated PaymentAttempt (Requirement 3)
    const attempt = mockTransactionStore.getPaymentAttemptForBooking(bookingId);
    if (!attempt) {
      return { stillActive: false, reason: "ALREADY_RESOLVED", booking };
    }

    if (attempt.status === "CANCELLED" || attempt.status === "EXPIRED") {
      return { stillActive: false, reason: "ALREADY_RESOLVED", booking };
    }

    if (attempt.status !== "PENDING") {
      return { stillActive: false, reason: "ALREADY_RESOLVED", booking };
    }

    return { stillActive: true, booking };
  }

  async cancelPendingBooking(bookingId: string): Promise<CancelBookingResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failCancelCount > 0) {
      this.failCancelCount--;
      throw new Error("Pesanan belum bisa dibatalkan. Coba lagi.");
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return { success: false, status: "INVALID_OWNER" };
    }

    const nowMs = this.now().getTime();
    const res = mockTransactionStore.cancelPendingBooking({
      travelerId: traveler.id,
      bookingId,
      nowMs,
    });

    if (!res.success) {
      if (res.reason === "EXPIRED") {
        return {
          success: false,
          status: "EXPIRED",
          message: "Pembayaran sudah kedaluwarsa.",
        };
      }
      if (res.reason === "INVALID_OWNER") {
        return {
          success: false,
          status: "INVALID_OWNER",
          message: "Akses tidak sah.",
        };
      }
      return {
        success: false,
        status: "NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      };
    }

    return {
      success: true,
      status: "SUCCESS",
    };
  }
}

export const defaultPendingPaymentResolutionAdapter =
  new MockPendingPaymentResolutionAdapter();
