import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import '../../../common/get-capabilities.module';

export default {
    template: ['config', function (config) {
        return {
            template: require('./add-wmts-layer.directive.html')
        };
    }],
    controller: ['$scope', 'hs.map.service', 'hs.addLayersWmts.service_capabilities', 'Core', '$compile', '$rootScope',
        function ($scope, OlMap, srv_caps, Core, $compile, $rootScope) {
            $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
            $scope.style = "";
            $scope.tileMatrixSet = "";
            $scope.image_format = "";

            $scope.capabilitiesReceived = function (response) {
                try {
                    var parser = new ol.format.WMTSCapabilities();
                    $scope.capabilities = parser.read(response);
                    var caps = $scope.capabilities;
                    $scope.title = caps.ServiceIdentification.Title;
                    $scope.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
                    for (var idx = 0; idx < caps.OperationsMetadata.GetTile.DCP.HTTP.Get.length; idx++) {
                        if (caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].Constraint[0].AllowedValues.Value[0] == "KVP") {
                            $scope.tileURL = caps.OperationsMetadata.GetTile.DCP.HTTP.Get[idx].href;
                            break;
                        }
                    }
                    $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
                    $scope.version = caps.Version || caps.version;
                    $scope.services = caps.Contents;
                } catch (e) {
                    if (console) console.log(e);
                    $scope.error = e.toString();
                    var previousDialog = document.getElementById("ows-wms-capabilities-error");
                    if (previousDialog)
                        previousDialog.parentNode.removeChild(previousDialog);
                    var el = angular.element('<div hs.wmts.capabilities_error_directive></div>');
                    document.getElementById("hs-dialog-area").appendChild(el[0]);
                    $compile(el)($scope);
                    //throw "wmts Capabilities parsing problem";
                }
            };

            $scope.$on('ows_wmts.capabilities_received', function (event, response) {
                $scope.capabilitiesReceived(response.data);
            });

            /**
             * @function setCurrentLayer
             * @memberOf hs.addLayersWmts.controller
             * @description Opens detailed view for manipulating layer
             * @param {object} layer - Wrapped layer to edit or view
             * @param {number} index - Used to position the detail panel after layers li element
             */
            $scope.setCurrentLayer = function (layer, index) {
                if ($scope.currentLayer == layer) {
                    $scope.currentLayer = null;
                } else {
                    $scope.currentLayer = layer;
                    var wmtsLayerPanel = document.getElementsByClassName('wmtslayerpanel');
                    var layerNode = document.getElementById('wmtslayer-' + index);
                    if (wmtsLayerPanel.length > 0) {
                        wmtsLayerPanel = wmtsLayerPanel[0];
                        layerNode.parentNode.insertBefore(wmtsLayerPanel, layerNode.nextSibling);
                    }
                }
                return false;
            }

            /**
             * @function addLayer
             * @memberOf hs.addLayersWmts.controller
             * @description Add layer to map
             * @param {object} layer - Wrapped layer to add
             */

            $scope.addLayer = function (layer) {
                var projection = ol.proj.get($scope.map_projection);
                var projectionExtent = projection.getExtent();
                for (var idx = 0; idx < $scope.services.TileMatrixSet.length; idx++) {
                    if ($scope.services.TileMatrixSet[idx].Identifier == $scope.tileMatrixSet) {
                        $scope.layerTileMatrix = $scope.services.TileMatrixSet[idx];
                    }

                }
                var size = ol.extent.getWidth(projectionExtent) / $scope.layerTileMatrix.TileMatrix[0].TileWidth;
                var resolutions = new Array($scope.layerTileMatrix.TileMatrix.length);
                var matrixIds = new Array($scope.layerTileMatrix.TileMatrix.length);
                for (var z = 0; z < $scope.layerTileMatrix.TileMatrix.length; ++z) {
                    // generate resolutions and matrixIds arrays for this WMTS
                    resolutions[z] = size / Math.pow(2, z);
                    matrixIds[z] = z;
                }

                var dimensions = {}

                angular.forEach(layer.Dimension, function (val) {
                    dimensions[val.name] = val;
                });


                var new_layer = new ol.layer.Tile({
                    title: layer.Title,
                    source: new ol.source.WMTS({
                        url: $scope.tileURL,
                        layer: layer.Identifier,
                        projection: projection,
                        matrixSet: 'EPSG:3857',
                        format: $scope.image_format,
                        tileGrid: new ol.tilegrid.WMTS({
                            origin: ol.extent.getTopLeft(projectionExtent),
                            resolutions: resolutions,
                            matrixIds: matrixIds
                        }),
                        style: $scope.style,
                        wrapX: true
                    }),
                    saveState: true,
                    removable: true,
                    dimensions: dimensions,
                });

                OlMap.map.addLayer(new_layer);
            }
        }
    ]
}