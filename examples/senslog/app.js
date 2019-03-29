'use strict';

define(['ol',
        'toolbar',
        'sidebar',
        'layermanager',
        'query',
        'search',
        'print',
        'permalink',
        'measure',
        'bootstrap.bundle',
        'geolocation',
        'api',
        'senslog',
        'draw',
        'drag',
        'ows'
    ],
    function(ol, toolbar) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search',
            'hs.print',
            'hs.permalink',
            'hs.geolocation',
            'hs.api',
            'hs.sidebar',
            'hs.senslog',
            'hs.draw',
            'hs.drag',
            'hs.ows'
        ]);

        module.directive(
            'hs', ['config', 'Core',
                function(config, Core) {
                    return {
                        templateUrl: config.hsl_path + 'hslayers.html',
                        link: function(scope, element) {
                            Core.fullScreenMap(element);
                        }
                    };
                }
            ]);

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    base: true
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([6.1319, 49.6116], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 13,
                units: "m"
            }),
            senslog_url: 'http://portal.sdi4apps.eu/SensLog-VGI/rest/vgi',
            user_name: 'tester'
        });

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', 'config', '$http',
            function($scope, Core, $compile, hsmap, config, $http) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Sidebar') {
                        var el = angular.element('<div hs.senslog.directive hs.draggable ng-controller="hs.senslog.controller" ng-if="Core.exists(\'hs.senslog.controller\')" ng-show="Core.panelVisible(\'senslog\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);

                        var toolbar_button = angular.element('<div hs.senslog.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);
                    }
                    if (args == 'LayerManager') {
                        var add_button = angular.element('<button class="btn btn-secondary" style="float:right; margin-top:1em" ng-click="toggleAddSenslogDataset()" translate=""><span class="menu-icon icon-refresh" data-toggle="tooltip" data-container="body" data-placement="auto" title="Add external data"></span></button>');
                        angular.element('.hs-lm-panel').append(add_button);
                        $compile(add_button)(event.targetScope);
                        var add_dataset_panel = angular.element('<panel class="panel" ng-show="add_dataset_panel_visible"><form> <div class="form-group"><label translate>Dataset name</label><input type="text" class="form-control" ng-model="dataset_name"/></div> <div class="form-group"><label translate>Description</label><textarea class="form-control" ng-model="dataset_description"/></div><button class="btn btn-primary" ng-click="addSenslogDataset()">Save</button> </form></panel>');
                        angular.element('.hs-lm-panel').append(add_dataset_panel);
                        $compile(add_dataset_panel)(event.targetScope);
                        event.targetScope.toggleAddSenslogDataset = function() {
                            event.targetScope.add_dataset_panel_visible = !event.targetScope.add_dataset_panel_visible;
                        }
                        event.targetScope.addSenslogDataset = function() {
                            $http({
                                url: config.senslog_url + '/dataset/?user_name=' + config.user_name,
                                method: 'POST',
                                data: {
                                    dataset_name: event.targetScope.dataset_name,
                                    description: event.targetScope.dataset_description
                                },
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            }).then(function(response) {
                                if (response.statusText == "OK") {
                                    var source = new ol.source.Vector({
                                        url: config.senslog_url + '/observation/?user_name=' + config.user_name + '&dataset_id=' + response.dataset_id + '&format=geojson',
                                        format: new ol.format.GeoJSON()
                                    });
                                    source.set('dataset_id', response.dataset_id);
                                    source.set('senslog_url', config.senslog_url + '/');
                                    var lyr = new ol.layer.Vector({
                                        title: event.targetScope.dataset_name,
                                        visible: false,
                                        source: source
                                    })
                                    hsmap.map.addLayer(lyr);
                                    event.targetScope.dataset_name = "";
                                    event.targetScope.dataset_description = "";
                                }
                            });
                        }

                    }
                    if (args == 'Map') {

                        $http.get(config.senslog_url + '/category/?user_name=' + config.user_name).then(function(response) {
                            $scope.$broadcast('senslog.categories_loaded', response.data);
                        });

                        $http.get(config.senslog_url + '/dataset/?user_name=' + config.user_name).then(function(response) {
                            $scope.$broadcast('senslog.datasets_loaded', response.data);
                            angular.forEach(response.data, function(dataset) {
                                var source = new ol.source.Vector({
                                    url: config.senslog_url + '/observation/?user_name=' + config.user_name + '&dataset_id=' + dataset.dataset_id + '&format=geojson',
                                    format: new ol.format.GeoJSON()
                                });
                                source.set('dataset_id', dataset.dataset_id);
                                source.set('senslog_url', config.senslog_url + '/');
                                var lyr = new ol.layer.Vector({
                                    title: dataset.dataset_name,
                                    visible: false,
                                    source: source
                                })
                                hsmap.map.addLayer(lyr);
                            })
                        });
                    }
                });
                Core.panelEnabled('compositions', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
