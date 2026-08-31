import type { AuthAdapter, AuthUser, PhoneOtpSession } from "./types";

export interface MockAuthAdapterOptions {
  mockUser?: Partial<AuthUser>;
  shouldFailGoogle?: boolean;
  shouldFailPhoneRequest?: boolean;
  shouldFailPhoneVerify?: boolean;
  shouldFailEmail?: boolean;
  errorMessage?: string;
  delayMs?: number;
}

export class MockAuthAdapter implements AuthAdapter {
  private options: MockAuthAdapterOptions;

  constructor(options: MockAuthAdapterOptions = {}) {
    this.options = options;
  }

  private async delay(): Promise<void> {
    const ms = this.options.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async loginWithGoogle(): Promise<AuthUser> {
    await this.delay();
    if (this.options.shouldFailGoogle) {
      throw new Error(
        this.options.errorMessage ??
          "Autentikasi Google dibatalkan atau gagal.",
      );
    }

    return {
      id: "usr_google_default",
      name: "Traveler Jeda",
      email: "traveler@example.com",
      isNewUser: this.options.mockUser?.isNewUser ?? true,
      onboardingStatus:
        this.options.mockUser?.onboardingStatus ?? "NOT_STARTED",
      ...this.options.mockUser,
    };
  }

  async requestPhoneOtp(phone: string): Promise<PhoneOtpSession> {
    await this.delay();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      throw new Error("Nomor HP tidak valid. Masukkan nomor yang benar.");
    }

    if (this.options.shouldFailPhoneRequest) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal mengirim kode OTP. Silakan coba lagi.",
      );
    }

    return {
      phone: cleanPhone,
      verificationId: `verif_${Date.now()}`,
    };
  }

  async verifyPhoneOtp(params: {
    phone: string;
    verificationId: string;
    code: string;
  }): Promise<AuthUser> {
    await this.delay();
    const cleanCode = params.code.trim();
    if (!cleanCode || cleanCode.length < 4) {
      throw new Error("Kode OTP harus terdiri dari 4-6 digit.");
    }

    if (this.options.shouldFailPhoneVerify || cleanCode === "0000") {
      throw new Error(
        this.options.errorMessage ??
          "Kode OTP salah atau telah kadaluarsa. Silakan periksa kembali.",
      );
    }

    return {
      id: "usr_phone_default",
      phone: params.phone,
      isNewUser: this.options.mockUser?.isNewUser ?? true,
      onboardingStatus:
        this.options.mockUser?.onboardingStatus ?? "NOT_STARTED",
      ...this.options.mockUser,
    };
  }

  async requestEmailLink(email: string): Promise<{ success: boolean }> {
    await this.delay();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Format email tidak valid.");
    }

    if (this.options.shouldFailEmail) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal mengirim tautan masuk. Silakan coba lagi.",
      );
    }

    return { success: true };
  }
}

export const defaultAuthAdapter = new MockAuthAdapter();
