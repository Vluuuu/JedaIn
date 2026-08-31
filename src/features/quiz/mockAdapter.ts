import { sessionStore } from "../onboarding/sessionStore";
import type { QuizAdapter, QuizCompletionResult, QuizDraft } from "./types";

export interface MockQuizAdapterOptions {
  initialDraft?: Partial<QuizDraft>;
  shouldFailSave?: boolean;
  shouldFailComplete?: boolean;
  errorMessage?: string;
  delayMs?: number;
}

export class MockQuizAdapter implements QuizAdapter {
  private draft: QuizDraft;
  private options: MockQuizAdapterOptions;

  constructor(options: MockQuizAdapterOptions = {}) {
    this.options = options;
    const sessionDraft = sessionStore.getQuizDraft();

    this.draft = {
      currentStep:
        options.initialDraft?.currentStep ?? sessionDraft?.currentStep ?? 1,
      current_intent:
        options.initialDraft?.current_intent ?? sessionDraft?.current_intent,
      preferred_activities:
        options.initialDraft?.preferred_activities ??
        sessionDraft?.preferred_activities ??
        [],
      budget_band:
        options.initialDraft?.budget_band ?? sessionDraft?.budget_band,
      duration_preference:
        options.initialDraft?.duration_preference ??
        sessionDraft?.duration_preference,
      departure_area_id:
        options.initialDraft?.departure_area_id ??
        sessionDraft?.departure_area_id,
      departure_area_label:
        options.initialDraft?.departure_area_label ??
        sessionDraft?.departure_area_label,
      group_type: options.initialDraft?.group_type ?? sessionDraft?.group_type,
      group_size_band:
        options.initialDraft?.group_size_band ?? sessionDraft?.group_size_band,
      updatedAt:
        options.initialDraft?.updatedAt ??
        sessionDraft?.updatedAt ??
        new Date().toISOString(),
    };
  }

  private async delay(): Promise<void> {
    const ms = this.options.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async getQuizDraft(): Promise<QuizDraft> {
    await this.delay();
    const sessionDraft = sessionStore.getQuizDraft();
    if (sessionDraft) {
      this.draft = { ...sessionDraft };
    }
    return { ...this.draft };
  }

  async saveQuizStep(stepData: Partial<QuizDraft>): Promise<QuizDraft> {
    await this.delay();
    if (this.options.shouldFailSave) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal menyimpan jawaban langkah ini. Silakan coba lagi.",
      );
    }

    this.draft = {
      ...this.draft,
      ...stepData,
      updatedAt: new Date().toISOString(),
    };

    sessionStore.setQuizDraft(this.draft);
    return { ...this.draft };
  }

  async completeQuiz(finalDraft: QuizDraft): Promise<QuizCompletionResult> {
    await this.delay();
    if (this.options.shouldFailComplete) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal menyelesaikan kuis. Silakan coba lagi.",
      );
    }

    // Validate completeness
    if (
      !finalDraft.current_intent ||
      !finalDraft.preferred_activities ||
      finalDraft.preferred_activities.length === 0 ||
      finalDraft.preferred_activities.length > 2 ||
      !finalDraft.budget_band ||
      !finalDraft.duration_preference ||
      !finalDraft.departure_area_id ||
      (finalDraft.departure_area_id === "OTHER" &&
        !finalDraft.departure_area_label?.trim()) ||
      !finalDraft.group_type ||
      !finalDraft.group_size_band
    ) {
      throw new Error("Semua 6 pertanyaan kuis wajib diisi sebelum selesai.");
    }

    this.draft = {
      ...finalDraft,
      currentStep: 6,
      updatedAt: new Date().toISOString(),
    };

    sessionStore.setQuizDraft(this.draft);
    sessionStore.setOnboardingStatus("COMPLETED");

    return {
      status: "COMPLETED",
      quizDraft: { ...this.draft },
    };
  }
}

export const defaultQuizAdapter = new MockQuizAdapter();
