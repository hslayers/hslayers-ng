import {Component} from '@angular/core';

import {HsLayoutService} from '../layout/layout.service';
import {HsToolbarPanelBaseComponent} from '../toolbar/toolbar-panel-base.component';

@Component({
  selector: 'hs-search-toolbar',
  templateUrl: './search-toolbar.component.html',
})
export class HsSearchToolbarComponent extends HsToolbarPanelBaseComponent {
  constructor(public hsLayoutService: HsLayoutService) {
    super(hsLayoutService);
  }
  name = 'searchToolbar';
}
