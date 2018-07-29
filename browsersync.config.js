module.exports = {
  port: 5000,
  notify: false,
  open: false,
  ui: false,
  online: false,
  logPrefix: 'APP',
  snippetOptions: {
    rule: {
      match: '<span id="browser-sync-binding"></span>',
      fn: function(snippet) {
        return snippet;
      }
    }
  },
  server: {
    baseDir: ['.', 'demo']
  },
  files: ['*.js', 'src/**/*.js', 'test/**/*.js', 'index.html']
};
