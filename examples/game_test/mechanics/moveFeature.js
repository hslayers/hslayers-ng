/**
 * @namespace hs.measure
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],

    function(angular, ol) {
        angular.module('hs.game.moveFeature', ['hs.map', 'hs.core'])

        .service("hs.game.moveFeatureService", ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'config',
                function ($rootScope, OlMap, Core, utils, config) {
            var me = this;
            
            var map, select, translate;
            
            this.activate = function(options) {
                var layers = [];
                if (angular.isDefined(options) && angular.isDefined(options.layers)) {
                    for (var i = 0; i < options.layers.length; i++) {
                        layers.push(OlMap.findLayerByTitle(options.layers[i]));
                    }
                }
                
                select = new ol.interaction.Select({
                    condition: ol.events.condition.pointerMove,
                    layers: layers.length > 0 ? layers : undefined,
                    style: selectStyle
                });

                translate = new ol.interaction.Translate({
                    features: select.getFeatures(),
                    condition: ol.events.condition.primaryAction
                });
                
                translate.on('translatestart', function(){
                    select.setActive(false);
                });
                
                translate.on('translateend', function(){
                    select.setActive(true);
                });
                
                map.addInteraction(select);
                map.addInteraction(translate);
            }
                    
            this.deactivate = function() {
                map.removeInteraction(select);
                map.removeInteraction(translate);
            }
            
            function selectStyle(feature){
                var featureStyle = feature.getStyle() || feature.getLayer(OlMap.map).getStyle();
                if (typeof featureStyle == "function") featureStyle = featureStyle(feature);
                
                if (angular.isDefined(featureStyle[0])) featureStyle = featureStyle[0];
                featureStyle = featureStyle.clone();
                
                if (angular.isDefined(featureStyle.getStroke()) && featureStyle.getStroke() != null) { 
                    var stroke = featureStyle.getStroke().clone();
                    stroke.setWidth(stroke.getWidth() + 2);
                    stroke.setColor('#b5f0fd');
                    featureStyle.setStroke(stroke);
                }
                
                if (angular.isDefined(featureStyle.getText()) && featureStyle.getText() != null) {
                    var text = featureStyle.getText().clone();
                    text.getStroke().setColor('#b5f0fd');
                    text.getStroke().setWidth(2);
                    text.setText(feature.get(feature.getLayer(OlMap.map).get('label')));
                    featureStyle.setText(text);
                }
                
                return featureStyle;
            }
            
            function init() {
                map = OlMap.map;
            }

            if (angular.isDefined(OlMap.map)) {
                init();
            }
            else {
                $rootScope.$on('map.loaded', function () {
                    init();
                });
            }

            return me;
        }]);
    })
