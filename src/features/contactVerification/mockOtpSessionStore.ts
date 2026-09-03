import type { OtpVerificationSession } from "./types";

export const CONTACT_VERIFICATION_MVP_CONFIG = {
  defaultOtpCode: "111111",
  resendCooldownSeconds: 30,
  otpExpirySeconds: 300, // 5 minutes
};

const activeSessions = new Map<string, OtpVerificationSession>();

export const mockOtpSessionStore = {
  reset(): void {
    activeSessions.clear();
  },

  getActiveSession(travelerId: string): OtpVerificationSession | undefined {
    return activeSessions.get(travelerId);
  },

  setActiveSession(session: OtpVerificationSession): void {
    activeSessions.set(session.travelerId, { ...session });
  },

  invalidateActiveSession(travelerId: string): void {
    activeSessions.delete(travelerId);
  },
};
