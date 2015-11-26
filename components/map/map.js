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
    .service('hs.map.service', ['config', function(config) {
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
            'DragRotate': new ol.interaction.DragRotate(),
            'dragAndDropInteraction': new ol.interaction.DragAndDrop({
                formatConstructors: [
                    ol.format.GPX,
                    ol.format.GeoJSON,
                    ol.format.IGC,
                    ol.format.KML,
                    ol.format.TopoJSON
                ]
            })
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

        me.interactions.dragAndDropInteraction.on('addfeatures', function(event) {
            var vectorSource = new ol.source.Vector({
                features: event.features,
                projection: event.projection,
                extractStyles: true
            });
            me.map.addLayer(new ol.layer.Vector({
                title: 'User vector data',
                source: vectorSource
            }));
            me.map.getView().fit(vectorSource.getExtent(), me.map.getSize());
        });

        this.repopulateLayers = function(visible_layers) {
            if (angular.isDefined(config.box_layers)) {
                angular.forEach(config.box_layers, function(box) {
                    angular.forEach(box.get('layers'), function(lyr) {
                        lyr.setVisible(me.isLayerVisibleInPermalink(lyr, visible_layers));
                        me.map.addLayer(lyr);
                    });
                });
            }

            if (angular.isDefined(config.default_layers)) {
                angular.forEach(config.default_layers, function(lyr) {
                    lyr.setVisible(me.isLayerVisibleInPermalink(lyr, visible_layers));
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
            templateUrl: hsl_path + 'components/map/partials/map.html',
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
                var visible_layers = null;
                if (permalink.getParamValue('visible_layers')) {
                    visible_layers = permalink.getParamValue('visible_layers').split(';');
                }

                if (permalink.getParamValue('hs_x') && permalink.getParamValue('hs_y') && permalink.getParamValue('hs_z')) {
                    var loc = location.search;
                    $scope.moveToAndZoom(parseFloat(permalink.getParamValue('hs_x', loc)), parseFloat(permalink.getParamValue('hs_y', loc)), parseInt(permalink.getParamValue('hs_z', loc)));
                }

                OlMap.repopulateLayers(visible_layers);

                $scope.setTargetDiv("map");
            }

            $scope.init();
            $scope.$emit('scope_loaded', "Map");
        }
    ]);
})
