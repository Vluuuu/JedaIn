// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { partnerSessionStore, DEMO_EO_USER } from "../eo/partnerSessionStore";
import { PartnerPortalLandingScreen } from "../eo/PartnerPortalLandingScreen";
import { PartnerLoginScreen } from "../eo/PartnerLoginScreen";
import { DestinationApplicationScreen } from "./DestinationApplicationScreen";

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

describe("P0-04 Fix Destination Registration Loop", () => {
  it("Check 1: Partner Portal -> Daftar Destinasi establishes DESTINATION identity and enters application form without loop", async () => {
    // Start with default EO demo session
    expect(partnerSessionStore.get()?.role).toBe("EO");

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner"] },
          createElement(
            Routes,
            undefined,
            createElement(Route, {
              path: "/partner",
              element: createElement(PartnerPortalLandingScreen),
            }),
            createElement(Route, {
              path: "/partner/apply/destination",
              element: createElement(DestinationApplicationScreen),
            }),
          ),
        ),
      );
    });

    // Find "Daftar sebagai Destinasi" button
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    );
    const registerDestBtn = buttons.find((b) =>
      b.textContent?.includes("Daftar sebagai Destinasi"),
    );
    expect(registerDestBtn).toBeDefined();

    await act(async () => {
      registerDestBtn!.click();
    });

    // Verify session switched to DESTINATION role
    expect(partnerSessionStore.get()?.role).toBe("DESTINATION");

    // Verify destination application form rendered (Step 1 is present, NOT the login loop guard)
    expect(container.textContent).toContain("Pengajuan Mitra Destinasi Lokal");
    expect(container.textContent).toContain("1. Pengelola & Legalitas");
    expect(container.textContent).not.toContain(
      "Silakan masuk atau buat akun kemitraan destinasi terlebih dahulu",
    );
  });

  it("Check 1b: Direct entry to /partner/apply/destination with non-destination session offers direct registration without loop", async () => {
    partnerSessionStore.logout();
    expect(partnerSessionStore.get()).toBeNull();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/apply/destination"] },
          createElement(
            Routes,
            undefined,
            createElement(Route, {
              path: "/partner/apply/destination",
              element: createElement(DestinationApplicationScreen),
            }),
          ),
        ),
      );
    });

    // Guard screen is shown with action to start registration directly
    expect(container.textContent).toContain("Pendaftaran Mitra Destinasi");
    const startBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Daftar Destinasi Baru"),
    );
    expect(startBtn).toBeDefined();

    await act(async () => {
      startBtn!.click();
    });

    // Now application step 1 is displayed immediately
    expect(partnerSessionStore.get()?.role).toBe("DESTINATION");
    expect(container.textContent).toContain("Pengajuan Mitra Destinasi Lokal");
    expect(container.textContent).toContain("1. Pengelola & Legalitas");
  });

  it("Check 1c: Partner Login link 'Daftar Verifikasi Destinasi' establishes DESTINATION session and reaches application", async () => {
    partnerSessionStore.logout();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/login"] },
          createElement(
            Routes,
            undefined,
            createElement(Route, {
              path: "/partner/login",
              element: createElement(PartnerLoginScreen),
            }),
            createElement(Route, {
              path: "/partner/apply/destination",
              element: createElement(DestinationApplicationScreen),
            }),
          ),
        ),
      );
    });

    // Role defaults to DESTINATION
    const link = container.querySelector<HTMLAnchorElement>(
      "a[href='/partner/apply/destination']",
    );
    expect(link).toBeDefined();
    expect(link?.textContent).toContain("Daftar Verifikasi Destinasi");

    await act(async () => {
      link!.click();
    });

    expect(partnerSessionStore.get()?.role).toBe("DESTINATION");
  });

  it("Check 2: Existing destination account logs in to destination workspace", async () => {
    partnerSessionStore.logout();

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/login"] },
          createElement(
            Routes,
            undefined,
            createElement(Route, {
              path: "/partner/login",
              element: createElement(PartnerLoginScreen),
            }),
            createElement(Route, {
              path: "/partner/destination",
              element: createElement("div", undefined, "Destination Workspace"),
            }),
          ),
        ),
      );
    });

    const emailInput =
      container.querySelector<HTMLInputElement>("#partner-email")!;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(emailInput, "destinasi@lerenghijau.id");
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const submitBtn = container.querySelector<HTMLButtonElement>(
      "button[type='submit']",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    expect(partnerSessionStore.get()?.role).toBe("DESTINATION");
    expect(partnerSessionStore.get()?.id).toBe("dest_partner_lereng_hijau");
    expect(container.textContent).toContain("Destination Workspace");
  });

  it("Check 3: EO identity does not mistakenly change to destination identity on unrelated visits", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    expect(partnerSessionStore.get()?.role).toBe("EO");
    expect(partnerSessionStore.get()?.id).toBe(DEMO_EO_USER.id);

    // Visiting partner portal without clicking destination registration does not mutate session
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

    expect(partnerSessionStore.get()?.role).toBe("EO");
    expect(partnerSessionStore.get()?.id).toBe(DEMO_EO_USER.id);
  });
});
