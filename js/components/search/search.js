angular.module('hs.search', ['hs.map'])
    .directive('searchinput', function() {
        return {
            templateUrl: 'js/components/search/partials/searchinput.html',
            replace: true
        };
    }).directive('searchresults', function() {
        return {
            templateUrl: 'js/components/search/partials/searchresults.html',
            replace: true
        };
    }).service("SearchService", ['$http',
        function($http) {
            this.request = function(query) {
                var url = window.escape("http://api.geonames.org/searchJSON?&username=raitis&q=" + query);
                $http.get("/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url).success(this.searchResultsReceived);
            };

        }
    ])

.controller('Search', ['$scope', 'OlMap', 'SearchService',
    function($scope, OlMap, SearchService) {
        var map = OlMap.map;
        $scope.query = "";
        $scope.results = [];
        
        $scope.queryChanged = function(){
            SearchService.request($scope.query);
            $("#searchresults").show();
        }
        
        $scope.zoomTo = function(lat, lng){
             map.getView().setCenter(ol.proj.transform([parseFloat(lat),parseFloat(lng) ], 'EPSG:4326', 'EPSG:3857'));
             map.getView().setZoom(10);
             $("#searchresults").hide();
        }
        
        SearchService.searchResultsReceived = function(response) {
            $scope.results = response.geonames;
             /*   
                $search_list.show();
                if (msg.contents.geonames.length > 0) {
                    var bounds = new OpenLayers.LonLat(msg.contents.geonames[0].lng, msg.contents.geonames[0].lat);
                    map.setCenter(bounds.transform(projWGS84, map.getProjectionObject()), 13);
                    switchAwayFromRegions();
                }*/
        }
    }
]);