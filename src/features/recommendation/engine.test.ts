import { describe, expect, it } from "vitest";
import type { QuizDraft } from "../quiz/types";
import {
  calculateActivityOverlap,
  checkBudgetFeasibility,
  checkDepartureMatch,
  checkGroupCompatibility,
  checkIntentMatch,
  evaluateDurationRelation,
  evaluateRecommendations,
  generateMatchReasons,
  isSufficientMatch,
} from "./engine";
import { MOCK_RECOMMENDATION_PACKAGES } from "./mockPackages";
import type { PackageRecommendationSource } from "./types";

const baseQuiz: QuizDraft = {
  currentStep: 6,
  current_intent: "NATURE",
  preferred_activities: ["NATURE_SCENERY", "LIGHT_EXPLORATION"],
  budget_band: "AROUND_200_300K",
  duration_preference: "FULL_DAY",
  departure_area_id: "MALANG",
  departure_area_label: "Malang",
  group_type: "FRIENDS",
  group_size_band: "THREE_TO_FOUR",
};

describe("Recommendation Deterministic Matching Engine Tests", () => {
  it("1. excludes non-LIVE packages from candidate eligibility", () => {
    const draftPackages: PackageRecommendationSource[] = [
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "draft_pkg",
        status: "DRAFT",
      },
    ];
    const result = evaluateRecommendations(baseQuiz, draftPackages);
    // Non-LIVE packages cannot be returned as recommendations
    expect(result.topRecommendation).toBeUndefined();
  });

  it("2. recognizes exact sufficient match", () => {
    const pkg = MOCK_RECOMMENDATION_PACKAGES[0]; // slow_green_day
    expect(isSufficientMatch(baseQuiz, pkg)).toBe(true);
  });

  it("3. rejects package with no activity overlap as sufficient match", () => {
    const quizNoOverlap: QuizDraft = {
      ...baseQuiz,
      preferred_activities: ["CREATIVE_WORKSHOP"],
    };
    const pkg = MOCK_RECOMMENDATION_PACKAGES[0]; // only has NATURE_SCENERY, MINDFULNESS, LIGHT_EXPLORATION
    expect(calculateActivityOverlap(quizNoOverlap, pkg)).toBe(0);
    expect(isSufficientMatch(quizNoOverlap, pkg)).toBe(false);
  });

  it("4. rejects package exceeding budget ceiling as sufficient match", () => {
    const quizTightBudget: QuizDraft = {
      ...baseQuiz,
      budget_band: "UP_TO_200K", // <= 200000
    };
    const pkg = MOCK_RECOMMENDATION_PACKAGES[0]; // price 275000
    expect(checkBudgetFeasibility(quizTightBudget.budget_band, pkg.pricePerPerson)).toBe(false);
    expect(isSufficientMatch(quizTightBudget, pkg)).toBe(false);
  });

  it("5. rejects package whose duration is TOO_LONG as sufficient match", () => {
    const quizHalfDay: QuizDraft = {
      ...baseQuiz,
      duration_preference: "HALF_DAY",
    };
    const pkg = MOCK_RECOMMENDATION_PACKAGES[0]; // FULL_DAY -> TOO_LONG for HALF_DAY
    expect(evaluateDurationRelation(quizHalfDay.duration_preference, pkg.durationType)).toBe("TOO_LONG");
    expect(isSufficientMatch(quizHalfDay, pkg)).toBe(false);
  });

  it("6. treats cheaper package as budget feasible (spending comfort ceiling)", () => {
    // Traveler budget 300-500k, package price 190k
    expect(checkBudgetFeasibility("AROUND_300_500K", 190000)).toBe(true);
    // Traveler budget ABOVE_500K, package price 275k
    expect(checkBudgetFeasibility("ABOVE_500K", 275000)).toBe(true);
  });

  it("7. ranks EXACT duration above SHORTER_BUT_FEASIBLE when other signals tie", () => {
    const quiz: QuizDraft = {
      currentStep: 6,
      current_intent: "RECHARGE",
      preferred_activities: ["MINDFULNESS_RELAXATION"],
      budget_band: "AROUND_300_500K",
      duration_preference: "FULL_DAY",
      departure_area_id: "SURABAYA",
      group_type: "PARTNER",
      group_size_band: "TWO",
    };

    const pkgExact: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "exact_dur",
      title: "Exact Duration Package",
      durationType: "FULL_DAY",
      experienceIntents: ["RECHARGE"],
      activityTags: ["MINDFULNESS_RELAXATION"],
      departureAreas: ["SURABAYA"],
      suitableGroupTypes: ["PARTNER"],
      suitableGroupSizeBands: ["TWO"],
      pricePerPerson: 250000,
      rating: 4.8,
      popularityRank: 80,
    };

    const pkgShorter: PackageRecommendationSource = {
      ...pkgExact,
      id: "shorter_dur",
      title: "Shorter Duration Package",
      durationType: "HALF_DAY", // shorter than FULL_DAY
    };

    const res = evaluateRecommendations(quiz, [pkgShorter, pkgExact]);
    expect(res.state).toBe("MATCHED");
    expect(res.topRecommendation.package.id).toBe("exact_dur");
  });

  it("8. ranks activity overlap 2 over overlap 1 when duration and intent tie", () => {
    const quiz: QuizDraft = {
      currentStep: 6,
      current_intent: "NATURE",
      preferred_activities: ["NATURE_SCENERY", "LIGHT_EXPLORATION"],
      budget_band: "AROUND_300_500K",
      duration_preference: "FULL_DAY",
    };

    const pkgOverlap1: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "overlap_1",
      activityTags: ["NATURE_SCENERY"],
      rating: 4.8,
      popularityRank: 80,
    };

    const pkgOverlap2: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "overlap_2",
      activityTags: ["NATURE_SCENERY", "LIGHT_EXPLORATION"],
      rating: 4.8,
      popularityRank: 80,
    };

    const res = evaluateRecommendations(quiz, [pkgOverlap1, pkgOverlap2]);
    expect(res.topRecommendation.package.id).toBe("overlap_2");
  });

  it("9. uses departure match as tie-breaker", () => {
    const quiz: QuizDraft = {
      currentStep: 6,
      current_intent: "NATURE",
      preferred_activities: ["NATURE_SCENERY"],
      budget_band: "ABOVE_500K",
      duration_preference: "FULL_DAY",
      departure_area_id: "MALANG",
    };

    const pkgMalang: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_malang",
      departureAreas: ["MALANG"],
      rating: 4.8,
      popularityRank: 80,
    };

    const pkgSurabaya: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_sby",
      departureAreas: ["SURABAYA"],
      rating: 4.8,
      popularityRank: 80,
    };

    const res = evaluateRecommendations(quiz, [pkgSurabaya, pkgMalang]);
    expect(res.topRecommendation.package.id).toBe("pkg_malang");
  });

  it("10. uses group compatibility as tie-breaker", () => {
    const quiz: QuizDraft = {
      currentStep: 6,
      current_intent: "NATURE",
      preferred_activities: ["NATURE_SCENERY"],
      budget_band: "ABOVE_500K",
      duration_preference: "FULL_DAY",
      group_type: "SOLO",
      group_size_band: "ONE",
    };

    const pkgSolo: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_solo",
      suitableGroupTypes: ["SOLO"],
      suitableGroupSizeBands: ["ONE"],
      rating: 4.8,
      popularityRank: 80,
    };

    const pkgFamilyOnly: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_fam",
      suitableGroupTypes: ["FAMILY"],
      suitableGroupSizeBands: ["FIVE_PLUS"],
      rating: 4.8,
      popularityRank: 80,
    };

    const res = evaluateRecommendations(quiz, [pkgFamilyOnly, pkgSolo]);
    expect(res.topRecommendation.package.id).toBe("pkg_solo");
  });

  it("11. uses rating and popularity as final deterministic tie-breakers", () => {
    const quiz: QuizDraft = {
      currentStep: 6,
      current_intent: "NATURE",
      preferred_activities: ["NATURE_SCENERY"],
      budget_band: "ABOVE_500K",
      duration_preference: "FULL_DAY",
    };

    const pkgHighRating: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_high_rating",
      rating: 4.95,
      popularityRank: 50,
    };

    const pkgLowRating: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_low_rating",
      rating: 4.7,
      popularityRank: 99,
    };

    const res = evaluateRecommendations(quiz, [pkgLowRating, pkgHighRating]);
    expect(res.topRecommendation.package.id).toBe("pkg_high_rating");
  });
});

describe("Recommendation Fallback & Logging Rules", () => {
  it("12. returns state FALLBACK when no package satisfies sufficient match", () => {
    const quizMismatched: QuizDraft = {
      currentStep: 6,
      current_intent: "ACTIVE",
      preferred_activities: ["OUTDOOR_ACTIVE"],
      budget_band: "UP_TO_200K",
      duration_preference: "HALF_DAY",
      departure_area_id: "OTHER",
      departure_area_label: "Kediri",
      group_type: "SOLO",
      group_size_band: "ONE",
    };

    const res = evaluateRecommendations(quizMismatched, MOCK_RECOMMENDATION_PACKAGES);
    expect(res.state).toBe("FALLBACK");
    expect(res.topRecommendation).toBeDefined();
    expect(res.alternatives.length).toBeLessThanOrEqual(2);
  });
});

describe("Explanation Engine Factor Rules", () => {
  it("16. generates maximum 3 concise human-readable reasons", () => {
    const pkg = MOCK_RECOMMENDATION_PACKAGES[0];
    const reasons = generateMatchReasons(baseQuiz, pkg);

    expect(reasons.length).toBeLessThanOrEqual(3);
    expect(reasons).toContain("Dekat dengan alam");
    expect(reasons).toContain("1 hari");
  });

  it("17. does not include exact duration reason when package duration is shorter", () => {
    const quizFullDay: QuizDraft = {
      ...baseQuiz,
      duration_preference: "FULL_DAY",
    };
    const pkgHalfDay = MOCK_RECOMMENDATION_PACKAGES[1]; // HALF_DAY
    const reasons = generateMatchReasons(quizFullDay, pkgHalfDay);

    expect(reasons).not.toContain("1 hari");
    expect(reasons).not.toContain("Setengah hari");
  });

  it("18. only includes departure reason when departure area actually matches", () => {
    const quizSurabaya: QuizDraft = {
      ...baseQuiz,
      departure_area_id: "SURABAYA",
    };
    const pkgMalang = MOCK_RECOMMENDATION_PACKAGES[0]; // departureAreas: [MALANG]
    const reasons = generateMatchReasons(quizSurabaya, pkgMalang);

    expect(reasons).not.toContain("Berangkat dari Surabaya");
    expect(reasons).not.toContain("Berangkat dari Malang");
  });
});
