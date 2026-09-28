// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { packageRepository } from "../../data/packageRepository";
import { setDataModeOverride } from "../../lib/supabase/config";
import { EoPackageDetailScreen } from "./EoPackageDetailScreen";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";

let container: HTMLDivElement;
let root: Root | undefined;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  mockEoPackageStore.reset();
  partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container?.remove();
  mockEoPackageStore.reset();
  partnerSessionStore.reset();
  setDataModeOverride(null);
});

async function renderScreen(initialEntry: string) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      createElement(
        MemoryRouter,
        { initialEntries: [initialEntry] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/partner/eo/packages/:packageId",
            element: createElement(EoPackageDetailScreen),
          }),
        ),
      ),
    );
  });
  return container;
}

describe("EO Package Detail - ACC Paket (Demo) Behavior", () => {
  it("1. does NOT display 'ACC Paket (Demo)' when in default mock mode", async () => {
    setDataModeOverride("mock");
    // pkg_pacet_mindful_retreat is in PENDING_ADMIN_REVIEW
    const view = await renderScreen(
      "/partner/eo/packages/pkg_pacet_mindful_retreat",
    );

    expect(view.textContent).toContain("Sedang ditinjau Admin JedaIn");
    expect(view.textContent).not.toContain("ACC Paket (Demo)");
  });

  it("2. displays 'ACC Paket (Demo)' button when in supabase mode and package is PENDING_ADMIN_REVIEW", async () => {
    setDataModeOverride("supabase");
    const view = await renderScreen(
      "/partner/eo/packages/pkg_pacet_mindful_retreat",
    );

    expect(view.textContent).toContain("Sedang ditinjau Admin JedaIn");
    expect(view.textContent).toContain("ACC Paket (Demo)");
    expect(view.textContent).toContain(
      "Simulasi persetujuan Admin untuk kebutuhan demo.",
    );
  });

  it("3. clicking 'ACC Paket (Demo)' transitions package to APPROVED, showing Publish button", async () => {
    setDataModeOverride("supabase");
    const view = await renderScreen(
      "/partner/eo/packages/pkg_pacet_mindful_retreat",
    );

    const approveButton = view.querySelector<HTMLButtonElement>(
      'button[data-testid="demo-approve-button"]',
    );
    expect(approveButton).not.toBeNull();

    await act(async () => {
      approveButton?.click();
    });

    // Verify UI reflects APPROVED
    expect(view.textContent).toContain("Disetujui");
    expect(view.textContent).toContain("Paket Disetujui Kurator (Belum Live)");
    expect(view.textContent).toContain("Publish ke Marketplace");
    expect(view.textContent).not.toContain("ACC Paket (Demo)");

    // Verify repository reflects APPROVED
    const pkg = await packageRepository.getPackageById(
      "pkg_pacet_mindful_retreat",
    );
    expect(pkg?.status).toBe("APPROVED");
  });

  it("4. clicking 'Publish ke Marketplace' transitions package from APPROVED to LIVE", async () => {
    setDataModeOverride("supabase");
    // First approve
    await packageRepository.approveOwnPackageForDemo(
      "pkg_pacet_mindful_retreat",
    );

    const view = await renderScreen(
      "/partner/eo/packages/pkg_pacet_mindful_retreat",
    );
    expect(view.textContent).toContain("Publish ke Marketplace");

    const publishBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Publish ke Marketplace"));
    expect(publishBtn).toBeDefined();

    await act(async () => {
      publishBtn?.click();
    });

    expect(view.textContent).toContain("LIVE");
    expect(view.textContent).toContain("Paket berhasil dipublikasikan LIVE");

    const pkg = await packageRepository.getPackageById(
      "pkg_pacet_mindful_retreat",
    );
    expect(pkg?.status).toBe("LIVE");
  });

  it("5. does NOT display 'ACC Paket (Demo)' when package is already LIVE or DRAFT", async () => {
    setDataModeOverride("supabase");
    // slow_green_day is LIVE
    const view = await renderScreen("/partner/eo/packages/slow_green_day");
    expect(view.textContent).not.toContain("ACC Paket (Demo)");
  });
});
