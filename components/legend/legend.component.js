export default {
    template: require('components/legend/partials/legend.html'),
    controller: ['$scope', 'hs.map.service', '$rootScope', 'hs.legend.service', function ($scope, OlMap, $rootScope, service) {
        var map;

        angular.extend($scope, {
            layerDescriptors: [],

            /**
             * Add selected layer to the list of layers in legend (with event listener 
             * to display/hide legend item when layer visibility change)
             * @memberof hs.legend.controller
             * @function addLayerToLegends
             * @param {object} layer Layer to add legend for 
             */
            addLayerToLegends: function (layer) {
                var descriptor = service.getLayerLegendDescriptor(layer);
                if (descriptor) {
                    $scope.layerDescriptors.push(descriptor);
                    layer.on('change:visible', layerVisibilityChanged);
                }
            },

            /**
             * Remove selected layer from legend items
             * @memberof hs.legend.controller
             * @function removeLayerFromLegends
             * @param {Ol.layer} layer Layer to remove from legend
             */
            removeLayerFromLegends: function (layer) {
                for (var i = 0; i < $scope.layerDescriptors.length; i++) {
                    if ($scope.layerDescriptors[i].lyr == layer) {
                        $scope.layerDescriptors.splice(i, 1);
                        break;
                    }
                }
            },

            /** 
            * Refresh event listeners UNUSED
            * @memberof hs.legend.controller
            * @function refresh
            */
            refresh: function () {
                if (!$scope.$$phase) $scope.$digest();
            },

            isLegendable: service.isLegendable
        });

        function init() {
            map = OlMap.map;
            map.getLayers().on("add", layerAdded);
            map.getLayers().on("remove", function (e) {
                $scope.removeLayerFromLegends(e.element);
            });
            map.getLayers().forEach(function (lyr) {
                layerAdded({
                    element: lyr
                });
            })
        }

        /**
         * (PRIVATE) Callback function for adding layer to map, add layers legend
         * @memberof hs.legend.controller
         * @function layerAdded
         * @param {Object} e Event object, should have element property
         */
        function layerAdded(e) {
            $scope.addLayerToLegends(e.element);
        };

        function layerVisibilityChanged(e) {
            for (var i = 0; i < $scope.layerDescriptors.length; i++) {
                if ($scope.layerDescriptors[i].layer == e.target) {
                    $scope.layerDescriptors[i].visible = e.target.getVisible();
                    break;
                }
            }
        }

        OlMap.loaded().then(init);

        $scope.$emit('scope_loaded', "Legend");
    }]
}