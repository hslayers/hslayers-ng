import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlBaseComponent} from '../add-data-url-base.component';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlWmtsService} from './wmts-service';
import {HsWmtsGetCapabilitiesService} from '../../../../common/get-capabilities/wmts-get-capabilities.service';
import {urlDataObject} from '../types/data-object.type';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsUrlWmtsComponent extends HsAddDataUrlBaseComponent {
  data: urlDataObject;
  constructor(
    public hsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsUrlWmtsService: HsUrlWmtsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    super(
      hsAddDataCommonService,
      hsEventBusService,
      hsHistoryListService,
      hsAddDataUrlService,
      'wmts',
      hsUrlWmtsService,
      hsWmtsGetCapabilitiesService
    );
    this.data = this.hsUrlWmtsService.data;
  }
}
