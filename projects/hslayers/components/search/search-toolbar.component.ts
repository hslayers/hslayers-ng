import {Component} from '@angular/core';

import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsLayoutService} from 'hslayers-ng/shared/layout';

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
