/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    "use strict";
    grunt.initConfig({
        pkg: '<json:jiraProgressTracker.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        clean: ['src/dist', '_SpecRunner.html'],
        concat: {
            dist: {
                separator: ';\n/**********************************/\n',
                src: ['<banner:meta.banner>', 'src/js/base64.js', 'src/js/jiraTracker.js'],
                dest: 'src/dist/<%= pkg.name %>.js'
            }
        },
        min: {
            dist: {
                src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
                dest: 'src/dist/<%= pkg.name %>.min.js'
            }
        },
        lint: {
            files: ['grunt.js', 'src/js/**/*.js']
        },
        jasmine: {
            src: ['src/lib/*.js', 'src/lib/bootstrap/js/*.js', 'src/lib/gsloader/dist/gsloader.min.js', 'src/js/**/*.js'],
            specs: ['jasmine/lib/**/*.js', 'jasmine/specs/**/*Spec.js']
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint'
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
                jQuery: false
            }
        },
        uglify: {}
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-jasmine-runner");

    // Register tasks.
    grunt.registerTask("default", "jasmine lint clean concat min");
};