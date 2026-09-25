// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { DestinationOverviewScreen } from "./DestinationOverviewScreen";

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
  initialEntries = ["/partner/destination"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(createElement(MemoryRouter, { initialEntries }, element));
  });
  return container;
}

describe("F3.3 — Mitra Destination Overview Quick Actions", () => {
  it("1. renders one compact Quick Actions surface directly after metric band with proper heading and copy", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(
      createElement(DestinationOverviewScreen),
    );

    // Quick Actions section exists
    const quickActionsSection = view.querySelector(".dest-quick-actions");
    expect(quickActionsSection).not.toBeNull();

    // Placed directly after metric band
    const metricBand = view.querySelector(".dest-metric-band");
    expect(metricBand).not.toBeNull();
    expect(metricBand?.nextElementSibling).toBe(quickActionsSection);

    // Section heading and supporting copy
    expect(quickActionsSection?.textContent).toContain("Akses Cepat");
    expect(quickActionsSection?.textContent).toContain(
      "Buka rincian operasional destinasi tanpa mengubah kewenangan sesi EO.",
    );
  });

  it("2 & 3. exposes exactly the 4 canonical actions with exact labels and route targets", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(
      createElement(DestinationOverviewScreen),
    );

    const quickActionsSection = view.querySelector(".dest-quick-actions")!;
    const links = Array.from(
      quickActionsSection.querySelectorAll<HTMLAnchorElement>(
        "a.dest-quick-action-card",
      ),
    );

    expect(links).toHaveLength(4);

    const expectedActions = [
      {
        label: "Lihat Jadwal",
        to: "/partner/destination/schedule",
      },
      {
        label: "Lihat Rincian Kapasitas",
        to: "/partner/destination/capacity",
      },
      {
        label: "Lihat Profil Destinasi",
        to: "/partner/destination/profile",
      },
      {
        label: "Lihat Semua Ulasan",
        to: "/partner/destination/reviews",
      },
    ];

    expectedActions.forEach(({ label, to }, index) => {
      const link = links[index];
      expect(link.getAttribute("href")).toBe(to);

      const labelEl = link.querySelector(".dest-quick-action-card__label");
      expect(labelEl?.textContent).toContain(label);
    });
  });

  it("4. Quick Actions remain present and functional when upcoming-session and review data is empty", async () => {
    partnerSessionStore.setPartner({
      id: "dest_partner_trawas_bambu",
      email: "partner@trawas.id",
      name: "Pengelola Trawas",
      role: "DESTINATION",
      businessName: "Pengelola Bambu Trawas",
      destinationIdentityId: "dest_hutan_trawas",
    });

    const view = await renderComponent(
      createElement(DestinationOverviewScreen),
    );

    // Confirms empty state for sessions and reviews
    expect(view.textContent).toContain(
      "Belum ada jadwal keberangkatan mendatang.",
    );
    expect(view.textContent).toContain("Belum ada ulasan destinasi.");

    // Quick Actions section is still present with all 4 actions
    const quickActionsSection = view.querySelector(".dest-quick-actions");
    expect(quickActionsSection).not.toBeNull();

    const links = Array.from(
      quickActionsSection!.querySelectorAll<HTMLAnchorElement>(
        "a.dest-quick-action-card",
      ),
    );
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/partner/destination/schedule",
      "/partner/destination/capacity",
      "/partner/destination/profile",
      "/partner/destination/reviews",
    ]);
  });

  it("5. no action implies unauthorized Mitra authority (strictly read-only navigation)", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(
      createElement(DestinationOverviewScreen),
    );

    const quickActionsSection = view.querySelector(".dest-quick-actions")!;
    const text = quickActionsSection.textContent ?? "";

    // Forbidden authority terms
    expect(text).not.toContain("Approve");
    expect(text).not.toContain("Setujui");
    expect(text).not.toContain("Ubah Kuota");
    expect(text).not.toContain("Kelola Sesi");
    expect(text).not.toContain("Kelola Sesi EO");
    expect(text).not.toContain("Atur kuota");
    expect(text).not.toContain("Konfirmasi sesi");
  });

  it("6. existing Overview semantics and preview sections remain intact and unchanged", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(
      createElement(DestinationOverviewScreen),
    );

    // Metric band items
    expect(view.textContent).toContain("Jadwal Mendatang");
    expect(view.textContent).toContain("Peserta Terkonfirmasi");
    expect(view.textContent).toContain("Kapasitas Umum Destinasi");
    expect(view.textContent).toContain("Rating Destinasi");

    // Readiness section
    expect(view.textContent).toContain("Status Destinasi");
    expect(view.textContent).toContain("Status Verifikasi");
    expect(view.textContent).toContain("Terverifikasi Dasar");

    // Collaboration context
    expect(view.textContent).toContain("Kolaborasi EO");

    // Upcoming sessions preview
    expect(view.textContent).toContain("Jadwal Keberangkatan Mendatang");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");

    // Profile summary
    expect(view.textContent).toContain("Profil Destinasi");
    expect(view.textContent).toContain("Tentang Destinasi");

    // Review preview section
    expect(view.textContent).toContain("Ulasan Traveler");
  });
});
