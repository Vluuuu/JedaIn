// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { partnerSessionStore } from "../../features/eo/partnerSessionStore";
import { TravelerAppShell } from "./TravelerAppShell";
import { WorkspaceShell } from "./WorkspaceShell";
import {
  partnerDestinationNavigation,
  partnerEoNavigation,
} from "./navigation";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  partnerSessionStore.reset();
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
    expect(openButton.hidden).toBe(true);
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

  it("keeps the role slot and nav links mounted during collapse", async () => {
    const view = await renderWorkspace();
    const roleSlot = view.querySelector(".workspace-sidebar__role-slot");
    expect(roleSlot).not.toBeNull();

    const collapseButton = view.querySelector<HTMLButtonElement>(
      '.workspace-sidebar__close[aria-label="Minimalkan navigasi"]',
    )!;
    await act(() => collapseButton.click());

    const navLinks = view.querySelectorAll(".workspace-navigation a");
    expect(navLinks.length).toBe(partnerEoNavigation.length);
    expect(view.querySelector(".workspace-navigation__label")).not.toBeNull();
    expect(view.querySelector(".workspace-sidebar__role-slot")).toBe(roleSlot);
  });

  it("renders the canonical logo in the brand header and role below its divider", async () => {
    const view = await renderWorkspace();
    const brand = view.querySelector(".workspace-sidebar__brand")!;
    const body = view.querySelector(".workspace-sidebar__body")!;
    const roleSlot = view.querySelector(".workspace-sidebar__role-slot")!;
    const roleTag = view.querySelector(".workspace-sidebar__role-tag");
    const logoImg = brand.querySelector<HTMLImageElement>(
      ".workspace-sidebar__logo",
    );

    expect(logoImg).not.toBeNull();
    expect(logoImg?.getAttribute("src")).toContain(".svg");
    expect(view.textContent).not.toContain("JedaIn.");
    expect(brand.querySelector(".workspace-sidebar__role-tag")).toBeNull();
    expect(roleSlot.parentElement).toBe(body);
    expect(roleTag?.textContent).toBe("Partner");
  });

  it("keeps the topbar opener mounted for the true-mobile drawer", async () => {
    const view = await renderWorkspace();
    const hamburgerSvg = Array.from(view.querySelectorAll("svg")).find((svg) =>
      svg.innerHTML.includes("M4 7h16M4 12h16M4 17h16"),
    );
    expect(hamburgerSvg).toBeUndefined();

    const openButton = view.querySelector<HTMLButtonElement>(
      '.workspace-topbar__menu[aria-label="Buka navigasi"]',
    )!;
    expect(openButton).not.toBeNull();
    expect(openButton.hidden).toBe(false);
    expect(openButton.querySelector("svg")?.innerHTML).toContain("<rect");

    await act(() => openButton.click());
    expect(openButton.hidden).toBe(true);
  });

  it("supports Admin surface role tag and branding layout", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          undefined,
          createElement(WorkspaceShell, {
            surface: "admin",
            title: "Admin workspace",
            navigation: [
              { to: "/admin", label: "Overview" },
              { to: "/admin/approvals", label: "Approvals" },
            ],
            children: createElement("p", undefined, "Admin Content"),
          }),
        ),
      ),
    );

    const brand = container.querySelector(".workspace-sidebar__brand")!;
    const roleSlot = container.querySelector(".workspace-sidebar__role-slot")!;
    expect(
      roleSlot.querySelector(".workspace-sidebar__role-tag")?.textContent,
    ).toBe("Admin");
    expect(brand.querySelector(".workspace-sidebar__role-tag")).toBeNull();
    const openButton = container.querySelector(
      '.workspace-topbar__menu[aria-label="Buka navigasi"]',
    );
    expect(openButton).not.toBeNull();
    expect(container.innerHTML).not.toContain("M4 7h16M4 12h16M4 17h16");
  });

  it("supports Destination Partner context with the shared shell structure", async () => {
    partnerSessionStore.loginAsDemoDestination();
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
            title: "Destination Partner Workspace",
            navigation: partnerDestinationNavigation,
            children: createElement("p", undefined, "Destination Content"),
          }),
        ),
      ),
    );

    expect(container.querySelector(".workspace-topbar p")?.textContent).toBe(
      "Destination Partner",
    );
    expect(
      container.querySelector(".workspace-sidebar__role-tag")?.textContent,
    ).toBe("Partner");
    expect(container.querySelectorAll(".workspace-navigation a")).toHaveLength(
      partnerDestinationNavigation.length,
    );
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
