module.exports = function(grunt) {
    var minify = [
        "public/vendor/jquery/dist/jquery.js",
        "public/vendor/angular/angular.js",
        "public/vendor/tether/dist/js/tether.js",
        "public/vendor/toastr/toastr.js",
        "public/vendor/bootstrap/dist/js/bootstrap.js",
        "public/vendor/angular-resource/angular-resource.js",
        "public/vendor/angular-route/angular-route.js",
        "public/vendor/angular-filter/dist/angular-filter.js",
        "public/vendor/ngDialog/js/ngDialog.min.js",
        "public/vendor/iso-3166-country-codes-angular/src/iso-3166-country-codes-angular.js",
        "public/vendor/angular-leaflet-directive/dist/angular-leaflet-directive.js",
        "public/vendor/underscore/underscore.js",
        "public/vendor/angular-underscore/angular-underscore.js",
        "public/vendor/restangular/dist/restangular.js",
        "public/vendor/ng-csv/build/ng-csv.js",
        "public/vendor/angular-sanitize/angular-sanitize.js",
        "public/vendor/spin.js/spin.js",
        "public/vendor/angular-spinner/angular-spinner.js",
        "public/vendor/d3/d3.js",
        "public/vendor/topojson/topojson.js",
        "public/vendor/nvd3/build/nv.d3.js",
        "public/vendor/angular-nvd3/dist/angular-nvd3.js",
        "public/vendor/bootstrap-select/dist/js/bootstrap-select.js",
        "public/vendor/angular-google-analytics/dist/angular-google-analytics.js",
        "public/vendor/leaflet/dist/leaflet.js",
        "public/vendor/esri-leaflet/dist/esri-leaflet.js",
        "public/plugin/bootstrap-typeahead.js",
        "public/vendor/angular-tablesort/js/angular-tablesort.js",
        "public/vendor/plotlyjs/plotly.js",
        "public/vendor/angular-plotly/src/angular-plotly.js",
        "public/plugin/header.js",
        "public/plugin/leaflet.fullscreen.min.js",
        "public/plugin/ng-infinite-scroll.js"
    ]

var style = [
    "public/css/site.css",
    "public/css/font-awesome.css",
    "public/css/glyphicon.css",
    "public/vendor/toastr/toastr.css",
    "public/vendor/ngDialog/css/ngDialog.min.css",
    "public/vendor/bootstrap/dist/css/bootstrap.min.css",
    "public/vendor/tether/dist/css/tether.css",
    "public/vendor/angular-tablesort/tablesort.css",
    "public/vendor/leaflet/dist/leaflet.css",
    "public/vendor/nvd3/build/nv.d3.min.css",
    "public/vendor/textAngular/dist/textAngular.css",
    "public/vendor/bootstrap-select/dist/css/bootstrap-select.css"]
var port = 3032;
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jade: {
            compile: {
                options: {
                    client: false
                },
                files: [
                    {
                        cwd: "public/app",
                        src: "**/*.jade",
                        dest: "public/app",
                        expand: true,
                        ext: ".html"
                    },
                    {
                        cwd: "server",
                        src: "**/*.jade",
                        dest: "server",
                        expand: true,
                        ext: ".html"
                    }
                ]
            }
        },

        jshint: {
            all: {
                options: {
                    jshintrc: true,
                    reporter: require('jshint-stylish'),
                    globals: {
                        jQuery: true
                    }
                },
                src: [
                    'Gruntfile.js',
                    'karma.conf.js',
                    'newrelic.js',
                    'server.js',
                    'public/app/**/*.js',
                    'server/**/*.js',
                    'tests/**/*.js'
                ]
            }
        },
        stylus: {
            compile: {
                options: {
                    compress: false
                },
                files: {
                    'public/css/site.css': 'public/css/site.styl'
                }
            }
        },
        ngmin: {
            controllers: {
                src: ["public/app/app.js","public/app/**/*.js","public/app/**/**/*.js","public/app/**/**/**/*.js","public/app/**/*.js"],
                dest: 'public/js/controllers.js'
            }
        },
        watch: {
            jade: {
                files: ['public/app/**/*.jade'],
                tasks: ['jade'],
                options: {
                    spawn: false
                }
            },
            stylus: {
                files: ['public/css/*.styl','public/css/**/*.styl'],
                tasks: ['stylus:compile'],
                options: {livereload: {
                    host: 'localhost',
                    port: port
                }}
            },
            ngmin: {
                files: ["public/app/app.js","public/app/**/*.js","public/app/**/**/*.js","public/app/**/**/**/*.js","public/app/**/*.js"],
                tasks: ['ngmin','uglify:controller'],
                options: {
                    livereload: {
                        host: 'localhost',
                        port: port
                     }
                }
            },
            cssmin: {
                files: [style],
                tasks: ['concat:style','cssmin'],
                options: {
                    livereload: {
                        host: 'localhost',
                        port: port
                    }
                }
            }
        },
        concat: {
            generated: {
                files: [
                    {
                        dest: 'public/js/app.js',
                        src: [minify]
                    }
                ]
            },
            style: {
                options: { sourceMap: true,
                    outputStyle: 'compressed'
                },
                files:[{
                    dest: 'public/css/style.css',
                    src: [style]
                }]
            }
        },
        uglify: {
            generated: {

                options: {
                    mangle: true,
                    compress: true
                },
                files: [
                    {
                        dest: 'public/js/app.min.js',
                        src: ['public/js/app.js']
                    }
                ]
            },
            controller: {
                files: [
                    {
                        dest: 'public/js/controllers.min.js',
                        src: ['public/js/controllers.js']
                    }
                ]
            },
        },
        cssmin: {
            generated: {
                src: 'public/css/style.css',
                dest: 'public/css/style.min.css'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-es6-transpiler');
    grunt.loadNpmTasks('grunt-css');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.registerTask('default', [
        'ngmin',
        'uglify:controller',
        'concat',
        'cssmin:generated',
        'uglify:generated'
    ]);

};