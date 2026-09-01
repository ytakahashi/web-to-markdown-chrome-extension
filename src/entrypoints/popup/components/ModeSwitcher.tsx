import { useRef, type KeyboardEvent } from "react";

import type { ExtractionMode } from "../../../core/types";
import { EXTRACTION_MODE_OPTIONS } from "../extraction-modes";

export type ModeSwitcherProps = {
  mode: ExtractionMode;
  onSelect: (mode: ExtractionMode) => void;
};

function adjacentIndex(
  key: string,
  currentIndex: number,
  optionCount: number,
): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return (currentIndex - 1 + optionCount) % optionCount;
    case "ArrowRight":
    case "ArrowDown":
      return (currentIndex + 1) % optionCount;
    default:
      return null;
  }
}

export function ModeSwitcher({ mode, onSelect }: ModeSwitcherProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    const nextIndex = adjacentIndex(
      event.key,
      currentIndex,
      EXTRACTION_MODE_OPTIONS.length,
    );
    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextOption = EXTRACTION_MODE_OPTIONS[nextIndex];
    if (!nextOption) {
      return;
    }

    // Focus first so rendering the selected mode cannot move focus elsewhere.
    optionRefs.current[nextIndex]?.focus();
    onSelect(nextOption.mode);
  };

  return (
    <div
      aria-label="Extraction mode"
      className="mode-switcher"
      role="radiogroup"
    >
      {EXTRACTION_MODE_OPTIONS.map((option, index) => {
        const selected = option.mode === mode;
        return (
          <button
            aria-checked={selected}
            aria-label={`${option.label}: ${option.description}`}
            className="mode-switcher__option"
            key={option.mode}
            onClick={() => onSelect(option.mode)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            role="radio"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
