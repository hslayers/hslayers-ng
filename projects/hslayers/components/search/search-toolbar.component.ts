import {Component} from '@angular/core';

import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-search-toolbar',
  templateUrl: './search-toolbar.component.html',
})
export class HsSearchToolbarComponent extends HsGuiOverlayBaseComponent {
  constructor() {
    super();
  }
  name = 'searchToolbar';
}
