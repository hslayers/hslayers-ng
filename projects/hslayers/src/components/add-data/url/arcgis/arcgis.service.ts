import {Injectable} from '@angular/core';

import {ImageArcGISRest, Source, TileArcGISRest} from 'ol/source';
import {Image as ImageLayer} from 'ol/layer';
import {Options as ImageOptions} from 'ol/layer/BaseImage';
import {Image as ImageSource} from 'ol/source';
import {Layer} from 'ol/layer';
import {Tile} from 'ol/layer';
import {Options as TileOptions} from 'ol/layer/BaseTile';
import {Tile as TileSource} from 'ol/source';
import {transformExtent} from 'ol/proj';

import {
  ArcGISResResponseLayerExtent,
  ArcGISRestResponseLayer,
} from '../types/argis-response-type';
import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {DuplicateHandling, HsMapService} from '../../../map/map.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsToastService} from '../../../../components/layout/toast/toast.service';
import {HsUrlTypeServiceModel, Service} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {getPreferredFormat} from '../../../../common/format-utils';
import {layerOptions} from '../../../../components/compositions/layer-parser/composition-layer-params.type';
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
    public hsToastService: HsToastService,
  ) {
    this.setDataToDefault();
  }

  /**
   * Sets data to default values
   */
  setDataToDefault() {
    this.data = {
      serviceExpanded: false,
      map_projection: '',
      register_metadata: true,
      tile_size: 512,
      use_resampling: false,
      use_tiles: true,
      table: {
        trackBy: 'id',
        nameProperty: 'name',
      },
    };
  }

  /**
   * List and return layers from Arcgis getCapabilities response
   * @param wrapper - Capabilities response wrapper
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
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
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.data.layers,
          'arcgis',
        );
        return this.getLayers();
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }
  /**
   * Parse information received in Arcgis getCapabilities response
   * @param response - getCapabilities response
   */
  async createLayer(response): Promise<void> {
    try {
      const caps = response;
      this.data.map_projection = this.hsMapService
        .getMap()
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
        (s: Service) => !this.isGpService(s.type),
      );
      this.data.layers = caps.layers;
      this.hsAddDataUrlService.searchForChecked(
        this.data.layers ?? this.data.services,
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
        this.data.srs,
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
   * Loop through the list of layers and call getLayer
   */
  async getLayers(): Promise<Layer<Source>[]> {
    if (
      this.data.layers === undefined &&
      this.data.services === undefined &&
      !this.isImageService()
    ) {
      return;
    }
    const checkedLayers = this.data.layers?.filter((l) => l.checked);
    const collection = [
      await this.getLayer(checkedLayers, {
        title: this.data.title.replace(/\//g, '&#47;'),
        path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
        imageFormat: this.data.image_format,
        queryFormat: this.data.query_format,
        tileSize: this.data.tile_size,
        crs: this.data.srs,
        base: this.data.base,
      }),
    ];
    this.hsAddDataUrlService.zoomToLayers(this.data);
    this.data.base = false;
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
   * @param layerTitle - layer name in the map
   * @param path - Path name
   * @param imageFormat - Format in which to serve image. Usually: image/png
   * @param queryFormat - See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param tileSize - Tile size in pixels
   * @param crs - of the layer
   * @param subLayers - Static sub-layers of the layer
   */
  async getLayer(
    layers: ArcGISRestResponseLayer[],
    options: layerOptions,
  ): Promise<Layer<Source>> {
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
        {},
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

    /**
     * Use provided extent when displaying more than 3 layers
     * calculate extent otherwise
     */
    this.data.extent =
      layers.length > 3
        ? this.transformLayerExtent(this.data.extent, this.data)
        : await this.calcAllLayersExtent(layers, options);

    const layerParams = {
      properties: {
        title: options.title,
        name: options.title,
        removable: true,
        path: options.path,
        base: this.data.base,
        extent: this.data.extent,
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
    return new_layer;
  }

  /**
   * Calculate cumulative bounding box which encloses all the checked layers (ArcGISRestResponseLayer)
   */
  async calcAllLayersExtent(
    layers: ArcGISRestResponseLayer[],
    options: layerOptions,
  ) {
    try {
      const layersCaps = await Promise.all(
        layers.map(async (l) => {
          return await this.hsArcgisGetCapabilitiesService.request(
            `${this.data.get_map_url}/${l.id}`,
          );
        }),
      );
      const layersExtents = layersCaps
        .map((l) => {
          if (
            Object.values(l.response.extent).filter((v: any) => !isNaN(v))
              .length > 0
          ) {
            return this.transformLayerExtent(l.response.extent, this.data);
          }
        })
        .filter((v) => v);
      return this.hsAddDataUrlService.calcCombinedExtent(layersExtents);
    } catch (error) {
      if (error.message.includes('getCode')) {
        this.hsToastService.createToastPopupMessage(
          'ADDLAYERS.capabilitiesParsingProblem',
          'ADDLAYERS.OlDoesNotRecognizeProjection',
          {
            serviceCalledFrom: 'HsUrlArcGisService',
            details: [`${options.title}`, `EPSG: ${this.data.srs}`],
          },
        );
      } else {
        this.hsToastService.createToastPopupMessage(
          'ADDLAYERS.capabilitiesParsingProblem',
          'ADDLAYERS.layerExtentParsingProblem',
          {
            serviceCalledFrom: 'HsUrlArcGisService',
            toastStyleClasses: 'bg-warning text-white',
          },
        );
        return this.transformLayerExtent(this.data.extent, this.data);
      }
    }
  }

  /**
   * Loop through the list of layers and add them to the map
   * @param layers - Layers selected
   */
  addLayers(layers: Layer<Source>[]): void {
    for (const l of layers) {
      this.hsMapService.addLayer(l, DuplicateHandling.RemoveOriginal);
    }
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
      this.data.get_map_url,
    );
    this.data.serviceExpanded = true;
    await this.listLayerFromCapabilities(wrapper);
  }

  /**
   * Step back to the top layer of capabilities
   */
  async collapseServices() {
    this.data.get_map_url = this.hsAddDataCommonService.url.toLowerCase();
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(
      this.data.get_map_url,
    );
    this.data.serviceExpanded = false;
    await this.listLayerFromCapabilities(wrapper);
  }

  /**
   * Add services layers
   * @param services - Services selected
   */
  async addServices(services: Service[]): Promise<void> {
    const originalRestUrl = this.hsAddDataCommonService.url;
    for (const service of services.filter((s) => s.checked)) {
      this.hsAddDataCommonService.url = originalRestUrl; //Because getLayers clears all params
      await this.expandService(service);
      const layers = await this.getLayers();
      this.addLayers(layers);
    }
  }
  /**
   * Check if getCapabilities response is Image service layer
   */
  isImageService(): boolean {
    return this.data.get_map_url?.toLowerCase().includes('imageserver');
  }
  /**
   * Check if getCapabilities response is Gp service layer
   */
  isGpService(str: string): boolean {
    return str.toLowerCase().includes('gpserver');
  }
  /**
   * Transforms provided extent to a map projection
   */
  private transformLayerExtent(
    extent: ArcGISResResponseLayerExtent,
    data: urlDataObject,
  ): number[] {
    return transformExtent(
      [extent.xmin, extent.ymin, extent.xmax, extent.ymax],
      'EPSG:' + data.srs,
      data.map_projection,
    );
  }
}
