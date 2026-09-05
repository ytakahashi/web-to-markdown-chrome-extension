import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { copyText } from "../../browser/clipboard";
import { App } from "./App";
import {
  useMarkdown,
  type MarkdownController,
  type ModeState,
} from "./use-markdown";

vi.mock("../../browser/clipboard", () => ({
  copyText: vi.fn(),
}));

vi.mock("./use-markdown", () => ({
  useMarkdown: vi.fn(),
}));

const copyTextMock = vi.mocked(copyText);
const useMarkdownMock = vi.mocked(useMarkdown);

function mockController(
  state: ModeState,
  overrides: Partial<Omit<MarkdownController, "state">> = {},
): MarkdownController {
  const controller: MarkdownController = {
    mode: "article",
    state,
    unsupported: false,
    selectMode: vi.fn(),
    ...overrides,
  };
  useMarkdownMock.mockReturnValue(controller);
  return controller;
}

describe("App", () => {
  beforeEach(() => {
    copyTextMock.mockReset();
    copyTextMock.mockResolvedValue(undefined);
    useMarkdownMock.mockReset();
    mockController({ kind: "loading" });
  });

  it("renders an accessible loading state", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Markdown" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Converting the main article content…",
    );
    expect(
      screen.getByRole("radiogroup", { name: "Extraction mode" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("announces full-page loading without disabling mode selection", () => {
    mockController({ kind: "loading" }, { mode: "fullPage" });

    render(<App />);

    expect(screen.getByRole("status").textContent).toBe(
      "Converting the entire page…",
    );
    const fullPage = screen.getByRole("radio", {
      name: "Full page: Convert the entire page",
    });
    expect(fullPage.getAttribute("aria-checked")).toBe("true");
    expect((fullPage as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders read-only Markdown and moves focus to it", () => {
    mockController({
      kind: "ready",
      markdown: "# Article\n\nBody\n",
    });

    render(<App />);

    const output = screen.getByRole("textbox", { name: "Markdown output" });
    expect(output).toBeInstanceOf(HTMLTextAreaElement);
    expect((output as HTMLTextAreaElement).readOnly).toBe(true);
    expect((output as HTMLTextAreaElement).value).toBe("# Article\n\nBody\n");
    expect(document.activeElement).toBe(output);
    expect(
      screen.getByRole("radiogroup", { name: "Result view" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("radio", { name: "Markdown: Show the Markdown source" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("switches to Preview without starting another conversion", async () => {
    const user = userEvent.setup();
    const selectMode = vi.fn();
    mockController(
      { kind: "ready", markdown: "# Article\n\nRendered body\n" },
      { selectMode },
    );

    render(<App />);
    await user.click(
      screen.getByRole("radio", {
        name: "Preview: Show the rendered Markdown",
      }),
    );

    expect(
      screen.queryByRole("textbox", { name: "Markdown output" }),
    ).toBeNull();
    expect(
      screen.getByRole("article", { name: "Markdown preview" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1, name: "Article" }),
    ).toBeTruthy();
    expect(selectMode).not.toHaveBeenCalled();
  });

  it("keeps the result switcher hidden outside the ready state", () => {
    const { rerender } = render(<App />);
    expect(
      screen.queryByRole("radiogroup", { name: "Result view" }),
    ).toBeNull();

    mockController({ kind: "notArticle" });
    rerender(<App />);
    expect(
      screen.queryByRole("radiogroup", { name: "Result view" }),
    ).toBeNull();

    mockController({ kind: "noContent" }, { mode: "fullPage" });
    rerender(<App />);
    expect(
      screen.queryByRole("radiogroup", { name: "Result view" }),
    ).toBeNull();

    mockController({ kind: "failed", message: "Failed." });
    rerender(<App />);
    expect(
      screen.queryByRole("radiogroup", { name: "Result view" }),
    ).toBeNull();

    mockController({ kind: "loading" }, { unsupported: true });
    rerender(<App />);
    expect(
      screen.queryByRole("radiogroup", { name: "Result view" }),
    ).toBeNull();
  });

  it("announces Copy status through the persistent live region", async () => {
    mockController({ kind: "ready", markdown: "# Article\n" });

    render(<App />);

    const button = screen.getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("Markdown copied.");
    });
    expect(copyTextMock).toHaveBeenCalledWith("# Article\n");
  });

  it("copies the Markdown source and preserves Copy status in Preview", async () => {
    const user = userEvent.setup();
    const markdown = "# Source heading\n\n**Source body**\n";
    mockController({ kind: "ready", markdown });

    render(<App />);
    await user.click(
      screen.getByRole("radio", {
        name: "Preview: Show the rendered Markdown",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
    });
    expect(copyTextMock).toHaveBeenCalledWith(markdown);

    await user.click(
      screen.getByRole("radio", {
        name: "Markdown: Show the Markdown source",
      }),
    );
    expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
  });

  it("keeps focus on the result switcher without changing the live region", async () => {
    const user = userEvent.setup();
    mockController({ kind: "ready", markdown: "# Article\n" });
    render(<App />);
    const liveRegion = screen.getByRole("status");
    const preview = screen.getByRole("radio", {
      name: "Preview: Show the rendered Markdown",
    });

    await user.click(preview);

    expect(document.activeElement).toBe(preview);
    expect(screen.getByRole("status")).toBe(liveRegion);
    expect(liveRegion.textContent).toBe("");
  });

  it("keeps focus on the selected mode when ready content changes", async () => {
    const user = userEvent.setup();
    const selectMode = vi.fn();
    mockController({ kind: "ready", markdown: "# Article\n" }, { selectMode });
    const { rerender } = render(<App />);
    const fullPage = screen.getByRole("radio", {
      name: "Full page: Convert the entire page",
    });

    await user.click(fullPage);
    expect(selectMode).toHaveBeenCalledWith("fullPage");

    mockController(
      { kind: "ready", markdown: "# Full page\n" },
      { mode: "fullPage", selectMode },
    );
    rerender(<App />);

    expect(document.activeElement).toBe(fullPage);
    expect(
      (
        screen.getByRole("textbox", {
          name: "Markdown output",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("# Full page\n");
  });

  it("preserves Preview across mode and content changes", async () => {
    const user = userEvent.setup();
    const selectMode = vi.fn();
    mockController({ kind: "ready", markdown: "# Article\n" }, { selectMode });
    const { rerender } = render(<App />);

    await user.click(
      screen.getByRole("radio", {
        name: "Preview: Show the rendered Markdown",
      }),
    );
    const fullPage = screen.getByRole("radio", {
      name: "Full page: Convert the entire page",
    });
    await user.click(fullPage);

    mockController(
      { kind: "ready", markdown: "# Full page\n\nUpdated body\n" },
      { mode: "fullPage", selectMode },
    );
    rerender(<App />);

    expect(
      screen
        .getByRole("radio", { name: "Preview: Show the rendered Markdown" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.queryByRole("textbox", { name: "Markdown output" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: "Full page" }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(fullPage);
  });

  it("resets Copy state and content when the mode changes", async () => {
    mockController({ kind: "ready", markdown: "# Article\n" });
    const { rerender } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
    });

    mockController(
      { kind: "ready", markdown: "# Full page\n" },
      { mode: "fullPage" },
    );
    rerender(<App />);

    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("");
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(copyTextMock).toHaveBeenLastCalledWith("# Full page\n");
    });
  });

  it("runs full-page conversion from the keyboard", async () => {
    const user = userEvent.setup();
    const selectMode = vi.fn();
    mockController({ kind: "notArticle" }, { selectMode });

    const { rerender } = render(<App />);

    const button = screen.getByRole("button", {
      name: "Convert entire page",
    });
    expect(document.activeElement).toBe(button);
    expect(screen.getByRole("status").textContent).toBe(
      "Article content wasn't found. This page might not use an article layout. You can convert the entire page instead.",
    );

    await user.keyboard("{Enter}");

    expect(selectMode).toHaveBeenCalledWith("fullPage");

    mockController(
      { kind: "ready", markdown: "# Full page\n" },
      { mode: "fullPage", selectMode },
    );
    rerender(<App />);

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Markdown output" }),
    );
  });

  it("focuses the selected Preview after the fallback conversion", async () => {
    const user = userEvent.setup();
    const selectMode = vi.fn();
    mockController(
      { kind: "ready", markdown: "# Full page\n" },
      { mode: "fullPage", selectMode },
    );
    const { rerender } = render(<App />);

    await user.click(
      screen.getByRole("radio", {
        name: "Preview: Show the rendered Markdown",
      }),
    );

    mockController({ kind: "notArticle" }, { selectMode });
    rerender(<App />);
    await user.click(
      screen.getByRole("button", { name: "Convert entire page" }),
    );
    expect(selectMode).toHaveBeenCalledWith("fullPage");

    mockController(
      { kind: "ready", markdown: "# Full page\n" },
      { mode: "fullPage", selectMode },
    );
    rerender(<App />);

    expect(document.activeElement).toBe(
      screen.getByRole("article", { name: "Markdown preview" }),
    );
  });

  it("renders a no-content notice without fallback controls", () => {
    mockController(
      { kind: "noContent" },
      { mode: "fullPage", selectMode: vi.fn() },
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "No content was found" }),
    ).toBeTruthy();
    expect(
      screen.getByText("This page has no content to convert."),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "No content was found. This page has no content to convert.",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders an unsupported-page notice without conversion controls", () => {
    mockController(
      { kind: "ready", markdown: "# Hidden\n" },
      { unsupported: true },
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "This page isn't supported" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "This page isn't supported. Web to Markdown can't run on this page. Try opening a regular web page.",
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("keeps one live region mounted while status messages change", () => {
    const { rerender } = render(<App />);
    const liveRegion = screen.getByRole("status");

    mockController({ kind: "loading" }, { unsupported: true });
    rerender(<App />);

    expect(screen.getByRole("status")).toBe(liveRegion);
    expect(liveRegion.textContent).toBe(
      "This page isn't supported. Web to Markdown can't run on this page. Try opening a regular web page.",
    );
  });

  it("renders an unexpected failure and its error summary", () => {
    mockController({
      kind: "failed",
      message: "Extraction script failed.",
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
