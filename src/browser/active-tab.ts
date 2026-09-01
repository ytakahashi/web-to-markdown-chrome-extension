import type { ExtractionMode, ExtractionResult } from "../core/types";
import { validateExtractionResult } from "../core/validate-extraction-result";
import { ExtractionExecutionError, UnsupportedPageError } from "./errors";
import { isUnsupportedTarget } from "./unsupported-target";

// Literal paths satisfy WXT's generated ScriptPublicPath type, while satisfies
// keeps the mode-to-script mapping exhaustive without widening those literals.
const EXTRACTION_SCRIPTS = {
  article: "/extract-article.js",
  fullPage: "/extract-full-page.js",
} as const satisfies Record<ExtractionMode, string>;

export async function runExtraction(
  mode: ExtractionMode,
): Promise<ExtractionResult> {
  let tabs;
  try {
    tabs = await browser.tabs.query({ active: true, currentWindow: true });
  } catch (cause) {
    throw new ExtractionExecutionError("Failed to query the active tab.", {
      cause,
    });
  }

  const tab = tabs[0];
  if (tab?.id === undefined) {
    throw new UnsupportedPageError("No active tab is available.");
  }

  let injected;
  try {
    injected = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: [EXTRACTION_SCRIPTS[mode]],
    });
  } catch (cause) {
    if (isUnsupportedTarget(tab.url, cause)) {
      throw new UnsupportedPageError("Cannot run on this page.", { cause });
    }

    throw new ExtractionExecutionError("Extraction script failed.", {
      cause,
    });
  }

  // Validation stays outside the injection catch so bundle mismatches are not
  // presented as pages on which injection is unsupported.
  return validateExtractionResult(injected[0]?.result);
}
