// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { partnerSessionStore } from "./partnerSessionStore";
import { PartnerPortalLandingScreen } from "./PartnerPortalLandingScreen";

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

async function renderPartnerPortal() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/partner"] },
        createElement(PartnerPortalLandingScreen),
      ),
    );
  });
}

describe("Batch E1 — Competition Demo Hardening", () => {
  it("uses evidence-safe partner portal copy instead of claiming real demand", async () => {
    await renderPartnerPortal();

    expect(container.textContent).toContain(
      "Rancang perjalanan bersama JedaIn.",
    );
    expect(container.textContent).not.toContain("Mitra Destinasi");
    expect(container.textContent).not.toContain("permintaan nyata");
  });

  it("shows only TO at the public partner entrance", async () => {
    await renderPartnerPortal();

    const text = container.textContent ?? "";
    expect(text).toContain("Travel Organizer");
    expect(text).not.toContain("Mitra Destinasi");
    expect(container.querySelectorAll(".partner-entry__role")).toHaveLength(1);
    expect(text).not.toContain("Demo");
    expect(text).not.toContain("Reset Demo State");
  });

  it("opens email and password on the same /partner screen and rejects a wrong password", async () => {
    partnerSessionStore.logout();
    await renderPartnerPortal();
    const enterEo = container.querySelector<HTMLButtonElement>(
      ".partner-entry__role .partner-entry__primary",
    )!;
    await act(async () => enterEo.click());
    expect(container.textContent).toContain("Masuk sebagai Travel Organizer");
    const email = container.querySelector<HTMLInputElement>("#partner-email")!;
    const password =
      container.querySelector<HTMLInputElement>("#partner-password")!;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter?.call(email, "partner@jedaalam.id");
      email.dispatchEvent(new Event("change", { bubbles: true }));
      setter?.call(password, "salah");
      password.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>("button[type='submit']")!
        .click();
    });
    expect(container.textContent).toContain(
      "Email atau kata sandi tidak sesuai",
    );
    expect(partnerSessionStore.get()).toBeNull();
  });
});
