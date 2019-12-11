import '../permalink/permalink.module';
import { DoubleClickZoom, KeyboardPan, KeyboardZoom, MouseWheelZoom, PinchRotate, PinchZoom, DragPan, DragRotate, DragZoom } from 'ol/interaction';
import Kinetic from 'ol/Kinetic';
import Map from 'ol/Map';
import View from 'ol/View';
import { MousePosition, ScaleLine, defaults as controlDefaults } from 'ol/control';
import { createStringXY } from 'ol/coordinate';
import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import Feature from 'ol/Feature';
import { Group } from 'ol/layer';
import { Vector, Cluster } from 'ol/source';
import { transform, transformExtent } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';


export default ['config', '$rootScope', 'hs.utils.service', '$timeout', function (config, $rootScope, utils, $timeout) {

    /**
     * This is a workaround.
     * Returns the associated layer.
     * This is used in query-vector.service to get the layer of clicked 
     * feature when features are listd in info panel.
     * @param {ol.Map} map.
     * @return {ol.layer.Vector} Layer.
     */
    Feature.prototype.getLayer = function (map) {
        var this_ = this,
            layer_, layersToLookFor = [];
        var check = function (layer) {
            var source = layer.getSource();
            if (utils.instOf(source, Cluster))
                source = source.getSource();
            if (utils.instOf(source, Vector)) {
                var features = source.getFeatures();
                if (features.length > 0) {
                    layersToLookFor.push({
                        layer: layer,
                        features: features
                    });
                }
            }
            
        };
        map.getLayers().forEach(function (layer) {
            if (utils.instOf(layer, Group)) {
                layer.getLayers().forEach(check);
            } else {
                check(layer);
            }
        });
        layersToLookFor.forEach(function (obj) {
            var found = obj.features.some(function (feature) {
                return this_ === feature;
            });
            if (found) {
                layer_ = obj.layer;
            }
        });
        return layer_;
    };

    //timer variable for extent change event
    var timer;
    /**
     * @ngdoc method
     * @name hs.map.service#init
     * @public
     * @description Initialization function for HSLayers map object. Initialize map with basic interaction, scale line and watcher for map view changes. When default controller is used, its called automaticaly, otherwise its must be called before other modules dependent on map object are loaded.
     */
    this.init = function () {
        if (angular.isDefined(me.map)) {
            me.map.getLayers().clear();
        }
        me.map = new Map({
            controls: me.controls,
            target: 'map',
            interactions: [],
            view: cloneView(config.default_view || createPlaceholderView())
        });

        me.visible = true;

        function extentChanged(e) {
            if (timer != null) clearTimeout(timer);
            timer = setTimeout(function () {
                /**
                 * @ngdoc event
                 * @name hs.map.service#map.extent_changed
                 * @eventType broadcast on $rootScope
                 * @description Fires when map extent change (move, zoom, resize). Fires with two parameters: map element and new calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
                 */
                $rootScope.$broadcast('map.extent_changed', e.element, me.map.getView().calculateExtent(me.map.getSize()));
            }, 500);
        }
        me.map.getView().on('change:center', function (e) {
            extentChanged(e);
        });
        me.map.getView().on('change:resolution', function (e) {
            extentChanged(e);
        });

        me.map.on('moveend', function (e) {
            extentChanged(e);
        });

        angular.forEach(me.interactions, function (value, key) {
            me.map.addInteraction(value);
        });
        //me.map.addControl(new ol.control.ZoomSlider());
        // me.map.addControl(new ol.control.ScaleLine());

        me.repopulateLayers();

        proj4.defs('EPSG:5514', 'PROJCS["S-JTSK / Krovak East North",GEOGCS["S-JTSK",DATUM["System_Jednotne_Trigonometricke_Site_Katastralni",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],TOWGS84[589,76,480,0,0,0,0],AUTHORITY["EPSG","6156"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4156"]],PROJECTION["Krovak"],PARAMETER["latitude_of_center",49.5],PARAMETER["longitude_of_center",24.83333333333333],PARAMETER["azimuth",30.28813972222222],PARAMETER["pseudo_standard_parallel_1",78.5],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],AUTHORITY["EPSG","5514"]]');
        register(proj4);

        /**
         * @ngdoc event
         * @name hs.map.service#map.loaded
         * @eventType broadcast on $rootScope
         * @description Fires when map is loaded (so other map dependent modules can proceed)
         */
        $rootScope.$broadcast('map.loaded');
    }

    this.loaded = function () {
        return new Promise((resolve, reject) => {
            if (me.map) {
                resolve(me.map);
                return;
            } else {
                $timeout(() => {
                    if (me.map) resolve(me.map); else reject();
                }, 1000);
            }
        })
    }

    //clone View to not overwrite deafult
    function cloneView(template) {
        var view = new View({
            center: template.getCenter(),
            zoom: template.getZoom(),
            projection: template.getProjection(),
            rotation: template.getRotation()
        });
        return view;
    }

    /**
     * @ngdoc property
     * @name hs.map.service#duration
     * @public
     * @type {Number} 400
     * @description Duration of added interactions animation. (400 ms used, default in OpenLayers is 250 ms)
     */
    this.duration = 400;

    /**
     * @ngdoc property
     * @name hs.map.service#controls
     * @public
     * @type {Object} 
     * @description Set of default map controls used in HSLayers, may be loaded from config file
     */
    var defaultDesktopControls = controlDefaults();
    defaultDesktopControls.push(new ScaleLine());
    var defaultMobileControls = controlDefaults({
        zoom: false
    });
    this.controls =  angular.isDefined(config.mapControls) ? config.mapControls :
        !!window.cordova ? defaultMobileControls : defaultDesktopControls;

    /**
     * @ngdoc property
     * @name hs.map.service#interactions
     * @public
     * @type {Object} 
     * @description Set of default map interactions used in HSLayers ({@link http://openlayers.org/en/latest/apidoc/ol.interaction.DoubleClickZoom.html DoubleClickZoom},{@link http://openlayers.org/en/latest/apidoc/ol.interaction.KeyboardPan.html KeyboardPan}, {@link http://openlayers.org/en/latest/apidoc/ol.interaction.KeyboardZoom.html KeyboardZoom} ,{@link http://openlayers.org/en/latest/apidoc/ol.interaction.MouseWheelZoom.html MouseWheelZoom} ,{@link http://openlayers.org/en/latest/apidoc/ol.interaction.PinchRotate.html PinchRotate} , {@link http://openlayers.org/en/latest/apidoc/ol.interaction.PinchZoom.html PinchZoom}, {@link http://openlayers.org/en/latest/apidoc/ol.interaction.DragPan.html DragPan},{@link http://openlayers.org/en/latest/apidoc/ol.interaction.DragZoom.html DragZoom} ,{@link http://openlayers.org/en/latest/apidoc/ol.interaction.DragRotate.html DragRotate} )
     */
    this.interactions = {
        'DoubleClickZoom': new DoubleClickZoom({
            duration: this.duration
        }),
        'KeyboardPan': new KeyboardPan({
            pixelDelta: 256
        }),
        'KeyboardZoom': new KeyboardZoom({
            duration: this.duration
        }),
        'MouseWheelZoom': new MouseWheelZoom({
            duration: this.duration
        }),
        'PinchRotate': new PinchRotate(),
        'PinchZoom': new PinchZoom({
            constrainResolution: true,
            duration: this.duration
        }),
        'DragPan': new DragPan({
            kinetic: new Kinetic(-0.01, 0.1, 200)
        }),
        'DragZoom': new DragZoom(),
        'DragRotate': new DragRotate()
    }

    //Mouse position control, currently not used
    var mousePositionControl = new MousePosition({
        coordinateFormat: createStringXY(4),
        undefinedHTML: '&nbsp;'
    });

    var me = this;

    /**
     * @ngdoc method
     * @name hs.map.service#findLayerByTitle
     * @public
     * @param {string} title Title of the layer (from layer creation)
     * @returns {Ol.layer} Ol.layer object
     * @description Find layer object by title of layer
     */
    this.findLayerByTitle = function (title) {


        var layers = me.map.getLayers();
        var tmp = null;
        angular.forEach(layers, function (layer) {
            if (layer.get('title') == title) tmp = layer;
        });
        return tmp;
    }

    function layersEqual(existing, lyr) {
        var s_existing = existing.getSource();
        var s_new = lyr.getSource();
        return existing.get("title") == lyr.get("title") &&
            typeof s_existing == typeof s_new &&
            (angular.isUndefined(s_existing.getParams) || s_existing.getParams().LAYERS == s_new.getParams().LAYERS) &&
            (angular.isUndefined(s_existing.getUrl) || s_existing.getUrl() == s_new.getUrl()) &&
            (angular.isUndefined(s_existing.getUrls) || s_existing.getUrls() == s_new.getUrls())
    }

    this.layerDuplicate = function (lyr) {
        return me.map.getLayers().getArray().filter(function (existing) {
            layersEqual(existing, lyr)
        }).length > 0;
    }

    this.removeDuplicate = function (lyr) {
        me.map.getLayers().getArray().filter(function (existing) {
            layersEqual(existing, lyr)
        }).forEach(function (to_remove) { me.map.getLayers().remove(to_remove) });
    }

    this.addLayer = function (lyr) {
        if (me.layerDuplicate(lyr))
            me.removeDuplicate(lyr);
        me.map.addLayer(lyr);
    }

    /**
     * @ngdoc method
     * @name hs.map.service#repopulateLayers
     * @public
     * @param {object} visible_layers List of layers, which should be visible. 
     * @description Add all layers from app config (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
     */
    this.repopulateLayers = function (visible_layers) {
        if (angular.isDefined(config.box_layers)) {
            angular.forEach(config.box_layers, function (box) {
                angular.forEach(box.get('layers'), function (lyr) {
                    if (!me.layerDuplicate(lyr)) {
                        lyr.setVisible(me.isLayerVisible(lyr, me.visible_layers));
                        lyr.manuallyAdded = false;
                        if (utils.instOf(lyr.getSource(), ImageWMS))
                            me.proxifyLayerLoader(lyr, false);
                        if (utils.instOf(lyr.getSource(), TileWMS))
                            me.proxifyLayerLoader(lyr, true);
                        if (utils.instOf(lyr.getSource(), Vector))
                            me.getVectorType(lyr);
                        me.map.addLayer(lyr);
                    }
                });
            });
        }

        if (angular.isDefined(config.default_layers)) {
            angular.forEach(config.default_layers, function (lyr) {
                if (!me.layerDuplicate(lyr)) {
                    lyr.setVisible(me.isLayerVisible(lyr, me.visible_layers));
                    lyr.manuallyAdded = false;
                    if (utils.instOf(lyr.getSource(), ImageWMS))
                        me.proxifyLayerLoader(lyr, false);
                    if (utils.instOf(lyr.getSource(), TileWMS))
                        me.proxifyLayerLoader(lyr, true);
                    if (utils.instOf(lyr.getSource(), Vector))
                        me.getVectorType(lyr);
                    me.map.addLayer(lyr);
                }
            });
        }
    }

    this.getVectorType = function (layer) {
        var src = layer.getSource();
        src.hasLine = false;
        src.hasPoly = false;
        src.hasPoint = false;
        if (src.getFeatures().length > 0) {
            vectorSourceTypeComputer(src);
        }
        else {
            src.on('change', function (evt) {
                var source = evt.target;
                if (source.getState() === 'ready') {
                    vectorSourceTypeComputer(source);
                }
            })
        }
    }

    function vectorSourceTypeComputer(src) {
        angular.forEach(src.getFeatures(), function (f) {
            if (f.getGeometry()) {
                switch (f.getGeometry().getType()) {
                    case 'LineString':
                    case 'MultiLineString':
                        src.hasLine = true;
                        break;
                    case 'Polygon':
                    case 'MultiPolygon':
                        src.hasPoly = true;
                        break;
                    case 'Point':
                    case 'MultiPoint':
                        src.hasPoint = true;
                        break;
                }
            }
        })
        if (src.hasLine || src.hasPoly || src.hasPoint) {
            src.styleAble = true;
        }
    }

    /**
     * @ngdoc method
     * @name hs.map.service#reset
     * @public
     * @description Reset map to state configured in app config (reload all layers and set default view)
     */
    this.reset = function () {
        var to_be_removed = [];
        me.map.getLayers().forEach(function (lyr) {
            to_be_removed.push(lyr);
        });
        while (to_be_removed.length > 0) me.map.removeLayer(to_be_removed.shift());
        me.repopulateLayers(null);
        me.resetView();
    }

    /**
     * @ngdoc method
     * @name hs.map.service#resetView
     * @public
     * @description Reset map view to view configured in app config 
     */
    this.resetView = function () {
        me.map.setView(cloneView(config.default_view || createPlaceholderView()));
    }

    function createPlaceholderView() {
        return new View({
            center: transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        })
    }

    /**
     * @ngdoc method
     * @name hs.map.service#isLayerVisible
     * @public
     * @param {ol.Layer} lyr Layer for which to determine visibility
     * @param {Array} visible_layers Layers which should be programmticaly visible
     * @returns {Boolean} Detected visibility of layer
     * @description Determine if layer is visible, either by its visibility status in map, or by its being in visible_layers group
     */
    this.isLayerVisible = function (lyr, visible_layers) {
        if (visible_layers) {
            var found = false;
            angular.forEach(visible_layers, function (vlyr) {
                if (vlyr == lyr.get('title')) found = true;
            })
            return found;
        }
        return lyr.getVisible();
    }

    this.getCanvas = function(){
        return this.mapElement.querySelector("canvas")
    }

    /**
     * @ngdoc method
     * @name hs.map.service#proxifyLayerLoader
     * @public
     * @param {Ol.layer} lyr Layer to proxify
     * @param {Boolean} tiled Info if layer is tiled
     * @description Proxify layer loader to work with layers from other sources than app
     */
    this.proxifyLayerLoader = function (lyr, tiled) {
        var src = lyr.getSource();
        me.map.getLayers().forEach(function (l) {
            if (l.get("source") == src) {
                return;
            }
        });
        if (tiled) {
            var tile_url_function = src.getTileUrlFunction() || src.tileUrlFunction();
            src.setTileUrlFunction(function (b, c, d) {
                var url = tile_url_function.call(src, b, c, d);
                if (url.indexOf(config.proxyPrefix) == 0) 
                    return url
                else
                    return utils.proxify(url);
            });
        } else {
            lyr.getSource().setImageLoadFunction(function (image, src) {
                if (src.indexOf(config.proxyPrefix) == 0) {
                    image.getImage().src = src
                } else {
                    image.getImage().src = utils.proxify(src); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
                }
            })
        }
    }

    //map.addControl(mousePositionControl);
    /**
     * @ngdoc method
     * @name hs.map.service#puremap
     * @public
     * @description Clean interactions and zoom from map to get pure map
     */
    this.puremap = function () {
        var interactions = me.map.getInteractions();
        var controls = me.map.getControls();
        angular.forEach(interactions, function (interaction) {
            me.map.removeInteraction(interaction);
        })
        angular.forEach(controls, function (control) {
            me.map.removeControl(control);
        })
        $timeout(me.puremap, 1000);
    }

    /**
    * @ngdoc method
    
    * @public
    * @param {number} x X coordinate of new center
    * @param {number} y Y coordinate of new center
    * @param {number} zoom New zoom level
    * @description Move map and zoom to specified coordinate/zoom level
    */
    this.moveToAndZoom = function (x, y, zoom) {
        var view = me.map.getView();
        view.setCenter([x, y]);
        view.setZoom(zoom);
    }

    this.getMapExtent = function () {
        var mapSize = me.map.getSize();
        var mapExtent = angular.isDefined(mapSize) ?
            me.map.getView().calculateExtent(mapSize) :
            [0, 0, 100, 100];
        return mapExtent;
    };

    this.getMapExtentInEpsg4326 = function () {
        var bbox = transformExtent(me.getMapExtent(),
            me.map.getView().getProjection(),
            'EPSG:4326');
        return bbox;
    };

    /**
     * @ngdoc method
     * @name hs.map.service#getMap
     * @public
     * @description Get ol.map object from service
     */
    this.getMap = function () {
        return OlMap.map;
    }

}]