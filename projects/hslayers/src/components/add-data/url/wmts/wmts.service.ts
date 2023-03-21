import {Injectable} from '@angular/core';

import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import {Layer, Tile} from 'ol/layer';
import {Source} from 'ol/source';
import {WMTSCapabilities} from 'ol/format';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {Extent} from 'ol/extent';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {addAnchors} from '../../../../common/attribution-utils';
import {transformExtent} from 'ol/proj';
import {urlDataObject} from '../types/data-object.type';

@Injectable({providedIn: 'root'})
export class HsUrlWmtsService implements HsUrlTypeServiceModel {
  data: urlDataObject;

  constructor(
    public hsMapService: HsMapService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService
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
    wrapper: CapabilitiesResponseWrapper
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
          'wmts'
        );
        return this.getLayers(true);
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
      this.data.title = caps.ServiceIdentification.Title || 'Wmts layer';

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
   * @param collection - Layers created and retreived collection
   */
  getLayersRecursively(layer, options, collection): void {
    if (!this.data.add_all || layer.checked) {
      collection.push(this.getLayer(layer, undefined));
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
   */
  getLayers(checkedOnly: boolean): Layer<Source>[] {
    this.data.add_all = checkedOnly;
    const collection = [];
    for (const layer of this.data.layers) {
      this.getLayersRecursively(layer, undefined, collection);
    }
    this.data.extent = this.hsAddDataUrlService.calcAllLayersExtent(collection);
    this.hsAddDataUrlService.zoomToLayers(this.data);
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    if (collection.length > 0) {
      this.hsLayoutService.setMainPanel('layermanager');
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
      supportedFormats.some((v) => set.TileMatrixSet.includes(v))
    );
    if (preferred.length != 0) {
      const preferCurrent = preferred.find((set) =>
        set.TileMatrixSet.includes(
          this.hsMapService.getMap().getView().getProjection().getCode()
        )
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
          supportedFormats.some((v) => format.format.includes(v))
      );
      if (infos.length != 0) {
        const preferHTML = infos.find((format) =>
          format.format.includes('html')
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
          this.hsMapService.getCurrentProj()
        )
      : undefined;
  }

  /**
   * Get WMTS layer
   * Uses previously received capabilities response as a reference for the source
   * @param response - Set of available info formats for layer
   */
  getLayer(layer, options): Layer<Source> {
    try {
      const wmts = new Tile({
        extent: this.getWMTSExtent(layer.Identifier),
        properties: {
          title: layer.Title,
          name: layer.Title,
          info_format: this.getPreferredInfoFormat(layer.ResourceURL),
          queryCapabilities: false,
          removable: true,
          base: layer.base,
        },
        source: new WMTS({} as any),
      });
      // Get WMTS Capabilities and create WMTS source base on it
      const options = optionsFromCapabilities(this.data.caps, {
        layer: layer.Identifier,
        matrixSet: this.getPreferredMatrixSet(layer.TileMatrixSetLink),
        format: this.getPreferredFormat(layer.Format),
      });
      // WMTS source for raster tiles layer
      const wmtsSource = new WMTS(options);
      // set the data source for raster and vector tile layers
      wmts.setSource(wmtsSource);
      layer.base = false;
      return wmts;
    } catch (e) {
      throw new Error(e);
    }
  }
}
