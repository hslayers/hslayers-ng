/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'], function (angular) {
    var module = angular.module('hs.toolbar', ['hs.map', 'hs.core']);

    /**
     * @memberof hs.toolbar
     * @ngdoc component
     * @name hs.toolbar
     * @description Add toolbar to map (search field, full map button a measure button)
     */
    module.component('hs.toolbar', {
        templateUrl: ['config', function(config) {
            return config.hsl_path + 'components/toolbar/partials/toolbar.html'}
        ],
        
        /**
         * @memberof hs.toolbar
         * @ngdoc controller
         * @name hs.toolbar.controller
         */
        controller: ['$scope', 'hs.map.service', 'Core', 'hs.permalink.urlService', '$window', '$compile',
            function ($scope, OlMap, Core, bus, $window, $compile) {
                var collapsed = false;

                angular.extend($scope, {
                    Core: Core,

                    /**
                     * Set current active panel in sidebar
                     * @memberof hs.toolbar.controller
                     * @function setMainPanel
                     * @param {string} which
                     */
                    setMainPanel: function (which, by_gui, queryable) {
                        Core.setMainPanel(which, by_gui, queryable);
                        if (!$scope.$$phase) $scope.$digest();
                    },

                    /**
                     * Change/read collapsed setting
                     * @memberof hs.toolbar.controller
                     * @function collapsed
                     * @param {boolean} is
                     */
                    collapsed: function (is) {
                        if (arguments.length > 0) {
                            collapsed = is;
                        }
                        return collapsed;
                    },

                    /**
                     * Test mobile mode (document width under 800px)
                     * @memberof hs.toolbar.controller
                     * @function isMobile
                     */
                    isMobile: function () {
                        if ($(document).width() < 800) {
                            return "mobile";
                        } else {
                            return "";
                        }
                    },

                    /**
                     * True if composition is loaded
                     * @memberof hs.toolbar.controller
                     * @property compositionLoaded
                     */
                    compositionLoaded: function () {
                        return angular.isDefined($scope.composition_title);
                    }
                })


                $scope.$on('core.map_reset', function (event) {
                    delete $scope.composition_title;
                    delete $scope.composition_abstract;
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.$emit('scope_loaded', "Toolbar");
            }]
    });
})
