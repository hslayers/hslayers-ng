import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsUrlWmtsService} from './wmts.service';

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
