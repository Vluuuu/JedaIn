// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
  partnerSessionStore.reset();
});

async function renderPackageBuilder(
  initialEntries = ["/partner/eo/packages/new?destinationId=dest_lembah_pacet"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/partner/eo/packages/new",
            element: createElement(EoPackageBuilderScreen),
          }),
          createElement(Route, {
            path: "/partner/eo/packages/:packageId",
            element: createElement("div", undefined, "Package Detail Screen"),
          }),
        ),
      ),
    );
  });
  return container;
}

describe("F3.2 — EO Traveler-Facing Draft Preview", () => {
  it("1. Step 5 exposes 'Preview sebagai Traveler' button in action bar without duplicate in header", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderPackageBuilder();

    // Navigate to Step 5
    const step5Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"));
    expect(step5Button).toBeDefined();

    await act(async () => {
      step5Button!.click();
    });

    // Verify header does not contain duplicate preview button
    const headerBtn = view
      .querySelector(".eo-section-header")
      ?.querySelector("button");
    expect(headerBtn).toBeNull();

    // Verify 'Preview sebagai Traveler' button is exposed in action bar beside submit button
    const previewBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Preview sebagai Traveler"));
    expect(previewBtn).toBeDefined();
  });

  it("2. Opening preview renders source-backed draft fields and disclosure", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderPackageBuilder();

    // Set fields in Step 2
    const step2Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("2. Sinyal Insight"));
    await act(async () => {
      step2Button!.click();
    });

    const titleInput = view.querySelector<HTMLInputElement>(
      'input[placeholder*="Sehari Pelan di Lereng Hijau"]',
    )!;
    const summaryInput =
      view.querySelector<HTMLTextAreaElement>("#package-summary")!;

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(
        titleInput,
        "Jeda Sejenak di Lembah Teduh Pacet",
      );
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));

      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      nativeTextAreaValueSetter?.call(
        summaryInput,
        "Pengalaman mindful di tengah sejuknya lembah pegunungan Pacet bersama warga lokal.",
      );
      summaryInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Navigate to Step 5
    const step5Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"));
    await act(async () => {
      step5Button!.click();
    });

    // Open Traveler preview
    const previewBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Preview sebagai Traveler"))!;

    await act(async () => {
      previewBtn.click();
    });

    const dialog = view.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(dialog).not.toBeNull();

    // 1. Draft disclosure
    expect(dialog.textContent).toContain("Preview Draf");
    expect(dialog.textContent).toContain(
      "Tampilan perkiraan pengalaman sebelum diajukan ke review kurasi Admin",
    );

    // 2. Traveler-facing identity
    expect(dialog.textContent).toContain("Jeda Sejenak di Lembah Teduh Pacet");
    expect(dialog.textContent).toContain(
      "Pengalaman mindful di tengah sejuknya lembah pegunungan Pacet bersama warga lokal.",
    );
    expect(dialog.textContent).toContain("Lembah Teduh Pacet");
    expect(dialog.textContent).toContain("Mojokerto");
    expect(dialog.textContent).toContain("1 hari");

    // 3. Customer Price (base cost 160.000 + default eoMargin 150.000 = 310.000)
    expect(dialog.textContent).toContain("Rp310.000");
    expect(dialog.textContent).toContain("/ orang");

    // 4. Itinerary
    expect(dialog.textContent).toContain("Rencana Pengalaman");
    expect(dialog.textContent).toContain("Pagi - Titik Kumpul & Sambutan Teh");
    expect(dialog.textContent).toContain(
      "Menjelajah Jalur Alami & Sesi Hening",
    );

    // 5. Preparation & Safety
    expect(dialog.textContent).toContain("Persiapan & Keselamatan");
    expect(dialog.textContent).toContain("Gunakan alas kaki yang nyaman");

    // 6. Footer note
    expect(dialog.textContent).toContain(
      "Preview ini menampilkan draf sebelum review Admin dan belum berarti package telah disetujui atau LIVE.",
    );
  });

  it("3. Preview does NOT display EO margin, platform commission, Rp7.500 fee, fake approval/LIVE, fake ratings, or operational notes", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderPackageBuilder();

    // Jump to Step 5 and open preview
    const step5Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"))!;
    await act(async () => {
      step5Button.click();
    });

    const previewBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Preview sebagai Traveler"))!;
    await act(async () => {
      previewBtn.click();
    });

    const dialog = view.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(dialog).not.toBeNull();

    // Must NOT show internal margin breakdown
    expect(dialog.textContent).not.toContain("Margin EO");
    expect(dialog.textContent).not.toContain("Biaya Dasar:");

    // Must NOT show platform commission
    expect(dialog.textContent).not.toContain("komisi");
    expect(dialog.textContent).not.toContain("Komisi");
    expect(dialog.textContent).not.toContain("Commission");

    // Must NOT show traveler service fee (checkout-level line item)
    expect(dialog.textContent).not.toContain("7.500");
    expect(dialog.textContent).not.toContain("Biaya layanan");

    // Must NOT show fake LIVE or approval badges for the package
    expect(dialog.textContent).not.toContain("Status: LIVE");
    expect(dialog.textContent).not.toContain("Terverifikasi Dasar");
    expect(dialog.textContent).not.toContain("Terverifikasi Plus");

    // Must NOT show fake reviews, rating, or session availability
    expect(dialog.textContent).not.toContain("Ulasan Traveler");
    expect(dialog.textContent).not.toContain("/ 5.0");
    expect(dialog.textContent).not.toContain("Sisa");
    expect(dialog.textContent).not.toContain("slot");

    // Must NOT show transactional CTAs
    expect(dialog.textContent).not.toContain("Pilih Jadwal");
    expect(dialog.textContent).not.toContain("Lanjut ke Pembayaran");
    expect(dialog.textContent).not.toContain("Checkout");

    // Must NOT expose operationalNote
    expect(dialog.textContent).not.toContain("operationalNote");
    expect(dialog.textContent).not.toContain("Catatan Operasional");
  });

  it("4. Missing imageUrl renders a neutral placeholder without inventing a photo, while provided imageUrl renders img", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // Case A: Missing imageUrl
    const viewNoImg = await renderPackageBuilder();

    // Open Step 5 with default draft (no imageUrl uploaded)
    const step5Button = Array.from(
      viewNoImg.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"))!;
    await act(async () => {
      step5Button.click();
    });

    const previewBtnNoImg = Array.from(
      viewNoImg.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Preview sebagai Traveler"))!;
    await act(async () => {
      previewBtnNoImg.click();
    });

    const dialogNoImg =
      viewNoImg.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(dialogNoImg).not.toBeNull();

    // Neutral placeholder is visible
    expect(dialogNoImg.textContent).toContain(
      "Visual utama belum ditambahkan.",
    );
    // No img element inside dialog
    expect(dialogNoImg.querySelector("img")).toBeNull();

    // Clean up container
    container?.remove();

    // Case B: Existing draft with imageUrl
    mockEoPackageStore.saveDraft({
      packageId: "pkg_draft_with_img",
      title: "Jeda Sejenak di Lembah Teduh",
      shortSummary: "Pengalaman mindful di lembah Pacet",
      destinationId: "dest_lembah_pacet",
      imageUrl: "https://example.com/test-photo.jpg",
      status: "DRAFT",
    });

    const viewWithImg = await renderPackageBuilder([
      "/partner/eo/packages/new?draftId=pkg_draft_with_img",
    ]);

    const step5ButtonWithImg = Array.from(
      viewWithImg.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"))!;
    await act(async () => {
      step5ButtonWithImg.click();
    });

    const previewBtnWithImg = Array.from(
      viewWithImg.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Preview sebagai Traveler"))!;
    await act(async () => {
      previewBtnWithImg.click();
    });

    const dialogWithImg =
      viewWithImg.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(dialogWithImg).not.toBeNull();

    const imgEl = dialogWithImg.querySelector<HTMLImageElement>(
      ".eo-builder-traveler-preview__img",
    );
    expect(imgEl).not.toBeNull();
    expect(imgEl?.src).toBe("https://example.com/test-photo.jpg");
    expect(imgEl?.alt).toBe("Visual utama Jeda Sejenak di Lembah Teduh");
    expect(imgEl?.alt).not.toContain("Foto utama");
    expect(dialogWithImg.textContent).not.toContain(
      "Visual utama belum ditambahkan.",
    );
  });

  it("5. Opening and closing preview does NOT save, submit, publish, or change step", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderPackageBuilder();

    // Go to Step 5
    const step5Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"))!;
    await act(async () => {
      step5Button.click();
    });

    // Record package snapshots right before opening preview
    const packagesBefore = mockEoPackageStore.getAllPackages();
    const countBeforePreview = packagesBefore.length;
    const statusesBefore = packagesBefore.map((p) => ({
      id: p.packageId,
      status: p.status,
    }));

    // Open preview
    const previewBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Preview sebagai Traveler"))!;
    await act(async () => {
      previewBtn.click();
    });

    let dialog = view.querySelector<HTMLDialogElement>("dialog[open]");
    expect(dialog).not.toBeNull();

    // Close preview
    const closeBtn = Array.from(
      dialog!.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Tutup Preview"))!;
    await act(async () => {
      closeBtn.click();
    });

    dialog = view.querySelector<HTMLDialogElement>("dialog[open]");
    expect(dialog).toBeNull();

    // 1. Still on Step 5
    expect(view.textContent).toContain(
      "Langkah 5: Tinjau & Ajukan untuk Review Kurasi",
    );

    // 2. No unexpected package saved or submitted to store
    const currentPackages = mockEoPackageStore.getAllPackages();
    expect(currentPackages.length).toBe(countBeforePreview);

    // 3. No package changed status or lifecycle
    const statusesAfter = currentPackages.map((p) => ({
      id: p.packageId,
      status: p.status,
    }));
    expect(statusesAfter).toEqual(statusesBefore);
  });

  it("6. Existing validation and 'Submit untuk Review Admin' flow remains completely intact", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const view = await renderPackageBuilder();

    // Navigate to Step 5 with empty title
    const step5Button = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("5. Tinjau & Submit"))!;
    await act(async () => {
      step5Button.click();
    });

    // Submit for review
    const submitBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Submit untuk Review Admin"))!;
    await act(async () => {
      submitBtn.click();
    });

    // Verification fails and redirects to Step 2
    expect(view.textContent).toContain(
      "Langkah 2: Hubungkan dengan Sinyal Kebutuhan Traveler",
    );
    expect(view.textContent).toContain("Paket belum memenuhi standar kurasi");
  });
});
