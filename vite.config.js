import { defineConfig } from 'vite';

const license = '/** @license Copyright (c) 2026 Goffert van Gool, SPDX-License-Identifier: MIT */';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lite-html.js',
      formats: ['es'],
      fileName: () => 'lite-html.min.js',
    },
    rolldownOptions: {
      output: { minify: true, postBanner: license },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
});
