import {Component} from '@angular/core';
import {of} from 'rxjs';

import {AsyncPipe} from '@angular/common';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-measure-toolbar',
  standalone: true,
  template: `
    <div class="nav-item" [hidden]="(isVisible$ | async) === false">
      <button
        class="btn hs-toolbar-button btn-light text-secondary"
        [title]="'TOOLBAR.measureLinesAndPolygon' | translateHs"
        (click)="measureButtonClicked()"
      >
        <i class="icon-design"></i>
      </button>
    </div>
  `,
  imports: [TranslateCustomPipe, AsyncPipe],
})
export class HsMeasureToolbarComponent extends HsGuiOverlayBaseComponent {
  constructor() {
    super();
  }
  name = 'measureToolbar';

  measureButtonClicked(): void {
    this.hsLayoutService.setMainPanel('measure', true);
  }

  /**
   * Override parent class componentEnabled. Used to determine isVisible$ value
   */
  componentEnabled() {
    return of(
      this.hsLayoutService.panelEnabled('measure') &&
        this.hsLayoutService.componentEnabled(this.name) &&
        this.hsLayoutService.componentEnabled('guiOverlay'),
    );
  }
}
