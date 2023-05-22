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

@Injectable({providedIn: 'root'})
export class HsUrlWmsService implements HsUrlTypeServiceModel {
  data: urlDataObject;

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
    this.hsEventBusService.olMapLoads.subscribe((map) => {
      this.data.map_projection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
    this.setDataToDefault();
  }

  /**
   * Sets data object to default
   */
  setDataToDefault(): void {
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

  /**
   * List and return layers from WMS getCapabilities response
   * @param wrapper - Capabilities response wrapper
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper
  ): Promise<Layer<Source>[]> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response.message);
      return;
    }
    try {
      await this.capabilitiesReceived(
        wrapper.response,
        this.hsAddDataCommonService.layerToSelect
      );
      if (this.hsAddDataCommonService.layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.data.layers,
          'wms'
        );
        return this.getLayers(true);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
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
  fillProjections(caps, response): void {
    if (caps.Capability.Layer.CRS !== undefined) {
      this.data.srss = caps.Capability.Layer.CRS;
    } else if (
      caps.Capability.Layer.Layer &&
      caps.Capability.Layer.Layer.length > 0 &&
      caps.Capability.Layer.Layer[0].CRS
    ) {
      this.data.srss = caps.Capability.Layer.Layer[0].CRS;
    } else {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;
      doc.querySelectorAll('Capability>Layer CRS').forEach((srs) => {
        this.data.srss.push(srs.innerHTML);
      });
      /**
       * SRS is a malformed input and an error but let's be generous...
       */
      if (this.data.srss.length == 0) {
        doc.querySelectorAll('Capability>Layer SRS').forEach((srs) => {
          this.data.srss.push(srs.innerHTML);
        });
      }
      //filter out duplicate records
      this.data.srss = [...new Set(this.data.srss)];
    }
    if (this.data.srss.length == 0) {
      this.data.srss = ['EPSG:4326'];
      this.hsAddDataCommonService.throwParsingError(
        "No CRS found in the service's Capabilities. This is an error on the provider's site. Guessing WGS84 will be supported. This may or may not be correct."
      );
    }
  }

  /**
   * Parse information received in WMS getCapabilities response
   */
  async capabilitiesReceived(response, layerToSelect: string): Promise<void> {
    try {
      const parser = new WMSCapabilities();
      const caps: WMSGetCapabilitiesResponse = parser.read(response);
      this.data.map_projection = this.hsMapService
        .getMap()
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      this.data.title = caps.Service.Title || 'Wms layer';
      this.data.description = addAnchors(caps.Service.Abstract);
      this.data.version = caps.Version || caps.version;
      this.data.image_formats = caps.Capability.Request.GetMap.Format
        ? (caps.Capability.Request.GetMap.Format as Array<string>)
        : [];
      this.data.query_formats = caps.Capability.Request.GetFeatureInfo
        ? (caps.Capability.Request.GetFeatureInfo.Format as Array<string>)
        : [];
      this.data.exceptions = caps.Capability.Exception;
      this.data.srss = [];
      this.fillProjections(caps, response);
      // //TODO: WHY?
      // if (this.data.srss.includes('CRS:84')) {
      //   this.data.srss.splice(this.data.srss.indexOf('CRS:84'), 1);
      // }
      if (
        this.hsAddDataCommonService.currentProjectionSupported(this.data.srss)
      ) {
        this.data.srs = this.data.srss.includes(
          this.hsMapService.getMap().getView().getProjection().getCode()
        )
          ? this.hsMapService.getMap().getView().getProjection().getCode()
          : this.hsMapService
              .getMap()
              .getView()
              .getProjection()
              .getCode()
              .toLowerCase();
      } else if (this.data.srss.includes('EPSG:4326')) {
        this.data.srs = 'EPSG:4326';
      } else {
        this.data.srs = this.data.srss[0];
      }
      this.data.resample_warning = this.hsAddDataCommonService.srsChanged(
        this.data.srs
      );
      this.data.layers = this.filterCapabilitiesLayers(caps.Capability.Layer);
      //Make sure every service has a title to be displayed in table
      for (const layer of this.data.layers) {
        if (layer.Title.length == 0) {
          layer.Title = layer.Name;
        }
      }

      this.hsAddDataUrlService.selectLayerByName(
        layerToSelect,
        this.data.layers,
        'Name'
      );
      this.hsAddDataUrlService.searchForChecked(this.data.layers);
      this.hsDimensionService.fillDimensionValues(caps.Capability.Layer);

      this.data.get_map_url = this.removePortIfProxified(
        caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource
      );
      this.data.image_format = getPreferredFormat(this.data.image_formats, [
        'image/png; mode=8bit',
        'image/png',
        'image/gif',
        'image/jpeg',
      ]);
      this.data.query_format = getPreferredFormat(this.data.query_formats, [
        'application/vnd.esri.wms_featureinfo_xml',
        'application/vnd.ogc.gml',
        'application/vnd.ogc.wms_xml',
        'text/plain',
        'text/html',
      ]);
      this.hsAddDataCommonService.loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  getLayerExtent(serviceLayer: any, crs: string): number[] {
    //Get called without valid serviceLayer as part of micka dataset loading pipeline
    if (!serviceLayer) {
      return;
    }
    let boundingbox = serviceLayer.BoundingBox;
    if (
      crs !== undefined &&
      serviceLayer.EX_GeographicBoundingBox !== undefined
    ) {
      boundingbox = transformExtent(
        serviceLayer.EX_GeographicBoundingBox,
        'EPSG:4326',
        this.hsMapService.getCurrentProj()
      );
    } else if (Array.isArray(boundingbox)) {
      const preferred = boundingbox.find((bboxInCrs) => {
        return bboxInCrs.crs == this.data.map_projection;
      });

      if (preferred?.extent) {
        boundingbox = preferred?.extent;
      } else {
        //NOTE: For some reason (maybe WMS 1.1.1/1.1.0) sometimes CRS:84 might hold correct order of coordinates
        boundingbox = boundingbox.filter((b) => b.crs != 'CRS:84');
        boundingbox = transformExtent(
          boundingbox[0].extent,
          boundingbox[0].crs || crs,
          this.hsMapService.getCurrentProj()
        );
      }
    } else {
      if (this.data.map_projection != serviceLayer.crs) {
        boundingbox = serviceLayer.LatLonBoundingBox;
      }
    }
    return (
      boundingbox ||
      transformExtent(
        [-180, -90, 180, 90],
        'EPSG:4326',
        this.hsMapService.getCurrentProj()
      )
    );
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
  removePortIfProxified(url: string): string {
    if (this.hsConfig.proxyPrefix === undefined) {
      return url;
    }
    const proxyPort = parseInt(
      this.hsUtilsService.getPortFromUrl(this.hsConfig.proxyPrefix)
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
  getLayers(checkedOnly: boolean, shallow = false): Layer<Source>[] {
    if (this.data.layers === undefined) {
      return;
    }
    const collection = [];
    //Limit visible layers to 10 to not freeze accidentally
    this.data.visible = checkedOnly
      ? this.data.layers.filter((l) => l.checked === true).length <= 10
      : false;
    if (this.data.base) {
      const newLayer = this.getLayer(
        {},
        {
          layerName: this.data.title.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: '',
        }
      );
      collection.push(newLayer);
    } else {
      for (const layer of this.data.layers) {
        this.getLayersRecursively(
          layer,
          {checkedOnly: checkedOnly, shallow: shallow},
          collection
        );
      }
    }
    this.data.extent = this.hsAddDataUrlService.calcAllLayersExtent(collection);
    this.data.base = false;
    this.hsAddDataUrlService.zoomToLayers(this.data);
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    if (collection.length > 0) {
      this.hsLayoutService.setMainPanel('layermanager');
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
  getLayer(layer, options: addLayerOptions): Layer<Source> {
    let attributions = [];
    if (layer.Attribution) {
      attributions = [
        `<a href="${layer.Attribution.OnlineResource}">${layer.Attribution.Title}</a>`,
      ];
    }

    let dimensions;
    if (layer.Dimension) {
      dimensions = {};
      for (const val of layer.Dimension) {
        dimensions[val.name] = val;
      }
    }

    const {styles, legends} = this.getLayerStyles(layer);
    const sourceOptions = {
      url: this.data.get_map_url,
      attributions,
      projection: this.data.srs,
      params: {
        LAYERS: this.data.base
          ? this.hsAddDataCommonService.createBasemapName(
              this.data.layers,
              'Name'
            )
          : layer.Name,
        INFO_FORMAT: layer.queryable ? options.queryFormat : undefined,
        FORMAT: options.imageFormat,
        VERSION: this.data.version,
        STYLES: styles,
        ...this.hsDimensionService.paramsFromDimensions(layer),
      },
      crossOrigin: 'anonymous',
    };
    const source: ImageWMS | TileWMS = !this.data.use_tiles
      ? new ImageWMS(sourceOptions)
      : new TileWMS(sourceOptions);
    const metadata =
      this.hsWmsGetCapabilitiesService.getMetadataObjectWithUrls(layer);
    const layerOptions = {
      title: options.layerName,
      name: options.layerName,
      source,
      minResolution: this.HsLayerUtilsService.calculateResolutionFromScale(
        layer.MinScaleDenominator
      ),
      maxResolution: this.HsLayerUtilsService.calculateResolutionFromScale(
        layer.MaxScaleDenominator
      ),
      removable: true,
      abstract: layer.Abstract,
      metadata,
      extent: this.getLayerExtent(layer, options.crs),
      path: options.path,
      dimensions: dimensions,
      legends: legends,
      subLayers: options.subLayers,
      base: this.data.base,
      visible: this.data.visible,
    };
    const new_layer = !this.data.use_tiles
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);
    this.hsMapService.proxifyLayerLoader(new_layer, this.data.use_tiles);
    return new_layer;
  }

  /**
   * Loop through the list of layers and add them to the map
   */
  addLayers(layers: Layer<Source>[]): void {
    for (const l of layers) {
      this.hsMapService.resolveDuplicateLayer(
        l,
        DuplicateHandling.RemoveOriginal
      );
      this.hsAddDataService.addLayer(l, this.data.add_under);
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
    collection: Layer<Source>[]
  ): void {
    if (!options.checkedOnly || layer.checked) {
      collection.push(
        this.getLayer(layer, {
          layerName: layer.Title.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
        })
      );
    }
    // When not shallow go full depth otherwise layer.Name has got to be missing (first queriable layer)
    const nextDepthAllowed = options.shallow ? !layer.Name : true;
    if (layer.Layer && nextDepthAllowed) {
      for (const sublayer of layer.Layer) {
        this.getLayersRecursively(
          sublayer,
          {checkedOnly: options.checkedOnly},
          collection
        );
      }
    }
  }
}
