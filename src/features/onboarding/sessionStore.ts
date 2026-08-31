import type { AuthUser, OnboardingStatus } from "../auth/types";
import type { QuizDraft } from "../quiz/types";
import type { OnboardingState } from "./types";

export interface SessionState {
  user: AuthUser | null;
  onboarding: OnboardingState;
  quizDraft: QuizDraft | null;
}

const defaultSession: SessionState = {
  user: null,
  onboarding: {
    status: "NOT_STARTED",
    hasConsent: false,
  },
  quizDraft: null,
};

let currentSession: SessionState = { ...defaultSession };

export const sessionStore = {
  get(): SessionState {
    return {
      user: currentSession.user ? { ...currentSession.user } : null,
      onboarding: { ...currentSession.onboarding },
      quizDraft: currentSession.quizDraft
        ? { ...currentSession.quizDraft }
        : null,
    };
  },

  getStatus(): OnboardingStatus {
    return currentSession.onboarding.status;
  },

  getQuizDraft(): QuizDraft | null {
    return currentSession.quizDraft ? { ...currentSession.quizDraft } : null;
  },

  setUser(user: AuthUser | null): void {
    if (!user) {
      currentSession = { ...defaultSession };
      return;
    }

    const isSameUser = currentSession.user?.id === user.id;

    currentSession = {
      user: { ...user },
      onboarding: {
        status: user.onboardingStatus,
        hasConsent: user.onboardingStatus !== "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      },
      // Prevent cross-user draft leakage: only preserve draft if the authenticated user id matches
      quizDraft:
        isSameUser && currentSession.quizDraft
          ? { ...currentSession.quizDraft }
          : null,
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

  setQuizDraft(draft: QuizDraft | null): void {
    currentSession = {
      ...currentSession,
      quizDraft: draft ? { ...draft } : null,
    };
  },

  updateQuizDraft(partialDraft: Partial<QuizDraft>): QuizDraft {
    const existing = currentSession.quizDraft ?? {
      currentStep: 1,
      preferred_activities: [],
    };
    const updated: QuizDraft = {
      ...existing,
      ...partialDraft,
      updatedAt: new Date().toISOString(),
    };
    currentSession = {
      ...currentSession,
      quizDraft: updated,
    };
    return { ...updated };
  },

  reset(): void {
    currentSession = { ...defaultSession };
  },
};
