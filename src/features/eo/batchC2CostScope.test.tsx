// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { mockDestinationVerificationStore } from "../admin/mockDestinationVerificationStore";
import { DestinationProfileScreen } from "../destination/DestinationProfileScreen";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoDestinationDetailScreen } from "./EoDestinationDetailScreen";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";
import { EoPackageDetailScreen } from "./EoPackageDetailScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  mockDestinationStore.reset();
  mockDestinationVerificationStore.reset();
  mockEoPackageStore.reset();
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

describe("Batch C2 — Destination Cost Scope Clarity (P1-E01)", () => {
  it("Test 1: Destination with baseCostIncludes/baseCostExcludes displays them on EO Destination Detail", async () => {
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
      ["/partner/eo/destinations/dest_lereng_hijau"],
    );

    expect(view.textContent).toContain("Cakupan Biaya Dasar Destinasi");
    expect(view.textContent).toContain("Rp125.000 / orang");
    expect(view.textContent).toContain("Termasuk Biaya Dasar:");
    expect(view.textContent).toContain("Tiket masuk kawasan Lereng Hijau");
    expect(view.textContent).toContain("Belum Termasuk:");
    expect(view.textContent).toContain("Transportasi menuju titik kumpul awal");
  });

  it("Test 2: Destination without cost scope does NOT fabricate inclusions", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // dest_hutan_trawas does not have baseCostIncludes or baseCostExcludes
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

    expect(view.textContent).toContain("Cakupan Biaya Dasar Destinasi");
    expect(view.textContent).toContain("Rincian cakupan biaya belum tersedia.");
    expect(view.textContent).not.toContain("Akses saung istirahat");
  });

  it("Test 3 & 4: Package Builder base cost and customerPrice math remain exact (baseCost + eoMargin)", async () => {
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
      ["/partner/eo/packages/new?destinationId=dest_lereng_hijau"],
    );

    // Navigate to Step 4 (Skema Harga) via stepper
    const step4Btn = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((b) => b.textContent?.includes("Skema Harga"));
    expect(step4Btn).toBeDefined();

    await act(async () => {
      step4Btn!.click();
    });

    // Selected destination base cost: 125,000
    // Default EO margin: 150,000 -> customerPrice: 275,000
    expect(view.textContent).toContain(
      "Biaya Dasar Destinasi (Lereng Hijau Batu):",
    );
    expect(view.textContent).toContain("Rp125.000");
    expect(view.textContent).toContain("Margin EO:");
    expect(view.textContent).toContain("Rp150.000");
    expect(view.textContent).toContain("Rp275.000 / orang");

    // Compact cost scope note is displayed
    expect(view.textContent).toContain("Cakupan biaya dasar destinasi:");
    expect(view.textContent).toContain("Tiket masuk kawasan Lereng Hijau");
  });

  it("Test 5: Destination base cost scope does NOT bleed into package included/excluded items", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/packages/:packageId",
          element: createElement(EoPackageDetailScreen),
        }),
      ),
      ["/partner/eo/packages/slow_green_day"],
    );

    // Package provisions remain package-specific
    expect(view.textContent).toContain("Santap siang menu pedesaan");
    // Destination base cost inclusions are strictly displayed in cost context
    expect(view.textContent).toContain(
      "Termasuk: Tiket masuk kawasan Lereng Hijau",
    );
  });

  it("Test 6: Mitra Destination Profile displays existing cost scope", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(createElement(DestinationProfileScreen));

    expect(view.textContent).toContain("Modal Dasar per Orang:");
    expect(view.textContent).toContain("Rp125.000");
    expect(view.textContent).toContain("Termasuk Biaya Dasar:");
    expect(view.textContent).toContain("Tiket masuk kawasan Lereng Hijau");
    expect(view.textContent).toContain("Belum Termasuk:");
    expect(view.textContent).toContain("Transportasi menuju titik kumpul awal");
  });

  it("Test 7: Destination application cost-scope fields survive to canonical record through approval lifecycle", async () => {
    // 1. Submit application with cost scope
    partnerSessionStore.setPartner({
      id: "dest_partner_custom_scope",
      email: "scope@destinasi.id",
      name: "Pengelola Baru",
      role: "DESTINATION",
      businessName: "Pengelola Bukit Bintang",
    });

    const res = mockDestinationVerificationStore.submitApplication({
      partnerIdentityId: "dest_partner_custom_scope",
      name: "Bukit Bintang Hening",
      locationLabel: "Batu, Malang",
      province: "Jawa Timur",
      city: "Batu",
      managementName: "Pokdarwis Bintang",
      contactPerson: "Joko",
      phone: "081234567890",
      email: "scope@destinasi.id",
      description: "Bukit asri untuk kontemplasi malam dan jeda hening.",
      highlights: ["Pemandangan langit malam"],
      capacityPerSession: 18,
      baseCostPerPerson: 85000,
      baseCostIncludes: ["Akses gardu pandang", "Teh jahe hangat"],
      baseCostExcludes: ["Tenda pribadi", "Transportasi"],
      guideReady: true,
      guideReadinessEvidence: "Tersedia pemandu lokal bersertifikat dasar.",
      agreedToSop: true,
    });

    expect(res.success).toBe(true);
    const appId = res.application!.applicationId;
    expect(res.application?.baseCostIncludes).toContain("Akses gardu pandang");
    expect(res.application?.baseCostExcludes).toContain("Tenda pribadi");

    // 2. Admin approves application
    const approveResult = mockDestinationVerificationStore.approveApplication(
      appId,
      true,
    );
    expect(approveResult.success).toBe(true);

    // 3. Verify canonical destination record received the cost scope
    const canonical = mockDestinationStore.getById(
      res.application!.destinationIdentityId,
    );
    expect(canonical).toBeDefined();
    expect(canonical?.baseCostPerPerson).toBe(85000);
    expect(canonical?.baseCostIncludes).toEqual([
      "Akses gardu pandang",
      "Teh jahe hangat",
    ]);
    expect(canonical?.baseCostExcludes).toEqual([
      "Tenda pribadi",
      "Transportasi",
    ]);
  });
});
