import {Component, inject} from '@angular/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWfsService,
} from 'hslayers-ng/services/add-data';

@Component({
  selector: 'hs-url-wfs',
  templateUrl: './wfs.component.html',
  standalone: false,
})
export class HsUrlWfsComponent {
  hsUrlWfsService = inject(HsUrlWfsService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
  hsAddDataCommonService = inject(HsAddDataCommonService);

  title = '';
}
