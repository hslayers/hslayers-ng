import {Component, OnInit} from '@angular/core';

import {AddDataUrlType, servicesSupportedByUrl} from './url/types/url.type';
import {DatasetType, HsAddDataService} from './add-data.service';
import {HsAddDataUrlService} from './url/add-data-url.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-add-data',
  templateUrl: './add-data.component.html',
})
export class HsAddDataComponent extends HsPanelBaseComponent implements OnInit {
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataUrlService: HsAddDataUrlService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);

    this.hsAddDataService.dsSelected = 'catalogue';
    servicesSupportedByUrl.forEach((type) =>
      this.connectServiceFromUrlParam(type as AddDataUrlType)
    );
  }
  name = 'addData';

  datasetSelect(type: DatasetType): void {
    this.hsAddDataService.selectType(type, this.data.app);
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'addData',
        module: 'hs.addData',
        order: 4,
        fits: true,
        title: () =>
          this.hsLanguageService.getTranslation('PANEL_HEADER.ADDLAYERS'),
        description: () =>
          this.hsLanguageService.getTranslation(
            'SIDEBAR.descriptions.ADDLAYERS'
          ),
        icon: 'icon-database',
      },
      this.data.app
    );
    this.hsCommonEndpointsService.init(this.data.app);
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);
    if (url) {
      this.hsLayoutService.setMainPanel('addData', this.data.app);
      this.hsAddDataService.dsSelected = 'url';
      this.hsAddDataUrlService.typeSelected = type;
    }
  }
}
