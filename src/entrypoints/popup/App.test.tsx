import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { copyText } from "../../browser/clipboard";
import { App } from "./App";
import { useMarkdown } from "./use-markdown";

vi.mock("../../browser/clipboard", () => ({
  copyText: vi.fn(),
}));

vi.mock("./use-markdown", () => ({
  useMarkdown: vi.fn(),
}));

const copyTextMock = vi.mocked(copyText);
const useMarkdownMock = vi.mocked(useMarkdown);

describe("App", () => {
  beforeEach(() => {
    copyTextMock.mockReset();
    copyTextMock.mockResolvedValue(undefined);
    useMarkdownMock.mockReset();
    useMarkdownMock.mockReturnValue({
      state: { kind: "loading" },
      convertFullPage: vi.fn(),
    });
  });

  it("renders an accessible loading state", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Markdown" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Converting current page…",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders read-only Markdown and moves focus to it", () => {
    useMarkdownMock.mockReturnValue({
      state: { kind: "ready", markdown: "# Article\n\nBody\n" },
      convertFullPage: vi.fn(),
    });

    render(<App />);

    const output = screen.getByRole("textbox", { name: "Markdown output" });
    expect(output).toBeInstanceOf(HTMLTextAreaElement);
    expect((output as HTMLTextAreaElement).readOnly).toBe(true);
    expect((output as HTMLTextAreaElement).value).toBe("# Article\n\nBody\n");
    expect(document.activeElement).toBe(output);
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("announces Copy status through the persistent live region", async () => {
    useMarkdownMock.mockReturnValue({
      state: { kind: "ready", markdown: "# Article\n" },
      convertFullPage: vi.fn(),
    });

    render(<App />);

    const button = screen.getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("Markdown copied.");
    });
    expect(copyTextMock).toHaveBeenCalledWith("# Article\n");
  });

  it("runs full-page conversion from the keyboard", async () => {
    const user = userEvent.setup();
    const convertFullPage = vi.fn().mockResolvedValue(undefined);
    useMarkdownMock.mockReturnValue({
      state: { kind: "notArticle" },
      convertFullPage,
    });

    render(<App />);

    const button = screen.getByRole("button", {
      name: "Convert entire page",
    });
    expect(document.activeElement).toBe(button);
    expect(screen.getByRole("status").textContent).toBe(
      "Article content wasn't found. This page might not use an article layout. You can convert the entire page instead.",
    );

    await user.keyboard("{Enter}");

    expect(convertFullPage).toHaveBeenCalledTimes(1);
  });

  it("renders an unsupported-page notice without conversion controls", () => {
    useMarkdownMock.mockReturnValue({
      state: { kind: "unsupported" },
      convertFullPage: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "This page isn't supported" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "This page isn't supported. Web to Markdown can't run on this page. Try opening a regular web page.",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps one live region mounted while status messages change", () => {
    const { rerender } = render(<App />);
    const liveRegion = screen.getByRole("status");

    useMarkdownMock.mockReturnValue({
      state: { kind: "unsupported" },
      convertFullPage: vi.fn(),
    });
    rerender(<App />);

    expect(screen.getByRole("status")).toBe(liveRegion);
    expect(liveRegion.textContent).toBe(
      "This page isn't supported. Web to Markdown can't run on this page. Try opening a regular web page.",
    );
  });

  it("renders an unexpected failure and its error summary", () => {
    useMarkdownMock.mockReturnValue({
      state: { kind: "failed", message: "Extraction script failed." },
      convertFullPage: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Conversion failed" }),
    ).toBeTruthy();
    expect(screen.getByText("Extraction script failed.")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
