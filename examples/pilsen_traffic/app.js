'use strict';

define(['ol','moment',
        'sidebar',
        //'toolbar',
        'layermanager',
        'query',
        'search',
        'permalink',
        'measure',
        'bootstrap',
        //'geolocation',
        'api',
        'drag',
        'compositions',
        'pilsentraffic',
        'calendar',
        'ngtimeline'
    ],
    function(ol, moment) {
        var module = angular.module('hs', [
            //'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.permalink',
            //'hs.geolocation',
            'hs.api',
            'hs.sidebar',
            'hs.drag',
            'hs.compositions',
            'hs.pilsentraffic',
            'hs.calendar',
            'ngTimeline'
        ]);
        
        module.directive(
            'hs', [
                'hs.map.service', 'Core',
                function(OlMap, Core) {
                    return {
                        templateUrl: hsl_path + 'hslayers.html',
                        link: function(scope, element) {
                            Core.fullScreenMap(element);
                        }
                    };
                }
            ]);

        module.directive('hs.advancedInfopanelDirective', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/advanced_info.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    var possible_height = $(window).height() * 0.85;
                    $('#advanced-info-dialog .modal-body').css('overflow-y', 'auto'); 
                    $('#advanced-info-dialog .modal-body').css('max-height', possible_height);
                    $('timeline').attr('height', possible_height);
                    $('#advanced-info-dialog').modal('show');
                    element.find('.modal-body').append('<timeline control="timeline" height="'+(possible_height - 50)+'" options="options"></timeline>');
                    $compile(element.contents())(scope);
                }
            };
        }]);
    
        module.directive('hs.topmenu', function() {
            return {
                templateUrl: 'partials/top-menu.html?bust=' + gitsha
            };
        });
    
        module.directive('hs.basemapmenu', ['hs.layermanager.service', function(layman) {
            
            function link(scope,element,attrs) {
                scope.data = layman.data;
                
                scope.changeBaseLayerVisibility = function($event,layer) {
                    var pageWrap = $("#content-wrapper");
                    if (layer.title == "Letecká (ČUZK)") {
                        pageWrap.addClass('air');
                    }
                    else {
                        pageWrap.removeClass('air');
                    }
                    layman.changeBaseLayerVisibility($event,layer);
                }
            }
            
            return {
                templateUrl: 'partials/basemap-menu.html?bust=' + gitsha,
                link: link
            };
        }]);
    
        module.directive('hs.trafficmenu', function () {
      
            var controller = ['$scope', function ($scope) {
                
                $scope.trafficLayerChanged = function(item,e) {
                    if (e.target.tagName != "INPUT") return;
                    toggleLayer(item);
                }
                
                $scope.items = [{
                    "label": "Události"
                }, {
                    "label": "Uzavírky"
                }, {
                    "label": "Stupně provozu"
                }];
                
                $scope.items.forEach(function(item){
                    if (angular.isUndefined(item.check)) item.check = false;
                })
                
                $scope.setAll = function(value) {
                    $scope.items.forEach(function(item){
                        item.check = value; 
                        toggleLayer(item);
                    });
                }
                
                $scope.isAll = function(value) {
                    for (var i = 0; i < $scope.items.length; i++) {
                        if ($scope.items[i].check != value) return false;
                    }
                    return true;
                }
                
                function toggleLayer(item) {
                    //item.check === true ? addlayer : removelayer;
                }
            }];

            return {
                restrict: 'A',
                controller: controller,
                templateUrl: 'partials/traffic-menu.html?bust=' + gitsha
            };
          });

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Černobílá (OSM)",
                    base: true,
                    visible: true
                }),
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Základní (OSM)",
                    base: true,
                    visible: false
                }),
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Základní (ČUZK)",
                    base: true,
                    visible: false
                }),
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Letecká (ČUZK)",
                    base: true,
                    visible: false
                }),
                new ol.layer.Image({
                    title: 'Intenzita dopravy v Plzni - květen 2017',
                    source: new ol.source.ImageWMS({
                        url: 'http://gis.lesprojekt.cz/wms/transport/intenzity_dopravy_v_plzni',
                        params: {
                            LAYERS: 'may',
                            INFO_FORMAT: 'text/html',
                            FORMAT: "image/png",
                            "TIME": "2017-05-01T00:00:00.000Z"
                        },
                        crossOrigin: "anonymous"
                    }),
                     "dimensions":{
                        "time": {
                            "name":"time",
                            "units":"ISO8601",
                            "unitSymbol":null,
                            "default":"2017-05-01T00:00:00",
                            "nearestValue":false,
                            "values":"2017-01-01T00:00:00/2099-12-31T00:00:00/PT1H"
                        }
                    },
                    visible: true,
                    popupClass: "popup-headline",
                    queryFilter: function(map, lyr, pixel){
                        var hit = false;
                        map.forEachLayerAtPixel(pixel, function(layer, pixel) {
                            if (lyr == layer) hit = true;
                        },undefined, function(layer) {
                            return layer instanceof ol.layer.Image;
                        });
                        return hit;
                    }
                })
            ],
            default_view: new ol.View({
                center: [1488449.247038074, 6404351.20261046],
                zoom: 13,
                units: "m"
            }),
            showQueryPoint: false
        });

        module.controller('mapReset', ['$scope', 'hs.map.service',
            function($scope, map) {
                $scope.resetView = function() {
                    map.resetView();
                }
        }]);
    
        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', '$timeout', '$http', 'hs.utils.service', 'hs.pilsentraffic.service', '$rootScope',
            function($scope, Core, $compile, hsmap, $timeout, $http, utils, pilsen_service, $rootScope) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.classicSidebar = false;

                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Map') {
                        var map = hsmap.map;
                        var parser = new ol.format.WMTSCapabilities();
                        
                        map.getControls().forEach(function(control){
                            if (control instanceof ol.control.Attribution)
                                control.setCollapsible(false);    
                        });
                        
                        var layers = [
                            {
                                capUrl: 'http://geoportal.cuzk.cz/WMTS_ZM/WMTService.aspx?service=WMTS&request=GetCapabilities',
                                layer: 'zm',
                                matrixSet: 'wgs84:pseudomercator:epsg:3857',
                                title: "Základní (ČUZK)"
                            },
                            {
                                capUrl: 'http://geoportal.cuzk.cz/WMTS_ORTOFOTO/WMTService.aspx?service=WMTS&request=GetCapabilities',
                                layer: 'orto',
                                matrixSet: 'wgs84:pseudomercator:epsg:3857',
                                title: "Letecká (ČUZK)"
                            }
                        ];
                        
                        layers.forEach(function(layer){
                            $.ajax({
                                url: layer.capUrl
                            }).done(function(response) {
                                var result = parser.read(response);
                                var options = ol.source.WMTS.optionsFromCapabilities(result, {
                                    layer: layer.layer,
                                    matrixSet: layer.matrixSet
                                });
                                for (var i = 0; i < options.urls.length; i++) {
                                    options.crossOrigin = "anonymous";
                                    options.attributions = "Podkladová data © ČÚZK";
                                }
                                var newLayer = hsmap.findLayerByTitle(layer.title);
                                var source = new ol.source.WMTS((options));
                                newLayer.setSource(source);
                            });
                        });
                        
                        // Cursor change, based on https://stackoverflow.com/questions/26022029/how-to-change-the-cursor-on-hover-in-openlayers-3 modified for Image layer
                        var target = map.getTarget();
                        var jTarget = typeof target === "string" ? $("#" + target) : $(target);
                        
                        map.on('pointermove', function(evt) {
                            var hit = false;
                            map.forEachLayerAtPixel(evt.pixel, function(layer, pixel) {
                                hit = true;
                            },undefined, function(layer) {
                                return layer instanceof ol.layer.Image;
                            });
                            if (hit) {
                                jTarget.css("cursor", "pointer");
                            } else {
                                jTarget.css("cursor", "");
                            }
                            
                        });
                    }

                    if (args == 'Sidebar') {
                        var el = angular.element('<div id="test3" hs.pilsentraffic.directive ng-controller="hs.pilsentraffic.controller" ng-if="Core.exists(\'hs.pilsentraffic.controller\')" ng-show="Core.panelVisible(\'pilsentraffic\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);                        

                        var toolbar_button = angular.element('<div hs.pilsentraffic.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);

                        Core.setMainPanel('pilsentraffic');
                    }
                });

                $scope.$on('layermanager.updated', function(data, layer) {
                    if (layer.get('base') == true  && layer.get("title") == "Černobílá (OSM)") {
                        //Grayscale map
                        layer.on('postcompose', function(event) {
                            var context = event.context;
                            var canvas = context.canvas;
                            var image = context.getImageData(0, 0, canvas.width, canvas.height);
                            var data = image.data;
                            for (var i = 0, ii = data.length; i < ii; i += 4) {
                                data[i] = data[i + 1] = data[i + 2] = (3 * data[i] + 4 * data[i + 1] + data[i + 2]) / 8;
                            }
                            context.putImageData(image, 0, 0);
                        });
                    }
                });

                function addTopbar() {
                    var el = angular.element('<div hs.topmenu></div>');
                    angular.element(".gui-overlay").append(el);
                    $compile(el)($scope);
                }
                
                angular.element(document).ready(function () {
                    addTopbar();
                });
                
                
                $scope.showDeveloperInfo = function() {
                    $("#hs-dialog-area #advanced-info-dialog").remove();
                    var el = angular.element('<div hs.advanced_infopanel_directive></div>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                    
                    function listenOnTimelineClicks(){
                        function setCurrentDate(minor_tick){
                            pilsen_service.day.set('month', minor_tick.date.data.date_obj.getMonth());
                            pilsen_service.day.set('date', minor_tick.date.data.date_obj.getDate());
                            pilsen_service.day.set('year', minor_tick.date.data.date_obj.getFullYear());
                            $rootScope.$broadcast('date_changed');
                            $('#advanced-info-dialog').modal('hide');
                        }
                        angular.forEach($scope.timeline._timenav.timeaxis.minor_ticks, function(minor_tick){
                            $(minor_tick.tick).click(function(){
                                setCurrentDate(minor_tick);
                            })
                        })
                        angular.forEach($scope.timeline._timenav.timeaxis.major_ticks, function(minor_tick){
                            if($.isNumeric($('span', $(minor_tick.tick)).html()))
                                $('span', $(minor_tick.tick)).html('Led<br/>' + $(minor_tick.tick).html());
                            $(minor_tick.tick).click(function(){
                                setCurrentDate(minor_tick);
                            })
                        })
                        $('.tl-timeaxis-tick-hidden').removeClass('tl-timeaxis-tick-hidden');
                    }
                    
                    $timeout(function () {
                        $scope.timeline.setData(data);
                        $scope.timeline.goTo(1);
                        $('.tl-slide-content').width(870);
                        $('.tl-menubar-button').click(function () {
                            $timeout(function () {listenOnTimelineClicks()}, 500);
                        });
                        listenOnTimelineClicks();
                    }, 200);
                    
                    
                }
                
                
                var data = {
                        'title': {
                            'text': {
                                'headline': 'Časová osa dopravních staveb v Plzni',
                                'text': ''
                            }
                        },
                        'events': []
                };
                        
                $http({
                    method: 'GET',
                    url: utils.proxify('http://otn-caramba.rhcloud.com/get_roadworks/'),
                    cache: false
                }).then(function (response) {
                    response.data.forEach(function(item){
                        var froms = item.dates[0].split('.');
                        var tos = item.dates[1].split('.');
                       data.events.push({
                            'start_date': {
                                'year': froms[2],
                                'month': froms[1],
                                'day': froms[0]
                            },
                            'end_date': {
                                'year': tos[2],
                                'month': tos[1],
                                'day': tos[0]
                            },
                            'text': {
                                'headline': item.name,
                                'text': item.description
                            }}); 
                    })
                });
                    
                $scope.options = {
                    debug: false,
                    timenav_position: 'top',
                    timenav_height_percentage: 70,
                    timenav_mobile_height_percentage: 80,
                    language: 'cz',
                    dragging: true,
                    start_at_slide: 1,
                    data: data
                };

                $scope.$on('layermanager.layer_time_changed', function(evt, layer, d) {
                    angular.forEach(hsmap.map.getLayers(), function(other_layer) {
                        if (other_layer.getSource().updateParams)
                            other_layer.getSource().updateParams({
                                'TIME': d
                            });
                    })
                });

                Core.panelEnabled('compositions', false);
                Core.panelEnabled('status_creator', false);
                Core.panelEnabled('permalink', false);
                Core.panelEnabled('layermanager', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
