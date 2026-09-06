// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { getPackageVisual } from "../../lib/assets/packageImages";
import { sessionStore } from "../onboarding/sessionStore";
import type { QuizDraft } from "../quiz/types";
import { MockRecommendationAdapter } from "./mockAdapter";
import { MOCK_RECOMMENDATION_PACKAGES } from "./mockPackages";
import { RecommendationResultScreen } from "./RecommendationResultScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
});

const matchedQuiz: QuizDraft = {
  currentStep: 6,
  current_intent: "NATURE",
  preferred_activities: ["NATURE_SCENERY", "LIGHT_EXPLORATION"],
  budget_band: "AROUND_200_300K",
  duration_preference: "FULL_DAY",
  departure_area_id: "MALANG",
  departure_area_label: "Malang",
  group_type: "FRIENDS",
  group_size_band: "THREE_TO_FOUR",
  updatedAt: "2026-08-31T10:00:00.000Z",
};

const fallbackQuiz: QuizDraft = {
  currentStep: 6,
  current_intent: "ACTIVE",
  preferred_activities: ["OUTDOOR_ACTIVE"],
  budget_band: "UP_TO_200K",
  duration_preference: "HALF_DAY",
  departure_area_id: "OTHER",
  departure_area_label: "Kediri",
  group_type: "SOLO",
  group_size_band: "ONE",
  updatedAt: "2026-08-31T11:00:00.000Z",
};

async function renderScreen(
  props: {
    adapter?: MockRecommendationAdapter;
  } = {},
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(
        MemoryRouter,
        undefined,
        createElement(RecommendationResultScreen, props),
      ),
    ),
  );
  return container;
}

describe("RecommendationResultScreen UI States and Interactions", () => {
  it("20. renders loading state while fetching recommendations", async () => {
    const adapter = new MockRecommendationAdapter({ delayMs: 1000 });
    const view = await renderScreen({ adapter });

    expect(view.textContent).toContain("Menyiapkan rekomendasi untukmu...");
  });

  it("21. renders matched state with top recommendation, factors, and max 2 alternatives", async () => {
    sessionStore.setQuizDraft(matchedQuiz);
    const adapter = new MockRecommendationAdapter();
    const view = await renderScreen({ adapter });

    expect(view.textContent).toContain(
      "Ini jeda yang paling cocok buat kamu sekarang.",
    );
    expect(view.textContent).toContain("Pilihan utama");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Kenapa ini cocok?");
    expect(view.textContent).toContain("Lihat Experience");
    expect(view.textContent).toContain("Pilihan lain yang juga dekat");
    expect(view.textContent).toContain("Lanjut ke Home");

    const altCards = view.querySelectorAll(".recommendation-alt-card");
    expect(altCards.length).toBeLessThanOrEqual(2);
  });

  it("renders semantic <img> for top recommendation visual without inline background-image", async () => {
    sessionStore.setQuizDraft(matchedQuiz);
    const adapter = new MockRecommendationAdapter();
    const view = await renderScreen({ adapter });

    const heroVisual = view.querySelector(".recommendation-hero-visual");
    expect(heroVisual).not.toBeNull();
    expect(heroVisual?.getAttribute("style") || "").not.toContain(
      "background-image",
    );

    const img = heroVisual?.querySelector<HTMLImageElement>("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(
      getPackageVisual("slow_green_day").svgDataUri,
    );
    expect(img?.alt).toBe("Ilustrasi suasana Sehari Pelan di Lereng Hijau");
    expect(img?.getAttribute("fetchpriority")).toBe("high");

    const altThumbs = view.querySelectorAll(".recommendation-alt-thumb");
    expect(altThumbs.length).toBeGreaterThan(0);
    for (const thumb of altThumbs) {
      expect(thumb.getAttribute("style") || "").not.toContain(
        "background-image",
      );
      const altImg = thumb.querySelector<HTMLImageElement>("img");
      expect(altImg).not.toBeNull();
      expect(altImg?.getAttribute("src")).toBeTruthy();
      expect(altImg?.getAttribute("loading")).toBe("lazy");
    }
  });

  it("renders standardized success verification badge and distinct recommendation-state badge", async () => {
    sessionStore.setQuizDraft(matchedQuiz);
    const adapter = new MockRecommendationAdapter();
    const view = await renderScreen({ adapter });

    // Recommendation-state badge
    const stateBadge = view.querySelector(".recommendation-badge--matched");
    expect(stateBadge?.textContent).toBe("Pilihan utama");

    // Verification trust badge with success tone
    const trustBadge = view.querySelector(
      ".recommendation-hero-visual .ui-badge--success",
    );
    expect(trustBadge).not.toBeNull();
    expect(trustBadge?.textContent).toContain("Terverifikasi Dasar");
    expect(trustBadge?.textContent).toContain("✓");
  });

  it("renders Terverifikasi Plus when package verificationLevel is PLUS", async () => {
    sessionStore.setQuizDraft(matchedQuiz);
    const plusAdapter = new MockRecommendationAdapter({
      catalog: [
        {
          ...MOCK_RECOMMENDATION_PACKAGES[0],
          id: "plus_pkg",
          verificationLevel: "PLUS",
        },
      ],
    });
    const view = await renderScreen({ adapter: plusAdapter });

    const trustBadge = view.querySelector(
      ".recommendation-hero-visual .ui-badge--success",
    );
    expect(trustBadge).not.toBeNull();
    expect(trustBadge?.textContent).toContain("Terverifikasi Plus");
    expect(trustBadge?.textContent).toContain("✓");
  });

  it("23. renders fallback state with locked copy and neutral 'Kenapa ini mendekati?' heading", async () => {
    sessionStore.setQuizDraft(fallbackQuiz);
    const onLogged = vi.fn();
    const adapter = new MockRecommendationAdapter({
      onUnmatchedDemandLogged: onLogged,
    });

    const view = await renderScreen({ adapter });

    expect(view.textContent).toContain(
      "Belum ada yang pas banget, tapi ini pilihan yang paling mendekati preferensimu.",
    );
    expect(view.textContent).toContain("Pilihan terdekat");
    expect(view.textContent).toContain("Kenapa ini mendekati?");
    expect(view.textContent).not.toContain("Pilihan utama");

    expect(onLogged).toHaveBeenCalledOnce();
    expect(adapter.loggedUnmatchedEvents[0].reason).toBe("NO_SUFFICIENT_MATCH");
  });

  it("24 & 25. renders error state on failure, preserves quiz draft, and recovers on retry", async () => {
    sessionStore.setQuizDraft(matchedQuiz);
    const adapter = new MockRecommendationAdapter({
      failCount: 1, // fails first, then recovers on retry
      errorMessage: "Koneksi jaringan terputus.",
    });

    const view = await renderScreen({ adapter });

    expect(view.textContent).toContain("Rekomendasi belum bisa dimuat.");
    expect(view.textContent).toContain("Jawaban kuismu tetap tersimpan.");

    // Quiz draft must still be preserved in session
    expect(sessionStore.getQuizDraft()?.current_intent).toBe("NATURE");

    const retryBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Coba lagi"),
    )!;

    await act(() => {
      retryBtn.click();
    });

    // Successfully displays result after retry
    expect(view.textContent).toContain(
      "Ini jeda yang paling cocok buat kamu sekarang.",
    );
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
  });

  it("fails and does NOT fabricate recommendation results if QuizDraft is missing", async () => {
    sessionStore.reset(); // quizDraft = null
    const adapter = new MockRecommendationAdapter();

    const view = await renderScreen({ adapter });

    expect(view.textContent).toContain("Rekomendasi belum bisa dimuat.");
    expect(view.textContent).not.toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).not.toContain("Pilihan utama");
  });
});

describe("Unmatched Demand Idempotency & React StrictMode Simulation", () => {
  it("logs unmatched demand at most ONCE for identical quiz draft snapshot (idempotent)", async () => {
    const onLogged = vi.fn();
    const adapter = new MockRecommendationAdapter({
      onUnmatchedDemandLogged: onLogged,
    });

    // Call 1
    await adapter.getRecommendations(fallbackQuiz);
    expect(onLogged).toHaveBeenCalledTimes(1);

    // Call 2 with identical draft snapshot (simulating React StrictMode double effect execution)
    await adapter.getRecommendations(fallbackQuiz);
    expect(onLogged).toHaveBeenCalledTimes(1); // STILL 1, NOT duplicated!
  });

  it("allows a new unmatched demand log when quiz answers/updatedAt are updated (retake)", async () => {
    const onLogged = vi.fn();
    const adapter = new MockRecommendationAdapter({
      onUnmatchedDemandLogged: onLogged,
    });

    // Initial fallback quiz completion
    await adapter.getRecommendations(fallbackQuiz);
    expect(onLogged).toHaveBeenCalledTimes(1);

    // User retakes quiz and updates preference
    const updatedFallbackQuiz: QuizDraft = {
      ...fallbackQuiz,
      current_intent: "REFLECTION",
      updatedAt: "2026-08-31T12:00:00.000Z",
    };

    await adapter.getRecommendations(updatedFallbackQuiz);
    expect(onLogged).toHaveBeenCalledTimes(2);
  });
});

describe("Recommendation Result Router-Level Navigation", () => {
  it("navigates to /packages/:packageId when primary CTA 'Lihat Experience' is clicked", async () => {
    sessionStore.setUser({
      id: "usr_nav_test",
      onboardingStatus: "COMPLETED",
    });
    sessionStore.setQuizDraft(matchedQuiz);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/onboarding/result"] },
          createElement(App),
        ),
      ),
    );

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lihat Experience"),
    )!;

    await act(async () => {
      ctaBtn.click();
    });

    // Successfully routed to /packages/slow_green_day
    expect(container.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(container.textContent).toContain("Mulai dari");
    expect(container.textContent).not.toContain("Ini jeda yang paling cocok");
  });

  it("navigates to /home when secondary CTA 'Lanjut ke Home' is clicked", async () => {
    sessionStore.setUser({
      id: "usr_nav_test_2",
      onboardingStatus: "COMPLETED",
    });
    sessionStore.setQuizDraft(matchedQuiz);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/onboarding/result"] },
          createElement(App),
        ),
      ),
    );

    const homeBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Home"),
    )!;

    await act(() => {
      homeBtn.click();
    });

    // Successfully routed to /home
    expect(container.textContent).toContain("Home");
    expect(container.querySelector(".traveler-app-shell")).not.toBeNull();
  });
});
