/**
 * @namespace hs.routing
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],
        function (angular, ol) {
            angular.module('hs.routing', ['hs.map', 'hs.core'])
                    .directive('hs.routing.directive', function () {
                        return {
                            templateUrl: hsl_path + 'components/routing/partials/routing.html'
                        };
                    })

                    .controller('hs.routing.controller', [
                        '$scope',
                        'hs.map.service',
                        'Core',
                        function ($scope, OlMap, Core) {

                            var map = OlMap.map;
                            console.log('Executed controller of hs.routing');

                            $scope.clearAll = function () {

                            };



//                $scope.activateMeasuring = function() {
//                    map.addLayer(vector);
//                    $(map.getViewport()).on('mousemove', mouseMoveHandler);
//                    addInteraction();
//                }

//                $scope.deactivateMeasuring = function() {
//                    $(map.getViewport()).off('mousemove');
//                    map.removeInteraction(draw);
//                    map.removeLayer(vector);
//                }

                            $scope.$on('core.mainpanel_changed', function (event) {
                                console.log('I got here alright');
                                if (Core.mainpanel === 'routing') {
//                        $scope.activateMeasuring();
                                } else {
//                        $scope.deactivateMeasuring();
                                }
                            });
                            $scope.$emit('scope_loaded', "routing");
                        }
                    ]);
        })