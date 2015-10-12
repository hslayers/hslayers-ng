/**
 * @namespace hs.search
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'permalink', 'styles'],

    function(angular, ol) {
        angular.module('hs.search', ['hs.map', 'hs.styles'])
            .directive('hs.search.directiveSearchinput', ['$window', function($window) {
                return {
                    templateUrl: hsl_path + 'components/search/partials/searchinput.html',
                    replace: true,
                    link: function(scope, element) {

                    }
                };

            }]).directive('hs.search.directiveSearchresults', ['$window', function($window) {
                return {
                    templateUrl: hsl_path + 'components/search/partials/searchresults.html',
                    replace: true,
                    link: function(scope, element) {

                    }
                };
            }]).service("hs.search.service", ['$http',
                function($http) {
                    this.xhr = null;
                    this.request = function(query) {
                        var url = '';
                        if (typeof use_proxy === 'undefined' || use_proxy === true) {
                            url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent("http://api.geonames.org/searchJSON?&username=raitis&name_startsWith=" + query);
                        } else {
                            url = "http://api.geonames.org/searchJSON?&username=raitis&name_startsWith=" + query;
                        }
                        if (me.xhr !== null) me.xhr.abort();
                        me.xhr = $.ajax({
                            url: url,
                            cache: false,
                            success: function(r) {
                                me.searchResultsReceived(r);
                                me.xhr = null
                            }
                        });
                    };
                    var me = this;
                }
            ])

        .controller('hs.search.controller', ['$scope', 'Core', 'hs.map.service', 'hs.search.service', '$log', 'hs.permalink.service_url', 'hs.styles.service',
            function($scope, Core, OlMap, SearchService, $log, permalink, styles) {
                var map = OlMap.map;
                var point_clicked = new ol.geom.Point([0, 0]);
                $scope.search_results_layer = null;

                $scope.init = function() {
                    $scope.query = "";
                    $scope.results = [];
                    $scope.clearvisible = false;
                    if (permalink.getParamValue('search')) {
                        $scope.query = permalink.getParamValue('search');
                        Core.searchVisible(true);
                        $scope.queryChanged();
                    }
                }

                $scope.queryChanged = function() {
                    SearchService.request($scope.query);
                    $("#searchresults").show();
                }

                $scope.zoomTo = function(result) {
                    $scope.fcode_zoom_map = {
                        'PPLA': 12,
                        'PPL': 15,
                        'PPLC': 10,
                        "ADM1": 9,
                        'FRM': 15,
                        'PPLF': 13,
                        'LCTY': 13,
                        'RSTN': 15,
                        "PPLA3": 9,
                        'AIRP': 13,
                        'AIRF': 13,
                        'HTL': 17,
                        'STM': 14,
                        'LK': 13
                    };
                    $scope.createCurrentPointLayer();
                    coordinate = ol.proj.transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', map.getView().getProjection());
                    point_clicked.setCoordinates(coordinate, 'XY');
                    map.getView().setCenter(coordinate);
                    if (typeof $scope.fcode_zoom_map[result.fcode] !== 'undefined') {
                        map.getView().setZoom($scope.fcode_zoom_map[result.fcode]);
                    } else {
                        map.getView().setZoom(10);
                    }
                    $scope.results = [];
                }

                $scope.clear = function() {
                    $scope.results = [];
                    $scope.query = '';
                    $scope.clearvisible = false;
                    if ($scope.search_results_layer) map.getLayers().remove($scope.search_results_layer);
                    $scope.search_results_layer = null;
                }

                SearchService.searchResultsReceived = function(response) {
                    $scope.results = response.geonames;
                    $("#searchresults").show();
                    $scope.clearvisible = true;
                    if (!$scope.$$phase) $scope.$digest();
                    /*   
                       $search_list.show();
                       if (msg.contents.geonames.length > 0) {
                           var bounds = new OpenLayers.LonLat(msg.contents.geonames[0].lng, msg.contents.geonames[0].lat);
                           map.setCenter(bounds.transform(projWGS84, map.getProjectionObject()), 13);
                           switchAwayFromRegions();
                       }*/
                }

                $scope.createCurrentPointLayer = function() {
                    if ($scope.search_results_layer) map.getLayers().remove($scope.search_results_layer);
                    $scope.search_results_layer = new ol.layer.Vector({
                        title: "Search results",
                        source: new ol.source.Vector({
                            features: [new ol.Feature({
                                geometry: point_clicked
                            })]
                        }),
                        style: styles.pin_white_blue,
                        show_in_manager: false
                    });
                    map.addLayer($scope.search_results_layer);
                }

                $scope.init();

                $scope.$watch('Core.panelVisible("search")', function(newValue, oldValue) {
                    if (newValue !== oldValue && newValue) {
                        setTimeout(function() {
                            $('#search_address').focus();
                        }, 500);
                    }
                });
                $scope.$emit('scope_loaded', "Search");
            }
        ]);
    })
