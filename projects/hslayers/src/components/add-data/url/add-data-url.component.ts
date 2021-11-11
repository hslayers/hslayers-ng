import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {AddDataUrlType, servicesSupportedByUrl} from './types/url.type';
import {AddDataUrlValues} from './add-data-url-values';
import {HsAddDataCommonService} from '../common/common.service';
import {HsAddDataService} from '../add-data.service';
import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsShareUrlService} from '../../permalink/share-url.service';

@Component({
  selector: 'hs-add-data-url',
  templateUrl: './add-data-url.component.html',
})
export class HsAddDataUrlComponent implements OnDestroy {
  typeSelected: AddDataUrlType;
  types: {id: AddDataUrlType; text: string}[];
  owsFillingSubscription: Subscription;

  constructor(
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService,
    public hsEventBusService: HsEventBusService,
    public hsShareUrlService: HsShareUrlService,
    public hsAddDataService: HsAddDataService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes
        .filter((type) => servicesSupportedByUrl.includes(type))
        .map((type) => AddDataUrlValues.find((v) => v.id == type));
    } else {
      this.types = AddDataUrlValues;
    }

    this.owsFillingSubscription = this.hsEventBusService.owsFilling.subscribe(
      ({type, uri, layer, sld}) => {
        this.typeSelected = type.toLowerCase();
        this.hsEventBusService.owsConnecting.next({
          type,
          uri,
          layer,
          sld,
        });
      }
    );
    //This component initializes after add-data.component which already set the urlType so *should* be fine to connect now
    if (this.hsAddDataService.urlType) {
      this.selectType(this.hsAddDataService.urlType);
      this.connectServiceFromUrlParam(this.hsAddDataService.urlType);
    }
  }
  ngOnDestroy(): void {
    this.owsFillingSubscription.unsubscribe();
  }

  selectType(type: AddDataUrlType): void {
    this.typeSelected = type;
    this.hsAddDataCommonService.clearParams();
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    const layers = this.hsShareUrlService.getParamValue(`hs-${type}-layers`);
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);

    // const serviceName = `hsAddLayersWmsService`;
    if (layers) {
      for (const layer of layers.split(';')) {
        this.hsEventBusService.owsConnecting.next({
          type,
          uri: url,
          layer,
          sld: undefined,
        });
      }
    } else {
      this.hsEventBusService.owsConnecting.next({type, uri: url});
      this.hsLayoutService.setMainPanel('addData');
    }
  }
}
