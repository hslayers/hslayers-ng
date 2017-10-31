'use strict';

var hsl_path = '../../';
var gitsha = $.ajax({
    type: "GET",
    url: hsl_path + 'gitsha.js',
    async: false
}).responseText;

require.config({
    urlArgs: 'bust=' + gitsha,
    paths: {
        app: 'app',
        core: hsl_path + 'components/core/core',
        angular: hsl_path + 'bower_components/angular/angular',
        //material dependency
        ngAnimate: hsl_path + 'node_modules/angular-animate/angular-animate',
        ngAria: hsl_path + 'node_modules/angular-aria/angular-aria',
        ngMaterial: hsl_path + 'node_modules/angular-material/angular-material',
        //layer manager dependency
        tinycolor: hsl_path + 'node_modules/tinycolor2/tinycolor',
        mdColorPicker: hsl_path + 'node_modules/md-color-picker/dist/mdColorPicker',
        //share dependency
        clipboard: hsl_path + 'node_modules/clipboard/dist/clipboard',
        ngclipboard: hsl_path + 'node_modules/ngclipboard/dist/ngclipboard',
        //material Core
        matCore: hsl_path + 'materialComponents/matCore',
        //material translations
        translations: hsl_path + 'materialComponents/translations',
    },
    shim: {
        'ngAnimate': ['angular'],
        'ngAria': ['angular'],
        'ngMaterial': {
             deps: ['ngAnimate', 'ngAria']
        },
        'mdColorPicker': ['tinycolor'],
        'ngclipboard': ['clipboard']
    }
});

window.name = "NG_DEFER_BOOTSTRAP!";

require(['core','matCore'], function(app) {
    require(['app'], function(app) {
        var $html = angular.element(document.getElementsByTagName('html')[0]);
        angular.element().ready(function() {
            angular.resumeBootstrap([app['name']]);
        });
    });
});
