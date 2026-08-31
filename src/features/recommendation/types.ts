import type {
  BudgetBand,
  CurrentIntent,
  DepartureAreaId,
  DurationPreference,
  GroupSizeBand,
  GroupType,
  PreferredActivity,
} from "../quiz/types";

export type PackageStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "LIVE" | "REJECTED";

export type VerificationLevel = "BASIC" | "PLUS";

export interface PackageRecommendationSource {
  id: string;
  title: string;
  shortSummary: string;
  destinationName: string;
  locationLabel: string;
  visualAsset: string;
  status: PackageStatus;
  verificationLevel: VerificationLevel;
  pricePerPerson: number;
  durationType: DurationPreference;
  departureAreas: DepartureAreaId[];
  experienceIntents: CurrentIntent[];
  activityTags: PreferredActivity[];
  suitableGroupTypes: GroupType[];
  suitableGroupSizeBands: GroupSizeBand[];
  rating: number;
  popularityRank: number;
}

export type RecommendationState = "LOADING" | "MATCHED" | "FALLBACK" | "ERROR";

export interface RecommendationItem {
  package: PackageRecommendationSource;
  reasons: string[];
}

export interface RecommendationResult {
  state: "MATCHED" | "FALLBACK";
  topRecommendation?: RecommendationItem;
  alternatives: RecommendationItem[];
}

export interface UnmatchedDemandEvent {
  quizSignalSnapshot: {
    current_intent?: CurrentIntent;
    preferred_activities: PreferredActivity[];
    budget_band?: BudgetBand;
    duration_preference?: DurationPreference;
    departure_area_id?: DepartureAreaId;
    departure_area_label?: string;
    group_type?: GroupType;
    group_size_band?: GroupSizeBand;
  };
  timestamp: string;
  reason: "NO_SUFFICIENT_MATCH";
}

export interface RecommendationAdapter {
  getRecommendations(): Promise<RecommendationResult>;
  logUnmatchedDemand?(event: UnmatchedDemandEvent): Promise<void>;
}
