import { describe, expect, it } from "vitest";

import { assertExtractionSuccess } from "../test/assert-extraction-success";
import { extractFullPage } from "./extract-full-page";

function createDocument(title = "Example page"): Document {
  const doc = document.implementation.createHTMLDocument();
  doc.title = title;
  return doc;
}

function parseExtractedHtml(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("extractFullPage", () => {
  it("extracts a clone without changing the original document", () => {
    const doc = createDocument();
    const base = doc.createElement("base");
    base.href = "https://example.com/articles/current/";
    doc.head.append(base);
    doc.body.innerHTML = `
      <main><a href="../guide">Guide</a><img src="cover.png"></main>
    `;
    const originalHtml = doc.documentElement.outerHTML;

    const result = extractFullPage(doc);

    assertExtractionSuccess(result);
    const extracted = parseExtractedHtml(result.content.html);
    expect(result.content.title).toBe("Example page");
    expect(extracted.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com/articles/guide",
    );
    expect(extracted.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/articles/current/cover.png",
    );
    expect(doc.documentElement.outerHTML).toBe(originalHtml);
    expect(structuredClone(result)).toEqual(result);
  });

  it("removes non-content elements from the clone", () => {
    const doc = createDocument();
    doc.body.innerHTML = `
      <main>Content</main>
      <script>window.changed = true</script>
      <style>main { color: red; }</style>
      <noscript>Enable scripts</noscript>
      <template>Template</template>
      <svg><text>Vector</text></svg>
      <canvas>Canvas</canvas>
      <link rel="stylesheet">
      <meta name="description" content="Description">
    `;

    const result = extractFullPage(doc);

    assertExtractionSuccess(result);
    const extracted = parseExtractedHtml(result.content.html);
    expect(
      extracted.querySelector(
        "script, style, noscript, template, svg, canvas, link, meta",
      ),
    ).toBeNull();
    expect(extracted.querySelector("main")?.textContent).toBe("Content");
  });

  it("retains structural elements", () => {
    const doc = createDocument();
    doc.body.innerHTML = `
      <header>Header</header>
      <nav>Navigation</nav>
      <main>Content</main>
      <footer>Footer</footer>
    `;

    const result = extractFullPage(doc);

    assertExtractionSuccess(result);
    const extracted = parseExtractedHtml(result.content.html);
    expect(extracted.querySelector("header")?.textContent).toBe("Header");
    expect(extracted.querySelector("nav")?.textContent).toBe("Navigation");
    expect(extracted.querySelector("footer")?.textContent).toBe("Footer");
  });

  it("returns not-article when the document has no body", () => {
    const doc = createDocument();
    doc.body.remove();

    expect(extractFullPage(doc)).toEqual({
      ok: false,
      reason: "not-article",
    });
  });
});
