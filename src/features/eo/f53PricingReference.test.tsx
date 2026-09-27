// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
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

async function renderBuilder(initialEntry: string) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [initialEntry] },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/new",
            element: createElement(EoPackageBuilderScreen),
          }),
        ),
      ),
    );
  });

  return container;
}

async function openPricingStep(view: HTMLElement) {
  const stepFour = Array.from(
    view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
  ).find((button) => button.textContent?.includes("Skema Harga"));

  expect(stepFour).toBeDefined();

  await act(async () => {
    stepFour!.click();
  });
}

describe("F5.3 — Demand-Assisted Pricing Reference", () => {
  it("1. keeps pricing reference optional and collapsed by default", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderBuilder(
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    await openPricingStep(view);

    const toggle = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) =>
      button.textContent?.includes("Referensi Harga dari Sinyal Traveler"),
    );

    expect(toggle).toBeDefined();
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(view.querySelector("#eo-pricing-reference-panel")).toBeNull();

    expect(view.textContent).toContain("Tarif Pemandu Lokal");
  });

  it("2. exposes only source-backed prototype budget distribution when opened", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderBuilder(
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    await openPricingStep(view);

    const toggle = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) =>
      button.textContent?.includes("Referensi Harga dari Sinyal Traveler"),
    )!;

    await act(async () => {
      toggle.click();
    });

    const panel = view.querySelector<HTMLElement>(
      "#eo-pricing-reference-panel",
    )!;
    expect(panel).not.toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    expect(panel.textContent).toContain("Data simulasi prototype");
    expect(panel.textContent).toContain("1.020 respons simulasi");

    expect(panel.textContent).toContain("Di bawah Rp200.000");
    expect(panel.textContent).toContain("22%");
    expect(panel.textContent).toContain("224 respons simulasi");

    expect(panel.textContent).toContain("Rp200.000 – Rp300.000");
    expect(panel.textContent).toContain("48%");
    expect(panel.textContent).toContain("490 respons simulasi");

    expect(panel.textContent).toContain("Rp300.000 – Rp500.000");
    expect(panel.textContent).toContain("21%");
    expect(panel.textContent).toContain("214 respons simulasi");

    expect(panel.textContent).toContain("Di atas Rp500.000");
    expect(panel.textContent).toContain("9%");
    expect(panel.textContent).toContain("92 respons simulasi");

    expect(panel.textContent).toContain("Rentang budget paling banyak dipilih");
    expect(panel.textContent).toContain(
      "tidak mengubah Margin EO secara otomatis",
    );
    expect(panel.textContent).toContain(
      "bukan sebagai harga terbaik atau jaminan konversi",
    );
  });

  it("3. shows the selected Demand Insight budget context without inventing a new price", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderBuilder(
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau&insightId=ins_nature_batu_1d",
    );

    await openPricingStep(view);

    const toggle = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) =>
      button.textContent?.includes("Referensi Harga dari Sinyal Traveler"),
    )!;

    await act(async () => {
      toggle.click();
    });

    const panel = view.querySelector<HTMLElement>(
      "#eo-pricing-reference-panel",
    )!;

    expect(panel.textContent).toContain("Rentang budget pada insight terpilih");
    expect(panel.textContent).toContain("Rp200.000 – Rp300.000 / orang");
    expect(panel.textContent).toContain(
      "Tingginya Permintaan Jeda Alam 1 Hari di Lereng Malang Raya",
    );

    expect(panel.textContent).not.toContain("rekomendasi AI");
    expect(panel.textContent).not.toContain("forecast");
  });

  it("4. opening the reference does not mutate EO margin or customer price", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderBuilder(
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    await openPricingStep(view);

    const marginInput =
      view.querySelector<HTMLInputElement>("#eo-margin-input")!;
    expect(marginInput.value).toBe("150000");
    expect(view.textContent).toContain("Rp300.000 / orang");

    const toggle = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) =>
      button.textContent?.includes("Referensi Harga dari Sinyal Traveler"),
    )!;

    await act(async () => {
      toggle.click();
    });

    expect(marginInput.value).toBe("150000");
    expect(view.textContent).toContain("Rp300.000 / orang");
  });
});
