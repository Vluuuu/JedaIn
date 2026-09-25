// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
  partnerSessionStore.reset();
});

async function renderPackageBuilder(
  initialEntries = ["/partner/eo/packages/new?destinationId=dest_lembah_pacet"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/new",
            element: createElement(EoPackageBuilderScreen),
          }),
          createElement(Route, {
            path: "/partner/eo/packages/:packageId",
            element: createElement("div", undefined, "Package Detail Screen"),
          }),
        ),
      ),
    );
  });
  return container;
}

describe("P1 EO Package Builder Validation Visibility & Focus Regression", () => {
  it("rejects invalid package submission, navigates to first invalid step, brings validation alert into view, and focuses it", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // Mock scrollIntoView on HTMLElement prototype
    const scrollIntoViewMock = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const view = await renderPackageBuilder();

    // Verify initially at Step 1
    expect(view.textContent).toContain(
      "Langkah 1: Pilih Destinasi & Status Pemanduan",
    );

    // Jump directly to Step 5 (Tinjau & Submit)
    const step5Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"));
    expect(step5Button).toBeDefined();

    await act(async () => {
      step5Button!.click();
    });

    expect(view.textContent).toContain(
      "Langkah 5: Tinjau & Ajukan untuk Review Kurasi",
    );

    // Click submit for review with missing title/summary from Step 2
    const submitBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Submit untuk Review Admin"));
    expect(submitBtn).toBeDefined();

    await act(async () => {
      submitBtn!.click();
    });

    // 1. Invalid package submission stays rejected (does not navigate to detail)
    expect(view.textContent).not.toContain("Package Detail Screen");

    // 2. Screen changes to the first invalid step (Step 2: Sinyal Insight)
    expect(view.textContent).toContain(
      "Langkah 2: Hubungkan dengan Sinyal Kebutuhan Traveler",
    );

    // 3. Validation alert remains rendered with proper semantic attributes
    const alertEl = view.querySelector<HTMLDivElement>(
      '.eo-alert[role="alert"]',
    );
    expect(alertEl).not.toBeNull();
    expect(alertEl?.getAttribute("tabindex")).toBe("-1");

    // 4. Validation error content is intact and unchanged
    expect(alertEl?.textContent).toContain(
      "Paket belum memenuhi standar kurasi",
    );
    expect(alertEl?.textContent).toContain(
      "Langkah 2: Judul paket wajib diisi minimal 5 karakter.",
    );
    expect(alertEl?.textContent).toContain(
      "Langkah 2: Ringkasan nilai pengalaman wajib diisi minimal 10 karakter.",
    );

    // 5. Visibility and focus helper executed safely without breaking jsdom
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(document.activeElement).toBe(alertEl);
  });
});
