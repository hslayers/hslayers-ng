import {Component} from '@angular/core';

import {HsLayoutService} from 'hslayers-ng/components/layout/layout.service';
import {HsPanelBaseComponent} from 'hslayers-ng/components/layout/panels/panel-base.component';

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
