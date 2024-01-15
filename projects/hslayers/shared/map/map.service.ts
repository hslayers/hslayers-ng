/* eslint-disable no-eq-null */
import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

import ImageWrapper from 'ol/Image';
import RenderFeature from 'ol/render/Feature';
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

import {BoundingBoxObject} from 'hslayers-ng/types';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsQueuesService} from 'hslayers-ng/shared/queues';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  getDimensions,
  getEnableProxy,
  getFromComposition,
  getRemovable,
  getTitle,
} from 'hslayers-ng/common/extensions';

export enum DuplicateHandling {
  AddDuplicate = 0,
  IgnoreNew = 1,
  RemoveOriginal = 2,
}

type VectorAndSource = {
  source: VectorSource | Cluster;
  layer: VectorLayer<VectorSource>;
};

const proj4 = projx.default ?? projx;

@Injectable({
  providedIn: 'root',
})
export class HsMapService {
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
  visibleLayersInUrl?: string[];
  permalink?: string = '';
  externalCompositionId?: string = '';
  //timer variable for extent change event
  timer = null;
  puremap: any;
  /**
   * Duration of added interactions animation. (400 ms used, default in OpenLayers is 250 ms)
   * @public
   * @default 400
   */
  duration = 400;
  visible: boolean;
  /**
   * Copy of the default_view for map resetting purposes
   */
  originalView: {center: number[]; zoom: number; rotation: number};
  /**
   * Keeps track of zoomWithModifier listener so its not registered multiple times when using router
   */
  zoomWithModifierListener;
  constructor(
    public hsConfig: HsConfig,
    public hsLayoutService: HsLayoutService,
    private hsLog: HsLogService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    public hsLanguageService: HsLanguageService,
    private hsQueuesService: HsQueuesService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private rendererFactory: RendererFactory2,
  ) {}

  /**
   * Returns the associated layer for feature.
   * This is used in query-vector.service to get the layer of clicked
   * feature when features are listed in info panel.
   * @param feature - Feature selected
   * @returns VectorLayer
   */
  getLayerForFeature(
    feature: Feature<Geometry>,
  ): VectorLayer<VectorSource> | VectorLayer<Cluster> {
    if (typeof feature.getId() == 'undefined') {
      feature.setId(this.hsUtilsService.generateUuid());
    }
    const fid = feature.getId();
    if (this.featureLayerMapping[fid]?.length > 0) {
      return this.refineLayerSearch(this.featureLayerMapping[fid], feature);
    }
    const layersFound: VectorAndSource[] = [];
    const layersToLookFor = [];
    this.getVectorLayers(layersToLookFor);
    for (const obj of layersToLookFor) {
      let found = false;
      if (obj.source.getFeatureById) {
        //For ordinary vector layers we can search by ID
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
    if (layersFound && !this.featureLayerMapping[fid]) {
      //TODO: Will have to delete the mapping at some point when layer is cleared or feature removed
      this.featureLayerMapping[fid] = layersFound;
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
    feature: Feature<Geometry>,
  ): VectorLayer<VectorSource> {
    array = array.filter((entry) => entry.layer.getVisible());
    if (array.length > 1) {
      return array.find(
        (entry) => this.findFeatureByInst(entry, feature) !== undefined,
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
    feature: Feature<Geometry>,
  ): Feature<Geometry> {
    return obj.source.getFeatures().find((layer_feature) => {
      return layer_feature === feature;
    });
  }

  /**
   * Get vector layers from the map, mentioned in the layersToLookFor array
   * @public
   * @param layersToLookFor - Layers requested
   */
  getVectorLayers(layersToLookFor: VectorAndSource[]): void {
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
    this.map.getLayers().forEach((layer) => {
      if (this.hsUtilsService.instOf(layer, Group)) {
        (layer as Group).getLayers().forEach(check);
      } else {
        check(layer);
      }
    });
  }

  /**
   * Get geometry feature by its ID.
   * Used in hslayers-cesium.
   * @public
   * @param fid - Feature ID
   * @returns Feature
   */
  getFeatureById(fid: string): Feature<Geometry> | RenderFeature[] {
    if (this.featureLayerMapping[fid]) {
      if (this.featureLayerMapping[fid].length > 1) {
        this.hsLog.warn(`Multiple layers exist for feature id ${fid}`);
      } else {
        return this.featureLayerMapping[fid][0].source.getFeatureById(fid);
      }
    } else {
      const layersToLookFor: {
        source: VectorSource | Cluster;
        layer: any;
      }[] = [];
      this.getVectorLayers(layersToLookFor);
      const obj = layersToLookFor.find((obj) => obj.source.getFeatureById(fid));
      if (obj) {
        return obj.source.getFeatureById(fid);
      }
    }
  }

  /**
   * Create default view button inside the map html element
   * @public
   * @param defaultDesktopControls - Default controls
   */
  async createDefaultViewButton(): Promise<void> {
    const rendered = this.renderer;
    const button = rendered.createElement('button');
    button.addEventListener(
      'click',
      (e) => {
        this.setDefaultView(e);
      },
      false,
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
      ),
    );

    rendered.appendChild(button, icon);
    rendered.appendChild(element, button);
    const defaultViewControl = new Control({
      element,
    });
    this.map.addControl(defaultViewControl);
  }

  /**
   * Set map to default view
   * @public
   * @param e - Mouse click event
   */
  setDefaultView = function (e): void {
    let viewToSet;
    if (!this.hsConfig.default_view) {
      viewToSet = this.createPlaceholderView();
    } else {
      viewToSet = this.hsConfig.default_view;
    }
    const center = viewToSet?.getCenter();
    this.map.getView().setCenter(center);
    const zoom = viewToSet?.getZoom();
    this.map.getView().setZoom(zoom);
  };

  /**
   * @param e - Map or view change
   */
  extentChanged(e) {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.hsEventBusService.mapExtentChanges.next({
        map: e.target,
        event: e.type,
        extent: this.map.getView().calculateExtent(this.map.getSize()),
      });
    }, 500);
  }

  /**
   * Initialization function for HSLayers map object.
   * Initialize map with basic interaction, scale line and watcher for map view changes.
   * When default controller is used, it's called automatically, otherwise it must be called before other modules dependent on map object are loaded.
   * @public
   * @param mapElement - Map html element
   */
  init(mapElement): void {
    let map: Map;
    if (this.map) {
      map = this.map;
      map.setTarget(mapElement);
    } else {
      this.defaultDesktopControls = controlDefaults({
        rotate: false,
        attributionOptions: {
          collapsible: true,
          collapsed: true,
        },
      });
      this.defaultDesktopControls.push(new ScaleLine());
      this.placeholderOsm = new Tile({
        source: new OSM(),
        visible: true,
        properties: {
          title: 'OpenStreetMap',
          base: true,
          removable: true,
        },
      });
      map = new Map({
        controls: this.defaultDesktopControls,
        layers: [this.placeholderOsm],
        target: mapElement,
        interactions: [],
        view: this.hsConfig.default_view ?? this.createPlaceholderView(),
      });
      this.renderer = this.rendererFactory.createRenderer(null, null);
      this.mapElement = mapElement;
      this.map = map;
      this.featureLayerMapping = {};
      this.permalink = this?.permalink;
      this.externalCompositionId = this?.externalCompositionId;

      const view = map.getView();
      this.originalView = {
        center: view.getCenter(),
        zoom: view.getZoom(),
        rotation: view.getRotation(),
      };

      view.on('change:center', (e) => {
        this.extentChanged(e);
      });
      view.on('change:resolution', (e) => {
        this.extentChanged(e);
      });

      map.on('moveend', (e) => {
        this.extentChanged(e);
      });

      if (
        this.hsConfig.componentsEnabled?.defaultViewButton &&
        this.hsConfig.componentsEnabled?.guiOverlay != false
      ) {
        this.createDefaultViewButton();
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
          if (this.hsConfig.componentsEnabled?.mapControls == false) {
            return false;
          }
          return this.hsConfig.zoomWithModifierKeyOnly
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

    if (this.hsConfig.mapInteractionsEnabled != false) {
      for (const value of Object.values(interactions).filter(
        (value) => !map.getInteractions().getArray().includes(value),
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
      this.hsConfig.zoomWithModifierKeyOnly &&
      this.hsConfig.mapInteractionsEnabled != false &&
      !this.zoomWithModifierListener
    ) {
      this.zoomWithModifierListener = map.on(
        'wheel' as any,
        (e: MapBrowserEvent<any>) => {
          const renderer = this.renderer;
          //ctrlKey works for Win and Linux, metaKey for Mac
          if (
            !(e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
            !this.hsLayoutService.contentWrapper.querySelector(
              '.hs-zoom-info-dialog',
            )
          ) {
            //TODO: change the name of platform modifier key dynamically based on OS
            const platformModifierKey = 'CTRL/META';
            //Following styles would be better written as ng-styles...
            const html = renderer.createElement('div');
            renderer.setAttribute(
              html,
              'class',
              'alert alert-info mt-1 hs-zoom-info-dialog',
            );
            renderer.setAttribute(
              html,
              'style',
              `position: absolute; right:15px; top:0.6em; z-index:101`,
            );
            const text = renderer.createText(
              `${this.hsLanguageService.getTranslation('MAP.zoomKeyModifier', {
                platformModifierKey: platformModifierKey,
              })}`,
            );
            renderer.appendChild(html, text);
            renderer.appendChild(
              this.hsLayoutService.contentWrapper.querySelector(
                '.hs-map-space',
              ),
              html,
            );
            setTimeout(() => {
              this.hsLayoutService.contentWrapper
                .querySelector('.hs-zoom-info-dialog')
                .remove();
            }, 4000);
          }
        },
      );
    }

    this.repopulateLayers(this.visibleLayersInUrl);

    proj4.defs(
      'EPSG:3035',
      '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#3035',
      proj4.defs('EPSG:3035'),
    );

    proj4.defs(
      'EPSG:5514',
      '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=542.5,89.2,456.9,5.517,2.275,5.516,6.96 +units=m +no_defs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#5514',
      proj4.defs('EPSG:5514'),
    );

    proj4.defs(
      'EPSG:4258',
      '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#4258',
      proj4.defs('EPSG:4258'),
    );

    proj4.defs(
      'EPSG:32633',
      '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#32633',
      proj4.defs('EPSG:32633'),
    );
    proj4.defs(
      'EPSG:32634',
      '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs +type=crs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#32634',
      proj4.defs('EPSG:32634'),
    );

    proj4.defs(
      'EPSG:3995',
      '+proj=stere +lat_0=90 +lat_ts=71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#3995',
      proj4.defs('EPSG:3995'),
    );
    proj4.defs(
      'EPSG:3031',
      '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    );
    proj4.defs(
      'http://www.opengis.net/gml/srs/epsg.xml#3031',
      proj4.defs('EPSG:3031'),
    );
    register(proj4);
    if (this.hsConfig.componentsEnabled?.mapControls == false) {
      this.removeAllControls();
    }
    this.hsEventBusService.olMapLoads.next(map);
  }

  /**
   * Wait until the OL map is fully loaded
   * @public
   * @returns OL map object
   */
  loaded(): Promise<Map> {
    return new Promise<Map>((resolve, reject) => {
      if (this.map) {
        resolve(this.map);
        return;
      } else {
        this.hsEventBusService.olMapLoads.subscribe((map) => {
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
   * @returns OL.layer object
   */
  findLayerByTitle(title: string) {
    const layers = this.getLayersArray();
    let tmp = null;
    for (const layer of layers) {
      if (getTitle(layer) == title) {
        tmp = layer;
      }
    }
    return tmp;
  }

  /**
   * Two layers are considered equal when they equal in the following properties:
   *  * title
   *  * type of source
   *  * list of sublayers
   *  * URL
   *  * and when there are multiple URLs defined for a layer, there must be at least one matching URL for both the layers.
   * @param existingLayer - Layer 1. Usually the one which is already added to map
   * @param newLayer - Layer 2. Usually the one which will be added to map
   * @returns True if the layers are equal, false otherwise
   */
  layersEqual(existingLayer, newLayer): boolean {
    if (newLayer === 'undefined') {
      this.hsLog.warn(
        'Checking duplicity for undefined layer. Why are we doing this?',
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
   * @returns True if layer is already present in the map, false otherwise
   */
  layerAlreadyExists(lyr: Layer): boolean {
    const duplicateLayers = this.getLayersArray().filter((existing) => {
      const equal = this.layersEqual(existing, lyr);
      return equal;
    });
    return duplicateLayers.length > 0;
  }

  /**
   * Remove any duplicate layer inside map layers array
   * @param lyr - A layer to check
   */
  removeDuplicate(lyr: Layer): void {
    this.getLayersArray()
      .filter((existing) => {
        const equal = this.layersEqual(existing, lyr);
        return equal;
      })
      .forEach((to_remove) => {
        this.map.getLayers().remove(to_remove);
      });
  }

  /**
   * Get layers array from the OL map object
   * @returns Layer array
   */
  getLayersArray(): Layer<Source>[] {
    return this.map.getLayers().getArray() as Layer<Source>[];
  }

  /**
   * Proxify layer based on its source object type and if it's tiled or not.
   * Each underlying OL source class has its own way to override imagery loading.
   * @param lyr - Layer which to proxify if needed
   */
  proxifyLayer(lyr: Layer<Source>): void {
    const source = lyr.getSource();
    if (
      [ImageWMS, ImageArcGISRest].some((typ) =>
        this.hsUtilsService.instOf(source, typ),
      )
    ) {
      this.proxifyLayerLoader(lyr, false);
    }
    if (this.hsUtilsService.instOf(source, WMTS)) {
      (source as WMTS).setTileLoadFunction((i, s) =>
        this.simpleImageryProxy(i as ImageTile, s),
      );
    }
    if (
      [TileWMS, TileArcGISRest].some((typ) =>
        this.hsUtilsService.instOf(source, typ),
      )
    ) {
      this.proxifyLayerLoader(lyr, true);
    }
    if (
      this.hsUtilsService.instOf(source, XYZ) &&
      !this.hsUtilsService.instOf(source, OSM) &&
      (source as XYZ).getUrls().every((url) => !url.includes('openstreetmap'))
    ) {
      this.proxifyLayerLoader(lyr, true);
    }

    if (this.hsUtilsService.instOf(source, Static)) {
      //NOTE: Using url_ is not nice, but don't see other way, because no setUrl or set('url'.. exists yet
      (source as any).url_ = this.hsUtilsService.proxify(
        (source as Static).getUrl(),
      );
    }
  }

  /**
   * Checks if layer already exists in map and resolves based on duplicateHandling strategy
   * @returns True if layer should be processed (added to map etc.)
   */
  resolveDuplicateLayer(
    lyr: Layer<Source>,
    duplicateHandling?: DuplicateHandling,
  ): boolean {
    if (this.layerAlreadyExists(lyr)) {
      if (this.hsUtilsService.instOf(lyr.getSource(), OSM)) {
        duplicateHandling = DuplicateHandling.RemoveOriginal;
      }
      switch (duplicateHandling) {
        case DuplicateHandling.RemoveOriginal:
          /* if (getBase(lyr) == true) { //Removed so we could add OSM over the placeholderOsm 
            return;
          } */
          this.removeDuplicate(lyr);
          return true;
        case DuplicateHandling.IgnoreNew:
          return false;
        case DuplicateHandling.AddDuplicate:
        default:
          return true;
      }
    }
    return true;
  }

  /**
   * Function to add layer to map which also checks if
   * the layer is not already present and also proxifies the layer if needed.
   * Generally for non vector layers it would be better to use this function than to add to OL map directly
   * and rely on layer manager service to do the proxification and also it's shorter than to use HsMapService.getMap().addLayer.
   *
   * @param lyr - Layer to add
   * @param duplicateHandling - How to handle duplicate layers (same class and title)
   * @param visibleOverride - Override the visibility using an array layer titles, which
   */
  addLayer(
    lyr: Layer<Source>,
    duplicateHandling?: DuplicateHandling,
    visibleOverride?: string[],
  ): void {
    const addLayer = this.resolveDuplicateLayer(lyr, duplicateHandling);
    if (addLayer) {
      if (visibleOverride) {
        lyr.setVisible(this.layerTitleInArray(lyr, visibleOverride));
      }
      const source = lyr.getSource();
      if (this.hsUtilsService.instOf(source, VectorSource)) {
        this.getVectorType(lyr);
      }
      this.proxifyLayer(lyr);
      lyr.on('change:source', (e) => {
        this.proxifyLayer(e.target as Layer<Source>);
      });
      this.map.addLayer(lyr);
    }
  }

  /**
   * Add all layers from app config (box_layers and default_layers) to the map.
   * Only layers specified in visibilityOverrides parameter will get instantly visible.
   * @public
   * @param visibilityOverrides - Override the visibility using an array layer titles, which
   * should be visible. Useful when the layer visibility is stored in a URL parameter
   */
  repopulateLayers(visibilityOverrides: string[]): void {
    try {
      if (this.hsConfig.box_layers) {
        let boxLayers: Layer[] = [];
        this.hsConfig.box_layers.forEach((box) => {
          boxLayers = boxLayers.concat(
            (box.getLayers().getArray() as Layer<Source>[]).filter(
              (layer) => layer,
            ),
          );
        });
        this.addLayersFromAppConfig(boxLayers, visibilityOverrides);
      }

      if (this.hsConfig.default_layers) {
        const defaultLayers: Layer[] = this.hsConfig.default_layers.filter(
          (lyr) => lyr,
        );
        if (defaultLayers.length > 0) {
          this.map.removeLayer(this.placeholderOsm);
        }
        this.addLayersFromAppConfig(defaultLayers, visibilityOverrides);
      }
    } catch (error) {
      //TOAST?
      console.error('Error while trying to repopulate layers', error);
    }
  }

  /**
   * Add layers from app config (box_layers and default_layers)
   * While adding check if hs-composition URL param or defaultComposition is set, if so, filter config's layers by removable property
   * If permalink URL param is set, do not add any of config's layers.
   * @public
   * @returns Projection
   */
  addLayersFromAppConfig(layers: Layer[], visibilityOverrides: string[]): void {
    if (this.externalCompositionId) {
      layers = layers.filter((layer) => getRemovable(layer) === false);
    }
    if (!this.permalink) {
      layers.forEach((lyr: Layer<Source>) => {
        this.addLayer(lyr, DuplicateHandling.IgnoreNew, visibilityOverrides);
      });
    }
  }

  /**
   * Get map projection currently used in the map view
   * @public
   * @returns Projection
   */
  getCurrentProj(): Projection {
    return this.map.getView().getProjection();
  }

  /**
   * For a vector layer with a vector source, determines if it includes points, lines and/or polygons and stores the information in hasPoint, hasLine, hasPoly properties of the source.
   * Get vector type from the layer selected
   * @public
   * @param layer - Vector layer selected
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
   */
  reset(): void {
    this.removeAllLayers();
    this.repopulateLayers(null);
    this.resetView();
  }

  /**
   * Reset map view to view configured in app config
   * @public
   */
  resetView(): void {
    const view = this.map.getView();
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
   * @returns DOM NodeListOf<HTMLCanvasElement>
   */
  getCanvases(): NodeListOf<HTMLCanvasElement> {
    return this.mapElement.querySelectorAll('.ol-layer canvas');
  }

  /**
   * Get ol-layer canvas element from DOM
   * @public
   * @param type - Scale type (scaleline or scalebar)
   * @returns DOM element
   */
  getScaleLineElement(type: 'scaleline' | 'scalebar'): Element {
    switch (type) {
      case 'scalebar':
        return this.mapElement.querySelectorAll(
          '.ol-scale-bar.ol-unselectable',
        )?.[0];
      case 'scaleline':
      default:
        return this.mapElement.querySelectorAll(
          '.ol-scale-line.ol-unselectable',
        )?.[0];
    }
  }

  /**
   * Proxify layer loader to work with layers from other sources than app
   * @public
   * @param lyr - Layer to proxify
   * @param tiled - Info if layer is tiled
   * @returns proxified URL
   */
  proxifyLayerLoader(lyr: Layer, tiled: boolean): string {
    const src = lyr.getSource();
    if (getEnableProxy(lyr) !== undefined && getEnableProxy(lyr) == false) {
      return;
    }
    if (tiled) {
      if (getDimensions(lyr)) {
        const tile_url_function =
          (src as TileImage).getTileUrlFunction() ||
          (src as any).tileUrlFunction();
        (src as TileImage).setTileUrlFunction((b, c, d) => {
          let url = tile_url_function.call(src, b, c, d);
          const dimensions = getDimensions(lyr);
          Object.keys(dimensions).forEach((dimension) => {
            url = url.replace(`{${dimension}}`, dimensions[dimension].value);
          });
          return url;
        });
      }
      (src as TileImage).setTileLoadFunction(async (tile: ImageTile, url) => {
        const que = this.hsQueuesService.ensureQueue('tileLoad', 6, 2500);
        que.push(async (cb) => {
          await this.simpleImageryProxy(tile, url);
          cb(null);
        });
      });
    } else {
      (src as ImageWMS | ImageArcGISRest).setImageLoadFunction(
        async (image, url) => {
          /**
           * No timeout for this que as non tiled images may in some cases take really long to load and thus
           * block all the rest of the functionality that depends on http requests for the whole duration
           */
          const que = this.hsQueuesService.ensureQueue('imageLoad', 4);
          que.push(async (cb) => {
            await this.simpleImageryProxy(image, url);
            cb(null);
          });
        },
      );
    }
  }

  /**
   * Proxify loader for any imagery layer, either tiled or not
   * @public
   * @param image - Image or ImageTile as required by setImageLoadFunction() in ImageWMS, ImageArcGISRest and WMTS sources
   * @param src - Original (unproxified) source URL
   */
  async simpleImageryProxy(image: ImageWrapper | ImageTile, src: string) {
    return new Promise((resolve, reject) => {
      if (src.startsWith(this.hsConfig.proxyPrefix)) {
        (image.getImage() as HTMLImageElement).src = src;
        return;
      }
      const laymanEp = this.hsCommonLaymanService.layman;
      if (laymanEp && src.startsWith(laymanEp.url)) {
        this.laymanWmsLoadingFunction(image, src)
          .then((_) => {
            resolve(image);
          })
          .catch((e) => {
            resolve(image);
          });
        return;
      }
      (image.getImage() as HTMLImageElement).onload = function () {
        resolve(image);
      };

      (image.getImage() as HTMLImageElement).onerror = function () {
        resolve(image);
      };

      (image.getImage() as HTMLImageElement).onabort = function () {
        resolve(image);
      };

      (image.getImage() as HTMLImageElement).src =
        this.hsUtilsService.proxify(src); //Previously urlDecodeComponent was called on src, but it breaks in firefox.
    });
  }

  /**
   * Create a loader function for Layman WMS layers specifically
   * @param image - ol/Image, the image requested via WMS source
   * @param src - Original (unproxified) source URL
   */
  laymanWmsLoadingFunction(
    image: ImageWrapper | ImageTile,
    src: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
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
        resolve(image);
      });
      xhr.addEventListener('error', () => {
        reject(new Error('Failed to load image. Network error.'));
      });
      xhr.send();
    });
  }

  /**
   * Move map and zoom to specified coordinate/zoom level
   * @public
   * @param x - X coordinate of new center
   * @param y - Y coordinate of new center
   * @param zoom - New zoom level
   */
  moveToAndZoom(x: number, y: number, zoom: number): void {
    const view = this.map.getView();
    view.setCenter([x, y]);
    view.setZoom(zoom);
  }

  /**
   * Get current map extent
   * @public
   * @returns Extent
   */
  getMapExtent(): Extent {
    const mapSize = this.map.getSize();
    const mapExtent = mapSize
      ? this.map.getView().calculateExtent(mapSize)
      : [0, 0, 100, 100];
    return mapExtent;
  }

  /**
   * Get current map extent in WGS84 (EPSG:4326) projection
   * @public
   * @returns Extent
   */
  getMapExtentInEpsg4326(): Extent {
    const bbox = transformExtent(
      this.getMapExtent(),
      this.getCurrentProj(),
      'EPSG:4326',
    );
    return bbox;
  }

  /**
   * Fit extent into map view
   * @public
   * @param extent - Extent provided
   */
  async fitExtent(extent: number[]): Promise<void> {
    const mapSize = this.map.getSize();
    if (!mapSize.every((p) => p > 0)) {
      this.hsLog.warn(
        'Tried to fit extent but one of map dimensions were 0. Will wait a bit and try again!',
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    this.map.getView().fit(extent, {size: mapSize});
  }

  /**
   * Get ol.Map object from service
   * @public
   * @returns ol.Map
   */
  getMap(): Map {
    return this.map;
  }

  /**
   * Remove all map layers
   * @public
   */
  removeAllLayers(): void {
    const to_be_removed = [];
    this.getLayersArray()
      .filter((layer) => getRemovable(layer as Layer<Source>) !== false)
      .forEach((lyr) => {
        to_be_removed.push(lyr);
      });
    while (to_be_removed.length > 0) {
      this.map.removeLayer(to_be_removed.shift());
    }
  }

  /**
   * Remove all removable layers no matter fromComposition param
   */
  removeCompositionLayers(force?: boolean): void {
    let to_be_removed = this.getLayersArray().filter(
      (lyr) => getRemovable(lyr) === undefined || getRemovable(lyr) == true,
    );
    if (!force) {
      to_be_removed = to_be_removed.filter((lyr) => {
        return getFromComposition(lyr);
      });
    }

    while (to_be_removed.length > 0) {
      this.map.removeLayer(to_be_removed.shift());
    }
  }

  /**
   * Remove all map controls
   * @public
   */
  removeAllControls(): void {
    [...this.map.getControls().getArray()].forEach((control) => {
      this.map.removeControl(control);
    });
    this.hsConfig.componentsEnabled.mapControls = false;
  }

  /**
   * Remove all map interactions
   * @public
   */
  removeAllInteractions(): void {
    this.map.getInteractions().forEach((interaction) => {
      this.map.removeInteraction(interaction);
    });
    this.hsConfig.mapInteractionsEnabled = false;
  }

  /**
   * Get current extent of map, transform it into EPSG:4326 and round coordinates to 2 decimals.
   * This is used mainly in compositions and sharing of map and the coordinates are not very precise.
   * @returns Extent coordinates. Example: \{east: "0.00", south: "0.00", west: "1.00", north: "1.00"\}
   */
  describeExtent(): BoundingBoxObject {
    const b = this.map.getView().calculateExtent(this.map.getSize());
    let pair1 = [b[0], b[1]];
    let pair2 = [b[2], b[3]];
    const cur_proj = this.getCurrentProj().getCode();
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
