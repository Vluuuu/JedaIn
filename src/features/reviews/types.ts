import type { ReviewRecord, ReviewTargetType } from "./mockReviewStore";

export type { ReviewRecord, ReviewTargetType };

export interface TripReviewFormProps {
  bookingId: string;
  targetType: ReviewTargetType;
  targetName: string;
  onSubmit: (params: { rating: number; comment?: string }) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
}

export interface TripReviewViewModel {
  bookingId: string;
  targetType: ReviewTargetType;
  targetRef: string;
  targetName: string;
  packageName: string;
  alreadyReviewed: boolean;
  existingReview?: ReviewRecord;
}

export interface ReviewAdapter {
  getReviewContext(
    bookingId: string,
    targetType: ReviewTargetType,
  ): Promise<TripReviewViewModel | null>;
  submitReview(params: {
    bookingId: string;
    targetType: ReviewTargetType;
    rating: number;
    comment?: string;
  }): Promise<{ success: boolean; message?: string }>;
}
