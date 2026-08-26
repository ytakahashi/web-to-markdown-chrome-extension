import type { ExtractionResult } from "./types";

export class InvalidExtractionResultError extends Error {
  override readonly name = "InvalidExtractionResultError";

  constructor() {
    super("The extraction script returned an invalid result.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateExtractionResult(value: unknown): ExtractionResult {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    throw new InvalidExtractionResultError();
  }

  if (value.ok) {
    const content = value.content;
    if (
      !isRecord(content) ||
      typeof content.title !== "string" ||
      typeof content.html !== "string"
    ) {
      throw new InvalidExtractionResultError();
    }

    // Reconstruct the value instead of trusting objects received across the tab boundary.
    return {
      ok: true,
      content: { title: content.title, html: content.html },
    };
  }

  if (value.reason !== "not-article") {
    throw new InvalidExtractionResultError();
  }

  return { ok: false, reason: "not-article" };
}
