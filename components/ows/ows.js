/**
* @namespace hs.ows
* @memberOf hs  
*/ 

define(['angular', 'map', 'ows.wms', 'ows.nonwms', 'ows.wmsprioritized'],

    function(angular) {
        angular.module('hs.ows', ['hs.map', 'hs.ows.wms', 'hs.ows.nonwms', 'hs.ows.wmsprioritized'])
            .directive('hs.ows.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/ows.html'
                };
            })
            .controller('hs.ows.controller', ['$scope', 'OwsWmsCapabilities', 'hs.map.service',
                function($scope, OwsWmsCapabilities, OlMap) {
                    var map = OlMap.map;
                    $scope.url = "http://erra.ccss.cz/geoserver/ows";
                    $scope.types = ["WMS", "WFS", "WCS", "KML", "GeoRSS", "GML", "GeoJSON", "SOS", "WMS with priorities"];
                    $scope.type = "WMS";
                    $scope.image_formats = [];
                    $scope.query_formats = [];
                    $scope.tile_size = 512;
                    $scope.setUrlAndConnect = function(url) {
                        $scope.url = url;
                        $scope.connect();
                    }
                    $scope.connect = function() {
                        switch ($scope.type.toLowerCase()) {
                            case "kml":
                                $scope.addKmlLayer($scope.url);
                                break;
                                /*case "gml":
                                case "geojson":
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
                                OwsWmsCapabilities.requestGetCapabilities($scope.url);
                                break;
                        }
                    };

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
                                template = ows_path + 'owsnonwms.html';
                                break;
                            default:
                                break;
                        }
                        return template;
                    };
                    $scope.$emit('scope_loaded', "Ows");
                }
            ]);
    })
