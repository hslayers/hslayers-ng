import {Component} from '@angular/core';

import {HsAddDataCommonService} from 'hslayers-ng/services/add-data';
import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {HsUrlWfsService} from 'hslayers-ng/services/add-data';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-url-wfs',
  templateUrl: './wfs.component.html',
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
