import {ChangeDetectionStrategy, Component} from '@angular/core';

import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Component({
  selector: 'hs-url-progress',
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsUrlProgressComponent {
  constructor(
    public hsEventBusService: HsEventBusService,
    public hsUtilsService: HsUtilsService,
  ) {}
}
