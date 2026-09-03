// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TravelerConsentScreen } from "./TravelerConsentScreen";
import { MockOnboardingAdapter } from "./mockAdapter";

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

async function renderConsent(
  props: {
    adapter?: MockOnboardingAdapter;
    onSuccess?: () => void;
    onBack?: () => void;
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
        createElement(TravelerConsentScreen, props),
      ),
    ),
  );
  return container;
}

describe("TravelerConsentScreen UI & State Transitions", () => {
  it("renders with checkbox unchecked and primary CTA disabled initially", async () => {
    const view = await renderConsent();

    const checkbox = view.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!;
    const submitBtn = view.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;

    expect(checkbox.checked).toBe(false);
    expect(submitBtn.disabled).toBe(true);
    expect(view.textContent).toContain("Kenali jeda yang cocok untukmu");
    expect(view.textContent).toContain("Rekomendasi Personal");
    expect(view.textContent).toContain("Wawasan Kebutuhan");
    expect(view.textContent).toContain("Pengembangan JedaIn");
    expect(view.textContent).toContain("SETUJU & LANJUT");
  });

  it("enables primary CTA when consent checkbox is checked and submits successfully", async () => {
    const onSuccess = vi.fn();
    const adapter = new MockOnboardingAdapter();

    const view = await renderConsent({ adapter, onSuccess });
    const checkbox = view.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!;

    await act(() => {
      checkbox.click();
    });

    const submitBtn = view.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    expect(checkbox.checked).toBe(true);
    expect(submitBtn.disabled).toBe(false);

    await act(() => {
      submitBtn.click();
    });

    expect(onSuccess).toHaveBeenCalledOnce();
    const state = await adapter.getOnboardingState();
    expect(state.status).toBe("IN_PROGRESS");
    expect(state.hasConsent).toBe(true);
  });

  it("handles recoverable submit error by keeping checkbox checked and allowing retry", async () => {
    const adapter = new MockOnboardingAdapter({
      shouldFailConsent: true,
      errorMessage: "Gagal menyimpan persetujuan data. Silakan coba lagi.",
    });

    const view = await renderConsent({ adapter });
    const checkbox = view.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!;

    await act(() => {
      checkbox.click();
    });

    const submitBtn = view.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    expect(submitBtn.disabled).toBe(false);

    await act(() => {
      submitBtn.click();
    });

    expect(view.textContent).toContain(
      "Gagal menyimpan persetujuan data. Silakan coba lagi.",
    );
    // Crucial requirement: checkbox remains checked after recoverable error
    expect(checkbox.checked).toBe(true);
    expect(submitBtn.disabled).toBe(false);
  });

  it("opens and closes the privacy detail dialog accessible summary without unsupported claims", async () => {
    const view = await renderConsent();
    const privacyBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Pelajari rincian penggunaan data"),
    )!;

    await act(() => {
      privacyBtn.click();
    });

    expect(view.textContent).toContain("Penggunaan Data Preferensi");
    expect(view.textContent).toContain("Rekomendasi personal:");
    expect(view.textContent).toContain("Wawasan kebutuhan agregat:");
    expect(view.textContent).toContain("Penyempurnaan layanan:");

    const closeBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Mengerti"),
    )!;

    await act(() => {
      closeBtn.click();
    });

    expect(view.querySelector("dialog[open]")).toBeNull();
  });
});
