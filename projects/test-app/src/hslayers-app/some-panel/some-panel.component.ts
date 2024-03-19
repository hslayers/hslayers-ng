import {Component} from '@angular/core';

import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-some-panel',
  templateUrl: './some-panel.component.html',
})
export class SomeComponent extends HsPanelBaseComponent {
  name = 'custom';

  constructor() {
    super();
  }
}
