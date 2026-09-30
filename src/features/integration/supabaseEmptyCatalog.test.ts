import { afterEach, describe, expect, it, vi } from "vitest";
import { destinationRepository } from "../../data/destinationRepository";
import { packageRepository } from "../../data/packageRepository";
import { sessionRepository } from "../../data/sessionRepository";
import {
  setDataModeOverride,
  setSupabaseConfigOverride,
} from "../../lib/supabase/config";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { MockExploreAdapter } from "../explore/mockAdapter";
import { getDerivedVerifiedDestinations } from "../home/config";
import { MockHomeAdapter } from "../home/mockAdapter";
import { MockRecommendationAdapter } from "../recommendation/mockAdapter";
import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
  syncMarketplaceFromSupabase,
} from "../marketplace/marketplaceAdapter";

describe("Supabase empty demo catalog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setDataModeOverride(null);
    setSupabaseConfigOverride(null);
    mockDestinationStore.reset();
    mockEoPackageStore.reset();
  });

  it("replaces seeded caches and exposes only the live destination with no packages", async () => {
    const lereng = mockDestinationStore.getById("dest_lereng_hijau");
    expect(lereng).toBeDefined();
    expect(mockEoPackageStore.getAllPackages().length).toBeGreaterThan(0);

    setDataModeOverride("supabase");
    setSupabaseConfigOverride({
      url: "https://yykgpvgwougibnhhxttw.supabase.co",
      publishableKey: "test-key",
    });
    vi.spyOn(destinationRepository, "getAll").mockResolvedValue([lereng!]);
    vi.spyOn(packageRepository, "getAllPackages").mockResolvedValue([]);
    vi.spyOn(sessionRepository, "getAllSessions").mockResolvedValue([]);

    await syncMarketplaceFromSupabase();

    expect(
      mockDestinationStore.getAll().map((dest) => dest.destinationId),
    ).toEqual(["dest_lereng_hijau"]);
    expect(mockEoPackageStore.getAllPackages()).toEqual([]);
    expect(mockEoPackageStore.getAllSessions()).toEqual([]);
    expect(getCombinedCatalogPackages()).toEqual([]);
    expect(getCombinedPackageDetails()).toEqual({});
    expect(
      getDerivedVerifiedDestinations().map((dest) => dest.destinationName),
    ).toEqual(["Lereng Hijau Batu"]);

    const explore = await new MockExploreAdapter().getExplorePackages({
      query: "",
    });
    expect(explore.packages).toEqual([]);
    expect(explore.availableDestinations).toEqual([]);

    const home = await new MockHomeAdapter().getHomeData();
    expect(home.popularPackages).toEqual([]);
    expect(
      home.verifiedDestinations.map((dest) => dest.destinationName),
    ).toEqual(["Lereng Hijau Batu"]);

    const recommendation =
      await new MockRecommendationAdapter().getRecommendations({
        currentStep: 6,
        current_intent: "NATURE",
        preferred_activities: ["NATURE_SCENERY"],
        budget_band: "AROUND_200_300K",
        duration_preference: "FULL_DAY",
        departure_area_id: "MALANG",
        group_type: "SOLO",
        group_size_band: "ONE",
      });
    expect(recommendation).toEqual({ state: "EMPTY", alternatives: [] });
  });
});
