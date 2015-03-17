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
            .directive('featureCrossfilter', function() {
                return {
                    templateUrl: hsl_path + 'components/feature_crossfilter/partials/f_crossfilter.html',
                    link: function(scope, element) {

                    }
                };
            })
            .service('feature_crossfilter', [function() {
                return {
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
            }])
            .controller('FeatureCrossfilter', ['$scope', 'OlMap', 'Core', 'feature_crossfilter', 'crossfilterable_layers',
                function($scope, OlMap, Core, feature_crossfilter, crossfilterable_layers) {
                    var map = OlMap.map;

                    $scope.ajax_loader = hsl_path + 'components/feature_crossfilter/ajax-loader.gif';
                    $scope.loading = false;
                    $scope.groupings = [];

                    $scope.createConfiguredCharts = function() {
                        $scope.loading = true;
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
                                $scope.groupings.push({
                                    name: attr,
                                    id: layer_i.toString() + attr.hashCode()
                                });
                            }
                            if (!$scope.$$phase) $scope.$digest();
                            var dims = feature_crossfilter.makeCrossfilterDimensions(lyr.getSource(), attributes);
                            for (var attr_i = 0; attr_i < attributes.length; attr_i++) {
                                var attr = attributes[attr_i];
                                var pies = [];
                                var chart = dc.rowChart('#fc_chart' + layer_i + attr.hashCode());
                                chart.width($(".panelspace").width() - 35)
                                    .height(dims[attr_i].grouping.size() * 23 + 40).labelOffsetY(12)
                                    .dimension(dims[attr_i].dimension) // set dimension
                                    .group(dims[attr_i].grouping) // set group
                                pies.push(chart);
                            }
                        }
                        dc.renderAll();
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
