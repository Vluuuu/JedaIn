export type OnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isNewUser?: boolean;
  onboardingStatus: OnboardingStatus;
}

export type AuthState =
  "IDLE" | "AUTHENTICATING" | "OTP_SENT" | "OTP_VERIFYING" | "ERROR";

export interface PhoneOtpSession {
  phone: string;
  verificationId: string;
}

export interface AuthAdapter {
  loginWithGoogle(): Promise<AuthUser>;
  requestPhoneOtp(phone: string): Promise<PhoneOtpSession>;
  verifyPhoneOtp(params: {
    phone: string;
    verificationId: string;
    code: string;
  }): Promise<AuthUser>;
  requestEmailLink?(email: string): Promise<{ success: boolean }>;
}
