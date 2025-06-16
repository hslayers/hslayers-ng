import {Injectable} from '@angular/core';
import {Layer, Tile} from 'ol/layer';
import {Source, XYZ} from 'ol/source';
import {Options as TileOptions} from 'ol/layer/BaseTile';

import {
  CapabilitiesResponseWrapper,
  HsUrlTypeServiceModel,
  LayerOptions,
  UrlDataObject,
} from 'hslayers-ng/types';
import {DuplicateHandling, HsMapService} from 'hslayers-ng/services/map';
import {HsAddDataCommonService} from '../common.service';
import {HsAddDataService} from '../add-data.service';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';

@Injectable({providedIn: 'root'})
export class HsUrlXyzService implements HsUrlTypeServiceModel {
  data: UrlDataObject;

  constructor(
    private hsMapService: HsMapService,
    private hsLayoutService: HsLayoutService,
    private hsAddDataService: HsAddDataService,
    private hsEventBusService: HsEventBusService,
    private hsAddDataCommonService: HsAddDataCommonService,
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
   * Mock capabilities response for XYZ service
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    layerOptions?: LayerOptions,
  ): Promise<Layer<Source>[]> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }

    setTimeout(() => {
      this.hsAddDataCommonService.loadingInfo = false;
    }, 750);
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response.message);
      return;
    }

    if (this.hsAddDataCommonService.layerToSelect) {
      const collection = this.getLayers(true, false, layerOptions);
      return collection;
    }

    return undefined;
  }

  /**
   * Get layers based on checked state
   */
  getLayers(
    checkedOnly: boolean,
    shallow?: boolean,
    layerOptions?: LayerOptions,
  ): Layer<Source>[] {
    const layer = this.getLayer(layerOptions);
    this.finalizeLayerRetrieval([layer], layerOptions);
    return [layer];
  }

  /**
   * Loop through the list of layers and add them to the map
   */
  addLayers(layers: Layer<Source>[]): void {
    for (const l of layers) {
      this.hsMapService.resolveDuplicateLayer(
        l,
        DuplicateHandling.RemoveOriginal,
      );
      this.hsAddDataService.addLayer(l, this.data.add_under);
    }
  }
  /**
   * Sets data object to default
   */
  setDataToDefault(): void {
    this.data = {
      add_under: null,
      map_projection: 'EPSG:3857',
      visible: true,
      useTiles: true,
      apiKey: '',
      useApiKey: false,
      apiKeyParam: 'apikey',
      get_map_url: '',
      title: 'XYZ Layer',
      description: '',
      table: {
        trackBy: 'Name',
        nameProperty: 'Title',
      },
      minZoom: 0, // OpenLayers default
      maxZoom: 18, // Reasonable default for most XYZ services
    };
  }

  /**
   * Get layer with XYZ source
   */
  getLayer(options: LayerOptions): Layer<Source> {
    // URL should already be validated by HsXyzGetCapabilitiesService
    // but add a basic check as fallback
    if (!this.data.get_map_url) {
      console.error('No XYZ URL provided');
      throw new Error('No XYZ URL provided');
    }

    const title = options?.title || this.data.title;

    // Prepare the URL with API key if needed
    let tileUrl = this.data.get_map_url;
    if (this.data.useApiKey && this.data.apiKey && this.data.apiKeyParam) {
      const separator = tileUrl.includes('?') ? '&' : '?';
      tileUrl = `${tileUrl}${separator}${this.data.apiKeyParam}=${encodeURIComponent(this.data.apiKey)}`;
    }

    // Create source options based on official OpenLayers documentation
    const sourceOptions: any = {
      url: tileUrl,
      crossOrigin: 'anonymous',
      projection: 'EPSG:3857',
      minZoom: this.data.minZoom || 0,
      maxZoom: this.data.maxZoom || 18,
      tileSize: [256, 256], // Standard tile size
      wrapX: true,
    };

    const source = new XYZ(sourceOptions);

    const layerOptions: TileOptions<XYZ> = {
      source,
      opacity: options?.opacity ?? 1,
      visible: this.data.visible,
      //Composition doesn't have minZoom and maxZoom, so we use resolution instead
      minZoom: options?.minResolution || this.data.minZoom || 0,
      maxZoom: options?.maxResolution || this.data.maxZoom || 18,
      className: options?.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
      properties: {
        ...options,
        title: title,
        name: title,
        removable: true,
        abstract: this.data.description,
        path: options?.path || this.data.folder_name,
        base: options?.base || this.data.base,
      },
    };

    const new_layer = new Tile(layerOptions);

    return new_layer;
  }

  /**
   * Finalize layer retrieval
   */
  finalizeLayerRetrieval(
    collection: Layer<Source>[],
    layerOptions?: LayerOptions,
  ) {
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    this.hsLayoutService.setMainPanel('layerManager');
  }
}
