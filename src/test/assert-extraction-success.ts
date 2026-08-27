import { expect } from "vitest";

import type { ExtractionResult } from "../core/types";

type SuccessfulExtraction = Extract<ExtractionResult, { ok: true }>;

export function assertExtractionSuccess(
  result: ExtractionResult,
): asserts result is SuccessfulExtraction {
  expect(result.ok).toBe(true);
}
