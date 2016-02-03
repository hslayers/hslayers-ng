/**
 * @namespace hs.ows
 * @memberOf hs
 */

define(['angular', 'map', 'ows.wms', 'ows.nonwms', 'ows.wmsprioritized', 'permalink'],

    function(angular) {
        angular.module('hs.ows', ['hs.map', 'hs.ows.wms', 'hs.ows.nonwms', 'hs.ows.wmsprioritized'])
            .directive('hs.ows.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/ows.html'
                };
            })
            .controller('hs.ows.controller', ['$scope', 'hs.ows.wms.service_capabilities', 'hs.map.service', 'hs.permalink.service_url', 'Core', 'hs.ows.nonwms.service',
                function($scope, srv_caps, OlMap, permalink, Core, nonwmsservice) {
                    var map = OlMap.map;
                    if (angular.isArray(Core.connectTypes)) {
                        $scope.types = Core.connectTypes;
                    } else {
                        $scope.types = ["", "WMS", "KML", "GeoJSON"];
                    }
                    $scope.type = "";
                    $scope.image_formats = [];
                    $scope.query_formats = [];
                    $scope.tile_size = 512;
                    $scope.setUrlAndConnect = function(url) {
                        $scope.url = url;
                        $scope.connect();
                    }
                    $scope.connect = function() {
                        $('.ows-capabilities').slideDown();
                        switch ($scope.type.toLowerCase()) {
                            /* case "gml":
                             case "georss":
                                 // Prompt for user data and process the result using a callback:
                                 Ext.Msg.prompt(
                                     OpenLayers.i18n('Name'),
                                     OpenLayers.i18n('Please layer name: '),
                                     function(btn, text){
                                         if (btn == 'ok'){
                                             this.ows._addNonOWSLayer(this.url,this.service,text);
                                         }
                                     },{service:service, url:url,ows:this},true,service);
                                 break;*/
                            case "wms":
                                srv_caps.requestGetCapabilities($scope.url);
                                $scope.connected = true;
                                break;
                        }
                    };

                    /**TODO: move variables out of this function. Call $scope.connected = false when template change */
                    $scope.templateByType = function() {
                        var template;
                        var ows_path = hsl_path + 'components/ows/partials/';
                        switch ($scope.type.toLowerCase()) {
                            case "wms":
                                template = ows_path + 'owswms.html';
                                break;
                            case "wms with priorities":
                                template = ows_path + 'owsprioritized.html';
                                break;
                            case "wfs":
                                template = ows_path + 'owswfs.html';
                                break;
                            case "kml":
                            case "geojson":
                                template = ows_path + 'owsnonwms.html';
                                break;
                            default:
                                break;
                        }
                        return template;
                    };

                    $scope.clear = function() {
                        $scope.url = '';
                        $('.ows-capabilities').slideUp();
                        $scope.connected = false;
                    }

                    function zoomToVectorLayer(lyr) {
                        Core.setMainPanel('layermanager');
                        lyr.getSource().on('change', function() { //Event needed because features are loaded asynchronously
                            var extent = lyr.getSource().getExtent();
                            if (extent != null) map.getView().fit(extent, map.getSize());
                        });
                    }

                    if (permalink.getParamValue('wms_to_connect')) {
                        var wms = permalink.getParamValue('wms_to_connect');
                        Core.setMainPanel('ows');
                        $scope.setUrlAndConnect(wms);
                    }

                    if (permalink.getParamValue('geojson_to_connect')) {
                        var url = permalink.getParamValue('geojson_to_connect');
                        var lyr = nonwmsservice.add('geojson', url, 'Geojson layer', false, map.getView().getProjection().getCode().toUpperCase());
                        zoomToVectorLayer(lyr);
                    }

                    if (permalink.getParamValue('kml_to_connect')) {
                        var url = permalink.getParamValue('kml_to_connect');
                        var lyr = nonwmsservice.add('kml', url, 'KML layer', true, map.getView().getProjection().getCode().toUpperCase());
                        zoomToVectorLayer(lyr);
                    }



                    $scope.$emit('scope_loaded', "Ows");
                }
            ]);
    })
