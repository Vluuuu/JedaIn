import { sessionStore } from "../onboarding/sessionStore";
import type { QuizAdapter, QuizCompletionResult, QuizDraft } from "./types";
import { isValidGroupContext } from "./validation";

export interface RetakeQuizAdapterOptions {
  shouldFailSave?: boolean;
  shouldFailComplete?: boolean;
  errorMessage?: string;
  delayMs?: number;
}

/**
 * Isolated Quiz Adapter for Preference Retake (T22).
 * Crucial Product Rule:
 * Saves during retake only update an internal working draft.
 * The active canonical preference in sessionStore is ONLY updated upon successful completeQuiz().
 */
export class RetakeQuizAdapter implements QuizAdapter {
  private workingDraft: QuizDraft;
  private options: RetakeQuizAdapterOptions;

  constructor(options: RetakeQuizAdapterOptions = {}) {
    this.options = options;
    const current = sessionStore.getQuizDraft();

    this.workingDraft = {
      currentStep: 1,
      current_intent: current?.current_intent,
      preferred_activities: current?.preferred_activities
        ? [...current.preferred_activities]
        : [],
      budget_band: current?.budget_band,
      duration_preference: current?.duration_preference,
      departure_area_id: current?.departure_area_id,
      departure_area_label: current?.departure_area_label,
      group_type: current?.group_type,
      group_size_band: current?.group_size_band,
      updatedAt: current?.updatedAt ?? new Date().toISOString(),
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
    return {
      ...this.workingDraft,
      preferred_activities: [...this.workingDraft.preferred_activities],
    };
  }

  async saveQuizStep(stepData: Partial<QuizDraft>): Promise<QuizDraft> {
    await this.delay();
    if (this.options.shouldFailSave) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal menyimpan preferensi sementara. Silakan coba lagi.",
      );
    }

    // Update working draft only - NEVER mutate sessionStore here!
    this.workingDraft = {
      ...this.workingDraft,
      ...stepData,
      preferred_activities: stepData.preferred_activities
        ? [...stepData.preferred_activities]
        : [...this.workingDraft.preferred_activities],
      updatedAt: new Date().toISOString(),
    };

    return {
      ...this.workingDraft,
      preferred_activities: [...this.workingDraft.preferred_activities],
    };
  }

  async completeQuiz(finalDraft: QuizDraft): Promise<QuizCompletionResult> {
    await this.delay();
    if (this.options.shouldFailComplete) {
      throw new Error(
        this.options.errorMessage ??
          "Gagal memperbarui preferensi. Silakan coba lagi.",
      );
    }

    // Validate completeness per canonical quiz rules
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
      !isValidGroupContext(finalDraft.group_type, finalDraft.group_size_band)
    ) {
      throw new Error(
        "Semua 6 pertanyaan kuis wajib diisi dengan valid sebelum selesai.",
      );
    }

    const committedDraft: QuizDraft = {
      ...finalDraft,
      currentStep: 6,
      preferred_activities: [...finalDraft.preferred_activities],
      updatedAt: new Date().toISOString(),
    };

    this.workingDraft = { ...committedDraft };

    // Atomically commit to session store and guarantee status is COMPLETED
    sessionStore.setQuizDraft(committedDraft);
    sessionStore.setOnboardingStatus("COMPLETED");

    return {
      status: "COMPLETED",
      quizDraft: { ...committedDraft },
    };
  }
}
