angular.module('hs.ows', ['hs.map', 'hs.ows.wms', 'hs.ows.nonwms', 'hs.ows.wmsprioritized', 'hs.map'])
    .directive('ows', function() {
        return {
            templateUrl: 'components/ows/partials/ows.html'
        };
    })
    .controller('Ows', ['$scope', 'OwsWmsCapabilities', 'OlMap', 
        function($scope, OwsWmsCapabilities, OlMap) {
            var map = OlMap.map;
            $scope.url = "http://erra.ccss.cz/geoserver/ows";
            $scope.types = ["WMS", "WFS", "WCS", "KML", "GeoRSS", "GML", "GeoJSON", "SOS", "WMS with priorities"];
            $scope.type = "WMS";
            $scope.image_formats = [];
            $scope.query_formats = [];
            $scope.tile_size = 512;
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
                switch ($scope.type.toLowerCase()) {
                    case "wms":
                        template = 'components/ows/partials/owswms.html';
                        break;
                    case "wms with priorities":
                        template = 'components/ows/partials/owsprioritized.html';
                        break;
                    case "wfs":
                        template = 'components/ows/partials/owswfs.html';
                        break;
                    case "kml":
                        template = 'components/ows/partials/owsnonwms.html';
                        break;
                    default:
                        break;
                }
                return template;
            };
        }
    ]);