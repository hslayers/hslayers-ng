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
        'draw',
        'drag',
        'compositions'
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
            'hs.compositions'
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

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', 'hs.compositions.service_parser',
            function($scope, Core, $compile, hsmap, composition_parser) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.split_x = 0;
                $scope.split_y = 0;
                $scope.split_moved = function(x, y){
                    $scope.split_x = x;
                    $scope.split_y = y;
                    hsmap.map.render();
                }
                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Sidebar') {
                        var slider_button = angular.element('<span class="glyphicon glyphicon-move" hs.draggable iswindow="false" hs-draggable-onmove="split_moved" style="z-index: 10001; font-size:1.5em; position:absolute; left:0px; top:0px" aria-hidden="true"></span>');
                        
                        angular.element('#map').append(slider_button);
                        $compile(slider_button)($scope);
                    }
                });
                $scope.$on('layermanager.updated', function(data, layer){
                    if(layer.get('base') != true && layer.get('always_visible') != true){
                        layer.on('precompose', function(evt){
                            var ctx = evt.context;
                            var width = $scope.split_x;
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(0, 0, width, ctx.canvas.height);
                            ctx.clip();
                        });
                        layer.on('postcompose', function(evt){
                            evt.context.restore();
                        })
                    }
                });
                composition_parser.load('http://opentransportnet.eu/wwwlibs/statusmanager2/index.php?request=load&id=b8b5a347-4637-44d0-ae67-da17c5b047d3');
                Core.panelEnabled('compositions', true);
               
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
