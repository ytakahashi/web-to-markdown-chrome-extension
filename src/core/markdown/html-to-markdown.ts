import { sanitizeHtml } from "./sanitize-html";
import { createTurndownService } from "./turndown-service";

export function htmlToMarkdown(html: string): string {
  return createTurndownService().turndown(sanitizeHtml(html));
}
