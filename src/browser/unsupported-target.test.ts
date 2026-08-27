import { describe, expect, it } from "vitest";

import { isUnsupportedTarget } from "./unsupported-target";

describe("isUnsupportedTarget", () => {
  it.each([
    "chrome://extensions",
    "edge://settings",
    "about:blank",
    "devtools://devtools/bundled/inspector.html",
    "file:///tmp/article.html",
    "https://chromewebstore.google.com/detail/example",
    "https://chrome.google.com/webstore/detail/example",
    "https://example.com/report.pdf?download=1",
  ])("recognizes an access denial for %s", (url) => {
    expect(
      isUnsupportedTarget(
        url,
        new Error(`Cannot access contents of url "${url}".`),
      ),
    ).toBe(true);
  });

  it("recognizes an explicit restricted target without a tab URL", () => {
    expect(
      isUnsupportedTarget(
        undefined,
        new Error("Cannot access a chrome:// URL"),
      ),
    ).toBe(true);
  });

  it("does not classify an unexpected failure from a restricted URL", () => {
    expect(
      isUnsupportedTarget(
        "chrome://extensions",
        new Error("Injected script crashed."),
      ),
    ).toBe(false);
  });

  it("does not classify an ordinary HTTPS page from a generic denial", () => {
    expect(
      isUnsupportedTarget(
        "https://example.com/article",
        new Error("Cannot access the selected page."),
      ),
    ).toBe(false);
  });

  it("does not treat non-Web-Store chrome.google.com pages as restricted", () => {
    expect(
      isUnsupportedTarget(
        "https://chrome.google.com/example",
        new Error("Cannot access the selected page."),
      ),
    ).toBe(false);
  });
});
