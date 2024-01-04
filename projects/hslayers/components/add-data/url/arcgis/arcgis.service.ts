import {Injectable} from '@angular/core';

import TileGrid from 'ol/tilegrid/TileGrid';
import {Layer, Tile} from 'ol/layer';
import {Source, TileArcGISRest, XYZ} from 'ol/source';
import {Options as TileOptions} from 'ol/layer/BaseTile';
import {Tile as TileSource} from 'ol/source';
import {transformExtent} from 'ol/proj';

import {
  ArcGISResResponseLayerExtent,
  ArcGISRestResponseLayer,
} from '../types/argis-response-type';
import {CapabilitiesResponseWrapper} from 'hslayers-ng/shared/get-capabilities';
import {DuplicateHandling, HsMapService} from 'hslayers-ng/components/map';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from 'hslayers-ng/shared/get-capabilities';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUrlTypeServiceModel, Service} from '../models/url-type-service.model';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {LayerOptions} from 'hslayers-ng/common/types';
import {UrlDataObject} from '../types/data-object.type';
import {addAnchors, getPreferredFormat} from 'hslayers-ng/common/utils';

@Injectable({providedIn: 'root'})
export class HsUrlArcGisService implements HsUrlTypeServiceModel {
  data: UrlDataObject;

  hasCachedTiles = false;
  tileGrid: TileGrid;
  constructor(
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
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
    options?: LayerOptions,
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
        return this.getLayers(undefined, undefined, options);
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
      if (caps.error) {
        this.hsToastService.createToastPopupMessage(
          'ADDLAYERS.capabilitiesParsingProblem',
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ERRORMESSAGES',
            caps.error.code || '4O4',
            {url: this.data.get_map_url},
          ),
          {
            serviceCalledFrom: 'HsUrlArcGisService',
          },
        );
        this.hsAddDataCommonService.loadingInfo = false;
        return;
      }
      this.data.map_projection = this.hsMapService
        .getMap()
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      this.data.title =
        this.data.title && this.data.title != 'Arcgis layer'
          ? this.data.title
          : caps.name ||
            caps.mapName ||
            caps.documentInfo?.Title ||
            'Arcgis layer';
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
      this.data.services = caps.services?.filter((s: Service) =>
        this.isValidService(s.type),
      );

      /**
       * Prioritize cached tiles eg. ignore layer structure
       */
      this.hasCachedTiles = !!caps.tileInfo;
      this.data.layers = this.hasCachedTiles
        ? [
            {
              name: caps.mapName || caps.name,
              id: 0,
              defaultVisibility: true,
            },
          ]
        : caps.layers;
      this.hsAddDataUrlService.searchForChecked(
        this.data.layers ?? this.data.services,
      );
      this.data.srs =
        this.data.srss.find((srs) =>
          srs.includes(this.hsMapService.getCurrentProj().getCode()),
        ) || this.data.srss[0];

      this.data.extent = caps.fullExtent;
      if (this.hasCachedTiles || (caps.tileInfo && this.isImageService())) {
        /**
         * Tile grid definition in layers source srs
         * */
        this.tileGrid = new TileGrid({
          origin: Object.values(caps.tileInfo.origin),
          resolutions: caps.tileInfo.lods.map((lod) => lod.resolution),
          extent: [
            caps.fullExtent.xmin,
            caps.fullExtent.ymin,
            caps.fullExtent.xmax,
            caps.fullExtent.ymax,
          ],
        });
      }
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
   * layerOptions - used to propagate props when loading a layers from composition
   */
  async getLayers(
    checkedOnly?: boolean,
    shallow?: boolean,
    layerOptions?: LayerOptions,
  ): Promise<Layer<Source>[]> {
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
        ...layerOptions,
      }),
    ];
    if (!layerOptions?.fromComposition) {
      this.hsAddDataUrlService.zoomToLayers(this.data);
    }
    this.data.base = false;
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    if (collection.length > 0) {
      this.hsLayoutService.setMainPanel('layerManager');
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
    options: LayerOptions,
  ): Promise<Layer<Source>> {
    const attributions = [];
    const dimensions = {};
    //Not being used right now
    // const legends = [];
    const sourceParams: any = {
      /**
       * Cached tiles or image-service with cached tiles.
       * Difference is in source type that will be used to create layer.
       * image-service is currently being displayed using TileArcGISRest not XYZ
       */
      url: this.hasCachedTiles
        ? this.isImageService()
          ? this.data.get_map_url
          : this.createXYZUrl()
        : this.data.get_map_url,
      attributions,
      projection: `EPSG:${this.data.srs}`,
      params: Object.assign(
        {
          FORMAT: options.imageFormat,
        },
        {},
      ),
      crossOrigin: 'anonymous',
    };
    if (this.hasCachedTiles) {
      sourceParams.tileGrid = this.tileGrid;
    } else if (!this.hasCachedTiles && !this.isImageService()) {
      const LAYERS =
        layers.length > 0
          ? `show:${layers.map((l) => l.id).join(',')}`
          : undefined;
      Object.assign(sourceParams.params, {LAYERS});
    }
    const source = this.hasCachedTiles
      ? this.isImageService()
        ? new TileArcGISRest(sourceParams)
        : new XYZ(sourceParams)
      : new TileArcGISRest(sourceParams);
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
        ...options,
      },
      source,
    };
    if (!this.isImageService()) {
      Object.assign(layerParams.properties, {
        subLayers: layers?.map((l) => l.id).join(','),
      });
    }
    return new Tile(layerParams as TileOptions<TileSource>);
  }

  /**
   * Create XYZ layer URL
   */
  private createXYZUrl(): string {
    return `${this.data.get_map_url}/tile/{z}/{y}/{x}`;
  }

  /**
   * Calculate cumulative bounding box which encloses all the checked layers (ArcGISRestResponseLayer)
   */
  async calcAllLayersExtent(
    layers: ArcGISRestResponseLayer[],
    options: LayerOptions,
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
    /**
      There are cases when loaded services are loaded from folders,
      problem is that folder name is also included inside the service.name
      to avoid any uncertainties,lets remove everything starting from 'services'
      inside the url and rebuild it
    */
    if (urlRest.includes('services')) {
      urlRest = urlRest.slice(0, urlRest.indexOf('services'));
    }
    this.data.get_map_url =
      urlRest.replace(/\/?$/, '/') + //add slash if not already there
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
   * Check validity of service
   */
  isValidService(str: string): boolean {
    return !['gpserver', 'sceneserver'].includes(str.toLowerCase());
  }
  /**
   * Transforms provided extent to a map projection
   */
  private transformLayerExtent(
    extent: ArcGISResResponseLayerExtent,
    data: UrlDataObject,
  ): number[] {
    return transformExtent(
      [extent.xmin, extent.ymin, extent.xmax, extent.ymax],
      'EPSG:' + data.srs,
      data.map_projection,
    );
  }
}
