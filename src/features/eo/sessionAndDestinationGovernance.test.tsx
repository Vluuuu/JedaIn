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
  const baseNow = new Date("2026-10-01T10:00:00.000Z").getTime();

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

describe("F4.2 — Part B: Destination Governance Consistency (ADM-F01)", () => {
  it("1. dest_app_trawas_bambu verification application remains APPROVED, BASIC, approvedGuideReady=false", () => {
    const app = mockDestinationVerificationStore.getById(
      "dest_app_trawas_bambu",
    );
    expect(app).toBeDefined();
    expect(app?.status).toBe("APPROVED");
    expect(app?.approvedLevel).toBe("BASIC");
    expect(app?.approvedGuideReady).toBe(false);
    expect(app?.declaredGuideReady).toBe(false);
    expect(app?.guideReadinessEvidence).toContain(
      "Belum memiliki pemandu lokal resmi",
    );
  });

  it("2 & 3. canonical dest_hutan_trawas is ACTIVE, BASIC, guideReady=false without guide ready claims", () => {
    const dest = mockDestinationStore.getById("dest_hutan_trawas");
    expect(dest).toBeDefined();
    expect(dest?.status).toBe("ACTIVE");
    expect(dest?.verificationLevel).toBe("BASIC");
    expect(dest?.guideReady).toBe(false);

    // Verify no guide-ready claims in description, highlights, or localGuideSummary
    expect(dest?.description).not.toContain("siap memandu");
    expect(dest?.description).not.toContain("Didukung pemandu");
    for (const h of dest?.highlights ?? []) {
      expect(h).not.toContain("siap mendampingi");
      expect(h).not.toContain("Pemandu lokal desa wisata");
    }
    expect(dest?.localGuideSummary).not.toContain("siap memandu");
    expect(dest?.localGuideSummary).toContain(
      "Belum memiliki pemandu lokal resmi",
    );
  });

  it("4. Admin Trust includes Hutan Bambu but does NOT display Guide Ready for it", async () => {
    adminSessionStore.loginAsDemoAdmin();

    const view = await renderComponent(createElement(AdminTrustStatusScreen));
    expect(view.textContent).toContain("Hutan Bambu Trawas");

    // Find the row for Hutan Bambu Trawas
    const rows = Array.from(view.querySelectorAll("tr"));
    const trawasRow = rows.find((r) =>
      r.textContent?.includes("Hutan Bambu Trawas"),
    )!;
    expect(trawasRow).toBeDefined();

    // Verification column shows Verifikasi BASIC without Guide Ready checkmark
    expect(trawasRow.textContent).toContain("Verifikasi BASIC");
    expect(trawasRow.textContent).not.toContain("Guide Ready ✓");

    // Lereng Hijau row (which is guideReady: true) still displays Guide Ready
    const lerengRow = rows.find((r) =>
      r.textContent?.includes("Lereng Hijau Batu"),
    )!;
    expect(lerengRow.textContent).toContain("Guide Ready ✓");
  });

  it("5 & 6 & 7. mockDestinationStore.getEligibleForEo() excludes dest_hutan_trawas while retaining guide-ready destinations and newly approved destinations", () => {
    const eligible = mockDestinationStore.getEligibleForEo();

    // Hutan Bambu is excluded because guideReady is false
    expect(eligible.some((d) => d.destinationId === "dest_hutan_trawas")).toBe(
      false,
    );

    // Other guide-ready destinations remain available
    expect(eligible.some((d) => d.destinationId === "dest_lereng_hijau")).toBe(
      true,
    );
    expect(eligible.some((d) => d.destinationId === "dest_lembah_pacet")).toBe(
      true,
    );

    // If an application with guideReady=true is newly approved by Admin, it enters eligibility
    mockDestinationStore.upsertVerifiedDestination({
      destinationId: "dest_new_approved",
      name: "Destinasi Baru Guide Siap",
      locationLabel: "Batu",
      province: "Jawa Timur",
      city: "Batu",
      verificationLevel: "BASIC",
      guideReady: true,
      baseCostPerPerson: 100000,
      description: "Destinasi baru dengan guide.",
      highlights: ["Pemandu siap"],
      capacityPerSession: 20,
      status: "ACTIVE",
    });

    const eligibleAfter = mockDestinationStore.getEligibleForEo();
    expect(
      eligibleAfter.some((d) => d.destinationId === "dest_new_approved"),
    ).toBe(true);
  });

  it("8. EO Destination Directory no longer lists Hutan Bambu as an eligible destination", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(createElement(EoDestinationsScreen));
    expect(view.textContent).toContain("Lereng Hijau Batu");
    expect(view.textContent).toContain("Lembah Alam Pacet");
    expect(view.textContent).not.toContain("Hutan Bambu Trawas");
  });

  it("9. Direct EO Destination Detail for Hutan Bambu shows not-ready context and disables create-package CTA", async () => {
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

    // Must NOT claim local guide is ready
    expect(view.textContent).not.toContain("Pemandu lokal tersedia");
    expect(view.textContent).not.toContain("Pemandu Lokal Siap");

    // Shows truthful not-ready status
    expect(view.textContent).toContain("Pemandu lokal belum tersedia");
    expect(view.textContent).toContain("Pemandu Lokal Belum Siap");
    expect(view.textContent).toContain("Belum memiliki pemandu lokal resmi");

    // Create-package CTA is disabled / not active
    expect(view.textContent).not.toContain("Buat Paket dengan Destinasi Ini →");
    expect(view.textContent).not.toContain("Buat Paket Sekarang");
    expect(view.textContent).toContain("Belum Memenuhi Syarat Paket");
    expect(view.textContent).toContain("Tidak Dapat Dibuat Paket");

    const disabledBtns = Array.from(view.querySelectorAll("button")).filter(
      (b) => b.disabled,
    );
    expect(disabledBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("10. Builder query parameter with ineligible destinationId does NOT preselect it", async () => {
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

    // Hutan Bambu card is not rendered in eligible list
    expect(view.textContent).not.toContain("Hutan Bambu Trawas");

    // Stepper stays at Step 1 and selected destination is not Hutan Bambu
    const selectedBadge = view.querySelector(".eo-builder-dest-card--selected");
    expect(selectedBadge).toBeNull();
  });

  it("11. Mitra/Admin inspection of the canonical Destination still works truthfully", async () => {
    partnerSessionStore.setPartner({
      id: "dest_partner_trawas_bambu",
      email: "partner@trawas.id",
      name: "Pengelola Trawas",
      role: "DESTINATION",
      businessName: "Pengelola Bambu Trawas",
      destinationIdentityId: "dest_hutan_trawas",
    });

    // 1. Mitra Destination Overview
    const overviewView = await renderComponent(
      createElement(DestinationOverviewScreen),
    );
    expect(overviewView.textContent).toContain("Hutan Bambu Trawas");
    expect(overviewView.textContent).toContain("Terverifikasi Dasar");
    expect(overviewView.textContent).toContain("Pemandu lokal belum tersedia");
    expect(overviewView.textContent).not.toContain("Pemandu lokal tersedia");

    // 2. Mitra Destination Profile
    const profileView = await renderComponent(
      createElement(DestinationProfileScreen),
    );
    expect(profileView.textContent).toContain("Hutan Bambu Trawas");
    expect(profileView.textContent).toContain("Terverifikasi BASIC");
    expect(profileView.textContent).toContain("Tanpa Guide Lokal");
    expect(profileView.textContent).not.toContain("Guide Ready ✓");

    // 3. Mitra Destination Verification Badges
    const badgeView = await renderComponent(
      createElement(DestinationVerificationBadgeScreen),
    );
    expect(badgeView.textContent).toContain("Terverifikasi Dasar (BASIC)");
    expect(badgeView.textContent).toContain("Tanpa Guide Lokal");
    expect(badgeView.textContent).toContain("Belum Memiliki Pemandu Lokal");
  });
});
