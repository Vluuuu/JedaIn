import type { OnboardingStatus } from "../auth/types";

export interface OnboardingState {
  status: OnboardingStatus;
  hasConsent: boolean;
  updatedAt?: string;
}

export interface ConsentSubmissionResult {
  status: "IN_PROGRESS";
  hasConsent: true;
}

export interface OnboardingAdapter {
  getOnboardingState(): Promise<OnboardingState>;
  submitConsent(): Promise<ConsentSubmissionResult>;
}
