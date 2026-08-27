import { useCallback, useEffect, useRef, useState } from "react";

import {
  EXTRACTION_SCRIPTS,
  runExtraction,
  type ExtractionScript,
} from "../../browser/active-tab";
import { UnsupportedPageError } from "../../browser/errors";
import { buildMarkdown } from "../../core/markdown/build-markdown";

export type MarkdownState =
  | { kind: "loading" }
  | { kind: "ready"; markdown: string }
  | { kind: "notArticle" }
  | { kind: "unsupported" }
  | { kind: "failed"; message: string };

export type MarkdownController = {
  state: MarkdownState;
  convertFullPage: () => Promise<void>;
};

function failureMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  return "An unexpected error occurred.";
}

async function extractMarkdown(
  script: ExtractionScript,
): Promise<MarkdownState> {
  try {
    const result = await runExtraction(script);
    if (!result.ok) {
      return { kind: "notArticle" };
    }

    return {
      kind: "ready",
      markdown: buildMarkdown(result.content),
    };
  } catch (cause) {
    if (cause instanceof UnsupportedPageError) {
      return { kind: "unsupported" };
    }

    return { kind: "failed", message: failureMessage(cause) };
  }
}

export function useMarkdown(): MarkdownController {
  const [state, setState] = useState<MarkdownState>({ kind: "loading" });
  const mountedRef = useRef(false);
  const initialRequestRef = useRef<Promise<MarkdownState> | null>(null);
  const initialResultAppliedRef = useRef(false);
  const fallbackPendingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // StrictMode replays effects in development. Sharing the request keeps one
    // popup opening equivalent to one article injection.
    initialRequestRef.current ??= extractMarkdown(EXTRACTION_SCRIPTS.article);
    void initialRequestRef.current.then((nextState) => {
      if (mountedRef.current && !initialResultAppliedRef.current) {
        initialResultAppliedRef.current = true;
        setState(nextState);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const convertFullPage = useCallback(async (): Promise<void> => {
    // setState does not update this render's state snapshot. A second call in
    // the same tick still sees notArticle, so the ref closes that reentry gap.
    if (state.kind !== "notArticle" || fallbackPendingRef.current) {
      return;
    }

    fallbackPendingRef.current = true;
    setState({ kind: "loading" });

    try {
      const nextState = await extractMarkdown(EXTRACTION_SCRIPTS.fullPage);
      if (mountedRef.current) {
        setState(nextState);
      }
    } finally {
      fallbackPendingRef.current = false;
    }
  }, [state.kind]);

  return { state, convertFullPage };
}
