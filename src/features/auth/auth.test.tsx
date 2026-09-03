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

  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
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
  it("renders SIGN IN / SIGN UP tabs, Email, Password, and Google social login without Apple or Guest button", async () => {
    const view = await renderScreen();

    // Check tabs
    expect(view.querySelector("#tab-sign-in")).not.toBeNull();
    expect(view.querySelector("#tab-sign-up")).not.toBeNull();
    expect(view.textContent).toContain("SIGN IN");
    expect(view.textContent).toContain("SIGN UP");

    // Check fields
    expect(view.querySelector('input[name="email"]')).not.toBeNull();
    expect(view.querySelector('input[name="password"]')).not.toBeNull();

    // Check forgot password action
    expect(view.querySelector(".auth-forgot-link")).not.toBeNull();
    expect(view.querySelector(".auth-forgot-link")?.textContent).toBe(
      "Forgot password?",
    );

    // Check primary button & divider
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "SIGN IN",
    );
    expect(view.textContent).toContain("or continue with");

    // Check social login: Google only, NO Apple
    expect(view.textContent).toContain("Continue with Google");
    expect(view.textContent).not.toContain("Apple");
    expect(view.textContent).not.toContain("Continue with Apple");
    expect(view.textContent).not.toContain("Tamu");
    expect(view.textContent).not.toContain("Guest");

    // Check bottom prompt
    expect(view.textContent).toContain("Don't have an account?");
    expect(view.textContent).toContain("Sign up");
  });

  it("handles Google OAuth success and triggers onboarding redirect for new user", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: { isNewUser: true, onboardingStatus: "NOT_STARTED" },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const googleBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Continue with Google"),
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
      b.textContent?.includes("Continue with Google"),
    )!;

    await act(() => googleBtn.click());

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingStatus: "COMPLETED" }),
      "/home",
    );
  });

  it("handles OAuth cancellation gracefully without rendering catastrophic error banner", async () => {
    const adapter = new MockAuthAdapter({
      shouldCancelGoogle: true,
    });

    const view = await renderScreen({ adapter });
    const googleBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Continue with Google"),
    )!;

    await act(() => googleBtn.click());

    expect(view.querySelector('[role="alert"]')).toBeNull();
    expect(view.textContent).not.toContain("Failed to sign in with Google");
  });

  it("executes email and password sign in flow successfully", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: {
        id: "usr_email_123",
        isNewUser: false,
        onboardingStatus: "IN_PROGRESS",
      },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const emailInput = view.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    const passwordInput = view.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )!;

    await act(() => {
      emailInput.value = "user@example.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      passwordInput.value = "validpass123";
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const form = view.querySelector<HTMLFormElement>(".auth-form")!;
    await act(() => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingStatus: "IN_PROGRESS" }),
      "/onboarding/quiz",
    );
  });

  it("handles password login failure with clear error message", async () => {
    const adapter = new MockAuthAdapter({
      shouldFailPasswordLogin: true,
      errorMessage: "Invalid email or password.",
    });

    const view = await renderScreen({ adapter });
    const emailInput = view.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    const passwordInput = view.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )!;

    await act(() => {
      emailInput.value = "user@example.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      passwordInput.value = "wrongpass";
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const form = view.querySelector<HTMLFormElement>(".auth-form")!;
    await act(() => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    const errorAlert = view.querySelector('[role="alert"]');
    expect(errorAlert?.textContent).toContain("Invalid email or password.");
  });

  it("toggles between SIGN IN and SIGN UP tabs and updates UI copy accordingly", async () => {
    const view = await renderScreen();

    const signInTab = view.querySelector<HTMLButtonElement>("#tab-sign-in")!;
    const signUpTab = view.querySelector<HTMLButtonElement>("#tab-sign-up")!;

    expect(signInTab.getAttribute("aria-selected")).toBe("true");
    expect(signUpTab.getAttribute("aria-selected")).toBe("false");
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "SIGN IN",
    );
    expect(view.querySelector(".auth-forgot-link")).not.toBeNull();
    expect(view.textContent).toContain("Don't have an account?");

    // Click SIGN UP
    await act(() => signUpTab.click());

    expect(signInTab.getAttribute("aria-selected")).toBe("false");
    expect(signUpTab.getAttribute("aria-selected")).toBe("true");
    expect(view.querySelector('input[name="name"]')).not.toBeNull();
    expect(view.querySelector('input[name="confirmPassword"]')).not.toBeNull();
    expect(view.textContent).toContain("Confirm your password");
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "SIGN UP",
    );
    expect(view.querySelector(".auth-forgot-link")).toBeNull();
    expect(view.textContent).toContain("Already have an account? Sign in");

    // Click bottom switch link to switch back to SIGN IN
    const switchBtn = view.querySelector<HTMLButtonElement>(
      ".auth-switch-action",
    )!;
    await act(() => switchBtn.click());

    expect(signInTab.getAttribute("aria-selected")).toBe("true");
    expect(signUpTab.getAttribute("aria-selected")).toBe("false");
    expect(view.querySelector('input[name="name"]')).toBeNull();
    expect(view.querySelector('input[name="confirmPassword"]')).toBeNull();
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "SIGN IN",
    );
  });

  it("handles password signup flow and confirms matching passwords", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: {
        id: "usr_new_123",
        isNewUser: true,
        onboardingStatus: "NOT_STARTED",
      },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const signUpTab = view.querySelector<HTMLButtonElement>("#tab-sign-up")!;
    await act(() => signUpTab.click());

    const nameInput =
      view.querySelector<HTMLInputElement>('input[name="name"]')!;
    const emailInput = view.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    const passwordInput = view.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )!;
    const confirmPasswordInput = view.querySelector<HTMLInputElement>(
      'input[name="confirmPassword"]',
    )!;

    // Test mismatched passwords
    await act(() => {
      nameInput.value = "John Doe";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      emailInput.value = "john@example.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      passwordInput.value = "secret123";
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
      confirmPasswordInput.value = "secret999";
      confirmPasswordInput.dispatchEvent(new Event("input", { bubbles: true }));
      confirmPasswordInput.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
    });

    const form = view.querySelector<HTMLFormElement>(".auth-form")!;
    await act(() => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(view.querySelector('[role="alert"]')?.textContent).toContain(
      "Password and Confirm Password do not match",
    );
    expect(onSuccess).not.toHaveBeenCalled();

    // Fix confirm password to match
    await act(() => {
      nameInput.value = "John Doe";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      emailInput.value = "john@example.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      passwordInput.value = "secret123";
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
      confirmPasswordInput.value = "secret123";
      confirmPasswordInput.dispatchEvent(new Event("input", { bubbles: true }));
      confirmPasswordInput.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
    });

    await act(() => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ isNewUser: true, name: "John Doe" }),
      "/onboarding/consent",
    );
  });

  it("opens Forgot Password modal when clicking forgot password link", async () => {
    const view = await renderScreen();

    const forgotLink =
      view.querySelector<HTMLButtonElement>(".auth-forgot-link")!;
    await act(() => forgotLink.click());

    expect(view.querySelector("dialog[open]")).not.toBeNull();
    expect(view.textContent).toContain("Password recovery functionality");
  });

  it("toggles password visibility with eye icon button", async () => {
    const view = await renderScreen();

    const passwordInput = view.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )!;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = view.querySelector<HTMLButtonElement>(
      ".auth-password-toggle",
    )!;
    await act(() => toggleBtn.click());

    expect(passwordInput.type).toBe("text");

    await act(() => toggleBtn.click());
    expect(passwordInput.type).toBe("password");
  });
});
