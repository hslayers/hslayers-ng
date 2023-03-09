import {Component} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsConfig} from '../../../../config.service';
import {HsUrlWfsService} from './wfs.service';
import {HsUtilsService} from '../../../../components/utils/utils.service';

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
    private hsConfig: HsConfig
  ) {}
}
