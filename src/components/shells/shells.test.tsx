// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { TravelerAppShell } from "./TravelerAppShell";
import { WorkspaceShell } from "./WorkspaceShell";
import { partnerEoNavigation } from "./navigation";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
});

async function renderWorkspace() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(
        MemoryRouter,
        undefined,
        createElement(WorkspaceShell, {
          surface: "partner",
          title: "Partner workspace",
          navigation: partnerEoNavigation,
          children: createElement("p", undefined, "Content"),
        }),
      ),
    ),
  );
  return container;
}

describe("responsive workspace navigation semantics", () => {
  it("opens the drawer and exposes its expanded state", async () => {
    const view = await renderWorkspace();
    const openButton = view.querySelector<HTMLButtonElement>(
      '.workspace-topbar__menu[aria-label="Buka navigasi"]',
    )!;

    expect(openButton.getAttribute("aria-expanded")).toBe("false");
    await act(() => openButton.click());

    expect(openButton.getAttribute("aria-expanded")).toBe("true");
    expect(
      view.querySelector(".workspace-sidebar")?.hasAttribute("data-open"),
    ).toBe(true);
  });

  it("closes the drawer with Escape and restores menu focus", async () => {
    const view = await renderWorkspace();
    const openButton = view.querySelector<HTMLButtonElement>(
      '.workspace-topbar__menu[aria-label="Buka navigasi"]',
    )!;
    await act(() => openButton.click());
    await act(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );

    expect(openButton.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(openButton);
  });

  it("closes the drawer on scrim click and restores menu focus", async () => {
    const view = await renderWorkspace();
    const openButton = view.querySelector<HTMLButtonElement>(
      '.workspace-topbar__menu[aria-label="Buka navigasi"]',
    )!;
    await act(() => openButton.click());

    const scrim = view.querySelector<HTMLButtonElement>(
      '.workspace-shell__scrim[aria-label="Tutup navigasi"]',
    )!;
    expect(scrim.hasAttribute("data-open")).toBe(true);

    await act(() => scrim.click());

    expect(openButton.getAttribute("aria-expanded")).toBe("false");
    expect(
      view.querySelector(".workspace-sidebar")?.hasAttribute("data-open"),
    ).toBe(false);
    expect(document.activeElement).toBe(openButton);
  });
});

describe("TravelerAppShell notification affordance", () => {
  it("renders bell button with proper accessible label and no dot when no unread", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          undefined,
          createElement(TravelerAppShell, {
            hasUnreadNotification: false,
          }),
        ),
      ),
    );

    const btn = container.querySelector<HTMLButtonElement>(
      ".traveler-app-header__notification-btn",
    );
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-label")).toBe("Notifikasi");
    expect(
      container.querySelector(".traveler-app-header__notification-dot"),
    ).toBeNull();
  });

  it("renders bell button with unread label and red dot when has unread", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          undefined,
          createElement(TravelerAppShell, {
            hasUnreadNotification: true,
          }),
        ),
      ),
    );

    const btn = container.querySelector<HTMLButtonElement>(
      ".traveler-app-header__notification-btn",
    );
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-label")).toBe(
      "Notifikasi, ada notifikasi baru",
    );
    expect(
      container.querySelector(".traveler-app-header__notification-dot"),
    ).not.toBeNull();
  });
});
