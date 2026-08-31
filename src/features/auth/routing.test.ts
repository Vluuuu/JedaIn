import { describe, expect, it } from "vitest";
import { getAuthRedirectPath } from "./routing";

describe("getAuthRedirectPath", () => {
  it("routes new accounts to /onboarding/consent regardless of status", () => {
    expect(
      getAuthRedirectPath({ isNewUser: true, onboardingStatus: "NOT_STARTED" }),
    ).toBe("/onboarding/consent");

    expect(
      getAuthRedirectPath({ isNewUser: true, onboardingStatus: "COMPLETED" }),
    ).toBe("/onboarding/consent");
  });

  it("routes existing accounts with NOT_STARTED status to /onboarding/consent", () => {
    expect(
      getAuthRedirectPath({
        isNewUser: false,
        onboardingStatus: "NOT_STARTED",
      }),
    ).toBe("/onboarding/consent");
  });

  it("routes existing accounts with IN_PROGRESS status to /onboarding/quiz (resume)", () => {
    expect(
      getAuthRedirectPath({
        isNewUser: false,
        onboardingStatus: "IN_PROGRESS",
      }),
    ).toBe("/onboarding/quiz");
  });

  it("routes existing accounts with COMPLETED status to /home", () => {
    expect(
      getAuthRedirectPath({ isNewUser: false, onboardingStatus: "COMPLETED" }),
    ).toBe("/home");
  });
});
