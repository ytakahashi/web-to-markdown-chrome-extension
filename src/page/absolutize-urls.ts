const PRESERVED_URL = /^(?:#|mailto:|tel:)/i;

const URL_ATTRIBUTES = [
  { selector: "a[href]", attribute: "href" },
  { selector: "img[src]", attribute: "src" },
] as const;

export function absolutizeUrls(root: ParentNode, baseUrl: string): void {
  for (const { selector, attribute } of URL_ATTRIBUTES) {
    for (const element of root.querySelectorAll(selector)) {
      const value = element.getAttribute(attribute);
      if (value === null || PRESERVED_URL.test(value)) {
        continue;
      }

      try {
        element.setAttribute(attribute, new URL(value, baseUrl).href);
      } catch {
        // One malformed URL must not prevent the remaining page from being extracted.
        element.removeAttribute(attribute);
      }
    }
  }
}
