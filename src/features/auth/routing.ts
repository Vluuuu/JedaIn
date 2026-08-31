import type { OnboardingStatus } from "./types";

/**
 * Resolves the destination route following successful traveler authentication
 * based strictly on canonical source-of-truth rules:
 * - new account -> /onboarding/consent
 * - existing + NOT_STARTED -> /onboarding/consent
 * - existing + IN_PROGRESS -> /onboarding/quiz
 * - existing + COMPLETED -> /home
 */
export function getAuthRedirectPath(params: {
  isNewUser?: boolean;
  onboardingStatus: OnboardingStatus;
}): string {
  if (params.isNewUser) {
    return "/onboarding/consent";
  }

  switch (params.onboardingStatus) {
    case "COMPLETED":
      return "/home";
    case "IN_PROGRESS":
      return "/onboarding/quiz";
    case "NOT_STARTED":
    default:
      return "/onboarding/consent";
  }
}
