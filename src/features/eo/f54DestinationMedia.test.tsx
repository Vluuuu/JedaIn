// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationProfileScreen } from "../destination/DestinationProfileScreen";
import { DestinationOverviewScreen } from "../destination/DestinationOverviewScreen";
import { mockDestinationPartnerService } from "../destination/mockDestinationPartnerService";
import { buildTravelerPackageFromEo } from "../marketplace/marketplaceAdapter";
import { PackageHero } from "../packageDetail/PackageHero";
import { EoDestinationDetailScreen } from "./EoDestinationDetailScreen";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";
import { mockDestinationStore } from "./mockDestinationStore";
import {
  mockEoPackageStore,
  SEEDED_LIVE_PACKAGE,
  validateEoPackage,
} from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";

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

describe("F5.4 — Destination Media & Package Visual Choice", () => {
  it("1. canonical destination exposes a cloned prototype-safe gallery", () => {
    const first = mockDestinationStore.getById("dest_lereng_hijau")!;
    expect(first.mediaGallery).toHaveLength(3);
    expect(
      first.mediaGallery?.every(
        (media) => media.provenance === "PROTOTYPE_ILLUSTRATION",
      ),
    ).toBe(true);

    first.mediaGallery?.push({
      mediaId: "mutated",
      url: "data:image/svg+xml;utf8,<svg></svg>",
      label: "Mutated",
      provenance: "PROTOTYPE_ILLUSTRATION",
    });

    const reread = mockDestinationStore.getById("dest_lereng_hijau")!;
    expect(reread.mediaGallery).toHaveLength(3);
  });

  it("2. Mitra profile shows destination gallery with explicit prototype provenance", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderRoute(
      createElement(DestinationProfileScreen),
      "/partner/destination/profile",
      "/partner/destination/profile",
    );

    expect(view.textContent).toContain("Galeri Destinasi");
    expect(view.textContent).toContain(
      "Visual prototype bawaan tetap diberi label",
    );
    expect(view.querySelectorAll(".dest-media-gallery__item")).toHaveLength(3);
    expect(view.textContent).toContain("Visual prototype");
    expect(view.textContent).not.toContain("Preview 360");
  });

  it("2b. Mitra can add and remove its own gallery media while prototype visuals stay protected", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderRoute(
      createElement(DestinationProfileScreen),
      "/partner/destination/profile",
      "/partner/destination/profile",
    );

    expect(
      view.querySelector<HTMLInputElement>(
        'input[aria-label="Tambah foto destinasi"]',
      ),
    ).not.toBeNull();
    expect(view.textContent).toContain("Tambah foto destinasi");

    const added = mockDestinationPartnerService.addGalleryMedia({
      url: "data:image/png;base64,ZmFrZQ==",
      label: "Foto kebun dari mitra",
    });
    expect(added.success).toBe(true);
    expect(added.media?.provenance).toBe("DESTINATION_SOURCE");

    expect(
      mockDestinationPartnerService.addGalleryMedia({
        url: "data:text/plain;base64,ZmFrZQ==",
        label: "Invalid",
      }).success,
    ).toBe(false);
    expect(
      mockDestinationPartnerService.addGalleryMedia({
        url: `data:image/png;base64,${"A".repeat(7 * 1024 * 1024)}`,
        label: "Too large",
      }).success,
    ).toBe(false);

    const afterAdd =
      mockDestinationStore.getById("dest_lereng_hijau")!.mediaGallery!;
    expect(afterAdd).toHaveLength(4);
    expect(afterAdd.at(-1)?.label).toBe("Foto kebun dari mitra");

    const protectedRemove = mockDestinationPartnerService.removeGalleryMedia(
      "media_lereng_primary",
    );
    expect(protectedRemove.success).toBe(false);

    const removed = mockDestinationPartnerService.removeGalleryMedia(
      added.media!.mediaId,
    );
    expect(removed.success).toBe(true);
    expect(
      mockDestinationStore.getById("dest_lereng_hijau")!.mediaGallery,
    ).toHaveLength(3);
  });

  it("3. EO destination detail exposes the same gallery as decision context", async () => {
    partnerSessionStore.loginAsDemoDestination();
    const added = mockDestinationPartnerService.addGalleryMedia({
      url: "data:image/png;base64,ZmFrZQ==",
      label: "Visual terbaru Mitra",
    });
    expect(added.success).toBe(true);
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoDestinationDetailScreen),
      "/partner/eo/destinations/:destinationId",
      "/partner/eo/destinations/dest_lereng_hijau",
    );

    expect(view.textContent).toContain("Galeri Destinasi");
    expect(view.textContent).toContain("bukan foto kondisi aktual destinasi");
    expect(view.querySelectorAll(".eo-dest-media-gallery__item")).toHaveLength(
      4,
    );
    expect(view.textContent).toContain("Visual terbaru Mitra");
    expect(view.textContent).not.toContain("360");
  });

  it("4. EO Builder can choose destination media as package cover while own upload remains available", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    const stepTwo = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((button) => button.textContent?.includes("Sinyal Insight"));
    expect(stepTwo).toBeDefined();

    await act(async () => {
      stepTwo!.click();
    });

    expect(view.textContent).toContain("Pilih dari galeri destinasi");
    expect(view.textContent).toContain(
      "Pilihan galeri dapat digabung dengan foto milik EO sendiri.",
    );

    const options = view.querySelectorAll<HTMLButtonElement>(
      ".eo-builder-destination-media__option",
    );
    expect(options).toHaveLength(3);
    expect(options[1]?.getAttribute("aria-pressed")).toBe("false");

    const galleryBefore =
      mockDestinationStore.getById("dest_lereng_hijau")!.mediaGallery!;

    await act(async () => {
      options[1]?.click();
    });

    const refreshedOptions = view.querySelectorAll<HTMLButtonElement>(
      ".eo-builder-destination-media__option",
    );
    expect(refreshedOptions[1]?.getAttribute("aria-pressed")).toBe("true");

    const preview = view.querySelector<HTMLImageElement>(
      ".eo-builder-img-preview",
    );
    expect(preview?.getAttribute("src")).toBe(galleryBefore[1]?.url);

    expect(view.textContent).toContain("Jadikan cover");

    const galleryAfter =
      mockDestinationStore.getById("dest_lereng_hijau")!.mediaGallery!;
    expect(galleryAfter).toEqual(galleryBefore);
    expect(view.textContent).not.toContain("360");
  });

  it("5. Mitra updates description and guide fee, manages both media categories beyond six items, and EO reads the same data", async () => {
    partnerSessionStore.loginAsDemoDestination();
    const overview = await renderRoute(
      createElement(DestinationOverviewScreen),
      "/partner/destination",
      "/partner/destination",
    );
    expect(overview.textContent).toContain("Lihat 9 informasi inti");
    for (const label of [
      "Nama destinasi",
      "Lokasi",
      "Deskripsi destinasi",
      "Aktivitas yang tersedia",
      "Fasilitas destinasi",
      "Catatan operasional",
      "Informasi pemandu lokal",
      "Biaya dasar destinasi",
      "Kapasitas umum destinasi",
    ])
      expect(overview.textContent).toContain(label);
    expect(overview.textContent).not.toContain("Terverifikasi Dasar");
    expect(overview.textContent).not.toContain("Terverifikasi Plus");

    expect(
      mockDestinationPartnerService.updateDescription("terlalu pendek").success,
    ).toBe(false);
    const description =
      "  Jalur kebun dan saung teduh tersedia untuk aktivitas santai.  ";
    expect(
      mockDestinationPartnerService.updateDescription(description).success,
    ).toBe(true);
    expect(
      mockDestinationPartnerService.updateLocalGuideFee(35000).success,
    ).toBe(true);
    expect(mockDestinationPartnerService.updateLocalGuideFee(-1).success).toBe(
      false,
    );
    expect(mockDestinationStore.getById("dest_lereng_hijau")?.description).toBe(
      description.trim(),
    );
    expect(
      mockDestinationStore.getById("dest_lereng_hijau")?.localGuideFeePerPerson,
    ).toBe(35000);

    for (let index = 0; index < 7; index += 1) {
      const added = mockDestinationPartnerService.addGalleryMedia({
        url: "data:image/png;base64,ZmFrZQ==",
        label: `Foto kawasan ${index}`,
        category: "DESTINATION",
      });
      expect(added.success).toBe(true);
    }
    const facility = mockDestinationPartnerService.addGalleryMedia({
      url: "data:image/webp;base64,ZmFrZQ==",
      label: "Saung Mitra",
      category: "FACILITY",
    });
    expect(facility.success).toBe(true);
    expect(
      mockDestinationStore.getById("dest_lereng_hijau")?.mediaGallery,
    ).toHaveLength(11);
    expect(facility.media?.category).toBe("FACILITY");
    expect(
      mockDestinationPartnerService.removeGalleryMedia("media_lereng_primary")
        .success,
    ).toBe(false);

    await act(async () => root.unmount());
    overview.remove();
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const detail = await renderRoute(
      createElement(EoDestinationDetailScreen),
      "/partner/eo/destinations/:destinationId",
      "/partner/eo/destinations/dest_lereng_hijau",
    );
    expect(detail.textContent).toContain(description.trim());
    expect(detail.textContent).toContain("Rp35.000");
    expect(detail.textContent).toContain("Galeri Destinasi");
    expect(detail.textContent).toContain("Foto Fasilitas");
  });

  it("6. EO media selection supports multiple gallery photos, own upload, cover choice and removal", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );
    const stepTwo = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((button) => button.textContent?.includes("Sinyal Insight"))!;
    await act(async () => stepTwo.click());
    const options = view.querySelectorAll<HTMLButtonElement>(
      ".eo-builder-destination-media__option",
    );
    await act(async () => {
      options[0].click();
      options[1].click();
    });
    expect(view.textContent).toContain("Media terpilih (2)");
    expect(options[0].getAttribute("aria-pressed")).toBe("true");
    expect(options[1].getAttribute("aria-pressed")).toBe("true");

    const fileInput = view.querySelector<HTMLInputElement>(
      ".eo-builder-file-input",
    )!;
    const ownUrl = "data:image/png;base64,b3du";
    class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      readAsDataURL() {
        this.onload?.({ target: { result: ownUrl } });
      }
    }
    const originalFileReader = globalThis.FileReader;
    Object.assign(globalThis, { FileReader: MockFileReader });
    try {
      await act(async () => {
        Object.defineProperty(fileInput, "files", {
          value: [new File(["own"], "own.png", { type: "image/png" })],
          configurable: true,
        });
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(view.textContent).toContain("Media terpilih (3)");
      const ownItem = Array.from(
        view.querySelectorAll<HTMLElement>(".eo-builder-selected-media__item"),
      ).find(
        (item) => item.querySelector("img")?.getAttribute("src") === ownUrl,
      )!;
      await act(async () =>
        ownItem.querySelector<HTMLButtonElement>("button")!.click(),
      );
      expect(ownItem.textContent).toContain("Cover package");
      await act(async () => options[0].click());
      expect(view.textContent).toContain("Media terpilih (2)");
    } finally {
      Object.assign(globalThis, { FileReader: originalFileReader });
    }
  });

  it("7. saved package media and traveler gallery retain the selected cover and distinct photos", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const draft = mockEoPackageStore.saveDraft({
      destinationId: "dest_lereng_hijau",
      guideSource: "DESTINATION",
      imageUrls: ["data:image/png;base64,YQ==", "data:image/png;base64,Yg=="],
      imageUrl: "data:image/png;base64,Yg==",
    });
    expect(draft.success).toBe(true);
    expect(draft.package?.imageUrls).toHaveLength(2);
    expect(draft.package?.imageUrl).toBe("data:image/png;base64,Yg==");
    expect(draft.package?.pricing).toMatchObject({
      destinationBaseCost: 125000,
      localGuideFee: 25000,
      eoMargin: 150000,
      customerPrice: 300000,
    });
    const traveler = buildTravelerPackageFromEo({
      ...SEEDED_LIVE_PACKAGE,
      imageUrls: draft.package!.imageUrls,
      imageUrl: draft.package!.imageUrl,
    })!;
    expect(traveler.visualAssets).toEqual([
      "data:image/png;base64,Yg==",
      "data:image/png;base64,YQ==",
    ]);
    const hero = await renderRoute(
      createElement(PackageHero, { packageData: traveler }),
      "/package-hero",
      "/package-hero",
    );
    const thumbs = hero.querySelectorAll<HTMLButtonElement>(
      ".package-detail-gallery__thumb",
    );
    expect(thumbs).toHaveLength(2);
    expect(
      hero
        .querySelector<HTMLImageElement>(".package-detail-hero__visual")
        ?.getAttribute("src"),
    ).toBe("data:image/png;base64,Yg==");
    await act(async () => thumbs[1].click());
    expect(
      hero
        .querySelector<HTMLImageElement>(".package-detail-hero__visual")
        ?.getAttribute("src"),
    ).toBe("data:image/png;base64,YQ==");
  });

  it("8. guide pricing and seeded sessions use the selected guide source", () => {
    expect(
      validateEoPackage(SEEDED_LIVE_PACKAGE, "CERTIFIED_GUIDE").valid,
    ).toBe(true);
    const eoGuidePackage = {
      ...SEEDED_LIVE_PACKAGE,
      guideSource: "EO" as const,
      pricing: {
        destinationBaseCost: 125000,
        localGuideFee: 0,
        eoMargin: 150000,
        customerPrice: 275000,
      },
    };
    expect(validateEoPackage(eoGuidePackage, "CERTIFIED_GUIDE").valid).toBe(
      true,
    );
    expect(
      validateEoPackage(
        {
          ...eoGuidePackage,
          pricing: { ...eoGuidePackage.pricing, localGuideFee: 25000 },
        },
        "CERTIFIED_GUIDE",
      ).valid,
    ).toBe(false);
    expect(SEEDED_LIVE_PACKAGE.pricing.customerPrice).toBe(300000);
    expect(
      mockEoPackageStore
        .getSessionsByPackage("slow_green_day")
        .every((session) => session.pricePerPerson === 300000),
    ).toBe(true);
  });

  it("9. Builder reflects updated Mitra fee and shows insight as a reversible brief with one step number", async () => {
    partnerSessionStore.loginAsDemoDestination();
    expect(
      mockDestinationPartnerService.updateLocalGuideFee(35000).success,
    ).toBe(true);
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );
    expect(view.textContent).toContain("Rp35.000");
    const steps = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    const step3 = steps.find((button) =>
      button.textContent?.includes("Rencana Itinerary"),
    )!;
    expect(step3.querySelector(".eo-step-badge")?.textContent).toBe("3");
    expect(step3.textContent?.match(/3/g)).toHaveLength(1);
    expect(step3.textContent).not.toContain("3. Rencana Itinerary");

    await act(async () => steps[1].click());
    const titleInput = view.querySelector<HTMLInputElement>(
      'input[placeholder*="Sehari Pelan"]',
    )!;
    const summaryInput =
      view.querySelector<HTMLTextAreaElement>("#package-summary")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(titleInput, "Judul buatan EO");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        summaryInput,
        "Ringkasan buatan EO yang tetap dipertahankan.",
      );
      summaryInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const insightButton = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Pakai sebagai arahan")!;
    await act(async () => insightButton.click());
    for (const copy of [
      "Insight ini dipakai untuk",
      "Kebutuhan traveler",
      "Area target",
      "Durasi referensi",
      "Preferensi budget",
      "Ide dari insight",
    ]) {
      expect(view.textContent).toContain(copy);
    }
    expect(titleInput.value).toBe("Judul buatan EO");
    expect(summaryInput.value).toBe(
      "Ringkasan buatan EO yang tetap dipertahankan.",
    );
    await act(async () => steps[3].click());
    expect(view.textContent).toContain("Rentang budget pada insight terpilih");
    expect(
      mockEoPackageStore.getAllPackages().some((pkg) => pkg.insightId),
    ).toBe(true);
    await act(async () => steps[1].click());
    const selectedButton = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.includes("Dipakai sebagai arahan"))!;
    await act(async () => selectedButton.click());
    expect(view.querySelector(".eo-insight-brief")).toBeNull();
    expect(titleInput.value).toBe("Judul buatan EO");
    expect(summaryInput.value).toBe(
      "Ringkasan buatan EO yang tetap dipertahankan.",
    );
  });
});
