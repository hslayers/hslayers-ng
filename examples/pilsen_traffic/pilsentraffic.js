/**
 * @namespace hs.pilsentraffic
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'styles'],

    function(angular, ol) {
        angular.module('hs.pilsentraffic', ['hs.core', 'hs.map', 'hs.styles'])

        .directive('hs.pilsentraffic.directive', function() {
            return {
                templateUrl: hsl_path + 'examples/pilsen_traffic/partials/directive.html?bust=' + gitsha
            };
        })

        .directive('hs.pilsentraffic.toolbarButtonDirective', function() {
            return {
                templateUrl: hsl_path + 'examples/pilsen_traffic/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })


        .service("hs.pilsentraffic.service", ['Core', 'hs.utils.service',
                function(Core, utils) {
                    var me = {
                        /*
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
                        }*/
                    };

                    return me;
                }
            ])
            .controller('hs.pilsentraffic.controller', ['$scope', 'hs.map.service', '$http', 'Core', 'config', 'hs.pilsentraffic.service', 'hs.styles.service', '$timeout',
                function($scope, OlMap, $http, Core, config, service, styles, $timeout) {
                    $scope.units = [];
                    var map = OlMap.map;
                    
                    $scope.$emit('scope_loaded', "PilsenTraffic");
                }
            ]);
    })
