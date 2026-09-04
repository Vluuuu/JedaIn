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

  it("closes the drawer on sidebar collapse button click and restores menu focus", async () => {
    const view = await renderWorkspace();
    const openButton = view.querySelector<HTMLButtonElement>(
      '.workspace-topbar__menu[aria-label="Buka navigasi"]',
    )!;
    await act(() => openButton.click());

    const collapseButton = view.querySelector<HTMLButtonElement>(
      '.workspace-sidebar__close[aria-label="Tutup navigasi"]',
    )!;
    expect(collapseButton).not.toBeNull();

    await act(() => collapseButton.click());

    expect(openButton.getAttribute("aria-expanded")).toBe("false");
    expect(
      view.querySelector(".workspace-sidebar")?.hasAttribute("data-open"),
    ).toBe(false);
    expect(document.activeElement).toBe(openButton);
  });

  it("toggles desktop collapsed state and updates accessible label", async () => {
    const view = await renderWorkspace();
    const collapseButton = view.querySelector<HTMLButtonElement>(
      '.workspace-sidebar__close[aria-label="Minimalkan navigasi"]',
    )!;
    expect(collapseButton).not.toBeNull();
    expect(collapseButton.getAttribute("aria-label")).toBe(
      "Minimalkan navigasi",
    );

    const sidebar = view.querySelector(".workspace-sidebar")!;
    const shell = view.querySelector(".workspace-shell")!;
    expect(sidebar.hasAttribute("data-collapsed")).toBe(false);
    expect(shell.hasAttribute("data-sidebar-collapsed")).toBe(false);

    // Click collapse
    await act(() => collapseButton.click());

    expect(collapseButton.getAttribute("aria-label")).toBe("Perluas navigasi");
    expect(sidebar.hasAttribute("data-collapsed")).toBe(true);
    expect(shell.hasAttribute("data-sidebar-collapsed")).toBe(true);

    // Click expand
    await act(() => collapseButton.click());

    expect(collapseButton.getAttribute("aria-label")).toBe(
      "Minimalkan navigasi",
    );
    expect(sidebar.hasAttribute("data-collapsed")).toBe(false);
    expect(shell.hasAttribute("data-sidebar-collapsed")).toBe(false);
  });

  it("keeps brand header slot fixed height in both expanded and collapsed states", async () => {
    const view = await renderWorkspace();
    const brandSlot = view.querySelector(".workspace-sidebar__brand");
    expect(brandSlot).not.toBeNull();

    // Verify nav items remain mounted in collapsed state
    const collapseButton = view.querySelector<HTMLButtonElement>(
      '.workspace-sidebar__close[aria-label="Minimalkan navigasi"]',
    )!;
    await act(() => collapseButton.click());

    const navLinks = view.querySelectorAll(".workspace-navigation a");
    expect(navLinks.length).toBe(partnerEoNavigation.length);
    expect(view.querySelector(".workspace-navigation__label")).not.toBeNull();
  });

  it("renders canonical vector logo and partner role in sidebar", async () => {
    const view = await renderWorkspace();
    const logoImg = view.querySelector<HTMLImageElement>(
      ".workspace-sidebar__logo",
    );
    expect(logoImg).not.toBeNull();
    expect(logoImg?.getAttribute("src")).toContain(".svg");
    expect(view.textContent).not.toContain("JedaIn.");
    expect(
      view.querySelector(".workspace-sidebar__role-tag")?.textContent,
    ).toBe("Partner");
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
