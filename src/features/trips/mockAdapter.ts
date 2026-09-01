import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type { PackageDetailSource } from "../packageDetail/types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { createDemoTravelerHistory } from "./demoHistory";
import type {
  MyTripsViewModel,
  TripCardItem,
  TripDetailViewModel,
  TripsAdapter,
} from "./types";

export interface MockTripsAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  delayMs?: number;
}

export class MockTripsAdapter implements TripsAdapter {
  private packages: PackageRecommendationSource[];
  private details: Record<string, PackageDetailSource>;
  private delayMs: number;

  constructor(options: MockTripsAdapterOptions = {}) {
    this.packages = options.packages ?? MOCK_RECOMMENDATION_PACKAGES;
    this.details = options.details ?? MOCK_PACKAGE_DETAILS;
    this.delayMs = options.delayMs ?? 0;
  }

  private resolveCardItem(
    booking: import("../checkout/types").BookingRecord,
  ): TripCardItem {
    const pkg = this.packages.find((p) => p.id === booking.packageId);
    const detail = this.details[booking.packageId];
    const session = detail?.upcomingSessionPreviews?.find(
      (s) => s.sessionId === booking.sessionId,
    );
    return {
      booking,
      package: pkg,
      session,
      isPendingPayment: booking.status === "PENDING_PAYMENT",
    };
  }

  async getMyTrips(): Promise<MyTripsViewModel> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) {
      return {
        upcomingTrips: [],
        completedTrips: [],
        historyTrips: [],
      };
    }

    const travelerBookings = mockTransactionStore.getBookingsByTraveler(
      traveler.id,
    );

    let activePendingTrip: TripCardItem | undefined;
    const upcomingTrips: TripCardItem[] = [];
    const completedTrips: TripCardItem[] = [];
    const historyTrips: TripCardItem[] = [];

    // Check store bookings
    for (const b of travelerBookings) {
      if (b.status === "PENDING_PAYMENT") {
        activePendingTrip = this.resolveCardItem(b);
      } else if (b.status === "PAID") {
        upcomingTrips.push(this.resolveCardItem(b));
      } else if (b.status === "COMPLETED") {
        completedTrips.push(this.resolveCardItem(b));
      } else if (b.status === "CANCELLED" || b.status === "EXPIRED") {
        historyTrips.push(this.resolveCardItem(b));
      }
    }

    // Append deterministic demo completed trip bound to current traveler
    const demoBooking = createDemoTravelerHistory(traveler.id);
    const hasDemo = completedTrips.some(
      (t) => t.booking.bookingId === demoBooking.bookingId,
    );
    if (!hasDemo) {
      completedTrips.push(this.resolveCardItem(demoBooking));
    }

    return {
      activePendingTrip,
      upcomingTrips,
      completedTrips,
      historyTrips,
    };
  }

  async getTripDetail(bookingId: string): Promise<TripDetailViewModel | null> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) return null;

    let booking = mockTransactionStore.getBookingById(bookingId);
    const demoBooking = createDemoTravelerHistory(traveler.id);

    if (!booking && bookingId === demoBooking.bookingId) {
      booking = demoBooking;
    }

    if (!booking || booking.travelerId !== traveler.id) return null;

    // T17/T18 confirmed trip detail is only for PAID and COMPLETED
    if (booking.status !== "PAID" && booking.status !== "COMPLETED") {
      return null;
    }

    const pkg = this.packages.find((p) => p.id === booking.packageId);
    const detail = this.details[booking.packageId];
    const session = detail?.upcomingSessionPreviews?.find(
      (s) => s.sessionId === booking.sessionId,
    );

    const hasDestinationReview = mockReviewStore.hasReviewForBookingTarget(
      booking.bookingId,
      "DESTINATION",
    );
    const hasEoReview = mockReviewStore.hasReviewForBookingTarget(
      booking.bookingId,
      "EO_GUIDE",
    );

    return {
      booking,
      package: pkg,
      detail,
      session,
      hasDestinationReview,
      hasEoReview,
    };
  }
}

export const defaultTripsAdapter = new MockTripsAdapter();
