import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {AddDataUrlType} from './types/url.type';
import {HsAddDataCommonService} from '../common/common.service';
import {HsAddDataService} from '../add-data.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsUrlArcGisService} from './arcgis/arcgis.service';
import {HsUrlTypeServiceModel} from './models/url-type-service.model';
import {HsUrlWfsService} from './wfs/wfs.service';
import {HsUrlWmsService} from './wms/wms.service';
import {HsUrlWmtsService} from './wmts/wmts.service';
import {HsWfsGetCapabilitiesService} from '../../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../../common/get-capabilities/wms-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/get-capabilities/wmts-get-capabilities.service';
import {IGetCapabilities} from '../../../common/get-capabilities/get-capabilities.interface';
import {layerConnection, owsConnection} from './types/ows-connection.type';
import {urlDataObject} from './types/data-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataOwsService {
  typeService: HsUrlTypeServiceModel;
  typeCapabilitiesService: IGetCapabilities;
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsHistoryListService: HsHistoryListService,
    public hsLog: HsLogService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsUrlArcGisService: HsUrlArcGisService,
    public hsUrlWfsService: HsUrlWfsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUrlWmsService: HsUrlWmsService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public hsUrlWmtsService: HsUrlWmtsService
  ) {
    this.hsAddDataCommonService.serviceLayersCalled.subscribe((url) => {
      this.setUrlAndConnect({uri: url});
    });
  }

  async connect(options?: layerConnection): Promise<Layer<Source>[]> {
    const typeBeingSelected = this.hsAddDataUrlService.typeSelected;
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
    const wrapper = await this.typeCapabilitiesService.request(
      url,
      options?.owrCache
    );
    if (
      typeof wrapper.response === 'string' &&
      wrapper.response?.includes('Unsuccessful OAuth2')
    ) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response);
      return [];
    } else {
      const response = await this.typeService.listLayerFromCapabilities(
        wrapper,
        options?.layerOptions
      );
      if (!options?.getOnly) {
        if (response?.length > 0) {
          this.typeService.addLayers(response);
        }
        //Note:
        //!response condition would result in infinite connectToOWS calls
        //response?.length by design also checks for hsAddDataCommonService.layerToSelect
        if (response?.length == 0) {
          this.hsLog.log('Empty response when layer selected');
          this.hsAddDataService.selectType('url');
          await this.connectToOWS({
            type: typeBeingSelected,
            uri: url,
            layer: undefined,
          });
        }

        if (this.hsUrlArcGisService.isImageService()) {
          const layers = await this.hsUrlArcGisService.getLayers();
          this.hsUrlArcGisService.addLayers(layers);
        }
      }

      return response;
    }
  }

  /**
   * Connect to service of specified Url
   * @param params - Connection params
   
   */
  async setUrlAndConnect(params: owsConnection): Promise<Layer<Source>[]> {
    this.hsAddDataCommonService.layerToSelect = params.layer;
    this.hsAddDataCommonService.updateUrl(params.uri);
    return await this.connect({
      owrCache: params.owrCache,
      getOnly: params.getOnly,
      layerOptions: params.layerOptions,
    });
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
