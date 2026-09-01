import { StrictMode, type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runExtraction } from "../../browser/active-tab";
import { UnsupportedPageError } from "../../browser/errors";
import type { ExtractionResult } from "../../core/types";
import { InvalidExtractionResultError } from "../../core/validate-extraction-result";
import { useMarkdown } from "./use-markdown";

vi.mock("../../browser/active-tab", () => ({
  runExtraction: vi.fn(),
}));

const runExtractionMock = vi.mocked(runExtraction);

const ARTICLE_RESULT: ExtractionResult = {
  ok: true,
  content: { title: "Article", html: "<p>Body</p>" },
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

  it("transitions from loading to ready with built Markdown", async () => {
    const extraction = deferred<ExtractionResult>();
    runExtractionMock.mockReturnValue(extraction.promise);

    const { result } = renderHook(() => useMarkdown());

    expect(result.current.state).toEqual({ kind: "loading" });

    extraction.resolve(ARTICLE_RESULT);
    await waitFor(() => {
      expect(result.current.state).toEqual({
        kind: "ready",
        markdown: "# Article\n\nBody\n",
      });
    });
    expect(runExtractionMock).toHaveBeenCalledWith("article");
  });

  it("loads the full page only after an explicit fallback request", async () => {
    const fallback = deferred<ExtractionResult>();
    runExtractionMock
      .mockResolvedValueOnce({ ok: false, reason: "not-article" })
      .mockReturnValueOnce(fallback.promise);

    const { result } = renderHook(() => useMarkdown());

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "notArticle" });
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(1);
    expect(runExtractionMock).toHaveBeenCalledWith("article");

    let firstFallback!: Promise<void>;
    let duplicateFallback!: Promise<void>;
    act(() => {
      firstFallback = result.current.convertFullPage();
      duplicateFallback = result.current.convertFullPage();
    });

    expect(result.current.state).toEqual({ kind: "loading" });
    expect(runExtractionMock).toHaveBeenCalledTimes(2);
    expect(runExtractionMock).toHaveBeenLastCalledWith("fullPage");

    fallback.resolve(ARTICLE_RESULT);
    await act(async () => {
      await Promise.all([firstFallback, duplicateFallback]);
    });
    expect(result.current.state).toEqual({
      kind: "ready",
      markdown: "# Article\n\nBody\n",
    });
  });

  it("maps a full-page no-content result to notArticle", async () => {
    runExtractionMock
      .mockResolvedValueOnce({ ok: false, reason: "not-article" })
      .mockResolvedValueOnce({ ok: false, reason: "no-content" });

    const { result } = renderHook(() => useMarkdown());
    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "notArticle" });
    });

    await act(async () => {
      await result.current.convertFullPage();
    });

    expect(result.current.state).toEqual({ kind: "notArticle" });
    expect(runExtractionMock).toHaveBeenCalledTimes(2);
  });

  it("maps an unsupported page to unsupported", async () => {
    runExtractionMock.mockRejectedValue(
      new UnsupportedPageError("Cannot run on this page."),
    );

    const { result } = renderHook(() => useMarkdown());

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "unsupported" });
    });
  });

  it.each([
    [
      new InvalidExtractionResultError(),
      "The extraction script returned an invalid result.",
    ],
    [new Error("Conversion failed."), "Conversion failed."],
    ["unknown failure", "An unexpected error occurred."],
  ])("maps an unexpected failure to failed", async (cause, message) => {
    runExtractionMock.mockRejectedValue(cause);

    const { result } = renderHook(() => useMarkdown());

    await waitFor(() => {
      expect(result.current.state).toEqual({ kind: "failed", message });
    });
  });

  it("runs the initial extraction once under StrictMode", async () => {
    runExtractionMock.mockResolvedValue(ARTICLE_RESULT);

    const { result } = renderHook(() => useMarkdown(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() => {
      expect(result.current.state.kind).toBe("ready");
    });
    expect(runExtractionMock).toHaveBeenCalledTimes(1);
  });
});
