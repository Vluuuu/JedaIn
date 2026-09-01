export interface ContactVerificationRecord {
  travelerId: string;
  phone: string;
  verifiedAt: string;
}

export interface OtpVerificationSession {
  verificationId: string;
  travelerId: string;
  phone: string;
  requestedAt: string;
  resendAvailableAt: string;
}

export type ContactVerificationStep =
  | "LOADING"
  | "PHONE_ENTRY"
  | "REQUESTING_OTP"
  | "OTP_SENT"
  | "VERIFYING_OTP"
  | "REQUEST_ERROR"
  | "VERIFY_ERROR"
  | "NOT_FOUND";

export interface ContactVerificationViewModel {
  step: ContactVerificationStep;
  travelerId?: string;
  phone?: string;
  activeSession?: OtpVerificationSession;
  errorMessage?: string;
}

export interface ContactVerificationAdapter {
  getVerificationContext(sessionId: string): Promise<{
    sessionValid: boolean;
    travelerId?: string;
    currentPhone?: string;
    isAlreadyVerified?: boolean;
  }>;
  requestOtp(params: {
    travelerId: string;
    phone: string;
  }): Promise<OtpVerificationSession>;
  verifyOtp(params: {
    travelerId: string;
    phone: string;
    verificationId: string;
    code: string;
  }): Promise<{ success: boolean }>;
}
