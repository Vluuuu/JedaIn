import { adminSessionStore } from "../admin/adminSessionStore";
import { mockAdminAuditStore } from "../admin/mockAdminAuditStore";
import { mockComplaintStore } from "../admin/mockComplaintStore";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { mockOtpSessionStore } from "../contactVerification/mockOtpSessionStore";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { mockReviewStore } from "../reviews/mockReviewStore";

/**
 * Resets all centralized stores across the 4 surfaces (Traveler, EO, Admin, Destination)
 * to their deterministic clean baseline without mutating immutable seed arrays by reference.
 * Compliant with CROSS_SURFACE_INTEGRATION_CONTRACT.md section 19.
 */
export function resetCompetitionDemoState(): void {
  // 1. Reset Admin stores
  adminSessionStore.reset();
  mockAdminAuditStore.reset();
  mockComplaintStore.reset();
  mockDestinationVerificationStore.reset();

  // 2. Reset Destination & EO stores
  mockDestinationStore.reset();
  mockApplicationStore.reset();
  mockEoPackageStore.reset();
  partnerSessionStore.reset();

  // 3. Reset Traveler transactions, OTP, and reviews
  mockTransactionStore.reset();
  mockContactVerificationStore.reset();
  mockOtpSessionStore.reset();
  mockReviewStore.reset();

  // 4. Reset Traveler session store
  sessionStore.reset();
}
