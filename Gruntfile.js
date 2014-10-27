module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
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
                src: ["components/**/*.js", "hslayers.js", "app.js"]
            },
            "git-pre-commit": {
                src: ["components/**/*.js", "hslayers.js", "app.js"]
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier']);

};
