import { describe, expect, it } from "vitest";

import {
  InvalidExtractionResultError,
  validateExtractionResult,
} from "./validate-extraction-result";

describe("validateExtractionResult", () => {
  it("returns a reconstructed success result", () => {
    const input = {
      ok: true,
      content: { title: "Article", html: "<p>Body</p>", ignored: true },
      ignored: true,
    };

    const result = validateExtractionResult(input);

    expect(result).toEqual({
      ok: true,
      content: { title: "Article", html: "<p>Body</p>" },
    });
    expect(result).not.toBe(input);
  });

  it("accepts the not-article result", () => {
    expect(
      validateExtractionResult({ ok: false, reason: "not-article" }),
    ).toEqual({
      ok: false,
      reason: "not-article",
    });
  });

  it("accepts the no-content result", () => {
    expect(
      validateExtractionResult({ ok: false, reason: "no-content" }),
    ).toEqual({
      ok: false,
      reason: "no-content",
    });
  });

  it.each([
    undefined,
    null,
    [],
    {},
    { ok: "true" },
    { ok: true },
    { ok: true, content: null },
    { ok: true, content: { title: 1, html: "<p>Body</p>" } },
    { ok: true, content: { title: "Article", html: null } },
    { ok: false },
    { ok: false, reason: "empty" },
  ])("rejects an invalid result: %j", (value) => {
    expect(() => validateExtractionResult(value)).toThrow(
      InvalidExtractionResultError,
    );
  });
});
