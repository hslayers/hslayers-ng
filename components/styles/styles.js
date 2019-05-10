/**
 * @namespace hs.styles
 * @memberOf hs
 */
define(['angular', 'ol'],

    function(angular, ol) {
        angular.module('hs.styles', ['hs.map'])
            /**
            * DEPRECATED?
            * @memberof hs.styles
            * @ngdoc service
            * @name hs.styles.service
            * @description Service with definition of basic styles used througout HS-LayersNG
            */
            .service("hs.styles.service", ['$http', 'config',
                function($http, config) {
                    this.pin_white_blue = new ol.style.Style({
                        image: new ol.style.Icon({
                            src: config.hsl_path + 'img/pin_white_blue32.png',
                            crossOrigin: 'anonymous',
                            anchor: [0.5, 1]
                        })
                    });

                    this.pin_white_blue_highlight = function(feature, resolution) {
                        return [new ol.style.Style({
                            image: new ol.style.Icon({
                                src: feature.get('highlighted') ? config.hsl_path + 'img/pin_white_red32.png' : config.hsl_path + 'img/pin_white_blue32.png',
                                crossOrigin: 'anonymous',
                                anchor: [0.5, 1]
                            })
                        })]
                    };

                    this.measure_style = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgbaa(255, 255, 255, 1)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: '#ffcc33'
                            })
                        })
                    });
                    this.simple_style = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgbaa(255, 255, 255, 1)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 1
                        }),
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: '#ffcc33'
                            })
                        })
                    });
                    var me = this;
                }
            ])
        
        /**
        * @memberof hs.styles
        * @ngdoc directive
        * @name hs.styler.directive
        * @description Display styling menu for layer
        */
        .directive('hs.styler.directive', ['config', function (config) {
            return {
                template: require('components/styles/partials/styler.html')
            };
        }])

        /**
        * @memberof hs.styles
        * @ngdoc directive
        * @name hs.styler.colorDirective
        * @description Display color selector for styling menu
        */
        .directive('hs.styler.colorDirective', ['config', function (config) {
            return {

                scope: {
                    color: '=info'
                },
                link: function(scope, elem, attrs) {
                    scope.colors = [{
                        'background-color': 'rgba(244, 235, 55, 1)'
                    }, {
                        'background-color': 'rgba(205, 220, 57, 1)'
                    }, {
                        'background-color': 'rgba(98, 175, 68, 1)'
                    }, {
                        'background-color': 'rgba(0, 157, 87, 1)'
                    }, {
                        'background-color': 'rgba(11, 169, 204, 1)'
                    }, {
                        'background-color': 'rgba(65, 134, 240, 1)'
                    }, {
                        'background-color': 'rgba(63, 91, 169, 1)'
                    }, {
                        'background-color': 'rgba(124, 53, 146, 1)'
                    }, {
                        'background-color': 'rgba(166, 27, 74, 1)'
                    }, {
                        'background-color': 'rgba(219, 68, 54, 1)'
                    }, {
                        'background-color': 'rgba(248, 151, 27, 1)'
                    }, {
                        'background-color': 'rgba(244, 180, 0, 1)'
                    }, {
                        'background-color': 'rgba(121, 80, 70, 1)'
                    }, {
                        'background-color': 'rgba(249, 247, 166, 1)'
                    }, {
                        'background-color': 'rgba(230, 238, 163, 1)'
                    }, {
                        'background-color': 'rgba(183, 219, 171, 1)'
                    }, {
                        'background-color': 'rgba(124, 207, 169, 1)'
                    }, {
                        'background-color': 'rgba(147, 215, 232, 1)'
                    }, {
                        'background-color': 'rgba(159, 195, 255, 1)'
                    }, {
                        'background-color': 'rgba(167, 181, 215, 1)'
                    }, {
                        'background-color': 'rgba(198, 164, 207, 1)'
                    }, {
                        'background-color': 'rgba(214, 152, 173, 1)'
                    }, {
                        'background-color': 'rgba(238, 156, 150, 1)'
                    }, {
                        'background-color': 'rgba(250, 209, 153, 1)'
                    }, {
                        'background-color': 'rgba(255, 221, 94, 1)'
                    }, {
                        'background-color': 'rgba(178, 145, 137, 1)'
                    }, {
                        'background-color': 'rgba(255, 255, 255, 1)'
                    }, {
                        'background-color': 'rgba(204, 204, 204, 1)'
                    }, {
                        'background-color': 'rgba(119, 119, 119, 1)'
                    }, {
                        'background-color': 'rgba(0, 0, 0, 1)'
                    }];
                    scope.colorSelected = function(col) {
                        scope.color = col;
                    }
                },
                template: require('components/styles/partials/color.html')
            };
        }])

        /**
        * @memberof hs.styles
        * @ngdoc service
        * @name hs.styler.service
        * @description Contain current styled layer
        */
        .service("hs.styler.service", [
            function() {
                this.layer = null;
            }
        ])

        /**
        * @memberof hs.styles
        * @ngdoc controller
        * @name hs.styler.controller
        */
        .controller('hs.styler.controller', ['$scope', 'hs.styler.service', '$sce', 'Core', '$http',
            function($scope, service, $sce, Core, $http) {
                $scope.service = service;
                $scope.icons = null;
                $scope.imagetypes = [{
                    name: 'none',
                    hrname: 'None'
                }, {
                    name: 'icon',
                    hrname: 'Icon'
                }, {
                    name: 'circle',
                    hrname: 'Circle'
                }];
                $scope.imagetype = $scope.imagetypes[0].name;
                $scope.radius = 5;
                $scope.linewidth = 2;
                $scope.iconlinewidth = 2;
                /**
                 * @function save
                 * @memberOf hs.styler.controller
                 * @description Get current style variables value and style current layer accordingly
                 */
                $scope.save = function() {
                    if (service.layer == null) return;
                    var style_json = {};
                    if (angular.isDefined($scope.fillcolor) && $scope.fillcolor != null) {
                        style_json.fill = new ol.style.Fill({
                            color: $scope.fillcolor['background-color']
                        })
                    }
                    if (angular.isDefined($scope.linecolor) && $scope.linecolor != null && $scope.linewidth > 0) {
                        style_json.stroke = new ol.style.Stroke({
                            color: $scope.linecolor['background-color'],
                            width: angular.isDefined($scope.linewidth) ? parseFloat($scope.linewidth) : 1
                        })
                    }
                    if ($scope.imagetype != 'none') {
                        if ($scope.imagetype == 'circle' && (angular.isDefined($scope.iconfillcolor) || angular.isDefined($scope.iconlinecolor))) {
                            var circle_json = {
                                radius: angular.isDefined($scope.radius) ? parseFloat($scope.radius) : 5
                            };
                            if (angular.isDefined($scope.iconfillcolor) && $scope.iconfillcolor != null) {
                                circle_json.fill = new ol.style.Fill({
                                    color: $scope.iconfillcolor['background-color']
                                });
                            }
                            if (angular.isDefined($scope.iconlinecolor) && $scope.iconlinecolor != null && angular.isDefined($scope.iconlinewidth) && $scope.iconlinewidth > 0) {
                                circle_json.stroke = new ol.style.Stroke({
                                    color: $scope.iconlinecolor['background-color'],
                                    width: $scope.iconlinewidth,
                                    radius: angular.isDefined($scope.radius) ? parseFloat($scope.radius) : 5
                                })
                            }
                            style_json.image = new ol.style.Circle(circle_json);
                        }
                        if ($scope.imagetype == 'icon' && angular.isDefined($scope.serialized_icon)) {
                            var img = new Image();
                            img.src = $scope.serialized_icon;
                            img.onload = function() {
                                var icon_json = {
                                    img: img,
                                    imgSize: [img.width, img.height],
                                    anchor: [0.6, 0.8],
                                    crossOrigin: 'anonymous'
                                };
                                style_json.image = new ol.style.Icon(icon_json);
                                angular.forEach(service.layer.getSource().getFeatures(), function(f) {
                                    f.setStyle(null);
                                });
                                service.layer.setStyle(new ol.style.Style(style_json));
                            }
                        }
                    }
                    if (angular.isDefined(style_json.fill) || angular.isDefined(style_json.stroke) || angular.isDefined(style_json.image)) {
                        var style = new ol.style.Style(style_json);
                        angular.forEach(service.layer.getSource().getFeatures(), function(f) {
                            f.setStyle(null);
                        })
                        service.layer.setStyle(style);
                    }
                }

                /**
                 * @function iconSelected
                 * @memberOf hs.styler.controller
                 * @param {String} i Icon name
                 * @description Load selected SVG icon from folder and use it for layer
                 */
                $scope.iconSelected = function(i) {
                    $http({ url: $scope.hsl_path + 'components/styles/img/svg/' + i }).
                    then(function (response) {
                        $scope.iconimage = $sce.trustAsHtml(response.data);
                        colorIcon();
                        $scope.save()
                    }, function (err){

                    });
                }

                /**
                 * @function colorIcon
                 * @memberOf hs.styler.controller
                 * @description Change colors of selected icon based on user input. Decode modifyied icon into Base-64
                 */
                function colorIcon() {
                    var iconPreview = document.getElementsByClassName('hs-styler-selected-icon-box')[0];
                    var svgPath = iconPreview.querySelector('path');
                    if (angular.isDefined($scope.iconfillcolor) && $scope.iconfillcolor != null) svgPath.style.fill = $scope.iconfillcolor['background-color'];
                    if (angular.isDefined($scope.iconlinecolor) && $scope.iconlinecolor != null) svgPath.style.stroke = $scope.iconlinecolor['background-color'];
                    if (angular.isDefined($scope.iconlinewidth) && $scope.iconlinewidth != null) svgPath.style.strokeWidth = $scope.iconlinewidth;
                    $scope.serialized_icon = 'data:image/svg+xml;base64,' + window.btoa(iconPreview.innerHTML);
                }

                /**
                 * @function setImageType
                 * @memberOf hs.styler.controller
                 * @params {String} t New image type
                 * @description Change image type for point geometry and redraw style
                 */
                $scope.setImageType = function(t) {
                    $scope.imagetype = t;
                    $scope.save();
                }

                $scope.$watch('linecolor', $scope.save);
                $scope.$watch('service.layer', updateHasVectorFeatures);

                /**
                 * @function updateHasVectorFeatures
                 * @memberOf hs.styler.controller
                 * @description (PRIVATE) Get geometry type and title for selected layer
                 */
                function updateHasVectorFeatures() {
                    if (service.layer == null) return;
                    var src = service.layer.getSource();
                    if (angular.isUndefined(service.layer) || service.layer == null) return;
                    if(angular.isUndefined(src.hasLine)) 
                        calculateHasLinePointPoly(src);
                    $scope.hasLine = src.hasLine;
                    $scope.hasPoly = src.hasPoly;
                    $scope.hasPoint = src.hasPoint;
                    $scope.layerTitle = service.layer.get('title');
                }
                
                /**
                 * @function calculateHasLinePointPoly
                 * @memberOf hs.styler.controller
                 * @description (PRIVATE) Calculate vector type if not specified in layer metadata
                 */
                function calculateHasLinePointPoly(src){
                        src.hasLine = false;
                        src.hasPoly = false;
                        src.hasPoint = false;
                        angular.forEach(src.getFeatures(), function(f) {
                            if (f.getGeometry()) {
                                switch (f.getGeometry().getType()) {
                                    case 'LineString' || 'MultiLineString':
                                        src.hasLine = true;
                                        break;
                                    case 'Polygon' || 'MultiPolygon':
                                        src.hasPoly = true;
                                        break;
                                    case 'Point' || 'MultiPoint':
                                        src.hasPoint = true;
                                        break;
                                }
                            }
                        })   
                }

                $scope.$watch('fillcolor', $scope.save);
                $scope.$watch('iconfillcolor', function() {
                    if ($scope.imagetype == 'icon') colorIcon();
                    $scope.save()
                });
                $scope.$watch('iconlinecolor', function() {
                    if ($scope.imagetype == 'icon') colorIcon();
                    $scope.save()
                });
                $scope.$watch('iconlinewidth', function() {
                    if ($scope.imagetype == 'icon') colorIcon();
                    $scope.save()
                });
                $scope.$watch('radius', function() {
                    $scope.save()
                });

                $scope.$on('core.mainpanel_changed', function(e, panel) {
                    if (Core.mainpanel == 'styler' && $scope.icons == null) {
                        $scope.icons = ["bag1.svg", "banking4.svg", "bar.svg", "beach17.svg", "bicycles.svg", "building103.svg", "bus4.svg", "cabinet9.svg", "camping13.svg", "caravan.svg", "church15.svg", "church1.svg", "coffee-shop1.svg", "disabled.svg", "favourite28.svg", "football1.svg", "footprint.svg", "gift-shop.svg", "gps40.svg", "gps41.svg", "gps42.svg", "gps43.svg", "gps5.svg", "hospital.svg", "hot-air-balloon2.svg", "information78.svg", "library21.svg", "location6.svg", "luggage13.svg", "monument1.svg", "mountain42.svg", "museum35.svg", "park11.svg", "parking28.svg", "pharmacy17.svg", "port2.svg", "restaurant52.svg", "road-sign1.svg", "sailing-boat2.svg", "ski1.svg", "swimming26.svg", "telephone119.svg", "toilets2.svg", "train-station.svg", "university2.svg", "warning.svg", "wifi8.svg"];
                    }
                    updateHasVectorFeatures();
                });

                $scope.$emit('scope_loaded', "styler");
            }
        ]);
    })
