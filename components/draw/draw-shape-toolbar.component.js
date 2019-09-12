import VectorLayer from 'ol/layer/Vector';
import 'utils.module';

export default {
    template: require('./partials/shape-toolbar.html'),
    controller: ['$scope', 'hs.map.service', 'hs.draw.service',
        'hs.utils.layerUtilsService', 'hs.query.vectorService', '$timeout',
        function ($scope, OlMap, drawService, layerUtilsService, queryVectorService, $timeout) {
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
                isLayerInManager: layerUtilsService.isLayerInManager,
                hasLayerTitle: layerUtilsService.hasLayerTitle,
                isLayerEditable: layerUtilsService.isLayerEditable,
                isLayerDrawable: layerUtilsService.isLayerDrawable,
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
                selectLayer(layer) {
                    $scope.selectedLayer = layer;
                    $scope.layersExpanded = false;
                },
                selectedLayerString() {
                    if ($scope.selectedLayer) {
                        return $scope.selectedLayer.get('title') || $scope.selectedLayer.get('name')
                    } else return 'Select layer'
                },
                toggleDrawToolbar() {
                    $scope.drawToolabrExpanded = !$scope.drawToolabrExpanded;
                    if (!$scope.drawToolabrExpanded) {
                        drawService.stopDrawing()
                    }
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