'use strict';

define(['ol', 'dc', 'toolbar', 'layermanager', 'SparqlJson', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'feature-crossfilter', 'legend', 'panoramio'],

    function(ol, dc, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.legend',
            'hs.feature_crossfilter', 'hs.panoramio'
        ]);

        module.directive('hs', ['Core', function(Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                }
            };
        }]);

        module.value('box_layers', []);

        var style = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://gis.zcu.cz/poi#category_osm');
                if (typeof s === 'undefined') return;
                s = s.split(".")[1];
                return [new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({
                                color: feature.color ? feature.color : [242, 121, 0, 0.7]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [0x33, 0x33, 0x33, 0.9]
                            }),
                            radius: 3
                        }),
                        fill: new ol.style.Fill({
                            color: "rgba(139, 189, 214, 0.3)",
                        }),
                        stroke: new ol.style.Stroke({
                            color: "rgba(139, 189, 214, 0.7)",
                        })
                    }),
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'symbols/' + s + '.svg',
                            crossOrigin: 'anonymous'
                        })
                    })

                ]
            } else {
                return [];
            }
        }

        var route_style = function(feature, resolution) {
            return [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(242, 78, 60, 0.9)",
                    width: 2
                })
            })]
        }

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            }),
            new ol.layer.Vector({
                title: "Points of interest",
                maxResolution: 70,
                source: new SparqlJson({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=SELECT+%3Fo+%3Fp+%3Fs%0D%0AFROM+<http%3A%2F%2Fgis.zcu.cz%2Fpoi.rdf>%0D%0AWHERE+%0D%0A%09%7B%3Fo+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23lat>+%3Flat.+%3Fo+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23long>+%3Flon.+%0D%0A%09+<extent>%0D%0A%09%3Fo+%3Fp+%3Fs+%0D%0A%09%7D%0D%0AORDER+BY+%3Fo&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                style: style
            }),
            new ol.layer.Vector({
                title: "Cycling routes Plzen",
                source: new ol.source.GeoJSON({
                    url: 'plzensky_kraj.geojson'
                }),
                style: route_style
            }),
            new ol.layer.Vector({
                title: "Cycling routes Zemgale",
                source: new ol.source.GeoJSON({
                    url: 'zemgale.geojson'
                }),
                style: route_style
            }),
            new ol.layer.Vector({
                title: "Tour de LatEst",
                source: new ol.source.GeoJSON({
                    url: 'teourdelatest.geojson'
                }),
                style: route_style
            }),
            new ol.layer.Image({
                title: "Forest roads",
                source: new ol.source.ImageWMS({
                    url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/ovnis/sdi4aps_forest_roads.map',
                    params: {
                        LAYERS: 'forest_roads,haul_roads',
                        INFO_FORMAT: "application/vnd.ogc.gml",
                        FORMAT: "image/png; mode=8bit"
                    },
                    crossOrigin: null
                })
            })
        ]);

        module.value('crossfilterable_layers', [{
            layer_ix: 1,
            attributes: ["http://gis.zcu.cz/poi#category_osm"]
        }]);


        module.value('default_view', new ol.View({
            center: [1761463.994365168, 6483806.731580181], //Latitude longitude    to Spherical Mercator
            zoom: 14,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'InfoPanelService', 'feature_crossfilter',
            function($scope, Core, InfoPanelService, feature_crossfilter) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
