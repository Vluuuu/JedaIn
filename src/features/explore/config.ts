import type {
  ExploreBudgetBucket,
  ExploreDepartureKey,
  ExploreDurationKey,
  ExploreMoodKey,
  ExploreSortOption,
} from "./types";

export interface FilterOption<T> {
  value: T;
  label: string;
}

export const EXPLORE_SORT_OPTIONS: FilterOption<ExploreSortOption>[] = [
  { value: "popular", label: "Terpopuler" },
  { value: "rating", label: "Rating tertinggi" },
  { value: "price_low", label: "Harga terendah" },
];

export const EXPLORE_MOOD_OPTIONS: FilterOption<ExploreMoodKey>[] = [
  { value: "tenang", label: "Tenang" },
  { value: "alam", label: "Alam" },
  { value: "recharge", label: "Recharge" },
  { value: "eksplorasi", label: "Eksplorasi" },
  { value: "refleksi", label: "Refleksi" },
];

export const EXPLORE_BUDGET_OPTIONS: FilterOption<ExploreBudgetBucket>[] = [
  { value: "up_to_200k", label: "Sampai Rp200 ribu" },
  { value: "200_300k", label: "Rp200–300 ribu" },
  { value: "300_500k", label: "Rp300–500 ribu" },
  { value: "above_500k", label: "Di atas Rp500 ribu" },
];

export const EXPLORE_DURATION_OPTIONS: FilterOption<ExploreDurationKey>[] = [
  { value: "half_day", label: "Setengah hari" },
  { value: "full_day", label: "1 hari" },
  { value: "two_d_one_n", label: "2 hari 1 malam" },
  { value: "three_d_two_n_plus", label: "3 hari 2 malam atau lebih" },
];

export const EXPLORE_DEPARTURE_OPTIONS: FilterOption<ExploreDepartureKey>[] = [
  { value: "malang", label: "Malang" },
  { value: "surabaya", label: "Surabaya" },
];
