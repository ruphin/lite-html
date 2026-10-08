import { defineConfig } from "vitest/config";

const license =
  "/** @license Copyright (c) 2026 Goffert van Gool, SPDX-License-Identifier: MIT */";

export default defineConfig({
  build: {
    lib: {
      entry: "src/lite-html.ts",
    },
    rolldownOptions: {
      output: [
        {
          format: "es",
          entryFileNames: "lite-html.js",
          minify: false,
          postBanner: license,
        },
        {
          format: "es",
          entryFileNames: "lite-html.min.js",
          minify: true,
          postBanner: license,
        },
      ],
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
