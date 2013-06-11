/*global module:false, require:false*/
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: "/* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
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
                options: {
                    specs: ["jasmine/specs/**/*spec.js"],
                    helpers: ["jasmine/lib/jasmine-helper.js", "jasmine/lib/**/*.js"],
                    host: "http://127.0.0.1:<%= connect.jasmine.options.port %>/",
                    template: require('grunt-template-jasmine-steal'),
                    templateOptions: {
                        steal: {
                            url: "src/lib/steal/steal.js"
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
            files: ["package.json", "Gruntfile.js", "src/js/**/*.js", "jasmine/specs/**/*spec.js", "jasmine/lib/*.js"],
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
