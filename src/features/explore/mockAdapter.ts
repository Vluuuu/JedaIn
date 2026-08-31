import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import {
  extractAvailableDestinations,
  filterAndSortExplorePackages,
} from "./engine";
import type { ExploreAdapter, ExploreFilters, ExploreResult } from "./types";

export interface MockExploreAdapterOptions {
  packages?: PackageRecommendationSource[];
  delayMs?: number;
  failExploreCount?: number;
  errorMessage?: string;
}

export class MockExploreAdapter implements ExploreAdapter {
  private packages: PackageRecommendationSource[];
  private delayMs: number;
  private failExploreCount: number;
  private errorMessage: string;

  constructor(options: MockExploreAdapterOptions = {}) {
    this.packages = options.packages ?? MOCK_RECOMMENDATION_PACKAGES;
    this.delayMs = options.delayMs ?? 0;
    this.failExploreCount = options.failExploreCount ?? 0;
    this.errorMessage = options.errorMessage ?? "Experience belum bisa dimuat.";
  }

  async getExplorePackages(filters: ExploreFilters): Promise<ExploreResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failExploreCount > 0) {
      this.failExploreCount--;
      throw new Error(this.errorMessage);
    }

    const filtered = filterAndSortExplorePackages(this.packages, filters);
    const availableDestinations = extractAvailableDestinations(this.packages);

    return {
      packages: filtered,
      totalCount: filtered.length,
      availableDestinations,
    };
  }
}

export const defaultExploreAdapter = new MockExploreAdapter();
