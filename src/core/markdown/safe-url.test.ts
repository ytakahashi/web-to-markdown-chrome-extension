import { describe, expect, it } from "vitest";

import { isDisplayableUrl, isUnsafeUrl } from "./safe-url";

describe("isUnsafeUrl", () => {
  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,unsafe",
  ])("identifies an unsafe scheme: %s", (url) => {
    expect(isUnsafeUrl(url)).toBe(true);
  });

  it.each([
    "java\u0000script:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java script:alert(1)",
  ])("identifies an unsafe scheme hidden with controls or spaces", (url) => {
    expect(isUnsafeUrl(url)).toBe(true);
  });

  it.each([
    "https://example.com",
    "mailto:user@example.com",
    "/relative/path",
    "#section",
    "?q=a:b",
  ])("does not identify a safe or schemeless URL as unsafe: %s", (url) => {
    expect(isUnsafeUrl(url)).toBe(false);
  });
});

describe("isDisplayableUrl", () => {
  it.each([
    "http://example.com",
    "https://example.com",
    "HTTPS://example.com",
    "mailto:user@example.com",
    "  https://example.com/path  ",
  ])("allows a URL with a displayable scheme: %s", (url) => {
    expect(isDisplayableUrl(url)).toBe(true);
  });

  it.each([
    "",
    "/relative/path",
    "#section",
    "?q=a:b",
    "tel:+123456789",
    "file:///tmp/example.txt",
    "custom:destination",
    "javascript:alert(1)",
    "java\tscript:alert(1)",
  ])("rejects a URL without a displayable scheme: %s", (url) => {
    expect(isDisplayableUrl(url)).toBe(false);
  });
});
