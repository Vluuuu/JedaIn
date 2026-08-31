// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MockAuthAdapter } from "./mockAdapter";
import { TravelerLoginScreen } from "./TravelerLoginScreen";
import type { AuthUser } from "./types";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
});

async function renderScreen(
  props: {
    adapter?: MockAuthAdapter;
    onSuccess?: (user: AuthUser, redirectPath: string) => void;
    enableEmailAuth?: boolean;
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
        createElement(TravelerLoginScreen, props),
      ),
    ),
  );
  return container;
}

describe("TravelerLoginScreen UI & Auth Flows", () => {
  it("renders Google primary action, phone OTP input, and partner secondary link without guest button", async () => {
    const view = await renderScreen();

    expect(view.textContent).toContain("Masuk atau mulai perjalananmu");
    expect(view.textContent).toContain("Lanjut dengan Google");
    expect(view.querySelector('input[type="tel"]')).not.toBeNull();
    expect(view.textContent).toContain("Masuk sebagai Partner");
    expect(view.textContent).not.toContain("Tamu");
    expect(view.textContent).not.toContain("Guest");
  });

  it("handles Google OAuth success and triggers onboarding redirect for new user", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: { isNewUser: true, onboardingStatus: "NOT_STARTED" },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const googleBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut dengan Google"),
    )!;

    await act(() => googleBtn.click());

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ isNewUser: true }),
      "/onboarding/consent",
    );
  });

  it("routes existing completed user to /home on Google login", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: { isNewUser: false, onboardingStatus: "COMPLETED" },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const googleBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut dengan Google"),
    )!;

    await act(() => googleBtn.click());

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingStatus: "COMPLETED" }),
      "/home",
    );
  });

  it("handles recoverable error without clearing phone input", async () => {
    const adapter = new MockAuthAdapter({
      shouldFailPhoneRequest: true,
      errorMessage: "Jaringan bermasalah, silakan coba lagi.",
    });

    const view = await renderScreen({ adapter });
    const phoneInput =
      view.querySelector<HTMLInputElement>('input[type="tel"]')!;

    await act(() => {
      phoneInput.value = "081299887766";
      phoneInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const form = view.querySelector<HTMLFormElement>(
      'form[aria-label="Masuk dengan nomor HP"]',
    )!;
    await act(() => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(view.textContent).toContain(
      "Jaringan bermasalah, silakan coba lagi.",
    );
    expect(phoneInput.value).toBe("081299887766");
  });

  it("executes full Phone OTP flow: request -> enter OTP -> verify -> redirect", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: { isNewUser: false, onboardingStatus: "IN_PROGRESS" },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const phoneInput =
      view.querySelector<HTMLInputElement>('input[type="tel"]')!;

    await act(() => {
      phoneInput.value = "081234567890";
      phoneInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const reqForm = view.querySelector<HTMLFormElement>(
      'form[aria-label="Masuk dengan nomor HP"]',
    )!;
    await act(() => {
      reqForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    // Verify OTP_SENT state UI is rendered
    expect(view.textContent).toContain("081234567890");
    expect(
      view.querySelector('input[autoComplete="one-time-code"]'),
    ).not.toBeNull();

    const otpInput = view.querySelector<HTMLInputElement>(
      'input[autoComplete="one-time-code"]',
    )!;
    await act(() => {
      otpInput.value = "123456";
      otpInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const verifyForm = view.querySelector<HTMLFormElement>(
      'form[aria-label="Verifikasi kode OTP"]',
    )!;
    await act(() => {
      verifyForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingStatus: "IN_PROGRESS" }),
      "/onboarding/quiz",
    );
  });

  it("shows email magic link only when enableEmailAuth is true", async () => {
    const viewDefault = await renderScreen({ enableEmailAuth: false });
    expect(viewDefault.querySelector('input[type="email"]')).toBeNull();

    await act(() => root.unmount());

    const viewWithEmail = await renderScreen({ enableEmailAuth: true });
    expect(viewWithEmail.querySelector('input[type="email"]')).not.toBeNull();
  });
});
