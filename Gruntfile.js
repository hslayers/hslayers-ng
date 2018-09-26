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
            databio: {
                files: {
                    'examples/databio/template.pot': ['examples/databio/**/*.html', 'examples/databio/**/*.js']
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
            databio: {
                files: {
                    'examples/databio/translations.js': ['examples/databio/*.po']
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
                    src: ["components/**/*.js", "!components/**/*.min.js", "!components/translations/js/translations.js", "!components/draw/draw.js", "!components/cesium/camera.js"],
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
            },
            bundles: {
                options: 
                {
                    mangle: {
                    reserved: ['angular', '$', 'ol','define','Api']
                }},
                files: [{
                    expand: true,
                    src: ["examples/**/bundle.js", "!examples/**/bundle.min.js"],
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
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier']);


};
