// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import type { AuthUser } from "../auth/types";
import type { BookingRecord } from "../checkout/types";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { mockContactVerificationStore } from "../contactVerification/mockContactVerificationStore";
import { MockHomeAdapter } from "../home/mockAdapter";
import { sessionStore } from "../onboarding/sessionStore";
import { RetakeQuizAdapter } from "../quiz/retakeAdapter";
import { TravelerQuizScreen } from "../quiz/TravelerQuizScreen";
import type { QuizDraft } from "../quiz/types";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { ActivityScreen } from "./ActivityScreen";
import { mockTravelerCommunityStore } from "./mockCommunityStore";
import { mockMomentStore } from "./mockMomentStore";
import { mockPresentationProfileStore } from "./mockPresentationProfileStore";
import { ProfileScreen } from "./ProfileScreen";
import { SettingsScreen } from "./SettingsScreen";

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
  mockTransactionStore.reset();
  mockReviewStore.reset();
  mockMomentStore.reset();
  mockTravelerCommunityStore.reset();
  mockPresentationProfileStore.reset();
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

describe("Traveler Profile Screen (T21) - Rebuilt V2 Identity & Journal", () => {
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

    // Identity in Forest hero
    expect(container.textContent).toContain("Budi Santoso");
    expect(container.textContent).toContain("B"); // Monogram
    expect(container.textContent).toContain("Lagi butuh:");
    expect(container.textContent).toContain("Dekat dengan alam");

    // Preferences summary
    expect(container.textContent).toContain("Alam & pemandangan");
    expect(container.textContent).toContain("Relaksasi & mindfulness");
    expect(container.textContent).toContain("Sekitar Rp200–300 ribu");
    expect(container.textContent).toContain("1 hari");
    expect(container.textContent).toContain("Malang");
    expect(container.textContent).toContain("Sendiri");
    expect(container.textContent).toContain("Ubah Preferensi");

    // Main Profile Privacy Check: Email, Phone, Logout, and Privacy block must NOT be prominent on main profile
    expect(container.textContent).not.toContain("08123456789");
    expect(container.textContent).not.toContain("Keluar dari Akun");
  });

  it("B. Settings gear icon is present with accessible label and routes to /profile/settings", async () => {
    sessionStore.setUser(sampleUser);
    sessionStore.setQuizDraft(sampleQuizDraft);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    let currentPath = "/profile";

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
              path: "/profile/settings",
              element: createElement("div", null, "Settings Target Screen"),
            }),
          ),
        ),
      );
    });

    const settingsLink = container.querySelector<HTMLAnchorElement>(
      ".profile-settings-gear-link",
    );
    expect(settingsLink).not.toBeNull();
    expect(settingsLink?.getAttribute("aria-label")).toBe("Pengaturan Profil");

    await act(async () => {
      settingsLink?.click();
    });

    expect(currentPath).toBe("/profile/settings");
  });

  it("C. Authoritative Jeda Selesai count: derived only from COMPLETED bookings", async () => {
    const newUser: AuthUser = {
      id: "usr_traveler_counts",
      name: "Rani",
      email: "rani@example.com",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(newUser);

    // Initial state: demo history booking provides 1 completed trip
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

    // 1 completed (from demo history bound to user)
    const statsElements = container.querySelectorAll(".profile-stat-number");
    expect(statsElements[0]?.textContent).toBe("1"); // Jeda Selesai

    // PAID or PENDING_PAYMENT bookings must NOT increment Jeda Selesai
    mockTransactionStore.reset();
    const bookingsList =
      mockTransactionStore.getBookings() as unknown as BookingRecord[];
    bookingsList.push({
      bookingId: "bk_paid_only",
      travelerId: newUser.id,
      packageId: "pkg_test",
      sessionId: "ses_1",
      participantCount: 1,
      unitPricePerPerson: 100000,
      totalAmount: 100000,
      status: "PAID",
      reservedQuantity: 0,
      bookedQuantity: 1,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date().toISOString(),
    });
    bookingsList.push({
      bookingId: "bk_pending_only",
      travelerId: newUser.id,
      packageId: "pkg_test",
      sessionId: "ses_2",
      participantCount: 1,
      unitPricePerPerson: 100000,
      totalAmount: 100000,
      status: "PENDING_PAYMENT",
      reservedQuantity: 1,
      bookedQuantity: 0,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: new Date().toISOString(),
    });

    // Re-render
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile"] },
          createElement(ProfileScreen),
        ),
      );
    });

    const updatedStats = container.querySelectorAll(".profile-stat-number");
    // Still exactly 1 Jeda Selesai
    expect(updatedStats[0]?.textContent).toBe("1");
  });

  it("D. Social metrics: unknown traveler safely returns 0 followers / 0 following", async () => {
    const unknownUser: AuthUser = {
      id: "usr_unknown_traveler_999",
      name: "Tita",
      email: "tita@example.com",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(unknownUser);

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

    const statsNumbers = container.querySelectorAll(".profile-stat-number");
    expect(statsNumbers[1]?.textContent).toBe("0"); // Followers
    expect(statsNumbers[2]?.textContent).toBe("0"); // Following
  });

  it("E. Achievements strip: derives earned vs locked milestones truthfully", async () => {
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

    expect(container.textContent).toContain("Jeda Milestones");
    expect(container.textContent).toContain("Jeda Pertama");
    expect(container.textContent).toContain("Tiga Jeda");
    expect(container.textContent).toContain("5 Destinasi");
    expect(container.textContent).toContain("Pemberi Ulasan");

    const milestoneItems = container.querySelectorAll(
      ".profile-milestone-item",
    );
    expect(milestoneItems.length).toBe(4);
    // Jeda Pertama is earned because sampleUser has 1 demo completed booking
    expect(milestoneItems[0]?.textContent).toContain("Tercapai");
    // Tiga Jeda is locked
    expect(milestoneItems[1]?.textContent).toContain("1/3");
  });

  it("F. Recent activity: max 3 rows on main profile and links to /profile/activity", async () => {
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

    const activityRows = container.querySelectorAll(".profile-activity-row");
    expect(activityRows.length).toBeLessThanOrEqual(3);

    const viewAllLink = container.querySelector<HTMLAnchorElement>(
      ".profile-view-all-link",
    );
    expect(viewAllLink).not.toBeNull();
    expect(viewAllLink?.getAttribute("href")).toBe("/profile/activity");
  });

  it("G. Activity privacy: activity feed contains no email, phone, or payment reference", async () => {
    sessionStore.setUser(sampleUser);

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile/activity"] },
          createElement(ActivityScreen),
        ),
      );
    });

    expect(container.textContent).toContain("Aktivitas Perjalanan");
    expect(container.textContent).not.toContain("budi@example.com");
    expect(container.textContent).not.toContain("08123456789");
    expect(container.textContent).not.toContain("PAY-");
    expect(container.textContent).not.toContain("OTP");
  });

  it("H. Momen Jeda: truthful empty state when traveler has no moments", async () => {
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

    expect(container.textContent).toContain("Momen Jeda");
    expect(container.textContent).toContain("Belum ada Momen Jeda.");
    expect(container.textContent).toContain(
      "Setelah perjalanan selesai, foto dan video perjalananmu bisa tampil di sini.",
    );
  });

  it("I. Settings Screen (/profile/settings): contains Contact, Preferences, Privacy, and Logout", async () => {
    sessionStore.setUser(sampleUser);
    mockContactVerificationStore.markPhoneVerified(
      sampleUser.id,
      sampleUser.phone!,
    );

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    let currentPath = "/profile/settings";

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/profile/settings"] },
          createElement(LocationObserver, {
            onLocation: (loc) => {
              currentPath = loc.pathname;
            },
          }),
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/profile/settings",
              element: createElement(SettingsScreen),
            }),
            createElement(Route, {
              path: "/login",
              element: createElement("div", null, "Login Target"),
            }),
          ),
        ),
      );
    });

    // Content sections
    expect(container.textContent).toContain("Pengaturan Profil");
    expect(container.textContent).toContain("Edit Profil");
    expect(container.textContent).toContain("Kontak & Akun");
    expect(container.textContent).toContain("✓ Nomor terverifikasi");
    expect(container.textContent).toContain("budi@example.com");
    expect(container.textContent).toContain("08123456789");
    expect(container.textContent).toContain("Preferensi");
    expect(container.textContent).toContain("Privasi & Data");
    expect(container.textContent).toContain("Keluar dari Akun");

    // Test logout from settings
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

  it("J. displays safe empty preference state when QuizDraft is missing", async () => {
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

  it("K. fails safely to empty preference state when QuizDraft is incomplete", async () => {
    sessionStore.setUser(sampleUser);
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
    expect(container.textContent).not.toContain("Fokus Utama");
    expect(container.textContent).not.toContain("Ubah Preferensi");
  });

  it("L. Profile nav item is active when mounted under App router", async () => {
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

describe("Preference Retake Screen & Isolation Contract (T22) - Preserved", () => {
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
    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 2 dari 6");

    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 3 dari 6");

    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 4 dari 6");

    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 5 dari 6");

    await act(async () => {
      getNextBtn().click();
    });
    expect(container.textContent).toContain("Langkah 6 dari 6");

    // Step 6 completion button: "TEMUKAN JEDAKU"
    expect(getNextBtn().textContent).toContain("TEMUKAN JEDAKU");
    await act(async () => {
      getNextBtn().click();
    });

    expect(currentPath).toBe("/onboarding/result");

    const committedDraft = sessionStore.getQuizDraft();
    expect(committedDraft?.current_intent).toBe("RECHARGE");
    expect(sessionStore.getStatus()).toBe("COMPLETED");

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

    for (let step = 1; step <= 5; step++) {
      await act(async () => {
        getNextBtn().click();
      });
    }

    expect(container.textContent).toContain("Langkah 6 dari 6");

    await act(async () => {
      getNextBtn().click();
    });

    expect(container.textContent).toContain(
      "Simulated network failure on complete",
    );

    expect(sessionStore.getQuizDraft()?.current_intent).toBe("NATURE");
    expect(sessionStore.getStatus()).toBe("COMPLETED");
  });
});
