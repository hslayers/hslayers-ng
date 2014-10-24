define(['angular', 'map', 'toolbar'], 
       
       function (angular) {
angular.module('hs.query', ['hs.map', 'hs.toolbar'])
    .directive('infopanel', function() {
        return {
            templateUrl: 'components/query/partials/infopanel.html'
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
                groups: [],
                setAttributes : function(j) {
                    me.attributes = j; 
                    $rootScope.$broadcast( 'infopanel.updated' );
                }
            };
            
            return me;
        }
    ])

.controller('Query', ['$scope', 'OlMap', 'WmsGetFeatureInfo', 'InfoPanelService', 'ToolbarService',
    function($scope, OlMap, WmsGetFeatureInfo, InfoPanelService, ToolbarService) {
        var map = OlMap.map;
        $scope.attributes = [];
        $scope.groups = [];
        $scope.myname = "shady";
        
        map.on('singleclick', function(evt) {
            if(ToolbarService.mainpanel == 'measure') return;
            $scope.groups = [];
            $scope.attributes = [];
            $scope.groups.push({name:"Coordinates", attributes:[
                {"name":"EPSG:4326", "value":ol.coordinate.toStringHDMS(ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'))}, 
                {"name":"EPSG:3857", "value":ol.coordinate.createStringXY(7)(evt.coordinate)}]})
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
                if(console) console.log(url);
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
                var group = {name:"Feature", attributes:[]};
                
                for(var attribute in feature){
                    if(feature[attribute].__text)
                        group.attributes.push({"name":attribute, "value":feature[attribute].__text});
                }
                $scope.groups.push(group);
            }
        }
        
         $scope.$on( 'infopanel.updated', function( event ) {
            $scope.attributes = InfoPanelService.attributes;
            $scope.groups = InfoPanelService.groups;
            $scope.$apply();
         });
               
    }
]);
       })