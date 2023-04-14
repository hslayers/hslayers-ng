import {Component, OnDestroy, OnInit} from '@angular/core';

import {AddDataUrlType} from './url/types/url.type';
import {DatasetType, HsAddDataService} from './add-data.service';
import {HsAddDataUrlService} from './url/add-data-url.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from './common/capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {Subject, takeUntil} from 'rxjs';
import {servicesSupportedByUrl} from './url/services-supported.const';

@Component({
  selector: 'hs-add-data',
  templateUrl: './add-data.component.html',
})
export class HsAddDataComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy
{
  private end = new Subject<void>();

  constructor(
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataUrlService: HsAddDataUrlService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsSidebarService: HsSidebarService,
    private hsDialogContainerService: HsDialogContainerService
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

    this.hsSidebarService.addButton({
      panel: 'addData',
      module: 'hs.addData',
      order: 4,
      fits: true,
      title: 'PANEL_HEADER.ADDLAYERS',
      description: 'SIDEBAR.descriptions.ADDLAYERS',
      icon: 'icon-database',
    });
    servicesSupportedByUrl.forEach((type) =>
      this.connectServiceFromUrlParam(type as AddDataUrlType)
    );

    this.hsAddDataUrlService.addDataCapsParsingError
      .pipe(takeUntil(this.end))
      .subscribe((e) => {
        let error = e.toString();
        if (error?.includes('Unsuccessful OAuth2')) {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'COMMON',
            'Authentication failed. Login to the catalogue.',
            undefined
          );
        } else if (error.includes('property')) {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            'serviceTypeNotMatching',
            undefined
          );
        } else {
          error = this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            error,
            undefined
          );
        }
        this.hsDialogContainerService.create(HsGetCapabilitiesErrorComponent, {
          error: error,
        });
      });
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
