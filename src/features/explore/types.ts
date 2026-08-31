import type { PackageRecommendationSource } from "../recommendation/types";

export type ExploreSortOption = "popular" | "rating" | "price_low";
export type ExploreMoodKey =
  "tenang" | "alam" | "recharge" | "eksplorasi" | "refleksi";

export type ExploreBudgetBucket =
  "up_to_200k" | "200_300k" | "300_500k" | "above_500k";

export type ExploreDurationKey =
  "half_day" | "full_day" | "two_d_one_n" | "three_d_two_n_plus";

export type ExploreDepartureKey = "malang" | "surabaya";

export interface ExploreFilters {
  query?: string;
  mood?: ExploreMoodKey;
  budget?: ExploreBudgetBucket;
  duration?: ExploreDurationKey;
  departure?: ExploreDepartureKey;
  destination?: string;
  sort?: ExploreSortOption;
}

export interface ExploreResult {
  packages: PackageRecommendationSource[];
  totalCount: number;
  availableDestinations: string[];
}

export interface ExploreAdapter {
  getExplorePackages(filters: ExploreFilters): Promise<ExploreResult>;
}
