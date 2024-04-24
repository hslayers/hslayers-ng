import {Component, OnInit} from '@angular/core';

import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-some-panel',
  templateUrl: './some-panel.component.html',
})
export class SomeComponent extends HsPanelBaseComponent implements OnInit {
  /* The name is very important, as it is used to manage panel's visibility */
  name = 'custom';

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
  }
}
