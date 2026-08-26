import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const UNSAFE_URL = /^(?:javascript|vbscript|data):/i;

function isUnsafeUrl(url: string): boolean {
  const separatorIndex = url.indexOf(":");
  if (separatorIndex < 0) {
    return false;
  }

  // Strip C0 controls and spaces so a decoded tab or newline cannot hide an
  // unsafe scheme. Only scan the scheme: a data URI payload can be hundreds of KB.
  let normalizedScheme = "";
  for (let index = 0; index <= separatorIndex; index += 1) {
    if (url.charCodeAt(index) > 0x20) {
      normalizedScheme += url.charAt(index);
    }
  }

  return UNSAFE_URL.test(normalizedScheme);
}

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
