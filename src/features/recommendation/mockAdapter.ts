import { sessionStore } from "../onboarding/sessionStore";
import type { QuizDraft } from "../quiz/types";
import { isValidGroupContext } from "../quiz/validation";
import { evaluateRecommendations } from "./engine";
import { MOCK_RECOMMENDATION_PACKAGES } from "./mockPackages";
import type {
  PackageRecommendationSource,
  RecommendationAdapter,
  RecommendationResult,
  UnmatchedDemandEvent,
} from "./types";

export interface MockRecommendationAdapterOptions {
  catalog?: PackageRecommendationSource[];
  shouldFail?: boolean;
  failCount?: number;
  delayMs?: number;
  errorMessage?: string;
  onUnmatchedDemandLogged?: (event: UnmatchedDemandEvent) => void;
}

/**
 * Validates that a QuizDraft contains all required answers for recommendation generation.
 */
export function isCompletedQuizDraft(
  draft: QuizDraft | null,
): draft is QuizDraft {
  if (!draft) return false;
  return Boolean(
    draft.current_intent &&
    draft.preferred_activities &&
    draft.preferred_activities.length >= 1 &&
    draft.preferred_activities.length <= 2 &&
    draft.budget_band &&
    draft.duration_preference &&
    draft.departure_area_id &&
    (draft.departure_area_id !== "OTHER" ||
      draft.departure_area_label?.trim()) &&
    isValidGroupContext(draft.group_type, draft.group_size_band),
  );
}

export class MockRecommendationAdapter implements RecommendationAdapter {
  private options: MockRecommendationAdapterOptions;
  private failedAttempts = 0;
  public loggedUnmatchedEvents: UnmatchedDemandEvent[] = [];
  private loggedFingerprints = new Set<string>();

  constructor(options: MockRecommendationAdapterOptions = {}) {
    this.options = options;
  }

  private async delay(): Promise<void> {
    const ms = this.options.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async logUnmatchedDemand(event: UnmatchedDemandEvent): Promise<void> {
    this.loggedUnmatchedEvents.push(event);
    if (this.options.onUnmatchedDemandLogged) {
      this.options.onUnmatchedDemandLogged(event);
    }
  }

  async getRecommendations(
    quizOverride?: QuizDraft,
  ): Promise<RecommendationResult> {
    await this.delay();

    if (this.options.shouldFail) {
      throw new Error(
        this.options.errorMessage ?? "Gagal memuat rekomendasi trip.",
      );
    }

    if (
      this.options.failCount !== undefined &&
      this.failedAttempts < this.options.failCount
    ) {
      this.failedAttempts++;
      throw new Error(
        this.options.errorMessage ?? "Gagal memuat rekomendasi trip.",
      );
    }

    const quiz = quizOverride ?? sessionStore.getQuizDraft();

    // Verify QuizDraft is complete and valid. Do NOT fabricate synthetic quiz data!
    if (!isCompletedQuizDraft(quiz)) {
      throw new Error(
        "Data kuis preferensi belum lengkap atau belum selesai. Silakan isi kuis terlebih dahulu.",
      );
    }

    const catalog = this.options.catalog ?? MOCK_RECOMMENDATION_PACKAGES;
    const result = evaluateRecommendations(quiz, catalog);

    if (result.state === "FALLBACK") {
      // Idempotency check using snapshot signature + updatedAt
      const fingerprint = `${quiz.updatedAt ?? "init"}-${quiz.current_intent}-${quiz.preferred_activities.join(",")}-${quiz.budget_band}-${quiz.duration_preference}-${quiz.departure_area_id}-${quiz.group_type}-${quiz.group_size_band}`;

      if (!this.loggedFingerprints.has(fingerprint)) {
        this.loggedFingerprints.add(fingerprint);
        await this.logUnmatchedDemand({
          quizSignalSnapshot: { ...quiz },
          timestamp: new Date().toISOString(),
          reason: "NO_SUFFICIENT_MATCH",
        });
      }
    }

    return result;
  }
}

export const defaultRecommendationAdapter = new MockRecommendationAdapter();
