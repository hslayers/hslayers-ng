import {Component} from '@angular/core';

import {HsAddDataCommonService} from 'hslayers-ng/shared/add-data';
import {HsAddDataOwsService} from 'hslayers-ng/shared/add-data';
import {HsUrlWmsService} from 'hslayers-ng/shared/add-data';

@Component({
  selector: 'hs-url-wms',
  templateUrl: './wms.component.html',
})
export class HsUrlWmsComponent {
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUrlWmsService: HsUrlWmsService,
  ) {}
}
