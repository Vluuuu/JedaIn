import type { AuthUser } from "../auth/types";
import type { QuizDraft } from "../quiz/types";
import type {
  PackageRecommendationSource,
  RecommendationItem,
  VerificationLevel,
} from "../recommendation/types";

export type HomeState =
  | "NORMAL"
  | "PENDING_PAYMENT_ONLY"
  | "UPCOMING_TRIP_ONLY"
  | "PENDING_PAYMENT_AND_UPCOMING"
  | "NO_RECOMMENDATION"
  | "LOADING"
  | "ERROR_PARTIAL";

export interface PendingPaymentSummary {
  bookingId: string;
  packageName: string;
  sessionLabel?: string;
  amount?: number;
  expiresAt: string; // ISO timestamp
  authoritativeStatus: "PENDING_PAYMENT";
}

export interface UpcomingTripSummary {
  bookingId: string;
  packageName: string;
  tripDate: string; // Display formatted or ISO
  destinationLabel: string;
  meetingOrDepartureSummary?: string;
}

export interface VerifiedDestinationItem {
  destinationName: string;
  locationLabel: string;
  verificationLevel: VerificationLevel;
  visualAsset?: string;
}

export interface MoodPresetItem {
  id: string;
  label: string;
}

export interface HomeViewModel {
  state: HomeState;
  traveler: AuthUser | null;
  quizDraft: QuizDraft | null;
  pendingPayment?: PendingPaymentSummary | null;
  upcomingTrip?: UpcomingTripSummary | null;
  personalizedRecommendation?: RecommendationItem | null;
  popularPackages: PackageRecommendationSource[];
  departureAreaPackages: PackageRecommendationSource[];
  departureAreaName?: string;
  verifiedDestinations: VerifiedDestinationItem[];
  moodPresets: MoodPresetItem[];
  moduleErrors?: {
    pendingPayment?: string;
    upcomingTrip?: string;
    recommendation?: string;
    popular?: string;
    departure?: string;
    destinations?: string;
  };
}

export interface HomeAdapter {
  getHomeData(): Promise<HomeViewModel>;
}
