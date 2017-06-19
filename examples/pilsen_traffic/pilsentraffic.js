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
        
        .directive('hs.pilsentraffic.legend', ['hs.pilsentraffic.service','gettext', function(service, gettext) {
            function link(scope,element,attrs) {
                scope.data = service.data;
                
                scope.toggleLegend = function(bool) {
                    scope.data.legendVisible = bool;
                    if (bool) scope.data.helpVisible = false;
                }
                
                scope.legendContent = [
                    gettext("1 - jízda plynulá, provoz jednotlivých vozidel"),
                    gettext("2 - jízda plynulá, malé skupiny vozidel"),
                    gettext("3 - provoz plynulý, rychlost nižší než maximální"),
                    gettext("4 - tvoří se kolony vozidel, rychlost výrazně snížena"),
                    gettext("5 - dopravní kolaps, vozidla stojí nebo pomalu popojíždějí"),
                    gettext("počet vozidel na daném úseku komunikace za hodinu"),
                    gettext("úplná uzavírka"),
                    gettext("částečná uzavírka")
                ];
            }
            
            return {
                templateUrl: 'partials/legend.html?bust=' + gitsha,
                link: link
            };
        }])
        
        /*.directive('hs.pilsentraffic.help', ['hs.pilsentraffic.service', function(service) {
            function link(scope,element,attrs) {
                scope.data = service.data;
                
                scope.toggleHelp = function(bool) {
                    scope.data.helpVisible = bool;
                    if (bool) scope.data.legendVisible = false;
                }
            }
            
            return {
                templateUrl: 'partials/help.html?bust=' + gitsha,
                link: link
            };
        }])*/
        
        .directive('hs.pilsentraffic.helppanel', function() {
            function link(scope,element,attrs) {
                scope.page = 'about';
                
                scope.hideHelpPanel = function() {
                    element.children().first().addClass('panel-help-hidden');
                }
                
                scope.showHelpPanel = function(page) {
                    if (angular.isDefined(page)) scope.page = page;
                    element.children().first().removeClass('panel-help-hidden');
                }
                
                scope.setPage = function(page) {
                    scope.page = page;
                }
                
                scope.hideHelpPanel();
            }
            
            return {
                templateUrl: 'partials/help-panel.html?bust=' + gitsha,
                link: link
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

                    me.data = {};
                    
                    me.data.legendVisible = false;
                    me.data.helpVisible = false;
                    
                    me.roadworksData = [];
                    
                    me.getRoadworksData = function() {
                        $http({
                            method: 'GET',
                            url: utils.proxify('http://otn-caramba.rhcloud.com/get_roadworks/'),
                            cache: false
                        }).then(function (response) {
                            response.data.forEach(function(item){
                                var froms = item.dates[0].split('.');
                                var tos = item.dates[1].split('.');
                                me.roadworksData.push({
                                    startDate: new Date(froms[2], froms[1]-1, froms[0]),
                                    endDate: new Date(tos[2], tos[1]-1, tos[0]),
                                    headline: item.name,
                                    description: item.description,
                                    location: item.location,
                                    detour: item.detour,
                                    coordinate: item.geom.coordinates,
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
                    
                    $scope.animating = false;
                    
                    $scope.current_date = new Date();                  

                    $scope.service = service;
                    
                    $scope.roadworklist = [];
                    $scope.roadwork;
                
                    $rootScope.$on('date_changed', function(){
                        dateChanged()
                    })
                    
                    function rangeContains(date){
                        return date.isSameOrAfter($scope.$parent.min_date) &&  date.isSameOrBefore($scope.$parent.max_date);
                    }
                    
                    $scope.rangeContains = rangeContains;
                    
                    var linkInit = false;
                    
                    function dateChanged(){
                        $scope.current_date.setYear(service.day.year());
                        $scope.current_date.setMonth(service.day.month());
                        $scope.current_date.setDate(service.day.date());
                        if(console) console.log(service.day, service.current_date);
                        /*if (!linkInit) { //At the moment this code doesnt let forward/backward hours thats why I commented it out. Correct me if im wrong. Raitis
                            var now = new Date();
                            if ($scope.current_date.toDateString() == now.toDateString()) {
                                $scope.current_hour = now.getHours();
                                $scope.current_date.setHours($scope.current_hour);
                            }
                        }*/
                        $scope.current_date.setHours($scope.current_hour);
                        updateTimeLayer();
                        $scope.$broadcast('day.changed', service.day);
                        $scope.updateWorklist();
                    }
                                   
                    $scope.$watch(function(){return service.day}, dateChanged);
                    
                    $scope.setCurrentTime = function(current_hour){
                        $scope.current_hour = current_hour;
                        $scope.current_date.setHours($scope.current_hour);
                        updateTimeLayer();
                    }
                    
                    $scope.nextDay = function() {
                        incrementCurrentDay(1);
                    }
                    
                    $scope.previousDay = function() {
                        incrementCurrentDay(-1);
                    }
                    
                    function incrementCurrentDay(offset){
                        var day = moment(service.day);
                        day.date(day.date()+offset);
                        $scope.$broadcast('day.changed',day);
                    }
                    
                    $scope.nextHour = function() {
                        $scope.current_date.setHours($scope.current_date.getHours() + 1);
                        $scope.current_hour = $scope.current_date.getHours();
                        updateTimeLayer();
                        calculatePureDateForServiceFromCurrent();
                        incrementCurrentDay(0);
                    }

                    function calculatePureDateForServiceFromCurrent(){
                        service.day.year($scope.current_date.getFullYear());
                        service.day.month($scope.current_date.getMonth());
                        service.day.date($scope.current_date.getDate());
                    }
                    
                    $scope.previousHour = function() {
                        $scope.current_date.setHours($scope.current_date.getHours() - 1);
                        $scope.current_hour = $scope.current_date.getHours();
                        updateTimeLayer();
                        calculatePureDateForServiceFromCurrent();
                        incrementCurrentDay(0);
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
                        linkInit = true;
                        setTimeout(function(){
                            linkInit = false;    
                        },2000);
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
                        time_service.setLayerTime(hs_roadworks_layer, -2); 
                        updateUrlDateTime();
                    }
                    
                    function updateTimeLayerForAnimation(){
                        $scope.current_date.setHours(parseInt($scope.current_hour) + 1);
                        hs_roadworks_layer.date_increment =  $scope.current_date.getTime() - $scope.current_date.getTimezoneOffset() * 60000;
                        time_service.setLayerTime(hs_roadworks_layer, -2); 
                    }
                    
                    $scope.toggleAnimation = function() {
                        if ($scope.current_hour >= 23) return;
                        $scope.animating = !$scope.animating;
                        playHour();
                    }
                    
                    function playHour() {
                        if ($scope.current_hour >= 23) {
                            $scope.animating = false;
                            if (!$scope.$$phase) $scope.$digest();
                        }
                        if (!$scope.animating) return;
                        updateTimeLayerForAnimation();
                        var animationInterval = null;
                        animationInterval = setInterval(function(){
                            if ($scope.layers_loading == 0) intervalCallback();
                        },100);
                        
                        function intervalCallback(){
                            clearInterval(animationInterval);
                            $scope.setCurrentTime(parseInt($scope.current_hour) + 1);
                            setTimeout(function(){
                                playHour();
                            },1000);
                        }
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
                        setTimeout(function(){
                            showPopup(roadwork);
                        },100);
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
                            
                            var ctx2 = canvas2.getContext("2d");
                            var devicePixelRatio = window.devicePixelRatio || 1,
                            backingStoreRatio = ctx2.webkitBackingStorePixelRatio ||
                                                ctx2.mozBackingStorePixelRatio ||
                                                ctx2.msBackingStorePixelRatio ||
                                                ctx2.oBackingStorePixelRatio ||
                                                ctx2.backingStorePixelRatio || 1,

                            ratio = devicePixelRatio / backingStoreRatio;
            
                            canvas2.style.width = (width*ratio) + "px";
                            canvas2.style.height = (height*ratio) + "px";
                            canvas2.width = width*ratio;
                            canvas2.height = height*ratio;
                            
                            ctx2.scale(1/ratio, 1/ratio);
                            width *= ratio;
                            height *= ratio;
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
                        tctx.fillText('Probíhající dopravní stavby:', 5, y);
                        y += 40;
                        tctx.font="12pt Verdana";
                        angular.forEach($scope.roadworklist, function(work){
                            tctx.fillText(work.headline, 5, y);
                            y += 37;
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
                        return 'Předpokládaná dopravní situace v Plzni dne ' + lead(service.day.date()) + '.' + lead(service.day.month() + 1) + '.' + service.day.year() + ' v ' + lead($scope.current_hour) + ':00.';
                    }
                    
                    function lead(what){
                        return ("0"+what).slice(-2)   
                    }
                    
                    function getDescription(url){
                        return getDescriptionWoUrl() + '%0D%0A' + encodeURIComponent(url);
                    }
                    
                    $rootScope.$on('layermanager.layer_loading', function(e, layer){
                        if(layer.get('title') == time_layer_title)
                            $scope.layers_loading = layer.getSource().loadCounter;
                    });
                    
                    $rootScope.$on('layermanager.layer_loaded', function(e, layer){
                        if(layer.get('title') == time_layer_title)
                            $scope.layers_loading = layer.getSource().loadCounter;
                    });
                    
                    
                    $scope.printPdf = printPdf;
                    $scope.shareSocial = shareSocial;
                    $scope.showPermalink = showPermalink;
                    
                    if (permalink_service.getParamValue('year')) initFromLink();
                    
                    /*Popups*/
                    function initInfoDirective(){
                        var el = angular.element('<div hs.pilsentraffic.roadwork-info-directive></div>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    } 
                    
                    initInfoDirective();
                    
                    var popup;
                    
                    function showPopup(roadwork){
                        if (angular.isUndefined(popup)) createPopup();
                        popup.show(ol.proj.transform(roadwork.coordinate, 'EPSG:4326', 'EPSG:3857'), $('#roadwork-info-offline').html());
                        $rootScope.$broadcast('popupOpened','inside');
                    }
                    
                    function createPopup(){
                        popup = new ol.Overlay.Popup();
                        hsmap.map.addOverlay(popup);
                        popup.getElement().className += " popup-headline";
                    }
                    
                    $scope.$on('popupOpened', function(e,source){
                        if (angular.isDefined(source) && source != "inside"  && angular.isDefined(popup)) popup.hide();
                    })
                    
                    $timeout(function(){
                        createLegend();
                        createHelp();
                    },500);
                    function createLegend() {
                        var el = angular.element('<div hs.pilsentraffic.legend></div>');
                        $("#hs-dialog-area").append(el);
                        $compile(el)($scope);
                    }
                    /*function createHelp() {
                        var el = angular.element('<div hs.pilsentraffic.help></div>');
                        $("#hs-dialog-area").append(el);
                        $compile(el)($scope);
                    }*/
                    
                    function createHelp() {
                        var el = angular.element('<div hs.pilsentraffic.helppanel></div>');
                        $(".gui-overlay").append(el);
                        $compile(el)($scope);
                    }
                    
                    $scope.$emit('scope_loaded', "PilsenTraffic");
                }
            ]);
    })
