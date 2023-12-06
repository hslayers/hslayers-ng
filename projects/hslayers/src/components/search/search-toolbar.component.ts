import {Component} from '@angular/core';

import {HsGuiOverlayBaseComponent} from '../layout/panels/gui-overlay-base.component';
import {HsLayoutService} from '../layout/layout.service';

@Component({
  selector: 'hs-search-toolbar',
  templateUrl: './search-toolbar.component.html',
})
export class HsSearchToolbarComponent extends HsGuiOverlayBaseComponent {
  constructor(public hsLayoutService: HsLayoutService) {
    super(hsLayoutService);
  }
  name = 'searchToolbar';
}
