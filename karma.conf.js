// Karma configuration

module.exports = function(config) {
    config.set({

        basePath: '',

        // frameworks: ['jasmine'],
        frameworks: ['mocha', 'chai', 'sinon-chai'],

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
            'tests/unit/app.js',
            'public/app/**/*.js',
            'tests/unit/**/*.spec.js'
        ],
        // hostname:'localhost',
        //
        // protocol:'http',

        // list of files to exclude
        exclude: [
            'public/app/app.js'
        ],

        preprocessors: {
        },

        reporters: ['progress', 'junit', 'coverage'],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'public/app/**/*.js': ['coverage']
        },

        coverageReporter: {
            type : 'cobertura',
            // type : 'html',
            dir : './shippable/codecoverage'
        },

        // the default configuration
        junitReporter: {
            outputDir: './shippable/testresults', // results will be saved as $outputDir/$browserName.xml
            outputFile: undefined, // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: '', // suite will become the package name attribute in xml testsuite element
            useBrowserName: true, // add browser name to report and classes names
            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element,
            properties: {} // key value pair of properties to add to the <properties> section of the report
        },

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel:  config.LOG_INFO,

        autoWatch: true,

        browsers: ['PhantomJS'],

        singleRun: true

        // concurrency: Infinity
    })
}
