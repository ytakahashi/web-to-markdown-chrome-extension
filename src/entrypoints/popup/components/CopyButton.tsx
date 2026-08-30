import { useCallback, useEffect, useRef, useState } from "react";

import { copyText } from "../../../browser/clipboard";
import { Notice } from "./Notice";

type CopyStatus = "idle" | "copying" | "copied" | "failed";

const COPIED_DURATION_MS = 2_000;

export type CopyButtonProps = {
  markdown: string;
  onAnnouncement: (message: string) => void;
};

function buttonLabel(status: CopyStatus): string {
  switch (status) {
    case "copying":
      return "Copying…";
    case "copied":
      return "Copied!";
    default:
      return "Copy";
  }
}

export function CopyButton({ markdown, onAnnouncement }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const announcementRef = useRef(onAnnouncement);
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string) => {
    announcementRef.current(message);
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    announcementRef.current = onAnnouncement;
  }, [onAnnouncement]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearResetTimer();
      // This cleanup must only run on unmount: rerunning it when the caller
      // replaces its callback would cancel the pending "Copied!" reset timer.
      announcementRef.current("");
    };
  }, [clearResetTimer]);

  const handleCopy = useCallback(async () => {
    // This ref is the copy gate. aria-disabled keeps keyboard focus on the
    // button, so repeated click events must be rejected here instead.
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    clearResetTimer();
    setStatus("copying");
    announce("Copying Markdown…");

    try {
      await copyText(markdown);
      if (!mountedRef.current) {
        return;
      }

      setStatus("copied");
      announce("Markdown copied.");
      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        if (mountedRef.current) {
          setStatus("idle");
          announce("");
        }
      }, COPIED_DURATION_MS);
    } catch {
      if (mountedRef.current) {
        setStatus("failed");
        announce("");
      }
    } finally {
      pendingRef.current = false;
    }
  }, [announce, clearResetTimer, markdown]);

  return (
    <div className="copy-controls">
      {status === "failed" && (
        <Notice
          compact
          role="alert"
          tone="error"
          message="Couldn't copy the Markdown. Please try again."
        />
      )}
      <button
        aria-disabled={status === "copying"}
        className="button button--primary"
        onClick={() => void handleCopy()}
        type="button"
      >
        {buttonLabel(status)}
      </button>
    </div>
  );
}
