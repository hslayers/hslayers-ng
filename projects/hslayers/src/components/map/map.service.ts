/* eslint-disable no-eq-null */
import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import proj4 from 'proj4';
import {
  Cluster,
  ImageArcGISRest,
  ImageWMS,
  OSM,
  Source,
  ImageStatic as Static,
  TileArcGISRest,
  TileWMS,
  Vector as VectorSource,
  WMTS,
  XYZ,
} from 'ol/source';
import {Control, ScaleLine, defaults as controlDefaults} from 'ol/control';
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
import {Feature, Kinetic, Map, MapBrowserEvent, View} from 'ol';
import {Geometry} from 'ol/geom';
import {Group, Layer, Tile} from 'ol/layer';
import {Projection, transform, transformExtent} from 'ol/proj';
import {platformModifierKeyOnly as platformModifierKeyOnlyCondition} from 'ol/events/condition';
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
  getRemovable,
  getTitle,
} from '../../common/layer-extensions';

export enum DuplicateHandling {
  AddDuplicate = 0,
  IgnoreNew = 1,
  RemoveOriginal = 2,
}

type VectorAndSource = {
  source: VectorSource<Geometry> | Cluster;
  layer: VectorLayer<VectorSource<Geometry>>;
};

const DEFAULT = 'default';
class AppData {
  map: Map;
  mapElement?: any;
  renderer?: Renderer2;
  featureLayerMapping: {
    [key: string]: VectorAndSource[];
  } = {};
  /* This is a hacky solution so map would always have some layer. 
  Otherwise some weird rendering problems appear in multi-apps mode  */
  placeholderOsm: Layer<Source>;
}

@Injectable({
  providedIn: 'root',
})
export class HsMapService {
  apps: {
    [id: string]: AppData;
  } = {
    default: new AppData(),
  };
  visibleLayersInUrl;
  //timer variable for extent change event
  timer = null;
  puremap: any;
  /**
   * @public
   * 400
   * Duration of added interactions animation. (400 ms used, default in OpenLayers is 250 ms)
   */
  duration = 400;

  /**
   * @public
   * Set of default map interactions used in HSLayers (
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

  element: any;
  visible: boolean;
  /** Copy of the default_view for map resetting purposes */
  originalView: {center: number[]; zoom: number; rotation: number};

  constructor(
    public hsConfig: HsConfig,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    public hsLanguageService: HsLanguageService,
    private rendererFactory: RendererFactory2
  ) {}
  /**
   * Returns the associated layer for feature.
   * This is used in query-vector.service to get the layer of clicked
   * feature when features are listed in info panel.
   * @param feature -
   * @returns VectorLayer
   */
  getLayerForFeature(
    feature,
    app: string
  ): VectorLayer<VectorSource<Geometry>> | VectorLayer<Cluster> {
    if (typeof feature.getId() == 'undefined') {
      feature.setId(this.hsUtilsService.generateUuid());
    }
    const fid = feature.getId();
    if (this.apps[app].featureLayerMapping[fid]) {
      return this.refineLayerSearch(
        this.apps[app].featureLayerMapping[fid],
        feature
      );
    }
    const layersFound: VectorAndSource[] = [];
    const layersToLookFor = [];
    this.getVectorLayers(layersToLookFor, app);
    for (const obj of layersToLookFor) {
      let found = false;
      if (obj.source.getFeatureById) {
        //For ordinary vector layers we can search by Id
        found = obj.source.getFeatureById(fid);
      } else {
        //For cluster layers we need to loop through features
        found = this.findFeatureByInst(obj, feature) !== undefined;
      }
      if (found) {
        layersFound.push(obj);
        //break; Tempting to use break, but if multiple layers contain features with same id we won't find them all.
      }
    }
    if (layersFound && !this.apps[app].featureLayerMapping[fid]) {
      //TODO: Will have to delete the mapping at some point when layer is cleared or feature removed
      this.apps[app].featureLayerMapping[fid] = layersFound;
    }
    return this.refineLayerSearch(layersFound, feature);
  }

  /**
   * When multiple layers contain feature with the same ID do a full search by feature instance instead.
   * @param array - Cached array of layers for a given feature ID
   * @param feature - Instance of feature
   * @returns Layer
   */
  refineLayerSearch(array: VectorAndSource[], feature: Feature<Geometry>) {
    array = array.filter((entry) => entry.layer.getVisible());
    if (array.length > 1) {
      return array.find(
        (entry) => this.findFeatureByInst(entry, feature) !== undefined
      )?.layer;
    } else if (array.length == 1) {
      return array[0].layer;
    }
  }

  /**
   * Search for feature in layer by looping through feature list. getFeatureById is more efficient, but is not always available
   * @param obj - dictionary entry for layer and its vector source (ordinary vector source, source of each Group layers child or underlying source for cluster layer)
   * @param feature - Feature instance
   * @returns Feature
   */
  findFeatureByInst(
    obj: VectorAndSource,
    feature: Feature<Geometry>
  ): Feature<Geometry> {
    return obj.source.getFeatures().find((layer_feature) => {
      return layer_feature === feature;
    });
  }

  /**
   * @public
   * Get vector layers from the map, mentioned in the layersToLookFor array
   * @param layersToLookFor - Layers requested
   * @param app - App identifier
   */
  getVectorLayers(layersToLookFor: VectorAndSource[], app: string): void {
    const check = (layer) => {
      const source = layer.getSource();
      if (this.hsUtilsService.instOf(source, Cluster)) {
        layersToLookFor.push({
          layer,
          source,
        });
        layersToLookFor.push({
          layer,
          source: source.getSource(),
        });
      } else if (this.hsUtilsService.instOf(source, VectorSource)) {
        layersToLookFor.push({
          layer,
          source,
        });
      }
    };
    this.getMap(app ?? DEFAULT)
      .getLayers()
      .forEach((layer) => {
        if (this.hsUtilsService.instOf(layer, Group)) {
          (layer as Group).getLayers().forEach(check);
        } else {
          check(layer);
        }
      });
  }

  /**
   * @public
   * Get geometry feature by its id
   * @param fid - Feature id
   * @param app - App identifier
   */
  getFeatureById(fid: string, app: string): Feature<Geometry> {
    if (this.apps[app].featureLayerMapping[fid]) {
      if (this.apps[app].featureLayerMapping[fid].length > 1) {
        console.warn(`Multiple layers exist for feature id ${fid}`);
      } else {
        return this.apps[app].featureLayerMapping[fid][0].source.getFeatureById(
          fid
        );
      }
    } else {
      const layersToLookFor: {
        source: VectorSource<Geometry> | Cluster;
        layer: any;
      }[] = [];
      this.getVectorLayers(layersToLookFor, app);
      const obj = layersToLookFor.find((obj) => obj.source.getFeatureById(fid));
      if (obj) {
        return obj.source.getFeatureById(fid);
      }
    }
  }

  /**
   * @public
   * Create default view button inside the map html element
   * @param app - App identifier
   * @param defaultDesktopControls - Default controls
   */
  createDefaultViewButton(app: string, defaultDesktopControls) {
    const rendered = this.apps[app].renderer;
    const button = rendered.createElement('button');
    button.addEventListener(
      'click',
      (e) => {
        this.setDefaultView(e, app);
      },
      false
    );

    const icon = rendered.createElement('i');
    rendered.addClass(icon, 'glyphicon');
    rendered.addClass(icon, 'icon-globe');

    this.element = rendered.createElement('div');
    rendered.addClass(this.element, 'hs-defaultView');
    rendered.addClass(this.element, 'ol-unselectable');
    rendered.addClass(this.element, 'ol-control');

    rendered.setAttribute(
      this.element,
      'title',
      this.hsLanguageService.getTranslation(
        'MAP.zoomToInitialWindow',
        undefined,
        app
      )
    );

    rendered.appendChild(button, icon);
    rendered.appendChild(this.element, button);
    const defaultViewControl = new Control({
      element: this.element,
    });
    defaultDesktopControls.push(defaultViewControl);
  }

  /**
   * @public
   * Set map to default view
   * @param e -
   * @param app - App identifier
   */
  setDefaultView = function (e, app) {
    const center = this.HsConfig.get(app).default_view.getCenter();
    this.map.getView().setCenter(center);
    const zoom = this.HsConfig.get(app).default_view.getZoom();
    this.map.getView().setZoom(zoom);
  };
  /**
   * @param e -
   * @param app - App identifier
   */
  extentChanged(e, app: string) {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      const map = this.getMap(app);
      this.hsEventBusService.mapExtentChanges.next({
        e: {
          element: e.element,
          extent: map.getView().calculateExtent(map.getSize()),
        },
        app,
      });
    }, 500);
  }

  /**
   * @public
   * Initialization function for HSLayers map object. Initialize map with basic interaction, scale line and watcher for map view changes. When default controller is used, its called automaticaly, otherwise its must be called before other modules dependent on map object are loaded.
   * @param mapElement - Map html element
   * @param app - App identifier
   */
  init(mapElement, app: string) {
    let map;
    if (this.getMap(app)) {
      map = this.getMap(app);
      map.setTarget(mapElement);
    } else {
      const defaultMobileControls = controlDefaults({
        zoom: false,
      });
      const defaultDesktopControls = controlDefaults({
        attributionOptions: {
          collapsible: true,
          collapsed: true,
        },
      });
      /**
       * @public
       * @type {object}
       * @description Set of default map controls used in HSLayers, may be loaded from config file
       */

      defaultDesktopControls.removeAt(1);
      defaultDesktopControls.push(new ScaleLine());

      const controls = defaultDesktopControls;
      const placeholderOsm = new Tile({
        source: new OSM(),
        visible: true,
        properties: {
          title: 'OpenStreetMap',
          base: true,
          removable: true,
        },
      });
      map = new Map({
        controls,
        layers: [placeholderOsm],
        target: mapElement,
        interactions: [],
        view:
          this.hsConfig.get(app).default_view ?? this.createPlaceholderView(),
      });
      this.apps[app] = {
        mapElement,
        placeholderOsm,
        map,
        renderer: this.rendererFactory.createRenderer(null, null),
        featureLayerMapping: {},
      };
      const view = map.getView();
      this.originalView = {
        center: view.getCenter(),
        zoom: view.getZoom(),
        rotation: view.getRotation(),
      };

      view.on('change:center', (e) => {
        this.extentChanged(e, app);
      });
      view.on('change:resolution', (e) => {
        this.extentChanged(e, app);
      });

      map.on('moveend', (e) => {
        this.extentChanged(e, app);
      });

      setTimeout(() => {
        //make sure translations are loaded
        if (
          this.hsConfig.get(app).componentsEnabled?.defaultViewButton &&
          this.hsConfig.get(app).componentsEnabled?.guiOverlay != false
        ) {
          this.createDefaultViewButton(app, defaultDesktopControls);
        }
      }, 500);
    }

    const interactions = {
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
        condition: (browserEvent): boolean => {
          if (this.hsConfig.get(app).componentsEnabled?.mapControls == false) {
            return false;
          }
          return this.hsConfig.get(app).zoomWithModifierKeyOnly
            ? platformModifierKeyOnlyCondition(browserEvent)
            : true;
        },
        duration: this.duration,
      }),
      'PinchRotate': new PinchRotate(),
      'PinchZoom': new PinchZoom({
        duration: this.duration,
      }),
      'DragPan': new DragPan({
        kinetic: new Kinetic(-0.01, 0.1, 200),
      }),
      'DragZoom': new DragZoom(),
      'DragRotate': new DragRotate(),
    };

    if (this.hsConfig.get(app).mapInteractionsEnabled != false) {
      for (const value of Object.values(interactions).filter(
        (value) => !map.getInteractions().getArray().includes(value)
      )) {
        map.addInteraction(value);
      }
    }

    //this.map.addControl(new ol.control.ZoomSlider());
    // this.map.addControl(new ol.control.ScaleLine());

    // If the MouseWheelInteraction is set to behave only with CTRL pressed,
    // then also notify the user when he tries to zoom,
    // but the CTRL is not pressed
    if (
      this.hsConfig.get(app).zoomWithModifierKeyOnly &&
      this.hsConfig.get(app).mapInteractionsEnabled != false
    ) {
      map.on('wheel' as any, (e: MapBrowserEvent<any>) => {
        const renderer = this.apps[app].renderer;
        //ctrlKey works for Win and Linux, metaKey for Mac
        if (
          !(e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
          !this.hsLayoutService
            .get(app)
            .contentWrapper.querySelector('.hs-zoom-info-dialog')
        ) {
          //TODO: change the name of platform modifier key dynamically based on OS
          const platformModifierKey = 'CTRL/META';
          //Following styles would be better written as ng-styles...
          const html = renderer.createElement('div');
          renderer.setAttribute(
            html,
            'class',
            'alert alert-info mt-1 hs-zoom-info-dialog'
          );
          renderer.setAttribute(
            html,
            'style',
            `position: absolute; right:15px; top:0.6em;z-index:101`
          );
          const text = renderer.createText(
            `${this.hsLanguageService.getTranslation(
              'MAP.zoomKeyModifier',
              {
                platformModifierKey: platformModifierKey,
              },
              app
            )}`
          );
          renderer.appendChild(html, text);
          renderer.appendChild(
            this.hsLayoutService
              .get(app)
              .contentWrapper.querySelector('.hs-map-space'),
            html
          );
          setTimeout(() => {
            this.hsLayoutService
              .get(app)
              .contentWrapper.querySelector('.hs-zoom-info-dialog')
              .remove();
          }, 4000);
        }
      });
    }

    this.repopulateLayers(this.visibleLayersInUrl, app);

    proj4.defs(
      'EPSG:5514',
      '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=542.5,89.2,456.9,5.517,2.275,5.516,6.96 +units=m +no_defs'
    );
    proj4.defs(
      'EPSG:4258',
      '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
    );
    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
    proj4.defs(
      'EPSG:3995',
      '+proj=stere +lat_0=90 +lat_ts=71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
    );
    proj4.defs(
      'EPSG:3031',
      '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
    );
    register(proj4);
    if (this.hsConfig.get(app).componentsEnabled?.mapControls == false) {
      this.removeAllControls(app);
    }
    this.hsEventBusService.olMapLoads.next({map, app});
  }

  /**
   * @public
   * Wait until the OL map is fully loaded
   * @param app - App identifier
   */
  loaded(app: string) {
    return new Promise<Map>((resolve, reject) => {
      if (this.getMap(app ?? DEFAULT)) {
        resolve(this.getMap(app ?? DEFAULT));
        return;
      } else {
        this.hsEventBusService.olMapLoads.subscribe(({map, app}) => {
          if (map) {
            resolve(map);
          }
        });
      }
    });
  }

  /**
   * @public
   * @param title - Title of the layer (from layer creation)
   * @param app - App identifier
   * @returns Ol.layer object
   * Find layer object by title of layer
   */
  findLayerByTitle(title, app: string) {
    const layers = this.getLayersArray(app);
    let tmp = null;
    for (const layer of layers) {
      if (getTitle(layer) == title) {
        tmp = layer;
      }
    }
    return tmp;
  }

  /**
   * @param existingLayers - Layer 1. Usually the one which is already added to map
   * @param newLayer - Layer 2. Usually the one which will be added to map
   * @returns True if layers are equal
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
   * Checks if a layer with the same title already exists in the map
   * @param lyr - A layer to check
   * @param app - App identifier
   * @returns True if layer is already present in the map, false otherwise
   */
  layerAlreadyExists(lyr, app: string) {
    const duplicateLayers = this.getLayersArray(app ?? DEFAULT).filter(
      (existing) => {
        const equal = this.layersEqual(existing, lyr);
        return equal;
      }
    );
    return duplicateLayers.length > 0;
  }

  /**
   * Remove any duplicate layer inside map layers array
   * @param lyr - A layer to check
   * @param app - App identifier
   */
  removeDuplicate(lyr, app: string) {
    this.getLayersArray(app ?? DEFAULT)
      .filter((existing) => {
        const equal = this.layersEqual(existing, lyr);
        return equal;
      })
      .forEach((to_remove) => {
        this.getMap(app ?? DEFAULT)
          .getLayers()
          .remove(to_remove);
      });
  }

  /**
   * Get layers array from the OL map object
   * @param app - App identifier
   * @returns Layer array
   */
  getLayersArray(app: string): Layer<Source>[] {
    return this.getMap(app ?? DEFAULT)
      .getLayers()
      .getArray() as Layer<Source>[];
  }

  /**
   * @param lyr - {Layer} Layer which to proxify if needed
   * @param app - App identifier
   * Proxify layer based on its source object type and if its tiled or not.
   * Each underlying OL source class has its own way to override imagery loading.
   */
  proxifyLayer(lyr: Layer<Source>, app: string): void {
    const source = lyr.getSource();
    if (
      [ImageWMS, ImageArcGISRest].some((typ) =>
        this.hsUtilsService.instOf(source, typ)
      )
    ) {
      this.proxifyLayerLoader(lyr, false, app);
    }
    if (this.hsUtilsService.instOf(source, WMTS)) {
      (source as WMTS).setTileLoadFunction((i, s) =>
        this.simpleImageryProxy(i, s, app)
      );
    }
    if (
      [TileWMS, TileArcGISRest].some((typ) =>
        this.hsUtilsService.instOf(source, typ)
      )
    ) {
      this.proxifyLayerLoader(lyr, true, app);
    }
    if (
      this.hsUtilsService.instOf(source, XYZ) &&
      !this.hsUtilsService.instOf(source, OSM) &&
      (source as XYZ)
        .getUrls()
        .filter((url) => url.indexOf('openstreetmap') > -1).length == 0
    ) {
      this.proxifyLayerLoader(lyr, true, app);
    }

    if (this.hsUtilsService.instOf(source, Static)) {
      //NOTE: Using url_ is not nice, but don't see other way, because no setUrl or set('url'.. exists yet
      (source as any).url_ = this.hsUtilsService.proxify(
        (source as Static).getUrl(),
        app
      );
    }
  }

  /**
   * Function to add layer to map which also checks if
   * the layer is not already present and also proxifies the layer if needed.
   * Generally for non vector layers it would be better to use this function than to add to OL map directly
   * and rely on layer manager service to do the proxification and also it's shorter than to use HsMapService.getMap(app).addLayer.
   *
   * @param lyr - Layer to add
   * @param duplicateHandling - How to handle duplicate layers (same class and title)
   * @param visibleOverride - Override the visibility using an array layer titles, which
   */
  addLayer(
    lyr: Layer<Source>,
    app: string,
    duplicateHandling?: DuplicateHandling,
    visibleOverride?: string[]
  ): void {
    if (this.layerAlreadyExists(lyr, app ?? DEFAULT)) {
      switch (duplicateHandling) {
        case DuplicateHandling.RemoveOriginal:
          if (getBase(lyr) == true) {
            return;
          }
          this.removeDuplicate(lyr, app);
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
    if (this.hsUtilsService.instOf(source, VectorSource)) {
      this.getVectorType(lyr);
    }
    this.proxifyLayer(lyr, app);
    lyr.on('change:source', (e) => {
      this.proxifyLayer(e.target as Layer<Source>, app);
    });
    this.getMap(app ?? DEFAULT).addLayer(lyr);
  }

  /**
   * @public
   * @param visibilityOverrides - Override the visibility using an array layer titles, which
   * should be visible. Usefull when the layer visibility is stored in a URL parameter
   * @param app - App identifier
   * Add all layers from app config (box_layers and default_layers) to the map.
   * Only layers specified in visibilityOverrides parameter will get instantly visible.
   */
  repopulateLayers(visibilityOverrides, app: string) {
    const appConfig = this.hsConfig.get(app);
    if (appConfig.box_layers) {
      appConfig.box_layers.forEach((box) => {
        for (const lyr of box.getLayers().getArray() as Layer<Source>[]) {
          this.addLayer(
            lyr,
            app,
            DuplicateHandling.IgnoreNew,
            visibilityOverrides
          );
        }
      });
    }

    if (appConfig.default_layers) {
      const layers = appConfig.default_layers.filter((lyr) => lyr);
      if (layers.length > 0) {
        this.getMap(app).removeLayer(this.apps[app].placeholderOsm);
      }
      layers.forEach((lyr: Layer<Source>) => {
        this.addLayer(
          lyr,
          app,
          DuplicateHandling.IgnoreNew,
          visibilityOverrides
        );
      });
    }
  }

  /**
   * @public
   * @param app - App identifier
   * Get current map projection
   */
  getCurrentProj(app: string): Projection {
    return this.getMap(app ?? DEFAULT)
      .getView()
      .getProjection();
  }

  /**
   * @public
   * @param layer - Layer selected
   * Get vector type from the layer selected
   */
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
   * @param src -
   * Check vector geometry types as found from vectorsource provided
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
   * @public
   * @param app - App identifier
   * Reset map to state configured in app config (reload all layers and set default view)
   */
  reset(app: string) {
    this.removeAllLayers(app);
    this.repopulateLayers(null, app);
    this.resetView(app);
  }

  /**
   * @public
   * @param app - App identifier
   * Reset map view to view configured in app config
   */
  resetView(app: string) {
    const view = this.getMap(app ?? DEFAULT).getView();
    view.setCenter(this.originalView.center);
    view.setZoom(this.originalView.zoom);
    view.setRotation(this.originalView.rotation);
  }

  /**
   * Create a placeholder view
   */
  createPlaceholderView() {
    return new View({
      center: transform([17.474129, 52.574], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
      zoom: 4,
    });
  }

  /**
   * @public
   * @param lyr - Layer for which to determine visibility
   * @param array - Layer title to check in.
   * @returns Detected visibility of layer
   * Checks if layer title is present in an array of layer titles.
   * Used to set visibility by URL parameter which contains visible layer titles
   */
  layerTitleInArray(lyr, array) {
    if (array) {
      return array.filter((title) => title == getTitle(lyr)).length > 0;
    }
    return lyr.getVisible();
  }

  /**
   * @public
   * @param app - App identifier
   * Get ol-layer canvas element from DOM
   */
  getCanvases(app: string) {
    return this.apps[app ?? DEFAULT].mapElement.querySelectorAll(
      '.ol-layer canvas'
    );
  }

  /**
   * @public
   * @param type - Scale type (scaleline or scalebar)
   * @param app - App identifier
   * Get ol-layer canvas element from DOM
   */
  getScaleLineElement(type: 'scaleline' | 'scalebar', app: string): Element {
    switch (type) {
      case 'scalebar':
        return this.apps[app].mapElement.querySelectorAll(
          '.ol-scale-bar.ol-unselectable'
        )?.[0];
      case 'scaleline':
      default:
        return this.apps[app].mapElement.querySelectorAll(
          '.ol-scale-line.ol-unselectable'
        )?.[0];
    }
  }

  /**
   * @public
   * @param lyr - Layer to proxify
   * @param tiled - Info if layer is tiled
   * @param app - App identifier
   * Proxify layer loader to work with layers from other sources than app
   */
  proxifyLayerLoader(lyr, tiled, app: string) {
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
        if (url.indexOf(this.hsConfig.get(app).proxyPrefix) == 0) {
          return url;
        } else {
          return this.hsUtilsService.proxify(url, app);
        }
      });
      src.setTileLoadFunction((tile, src) => {
        const laymanEp = this.hsConfig
          .get(app)
          .datasources?.find((ep) => ep.type == 'layman');
        if (laymanEp && src.startsWith(laymanEp.url)) {
          this.laymanWmsLoadingFunction(tile, src);
        } else {
          tile.getImage().src = src;
        }
      });
    } else {
      src.setImageLoadFunction((i, s) => this.simpleImageryProxy(i, s, app));
    }
  }

  /**
   * @public
   * @param image -
   * @param src -
   * @param app - App identifier
   *
   */
  simpleImageryProxy(image, src, app: string) {
    if (src.indexOf(this.hsConfig.get(app).proxyPrefix) == 0) {
      image.getImage().src = src;
    } else {
      const laymanEp = this.hsConfig
        .get(app)
        .datasources?.find((ep) => ep.type == 'layman');
      if (laymanEp && src.startsWith(laymanEp.url)) {
        this.laymanWmsLoadingFunction(image, src);
      } else {
        image.getImage().src = this.hsUtilsService.proxify(src, app); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
      }
    }
  }

  /**
   * @public
   * @param image -
   * @param src -
   *
   */
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
   * @public
   * @param x - X coordinate of new center
   * @param y - Y coordinate of new center
   * @param zoom - New zoom level
   * @param app - App identifier
   * Move map and zoom to specified coordinate/zoom level
   */
  moveToAndZoom(x, y, zoom, app: string) {
    const view = this.getMap(app ?? DEFAULT).getView();
    view.setCenter([x, y]);
    view.setZoom(zoom);
  }

  /**
   * @public
   * @param app - App identifier
   * Get current map extent
   */
  getMapExtent(app: string) {
    const mapSize = this.getMap(app ?? DEFAULT).getSize();
    const mapExtent = mapSize
      ? this.getMap(app ?? DEFAULT)
          .getView()
          .calculateExtent(mapSize)
      : [0, 0, 100, 100];
    return mapExtent;
  }

  /**
   * @public
   * @param app - App identifier
   * Get current map extent in 4326 projection
   */
  getMapExtentInEpsg4326(app: string) {
    const bbox = transformExtent(
      this.getMapExtent(app),
      this.getCurrentProj(app),
      'EPSG:4326'
    );
    return bbox;
  }

  /**
   * @public
   * @param extent - Extent provided
   * @param app - App identifier
   * Fit extent in to map view
   */
  fitExtent(extent: number[], app: string): void {
    this.getMap(app ?? DEFAULT)
      .getView()
      .fit(extent, {size: this.getMap(app ?? DEFAULT).getSize()});
  }

  /**
   * @public
   * @param app - App identifier
   * Get ol.Map object from service
   * @returns ol.Map
   */
  getMap(app: string) {
    return this.apps[app ?? DEFAULT]?.map;
  }

  /**
   * @public
   * @param app - App identifier
   * Remove all map layers
   */
  removeAllLayers(app: string) {
    const to_be_removed = [];
    this.getLayersArray(app)
      .filter((layer) => getRemovable(layer as Layer<Source>) !== false)
      .forEach((lyr) => {
        to_be_removed.push(lyr);
      });
    while (to_be_removed.length > 0) {
      this.getMap(app ?? DEFAULT).removeLayer(to_be_removed.shift());
    }
  }

  /**
   * @public
   * @param app - App identifier
   * Remove all map controls
   */
  removeAllControls(app: string) {
    [
      ...this.getMap(app ?? DEFAULT)
        .getControls()
        .getArray(),
    ].forEach((control) => {
      this.getMap(app ?? DEFAULT).removeControl(control);
    });
    this.hsConfig.get(app).componentsEnabled.mapControls = false;
  }

  /**
   * @public
   * @param app - App identifier
   * Remove all map interactions
   */
  removeAllInteractions(app: string) {
    this.getMap(app ?? DEFAULT)
      .getInteractions()
      .forEach((interaction) => {
        this.getMap(app ?? DEFAULT).removeInteraction(interaction);
      });
    this.hsConfig.get(app).mapInteractionsEnabled = false;
  }
}
