import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InvalidExtractionResultError } from "../core/validate-extraction-result";
import { assertExtractionSuccess } from "../test/assert-extraction-success";
import { runExtraction } from "./active-tab";
import { ExtractionExecutionError, UnsupportedPageError } from "./errors";

describe("runExtraction", () => {
  const query = vi.fn();
  const executeScript = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("browser", {
      tabs: { query },
      scripting: { executeScript },
    });
    query.mockResolvedValue([{ id: 42, url: "https://example.com/article" }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("injects the selected script into the active tab and validates the result", async () => {
    executeScript.mockResolvedValue([
      {
        frameId: 0,
        result: {
          ok: true,
          content: { title: "Article", html: "<p>Body</p>" },
        },
      },
    ]);

    const result = await runExtraction("article");

    assertExtractionSuccess(result);
    expect(result.content).toEqual({
      title: "Article",
      html: "<p>Body</p>",
    });
    expect(query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["/extract-article.js"],
    });
  });

  it("injects the full-page script for fullPage mode", async () => {
    executeScript.mockResolvedValue([
      {
        frameId: 0,
        result: {
          ok: true,
          content: { title: "Page", html: "<main>Content</main>" },
        },
      },
    ]);

    await runExtraction("fullPage");

    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["/extract-full-page.js"],
    });
  });

  it("returns a validated not-article result", async () => {
    executeScript.mockResolvedValue([
      { frameId: 0, result: { ok: false, reason: "not-article" } },
    ]);

    await expect(runExtraction("article")).resolves.toEqual({
      ok: false,
      reason: "not-article",
    });
  });

  it("rejects with UnsupportedPageError when there is no active tab", async () => {
    query.mockResolvedValue([]);

    await expect(runExtraction("article")).rejects.toThrow(
      UnsupportedPageError,
    );
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("wraps a tab query failure and preserves its cause", async () => {
    const cause = new Error("Query failed.");
    query.mockRejectedValue(cause);

    const error = await runExtraction("article").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ExtractionExecutionError);
    expect((error as Error).cause).toBe(cause);
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("classifies an access denial for a restricted page", async () => {
    const cause = new Error("Cannot access a chrome:// URL");
    query.mockResolvedValue([{ id: 42, url: "chrome://extensions" }]);
    executeScript.mockRejectedValue(cause);

    const error = await runExtraction("article").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(UnsupportedPageError);
    expect((error as Error).cause).toBe(cause);
  });

  it("classifies an unexpected injection failure on a normal page", async () => {
    const cause = new Error("Injected script crashed.");
    executeScript.mockRejectedValue(cause);

    const error = await runExtraction("article").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ExtractionExecutionError);
    expect((error as Error).cause).toBe(cause);
  });

  it.each([[[]], [[{ frameId: 0 }]], [[{ frameId: 0, result: { ok: true } }]]])(
    "does not classify an invalid injection result as unsupported: %j",
    async (injected) => {
      executeScript.mockResolvedValue(injected);

      await expect(runExtraction("article")).rejects.toThrow(
        InvalidExtractionResultError,
      );
    },
  );
});
