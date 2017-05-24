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
                    
                    me.day = moment();
                    
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

                    $scope.service = service;
                    
                    $scope.roadworklist = [];
                    $scope.roadwork;
                
                    $rootScope.$on('date_changed', function(){
                        dateChanged()
                    })
                    
                    function dateChanged(){
                        $scope.current_date.setYear(service.day.year());
                        $scope.current_date.setMonth(service.day.month());
                        $scope.current_date.setDate(service.day.date());
                        if(console) console.log(service.day, service.current_date);
                        updateTimeLayer();
                        $scope.$broadcast('day.changed', service.day);
                        $scope.updateWorklist();
                        updateUrlDateTime();
                    }
                                   
                    $scope.$watch(function(){return service.day}, dateChanged);
                    
                    $scope.setCurrentTime = function(current_hour){
                        $scope.current_hour = current_hour;
                        $scope.current_date.setHours($scope.current_hour);
                        updateTimeLayer();
                        updateUrlDateTime();
                    }
                    
                    $scope.nextDay = function() {
                        var day = moment(service.day);
                        day.date(day.date()+1);
                        $scope.$broadcast('day.changed',day);
                    }
                    
                    $scope.previousDay = function() {
                        var day = moment(service.day);
                        day.date(day.date()-1);
                        $scope.$broadcast('day.changed',day);
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
                    
                    function updateUrlDateTime() {
                        var params = {};
                        params.year = $scope.current_date.getFullYear();
                        params.month = $scope.current_date.getMonth();
                        params.date = $scope.current_date.getDate();
                        params.hour = $scope.current_hour;
                        permalink_service.updateCustomParams(params);
                    }
                    
                    function initFromLink() {
                        var day = moment(service.day);
                        service.day.year(permalink_service.getParamValue('year'));
                        service.day.month(permalink_service.getParamValue('month'));
                        service.day.date(permalink_service.getParamValue('date'));
                        dateChanged();
                        $scope.setCurrentTime(permalink_service.getParamValue('hour'));
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
                    
                    $scope.permalink_visible = false;
                    function showPermalink(){
                        var url = permalink_service.getPermalinkUrl();
                        $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                            longUrl: url
                        }).success(function(data, status, headers, config) {
                            $scope.share_url = data.id;
                            $scope.permalink_visible = !$scope.permalink_visible;
                            setTimeout(function(){
                                $("#hs-permalink").focus(function() { $(this).select(); } );
                                $("#hs-permalink").focus();
                            }, 400);
                        })
                    }
                    
                    function shareSocial(provider){
                        var url = permalink_service.getPermalinkUrl();
                        $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                            longUrl: url
                        }).success(function(data, status, headers, config) {
                            $scope.share_url = data.id;
                            socialshare.share({
                                'provider': provider,
                                'attrs': {
                                    'socialshareText': getTitle(),
                                    'socialshareSubject': getTitle(),
                                    'socialshareBody': getDescription($scope.share_url),
                                    'socialshareUrl': $scope.share_url,
                                    'socialsharePopupHeight': 600,
                                    'socialsharePopupWidth': 500
                                }
                            })
                        }).error(function(data, status, headers, config) {
                            if(console) console.log('Error creating short Url');
                        });  
                    }
                    
                    function printPdf(){
                        var doc = new jsPDF({orientation: 'landscape'})
                        var imgData = '';
                        
                        hsmap.map.once('postcompose', function(event) {
                            var canvas = event.context.canvas;
                            var canvas2 = document.createElement("canvas");
                            var width = 700,
                                height = 500;
                            canvas2.style.width = width + "px";
                            canvas2.style.height = height + "px";
                            canvas2.width = width;
                            canvas2.height = height;
                            var ctx2 = canvas2.getContext("2d");
                            ctx2.fillStyle = '#eeeeee';
                            ctx2.fillRect(0, 0, width ,height);
                            ctx2.drawImage(canvas, canvas.width / 2 - width / 2, canvas.height / 2 - height / 2, width, height, 0, 0, width, height);
                            imgData = canvas2.toDataURL('image/png', 1);
                        }, $scope);
                        hsmap.map.renderSync();
      
                        //********** Draw the roadworks list
                        var text_canvas = document.createElement("canvas");
                        var text_canvas_dimensions = 1000;
                        text_canvas.style.width = text_canvas_dimensions + "px";
                        text_canvas.style.height = text_canvas_dimensions + "px";
                        text_canvas.width = text_canvas_dimensions;
                        text_canvas.height = text_canvas_dimensions;
                            
                        var tctx = text_canvas.getContext("2d");

                        tctx.fillStyle = 'black';
                        tctx.font="22pt Verdana";
                        tctx.fillText(getDescriptionWoUrl(), 5, 30);
                        var text_pixels = text_canvas.toDataURL('image/png', 1);
                        doc.addImage(text_pixels, 'PNG', 10, 20);
                        
                        var y = 25;
                        tctx.clearRect(0, 0, 500 ,500);
                                                        
                        tctx.fillStyle = 'black';
                        tctx.font="14pt Verdana";
                        
                        angular.forEach($scope.roadworklist, function(work){
                            tctx.fillText(work.headline, 5, y);
                            y += 40;
                        })
                        
                        text_pixels = text_canvas.toDataURL('image/png', 1);
                        doc.addImage(text_pixels, 'PNG', 10, 40);
                        
                        //********** Draw map
                        doc.addImage(imgData, 'PNG', 100, 40);
                        doc.save('a4.pdf')
                    }
                    
                    function getTitle(){
                        return 'Mapa intenzity dopravy v Plzni';
                    }
                    
                    function getDescriptionWoUrl(){
                        return 'Předpokládaná dopravní situace v Plzni dne ' + lead(service.day.day()) + '.' + lead(service.day.month() + 1) + '.' + service.day.year() + ' v ' + lead($scope.current_hour) + ':00.';
                    }
                    
                    function lead(what){
                        return ("0"+what).slice(-2)   
                    }
                    
                    function getDescription(url){
                        return getDescriptionWoUrl() + '%0D%0A' + encodeURIComponent(url);
                    }
                    
                    $rootScope.$on('layermanager.layer_loaded', function(e, layer){
                        if(layer.get('title') == time_layer_title)
                            $scope.layers_loading = layer.getSource().loadCounter;
                    });
                    
                    
                    $scope.printPdf = printPdf;
                    $scope.shareSocial = shareSocial;
                    $scope.showPermalink = showPermalink;
                    
                    if (permalink_service.getParamValue('year')) initFromLink();
                    
                    $scope.$emit('scope_loaded', "PilsenTraffic");
                }
            ]);
    })
