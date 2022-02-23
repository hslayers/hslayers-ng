import {Component} from '@angular/core';

import {HsLayoutService} from '../layout/layout.service';
import {HsToolbarPanelBaseComponent} from '../toolbar/toolbar-panel-base.component';

@Component({
  selector: 'hs-measure-toolbar',
  templateUrl: './partials/measure-toolbar.html',
})
export class HsMeasureToolbarComponent extends HsToolbarPanelBaseComponent {
  constructor(public HsLayoutService: HsLayoutService) {
    super(HsLayoutService);
  }
  name = 'measureToolbar';
  isVisible(): boolean {
    return (
      this.HsLayoutService.panelEnabled('measure', this.data.app) &&
      this.HsLayoutService.componentEnabled('measureToolbar', this.data.app)
    );
  }

  measureButtonClicked(): void {
    this.HsLayoutService.setMainPanel('measure', this.data.app, true);
  }
}
