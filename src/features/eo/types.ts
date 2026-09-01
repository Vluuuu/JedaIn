export type EoApplicationStatus =
  "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type EoGuideStatus = "CONCEPT_ONLY" | "CERTIFIED_GUIDE";

export interface PartnerUser {
  id: string;
  email: string;
  name: string;
  role: "EO" | "DESTINATION" | "ADMIN";
  businessName: string;
  guideStatus?: EoGuideStatus;
  organizerReviewRef?: string;
  destinationIdentityId?: string;
}

export interface EoApplicationRecord {
  applicationId: string;
  identityId: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  experienceDescription: string;
  portfolioLink?: string;
  yearsOfOperation: number;
  guideStatus: EoGuideStatus;
  guideCertificateDoc?: {
    name: string;
    uploadedAt: string;
    status: "ATTACHED" | "VERIFIED";
  };
  insuranceDoc?: {
    name: string;
    uploadedAt: string;
    status: "ATTACHED" | "VERIFIED";
  };
  agreedToSop: boolean;
  status: EoApplicationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type DestinationVerificationLevel = "BASIC" | "PLUS";

export interface DestinationRecord {
  destinationId: string;
  name: string;
  locationLabel: string;
  province: string;
  city: string;
  verificationLevel: DestinationVerificationLevel;
  guideReady: boolean;
  baseCostPerPerson: number;
  description: string;
  highlights: string[];
  capacityPerSession: number;
  imageUrl?: string;
  status: "ACTIVE" | "INACTIVE";
}

export type DemandIntent =
  "NATURE" | "CALM" | "EXPLORATION" | "REFLECTION" | "ACTIVE" | "QUALITY_TIME";

export interface DemandSignalSummary {
  intent: DemandIntent;
  intentLabel: string;
  percentage: number;
  travelerCount: number;
  description: string;
}

export interface DemandDistributionItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
  description?: string;
}

export interface DemandInsightRecord {
  insightId: string;
  title: string;
  intent: DemandIntent;
  intentLabel: string;
  targetArea: string;
  durationLabel: string;
  preferredBudgetRange: string;
  travelerDemandCount: number;
  unmetDemandDescription: string;
  recommendedFocus: string[];
  sampleActivities: string[];
}

export type EoPackageStatus =
  "DRAFT" | "PENDING_ADMIN_REVIEW" | "REJECTED" | "APPROVED" | "LIVE";

export interface EoItineraryItem {
  order: number;
  title: string;
  description: string;
  timeOfDayLabel?: string;
  durationLabel?: string;
}

export interface EoPackagePricing {
  destinationBaseCost: number;
  eoMargin: number;
  customerPrice: number;
}

export interface EoValidationError {
  step: number;
  field: string;
  message: string;
}

export interface EoValidationResult {
  valid: boolean;
  errors: EoValidationError[];
}

export interface EoPackageRecord {
  packageId: string;
  eoId: string;
  eoDisplayName: string;
  title: string;
  shortSummary: string;
  valueProposition: string;
  destinationId: string;
  insightId?: string;
  durationLabel: string;
  suitableGroupTypes: string[];
  highlights: string[];
  itinerary: EoItineraryItem[];
  includedItems: string[];
  excludedItems: string[];
  safetyNotes: string[];
  pricing: EoPackagePricing;
  guideStatus: EoGuideStatus;
  status: EoPackageStatus;
  validationResult?: EoValidationResult;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type EoSessionStatus = "OPEN" | "FULL" | "CLOSED" | "CANCELLED";

export interface EoSessionRecord {
  sessionId: string;
  packageId: string;
  eoId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  remainingSlots: number;
  pricePerPerson: number;
  status: EoSessionStatus;
  createdAt: string;
}
