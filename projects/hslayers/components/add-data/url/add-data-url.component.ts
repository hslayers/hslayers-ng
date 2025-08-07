import {Component, OnInit, inject} from '@angular/core';

import {AddDataUrlType, SERVICES_SUPPORTED_BY_URL} from 'hslayers-ng/types';
import {AddDataUrlValues} from './add-data-url-values';
import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsAddDataUrlService,
} from 'hslayers-ng/services/add-data';
import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsShareUrlService} from 'hslayers-ng/services/share';

@Component({
  selector: 'hs-add-data-url',
  templateUrl: './add-data-url.component.html',
  standalone: false,
})
export class HsAddDataUrlComponent implements OnInit {
  hsConfig = inject(HsConfig);
  hsLanguageService = inject(HsLanguageService);
  hsShareUrlService = inject(HsShareUrlService);
  hsLog = inject(HsLogService);
  hsLayoutService = inject(HsLayoutService);
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsAddDataUrlService = inject(HsAddDataUrlService);
  hsDialogContainerService = inject(HsDialogContainerService);

  types: {id: AddDataUrlType; text: string}[];

  ngOnInit() {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes
        .filter((type) => SERVICES_SUPPORTED_BY_URL.includes(type))
        .map((type) => AddDataUrlValues.find((v) => v.id == type));
    } else {
      this.types = AddDataUrlValues;
    }
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
    if (!url) {
      this.hsAddDataUrlService.connectFromParams = false;
      return;
    }
    if (layers) {
      for (const layer of layers.split(';')) {
        this.hsAddDataOwsService.connectToOWS({
          type,
          uri: url,
          layer,
          layerOptions: {style: undefined},
        });
      }
    } else {
      this.hsAddDataOwsService.connectToOWS({type, uri: url});
    }
    this.hsAddDataUrlService.connectFromParams = false;
  }
}
