import { Readability } from "@mozilla/readability";

import type { ExtractionResult } from "../core/types";

export function extractArticle(doc: Document): ExtractionResult {
  // Readability mutates its input, so passing the live document would rewrite the user's page.
  const clone = doc.cloneNode(true) as Document;

  // Only a successful parse without content is not-article. Parsing failures
  // must propagate because bugs must not look like pages the fallback can rescue.
  const article = new Readability(clone).parse();

  if (!article?.content) {
    return { ok: false, reason: "not-article" };
  }

  return {
    ok: true,
    content: {
      title: article.title || doc.title,
      html: article.content,
    },
  };
}
