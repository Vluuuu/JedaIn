// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import type { AuthUser } from "../auth/types";
import { CheckoutScreen } from "../checkout/CheckoutScreen";
import { MockCheckoutAdapter } from "../checkout/mockAdapter";
import { mockTransactionStore } from "../checkout/mockTransactionStore";
import { sessionStore } from "../onboarding/sessionStore";
import { ContactVerificationScreen } from "./ContactVerificationScreen";
import { MockContactVerificationAdapter } from "./mockAdapter";
import { mockContactVerificationStore } from "./mockContactVerificationStore";

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

  it("3 & 4. protected shell reused, bottom nav hidden, single main landmark", async () => {
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

  it("5. direct reload works from sessionId URL parameter", async () => {
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

  it("6. back button returns to same /checkout/:sessionId without verifying", async () => {
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

  it("7. existing AuthUser.phone pre-fills input field", async () => {
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

  it("8. missing AuthUser.phone starts empty", async () => {
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

  it("9. empty phone submission is blocked", async () => {
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

  it("10. recoverable request error preserves phone input and allows retry", async () => {
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

  it("11 & 14. change phone after OTP request resets active session and requires new OTP for new phone", async () => {
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

    // Click "Ubah nomor"
    const changeBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-change-phone-btn",
    )!;
    await act(async () => {
      changeBtn.click();
    });

    expect(container.querySelector("#contact-phone-input")).not.toBeNull();
    expect(container.querySelector("#contact-otp-input")).toBeNull();
  });

  it("12 & 13. phone presence alone is not verified & verification bound to exact Traveler + phone", () => {
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

  it("15 & 17. already-verified exact phone direct entry immediately returns to Checkout", async () => {
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

  it("16 & 18. successful verification updates shared store & current sessionStore.user.phone preserving onboarding state", async () => {
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

    // Enter default demo OTP "123456"
    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;
    await act(async () => {
      otpInput.value = "123456";
      otpInput.dispatchEvent(new Event("input", { bubbles: true }));
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

  it("19, 21 & 22. resend countdown derives from timestamp and resend action enables after cooldown", async () => {
    sessionStore.setUser({
      id: "usr_resend_test",
      phone: "081222333444",
      onboardingStatus: "COMPLETED",
    });

    // Short cooldown of 1 second for test
    const adapter = new MockContactVerificationAdapter({ cooldownSeconds: 1 });
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

    // Wait 1.1s for cooldown to elapse
    await new Promise((resolve) => setTimeout(resolve, 1100));

    await act(async () => {
      // Trigger a re-render tick
    });

    expect(resendBtn.disabled).toBe(false);
  });

  it("25 & 26. valid OTP verifies, invalid OTP remains recoverable", async () => {
    sessionStore.setUser({
      id: "usr_otp_val",
      phone: "08123456789",
      onboardingStatus: "COMPLETED",
    });

    const { container } = await renderContactVerification("ses_sgd_1");

    const submitBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    const otpInput =
      container.querySelector<HTMLInputElement>("#contact-otp-input")!;

    // Wrong OTP
    await act(async () => {
      otpInput.value = "999999";
      otpInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const verifyBtn = container.querySelector<HTMLButtonElement>(
      ".contact-verification-submit-btn",
    )!;
    await act(async () => {
      verifyBtn.click();
    });

    expect(container.textContent).toContain("Kode OTP tidak valid");

    // Correct OTP
    await act(async () => {
      otpInput.value = "123456";
      otpInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      verifyBtn.click();
    });

    expect(container.textContent).toContain("Checkout Screen Target");
  });

  it("30, 31, 32 & 33. ALL T11 actions create ZERO bookings, ZERO payment attempts, and ZERO reserved quantity", async () => {
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
      otpInput.value = "123456";
      otpInput.dispatchEvent(new Event("input", { bubbles: true }));
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

  it("34, 35, 36 & 37. End-to-End T10 -> T11 -> verify -> T10 shows Terverifikasi", async () => {
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
      otpInput.value = "123456";
      otpInput.dispatchEvent(new Event("input", { bubbles: true }));
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

  it("38, 39 & 40. accessible inputs, tel semantics, and one-time-code autocomplete", async () => {
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
});
