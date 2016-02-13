'use strict';

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap', 'translations', 'compositions', 'status_creator'],

    function(angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
            'hs.legend', 'hs.geolocation', 'hs.core',
            'hs.api',
            'gettext',
            'hs.compositions', 'hs.status_creator',
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

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        wrapX: false
                    }),
                    title: "Base layer",
                    base: true
                })
            ],
            //project_name: 'hslayers',
            project_name: 'erra/map',
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 5,
                units: "m"
            }),
            compositions_catalogue_url: 'http://www.whatstheplan.eu/p4b-dev/cat/catalogue/libs/cswclient/cswClientRun.php',
            //compositions_catalogue_url: 'http://erra.ccss.cz/php/metadata/csw/index.php',
            status_manager_url: 'http://erra.ccss.cz/wwwlibs/statusmanager2/index.php',
            createExtraMenu: function($compile, $scope, element) {
                $scope.uploadClicked = function() {
                    alert("UPLOAD!")
                }
                var el = angular.element("<li class=\"sidebar-item\" ng-click=\"uploadClicked()\" ><a href=\"#\"><span class=\"menu-icon glyphicon icon-cloudupload\"></span><span class=\"sidebar-item-title\">Upload</span></a></li>");
                element.find('ul').append(el);
                $compile(el)($scope);
            }
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.service_infopanel', 'hs.compositions.service_parser',
            function($scope, Core, InfoPanelService, composition_parser) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.setMainPanel('composition_browser');
                //composition_parser.load('http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=972cd7d1-e057-417b-96a7-e6bf85472b1e');
                $scope.$on('infopanel.updated', function(event) {
                    if (console) console.log('Attributes', InfoPanelService.attributes, 'Groups', InfoPanelService.groups);
                });
            }
        ]);

        return module;
    });
