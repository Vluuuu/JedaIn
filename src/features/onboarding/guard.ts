import type { OnboardingStatus } from "../auth/types";

/**
 * Resolves whether a traveler with a given onboarding status
 * can access a specific target route, or returns the canonical redirect route.
 *
 * Canonical Rules:
 * - NOT_STARTED -> must go to /onboarding/consent (blocked from /home, /explore, /trips, /profile, /onboarding/quiz)
 * - IN_PROGRESS -> must resume at /onboarding/quiz (blocked from /home, etc.)
 * - COMPLETED -> can access /home, /explore, etc. (accessing /onboarding/consent can redirect to /home or allow review)
 */
export function getOnboardingGuardRedirect(params: {
  status: OnboardingStatus;
  currentPath: string;
}): string | null {
  const { status, currentPath } = params;

  if (status === "COMPLETED") {
    return null;
  }

  if (status === "NOT_STARTED") {
    if (currentPath === "/onboarding/consent") {
      return null;
    }
    return "/onboarding/consent";
  }

  if (status === "IN_PROGRESS") {
    if (currentPath === "/onboarding/quiz") {
      return null;
    }
    return "/onboarding/quiz";
  }

  return "/onboarding/consent";
}
