import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ExtractionMode } from "../../../core/types";
import { ModeSwitcher } from "./ModeSwitcher";

function ModeSwitcherHarness() {
  const [mode, setMode] = useState<ExtractionMode>("article");
  return <ModeSwitcher mode={mode} onSelect={setMode} />;
}

describe("ModeSwitcher", () => {
  it("exposes an accessible radiogroup with roving tab stops", () => {
    render(<ModeSwitcher mode="article" onSelect={vi.fn()} />);

    expect(
      screen.getByRole("radiogroup", { name: "Extraction mode" }),
    ).toBeTruthy();
    const article = screen.getByRole("radio", {
      name: "Article: Convert the main article content",
    });
    const fullPage = screen.getByRole("radio", {
      name: "Full page: Convert the entire page",
    });

    expect(article.textContent).toBe("Article");
    expect(article.getAttribute("aria-checked")).toBe("true");
    expect(article.tabIndex).toBe(0);
    expect(fullPage.textContent).toBe("Full page");
    expect(fullPage.getAttribute("aria-checked")).toBe("false");
    expect(fullPage.tabIndex).toBe(-1);
  });

  it("places the radiogroup once in the Tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <ModeSwitcher mode="article" onSelect={vi.fn()} />
        <button type="button">After</button>
      </>,
    );

    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("radio", {
        name: "Article: Convert the main article content",
      }),
    );

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "After" }),
    );
  });

  it("moves focus and selection with every arrow key", async () => {
    const user = userEvent.setup();
    render(<ModeSwitcherHarness />);

    const article = screen.getByRole("radio", {
      name: "Article: Convert the main article content",
    });
    const fullPage = screen.getByRole("radio", {
      name: "Full page: Convert the entire page",
    });
    article.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(fullPage);
    expect(fullPage.getAttribute("aria-checked")).toBe("true");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(article);
    expect(article.getAttribute("aria-checked")).toBe("true");

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(fullPage);
    expect(fullPage.getAttribute("aria-checked")).toBe("true");

    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(article);
    expect(article.getAttribute("aria-checked")).toBe("true");
  });

  it("selects a mode when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ModeSwitcher mode="article" onSelect={onSelect} />);

    await user.click(
      screen.getByRole("radio", {
        name: "Full page: Convert the entire page",
      }),
    );

    expect(onSelect).toHaveBeenCalledWith("fullPage");
  });
});
