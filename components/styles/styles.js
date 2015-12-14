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
                            color: 'rgba(255, 255, 255, 0.2)'
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
                            color: 'rgba(255, 255, 255, 0.2)'
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
    })
