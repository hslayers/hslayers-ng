'use strict';

define(['ol',
        'toolbar',
        'sidebar',
        'layermanager',
        'query',
        'search',
        'print',
        'permalink',
        'measure',
        'bootstrap',
        'geolocation',
        'api',
        'senslog',
        'draw',
        'drag',
        'ows'
    ],
    function(ol, toolbar) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search',
            'hs.print',
            'hs.permalink',
            'hs.geolocation',
            'hs.api',
            'hs.sidebar',
            'hs.senslog',
            'hs.draw',
            'hs.drag',
            'hs.ows'
        ]);

        module.directive(
            'hs', [
                'hs.map.service', 'Core',
                function(OlMap, Core) {
                    return {
                        templateUrl: hsl_path + 'hslayers.html',
                        link: function(scope, element) {
                            Core.fullScreenMap(element);
                        }
                    };
                }
            ]);

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    base: true
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([6.1319, 49.6116], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 13,
                units: "m"
            }),
            senslog_url: 'http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi'
        });

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', 'config', '$http',
            function($scope, Core, $compile, hsmap, config, $http) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Sidebar') {
                        var el = angular.element('<div hs.senslog.directive hs.draggable ng-controller="hs.senslog.controller" ng-if="Core.exists(\'hs.senslog.controller\')" ng-show="Core.panelVisible(\'senslog\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);

                        var toolbar_button = angular.element('<div hs.senslog.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);

                        console.log(ol.proj.transformExtent(hsmap.map.getView().calculateExtent(hsmap.map.getSize()), 'EPSG:3857', 'EPSG:4326'));
                    }
                    if(args == 'Map'){
                        
                        $http.get(config.senslog_url + '/category/select/?user_name=tester').then(function(response) {
                            $scope.$broadcast('senslog.categories_loaded', response.data);
                        });

                        $http.get(config.senslog_url + '/dataset/select/?user_name=tester').then(function(response) {
                            $scope.$broadcast('senslog.datasets_loaded', response.data);
                            angular.forEach(response.data, function(dataset){
                                var lyr = new ol.layer.Vector({
                                    title: dataset.datasetName,
                                    visible: false,
                                    source: new ol.source.Vector({
                                        url: 'http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi/observations/select?user_name=tester&dataset_id='+dataset.datasetId+'&format=geojson',
                                        senslog_url: 'http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi/',
                                        format: new ol.format.GeoJSON()
                                    })
                                })
                                hsmap.map.addLayer(lyr);
                            })
                        });
                    }
                });
                Core.panelEnabled('compositions', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
