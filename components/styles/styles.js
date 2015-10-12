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
                    })
                    var me = this;
                }
            ])
    })
