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
import { partnerAccountCredentialsStore } from "./partnerAccountCredentialsStore";

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
    expect(
      view.querySelector('[aria-label="Akun mitra dari JedaIn"]'),
    ).toBeNull();
    expect(partnerAccountCredentialsStore.get()).toBeUndefined();
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
    const credentials = partnerAccountCredentialsStore.get()!;
    expect(credentials.email).toMatch(/@jedain\.biz\.id$/);
    expect(credentials.email).not.toBe("pengajuan@gmail.com");
    expect(view.textContent).toContain(credentials.password);
    expect(JSON.stringify(mockApplicationStore.getAll())).not.toContain(
      credentials.password,
    );
    expect(
      partnerRegistrationRepository.matchesMockPassword(
        credentials.email,
        credentials.password,
      ),
    ).toBe(true);
    expect(
      partnerRegistrationRepository.matchesMockPassword(
        credentials.email,
        "JedaInDemo2026!",
      ),
    ).toBe(false);
    await act(() => partnerAccountCredentialsStore.set(undefined));
    expect(view.textContent).not.toContain(credentials.password);
    const reissue = Array.from(view.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Terbitkan ulang kata sandi"),
    );
    await act(async () => reissue!.click());
    const renewed = partnerAccountCredentialsStore.get()!;
    expect(renewed.email).toBe(credentials.email);
    expect(renewed.password).not.toBe(credentials.password);
    expect(
      partnerRegistrationRepository.matchesMockPassword(
        renewed.email,
        credentials.password,
      ),
    ).toBe(false);
    const dashboard = Array.from(view.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Buka Operational Dashboard"),
    );
    await act(async () => dashboard!.click());
    expect(view.textContent).not.toContain("Status Pengajuan Mitra");
    expect(partnerSessionStore.get()?.id).toBe(identity);
  });
});
