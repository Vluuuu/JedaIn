// Deterministic prototype community and directory store for social discovery
// SINGLE SOURCE OF TRUTH: All followers and following counts are 100% derived from the graph edges (followRelations).
// Zero fake counters, zero arbitrary fallback lists, zero random numbers.

export interface CommunityCounts {
  followers: number;
  following: number;
}

export interface PublicTravelerRecord {
  travelerId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  completedJedaCount: number;
}

const defaultTravelers: PublicTravelerRecord[] = [
  {
    travelerId: "usr_traveler_1",
    displayName: "Budi Santoso",
    bio: "Mencari jeda pelan di tengah rutinitas.",
    completedJedaCount: 3,
  },
  {
    travelerId: "usr_demo",
    displayName: "Dewo",
    bio: "Menemukan ketenangan dalam langkah sederhana.",
    completedJedaCount: 1,
  },
  {
    travelerId: "usr_traveler_siti",
    displayName: "Siti Rahma",
    bio: "Pecinta kabut pagi dan jalan santai di desa.",
    completedJedaCount: 4,
  },
  {
    travelerId: "usr_traveler_adi",
    displayName: "Adi Nugroho",
    bio: "Menikmati udara dingin lereng gunung.",
    completedJedaCount: 2,
  },
  {
    travelerId: "usr_traveler_maya",
    displayName: "Maya Lestari",
    bio: "Recharge energi di alam terbuka.",
    completedJedaCount: 5,
  },
];

let travelersDirectory: PublicTravelerRecord[] = [...defaultTravelers];

// Graph relationship: Set of "followerId:followingId"
// Seeded truthful relationships:
// usr_traveler_siti follows usr_traveler_1
// usr_traveler_adi follows usr_traveler_1
// usr_traveler_1 follows usr_traveler_maya
let followRelations = new Set<string>([
  "usr_traveler_siti:usr_traveler_1",
  "usr_traveler_adi:usr_traveler_1",
  "usr_traveler_1:usr_traveler_maya",
]);

export const mockTravelerCommunityStore = {
  // Directory & Search
  getAllTravelers(): PublicTravelerRecord[] {
    return [...travelersDirectory];
  },

  getTravelerById(travelerId: string): PublicTravelerRecord | undefined {
    return travelersDirectory.find((t) => t.travelerId === travelerId);
  },

  searchTravelers(query: string): PublicTravelerRecord[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return travelersDirectory.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        (t.bio && t.bio.toLowerCase().includes(q)),
    );
  },

  registerOrUpdateTraveler(
    traveler: Partial<PublicTravelerRecord> & { travelerId: string },
  ): void {
    const idx = travelersDirectory.findIndex(
      (t) => t.travelerId === traveler.travelerId,
    );
    if (idx >= 0) {
      travelersDirectory[idx] = { ...travelersDirectory[idx], ...traveler };
    } else {
      travelersDirectory.push({
        travelerId: traveler.travelerId,
        displayName: traveler.displayName || "Traveler JedaIn",
        bio: traveler.bio,
        avatarUrl: traveler.avatarUrl,
        completedJedaCount: traveler.completedJedaCount ?? 0,
      });
    }
  },

  // Follow State & Graph Manipulation
  isFollowing(currentTravelerId: string, targetTravelerId: string): boolean {
    if (!currentTravelerId || !targetTravelerId) return false;
    return followRelations.has(`${currentTravelerId}:${targetTravelerId}`);
  },

  follow(currentTravelerId: string, targetTravelerId: string): boolean {
    if (
      !currentTravelerId ||
      !targetTravelerId ||
      currentTravelerId === targetTravelerId
    ) {
      return false;
    }
    const key = `${currentTravelerId}:${targetTravelerId}`;
    if (!followRelations.has(key)) {
      followRelations.add(key);
      return true;
    }
    return false;
  },

  unfollow(currentTravelerId: string, targetTravelerId: string): boolean {
    if (!currentTravelerId || !targetTravelerId) return false;
    const key = `${currentTravelerId}:${targetTravelerId}`;
    if (followRelations.has(key)) {
      followRelations.delete(key);
      return true;
    }
    return false;
  },

  // Graph-Derived Lists (Truthful: zero fake fallbacks, returns empty array if no edges)
  getFollowersList(travelerId: string): PublicTravelerRecord[] {
    if (!travelerId) return [];
    const followerIds: string[] = [];
    for (const rel of followRelations) {
      const [follower, following] = rel.split(":");
      if (following === travelerId) {
        followerIds.push(follower);
      }
    }
    return followerIds.map((id) => {
      const found = travelersDirectory.find((t) => t.travelerId === id);
      return (
        found || {
          travelerId: id,
          displayName: "Traveler JedaIn",
          completedJedaCount: 0,
        }
      );
    });
  },

  getFollowingList(travelerId: string): PublicTravelerRecord[] {
    if (!travelerId) return [];
    const followingIds: string[] = [];
    for (const rel of followRelations) {
      const [follower, following] = rel.split(":");
      if (follower === travelerId) {
        followingIds.push(following);
      }
    }
    return followingIds.map((id) => {
      const found = travelersDirectory.find((t) => t.travelerId === id);
      return (
        found || {
          travelerId: id,
          displayName: "Traveler JedaIn",
          completedJedaCount: 0,
        }
      );
    });
  },

  // Graph-Derived Counts (Strict Single Source of Truth)
  getFollowerCount(travelerId: string): number {
    return this.getFollowersList(travelerId).length;
  },

  getFollowingCount(travelerId: string): number {
    return this.getFollowingList(travelerId).length;
  },

  getCommunityCounts(travelerId: string): CommunityCounts {
    return {
      followers: this.getFollowerCount(travelerId),
      following: this.getFollowingCount(travelerId),
    };
  },

  reset(): void {
    travelersDirectory = [...defaultTravelers];
    followRelations = new Set<string>([
      "usr_traveler_siti:usr_traveler_1",
      "usr_traveler_adi:usr_traveler_1",
      "usr_traveler_1:usr_traveler_maya",
    ]);
  },
};
