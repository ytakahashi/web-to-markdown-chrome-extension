import { describe, expect, it } from "vitest";

import { htmlToMarkdown } from "./html-to-markdown";

describe("htmlToMarkdown", () => {
  it("uses the configured base Markdown styles", () => {
    const html = `
      <h2>Heading</h2>
      <p><em>Emphasis</em> and <strong>Strong</strong></p>
      <hr />
    `;

    expect(htmlToMarkdown(html)).toBe(
      ["## Heading", "", "_Emphasis_ and **Strong**", "", "---"].join("\n"),
    );
  });

  it("converts a GFM table", () => {
    const html = `
      <table>
        <thead><tr><th>Name</th><th>Value</th></tr></thead>
        <tbody><tr><td>Alpha</td><td>1</td></tr></tbody>
      </table>
    `;

    expect(htmlToMarkdown(html)).toBe(
      ["| Name | Value |", "| --- | --- |", "| Alpha | 1 |"].join("\n"),
    );
  });

  it("uses fenced code blocks and preserves the language", () => {
    const html = '<pre><code class="language-ts">const value = 1;</code></pre>';

    expect(htmlToMarkdown(html)).toBe("```ts\nconst value = 1;\n```");
  });

  it("drops data URI images", () => {
    const html =
      '<p>Before<img src="data:image/png;base64,AAAA" alt="Large" />After</p>';

    expect(htmlToMarkdown(html)).toBe("BeforeAfter");
  });

  it("preserves ordinary images with absolute URLs", () => {
    const html = '<img src="https://example.com/image.png" alt="Diagram" />';

    expect(htmlToMarkdown(html)).toBe(
      "![Diagram](https://example.com/image.png)",
    );
  });

  it("preserves nested list structure", () => {
    const html = "<ul><li>Parent<ul><li>Child</li></ul></li></ul>";
    const markdown = htmlToMarkdown(html);

    expect(markdown).toMatch(/^-\s+Parent/m);
    expect(markdown).toMatch(/^\s+-\s+Child/m);
  });

  it.each(["del", "s", "strike"])(
    "converts <%s> to GFM strikethrough",
    (tag) => {
      expect(htmlToMarkdown(`<${tag}>Removed</${tag}>`)).toBe("~~Removed~~");
    },
  );

  it("converts task lists", () => {
    const html = `
      <ul>
        <li><input type="checkbox" checked />Done</li>
        <li><input type="checkbox" />Todo</li>
      </ul>
    `;
    const markdown = htmlToMarkdown(html);

    expect(markdown).toMatch(/-\s+\[x\]\s*Done/i);
    expect(markdown).toMatch(/-\s+\[ \]\s*Todo/);
  });

  it("removes non-content elements and their contents", () => {
    const html = `
      <p>Visible</p>
      <script>script content</script>
      <style>style content</style>
      <noscript>noscript content</noscript>
      <template>template content</template>
    `;

    expect(htmlToMarkdown(html)).toBe("Visible");
  });

  it.each([
    "javascript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,unsafe",
  ])(
    "drops an unsafe link destination while preserving its text: %s",
    (href) => {
      expect(htmlToMarkdown(`<a href="${href}">Link text</a>`)).toBe(
        "Link text",
      );
    },
  );

  it("drops unsafe links with controls embedded in the scheme", () => {
    const html = '<a href="java&#9;script:alert(1)">Link text</a>';

    expect(htmlToMarkdown(html)).toBe("Link text");
  });

  it("drops unsafe images", () => {
    const html = `
      <img src="javascript:alert(1)" alt="JavaScript" />
      <img src="vbscript:msgbox(1)" alt="VBScript" />
    `;

    expect(htmlToMarkdown(html)).toBe("");
  });

  it("drops unsafe images with controls embedded in the scheme", () => {
    const html = '<img src="java&#10;script:alert(1)" alt="Unsafe" />';

    expect(htmlToMarkdown(html)).toBe("");
  });

  it("preserves ordinary inline links", () => {
    const html = '<a href="https://example.com/article">Article</a>';

    expect(htmlToMarkdown(html)).toBe("[Article](https://example.com/article)");
  });

  it("returns an empty string for whitespace-only HTML", () => {
    expect(htmlToMarkdown("  \n\t  ")).toBe("");
  });
});
