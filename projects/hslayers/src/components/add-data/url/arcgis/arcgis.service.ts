import {Injectable} from '@angular/core';

import ImageLayer from 'ol/layer/Image';
import ImageSource from 'ol/source/Image';
import TileSource from 'ol/source/Tile';
import {ImageArcGISRest, Source, TileArcGISRest} from 'ol/source';
import {Options as ImageOptions} from 'ol/layer/BaseImage';
import {Layer} from 'ol/layer';
import {Tile} from 'ol/layer';
import {Options as TileOptions} from 'ol/layer/BaseTile';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {getPreferredFormat} from '../../../../common/format-utils';
import {urlDataObject} from '../types/data-object.type';

@Injectable({providedIn: 'root'})
export class HsUrlArcGisService implements HsUrlTypeServiceModel {
  data: urlDataObject;

  constructor(
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsLayerUtilsService: HsLayerUtilsService
  ) {
    this.setDataToDefault();
  }

  setDataToDefault(): void {
    this.data = {
      map_projection: '',
      register_metadata: true,
      tile_size: 512,
      use_resampling: false,
      use_tiles: true,
    };
  }

  async addLayerFromCapabilities(
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
      await this.createLayer(wrapper.response);
      if (this.hsAddDataCommonService.layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(this.data.services);
        return this.addLayers(true);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }

  async createLayer(response): Promise<void> {
    try {
      const caps = response;
      this.data.map_projection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      this.data.title =
        caps.documentInfo.Title || caps.mapName || 'Arcgis layer';
      this.data.description = addAnchors(caps.description);
      this.data.version = caps.currentVersion;
      this.data.image_formats = caps.supportedImageFormatTypes
        ? caps.supportedImageFormatTypes.split(',')
        : [];
      this.data.query_formats = caps.supportedQueryFormats
        ? caps.supportedQueryFormats.split(',')
        : [];
      this.data.srss = caps.spatialReference?.wkid
        ? [caps.spatialReference.wkid.toString()]
        : [];
      this.data.services = caps.layers || caps.services;
      this.data.srs = (() => {
        for (const srs of this.data.srss) {
          if (srs.includes('3857')) {
            return srs;
          }
        }
        return this.data.srss[0];
      })();
      this.data.resample_warning = this.hsAddDataCommonService.srsChanged(
        this.data.srs
      );
      this.data.image_format = getPreferredFormat(this.data.image_formats, [
        'PNG32',
        'PNG',
        'GIF',
        'JPG',
      ]);
      this.data.query_format = getPreferredFormat(this.data.query_formats, [
        'geoJSON',
        'JSON',
      ]);
      this.hsAddDataCommonService.loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * @param checkedOnly -
   * Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param checked - Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean): Layer<Source>[] {
    if (this.data.services === undefined) {
      return;
    }

    const checkedLayers = this.data.services.filter((l) => l.checked);
    const collection = [
      this.addLayer(checkedLayers, {
        layerTitle: this.data.title.replace(/\//g, '&#47;'),
        path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
        imageFormat: this.data.image_format,
        queryFormat: this.data.query_format,
        tileSize: this.data.tile_size,
        crs: this.data.srs,
        base: this.data.base,
      }),
    ];

    this.data.base = false;
    this.hsLayoutService.setMainPanel('layermanager');
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    return collection;
  }

  /**
   * Add selected layer to map
   * @param layer - capabilities layer object
   * @param layerTitle - layer name in the map
   * @param path - Path name
   * @param imageFormat - Format in which to serve image. Usually: image/png
   * @param queryFormat - See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param tileSize - Tile size in pixels
   * @param crs - of the layer
   * @param subLayers - Static sub-layers of the layer
   */
  addLayer(
    layers: {
      defaultVisibility?: boolean;
      geometryType: string;
      id: number;
      maxScale: number;
      minScale: number;
      name: string;
      parentLayerId: number;
      subLayerIds: number[];
      type: string;
    }[],
    options: addLayerOptions
  ): Layer<Source> {
    const attributions = [];
    const dimensions = {};
    const legends = [];
    const LAYERS =
      layers.length > 0
        ? `show:${layers.map((l) => l.id).join(',')}`
        : undefined;
    const sourceParams = {
      url: this.data.get_map_url,
      attributions,
      //projection: me.data.srs,
      params: Object.assign(
        {
          LAYERS,
          FORMAT: options.imageFormat,
        },
        {}
      ),
      crossOrigin: 'anonymous',
    };
    const source = this.data.use_tiles
      ? new TileArcGISRest(sourceParams)
      : new ImageArcGISRest(sourceParams);
    const layerParams = {
      properties: {
        title: options.layerTitle,
        name: options.layerTitle,
        removable: true,
        path: options.path,
        base: this.data.base,
        dimensions,
      },
      source,
    };
    const new_layer = this.data.use_tiles
      ? new Tile(layerParams as TileOptions<TileSource>)
      : new ImageLayer(layerParams as ImageOptions<ImageSource>);
    //OlMap.proxifyLayerLoader(new_layer, me.data.use_tiles);
    this.hsMapService.map.addLayer(new_layer);
    return new_layer;
  }

  addLayersRecursively(
    layer: any,
    options: addLayersRecursivelyOptions,
    collection: Layer<Source>[]
  ): void {
    //Not needed yet, but interface has it
  }
}
