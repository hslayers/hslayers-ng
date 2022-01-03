import {
  Component,
  Inject,
  InjectionToken,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsAddDataCommonService} from '../common/common.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsUrlTypeServiceModel} from './models/url-type-service.model';
import {IGetCapabilities} from '../../../common/get-capabilities/get-capabilities.interface';
import {urlDataObject} from './types/data-object.type';

export const BASE_DATA_TOKEN = new InjectionToken<string>('base-data-type');
export const TYPE_SERVICE_TOKEN = new InjectionToken<HsUrlTypeServiceModel>(
  'type-service'
);
export const TYPE_CAPABILITIES_SERVICE_TOKEN =
  new InjectionToken<IGetCapabilities>('type-capabilities-service');

@Component({
  template: '<div></div>',
  providers: [
    {provide: BASE_DATA_TOKEN, useValue: ''},
    {provide: TYPE_SERVICE_TOKEN, useValue: null},
    {provide: TYPE_CAPABILITIES_SERVICE_TOKEN, useValue: null},
  ],
})
export class HsAddDataUrlBaseComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject<void>();

  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataUrlService: HsAddDataUrlService,
    @Inject(BASE_DATA_TOKEN) private baseDataType: string,
    @Inject(TYPE_SERVICE_TOKEN) private typeService: HsUrlTypeServiceModel,
    @Inject(TYPE_CAPABILITIES_SERVICE_TOKEN)
    private typeCapabilitiesService: IGetCapabilities
  ) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.hsEventBusService.owsConnecting
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({type, uri, layer, style}) => {
        if (type === this.baseDataType) {
          this.hsAddDataCommonService.layerToSelect = layer;
          this.setUrlAndConnect(uri, style);
        }
      });
  }

  async connect(style?: string): Promise<void> {
    const url = this.hsAddDataCommonService.url;
    if (!url || url === '') {
      return;
    }

    if (this.baseDataType === 'arcgis') {
      this.typeService.data.get_map_url = url;
    }
    this.hsAddDataUrlService.hasAnyChecked = false;
    this.hsHistoryListService.addSourceHistory(this.baseDataType, url);
    Object.assign(this.hsAddDataCommonService, {
      loadingInfo: true,
      showDetails: true,
    });
    const wrapper = await this.typeCapabilitiesService.request(url);
    this.typeService.addLayerFromCapabilities(wrapper, style);
  }

  /**
   * Connect to service of specified Url
   * @param url - Url of requested service
   * @param layer - Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, style?: string): void {
    this.hsAddDataCommonService.updateUrl(url);
    this.connect(style);
  }

  changed(data: urlDataObject): void {
    this.hsAddDataUrlService.searchForChecked(data.services);
  }
}
