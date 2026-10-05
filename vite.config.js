import { defineConfig } from 'vite';

const license = '/** @license MIT License, Copyright (c) 2026 Goffert van Gool */';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lite-html.js',
      formats: ['es'],
    },
    sourcemap: true,
    minify: false,
    rolldownOptions: {
      output: [
        { entryFileNames: 'lite-html.js' },
        { entryFileNames: 'lite-html.min.js', minify: true, comments: false, postBanner: license },
      ],
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
});
