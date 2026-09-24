// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { partnerSessionStore } from "./partnerSessionStore";
import { PartnerPortalLandingScreen } from "./PartnerPortalLandingScreen";

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

async function renderPartnerPortal() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/partner"] },
        createElement(PartnerPortalLandingScreen),
      ),
    );
  });
}

describe("Batch E1 — Competition Demo Hardening", () => {
  it("uses evidence-safe partner portal copy instead of claiming real demand", async () => {
    await renderPartnerPortal();

    expect(container.textContent).toContain("sinyal kebutuhan");
    expect(container.textContent).toContain("destinasi terverifikasi");
    expect(container.textContent).not.toContain("permintaan nyata");
  });

  it("keeps all juror quick-entry actions visible", async () => {
    await renderPartnerPortal();

    const text = container.textContent ?? "";
    expect(text).toContain("Masuk sebagai EO Demo (Certified)");
    expect(text).toContain("Masuk sebagai EO Demo (Concept)");
    expect(text).toContain("Masuk sebagai Mitra Destinasi Demo");
    expect(text).toContain("Reset Demo State");
  });
});
