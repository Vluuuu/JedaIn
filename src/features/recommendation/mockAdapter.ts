import { sessionStore } from "../onboarding/sessionStore";
import type { QuizDraft } from "../quiz/types";
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

export class MockRecommendationAdapter implements RecommendationAdapter {
  private options: MockRecommendationAdapterOptions;
  private failedAttempts = 0;
  public loggedUnmatchedEvents: UnmatchedDemandEvent[] = [];

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

    const quiz =
      quizOverride ??
      sessionStore.getQuizDraft() ?? {
        currentStep: 6,
        current_intent: "RECHARGE",
        preferred_activities: ["NATURE_SCENERY"],
        budget_band: "UP_TO_200K",
        duration_preference: "HALF_DAY",
        departure_area_id: "MALANG",
        group_type: "SOLO",
        group_size_band: "ONE",
      };

    const catalog = this.options.catalog ?? MOCK_RECOMMENDATION_PACKAGES;
    const result = evaluateRecommendations(quiz, catalog);

    if (result.state === "FALLBACK") {
      await this.logUnmatchedDemand({
        quizSignalSnapshot: { ...quiz },
        timestamp: new Date().toISOString(),
        reason: "NO_SUFFICIENT_MATCH",
      });
    }

    return result;
  }
}

export const defaultRecommendationAdapter = new MockRecommendationAdapter();
