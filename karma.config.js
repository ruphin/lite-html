module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: ['test/**/*.es5.js'],
    reporters: ['progress'],
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['DockerChromeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    customLaunchers: {
      DockerChromeHeadless: {
        base: 'ChromeHeadless',
        flags: ['--disable-gpu', '--no-sandbox']
      }
    }
  });
};
