module.exports = function (grunt) {

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
            },
            material: {
                files: {
                    'examples/liberecMaterial/template.pot': ['examples/liberecMaterial/**/*.html', 'examples/liberecMaterial/**/*.js']
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
            },
            material: {
                files: {
                    'examples/liberecMaterial/translations.js': ['examples/liberecMaterial/*.po']
                }
            }
        },
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            component: {
                options: 
                {
                    mangle: {
                    reserved: ['angular', '$', 'ol','define','Api']
                }},
                files: [{
                    expand: true,
                    src: ["components/**/*.js", "!components/**/*.min.js", "!components/translations/js/translations.js", "!components/draw/draw.js"],
                    dest: 'dist',
                    cwd: '.',
                    rename: function (dst, src) {
                        return src.replace('.js', '.min.js');
                    }
                }]
            },
            pilsenTraffic: {
                options: 
                {
                    mangle: {
                    reserved: ['angular', '$', 'ol','define','Api']
                }},
                files: [{
                    expand: true,
                    src: ["examples/pilsen_traffic/**/*.js", "!examples/pilsen_traffic/**/*.min.js",
                    "!examples/pilsen_traffic/translations.js"],
                    dest: 'dist',
                    cwd: '.',
                    rename: function (dst, src) {
                        return src.replace('.js', '.min.js');
                    }
                }]
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier']);


};