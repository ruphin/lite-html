import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import * as path from 'path';

function getConfig({ dest, format, uglified = false, transpiled = false }) {
  const conf = {
    input: 'src/html-lite.js',
    output: { file: dest, name: 'html-lite', format, sourcemap: true },
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
      uglified &&
        uglify({
          warnings: true,
          toplevel: uglified,
          sourceMap: uglified,
          compress: uglified && { passes: 2 },
          mangle: uglified,
          output: { beautify: !uglified }
        }),
      filesize()
    ].filter(Boolean)
  };

  return conf;
}

const config = [getConfig({ dest: 'html-lite.es5.js', format: 'umd', transpiled: true }), getConfig({ dest: 'html-lite.js', format: 'es' })];

export default config;
