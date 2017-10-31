'use strict';
//hack - modules not loaded correctly with require
require(['tinycolor'], function(tinycolor) {
    window.tinycolor = tinycolor;
});
require(['clipboard'], function(clipboard) {
    window.Clipboard = clipboard;
  });

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'map', 'query', 'search', 'measure', 'permalink', 'core', 'api', 'compositions', 'ows','angular-gettext', 'bootstrap', 'translations', 'ngMaterial', 'mdColorPicker', 'ngclipboard', 'matCore','matSearch','mainToolbar', 'bottomToolbar', 'sidepanel', 'matAddLayer', 'matBasemap', 'matLayerManager', 'matShareMap', 'matMeasure', 'matQuery', 'matComposition', 'matStatusCreator'],

    function (angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.measure',
            'hs.core', 'hs.permalink',
            'hs.api',
            'hs.compositions',
            'hs.ows',
            'gettext',
            'hs.sidebar',
            'ngMaterial',
            'mdColorPicker',
            'ngclipboard',
            'hs.material.core',
            'hs.material.search',
            'hs.material.mainToolbar',
            'hs.material.bottomToolbar',
            'hs.material.sidepanel',
            'hs.material.addLayer',
            'hs.material.basemap',
            'hs.material.layerManager',
            'hs.material.shareMap',
            'hs.material.measure',
            'hs.material.query',
            'hs.material.composition',
            'hs.material.statusCreator'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$timeout', function (OlMap, Core, $timeout) {
            return {
                templateUrl: hsl_path + 'materialComponents/skeleton.html',
                link: function (scope, element) {
                    Core.init(element, {
                        innerElement: '#map-container'
                    });
                    
                    //Hack - flex map container was not initialized when map loaded 
                    var container = $('#map-container');
                    
                    if (container.height() === 0) {
                        containerCheck();
                    }
                    
                    function containerCheck(){
                        $timeout(function(){
                            if (container.height() != 0) scope.$emit("Core_sizeChanged");
                            else containerCheck();
                        },100);
                    }
                }
            };
        }]);

        var caturl = "/php/metadata/csw/index.php";

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        wrapX: false
                    }),
                    title: "Base layer",
                    base: true,
                    img: "http://holywatersf.com/images/contact/google-map.png"
                }),
                new ol.layer.Tile({
                    title: "OpenCycleMap",
                    visible: false,
                    base: true,
                    source: new ol.source.OSM({
                        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                    }),
                    img: "http://holywatersf.com/images/contact/google-map.png"
                }),
                new ol.layer.Tile({
                    title: "Satellite",
                    visible: false,
                    base: true,
                    source: new ol.source.XYZ({
                        url: 'http://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicmFpdGlzYmUiLCJhIjoiY2lrNzRtbGZnMDA2bXZya3Nsb2Z4ZGZ2MiJ9.g1T5zK-bukSbJsOypONL9g'
                    }),
                    img: "http://holywatersf.com/images/contact/google-map.png",
                    removeable: true
                }),
                new ol.layer.Vector({
                    title: "Sídla",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/sidla.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Horské kóty",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/koty.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Vodni plochy",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/plochy.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Vodni toky",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/toky.geojson'
                    }),
                    path: ""
                }),
                new ol.layer.Vector({
                    title: "Chraněná území",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/chranene.geojson'
                    })
                }),
                new ol.layer.Tile({
                    title: "Sídelní, hospodářské a kulturni objekty",
                    source: new ol.source.TileWMS({
                        url: 'http://geoportal.cuzk.cz/WMS_ZABAGED_PUB/WMService.aspx',
                        params: {
                            LAYERS: 'Sidelni__hospodarske_a_kulturni_objekty',
                            INFO_FORMAT: 'text/xml',
                            FORMAT: "image/png"
                        },
                        crossOrigin: "anonymous"
                    }),
                    path: 'WMS',
                    visible: true,
                    opacity: 0.8
                })
            ],
            project_name: 'Material',
            default_view: new ol.View({
                center: ol.proj.transform([15.20, 50.82], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 10,
                units: "m"
            }),
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": 'http://atlas.kraj-lbc.cz'
                }
            },
            datasources: [{
                title: "Catalogue",
                url: "/php/metadata/csw/",
                language: 'eng',
                type: "micka",
                code_list_url: '/php/metadata/util/codelists.php?_dc=1440156028103&language=cze&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
            }],
            'catalogue_url': caturl || '/php/metadata/csw/',
            'compositions_catalogue_url': caturl || '/php/metadata/csw/',
            status_manager_url: '/wwwlibs/statusmanager/index.php',
            queryPoint: 'notWithin',
            query: {
                multi: true
            },
            mainToolbar: {
                addLayer: true
            }
        });

        module.controller('Main', ['$scope', 'Core', 'hs.compositions.service',
            function ($scope, Core, Compo) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.setMainPanel("",true);
                Core.setLanguage('cs');
                //Compo.loadComposition("http://www.opentransportnet.eu/wwwlibs/statusmanager2/index.php?request=load&id=219e90c6-ba6d-43a4-8dd6-3ea84f2730c4", false);
            }
        ]);

        module.config(function($mdThemingProvider) {
            $mdThemingProvider.theme('selected-basemap').backgroundPalette('deep-purple').dark();
          });

        return module;
    });