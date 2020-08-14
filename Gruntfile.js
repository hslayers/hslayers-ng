module.exports = function (grunt) {
  grunt.initConfig({
    nggettext_extract: {
      pot: {
        files: {
          'po/template.pot': ['components/**/*.html', 'components/**/*.js'],
        },
      },
    },
    nggettext_compile: {
      all: {
        files: {
          'components/translations/js/translations.js': ['po/*.po'],
        },
      },
    },
    pkg: grunt.file.readJSON('package.json'),
  });

  grunt.loadNpmTasks('grunt-angular-gettext');
};
