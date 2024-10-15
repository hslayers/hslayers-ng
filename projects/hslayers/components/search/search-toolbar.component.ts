import {AsyncPipe} from '@angular/common';
import {Component} from '@angular/core';

import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchResultsComponent} from './search-results.component';

@Component({
  selector: 'hs-search-toolbar',
  template: `
    <div class="nav-item" [hidden]="(isVisible$ | async) === false">
      <div>
        <hs-search-input></hs-search-input>
        <hs-search-results></hs-search-results>
      </div>
    </div>
  `,
  standalone: true,
  imports: [HsSearchInputComponent, HsSearchResultsComponent, AsyncPipe],
})
export class HsSearchToolbarComponent extends HsGuiOverlayBaseComponent {
  constructor() {
    super();
  }
  name = 'searchToolbar';
}
