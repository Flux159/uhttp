'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            builds: {
                files: [
                    {
                        dot: true,
                        src: [
                            '.tmp',
                            'dist/*',
                            '!dist/.gitignore'
                        ]
                    }
                ]
            },
            test: {
                files: [
                    {
                        dot: true,
                        src: [
                            'coverage'
                        ]
                    }
                ]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: ['src/uhttp.js']
            }
        },
        uglify: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.js'],
                        dest: 'dist/',
                        ext: '.min.js',
                        extDot: 'first'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('build', [
        'clean:builds',
        'jshint',
        'uglify'
    ]);

};
