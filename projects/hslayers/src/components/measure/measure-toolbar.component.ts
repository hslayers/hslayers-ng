import {Component} from '@angular/core';
import {of} from 'rxjs';

import {HsGuiOverlayBaseComponent} from '../layout/panels/gui-overlay-base.component';
import {HsLayoutService} from '../layout/layout.service';

@Component({
  selector: 'hs-measure-toolbar',
  templateUrl: './measure-toolbar.component.html',
})
export class HsMeasureToolbarComponent extends HsGuiOverlayBaseComponent {
  constructor(public hsLayoutService: HsLayoutService) {
    super(hsLayoutService);
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
