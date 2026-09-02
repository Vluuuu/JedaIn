import { mockTransactionStore } from "../checkout/mockTransactionStore";
import {
  resolveDestinationReviewRef,
  resolveOrganizerReviewRef,
} from "../identity/identityResolvers";
import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
} from "../marketplace/marketplaceAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import { createDemoTravelerHistory } from "../trips/demoHistory";
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
    const demo = createDemoTravelerHistory(traveler.id);
    if (!booking && bookingId === demo.booking.bookingId) {
      booking = demo.booking;
    }

    if (
      !booking ||
      booking.travelerId !== traveler.id ||
      booking.status !== "COMPLETED"
    ) {
      return null;
    }

    const catalog = getCombinedCatalogPackages();
    const details = getCombinedPackageDetails();

    const pkg = catalog.find((p) => p.id === booking!.packageId);
    const detail = details[booking.packageId];

    if (!pkg || !detail) {
      return null;
    }

    if (targetType === "DESTINATION") {
      if (!pkg.destinationName || !pkg.destinationName.trim()) {
        return null;
      }
    } else {
      if (!detail.organizer?.id || !detail.organizer.id.trim()) {
        return null;
      }
    }

    const targetRef =
      targetType === "DESTINATION"
        ? resolveDestinationReviewRef(pkg.destinationName)
        : resolveOrganizerReviewRef(detail.organizer.id);

    if (!targetRef || !targetRef.trim()) {
      return null;
    }

    const targetName =
      targetType === "DESTINATION"
        ? pkg.destinationName
        : detail.organizer.displayName;

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

    // Rating validation: must be an integer between 1 and 5
    if (
      typeof params.rating !== "number" ||
      !Number.isInteger(params.rating) ||
      params.rating < 1 ||
      params.rating > 5
    ) {
      return {
        success: false,
        message: "Rating harus berupa angka bulat antara 1 dan 5.",
      };
    }

    let booking = mockTransactionStore.getBookingById(params.bookingId);
    const demo = createDemoTravelerHistory(traveler.id);
    if (!booking && params.bookingId === demo.booking.bookingId) {
      booking = demo.booking;
    }

    if (
      !booking ||
      booking.travelerId !== traveler.id ||
      booking.status !== "COMPLETED"
    ) {
      return {
        success: false,
        message: "Hanya trip yang telah selesai yang dapat dinilai.",
      };
    }

    const catalog = getCombinedCatalogPackages();
    const details = getCombinedPackageDetails();

    const pkg = catalog.find((p) => p.id === booking!.packageId);
    const detail = details[booking.packageId];

    if (!pkg || !detail) {
      return {
        success: false,
        message: "Data paket pengalaman tidak ditemukan untuk diulas.",
      };
    }

    if (params.targetType === "DESTINATION") {
      if (!pkg.destinationName || !pkg.destinationName.trim()) {
        return {
          success: false,
          message: "Target ulasan destinasi tidak valid.",
        };
      }
    } else {
      if (!detail.organizer?.id || !detail.organizer.id.trim()) {
        return {
          success: false,
          message: "Target ulasan penyelenggara (EO) tidak valid.",
        };
      }
    }

    const targetRef =
      params.targetType === "DESTINATION"
        ? resolveDestinationReviewRef(pkg.destinationName)
        : resolveOrganizerReviewRef(detail.organizer.id);

    if (!targetRef || !targetRef.trim()) {
      return {
        success: false,
        message: "Entitas review tidak dapat diverifikasi.",
      };
    }

    const result = mockReviewStore.submitReview({
      bookingId: params.bookingId,
      travelerId: traveler.id,
      targetType: params.targetType,
      targetRef,
      rating: params.rating,
      comment: params.comment,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message ?? "Penilaian tidak valid.",
      };
    }

    return { success: true };
  }
}

export const defaultReviewAdapter = new MockReviewAdapter();
