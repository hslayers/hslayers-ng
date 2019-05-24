/**
* @namespace hs.feature_crossfilter
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
define(['angular', 'ol', 'dc', 'map'],

    function(angular, ol, dc) {
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

        var module = angular.module('hs.feature_crossfilter', ['hs.map', 'hs.core'])
        
            /**
            * @memberof hs.feature_crossfilter
            * @ngdoc directive
            * @name hs.featureCrossfilter.directive
            * @description TODO
            */
            .directive('hs.featureCrossfilter.directive', ['config', function (config) {
                return {
                    template: require('components/feature_crossfilter/partials/f_crossfilter.html'),
                    link: function(scope, element) {

                    }
                };
            }])
        
            /**
            * @memberof hs.feature_crossfilter
            * @ngdoc service
            * @name hs.featureCrossfilter.service
            * @description TODO
            */
            .service('hs.feature_crossfilter.service', [function() {
                var me = {
                    makeCrossfilterDimensions: function(source, attributes) {
                        var facts = crossfilter(source.getFeatures());
                        var tmp = [];
                        for (var attr_i in attributes) {
                            var attr = attributes[attr_i];
                            var total = facts.dimension(function(feature) {
                                return feature.get(attr);
                            });
                            var groupsByTotal = total.group().reduceCount(function(feature) {
                                return feature.get(attr);
                            });
                            tmp.push({
                                dimension: total,
                                grouping: groupsByTotal
                            });
                        }

                        return tmp;
                        // caur konsoli: var a = angular.element('*[ng-app]').injector().get('hsService');
                    }
                };
                return me;
            }])
            
            /**
            * @memberof hs.feature_crossfilter
            * @ngdoc controller
            * @name hs.featureCrossfilter.controller
            * @description TODO
            */
            .controller('hs.feature_crossfilter.controller', ['$scope', 'hs.map.service', 'Core', 'hs.feature_crossfilter.service', 'config',
                function($scope, OlMap, Core, service, config) {
                    var map = OlMap.map;
                    var crossfilterable_layers = config.crossfilterable_layers;

                    $scope.loaderImage = config.hsl_path + 'components/feature_crossfilter/ajax-loader.gif';
                    $scope.loading = false;
                    $scope.groupings = [];

                    /**
                    * @function createConfiguredCharts
                    * @memberOf hs.featureCrossfilter.controller
                    * @description TODO
                    */
                    $scope.createConfiguredCharts = function() {
                        $scope.loading = true;
                        for (var g in $scope.groupings) $scope.groupings[g].dirty = true;
                        for (var layer_i = 0; layer_i < crossfilterable_layers.length; layer_i++) {
                            if (OlMap.map.getLayers().item(crossfilterable_layers[layer_i].layer_ix).getSource().getFeatures().length == 0) {
                                setTimeout($scope.createConfiguredCharts, 1000);
                                return;
                            }
                        }
                        for (var layer_i = 0; layer_i < crossfilterable_layers.length; layer_i++) {
                            var lyr = OlMap.map.getLayers().item(crossfilterable_layers[layer_i].layer_ix);
                            var attributes = crossfilterable_layers[layer_i].attributes;
                            for (var attr_i = 0; attr_i < attributes.length; attr_i++) {
                                var attr = attributes[attr_i];
                                var found = false;
                                for (var g in $scope.groupings) {
                                    if ($scope.groupings[g].id == layer_i.toString() + attr.hashCode) {
                                        $scope.groupings[g].dirty == false;
                                        found = true;
                                    }
                                }
                                if (!found) {
                                    $scope.groupings.push({
                                        name: attr,
                                        id: layer_i.toString() + attr.hashCode(),
                                        dirty: false
                                    });
                                }
                            }
                            if (!$scope.$$phase) $scope.$digest();
                            lyr.getSource().on('change', $scope.createConfiguredCharts);
                            var dims = service.makeCrossfilterDimensions(lyr.getSource(), attributes);
                            var filterFeatures = function(chart, filter) {
                                var data_items = chart.dimension().top(Infinity);
                                lyr.getSource().forEachFeature(function(feature) {
                                    feature.set('visible', false);
                                });
                                for (var i = 0; i < data_items.length; i++) {
                                    data_items[i].set('visible', true);
                                }
                                $scope.$emit('feature_crossfilter_filtered', filter);
                            }
                            for (var attr_i = 0; attr_i < attributes.length; attr_i++) {
                                var attr = attributes[attr_i];
                                var pies = [];
                                var createChart = function(id, attr_i) {
                                    if (document.querySelector(id)) {
                                        var chart = dc.rowChart(id);
                                        chart.width(document.getElementsByClassName("panelspace")[0].innerWidth - 35)
                                            .height(dims[attr_i].grouping.size() * 23 + 40).labelOffsetY(12)
                                            .dimension(dims[attr_i].dimension) // set dimension
                                            .group(dims[attr_i].grouping) // set group
                                            .on("filtered", filterFeatures);
                                        pies.push(chart);
                                        chart.render();
                                    } else {
                                        setTimeout(createChart, 1000, id, attr_i);
                                    }
                                }
                                createChart('#fc_chart' + layer_i + attr.hashCode(), attr_i);
                            }
                        }
                        for (var i = $scope.groupings.length - 1; i > 0; i--) {
                            if ($scope.groupings[g].dirty == true)
                                $scope.groupings.splice(i, 1);
                        }
                        $scope.loading = false;
                        if (!$scope.$$phase) $scope.$digest();
                    }

                    if (Core.mainpanel == 'feature_crossfilter') {
                        $scope.createConfiguredCharts();
                    }
                    $scope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'feature_crossfilter') {
                            $scope.createConfiguredCharts();
                        }
                    })

                    $scope.$on('infopanel.updated', function(event) {});

                    $scope.$emit('scope_loaded', "FeatureCrossfilter");
                }
            ]);

    })
