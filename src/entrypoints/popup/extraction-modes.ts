import type { ExtractionMode } from "../../core/types";

export type ExtractionModeOption = {
  mode: ExtractionMode;
  label: string;
  /** Additional context included in the accessible name after the visual label. */
  description: string;
};

// Array order is also the visual and arrow-key navigation order.
export const EXTRACTION_MODE_OPTIONS = [
  {
    mode: "article",
    label: "Article",
    description: "Convert the main article content",
  },
  {
    mode: "fullPage",
    label: "Full page",
    description: "Convert the entire page",
  },
] as const satisfies readonly ExtractionModeOption[];

type AssertAllModesListed<T extends never> = T;

// Adding an ExtractionMode without a switcher option becomes a type error here.
export type ModesCoveredByOptions = AssertAllModesListed<
  Exclude<ExtractionMode, (typeof EXTRACTION_MODE_OPTIONS)[number]["mode"]>
>;

export const DEFAULT_EXTRACTION_MODE: ExtractionMode = "article";
