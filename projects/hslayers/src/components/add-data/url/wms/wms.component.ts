import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlBaseComponent} from '../add-data-url-base.component';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlWmsService} from './wms.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/get-capabilities/wms-get-capabilities.service';

@Component({
  selector: 'hs-url-wms',
  templateUrl: './wms.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsUrlWmsComponent extends HsAddDataUrlBaseComponent {
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsUrlWmsService: HsUrlWmsService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService
  ) {
    super(
      hsAddDataCommonService,
      hsEventBusService,
      hsHistoryListService,
      hsAddDataUrlService,
      'wms',
      hsUrlWmsService,
      hsWmsGetCapabilitiesService
    );
  }
}
