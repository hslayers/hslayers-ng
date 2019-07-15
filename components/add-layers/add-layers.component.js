export default {
    template: require('components/add-layers/partials/add-layers.directive.html'), 
    controller: ['$scope', '$injector', 'hs.wms.getCapabilitiesService', 'hs.wmts.getCapabilitiesService', 'hs.wfs.getCapabilitiesService', 'hs.map.service', 'hs.permalink.urlService', 'Core', 'hs.addLayersVector.service', 'config', '$rootScope',
        function ($scope, $injector, srv_wms_caps, srv_wmts_caps, srv_wfs_caps, OlMap, permalink, Core, nonwmsservice, config, $rootScope) {
            $scope.Core = Core;
            var map = OlMap.map;
            if (angular.isArray(config.connectTypes)) {
                $scope.types = config.connectTypes;
            } else {
                $scope.types = ["", "WMS", "KML", "GeoJSON"];
            }
            $scope.type = "";
            $scope.image_formats = [];
            $scope.query_formats = [];
            $scope.tile_size = 512;
            /**
            * Connect to service of specified Url and Type
            * @memberof hs.addLayers
            * @function setUrlAndConnect
            * @param {String} url Url of requested service
            * @param {String} type Type of requested service
            */
            $scope.setUrlAndConnect = function (url, type) {
                $scope.url = url;
                $scope.type = type;
                $scope.connect();
            }
            /**
            * Get capabalitires of selected OGC service and show details in app
            * @memberof hs.addLayers
            * @function connect
            */
            $scope.connect = function () {
                switch ($scope.type.toLowerCase()) {
                    case "wms":
                        srv_wms_caps.requestGetCapabilities($scope.url);
                        $scope.showDetails = true;
                        break;
                    case "wmts":
                        srv_wmts_caps.requestGetCapabilities($scope.url);
                        $scope.showDetails = true;
                        break;
                    case "wfs":
                        srv_wfs_caps.requestGetCapabilities($scope.url);
                        $scope.showDetails = true;
                        break;
                }
            };

            /**
            * Change detail panel template according to selected type
            * @memberof hs.addLayers
            * @function templateByType
            * @return {String} template Path to correct type template
            */
            /**TODO: move variables out of this function. Call $scope.connected = false when template change */
            $scope.templateByType = function () {
                var template;
                switch ($scope.type.toLowerCase()) {
                    case "wms":
                        template = '<hs.add-layers-wms/>';
                        break;
                    case "wmts":
                        template = '<hs.add-layers-wmts/>';
                        break;
                    case "wfs":
                        template = '<hs.add-layers-wfs/>';
                        break;
                    case "kml":
                    case "geojson":
                        template = '<hs.add-layers-vector/>';
                        $scope.showDetails = true;
                        break;
                    default:
                        break;
                }
                return template;
            };

            /**
            * Test if currently selected type is service or file
            * @memberof hs.addLayers
            * @function isService
            * @returns {Boolean} boolean True for service, false for file
            */
            $scope.isService = function () {
                if (["kml", "geojson", "json"].indexOf($scope.type.toLowerCase()) > -1) {
                    return false;
                } else {
                    return true;
                }
            }

            /**
            * Clear Url and hide details
            * @memberof hs.addLayers
            * @function clear
            */
            $scope.clear = function () {
                $scope.url = '';
                $scope.showDetails = false;
            }

            /**
            * (PRIVATE) Zoom to selected vector layer
            * @memberof hs.addLayers
            * @function zoomToVectorLayer
            * @param {ol.Layer} lyr New layer
            */
            function zoomToVectorLayer(lyr) {
                Core.setMainPanel('layermanager');
                lyr.getSource().on('change', function () { //Event needed because features are loaded asynchronously
                    var extent = lyr.getSource().getExtent();
                    if (extent != null) map.getView().fit(extent, map.getSize());
                });
            }

            if (permalink.getParamValue('wms_to_connect')) {
                var wms = permalink.getParamValue('wms_to_connect');
                Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                $scope.setUrlAndConnect(wms, 'WMS');
                $rootScope.$broadcast('ows.wms_connecting');
            }

            if (permalink.getParamValue('wfs_to_connect') && window.allowWFS2) {
                var wfs = permalink.getParamValue('wfs_to_connect');
                Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                $scope.setUrlAndConnect(wfs, 'WFS');
                if (Core.singleDatasources) $('.dss-tabs a[href="#OWS"]').tab('show');
            }

            var title = decodeURIComponent(permalink.getParamValue('title')) || 'Layer';
            var abstract = decodeURIComponent(permalink.getParamValue('abstract'));

            if (permalink.getParamValue('geojson_to_connect')) {
                var url = permalink.getParamValue('geojson_to_connect');
                var type = 'geojson';
                if (url.indexOf('gpx') > 0) type = 'gpx';
                if (url.indexOf('kml') > 0) type = 'kml';
                var lyr = nonwmsservice.add(type, url, title, abstract, false, 'EPSG:4326');
                zoomToVectorLayer(lyr);
            }

            if (permalink.getParamValue('kml_to_connect')) {
                var url = permalink.getParamValue('kml_to_connect');
                var lyr = nonwmsservice.add('kml', url, title, abstract, true, 'EPSG:4326');
                zoomToVectorLayer(lyr);
            }

            $scope.$emit('scope_loaded', "Ows");
        }
    ]
}