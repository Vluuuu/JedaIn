import { getCombinedCatalogPackages } from "../marketplace/marketplaceAdapter";
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
  private explicitPackages?: PackageRecommendationSource[];
  private delayMs: number;
  private failExploreCount: number;
  private errorMessage: string;

  constructor(options: MockExploreAdapterOptions = {}) {
    this.explicitPackages = options.packages;
    this.delayMs = options.delayMs ?? 0;
    this.failExploreCount = options.failExploreCount ?? 0;
    this.errorMessage = options.errorMessage ?? "Experience belum bisa dimuat.";
  }

  private resolveCatalog(): PackageRecommendationSource[] {
    return this.explicitPackages ?? getCombinedCatalogPackages();
  }

  async getExplorePackages(filters: ExploreFilters): Promise<ExploreResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failExploreCount > 0) {
      this.failExploreCount--;
      throw new Error(this.errorMessage);
    }

    const catalog = this.resolveCatalog();
    const filtered = filterAndSortExplorePackages(catalog, filters);
    const availableDestinations = extractAvailableDestinations(catalog);

    return {
      packages: filtered,
      totalCount: filtered.length,
      availableDestinations,
    };
  }
}

export const defaultExploreAdapter = new MockExploreAdapter();
