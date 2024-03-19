import {Component} from '@angular/core';

import {HsAddDataCommonService} from 'hslayers-ng/services/add-data';
import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {HsUrlWmtsService} from 'hslayers-ng/services/add-data';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
})
export class HsUrlWmtsComponent {
  constructor(
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUrlWmtsService: HsUrlWmtsService,
    public hsAddDataCommonService: HsAddDataCommonService,
  ) {}
}
