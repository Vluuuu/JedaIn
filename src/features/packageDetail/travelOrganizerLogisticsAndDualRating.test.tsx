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
  it("1 & 2. Product-facing screens use 'Travel Organizer' while internal routes remain intact", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const builderView = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    // Step 1 guide options
    expect(builderView.textContent).toContain(
      "Pemandu dari Travel Organizer (Certified Guide)",
    );
    expect(builderView.textContent).not.toContain("Pemandu dari EO");

    // Stepper Step 3
    const steps = Array.from(
      builderView.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    expect(steps[2].textContent).toContain("Perjalanan & Itinerary");

    // Step 4 pricing label
    await act(async () => steps[3].click());
    expect(builderView.textContent).toContain("Margin Travel Organizer");
    expect(builderView.textContent).not.toContain("Margin EO:");
  });

  it("3, 4, 6, 7. Travel Organizer authors full logistics in Step 3, persists across steps, and custom transport inclusion works", async () => {
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

      // Custom inclusion with transport included
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        includedTextarea,
        "Transportasi PP dari titik kumpul\nTiket kawasan wisata\nPemandu lokal",
      );
      includedTextarea.dispatchEvent(new Event("input", { bubbles: true }));

      // Custom exclusion: NO universal "Transportasi menuju lokasi"
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set?.call(
        excludedTextarea,
        "Pengeluaran pribadi\nOleh-oleh belanjaan",
      );
      excludedTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // 4. Switch steps to Step 4 then back to Step 3 - values must persist!
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

    // Check Step 5 preview includes authored travel arrangements
    await act(async () => steps[4].click());
    expect(view.textContent).toContain("Stasiun Kota Malang Pintu Selatan");
    expect(view.textContent).toContain(
      "Shuttle elf ber-AC khusus peserta JedaIn",
    );
    expect(view.textContent).toContain("Transportasi PP dari titik kumpul");
  });

  it("5, 8, 9, 10, 11. Traveler Package Detail displays dual trust identity, separate ratings, zero state, and authored logistics", async () => {
    const traveler: AuthUser = {
      id: "usr_test_dual_rating",
      onboardingStatus: "COMPLETED",
    };
    sessionStore.setUser(traveler);

    // Initially for seeded package "slow_green_day":
    // No destination reviews, no organizer reviews
    const view = await renderRoute(
      createElement(PackageDetailScreen),
      "/packages/:packageId",
      "/packages/slow_green_day",
    );

    // 8. Dual trust cards are rendered
    expect(view.textContent).toContain("Destinasi");
    expect(view.textContent).toContain("Lereng Hijau Batu");
    expect(view.textContent).toContain(
      "Destinasi ini telah melalui proses verifikasi JedaIn.",
    );

    expect(view.textContent).toContain("Travel Organizer");
    expect(view.textContent).toContain("Jeda Alam Nusantara");
    expect(view.textContent).toContain("Travel Organizer JedaIn");

    // 9. Zero state without reviews
    expect(view.textContent).toContain("Belum ada ulasan destinasi.");
    expect(view.textContent).toContain("Belum ada ulasan pascatrip.");

    // Check logistics section renders authored fields
    expect(view.textContent).toContain("Informasi Titik Kumpul & Akses");
    expect(view.textContent).toContain("Area titik kumpul Lereng Hijau Batu");

    // 10 & 11. Add a runtime destination review AND a runtime organizer review separately
    await act(async () => root.unmount());
    container.remove();

    // Destination review only
    mockReviewStore.submitReview({
      bookingId: "bk_test_dest",
      travelerId: traveler.id,
      targetType: "DESTINATION",
      targetRef: "Lereng Hijau Batu",
      rating: 5,
    });

    const viewWithDestReview = await renderRoute(
      createElement(PackageDetailScreen),
      "/packages/:packageId",
      "/packages/slow_green_day",
    );

    // Destination card has rating, but Travel Organizer is still zero-state!
    expect(viewWithDestReview.textContent).toContain(
      "★ 5,0 · 1 ulasan destinasi",
    );
    expect(viewWithDestReview.textContent).toContain(
      "Belum ada ulasan pascatrip.",
    );

    await act(async () => root.unmount());
    container.remove();

    // Now submit organizer review
    mockReviewStore.submitReview({
      bookingId: "bk_test_org",
      travelerId: traveler.id,
      targetType: "EO_GUIDE",
      targetRef: "org_lereng_batu",
      rating: 4,
    });

    const viewWithBoth = await renderRoute(
      createElement(PackageDetailScreen),
      "/packages/:packageId",
      "/packages/slow_green_day",
    );

    // Both cards show distinct ratings without leakage
    expect(viewWithBoth.textContent).toContain("★ 5,0 · 1 ulasan destinasi");
    expect(viewWithBoth.textContent).toContain("★ 4,0 · 1 ulasan pascatrip");
  });

  it("12, 13, 14, 15. Same runtime guide fee (Rp150.000) and pricing formula integrity remain intact with logistics fields", async () => {
    partnerSessionStore.loginAsDemoDestination();
    mockDestinationStore.updateLocalGuideFee("dest_lereng_hijau", 150000);

    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const builder = await renderRoute(
      createElement(EoPackageBuilderScreen),
      "/partner/eo/packages/new",
      "/partner/eo/packages/new?destinationId=dest_lereng_hijau",
    );

    // Check pricing calculation
    // Base: 125.000 + Guide: 150.000 + Margin: 150.000 = 425.000
    const steps = Array.from(
      builder.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    );
    await act(async () => steps[3].click());

    expect(builder.textContent).toContain("Rp125.000");
    expect(builder.textContent).toContain("Rp150.000");
    expect(builder.textContent).toContain("Rp425.000");

    // Approved != Live: check that draft is saved and does not appear on traveler catalog
    const draft = mockEoPackageStore.saveDraft({
      title: "Paket Logistik Mandiri Baru",
      shortSummary: "Pengalaman mindful dengan transportasi terkelola penuh.",
      destinationId: "dest_lereng_hijau",
      durationLabel: "1 hari",
      meetingPointLabel: "Terminal Kota Batu",
      outboundTransport: "Mobil travel rombongan",
      returnTransport: "Mobil travel rombongan kembali ke terminal",
      includedItems: ["Transportasi PP", "Tiket kawasan"],
      excludedItems: ["Uang jajan pribadi"],
      safetyNotes: ["Pakai masker saat berdebu."],
    });

    expect(draft.success).toBe(true);
    expect(draft.package?.status).toBe("DRAFT");
    expect(draft.package?.meetingPointLabel).toBe("Terminal Kota Batu");
    expect(draft.package?.outboundTransport).toBe("Mobil travel rombongan");
    expect(draft.package?.returnTransport).toBe(
      "Mobil travel rombongan kembali ke terminal",
    );

    // TO Detail screen shows the same logistics
    await act(async () => root.unmount());
    container.remove();

    const toDetail = await renderRoute(
      createElement(EoPackageDetailScreen),
      "/partner/eo/packages/:packageId",
      `/partner/eo/packages/${draft.package!.packageId}`,
    );

    expect(toDetail.textContent).toContain(
      "Pengaturan Perjalanan & Titik Kumpul",
    );
    expect(toDetail.textContent).toContain("Terminal Kota Batu");
    expect(toDetail.textContent).toContain("Mobil travel rombongan");
  });
});
