import type { AuthUser } from "../auth/types";
import type { QuizDraft } from "../quiz/types";

export interface TravelerPresentationProfile {
  travelerId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressText?: string;
  earnedAt?: string;
}

export type ProfileActivityType =
  | "TRIP_COMPLETED"
  | "REVIEW_SUBMITTED"
  | "ACHIEVEMENT_EARNED"
  | "MOMENT_SHARED";

export interface ProfileActivityItem {
  id: string;
  type: ProfileActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
  formattedDate: string;
}

export type MomentMediaType = "PHOTO" | "VIDEO";

export interface TravelerMomentRecord {
  momentId: string;
  travelerId: string;
  bookingId: string;
  mediaType: MomentMediaType;
  mediaSource: string;
  thumbnailSource?: string;
  caption?: string;
  createdAt: string;
}

export interface TravelerProfileData {
  user: AuthUser;
  isPhoneVerified: boolean;
  quizDraft: QuizDraft | null;
  presentation?: TravelerPresentationProfile;
  stats: {
    completedJedaCount: number;
    followersCount: number;
    followingCount: number;
  };
  achievements: AchievementItem[];
  recentActivities: ProfileActivityItem[];
  moments: TravelerMomentRecord[];
}

export interface ProfileAdapter {
  getProfile(): Promise<TravelerProfileData>;
  getAllActivities(travelerId?: string): Promise<ProfileActivityItem[]>;
  updatePresentationProfile?(
    updates: Partial<Omit<TravelerPresentationProfile, "travelerId">>,
  ): Promise<TravelerPresentationProfile>;
  logout(): Promise<void>;
}
