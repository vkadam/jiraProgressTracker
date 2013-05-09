/*global module:false*/
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: "/* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
        },
        clean: ["src/dist/"],
        concat: {
            options: {
                separator: ";\n/**********************************/\n",
                banner: "<%= meta.banner %>"
            },
            dist: {
                src: ["src/js/base64.js", "src/js/jiraTracker.js"],
                dest: "src/dist/<%= pkg.name %>.js"
            }
        },
        uglify: {
            options: {
                banner: "<%= meta.banner %>"
            },
            dist: {
                files: {
                    "src/dist/<%= pkg.name %>.min.js": ["<%= concat.dist.dest %>"],
                    "src/dist/jiraTrackerTemplates.min.js": ["src/dist/jiraTrackerTemplates.js"]
                }
            }
        },
        jsbeautifier: {
            files: "<%= jshint.files %>",
            options: {
                "preserve_newlines": true,
                "max_preserve_newlines": 2
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
                src: ["src/lib/*.min.js", "src/lib/bootstrap/js/*.min.js",
                        "src/lib/js-logger/src/*.min.js", "src/lib/moment/min/*.min.js",
                        "src/lib/handlebars/dist/handlebars.runtime.js", "src/lib/gsloader/dist/*.min.js",
                        "jasmine/lib/**/*.js", "src/dist/jiraTrackerTemplates.min.js",
                        "src/dist/jiraProgressTracker.js", "src/js/jiraTrackerBackground.js"
                ],
                options: {
                    specs: ["jasmine/specs/**/*Spec.js"],
                    host: "http://127.0.0.1:<%= connect.jasmine.options.port %>/"
                }
            }
        },
        watch: {
            options: {
                files: ["src/js/**/*.js", "src/views/**/*.hbs"],
                tasks: ["dist", "uglify"],
                interrupt: true,
                debounceDelay: 5,
                interval: 5
            }
        },
        jshint: {
            files: ["package.json", "Gruntfile.js", "src/js/**/*.js", "jasmine/specs/**/*Spec.js", "jasmine/lib/*.js"],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                boss: true,
                eqnull: true,
                browser: true,
                unused: true,
                debug: true
            },
            globals: {
                jQuery: false,
                jasmine: false,
                describe: false,
                it: false,
                spyOn: false,
                expect: false,
                waitsFor: false,
                runs: false,
                beforeEach: false,
                afterEach: false
            }
        },
        handlebars: {
            compile: {
                options: {
                    namespace: "JiraTrackerTemplates"
                },
                files: {
                    "src/dist/jiraTrackerTemplates.js": ["src/views/*.hbs"]
                }
            }
        }
    });

    /* These plugins provide necessary tasks. */
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks('grunt-contrib-handlebars');

    /* Register tasks. */

    grunt.registerTask("dist", ["concat", "handlebars", "uglify"]);
    grunt.registerTask("default", ["jsbeautifier", "jshint", "dist", "connect", "jasmine"]);
    grunt.registerTask("test", ["dist", "connect", "jasmine"]);
    grunt.registerTask("jasmine-server", ["dist", "jasmine:all:build", "open:jasmine", "connect::keepalive"]);

};
