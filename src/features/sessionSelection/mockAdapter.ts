import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import type {
  SessionSelectionAdapter,
  SessionSelectionViewModel,
  SessionValidationResult,
  ValidationFailureReason,
} from "./types";

export interface MockSessionSelectionAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  sessionOverrides?: Record<string, PackageSessionPreview[]>;
  delayMs?: number;
  failLoadCount?: number;
  failValidationCount?: number;
  validationFailureOverride?: Record<string, ValidationFailureReason>;
  errorMessage?: string;
}

export class MockSessionSelectionAdapter implements SessionSelectionAdapter {
  private packages: PackageRecommendationSource[];
  private details: Record<string, PackageDetailSource>;
  private sessionOverrides: Record<string, PackageSessionPreview[]>;
  private delayMs: number;
  private failLoadCount: number;
  private failValidationCount: number;
  private validationFailureOverride: Record<string, ValidationFailureReason>;
  private errorMessage: string;

  constructor(options: MockSessionSelectionAdapterOptions = {}) {
    this.packages = options.packages ?? MOCK_RECOMMENDATION_PACKAGES;
    this.details = options.details ?? MOCK_PACKAGE_DETAILS;
    this.sessionOverrides = options.sessionOverrides ?? {};
    this.delayMs = options.delayMs ?? 0;
    this.failLoadCount = options.failLoadCount ?? 0;
    this.failValidationCount = options.failValidationCount ?? 0;
    this.validationFailureOverride = options.validationFailureOverride ?? {};
    this.errorMessage = options.errorMessage ?? "Jadwal belum bisa dimuat.";
  }

  private resolveEffectiveSessions(
    packageId: string,
    rawSessions: PackageSessionPreview[],
  ): PackageSessionPreview[] {
    const isOverridden = Boolean(this.sessionOverrides[packageId]);

    return rawSessions.map((s) => {
      // Clone snapshot
      const clone = { ...s };
      if (!isOverridden && clone.remainingSlots !== undefined) {
        const occupied = mockTransactionStore.getOccupiedQuantity(
          clone.sessionId,
        );
        const effective = Math.max(0, clone.remainingSlots - occupied);
        clone.remainingSlots = effective;
        if (effective === 0 && clone.status === "OPEN") {
          clone.status = "FULL";
        }
      }
      return clone;
    });
  }

  async getPackageSessions(
    packageId: string,
  ): Promise<SessionSelectionViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failLoadCount > 0) {
      this.failLoadCount--;
      throw new Error(this.errorMessage);
    }

    const pkg = this.packages.find((p) => p.id === packageId);
    if (!pkg || pkg.status !== "LIVE") {
      return {
        state: "NOT_FOUND",
        sessions: [],
        hasSelectableSession: false,
      };
    }

    const detail = this.details[packageId];
    if (!detail) {
      return {
        state: "NOT_FOUND",
        sessions: [],
        hasSelectableSession: false,
      };
    }

    const rawSessions =
      this.sessionOverrides[packageId] ?? detail.upcomingSessionPreviews ?? [];

    const effectiveSessions = this.resolveEffectiveSessions(
      packageId,
      rawSessions,
    );

    // Filter out sessions that do not match packageId OR are CANCELLED
    const validSessions = effectiveSessions.filter(
      (s) => s.packageId === packageId && s.status !== "CANCELLED",
    );

    // Chronological sort
    const sortedSessions = [...validSessions].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    // Check if at least one selectable session exists (OPEN and remainingSlots > 0)
    const hasSelectableSession = sortedSessions.some(
      (s) =>
        s.status === "OPEN" &&
        s.remainingSlots !== undefined &&
        s.remainingSlots > 0,
    );

    return {
      state: "READY",
      package: pkg,
      organizer: detail.organizer,
      sessions: sortedSessions,
      hasSelectableSession,
    };
  }

  async validateSessionSelection(
    packageId: string,
    sessionId: string,
  ): Promise<SessionValidationResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failValidationCount > 0) {
      this.failValidationCount--;
      return {
        valid: false,
        reason: "REQUEST_ERROR",
        message: "Jadwal belum bisa diverifikasi. Coba lagi.",
      };
    }

    const detail = this.details[packageId];
    const rawSessions =
      this.sessionOverrides[packageId] ?? detail?.upcomingSessionPreviews ?? [];

    const effectiveSessions = this.resolveEffectiveSessions(
      packageId,
      rawSessions,
    );

    const targetSession = effectiveSessions.find(
      (s) => s.sessionId === sessionId,
    );

    if (!targetSession) {
      return {
        valid: false,
        reason: "NOT_FOUND",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    // Enforce same package validation
    if (targetSession.packageId !== packageId) {
      return {
        valid: false,
        reason: "PACKAGE_MISMATCH",
        message:
          "Jadwal ini tidak sesuai dengan paket yang dipilih. Pilih jadwal lain.",
      };
    }

    // Handle test/simulation validation overrides and update session status in sessionOverrides
    if (this.validationFailureOverride[sessionId]) {
      const reason = this.validationFailureOverride[sessionId];

      // Update session override state for FULL, CLOSED, CANCELLED so subsequent getPackageSessions reflects stale state
      if (reason === "FULL" || reason === "CLOSED" || reason === "CANCELLED") {
        if (!this.sessionOverrides[packageId]) {
          this.sessionOverrides[packageId] = (
            detail?.upcomingSessionPreviews ?? []
          ).map((s) => ({ ...s }));
        }
        const sOverride = this.sessionOverrides[packageId].find(
          (s) => s.sessionId === sessionId,
        );
        if (sOverride) {
          sOverride.status = reason;
          if (reason === "FULL") {
            sOverride.remainingSlots = 0;
          }
        }
      }

      let message = "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.";
      if (reason === "CAPACITY_UNKNOWN") {
        message = "Ketersediaan jadwal belum bisa dipastikan. Coba lagi.";
      } else if (reason === "REQUEST_ERROR") {
        message = "Jadwal belum bisa diverifikasi. Coba lagi.";
      } else if (reason === "PACKAGE_MISMATCH") {
        message =
          "Jadwal ini tidak sesuai dengan paket yang dipilih. Pilih jadwal lain.";
      }
      return {
        valid: false,
        reason,
        message,
      };
    }

    if (targetSession.status === "CANCELLED") {
      return {
        valid: false,
        reason: "CANCELLED",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    if (targetSession.status === "FULL") {
      return {
        valid: false,
        reason: "FULL",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    if (targetSession.status === "CLOSED") {
      return {
        valid: false,
        reason: "CLOSED",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    // Revalidation requires reliable positive capacity snapshot
    if (targetSession.remainingSlots === undefined) {
      return {
        valid: false,
        reason: "CAPACITY_UNKNOWN",
        message: "Ketersediaan jadwal belum bisa dipastikan. Coba lagi.",
      };
    }

    if (targetSession.remainingSlots <= 0) {
      return {
        valid: false,
        reason: "FULL",
        message: "Jadwal ini baru saja tidak tersedia. Pilih jadwal lain.",
      };
    }

    return {
      valid: true,
    };
  }
}

export const defaultSessionSelectionAdapter = new MockSessionSelectionAdapter();
