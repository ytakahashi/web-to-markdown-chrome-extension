import { useState } from "react";

import type { ExtractionMode } from "../../core/types";
import { CopyButton } from "./components/CopyButton";
import { FallbackPrompt } from "./components/FallbackPrompt";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { MarkdownView } from "./components/MarkdownView";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { Notice } from "./components/Notice";
import { useMarkdown, type ModeState } from "./use-markdown";

const NOTICES = {
  notArticle: {
    title: "Article content wasn't found",
    message:
      "This page might not use an article layout. You can convert the entire page instead.",
  },
  noContent: {
    title: "No content was found",
    message: "This page has no content to convert.",
  },
  unsupported: {
    title: "This page isn't supported",
    message:
      "Web to Markdown can't run on this page. Try opening a regular web page.",
  },
  failed: {
    title: "Conversion failed",
    message: "Web to Markdown couldn't convert this page.",
  },
} as const;

type PopupViewState = ModeState | { kind: "unsupported" };

const LOADING_ANNOUNCEMENTS: Record<ExtractionMode, string> = {
  article: "Converting the main article content…",
  fullPage: "Converting the entire page…",
};

function noticeAnnouncement(notice: {
  title: string;
  message: string;
}): string {
  return `${notice.title}. ${notice.message}`;
}

function stateAnnouncement(view: PopupViewState, mode: ExtractionMode): string {
  switch (view.kind) {
    case "idle":
    case "loading":
      return LOADING_ANNOUNCEMENTS[mode];
    case "notArticle":
      return noticeAnnouncement(NOTICES.notArticle);
    case "noContent":
      return noticeAnnouncement(NOTICES.noContent);
    case "unsupported":
      return noticeAnnouncement(NOTICES.unsupported);
    default:
      return "";
  }
}

export function App() {
  const { mode, state, unsupported, selectMode } = useMarkdown();
  const [copyAnnouncement, setCopyAnnouncement] = useState("");
  const [focusResultOnReady, setFocusResultOnReady] = useState(true);
  const view: PopupViewState = unsupported ? { kind: "unsupported" } : state;
  const announcement =
    view.kind === "ready" ? copyAnnouncement : stateAnnouncement(view, mode);

  const handleSelectMode = (nextMode: ExtractionMode): void => {
    setFocusResultOnReady(false);
    selectMode(nextMode);
  };

  const handleFallbackSelectFullPage = (): void => {
    // The fallback button unmounts while loading, so focus the resulting output
    // instead of leaving keyboard focus on the document body.
    setFocusResultOnReady(true);
    selectMode("fullPage");
  };

  return (
    <main className="popup">
      <header className="popup-header">
        <h1>Markdown</h1>
        {view.kind !== "unsupported" && (
          <ModeSwitcher mode={mode} onSelect={handleSelectMode} />
        )}
      </header>

      <p
        aria-atomic="true"
        aria-live="polite"
        className="visually-hidden"
        role="status"
      >
        {announcement}
      </p>

      <div className={`popup-content popup-content--${view.kind}`}>
        {(view.kind === "idle" || view.kind === "loading") && (
          <LoadingIndicator />
        )}

        {view.kind === "ready" && (
          <>
            <MarkdownView
              autoFocus={focusResultOnReady}
              markdown={view.markdown}
            />
            <CopyButton
              key={mode}
              markdown={view.markdown}
              onAnnouncement={setCopyAnnouncement}
            />
          </>
        )}

        {view.kind === "notArticle" && (
          <FallbackPrompt
            autoFocus={focusResultOnReady}
            message={NOTICES.notArticle.message}
            onSelectFullPage={handleFallbackSelectFullPage}
            title={NOTICES.notArticle.title}
          />
        )}

        {view.kind === "noContent" && (
          <Notice
            message={NOTICES.noContent.message}
            title={NOTICES.noContent.title}
          />
        )}

        {view.kind === "unsupported" && (
          <Notice
            message={NOTICES.unsupported.message}
            title={NOTICES.unsupported.title}
          />
        )}

        {view.kind === "failed" && (
          <Notice
            role="alert"
            tone="error"
            message={NOTICES.failed.message}
            title={NOTICES.failed.title}
          >
            <p className="notice-details">{view.message}</p>
          </Notice>
        )}
      </div>
    </main>
  );
}
