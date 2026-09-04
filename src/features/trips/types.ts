import type { BookingRecord } from "../checkout/types";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import type { PackageRecommendationSource } from "../recommendation/types";

export type TripTab = "UPCOMING" | "COMPLETED" | "HISTORY";

export interface TripCardItem {
  booking: BookingRecord;
  package?: PackageRecommendationSource;
  session?: PackageSessionPreview;
  isPendingPayment?: boolean;
}

export interface MyTripsViewModel {
  activePendingTrip?: TripCardItem;
  upcomingTrips: TripCardItem[];
  completedTrips: TripCardItem[];
  historyTrips: TripCardItem[];
}

export interface TripOrganizerContact {
  contactPerson: string;
  phone?: string;
  email?: string;
}

export interface TripDetailViewModel {
  booking: BookingRecord;
  package?: PackageRecommendationSource;
  detail?: PackageDetailSource;
  session?: PackageSessionPreview;
  hasDestinationReview?: boolean;
  hasEoReview?: boolean;
  organizerContact?: TripOrganizerContact;
}

export interface TripsAdapter {
  getMyTrips(): Promise<MyTripsViewModel>;
  getTripDetail(bookingId: string): Promise<TripDetailViewModel | null>;
}
