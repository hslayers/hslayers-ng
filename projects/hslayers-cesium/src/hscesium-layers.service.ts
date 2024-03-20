import {Injectable} from '@angular/core';

import dayjs from 'dayjs';
import {
  Cartesian3,
  CesiumTerrainProvider,
  ConstantProperty,
  DataSource,
  GeoJsonDataSource,
  GetFeatureInfoFormat,
  HeightReference,
  ImageryLayer,
  KmlDataSource,
  OpenStreetMapImageryProvider,
  Resource,
  UrlTemplateImageryProvider,
  Viewer,
  WebMapServiceImageryProvider,
  WebMercatorTilingScheme,
  createWorldTerrainAsync,
} from 'cesium';
import {GeoJSON, KML} from 'ol/format';
import {
  Group,
  Image as ImageLayer,
  Layer,
  Tile as TileLayer,
  Vector as VectorLayer,
} from 'ol/layer';
import {
  Image as ImageSource,
  ImageWMS,
  OSM,
  Source,
  Tile as TileSource,
  TileWMS,
  Vector as VectorSource,
  XYZ,
} from 'ol/source';
import {default as proj4} from 'proj4';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {
  HsLayerUtilsService,
  HsUtilsService,
  generateUuid,
} from 'hslayers-ng/services/utils';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {
  getDimensions,
  getMinimumTerrainLevel,
  getTitle,
} from 'hslayers-ng/common/extensions';

import {HsCesiumConfig} from './hscesium-config.service';
import {OlCesiumObjectMapItem} from './ol-cesium-object-map-item.class';
import {ParamCacheMapItem} from './param-cache-map-item.class';

function MyProxy({proxy, maxResolution, HsUtilsService, projection}) {
  this.proxy = proxy;
  this.maxResolution = maxResolution;
  this.HsUtilsService = HsUtilsService;
  this.projection = projection;
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
    public hsMapService: HsMapService,
    private hsLog: HsLogService,
    public hsConfig: HsConfig,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    public hsCesiumConfig: HsCesiumConfig,
    private HsLayerUtilsService: HsLayerUtilsService,
  ) {
    this.hsCesiumConfig.viewerLoaded.subscribe((viewer) => {
      this.viewer = viewer;
      this.ol2CsMappings = [];
      this.paramCaches = [];
      this.defineProxy();
      this.setupEvents();
    });
  }

  defineProxy() {
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
          const params = this.HsUtilsService.getParamsFromUrl(resource);
          const bbox = params.bbox.split(',');
          const dist = Math.sqrt(
            Math.pow(bbox[0] - bbox[2], 2) + Math.pow(bbox[1] - bbox[3], 2),
          );
          if (this.projection == 'EPSG:3857') {
            if (dist > 1000000) {
              return blank_url;
            }
          }
          if (this.projection == 'EPSG:4326') {
            if (dist > 1) {
              return blank_url;
            }
          }
        }
      }
      resource = resource.replace(/fromcrs/gm, 'FROMCRS');
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
   * @param version -
   * @param srs -
   * @param crs -
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
      async (data) => {
        if (data && data.type && data.type == 'terrain') {
          if (
            data.url ==
            'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles'
          ) {
            const terrain_provider = await createWorldTerrainAsync(
              this.hsCesiumConfig.createWorldTerrainOptions,
            );
            this.viewer.terrainProvider = terrain_provider;
          } else {
            this.viewer.terrainProvider = await CesiumTerrainProvider.fromUrl(
              data.url,
            );
          }
        }
      },
    );

    this.repopulateLayers();
    const map = await this.hsMapService.loaded();
    map.getLayers().on('add', (e) => {
      const lyr = e.element;
      this.processOlLayer(lyr as Layer);
    });
  }

  /**
   * @public
   * Add all layers from app HsConfig (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
   */
  async repopulateLayers() {
    if (this.viewer.isDestroyed()) {
      return;
    }
    if (this.hsConfig.default_layers) {
      for (const l of this.hsConfig.default_layers.filter((l) => l)) {
        this.processOlLayer(l);
      }
    }
    if (this.hsConfig.box_layers) {
      for (const l of this.hsConfig.box_layers.filter((l) => l)) {
        this.processOlLayer(l);
      }
    }
    //Some layers might be loaded from cookies before cesium service was called
    const map = await this.hsMapService.loaded();
    map.getLayers().forEach((lyr: Layer<Source>) => {
      const cesiumLayer = this.findCesiumLayer(lyr);
      if (!cesiumLayer) {
        this.processOlLayer(lyr);
      }
    });
  }

  serializeVectorLayerToGeoJson(ol_source: VectorSource) {
    const f = new GeoJSON();
    const cesiumLayer = <DataSource>this.findCesiumLayer(ol_source);
    //console.log('start serialize',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const features = ol_source.getFeatures();
    features.forEach((feature) => {
      const featureId = feature.getId();
      if (featureId == undefined) {
        const id = generateUuid();
        feature.setId(id);
        feature.set('HsCesiumFeatureId', id);
        return;
      }
      if (
        typeof cesiumLayer.entities.getById(featureId.toString()) != 'undefined'
      ) {
        features.splice(features.indexOf(feature), 1);
      } else {
        //console.log('New feature', feature.getId())
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
      //console.log('Didn't find OL feature ', id);
      cesiumLayer.entities.removeById(id);
    }
    //console.log('removed. serializing',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const json: any = f.writeFeaturesObject(features);
    //console.log('done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    //cesiumLayer.entities.removeAll();
    if (this.currentMapProjCode() == 'EPSG:3857') {
      json.crs = {
        type: 'name',
        properties: {
          name: 'EPSG:3857',
        },
      };
    }
    return json;
  }

  currentMapProjCode() {
    if (this.hsMapService.getMap()) {
      return this.hsMapService.getCurrentProj().getCode();
    } else {
      this.hsConfig.default_view.getProjection().getCode();
    }
  }

  findCesiumLayer(ol: Layer<Source> | Source): ImageryLayer | DataSource {
    const found = this.ol2CsMappings.filter(
      (m: OlCesiumObjectMapItem) => m.olObject == ol,
    );
    if (found.length > 0) {
      return found[0].csObject;
    }
  }

  findOlLayer(cs: ImageryLayer | DataSource): Layer<Source> {
    const found = this.ol2CsMappings.filter(
      (m: OlCesiumObjectMapItem) =>
        m.csObject == cs && this.HsUtilsService.instOf(m.olObject, Layer),
    );
    if (found.length > 0) {
      return found[0].olObject;
    }
  }

  findOlSource(cs: ImageryLayer | DataSource): Source {
    const found = this.ol2CsMappings.filter(
      (m: OlCesiumObjectMapItem) =>
        m.csObject == cs && this.HsUtilsService.instOf(m.olObject, Source),
    );
    if (found.length > 0) {
      return found[0].olObject;
    }
  }

  linkOlLayerToCesiumLayer(
    ol_layer: Layer<Source>,
    cesium_layer: ImageryLayer,
  ): void {
    this.ol2CsMappings.push({
      olObject: ol_layer,
      csObject: cesium_layer,
    });
    ol_layer.on('change:visible', (e) => {
      const cesiumLayer = this.findCesiumLayer(e.target as Layer<Source>);
      cesiumLayer.show = ol_layer.getVisible();
    });
    ol_layer.on('change:opacity', (e) => {
      const cesiumLayer = this.findCesiumLayer(e.target as Layer<Source>);
      if (this.HsUtilsService.instOf(cesiumLayer, ImageryLayer)) {
        (<ImageryLayer>cesiumLayer).alpha = ol_layer.getOpacity();
      }
    });
  }

  linkOlSourceToCesiumDatasource(
    ol_source: VectorSource,
    cesium_layer: ImageryLayer | DataSource,
  ): void {
    this.ol2CsMappings.push({
      olObject: ol_source,
      csObject: cesium_layer,
    });
    this.syncFeatures(ol_source);
    (ol_source as any).on('features:loaded', (e) => {
      const cesiumLayer = this.findCesiumLayer(e.target as Source);
      if (cesiumLayer) {
        this.syncFeatures(e.target as VectorSource);
      }
    });
  }

  async syncFeatures(ol_source: VectorSource) {
    const tmp_source = new GeoJsonDataSource('tmp');
    GeoJsonDataSource.crsNames['EPSG:3857'] = function (coordinates) {
      const firstProjection =
        'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
      const secondProjection =
        'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

      const xa = coordinates[0];
      const ya = coordinates[1];
      const za = coordinates[2];

      const newCoordinates = proj4(firstProjection, secondProjection, [xa, ya]);
      return Cartesian3.fromDegrees(
        newCoordinates[0],
        newCoordinates[1],
        za ?? 0,
      );
    };
    //console.log('loading to cesium',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const source = await tmp_source.load(
      this.serializeVectorLayerToGeoJson(ol_source),
      {
        clampToGround: true,
      },
    );
    const cesiumLayer = <DataSource>this.findCesiumLayer(ol_source);
    //console.log('loaded in temp.',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    source.entities.values.forEach((entity) => {
      if (entity.properties.hasProperty('extrudedHeight')) {
        entity.polygon.extrudedHeight = entity.properties.getValue(
          this.viewer.clock.currentTime,
        ).extrudedHeight;
        entity.polygon.extrudedHeightReference = new ConstantProperty(
          HeightReference.RELATIVE_TO_GROUND,
        );
      }
      try {
        if (cesiumLayer.entities.getById(entity.id) == undefined) {
          //console.log('Adding', entity.id);
          cesiumLayer.entities.add(entity);
        }
      } catch (ex) {
        this.hsLog.error(ex.toString());
      }
    });
    //console.log('added to real layer',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    if (ol_source.get('cesiumStyler')) {
      ol_source.get('cesiumStyler')(cesiumLayer);
    }
    //console.log('styling done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
  }

  async processOlLayer(lyr: Layer<Source> | Group): Promise<void> {
    if (!this.viewer) {
      return;
    }
    if (this.HsUtilsService.instOf(lyr, Group)) {
      for (const sub_lyr of (<Group>lyr)
        .getLayers()
        .getArray() as Layer<Source>[]) {
        this.processOlLayer(sub_lyr);
      }
    } else {
      lyr.setVisible(
        this.hsMapService.layerTitleInArray(
          lyr as Layer<Source>,
          this.hsMapService.visibleLayersInUrl,
        ) || lyr.getVisible(),
      );
      if (this.HsUtilsService.instOf(lyr, ImageLayer)) {
        if (
          this.HsUtilsService.instOf(
            (lyr as ImageLayer<ImageSource>).getSource(),
            ImageWMS,
          )
        ) {
          this.hsMapService.proxifyLayerLoader(lyr as Layer<Source>, false);
        }
      }

      if (this.HsUtilsService.instOf(lyr, TileLayer)) {
        if (
          this.HsUtilsService.instOf(
            (lyr as TileLayer<TileSource>).getSource(),
            TileWMS,
          )
        ) {
          this.hsMapService.proxifyLayerLoader(lyr as Layer<Source>, true);
        }
      }
      const cesium_layer = await this.convertOlToCesiumProvider(
        lyr as Layer<Source>,
      );
      if (!cesium_layer) {
        return;
      }
      if (this.HsUtilsService.instOf(cesium_layer, ImageryLayer)) {
        this.linkOlLayerToCesiumLayer(
          lyr as Layer<Source>,
          cesium_layer as ImageryLayer,
        );
        this.viewer.imageryLayers.add(<ImageryLayer>cesium_layer);
      } else if (
        (this.HsUtilsService.instOf(cesium_layer, GeoJsonDataSource) ||
          this.HsUtilsService.instOf(cesium_layer, KmlDataSource)) &&
        this.viewer.dataSources
      ) {
        this.viewer.dataSources.add(<DataSource>cesium_layer);
        //TODO: Point clicked, Datasources extents, Composition extents shall be also synced
        if (getTitle(lyr as Layer<Source>) != 'Point clicked') {
          this.linkOlSourceToCesiumDatasource(
            (lyr as VectorLayer<VectorSource>).getSource(),
            cesium_layer,
          );
        }
      }
    }
  }

  async convertOlToCesiumProvider(
    olLayer: Layer<Source>,
  ): Promise<ImageryLayer | DataSource> {
    const layerSource = olLayer.getSource();
    if (this.HsUtilsService.instOf(layerSource, OSM)) {
      return new ImageryLayer(new OpenStreetMapImageryProvider({}), {
        show: olLayer.getVisible(),
        minimumTerrainLevel: getMinimumTerrainLevel(olLayer) || 1,
      });
    } else if (this.HsUtilsService.instOf(layerSource, XYZ)) {
      return new ImageryLayer(
        new UrlTemplateImageryProvider({
          url: (layerSource as XYZ).getUrls()[0],
        }),
        {
          show: olLayer.getVisible(),
        },
      );
    } else if (this.HsUtilsService.instOf(layerSource, TileWMS)) {
      return this.createTileProvider(olLayer);
    } else if (this.HsUtilsService.instOf(layerSource, ImageWMS)) {
      return this.createSingleImageProvider(olLayer as ImageLayer<ImageSource>);
    } else if (this.HsUtilsService.instOf(olLayer, VectorLayer)) {
      const dataSource = await this.createVectorDataSource(
        olLayer as VectorLayer<VectorSource>,
      );
      return dataSource;
    } else {
      this.hsLog.error(
        'Unsupported layer type for layer: ',
        olLayer,
        'in Cesium converter',
      );
    }
  }

  async createVectorDataSource(ol_lyr: VectorLayer<VectorSource>) {
    let new_source: DataSource;
    if (this.HsUtilsService.isFunction(ol_lyr.getSource().getUrl())) {
      this.hsLog.warn(
        'FeatureUrlFunction is currently not supported in synchronizing features from OL layer to Cesium',
      );
      return;
    }
    if (this.HsUtilsService.instOf(ol_lyr?.getSource()?.getFormat(), KML)) {
      const url = <string>ol_lyr.getSource().getUrl();
      new_source = await KmlDataSource.load(url, {
        camera: this.viewer.scene.camera,
        canvas: this.viewer.scene.canvas,
        clampToGround: ol_lyr.getSource().get('clampToGround') || true,
      });
    } else {
      new_source = new GeoJsonDataSource(getTitle(ol_lyr));
    }
    //link to Cesium layer will be set also for OL layers source object, when this function returns.
    this.ol2CsMappings.push({
      olObject: ol_lyr,
      csObject: new_source,
    });
    new_source.show = ol_lyr.getVisible();
    ol_lyr.on('change:visible', () => {
      new_source.show = ol_lyr.getVisible();
    });
    return new_source;
  }

  createTileProvider(ol_lyr): ImageryLayer {
    const src = ol_lyr.getSource();
    const params = JSON.parse(
      JSON.stringify(this.HsLayerUtilsService.getLayerParams(ol_lyr)),
    );
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
        proxy: new MyProxy({
          proxy: this.getProxyFromConfig(),
          maxResolution: ol_lyr.getMaxResolution(),
          HsUtilsService: this.HsUtilsService,
          projection: this.getProjectionFromParams(params),
        }),
      }),
      layers: src.getParams().LAYERS,
      dimensions: getDimensions(ol_lyr),
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
      },
    );
    this.paramCaches.push({imageryLayer: tmp, cache: prmCache});
    return tmp;
  }

  private getProxyFromConfig(): string {
    return this.hsConfig.proxyPrefix ? this.hsConfig.proxyPrefix : '/proxy/';
  }

  private getProjectionFromParams(params: any): string {
    return this.getProjectFromVersion(params.version, params.srs, params.crs);
  }

  //Same as normal tiled WebMapServiceImageryProvider, but with bigger tileWidth and tileHeight
  createSingleImageProvider(ol_lyr: ImageLayer<ImageSource>): ImageryLayer {
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
        proxy: new MyProxy({
          proxy: this.getProxyFromConfig(),
          maxResolution: ol_lyr.getMaxResolution(),
          HsUtilsService: this.HsUtilsService,
          projection: this.getProjectionFromParams(params),
        }),
      }),
      layers: src.getParams().LAYERS,
      dimensions: getDimensions(ol_lyr),
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
      },
    );
    this.paramCaches.push({imageryLayer: tmp, cache: prmCache});
    return tmp;
  }

  removeUnwantedParams(
    prmCache: any,
  ): WebMapServiceImageryProvider.ConstructorOptions {
    if (prmCache.parameters.dimensions) {
      delete prmCache.parameters.dimensions;
    }
    return prmCache;
  }

  changeLayerParam(layer: ImageryLayer, parameter, new_value): void {
    new_value = dayjs(new_value).isValid()
      ? dayjs(new_value).toISOString()
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
      (m: ParamCacheMapItem) => m.imageryLayer == layer,
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
        (m) => m.csObject == cesiumLayer,
      );
      for (const mapping of mappingsToRemove) {
        this.ol2CsMappings.splice(this.ol2CsMappings.indexOf(mapping));
      }
    }
  }
}
