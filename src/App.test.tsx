import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { App } from "./App";

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
