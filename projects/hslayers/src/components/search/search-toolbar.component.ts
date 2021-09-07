import {Component} from '@angular/core';

import {HsLayoutService} from '../layout/layout.service';
import {HsToolbarPanelBaseComponent} from '../toolbar/toolbar-panel-base.component';

@Component({
  selector: 'hs-search-toolbar',
  templateUrl: './partials/search-toolbar.html',
})
export class HsSearchToolbarComponent extends HsToolbarPanelBaseComponent {
  constructor(public HsLayoutService: HsLayoutService) {
    super(HsLayoutService);
  }
  name = 'searchToolbar';
}
