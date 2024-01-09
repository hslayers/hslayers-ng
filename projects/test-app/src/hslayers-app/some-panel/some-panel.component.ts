import {Component} from '@angular/core';

import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-some-panel',
  templateUrl: './some-panel.component.html',
})
export class SomeComponent extends HsPanelBaseComponent {
  name = 'custom';

  constructor(public hsLayoutService: HsLayoutService) {
    super(hsLayoutService);
  }
}
