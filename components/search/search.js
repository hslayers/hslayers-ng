define(['angular', 'ol', 'map'],

    function(angular, ol) {
        angular.module('hs.search', ['hs.map'])
            .directive('searchinput', ['$window', function($window) {
                return {
                    templateUrl: hsl_path + 'components/search/partials/searchinput.html',
                    replace: true,
                    link: function(scope, element) {
                       
                    }
                };

            }]).directive('searchresults', ['$window', function($window) {
                return {
                    templateUrl: hsl_path + 'components/search/partials/searchresults.html',
                    replace: true,
                    link: function(scope, element) {
                       
                    }
                };
            }]).service("SearchService", ['$http',
                function($http) {
                    this.request = function(query) {
                        var url = window.escape("http://api.geonames.org/searchJSON?&username=raitis&q=" + query);
                        $.ajax({
                            url: "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url,
                            cache: false,
                            success: this.searchResultsReceived
                        });
                    };

                }
            ])

        .controller('Search', ['$scope', 'OlMap', 'SearchService',
            function($scope, OlMap, SearchService) {
                var map = OlMap.map;
                $scope.query = "";
                $scope.results = [];
                $scope.clearvisible = false;

                $scope.queryChanged = function() {
                    SearchService.request($scope.query);
                    $("#searchresults").show();
                }

                $scope.zoomTo = function(lat, lng) {
                    map.getView().setCenter(ol.proj.transform([parseFloat(lat), parseFloat(lng)], 'EPSG:4326', 'EPSG:3857'));
                    map.getView().setZoom(10);
                    $("#searchresults").html('');
                }

                $scope.clear = function() {
                    $("#searchresults").html('');
                    $scope.query = '';
                    $scope.clearvisible = false;
                }

                SearchService.searchResultsReceived = function(response) {
                    $scope.results = response.geonames;
                    $scope.clearvisible = true;
                    /*   
                       $search_list.show();
                       if (msg.contents.geonames.length > 0) {
                           var bounds = new OpenLayers.LonLat(msg.contents.geonames[0].lng, msg.contents.geonames[0].lat);
                           map.setCenter(bounds.transform(projWGS84, map.getProjectionObject()), 13);
                           switchAwayFromRegions();
                       }*/
                }
                $scope.$emit('scope_loaded', "Search");
            }
        ]);
    })
