import { StrictMode, type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runExtraction } from "../../browser/active-tab";
import { UnsupportedPageError } from "../../browser/errors";
import type { ExtractionResult } from "../../core/types";
import { InvalidExtractionResultError } from "../../core/validate-extraction-result";
import { DEFAULT_EXTRACTION_MODE } from "./extraction-modes";
import { useMarkdown } from "./use-markdown";

vi.mock("../../browser/active-tab", () => ({
  runExtraction: vi.fn(),
}));

const runExtractionMock = vi.mocked(runExtraction);

const ARTICLE_RESULT: ExtractionResult = {
  ok: true,
  content: { title: "Article", html: "<p>Body</p>" },
};

const FULL_PAGE_RESULT: ExtractionResult = {
  ok: true,
  content: { title: "Page", html: "<main>Full page</main>" },
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function StrictWrapper({ children }: PropsWithChildren) {
  return <StrictMode>{children}</StrictMode>;
}

describe("useMarkdown", () => {
  beforeEach(() => {
    runExtractionMock.mockReset();
  });

  it("starts in article mode and builds Markdown automatically", async () => {
    const extraction = deferred<ExtractionResult>();
    runExtractionMock.mockReturnValue(extraction.promise);

    const { result } = renderHook(() => useMarkdown());

    expect(result.current).toMatchObject({
      mode: DEFAULT_EXTRACTION_MODE,
      state: { kind: "loading" },
      unsupported: false,
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(1);
    expect(runExtractionMock).toHaveBeenCalledWith(DEFAULT_EXTRACTION_MODE);

    extraction.resolve(ARTICLE_RESULT);
    await waitFor(() => {
      expect(result.current.state).toEqual({
        kind: "ready",
        markdown: "# Article\n\nBody\n",
      });
    });
  });

  it("does not load the full page until it is selected", async () => {
    const fullPageExtraction = deferred<ExtractionResult>();
    runExtractionMock.mockImplementation((mode) =>
      mode === "article"
        ? Promise.resolve({ ok: false, reason: "not-article" })
        : fullPageExtraction.promise,
    );

    const { result } = renderHook(() => useMarkdown());

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "notArticle" });
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.selectMode("fullPage");
    });

    expect(result.current.mode).toBe("fullPage");
    expect(result.current.state).toEqual({ kind: "loading" });
    expect(runExtractionMock).toHaveBeenLastCalledWith("fullPage");

    await act(async () => {
      fullPageExtraction.resolve(FULL_PAGE_RESULT);
      await fullPageExtraction.promise;
    });
    expect(result.current.state).toEqual({
      kind: "ready",
      markdown: "# Page\n\nFull page\n",
    });
  });

  it("maps extraction reasons to mode-specific states", async () => {
    runExtractionMock
      .mockResolvedValueOnce({ ok: false, reason: "not-article" })
      .mockResolvedValueOnce({ ok: false, reason: "no-content" });

    const { result } = renderHook(() => useMarkdown());
    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "notArticle" });
    });

    act(() => {
      result.current.selectMode("fullPage");
    });
    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "noContent" });
    });
  });

  it("reuses completed results when switching back to a mode", async () => {
    runExtractionMock.mockImplementation((mode) =>
      Promise.resolve(mode === "article" ? ARTICLE_RESULT : FULL_PAGE_RESULT),
    );

    const { result } = renderHook(() => useMarkdown());
    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    act(() => {
      result.current.selectMode("fullPage");
    });
    await waitFor(() => {
      expect(result.current.mode).toBe("fullPage");
      expect(result.current.state.kind).toBe("ready");
    });

    act(() => {
      result.current.selectMode("article");
    });

    expect(result.current.mode).toBe("article");
    expect(result.current.state).toEqual({
      kind: "ready",
      markdown: "# Article\n\nBody\n",
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(2);
  });

  it("keeps an article result when full-page extraction fails", async () => {
    runExtractionMock.mockImplementation((mode) =>
      mode === "article"
        ? Promise.resolve(ARTICLE_RESULT)
        : Promise.reject(new Error("Full-page conversion failed.")),
    );

    const { result } = renderHook(() => useMarkdown());
    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    act(() => {
      result.current.selectMode("fullPage");
    });
    await waitFor(() => {
      expect(result.current.state).toEqual({
        kind: "failed",
        message: "Full-page conversion failed.",
      });
    });

    act(() => {
      result.current.selectMode("article");
    });
    expect(result.current.state).toEqual({
      kind: "ready",
      markdown: "# Article\n\nBody\n",
    });
  });

  it("ignores repeated selections of the current mode", async () => {
    const fullPageExtraction = deferred<ExtractionResult>();
    runExtractionMock.mockImplementation((mode) =>
      mode === "article"
        ? Promise.resolve(ARTICLE_RESULT)
        : fullPageExtraction.promise,
    );

    const { result } = renderHook(() => useMarkdown());
    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    act(() => {
      result.current.selectMode("fullPage");
      result.current.selectMode("fullPage");
    });

    expect(runExtractionMock).toHaveBeenCalledTimes(2);
    expect(runExtractionMock).toHaveBeenCalledWith("fullPage");

    await act(async () => {
      fullPageExtraction.resolve(FULL_PAGE_RESULT);
      await fullPageExtraction.promise;
    });
  });

  it("injects each selected mode once under StrictMode", async () => {
    runExtractionMock.mockImplementation((mode) =>
      Promise.resolve(mode === "article" ? ARTICLE_RESULT : FULL_PAGE_RESULT),
    );

    const { result } = renderHook(() => useMarkdown(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.selectMode("fullPage");
      result.current.selectMode("fullPage");
    });
    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });

    expect(runExtractionMock).toHaveBeenCalledTimes(2);
    expect(runExtractionMock.mock.calls).toEqual([["article"], ["fullPage"]]);
  });

  it("stores a result that completes while another mode is selected", async () => {
    const articleExtraction = deferred<ExtractionResult>();
    const fullPageExtraction = deferred<ExtractionResult>();
    runExtractionMock.mockImplementation((mode) =>
      mode === "article"
        ? articleExtraction.promise
        : fullPageExtraction.promise,
    );

    const { result } = renderHook(() => useMarkdown());

    act(() => {
      result.current.selectMode("fullPage");
      result.current.selectMode("article");
    });
    expect(result.current.mode).toBe("article");
    expect(result.current.state).toEqual({ kind: "loading" });

    await act(async () => {
      fullPageExtraction.resolve(FULL_PAGE_RESULT);
      await fullPageExtraction.promise;
    });
    expect(result.current.mode).toBe("article");
    expect(result.current.state).toEqual({ kind: "loading" });

    act(() => {
      result.current.selectMode("fullPage");
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({
      kind: "ready",
      markdown: "# Page\n\nFull page\n",
    });

    await act(async () => {
      articleExtraction.resolve(ARTICLE_RESULT);
      await articleExtraction.promise;
    });
  });

  it("blocks mode selection after an unsupported-page result", async () => {
    runExtractionMock.mockRejectedValue(
      new UnsupportedPageError("Cannot run on this page."),
    );

    const { result } = renderHook(() => useMarkdown());

    await waitFor(() => {
      expect(result.current.unsupported).toBe(true);
    });

    act(() => {
      result.current.selectMode("fullPage");
    });

    expect(result.current.mode).toBe("article");
    expect(runExtractionMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      new InvalidExtractionResultError(),
      "The extraction script returned an invalid result.",
    ],
    [new Error("Conversion failed."), "Conversion failed."],
    ["unknown failure", "An unexpected error occurred."],
  ])(
    "maps an unexpected failure to the selected mode",
    async (cause, message) => {
      runExtractionMock.mockRejectedValue(cause);

      const { result } = renderHook(() => useMarkdown());

      await waitFor(() => {
        expect(result.current.state).toEqual({ kind: "failed", message });
      });
      expect(result.current.unsupported).toBe(false);
    },
  );
});
