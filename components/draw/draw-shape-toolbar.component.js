import VectorLayer from 'ol/layer/Vector';
export default {
    template: require('./partials/shape-toolbar.html'),
    controller: ['$scope', 'hs.map.service', 'hs.draw.service', 'hs.utils.service', function ($scope, OlMap, drawService, utils) {
        var map;
        angular.extend($scope, {
            service: drawService,
            selectedLayer: null,
            drawableLayers() {
                if (map) {
                    const tmp = map.getLayers().getArray()
                        .filter($scope.isLayerDrawable)
                    if (tmp.length > 0 && $scope.selectedLayer == null) {
                        $scope.selectedLayer = tmp[0]
                    }
                    return tmp;
                }
            },
            isLayerInManager(layer) {
                return angular.isUndefined(layer.get('show_in_manager'))
                    || layer.get('show_in_manager') == true
            },
            hasLayerTitle(layer) {
                return angular.isDefined(layer.get('title'))
                    && layer.get('title') != ''
            },
            isLayerDrawable(layer) {
                return utils.instOf(layer, VectorLayer) &&
                    layer.getVisible() &&
                    $scope.isLayerInManager(layer) &&
                    $scope.hasLayerTitle(layer)
            },
            setType(what) {
                drawService.type = what;
                drawService.source = $scope.selectedLayer.getSource();
                $scope.activateDrawing();
            },
            activateDrawing() {
                drawService.activateDrawing(
                    $scope.onDrawStart, //Will add later
                    $scope.onDrawEnd, //Will add later
                    $scope.onFeatureSelected, //Will add later
                    $scope.onFeatureDeselected, //Will add later
                    true //Activate drawing immediately
                );
            }
        });

        /**
         * @memberof hs.draw.shapeToolbar
         * @function init
         * @description Init function
         */
        function init() {
            map = OlMap.map;
        }

        OlMap.loaded().then(init);

        $scope.$emit('scope_loaded', "DrawToolbar");
    }]
}