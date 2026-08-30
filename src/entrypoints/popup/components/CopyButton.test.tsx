import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { copyText } from "../../../browser/clipboard";
import { CopyButton } from "./CopyButton";

vi.mock("../../../browser/clipboard", () => ({
  copyText: vi.fn(),
}));

const copyTextMock = vi.mocked(copyText);

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function UnstableAnnouncementHarness() {
  const [announcement, setAnnouncement] = useState("");

  return (
    <>
      <CopyButton
        markdown="text"
        onAnnouncement={(message) => setAnnouncement(message)}
      />
      <p data-testid="announcement">{announcement}</p>
    </>
  );
}

describe("CopyButton", () => {
  beforeEach(() => {
    copyTextMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies Markdown and restores its label after two seconds", async () => {
    vi.useFakeTimers();
    copyTextMock.mockResolvedValue(undefined);
    const onAnnouncement = vi.fn();
    render(
      <CopyButton markdown={"# Article\n"} onAnnouncement={onAnnouncement} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await Promise.resolve();
    });

    expect(copyTextMock).toHaveBeenCalledWith("# Article\n");
    const copiedButton = screen.getByRole("button", { name: "Copied!" });
    expect(copiedButton.hasAttribute("aria-live")).toBe(false);
    expect(onAnnouncement).toHaveBeenNthCalledWith(1, "Copying Markdown…");
    expect(onAnnouncement).toHaveBeenNthCalledWith(2, "Markdown copied.");

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    expect(onAnnouncement).toHaveBeenLastCalledWith("");
  });

  it("prevents duplicate writes while a copy is pending", async () => {
    const pendingCopy = deferred<void>();
    copyTextMock.mockReturnValue(pendingCopy.promise);
    const onAnnouncement = vi.fn();
    render(<CopyButton markdown="text" onAnnouncement={onAnnouncement} />);

    const button = screen.getByRole("button", { name: "Copy" });
    button.focus();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(copyTextMock).toHaveBeenCalledTimes(1);
    expect(onAnnouncement).toHaveBeenCalledTimes(1);
    expect(onAnnouncement).toHaveBeenCalledWith("Copying Markdown…");
    const pendingButton = screen.getByRole("button", { name: "Copying…" });
    expect(pendingButton.getAttribute("aria-disabled")).toBe("true");
    expect((pendingButton as HTMLButtonElement).disabled).toBe(false);
    expect(document.activeElement).toBe(pendingButton);

    await act(async () => {
      pendingCopy.resolve();
      await pendingCopy.promise;
    });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Copied!" }),
    );
    expect(onAnnouncement).toHaveBeenLastCalledWith("Markdown copied.");
  });

  it("keeps the content available and allows retry after a failure", async () => {
    copyTextMock
      .mockRejectedValueOnce(new Error("Clipboard denied."))
      .mockResolvedValueOnce(undefined);
    const onAnnouncement = vi.fn();
    render(<CopyButton markdown="retry me" onAnnouncement={onAnnouncement} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(
      await screen.findByText("Couldn't copy the Markdown. Please try again."),
    ).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(onAnnouncement).toHaveBeenLastCalledWith("");

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
    });
    expect(copyTextMock).toHaveBeenCalledTimes(2);
    expect(copyTextMock).toHaveBeenLastCalledWith("retry me");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onAnnouncement).toHaveBeenLastCalledWith("Markdown copied.");
  });

  it("cleans up the success timer when unmounted", async () => {
    vi.useFakeTimers();
    copyTextMock.mockResolvedValue(undefined);
    const onAnnouncement = vi.fn();
    const { unmount } = render(
      <CopyButton markdown="text" onAnnouncement={onAnnouncement} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await Promise.resolve();
    });
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(onAnnouncement).toHaveBeenLastCalledWith("");
  });

  it("keeps the reset timer when the announcement callback changes", async () => {
    vi.useFakeTimers();
    copyTextMock.mockResolvedValue(undefined);
    render(<UnstableAnnouncementHarness />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
    expect(screen.getByTestId("announcement").textContent).toBe(
      "Markdown copied.",
    );
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    expect(screen.getByTestId("announcement").textContent).toBe("");
  });
});
