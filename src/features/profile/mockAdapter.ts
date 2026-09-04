import { mockTransactionStore } from "../checkout/mockTransactionStore";
import type { BookingRecord } from "../checkout/types";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { sessionStore } from "../onboarding/sessionStore";
import { createDemoTravelerHistory } from "../trips/demoHistory";
import { calculateTravelerAchievements } from "./achievementsCalculator";
import { getTravelerProfileActivity } from "./activityAdapter";
import { mockTravelerCommunityStore } from "./mockCommunityStore";
import { mockMomentStore } from "./mockMomentStore";
import { mockPresentationProfileStore } from "./mockPresentationProfileStore";
import type {
  ProfileActivityItem,
  ProfileAdapter,
  TravelerPresentationProfile,
  TravelerProfileData,
} from "./types";

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

  private resolveCompletedBookings(travelerId: string): BookingRecord[] {
    const storeBookings =
      mockTransactionStore.getBookingsByTraveler(travelerId);
    const completed: BookingRecord[] = [];

    for (const b of storeBookings) {
      if (b.status === "COMPLETED") {
        completed.push(b);
      }
    }

    // Deterministic demo history binding
    const demo = createDemoTravelerHistory(travelerId);
    const hasDemo = completed.some(
      (b) => b.bookingId === demo.booking.bookingId,
    );
    if (!hasDemo) {
      completed.push(demo.booking);
    }

    return completed;
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

    // Derived completed bookings
    const completedBookings = this.resolveCompletedBookings(user.id);
    const completedJedaCount = completedBookings.length;

    // Social stats from centralized mock store
    const socialCounts = mockTravelerCommunityStore.getCommunityCounts(user.id);

    // Achievements calculation
    const achievements = calculateTravelerAchievements({
      travelerId: user.id,
      completedBookings,
    });

    // Recent activities (max 3 on main profile)
    const allActivities = getTravelerProfileActivity(
      user.id,
      completedBookings,
    );
    const recentActivities = allActivities.slice(0, 3);

    // Traveler Moments
    const moments = mockMomentStore.getMomentsByTraveler(user.id);

    // Presentation profile (displayName, bio, avatar)
    const presentation = mockPresentationProfileStore.getProfile(user.id) ?? {
      travelerId: user.id,
      displayName: user.name ?? "",
    };

    // Register/sync current traveler with public directory
    mockTravelerCommunityStore.registerOrUpdateTraveler({
      travelerId: user.id,
      displayName: presentation.displayName || user.name || "Traveler JedaIn",
      bio: presentation.bio,
      avatarUrl: presentation.avatarUrl,
      completedJedaCount,
    });

    return {
      user,
      isPhoneVerified,
      quizDraft,
      presentation,
      stats: {
        completedJedaCount,
        followersCount: socialCounts.followers,
        followingCount: socialCounts.following,
      },
      achievements,
      recentActivities,
      moments,
    };
  }

  async getAllActivities(travelerId?: string): Promise<ProfileActivityItem[]> {
    await this.delay();
    const id = travelerId ?? sessionStore.get().user?.id;
    if (!id) return [];

    const completedBookings = this.resolveCompletedBookings(id);
    return getTravelerProfileActivity(id, completedBookings);
  }

  async updatePresentationProfile(
    updates: Partial<Omit<TravelerPresentationProfile, "travelerId">>,
  ): Promise<TravelerPresentationProfile> {
    await this.delay();
    const user = sessionStore.get().user;
    if (!user) {
      throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
    }
    const updated = mockPresentationProfileStore.updateProfile(
      user.id,
      updates,
    );

    // Synchronize to public traveler directory
    const completedBookings = this.resolveCompletedBookings(user.id);
    mockTravelerCommunityStore.registerOrUpdateTraveler({
      travelerId: user.id,
      displayName: updated.displayName,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      completedJedaCount: completedBookings.length,
    });

    return updated;
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
