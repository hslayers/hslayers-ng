import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';

import {AddDataUrlType} from './url/types/url.type';
import {DatasetType} from 'hslayers-ng/common/types';
import {HsAddDataService} from './add-data.service';
import {HsAddDataUrlService} from './url/add-data-url.service';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsGetCapabilitiesErrorComponent} from './common/capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';
import {servicesSupportedByUrl} from './url/services-supported.const';

@Component({
  selector: 'hs-add-data',
  templateUrl: './add-data.component.html',
})
export class HsAddDataComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy {
  private end = new Subject<void>();

  constructor(
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataUrlService: HsAddDataUrlService,
    private hsSidebarService: HsSidebarService,
    private hsDialogContainerService: HsDialogContainerService,
  ) {
    super(hsLayoutService);
  }
  name = 'addData';

  selectDatasetType(type: DatasetType): void {
    this.hsAddDataService.selectType(type);
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.selectDatasetType('catalogue');

    servicesSupportedByUrl.forEach((type) =>
      this.connectServiceFromUrlParam(type as AddDataUrlType),
    );

    this.hsAddDataUrlService.addDataCapsParsingError
      .pipe(takeUntil(this.end))
      .subscribe((e) => {
        let error = e.toString();
        if (error?.includes('Unsuccessful OAuth2')) {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'COMMON',
            'Authentication failed. Login to the catalogue.',
            undefined,
          );
        } else if (error.includes('property')) {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            'serviceTypeNotMatching',
            undefined,
          );
        } else {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            error,
            undefined,
          );
        }
        this.hsDialogContainerService.create(HsGetCapabilitiesErrorComponent, {
          error: error,
        });
      });
    super.ngOnInit();
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);
    if (url) {
      this.hsLayoutService.setMainPanel('addData');
      this.selectDatasetType('url');
      this.hsAddDataUrlService.typeSelected = type;
    }
  }
}
