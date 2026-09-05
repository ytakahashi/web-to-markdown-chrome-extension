import { useRef, type KeyboardEvent } from "react";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export type SegmentedControlProps<T extends string> = {
  ariaLabel: string;
  onSelect: (value: T) => void;
  options: readonly SegmentedControlOption<T>[];
  value: T;
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

export function SegmentedControl<T extends string>({
  ariaLabel,
  onSelect,
  options,
  value,
}: SegmentedControlProps<T>) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    const nextIndex = adjacentIndex(event.key, currentIndex, options.length);
    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextOption = options[nextIndex];
    if (!nextOption) {
      return;
    }

    // Focus first so rendering the selected value cannot move focus elsewhere.
    optionRefs.current[nextIndex]?.focus();
    onSelect(nextOption.value);
  };

  return (
    <div aria-label={ariaLabel} className="segmented-control" role="radiogroup">
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            aria-checked={selected}
            aria-label={`${option.label}: ${option.description}`}
            className="segmented-control__option"
            key={option.value}
            onClick={() => onSelect(option.value)}
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
