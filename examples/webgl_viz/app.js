'use strict';

define(['ol',
        'toolbar',
        'layermanager',
        'WfsSource', 'query',
        'search',
        'print',
        'permalink',
        'measure',
        'geolocation',
        'api',
        'glutils', 'WGL', 'wglinit', 'manager', 'mapcontroller', 'dataloader', 'd3', 'dimension',
        'heatmapdimension', 'chart_panel', 'stackedbarchart', 'histogramdimension', 'mapdimension', 'floatreaderhistogram',
        'floatrasterreader', 'linearfilter', 'filter', 'bootstrap', 'multibrush'
    ],

    function(ol, toolbar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation', 'hs.widgets.chart_panel'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', 'webgl_viz', function(OlMap, Core, $compile, webgl_viz) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element, 'right');
                    $("#right-pane", element).append($compile('<div chartpanel ng-controller="ChartPanel"></div>')(scope));
                    $("#right-pane", element).css({
                        'width': '560px',
                        'padding-top': "40px",
                        'padding-left': '33px'
                    });
                    $(".search-container").removeClass('col-md-4').addClass('col-md-3');
                    //webgl_viz.webgl_el = $compile('<canvas id="webglayer"></canvas>')(scope);
                    //element.append(webgl_viz.webgl_el);
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
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    box_id: 'osm',
                    base: true
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.map.service', 'webgl_viz',
            function($scope, Core, OlMap, webgl_viz) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                var map = OlMap.map;
                $scope.$on('infopanel.updated', function(event) {});


            }
        ]);

        return module;
    });
