import {Component} from '@angular/core';

import {HsAddDataCommonService} from 'hslayers-ng/shared/add-data';
import {HsAddDataOwsService} from 'hslayers-ng/shared/add-data';
import {HsUrlArcGisService} from 'hslayers-ng/shared/add-data';

@Component({
  selector: 'hs-url-arcgis',
  templateUrl: './arcgis.component.html',
})
export class HsUrlArcGisComponent {
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsUrlArcGisService: HsUrlArcGisService,
    public hsAddDataOwsService: HsAddDataOwsService,
  ) {}
}
