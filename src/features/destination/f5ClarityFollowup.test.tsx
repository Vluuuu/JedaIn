// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationOverviewScreen } from "./DestinationOverviewScreen";
import { DestinationProfileScreen } from "./DestinationProfileScreen";
import { DestinationVerificationBadgeScreen } from "./DestinationVerificationBadgeScreen";
import { mockDestinationPartnerService } from "./mockDestinationPartnerService";
import { EoDestinationDetailScreen } from "../eo/EoDestinationDetailScreen";
import { EoPackageBuilderScreen } from "../eo/EoPackageBuilderScreen";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";

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

async function renderRoute(
  element: React.ReactElement,
  pathPattern: string,
  initialEntry: string,
) {
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
            path: pathPattern,
            element,
          }),
        ),
      ),
    );
  });

  return container;
}

const SAMPLE_BASE64_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("F5 Follow-up Verification: Mitra Status, Profile, Guide Fee, Facility Media, Insight Autofill", () => {
  it("1-4. Mitra Status UI: no empty bullets, 9 core info labels present, no redundant hero card, no obsolete badge copy", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderRoute(
      createElement(DestinationOverviewScreen),
      "/partner/destination",
      "/partner/destination",
    );

    // 1. Checklist completeness disclosure exists and uses proper checklist
    expect(view.textContent).toContain("Informasi profil lengkap");
    expect(view.textContent).toContain("Lihat 9 informasi inti");

    // 2. Exact nine core labels
    const exactNine = [
      "Nama destinasi",
      "Lokasi",
      "Deskripsi destinasi",
      "Aktivitas yang tersedia",
      "Fasilitas destinasi",
      "Catatan operasional",
      "Informasi pemandu lokal",
      "Biaya dasar destinasi",
      "Kapasitas umum destinasi",
    ];
    for (const label of exactNine) {
      expect(view.textContent).toContain(label);
    }

    // 3. Status Mitra is plain inline metadata.
    expect(
      view.querySelector(".dest-readiness__status-meta")?.textContent,
    ).toContain("Aktif");
    expect(
      view.querySelector(".dest-readiness__status-meta .ui-badge"),
    ).toBeNull();
    expect(
      view.querySelector(".dest-readiness__status-meta .status-meta"),
    ).not.toBeNull();
    expect(
      view.querySelector(".dest-readiness__status-meta .inline-status"),
    ).toBeNull();
    expect(view.textContent).toContain(
      "Profil destinasi siap digunakan Travel Organizer",
    );
    expect(view.textContent).toContain(
      "Informasi ini menjadi acuan Travel Organizer saat memilih destinasi dan merancang experience.",
    );
    expect(view.textContent).not.toContain(
      "Aktif sebagai Mitra Destinasi JedaIn",
    );

    // Operational summary cards
    expect(view.textContent).toContain("Biaya dasar");
    expect(view.textContent).toContain("Pemandu lokal");
    expect(view.textContent).toContain("Kapasitas umum");

    // 4. Verification badge page has no obsolete copies
    await act(async () => root.unmount());
    container.remove();

    const badgeView = await renderRoute(
      createElement(DestinationVerificationBadgeScreen),
      "/partner/destination/verification",
      "/partner/destination/verification",
    );

    expect(badgeView.textContent).not.toContain("Terverifikasi Dasar");
    expect(badgeView.textContent).not.toContain("Terverifikasi Plus");
    expect(badgeView.textContent).not.toContain(
      "Pemandu lokal adalah bagian dari syarat",
    );
    expect(badgeView.textContent).not.toContain("Pemandu lokal tersedia");
    expect(badgeView.textContent).toContain("Status Destinasi");
    expect(
      badgeView.querySelector(".dest-verification-single__app-status")
        ?.textContent,
    ).toContain("Disetujui");
    expect(
      badgeView.querySelector(
        ".dest-verification-single__app-status .status-meta",
      ),
    ).not.toBeNull();
    expect(
      badgeView.querySelector(
        ".dest-verification-single__app-status .inline-status",
      ),
    ).toBeNull();
    expect(badgeView.textContent).toContain(
      "Destinasi Anda telah disetujui dan dapat digunakan EO untuk merancang experience.",
    );
  });

  it("5-7. Profile Description Editor: saves to canonical destination, shows success feedback, shows error on invalid short text", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderRoute(
      createElement(DestinationProfileScreen),
      "/partner/destination/profile",
      "/partner/destination/profile",
    );

    // 2x2 Ringkasan layout check
    expect(view.textContent).toContain("Ringkasan");
    expect(view.textContent).toContain("Nama Destinasi");
    expect(view.textContent).toContain("Lokasi");
    expect(view.textContent).toContain("Biaya Dasar");
    expect(view.textContent).toContain("Kapasitas Umum");

    const textarea = view.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Edit deskripsi destinasi"]',
    )!;
    const saveDescBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent === "Simpan deskripsi")!;

    // 7. Invalid short text
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(textarea, "Terlalu pendek");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => saveDescBtn.click());
    expect(view.textContent).toContain(
      "Deskripsi destinasi minimal 20 karakter.",
    );

    // 5 & 6. Valid description save + feedback
    const validDesc =
      "Kawasan alam perkebunan teh yang sangat asri dan tenang di Lereng Batu.";
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(textarea, validDesc);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => saveDescBtn.click());

    expect(view.textContent).toContain("Deskripsi berhasil disimpan");
    expect(mockDestinationStore.getById("dest_lereng_hijau")?.description).toBe(
      validDesc,
    );
  });

  it("8-13. Guide Fee update (Rp150.000) and Cross-Role Same Runtime Synchronization", async () => {
    // 1. Login as Mitra Destinasi
    partnerSessionStore.loginAsDemoDestination();

    const profileView = await renderRoute(
      createElement(DestinationProfileScreen),
      "/partner/destination/profile",
      "/partner/destination/profile",
    );

    // 8 & 9. Mitra saves 150000 via input
    const guideInput = profileView.querySelector<HTMLInputElement>(
      'input[aria-label="Tarif pemandu lokal per orang"]',
    )!;
    const saveGuideBtn = Array.from(
      profileView.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent === "Simpan tarif pemandu")!;

    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(guideInput, "150.000");
      guideInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => saveGuideBtn.click());

    // 10. Success feedback and active rate shown immediately
    expect(profileView.textContent).toContain(
      "Tarif pemandu berhasil disimpan",
    );
    expect(profileView.textContent).toContain("Tarif aktif: Rp150.000 / orang");

    // 11. Switch to EO in SAME RUNTIME
    await act(async () => root.unmount());
    container.remove();
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // EO Destination Detail = Rp150.000
    const eoDestDetail = await renderRoute(
      createElement(EoDestinationDetailScreen),
      "/partner/eo/destinations/:destinationId",
      "/partner/eo/destinations/dest_lereng_hijau",
    );
    expect(eoDestDetail.textContent).toContain("Rp150.000");

    // EO Package Builder Step 1 = Rp150.000
    await act(async () => root.unmount());
    container.remove();

    const eoBuilder = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );
    expect(eoBuilder.textContent).toContain("Rp150.000");

    // EO Builder Step 4 pricing:
    // Destination base: 125.000 + Local guide: 150.000 + EO margin: 150.000 = 425.000
    const steps = Array.from(
      eoBuilder.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    const step4 = steps.find((btn) =>
      btn.textContent?.includes("Skema Harga"),
    )!;
    await act(async () => step4.click());

    expect(eoBuilder.textContent).toContain("Rp125.000");
    expect(eoBuilder.textContent).toContain("Rp150.000");
    expect(eoBuilder.textContent).toContain("Rp425.000");

    // 12. EO source = guide fee contribution 0 (125.000 + 0 + 150.000 = 275.000)
    const step1 = steps.find((btn) =>
      btn.textContent?.includes("Destinasi & Pemandu"),
    )!;
    await act(async () => step1.click());

    const eoGuideRadio =
      eoBuilder.querySelector<HTMLInputElement>('input[value="EO"]')!;
    await act(async () => {
      eoGuideRadio.click();
      eoGuideRadio.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => step4.click());
    expect(eoBuilder.textContent).toContain("Tidak digunakan");
    expect(eoBuilder.textContent).toContain("Rp275.000");
  });

  it("14-20. Facility Media: selection from destination.facilities, validation, grouping in Mitra & EO detail", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderRoute(
      createElement(DestinationProfileScreen),
      "/partner/destination/profile",
      "/partner/destination/profile",
    );

    // 14. Facilities selector exists with destination.facilities
    const select = view.querySelector<HTMLSelectElement>(
      'select[aria-label="Pilih fasilitas"]',
    )!;
    expect(select).not.toBeNull();
    const facilityOptions = Array.from(select.options).map((o) => o.value);
    expect(facilityOptions).toContain("Saung istirahat bambu");
    expect(facilityOptions).toContain("Area parkir kendaraan");

    // 15 & 16. Service validation: FACILITY requires facilityLabel
    const noFac = mockDestinationPartnerService.addGalleryMedia({
      url: SAMPLE_BASE64_PNG,
      label: "Foto tanpa fasilitas",
      category: "FACILITY",
    });
    expect(noFac.success).toBe(false);

    const unknownFacility = mockDestinationPartnerService.addGalleryMedia({
      url: SAMPLE_BASE64_PNG,
      label: "Foto fasilitas tidak terdaftar",
      category: "FACILITY",
      facilityLabel: "Kolam renang fiktif",
    });
    expect(unknownFacility.success).toBe(false);
    expect(unknownFacility.message).toContain(
      "tidak terdaftar pada profil destinasi",
    );

    // Valid upload with facilityLabel
    const added1 = mockDestinationPartnerService.addGalleryMedia({
      url: SAMPLE_BASE64_PNG,
      label: "Foto Parkir 1",
      category: "FACILITY",
      facilityLabel: "Area parkir kendaraan",
    });
    expect(added1.success).toBe(true);
    expect(added1.media?.facilityLabel).toBe("Area parkir kendaraan");

    // 17. Several photos can belong to same facility
    const added2 = mockDestinationPartnerService.addGalleryMedia({
      url: SAMPLE_BASE64_PNG,
      label: "Foto Parkir 2",
      category: "FACILITY",
      facilityLabel: "Area parkir kendaraan",
    });
    expect(added2.success).toBe(true);
    expect(added2.media?.facilityLabel).toBe("Area parkir kendaraan");

    // 18. EO Destination detail groups facility photos by facility
    await act(async () => root.unmount());
    container.remove();

    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const eoDetail = await renderRoute(
      createElement(EoDestinationDetailScreen),
      "/partner/eo/destinations/:destinationId",
      "/partner/eo/destinations/dest_lereng_hijau",
    );

    expect(eoDetail.textContent).toContain("Foto Fasilitas");
    expect(eoDetail.textContent).toContain("Area parkir kendaraan");
    expect(eoDetail.textContent).toContain("Foto Parkir 1");
    expect(eoDetail.textContent).toContain("Foto Parkir 2");
    expect(eoDetail.textContent).toContain("Belum ada foto"); // for unphotographed facilities
  });

  it("21-32. Demand Insight Direction and Autofill: apply, editable, authored protection, reversible unselect", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    const steps = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    const step2 = steps.find((btn) =>
      btn.textContent?.includes("Sinyal Insight"),
    )!;
    await act(async () => step2.click());

    // 21. "Terapkan ke draft" button exists
    const applyBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent === "Terapkan ke draft")!;
    expect(applyBtn).not.toBeNull();

    await act(async () => applyBtn.click());

    // 21 cont. Confirmation banner and selected label
    expect(view.textContent).toContain("Arahan diterapkan ke draft");
    expect(view.textContent).toContain("Arahan digunakan ✓");

    // 22. Empty title autofills from insight
    const titleInput = view.querySelector<HTMLInputElement>("#package-title")!;
    expect(titleInput.value.length).toBeGreaterThan(5);

    // 23. Empty summary autofills
    const summaryInput =
      view.querySelector<HTMLTextAreaElement>("#package-summary")!;
    expect(summaryInput.value).toContain(
      "Experience untuk traveler yang mencari",
    );

    // 24. Duration autofilled
    const durationSelect =
      view.querySelector<HTMLSelectElement>("#package-duration")!;
    expect(durationSelect.value).toBe("1 hari");

    // 25. Itinerary autofills from sampleActivities
    const step3 = steps.find((btn) =>
      btn.textContent?.includes("Perjalanan & Itinerary"),
    )!;
    await act(async () => step3.click());
    const itineraryItems = view.querySelectorAll(".eo-itinerary-item");
    expect(itineraryItems.length).toBeGreaterThanOrEqual(2);

    // 26 & 27. Manually authored title is preserved when changing/re-applying insight
    await act(async () => step2.click());
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(titleInput, "Judul Khusus Buatan EO Sendiri");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // 28. Manually authored summary is preserved
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(summaryInput, "Ringkasan unik dari EO sendiri.");
      summaryInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // 31. Unselect insight does not delete current content
    const unselectBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Arahan digunakan ✓"))!;
    await act(async () => unselectBtn.click());

    expect(titleInput.value).toBe("Judul Khusus Buatan EO Sendiri");
    expect(summaryInput.value).toBe("Ringkasan unik dari EO sendiri.");

    // Re-apply insight: authored fields must NOT be overwritten
    const reapplyBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent === "Terapkan ke draft")!;
    await act(async () => reapplyBtn.click());

    expect(titleInput.value).toBe("Judul Khusus Buatan EO Sendiri");
    expect(summaryInput.value).toBe("Ringkasan unik dari EO sendiri.");

    // 32. Pricing reference sees selected insight while active
    const step4 = steps.find((btn) =>
      btn.textContent?.includes("Skema Harga"),
    )!;
    await act(async () => step4.click());
    expect(view.textContent).toContain("Rentang budget pada insight terpilih");
  });

  it("33. entering Builder from an insight link applies the same editable autofill immediately", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau&insightId=ins_nature_batu_1d",
    );

    const steps = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    const step2 = steps.find((btn) =>
      btn.textContent?.includes("Sinyal Insight"),
    )!;
    await act(async () => step2.click());

    expect(view.textContent).toContain("Arahan yang diterapkan");
    expect(view.textContent).toContain("Arahan diterapkan ke draft");

    const titleInput = view.querySelector<HTMLInputElement>("#package-title")!;
    const summaryInput =
      view.querySelector<HTMLTextAreaElement>("#package-summary")!;
    expect(titleInput.value.trim().length).toBeGreaterThan(5);
    expect(summaryInput.value).toContain(
      "Experience untuk traveler yang mencari",
    );

    const step3 = steps.find((btn) =>
      btn.textContent?.includes("Perjalanan & Itinerary"),
    )!;
    await act(async () => step3.click());
    const activityTitles = Array.from(
      view.querySelectorAll<HTMLInputElement>(
        '.eo-itinerary-item input[type="text"]',
      ),
    ).map((input) => input.value);
    expect(activityTitles.some((value) => value.trim().length > 0)).toBe(true);
    expect(view.textContent).toContain(
      "Aktivitas referensi dari Demand Insight",
    );
  });
});
