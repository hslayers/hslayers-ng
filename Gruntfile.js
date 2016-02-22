module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['components/**/*.html']
                }
            }
        },
        nggettext_compile: {
          all: {
            files: {
              'components/translations/js/translations.js': ['po/*.po']
            }
          },
        },
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        "jsbeautifier": {
            "default": {
                src: ["components/**/*.js", "hslayers.js", "app.js", "examples/**/*.js", "extensions/*.js", "!examples/cordova_examples/**/*.js", "!components/translations/js/translations.js"]
            },
            "git-pre-commit": {
                src: ["components/**/*.js", "hslayers.js", "app.js"]
            }
        },
        'jsdoc-ng' : {
            dist : {
                src: ['components/**/*.js', 'README.md' ],
                dest: 'docs',
                template : 'jsdoc-ng',
                options: {
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-jsdoc-ng');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier']);

};
