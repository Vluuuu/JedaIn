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

export type AuthMethod =
  "GOOGLE" | "PHONE_REQUEST" | "PHONE_VERIFY" | "EMAIL" | null;

export type AuthErrorCode =
  "CANCELLED" | "NETWORK" | "PROVIDER_ERROR" | "INVALID_INPUT";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode = "PROVIDER_ERROR") {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

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
