import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import { boundariesConfig } from "./eslint.boundaries.js";

export default tseslint.config(
  {
    ignores: [".output/**", ".wxt/**", "coverage/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        browser: "readonly",
        chrome: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["src/core/**/*.ts", "src/page/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "chrome", message: "Chrome API belongs in src/browser." },
        { name: "browser", message: "Chrome API belongs in src/browser." },
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    ...reactHooks.configs.flat["recommended-latest"],
  },
  {
    files: ["src/entrypoints/popup/**/*.{ts,tsx}"],
    rules: {
      // The popup runs with extension privileges. Rendering page-derived text as
      // HTML would turn a page-side XSS into extension-level code execution.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "rehype-raw",
              message: "Raw HTML must stay unparsed in the preview.",
            },
          ],
          patterns: [
            {
              group: ["rehype-raw/*"],
              message: "Raw HTML must stay unparsed in the preview.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Render Markdown as React elements; never as HTML.",
        },
      ],
    },
  },
  boundariesConfig,
  prettier,
);
