// @vitest-environment jsdom

import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { App } from "../../App";
import { sessionStore } from "../onboarding/sessionStore";
import { ExploreScreen } from "./ExploreScreen";
import { MockExploreAdapter } from "./mockAdapter";

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
  sessionStore.reset();
});

let lastLocation: { pathname: string; search: string } = {
  pathname: "",
  search: "",
};

function LocationObserver() {
  const location = useLocation();
  useEffect(() => {
    lastLocation = { pathname: location.pathname, search: location.search };
  }, [location]);
  return null;
}

async function renderExplore(
  props: { adapter?: MockExploreAdapter } = {},
  initialEntries: string[] = ["/explore"],
) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries },
        createElement(LocationObserver),
        createElement(
          Routes,
          undefined,
          createElement(Route, {
            path: "/explore",
            element: createElement(ExploreScreen, props),
          }),
        ),
      ),
    ),
  );
  return container;
}

describe("ExploreScreen UI, URL State & Interaction", () => {
  it("renders all LIVE packages by default with count", async () => {
    const view = await renderExplore();

    expect(view.textContent).toContain("5 experience ditemukan");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Pagi Hening & Mindful Reset");
    expect(view.textContent).toContain("Weekend Nature Reset");
    expect(view.textContent).toContain("Ruang Kreatif Desa");
    expect(view.textContent).toContain("Jelajah Santai Pegunungan");
  });

  it("prefills search input and filters results when query URL param is present", async () => {
    const view = await renderExplore({}, ["/explore?query=lereng"]);

    const searchInput = view.querySelector<HTMLInputElement>(
      ".explore-search-input",
    )!;
    expect(searchInput.value).toBe("lereng");
    expect(view.textContent).toContain("1 experience ditemukan");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).not.toContain("Pagi Hening");
  });

  it("pre-selects mood and renders active chip when mood URL param is present", async () => {
    const view = await renderExplore({}, ["/explore?mood=recharge"]);

    expect(view.textContent).toContain("Suasana: Recharge");
    expect(view.textContent).toContain("3 experience ditemukan");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Pagi Hening & Mindful Reset");
    expect(view.textContent).toContain("Weekend Nature Reset");
    expect(view.textContent).not.toContain("Ruang Kreatif Desa");
  });

  it("pre-selects destination filter from URL (e.g. from Home destination click)", async () => {
    const view = await renderExplore({}, [
      "/explore?destination=Desa%20Wisata%20Budaya",
    ]);

    expect(view.textContent).toContain("Destinasi: Desa Wisata Budaya");
    expect(view.textContent).toContain("1 experience ditemukan");
    expect(view.textContent).toContain("Ruang Kreatif Desa");
  });

  it("removes active filter chip and updates results and URL accordingly", async () => {
    const view = await renderExplore({}, [
      "/explore?departure=malang&duration=half_day",
    ]);

    expect(view.textContent).toContain("Dari: Malang");
    expect(view.textContent).toContain("Durasi: Setengah hari");
    expect(view.textContent).toContain("1 experience ditemukan");
    expect(view.textContent).toContain("Ruang Kreatif Desa");
    expect(lastLocation.search).toContain("departure=malang");
    expect(lastLocation.search).toContain("duration=half_day");

    // Remove duration chip
    const durChip = Array.from(
      view.querySelectorAll(".explore-active-chip"),
    ).find((el) => el.textContent?.includes("Durasi"))!;
    const removeBtn = durChip.querySelector<HTMLButtonElement>(
      ".explore-active-chip__remove",
    )!;

    await act(async () => {
      removeBtn.click();
    });

    // Duration is removed, so both Malang packages appear and duration param is GONE from actual location search
    expect(view.textContent).toContain("2 experience ditemukan");
    expect(view.textContent).toContain("Sehari Pelan di Lereng Hijau");
    expect(view.textContent).toContain("Ruang Kreatif Desa");
    expect(lastLocation.search).toContain("departure=malang");
    expect(lastLocation.search).not.toContain("duration");
  });

  it("resets all active filters via 'Reset semua' button and clears search URL string", async () => {
    const view = await renderExplore({}, [
      "/explore?query=lereng&departure=malang",
    ]);

    expect(view.textContent).toContain("1 experience ditemukan");
    expect(lastLocation.search).toContain("query=lereng");

    const resetLink = view.querySelector<HTMLButtonElement>(
      ".explore-reset-link",
    )!;
    await act(async () => {
      resetLink.click();
    });

    expect(view.textContent).toContain("5 experience ditemukan");
    expect(lastLocation.search).toBe("");
  });

  it("renders empty state and allows recovery via 'Reset filter' button", async () => {
    const view = await renderExplore({}, ["/explore?query=unmatched_term_xyz"]);

    expect(view.textContent).toContain(
      "Belum ada experience yang cocok dengan pencarian atau filter ini.",
    );

    const resetBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Reset filter"),
    )!;

    await act(() => resetBtn.click());

    expect(view.textContent).toContain("5 experience ditemukan");
  });

  it("renders error state with retry button and preserves URL state", async () => {
    const adapter = new MockExploreAdapter({
      failExploreCount: 1,
      errorMessage: "Gagal memuat katalog explore.",
    });

    const view = await renderExplore({ adapter }, [
      "/explore?departure=malang",
    ]);

    expect(view.textContent).toContain("Experience belum bisa dimuat.");

    const retryBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Coba lagi"),
    )!;

    await act(() => retryBtn.click());

    expect(view.textContent).toContain("2 experience ditemukan");
    expect(view.textContent).toContain("Dari: Malang");
  });

  it("manages draft state in FilterSheet properly (draft edits do not apply until Terapkan)", async () => {
    const view = await renderExplore();

    // Open filter sheet
    const filterBtn = view.querySelector<HTMLButtonElement>(
      ".explore-filter-btn",
    )!;
    await act(async () => {
      filterBtn.click();
    });

    expect(view.querySelector("dialog")).not.toBeNull();

    // Select budget chip inside sheet
    const budgetChip = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".explore-filter-chip"),
    ).find((b) => b.textContent?.includes("Sampai Rp200 ribu"))!;

    await act(async () => {
      budgetChip.click();
    });

    // Results in background must still show 5 (not committed yet)
    expect(view.textContent).toContain("5 experience ditemukan");

    // Click cancel/close
    const closeBtn = view.querySelector<HTMLButtonElement>(
      ".explore-sheet-close-btn",
    )!;
    await act(async () => {
      closeBtn.click();
    });

    // Still 5
    expect(view.textContent).toContain("5 experience ditemukan");

    // Open again, pick and Apply
    await act(async () => {
      filterBtn.click();
    });
    const budgetChip2 = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".explore-filter-chip"),
    ).find((b) => b.textContent?.includes("Sampai Rp200 ribu"))!;
    await act(async () => {
      budgetChip2.click();
    });

    const applyBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Terapkan Filter"),
    )!;
    await act(async () => {
      applyBtn.click();
    });

    // Applied!
    expect(view.textContent).toContain("1 experience ditemukan");
    expect(view.textContent).toContain("Ruang Kreatif Desa");
  });

  it("A & B. FilterSheet Reset clears draft only without modifying URL or applied results until Apply", async () => {
    const view = await renderExplore({}, ["/explore?departure=malang"]);
    expect(view.textContent).toContain("2 experience ditemukan");
    expect(view.textContent).toContain("Dari: Malang");

    // Open filter sheet
    const filterBtn = view.querySelector<HTMLButtonElement>(
      ".explore-filter-btn",
    )!;
    await act(async () => {
      filterBtn.click();
    });

    // In draft, click Reset
    const resetBtn = Array.from(view.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Reset",
    )!;
    await act(async () => {
      resetBtn.click();
    });

    // Sheet should STILL be open
    expect(view.querySelector("dialog")).not.toBeNull();
    // Applied background results still have 2 (not committed yet!)
    expect(view.textContent).toContain("2 experience ditemukan");

    // Now click Terapkan Filter
    const applyBtn = Array.from(view.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Terapkan Filter"),
    )!;
    await act(async () => {
      applyBtn.click();
    });

    // Now committed -> departure cleared -> all 5 show
    expect(view.textContent).toContain("5 experience ditemukan");
  });

  it("D. FilterSheet dialog handles Escape key by closing and discarding draft edits", async () => {
    const view = await renderExplore({}, ["/explore?departure=malang"]);

    const filterBtn = view.querySelector<HTMLButtonElement>(
      ".explore-filter-btn",
    )!;
    await act(async () => {
      filterBtn.click();
    });

    const dialog = view.querySelector("dialog")!;
    expect(dialog).not.toBeNull();

    // Select duration half_day in draft
    const halfDayChip = Array.from(
      view.querySelectorAll<HTMLButtonElement>(".explore-filter-chip"),
    ).find((b) => b.textContent?.includes("Setengah hari"))!;
    await act(async () => {
      halfDayChip.click();
    });

    // Trigger cancel/Escape on native dialog
    await act(async () => {
      dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    });

    // Sheet closed, results unchanged
    expect(view.querySelector("dialog")).toBeNull();
    expect(view.textContent).toContain("2 experience ditemukan");
    expect(view.textContent).not.toContain("Durasi: Setengah hari");
  });

  it("E. ignores unknown destination in URL safely without forcing empty state, without active chip, and with 0 active filter count", async () => {
    const view = await renderExplore({}, [
      "/explore?destination=DestinasiTidakAda",
    ]);

    // Unknown destination is safely ignored, so all 5 LIVE packages render
    expect(view.textContent).toContain("5 experience ditemukan");
    expect(view.textContent).not.toContain("Destinasi: DestinasiTidakAda");

    // Filter count badge should not be present (active count = 0)
    expect(view.querySelector(".explore-filter-count-badge")).toBeNull();
    // And invalid destination is canonicalized from URL
    expect(lastLocation.search).not.toContain("destination");
  });

  it("F. renders exactly four bottom navigation tabs via App shell with Explore active", async () => {
    sessionStore.setUser({
      id: "usr_shell_test",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(() =>
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/explore"] },
          createElement(App),
        ),
      ),
    );

    const navItems = container.querySelectorAll(".traveler-bottom-nav__item");
    expect(navItems.length).toBe(4);
    const labels = Array.from(navItems).map((el) => el.textContent?.trim());
    expect(labels).toEqual(["Home", "Explore", "My Trips", "Profile"]);

    const activeItem = container.querySelector(
      ".traveler-bottom-nav__item--active",
    );
    expect(activeItem?.textContent).toContain("Explore");
  });

  it("G. updates query search URL parameter upon form submit", async () => {
    const view = await renderExplore();

    const searchInput = view.querySelector<HTMLInputElement>(
      ".explore-search-input",
    )!;
    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter?.call(searchInput, "batu");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const searchForm = view.querySelector<HTMLFormElement>(
      ".explore-search-form",
    )!;
    await act(async () => {
      searchForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(view.textContent).toContain("1 experience ditemukan");
    expect(view.textContent).toContain('Kata kunci: "batu"');
    expect(lastLocation.search).toBe("?query=batu");
  });

  it("navigates package card tap to /packages/:packageId via App router", async () => {
    sessionStore.setUser({
      id: "usr_explore_nav",
      onboardingStatus: "COMPLETED",
    });

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/explore"] },
          createElement(App),
        ),
      );
    });

    const firstCard = container.querySelector<HTMLAnchorElement>(
      ".explore-package-card",
    )!;
    expect(firstCard).not.toBeNull();
    await act(async () => {
      firstCard.click();
    });

    expect(container.textContent).toContain("Package detail");
  });
});
