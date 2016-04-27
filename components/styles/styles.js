/**
 * @namespace hs.search
 * @memberOf hs
 */
define(['angular', 'ol'],

    function(angular, ol) {
        angular.module('hs.styles', ['hs.map'])
            .service("hs.styles.service", ['$http',
                function($http) {
                    this.pin_white_blue = new ol.style.Style({
                        image: new ol.style.Icon({
                            src: hsl_path + 'img/pin_white_blue32.png',
                            crossOrigin: 'anonymous',
                            anchor: [0.5, 1]
                        })
                    });

                    this.pin_white_blue_highlight = function(feature, resolution) {
                        return [new ol.style.Style({
                            image: new ol.style.Icon({
                                src: feature.get('highlighted') ? hsl_path + 'img/pin_white_red32.png' : hsl_path + 'img/pin_white_blue32.png',
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

        .directive('hs.styler.directive', function() {
            return {
                templateUrl: hsl_path + 'components/styles/partials/styler.html?bust=' + gitsha
            };
        })

        .directive('hs.styler.colorDirective', function() {
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
                templateUrl: hsl_path + 'components/styles/partials/color.html?bust=' + gitsha
            };
        })

        .service("hs.styler.service", [
            function() {
                this.layer = null;
            }
        ])

        .controller('hs.styler.controller', ['$scope', 'hs.styler.service', '$sce', 'Core',
            function($scope, service, $sce, Core) {
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

                $scope.iconSelected = function(i) {
                    $.ajax({
                        url: $scope.hsl_path + 'components/styles/img/svg/' + i,
                        cache: true,
                        success: function(r) {
                            $scope.iconimage = $sce.trustAsHtml(r.documentElement.outerHTML);
                            if (!$scope.$$phase) $scope.$digest();
                            colorIcon();
                            $scope.save()
                        }
                    });

                }

                function colorIcon() {
                    var $b =
                        $('.hs-styler-selected-icon-box path');
                    if (angular.isDefined($scope.iconfillcolor) && $scope.iconfillcolor != null) $b.css('fill', $scope.iconfillcolor['background-color'])
                    if (angular.isDefined($scope.iconlinecolor) && $scope.iconlinecolor != null) $b.css('stroke', $scope.iconlinecolor['background-color'])
                    if (angular.isDefined($scope.iconlinewidth) && $scope.iconlinewidth != null) $b.css('stroke-width', $scope.iconlinewidth);
                    $scope.serialized_icon = 'data:image/svg+xml;base64,' + window.btoa($('.hs-styler-selected-icon-box').html());
                }

                $scope.setImageType = function(t) {
                    $scope.imagetype = t;
                    $scope.save();
                }

                $scope.$watch('linecolor', $scope.save);
                $scope.$watch('service.layer', function() {
                    if (angular.isUndefined(service.layer) || service.layer == null) return;
                    $scope.hasLine = service.layer.getSource().hasLine;
                    $scope.hasPoly = service.layer.getSource().hasPoly;
                    $scope.hasPoint = service.layer.getSource().hasPoint;
                    $scope.layerTitle = service.layer.get('title');

                });
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
                        $scope.icons = ["bag1.svg", "banking4.svg", "bar.svg", "beach17.svg", "bicycles.svg", "building103.svg", "bus4.svg", "cabinet9.svg", "camping13.svg", "caravan.svg", "church15.svg", "church1.svg", "coffee-shop1.svg", "disabled.svg", "favourite28.svg", "football1.svg", "footprint.svg", "gift-shop.svg", "gps35.svg", "gps36.svg", "gps37.svg", "gps40.svg", "gps41.svg", "gps42.svg", "gps43.svg", "gps5.svg", "hospital.svg", "hot-air-balloon2.svg", "information78.svg", "library21.svg", "location4.svg", "location6.svg", "luggage12.svg", "luggage13.svg", "map-pointer7.svg", "map-pointer8.svg", "monument1.svg", "mountain42.svg", "museum35.svg", "park11.svg", "parking28.svg", "pharmacy17.svg", "pin10.svg", "pin63.svg", "pin65.svg", "police-station.svg", "port2.svg", "restaurant52.svg", "road-sign1.svg", "sailing-boat2.svg", "ski1.svg", "swimming26.svg", "telephone119.svg", "toilets2.svg", "train-station.svg", "university2.svg", "warning.svg", "wifi8.svg"];
                    }
                });

                $scope.$emit('scope_loaded', "styler");
            }
        ]);
    })
