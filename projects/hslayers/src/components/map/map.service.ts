import BaseLayer from 'ol/layer/Base';
import proj4 from 'proj4';
import {
  Cluster,
  ImageArcGISRest,
  ImageWMS,
  OSM,
  ImageStatic as Static,
  TileArcGISRest,
  TileWMS,
  Vector,
  WMTS,
  XYZ,
} from 'ol/source';
import {
  Control,
  MousePosition,
  ScaleLine,
  defaults as controlDefaults,
} from 'ol/control';
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
import {Group, Layer} from 'ol/layer';
import {Injectable, Renderer2, RendererFactory2} from '@angular/core';
import {Kinetic, Map, View} from 'ol';
import {Projection, transform, transformExtent} from 'ol/proj';
import {
  always as alwaysCondition,
  never as neverCondition,
  platformModifierKeyOnly as platformModifierKeyOnlyCondition,
} from 'ol/events/condition';
import {createStringXY} from 'ol/coordinate';
import {register} from 'ol/proj/proj4';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getBase,
  getDimensions,
  getEnableProxy,
  getTitle,
} from '../../common/layer-extensions';

import TileState from 'ol/TileState';

export enum DuplicateHandling {
  AddDuplicate = 0,
  IgnoreNew = 1,
  RemoveOriginal = 2,
}

@Injectable({
  providedIn: 'root',
})
export class HsMapService {
  private renderer: Renderer2;
  visibleLayersInUrl;
  //timer variable for extent change event
  timer = null;
  puremap: any;
  /**
   * @name HsMapService#duration
   * @public
   * @type {number} 400
   * @description Duration of added interactions animation. (400 ms used, default in OpenLayers is 250 ms)
   */
  duration = 400;
  map: Map;
  defaultMobileControls = controlDefaults({
    zoom: false,
  });
  defaultDesktopControls = controlDefaults({
    attributionOptions: {
      collapsible: true,
      collapsed: true,
    },
  });
  /**
   * @name HsMapService#controls
   * @public
   * @type {object}
   * @description Set of default map controls used in HSLayers, may be loaded from config file
   */

  controls = this.defaultDesktopControls;
  mapElement: any;
  /**
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
  interactions = {
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
        if (this.HsConfig.componentsEnabled?.mapControls == false) {
          return neverCondition;
        }
        return this.HsConfig.zoomWithModifierKeyOnly
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

  element: any;
  visible: boolean;
  featureLayerMapping = {};

  constructor(
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    this.defaultDesktopControls.removeAt(1);
    this.defaultDesktopControls.push(new ScaleLine());
    if (HsConfig.componentsEnabled?.defaultViewButton) {
      //make sure translations are loaded
      setTimeout(() => {
        this.createDefaultViewButton();
      }, 500);
    }
  }
  /**
   * Returns the associated layer for feature.
   * This is used in query-vector.service to get the layer of clicked
   * feature when features are listed in info panel.
   *
   * @param feature
   * @return {Vector} Layer.
   */
  getLayerForFeature(feature) {
    if (typeof feature.getId() == 'undefined') {
      feature.setId(this.HsUtilsService.generateUuid());
    }
    const fid = feature.getId();
    if (this.featureLayerMapping[fid]) {
      return this.featureLayerMapping[fid];
    }
    let layer_;
    const layersToLookFor = [];
    const check = (layer) => {
      const source = layer.getSource();
      if (this.HsUtilsService.instOf(source, Cluster)) {
        layersToLookFor.push({
          layer,
          source,
        });
        layersToLookFor.push({
          layer,
          source: source.getSource(),
        });
      } else if (this.HsUtilsService.instOf(source, Vector)) {
        layersToLookFor.push({
          layer,
          source,
        });
      }
    };
    this.map.getLayers().forEach((layer) => {
      if (this.HsUtilsService.instOf(layer, Group)) {
        layer.getLayers().forEach(check);
      } else {
        check(layer);
      }
    });
    for (const obj of layersToLookFor) {
      let found = false;
      if (obj.source.getFeatureById) {
        //For ordinary vector layers we can search by Id
        found = obj.source.getFeatureById(fid);
      } else {
        //For cluster layers we need to loop through features
        found = obj.source.getFeatures().some((layer_feature) => {
          return layer_feature === feature;
        });
      }

      if (found) {
        layer_ = obj.layer;
        break;
      }
    }
    if (layer_ && !this.featureLayerMapping[fid]) {
      //TODO: Will have to delete the mapping at some point when layer is cleared or feature removed
      this.featureLayerMapping[fid] = layer_;
    }
    return layer_;
  }
  createDefaultViewButton() {
    const button = this.renderer.createElement('button');
    button.addEventListener(
      'click',
      (e) => {
        this.setDefaultView(e);
      },
      false
    );

    const icon = this.renderer.createElement('i');
    this.renderer.addClass(icon, 'glyphicon');
    this.renderer.addClass(icon, 'icon-globe');

    this.element = this.renderer.createElement('div');
    this.renderer.addClass(this.element, 'hs-defaultView');
    this.renderer.addClass(this.element, 'ol-unselectable');
    this.renderer.addClass(this.element, 'ol-control');

    this.renderer.setAttribute(
      this.element,
      'title',
      this.HsLanguageService.getTranslation('MAP.zoomToInitialWindow')
    );

    this.renderer.appendChild(button, icon);
    this.renderer.appendChild(this.element, button);
    const defaultViewControl = new Control({
      element: this.element,
    });
    this.defaultDesktopControls.push(defaultViewControl);
  }

  setDefaultView = function (e) {
    this.map
      .getView()
      .setCenter(
        this.HsConfig.composition_view?.getCenter() ||
          this.HsConfig.default_view.getCenter()
      );
    this.map
      .getView()
      .setZoom(
        this.HsConfig.composition_view?.getZoom() ||
          this.HsConfig.default_view.getZoom()
      );
  };
  /**
   * @param e
   */
  extentChanged(e) {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.HsEventBusService.mapExtentChanges.next({
        element: e.element,
        extent: this.map.getView().calculateExtent(this.map.getSize()),
      });
    }, 500);
  }

  /**
   * @ngdoc method
   * @name HsMapService#init
   * @public
   * @description Initialization function for HSLayers map object. Initialize map with basic interaction, scale line and watcher for map view changes. When default controller is used, its called automaticaly, otherwise its must be called before other modules dependent on map object are loaded.
   */
  init() {
    if (this.map) {
      this.map.setTarget(this.mapElement);
    } else {
      this.map = new Map({
        controls: this.controls,
        target: this.mapElement,
        interactions: [],
        view: this.cloneView(
          this.HsConfig.default_view || this.createPlaceholderView()
        ),
      });

      this.map.getView().on('change:center', (e) => {
        this.extentChanged(e);
      });
      this.map.getView().on('change:resolution', (e) => {
        this.extentChanged(e);
      });

      this.map.on('moveend', (e) => {
        this.extentChanged(e);
      });
    }

    if (this.HsConfig.mapInteractionsEnabled != false) {
      for (const value of Object.values(this.interactions).filter(
        (value) => !this.map.getInteractions().getArray().includes(value)
      )) {
        this.map.addInteraction(value);
      }
    }

    //this.map.addControl(new ol.control.ZoomSlider());
    // this.map.addControl(new ol.control.ScaleLine());

    // If the MouseWheelInteraction is set to behave only with CTRL pressed,
    // then also notify the user when he tries to zoom,
    // but the CTRL is not pressed
    if (
      this.HsConfig.zoomWithModifierKeyOnly &&
      this.HsConfig.mapInteractionsEnabled != false
    ) {
      this.map.on('wheel', (e) => {
        //ctrlKey works for Win and Linux, metaKey for Mac
        if (
          !(e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
          !this.HsLayoutService.contentWrapper.querySelector(
            '.hs-zoom-info-dialog'
          )
        ) {
          //TODO: change the name of platform modifier key dynamically based on OS
          const platformModifierKey = 'CTRL/META';
          //Following styles would be better written as ng-styles...
          const html = this.renderer.createElement('div');
          this.renderer.setAttribute(
            html,
            'class',
            'alert alert-info mt-1 hs-zoom-info-dialog'
          );
          this.renderer.setAttribute(
            html,
            'style',
            `position: absolute; right:15px; top:0.6em;z-index:101`
          );
          const text = this.renderer.createText(
            `${this.HsLanguageService.getTranslation('MAP.zoomKeyModifier', {
              platformModifierKey: platformModifierKey,
            })}`
          );
          this.renderer.appendChild(html, text);
          this.renderer.appendChild(
            this.HsLayoutService.contentWrapper.querySelector('.hs-map-space'),
            html
          );
          setTimeout(() => {
            this.HsLayoutService.contentWrapper
              .querySelector('.hs-zoom-info-dialog')
              .remove();
          }, 4000);
        }
      });
    }

    this.repopulateLayers(this.visibleLayersInUrl);

    proj4.defs(
      'EPSG:5514',
      '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=542.5,89.2,456.9,5.517,2.275,5.516,6.96 +units=m +no_defs'
    );
    proj4.defs(
      'EPSG:4258',
      '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
    );
    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
    register(proj4);
    if (this.HsConfig.componentsEnabled?.mapControls == false) {
      this.removeAllControls();
    }
    this.HsEventBusService.olMapLoads.next(this.map);
  }

  loaded() {
    return new Promise<Map>((resolve, reject) => {
      if (this.map) {
        resolve(this.map);
        return;
      } else {
        this.HsEventBusService.olMapLoads.subscribe((map) => {
          if (map) {
            resolve(map);
          }
        });
      }
    });
  }

  //clone View to not overwrite default
  /**
   * @param template
   */
  cloneView(template: View): View {
    const view = new View({
      extent: template.options_.extent,
      maxZoom: template.getMaxZoom(),
      minZoom: template.getMinZoom(),
      center: template.getCenter(),
      zoom: template.getZoom(),
      projection: template.getProjection(),
      rotation: template.getRotation(),
      constrainOnlyCenter: template.options_.constrainOnlyCenter || false,
      smoothExtentConstraint: template.options_.smoothExtentConstraint || true,
      multiWorld: template.options_.multiWorld || false,
    });
    return view;
  }

  /**
   * @ngdoc method
   * @name HsMapService#findLayerByTitle
   * @public
   * @param {string} title Title of the layer (from layer creation)
   * @return {Ol.layer} Ol.layer object
   * @description Find layer object by title of layer
   */
  findLayerByTitle(title) {
    const layers = this.map.getLayers().getArray();
    let tmp = null;
    for (const layer of layers) {
      if (getTitle(layer) == title) {
        tmp = layer;
      }
    }
    return tmp;
  }

  /**
   * @param {ol/Layer} existingLayers Layer 1. Usually the one which is already added to map
   * @param {ol/Layer} newLayer Layer 2. Usually the one which will be added to map
   * @return {boolean} True if layers are equal
   */
  layersEqual(existingLayers, newLayer) {
    if (newLayer === 'undefined') {
      console.warn(
        'Checking duplicity for undefined layer. Why are we doing this?'
      );
      return true;
    }
    if (existingLayers.getSource === 'undefined') {
      return false;
    }
    if (newLayer.getSource === 'undefined') {
      return false;
    }
    const existingSource = existingLayers.getSource();
    const newSource = newLayer.getSource();
    const existingTitle = getTitle(existingLayers);
    const newTitle = getTitle(newLayer);
    const existingSourceType = typeof existingSource;
    const newSourceType = typeof newSource;
    const existingLAYERS =
      existingSource.getParams == null ? '' : existingSource.getParams().LAYERS;
    const newLAYERS =
      newSource.getParams == null ? '' : newSource.getParams().LAYERS;
    const existingUrl =
      existingSource.getUrl == null ? '' : existingSource.getUrl();
    const newUrl = newSource.getUrl == null ? '' : newSource.getUrl();
    const existingUrls =
      existingSource.getUrls == null ? '' : existingSource.getUrls();
    let newUrls = newSource.getUrls == null ? [''] : newSource.getUrls();
    newUrls = newUrls ? newUrls : [''];
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
   * @name HsMapService#layerAlreadyExists
   * @description Checks if a layer with the same title already exists in the map
   * @param {ol/Layer} lyr A layer to check
   * @return {boolean} True if layer is already present in the map, false otherwise
   */
  layerAlreadyExists(lyr) {
    const duplicateLayers = this.map
      .getLayers()
      .getArray()
      .filter((existing) => {
        const equal = this.layersEqual(existing, lyr);
        return equal;
      });
    return duplicateLayers.length > 0;
  }

  removeDuplicate(lyr) {
    this.map
      .getLayers()
      .getArray()
      .filter((existing) => {
        const equal = this.layersEqual(existing, lyr);
        return equal;
      })
      .forEach((to_remove) => {
        this.map.getLayers().remove(to_remove);
      });
  }

  getLayersArray(): BaseLayer[] {
    return this.map.getLayers().getArray();
  }

  /**
   * @param lyr {Layer} Layer which to proxify if needed
   * @description Proxify layer based on its source object type and if its tiled or not.
   * Each underlying OL source class has its own way to override imagery loading.
   */
  proxifyLayer(lyr: Layer): void {
    const source = lyr.getSource();
    if (
      [ImageWMS, ImageArcGISRest].some((typ) =>
        this.HsUtilsService.instOf(source, typ)
      )
    ) {
      this.proxifyLayerLoader(lyr, false);
    }
    if (this.HsUtilsService.instOf(source, WMTS)) {
      source.setTileLoadFunction((i, s) => this.simpleImageryProxy(i, s));
    }
    if (
      [TileWMS, TileArcGISRest].some((typ) =>
        this.HsUtilsService.instOf(source, typ)
      )
    ) {
      this.proxifyLayerLoader(lyr, true);
    }
    if (
      this.HsUtilsService.instOf(source, XYZ) &&
      !this.HsUtilsService.instOf(source, OSM) &&
      source.getUrls().filter((url) => url.indexOf('openstreetmap') > -1)
        .length == 0
    ) {
      this.proxifyLayerLoader(lyr, true);
    }

    if (this.HsUtilsService.instOf(source, Static)) {
      //NOTE: Using url_ is not nice, but don't see other way, because no setUrl or set('url'.. exists yet
      source.url_ = this.HsUtilsService.proxify(source.getUrl());
    }
  }

  /**
   * Function to add layer to map which also checks if
   * the layer is not already present and also proxifies the layer if needed.
   * Generally for non vector layers it would be better to use this function than to add to OL map directly
   * and rely on layer manager service to do the proxifiction and also it's shorter than to use HsMapService.map.addLayer.
   *
   * @param lyr Layer to add
   * @param duplicateHandling How to handle duplicate layers (same class and title)
   * @param visibleOverride Override the visibility using an array layer titles, which
   */
  addLayer(
    lyr: Layer,
    duplicateHandling?: DuplicateHandling,
    visibleOverride?: string[]
  ): void {
    if (this.layerAlreadyExists(lyr)) {
      switch (duplicateHandling) {
        case DuplicateHandling.RemoveOriginal:
          if (getBase(lyr) == true) {
            return;
          }
          this.removeDuplicate(lyr);
          break;
        case DuplicateHandling.IgnoreNew:
          return;
        case DuplicateHandling.AddDuplicate:
        default:
      }
    }
    if (visibleOverride) {
      lyr.setVisible(this.layerTitleInArray(lyr, visibleOverride));
    }
    const source = lyr.getSource();
    if (this.HsUtilsService.instOf(source, Vector)) {
      this.getVectorType(lyr);
    }
    this.proxifyLayer(lyr);
    lyr.on('change:source', (e) => {
      this.proxifyLayer(e.target);
    });
    this.map.addLayer(lyr);
  }

  /**
   * @ngdoc method
   * @name HsMapService#repopulateLayers
   * @public
   * @param {Array} visibilityOverrides Override the visibility using an array layer titles, which
   * should be visible. Usefull when the layer visibility is stored in a URL parameter
   * @description Add all layers from app config (box_layers and default_layers) to the map.
   * Only layers specified in visibilityOverrides parameter will get instantly visible.
   */

  repopulateLayers(visibilityOverrides) {
    if (this.HsConfig.box_layers) {
      this.HsConfig.box_layers.forEach((box) => {
        for (const lyr of box.getLayers().getArray()) {
          this.addLayer(lyr, DuplicateHandling.IgnoreNew, visibilityOverrides);
        }
      });
    }

    if (this.HsConfig.default_layers) {
      this.HsConfig.default_layers.forEach((lyr) => {
        this.addLayer(lyr, DuplicateHandling.IgnoreNew, visibilityOverrides);
      });
    }
  }

  getCurrentProj(): Projection {
    return this.map.getView().getProjection();
  }

  getVectorType(layer) {
    let src;
    if (layer.getSource().getSource) {
      src = layer.getSource().getSource();
    } else {
      src = layer.getSource();
    }
    src.hasLine = false;
    src.hasPoly = false;
    src.hasPoint = false;
    if (src.getFeatures().length > 0) {
      this.vectorSourceTypeComputer(src);
    } else {
      src.on('change', (evt) => {
        const source = evt.target;
        if (source.getState() === 'ready') {
          this.vectorSourceTypeComputer(source);
        }
      });
    }
  }

  /**
   * @param src
   */
  vectorSourceTypeComputer(src) {
    src.getFeatures().forEach((f) => {
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
          default:
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
  reset() {
    this.removeAllLayers();
    this.repopulateLayers(null);
    this.resetView();
  }

  /**
   * @ngdoc method
   * @name HsMapService#resetView
   * @public
   * @description Reset map view to view configured in app config
   */
  resetView() {
    this.map.setView(
      this.cloneView(this.HsConfig.default_view || this.createPlaceholderView())
    );
  }

  /**
   *
   */
  createPlaceholderView() {
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
   * @return {boolean} Detected visibility of layer
   * @description Checks if layer title is present in an array of layer titles.
   * Used to set visibility by URL parameter which contains visible layer titles
   */
  layerTitleInArray(lyr, array) {
    if (array) {
      return array.filter((title) => title == getTitle(lyr)).length > 0;
    }
    return lyr.getVisible();
  }

  getCanvases() {
    return this.mapElement.querySelectorAll('.ol-layer canvas');
  }

  /**
   * @ngdoc method
   * @name HsMapService#proxifyLayerLoader
   * @public
   * @param {Ol.layer} lyr Layer to proxify
   * @param {boolean} tiled Info if layer is tiled
   * @description Proxify layer loader to work with layers from other sources than app
   */
  proxifyLayerLoader(lyr, tiled) {
    const src = lyr.getSource();
    if (getEnableProxy(lyr) && getEnableProxy(lyr) == false) {
      return;
    }
    if (tiled) {
      const tile_url_function =
        src.getTileUrlFunction() || src.tileUrlFunction();
      src.setTileUrlFunction((b, c, d) => {
        let url = tile_url_function.call(src, b, c, d);
        if (getDimensions(lyr)) {
          const dimensions = getDimensions(lyr);
          Object.keys(dimensions).forEach((dimension) => {
            url = url.replace(`{${dimension}}`, dimensions[dimension].value);
          });
        }
        if (url.indexOf(this.HsConfig.proxyPrefix) == 0) {
          return url;
        } else {
          return this.HsUtilsService.proxify(url);
        }
      });
      src.setTileLoadFunction((tile, src) => {
        const laymanEp = this.HsConfig.datasources?.find(
          (ep) => ep.type == 'layman'
        );
        if (laymanEp && src.startsWith(laymanEp.url)) {
          this.laymanWmsLoadingFunction(tile, src);
        } else {
          tile.getImage().src = src;
        }
      });
    } else {
      src.setImageLoadFunction((i, s) => this.simpleImageryProxy(i, s));
    }
  }

  simpleImageryProxy(image, src) {
    if (src.indexOf(this.HsConfig.proxyPrefix) == 0) {
      image.getImage().src = src;
    } else {
      const laymanEp = this.HsConfig.datasources?.find(
        (ep) => ep.type == 'layman'
      );
      if (laymanEp && src.startsWith(laymanEp.url)) {
        this.laymanWmsLoadingFunction(image, src);
      } else {
        image.getImage().src = this.HsUtilsService.proxify(src); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
      }
    }
  }

  laymanWmsLoadingFunction(image, src: string) {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', src);
    xhr.addEventListener('loadend', function (evt) {
      const arrayBufferView = new Uint8Array(this.response);
      const blob = new Blob([arrayBufferView], {type: 'image/png'});
      const urlCreator = window.URL || window.webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      image.getImage().src = imageUrl;
    });
    xhr.send();
  }

  /**
   * @ngdoc method
   * @public
   * @param {number} x X coordinate of new center
   * @param {number} y Y coordinate of new center
   * @param {number} zoom New zoom level
   * @description Move map and zoom to specified coordinate/zoom level
   */
  moveToAndZoom(x, y, zoom) {
    const view = this.map.getView();
    view.setCenter([x, y]);
    view.setZoom(zoom);
  }

  getMapExtent() {
    const mapSize = this.map.getSize();
    const mapExtent = mapSize
      ? this.map.getView().calculateExtent(mapSize)
      : [0, 0, 100, 100];
    return mapExtent;
  }

  getMapExtentInEpsg4326() {
    const bbox = transformExtent(
      this.getMapExtent(),
      this.getCurrentProj(),
      'EPSG:4326'
    );
    return bbox;
  }

  /**
   * @ngdoc method
   * @name HsMapService#getMap
   * @public
   * @description Get ol.Map object from service
   * @return {ol.Map} ol.Map
   */
  getMap() {
    return this.map;
  }

  removeAllLayers() {
    const to_be_removed = [];
    this.map.getLayers().forEach((lyr) => {
      to_be_removed.push(lyr);
    });
    while (to_be_removed.length > 0) {
      this.map.removeLayer(to_be_removed.shift());
    }
  }
  removeAllControls() {
    this.map.getControls().forEach((control) => {
      this.map.removeControl(control);
    });
    this.HsConfig.componentsEnabled.mapControls = false;
  }

  removeAllInteractions() {
    this.map.getInteractions().forEach((interaction) => {
      this.map.removeInteraction(interaction);
    });
    this.HsConfig.mapInteractionsEnabled = false;
  }
}
