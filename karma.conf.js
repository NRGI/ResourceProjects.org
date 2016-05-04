// Karma configuration

module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    plugins: [
      'jasmine',
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-coverage',
      'karma-phantomjs-launcher',
      'karma-jade-preprocessor'
    ],

    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/jade/jade.js',
      'node_modules/underscore/underscore.js',
      'public/vendor/jquery/dist/jquery.js',
      'public/vendor/angular-google-analytics/dist/angular-google-analytics.js',
      'public/vendor/angular-filter/dist/angular-filter.js',
      'public/vendor/iso-3166-country-codes-angular/dist/iso-3166-country-codes-angular.min.js',
      'public/vendor/angular-leaflet-directive/dist/angular-leaflet-directive.js',
      'public/vendor/leaflet/dist/leaflet.js',
      'public/vendor/ng-csv/build/ng-csv.js',
      'public/vendor/angular-tablesort/js/angular-tablesort.js',
      'public/vendor/angular-sanitize/angular-sanitize.js',
      'public/vendor/angular-route/angular-route.js',
      'public/vendor/angular-spinner/angular-spinner.js',
      'public/vendor/angular-resource/angular-resource.js',
      'public/vendor/ngDialog/js/ngDialog.js',
      'public/vendor/toastr/toastr.js',
      'public/app/*.js',
      'public/app/account/*.js',
      'public/app/common/*.js',
      'public/app/commodities/*.js',
      'public/app/companies/*.js',
      'public/app/concessions/*.js',
      'public/app/contracts/*.js',
      'public/app/countries/*.js',
      'public/app/groups/*.js',
      'public/app/main/*.js',
      'public/app/projects/*.js',
      'public/app/services/*.js',
      'public/app/directives/*.js',
      'public/app/sites/*.js',
      'public/app/sources/*.js',
      'public/app/services/**/*.js',
      'public/app/directives/**/*.js',
      'public/app/admin/**/*.js',
      //'test/test-app.js',
      'test/unit/**/*.js'
    ],
    hostname:'localhost',

    protocol:'http',

    exclude: [
    ],

    preprocessors: {
    },

    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    port: 3000,

    colors: true,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel:  config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome'],

    singleRun: false,

    concurrency: Infinity
  })
}
