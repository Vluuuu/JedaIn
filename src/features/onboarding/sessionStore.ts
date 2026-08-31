import type { AuthUser, OnboardingStatus } from "../auth/types";
import type { OnboardingState } from "./types";

export interface SessionState {
  user: AuthUser | null;
  onboarding: OnboardingState;
}

const defaultSession: SessionState = {
  user: null,
  onboarding: {
    status: "NOT_STARTED",
    hasConsent: false,
  },
};

let currentSession: SessionState = { ...defaultSession };

export const sessionStore = {
  get(): SessionState {
    return {
      user: currentSession.user ? { ...currentSession.user } : null,
      onboarding: { ...currentSession.onboarding },
    };
  },

  getStatus(): OnboardingStatus {
    return currentSession.onboarding.status;
  },

  setUser(user: AuthUser | null): void {
    if (!user) {
      currentSession = { ...defaultSession };
      return;
    }
    currentSession = {
      user: { ...user },
      onboarding: {
        status: user.onboardingStatus,
        hasConsent: user.onboardingStatus !== "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      },
    };
  },

  setOnboardingStatus(status: OnboardingStatus): void {
    currentSession = {
      ...currentSession,
      user: currentSession.user
        ? { ...currentSession.user, onboardingStatus: status }
        : null,
      onboarding: {
        status,
        hasConsent: status !== "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      },
    };
  },

  reset(): void {
    currentSession = { ...defaultSession };
  },
};
