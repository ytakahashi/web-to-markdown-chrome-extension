import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { buildMarkdown } from "../core/markdown/build-markdown";
import { assertExtractionSuccess } from "../test/assert-extraction-success";
import { extractArticle } from "./extract-article";
import { extractFullPage } from "./extract-full-page";

// Keeping import.meta.url behind a binding prevents Vite from rewriting this
// test-only filesystem URL as a browser asset URL.
const MODULE_URL = import.meta.url;
const FIXTURE_ROOT = fileURLToPath(
  new URL("../../manual/fixtures/", MODULE_URL),
);

function fixtureDocument(name: string): Document {
  const html = readFileSync(resolve(FIXTURE_ROOT, name), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

describe("manual extraction fixtures", () => {
  it("provides a stable article extraction path", () => {
    const doc = fixtureDocument("article.html");
    const imageUrl = new URL("assets/sample.svg", doc.baseURI).href;
    const result = extractArticle(doc);

    assertExtractionSuccess(result);
    expect(result.content.html).toContain("<table>");
    expect(result.content.html).toContain("data:image/gif;base64");
    expect(result.content.html).toContain(`src="${imageUrl}"`);
  });

  it("keeps the non-article fixture usable for the full-page fallback", () => {
    const doc = fixtureDocument("non-article.html");
    const projectUrl = new URL("projects/alpha", doc.baseURI).href;
    const imageUrl = new URL("assets/sample.svg", doc.baseURI).href;

    expect(doc.body.innerHTML).toContain("<style>");

    expect(extractArticle(doc)).toEqual({
      ok: false,
      reason: "not-article",
    });

    const fallback = extractFullPage(doc);
    assertExtractionSuccess(fallback);
    expect(fallback.content.html).toContain('alt="Alpha project"');
    expect(fallback.content.html).toContain(`href="${projectUrl}"`);
    expect(fallback.content.html).toContain(`src="${imageUrl}"`);
    expect(fallback.content.html).not.toContain("<script");
    expect(fallback.content.html).not.toContain("<style");

    const markdown = buildMarkdown(fallback.content);
    expect(markdown).toContain(projectUrl);
    expect(markdown).toContain(imageUrl);
    expect(markdown).toContain("Unsafe dashboard action");
    expect(markdown).not.toContain("data:image");
    expect(markdown).not.toContain("javascript:");
    expect(markdown).not.toContain("nonArticleScriptExecuted");
  });

  it("keeps the preview fixture usable in article mode", () => {
    const doc = fixtureDocument("preview.html");
    const result = extractArticle(doc);

    assertExtractionSuccess(result);
  });

  it("provides preview structures through full-page extraction", () => {
    const doc = fixtureDocument("preview.html");
    const result = extractFullPage(doc);

    assertExtractionSuccess(result);
    const markdown = buildMarkdown(result.content);

    expect(markdown).toContain("~~removed content~~");
    expect(markdown).toMatch(/^\s+-\s+Child item/m);
    expect(markdown).toMatch(/-\s+\[x\]\s*Completed task/i);
    expect(markdown).toContain("| Feature | Expected preview |");
    expect(markdown).toContain('```ts\nconst format = "markdown";');
    expect(markdown).toContain("![Preview diagram]");
    expect(markdown).toContain("https://example.com/preview");
    expect(markdown).toContain("mailto:preview@example.com");
    expect(markdown).toContain("tel:+123456789");
    expect(markdown).toContain("#destinations");
    expect(markdown).not.toContain("data:image");
    expect(markdown).not.toContain("javascript:");
  });
});
