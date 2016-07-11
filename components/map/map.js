/**
 * @namespace hs.map
 * @memberOf hs
 */
define(['angular', 'app', 'permalink', 'ol'], function(angular, app, permalink, ol) {
    angular.module('hs.map', ['hs'])

    /**
     * @class hs.map.service
     * @memberOf hs.map
     * @param {object} config - Application configuration
     * @description Service for containing and initializing map object
     */
    .service('hs.map.service', ['config', '$rootScope', function(config, $rootScope) {
        this.map = new ol.Map({
            target: 'map',
            interactions: [],
            view: jQuery.extend(true, {}, config.default_view)
        });

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
         * @memberOf hs.map.OlMap
         * @param {string} title - title of the layer which was specified as a option when creating the layer
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

        angular.forEach(this.interactions, function(value, key) {
            me.map.addInteraction(value);
        });
        //me.map.addControl(new ol.control.ZoomSlider());
        me.map.addControl(new ol.control.ScaleLine());
        var mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(4),
            undefinedHTML: '&nbsp;'
        });

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

        this.reset = function() {
            var to_be_removed = [];
            me.map.getLayers().forEach(function(lyr) {
                to_be_removed.push(lyr);
            });
            while (to_be_removed.length > 0) me.map.removeLayer(to_be_removed.shift());
            me.repopulateLayers(null);
            me.map.setView(jQuery.extend(true, {}, config.default_view));
        }

        var timer;
        me.map.getView().on('change:center', function(e) {
            if (timer != null) clearTimeout(timer);
            timer = setTimeout(function() {
                $rootScope.$broadcast('map.extent_changed', e.element);
            }, 500);
        });
        me.map.getView().on('change:resolution', function(e) {
            if (timer != null) clearTimeout(timer);
            timer = setTimeout(function() {
                $rootScope.$broadcast('map.extent_changed', e.element, me.map.getView().calculateExtent(me.map.getSize()));
            }, 500);
        });

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

        //map.addControl(mousePositionControl);

    }])

    .directive('hs.map.directive', ['Core', function(Core) {
        return {
            templateUrl: hsl_path + 'components/map/partials/map.html?bust=' + gitsha,
            link: function(scope, element) {
                $(".ol-zoomslider", element).width(28).height(200);
            }
        };
    }])

    .controller('hs.map.controller', ['$scope', 'hs.map.service', 'config', 'hs.permalink.service_url', 'Core',
        function($scope, OlMap, config, permalink, Core) {
            var map = OlMap.map;

            /**
             * @function moveToAndZoom
             * @memberOf hs.map.controller
             * @param {number} x -
             * @param {number} y -
             * @param {number} zoom -
             * @description Move map and zoom to specified coordiante/zoom level
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
             * @param {string} div_id - ID pf the container element
             * @returns {ol.Map}
             */
            $scope.setTargetDiv = function(div_id) {
                OlMap.map.setTarget(div_id);
            }

            /**
             * @function findLayerByTitle
             * @memberOf hs.map.OlMap
             * @param {string} title - title of the layer which was specified as a option when creating the layer
             * @description Finds a layer by its title and returns the last one if multiple are found
             * @link hs.map.OlMap.findLayerByTitle
             */
            $scope.findLayerByTitle = OlMap.findLayerByTitle;

            $scope.showFeaturesWithAttrHideRest = function(source, attribute, value, attr_to_change, invisible_value, visible_value) {

            }

            /**
             * @function init
             * @memberOf hs.map.controller
             * @description Syntactic sugar for initialization
             */
            $scope.init = function() {
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
                $scope.setTargetDiv("map");
            }

            $scope.init();
            $scope.$emit('scope_loaded', "Map");
        }
    ]);
})
