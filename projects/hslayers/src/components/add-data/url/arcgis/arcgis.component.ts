import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlBaseComponent} from '../add-data-url-base.component';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlArcGisService} from './arcgis.service';

@Component({
  selector: 'hs-url-arcgis',
  templateUrl: './arcgis.component.html',
})
export class HsUrlArcGisComponent extends HsAddDataUrlBaseComponent {
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public hsUrlArcGisService: HsUrlArcGisService
  ) {
    super(
      hsAddDataCommonService,
      hsEventBusService,
      hsHistoryListService,
      hsAddDataUrlService,
      'arcgis',
      hsUrlArcGisService,
      hsArcgisGetCapabilitiesService
    );
  }
}
