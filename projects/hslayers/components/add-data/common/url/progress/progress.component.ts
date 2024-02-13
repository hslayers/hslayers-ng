import {ChangeDetectionStrategy, Component} from '@angular/core';

import {HsAddDataService} from 'hslayers-ng/shared/add-data';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Component({
  selector: 'hs-url-progress',
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsUrlProgressComponent {
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsUtilsService: HsUtilsService,
  ) {}
}
