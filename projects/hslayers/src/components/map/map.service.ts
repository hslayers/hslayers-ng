/* eslint-disable no-eq-null */
import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

import ImageWrapper from 'ol/Image';
import projx from 'proj4';
import {
  Cluster,
  ImageArcGISRest,
  ImageWMS,
  OSM,
  Source,
  ImageStatic as Static,
  TileArcGISRest,
  TileImage,
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
import {Extent} from 'ol/extent';
import {Feature, ImageTile, Kinetic, Map, MapBrowserEvent, View} from 'ol';
import {Geometry} from 'ol/geom';
import {Group, Layer, Tile} from 'ol/layer';
import {Projection, transform, transformExtent} from 'ol/proj';
import {Vector as VectorLayer} from 'ol/layer';
import {platformModifierKeyOnly as platformModifierKeyOnlyCondition} from 'ol/events/condition';
import {register} from 'ol/proj/proj4';

import {BoundingBoxObject} from './../save-map/types/bounding-box-object.type';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getDimensions,
  getEnableProxy,
  getFromComposition,
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
  defaultDesktopControls: any;
  visibleLayersInUrl?: string[] = [];
  permalink?: string = '';
  externalCompositionId?: string = '';
}

const proj4 = projx.default ?? projx;

@Injectable({
  providedIn: 'root',
})
export class HsMapService {
  apps: {
    [id: string]: AppData;
  } = {
    default: new AppData(),
  };
  //timer variable for extent change event
  timer = null;
  puremap: any;
  /**
   * @public
   * @default 400
   * Duration of added interactions animation. (400 ms used, default in OpenLayers is 250 ms)
   */
  duration = 400;
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

  get(app: string = 'default'): AppData {
    if (this.apps[app] == undefined) {
      this.apps[app] = new AppData();
    }
    return this.apps[app];
  }
  /**
   * Returns the associated layer for feature.
   * This is used in query-vector.service to get the layer of clicked
   * feature when features are listed in info panel.
   * @param feature - Feature selected
   * @returns VectorLayer
   */
  getLayerForFeature(
    feature: Feature<Geometry>,
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
  refineLayerSearch(
    array: VectorAndSource[],
    feature: Feature<Geometry>
  ): VectorLayer<VectorSource<Geometry>> {
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
   * Get geometry feature by its ID
   * @param fid - Feature ID
   * @param app - App identifier
   * @returns Feature
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
  async createDefaultViewButton(app: string): Promise<void> {
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

    const element = rendered.createElement('div');
    rendered.addClass(element, 'hs-defaultView');
    rendered.addClass(element, 'ol-unselectable');
    rendered.addClass(element, 'ol-control');
    rendered.setAttribute(
      element,
      'title',
      await this.hsLanguageService.awaitTranslation(
        'MAP.zoomToInitialWindow',
        undefined,
        app
      )
    );

    rendered.appendChild(button, icon);
    rendered.appendChild(element, button);
    const defaultViewControl = new Control({
      element,
    });
    this.getMap(app).addControl(defaultViewControl);
  }

  /**
   * @public
   * Set map to default view
   * @param e - Mouse click event
   * @param app - App identifier
   */
  setDefaultView = function (e, app): void {
    const appRef = this.hsConfig.get(app);
    let viewToSet;
    if (!appRef.default_view) {
      viewToSet = this.createPlaceholderView();
    } else {
      viewToSet = appRef.default_view;
    }
    const mapRef = this.getMap(app);
    const center = viewToSet?.getCenter();
    mapRef.getView().setCenter(center);
    const zoom = viewToSet?.getZoom();
    mapRef.getView().setZoom(zoom);
  };
  /**
   * @param e - Map or view change
   * @param app - App identifier
   */
  extentChanged(e, app: string) {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      const map = this.getMap(app);
      this.hsEventBusService.mapExtentChanges.next({
        map: e.target,
        event: e.type,
        extent: map.getView().calculateExtent(map.getSize()),
        app,
      });
    }, 500);
  }

  /**
   * Initialization function for HSLayers map object.
   * Initialize map with basic interaction, scale line and watcher for map view changes.
   * When default controller is used, it's called automatically, otherwise it must be called before other modules dependent on map object are loaded.
   * @public
   * @param mapElement - Map html element
   * @param app - App identifier
   */
  init(mapElement, app: string): void {
    let map: Map;
    if (this.getMap(app)) {
      map = this.getMap(app);
      map.setTarget(mapElement);
    } else {
      const defaultMobileControls = controlDefaults({
        zoom: false,
      });
      const controls = controlDefaults({
        attributionOptions: {
          collapsible: true,
          collapsed: true,
        },
      });
      controls.removeAt(1);
      controls.push(new ScaleLine());
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
        defaultDesktopControls: controls,
        permalink: this.apps[app]?.permalink,
        externalCompositionId: this.apps[app]?.externalCompositionId,
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

      if (
        this.hsConfig.get(app).componentsEnabled?.defaultViewButton &&
        this.hsConfig.get(app).componentsEnabled?.guiOverlay != false
      ) {
        this.createDefaultViewButton(app);
      }
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

    this.repopulateLayers(this.apps[app].visibleLayersInUrl, app);

    proj4.defs(
      'EPSG:5514',
      '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=542.5,89.2,456.9,5.517,2.275,5.516,6.96 +units=m +no_defs'
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#5514',
      proj4.defs('EPSG:5514')
    );

    proj4.defs(
      'EPSG:4258',
      '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#4258',
      proj4.defs('EPSG:4258')
    );

    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
    proj4.defs(
      'EPSG:3995',
      '+proj=stere +lat_0=90 +lat_ts=71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#3995',
      proj4.defs('EPSG:3995')
    );
    proj4.defs(
      'EPSG:3031',
      '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#3031',
      proj4.defs('EPSG:3031')
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
   * @returns OL map object
   */
  loaded(app: string): Promise<Map> {
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
   * Find layer object by title of layer
   * @public
   * @param title - Title of the layer (from layer creation)
   * @param app - App identifier
   * @returns OL.layer object
   */
  findLayerByTitle(title: string, app: string) {
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
   * @param existingLayer - Layer 1. Usually the one which is already added to map
   * @param newLayer - Layer 2. Usually the one which will be added to map
   * @returns True or false
   */
  layersEqual(existingLayer, newLayer): boolean {
    if (newLayer === 'undefined') {
      console.warn(
        'Checking duplicity for undefined layer. Why are we doing this?'
      );
      return true;
    }
    if (existingLayer.getSource === 'undefined') {
      return false;
    }
    if (newLayer.getSource === 'undefined') {
      return false;
    }
    const existingSource = existingLayer.getSource();
    const newSource = newLayer.getSource();
    const existingTitle = getTitle(existingLayer);
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
  layerAlreadyExists(lyr: Layer, app: string): boolean {
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
  removeDuplicate(lyr: Layer, app: string): void {
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
  getLayersArray(app?: string): Layer<Source>[] {
    return this.getMap(app ?? DEFAULT)
      .getLayers()
      .getArray() as Layer<Source>[];
  }

  /**
   * Proxify layer based on its source object type and if it's tiled or not.
   * Each underlying OL source class has its own way to override imagery loading.
   * @param lyr - Layer which to proxify if needed
   * @param app - App identifier
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
        this.simpleImageryProxy(i as ImageTile, s, app)
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
      if (getTitle(lyr) === getTitle(this.apps[app].placeholderOsm)) {
        duplicateHandling = DuplicateHandling.RemoveOriginal;
      }
      switch (duplicateHandling) {
        case DuplicateHandling.RemoveOriginal:
          /* if (getBase(lyr) == true) { //Removed so we could add OSM over the placeholderOsm 
            return;
          } */
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
   * Add all layers from app config (box_layers and default_layers) to the map.
   * Only layers specified in visibilityOverrides parameter will get instantly visible.
   * @public
   * @param visibilityOverrides - Override the visibility using an array layer titles, which
   * should be visible. Useful when the layer visibility is stored in a URL parameter
   * @param app - App identifier
   */
  repopulateLayers(visibilityOverrides: string[], app: string): void {
    const appConfig = this.hsConfig.get(app);
    if (appConfig.box_layers) {
      let boxLayers: Layer[] = [];
      appConfig.box_layers.forEach((box) => {
        boxLayers = boxLayers.concat(
          (box.getLayers().getArray() as Layer<Source>[]).filter(
            (layer) => layer
          )
        );
      });
      this.addLayersFromAppConfig(boxLayers, visibilityOverrides, app);
    }

    if (appConfig.default_layers) {
      const defaultLayers: Layer[] = appConfig.default_layers.filter(
        (lyr) => lyr
      );
      if (defaultLayers.length > 0) {
        this.getMap(app).removeLayer(this.apps[app].placeholderOsm);
      }
      this.addLayersFromAppConfig(defaultLayers, visibilityOverrides, app);
    }
    this.hsEventBusService.loadBaseLayersComposition.next({app});
  }

  /**
   * Add layers from app config (box_layers and default_layers)
   * While adding check if hs-composition URL param or defaultComposition is set, if so, filter config's layers by removable property
   * If permalink URL param is set, do not add any of config's layers.
   * @public
   * @param app - App identifier
   * Get current map projection
   * @returns Projection
   */
  addLayersFromAppConfig(
    layers: Layer[],
    visibilityOverrides: string[],
    app: string
  ): void {
    const mapRef = this.apps[app];
    if (mapRef.externalCompositionId) {
      layers = layers.filter((layer) => getRemovable(layer) === false);
    }
    if (!mapRef.permalink) {
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
   * Get map projection currently used in the map view
   * @public
   * @param app - App identifier
   * Get current map projection
   * @returns Projection
   */
  getCurrentProj(app?: string): Projection {
    return this.getMap(app ?? DEFAULT)
      .getView()
      .getProjection();
  }

  /**
   * For a vector layer with a vector source, determines if it includes points, lines and/or polygons and stores the information in hasPoint, hasLine, hasPoly properties of the source.
   * @public
   * @param layer - Vector layer selected
   * Get vector type from the layer selected
   */
  getVectorType(layer): void {
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
   * Check vector geometry types as found from vector source provided
   * @param src - Vector source
   */
  vectorSourceTypeComputer(src): void {
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
   * Reset map to state configured in app config (reload all layers and set default view)
   * @public
   * @param app - App identifier
   */
  reset(app: string): void {
    this.removeAllLayers(app);
    this.repopulateLayers(null, app);
    this.resetView(app);
  }

  /**
   * Reset map view to view configured in app config
   * @public
   * @param app - App identifier
   */
  resetView(app: string): void {
    const view = this.getMap(app ?? DEFAULT).getView();
    view.setCenter(this.originalView.center);
    view.setZoom(this.originalView.zoom);
    view.setRotation(this.originalView.rotation);
  }

  /**
   * Create a placeholder view
   * @returns Map view
   */
  createPlaceholderView(): View {
    return new View({
      center: transform([17.474129, 52.574], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
      zoom: 4,
    });
  }

  /**
   * Checks if layer title is present in an array of layer titles.
   * Used to set visibility by URL parameter which contains visible layer titles
   * @public
   * @param lyr - Layer for which to determine visibility
   * @param array - Layer title to check in.
   * @returns Detected visibility of layer
   */
  layerTitleInArray(lyr: Layer, array: string[]) {
    if (array && getTitle(lyr) != undefined) {
      return array.filter((title) => title == getTitle(lyr)).length > 0;
    }
    return lyr.getVisible();
  }

  /**
   * Get ol-layer canvas element from DOM
   * @public
   * @param app - App identifier
   * @returns DOM NodeListOf<HTMLCanvasElement>
   */
  getCanvases(app: string): NodeListOf<HTMLCanvasElement> {
    return this.apps[app ?? DEFAULT].mapElement.querySelectorAll(
      '.ol-layer canvas'
    );
  }

  /**
   * Get ol-layer canvas element from DOM
   * @public
   * @param type - Scale type (scaleline or scalebar)
   * @param app - App identifier
   * @returns DOM element
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
   * Proxify layer loader to work with layers from other sources than app
   * @public
   * @param lyr - Layer to proxify
   * @param tiled - Info if layer is tiled
   * @param app - App identifier
   * @returns proxified URL
   */
  proxifyLayerLoader(lyr: Layer, tiled: boolean, app: string): string {
    const src = lyr.getSource();
    if (getEnableProxy(lyr) !== undefined && getEnableProxy(lyr) == false) {
      return;
    }
    if (tiled) {
      //TODO: refactor: tileUrlFunction() seems redundant
      const tile_url_function =
        (src as TileImage).getTileUrlFunction() ||
        (src as any).tileUrlFunction();
      (src as TileImage).setTileUrlFunction((b, c, d) => {
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
      (src as TileImage).setTileLoadFunction((tile: ImageTile, src) => {
        const laymanEp = this.hsConfig
          .get(app)
          .datasources?.find((ep) => ep.type == 'layman');
        if (laymanEp && src.startsWith(laymanEp.url)) {
          this.laymanWmsLoadingFunction(tile, src);
        } else {
          (tile.getImage() as HTMLImageElement).src = src;
        }
      });
    } else {
      (src as ImageWMS | ImageArcGISRest).setImageLoadFunction((i, s) =>
        this.simpleImageryProxy(i, s, app)
      );
    }
  }

  /**
   * Proxify loader for any imagery layer, either tiled or not
   * @public
   * @param image - Image or ImageTile as required by setImageLoadFunction() in ImageWMS, ImageArcGISRest and WMTS sources
   * @param src - Original (unproxified) source URL
   * @param app - App identifier
   */
  simpleImageryProxy(
    image: ImageWrapper | ImageTile,
    src: string,
    app: string
  ): void {
    if (src.indexOf(this.hsConfig.get(app).proxyPrefix) == 0) {
      (image.getImage() as HTMLImageElement).src = src;
      return;
    }
    const laymanEp = this.hsConfig
      .get(app)
      .datasources?.find((ep) => ep.type == 'layman');
    if (laymanEp && src.startsWith(laymanEp.url)) {
      this.laymanWmsLoadingFunction(image, src);
      return;
    }
    (image.getImage() as HTMLImageElement).src = this.hsUtilsService.proxify(
      src,
      app
    ); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
  }

  /**
   * Create a loader function for Layman WMS layers specifically
   * @public
   * @param image - ol/Image, the image requested via WMS source
   * @param src - Original (unproxified) source URL
   */
  laymanWmsLoadingFunction(image: ImageWrapper | ImageTile, src: string): void {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', src);
    xhr.addEventListener('loadend', function (evt) {
      const arrayBufferView = new Uint8Array(this.response);
      const blob = new Blob([arrayBufferView], {type: 'image/png'});
      const urlCreator = window.URL || window.webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      (image.getImage() as HTMLImageElement).src = imageUrl;
    });
    xhr.send();
  }

  /**
   * Move map and zoom to specified coordinate/zoom level
   * @public
   * @param x - X coordinate of new center
   * @param y - Y coordinate of new center
   * @param zoom - New zoom level
   * @param app - App identifier
   */
  moveToAndZoom(x: number, y: number, zoom: number, app: string): void {
    const view = this.getMap(app ?? DEFAULT).getView();
    view.setCenter([x, y]);
    view.setZoom(zoom);
  }

  /**
   * Get current map extent
   * @public
   * @param app - App identifier
   * @returns Extent
   */
  getMapExtent(app: string): Extent {
    const mapSize = this.getMap(app ?? DEFAULT).getSize();
    const mapExtent = mapSize
      ? this.getMap(app ?? DEFAULT)
          .getView()
          .calculateExtent(mapSize)
      : [0, 0, 100, 100];
    return mapExtent;
  }

  /**
   * Get current map extent in WGS84 (EPSG:4326) projection
   * @public
   * @param app - App identifier
   * @returns Extent
   */
  getMapExtentInEpsg4326(app: string): Extent {
    const bbox = transformExtent(
      this.getMapExtent(app),
      this.getCurrentProj(app),
      'EPSG:4326'
    );
    return bbox;
  }

  /**
   * Fit extent into map view
   * @public
   * @param extent - Extent provided
   * @param app - App identifier
   */
  async fitExtent(extent: number[], app: string): Promise<void> {
    const mapSize = this.getMap(app ?? DEFAULT).getSize();
    if (!mapSize.every((p) => p > 0)) {
      console.warn(
        'Tried to fit extent but one of map dimensions were 0. Will wait a bit and try again!'
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    this.getMap(app ?? DEFAULT)
      .getView()
      .fit(extent, {size: mapSize});
  }

  /**
   * Get ol.Map object from service
   * @public
   * @param app - App identifier
   * @returns ol.Map
   */
  getMap(app?: string): Map {
    return this.apps[app ?? DEFAULT]?.map;
  }

  /**
   * Remove all map layers
   * @public
   * @param app - App identifier
   */
  removeAllLayers(app: string): void {
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
   * Remove all layers gained from composition from map
   * @param force Remove all removable layers no matter fromComposition param
   * @param app - App identifier
   */
  removeCompositionLayers(force: boolean, app: string): void {
    let to_be_removed = this.getLayersArray(app).filter(
      (lyr) => getRemovable(lyr) === undefined || getRemovable(lyr) == true
    );
    if (!force) {
      to_be_removed = to_be_removed.filter((lyr) => {
        return getFromComposition(lyr);
      });
    }

    while (to_be_removed.length > 0) {
      this.getMap(app).removeLayer(to_be_removed.shift());
    }
  }

  /**
   * Remove all map controls
   * @public
   * @param app - App identifier
   */
  removeAllControls(app: string): void {
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
   * Remove all map interactions
   * @public
   * @param app - App identifier
   */
  removeAllInteractions(app: string): void {
    this.getMap(app ?? DEFAULT)
      .getInteractions()
      .forEach((interaction) => {
        this.getMap(app ?? DEFAULT).removeInteraction(interaction);
      });
    this.hsConfig.get(app).mapInteractionsEnabled = false;
  }

  /**
   * Get current extent of map, transform it into EPSG:4326 and round coordinates to 2 decimals.
   * This is used mainly in compositions and sharing of map and the coordinates are not very precise.
   * @param app - App identifier
   * @returns Extent coordinates. Example: {east: "0.00", south: "0.00", west: "1.00", north: "1.00"}
   */
  describeExtent(app: string): BoundingBoxObject {
    const b = this.getMap(app)
      .getView()
      .calculateExtent(this.getMap(app).getSize());
    let pair1 = [b[0], b[1]];
    let pair2 = [b[2], b[3]];
    const cur_proj = this.getCurrentProj(app).getCode();
    pair1 = transform(pair1, cur_proj, 'EPSG:4326');
    pair2 = transform(pair2, cur_proj, 'EPSG:4326');
    return {
      east: pair1[0].toFixed(2),
      south: pair1[1].toFixed(2),
      west: pair2[0].toFixed(2),
      north: pair2[1].toFixed(2),
    };
  }
}
