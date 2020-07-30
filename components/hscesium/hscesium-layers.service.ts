import * as moment from 'moment';
import BaseLayer from 'ol/layer/Base';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';
import GeoJsonDataSource from 'cesium/Source/DataSources/GeoJsonDataSource';
import GetFeatureInfoFormat from 'cesium/Source/Scene/GetFeatureInfoFormat';
import ImageLayer from 'ol/layer/Image';
import KmlDataSource from 'cesium/Source/DataSources/KmlDataSource';
import Layer from 'ol/layer/Layer';
import OpenStreetMapImageryProvider from 'cesium/Source/Scene/OpenStreetMapImageryProvider';
import Resource from 'cesium/Source/Core/Resource';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import WebMapServiceImageryProvider from 'cesium/Source/Scene/WebMapServiceImageryProvider';
import WebMercatorTilingScheme from 'cesium/Source/Core/WebMercatorTilingScheme';
import createWorldTerrain from 'cesium/Source/Core/createWorldTerrain';
import {DataSource, ImageryLayer} from 'cesium';
import {GeoJSON, KML} from 'ol/format';
import {Group} from 'ol/layer';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {ImageWMS, Source, TileImage} from 'ol/source';
import {Inject, Injectable, ViewRef} from '@angular/core';
import {OSM, TileWMS} from 'ol/source';
import {OlCesiumObjectMapItem} from './ol-cesium-object-map-item.class';
import {ParamCacheMapItem} from './param-cache-map-item.class';
import {WINDOW} from '../utils/window';
import {default as proj4} from 'proj4';

/**
 * @param proxy
 * @param maxResolution
 */
function MyProxy(proxy, maxResolution) {
  this.proxy = proxy;
  this.maxResolution = maxResolution;
}

@Injectable({
  providedIn: 'root',
})
export class HsCesiumLayersService {
  layersToBeDeleted = [];
  viewer: Viewer;
  ol2CsMappings: Array<OlCesiumObjectMapItem> = [];
  paramCaches: Array<ParamCacheMapItem> = [];

  constructor(
    private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService,
    @Inject(WINDOW) private window: Window
  ) {}

  init(viewer: Viewer) {
    this.viewer = viewer;
    this.ol2CsMappings = [];
    this.paramCaches = [];
    this.defineProxy();
    this.setupEvents();
  }

  /**
   * @param HsConfig
   * @param $location
   * @param HsCesiumLayersService
   */
  defineProxy() {
    const me = this;
    MyProxy.prototype.getURL = function (resource) {
      const blank_url = `${this.proxy}${window.location.protocol}//${window.location.host}${window.location.pathname}img/blank.png`;
      const prefix =
        this.proxy.indexOf('?') === -1 && this.proxy.indexOf('hsproxy') > -1
          ? '?'
          : '';
      if (this.maxResolution <= 8550) {
        if (
          resource.indexOf('bbox=0%2C0%2C45') > -1 ||
          resource.indexOf('bbox=0, 45') > -1
        ) {
          return blank_url;
        } else {
          const params = me.HsUtilsService.getParamsFromUrl(resource);
          const bbox = params.bbox.split(',');
          const dist = Math.sqrt(
            Math.pow(bbox[0] - bbox[2], 2) + Math.pow(bbox[1] - bbox[3], 2)
          );
          const projection = me.getProjectFromVersion(
            params.version,
            params.srs,
            params.crs
          );
          if (projection == 'EPSG:3857') {
            if (dist > 1000000) {
              return blank_url;
            }
          }
          if (projection == 'EPSG:4326') {
            if (dist > 1) {
              return blank_url;
            }
          }
        }
      }
      resource = resource.replaceAll('fromcrs', 'FROMCRS');
      if (resource.indexOf('proxy4ows') > -1) {
        return resource;
      }
      return (
        this.proxy +
        prefix +
        (this.proxy.indexOf('hsproxy') > -1
          ? encodeURIComponent(resource)
          : resource)
      );
    };
  }

  /**
   * @param version
   * @param srs
   * @param crs
   */
  getProjectFromVersion(version, srs, crs) {
    if (version == '1.1.1') {
      return srs;
    }
    if (version == '1.3.1') {
      return crs;
    }
  }

  async setupEvents() {
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.subscribe(
      (data) => {
        if (data && data.type && data.type == 'terrain') {
          if (
            data.url ==
            'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles'
          ) {
            const terrain_provider = createWorldTerrain(
              this.HsConfig.createWorldTerrainOptions
            );
            this.viewer.terrainProvider = terrain_provider;
          } else {
            this.viewer.terrainProvider = new CesiumTerrainProvider({
              url: data.url,
            });
          }
        }
      }
    );

    this.repopulateLayers();
    const map = await this.HsMapService.loaded();
    map.getLayers().on('add', (e) => {
      const lyr = e.element;
      this.processOlLayer(lyr);
    });
  }

  /**
   * @ngdoc method
   * @name HsCesiumService#repopulateLayers
   * @public
   * @description Add all layers from app HsConfig (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
   */
  async repopulateLayers() {
    if (this.viewer.isDestroyed()) {
      return;
    }
    if (this.HsConfig.default_layers !== undefined) {
      this.HsConfig.default_layers.forEach((l) => this.processOlLayer(l));
    }
    if (this.HsConfig.box_layers) {
      this.HsConfig.box_layers.forEach((l) => this.processOlLayer(l));
    }
    //Some layers might be loaded from cookies before cesium service was called
    const map = await this.HsMapService.loaded();
    map.getLayers().forEach((lyr: Layer) => {
      const cesiumLayer = this.findCesiumLayer(lyr);
      if (cesiumLayer == undefined) {
        this.processOlLayer(lyr);
      }
    });
  }

  serializeVectorLayerToGeoJson(ol_source: VectorSource): any {
    const f = new GeoJSON();
    const cesiumLayer = <DataSource>this.findCesiumLayer(ol_source);
    //console.log('start serialize',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const features = ol_source.getFeatures();
    features.forEach((feature) => {
      const featureId = feature.getId();
      if (featureId == undefined) {
        return;
      }
      if (
        typeof cesiumLayer.entities.getById(featureId.toString()) != 'undefined'
      ) {
        features.splice(features.indexOf(feature), 1);
      } else {
        //console.log('New feadure', feature.getId())
      }
    });
    //console.log('start removing entities',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const to_remove = [];
    cesiumLayer.entities.values.forEach((entity) => {
      if (ol_source.getFeatureById(entity.id) === null) {
        to_remove.push(entity.id);
      }
    });
    //console.log('removing entities',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    while (to_remove.length > 0) {
      const id = to_remove.pop();
      //console.log('Didnt find OL feature ', id);
      cesiumLayer.entities.removeById(id);
    }
    //console.log('revoved. serializing',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const json: any = f.writeFeaturesObject(features);
    //console.log('done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    //cesiumLayer.entities.removeAll();
    if (
      this.HsMapService.map.getView().getProjection().getCode() == 'EPSG:3857'
    ) {
      json.crs = {
        type: 'name',
        properties: {
          name: 'EPSG:3857',
        },
      };
    }
    return json;
  }

  findCesiumLayer(ol: Layer | Source): ImageryLayer | DataSource {
    const found = this.ol2CsMappings.filter(
      (m: OlCesiumObjectMapItem) => m.olObject == ol
    );
    if (found.length > 0) {
      return found[0].csObject;
    }
  }

  findOlLayer(cs: ImageryLayer | DataSource): Layer {
    const found = this.ol2CsMappings.filter(
      (m: OlCesiumObjectMapItem) =>
        m.csObject == cs && this.HsUtilsService.instOf(m.olObject, Layer)
    );
    if (found.length > 0) {
      return found[0].olObject;
    }
  }

  findOlSource(cs: ImageryLayer | DataSource): Source {
    const found = this.ol2CsMappings.filter(
      (m: OlCesiumObjectMapItem) =>
        m.csObject == cs && this.HsUtilsService.instOf(m.olObject, Source)
    );
    if (found.length > 0) {
      return found[0].olObject;
    }
  }

  linkOlLayerToCesiumLayer(ol_layer: Layer, cesium_layer: ImageryLayer): void {
    this.ol2CsMappings.push({olObject: ol_layer, csObject: cesium_layer});
    ol_layer.on('change:visible', (e) => {
      const cesiumLayer = this.findCesiumLayer(e.target);
      cesiumLayer.show = ol_layer.getVisible();
    });
    ol_layer.on('change:opacity', (e) => {
      const cesiumLayer = this.findCesiumLayer(e.target);
      if (this.HsUtilsService.instOf(cesiumLayer, ImageryLayer)) {
        (<ImageryLayer>cesiumLayer).alpha = ol_layer.getOpacity();
      }
    });
  }

  linkOlSourceToCesiumDatasource(
    ol_source: VectorSource,
    cesium_layer: ImageryLayer | DataSource
  ): void {
    this.ol2CsMappings.push({olObject: ol_source, csObject: cesium_layer});
    this.syncFeatures(ol_source);
    ol_source.on('features:loaded', (e) => {
      const cesiumLayer = this.findCesiumLayer(e.target);
      if (cesiumLayer) {
        this.syncFeatures(e.target);
      }
    });
  }

  syncFeatures(ol_source: VectorSource): void {
    const tmp_source = new GeoJsonDataSource('tmp');
    GeoJsonDataSource.crsNames['EPSG:3857'] = function (coordinates) {
      const firstProjection =
        'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
      const secondProjection =
        'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

      const xa = coordinates[0];
      const ya = coordinates[1];

      const newCoordinates = proj4(firstProjection, secondProjection, [xa, ya]);
      return Cartesian3.fromDegrees(newCoordinates[0], newCoordinates[1], 0);
    };
    //console.log('loading to cesium',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const promise = tmp_source.load(
      this.serializeVectorLayerToGeoJson(ol_source),
      {
        clampToGround: true,
      }
    );
    promise.then((source) => {
      const cesiumLayer = <DataSource>this.findCesiumLayer(ol_source);
      //console.log('loaded in temp.',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
      source.entities.values.forEach((entity) => {
        try {
          if (cesiumLayer.entities.getById(entity.id) == undefined) {
            //console.log('Adding', entity.id);
            cesiumLayer.entities.add(entity);
          }
        } catch (ex) {
          if (console) {
            console.error(ex.toString());
          }
        }
      });
      //console.log('added to real layer',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
      ol_source.get('cesiumStyler')(cesiumLayer);
      //console.log('styling done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    });
  }

  async processOlLayer(lyr: BaseLayer): Promise<void> {
    if (!this.viewer) {
      return;
    }
    if (this.HsUtilsService.instOf(lyr, Group)) {
      for (const sub_lyr of (<Group>lyr).getLayers().getArray()) {
        this.processOlLayer(sub_lyr);
      }
    } else {
      lyr.setVisible(
        this.HsMapService.layerTitleInArray(
          lyr,
          this.HsMapService.visibleLayersInUrl
        ) || lyr.getVisible()
      );
      lyr.set('manuallyAdded', false);

      if (this.HsUtilsService.instOf(lyr, ImageLayer)) {
        if (
          this.HsUtilsService.instOf((<ImageLayer>lyr).getSource(), ImageWMS)
        ) {
          this.HsMapService.proxifyLayerLoader(lyr, false);
        }
      }

      if (this.HsUtilsService.instOf(lyr, TileLayer)) {
        if (this.HsUtilsService.instOf((<TileLayer>lyr).getSource(), TileWMS)) {
          this.HsMapService.proxifyLayerLoader(lyr, true);
        }
      }
      const cesium_layer = await this.convertOlToCesiumProvider(<Layer>lyr);
      if (cesium_layer) {
        if (this.HsUtilsService.instOf(cesium_layer, ImageryLayer)) {
          this.linkOlLayerToCesiumLayer(<Layer>lyr, <ImageryLayer>cesium_layer);
          this.viewer.imageryLayers.add(<ImageryLayer>cesium_layer);
        } else if (
          (this.HsUtilsService.instOf(cesium_layer, GeoJsonDataSource) ||
            this.HsUtilsService.instOf(cesium_layer, KmlDataSource)) &&
          this.viewer.dataSources
        ) {
          this.viewer.dataSources.add(<DataSource>cesium_layer);
          if (lyr.get('title') != 'Point clicked') {
            this.linkOlSourceToCesiumDatasource(
              (<VectorLayer>lyr).getSource(),
              cesium_layer
            );
          }
        }
      }
    }
  }

  async convertOlToCesiumProvider(
    ol_lyr: Layer
  ): Promise<ImageryLayer | DataSource> {
    if (this.HsUtilsService.instOf(ol_lyr.getSource(), OSM)) {
      return new ImageryLayer(new OpenStreetMapImageryProvider({}), {
        show: ol_lyr.getVisible(),
        minimumTerrainLevel: ol_lyr.get('minimumTerrainLevel') || 15,
      });
    } else if (this.HsUtilsService.instOf(ol_lyr.getSource(), TileWMS)) {
      return this.createTileProvider(ol_lyr);
    } else if (this.HsUtilsService.instOf(ol_lyr.getSource(), ImageWMS)) {
      return this.createSingleImageProvider(<ImageLayer>ol_lyr);
    } else if (this.HsUtilsService.instOf(ol_lyr, VectorLayer)) {
      const dataSource = await this.createVectorDataSource(<VectorLayer>ol_lyr);
      return dataSource;
    } else {
      if (console) {
        console.error(
          'Unsupported layer type for layer: ',
          ol_lyr,
          'in Cesium converter'
        );
      }
    }
  }

  async createVectorDataSource(ol_lyr: VectorLayer): Promise<DataSource> {
    if (
      ol_lyr.getSource().getFormat() &&
      this.HsUtilsService.instOf(ol_lyr.getSource().getFormat(), KML)
    ) {
      if (this.HsUtilsService.isFunction(ol_lyr.getSource().getUrl())) {
        console.warn(
          'FeatureUrlFunction is currently not supported in synchronizing features from Ol layer to Cesium'
        );
        return;
      }
      const url: string = <string>ol_lyr.getSource().getUrl();
      return await KmlDataSource.load(url, {
        camera: this.viewer.scene.camera,
        canvas: this.viewer.scene.canvas,
        clampToGround: ol_lyr.getSource().get('clampToGround') || true,
      });
    } else {
      const new_source = new GeoJsonDataSource(ol_lyr.get('title'));
      //link to cesium layer will be set also for OL layers source object, when this function returns.
      this.ol2CsMappings.push({olObject: ol_lyr, csObject: new_source});
      ol_lyr.on('change:visible', (e) => {
        const cesiumLayer = this.findCesiumLayer(e.target);
        cesiumLayer.show = ol_lyr.getVisible();
      });
      return new_source;
    }
  }

  createTileProvider(ol_lyr): ImageryLayer {
    const src = ol_lyr.getSource();
    const params = JSON.parse(JSON.stringify(src.getParams()));
    params.VERSION = params.VERSION || '1.1.1';
    if (params.VERSION.indexOf('1.1.') == 0) {
      params.CRS = 'EPSG:4326';
    }
    if (params.VERSION.indexOf('1.3.') == 0) {
      params.SRS = 'EPSG:4326';
    }
    params.FROMCRS = 'EPSG:4326';
    const prmCache = {
      url: new Resource({
        url: src.getUrls()[0],
        proxy: new MyProxy(
          this.HsConfig.proxyPrefix
            ? this.HsConfig.proxyPrefix
            : '/cgi-bin/hsproxy.cgi?url=',
          ol_lyr.getMaxResolution()
        ),
      }),
      layers: src.getParams().LAYERS,
      dimensions: ol_lyr.get('dimensions'),
      getFeatureInfoFormats: [new GetFeatureInfoFormat('text', 'text/plain')],
      enablePickFeatures: true,
      parameters: params,
      getFeatureInfoParameters: {
        VERSION: params.VERSION,
        CRS: 'EPSG:4326',
        FROMCRS: 'EPSG:4326',
      },
      minimumTerrainLevel: params.minimumTerrainLevel || 12,
      maximumLevel: params.maximumLevel,
      minimumLevel: params.minimumLevel,
    };
    const tmp = new ImageryLayer(
      new WebMapServiceImageryProvider(this.removeUnwantedParams(prmCache)),
      {
        alpha: ol_lyr.getOpacity() || 0.7,
        show: ol_lyr.getVisible(),
      }
    );
    this.paramCaches.push({imageryLayer: tmp, cache: prmCache});
    return tmp;
  }

  //Same as normal tiled WebMapServiceImageryProvider, but with bigger tileWidth and tileHeight
  createSingleImageProvider(ol_lyr: ImageLayer): ImageryLayer {
    const src: ImageWMS = <ImageWMS>ol_lyr.getSource();
    const params = Object.assign({}, src.getParams());
    params.VERSION = params.VERSION || '1.1.1';
    if (params.VERSION.indexOf('1.1.') == 0) {
      params.CRS = 'EPSG:4326';
      delete params.SRS;
    }
    if (params.VERSION.indexOf('1.3.') == 0) {
      params.SRS = 'EPSG:4326';
      delete params.CRS;
    }
    params.FROMCRS = 'EPSG:4326';
    const prmCache: any = {
      url: new Resource({
        url: src.getUrl(),
        proxy: new MyProxy(
          this.HsConfig.proxyPrefix
            ? this.HsConfig.proxyPrefix
            : '/cgi-bin/hsproxy.cgi?url=',
          ol_lyr.getMaxResolution()
        ),
      }),
      layers: src.getParams().LAYERS,
      dimensions: ol_lyr.get('dimensions'),
      getFeatureInfoFormats: [new GetFeatureInfoFormat('text', 'text/plain')],
      enablePickFeatures: true,
      parameters: params,
      tilingScheme: new WebMercatorTilingScheme(),
      getFeatureInfoParameters: {
        VERSION: params.VERSION,
        CRS: 'EPSG:4326',
        FROMCRS: 'EPSG:4326',
      },
      minimumTerrainLevel: params.minimumTerrainLevel || 12,
      tileWidth: 1024,
      tileHeight: 1024,
    };

    const tmp = new ImageryLayer(
      new WebMapServiceImageryProvider(this.removeUnwantedParams(prmCache)),
      {
        alpha: ol_lyr.getOpacity() || 0.7,
        show: ol_lyr.getVisible(),
      }
    );
    this.paramCaches.push({imageryLayer: tmp, cache: prmCache});
    return tmp;
  }

  removeUnwantedParams(
    prmCache: any
  ): WebMapServiceImageryProvider.ConstructorOptions {
    if (prmCache.parameters.dimensions) {
      delete prmCache.parameters.dimensions;
    }
    return prmCache;
  }

  changeLayerParam(layer: ImageryLayer, parameter, new_value): void {
    new_value = moment(new_value).isValid()
      ? moment(new_value).toISOString()
      : new_value;
    const prmCache = this.findParamCache(layer);
    prmCache.parameters[parameter] = new_value;
    this.layersToBeDeleted.push(layer);
    const tmp = new ImageryLayer(new WebMapServiceImageryProvider(prmCache), {
      alpha: layer.alpha,
      show: layer.show,
    });
    this.paramCaches.push({imageryLayer: tmp, cache: prmCache});
    this.linkOlLayerToCesiumLayer(this.findOlLayer(layer), tmp);
    this.viewer.imageryLayers.add(tmp);
  }

  findParamCache(layer: ImageryLayer): any {
    const found = this.paramCaches.filter(
      (m: ParamCacheMapItem) => m.imageryLayer == layer
    );
    if (found.length > 0) {
      return found[0].cache;
    }
  }

  removeLayersWithOldParams(): void {
    while (this.layersToBeDeleted.length > 0) {
      const cesiumLayer = this.layersToBeDeleted.pop();
      this.viewer.imageryLayers.remove(cesiumLayer);
      const mappingsToRemove = this.ol2CsMappings.filter(
        (m) => m.csObject == cesiumLayer
      );
      for (const mapping of mappingsToRemove) {
        this.ol2CsMappings.splice(this.ol2CsMappings.indexOf(mapping));
      }
    }
  }
}
