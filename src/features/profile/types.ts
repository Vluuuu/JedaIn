import type { AuthUser } from "../auth/types";
import type { QuizDraft } from "../quiz/types";

export interface TravelerProfileData {
  user: AuthUser;
  isPhoneVerified: boolean;
  quizDraft: QuizDraft | null;
}

export interface ProfileAdapter {
  getProfile(): Promise<TravelerProfileData>;
  logout(): Promise<void>;
}
