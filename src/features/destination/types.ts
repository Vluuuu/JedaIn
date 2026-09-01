import type { DestinationVerificationLevel } from "../eo/types";

export interface DestinationPartnerUser {
  id: string;
  email: string;
  name: string;
  role: "DESTINATION";
  businessName: string;
  destinationIdentityId: string;
}

export type DestinationApplicationStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface DestinationApplicationDraft {
  applicationId?: string;
  partnerIdentityId: string;
  destinationIdentityId?: string;
  name: string;
  locationLabel: string;
  province: string;
  city: string;
  managementName: string;
  contactPerson: string;
  phone: string;
  email: string;
  legalEntityDoc?: {
    name: string;
    uploadedAt: string;
    status: "ATTACHED" | "VERIFIED";
  };
  description: string;
  highlights: string[];
  capacityPerSession: number;
  baseCostPerPerson: number;
  guideReady: boolean;
  guideReadinessEvidence: string;
  agreedToSop: boolean;
}

export interface DestinationOverviewMetrics {
  verificationLevel: DestinationVerificationLevel;
  guideReady: boolean;
  upcomingSessionsCount: number;
  confirmedParticipantsCount: number;
  averageRating?: string;
  reviewCount: number;
  profileCompletenessPercentage: number;
  completedProfileItems: number;
  totalProfileItems: number;
}
