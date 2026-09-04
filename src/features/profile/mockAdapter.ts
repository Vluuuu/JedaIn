import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { sessionStore } from "../onboarding/sessionStore";
import type { ProfileAdapter, TravelerProfileData } from "./types";

export interface MockProfileAdapterOptions {
  delayMs?: number;
  shouldFailGet?: boolean;
  shouldFailLogout?: boolean;
  errorMessage?: string;
}

export class MockProfileAdapter implements ProfileAdapter {
  private options: MockProfileAdapterOptions;

  constructor(options: MockProfileAdapterOptions = {}) {
    this.options = options;
  }

  private async delay(): Promise<void> {
    const ms = this.options.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async getProfile(): Promise<TravelerProfileData> {
    await this.delay();
    if (this.options.shouldFailGet) {
      throw new Error(
        this.options.errorMessage ?? "Gagal memuat informasi profil.",
      );
    }

    const user = sessionStore.get().user;
    if (!user) {
      throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
    }

    const quizDraft = sessionStore.getQuizDraft();
    const isPhoneVerified = mockContactVerificationStore.isPhoneVerified(
      user.id,
      user.phone,
    );

    return {
      user,
      isPhoneVerified,
      quizDraft,
    };
  }

  async logout(): Promise<void> {
    await this.delay();
    if (this.options.shouldFailLogout) {
      throw new Error(
        this.options.errorMessage ?? "Gagal keluar sesi. Silakan coba lagi.",
      );
    }

    sessionStore.reset();
  }
}

export const defaultProfileAdapter = new MockProfileAdapter();
