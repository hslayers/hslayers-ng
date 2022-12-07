import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';

import {AddDataUrlType} from './types/url.type';
import {AddDataUrlValues} from './add-data-url-values';
import {HsAddDataCommonService} from '../common/common.service';
import {HsAddDataOwsService} from './add-data-ows.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsConfig} from '../../../config.service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsGetCapabilitiesErrorComponent} from '../common/capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsShareUrlService} from '../../permalink/share-url.service';
import {servicesSupportedByUrl} from './services-supported.const';

@Component({
  selector: 'hs-add-data-url',
  templateUrl: './add-data-url.component.html',
})
export class HsAddDataUrlComponent implements OnInit, OnDestroy {
  types: {id: AddDataUrlType; text: string}[];
  @Input() app = 'default';
  appRef;
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
    public hsDialogContainerService: HsDialogContainerService
  ) {}

  ngOnInit() {
    this.appRef = this.hsAddDataUrlService.get(this.app);
    if (Array.isArray(this.hsConfig.get(this.app).connectTypes)) {
      this.types = this.hsConfig
        .get(this.app)
        .connectTypes.filter((type) => servicesSupportedByUrl.includes(type))
        .map((type) => AddDataUrlValues.find((v) => v.id == type));
    } else {
      this.types = AddDataUrlValues;
    }
    if (this.hsAddDataUrlService.get(this.app).typeSelected) {
      this.connectServiceFromUrlParam(
        this.hsAddDataUrlService.get(this.app).typeSelected
      );
    }
    this.hsAddDataUrlService
      .get(this.app)
      .addDataCapsParsingError.pipe(takeUntil(this.end))
      .subscribe((e) => {
        this.hsLog.warn(this.app);
        let error = e.toString();
        if (error?.includes('Unsuccessful OAuth2')) {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'COMMON',
            'Authentication failed. Login to the catalogue.',
            undefined,
            this.app
          );
        } else if (error.includes('property')) {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            'serviceTypeNotMatching',
            undefined,
            this.app
          );
        } else {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            error,
            undefined,
            this.app
          );
        }
        this.hsDialogContainerService.create(
          HsGetCapabilitiesErrorComponent,
          {error: error},
          this.app
        );
      });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  selectType(type: AddDataUrlType, app: string): void {
    this.hsAddDataCommonService.clearParams(app);
    this.hsAddDataUrlService.get(this.app).typeSelected = type;
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    if (!this.hsAddDataUrlService.get(this.app).connectFromParams) {
      return;
    }
    const layers = this.hsShareUrlService.getParamValue(`hs-${type}-layers`);
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);
    if (!url) {
      this.hsAddDataUrlService.get(this.app).connectFromParams = false;
      return;
    }
    if (layers) {
      for (const layer of layers.split(';')) {
        this.hsAddDataOwsService.connectToOWS(
          {
            type,
            uri: url,
            layer,
            style: undefined,
          },
          this.app
        );
      }
    } else {
      this.hsAddDataOwsService.connectToOWS({type, uri: url}, this.app);
    }
    this.hsAddDataUrlService.get(this.app).connectFromParams = false;
  }
}
