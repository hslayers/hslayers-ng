/**
 * @namespace hs.rogainonline
 * @memberOf hs
 */
define(['angular', 'core'],

    function(angular) {

        angular.module('hs.rogainonline', ['hs.core'])

        .directive('hs.rogainonline.panelDirective', function() {
            return {
                templateUrl: './partials/panel.html?bust=' + gitsha
            };
        })

    })
