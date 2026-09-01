import type { AuthUser } from "../auth/types";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import { mockTransactionStore } from "./mockTransactionStore";
import type {
  CheckoutAdapter,
  CheckoutContactRequirement,
  CheckoutSubmitInput,
  CheckoutSubmitResult,
  CheckoutViewModel,
  PendingPaymentHandoff,
} from "./types";

export interface MockCheckoutAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  sessionOverrides?: Record<string, PackageSessionPreview[]>;
  travelerOverride?: AuthUser | null;
  contactRequirementOverride?: CheckoutContactRequirement;
  verifiedPhoneStore?: Record<string, boolean>; // travelerId -> verified boolean
  pendingPaymentOverride?: PendingPaymentHandoff;
  delayMs?: number;
  failLoadCount?: number;
  failSubmitCount?: number;
  errorMessage?: string;
}

export class MockCheckoutAdapter implements CheckoutAdapter {
  private packages: PackageRecommendationSource[];
  private details: Record<string, PackageDetailSource>;
  private sessionOverrides: Record<string, PackageSessionPreview[]>;
  private travelerOverride?: AuthUser | null;
  private contactRequirementOverride?: CheckoutContactRequirement;
  private verifiedPhoneStore: Record<string, boolean>;
  private pendingPaymentOverride?: PendingPaymentHandoff;
  private delayMs: number;
  private failLoadCount: number;
  private failSubmitCount: number;
  private errorMessage: string;

  constructor(options: MockCheckoutAdapterOptions = {}) {
    this.packages = options.packages ?? MOCK_RECOMMENDATION_PACKAGES;
    this.details = options.details ?? MOCK_PACKAGE_DETAILS;
    this.sessionOverrides = options.sessionOverrides ?? {};
    this.travelerOverride = options.travelerOverride;
    this.contactRequirementOverride = options.contactRequirementOverride;
    this.verifiedPhoneStore = options.verifiedPhoneStore ?? {};
    this.pendingPaymentOverride = options.pendingPaymentOverride;
    this.delayMs = options.delayMs ?? 0;
    this.failLoadCount = options.failLoadCount ?? 0;
    this.failSubmitCount = options.failSubmitCount ?? 0;
    this.errorMessage = options.errorMessage ?? "Checkout belum bisa dimuat.";
  }

  async getCheckout(sessionId: string): Promise<CheckoutViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failLoadCount > 0) {
      this.failLoadCount--;
      throw new Error(this.errorMessage);
    }

    // 1. Find session across all package details
    let foundPkg: PackageRecommendationSource | undefined;
    let foundDetail: PackageDetailSource | undefined;
    let foundSession: PackageSessionPreview | undefined;

    for (const [pkgId, detail] of Object.entries(this.details)) {
      const pkg = this.packages.find((p) => p.id === pkgId);
      if (!pkg) continue;

      // Validate package mapping consistency
      if (detail.packageId !== pkg.id) continue;

      const sessions =
        this.sessionOverrides[pkgId] ?? detail.upcomingSessionPreviews ?? [];
      const sess = sessions.find((s) => s.sessionId === sessionId);

      if (sess) {
        // Enforce session.packageId === pkg.id
        if (sess.packageId !== pkg.id) continue;

        foundPkg = pkg;
        foundDetail = detail;
        foundSession = sess;
        break;
      }
    }

    if (
      !foundPkg ||
      !foundDetail ||
      !foundSession ||
      foundPkg.status !== "LIVE"
    ) {
      return {
        state: "NOT_FOUND",
      };
    }

    // BLOCKER 1: GETCHECKOUT MUST REFLECT ACTIVE RESERVATIONS
    // Calculate effective remaining slots without mutating canonical details
    const activeReservedQuantity = mockTransactionStore.getReservedQuantity(
      foundSession.sessionId,
    );
    const rawSlots = foundSession.remainingSlots ?? 0;
    const effectiveRemaining = Math.max(0, rawSlots - activeReservedQuantity);

    // Create a cloned session snapshot reflecting latest effective capacity
    const effectiveSessionSnapshot: PackageSessionPreview = {
      ...foundSession,
      remainingSlots: effectiveRemaining,
    };

    // Check session status eligibility
    if (foundSession.status !== "OPEN" || effectiveRemaining <= 0) {
      return {
        state: "SESSION_UNAVAILABLE",
        package: foundPkg,
        session: effectiveSessionSnapshot,
      };
    }

    // BLOCKER 1 (from previous patch): EXACT SESSION PRICE ONLY (session.pricePerPerson MUST exist)
    if (foundSession.pricePerPerson === undefined) {
      return {
        state: "PRICE_UNAVAILABLE",
        package: foundPkg,
        session: effectiveSessionSnapshot,
      };
    }

    const traveler =
      this.travelerOverride !== undefined
        ? this.travelerOverride
        : sessionStore.get().user;

    // Check shared contact verification store if no explicit test override exists
    const isPhoneVerified = traveler?.id
      ? this.verifiedPhoneStore[traveler.id] !== undefined
        ? Boolean(this.verifiedPhoneStore[traveler.id])
        : mockContactVerificationStore.isPhoneVerified(
            traveler.id,
            traveler.phone,
          )
      : false;

    const contactRequirement: CheckoutContactRequirement = this
      .contactRequirementOverride ?? {
      name: traveler?.name,
      email: traveler?.email,
      phone: traveler?.phone,
      phoneRequired: true,
      phoneVerified: isPhoneVerified,
    };

    const activePendingPayment =
      this.pendingPaymentOverride ??
      (traveler
        ? mockTransactionStore.getActivePendingPayment(traveler.id)
        : undefined);

    return {
      state: "READY",
      traveler: traveler ?? undefined,
      package: foundPkg,
      session: effectiveSessionSnapshot,
      contactRequirement,
      cancellationPolicySummary: foundDetail.cancellationPolicySummary,
      activePendingPayment,
    };
  }

  async submitCheckout(
    input: CheckoutSubmitInput,
  ): Promise<CheckoutSubmitResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    // BLOCKER 8: LOCKED NEW-SUBMIT ORDER
    // 1. Validate local draft inputs
    if (
      !Number.isInteger(input.participantCount) ||
      input.participantCount < 1 ||
      input.cancellationPolicyAcknowledged !== true ||
      !Number.isInteger(input.expectedUnitPricePerPerson) ||
      input.expectedUnitPricePerPerson < 0
    ) {
      return {
        status: "INVALID_DRAFT",
        message: "Draft checkout tidak valid.",
      };
    }

    // 2. Authenticated traveler identity & travelerId match check
    const traveler =
      this.travelerOverride !== undefined
        ? this.travelerOverride
        : sessionStore.get().user;

    if (!traveler || input.travelerId !== traveler.id) {
      return {
        status: "INVALID_DRAFT",
        message: "Identitas pemesan tidak sesuai.",
      };
    }

    // 3. Early check for existing committed idempotency record (replay capability)
    const existingCheck = mockTransactionStore.getIdempotentTransaction(
      input.idempotencyKey,
      {
        travelerId: input.travelerId,
        sessionId: input.sessionId,
        participantCount: input.participantCount,
        unitPricePerPerson: input.expectedUnitPricePerPerson,
      },
    );

    if (existingCheck) {
      if (existingCheck.conflict) {
        return {
          status: "IDEMPOTENCY_CONFLICT",
          message: "Konflik transaksi idempotensi.",
        };
      }
      if (existingCheck.result) {
        return {
          status: "SUCCESS",
          bookingId: existingCheck.result.booking.bookingId,
        };
      }
    }

    if (this.failSubmitCount > 0) {
      this.failSubmitCount--;
      return {
        status: "SUBMIT_ERROR",
        message: "Checkout belum bisa diproses. Coba lagi.",
      };
    }

    // 4. Contact verification check
    const isPhoneVerified = traveler.id
      ? this.verifiedPhoneStore[traveler.id] !== undefined
        ? Boolean(this.verifiedPhoneStore[traveler.id])
        : mockContactVerificationStore.isPhoneVerified(
            traveler.id,
            traveler.phone,
          )
      : false;

    const contactReq = this.contactRequirementOverride ?? {
      phoneRequired: true,
      phoneVerified: isPhoneVerified,
    };

    if (contactReq.phoneRequired && !contactReq.phoneVerified) {
      return {
        status: "CONTACT_VERIFICATION_REQUIRED",
        message: "Verifikasi nomor HP diperlukan sebelum membuat pesanan.",
      };
    }

    // 5. Active PENDING_PAYMENT guard
    const activePending =
      this.pendingPaymentOverride ??
      mockTransactionStore.getActivePendingPayment(traveler.id);

    if (activePending) {
      return {
        status: "ACTIVE_PENDING_PAYMENT",
        pendingPayment: activePending,
        message:
          "Kamu memiliki pembayaran aktif yang belum diselesaikan. Selesaikan atau batalkan pesanan tersebut lebih dahulu.",
      };
    }

    // 6. Latest Session/package/status/exact-price/capacity revalidation
    let foundPkg: PackageRecommendationSource | undefined;
    let foundDetail: PackageDetailSource | undefined;
    let foundSession: PackageSessionPreview | undefined;

    for (const [pkgId, detail] of Object.entries(this.details)) {
      const pkg = this.packages.find((p) => p.id === pkgId);
      if (!pkg) continue;

      if (detail.packageId !== pkg.id) continue;

      const sessions =
        this.sessionOverrides[pkgId] ?? detail.upcomingSessionPreviews ?? [];
      const sess = sessions.find((s) => s.sessionId === input.sessionId);

      if (sess) {
        if (sess.packageId !== pkg.id) continue;

        foundPkg = pkg;
        foundDetail = detail;
        foundSession = sess;
        break;
      }
    }

    if (
      !foundPkg ||
      !foundDetail ||
      !foundSession ||
      foundPkg.status !== "LIVE"
    ) {
      return {
        status: "SESSION_UNAVAILABLE",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    if (foundSession.status !== "OPEN") {
      return {
        status: "SESSION_UNAVAILABLE",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    const unitPrice = foundSession.pricePerPerson;
    if (unitPrice === undefined) {
      return {
        status: "PRICE_UNAVAILABLE",
        message: "Harga experience belum tersedia.",
      };
    }

    // BLOCKER 6: EXPECTED REVIEWED PRICE MUST BE REQUIRED & MATCHED
    if (input.expectedUnitPricePerPerson !== unitPrice) {
      return {
        status: "PRICE_CHANGED",
        latestUnitPricePerPerson: unitPrice,
        message: "Harga jadwal berubah. Tinjau total terbaru lalu coba lagi.",
      };
    }

    if (foundSession.remainingSlots === undefined) {
      return {
        status: "INSUFFICIENT_CAPACITY",
        message:
          "Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.",
      };
    }

    // Effective capacity check with store active reservations
    const currentReserved = mockTransactionStore.getReservedQuantity(
      foundSession.sessionId,
    );
    const effectiveRemaining = foundSession.remainingSlots - currentReserved;

    if (effectiveRemaining < input.participantCount) {
      return {
        status: "INSUFFICIENT_CAPACITY",
        latestRemainingSlots: Math.max(0, effectiveRemaining),
        message:
          "Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.",
      };
    }

    // 7. Atomic capacity reservation + booking + payment creation
    const txResult = mockTransactionStore.createTransaction({
      travelerId: input.travelerId,
      packageId: foundPkg.id,
      sessionId: foundSession.sessionId,
      participantCount: input.participantCount,
      unitPricePerPerson: unitPrice,
      capacitySnapshot: foundSession.remainingSlots,
      idempotencyKey: input.idempotencyKey,
    });

    if (!txResult.success) {
      if (txResult.reason === "IDEMPOTENCY_CONFLICT") {
        return {
          status: "IDEMPOTENCY_CONFLICT",
          message: "Konflik transaksi idempotensi.",
        };
      }
      return {
        status: "INSUFFICIENT_CAPACITY",
        latestRemainingSlots: Math.max(0, effectiveRemaining),
        message:
          "Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.",
      };
    }

    return {
      status: "SUCCESS",
      bookingId: txResult.booking.bookingId,
    };
  }
}

export const defaultCheckoutAdapter = new MockCheckoutAdapter();
