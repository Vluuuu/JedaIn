import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { mockInsightStore } from "../eo/mockInsightStore";
import type { DemandIntent, EoPackageRecord } from "../eo/types";
import {
  resolveDestinationReviewRef,
  resolveOrganizerReviewRef,
} from "../identity/identityResolvers";
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
  GroupType,
  PreferredActivity,
} from "../quiz/types";
import type { PackageRecommendationSource } from "../recommendation/types";
import { mockReviewStore } from "../reviews/mockReviewStore";

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
 * Maps DemandIntent to Traveler CurrentIntent.
 */
function mapDemandIntentToTraveler(intent?: DemandIntent): CurrentIntent[] {
  if (!intent) return [];
  switch (intent) {
    case "NATURE":
      return ["NATURE"];
    case "CALM":
      return ["RECHARGE"];
    case "EXPLORATION":
      return ["NOVELTY"];
    case "REFLECTION":
      return ["REFLECTION"];
    case "ACTIVE":
      return ["ACTIVE"];
    case "QUALITY_TIME":
      return ["SOCIAL"];
    default:
      return [];
  }
}

/**
 * Maps authoritative insight target area to DepartureAreaId.
 */
function mapTargetAreaToDepartureAreas(targetArea?: string): DepartureAreaId[] {
  if (!targetArea) return [];
  const norm = targetArea.toLowerCase();
  const areas: DepartureAreaId[] = [];
  if (norm.includes("malang") || norm.includes("batu")) {
    areas.push("MALANG");
  }
  if (norm.includes("surabaya") || norm.includes("sidoarjo")) {
    areas.push("SURABAYA");
  }
  return areas;
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
  return valid;
}

/**
 * Derives real average rating from actual reviews for the package or destination/organizer.
 */
function deriveActualPackageRating(
  eoPkg: EoPackageRecord,
  destinationName: string,
): number | null {
  const destRef = resolveDestinationReviewRef(destinationName);
  const orgRef = resolveOrganizerReviewRef(eoPkg.eoId);

  const destReviews = mockReviewStore.getReviewsForDestination(destRef);
  const orgReviews = mockReviewStore.getReviewsForOrganizer(orgRef);

  const allRatings = [...destReviews, ...orgReviews].map((r) => r.rating);
  if (allRatings.length === 0) return null;

  const avg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
  return Number(avg.toFixed(2));
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

  const app = mockApplicationStore.getBySellerId(eoPkg.eoId);
  if (!app || app.status !== "APPROVED") return null;

  const insight = eoPkg.insightId
    ? mockInsightStore.getInsightById(eoPkg.insightId)
    : undefined;

  const experienceIntents = mapDemandIntentToTraveler(insight?.intent);
  const departureAreas = mapTargetAreaToDepartureAreas(insight?.targetArea);
  const activityTags: PreferredActivity[] = [];

  const actualRating = deriveActualPackageRating(eoPkg, dest.name);

  return {
    id: eoPkg.packageId,
    title: eoPkg.title,
    shortSummary: eoPkg.shortSummary || eoPkg.valueProposition,
    destinationName: dest.name,
    locationLabel: dest.locationLabel,
    visualAsset: dest.imageUrl || "",
    status: "LIVE",
    verificationLevel: dest.verificationLevel,
    pricePerPerson: eoPkg.pricing.customerPrice,
    durationType: inferDurationType(eoPkg.durationLabel),
    departureAreas,
    experienceIntents,
    activityTags,
    suitableGroupTypes: mapGroupTypes(eoPkg.suitableGroupTypes),
    suitableGroupSizeBands: [],
    rating: actualRating,
    popularityRank: null,
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
  if (!app || app.status !== "APPROVED") return null;

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
      "Kebijakan pembatalan spesifik belum tersedia pada prototype ini.",
    organizer: {
      id: organizerRef,
      displayName:
        eoPkg.eoDisplayName || app.businessName || "Mitra EO Terverifikasi",
      guideStatus: eoPkg.guideStatus,
      roleDescription: "Event Organizer Komunitas Wellness Terverifikasi",
      bioSummary:
        app.experienceDescription ||
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
