import {Injectable} from '@angular/core';

import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import {Extent} from 'ol/extent';
import {Layer, Tile} from 'ol/layer';
import {Source} from 'ol/source';
import {WMTSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

import {CapabilitiesResponseWrapper} from 'hslayers-ng/types';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';

import {HsAddDataCommonService} from '../common.service';
import {HsAddDataUrlService} from './add-data-url.service';

import {AddLayersRecursivelyOptions} from 'hslayers-ng/types';
import {HsUrlTypeServiceModel} from 'hslayers-ng/types';
import {LayerOptions} from 'hslayers-ng/types';
import {UrlDataObject} from 'hslayers-ng/types';
import {addAnchors} from 'hslayers-ng/common/utils';

@Injectable({providedIn: 'root'})
export class HsUrlWmtsService implements HsUrlTypeServiceModel {
  data: UrlDataObject;

  constructor(
    public hsMapService: HsMapService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService,
  ) {
    this.setDataToDefault();
  }

  setDataToDefault(): void {
    this.data = {
      add_all: null,
      caps: null,
      description: '',
      image_format: '',
      services: [],
      layers: [],
      title: '',
      version: '',
      table: {
        trackBy: 'Identifier',
        nameProperty: 'Title',
      },
    };
  }
  /**
   * List and return layers from WMTS getCapabilities response
   * @param wrapper - Capabilities response wrapper
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    options?: LayerOptions,
  ): Promise<Layer<Source>[]> {
    const response = wrapper.response;
    const error = wrapper.error;
    if (!response && !error) {
      return;
    }
    if (error) {
      this.hsAddDataCommonService.throwParsingError(response.message);
      return;
    }
    try {
      //TODO AWAIT and add-layer if layerToSelect
      await this.capabilitiesReceived(response);
      if (this.hsAddDataCommonService.layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.data.layers,
          'wmts',
        );
        return this.getLayers(true, false, options);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }

  /**
   * Parse information received in WMTS getCapabilities response
   * @param response - Url of requested service
   */
  async capabilitiesReceived(response: string): Promise<any> {
    try {
      const parser = new WMTSCapabilities();
      const caps = parser.read(response);
      this.data.caps = caps;
      this.data.title = caps.ServiceIdentification.Title || 'WMTS layer';

      this.data.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.data.version = caps.Version || caps.version;
      this.data.layers = caps.Contents.Layer;
      this.hsAddDataCommonService.loadingInfo = false;
      return this.data.title;
    } catch (e) {
      throw new Error(e);
    }
  }
  /**
   * Loop through the list of layers and call getLayer recursively
   * @param layer - Layer selected
   * @param collection - Layers created and retrieved collection
   */
  getLayersRecursively(
    layer,
    options: AddLayersRecursivelyOptions,
    collection,
  ): void {
    if (!this.data.add_all || layer.checked) {
      collection.push(this.getLayer(layer, options.layerOptions));
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.getLayersRecursively(sublayer, options, collection);
      }
    }
  }

  /**
   * Loop through the list of layers and add them to the map
   */
  addLayers(layers: Layer<Source>[]): void {
    for (const l of layers) {
      this.hsMapService.addLayer(l);
    }
  }

  /**
   * Loop through the list of layers and call getLayer.
   * @param checkedOnly - Add all available layers or only checked ones. checkedOnly=false=all
   * @param layerOptions - Optional layer parameters. Used to parse composition layers
   */
  getLayers(
    checkedOnly: boolean,
    shallow?: boolean,
    layerOptions?: LayerOptions,
  ): Layer<Source>[] {
    this.data.add_all = checkedOnly;
    const collection = [];
    for (const layer of this.data.layers) {
      this.getLayersRecursively(layer, {layerOptions}, collection);
    }
    this.data.extent = this.hsAddDataUrlService.calcAllLayersExtent(collection);
    if (!layerOptions?.fromComposition) {
      this.hsAddDataUrlService.zoomToLayers(this.data);
    }
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    if (collection.length > 0) {
      this.hsLayoutService.setMainPanel('layerManager');
    }
    return collection;
    //FIX ME: to implement
    // this.zoomToLayers();
  }

  /**
   * Return preferred tile format
   * @param formats - Set of available formats for layer being added
   */
  getPreferredFormat(formats: any): string {
    const preferred = formats.find((format) => format.includes('png'));
    return preferred ? preferred : formats[0];
  }

  /**
   * Return preferred tile tileMatrixSet
   * Looks for the occurrence of supported CRS's, if possible picks CRS of current view
   * otherwise returns 3857 as trial(some services support 3857 matrix set even though its not clear from capabilities )
   * @param sets - Set of available matrixSets
   */
  getPreferredMatrixSet(sets): string {
    const supportedFormats = ['3857', '4326', '5514'];
    const preferred = sets.filter((set) =>
      supportedFormats.some((v) => set.TileMatrixSet.includes(v)),
    );
    if (preferred.length != 0) {
      const preferCurrent = preferred.find((set) =>
        set.TileMatrixSet.includes(
          this.hsMapService.getMap().getView().getProjection().getCode(),
        ),
      );
      return preferCurrent
        ? preferCurrent.TileMatrixSet
        : preferred[0].TileMatrixSet;
    }
    return 'EPSG:3857';
  }

  /**
   * Return preferred info format
   * Looks for the occurrence of supported formats (query.wms)
   * if possible picks HTML, otherwise first from the list of supported is selected
   * @param response - Set of available info formats for layer being added
   */
  getPreferredInfoFormat(formats): string {
    if (formats) {
      const supportedFormats = ['html', 'xml', 'gml'];
      const infos = formats.filter(
        (format) =>
          format.resourceType == 'FeatureInfo' &&
          supportedFormats.some((v) => format.format.includes(v)),
      );
      if (infos.length != 0) {
        const preferHTML = infos.find((format) =>
          format.format.includes('html'),
        );
        return preferHTML ? preferHTML.format : infos[0].format;
      }
    }
  }

  /***
   * Get WMTS layer bounding box
   */
  getWMTSExtent(identifier: string): Extent {
    const caps = this.data.caps;
    const layer = caps.Contents.Layer.find((l) => l.Identifier == identifier);
    return layer?.WGS84BoundingBox
      ? transformExtent(
          layer.WGS84BoundingBox,
          'EPSG:4326',
          this.hsMapService.getCurrentProj(),
        )
      : undefined;
  }

  /**
   * Get WMTS layer
   * Uses previously received capabilities response as a reference for the source
   * @param response - Set of available info formats for layer
   */
  getLayer(layer, options: LayerOptions): Layer<Source> {
    try {
      const wmts = new Tile({
        extent: this.getWMTSExtent(layer.Identifier),
        className: options?.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
        properties: {
          title: layer.Title,
          name: layer.Title,
          info_format: this.getPreferredInfoFormat(layer.ResourceURL),
          queryCapabilities: false,
          removable: true,
          base: layer.base,
          ...options,
        },
        source: new WMTS({} as any),
      });
      // Get WMTS Capabilities and create WMTS source base on it
      const capOptions = optionsFromCapabilities(this.data.caps, {
        layer: layer.Identifier,
        matrixSet:
          options?.matrixSet ??
          this.getPreferredMatrixSet(layer.TileMatrixSetLink),
        format: options?.format ?? this.getPreferredFormat(layer.Format),
      });
      // WMTS source for raster tiles layer
      const wmtsSource = new WMTS(capOptions);
      // set the data source for raster and vector tile layers
      wmts.setSource(wmtsSource);
      layer.base = false;
      return wmts;
    } catch (e) {
      throw new Error(e);
    }
  }
}
