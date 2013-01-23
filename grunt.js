/*global module:false*/
module.exports = function(grunt) {

    "use strict";
    grunt.initConfig({
        pkg: "<json:jiraProgressTracker.json>",
        meta: {
            banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\n' : '' %>* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */"
        },
        clean: ["src/dist", "_SpecRunner.html"],
        concat: {
            dist: {
                separator: ";\n/**********************************/\n",
                src: ["<banner:meta.banner>", "src/js/base64.js", "src/js/jiraTracker.js"],
                dest: "src/dist/<%= pkg.name %>.js"
            }
        },
        min: {
            dist: {
                src: ["<banner:meta.banner>", "<config:concat.dist.dest>"],
                dest: "src/dist/<%= pkg.name %>.min.js"
            }
        },
        jsbeautifier: {
            files: ["<config:lint.files>", "package.json"],
            options: {
                "preserve_newlines": true,
                "max_preserve_newlines": 1
            }
        },
        lint: {
            files: ["grunt.js", "src/js/**/*.js", "jasmine/specs/**/*Spec.js", "jasmine/lib/*.js"]
        },
        jasmine: {
            src: ["src/lib/*.min.js", "src/lib/**/js/*.min.js", "src/lib/**/dist/*.min.js", "src/js/**/*.js"],
            specs: ["jasmine/lib/**/*.js", "jasmine/specs/**/*Spec.js"]
        },
        watch: {
            options: {
                files: "src/js/**/*.js",
                tasks: ["concat"],
                interrupt: true,
                debounceDelay: 5,
                interval: 5
            }
        },
        jshint: {
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
        uglify: {}
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-jasmine-runner");
    grunt.loadNpmTasks("grunt-jsbeautifier");

    /* Register tasks. */
    grunt.registerTask("default", "jsbeautifier lint jasmine clean concat min");
};