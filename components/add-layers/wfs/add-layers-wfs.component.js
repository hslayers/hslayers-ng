import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import '../../../common/get-capabilities.module';
import VectorLayer from 'ol/layer/Vector';
import WfsSource from 'hs.source.Wfs';
import WFSCapabilities from 'hs.format.WFSCapabilities';
import { WFS } from 'ol/format';
import { getPreferedFormat } from '../../../common/format-utils';
import { addAnchors } from '../../../common/attribution-utils';

export default {
    template: ['config', function (config) {
        return {
            template: require('./add-wfs-layer.directive.html')
        };
    }],
    controller: ['$scope', 'hs.map.service', 'hs.wfs.getCapabilitiesService', 'Core', '$compile', '$rootScope', 'hs.layout.service',
        function ($scope, OlMap, srv_caps, Core, $compile, $rootScope, layoutService) {
            $scope.map_projection = OlMap.map.getView().getProjection().getCode().toUpperCase();
            $scope.$on('ows_wfs.capabilities_received', function (event, response) {
                try {
                    caps = new WFSCapabilities(response.data);
                    $scope.title = caps.ServiceIdentification.Title;
                    $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
                    $scope.version = caps.Version || caps.version;
                    $scope.output_formats = caps.FeatureTypeList.FeatureType[0].OutputFormats;
                    $scope.srss = [caps.FeatureTypeList.FeatureType[0].DefaultCRS];
                    angular.forEach(caps.FeatureTypeList.FeatureType[0].OtherCRS, function (srs) {
                        $scope.srss.push(srs);
                    })

                    if ($scope.srss.indexOf('CRS:84') > -1) $scope.srss.splice($scope.srss.indexOf('CRS:84'), 1);

                    if (srv_caps.currentProjectionSupported($scope.srss))
                        $scope.srs = $scope.srss.indexOf(OlMap.map.getView().getProjection().getCode()) > -1 ? OlMap.map.getView().getProjection().getCode() : OlMap.map.getView().getProjection().getCode().toLowerCase();
                    else if ($scope.srss.indexOf('EPSG::4326') > -1) {
                        $scope.srs = 'EPSG:4326';
                    } else
                        $scope.srs = $scope.srss[0];
                    $scope.services = caps.FeatureTypeList.FeatureType;
                    console.log($scope.services);
                    angular.forEach(caps.OperationsMetadata.Operation, function (operation) {
                        switch (operation.name) {
                            case "DescribeFeatureType":
                                $scope.describeFeatureType = operation.DCP[0].HTTP.Get;
                                break;
                            case "GetFeature":
                                $scope.getFeature = operation.DCP[0].HTTP.Get;
                                break;
                        }
                    })

                    $scope.output_format = getPreferedFormat($scope.output_formats, ["text/xml; subtype=gml/3.2.1"]);


                } catch (e) {
                    if (console) console.log(e);
                    $scope.error = e.toString();
                    var previousDialog = document.getElementById("ows-wfs-capabilities-error");
                    if (previousDialog)
                        previousDialog.parentNode.removeChild(previousDialog);
                    var el = angular.element('<div hs.add-layers-wfs.capabilities-error-directive></span>');
                    $compile(el)($scope);
                    document.getElementById("hs-dialog-area").appendChild(el[0]);
                    //throw "WMS Capabilities parsing problem";
                }
            });

            /**
            * Clear Url and hide detailsWms
            * @memberof hs.addLayers
            * @function clear
            */
            $scope.clear = function () {
                $scope.url = '';
                $scope.showDetails = false;
            }

            $scope.connect = function () {
                wfsGetCapabilitiesService.requestGetCapabilities($scope.url);
                $scope.showDetails = true;
            }

            $scope.$on('ows.wfs_connecting', function (event, url) {
                $scope.setUrlAndConnect(url);
            });

            /**
            * Connect to service of specified Url
            * @memberof hs.addLayersWms
            * @function setUrlAndConnect
            * @param {String} url Url of requested service
            * @param {String} type Type of requested service
            */
            $scope.setUrlAndConnect = function (url) {
                $scope.url = url;
                $scope.connect();
            }
            
            /**
             * @function selectAllLayers
             * @memberOf hs.addLayersWfs
             * @description Select all layers from service.
             */
            $scope.selectAllLayers = function () {
                var recurse = function (layer) {
                    layer.checked = true;

                    angular.forEach(layer.Layer, function (sublayer) {
                        recurse(sublayer)
                    })
                }
                angular.forEach($scope.services.Layer, function (layer) {
                    recurse(layer)
                });
            }

            /**
             * @function tryAddLayers
             * @memberOf hs.addLayersWfs
             * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
             * @param {boolean} checked - Add all available layers or only checked ones. Checked=false=all
             */
            $scope.tryAddLayers = function (checked) {
                $scope.add_all = checked;
                $scope.addLayers(checked);
                return;
            };

            /**
             * @function addLayers
             * @memberOf hs.addLayersWfs
             * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
             * @param {boolean} checked - Add all available layers or olny checked ones. Checked=false=all
             */
            $scope.addLayers = function (checked) {
                var recurse = function (layer) {
                    if (!checked || layer.checked)
                        addLayer(
                            layer,
                            layer.Title.replace(/\//g, "&#47;"),
                            $scope.folder_name,
                            $scope.output_format,
                            $scope.srs
                        );

                    angular.forEach(layer.Layer, function (sublayer) {
                        recurse(sublayer)
                    })
                }
                angular.forEach($scope.services, function (layer) {
                    recurse(layer)
                });
                layoutService.setMainPanel('layermanager');
            };

            /**
             * @function addLayer
             * @memberOf hs.addLayersWfs
             * @param {Object} layer capabilities layer object
             * @param {String} layerName layer name in the map
             * @param {String} folder name
             * @param {String} outputFormat
             * @param {OpenLayers.Projection} srs of the layer
             * (PRIVATE) Add selected layer to map???
             */
            var addLayer = function (layer, layerName, folder, outputFormat, srs) {
                if (console) console.log(layer);

                var url = srv_caps.service_url.split("?")[0];
                var definition = {};
                definition.url = url;
                definition.format = 'hs.format.WFS';

                var new_layer = new VectorLayer({
                    title: layerName,
                    definition: definition,
                    source: new WfsSource({
                        url: url,
                        typename: layer.Name,
                        projection: srs,
                        version: $scope.version,
                        format: new WFS(),
                    }),
                })


                OlMap.map.addLayer(new_layer);
            }
        }
    ]
}