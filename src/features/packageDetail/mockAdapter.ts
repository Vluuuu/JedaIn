import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
} from "../marketplace/marketplaceAdapter";
import type { PackageRecommendationSource } from "../recommendation/types";
import type {
  PackageDetailAdapter,
  PackageDetailSource,
  PackageDetailViewModel,
  PackageSessionPreview,
  PersonalizedContext,
} from "./types";

export interface MockPackageDetailAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  sessionOverrides?: Record<string, PackageSessionPreview[]>;
  delayMs?: number;
  failCount?: number;
  errorMessage?: string;
}

export class MockPackageDetailAdapter implements PackageDetailAdapter {
  private explicitPackages?: PackageRecommendationSource[];
  private explicitDetails?: Record<string, PackageDetailSource>;
  private sessionOverrides: Record<string, PackageSessionPreview[]>;
  private delayMs: number;
  private failCount: number;
  private errorMessage: string;

  constructor(options: MockPackageDetailAdapterOptions = {}) {
    this.explicitPackages = options.packages;
    this.explicitDetails = options.details;
    this.sessionOverrides = options.sessionOverrides ?? {};
    this.delayMs = options.delayMs ?? 0;
    this.failCount = options.failCount ?? 0;
    this.errorMessage =
      options.errorMessage ?? "Detail experience belum bisa dimuat.";
  }

  private resolvePackages(): PackageRecommendationSource[] {
    return this.explicitPackages ?? getCombinedCatalogPackages();
  }

  private resolveDetails(): Record<string, PackageDetailSource> {
    return this.explicitDetails ?? getCombinedPackageDetails();
  }

  async getPackageDetail(
    packageId: string,
    options?: { personalizedContext?: PersonalizedContext },
  ): Promise<PackageDetailViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failCount > 0) {
      this.failCount--;
      throw new Error(this.errorMessage);
    }

    const packages = this.resolvePackages();
    const details = this.resolveDetails();

    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg || pkg.status !== "LIVE") {
      return {
        state: "NOT_FOUND",
        hasOpenSession: false,
      };
    }

    const detail = details[packageId];
    if (!detail) {
      return {
        state: "NOT_FOUND",
        hasOpenSession: false,
      };
    }

    // Sessions may be overridden in tests
    const allSessions =
      this.sessionOverrides[packageId] ?? detail.upcomingSessionPreviews ?? [];

    // Filter out CANCELLED sessions (must not appear in upcoming preview)
    const validSessions = allSessions.filter((s) => s.status !== "CANCELLED");

    // Check if at least one upcoming session is OPEN
    const hasOpenSession = validSessions.some((s) => s.status === "OPEN");

    // Sort upcoming sessions chronologically
    const sortedSessions = [...validSessions].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    return {
      state: "READY",
      package: pkg,
      detail: {
        ...detail,
        upcomingSessionPreviews: sortedSessions,
      },
      hasOpenSession,
      personalizedContext: options?.personalizedContext,
    };
  }
}

export const defaultPackageDetailAdapter = new MockPackageDetailAdapter();
