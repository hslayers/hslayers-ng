import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsUrlWmtsService} from './wmts-service';
import {urlDataObject} from '../types/data-object.type';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsUrlWmtsComponent {
  data: urlDataObject;
  constructor(
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUrlWmtsService: HsUrlWmtsService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.data = this.hsUrlWmtsService.data;
  }
}
