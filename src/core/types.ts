export type ExtractedContent = {
  /** Readability's article title, or document.title on the full-page path. */
  title: string;
  /** Main content HTML. URLs are already absolute. */
  html: string;
};

export type ExtractionResult =
  | { ok: true; content: ExtractedContent }
  | { ok: false; reason: "not-article" };
