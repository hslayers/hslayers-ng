import {Injectable} from '@angular/core';

import ImageSource from 'ol/source/Image';
import TileSource from 'ol/source/Tile';
import {Image as ImageLayer, Layer, Tile} from 'ol/layer';
import {Options as ImageOptions} from 'ol/layer/BaseImage';
import {ImageWMS, Source, TileWMS} from 'ol/source';
import {Options as TileOptions} from 'ol/layer/BaseTile';
import {WMSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {DuplicateHandling, HsMapService} from '../../../map/map.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsConfig} from '../../../../config.service';
import {HsDimensionService} from '../../../../common/get-capabilities/dimension.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/get-capabilities/wms-get-capabilities.service';
import {
  WMSGetCapabilitiesResponse,
  WmsLayer,
} from '../../../../common/get-capabilities/wms-get-capabilities-response.interface';
import {addAnchors} from '../../../../common/attribution-utils';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {getPreferredFormat} from '../../../../common/format-utils';
import {urlDataObject} from '../types/data-object.type';

class HsUrlWmsParams {
  data: urlDataObject;
  constructor() {
    this.data = {
      add_under: null,
      map_projection: '',
      register_metadata: true,
      tile_size: 512,
      use_resampling: false,
      use_tiles: true,
      visible: true,
      table: {
        trackBy: 'Name',
        nameProperty: 'Title',
      },
    };
  }
}

@Injectable({providedIn: 'root'})
export class HsUrlWmsService implements HsUrlTypeServiceModel {
  apps: {
    [id: string]: any;
  } = {default: new HsUrlWmsParams()};

  constructor(
    public hsMapService: HsMapService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsDimensionService: HsDimensionService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsAddDataService: HsAddDataService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.hsEventBusService.olMapLoads.subscribe(({map, app}) => {
      this.get(app).data.map_projection = this.hsMapService
        .getMap(app)
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
  }

  get(app: string): HsUrlWmsParams {
    if (this.apps[app ?? 'default'] === undefined) {
      this.apps[app ?? 'default'] = new HsUrlWmsParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * List and return layers from WMS getCapabilities response
   * @param wrapper - Capabilities response wrapper
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    app: string
  ): Promise<Layer<Source>[]> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(
        wrapper.response.message,
        app
      );
      return;
    }
    try {
      await this.capabilitiesReceived(
        wrapper.response,
        this.hsAddDataCommonService.get(app).layerToSelect,
        app
      );
      if (this.hsAddDataCommonService.get(app).layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.get(app).data.layers,
          'wms',
          app
        );
        return this.getLayers(app, true);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e, app);
    }
  }

  /**
   * Expands all sibling cells belonging to the same row after overflown cell is clicked
   */
  expandTableRow(e): void {
    const action = e.target.className.includes('hs-wms-expandedRow')
      ? 'remove'
      : 'add';
    if (this.hsUtilsService.isOverflown(e.target) || action == 'remove') {
      const selectedRow = e.target.parentElement;
      for (const el of selectedRow.children) {
        el.classList[action]('hs-wms-expandedRow');
      }
    }
  }

  /**
   * Fills list of available projections
   */
  fillProjections(caps, response, app: string): void {
    const appRef = this.get(app);
    if (caps.Capability.Layer.CRS !== undefined) {
      appRef.data.srss = caps.Capability.Layer.CRS;
    } else if (
      caps.Capability.Layer.Layer &&
      caps.Capability.Layer.Layer.length > 0 &&
      caps.Capability.Layer.Layer[0].CRS
    ) {
      appRef.data.srss = caps.Capability.Layer.Layer[0].CRS;
    } else {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;
      doc.querySelectorAll('Capability>Layer CRS').forEach((srs) => {
        appRef.data.srss.push(srs.innerHTML);
      });
      /**
       * SRS is a malformed input and an error but let's be generous...
       */
      if (appRef.data.srss.length == 0) {
        doc.querySelectorAll('Capability>Layer SRS').forEach((srs) => {
          appRef.data.srss.push(srs.innerHTML);
        });
      }
      //filter out duplicate records
      appRef.data.srss = [...new Set(appRef.data.srss)];
    }
    if (appRef.data.srss.length == 0) {
      appRef.data.srss = ['EPSG:4326'];
      this.hsAddDataCommonService.throwParsingError(
        "No CRS found in the service's Capabilities. This is an error on the provider's site. Guessing WGS84 will be supported. This may or may not be correct.",
        app
      );
    }
  }

  /**
   * Parse information received in WMS getCapabilities response
   */
  async capabilitiesReceived(
    response,
    layerToSelect: string,
    app: string
  ): Promise<void> {
    try {
      const appRef = this.get(app);
      const parser = new WMSCapabilities();
      const caps: WMSGetCapabilitiesResponse = parser.read(response);
      appRef.data.map_projection = this.hsMapService
        .getMap(app)
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      appRef.data.title = caps.Service.Title || 'Wms layer';
      appRef.data.description = addAnchors(caps.Service.Abstract);
      appRef.data.version = caps.Version || caps.version;
      appRef.data.image_formats = caps.Capability.Request.GetMap.Format
        ? (caps.Capability.Request.GetMap.Format as Array<string>)
        : [];
      appRef.data.query_formats = caps.Capability.Request.GetFeatureInfo
        ? (caps.Capability.Request.GetFeatureInfo.Format as Array<string>)
        : [];
      appRef.data.exceptions = caps.Capability.Exception;
      appRef.data.srss = [];
      this.fillProjections(caps, response, app);
      // //TODO: WHY?
      // if (this.data.srss.includes('CRS:84')) {
      //   this.data.srss.splice(this.data.srss.indexOf('CRS:84'), 1);
      // }
      if (
        this.hsAddDataCommonService.currentProjectionSupported(
          appRef.data.srss,
          app
        )
      ) {
        appRef.data.srs = appRef.data.srss.includes(
          this.hsMapService.getMap(app).getView().getProjection().getCode()
        )
          ? this.hsMapService.getMap(app).getView().getProjection().getCode()
          : this.hsMapService
              .getMap(app)
              .getView()
              .getProjection()
              .getCode()
              .toLowerCase();
      } else if (appRef.data.srss.includes('EPSG:4326')) {
        appRef.data.srs = 'EPSG:4326';
      } else {
        appRef.data.srs = appRef.data.srss[0];
      }
      appRef.data.resample_warning = this.hsAddDataCommonService.srsChanged(
        appRef.data.srs,
        app
      );
      appRef.data.layers = this.filterCapabilitiesLayers(caps.Capability.Layer);
      //Make sure every service has a title to be displayed in table
      for (const layer of appRef.data.layers) {
        if (layer.Title.length == 0) {
          layer.Title = layer.Name;
        }
      }

      const serviceLayer = this.hsAddDataUrlService.selectLayerByName(
        layerToSelect,
        appRef.data.layers,
        'Name'
      );
      this.hsAddDataUrlService.searchForChecked(appRef.data.layers, app);
      //TODO: shalln't we move this logic after the layer is added to map?
      if (layerToSelect) {
        appRef.data.extent = this.getLayerExtent(
          serviceLayer,
          appRef.data.srs,
          app
        );
      }
      this.hsDimensionService.fillDimensionValues(caps.Capability.Layer);

      appRef.data.get_map_url = this.removePortIfProxified(
        caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource,
        app
      );
      appRef.data.image_format = getPreferredFormat(appRef.data.image_formats, [
        'image/png; mode=8bit',
        'image/png',
        'image/gif',
        'image/jpeg',
      ]);
      appRef.data.query_format = getPreferredFormat(appRef.data.query_formats, [
        'application/vnd.esri.wms_featureinfo_xml',
        'application/vnd.ogc.gml',
        'application/vnd.ogc.wms_xml',
        'text/plain',
        'text/html',
      ]);
      this.hsAddDataCommonService.get(app).loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * For given array of layers (service layer definitions) it calculates a cumulative bounding box which encloses all the layers
   */
  calcAllLayersExtent(layers: Layer<Source>[] | Layer<Source>): any {
    if (!Array.isArray(layers)) {
      return [...layers.getExtent()];
    }
    const layerExtents = layers.map((lyr) => [...lyr.getExtent()]); //Spread need to not create reference
    return this.hsAddDataUrlService.calcCombinedExtent(layerExtents);
  }

  getLayerExtent(serviceLayer: any, crs: string, app: string): number[] {
    //Get called without valid serviceLayer as part of micka dataset loading pipeline
    if (!serviceLayer) {
      return;
    }
    const appRef = this.get(app);
    let boundingbox = serviceLayer.BoundingBox;
    if (Array.isArray(serviceLayer.BoundingBox)) {
      const preferred = boundingbox.find((bboxInCrs) => {
        return bboxInCrs.crs == appRef.data.map_projection;
      });
      boundingbox =
        preferred?.extent ??
        transformExtent(
          serviceLayer.BoundingBox[0].extent,
          serviceLayer.BoundingBox[0].crs || crs, //Use BBOX object crs - when missing assume its same as layer's
          this.hsMapService.getMap(app).getView().getProjection()
        );
    } else if (crs !== undefined) {
      if (serviceLayer.EX_GeographicBoundingBox !== undefined) {
        boundingbox = transformExtent(
          serviceLayer.EX_GeographicBoundingBox,
          'EPSG:4326',
          this.hsMapService.getMap(app).getView().getProjection()
        );
      }
    } else {
      if (appRef.data.map_projection != serviceLayer.crs) {
        boundingbox = serviceLayer.LatLonBoundingBox;
      }
    }
    return boundingbox;
  }

  /**
   * Filters out layers without 'Name' parameter
   */
  filterCapabilitiesLayers(
    layers: WmsLayer | Array<WmsLayer>
  ): Array<WmsLayer> {
    if (Array.isArray(layers)) {
      return layers;
    }
    let tmp = [];
    if (typeof layers == 'object') {
      if (layers.Layer && Array.isArray(layers.Layer)) {
        const layersWithNameParam = layers.Layer.filter((layer) => layer.Name);
        if (layersWithNameParam.length > 0) {
          return layersWithNameParam;
        }
        for (const layer of layers.Layer) {
          tmp.push(...this.filterCapabilitiesLayers(layer));
        }
      } else {
        tmp = [layers];
      }
    }
    return tmp;
  }
  /**
   * Removes extra port which is added to the getMap request when
   * GetCapabilities is queried through proxy. <GetMap><DCPType><HTTP><Get>
   * \<OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/maps"/\>
   * then becomes <GetMap><DCPType><HTTP><Get>
   * \<OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz:8085/cgi-bin/mapserv?map=/home/maps"/\>
   * which is wrong.
   * @param url - URL for which to remove port but only when proxified
   * with port in proxy path.
   * @returns URL without proxy services port added to it.
   */
  removePortIfProxified(url: string, app: string): string {
    if (this.hsConfig.get(app).proxyPrefix === undefined) {
      return url;
    }
    const proxyPort = parseInt(
      this.hsUtilsService.getPortFromUrl(this.hsConfig.get(app).proxyPrefix)
    );
    if (proxyPort > 0) {
      return url.replace(':' + proxyPort.toString(), '');
    }
    return url;
  }

  /**
   * Loop through the list of layers and call getLayer.
   * @param checkedOnly - Add all available layers or only checked ones. checkedOnly=false=all
   */
  getLayers(
    app: string,
    checkedOnly: boolean,
    shallow = false
  ): Layer<Source>[] {
    const appRef = this.get(app);
    if (appRef.data.layers === undefined) {
      return;
    }
    const collection = [];
    //Limit visible layers to 10 to not freeze accidentally
    appRef.data.visible = checkedOnly
      ? appRef.data.layers.filter((l) => l.checked === true).length <= 10
      : false;
    if (appRef.data.base) {
      const newLayer = this.getLayer(
        {},
        {
          layerName: appRef.data.title.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(
            appRef.data.folder_name
          ),
          imageFormat: appRef.data.image_format,
          queryFormat: appRef.data.query_format,
          tileSize: appRef.data.tile_size,
          crs: appRef.data.srs,
          subLayers: '',
        },
        app
      );
      collection.push(newLayer);
    } else {
      for (const layer of appRef.data.layers) {
        this.getLayersRecursively(
          layer,
          {checkedOnly: checkedOnly, shallow: shallow},
          collection,
          app
        );
      }
    }
    appRef.data.extent = this.calcAllLayersExtent(collection);
    appRef.data.base = false;
    this.zoomToLayers(app);
    this.hsAddDataCommonService.clearParams(app);
    this.apps[app] = new HsUrlWmsParams();
    this.hsAddDataCommonService.setPanelToCatalogue(app);
    if (collection.length > 0) {
      this.hsLayoutService.setMainPanel('layermanager', app);
    }
    return collection;
  }

  /**
   * Get selected layer
   * @param layer - capabilities layer object
   * @param layerName - layer name in the map
   * @param path - Path (folder) name
   * @param imageFormat - Format in which to serve image. Usually: image/png
   * @param queryFormat - See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param tileSize - Tile size in pixels
   * @param crs - of the layer
   * @param subLayers - Static sub-layers of the layer
   */
  getLayer(layer, options: addLayerOptions, app: string): Layer<Source> {
    const appRef = this.get(app);
    let attributions = [];
    if (layer.Attribution) {
      attributions = [
        `<a href="${layer.Attribution.OnlineResource}">${layer.Attribution.Title}</a>`,
      ];
    }
    const dimensions = {};
    if (layer.Dimension) {
      for (const val of layer.Dimension) {
        dimensions[val.name] = val;
      }
    }

    const {styles, legends} = this.getLayerStyles(layer);
    const sourceOptions = {
      url: appRef.data.get_map_url,
      attributions,
      projection: appRef.data.srs,
      params: {
        LAYERS: appRef.data.base
          ? this.hsAddDataCommonService.createBasemapName(
              appRef.data.layers,
              'Name'
            )
          : layer.Name,
        INFO_FORMAT: layer.queryable ? options.queryFormat : undefined,
        FORMAT: options.imageFormat,
        VERSION: appRef.data.version,
        STYLES: styles,
        ...this.hsDimensionService.paramsFromDimensions(layer),
      },
      crossOrigin: 'anonymous',
    };
    const source: ImageWMS | TileWMS = !appRef.data.use_tiles
      ? new ImageWMS(sourceOptions)
      : new TileWMS(sourceOptions);
    const metadata =
      this.hsWmsGetCapabilitiesService.getMetadataObjectWithUrls(layer);
    const layerOptions = {
      title: options.layerName,
      name: options.layerName,
      source,
      minResolution: this.HsLayerUtilsService.calculateResolutionFromScale(
        layer.MinScaleDenominator,
        app
      ),
      maxResolution: this.HsLayerUtilsService.calculateResolutionFromScale(
        layer.MaxScaleDenominator,
        app
      ),
      removable: true,
      abstract: layer.Abstract,
      metadata,
      extent: this.getLayerExtent(layer, options.crs, app),
      path: options.path,
      dimensions: dimensions,
      legends: legends,
      subLayers: options.subLayers,
      base: appRef.data.base,
      visible: appRef.data.visible,
    };
    const new_layer = !appRef.data.use_tiles
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);
    this.hsMapService.proxifyLayerLoader(new_layer, appRef.data.use_tiles, app);
    return new_layer;
  }

  /**
   * Loop through the list of layers and add them to the map
   */
  addLayers(layers: Layer<Source>[], app: string): void {
    for (const l of layers) {
      this.hsMapService.resolveDuplicateLayer(
        l,
        app,
        DuplicateHandling.RemoveOriginal
      );
      this.hsAddDataService.addLayer(l, app, this.get(app).data.add_under);
    }
  }

  /**
   * Get selected layer styles and legends
   * @param layer - Selected layer
   */
  private getLayerStyles(layer: any): {styles: string[]; legends: string[]} {
    const legends = [];
    let styles = undefined;
    if (layer.styleSelected) {
      styles = layer.styleSelected.Name;
      if (layer.styleSelected.LegendURL?.length > 0) {
        legends.push(layer.styleSelected.LegendURL[0].OnlineResource);
      }
    } else if (layer.Style && layer.Style.length > 0) {
      const firstStyle = layer.Style[0];
      styles = firstStyle.Name;
      if (firstStyle.LegendURL) {
        legends.push(firstStyle.LegendURL[0].OnlineResource);
      }
    } else {
      styles = '';
    }
    return {styles, legends};
  }

  /**
   * Loop through the list of layers and call getLayer recursively
   * @param layer - Layer selected. A descriptor similar to WmsLayer, but has additional properties, also specific to WFS and ArcGIS layers
   * @param options - Add layers recursively options
   * (checkedOnly?: boolean; shallow?: boolean; style?: string;)
   * @param collection - Layers created and retrieved collection
   */
  getLayersRecursively(
    layer: any, //TODO: better typing. It is a wrapper similar to WmsLayer, but has additional properties, also specific to WFS and ArcGIS layers
    options: addLayersRecursivelyOptions = {checkedOnly: true},
    collection: Layer<Source>[],
    app: string
  ): void {
    const appRef = this.get(app);
    if (!options.checkedOnly || layer.checked) {
      collection.push(
        this.getLayer(
          layer,
          {
            layerName: layer.Title.replace(/\//g, '&#47;'),
            path: this.hsUtilsService.undefineEmptyString(
              appRef.data.folder_name
            ),
            imageFormat: appRef.data.image_format,
            queryFormat: appRef.data.query_format,
            tileSize: appRef.data.tile_size,
            crs: appRef.data.srs,
          },
          app
        )
      );
    }
    // When not shallow go full depth otherwise layer.Name has got to be missing (first queriable layer)
    const nextDepthAllowed = options.shallow ? !layer.Name : true;
    if (layer.Layer && nextDepthAllowed) {
      for (const sublayer of layer.Layer) {
        this.getLayersRecursively(
          sublayer,
          {checkedOnly: options.checkedOnly},
          collection,
          app
        );
      }
    }
  }

  /**
   * Zoom map to one layers or combined layer list extent
   */
  zoomToLayers(app: string) {
    if (this.get(app).data.extent) {
      this.hsMapService.fitExtent(this.get(app).data.extent, app);
    }
  }
}
