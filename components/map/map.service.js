import '../permalink/permalink.module';
import { DoubleClickZoom, KeyboardPan, KeyboardZoom, MouseWheelZoom, PinchRotate, PinchZoom, DragPan, DragRotate, DragZoom } from 'ol/interaction';
import { always as alwaysCondition, platformModifierKeyOnly as platformModifierKeyOnlyCondition } from 'ol/events/condition';
import Kinetic from 'ol/Kinetic';
import Map from 'ol/Map';
import View from 'ol/View';
import { MousePosition, ScaleLine, defaults as controlDefaults } from 'ol/control';
import Control from 'ol/control/Control';
import { createStringXY } from 'ol/coordinate';
import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import Feature from 'ol/Feature';
import { Group } from 'ol/layer';
import { Vector, Cluster } from 'ol/source';
import { transform, transformExtent } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';


export default ['config', '$rootScope', 'hs.utils.service', 'hs.layout.service', '$timeout', 'gettext', function (config, $rootScope, utils, layoutService, $timeout, gettext) {

  /**
   * This is a workaround.
   * Returns the associated layer.
   * This is used in query-vector.service to get the layer of clicked
   * feature when features are listed in info panel.
   * @param {ol.Map} map
   * @return {ol.layer.Vector} Layer.
   */
  Feature.prototype.getLayer = function (map) {
    const this_ = this;
    let layer_;
    const layersToLookFor = [];
    const check = function (layer) {
      let features = [];
      let source = layer.getSource();
      if (utils.instOf(source, Vector)) {
        features = source.getFeatures();
      }
      if (utils.instOf(source, Cluster)) {
        source = source.getSource();
        features = features.concat(source.getFeatures());
      }
      if (utils.instOf(source, Vector)) {
        if (features.length > 0) {
          layersToLookFor.push({
            layer: layer,
            features: features
          });
        }
      }

    };
    map.getLayers().forEach((layer) => {
      if (utils.instOf(layer, Group)) {
        layer.getLayers().forEach(check);
      } else {
        check(layer);
      }
    });
    layersToLookFor.forEach((obj) => {
      const found = obj.features.some((feature) => {
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
      target: me.mapElement,
      interactions: [],
      view: cloneView(config.default_view || createPlaceholderView())
    });

    me.visible = true;

    function extentChanged(e) {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = $timeout(function () {
        /**
         * @ngdoc event
         * @name hs.map.service#map.extent_changed
         * @eventType broadcast on $rootScope
         * @description Fires when map extent change (move, zoom, resize). Fires with two parameters: map element and new calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
         */
        $rootScope.$broadcast('map.extent_changed', e.element, me.map.getView().calculateExtent(me.map.getSize()));
      }, 500);
    }
    me.map.getView().on('change:center', (e) => {
      extentChanged(e);
    });
    me.map.getView().on('change:resolution', (e) => {
      extentChanged(e);
    });

    me.map.on('moveend', (e) => {
      extentChanged(e);
    });

    angular.forEach(me.interactions, (value, key) => {
      me.map.addInteraction(value);
    });
    //me.map.addControl(new ol.control.ZoomSlider());
    // me.map.addControl(new ol.control.ScaleLine());

    // If the MouseWheelInteraction is set to behave only with CTRL pressed,
    // then also notify the user when he tries to zoom,
    // but the CTRL is not pressed
    if (angular.isDefined(config.zoomWithModifierKeyOnly)) {
      me.map.on('wheel', (e) => {
        //ctrlKey works for Win and Linux, metaKey for Mac
        if (!(e.originalEvent.ctrlKey || e.originalEvent.metaKey)
                && !layoutService.contentWrapper.querySelector('.hs-zoom-info-dialog')) {
          //TODO: change the name of platform modifier key dynamically based on OS
          const platformModifierKey = 'CTRL or META';
          //Following styles would be better written as ng-styles...
          const html = `<div
            class="alert alert-info mt-1 hs-zoom-info-dialog"
            style="
              position: absolute;
              ${!layoutService.sidebarBottom() && layoutService.sidebarRight ? 'right' : null}: ${layoutService.panelSpaceWidth() + 10}px;
              ${!layoutService.sidebarBottom() && !layoutService.sidebarRight ? 'left' : null}: ${layoutService.panelSpaceWidth() + 10}px;
              ${layoutService.sidebarBottom() ? 'bottom:' : null}: ${layoutService.panelSpaceHeight() + 5}px};"
            role="alert">
            Use ${platformModifierKey} key + mouse-wheel to zoom the map.
            </div>`;
          const element = angular.element(html)[0];
          //TODO: '.hs-gui-overlay' is not available in Core.puremapApp mode => place it somewhere else
          layoutService.contentWrapper.querySelector('.hs-gui-overlay').appendChild(element);
          $timeout(() => {
            layoutService.contentWrapper.querySelector('.hs-zoom-info-dialog').remove();
          },
          3000
          );
        }
      });
    }

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
  };

  this.loaded = function () {
    return new Promise((resolve, reject) => {
      if (me.map) {
        resolve(me.map);
        return;
      } else {
        $timeout(() => {
          if (me.map) {resolve(me.map);} else {reject();}
        }, 1000);
      }
    });
  };

  //clone View to not overwrite default
  function cloneView(template) {
    const view = new View({
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
  const defaultDesktopControls = controlDefaults();

  //creates custom default view control
  const setDefaultView = function (e) {
    me.map.getView().setCenter(config.default_view.getCenter());
    me.map.getView().setZoom(config.default_view.getZoom());
  };

  const button = document.createElement('button');
  button.addEventListener('click', setDefaultView, false);

  const icon = document.createElement('i');
  icon.className = 'glyphicon icon-globe';

  const element = document.createElement('div');
  element.className = 'hs-defaultView ol-unselectable ol-control';
  element.title = gettext('Zoom to initial window');

  button.appendChild(icon);
  element.appendChild(button);

  const defaultViewControl = new Control({
    element: element
  });

  defaultDesktopControls.removeAt(1);
  defaultDesktopControls.push(new ScaleLine());
  defaultDesktopControls.push(defaultViewControl);

  const defaultMobileControls = controlDefaults({
    zoom: false
  });

  this.controls = angular.isDefined(config.mapControls) ? config.mapControls :
    !!window.cordova ? defaultMobileControls : defaultDesktopControls;

  /**
   * @ngdoc property
   * @name hs.map.service#interactions
   * @public
   * @type {Object}
   * @description Set of default map interactions used in HSLayers (
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.DoubleClickZoom.html DoubleClickZoom},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.KeyboardPan.html KeyboardPan},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.KeyboardZoom.html KeyboardZoom},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.MouseWheelZoom.html MouseWheelZoom},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.PinchRotate.html PinchRotate},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.PinchZoom.html PinchZoom},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.DragPan.html DragPan},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.DragZoom.html DragZoom},
   *  {@link http://openlayers.org/en/latest/apidoc/ol.interaction.DragRotate.html DragRotate} )
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
      condition: angular.isDefined(config.zoomWithModifierKeyOnly) ? platformModifierKeyOnlyCondition : alwaysCondition,
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
  };

  //Mouse position control, currently not used
  const mousePositionControl = new MousePosition({
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
    const layers = me.map.getLayers();
    let tmp = null;
    angular.forEach(layers, (layer) => {
      if (layer.get('title') == title) {tmp = layer;}
    });
    return tmp;
  };

  function layersEqual(existing, lyr) {
    const s_existing = existing.getSource();
    const s_new = lyr.getSource();
    return existing.get('title') == lyr.get('title') &&
            typeof s_existing == typeof s_new &&
            (angular.isUndefined(s_existing.getParams) || s_existing.getParams().LAYERS == s_new.getParams().LAYERS) &&
            (angular.isUndefined(s_existing.getUrl) || s_existing.getUrl() == s_new.getUrl()) &&
            (angular.isUndefined(s_existing.getUrls) || s_existing.getUrls() == s_new.getUrls());
  }

  this.layerDuplicate = (lyr) => {
    return me.map.getLayers().getArray().filter((existing) => {
      layersEqual(existing, lyr);
    }).length > 0;
  };

  this.removeDuplicate = (lyr) => {
    me.map.getLayers().getArray().filter((existing) => {
      layersEqual(existing, lyr);
    }).forEach((to_remove) => { me.map.getLayers().remove(to_remove);});
  };

  this.addLayer = (lyr) => {
    if (me.layerDuplicate(lyr)) {
      me.removeDuplicate(lyr);
    }
    me.map.addLayer(lyr);
  };

  /**
   * @ngdoc method
   * @name hs.map.service#repopulateLayers
   * @public
   * @param {object} visible_layers List of layers, which should be visible.
   * @description Add all layers from app config (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
   */
  this.repopulateLayers = (visible_layers) => {
    if (angular.isDefined(config.box_layers)) {
      angular.forEach(config.box_layers, (box) => {
        angular.forEach(box.get('layers'), (lyr) => {
          if (!me.layerDuplicate(lyr)) {
            lyr.setVisible(me.isLayerVisible(lyr, me.visible_layers));
            lyr.manuallyAdded = false;
            if (utils.instOf(lyr.getSource(), ImageWMS)) {
              me.proxifyLayerLoader(lyr, false);
            }
            if (utils.instOf(lyr.getSource(), TileWMS)) {
              me.proxifyLayerLoader(lyr, true);
            }
            if (utils.instOf(lyr.getSource(), Vector)) {
              me.getVectorType(lyr);
            }
            me.map.addLayer(lyr);
          }
        });
      });
    }

    if (angular.isDefined(config.default_layers)) {
      angular.forEach(config.default_layers, (lyr) => {
        if (!me.layerDuplicate(lyr)) {
          lyr.setVisible(me.isLayerVisible(lyr, me.visible_layers));
          lyr.manuallyAdded = false;
          if (utils.instOf(lyr.getSource(), ImageWMS)) {
            me.proxifyLayerLoader(lyr, false);
          }
          if (utils.instOf(lyr.getSource(), TileWMS)) {
            me.proxifyLayerLoader(lyr, true);
          }
          if (utils.instOf(lyr.getSource(), Vector)) {
            me.getVectorType(lyr);
          }
          me.map.addLayer(lyr);
        }
      });
    }
  };

  this.getVectorType = function (layer) {
    let src = [];
    if (angular.isDefined(layer.getSource().getSource)) {
      src = layer.getSource().getSource();
    } else {
      src = layer.getSource();
    }
    src.hasLine = false;
    src.hasPoly = false;
    src.hasPoint = false;
    if (src.getFeatures().length > 0) {
      vectorSourceTypeComputer(src);
    }
    else {
      src.on('change', (evt) => {
        const source = evt.target;
        if (source.getState() === 'ready') {
          vectorSourceTypeComputer(source);
        }
      });
    }
  };

  function vectorSourceTypeComputer(src) {
    angular.forEach(src.getFeatures(), (f) => {
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
    });
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
    const to_be_removed = [];
    me.map.getLayers().forEach((lyr) => {
      to_be_removed.push(lyr);
    });
    while (to_be_removed.length > 0) {me.map.removeLayer(to_be_removed.shift());}
    me.repopulateLayers(null);
    me.resetView();
  };

  /**
   * @ngdoc method
    * @name hs.map.service#resetView
    * @public
    * @description Reset map view to view configured in app config
   */
  this.resetView = function () {
    me.map.setView(cloneView(config.default_view || createPlaceholderView()));
  };

  function createPlaceholderView() {
    return new View({
      center: transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
      zoom: 4,
      units: 'm'
    });
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
      let found = false;
      angular.forEach(visible_layers, (vlyr) => {
        if (vlyr == lyr.get('title')) {found = true;}
      });
      return found;
    }
    return lyr.getVisible();
  };

  this.getCanvas = function () {
    return this.mapElement.querySelector('canvas');
  };

  /**
   * @ngdoc method
   * @name hs.map.service#proxifyLayerLoader
   * @public
   * @param {Ol.layer} lyr Layer to proxify
   * @param {Boolean} tiled Info if layer is tiled
   * @description Proxify layer loader to work with layers from other sources than app
   */
  this.proxifyLayerLoader = function (lyr, tiled) {
    const src = lyr.getSource();
    me.map.getLayers().forEach((l) => {
      if (l.get('source') == src) {
        return;
      }
    });
    if (tiled) {
      const tile_url_function = src.getTileUrlFunction() || src.tileUrlFunction();
      src.setTileUrlFunction(function (b, c, d) {
        var url = tile_url_function.call(src, b, c, d);
        if (url.indexOf(config.proxyPrefix) == 0) {return url;}
        else {return utils.proxify(url);}
      });
    } else {
      lyr.getSource().setImageLoadFunction(function (image, src) {
        if (src.indexOf(config.proxyPrefix) == 0) {
          image.getImage().src = src;
        } else {
          image.getImage().src = utils.proxify(src); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
        }
      });
    }
  };

  //map.addControl(mousePositionControl);
  /**
   * @ngdoc method
   * @name hs.map.service#puremap
   * @public
   * @description Clean interactions and zoom from map to get pure map
   */
  this.puremap = function () {
    const interactions = me.map.getInteractions();
    const controls = me.map.getControls();
    angular.forEach(interactions, (interaction) => {
      me.map.removeInteraction(interaction);
    });
    angular.forEach(controls, (control) => {
      me.map.removeControl(control);
    });
    $timeout(me.puremap, 1000);
  };

  /**
   * @ngdoc method
   * @public
   * @param {number} x X coordinate of new center
   * @param {number} y Y coordinate of new center
   * @param {number} zoom New zoom level
   * @description Move map and zoom to specified coordinate/zoom level
   */
  this.moveToAndZoom = function (x, y, zoom) {
    const view = me.map.getView();
    view.setCenter([x, y]);
    view.setZoom(zoom);
  };

  this.getMapExtent = function () {
    const mapSize = me.map.getSize();
    const mapExtent = angular.isDefined(mapSize) ?
      me.map.getView().calculateExtent(mapSize) :
      [0, 0, 100, 100];
    return mapExtent;
  };

  this.getMapExtentInEpsg4326 = function () {
    const bbox = transformExtent(me.getMapExtent(),
      me.map.getView().getProjection(),
      'EPSG:4326');
    return bbox;
  };

  /**
   * @ngdoc method
   * @name hs.map.service#getMap
   * @public
   * @description Get ol.Map object from service
   * @returns {ol.Map} ol.Map
   */
  this.getMap = function () {
    return OlMap.map;
  };

}];
