/**
 * @namespace hs.sentinel
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],

    function (angular, ol) {
        angular.module('hs.sentinel', ['hs.core', 'hs.map'])

            .directive('hs.sentinel.directive', function () {
                return {
                    templateUrl: hsl_path + 'examples/databio/sentineldirective.html?bust=' + gitsha
                };
            })

            .directive('hs.sentinel.toolbar', function () {
                return {
                    templateUrl: hsl_path + 'examples/databio/sentineltoolbar.html?bust=' + gitsha
                };
            })


            .service("hs.sentinel.service", ['Core', 'hs.utils.service', '$http',
                function (Core, utils, $http) {
                    var me = {
                        getCrossings: function (points, cb) {
                            var payload = [];
                            for (var i = 0; i < points.length; i++) {
                                var p = points[i];
                                payload.push({ idx: i, lat: p.lat, lon: p.lon });
                            }
                            $.ajax({
                                url: 'https://agmeos.cz/satellite_position/service.php',
                                type: "POST",
                                data: JSON.stringify(payload),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json"
                            }).done(function (response) {
                                for (var i = 0; i < response.length; i++) {
                                    delete response[i].mkr;
                                    points[i].crossings = response[i];
                                }
                                cb();
                            });
                        }
                    };



                    return me;
                }
            ])
            .controller('hs.sentinel.controller', ['$scope', 'hs.map.service', 'Core', 'config', 'hs.sentinel.service', '$timeout',
                function ($scope, OlMap, Core, config, service, styles, $timeout) {
                    $scope.points = [];
                    $scope.loading = false;
                    $scope.ajax_loader = hsl_path + 'img/ajax-loader.gif';
                    $scope.$on('cesium_position_clicked', function (event, data) {
                        $scope.points.push({ lon: data[0].toFixed(2), lat: data[1].toFixed(2) });
                        if (!$scope.$$phase) $scope.$apply();
                    });

                    $scope.getCrossings = function () {
                        $scope.loading = true;
                        service.getCrossings($scope.points, function () {
                            $scope.loading = false;
                            if (!$scope.$$phase) $scope.$apply();
                        })
                    };

                    $scope.$emit('scope_loaded', "Sentinel");
                }
            ]);
    })
