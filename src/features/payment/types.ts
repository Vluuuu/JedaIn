import type { BookingRecord, PaymentAttemptRecord } from "../checkout/types";
import type { PackageSessionPreview } from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";

export type PaymentState =
  "LOADING" | "ACTIVE" | "VERIFYING" | "EXPIRED" | "NOT_FOUND" | "ERROR";

export interface PaymentViewModel {
  state: PaymentState;
  booking?: BookingRecord;
  paymentAttempt?: PaymentAttemptRecord;
  package?: PackageRecommendationSource;
  session?: PackageSessionPreview;
  serverNow?: string;
  expiresAt?: string;
  errorMessage?: string;
}

export type PaymentResultStatus =
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "NOT_FOUND"
  | "LOADING"
  | "ERROR";

export interface PaymentResultViewModel {
  status: PaymentResultStatus;
  booking?: BookingRecord;
  package?: PackageRecommendationSource;
  session?: PackageSessionPreview;
  errorMessage?: string;
}

export interface PaymentExecuteResult {
  success: boolean;
  status: "SUCCEEDED" | "FAILED" | "EXPIRED" | "ALREADY_PAID";
  message?: string;
}

export interface PaymentCancelResult {
  success: boolean;
  status: "CANCELLED" | "EXPIRED" | "NOT_FOUND";
  message?: string;
}

export interface PaymentAdapter {
  getPayment(bookingId: string): Promise<PaymentViewModel>;
  executePayment(bookingId: string): Promise<PaymentExecuteResult>;
  cancelPayment(bookingId: string): Promise<PaymentCancelResult>;
  getPaymentResult(bookingId: string): Promise<PaymentResultViewModel>;
}
