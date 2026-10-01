// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { partnerRegistrationRepository } from "../../data/partnerRegistrationRepository";
import {
  INITIAL_DESTINATION_APPLICATIONS,
  mockDestinationVerificationStore,
} from "../admin/mockDestinationVerificationStore";
import { partnerSessionStore } from "../eo/partnerSessionStore";
import { DestinationApplicationScreen } from "./DestinationApplicationScreen";
import { DemoDestinationDocument } from "./DemoDestinationDocument";
import {
  demoDestinationDocumentStore,
  validateDemoDestinationDocument,
  DEMO_DOCUMENT_MAX_BYTES,
} from "./demoDestinationDocumentStore";

let root: Root | undefined;
let view: HTMLDivElement;
const createObjectURL = vi.fn(() => "blob:demo-document");
const revokeObjectURL = vi.fn();
beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
afterEach(async () => {
  await act(() => root?.unmount());
  root = undefined;
  view?.remove();
  demoDestinationDocumentStore.reset();
  partnerSessionStore.reset();
  mockDestinationVerificationStore.reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
});

async function render(element: React.ReactElement) {
  if (!root) {
    view = document.createElement("div");
    document.body.append(view);
    root = createRoot(view);
  }
  await act(() => root!.render(createElement(MemoryRouter, null, element)));
}

function mockBlobUrls() {
  const BrowserURL = URL;
  vi.stubGlobal(
    "URL",
    class extends BrowserURL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
  );
}

describe("Destination permit attachment for the local demo", () => {
  it("rejects unsafe, empty and oversized files", () => {
    for (const file of [
      new File(["script"], "permit.html", { type: "text/html" }),
      new File([], "empty.pdf", { type: "application/pdf" }),
      new File([new Uint8Array(DEMO_DOCUMENT_MAX_BYTES + 1)], "large.pdf", {
        type: "application/pdf",
      }),
    ])
      expect(validateDemoDestinationDocument(file)).toBeTruthy();
    expect(
      validateDemoDestinationDocument(
        new File(["%PDF"], "permit.pdf", { type: "application/pdf" }),
      ),
    ).toBeUndefined();
  });

  it("keeps the actual file local while submitting only its metadata and opens it in the review summary", async () => {
    mockBlobUrls();
    partnerSessionStore.loginAsDemoDestination();
    const submit = vi
      .spyOn(partnerRegistrationRepository, "submit")
      .mockImplementation(async (input) => {
        if (input.role !== "DESTINATION")
          throw new Error("Expected destination");
        const doc = input.details.legalEntityDoc;
        mockDestinationVerificationStore.upsertFromBackend({
          ...INITIAL_DESTINATION_APPLICATIONS[0],
          applicationId: "application_demo_document",
          status: "PENDING_REVIEW",
          legalEntityDocument: doc
            ? { name: doc.name, attachedAt: doc.uploadedAt, status: doc.status }
            : undefined,
        });
        return { success: true };
      });
    await render(createElement(DestinationApplicationScreen));
    const input = view.querySelector<HTMLInputElement>("#dest-legal-doc")!;
    expect(input.type).toBe("file");
    const file = new File(["PRIVATE LOCAL FILE CONTENT"], "Izin.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    await act(() =>
      input.dispatchEvent(new Event("change", { bubbles: true })),
    );
    expect(view.textContent).toContain("Dokumen dipilih: Izin.pdf");
    await act(() =>
      view
        .querySelector<HTMLButtonElement>(".dest-stepper button:last-child")!
        .click(),
    );
    expect(view.textContent).toContain("Izin.pdf");
    expect(view.textContent).not.toContain("Pemandu lokal tersedia");
    expect(view.textContent).not.toContain("Formulir Verifikasi Destinasi");
    await act(() =>
      view.querySelector<HTMLInputElement>("#dest-sop-agree")!.click(),
    );
    await act(async () =>
      view
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(submit).toHaveBeenCalledOnce();
    const submitted = submit.mock.calls[0][0];
    if (submitted.role !== "DESTINATION")
      throw new Error("Expected destination");
    expect(submitted.details.legalEntityDoc?.name).toBe("Izin.pdf");
    expect(JSON.stringify(submitted)).not.toContain(
      "PRIVATE LOCAL FILE CONTENT",
    );
    expect(
      demoDestinationDocumentStore.get("application_demo_document")?.file,
    ).toBe(file);
    await render(
      createElement(DemoDestinationDocument, {
        applicationId: "application_demo_document",
        name: "Izin.pdf",
      }),
    );
    expect(view.querySelector("a")?.getAttribute("href")).toBe(
      "blob:demo-document",
    );
    expect(view.textContent).toContain("selama sesi browser ini");
    demoDestinationDocumentStore.reset();
    await render(
      createElement(DemoDestinationDocument, {
        applicationId: "application_demo_document",
        name: "Izin.pdf",
      }),
    );
    expect(view.querySelector("a")).toBeNull();
    expect(view.textContent).toContain("File demo tidak tersedia");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:demo-document");
  });

  it("shows an invalid selection inline and allows removing the optional attachment before advancing", async () => {
    partnerSessionStore.loginAsDemoDestination();
    await render(createElement(DestinationApplicationScreen));
    const input = view.querySelector<HTMLInputElement>("#dest-legal-doc")!;
    Object.defineProperty(input, "files", {
      value: [new File(["bad"], "bad.html", { type: "text/html" })],
    });
    await act(() =>
      input.dispatchEvent(new Event("change", { bubbles: true })),
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(view.querySelector('[role="alert"]')?.textContent).toContain("PDF");
    const next = Array.from(view.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Lanjut ke Langkah 2"),
    )!;
    await act(() => next.click());
    expect(view.querySelector("#dest-legal-doc")).not.toBeNull();
    const clear = Array.from(view.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Hapus pilihan dokumen"),
    )!;
    await act(() => clear.click());
    expect(view.querySelector('[role="alert"]')).toBeNull();
    await act(() => next.click());
    expect(view.querySelector("#dest-legal-doc")).toBeNull();
  });
});
