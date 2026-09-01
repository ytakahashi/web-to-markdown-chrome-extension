import { useState } from "react";

import { CopyButton } from "./components/CopyButton";
import { FallbackPrompt } from "./components/FallbackPrompt";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { MarkdownView } from "./components/MarkdownView";
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

function noticeAnnouncement(notice: {
  title: string;
  message: string;
}): string {
  return `${notice.title}. ${notice.message}`;
}

function stateAnnouncement(view: PopupViewState): string {
  switch (view.kind) {
    case "idle":
    case "loading":
      return "Converting current page…";
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
  const { state, unsupported, selectMode } = useMarkdown();
  const [copyAnnouncement, setCopyAnnouncement] = useState("");
  const view: PopupViewState = unsupported ? { kind: "unsupported" } : state;
  const announcement =
    view.kind === "ready" ? copyAnnouncement : stateAnnouncement(view);

  return (
    <main className="popup">
      <header className="popup-header">
        <h1>Markdown</h1>
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
            <MarkdownView markdown={view.markdown} />
            <CopyButton
              markdown={view.markdown}
              onAnnouncement={setCopyAnnouncement}
            />
          </>
        )}

        {view.kind === "notArticle" && (
          <FallbackPrompt
            message={NOTICES.notArticle.message}
            onSelectFullPage={() => selectMode("fullPage")}
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
