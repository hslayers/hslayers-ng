import { Style, Icon, Circle } from 'ol/style';
import Layer from 'ol/layer/Layer';
import { Tile, Image as ImageLayer } from 'ol/layer';
import { TileWMS } from 'ol/source';
import { ImageWMS } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format';

export default ['hs.map.service', 'Core', 'hs.utils.service', '$window', '$cookies', 'config', function (OlMap, Core, utils, $window, $cookies, config) {
    var me = {
        endpointUrl() {
            var hostName = location.protocol + '//' + location.host;
            if (angular.isDefined(config.hostname)) {
                if (config.hostname.status_manager && config.hostname.status_manager.url) {
                    return config.hostname.status_manager.url;
                }
                if (config.hostname.user && config.hostname.user.url) {
                    hostName = config.hostname.user.url;
                } else if (config.hostname.default && config.hostname.default.url) {
                    hostName = config.hostname.default.url
                }
            }
            return hostName + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php')
        },
        /**
        * Create Json object which stores information about composition, user, map state and map layers (including layer data)
        * @memberof hs.save-map.service
        * @function map2json
        * @param {Ol.map} map Selected map object
        * @param {$scope} $scope Angular scope from which function is called
        * @returns {Object} JSON object with all required map composition metadata
        */
        map2json: function (map, compoData, userData, statusData) {
            var groups = {};
            angular.forEach(statusData.groups, function (g) {
                if (g.r || g.w) {
                    groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
                }
            });
            var json = {
                abstract: compoData.abstract,
                title: compoData.title,
                keywords: compoData.keywords,
                extent: compoData.bbox,
                user: {
                    address: userData.address,
                    city: userData.city,
                    country: userData.country,
                    email: userData.email,
                    name: userData.name,
                    organization: userData.organization,
                    phone: userData.phone,
                    position: userData.position,
                    postalcode: userData.postalcode,
                    state: userData.state
                },
                groups: groups
            };

            // Map properties
            json.scale = map.getView().getProjection().getMetersPerUnit();
            json.projection = map.getView().getProjection().getCode().toLowerCase();
            var center = map.getView().getCenter();
            if (center) {
                json.center = [center[0], center[1]];
            }
            json.units = map.getView().getProjection().getUnits();

            if (map.maxExtent) {
                json.maxExtent = {};
                json.maxExtent.left = map.maxExtent.left;
                json.maxExtent.bottom = map.maxExtent.bottom;
                json.maxExtent.right = map.maxExtent.right;
                json.maxExtent.top = map.maxExtent.top;
            }

            //json.minResolution = map.minResolution;
            //json.maxResolution = map.maxResolution;
            //json.numZoomLevels = map.numZoomLevels;

            //json.resolutions = map.resolutions;
            //json.scales = map.scales;
            //json.sphericalMercator = map.sphericalMercator;


            // Layers properties
            var layers = map.getLayers().getArray();

            json.layers = me.layers2json(layers, compoData.layers);
            json.current_base_layer = me.getCurrentBaseLayer(map);
            return json;
        },

        /**
        * Returns object about current selected base layer
        * @memberof hs.save-map.service
        * @function getCurrentBaseLayer
        * @param {Ol.map} map Selected map object
        * @returns {Object} Returns object with current current selected base layers title as attribute
        */
        getCurrentBaseLayer: function (map) {
            var current_base_layer = null;
            angular.forEach(map.getLayers().getArray(), function (lyr) {
                if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && lyr.get('base') == true && lyr.getVisible()) {
                    current_base_layer = {
                        title: lyr.get('title')
                    };
                }
            })
            return current_base_layer;
        },

        /**
         * Converts map layers into a JSON object. If $scope is defined, stores only layers checked in form
         * Uses layer2json().
         * @memberof hs.save-map.service
         * @function layer2json
         * @param {Array} layers Map layers that should be converted
         * @param {$scope} $scope Angular scope from which function is called
         * @returns {Array} JSON object representing the layers
         */
        layers2json: function (layers, layerForm) {

            var i, ilen;
            var json = [];
            layers.forEach(function (lyr) {
                if (angular.isDefined(layerForm)) {
                    //From form
                    angular.forEach(layerForm, function (list_item) {
                        if (list_item.layer == lyr && list_item.checked) {
                            var l = me.layer2json(lyr);
                            if (l) json.push(l);
                        }
                    })
                } else {
                    //From unloading
                    var l = me.layer2json(lyr);
                    if (l) json.push(l);
                }
            });

            return json;
        },

        /**
         * Converts map layer from Layer object to text in JSON notation.
         *
         * Syntactic sugar for layer2json() UNUSED?
         * @memberof hs.save-map.service
         * @function layer2string
         * @param {Object} layer Layer to be converted
         * @param {Boolean} pretty Whether to use pretty notation
         * @returns {String} Text in JSON notation representing the layer
         */
        layer2string: function (layer, pretty) {
            var json = me.layer2json(layer);
            var text = JSON.stringify(json, pretty);
            return text;
        },

        /**
         * Convert layer style object into JSON object, partial function of layer2style (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
         * @memberof hs.save-map.service
         * @function serializeStyle
         * @param {ol.style.Style} s Style to convert
         * @returns {Object} Converted JSON object for style
         */
        serializeStyle: function (s) {
            var o = {};
            if (typeof s.getFill() != 'undefined' && s.getFill() != null)
                o.fill = s.getFill().getColor();
            if (typeof s.getStroke() != 'undefined' && s.getStroke() != null) {
                o.stroke = {
                    color: s.getStroke().getColor(),
                    width: s.getStroke().getWidth()
                };
            }
            if (typeof s.getImage() != 'undefined' && s.getImage() != null) {
                var style_img = s.getImage();
                var ima = {};
                if (angular.isDefined(style_img.getFill) && typeof style_img.getFill() != 'undefined' && style_img.getFill() != null)
                    ima.fill = style_img.getFill().getColor();

                if (angular.isDefined(style_img.getStroke) && typeof style_img.getStroke() != 'undefined' && style_img.getStroke() != null) {
                    ima.stroke = {
                        color: style_img.getStroke().getColor(),
                        width: style_img.getStroke().getWidth()
                    };
                }

                if (angular.isDefined(style_img.getRadius)) {
                    ima.radius = style_img.getRadius();
                }

                if (angular.isFunction(style_img.getSrc) && angular.isString(style_img.getSrc())) {
                    ima.src = utils.proxify(style_img.getSrc());
                } else if (angular.isFunction(style_img.getImage) && style_img.getImage() != null) {
                    if (angular.isDefined(style_img.getImage().src))
                        ima.src = style_img.getImage().src;
                }

                if (style_img instanceof Circle)
                    ima.type = 'circle';

                if (style_img instanceof Icon)
                    ima.type = 'icon';

                o.image = ima;
            }
            return o;
        },

        /**
         * Converts map layer into a JSON object (only for ol.layer.Layer)                   
         * Layer properties covered:  (CLASS_NAME), name, url, params,
         *                            group, displayInLayerSwitcher, *visibility, *opacity
         *                            attribution, transitionEffect,
         *                             isBaseLayer, minResolution,
         *                            maxResolution, minScale, maxScale, metadata,
         *                            abstract, opacity, singleTile, removable,
         *                            queryable, legend, projections,
         *                            wmsMinScale, wmsMaxScale
         *
         * The layer index is not covered, as we assume
         * that it is corresponding to the layers order.
         * @memberof hs.save-map.service
         * @function layer2json
         * @param {Object} layer Map layer that should be converted
         * @returns {Object} JSON object representing the layer
         */
        layer2json: function (layer) {
            var json = {
                metadata: {}
            };
            if (!layer instanceof Layer) {
                return;
            }

            // Common stuff

            // type
            //json.className = layer.CLASS_NAME;
            //json.origClassName = layer.CLASS_NAME; // the original type

            // options
            json.visibility = layer.getVisible();
            json.opacity = layer.getOpacity();
            json.title = layer.get('title');
            //json.index = layer.map.getLayerIndex(layer);
            json.path = layer.get('path');

            if (layer.getExtent()) {
                var ex = layer.getExtent();
                json.maxExtent = {
                    left: ex[0],
                    bottom: ex[3],
                    right: ex[2],
                    top: ex[1]
                };
            }

            // HTTPRequest
            if (layer instanceof Tile || layer instanceof ImageLayer) {
                var src = layer.getSource();
                if (src instanceof ImageWMS || src instanceof TileWMS) {
                    json.className = "HSLayers.Layer.WMS";
                    json.singleTile = src instanceof ImageWMS;
                    json.wmsMinScale = layer.get('minScale');
                    json.wmsMaxScale = layer.get('maxScale');
                    if (layer.get('legends')) {
                        json.legends = [];
                        var legends = layer.get('legends');
                        for (var i = 0; i < legends.length; i++) {
                            json.legends.push(encodeURIComponent(legends[i]))
                        }
                    }
                    json.maxResolution = layer.getMaxResolution();
                    json.minResolution = layer.getMinResolution();
                    if (src.getUrl) json.url = encodeURIComponent(src.getUrl());
                    if (src.getUrls) json.url = encodeURIComponent(src.getUrls()[0]);
                    if (src.getProjection()) json.projection = src.getProjection().getCode().toLowerCase();
                    json.params = src.getParams();
                    json.ratio = src.get('ratio') || src.ratio_;
                    json.displayInLayerSwitcher = layer.get('show_in_manager');
                    json.metadata.styles = src.get('styles');
                    if (layer.get('dimensions')) {
                        json.dimensions = layer.get('dimensions');
                    }
                }
            }

            // Vector
            if (layer instanceof VectorLayer) {
                var src = layer.getSource();
                json.className = "OpenLayers.Layer.Vector";
                if (angular.isDefined(layer.get('definition'))) {
                    json.protocol = {
                        url: encodeURIComponent(layer.get('definition').url),
                        format: layer.get('definition').format
                    }
                } else {
                    try {
                        json.features = me.serializeFeatures(src.getFeatures());
                    } catch (ex) { }
                }
                if (angular.isDefined(src.defOptions)) {
                    json.defOptions = src.defOptions;
                }
                json.maxResolution = layer.getMaxResolution();
                json.minResolution = layer.getMinResolution();
                json.projection = "epsg:4326";
                if (layer.getStyle() instanceof Style) {
                    json.style = me.serializeStyle(layer.getStyle());
                }
            }
            return json;
        },

        /**
         * Convert feature array to GeoJSON string
         * @memberof hs.save-map.service
         * @function serializeFeatures
         * @param {Array} features Array of features
         * @returns {String} GeoJSON string
         */
        serializeFeatures: function (features) {
            var f = new GeoJSON();
            return f.writeFeatures(features);
        },

        /**
         * Generate random Uuid
         * @memberof hs.save-map.service
         * @function generateUuid
         * @returns {String} Random Uuid in string format
         */
        generateUuid: utils.generateUuid,

        /**
         * Create thumbnail of map view and save it into selected element
         * @memberof hs.save-map.service
         * @function generateThumbnail
         * @param {$element} $element Selected element
         * @param {$scope} $scope Angular scope from which function was called
         */
        generateThumbnail: function ($element, localThis) {
            if (Core.mainpanel == 'save-map' || Core.mainpanel == 'permalink' || Core.mainpanel == "statusCreator") {
                $element.setAttribute("crossOrigin", "Anonymous");
                OlMap.map.once('postcompose', function (event) {
                    var myCanvas = document.getElementById('my_canvas_id');
                    var canvas = event.context.canvas;
                    var canvas2 = document.createElement("canvas");
                    var width = 256,
                        height = 256;
                    canvas2.style.width = width + "px";
                    canvas2.style.height = height + "px";
                    canvas2.width = width;
                    canvas2.height = height;
                    var ctx2 = canvas2.getContext("2d");
                    ctx2.drawImage(canvas, canvas.width / 2 - height / 2, canvas.height / 2 - width / 2, width, height, 0, 0, width, height);
                    try {
                        $element.setAttribute('src', canvas2.toDataURL('image/png'));
                        this.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
                    }
                    catch (e) {
                        $element.setAttribute('src', require('components/save-map/notAvailable.png'));
                    }
                    $element.style.width = width + 'px';
                    $element.style.height = height + 'px';
                }, localThis);
                OlMap.map.renderSync();
            }
        }
    };

    $window.addEventListener('beforeunload', function (event) {
        var data = {}
        var layers = []
        angular.forEach(OlMap.map.getLayers(), function (layer) {
            if (layer.get('saveState')) {
                layers.push(me.layer2json(layer));
            }
        })
        data.layers = layers;
        $cookies.put('hs_layers', JSON.stringify(data));
    });
    return me;
}]