'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'core', 'map', 'query', 'search', 'print', 'permalink', 'lodexplorer', 'measure', 'geolocation'],

    function(angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.core',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.lodexplorer',
            'hs.geolocation'
        ]);

        module.directive('hs', ['OlMap', '$window', function(OlMap, $window) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    var w = angular.element($window);
                    w.bind('resize', function() {
                        element[0].style.height = w.height() + "px";
                        element[0].style.width = w.width() + "px";
                        $("#map").height(w.height());
                        $("#map").width(w.width());
                        OlMap.map.updateSize()
                    });
                    w.resize();
                }
            };
        }]);
        
        module.value('box_layers', []);

        var vectorSource = new ol.source.ServerVector({
                format: new ol.format.GeoJSON(),
                loader: function(extent, resolution, projection) {
                    var p = 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/nuts_2010_p_wfs.map&'+
                        'service=WFS&TYPENAME=nuts2&request=GetFeature&'+
                        'version=1.0.0&'+
                        'SRSNAME=EPSG:3857&outputFormat=geojson&'+
                        'bbox=' + extent.join(',') +',urn:ogc:def:crs:EPSG:6.3:3857';
                    var url =  "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" +window.escape(p);

                    $.ajax({
                        url: url
                    })
                    .done(function(response) {
                        vectorSource.addFeatures(vectorSource.readFeatures(response));
                    });
                },
                 strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
                    maxZoom: 19
                })),
                projection: 'EPSG:3857'
            });
        
            var vectorSource2 = new ol.source.ServerVector({
                format: new ol.format.GeoJSON(),
                loader: function(extent, resolution, projection) {
                    var p = 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/nuts_2010_p_wfs.map&'+
                        'service=WFS&TYPENAME=nuts&request=GetFeature&'+
                        'version=1.0.0&'+
                        'SRSNAME=EPSG:3857&outputFormat=geojson&'+
                        'bbox=' + extent.join(',') +',urn:ogc:def:crs:EPSG:6.3:3857';
                    var url =  "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" +window.escape(p);

                    $.ajax({
                        url: url
                    })
                    .done(function(response) {
                        vectorSource2.addFeatures(vectorSource2.readFeatures(response));
                    });
                },
                 strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
                    maxZoom: 19
                })),
                projection: 'EPSG:3857'
            });

        module.value('default_layers', [            
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            }),
            new ol.layer.Vector({
                title: "NUTS polys",
                source: vectorSource,
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: [242, 121, 0, 0.7]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0xbb, 0x33, 0x33, 0.7]
                        }),
                        radius: 5
                    }),
                    fill: new ol.style.Fill({
                        color: "#aabbcc",
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'green',
                        width: 2
                    })
                })
            }),
            new ol.layer.Vector({
                title: "NUTS points",
                source: vectorSource2,
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: [242, 121, 0, 0.7]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0xbb, 0x33, 0x33, 0.7]
                        }),
                        radius: 5
                    }),
                    fill: new ol.style.Fill({
                        color: "#aabbcc",
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'green',
                        width: 2
                    })
                })
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'InfoPanelService',
            function($scope, Core, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('infopanel.updated', function(event) {
                });
            }
        ]);

        return module;
    });