import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

import { isUnsafeUrl } from "./safe-url";

// Non-content elements are removed by sanitizeHtml before conversion. Callers
// handling arbitrary HTML must not use this service without that preprocessing.
export function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });

  service.use(gfm);

  // turndown-plugin-gfm emits `~text~`, while GFM requires `~~text~~`.
  service.addRule("gfmStrikethrough", {
    filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
    replacement: (content) => `~~${content}~~`,
  });

  // Large data images and executable URL schemes must not cross the copy boundary.
  service.addRule("dropUnsafeImages", {
    filter: (node) =>
      node.nodeName === "IMG" && isUnsafeUrl(node.getAttribute("src") ?? ""),
    replacement: () => "",
  });
  service.addRule("dropUnsafeLinks", {
    filter: (node) =>
      node.nodeName === "A" && isUnsafeUrl(node.getAttribute("href") ?? ""),
    replacement: (content) => content,
  });

  return service;
}
