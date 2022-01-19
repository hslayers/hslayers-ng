import {Component} from '@angular/core';

import {AddDataUrlType, servicesSupportedByUrl} from './types/url.type';
import {AddDataUrlValues} from './add-data-url-values';
import {HsAddDataCommonService} from '../common/common.service';
import {HsAddDataOwsService} from './add-data-ows.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsShareUrlService} from '../../permalink/share-url.service';

@Component({
  selector: 'hs-add-data-url',
  templateUrl: './add-data-url.component.html',
})
export class HsAddDataUrlComponent {
  types: {id: AddDataUrlType; text: string}[];
  constructor(
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsAddDataUrlService: HsAddDataUrlService
  ) {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes
        .filter((type) => servicesSupportedByUrl.includes(type))
        .map((type) => AddDataUrlValues.find((v) => v.id == type));
    } else {
      this.types = AddDataUrlValues;
    }
    //This component initializes after add-data.component which already set the typeSelected so *should* be fine to connect now
    if (this.hsAddDataUrlService.typeSelected) {
      this.connectServiceFromUrlParam(this.hsAddDataUrlService.typeSelected);
    }
  }

  selectType(type: AddDataUrlType): void {
    this.hsAddDataCommonService.clearParams();
    this.hsAddDataUrlService.typeSelected = type;
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    if (!this.hsAddDataUrlService.connectFromParams) {
      return;
    }
    const layers = this.hsShareUrlService.getParamValue(`hs-${type}-layers`);
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);

    // const serviceName = `hsAddLayersWmsService`;
    if (layers) {
      for (const layer of layers.split(';')) {
        this.hsAddDataOwsService.connectToOWS({
          type,
          uri: url,
          layer,
          style: undefined,
        });
      }
    } else {
      this.hsAddDataOwsService.connectToOWS({type, uri: url});
    }
    this.hsAddDataUrlService.connectFromParams = false;
  }
}
