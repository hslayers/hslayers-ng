import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';

import {AddDataUrlType} from 'hslayers-ng/common/types';
import {AddDataUrlValues} from './add-data-url-values';
import {HsAddDataCommonService} from 'hslayers-ng/shared/add-data';
import {HsAddDataOwsService} from 'hslayers-ng/shared/add-data';
import {HsAddDataUrlService} from 'hslayers-ng/shared/add-data';
import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {servicesSupportedByUrl} from 'hslayers-ng/common/types';

@Component({
  selector: 'hs-add-data-url',
  templateUrl: './add-data-url.component.html',
})
export class HsAddDataUrlComponent implements OnInit, OnDestroy {
  types: {id: AddDataUrlType; text: string}[];
  private end = new Subject<void>();

  constructor(
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService,
    public hsShareUrlService: HsShareUrlService,
    public hsLog: HsLogService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsDialogContainerService: HsDialogContainerService,
  ) {}

  ngOnInit() {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes
        .filter((type) => servicesSupportedByUrl.includes(type))
        .map((type) => AddDataUrlValues.find((v) => v.id == type));
    } else {
      this.types = AddDataUrlValues;
    }
    if (this.hsAddDataUrlService.typeSelected) {
      this.connectServiceFromUrlParam(this.hsAddDataUrlService.typeSelected);
    }
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
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
