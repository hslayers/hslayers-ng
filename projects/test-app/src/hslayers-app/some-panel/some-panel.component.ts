import {Component, OnInit, ViewRef} from '@angular/core';

import {HsLayoutService} from 'hslayers-ng/src/components/layout/layout.service';
import {HsPanelBaseComponent} from 'hslayers-ng/src/components/layout/panels/panel-base.component';

@Component({
  selector: 'hs-some-panel',
  templateUrl: './some-panel.component.html',
})
export class SomeComponent extends HsPanelBaseComponent implements OnInit {
  name = 'custom';

  constructor(public hsLayoutService: HsLayoutService) {
    super(hsLayoutService);
  }

  ngOnInit(): void {
    null;
  }
}
