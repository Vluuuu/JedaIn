import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { OpeningHero } from "./OpeningHero";
import { SwipeJourneyControl } from "./SwipeJourneyControl";

describe("Landing OpeningHero & SwipeJourneyControl", () => {
  it("renders OpeningHero with logo, masuk action, headline, and swipe control", () => {
    const markup = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(OpeningHero)),
    );

    expect(markup).toContain('class="opening-hero__logo"');
    expect(markup).toContain('href="/login"');
    expect(markup).toContain("Masuk");
    expect(markup).toContain("Temukan jeda");
    expect(markup).toContain("yang benar-benar");
    expect(markup).toContain("kamu butuhkan.");
    expect(markup).toContain('class="swipe-control"');
  });

  it("renders SwipeJourneyControl with accessible button semantics and cues", () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SwipeJourneyControl, { targetRoute: "/login" }),
      ),
    );

    expect(markup).toContain('class="swipe-control"');
    expect(markup).toContain('class="swipe-control__cues"');
    expect(markup).toContain('class="swipe-control__thumb"');
    expect(markup).toContain('aria-label="Geser ke atas untuk memulai"');
  });
});
