// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { sessionStore } from "../onboarding/sessionStore";
import type { QuizDraft } from "../quiz/types";
import { MockRecommendationAdapter } from "./mockAdapter";
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
};

async function renderScreen(props: {
  adapter?: MockRecommendationAdapter;
} = {}) {
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

    expect(view.textContent).toContain("Ini jeda yang paling cocok buat kamu sekarang.");
    expect(view.textContent).toContain("Pilihan utama");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Kenapa ini cocok?");
    expect(view.textContent).toContain("Lihat Experience");
    expect(view.textContent).toContain("Pilihan lain yang juga dekat");
    expect(view.textContent).toContain("Lanjut ke Home");

    const altCards = view.querySelectorAll(".recommendation-alt-card");
    expect(altCards.length).toBeLessThanOrEqual(2);
  });

  it("23. renders fallback state with locked copy and logs unmatched demand once", async () => {
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
    expect(view.textContent).toContain("Ini jeda yang paling cocok buat kamu sekarang.");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
  });
});
