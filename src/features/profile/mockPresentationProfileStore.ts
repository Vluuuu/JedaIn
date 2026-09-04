// In-memory presentation store for display name, bio, and avatar
// Keeps Auth identity and authentication separate

import type { TravelerPresentationProfile } from "./types";

const presentationProfiles: Record<string, TravelerPresentationProfile> = {
  usr_traveler_1: {
    travelerId: "usr_traveler_1",
    displayName: "Budi Santoso",
    bio: "Mencari jeda pelan di tengah rutinitas.",
  },
  usr_demo: {
    travelerId: "usr_demo",
    displayName: "Dewo",
    bio: "Menemukan ketenangan dalam langkah sederhana.",
  },
};

export const mockPresentationProfileStore = {
  getProfile(travelerId: string): TravelerPresentationProfile | undefined {
    return presentationProfiles[travelerId];
  },

  updateProfile(
    travelerId: string,
    updates: Partial<Omit<TravelerPresentationProfile, "travelerId">>,
  ): TravelerPresentationProfile {
    const existing = presentationProfiles[travelerId] ?? {
      travelerId,
      displayName: "",
    };
    const updated: TravelerPresentationProfile = {
      ...existing,
      ...updates,
      travelerId,
    };
    presentationProfiles[travelerId] = updated;
    return updated;
  },

  reset(): void {
    for (const key of Object.keys(presentationProfiles)) {
      delete presentationProfiles[key];
    }
    presentationProfiles.usr_traveler_1 = {
      travelerId: "usr_traveler_1",
      displayName: "Budi Santoso",
      bio: "Mencari jeda pelan di tengah rutinitas.",
    };
    presentationProfiles.usr_demo = {
      travelerId: "usr_demo",
      displayName: "Dewo",
      bio: "Menemukan ketenangan dalam langkah sederhana.",
    };
  },
};
