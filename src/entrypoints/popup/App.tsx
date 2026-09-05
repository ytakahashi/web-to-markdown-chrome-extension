import { useState } from "react";

import type { ExtractionMode } from "../../core/types";
import { CopyButton } from "./components/CopyButton";
import { FallbackPrompt } from "./components/FallbackPrompt";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { MarkdownPreview } from "./components/MarkdownPreview";
import { MarkdownView } from "./components/MarkdownView";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { Notice } from "./components/Notice";
import { ViewSwitcher } from "./components/ViewSwitcher";
import { DEFAULT_RESULT_VIEW, type ResultView } from "./result-views";
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

type PopupState = ModeState | { kind: "unsupported" };

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

function stateAnnouncement(
  popupState: PopupState,
  mode: ExtractionMode,
): string {
  switch (popupState.kind) {
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
  const [resultView, setResultView] = useState<ResultView>(DEFAULT_RESULT_VIEW);
  const popupState: PopupState = unsupported ? { kind: "unsupported" } : state;
  const announcement =
    popupState.kind === "ready"
      ? copyAnnouncement
      : stateAnnouncement(popupState, mode);

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

  const handleSelectResultView = (nextView: ResultView): void => {
    // A newly mounted result must not steal focus from the view switcher.
    setFocusResultOnReady(false);
    setResultView(nextView);
  };

  return (
    <main className="popup">
      <header className="popup-header">
        <h1>Markdown</h1>
        {popupState.kind !== "unsupported" && (
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

      <div className={`popup-content popup-content--${popupState.kind}`}>
        {(popupState.kind === "idle" || popupState.kind === "loading") && (
          <LoadingIndicator />
        )}

        {popupState.kind === "ready" && (
          <>
            {resultView === "markdown" ? (
              <MarkdownView
                autoFocus={focusResultOnReady}
                markdown={popupState.markdown}
              />
            ) : (
              <MarkdownPreview
                autoFocus={focusResultOnReady}
                markdown={popupState.markdown}
              />
            )}
            <div className="result-controls">
              <ViewSwitcher
                view={resultView}
                onSelect={handleSelectResultView}
              />
              <CopyButton
                key={mode}
                markdown={popupState.markdown}
                onAnnouncement={setCopyAnnouncement}
              />
            </div>
          </>
        )}

        {popupState.kind === "notArticle" && (
          <FallbackPrompt
            autoFocus={focusResultOnReady}
            message={NOTICES.notArticle.message}
            onSelectFullPage={handleFallbackSelectFullPage}
            title={NOTICES.notArticle.title}
          />
        )}

        {popupState.kind === "noContent" && (
          <Notice
            message={NOTICES.noContent.message}
            title={NOTICES.noContent.title}
          />
        )}

        {popupState.kind === "unsupported" && (
          <Notice
            message={NOTICES.unsupported.message}
            title={NOTICES.unsupported.title}
          />
        )}

        {popupState.kind === "failed" && (
          <Notice
            role="alert"
            tone="error"
            message={NOTICES.failed.message}
            title={NOTICES.failed.title}
          >
            <p className="notice-details">{popupState.message}</p>
          </Notice>
        )}
      </div>
    </main>
  );
}
