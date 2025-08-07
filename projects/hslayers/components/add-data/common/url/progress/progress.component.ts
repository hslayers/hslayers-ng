import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';

@Component({
  selector: 'hs-url-progress',
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HsUrlProgressComponent {
  hsEventBusService = inject(HsEventBusService);
}
