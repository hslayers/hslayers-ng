module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        nggettext_extract: {
            databio: {
                files: {
                    'examples/databio/template.pot': [__dirname + '/**/*.html', __dirname + '/**/*.js']
                }
            }
        },
        nggettext_compile: {
            databio: {
                files: {
                    'examples/databio/translations.js': [__dirname + "/*.po"]
                }
            },
        },
        pkg: grunt.file.readJSON('../../package.json'),
        uglify: {
            bundles: {
                options: {
                    mangle: {
                        reserved: ['angular', '$', 'ol', 'define', 'Api']
                    }
                },
                files: [{
                    expand: true,
                    src: ["examples/databio/bundle.js", "!" + __dirname + "/bundle.min.js"],
                    dest: 'dist',
                    cwd: '.',
                    rename: function(dst, src) {
                        return src.replace('.js', '.min.js');
                    }
                }]
            }
        },
        "jsbeautifier": {
            "default": {
                src: [__dirname + "/hslayers.js", __dirname + "/app.js", __dirname + "/*.js", "!" + __dirname + "/bundle.js", "!" + __dirname + "/bundle.min.js"]
            },
            "git-pre-commit": {
                src: [__dirname + "/hslayers.js", __dirname + "/app.js", "!" + __dirname + "/bundle.js", "!" + __dirname + "/bundle.min.js"]
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

    grunt.file.setBase('../../')

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.registerTask('default', ['jsbeautifier', 'uglify']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier']);


};
