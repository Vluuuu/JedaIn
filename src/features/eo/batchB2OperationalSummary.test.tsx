// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationScheduleScreen } from "../destination/DestinationScheduleScreen";
import { EoInsightsScreen } from "./EoInsightsScreen";
import { EoPackageDetailScreen } from "./EoPackageDetailScreen";
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

describe("Batch B2 — Operational Summary & Insight Context", () => {
  describe("P1-E04: EO Operational Summary", () => {
    it("renders comprehensive read-only operational summary on EO Package Detail using existing data", async () => {
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

      // 1. Operational summary header exists
      expect(view.textContent).toContain("Ringkasan Operasional");

      // 2. Destinasi & Lokasi
      expect(view.textContent).toContain("Destinasi & Lokasi");
      expect(view.textContent).toContain("Lereng Hijau Batu");

      // 3. Kapasitas umum destinasi per sesi
      expect(view.textContent).toContain("Kapasitas umum destinasi per sesi");
      expect(view.textContent).toContain("20 orang/sesi");
      expect(view.textContent).toContain("bukan alokasi kuota per sesi");

      // 4. Sumber Pemandu (safe semantic without assignment claim)
      expect(view.textContent).toContain("Sumber Pemandu");
      expect(view.textContent).toContain("Pemandu dari Destinasi");

      // 5. Biaya Dasar Destinasi (per-person semantic)
      expect(view.textContent).toContain("Biaya Dasar Destinasi");
      expect(view.textContent).toContain("Rp125.000 / orang");
      expect(view.textContent).toContain("Harga traveler: Rp275.000 / orang");

      // 6. Alur & Durasi
      expect(view.textContent).toContain("Alur & Durasi");
      expect(view.textContent).toContain("3 aktivitas · 1 hari");

      // 7. Pembaruan Paket (strictly labeled as package update, not latest operational update)
      expect(view.textContent).toContain("Pembaruan Paket");
      expect(view.textContent).not.toContain("latest operational update");
      expect(view.textContent).not.toContain("update operasional terbaru");

      // 8. Catatan operasional destinasi
      expect(view.textContent).toContain("Catatan Operasional Destinasi:");
      expect(view.textContent).toContain(
        "Waktu terbaik berkunjung adalah pukul 07.00–14.00 WIB",
      );

      // 9. No-inference checks: no fake PIC, no individual guide name, no approval workflow
      expect(view.textContent).not.toContain("PIC Operasional");
      expect(view.textContent).not.toContain("Nama Pemandu:");
      expect(view.textContent).not.toContain("Konfirmasi Pengelola Destinasi");
      expect(view.textContent).not.toContain("Minimum Pax");
    });
  });

  describe("P1-M02: Destination Session Operational Summary", () => {
    it("expands concise session operational summary separating venue capacity, EO quota, and confirmed bookings", async () => {
      partnerSessionStore.loginAsDemoDestination();

      const view = await renderComponent(
        createElement(DestinationScheduleScreen),
      );

      // Table shows "Lihat Ringkasan" button
      const expandBtn = Array.from(view.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Lihat Ringkasan"),
      );
      expect(expandBtn).toBeDefined();

      // Click to expand
      await act(async () => {
        expandBtn!.click();
      });

      // Operational summary card is displayed
      expect(view.textContent).toContain("Ringkasan Operasional Sesi");
      expect(view.textContent).toContain("ID Sesi: ses_sgd_1");
      expect(view.textContent).toContain("Paket Experience");
      expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
      expect(view.textContent).toContain("Penyelenggara (EO)");
      expect(view.textContent).toContain("Jeda Alam Nusantara");

      // Clear separation of session quota and general destination capacity
      expect(view.textContent).toContain("Kuota Sesi EO");
      expect(view.textContent).toContain("6 Orang");
      expect(view.textContent).toContain(
        "Kapasitas umum destinasi per sesi: 20 orang",
      );
      expect(view.textContent).toContain("Peserta Terkonfirmasi");
      expect(view.textContent).toContain("Selisih operasional: 6 orang");

      // Sumber pemandu without individual assignment claim
      expect(view.textContent).toContain("Sumber Pemandu Package");
      expect(view.textContent).toContain("Pemandu dari Destinasi");
      expect(view.textContent).toContain(
        "Pilihan sumber pemandu pada rancangan paket",
      );
      expect(view.textContent).not.toContain("Nama Pemandu Individu");
      expect(view.textContent).not.toContain("PIC Venue");
      expect(view.textContent).not.toContain("Konfirmasi Destinasi");

      // Rencana aktivitas summary
      expect(view.textContent).toContain("Rencana Aktivitas");
      expect(view.textContent).toContain(
        "Pagi - Berkumpul & Perjalanan Santai",
      );

      // Safety notes
      expect(view.textContent).toContain("Catatan Keselamatan & Persiapan:");
      expect(view.textContent).toContain("Gunakan sepatu berjalan yang nyaman");

      // Can be closed again
      expect(expandBtn?.textContent).toContain("Tutup");
      await act(async () => {
        expandBtn!.click();
      });
      expect(view.textContent).not.toContain("Ringkasan Operasional Sesi");
    });
  });

  describe("P1-E05: Demand Insight Context", () => {
    it("renders simulation status, reference date, sample size, and distribution interpretation disclaimer", async () => {
      partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

      const view = await renderComponent(createElement(EoInsightsScreen));

      // 1. Simulation status, sample size, and reference date visible
      expect(view.textContent).toContain("Data simulasi prototype");
      expect(view.textContent).toContain("1.020 respons");
      expect(view.textContent).toContain("acuan 5 Sep 2026");

      // 2. Clear distribution boundary disclaimer
      expect(view.textContent).toContain(
        "Distribusi tiap dimensi ditampilkan secara terpisah dan tidak menunjukkan irisan atau kombinasi preferensi antar-dimensi.",
      );

      // 3. Switch to Rincian tab and check disclaimer is also present there
      const tabs = Array.from(view.querySelectorAll(".eo-demand-tab-btn"));
      const rincianTab = tabs.find((t) =>
        t.textContent?.includes("Rincian Data Permintaan"),
      );
      expect(rincianTab).toBeDefined();

      await act(async () => {
        (rincianTab as HTMLButtonElement).click();
      });

      expect(view.textContent).toContain("Rincian Pola Permintaan");
      expect(view.textContent).toContain("acuan 5 Sep 2026");
      expect(view.textContent).toContain(
        "Distribusi tiap dimensi ditampilkan secara terpisah dan tidak menunjukkan irisan atau kombinasi preferensi antar-dimensi.",
      );

      // 4. No fabricated metrics (confidence score, purchase intent, market validation)
      expect(view.textContent).not.toContain("confidence score");
      expect(view.textContent).not.toContain("purchase intent");
      expect(view.textContent).not.toContain("market validation");
      expect(view.textContent).not.toContain("real demand");
    });
  });
});
