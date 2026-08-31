export type CurrentIntent =
  "RECHARGE" | "NATURE" | "NOVELTY" | "REFLECTION" | "ACTIVE" | "SOCIAL";

export type PreferredActivity =
  | "NATURE_SCENERY"
  | "MINDFULNESS_RELAXATION"
  | "LOCAL_CULTURE"
  | "CREATIVE_WORKSHOP"
  | "LIGHT_EXPLORATION"
  | "OUTDOOR_ACTIVE";

export type BudgetBand =
  "UP_TO_200K" | "AROUND_200_300K" | "AROUND_300_500K" | "ABOVE_500K";

export type DurationPreference =
  "HALF_DAY" | "FULL_DAY" | "TWO_D_ONE_N" | "THREE_D_TWO_N_PLUS";

export type DepartureAreaId = "MALANG" | "SURABAYA" | "OTHER";

export type GroupType = "SOLO" | "PARTNER" | "FRIENDS" | "FAMILY";

export type GroupSizeBand = "ONE" | "TWO" | "THREE_TO_FOUR" | "FIVE_PLUS";

export interface QuizDraft {
  currentStep: number;
  current_intent?: CurrentIntent;
  preferred_activities: PreferredActivity[];
  budget_band?: BudgetBand;
  duration_preference?: DurationPreference;
  departure_area_id?: DepartureAreaId;
  departure_area_label?: string;
  group_type?: GroupType;
  group_size_band?: GroupSizeBand;
  updatedAt?: string;
}

export interface QuizCompletionResult {
  status: "COMPLETED";
  quizDraft: QuizDraft;
}

export interface QuizAdapter {
  getQuizDraft(): Promise<QuizDraft>;
  saveQuizStep(stepData: Partial<QuizDraft>): Promise<QuizDraft>;
  completeQuiz(finalDraft: QuizDraft): Promise<QuizCompletionResult>;
}
