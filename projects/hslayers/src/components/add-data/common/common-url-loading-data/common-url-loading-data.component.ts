import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

import {HsAddDataService} from './../../add-data.service';
import {HsUtilsService} from '../../../../components/utils/utils.service';

@Component({
  selector: 'hs-common-url-loading-data',
  templateUrl: './common-url-loading-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsCommonUrlLoadingDataComponent {
  @Input() loadingInfo: any;

  constructor(
    public hsAddDataService: HsAddDataService,
    public hsUtilsService: HsUtilsService
  ) {}
}
