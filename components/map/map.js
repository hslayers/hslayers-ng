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
            view: config.default_view
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
            me.map.getView().fitExtent(vectorSource.getExtent(), me.map.getSize());
        });
        
        me.getTileGrid = function(projection, extent){
            var jtsk = ol.proj.get(projection);
            var jtskExtent;
            if(projection=='EPSG:5514')
                jtskExtent = [-905000,-1230000,-400000,-900000];
            if(typeof extent !== 'undefined')
                jtskExtent = extent;
            jtsk.setExtent(jtskExtent);
            var jtskSize = ol.extent.getWidth(jtskExtent) / 256;
            var jtskResolutions = new Array(14);
            var jtskMatrixIds = new Array(14);
            for (var z = 0; z < 14; ++z) {
                jtskResolutions[z] = jtskSize / Math.pow(2, z);
                jtskMatrixIds[z] = z;
            }

            var tileGrid = new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(jtskExtent),
                resolutions: jtskResolutions,
                matrixIds: jtskMatrixIds
            });
            return tileGrid;
        }

        //map.addControl(mousePositionControl);

    }])

    .directive('hs.map.directive', ['Core', function(Core) {
        return {
            templateUrl: hsl_path + 'components/map/partials/map.html',
            link: function(scope, element) {
                $(".ol-zoomslider", element).width(28).height(200);
                if (Core.panel_side == 'left') {
                    $('.ol-zoomslider, .ol-zoom').css({
                        right: '.5em',
                        left: 'auto'
                    });
                    $('.ol-rotate').css({
                        right: '.5em',
                        left: 'auto'
                    });
                }
                if (Core.panel_side == 'right') {
                    $('.ol-zoomslider, .ol-zoom').css({
                        right: 'auto',
                        left: '.2em'
                    });
                    $('.ol-rotate').css({
                        right: 'auto',
                        left: '.2em',
                        top: '9.5em'
                    });
                }
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

                /**
                 * @function isLayerVisibleInPermalink
                 * @memberOf hs.map.controller.init
                 * @param {ol.Layer} lyr - Layer for which to determine visibility
                 * @description Finds out if layer is set as visible in URL (permalink)
                 */
                function isLayerVisibleInPermalink(lyr) {
                    if (visible_layers) {
                        var found = false;
                        angular.forEach(visible_layers, function(vlyr) {
                            if (vlyr == lyr.get('title')) found = true;
                        })
                        return found;
                    }
                    return lyr.getVisible();
                }

                if (permalink.getParamValue('hs_x') && permalink.getParamValue('hs_y') && permalink.getParamValue('hs_z')) {
                    var loc = location.search;
                    $scope.moveToAndZoom(parseFloat(permalink.getParamValue('hs_x', loc)), parseFloat(permalink.getParamValue('hs_y', loc)), parseInt(permalink.getParamValue('hs_z', loc)));
                }

                if (angular.isDefined(config.box_layers)) {
                    angular.forEach(config.box_layers, function(box) {
                        angular.forEach(box.get('layers'), function(lyr) {
                            lyr.setVisible(isLayerVisibleInPermalink(lyr));
                            OlMap.map.addLayer(lyr);
                        });
                    });
                }

                if (angular.isDefined(config.default_layers)) {
                    angular.forEach(config.default_layers, function(lyr) {
                        lyr.setVisible(isLayerVisibleInPermalink(lyr));
                        OlMap.map.addLayer(lyr);
                    });
                }
                $scope.setTargetDiv("map");
            }

            $scope.init();
            $scope.$emit('scope_loaded', "Map");
        }
    ]);
})
