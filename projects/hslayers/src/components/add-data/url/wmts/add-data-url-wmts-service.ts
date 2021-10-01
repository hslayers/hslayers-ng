import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Injectable} from '@angular/core';
import {Tile} from 'ol/layer';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {DuplicateHandling, HsMapService} from '../../../map/map.service';
import {HsAddDataCommonService} from '../../common/add-data-common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataUrlTypeServiceModel} from '../models/add-data-url-type-service.model';
import {HsLayoutService} from '../../../layout/layout.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {addDataUrlDataObject} from '../types/add-data-url-data-object.type';

@Injectable({providedIn: 'root'})
export class HsAddDataUrlWmtsService implements HsAddDataUrlTypeServiceModel {
  data: addDataUrlDataObject;
  constructor(
    public hsMapService: HsMapService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.data = {
      add_all: null,
      caps: null,
      description: '',
      image_format: '',
      services: [],
      title: '',
      version: '',
    };
  }

  async addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper
  ): Promise<void> {
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
        for (const layer of this.data.services) {
          this.addLayers(true);
        }
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }

  /**
   * Parse information received in WMTS getCapabilities respond
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
      this.data.services = caps.Contents.Layer;

      this.hsAddDataUrlService.selectLayerByName(
        this.hsAddDataCommonService.layerToSelect,
        this.data.services,
        'Title'
      );
      //TODO Layer to select

      this.hsAddDataCommonService.loadingInfo = false;
      return this.data.title;
    } catch (e) {
      throw new Error(e);
    }
  }

  addLayersRecursively(layer): void {
    if (!this.data.add_all || layer.checked) {
      this.addLayer(layer);
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer);
      }
    }
  }

  addLayers(checkedOnly: boolean): void {
    this.data.add_all = checkedOnly;
    for (const layer of this.data.services) {
      this.addLayersRecursively(layer);
    }
    this.hsLayoutService.setMainPanel('layermanager');
    //FIX ME: to implement
    // this.zoomToLayers();
  }

  /**
   * Returns preferred tile format
   * @param formats - Set of available formats for layer being added
   */
  getPreferredFormat(formats: any): string {
    const preferred = formats.find((format) => format.includes('png'));
    return preferred ? preferred : formats[0];
  }

  /**
   * Returns preferred tile tileMatrixSet
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
          this.hsMapService.map.getView().getProjection().getCode()
        )
      );
      return preferCurrent
        ? preferCurrent.TileMatrixSet
        : preferred[0].TileMatrixSet;
    }
    return 'EPSG:3857';
  }

  /**
   * Returns preferred info format
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

  /**
   * Add WMTS layer to the map
   * Uses previously received capabilities response as a reference for the source
   * @param response - Set of available info formats for layer being added
   */
  addLayer(layer): void {
    try {
      const wmts = new Tile({
        properties: {
          title: layer.Title,
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
      this.hsMapService.addLayer(wmts, DuplicateHandling.RemoveOriginal);
      layer.base = false;
    } catch (e) {
      throw new Error(e);
    }
  }
}
