import {Component, inject} from '@angular/core';

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
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsUrlWmsService = inject(HsUrlWmsService);
}
