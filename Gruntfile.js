/*global module:false*/
module.exports = function(grunt) {
    'use strict';
    grunt.initConfig({
        jsbeautifier: {
            files: ['<%= jshint.files %>', 'src/css/**/*.css', 'src/**/*.html', '!src/lib/**/*'],
            options: {
                'js': {
                    preserveNewlines: true,
                    maxPreserveNewlines: 2
                }
            }
        },
        connect: {
            jasmine: {
                options: {
                    port: 8890
                }
            }
        },
        open: {
            jasmine: {
                url: '<%= jasmine.all.options.host %>_SpecRunner.html'
            }
        },
        jasmine: {
            all: {
                options: {
                    specs: ['jasmine/specs/**/*spec.js'],
                    host: 'http://127.0.0.1:<%= connect.jasmine.options.port %>/',
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        requireConfigFile: 'src/require-config.js',
                        requireConfig: {
                            baseUrl: 'src',
                            paths: {
                                'jasmine-fixtures': '../jasmine/lib/jasmine-fixtures/jasmine-fixture',
                                'jasmine-jquery': '../jasmine/lib/jasmine-jquery/jasmine-jquery',
                                'jquery-fixture': '../jasmine/lib/jquery-fixture/jquerymx-3.2.custom',
                                'jasmine-helper': '../jasmine/lib/jasmine-helper',
                                'google-api-client': 'lib/gsloader/google-api-client',
                                'chrome': '../jasmine/lib/chrome'
                            },
                            shim: {
                                'jasmine-fixtures': {
                                    deps: ['jquery']
                                },
                                'jasmine-jquery': {
                                    deps: ['jquery']
                                },
                                'jquery-fixture': {
                                    deps: ['jquery']
                                }
                            },
                            deps: ['logger', 'jquery', 'jasmine-fixtures', 'jasmine-jquery', 'jquery-fixture'],
                            callback: function(Logger) {
                                Logger.setLevel(Logger.OFF);
                            }
                        }
                    }
                }
            }
        },
        jshint: {
            files: ['package.json', 'bower.json', 'Gruntfile.js', 'src/**/*.js',
                'src/**/*.json', '!src/lib/**/*', 'jasmine/lib/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        shell: {
            npm: {
                command: 'npm install',
                options: {
                    failOnError: true,
                    stdout: true,
                    stderr: true
                }
            }
        },
        bower: {
            install: {
                options: {
                    targetDir: 'src/lib',
                    layout: 'byComponent',
                    verbose: true,
                    cleanTargetDir: true,
                    cleanBowerDir: false
                }
            }
        }
    });

    /* These plugins provide necessary tasks. */
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-bower-task');

    /* Register tasks. */
    grunt.registerTask('default', ['shell:npm', 'bower:install', 'jsbeautifier', 'jshint' /*, 'connect', 'jasmine'*/ ]);
    grunt.registerTask('test', ['bower:install', 'jshint', 'connect', 'jasmine']);
    grunt.registerTask('jasmine-server', ['jasmine:all:build', 'open:jasmine', 'connect::keepalive']);
};
