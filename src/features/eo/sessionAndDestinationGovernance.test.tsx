// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminSessionStore } from "../admin/adminSessionStore";
import { AdminTrustStatusScreen } from "../admin/AdminTrustStatusScreen";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { DestinationOverviewScreen } from "../destination/DestinationOverviewScreen";
import { DestinationProfileScreen } from "../destination/DestinationProfileScreen";
import { DestinationVerificationBadgeScreen } from "../destination/DestinationVerificationBadgeScreen";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoDestinationDetailScreen } from "./EoDestinationDetailScreen";
import { EoDestinationsScreen } from "./EoDestinationsScreen";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";
import { EoSessionsScreen } from "./EoSessionsScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  mockEoPackageStore.reset();
  mockDestinationStore.reset();
  mockDestinationVerificationStore.reset();
  partnerSessionStore.reset();
  adminSessionStore.reset();
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  mockEoPackageStore.reset();
  mockDestinationStore.reset();
  mockDestinationVerificationStore.reset();
  partnerSessionStore.reset();
  adminSessionStore.reset();
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

describe("F4.2 — Part A: EO Session Temporal Integrity (EO-F01)", () => {
  const baseNow = Date.now();

  it("1 & 2. createSession rejects startAt in the past and startAt equal to now", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const countBefore = mockEoPackageStore.getAllSessions().length;

    // Past startAt
    const pastRes = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: new Date(baseNow - 60000).toISOString(),
      endAt: new Date(baseNow + 3600000).toISOString(),
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(pastRes.success).toBe(false);
    expect(pastRes.message).toContain("Waktu mulai sesi harus di masa depan");
    expect(mockEoPackageStore.getAllSessions().length).toBe(countBefore);

    // Exact current nowMs startAt
    const nowRes = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: new Date(baseNow).toISOString(),
      endAt: new Date(baseNow + 3600000).toISOString(),
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(nowRes.success).toBe(false);
    expect(nowRes.message).toContain("Waktu mulai sesi harus di masa depan");
    expect(mockEoPackageStore.getAllSessions().length).toBe(countBefore);
  });

  it("3 & 4 & 5. createSession rejects invalid/unparseable timestamps and endAt <= startAt with zero records created", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const countBefore = mockEoPackageStore.getAllSessions().length;

    // Invalid timestamp
    const unparseableRes = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: "NOT_A_DATE",
      endAt: "ALSO_NOT_A_DATE",
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(unparseableRes.success).toBe(false);
    expect(unparseableRes.message).toContain(
      "Format tanggal dan waktu sesi tidak valid",
    );
    expect(mockEoPackageStore.getAllSessions().length).toBe(countBefore);

    // endAt equal to startAt
    const equalRes = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: new Date(baseNow + 10000).toISOString(),
      endAt: new Date(baseNow + 10000).toISOString(),
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(equalRes.success).toBe(false);
    expect(equalRes.message).toContain(
      "Waktu selesai sesi harus setelah waktu mulai",
    );
    expect(mockEoPackageStore.getAllSessions().length).toBe(countBefore);

    // endAt before startAt
    const beforeRes = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: new Date(baseNow + 20000).toISOString(),
      endAt: new Date(baseNow + 10000).toISOString(),
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(beforeRes.success).toBe(false);
    expect(beforeRes.message).toContain(
      "Waktu selesai sesi harus setelah waktu mulai",
    );
    expect(mockEoPackageStore.getAllSessions().length).toBe(countBefore);
  });

  it("6 & 7 & 8 & 9. valid future session creates OPEN for APPROVED or LIVE packages, but rejects DRAFT/REJECTED", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // Case LIVE package: slow_green_day
    const futureStart = new Date(baseNow + 24 * 3600 * 1000).toISOString();
    const futureEnd = new Date(baseNow + 30 * 3600 * 1000).toISOString();

    const liveRes = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: futureStart,
      endAt: futureEnd,
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(liveRes.success).toBe(true);
    expect(liveRes.session?.status).toBe("OPEN");

    // Case APPROVED package (APPROVED != LIVE, but may prepare future sessions)
    mockEoPackageStore.saveDraft({
      packageId: "pkg_approved_future_test",
      title: "Paket Approved Masa Depan",
      shortSummary: "Paket siap buka sesi minimal sepuluh karakter.",
      destinationId: "dest_lereng_hijau",
      itinerary: [
        {
          order: 1,
          title: "Sesi 1",
          description: "Deskripsi sesi pertama",
          timeOfDayLabel: "Pagi",
          durationLabel: "1 jam",
        },
        {
          order: 2,
          title: "Sesi 2",
          description: "Deskripsi sesi kedua",
          timeOfDayLabel: "Siang",
          durationLabel: "2 jam",
        },
      ],
      safetyNotes: ["Patuhi aturan."],
      pricing: {
        destinationBaseCost: 125000,
        eoMargin: 150000,
        customerPrice: 275000,
      },
      status: "DRAFT",
    });
    mockEoPackageStore.submitForReview("pkg_approved_future_test");
    mockEoPackageStore.approvePackage("pkg_approved_future_test");

    const approvedRes = mockEoPackageStore.createSession({
      packageId: "pkg_approved_future_test",
      startAt: futureStart,
      endAt: futureEnd,
      capacity: 8,
      pricePerPerson: 200000,
      nowMs: baseNow,
    });
    expect(approvedRes.success).toBe(true);
    expect(approvedRes.session?.status).toBe("OPEN");

    // Case DRAFT package: cannot open session
    mockEoPackageStore.saveDraft({
      packageId: "pkg_draft_not_allowed",
      title: "Paket Masih Draf",
      destinationId: "dest_lereng_hijau",
      status: "DRAFT",
    });
    const draftRes = mockEoPackageStore.createSession({
      packageId: "pkg_draft_not_allowed",
      startAt: futureStart,
      endAt: futureEnd,
      capacity: 6,
      pricePerPerson: 200000,
      nowMs: baseNow,
    });
    expect(draftRes.success).toBe(false);
    expect(draftRes.message).toContain(
      "Hanya paket berstatus APPROVED atau LIVE",
    );
  });

  it("10 & 11. updateSessionStatus refuses to reopen a past session as OPEN, but permits opening a future session", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // Create a future session
    const futureStart = new Date(baseNow + 24 * 3600 * 1000).toISOString();
    const futureEnd = new Date(baseNow + 30 * 3600 * 1000).toISOString();

    const res = mockEoPackageStore.createSession({
      packageId: "slow_green_day",
      startAt: futureStart,
      endAt: futureEnd,
      capacity: 6,
      pricePerPerson: 275000,
      nowMs: baseNow,
    });
    expect(res.success).toBe(true);
    const sId = res.session!.sessionId;

    // Normal closing of future session succeeds
    expect(mockEoPackageStore.updateSessionStatus(sId, "CLOSED", baseNow)).toBe(
      true,
    );
    expect(
      mockEoPackageStore.getAllSessions().find((s) => s.sessionId === sId)
        ?.status,
    ).toBe("CLOSED");

    // Reopening future session while still in future succeeds
    expect(mockEoPackageStore.updateSessionStatus(sId, "OPEN", baseNow)).toBe(
      true,
    );
    expect(
      mockEoPackageStore.getAllSessions().find((s) => s.sessionId === sId)
        ?.status,
    ).toBe("OPEN");

    // Close it again
    expect(mockEoPackageStore.updateSessionStatus(sId, "CLOSED", baseNow)).toBe(
      true,
    );

    // Fast-forward time past the session start date
    const futureNow = new Date(baseNow + 48 * 3600 * 1000).getTime();

    // Attempting to reopen as OPEN when startAt is now in the past FAILS
    expect(mockEoPackageStore.updateSessionStatus(sId, "OPEN", futureNow)).toBe(
      false,
    );
    // Session remains CLOSED
    expect(
      mockEoPackageStore.getAllSessions().find((s) => s.sessionId === sId)
        ?.status,
    ).toBe("CLOSED");

    // But CANCELLED or CLOSED on past session is not blocked
    expect(
      mockEoPackageStore.updateSessionStatus(sId, "CANCELLED", futureNow),
    ).toBe(true);
    expect(
      mockEoPackageStore.getAllSessions().find((s) => s.sessionId === sId)
        ?.status,
    ).toBe("CANCELLED");
  });

  it("12. UI default datetime values are derived from browser future date rather than stale static dates", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(createElement(EoSessionsScreen));

    // Open add session modal
    const openBtn = view.querySelector<HTMLButtonElement>(
      ".eo-action-spotlight__btn",
    )!;
    expect(openBtn).not.toBeNull();

    await act(async () => {
      openBtn.click();
    });

    const startInput = view.querySelector<HTMLInputElement>(
      "#session-start-input",
    )!;
    const endInput =
      view.querySelector<HTMLInputElement>("#session-end-input")!;
    expect(startInput).not.toBeNull();
    expect(endInput).not.toBeNull();

    // Verify it is NOT hardcoded to 2026-09-26
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const expectedPrefix = `${yyyy}-${mm}-${dd}`;

    expect(startInput.value).toContain(expectedPrefix);
    expect(startInput.value).toContain("08:00");
    expect(endInput.value).toContain(expectedPrefix);
    expect(endInput.value).toContain("14:00");
    expect(startInput.value).not.toBe("2026-09-26T08:00");
  });
});

describe("F6 — Destination Verification Requires Local Guide", () => {
  it("1. no-guide Trawas application is rejected and has no approved verification state", () => {
    const app = mockDestinationVerificationStore.getById(
      "dest_app_trawas_bambu",
    );

    expect(app).toBeDefined();
    expect(app?.status).toBe("REJECTED");
    expect(app?.approvedLevel).toBeUndefined();
    expect(app?.approvedGuideReady).toBeUndefined();
    expect(app?.declaredGuideReady).toBe(false);
    expect(app?.rejectionReason).toContain("Pemandu lokal wajib tersedia");
  });

  it("2. no-guide canonical record is retained only as inactive assessment data", () => {
    const destination = mockDestinationStore.getById("dest_hutan_trawas");

    expect(destination).toBeDefined();
    expect(destination?.status).toBe("INACTIVE");
    expect(destination?.guideReady).toBe(false);
    expect(
      mockDestinationStore
        .getEligibleForEo()
        .some((item) => item.destinationId === "dest_hutan_trawas"),
    ).toBe(false);
  });

  it("3. Admin Trust lists only active verified destinations and uses one human verification label", async () => {
    adminSessionStore.loginAsDemoAdmin();

    const view = await renderComponent(createElement(AdminTrustStatusScreen));

    expect(view.textContent).toContain("Lereng Hijau Batu");
    expect(view.textContent).toContain("Terverifikasi Dasar");
    expect(view.textContent).not.toContain("Hutan Bambu Trawas");
    expect(view.textContent).not.toContain("Guide Ready");
    expect(view.textContent).not.toContain("Verifikasi BASIC");
  });

  it("4. EO directory keeps no-guide destinations out of the verified catalog", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(createElement(EoDestinationsScreen));

    expect(view.textContent).toContain("Lereng Hijau Batu");
    expect(view.textContent).toContain("Lembah Alam Pacet");
    expect(view.textContent).not.toContain("Hutan Bambu Trawas");
  });

  it("5. direct EO detail for an inactive no-guide record does not claim it is verified", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/destinations/:destinationId",
          element: createElement(EoDestinationDetailScreen),
        }),
      ),
      ["/partner/eo/destinations/dest_hutan_trawas"],
    );

    expect(view.textContent).toContain("Hutan Bambu Trawas");
    expect(view.textContent).toContain("Belum memenuhi syarat verifikasi");
    expect(view.textContent).toContain("Belum terverifikasi");
    expect(view.textContent).not.toContain("Terverifikasi Dasar");
    expect(view.textContent).not.toContain("Buat Paket dengan Destinasi Ini");
    expect(view.textContent).toContain("Belum Memenuhi Syarat Paket");
  });

  it("6. Builder deep-link cannot preselect a destination that fails the guide requirement", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/packages/new",
          element: createElement(EoPackageBuilderScreen),
        }),
      ),
      ["/partner/eo/packages/new?destinationId=dest_hutan_trawas"],
    );

    expect(view.textContent).not.toContain("Hutan Bambu Trawas");
    expect(view.querySelector(".eo-builder-dest-card--selected")).toBeNull();
  });

  it("7. rejected no-guide destination partner cannot resolve an operational workspace", async () => {
    partnerSessionStore.setPartner({
      id: "dest_partner_trawas_bambu",
      email: "partner@trawas.id",
      name: "Pengelola Trawas",
      role: "DESTINATION",
      businessName: "Pengelola Bambu Trawas",
      destinationIdentityId: "dest_hutan_trawas",
    });

    const overviewView = await renderComponent(
      createElement(DestinationOverviewScreen),
    );
    expect(overviewView.textContent).toContain("Data Destinasi Tidak Tersedia");

    const profileView = await renderComponent(
      createElement(DestinationProfileScreen),
    );
    expect(profileView.textContent).toContain("Data Profil Tidak Tersedia");

    const verificationView = await renderComponent(
      createElement(DestinationVerificationBadgeScreen),
    );
    expect(verificationView.textContent).toContain(
      "Status Verifikasi Tidak Tersedia",
    );
  });
});

describe("F5.2 — EO Destination Discovery & Builder Clarity", () => {
  it("1. Builder exposes explicit location filter without bypassing EO destination eligibility", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(createElement(EoPackageBuilderScreen));
    const locationFilter = view.querySelector<HTMLSelectElement>(
      "#destination-location-filter",
    )!;

    expect(locationFilter).not.toBeNull();
    expect(locationFilter.textContent).toContain("Semua Lokasi");
    expect(locationFilter.textContent).toContain("Batu, Jawa Timur");
    expect(locationFilter.textContent).toContain("Mojokerto, Jawa Timur");
    expect(view.textContent).not.toContain("Hutan Bambu Trawas");

    await act(async () => {
      locationFilter.value = "Mojokerto";
      locationFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(view.textContent).toContain("Lembah Alam Pacet");
    expect(view.textContent).not.toContain("Lereng Hijau Batu");
    expect(view.textContent).not.toContain("Hutan Bambu Trawas");
  });

  it("2. Builder opens dedicated Destination Detail decision page and can return with the destination selected", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/packages/new",
          element: createElement(EoPackageBuilderScreen),
        }),
        createElement(Route, {
          path: "/partner/eo/destinations/:destinationId",
          element: createElement(EoDestinationDetailScreen),
        }),
      ),
      ["/partner/eo/packages/new"],
    );

    const destinationCard = Array.from(
      view.querySelectorAll<HTMLElement>(".eo-builder-dest-card"),
    ).find((card) => card.textContent?.includes("Lereng Hijau Batu"))!;
    const detailButton = Array.from(
      destinationCard.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("Lihat Detail Destinasi"))!;

    expect(detailButton).not.toBeNull();

    await act(async () => {
      detailButton.click();
    });

    expect(view.textContent).toContain("Kembali ke Perancang Paket");
    expect(view.textContent).toContain("Kapasitas umum destinasi");
    expect(view.textContent).toContain("Cakupan Biaya Dasar Destinasi");
    expect(view.textContent).toContain(
      "bukan sertifikasi keselamatan atau persetujuan operasional",
    );

    const selectButton = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("Pilih Destinasi Ini"))!;
    expect(selectButton).not.toBeNull();

    await act(async () => {
      selectButton.click();
    });

    expect(view.textContent).toContain("Langkah 1: Pilih Destinasi");
    const selectedCard = Array.from(
      view.querySelectorAll<HTMLElement>(".eo-builder-dest-card"),
    ).find((card) => card.textContent?.includes("Lereng Hijau Batu"))!;
    expect(selectedCard.textContent).toContain("Terpilih ✓");
  });

  it("3. Builder uses plain-language Ringkasan Pengalaman copy without changing valueProposition semantics", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(createElement(EoPackageBuilderScreen));

    const stepTwoButton = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((button) => button.textContent?.includes("2. Sinyal Insight"))!;
    expect(stepTwoButton).not.toBeNull();

    await act(async () => {
      stepTwoButton.click();
    });

    expect(view.textContent).toContain("Ringkasan Pengalaman");
    expect(view.textContent).toContain(
      "Jelaskan dalam 1–2 kalimat pengalaman utama yang akan didapat Traveler",
    );
    expect(view.textContent).not.toContain(
      "Ringkasan Nilai & Janji Pengalaman",
    );
    expect(view.querySelector("#package-summary")).not.toBeNull();
  });

  it("4. Sessions uses visual package cards and keeps DRAFT package ineligible for new sessions", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    mockEoPackageStore.saveDraft({
      packageId: "pkg_f52_draft",
      title: "Paket F5.2 Masih Draf",
      destinationId: "dest_lereng_hijau",
      status: "DRAFT",
    });

    const view = await renderComponent(createElement(EoSessionsScreen));

    expect(view.querySelector("#package-session-filter")).toBeNull();
    expect(view.querySelector(".eo-session-package-selector")).not.toBeNull();
    expect(view.textContent).toContain("Lereng Hijau Batu");
    expect(view.textContent).toContain("Siap dibuka jadwal sesi");

    const draftCard = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-session-package-card"),
    ).find((card) => card.textContent?.includes("Paket F5.2 Masih Draf"))!;
    expect(draftCard).not.toBeNull();

    await act(async () => {
      draftCard.click();
    });

    expect(view.textContent).toContain(
      "Sesi baru hanya dapat dibuat setelah paket APPROVED atau LIVE",
    );
    expect(
      view.querySelector<HTMLButtonElement>(".eo-action-spotlight__btn")
        ?.disabled,
    ).toBe(true);
  });

  it("5. Mitra Destination Profile uses neutral destination wording", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(createElement(DestinationProfileScreen));

    expect(view.textContent).toContain("Tentang Destinasi:");
    expect(view.textContent).not.toContain("Deskripsi Ketenangan Kawasan");
  });
});
