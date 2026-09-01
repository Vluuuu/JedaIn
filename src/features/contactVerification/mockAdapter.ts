import { sessionStore } from "../onboarding/sessionStore";
import { MOCK_PACKAGE_DETAILS } from "../packageDetail/mockPackageDetails";
import type {
  PackageDetailSource,
  PackageSessionPreview,
} from "../packageDetail/types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";
import { mockContactVerificationStore } from "./mockContactVerificationStore";
import {
  CONTACT_VERIFICATION_MVP_CONFIG,
  mockOtpSessionStore,
} from "./mockOtpSessionStore";
import type {
  ContactVerificationAdapter,
  OtpVerificationSession,
  OtpVerifyResult,
} from "./types";

export interface MockContactVerificationAdapterOptions {
  packages?: PackageRecommendationSource[];
  details?: Record<string, PackageDetailSource>;
  delayMs?: number;
  failRequestCount?: number;
  failVerifyCount?: number;
  demoOtpCode?: string;
  cooldownSeconds?: number;
  expirySeconds?: number;
}

export class MockContactVerificationAdapter implements ContactVerificationAdapter {
  private packages: PackageRecommendationSource[];
  private details: Record<string, PackageDetailSource>;
  private delayMs: number;
  private failRequestCount: number;
  private failVerifyCount: number;
  private demoOtpCode: string;
  private cooldownSeconds: number;
  private expirySeconds: number;

  constructor(options: MockContactVerificationAdapterOptions = {}) {
    this.packages = options.packages ?? MOCK_RECOMMENDATION_PACKAGES;
    this.details = options.details ?? MOCK_PACKAGE_DETAILS;
    this.delayMs = options.delayMs ?? 0;
    this.failRequestCount = options.failRequestCount ?? 0;
    this.failVerifyCount = options.failVerifyCount ?? 0;
    this.demoOtpCode =
      options.demoOtpCode ?? CONTACT_VERIFICATION_MVP_CONFIG.defaultOtpCode;
    this.cooldownSeconds =
      options.cooldownSeconds ??
      CONTACT_VERIFICATION_MVP_CONFIG.resendCooldownSeconds;
    this.expirySeconds =
      options.expirySeconds ?? CONTACT_VERIFICATION_MVP_CONFIG.otpExpirySeconds;
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

    // 1. Resolve session, detail & package with full LIVE package consistency check
    let foundPkg: PackageRecommendationSource | undefined;
    let foundDetail: PackageDetailSource | undefined;
    let foundSession: PackageSessionPreview | undefined;

    for (const [pkgId, detail] of Object.entries(this.details)) {
      const pkg = this.packages.find((p) => p.id === pkgId);
      if (!pkg) continue;
      if (detail.packageId !== pkg.id) continue;

      const sess = detail.upcomingSessionPreviews?.find(
        (s) => s.sessionId === sessionId,
      );
      if (sess) {
        if (sess.packageId !== pkg.id) continue;
        foundPkg = pkg;
        foundDetail = detail;
        foundSession = sess;
        break;
      }
    }

    if (
      !foundPkg ||
      !foundDetail ||
      !foundSession ||
      foundPkg.status !== "LIVE"
    ) {
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

    // 1. Authenticated traveler validation
    const currentUser = sessionStore.get().user;
    if (!currentUser || currentUser.id !== params.travelerId) {
      throw new Error("Identitas pengguna tidak valid.");
    }

    if (!params.phone || !params.phone.trim()) {
      throw new Error("Nomor HP wajib diisi.");
    }

    if (this.failRequestCount > 0) {
      this.failRequestCount--;
      throw new Error("Kode OTP belum bisa dikirim. Coba lagi.");
    }

    const now = new Date();
    const resendAvailableAt = new Date(
      now.getTime() + this.cooldownSeconds * 1000,
    ).toISOString();
    const expiresAt = new Date(
      now.getTime() + this.expirySeconds * 1000,
    ).toISOString();

    const verificationId = `votp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const session: OtpVerificationSession = {
      verificationId,
      travelerId: params.travelerId,
      phone: params.phone.trim(),
      requestedAt: now.toISOString(),
      resendAvailableAt,
      expiresAt,
    };

    // Replace/Set active session in authoritative store (invalidating prior verificationId)
    mockOtpSessionStore.setActiveSession(session);

    return session;
  }

  async verifyOtp(params: {
    travelerId: string;
    phone: string;
    verificationId: string;
    code: string;
  }): Promise<OtpVerifyResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failVerifyCount > 0) {
      this.failVerifyCount--;
      throw new Error("Verifikasi belum bisa diproses. Coba lagi.");
    }

    // 1. Current authenticated user validation
    const currentUser = sessionStore.get().user;
    if (!currentUser || currentUser.id !== params.travelerId) {
      return {
        success: false,
        status: "INVALID_IDENTITY",
        message: "Identitas pengguna tidak sesuai.",
      };
    }

    // 2. Active OTP session check
    const active = mockOtpSessionStore.getActiveSession(params.travelerId);
    if (!active) {
      return {
        success: false,
        status: "STALE_SESSION",
        message: "Sesi verifikasi tidak ditemukan atau sudah tidak aktif.",
      };
    }

    // 3. Exact session binding check (phone, verificationId, travelerId)
    if (
      active.travelerId !== params.travelerId ||
      active.phone !== params.phone ||
      active.verificationId !== params.verificationId
    ) {
      return {
        success: false,
        status: "STALE_SESSION",
        message: "Sesi verifikasi tidak valid.",
      };
    }

    // 4. Expiration check
    const now = Date.now();
    const expiryTime = new Date(active.expiresAt).getTime();
    if (now >= expiryTime) {
      return {
        success: false,
        status: "EXPIRED",
        message: "Kode OTP telah kedaluwarsa. Silakan minta kode baru.",
      };
    }

    // 5. Code verification check
    if (params.code !== this.demoOtpCode) {
      return {
        success: false,
        status: "INVALID_CODE",
        message: "Kode OTP tidak valid atau sudah kedaluwarsa.",
      };
    }

    // 6. Success: mark verified in shared store & invalidate/consume active OTP session
    mockContactVerificationStore.markPhoneVerified(
      params.travelerId,
      params.phone,
    );
    mockOtpSessionStore.invalidateActiveSession(params.travelerId);

    return {
      success: true,
      status: "SUCCESS",
    };
  }

  invalidateOtpSession(travelerId: string): void {
    mockOtpSessionStore.invalidateActiveSession(travelerId);
  }
}

export const defaultContactVerificationAdapter =
  new MockContactVerificationAdapter();
