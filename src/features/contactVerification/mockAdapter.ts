import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type { PackageSessionPreview } from "../packageDetail/types";
import {
  CONTACT_VERIFICATION_MVP_CONFIG,
  mockContactVerificationStore,
} from "./mockContactVerificationStore";
import type {
  ContactVerificationAdapter,
  OtpVerificationSession,
} from "./types";

export interface MockContactVerificationAdapterOptions {
  delayMs?: number;
  failRequestCount?: number;
  failVerifyCount?: number;
  demoOtpCode?: string;
  cooldownSeconds?: number;
}

export class MockContactVerificationAdapter implements ContactVerificationAdapter {
  private delayMs: number;
  private failRequestCount: number;
  private failVerifyCount: number;
  private demoOtpCode: string;
  private cooldownSeconds: number;

  constructor(options: MockContactVerificationAdapterOptions = {}) {
    this.delayMs = options.delayMs ?? 0;
    this.failRequestCount = options.failRequestCount ?? 0;
    this.failVerifyCount = options.failVerifyCount ?? 0;
    this.demoOtpCode =
      options.demoOtpCode ?? CONTACT_VERIFICATION_MVP_CONFIG.defaultOtpCode;
    this.cooldownSeconds =
      options.cooldownSeconds ??
      CONTACT_VERIFICATION_MVP_CONFIG.resendCooldownSeconds;
  }

  async getVerificationContext(sessionId: string): Promise<{
    sessionValid: boolean;
    travelerId?: string;
    currentPhone?: string;
    isAlreadyVerified?: boolean;
  }> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    // Resolve session existence from MOCK_PACKAGE_DETAILS
    let foundSession: PackageSessionPreview | undefined;
    for (const detail of Object.values(MOCK_PACKAGE_DETAILS)) {
      const sess = detail.upcomingSessionPreviews?.find(
        (s) => s.sessionId === sessionId,
      );
      if (sess) {
        foundSession = sess;
        break;
      }
    }

    if (!foundSession) {
      return { sessionValid: false };
    }

    const user = sessionStore.get().user;
    if (!user) {
      return { sessionValid: true };
    }

    const isAlreadyVerified = mockContactVerificationStore.isPhoneVerified(
      user.id,
      user.phone,
    );

    return {
      sessionValid: true,
      travelerId: user.id,
      currentPhone: user.phone,
      isAlreadyVerified,
    };
  }

  async requestOtp(params: {
    travelerId: string;
    phone: string;
  }): Promise<OtpVerificationSession> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failRequestCount > 0) {
      this.failRequestCount--;
      throw new Error("Kode OTP belum bisa dikirim. Coba lagi.");
    }

    const now = new Date();
    const resendAvailableAt = new Date(
      now.getTime() + this.cooldownSeconds * 1000,
    ).toISOString();

    const verificationId = `votp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      verificationId,
      travelerId: params.travelerId,
      phone: params.phone,
      requestedAt: now.toISOString(),
      resendAvailableAt,
    };
  }

  async verifyOtp(params: {
    travelerId: string;
    phone: string;
    verificationId: string;
    code: string;
  }): Promise<{ success: boolean }> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failVerifyCount > 0) {
      this.failVerifyCount--;
      throw new Error("Verifikasi belum bisa diproses. Coba lagi.");
    }

    if (params.code !== this.demoOtpCode) {
      return { success: false };
    }

    // Mark verified in shared store
    mockContactVerificationStore.markPhoneVerified(
      params.travelerId,
      params.phone,
    );

    return { success: true };
  }
}

export const defaultContactVerificationAdapter =
  new MockContactVerificationAdapter();
