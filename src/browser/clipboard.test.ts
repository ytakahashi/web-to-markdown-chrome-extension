import { afterEach, describe, expect, it, vi } from "vitest";

import { copyText } from "./clipboard";

describe("copyText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes the provided text to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await copyText("# Markdown\n");

    expect(writeText).toHaveBeenCalledWith("# Markdown\n");
  });

  it("preserves a clipboard rejection", async () => {
    const cause = new Error("Clipboard is unavailable.");
    const writeText = vi.fn().mockRejectedValue(cause);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyText("text")).rejects.toBe(cause);
  });
});
