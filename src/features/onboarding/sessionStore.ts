import type { AuthUser, OnboardingStatus } from "../auth/types";
import { demoContactVerificationBypass } from "../demo/demoContactVerificationBypass";
import type { QuizDraft } from "../quiz/types";
import type { OnboardingState } from "./types";

export interface SessionState {
  user: AuthUser | null;
  onboarding: OnboardingState;
  quizDraft: QuizDraft | null;
}

export const TRAVELER_SESSION_STORAGE_KEY = "jedain.traveler.session.v1";

const defaultSession: SessionState = {
  user: null,
  onboarding: {
    status: "NOT_STARTED",
    hasConsent: false,
  },
  quizDraft: null,
};

const VALID_STATUSES: Set<string> = new Set([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isValidOnboardingStatus(val: unknown): val is OnboardingStatus {
  return typeof val === "string" && VALID_STATUSES.has(val);
}

function validateAndNormalizeSession(data: unknown): SessionState | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const candidate = data as Record<string, unknown>;

  // 1. Validate onboarding
  if (
    !candidate.onboarding ||
    typeof candidate.onboarding !== "object" ||
    Array.isArray(candidate.onboarding)
  ) {
    return null;
  }
  const onb = candidate.onboarding as Record<string, unknown>;
  if (
    !isValidOnboardingStatus(onb.status) ||
    typeof onb.hasConsent !== "boolean"
  ) {
    return null;
  }

  // 2. Validate user if present
  let validatedUser: AuthUser | null = null;
  if (candidate.user !== null && candidate.user !== undefined) {
    if (typeof candidate.user !== "object" || Array.isArray(candidate.user)) {
      return null;
    }
    const u = candidate.user as Record<string, unknown>;
    if (typeof u.id !== "string" || !u.id.trim()) {
      return null;
    }
    if (!isValidOnboardingStatus(u.onboardingStatus)) {
      return null;
    }

    // Coherence guard: user.onboardingStatus must match onboarding.status
    if (u.onboardingStatus !== onb.status) {
      return null;
    }

    if (u.name !== undefined && typeof u.name !== "string") return null;
    if (u.email !== undefined && typeof u.email !== "string") return null;
    if (u.phone !== undefined && typeof u.phone !== "string") return null;
    if (u.isNewUser !== undefined && typeof u.isNewUser !== "boolean")
      return null;

    validatedUser = {
      id: u.id,
      name: u.name as string | undefined,
      email: u.email as string | undefined,
      phone: u.phone as string | undefined,
      isNewUser: u.isNewUser as boolean | undefined,
      onboardingStatus: u.onboardingStatus,
    };
  } else {
    // If user is null, onboarding status must be NOT_STARTED
    if (onb.status !== "NOT_STARTED") {
      return null;
    }
  }

  // 3. Validate quizDraft if present
  let validatedQuizDraft: QuizDraft | null = null;
  if (candidate.quizDraft !== null && candidate.quizDraft !== undefined) {
    if (
      typeof candidate.quizDraft !== "object" ||
      Array.isArray(candidate.quizDraft)
    ) {
      return null;
    }
    const qd = candidate.quizDraft as Record<string, unknown>;
    if (
      typeof qd.currentStep !== "number" ||
      !Number.isFinite(qd.currentStep) ||
      !Array.isArray(qd.preferred_activities)
    ) {
      return null;
    }

    validatedQuizDraft = qd as unknown as QuizDraft;
  }

  return {
    user: validatedUser,
    onboarding: {
      status: onb.status,
      hasConsent: onb.hasConsent,
      updatedAt: typeof onb.updatedAt === "string" ? onb.updatedAt : undefined,
    },
    quizDraft: validatedQuizDraft,
  };
}

function loadPersistedSession(): SessionState {
  const storage = getSessionStorage();
  if (!storage) return { ...defaultSession };

  try {
    const raw = storage.getItem(TRAVELER_SESSION_STORAGE_KEY);
    if (!raw) return { ...defaultSession };

    const parsed = JSON.parse(raw);
    const validated = validateAndNormalizeSession(parsed);
    if (!validated) {
      try {
        storage.removeItem(TRAVELER_SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
      return { ...defaultSession };
    }
    return validated;
  } catch {
    try {
      storage.removeItem(TRAVELER_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    return { ...defaultSession };
  }
}

function persistCurrentSession(session: SessionState): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    if (
      !session.user &&
      session.onboarding.status === "NOT_STARTED" &&
      !session.quizDraft
    ) {
      storage.removeItem(TRAVELER_SESSION_STORAGE_KEY);
      return;
    }

    const payload = JSON.stringify({
      user: session.user,
      onboarding: session.onboarding,
      quizDraft: session.quizDraft,
    });
    storage.setItem(TRAVELER_SESSION_STORAGE_KEY, payload);
  } catch {
    // Gracefully ignore storage write failures (quota exceeded, security error, etc.)
  }
}

function clearPersistedSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(TRAVELER_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

let currentSession: SessionState = loadPersistedSession();

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
    if (!user || currentSession.user?.id !== user.id) {
      demoContactVerificationBypass.reset();
    }
    if (!user) {
      clearPersistedSession();
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
    persistCurrentSession(currentSession);
  },

  updateUserContact(phone: string): void {
    if (!currentSession.user) return;
    currentSession = {
      ...currentSession,
      user: {
        ...currentSession.user,
        phone,
      },
    };
    persistCurrentSession(currentSession);
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
    persistCurrentSession(currentSession);
  },

  setQuizDraft(draft: QuizDraft | null): void {
    currentSession = {
      ...currentSession,
      quizDraft: draft ? { ...draft } : null,
    };
    persistCurrentSession(currentSession);
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
    persistCurrentSession(currentSession);
    return { ...updated };
  },

  hydrateFromStorage(): void {
    currentSession = loadPersistedSession();
  },

  reset(): void {
    demoContactVerificationBypass.reset();
    clearPersistedSession();
    currentSession = { ...defaultSession };
  },
};
