import filesize from 'rollup-plugin-filesize';
import cleanup from 'rollup-plugin-cleanup';
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

const license = `/**
 * @license
 * MIT License
 *
 * Copyright (c) 2018 Goffert van Gool
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
`;

function htmlLite({ dest, format, uglified = false, transpiled = false }) {
  return {
    input: 'src/html-lite.js',
    output: { banner: license, file: dest, name: 'html-lite', format, sourcemap: true },
    plugins: [
      transpiled &&
        commonjs({
          include: 'node_modules/**'
        }),
      transpiled &&
        babel({
          presets: [['env', { modules: false }]],
          plugins: ['external-helpers']
        }),
      !uglified &&
        cleanup({
          maxEmptyLines: 1,
          // This removes redundant @license comments
          comments: [/^[\*\s]*[^@\*\s]/]
        }),
      uglified && terser({ warnings: true, output: { preamble: license } }),
      filesize()
    ].filter(Boolean)
  };
}

function test(file) {
  return {
    input: `test/${file}.js`,
    output: { banner: license, file: `test/${file}.es5.js`, format: 'iife', name: 'test' },
    plugins: [
      commonjs({
        include: 'node_modules/**'
      }),
      babel({
        presets: [['env', { modules: false }]],
        plugins: ['external-helpers']
      })
    ]
  };
}

const demo = {
  input: `demo/index.js`,
  output: { banner: license, file: `demo/index.es5.js`, format: 'iife', name: 'demo' },
  plugins: [
    commonjs({
      include: 'node_modules/**'
    }),
    cleanup({
      maxEmptyLines: 1,
      // This removes redundant @license comments
      comments: [/^[\*\s]*[^@\*\s]/]
    }),
    babel({
      presets: [['env', { modules: false }]],
      plugins: ['external-helpers']
    })
  ]
};

const config = [
  htmlLite({ dest: 'html-lite.es5.js', format: 'umd', transpiled: true }),
  htmlLite({ dest: 'html-lite.js', format: 'es' }),
  test('lib/marker'),
  test('lib/node-walker'),
  test('lib/template-parser'),
  demo
];

export default config;
