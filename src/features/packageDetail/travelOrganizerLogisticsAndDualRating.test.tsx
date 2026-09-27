// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { EoPackageBuilderScreen } from "../eo/EoPackageBuilderScreen";
import { EoPackageDetailScreen } from "../eo/EoPackageDetailScreen";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { mockEoPackageStore } from "../eo/mockEoPackageStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { PackageDetailScreen } from "./PackageDetailScreen";
import { mockReviewStore } from "../reviews/mockReviewStore";
import { sessionStore } from "../onboarding/sessionStore";
import type { AuthUser } from "../auth/types";
import { AdminPackageReviewChecklistScreen } from "../admin/AdminPackageReviewChecklistScreen";
import { adminSessionStore } from "../admin/adminSessionStore";
import { MockPackageDetailAdapter } from "./mockAdapter";
import { PROTOTYPE_CANCELLATION_POLICY_SUMMARY } from "./mockPackageDetails";
import type { PackageDetailSource } from "./types";
import { MOCK_RECOMMENDATION_PACKAGES } from "../recommendation/mockPackages";
import type { PackageRecommendationSource } from "../recommendation/types";

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
  mockReviewStore.reset();
  partnerSessionStore.reset();
  sessionStore.reset();
  adminSessionStore.reset();
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

describe("Travel Organizer Logistics, Dual Rating & Terminology Integration", () => {
  it("1. New Builder logistics fields start empty and placeholders are not persisted into draft", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    const steps = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );

    // Navigate to Step 3: Perjalanan & Itinerary
    await act(async () => steps[2].click());

    // Check all logistics inputs start completely empty (not pre-filled with synthetic facts)
    expect(view.querySelector<HTMLInputElement>("#meeting-point")?.value).toBe(
      "",
    );
    expect(view.querySelector<HTMLInputElement>("#departure-time")?.value).toBe(
      "",
    );
    expect(
      view.querySelector<HTMLInputElement>("#outbound-transport")?.value,
    ).toBe("");
    expect(
      view.querySelector<HTMLInputElement>("#return-transport")?.value,
    ).toBe("");
    expect(
      view.querySelector<HTMLTextAreaElement>("#included-items")?.value,
    ).toBe("");
    expect(
      view.querySelector<HTMLTextAreaElement>("#excluded-items")?.value,
    ).toBe("");
    expect(
      view.querySelector<HTMLTextAreaElement>("#safety-notes")?.value,
    ).toBe("");
    expect(
      view.querySelector<HTMLTextAreaElement>("#access-notes")?.value,
    ).toBe("");

    // Step to Step 4: auto-saves current draft
    await act(async () => steps[3].click());

    // Inspect persisted draft in store: must not have synthetic values
    const allDrafts = mockEoPackageStore.getAllPackages();
    const createdDraft = allDrafts[allDrafts.length - 1];
    expect(createdDraft.meetingPointLabel).toBeUndefined();
    expect(createdDraft.departureTimeLabel).toBeUndefined();
    expect(createdDraft.outboundTransport).toBeUndefined();
    expect(createdDraft.returnTransport).toBeUndefined();
    expect(createdDraft.includedItems).toEqual([]);
    expect(createdDraft.excludedItems).toEqual([]);
    expect(createdDraft.safetyNotes).toEqual([]);
  });

  it("2 & 3. Travel Organizer authors full logistics in Step 3, persists across steps, and custom transport inclusion works", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    const steps = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );

    // Navigate to Step 3: Perjalanan & Itinerary
    await act(async () => steps[2].click());

    expect(view.textContent).toContain(
      "Langkah 3: Perjalanan & Alur Itinerary",
    );
    expect(view.textContent).toContain("Pengaturan Perjalanan");

    // Author custom logistics
    const meetingPointInput =
      view.querySelector<HTMLInputElement>("#meeting-point")!;
    const departureTimeInput =
      view.querySelector<HTMLInputElement>("#departure-time")!;
    const outboundTransportInput = view.querySelector<HTMLInputElement>(
      "#outbound-transport",
    )!;
    const returnTransportInput =
      view.querySelector<HTMLInputElement>("#return-transport")!;
    const includedTextarea =
      view.querySelector<HTMLTextAreaElement>("#included-items")!;
    const excludedTextarea =
      view.querySelector<HTMLTextAreaElement>("#excluded-items")!;
    const safetyTextarea =
      view.querySelector<HTMLTextAreaElement>("#safety-notes")!;

    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(meetingPointInput, "Stasiun Kota Malang Pintu Selatan");
      meetingPointInput.dispatchEvent(new Event("input", { bubbles: true }));

      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(
        departureTimeInput,
        "Pukul 07.00 WIB tepat di area drop-off",
      );
      departureTimeInput.dispatchEvent(new Event("input", { bubbles: true }));

      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(
        outboundTransportInput,
        "Shuttle elf ber-AC khusus peserta JedaIn",
      );
      outboundTransportInput.dispatchEvent(
        new Event("input", { bubbles: true }),
      );

      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(
        returnTransportInput,
        "Shuttle kembali ke Stasiun Kota Malang",
      );
      returnTransportInput.dispatchEvent(new Event("input", { bubbles: true }));

      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        includedTextarea,
        "Transportasi PP dari titik kumpul\nTiket kawasan wisata\nPemandu lokal",
      );
      includedTextarea.dispatchEvent(new Event("input", { bubbles: true }));

      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        excludedTextarea,
        "Pengeluaran pribadi\nOleh-oleh belanjaan",
      );
      excludedTextarea.dispatchEvent(new Event("input", { bubbles: true }));

      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        safetyTextarea,
        "Gunakan pakaian hangat dan sepatu berjalan.",
      );
      safetyTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Switch steps to Step 4 then back to Step 3 - values must persist!
    await act(async () => steps[3].click());
    await act(async () => steps[2].click());

    expect(view.querySelector<HTMLInputElement>("#meeting-point")?.value).toBe(
      "Stasiun Kota Malang Pintu Selatan",
    );
    expect(view.querySelector<HTMLInputElement>("#departure-time")?.value).toBe(
      "Pukul 07.00 WIB tepat di area drop-off",
    );
    expect(
      view.querySelector<HTMLInputElement>("#outbound-transport")?.value,
    ).toBe("Shuttle elf ber-AC khusus peserta JedaIn");
    expect(
      view.querySelector<HTMLInputElement>("#return-transport")?.value,
    ).toBe("Shuttle kembali ke Stasiun Kota Malang");
    expect(
      view.querySelector<HTMLTextAreaElement>("#included-items")?.value,
    ).toContain("Transportasi PP dari titik kumpul");
    expect(
      view.querySelector<HTMLTextAreaElement>("#excluded-items")?.value,
    ).not.toContain("Transportasi menuju lokasi");

    // Step 5 preview includes authored travel arrangements
    await act(async () => steps[4].click());
    expect(view.textContent).toContain("Stasiun Kota Malang Pintu Selatan");
    expect(view.textContent).toContain(
      "Shuttle elf ber-AC khusus peserta JedaIn",
    );
    expect(view.textContent).toContain("Transportasi PP dari titik kumpul");
  });

  it("4. Package cannot Submit if mandatory trip logistics are missing, directs to Step 3 with natural errors", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    // Fill Step 2 title & summary
    const steps = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    await act(async () => steps[1].click());

    const titleInput = view.querySelector<HTMLInputElement>("#package-title")!;
    const summaryInput =
      view.querySelector<HTMLTextAreaElement>("#package-summary")!;

    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(titleInput, "Paket Uji Validasi Logistik");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));

      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        summaryInput,
        "Deskripsi paket pengalaman yang valid dan cukup panjang.",
      );
      summaryInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Go directly to Step 5 without filling Step 3 logistics
    await act(async () => steps[4].click());

    // Click submit
    const submitBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent?.includes("Submit untuk Review Admin"))!;
    expect(submitBtn).toBeDefined();

    await act(async () => submitBtn.click());

    // Expect navigation to Step 3 with natural validation errors
    expect(view.textContent).toContain(
      "Langkah 3: Perjalanan & Alur Itinerary",
    );
    expect(view.textContent).toContain("Lengkapi titik kumpul perjalanan.");
    expect(view.textContent).toContain(
      "Lengkapi waktu kumpul atau keberangkatan.",
    );
    expect(view.textContent).toContain(
      "Jelaskan transportasi menuju destinasi.",
    );
    expect(view.textContent).toContain(
      "Jelaskan transportasi kembali setelah kegiatan.",
    );
    expect(view.textContent).toContain(
      "Minimal cantumkan 1 fasilitas atau layanan yang termasuk dalam paket.",
    );
    expect(view.textContent).toContain(
      "Minimal cantumkan 1 catatan operasional atau keselamatan.",
    );
  });

  it("5. Travel Organizer Package Detail renders 'Belum diisi' for unauthored fields", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // Save a draft without logistics
    const draft = mockEoPackageStore.saveDraft({
      title: "Draf Tanpa Logistik",
      shortSummary: "Ringkasan draf yang belum diisi logistiknya.",
      destinationId: "dest_lereng_hijau",
      durationLabel: "1 hari",
    });
    expect(draft.success).toBe(true);

    const view = await renderRoute(
      createElement(EoPackageDetailScreen),
      "/partner/eo/packages/:packageId",
      `/partner/eo/packages/${draft.package!.packageId}`,
    );

    expect(view.textContent).toContain("Titik Kumpul");
    expect(view.textContent).toContain("Belum diisi");
    expect(view.textContent).not.toContain("Area titik kumpul utama kawasan");
    expect(view.textContent).not.toContain(
      "Mengikuti jadwal sesi yang dipilih",
    );
  });

  it("6 & 7. Traveler Package Detail: no departure fallback claim, renders section when only departureTimeLabel present", async () => {
    const customPkg: PackageRecommendationSource = {
      ...MOCK_RECOMMENDATION_PACKAGES[0],
      id: "pkg_custom_logistics",
      title: "Paket Logistik Parsial",
      destinationName: "Lereng Hijau",
      locationLabel: "Batu, Jawa Timur",
      durationType: "FULL_DAY",
      pricePerPerson: 300000,
      status: "LIVE",
      rating: 4.8,
      ratingProvenance: "POST_TRIP",
    };

    const customDetail: PackageDetailSource = {
      packageId: "pkg_custom_logistics",
      valueProposition: "Value prop",
      highlights: ["Highlight 1"],
      itinerary: [{ order: 1, title: "Sesi 1", description: "Desc 1" }],
      includedItems: ["Tiket masuk"],
      excludedItems: ["Belanja"],
      safetyNotes: ["Aman"],
      // ONLY departureTimeLabel is present (no meetingPointLabel, no transports, no accessNotes)
      departureTimeLabel: "Pukul 06.30 WIB dari titik kumpul",
      cancellationPolicySummary: PROTOTYPE_CANCELLATION_POLICY_SUMMARY,
      organizer: {
        id: "org_lereng_batu",
        displayName: "Jeda Alam Nusantara",
        guideStatus: "CERTIFIED_GUIDE",
        roleDescription: "Travel Organizer JedaIn",
      },
      destinationDetail: {
        overviewDescription: "Deskripsi destinasi",
      },
      upcomingSessionPreviews: [
        {
          sessionId: "ses_1",
          packageId: "pkg_custom_logistics",
          startAt: "2026-10-10T08:00:00+07:00",
          endAt: "2026-10-10T14:00:00+07:00",
          status: "OPEN",
          pricePerPerson: 300000,
        },
      ],
    };

    const customAdapter = new MockPackageDetailAdapter({
      packages: [customPkg],
      details: { pkg_custom_logistics: customDetail },
    });

    const view = await renderRoute(
      createElement(PackageDetailScreen, { adapter: customAdapter }),
      "/packages/:packageId",
      "/packages/pkg_custom_logistics",
    );

    // Section must be rendered because departureTimeLabel is present
    expect(view.textContent).toContain("Informasi Titik Kumpul & Akses");
    expect(view.textContent).toContain("Waktu Kumpul / Keberangkatan");
    expect(view.textContent).toContain("Pukul 06.30 WIB dari titik kumpul");

    // Must NOT have old synthetic fallback
    expect(view.textContent).not.toContain(
      "Jam mengikuti jadwal keberangkatan yang dipilih saat memilih sesi.",
    );

    // Titik Kumpul item must NOT be rendered if meetingPointLabel is empty
    const logisticsItems = Array.from(
      view.querySelectorAll(".package-detail-logistics-item"),
    );
    const itemLabels = logisticsItems.map((item) =>
      item
        .querySelector(".package-detail-logistics-label")
        ?.textContent?.trim(),
    );
    expect(itemLabels).not.toContain("Titik Kumpul");
    expect(itemLabels).toContain("Lokasi Kawasan");
    expect(itemLabels).toContain("Waktu Kumpul / Keberangkatan");
  });

  it("8. Traveler Package Detail displays dual trust cards with separate ratings without duplicate clutter below", async () => {
    const traveler: AuthUser = {
      id: "usr_test_dual_rating_clean",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Submit destination review
    mockReviewStore.submitReview({
      bookingId: "bk_clean_dest",
      travelerId: traveler.id,
      targetType: "DESTINATION",
      targetRef: "Lereng Hijau Batu",
      rating: 5,
    });

    // Submit organizer review
    mockReviewStore.submitReview({
      bookingId: "bk_clean_org",
      travelerId: traveler.id,
      targetType: "EO_GUIDE",
      targetRef: "org_lereng_batu",
      rating: 4,
    });

    const view = await renderRoute(
      createElement(PackageDetailScreen),
      "/packages/:packageId",
      "/packages/slow_green_day",
    );

    // Top dual trust cards
    expect(view.textContent).toContain("Destinasi");
    expect(view.textContent).toContain("★ 5.0 · 1 ulasan destinasi");
    expect(view.textContent).toContain("Travel Organizer");
    expect(view.textContent).toContain("★ 4.0 · 1 ulasan pascatrip");

    // Detailed section below: clean, no duplicate ratings, no technical badge explanation
    expect(view.textContent).toContain(
      "Destinasi ini telah melalui proses verifikasi JedaIn.",
    );
    expect(view.textContent).not.toContain("Tentang verifikasi destinasi:");
    expect(view.textContent).not.toContain("Tentang Certified Guide:");
  });

  it("9. Admin review checklist shows authored logistics without synthetic defaults", async () => {
    adminSessionStore.loginAsDemoAdmin();

    const view = await renderRoute(
      createElement(AdminPackageReviewChecklistScreen),
      "/admin/package-approvals/:submissionId",
      "/admin/package-approvals/pkg_pacet_mindful_retreat",
    );

    expect(view.textContent).toContain("Pengaturan Perjalanan & Logistik");
    expect(view.textContent).toContain("Pendopo Utama Lembah Alam Pacet");
    expect(view.textContent).toContain(
      "Shuttle Travel Organizer dari titik kumpul Pacet",
    );
    expect(view.textContent).toContain(
      "Transportasi PP dari titik kumpul Pacet",
    );
  });
});
