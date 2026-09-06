// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import type { AuthUser } from "../auth/types";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { ContactVerificationScreen } from "./ContactVerificationScreen";
import { MockContactVerificationAdapter } from "./mockAdapter";
import { mockContactVerificationStore } from "./mockContactVerificationStore";
import { mockOtpSessionStore } from "./mockOtpSessionStore";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  sessionStore.reset();
  mockTransactionStore.reset();
  mockContactVerificationStore.reset();
  mockOtpSessionStore.reset();
  vi.useRealTimers();
});

function LocationObserver({
  onLocation,
}: {
  onLocation: (pathname: string) => void;
}) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

async function renderContactVerification(
  sessionId = "ses_sgd_1",
  props: { adapter?: MockContactVerificationAdapter } = {},
  initialEntries: string[] = [`/checkout/${sessionId}/contact`],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  let currentPath = "";

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(LocationObserver, {
          onLocation: (p) => {
            currentPath = p;
          },
        }),
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/checkout/:sessionId/contact",
            element: createElement(ContactVerificationScreen, props),
          }),
          createElement(Route, {
            path: "/checkout/:sessionId",
            element: createElement("div", undefined, "Checkout Screen Target"),
          }),
        ),
      ),
    );
  });

  return { container, getPath: () => currentPath };
}

describe("ContactVerificationScreen (T11) Unit & Integration Tests", () => {
  // ROUTE & CONTEXT TESTS
  it("1. valid Checkout session resolves T11 screen", async () => {
    sessionStore.setUser({
      id: "usr_val_1",
      name: "Val User",
      email: "val@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");
    expect(container.textContent).toContain("Verifikasi Nomor HP");
    expect(container.textContent).toContain("Kembali ke Checkout");
    expect(container.querySelector("#contact-phone-input")).not.toBeNull();
  });

  it("2. unknown session renders NOT_FOUND state", async () => {
    sessionStore.setUser({
      id: "usr_unknown",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification(
      "unknown_session_999",
    );
    expect(container.textContent).toContain("Checkout tidak ditemukan.");
    expect(container.textContent).toContain("Kembali ke Explore");
  });

  it("3. non-LIVE package session renders NOT_FOUND state", async () => {
    sessionStore.setUser({ id: "usr_non_live", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter({
      packages: [
        {
          id: "draft_pkg",
          title: "Draft Pkg",
          shortSummary: "Summary",
          destinationName: "Dest",
          locationLabel: "Loc",
          visualAsset: "asset.jpg",
          status: "DRAFT" as "LIVE",
          verificationLevel: "BASIC",
          pricePerPerson: 100000,
          durationType: "HALF_DAY",
          departureAreas: ["MALANG"],
          experienceIntents: ["NATURE"],
          activityTags: ["NATURE_SCENERY"],
          suitableGroupTypes: ["SOLO"],
          suitableGroupSizeBands: ["ONE"],
          rating: 4.5,
          popularityRank: 50,
        },
      ],
      details: {
        draft_pkg: {
          packageId: "draft_pkg",
          valueProposition: "Val prop",
          highlights: [],
          itinerary: [],
          includedItems: [],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "org_1",
            displayName: "Org",
            guideStatus: "CONCEPT_ONLY",
          },
          destinationDetail: { overviewDescription: "Desc" },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_draft",
              packageId: "draft_pkg",
              startAt: "2026-09-12T08:00:00+07:00",
              endAt: "2026-09-12T14:00:00+07:00",
              status: "OPEN",
              pricePerPerson: 100000,
              remainingSlots: 5,
            },
          ],
        },
      },
    });

    const { container } = await renderContactVerification("ses_draft", {
      adapter,
    });
    expect(container.textContent).toContain("Checkout tidak ditemukan.");
  });

  it("4. detail or session packageId mismatch renders NOT_FOUND state", async () => {
    sessionStore.setUser({ id: "usr_mismatch", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter({
      details: {
        slow_green_day: {
          packageId: "slow_green_day",
          valueProposition: "Val prop",
          highlights: [],
          itinerary: [],
          includedItems: [],
          excludedItems: [],
          safetyNotes: [],
          cancellationPolicySummary: "Policy",
          organizer: {
            id: "org_1",
            displayName: "Org",
            guideStatus: "CONCEPT_ONLY",
          },
          destinationDetail: { overviewDescription: "Desc" },
          upcomingSessionPreviews: [
            {
              sessionId: "ses_mismatched",
              packageId: "other_package", // MISMATCH!
              startAt: "2026-09-12T08:00:00+07:00",
              endAt: "2026-09-12T14:00:00+07:00",
              status: "OPEN",
              pricePerPerson: 275000,
              remainingSlots: 5,
            },
          ],
        },
      },
    });

    const { container } = await renderContactVerification("ses_mismatched", {
      adapter,
    });
    expect(container.textContent).toContain("Checkout tidak ditemukan.");
  });

  it("5. protected shell reused, bottom nav hidden, single main landmark", async () => {
    sessionStore.setUser({
      id: "usr_shell",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1/contact"] },
          createElement(App),
        ),
      );
    });

    expect(container.textContent).toContain("Verifikasi Nomor HP");
    expect(container.querySelector(".traveler-bottom-nav")).toBeNull();
    expect(container.querySelectorAll("main").length).toBe(1);
  });

  it("6. direct reload works from sessionId URL parameter", async () => {
    sessionStore.setUser({
      id: "usr_reload_contact",
      phone: "081999000",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_2");
    expect(container.textContent).toContain("Verifikasi Nomor HP");
    const input = container.querySelector<HTMLInputElement>(
      "#contact-phone-input",
    );
    expect(input?.value).toBe("081999000");
  });

  it("7. back button returns to same /checkout/:sessionId without verifying", async () => {
    sessionStore.setUser({
      id: "usr_back_test",
      phone: "081999000",
      onboardingStatus: "COMPLETED",
    });

    const { container, getPath } = await renderContactVerification("ses_sgd_1");
    const backBtn = container.querySelector<HTMLAnchorElement>(
      ".contact-verification-back-btn",
    )!;

    await act(async () => {
      backBtn.click();
    });

    expect(container.textContent).toContain("Checkout Screen Target");
    expect(getPath()).toBe("/checkout/ses_sgd_1");
    expect(
      mockContactVerificationStore.isPhoneVerified(
        "usr_back_test",
        "081999000",
      ),
    ).toBe(false);
  });

  // PHONE STATE & VALIDATION TESTS
  it("8. existing AuthUser.phone pre-fills input field", async () => {
    sessionStore.setUser({
      id: "usr_prefill",
      name: "Prefill User",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");
    const phoneInput = container.querySelector<HTMLInputElement>(
      "#contact-phone-input",
    )!;
    expect(phoneInput.value).toBe("08123456789");
  });

  it("9. missing AuthUser.phone starts empty", async () => {
    sessionStore.setUser({
      id: "usr_empty_phone",
      name: "Empty Phone User",
      phone: undefined,
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");
    const phoneInput = container.querySelector<HTMLInputElement>(
      "#contact-phone-input",
    )!;
    expect(phoneInput.value).toBe("");
  });

  it("10. empty phone submission is blocked", async () => {
    sessionStore.setUser({
      id: "usr_empty_block",
      phone: undefined,
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");
    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    expect(submitBtn.disabled).toBe(true);
  });

  it("11. recoverable request error preserves phone input and allows retry", async () => {
    sessionStore.setUser({
      id: "usr_req_err",
      phone: "08111222333",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockContactVerificationAdapter({ failRequestCount: 1 });
    const { container } = await renderContactVerification("ses_sgd_1", {
      adapter,
    });

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain("Kode OTP belum bisa dikirim");
    const phoneInput = container.querySelector<HTMLInputElement>(
      "#contact-phone-input",
    )!;
    expect(phoneInput.value).toBe("08111222333");

    // Retry succeeds
    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain("Kode verifikasi telah dikirim ke");
  });

  it("12. change phone button invalidates active OTP session and resets to phone entry", async () => {
    sessionStore.setUser({
      id: "usr_change_phone",
      phone: "0811111111",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");

    // Request OTP for 0811111111
    const submitBtn1 = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn1.click();
    });

    expect(container.textContent).toContain("Kode verifikasi telah dikirim ke");
    expect(
      mockOtpSessionStore.getActiveSession("usr_change_phone"),
    ).toBeDefined();

    // Click "Ubah nomor"
    const changeBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-change-phone-btn",
    )!;
    await act(async () => {
      changeBtn.click();
    });

    expect(container.querySelector("#contact-phone-input")).not.toBeNull();
    expect(container.querySelector("#contact-otp-input")).toBeNull();
    // Authoritative session invalidated!
    expect(
      mockOtpSessionStore.getActiveSession("usr_change_phone"),
    ).toBeUndefined();
  });

  // SHARED VERIFICATION STORE TESTS
  it("13. phone presence alone is not verified & verification bound to exact Traveler + phone", () => {
    const travelerId = "usr_bound_test";
    const phone = "08123456789";

    expect(
      mockContactVerificationStore.isPhoneVerified(travelerId, phone),
    ).toBe(false);

    mockContactVerificationStore.markPhoneVerified(travelerId, phone);

    expect(
      mockContactVerificationStore.isPhoneVerified(travelerId, phone),
    ).toBe(true);
    // Different phone is unverified
    expect(
      mockContactVerificationStore.isPhoneVerified(travelerId, "0899999999"),
    ).toBe(false);
    // Different traveler is unverified
    expect(
      mockContactVerificationStore.isPhoneVerified("usr_other", phone),
    ).toBe(false);
  });

  it("14. already-verified exact phone direct entry immediately returns to Checkout", async () => {
    const traveler: AuthUser = {
      id: "usr_already_ver",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);
    mockContactVerificationStore.markPhoneVerified(
      traveler.id,
      traveler.phone!,
    );

    const { container, getPath } = await renderContactVerification("ses_sgd_1");

    expect(container.textContent).toContain("Checkout Screen Target");
    expect(getPath()).toBe("/checkout/ses_sgd_1");
  });

  it("15. successful verification updates sessionStore.user.phone and returns to Checkout", async () => {
    const traveler: AuthUser = {
      id: "usr_success_update",
      name: "Update User",
      email: "update@example.com",
      phone: "081000222333",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);
    sessionStore.setQuizDraft({
      currentStep: 2,
      preferred_activities: ["NATURE_SCENERY"],
    });

    const { container, getPath } = await renderContactVerification("ses_sgd_1");

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    // Enter default demo OTP "111111"
    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "111111";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const verifyBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      verifyBtn.click();
    });

    expect(getPath()).toBe("/checkout/ses_sgd_1");
    // Shared store updated
    expect(
      mockContactVerificationStore.isPhoneVerified(traveler.id, "081000222333"),
    ).toBe(true);
    // sessionStore updated
    const currentUser = sessionStore.get().user;
    expect(currentUser?.phone).toBe("081000222333");
    expect(currentUser?.id).toBe("usr_success_update");
    expect(currentUser?.onboardingStatus).toBe("COMPLETED");
    // QuizDraft preserved
    expect(sessionStore.getQuizDraft()?.preferred_activities).toEqual([
      "NATURE_SCENERY",
    ]);
  });

  // RESEND & TIMER ACCESSIBILITY (WITH FAKE TIMERS)
  it("16. resend countdown derives from timestamp without 1s warnings and resend enables after cooldown", async () => {
    vi.useFakeTimers();

    sessionStore.setUser({
      id: "usr_resend_test",
      phone: "081222333444",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockContactVerificationAdapter({ cooldownSeconds: 30 });
    const { container } = await renderContactVerification("ses_sgd_1", {
      adapter,
    });

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    const resendBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-resend-btn",
    )!;
    expect(resendBtn.disabled).toBe(true);
    expect(container.textContent).toContain("Sisa waktu: 30 dtk");

    // Advance 15 seconds
    await act(async () => {
      vi.advanceTimersByTime(15000);
    });
    expect(container.textContent).toContain("Sisa waktu: 15 dtk");
    expect(resendBtn.disabled).toBe(true);

    // Advance remaining 15 seconds
    await act(async () => {
      vi.advanceTimersByTime(15000);
    });
    expect(resendBtn.disabled).toBe(false);
    expect(container.textContent).toContain("Kirim ulang kode tersedia");
  });

  it("17. resend clears stale entered OTP and creates a new active verificationId", async () => {
    vi.useFakeTimers();

    sessionStore.setUser({
      id: "usr_resend_new_id",
      phone: "081222333444",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockContactVerificationAdapter({ cooldownSeconds: 5 });
    const { container } = await renderContactVerification("ses_sgd_1", {
      adapter,
    });

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    const firstSession =
      mockOtpSessionStore.getActiveSession("usr_resend_new_id");
    expect(firstSession).toBeDefined();

    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "111111";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(otpInput.value).toBe("111111");

    // Advance cooldown timer to enable resend
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    const resendBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-resend-btn",
    )!;
    await act(async () => {
      resendBtn.click();
    });

    const secondSession =
      mockOtpSessionStore.getActiveSession("usr_resend_new_id");
    expect(secondSession).toBeDefined();
    expect(secondSession?.verificationId).not.toBe(
      firstSession?.verificationId,
    );

    // Stale OTP cleared in UI
    const refreshedOtpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    expect(refreshedOtpInput.value).toBe("");
  });

  // REAL ADAPTER TESTS (BLOCKER 1, 6, 7 & 18)
  it("18. direct adapter: random verificationId with correct OTP is rejected", async () => {
    sessionStore.setUser({ id: "usr_ad_1", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter();

    // Create session
    await adapter.requestOtp({ travelerId: "usr_ad_1", phone: "08123456789" });

    // Verify with random verificationId
    const res = await adapter.verifyOtp({
      travelerId: "usr_ad_1",
      phone: "08123456789",
      verificationId: "random_votp_fake_999",
      code: "111111",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe("STALE_SESSION");
    expect(
      mockContactVerificationStore.isPhoneVerified("usr_ad_1", "08123456789"),
    ).toBe(false);
  });

  it("19. direct adapter: wrong travelerId or wrong phone is rejected", async () => {
    sessionStore.setUser({ id: "usr_ad_2", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter();

    const sess = await adapter.requestOtp({
      travelerId: "usr_ad_2",
      phone: "08123456789",
    });

    // Wrong phone
    const resPhone = await adapter.verifyOtp({
      travelerId: "usr_ad_2",
      phone: "08999999999",
      verificationId: sess.verificationId,
      code: "111111",
    });
    expect(resPhone.success).toBe(false);
    expect(resPhone.status).toBe("STALE_SESSION");

    // Wrong traveler
    const resTrav = await adapter.verifyOtp({
      travelerId: "usr_different_attacker",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "111111",
    });
    expect(resTrav.success).toBe(false);
    expect(resTrav.status).toBe("INVALID_IDENTITY");
  });

  it("20. direct adapter: resend invalidates old verificationId", async () => {
    sessionStore.setUser({ id: "usr_ad_3", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter();

    const firstSess = await adapter.requestOtp({
      travelerId: "usr_ad_3",
      phone: "08123456789",
    });

    // Resend
    await adapter.requestOtp({
      travelerId: "usr_ad_3",
      phone: "08123456789",
    });

    // Try to verify using first verificationId
    const res = await adapter.verifyOtp({
      travelerId: "usr_ad_3",
      phone: "08123456789",
      verificationId: firstSess.verificationId,
      code: "111111",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe("STALE_SESSION");
  });

  it("21. direct adapter: invalidateOtpSession invalidates session immediately", async () => {
    sessionStore.setUser({ id: "usr_ad_4", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter();

    const sess = await adapter.requestOtp({
      travelerId: "usr_ad_4",
      phone: "08123456789",
    });

    adapter.invalidateOtpSession("usr_ad_4");

    const res = await adapter.verifyOtp({
      travelerId: "usr_ad_4",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "111111",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe("STALE_SESSION");
  });

  it("22. direct adapter: expired session is rejected", async () => {
    sessionStore.setUser({ id: "usr_ad_5", onboardingStatus: "COMPLETED" });
    // Expire immediately (0s)
    const adapter = new MockContactVerificationAdapter({ expirySeconds: -1 });

    const sess = await adapter.requestOtp({
      travelerId: "usr_ad_5",
      phone: "08123456789",
    });

    const res = await adapter.verifyOtp({
      travelerId: "usr_ad_5",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "111111",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe("EXPIRED");
  });

  it("23. direct adapter: successful verify consumes session so it cannot verify twice", async () => {
    sessionStore.setUser({ id: "usr_ad_6", onboardingStatus: "COMPLETED" });
    const adapter = new MockContactVerificationAdapter();

    const sess = await adapter.requestOtp({
      travelerId: "usr_ad_6",
      phone: "08123456789",
    });

    const res1 = await adapter.verifyOtp({
      travelerId: "usr_ad_6",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "111111",
    });
    expect(res1.success).toBe(true);

    // Second verify with same session ID fails
    const res2 = await adapter.verifyOtp({
      travelerId: "usr_ad_6",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "111111",
    });
    expect(res2.success).toBe(false);
    expect(res2.status).toBe("STALE_SESSION");
  });

  it("23b. direct adapter: default demo OTP 111111 succeeds and 123456 fails as INVALID_CODE", async () => {
    sessionStore.setUser({
      id: "usr_ad_otp_check",
      onboardingStatus: "COMPLETED",
    });
    const adapter = new MockContactVerificationAdapter();

    const sess = await adapter.requestOtp({
      travelerId: "usr_ad_otp_check",
      phone: "08123456789",
    });

    // Old demo OTP 123456 must be rejected as INVALID_CODE
    const failRes = await adapter.verifyOtp({
      travelerId: "usr_ad_otp_check",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "123456",
    });
    expect(failRes.success).toBe(false);
    expect(failRes.status).toBe("INVALID_CODE");
    expect(
      mockContactVerificationStore.isPhoneVerified(
        "usr_ad_otp_check",
        "08123456789",
      ),
    ).toBe(false);

    // Active session still intact, new demo OTP 111111 succeeds
    const successRes = await adapter.verifyOtp({
      travelerId: "usr_ad_otp_check",
      phone: "08123456789",
      verificationId: sess.verificationId,
      code: "111111",
    });
    expect(successRes.success).toBe(true);
    expect(successRes.status).toBe("SUCCESS");
    expect(
      mockContactVerificationStore.isPhoneVerified(
        "usr_ad_otp_check",
        "08123456789",
      ),
    ).toBe(true);
  });

  it("24. direct adapter: arbitrary unauthenticated traveler cannot request OTP", async () => {
    sessionStore.setUser(null); // No user
    const adapter = new MockContactVerificationAdapter();

    await expect(
      adapter.requestOtp({ travelerId: "usr_attacker", phone: "08123456789" }),
    ).rejects.toThrow("Identitas pengguna tidak valid");
  });

  // REQUEST / VERIFY ERROR & RETRY TESTS
  it("25. verify request failure preserves active OTP session and allows retry", async () => {
    sessionStore.setUser({
      id: "usr_v_fail",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const adapter = new MockContactVerificationAdapter({ failVerifyCount: 1 });
    const { container, getPath } = await renderContactVerification(
      "ses_sgd_1",
      {
        adapter,
      },
    );

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    // First attempt fails with network error
    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "111111";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const verifyBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      verifyBtn.click();
    });

    // First attempt fails with network error
    expect(container.textContent).toContain("Verifikasi belum bisa diproses");
    expect(mockOtpSessionStore.getActiveSession("usr_v_fail")).toBeDefined();

    // Second attempt succeeds
    await act(async () => {
      verifyBtn.click();
    });

    expect(getPath()).toBe("/checkout/ses_sgd_1");
  });

  // TRANSACTION SAFETY PROOF
  it("26. ALL T11 actions create ZERO bookings, ZERO payment attempts, and ZERO reserved quantity", async () => {
    sessionStore.setUser({
      id: "usr_tx_safety",
      phone: "081999888777",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");

    expect(mockTransactionStore.getBookings().length).toBe(0);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(0);
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    expect(mockTransactionStore.getBookings().length).toBe(0);

    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "111111";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const verifyBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      verifyBtn.click();
    });

    expect(mockTransactionStore.getBookings().length).toBe(0);
    expect(mockTransactionStore.getPaymentAttempts().length).toBe(0);
    expect(mockTransactionStore.getReservedQuantity("ses_sgd_1")).toBe(0);
  });

  // E2E T10 -> T11 -> T10 INTEGRATION
  it("27. End-to-End T10 -> T11 -> verify -> T10 shows Terverifikasi", async () => {
    const traveler: AuthUser = {
      id: "usr_e2e_contact",
      name: "E2E Traveler",
      email: "e2e@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    let currentPath = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    const checkoutAdapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
    });

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1"] },
          createElement(LocationObserver, {
            onLocation: (p) => {
              currentPath = p;
            },
          }),
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen, {
                adapter: checkoutAdapter,
              }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/contact",
              element: createElement(ContactVerificationScreen),
            }),
          ]),
        ),
      );
    });

    // Initially T10 shows "Belum Verifikasi"
    expect(container.textContent).toContain("Belum Verifikasi");

    // Click policy & submit
    const policyCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCb.click();
    });

    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    // Navigated to /checkout/ses_sgd_1/contact (T11)
    expect(currentPath).toBe("/checkout/ses_sgd_1/contact");
    expect(container.textContent).toContain("Verifikasi Nomor HP");

    // Submit phone OTP
    const reqOtpBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      reqOtpBtn.click();
    });

    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "111111";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const verifyOtpBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      verifyOtpBtn.click();
    });

    // Returned to /checkout/ses_sgd_1 (T10)
    expect(currentPath).toBe("/checkout/ses_sgd_1");
    // Now T10 renders "Terverifikasi"!
    expect(container.textContent).toContain("Terverifikasi");
  });

  // CHECKOUT DRAFT CONTINUITY ACROSS T11 (REGRESSION TESTS)
  it("29. preserves participantCount, policy acknowledgement, and idempotencyKey across T10 -> T11 -> T10 roundtrip", async () => {
    const traveler: AuthUser = {
      id: "usr_draft_cont",
      name: "Draft Traveler",
      email: "draft@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    let currentPath = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    const checkoutAdapter = new MockCheckoutAdapter({
      travelerOverride: traveler,
    });

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/checkout/ses_sgd_1"] },
          createElement(LocationObserver, {
            onLocation: (p) => {
              currentPath = p;
            },
          }),
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen, {
                adapter: checkoutAdapter,
              }),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/contact",
              element: createElement(ContactVerificationScreen),
            }),
            createElement(Route, {
              path: "/payment/:bookingId",
              element: createElement("div", undefined, "Payment Screen Target"),
            }),
          ]),
        ),
      );
    });

    // Set participantCount = 3
    const incBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Tambah jumlah peserta"]',
    )!;
    await act(async () => {
      incBtn.click();
    });
    await act(async () => {
      incBtn.click();
    });

    const quantityDisplay = container.querySelector("#participant-count-val");
    expect(quantityDisplay?.textContent).toBe("3");

    // Check policy
    const policyCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    await act(async () => {
      policyCb.click();
    });
    expect(policyCb.checked).toBe(true);

    // Click Lanjut ke Pembayaran -> goes to T11
    const ctaBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    await act(async () => {
      ctaBtn.click();
    });

    expect(currentPath).toBe("/checkout/ses_sgd_1/contact");

    // Complete T11 OTP verification
    const reqOtpBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      reqOtpBtn.click();
    });

    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "111111";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const verifyOtpBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      verifyOtpBtn.click();
    });

    // Returned to Checkout
    expect(currentPath).toBe("/checkout/ses_sgd_1");
    expect(container.textContent).toContain("Terverifikasi");

    // ASSERTION A: participantCount remains 3!
    const restoredQty = container.querySelector("#participant-count-val");
    expect(restoredQty?.textContent).toBe("3");

    // ASSERTION B: policyAcknowledged remains true!
    const restoredCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    expect(restoredCb.checked).toBe(true);

    // ASSERTION C: second submit proceeds to Payment!
    const finalCta = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Lanjut ke Pembayaran"),
    )!;
    expect(finalCta.disabled).toBe(false);

    await act(async () => {
      finalCta.click();
    });

    // Navigates away to payment!
    expect(currentPath).toMatch(/^\/payment\/bk_/);
    expect(container.textContent).toContain("Payment Screen Target");
    expect(mockTransactionStore.getBookings().length).toBe(1);
    expect(mockTransactionStore.getBookings()[0].participantCount).toBe(3);
  });

  it("30. draft for session A does NOT hydrate session B", async () => {
    sessionStore.setUser({
      id: "usr_session_mismatch",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          {
            initialEntries: [
              {
                pathname: "/checkout/ses_sgd_2",
                state: {
                  checkoutDraft: {
                    sessionId: "ses_sgd_1", // Different session ID!
                    participantCount: 5,
                    policyAcknowledged: true,
                    idempotencyKey: "k_foreign",
                  },
                },
              },
            ],
          },
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen),
            }),
          ]),
        ),
      );
    });

    // Must NOT hydrate from mismatching session ID
    const quantityDisplay = container.querySelector("#participant-count-val");
    expect(quantityDisplay?.textContent).toBe("1");
    const policyCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    expect(policyCb.checked).toBe(false);
  });

  it("31. back button from T11 preserves supplied draft on return to Checkout", async () => {
    const traveler: AuthUser = {
      id: "usr_back_draft",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    let currentPath = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          {
            initialEntries: [
              {
                pathname: "/checkout/ses_sgd_1/contact",
                state: {
                  checkoutDraft: {
                    sessionId: "ses_sgd_1",
                    participantCount: 4,
                    policyAcknowledged: true,
                    idempotencyKey: "k_back_preserve",
                  },
                },
              },
            ],
          },
          createElement(LocationObserver, {
            onLocation: (p) => {
              currentPath = p;
            },
          }),
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/contact",
              element: createElement(ContactVerificationScreen),
            }),
          ]),
        ),
      );
    });

    // Click "Kembali ke Checkout"
    const backBtn = container.querySelector<HTMLAnchorElement>(
      ".contact-verification-back-btn",
    )!;
    await act(async () => {
      backBtn.click();
    });

    expect(currentPath).toBe("/checkout/ses_sgd_1");
    const restoredQty = container.querySelector("#participant-count-val");
    expect(restoredQty?.textContent).toBe("4");
    const restoredCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    expect(restoredCb.checked).toBe(true);
  });

  // ACCESSIBILITY & SEMANTICS
  it("32. accessible inputs, tel semantics, and one-time-code autocomplete", async () => {
    sessionStore.setUser({
      id: "usr_a11y",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");

    const phoneInput = container.querySelector<HTMLInputElement>(
      "#contact-phone-input",
    )!;
    expect(phoneInput.getAttribute("type")).toBe("tel");
    expect(phoneInput.getAttribute("inputmode")).toBe("tel");
    expect(phoneInput.getAttribute("autocomplete")).toBe("tel");

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    expect(otpInput.getAttribute("inputmode")).toBe("numeric");
    expect(otpInput.getAttribute("autocomplete")).toBe("one-time-code");
  });

  // DEMO SKIP (PROTOTYPE/DEMO SHORTCUT)
  it("33. renders secondary 'Lewati untuk Demo' action with explanatory copy on phone entry and OTP entry", async () => {
    sessionStore.setUser({
      id: "usr_demo_skip_render",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");

    // Primary and secondary actions present in phone entry state
    expect(container.textContent).toContain("Kirim Kode OTP");
    const skipBtnPhone = container.querySelector<HTMLButtonElement>(
      ".contact-verification-demo-skip-btn",
    );
    expect(skipBtnPhone).not.toBeNull();
    expect(skipBtnPhone?.textContent).toContain("Lewati untuk Demo");
    expect(container.textContent).toContain(
      "Untuk demo, verifikasi nomor dapat dilewati.",
    );

    // Transition to OTP state
    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain("Verifikasi & Lanjut");
    const skipBtnOtp = container.querySelector<HTMLButtonElement>(
      ".contact-verification-demo-skip-btn",
    );
    expect(skipBtnOtp).not.toBeNull();
    expect(skipBtnOtp?.textContent).toContain("Lewati untuk Demo");
  });

  it("34. 'Lewati untuk Demo' returns traveler to same checkout flow preserving draft without marking phone verified or creating fake records", async () => {
    const traveler: AuthUser = {
      id: "usr_demo_skip_flow",
      name: "Demo Skip Traveler",
      email: "demoskip@example.com",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    let currentPath = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          {
            initialEntries: [
              {
                pathname: "/checkout/ses_sgd_1/contact",
                state: {
                  checkoutDraft: {
                    sessionId: "ses_sgd_1",
                    participantCount: 2,
                    policyAcknowledged: true,
                    idempotencyKey: "k_demo_skip",
                  },
                },
              },
            ],
          },
          createElement(LocationObserver, {
            onLocation: (p) => {
              currentPath = p;
            },
          }),
          createElement(Routes, undefined, [
            createElement(Route, {
              path: "/checkout/:sessionId",
              element: createElement(CheckoutScreen),
            }),
            createElement(Route, {
              path: "/checkout/:sessionId/contact",
              element: createElement(ContactVerificationScreen),
            }),
          ]),
        ),
      );
    });

    const skipBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-demo-skip-btn",
    )!;
    expect(skipBtn).not.toBeNull();

    await act(async () => {
      skipBtn.click();
    });

    // 1. Returns traveler to same checkout route
    expect(currentPath).toBe("/checkout/ses_sgd_1");

    // 2. Preserves matching checkout draft
    const restoredQty = container.querySelector("#participant-count-val");
    expect(restoredQty?.textContent).toBe("2");
    const restoredCb = container.querySelector<HTMLInputElement>(
      "#cancellation-policy-ack",
    )!;
    expect(restoredCb.checked).toBe(true);

    // 3. Does NOT mark phone as verified
    expect(
      mockContactVerificationStore.isPhoneVerified(
        "usr_demo_skip_flow",
        "08123456789",
      ),
    ).toBe(false);

    // 4. Does NOT create fake OTP session records
    expect(
      mockOtpSessionStore.getActiveSession("usr_demo_skip_flow"),
    ).toBeUndefined();

    // 5. Still renders "Belum Verifikasi" in Checkout
    expect(container.textContent).toContain("Belum Verifikasi");
  });
});
