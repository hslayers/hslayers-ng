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
        'bootstrap.bundle',
        'geolocation',
        'api',
        'draw',
        'drag',
        'rtserver'
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
            'hs.draw',
            'hs.drag',
            'hs.rtserver'
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
                }),
                new ol.layer.Vector({
                    title: 'Editable vector layer',
                    visibility: true,
                    source: new ol.source.Vector({
                        url: 'http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi/observations/select?user_name=' + config.user_name + '&format=geojson',
                        senslog_url: 'http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi/',
                        format: new ol.format.GeoJSON()
                    })
                })

            ],
            default_view: new ol.View({
                center: ol.proj.transform([6.1319, 49.6116], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 13,
                units: "m"
            }),
            user_name: tester
        });

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', 'hs.rtserver.service',
            function($scope, Core, $compile, hsmap, rtserver) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.split_x = 0;
                $scope.split_y = 0;
                $scope.split_moved = function(x, y) {
                    $scope.split_x = x;
                    $scope.split_y = y;
                    hsmap.map.render();
                }
                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Map') {
                        rtserver.init();
                    }
                });
                Core.panelEnabled('compositions', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
