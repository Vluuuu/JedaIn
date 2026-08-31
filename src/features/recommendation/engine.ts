import type {
  BudgetBand,
  DurationPreference,
  QuizDraft,
} from "../quiz/types";
import {
  QUIZ_ACTIVITY_OPTIONS,
  QUIZ_DURATION_OPTIONS,
  QUIZ_INTENT_OPTIONS,
} from "../quiz/config";
import type {
  PackageRecommendationSource,
  RecommendationItem,
  RecommendationResult,
} from "./types";

const DURATION_ORDER: Record<DurationPreference, number> = {
  HALF_DAY: 1,
  FULL_DAY: 2,
  TWO_D_ONE_N: 3,
  THREE_D_TWO_N_PLUS: 4,
};

export function checkIntentMatch(
  quiz: QuizDraft,
  pkg: PackageRecommendationSource,
): boolean {
  if (!quiz.current_intent) return false;
  return pkg.experienceIntents.includes(quiz.current_intent);
}

export function calculateActivityOverlap(
  quiz: QuizDraft,
  pkg: PackageRecommendationSource,
): number {
  if (!quiz.preferred_activities || quiz.preferred_activities.length === 0) {
    return 0;
  }
  let count = 0;
  for (const act of quiz.preferred_activities) {
    if (pkg.activityTags.includes(act)) {
      count++;
    }
  }
  return count;
}

export function checkBudgetFeasibility(
  budgetBand: BudgetBand | undefined,
  pricePerPerson: number,
): boolean {
  if (!budgetBand) return false;
  switch (budgetBand) {
    case "UP_TO_200K":
      return pricePerPerson <= 200000;
    case "AROUND_200_300K":
      return pricePerPerson <= 300000;
    case "AROUND_300_500K":
      return pricePerPerson <= 500000;
    case "ABOVE_500K":
      return true; // No upper ceiling in MVP prototype
    default:
      return false;
  }
}

export type DurationRelation = "EXACT" | "SHORTER_BUT_FEASIBLE" | "TOO_LONG";

export function evaluateDurationRelation(
  travelerDuration: DurationPreference | undefined,
  packageDuration: DurationPreference,
): DurationRelation {
  if (!travelerDuration) return "TOO_LONG";
  const travelerRank = DURATION_ORDER[travelerDuration];
  const packageRank = DURATION_ORDER[packageDuration];

  if (packageRank === travelerRank) return "EXACT";
  if (packageRank < travelerRank) return "SHORTER_BUT_FEASIBLE";
  return "TOO_LONG";
}

export function checkDepartureMatch(
  quiz: QuizDraft,
  pkg: PackageRecommendationSource,
): boolean {
  if (!quiz.departure_area_id) return false;
  if (quiz.departure_area_id === "OTHER") return false;
  return pkg.departureAreas.includes(quiz.departure_area_id);
}

export function checkGroupCompatibility(
  quiz: QuizDraft,
  pkg: PackageRecommendationSource,
): boolean {
  if (!quiz.group_type || !quiz.group_size_band) return false;
  const typeMatch = pkg.suitableGroupTypes.includes(quiz.group_type);
  const sizeMatch = pkg.suitableGroupSizeBands.includes(quiz.group_size_band);
  return typeMatch && sizeMatch;
}

export function isSufficientMatch(
  quiz: QuizDraft,
  pkg: PackageRecommendationSource,
): boolean {
  if (pkg.status !== "LIVE") return false;

  const intentMatch = checkIntentMatch(quiz, pkg);
  const activityOverlap = calculateActivityOverlap(quiz, pkg);
  const budgetFeasible = checkBudgetFeasibility(
    quiz.budget_band,
    pkg.pricePerPerson,
  );
  const durationRelation = evaluateDurationRelation(
    quiz.duration_preference,
    pkg.durationType,
  );

  return (
    intentMatch &&
    activityOverlap >= 1 &&
    budgetFeasible &&
    durationRelation !== "TOO_LONG"
  );
}

/**
 * Generates human-readable match reasons up to max 3 items
 * Priority:
 * 1. Current intent match
 * 2. Preferred activity match (max 1)
 * 3. Exact duration
 * 4. Departure match
 * 5. Budget feasible
 * 6. Group compatibility
 */
export function generateMatchReasons(
  quiz: QuizDraft,
  pkg?: PackageRecommendationSource,
): string[] {
  if (!pkg) return [];
  const reasons: string[] = [];

  // 1. Current intent
  if (quiz.current_intent && pkg.experienceIntents?.includes(quiz.current_intent)) {
    const opt = QUIZ_INTENT_OPTIONS.find((o) => o.value === quiz.current_intent);
    if (opt) reasons.push(opt.label);
  }

  // 2. Preferred activity match (max 1 label)
  if (quiz.preferred_activities && pkg.activityTags) {
    const matchedActivity = quiz.preferred_activities.find((a) =>
      pkg.activityTags.includes(a),
    );
    if (matchedActivity) {
      const opt = QUIZ_ACTIVITY_OPTIONS.find((o) => o.value === matchedActivity);
      if (opt) reasons.push(opt.label);
    }
  }

  // 3. Exact duration
  if (
    quiz.duration_preference &&
    pkg.durationType &&
    evaluateDurationRelation(quiz.duration_preference, pkg.durationType) === "EXACT"
  ) {
    const opt = QUIZ_DURATION_OPTIONS.find(
      (o) => o.value === quiz.duration_preference,
    );
    if (opt) reasons.push(opt.label);
  }

  // 4. Departure match
  if (reasons.length < 3 && checkDepartureMatch(quiz, pkg)) {
    reasons.push(
      quiz.departure_area_id === "MALANG"
        ? "Berangkat dari Malang"
        : "Berangkat dari Surabaya",
    );
  }

  // 5. Budget feasible
  if (
    reasons.length < 3 &&
    checkBudgetFeasibility(quiz.budget_band, pkg.pricePerPerson)
  ) {
    reasons.push("Budget sesuai");
  }

  // 6. Group compatibility
  if (reasons.length < 3 && checkGroupCompatibility(quiz, pkg)) {
    reasons.push("Sesuai jumlah peserta");
  }

  return reasons.slice(0, 3);
}

/**
 * Deterministically ranks and returns recommendation results
 */
export function evaluateRecommendations(
  quiz: QuizDraft,
  catalog: PackageRecommendationSource[],
): RecommendationResult {
  const livePackages = catalog.filter((p) => p.status === "LIVE");
  const sufficient = livePackages.filter((p) => isSufficientMatch(quiz, p));

  if (sufficient.length > 0) {
    // Rank sufficient matches
    const sorted = [...sufficient].sort((a, b) => {
      // 1. Duration EXACT > SHORTER_BUT_FEASIBLE
      const durA = evaluateDurationRelation(quiz.duration_preference, a.durationType);
      const durB = evaluateDurationRelation(quiz.duration_preference, b.durationType);
      if (durA === "EXACT" && durB !== "EXACT") return -1;
      if (durB === "EXACT" && durA !== "EXACT") return 1;

      // 2. Activity overlap 2 > 1
      const actA = calculateActivityOverlap(quiz, a);
      const actB = calculateActivityOverlap(quiz, b);
      if (actA !== actB) return actB - actA;

      // 3. Departure match
      const depA = checkDepartureMatch(quiz, a) ? 1 : 0;
      const depB = checkDepartureMatch(quiz, b) ? 1 : 0;
      if (depA !== depB) return depB - depA;

      // 4. Group compatible
      const grpA = checkGroupCompatibility(quiz, a) ? 1 : 0;
      const grpB = checkGroupCompatibility(quiz, b) ? 1 : 0;
      if (grpA !== grpB) return grpB - grpA;

      // 5. Rating
      if (a.rating !== b.rating) return b.rating - a.rating;

      // 6. Popularity
      return b.popularityRank - a.popularityRank;
    });

    const topPkg = sorted[0];
    const topItem: RecommendationItem = {
      package: topPkg,
      reasons: generateMatchReasons(quiz, topPkg),
    };

    const alternatives: RecommendationItem[] = sorted.slice(1, 3).map((pkg) => ({
      package: pkg,
      reasons: generateMatchReasons(quiz, pkg),
    }));

    return {
      state: "MATCHED",
      topRecommendation: topItem,
      alternatives,
    };
  }

  // Fallback sorting
  const fallbackSorted = [...livePackages].sort((a, b) => {
    // 1. Intent match
    const intA = checkIntentMatch(quiz, a) ? 1 : 0;
    const intB = checkIntentMatch(quiz, b) ? 1 : 0;
    if (intA !== intB) return intB - intA;

    // 2. Activity overlap
    const actA = calculateActivityOverlap(quiz, a);
    const actB = calculateActivityOverlap(quiz, b);
    if (actA !== actB) return actB - actA;

    // 3. Budget feasible
    const budA = checkBudgetFeasibility(quiz.budget_band, a.pricePerPerson) ? 1 : 0;
    const budB = checkBudgetFeasibility(quiz.budget_band, b.pricePerPerson) ? 1 : 0;
    if (budA !== budB) return budB - budA;

    // 4. Duration relation: EXACT > SHORTER_BUT_FEASIBLE > TOO_LONG
    const durRank = (p: PackageRecommendationSource) => {
      const rel = evaluateDurationRelation(quiz.duration_preference, p.durationType);
      if (rel === "EXACT") return 3;
      if (rel === "SHORTER_BUT_FEASIBLE") return 2;
      return 1;
    };
    if (durRank(a) !== durRank(b)) return durRank(b) - durRank(a);

    // 5. Departure match
    const depA = checkDepartureMatch(quiz, a) ? 1 : 0;
    const depB = checkDepartureMatch(quiz, b) ? 1 : 0;
    if (depA !== depB) return depB - depA;

    // 6. Group compatible
    const grpA = checkGroupCompatibility(quiz, a) ? 1 : 0;
    const grpB = checkGroupCompatibility(quiz, b) ? 1 : 0;
    if (grpA !== grpB) return grpB - grpA;

    // 7. Rating
    if (a.rating !== b.rating) return b.rating - a.rating;

    // 8. Popularity
    return b.popularityRank - a.popularityRank;
  });

  const topFallback = fallbackSorted[0];
  const topItem: RecommendationItem | undefined = topFallback
    ? {
        package: topFallback,
        reasons: generateMatchReasons(quiz, topFallback),
      }
    : undefined;

  const alternatives: RecommendationItem[] = fallbackSorted
    .slice(1, 3)
    .map((pkg) => ({
      package: pkg,
      reasons: generateMatchReasons(quiz, pkg),
    }));

  return {
    state: "FALLBACK",
    topRecommendation: topItem as any,
    alternatives,
  };
}
