import {Component, Input} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsUrlArcGisService} from './arcgis.service';

@Component({
  selector: 'hs-url-arcgis',
  templateUrl: './arcgis.component.html',
})
export class HsUrlArcGisComponent {
  
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsUrlArcGisService: HsUrlArcGisService,
    public hsAddDataOwsService: HsAddDataOwsService
  ) {}
}
