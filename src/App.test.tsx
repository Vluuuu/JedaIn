import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App routing baseline", () => {
  it.each([
    ["/", "Fondasi aplikasi siap."],
    ["/belum-ada", "Halaman tidak ditemukan."],
  ])("renders %s", (path, expectedText) => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(App),
      ),
    );

    expect(markup).toContain(expectedText);
  });
});
