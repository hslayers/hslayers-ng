import {Component} from '@angular/core';

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
  title = ''; //FIXME: unused
  constructor(
    public hsUrlWfsService: HsUrlWfsService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsAddDataCommonService: HsAddDataCommonService,
  ) {}
}
