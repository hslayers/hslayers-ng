/**
 * @namespace hs.pilsentraffic
 * @memberOf hs
 */
define(['angular', 'ol', 'moment', 'map', 'core', 'styles', 'angularjs-socialshare', 'permalink'],

    function(angular, ol, moment) {
        var time_layer_title = 'Intenzita dopravy v Plzni - květen 2017';

        angular.module('hs.pilsentraffic', ['hs.core', 'hs.map', 'hs.styles', '720kb.socialshare', 'hs.permalink'])

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
            .controller('hs.pilsentraffic.controller', ['$scope', 'hs.map.service', '$http', 'Core', 'config', 'hs.pilsentraffic.service', 'hs.styles.service', '$timeout', '$rootScope', 'hs.layermanager.WMSTservice', 'hs.layermanager.service', 'Socialshare', 'hs.permalink.service_url', 
                function($scope, hsmap, $http, Core, config, service, styles, $timeout, $rootScope, time_service, lm_service, socialshare, permalink_service) {
                    $scope.units = [];
                    var map = hsmap.map;
                    
                    var roadworks_layer = config.default_layers[4];
                    var hs_roadworks_layer = null;
                    
                    $scope.current_date = new Date();                  

                    $scope.day = moment();
                
                    $scope.$watch('day', function() {
                        $scope.current_date.setYear($scope.day.year());
                        $scope.current_date.setMonth($scope.day.month());
                        $scope.current_date.setDate($scope.day.date());
                        console.log($scope.day, $scope.current_date);
                        updateTimeLayer();
                    });
                    
                    $scope.setCurrentTime = function(current_hour){
                        $scope.current_hour = current_hour;
                        $scope.current_date.setHours($scope.current_hour);
                        updateTimeLayer()
                    }
                    
                    function getRoadworksLayer(){
                        hs_roadworks_layer = lm_service.getLayerByTitle(time_layer_title);
                        $scope.current_date = new Date(hs_roadworks_layer.min_time);
                        $scope.current_hour = 8;
                        var now = new Date();
                        var hours = now.getHours();
                        //if(hours<8) hours = 8;
                        //if(hours>22) hours = 22;
                        $scope.setCurrentTime(hours);
                    }
                    
                    if(angular.isUndefined(lm_service.getLayerByTitle(time_layer_title)))
                        $rootScope.$on('layermanager.updated', function(data, layer) {
                            if(hs_roadworks_layer == null && layer.get('title') == time_layer_title){
                                getRoadworksLayer()
                            }
                        })
                    else
                        getRoadworksLayer();
                    
                    
                    function updateTimeLayer(){
                        hs_roadworks_layer.date_increment =  $scope.current_date.getTime() - $scope.current_date.getTimezoneOffset() * 60000;
                        time_service.setLayerTime(hs_roadworks_layer); 
                    }
                    
                    function shareSocial(provider){
                        socialshare.share({
                            'provider': provider,
                            'attrs': {
                                'socialshareText': 'Mapa intenzity dopravy v Plzni',
                                'socialshareUrl': permalink_service.getPermalinkUrl(),
                                'socialsharePopupHeight': 600,
                                'socialsharePopupWidth': 500
                            }
                        })
                    }
                    
                    $scope.shareSocial = shareSocial;
                    
                    $scope.$emit('scope_loaded', "PilsenTraffic");
                }
            ]);
    })
