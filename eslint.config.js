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
  boundariesConfig,
  prettier,
);
