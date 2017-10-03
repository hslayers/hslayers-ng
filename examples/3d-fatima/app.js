'use strict';

define(['ol', 'toolbar', 'layermanager', 'geojson', 'sidebar', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'datasource_selector', 'cesiumjs', 'bootstrap'],

    function(ol, toolbar, layermanager, geojson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.permalink',
            'hs.datasource_selector',
            'hs.geolocation',
            'hs.cesium',
            'hs.sidebar',
            'hs.ows'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function(OlMap, Core, $compile, $timeout) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    angular.element('.page-content', element).append($compile('<div hs.cesium.directive ng-controller="hs.cesium.controller"></div>')(scope));
                    $timeout(function(){Core.fullScreenMap(element)}, 0);
                }
            };
        }]);
        
        module.directive('hs.aboutproject', function() {
            function link(scope,element,attrs) {
                setTimeout(function(){
                    //$('#about-dialog').modal('show');
                }, 1500);
            }           
            return {
                templateUrl: './about.html?bust=' + gitsha,
                link: link
            };
        });

        function getHostname() {
            var url = window.location.href
            var urlArr = url.split("/");
            var domain = urlArr[2];
            return urlArr[0] + "//" + domain;
        };

        module.value('config', {
            terrain_provider: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
            terrain_providers: [{
                title: 'EU-DEM',
                url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
                active: true
            }],
            terrainExaggeration: 1,
            default_layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM(),
                            title: "Podkladová mapa OpenStreetMap",
                            base: true,
                            visible: true,
                            path: 'Podkladové mapy'
                        }),
                        new ol.layer.Tile({
                            title: "Mapa reliefu",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/dem.map',
                                params: {
                                    LAYERS: 'dem',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Podkladové mapy',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Skupiny půdních typů",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Fgeoportal.vumop.cz%2Fwms_vumop%2Fzchbpej.asp',
                                params: {
                                    LAYERS: 'pt',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Půdy/Zakladní charakteristiky BPEJ',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "BPEJ - aplikační pásma - aktuální",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'BPEJ_AP_NIT_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Eroze - odtokové linie",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'ODTOKLINIE_V2',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "OPVZ - nezávazné (aktualizace 2016)",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'OPVZ_2016_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "OPVZ - nezávazné (aktualizace 2016) - nádrže",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'OPVZ_2016_NADRZE_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Ortofotomapa - aktualizovaná - 2014 východ",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'ILPIS_RASTR_COLOR_AKT_VYCHOD',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Ortofotomapa - aktualizovaná - 2015 západ",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'ILPIS_RASTR_COLOR_AKT_ZAPAD',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Vrstva erozní ohroženosti - od 1.1.2016",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'EROZE_09_8',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Veřejná služba poskytující data MZE',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Podrobná mapa využití krajiny",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/openlandusemap.map',
                                params: {
                                    LAYERS: 'detailed_olu',
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Mapa využití krajiny',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Generalizovaná mapa využití krajiny",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/openlandusemap.map',
                                params: {
                                    LAYERS: 'generalized_olu',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Mapa využití krajiny',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "25m buffer okolo vodních toků",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/vodni_toky.map',
                                params: {
                                    LAYERS: 'vodni_toky_25_m',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Vodstvo',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Natura 2000 - evropsky významné lokality",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'NATURA_VYZ_LOK_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "NATURA - Evropsky významné lokality - popis",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'NATURA_VYZ_LOK_KOD_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Natura 2000 - ptačí oblasti",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'NATURA_PTACI_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "NATURA - Ptačí oblasti - popis",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'NATURA_PTACI_KOD_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Ochranná pásma NP",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'OCHRANNA_PASMA_NP_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "MCHÚ",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'HR_MCHU_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "VZCHÚ",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'HR_ZCHU_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "I.zóna VZCHÚ",
                            source: new ol.source.TileWMS({
                                url: 'http://ng.hslayers.org/cgi-bin/proxy4ows.cgi?OWSURL=http%3A%2F%2Feagri.cz%2Fpublic%2Fapp%2Fwms%2Fplpis.fcgi',
                                params: {
                                    LAYERS: 'HR_ZCHU1_WMS',
                                    FROMCRS: 'EPSG:4326',
                                    owsService: 'WMS',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Chráněná území',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "LPIS - zemědělské kultury",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/lpis.map',
                                params: {
                                    LAYERS: 'lpis_cultures',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'LPIS',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "LPIS - hranice",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/lpis.map',
                                params: {
                                    LAYERS: 'lpis_borders',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'LPIS',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Hranice parcel",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/parcely.map',
                                params: {
                                    LAYERS: 'landlots_borders',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Digitální katastr',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "Třída 5",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449, 47.7002729482326, 19.6178942648555, 51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/osm_road_network/road_network.map',
                            params: {
                                LAYERS: 'road_classes_czech_republic',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "Fifth-class roads",
                                functionalroadclass_int: '6'
                            },
                            crossOrigin: null
                            }),
                         path: 'Doprava/Síť z Otevřené Dopravní Mapy',
                         visible: false,
                         opacity: 1.0
                        }),
                        new ol.layer.Tile({
                        title: "Třída 4",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449, 47.7002729482326, 19.6178942648555, 51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/osm_road_network/road_network.map',
                            params: {
                                LAYERS: 'road_classes_czech_republic',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "Fourth-class roads",
                                functionalroadclass_int: '5'
                            },
                            crossOrigin: null
                            }),
                         path: 'Doprava/Síť z Otevřené Dopravní Mapy',
                         visible: false,
                         opacity: 1.0
                        }),
                        new ol.layer.Tile({
                        title: "Třída 3",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449, 47.7002729482326, 19.6178942648555, 51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/osm_road_network/road_network.map',
                            params: {
                                LAYERS: 'road_classes_czech_republic',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "Third-class roads",
                                functionalroadclass_int: '4'
                            },
                            crossOrigin: null
                            }),
                         path: 'Doprava/Síť z Otevřené Dopravní Mapy',
                         visible: false,
                         opacity: 1.0
                        }),
                        new ol.layer.Tile({
                        title: "Třída 2",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449, 47.7002729482326, 19.6178942648555, 51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/osm_road_network/road_network.map',
                            params: {
                                LAYERS: 'road_classes_czech_republic',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "Second-class roads",
                                functionalroadclass_int: '3'
                            },
                            crossOrigin: null
                            }),
                         path: 'Doprava/Síť z Otevřené Dopravní Mapy',
                         visible: false,
                         opacity: 1.0
                        }),
                        new ol.layer.Tile({
                        title: "Třída 1",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449, 47.7002729482326, 19.6178942648555, 51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/osm_road_network/road_network.map',
                            params: {
                                LAYERS: 'road_classes_czech_republic',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "First-class roads",
                                functionalroadclass_int: '2'
                            },
                            crossOrigin: null
                            }),
                         path: 'Doprava/Síť z Otevřené Dopravní Mapy',
                         visible: false,
                         opacity: 1.0
                        }),
                        new ol.layer.Tile({
                        title: "Hlavní silnice",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449, 47.7002729482326, 19.6178942648555, 51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/osm_road_network/road_network.map',
                            params: {
                                LAYERS: 'road_classes_czech_republic',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "Main roads",
                                functionalroadclass_int: '1'
                            },
                            crossOrigin: null
                            }),
                         path: 'Doprava/Síť z Otevřené Dopravní Mapy',
                         visible: false,
                         opacity: 1.0
                        }),
                        new ol.layer.Tile({
                        title: "03/11/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 03/11/15",
                                TIME: '2015-03-11'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "03/13/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 03/13/15",
                                TIME: '2015-03-13'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "03/18/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 03/18/15",
                                TIME: '2015-03-18'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "03/20/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 03/20/15",
                                TIME: '2015-03-20'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "03/25/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 03/25/15",
                                TIME: '2015-03-25'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "04/10/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 04/10/15",
                                TIME: '2015-04-10'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "04/12/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 04/12/15",
                                TIME: '2015-04-12'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "04/14/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 04/14/15",
                                TIME: '2015-04-14'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "04/19/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 04/19/15",
                                TIME: '2015-04-19'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "04/21/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 04/21/15",
                                TIME: '2015-04-21'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "07/01/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 07/01/15",
                                TIME: '2015-07-01'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "07/03/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 07/03/15",
                                TIME: '2015-07-03'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "07/08/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 07/08/15",
                                TIME: '2015-07-08'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }), 
                        new ol.layer.Tile({
                        title: "20/08/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/sentinel.map',
                            params: {
                                LAYERS: 'czech_republic_sentinel_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 20/08/15",
                                TIME: '2015-08-20'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),                        
                        new ol.layer.Tile({
                        title: "07/10/15",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/landsat.map',
                            params: {
                                LAYERS: 'czech_republic_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 07/10/15",
                                TIME: '2015-07-10'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "14/03/16",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/sentinel.map',
                            params: {
                                LAYERS: 'czech_republic_sentinel_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 14/03/16",
                                TIME: '2016-03-14'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "27/03/16",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/sentinel.map',
                            params: {
                                LAYERS: 'czech_republic_sentinel_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 27/03/16",
                                TIME: '2016-03-27'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                        new ol.layer.Tile({
                        title: "03/04/16",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/sentinel.map',
                            params: {
                                LAYERS: 'czech_republic_sentinel_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 03/04/16",
                                TIME: '2016-04-03'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }), 
                        new ol.layer.Tile({
                        title: "13/04/16",
                        BoundingBox : [{crs:"EPSG:4326", extent: [10.3634142752449,47.7002729482326,19.6178942648555,51.4135526097936]}],
                        source: new ol.source.TileWMS({
                            url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/foodie/sentinel.map',
                            params: {
                                LAYERS: 'czech_republic_sentinel_wmst',
                                INFO_FORMAT: undefined,
                                FORMAT: "image/png", 
                                ABSTRACT: "ndvi - 13/04/16",
                                TIME: '2016-04-13'
                            },
                            crossOrigin: null
                            }),
                         path: 'NDVI',
                         visible: false,
                         opacity: 0.5
                        }),
                     new ol.layer.Tile({
                            title: "Výnosový potenciál",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'kojcice_vynospot_5m_poly',
                                    //INFO_FORMAT: undefined,
                                    TRANSPARENT: true,
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Kojčice',
                            visible: false,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Aplikační pásma dle výnosového potenciálu",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'kojcice_vra_n1_pole_viper',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    TRANSPARENT: true,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Kojčice',
                            visible: false,
                            opacity: 0.3
                        }),
                        new ol.layer.Tile({
                            title: "Půdní typ",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'pudni_typy_verze3',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png",
                                    TRANSPARENT: true,
                                },
                                crossOrigin: null
                            }),
                            path: 'Kojčice',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "LPIS",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'lpis_zdkojcice',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    TRANSPARENT: true,
                                    FORMAT: "image/png"
                                },
                                crossOrigin: null
                            }),
                            path: 'Kojčice',
                            visible: false,
                            opacity: 0.5
                        }),
            ],
            project_name: 'erra/map',
            datasources: [
                {
                    title: "Datasets",
                    url: "http://otn-dev.intrasoft-intl.com/otnServices-1.0/platform/ckanservices/datasets",
                    language: 'eng',
                    type: "ckan",
                    download: true
                }, {
                    title: "Services",
                    url: "http://cat.ccss.cz/csw/",
                    language: 'eng',
                    type: "micka",
                    code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
                }, {
                    title: "Hub layers",
                    url: "http://opentnet.eu/php/metadata/csw/",
                    language: 'eng',
                    type: "micka",
                    code_list_url: 'http://opentnet.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
                }
            ],
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": getHostname()
                }
            },
            'catalogue_url': "/php/metadata/csw",
            'compositions_catalogue_url': "/php/metadata/csw",
            status_manager_url: '/wwwlibs/statusmanager2/index.php',
            default_view: new ol.View({
                center: [1699947, 6357735],
                zoom: 16,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config',
            function($scope, $compile, $element, Core, OlMap, config) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                
                Core.singleDatasources = true;
                Core.panelEnabled('compositions', false);
                Core.panelEnabled('print', false);
                Core.panelEnabled('status_creator', false);
                $scope.Core.setDefaultPanel('layermanager');
                 
                function createAboutDialog() {
                    var el = angular.element('<div hs.aboutproject></div>');
                    $("#hs-dialog-area").append(el);
                    $compile(el)($scope);
                }
                createAboutDialog();
                
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
