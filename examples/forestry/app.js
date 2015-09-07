'use strict';

define(['ol', 'dc', 'toolbar', 'layermanager', 'SparqlJsonForestry', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'legend', 'bootstrap', 'bootstrap', 'api'],

    function(ol, dc, toolbar, layermanager, SparqlJsonForestry) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.legend',
            'hs.api'
        ]);

        module.directive('hs', ['Core', function(Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element, 'right');
                }
            };
        }]);

        var style = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                return [new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: feature.color ? feature.color : [242, 121, 0, 0.7],
                    }),
                    stroke: new ol.style.Stroke({
                        color: "rgba(139, 189, 214, 0.7)",
                    })
                })]
            } else {
                return [];
            }
        }



        module.value('box_layers', [new ol.layer.Group({
            title: '',
            layers: [new ol.layer.Tile({
                source: new ol.source.OSM({
                    wrapX: false
                }),
                title: "Base layer",
                base: true
            }), new ol.layer.Vector({
                title: 'Forest cover',
                source: new SparqlJsonForestry({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT * FROM <http://nil.uhul.cz/lod/forest_cover/forest_cover.rdf> FROM <http://nil.uhul.cz/lod/geo/nuts/nuts.rdf>WHERE {?o <http://www.w3.org/1999/02/22-rdf-syntax-ns#value> ?value.?o <http://www.opengis.net/ont/geosparql#hasGeometry> ?nut.?nut <http://www.opengis.net/ont/geosparql#asWKT> ?geom}') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                type: 'vector',
                style: style,
                visible: true,
            })]
        })]);

        module.value('default_layers', []);


        module.value('default_view', new ol.View({
            center: [1490321.6967438285, 6400602.013496143], //Latitude longitude    to Spherical Mercator
            zoom: 14,
            units: "m"
        }));

        module.controller('Main', ['$scope', '$filter', 'Core', 'hs.map.service', 'hs.query.service_infopanel',
            function($scope, $filter, Core, OlMap, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
            }
        ]);

        return module;
    });
