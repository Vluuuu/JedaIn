// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { WorkspaceShell } from "./WorkspaceShell";
import { partnerNavigation } from "./navigation";

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
          navigation: partnerNavigation,
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
});
