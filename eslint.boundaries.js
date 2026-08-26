import boundaries from "eslint-plugin-boundaries";

export const boundariesConfig = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: {
    boundaries,
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    "boundaries/elements": [
      { type: "core", pattern: "src/core", partialMatch: false },
      { type: "page", pattern: "src/page", partialMatch: false },
      { type: "browser", pattern: "src/browser", partialMatch: false },
      { type: "popup", pattern: "src/entrypoints/popup", partialMatch: false },
      { type: "entrypoint", pattern: "src/entrypoints", partialMatch: false },
      { type: "test-support", pattern: "src/test", partialMatch: false },
      {
        type: "type-declaration",
        pattern: "src/types",
        partialMatch: false,
      },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "page" } },
            allow: { to: { element: { type: "core" } } },
          },
          {
            from: { element: { type: "browser" } },
            allow: { to: { element: { type: "core" } } },
          },
          {
            from: { element: { type: "popup" } },
            allow: {
              to: { element: { types: { anyOf: ["core", "browser"] } } },
            },
          },
          {
            from: { element: { type: "entrypoint" } },
            allow: { to: { element: { types: { anyOf: ["core", "page"] } } } },
          },
        ],
      },
    ],
    "boundaries/no-ignored-dependencies": "error",
    "boundaries/no-unknown-dependencies": "error",
    "boundaries/no-unknown-files": "error",
  },
};
