import { mockTransactionStore } from "../checkout/mockTransactionStore";
import {
  getCombinedCatalogPackages,
  getCombinedPackageDetails,
} from "../marketplace/marketplaceAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import { formatSessionDateTimeRange } from "../packageDetail/formatSessionDate";
import { evaluateRecommendations } from "../recommendation/engine";
import { isCompletedQuizDraft } from "../recommendation/mockAdapter";
import { getDerivedVerifiedDestinations, HOME_MOOD_PRESETS } from "./config";
import type {
  HomeAdapter,
  HomeState,
  HomeViewModel,
  PendingPaymentSummary,
  PersonalizedRecommendationSummary,
  UpcomingTripSummary,
} from "./types";

export interface MockHomeAdapterOptions {
  pendingPayment?: PendingPaymentSummary | null;
  upcomingTrip?: UpcomingTripSummary | null;
  shouldFailRecommendation?: boolean;
  failRecommendationCount?: number;
  shouldFailPopular?: boolean;
  shouldFailDeparture?: boolean;
  shouldFailDestinations?: boolean;
  shouldFailPendingPayment?: boolean;
  delayMs?: number;
}

let sharedHomeAdapterOptions: MockHomeAdapterOptions = {};

export class MockHomeAdapter implements HomeAdapter {
  private options: MockHomeAdapterOptions;
  private failedRecommendationAttempts = 0;

  constructor(options: MockHomeAdapterOptions = {}) {
    this.options = options;
  }

  static setSharedOptions(options: MockHomeAdapterOptions) {
    sharedHomeAdapterOptions = { ...options };
  }

  static resetSharedOptions() {
    sharedHomeAdapterOptions = {};
  }

  private getMergedOptions(): MockHomeAdapterOptions {
    return { ...sharedHomeAdapterOptions, ...this.options };
  }

  private async delay(): Promise<void> {
    const opts = this.getMergedOptions();
    const ms = opts.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  async getHomeData(): Promise<HomeViewModel> {
    await this.delay();
    const opts = this.getMergedOptions();

    const session = sessionStore.get();
    const traveler = session.user;
    const quizDraft = session.quizDraft;

    const catalogPackages = getCombinedCatalogPackages();
    const packageDetails = getCombinedPackageDetails();

    const moduleErrors: HomeViewModel["moduleErrors"] = {};

    // 1. Pending payment (Sync with shared mockTransactionStore if not overridden)
    let pendingPayment: PendingPaymentSummary | null | undefined =
      opts.pendingPayment;
    if (opts.shouldFailPendingPayment) {
      moduleErrors.pendingPayment = "Gagal memuat status pembayaran.";
      pendingPayment = null;
    } else if (pendingPayment === undefined && traveler) {
      const activePending = mockTransactionStore.getActivePendingPayment(
        traveler.id,
      );
      if (activePending) {
        const pkg = catalogPackages.find(
          (p) => p.id === activePending.packageId,
        );
        pendingPayment = {
          bookingId: activePending.bookingId,
          packageName: pkg?.title ?? activePending.packageId,
          amount: activePending.amount,
          expiresAt: activePending.expiresAt,
          authoritativeStatus: "PENDING_PAYMENT",
        };
      }
    }

    // 2. Upcoming trip (Sync with shared mockTransactionStore if not overridden)
    let upcomingTrip: UpcomingTripSummary | null | undefined =
      opts.upcomingTrip;
    if (upcomingTrip === undefined && traveler) {
      const paidBookings = mockTransactionStore
        .getBookingsByTraveler(traveler.id)
        .filter((b) => b.status === "PAID");
      if (paidBookings.length > 0) {
        const latestPaid = paidBookings[0];
        const pkg = catalogPackages.find((p) => p.id === latestPaid.packageId);
        const detail = packageDetails[latestPaid.packageId];
        const sess = detail?.upcomingSessionPreviews?.find(
          (s) => s.sessionId === latestPaid.sessionId,
        );
        const dateLabel =
          sess?.startAt && sess?.endAt
            ? formatSessionDateTimeRange(sess.startAt, sess.endAt).dateLabel
            : "Jadwal Mendatang";

        upcomingTrip = {
          bookingId: latestPaid.bookingId,
          packageName: pkg?.title ?? latestPaid.packageId,
          tripDate: dateLabel,
          destinationLabel: pkg?.destinationName ?? "Destinasi Pilihan",
        };
      }
    }

    // 3. Recommendation (Reuses Issue #8 Engine strictly and preserves mode)
    let personalizedRecommendation: PersonalizedRecommendationSummary | null =
      null;
    if (opts.shouldFailRecommendation) {
      moduleErrors.recommendation = "Gagal memuat rekomendasi personal.";
    } else if (
      opts.failRecommendationCount !== undefined &&
      this.failedRecommendationAttempts < opts.failRecommendationCount
    ) {
      this.failedRecommendationAttempts++;
      moduleErrors.recommendation = "Gagal memuat rekomendasi personal.";
    } else if (isCompletedQuizDraft(quizDraft)) {
      const recResult = evaluateRecommendations(quizDraft, catalogPackages);
      if (recResult.topRecommendation) {
        personalizedRecommendation = {
          mode: recResult.state,
          item: recResult.topRecommendation,
        };
      }
    }

    // 4. Popular packages sorted by popularityRank
    let popularPackages = catalogPackages
      .filter((p) => p.status === "LIVE")
      .sort((a, b) => b.popularityRank - a.popularityRank);

    if (opts.shouldFailPopular) {
      moduleErrors.popular = "Gagal memuat paket populer.";
      popularPackages = [];
    }

    // 5. Departure area packages
    let departureAreaPackages: typeof popularPackages = [];
    let departureAreaName: string | undefined;

    if (opts.shouldFailDeparture) {
      moduleErrors.departure = "Gagal memuat paket area keberangkatan.";
    } else if (quizDraft?.departure_area_id) {
      if (quizDraft.departure_area_id === "MALANG") {
        departureAreaName = "Malang";
        departureAreaPackages = catalogPackages.filter(
          (p) => p.status === "LIVE" && p.departureAreas.includes("MALANG"),
        );
      } else if (quizDraft.departure_area_id === "SURABAYA") {
        departureAreaName = "Surabaya";
        departureAreaPackages = catalogPackages.filter(
          (p) => p.status === "LIVE" && p.departureAreas.includes("SURABAYA"),
        );
      } else {
        // OTHER: custom label stored, no geocode/distance fabrication
        departureAreaName = quizDraft.departure_area_label || "Area Kamu";
        departureAreaPackages = [];
      }
    }

    // 6. Verified destinations
    let verifiedDestinations = getDerivedVerifiedDestinations();
    if (opts.shouldFailDestinations) {
      moduleErrors.destinations = "Gagal memuat destinasi terverifikasi.";
      verifiedDestinations = [];
    }

    // Determine canonical Home state
    let state: HomeState;
    const hasModuleErrors = Object.keys(moduleErrors).length > 0;

    if (hasModuleErrors) {
      state = "ERROR_PARTIAL";
    } else if (pendingPayment && upcomingTrip) {
      state = "PENDING_PAYMENT_AND_UPCOMING";
    } else if (pendingPayment) {
      state = "PENDING_PAYMENT_ONLY";
    } else if (upcomingTrip) {
      state = "UPCOMING_TRIP_ONLY";
    } else if (!personalizedRecommendation) {
      state = "NO_RECOMMENDATION";
    } else {
      state = "NORMAL";
    }

    return {
      state,
      traveler,
      quizDraft,
      pendingPayment,
      upcomingTrip,
      personalizedRecommendation,
      popularPackages,
      departureAreaPackages,
      departureAreaName,
      verifiedDestinations,
      moodPresets: HOME_MOOD_PRESETS,
      moduleErrors: hasModuleErrors ? moduleErrors : undefined,
    };
  }
}

export const defaultHomeAdapter = new MockHomeAdapter();
