import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsAddDataCommonService} from '../common.service';
import {HsAddDataService} from '../add-data.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsUrlArcGisService} from './arcgis.service';
import {HsUrlWfsService} from './wfs.service';
import {HsUrlWmsService} from './wms.service';
import {HsUrlWmtsService} from './wmts.service';

import {
  HsArcgisGetCapabilitiesService,
  HsWfsGetCapabilitiesService,
  HsWmsGetCapabilitiesService,
  HsWmtsGetCapabilitiesService,
  IGetCapabilities,
} from 'hslayers-ng/shared/get-capabilities';
import {HsLogService} from 'hslayers-ng/shared/log';

import {AddDataUrlType} from 'hslayers-ng/types';
import {HsHistoryListService} from 'hslayers-ng/common/history-list';
import {HsUrlTypeServiceModel} from 'hslayers-ng/types';
import {LayerConnection, OwsConnection} from 'hslayers-ng/types';
import {UrlDataObject} from 'hslayers-ng/types';

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
    public hsUrlWmtsService: HsUrlWmtsService,
  ) {
    this.hsAddDataCommonService.serviceLayersCalled.subscribe((url) => {
      this.setUrlAndConnect({uri: url});
    });
  }

  async connect(options?: LayerConnection): Promise<Layer<Source>[]> {
    const typeBeingSelected = this.hsAddDataUrlService.typeSelected;
    await this.setTypeServices();

    const url = this.hsAddDataCommonService.url;
    if (!url || url === '') {
      return;
    }
    this.hsAddDataUrlService.addingAllowed = false;
    if (this.hsAddDataUrlService.typeSelected === 'arcgis') {
      if (!this.hsUrlArcGisService.isValidService(url)) {
        this.hsAddDataCommonService.throwParsingError(
          'GPServerServicesAreNotSupported',
        );
        return;
      }
      this.typeService.data.get_map_url = url;
      this.hsAddDataUrlService.addingAllowed = true;
    }
    this.hsHistoryListService.addSourceHistory(
      this.hsAddDataUrlService.typeSelected,
      url,
    );
    Object.assign(this.hsAddDataCommonService, {
      loadingInfo: true,
      showDetails: true,
    });
    const wrapper = await this.typeCapabilitiesService.request(
      url,
      options?.owrCache,
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
        options?.layerOptions,
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
  async setUrlAndConnect(params: OwsConnection): Promise<Layer<Source>[]> {
    this.hsAddDataCommonService.layerToSelect = params.layer;
    this.hsAddDataCommonService.updateUrl(params.uri);
    return await this.connect({
      owrCache: params.owrCache,
      getOnly: params.getOnly,
      layerOptions: params.layerOptions,
    });
  }

  changed(data: UrlDataObject): void {
    this.hsAddDataUrlService.searchForChecked(data.layers);
  }

  /**
   * replaces `ows.${type}_connecting`
   */
  async connectToOWS(params: OwsConnection): Promise<Layer<Source>[]> {
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
