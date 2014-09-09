angular.module('hs.query', ['hs.map'])
    .directive('infopanel', function() {
        return {
            templateUrl: 'js/components/query/partials/infopanel.html'
        };
    }).service("WmsGetFeatureInfo", ['$http',
        function($http) {
            this.request = function(url) {
                var url = window.escape(url);
                $http.get("/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url).success(this.featureInfoReceived);
            };

        }
    ]).service("InfoPanelService", ['$rootScope',
        function($rootScope) {
            var me = {
                attributes:[],
                setAttributes : function(j) {
                    me.attributes = j; 
                    $rootScope.$broadcast( 'infopanel.updated' );
                }
            };
            
            return me;
        }
    ])

.controller('Query', ['$scope', 'OlMap', 'WmsGetFeatureInfo', 'InfoPanelService',
    function($scope, OlMap, WmsGetFeatureInfo, InfoPanelService) {
        var map = OlMap.map;
        $scope.attributes = [];
        $scope.myname = "shady";
        
        map.on('singleclick', function(evt) {
            map.getLayers().forEach(function(layer){queryLayer(layer, evt)});
        });
                  
        var queryLayer = function(layer, evt){
            if(!(layer instanceof ol.layer.Tile) || 
                !(layer.getSource() instanceof ol.source.TileWMS) || 
                    !layer.getSource().getParams().INFO_FORMAT) return;
            var source =  layer.getSource();
            var viewResolution = map.getView().getResolution();
            var url = source.getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, source.getProjection() ? source.getProjection(): map.getView().getProjection(), {
                    'INFO_FORMAT': source.getParams().INFO_FORMAT
                });
            if (url) {
                console.log(url);
                WmsGetFeatureInfo.request(url);
            }   
        }
        
        WmsGetFeatureInfo.featureInfoReceived = function(response) {
            /* Maybe this will work in future OL versions
             * 
             * var format = new ol.format.GML();
             *  console.log(format.readFeatures(response, {}));
             */
            
            var x2js = new X2JS();
            var json = x2js.xml_str2json( response );
            for(var feature in json.FeatureCollection.featureMember){
                if(feature == "__prefix") continue;
                feature = json.FeatureCollection.featureMember[feature];
                for(var attribute in feature){
                    if(feature[attribute].__text)
                        $scope.attributes.push({"name":attribute, "value":feature[attribute].__text});
                }
            }
        }
        
         $scope.$on( 'infopanel.updated', function( event ) {
            $scope.attributes = InfoPanelService.attributes;
            $scope.$apply();
         });
               
    }
]);