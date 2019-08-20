module.exports = function (grunt) {

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
            }
        },
        pkg: grunt.file.readJSON('package.json'),
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

    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-jsdoc');
};
