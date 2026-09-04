// Deterministic prototype community store for social metrics
// Ensures zero random numbers, zero Math.random, zero hardcoded numbers in JSX
// Safe default of 0 / 0 for unknown travelers

export interface CommunityCounts {
  followers: number;
  following: number;
}

const communityRegistry: Record<string, CommunityCounts> = {
  // Deterministic demo seed for prototype travelers
  usr_traveler_1: {
    followers: 12,
    following: 8,
  },
  usr_demo: {
    followers: 7,
    following: 5,
  },
};

export const mockTravelerCommunityStore = {
  getFollowerCount(travelerId: string): number {
    if (!travelerId) return 0;
    return communityRegistry[travelerId]?.followers ?? 0;
  },

  getFollowingCount(travelerId: string): number {
    if (!travelerId) return 0;
    return communityRegistry[travelerId]?.following ?? 0;
  },

  getCommunityCounts(travelerId: string): CommunityCounts {
    return {
      followers: this.getFollowerCount(travelerId),
      following: this.getFollowingCount(travelerId),
    };
  },

  // Prototype helper for deterministic test fixtures
  setCommunityCounts(
    travelerId: string,
    counts: { followers: number; following: number },
  ): void {
    communityRegistry[travelerId] = {
      followers: Math.max(0, counts.followers),
      following: Math.max(0, counts.following),
    };
  },

  reset(): void {
    // restore defaults
    for (const key of Object.keys(communityRegistry)) {
      if (key !== "usr_traveler_1" && key !== "usr_demo") {
        delete communityRegistry[key];
      }
    }
    communityRegistry.usr_traveler_1 = { followers: 12, following: 8 };
    communityRegistry.usr_demo = { followers: 7, following: 5 };
  },
};
