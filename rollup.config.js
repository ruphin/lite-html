import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import * as path from 'path';


function getConfig({ dest, format, uglified = true, transpiled = false}) {
  const conf = {
    input: 'src/html-lite.js',
    output: { file: dest, format, sourcemap: true },
    external: bundled ? [] : [path.resolve('./lit-html/lib/lit-extended.js'), path.resolve('./lit-html/lib/shady-render.js')],
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

const config = [
  getConfig({ dest: 'html-lite.es5.js', format: 'iife', transpiled: true }),
  getConfig({ dest: 'html-lite.js', format: 'es' })
];

export default config;
