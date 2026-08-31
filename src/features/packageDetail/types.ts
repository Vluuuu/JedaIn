import type { PackageRecommendationSource } from "../recommendation/types";

export type EoGuideStatus = "CONCEPT_ONLY" | "CERTIFIED_GUIDE";

export type SessionPreviewStatus = "OPEN" | "FULL" | "CLOSED" | "CANCELLED";

export interface PackageOrganizerProfile {
  id: string;
  displayName: string;
  guideStatus: EoGuideStatus;
  roleDescription?: string;
  bioSummary?: string;
}

export interface PackageDestinationDetail {
  overviewDescription: string;
}

export interface ItineraryItem {
  order: number;
  title: string;
  description: string;
  timeOfDayLabel?: string;
  durationLabel?: string;
}

export interface PackageSessionPreview {
  sessionId: string;
  packageId: string;
  startAt: string;
  endAt: string;
  status: SessionPreviewStatus;
  pricePerPerson?: number;
  remainingSlots?: number;
}

export interface PackageReviewExcerpt {
  bookingId: string;
  bookingStatus: "COMPLETED";
  authorName: string;
  rating: number;
  comment: string;
  tripDateLabel: string;
}

export interface PackageDetailSource {
  packageId: string;
  valueProposition: string;
  highlights: string[];
  itinerary: ItineraryItem[];
  includedItems: string[];
  excludedItems: string[];
  safetyNotes: string[];
  cancellationPolicySummary: string;
  organizer: PackageOrganizerProfile;
  destinationDetail: PackageDestinationDetail;
  upcomingSessionPreviews: PackageSessionPreview[];
  reviewPreview?: {
    excerpts: PackageReviewExcerpt[];
  };
}

export type PackageDetailState = "LOADING" | "READY" | "NOT_FOUND" | "ERROR";

export type PersonalizedReasonMode = "MATCHED" | "FALLBACK";

export interface PersonalizedContext {
  reasons: string[];
  mode: PersonalizedReasonMode;
}

export interface PackageDetailViewModel {
  state: PackageDetailState;
  package?: PackageRecommendationSource;
  detail?: PackageDetailSource;
  hasOpenSession: boolean;
  personalizedContext?: PersonalizedContext;
  errorMessage?: string;
}

export interface PackageDetailAdapter {
  getPackageDetail(
    packageId: string,
    options?: { personalizedContext?: PersonalizedContext },
  ): Promise<PackageDetailViewModel>;
}
