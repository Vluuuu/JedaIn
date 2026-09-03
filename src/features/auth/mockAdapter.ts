import {
  AuthError,
  type AuthAdapter,
  type AuthUser,
  type PhoneOtpSession,
} from "./types";

export interface MockAuthAdapterOptions {
  mockUser?: Partial<AuthUser>;
  shouldCancelGoogle?: boolean;
  shouldFailGoogle?: boolean;
  shouldFailPhoneRequest?: boolean;
  shouldFailPhoneVerify?: boolean;
  shouldFailEmail?: boolean;
  shouldFailPasswordLogin?: boolean;
  shouldFailPasswordSignup?: boolean;
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
    if (this.options.shouldCancelGoogle) {
      throw new AuthError("Proses masuk Google dibatalkan.", "CANCELLED");
    }

    if (this.options.shouldFailGoogle) {
      throw new AuthError(
        this.options.errorMessage ?? "Gagal terhubung dengan layanan Google.",
        "NETWORK",
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

  async loginWithPassword(email: string, password: string): Promise<AuthUser> {
    await this.delay();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new AuthError("Format email tidak valid.", "INVALID_INPUT");
    }
    if (!cleanPass) {
      throw new AuthError("Password wajib diisi.", "INVALID_INPUT");
    }

    if (this.options.shouldFailPasswordLogin || cleanPass === "invalid") {
      throw new AuthError(
        this.options.errorMessage ?? "Email atau password salah.",
        "PROVIDER_ERROR",
      );
    }

    return {
      id: "usr_pass_default",
      name: cleanEmail.split("@")[0],
      email: cleanEmail,
      isNewUser: this.options.mockUser?.isNewUser ?? false,
      onboardingStatus: this.options.mockUser?.onboardingStatus ?? "COMPLETED",
      ...this.options.mockUser,
    };
  }

  async signupWithPassword(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthUser> {
    await this.delay();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanName = name?.trim() || cleanEmail.split("@")[0] || "Traveler";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new AuthError("Format email tidak valid.", "INVALID_INPUT");
    }
    if (!cleanPass || cleanPass.length < 6) {
      throw new AuthError("Password minimal 6 karakter.", "INVALID_INPUT");
    }

    if (this.options.shouldFailPasswordSignup) {
      throw new AuthError(
        this.options.errorMessage ?? "Pendaftaran gagal. Silakan coba lagi.",
        "PROVIDER_ERROR",
      );
    }

    return {
      id: "usr_signup_default",
      email: cleanEmail,
      isNewUser: true,
      onboardingStatus: "NOT_STARTED",
      name: this.options.mockUser?.name ?? cleanName,
      ...this.options.mockUser,
    };
  }

  async requestPhoneOtp(phone: string): Promise<PhoneOtpSession> {
    await this.delay();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      throw new AuthError("Nomor HP wajib diisi.", "INVALID_INPUT");
    }

    if (this.options.shouldFailPhoneRequest) {
      throw new AuthError(
        this.options.errorMessage ??
          "Gagal mengirim kode OTP. Silakan coba lagi.",
        "NETWORK",
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
    if (!cleanCode) {
      throw new AuthError("Kode verifikasi OTP wajib diisi.", "INVALID_INPUT");
    }

    if (this.options.shouldFailPhoneVerify || cleanCode === "0000") {
      throw new AuthError(
        this.options.errorMessage ??
          "Kode OTP salah atau telah kadaluarsa. Silakan periksa kembali.",
        "PROVIDER_ERROR",
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
      throw new AuthError("Format email tidak valid.", "INVALID_INPUT");
    }

    if (this.options.shouldFailEmail) {
      throw new AuthError(
        this.options.errorMessage ??
          "Gagal mengirim tautan masuk. Silakan coba lagi.",
        "NETWORK",
      );
    }

    return { success: true };
  }
}

export const defaultAuthAdapter = new MockAuthAdapter();
