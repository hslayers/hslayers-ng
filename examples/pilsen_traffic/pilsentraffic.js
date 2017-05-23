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

        .directive('hs.pilsentraffic.roadworkInfoDirective', function() {
            return {
                templateUrl: 'partials/roadwork_info.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    $('#roadwork-info-dialog').modal('show');
                }
            };
        })

        .service("hs.pilsentraffic.service", ['Core', 'hs.utils.service','$http',
                function(Core, utils, $http) {
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

                    me.roadworksData = [];
                    
                    me.getRoadworksData = function() {
                        $http({
                            method: 'GET',
                            url: utils.proxify('http://otn-caramba.rhcloud.com/get_roadworks/'),
                            cache: false
                        }).then(function (response) {
                            response.data.forEach(function(item){
                                var froms = item.dates[0].split('-');
                                var tos = item.dates[1].split('-');
                                me.roadworksData.push({
                                    startDate: new Date(froms[0], froms[1]-1, froms[2]),
                                    endDate: new Date(tos[0], tos[1]-1, tos[2]),
                                    headline: item.name,
                                    description: item.description,
                                    location: item.location,
                                    detour: item.detour,
                                    id: item.id
                                });
                            })
                        });
                    }
                    
                    me.getDayData = function(day) {
                        if (me.roadworksData.length < 1) return false;
                        var list = [];
                        me.roadworksData.forEach(function(roadwork){
                            if (day >= roadwork.startDate && day <= roadwork.endDate) {
                                list.push(roadwork);
                            };
                        });
                        return list;
                    }
                    
                    me.getRoadworksData();
                    
                    return me;
                }
            ])
            .controller('hs.pilsentraffic.controller', ['$scope', 'hs.map.service', '$http', 'Core', 'config', 'hs.pilsentraffic.service', 'hs.styles.service', '$timeout', '$rootScope', 'hs.layermanager.WMSTservice', 'hs.layermanager.service', 'Socialshare', 'hs.permalink.service_url', '$compile',
                function($scope, hsmap, $http, Core, config, service, styles, $timeout, $rootScope, time_service, lm_service, socialshare, permalink_service, $compile) {
                    $scope.units = [];
                    var map = hsmap.map;
                    
                    var roadworks_layer = config.default_layers[4];
                    var hs_roadworks_layer = null;
                    
                    $scope.current_date = new Date();                  

                    $scope.day = moment();
                    
                    $scope.roadworklist = [];
                    $scope.roadwork;
                
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
                    
                    $scope.updateWorklist = function() {
                        var data = service.getDayData($scope.current_date);
                        if (!data) {
                            $timeout(function(){
                                $scope.updateWorklist();
                            },500);
                            return;
                        }
                        $scope.roadworklist = data; 
                        if (!$scope.$$phase) $scope.$digest();
                    }
                    
                    $scope.showRoadworkInfo = function(roadwork) {
                        $scope.roadwork = roadwork;
                        $("#hs-dialog-area #roadwork-info-dialog").remove();
                        var el = angular.element('<div hs.pilsentraffic.roadwork-info-directive></div>');
                        $("#hs-dialog-area").append(el);
                        $compile(el)($scope);
                    }
                    
                    $scope.updateWorklist();
                    
                    function shareSocial(provider){
                        var url = permalink_service.getPermalinkUrl();
                        socialshare.share({
                            'provider': provider,
                            'attrs': {
                                'socialshareText': getTitle(),
                                'socialshareSubject': getTitle(),
                                'socialshareBody': getDescription(url),
                                'socialshareUrl': url,
                                'socialsharePopupHeight': 600,
                                'socialsharePopupWidth': 500
                            }
                        })
                    }
                    
                    function printPdf(){
                        var doc = new jsPDF({orientation: 'landscape'})
                        var imgData = '';
                        
                        hsmap.map.once('postcompose', function(event) {
                            var canvas = event.context.canvas;
                            var canvas2 = document.createElement("canvas");
                            var width = 1044,
                                height = 668;
                            canvas2.style.width = width + "px";
                            canvas2.style.height = height + "px";
                            canvas2.width = width;
                            canvas2.height = height;
                            var ctx2 = canvas2.getContext("2d");
                            ctx2.drawImage(canvas, canvas.width / 2 - height / 2, canvas.height / 2 - width / 2, width, height, 0, 0, width, height);
                            imgData = canvas2.toDataURL('image/png', 0.8);
                        }, $scope);
                        hsmap.map.renderSync();

                        doc.setFontSize(30);
                        doc.text(55, 25, getTitle());
                        doc.addImage(imgData, 'PNG', 10, 20);
                        doc.save('a4.pdf')
                    }
                    
                    function getTitle(){
                        return 'Mapa intenzity dopravy v Plzni';
                    }
                    
                    function getDescription(url){
                        return 'Předpokládaná dopravní situace v Plzni dne xx.xx.2017 v 10:00.%0D%0A' + encodeURIComponent(url);
                    }
                    
                    $scope.printPdf = printPdf;
                    $scope.shareSocial = shareSocial;
                    
                    $scope.$emit('scope_loaded', "PilsenTraffic");
                }
            ]);
    })
