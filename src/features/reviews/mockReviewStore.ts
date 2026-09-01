export type ReviewTargetType = "DESTINATION" | "EO_GUIDE";

export interface ReviewRecord {
  reviewId: string;
  bookingId: string;
  travelerId: string;
  targetType: ReviewTargetType;
  targetRef: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

let reviews: ReviewRecord[] = [];

export const mockReviewStore = {
  reset(): void {
    reviews = [];
  },

  getAllReviews(): readonly ReviewRecord[] {
    return reviews;
  },

  getReviewsForBooking(bookingId: string): readonly ReviewRecord[] {
    return reviews.filter((r) => r.bookingId === bookingId);
  },

  getReviewsForDestination(destinationRef: string): readonly ReviewRecord[] {
    return reviews.filter(
      (r) => r.targetType === "DESTINATION" && r.targetRef === destinationRef,
    );
  },

  getReviewsForOrganizer(organizerId: string): readonly ReviewRecord[] {
    return reviews.filter(
      (r) => r.targetType === "EO_GUIDE" && r.targetRef === organizerId,
    );
  },

  hasReviewForBookingTarget(
    bookingId: string,
    targetType: ReviewTargetType,
  ): boolean {
    return reviews.some(
      (r) => r.bookingId === bookingId && r.targetType === targetType,
    );
  },

  submitReview(params: {
    bookingId: string;
    travelerId: string;
    targetType: ReviewTargetType;
    targetRef: string;
    rating: number;
    comment?: string;
  }): { success: boolean; review: ReviewRecord } {
    const existing = reviews.find(
      (r) =>
        r.bookingId === params.bookingId && r.targetType === params.targetType,
    );

    if (existing) {
      return { success: true, review: existing };
    }

    const review: ReviewRecord = {
      reviewId: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      bookingId: params.bookingId,
      travelerId: params.travelerId,
      targetType: params.targetType,
      targetRef: params.targetRef,
      rating: Math.max(1, Math.min(5, Math.floor(params.rating))),
      comment: params.comment?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    reviews.push(review);
    return { success: true, review };
  },
};
