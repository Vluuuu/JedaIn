import { getCombinedCatalogPackages } from "../marketplace/marketplaceAdapter";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { isSupabaseMode } from "../../lib/supabase/config";
import type { MoodPresetItem, VerifiedDestinationItem } from "./types";

/**
 * Locked explore-by-mood presets per wireframe & HOME_CONTRACT.md.
 */
export const HOME_MOOD_PRESETS: MoodPresetItem[] = [
  { id: "tenang", label: "Tenang" },
  { id: "alam", label: "Alam" },
  { id: "recharge", label: "Recharge" },
  { id: "eksplorasi", label: "Eksplorasi" },
  { id: "refleksi", label: "Refleksi" },
];

/**
 * Derive de-duplicated verified destinations from LIVE prototype package catalog.
 */
export function getDerivedVerifiedDestinations(): VerifiedDestinationItem[] {
  if (isSupabaseMode()) {
    return mockDestinationStore.getEligibleForEo().map((destination) => ({
      destinationName: destination.name,
      locationLabel: destination.locationLabel,
      verificationLevel: destination.verificationLevel,
      visualAsset: destination.imageUrl,
    }));
  }
  const seen = new Set<string>();
  const destinations: VerifiedDestinationItem[] = [];

  for (const pkg of getCombinedCatalogPackages()) {
    if (pkg.status === "LIVE" && !seen.has(pkg.destinationName)) {
      seen.add(pkg.destinationName);
      destinations.push({
        destinationName: pkg.destinationName,
        locationLabel: pkg.locationLabel,
        verificationLevel: pkg.verificationLevel,
        visualAsset: pkg.visualAsset,
      });
    }
  }

  return destinations;
}
