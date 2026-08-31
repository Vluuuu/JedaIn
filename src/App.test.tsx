import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import {
  adminNavigation,
  partnerDestinationNavigation,
  partnerEoNavigation,
} from "./components/shells";

function renderRoute(path: string) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
  );
}

describe("App shell routing", () => {
  it.each([
    ["/", "traveler-public-shell", "Temukan jeda"],
    ["/home", "traveler-app-shell", "Home"],
    ["/partner/eo", "workspace-shell--partner", "Overview"],
    ["/partner/destination", "workspace-shell--partner", "Overview"],
    ["/admin", "workspace-shell--admin", "Overview"],
    ["/belum-ada", "page", "Halaman tidak ditemukan."],
  ])("selects the expected shell for %s", (path, shellClass, text) => {
    const markup = renderRoute(path);

    expect(markup).toContain(shellClass);
    expect(markup).toContain(text);
  });

  it("renders exactly four traveler navigation tabs", () => {
    const markup = renderRoute("/home");
    const tabLabels = ["Home", "Explore", "My Trips", "Profile"];

    expect(
      (markup.match(/class="traveler-bottom-nav__item/g) ?? []).length,
    ).toBe(4);
    for (const label of tabLabels) expect(markup).toContain(`>${label}</span>`);
  });

  it("renders exact EO partner navigation labels and links", () => {
    const markup = renderRoute("/partner/eo");
    for (const item of partnerEoNavigation) {
      expect(markup).toContain(`href="${item.to}"`);
      expect(markup).toContain(`>${item.label}</span>`);
    }
    expect(markup).toContain(">Sessions</span>");
    expect(markup).not.toContain("Destination Profile");
  });

  it("renders exact Destination partner navigation labels and links without EO items", () => {
    const markup = renderRoute("/partner/destination");
    for (const item of partnerDestinationNavigation) {
      expect(markup).toContain(`href="${item.to}"`);
      expect(markup).toContain(`>${item.label}</span>`);
    }
    expect(markup).not.toContain(">Insights</span>");
    expect(markup).not.toContain(">Packages</span>");
    expect(markup).not.toContain(">Bookings</span>");
  });

  it("renders exact Admin navigation labels matching source-of-truth", () => {
    const markup = renderRoute("/admin");
    for (const item of adminNavigation) {
      expect(markup).toContain(`href="${item.to}"`);
      const escapedLabel = item.label.replace(/&/g, "&amp;");
      expect(markup).toContain(`>${escapedLabel}</span>`);
    }
    expect(markup).toContain("EO Approvals");
    expect(markup).toContain("Destination Verification");
    expect(markup).toContain("Package Approvals");
    expect(markup).toContain("Bookings / Payments");
    expect(markup).toContain("Trust &amp; Status");
    expect(markup).toContain("Audit / Activity");
  });

  it.each([
    "/onboarding/quiz",
    "/payment/booking-1",
    "/partner/login",
    "/admin/login",
  ])("hides distracting navigation for %s", (path) => {
    const markup = renderRoute(path);

    expect(markup).toContain('data-navigation="hidden"');
    expect(markup).not.toContain("traveler-bottom-nav");
    expect(markup).not.toContain("workspace-navigation");
  });
});
