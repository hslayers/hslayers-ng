'use strict';

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'SparqlJson', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap', 'translations', 'compositions', 'status_creator', 'ows'],

    function(angular, ol, sidebar, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
            'hs.legend', 'hs.geolocation', 'hs.core',
            'hs.api',
            'hs.ows',
            'gettext',
            'hs.sidebar'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);
        
         var style = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://www.sdi4apps.eu/poi/#mainCategory');

                if (typeof s === 'undefined') return;
                s = s.split("#")[1];
                return [
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: 'hslayers-ng/examples/geosparql/symbolsWaze/' + s + '.png',
                            crossOrigin: 'anonymous',
                            scale: 0.6
                        })
                    })

                ]
            } else {
                return [];
            }
        }

        var styleOSM = function(feature, resolution) {
            if (typeof feature.get('visible') === 'undefined' || feature.get('visible') == true) {
                var s = feature.get('http://www.sdi4apps.eu/poi/#mainCategory');
                if (typeof s === 'undefined') return;
                s = s.split("#")[1];
                return [
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: 'hslayers-ng/examples/geosparql/symbols/' + s + '.png',
                            crossOrigin: 'anonymous',
                            scale: 0.6
                        })
                    })
                ]
            } else {
                return [];
            }
        }
       
        var mercatorProjection = ol.proj.get('EPSG:900913');

        module.value('config', {
            default_layers: [new ol.layer.Tile({
                    source: new ol.source.OSM({
                        wrapX: false
                    }),
                    title: "Base layer",
                    base: true
                })],
            //project_name: 'hslayers',
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 5,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.service_infopanel', 'hs.compositions.service_parser', '$timeout', 'hs.map.service', '$http', 'config', '$rootScope', 'hs.utils.service',
            function($scope, Core, InfoPanelService, composition_parser, $timeout, hsMap, $http, config, $rootScope, utils ) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarExpanded = false;
                var map;
                
                $rootScope.$on('map.loaded', function(){
                    map = hsMap.map;
                    map.on('moveend', extentChanged);
                });

                var spoi_source =  new ol.source.Vector();
            
                function createPoiLayers() {
                    
                     var new_lyr = new ol.layer.Vector({
                        title: "Land use parcels",
                        source: spoi_source,
                        visible: true,
                        maxResolution: 2.48657133911758
                    });
                     
                    config.default_layers.push(new_lyr);
                }
                
                createPoiLayers();
             
                function extentChanged(){
                    console.log('Resolution', map.getView().getResolution());
                    if(map.getView().getResolution() > 2.48657133911758) return;
                    var format = new ol.format.WKT();
                    var bbox = map.getView().calculateExtent(map.getSize());
                    var ext = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326')
                    var extents = ext[0] + ' ' + ext[1] + ', ' +ext[2] + ' ' + ext[3];
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/> PREFIX virtrdf:	<http://www.openlinksw.com/schemas/virtrdf#> PREFIX poi: <http://www.openvoc.eu/poi#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT ?o ?use ?wkt FROM <http://w3id.org/foodie/olu#> WHERE {?o geo:hasGeometry ?geometry. ?geometry geo:asWKT ?wkt. FILTER(bif:st_intersects(bif:st_geomfromtext("BOX(' + extents + ')"), ?wkt)). ?o <http://w3id.org/foodie/olu#specificLandUse> ?use.} ORDER BY ?o') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    
                    spoi_source.set('loaded', false);
                    $.ajax({
                        url: utils.proxify(q)
                    })
                    .done(function(response) {
                            if(angular.isUndefined(response.results)) return;
                            var features = [];
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                var b = response.results.bindings[i];
                                var g_feature = format.readFeature(b.wkt.value.toUpperCase());
                                var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', hsMap.map.getView().getProjection());
                                var feature = new ol.Feature({geometry: geom_transformed, parcel: b.o.value, use: b.use.value});
                                features.push(feature);
                            }
                        spoi_source.clear();
                        spoi_source.addFeatures(features);
                        spoi_source.set('loaded', true);
                    })

                }
                
                $scope.$on('infopanel.updated', function(event) {
                    if (console) console.log('Attributes', InfoPanelService.attributes, 'Groups', InfoPanelService.groups);
                });
            }
        ]);

        return module;
    });
