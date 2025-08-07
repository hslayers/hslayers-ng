import {Component, inject} from '@angular/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlArcGisService,
} from 'hslayers-ng/services/add-data';

@Component({
  selector: 'hs-url-arcgis',
  templateUrl: './arcgis.component.html',
  standalone: false,
})
export class HsUrlArcGisComponent {
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsUrlArcGisService = inject(HsUrlArcGisService);
  hsAddDataOwsService = inject(HsAddDataOwsService);
}
