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

const htmlLite = ({ dest, format, uglified = false, transpiled = false }) => {
  return {
    input: 'src/lite-html.js',
    output: { banner: license, file: dest, name: 'lite-html', format, sourcemap: true },
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
      // Remove @license comments
      !uglified &&
        cleanup({
          maxEmptyLines: 1,
          comments: [/^[\*\s]*[^@\*\s]/]
        }),
      uglified &&
        terser({
          warnings: true,
          mangle: {
            module: true
          },
          output: { preamble: license }
        }),
      filesize()
    ].filter(Boolean)
  };
};

const index = file => {
  return {
    input: `${file}.js`,
    output: { banner: license, file: `${file}.es5.js`, format: 'iife', name: file.split('/').slice(-1)[0] },
    plugins: [
      commonjs({
        include: 'node_modules/**'
      }),
      babel({
        presets: [['env', { modules: false }]],
        plugins: ['external-helpers']
      }),
      // Remove @license comments
      cleanup({
        maxEmptyLines: 1,
        comments: [/^[\*\s]*[^@\*\s]/]
      })
    ]
  };
};

const config = [
  htmlLite({ dest: 'lite-html.es5.js', format: 'umd', transpiled: true }),
  htmlLite({ dest: 'lite-html.js', format: 'es' }),
  htmlLite({ dest: 'lite-html.min.js', format: 'es', uglified: true }),
  index('test/index'),
  index('demo/index')
];

export default config;
