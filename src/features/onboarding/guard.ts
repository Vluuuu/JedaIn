import type { OnboardingStatus } from "../auth/types";

/**
 * Resolves whether a traveler with a given onboarding status
 * can access a specific target route, or returns the canonical redirect route.
 *
 * Canonical Rules:
 * - NOT_STARTED -> must complete consent first (redirects to /onboarding/consent if trying to access /home, /onboarding/quiz, etc.)
 * - IN_PROGRESS -> must resume at /onboarding/quiz (redirects to /onboarding/quiz if trying to access /home or /onboarding/consent)
 * - COMPLETED -> can access /home, /explore, etc. (redirects to /home if trying to access /onboarding/consent)
 */
export function getOnboardingGuardRedirect(params: {
  status: OnboardingStatus;
  currentPath: string;
}): string | null {
  const { status, currentPath } = params;

  if (status === "COMPLETED") {
    if (currentPath === "/onboarding/consent") {
      return "/home";
    }
    return null;
  }

  if (status === "NOT_STARTED") {
    if (
      currentPath === "/onboarding/consent" ||
      currentPath === "/login" ||
      currentPath === "/"
    ) {
      return null;
    }
    return "/onboarding/consent";
  }

  if (status === "IN_PROGRESS") {
    if (
      currentPath === "/onboarding/quiz" ||
      currentPath === "/onboarding/result" ||
      currentPath === "/login" ||
      currentPath === "/"
    ) {
      return null;
    }
    return "/onboarding/quiz";
  }

  return "/onboarding/consent";
}
