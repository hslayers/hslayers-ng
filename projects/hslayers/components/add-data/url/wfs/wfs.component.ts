import {Component} from '@angular/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlWfsService,
} from 'hslayers-ng/services/add-data';
import {HsUtilsService} from 'hslayers-ng/services/utils';

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
    public hsUtilsService: HsUtilsService,
  ) {}
}
