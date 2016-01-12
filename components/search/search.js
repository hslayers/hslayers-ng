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
                        scope.has_results_panel = true;
                    }
                };
            }]).service('hs.search.service', ['$http', 'hs.utils.service', '$rootScope',
                function($http, utils, $rootScope) {
                    this.xhr = null;
                    this.request = function(query) {
                        var url = "http://api.geonames.org/searchJSON?&username=raitis&name_startsWith=" + query;
                        url = utils.proxify(url);
                        if (me.xhr !== null) me.xhr.abort();
                        me.xhr = $.ajax({
                            url: url,
                            cache: false,
                            success: function(r) {
                                $rootScope.$broadcast('search.results_received', r);
                                me.xhr = null
                            }
                        });
                    };
                    var me = this;
                }
            ])

        .controller('hs.search.controller', ['$scope', 'Core', 'hs.map.service', 'hs.search.service', '$log', 'hs.permalink.service_url', 'hs.styles.service', '$log',
            function($scope, Core, OlMap, SearchService, $log, permalink, styles, $log) {
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
                    var src = $scope.search_results_layer.getSource();
                    coordinate = ol.proj.transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', map.getView().getProjection());
                    src.addFeature(new ol.Feature({
                        geometry: new ol.geom.Point(coordinate),
                        record: result
                    }));

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

                $scope.searchResultsReceived = function(response) {
                    if ($scope.has_results_panel) {
                        Core.setMainPanel('search', false);
                        $scope.results = response.geonames;
                        $scope.clearvisible = true;
                        $scope.createCurrentPointLayer();
                        angular.forEach($scope.results, function(result) {
                            var src = $scope.search_results_layer.getSource();
                            var feature = new ol.Feature({
                                geometry: new ol.geom.Point(ol.proj.transform([parseFloat(result.lng), parseFloat(result.lat)], 'EPSG:4326', map.getView().getProjection())),
                                record: result
                            });
                            src.addFeature(feature);
                            result.feature = feature;
                        });
                        if (!$scope.$$phase) $scope.$digest();
                    }
                    /*   
                       $search_list.show();
                       if (msg.contents.geonames.length > 0) {
                           var bounds = new OpenLayers.LonLat(msg.contents.geonames[0].lng, msg.contents.geonames[0].lat);
                           map.setCenter(bounds.transform(projWGS84, map.getProjectionObject()), 13);
                           switchAwayFromRegions();
                       }*/
                }

                $scope.createCurrentPointLayer = function() {
                    if ($scope.search_results_layer) {
                        $scope.search_results_layer.getSource().clear();
                        map.removeLayer($scope.search_results_layer);
                    }
                    $scope.search_results_layer = new ol.layer.Vector({
                        title: "Search results",
                        source: new ol.source.Vector({}),
                        style: styles.pin_white_blue_highlight,
                        show_in_manager: false
                    });
                    map.addLayer($scope.search_results_layer);
                }

                $scope.highlightResult = function(result, state) {
                    if (angular.isDefined(result.feature))
                        result.feature.set('highlighted', state)
                }

                $scope.init();

                $scope.$on('search.results_received', function(e, r) {
                    $scope.searchResultsReceived(r);
                });

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
