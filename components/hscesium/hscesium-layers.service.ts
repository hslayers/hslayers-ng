import * as moment from 'moment';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';
import GeoJsonDataSource from 'cesium/Source/DataSources/GeoJsonDataSource';
import GetFeatureInfoFormat from 'cesium/Source/Scene/GetFeatureInfoFormat';
import ImageryLayer from 'cesium/Source/Scene/ImageryLayer';
import KmlDataSource from 'cesium/Source/DataSources/KmlDataSource';
import OpenStreetMapImageryProvider from 'cesium/Source/Scene/OpenStreetMapImageryProvider';
import Resource from 'cesium/Source/Core/Resource';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import WebMapServiceImageryProvider from 'cesium/Source/Scene/WebMapServiceImageryProvider';
import WebMercatorTilingScheme from 'cesium/Source/Core/WebMercatorTilingScheme';
import createWorldTerrain from 'cesium/Source/Core/createWorldTerrain';
import {GeoJSON, KML} from 'ol/format';
import {Group} from 'ol/layer';
import {HsCesiumService} from './hscesium.service';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {ImageWMS} from 'ol/source';
import {Inject, Injectable, ViewRef} from '@angular/core';
import {OSM, TileWMS} from 'ol/source';
import {Vector} from 'ol/source';
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

  constructor(
    private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService,
    @Inject(WINDOW) private window: Window
  ) {}

  init(viewer: Viewer) {
    this.viewer = viewer;
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

  setupEvents() {
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
    this.HsMapService.loaded((map) => {
      map.getLayers().on('add', (e) => {
        const lyr = e.element;
        this.processOlLayer(lyr);
      });
    });
  }

  /**
   * @ngdoc method
   * @name HsCesiumService#repopulateLayers
   * @public
   * @description Add all layers from app HsConfig (box_layers and default_layers) to the map. Only layers specified in visible_layers parameter will get instantly visible.
   */
  repopulateLayers() {
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
    this.HsMapService.loaded((map) => {
      map.getLayers().forEach((lyr) => {
        if (lyr.cesium_layer == undefined) {
          this.processOlLayer(lyr);
        }
      });
    });
  }

  serializeVectorLayerToGeoJson(ol_source) {
    const f = new GeoJSON();
    //console.log('start serialize',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const features = ol_source.getFeatures();
    features.forEach((feature) => {
      if (
        typeof ol_source.cesium_layer.entities.getById(feature.getId()) !=
        'undefined'
      ) {
        features.splice(features.indexOf(feature), 1);
      } else {
        //console.log('New feadure', feature.getId())
      }
    });
    //console.log('start removing entities',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const to_remove = [];
    ol_source.cesium_layer.entities.values.forEach((entity) => {
      if (ol_source.getFeatureById(entity.id) === null) {
        to_remove.push(entity.id);
      }
    });
    //console.log('removing entities',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    while (to_remove.length > 0) {
      const id = to_remove.pop();
      //console.log('Didnt find OL feature ', id);
      ol_source.cesium_layer.entities.removeById(id);
    }
    //console.log('revoved. serializing',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    const json = f.writeFeaturesObject(features);
    //console.log('done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    //ol_source.cesium_layer.entities.removeAll();
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

  linkOlLayerToCesiumLayer(ol_layer, cesium_layer) {
    ol_layer.cesium_layer = cesium_layer;
    cesium_layer.ol_layer = ol_layer;
    ol_layer.on('change:visible', (e) => {
      e.target.cesium_layer.show = ol_layer.getVisible();
    });
    ol_layer.on('change:opacity', (e) => {
      e.target.cesium_layer.alpha = parseFloat(ol_layer.getOpacity());
    });
  }

  linkOlSourceToCesiumDatasource(ol_source, cesium_layer) {
    ol_source.cesium_layer = cesium_layer;
    this.syncFeatures(ol_source);
    ol_source.on('features:loaded', (e) => {
      if (e.target.cesium_layer) {
        this.syncFeatures(e.target);
      }
    });
  }

  syncFeatures(ol_source) {
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
        camera: this.viewer.scene.camera,
        canvas: this.viewer.scene.canvas,
        clampToGround: true,
      }
    );
    promise.then((source) => {
      //console.log('loaded in temp.',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
      source.entities.values.forEach((entity) => {
        try {
          if (ol_source.cesium_layer.entities.getById(entity.id) == undefined) {
            //console.log('Adding', entity.id);
            ol_source.cesium_layer.entities.add(entity);
          }
        } catch (ex) {
          if (console) {
            console.error(ex.toString());
          }
        }
      });
      //console.log('added to real layer',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
      ol_source.cesiumStyler(ol_source.cesium_layer);
      //console.log('styling done',(new Date()).getTime() - window.lasttime); window.lasttime = (new Date()).getTime();
    });
  }

  processOlLayer(lyr) {
    if (this.HsUtilsService.instOf(lyr, Group)) {
      for (const sub_lyr of lyr.layers) {
        this.processOlLayer(sub_lyr);
      }
    } else {
      lyr.setVisible(
        this.HsMapService.layerTitleInArray(
          lyr,
          this.HsMapService.visibleLayersInUrl
        ) || lyr.getVisible()
      );
      lyr.manuallyAdded = false;
      if (this.HsUtilsService.instOf(lyr.getSource(), ImageWMS)) {
        this.HsMapService.proxifyLayerLoader(lyr, false);
      }
      if (this.HsUtilsService.instOf(lyr.getSource(), TileWMS)) {
        this.HsMapService.proxifyLayerLoader(lyr, true);
      }
      const cesium_layer = this.convertOlToCesiumProvider(lyr);
      if (cesium_layer) {
        if (this.HsUtilsService.instOf(cesium_layer, ImageryLayer)) {
          this.linkOlLayerToCesiumLayer(lyr, cesium_layer);
          this.viewer.imageryLayers.add(cesium_layer);
        } else {
          this.viewer.dataSources.add(cesium_layer);
          if (lyr.get('title') != 'Point clicked') {
            this.linkOlSourceToCesiumDatasource(lyr.getSource(), cesium_layer);
          }
        }
      }
    }
  }

  convertOlToCesiumProvider(ol_lyr) {
    if (this.HsUtilsService.instOf(ol_lyr.getSource(), OSM)) {
      return new ImageryLayer(new OpenStreetMapImageryProvider(), {
        show: ol_lyr.getVisible(),
        minimumTerrainLevel: ol_lyr.minimumTerrainLevel || 15,
      });
    } else if (this.HsUtilsService.instOf(ol_lyr.getSource(), TileWMS)) {
      return this.createTileProvider(ol_lyr);
    } else if (this.HsUtilsService.instOf(ol_lyr.getSource(), ImageWMS)) {
      return this.createSingleImageProvider(ol_lyr);
    } else if (this.HsUtilsService.instOf(ol_lyr.getSource(), Vector)) {
      return this.createVectorDataSource(ol_lyr);
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

  createVectorDataSource(ol_lyr) {
    if (
      ol_lyr.getSource().getFormat() &&
      this.HsUtilsService.instOf(ol_lyr.getSource().getFormat(), KML)
    ) {
      return KmlDataSource.load(ol_lyr.getSource().getUrl(), {
        camera: this.viewer.scene.camera,
        canvas: this.viewer.scene.canvas,
        clampToGround: ol_lyr.getSource().get('clampToGround') || true,
      });
    } else {
      const new_source = new GeoJsonDataSource(ol_lyr.get('title'));
      ol_lyr.cesium_layer = new_source; //link to cesium layer will be set also for OL layers source object, when this function returns.
      ol_lyr.on('change:visible', (e) => {
        e.target.cesium_layer.show = ol_lyr.getVisible();
      });
      return new_source;
    }
  }

  createTileProvider(ol_lyr) {
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
    const prm_cache = {
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
      new WebMapServiceImageryProvider(
        this.removeUnwantedParams(prm_cache, src)
      ),
      {
        alpha: ol_lyr.getOpacity() || 0.7,
        show: ol_lyr.getVisible(),
      }
    );
    tmp.prm_cache = prm_cache;
    return tmp;
  }

  //Same as normal tiled WebMapServiceImageryProvider, but with bigger tileWidth and tileHeight
  createSingleImageProvider(ol_lyr) {
    const src = ol_lyr.getSource();
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
    const prm_cache = {
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
      new WebMapServiceImageryProvider(
        this.removeUnwantedParams(prm_cache, src)
      ),
      {
        alpha: ol_lyr.getOpacity() || 0.7,
        show: ol_lyr.getVisible(),
      }
    );
    tmp.prm_cache = prm_cache;
    return tmp;
  }

  removeUnwantedParams(prm_cache, src) {
    if (prm_cache.parameters.dimensions) {
      delete prm_cache.parameters.dimensions;
    }
    return prm_cache;
  }

  changeLayerParam(layer, parameter, new_value) {
    new_value = moment(new_value).isValid()
      ? moment(new_value).toISOString()
      : new_value;
    layer.prm_cache.parameters[parameter] = new_value;
    this.layersToBeDeleted.push(layer);
    const tmp = new ImageryLayer(
      new WebMapServiceImageryProvider(layer.prm_cache),
      {
        alpha: layer.alpha,
        show: layer.show,
      }
    );
    tmp.prm_cache = layer.prm_cache;
    this.linkOlLayerToCesiumLayer(layer.ol_layer, tmp);
    this.viewer.imageryLayers.add(tmp);
  }

  removeLayersWithOldParams() {
    while (this.layersToBeDeleted.length > 0) {
      this.viewer.imageryLayers.remove(this.layersToBeDeleted.pop());
    }
  }
}
