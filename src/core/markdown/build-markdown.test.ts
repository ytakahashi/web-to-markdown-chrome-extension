import { describe, expect, it } from "vitest";

import { buildMarkdown } from "./build-markdown";

describe("buildMarkdown", () => {
  it("adds the title as an H1", () => {
    expect(buildMarkdown({ title: "Article", html: "<p>Body</p>" })).toBe(
      "# Article\n\nBody\n",
    );
  });

  it("does not add an H1 for an empty title", () => {
    expect(buildMarkdown({ title: "", html: "<p>Body</p>" })).toBe("Body\n");
  });

  it("normalizes whitespace in the title", () => {
    expect(
      buildMarkdown({ title: "  An\n\tArticle  ", html: "<p>Body</p>" }),
    ).toBe("# An Article\n\nBody\n");
  });

  it("returns one newline for empty title and whitespace-only body", () => {
    expect(buildMarkdown({ title: "  ", html: " \n " })).toBe("\n");
  });
});
