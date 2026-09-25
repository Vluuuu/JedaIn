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
  it("renders Masuk / Daftar tabs, Email, Kata Sandi, Google social login, and demo guest entry", async () => {
    const view = await renderScreen();

    // Check tabs
    expect(view.querySelector("#tab-sign-in")).not.toBeNull();
    expect(view.querySelector("#tab-sign-up")).not.toBeNull();
    expect(view.textContent).toContain("Masuk");
    expect(view.textContent).toContain("Daftar");

    // Assert prominent old English judge-facing copy is ABSENT
    expect(view.textContent).not.toContain("SIGN IN");
    expect(view.textContent).not.toContain("SIGN UP");
    expect(view.textContent).not.toContain("Forgot password?");
    expect(view.textContent).not.toContain("Continue with Google");
    expect(view.textContent).not.toContain("Don't have an account?");

    // Check fields
    expect(view.querySelector('input[name="email"]')).not.toBeNull();
    expect(view.querySelector('input[name="password"]')).not.toBeNull();
    expect(view.textContent).toContain("Kata Sandi");

    // Check forgot password action
    expect(view.querySelector(".auth-forgot-link")).not.toBeNull();
    expect(view.querySelector(".auth-forgot-link")?.textContent).toBe(
      "Lupa kata sandi?",
    );

    // Check primary button & divider
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "Masuk ke Akun",
    );
    expect(view.textContent).toContain("atau lanjutkan dengan");

    // Check social login: Google only, NO Apple
    expect(view.textContent).toContain("Masuk dengan Google");
    expect(view.textContent).not.toContain("Apple");
    expect(view.textContent).not.toContain("Continue with Apple");

    // Check demo guest shortcut
    expect(view.textContent).toContain("Lanjut sebagai Tamu");
    expect(view.textContent).toContain(
      "Mode demo · preferensimu hanya digunakan untuk sesi ini",
    );

    // Check bottom prompt
    expect(view.textContent).toContain("Belum punya akun?");
    expect(view.textContent).toContain("Daftar sekarang");

    // Check footer links
    expect(view.textContent).toContain("Syarat & Ketentuan");
    expect(view.textContent).toContain("Kebijakan Privasi");
    expect(view.textContent).toContain("Portal Mitra & EO");
  });

  it("handles Demo Guest Entry and leads traveler to onboarding consent / preference flow", async () => {
    const onSuccess = vi.fn();
    const view = await renderScreen({ onSuccess });

    const guestBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Lanjut sebagai Tamu"),
    )!;
    expect(guestBtn).not.toBeNull();

    await act(() => guestBtn.click());

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        isNewUser: true,
        name: "Tamu Jeda",
        onboardingStatus: "NOT_STARTED",
      }),
      "/onboarding/consent",
    );
  });

  it("handles Google OAuth success and triggers onboarding redirect for new user", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockAuthAdapter({
      mockUser: { isNewUser: true, onboardingStatus: "NOT_STARTED" },
    });

    const view = await renderScreen({ adapter, onSuccess });
    const googleBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Masuk dengan Google"),
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
      b.textContent?.includes("Masuk dengan Google"),
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
      b.textContent?.includes("Masuk dengan Google"),
    )!;

    await act(() => googleBtn.click());

    expect(view.querySelector('[role="alert"]')).toBeNull();
    expect(view.textContent).not.toContain("Gagal masuk dengan Google");
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

  it("toggles between Masuk and Daftar tabs and updates UI copy accordingly", async () => {
    const view = await renderScreen();

    const signInTab = view.querySelector<HTMLButtonElement>("#tab-sign-in")!;
    const signUpTab = view.querySelector<HTMLButtonElement>("#tab-sign-up")!;

    expect(signInTab.getAttribute("aria-selected")).toBe("true");
    expect(signUpTab.getAttribute("aria-selected")).toBe("false");
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "Masuk ke Akun",
    );
    expect(view.querySelector(".auth-forgot-link")).not.toBeNull();
    expect(view.textContent).toContain("Belum punya akun?");

    // Click Daftar
    await act(() => signUpTab.click());

    expect(signInTab.getAttribute("aria-selected")).toBe("false");
    expect(signUpTab.getAttribute("aria-selected")).toBe("true");
    expect(view.querySelector('input[name="name"]')).not.toBeNull();
    expect(view.querySelector('input[name="confirmPassword"]')).not.toBeNull();
    expect(view.textContent).toContain("Konfirmasi Kata Sandi");
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "Daftar Akun Baru",
    );
    expect(view.querySelector(".auth-forgot-link")).toBeNull();
    expect(view.textContent).toContain("Sudah punya akun? Masuk");

    // Click bottom switch link to switch back to Masuk
    const switchBtn = view.querySelector<HTMLButtonElement>(
      ".auth-switch-action",
    )!;
    await act(() => switchBtn.click());

    expect(signInTab.getAttribute("aria-selected")).toBe("true");
    expect(signUpTab.getAttribute("aria-selected")).toBe("false");
    expect(view.querySelector('input[name="name"]')).toBeNull();
    expect(view.querySelector('input[name="confirmPassword"]')).toBeNull();
    expect(view.querySelector('button[type="submit"]')?.textContent).toBe(
      "Masuk ke Akun",
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
      "Kata sandi dan konfirmasi kata sandi tidak cocok",
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
    expect(view.textContent).toContain(
      "Fitur pemulihan kata sandi belum diaktifkan",
    );
  });

  it("opens Terms & Conditions modal and Privacy Policy modal with localized Indonesian copy", async () => {
    const view = await renderScreen();

    const termsBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".auth-sub-link"),
    ).find((b) => b.textContent?.includes("Syarat & Ketentuan"))!;
    expect(termsBtn).toBeDefined();
    await act(() => termsBtn.click());
    expect(view.querySelector("dialog[open]")).not.toBeNull();
    expect(view.textContent).toContain(
      "Syarat & Ketentuan lengkap belum menjadi bagian dari prototipe",
    );

    const closeBtn = Array.from(view.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Tutup",
    )!;
    await act(() => closeBtn.click());
    expect(view.querySelector("dialog[open]")).toBeNull();

    const privacyBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".auth-sub-link"),
    ).find((b) => b.textContent?.includes("Kebijakan Privasi"))!;
    expect(privacyBtn).toBeDefined();
    await act(() => privacyBtn.click());
    expect(view.querySelector("dialog[open]")).not.toBeNull();
    expect(view.textContent).toContain(
      "data preferensi digunakan untuk mendukung alur rekomendasi",
    );
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
