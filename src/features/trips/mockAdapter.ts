import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockApplicationStore } from "../eo/mockApplicationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import type { BookingRecord } from "../checkout/types";
import type { PackageSessionPreview } from "../packageDetail/types";
import { resolveOrganizerReviewRef } from "../identity/identityResolvers";
import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
  syncMarketplaceFromSupabase,
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
    const session = this.resolveBookedSession(booking, detail, overrideSession);
    return {
      booking,
      package: pkg,
      session,
      isPendingPayment: booking.status === "PENDING_PAYMENT",
    };
  }

  async getMyTrips(): Promise<MyTripsViewModel> {
    if (!this.explicitPackages && !this.explicitDetails)
      await syncMarketplaceFromSupabase();
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

  private resolveBookedSession(
    booking: BookingRecord,
    detail?: PackageDetailSource,
    override?: PackageSessionPreview,
  ): PackageSessionPreview | undefined {
    if (
      booking.sessionStartAt &&
      booking.sessionEndAt &&
      Date.parse(booking.sessionEndAt) > Date.parse(booking.sessionStartAt)
    ) {
      return {
        sessionId: booking.sessionId,
        packageId: booking.packageId,
        startAt: booking.sessionStartAt,
        endAt: booking.sessionEndAt,
        status: booking.status === "COMPLETED" ? "CLOSED" : "OPEN",
        pricePerPerson: booking.unitPricePerPerson,
      };
    }
    if (override) return override;
    const history = createDemoTravelerHistory(booking.travelerId);
    if (
      booking.bookingId === history.booking.bookingId &&
      booking.packageId === history.booking.packageId &&
      booking.sessionId === history.session.sessionId
    )
      return history.session;
    const stored = !this.explicitDetails
      ? mockEoPackageStore
          .getAllSessions()
          .find(
            (s) =>
              s.sessionId === booking.sessionId &&
              s.packageId === booking.packageId,
          )
      : undefined;
    return (
      stored ??
      detail?.upcomingSessionPreviews?.find(
        (s) => s.sessionId === booking.sessionId,
      )
    );
  }

  async getTripDetail(bookingId: string): Promise<TripDetailViewModel | null> {
    if (!this.explicitPackages && !this.explicitDetails)
      await syncMarketplaceFromSupabase();
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const traveler = sessionStore.get().user;
    if (!traveler) return null;

    let booking = mockTransactionStore.getBookingById(bookingId);
    const demo = createDemoTravelerHistory(traveler.id);
    let sessionOverride:
      import("../packageDetail/types").PackageSessionPreview | undefined;

    if (bookingId === demo.booking.bookingId) {
      booking ??= demo.booking;
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
    const session = this.resolveBookedSession(booking, detail, sessionOverride);

    const hasDestinationReview = mockReviewStore.hasReviewForBookingTarget(
      booking.bookingId,
      "DESTINATION",
    );
    const hasEoReview = mockReviewStore.hasReviewForBookingTarget(
      booking.bookingId,
      "EO_GUIDE",
    );

    // Resolve source-backed organizer contact for PAID / COMPLETED trip detail
    let organizerContact: import("./types").TripOrganizerContact | undefined;
    if (detail?.organizer?.id) {
      const organizerId = detail.organizer.id;
      const approvedApps = mockApplicationStore
        .getAll()
        .filter((app) => app.status === "APPROVED");
      const matchedApp = approvedApps.find(
        (app) => resolveOrganizerReviewRef(app.identityId) === organizerId,
      );
      if (matchedApp) {
        organizerContact = {
          contactPerson: matchedApp.contactPerson,
          phone: matchedApp.phone,
          email: matchedApp.email,
        };
      }
    }

    return {
      booking,
      package: pkg,
      detail,
      session,
      hasDestinationReview,
      hasEoReview,
      organizerContact,
    };
  }
}

export const defaultTripsAdapter = new MockTripsAdapter();
