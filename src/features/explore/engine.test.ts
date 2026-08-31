import { describe, expect, it } from "vitest";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import {
  extractAvailableDestinations,
  filterAndSortExplorePackages,
  parseExploreSearchParams,
  serializeExploreSearchParams,
} from "./engine";
import type { ExploreFilters } from "./types";

describe("Explore Search, Filter and Sort Engine", () => {
  it("1. filters only LIVE packages", () => {
    const mixedPackages: PackageRecommendationSource[] = [
      ...MOCK_RECOMMENDATION_PACKAGES,
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "draft_pkg",
        title: "Paket Draft",
        status: "DRAFT" as "LIVE",
      },
    ];

    const results = filterAndSortExplorePackages(mixedPackages, {});
    expect(results.length).toBe(MOCK_RECOMMENDATION_PACKAGES.length);
    expect(results.some((p) => p.id === "draft_pkg")).toBe(false);
  });

  it("2. returns all LIVE packages by default without filters", () => {
    const results = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {},
    );
    expect(results.length).toBe(5);
  });

  it("3. searches by package title", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      query: "Lereng Hijau",
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("slow_green_day");
  });

  it("4. searches by destination and location label", () => {
    const byDest = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      query: "Trawas",
    });
    expect(byDest.length).toBe(1);
    expect(byDest[0].id).toBe("mindful_morning");

    const byLoc = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      query: "Pasuruan",
    });
    expect(byLoc.length).toBe(1);
    expect(byLoc[0].id).toBe("light_mountain_explore");
  });

  it("5. searches by human-facing experience intent and activity label", () => {
    // "Dekat dengan alam" is human label for NATURE
    const byIntentLabel = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        query: "Dekat dengan alam",
      },
    );
    expect(byIntentLabel.length).toBeGreaterThan(0);
    expect(byIntentLabel.some((p) => p.id === "slow_green_day")).toBe(true);

    // "Kreatif & workshop" is human label for CREATIVE_WORKSHOP
    const byActLabel = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        query: "Kreatif",
      },
    );
    expect(byActLabel.length).toBe(1);
    expect(byActLabel[0].id).toBe("creative_village_halfday");
  });

  it("6. returns empty list for unknown search query", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      query: "xyz123unmatched",
    });
    expect(results.length).toBe(0);
  });

  it("7. respects budget boundaries strictly (catalog price boundaries)", () => {
    // up_to_200k (<= 200k) -> creative_village_halfday is 190k
    const under200 = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        budget: "up_to_200k",
      },
    );
    expect(under200.map((p) => p.id)).toEqual(["creative_village_halfday"]);

    // 200_300k (> 200k && <= 300k) -> slow_green_day (275k), mindful_morning (225k)
    const mid200300 = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        budget: "200_300k",
      },
    );
    expect(mid200300.map((p) => p.id)).toContain("slow_green_day");
    expect(mid200300.map((p) => p.id)).toContain("mindful_morning");
    expect(mid200300.length).toBe(2);

    // 300_500k (> 300k && <= 500k) -> light_mountain_explore (325k), weekend_nature_reset (475k)
    const mid300500 = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        budget: "300_500k",
      },
    );
    expect(mid300500.map((p) => p.id)).toEqual([
      "weekend_nature_reset",
      "light_mountain_explore",
    ]);

    // above_500k (> 500k) -> none in mock catalog
    const above500 = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        budget: "above_500k",
      },
    );
    expect(above500.length).toBe(0);
  });

  it("8. filters exact duration match (does not auto-include shorter)", () => {
    const fullDay = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      duration: "full_day",
    });
    expect(fullDay.length).toBe(2);
    expect(fullDay.every((p) => p.durationType === "FULL_DAY")).toBe(true);

    const halfDay = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      duration: "half_day",
    });
    expect(halfDay.length).toBe(2);
    expect(halfDay.every((p) => p.durationType === "HALF_DAY")).toBe(true);

    const twoDOneN = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        duration: "two_d_one_n",
      },
    );
    expect(twoDOneN.length).toBe(1);
    expect(twoDOneN[0].id).toBe("weekend_nature_reset");
  });

  it("9. filters departure area Malang", () => {
    const malangPkgs = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        departure: "malang",
      },
    );
    expect(malangPkgs.length).toBe(2);
    expect(malangPkgs.map((p) => p.id)).toEqual([
      "slow_green_day",
      "creative_village_halfday",
    ]);
  });

  it("10. filters departure area Surabaya", () => {
    const sbyPkgs = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      departure: "surabaya",
    });
    expect(sbyPkgs.length).toBe(3);
    expect(sbyPkgs.map((p) => p.id)).toEqual([
      "mindful_morning",
      "weekend_nature_reset",
      "light_mountain_explore",
    ]);
  });

  it("11. filters by exact destination name", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      destination: "Desa Wisata Budaya",
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("creative_village_halfday");
  });

  it("12. combines multiple filters with AND semantics", () => {
    const combined = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        departure: "surabaya",
        duration: "half_day",
      },
    );
    expect(combined.length).toBe(1);
    expect(combined[0].id).toBe("mindful_morning");

    // Unmatched combination
    const noMatch = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      departure: "malang",
      duration: "two_d_one_n",
    });
    expect(noMatch.length).toBe(0);
  });

  it("13. matches all mood preset mappings correctly", () => {
    // tenang: RECHARGE or REFLECTION or MINDFULNESS_RELAXATION
    const tenang = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      mood: "tenang",
    });
    expect(tenang.length).toBe(4); // slow_green_day, creative_village, mindful_morning, weekend_nature_reset

    // alam: NATURE or NATURE_SCENERY
    const alam = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      mood: "alam",
    });
    expect(alam.length).toBe(4);

    // recharge: RECHARGE
    const recharge = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        mood: "recharge",
      },
    );
    expect(recharge.length).toBe(3);

    // eksplorasi: NOVELTY, ACTIVE, LIGHT_EXPLORATION, OUTDOOR_ACTIVE
    const eksplorasi = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        mood: "eksplorasi",
      },
    );
    expect(eksplorasi.length).toBe(4);

    // refleksi: REFLECTION or MINDFULNESS_RELAXATION
    const refleksi = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {
        mood: "refleksi",
      },
    );
    expect(refleksi.length).toBe(4);
  });

  it("14. does NOT apply hidden QuizDraft filtering", () => {
    // Engine only uses explicit filters argument; passing empty filters yields all LIVE
    const results = filterAndSortExplorePackages(
      MOCK_RECOMMENDATION_PACKAGES,
      {},
    );
    expect(results.length).toBe(5);
  });

  it("15. sorts by POPULAR (default: popularityRank desc, rating desc, title asc)", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      sort: "popular",
    });
    expect(results[0].id).toBe("slow_green_day"); // pop 95
    expect(results[1].id).toBe("mindful_morning"); // pop 92
    expect(results[2].id).toBe("weekend_nature_reset"); // pop 90
    expect(results[3].id).toBe("creative_village_halfday"); // pop 88
    expect(results[4].id).toBe("light_mountain_explore"); // pop 86
  });

  it("16. sorts by RATING (rating desc, popularityRank desc, title asc)", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      sort: "rating",
    });
    expect(results[0].id).toBe("mindful_morning"); // 4.90
    expect(results[1].id).toBe("weekend_nature_reset"); // 4.88
    expect(results[2].id).toBe("slow_green_day"); // 4.85
    expect(results[3].id).toBe("light_mountain_explore"); // 4.80
    expect(results[4].id).toBe("creative_village_halfday"); // 4.75
  });

  it("17. sorts by PRICE_LOW (pricePerPerson asc, rating desc, title asc)", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      sort: "price_low",
    });
    expect(results[0].id).toBe("creative_village_halfday"); // 190k
    expect(results[1].id).toBe("mindful_morning"); // 225k
    expect(results[2].id).toBe("slow_green_day"); // 275k
    expect(results[3].id).toBe("light_mountain_explore"); // 325k
    expect(results[4].id).toBe("weekend_nature_reset"); // 475k
  });

  it("18. parses search params and safely ignores invalid parameter values", () => {
    const params = new URLSearchParams(
      "query=batu&mood=invalid_mood&budget=invalid_budget&duration=invalid_dur&departure=invalid_dep&sort=invalid_sort",
    );
    const parsed = parseExploreSearchParams(params);

    expect(parsed.query).toBe("batu");
    expect(parsed.mood).toBeUndefined();
    expect(parsed.budget).toBeUndefined();
    expect(parsed.duration).toBeUndefined();
    expect(parsed.departure).toBeUndefined();
    expect(parsed.sort).toBe("popular");
  });

  it("19. serializes and roundtrips valid ExploreFilters", () => {
    const original: ExploreFilters = {
      query: "alam",
      mood: "tenang",
      budget: "200_300k",
      duration: "full_day",
      departure: "malang",
      destination: "Lereng Hijau Batu",
      sort: "rating",
    };

    const params = serializeExploreSearchParams(original);
    const parsed = parseExploreSearchParams(params);

    expect(parsed).toEqual(original);
  });

  it("20. tests exact synthetic budget boundaries at 200k, 300k, and 500k edges", () => {
    const syntheticPkgs: PackageRecommendationSource[] = [
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "p_200k",
        title: "Exact 200k",
        pricePerPerson: 200000,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "p_200001",
        title: "200k + 1",
        pricePerPerson: 200001,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "p_300k",
        title: "Exact 300k",
        pricePerPerson: 300000,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "p_300001",
        title: "300k + 1",
        pricePerPerson: 300001,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "p_500k",
        title: "Exact 500k",
        pricePerPerson: 500000,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "p_500001",
        title: "500k + 1",
        pricePerPerson: 500001,
      },
    ];

    // up_to_200k (<= 200000)
    const upTo200 = filterAndSortExplorePackages(syntheticPkgs, {
      budget: "up_to_200k",
    });
    expect(upTo200.map((p) => p.id)).toEqual(["p_200k"]);

    // 200_300k (> 200000 && <= 300000)
    const mid200300 = filterAndSortExplorePackages(syntheticPkgs, {
      budget: "200_300k",
    });
    expect(mid200300.map((p) => p.id)).toEqual(["p_200001", "p_300k"]);

    // 300_500k (> 300000 && <= 500000)
    const mid300500 = filterAndSortExplorePackages(syntheticPkgs, {
      budget: "300_500k",
    });
    expect(mid300500.map((p) => p.id)).toEqual(["p_300001", "p_500k"]);

    // above_500k (> 500000)
    const above500 = filterAndSortExplorePackages(syntheticPkgs, {
      budget: "above_500k",
    });
    expect(above500.map((p) => p.id)).toEqual(["p_500001"]);
  });

  it("21. resolves synthetic ties deterministically across all sort modes", () => {
    const syntheticTies: PackageRecommendationSource[] = [
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "pkg_b",
        title: "B Experience",
        popularityRank: 90,
        rating: 4.8,
        pricePerPerson: 300000,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "pkg_a",
        title: "A Experience",
        popularityRank: 90,
        rating: 4.8,
        pricePerPerson: 300000,
      },
      {
        ...MOCK_RECOMMENDATION_PACKAGES[0],
        id: "pkg_higher_rating",
        title: "C Experience",
        popularityRank: 90,
        rating: 4.9,
        pricePerPerson: 300000,
      },
    ];

    // POPULAR: popularityRank desc -> rating desc -> title asc
    const popularSorted = filterAndSortExplorePackages(syntheticTies, {
      sort: "popular",
    });
    expect(popularSorted.map((p) => p.id)).toEqual([
      "pkg_higher_rating",
      "pkg_a",
      "pkg_b",
    ]);

    // RATING: rating desc -> popularityRank desc -> title asc
    const ratingSorted = filterAndSortExplorePackages(syntheticTies, {
      sort: "rating",
    });
    expect(ratingSorted.map((p) => p.id)).toEqual([
      "pkg_higher_rating",
      "pkg_a",
      "pkg_b",
    ]);

    // PRICE_LOW: price asc -> rating desc -> title asc
    const priceSorted = filterAndSortExplorePackages(syntheticTies, {
      sort: "price_low",
    });
    expect(priceSorted.map((p) => p.id)).toEqual([
      "pkg_higher_rating",
      "pkg_a",
      "pkg_b",
    ]);
  });

  it("22. safely ignores unknown destination filter and does not constrain catalog", () => {
    const results = filterAndSortExplorePackages(MOCK_RECOMMENDATION_PACKAGES, {
      destination: "DestinasiFiktifTidakAda",
    });
    // Unknown destination is safely ignored, returning all LIVE packages
    expect(results.length).toBe(MOCK_RECOMMENDATION_PACKAGES.length);
  });

  it("extracts unique available destination names", () => {
    const dests = extractAvailableDestinations(MOCK_RECOMMENDATION_PACKAGES);
    expect(dests).toEqual([
      "Desa Wisata Budaya",
      "Lembah Alam Pacet",
      "Lereng Hijau Batu",
      "Oase Hening Trawas",
      "Taman Alam Prigen",
    ]);
  });
});
