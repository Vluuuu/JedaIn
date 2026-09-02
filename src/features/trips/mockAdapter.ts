import { mockTransactionStore } from "../checkout/mockTransactionStore";
import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
} from "../marketplace/marketplaceAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import type { PackageDetailSource } from "../packageDetail/types";
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
  now?: () => Date;
}

export class MockTripsAdapter implements TripsAdapter {
  private explicitPackages?: PackageRecommendationSource[];
  private explicitDetails?: Record<string, PackageDetailSource>;
  private delayMs: number;
  private now: () => Date;

  constructor(options: MockTripsAdapterOptions = {}) {
    this.explicitPackages = options.packages;
    this.explicitDetails = options.details;
    this.delayMs = options.delayMs ?? 0;
    this.now = options.now ?? (() => new Date());
  }

  private resolvePackages(): PackageRecommendationSource[] {
    return this.explicitPackages ?? getCombinedCatalogPackages();
  }

  private resolveDetails(): Record<string, PackageDetailSource> {
    return this.explicitDetails ?? getCombinedPackageDetails();
  }

  private resolveCardItem(
    booking: import("../checkout/types").BookingRecord,
    overrideSession?: import("../packageDetail/types").PackageSessionPreview,
  ): TripCardItem {
    const packages = this.resolvePackages();
    const details = this.resolveDetails();
    const pkg = packages.find((p) => p.id === booking.packageId);
    const detail = details[booking.packageId];
    const session =
      overrideSession ??
      detail?.upcomingSessionPreviews?.find(
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

    const nowMs = this.now().getTime();
    mockTransactionStore.reconcileExpiredPendingPayments(nowMs);

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
    const demo = createDemoTravelerHistory(traveler.id);
    const hasDemo = completedTrips.some(
      (t) => t.booking.bookingId === demo.booking.bookingId,
    );
    if (!hasDemo) {
      completedTrips.push(this.resolveCardItem(demo.booking, demo.session));
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
    const demo = createDemoTravelerHistory(traveler.id);
    let sessionOverride:
      import("../packageDetail/types").PackageSessionPreview | undefined;

    if (!booking && bookingId === demo.booking.bookingId) {
      booking = demo.booking;
      sessionOverride = demo.session;
    }

    if (!booking || booking.travelerId !== traveler.id) return null;

    // T17/T18 confirmed trip detail is only for PAID and COMPLETED
    if (booking.status !== "PAID" && booking.status !== "COMPLETED") {
      return null;
    }

    const packages = this.resolvePackages();
    const details = this.resolveDetails();

    const pkg = packages.find((p) => p.id === booking.packageId);
    const detail = details[booking.packageId];
    const session =
      sessionOverride ??
      detail?.upcomingSessionPreviews?.find(
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
