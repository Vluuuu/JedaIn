import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";
import {
  adminNavigation,
  partnerDestinationNavigation,
  partnerEoNavigation,
} from "./components/shells";
import { adminSessionStore } from "./features/admin";
import { partnerSessionStore } from "./features/eo";
import { sessionStore } from "./features/onboarding";

function renderRoute(path: string) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)),
  );
}

describe("App shell routing", () => {
  afterEach(() => {
    sessionStore.reset();
    adminSessionStore.reset();
  });

  it.each([
    ["/", "traveler-public-shell", "Temukan jeda"],
    ["/partner/eo", "workspace-shell--partner", "Overview"],
    ["/belum-ada", "page", "Halaman tidak ditemukan."],
  ])("selects the expected shell for %s", (path, shellClass, text) => {
    const markup = renderRoute(path);

    expect(markup).toContain(shellClass);
    expect(markup).toContain(text);
  });

  it("selects the expected shell for authenticated /partner/destination", () => {
    partnerSessionStore.loginAsDemoDestination();
    const markup = renderRoute("/partner/destination");

    expect(markup).toContain("workspace-shell--partner");
    expect(markup).toContain("Lereng Hijau Batu");
  });

  it("selects the expected shell for authenticated /admin", () => {
    adminSessionStore.loginAsDemoAdmin();
    const markup = renderRoute("/admin");

    expect(markup).toContain("workspace-shell--admin");
    expect(markup).toContain("Overview Operasional Kurasi");
  });

  it("renders exactly four traveler navigation tabs for authenticated completed user on /home", () => {
    sessionStore.setOnboardingStatus("COMPLETED");
    const markup = renderRoute("/home");
    const tabLabels = ["Home", "Explore", "My Trips", "Profile"];

    expect(
      (markup.match(/class="traveler-bottom-nav__item/g) ?? []).length,
    ).toBe(4);
    for (const label of tabLabels) expect(markup).toContain(`>${label}</span>`);
  });

  it("renders exact EO partner navigation labels and links", () => {
    partnerSessionStore.loginAsDemoApproved("CERTIFIED_GUIDE");
    const markup = renderRoute("/partner/eo");
    for (const item of partnerEoNavigation) {
      expect(markup).toContain(`href="${item.to}"`);
      expect(markup).toContain(`>${item.label}</span>`);
    }
    expect(markup).toContain(">Sessions</span>");
    expect(markup).not.toContain("Destination Profile");
  });

  it("exposes only the single Destination overview navigation while keeping EO navigation untouched", () => {
    partnerSessionStore.loginAsDemoDestination();
    const markup = renderRoute("/partner/destination");

    expect(partnerDestinationNavigation).toEqual([
      { to: "/partner/destination", label: "Overview" },
    ]);
    expect(markup).toContain('href="/partner/destination"');
    expect(markup).toContain(">Overview</span>");
    expect(markup).not.toContain("Destination Profile");
    expect(markup).not.toContain(">Verification</span>");
    expect(markup).not.toContain(">Schedule</span>");
    expect(markup).not.toContain(">Capacity</span>");
    expect(markup).not.toContain(">Reviews</span>");
    expect(markup).not.toContain(">Insights</span>");
    expect(markup).not.toContain(">Packages</span>");
    expect(markup).not.toContain(">Bookings</span>");

    expect(partnerEoNavigation.map((item) => item.label)).toEqual([
      "Overview",
      "Insights",
      "Packages",
      "Sessions",
      "Bookings",
      "Destinations",
      "Reviews",
      "Profile",
    ]);
  });

  it("renders exact Admin navigation labels matching source-of-truth", () => {
    adminSessionStore.loginAsDemoAdmin();
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
    "/onboarding/consent",
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
