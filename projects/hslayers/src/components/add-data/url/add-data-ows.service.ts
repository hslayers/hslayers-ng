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
import {owsConnection} from './types/ows-connection.type';
import {urlDataObject} from './types/data-object.type';

class HsAddDataOwsParams {
  typeService: HsUrlTypeServiceModel;
  typeCapabilitiesService: IGetCapabilities;
}

@Injectable({
  providedIn: 'root',
})
export class HsAddDataOwsService {
  apps: {
    [id: string]: HsAddDataOwsParams;
  } = {default: new HsAddDataOwsParams()};

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
    this.hsAddDataCommonService.serviceLayersCalled.subscribe(({url, app}) => {
      this.setUrlAndConnect({uri: url}, app);
    });
  }

  get(app: string): HsAddDataOwsParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataOwsParams();
    }
    return this.apps[app ?? 'default'];
  }

  async connect(
    app: string,
    opt?: {
      style?: string;
      owrCache?: boolean;
      getOnly?: boolean;
    }
  ): Promise<Layer<Source>[]> {
    const typeBeingSelected = this.hsAddDataUrlService.get(app).typeSelected;
    await this.setTypeServices(app);
    const appRef = this.get(app);
    const url = this.hsAddDataCommonService.get(app).url;
    if (!url || url === '') {
      return;
    }
    this.hsAddDataUrlService.apps[app].addingAllowed = false;
    if (this.hsAddDataUrlService.apps[app].typeSelected === 'arcgis') {
      if (this.hsUrlArcGisService.isGpService(url)) {
        this.hsAddDataCommonService.throwParsingError(
          'GPServerServicesAreNotSupported',
          app
        );
        return;
      }
      appRef.typeService.get(app).data.get_map_url = url;
      this.hsAddDataUrlService.apps[app].addingAllowed = true;
    }
    this.hsHistoryListService.addSourceHistory(
      this.hsAddDataUrlService.apps[app].typeSelected,
      url
    );
    Object.assign(this.hsAddDataCommonService.get(app), {
      loadingInfo: true,
      showDetails: true,
    });
    const wrapper = await appRef.typeCapabilitiesService.request(
      url,
      app,
      opt?.owrCache
    );
    if (
      typeof wrapper.response === 'string' &&
      wrapper.response?.includes('Unsuccessful OAuth2')
    ) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response, app);
      return [];
    } else {
      const response = await this.get(
        app
      ).typeService.listLayerFromCapabilities(wrapper, app, opt?.style);
      if (!opt?.getOnly) {
        if (response?.length > 0) {
          appRef.typeService.addLayers(response, app);
        }
        //Note:
        //!response condition would result in infinite connectToOWS calls
        //response?.length by design also checks for hsAddDataCommonService.layerToSelect
        if (response?.length == 0) {
          this.hsLog.log('Empty response when layer selected');
          this.hsAddDataService.selectType('url', app);
          await this.connectToOWS(
            {
              type: typeBeingSelected,
              uri: url,
              layer: undefined,
            },
            app
          );
        }

        if (this.hsUrlArcGisService.isImageService(app)) {
          const layers = await this.hsUrlArcGisService.getLayers(app);
          this.hsUrlArcGisService.addLayers(layers, app);
        }
      }

      return response;
    }
  }

  /**
   * Connect to service of specified Url
   * @param params - Connection params
   * @param app - App identifier
   */
  async setUrlAndConnect(
    params: owsConnection,
    app: string
  ): Promise<Layer<Source>[]> {
    this.hsAddDataCommonService.get(app).layerToSelect = params.layer;
    this.hsAddDataCommonService.updateUrl(params.uri, app);
    return await this.connect(app, {
      style: params.style,
      owrCache: params.owrCache,
      getOnly: params.getOnly,
    });
  }

  changed(data: urlDataObject, app: string): void {
    this.hsAddDataUrlService.searchForChecked(data.layers, app);
  }

  /**
   * replaces `ows.${type}_connecting`
   */
  async connectToOWS(
    params: owsConnection,
    app: string
  ): Promise<Layer<Source>[]> {
    this.hsAddDataUrlService.get(app).typeSelected =
      params.type as AddDataUrlType;
    return await this.setUrlAndConnect(params, app);
  }

  async setTypeServices(app: string): Promise<void> {
    const appRef = this.get(app);
    switch (this.hsAddDataUrlService.get(app).typeSelected) {
      case 'wmts':
        appRef.typeService = this.hsUrlWmtsService;
        appRef.typeCapabilitiesService = this.hsWmtsGetCapabilitiesService;
        return;
      case 'wms':
        appRef.typeService = this.hsUrlWmsService;
        appRef.typeCapabilitiesService = this.hsWmsGetCapabilitiesService;
        return;
      case 'wfs':
        appRef.typeService = this.hsUrlWfsService;
        appRef.typeCapabilitiesService = this.hsWfsGetCapabilitiesService;
        return;
      case 'arcgis':
        appRef.typeService = this.hsUrlArcGisService;
        appRef.typeCapabilitiesService = this.hsArcgisGetCapabilitiesService;
        return;
      default:
        return;
    }
  }
}
