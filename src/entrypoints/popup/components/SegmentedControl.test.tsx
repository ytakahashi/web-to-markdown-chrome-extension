import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./SegmentedControl";

type TestValue = "first" | "second";

const OPTIONS = [
  { value: "first", label: "First", description: "Show the first value" },
  {
    value: "second",
    label: "Second",
    description: "Show the second value",
  },
] as const;

function SegmentedControlHarness() {
  const [value, setValue] = useState<TestValue>("first");
  return (
    <SegmentedControl
      ariaLabel="Test values"
      onSelect={setValue}
      options={OPTIONS}
      value={value}
    />
  );
}

describe("SegmentedControl", () => {
  it("exposes an accessible radiogroup with roving tab stops", () => {
    render(
      <SegmentedControl
        ariaLabel="Test values"
        onSelect={vi.fn()}
        options={OPTIONS}
        value="first"
      />,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Test values" }),
    ).toBeTruthy();
    const first = screen.getByRole("radio", {
      name: "First: Show the first value",
    });
    const second = screen.getByRole("radio", {
      name: "Second: Show the second value",
    });

    expect(first.textContent).toBe("First");
    expect(first.getAttribute("aria-checked")).toBe("true");
    expect(first.tabIndex).toBe(0);
    expect(second.textContent).toBe("Second");
    expect(second.getAttribute("aria-checked")).toBe("false");
    expect(second.tabIndex).toBe(-1);
  });

  it("places the radiogroup once in the Tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <SegmentedControl
          ariaLabel="Test values"
          onSelect={vi.fn()}
          options={OPTIONS}
          value="first"
        />
        <button type="button">After</button>
      </>,
    );

    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("radio", { name: "First: Show the first value" }),
    );

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "After" }),
    );
  });

  it("moves focus and selection with every arrow key", async () => {
    const user = userEvent.setup();
    render(<SegmentedControlHarness />);

    const first = screen.getByRole("radio", {
      name: "First: Show the first value",
    });
    const second = screen.getByRole("radio", {
      name: "Second: Show the second value",
    });
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute("aria-checked")).toBe("true");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute("aria-checked")).toBe("true");

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute("aria-checked")).toBe("true");

    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute("aria-checked")).toBe("true");
  });

  it("focuses the next option before notifying the consumer", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Test values"
        onSelect={(value) => {
          onSelect(value, document.activeElement);
        }}
        options={OPTIONS}
        value="first"
      />,
    );

    const first = screen.getByRole("radio", {
      name: "First: Show the first value",
    });
    const second = screen.getByRole("radio", {
      name: "Second: Show the second value",
    });
    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(onSelect).toHaveBeenCalledWith("second", second);
  });

  it("selects a value when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Test values"
        onSelect={onSelect}
        options={OPTIONS}
        value="first"
      />,
    );

    await user.click(
      screen.getByRole("radio", { name: "Second: Show the second value" }),
    );

    expect(onSelect).toHaveBeenCalledWith("second");
  });

  it("ignores unrelated keys", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Test values"
        onSelect={onSelect}
        options={OPTIONS}
        value="first"
      />,
    );

    const first = screen.getByRole("radio", {
      name: "First: Show the first value",
    });
    first.focus();
    await user.keyboard("{Escape}");

    expect(document.activeElement).toBe(first);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
