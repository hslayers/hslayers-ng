/**
 * @namespace hs.measure
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],

    function (angular, ol) {
        angular.module('hs.game.vectorLabel', ['hs.map', 'hs.core'])

        .service("hs.game.vectorLabelService", ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'config',
                function ($rootScope, OlMap, Core, utils, config) {
                var me = this;

                var map;

                var layerStyles;

                this.createLabels = function (options) {
                    if (angular.isUndefined(options) || angular.isUndefined(options.layer) || (angular.isUndefined(options.label) && angular.isUndefined(options.labelExpression))) {
                        console.log("Mandatory parameter missing");
                        return;
                    }

                    var layer = options.layer;

                    var oldStyle = layer.getStyle();
                    if (typeof oldStyle == "function") oldStyle = oldStyle();
                    oldStyle = oldStyle[0];
                    oldStyle = oldStyle.clone();
                    
                    layer.set('label',options.label);
                    
                    function createStyle(feature) {
                        var textStyle = new ol.style.Text({
                            font: angular.isDefined(options.font) ? options.font : undefined,
                            text: angular.isDefined(feature) ? feature.get(options.label) : '',
                            textAlign: angular.isDefined(options.textAlign) ? options.textAlign : undefined,
                            textBaseline: angular.isDefined(options.textBaseline) ? options.textBaseline : undefined,
                            fill: new ol.style.Fill({
                                color: angular.isDefined(options.fillColor) ? options.fillColor : undefined
                            }),
                            stroke: new ol.style.Stroke({
                                color: angular.isDefined(options.strokeColor) ? options.strokeColor : undefined,
                                width: angular.isDefined(options.width) ? options.width : undefined
                            }),
                            offsetX: angular.isDefined(options.offsetX) ? options.offsetX : undefined,
                            offsetY: angular.isDefined(options.offsetY) ? options.offsetY : undefined,
                            rotation: angular.isDefined(options.rotation) ? options.rotation : undefined
                        });
                        
                        if (angular.isDefined(options.hideMarker)) 
                            var style = new ol.style.Style;
                        else var style = oldStyle;
                        
                        style.setText(textStyle);
                        
                        return [style];
                    }
                    
                    layer.setStyle(createStyle);
                }

                function init() {
                    map = OlMap.map;
                }

                if (angular.isDefined(OlMap.map)) {
                    init();
                } else {
                    $rootScope.$on('map.loaded', function () {
                        init();
                    });
                }

                return me;
                        }]);
    })