import {ChangeDetectionStrategy, Component} from '@angular/core';

import {HsAddDataService} from '../../../add-data.service';
import {HsUtilsService} from '../../../../utils/utils.service';

@Component({
  selector: 'hs-common-url-progress',
  templateUrl: './common-url-progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsCommonUrlProgressComponent {
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsUtilsService: HsUtilsService
  ) {}
}
