// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationProfileScreen } from "../destination/DestinationProfileScreen";
import { mockDestinationStore } from "../eo/mockDestinationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import {
  getDestinationVisual,
  getPackageVisual,
} from "../../lib/assets/packageImages";
import { MockPackageDetailAdapter } from "./mockAdapter";
import { PackageDetailScreen } from "./PackageDetailScreen";
import type { PackageDetailSource } from "./types";
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

const basePkg: PackageRecommendationSource = {
  id: "pkg_logistics_demo",
  title: "Paket Wisata Mindful",
  shortSummary: "Summary singkat",
  destinationName: "Lereng Hijau Batu",
  locationLabel: "Batu / Malang Raya",
  visualAsset: "",
  status: "LIVE",
  verificationLevel: "BASIC",
  pricePerPerson: 250000,
  durationType: "HALF_DAY",
  departureAreas: ["MALANG"],
  experienceIntents: ["NATURE"],
  activityTags: ["NATURE_SCENERY"],
  suitableGroupTypes: ["SOLO"],
  suitableGroupSizeBands: ["ONE"],
  rating: 4.8,
  popularityRank: 1,
};

const baseDetail: PackageDetailSource = {
  packageId: "pkg_logistics_demo",
  valueProposition: "Value prop",
  highlights: ["Highlight 1"],
  itinerary: [
    {
      order: 1,
      title: "Aktivitas 1",
      description: "Desc",
      timeOfDayLabel: "Pagi",
      durationLabel: "1 jam",
    },
  ],
  includedItems: ["Item 1"],
  excludedItems: ["Item 2"],
  safetyNotes: ["Catatan aman"],
  cancellationPolicySummary: "Kebijakan pembatalan",
  organizer: {
    id: "org_demo",
    displayName: "EO Mindful",
    guideStatus: "CERTIFIED_GUIDE",
    roleDescription: "EO",
    bioSummary: "Bio",
  },
  destinationDetail: {
    overviewDescription: "Deskripsi destinasi",
  },
  upcomingSessionPreviews: [
    {
      sessionId: "ses_demo_1",
      packageId: "pkg_logistics_demo",
      startAt: "2026-10-01T08:00:00+07:00",
      endAt: "2026-10-01T12:00:00+07:00",
      status: "OPEN",
      pricePerPerson: 250000,
      remainingSlots: 5,
    },
  ],
};

describe("Batch C1 — Media Source Consistency & Traveler Logistics", () => {
  describe("MEDIA: P1-T01 & P1-M03 Destination Media Consistency", () => {
    it("1. Uses package custom visual when present", () => {
      const customUri = "data:image/svg+xml;utf8,<svg id='custom-pkg'></svg>";
      const visual = getPackageVisual(
        "pkg_custom",
        "Lereng Hijau Batu",
        customUri,
      );
      expect(visual.svgDataUri).toBe(customUri);
    });

    it("2. Falls back to destination visual if package has no custom visual", () => {
      const visual = getPackageVisual("pkg_no_visual", "Lereng Hijau Batu", "");
      expect(visual.svgDataUri).toBe(
        getDestinationVisual("Lereng Hijau Batu").svgDataUri,
      );
    });

    it("3. Falls back to neutral illustration if destination name is unknown", () => {
      const visual = getPackageVisual("pkg_unknown", "Unknown Venue X", "");
      expect(visual.id).toBe("neutral_jedain_placeholder");
    });

    it("4. Fallback visual does not claim to be actual/latest photo", async () => {
      const adapter = new MockPackageDetailAdapter({
        packages: [basePkg],
        details: { pkg_logistics_demo: baseDetail },
      });

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen, { adapter }),
          }),
        ),
        ["/packages/pkg_logistics_demo"],
      );

      const heroImg = view.querySelector<HTMLImageElement>(
        "img.package-detail-hero__visual",
      );
      expect(heroImg).toBeDefined();
      expect(heroImg?.getAttribute("alt")).toContain("Ilustrasi suasana");
      expect(view.textContent).not.toContain("foto aktual");
      expect(view.textContent).not.toContain("kondisi terbaru");
    });

    it("5. Mitra Destination Profile reads destination.imageUrl when present", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationProfileScreen),
      );
      const profileImg = view.querySelector<HTMLImageElement>(
        ".dest-identity__media img",
      );
      expect(profileImg).toBeDefined();
      // Lereng Hijau Batu has destination.imageUrl data URI in MOCK_DESTINATION_DIRECTORY
      const destRecord = mockDestinationStore.getById("dest_lereng_hijau");
      expect(profileImg?.getAttribute("src")).toBe(destRecord?.imageUrl);
    });
  });

  describe("GALLERY: judge-facing prototype clarity", () => {
    it("renders three selectable prototype-safe gallery views without claiming actual photos", async () => {
      const adapter = new MockPackageDetailAdapter({
        packages: [basePkg],
        details: { pkg_logistics_demo: baseDetail },
      });

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen, { adapter }),
          }),
        ),
        ["/packages/pkg_logistics_demo"],
      );

      expect(view.textContent).toContain("Galeri suasana");
      expect(view.textContent).toContain("Lihat gambaran pengalaman");
      expect(view.textContent).toContain(
        "Visual suasana pada prototype untuk memberi gambaran experience, bukan dokumentasi kondisi aktual destinasi.",
      );

      const galleryButtons = view.querySelectorAll<HTMLButtonElement>(
        ".package-detail-gallery__thumb",
      );
      expect(galleryButtons).toHaveLength(3);
      expect(galleryButtons[0]?.getAttribute("aria-pressed")).toBe("true");
      expect(galleryButtons[1]?.getAttribute("aria-pressed")).toBe("false");

      await act(async () => {
        galleryButtons[1]?.click();
      });

      expect(galleryButtons[0]?.getAttribute("aria-pressed")).toBe("false");
      expect(galleryButtons[1]?.getAttribute("aria-pressed")).toBe("true");
      expect(view.textContent).toContain("2/3");
      expect(view.textContent).not.toContain("foto aktual");
      expect(view.textContent).not.toContain("kondisi terbaru");
    });
  });

  describe("LOGISTICS: P1-T02 Traveler Logistics & Meeting Point", () => {
    it("1 & 3. Renders meeting point and access notes when present", async () => {
      const adapter = new MockPackageDetailAdapter({
        packages: [basePkg],
        details: {
          pkg_logistics_demo: {
            ...baseDetail,
            meetingPointLabel: "Gerbang Masuk Lereng Hijau",
            accessNotes: ["Dapat diakses motor dan mobil pribadi."],
          },
        },
      });

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen, { adapter }),
          }),
        ),
        ["/packages/pkg_logistics_demo"],
      );

      expect(view.textContent).toContain("Informasi Titik Kumpul & Akses");
      expect(view.textContent).toContain("Gerbang Masuk Lereng Hijau");
      expect(view.textContent).toContain(
        "Dapat diakses motor dan mobil pribadi.",
      );
      expect(view.textContent).toContain(
        "Lereng Hijau Batu, Batu / Malang Raya",
      );
    });

    it("2. Does NOT fabricate meeting point or access notes when fields are empty", async () => {
      const adapter = new MockPackageDetailAdapter({
        packages: [basePkg],
        details: {
          pkg_logistics_demo: {
            ...baseDetail,
            meetingPointLabel: undefined,
            accessNotes: undefined,
          },
        },
      });

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen, { adapter }),
          }),
        ),
        ["/packages/pkg_logistics_demo"],
      );

      // Logistics section should not be rendered if meeting point and access notes are missing
      expect(view.textContent).not.toContain("Informasi Titik Kumpul & Akses");
      expect(view.textContent).not.toContain("Titik Kumpul");
    });

    it("4 & 5. Session departure time explicitly defers to chosen session schedule without map/GPS assumptions", async () => {
      const adapter = new MockPackageDetailAdapter({
        packages: [basePkg],
        details: {
          pkg_logistics_demo: {
            ...baseDetail,
            meetingPointLabel: "Titik Kumpul Demo",
          },
        },
      });

      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen, { adapter }),
          }),
        ),
        ["/packages/pkg_logistics_demo"],
      );

      expect(view.textContent).toContain(
        "Jam mengikuti jadwal keberangkatan yang dipilih saat memilih sesi.",
      );
      expect(view.textContent).not.toContain("GPS");
      expect(view.textContent).not.toContain("Google Maps");
      expect(view.textContent).not.toContain("Titik Koordinat");
    });
  });
});
