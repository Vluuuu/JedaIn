// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth/types";
import { getOnboardingGuardRedirect } from "./guard";
import { sessionStore, TRAVELER_SESSION_STORAGE_KEY } from "./sessionStore";

describe("Batch D2 — Traveler Session Persistence", () => {
  beforeEach(() => {
    sessionStore.reset();
  });

  afterEach(() => {
    sessionStore.reset();
    vi.restoreAllMocks();
  });

  it("1. setUser persists SessionState to sessionStorage", () => {
    const user: AuthUser = {
      id: "usr_persist_1",
      name: "Traveler Test",
      email: "test@traveler.id",
      phone: "081234567890",
      onboardingStatus: "NOT_STARTED",
    };

    sessionStore.setUser(user);

    const raw = window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.user?.id).toBe("usr_persist_1");
    expect(parsed.onboarding?.status).toBe("NOT_STARTED");
    expect(parsed.onboarding?.hasConsent).toBe(false);
  });

  it("2. setOnboardingStatus persists status and consent to sessionStorage", () => {
    const user: AuthUser = {
      id: "usr_persist_2",
      onboardingStatus: "NOT_STARTED",
    };
    sessionStore.setUser(user);

    sessionStore.setOnboardingStatus("IN_PROGRESS");

    const raw = window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.user?.onboardingStatus).toBe("IN_PROGRESS");
    expect(parsed.onboarding?.status).toBe("IN_PROGRESS");
    expect(parsed.onboarding?.hasConsent).toBe(true);
  });

  it("3. quizDraft persists via setQuizDraft and updateQuizDraft", () => {
    const user: AuthUser = {
      id: "usr_persist_3",
      onboardingStatus: "IN_PROGRESS",
    };
    sessionStore.setUser(user);

    sessionStore.updateQuizDraft({
      currentStep: 2,
      current_intent: "NATURE",
      preferred_activities: ["NATURE_SCENERY"],
    });

    const raw = window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.quizDraft?.currentStep).toBe(2);
    expect(parsed.quizDraft?.current_intent).toBe("NATURE");
    expect(parsed.quizDraft?.preferred_activities).toEqual(["NATURE_SCENERY"]);
  });

  it("4. hydrateFromStorage restores valid stored COMPLETED session", () => {
    const validSession = {
      user: {
        id: "usr_completed_hydrate",
        name: "Traveler Completed",
        email: "completed@traveler.id",
        onboardingStatus: "COMPLETED",
      },
      onboarding: {
        status: "COMPLETED",
        hasConsent: true,
        updatedAt: new Date().toISOString(),
      },
      quizDraft: null,
    };

    window.sessionStorage.setItem(
      TRAVELER_SESSION_STORAGE_KEY,
      JSON.stringify(validSession),
    );

    sessionStore.hydrateFromStorage();

    expect(sessionStore.getStatus()).toBe("COMPLETED");
    expect(sessionStore.get().user?.id).toBe("usr_completed_hydrate");
    expect(sessionStore.get().user?.name).toBe("Traveler Completed");
  });

  it("5. IN_PROGRESS quiz draft survives hydration", () => {
    const inProgressSession = {
      user: {
        id: "usr_quiz_resume",
        onboardingStatus: "IN_PROGRESS",
      },
      onboarding: {
        status: "IN_PROGRESS",
        hasConsent: true,
      },
      quizDraft: {
        currentStep: 3,
        current_intent: "CALM",
        preferred_activities: ["MINDFULNESS_RELAXATION"],
        budget_band: "AROUND_200_300K",
      },
    };

    window.sessionStorage.setItem(
      TRAVELER_SESSION_STORAGE_KEY,
      JSON.stringify(inProgressSession),
    );

    sessionStore.hydrateFromStorage();

    expect(sessionStore.getStatus()).toBe("IN_PROGRESS");
    const draft = sessionStore.getQuizDraft();
    expect(draft?.currentStep).toBe(3);
    expect(draft?.current_intent).toBe("CALM");
    expect(draft?.budget_band).toBe("AROUND_200_300K");
  });

  it("6. sessionStore.reset() clears storage key and returns state to NOT_STARTED", () => {
    sessionStore.setUser({
      id: "usr_reset_test",
      onboardingStatus: "COMPLETED",
    });
    expect(
      window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY),
    ).not.toBeNull();

    sessionStore.reset();

    expect(
      window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY),
    ).toBeNull();
    expect(sessionStore.getStatus()).toBe("NOT_STARTED");
    expect(sessionStore.get().user).toBeNull();
  });

  it("7. setUser(null) clears storage and resets session", () => {
    sessionStore.setUser({
      id: "usr_logout_test",
      onboardingStatus: "COMPLETED",
    });
    expect(
      window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY),
    ).not.toBeNull();

    sessionStore.setUser(null);

    expect(
      window.sessionStorage.getItem(TRAVELER_SESSION_STORAGE_KEY),
    ).toBeNull();
    expect(sessionStore.getStatus()).toBe("NOT_STARTED");
    expect(sessionStore.get().user).toBeNull();
  });

  it("8. malformed JSON in storage does not throw and falls back to default session", () => {
    window.sessionStorage.setItem(
      TRAVELER_SESSION_STORAGE_KEY,
      "INVALID_JSON_CORRUPTED{{{",
    );

    expect(() => sessionStore.hydrateFromStorage()).not.toThrow();
    expect(sessionStore.getStatus()).toBe("NOT_STARTED");
    expect(sessionStore.get().user).toBeNull();
  });

  it("9. invalid onboarding status in stored state is rejected", () => {
    const invalidStatusSession = {
      user: {
        id: "usr_invalid_status",
        onboardingStatus: "SUPER_COMPLETED", // Invalid
      },
      onboarding: {
        status: "SUPER_COMPLETED",
        hasConsent: true,
      },
      quizDraft: null,
    };

    window.sessionStorage.setItem(
      TRAVELER_SESSION_STORAGE_KEY,
      JSON.stringify(invalidStatusSession),
    );

    sessionStore.hydrateFromStorage();
    expect(sessionStore.getStatus()).toBe("NOT_STARTED");
    expect(sessionStore.get().user).toBeNull();
  });

  it("10. mismatched user.onboardingStatus !== onboarding.status is rejected by coherence guard", () => {
    const incoherentSession = {
      user: {
        id: "usr_incoherent",
        onboardingStatus: "COMPLETED", // Mismatch
      },
      onboarding: {
        status: "NOT_STARTED",
        hasConsent: false,
      },
      quizDraft: null,
    };

    window.sessionStorage.setItem(
      TRAVELER_SESSION_STORAGE_KEY,
      JSON.stringify(incoherentSession),
    );

    sessionStore.hydrateFromStorage();
    expect(sessionStore.getStatus()).toBe("NOT_STARTED");
    expect(sessionStore.get().user).toBeNull();
  });

  it("11. sessionStorage setItem/getItem throwing does not crash the store and in-memory operations continue normally", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError", "SecurityError");
    });

    // Should not throw
    expect(() => {
      sessionStore.setUser({
        id: "usr_storage_exception",
        onboardingStatus: "COMPLETED",
      });
    }).not.toThrow();

    expect(sessionStore.getStatus()).toBe("COMPLETED");
    expect(sessionStore.get().user?.id).toBe("usr_storage_exception");

    expect(() => {
      sessionStore.setOnboardingStatus("IN_PROGRESS");
    }).not.toThrow();
    expect(sessionStore.getStatus()).toBe("IN_PROGRESS");
  });

  it("12. restored COMPLETED state does NOT get redirected back to consent by OnboardingRouteGuard logic", () => {
    const validSession = {
      user: {
        id: "usr_route_test",
        onboardingStatus: "COMPLETED",
      },
      onboarding: {
        status: "COMPLETED",
        hasConsent: true,
      },
      quizDraft: null,
    };

    window.sessionStorage.setItem(
      TRAVELER_SESSION_STORAGE_KEY,
      JSON.stringify(validSession),
    );

    sessionStore.hydrateFromStorage();

    const redirect = getOnboardingGuardRedirect({
      status: sessionStore.getStatus(),
      currentPath: "/packages/slow_green_day",
    });

    expect(redirect).toBeNull();
  });
});
