/* eslint-disable angular/timeout-service */
import '../permalink/permalink.module';
import Control from 'ol/control/Control';
import Feature from 'ol/Feature';
import Kinetic from 'ol/Kinetic';
import Map from 'ol/Map';
import Static from 'ol/source/ImageStatic';
import View from 'ol/View';
import proj4 from 'proj4';
import {Cluster, OSM, Vector} from 'ol/source';
import {
  DoubleClickZoom,
  DragPan,
  DragRotate,
  DragZoom,
  KeyboardPan,
  KeyboardZoom,
  MouseWheelZoom,
  PinchRotate,
  PinchZoom,
} from 'ol/interaction';
import {Group} from 'ol/layer';
import {
  ImageArcGISRest,
  ImageWMS,
  TileArcGISRest,
  TileWMS,
  XYZ,
} from 'ol/source';
import {
  MousePosition,
  ScaleLine,
  defaults as controlDefaults,
} from 'ol/control';
import {
  always as alwaysCondition,
  never as neverCondition,
  platformModifierKeyOnly as platformModifierKeyOnlyCondition,
} from 'ol/events/condition';
import {createStringXY} from 'ol/coordinate';
import {register} from 'ol/proj/proj4';
import {transform, transformExtent} from 'ol/proj';

/**
 * @param HsConfig
 * @param $rootScope
 * @param HsUtilsService
 * @param HsLayoutService
 * @param $timeout
 * @param gettext
 * @param $log
 */
export default function (
  HsConfig,
  $rootScope,
  HsUtilsService,
  HsLayoutService,
  $timeout,
  gettext,
  $log
) {
  'ngInject';
  const me = this;
  /**
   * This is a workaround.
   * Returns the associated layer.
   * This is used in query-vector.service to get the layer of clicked
   * feature when features are listed in info panel.
   *
   * @param {ol.Map} map
   * @returns {ol.layer.Vector} Layer.
   */
  Feature.prototype.getLayer = function (map) {
    const this_ = this;
    let layer_;
    const layersToLookFor = [];
    const check = function (layer) {
      let features = [];
      let source = layer.getSource();
      if (HsUtilsService.instOf(source, Vector)) {
        features = source.getFeatures();
      }
      if (HsUtilsService.instOf(source, Cluster)) {
        source = source.getSource();
        features = features.concat(source.getFeatures());
      }
      if (HsUtilsService.instOf(source, Vector)) {
        if (features.length > 0) {
          layersToLookFor.push({
            layer: layer,
            features: features,
          });
        }
      }
    };
    me.map.getLayers().forEach((layer) => {
      if (HsUtilsService.instOf(layer, Group)) {
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
  let timer;
  /**
   * @ngdoc method
   * @name HsMapService#init
   * @public
   * @description Initialization function for HSLayers map object. Initialize map with basic interaction, scale line and watcher for map view changes. When default controller is used, its called automaticaly, otherwise its must be called before other modules dependent on map object are loaded.
   */
  this.init = function () {
    if (angular.isDefined(me.map)) {
      me.removeAllLayers();
    }
    me.map = new Map({
      controls: me.controls,
      target: me.mapElement,
      interactions: [],
      view: cloneView(HsConfig.default_view || createPlaceholderView()),
    });

    me.visible = true;

    /**
     * @param e
     */
    function extentChanged(e) {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        /**
         * @ngdoc event
         * @name HsMapService#map.extent_changed
         * @eventType broadcast on $rootScope
         * @description Fires when map extent change (move, zoom, resize). Fires with two parameters: map element and new calculated {@link http://openlayers.org/en/latest/apidoc/ol.html#.Extent extent}
         */
        $rootScope.$broadcast(
          'map.extent_changed',
          e.element,
          me.map.getView().calculateExtent(me.map.getSize())
        );
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
    if (angular.isDefined(HsConfig.zoomWithModifierKeyOnly)) {
      me.map.on('wheel', (e) => {
        //ctrlKey works for Win and Linux, metaKey for Mac
        if (
          !(e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
          !HsLayoutService.contentWrapper.querySelector('.hs-zoom-info-dialog')
        ) {
          //TODO: change the name of platform modifier key dynamically based on OS
          const platformModifierKey = 'CTRL or META';
          //Following styles would be better written as ng-styles...
          const html = `<div
            class="alert alert-info mt-1 hs-zoom-info-dialog"
            style="
              position: absolute;
              ${
                !HsLayoutService.sidebarBottom() && HsLayoutService.sidebarRight
                  ? 'right'
                  : null
              }: ${HsLayoutService.panelSpaceWidth() + 10}px;
              ${
                !HsLayoutService.sidebarBottom() &&
                !HsLayoutService.sidebarRight
                  ? 'left'
                  : null
              }: ${HsLayoutService.panelSpaceWidth() + 10}px;
              ${HsLayoutService.sidebarBottom() ? 'bottom:' : null}: ${
            HsLayoutService.panelSpaceHeight() + 5
          }px};"
            role="alert">
            Use ${platformModifierKey} key + mouse-wheel to zoom the map.
            </div>`;
          const element = angular.element(html)[0];
          //TODO: '.hs-gui-overlay' is not available in HsCore.puremapApp mode => place it somewhere else
          HsLayoutService.contentWrapper
            .querySelector('.hs-gui-overlay')
            .appendChild(element);
          $timeout(() => {
            HsLayoutService.contentWrapper
              .querySelector('.hs-zoom-info-dialog')
              .remove();
          }, 3000);
        }
      });
    }

    me.repopulateLayers(me.visibleLayersInUrl);

    proj4.defs(
      'EPSG:5514',
      'PROJCS["S-JTSK / Krovak East North",GEOGCS["S-JTSK",DATUM["System_Jednotne_Trigonometricke_Site_Katastralni",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],TOWGS84[589,76,480,0,0,0,0],AUTHORITY["EPSG","6156"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4156"]],PROJECTION["Krovak"],PARAMETER["latitude_of_center",49.5],PARAMETER["longitude_of_center",24.83333333333333],PARAMETER["azimuth",30.28813972222222],PARAMETER["pseudo_standard_parallel_1",78.5],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],AUTHORITY["EPSG","5514"]]'
    );
    proj4.defs(
      'EPSG:4258',
      '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
    );
    register(proj4);

    /**
     * @ngdoc event
     * @name HsMapService#map.loaded
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
          if (me.map) {
            resolve(me.map);
          } else {
            reject();
          }
        }, 1000);
      }
    });
  };

  //clone View to not overwrite default
  /**
   * @param template
   */
  function cloneView(template) {
    const view = new View({
      center: template.getCenter(),
      zoom: template.getZoom(),
      projection: template.getProjection(),
      rotation: template.getRotation(),
    });
    return view;
  }

  /**
   * @ngdoc property
   * @name HsMapService#duration
   * @public
   * @type {number} 400
   * @description Duration of added interactions animation. (400 ms used, default in OpenLayers is 250 ms)
   */
  this.duration = 400;

  /**
   * @ngdoc property
   * @name HsMapService#controls
   * @public
   * @type {object}
   * @description Set of default map controls used in HSLayers, may be loaded from config file
   */
  const defaultDesktopControls = controlDefaults({
    attributionOptions: {
      collapsible: true,
      collapsed: true,
    },
  });

  //creates custom default view control
  const setDefaultView = function (e) {
    me.map.getView().setCenter(HsConfig.default_view.getCenter());
    me.map.getView().setZoom(HsConfig.default_view.getZoom());
  };

  const button = document.createElement('button');
  button.addEventListener('click', setDefaultView, false);

  const icon = document.createElement('i');
  icon.className = 'glyphicon icon-globe';

  const element = document.createElement('div');
  element.className = 'hs-defaultView ol-unselectable ol-control';
  element.setAttribute(
    'ng-if',
    "layoutService.componentEnabled('defaultViewButton')"
  );
  element.title = gettext('Zoom to initial window');

  button.appendChild(icon);
  element.appendChild(button);

  const defaultViewControl = new Control({
    element: element,
  });

  defaultDesktopControls.removeAt(1);
  defaultDesktopControls.push(new ScaleLine());

  defaultDesktopControls.push(defaultViewControl);

  const defaultMobileControls = controlDefaults({
    zoom: false,
  });

  this.controls = angular.isDefined(HsConfig.mapControls)
    ? HsConfig.mapControls
    : window.cordova
    ? defaultMobileControls
    : defaultDesktopControls;

  /**
   * @ngdoc property
   * @name HsMapService#interactions
   * @public
   * @type {object}
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
      duration: this.duration,
    }),
    'KeyboardPan': new KeyboardPan({
      pixelDelta: 256,
    }),
    'KeyboardZoom': new KeyboardZoom({
      duration: this.duration,
    }),
    'MouseWheelZoom': new MouseWheelZoom({
      condition: (browserEvent) => {
        if (
          HsConfig.componentsEnabled &&
          HsConfig.componentsEnabled.mapControls == false
        ) {
          return neverCondition;
        }
        return angular.isDefined(HsConfig.zoomWithModifierKeyOnly)
          ? platformModifierKeyOnlyCondition(browserEvent)
          : alwaysCondition;
      },
      duration: this.duration,
    }),
    'PinchRotate': new PinchRotate(),
    'PinchZoom': new PinchZoom({
      constrainResolution: true,
      duration: this.duration,
    }),
    'DragPan': new DragPan({
      kinetic: new Kinetic(-0.01, 0.1, 200),
    }),
    'DragZoom': new DragZoom(),
    'DragRotate': new DragRotate(),
  };

  //Mouse position control, currently not used
  const mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(4),
    undefinedHTML: '&nbsp;',
  });

  /**
   * @ngdoc method
   * @name HsMapService#findLayerByTitle
   * @public
   * @param {string} title Title of the layer (from layer creation)
   * @returns {Ol.layer} Ol.layer object
   * @description Find layer object by title of layer
   */
  this.findLayerByTitle = function (title) {
    const layers = me.map.getLayers();
    let tmp = null;
    angular.forEach(layers, (layer) => {
      if (layer.get('title') == title) {
        tmp = layer;
      }
    });
    return tmp;
  };

  /**
   * @param {ol/Layer} existingLayers Layer 1. Usually the one which is already added to map
   * @param {ol/Layer} newLayer Layer 2. Usually the one which will be added to map
   * @returns {boolean} True if layers are equal
   */
  function layersEqual(existingLayers, newLayer) {
    if (angular.isUndefined(newLayer)) {
      $log.warn(
        'Checking duplicity for undefined layer. Why are we doing this?'
      );
      return true;
    }
    if (angular.isUndefined(existingLayers.getSource)) {
      return false;
    }
    if (angular.isUndefined(newLayer.getSource)) {
      return false;
    }
    const existingSource = existingLayers.getSource();
    const newSource = newLayer.getSource();
    const existingTitle = existingLayers.get('title');
    const newTitle = newLayer.get('title');
    const existingSourceType = typeof existingSource;
    const newSourceType = typeof newSource;
    const existingLAYERS = angular.isUndefined(existingSource.getParams)
      ? ''
      : existingSource.getParams().LAYERS;
    const newLAYERS = angular.isUndefined(newSource.getParams)
      ? ''
      : newSource.getParams().LAYERS;
    const existingUrl = angular.isUndefined(existingSource.getUrl)
      ? ''
      : existingSource.getUrl();
    const newUrl = angular.isUndefined(newSource.getUrl)
      ? ''
      : newSource.getUrl();
    const existingUrls = angular.isUndefined(existingSource.getUrls)
      ? ''
      : existingSource.getUrls();
    const newUrls = angular.isUndefined(newSource.getUrls)
      ? ['']
      : newSource.getUrls();
    const urlsEqual =
      existingUrls == newUrls ||
      (newUrls.length > 0 && existingUrls.indexOf(newUrls[0]) > -1);
    return (
      existingTitle == newTitle &&
      existingSourceType == newSourceType &&
      existingLAYERS == newLAYERS &&
      existingUrl == newUrl &&
      urlsEqual
    );
  }

  /**
   * @ngdoc method
   * @name HsMapService#layerDuplicate
   * @description Checks if a layer with the same title alredy exists in the map
   * @param {ol/Layer} lyr A layer to check
   * @returns {boolean} True if layer is already present in the map, false otherwise
   */
  this.layerDuplicate = (lyr) => {
    const duplicateLayers = me.map
      .getLayers()
      .getArray()
      .filter((existing) => {
        const equal = layersEqual(existing, lyr);
        return equal;
      });
    return duplicateLayers.length > 0;
  };

  this.removeDuplicate = (lyr) => {
    me.map
      .getLayers()
      .getArray()
      .filter((existing) => {
        const equal = layersEqual(existing, lyr);
        return equal;
      })
      .forEach((to_remove) => {
        me.map.getLayers().remove(to_remove);
      });
  };

  /**
   * @ngdoc method
   * @name HsMapService#addLayer
   * @param {ol/Layer} lyr Layer to add
   * @param {boolean} removeIfExists True if we want to remove a layer with the same title in case it exists
   * @param {Array} visibilityOverrides Override the visibility using an array layer titles, which
   * @description Function to add layer to map which also checks if
   * the layer is not already present and also proxifies the layer if needed.
   * Generally for non vector layers it would be better to use this function than to add to OL map directly
   * and rely on layer manager service to do the proxifiction and also it's shorter than to use HsMapService.map.addLayer.
   * @returns {ol/Layer} OL layer
   */
  this.addLayer = (lyr, removeIfExists, visibilityOverrides) => {
    if (removeIfExists && me.layerDuplicate(lyr)) {
      me.removeDuplicate(lyr);
    }
    if (angular.isDefined(visibilityOverrides)) {
      lyr.setVisible(me.layerTitleInArray(lyr, visibilityOverrides));
    }
    lyr.manuallyAdded = false;
    const source = lyr.getSource();
    if (
      HsUtilsService.instOf(source, ImageWMS) ||
      HsUtilsService.instOf(source, ImageArcGISRest)
    ) {
      me.proxifyLayerLoader(lyr, false);
    }
    if (
      HsUtilsService.instOf(source, TileWMS) ||
      HsUtilsService.instOf(source, TileArcGISRest)
    ) {
      me.proxifyLayerLoader(lyr, true);
    }
    if (
      HsUtilsService.instOf(source, XYZ) &&
      !HsUtilsService.instOf(source, OSM) &&
      source.getUrls().filter((url) => url.indexOf('openstreetmap') > -1)
        .length == 0
    ) {
      me.proxifyLayerLoader(lyr, true);
    }
    if (HsUtilsService.instOf(source, Vector)) {
      me.getVectorType(lyr);
    }
    if (HsUtilsService.instOf(source, Static)) {
      //NOTE: Using url_ is not nice, but don't see other way, because no setUrl or set('url'.. exists yet
      source.url_ = HsUtilsService.proxify(source.getUrl());
    }
    me.map.addLayer(lyr);
    return lyr;
  };

  /**
   * @ngdoc method
   * @name HsMapService#repopulateLayers
   * @public
   * @param {Array} visibilityOverrides Override the visibility using an array layer titles, which
   * should be visible. Usefull when the layer visibility is stored in a URL parameter
   * @description Add all layers from app config (box_layers and default_layers) to the map.
   * Only layers specified in visibilityOverrides parameter will get instantly visible.
   */
  this.repopulateLayers = (visibilityOverrides) => {
    if (angular.isDefined(HsConfig.box_layers)) {
      angular.forEach(HsConfig.box_layers, (box) => {
        angular.forEach(box.get('layers'), (lyr) => {
          me.addLayer(lyr, false, visibilityOverrides);
        });
      });
    }

    if (angular.isDefined(HsConfig.default_layers)) {
      angular.forEach(HsConfig.default_layers, (lyr) => {
        me.addLayer(lyr, false, visibilityOverrides);
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
    } else {
      src.on('change', (evt) => {
        const source = evt.target;
        if (source.getState() === 'ready') {
          vectorSourceTypeComputer(source);
        }
      });
    }
  };

  /**
   * @param src
   */
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
   * @name HsMapService#reset
   * @public
   * @description Reset map to state configured in app config (reload all layers and set default view)
   */
  this.reset = function () {
    me.removeAllLayers();
    me.repopulateLayers(null);
    me.resetView();
  };

  /**
   * @ngdoc method
   * @name HsMapService#resetView
   * @public
   * @description Reset map view to view configured in app config
   */
  this.resetView = function () {
    me.map.setView(cloneView(HsConfig.default_view || createPlaceholderView()));
  };

  /**
   *
   */
  function createPlaceholderView() {
    return new View({
      center: transform([17.474129, 52.574], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
      zoom: 4,
      units: 'm',
    });
  }

  /**
   * @ngdoc method
   * @name HsMapService#layerTitleInArray
   * @public
   * @param {ol.Layer} lyr Layer for which to determine visibility
   * @param {Array} array Layer title to check in.
   * @returns {boolean} Detected visibility of layer
   * @description Checks if layer title is present in an array of layer titles.
   * Used to set visibility by URL parameter which contains visible layer titles
   */
  this.layerTitleInArray = function (lyr, array) {
    if (array) {
      return array.filter((title) => title == lyr.get('title')).length > 0;
    }
    return lyr.getVisible();
  };

  this.getCanvas = function () {
    return this.mapElement.querySelector('canvas');
  };

  /**
   * @ngdoc method
   * @name HsMapService#proxifyLayerLoader
   * @public
   * @param {Ol.layer} lyr Layer to proxify
   * @param {boolean} tiled Info if layer is tiled
   * @description Proxify layer loader to work with layers from other sources than app
   */
  this.proxifyLayerLoader = function (lyr, tiled) {
    const src = lyr.getSource();
    if (
      angular.isDefined(lyr.get('enableProxy')) &&
      lyr.get('enableProxy') == false
    ) {
      return;
    }
    if (tiled) {
      const tile_url_function =
        src.getTileUrlFunction() || src.tileUrlFunction();
      src.setTileUrlFunction((b, c, d) => {
        let url = tile_url_function.call(src, b, c, d);
        if (lyr.get('dimensions')) {
          const dimensions = lyr.get('dimensions');
          Object.keys(dimensions).forEach((dimension) => {
            url = url.replace(`{${dimension}}`, dimensions[dimension].value);
          });
        }
        if (url.indexOf(HsConfig.proxyPrefix) == 0) {
          return url;
        } else {
          return HsUtilsService.proxify(url);
        }
      });
    } else {
      lyr.getSource().setImageLoadFunction((image, src) => {
        if (src.indexOf(HsConfig.proxyPrefix) == 0) {
          image.getImage().src = src;
        } else {
          image.getImage().src = HsUtilsService.proxify(src); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
        }
      });
    }
  };

  //map.addControl(mousePositionControl);

  $rootScope.$watch(
    () => {
      return HsConfig.mapInteractionsEnabled;
    },
    (value) => {
      if (angular.isDefined(value) && !value) {
        angular.forEach(me.map.getInteractions(), (interaction) => {
          me.map.removeInteraction(interaction);
        });
      }
    }
  );

  $rootScope.$watch(
    () => {
      if (angular.isUndefined(HsConfig.componentsEnabled)) {
        return true;
      }
      return HsConfig.componentsEnabled.mapControls;
    },
    (value) => {
      if (angular.isDefined(value) && !value) {
        angular.forEach(me.map.getControls(), (control) => {
          me.map.removeControl(control);
        });
      }
    }
  );

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
    const mapExtent = angular.isDefined(mapSize)
      ? me.map.getView().calculateExtent(mapSize)
      : [0, 0, 100, 100];
    return mapExtent;
  };

  this.getMapExtentInEpsg4326 = function () {
    const bbox = transformExtent(
      me.getMapExtent(),
      me.map.getView().getProjection(),
      'EPSG:4326'
    );
    return bbox;
  };

  /**
   * @ngdoc method
   * @name HsMapService#getMap
   * @public
   * @description Get ol.Map object from service
   * @returns {ol.Map} ol.Map
   */
  this.getMap = function () {
    return me.map;
  };

  this.removeAllLayers = function () {
    const to_be_removed = [];
    me.map.getLayers().forEach((lyr) => {
      to_be_removed.push(lyr);
    });
    while (to_be_removed.length > 0) {
      me.map.removeLayer(to_be_removed.shift());
    }
  };
  return me;
}
