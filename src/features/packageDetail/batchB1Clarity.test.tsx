// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationCapacityScreen } from "../destination/DestinationCapacityScreen";
import { DestinationOverviewScreen } from "../destination/DestinationOverviewScreen";
import { DestinationScheduleScreen } from "../destination/DestinationScheduleScreen";
import { EoDestinationDetailScreen } from "../eo/EoDestinationDetailScreen";
import { EoDestinationsScreen } from "../eo/EoDestinationsScreen";
import { EoPackageBuilderScreen } from "../eo/EoPackageBuilderScreen";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { PackageDetailScreen } from "./PackageDetailScreen";
import { SessionSelectionScreen } from "../sessionSelection/SessionSelectionScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
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

describe("Batch B1 — Existing-Data Clarity Improvements", () => {
  describe("P1-T03: Traveler Session Slot & Date Clarity", () => {
    it("Package Detail and Session Selection display explicit session slot label and distinction note", async () => {
      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen),
          }),
        ),
        ["/packages/slow_green_day"],
      );

      // Section description clarifies quota vs venue capacity
      expect(view.textContent).toContain("kuota peserta per sesi perjalanan");
      expect(view.textContent).toContain(
        "terpisah dari kapasitas umum kawasan destinasi",
      );
      // Remaining slot explicit label
      expect(view.textContent).toContain("Sisa 6 slot (kuota sesi)");

      // Session Selection screen
      const sessionView = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId/sessions",
            element: createElement(SessionSelectionScreen),
          }),
        ),
        ["/packages/slow_green_day/sessions"],
      );

      expect(sessionView.textContent).toContain(
        "kuota peserta per sesi perjalanan",
      );
      expect(sessionView.textContent).toContain("Sisa 6 slot (kuota sesi)");
    });
  });

  describe("P1-T04: Trust Badge Explanation", () => {
    it("Package Detail renders concise non-promissory trust badge explanations inline", async () => {
      const view = await renderComponent(
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/packages/:packageId",
            element: createElement(PackageDetailScreen),
          }),
        ),
        ["/packages/slow_green_day"],
      );

      // Destination verification explanation
      expect(view.textContent).toContain("Tentang Terverifikasi Dasar:");
      expect(view.textContent).toContain(
        "bukan konfirmasi ketersediaan tanggal/sesi",
      );

      // Guide status explanation
      expect(view.textContent).toContain("Tentang Certified Guide:");
      expect(view.textContent).toContain(
        "Penugasan individu pemandu disesuaikan pada pelaksanaan sesi",
      );
    });
  });

  describe("P1-E02 & P1-E03: EO Destination Capacity & Guide Context", () => {
    it("EO Destination Catalog and Detail clarify general venue capacity and guide capability", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      // Destination catalog
      const catalogView = await renderComponent(
        createElement(EoDestinationsScreen),
      );
      expect(catalogView.textContent).toContain(
        "Kapasitas umum destinasi: 20 orang/sesi",
      );
      expect(catalogView.textContent).toContain(
        "Batas daya tampung lokasi venue, bukan kuota otomatis per paket EO",
      );

      // Destination detail
      const detailView = await renderComponent(
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

      expect(detailView.textContent).toContain("Daya tampung umum venue");
      expect(detailView.textContent).toContain("20 orang/sesi");
      expect(detailView.textContent).toContain(
        "Alokasi kuota paket aktual ditentukan saat EO membuka jadwal sesi",
      );
      expect(detailView.textContent).toContain(
        "bukan penugasan individu pemandu untuk jadwal tertentu",
      );
    });

    it("Package Builder displays guide responsibility note", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const builderView = await renderComponent(
        createElement(EoPackageBuilderScreen),
      );
      expect(builderView.textContent).toContain(
        "Sumber pemandu menentukan pihak penanggung jawab kepemanduan di lapangan, bukan penugasan individu pemandu per jadwal sesi",
      );
    });
  });

  describe("P1-M01: Mitra General Capacity vs Session Allocation", () => {
    it("Destination Overview, Capacity, and Schedule clearly distinguish venue capacity, EO quota, and confirmed bookings", async () => {
      partnerSessionStore.loginAsDemoDestination();

      // Overview screen
      const overviewView = await renderComponent(
        createElement(DestinationOverviewScreen),
      );
      expect(overviewView.textContent).toContain("Kapasitas Umum Venue");
      expect(overviewView.textContent).toContain("Daya tampung fisik per sesi");
      expect(overviewView.textContent).toContain("Peserta Terkonfirmasi");

      // Capacity screen
      const capView = await renderComponent(
        createElement(DestinationCapacityScreen),
      );
      expect(capView.textContent).toContain("Batas Kapasitas Venue");
      expect(capView.textContent).toContain(
        "Perbedaan konsep: (1) Batas Venue",
      );
      expect(capView.textContent).toContain("Daya tampung venue");
      expect(capView.textContent).toContain("Kuota sesi EO");
      expect(capView.textContent).toContain("Booking terbayar");

      // Schedule screen
      const schedView = await renderComponent(
        createElement(DestinationScheduleScreen),
      );
      expect(schedView.textContent).toContain(
        "Alokasi kuota per sesi merupakan kapasitas trip yang dibuka EO, terpisah dari daya tampung umum venue",
      );
      expect(schedView.textContent).toContain("Kuota sesi EO");
      expect(schedView.textContent).toContain("Booking terbayar");
    });
  });
});
