// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore, DEMO_EO_USER } from "./partnerSessionStore";
import { EoApplicationScreen } from "./EoApplicationScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  mockApplicationStore.reset();
  partnerSessionStore.reset();
});

async function renderEoApplication() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/partner/apply/eo"] },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/apply/eo",
            element: createElement(EoApplicationScreen),
          }),
          createElement(Route, {
            path: "/partner/application",
            element: createElement(
              "div",
              undefined,
              "Application Status Screen",
            ),
          }),
        ),
      ),
    );
  });
  return container;
}

describe("P0-03 Clean EO Application Demo State", () => {
  it("Check 1: Entry new EO application does NOT carry data or documents from approved demo EO", async () => {
    // Default partner session is initialized to DEMO_EO_USER
    expect(partnerSessionStore.get()?.id).toBe(DEMO_EO_USER.id);

    const view = await renderEoApplication();

    const businessNameInput =
      view.querySelector<HTMLInputElement>("#eo-business-name")!;
    const contactPersonInput =
      view.querySelector<HTMLInputElement>("#eo-contact-person")!;
    const emailInput = view.querySelector<HTMLInputElement>("#eo-email")!;
    const phoneInput = view.querySelector<HTMLInputElement>("#eo-phone")!;
    const cityInput = view.querySelector<HTMLInputElement>("#eo-city")!;
    const certInput = view.querySelector<HTMLInputElement>("#eo-cert-doc")!;
    const insuranceInput =
      view.querySelector<HTMLInputElement>("#eo-insurance-doc")!;
    const sopCheckbox = view.querySelector<HTMLInputElement>("#eo-sop-agree")!;

    // Must be clean, not pre-filled with "Jeda Alam Nusantara" or "Budi Santoso"
    expect(businessNameInput.value).toBe("");
    expect(contactPersonInput.value).toBe("");
    expect(emailInput.value).toBe("");
    expect(phoneInput.value).toBe("");
    expect(cityInput.value).toBe("");
    expect(certInput.value).toBe("");
    expect(insuranceInput.value).toBe("");
    expect(sopCheckbox.checked).toBe(false);
  });

  it("Check 2, 3 & 4: Submitting new application succeeds, generates fresh identity, does not submit sample docs, and demo EO is unaffected", async () => {
    // Ensure approved demo EO exists
    expect(mockApplicationStore.getBySellerId("eo_jeda_alam")?.status).toBe(
      "APPROVED",
    );

    const view = await renderEoApplication();

    // Fill form with real applicant data without sample documents
    const businessNameInput =
      view.querySelector<HTMLInputElement>("#eo-business-name")!;
    const contactPersonInput =
      view.querySelector<HTMLInputElement>("#eo-contact-person")!;
    const emailInput = view.querySelector<HTMLInputElement>("#eo-email")!;
    const phoneInput = view.querySelector<HTMLInputElement>("#eo-phone")!;
    const cityInput = view.querySelector<HTMLInputElement>("#eo-city")!;
    const descInput = view.querySelector<HTMLTextAreaElement>("#eo-desc")!;
    const sopCheckbox = view.querySelector<HTMLInputElement>("#eo-sop-agree")!;
    const form = view.querySelector<HTMLFormElement>("form")!;

    await act(async () => {
      const setInput = (input: HTMLInputElement, val: string) => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(input, val);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };

      const setTextArea = (textarea: HTMLTextAreaElement, val: string) => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        )?.set;
        setter?.call(textarea, val);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      };

      setInput(businessNameInput, "Kembara Jiwa Nusantara");
      setInput(contactPersonInput, "Siti Rahma");
      setInput(emailInput, "siti@kembarajiwa.id");
      setInput(phoneInput, "081299887766");
      setInput(cityInput, "Batu");
      setTextArea(
        descInput,
        "Spesialis mindful walking tour di lereng gunung.",
      );

      sopCheckbox.click();
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    // Check that new application was created in mockApplicationStore
    const allApps = mockApplicationStore.getAll();
    const newApp = allApps.find((a) => a.email === "siti@kembarajiwa.id");
    expect(newApp).toBeDefined();
    expect(newApp?.businessName).toBe("Kembara Jiwa Nusantara");
    expect(newApp?.status).toBe("PENDING_REVIEW");
    expect(newApp?.identityId).not.toBe("eo_jeda_alam");
    // No sample documents should be submitted
    expect(newApp?.guideCertificateDoc).toBeUndefined();
    expect(newApp?.insuranceDoc).toBeUndefined();

    // Check that approved demo EO still exists and is untouched
    const demoApp = mockApplicationStore.getBySellerId("eo_jeda_alam");
    expect(demoApp?.status).toBe("APPROVED");
    expect(demoApp?.businessName).toBe("Jeda Alam Nusantara");

    // Partner session was set to the new application's identity
    const currentPartner = partnerSessionStore.get();
    expect(currentPartner?.email).toBe("siti@kembarajiwa.id");
    expect(currentPartner?.role).toBe("EO");
  });

  it("Check 5: Validation blocks submission if SOP is not acknowledged", async () => {
    const view = await renderEoApplication();
    const form = view.querySelector<HTMLFormElement>("form")!;

    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(view.textContent).toContain("Wajib menyetujui standar operasional");
  });
});
