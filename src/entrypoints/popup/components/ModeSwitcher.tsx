import type { ExtractionMode } from "../../../core/types";
import { EXTRACTION_MODE_OPTIONS } from "../extraction-modes";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "./SegmentedControl";

export type ModeSwitcherProps = {
  mode: ExtractionMode;
  onSelect: (mode: ExtractionMode) => void;
};

const MODE_OPTIONS = EXTRACTION_MODE_OPTIONS.map(
  ({ mode, label, description }) => ({
    value: mode,
    label,
    description,
  }),
) satisfies readonly SegmentedControlOption<ExtractionMode>[];

export function ModeSwitcher({ mode, onSelect }: ModeSwitcherProps) {
  return (
    <SegmentedControl
      ariaLabel="Extraction mode"
      onSelect={onSelect}
      options={MODE_OPTIONS}
      value={mode}
    />
  );
}
