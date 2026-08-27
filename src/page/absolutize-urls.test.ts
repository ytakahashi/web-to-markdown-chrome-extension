import { describe, expect, it } from "vitest";

import { absolutizeUrls } from "./absolutize-urls";

describe("absolutizeUrls", () => {
  it("resolves relative links and image sources against the base URL", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <a id="relative-link" href="../guide">Guide</a>
      <img id="relative-image" src="images/cover.png">
    `;

    absolutizeUrls(root, "https://example.com/articles/current/");

    expect(root.querySelector("#relative-link")?.getAttribute("href")).toBe(
      "https://example.com/articles/guide",
    );
    expect(root.querySelector("#relative-image")?.getAttribute("src")).toBe(
      "https://example.com/articles/current/images/cover.png",
    );
  });

  it.each([
    ["fragment", "#details"],
    ["email", "mailto:author@example.com"],
    ["telephone", "tel:+15550123"],
  ])("preserves a %s link", (_, href) => {
    const root = document.createElement("div");
    root.innerHTML = `<a href="${href}">Link</a>`;

    absolutizeUrls(root, "https://example.com/article");

    expect(root.querySelector("a")?.getAttribute("href")).toBe(href);
  });

  it("removes only the malformed attribute and continues processing", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <a id="invalid" href="http://[">Invalid</a>
      <a id="valid" href="next">Valid</a>
    `;

    absolutizeUrls(root, "https://example.com/articles/");

    expect(root.querySelector("#invalid")?.hasAttribute("href")).toBe(false);
    expect(root.querySelector("#valid")?.getAttribute("href")).toBe(
      "https://example.com/articles/next",
    );
  });
});
