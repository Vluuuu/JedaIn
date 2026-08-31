import { describe, expect, it } from "vitest";
import { getOnboardingGuardRedirect } from "./guard";

describe("getOnboardingGuardRedirect", () => {
  it("redirects NOT_STARTED users to /onboarding/consent when trying to access protected routes", () => {
    expect(
      getOnboardingGuardRedirect({
        status: "NOT_STARTED",
        currentPath: "/home",
      }),
    ).toBe("/onboarding/consent");

    expect(
      getOnboardingGuardRedirect({
        status: "NOT_STARTED",
        currentPath: "/explore",
      }),
    ).toBe("/onboarding/consent");

    expect(
      getOnboardingGuardRedirect({
        status: "NOT_STARTED",
        currentPath: "/onboarding/quiz",
      }),
    ).toBe("/onboarding/consent");

    expect(
      getOnboardingGuardRedirect({
        status: "NOT_STARTED",
        currentPath: "/onboarding/result",
      }),
    ).toBe("/onboarding/consent");
  });

  it("allows NOT_STARTED user on /onboarding/consent without redirection", () => {
    expect(
      getOnboardingGuardRedirect({
        status: "NOT_STARTED",
        currentPath: "/onboarding/consent",
      }),
    ).toBeNull();
  });

  it("redirects IN_PROGRESS users to /onboarding/quiz when trying to access Home or other routes", () => {
    expect(
      getOnboardingGuardRedirect({
        status: "IN_PROGRESS",
        currentPath: "/home",
      }),
    ).toBe("/onboarding/quiz");

    expect(
      getOnboardingGuardRedirect({
        status: "IN_PROGRESS",
        currentPath: "/onboarding/consent",
      }),
    ).toBe("/onboarding/quiz");

    expect(
      getOnboardingGuardRedirect({
        status: "IN_PROGRESS",
        currentPath: "/onboarding/result",
      }),
    ).toBe("/onboarding/quiz");
  });

  it("allows IN_PROGRESS user on /onboarding/quiz without redirection", () => {
    expect(
      getOnboardingGuardRedirect({
        status: "IN_PROGRESS",
        currentPath: "/onboarding/quiz",
      }),
    ).toBeNull();
  });

  it("allows COMPLETED users to access any route without redirection", () => {
    expect(
      getOnboardingGuardRedirect({
        status: "COMPLETED",
        currentPath: "/home",
      }),
    ).toBeNull();

    expect(
      getOnboardingGuardRedirect({
        status: "COMPLETED",
        currentPath: "/explore",
      }),
    ).toBeNull();

    expect(
      getOnboardingGuardRedirect({
        status: "COMPLETED",
        currentPath: "/onboarding/result",
      }),
    ).toBeNull();
  });
});
