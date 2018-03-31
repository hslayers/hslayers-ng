/**
* @namespace hs.feature_filter
* @memberOf hs  
* @desc Module is used to filter certain features on vector layers based on attribute values.
* It also draws nice charts with bars proportionaly to usage of each value of a particular attribute.
* 
* must provide layers to be fillterable in app.js parametrs:         
*      module.value('crossfilterable_layers', [{
        layer_ix: 1,
        attributes: ["http://gis.zcu.cz/poi#category_osm"]
    }]); 
*/
define(['angular', 'angular-material', 'ol', 'map', 'layermanager'],

    function(angular, ol) {
        String.prototype.hashCode = function() {
            var hash = 0;
            if (this.length == 0) return hash;
            for (i = 0; i < this.length; i++) {
                char = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        }

        var module = angular.module('hs.feature_filter', ['hs.map', 'hs.core', 'ngMaterial', 'hs.layermanager'])
        
            /**
            * @memberof hs.feature_filter
            * @ngdoc directive
            * @name hs.featureFilter.directive
            * @description TODO
            */
            .directive('hs.featureFilter.directive', ['config', function(config) {
                return {
                    templateUrl: `${hsl_path}components/feature_filter/partials/feature_filter${config.design || ''}.html?bust=${gitsha}`,
                    link: function(scope, element) {

                    }
                };
            }])
        
            /**
            * @memberof hs.feature_filter
            * @ngdoc directive
            * @name hs.featureFilter.element.directive
            * @description TODO
            */
            .directive('hs.featureFilter.element.directive', ['config', '$compile', function(config, $compile) {
                // console.log($state);
                return {
                    // templateUrl: `${hsl_path}components/feature_filter/partials/${$state.type}${config.design || ''}.html?bust=${gitsha}`,
                    template: '<ng-include src="getTemplateUrl()"/>',
                    scope: {
                        filter: "="
                    },
                    // link: function(scope, element, attrs) {
                    //     element.html(`${hsl_path}components/feature_filter/partials/${scope.filter.type}${config.design || ''}.html`).show();
                    //     $compile(element.contents())(scope);
                    // },
                    controller: function($scope) {
                        $scope.getTemplateUrl = function() {
                            return `${hsl_path}components/feature_filter/partials/${$scope.filter.type}${config.design || ''}.html?bust=${gitsha}`;
                        }
                    },
                    // templateUrl: function(el, attrs) {
                    //     return `${hsl_path}components/feature_filter/partials/${attrs.filter.type}md.html?bust=${gitsha}`
                    // },
                    // link: function(scope, element, attrs) {
                    //     scope.filter = scope.$eval(attrs.filter);
                    // },
                    // templateUrl: hsl_path + 'components/feature_filter/partials/{{filter.type}}md.html',
                };
            }])
        
            /**
            * @memberof hs.feature_filter
            * @ngdoc service
            * @name hs.featureFilter.service
            * @description TODO
            */
            .service('hs.feature_filter.service', ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'config', function($rootScope, OlMap, Core, utils, config) {
                var me = {
                    applyFilters: function(layer) {
                        // TODO: how to filter features in OL
                    }
                };
                return me;
            }])
            
            /**
            * @memberof hs.feature_filter
            * @ngdoc controller
            * @name hs.featureFilter.controller
            * @description TODO
            */
            .controller('hs.feature_filter.controller', ['$scope', 'hs.map.service', 'Core', 'hs.feature_filter.service', 'hs.layermanager.service', 'config',
                function($scope, OlMap, Core, service, LayMan, config) {
                    var map = OlMap.map;

                    $scope.LayMan = LayMan;
                    // $scope.currentLayer = LayMan.currentLayer;
                    // $scope.filters = LayMan.currentLayer.hsFilters;
                    $scope.applyFilters = service.applyFilters;

                    $scope.allSelected = function(filter) {
                        return filter.selected.length === filter.values.length;
                    };

                    $scope.isIndeterminate = function(filter) {
                        return (filter.selected.length !== 0 && filter.selected.length !== filter.values.length);
                    };

                    $scope.exists = function(item, list) {
                        return list.indexOf(item) > -1;
                    };

                    $scope.toggle = function(value, selected) {
                        var idx = selected.indexOf(value);
                        if (idx > -1) {
                            selected.splice(idx, 1);
                        } else {
                            selected.push(value);
                        }
                    };

                    $scope.toggleAll = function(filter) {
                        if (filter.selected.length === filter.values.length) {
                            filter.selected = [];
                        } else {
                            filter.selected = filter.values.slice(0);
                        }
                    };

                    // if (Core.mainpanel == 'feature_filter') {
                    //     $scope.createConfiguredCharts();
                    // }
                    // $scope.$on('core.mainpanel_changed', function(event) {
                    //     if (Core.mainpanel == 'feature_filter') {
                    //         $scope.createConfiguredCharts();
                    //     }
                    // })

                    // $scope.$on('infopanel.updated', function(event) {});

                    $scope.$emit('scope_loaded', "featureFilter");
                }
            ]);

    })
