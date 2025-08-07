import {Component, inject} from '@angular/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWmtsService,
} from 'hslayers-ng/services/add-data';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
  standalone: false,
})
export class HsUrlWmtsComponent {
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsUrlWmtsService = inject(HsUrlWmtsService);
  hsAddDataCommonService = inject(HsAddDataCommonService);
}
