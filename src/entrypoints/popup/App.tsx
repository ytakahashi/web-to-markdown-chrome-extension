import { useState } from "react";

import { CopyButton } from "./components/CopyButton";
import { FallbackPrompt } from "./components/FallbackPrompt";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { MarkdownView } from "./components/MarkdownView";
import { Notice } from "./components/Notice";
import { useMarkdown, type MarkdownState } from "./use-markdown";

const NOTICES = {
  notArticle: {
    title: "Article content wasn't found",
    message:
      "This page might not use an article layout. You can convert the entire page instead.",
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

function noticeAnnouncement(notice: {
  title: string;
  message: string;
}): string {
  return `${notice.title}. ${notice.message}`;
}

function stateAnnouncement(state: MarkdownState): string {
  switch (state.kind) {
    case "loading":
      return "Converting current page…";
    case "notArticle":
      return noticeAnnouncement(NOTICES.notArticle);
    case "unsupported":
      return noticeAnnouncement(NOTICES.unsupported);
    default:
      return "";
  }
}

export function App() {
  const { state, convertFullPage } = useMarkdown();
  const [copyAnnouncement, setCopyAnnouncement] = useState("");
  const announcement =
    state.kind === "ready" ? copyAnnouncement : stateAnnouncement(state);

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

      <div className={`popup-content popup-content--${state.kind}`}>
        {state.kind === "loading" && <LoadingIndicator />}

        {state.kind === "ready" && (
          <>
            <MarkdownView markdown={state.markdown} />
            <CopyButton
              markdown={state.markdown}
              onAnnouncement={setCopyAnnouncement}
            />
          </>
        )}

        {state.kind === "notArticle" && (
          <FallbackPrompt
            message={NOTICES.notArticle.message}
            onConvert={convertFullPage}
            title={NOTICES.notArticle.title}
          />
        )}

        {state.kind === "unsupported" && (
          <Notice
            message={NOTICES.unsupported.message}
            title={NOTICES.unsupported.title}
          />
        )}

        {state.kind === "failed" && (
          <Notice
            role="alert"
            tone="error"
            message={NOTICES.failed.message}
            title={NOTICES.failed.title}
          >
            <p className="notice-details">{state.message}</p>
          </Notice>
        )}
      </div>
    </main>
  );
}
