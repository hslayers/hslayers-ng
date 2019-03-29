'use strict';

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap.bundle', 'translations', 'compositions', 'status_creator', 'ows', 'feature_filter'],

    function(angular, ol, toolbar, layermanager) {
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
            'hs.sidebar',
            'hs.feature_filter'
        ]);

        module.directive('hs', ['config', 'Core', function(config, Core) {
            return {
                templateUrl: config.hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        var caturl = "/php/metadata/csw/index.php";

        module.value('config', {
            design: 'md',
            query: {
                multi: true
            },
            infopanel_template: "satelliteMetadataQuery.html",
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        wrapX: false
                    }),
                    title: "Base layer",
                    base: true
                }),
                new ol.layer.Vector({
                    title: "Satellite imagery example",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'copernicus_1.geojson'
                    }),
                    hsFilters: [
                        {
                            title: "Satellite mission",
                            valueField: "platformname",
                            type: {
                                type: "fieldset",
                            },
                            selected: undefined,
                            values: ["Sentinel-2", "Sentinel-1"],
                            gatherValues: true
                        },
                        {
                            title: "Date interval",
                            valueField: "beginposition",
                            type: {
                                type: "dateExtent",
                            },
                            range: undefined,
                            gatherValues: true
                        },
                        {
                            title: "Cloud cover",
                            valueField: "cloudcoverpercentage",
                            type: {
                                type: "slider",
                                parameters: "le",
                            },
                            range: [0, 100],
                            unit: "%"
                        }
                    ]
                })
            ],
            //project_name: 'hslayers',
            project_name: 'Material',
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 5,
                units: "m"
            }),
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": 'http://atlas.kraj-lbc.cz'
                }, /*,
                "compositions_catalogue": {
                    "title": "Compositions catalogue",
                    "type": "compositions_catalogue",
                    "editable": true,
                    "url": 'http://foodie-dev.wirelessinfo.cz'
                },*/
                "status_manager": {
                    "title": "Status manager",
                    "type": "status_manager",
                    "editable": true,
                    "url": 'http://foodie-dev.wirelessinfo.cz'
                }
            },
            social_hashtag: 'via @opentnet',
            //compositions_catalogue_url: '/p4b-dev/cat/catalogue/libs/cswclient/cswClientRun.php',
            //compositions_catalogue_url: 'http://erra.ccss.cz/php/metadata/csw/index.php',
            //status_manager_url: '/wwwlibs/statusmanager2/index.php',

           'catalogue_url': caturl || '/php/metadata/csw/',
           'compositions_catalogue_url': caturl || '/php/metadata/csw/',
           status_manager_url: '/wwwlibs/statusmanager/index.php',

            createExtraMenu: function($compile, $scope, element) {
                $scope.uploadClicked = function() {
                    alert("UPLOAD!")
                }
                var el = angular.element("<li class=\"sidebar-item\" ng-click=\"uploadClicked()\" ><a href=\"#\"><span class=\"menu-icon glyphicon icon-cloudupload\"></span><span class=\"sidebar-item-title\">Upload</span></a></li>");
                element.find('ul').append(el);
                $compile(el)($scope);
            }
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.baseService', 'hs.compositions.service_parser', 'hs.feature_filter.service',
            function($scope, Core, BaseService, composition_parser) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.setMainPanel('composition_browser');
                //composition_parser.load('http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=972cd7d1-e057-417b-96a7-e6bf85472b1e');
                $scope.$on('query.dataUpdated', function(event) {
                    if (console) console.log('Attributes', BaseService.data.attributes, 'Groups', BaseService.data.groups);
                });
            }
        ]);

        return module;
    });
