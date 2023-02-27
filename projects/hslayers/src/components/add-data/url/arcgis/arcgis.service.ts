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

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {DuplicateHandling, HsMapService} from '../../../map/map.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsToastService} from '../../../../components/layout/toast/toast.service';
import {HsUrlTypeServiceModel, Service} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {addLayerOptions} from '../types/layer-options.type';
import {getPreferredFormat} from '../../../../common/format-utils';
import {urlDataObject} from '../types/data-object.type';

class HsUrlArcGisParams {
  data: urlDataObject;

  constructor() {
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
}

@Injectable({providedIn: 'root'})
export class HsUrlArcGisService implements HsUrlTypeServiceModel {
  apps: {
    [id: string]: any;
  } = {default: new HsUrlArcGisParams()};

  constructor(
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsToastService: HsToastService
  ) {}

  get(app: string): HsUrlArcGisParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsUrlArcGisParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * List and return layers from Arcgis getCapabilities response
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
      await this.createLayer(wrapper.response, app);
      if (this.hsAddDataCommonService.get(app).layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.get(app).data.layers,
          'arcgis',
          app
        );
        return this.getLayers(app);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e, app);
    }
  }
  /**
   * Parse information received in Arcgis getCapabilities response
   * @param response - getCapabilities response
   */
  async createLayer(response, app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      const caps = response;
      appRef.data.map_projection = this.hsMapService
        .getMap(app)
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      appRef.data.title =
        caps.documentInfo?.Title || caps.mapName || caps.name || 'Arcgis layer';
      appRef.data.description = addAnchors(caps.description);
      appRef.data.version = caps.currentVersion;
      appRef.data.image_formats = caps.supportedImageFormatTypes
        ? caps.supportedImageFormatTypes.split(',')
        : [];
      appRef.data.query_formats = caps.supportedQueryFormats
        ? caps.supportedQueryFormats.split(',')
        : [];
      appRef.data.srss = caps.spatialReference?.latestWkid
        ? [caps.spatialReference.latestWkid.toString()]
        : [];
      appRef.data.services = caps.services?.filter(
        (s: Service) => !this.isGpService(s.type)
      );
      appRef.data.layers = caps.layers;
      this.hsAddDataUrlService.searchForChecked(
        appRef.data.layers ?? appRef.data.services,
        app
      );
      appRef.data.srs = (() => {
        for (const srs of appRef.data.srss) {
          if (srs.includes('3857')) {
            return srs;
          }
        }
        return appRef.data.srss[0];
      })();
      appRef.data.extent = caps.fullExtent;
      appRef.data.resample_warning = this.hsAddDataCommonService.srsChanged(
        appRef.data.srs,
        app
      );
      appRef.data.image_format = getPreferredFormat(appRef.data.image_formats, [
        'PNG32',
        'PNG',
        'GIF',
        'JPG',
      ]);
      appRef.data.query_format = getPreferredFormat(appRef.data.query_formats, [
        'geoJSON',
        'JSON',
      ]);
      this.hsAddDataCommonService.get(app).loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Loop through the list of layers and call getLayer
   */
  getLayers(app: string): Layer<Source>[] {
    const appRef = this.get(app);

    if (
      appRef.data.layers === undefined &&
      appRef.data.services === undefined &&
      !this.isImageService(app)
    ) {
      return;
    }
    const checkedLayers = appRef.data.layers?.filter((l) => l.checked);
    const collection = [
      this.getLayer(
        checkedLayers,
        {
          layerTitle: appRef.data.title.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(
            appRef.data.folder_name
          ),
          imageFormat: appRef.data.image_format,
          queryFormat: appRef.data.query_format,
          tileSize: appRef.data.tile_size,
          crs: appRef.data.srs,
          base: appRef.data.base,
        },
        app
      ),
    ];

    appRef.data.base = false;
    this.hsAddDataCommonService.clearParams(app);
    this.apps[app] = new HsUrlArcGisParams();
    this.hsAddDataCommonService.setPanelToCatalogue(app);
    if (collection.length > 0) {
      this.hsLayoutService.setMainPanel('layermanager', app);
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
  getLayer(
    layers: {
      defaultVisibility?: boolean; //FIXME: unused
      geometryType: string; //FIXME: unused
      id: number;
      maxScale: number; //FIXME: unused
      minScale: number; //FIXME: unused
      name: string; //FIXME: unused
      parentLayerId: number; //FIXME: unused
      subLayerIds: number[]; //FIXME: unused
      type: string; //FIXME: unused
    }[],
    options: addLayerOptions,
    app: string
  ): Layer<Source> {
    const appRef = this.get(app);
    const attributions = [];
    const dimensions = {};
    //Not being used right now
    // const legends = [];
    const sourceParams = {
      url: appRef.data.get_map_url,
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
    if (!this.isImageService(app)) {
      const LAYERS =
        layers.length > 0
          ? `show:${layers.map((l) => l.id).join(',')}`
          : undefined;
      Object.assign(sourceParams.params, {LAYERS});
    }
    const source = appRef.data.use_tiles
      ? new TileArcGISRest(sourceParams)
      : new ImageArcGISRest(sourceParams);

    let mapExtent;
    try {
      mapExtent = transformExtent(
        [
          appRef.data.extent.xmin,
          appRef.data.extent.ymin,
          appRef.data.extent.xmax,
          appRef.data.extent.ymax,
        ],
        'EPSG:' + appRef.data.srs,
        appRef.data.map_projection
      );
    } catch (error) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.capabilitiesParsingProblem',
        'ADDLAYERS.OlDoesNotRecognizeProjection',
        {
          serviceCalledFrom: 'HsUrlArcGisService',
          details: [`${options.layerTitle}`, `EPSG: ${appRef.data.srs}`],
        },
        app
      );
    }

    const layerParams = {
      properties: {
        title: options.layerTitle,
        name: options.layerTitle,
        removable: true,
        path: options.path,
        base: appRef.data.base,
        extent: mapExtent,
        dimensions,
      },
      source,
    };
    if (!this.isImageService(app)) {
      Object.assign(layerParams.properties, {
        subLayers: layers?.map((l) => l.id).join(','),
      });
    }
    const new_layer = appRef.data.use_tiles
      ? new Tile(layerParams as TileOptions<TileSource>)
      : new ImageLayer(layerParams as ImageOptions<ImageSource>);
    //OlMap.proxifyLayerLoader(new_layer, me.data.use_tiles);
    return new_layer;
  }

  /**
   * Loop through the list of layers and add them to the map
   * @param layers - Layers selected
   */
  addLayers(layers: Layer<Source>[], app: string): void {
    for (const l of layers) {
      this.hsMapService.addLayer(l, app, DuplicateHandling.RemoveOriginal);
    }
  }

  /**
   * Request services layers
   * @param service - Service URL
   */
  async expandService(service: Service, app: string): Promise<void> {
    const appRef = this.get(app);
    let urlRest = this.hsAddDataCommonService.get(app).url.toLowerCase();
    //There are cases when loaded services are loaded from folders, problem is that folder name is also included inside the service.name
    //to avoid any uncertainties, lets remove everything starting from 'services' inside the url and rebuild it
    if (urlRest.includes('services')) {
      urlRest = urlRest.slice(0, urlRest.indexOf('services'));
    }
    appRef.data.get_map_url =
      (urlRest.endsWith('/') ? urlRest : urlRest.concat('/')) +
      ['services', service.name, service.type].join('/');
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(
      appRef.data.get_map_url,
      app
    );
    appRef.data.serviceExpanded = true;
    await this.listLayerFromCapabilities(wrapper, app);
  }

  /**
   * Step back to the top layer of capabilities
   */
  async collapseServices(app: string) {
    const appRef = this.get(app);
    appRef.data.get_map_url = this.hsAddDataCommonService
      .get(app)
      .url.toLowerCase();
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(
      appRef.data.get_map_url,
      app
    );
    appRef.data.serviceExpanded = false;
    await this.listLayerFromCapabilities(wrapper, app);
  }

  /**
   * Add services layers
   * @param services - Services selected
   */
  async addServices(services: Service[], app: string): Promise<void> {
    const originalRestUrl = this.hsAddDataCommonService.get(app).url;
    for (const service of services.filter((s) => s.checked)) {
      this.hsAddDataCommonService.get(app).url = originalRestUrl; //Because getLayers clears all params
      await this.expandService(service, app);
      const layers = this.getLayers(app);
      this.addLayers(layers, app);
    }
  }
  /**
   * Check if getCapabilities response is Image service layer
   */
  isImageService(app: string): boolean {
    return this.get(app)
      .data.get_map_url?.toLowerCase()
      .includes('imageserver');
  }
  /**
   * Check if getCapabilities response is Gp service layer
   */
  isGpService(str: string): boolean {
    return str.toLowerCase().includes('gpserver');
  }
}
