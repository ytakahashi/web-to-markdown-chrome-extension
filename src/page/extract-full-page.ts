import type { ExtractionResult } from "../core/types";
import { absolutizeUrls } from "./absolutize-urls";

/**
 * Elements removed before crossing the tab boundary because they never carry
 * readable text. Structural elements remain because this path preserves the full page.
 */
const NON_TEXT_ELEMENT_SELECTOR =
  "script, style, noscript, template, svg, canvas, link, meta";

export function extractFullPage(doc: Document): ExtractionResult {
  // not-article means extraction ran but there is no body to extract. Other DOM
  // and URL failures must propagate instead of looking recoverable to the user.
  if (!doc.body) {
    return { ok: false, reason: "not-article" };
  }

  const body = doc.body.cloneNode(true) as HTMLElement;
  for (const element of body.querySelectorAll(NON_TEXT_ELEMENT_SELECTOR)) {
    element.remove();
  }

  // Readability absolutizes URLs on the article path. This path has no
  // Readability, so it must do the same or every link breaks on paste.
  absolutizeUrls(body, doc.baseURI);

  return {
    ok: true,
    content: { title: doc.title, html: body.innerHTML },
  };
}
