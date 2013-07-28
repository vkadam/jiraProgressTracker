/*global module:false*/
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: "/* <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>* Copyright (c) <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
        },
        clean: ["src/dist/"],
        uglify: {
            options: {
                banner: "<%= meta.banner %>"
            },
            dist: {
                files: {
                    "src/dist/jira-tracker-templates.min.js": ["src/dist/jira-tracker-templates.js"]
                }
            }
        },
        jsbeautifier: {
            files: "<%= jshint.files %>",
            options: {
                "preserve_newlines": true,
                "max_preserve_newlines": 2,
                "keep_array_indentation": true
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
                url: "<%= jasmine.all.options.host %>_SpecRunner.html"
            }
        },
        jasmine: {
            all: {
                options: {
                    specs: ["jasmine/specs/**/*spec.js"],
                    host: "http://127.0.0.1:<%= connect.jasmine.options.port %>/",
                    template: require("grunt-template-jasmine-requirejs"),
                    templateOptions: {
                        requireConfigFile: "src/require-config.js",
                        requireConfig: {
                            baseUrl: "src",
                            paths: {
                                "jasmine-fixtures": "../jasmine/lib/jasmine-fixtures/jasmine-fixture",
                                "jasmine-jquery": "../jasmine/lib/jasmine-jquery/jasmine-jquery",
                                "jquery-fixture": "../jasmine/lib/jquery-fixture/jquerymx-3.2.custom",
                                "jasmine-helper": "../jasmine/lib/jasmine-helper",
                                "google-api-client": "lib/gsloader/jasmine/lib/google-api-client",
                                "chrome": "../jasmine/lib/chrome"
                            },
                            shim: {
                                "jasmine-fixtures": {
                                    deps: ["jquery"]
                                },
                                "jasmine-jquery": {
                                    deps: ["jquery"]
                                },
                                "jquery-fixture": {
                                    deps: ["jquery"]
                                }
                            },
                            deps: ["js-logger", "jquery", "jasmine-fixtures", "jasmine-jquery", "jquery-fixture"],
                            callback: function(Logger) {
                                Logger.setLevel(Logger.OFF);
                            }
                        }
                    }
                }
            }
        },
        watch: {
            options: {
                files: ["src/views/**/*.hbs"],
                tasks: ["dist"],
                interrupt: true,
                debounceDelay: 5,
                interval: 5
            }
        },
        jshint: {
            files: ["package.json", "Gruntfile.js", "src/*.js", "src/js/**/*.js", "jasmine/specs/**/*spec.js", "jasmine/lib/*.js"],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                unused: true,
                debug: true,
                camelcase: true,
                globals: {
                    requirejs: false,
                    require: false,
                    define: false,
                    jasmine: false,
                    describe: false,
                    xdescribe: false,
                    it: false,
                    xit: false,
                    spyOn: false,
                    expect: false,
                    waitsFor: false,
                    runs: false,
                    beforeEach: false,
                    afterEach: false,
                    spyOnEvent: false,
                    affix: false
                }
            }
        },
        handlebars: {
            compile: {
                options: {
                    namespace: "JiraTrackerTemplates",
                    amd: true
                },
                files: {
                    "src/dist/jira-tracker-templates.js": ["src/views/*.hbs"]
                }
            }
        }
    });

    /* These plugins provide necessary tasks. */
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks('grunt-contrib-handlebars');

    /* Register tasks. */
    grunt.registerTask("dist", ["handlebars", "uglify"]);
    grunt.registerTask("default", ["jsbeautifier", "jshint", "dist", "connect", "jasmine"]);
    grunt.registerTask("test", ["dist", "connect", "jasmine"]);
    grunt.registerTask("jasmine-server", ["dist", "jasmine:all:build", "open:jasmine", "connect::keepalive"]);

};
