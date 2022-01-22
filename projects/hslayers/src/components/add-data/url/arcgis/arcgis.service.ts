import {Injectable} from '@angular/core';

import ImageLayer from 'ol/layer/Image';
import ImageSource from 'ol/source/Image';
import TileSource from 'ol/source/Tile';
import {ImageArcGISRest, Source, TileArcGISRest} from 'ol/source';
import {Options as ImageOptions} from 'ol/layer/BaseImage';
import {Layer} from 'ol/layer';
import {Tile} from 'ol/layer';
import {Options as TileOptions} from 'ol/layer/BaseTile';
import {transformExtent} from 'ol/proj';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsToastService} from '../../../../components/layout/toast/toast.service';
import {HsUrlTypeServiceModel, Service} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {addLayerOptions} from '../types/layer-options.type';
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
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsToastService: HsToastService
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
      await this.createLayer(wrapper.response);
      if (this.hsAddDataCommonService.layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(this.data.layers);
        return this.addLayers();
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
        caps.documentInfo?.Title || caps.mapName || caps.name || 'Arcgis layer';
      this.data.description = addAnchors(caps.description);
      this.data.version = caps.currentVersion;
      this.data.image_formats = caps.supportedImageFormatTypes
        ? caps.supportedImageFormatTypes.split(',')
        : [];
      this.data.query_formats = caps.supportedQueryFormats
        ? caps.supportedQueryFormats.split(',')
        : [];
      this.data.srss = caps.spatialReference?.latestWkid
        ? [caps.spatialReference.latestWkid.toString()]
        : [];
      this.data.services = caps.services?.filter(
        (s: Service) => !this.isGpService(s.type)
      );
      this.data.layers = caps.layers;
      this.hsAddDataUrlService.searchForChecked(
        this.data.layers ?? this.data.services
      );
      this.data.srs = (() => {
        for (const srs of this.data.srss) {
          if (srs.includes('3857')) {
            return srs;
          }
        }
        return this.data.srss[0];
      })();
      this.data.extent = caps.fullExtent;
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
   * Second step in adding layers to the map. Lops through the list of layers and calls addLayer.
   */
  addLayers(): Layer<Source>[] {
    if (
      this.data.layers === undefined &&
      this.data.services === undefined &&
      !this.isImageService()
    ) {
      return;
    }
    const checkedLayers = this.data.layers?.filter((l) => l.checked);
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
    //Not being used right now
    // const legends = [];
    const sourceParams = {
      url: this.data.get_map_url,
      attributions,
      //projection: me.data.srs,
      params: Object.assign(
        {
          FORMAT: options.imageFormat,
        },
        {}
      ),
      crossOrigin: 'anonymous',
    };
    if (!this.isImageService()) {
      const LAYERS =
        layers.length > 0
          ? `show:${layers.map((l) => l.id).join(',')}`
          : undefined;
      Object.assign(sourceParams.params, {LAYERS});
    }
    const source = this.data.use_tiles
      ? new TileArcGISRest(sourceParams)
      : new ImageArcGISRest(sourceParams);

    let mapExtent;
    try {
      mapExtent = transformExtent(
        [
          this.data.extent.xmin,
          this.data.extent.ymin,
          this.data.extent.xmax,
          this.data.extent.ymax,
        ],
        'EPSG:' + this.data.srs,
        this.data.map_projection
      );
    } catch (error) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.capabilitiesParsingProblem',
        'ADDLAYERS.OlDoesNotRecognizeProjection',
        {
          serviceCalledFrom: 'HsUrlArcGisService',
          details: [`${options.layerTitle}`, `EPSG: ${this.data.srs}`],
        }
      );
    }

    const layerParams = {
      properties: {
        title: options.layerTitle,
        name: options.layerTitle,
        removable: true,
        path: options.path,
        base: this.data.base,
        extent: mapExtent,
        dimensions,
      },
      source,
    };
    if (!this.isImageService()) {
      Object.assign(layerParams.properties, {
        subLayers: layers?.map((l) => l.id).join(','),
      });
    }
    const new_layer = this.data.use_tiles
      ? new Tile(layerParams as TileOptions<TileSource>)
      : new ImageLayer(layerParams as ImageOptions<ImageSource>);
    //OlMap.proxifyLayerLoader(new_layer, me.data.use_tiles);
    this.hsMapService.map.addLayer(new_layer);
    return new_layer;
  }

  /**
   * Request services layers
   * @param service - Service URL
   */
  async expandService(service: Service): Promise<void> {
    let urlRest = this.hsAddDataCommonService.url.toLowerCase();
    //There are cases when loaded services are loaded from folders, problem is that folder name is also included inside the service.name
    //to avoid any uncertainties, lets remove everything starting from 'services' inside the url and rebuild it
    if (urlRest.includes('services')) {
      urlRest = urlRest.slice(0, urlRest.indexOf('services'));
    }
    this.data.get_map_url =
      (urlRest.endsWith('/') ? urlRest : urlRest.concat('/')) +
      ['services', service.name, service.type].join('/');
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(
      this.data.get_map_url
    );
    await this.listLayerFromCapabilities(wrapper);
  }

  async addServices(services: Service[]): Promise<void> {
    const originalRestUrl = this.hsAddDataCommonService.url;
    for (const service of services.filter((s) => s.checked)) {
      this.hsAddDataCommonService.url = originalRestUrl; //Because addLayers clears all params
      await this.expandService(service);
      this.addLayers();
    }
  }

  isImageService(): boolean {
    return this.data.get_map_url.toLowerCase().includes('imageserver');
  }

  isGpService(str: string): boolean {
    return str.toLowerCase().includes('gpserver');
  }
}
