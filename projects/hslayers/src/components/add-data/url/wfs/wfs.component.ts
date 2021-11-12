import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlBaseComponent} from '../add-data-url-base.component';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlWfsService} from './wfs.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';
import {urlDataObject} from '../types/data-object.type';

@Component({
  selector: 'hs-url-wfs',
  templateUrl: './wfs.component.html',
})
export class HsUrlWfsComponent extends HsAddDataUrlBaseComponent {
  data: urlDataObject;
  title = ''; //FIXME: unused
  constructor(
    public hsUrlWfsService: HsUrlWfsService,
    public hsEventBusService: HsEventBusService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsUtilsService: HsUtilsService, //used in template,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    super(
      hsAddDataCommonService,
      hsEventBusService,
      hsHistoryListService,
      hsAddDataUrlService,
      'wfs',
      hsUrlWfsService,
      hsWfsGetCapabilitiesService
    );
    this.data = this.hsUrlWfsService.data;
  }
}
