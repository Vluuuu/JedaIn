// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DestinationScheduleScreen } from "../destination/DestinationScheduleScreen";
import { defaultPackageDetailAdapter } from "../packageDetail/mockAdapter";
import { PackageDetailScreen } from "../packageDetail/PackageDetailScreen";
import { defaultSessionSelectionAdapter } from "../sessionSelection/mockAdapter";
import { SessionSelectionScreen } from "../sessionSelection/SessionSelectionScreen";
import { EoSessionsScreen } from "./EoSessionsScreen";
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

describe("Batch C3 — Latest Operational Update (P1-M04)", () => {
  it("Test 1: Session with operationalNote renders note in EO sessions view", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/packages/:packageId/sessions",
          element: createElement(EoSessionsScreen),
        }),
      ),
      ["/partner/eo/packages/slow_green_day/sessions"],
    );

    // ses_sgd_1 has operationalNote
    expect(view.textContent).toContain("Catatan Operasional Terbaru:");
    expect(view.textContent).toContain(
      "Rute jalan kaki menggunakan jalur kebun teh sisi barat",
    );
  });

  it("Test 2: Session with note + timestamp renders timestamp as 'Diperbarui', not confirmation/approval", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/packages/:packageId/sessions",
          element: createElement(EoSessionsScreen),
        }),
      ),
      ["/partner/eo/packages/slow_green_day/sessions"],
    );

    expect(view.textContent).toContain("Diperbarui: 10 Agu 2026");
    expect(view.textContent).not.toContain("Dikonfirmasi");
    expect(view.textContent).not.toContain("Disetujui");
    expect(view.textContent).not.toContain("Konfirmasi Operasional");
    expect(view.textContent).not.toContain("Persetujuan Operasional");
    expect(view.textContent).not.toContain("Session Readiness");
  });

  it("Test 3: Session without note does NOT fabricate fake operational state", async () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    // ses_sgd_2 does not have operationalNote
    const allSessions =
      mockEoPackageStore.getSessionsByPackage("slow_green_day");
    const session2 = allSessions.find((s) => s.sessionId === "ses_sgd_2");
    expect(session2?.operationalNote).toBeUndefined();

    const view = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/partner/eo/packages/:packageId/sessions",
          element: createElement(EoSessionsScreen),
        }),
      ),
      ["/partner/eo/packages/slow_green_day/sessions"],
    );

    // Does not invent fake readiness state
    expect(view.textContent).not.toContain("Semua siap");
    expect(view.textContent).not.toContain("Destinasi sudah mengonfirmasi");
    expect(view.textContent).not.toContain("Session confirmed");
  });

  it("Test 4: Mitra session summary reads the exact same operational note", async () => {
    partnerSessionStore.loginAsDemoDestination();

    const view = await renderComponent(
      createElement(DestinationScheduleScreen),
    );

    // Expand the first session (ses_sgd_1)
    const expandBtns = Array.from(view.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Lihat Ringkasan"),
    );
    expect(expandBtns.length).toBeGreaterThan(0);

    await act(async () => {
      expandBtns[0].click();
    });

    expect(view.textContent).toContain("Ringkasan Operasional Sesi");
    expect(view.textContent).toContain("Catatan Operasional Terbaru:");
    expect(view.textContent).toContain(
      "Rute jalan kaki menggunakan jalur kebun teh sisi barat",
    );
    expect(view.textContent).toContain("Diperbarui: 10 Agu 2026");
    // Ensure no approval buttons for Mitra
    expect(view.textContent).not.toContain("Setujui Catatan");
    expect(view.textContent).not.toContain("Tolak Catatan");
    expect(view.textContent).not.toContain("Tandai Dibaca");
  });

  it("Test 5: Updating operationalNote does NOT alter status, capacity, remainingSlots, or price", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const sessionBefore = mockEoPackageStore
      .getSessionsByPackage("slow_green_day")
      .find((s) => s.sessionId === "ses_sgd_1")!;

    const statusBefore = sessionBefore.status;
    const capacityBefore = sessionBefore.capacity;
    const remainingBefore = sessionBefore.remainingSlots;
    const priceBefore = sessionBefore.pricePerPerson;

    // Update note
    const ok = mockEoPackageStore.updateSessionOperationalNote(
      "ses_sgd_1",
      "Pembaruan info jalur: kenakan jaket ringan karena pagi berangin.",
    );
    expect(ok).toBe(true);

    const sessionAfter = mockEoPackageStore
      .getSessionsByPackage("slow_green_day")
      .find((s) => s.sessionId === "ses_sgd_1")!;

    expect(sessionAfter.operationalNote).toBe(
      "Pembaruan info jalur: kenakan jaket ringan karena pagi berangin.",
    );
    expect(sessionAfter.status).toBe(statusBefore);
    expect(sessionAfter.capacity).toBe(capacityBefore);
    expect(sessionAfter.remainingSlots).toBe(remainingBefore);
    expect(sessionAfter.pricePerPerson).toBe(priceBefore);
  });

  it("Test 6: Traveler package and session selection screens do NOT expose internal operationalNote", async () => {
    // 1. Package Detail
    const pkgView = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/packages/:packageId",
          element: createElement(PackageDetailScreen, {
            adapter: defaultPackageDetailAdapter,
          }),
        }),
      ),
      ["/packages/slow_green_day"],
    );

    expect(pkgView.textContent).not.toContain("Catatan Operasional Terbaru:");
    expect(pkgView.textContent).not.toContain(
      "Rute jalan kaki menggunakan jalur kebun teh sisi barat",
    );

    // 2. Session Selection
    const sessView = await renderComponent(
      createElement(
        Routes,
        undefined,
        createElement(Route, {
          path: "/packages/:packageId/sessions",
          element: createElement(SessionSelectionScreen, {
            adapter: defaultSessionSelectionAdapter,
          }),
        }),
      ),
      ["/packages/slow_green_day/sessions"],
    );

    expect(sessView.textContent).not.toContain("Catatan Operasional Terbaru:");
    expect(sessView.textContent).not.toContain(
      "Rute jalan kaki menggunakan jalur kebun teh sisi barat",
    );
  });

  it("Test 7: Saving session note via write capability updates operationalNoteUpdatedAt without modifying business state", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");

    const timeBefore = Date.now();
    const ok = mockEoPackageStore.updateSessionOperationalNote(
      "ses_sgd_2",
      "Briefing awal di area gazebo bambu pukul 07.45 WIB.",
    );
    expect(ok).toBe(true);

    const session = mockEoPackageStore
      .getSessionsByPackage("slow_green_day")
      .find((s) => s.sessionId === "ses_sgd_2")!;

    expect(session.operationalNote).toBe(
      "Briefing awal di area gazebo bambu pukul 07.45 WIB.",
    );
    expect(session.operationalNoteUpdatedAt).toBeDefined();
    const updatedTime = new Date(session.operationalNoteUpdatedAt!).getTime();
    expect(updatedTime).toBeGreaterThanOrEqual(timeBefore);

    // Business state strictly untouched
    expect(session.status).toBe("OPEN");
    expect(session.capacity).toBe(6);
    expect(session.remainingSlots).toBe(4);
    expect(session.pricePerPerson).toBe(275000);
  });
});
