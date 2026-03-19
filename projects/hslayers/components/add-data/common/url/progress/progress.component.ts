import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';

@Component({
  selector: 'hs-url-progress',
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class HsUrlProgressComponent {
  hsEventBusService = inject(HsEventBusService);
}
