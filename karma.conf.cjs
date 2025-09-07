// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  const isCI = process.env.CI === 'true';
  const projectName = process.env.npm_package_name || 'evoku';

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution order
        // random: false
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, `./coverage/${projectName}`),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['FirefoxHeadless'],
    // Timeout settings for better CI reliability
    browserNoActivityTimeout: isCI ? 60000 : 30000, // 60s in CI, 30s locally
    captureTimeout: isCI ? 60000 : 30000,
    // Firefox-specific settings
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['--headless', '--disable-gpu']
      }
    },
    restartOnFileChange: !isCI // Disable in CI to prevent hanging
  });
};
