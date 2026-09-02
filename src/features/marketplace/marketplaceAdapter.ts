import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import type { EoPackageRecord } from "../eo/types";
import { resolveOrganizerReviewRef } from "../identity/identityResolvers";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type {
  CurrentIntent,
  DepartureAreaId,
  DurationPreference,
  GroupSizeBand,
  GroupType,
  PreferredActivity,
} from "../quiz/types";
import type { PackageRecommendationSource } from "../recommendation/types";

/**
 * Maps duration string to DurationPreference.
 */
function inferDurationType(durationLabel: string): DurationPreference {
  const norm = durationLabel.toLowerCase();
  if (
    norm.includes("setengah") ||
    norm.includes("half") ||
    norm.includes("jam")
  ) {
    return "HALF_DAY";
  }
  if (
    norm.includes("2d1n") ||
    norm.includes("2 hari 1 malam") ||
    norm.includes("menginap")
  ) {
    return "TWO_D_ONE_N";
  }
  if (norm.includes("3d2n") || norm.includes("3 hari")) {
    return "THREE_D_TWO_N_PLUS";
  }
  return "FULL_DAY";
}

/**
 * Maps destination location or city to DepartureAreaId.
 */
function inferDepartureAreas(cityOrProvince: string): DepartureAreaId[] {
  const norm = cityOrProvince.toLowerCase();
  if (
    norm.includes("surabaya") ||
    norm.includes("mojokerto") ||
    norm.includes("pasuruan") ||
    norm.includes("trawas") ||
    norm.includes("pacet")
  ) {
    return ["SURABAYA", "MALANG"];
  }
  return ["MALANG"];
}

/**
 * Maps EO group types to typed GroupType array.
 */
function mapGroupTypes(types: string[]): GroupType[] {
  const valid: GroupType[] = [];
  for (const t of types) {
    if (t === "SOLO" || t === "PARTNER" || t === "FRIENDS" || t === "FAMILY") {
      valid.push(t);
    }
  }
  return valid.length > 0 ? valid : ["SOLO", "PARTNER", "FRIENDS"];
}

/**
 * Synthesizes a PackageRecommendationSource read model from an eligible LIVE EO Package.
 */
export function buildTravelerPackageFromEo(
  eoPkg: EoPackageRecord,
): PackageRecommendationSource | null {
  if (eoPkg.status !== "LIVE") return null;

  const dest = mockDestinationStore.getById(eoPkg.destinationId);
  if (!dest || dest.status !== "ACTIVE") return null;

  // Derive experience intents from highlights/summary
  const intents: CurrentIntent[] = ["RECHARGE", "NATURE"];
  const activityTags: PreferredActivity[] = [
    "NATURE_SCENERY",
    "MINDFULNESS_RELAXATION",
  ];

  const suitableGroupSizeBands: GroupSizeBand[] = [
    "ONE",
    "TWO",
    "THREE_TO_FOUR",
  ];

  return {
    id: eoPkg.packageId,
    title: eoPkg.title,
    shortSummary: eoPkg.shortSummary || eoPkg.valueProposition,
    destinationName: dest.name,
    locationLabel: dest.locationLabel,
    visualAsset: dest.imageUrl || "/assets/packages/slow_green_day.jpg",
    status: "LIVE",
    verificationLevel: dest.verificationLevel,
    pricePerPerson: eoPkg.pricing.customerPrice,
    durationType: inferDurationType(eoPkg.durationLabel),
    departureAreas: inferDepartureAreas(dest.city || dest.locationLabel),
    experienceIntents: intents,
    activityTags,
    suitableGroupTypes: mapGroupTypes(eoPkg.suitableGroupTypes),
    suitableGroupSizeBands,
    rating: 5.0, // Default for newly verified packages without review skew
    popularityRank: 90,
  };
}

/**
 * Synthesizes a PackageDetailSource read model from an eligible LIVE EO Package.
 */
export function buildTravelerPackageDetailFromEo(
  eoPkg: EoPackageRecord,
): PackageDetailSource | null {
  if (eoPkg.status !== "LIVE") return null;

  const dest = mockDestinationStore.getById(eoPkg.destinationId);
  if (!dest || dest.status !== "ACTIVE") return null;

  const app = mockApplicationStore.getBySellerId(eoPkg.eoId);
  const eoSessions = mockEoPackageStore.getSessionsByPackage(eoPkg.packageId);

  const upcomingSessionPreviews: PackageSessionPreview[] = eoSessions.map(
    (s) => ({
      sessionId: s.sessionId,
      packageId: s.packageId,
      startAt: s.startAt,
      endAt: s.endAt,
      status: s.status,
      pricePerPerson: s.pricePerPerson,
      remainingSlots: s.remainingSlots,
    }),
  );

  const organizerRef = resolveOrganizerReviewRef(eoPkg.eoId);

  return {
    packageId: eoPkg.packageId,
    valueProposition: eoPkg.valueProposition || eoPkg.shortSummary,
    highlights: [...eoPkg.highlights],
    itinerary: eoPkg.itinerary.map((it) => ({
      order: it.order,
      title: it.title,
      description: it.description,
      timeOfDayLabel: it.timeOfDayLabel,
      durationLabel: it.durationLabel,
    })),
    includedItems: [...eoPkg.includedItems],
    excludedItems: [...eoPkg.excludedItems],
    safetyNotes: [...eoPkg.safetyNotes],
    cancellationPolicySummary:
      "Detail ketentuan pembatalan dan refund akan ditampilkan kembali saat checkout sebelum konfirmasi pembayaran.",
    organizer: {
      id: organizerRef,
      displayName:
        eoPkg.eoDisplayName || app?.businessName || "Mitra EO Terverifikasi",
      guideStatus: eoPkg.guideStatus,
      roleDescription: "Event Organizer Komunitas Wellness Terverifikasi",
      bioSummary:
        app?.experienceDescription ||
        "Penyelenggara perjalanan mindful terverifikasi JedaIn.",
    },
    destinationDetail: {
      overviewDescription: dest.description,
    },
    upcomingSessionPreviews,
  };
}

/**
 * Returns all active catalog packages combining static Traveler fixtures and eligible LIVE EO packages.
 */
export function getCombinedCatalogPackages(
  fallbackPackages: PackageRecommendationSource[] = MOCK_RECOMMENDATION_PACKAGES,
): PackageRecommendationSource[] {
  const eoPackages = mockEoPackageStore.getAllPackages();
  const dynamicPackages: PackageRecommendationSource[] = [];

  for (const eoPkg of eoPackages) {
    if (eoPkg.status === "LIVE") {
      // If packageId is already in static fixtures, static fixture takes precedence or can be updated
      const alreadyInStatic = fallbackPackages.some(
        (p) => p.id === eoPkg.packageId,
      );
      if (!alreadyInStatic) {
        const converted = buildTravelerPackageFromEo(eoPkg);
        if (converted) {
          dynamicPackages.push(converted);
        }
      }
    }
  }

  return [...fallbackPackages, ...dynamicPackages];
}

/**
 * Returns combined package detail sources combining static fixtures and eligible LIVE EO packages.
 */
export function getCombinedPackageDetails(
  fallbackDetails: Record<string, PackageDetailSource> = MOCK_PACKAGE_DETAILS,
): Record<string, PackageDetailSource> {
  const combined: Record<string, PackageDetailSource> = { ...fallbackDetails };
  const eoPackages = mockEoPackageStore.getAllPackages();

  for (const eoPkg of eoPackages) {
    if (eoPkg.status === "LIVE") {
      if (!combined[eoPkg.packageId]) {
        const detail = buildTravelerPackageDetailFromEo(eoPkg);
        if (detail) {
          combined[eoPkg.packageId] = detail;
        }
      } else {
        // For slow_green_day or existing packages, ensure sessions from mockEoPackageStore are also bridged
        const eoSessions = mockEoPackageStore.getSessionsByPackage(
          eoPkg.packageId,
        );
        if (eoSessions.length > 0) {
          combined[eoPkg.packageId] = {
            ...combined[eoPkg.packageId],
            upcomingSessionPreviews: eoSessions.map((s) => ({
              sessionId: s.sessionId,
              packageId: s.packageId,
              startAt: s.startAt,
              endAt: s.endAt,
              status: s.status,
              pricePerPerson: s.pricePerPerson,
              remainingSlots: s.remainingSlots,
            })),
          };
        }
      }
    }
  }

  return combined;
}
