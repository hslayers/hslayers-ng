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

        var species ={
            '"DB"@cs':	'dub letní, dub zimní, dub slavonský, dub pýřitý, dub bahenní, dub cer, ostatní duby',  
            '"SM"@cs':	'smrk ztepilý',  
            '"SMX"@cs':	'smrk pichlavý, smrk černý, smrk sivý, smrk omorika, smrk Engelmannův, ostatní smrky',  
            '"JD"@cs':	'jedle bělokorá',  
            '"JDO"@cs':	'jedle obrovská',  
            '"BO"@cs':	'borovice lesní, borovice černá, borovice banksovka, borovice vejmutovka, borovice limba, borovice pokroucená, borovice ostatní',  
            '"KOS"@cs':	'kosodřevina, borovice blatka',  
            '"MD"@cs':	'modřín evropský, ostatní modříny',  
            '"DG"@cs':	'douglaska tisolistá',  
            '"JX"@cs':	'ostatní jehličnany',  
            '"DBC"@cs':	'dub červený',  
            '"BK"@cs':	'buk lesní',  
            '"HB"@cs':	'habr obecný',  
            '"JS"@cs':	'jasan ztepilý, jasan americký, jasan úzkolistý',  
            '"J_SUM"@cs':	'Jehličnany – všechny druhy jehličnatých dřevin.',  
            '"L_SUM"@cs':	'Listnáče – všechny druhy listnatých dřevin.',  
            '"všechny kategorie"@cs':	'Výstup není tříděn dle atributových domén.',  
        }
        var specie_lyrs=[];
        angular.forEach(species, function(value, key){
            specie_lyrs.push(new ol.layer.Vector({
                title: value,
                source: new SparqlJsonForestry({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://nil.uhul.cz/lod/species_area/species_area.rdf> FROM <http://nil.uhul.cz/lod/geo/nuts/nuts.rdf> WHERE {{ ?o a <http://nil.uhul.cz/lod/nfi#species_area>. ?o ?p ?s. ?o <http://nil.uhul.cz/lod/nfi#adomain> '+key+'. ?o <http://www.opengis.net/ont/geosparql#hasGeometry> ?nut. FILTER(?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>)} UNION { ?o ?p ?nut. ?nut <http://www.opengis.net/ont/geosparql#asWKT> ?s. ?o <http://nil.uhul.cz/lod/nfi#adomain> '+key+'. FILTER(?p = <http://www.opengis.net/ont/geosparql#hasGeometry> && ?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>) } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                type: 'vector',
                style: style,
                visible: true,
                path: 'Species area'
            }));
        });
        
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
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://nil.uhul.cz/lod/forest_cover/forest_cover.rdf> FROM <http://nil.uhul.cz/lod/geo/nuts/nuts.rdf> WHERE {{ ?o a <http://nil.uhul.cz/lod/nfi#forest_cover>. ?o ?p ?s. ?o <http://www.opengis.net/ont/geosparql#hasGeometry> ?nut. FILTER(?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>)} UNION { ?o ?p ?nut. ?nut <http://www.opengis.net/ont/geosparql#asWKT> ?s. FILTER(?p = <http://www.opengis.net/ont/geosparql#hasGeometry> && ?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>) } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                type: 'vector',
                style: style,
                visible: true,
            }), new ol.layer.Vector({
                title: 'Average growing stock per hectare',
                source: new SparqlJsonForestry({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://nil.uhul.cz/lod/average_growing_stock_per_hectare/average_growing_stock_per_hectare.rdf> FROM <http://nil.uhul.cz/lod/geo/nuts/nuts.rdf> WHERE {{ ?o a <http://nil.uhul.cz/lod/nfi#average_growing_stock_per_hectare>. ?o ?p ?s. ?o <http://www.opengis.net/ont/geosparql#hasGeometry> ?nut. FILTER(?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>)} UNION { ?o ?p ?nut. ?nut <http://www.opengis.net/ont/geosparql#asWKT> ?s. FILTER(?p = <http://www.opengis.net/ont/geosparql#hasGeometry> && ?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>) } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                type: 'vector',
                style: style,
                visible: true,
            }), new ol.layer.Vector({
                title: 'Total forest area',
                source: new SparqlJsonForestry({
                    url: 'http://ha.isaf2014.info:8890/sparql?default-graph-uri=&query=' + encodeURIComponent('SELECT ?o ?p ?s FROM <http://nil.uhul.cz/lod/total_forest_area/total_forest_area.rdf> FROM <http://nil.uhul.cz/lod/geo/nuts/nuts.rdf> WHERE {{ ?o a <http://nil.uhul.cz/lod/nfi#total_forest_area>. ?o ?p ?s. ?o <http://www.opengis.net/ont/geosparql#hasGeometry> ?nut. FILTER(?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>)} UNION { ?o ?p ?nut. ?nut <http://www.opengis.net/ont/geosparql#asWKT> ?s. FILTER(?p = <http://www.opengis.net/ont/geosparql#hasGeometry> && ?nut != <http://nil.uhul.cz/lod/geo/nuts#CZ0>) } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on',
                    category_field: 'http://gis.zcu.cz/poi#category_osm',
                    projection: 'EPSG:3857'
                }),
                type: 'vector',
                style: style,
                visible: true,
            })].concat(specie_lyrs)
        })]);
        
        

        module.value('default_layers', []);


        module.value('default_view', new ol.View({
            center: [1490321.6967438285, 6400602.013496143], //Latitude longitude    to Spherical Mercator
            zoom: 8,
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
