import type { AuthUser } from "../auth/types";
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

      const sessions =
        this.sessionOverrides[pkgId] ?? detail.upcomingSessionPreviews ?? [];
      const sess = sessions.find((s) => s.sessionId === sessionId);

      if (sess) {
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

    // Check session status eligibility
    if (
      foundSession.status !== "OPEN" ||
      foundSession.remainingSlots === undefined ||
      foundSession.remainingSlots <= 0
    ) {
      return {
        state: "SESSION_UNAVAILABLE",
        package: foundPkg,
        session: foundSession,
      };
    }

    if (
      foundSession.pricePerPerson === undefined &&
      foundPkg.pricePerPerson === undefined
    ) {
      return {
        state: "PRICE_UNAVAILABLE",
        package: foundPkg,
        session: foundSession,
      };
    }

    const traveler =
      this.travelerOverride !== undefined
        ? this.travelerOverride
        : sessionStore.get().user;

    const contactRequirement: CheckoutContactRequirement = this
      .contactRequirementOverride ?? {
      name: traveler?.name,
      email: traveler?.email,
      phone: traveler?.phone,
      phoneRequired: true,
      phoneVerified: Boolean(traveler?.phone),
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
      session: foundSession,
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

    if (this.failSubmitCount > 0) {
      this.failSubmitCount--;
      return {
        status: "SUBMIT_ERROR",
        message: "Checkout belum bisa diproses. Coba lagi.",
      };
    }

    // Check idempotency first (if already processed, return existing)
    const existingTx = mockTransactionStore.getIdempotentTransaction(
      input.idempotencyKey,
    );
    if (existingTx) {
      return {
        status: "SUCCESS",
        bookingId: existingTx.booking.bookingId,
      };
    }

    // 1. Re-check contact verification requirement
    const traveler =
      this.travelerOverride !== undefined
        ? this.travelerOverride
        : sessionStore.get().user;

    const contactReq = this.contactRequirementOverride ?? {
      phoneRequired: true,
      phoneVerified: Boolean(traveler?.phone),
    };

    if (contactReq.phoneRequired && !contactReq.phoneVerified) {
      return {
        status: "CONTACT_VERIFICATION_REQUIRED",
        message: "Verifikasi nomor HP diperlukan sebelum membuat pesanan.",
      };
    }

    // 2. Re-check active pending payment guard
    const activePending =
      this.pendingPaymentOverride ??
      (traveler
        ? mockTransactionStore.getActivePendingPayment(traveler.id)
        : undefined);

    if (activePending) {
      return {
        status: "ACTIVE_PENDING_PAYMENT",
        pendingPayment: activePending,
        message:
          "Kamu memiliki pembayaran aktif yang belum diselesaikan. Selesaikan atau batalkan pesanan tersebut lebih dahulu.",
      };
    }

    // 3. Re-resolve and re-validate latest Session & Package
    let foundPkg: PackageRecommendationSource | undefined;
    let foundDetail: PackageDetailSource | undefined;
    let foundSession: PackageSessionPreview | undefined;

    for (const [pkgId, detail] of Object.entries(this.details)) {
      const pkg = this.packages.find((p) => p.id === pkgId);
      if (!pkg) continue;

      const sessions =
        this.sessionOverrides[pkgId] ?? detail.upcomingSessionPreviews ?? [];
      const sess = sessions.find((s) => s.sessionId === input.sessionId);

      if (sess) {
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

    const unitPrice = foundSession.pricePerPerson ?? foundPkg.pricePerPerson;
    if (unitPrice === undefined) {
      return {
        status: "PRICE_UNAVAILABLE",
        message: "Harga experience belum tersedia.",
      };
    }

    if (foundSession.remainingSlots === undefined) {
      return {
        status: "INSUFFICIENT_CAPACITY",
        message:
          "Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.",
      };
    }

    if (foundSession.remainingSlots < input.participantCount) {
      return {
        status: "INSUFFICIENT_CAPACITY",
        message:
          "Slot yang tersedia berubah. Sesuaikan jumlah peserta lalu coba lagi.",
      };
    }

    // 4. Atomic transaction creation: reserve slots, create PENDING_PAYMENT booking
    const tx = mockTransactionStore.createTransaction({
      travelerId: input.travelerId,
      packageId: foundPkg.id,
      sessionId: foundSession.sessionId,
      participantCount: input.participantCount,
      unitPricePerPerson: unitPrice,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      status: "SUCCESS",
      bookingId: tx.booking.bookingId,
    };
  }
}

export const defaultCheckoutAdapter = new MockCheckoutAdapter();
