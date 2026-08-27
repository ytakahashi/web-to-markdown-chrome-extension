const RESTRICTED_SCHEMES = new Set([
  "about:",
  "chrome:",
  "chrome-extension:",
  "devtools:",
  "edge:",
  "file:",
  "view-source:",
]);

const ACCESS_DENIED_MESSAGE = /cannot access|missing host permission/i;

const EXPLICIT_RESTRICTED_TARGET_MESSAGE =
  /cannot access a (?:chrome|edge):\/\/|cannot access contents of (?:the )?url ["']?(?:chrome|chrome-extension|edge):\/\/|extensions gallery cannot be scripted/i;

function causeMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return typeof cause === "string" ? cause : "";
}

function hasRestrictedUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const isWebStore =
      parsed.hostname === "chromewebstore.google.com" ||
      (parsed.hostname === "chrome.google.com" &&
        parsed.pathname.startsWith("/webstore"));
    return (
      RESTRICTED_SCHEMES.has(parsed.protocol) ||
      isWebStore ||
      parsed.pathname.toLowerCase().endsWith(".pdf")
    );
  } catch {
    return false;
  }
}

export function isUnsupportedTarget(
  url: string | undefined,
  cause: unknown,
): boolean {
  const message = causeMessage(cause);

  if (EXPLICIT_RESTRICTED_TARGET_MESSAGE.test(message)) {
    return true;
  }

  return hasRestrictedUrl(url) && ACCESS_DENIED_MESSAGE.test(message);
}
