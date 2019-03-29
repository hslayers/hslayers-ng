'use strict';

define(['ol', 'sidebar', 'toolbar', 'layermanager', 'hs.source.Wfs', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'datasource_selector', 'api', 'ows', 'bootstrap.bundle', 'status_creator'],

    function(ol, sidebar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.sidebar',
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.datasource_selector',
            'hs.status_creator',
            'hs.measure',
            'hs.api',
            'hs.ows'
        ]);

        module.directive('hs', ['config', 'Core', function(config, Core) {
            return {
                templateUrl: config.hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
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
        })

        function getHostname() {
            var url = window.location.href
            var urlArr = url.split("/");
            var domain = urlArr[2];
            return urlArr[0] + "//" + domain;
        };

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    base: true,
                    removable: false
                })
            ],
            project_name: 'erra/map',
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            }),
            datasources: [
                /*{
                    title: "Datatank",
                    url: "http://ewi.mmlab.be/otn/api/info",
                    type: "datatank"
                },*/
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
            status_manager_url: '/wwwlibs/statusmanager2/index.php'
                //,datasource_selector: {allow_add: false}
        });

        module.controller('Main', ['$scope', 'Core', 'hs.map.service',
            function($scope, Core, OlMap) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.Core.sidebarRight = false;
                //$scope.Core.sidebarToggleable = false;
                Core.singleDatasources = true;
                $scope.Core.sidebarButtons = true;
                $scope.Core.setDefaultPanel('layermanager');
            }
        ]);

        return module;
    });
