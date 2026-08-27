import { describe, expect, it } from "vitest";

import { assertExtractionSuccess } from "../test/assert-extraction-success";
import { extractArticle } from "./extract-article";

function createArticleDocument(): Document {
  const doc = document.implementation.createHTMLDocument();
  doc.title = "Example article";
  const base = doc.createElement("base");
  base.href = "https://example.com/posts/current/";
  doc.head.append(base);
  const paragraph =
    "This is meaningful article text written to give the extractor enough context. ".repeat(
      12,
    );
  doc.body.innerHTML = `
    <article>
      <h1>Readable heading</h1>
      <p>${paragraph}</p>
      <p><a href="../reference">Related reference</a></p>
    </article>
  `;
  return doc;
}

describe("extractArticle", () => {
  it("extracts article content without changing the original document", () => {
    const doc = createArticleDocument();
    const originalHtml = doc.documentElement.outerHTML;

    const result = extractArticle(doc);

    assertExtractionSuccess(result);
    expect(result.content.title).toBe("Example article");
    expect(result.content.html).toContain("meaningful article text");
    expect(result.content.html).toContain(
      'href="https://example.com/posts/reference"',
    );
    expect(doc.documentElement.outerHTML).toBe(originalHtml);
    expect(structuredClone(result)).toEqual(result);
  });

  it("returns not-article for an empty document", () => {
    const doc = document.implementation.createHTMLDocument("");

    expect(extractArticle(doc)).toEqual({
      ok: false,
      reason: "not-article",
    });
  });
});
