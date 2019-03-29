'use strict';

define(['ol',
        'sidebar',
        //'toolbar',
        'layermanager',
        'query',
        'search',
        'print',
        'permalink',
        'measure',
        'bootstrap.bundle',
        'geolocation',
        'api',
        'drag',
        'compositions'
    ],
    function(ol, toolbar) {
        var module = angular.module('hs', [
            //'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.print',
            'hs.permalink',
            'hs.geolocation',
            'hs.api',
            'hs.sidebar',
            'hs.drag',
            'hs.compositions'
        ]);

        module.directive(
            'hs', ['config', 'Core',
                function(config, Core) {
                    return {
                        templateUrl: config.hsl_path + 'hslayers.html',
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

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', 'hs.compositions.service_parser', '$timeout',
            function($scope, Core, $compile, hsmap, composition_parser, $timeout) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.split_moved = function(x, y) {
                    $scope.split_x = x;
                    $scope.split_y = y;
                    hsmap.map.render();
                }
                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Map') {

                        $scope.split_x = hsmap.map.getSize()[0] / 2;
                        $scope.split_y = hsmap.map.getSize()[1] / 2;
                        if ($scope.split_x == 0) $scope.split_x = 400;
                        if ($scope.split_y == 0) $scope.split_y = 250;


                        var slider_button = angular.element('<span class="icon-move" hs.draggable iswindow="false" hs-draggable-onmove="split_moved" style="z-index: 10001; font-size:1.5em; position:absolute; left:' + ($scope.split_x - 10) + 'px; top:' + ($scope.split_y - 10) + 'px" aria-hidden="true"></span>');

                        angular.element('#map').append(slider_button);
                        $compile(slider_button)($scope);


                        composition_parser.load('http://opentransportnet.eu/wwwlibs/statusmanager2/index.php?request=load&id=e61924a6-aaf7-4c47-8556-3a96c4b80413', undefined, undefined, function(response) {
                            angular.forEach(response.data.layers, function(layer) {
                                if (angular.isDefined(layer.dimensions.time.default)) {
                                    layer.dimensions.time.default = '2016-12-05T08:00:00';
                                }
                                if (layer.title == 'Intenzita dopravy v Plzni - normální stav - zima') {
                                    layer.path = 'Bez dopravních omezení (base)';
                                } else if (layer.title.indexOf('Intenzita') > -1) {
                                    layer.path = 'S dopravním omezením (other)';
                                }
                            })
                            return response;
                        });
                    }
                });
                $scope.$on('layermanager.updated', function(data, layer) {
                    if (layer.get('base') != true && layer.get('always_visible') != true) {
                        if (layer.get('title') == 'Intenzita dopravy v Plzni - normální stav - zima') {
                            layer.set('split_group', 2);
                            layer.setVisible(true);
                        } else if (layer.get('title').indexOf('Intenzita') > -1) {
                            layer.set('split_group', 1);
                            layer.set('exclusive', true);
                        }
                        layer.on('precompose', function(evt) {
                            var ctx = evt.context;
                            ctx.save();
                            var dpi = window.devicePixelRatio;
                            if (evt.target.get('split_group') == 1) {
                                ctx.save();
                                ctx.beginPath();
                                ctx.rect(0, 0, $scope.split_x * dpi, 20 * dpi);
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                                ctx.fill();
                                ctx.restore();
                                ctx.save();
                                ctx.beginPath();
                                ctx.moveTo($scope.split_x * dpi, 0 * dpi);
                                ctx.lineTo($scope.split_x * dpi, 20 * dpi);
                                ctx.strokeStyle = 'red';
                                ctx.stroke();
                                ctx.restore();
                            }
                            if (evt.target.get('split_group') == 2) {
                                ctx.save();
                                ctx.beginPath();
                                ctx.rect($scope.split_x * dpi, 0 * dpi, ctx.canvas.width * dpi - $scope.split_x * dpi, 20 * dpi);
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                                ctx.fill();
                                ctx.restore();
                                ctx.save();
                                ctx.beginPath();
                                ctx.moveTo($scope.split_x * dpi, 0 * dpi);
                                ctx.lineTo($scope.split_x * dpi, 20 * dpi);
                                ctx.strokeStyle = 'red';
                                ctx.stroke();
                                ctx.restore();
                            }
                            ctx.beginPath();
                            var title = evt.target.get('title');
                            //Set clip rectangle and draw red outline for splitter
                            if (evt.target.get('split_group') == 1) {
                                ctx.rect(0 * dpi, 20 * dpi, $scope.split_x * dpi, $scope.split_y * dpi - 20 * dpi);
                                ctx.font = '14pt Calibri';
                                ctx.fillText(title, ($scope.split_x - ctx.measureText(title).width - 5) * dpi, 15 * dpi);
                            } else if (evt.target.get('split_group') == 2) {
                                ctx.moveTo($scope.split_x * dpi, 20 * dpi);
                                ctx.lineTo(ctx.canvas.width * dpi, 20 * dpi);
                                ctx.lineTo(ctx.canvas.width * dpi, ctx.canvas.height * dpi);
                                ctx.lineTo(0 * dpi, ctx.canvas.height * dpi);
                                ctx.lineTo(0 * dpi, $scope.split_y * dpi);
                                ctx.lineTo($scope.split_x * dpi, $scope.split_y * dpi);
                                ctx.closePath();
                                ctx.font = '14pt Calibri';
                                ctx.fillText(title, ($scope.split_x + 5) * dpi, 15 * dpi);
                            } else {
                                ctx.rect(0, 0, ctx.canvas.width * dpi, ctx.canvas.height * dpi);
                            }
                            ctx.strokeStyle = 'red';
                            ctx.stroke();
                            ctx.clip();
                        });
                        layer.on('postcompose', function(evt) {
                            evt.context.restore();
                        })
                    }
                    if (layer.get('base') == true) {
                        //Grayscale map
                        layer.on('postcompose', function(event) {
                            var context = event.context;
                            var canvas = context.canvas;
                            var image = context.getImageData(0, 0, canvas.width, canvas.height);
                            var data = image.data;
                            for (var i = 0, ii = data.length; i < ii; i += 4) {
                                data[i] = data[i + 1] = data[i + 2] = (3 * data[i] + 4 * data[i + 1] + data[i + 2]) / 8;
                            }
                            context.putImageData(image, 0, 0);
                        });
                    }
                });
                $scope.$on('layermanager.layer_time_changed', function(evt, layer, d) {
                    angular.forEach(hsmap.map.getLayers(), function(other_layer) {
                        if (other_layer.getSource().updateParams)
                            other_layer.getSource().updateParams({
                                'TIME': d
                            });
                    })
                })

                Core.panelEnabled('compositions', false);
                Core.panelEnabled('status_creator', false);
                Core.panelEnabled('permalink', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
