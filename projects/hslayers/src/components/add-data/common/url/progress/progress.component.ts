import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

import {HsAddDataService} from '../../../add-data.service';
import {HsUtilsService} from '../../../../utils/utils.service';

@Component({
  selector: 'hs-url-progress',
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsUrlProgressComponent {
  @Input() app = 'default';
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsUtilsService: HsUtilsService
  ) {}
}
