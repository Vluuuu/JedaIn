import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import { DEMO_TRAVELER_HISTORY } from "../trips/demoHistory";
import { mockReviewStore, type ReviewTargetType } from "./mockReviewStore";
import type { ReviewAdapter, TripReviewViewModel } from "./types";

export class MockReviewAdapter implements ReviewAdapter {
  async getReviewContext(
    bookingId: string,
    targetType: ReviewTargetType,
  ): Promise<TripReviewViewModel | null> {
    const traveler = sessionStore.get().user;
    if (!traveler) return null;

    let booking = mockTransactionStore.getBookingById(bookingId);
    if (!booking && bookingId === DEMO_TRAVELER_HISTORY.bookingId) {
      booking = DEMO_TRAVELER_HISTORY;
    }

    if (!booking || booking.status !== "COMPLETED") {
      return null;
    }

    const pkg = MOCK_RECOMMENDATION_PACKAGES.find(
      (p) => p.id === booking!.packageId,
    );
    const detail = MOCK_PACKAGE_DETAILS[booking.packageId];

    const targetRef =
      targetType === "DESTINATION"
        ? (pkg?.destinationName ?? booking.packageId)
        : (detail?.organizer.id ?? "org_default");

    const targetName =
      targetType === "DESTINATION"
        ? (pkg?.destinationName ?? "Destinasi")
        : (detail?.organizer.displayName ?? "EO / Guide");

    const existingReviews = mockReviewStore.getReviewsForBooking(bookingId);
    const existingReview = existingReviews.find(
      (r) => r.targetType === targetType,
    );

    return {
      bookingId,
      targetType,
      targetRef,
      targetName,
      packageName: pkg?.title ?? booking.packageId,
      alreadyReviewed: Boolean(existingReview),
      existingReview,
    };
  }

  async submitReview(params: {
    bookingId: string;
    targetType: ReviewTargetType;
    rating: number;
    comment?: string;
  }): Promise<{ success: boolean; message?: string }> {
    const traveler = sessionStore.get().user;
    if (!traveler) {
      return { success: false, message: "Pengguna belum terautentikasi." };
    }

    let booking = mockTransactionStore.getBookingById(params.bookingId);
    if (!booking && params.bookingId === DEMO_TRAVELER_HISTORY.bookingId) {
      booking = DEMO_TRAVELER_HISTORY;
    }

    if (!booking || booking.status !== "COMPLETED") {
      return {
        success: false,
        message: "Hanya trip yang telah selesai yang dapat dinilai.",
      };
    }

    const pkg = MOCK_RECOMMENDATION_PACKAGES.find(
      (p) => p.id === booking!.packageId,
    );
    const detail = MOCK_PACKAGE_DETAILS[booking.packageId];

    const targetRef =
      params.targetType === "DESTINATION"
        ? (pkg?.destinationName ?? booking.packageId)
        : (detail?.organizer.id ?? "org_default");

    mockReviewStore.submitReview({
      bookingId: params.bookingId,
      travelerId: traveler.id,
      targetType: params.targetType,
      targetRef,
      rating: params.rating,
      comment: params.comment,
    });

    return { success: true };
  }
}

export const defaultReviewAdapter = new MockReviewAdapter();
