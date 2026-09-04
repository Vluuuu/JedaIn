// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import type { AuthUser } from "../auth/types";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { MockHomeAdapter } from "../home/mockAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import { RetakeQuizAdapter } from "../quiz/retakeAdapter";
import { TravelerQuizScreen } from "../quiz/TravelerQuizScreen";
import type { QuizDraft } from "../quiz/types";
import { ProfileScreen } from "./ProfileScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
  mockContactVerificationStore.reset();
});

const sampleUser: AuthUser = {
  id: "usr_traveler_1",
  name: "Budi Santoso",
  email: "budi@example.com",
  phone: "08123456789",
  onboardingStatus: "COMPLETED",
};

const sampleQuizDraft: QuizDraft = {
  currentStep: 6,
  current_intent: "NATURE",
  preferred_activities: ["NATURE_SCENERY", "MINDFULNESS_RELAXATION"],
  budget_band: "AROUND_200_300K",
  duration_preference: "FULL_DAY",
  departure_area_id: "MALANG",
  departure_area_label: "Malang",
  group_type: "SOLO",
  group_size_band: "ONE",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

function LocationObserver({
  onLocation,
}: {
  onLocation: (location: { pathname: string; search: string }) => void;
}) {
  const location = useLocation();
  onLocation({ pathname: location.pathname, search: location.search });
  return null;
}

describe("Traveler Profile Screen (T21)", () => {
  it("A. displays authenticated completed traveler identity and preferences", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    // Identity
    expect(container.textContent).toContain("Budi Santoso");
    expect(container.textContent).toContain("budi@example.com");
    expect(container.textContent).toContain("08123456789");

    // Preferences summary
    expect(container.textContent).toContain("Dekat dengan alam");
    expect(container.textContent).toContain("Alam & pemandangan");
    expect(container.textContent).toContain("Relaksasi & mindfulness");
    expect(container.textContent).toContain("Sekitar Rp200–300 ribu");
    expect(container.textContent).toContain("1 hari");
    expect(container.textContent).toContain("Malang");
    expect(container.textContent).toContain("Sendiri");
    expect(container.textContent).toContain("Ubah Preferensi");
  });

  it("B. verified phone displays flat '✓ Nomor terverifikasi' without pills", async () => {
    sessionStore.setUser(sampleUser);
    mockContactVerificationStore.markPhoneVerified(
      sampleUser.id,
      sampleUser.phone!,
    );

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    expect(container.textContent).toContain("✓ Nomor terverifikasi");
    expect(
      container.querySelector(".profile-verification-text--verified"),
    ).not.toBeNull();
  });

  it("C. unverified phone displays truthful unverified state without fake OTP button", async () => {
    sessionStore.setUser(sampleUser);
    // Do NOT verify phone in mockContactVerificationStore

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    expect(container.textContent).toContain("Belum terverifikasi");
    expect(container.textContent).toContain(
      "Verifikasi nomor akan diminta secara kontekstual",
    );
    // Ensure no fake OTP trigger exists
    expect(container.textContent).not.toContain("Kirim OTP");
    expect(container.textContent).not.toContain("Verifikasi Sekarang");
  });

  it("D. displays safe empty preference state when QuizDraft is missing", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(null);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    expect(container.textContent).toContain("Preferensi belum tersedia.");
    expect(container.textContent).toContain("Atur Preferensi");
  });

  it("D2. fails safely to empty preference state when QuizDraft is incomplete", async () => {
    sessionStore.setUser(sampleUser);
    // Partially completed draft missing budget, duration, departure, group
    sessionStore.setQuizDraft({
      currentStep: 2,
      current_intent: "NATURE",
      preferred_activities: ["NATURE_SCENERY"],
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    expect(container.textContent).toContain("Preferensi belum tersedia.");
    expect(container.textContent).toContain("Atur Preferensi");
    // Partial values must not be rendered as active preference
    expect(container.textContent).not.toContain("Fokus Utama");
    expect(container.textContent).not.toContain("Ubah Preferensi");
  });

  it("D3. fails safely to empty preference state when departure is OTHER with blank label", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft({
      ...sampleQuizDraft,
      departure_area_id: "OTHER",
      departure_area_label: "   ",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    expect(container.textContent).toContain("Preferensi belum tersedia.");
    expect(container.textContent).toContain("Atur Preferensi");
    expect(container.textContent).not.toContain("Fokus Utama");
  });

  it("E. displays privacy and data notice from source-backed consent", async () => {
    sessionStore.setUser(sampleUser);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    expect(container.textContent).toContain("Privasi & Data");
    expect(container.textContent).toContain(
      "Preferensimu digunakan untuk personalisasi rekomendasi dan insight agregat",
    );
  });

  it("F. logs out traveler by resetting session and redirecting to /login", async () => {
    sessionStore.setUser(sampleUser);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    let currentPath = "";

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(LocationObserver, {
            onLocation: (loc) => {
              currentPath = loc.pathname;
            },
          }),
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/profile",
              element: createElement(ProfileScreen),
            }),
            createElement(Route, {
              path: "/login",
              element: createElement("div", null, "Login Screen Target"),
            }),
          ),
        ),
      );
    });

    const logoutBtn = container.querySelector<HTMLButtonElement>(
      ".profile-logout-button",
    )!;
    expect(logoutBtn).not.toBeNull();

    await act(async () => {
      logoutBtn.click();
    });

    expect(sessionStore.get().user).toBeNull();
    expect(currentPath).toBe("/login");
  });

  it("G. Profile nav item is active when mounted under App router", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(App),
        ),
      );
    });

    const activeNav = container.querySelector(
      ".traveler-bottom-nav__item--active",
    );
    expect(activeNav).not.toBeNull();
    expect(activeNav?.textContent).toContain("Profile");
  });
});

describe("Preference Retake Screen & Isolation Contract (T22)", () => {
  it("30. Prefills existing answers, starts at Step 1, and shows retake copy", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    const adapter = new RetakeQuizAdapter();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile/preferences"] },
          createElement(TravelerQuizScreen, {
            mode: "retake",
            adapter,
          }),
        ),
      );
    });

    // Header copy
    expect(container.textContent).toContain(
      "Perbarui jeda yang kamu butuhkan sekarang",
    );

    // Step 1
    expect(container.textContent).toContain("Langkah 1 dari 6");

    // Existing answer preselected (NATURE)
    const selectedOption = container.querySelector(
      ".quiz-option-card--selected",
    );
    expect(selectedOption?.textContent).toContain("Dekat dengan alam");

    // Step 1 back button points to Profile
    const backBtn =
      container.querySelector<HTMLButtonElement>(".quiz-back-button");
    expect(backBtn?.textContent).toContain("Ke Profil");
    expect(backBtn?.disabled).toBe(false);
  });

  it("31. Partial retake isolation: modifying answers and exiting keeps old preference intact", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    const adapter = new RetakeQuizAdapter();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    let currentPath = "/profile/preferences";

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile/preferences"] },
          createElement(LocationObserver, {
            onLocation: (loc) => {
              currentPath = loc.pathname;
            },
          }),
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/profile/preferences",
              element: createElement(TravelerQuizScreen, {
                mode: "retake",
                adapter,
              }),
            }),
            createElement(Route, {
              path: "/profile",
              element: createElement("div", null, "Profile Target"),
            }),
          ),
        ),
      );
    });

    // In Step 1, select ACTIVE ("Bergerak & lebih aktif")
    const activeOption = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((b) => b.textContent?.includes("Bergerak & lebih aktif"))!;
    await act(async () => {
      activeOption.click();
    });

    // Click LANJUT to advance to Step 2
    const nextBtn = container.querySelector<HTMLButtonElement>(
      ".quiz-submit-button",
    )!;
    await act(async () => {
      nextBtn.click();
    });

    expect(container.textContent).toContain("Langkah 2 dari 6");

    // Click Kembali to go back to Step 1
    const backBtn =
      container.querySelector<HTMLButtonElement>(".quiz-back-button")!;
    await act(async () => {
      backBtn.click();
    });

    expect(container.textContent).toContain("Langkah 1 dari 6");

    // Click "Ke Profil" to exit without completing
    await act(async () => {
      backBtn.click();
    });

    expect(currentPath).toBe("/profile");

    // CANONICAL ASSERTION: sessionStore must STILL have NATURE!
    expect(sessionStore.getQuizDraft()?.current_intent).toBe("NATURE");

    // Home recommendation still derives from NATURE
    const homeAdapter = new MockHomeAdapter();
    const homeData = await homeAdapter.getHomeData();
    expect(homeData.quizDraft?.current_intent).toBe("NATURE");
  });

  it("32. Successful retake completion commits new QuizDraft atomically and updates recommendation", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    const adapter = new RetakeQuizAdapter();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    let currentPath = "/profile/preferences";

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile/preferences"] },
          createElement(LocationObserver, {
            onLocation: (loc) => {
              currentPath = loc.pathname;
            },
          }),
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/profile/preferences",
              element: createElement(TravelerQuizScreen, {
                mode: "retake",
                adapter,
              }),
            }),
            createElement(Route, {
              path: "/onboarding/result",
              element: createElement(
                "div",
                null,
                "Recommendation Result Screen",
              ),
            }),
          ),
        ),
      );
    });

    // Step 1: change to RECHARGE ("Tenang & recharge")
    const rechargeOption = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".quiz-option-card"),
    ).find((b) => b.textContent?.includes("Tenang & recharge"))!;
    await act(async () => {
      rechargeOption.click();
    });

    const getNextBtn = () =>
      container.querySelector<HTMLButtonElement>(".quiz-submit-button")!;

    // Advance through all 6 steps
    // Step 1 -> 2
    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 2 dari 6");

    // Step 2 -> 3
    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 3 dari 6");

    // Step 3 -> 4
    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 4 dari 6");

    // Step 4 -> 5
    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 5 dari 6");

    // Step 5 -> 6
    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 6 dari 6");

    // Step 6 completion button: "TEMUKAN JEDAKU"
    expect(getNextBtn().textContent).toContain("TEMUKAN JEDAKU");
    await act(async () => {
      getNextBtn().click();
    });

    // Must navigate to /onboarding/result
    expect(currentPath).toBe("/onboarding/result");

    // sessionStore MUST now have the committed RECHARGE intent
    const committedDraft = sessionStore.getQuizDraft();
    expect(committedDraft?.current_intent).toBe("RECHARGE");
    expect(sessionStore.getStatus()).toBe("COMPLETED");

    // Home immediately reflects the new preference
    const homeAdapter = new MockHomeAdapter();
    const homeData = await homeAdapter.getHomeData();
    expect(homeData.quizDraft?.current_intent).toBe("RECHARGE");
    expect(
      homeData.personalizedRecommendation?.item.reasons.length,
    ).toBeGreaterThan(0);
  });

  it("33. Failed retake leaves current preference unchanged and shows retry banner", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    const adapter = new RetakeQuizAdapter({
      shouldFailComplete: true,
      errorMessage: "Simulated network failure on complete",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile/preferences"] },
          createElement(TravelerQuizScreen, {
            mode: "retake",
            adapter,
          }),
        ),
      );
    });

    const getNextBtn = () =>
      container.querySelector<HTMLButtonElement>(".quiz-submit-button")!;

    // Step 1 to 6
    for (let step = 1; step <= 5; step++) {
      await act(async () => {
        getNextBtn().click();
      });
    }

    expect(container.textContent).toContain("Langkah 6 dari 6");

    // Attempt to complete
    await act(async () => {
      getNextBtn().click();
    });

    // Error banner shown
    expect(container.textContent).toContain(
      "Simulated network failure on complete",
    );

    // Old preference remains intact
    expect(sessionStore.getQuizDraft()?.current_intent).toBe("NATURE");
    expect(sessionStore.getStatus()).toBe("COMPLETED");
  });
});
