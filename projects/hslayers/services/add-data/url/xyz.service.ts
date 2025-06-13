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
    options?: LayerOptions,
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
    return [this.getLayer(layerOptions)];
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
      projection: 'EPSG:3857', // Default projection for XYZ
      minZoom: this.data.minZoom || 0,
      maxZoom: this.data.maxZoom || 18,
      tileSize: [256, 256], // Standard tile size
      wrapX: true, // Wrap the world horizontally
    };

    const source = new XYZ(sourceOptions);

    const layerOptions: TileOptions<XYZ> = {
      source,
      opacity: 1,
      visible: this.data.visible,
      minZoom: this.data.minZoom || 0,
      maxZoom: this.data.maxZoom || 18,
    };

    const new_layer = new Tile(layerOptions);

    // Set additional properties for HSLayers
    new_layer.set('title', this.data.title);
    new_layer.set('name', this.data.title);
    new_layer.set('removable', true);
    new_layer.set('abstract', this.data.description);
    new_layer.set('path', this.data.folder_name);
    new_layer.set('base', this.data.base);

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
