import { QUIZ_ACTIVITY_OPTIONS, QUIZ_INTENT_OPTIONS } from "../quiz/config";
import type { PackageRecommendationSource } from "../recommendation/types";
import type {
  ExploreBudgetBucket,
  ExploreDepartureKey,
  ExploreDurationKey,
  ExploreFilters,
  ExploreMoodKey,
  ExploreSortOption,
} from "./types";

/**
 * Normalizes user search input string.
 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Checks if a package matches text query across title, summary, destination,
 * location, and human-facing experience intent / activity labels.
 */
export function matchesQuery(
  pkg: PackageRecommendationSource,
  rawQuery: string,
): boolean {
  const q = normalizeText(rawQuery);
  if (!q) return true;

  if (normalizeText(pkg.title).includes(q)) return true;
  if (normalizeText(pkg.shortSummary).includes(q)) return true;
  if (normalizeText(pkg.destinationName).includes(q)) return true;
  if (normalizeText(pkg.locationLabel).includes(q)) return true;

  // Search in human-readable intent labels
  const intentLabels = pkg.experienceIntents.map(
    (intent) =>
      QUIZ_INTENT_OPTIONS.find((opt) => opt.value === intent)?.label ?? "",
  );
  if (intentLabels.some((label) => normalizeText(label).includes(q))) {
    return true;
  }

  // Search in human-readable activity labels
  const activityLabels = pkg.activityTags.map(
    (act) =>
      QUIZ_ACTIVITY_OPTIONS.find((opt) => opt.value === act)?.label ?? "",
  );
  if (activityLabels.some((label) => normalizeText(label).includes(q))) {
    return true;
  }

  return false;
}

/**
 * Checks if a package matches a mood preset.
 */
export function matchesMood(
  pkg: PackageRecommendationSource,
  mood: ExploreMoodKey,
): boolean {
  switch (mood) {
    case "tenang":
      return (
        pkg.experienceIntents.includes("RECHARGE") ||
        pkg.experienceIntents.includes("REFLECTION") ||
        pkg.activityTags.includes("MINDFULNESS_RELAXATION")
      );
    case "alam":
      return (
        pkg.experienceIntents.includes("NATURE") ||
        pkg.activityTags.includes("NATURE_SCENERY")
      );
    case "recharge":
      return pkg.experienceIntents.includes("RECHARGE");
    case "eksplorasi":
      return (
        pkg.experienceIntents.includes("NOVELTY") ||
        pkg.experienceIntents.includes("ACTIVE") ||
        pkg.activityTags.includes("LIGHT_EXPLORATION") ||
        pkg.activityTags.includes("OUTDOOR_ACTIVE")
      );
    case "refleksi":
      return (
        pkg.experienceIntents.includes("REFLECTION") ||
        pkg.activityTags.includes("MINDFULNESS_RELAXATION")
      );
    default:
      return true;
  }
}

/**
 * Checks if a package fits into catalog budget bucket.
 */
export function matchesBudget(
  pkg: PackageRecommendationSource,
  bucket: ExploreBudgetBucket,
): boolean {
  const price = pkg.pricePerPerson;
  switch (bucket) {
    case "up_to_200k":
      return price <= 200000;
    case "200_300k":
      return price > 200000 && price <= 300000;
    case "300_500k":
      return price > 300000 && price <= 500000;
    case "above_500k":
      return price > 500000;
    default:
      return true;
  }
}

/**
 * Checks exact duration match.
 */
export function matchesDuration(
  pkg: PackageRecommendationSource,
  duration: ExploreDurationKey,
): boolean {
  switch (duration) {
    case "half_day":
      return pkg.durationType === "HALF_DAY";
    case "full_day":
      return pkg.durationType === "FULL_DAY";
    case "two_d_one_n":
      return pkg.durationType === "TWO_D_ONE_N";
    case "three_d_two_n_plus":
      return pkg.durationType === "THREE_D_TWO_N_PLUS";
    default:
      return true;
  }
}

/**
 * Checks departure area match.
 */
export function matchesDeparture(
  pkg: PackageRecommendationSource,
  departure: ExploreDepartureKey,
): boolean {
  const target = departure.toUpperCase();
  return pkg.departureAreas.some((area) => area.toUpperCase() === target);
}

/**
 * Checks destination match against LIVE catalog destinations.
 * If selected destination is not among available destinations, it is ignored safely.
 */
export function matchesDestination(
  pkg: PackageRecommendationSource,
  destination: string,
  availableDestinations?: string[],
): boolean {
  if (!destination.trim()) return true;
  if (
    availableDestinations &&
    availableDestinations.length > 0 &&
    !availableDestinations.some(
      (d) => normalizeText(d) === normalizeText(destination),
    )
  ) {
    return true; // Unknown destination is safely ignored, does not constrain catalog
  }
  return normalizeText(pkg.destinationName) === normalizeText(destination);
}

/**
 * Deterministic sorter.
 */
export function sortPackages(
  packages: PackageRecommendationSource[],
  sortOption: ExploreSortOption = "popular",
): PackageRecommendationSource[] {
  const list = [...packages];

  switch (sortOption) {
    case "rating":
      return list.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.popularityRank !== a.popularityRank)
          return b.popularityRank - a.popularityRank;
        return a.title.localeCompare(b.title, "id");
      });

    case "price_low":
      return list.sort((a, b) => {
        if (a.pricePerPerson !== b.pricePerPerson)
          return a.pricePerPerson - b.pricePerPerson;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.title.localeCompare(b.title, "id");
      });

    case "popular":
    default:
      return list.sort((a, b) => {
        if (b.popularityRank !== a.popularityRank)
          return b.popularityRank - a.popularityRank;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.title.localeCompare(b.title, "id");
      });
  }
}

/**
 * Filters and sorts catalog packages based on user-controlled Explore filters.
 */
export function filterAndSortExplorePackages(
  packages: PackageRecommendationSource[],
  filters: ExploreFilters,
): PackageRecommendationSource[] {
  // Only LIVE packages are candidate for Explore
  const livePackages = packages.filter((pkg) => pkg.status === "LIVE");
  const availableDestinations = extractAvailableDestinations(livePackages);

  const filtered = livePackages.filter((pkg) => {
    if (filters.query && !matchesQuery(pkg, filters.query)) return false;
    if (filters.mood && !matchesMood(pkg, filters.mood)) return false;
    if (filters.budget && !matchesBudget(pkg, filters.budget)) return false;
    if (filters.duration && !matchesDuration(pkg, filters.duration))
      return false;
    if (filters.departure && !matchesDeparture(pkg, filters.departure))
      return false;
    if (
      filters.destination &&
      !matchesDestination(pkg, filters.destination, availableDestinations)
    )
      return false;
    return true;
  });

  return sortPackages(filtered, filters.sort ?? "popular");
}

/**
 * Extracts list of unique destination names from LIVE packages.
 */
export function extractAvailableDestinations(
  packages: PackageRecommendationSource[],
): string[] {
  const live = packages.filter((pkg) => pkg.status === "LIVE");
  const uniqueNames = new Set(live.map((p) => p.destinationName));
  return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b, "id"));
}

/**
 * Parses URL search params into canonical ExploreFilters.
 */
export function parseExploreSearchParams(
  params: URLSearchParams,
): ExploreFilters {
  const filters: ExploreFilters = {};

  const query = params.get("query")?.trim();
  if (query) filters.query = query;

  const mood = params.get("mood")?.toLowerCase();
  if (
    mood === "tenang" ||
    mood === "alam" ||
    mood === "recharge" ||
    mood === "eksplorasi" ||
    mood === "refleksi"
  ) {
    filters.mood = mood;
  }

  const budget = params.get("budget")?.toLowerCase();
  if (
    budget === "up_to_200k" ||
    budget === "200_300k" ||
    budget === "300_500k" ||
    budget === "above_500k"
  ) {
    filters.budget = budget;
  }

  const duration = params.get("duration")?.toLowerCase();
  if (
    duration === "half_day" ||
    duration === "full_day" ||
    duration === "two_d_one_n" ||
    duration === "three_d_two_n_plus"
  ) {
    filters.duration = duration;
  }

  const departure = params.get("departure")?.toLowerCase();
  if (departure === "malang" || departure === "surabaya") {
    filters.departure = departure;
  }

  const destination = params.get("destination")?.trim();
  if (destination) {
    filters.destination = destination;
  }

  const sort = params.get("sort")?.toLowerCase();
  if (sort === "popular" || sort === "rating" || sort === "price_low") {
    filters.sort = sort;
  } else {
    filters.sort = "popular";
  }

  return filters;
}

/**
 * Serializes ExploreFilters back to URL search params.
 */
export function serializeExploreSearchParams(
  filters: ExploreFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query?.trim()) params.set("query", filters.query.trim());
  if (filters.mood) params.set("mood", filters.mood);
  if (filters.budget) params.set("budget", filters.budget);
  if (filters.duration) params.set("duration", filters.duration);
  if (filters.departure) params.set("departure", filters.departure);
  if (filters.destination?.trim())
    params.set("destination", filters.destination.trim());
  if (filters.sort && filters.sort !== "popular")
    params.set("sort", filters.sort);

  return params;
}
