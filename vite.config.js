import { defineConfig } from 'vite';

const license = '/** @license MIT License, Copyright (c) 2026 Goffert van Gool */';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lite-html.js',
      formats: ['es'],
      fileName: () => 'lite-html.min.js',
    },
    rolldownOptions: {
      output: { minify: true, comments: false, postBanner: license },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
});
