import type { AuthUser } from "./types";

export function createDemoGuestUser(): AuthUser {
  return {
    id: `usr_demo_guest_${crypto.randomUUID()}`,
    name: "Tamu Jeda",
    isNewUser: true,
    onboardingStatus: "NOT_STARTED",
  };
}
