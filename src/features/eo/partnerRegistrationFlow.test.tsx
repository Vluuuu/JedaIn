// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { mockApplicationStore } from "./mockApplicationStore";
import { partnerSessionStore } from "./partnerSessionStore";

let root: Root;
let view: HTMLDivElement;
beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
afterEach(async () => {
  await act(() => root?.unmount());
  view?.remove();
  mockApplicationStore.reset();
  mockDestinationVerificationStore.reset();
  partnerSessionStore.reset();
});

describe("New applicant demo approval", () => {
  it("keeps the applicant pending until the explicit demo action, then allows their own workspace and shows simulated email", async () => {
    await partnerRegistrationRepository.submit({
      role: "EO",
      password: "Pendaftaran2026!",
      details: {
        email: "pengajuan@gmail.com",
        businessName: "TO Baru",
        contactPerson: "Pengelola Baru",
        phone: "081234567890",
        city: "Batu",
        province: "Jawa Timur",
        experienceDescription: "Perjalanan bersama komunitas lokal",
        yearsOfOperation: 1,
        guideStatus: "CONCEPT_ONLY",
        agreedToSop: true,
      },
    });
    const identity = partnerSessionStore.get()!.id;
    view = document.createElement("div");
    document.body.append(view);
    root = createRoot(view);
    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/partner/eo"] },
          createElement(App),
        ),
      ),
    );
    expect(view.textContent).toContain("Sedang Dalam Proses Kurasi");
    expect(mockApplicationStore.getBySellerId(identity)?.status).toBe(
      "PENDING_REVIEW",
    );
    const approval = Array.from(view.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Sudah di-ACC (Demo)"),
    );
    await act(async () => approval!.click());
    expect(partnerSessionStore.get()?.id).toBe(identity);
    expect(mockApplicationStore.getBySellerId(identity)?.status).toBe(
      "APPROVED",
    );
    expect(view.textContent).toContain("pengajuan@gmail.com");
    expect(view.textContent).toContain("Tidak ada email sungguhan");
    const dashboard = Array.from(view.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Buka Operational Dashboard"),
    );
    await act(async () => dashboard!.click());
    expect(view.textContent).not.toContain("Status Pengajuan Mitra");
    expect(partnerSessionStore.get()?.id).toBe(identity);
  });
});
