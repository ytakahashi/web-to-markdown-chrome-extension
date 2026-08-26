const NON_CONTENT_SELECTOR = "script, style, noscript, template";

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove whole subtrees before Turndown walks them. Template content is a
  // detached document fragment and cannot safely be removed during that walk.
  for (const element of doc.querySelectorAll(NON_CONTENT_SELECTOR)) {
    element.remove();
  }

  return doc.body.innerHTML;
}
