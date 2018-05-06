'use strict';

define(['angular', 'ol', 'proj4', 'sidebar', 'toolbar', 'layermanager', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap', 'translations', 'compositions', 'status_creator', 'ows'],

    function (angular, ol, proj4, toolbar, layermanager) {
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
            'hs.compositions', 'hs.status_creator',
            'hs.sidebar'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function (OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function (scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        var caturl = "/php/metadata/csw/index.php";

        
        proj4.defs("EPSG:5514","+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs");
        ol.proj.setProj4(proj4);

        module.value('config', {
			box_layers: [
				new ol.layer.Group({
					title: 'Podkladové mapy',
					layers: [
						new ol.layer.Image({
							base: true,
							BoundingBox : [{crs:"EPSG:5514", extent: [-905000, -1230000, -400000, -900000]}],
							source: new ol.source.ImageWMS({
								url: 'https://mapserver.zcu.cz/cgi-bin/mapserv?map=/data/mapserver.zcu.cz/mapserver/maps/vojmapWMS.map',
								params: {
									LAYERS: 'vojmap',
									INFO_FORMAT: undefined,
									FORMAT: "image/png",
									ABSTRACT: "Basemap VOJMAP"
								},
								crossOrigin: null
							}),
							title: "VojMap"
						}),
					],
				}),
			],
			default_view: new ol.View({
				//center: [1661357, 6572308], //Latitude longitude    to Spherical Mercator
                center: [-805000, -1030000],
                projection: 'EPSG:5514',
				zoom: 4,
				units: "m"
			}),
			hostname: {
				"default": {
					"title": "Default",
					"type": "default",
					"editable": false,
					"url": 'https://mapserver.zcu.cz'
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
			status_manager_url: '/wwwlibs/statusmanager/index.php'
		});

        module.controller('Main', ['$scope', 'Core', 'hs.query.baseService', 'hs.compositions.service_parser', 'hs.map.service', '$rootScope',
            function ($scope, Core, QueryService, composition_parser, hsMap, $rootScope) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.setMainPanel('composition_browser');
                //composition_parser.load('http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=972cd7d1-e057-417b-96a7-e6bf85472b1e');
                $scope.$on('query.dataUpdated', function (event) {
                    if (console) console.log('Attributes', QueryService.data.attributes, 'Groups', QueryService.data.groups);
                });
                
                $rootScope.$on('map.loaded', function () {
                    var oldFn = hsMap.interactions.MouseWheelZoom.handleEvent;
                    hsMap.interactions.MouseWheelZoom.handleEvent = function (e) {
                        var type = e.type;
                        if (type !== "wheel" && type !== "wheel") {
                            return true;
                        }
    
                        if (!e.originalEvent.ctrlKey) {
                            return true
                        }
    
                        oldFn.call(this, e);
                    }
                });
            }
        ]);

        return module;
    });
