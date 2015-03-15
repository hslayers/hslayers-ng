'use strict';

define(['angular', 'ol','dc','toolbar', 'layermanager', 'SparqlJson', 'WfsSource', 'core', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'angular-gettext','translations'],

    function(angular, ol, dc, toolbar, layermanager, SparqlJson, WfsSource) {
        var module = angular.module('hs', [
            'hs.core',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'gettext'
        ]);

        module.directive('hs', ['OlMap', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                }
            };
        }]);

        module.service('feature_crossfilter',[function(){
            return {
                makeCrossfilterDimensions : function(source, attributes){
                    var facts = crossfilter(source.getFeatures());
                    var tmp = [];
                    for (var attr_i in attributes) {
                        var attr = attributes[attr_i];    
                        var total = facts.dimension( function(feature) { 
                            return feature.get(attr)
                        });
                        var groupsByTotal = total.group().reduceCount( function(feature) { 
                            return feature.get(attr); 
                        });
                        tmp.push(groupsByTotal);
                    }
                    debugger;
                    return tmp;
                    console.log('test');
                    // caur konsoli: var a = angular.element('*[ng-app]').injector().get('hsService');
                }
            };
        }]);

        module.value('box_layers', []);

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
        }

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            }),
            new ol.layer.Vector({
                title: "Accidents",
                source: new WfsSource({
                    url: 'http://otn.bnhelp.cz/cgi-bin/mapserv?map=/data/www/otn.bnhelp.cz/maps/accidents_west_midlands.map',
                    typename: 'wm_accidents',
                    projection: 'EPSG:3857'
                }),
                style: style
            }),
            new ol.layer.Vector({
                title: "Points of interest",
                source: new SparqlJson({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=SELECT+*+FROM+%3Chttp%3A%2F%2Fgis.zcu.cz%2Fpoi.rdf%3E+WHERE+%7B%3Fo+%3Fp+%3Fs%7D%0D%0AORDER+BY+%3Fo&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category',
                    projection: 'EPSG:3857'
                }),
                style: style_sparql
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'InfoPanelService', 'OlMap', 'feature_crossfilter',
            function($scope, Core, InfoPanelService, OlMap, feature_crossfilter) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                setTimeout(function(){
                    feature_crossfilter.makeCrossfilterDimensions(OlMap.map.getLayers().item(2).getSource(), ["http://gis.zcu.cz/poi#category_os"]);
                }, 4000);
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
