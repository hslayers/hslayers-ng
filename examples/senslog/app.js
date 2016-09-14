'use strict';

define(['ol',
        'sidebar',
        'toolbar',
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
        'drag'
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
            'hs.drag'
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
            })
        });

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service',
            function($scope, Core, $compile, hsmap) {
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
                    if (args == 'Sidebar') {
                        var el = angular.element('<div hs.senslog.directive hs.draggable ng-controller="hs.senslog.controller" ng-if="Core.exists(\'hs.senslog.controller\')" ng-show="Core.panelVisible(\'senslog\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);

                        var toolbar_button = angular.element('<div hs.senslog.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);

                        var slider_button = angular.element('<span class="glyphicon glyphicon-move" hs.draggable iswindow="false" hs-draggable-onmove="split_moved" style="z-index: 10001; font-size:1.5em; position:absolute; left:0px; top:0px" aria-hidden="true"></span>');

                        angular.element('#map').append(slider_button);
                        $compile(slider_button)($scope);
                    }
                });
                $scope.$on('layermanager.updated', function(data, layer) {
                    if (layer.get('base') != true && layer.get('always_visible') != true) {
                        layer.on('precompose', function(evt) {
                            var ctx = evt.context;
                            var width = $scope.split_x;
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(0, 0, width, ctx.canvas.height);
                            ctx.clip();
                        });
                        layer.on('postcompose', function(evt) {
                            evt.context.restore();
                        })
                    }
                });
                Core.panelEnabled('compositions', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
