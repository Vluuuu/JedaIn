// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationOverviewScreen } from "./DestinationOverviewScreen";
import { DestinationScheduleScreen } from "./DestinationScheduleScreen";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { ParticipantQuantity } from "../checkout/ParticipantQuantity";

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

async function renderComponent(
  element: React.ReactElement,
  initialEntries = ["/"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(createElement(MemoryRouter, { initialEntries }, element));
  });
  return container;
}

describe("Batch D1 — Low-Risk UI & Accessibility Polish", () => {
  describe("Task 1: Capacity Copy Spacing", () => {
    it("renders destination overview summary with guaranteed space before 'orang'", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationOverviewScreen),
      );
      const summaryText = view.querySelector(
        ".dest-section-heading__summary",
      )?.textContent;

      expect(summaryText).toBeDefined();
      expect(summaryText).toContain(
        "Kapasitas operasional destinasi: 20 orang",
      );
      expect(summaryText).not.toContain("20orang");
    });
  });

  describe("Task 2: Mitra Schedule Header Terminology", () => {
    it("renders 'Kuota Sesi EO' in the schedule table header", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationScheduleScreen),
      );
      const ths = Array.from(view.querySelectorAll("th")).map((th) =>
        th.textContent?.trim(),
      );

      expect(ths).toContain("Kuota Sesi EO");
      expect(ths).not.toContain("Alokasi Kapasitas");
    });
  });

  describe("Task 3: Participant Quantity Accessibility", () => {
    it("renders accessible name on buttons, stepper group with aria-labelledby and aria-describedby, and status on count value", async () => {
      let currentQty = 2;
      const handleChange = (val: number) => {
        currentQty = val;
      };

      const view = await renderComponent(
        createElement(ParticipantQuantity, {
          value: currentQty,
          min: 1,
          max: 6,
          onChange: handleChange,
        }),
      );

      // Verify no invalid label htmlFor pointing to span
      const invalidLabel = view.querySelector(
        "label[for='participant-count-val']",
      );
      expect(invalidLabel).toBeNull();

      // Verify label has id and matches stepper aria-labelledby
      const label = view.querySelector("#participant-quantity-label");
      expect(label).not.toBeNull();
      expect(label?.textContent?.trim()).toBe("Jumlah peserta");

      const stepper = view.querySelector(".checkout-quantity-stepper");
      expect(stepper?.getAttribute("role")).toBe("group");
      expect(stepper?.getAttribute("aria-labelledby")).toBe(
        "participant-quantity-label",
      );
      expect(stepper?.getAttribute("aria-describedby")).toBe(
        "participant-quantity-hint",
      );

      // Buttons have accessible names
      const decrementBtn = view.querySelector<HTMLButtonElement>(
        "button[aria-label='Kurangi jumlah peserta']",
      );
      const incrementBtn = view.querySelector<HTMLButtonElement>(
        "button[aria-label='Tambah jumlah peserta']",
      );
      expect(decrementBtn).not.toBeNull();
      expect(incrementBtn).not.toBeNull();

      // Value display preserves id and polite aria-live
      const valDisplay = view.querySelector("#participant-count-val");
      expect(valDisplay).not.toBeNull();
      expect(valDisplay?.getAttribute("role")).toBe("status");
      expect(valDisplay?.getAttribute("aria-live")).toBe("polite");
      expect(valDisplay?.textContent?.trim()).toBe("2");

      // Test functional increment and decrement
      await act(async () => {
        incrementBtn!.click();
      });
      expect(currentQty).toBe(3);

      await act(async () => {
        decrementBtn!.click();
      });
      expect(currentQty).toBe(1);
    });
  });
});
