'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'SparqlJson', 'core', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'legend', 'angular-gettext', 'translations'],

    function(angular, ol, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.core',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.legend',
            'gettext'
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
                source: new SparqlJson({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=SELECT+%3Fo+%3Fp+%3Fs%0D%0AFROM+<http%3A%2F%2Fgis.zcu.cz%2Fpoi.rdf>%0D%0AWHERE+%0D%0A%09%7B%3Fo+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23lat>+%3Flat.+%3Fo+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23long>+%3Flon.+%0D%0A%09+<extent>%0D%0A%09%3Fo+%3Fp+%3Fs+%0D%0A%09%7D%0D%0AORDER+BY+%3Fo&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                style: style
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 14,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'InfoPanelService',
            function($scope, Core, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
