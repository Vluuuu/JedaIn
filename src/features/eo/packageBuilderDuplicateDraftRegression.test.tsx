// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { packageRepository } from "../../data/packageRepository";
import { mockDestinationStore } from "./mockDestinationStore";
import { mockEoPackageStore } from "./mockEoPackageStore";
import { partnerSessionStore } from "./partnerSessionStore";
import { EoPackageBuilderScreen } from "./EoPackageBuilderScreen";
import type { EoPackageRecord } from "./types";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

beforeEach(() => {
  partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
  mockDestinationStore.reset();
  mockEoPackageStore.reset();
  partnerSessionStore.reset();
  vi.restoreAllMocks();
});

function createMockSavedRecord(
  draft: Partial<EoPackageRecord>,
  defaultId = "pkg_authoritative_1",
): EoPackageRecord {
  return {
    packageId: draft.packageId || defaultId,
    eoId: "eo_jeda_alam",
    eoDisplayName: "Jeda Alam Nusantara",
    title: draft.title || "Draf Paket",
    shortSummary: draft.shortSummary || "Ringkasan paket",
    valueProposition: draft.valueProposition || "Nilai paket",
    destinationId: draft.destinationId || "dest_lereng_hijau",
    durationLabel: draft.durationLabel || "1 hari",
    suitableGroupTypes: draft.suitableGroupTypes || ["SOLO"],
    highlights: draft.highlights || [],
    itinerary: draft.itinerary || [],
    includedItems: draft.includedItems || ["Fasilitas 1"],
    excludedItems: draft.excludedItems || [],
    safetyNotes: draft.safetyNotes || ["Catatan keselamatan"],
    pricing: draft.pricing || {
      destinationBaseCost: 125000,
      localGuideFee: 25000,
      eoMargin: 150000,
      customerPrice: 300000,
    },
    guideStatus: "CERTIFIED_GUIDE",
    guideSource: draft.guideSource || "DESTINATION",
    status: "DRAFT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function renderPackageBuilder(
  initialEntries = ["/partner/eo/packages/new?destinationId=dest_lereng_hijau"],
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

describe("Regression Tests: Package Builder Single-Draft Lifecycle & Serialization", () => {
  it("Scenario A: first save generates and adopts authoritative packageId from packageRepository", async () => {
    const capturedDraftPayloads: Partial<EoPackageRecord>[] = [];

    vi.spyOn(packageRepository, "saveDraft").mockImplementation(
      async (draft: Partial<EoPackageRecord>) => {
        capturedDraftPayloads.push(draft);
        return {
          success: true,
          package: createMockSavedRecord(draft, "pkg_authoritative_1"),
        };
      },
    );

    const view = await renderPackageBuilder();

    // Verify initially no packageId on container
    const initialEl = view.querySelector<HTMLDivElement>(".eo-container");
    expect(initialEl?.getAttribute("data-package-id")).toBeNull();

    // Click "Lanjut ke Langkah 2: Sinyal Insight"
    const nextBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 2"));
    expect(nextBtn).toBeDefined();

    await act(async () => {
      await nextBtn!.click();
    });

    // Save was called with undefined packageId
    expect(capturedDraftPayloads.length).toBeGreaterThanOrEqual(1);
    expect(capturedDraftPayloads[0].packageId).toBeUndefined();

    // State/wizard now holds authoritative packageId
    const updatedEl = view.querySelector<HTMLDivElement>(".eo-container");
    expect(updatedEl?.getAttribute("data-package-id")).toBe(
      "pkg_authoritative_1",
    );
  });

  it("Scenario B: second save with field changes reuses pkg_authoritative_1 without creating second package", async () => {
    const savedPackageIds: (string | undefined)[] = [];

    vi.spyOn(packageRepository, "saveDraft").mockImplementation(
      async (draft: Partial<EoPackageRecord>) => {
        savedPackageIds.push(draft.packageId);
        return {
          success: true,
          package: createMockSavedRecord(draft, "pkg_authoritative_1"),
        };
      },
    );

    const view = await renderPackageBuilder();

    // Step 1 -> Step 2
    const nextBtn1 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 2"));
    await act(async () => {
      await nextBtn1!.click();
    });

    expect(savedPackageIds).toHaveLength(1);
    expect(savedPackageIds[0]).toBeUndefined();

    // Now in Step 2: edit title
    const titleInput = view.querySelector<HTMLInputElement>("#package-title");
    expect(titleInput).not.toBeNull();

    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter?.call(titleInput, "Paket Meditasi Anyar");
      titleInput?.dispatchEvent(new Event("input", { bubbles: true }));
      titleInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Step 2 -> Step 3
    const nextBtn2 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 3"));
    expect(nextBtn2).toBeDefined();

    await act(async () => {
      await nextBtn2!.click();
    });

    // Second save must explicitly provide pkg_authoritative_1
    expect(savedPackageIds.length).toBeGreaterThanOrEqual(2);
    expect(savedPackageIds[1]).toBe("pkg_authoritative_1");

    // All subsequent saves must use pkg_authoritative_1
    const subsequentSaves = savedPackageIds.slice(1);
    expect(subsequentSaves.every((id) => id === "pkg_authoritative_1")).toBe(
      true,
    );
  });

  it("Scenario C: transitioning multiple steps retains same packageId without creating new IDs", async () => {
    const receivedIds: (string | undefined)[] = [];

    vi.spyOn(packageRepository, "saveDraft").mockImplementation(
      async (draft: Partial<EoPackageRecord>) => {
        receivedIds.push(draft.packageId);
        return {
          success: true,
          package: createMockSavedRecord(draft, "pkg_authoritative_1"),
        };
      },
    );

    const view = await renderPackageBuilder();

    // Step 1 -> 2
    const next1 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 2"));
    await act(async () => {
      await next1!.click();
    });

    // Step 2 -> 3
    const next2 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 3"));
    await act(async () => {
      await next2!.click();
    });

    // Step 3 -> 4
    const next3 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 4"));
    await act(async () => {
      await next3!.click();
    });

    // Step 4 -> 5
    const next4 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 5"));
    await act(async () => {
      await next4!.click();
    });

    // We progressed through 4 steps
    expect(receivedIds.length).toBeGreaterThanOrEqual(4);
    // First save had undefined packageId
    expect(receivedIds[0]).toBeUndefined();
    // Every subsequent save used pkg_authoritative_1
    for (let i = 1; i < receivedIds.length; i++) {
      expect(receivedIds[i]).toBe("pkg_authoritative_1");
    }
  });

  it("Scenario D: submit waits for in-flight save and invokes submitForReview with authoritative ID", async () => {
    let saveResolve: (value: unknown) => void;
    const savePromise = new Promise((resolve) => {
      saveResolve = resolve;
    });

    let saveDraftFinished = false;
    let submitCalledWithId: string | null = null;
    let submitCalledAfterSave = false;

    vi.spyOn(packageRepository, "saveDraft").mockImplementation(
      async (draft: Partial<EoPackageRecord>) => {
        // First save resolves normally, but submit save pauses to test serialization
        if (draft.packageId === "pkg_authoritative_1") {
          await savePromise;
          saveDraftFinished = true;
        }
        return {
          success: true,
          package: createMockSavedRecord(draft, "pkg_authoritative_1"),
        };
      },
    );

    vi.spyOn(packageRepository, "submitForReview").mockImplementation(
      async (packageId: string) => {
        submitCalledWithId = packageId;
        submitCalledAfterSave = saveDraftFinished;
        return {
          success: true,
          package: {
            packageId,
            status: "PENDING_ADMIN_REVIEW",
          } as EoPackageRecord,
          validationResult: { valid: true, errors: [] },
        };
      },
    );

    const view = await renderPackageBuilder();

    // Move to Step 5
    const step5Btn = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".eo-step-item"),
    ).find((btn) => btn.textContent?.includes("Tinjau & Submit"));
    await act(async () => {
      await step5Btn!.click();
    });

    // Click submit
    const submitBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Submit untuk Review Admin"));
    expect(submitBtn).toBeDefined();

    // Trigger submit
    act(() => {
      submitBtn!.click();
    });

    // While save is pending, submitForReview should not have been called yet
    expect(submitCalledWithId).toBeNull();

    // Now resolve saveDraft
    await act(async () => {
      saveResolve(true);
    });

    // Submit now finished
    expect(submitCalledWithId).toBe("pkg_authoritative_1");
    expect(submitCalledAfterSave).toBe(true);
    expect(view.textContent).toContain("Package Detail Screen");
  });

  it("Scenario E: existing mock mode continues to operate and persist draft without crashing", async () => {
    const view = await renderPackageBuilder();

    // Navigate to Step 2
    const nextBtn1 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 2"));
    await act(async () => {
      await nextBtn1!.click();
    });

    const containerEl = view.querySelector<HTMLDivElement>(".eo-container");
    const generatedId = containerEl?.getAttribute("data-package-id");
    expect(generatedId).toBeDefined();
    expect(typeof generatedId).toBe("string");
    expect(generatedId?.length).toBeGreaterThan(0);

    // Verify stored in mock store
    const stored = mockEoPackageStore.getPackageById(generatedId!);
    expect(stored).toBeDefined();
    expect(stored?.destinationId).toBe("dest_lereng_hijau");

    // Navigate to Step 3
    const nextBtn2 = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 3"));
    await act(async () => {
      await nextBtn2!.click();
    });

    // Package ID must stay the same
    const updatedId = view
      .querySelector<HTMLDivElement>(".eo-container")
      ?.getAttribute("data-package-id");
    expect(updatedId).toBe(generatedId);
  });

  it("Scenario F: displays save error banner and prevents step transition when saveDraft fails", async () => {
    vi.spyOn(packageRepository, "saveDraft").mockResolvedValue({
      success: false,
      message: "Data resmi destinasi live tidak dapat dibaca dari server.",
    });

    const view = await renderPackageBuilder();

    // Verify initially at Step 1
    expect(view.textContent).toContain(
      "Langkah 1: Pilih Destinasi & Status Pemanduan",
    );

    // Click "Lanjut ke Langkah 2: Sinyal Insight"
    const nextBtn = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((btn) => btn.textContent?.includes("Lanjut ke Langkah 2"));
    expect(nextBtn).toBeDefined();

    await act(async () => {
      await nextBtn!.click();
    });

    // Step should NOT advance: stays on Step 1
    expect(view.textContent).toContain(
      "Langkah 1: Pilih Destinasi & Status Pemanduan",
    );
    expect(view.textContent).not.toContain("Sinyal Insight Traveler");

    // Save error banner must be rendered with message
    const alertEl = view.querySelector<HTMLDivElement>(".eo-alert--error");
    expect(alertEl).not.toBeNull();
    expect(alertEl?.textContent).toContain("Gagal Menyimpan Draf");
    expect(alertEl?.textContent).toContain(
      "Data resmi destinasi live tidak dapat dibaca dari server.",
    );
  });
});
