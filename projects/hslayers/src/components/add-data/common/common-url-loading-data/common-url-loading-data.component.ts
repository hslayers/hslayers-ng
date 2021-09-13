import {Component, Input} from '@angular/core';

import {HsAddDataService} from './../../add-data.service';
import {HsUtilsService} from '../../../../components/utils/utils.service';

@Component({
  selector: 'hs-common-url-loading-data',
  templateUrl: './common-url-loading-data.component.html',
})
export class HsCommonUrlLoadingDataComponent {
  @Input() injectedService: any;

  constructor(
    public hsAddDataService: HsAddDataService,
    public hsUtilsService: HsUtilsService
  ) {}
}
