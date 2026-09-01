import type { BookingRecord } from "../checkout/types";
import type { PackageSessionPreview } from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";

export type PendingPaymentResolutionStep =
  | "LOADING"
  | "ACTIVE"
  | "CONTINUING"
  | "CANCEL_CONFIRM"
  | "CANCELLING"
  | "EXPIRED"
  | "NO_ACTIVE_PENDING"
  | "ERROR"
  | "ACTION_ERROR";

export interface PendingPaymentSummaryModel {
  booking: BookingRecord;
  package?: PackageRecommendationSource;
  session?: PackageSessionPreview;
  serverNow: string;
  expiresAt: string;
}

export interface PendingPaymentViewModel {
  step: PendingPaymentResolutionStep;
  intendedSessionId: string;
  summary?: PendingPaymentSummaryModel;
  errorMessage?: string;
}

export interface CancelBookingResult {
  success: boolean;
  status:
    "SUCCESS" | "EXPIRED" | "NOT_FOUND" | "ALREADY_RESOLVED" | "INVALID_OWNER";
  message?: string;
}

export interface PendingPaymentResolutionAdapter {
  getPendingPaymentResolution(
    intendedSessionId: string,
  ): Promise<PendingPaymentViewModel>;
  revalidatePendingPayment(bookingId: string): Promise<{
    stillActive: boolean;
    booking?: BookingRecord;
    reason?: "EXPIRED" | "NOT_FOUND" | "ALREADY_RESOLVED";
  }>;
  cancelPendingBooking(bookingId: string): Promise<CancelBookingResult>;
}
