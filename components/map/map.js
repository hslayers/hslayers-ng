/**
 * @namespace hs.map
 * @memberOf hs
 */
define(['angular', 'app', 'permalink', 'ol'], function(angular, app, permalink, ol) {
    angular.module('hs.map', ['hs'])

    /**
     * @ngdoc service
     * @name hs.map.service
     * @memberOf hs.map
     * @param {object} config - Application configuration
     * @description Service for containing and initializing map object
     */
    .service('hs.map.service', ['config', '$rootScope', 'hs.utils.service', function(config, $rootScope, utils) {
        this.init = function(){
            me.map = new ol.Map({
                target: 'map',
                interactions: [],
                view: config.default_view
            });
            
            function extentChanged(e){
                if (timer != null) clearTimeout(timer);
                timer = setTimeout(function() {
                    $rootScope.$broadcast('map.extent_changed', e.element, me.map.getView().calculateExtent(me.map.getSize()));
                }, 500);   
            }
            me.map.getView().on('change:center', function(e) {
                extentChanged(e);
            });
            me.map.getView().on('change:resolution', function(e) {
                extentChanged(e);
            });
            
            me.map.on('moveend', function(e) {
                extentChanged(e);
            });
            
            angular.forEach(me.interactions, function(value, key) {
                me.map.addInteraction(value);
            });
            //me.map.addControl(new ol.control.ZoomSlider());
            me.map.addControl(new ol.control.ScaleLine());
            $rootScope.$broadcast('map.loaded');
        }
        
        this.duration = 400;

        this.interactions = {
            'DoubleClickZoom': new ol.interaction.DoubleClickZoom({
                duration: this.duration
            }),
            'KeyboardPan': new ol.interaction.KeyboardPan({
                pixelDelta: 256
            }),
            'KeyboardZoom': new ol.interaction.KeyboardZoom({
                duration: this.duration
            }),
            'MouseWheelZoom': new ol.interaction.MouseWheelZoom({
                duration: this.duration
            }),
            'PinchRotate': new ol.interaction.PinchRotate(),
            'PinchZoom': new ol.interaction.PinchZoom({
                constrainResolution: true,
                duration: this.duration
            }),
            'DragPan': new ol.interaction.DragPan({
                kinetic: new ol.Kinetic(-0.01, 0.1, 200)
            }),
            'DragZoom': new ol.interaction.DragZoom(),
            'DragRotate': new ol.interaction.DragRotate()
        }

        var me = this;

        /**
         * @function findLayerByTitle
         * @memberOf hs.map.service (Olmap)
         * @param {string} title Title of the layer which was specified as a option when creating the layer
         * @description Finds a layer by its title and returns the last one if multiple are found
         */
        this.findLayerByTitle = function(title) {


            var layers = me.map.getLayers();
            var tmp = null;
            angular.forEach(layers, function(layer) {
                if (layer.get('title') == title) tmp = layer;
            });
            return tmp;
        }

        var mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(4),
            undefinedHTML: '&nbsp;'
        });

        /**
         * @function repopulateLayers
         * @memberOf hs.map.service (Olmap)
         * @param {object} visible_layers List of layers, which should be visible. When not specified, all layers get visible.
         * @description Read all layers from app config to the map
         */
        this.repopulateLayers = function(visible_layers) {
            if (angular.isDefined(config.box_layers)) {
                angular.forEach(config.box_layers, function(box) {
                    angular.forEach(box.get('layers'), function(lyr) {
                        lyr.setVisible(me.isLayerVisibleInPermalink(lyr, me.visible_layers));
                        lyr.manuallyAdded = false;
                        me.map.addLayer(lyr);
                    });
                });
            }

            if (angular.isDefined(config.default_layers)) {
                angular.forEach(config.default_layers, function(lyr) {
                    lyr.setVisible(me.isLayerVisibleInPermalink(lyr, me.visible_layers));
                    lyr.manuallyAdded = false;
                    me.map.addLayer(lyr);
                });
            }
        }

        /**
         * @function reset
         * @memberOf hs.map.service (Olmap)
         * @description Reset map to state configured in app config (reload all layers and set default view)
         */
        this.reset = function() {
            var to_be_removed = [];
            me.map.getLayers().forEach(function(lyr) {
                to_be_removed.push(lyr);
            });
            while (to_be_removed.length > 0) me.map.removeLayer(to_be_removed.shift());
            me.repopulateLayers(null);
            me.map.setView(config.default_view);
        }

        var timer;
       
        /**
         * @function isLayerVisibleInPermalink
         * @memberOf hs.map.controller.init
         * @param {ol.Layer} lyr - Layer for which to determine visibility
         * @description Finds out if layer is set as visible in URL (permalink)
         */
        this.isLayerVisibleInPermalink = function(lyr, visible_layers) {
            if (visible_layers) {
                var found = false;
                angular.forEach(visible_layers, function(vlyr) {
                    if (vlyr == lyr.get('title')) found = true;
                })
                return found;
            }
            return lyr.getVisible();
        }

        /**
         * @function proxifyLayerLoader
         * @memberOf hs.map.service (Olmap)
         * @param {Ol.layer} lyr Layer to proxify
         * @param {Boolean} tiled Info if layer is tiled
         * @description Proxify layer loader
         */
        this.proxifyLayerLoader = function(lyr, tiled) {
            var src = lyr.getSource();
            if (tiled) {
                var tile_url_function = src.getTileUrlFunction() || src.tileUrlFunction();
                src.setTileUrlFunction(function(b, c, d) {
                    return utils.proxify(decodeURIComponent(tile_url_function(b, c, d)));
                });
            } else {
                lyr.getSource().setImageLoadFunction(function(image, src) {
                    image.getImage().src = utils.proxify(src); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
                })
            }
        }

        //map.addControl(mousePositionControl);
        /**
         * @function puremap
         * @memberOf hs.map.service (Olmap)
         * @description Clean interactions and zoom from map to get pure map
         */
        this.puremap = function() {
            var interactions = this.map.getInteractions();
            var controls = this.map.getControls();
            angular.forEach(interactions, function(interaction){
                me.map.removeInteraction(interaction);
            })
            angular.forEach(controls, function(control){
                me.map.removeControl(control);
            })
        }

    }])

    /**
     * @ngdoc directive
     * @name hs.map.directive
     * @memberOf hs.map
     */
    .directive('hs.map.directive', ['Core', function(Core) {
        return {
            templateUrl: hsl_path + 'components/map/partials/map.html?bust=' + gitsha,
            link: function(scope, element) {
                $(".ol-zoomslider", element).width(28).height(200);
            }
        };
    }])

    /**
     * @ngdoc controller
     * @name hs.map.controller
     * @memberOf hs.map
     */
    .controller('hs.map.controller', ['$scope', 'hs.map.service', 'config', 'hs.permalink.service_url', 'Core',
        function($scope, OlMap, config, permalink, Core) {
            var map = OlMap.map;           
            /**
             * @function moveToAndZoom
             * @memberOf hs.map.controller
             * @param {number} x X coordinate of new center
             * @param {number} y Y coordinate of new center
             * @param {number} zoom New zoom level
             * @description Move map and zoom to specified coordinate/zoom level
             */
            $scope.moveToAndZoom = function(x, y, zoom) {
                var view = OlMap.map.getView();
                view.setCenter([x, y]);
                view.setZoom(zoom);
            }

            /**
             * @function getMap
             * @memberOf hs.map.controller
             * @description Gets OpenLayers map object
             * @returns {ol.Map}
             */
            $scope.getMap = function() {
                return OlMap.map;
            }

            /**
             * @function setTargetDiv
             * @memberOf hs.map.controller
             * @description Sets div element of the map
             * @param {string} div_id ID pf the container element
             * @returns {ol.Map}
             */
            $scope.setTargetDiv = function(div_id) {
                OlMap.map.setTarget(div_id);
            }

            /**
             * @function findLayerByTitle
             * @memberOf hs.map.controller
             * @param {string} title - title of the layer which was specified as a option when creating the layer
             * @description Finds a layer by its title and returns the last one if multiple are found
             * @link hs.map.OlMap.findLayerByTitle
             */
            $scope.findLayerByTitle = OlMap.findLayerByTitle;

            /**
             * @function findLayerByTitle
             * @memberOf hs.map.controller
             * @description Unfinished
             */
            $scope.showFeaturesWithAttrHideRest = function(source, attribute, value, attr_to_change, invisible_value, visible_value) {

            }

            /**
             * @function init
             * @memberOf hs.map.controller
             * @description Syntactic sugar for initialization
             */
            $scope.init = function() {
                OlMap.init();
                if (permalink.getParamValue('visible_layers')) {
                    OlMap.visible_layers = permalink.getParamValue('visible_layers').split(';');
                }
                OlMap.repopulateLayers();
                hs_x = permalink.getParamValue('hs_x');
                hs_y = permalink.getParamValue('hs_y');
                hs_z = permalink.getParamValue('hs_z');
                if (hs_x && hs_x != 'NaN' && hs_y && hs_y != 'NaN' && hs_z && hs_z != 'NaN') {
                    $scope.moveToAndZoom(parseFloat(hs_x), parseFloat(hs_y), parseInt(hs_z));
                }

                if (permalink.getParamValue('permalink')) {
                    permalink.parsePermalinkLayers();
                }
                if (permalink.getParamValue("puremap")) {
                    Core.puremapApp = true;
                    OlMap.puremap();
                }
                $scope.setTargetDiv("map");
            }

            $scope.init();
            $scope.$emit('scope_loaded', "Map");
        }
    ]);
})
