module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['components/**/*.html']
                }
            },
            pilsen_traffic: {
                files: {
                    'examples/pilsen_traffic/template.pot': ['examples/pilsen_traffic/**/*.html', 'examples/pilsen_traffic/**/*.js']
                }
            }
        },
        nggettext_compile: {
          all: {
            files: {
              'components/translations/js/translations.js': ['po/*.po']
            }
          },
          pilsen_traffic: {
            files: {
              'examples/pilsen_traffic/translations.js': ['examples/pilsen_traffic/*.po']
            }
          }
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
                src: ["components/**/*.js", "hslayers.js", "app.js", "!components/translations/js/translations.js"]
            }
        },
        jsdoc: {
            dist: {
                src: ['components/**/*.js'],
                options: {
                    destination: 'docs',
                    configure: 'node_modules/angular-jsdoc/common/conf.json',
                    template: 'node_modules/angular-jsdoc/angular-template',
                    readme: './README.md'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier']);
    

};
