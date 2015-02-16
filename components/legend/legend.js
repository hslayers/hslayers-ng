define(['angular', 'ol', 'map'],

    function(angular, ol) {
        angular.module('hs.legend', ['hs.map'])
            .directive('legend', function() {
                return {
                    templateUrl: hsl_path + 'components/legend/partials/legend.html'
                };
            })

        .controller('Legend', ['$scope', 'OlMap',
            function($scope, OlMap) {
                var map = OlMap.map;
                $scope.layers = [];
                $scope.layerAdded = function(e) {
                    if (e.element.getSource() instanceof ol.source.TileWMS) {
                        var sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                        for (var i = 0; i < sub_layers.length; i++) {
                            sub_layers[i] = e.element.getSource().getUrls()[0] + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image/png";
                        }
                        e.element.on('change:visible', function(e) {
                            for (var i = 0; i < $scope.layers.length; i++) {
                                if ($scope.layers[i].layer == e.target) {
                                    $scope.layers[i].visible = e.target.getVisible();
                                    break;
                                }
                            }
                            if (!$scope.$$phase) $scope.$digest();
                        })
                        $scope.layers.push({
                            title: e.element.get("title"),
                            lyr: e.element,
                            sub_layers: sub_layers,
                            visible: e.element.getVisible()
                        });
                    }
                };
                $scope.layerRemoved = function(e) {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        if ($scope.layers[i].layer == e.element) {
                            $scope.layers.splice(i);
                            break;
                        }
                    }
                };
                OlMap.map.getLayers().forEach(function(lyr) {
                    $scope.layerAdded({
                        element: lyr
                    });
                })
                map.getLayers().on("add", $scope.layerAdded);
                map.getLayers().on("remove", $scope.layerRemoved);
                $scope.$emit('scope_loaded', "Legend");
            }
        ]);

    });
