import VectorLayer from 'ol/layer/Vector';
export default {
    template: require('./partials/shape-toolbar.html'),
    controller: ['$scope', 'hs.map.service', 'hs.draw.service',
        'hs.utils.service', 'hs.query.vectorService', '$timeout',
        function ($scope, OlMap, drawService, utils, queryVectorService, $timeout) {
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
                isLayerEditable(layer) {
                    if (angular.isUndefined(layer.get('editor'))) return true;
                    const editorConfig = layer.get('editor');
                    if (angular.isUndefined(editorConfig.editable)) return true;
                    return editorConfig.editable
                },
                isLayerDrawable(layer) {
                    return utils.instOf(layer, VectorLayer) &&
                        layer.getVisible() &&
                        $scope.isLayerInManager(layer) &&
                        $scope.hasLayerTitle(layer) &&
                        $scope.isLayerEditable(layer)
                },
                setType(what) {
                    drawService.type = what;
                    drawService.source = $scope.selectedLayer.getSource();
                    $scope.activateDrawing();
                },
                activateDrawing() {
                    drawService.activateDrawing(
                        $scope.onDrawStart,//Will add later
                        $scope.onDrawEnd,
                        $scope.onFeatureSelected, //Will add later
                        $scope.onFeatureDeselected, //Will add later
                        true //Activate drawing immediately
                    );
                },
                onDrawEnd(e) {
                    if (angular.isUndefined($scope.selectedLayer.get('editor')))
                        return;
                    const editorConfig = $scope.selectedLayer.get('editor');
                    if (editorConfig.defaultAttributes) {
                        angular.forEach(editorConfig.defaultAttributes,
                            (value, key) => {
                                e.feature.set(key, value);
                            })
                    }
                    /*Timeout is necessary because features are not imediately 
                    * added to the layer and layer can't be retrieved from the 
                    * feature, so they don't appear in Info panel */
                    $timeout(() => {
                        queryVectorService.selector.getFeatures().push(e.feature);
                        queryVectorService.createFeatureAttributeList();
                    })

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