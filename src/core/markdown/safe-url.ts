const UNSAFE_SCHEME = /^(?:javascript|vbscript|data):/i;
const DISPLAYABLE_SCHEME = /^(?:https?|mailto):/i;

/** Schemes that must never reach a link or image in the output. */
export function isUnsafeUrl(url: string): boolean {
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

  return UNSAFE_SCHEME.test(normalizedScheme);
}

/**
 * Links rendered inside the popup open in a browser tab, so only schemes a tab
 * can safely handle may keep their href. Relative and fragment URLs have no
 * base to resolve against here and are not linkable either.
 */
export function isDisplayableUrl(url: string): boolean {
  return !isUnsafeUrl(url) && DISPLAYABLE_SCHEME.test(url.trim());
}
