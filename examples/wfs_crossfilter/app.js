'use strict';

define(['ol', 'dc', 'toolbar', 'layermanager', 'SparqlJson', 'WfsSource', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'bootstrap', 'feature-crossfilter'],

    function(ol, dc, toolbar, layermanager, SparqlJson, WfsSource) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.feature_crossfilter'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                }
            };
        }]);

        var style = new ol.style.Style({
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
                color: "rgba(139, 189, 214, 0.3)",
            }),
            stroke: new ol.style.Stroke({
                color: '#112211',
                width: 1
            })
        });

        var style_sparql = function(feature, resolution) {
            return [new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: feature.color ? feature.color : [242, 121, 0, 0.7]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0x33, 0x33, 0x33, 0.9]
                    }),
                    radius: 5
                }),
                fill: new ol.style.Fill({
                    color: "rgba(139, 189, 214, 0.3)",
                }),
                stroke: new ol.style.Stroke({
                    color: '#112211',
                    width: 1
                })
            })]
        };

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    base: true
                }),
                new ol.layer.Vector({
                    title: "Points of interest",
                    maxResolution: 155,
                    source: new SparqlJson({
                        url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=SELECT+%3Fo+%3Fp+%3Fs%0D%0AFROM+<http%3A%2F%2Fgis.zcu.cz%2Fpoi.rdf>%0D%0AWHERE+%0D%0A%09%7B%3Fo+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23lat>+%3Flat.+%3Fo+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23long>+%3Flon.+%0D%0A%09+<extent>%0D%0A%09%3Fo+%3Fp+%3Fs+%0D%0A%09%7D%0D%0AORDER+BY+%3Fo&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                        category_field: 'http://gis.zcu.cz/poi#category',
                        projection: 'EPSG:3857'
                    }),
                    style: style_sparql
                })
            ],
            crossfilterable_layers: [{
                layer_ix: 1,
                attributes: ["http://gis.zcu.cz/poi#category_osm"]
            }],
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.map.service', 'hs.feature_crossfilter.service',
            function($scope, Core, OlMap, feature_crossfilter) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
            }
        ]);

        return module;
    });
