// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { sessionStore } from "./sessionStore";

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

async function renderAppAt(path: string) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(App),
      ),
    ),
  );
  return container;
}

describe("Integration Onboarding Route Guard Real Navigation", () => {
  it("redirects NOT_STARTED traveler trying to access /home to /onboarding/consent", async () => {
    sessionStore.setOnboardingStatus("NOT_STARTED");
    const view = await renderAppAt("/home");

    expect(view.textContent).toContain(
      "Persetujuan Penggunaan Data Preferensi",
    );
    expect(view.querySelector(".traveler-bottom-nav")).toBeNull();
  });

  it("redirects NOT_STARTED traveler trying to access /onboarding/quiz to /onboarding/consent", async () => {
    sessionStore.setOnboardingStatus("NOT_STARTED");
    const view = await renderAppAt("/onboarding/quiz");

    expect(view.textContent).toContain(
      "Persetujuan Penggunaan Data Preferensi",
    );
  });

  it("redirects IN_PROGRESS traveler trying to access /home to /onboarding/quiz", async () => {
    sessionStore.setOnboardingStatus("IN_PROGRESS");
    const view = await renderAppAt("/home");

    expect(view.textContent).toContain("Quiz");
    expect(view.textContent).not.toContain(
      "Persetujuan Penggunaan Data Preferensi",
    );
  });

  it("redirects COMPLETED traveler trying to access /onboarding/consent to /home", async () => {
    sessionStore.setOnboardingStatus("COMPLETED");
    const view = await renderAppAt("/onboarding/consent");

    expect(view.textContent).toContain("Home");
    expect(view.textContent).not.toContain(
      "Persetujuan Penggunaan Data Preferensi",
    );
  });

  it("allows COMPLETED traveler to directly access /home", async () => {
    sessionStore.setOnboardingStatus("COMPLETED");
    const view = await renderAppAt("/home");

    expect(view.querySelector(".traveler-app-shell")).not.toBeNull();
    expect(view.textContent).toContain("Home");
  });
});
