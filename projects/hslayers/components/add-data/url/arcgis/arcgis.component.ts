import {Component} from '@angular/core';

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
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsUrlArcGisService: HsUrlArcGisService,
    public hsAddDataOwsService: HsAddDataOwsService,
  ) {}
}
