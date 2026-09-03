// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { sessionStore } from "../onboarding/sessionStore";
import { MockQuizAdapter } from "./mockAdapter";
import { TravelerQuizScreen } from "./TravelerQuizScreen";
import type { QuizDraft } from "./types";
import { isValidGroupContext } from "./validation";

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

async function renderQuiz(
  props: {
    adapter?: MockQuizAdapter;
    onComplete?: (finalDraft: QuizDraft) => void;
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
        createElement(TravelerQuizScreen, props),
      ),
    ),
  );
  return container;
}

describe("Q6 Canonical Semantic Validator", () => {
  it("validates SOLO allows only ONE", () => {
    expect(isValidGroupContext("SOLO", "ONE")).toBe(true);
    expect(isValidGroupContext("SOLO", "TWO")).toBe(false);
    expect(isValidGroupContext("SOLO", "FIVE_PLUS")).toBe(false);
  });

  it("validates PARTNER allows only TWO", () => {
    expect(isValidGroupContext("PARTNER", "TWO")).toBe(true);
    expect(isValidGroupContext("PARTNER", "ONE")).toBe(false);
    expect(isValidGroupContext("PARTNER", "THREE_TO_FOUR")).toBe(false);
  });

  it("validates FRIENDS requires TWO, THREE_TO_FOUR, or FIVE_PLUS", () => {
    expect(isValidGroupContext("FRIENDS", "ONE")).toBe(false);
    expect(isValidGroupContext("FRIENDS", "TWO")).toBe(true);
    expect(isValidGroupContext("FRIENDS", "THREE_TO_FOUR")).toBe(true);
    expect(isValidGroupContext("FRIENDS", "FIVE_PLUS")).toBe(true);
  });

  it("validates FAMILY requires TWO, THREE_TO_FOUR, or FIVE_PLUS", () => {
    expect(isValidGroupContext("FAMILY", "ONE")).toBe(false);
    expect(isValidGroupContext("FAMILY", "TWO")).toBe(true);
    expect(isValidGroupContext("FAMILY", "THREE_TO_FOUR")).toBe(true);
    expect(isValidGroupContext("FAMILY", "FIVE_PLUS")).toBe(true);
  });
});

describe("Cross-User SessionStore QuizDraft Isolation", () => {
  it("clears quizDraft when setUser is called with a different user ID, but keeps for same user", () => {
    sessionStore.setUser({
      id: "usr_A",
      onboardingStatus: "IN_PROGRESS",
    });
    sessionStore.setQuizDraft({
      currentStep: 3,
      current_intent: "RECHARGE",
      preferred_activities: ["NATURE_SCENERY"],
    });

    expect(sessionStore.getQuizDraft()?.current_intent).toBe("RECHARGE");

    // Same user updates status or profile -> draft preserved
    sessionStore.setUser({
      id: "usr_A",
      onboardingStatus: "IN_PROGRESS",
      name: "User A Updated",
    });
    expect(sessionStore.getQuizDraft()?.current_intent).toBe("RECHARGE");

    // User B logs in -> draft MUST be cleared to prevent data leakage
    sessionStore.setUser({
      id: "usr_B",
      onboardingStatus: "NOT_STARTED",
    });
    expect(sessionStore.getQuizDraft()).toBeNull();
  });
});

describe("TravelerQuizScreen Full Six-Step Flow & Rules", () => {
  it("starts on Step 1, disables Next when unselected, and enables on choice", async () => {
    const view = await renderQuiz();

    expect(view.textContent).toContain("Langkah 1 dari 6");
    expect(view.textContent).toContain(
      "Jeda seperti apa yang paling kamu butuhkan sekarang?",
    );

    const nextBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;
    expect(nextBtn.disabled).toBe(true);

    const firstOption = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Tenang & recharge"))!;

    await act(() => {
      firstOption.click();
    });

    expect(nextBtn.disabled).toBe(false);
  });

  it("enforces Q2 multi-select minimum 1 and maximum 2, preventing a 3rd selection", async () => {
    const adapter = new MockQuizAdapter({
      initialDraft: {
        currentStep: 2,
        current_intent: "RECHARGE",
      },
    });

    const view = await renderQuiz({ adapter });

    expect(view.textContent).toContain("Langkah 2 dari 6");
    expect(view.textContent).toContain(
      "Aktivitas seperti apa yang paling ingin kamu lakukan?",
    );

    const nextBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;
    expect(nextBtn.disabled).toBe(true);

    const options = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    );
    const opt1 = options.find((el) =>
      el.textContent?.includes("Alam & pemandangan"),
    )!;
    const opt2 = options.find((el) =>
      el.textContent?.includes("Relaksasi & mindfulness"),
    )!;
    const opt3 = options.find((el) =>
      el.textContent?.includes("Budaya & pengalaman lokal"),
    )!;

    // Pick 1st
    await act(() => {
      opt1.click();
    });
    expect(nextBtn.disabled).toBe(false);
    expect(view.textContent).toContain("Terpilih: 1 dari maksimal 2");

    // Pick 2nd
    await act(() => {
      opt2.click();
    });
    expect(nextBtn.disabled).toBe(false);
    expect(view.textContent).toContain("Terpilih: 2 dari maksimal 2");

    // 3rd option should be disabled when limit 2 is reached
    expect(opt3.disabled).toBe(true);

    // Attempting click on 3rd does not exceed 2
    await act(() => {
      opt3.click();
    });
    expect(view.textContent).toContain("Terpilih: 2 dari maksimal 2");
  });

  it("resumes to the actual latest incomplete step", async () => {
    // Draft has completed Q1, Q2, Q3 but Q4 duration is missing
    const adapter = new MockQuizAdapter({
      initialDraft: {
        currentStep: 6, // previous currentStep was 6 but data was cleared/incomplete
        current_intent: "RECHARGE",
        preferred_activities: ["NATURE_SCENERY"],
        budget_band: "UP_TO_200K",
        // duration_preference missing
      },
    });

    const view = await renderQuiz({ adapter });
    expect(view.textContent).toContain("Langkah 4 dari 6");
    expect(view.textContent).toContain("Berapa lama waktu yang realistis");
  });

  it("handles Q5 OTHER selection by requiring non-empty departure area label", async () => {
    const adapter = new MockQuizAdapter({
      initialDraft: {
        currentStep: 5,
        current_intent: "RECHARGE",
        preferred_activities: ["NATURE_SCENERY"],
        budget_band: "UP_TO_200K",
        duration_preference: "HALF_DAY",
      },
    });

    const view = await renderQuiz({ adapter });

    expect(view.textContent).toContain("Langkah 5 dari 6");
    const otherOption = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Area lain"))!;

    await act(() => {
      otherOption.click();
    });

    const nextBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;
    // Input is empty initially -> next disabled
    expect(nextBtn.disabled).toBe(true);

    const input = view.querySelector<HTMLInputElement>(
      "#other-departure-area-input",
    )!;
    await act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter?.call(input, "Batu");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(nextBtn.disabled).toBe(false);
  });

  it("handles Q6 SOLO auto-sizing and FRIENDS manual size requirement", async () => {
    const adapter = new MockQuizAdapter({
      initialDraft: {
        currentStep: 6,
        current_intent: "RECHARGE",
        preferred_activities: ["NATURE_SCENERY"],
        budget_band: "UP_TO_200K",
        duration_preference: "HALF_DAY",
        departure_area_id: "MALANG",
        departure_area_label: "Malang",
      },
    });

    const view = await renderQuiz({ adapter });

    expect(view.textContent).toContain("Langkah 6 dari 6");
    const nextBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;

    // Select SOLO -> auto size ONE -> next enabled
    const soloOpt = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Sendiri"))!;

    await act(() => {
      soloOpt.click();
    });
    expect(nextBtn.disabled).toBe(false);

    // Select FRIENDS -> requires size selection
    const friendsOpt = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Teman"))!;

    await act(() => {
      friendsOpt.click();
    });
    expect(nextBtn.disabled).toBe(true);

    // Pick size 3-4 orang
    const sizeOpt = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("3–4 orang"))!;

    await act(() => {
      sizeOpt.click();
    });
    expect(nextBtn.disabled).toBe(false);
  });

  it("navigates Back without losing previously selected answers", async () => {
    const view = await renderQuiz();

    // Step 1: select Nature
    const natureOpt = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Dekat dengan alam"))!;
    await act(() => natureOpt.click());

    // Advance to Step 2
    const nextBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;
    await act(() => nextBtn.click());

    expect(view.textContent).toContain("Langkah 2 dari 6");

    // Click Back
    const backBtn = view.querySelector<HTMLButtonElement>(".quiz-back-button")!;
    await act(() => backBtn.click());

    expect(view.textContent).toContain("Langkah 1 dari 6");
    const recheckedNature = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Dekat dengan alam"))!;
    expect(recheckedNature.getAttribute("aria-checked")).toBe("true");
  });

  it("handles step save failure and allows successful retry on subsequent submit", async () => {
    // Fails once, then succeeds on retry
    const adapter = new MockQuizAdapter({
      failSaveCount: 1,
      errorMessage: "Gagal menyimpan ke server simulasi.",
    });

    const view = await renderQuiz({ adapter });
    const opt = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Tenang & recharge"))!;

    await act(() => opt.click());

    const nextBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;

    // 1st attempt -> fails
    await act(() => nextBtn.click());

    expect(view.textContent).toContain("Gagal menyimpan ke server simulasi.");
    expect(view.textContent).toContain("Langkah 1 dari 6");
    expect(opt.getAttribute("aria-checked")).toBe("true");

    // 2nd attempt -> retry succeeds and advances to Step 2
    await act(() => nextBtn.click());

    expect(view.textContent).not.toContain(
      "Gagal menyimpan ke server simulasi.",
    );
    expect(view.textContent).toContain("Langkah 2 dari 6");
  });

  it("completes full quiz on step 6 and transitions onboarding state to COMPLETED", async () => {
    const onComplete = vi.fn();
    const adapter = new MockQuizAdapter({
      initialDraft: {
        currentStep: 6,
        current_intent: "RECHARGE",
        preferred_activities: ["NATURE_SCENERY", "MINDFULNESS_RELAXATION"],
        budget_band: "UP_TO_200K",
        duration_preference: "HALF_DAY",
        departure_area_id: "MALANG",
        departure_area_label: "Malang",
      },
    });

    const view = await renderQuiz({ adapter, onComplete });
    const soloOpt = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((el) => el.textContent?.includes("Sendiri"))!;

    await act(() => soloOpt.click());

    const finishBtn = view.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;
    expect(finishBtn.textContent).toContain("TEMUKAN JEDAKU");

    await act(() => finishBtn.click());

    expect(onComplete).toHaveBeenCalledOnce();
    expect(sessionStore.getStatus()).toBe("COMPLETED");
  });
});
