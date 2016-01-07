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
                templateUrl: hsl_path + 'components/styles/partials/styler.html'
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
                templateUrl: hsl_path + 'components/styles/partials/color.html'
            };
        })

        .service("hs.styler.service", [
            function() {
                this.layer = null;
            }
        ])

        .controller('hs.styler.controller', ['$scope', 'hs.styler.service',
            function($scope, service) {
                $scope.imagetypes = [{
                        name: 'none',
                        hrname: 'None'
                    },
                    /* {
                                        name: 'icon',
                                        hrname: 'Icon'
                                    },*/
                    {
                        name: 'circle',
                        hrname: 'Circle'
                    }
                ];
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
                    }
                    var style = new ol.style.Style(style_json);
                    angular.forEach(service.layer.getSource().getFeatures(), function(f) {
                        f.setStyle(null);
                    })
                    service.layer.setStyle(style);
                }

                $scope.setImageType = function(t) {
                    $scope.imagetype = t;
                    $scope.save();
                }

                $scope.$watch('linecolor', $scope.save);
                $scope.$watch('fillcolor', $scope.save);
                $scope.$watch('iconfillcolor', $scope.save);
                $scope.$watch('iconlinecolor', $scope.save);

                $scope.$emit('scope_loaded', "styler");
            }
        ]);
    })
