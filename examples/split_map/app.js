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
               
                $scope.split_moved = function(x, y){
                    $scope.split_x = x;
                    $scope.split_y = y;
                    hsmap.map.render();
                }
                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Sidebar') {
                        var slider_button = angular.element('<span class="glyphicon glyphicon-move" hs.draggable iswindow="false" hs-draggable-onmove="split_moved" style="z-index: 10001; font-size:1.5em; position:absolute; left:'+($scope.split_x-10)+'px; top:'+($scope.split_y-10)+'px" aria-hidden="true"></span>');
                        
                        angular.element('#map').append(slider_button);
                        $compile(slider_button)($scope);
                    }
                    if(args=='Map'){
                        $scope.split_x = hsmap.map.getSize()[0]/2;
                        $scope.split_y =  hsmap.map.getSize()[1]/2;
                    }
                });
                $scope.$on('layermanager.updated', function(data, layer){
                    if(layer.get('base') != true && layer.get('always_visible') != true){
                        if(layer.get('title')=='Intenzita dopravy v Plzni - normální stav - podzim'){
                            layer.set('split_group', 1);
                            layer.setVisible(true);
                        }
                        else
                            layer.set('split_group', 2);
                        layer.on('precompose', function(evt){
                            var ctx = evt.context;
                            ctx.save();
                            ctx.beginPath();
                            if(evt.currentTarget.get('split_group')==1){
                                ctx.rect(0, 0, $scope.split_x, $scope.split_y);
                                
                            } else {
                                ctx.moveTo($scope.split_x, 0);
                                ctx.lineTo(ctx.canvas.width, 0);
                                ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
                                ctx.lineTo(0, ctx.canvas.height);
                                ctx.lineTo(0, $scope.split_y);
                                ctx.lineTo($scope.split_x, $scope.split_y);
                                ctx.closePath();
                            }
                            ctx.strokeStyle = 'red';
                            ctx.stroke();
                            ctx.clip();
                        });
                        layer.on('postcompose', function(evt){
                            evt.context.restore();
                        })
                    }
                });
                $scope.$on('layermanager.layer_time_changed', function(evt, layer, d){
                    angular.forEach(hsmap.map.getLayers(), function(other_layer){
                        if(other_layer.getSource().updateParams)
                            other_layer.getSource().updateParams({
                                'TIME': d
                            });                    
                    })
                })
                
                composition_parser.load('http://opentransportnet.eu/wwwlibs/statusmanager2/index.php?request=load&id=b8b5a347-4637-44d0-ae67-da17c5b047d3');
                Core.panelEnabled('compositions', true);
               
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
