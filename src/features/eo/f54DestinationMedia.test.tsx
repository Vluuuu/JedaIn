// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationProfileScreen } from "../destination/DestinationProfileScreen";
import { mockDestinationPartnerService } from "../destination/mockDestinationPartnerService";
import { EoDestinationDetailScreen } from "./EoDestinationDetailScreen";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
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
      "tidak dianggap sebagai foto kondisi aktual",
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
        'input[aria-label="Tambah visual destinasi"]',
      ),
    ).not.toBeNull();
    expect(view.textContent).toContain("Tambah visual");

    const added = mockDestinationPartnerService.addGalleryMedia({
      url: "data:image/png;base64,ZmFrZQ==",
      label: "Foto kebun dari mitra",
    });
    expect(added.success).toBe(true);
    expect(added.media?.provenance).toBe("DESTINATION_SOURCE");

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
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderRoute(
      createElement(EoDestinationDetailScreen),
      "/partner/eo/destinations/:destinationId",
      "/partner/eo/destinations/dest_lereng_hijau",
    );

    expect(view.textContent).toContain("Galeri Visual Destinasi");
    expect(view.textContent).toContain("bukan foto kondisi aktual destinasi");
    expect(view.querySelectorAll(".eo-dest-media-gallery__item")).toHaveLength(
      3,
    );
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
    ).find((button) => button.textContent?.includes("2. Sinyal Insight"));
    expect(stepTwo).toBeDefined();

    await act(async () => {
      stepTwo!.click();
    });

    expect(view.textContent).toContain("Pilih dari galeri destinasi");
    expect(view.textContent).toContain(
      "Atau unggah visual package milik EO sendiri.",
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

    expect(view.textContent).toContain("Ganti foto");

    const galleryAfter =
      mockDestinationStore.getById("dest_lereng_hijau")!.mediaGallery!;
    expect(galleryAfter).toEqual(galleryBefore);
    expect(view.textContent).not.toContain("360");
  });
});
