import type { ExtractedContent } from "../types";
import { htmlToMarkdown } from "./html-to-markdown";

export function buildMarkdown(content: ExtractedContent): string {
  const body = htmlToMarkdown(content.html);
  const title = content.title.replace(/\s+/g, " ").trim();

  return title ? `# ${title}\n\n${body}\n` : `${body}\n`;
}
