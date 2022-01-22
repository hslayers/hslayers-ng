import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {AddDataUrlType} from './types/url.type';
import {HsAddDataCommonService} from '../common/common.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsUrlArcGisService} from './arcgis/arcgis.service';
import {HsUrlTypeServiceModel} from './models/url-type-service.model';
import {HsUrlWfsService} from './wfs/wfs.service';
import {HsUrlWmsService} from './wms/wms.service';
import {HsUrlWmtsService} from './wmts/wmts-service';
import {HsWfsGetCapabilitiesService} from '../../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../../common/get-capabilities/wms-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/get-capabilities/wmts-get-capabilities.service';
import {IGetCapabilities} from '../../../common/get-capabilities/get-capabilities.interface';
import {owsConnection} from './types/ows-connection.type';
import {urlDataObject} from './types/data-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataOwsService {
  typeService: HsUrlTypeServiceModel;
  typeCapabilitiesService: IGetCapabilities;
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsHistoryListService: HsHistoryListService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsUrlArcGisService: HsUrlArcGisService,
    public hsUrlWfsService: HsUrlWfsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUrlWmsService: HsUrlWmsService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public hsUrlWmtsService: HsUrlWmtsService
  ) {
    this.hsAddDataCommonService.serviceLayersCalled.subscribe(({url}) => {
      this.setUrlAndConnect({uri: url});
    });
  }
  async connect(style?: string): Promise<Layer<Source>[]> {
    await this.setTypeServices();
    const url = this.hsAddDataCommonService.url;
    if (!url || url === '') {
      return;
    }

    this.hsAddDataUrlService.addingAllowed = false;
    if (this.hsAddDataUrlService.typeSelected === 'arcgis') {
      if (this.hsUrlArcGisService.isGpService(url)) {
        this.hsAddDataCommonService.throwParsingError(
          'GPServerServicesAreNotSupported'
        );
        return;
      }
      this.typeService.data.get_map_url = url;
      this.hsAddDataUrlService.addingAllowed = true;
    }
    this.hsHistoryListService.addSourceHistory(
      this.hsAddDataUrlService.typeSelected,
      url
    );
    Object.assign(this.hsAddDataCommonService, {
      loadingInfo: true,
      showDetails: true,
    });
    const wrapper = await this.typeCapabilitiesService.request(url);
    const response = await this.typeService.listLayerFromCapabilities(
      wrapper,
      style
    );
    if (this.hsUrlArcGisService.isImageService()) {
      this.hsUrlArcGisService.addLayers();
    }
    return response;
  }

  /**
   * Connect to service of specified Url
   * @param url - Url of requested service
   * @param layer - Optional layer to select, when
   * getCapabilities arrives
   */
  async setUrlAndConnect(params: owsConnection): Promise<Layer<Source>[]> {
    this.hsAddDataCommonService.layerToSelect = params.layer;
    this.hsAddDataCommonService.updateUrl(params.uri);
    return await this.connect(params.style);
  }

  changed(data: urlDataObject): void {
    this.hsAddDataUrlService.searchForChecked(data.layers);
  }

  /**
   * replaces `ows.${type}_connecting`
   */
  async connectToOWS(params: owsConnection): Promise<Layer<Source>[]> {
    this.hsAddDataUrlService.typeSelected = params.type as AddDataUrlType;
    return await this.setUrlAndConnect(params);
  }

  async setTypeServices(): Promise<void> {
    switch (this.hsAddDataUrlService.typeSelected) {
      case 'wmts':
        this.typeService = this.hsUrlWmtsService;
        this.typeCapabilitiesService = this.hsWmtsGetCapabilitiesService;
        return;
      case 'wms':
        this.typeService = this.hsUrlWmsService;
        this.typeCapabilitiesService = this.hsWmsGetCapabilitiesService;
        return;
      case 'wfs':
        this.typeService = this.hsUrlWfsService;
        this.typeCapabilitiesService = this.hsWfsGetCapabilitiesService;
        return;
      case 'arcgis':
        this.typeService = this.hsUrlArcGisService;
        this.typeCapabilitiesService = this.hsArcgisGetCapabilitiesService;
        return;
      default:
        return;
    }
  }
}
