import type { AuthUser } from "../auth/types";
import type { PackageSessionPreview } from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";

export type CheckoutState =
  | "LOADING"
  | "READY"
  | "CONTACT_REQUIRED"
  | "ACTIVE_PENDING_PAYMENT"
  | "SESSION_UNAVAILABLE"
  | "INSUFFICIENT_CAPACITY"
  | "PRICE_UNAVAILABLE"
  | "NOT_FOUND"
  | "ERROR";

export interface CheckoutContactRequirement {
  name?: string;
  email?: string;
  phone?: string;
  phoneRequired: boolean;
  phoneVerified: boolean;
}

export interface PendingPaymentHandoff {
  bookingId: string;
  packageName: string;
  amount: number;
  expiresAt: string;
}

export interface CheckoutViewModel {
  state: CheckoutState;
  traveler?: AuthUser;
  package?: PackageRecommendationSource;
  session?: PackageSessionPreview;
  contactRequirement?: CheckoutContactRequirement;
  cancellationPolicySummary?: string;
  activePendingPayment?: PendingPaymentHandoff;
  errorMessage?: string;
}

export interface CheckoutSubmitInput {
  travelerId: string;
  sessionId: string;
  participantCount: number;
  expectedUnitPricePerPerson?: number;
  cancellationPolicyAcknowledged: boolean;
  idempotencyKey: string;
}

export type CheckoutSubmitStatus =
  | "SUCCESS"
  | "CONTACT_VERIFICATION_REQUIRED"
  | "ACTIVE_PENDING_PAYMENT"
  | "SESSION_UNAVAILABLE"
  | "INSUFFICIENT_CAPACITY"
  | "PRICE_UNAVAILABLE"
  | "PRICE_CHANGED"
  | "INVALID_DRAFT"
  | "IDEMPOTENCY_CONFLICT"
  | "SUBMIT_ERROR";

export interface CheckoutSubmitResult {
  status: CheckoutSubmitStatus;
  bookingId?: string;
  message?: string;
  pendingPayment?: PendingPaymentHandoff;
  latestUnitPricePerPerson?: number;
  latestRemainingSlots?: number;
}

export interface BookingRecord {
  bookingId: string;
  travelerId: string;
  packageId: string;
  sessionId: string;
  participantCount: number;
  unitPricePerPerson: number;
  totalAmount: number;
  status: "PENDING_PAYMENT";
  reservedQuantity: number;
  createdAt: string;
  paymentExpiresAt: string;
}

export interface PaymentAttemptRecord {
  paymentAttemptId: string;
  bookingId: string;
  status: "PENDING";
  expiresAt: string;
}

export interface CheckoutAdapter {
  getCheckout(sessionId: string): Promise<CheckoutViewModel>;
  submitCheckout(input: CheckoutSubmitInput): Promise<CheckoutSubmitResult>;
}
