'use strict';

define(['ol', 'sidebar', 'toolbar', 'layermanager', 'WfsSource', 'map', 'query', 'search', 'print', 'permalink', 'lodexplorer', 'measure', 'geolocation', 'datasource_selector', 'api', 'ows', 'bootstrap', 'status_creator'],

    function(ol, sidebar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.sidebar',
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.lodexplorer',
            'hs.geolocation',
            'hs.datasource_selector',
            'hs.status_creator',
            'hs.measure',
            'hs.api',
            'hs.ows'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
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
                    title: "CKAN",
                    url: "http://otn-dev.intrasoft-intl.com/otnServices-1.0/platform/ckanservices/datasets",
                    language: 'eng',
                    type: "ckan"
                }, {
                    title: "Micka",
                    url: "http://cat.ccss.cz/csw/",
                    language: 'eng',
                    type: "micka",
                    code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
                }
            ]
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.service_infopanel', 'hs.map.service',
            function($scope, Core, InfoPanelService, OlMap) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.Core.sidebarRight = false;
                //$scope.Core.sidebarToggleable = false;
                $scope.Core.sidebarButtons = true;
                $scope.Core.setDefaultPanel('layermanager');
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
