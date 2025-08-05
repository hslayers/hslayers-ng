import {AsyncPipe} from '@angular/common';
import {Component} from '@angular/core';
import {of} from 'rxjs';
import {TranslatePipe} from '@ngx-translate/core';

import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-measure-toolbar',
  template: `
    <div class="nav-item" [hidden]="(isVisible$ | async) === false">
      <button
        class="btn hs-toolbar-button btn-light text-secondary"
        [title]="'TOOLBAR.measureLinesAndPolygon' | translate"
        (click)="measureButtonClicked()"
      >
        <i class="fa-solid fa-ruler"></i>
      </button>
    </div>
  `,
  imports: [TranslatePipe, AsyncPipe],
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
