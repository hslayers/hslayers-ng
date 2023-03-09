import {Component, Input} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsUrlWmsService} from './wms.service';

@Component({
  selector: 'hs-url-wms',
  templateUrl: './wms.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsUrlWmsComponent {
  
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUrlWmsService: HsUrlWmsService
  ) {}
}
