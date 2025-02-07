import {Component} from '@angular/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWmsService,
} from 'hslayers-ng/services/add-data';

@Component({
  selector: 'hs-url-wms',
  templateUrl: './wms.component.html',
  standalone: false,
})
export class HsUrlWmsComponent {
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUrlWmsService: HsUrlWmsService,
  ) {}
}
