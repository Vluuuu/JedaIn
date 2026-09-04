// Deterministic prototype community and directory store for social discovery
// Zero random numbers, zero Math.random, zero hardcoded numbers in JSX
// Safe default of 0 / 0 for unknown travelers
// Complete follow/unfollow and search support

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
let followRelations = new Set<string>([
  "usr_traveler_siti:usr_traveler_1",
  "usr_traveler_adi:usr_traveler_1",
  "usr_traveler_1:usr_traveler_maya",
]);

const baseCounts: Record<string, CommunityCounts> = {
  usr_traveler_1: { followers: 12, following: 8 },
  usr_demo: { followers: 7, following: 5 },
  usr_traveler_siti: { followers: 15, following: 9 },
  usr_traveler_adi: { followers: 6, following: 4 },
  usr_traveler_maya: { followers: 20, following: 11 },
};

let customCounts: Record<string, CommunityCounts> = { ...baseCounts };

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

  // Follow State
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
      // adjust counts
      const target = this.getCommunityCounts(targetTravelerId);
      this.setCommunityCounts(targetTravelerId, {
        followers: target.followers + 1,
        following: target.following,
      });
      const source = this.getCommunityCounts(currentTravelerId);
      this.setCommunityCounts(currentTravelerId, {
        followers: source.followers,
        following: source.following + 1,
      });
      return true;
    }
    return false;
  },

  unfollow(currentTravelerId: string, targetTravelerId: string): boolean {
    if (!currentTravelerId || !targetTravelerId) return false;
    const key = `${currentTravelerId}:${targetTravelerId}`;
    if (followRelations.has(key)) {
      followRelations.delete(key);
      // adjust counts
      const target = this.getCommunityCounts(targetTravelerId);
      this.setCommunityCounts(targetTravelerId, {
        followers: Math.max(0, target.followers - 1),
        following: target.following,
      });
      const source = this.getCommunityCounts(currentTravelerId);
      this.setCommunityCounts(currentTravelerId, {
        followers: source.followers,
        following: Math.max(0, source.following - 1),
      });
      return true;
    }
    return false;
  },

  getFollowersList(travelerId: string): PublicTravelerRecord[] {
    const followerIds: string[] = [];
    for (const rel of followRelations) {
      const [follower, following] = rel.split(":");
      if (following === travelerId) {
        followerIds.push(follower);
      }
    }
    // If store has seed relationships, return those; plus fill from directory if needed
    const matched = travelersDirectory.filter((t) =>
      followerIds.includes(t.travelerId),
    );
    if (matched.length > 0) return matched;
    // Fallback deterministic sample for prototype
    return travelersDirectory
      .filter((t) => t.travelerId !== travelerId)
      .slice(0, 3);
  },

  getFollowingList(travelerId: string): PublicTravelerRecord[] {
    const followingIds: string[] = [];
    for (const rel of followRelations) {
      const [follower, following] = rel.split(":");
      if (follower === travelerId) {
        followingIds.push(following);
      }
    }
    const matched = travelersDirectory.filter((t) =>
      followingIds.includes(t.travelerId),
    );
    if (matched.length > 0) return matched;
    return travelersDirectory
      .filter((t) => t.travelerId !== travelerId)
      .slice(0, 2);
  },

  // Counts
  getFollowerCount(travelerId: string): number {
    if (!travelerId) return 0;
    return customCounts[travelerId]?.followers ?? 0;
  },

  getFollowingCount(travelerId: string): number {
    if (!travelerId) return 0;
    return customCounts[travelerId]?.following ?? 0;
  },

  getCommunityCounts(travelerId: string): CommunityCounts {
    return {
      followers: this.getFollowerCount(travelerId),
      following: this.getFollowingCount(travelerId),
    };
  },

  setCommunityCounts(
    travelerId: string,
    counts: { followers: number; following: number },
  ): void {
    customCounts[travelerId] = {
      followers: Math.max(0, counts.followers),
      following: Math.max(0, counts.following),
    };
  },

  reset(): void {
    travelersDirectory = [...defaultTravelers];
    followRelations = new Set<string>([
      "usr_traveler_siti:usr_traveler_1",
      "usr_traveler_adi:usr_traveler_1",
      "usr_traveler_1:usr_traveler_maya",
    ]);

    customCounts = {};
    for (const [k, v] of Object.entries(baseCounts)) {
      customCounts[k] = { ...v };
    }
  },
};
