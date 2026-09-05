import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownPreview } from "./MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders basic Markdown structure", () => {
    const markdown = [
      "# Heading",
      "",
      "Text with *emphasis* and **strong text**.",
      "",
      "- Parent",
      "  - Child",
    ].join("\n");
    const { container } = render(<MarkdownPreview markdown={markdown} />);

    expect(
      screen.getByRole("article", { name: "Markdown preview" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1, name: "Heading" }),
    ).toBeTruthy();
    expect(container.querySelector("em")?.textContent).toBe("emphasis");
    expect(container.querySelector("strong")?.textContent).toBe("strong text");
    expect(container.querySelectorAll("ul")).toHaveLength(2);
    expect(container.querySelector("li li")?.textContent).toBe("Child");
  });

  it("renders GFM tables, strikethrough, and read-only task lists", () => {
    const markdown = [
      "| Name | Value |",
      "| --- | --- |",
      "| Alpha | 1 |",
      "",
      "~~Removed~~",
      "",
      "- [x] Done",
      "- [ ] Todo",
    ].join("\n");
    const { container } = render(<MarkdownPreview markdown={markdown} />);

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeTruthy();
    expect(container.querySelector("del")?.textContent).toBe("Removed");

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes.every((checkbox) => checkbox.disabled)).toBe(true);
    expect(checkboxes[0]?.checked).toBe(true);
    expect(checkboxes[1]?.checked).toBe(false);
  });

  it("renders fenced code without interpreting it", () => {
    const markdown = '```ts\nconst markup = "<strong>text</strong>";\n```';
    const { container } = render(<MarkdownPreview markdown={markdown} />);

    const code = container.querySelector("pre > code");
    expect(code?.className).toBe("language-ts");
    expect(code?.textContent).toBe('const markup = "<strong>text</strong>";\n');
    expect(code?.querySelector("strong")).toBeNull();
  });

  it("leaves raw HTML visible as text instead of creating elements", () => {
    const markdown = [
      '<script>alert("unsafe")</script>',
      "",
      '<img src="https://example.com/tracker.png" onerror="alert(1)">',
    ].join("\n");
    const { container } = render(<MarkdownPreview markdown={markdown} />);
    const preview = screen.getByRole("article", { name: "Markdown preview" });

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(preview.textContent).toContain('<script>alert("unsafe")</script>');
    expect(preview.textContent).toContain(
      '<img src="https://example.com/tracker.png" onerror="alert(1)">',
    );
  });

  it("renders images as text placeholders without creating requests", () => {
    const markdown = [
      "![Diagram](https://example.com/image.png)",
      "",
      "![](https://example.com/unlabelled.png)",
      "",
      "![Missing source]()",
    ].join("\n");
    const { container } = render(<MarkdownPreview markdown={markdown} />);

    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.getByText("🖼 Diagram (https://example.com/image.png)"),
    ).toBeTruthy();
    expect(
      screen.getByText("🖼 Image (https://example.com/unlabelled.png)"),
    ).toBeTruthy();
    expect(screen.getByText("🖼 Missing source")).toBeTruthy();
  });

  it.each([
    "http://example.com",
    "https://example.com",
    "mailto:user@example.com",
  ])("opens a displayable link outside the popup: %s", (href) => {
    render(<MarkdownPreview markdown={`[Destination](${href})`} />);

    const link = screen.getByRole("link", { name: "Destination" });
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it.each([
    "/relative/path",
    "#section",
    "tel:+123456789",
    "custom:destination",
    "javascript:alert(1)",
    "xmpp:user@example.com",
    "ircs://example.com/channel",
  ])("renders a non-displayable link as text: %s", (href) => {
    const { container } = render(
      <MarkdownPreview markdown={`[Destination](${href})`} />,
    );

    expect(screen.queryByRole("link", { name: "Destination" })).toBeNull();
    expect(screen.getByText("Destination").tagName).toBe("SPAN");
    expect(container.querySelector("a")).toBeNull();
  });

  it("focuses the preview when requested", () => {
    render(<MarkdownPreview autoFocus markdown="# Heading" />);

    expect(document.activeElement).toBe(
      screen.getByRole("article", { name: "Markdown preview" }),
    );
  });
});
