'use strict';

define(['ol',
        'layermanager',
        'sidebar',
        'poly2tri',
        'toolbar',
        'permalink',
        'search',
        'api',
        'glutils', 'WGL', 'wglinit', 'mapConf', 'manager', 'mapcontroller', 'dataloader', 'd3', 'dimension',
        'heatmapdimension', 'heatmaprenderer', 'heatmaplegend', 'maxcalculator', 'chart_panel', 'stackedbarchart', 'histogramdimension', 'mapdimension', 'floatreaderhistogram',
        'floatrasterreader', 'linearfilter', 'filter', 'bootstrap', 'multibrush', 'extentfilter', 'mappolyfilter', 'mapcolorfilter', 'parallelcoordinates'
    ],

    function(ol, layermanager, sidebar, poly2tri) {
        window.poly2tri = poly2tri; //shim export didn't work for some reason.
        var module = angular.module('hs', [
            'hs.sidebar',
            'hs.toolbar',
            'hs.layermanager',
            'hs.permalink',
            'hs.search',
            'hs.widgets.chart_panel'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', 'webgl_viz', function(OlMap, Core, $compile, webgl_viz) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                    $(".panelspace", element).append($compile('<div chartpanel ng-controller="ChartPanel"></div>')(scope));
                    $(".panelspace-wrapper").hide();
                    webgl_viz.init();
                }
            };
        }]);

        module.service('webgl_viz', ['hs.map.service', function(OlMap) {
            OlMap.map.removeInteraction(OlMap.interactions.DragPan);
            OlMap.interactions.DragPan = new ol.interaction.DragPan({
                kinetic: false
            });
            OlMap.map.addInteraction(OlMap.interactions.DragPan);

            var me = {
                map: OlMap.map,
                ol: ol,
                init: function() {
                    wglinit(this);
                }
            };

            return me;
        }]);

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'http://{a-z}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                        attributions: [new ol.Attribution({
                            html: ['&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>']
                        })]
                    }),
                    title: 'BaseMap'
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([-1.9, 52.5], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 11,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.map.service', 'webgl_viz',
            function($scope, Core, OlMap, webgl_viz) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarButtons = false;
                Core.sidebarRight = false;
                var map = OlMap.map;
                $scope.$on('infopanel.updated', function(event) {});


            }
        ]);

        return module;
    });
