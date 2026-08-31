import { sessionStore } from "./sessionStore";
import type {
  ConsentSubmissionResult,
  OnboardingAdapter,
  OnboardingState,
} from "./types";

export interface MockOnboardingAdapterOptions {
  initialState?: Partial<OnboardingState>;
  shouldFailConsent?: boolean;
  errorMessage?: string;
  delayMs?: number;
}

export class MockOnboardingAdapter implements OnboardingAdapter {
  private state: OnboardingState;
  private options: MockOnboardingAdapterOptions;

  constructor(options: MockOnboardingAdapterOptions = {}) {
    this.options = options;
    this.state = {
      status: options.initialState?.status ?? "NOT_STARTED",
      hasConsent: options.initialState?.hasConsent ?? false,
      updatedAt: options.initialState?.updatedAt ?? new Date().toISOString(),
    };
  }

  private async delay(): Promise<void> {
    const ms = this.options.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async getOnboardingState(): Promise<OnboardingState> {
    await this.delay();
    return { ...this.state };
  }

  async submitConsent(): Promise<ConsentSubmissionResult> {
    await this.delay();
    if (this.options.shouldFailConsent) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal menyimpan persetujuan data. Silakan coba lagi.",
      );
    }

    this.state = {
      status: "IN_PROGRESS",
      hasConsent: true,
      updatedAt: new Date().toISOString(),
    };

    sessionStore.setOnboardingStatus("IN_PROGRESS");

    return {
      status: "IN_PROGRESS",
      hasConsent: true,
    };
  }
}

export const defaultOnboardingAdapter = new MockOnboardingAdapter();
