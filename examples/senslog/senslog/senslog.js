/**
 * @namespace hs.senslog
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'styles'],

    function(angular, ol) {
        angular.module('hs.senslog', ['hs.core', 'hs.map', 'hs.styles'])

        .directive('hs.senslog.directive', function() {
            return {
                templateUrl: hsl_path + 'examples/senslog/senslog/partials/directive.html?bust=' + gitsha
            };
        })

        .directive('hs.senslog.toolbarButtonDirective', function() {
            return {
                templateUrl: hsl_path + 'examples/senslog/senslog/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })


        .service("hs.senslog.service", ['Core', 'hs.utils.service',
                function(Core, utils) {
                    var me = {
                        getUnits: function() {
                            var url = null;
                            url = "http://portal.sdi4apps.eu/SensLog/DataService?Operation=GetUnits&group=gaiatrons&user=admin";
                            if (angular.isDefined(me.xhr) && me.xhr !== null) me.xhr.abort();
                            me.xhr = $.ajax({
                                url: url,
                                cache: false,
                                success: function(r) {
                                    me.unitsReceived(r);
                                    me.xhr = null
                                }
                            });
                        }
                    };

                    return me;
                }
            ])
            .controller('hs.senslog.controller', ['$scope', 'hs.map.service', '$http', 'Core', 'config', 'hs.senslog.service', 'hs.styles.service', '$timeout',
                function($scope, OlMap, $http, Core, config, service, styles, $timeout) {
                    $scope.units = [];
                    var map = OlMap.map;
                    var format = new ol.format.WKT();

                    service.unitsReceived = function(r) {
                        $scope.createCurrentPointLayer();
                        $scope.units = r;
                        parseUnitPositions(r);
                    }

                    $scope.highlightUnit = function(unit) {
                        angular.forEach($scope.units, function(unit) {
                            unit.highlighted = false;
                        })
                        unit.highlighted = true;
                        map.getView().fit(unit.feature.getGeometry(), map.getSize(), {
                            maxZoom: 16
                        });
                    }

                    function parseUnitPositions(r) {
                        angular.forEach(r, function(unit) {
                            var g_feature = format.readFeature(unit.lastpos.position.postgisGeomString.toUpperCase());
                            var src = $scope.units_layer.getSource();
                            var feature = new ol.Feature({
                                geometry: g_feature.getGeometry().transform('EPSG:' + unit.lastpos.position.SRID, map.getView().getProjection()),
                                unit: unit.unit.description,
                                'Observations': "<a target='_blank' href='http://portal.sdi4apps.eu/SensLog/vypis.jsp?unit_id=" + unit.unit.unitId + "'>Show graphs</a>"
                            });
                            src.addFeature(feature);
                            unit.feature = feature;
                        });
                    }

                    $scope.save = function(unit) {
                        angular.forEach(unit.sensors, function(sensor) {
                            var s_date = encodeURIComponent(formatLocalDate());
                            var url = "http://portal.sdi4apps.eu/SensLog/FeederServlet?Operation=InsertObservation&group=gaiatrons&user=admin&value=" + sensor.new_value + "&date=" + s_date + "&unit_id=" + unit.unit.unitId + "&sensor_id=" + sensor.sensorId;
                            $.ajax({
                                url: url,
                                cache: false,
                                success: function(r) {
                                    unit.save_result = r;
                                    if (!$scope.$$phase) $scope.$digest();
                                    $timeout(function() {
                                        unit.save_result = null
                                    }, 3000, true);
                                }
                            })
                        })
                    }

                    function formatLocalDate() {
                        var now = new Date(),
                            tzo = -now.getTimezoneOffset(),
                            dif = tzo >= 0 ? '+' : '-',
                            pad = function(num) {
                                var norm = Math.abs(Math.floor(num));
                                return (norm < 10 ? '0' : '') + norm;
                            };
                        return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
                    }

                    $scope.createCurrentPointLayer = function() {
                        if ($scope.units_layer) {
                            $scope.units_layer.getSource().clear();
                            map.removeLayer($scope.units_layer);
                        }
                        $scope.units_layer = new ol.layer.Vector({
                            title: "Units",
                            source: new ol.source.Vector({}),
                            style: styles.pin_white_blue_highlight,
                            show_in_manager: true,
                            visible: false
                        });

                        map.addLayer($scope.units_layer);
                    }

                    service.getUnits();

                    $scope.$emit('scope_loaded', "Senslog");
                }
            ]);
    })
