import { useCallback, useEffect, useRef, useState } from "react";

import { runExtraction } from "../../browser/active-tab";
import { UnsupportedPageError } from "../../browser/errors";
import { buildMarkdown } from "../../core/markdown/build-markdown";
import type { ExtractionMode, ExtractionResult } from "../../core/types";
import { DEFAULT_EXTRACTION_MODE } from "./extraction-modes";

export type ModeState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; markdown: string }
  | { kind: "notArticle" }
  | { kind: "noContent" }
  | { kind: "failed"; message: string };

export type MarkdownController = {
  mode: ExtractionMode;
  state: ModeState;
  unsupported: boolean;
  selectMode: (mode: ExtractionMode) => void;
};

type FailedExtractionReason = Extract<
  ExtractionResult,
  { ok: false }
>["reason"];

function createInitialModeStates(): Record<ExtractionMode, ModeState> {
  const states: Record<ExtractionMode, ModeState> = {
    article: { kind: "idle" },
    fullPage: { kind: "idle" },
  };

  // Only the mode requested automatically starts out running.
  states[DEFAULT_EXTRACTION_MODE] = { kind: "loading" };
  return states;
}

function failureMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  return "An unexpected error occurred.";
}

function failedExtractionState(reason: FailedExtractionReason): ModeState {
  switch (reason) {
    case "not-article":
      return { kind: "notArticle" };
    case "no-content":
      return { kind: "noContent" };
    default: {
      const exhaustiveReason: never = reason;
      throw new Error(
        `Unhandled extraction failure reason: ${String(exhaustiveReason)}`,
      );
    }
  }
}

async function extractMarkdown(mode: ExtractionMode): Promise<ModeState> {
  const result = await runExtraction(mode);
  if (!result.ok) {
    return failedExtractionState(result.reason);
  }

  return {
    kind: "ready",
    markdown: buildMarkdown(result.content),
  };
}

export function useMarkdown(): MarkdownController {
  const [mode, setMode] = useState<ExtractionMode>(DEFAULT_EXTRACTION_MODE);
  const [states, setStates] = useState(createInitialModeStates);
  const [unsupported, setUnsupported] = useState(false);
  const mountedRef = useRef(false);
  const selectedModeRef = useRef<ExtractionMode>(DEFAULT_EXTRACTION_MODE);
  const unsupportedRef = useRef(false);
  const requestsRef = useRef(new Map<ExtractionMode, Promise<ModeState>>());
  const appliedResultsRef = useRef(new Set<ExtractionMode>());

  const requestMode = useCallback(
    (requestedMode: ExtractionMode): Promise<ModeState> => {
      const existingRequest = requestsRef.current.get(requestedMode);
      if (existingRequest) {
        return existingRequest;
      }

      setStates((currentStates) => {
        if (currentStates[requestedMode].kind !== "idle") {
          return currentStates;
        }

        return {
          ...currentStates,
          [requestedMode]: { kind: "loading" },
        };
      });

      // Settled promises remain cached for the popup lifetime so each mode is
      // injected at most once, not merely once at a time.
      const request = extractMarkdown(requestedMode);
      requestsRef.current.set(requestedMode, request);
      return request;
    },
    [],
  );

  const observeRequest = useCallback(
    (requestedMode: ExtractionMode, request: Promise<ModeState>): void => {
      void request.then(
        (nextState) => {
          if (
            !mountedRef.current ||
            appliedResultsRef.current.has(requestedMode)
          ) {
            return;
          }

          appliedResultsRef.current.add(requestedMode);
          setStates((currentStates) => ({
            ...currentStates,
            [requestedMode]: nextState,
          }));
        },
        (cause: unknown) => {
          if (
            !mountedRef.current ||
            appliedResultsRef.current.has(requestedMode)
          ) {
            return;
          }

          appliedResultsRef.current.add(requestedMode);
          if (cause instanceof UnsupportedPageError) {
            unsupportedRef.current = true;
            setUnsupported(true);
            return;
          }

          setStates((currentStates) => ({
            ...currentStates,
            [requestedMode]: {
              kind: "failed",
              message: failureMessage(cause),
            },
          }));
        },
      );
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;

    // StrictMode replays effects. Re-observing the cached request preserves its
    // result if it settled during the simulated unmount without reinjecting.
    observeRequest(
      DEFAULT_EXTRACTION_MODE,
      requestMode(DEFAULT_EXTRACTION_MODE),
    );

    return () => {
      mountedRef.current = false;
    };
  }, [observeRequest, requestMode]);

  const selectMode = useCallback(
    (nextMode: ExtractionMode): void => {
      if (unsupportedRef.current || selectedModeRef.current === nextMode) {
        return;
      }

      selectedModeRef.current = nextMode;
      setMode(nextMode);
      observeRequest(nextMode, requestMode(nextMode));
    },
    [observeRequest, requestMode],
  );

  return {
    mode,
    state: states[mode],
    unsupported,
    selectMode,
  };
}
